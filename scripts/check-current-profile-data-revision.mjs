import { appendFileSync } from "node:fs";
import { apiBaseUrl, request, responseBody } from "./acquire-profile-data.mjs";

export async function checkCurrentProfileDataRevision({
  fetch = globalThis.fetch,
  log = console.log,
  profileDataPath,
  repository = "fraguio/profile-data",
  resolvedProfileDataSha,
  token,
}) {
  if (!resolvedProfileDataSha) {
    throw new Error("RESOLVED_PROFILE_DATA_SHA is required to check the current profile data revision.");
  }

  const currentProfileDataSha = await resolveCurrentProfileDataRevision({
    fetch,
    profileDataPath,
    repository,
    token,
  });
  const isCurrent = currentProfileDataSha === resolvedProfileDataSha;

  log(`resolved_profile_data_sha=${resolvedProfileDataSha}`);
  log(`current_profile_data_sha=${currentProfileDataSha}`);
  if (!isCurrent) {
    log("publication_status=superseded");
  }

  return { isCurrent, currentProfileDataSha };
}

export async function resolveCurrentProfileDataRevision({
  fetch = globalThis.fetch,
  profileDataPath,
  repository = "fraguio/profile-data",
  token,
}) {
  for (const [name, value] of [
    ["PROFILE_DATA_READ_TOKEN", token],
    ["PROFILE_DATA_PATH", profileDataPath],
  ]) {
    if (!value) {
      throw new Error(`${name} is required to resolve the current profile data revision.`);
    }
  }

  const prefix = `Unable to resolve current profile data revision for ${profileDataPath} in ${repository}`;
  const headers = {
    accept: "application/vnd.github+json",
    authorization: `Bearer ${token}`,
    "x-github-api-version": "2022-11-28",
  };
  const url = `${apiBaseUrl}/repos/${repository}/commits?sha=main&path=${profileDataPath}&per_page=1`;
  const response = await request(fetch, url, { headers }, prefix);
  const commits = await responseBody(response, prefix);

  if (!Array.isArray(commits)) {
    throw new Error(`${prefix}: response does not contain a current commit SHA.`);
  }
  const currentProfileDataSha = commits[0]?.sha;

  if (typeof currentProfileDataSha !== "string" || !/^[0-9a-f]{40}$/i.test(currentProfileDataSha)) {
    throw new Error(`${prefix}: response does not contain a current commit SHA.`);
  }

  return currentProfileDataSha;
}

if (import.meta.main) {
  const resolveCurrent = process.env.PROFILE_DATA_RESOLUTION_MODE === "resolve";
  const operation = resolveCurrent
    ? resolveCurrentProfileDataRevision({
        profileDataPath: process.env.PROFILE_DATA_PATH,
        token: process.env.PROFILE_DATA_READ_TOKEN,
      })
    : checkCurrentProfileDataRevision({
    profileDataPath: process.env.PROFILE_DATA_PATH,
    resolvedProfileDataSha: process.env.RESOLVED_PROFILE_DATA_SHA,
    token: process.env.PROFILE_DATA_READ_TOKEN,
  });

  operation.then((result) => {
    if (process.env.GITHUB_OUTPUT) {
      const output = resolveCurrent
        ? `resolved_profile_data_sha=${result}\n`
        : `is_current=${result.isCurrent}\n`;
      appendFileSync(process.env.GITHUB_OUTPUT, output);
    }
  }).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
