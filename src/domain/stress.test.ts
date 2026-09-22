import { describe, expect, it } from "vitest";
import { isLocalStressBase, percentile } from "./stress";

describe("stress helpers", () => {
  it("percentiles and local-only base", () => {
    expect(percentile([10, 20, 30, 40], 50)).toBe(20);
    expect(isLocalStressBase("http://127.0.0.1:3000")).toBe(true);
    expect(isLocalStressBase("https://example.com")).toBe(false);
  });
});
