import { expect, test } from "@playwright/test";
import { useUniqueClientIp } from "./support";

type StyleCspWindow = Window & {
  __styleCspViolations?: string[];
  __scriptCspViolations?: string[];
};

test.beforeEach(async ({ page }, testInfo) => {
  useUniqueClientIp(page, testInfo);
});

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

  test("CSP allows Mantine style attrs; scripts stay nonce-locked with no eval", async ({ page }) => {
    await page.addInitScript(() => {
      window.addEventListener("securitypolicyviolation", (event) => {
        const violation = event as SecurityPolicyViolationEvent;
        const target = window as StyleCspWindow;
        if (violation.violatedDirective.startsWith("style")) {
          target.__styleCspViolations = [...(target.__styleCspViolations ?? []), violation.violatedDirective];
          return;
        }
        if (violation.violatedDirective.startsWith("script") || violation.effectiveDirective.includes("eval")) {
          target.__scriptCspViolations = [
            ...(target.__scriptCspViolations ?? []),
            `${violation.effectiveDirective}:${violation.blockedURI}`,
          ];
        }
      });
    });
    const response = await page.goto("/");
    const csp = response?.headers()["content-security-policy"] ?? "";
    expect(csp).toContain("style-src-attr 'unsafe-inline'");
    expect(csp).toContain("script-src-attr 'none'");
    expect(csp).toContain("'strict-dynamic'");
    expect(csp).toMatch(/style-src 'self' 'nonce-[^']+'/);
    expect(csp).not.toContain("unsafe-eval");
    const scriptSrc = csp
      .split("; ")
      .find((part) => part.startsWith("script-src "))
      ?.split(" ");
    expect(scriptSrc).toBeDefined();
    expect(scriptSrc).not.toContain("'unsafe-eval'");
    expect(scriptSrc).not.toContain("'unsafe-inline'");
    await expect(page.getByTestId("home.hero")).toBeVisible();
    const styleViolations = await page.evaluate(() => (window as StyleCspWindow).__styleCspViolations ?? []);
    expect(styleViolations).toEqual([]);
    const scriptViolations = await page.evaluate(() => (window as StyleCspWindow).__scriptCspViolations ?? []);
    expect(scriptViolations).toEqual([]);
  });
});
