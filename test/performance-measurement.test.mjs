import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const entrypoint = join(projectRoot, "scripts", "measure-performance.mjs");
const fakeLighthouseRunner = fileURLToPath(
  new URL("../test-support/fake-lighthouse-runner.mjs", import.meta.url),
);

function temporaryDirectory(t) {
  const directory = mkdtempSync(join(tmpdir(), "profile-site-performance-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return directory;
}

function createStaticOutput(directory, { includeMissingResource = false } = {}) {
  mkdirSync(join(directory, "_astro"));
  writeFileSync(
    join(directory, "index.html"),
    `<!doctype html><script type="module" src="/profile-site/_astro/entry.js"></script><link rel="stylesheet" href="/profile-site/_astro/site.css">${includeMissingResource ? '<script src="/profile-site/_astro/missing.js"></script>' : ""}`,
  );
  writeFileSync(join(directory, "_astro", "entry.js"), "console.log('entry');");
  writeFileSync(join(directory, "_astro", "site.css"), "body { color: black; }");
}

function measure(outputDirectory, summaryPath, environment = {}) {
  return spawnSync(process.execPath, [entrypoint], {
    cwd: projectRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      GITHUB_STEP_SUMMARY: summaryPath,
      PERFORMANCE_LIGHTHOUSE_RUNNER: fakeLighthouseRunner,
      PERFORMANCE_OUTPUT_DIRECTORY: outputDirectory,
      ...environment,
    },
  });
}

test("el entrypoint de rendimiento publica la mediana mobile, desktop y métricas deterministas", (t) => {
  const outputDirectory = temporaryDirectory(t);
  const summaryPath = join(outputDirectory, "summary.md");
  createStaticOutput(outputDirectory);

  const result = measure(outputDirectory, summaryPath);

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  const summary = readFileSync(summaryPath, "utf8");

  assert.match(summary, /Lighthouse mobile \(mediana de 3 ejecuciones\)/);
  assert.match(summary, /92/);
  assert.match(summary, /Lighthouse desktop \(observacional\)/);
  assert.match(summary, /95/);
  assert.match(summary, /Métricas deterministas/);
  assert.match(summary, /JavaScript inicial/);
  assert.match(summary, /Bundles JavaScript/);
  assert.match(summary, /Fuentes/);
  assert.match(summary, /Recursos propios/);
  assert.match(summary, /Requests críticos/);
  assert.match(summary, /JavaScript inicial \| 21 bytes/);
  assert.match(summary, /Requests críticos \| 2/);
  assert.doesNotMatch(summary, /\|\s*(?:budget|objetivo|límite)\s*\|/i);
});

test("el entrypoint de rendimiento falla ante un fallo técnico de Lighthouse", (t) => {
  const outputDirectory = temporaryDirectory(t);
  const summaryPath = join(outputDirectory, "summary.md");
  createStaticOutput(outputDirectory);

  const result = measure(outputDirectory, summaryPath, {
    FAKE_LIGHTHOUSE_FAILURE: "true",
  });

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /Lighthouse failed/);
});

test("el entrypoint de rendimiento falla al no poder recolectar un recurso crítico", (t) => {
  const outputDirectory = temporaryDirectory(t);
  const summaryPath = join(outputDirectory, "summary.md");
  createStaticOutput(outputDirectory, { includeMissingResource: true });

  const result = measure(outputDirectory, summaryPath);

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /Referenced critical resource is unavailable/);
});
