import assert from "node:assert/strict";
import test from "node:test";
import { resolveCurrentProfileDataRevision } from "../scripts/check-current-profile-data-revision.mjs";
import { validatePublishableProfileDataRevision } from "../scripts/validate-publishable-profile-data-revision.mjs";

const repository = "fraguio/profile-data";
const profileDataPath = "data/resume.json";
const resolvedProfileDataSha = "4d2a6b966750e3b9c439bf6bdb0a21b7f01d3509";

function response(status, body) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
  });
}

test("acepta y registra una revisión curricular efectiva vigente sin resolverla de nuevo", async () => {
  const logs = [];
  const calls = [];
  const result = await validatePublishableProfileDataRevision({
    fetch: async (url, request) => {
      calls.push({ url, request });

      if (url.endsWith(`/commits/${resolvedProfileDataSha}`)) {
        return response(200, { sha: resolvedProfileDataSha });
      }

      return response(200, { status: "identical" });
    },
    log: (message) => logs.push(message),
    profileDataSha: resolvedProfileDataSha,
    repository,
    token: "read-token",
  });

  assert.deepEqual(result, { resolvedProfileDataSha });
  assert.deepEqual(
    calls.map(({ url }) => url),
    [
      `https://api.github.com/repos/${repository}/commits/${resolvedProfileDataSha}`,
      `https://api.github.com/repos/${repository}/compare/${resolvedProfileDataSha}...main`,
    ],
  );
  assert.deepEqual(logs, [
    `resolved_profile_data_sha=${resolvedProfileDataSha}`,
  ]);
  assert.equal(
    calls.every(
      (call) => call.request.headers.authorization === "Bearer read-token",
    ),
    true,
  );
});

test("acepta una revisión curricular efectiva anterior integrada en main", async () => {
  const previousProfileDataSha = "d3b07384d113edec49eaa6238ad5ff0000000000";
  const result = await validatePublishableProfileDataRevision({
    fetch: async (url) =>
      response(
        200,
        url.endsWith(`/commits/${previousProfileDataSha}`)
          ? { sha: previousProfileDataSha }
          : { status: "ahead" },
      ),
    log: () => {},
    profileDataSha: previousProfileDataSha,
    repository,
    token: "read-token",
  });

  assert.deepEqual(result, { resolvedProfileDataSha: previousProfileDataSha });
});

for (const profileDataSha of ["4d2a6b9", "main"]) {
  test(`rechaza ${profileDataSha} antes de solicitar la Fuente curricular`, async () => {
    let calls = 0;

    await assert.rejects(
      validatePublishableProfileDataRevision({
        fetch: async () => {
          calls += 1;
          return response(200, {});
        },
        log: () => {},
        profileDataSha,
        repository,
        token: "read-token",
      }),
      /PROFILE_DATA_SHA must be a full 40-character hexadecimal SHA\./,
    );

    assert.equal(calls, 0);
  });
}

test("rechaza una revisión curricular efectiva inexistente", async () => {
  const missingProfileDataSha = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4";

  await assert.rejects(
    validatePublishableProfileDataRevision({
      fetch: async () => response(404),
      log: () => {},
      profileDataSha: missingProfileDataSha,
      repository,
      token: "read-token",
    }),
    new RegExp(
      `Unable to validate publishable profile data revision "${missingProfileDataSha}" in ${repository}: GitHub API returned 404\\.`,
    ),
  );
});

test("rechaza una revisión curricular efectiva que solo pertenece a una historia divergente", async () => {
  const divergentProfileDataSha = "b7f01d3504d2a6b966750e3b9c439bf6bdb0a21b";

  await assert.rejects(
    validatePublishableProfileDataRevision({
      fetch: async (url) =>
        response(
          200,
          url.endsWith(`/commits/${divergentProfileDataSha}`)
            ? { sha: divergentProfileDataSha }
            : { status: "diverged" },
        ),
      log: () => {},
      profileDataSha: divergentProfileDataSha,
      repository,
      token: "read-token",
    }),
    new RegExp(
      `Unable to validate publishable profile data revision "${divergentProfileDataSha}" in ${repository}: commit is not reachable from main\\.`,
    ),
  );
});

test("rechaza una revisión curricular efectiva que solo pertenece a otra rama", async () => {
  const branchOnlyProfileDataSha = "a21b7f01d3504d2a6b966750e3b9c439bf6bdb0a";

  await assert.rejects(
    validatePublishableProfileDataRevision({
      fetch: async (url) =>
        response(
          200,
          url.endsWith(`/commits/${branchOnlyProfileDataSha}`)
            ? { sha: branchOnlyProfileDataSha }
            : { status: "behind" },
        ),
      log: () => {},
      profileDataSha: branchOnlyProfileDataSha,
      repository,
      token: "read-token",
    }),
    new RegExp(
      `Unable to validate publishable profile data revision "${branchOnlyProfileDataSha}" in ${repository}: commit is not reachable from main\\.`,
    ),
  );
});

for (const [description, fetch] of [
  [
    "inaccesible",
    async () => {
      throw new Error("Authorization: Bearer profile-data-read-token");
    },
  ],
  ["inválida", async () => response(200, { sha: "not-a-commit" })],
]) {
  test(`rechaza una respuesta ${description} sin exponer el token`, async () => {
    const token = "profile-data-read-token";

    await assert.rejects(
      validatePublishableProfileDataRevision({
        fetch,
        log: () => {},
        profileDataSha: resolvedProfileDataSha,
        repository,
        token,
      }),
      (error) => {
        assert.equal(error.message.includes(token), false);
        return true;
      },
    );
  });
}

test("resuelve la revisión curricular vigente desde el último cambio de la Fuente curricular", async () => {
  const currentProfileDataSha = "d3b07384d113edec49eaa6238ad5ff00".padEnd(
    40,
    "0",
  );
  const result = await resolveCurrentProfileDataRevision(
    {
      fetch: async () => response(200, [{ sha: currentProfileDataSha }]),
      profileDataPath,
      repository,
      token: "read-token",
    },
  );

  assert.equal(result, currentProfileDataSha);
});
