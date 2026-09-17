import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const entrypoint = join(projectRoot, "scripts", "measure-performance.mjs");
const fakeLighthouseRunner = fileURLToPath(
  new URL("../test-support/fake-lighthouse-runner.mjs", import.meta.url),
);
const baselinePath = join(projectRoot, "performance-baseline.json");
const baselineEvidencePath = join(projectRoot, "docs", "performance-baseline.md");

function temporaryDirectory(t) {
  const directory = mkdtempSync(join(tmpdir(), "profile-site-performance-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return directory;
}

function createStaticOutput(directory, { includeMissingResource = false, initialJavaScriptBytes = 21 } = {}) {
  mkdirSync(join(directory, "_astro"));
  writeFileSync(
    join(directory, "index.html"),
    `<!doctype html><script type="module" src="/profile-site/_astro/entry.js"></script><link rel="stylesheet" href="/profile-site/_astro/site.css">${includeMissingResource ? '<script src="/profile-site/_astro/missing.js"></script>' : ""}`,
  );
  writeFileSync(join(directory, "_astro", "entry.js"), "x".repeat(initialJavaScriptBytes));
  writeFileSync(join(directory, "_astro", "site.css"), "body { color: black; }");
}

function measure(outputDirectory, summaryPath, environment = {}) {
  return spawnSync(process.execPath, [entrypoint], {
    cwd: projectRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      GITHUB_STEP_SUMMARY: summaryPath,
      PERFORMANCE_OUTPUT_DIRECTORY: outputDirectory,
      ...(process.env.PERFORMANCE_REAL_BASELINE === "true"
        ? {}
        : {
            FAKE_LIGHTHOUSE_EXPECT_HEADLESS: "true",
            PERFORMANCE_LIGHTHOUSE_RUNNER: fakeLighthouseRunner,
          }),
      ...environment,
    },
  });
}

function productionMeasurement(outputDirectory, summaryPath, environment = {}) {
  return measure(outputDirectory, summaryPath, {
    PERFORMANCE_ENFORCE_BUDGETS: "true",
    ...environment,
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
  assert.match(summary, /Ejecuciones mobile: 91, 92, 93/);
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

test("la baseline ejecuta el build contractual con su fixture y perfil versionados", (t) => {
  const outputDirectory = mkdtempSync(join(projectRoot, "test-performance-baseline-"));
  t.after(() => rmSync(outputDirectory, { recursive: true, force: true }));
  const summaryPath = process.env.PERFORMANCE_REAL_BASELINE === "true"
    ? process.env.GITHUB_STEP_SUMMARY
    : join(outputDirectory, "summary.md");
  const baseline = JSON.parse(readFileSync(baselinePath, "utf8"));
  const isWindows = process.platform === "win32";
  const buildResult = spawnSync(isWindows ? process.env.ComSpec : "pnpm", isWindows
    ? ["/d", "/s", "/c", `pnpm build --outDir ${basename(outputDirectory)}`]
    : ["build", "--outDir", outputDirectory], {
    cwd: projectRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      PROFILE_SITE_BASE_URL: "https://fraguio.github.io/profile-site/",
      RESUME_PATH: baseline.fixture,
    },
  });

  assert.equal(buildResult.status, 0, `${buildResult.stdout}\n${buildResult.stderr}`);
  assert.ok(summaryPath, "GITHUB_STEP_SUMMARY is required for the real baseline.");
  const result = measure(outputDirectory, summaryPath, {
    FAKE_LIGHTHOUSE_MOBILE_SCORE: "0.97",
    FAKE_LIGHTHOUSE_DESKTOP_SCORE: "0.99",
  });

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  const summary = readFileSync(summaryPath, "utf8");

  assert.ok(summary.includes(`Perfil mobile versionado: \`${baseline.mobileProfile}\``));
  if (process.env.PERFORMANCE_REAL_BASELINE === "true") {
    return;
  }
  for (const [name, value] of Object.entries(baseline.observed)) {
    assert.match(summary, new RegExp(String(value)), `La baseline debe incluir ${name}.`);
  }
  const evidence = readFileSync(baselineEvidencePath, "utf8");
  for (const value of [...Object.values(baseline.observed), ...Object.values(baseline.budgets)]) {
    assert.match(evidence, new RegExp(String(value)));
  }
});

test("el entrypoint publica en el summary la ausencia del output estático", (t) => {
  const directory = temporaryDirectory(t);
  const summaryPath = join(directory, "summary.md");

  const result = measure(join(directory, "missing"), summaryPath);

  assert.notEqual(result.status, 0);
  assert.match(readFileSync(summaryPath, "utf8"), /Static output directory does not exist/);
  assert.match(readFileSync(summaryPath, "utf8"), /Resultado: bloquea/);
});

test("el entrypoint rechaza un budget determinista que supera su límite", (t) => {
  const outputDirectory = temporaryDirectory(t);
  const summaryPath = join(outputDirectory, "summary.md");
  createStaticOutput(outputDirectory, { initialJavaScriptBytes: 10000 });

  const result = productionMeasurement(outputDirectory, summaryPath, {
    PERFORMANCE_EVENT: "pull_request",
  });

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /Deterministic budget exceeded/);
  assert.match(readFileSync(summaryPath, "utf8"), /Resultado: bloquea/);
  assert.doesNotMatch(readFileSync(summaryPath, "utf8"), /Fallo técnico de medición/);
});

test("el entrypoint aplica la matriz de objetivos mobile por evento", (t) => {
  const outputDirectory = temporaryDirectory(t);
  const summaryPath = join(outputDirectory, "summary.md");
  createStaticOutput(outputDirectory);

  const result = productionMeasurement(outputDirectory, summaryPath, {
    PERFORMANCE_EVENT: "repository_dispatch",
    FAKE_LIGHTHOUSE_MOBILE_SCORE: "0.89",
  });

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(readFileSync(summaryPath, "utf8"), /Warning: objetivo Lighthouse mobile incumplido/);
});

test("el entrypoint rechaza el límite absoluto mobile para todos los eventos", (t) => {
  const outputDirectory = temporaryDirectory(t);
  const summaryPath = join(outputDirectory, "summary.md");
  createStaticOutput(outputDirectory);

  const result = productionMeasurement(outputDirectory, summaryPath, {
    PERFORMANCE_EVENT: "workflow_dispatch",
    FAKE_LIGHTHOUSE_MOBILE_SCORE: "0.79",
  });

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /Mobile Lighthouse absolute limit exceeded/);
  assert.match(readFileSync(summaryPath, "utf8"), /Resultado: bloquea/);
});

test("el entrypoint conserva el fallo técnico como bloqueo y lo publica en el summary", (t) => {
  const outputDirectory = temporaryDirectory(t);
  const summaryPath = join(outputDirectory, "summary.md");
  createStaticOutput(outputDirectory);

  const result = productionMeasurement(outputDirectory, summaryPath, {
    PERFORMANCE_EVENT: "push",
    FAKE_LIGHTHOUSE_FAILURE: "true",
  });

  assert.notEqual(result.status, 0);
  assert.match(readFileSync(summaryPath, "utf8"), /Fallo técnico de medición/);
  assert.match(readFileSync(summaryPath, "utf8"), /Resultado: bloquea/);
});

for (const [canary, event, status, outcome] of [
  ["deterministic-budget", "pull_request", "failure", "bloquea"],
  ["deterministic-budget", "push", "failure", "bloquea"],
  ["deterministic-budget", "repository_dispatch", "failure", "bloquea"],
  ["deterministic-budget", "workflow_dispatch", "failure", "bloquea"],
  ["mobile-target", "pull_request", "failure", "bloquea"],
  ["mobile-target", "push", "failure", "bloquea"],
  ["mobile-target", "repository_dispatch", "success", "Warning"],
  ["mobile-target", "workflow_dispatch", "success", "Warning"],
  ["mobile-absolute-limit", "pull_request", "failure", "bloquea"],
  ["mobile-absolute-limit", "push", "failure", "bloquea"],
  ["mobile-absolute-limit", "repository_dispatch", "failure", "bloquea"],
  ["mobile-absolute-limit", "workflow_dispatch", "failure", "bloquea"],
  ["technical-failure", "pull_request", "failure", "bloquea"],
  ["technical-failure", "push", "failure", "bloquea"],
  ["technical-failure", "repository_dispatch", "failure", "bloquea"],
  ["technical-failure", "workflow_dispatch", "failure", "bloquea"],
]) {
  test(`el canario ${canary} aplica ${outcome} en ${event}`, (t) => {
    const outputDirectory = temporaryDirectory(t);
    const summaryPath = join(outputDirectory, "summary.md");
    createStaticOutput(outputDirectory, {
      initialJavaScriptBytes: canary === "deterministic-budget" ? 10000 : 21,
    });
    const result = productionMeasurement(outputDirectory, summaryPath, {
      PERFORMANCE_EVENT: event,
      ...(canary === "technical-failure"
        ? { FAKE_LIGHTHOUSE_FAILURE: "true" }
        : canary === "mobile-target"
          ? { FAKE_LIGHTHOUSE_MOBILE_SCORE: "0.89" }
          : canary === "mobile-absolute-limit"
            ? { FAKE_LIGHTHOUSE_MOBILE_SCORE: "0.79" }
            : {}),
    });

    assert.equal(status === "success", result.status === 0, `${result.stdout}\n${result.stderr}`);
    assert.match(readFileSync(summaryPath, "utf8"), new RegExp(outcome));
  });
}
