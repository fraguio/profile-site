import { fileURLToPath } from "node:url";
import { createPlaywrightConfig } from "./playwright.config.mjs";

export default createPlaywrightConfig({
  fixturePath: fileURLToPath(new URL("test/fixtures/valid-resume-without-timeline.json", import.meta.url)),
  testMatch: "profile-identity-empty-timeline.browser.mjs",
});
