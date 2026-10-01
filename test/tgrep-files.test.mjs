import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { getEventListeners } from "node:events";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import { queryTgrep } from "../.opencode/lib/tgrep-query.ts";

function query(t, script, args = {}, command = {}, context = {}) {
  const worktree = mkdtempSync(join(tmpdir(), "profile-site-tgrep-files-"));
  t.after(() => rmSync(worktree, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 }));
  return queryTgrep({ pattern: "needle", freshness: "current", output_mode: "files", ...args }, { worktree, ...context }, {
    executable: process.execPath,
    args: ["--input-type=module", "-e", script, "--"],
    ...command,
  });
}

test("files obtiene rutas del CLI sin contenido y comunica su unidad de resultados", async (t) => {
  const result = await query(t, `
    import assert from "node:assert/strict";
    assert.ok(process.argv.includes("--files-with-matches"));
    assert.ok(process.argv.includes("--null"));
    for (const flag of ["--json", "--files", "--context", "-n", "-H", "--heading"]) assert.ok(!process.argv.includes(flag));
    process.stdout.write("src/first.ts\\0src/second.ts\\0");
  `, { context_lines: 10 });
  assert.match(result.output, /Modo de resultados: files/);
  assert.match(result.output, /\n"src\/first.ts"\n"src\/second.ts"\n/);
  assert.doesNotMatch(result.output, /\[coincidencia\]|needle|:1:/);
  assert.deepEqual(result.metadata, { output_mode: "files", search_mode: "current_scan", truncated: false, record_count: 2 });
});

test("un modo inválido se rechaza antes de lanzar cualquier proceso", async (t) => {
  for (const output_mode of ["count", "", null, 1, true]) {
    await assert.rejects(query(t, 'throw new Error("No debe lanzarse");', { output_mode, freshness: "indexed" }), /output_mode.*inválido/);
  }
});

test("las rutas fragmentadas se normalizan y deduplican conservando nombres y orden", async (t) => {
  const result = await query(t, `
    import {setTimeout as delay} from "node:timers/promises";
    const paths = Buffer.from('src/../src/café 😀.ts\\0./src/café 😀.ts\\0src/second.ts\\0');
    for (const byte of paths) { process.stdout.write(Buffer.from([byte])); await delay(1); }
  `);
  assert.match(result.output, /\n"src\/café 😀\.ts"\n"src\/second\.ts"\n/);
  assert.equal(result.metadata.record_count, 2);
});

test("files conserva un BOM que forma parte del nombre y normaliza rutas absolutas", async (t) => {
  const result = await query(t, `process.stdout.write("\uFEFFname.ts\\0"+process.cwd()+"/src/../absolute.ts\\0./absolute.ts\\0");`);
  assert.match(result.output, /\n"\uFEFFname.ts"\n"absolute.ts"\n/);
  assert.equal(result.metadata.record_count, 2);
});

test("files normaliza separadores de Windows sin confundir dos representaciones de la misma ruta", { skip: process.platform !== "win32" }, async (t) => {
  const result = await query(t, 'process.stdout.write("src\\\\nested\\\\a.ts\\0src/nested/a.ts\\0");');
  assert.match(result.output, /\n"src\/nested\/a.ts"\n/);
  assert.equal(result.metadata.record_count, 1);
});

test("files representa caracteres ambiguos sin romper las filas", async (t) => {
  const result = await query(t, `process.stdout.write(${JSON.stringify('src/a:b "quote"\t\r\n\u2028\u2029.ts\0')});`);
  assert.match(result.output, /\n"src\/a:b \\"quote\\"\\t\\r\\n\\u2028\\u2029\.ts"\n/);
  assert.equal(result.metadata.record_count, 1);
});

test("el límite cuenta rutas únicas y distingue por debajo, exactamente y por encima", async (t) => {
  for (const [paths, count, truncated] of [
    ["a.ts\0./a.ts\0", 1, false],
    ["a.ts\0b.ts\0./a.ts\0", 2, false],
    ["a.ts\0b.ts\0./a.ts\0c.ts\0", 2, true],
  ]) {
    const result = await query(t, `process.stdout.write(${JSON.stringify(paths)});`, { max_results: 2 });
    assert.equal(result.metadata.record_count, count);
    assert.equal(result.metadata.truncated, truncated);
    assert.doesNotMatch(result.output, /"c.ts"/);
    if (truncated) assert.equal(result.metadata.truncation_reason, "max_results");
  }
});

test("files distingue ausencia válida, errores del CLI y errores de protocolo", async (t) => {
  const empty = await query(t, 'process.exitCode=1;');
  assert.equal(empty.metadata.record_count, 0);
  assert.equal(empty.metadata.truncated, false);
  assert.match(empty.output, /No se encontraron coincidencias/);
  for (const script of [
    'process.stdout.write("\\0");',
    'process.stdout.write("../outside.ts\\0");',
    'process.stdout.write(process.cwd()+"\\0");',
    'process.stdout.write("incomplete.ts");',
    'process.stdout.write(Buffer.from([0xc3,0x28,0]));',
    'process.stdout.write(Buffer.from([0xc3]));',
    '',
    'process.stdout.write("a.ts\\0"); process.exitCode=1;',
  ]) await assert.rejects(query(t, script), /Error de protocolo de tgrep/);
  await assert.rejects(query(t, 'process.stderr.write("regex inválida"); process.exitCode=2;'), /código 2[\s\S]*regex inválida/);
  await assert.rejects(query(t, '', {}, { executable: "profile-site-missing-tgrep-executable" }), /No se pudo lanzar tgrep.*ENOENT/);
  const warning = await query(t, 'process.stdout.write("a.ts\\0"); process.stderr.write("advertencia útil");');
  assert.match(warning.output, /Advertencias de tgrep:[\s\S]*advertencia útil/);
});

test("files acota rutas incompletas, filas escapadas y stderr durante la lectura", async (t) => {
  for (const [script, reason, count] of [
    ['process.stdout.write("a".repeat(300000));', "path_bytes", 0],
    ['process.stdout.write("\\t".repeat(20000)+".ts\\0");', "output_bytes", 0],
    ['for(let i=0;i<1000;i++) process.stdout.write(i+"😀".repeat(40)+".ts\\0");', "output_bytes", undefined],
    ['process.stdout.write("a.ts\\0"); process.stderr.write("😀".repeat(10000));', "stderr_bytes", undefined],
  ]) {
    const result = await query(t, script + 'setInterval(()=>{},1000);', { max_results: 1000 });
    assert.equal(result.metadata.truncated, true);
    assert.equal(result.metadata.truncation_reason, reason);
    if (count !== undefined) assert.equal(result.metadata.record_count, count);
    assert.match(result.output, /Truncado: sí/);
    assert.doesNotMatch(result.output, /No se encontraron/);
    assert.ok(Buffer.byteLength(result.output) <= 48000);
  }
});

test("files mantiene los errores reales observados antes de un límite", async (t) => {
  await assert.rejects(query(t, 'process.stdout.write("\\0"+"x".repeat(300000)); process.stderr.write("x".repeat(20000));'), /Error de protocolo/);
});

test("context_lines se valida también cuando files no utiliza contexto", async (t) => {
  for (const context_lines of [-1, 11, 1.5, "1", null]) {
    await assert.rejects(query(t, '', { context_lines }), /context_lines.*inválido/);
  }
});

test("files conserva los argumentos especiales como un patrón único y los filtros del CLI", async (t) => {
  await query(t, `
    import assert from "node:assert/strict";
    const args=process.argv;
    assert.equal(args[args.indexOf("--")+1], '-serve "café" [x]');
    for(const flag of ["--no-index","--fixed-strings","--ignore-case","--glob=*.ts","--glob=!ignored.ts","--type=ts","--hidden"]) assert.ok(args.includes(flag));
    process.stdout.write("a.ts\\0");
  `, { pattern: '-serve "café" [x]', literal: true, ignore_case: true, glob: ["*.ts", "!ignored.ts"], file_types: ["ts"], hidden: true });
});

test("files conserva content por omisión y selección explícita", async (t) => {
  const script = `
    const path={text:"a.ts"};
    for(const event of [
      {type:"begin",data:{path}},
      {type:"match",data:{path,line_number:1,lines:{text:"needle\\n"}}},
      {type:"end",data:{path}}, {type:"summary",data:{}}
    ]) console.log(JSON.stringify(event));
  `;
  const implicit = await query(t, script, { output_mode: undefined });
  const explicit = await query(t, script, { output_mode: "content" });
  assert.deepEqual(explicit, implicit);
  assert.equal(explicit.metadata.output_mode, "content");
  assert.match(explicit.output, /\[coincidencia\] a.ts:1:needle/);
});

test("files conserva default cien y los extremos del rango de max_results", async (t) => {
  for (const [max_results, count] of [[undefined, 100], [1, 1], [1000, 101]]) {
    const result = await query(t, 'for(let i=0;i<101;i++) process.stdout.write(i+".ts\\0");', { max_results });
    assert.equal(result.metadata.record_count, count);
    assert.equal(result.metadata.truncated, count < 101);
  }
});

test("files recoge clientes y listeners tras éxito, error, límites, timeout y cancelación", async (t) => {
  for (const mode of ["success", "empty", "error", "limit", "timeout", "cancel", "pre-cancel"]) {
    const worktree = mkdtempSync(join(tmpdir(), "profile-site-tgrep-files-client-"));
    const pidFile = join(worktree, "pid");
    const abort = new AbortController();
    t.after(async () => {
      abort.abort();
      await delay(100);
      rmSync(worktree, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
    });
    if (mode === "pre-cancel") abort.abort();
    const script = `
      import {writeFileSync} from "node:fs";
      writeFileSync(${JSON.stringify(pidFile)}, String(process.pid));
      ${mode === "empty" ? 'process.exitCode=1;' : 'process.stdout.write("a.ts\\0");'}
      ${mode === "error" ? 'process.stderr.write("fallo CLI"); process.exitCode=2;' : ''}
      ${mode === "limit" ? 'process.stdout.write("b.ts\\0");' : ''}
      ${["cancel", "timeout", "limit"].includes(mode) ? 'setInterval(()=>{},1000);' : ''}
    `;
    const outcome = queryTgrep({ pattern: "needle", output_mode: "files", freshness: "current", max_results: 1 }, { worktree, abort: abort.signal }, {
      executable: process.execPath, args: ["--input-type=module", "-e", script, "--"], timeoutMs: mode === "timeout" ? 250 : 5000,
    }).then((value) => value, (error) => error);
    if (mode === "cancel") {
      for (let attempt = 0; attempt < 100 && !existsSync(pidFile); attempt++) await delay(10);
      assert.ok(existsSync(pidFile));
      abort.abort();
    }
    const result = await outcome;
    if (["error", "timeout", "cancel", "pre-cancel"].includes(mode)) {
      assert.ok(result instanceof Error);
      assert.match(result.message, mode === "error" ? /código 2.*[\s\S]*fallo CLI/ : mode === "timeout" ? /Timeout de consulta/ : /cancelada/);
      assert.doesNotMatch(result.message, /Registros devueltos|No se encontraron/);
    } else assert.equal(result.metadata.truncated, mode === "limit");
    assert.equal(getEventListeners(abort.signal, "abort").length, 0);
    if (mode === "pre-cancel") assert.equal(existsSync(pidFile), false);
    else assert.throws(() => process.kill(Number(readFileSync(pidFile, "utf8")), 0), /ESRCH/);
  }
});

test("files comunica un fallo de cleanup sin devolver registros parciales", async (t) => {
  const worktree = mkdtempSync(join(tmpdir(), "profile-site-tgrep-files-cleanup-"));
  const pidFile = join(worktree, "pid");
  const abort = new AbortController();
  t.after(async () => {
    abort.abort();
    await delay(100);
    rmSync(worktree, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  });
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const outcome = queryTgrep({ pattern: "needle", output_mode: "files", freshness: "current" }, { worktree, abort: abort.signal }, {
    executable: process.execPath,
    args: ["--input-type=module", "-e", `import {writeFileSync} from "node:fs"; writeFileSync(${JSON.stringify(pidFile)},String(process.pid)); process.stdout.write("a.ts\\0"); setInterval(()=>{},1000);`, "--"],
  });
  const rejected = assert.rejects(outcome, /no cerró durante el cleanup/);
  for (let attempt = 0; attempt < 100 && !existsSync(pidFile); attempt++) await delay(10);
  assert.ok(existsSync(pidFile));
  abort.abort();
  t.mock.timers.tick(5000);
  await rejected;
  assert.equal(getEventListeners(abort.signal, "abort").length, 0);
  const pid = Number(readFileSync(pidFile, "utf8"));
  let closed = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    try { process.kill(pid, 0); } catch (error) { assert.equal(error.code, "ESRCH"); closed = true; break; }
    await delay(10);
  }
  assert.ok(closed);
});
