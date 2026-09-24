import { expect, test } from "@playwright/test";

test.describe("home catalog", () => {
  test("one h1; product cards; category href; deals rail; JSON-LD; metadata title", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.getByTestId("home.hero")).toBeVisible();
    await expect(page.getByTestId("home.hero.cta")).toHaveAttribute("href", "/products");

    await expect(page.getByTestId("home.categories")).toBeVisible();
    const fashion = page.getByTestId("home.cat.fashion");
    await expect(fashion).toBeVisible();
    await expect(fashion).toHaveAttribute("href", "/categories/fashion");

    await expect(page.getByTestId("home.deals")).toBeVisible();
    const firstCard = page.getByTestId("home.deals.list").locator("[data-testid^='product.card.']").first();
    await expect(firstCard).toBeVisible();
    await expect(firstCard.getByTestId("product.price")).toBeVisible();

    await expect(page.getByTestId("home.featured")).toBeVisible();
    await expect(page.getByTestId("home.featured.list").locator("[data-testid^='product.card.']").first()).toBeVisible();

    const jsonLd = page.locator('script[type="application/ld+json"]');
    await expect(jsonLd).toHaveCount(2);
    const storeRaw = (await jsonLd.nth(0).textContent()) ?? "";
    const listRaw = (await jsonLd.nth(1).textContent()) ?? "";
    expect(storeRaw).toContain('"@type":"Store"');
    expect(listRaw).toContain('"@type":"ItemList"');
    expect(storeRaw + listRaw).not.toContain("<");

    await expect(page).toHaveTitle(/Avaluna|آوالونا|فروشگاه/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /./);
  });

  test("hero lede and section titles are localized", async ({ page }) => {
    await page.goto("/?lang=en");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByTestId("home.hero")).toContainText("Avaluna store");
    await expect(page.getByTestId("home.deals")).toContainText("deals");
    await page.goto("/?lang=fa");
    await expect(page.locator("html")).toHaveAttribute("lang", "fa");
    await expect(page.getByTestId("home.deals")).toContainText("تخفیف");
  });
});
