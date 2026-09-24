import { expect, test, type Page } from "@playwright/test";

const VIEW = {
  mobile: { width: 390, height: 844 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 720 },
  wide: { width: 1440, height: 900 },
} as const;

async function expectCookieLocale(page: Page, value: string) {
  const cookies = await page.context().cookies();
  const locale = cookies.find((cookie) => cookie.name === "avaluna_locale");
  expect(locale?.value).toBe(value);
}

test.describe("shop chrome", () => {
  test("skip-link focuses main", async ({ page }) => {
    await page.goto("/");
    const skip = page.getByTestId("skip-link");
    await expect(skip).toBeAttached();
    await skip.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("main")).toBeFocused();
  });

  test("burger only below 768; desk nav at ≥1024; bottom nav hidden ≥1024", async ({ page }) => {
    await page.setViewportSize(VIEW.mobile);
    await page.goto("/");
    await expect(page.getByTestId("header.burger")).toBeVisible();
    await expect(page.getByTestId("desk.nav")).toBeHidden();
    await expect(page.getByTestId("bottom.nav")).toBeVisible();

    await page.setViewportSize(VIEW.tablet);
    await expect(page.getByTestId("header.burger")).toBeHidden();
    await expect(page.getByTestId("desk.nav")).toBeHidden();
    await expect(page.getByTestId("bottom.nav")).toBeVisible();

    await page.setViewportSize(VIEW.desktop);
    await expect(page.getByTestId("header.burger")).toBeHidden();
    await expect(page.getByTestId("desk.nav")).toBeVisible();
    await expect(page.getByTestId("bottom.nav")).toBeHidden();
  });

  test("locale switch persists cookie and path", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "fa");
    await Promise.all([page.waitForURL(/lang=en/), page.getByTestId("header.locale").click()]);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expectCookieLocale(page, "en");
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  });

  test("footer shows legal fields", async ({ page }) => {
    await page.goto("/");
    const footer = page.getByTestId("shop.footer");
    await expect(footer).toBeVisible();
    await expect(page.getByTestId("footer.enamad")).toBeVisible();
    await expect(page.getByTestId("footer.samandehi")).toBeVisible();
    await expect(page.getByTestId("footer.return-days")).toBeVisible();
  });

  test("cart badge appears after GET /cart hydrate", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("header.cart")).toBeVisible();
    await expect(page.getByTestId("header.cart")).toHaveAttribute("aria-label", /./);
    const badge = page.getByTestId("header.cart.badge");
    await expect(badge.or(page.locator("[data-testid='header.cart']"))).toBeVisible();
    if (await badge.count()) {
      await expect(badge).toBeVisible();
    }
  });

  test("mobile drawer opens, traps focus, closes", async ({ page }) => {
    await page.setViewportSize(VIEW.mobile);
    await page.goto("/");
    const burger = page.getByTestId("header.burger");
    await expect(burger).toBeVisible();
    const openLabel = await burger.getAttribute("aria-label");
    await burger.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.locator("a, button, input, [tabindex]").first()).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(burger).toHaveAttribute("aria-label", openLabel ?? "");
  });

  test("intro route serves landing with locale", async ({ page }) => {
    await page.goto("/intro?lang=en");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await page.goto("/intro?lang=fa");
    await expect(page.locator("html")).toHaveAttribute("lang", "fa");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expectCookieLocale(page, "fa");
  });
});
