import { convertMinor } from "./currency";

export function presentmentMinor(settlementMinor: number, settlementRate: number, presentmentRate: number): number {
  return convertMinor(settlementMinor, settlementRate, presentmentRate);
}

export function settlementMinorFromPresentment(
  presentmentMinorAmount: number,
  presentmentRate: number,
  settlementRate: number,
): number {
  return convertMinor(presentmentMinorAmount, presentmentRate, settlementRate);
}
