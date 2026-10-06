import { expect, test } from "@playwright/test";

for (const width of [360, 390]) {
  test.describe(`${width} px`, () => {
    test.use({ viewport: { width, height: 844 } });

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
      await page.keyboard.press("Escape");
      await expect(reader).toBeVisible();
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
