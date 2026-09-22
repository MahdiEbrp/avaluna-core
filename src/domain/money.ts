import { MONEY } from "../config/constants";

export type MinorUnits = number;

export function toMinorUnits(value: string | number | null | undefined, scale: number = MONEY.SCALE): MinorUnits {
  if (value === null || value === undefined || value === "") {
    return 0;
  }
  const numeric = typeof value === "number" ? value : Number.parseFloat(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Math.round(numeric * scale);
}

export function fromMinorUnits(
  minor: MinorUnits | null | undefined,
  scale: number = MONEY.SCALE,
  decimalPlaces: number = MONEY.DECIMAL_PLACES,
): string {
  const value = minor ?? 0;
  return (value / scale).toFixed(decimalPlaces);
}

export function addMinor(...parts: MinorUnits[]): MinorUnits {
  return parts.reduce((sum, part) => sum + part, 0);
}

export function clampNonNegative(minor: MinorUnits): MinorUnits {
  return Math.max(0, minor);
}

export function percentOf(baseMinor: MinorUnits, percent: number): MinorUnits {
  return Math.round((baseMinor * percent) / 100);
}
