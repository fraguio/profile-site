import { expect, test } from "@playwright/test";
import { openMilestone } from "./support/milestone.mjs";

for (const viewport of [
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 360, height: 800 },
  { width: 390, height: 844 },
]) {
  test.describe(`${viewport.width} × ${viewport.height}`, () => {
    test.use({ viewport, reducedMotion: "reduce" });

    test("los bloques curriculares conservan prosa independiente, contribuciones, contenidos y habilidades", async ({ page }) => {
      await page.goto("./");
      const detail = page.getByRole(viewport.width >= 1024 ? "complementary" : "region", { name: /^Detalle del hito:/ });
      const open = (title) => openMilestone(page, title, "Enter");
      await open("Arquitecta de software");
      await expect(detail.getByRole("heading", { name: "Descripción", exact: true })).toBeVisible();
      await expect(detail.locator("p").filter({ hasText: "Empresa dedicada a sistemas de aprendizaje." })).toHaveText("Empresa dedicada a sistemas de aprendizaje.");
      await expect(detail.locator("p").filter({ hasText: "Dirige la evolución de productos con equipos multidisciplinares." })).toHaveText("Dirige la evolución de productos con equipos multidisciplinares.");
      await expect(detail.getByRole("heading", { name: "Contribuciones", exact: true })).toBeVisible();
      await expect(detail.getByText("Redujo el tiempo de entrega.", { exact: true })).toHaveCount(1);
      await expect(detail.getByText("Astro", { exact: true })).toHaveCount(1);
      await expect(detail.getByText("Madrid", { exact: true })).toBeVisible();
      await open("Proyecto Vigente");
      await expect(detail.getByText("Rol: Responsable técnica", { exact: true })).toBeVisible();
      await expect(detail.getByText("Explora una herramienta para equipos distribuidos.", { exact: true })).toBeVisible();
      await expect(detail.getByRole("heading", { name: "Contribuciones", exact: true })).toBeVisible();
      await expect(detail.getByText("Node.js", { exact: true })).toHaveCount(1);
      await open("Grado en Ingeniería de software");
      await expect(detail.getByRole("heading", { name: "Contenidos", exact: true })).toBeVisible();
      await expect(detail.getByText("Arquitectura de sistemas", { exact: true })).toBeVisible();
      await expect(detail.getByRole("heading", { name: "Habilidades asociadas", exact: true })).toBeVisible();
      await expect(detail.getByText("Diseño de sistemas", { exact: true })).toBeVisible();
      await expect(detail.getByRole("heading", { name: "Descripción", exact: true })).toHaveCount(0);
      await expect(detail.locator("a, [href]")).toHaveCount(0);
      await expect(detail.locator(".milestone__role")).toHaveCount(0);
      await expect(detail.getByText("Madrid", { exact: true })).toHaveCount(0);
      await expect(detail.getByText("Explora una herramienta para equipos distribuidos.", { exact: true })).toHaveCount(0);
      await expect(detail).toBeVisible();
      await expect(page.locator('[data-contract="milestone-trigger"][aria-pressed="true"]')).toHaveCount(1);
    });

    test("Ver proyecto conserva el destino curricular y se abre mediante teclado", async ({ page }) => {
      await page.goto("./");
      const trigger = page.getByRole("button").filter({ hasText: "Proyecto Vigente" });
      await trigger.focus();
      await page.keyboard.press("Enter");
      const detail = page.getByRole(viewport.width >= 1024 ? "complementary" : "region", { name: /^Detalle del hito:/ });
      const link = detail.getByRole("link", { name: "Ver proyecto", exact: true });
      await expect(link).toHaveAttribute("href", "https://projects.example.test/distributed?view=public#overview");
      for (let index = 0; index < 12 && !await link.evaluate((element) => element === document.activeElement); index++) {
        await page.keyboard.press("Tab");
      }
      await expect(link).toBeFocused();
      await expect(link).toHaveCSS("box-shadow", "rgb(201, 190, 166) 0px 0px 0px 1px inset");
      await page.route("https://projects.example.test/**", (route) => route.fulfill({ contentType: "text/html", body: "<h1>Proyecto ficticio</h1>" }));
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL("https://projects.example.test/distributed?view=public#overview");
      await expect(page.getByRole("heading", { name: "Proyecto ficticio" })).toBeVisible();
    });
  });
}

for (const width of [1440, 390]) {
  test(`Ver proyecto permanece operativo sin JavaScript a ${width} px`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width, height: 900 } });
    try {
      const page = await context.newPage();
      await page.goto(test.info().project.use.baseURL);
      const project = page.getByRole("article").filter({ hasText: "Proyecto Vigente" });
      const link = project.getByRole("link", { name: "Ver proyecto" });
      await expect(link).toHaveAttribute("href", "https://projects.example.test/distributed?view=public#overview");
      await expect(page.getByRole("link", { name: "Ver proyecto" })).toHaveCount(1);
      await page.route("https://projects.example.test/**", (route) => route.fulfill({ contentType: "text/html", body: "<h1>Proyecto ficticio</h1>" }));
      await link.focus();
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL("https://projects.example.test/distributed?view=public#overview");
    } finally {
      await context.close();
    }
  });
}
