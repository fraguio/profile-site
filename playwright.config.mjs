import { defineConfig } from "@playwright/test";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));
const fixturePath = fileURLToPath(
  new URL("test/fixtures/fictitious-resume.json", import.meta.url),
);

export default defineConfig({
  testDir: "./test",
  testMatch: "web-cv.browser.mjs",
  use: {
    baseURL: "http://127.0.0.1:4321/profile-site/",
  },
  webServer: {
    command: "pnpm build && pnpm astro preview --host 127.0.0.1 --port 4321",
    cwd: projectRoot,
    env: {
      ...process.env,
      PROFILE_SITE_BASE_URL: "https://fraguio.github.io/profile-site/",
      RESUME_PATH: fixturePath,
    },
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    url: "http://127.0.0.1:4321/profile-site/",
  },
});
