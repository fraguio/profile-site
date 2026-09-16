import { createServer } from "node:http";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { extname, join, resolve } from "node:path";
import { createRequire } from "node:module";
import { chromium } from "@playwright/test";

const outputDirectory = resolve(process.env.PERFORMANCE_OUTPUT_DIRECTORY ?? "dist");
const summaryPath = process.env.GITHUB_STEP_SUMMARY;
const publicPath = normalizePublicPath(process.env.PERFORMANCE_PUBLIC_PATH ?? "/profile-site/");
const mobileProfilePath = resolve("lighthouse-mobile-profile.json");
const lighthouseRunner = process.env.PERFORMANCE_LIGHTHOUSE_RUNNER;
const require = createRequire(import.meta.url);
const chromePath = process.env.PERFORMANCE_CHROME_PATH ?? chromium.executablePath();

if (!existsSync(outputDirectory)) {
  throw new Error(`Static output directory does not exist: ${outputDirectory}`);
}

if (!summaryPath) {
  throw new Error("GITHUB_STEP_SUMMARY is required.");
}

const reportsDirectory = mkdtempSync(join(tmpdir(), "profile-site-lighthouse-"));
const server = createStaticServer(outputDirectory, publicPath);

try {
  const url = await listen(server, publicPath);
  const mobileReports = [];
  for (const run of [1, 2, 3]) {
    mobileReports.push(
      await runLighthouse(url, join(reportsDirectory, `mobile-${run}.json`), [
        `--config-path=${mobileProfilePath}`,
      ]),
    );
  }
  const desktopReport = await runLighthouse(
    url,
    join(reportsDirectory, "desktop.json"),
    ["--preset=desktop"],
  );
  const mobileMedian = median(mobileReports.map(performanceScore));
  const deterministicMetrics = collectDeterministicMetrics(outputDirectory, publicPath);

  appendSummary(summaryPath, {
    desktopReport,
    deterministicMetrics,
    mobileMedian,
    mobileReports,
    publicPath,
    url,
  });
} finally {
  server.close();
  rmSync(reportsDirectory, { recursive: true, force: true });
}

function normalizePublicPath(value) {
  return `/${value.replace(/^\/+|\/+$/g, "")}/`.replace("//", "/");
}

function createStaticServer(directory, basePath) {
  return createServer((request, response) => {
    const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");

    if (!requestUrl.pathname.startsWith(basePath)) {
      response.writeHead(404).end();
      return;
    }

    const requestedPath = requestUrl.pathname.slice(basePath.length - 1);
    const candidate = resolve(directory, `.${requestedPath}`);
    const filePath = candidate === directory || statExists(candidate)?.isDirectory()
      ? join(candidate, "index.html")
      : candidate;

    if (!filePath.startsWith(`${directory}\\`) && !filePath.startsWith(`${directory}/`)) {
      response.writeHead(403).end();
      return;
    }

    const file = statExists(filePath);
    if (!file?.isFile()) {
      response.writeHead(404).end();
      return;
    }

    response.writeHead(200, { "content-type": contentType(filePath) });
    response.end(readFileSync(filePath));
  });
}

function statExists(path) {
  try {
    return statSync(path);
  } catch {
    return undefined;
  }
}

function contentType(path) {
  return {
    ".css": "text/css",
    ".html": "text/html",
    ".js": "text/javascript",
    ".woff2": "font/woff2",
  }[extname(path)] ?? "application/octet-stream";
}

function listen(server, basePath) {
  return new Promise((resolveUrl, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();

      if (!address || typeof address === "string") {
        reject(new Error("Could not determine the local performance server address."));
        return;
      }

      resolveUrl(`http://127.0.0.1:${address.port}${basePath}`);
    });
  });
}

function runLighthouse(url, reportPath, profileArguments) {
  const arguments_ = [
    url,
    "--output=json",
    `--output-path=${reportPath}`,
    `--chrome-path=${chromePath}`,
    ...profileArguments,
  ];

  return new Promise((resolveReport, reject) => {
    const child = spawn(process.execPath, [
      lighthouseRunner ?? require.resolve("lighthouse/cli/index.js"),
      ...arguments_,
    ], {
      stdio: "pipe",
    });
    let stderr = "";

    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.once("error", reject);
    child.once("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Lighthouse failed with exit code ${code}: ${stderr.trim()}`));
        return;
      }

      try {
        resolveReport(JSON.parse(readFileSync(reportPath, "utf8")));
      } catch (error) {
        reject(new Error(`Lighthouse failed to produce a readable report: ${error.message}`));
      }
    });
  });
}

function performanceScore(report) {
  const score = report.categories?.performance?.score;

  if (typeof score !== "number") {
    throw new Error("Lighthouse report does not include a performance score.");
  }

  return score * 100;
}

function median(values) {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor(sorted.length / 2)];
}

function collectDeterministicMetrics(directory, basePath) {
  const files = allFiles(directory);
  const criticalResources = referencedCriticalResources(directory, basePath);
  const initialJavaScript = criticalResources.filter((file) => extname(file) === ".js");
  const fonts = files.filter((file) => [".woff", ".woff2"].includes(extname(file)));
  const javascriptBundles = files.filter((file) => extname(file) === ".js");

  return {
    criticalRequests: criticalResources.length,
    fonts: totalSize(fonts),
    initialJavaScript: totalSize(initialJavaScript),
    javascriptBundles: totalSize(javascriptBundles),
    ownResources: totalSize(files),
  };
}

function allFiles(directory) {
  const entries = [];
  const pending = [directory];

  while (pending.length > 0) {
    const current = pending.pop();

    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const path = join(current, entry.name);
      if (entry.isDirectory()) {
        pending.push(path);
      } else if (entry.isFile()) {
        entries.push(path);
      }
    }
  }

  return entries;
}

function referencedCriticalResources(directory, basePath) {
  const indexPath = join(directory, "index.html");
  if (!existsSync(indexPath)) {
    throw new Error(`Static output does not contain index.html: ${directory}`);
  }

  const html = readFileSync(indexPath, "utf8");
  const urls = [
    ...html.matchAll(/<(?:script|link)\b[^>]+(?:src|href)="([^"]+)"/g),
  ].map((match) => match[1]);

  const resources = urls
    .filter((url) => url.startsWith(basePath))
    .map((url) => ({
      path: resolve(directory, `.${url.slice(basePath.length - 1)}`),
      url,
    }));

  for (const resource of resources) {
    if (!statExists(resource.path)?.isFile()) {
      throw new Error(`Referenced critical resource is unavailable: ${resource.url}`);
    }
  }

  return resources.map((resource) => resource.path);
}

function totalSize(files) {
  return files.reduce((total, file) => total + statSync(file).size, 0);
}

function appendSummary(path, measurement) {
  const mobileScore = measurement.mobileMedian.toFixed(0);
  const desktopScore = performanceScore(measurement.desktopReport).toFixed(0);
  const mobileAudits = medianAudits(measurement.mobileReports);
  const desktopAudits = auditValues(measurement.desktopReport);
  const metrics = measurement.deterministicMetrics;
  const summary = [
    "## Medición de rendimiento",
    "",
    `- Output estático servido localmente: \`${measurement.url}\``,
    `- Perfil mobile versionado: \`lighthouse-mobile-profile.json\``,
    `- Ruta pública medida: \`${measurement.publicPath}\``,
    "- Esta fase informa resultados; no declara budgets, objetivos ni límites.",
    "",
    "### Lighthouse mobile (mediana de 3 ejecuciones)",
    "",
    lighthouseTable(mobileScore, mobileAudits),
    "",
    "### Lighthouse desktop (observacional)",
    "",
    lighthouseTable(desktopScore, desktopAudits),
    "",
    "### Métricas deterministas",
    "",
    "| Métrica | Valor |",
    "| --- | ---: |",
    `| JavaScript inicial | ${metrics.initialJavaScript} bytes |`,
    `| Bundles JavaScript | ${metrics.javascriptBundles} bytes |`,
    `| Fuentes | ${metrics.fonts} bytes |`,
    `| Recursos propios | ${metrics.ownResources} bytes |`,
    `| Requests críticos | ${metrics.criticalRequests} |`,
    "",
  ].join("\n");

  writeFileSync(path, summary, { flag: "a" });
}

function medianAudits(reports) {
  const names = [
    "first-contentful-paint",
    "largest-contentful-paint",
    "total-blocking-time",
    "cumulative-layout-shift",
    "interactive",
  ];

  return Object.fromEntries(
    names.map((name) => [
      name,
      median(reports.map((report) => auditValues(report)[name])),
    ]),
  );
}

function auditValues(report) {
  const values = {};

  for (const name of [
    "first-contentful-paint",
    "largest-contentful-paint",
    "total-blocking-time",
    "cumulative-layout-shift",
    "interactive",
  ]) {
    const value = report.audits?.[name]?.numericValue;
    if (typeof value !== "number") {
      throw new Error(`Lighthouse report does not include ${name}.`);
    }
    values[name] = value;
  }

  return values;
}

function lighthouseTable(score, audits) {
  return [
    "| Métrica | Valor |",
    "| --- | ---: |",
    `| Performance | ${score} |`,
    `| First Contentful Paint | ${audits["first-contentful-paint"].toFixed(0)} ms |`,
    `| Largest Contentful Paint | ${audits["largest-contentful-paint"].toFixed(0)} ms |`,
    `| Total Blocking Time | ${audits["total-blocking-time"].toFixed(0)} ms |`,
    `| Cumulative Layout Shift | ${audits["cumulative-layout-shift"].toFixed(3)} |`,
    `| Time to Interactive | ${audits.interactive.toFixed(0)} ms |`,
  ].join("\n");
}
