import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

const pullRequestWorkflowPath = fileURLToPath(
  new URL("../.github/workflows/pull-request.yml", import.meta.url),
);
const automaticValidationWorkflowPath = fileURLToPath(
  new URL("../.github/workflows/validate-profile-integration.yml", import.meta.url),
);
const validationGatesWorkflowPath = fileURLToPath(
  new URL("../.github/workflows/validate-profile-gates.yml", import.meta.url),
);

function readWorkflowSource(path) {
  return readFileSync(path, "utf8");
}

test("el workflow de pull request ejecuta los gates con el fixture ficticio sin secrets ni publicación", () => {
  const source = readWorkflowSource(pullRequestWorkflowPath);

  assert.match(source, /^on:\s*\n\s+pull_request:/m);
  assert.match(source, /^permissions:\s*\n\s+contents: read$/m);
  assert.match(source, /RESUME_PATH: test\/fixtures\/fictitious-resume\.json/);
  assert.match(source, /pnpm check/);
  assert.match(source, /pnpm test:unit/);
  assert.match(source, /pnpm test:browser/);
  assert.match(source, /pnpm build/);
  assert.match(source, /pnpm measure:performance/);
  assert.doesNotMatch(source, /secrets\./i);
  assert.doesNotMatch(source, /profile-data/i);
  assert.doesNotMatch(source, /deploy|pages|write/i);
});

test("el push a main resuelve la Revisión curricular vigente antes de delegar los gates sin publicar", () => {
  const source = readWorkflowSource(automaticValidationWorkflowPath);

  assert.match(source, /^on:\s*\n\s+push:\s*\n\s+branches: \[main\]$/m);
  assert.match(source, /^permissions:\s*\n\s+contents: read$/m);
  assert.match(source, /PROFILE_DATA_READ_TOKEN: \$\{\{ secrets\.PROFILE_DATA_READ_TOKEN \}\}/);
  assert.match(source, /PROFILE_DATA_PATH: data\/resume\.json/);
  assert.match(source, /uses: pnpm\/action-setup@v4/);
  assert.match(source, /PROFILE_DATA_RESOLUTION_MODE: resolve/);
  assert.match(source, /Resolver la Revisión curricular vigente/);
  assert.match(source, /pnpm check:current-profile-data-revision/);
  assert.match(source, /uses: \.\/\.github\/workflows\/validate-profile-gates\.yml/);
  assert.match(source, /profile_data_sha: \$\{\{ needs\.resolve-profile-data\.outputs\.resolved_profile_data_sha \}\}/);
  assert.match(source, /secrets: inherit/);
  assert.ok(
    source.indexOf("pnpm check:current-profile-data-revision") <
      source.indexOf("validate-profile-gates.yml"),
    "la revisión vigente debe resolverse antes de adquirir datos en los gates",
  );
  assert.doesNotMatch(source, /repository_dispatch|workflow_dispatch/);
  assert.doesNotMatch(source, /pages:|environment:|upload-pages-artifact|deploy-pages|curl --fail/);
});

test("los gates reutilizables adquieren una Revisión curricular efectiva, registran ambos SHA y conservan el artefacto completo", () => {
  const source = readWorkflowSource(validationGatesWorkflowPath);

  assert.match(source, /^on:\s*\n\s+workflow_call:/m);
  assert.match(source, /profile_data_sha:\s*\n\s+required: true\s*\n\s+type: string/);
  assert.match(source, /^permissions:\s*\n\s+contents: read$/m);
  assert.match(source, /PROFILE_DATA_READ_TOKEN: \$\{\{ secrets\.PROFILE_DATA_READ_TOKEN \}\}/);
  assert.match(source, /PROFILE_DATA_REF: \$\{\{ inputs\.profile_data_sha \}\}/);
  assert.match(source, /PROFILE_DATA_SOURCE_REF: main/);
  assert.match(source, /PROFILE_DATA_PATH: data\/resume\.json/);
  assert.match(source, /RESUME_PATH: \.profile-data\/resume\.json/);
  assert.match(source, /pnpm check/);
  assert.match(source, /pnpm test:unit/);
  assert.match(source, /pnpm test:browser/);
  assert.match(source, /Adquirir la Revisión curricular efectiva/);
  assert.match(source, /pnpm build/);
  assert.match(source, /pnpm measure:performance/);
  assert.match(source, /profile_site_sha=\$GITHUB_SHA/);
  assert.match(source, /profile_data_sha=\$\{\{ steps\.acquired-profile-data\.outputs\.resolved_profile_data_sha \}\}/);
  assert.match(source, /actions\/upload-artifact@v4/);
  assert.match(source, /name: profile-validation/);
  assert.match(source, /path: dist/);
  assert.ok(
    source.indexOf("pnpm build") < source.indexOf("actions/upload-artifact@v4"),
    "un fallo de build no debe conservar un artefacto parcial",
  );
  assert.doesNotMatch(source, /repository_dispatch|pages:|environment:|upload-pages-artifact|deploy-pages|curl --fail/);
});
