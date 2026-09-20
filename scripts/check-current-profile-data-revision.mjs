import { appendFileSync } from "node:fs";
import { apiBaseUrl, request, responseBody } from "./acquire-profile-data.mjs";

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
  resolveCurrentProfileDataRevision({
    profileDataPath: process.env.PROFILE_DATA_PATH,
    token: process.env.PROFILE_DATA_READ_TOKEN,
  }).then((resolvedProfileDataSha) => {
    if (process.env.GITHUB_OUTPUT) {
      appendFileSync(
        process.env.GITHUB_OUTPUT,
        `resolved_profile_data_sha=${resolvedProfileDataSha}\n`,
      );
    }
  }).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
