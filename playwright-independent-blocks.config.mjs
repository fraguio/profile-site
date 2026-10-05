import { fileURLToPath } from "node:url";
import { createPlaywrightConfig } from "./playwright.config.mjs";

export default createPlaywrightConfig({
  fixturePath: fileURLToPath(new URL("test/fixtures/valid-resume-with-independent-blocks.json", import.meta.url)),
  testMatch: "milestone-independent-blocks.browser.mjs",
});
