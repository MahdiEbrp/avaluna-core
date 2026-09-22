import { IRAN, TIME } from "../config/constants";

export { slugify } from "../domain/slug";

export function nowIso(timeZone = TIME.UTC): string {
  if (timeZone === TIME.UTC) {
    return new Date().toISOString();
  }
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const pick = (type: string) => parts.find((part) => part.type === type)?.value ?? TIME.CLOCK_PAD;
  return `${pick("year")}-${pick("month")}-${pick("day")}T${pick("hour")}:${pick("minute")}:${pick("second")}`;
}

export function daysFromNowIso(days: number): string {
  return new Date(Date.now() + days * TIME.MS_PER_DAY).toISOString();
}

export function storeNowIso(): string {
  return nowIso(IRAN.TIMEZONE);
}
