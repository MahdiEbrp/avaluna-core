import { randomBytes } from "node:crypto";
import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PORT ?? 3000);
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${PORT}`;
const testSecret = (name: string) => process.env[name] ?? randomBytes(32).toString("base64url");

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    locale: "fa-IR",
    timezoneId: "Asia/Tehran",
    channel: "chrome",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], channel: "chrome", viewport: { width: 1280, height: 720 } } },
    {
      name: "mobile",
      use: {
        ...devices["Pixel 7"],
        channel: "chrome",
        defaultBrowserType: "chromium",
        viewport: { width: 390, height: 844 },
      },
    },
    {
      name: "tablet",
      use: { ...devices["Desktop Chrome"], channel: "chrome", viewport: { width: 768, height: 1024 } },
    },
  ],
  webServer: {
    command: `pnpm exec next start --hostname 127.0.0.1 --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      NODE_ENV: "production",
      PORT: String(PORT),
      AVALUNA_SESSION_SECRET: testSecret("AVALUNA_SESSION_SECRET"),
      AVALUNA_SETTINGS_SECRET: testSecret("AVALUNA_SETTINGS_SECRET"),
    },
  },
});
