/** Gregorian → Jalali (jalaali-js compatible). */

export type CivilDate = { year: number; month: number; day: number };

function truncDiv(a: number, b: number): number {
  return Math.trunc(a / b);
}

export function gregorianToJalali(g: CivilDate): CivilDate {
  const monthOffset = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  const gy2 = g.month > 2 ? g.year + 1 : g.year;
  let days =
    355666 +
    365 * g.year +
    truncDiv(gy2 + 3, 4) -
    truncDiv(gy2 + 99, 100) +
    truncDiv(gy2 + 399, 400) +
    g.day +
    (monthOffset[g.month - 1] ?? 0);
  let jy = -1595 + 33 * truncDiv(days, 12053);
  days %= 12053;
  jy += 4 * truncDiv(days, 1461);
  days %= 1461;
  if (days > 365) {
    jy += truncDiv(days - 1, 365);
    days = (days - 1) % 365;
  }
  const jm = days < 186 ? 1 + truncDiv(days, 31) : 7 + truncDiv(days - 186, 30);
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
  return { year: jy, month: jm, day: jd };
}

export function formatJalaliIso(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return iso;
  }
  const j = gregorianToJalali({
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
  });
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${j.year}/${pad(j.month)}/${pad(j.day)}`;
}
