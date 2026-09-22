import { ApiError } from "./errors";

const BLOCKED_HOSTS = new Set([
  "169.254.169.254",
  "metadata.google.internal",
  "0.0.0.0",
  "localhost",
  "127.0.0.1",
  "::1",
  "[::1]",
]);

const CREDENTIAL_QUERY_KEYS = ["consumer_key", "consumer_secret", "key_id", "key_secret", "api_key"];

export function parseResourceId(raw: string | undefined, label = "id"): number {
  if (!raw) {
    throw new ApiError(400, "validation.invalid_id", `${label} is required.`);
  }
  const value = Number.parseInt(raw, 10);
  if (!Number.isInteger(value) || value < 1 || String(value) !== raw) {
    throw new ApiError(400, "validation.invalid_id", `${label} must be a positive integer.`);
  }
  return value;
}

export function parseJsonObject(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new ApiError(400, "validation.invalid_json", "Request body must be a JSON object.");
  }
  return value as Record<string, unknown>;
}

export function readString(obj: Record<string, unknown>, key: string): string | undefined {
  const value = obj[key];
  return typeof value === "string" ? value : undefined;
}

export function readNumber(obj: Record<string, unknown>, key: string): number | undefined {
  const value = obj[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export function parseJsonColumn<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function isBlockedHost(host: string): boolean {
  const normalized = host.toLowerCase().replace(/^\[|\]$/g, "");
  if (BLOCKED_HOSTS.has(host.toLowerCase()) || BLOCKED_HOSTS.has(normalized)) {
    return true;
  }
  if (normalized.endsWith(".internal") || normalized.endsWith(".localhost")) {
    return true;
  }
  if (
    /^(10\.|192\.168\.|127\.|169\.254\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(normalized) ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd")
  ) {
    return true;
  }
  return false;
}

export function assertSafeWebhookUrl(raw: string): void {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new ApiError(400, "webhooks.invalid_url", "delivery_url is not a valid URL.");
  }
  if (url.protocol !== "https:") {
    throw new ApiError(400, "webhooks.invalid_url", "delivery_url must be HTTPS.");
  }
  if (isBlockedHost(url.hostname)) {
    throw new ApiError(400, "webhooks.ssrf_blocked", "delivery_url host is not allowed.");
  }
}

export function assertNoCredentialQuery(url: URL): void {
  for (const key of CREDENTIAL_QUERY_KEYS) {
    if (url.searchParams.has(key)) {
      throw new ApiError(400, "auth.query_credentials_forbidden", "API credentials must not appear in the query string.");
    }
  }
}
