export async function openMilestone(page, detail, title, key) {
  if (page.viewportSize().width < 1024 && await detail.isVisible()) {
    await detail.getByRole("button", { name: "Cerrar detalle", exact: true }).click();
  }
  await page.getByRole("button").filter({ hasText: title }).focus();
  await page.keyboard.press(key);
}
