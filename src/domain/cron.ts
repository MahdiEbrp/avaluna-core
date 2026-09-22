function fieldMatch(field: string, value: number, min: number, max: number): boolean {
  if (field === "*") {
    return true;
  }
  if (field.startsWith("*/")) {
    const step = Number(field.slice(2));
    return step > 0 && value % step === 0;
  }
  return field.split(",").some((part) => {
    const n = Number(part);
    return Number.isInteger(n) && n >= min && n <= max && n === value;
  });
}

export function isCronExpression(expr: string): boolean {
  return expr.trim().split(/\s+/).length === 5;
}

export function cronMatchesUtc(expr: string, at: Date): boolean {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) {
    return false;
  }
  const minute = parts[0];
  const hour = parts[1];
  const day = parts[2];
  const month = parts[3];
  const weekday = parts[4];
  if (!minute || !hour || !day || !month || !weekday) {
    return false;
  }
  return (
    fieldMatch(minute, at.getUTCMinutes(), 0, 59) &&
    fieldMatch(hour, at.getUTCHours(), 0, 23) &&
    fieldMatch(day, at.getUTCDate(), 1, 31) &&
    fieldMatch(month, at.getUTCMonth() + 1, 1, 12) &&
    fieldMatch(weekday, at.getUTCDay(), 0, 6)
  );
}

const MAX_LOOKAHEAD_MINUTES = 8 * 24 * 60;

export function nextCronUtcMs(expr: string, fromMs: number): number | null {
  if (!isCronExpression(expr)) {
    return null;
  }
  const start = Math.ceil((fromMs + 1) / 60_000) * 60_000;
  for (let i = 0; i < MAX_LOOKAHEAD_MINUTES; i += 1) {
    const ts = start + i * 60_000;
    if (cronMatchesUtc(expr, new Date(ts))) {
      return ts;
    }
  }
  return null;
}
