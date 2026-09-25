import { expect, test } from "@playwright/test";
import { useUniqueClientIp } from "./support";

test.beforeEach(async ({ page }, testInfo) => {
  useUniqueClientIp(page, testInfo);
});

test.describe("product card add to cart", () => {
  test("add from home updates cart badge", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      window.localStorage.clear();
    });
    await page.reload();
    await expect(page.getByTestId("home.featured")).toBeVisible();

    const add = page.getByTestId("home.featured.list").getByTestId("product.add").first();
    await expect(add).toBeVisible();
    await expect(add).toBeEnabled();
    await add.click();

    const badge = page.getByTestId("header.cart.badge");
    await expect(badge).toBeVisible();
    await expect(badge).toContainText("1");
    await expect(page.getByTestId("header.cart")).toHaveAttribute("aria-label", / 1 /);
  });

  test("rating stars expose aria-label when rated", async ({ page }) => {
    await page.goto("/");
    const rating = page.getByTestId("product.rating").first();
    await expect(rating).toBeVisible();
    const label = await rating.getAttribute("aria-label");
    expect(label).toMatch(/امتیاز|Rating/);
  });
});
