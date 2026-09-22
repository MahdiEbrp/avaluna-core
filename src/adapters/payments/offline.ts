import type { PaymentAdapter } from "../ports";

export function createOfflineAdapter(id: "card_to_card" | "cash_on_delivery" | "avaluna_offline"): PaymentAdapter {
  return {
    id,
    async start() {
      return { authority: `offline_${id}`, redirectUrl: "" };
    },
    async verify() {
      return { ok: false, reference: null, code: 0 };
    },
  };
}
