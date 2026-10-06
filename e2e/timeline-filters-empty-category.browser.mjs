import { expect, test } from "@playwright/test";

test("los filtros omiten una categoria vacia", async ({ page }) => {
  await page.goto("./");

  await expect(page.getByRole("group", { name: "Filtrar trayectoria" }).getByRole("button")).toHaveCount(3);
  await expect(
    page.getByRole("button", { name: "Experiencia profesional", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Formación", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Proyectos", exact: true })).toHaveCount(0);
});
