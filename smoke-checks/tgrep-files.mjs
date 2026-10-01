import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { queryTgrep } from "../.opencode/lib/tgrep-query.ts";
import { cleanServiceFixture, fixtureDaemonPid, stopFixtureDaemon } from "../test-support/tgrep-service-fixture.mjs";

function paths(result) {
  assert.equal(result.metadata.output_mode, "files");
  const rows = result.output.split("\n").filter((line) => line.startsWith('"')).map((line) => JSON.parse(line));
  assert.equal(rows.length, result.metadata.record_count);
  return rows.sort();
}

test("files con tgrep real conserva filtros, límites, freshness y el daemon en Windows", { timeout: 60_000 }, async (t) => {
  const worktree = mkdtempSync(join(tmpdir(), "profile-site-tgrep-files-real with spaces-"));
  t.after(() => cleanServiceFixture(worktree));
  assert.equal(spawnSync("git", ["init", worktree], { timeout: 5000 }).status, 0);
  writeFileSync(join(worktree, ".gitignore"), ".tgrep/\nignored.ts\n.config/ignored.json\n");
  mkdirSync(join(worktree, "src with spaces"));
  mkdirSync(join(worktree, ".config"));
  writeFileSync(join(worktree, "many.ts"), "File.Needle82\n".repeat(200));
  writeFileSync(join(worktree, "src with spaces", "café 😀.ts"), "file.needle82\nFileXNeedle82\n");
  writeFileSync(join(worktree, "src with spaces", "excluded.ts"), "File.Needle82\n");
  writeFileSync(join(worktree, "ignored.ts"), "File.Needle82\n");
  writeFileSync(join(worktree, "plain.txt"), "File.Needle82\n");
  writeFileSync(join(worktree, ".config", "settings.json"), '{"value":"HiddenNeedle82"}\n');
  writeFileSync(join(worktree, ".config", "ignored.json"), '{"value":"HiddenNeedle82"}\n');
  writeFileSync(join(worktree, "edited.ts"), "OldNeedle82\n");
  const run = (args = {}, context = {}) => queryTgrep({ pattern: "File.Needle82", output_mode: "files", freshness: "current", ...args }, { worktree, ...context });
  const scan = await run({ literal: true, ignore_case: true });
  assert.deepEqual(paths(scan), ["many.ts", "plain.txt", "src with spaces/café 😀.ts", "src with spaces/excluded.ts"]);
  assert.equal(scan.metadata.search_mode, "current_scan");
  assert.equal(fixtureDaemonPid(worktree), undefined, "current no arranca el servicio.");
  assert.deepEqual(paths(await run({ literal: true })), ["many.ts", "plain.txt", "src with spaces/excluded.ts"]);
  assert.deepEqual(paths(await run({ pattern: "File.N(eedle82)" })), ["many.ts", "plain.txt", "src with spaces/café 😀.ts", "src with spaces/excluded.ts"]);
  assert.deepEqual(paths(await run({ literal: true, ignore_case: true, glob: ["*.ts", "!excluded.ts"], file_types: ["ts"] })), ["ignored.ts", "many.ts", "src with spaces/café 😀.ts"]);
  const filtered = { literal: true, ignore_case: true, glob: ["*.ts", "!excluded.ts", "!ignored.ts"], file_types: ["ts"] };
  assert.deepEqual(paths(await run(filtered)), ["many.ts", "src with spaces/café 😀.ts"]);
  assert.deepEqual(paths(await run({ ...filtered, path: "src with spaces" })), ["src with spaces/café 😀.ts"]);
  assert.deepEqual(paths(await run({ ...filtered, path: join(worktree, "src with spaces", "café 😀.ts") })), ["src with spaces/café 😀.ts"]);
  assert.deepEqual(paths(await run({ pattern: "HiddenNeedle82" })), []);
  assert.deepEqual(paths(await run({ pattern: "HiddenNeedle82", hidden: true, file_types: ["json"] })), [".config/settings.json"]);
  assert.deepEqual(paths(await run({ pattern: "HiddenNeedle82", hidden: true, glob: ["*.json", "!ignored.json"] })), [".config/settings.json"]);
  for (const [max_results, count, truncated] of [[1, 1, true], [2, 2, false], [3, 2, false]]) {
    const result = await run({ ...filtered, max_results, context_lines: 10 });
    assert.equal(paths(result).length, count);
    assert.equal(result.metadata.truncated, truncated);
    if (truncated) assert.equal(result.metadata.truncation_reason, "max_results");
    assert.ok(Buffer.byteLength(result.output) <= 48000);
  }
  const special = '-serve "café" [x]';
  writeFileSync(join(worktree, "special.txt"), special + "\n");
  assert.deepEqual(paths(await run({ pattern: special, literal: true })), ["special.txt"]);
  await assert.rejects(run({ pattern: "[" }), /código 2[\s\S]*regex/i);
  assert.deepEqual(paths(await run({ pattern: "MissingNeedle82" })), []);

  const index = spawnSync("tgrep", ["index", worktree], { encoding: "utf8", timeout: 15000 });
  assert.equal(index.status, 0, index.stderr);
  writeFileSync(join(worktree, "edited.ts"), "CurrentNeedle82\n");
  assert.deepEqual(paths(await run({ pattern: "CurrentNeedle82" })), ["edited.ts"]);
  assert.deepEqual(paths(await run({ pattern: "OldNeedle82" })), []);
  const indexed = await run({ ...filtered, freshness: "indexed" });
  assert.deepEqual(paths(indexed), ["many.ts", "src with spaces/café 😀.ts"]);
  assert.equal(indexed.metadata.search_mode, "indexed_or_scan");
  const pid = fixtureDaemonPid(worktree);
  assert.ok(pid);
  await run({ ...filtered, freshness: "indexed", max_results: 1 });
  assert.equal(fixtureDaemonPid(worktree), pid);
  process.kill(pid, 0);
  await assert.rejects(run({ pattern: "[", freshness: "indexed" }), /código 2[\s\S]*regex/i);
  process.kill(pid, 0);
  await stopFixtureDaemon(worktree);
  const recovered = await run({ ...filtered, freshness: "indexed" });
  assert.deepEqual(paths(recovered), ["many.ts", "src with spaces/café 😀.ts"]);
  assert.notEqual(fixtureDaemonPid(worktree), pid);
  process.kill(fixtureDaemonPid(worktree), 0);
});
