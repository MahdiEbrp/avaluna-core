/** Iran identity, money units, and checkout identifiers. */

export const RIALS_PER_TOMAN = 10;

export function rialsToToman(rials: number): number {
  return Math.floor(Math.max(0, rials) / RIALS_PER_TOMAN);
}

export function tomanToRials(toman: number): number {
  return Math.max(0, Math.trunc(toman)) * RIALS_PER_TOMAN;
}

export function amountForGateway(rials: number, unit: "rial" | "toman"): number {
  return unit === "toman" ? rialsToToman(rials) : Math.max(0, Math.trunc(rials));
}

export function normalizeIranMobile(raw: string): string | null {
  const digits = raw.replace(/[\s-]/g, "");
  if (/^\+989\d{9}$/.test(digits)) {
    return digits;
  }
  if (/^00989\d{9}$/.test(digits)) {
    return `+${digits.slice(2)}`;
  }
  if (/^09\d{9}$/.test(digits)) {
    return `+98${digits.slice(1)}`;
  }
  if (/^9\d{9}$/.test(digits)) {
    return `+98${digits}`;
  }
  return null;
}

export function isIranMobile(raw: string): boolean {
  return normalizeIranMobile(raw) !== null;
}

export function isIranPostalCode(value: string): boolean {
  return /^\d{10}$/.test(value);
}

export function isIranNationalId(value: string): boolean {
  if (!/^\d{10}$/.test(value)) {
    return false;
  }
  if (/^(\d)\1{9}$/.test(value)) {
    return false;
  }
  const check = Number(value[9]);
  let sum = 0;
  for (let i = 0; i < 9; i += 1) {
    sum += Number(value[i]) * (10 - i);
  }
  const rem = sum % 11;
  return rem < 2 ? check === rem : check === 11 - rem;
}

/** IBAN-style Sheba: IR + 24 digits, ISO 13616 mod-97. */
export function isIranSheba(value: string): boolean {
  const compact = value.replace(/\s/g, "").toUpperCase();
  if (!/^IR\d{24}$/.test(compact)) {
    return false;
  }
  const rearranged = `${compact.slice(4)}${compact.slice(0, 4)}`;
  let expanded = "";
  for (const ch of rearranged) {
    expanded += /\d/.test(ch) ? ch : String(ch.charCodeAt(0) - 55);
  }
  let acc = 0;
  for (const ch of expanded) {
    acc = (acc * 10 + Number(ch)) % 97;
  }
  return acc === 1;
}

export function isIranEconomicCode(value: string): boolean {
  return /^\d{11,12}$/.test(value);
}
