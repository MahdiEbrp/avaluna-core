import { expect, test } from "@playwright/test";
import { useUniqueClientIp } from "./support";

test.beforeEach(async ({ page }, testInfo) => {
  useUniqueClientIp(page, testInfo);
});

test.describe("pdp", () => {
  test("name, price, crumbs, JSON-LD Product, one h1", async ({ page }) => {
    await page.goto("/products/classic-tee");
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.getByTestId("pdp.title")).toContainText(/Classic|تی‌شرت|تیشرت/);
    await expect(page.getByTestId("pdp.view")).toBeVisible();
    await expect(page.getByTestId("pdp.buy").getByTestId("product.price")).toBeVisible();
    await expect(page.getByTestId("pdp.crumbs")).toBeVisible();
    await expect(page.getByTestId("pdp.crumb.0")).toBeVisible();
    await expect(page.getByTestId("pdp.crumb.0")).toHaveAttribute("href", "/");
    await expect(page.getByTestId("pdp.crumb.1")).toHaveAttribute("href", "/products");
    await expect(page.getByTestId("pdp.crumb.1")).toContainText(/Products|محصولات/);

    const jsonLd = page.locator('script[type="application/ld+json"]');
    await expect(jsonLd).toHaveCount(1);
    const raw = (await jsonLd.textContent()) ?? "";
    expect(raw).toContain('"@type":"Product"');
    expect(raw).not.toContain("<");
  });

  test("missing slug renders not-found with noindex", async ({ page }) => {
    const response = await page.goto("/products/definitely-missing-slug-xyz");
    await expect(page.locator("h1.next-error-h1, h1:has-text('404')")).toBeVisible();
    await expect(page.locator('meta[name="robots"][content*="noindex"]').first()).toBeAttached();
    expect([200, 404]).toContain(response?.status() ?? 0);
  });

  test("add updates cart badge; tabs switch", async ({ page }) => {
    await page.goto("/products/classic-tee");
    await page.evaluate(() => {
      window.localStorage.clear();
    });
    await page.reload();
    await expect(page.getByTestId("pdp.add")).toBeEnabled();
    await page.getByTestId("pdp.add").click();
    await expect(page.getByTestId("header.cart.badge")).toContainText("1");

    await expect(page.getByTestId("pdp.panel.description")).toBeVisible();
    await page.getByTestId("pdp.tab.specs").click();
    await expect(page.getByTestId("pdp.panel.specs")).toBeVisible();
    await page.getByTestId("pdp.tab.reviews").click();
    await expect(page.getByTestId("pdp.reviews")).toBeVisible();
    await expect(page.getByTestId("pdp.review.form")).toBeVisible();
  });

  test("approved reviews listed for classic-tee; empty form validation", async ({ page }) => {
    await page.goto("/products/classic-tee?lang=fa");
    await page.getByTestId("pdp.tab.reviews").click();
    await expect(page.getByTestId("pdp.reviews.list")).toContainText(/سارا|جنس/);
    await page.getByTestId("pdp.review.submit").click();
    await expect(page.getByRole("textbox", { name: "نام" })).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByText("همه فیلدها الزامی است").first()).toBeVisible();
  });

  test("related products section when same category peers exist", async ({ page }) => {
    await page.goto("/products/classic-tee");
    const related = page.getByTestId("pdp.related");
    await expect(related).toBeVisible();
    await expect(related.locator("[data-testid^='product.card.']").first()).toBeVisible();
  });
});
