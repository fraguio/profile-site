import assert from "node:assert/strict";
import { execFile, spawn, spawnSync } from "node:child_process";
import { closeSync, copyFileSync, mkdtempSync, openSync, rmSync, writeFileSync, writeSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { promisify } from "node:util";
import { setTimeout as delay } from "node:timers/promises";
import test from "node:test";
import { queryTgrep } from "../.opencode/lib/tgrep-query.ts";

const exec = promisify(execFile);

test("Windows recoge el cliente real al cancelar y conserva el daemon compartido", { skip: process.platform !== "win32", timeout: 60_000 }, async (t) => {
  const worktree = mkdtempSync(join(tmpdir(), "profile-site-tgrep-cancel-real-"));
  const abort = new AbortController();
  let daemon;
  t.after(async () => {
    abort.abort();
    if (daemon && daemon.exitCode === null) {
      const closed = new Promise((resolve) => daemon.once("close", resolve));
      daemon.kill();
      await closed;
    }
    rmSync(worktree, { recursive: true, force: true });
  });
  assert.equal(spawnSync("git", ["init", worktree], { timeout: 5000 }).status, 0);
  writeFileSync(join(worktree, ".gitignore"), ".tgrep/\n*.exe\nslow.txt\n");
  writeFileSync(join(worktree, "sample.txt"), "ServiceNeedle72\n");
  daemon = spawn("tgrep", ["serve", worktree], { cwd: worktree, stdio: "ignore", windowsHide: true });
  daemon.on("error", (error) => { throw error; });
  let available = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    const status = spawnSync("tgrep", ["status", worktree], { encoding: "utf8", timeout: 5000 });
    if (status.status === 0 && status.stdout.includes("Server status")) { available = true; break; }
    await delay(100);
  }
  assert.ok(available);

  // Copia con nombre exclusivo para observar únicamente el cliente propiedad del fixture.
  const located = spawnSync("where.exe", ["tgrep"], { encoding: "utf8", timeout: 5000 });
  assert.equal(located.status, 0, located.stderr);
  const executable = join(worktree, `${basename(worktree)}.exe`);
  copyFileSync(located.stdout.trim().split(/\r?\n/)[0], executable);
  const file = openSync(join(worktree, "slow.txt"), "w");
  try {
    const chunk = Buffer.from(("a".repeat(1023) + "\n").repeat(1024));
    for (let index = 0; index < 512; index++) writeSync(file, chunk);
  } finally { closeSync(file); }
  const processes = async () => (await exec("tasklist", ["/FI", `IMAGENAME eq ${basename(executable)}`, "/FO", "CSV", "/NH"], { timeout: 5000 })).stdout;
  const query = queryTgrep({ pattern: "a.*MissingNeedle72", path: "slow.txt", freshness: "current" }, { worktree, abort: abort.signal }, { executable });
  const rejected = assert.rejects(query, /Consulta tgrep cancelada/);
  let launched = false;
  for (let attempt = 0; attempt < 20; attempt++) {
    if ((await processes()).includes(basename(executable))) { launched = true; break; }
    await delay(10);
  }
  assert.ok(launched, "La cancelación debe ocurrir después de observar el cliente real.");
  abort.abort();
  await rejected;
  assert.ok(!(await processes()).includes(basename(executable)), "El cliente ya no existe al devolver la cancelación.");
  assert.equal(daemon.exitCode, null);
  const status = spawnSync("tgrep", ["status", worktree], { encoding: "utf8", timeout: 5000 });
  assert.equal(status.status, 0, status.stderr);
  assert.match(status.stdout, /Server status/);
  const result = await queryTgrep({ pattern: "ServiceNeedle72" }, { worktree });
  assert.match(result.output, /sample\.txt:1:ServiceNeedle72/);
});
