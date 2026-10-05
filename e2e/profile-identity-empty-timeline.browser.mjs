import { expect, test } from "@playwright/test";

for (const javaScriptEnabled of [true, false]) {
  for (const viewport of [{ width: 1366, height: 768 }, { width: 360, height: 800 }]) {
    test(`identidad operativa sin hitos, JavaScript ${javaScriptEnabled}, ${viewport.width}px`, async ({ browser }) => {
      const context = await browser.newContext({ javaScriptEnabled, viewport });
      const page = await context.newPage();
      await page.goto("http://127.0.0.1:4321/profile-site/");
      await expect(page.getByRole("heading", { name: "Alicia Ejemplo" })).toBeInViewport({ ratio: 1 });
      await expect(page.getByRole("link", { name: "Leer CV web" })).toBeInViewport({ ratio: 1 });
      await expect(page.getByRole("link", { name: "Contactar" })).toHaveAttribute("href", "mailto:alicia.ejemplo@example.test");
      const pdf = page.getByRole("link", { name: "Descargar CV PDF" });
      await expect(pdf).toBeInViewport({ ratio: 1 });
      const response = await page.request.get(await pdf.getAttribute("href"));
      expect(response.ok()).toBe(true);
      expect((await response.body()).subarray(0, 5).toString()).toBe("%PDF-");
      await expect(page.getByRole("region", { name: "Trayectoria" })).toHaveCount(0);
      await expect(page.getByRole("link", { name: "Explorar trayectoria" })).toHaveCount(0);
      await expect(page.getByRole("radio")).toHaveCount(0);
      await expect(page.getByRole("button")).toHaveCount(0);
      await expect(page.getByRole("navigation", { name: "Enlaces profesionales" })).toHaveCount(0);
      await page.getByRole("link", { name: "Leer CV web" }).click();
      await expect(page).toHaveURL(/\/profile-site\/read\/$/);
      await context.close();
    });
  }
}
