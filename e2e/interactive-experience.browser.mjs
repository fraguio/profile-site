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
  await expect(page.locator('[data-contract="timeline-filters"]')).toBeHidden();
  await expect(page.locator('[data-contract="timeline-reader"]')).toHaveCount(0);
  await expect(page.getByRole("radio")).toHaveCount(0);

  await context.close();
});

test("el fallback desktop no muestra un lector y conserva todos los detalles", async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  await page.goto("http://127.0.0.1:4321/profile-site/");

  await expect(page.locator('[data-contract="timeline-reader"]')).toHaveCount(0);
  await expect(
    page.getByRole("article").filter({ hasText: "Arquitecta de software" }),
  ).toContainText("Redujo el tiempo de entrega.");
  await expect(
    page.getByRole("article").filter({ hasText: "Proyecto Vigente" }),
  ).toContainText("Node.js");

  await context.close();
});

test("el filtro inicial muestra la trayectoria combinada", async ({ page }) => {
  await page.goto("./");

  const filters = page.getByRole("group", { name: "Filtrar trayectoria" });

  await expect(filters).toBeVisible();
  await expect(
    page.getByRole("radio", { name: "Toda la trayectoria" }),
  ).toBeChecked();
  await expect(page.getByRole("radio")).toHaveCount(4);
  await expect(page.locator("[data-timeline-category]")).toHaveCount(6);
  await expect(page.locator("[data-timeline-category]:not([hidden])")).toHaveCount(6);
});

test("los filtros muestran cada categoria y anuncian el resultado sin persistirlo", async ({
  page,
}) => {
  await page.goto("./");

  const status = page.getByRole("status");
  const timeline = page.getByRole("region", { name: "Trayectoria" });
  const initialUrl = page.url();
  const initialBrowserState = await page.evaluate(() => ({
    historyLength: window.history.length,
    localStorage: Object.entries(window.localStorage),
    sessionStorage: Object.entries(window.sessionStorage),
  }));

  for (const [filterValue, label, count, announcement] of [
    [
      "work",
      "Experiencia profesional",
      2,
      "Se muestran 2 hitos de experiencia profesional.",
    ],
    ["projects", "Proyectos", 3, "Se muestran 3 hitos de proyectos."],
    ["education", "Formación", 1, "Se muestra 1 hito de formación."],
    ["all", "Toda la trayectoria", 6, "Se muestran 6 hitos de toda la trayectoria."],
  ]) {
    await page.getByRole("radio", { name: label }).click();

    await expect(page.locator("[data-timeline-category]:not([hidden])")).toHaveCount(
      count,
    );
    await expect(timeline.getByRole("article")).toHaveCount(count);
    if (filterValue !== "all") {
      await expect(
        timeline.locator(`[data-timeline-category="${filterValue}"]:not([hidden])`),
      ).toHaveCount(count);
    }
    await expect(status).toHaveText(announcement);
    await expect(page).toHaveURL(initialUrl);
    expect(
      await page.evaluate(() => ({
        historyLength: window.history.length,
        localStorage: Object.entries(window.localStorage),
        sessionStorage: Object.entries(window.sessionStorage),
      })),
    ).toEqual(initialBrowserState);
  }

  await page.reload();

  await expect(
    page.getByRole("radio", { name: "Toda la trayectoria" }),
  ).toBeChecked();
  await expect(page.locator("[data-timeline-category]:not([hidden])")).toHaveCount(6);
});

test("el teclado cambia el filtro y reinicia el carril en el hito mas reciente", async ({
  page,
}) => {
  await page.goto("./");

  const allFilter = page.getByRole("radio", { name: "Toda la trayectoria" });
  const workFilter = page.getByRole("radio", {
    name: "Experiencia profesional",
  });
  const timeline = page.getByRole("region", { name: "Trayectoria" });
  const rail = page.locator('[data-contract="timeline-rail"]');
  const initialScrollTop = await page.evaluate(() => window.scrollY);

  await rail.evaluate((element) => element.scrollTo({ top: element.scrollHeight }));
  expect(await rail.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);

  await allFilter.focus();
  await page.keyboard.press("ArrowRight");

  await expect(workFilter).toBeChecked();
  await expect(workFilter).toBeFocused();
  await expect(workFilter).toBeInViewport();
  await expect(page.getByRole("status")).toHaveText(
    "Se muestran 2 hitos de experiencia profesional.",
  );
  await expect(timeline.getByRole("article")).toHaveCount(2);
  await expect(timeline.locator("[data-timeline-category]").first()).toHaveAttribute(
    "data-timeline-category",
    "work",
  );
  expect(await page.evaluate(() => window.scrollY)).toBe(initialScrollTop);
  await expect
    .poll(() => rail.evaluate((element) => element.scrollTop))
    .toBe(0);
});

test.describe("con entrada touch", () => {
  test.use({ hasTouch: true });

  test("el filtro responde al toque", async ({ page }) => {
    await page.goto("./");

    await page.getByRole("radio", { name: "Proyectos" }).tap();

    await expect(page.locator("[data-timeline-category]:not([hidden])")).toHaveCount(3);
  });
});

test.describe("lector lateral desktop", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("abre un solo hito, comunica la seleccion y permite cerrarlo con teclado", async ({
    page,
  }) => {
    await page.goto("./");

    const firstMilestone = page
      .locator('[data-contract="milestone-trigger"]')
      .filter({ hasText: "Arquitecta de software" });
    const secondMilestone = page
      .locator('[data-contract="milestone-trigger"]')
      .filter({ hasText: "Proyecto Vigente" });
    const reader = page.locator('[data-contract="timeline-reader"]');
    const rail = page.locator('[data-contract="timeline-rail"]');
    const initialRailBox = await rail.boundingBox();

    await firstMilestone.click({ force: true });

    await expect(firstMilestone).toHaveAttribute("aria-pressed", "true");
    await expect(
      page.locator('[data-contract="milestone-trigger"][aria-pressed="true"]'),
    ).toHaveCount(1);
    await expect(reader).toBeVisible();
    await expect(reader).toContainText("Experiencia profesional");
    await expect(reader).toContainText("Arquitecta de software");
    await expect(reader).toContainText("Laboratorio Vigente");
    await expect(reader).toContainText("enero de 2025 - Actualidad");
    expect(await rail.boundingBox()).toEqual(initialRailBox);

    await secondMilestone.click({ force: true });

    await expect(firstMilestone).toHaveAttribute("aria-pressed", "false");
    await expect(secondMilestone).toHaveAttribute("aria-pressed", "true");
    await expect(
      page.locator('[data-contract="milestone-trigger"][aria-pressed="true"]'),
    ).toHaveCount(1);
    await expect(reader).toContainText("Proyecto Vigente");

    await secondMilestone.focus();
    await page.keyboard.press("Space");

    await expect(reader).toBeHidden();
    await expect(secondMilestone).toHaveAttribute("aria-pressed", "false");
    expect(await rail.boundingBox()).toEqual(initialRailBox);

    await secondMilestone.focus();
    await page.keyboard.press("Enter");
    await expect(reader).toBeVisible();
    await page.keyboard.press("Escape");

    await expect(reader).toBeHidden();
    await expect(secondMilestone).toBeFocused();
  });

  test("el cierre y el cambio de filtro limpian el lector antes de anunciar el conjunto", async ({
    page,
  }) => {
    await page.goto("./");

    const milestone = page
      .locator('[data-contract="milestone-trigger"]')
      .filter({ hasText: "Arquitecta de software" });
    const reader = page.locator('[data-contract="timeline-reader"]');

    await milestone.click({ force: true });
    await page.getByRole("button", { name: "Cerrar detalle", exact: true }).click();

    await expect(reader).toBeHidden();
    await expect(milestone).toBeFocused();

    await milestone.click({ force: true });
    await page.getByRole("radio", { name: "Proyectos" }).click();

    await expect(reader).toBeHidden();
    await expect(
      page.locator('[data-contract="milestone-trigger"][aria-pressed="true"]'),
    ).toHaveCount(0);
    await expect(page.getByRole("status")).toHaveText(
      "Se muestran 3 hitos de proyectos.",
    );
  });
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
