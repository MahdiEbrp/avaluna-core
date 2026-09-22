import { ApiError } from "../../lib/errors";
import { adapterHttp } from "../http";
import type { SmsAdapter, SmsSendInput } from "../ports";

export function createRestSmsAdapter(id: string, apiKey: string, sendUrl: string): SmsAdapter {
  return {
    id,
    async send(input: SmsSendInput) {
      if (!apiKey) {
        throw new ApiError(503, "gateways.not_configured", `${id} is not configured.`);
      }
      const posted = await adapterHttp()(sendUrl, {
        receptor: input.toE164,
        message: input.body,
        api_key: apiKey,
      });
      if (posted.status >= 400) {
        throw new ApiError(502, "sms.send_failed", `${id} rejected the message.`);
      }
      const payload = posted.json as { id?: string };
      return { providerMessageId: payload.id ?? id };
    },
  };
}
