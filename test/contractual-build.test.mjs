import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { textFromPdf } from "../scripts/pdf-text.mjs";

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

function assertOpenGraphMetadata(html, title, description, url) {
  for (const [property, content] of [
    ["og:title", title],
    ["og:description", description],
    ["og:url", url],
    ["og:type", "profile"],
    ["og:locale", "es_ES"],
  ]) {
    assert.ok(html.includes(`<meta property="${property}" content="${content}"`));
  }

  assert.doesNotMatch(html, /property="og:image"/);
}

function structuredDataFrom(html) {
  const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);

  assert.ok(match, "Expected JSON-LD in the interactive experience.");

  const structuredData = JSON.parse(match[1]);

  return {
    structuredData,
    person: structuredData["@graph"].find((item) => item["@type"] === "Person"),
    profilePage: structuredData["@graph"].find(
      (item) => item["@type"] === "ProfilePage",
    ),
  };
}

test("the contractual build produces the PDF and HTML outputs from the selected fixture", (t) => {
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
  assert.match(
    interactiveExperience,
    /href="\/profile-site\/cv\/eduardo-nogueira-fraguio-cv\.pdf"[^>]*>(?:<svg\b[^]*?<\/svg>)?Descargar CV PDF<\/a>/,
  );
  assert.match(webCv, /Alicia Ejemplo/);
  assert.doesNotMatch(webCv, /projects\.example\.test|Ver proyecto/);
  assert.match(webCv, /href="\/profile-site\/"/);
  assert.match(
    webCv,
    /<a data-contract="read-download-pdf" download href="\/profile-site\/cv\/eduardo-nogueira-fraguio-cv\.pdf">Descargar CV PDF<\/a>/,
  );
  assert.equal(
    existsSync(join(outputDirectory, "cv", "eduardo-nogueira-fraguio-cv.pdf")),
    true,
  );
  assert.equal(
    readFileSync(
      join(outputDirectory, "cv", "eduardo-nogueira-fraguio-cv.pdf"),
    ).subarray(0, 5).toString("ascii"),
    "%PDF-",
  );
});

test("the interactive experience publishes complete metadata at its public URL", (t) => {
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

  assert.match(
    interactiveExperience,
    /<title>Alicia Ejemplo \| Especialista en sistemas ficticios<\/title>/,
  );
  assert.match(
    interactiveExperience,
    /<meta name="description" content="Trayectoria profesional de Alicia Ejemplo, especialista en sistemas ficticios\."/,
  );
  assert.match(
    interactiveExperience,
    /<link rel="canonical" href="https:\/\/fraguio\.github\.io\/profile-site\/"/,
  );

  assertOpenGraphMetadata(
    interactiveExperience,
    "Alicia Ejemplo | Especialista en sistemas ficticios",
    "Trayectoria profesional de Alicia Ejemplo, especialista en sistemas ficticios.",
    "https://fraguio.github.io/profile-site/",
  );
});

test("the interactive experience publishes public Person and ProfilePage structured data", (t) => {
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
  const { structuredData, person, profilePage } = structuredDataFrom(
    interactiveExperience,
  );

  assert.deepEqual(person, {
    "@id": "https://fraguio.github.io/profile-site/#person",
    "@type": "Person",
    name: "Alicia Ejemplo",
    jobTitle: "Especialista en sistemas ficticios",
    description: "Construye sistemas comprensibles a partir de hechos verificables.",
    url: "https://alicia.example.test",
    sameAs: [
      "https://www.linkedin.com/in/alicia-ejemplo",
      "https://github.com/alicia-ejemplo",
      "https://mastodon.social/@alicia-ejemplo",
    ],
  });
  assert.deepEqual(profilePage, {
    "@type": "ProfilePage",
    name: "Alicia Ejemplo | Especialista en sistemas ficticios",
    description: "Trayectoria profesional de Alicia Ejemplo, especialista en sistemas ficticios.",
    url: "https://fraguio.github.io/profile-site/",
    mainEntity: {
      "@id": "https://fraguio.github.io/profile-site/#person",
    },
  });

  for (const privateValue of [
    "+34 600 000 000",
    "Calle Privada 1",
    "28000",
    "retrato.jpg",
    "Sección no soportada",
  ]) {
    assert.equal(JSON.stringify(structuredData).includes(privateValue), false);
  }
});

test("the web CV publishes complete metadata at its public URL", (t) => {
  const outputDirectory = temporaryOutputDirectory(t);

  const result = build(outputDirectory, {
    PROFILE_SITE_BASE_URL: "https://fraguio.github.io/profile-site/",
    RESUME_PATH: fixturePath,
  });

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);

  const webCv = readFileSync(join(outputDirectory, "read", "index.html"), "utf8");

  assert.match(webCv, /<title>CV web \| Alicia Ejemplo<\/title>/);
  assert.match(
    webCv,
    /<meta name="description" content="CV web de Alicia Ejemplo, especialista en sistemas ficticios\."/,
  );
  assert.match(
    webCv,
    /<link rel="canonical" href="https:\/\/fraguio\.github\.io\/profile-site\/read\/"/,
  );

  assertOpenGraphMetadata(
    webCv,
    "CV web | Alicia Ejemplo",
    "CV web de Alicia Ejemplo, especialista en sistemas ficticios.",
    "https://fraguio.github.io/profile-site/read/",
  );
});

test("the contractual build recomposes metadata and navigation below another public base path", (t) => {
  const outputDirectory = temporaryOutputDirectory(t);
  const publicBaseUrl = "https://profiles.example.test/candidates/alicia/";

  const result = build(outputDirectory, {
    PROFILE_SITE_BASE_URL: publicBaseUrl,
    RESUME_PATH: fixturePath,
  });

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);

  const interactiveExperience = readFileSync(
    join(outputDirectory, "index.html"),
    "utf8",
  );
  const webCv = readFileSync(join(outputDirectory, "read", "index.html"), "utf8");
  const webCvUrl = `${publicBaseUrl}read/`;

  for (const [html, url] of [
    [interactiveExperience, publicBaseUrl],
    [webCv, webCvUrl],
  ]) {
    assert.match(html, new RegExp(`<link rel="canonical" href="${url}"`));
    assert.match(html, new RegExp(`<meta property="og:url" content="${url}"`));
    assert.equal((html.match(/<title>/g) ?? []).length, 1);
    assert.equal((html.match(/<meta name="description"/g) ?? []).length, 1);
    assert.equal((html.match(/<meta name="description" content="[^"].*?"/g) ?? []).length, 1);
    assert.equal((html.match(/<link rel="canonical"/g) ?? []).length, 1);
    assert.equal((html.match(/<link rel="canonical" href="[^"].*?"/g) ?? []).length, 1);

    for (const property of [
      "og:title",
      "og:description",
      "og:url",
      "og:type",
      "og:locale",
    ]) {
      assert.equal(
        (html.match(new RegExp(`<meta property="${property}"`, "g")) ?? []).length,
        1,
      );
      assert.equal(
        (html.match(new RegExp(`<meta property="${property}" content="[^"].*?"`, "g")) ?? []).length,
        1,
      );
    }
  }

  assert.match(interactiveExperience, /href="\/candidates\/alicia\/read\/"/);
  assert.match(webCv, /href="\/candidates\/alicia\/"/);
  assert.doesNotMatch(interactiveExperience, /https:\/\/profiles\.example\.test\/["#]/);
  assert.doesNotMatch(webCv, /https:\/\/profiles\.example\.test\/["#]/);

  const { person, profilePage } = structuredDataFrom(interactiveExperience);

  assert.equal(person["@id"], `${publicBaseUrl}#person`);
  assert.equal(profilePage.url, publicBaseUrl);
});

test("el CV web presenta el currículo compatible completo como documento semántico", (t) => {
  const outputDirectory = temporaryOutputDirectory(t);

  const result = build(outputDirectory, {
    PROFILE_SITE_BASE_URL: "https://fraguio.github.io/profile-site/",
    RESUME_PATH: fixturePath,
  });

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);

  const webCv = readFileSync(join(outputDirectory, "read", "index.html"), "utf8");

  for (const content of [
    "Alicia Ejemplo",
    "Especialista en sistemas ficticios",
    "alicia.ejemplo@example.test",
    "https://alicia.example.test",
    "LinkedIn",
    "GitHub",
    "Mastodon",
    "Madrid, Comunidad de Madrid, España",
    "Construye sistemas comprensibles a partir de hechos verificables.",
    "Arquitecta de software",
    "Dirige la evolución de productos con equipos multidisciplinares.",
    "Redujo el tiempo de entrega.",
    "Astro",
    "Proyecto Vigente",
    "Responsable técnica",
    "Publicó un prototipo funcional.",
    "Node.js",
    "Grado en Ingeniería de software",
    "Instituto Ficticio",
    "Arquitectura de sistemas",
    "Diseño de sistemas",
  ]) {
    assert.match(webCv, new RegExp(content));
  }

  assert.match(webCv, /<main>/);
  assert.match(webCv, /<header>/);
  assert.match(webCv, /<address>/);
  assert.match(webCv, /<section aria-labelledby="work-heading">/);
  assert.match(webCv, /<section aria-labelledby="projects-heading">/);
  assert.match(webCv, /<section aria-labelledby="education-heading">/);
  assert.match(webCv, /<ol>/);
  assert.match(webCv, /<article>/);
  assert.match(webCv, /<time datetime="2025-01">\s*enero de 2025\s*<\/time>/);
  assert.match(webCv, /<ul>/);

  for (const [earlier, later] of [
    ["Resumen profesional", "Experiencia profesional"],
    ["Experiencia profesional", "Proyectos"],
    ["Proyectos", "Formación"],
  ]) {
    assert.ok(
      webCv.indexOf(earlier) < webCv.indexOf(later),
      `Se esperaba ${earlier} antes de ${later}.`,
    );
  }

  assert.match(
    webCv,
    /<a data-contract="read-download-pdf" download href="\/profile-site\/cv\/eduardo-nogueira-fraguio-cv\.pdf">Descargar CV PDF<\/a>/,
  );
  assert.doesNotMatch(webCv, /<script[^>]+src=/);
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
  const body = interactiveExperience.match(/<body>([\s\S]*)<\/body>/)?.[1];

  assert.ok(body, "Expected a body in the interactive experience.");

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
    ["/profile-site/cv/eduardo-nogueira-fraguio-cv.pdf", "Descargar CV PDF"],
    ["mailto:alicia.ejemplo@example.test", "Contactar"],
    ["https://alicia.example.test", "Sitio web"],
    ["https://www.linkedin.com/in/alicia-ejemplo", "LinkedIn"],
    ["https://github.com/alicia-ejemplo", "GitHub"],
    ["https://mastodon.social/@alicia-ejemplo", "Mastodon"],
    ["https://projects.example.test/distributed?view=public#overview", "Ver proyecto"],
  ]) {
    assert.match(
      interactiveExperience,
      new RegExp(`href="${url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^>]*>(?:<svg\\b[^]*?<\\/svg>)?${label}(?:<svg\\b[^]*?<\\/svg>)?<\\/a>`),
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
    body.indexOf("Leer CV web") >
      body.indexOf(
        "Construye sistemas comprensibles a partir de hechos verificables.",
      ),
  );
  assert.ok(
    body.indexOf("LinkedIn") < body.indexOf("Mastodon"),
  );
  assert.ok(
    body.indexOf("GitHub") < body.indexOf("Mastodon"),
  );
  assert.ok(
    body.indexOf("Arquitecta de software") < body.indexOf("Proyecto Vigente"),
  );
  assert.ok(
    body.indexOf("Proyecto Vigente") < body.indexOf("Instituto Ficticio"),
  );
  assert.ok(
    body.indexOf("Instituto Ficticio") < body.indexOf("Empresa de Origen"),
  );
  assert.ok(
    body.indexOf("Proyecto con inicio posterior") < body.indexOf("Empresa de Origen"),
  );
  assert.ok(
    body.indexOf("Empresa de Origen") < body.indexOf("Proyecto de Empate"),
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
  assert.match(
    body,
    /<fieldset[^>]*data-contract="timeline-filters"[^>]*hidden/,
  );
  assert.doesNotMatch(body, /data-contract="timeline-reader"/);
  assert.equal((body.match(/>Ver proyecto<svg\b/g) ?? []).length, 1);
  assert.match(body, /<h4>Descripción<\/h4>/);
  assert.match(body, /<h4>Contribuciones<\/h4>/);
  assert.match(body, /<h4>Contenidos<\/h4>/);
});

test("la Experiencia interactiva mantiene los filtros ocultos sin JavaScript", (t) => {
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

  assert.match(
    interactiveExperience,
    /<fieldset[^>]*data-contract="timeline-filters"[^>]*hidden/,
  );
  assert.match(interactiveExperience, /<button[^>]*value="all"/);
  assert.match(interactiveExperience, /<button[^>]*value="work"/);
  assert.match(interactiveExperience, /<button[^>]*value="projects"/);
  assert.match(interactiveExperience, /<button[^>]*value="education"/);
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

test("las extensiones y sus fallbacks conservan los hechos entre HTML y CV PDF", async (t) => {
  const outputDirectory = temporaryOutputDirectory(t);
  const source = JSON.parse(readFileSync(fixturePathFor("valid-resume-with-independent-blocks.json"), "utf8"));
  source.work.push(
    { name: "Contratante del cliente", position: "Rol del cliente", clientName: "Cliente sin proyecto", startDate: "2019" },
    { name: "Contratante del proyecto", position: "Rol del proyecto", projectName: "Proyecto sin cliente", startDate: "2018" },
  );
  source.education[1].courses = ["Curso de fallback con details vacío"];
  const sourcePath = join(temporaryOutputDirectory(t), "resume.json");
  writeFileSync(sourcePath, JSON.stringify(source));
  const result = build(outputDirectory, {
    PROFILE_SITE_BASE_URL: "https://fraguio.github.io/profile-site/",
    RESUME_PATH: sourcePath,
  });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  const outputs = [
    readFileSync(join(outputDirectory, "index.html"), "utf8"),
    readFileSync(join(outputDirectory, "read", "index.html"), "utf8"),
    (await textFromPdf(readFileSync(join(outputDirectory, "cv", "eduardo-nogueira-fraguio-cv.pdf")))).replace(/\s+/g, " "),
  ];
  for (const output of outputs) {
    for (const content of [
      "Cliente Ficticio — Integración de canales y plataformas distribuidas",
      "Contratante Ficticia", "Participación sin prosa",
      "Cliente sin proyecto", "Contratante del cliente", "Rol del cliente",
      "Proyecto sin cliente", "Contratante del proyecto", "Rol del proyecto",
      "Empresa sin posición declarada",
      "Formación avanzada en integración de sistemas distribuidos",
      "Diseño de APIs y contratos de integración.", "Despliegue y observabilidad de servicios.",
      "Formación solo con habilidades", "Curso de fallback con details vacío",
    ]) assert.ok(output.includes(content), `Expected content: ${content}`);
    assert.equal((output.match(/Diseño de APIs y contratos de integración\./g) ?? []).length, 2);
    assert.ok(!output.includes("Contenido independiente de la descripción."));
  }
});

for (const [details, diagnostics] of [
  [["", 42], [
    'resume.education[0].details[0]: "" violates local rule "must be a non-empty string".',
    'resume.education[0].details[1]: 42 violates local rule "must be a non-empty string".',
  ]],
  ["not an array", ['resume.education[0].details: "not an array" violates local rule "must be an array of non-empty strings".']],
]) {
  test(`el build rechaza las extensiones inválidas con details ${JSON.stringify(details)}`, (t) => {
    const outputDirectory = temporaryOutputDirectory(t);
    const source = JSON.parse(readFileSync(fixturePath, "utf8"));
    Object.assign(source.work[0], { clientName: "   ", projectName: 42 });
    Object.assign(source.education[0], { title: "", details });
    const sourcePath = join(temporaryOutputDirectory(t), "invalid-resume.json");
    writeFileSync(sourcePath, JSON.stringify(source));
    const result = build(outputDirectory, {
      PROFILE_SITE_BASE_URL: "https://fraguio.github.io/profile-site/",
      RESUME_PATH: sourcePath,
    });
    assert.notEqual(result.status, 0);
    for (const diagnostic of [
      'resume.work[0].clientName: "   " violates local rule "must be a non-empty string".',
      'resume.work[0].projectName: 42 violates local rule "must be a non-empty string".',
      'resume.education[0].title: "" violates local rule "must be a non-empty string".',
      ...diagnostics,
    ]) {
      assert.ok(`${result.stdout}\n${result.stderr}`.includes(diagnostic), `Expected diagnostic: ${diagnostic}\n${result.stdout}\n${result.stderr}`);
    }
    assert.equal(existsSync(join(outputDirectory, "index.html")), false);
  });
}

for (const [description, fixture, diagnostic] of [
  [
    "una URL de proyecto inválida",
    "invalid-project-url.json",
    'resume.projects[0].url: "not a URL" violates JSON Resume 1.3.1 schema: must match format "uri".',
  ],
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
