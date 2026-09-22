import { amountForGateway } from "../../domain/iran";
import { zarinpalAccepted, zarinpalRequestPath, zarinpalStartUrl } from "../../domain/iran-gateways";
import { ApiError } from "../../lib/errors";
import type { PaymentAdapter, PaymentStartInput, PaymentVerifyInput } from "../ports";
import { adapterHttp } from "../http";

export function createZarinpalAdapter(input: {
  merchantId: string;
  sandbox: boolean;
  amountUnit: "toman" | "rial";
}): PaymentAdapter {
  return {
    id: "zarinpal",
    async start(req: PaymentStartInput) {
      if (!input.merchantId) {
        throw new ApiError(503, "gateways.not_configured", "ZarinPal merchant id is not set.");
      }
      const amount = amountForGateway(req.amountRial, input.amountUnit);
      const posted = await adapterHttp()(zarinpalRequestPath(input.sandbox), {
        merchant_id: input.merchantId,
        amount,
        callback_url: req.callbackUrl,
        description: req.description,
        metadata: { mobile: req.mobile, email: req.email, order_id: req.orderId },
      });
      const payload = posted.json as { data?: { code?: number; authority?: string }; errors?: { code?: number } };
      const code = payload.data?.code ?? payload.errors?.code ?? posted.status;
      const authority = payload.data?.authority;
      if (!zarinpalAccepted(Number(code)) || !authority) {
        throw new ApiError(402, "payments.start_failed", "ZarinPal rejected the payment request.");
      }
      return { authority, redirectUrl: zarinpalStartUrl(authority, input.sandbox) };
    },
    async verify(req: PaymentVerifyInput) {
      if (!input.merchantId) {
        throw new ApiError(503, "gateways.not_configured", "ZarinPal merchant id is not set.");
      }
      const amount = amountForGateway(req.amountRial, input.amountUnit);
      const verifyUrl = input.sandbox
        ? "https://sandbox.zarinpal.com/pg/v4/payment/verify.json"
        : "https://api.zarinpal.com/pg/v4/payment/verify.json";
      const posted = await adapterHttp()(verifyUrl, {
        merchant_id: input.merchantId,
        authority: req.authority,
        amount,
      });
      const payload = posted.json as { data?: { code?: number; ref_id?: number } };
      const code = Number(payload.data?.code ?? 0);
      return {
        ok: zarinpalAccepted(code),
        reference: payload.data?.ref_id !== undefined && payload.data.ref_id !== null ? String(payload.data.ref_id) : null,
        code,
      };
    },
  };
}
