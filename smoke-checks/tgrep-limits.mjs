import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { queryTgrep } from "../.opencode/lib/tgrep-query.ts";

test("el CLI real limita globalmente coincidencias y contexto y acota el output Unicode", async (t) => {
  const worktree = mkdtempSync(join(tmpdir(), "profile-site-tgrep-limits with spaces-"));
  t.after(() => rmSync(worktree, { recursive: true, force: true }));
  const git = spawnSync("git", ["init", worktree], { encoding: "utf8", timeout: 5_000 });
  assert.equal(git.status, 0, git.stderr);
  writeFileSync(join(worktree, ".gitignore"), ".tgrep/\n");
  for (const file of ["a.txt", "b.txt"]) {
    writeFileSync(join(worktree, file), "antes\nLimitNeedle71 LimitNeedle71 😀\ndespués\n".repeat(100));
  }
  const result = await queryTgrep({ pattern: "LimitNeedle71", freshness: "current", context_lines: 1, max_results: 4 }, { worktree });
  assert.equal(result.metadata.record_count, 4);
  assert.equal(result.metadata.truncation_reason, "max_results");
  assert.match(result.output, /Truncado: sí[\s\S]*estrecha/);
  assert.match(result.output, /\[contexto\]/);
  assert.match(result.output, /\[coincidencia\]/);
  assert.ok(Buffer.byteLength(result.output) <= 48_000);
  writeFileSync(join(worktree, "large.txt"), ("BytesNeedle71 " + "😀".repeat(500) + "\n").repeat(100));
  const bytes = await queryTgrep({ pattern: "BytesNeedle71", freshness: "current", max_results: 1000 }, { worktree });
  assert.equal(bytes.metadata.truncation_reason, "output_bytes");
  assert.ok(Buffer.byteLength(bytes.output) <= 48_000);
  assert.doesNotMatch(bytes.output, /�/);
});
