import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = JSON.parse(readFileSync(new URL("../test/fixtures/fictitious-resume.json", import.meta.url), "utf8"));

test("la navegación neutra conserva las acciones operativas bajo el base path", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("./");
  const navigation = page.getByRole("navigation", { name: "Navegación del perfil" });
  await expect(navigation.getByRole("link", { name: "CV web", exact: true })).toHaveAttribute("href", "/profile-site/read/");
  await expect(navigation.getByRole("link", { name: "CV PDF", exact: true })).toHaveAttribute("href", "/profile-site/cv/eduardo-nogueira-fraguio-cv.pdf");
  await expect(navigation.getByRole("link", { name: "Contacto" })).toHaveAttribute("href", "mailto:alicia.ejemplo@example.test");
  await expect(page.getByRole("button", { name: "Cambiar tema" })).toHaveCount(0);
});

for (const [width, height] of [[1366, 768], [1440, 900], [360, 800], [390, 844]]) {
  test(`identidad íntegra y acciones de la Fuente curricular en ${width} × ${height}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const failedResources = [];
    page.on("response", (response) => { if (response.status() >= 400) failedResources.push(response.url()); });
    await page.goto("./");
    await page.evaluate(() => document.fonts.ready);
    await expect(page.getByRole("heading", { name: source.basics.name, exact: true })).toBeInViewport({ ratio: 1 });
    await expect(page.getByText(source.basics.label, { exact: true })).toBeInViewport({ ratio: 1 });
    await expect(page.getByText(source.basics.summary, { exact: true })).toBeVisible();
    await expect(page.getByText("Madrid, Comunidad de Madrid, España", { exact: true })).toBeVisible();
    const actions = page.getByRole("navigation", { name: "Acciones principales" });
    for (const name of ["Leer CV web", "Descargar CV PDF", "Contactar"]) {
      await expect(actions.getByRole("link", { name, exact: true })).toBeInViewport({ ratio: 1 });
    }
    await expect(actions.getByRole("link", { name: "Descargar CV PDF" })).toHaveAttribute("download", "");
    await expect(actions.getByRole("link", { name: "Contactar" })).toHaveAttribute("href", `mailto:${source.basics.email}`);
    const profiles = page.getByRole("navigation", { name: "Enlaces profesionales" });
    await expect(profiles.getByRole("link", { name: "Sitio web" })).toHaveAttribute("href", source.basics.url);
    for (const profile of source.basics.profiles) {
      await expect(profiles.getByRole("link", { name: profile.network })).toHaveAttribute("href", profile.url);
    }
    const screenshot = process.env.PROFILE_IDENTITY_EVIDENCE_DIRECTORY
      ? join(process.env.PROFILE_IDENTITY_EVIDENCE_DIRECTORY, `identity-${width}x${height}.png`)
      : testInfo.outputPath(`identity-${width}x${height}.png`);
    await page.screenshot({ path: screenshot });
    await testInfo.attach(`Fuente: fictitious-resume.json; Todo, sin selección; ${width}x${height}`, { path: screenshot, contentType: "image/png" });
    expect(failedResources).toEqual([]);
    if (width < 1024) {
      await page.getByRole("link", { name: "Explorar trayectoria" }).click();
      await expect(page.getByRole("heading", { name: "Trayectoria" })).toBeInViewport();
      expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollSnapType)).toBe("none");
    }
  });
}

test("todas las acciones de identidad son alcanzables por Tab con foco interior", async ({ page }) => {
  await page.goto("./");
  const names = [];
  for (let index = 0; index < 16; index++) {
    await page.keyboard.press("Tab");
    const focused = page.locator(":focus");
    if (await focused.evaluate((element) => Boolean(element.closest(".profile-hero")))) {
      names.push(await focused.innerText());
      await expect(focused).toHaveCSS("box-shadow", "rgb(201, 190, 166) 0px 0px 0px 1px inset");
      await expect(focused).toHaveCSS("outline-style", "none");
    }
  }
  expect(names).toEqual(expect.arrayContaining(["Leer CV web", "Descargar CV PDF", "Contactar", "Sitio web", "GitHub", "LinkedIn", "Mastodon"]));
});

test("los enlaces profesionales comunican hover y activación sin depender del color", async ({ page }) => {
  await page.goto("./");
  const profiles = page.getByRole("navigation", { name: "Enlaces profesionales" });
  for (const name of ["Sitio web", "LinkedIn", "GitHub", "Mastodon"]) {
    const link = profiles.getByRole("link", { name, exact: true });
    await link.hover();
    await expect(link).toHaveCSS("text-decoration-line", "underline");
    await page.mouse.down();
    await expect(link).toHaveCSS("text-decoration-thickness", "2px");
    await page.mouse.move(0, 0);
    await page.mouse.up();
  }
});
