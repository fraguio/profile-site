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
});
