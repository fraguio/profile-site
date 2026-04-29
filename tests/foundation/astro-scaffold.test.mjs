import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const thisFile = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(thisFile), "..", "..");

function readJson(relativePath) {
  const absolutePath = path.join(rootDir, relativePath);
  const content = readFileSync(absolutePath, "utf8");
  return JSON.parse(content);
}

test("root npm scaffold defines Astro project metadata", () => {
  const packageJsonPath = path.join(rootDir, "package.json");
  assert.equal(existsSync(packageJsonPath), true, "package.json should exist at repository root");

  const packageJson = readJson("package.json");
  assert.equal(packageJson.name, "profile-site");
  assert.equal(packageJson.private, true);
  assert.equal(packageJson.type, "module");
  assert.equal(typeof packageJson.devDependencies?.astro, "string");
});

test("root npm scaffold includes lockfile with Astro dependency", () => {
  const lockfilePath = path.join(rootDir, "package-lock.json");
  assert.equal(existsSync(lockfilePath), true, "package-lock.json should exist at repository root");

  const lockfile = readJson("package-lock.json");
  assert.equal(lockfile.name, "profile-site");
  assert.equal(lockfile.lockfileVersion >= 3, true);

  const rootPackage = lockfile.packages?.[""];
  assert.equal(typeof rootPackage?.devDependencies?.astro, "string");
});

test("root npm scaffold exposes build, validation, and lockfile install scripts", () => {
  const packageJson = readJson("package.json");

  assert.equal(packageJson.scripts?.build, "astro build");
  assert.equal(packageJson.scripts?.["validate:contract"], "node ./scripts/validate-resume-contract.mjs");
  assert.equal(packageJson.scripts?.["deps:ci"], "npm ci");
});

test("astro config and route skeletons exist for root and read routes", () => {
  const astroConfigPath = path.join(rootDir, "astro.config.mjs");
  assert.equal(existsSync(astroConfigPath), true, "astro.config.mjs should exist at repository root");

  const astroConfig = readFileSync(astroConfigPath, "utf8");
  assert.match(astroConfig, /output\s*:\s*["']static["']/);

  const rootRoutePath = path.join(rootDir, "src", "pages", "index.astro");
  const readRoutePath = path.join(rootDir, "src", "pages", "read", "index.astro");

  assert.equal(existsSync(rootRoutePath), true, "src/pages/index.astro should exist");
  assert.equal(existsSync(readRoutePath), true, "src/pages/read/index.astro should exist");
});

test("runtime constraints pin Node 20.19.x in CI and package metadata", () => {
  const packageJson = readJson("package.json");
  assert.equal(packageJson.engines?.node, ">=20.19 <21");

  const workflowPath = path.join(rootDir, ".github", "workflows", "profile-site-publish.yml");
  assert.equal(existsSync(workflowPath), true, "profile-site publish workflow should exist");

  const workflowContent = readFileSync(workflowPath, "utf8");
  assert.match(workflowContent, /uses:\s*actions\/setup-node@v4/);
  assert.match(workflowContent, /node-version:\s*20\.19\.x/);
});

test("json resume v1.2.1 schema is vendored for offline validation", () => {
  const schemaPath = path.join(rootDir, "schema", "resume-schema-v1.2.1.json");
  assert.equal(existsSync(schemaPath), true, "vendored schema file should exist");

  const schema = readJson("schema/resume-schema-v1.2.1.json");
  assert.equal(schema.$schema, "http://json-schema.org/draft-07/schema#");
  assert.equal(schema.title, "Resume Schema");
  assert.equal(schema.type, "object");
});
