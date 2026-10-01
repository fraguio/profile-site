import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { queryTgrep } from "../.opencode/lib/tgrep-query.ts";
import { ensureTgrepService } from "../.opencode/lib/tgrep-service.ts";
import { cleanServiceFixture, fixtureDaemonPid, stopFixtureDaemon } from "../test-support/tgrep-service-fixture.mjs";

test("tgrep real asegura, comparte y recupera el daemon conservando el índice local", { timeout: 30_000 }, async (t) => {
  const worktree = mkdtempSync(join(tmpdir(), "profile-site-tgrep-service-real with spaces-"));
  t.after(() => cleanServiceFixture(worktree));
  assert.equal(spawnSync("git", ["init", worktree], { timeout: 5_000 }).status, 0);
  writeFileSync(join(worktree, ".gitignore"), ".tgrep/\n");
  writeFileSync(join(worktree, "sample.txt"), "ServiceNeedle73\n");
  const current = await queryTgrep({ pattern: "ServiceNeedle73", freshness: "current" }, { worktree });
  assert.equal(current.metadata.search_mode, "current_scan");
  assert.equal(fixtureDaemonPid(worktree), undefined);
  const indexed = spawnSync("tgrep", ["index", worktree], { timeout: 15_000, encoding: "utf8" });
  assert.equal(indexed.status, 0, indexed.stderr);
  const sentinel = join(worktree, ".tgrep", "fixture-sentinel");
  writeFileSync(sentinel, "índice local existente");
  const logs = [];
  const [warm, first, second] = await Promise.all([
    ensureTgrepService(worktree, undefined, undefined, (level, message) => logs.push({ level, message })),
    queryTgrep({ pattern: "ServiceNeedle73" }, { worktree }),
    queryTgrep({ pattern: "ServiceNeedle73" }, { worktree }),
  ]);
  assert.equal(warm.available, true);
  for (const result of [first, second]) {
    assert.equal(result.metadata.search_mode, "indexed_or_scan");
    assert.match(result.output, /sample\.txt:1:ServiceNeedle73/);
  }
  assert.equal(readFileSync(sentinel, "utf8"), "índice local existente");
  assert.ok(existsSync(join(worktree, ".tgrep", "index.bin")));
  assert.match(logs[0].message, /Intento|disponible/);
  assert.match(logs.at(-1).message, /disponible/);
  const pid = fixtureDaemonPid(worktree);
  assert.ok(pid);
  await queryTgrep({ pattern: "ServiceNeedle73" }, { worktree });
  assert.equal(fixtureDaemonPid(worktree), pid);
  await stopFixtureDaemon(worktree);
  const recovered = await queryTgrep({ pattern: "ServiceNeedle73" }, { worktree });
  assert.equal(recovered.metadata.search_mode, "indexed_or_scan");
  assert.match(recovered.output, /sample\.txt:1:ServiceNeedle73/);
  assert.notEqual(fixtureDaemonPid(worktree), pid);
  process.kill(fixtureDaemonPid(worktree), 0);
  assert.equal(readFileSync(sentinel, "utf8"), "índice local existente");
});
