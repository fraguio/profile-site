import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { queryTgrep } from "../.opencode/lib/tgrep-query.ts";

function fixture(t) {
  const worktree = mkdtempSync(join(tmpdir(), "profile-site-tgrep-filters with spaces-"));
  t.after(() => rmSync(worktree, { recursive: true, force: true }));
  const git = spawnSync("git", ["init", worktree], { encoding: "utf8", timeout: 5_000 });
  assert.equal(git.status, 0, git.stderr);
  mkdirSync(join(worktree, "src with spaces"));
  mkdirSync(join(worktree, ".config"));
  const files = {
    ".gitignore": ".tgrep/\nignored.txt\n.config/ignored.txt\n",
    "src with spaces/sample.ts": "Alpha.Needle\nAlphaXNeedle\nalpha.needle\nFilterNeedle\n",
    "src with spaces/skip.ts": "FilterNeedle\n",
    "src with spaces/sample.py": "FilterNeedle\n",
    "outside.txt": "FilterNeedle\n",
    ".hidden.txt": "FilterNeedle\n",
    ".config/settings.txt": "FilterNeedle\n",
    ".config/ignored.txt": "FilterNeedle\n",
    "ignored.txt": "FilterNeedle\n",
  };
  for (const [path, text] of Object.entries(files)) writeFileSync(join(worktree, path), text);
  return worktree;
}

test("tgrep real diferencia texto literal, regex y mayúsculas en un archivo con espacios", async (t) => {
  const worktree = fixture(t);
  const query = (args) => queryTgrep({ pattern: "Alpha.Needle", path: "src with spaces/sample.ts", ...args }, { worktree });

  const regex = await query({});
  assert.match(regex, /sample\.ts:1:Alpha\.Needle/);
  assert.match(regex, /sample\.ts:2:AlphaXNeedle/);
  assert.doesNotMatch(regex, /sample\.ts:3:/);
  const literal = await query({ literal: true });
  assert.match(literal, /sample\.ts:1:Alpha\.Needle/);
  assert.doesNotMatch(literal, /sample\.ts:[23]:/);
  const insensitive = await query({ literal: true, ignore_case: true });
  assert.match(insensitive, /sample\.ts:1:Alpha\.Needle/);
  assert.match(insensitive, /sample\.ts:3:alpha\.needle/);
  assert.doesNotMatch(insensitive, /sample\.ts:2:/);
  assert.equal(await query({ literal: false, ignore_case: false, hidden: false, glob: [], file_types: [] }), regex);
});

test("tgrep real aplica globs de inclusión y exclusión dentro del directorio seleccionado", async (t) => {
  const worktree = fixture(t);
  const query = (args) => queryTgrep({ pattern: "FilterNeedle", path: "src with spaces", ...args }, { worktree });
  const result = await query({ glob: ["*.ts", "!skip.ts"] });
  assert.match(result, /sample\.ts:4:FilterNeedle/);
  assert.doesNotMatch(result, /(?:skip\.ts|sample\.py|outside\.txt):/);
  await assert.rejects(query({ glob: ["["] }), /tgrep.*código 2[\s\S]*(?:glob|unclosed)/i);
  assert.match(await query({ glob: ["--help"] }), /No se encontraron coincidencias/);
});

test("tgrep real filtra por tipos y conserva los diagnósticos de tipos desconocidos", async (t) => {
  const worktree = fixture(t);
  const query = (args) => queryTgrep({ pattern: "FilterNeedle", ...args }, { worktree });
  const result = await query({ file_types: ["ts", "py"], glob: ["!skip.ts"] });
  assert.match(result, /sample\.ts:4:FilterNeedle/);
  assert.match(result, /sample\.py:1:FilterNeedle/);
  assert.doesNotMatch(result, /(?:skip\.ts|outside\.txt):/);
  await assert.rejects(query({ file_types: ["unknown_type_69"] }), /tgrep.*código 2[\s\S]*unknown_type_69/i);
  await assert.rejects(query({ file_types: ["--help"] }), /tgrep.*código 2[\s\S]*--help/i);
});

test("tgrep real incluye ocultos sin desactivar las ignore rules y respeta ámbitos explícitos", async (t) => {
  const worktree = fixture(t);
  const query = (args) => queryTgrep({ pattern: "FilterNeedle", ...args }, { worktree });
  assert.doesNotMatch(await query({}), /(?:\.hidden\.txt|settings\.txt|ignored\.txt):/);
  const result = await query({ hidden: true });
  assert.match(result, /\.hidden\.txt:1:FilterNeedle/);
  assert.match(result, /settings\.txt:1:FilterNeedle/);
  assert.doesNotMatch(result, /ignored\.txt:/);
  assert.match(await query({ path: ".hidden.txt" }), /\.hidden\.txt:1:FilterNeedle/);
  assert.match(await query({ path: "ignored.txt" }), /ignored\.txt:1:FilterNeedle/);
});

test("los filtros sobre el corpus indexado no reincorporan archivos ignorados y un scan admite overrides", async (t) => {
  const worktree = fixture(t);
  const index = spawnSync("tgrep", ["index", "--hidden", worktree], { encoding: "utf8", timeout: 15_000 });
  assert.equal(index.status, 0, `${index.stdout}\n${index.stderr}`);
  const query = (args, command) => queryTgrep({ pattern: "FilterNeedle", ...args }, { worktree }, command);

  const typed = await query({ file_types: ["ts", "py"], glob: ["!skip.ts"] });
  assert.match(typed, /sample\.ts:4:FilterNeedle/);
  assert.match(typed, /sample\.py:1:FilterNeedle/);
  assert.doesNotMatch(typed, /(?:skip\.ts|outside\.txt):/);
  assert.doesNotMatch(await query({}), /(?:\.hidden\.txt|settings\.txt|ignored\.txt):/);
  const hidden = await query({ hidden: true });
  assert.match(hidden, /\.hidden\.txt:1:FilterNeedle/);
  assert.match(hidden, /settings\.txt:1:FilterNeedle/);
  assert.doesNotMatch(hidden, /ignored\.txt:/);
  assert.match(await query({ glob: ["ignored.txt"] }), /No se encontraron coincidencias/);
  // Se fuerza el scan solo en el fixture del CLI; freshness corresponde a #70.
  assert.match(await query({ glob: ["ignored.txt"] }, { executable: "tgrep", args: ["--no-index"] }), /ignored\.txt:1:FilterNeedle/);
  assert.match(await query({ pattern: "Alpha.Needle", literal: true, ignore_case: true }), /sample\.ts:3:alpha\.needle/);
  await assert.rejects(query({ glob: ["["] }), /tgrep.*código 2[\s\S]*(?:glob|unclosed)/i);
  await assert.rejects(query({ file_types: ["unknown_type_69"] }), /tgrep.*código 2[\s\S]*unknown_type_69/i);
});

test("el scan de directorio no sigue junctions y el ámbito explícito rechaza un destino externo", async (t) => {
  const worktree = fixture(t);
  const outside = mkdtempSync(join(tmpdir(), "profile-site-tgrep-outside-"));
  t.after(() => rmSync(outside, { recursive: true, force: true }));
  writeFileSync(join(outside, "external.txt"), "ExternalNeedle69\n");
  symlinkSync(outside, join(worktree, "escape"), "junction");
  assert.match(await queryTgrep({ pattern: "ExternalNeedle69" }, { worktree }), /No se encontraron coincidencias/);
  await assert.rejects(queryTgrep({ pattern: "ExternalNeedle69", path: "escape/external.txt" }, { worktree }), /ámbito.*fuera del worktree/i);
});
