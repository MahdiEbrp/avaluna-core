import { describe, expect, it } from "vitest";
import { ApiError } from "./errors";
import {
  assertNoCredentialQuery,
  assertSafeWebhookUrl,
  isBlockedHost,
  parseJsonColumn,
  parseJsonObject,
  parseResourceId,
  readNumber,
  readString,
} from "./safety";

describe("safety", () => {
  it("rejects non-integer ids", () => {
    expect(() => parseResourceId("12")).not.toThrow();
    expect(() => parseResourceId("12.2")).toThrow(ApiError);
    expect(() => parseResourceId("0")).toThrow(ApiError);
    expect(() => parseResourceId(undefined)).toThrow(ApiError);
  });

  it("blocks metadata and private webhook hosts", () => {
    expect(() => assertSafeWebhookUrl("https://example.com/hook")).not.toThrow();
    expect(() => assertSafeWebhookUrl("http://example.com/hook")).toThrow(ApiError);
    expect(() => assertSafeWebhookUrl("https://169.254.169.254/latest")).toThrow(ApiError);
    expect(() => assertSafeWebhookUrl("http://10.0.0.5/x")).toThrow(ApiError);
    expect(() => assertSafeWebhookUrl("http://localhost/hook")).toThrow(ApiError);
    expect(() => assertSafeWebhookUrl("http://127.0.0.1/hook")).toThrow(ApiError);
    expect(() => assertSafeWebhookUrl("ftp://example.com/x")).toThrow(ApiError);
    expect(isBlockedHost("shop.localhost")).toBe(true);
    expect(isBlockedHost("fd12::1")).toBe(true);
    expect(isBlockedHost("example.com")).toBe(false);
    expect(() => parseJsonObject(null)).toThrow(ApiError);
    expect(isBlockedHost("172.16.0.1")).toBe(true);
    expect(isBlockedHost("fc00::1")).toBe(true);
  });

  it("rejects credential query parameters", () => {
    expect(() => assertNoCredentialQuery(new URL("http://x/api?q=1"))).not.toThrow();
    expect(() => assertNoCredentialQuery(new URL("http://x/api?consumer_key=ak"))).toThrow(ApiError);
  });

  it("parses json columns safely", () => {
    expect(parseJsonColumn("{\"a\":1}", {})).toEqual({ a: 1 });
    expect(parseJsonColumn("nope", { ok: true })).toEqual({ ok: true });
    expect(() => parseJsonObject([])).toThrow(ApiError);
    expect(parseJsonObject({ a: 1 }).a).toBe(1);
  });

  it("reads typed fields", () => {
    expect(readString({ a: "x" }, "a")).toBe("x");
    expect(readString({ a: 1 }, "a")).toBeUndefined();
    expect(readNumber({ n: 3 }, "n")).toBe(3);
    expect(readNumber({ n: "3" }, "n")).toBeUndefined();
  });
});
