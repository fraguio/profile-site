import { expect, test } from "@playwright/test";

test("el fallo al cargar GSAP conserva el timeline estático y completo", async ({ page }) => {
  let gsapRequestWasBlocked = false;

  await page.route("**/_astro/*.js", async (route) => {
    if (route.request().url().includes("astro_type_script")) {
      await route.continue();
      return;
    }

    gsapRequestWasBlocked = true;
    await route.abort();
  });
  await page.goto("./");

  await expect(page.locator('[data-contract="timeline-filters"]')).toBeHidden();
  await expect(page.locator('[data-contract="timeline-motion-control"]')).toHaveCount(0);
  await expect(page.locator('[data-contract="milestone-trigger"]')).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Trayectoria" }).getByRole("article")).toHaveCount(6);
  expect(gsapRequestWasBlocked).toBe(true);
});

test.describe("movimiento continuo del timeline", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("mueve el carril y permite pausarlo y reanudarlo mediante el control", async ({
    page,
  }) => {
    await page.goto("./");

    const rail = page.locator('[data-contract="timeline-rail"]');
    const control = page.locator('[data-contract="timeline-motion-control"]');

    await expect(control).toBeVisible();
    await expect(rail).toHaveAttribute("data-timeline-motion", "running");
    await expect.poll(() => rail.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);

    await control.focus();
    await page.keyboard.press("Enter");

    await expect(control).toHaveAccessibleName("Reanudar movimiento");
    await expect(rail).toHaveAttribute("data-timeline-motion", "paused");
    const pausedPosition = await rail.evaluate((element) => element.scrollTop);
    await page.waitForTimeout(150);
    expect(await rail.evaluate((element) => element.scrollTop)).toBeCloseTo(pausedPosition, 0);

    await control.click();

    await expect(control).toHaveAccessibleName("Pausar movimiento");
    await expect(rail).toHaveAttribute("data-timeline-motion", "running");
  });

  test("avanza a una velocidad legible sin mostrar una barra lateral", async ({ page }) => {
    await page.goto("./");

    const rail = page.locator('[data-contract="timeline-rail"]');
    const initialPosition = await rail.evaluate((element) => element.scrollTop);
    await page.waitForTimeout(500);

    expect(await rail.evaluate((element) => element.scrollTop) - initialPosition).toBeGreaterThanOrEqual(
      35,
    );
    await expect(rail).toHaveCSS("scrollbar-width", "none");
  });

  test("la selección de texto pausa el carril", async ({ page }) => {
    await page.goto("./");

    const rail = page.locator('[data-contract="timeline-rail"]');
    await rail.focus();
    await page.keyboard.press("Control+A");
    await expect.poll(() => page.evaluate(() => window.getSelection()?.toString())).not.toBe("");
    await page.getByRole("radio", { name: "Toda la trayectoria" }).focus();
    await expect(rail).toHaveAttribute("data-timeline-motion", "paused");

  });

  test("el hover y el foco pausan el carril sin convertirlos en una pausa manual", async ({
    page,
  }) => {
    await page.goto("./");

    const rail = page.locator('[data-contract="timeline-rail"]');
    const trigger = page.locator('[data-contract="milestone-trigger"]').first();

    await trigger.hover({ force: true });
    await expect(rail).toHaveAttribute("data-timeline-motion", "paused");
    await page.mouse.move(0, 0);
    await expect(rail).toHaveAttribute("data-timeline-motion", "running");

    await trigger.focus();
    await expect(rail).toHaveAttribute("data-timeline-motion", "paused");
    await page.getByRole("radio", { name: "Toda la trayectoria" }).focus();
    await expect(rail).toHaveAttribute("data-timeline-motion", "running");
  });

  test("el control cierra un detalle abierto y reanuda el movimiento", async ({ page }) => {
    await page.goto("./");

    const rail = page.locator('[data-contract="timeline-rail"]');
    const trigger = page.locator('[data-contract="milestone-trigger"]').first();

    await trigger.click({ force: true });
    await expect(rail).toHaveAttribute("data-timeline-motion", "paused");
    await page.getByRole("button", { name: "Cerrar detalle y reanudar" }).click();

    await expect(page.locator('[data-contract="timeline-reader"]')).toBeHidden();
    await expect(rail).toHaveAttribute("data-timeline-motion", "running");
  });

  test("los cierres normales conservan una pausa manual", async ({ page }) => {
    await page.goto("./");

    const rail = page.locator('[data-contract="timeline-rail"]');
    const trigger = page.locator('[data-contract="milestone-trigger"]').first();

    await page.getByRole("button", { name: "Pausar movimiento" }).click();
    await trigger.click({ force: true });
    await page.getByRole("button", { name: "Cerrar detalle", exact: true }).click();

    await expect(rail).toHaveAttribute("data-timeline-motion", "paused");
  });

  test("cerrar un detalle reanuda el carril cuando no existe una pausa manual", async ({
    page,
  }) => {
    await page.goto("./");

    const rail = page.locator('[data-contract="timeline-rail"]');
    await page.locator('[data-contract="milestone-trigger"]').first().click({ force: true });
    await page.getByRole("button", { name: "Cerrar detalle", exact: true }).click();

    await expect(rail).toHaveAttribute("data-timeline-motion", "running");
  });

  test("Esc deja el hito con el mismo estilo que cerrar el detalle mediante botón", async ({
    page,
  }) => {
    await page.goto("./");

    const trigger = page.locator('[data-contract="milestone-trigger"]').first();
    await trigger.click({ force: true });
    await page.getByRole("button", { name: "Cerrar detalle", exact: true }).click();
    const buttonCloseOutlineStyle = await trigger.evaluate(
      (element) => window.getComputedStyle(element).outlineStyle,
    );

    await trigger.click({ force: true });
    await page.keyboard.press("Escape");

    await expect(trigger).toBeFocused();
    await expect(page.locator('[data-contract="timeline-rail"]')).toHaveAttribute(
      "data-timeline-motion",
      "running",
    );
    await expect
      .poll(() => trigger.evaluate((element) => window.getComputedStyle(element).outlineStyle))
      .toBe(buttonCloseOutlineStyle);
  });

  test("el cambio de filtro conserva la pausa manual y reinicia el nuevo conjunto", async ({
    page,
  }) => {
    await page.goto("./");

    const rail = page.locator('[data-contract="timeline-rail"]');
    await page.getByRole("button", { name: "Pausar movimiento" }).click();
    await rail.evaluate((element) => element.scrollTo({ top: element.scrollHeight }));
    await page.getByRole("radio", { name: "Proyectos" }).click();

    await expect(rail).toHaveAttribute("data-timeline-motion", "paused");
    await expect.poll(() => rail.evaluate((element) => element.scrollTop)).toBe(0);
  });

  test("el filtro elimina las pausas transitorias que ya no aplican", async ({ page }) => {
    await page.goto("./");

    const rail = page.locator('[data-contract="timeline-rail"]');
    await page.locator('[data-contract="milestone-trigger"]').first().focus();
    await expect(rail).toHaveAttribute("data-timeline-motion", "paused");
    await page.getByRole("radio", { name: "Toda la trayectoria" }).focus();
    await page.keyboard.press("ArrowRight");

    await expect(page.getByRole("radio", { name: "Experiencia profesional" })).toBeChecked();
    await expect(rail).toHaveAttribute("data-timeline-motion", "running");
  });

  test("el filtro conserva una selección de texto que aún permanece activa", async ({
    page,
  }) => {
    await page.goto("./");

    const rail = page.locator('[data-contract="timeline-rail"]');
    await rail.focus();
    await page.keyboard.press("Control+A");
    await page.getByRole("radio", { name: "Experiencia profesional" }).click();

    await expect(page.getByRole("radio", { name: "Experiencia profesional" })).toBeChecked();
    await expect(rail).toHaveAttribute("data-timeline-motion", "paused");
  });
});

test("reduced motion comienza estático y exige una acción explícita", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./");

  const rail = page.locator('[data-contract="timeline-rail"]');
  const control = page.getByRole("button", { name: "Reanudar movimiento" });

  await expect(rail).toHaveAttribute("data-timeline-motion", "paused");
  await expect(control).toBeVisible();
  await control.click();
  await expect(rail).toHaveAttribute("data-timeline-motion", "running");
});

test.describe("movimiento con entrada touch", () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });

  test("el control pausa y reanuda mediante touch", async ({ page }) => {
    await page.goto("./");

    const rail = page.locator('[data-contract="timeline-rail"]');
    const control = page.locator('[data-contract="timeline-motion-control"]');

    await control.tap();
    await expect(rail).toHaveAttribute("data-timeline-motion", "paused");
    await control.tap();
    await expect(rail).toHaveAttribute("data-timeline-motion", "running");
  });

  test("avanza sin mostrar una barra lateral", async ({ page }) => {
    await page.goto("./");

    const rail = page.locator('[data-contract="timeline-rail"]');
    const initialPosition = await rail.evaluate((element) => element.scrollTop);
    await page.waitForTimeout(500);

    expect(await rail.evaluate((element) => element.scrollTop) - initialPosition).toBeGreaterThanOrEqual(
      35,
    );
    await expect(rail).toHaveCSS("scrollbar-width", "none");
  });

  test("el control cierra el panel, devuelve el foco y reanuda mediante touch", async ({
    page,
  }) => {
    await page.goto("./");

    const rail = page.locator('[data-contract="timeline-rail"]');
    const trigger = page.locator('[data-contract="milestone-trigger"]').first();

    await trigger.tap({ force: true });
    await page
      .getByRole("button", { name: "Cerrar detalle y reanudar", exact: true })
      .tap();

    await expect(trigger).toBeFocused();
    await expect(rail).toHaveAttribute("data-timeline-motion", "running");
  });

  test("un toque detiene inmediatamente el carril y cerrar el panel restaura su estado", async ({
    page,
  }) => {
    await page.goto("./");

    const rail = page.locator('[data-contract="timeline-rail"]');
    const trigger = page.locator('[data-contract="milestone-trigger"]').first();

    await expect.poll(() => rail.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    const frozenPosition = await rail.evaluate((element) => element.scrollTop);
    await trigger.tap({ force: true });
    await expect(rail).toHaveAttribute("data-timeline-motion", "paused");
    await page.getByRole("button", { name: "Cerrar detalle", exact: true }).click();
    await expect(rail).toHaveAttribute("data-timeline-motion", "running");
    await expect(trigger).toBeFocused();
    expect(await rail.evaluate((element) => element.scrollTop)).toBeLessThanOrEqual(
      frozenPosition + 16,
    );
  });
});
