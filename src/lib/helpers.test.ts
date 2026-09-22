import { describe, expect, it } from "vitest";
import { ApiError } from "./errors";
import { paginatedHeaders } from "./pagination";
import { requireInserted } from "./result";
import { jsonOk } from "./http";
import { IRAN } from "../config/constants";
import { daysFromNowIso, nowIso, storeNowIso } from "./time";

describe("lib helpers", () => {
  it("covers result time pagination", () => {
    expect(requireInserted({ id: 1 }, "x").id).toBe(1);
    expect(() => requireInserted(undefined, "x")).toThrow(ApiError);
    expect(nowIso()).toContain("T");
    expect(storeNowIso()).toContain("T");
    expect(nowIso(IRAN.TIMEZONE)).toContain("T");
    expect(daysFromNowIso(1) > nowIso()).toBe(true);
    expect(jsonOk({ ok: true }).headers.get("X-Request-Id")).toBeTruthy();
    expect(jsonOk({ ok: true }).headers.get("Content-Security-Policy")).toContain("default-src 'none'");
    expect(jsonOk({ ok: true }).headers.get("Content-Security-Policy")).not.toContain("unsafe-inline");
    expect(paginatedHeaders(25, 2, 10).get("X-Total-Pages")).toBe("3");
  });
});
