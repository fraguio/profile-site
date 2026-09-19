import { apiBaseUrl, request, responseBody } from "./acquire-profile-data.mjs";

const fullShaPattern = /^[0-9a-f]{40}$/i;

export async function validatePublishableProfileDataRevision({
  fetch = globalThis.fetch,
  log = console.log,
  profileDataSha,
  repository = "fraguio/profile-data",
  token,
}) {
  if (
    typeof profileDataSha !== "string" ||
    !fullShaPattern.test(profileDataSha)
  ) {
    throw new Error(
      "PROFILE_DATA_SHA must be a full 40-character hexadecimal SHA.",
    );
  }
  if (!token) {
    throw new Error(
      "PROFILE_DATA_READ_TOKEN is required to validate a publishable profile data revision.",
    );
  }

  const prefix = `Unable to validate publishable profile data revision "${profileDataSha}" in ${repository}`;
  const headers = {
    accept: "application/vnd.github+json",
    authorization: `Bearer ${token}`,
    "x-github-api-version": "2022-11-28",
  };
  const commit = await responseBody(
    await request(
      fetch,
      `${apiBaseUrl}/repos/${repository}/commits/${encodeURIComponent(profileDataSha)}`,
      { headers },
      prefix,
    ),
    prefix,
  );

  if (
    typeof commit.sha !== "string" ||
    commit.sha.toLowerCase() !== profileDataSha.toLowerCase()
  ) {
    throw new Error(
      `${prefix}: response does not contain the requested commit SHA.`,
    );
  }

  const comparison = await responseBody(
    await request(
      fetch,
      `${apiBaseUrl}/repos/${repository}/compare/${encodeURIComponent(profileDataSha)}...main`,
      { headers },
      prefix,
    ),
    prefix,
  );

  if (comparison.status !== "ahead" && comparison.status !== "identical") {
    if (comparison.status === "behind" || comparison.status === "diverged") {
      throw new Error(`${prefix}: commit is not reachable from main.`);
    }

    throw new Error(
      `${prefix}: response does not contain a reachability status.`,
    );
  }

  log(`resolved_profile_data_sha=${profileDataSha}`);
  return { resolvedProfileDataSha: profileDataSha };
}

if (import.meta.main) {
  validatePublishableProfileDataRevision({
    profileDataSha: process.env.PROFILE_DATA_SHA,
    token: process.env.PROFILE_DATA_READ_TOKEN,
  }).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
