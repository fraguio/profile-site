import { writeFileSync } from "node:fs";

const [url, ...arguments_] = process.argv.slice(2);
const outputPath = arguments_
  .find((argument) => argument.startsWith("--output-path="))
  ?.slice("--output-path=".length);
const profile = arguments_.includes("--preset=desktop") ? "desktop" : "mobile";
const mobileRun = Number(/mobile-(\d+)\.json$/.exec(outputPath)?.[1]);

if (
  process.env.FAKE_LIGHTHOUSE_EXPECT_HEADLESS === "true" &&
  !arguments_.includes("--chrome-flags=--headless=new")
) {
  process.exitCode = 1;
} else if (process.env.FAKE_LIGHTHOUSE_FAILURE === "true") {
  process.exitCode = 1;
} else {
  const html = await (await fetch(url)).text();
  const resources = [
    ...html.matchAll(/<(?:script|link)\b[^>]+(?:src|href)="([^"]+)"/g),
  ].map((match) => new URL(match[1], url));

  await Promise.all(resources.map((resource) => fetch(resource)));
  writeFileSync(
    outputPath,
    JSON.stringify({
      audits: {
        "first-contentful-paint": { numericValue: 1200 },
        "largest-contentful-paint": { numericValue: 1800 },
        "total-blocking-time": { numericValue: 50 },
        "cumulative-layout-shift": { numericValue: 0.01 },
        interactive: { numericValue: 1900 },
      },
      categories: {
        performance: {
          score: profile === "mobile"
            ? Number(process.env.FAKE_LIGHTHOUSE_MOBILE_SCORE ?? 0.9 + mobileRun / 100)
            : Number(process.env.FAKE_LIGHTHOUSE_DESKTOP_SCORE ?? 0.95),
        },
      },
      finalUrl: url,
    }),
  );
}
