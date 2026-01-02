import { test as setup, expect } from "@playwright/test";
import { authFileFromUrl } from "./helpers";

setup("authenticate", async ({ page, baseURL }) => {
  await page.goto("/");
  await page.locator("#user").fill("admin");
  await page.locator("#password").fill("admin");
  await page.locator("button[type=submit]").click();
  // Wait until the page receives the cookies.
  await page.waitForURL("/index.php/apps/dashboard/");
  await page.context().storageState({ path: authFileFromUrl(baseURL!) });
});
