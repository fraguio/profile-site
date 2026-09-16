import { createServer } from "node:http";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, extname, isAbsolute, join, relative, resolve } from "node:path";
import { chromium } from "@playwright/test";

const outputDirectory = resolve(process.argv[2] ?? "dist");
const publicBaseUrl = process.env.PROFILE_SITE_BASE_URL;
const readDocumentPath = join(outputDirectory, "read", "index.html");
const pdfPath = join(outputDirectory, "cv", "eduardo-nogueira-fraguio-cv.pdf");

if (!publicBaseUrl) {
  fail("PROFILE_SITE_BASE_URL is required.");
}

if (!existsSync(readDocumentPath)) {
  fail(`CV web HTML not found: ${readDocumentPath}`);
}

const publicBasePath = new URL(publicBaseUrl).pathname;
const readPath = new URL("read/", publicBaseUrl).pathname;
const server = createServer((request, response) => {
  const requestPath = decodeURIComponent(
    new URL(request.url ?? "/", "http://127.0.0.1").pathname,
  );

  if (!requestPath.startsWith(publicBasePath)) {
    response.writeHead(404).end();
    return;
  }

  const requestedPath = requestPath.slice(publicBasePath.length);
  const filePath = resolve(
    outputDirectory,
    requestedPath.endsWith("/") ? join(requestedPath, "index.html") : requestedPath,
  );
  const relativePath = relative(outputDirectory, filePath);

  if (isAbsolute(relativePath) || relativePath.startsWith("..")) {
    response.writeHead(403).end();
    return;
  }

  if (!existsSync(filePath)) {
    response.writeHead(404).end();
    return;
  }

  response.setHeader("content-type", contentType(filePath));
  response.end(readFileSync(filePath));
});

try {
  await listen(server);
  const address = server.address();

  if (!address || typeof address === "string") {
    throw new Error("Unable to start the temporary static server.");
  }

  let browser;

  try {
    browser = await chromium.launch();
  } catch (error) {
    throw new Error("Unable to launch Chromium.", { cause: error });
  }

  try {
    const page = await browser.newPage();
    const localReadUrl = `http://127.0.0.1:${address.port}${readPath}`;

    await page.goto(localReadUrl, { waitUntil: "networkidle" });
    await page.emulateMedia({ media: "print" });

    const cvText = await page.locator("main").innerText();
    const actionsAreHidden = await page
      .locator('[data-contract="read-actions"]')
      .evaluate((element) => getComputedStyle(element).display === "none");

    if (cvText.trim() === "") {
      throw new Error("CV web document is empty.");
    }

    if (!actionsAreHidden) {
      throw new Error("CV web actions must be hidden when printing.");
    }

    mkdirSync(dirname(pdfPath), { recursive: true });
    await page.pdf({
      format: "A4",
      margin: "2cm",
      path: pdfPath,
      printBackground: true,
    });
  } finally {
    await browser.close();
  }

  const pdf = readFileSync(pdfPath);
  const pageCount = (pdf.toString("latin1").match(/\/Type\s*\/Page\b/g) ?? []).length;

  if (pdf.length === 0) {
    throw new Error("Generated CV PDF is empty.");
  }

  if (pdf.subarray(0, 5).toString("ascii") !== "%PDF-") {
    throw new Error("Generated CV PDF does not start with the PDF signature.");
  }

  if (pageCount === 0) {
    throw new Error("Generated CV PDF has no pages.");
  }

  console.log(`CV PDF generated: ${pageCount} page${pageCount === 1 ? "" : "s"}.`);
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
} finally {
  server.close();
}

function listen(server) {
  return new Promise((resolveListen, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolveListen);
  });
}

function fail(message) {
  console.error(`CV PDF generation failed: ${message}`);
  process.exitCode = 1;
  throw new Error(message);
}

function contentType(filePath) {
  switch (extname(filePath)) {
    case ".css":
      return "text/css; charset=utf-8";
    case ".html":
      return "text/html; charset=utf-8";
    case ".js":
      return "text/javascript; charset=utf-8";
    case ".svg":
      return "image/svg+xml";
    case ".woff2":
      return "font/woff2";
    default:
      return "application/octet-stream";
  }
}
