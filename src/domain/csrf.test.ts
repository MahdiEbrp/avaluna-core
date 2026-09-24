import { describe, expect, it } from "vitest";
import { originAllowed } from "./csrf";

describe("originAllowed", () => {
  it("allows matching origin host with port", () => {
    expect(originAllowed("http://127.0.0.1:3000", "", "127.0.0.1:3000")).toBe(true);
  });

  it("denies mismatched origin when shop_origin empty", () => {
    expect(originAllowed("http://evil.test", "", "127.0.0.1:3000")).toBe(false);
  });

  it("allows shop_origin match when host differs", () => {
    expect(originAllowed("http://shop.example", "https://shop.example", "cdn.internal:8080")).toBe(
      true,
    );
  });

  it("allows missing origin", () => {
    expect(originAllowed(null, "", "127.0.0.1:3000")).toBe(true);
  });

  it("denies unparseable origin", () => {
    expect(originAllowed("not-a-url", "", "127.0.0.1:3000")).toBe(false);
  });
});
