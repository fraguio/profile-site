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
const manualValidationWorkflowPath = fileURLToPath(
  new URL("../.github/workflows/validate-profile-release.yml", import.meta.url),
);
const publishProfileWorkflowPath = fileURLToPath(
  new URL("../.github/workflows/publish-profile.yml", import.meta.url),
);

function readWorkflowSource(path) {
  return readFileSync(path, "utf8");
}

function workflowDispatchInputNames(source) {
  const inputs = source.match(
    /^  workflow_dispatch:\s*\n    inputs:\s*\n((?: {6,}.*\n)*)/m,
  )?.[1];

  assert.ok(inputs, "el workflow debe declarar inputs manuales");
  return [...inputs.matchAll(/^      ([a-z_]+):/gm)].map(
    (match) => match[1],
  );
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
  assert.match(source, /echo "profile_site_sha=\$GITHUB_SHA" \| tee -a "\$GITHUB_STEP_SUMMARY"/);
  assert.match(source, /echo "profile_data_sha=\$\{\{ steps\.acquired-profile-data\.outputs\.resolved_profile_data_sha \}\}" \| tee -a "\$GITHUB_STEP_SUMMARY"/);
  assert.match(source, /actions\/upload-artifact@v4/);
  assert.match(source, /name: profile-validation/);
  assert.match(source, /path: dist/);
  assert.ok(
    source.indexOf("pnpm build") < source.indexOf("actions/upload-artifact@v4"),
    "un fallo de build no debe conservar un artefacto parcial",
  );
  assert.doesNotMatch(source, /repository_dispatch|pages:|environment:|upload-pages-artifact|deploy-pages|curl --fail/);
});

test("la validación manual acepta un único SHA publicable desde main y reutiliza los gates sin publicar", () => {
  const source = readWorkflowSource(manualValidationWorkflowPath);

  assert.match(source, /^on:\s*\n\s+workflow_dispatch:\s*\n\s+inputs:\s*\n\s+profile_data_sha:/m);
  assert.match(source, /profile_data_sha:\s*\n\s+description:.*\n\s+required: true\s*\n\s+type: string/);
  assert.deepEqual(workflowDispatchInputNames(source), ["profile_data_sha"]);
  assert.match(source, /^permissions:\s*\n\s+contents: read$/m);
  assert.match(source, /test "\$GITHUB_REF" = "refs\/heads\/main"/);
  assert.match(source, /PROFILE_DATA_SHA: \$\{\{ inputs\.profile_data_sha \}\}/);
  assert.match(source, /pnpm validate:publishable-profile-data-revision/);
  assert.match(
    source,
    /outputs:\s*\n\s+resolved_profile_data_sha: \$\{\{ steps\.publishable-profile-data\.outputs\.resolved_profile_data_sha \}\}/,
  );
  assert.match(source, /grep '\^resolved_profile_data_sha=' validation\.log >> "\$GITHUB_OUTPUT"/);
  assert.match(source, /uses: \.\/\.github\/workflows\/validate-profile-gates\.yml/);
  assert.match(source, /needs: validate-profile-data/);
  assert.match(source, /profile_data_sha: \$\{\{ needs\.validate-profile-data\.outputs\.resolved_profile_data_sha \}\}/);
  assert.match(source, /secrets: inherit/);
  assert.ok(
    source.indexOf('test "$GITHUB_REF" = "refs/heads/main"') <
      source.indexOf("pnpm validate:publishable-profile-data-revision"),
    "la ref debe rechazarse antes de validar o adquirir la revisión curricular",
  );
  assert.doesNotMatch(source, /pages:|environment:|upload-pages-artifact|deploy-pages|curl --fail/);
});

test("la publicación manual valida un SHA elegido, despliega el artefacto completo tras aprobación y comprueba las tres superficies", () => {
  const source = readWorkflowSource(publishProfileWorkflowPath);

  assert.match(source, /^on:\s*\n\s+workflow_dispatch:\s*\n\s+inputs:\s*\n\s+profile_data_sha:/m);
  assert.match(source, /profile_data_sha:\s*\n\s+description:.*\n\s+required: true\s*\n\s+type: string/);
  assert.deepEqual(workflowDispatchInputNames(source), ["profile_data_sha"]);
  assert.match(source, /^permissions:\s*\n\s+contents: read$/m);
  assert.match(source, /test "\$GITHUB_REF" = "refs\/heads\/main"/);
  assert.match(source, /PROFILE_DATA_SHA: \$\{\{ inputs\.profile_data_sha \}\}/);
  assert.match(source, /pnpm validate:publishable-profile-data-revision/);
  assert.match(source, /uses: \.\/\.github\/workflows\/validate-profile-gates\.yml/);
  assert.match(source, /needs: validate-profile-data/);
  assert.match(source, /profile_data_sha: \$\{\{ needs\.validate-profile-data\.outputs\.resolved_profile_data_sha \}\}/);
  assert.match(source, /deploy:\s*\n\s+needs: validate/m);
  assert.match(source, /concurrency:\s*\n\s+group: pages\s*\n\s+cancel-in-progress: false/m);
  assert.match(source, /permissions:\s*\n\s+actions: read\s*\n\s+pages: write\s*\n\s+id-token: write/m);
  assert.match(source, /environment:\s*\n\s+name: github-pages/m);
  assert.match(source, /actions\/download-artifact@v4/);
  assert.match(source, /name: profile-validation/);
  assert.match(source, /actions\/upload-pages-artifact@v3/);
  assert.match(source, /path: dist/);
  assert.match(source, /actions\/deploy-pages@v4/);
  assert.match(source, /smoke:\s*\n\s+needs: deploy/m);
  assert.match(source, /curl --fail --show-error --silent --location "\$PROFILE_SITE_BASE_URL"/);
  assert.match(source, /curl --fail --show-error --silent --location "\$\{PROFILE_SITE_BASE_URL\}read\/"/);
  assert.match(source, /curl --fail --show-error --silent --location "\$\{PROFILE_SITE_BASE_URL\}cv\/eduardo-nogueira-fraguio-cv\.pdf"/);
  assert.match(source, /test -s interactive-experience\.html/);
  assert.match(source, /test -s web-cv\.html/);
  assert.match(source, /test -s cv\.pdf/);
  assert.match(source, /head -c 5 cv\.pdf \| grep -Fx '%PDF-'/);
  assert.equal(
    (source.match(/continue-on-error: true/g) ?? []).length,
    3,
    "cada superficie debe comprobarse aunque falle otra",
  );
  assert.match(source, /if: always\(\)/);
  assert.match(source, /actions\/upload-artifact@v4/);
  assert.match(source, /name: profile-public-smoke/);
  assert.match(source, /steps\.interactive-experience\.outcome/);
  assert.match(source, /steps\.web-cv\.outcome/);
  assert.match(source, /steps\.cv\.outcome/);
  assert.ok(
    source.indexOf('test "$GITHUB_REF" = "refs/heads/main"') <
      source.indexOf("pnpm validate:publishable-profile-data-revision"),
    "la ref debe rechazarse antes de validar o adquirir la revisión curricular",
  );
  assert.ok(
    source.indexOf("validate-profile-gates.yml") < source.indexOf("environment:"),
    "los gates deben terminar antes de solicitar la aprobación protegida",
  );
  assert.ok(
    source.indexOf("actions/upload-pages-artifact@v3") <
      source.indexOf("actions/deploy-pages@v4"),
    "el artefacto completo debe subirse antes del deploy",
  );
  assert.ok(
    source.indexOf("actions/deploy-pages@v4") < source.indexOf("curl --fail"),
    "los smoke tests deben ejecutarse después del deploy",
  );
  assert.doesNotMatch(source, /push:|repository_dispatch|latest-wins|superseded|PROFILE_SITE_DISPATCH_TOKEN/);
});
