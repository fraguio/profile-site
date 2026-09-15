import { expect, test } from "@playwright/test";

test("los filtros omiten una categoria vacia", async ({ page }) => {
  await page.goto("./");

  await expect(page.getByRole("radio")).toHaveCount(3);
  await expect(
    page.getByRole("radio", { name: "Experiencia profesional" }),
  ).toBeVisible();
  await expect(page.getByRole("radio", { name: "Formación" })).toBeVisible();
  await expect(page.getByRole("radio", { name: "Proyectos" })).toHaveCount(0);
});
