import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const argumentsForAstro = process.argv.slice(2);
const outputDirectory = outputDirectoryFrom(argumentsForAstro);
const astroEntrypoint = fileURLToPath(
  new URL("astro.js", import.meta.resolve("astro/package.json")),
);

run(process.execPath, [astroEntrypoint, "build", ...argumentsForAstro]);
run(process.execPath, ["scripts/generate-cv-pdf.mjs", outputDirectory]);

function outputDirectoryFrom(argumentsForBuild) {
  for (let index = 0; index < argumentsForBuild.length; index += 1) {
    if (argumentsForBuild[index] === "--outDir") {
      return resolve(argumentsForBuild[index + 1]);
    }

    if (argumentsForBuild[index].startsWith("--outDir=")) {
      return resolve(argumentsForBuild[index].slice("--outDir=".length));
    }
  }

  return resolve("dist");
}

function run(command, argumentsForCommand) {
  const result = spawnSync(command, argumentsForCommand, {
    stdio: "inherit",
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
