import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const apiBaseUrl = "https://api.github.com";

export async function acquireProfileData({
  fetch = globalThis.fetch,
  log = console.log,
  outputPath,
  profileDataPath,
  ref,
  repository = "fraguio/profile-data",
  token,
}) {
  if (!token) {
    throw new Error("PROFILE_DATA_READ_TOKEN is required to acquire profile data.");
  }

  for (const [name, value] of [
    ["PROFILE_DATA_REF", ref],
    ["PROFILE_DATA_PATH", profileDataPath],
    ["RESUME_PATH", outputPath],
  ]) {
    if (!value) {
      throw new Error(`${name} is required to acquire profile data.`);
    }
  }

  const headers = {
    accept: "application/vnd.github+json",
    authorization: `Bearer ${token}`,
    "x-github-api-version": "2022-11-28",
  };
  const resolvedProfileDataSha = await resolveRef({
    fetch,
    headers,
    ref,
    repository,
  });
  const source = await acquirePath({
    fetch,
    headers,
    profileDataPath,
    repository,
    resolvedProfileDataSha,
  });

  writeFileSync(resolve(outputPath), source);
  log(`profile_data_ref=${ref}`);
  log(`profile_data_path=${profileDataPath}`);
  log(`resolved_profile_data_sha=${resolvedProfileDataSha}`);

  return { resolvedProfileDataSha };
}

async function resolveRef({ fetch, headers, ref, repository }) {
  const url = `${apiBaseUrl}/repos/${repository}/commits/${encodeURIComponent(ref)}`;
  const prefix = `Unable to resolve profile data ref "${ref}" in ${repository}`;
  const response = await request(fetch, url, { headers }, prefix);
  const body = await responseBody(response, prefix);

  if (typeof body.sha !== "string" || !/^[0-9a-f]{40}$/i.test(body.sha)) {
    throw new Error(
      `Unable to resolve profile data ref "${ref}" in ${repository}: response does not contain a commit SHA.`,
    );
  }

  return body.sha;
}

async function acquirePath({ fetch, headers, profileDataPath, repository, resolvedProfileDataSha }) {
  const encodedPath = profileDataPath.split("/").map(encodeURIComponent).join("/");
  const url = `${apiBaseUrl}/repos/${repository}/contents/${encodedPath}?ref=${resolvedProfileDataSha}`;
  const prefix = `Unable to acquire profile data path "${profileDataPath}" at ${resolvedProfileDataSha} in ${repository}`;
  const response = await request(fetch, url, { headers }, prefix);
  const body = await responseBody(response, prefix);

  if (typeof body.content !== "string" || body.encoding !== "base64" || !isBase64(body.content)) {
    throw new Error(`${prefix}: response does not contain base64 content.`);
  }

  const source = Buffer.from(body.content, "base64");

  try {
    JSON.parse(source.toString("utf8"));
  } catch {
    throw new Error(`${prefix}: source is not valid JSON.`);
  }

  return source;
}

async function request(fetch, url, options, prefix) {
  let response;

  try {
    response = await fetch(url, options);
  } catch {
    throw new Error(`${prefix}: request failed.`);
  }

  if (!response.ok) {
    throw new Error(`${prefix}: GitHub API returned ${response.status}.`);
  }

  return response;
}

async function responseBody(response, prefix) {
  try {
    return await response.json();
  } catch {
    throw new Error(`${prefix}: GitHub API returned an invalid JSON response.`);
  }
}

function isBase64(value) {
  const normalized = value.replaceAll(/\s/g, "");

  return normalized.length > 0 &&
    /^[A-Za-z0-9+/]*={0,2}$/.test(normalized) &&
    Buffer.from(normalized, "base64").toString("base64") === normalized;
}

if (import.meta.main) {
  acquireProfileData({
    outputPath: process.env.RESUME_PATH,
    profileDataPath: process.env.PROFILE_DATA_PATH,
    ref: process.env.PROFILE_DATA_REF,
    token: process.env.PROFILE_DATA_READ_TOKEN,
  }).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
