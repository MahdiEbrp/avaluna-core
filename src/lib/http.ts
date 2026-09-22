import { randomUUID } from "node:crypto";
import { SECURITY } from "../config/constants";
import { apiContentSecurityPolicy } from "./csp";
import { ApiError } from "./errors";
import { paginatedHeaders } from "./pagination";

function secureHeaders(): Headers {
  return new Headers({
    "Content-Type": "application/json",
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "no-store",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Content-Security-Policy": apiContentSecurityPolicy(),
    "X-Request-Id": randomUUID(),
  });
}

export function jsonOk(
  data: unknown,
  init?: { status?: number; total?: number; page?: number; pageSize?: number; perPage?: number },
) {
  const headers = secureHeaders();
  const pageSize = init?.pageSize ?? init?.perPage;
  if (init?.total !== undefined && init.page !== undefined && pageSize !== undefined) {
    const extra = paginatedHeaders(init.total, init.page, pageSize);
    extra.forEach((value, key) => headers.set(key, value));
  }
  return new Response(JSON.stringify(data), { status: init?.status ?? 200, headers });
}

export { jsonError } from "./errors";

export async function readJson(request: Request): Promise<unknown> {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > SECURITY.MAX_JSON_BYTES) {
    throw new ApiError(413, "http.payload_too_large", "Request body exceeds size limit.");
  }
  const text = await request.text();
  if (text.length > SECURITY.MAX_JSON_BYTES) {
    throw new ApiError(413, "http.payload_too_large", "Request body exceeds size limit.");
  }
  if (!text) {
    return {};
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiError(400, "http.invalid_json", "Request body is not valid JSON.");
  }
}
