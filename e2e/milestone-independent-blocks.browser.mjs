import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { openMilestone } from "./support/milestone.mjs";

for (const width of [1440, 360, 390]) {
  test.describe(`${width} px`, () => {
    test.use({ viewport: { width, height: 900 }, reducedMotion: "reduce" });

    test("cliente y proyecto identifican la participación sin sustituir contratante ni rol", async ({ page }) => {
      await page.goto("./");
      const trigger = page.getByRole("button", { name: /Cliente Ficticio — Integración de canales y plataformas distribuidas/ });
      await expect(trigger).toHaveAttribute("aria-pressed", "true");
      await expect(trigger).toContainText("Contratante Ficticia");
      const detail = page.locator('[data-contract="timeline-reader"]');
      await expect(detail).toContainText("Rol: Participación sin prosa");
      await expect(detail.getByText("Contribución independiente de la descripción.", { exact: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await page.goto("read/");
      const work = page.getByRole("article").filter({ has: page.getByRole("heading", { name: "Cliente Ficticio — Integración de canales y plataformas distribuidas", exact: true }) });
      await expect(work).toContainText("Contratante Ficticia");
      await expect(work).toContainText("Rol: Participación sin prosa");
    });

    test("el detalle limpia los datos ausentes y permite leer bloques sin prosa", async ({ page }) => {
      await page.goto("./");
      const detail = page.getByRole(width >= 1024 ? "complementary" : "region", { name: /^Detalle del hito:/ });
      const open = (title) => openMilestone(page, title, "Space");
      await page.getByRole("button", { name: "Todo", exact: true }).click();
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
      await open("Cliente Ficticio — Integración de canales y plataformas distribuidas");
      await expect(detail.getByRole("heading", { name: "Contribuciones", exact: true })).toBeVisible();
      await expect(detail.getByText("Contribución independiente de la descripción.", { exact: true })).toBeVisible();
      await expect(detail.getByRole("heading", { name: "Descripción", exact: true })).toHaveCount(0);
      await expect(detail.getByText("TypeScript", { exact: true })).toBeVisible();
      await open("Formación avanzada en integración de sistemas distribuidos");
      await expect(detail.getByRole("heading", { name: "Contenidos", exact: true })).toBeVisible();
      await expect(detail.locator(".milestone__highlights li")).toHaveText(["Diseño de APIs y contratos de integración.", "Despliegue y observabilidad de servicios.", "Diseño de APIs y contratos de integración."]);
      await expect(detail).not.toContainText("Contenido independiente de la descripción.");
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
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await expect(detail).toBeVisible();
      await expect(page.locator('[data-contract="milestone-trigger"][aria-pressed="true"]')).toHaveCount(1);
      await page.goto("read/");
      const education = page.getByRole("article").filter({ has: page.getByRole("heading", { name: "Formación avanzada en integración de sistemas distribuidos", exact: true }) });
      await expect(education.getByRole("list").first().getByRole("listitem")).toHaveText(["Diseño de APIs y contratos de integración.", "Despliegue y observabilidad de servicios.", "Diseño de APIs y contratos de integración."]);
      await expect(education).not.toContainText("Contenido independiente de la descripción.");
    });
  });
}
