import { expect, test } from "@playwright/test";

test("sin experiencia se inicia en Todo y se omiten las categorías vacías", async ({ page }) => {
  await page.goto("./");

  await expect(page.getByRole("group", { name: "Filtrar trayectoria" }).getByRole("button")).toHaveCount(2);
  await expect(
    page.getByRole("button", { name: "Experiencia profesional", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Formación", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Proyectos", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Todo", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: /Grado en Ingeniería/ })).toHaveAttribute("aria-pressed", "true");
  const detail = page.locator('[data-contract="timeline-reader"]');
  await expect(detail).toContainText("Arquitectura de sistemas");
  await page.getByRole("button", { name: "Formación", exact: true }).click();
  await expect(detail).toContainText("Arquitectura de sistemas");
});
