import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import { getEventListeners } from "node:events";
import { queryTgrep } from "../.opencode/lib/tgrep-query.ts";
import { ensureTgrepService } from "../.opencode/lib/tgrep-service.ts";

function fixture(t, mode = "available") {
  const worktree = mkdtempSync(join(tmpdir(), "profile-site-tgrep-service-"));
  const script = join(worktree, "cli.mjs");
  writeFileSync(script, `import {appendFileSync,existsSync,writeFileSync,readFileSync,openSync,closeSync} from 'node:fs';
    const action=process.argv[2];
    appendFileSync('calls.txt',JSON.stringify({action,pid:process.pid})+'\\n');
    if(action==='status') {
      if(${JSON.stringify(mode)}==='status-blocked') setInterval(()=>{},1000);
      else if(${JSON.stringify(mode)}==='diagnostic') { console.error('漢'.repeat(2000)); process.exitCode=2; }
      else if(existsSync('ready')) console.log('Server status for fixture');
      else { console.error('no hay servidor'); process.exitCode=1; }
    }
    else if(action==='serve') {
      if(${JSON.stringify(mode)}==='failed') { console.error('arranque rechazado'); process.exitCode=7; }
      else if(['start-blocked','status-blocked','diagnostic'].includes(${JSON.stringify(mode)})) setInterval(()=>{},1000);
      else {
        try { closeSync(openSync('lock','wx')); } catch { process.exit(7); }
        writeFileSync('daemon-pid',String(process.pid));
        setTimeout(()=>writeFileSync('ready','yes'),100);
        setInterval(()=>{},1000);
      }
    }
    else {
      appendFileSync('query.txt',JSON.stringify(process.argv));
      if(process.argv.includes('invalid')) { console.error('regex inválida'); process.exitCode=2; }
      else if(${JSON.stringify(mode)}==='diagnostic') {
        const path={text:'sample.txt'};
        console.error('x'.repeat(8000));
        console.log(JSON.stringify({type:'begin',data:{path}}));
        console.log(JSON.stringify({type:'match',data:{path,line_number:1,lines:{text:'x'.repeat(37900)}}}));
        console.log(JSON.stringify({type:'end',data:{path}}));
        console.log(JSON.stringify({type:'summary',data:{}}));
      } else { console.log(JSON.stringify({type:'summary',data:{}})); process.exitCode=1; }
    }
  `);
  if (mode === "available") writeFileSync(join(worktree, "ready"), "yes");
  const readCalls = () => readFileSync(join(worktree, "calls.txt"), "utf8").trim().split("\n").map((line) => JSON.parse(line));
  t.after(async () => {
    if (existsSync(join(worktree, "calls.txt"))) {
      for (const { pid, action } of readCalls()) {
        if (action !== "serve") continue;
        try { process.kill(pid); } catch (error) { if (error.code !== "ESRCH") throw error; }
      }
    }
    await delay(100);
    rmSync(worktree, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  });
  const command = { executable: process.execPath, args: [script], statusTimeoutMs: 1000, availabilityTimeoutMs: 1500 };
  return {
    worktree,
    run: (args = {}, abort, log) => queryTgrep({ pattern: "needle", ...args }, { worktree, abort, log }, command),
    calls: () => readCalls().map(({ action }) => action),
    readCalls,
    queryArgs: () => JSON.parse(readFileSync(join(worktree, "query.txt"), "utf8")),
    prewarm: (log, abort) => ensureTgrepService(worktree, command, abort, log),
  };
}

test("una consulta indexada comprueba y reutiliza el servicio disponible", async (t) => {
  const { run, calls } = fixture(t);
  const result = await run();
  assert.equal(result.metadata.search_mode, "indexed_or_scan");
  assert.deepEqual(calls(), ["status", "--json"]);
});

test("el prewarming confirma el arranque y una consulta posterior reutiliza el servicio", async (t) => {
  const { prewarm, run, calls } = fixture(t, "start");
  const logs = [];
  const result = await prewarm((level, message) => logs.push({ level, message }));
  assert.equal(result.available, true);
  assert.match(logs[0].message, /Intento/);
  assert.match(logs[1].message, /disponible/);
  assert.equal(logs.some((log) => log.level === "warn"), false);
  await run();
  assert.equal(calls().filter((action) => action === "serve").length, 1);
});

test("un arranque fallido fuerza un scan actual con diagnóstico", async (t) => {
  const { run, calls, queryArgs } = fixture(t, "failed");
  const result = await run();
  assert.equal(result.metadata.search_mode, "current_scan");
  assert.ok(queryArgs().includes("--no-index"));
  assert.ok(calls().includes("serve"));
  assert.match(result.output, /servicio.*tgrep|tgrep.*servicio/i);
});

test("estado y arranque bloqueados tienen espera acotada y fallback sin falsos logs de disponibilidad", async (t) => {
  for (const mode of ["status-blocked", "start-blocked"]) {
    const { run, prewarm, readCalls, queryArgs } = fixture(t, mode);
    const logs = [];
    const start = Date.now();
    const service = await prewarm((level, message) => logs.push({ level, message }));
    assert.equal(service.available, false);
    assert.ok(Date.now() - start < 4000);
    assert.equal(logs.length, 2);
    assert.match(logs[0].message, /Intento/);
    assert.equal(logs[1].level, "warn");
    const result = await run();
    assert.equal(result.metadata.search_mode, "current_scan");
    assert.ok(queryArgs().includes("--no-index"));
    assert.match(result.output, /Diagnóstico del servicio tgrep/);
    // Solo los intentos de daemon pueden sobrevivir; los clientes de estado y consulta se recogen.
    for (const { pid, action } of readCalls()) if (action !== "serve") assert.throws(() => process.kill(pid, 0), /ESRCH/);
  }
});

test("current evita comprobar y arrancar el servicio incluso si el estado se bloquea", async (t) => {
  const { run, calls } = fixture(t, "status-blocked");
  assert.equal((await run({ freshness: "current" })).metadata.search_mode, "current_scan");
  assert.deepEqual(calls(), ["--json"]);
});

test("los intentos concurrentes conservan el índice y reutilizan al propietario del lock", async (t) => {
  const { run, prewarm, worktree } = fixture(t, "start");
  writeFileSync(join(worktree, "index-sentinel"), "índice existente");
  const [warm, first, second] = await Promise.all([prewarm(() => {}), run(), run()]);
  assert.equal(warm.available, true);
  assert.equal(first.metadata.search_mode, "indexed_or_scan");
  assert.equal(second.metadata.search_mode, "indexed_or_scan");
  assert.equal(readFileSync(join(worktree, "index-sentinel"), "utf8"), "índice existente");
  const pid = Number(readFileSync(join(worktree, "daemon-pid"), "utf8"));
  process.kill(pid, 0);
  await run();
  assert.equal(Number(readFileSync(join(worktree, "daemon-pid"), "utf8")), pid);
});

test("una consulta posterior recupera el servicio después de una caída", async (t) => {
  const { run, worktree } = fixture(t, "start");
  await run();
  const pid = Number(readFileSync(join(worktree, "daemon-pid"), "utf8"));
  process.kill(pid);
  await delay(100);
  rmSync(join(worktree, "ready"));
  rmSync(join(worktree, "lock"));
  const recovered = await run();
  assert.equal(recovered.metadata.search_mode, "indexed_or_scan");
  const nextPid = Number(readFileSync(join(worktree, "daemon-pid"), "utf8"));
  assert.notEqual(nextPid, pid);
  process.kill(nextPid, 0);
});

test("el diagnóstico Unicode del fallback respeta el presupuesto global de output", async (t) => {
  const { run } = fixture(t, "diagnostic");
  const result = await run();
  assert.equal(result.metadata.search_mode, "current_scan");
  assert.match(result.output, /漢/);
  assert.ok(Buffer.byteLength(result.output) <= 48_000, `Output: ${Buffer.byteLength(result.output)} bytes`);
});

test("cancelar durante el estado recoge el cliente e impide lanzar daemon y consulta", async (t) => {
  const { run, calls, readCalls, worktree } = fixture(t, "status-blocked");
  const abort = new AbortController();
  const rejected = assert.rejects(run({}, abort.signal), /Consulta tgrep cancelada/);
  for (let attempt = 0; attempt < 100 && !existsSync(join(worktree, "calls.txt")); attempt++) await delay(10);
  assert.ok(existsSync(join(worktree, "calls.txt")));
  abort.abort();
  await rejected;
  assert.deepEqual(calls(), ["status"]);
  assert.equal(getEventListeners(abort.signal, "abort").length, 0);
  const [{ pid }] = readCalls();
  assert.throws(() => process.kill(pid, 0), /ESRCH/);
});

test("el arranque desde una consulta registra intento y disponibilidad confirmada", async (t) => {
  const { run } = fixture(t, "start");
  const logs = [];
  await run({}, undefined, (level, message) => logs.push({ level, message }));
  assert.equal(logs.length, 2);
  assert.match(logs[0].message, /Intento/);
  assert.match(logs[1].message, /disponible/);
});

test("el error del scan conserva también el diagnóstico de indisponibilidad", async (t) => {
  const { run } = fixture(t, "failed");
  await assert.rejects(run({ pattern: "invalid" }), (error) => {
    assert.match(error.message, /código 2[\s\S]*regex inválida/);
    assert.match(error.message, /Diagnóstico del servicio tgrep/);
    return true;
  });
});

test("el prewarming comunica un fallo de cleanup del estado sin ocultarlo con un arranque posterior", async (t) => {
  const { prewarm, calls, worktree } = fixture(t, "status-blocked");
  const abort = new AbortController();
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const logs = [];
  const warming = prewarm((level, message) => logs.push({ level, message }), abort.signal);
  try {
    for (let attempt = 0; attempt < 100 && !existsSync(join(worktree, "calls.txt")); attempt++) await delay(10);
    assert.ok(existsSync(join(worktree, "calls.txt")));
    t.mock.timers.tick(1000);
    t.mock.timers.tick(5000);
    const result = await Promise.race([warming, delay(100).then(() => undefined)]);
    assert.ok(result, "El fallo de cleanup debe comunicarse al recoger el estado.");
    assert.equal(result.available, false);
    assert.match(result.diagnostic, /cleanup/);
    assert.deepEqual(calls(), ["status"]);
    assert.ok(logs.some(({ level, message }) => level === "warn" && message.includes("cleanup")));
  } finally {
    t.mock.timers.reset();
    abort.abort();
    await warming;
  }
});
