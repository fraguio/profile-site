import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { queryTgrep } from "../.opencode/lib/tgrep-query.ts";

test("tgrep real conserva regex, mayúsculas, números de línea y argumentos en Windows", async (t) => {
  const worktree = mkdtempSync(join(tmpdir(), "profile-site-tgrep-smoke with spaces-"));
  t.after(() => rmSync(worktree, { recursive: true, force: true }));
  writeFileSync(join(worktree, "sample.txt"), "AlphaNeedle\nalphaNeedle\ntwo words\n\"double\" and 'single'\n-n\n--help\nserve\nsearch\nstatus\nindex\nhelp\n");
  const query = (pattern) => queryTgrep({ pattern }, { worktree }).then((result) => result.output);

  const matches = await query("AlphaN(eedle)");
  assert.match(matches, /sample\.txt:1:AlphaNeedle/);
  assert.doesNotMatch(matches, /sample\.txt:2:/);
  assert.match(await query("MissingNeedle68"), /No se encontraron coincidencias/);
  await assert.rejects(query("["), /tgrep.*código 2[\s\S]*regex/i);

  for (const [pattern, line] of [["two words", 3], ['"double" and \'single\'', 4], ["-n", 5], ["--help", 6], ["serve", 7], ["search", 8], ["status", 9], ["index", 10], ["help", 11]]) {
    assert.ok((await query(pattern)).includes(`sample.txt:${line}:${pattern}`));
  }
});
