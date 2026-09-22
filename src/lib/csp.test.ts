import { describe, expect, it } from "vitest";
import { apiContentSecurityPolicy, createCspNonce, documentContentSecurityPolicy } from "./csp";

describe("csp", () => {
  it("document policy uses nonce and never unsafe-inline for scripts", () => {
    const nonce = "dGVzdA==";
    const policy = documentContentSecurityPolicy(nonce);
    expect(policy).toContain(`'nonce-${nonce}'`);
    expect(policy).toContain("'strict-dynamic'");
    expect(policy).not.toContain("unsafe-inline");
    expect(policy).not.toContain("unsafe-eval");
    expect(policy).toContain("style-src-attr 'none'");
    expect(policy).toContain("script-src-attr 'none'");
    expect(policy).toContain("img-src 'self'");
    expect(policy).not.toContain("data:");
    expect(policy).toContain("upgrade-insecure-requests");
    expect(policy).toContain("frame-ancestors 'none'");
  });

  it("api policy has no unsafe-inline", () => {
    const policy = apiContentSecurityPolicy();
    expect(policy).not.toContain("unsafe-inline");
    expect(policy).toContain("default-src 'none'");
  });

  it("nonce is unguessable base64", () => {
    const a = createCspNonce();
    const b = createCspNonce();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThan(8);
  });
});
