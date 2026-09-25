import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { useUniqueClientIp } from "./support";

async function resetCart(page: Page) {
  await page.goto("/");
  await page.evaluate(() => {
    window.localStorage.clear();
  });
  await page.reload();
  await expect(page.getByTestId("home.featured")).toBeVisible();
}

async function addFirstFeatured(page: Page) {
  const add = page.getByTestId("home.featured.list").getByTestId("product.add").first();
  await expect(add).toBeVisible();
  await expect(add).toBeEnabled();
  await add.click();
  await expect(page.getByTestId("header.cart.badge")).toContainText("1");
}

function lineTestId(page: Page, testInfo: TestInfo, testId: string) {
  const container = testInfo.project.name === "desktop" ? "cart.lines.table" : "cart.lines.cards";
  return page.getByTestId(container).getByTestId(testId).first();
}

test.beforeEach(async ({ page }, testInfo) => {
  useUniqueClientIp(page, testInfo);
});

test.describe("cart", () => {
  test("empty cart: noindex, title, continue shopping", async ({ page }) => {
    await resetCart(page);
    await page.goto("/cart");
    await expect(page).toHaveTitle(/سبد خرید|Shopping cart/);
    await expect(page.locator('meta[name="robots"][content*="noindex"]').first()).toBeAttached();
    await expect(page.getByTestId("cart.title")).toBeVisible();
    await expect(page.getByTestId("cart.empty")).toBeVisible();
    await expect(page.getByTestId("cart.empty.continue")).toBeVisible();
  });

  test("add from home shows line; qty updates; remove empties", async ({ page }, testInfo) => {
    await resetCart(page);
    await addFirstFeatured(page);
    await page.goto("/cart");
    await expect(page.getByTestId("cart.view")).toBeVisible();
    await expect(page.getByTestId("cart.empty")).toHaveCount(0);

    const qty = lineTestId(page, testInfo, "cart.line.qty");
    await expect(qty).toBeVisible();
    await expect(qty).toHaveValue("1");

    const grand = page.getByTestId("cart.totals.grand");
    const before = (await grand.textContent()) ?? "";

    await qty.fill("2");
    await expect(qty).toHaveValue("2");
    await expect(page.getByTestId("header.cart.badge")).toContainText("2");
    await expect(page.getByTestId("header.cart")).toHaveAttribute("aria-label", / 2 /);
    const after = (await grand.textContent()) ?? "";
    expect(after).not.toBe(before);

    await lineTestId(page, testInfo, "cart.line.remove").click();
    await expect(page.getByTestId("cart.empty")).toBeVisible();
    await expect(page.getByTestId("header.cart.badge")).toHaveCount(0);
    await expect(page.getByTestId("header.cart")).toHaveAttribute("aria-label", / 0 /);
  });

  test("totals from API; coupon apply + invalid code", async ({ page }) => {
    await resetCart(page);
    await addFirstFeatured(page);
    await page.goto("/cart");
    await expect(page.getByTestId("cart.summary")).toBeVisible();
    await expect(page.getByTestId("cart.totals")).toBeVisible();
    await expect(page.getByTestId("cart.totals.grand")).toBeVisible();

    await page.getByTestId("cart.coupon.input").fill("not-a-real-coupon");
    await page.getByTestId("cart.coupon.apply").click();
    await expect(page.getByTestId("cart.coupon.message")).toBeVisible();

    await page.getByTestId("cart.coupon.input").fill("welcome10");
    await page.getByTestId("cart.coupon.apply").click();
    await expect(page.getByTestId("cart.coupon.applied")).toContainText("welcome10");

    await page.getByTestId("cart.coupon.remove").click();
    await expect(page.getByTestId("cart.coupon.applied")).toHaveCount(0);
  });

  test("mobile stacks cards; desktop shows table", async ({ page }, testInfo) => {
    await resetCart(page);
    await addFirstFeatured(page);
    await page.goto("/cart");
    await expect(page.getByTestId("cart.view")).toBeVisible();

    if (testInfo.project.name === "desktop") {
      await expect(page.getByTestId("cart.lines.table")).toBeVisible();
      await expect(page.getByTestId("cart.lines.cards")).toBeHidden();
    } else {
      await expect(page.getByTestId("cart.lines.cards")).toBeVisible();
      await expect(page.getByTestId("cart.lines.table")).toBeHidden();
    }
    await expect(page.getByTestId("cart.checkout")).toBeVisible();
  });

  test("failed load shows honest error + retry, never a fake empty cart", async ({ page }) => {
    await resetCart(page);
    const cartUrl = "**/api/storefront/v1/cart";
    await page.route(cartUrl, async (route) => {
      await route.fulfill({
        status: 429,
        contentType: "application/json",
        body: JSON.stringify({ error: { code: "rate_limited", message: "Too many requests." } }),
      });
    });

    await page.goto("/cart");
    await expect(page.getByTestId("cart.load.error")).toBeVisible();
    await expect(page.getByTestId("cart.empty")).toHaveCount(0);

    await page.unroute(cartUrl);
    await page.getByTestId("cart.load.retry").click();
    await expect(page.getByTestId("cart.empty")).toBeVisible();
    await expect(page.getByTestId("cart.load.error")).toHaveCount(0);
  });
});

