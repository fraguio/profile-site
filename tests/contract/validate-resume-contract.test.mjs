import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const thisFile = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(thisFile), "..", "..");
const validatorScriptPath = path.join(rootDir, "scripts", "validate-resume-contract.mjs");
const schemaPath = path.join(rootDir, "schema", "resume-schema-v1.2.1.json");

function runValidation(resumePayload) {
  const tempDir = mkdtempSync(path.join(os.tmpdir(), "profile-site-validate-"));
  const resumePath = path.join(tempDir, "resume.json");
  writeFileSync(resumePath, JSON.stringify(resumePayload), "utf8");

  const result = spawnSync(
    process.execPath,
    [validatorScriptPath, "--resume", resumePath, "--schema", schemaPath],
    {
      cwd: rootDir,
      encoding: "utf8"
    }
  );

  rmSync(tempDir, { recursive: true, force: true });
  return result;
}

test("fails hard with actionable diagnostics on schema violations", () => {
  const result = runValidation({ basics: { name: 42 } });
  const combinedOutput = `${result.stdout}\n${result.stderr}`;

  assert.equal(result.status, 1);
  assert.match(combinedOutput, /JSON Resume v1\.2\.1 validation failed/);
  assert.match(combinedOutput, /field=basics\.name/);
  assert.match(combinedOutput, /rule=type/);
  assert.match(combinedOutput, /root_cause=must be string/);
});

test("passes when payload matches schema", () => {
  const result = runValidation({ basics: { name: "Ada Lovelace" } });
  const combinedOutput = `${result.stdout}\n${result.stderr}`;

  assert.equal(result.status, 0);
  assert.match(combinedOutput, /JSON Resume v1\.2\.1 validation passed\./);
});
