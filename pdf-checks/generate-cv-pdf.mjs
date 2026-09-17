import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { textFromPdf } from "../scripts/pdf-text.mjs";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const fixturePath = fileURLToPath(
  new URL("../test/fixtures/fictitious-resume.json", import.meta.url),
);
const publicBaseUrl = "https://fraguio.github.io/profile-site/";

function temporaryDirectory(t) {
  const directory = mkdtempSync(join(projectRoot, "test-pdf-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));

  return directory;
}

function run(command, args, environment = {}) {
  return spawnSync(command, args, {
    cwd: projectRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      ...environment,
    },
  });
}

function build(outputDirectory) {
  const outputDirectoryArgument = process.platform === "win32"
    ? basename(outputDirectory)
    : outputDirectory;

  return run(
    process.platform === "win32" ? process.env.ComSpec : "pnpm",
    process.platform === "win32"
      ? ["/d", "/s", "/c", `pnpm build --outDir ${outputDirectoryArgument}`]
      : ["build", "--outDir", outputDirectoryArgument],
    {
      PROFILE_SITE_BASE_URL: publicBaseUrl,
      RESUME_PATH: fixturePath,
    },
  );
}

function generatePdf(outputDirectory, environment) {
  return run(
    process.execPath,
    ["scripts/generate-cv-pdf.mjs", outputDirectory],
    {
      PROFILE_SITE_BASE_URL: publicBaseUrl,
      ...environment,
    },
  );
}

test("el generador opt-in deriva un CV PDF válido desde el CV web construido", async (t) => {
  const outputDirectory = temporaryDirectory(t);
  const buildResult = build(outputDirectory);

  assert.equal(buildResult.status, 0, `${buildResult.stdout}\n${buildResult.stderr}`);

  const assetsDirectory = join(outputDirectory, "assets");
  const assetPath = join(assetsDirectory, "pdf-test.css");
  const readDocumentPath = join(outputDirectory, "read", "index.html");

  mkdirSync(assetsDirectory);
  writeFileSync(
    assetPath,
    'main::before { content: "Recurso estático del CV"; display: block; }',
  );
  writeFileSync(
    readDocumentPath,
    readFileSync(readDocumentPath, "utf8").replace(
      "</head>",
      '<link rel="stylesheet" href="/profile-site/assets/pdf-test.css"></head>',
    ),
  );

  const result = generatePdf(outputDirectory);
  const pdfPath = join(outputDirectory, "cv", "eduardo-nogueira-fraguio-cv.pdf");

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /CV PDF generated: \d+ pages?\./);
  assert.equal(existsSync(pdfPath), true);

  const pdf = readFileSync(pdfPath);

  assert.ok(pdf.length > 0);
  assert.equal(pdf.subarray(0, 5).toString("ascii"), "%PDF-");
  assert.match(pdf.toString("latin1"), /\/Type\s*\/Page\b/);
  const text = await textFromPdf(pdf);

  for (const content of [
    "Alicia Ejemplo",
    "Especialista en sistemas ficticios",
    "Construye sistemas comprensibles a partir de hechos verificables.",
    "Arquitecta de software",
    "Dirige la evolución de productos con equipos multidisciplinares.",
    "Redujo el tiempo de entrega.",
    "Ingeniera de plataforma",
    "Mantuvo servicios críticos.",
    "Proyecto Vigente",
    "Responsable técnica",
    "Publicó un prototipo funcional.",
    "Proyecto con inicio posterior",
    "Refinó la plataforma existente.",
    "Proyecto de Empate",
    "Amplió la plataforma existente.",
    "Grado en Ingeniería de software",
    "Instituto Ficticio",
    "Arquitectura de sistemas",
    "Diseño de sistemas",
    "Recurso estático del CV",
  ]) {
    assert.match(text, new RegExp(content));
  }

  const webCv = readFileSync(join(outputDirectory, "read", "index.html"), "utf8");

  assert.match(webCv, /Liberation Sans,Arial,Helvetica,sans-serif/);
  assert.match(webCv, /@page\{margin:2cm;size:A4}/);
  assert.match(webCv, /data-contract="read-actions"/);
});

test("el generador falla con diagnóstico si falta el CV web", (t) => {
  const outputDirectory = temporaryDirectory(t);

  const result = generatePdf(outputDirectory);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /CV web HTML not found/);
});

test("el generador falla con diagnóstico si Chromium no está disponible", (t) => {
  const outputDirectory = temporaryDirectory(t);
  const browserDirectory = temporaryDirectory(t);
  const buildResult = build(outputDirectory);

  assert.equal(buildResult.status, 0, `${buildResult.stdout}\n${buildResult.stderr}`);

  const result = generatePdf(outputDirectory, {
    PLAYWRIGHT_BROWSERS_PATH: browserDirectory,
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Unable to launch Chromium/);
});

test("el generador falla si el PDF omite contenido factual del CV web", (t) => {
  const outputDirectory = temporaryDirectory(t);
  const buildResult = build(outputDirectory);
  const readDocumentPath = join(outputDirectory, "read", "index.html");

  assert.equal(buildResult.status, 0, `${buildResult.stdout}\n${buildResult.stderr}`);
  writeFileSync(
    readDocumentPath,
    readFileSync(readDocumentPath, "utf8").replace(
      "</head>",
      '<style media="print">h2 { display: none; }</style></head>',
    ),
  );

  const result = generatePdf(outputDirectory);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /does not preserve factual content/);
});
