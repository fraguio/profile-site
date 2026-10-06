import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 1440, height: 900 } });

for (const viewport of [{ width: 1366, height: 768 }, { width: 1440, height: 900 }]) {
  test(`las señales del detalle siguen el overflow y la modalidad de foco en ${viewport.width} × ${viewport.height}`, async ({ page }) => {
    test.info().annotations.push({ type: "fuente", description: "fictitious-resume-with-long-milestone.json; detalle largo → viewport amplio → contenido sin overflow; B02" });
    await page.setViewportSize(viewport);
    await page.goto("./");
    const body = page.locator('[data-contract="timeline-reader-body"]');
    const frame = body.locator("..");
    const gradient = frame.locator('[aria-hidden="true"]');
    const transparent = "rgba(0, 0, 0, 0) rgba(0, 0, 0, 0)";
    await page.mouse.move(0, 0);
    await expect(body).toHaveCSS("scrollbar-color", transparent);
    await expect(gradient).toBeVisible();
    const surface = await body.evaluate((element) => {
      const box = element.getBoundingClientRect();
      return { x: box.x, y: box.y, width: element.clientWidth, height: element.clientHeight, gutter: box.width - element.clientWidth };
    });
    expect(surface.gutter).toBeGreaterThan(0);
    const overlay = await gradient.boundingBox();
    expect(overlay.x).toBe(surface.x);
    expect(overlay.width).toBe(surface.width);
    expect(overlay.y + overlay.height).toBeCloseTo(surface.y + surface.height, 0);
    await body.hover();
    await expect(body).not.toHaveCSS("scrollbar-color", transparent);
    await body.click();
    expect(await body.evaluate((element) => element.clientWidth)).toBe(surface.width);
    await page.mouse.move(0, 0);
    await expect(body).toBeFocused();
    await expect(body).toHaveCSS("scrollbar-color", transparent);
    await expect(frame).toHaveCSS("box-shadow", "none");
    await page.locator('[data-contract="milestone-trigger"]').last().focus();
    await page.keyboard.press("Tab");
    await expect(body).toBeFocused();
    await expect(body).not.toHaveCSS("scrollbar-color", transparent);
    await page.keyboard.press("Control+End");
    await expect(gradient).toBeHidden();
    await page.keyboard.press("Control+Home");
    await expect(gradient).toBeVisible();
    await page.setViewportSize({ width: viewport.width, height: 2400 });
    await expect.poll(() => body.evaluate((element) => element.scrollHeight - element.clientHeight)).toBeLessThanOrEqual(1);
    await expect(gradient).toBeHidden();
    await body.hover();
    await expect(body).toHaveCSS("scrollbar-color", transparent);
    await page.setViewportSize(viewport);
    await expect(gradient).toBeVisible();
    // Cambio de contenido renderizado: ejercita la actualización sin un nuevo viewport o selección.
    await body.locator('[data-contract="milestone-detail"]').evaluate((element) => { element.textContent = "Lectura breve completa."; });
    await expect.poll(() => body.evaluate((element) => element.scrollHeight - element.clientHeight)).toBeLessThanOrEqual(1);
    await expect(gradient).toBeHidden();
    await expect(body).toHaveCSS("scrollbar-color", transparent);
  });

  test(`el marco desktop permite leer por teclado hasta el final en ${viewport.width} × ${viewport.height}`, async ({ page }) => {
    test.info().annotations.push({ type: "fuente", description: "fictitious-resume-with-long-milestone.json; primer hito; Todo; contenido largo" });
    await page.setViewportSize(viewport);
    await page.goto("./");
    await page.evaluate(() => document.fonts.ready);
    const reader = page.locator('[data-contract="timeline-reader"]');
    const header = reader.locator('[data-contract="timeline-reader-header"]');
    const body = page.getByRole("region", { name: /Lectura del hito:.*Hito con contenido largo/ });
    await expect(body).toHaveAttribute("tabindex", "0");
    const frame = body.locator("..");
    for (const edge of ["top", "right", "bottom", "left"]) await expect(frame).toHaveCSS(`padding-${edge}`, "12px");
    await expect(body).toHaveCSS("scrollbar-gutter", "stable");
    await expect(reader).toHaveCSS("padding", "24px");
    const headerBox = await header.boundingBox();
    const frameBox = await frame.boundingBox();
    expect(headerBox.y + headerBox.height).toBeLessThanOrEqual(frameBox.y);
    expect(await frame.evaluate((element) => element.contains(document.querySelector('[data-contract="timeline-reader-header"]')))).toBe(false);
    expect(await page.evaluate(() => document.documentElement.scrollHeight - innerHeight)).toBeLessThanOrEqual(1);
    const lastTrigger = page.locator('[data-contract="milestone-trigger"]').last();
    await lastTrigger.focus();
    await page.keyboard.press("Tab");
    await expect(body).toBeFocused();
    await expect(frame).toHaveCSS("box-shadow", "rgb(201, 190, 166) 0px 0px 0px 1px inset");
    await expect(frame).toHaveCSS("outline-style", "none");
    await expect(frame).toHaveCSS("outline-offset", "0px");
    await page.keyboard.press("Control+End");
    await expect.poll(() => body.evaluate((element) => element.scrollHeight - element.clientHeight - element.scrollTop)).toBeLessThanOrEqual(1);
    await expect(body.getByText("Astro", { exact: true })).toBeInViewport();
    expect(await header.boundingBox()).toEqual(headerBox);
    await page.screenshot({ path: test.info().outputPath("desktop-reader.png"), fullPage: true });
  });
}

test("el lector mantiene fija su cabecera mientras desplaza el contenido largo", async ({
  page,
}) => {
  await page.goto("./");

  await page
    .locator('[data-contract="milestone-trigger"]')
    .filter({ hasText: "Hito con contenido largo" })
    .click();

  const reader = page.locator('[data-contract="timeline-reader"]');
  const header = reader.locator('[data-contract="timeline-reader-header"]');
  const body = reader.locator('[data-contract="timeline-reader-body"]');
  const initialHeaderBox = await header.boundingBox();

  await expect(reader).toContainText("Hito con contenido largo");
  await expect(body).toHaveCSS("overflow-y", "auto");
  expect(await body.evaluate((element) => element.scrollHeight)).toBeGreaterThan(
    await body.evaluate((element) => element.clientHeight),
  );

  await body.evaluate((element) => element.scrollTo({ top: element.scrollHeight }));
  await expect.poll(() => body.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);

  expect(await header.boundingBox()).toEqual(initialHeaderBox);

  const detail = await body.locator('[data-contract="milestone-detail"]').elementHandle();
  const scrollTop = await body.evaluate((element) => element.scrollTop);
  const workFilter = page.getByRole("radio", { name: "Experiencia profesional" });
  await workFilter.click();
  await expect(workFilter).toBeFocused();
  expect(await detail.evaluate((element) => element.isConnected)).toBe(true);
  expect(await body.evaluate((element) => element.scrollTop)).toBe(scrollTop);
  await page.getByRole("radio", { name: "Todo", exact: true }).click();
  expect(await body.evaluate((element) => element.scrollTop)).toBe(scrollTop);
  const other = page.locator('[data-contract="milestone-trigger"]').last();
  await other.click();
  await expect(other).toBeFocused();
  await expect(reader).toContainText("Otra lectura extensa");
  await expect(body).toHaveAccessibleName(/Lectura del hito:.*Otra lectura extensa/);
  await expect(body.locator("..").locator('[aria-hidden="true"]')).toBeVisible();
  expect(await body.evaluate((element) => element.scrollHeight)).toBeGreaterThan(
    await body.evaluate((element) => element.clientHeight),
  );
  await expect.poll(() => body.evaluate((element) => element.scrollTop)).toBe(0);
});
