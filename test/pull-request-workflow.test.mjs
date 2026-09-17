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
  assert.match(workflow, /^      - run: \|\n          status=0/m);
  assert.match(workflow, /PERFORMANCE_ENFORCE_BUDGETS: true/);
  assert.match(workflow, /PERFORMANCE_EVENT: pull_request/);
  assert.match(
    workflow,
    /RESUME_PATH: test\/fixtures\/fictitious-resume\.json/,
  );
  assert.doesNotMatch(workflow, /secrets\./i);
  assert.doesNotMatch(workflow, /profile-data/i);
  assert.doesNotMatch(workflow, /deploy|pages|write/i);
});

test("el workflow de publicación automática ejecuta los gates Base y adquiere una revisión curricular exacta", () => {
  const workflow = readFileSync(performanceWorkflowPath, "utf8");

  assert.match(workflow, /^\s+push:/m);
  assert.match(workflow, /^\s+repository_dispatch:/m);
  assert.match(workflow, /^\s+workflow_dispatch:/m);
  assert.match(
    workflow,
    /PROFILE_DATA_READ_TOKEN: \$\{\{ secrets\.PROFILE_DATA_READ_TOKEN \}\}/,
  );
  assert.match(workflow, /github\.event\.client_payload\.profile_data_sha/);
  assert.match(workflow, /Validate repository dispatch payload/);
  assert.match(workflow, /pnpm acquire:profile-data/);
  assert.match(workflow, /Resolve current profile data revision/);
  assert.match(workflow, /PROFILE_DATA_RESOLUTION_MODE: resolve/);
  assert.match(workflow, /steps\.current-profile-data\.outputs\.resolved_profile_data_sha/);
  assert.match(workflow, /pnpm check/);
  assert.match(workflow, /pnpm test:unit/);
  assert.match(workflow, /pnpm test:browser/);
  assert.match(workflow, /PERFORMANCE_ENFORCE_BUDGETS: true/);
  assert.match(workflow, /PERFORMANCE_EVENT: \$\{\{ github\.event_name \}\}/);
  assert.match(workflow, /pnpm measure:performance/);
  assert.match(workflow, /pnpm measure:performance \|\| status=\$\?/);
  assert.match(workflow, /cat "\$GITHUB_STEP_SUMMARY"/);
  assert.match(workflow, /^      - run: \|\n          status=0/m);
});

test("el receptor de dispatch exige el contrato completo antes de adquirir la revisión exacta", () => {
  const workflow = readFileSync(performanceWorkflowPath, "utf8");

  assert.match(workflow, /types: \[profile-data-updated\]/);
  assert.match(workflow, /DISPATCH_PROFILE_DATA_REF: \$\{\{ github\.event\.client_payload\.profile_data_ref \}\}/);
  assert.match(workflow, /test -n "\$DISPATCH_PROFILE_DATA_REF" && test -n "\$DISPATCH_PROFILE_DATA_PATH" && test -n "\$DISPATCH_PROFILE_DATA_SHA"/);
  assert.match(workflow, /PROFILE_DATA_SOURCE_REF: \$\{\{ github\.event\.client_payload\.profile_data_ref \|\| inputs\.profile_data_ref \|\| 'main' \}\}/);
  assert.ok(
    workflow.indexOf("Validate repository dispatch payload") < workflow.indexOf("Acquire exact profile data revision"),
    "el payload debe validarse antes de adquirir datos o poder publicar",
  );
  assert.ok(
    workflow.indexOf("Validate repository dispatch payload") < workflow.indexOf("pnpm install --frozen-lockfile"),
    "un payload inválido debe fallar antes de recorrer los gates de build",
  );
});

test("el workflow publica un único artefacto Base tras comprobar que la revisión sigue vigente", () => {
  const workflow = readFileSync(performanceWorkflowPath, "utf8");

  assert.match(
    workflow,
    /profile_data_ref:\n\s+description:.*\n\s+required: true\n\s+default: main/,
  );
  assert.match(
    workflow,
    /profile_data_path:\n\s+description:.*\n\s+required: true\n\s+default: data\/resume\.json/,
  );
  assert.match(
    workflow,
    /deploy:\n\s+description:.*\n\s+required: true\n\s+type: boolean\n\s+default: false/,
  );
  assert.match(workflow, /actions\/upload-artifact@v4/);
  assert.match(workflow, /actions\/download-artifact@v4/);
  assert.match(workflow, /outputs:\n\s+resolved_profile_data_sha: \$\{\{ steps\.acquired-profile-data\.outputs\.resolved_profile_data_sha \}\}/);
  assert.match(workflow, /id: acquired-profile-data/);
  assert.match(workflow, /pnpm check:current-profile-data-revision/);
  assert.match(workflow, /id: latest-profile-data/);
  assert.match(workflow, /actions\/upload-pages-artifact@v3/);
  assert.ok(
    workflow.indexOf("pnpm check:current-profile-data-revision") <
      workflow.indexOf("actions/upload-pages-artifact@v3"),
    "la revisión vigente debe verificarse antes de subir el artefacto Pages",
  );
  assert.match(workflow, /if: github\.event_name != 'workflow_dispatch'/);
  assert.match(
    workflow,
    /if: github\.event_name == 'workflow_dispatch' \|\| steps\.latest-profile-data\.outputs\.is_current == 'true'/,
  );
  assert.match(workflow, /if: github\.event_name != 'workflow_dispatch' \|\| inputs\.deploy == true/);
  assert.match(workflow, /actions\/deploy-pages@v4/);
  const publishWorkflow = workflow.split("\n  publish:\n")[1];
  assert.ok(publishWorkflow, "el workflow debe incluir el job publish");
  assert.match(publishWorkflow, /concurrency:\n\s+group: profile-site-publication\n\s+cancel-in-progress: false/);
  assert.match(publishWorkflow, /contents: read/);
  assert.match(publishWorkflow, /pages: write/);
  assert.match(publishWorkflow, /id-token: write/);
  assert.equal([...workflow.matchAll(/actions\/upload-pages-artifact@v3/g)].length, 1);
  assert.doesNotMatch(workflow, /eduardo-nogueira-fraguio-cv\.pdf/);
});

test("el workflow ejecuta smoke tests independientes de la experiencia interactiva y el CV web", () => {
  const workflow = readFileSync(performanceWorkflowPath, "utf8");

  assert.match(workflow, /Smoke test de la experiencia interactiva/);
  assert.match(workflow, /curl --fail --silent --show-error --retry 3 "\$PROFILE_SITE_BASE_URL"/);
  assert.match(workflow, /Smoke test del CV web/);
  assert.match(workflow, /curl --fail --silent --show-error --retry 3 "\$\{PROFILE_SITE_BASE_URL\}read\/"/);
});
