import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@libsql/client";

const dbUrl = process.env.DATABASE_URL ?? "file:data/avaluna.sqlite";

async function resetSetupFlag() {
  const client = createClient({ url: dbUrl });
  await client.execute({
    sql: `UPDATE settings SET value = 'no' WHERE "group" = 'setup' AND id = 'completed'`,
    args: [],
  });
  await client.execute({
    sql: `DELETE FROM users WHERE email LIKE 'wizard-e2e-%'`,
    args: [],
  });
  client.close();
}

async function fillOperator(page: Page, email: string) {
  await page.getByTestId("setup.operator.name").fill("E2E Operator");
  await page.getByTestId("setup.operator.email").fill(email);
  await page.getByTestId("setup.operator.password").fill("ChangeMeNow!");
}

async function walkToReview(page: Page, email: string) {
  await page.getByTestId("setup.next").click();
  await page.getByTestId("setup.store.name").fill("E2E Shop");
  await page.getByTestId("setup.store.nameFa").fill("فروشگاه تست");
  await page.getByTestId("setup.store.city").fill("Tehran");
  await page.getByTestId("setup.next").click();
  await fillOperator(page, email);
  await page.getByTestId("setup.next").click();
  await page.getByTestId("setup.next").click();
  await expect(page.getByTestId("setup.review.summary")).toBeVisible();
}

test.describe("setup wizard", () => {
  test.beforeEach(async () => {
    await resetSetupFlag();
  });

  test("5 steps → keys → land / → second visit redirects", async ({ page }) => {
    const email = `wizard-e2e-${Date.now()}@avaluna.test`;
    await page.goto("/setup");
    await expect(page.getByTestId("setup.wizard")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByTestId("setup.progress")).toContainText("%");

    await walkToReview(page, email);
    await page.getByTestId("setup.submit").click();
    await expect(page.getByTestId("setup.success")).toBeVisible();
    await expect(page.getByTestId("setup.key.id")).toContainText("ak_");
    await expect(page.getByTestId("setup.key.secret")).toContainText("as_");

    await page.getByTestId("setup.cta").click();
    await expect(page).toHaveURL(/\/$/);

    await page.goto("/setup");
    await expect(page).toHaveURL(/\/$/);
  });

  test("validation blocks step advance", async ({ page }) => {
    await page.goto("/setup");
    await page.getByTestId("setup.next").click();
    await page.getByTestId("setup.store.name").fill("");
    await page.getByTestId("setup.store.nameFa").fill("");
    await page.getByTestId("setup.store.city").fill("");
    await page.getByTestId("setup.next").click();
    await expect(page.getByTestId("setup.store.name")).toBeVisible();
    await expect(page.getByTestId("setup.store.name")).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByTestId("setup.blocked")).toBeVisible();
  });

  test("keyboard next and back", async ({ page }) => {
    await page.goto("/setup");
    const next = page.getByTestId("setup.next");
    await next.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("setup.store.name")).toBeVisible();
    const back = page.getByTestId("setup.back");
    await back.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("setup.progress")).toBeVisible();
    await expect(page.getByTestId("setup.store.name")).toHaveCount(0);
  });
});
