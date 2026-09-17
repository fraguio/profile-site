import assert from "node:assert/strict";
import test from "node:test";
import {
  checkCurrentProfileDataRevision,
  resolveCurrentProfileDataRevision,
} from "../scripts/check-current-profile-data-revision.mjs";

const repository = "fraguio/profile-data";
const profileDataPath = "data/resume.json";
const resolvedProfileDataSha = "4d2a6b966750e3b9c439bf6bdb0a21b7f01d3509";

function response(status, body) {
  return new Response(body === undefined ? null : JSON.stringify(body), { status });
}

function options(overrides = {}) {
  return {
    fetch: overrides.fetch,
    log: overrides.log ?? (() => {}),
    profileDataPath,
    repository,
    resolvedProfileDataSha: overrides.resolvedProfileDataSha ?? resolvedProfileDataSha,
    token: "read-token",
  };
}

test("acepta la revisión curricular efectiva cuando sigue siendo la vigente", async () => {
  const calls = [];
  const result = await checkCurrentProfileDataRevision(options({
    fetch: async (url, request) => {
      calls.push({ url, request });
      return response(200, [{ sha: resolvedProfileDataSha }]);
    },
  }));

  assert.deepEqual(result, { isCurrent: true, currentProfileDataSha: resolvedProfileDataSha });
  assert.deepEqual(calls.map(({ url }) => url), [
    `https://api.github.com/repos/${repository}/commits?sha=main&path=${profileDataPath}&per_page=1`,
  ]);
  assert.equal(calls[0].request.headers.authorization, "Bearer read-token");
});

test("resuelve la revisión curricular vigente desde el último cambio de la Fuente curricular", async () => {
  const currentProfileDataSha = "d3b07384d113edec49eaa6238ad5ff00".padEnd(40, "0");
  const result = await resolveCurrentProfileDataRevision(options({
    fetch: async () => response(200, [{ sha: currentProfileDataSha }]),
  }));

  assert.equal(result, currentProfileDataSha);
});

test("marca la publicación como supersedida cuando existe una revisión curricular vigente posterior", async () => {
  const currentProfileDataSha = "d3b07384d113edec49eaa6238ad5ff00".padEnd(40, "0");
  const logs = [];
  const result = await checkCurrentProfileDataRevision(options({
    fetch: async () => response(200, [{ sha: currentProfileDataSha }]),
    log: (message) => logs.push(message),
  }));

  assert.deepEqual(result, { isCurrent: false, currentProfileDataSha });
  assert.deepEqual(logs, [
    `resolved_profile_data_sha=${resolvedProfileDataSha}`,
    `current_profile_data_sha=${currentProfileDataSha}`,
    "publication_status=superseded",
  ]);
});

test("solo permite publicar la revisión más reciente de dos ejecuciones concurrentes", async () => {
  const currentProfileDataSha = "d3b07384d113edec49eaa6238ad5ff00".padEnd(40, "0");
  const fetch = async () => response(200, [{ sha: currentProfileDataSha }]);

  const [olderPublication, currentPublication] = await Promise.all([
    checkCurrentProfileDataRevision(options({ fetch })),
    checkCurrentProfileDataRevision(options({
      fetch,
      resolvedProfileDataSha: currentProfileDataSha,
    })),
  ]);

  assert.deepEqual(olderPublication, { isCurrent: false, currentProfileDataSha });
  assert.deepEqual(currentPublication, { isCurrent: true, currentProfileDataSha });
});

test("rechaza respuestas de revisión vigente inaccesibles sin exponer el token", async () => {
  const token = "profile-data-read-token";

  await assert.rejects(
    checkCurrentProfileDataRevision(options({
      fetch: async () => {
        throw new Error(`Authorization: Bearer ${token}`);
      },
      token,
    })),
    /Unable to resolve current profile data revision for data\/resume\.json in fraguio\/profile-data: request failed\./,
  );
});
