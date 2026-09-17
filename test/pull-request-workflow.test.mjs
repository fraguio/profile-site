import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

const workflowPath = fileURLToPath(
  new URL("../.github/workflows/pull-request.yml", import.meta.url),
);
const performanceWorkflowPath = fileURLToPath(
  new URL("../.github/workflows/performance-gate.yml", import.meta.url),
);

test("el workflow de pull request ejecuta el gate Base sin permisos ni datos de publicación", () => {
  const workflow = readFileSync(workflowPath, "utf8");

  assert.match(workflow, /^on:\s*\n\s+pull_request:/m);
  assert.match(workflow, /^permissions:\s*\n\s+contents: read$/m);
  assert.match(workflow, /uses: actions\/checkout@/);
  assert.match(workflow, /uses: actions\/setup-node@/);
  assert.match(workflow, /node-version: 24/);
  assert.match(workflow, /uses: pnpm\/action-setup@/);
  assert.match(workflow, /version: 11\.5\.2/);
  assert.match(workflow, /pnpm install --frozen-lockfile/);
  assert.match(workflow, /pnpm check/);
  assert.match(workflow, /pnpm test:unit/);
  assert.match(workflow, /pnpm exec playwright install --with-deps chromium/);
  assert.match(workflow, /pnpm test:browser/);
  assert.match(workflow, /pnpm build/);
  assert.match(workflow, /pnpm measure:performance/);
  assert.match(workflow, /pnpm measure:performance \|\| status=\$\?/);
  assert.match(workflow, /cat "\$GITHUB_STEP_SUMMARY"/);
  assert.match(workflow, /PERFORMANCE_ENFORCE_BUDGETS: true/);
  assert.match(workflow, /PERFORMANCE_EVENT: pull_request/);
  assert.match(workflow, /RESUME_PATH: test\/fixtures\/fictitious-resume\.json/);
  assert.doesNotMatch(workflow, /secrets\./i);
  assert.doesNotMatch(workflow, /profile-data/i);
  assert.doesNotMatch(workflow, /deploy|pages|write/i);
});

test("el workflow de rendimiento aplica la matriz a push y dispatch con el perfil versionado", () => {
  const workflow = readFileSync(performanceWorkflowPath, "utf8");

  assert.match(workflow, /^\s+push:/m);
  assert.match(workflow, /^\s+repository_dispatch:/m);
  assert.match(workflow, /^\s+workflow_dispatch:/m);
  assert.match(workflow, /PROFILE_DATA_READ_TOKEN: \$\{\{ secrets\.PROFILE_DATA_READ_TOKEN \}\}/);
  assert.match(workflow, /github\.event\.client_payload\.profile_data_sha/);
  assert.match(workflow, /Validate repository dispatch payload/);
  assert.match(workflow, /pnpm acquire:profile-data/);
  assert.match(workflow, /PERFORMANCE_ENFORCE_BUDGETS: true/);
  assert.match(workflow, /PERFORMANCE_EVENT: \$\{\{ github\.event_name \}\}/);
  assert.match(workflow, /pnpm measure:performance/);
  assert.match(workflow, /pnpm measure:performance \|\| status=\$\?/);
  assert.match(workflow, /cat "\$GITHUB_STEP_SUMMARY"/);
});
