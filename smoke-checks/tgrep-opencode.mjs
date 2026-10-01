import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { cleanServiceFixture, fixtureDaemonPid, stopFixtureDaemon } from "../test-support/tgrep-service-fixture.mjs";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const model = process.env.OPENCODE_SMOKE_MODEL ?? "openai/gpt-6.1-sol";
const chocolateyBinary = join(process.env.ChocolateyInstall ?? "C:/ProgramData/chocolatey", "lib", "opencode", "tools", "opencode.exe");
// Evitar el launcher de Chocolatey para poder cerrar OpenCode sin matar el daemon descendiente.
const opencodeBinary = existsSync(chocolateyBinary) ? chocolateyBinary : "opencode";

function tgrepCalls(stdout) {
  return stdout.split(/\r?\n/).filter((line) => line.startsWith("{")).map((line) => JSON.parse(line))
    .filter((event) => event.type === "tool_use" && event.part?.tool === "tgrep").map((event) => event.part.state);
}

async function stop(child) {
  await delay(50);
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  const closed = new Promise((resolve) => child.once("close", resolve));
  if (process.platform === "win32") {
    const result = spawnSync("taskkill", ["/PID", String(child.pid), "/F"], { encoding: "utf8", timeout: 10_000 });
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

test("OpenCode recién iniciado descubre tgrep, comparte el daemon entre sesiones y recupera una caída", { timeout: 240_000 }, async (t) => {
  const worktree = mkdtempSync(join(tmpdir(), "profile-site-opencode-smoke-"));
  let server;
  const cancelPid = join(worktree, "cancel-client.txt");
  t.after(async () => {
    try {
      await stop(server);
    } finally {
      if (existsSync(cancelPid)) {
        try { process.kill(Number(readFileSync(cancelPid, "utf8"))); } catch (error) { if (error.code !== "ESRCH") throw error; }
      }
      try {
        await cleanServiceFixture(worktree);
      } finally {
        // cleanServiceFixture recoge únicamente el daemon y los archivos de este worktree temporal.
      }
    }
  });
  const git = spawnSync("git", ["init", worktree], { encoding: "utf8" });
  assert.equal(git.status, 0, git.stderr);
  for (const directory of ["lib", "tools", "plugins"]) {
    mkdirSync(join(worktree, ".opencode", directory), { recursive: true });
  }
  for (const path of ["lib/tgrep-query.ts", "lib/tgrep-process.ts", "lib/tgrep-service.ts", "tools/tgrep.ts", "plugins/tgrep-server.ts"]) {
    copyFileSync(join(projectRoot, ".opencode", path), join(worktree, ".opencode", path));
  }
  // Un CLI controlado en PATH bloquea solo el patrón de cancelación. El adaptador
  // y la consulta se copian intactos; los demás comandos usan el tgrep real.
  const located = spawnSync("where.exe", ["tgrep"], { encoding: "utf8", timeout: 5000 });
  assert.equal(located.status, 0, located.stderr);
  const realTgrep = located.stdout.trim().split(/\r?\n/)[0];
  const bin = join(worktree, ".fixture-bin");
  mkdirSync(bin);
  const shimSource = join(bin, "TgrepFixture.cs");
  writeFileSync(shimSource, `using System; using System.Diagnostics; using System.IO; using System.Linq; using System.Threading;
class TgrepFixture {
  static int Main(string[] args) {
    if (args.Contains("CancelNeedle72")) {
      File.WriteAllText(${JSON.stringify(cancelPid)}, Process.GetCurrentProcess().Id.ToString());
      Thread.Sleep(Timeout.Infinite);
      return 0;
    }
    var start = new ProcessStartInfo(${JSON.stringify(realTgrep)}, string.Join(" ", args.Select(arg => "\\\"" + arg.Replace("\\\"", "\\\\\\\"") + "\\\"")));
    start.UseShellExecute = false;
    using (var child = Process.Start(start)) { child.WaitForExit(); return child.ExitCode; }
  }
}`);
  const compiler = join(process.env.WINDIR, "Microsoft.NET", "Framework64", "v4.0.30319", "csc.exe");
  const compiled = spawnSync(compiler, ["/nologo", `/out:${join(bin, "tgrep.exe")}`, shimSource], { encoding: "utf8", timeout: 15_000 });
  assert.equal(compiled.status, 0, `${compiled.stdout}\n${compiled.stderr}`);
  symlinkSync(join(projectRoot, ".opencode", "node_modules"), join(worktree, ".opencode", "node_modules"), "junction");
  writeFileSync(join(worktree, ".gitignore"), ".opencode/\n.tgrep/\n.config/ignored.json\n");
  writeFileSync(join(worktree, "sample.txt"), "AlphaNeedle\nalphaNeedle\n");
  writeFileSync(join(worktree, "current.txt"), "antes\r\nOldNeedle70\r\ndespués\r\n");
  writeFileSync(join(worktree, "limits.txt"), "LimitNeedle71 😀 LimitNeedle71\n".repeat(200));
  mkdirSync(join(worktree, "src with spaces"));
  mkdirSync(join(worktree, ".config"));
  writeFileSync(join(worktree, "src with spaces", "sample.ts"), "Alpha.Needle\nAlphaXNeedle\nalpha.needle\n");
  writeFileSync(join(worktree, ".config", "settings.json"), '{"value":"ConfigNeedle69"}\n');
  writeFileSync(join(worktree, ".config", "ignored.json"), '{"value":"ConfigNeedle69"}\n');

  // Preparar el índice local; OpenCode debe asegurar el daemon mediante el plugin.
  const index = spawnSync("tgrep", ["index", worktree], { encoding: "utf8", timeout: 15_000 });
  assert.equal(index.status, 0, `${index.stdout}\n${index.stderr}`);
  writeFileSync(join(worktree, "current.txt"), "  antes: café\r\n  CurrentNeedle70 niño 😀 CurrentNeedle70\r\n\tdespués\r\n");
  t.signal.throwIfAborted();

  let serverOutput = "";
  let serverError;
  server = spawn(opencodeBinary, ["serve", "--port", "0", "--hostname", "127.0.0.1"], {
    cwd: worktree, stdio: ["ignore", "pipe", "pipe"], windowsHide: true,
    env: { ...process.env, PATH: `${bin};${process.env.PATH}` },
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
  const initialDaemonPid = fixtureDaemonPid(worktree);
  assert.ok(initialDaemonPid, "El plugin debe asegurar el daemon al descubrir las tools.");
  process.kill(initialDaemonPid, 0);
  const [provider, ...modelParts] = model.split("/");
  const tools = await get(`/experimental/tool?${directory}&provider=${encodeURIComponent(provider)}&model=${encodeURIComponent(modelParts.join("/"))}`);
  const tool = tools.find((item) => item.id === "tgrep");
  assert.ok(tool);
  assert.deepEqual(Object.keys(tool.parameters.properties), ["max_results", "pattern", "path", "literal", "ignore_case", "glob", "file_types", "hidden", "freshness", "context_lines"]);
  assert.deepEqual(tool.parameters.required, ["pattern"]);
  assert.equal(tool.parameters.properties.pattern.type, "string");
  assert.equal(tool.parameters.properties.path.type, "string");
  for (const name of ["literal", "ignore_case", "hidden"]) {
    assert.equal(tool.parameters.properties[name].type, "boolean");
    assert.ok(tool.parameters.properties[name].description);
  }
  for (const name of ["glob", "file_types"]) {
    assert.equal(tool.parameters.properties[name].type, "array");
    assert.equal(tool.parameters.properties[name].items.type, "string");
    assert.ok(tool.parameters.properties[name].description);
  }
  assert.deepEqual(tool.parameters.properties.freshness.enum, ["indexed", "current"]);
  assert.equal(tool.parameters.properties.freshness.default, "indexed");
  assert.ok(tool.parameters.properties.freshness.description.includes("filesystem"));
  assert.equal(tool.parameters.properties.context_lines.type, "integer");
  assert.equal(tool.parameters.properties.context_lines.minimum, 0);
  assert.equal(tool.parameters.properties.context_lines.maximum, 10);
  assert.equal(tool.parameters.properties.context_lines.default, 0);
  assert.ok(tool.parameters.properties.context_lines.description.includes("context"));
  assert.equal(tool.parameters.properties.max_results.type, "integer");
  assert.equal(tool.parameters.properties.max_results.minimum, 1);
  assert.equal(tool.parameters.properties.max_results.maximum, 1000);
  assert.equal(tool.parameters.properties.max_results.default, 100);

  t.signal.throwIfAborted();
  const run = spawnSync("opencode", ["run", "--attach", url, "--dir", worktree, "--model", model, "--format", "json",
    'Verificación de la tool: ejecuta exactamente siete consultas con tgrep. Las tres primeras solo aportan pattern: "AlphaN(eedle)", "MissingNeedle68" y "[". La cuarta usa {"pattern":"Alpha.Needle","path":"src with spaces","literal":true,"ignore_case":true,"glob":["*.ts"],"file_types":["ts"]}. La quinta usa {"pattern":"ConfigNeedle69","hidden":true,"glob":["*.json","!ignored.json"],"file_types":["json"]}. La sexta usa {"pattern":"CurrentNeedle70","freshness":"current","context_lines":1}. La séptima usa {"pattern":"LimitNeedle71","max_results":3}. No uses ninguna otra tool. No modifiques archivos. Resume las respuestas y distingue la ausencia de coincidencias del error de regex, las coincidencias del contexto y el truncamiento.',
  ], { cwd: worktree, encoding: "utf8", timeout: 120_000, maxBuffer: 8 * 1024 * 1024 });
  assert.equal(run.status, 0, `${run.stdout}\n${run.stderr}`);
  const calls = tgrepCalls(run.stdout);
  const matches = calls.find((call) => call.input.pattern === "AlphaN(eedle)");
  const empty = calls.find((call) => call.input.pattern === "MissingNeedle68");
  const invalid = calls.find((call) => call.input.pattern === "[");
  assert.ok(matches && empty && invalid, run.stdout);
  assert.equal(matches.status, "completed");
  assert.match(matches.output, /sample\.txt:1:AlphaNeedle/);
  assert.match(matches.output, /Modo de búsqueda: indexed_or_scan/);
  assert.equal(matches.metadata.search_mode, "indexed_or_scan");
  assert.equal(matches.metadata.truncated, false);
  assert.equal(matches.metadata.record_count, 1);
  assert.doesNotMatch(matches.output, /sample\.txt:2:/);
  assert.equal(empty.status, "completed");
  assert.match(empty.output, /No se encontraron coincidencias/);
  assert.equal(empty.metadata.record_count, 0);
  assert.equal(invalid.status, "error");
  assert.match(invalid.error, /tgrep.*código 2[\s\S]*regex/i);
  const literal = calls.find((call) => call.input.pattern === "Alpha.Needle");
  assert.ok(literal, run.stdout);
  assert.equal(literal.status, "completed");
  assert.equal(literal.input.path, "src with spaces");
  assert.equal(literal.input.literal, true);
  assert.equal(literal.input.ignore_case, true);
  assert.deepEqual(literal.input.glob, ["*.ts"]);
  assert.deepEqual(literal.input.file_types, ["ts"]);
  assert.match(literal.output, /sample\.ts:1:Alpha\.Needle/);
  assert.match(literal.output, /sample\.ts:3:alpha\.needle/);
  assert.doesNotMatch(literal.output, /sample\.ts:2:/);
  const hidden = calls.find((call) => call.input.pattern === "ConfigNeedle69");
  assert.ok(hidden, run.stdout);
  assert.equal(hidden.status, "completed");
  assert.equal(hidden.input.hidden, true);
  assert.match(hidden.output, /settings\.json:1:.*ConfigNeedle69/);
  assert.doesNotMatch(hidden.output, /ignored\.json:/);
  const current = calls.find((call) => call.input.pattern === "CurrentNeedle70");
  assert.ok(current, run.stdout);
  assert.equal(current.status, "completed");
  assert.equal(current.input.freshness, "current");
  assert.equal(current.input.context_lines, 1);
  assert.match(current.output, /Modo de búsqueda: current_scan/);
  assert.match(current.output, /\[contexto\] current\.txt:1:  antes: café/);
  assert.match(current.output, /\[coincidencia\] current\.txt:2:  CurrentNeedle70 niño 😀 CurrentNeedle70/);
  assert.match(current.output, /\[contexto\] current\.txt:3:\tdespués/);
  assert.deepEqual(current.metadata, { search_mode: "current_scan", truncated: false, record_count: 3 });
  const limited = calls.find((call) => call.input.pattern === "LimitNeedle71");
  assert.ok(limited, run.stdout);
  assert.equal(limited.status, "completed");
  assert.equal(limited.input.max_results, 3);
  assert.equal(limited.metadata.record_count, 3);
  assert.equal(limited.metadata.truncated, true, JSON.stringify(limited));
  assert.equal(limited.metadata.truncation_reason, "max_results");
  assert.match(limited.output, /Truncado: sí[\s\S]*estrecha/);
  assert.ok(Buffer.byteLength(limited.output) <= 48_000);

  const post = async (path, body) => {
    const response = await fetch(`${url}${path}?${directory}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body), signal: AbortSignal.any([t.signal, AbortSignal.timeout(30_000)]),
    });
    assert.ok(response.ok, await response.clone().text());
    return response.status === 204 ? undefined : response.json();
  };
  const session = await post("/session", {});
  await post(`/session/${session.id}/prompt_async`, {
    model: { providerID: provider, modelID: modelParts.join("/") },
    parts: [{ type: "text", text: 'Ejecuta una única consulta con tgrep usando {"pattern":"CancelNeedle72"}. No uses otras tools ni modifiques archivos.' }],
  });
  const cancelDeadline = Date.now() + 60_000;
  while (!existsSync(cancelPid) && Date.now() < cancelDeadline) await delay(100, undefined, { signal: t.signal });
  assert.ok(existsSync(cancelPid), "OpenCode debe lanzar la consulta antes de cancelarla.");
  const clientPid = Number(readFileSync(cancelPid, "utf8"));
  process.kill(clientPid, 0);
  await post(`/session/${session.id}/abort`, {});
  let clientClosed = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    try { process.kill(clientPid, 0); }
    catch (error) { assert.equal(error.code, "ESRCH"); clientClosed = true; break; }
    await delay(50, undefined, { signal: t.signal });
  }
  assert.ok(clientClosed, "context.abort debe terminar el cliente de la tool real.");
  const messages = await get(`/session/${session.id}/message?${directory}`);
  const cancelled = messages.flatMap((message) => message.parts).find((part) => part.type === "tool" && part.tool === "tgrep");
  assert.ok(cancelled, JSON.stringify(messages));
  assert.equal(cancelled.state.status, "error", JSON.stringify(cancelled));
  assert.match(cancelled.state.error, /cancel|abort/i);
  assert.equal(fixtureDaemonPid(worktree), initialDaemonPid, "Dos sesiones reutilizan el mismo daemon incluso después de cancelar un cliente.");
  process.kill(initialDaemonPid, 0);
  const status = spawnSync("tgrep", ["status", worktree], { encoding: "utf8", timeout: 5_000 });
  assert.equal(status.status, 0, status.stderr);
  assert.match(status.stdout, /Server status/);
  await stopFixtureDaemon(worktree);
  const recovery = spawnSync("opencode", ["run", "--attach", url, "--dir", worktree, "--model", model, "--format", "json",
    'Ejecuta exactamente una consulta con tgrep usando {"pattern":"AlphaNeedle","freshness":"indexed"}. No uses otras tools ni modifiques archivos. Resume el resultado.',
  ], { cwd: worktree, encoding: "utf8", timeout: 60_000, maxBuffer: 8 * 1024 * 1024 });
  assert.equal(recovery.status, 0, `${recovery.stdout}\n${recovery.stderr}`);
  const recovered = tgrepCalls(recovery.stdout)[0];
  assert.equal(recovered?.status, "completed", recovery.stdout);
  assert.equal(recovered.metadata.search_mode, "indexed_or_scan");
  assert.match(recovered.output, /sample\.txt:1:AlphaNeedle/);
  // spawnSync retiene el event loop del fixture; recoger ahora los logs del servidor.
  for (let attempt = 0; attempt < 100 && !serverOutput.includes("[tgrep] Servicio tgrep disponible después del intento de lanzamiento"); attempt++) {
    await delay(10, undefined, { signal: t.signal });
  }
  assert.match(serverOutput, /\[tgrep\] Intento de lanzamiento del servicio tgrep/);
  assert.match(serverOutput, /\[tgrep\] Servicio tgrep disponible después del intento de lanzamiento/);
  const recoveredPid = fixtureDaemonPid(worktree);
  assert.notEqual(recoveredPid, initialDaemonPid);
  process.kill(recoveredPid, 0);
  await stop(server);
  process.kill(recoveredPid, 0);
  const afterSession = spawnSync("tgrep", ["status", worktree], { encoding: "utf8", timeout: 5_000 });
  assert.equal(afterSession.status, 0, afterSession.stderr);
  assert.match(afterSession.stdout, /Server status/, "El daemon sobrevive al cierre de OpenCode.");
});
