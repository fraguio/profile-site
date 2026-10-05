export async function openMilestone(page, title, key) {
  await page.getByRole("button").filter({ hasText: title }).focus();
  await page.keyboard.press(key);
}
