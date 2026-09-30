import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { queryTgrep } from "../.opencode/lib/tgrep-query.ts";

function events(text = "  needle\n", path = "src/example.ts", line = 2) {
  return [
    { type: "begin", data: { path: { text: path } } },
    { type: "match", data: { path: { text: path }, line_number: line, lines: { text }, submatches: [] } },
    { type: "end", data: { path: { text: path } } },
    { type: "summary", data: {} },
  ].map((event) => JSON.stringify(event)).join("\n") + "\n";
}

function query(t, script, pattern = "needle", args = {}) {
  const worktree = mkdtempSync(join(tmpdir(), "profile-site-tgrep-"));
  t.after(() => rmSync(worktree, { recursive: true, force: true }));
  return queryTgrep({ pattern, ...args }, { worktree }, {
    executable: process.execPath,
    args: ["--input-type=module", "-e", `const events = ${events.toString()}; const emit = (...args) => process.stdout.write(events(...args)); ${script}`, "--"],
  });
}

test("una consulta JSON devuelve líneas localizables y comunica la garantía conservadora del modo normal", async (t) => {
  const result = await query(t, `
    import assert from "node:assert/strict";
    assert.ok(process.argv.includes("--json"));
    assert.ok(!process.argv.includes("--no-index"));
    assert.equal(process.argv[process.argv.indexOf("--context") + 1], "0");
    process.stdout.write(${JSON.stringify(events())});
  `);

  assert.match(result.output, /\[coincidencia\] src\/example\.ts:2:  needle\n/);
  assert.match(result.output, /Modo de búsqueda: indexed_or_scan/);
  assert.match(result.output, /Truncado: no/);
  assert.deepEqual(result.metadata, { search_mode: "indexed_or_scan", truncated: false, record_count: 1 });
});

test("una consulta sin coincidencias es válida y comunica la ausencia de resultados", async (t) => {
  const result = await query(t, 'process.stdout.write(JSON.stringify({type:"summary",data:{}})); process.exitCode = 1');

  assert.match(result.output, /No se encontraron coincidencias/);
});

test("el límite global distingue el fin natural del exceso y cuenta contexto, no submatches", async (t) => {
  for (const count of [1, 2, 3]) {
    const result = await query(t, `
      const path = {text:"sample.txt"};
      process.stdout.write(JSON.stringify({type:"begin",data:{path}})+"\\n");
      for (let line = 1; line <= ${count}; line++) {
        process.stdout.write(JSON.stringify({type:line===1?"match":"context",data:{path,line_number:line,lines:{text:"needle needle\\n"},submatches:[{},{}]}})+"\\n");
      }
      process.stdout.write(JSON.stringify({type:"end",data:{path}})+"\\n"+JSON.stringify({type:"summary",data:{}})+"\\n");
    `, "needle", { max_results: 2 });
    assert.equal(result.metadata.record_count, Math.min(count, 2));
    assert.equal(result.metadata.truncated, count > 2);
    if (count > 2) {
      assert.equal(result.metadata.truncation_reason, "max_results");
      assert.match(result.output, /Truncado: sí[\s\S]*max_results[\s\S]*estrecha/i);
    }
  }
});

test("un fallo del CLI conserva el código de salida y el diagnóstico de stderr", async (t) => {
  await assert.rejects(
    query(t, 'process.stderr.write("regex inválida: falta ]\\n"); process.exitCode = 2'),
    /tgrep.*código 2[\s\S]*regex inválida: falta \]/,
  );
});

test("el presupuesto UTF-8 incluye cabecera y avisos y una fila enorme no parece ausencia de resultados", async (t) => {
  const result = await query(t, `emit(("😀".repeat(300)+"\\n").repeat(100), "sample.txt", 1);`, "needle", { max_results: 1000 });
  assert.ok(Buffer.byteLength(result.output) <= 48_000);
  assert.equal(result.metadata.truncated, true);
  assert.equal(result.metadata.truncation_reason, "output_bytes");
  assert.ok(result.metadata.record_count > 0 && result.metadata.record_count < 100);
  assert.doesNotMatch(result.output, /�/);
  const huge = await query(t, 'emit("😀".repeat(20000)+"\\n")');
  assert.equal(huge.metadata.record_count, 0);
  assert.equal(huge.metadata.truncation_reason, "output_bytes");
  assert.match(huge.output, /Truncado: sí/);
  assert.doesNotMatch(huge.output, /No se encontraron/);
});

test("stderr acompaña como advertencia las consultas válidas con y sin coincidencias", async (t) => {
  for (const code of [0, 1]) {
    const result = await query(t, `
      ${code === 0 ? 'emit("needle\\n", "example.ts", 1)' : 'process.stdout.write(JSON.stringify({type:"summary",data:{}}))'};
      process.stderr.write("archivo omitido: acceso denegado\\n");
      process.exitCode = ${code};
    `);

    assert.match(result.output, code === 0 ? /example.ts:1:needle/ : /No se encontraron coincidencias/);
    assert.match(result.output, /Advertencias de tgrep:[\s\S]*archivo omitido: acceso denegado/);
  }
});

test("los streams excesivos se interrumpen durante la lectura y el cliente ya está recogido al responder", { timeout: 15_000 }, async (t) => {
  for (const [script, reason] of [
    ['process.stdout.write("x".repeat(300000));', "event_bytes"],
    ['process.stderr.write("diagnóstico 😀\\n".repeat(20000));', "stderr_bytes"],
    ['emit("needle\\nneedle\\n");', "max_results"],
  ]) {
    const worktree = mkdtempSync(join(tmpdir(), "profile-site-tgrep-limit-"));
    t.after(() => rmSync(worktree, { recursive: true, force: true }));
    const pidFile = join(worktree, "pid.txt");
    const result = await queryTgrep({ pattern: "needle", max_results: 1 }, { worktree }, {
      executable: process.execPath,
      args: ["--input-type=module", "-e", `import {writeFileSync} from "node:fs"; writeFileSync(${JSON.stringify(pidFile)}, String(process.pid)); const events=${events.toString()}; const emit=(...args)=>process.stdout.write(events(...args)); ${script} setInterval(()=>{},1000);`, "--"],
    });
    assert.equal(result.metadata.truncated, true);
    assert.equal(result.metadata.truncation_reason, reason);
    assert.ok(Buffer.byteLength(result.output) <= 48_000);
    assert.ok(Buffer.byteLength(JSON.stringify(result.metadata)) < 256);
    assert.doesNotMatch(result.output, /No se encontraron|�/);
    assert.throws(() => process.kill(Number(readFileSync(pidFile, "utf8")), 0), /ESRCH/);
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
    const result = await query(t, 'emit(JSON.stringify(process.argv.slice(1)), "argv.txt", 1)', pattern);
    const argv = JSON.parse(result.output.split("argv.txt:1:")[1]);
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

test("el ámbito relativo y absoluto selecciona un archivo del worktree desde otro cwd", async (t) => {
  const worktree = mkdtempSync(join(tmpdir(), "profile-site-tgrep-scope-"));
  t.after(() => rmSync(worktree, { recursive: true, force: true }));
  mkdirSync(join(worktree, "src with spaces"));
  const file = join(worktree, "src with spaces", "sample.txt");
  writeFileSync(file, "contenido del ámbito seleccionado\n");
  symlinkSync(join(worktree, "src with spaces"), join(worktree, "internal-link"), "junction");
  assert.notEqual(process.cwd(), worktree);

  for (const path of ["src with spaces/sample.txt", file, "internal-link/sample.txt"]) {
    const result = await queryTgrep({ pattern: "contenido", path }, { worktree }, {
      executable: process.execPath,
      args: ["--input-type=module", "-e", `import { readFileSync } from "node:fs"; const events = ${events.toString()}; process.stdout.write(events(readFileSync(process.argv.at(-1), "utf8"), process.argv.at(-1), 1))`, "--"],
    });
    assert.match(result.output, /sample\.txt:1:contenido del ámbito seleccionado\n/);
  }
});

test("current ejecuta solo el scan del contenido actual y comunica su modo", async (t) => {
  const result = await query(t, `
    import assert from "node:assert/strict";
    assert.ok(process.argv.includes("--no-index"));
    assert.ok(process.argv.includes("--json"));
    assert.ok(!process.argv.includes("status") && !process.argv.includes("serve"));
    emit("contenido actual\\n");
  `, "needle", { freshness: "current" });

  assert.match(result.output, /Modo de búsqueda: current_scan/);
  assert.match(result.output, /contenido actual/);
  assert.deepEqual(result.metadata, { search_mode: "current_scan", truncated: false, record_count: 1 });
});

test("los eventos fragmentados conservan Unicode, CRLF e indentación y distinguen contexto de coincidencias", async (t) => {
  const result = await query(t, `
    import assert from "node:assert/strict";
    import { join } from "node:path";
    import { setTimeout as delay } from "node:timers/promises";
    assert.equal(process.argv[process.argv.indexOf("--context") + 1], "1");
    const path = { text: join(process.cwd(), "src with spaces", "sample.txt") };
    const stream = [
      { type: "begin", data: { path } },
      { type: "context", data: { path, line_number: 1, lines: { text: "\\tantes: café\\r\\n" }, submatches: [] } },
      { type: "match", data: { path, line_number: 2, lines: { text: "  niño 😀 needle needle\\r\\n" }, submatches: [{start:0,end:1},{start:2,end:3}] } },
      { type: "context", data: { path, line_number: 3, lines: { text: "    después\\r\\n" }, submatches: [] } },
      { type: "end", data: { path } },
      { type: "summary", data: {} },
    ].map(event => JSON.stringify(event)).join("\\r\\n");
    const bytes = Buffer.from(stream);
    const boundaries = new Set([0, bytes.length]);
    for (let offset = 1; offset < bytes.length; offset++) {
      if (offset % 31 === 0 || bytes[offset] >= 0x80) boundaries.add(offset);
    }
    const offsets = [...boundaries].sort((a, b) => a - b);
    for (let index = 1; index < offsets.length; index++) {
      process.stdout.write(bytes.subarray(offsets[index - 1], offsets[index]));
      await delay(1);
    }
  `, "needle", { context_lines: 1 });

  assert.ok(result.output.includes("[contexto] src with spaces/sample.txt:1:\tantes: café\r\n"));
  assert.ok(result.output.includes("[coincidencia] src with spaces/sample.txt:2:  niño 😀 needle needle\r\n"));
  assert.ok(result.output.includes("[contexto] src with spaces/sample.txt:3:    después\r\n"));
  assert.equal(result.metadata.record_count, 3);
  assert.equal(result.metadata.truncated, false);
  assert.doesNotMatch(result.output, /�|profile-site-tgrep-/);
});

test("cada línea devuelta genera un registro aunque un evento contenga varias líneas", async (t) => {
  const result = await query(t, 'emit("  needle\\r\\n\\tneedle 😀\\n", "./src/../sample.txt", 2)');
  assert.ok(result.output.includes("[coincidencia] sample.txt:2:  needle\r\n"));
  assert.ok(result.output.includes("[coincidencia] sample.txt:3:\tneedle 😀\n"));
  assert.equal(result.metadata.record_count, 2);
});

test("los eventos inválidos y los streams incompletos producen errores de protocolo con su diagnóstico", async (t) => {
  const valid = events();
  const invalid = [
    "no es JSON\n", "null\n", "[]\n", '{"type":"match"}\n',
    '{"type":"future-event","data":{}}\n',
    valid.replace('"line_number":2', '"line_number":0'),
    valid.replace('"line_number":2', '"line_number":1.5'),
    valid.replace('"lines":{"text":"  needle\\n"}', '"lines":{"text":42}'),
    valid.replace('"path":{"text":"src/example.ts"}', '"path":{"text":"../escape.txt"}'),
    valid.split("\n").slice(1).join("\n"),
    valid.split("\n").slice(0, 2).join("\n"),
    valid.split("\n").slice(0, 3).join("\n"),
    valid + '{"type":"summary","data":{}}\n',
    '{"type":"summary","data":{}}\n',
    "",
  ];
  for (const stream of invalid) {
    await assert.rejects(query(t, `process.stdout.write(${JSON.stringify(stream)}); process.stderr.write("diagnóstico del fixture");`), /Error de protocolo de tgrep:[\s\S]*diagnóstico del fixture/);
  }
  await assert.rejects(query(t, `process.stdout.write(${JSON.stringify(valid)}); process.exitCode = 1;`), /Error de protocolo/);
  await assert.rejects(query(t, `process.stdout.write(${JSON.stringify(valid.replace('"type":"match"', '"type":["match"]'))}); process.exitCode = 1;`), /Error de protocolo/);
  await assert.rejects(query(t, 'process.stdout.write(Buffer.from([0xff, 0x0a]));'), /Error de protocolo/);
});

test("un fallo real del CLI conserva su clasificación aunque stdout no siga el protocolo", async (t) => {
  await assert.rejects(query(t, 'process.stdout.write("output inválido\\n"); process.stderr.write("regex inválida"); process.exitCode = 2;'), /tgrep terminó con código 2[\s\S]*regex inválida/);
});

test("un error de protocolo ya observado no queda oculto por un límite posterior", async (t) => {
  await assert.rejects(query(t, 'process.stdout.write("no es JSON\\n"); setTimeout(()=>{process.stderr.write("x".repeat(20000));},50); setInterval(()=>{},1000);'), /Error de protocolo de tgrep/);
});

test("el default devuelve como máximo cien líneas y admite los extremos del rango", async (t) => {
  const result = await query(t, 'emit("needle\\n".repeat(101))');
  assert.equal(result.metadata.record_count, 100);
  assert.equal(result.metadata.truncation_reason, "max_results");
  for (const max_results of [1, 1000]) {
    const complete = await query(t, 'emit("needle\\n")', "needle", { max_results });
    assert.equal(complete.metadata.truncated, false);
  }
});

test("stderr con bytes inválidos no puede ampliar el output por encima de su presupuesto", async (t) => {
  const result = await query(t, 'emit("x".repeat(37000)); process.stderr.write(Buffer.alloc(8000,0x80));');
  assert.ok(Buffer.byteLength(result.output) <= 48_000);
  assert.equal(result.metadata.truncation_reason, "stderr_bytes");
});

test("el estado agregado de eventos abiertos queda acotado aunque no haya registros", async (t) => {
  const result = await query(t, `
    const send=(type,path,extra={})=>process.stdout.write(JSON.stringify({type,data:{path:{text:path},...extra}})+"\\n");
    for(let i=0;i<1001;i++) send("begin","file"+i);
    send("match","file0",{line_number:1,lines:{text:"needle\\n"}});
    for(let i=0;i<1001;i++) send("end","file"+i);
    process.stdout.write(JSON.stringify({type:"summary",data:{}})+"\\n");
  `);
  assert.equal(result.metadata.truncation_reason, "protocol_state_bytes");
  assert.equal(result.metadata.record_count, 0);
  assert.doesNotMatch(result.output, /No se encontraron/);
});

test("se rechazan ámbitos inexistentes y destinos reales que escapan del worktree antes del lanzamiento", async (t) => {
  const parent = mkdtempSync(join(tmpdir(), "profile-site-tgrep-boundary-"));
  t.after(() => rmSync(parent, { recursive: true, force: true }));
  const worktree = join(parent, "repo");
  const outside = join(parent, "repo-sibling");
  mkdirSync(worktree);
  mkdirSync(outside);
  writeFileSync(join(outside, "sample.txt"), "fuera del worktree\n");
  symlinkSync(outside, join(worktree, "escape"), "junction");
  const command = { executable: process.execPath, args: ["-e", 'process.stdout.write("cliente lanzado")', "--"] };

  await assert.rejects(queryTgrep({ pattern: "needle", path: "missing" }, { worktree }, command), /ámbito.*(?:inexistente|inaccesible)/i);
  for (const path of [outside, "../repo-sibling", "escape", "escape/sample.txt"]) {
    await assert.rejects(queryTgrep({ pattern: "needle", path }, { worktree }, command), /ámbito.*fuera del worktree/i);
  }
});

test("los tipos inválidos y los strings con NUL se rechazan antes de ejecutar el cliente", async (t) => {
  const worktree = mkdtempSync(join(tmpdir(), "profile-site-tgrep-validation-"));
  t.after(() => rmSync(worktree, { recursive: true, force: true }));
  const command = { executable: process.execPath, args: ["-e", 'process.stdout.write("cliente lanzado")', "--"] };
  const invalid = [
    ["pattern", undefined], ["pattern", 42], ["pattern", "bad\0pattern"],
    ["path", 42], ["path", null], ["path", "bad\0path"],
    ["literal", "true"], ["ignore_case", 1], ["hidden", null],
    ["glob", "*.ts"], ["glob", [42]], ["glob", ["*.ts", "bad\0glob"]], ["glob", Array(1)],
    ["file_types", "js"], ["file_types", [null]], ["file_types", ["js\0"]],
    ["freshness", "latest"], ["freshness", null], ["freshness", 1],
    ["context_lines", -1], ["context_lines", 11], ["context_lines", 0.5],
    ["context_lines", "1"], ["context_lines", null], ["context_lines", NaN], ["context_lines", Infinity],
    ["max_results", 0], ["max_results", 1001], ["max_results", 1.5], ["max_results", "1"],
    ["max_results", null], ["max_results", NaN], ["max_results", Infinity],
  ];
  for (const [name, value] of invalid) {
    await assert.rejects(queryTgrep({ pattern: "needle", [name]: value }, { worktree }, command), new RegExp(`${name}.*(?:tipo|NUL|valor|rango)`, "i"));
  }
});
