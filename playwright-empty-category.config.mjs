import { fileURLToPath } from "node:url";
import { createPlaywrightConfig } from "./playwright.config.mjs";

const fixturePath = fileURLToPath(
  new URL("test/fixtures/valid-resume-with-local-skills.json", import.meta.url),
);

export default createPlaywrightConfig({
  fixturePath,
  testMatch: "timeline-filters-empty-category.browser.mjs",
});
