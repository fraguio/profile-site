import { expect, test } from "@playwright/test";

test("the web CV offers keyboard printing without application scripts", async ({ page }) => {
  await page.addInitScript(() => {
    window.print = () => {
      document.documentElement.dataset.printed = "true";
    };
  });
  await page.goto("read/");

  const printAction = page.getByRole("button", { name: "Imprimir CV web" });

  await expect(printAction).toBeVisible();
  await expect(page.locator("script[src]")).toHaveCount(0);
  await expect(page.locator("script")).toHaveCount(1);

  await printAction.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("html")).toHaveAttribute("data-printed", "true");

  await page.emulateMedia({ media: "print" });
  await expect(printAction).toBeHidden();
  await expect(page.getByRole("heading", { name: "Experiencia profesional" })).toBeVisible();
  await expect(page.getByText("Dirige la evolución de productos con equipos multidisciplinares.")).toBeVisible();
});

test("the web CV remains complete without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();

  await page.goto("http://127.0.0.1:4321/profile-site/read/");

  await expect(page.getByRole("button", { name: "Imprimir CV web" })).toBeHidden();
  await expect(page.getByRole("heading", { name: "Resumen profesional" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Experiencia profesional" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Proyectos" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Formación" })).toBeVisible();
  await expect(page.getByText("Responsable técnica")).toBeVisible();
  await expect(page.locator("[data-contract='read-download-pdf']")).toHaveCount(0);
  await expect(page.locator("a[href$='.pdf']")).toHaveCount(0);

  await context.close();
});
