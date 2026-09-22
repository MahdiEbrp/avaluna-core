export type CarrierQuote = { carrier: string; service: string; amountMinor: number; days: number };

export function quoteCarrier(weightGrams: number, zone: "domestic" | "eu" | "world"): CarrierQuote {
  const base = zone === "domestic" ? 495 : zone === "eu" ? 995 : 2495;
  const weightFee = Math.ceil(Math.max(0, weightGrams) / 1000) * 150;
  return {
    carrier: "avaluna_post",
    service: zone === "world" ? "priority" : "standard",
    amountMinor: base + weightFee,
    days: zone === "domestic" ? 2 : zone === "eu" ? 5 : 12,
  };
}

export function trackingUrl(carrier: string, number: string): string {
  return `https://track.avaluna.local/${encodeURIComponent(carrier)}/${encodeURIComponent(number)}`;
}
