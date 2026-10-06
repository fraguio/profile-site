import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { openMilestone } from "./support/milestone.mjs";

for (const width of [1440, 360, 390]) {
  test.describe(`${width} px`, () => {
    test.use({ viewport: { width, height: 900 }, reducedMotion: "reduce" });

    test("el detalle limpia los datos ausentes y permite leer bloques sin prosa", async ({ page }) => {
      await page.goto("./");
      const detail = page.getByRole(width >= 1024 ? "complementary" : "region", { name: /^Detalle del hito:/ });
      const open = (title) => openMilestone(page, title, "Space");
      await open("Proyecto con metadatos");
      const roles = detail.getByText("Roles: Autora, Desarrolladora de herramientas de integración y plataformas distribuidas para equipos multidisciplinares", { exact: true });
      await roles.scrollIntoViewIfNeeded();
      await expect(roles).toBeInViewport({ ratio: 0.99 });
      await expect(detail.getByText("Primera frase del proyecto. Segunda frase que debe conservarse íntegra hasta el final.", { exact: true })).toBeVisible();
      await expect(detail).toContainText("3 de febrero de 2025 - Actualidad");
      await expect(detail.locator("time")).toHaveCount(1);
      await expect(detail.getByRole("link", { name: "Ver proyecto" })).toHaveAttribute("href", "https://projects.example.test/independent?source=resume#details");
      const skill = detail.getByText("Capacidad asociada con una etiqueta deliberadamente larga para comprobar wrapping", { exact: true });
      await skill.scrollIntoViewIfNeeded();
      await expect(skill).toBeInViewport({ ratio: 0.99 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      expect((await new AxeBuilder({ page }).include('[data-contract="timeline-reader"]').withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
      await open("Proyecto sin bloques");
      await expect(detail).toContainText("2024 - diciembre de 2024");
      await expect(detail.locator("a, [href], ul, h4")).toHaveCount(0);
      for (const value of ["Autora", "Desarrolladora", "Laboratorio Ficticio", "Primera frase", "Entregó un ejemplo", "Capacidad asociada"]) {
        await expect(detail).not.toContainText(value);
      }
      await open("Participación sin prosa");
      await expect(detail.getByRole("heading", { name: "Contribuciones", exact: true })).toBeVisible();
      await expect(detail.getByText("Contribución independiente de la descripción.", { exact: true })).toBeVisible();
      await expect(detail.getByRole("heading", { name: "Descripción", exact: true })).toHaveCount(0);
      await expect(detail.getByText("TypeScript", { exact: true })).toBeVisible();
      await open("Formación sin prosa");
      await expect(detail.getByRole("heading", { name: "Contenidos", exact: true })).toBeVisible();
      await expect(detail.getByText("Contenido independiente de la descripción.", { exact: true })).toBeVisible();
      await expect(detail.getByRole("heading", { name: "Descripción", exact: true })).toHaveCount(0);
      await open("Formación solo con habilidades");
      await expect(detail.getByRole("heading", { name: "Habilidades asociadas", exact: true })).toBeVisible();
      await expect(detail.getByRole("heading", { name: "Contenidos", exact: true })).toHaveCount(0);
      await expect(detail.getByText("Lectura técnica", { exact: true })).toBeVisible();
      await open("Empresa sin posición declarada");
      await expect(detail).toContainText("2020 - 2020");
      await expect(detail.locator(".milestone__role")).toHaveCount(0);
      const location = detail.getByText("Centro de investigación de sistemas distribuidos, Santiago de Compostela, Galicia, España", { exact: true });
      await location.scrollIntoViewIfNeeded();
      await expect(location).toBeInViewport({ ratio: 0.99 });
      await expect(page.locator("body")).not.toContainText("aplazad");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await expect(detail).toBeVisible();
      await expect(page.locator('[data-contract="milestone-trigger"][aria-pressed="true"]')).toHaveCount(1);
    });
  });
}
