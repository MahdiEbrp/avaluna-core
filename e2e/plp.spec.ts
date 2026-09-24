import { expect, test } from "@playwright/test";

test.describe("plp / search", () => {
  test("products page: h1, cards, crawlable sort + pagination", async ({ page }) => {
    await page.goto("/products");
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.getByTestId("plp.title")).toBeVisible();
    await expect(page.getByTestId("plp.count")).toContainText(/\d+/);
    await expect(page.getByTestId("plp.grid").locator("[data-testid^='product.card.']").first()).toBeVisible();

    await page.getByTestId("plp.sort.price_asc").click();
    await expect(page).toHaveURL(/sort=price/);
    await expect(page).toHaveURL(/order=asc/);

    const next = page.getByTestId("plp.pagination.next");
    if (await next.count()) {
      await expect(next).toHaveAttribute("href", /page=2/);
      await next.click();
      await expect(page).toHaveURL(/page=2/);
      await expect(page.getByTestId("plp.pagination.page.2")).toHaveAttribute("aria-current", "page");
    }
  });

  test("on_sale filter updates URL and shows sale badges", async ({ page }) => {
    await page.goto("/products");
    const link = page.getByTestId("plp.filter.on_sale");
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", "/products?on_sale=true");
    await Promise.all([page.waitForURL(/on_sale=true/), link.click()]);
    const firstCard = page.getByTestId("plp.grid").locator("[data-testid^='product.card.']").first();
    await expect(firstCard).toBeVisible();
    await expect(firstCard.getByTestId("product.badge.sale")).toBeVisible();
  });

  test("category page lists products for fashion", async ({ page }) => {
    await page.goto("/categories/fashion");
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.getByTestId("plp.title")).toContainText(/مد|Fashion|پوشاک/);
    await expect(page.getByTestId("plp.grid").locator("[data-testid^='product.card.']").first()).toBeVisible();
  });

  test("empty search shows clear-filters empty state", async ({ page }) => {
    await page.goto("/search?q=zzzznotarealproductzzz");
    await expect(page.getByTestId("plp.empty")).toBeVisible();
    await expect(page.getByTestId("plp.empty.clear")).toBeVisible();
    await expect(page).toHaveTitle(/Search|جستجو|نتایج/);
  });

  test("filters: drawer on small viewports, sticky sidebar on desktop", async ({ page }, testInfo) => {
    await page.goto("/products");
    if (testInfo.project.name === "desktop") {
      await expect(page.getByTestId("plp.filters")).toBeVisible();
      await expect(page.getByTestId("plp.filters.open")).toBeHidden();
    } else {
      await expect(page.getByTestId("plp.filters.open")).toBeVisible();
      await expect(page.getByTestId("plp.filters")).toBeHidden();
      await page.getByTestId("plp.filters.open").click();
      await expect(page.getByTestId("plp.filters.drawer").getByTestId("plp.filters.form")).toBeVisible();
      await expect(page.getByTestId("plp.filters.drawer").getByTestId("plp.price.min")).toBeVisible();
    }
  });

  test("search results are localized and noindex", async ({ page }) => {
    await page.goto("/search?q=hat&lang=en");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.getByTestId("plp.title")).toContainText("hat");
    await page.goto("/products?lang=fa");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByTestId("plp.title")).toHaveText("همه محصولات");
  });
});
