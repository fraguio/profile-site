import { expect, test } from "@playwright/test";

for (const width of [360, 390, 768]) {
  test.describe(`cierre táctil a ${width} px`, () => {
    test.use({ viewport: { width, height: width === 768 ? 1024 : 844 }, hasTouch: true });

    test("Cerrar y Escape retiran el detalle y devuelven el foco para continuar con Tab", async ({ page }) => {
      await page.goto("./");
      const trigger = page.getByRole("button", { name: /Hito con contenido largo/ });
      const next = page.getByRole("button", { name: /Otra lectura extensa/ });
      const reader = page.locator('[data-contract="timeline-reader"]');
      for (const method of ["Cerrar", "Escape"]) {
        await trigger.tap();
        const close = page.getByRole("button", { name: "Cerrar", exact: true });
        await expect(close).toBeVisible();
        await expect(close.locator('svg[aria-hidden="true"]')).toHaveCount(1);
        const closeBox = await close.boundingBox();
        const headerBox = await reader.locator('[data-contract="timeline-reader-header"]').boundingBox();
        expect(closeBox.y + closeBox.height).toBeLessThanOrEqual(headerBox.y);
        if (method === "Cerrar") await close.tap();
        else {
          await page.getByRole("button", { name: "Todo", exact: true }).focus();
          await page.keyboard.press("Escape");
        }
        await expect(reader).toBeHidden();
        await expect(trigger).toHaveAttribute("aria-pressed", "false");
        await expect(trigger).toBeFocused();
        await expect(close).toHaveCount(0);
        await page.keyboard.press("Tab");
        await expect(next).toBeFocused();
        await expect(next).not.toHaveCSS("box-shadow", "none");
      }
    });
  });
}

for (const width of [360, 390]) {
  test.describe(`${width} px`, () => {
    test.use({ viewport: { width, height: width === 360 ? 800 : 844 } });

    test("la cabecera compacta conserva fechas y el cuerpo aprovecha la anchura de lectura", async ({ page }) => {
      await page.goto("./");
      await page.getByRole("button", { name: /Hito con contenido largo/ }).click();
      const reader = page.getByRole("region", { name: /Detalle del hito:.*Hito con contenido largo/ });
      const header = reader.locator('[data-contract="timeline-reader-header"]');
      await expect(header.locator("h3")).toBeHidden();
      await expect(header.locator(".milestone__category")).toBeHidden();
      await expect(header.locator(".milestone__entity")).toBeHidden();
      await expect(header.locator(".milestone__period")).toBeVisible();
      await expect(header).toContainText("enero de 2025 - Actualidad");
      const body = reader.locator('[data-contract="timeline-reader-body"]');
      const box = await body.boundingBox();
      expect(box.width).toBeGreaterThanOrEqual(width - 64);
      await expect(body).toContainText("Integración continua y despliegue con fuentes curriculares reproducibles");
      expect(await body.evaluate((element) => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
      await expect(header.getByText("Rol: Hito con contenido largo", { exact: true })).toBeVisible();
      const next = page.getByRole("button", { name: /Otra lectura extensa/ });
      await body.locator("li").last().scrollIntoViewIfNeeded();
      await next.scrollIntoViewIfNeeded();
      await expect(next).toBeInViewport();
      await next.focus();
      await page.keyboard.press("Enter");
      await expect(next).toHaveAttribute("aria-pressed", "true");
    });

    test("el detalle se intercala tras el hito y permite leer contenido largo con scroll del documento", async ({ page }) => {
      await page.goto("./");
      const rail = page.locator('[data-contract="timeline-rail"]');
      const trigger = page.getByRole("button", { name: /Hito con contenido largo/ });
      const reader = page.locator('[data-contract="timeline-reader"]');
      const body = reader.locator('[data-contract="timeline-reader-body"]');
      await trigger.focus();
      await page.keyboard.press("Enter");
      await expect(trigger).toBeFocused();
      await expect(trigger).toHaveAttribute("aria-pressed", "true");
      await expect(reader).toBeVisible();
      await expect(reader).toHaveAccessibleName(/Detalle del hito:.*Hito con contenido largo/);
      await expect(rail).toBeVisible();
      expect(await trigger.evaluate((element) => element.nextElementSibling?.getAttribute("data-contract"))).toBe("timeline-reader");
      expect(await reader.evaluate((element) => element.closest("button"))).toBeNull();
      await expect(rail).toHaveCSS("overflow-y", "visible");
      await expect(body).toHaveCSS("overflow-y", "visible");
      await expect(page.locator('.timeline__scroll-gradient:visible')).toHaveCount(0);
      await expect(body).toHaveAttribute("tabindex", "-1");
      expect(await body.evaluate((element) => element.scrollHeight - element.clientHeight)).toBeLessThanOrEqual(1);
      expect(await reader.evaluate((element) => element.getBoundingClientRect().height)).toBeGreaterThan(844);
      const lastContent = body.locator("li").last();
      await lastContent.scrollIntoViewIfNeeded();
      await expect(lastContent).toBeInViewport();
      expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await trigger.focus();
      await page.keyboard.press("Space");
      await expect(reader).toBeVisible();
      await expect(trigger).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(reader).toBeHidden();
      await expect(trigger).toBeFocused();
    });

    test("también coloca el detalle después del último hito visible", async ({ page }) => {
      await page.goto("./");
      const trigger = page.locator('[data-contract="milestone-trigger"]').last();
      await trigger.click();
      await expect(trigger).toBeFocused();
      expect(await trigger.evaluate((element) => element.nextElementSibling?.getAttribute("data-contract"))).toBe("timeline-reader");
      await expect(page.locator('[data-contract="timeline-reader"]')).toHaveCount(1);
      await expect(page.locator('[data-contract="milestone-trigger"][aria-pressed="true"]')).toHaveCount(1);
      const first = page.locator('[data-contract="milestone-trigger"]').first();
      await first.focus();
      await page.keyboard.press("Enter");
      await expect(first).toHaveAttribute("aria-pressed", "true");
      await expect(first).toBeFocused();
      await trigger.focus();
      await page.keyboard.press("Space");
      await expect(trigger).toHaveAttribute("aria-pressed", "true");
      await expect(trigger).toBeFocused();
    });
  });
}
