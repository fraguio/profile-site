import { defineConfig } from "@playwright/test";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));
const fixturePath = fileURLToPath(
  new URL("test/fixtures/fictitious-resume.json", import.meta.url),
);

export function createPlaywrightConfig({ fixturePath, testIgnore, testMatch }) {
  return defineConfig({
    testDir: "./e2e",
    ...(testIgnore && { testIgnore }),
    testMatch,
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
      reuseExistingServer: false,
      timeout: 120_000,
      url: "http://127.0.0.1:4321/profile-site/",
    },
  });
}

export default createPlaywrightConfig({
  fixturePath,
  testIgnore: [
    "timeline-filters-empty-category.browser.mjs",
    "timeline-reader-long-content.browser.mjs",
  ],
  testMatch: "*.browser.mjs",
});
