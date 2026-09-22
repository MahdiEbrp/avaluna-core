import { describe, expect, it } from "vitest";
import { appendAppLog, cleanupAppLogs } from "./app-log";
import { migrate } from "./db/migrate";
import { isSealed } from "./settings/secrets";

describe("sqlite app log", () => {
  it("stores sealed rows and drops expired ones", async () => {
    await migrate();
    await appendAppLog("error", "itest.boom", "failed", "2026-09-22T00:00:00.000Z");
    await appendAppLog("warning", "itest.warn", "slow", "2020-01-01T00:00:00.000Z");
    const { connector } = await import("./db/client");
    const rows = await connector.execute("SELECT level, code, sealed FROM app_logs WHERE code LIKE 'itest.%'");
    expect(rows.rows.length).toBeGreaterThan(0);
    for (const row of rows.rows) {
      expect(isSealed(String((row as { sealed: string }).sealed))).toBe(true);
      expect(String((row as { sealed: string }).sealed)).not.toContain("failed");
    }
    const cleaned = await cleanupAppLogs(Date.parse("2026-09-22T00:00:00.000Z"));
    expect(cleaned.deleted).toBeGreaterThan(0);
    const left = await connector.execute("SELECT code FROM app_logs WHERE code = 'itest.warn'");
    expect(left.rows.length).toBe(0);
  });
});
