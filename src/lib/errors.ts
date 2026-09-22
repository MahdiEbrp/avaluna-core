import { randomUUID } from "node:crypto";
import { apiContentSecurityPolicy } from "./csp";
import { messageFa } from "./locale/messages-fa";
import { appendAppLog } from "./app-log";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export function jsonError(err: unknown): Response {
  const headers = {
    "Content-Type": "application/json",
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "no-store",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Content-Security-Policy": apiContentSecurityPolicy(),
    "X-Request-Id": randomUUID(),
  };
  if (err instanceof ApiError) {
    try {
      void appendAppLog(err.status >= 500 ? "error" : "warning", err.code, err.message);
    } catch {
      // logging must not break the response
    }
    return Response.json(
      {
        error: {
          code: err.code,
          message: err.message,
          message_fa: messageFa(err.code),
          details: err.details ?? null,
        },
      },
      { status: err.status, headers },
    );
  }
  console.error(err);
  try {
    void appendAppLog("error", "internal_error", err instanceof Error ? err.message : "Unexpected error");
  } catch {
    // logging must not break the response
  }
  return Response.json(
    { error: { code: "internal_error", message: "Unexpected error", message_fa: null, details: null } },
    { status: 500, headers },
  );
}
