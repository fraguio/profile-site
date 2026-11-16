import { expect, test } from "@playwright/test";

test("la carga y F5 no pintan la composición base mientras llega la mejora", async ({ page }) => {
  await page.route(/\/_astro\/.*\.js$/, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    await route.continue();
  });
  await page.addInitScript(() => {
    window.visibleFallbackFrames = 0;
    const sample = () => {
      const detail = document.querySelector('[data-contract="milestone-detail"]');
      if (detail && !document.documentElement.classList.contains("timeline-enhanced") &&
          detail.getBoundingClientRect().height > 0 && getComputedStyle(detail).visibility === "visible") {
        window.visibleFallbackFrames++;
      }
      if (!document.documentElement.classList.contains("timeline-enhanced")) requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
  for (const navigate of [() => page.goto("./"), () => page.reload()]) {
    await navigate();
    await expect(page.locator('[data-contract="timeline-filters"]')).toBeVisible();
    expect(await page.evaluate(() => window.visibleFallbackFrames)).toBe(0);
    await expect(page.getByRole("link", { name: "Leer CV web", exact: true })).toBeVisible();
  }
});

test("un módulo tardío restaura el HTML completo y no lo mejora después del plazo", async ({ page }) => {
  await page.route(/\/_astro\/.*\.js$/, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 2500));
    await route.continue();
  });
  await page.goto("./", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("Redujo el tiempo de entrega.", { exact: true })).toBeVisible();
  await page.waitForLoadState("networkidle");
  await expect(page.locator('[data-contract="milestone-detail"]')).toHaveCount(6);
  await expect(page.locator('[data-contract="milestone-trigger"]')).toHaveCount(0);
  await expect(page.locator('[data-contract="timeline-filters"]')).toBeHidden();
});

test("un fallo durante la mejora restaura todos los detalles y retira los controles", async ({ page }) => {
  await page.addInitScript(() => {
    window.ResizeObserver = class { constructor() { throw new Error("Fallo de mejora simulado"); } };
  });
  await page.goto("./");
  await expect(page.locator('[data-contract="milestone-detail"]')).toHaveCount(6);
  await expect(page.getByText("Redujo el tiempo de entrega.", { exact: true })).toBeVisible();
  await expect(page.locator('[data-contract="milestone-trigger"]')).toHaveCount(0);
  await expect(page.locator('[data-contract="timeline-filters"]')).toBeHidden();
});

test("Escape durante la apertura vuelve al reposo y las acciones rápidas conservan un único detalle", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("./");
  await page.getByRole("button", { name: "Todo", exact: true }).click();
  const first = page.getByRole("button", { name: /Arquitecta de software/ });
  const other = page.getByRole("button", { name: /Proyecto Vigente/ });
  const reader = page.locator('[data-contract="timeline-reader"]');
  await first.focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Escape");
  await expect(reader).toBeHidden();
  await expect(first).toBeFocused();
  await first.press("Enter");
  await other.press("Space");
  await expect(reader).toContainText("Proyecto Vigente");
  await expect(page.locator('[data-contract="milestone-trigger"][aria-pressed="true"]')).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(reader).toBeHidden();
  await expect(other).toBeFocused();
});

for (const width of [1440, 390]) {
  test(`el fallo de inicialización conserva trayectoria, detalles y acciones a ${width} px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.route("**/profile-site/", async (route) => {
      const response = await route.fetch();
      await route.fulfill({
        response,
        headers: { ...response.headers(), "content-security-policy": "script-src 'none'" },
      });
    });
    await page.goto("./");
    await expect(page.locator('[data-contract="timeline-filters"]')).toBeHidden();
    await expect(page.locator('[data-contract="milestone-trigger"]')).toHaveCount(0);
    await expect(page.locator('[data-contract="timeline-reader"]')).toHaveCount(0);
    await expect(page.getByRole("region", { name: "Trayectoria" }).getByRole("article")).toHaveCount(6);
    await expect(page.locator('[data-contract="milestone-detail"]')).toHaveCount(6);
    await expect(page.getByText("Redujo el tiempo de entrega.", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Ver proyecto" })).toHaveAttribute("href", "https://projects.example.test/distributed?view=public#overview");
    await expect(page.getByRole("link", { name: "Leer CV web" })).toHaveAttribute("href", "/profile-site/read/");
  });

  for (const reducedMotion of ["no-preference", "reduce"]) {
    test(`el timeline permanece estático sin controles de movimiento a ${width} px con ${reducedMotion}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion });
      await page.goto("./");
      const rail = page.locator('[data-contract="timeline-rail"]');
      const reader = page.locator('[data-contract="timeline-reader"]');
      if (width >= 1024) await expect(reader).toBeHidden();
      else await expect(reader).toBeVisible();
      await expect(page.getByRole("button", { name: /Pausar|Reanudar|Cerrar/ })).toHaveCount(0);
      const trigger = page.locator('[data-contract="milestone-trigger"]').first();
      if (width >= 1024) {
        await rail.evaluate((node) => { node.scrollTop = 80; });
      } else {
        await trigger.scrollIntoViewIfNeeded();
      }
      const initial = await rail.evaluate((node) => ({ top: node.scrollTop, windowY: scrollY }));
      await page.waitForTimeout(600);
      expect(await rail.evaluate((node) => ({ top: node.scrollTop, windowY: scrollY }))).toEqual(initial);
      await trigger.focus();
      await page.keyboard.press("Enter");
      await page.keyboard.press("Escape");
      await expect(trigger).toHaveAttribute("aria-pressed", String(width < 1024));
      if (width >= 1024) await expect(reader).toBeHidden();
      else await expect(reader).toBeVisible();
      if (reducedMotion === "reduce") {
        expect(await reader.evaluate((node) => node.getAnimations({ subtree: true }).length)).toBe(0);
      }
    });
  }
}
