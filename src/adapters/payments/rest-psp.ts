import { amountForGateway } from "../../domain/iran";
import { ApiError } from "../../lib/errors";
import type { PaymentAdapter, PaymentStartInput, PaymentVerifyInput } from "../ports";
import { adapterHttp } from "../http";

export function createRestPspAdapter(input: {
  id: string;
  apiKey: string;
  startUrl: string;
  verifyUrl: string;
  sandbox: boolean;
  amountUnit: "toman" | "rial";
}): PaymentAdapter {
  return {
    id: input.id,
    async start(req: PaymentStartInput) {
      if (!input.apiKey) {
        throw new ApiError(503, "gateways.not_configured", `${input.id} is not configured.`);
      }
      const posted = await adapterHttp()(
        input.startUrl,
        {
          amount: amountForGateway(req.amountRial, input.amountUnit),
          callback: req.callbackUrl,
          order_id: req.orderId,
          sandbox: input.sandbox,
        },
        { "X-API-KEY": input.apiKey },
      );
      const payload = posted.json as { id?: string; link?: string; trans_id?: string };
      const authority = payload.id ?? payload.trans_id;
      const redirectUrl = payload.link ?? "";
      if (!authority) {
        throw new ApiError(402, "payments.start_failed", `${input.id} rejected the payment request.`);
      }
      return { authority, redirectUrl };
    },
    async verify(req: PaymentVerifyInput) {
      if (!input.apiKey) {
        throw new ApiError(503, "gateways.not_configured", `${input.id} is not configured.`);
      }
      const posted = await adapterHttp()(
        input.verifyUrl,
        { id: req.authority, amount: amountForGateway(req.amountRial, input.amountUnit) },
        { "X-API-KEY": input.apiKey },
      );
      const payload = posted.json as { status?: number; track_id?: string };
      const ok = posted.status === 200 && (payload.status === 100 || payload.status === 1);
      return { ok, reference: payload.track_id ?? null, code: Number(payload.status ?? 0) };
    },
  };
}
