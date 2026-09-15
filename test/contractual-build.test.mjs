import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const fixturePath = fileURLToPath(
  new URL("fixtures/fictitious-resume.json", import.meta.url),
);

function fixturePathFor(name) {
  return fileURLToPath(new URL(`fixtures/${name}`, import.meta.url));
}

function temporaryOutputDirectory(t) {
  const outputDirectory = mkdtempSync(join(projectRoot, "test-build-"));
  t.after(() => rmSync(outputDirectory, { recursive: true, force: true }));

  return outputDirectory;
}

function build(outputDirectory, environment) {
  const isWindows = process.platform === "win32";
  const outputDirectoryArgument = isWindows
    ? basename(outputDirectory)
    : outputDirectory;
  const environmentVariables = {
    ...process.env,
    ...environment,
  };

  for (const [name, value] of Object.entries(environment)) {
    if (value === undefined) {
      delete environmentVariables[name];
    }
  }

  return spawnSync(
    isWindows ? process.env.ComSpec : "pnpm",
    isWindows
      ? ["/d", "/s", "/c", `pnpm build --outDir ${outputDirectoryArgument}`]
      : ["build", "--outDir", outputDirectoryArgument],
    {
      cwd: projectRoot,
      encoding: "utf8",
      env: environmentVariables,
    },
  );
}

test("the contractual build produces the Base HTML outputs from the selected fixture", (t) => {
  const outputDirectory = temporaryOutputDirectory(t);

  const result = build(outputDirectory, {
    PROFILE_SITE_BASE_URL: "https://fraguio.github.io/profile-site/",
    RESUME_PATH: fixturePath,
  });

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);

  const interactiveExperience = readFileSync(
    join(outputDirectory, "index.html"),
    "utf8",
  );
  const webCv = readFileSync(join(outputDirectory, "read", "index.html"), "utf8");

  assert.match(interactiveExperience, /Alicia Ejemplo/);
  assert.match(interactiveExperience, /href="\/profile-site\/read\/"/);
  assert.match(webCv, /Alicia Ejemplo/);
  assert.match(webCv, /href="\/profile-site\/"/);
  assert.equal(
    existsSync(join(outputDirectory, "cv", "eduardo-nogueira-fraguio-cv.pdf")),
    false,
  );
});

test("the interactive experience presents the supported trajectory without JavaScript", (t) => {
  const outputDirectory = temporaryOutputDirectory(t);

  const result = build(outputDirectory, {
    PROFILE_SITE_BASE_URL: "https://fraguio.github.io/profile-site/",
    RESUME_PATH: fixturePath,
  });

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);

  const interactiveExperience = readFileSync(
    join(outputDirectory, "index.html"),
    "utf8",
  );

  for (const content of [
    "Alicia Ejemplo",
    "Especialista en sistemas ficticios",
    "Construye sistemas comprensibles a partir de hechos verificables.",
    "Arquitecta de software",
    "Empresa dedicada a sistemas de aprendizaje.",
    "Dirige la evolución de productos con equipos multidisciplinares.",
    "Redujo el tiempo de entrega.",
    "Astro",
    "Proyecto Vigente",
    "Explora una herramienta para equipos distribuidos.",
    "Responsable técnica",
    "Node.js",
    "Grado en Ingeniería de software",
    "Instituto Ficticio",
    "Arquitectura de sistemas",
    "Diseño de sistemas",
    "España",
    "enero de 2025",
    "Actualidad",
    "Experiencia profesional",
    "Formación",
    "Proyectos",
  ]) {
    assert.match(interactiveExperience, new RegExp(content));
  }

  for (const [url, label] of [
    ["/profile-site/read/", "Leer CV web"],
    ["mailto:alicia.ejemplo@example.test", "Contactar"],
    ["https://alicia.example.test", "Sitio web"],
    ["https://www.linkedin.com/in/alicia-ejemplo", "LinkedIn"],
    ["https://github.com/alicia-ejemplo", "GitHub"],
    ["https://mastodon.social/@alicia-ejemplo", "Mastodon"],
  ]) {
    assert.match(
      interactiveExperience,
      new RegExp(`href="${url.replaceAll("/", "\\/")}"[^>]*>${label}`),
    );
  }

  for (const content of [
    "Proyecto Vigente",
    "Instituto Ficticio",
    "Empresa de Origen",
    "Proyecto de Empate",
  ]) {
    assert.ok(
      interactiveExperience.indexOf(content) > 0,
      `Expected ${content} in the timeline.`,
    );
  }

  assert.ok(
    interactiveExperience.indexOf("Leer CV web") <
      interactiveExperience.indexOf(
        "Construye sistemas comprensibles a partir de hechos verificables.",
      ),
  );
  assert.ok(
    interactiveExperience.indexOf("LinkedIn") <
      interactiveExperience.indexOf("Mastodon"),
  );
  assert.ok(
    interactiveExperience.indexOf("GitHub") <
      interactiveExperience.indexOf("Mastodon"),
  );
  assert.ok(
    interactiveExperience.indexOf("Arquitecta de software") <
      interactiveExperience.indexOf("Proyecto Vigente"),
  );
  assert.ok(
    interactiveExperience.indexOf("Proyecto Vigente") <
      interactiveExperience.indexOf("Instituto Ficticio"),
  );
  assert.ok(
    interactiveExperience.indexOf("Instituto Ficticio") <
      interactiveExperience.indexOf("Empresa de Origen"),
  );
  assert.ok(
    interactiveExperience.indexOf("Proyecto con inicio posterior") <
      interactiveExperience.indexOf("Empresa de Origen"),
  );
  assert.ok(
    interactiveExperience.indexOf("Empresa de Origen") <
      interactiveExperience.indexOf("Proyecto de Empate"),
  );
  assert.equal((interactiveExperience.match(/Redujo el tiempo de entrega\./g) ?? []).length, 1);
  assert.equal((interactiveExperience.match(/>Astro</g) ?? []).length, 1);
  assert.doesNotMatch(interactiveExperience, /Catálogo global oculto/);
  assert.doesNotMatch(interactiveExperience, /metadatos\.example\.test/);
  assert.doesNotMatch(interactiveExperience, /Sección no soportada/);
  assert.doesNotMatch(interactiveExperience, /\+34 600 000 000/);
  assert.doesNotMatch(interactiveExperience, /Calle Privada 1/);
  assert.doesNotMatch(interactiveExperience, /28000/);
  assert.doesNotMatch(interactiveExperience, /retrato\.jpg/);
  assert.doesNotMatch(interactiveExperience, /<script/);
});

test("the interactive experience omits an empty timeline", (t) => {
  const outputDirectory = temporaryOutputDirectory(t);

  const result = build(outputDirectory, {
    PROFILE_SITE_BASE_URL: "https://fraguio.github.io/profile-site/",
    RESUME_PATH: fixturePathFor("valid-resume-without-timeline.json"),
  });

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);

  const interactiveExperience = readFileSync(
    join(outputDirectory, "index.html"),
    "utf8",
  );

  assert.doesNotMatch(interactiveExperience, /timeline-heading/);
  assert.doesNotMatch(interactiveExperience, />Trayectoria</);
  assert.doesNotMatch(interactiveExperience, /<ol>/);
});

test("the contractual build accepts local work and education skills without top-level skills", (t) => {
  const outputDirectory = temporaryOutputDirectory(t);

  const result = build(outputDirectory, {
    PROFILE_SITE_BASE_URL: "https://fraguio.github.io/profile-site/",
    RESUME_PATH: fixturePathFor("valid-resume-with-local-skills.json"),
  });

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
});

for (const [description, fixture, diagnostic] of [
  [
    "a schema-invalid source",
    "invalid-schema.json",
    'resume.basics: "not an object" violates JSON Resume 1.3.1 schema',
  ],
  [
    "an empty work skill",
    "invalid-empty-work-skill.json",
    'resume.work[0].skills[0]: "" violates local rule "must be a non-empty string".',
  ],
  [
    "an empty education skill",
    "invalid-empty-education-skill.json",
    'resume.education[0].skills[0]: "" violates local rule "must be a non-empty string".',
  ],
  [
    "an invalid date",
    "invalid-date.json",
    'resume.work[0].startDate: "2024-02-30" violates local rule "must be a valid ISO 8601 date".',
  ],
  [
    "an end date before its start date",
    "invalid-date-range.json",
    'resume.projects[0].endDate: "2023-12-31" violates local rule "must not be earlier than startDate \"2024-01-01\"".',
  ],
  [
    "a presentation-required field",
    "invalid-required-presentation-field.json",
    'resume.basics.name: "" violates local presentation rule "is required and must be a non-empty string".',
  ],
]) {
  test(`the contractual build rejects ${description} before rendering`, (t) => {
    const outputDirectory = temporaryOutputDirectory(t);

    const result = build(outputDirectory, {
      PROFILE_SITE_BASE_URL: "https://fraguio.github.io/profile-site/",
      RESUME_PATH: fixturePathFor(fixture),
    });

    assert.notEqual(result.status, 0);
    assert.ok(
      `${result.stdout}\n${result.stderr}`.includes(diagnostic),
      `Expected diagnostic: ${diagnostic}`,
    );
    assert.equal(existsSync(join(outputDirectory, "index.html")), false);
  });
}

for (const [description, baseUrl, diagnostic] of [
  ["an absent URL", undefined, "PROFILE_SITE_BASE_URL is required."],
  ["a non-HTTPS URL", "http://fraguio.github.io/profile-site/", "PROFILE_SITE_BASE_URL must use HTTPS."],
  ["a URL with a query", "https://fraguio.github.io/profile-site/?preview=true", "PROFILE_SITE_BASE_URL must not include a query string."],
  ["a URL with a fragment", "https://fraguio.github.io/profile-site/#cv", "PROFILE_SITE_BASE_URL must not include a fragment."],
  ["a URL without a final slash", "https://fraguio.github.io/profile-site", "PROFILE_SITE_BASE_URL must end with a slash."],
]) {
  test(`the contractual build rejects ${description}`, (t) => {
    const outputDirectory = temporaryOutputDirectory(t);

    const result = build(outputDirectory, {
      PROFILE_SITE_BASE_URL: baseUrl,
      RESUME_PATH: fixturePath,
    });

    assert.notEqual(result.status, 0);
    assert.ok(
      `${result.stdout}\n${result.stderr}`.includes(diagnostic),
      `Expected diagnostic: ${diagnostic}`,
    );
  });
}
