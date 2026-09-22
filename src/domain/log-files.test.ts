import { describe, expect, it } from "vitest";
import { LOG } from "../config/constants";
import { logCutoffIso, logPlaintext, sanitizeLogField } from "./log-files";

describe("app log domain", () => {
  it("cuts retention and sanitizes fields", () => {
    expect(sanitizeLogField("a\nb")).toBe("a b");
    expect(logPlaintext("2026-01-01T00:00:00.000Z", "error", "x\ny", "a\nb")).toBe(
      "2026-01-01T00:00:00.000Z error x y a b",
    );
    const cutoff = logCutoffIso(Date.parse("2026-02-01T00:00:00.000Z"), LOG.RETENTION_DAYS);
    expect(cutoff.startsWith("2026-01-18")).toBe(true);
  });
});
