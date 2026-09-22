import { kavenegarSendPath } from "../../domain/iran-gateways";
import { ApiError } from "../../lib/errors";
import { adapterHttp } from "../http";
import type { SmsAdapter, SmsSendInput } from "../ports";

export function createKavenegarAdapter(apiKey: string, sender: string): SmsAdapter {
  return {
    id: "kavenegar",
    async send(input: SmsSendInput) {
      if (!apiKey) {
        throw new ApiError(503, "gateways.not_configured", "Kavenegar API key is not set.");
      }
      const posted = await adapterHttp()(kavenegarSendPath(apiKey), {
        receptor: input.toE164,
        message: input.body,
        sender: input.sender ?? sender,
        template: input.template,
      });
      const payload = posted.json as { return?: { status?: number }; entries?: { messageid?: number }[] };
      if (posted.status >= 400 || (payload.return?.status ?? 200) >= 400) {
        throw new ApiError(502, "sms.send_failed", "Kavenegar rejected the message.");
      }
      return { providerMessageId: String(payload.entries?.[0]?.messageid ?? "kavenegar") };
    },
  };
}
