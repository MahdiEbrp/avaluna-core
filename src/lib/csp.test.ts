import { describe, expect, it } from "vitest";
import { apiContentSecurityPolicy, createCspNonce, documentContentSecurityPolicy } from "./csp";

describe("csp", () => {
  it("document policy uses nonce and never unsafe-inline for scripts", () => {
    const nonce = "dGVzdA==";
    const policy = documentContentSecurityPolicy(nonce);
    const scriptSrc = policy.split("; ").find((part) => part.startsWith("script-src "));
    const styleSrc = policy.split("; ").find((part) => part.startsWith("style-src "));
    const styleSrcAttr = policy.split("; ").find((part) => part.startsWith("style-src-attr "));
    expect(scriptSrc).toContain(`'nonce-${nonce}'`);
    expect(scriptSrc).toContain("'strict-dynamic'");
    expect(scriptSrc).not.toContain("unsafe-inline");
    expect(policy).not.toContain("unsafe-eval");
    expect(styleSrc).toContain(`'nonce-${nonce}'`);
    expect(styleSrc).not.toContain("unsafe-inline");
    expect(styleSrcAttr).toBe("style-src-attr 'unsafe-inline'");
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
