import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { queryTgrep } from "../.opencode/lib/tgrep-query.ts";

function query(t, script, pattern = "needle") {
  const worktree = mkdtempSync(join(tmpdir(), "profile-site-tgrep-"));
  t.after(() => rmSync(worktree, { recursive: true, force: true }));
  return queryTgrep({ pattern }, { worktree }, {
    executable: process.execPath,
    args: ["--input-type=module", "-e", script, "--"],
  });
}

test("una consulta con coincidencias devuelve las rutas, líneas y contenido del CLI", async (t) => {
  const result = await query(t, 'process.stdout.write("src/example.ts:2:  needle\\n")');

  assert.equal(result, "src/example.ts:2:  needle\n");
});

test("una consulta sin coincidencias es válida y comunica la ausencia de resultados", async (t) => {
  const result = await query(t, "process.exitCode = 1");

  assert.match(result, /No se encontraron coincidencias/);
});

test("un fallo del CLI conserva el código de salida y el diagnóstico de stderr", async (t) => {
  await assert.rejects(
    query(t, 'process.stderr.write("regex inválida: falta ]\\n"); process.exitCode = 2'),
    /tgrep.*código 2[\s\S]*regex inválida: falta \]/,
  );
});

test("stderr acompaña como advertencia las consultas válidas con y sin coincidencias", async (t) => {
  for (const code of [0, 1]) {
    const result = await query(t, `
      process.stdout.write(${JSON.stringify(code === 0 ? "example.ts:1:needle\n" : "")});
      process.stderr.write("archivo omitido: acceso denegado\\n");
      process.exitCode = ${code};
    `);

    assert.match(result, code === 0 ? /example.ts:1:needle/ : /No se encontraron coincidencias/);
    assert.match(result, /Advertencias de tgrep:[\s\S]*archivo omitido: acceso denegado/);
  }
});

test("un ejecutable ausente produce un diagnóstico de lanzamiento, no ausencia de coincidencias", async (t) => {
  const worktree = mkdtempSync(join(tmpdir(), "profile-site-tgrep-missing-"));
  t.after(() => rmSync(worktree, { recursive: true, force: true }));

  await assert.rejects(
    queryTgrep({ pattern: "needle" }, { worktree }, { executable: join(worktree, "missing-tgrep.exe") }),
    /No se pudo lanzar tgrep[\s\S]*ENOENT[\s\S]*missing-tgrep\.exe/,
  );
});

test("un ejecutable no lanzable conserva un diagnóstico distinto de un fallo del CLI", async (t) => {
  const worktree = mkdtempSync(join(tmpdir(), "profile-site-tgrep-launch-"));
  t.after(() => rmSync(worktree, { recursive: true, force: true }));
  const executable = join(worktree, "invalid.exe");
  writeFileSync(executable, "Este archivo no es un ejecutable.");

  await assert.rejects(
    queryTgrep({ pattern: "needle" }, { worktree }, { executable }),
    /No se pudo lanzar tgrep[\s\S]*(?:EACCES|EPERM|EINVAL|ENOEXEC|UNKNOWN)/,
  );
});

test("los patrones llegan intactos como un único argumento después de --", async (t) => {
  for (const pattern of ["two words", '"double" and \'single\'', "-n", "--help", "serve", "search", "status", "index", "help", "$(echo injected) & dir | more"]) {
    const result = await query(t, "process.stdout.write(JSON.stringify(process.argv.slice(1)))", pattern);
    const argv = JSON.parse(result);
    const separator = argv.indexOf("--");

    assert.notEqual(separator, -1);
    assert.equal(argv[separator + 1], pattern);
    assert.equal(argv.length, separator + 3);
  }
});

test("otros códigos de salida nunca se comunican como ausencia de coincidencias", async (t) => {
  for (const code of [3, 7, 127]) {
    await assert.rejects(query(t, `process.exitCode = ${code}`), new RegExp(`tgrep terminó con código ${code}`));
  }
});
