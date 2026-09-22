import { LOG, TIME } from "../config/constants";

export type LogLevel = "error" | "warning";

export function sanitizeLogField(value: string): string {
  return value.replaceAll(/[\n\r]/g, " ").slice(0, LOG.MESSAGE_MAX);
}

export function logCutoffIso(nowMs: number, retentionDays = LOG.RETENTION_DAYS): string {
  return new Date(nowMs - retentionDays * TIME.MS_PER_DAY).toISOString();
}

export function logPlaintext(iso: string, level: LogLevel, code: string, message: string): string {
  return `${iso} ${level} ${sanitizeLogField(code)} ${sanitizeLogField(message)}`;
}
