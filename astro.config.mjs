import { defineConfig } from "astro/config";

const baseUrl = process.env.PROFILE_SITE_BASE_URL;

if (!baseUrl) {
  throw new Error("PROFILE_SITE_BASE_URL is required.");
}

let publicUrl;

try {
  publicUrl = new URL(baseUrl);
} catch {
  throw new Error("PROFILE_SITE_BASE_URL must be an absolute HTTPS URL.");
}

if (publicUrl.protocol !== "https:") {
  throw new Error("PROFILE_SITE_BASE_URL must use HTTPS.");
}

if (publicUrl.search) {
  throw new Error("PROFILE_SITE_BASE_URL must not include a query string.");
}

if (publicUrl.hash) {
  throw new Error("PROFILE_SITE_BASE_URL must not include a fragment.");
}

if (!publicUrl.pathname.endsWith("/")) {
  throw new Error("PROFILE_SITE_BASE_URL must end with a slash.");
}

export default defineConfig({
  base: publicUrl.pathname === "/" ? "/" : publicUrl.pathname.slice(0, -1),
  output: "static",
  site: publicUrl.origin,
  trailingSlash: "always",
});
