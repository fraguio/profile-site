import { fileURLToPath } from "node:url";
import { createPlaywrightConfig } from "./playwright.config.mjs";

const fixturePath = fileURLToPath(
  new URL("test/fixtures/fictitious-resume-with-long-milestone.json", import.meta.url),
);

export default createPlaywrightConfig({
  fixturePath,
  testMatch: "timeline-mobile-panel.browser.mjs",
});
