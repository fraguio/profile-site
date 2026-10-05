import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 1440, height: 900 } });

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
  await page.getByRole("radio", { name: "Toda la trayectoria" }).click();
  expect(await body.evaluate((element) => element.scrollTop)).toBe(scrollTop);
  const other = page.locator('[data-contract="milestone-trigger"]').last();
  await other.click();
  await expect(other).toBeFocused();
  await expect(reader).toContainText("Otra lectura extensa");
  expect(await body.evaluate((element) => element.scrollHeight)).toBeGreaterThan(
    await body.evaluate((element) => element.clientHeight),
  );
  await expect.poll(() => body.evaluate((element) => element.scrollTop)).toBe(0);
});
