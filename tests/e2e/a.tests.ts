import { test, expect } from "@playwright/test";

test("if menu leads to search app", async ({ page, baseURL }) => {
  await page.goto("/");
  const button = page
    .getByRole("navigation")
    .getByRole("link", { name: "The Search Page" });
  await expect(button).toBeVisible();
  await button.click();
  await page.waitForURL(/\/apps\/thesearchpage/);

  await expect(
    page.getByRole("heading", { name: "Search Page" })
  ).toBeVisible();
  await expect(page.locator('input:below(:text("Search Page"))')).toBeVisible();
});

test("if search is performed", async ({ page }) => {
  await page.goto("/index.php/apps/thesearchpage");
  await page.locator('input:below(:text("Search Page"))').fill("person");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page.waitForURL(/terms=person/);

  const container = page.locator(".mwb-thesearchpage-results");

  await expect(container).toBeVisible();
  await expect(
    container.getByRole("link", { name: "Personal settings" })
  ).toBeVisible();
  await expect(
    container.getByRole("link", { name: "Personal info" })
  ).toBeVisible();
});
