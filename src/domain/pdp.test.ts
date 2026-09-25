import { describe, expect, it } from "vitest";
import { isPublicProduct, matchesProductSlug, pdpImagePath, relatedProductLimit } from "./pdp";

describe("pdp domain", () => {
  it("matches en or fa slug and rejects empty path", () => {
    const row = { slug: "classic-tee", slug_fa: "تیشرت-کلاسیک" };
    expect(matchesProductSlug(row, "classic-tee")).toBe(true);
    expect(matchesProductSlug(row, "تیشرت-کلاسیک")).toBe(true);
    expect(matchesProductSlug(row, "missing")).toBe(false);
    expect(matchesProductSlug(row, "")).toBe(false);
    expect(matchesProductSlug({ slug: "a", slug_fa: "" }, "")).toBe(false);
  });

  it("only published and non-hidden products are public", () => {
    expect(isPublicProduct("published", "visible")).toBe(true);
    expect(isPublicProduct("published", "search")).toBe(true);
    expect(isPublicProduct("draft", "visible")).toBe(false);
    expect(isPublicProduct("published", "hidden")).toBe(false);
  });

  it("keeps absolute image paths intact", () => {
    expect(pdpImagePath("/img/products/x.svg")).toBe("/img/products/x.svg");
    expect(pdpImagePath("img/products/x.svg")).toBe("/img/products/x.svg");
    expect(pdpImagePath("https://cdn.example/x.png")).toBe("https://cdn.example/x.png");
    expect(pdpImagePath("data:image/png;base64,AA")).toBe("data:image/png;base64,AA");
  });

  it("related limit comes from UI constants", () => {
    expect(relatedProductLimit()).toBeGreaterThan(0);
  });
});
