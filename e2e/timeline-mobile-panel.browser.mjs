import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 } });

test("el panel mobile sustituye el carril, conserva su posicion y restaura el foco", async ({
  page,
}) => {
  await page.goto("./");

  const rail = page.locator('[data-contract="timeline-rail"]');
  const trigger = page
    .locator('[data-contract="milestone-trigger"]')
    .filter({ hasText: "Hito con contenido largo" });
  const panel = page.locator('[data-contract="timeline-mobile-panel"]');

  await trigger.scrollIntoViewIfNeeded();
  const frozenWindowScrollY = await page.evaluate(() => window.scrollY);

  await trigger.focus();
  await page.keyboard.press("Enter");

  const header = panel.locator('[data-contract="timeline-mobile-panel-header"]');
  const body = panel.locator('[data-contract="timeline-mobile-panel-body"]');
  const initialHeaderBox = await header.boundingBox();
  const panelBox = await panel.boundingBox();

  await expect(panel).toBeVisible();
  await expect(rail).toBeHidden();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(header).toBeFocused();
  await expect(body).toHaveCSS("overflow-y", "auto");
  expect(panelBox).not.toBeNull();
  expect(panelBox.y).toBeGreaterThanOrEqual(16);
  expect(panelBox.y).toBeLessThanOrEqual(24);
  expect(await body.evaluate((element) => element.scrollHeight)).toBeGreaterThan(
    await body.evaluate((element) => element.clientHeight),
  );

  await body.evaluate((element) => element.scrollTo({ top: element.scrollHeight }));
  await expect.poll(() => body.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  expect(await header.boundingBox()).toEqual(initialHeaderBox);

  await page.keyboard.press("Escape");

  await expect(panel).toBeHidden();
  await expect(rail).toBeVisible();
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute("data-timeline-focus-return", "programmatic");
  await expect(rail).toHaveAttribute("data-timeline-motion", "running");
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(frozenWindowScrollY);
});

test("el boton del panel mobile cierra el detalle y devuelve el foco al activador", async ({
  page,
}) => {
  await page.goto("./");

  const trigger = page
    .locator('[data-contract="milestone-trigger"]')
    .filter({ hasText: "Hito con contenido largo" });

  await trigger.focus();
  await page.keyboard.press("Space");
  await page.getByRole("button", { name: "Cerrar detalle", exact: true }).click();

  await expect(page.locator('[data-contract="timeline-mobile-panel"]')).toBeHidden();
  await expect(trigger).toBeFocused();
});
