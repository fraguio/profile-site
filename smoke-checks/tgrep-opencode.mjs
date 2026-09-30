import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const model = process.env.OPENCODE_SMOKE_MODEL ?? "openai/gpt-6.1-sol";

async function stop(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  const closed = new Promise((resolve) => child.once("close", resolve));
  if (process.platform === "win32") {
    const result = spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], { encoding: "utf8", timeout: 10_000 });
    assert.equal(result.status, 0, result.stderr);
  } else {
    assert.ok(child.kill());
  }
  let timer;
  try {
    await Promise.race([closed, new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error("El proceso no terminó durante el cleanup.")), 10_000);
    })]);
  } finally {
    clearTimeout(timer);
  }
}

test("OpenCode recién iniciado descubre únicamente la tool tgrep y ejecuta consultas reales", { timeout: 180_000 }, async (t) => {
  const worktree = mkdtempSync(join(tmpdir(), "profile-site-opencode-smoke-"));
  let daemon;
  let server;
  t.after(async () => {
    try {
      await stop(server);
    } finally {
      try {
        await stop(daemon);
      } finally {
        rmSync(worktree, { recursive: true, force: true });
      }
    }
  });
  const git = spawnSync("git", ["init", worktree], { encoding: "utf8" });
  assert.equal(git.status, 0, git.stderr);
  for (const directory of ["lib", "tools", "plugins"]) {
    mkdirSync(join(worktree, ".opencode", directory), { recursive: true });
  }
  for (const path of ["lib/tgrep-query.ts", "tools/tgrep.ts", "plugins/tgrep-server.ts"]) {
    copyFileSync(join(projectRoot, ".opencode", path), join(worktree, ".opencode", path));
  }
  symlinkSync(join(projectRoot, ".opencode", "node_modules"), join(worktree, ".opencode", "node_modules"), "junction");
  writeFileSync(join(worktree, ".gitignore"), ".opencode/\n.tgrep/\n");
  writeFileSync(join(worktree, "sample.txt"), "AlphaNeedle\nalphaNeedle\n");

  // El fixture es propietario del daemon; el plugin lo reutiliza y el cleanup lo recoge.
  daemon = spawn("tgrep", ["serve", worktree], { cwd: worktree, stdio: "ignore", windowsHide: true });
  let daemonError;
  daemon.on("error", (error) => { daemonError = error });
  let available = false;
  const daemonDeadline = Date.now() + 15_000;
  while (Date.now() < daemonDeadline) {
    t.signal.throwIfAborted();
    if (daemonError) throw daemonError;
    const status = spawnSync("tgrep", ["status", worktree], { encoding: "utf8", timeout: Math.max(1, Math.min(5_000, daemonDeadline - Date.now())) });
    if (status.status === 0 && status.stdout.includes("Server status")) {
      available = true;
      break;
    }
    await delay(100, undefined, { signal: t.signal });
  }
  assert.ok(available, "El daemon del fixture debe estar disponible antes de iniciar OpenCode.");
  t.signal.throwIfAborted();

  let serverOutput = "";
  let serverError;
  server = spawn("opencode", ["serve", "--port", "0", "--hostname", "127.0.0.1"], {
    cwd: worktree, stdio: ["ignore", "pipe", "pipe"], windowsHide: true,
  });
  server.on("error", (error) => { serverError = error });
  server.stdout.setEncoding("utf8").on("data", (chunk) => { serverOutput += chunk });
  server.stderr.setEncoding("utf8").on("data", (chunk) => { serverOutput += chunk });
  let url;
  for (let attempt = 0; attempt < 200; attempt++) {
    t.signal.throwIfAborted();
    if (serverError) throw serverError;
    url = serverOutput.match(/http:\/\/127\.0\.0\.1:\d+/)?.[0];
    if (url) break;
    await delay(100, undefined, { signal: t.signal });
  }
  assert.ok(url, serverOutput);
  const get = async (path) => {
    const response = await fetch(`${url}${path}`, { signal: AbortSignal.any([t.signal, AbortSignal.timeout(30_000)]) });
    assert.ok(response.ok, await response.clone().text());
    return response.json();
  };
  const directory = `directory=${encodeURIComponent(worktree)}`;
  const ids = await get(`/experimental/tool/ids?${directory}`);
  assert.deepEqual(ids.filter((id) => id.startsWith("tgrep")), ["tgrep"]);
  assert.ok(!ids.includes("queryTgrep"));
  const [provider, ...modelParts] = model.split("/");
  const tools = await get(`/experimental/tool?${directory}&provider=${encodeURIComponent(provider)}&model=${encodeURIComponent(modelParts.join("/"))}`);
  const tool = tools.find((item) => item.id === "tgrep");
  assert.ok(tool);
  assert.deepEqual(Object.keys(tool.parameters.properties), ["pattern"]);
  assert.equal(tool.parameters.properties.pattern.type, "string");

  t.signal.throwIfAborted();
  const run = spawnSync("opencode", ["run", "--attach", url, "--dir", worktree, "--model", model, "--format", "json",
    'Verificación de la tool: ejecuta exactamente tres consultas con tgrep, con los patrones "AlphaN(eedle)", "MissingNeedle68" y "[". No uses ninguna otra tool. No modifiques archivos. Resume las respuestas y distingue la ausencia de coincidencias del error de regex.',
  ], { cwd: worktree, encoding: "utf8", timeout: 120_000, maxBuffer: 8 * 1024 * 1024 });
  assert.equal(run.status, 0, `${run.stdout}\n${run.stderr}`);
  const events = run.stdout.split(/\r?\n/).filter((line) => line.startsWith("{")).map((line) => JSON.parse(line));
  const calls = events.filter((event) => event.type === "tool_use" && event.part?.tool === "tgrep").map((event) => event.part.state);
  const matches = calls.find((call) => call.input.pattern === "AlphaN(eedle)");
  const empty = calls.find((call) => call.input.pattern === "MissingNeedle68");
  const invalid = calls.find((call) => call.input.pattern === "[");
  assert.ok(matches && empty && invalid, run.stdout);
  assert.equal(matches.status, "completed");
  assert.match(matches.output, /sample\.txt:1:AlphaNeedle/);
  assert.doesNotMatch(matches.output, /sample\.txt:2:/);
  assert.equal(empty.status, "completed");
  assert.match(empty.output, /No se encontraron coincidencias/);
  assert.equal(invalid.status, "error");
  assert.match(invalid.error, /tgrep.*código 2[\s\S]*regex/i);
  assert.equal(daemon.exitCode, null, "El servicio compartido sigue disponible tras las consultas.");
});
