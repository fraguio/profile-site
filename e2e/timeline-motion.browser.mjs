import { expect, test } from "@playwright/test";

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
      await expect(reader).toBeVisible();
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
      await expect(trigger).toHaveAttribute("aria-pressed", "true");
      await expect(reader).toBeVisible();
      if (reducedMotion === "reduce") {
        expect(await reader.evaluate((node) => node.getAnimations({ subtree: true }).length)).toBe(0);
      }
    });
  }
}
