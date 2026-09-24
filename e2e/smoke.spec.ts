import { expect, test } from "@playwright/test";

type StyleCspWindow = Window & { __styleCspViolations?: string[] };

test.describe("smoke", () => {
  test("home loads with fa rtl by default", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "fa");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page).toHaveTitle(/Avaluna|آوالونا/);
  });

  test("lang=en switches to ltr", async ({ page }) => {
    await page.goto("/?lang=en");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  });

  test("CSP allows Mantine style attrs; scripts stay nonce-locked", async ({ page }) => {
    await page.addInitScript(() => {
      window.addEventListener("securitypolicyviolation", (event) => {
        const violation = event as SecurityPolicyViolationEvent;
        if (!violation.violatedDirective.startsWith("style")) return;
        const target = window as StyleCspWindow;
        target.__styleCspViolations = [...(target.__styleCspViolations ?? []), violation.violatedDirective];
      });
    });
    const response = await page.goto("/");
    const csp = response?.headers()["content-security-policy"] ?? "";
    expect(csp).toContain("style-src-attr 'unsafe-inline'");
    expect(csp).toContain("script-src-attr 'none'");
    expect(csp).toContain("'strict-dynamic'");
    expect(csp).toMatch(/style-src 'self' 'nonce-[^']+'/);
    await expect(page.getByTestId("home.hero")).toBeVisible();
    const violations = await page.evaluate(() => (window as StyleCspWindow).__styleCspViolations ?? []);
    expect(violations).toEqual([]);
  });
});
