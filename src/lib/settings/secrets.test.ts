import { describe, expect, it } from "vitest";
import { isSealed, maskSecret, openSecret, sealSecret } from "./secrets";

describe("settings secrets", () => {
  it("seals opens and masks", () => {
    const sealed = sealSecret("merchant-secret");
    expect(isSealed(sealed)).toBe(true);
    expect(openSecret(sealed)).toBe("merchant-secret");
    expect(sealSecret(sealed)).toBe(sealed);
    expect(sealSecret("")).toBe("");
    expect(openSecret("plain")).toBe("plain");
    expect(openSecret("enc.v1.bad")).toBe("");
    expect(maskSecret("x")).toBe("********");
    expect(maskSecret("")).toBe("");
  });
});
