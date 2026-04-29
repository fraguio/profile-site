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
