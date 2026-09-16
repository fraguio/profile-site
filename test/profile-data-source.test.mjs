import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { acquireProfileData } from "../scripts/acquire-profile-data.mjs";

const repository = "fraguio/profile-data";
const requestedRef = "release-2026";
const resolvedSha = "4d2a6b966750e3b9c439bf6bdb0a21b7f01d3509";
const requestedPath = "data/resume.json";
const resume = '{"basics":{"name":"Alicia Ejemplo"}}';

function response(status, body) {
  return new Response(body === undefined ? null : JSON.stringify(body), { status });
}

function temporaryResumePath(t) {
  const directory = mkdtempSync(join(tmpdir(), "profile-data-source-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return join(directory, "resume.json");
}

function options(overrides = {}) {
  return {
    outputPath: overrides.outputPath,
    profileDataPath: requestedPath,
    ref: requestedRef,
    repository,
    token: "read-token",
    fetch: overrides.fetch,
    log: overrides.log ?? (() => {}),
  };
}

test("resuelve una ref una vez y adquiere la ruta exclusivamente desde el SHA resultante", async (t) => {
  const calls = [];
  const outputPath = temporaryResumePath(t);
  const fetch = async (url, request) => {
    calls.push({ url, request });

    if (url.endsWith(`/commits/${requestedRef}`)) {
      return response(200, { sha: resolvedSha });
    }

    return response(200, {
      content: Buffer.from(resume).toString("base64"),
      encoding: "base64",
    });
  };

  const result = await acquireProfileData(options({ fetch, outputPath }));

  assert.equal(result.resolvedProfileDataSha, resolvedSha);
  assert.equal(readFileSync(outputPath, "utf8"), resume);
  assert.deepEqual(calls.map((call) => call.url), [
    `https://api.github.com/repos/${repository}/commits/${requestedRef}`,
    `https://api.github.com/repos/${repository}/contents/${requestedPath}?ref=${resolvedSha}`,
  ]);
  assert.deepEqual(calls.map((call) => call.request.headers.authorization), [
    "Bearer read-token",
    "Bearer read-token",
  ]);
});

test("registra la referencia, ruta y revisión curricular efectiva sin exponer token ni Fuente curricular completa", async (t) => {
  const outputPath = temporaryResumePath(t);
  const logs = [];
  const fetch = async (url) => response(200, url.includes("/commits/")
    ? { sha: resolvedSha }
    : { content: Buffer.from(resume).toString("base64"), encoding: "base64" });

  await acquireProfileData({
    ...options({ fetch, outputPath, log: (message) => logs.push(message) }),
  });

  assert.deepEqual(logs, [
    `profile_data_ref=${requestedRef}`,
    `profile_data_path=${requestedPath}`,
    `resolved_profile_data_sha=${resolvedSha}`,
  ]);
  assert.equal(logs.join("\n").includes("read-token"), false);
  assert.equal(logs.join("\n").includes("Alicia Ejemplo"), false);
});

for (const [description, fetch, diagnostic] of [
  [
    "una referencia inexistente o ajena",
    async () => response(404, { message: "Not Found" }),
    `Unable to resolve profile data ref "${requestedRef}" in ${repository}: GitHub API returned 404.`,
  ],
  [
    "una ruta ausente",
    async (url) => url.includes("/commits/")
      ? response(200, { sha: resolvedSha })
      : response(404, { message: "Not Found" }),
    `Unable to acquire profile data path "${requestedPath}" at ${resolvedSha} in ${repository}: GitHub API returned 404.`,
  ],
  [
    "una respuesta inaccesible",
    async () => {
      throw new TypeError("network unavailable");
    },
    `Unable to resolve profile data ref "${requestedRef}" in ${repository}: request failed.`,
  ],
  [
    "una Fuente curricular inválida",
    async (url) => url.includes("/commits/")
      ? response(200, { sha: resolvedSha })
      : response(200, { content: Buffer.from("not json").toString("base64"), encoding: "base64" }),
    `Unable to acquire profile data path "${requestedPath}" at ${resolvedSha} in ${repository}: source is not valid JSON.`,
  ],
]) {
  test(`rechaza ${description} con un diagnóstico explícito`, async (t) => {
    await assert.rejects(
      acquireProfileData(options({ fetch, outputPath: temporaryResumePath(t) })),
      new RegExp(diagnostic.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    );
  });
}

test("rechaza un SHA curricular solicitado que no existe en el repositorio", async (t) => {
  const missingSha = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4";

  await assert.rejects(
    acquireProfileData({
      ...options({ outputPath: temporaryResumePath(t), fetch: async () => response(404) }),
      ref: missingSha,
    }),
    new RegExp(`Unable to resolve profile data ref "${missingSha}" in ${repository}: GitHub API returned 404\\.`),
  );
});

test("requiere el token de lectura dedicado y no acepta GITHUB_TOKEN", () => {
  const githubToken = "github-token-must-not-be-used";
  const environment = { ...process.env, GITHUB_TOKEN: githubToken };
  delete environment.PROFILE_DATA_READ_TOKEN;
  const result = spawnSync(process.execPath, ["scripts/acquire-profile-data.mjs"], {
    cwd: new URL("..", import.meta.url),
    encoding: "utf8",
    env: environment,
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /PROFILE_DATA_READ_TOKEN is required to acquire profile data\./);
  assert.equal(`${result.stdout}\n${result.stderr}`.includes(githubToken), false);
});

test("no expone el token de lectura cuando una solicitud falla", async (t) => {
  const token = "profile-data-read-token";

  await assert.rejects(
    acquireProfileData({
      ...options({ outputPath: temporaryResumePath(t), fetch: async () => {
        throw new Error(`Authorization: Bearer ${token}`);
      } }),
      token,
    }),
    (error) => {
      assert.match(error.message, /request failed/);
      assert.equal(error.message.includes(token), false);
      return true;
    },
  );
});

test("el build contractual rechaza una Fuente curricular inválida adquirida desde la revisión exacta", async (t) => {
  const directory = mkdtempSync(join(tmpdir(), "profile-data-source-"));
  const outputPath = join(directory, "resume.json");
  const outputDirectory = join(directory, "dist");
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const invalidResume = '{"basics":"not an object"}';
  const fetch = async (url) => response(200, url.includes("/commits/")
    ? { sha: resolvedSha }
    : { content: Buffer.from(invalidResume).toString("base64"), encoding: "base64" });

  await acquireProfileData(options({ fetch, outputPath }));

  const isWindows = process.platform === "win32";
  const result = spawnSync(
    isWindows ? process.env.ComSpec : "pnpm",
    isWindows
      ? ["/d", "/s", "/c", `pnpm build --outDir ${basename(outputDirectory)}`]
      : ["build", "--outDir", outputDirectory],
    {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8",
      env: {
        ...process.env,
        PROFILE_SITE_BASE_URL: "https://fraguio.github.io/profile-site/",
        RESUME_PATH: outputPath,
      },
    },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /resume\.basics: "not an object" violates JSON Resume 1\.3\.1 schema/,
  );
  assert.equal(existsSync(join(outputDirectory, "index.html")), false);
});
