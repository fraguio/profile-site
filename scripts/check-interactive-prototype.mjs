import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const result = spawnSync("pnpm", ["exec", "astro", "check"], {
  env: {
    ...process.env,
    PROFILE_SITE_BASE_URL: "https://fraguio.github.io/profile-site/",
    RESUME_PATH: resolve("src/prototypes/interactive-experience/resume.fixture.json"),
  },
  stdio: "inherit",
  shell: process.platform === "win32",
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
