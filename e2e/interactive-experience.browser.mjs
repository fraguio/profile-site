import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("la experiencia interactiva compone identidad y trayectoria en columnas en desktop", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("./");

  const hero = page.getByRole("heading", { name: "Alicia Ejemplo" });
  const timeline = page.getByRole("region", { name: "Trayectoria" });
  const readLink = page.getByRole("link", { name: "Leer CV web" });

  await expect(page.getByRole("main")).toHaveCSS("display", "grid");
  await expect(page.getByRole("heading", { name: "Alicia Ejemplo" })).toBeInViewport();
  await expect(page.getByRole("heading", { name: "Alicia Ejemplo" })).toHaveCSS(
    "font-family",
    /Source Serif 4 Variable/,
  );
  await expect(
    page.getByText("Especialista en sistemas ficticios", { exact: true }),
  ).toBeInViewport();
  await expect(readLink).toBeInViewport();
  await expect(readLink).toHaveCSS("font-family", /Manrope Variable/);
  await expect(page.getByRole("link", { name: "Contactar" })).toBeInViewport();

  const [heroBox, timelineBox] = await Promise.all([
    hero.boundingBox(),
    timeline.boundingBox(),
  ]);

  expect(heroBox).not.toBeNull();
  expect(timelineBox).not.toBeNull();
  expect(timelineBox.x).toBeGreaterThan(heroBox.x + heroBox.width);

  await page.keyboard.press("Tab");
  await expect(readLink).toBeFocused();
  await expect(readLink).toHaveCSS("outline-style", "solid");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/profile-site\/read\/$/);
});

test.describe("en mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("la identidad mantiene CTAs visibles y enlaza la trayectoria consecutiva", async ({
    page,
  }) => {
    await page.goto("./");

    const hero = page.getByRole("heading", { name: "Alicia Ejemplo" });
    const timeline = page.getByRole("region", { name: "Trayectoria" });
    const exploreLink = page.getByRole("link", {
      name: "Explorar trayectoria",
    });

    await expect(page.getByRole("heading", { name: "Alicia Ejemplo" })).toBeInViewport();
    await expect(page.getByRole("link", { name: "Leer CV web" })).toBeInViewport();
    await expect(page.getByRole("link", { name: "Contactar" })).toBeInViewport();
    await expect(exploreLink).toBeVisible();
    await expect(exploreLink).toHaveAttribute("href", "#timeline-heading");
    await expect(page.getByRole("main")).toHaveCSS("display", "block");

    const [heroBox, timelineBox] = await Promise.all([
      hero.boundingBox(),
      timeline.boundingBox(),
    ]);

    expect(heroBox).not.toBeNull();
    expect(timelineBox).not.toBeNull();
    expect(timelineBox.y).toBeGreaterThan(heroBox.y);

    await exploreLink.click();
    await expect(page.getByRole("heading", { name: "Trayectoria" })).toBeInViewport();
  });
});

test("la experiencia interactiva conserva el arbol completo al desactivar JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();

  await page.goto("http://127.0.0.1:4321/profile-site/");

  await expect(page.getByRole("heading", { name: "Alicia Ejemplo" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Leer CV web" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Contactar" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Explorar trayectoria" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Trayectoria" })).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Trayectoria" }).getByRole("article"),
  ).toHaveCount(6);
  await expect(page.locator("body script")).toHaveCount(0);

  await context.close();
});

test("la experiencia interactiva no contiene vulneraciones Axe de nivel AA", async ({
  page,
}) => {
  await page.goto("./");

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();

  expect(results.violations).toEqual([]);
});

test("las acciones comunican la activacion sin depender solo del color", async ({
  page,
}) => {
  await page.goto("./");

  const contactLink = page.getByRole("link", { name: "Contactar" });

  await contactLink.hover();
  await page.mouse.down();
  await expect(contactLink).toHaveCSS("text-decoration-line", "underline");
  await page.mouse.up();
});
