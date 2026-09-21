import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const astroEntrypoint = fileURLToPath(
  new URL("astro.js", import.meta.resolve("astro/package.json")),
);
const child = spawn(process.execPath, [astroEntrypoint, "dev"], {
  env: {
    ...process.env,
    PROFILE_SITE_BASE_URL: "https://fraguio.github.io/profile-site/",
    RESUME_PATH: resolve("src/prototypes/interactive-experience/resume.fixture.json"),
  },
  stdio: "inherit",
});

child.on("exit", (code) => process.exit(code ?? 1));
