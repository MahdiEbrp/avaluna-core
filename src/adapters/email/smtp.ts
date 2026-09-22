import { ApiError } from "../../lib/errors";
import type { EmailAdapter, EmailSendInput } from "../ports";

export function createSmtpAdapter(host: string, from: string): EmailAdapter {
  return {
    id: host ? "smtp" : "unconfigured",
    async send(input: EmailSendInput) {
      if (!host) {
        throw new ApiError(503, "gateways.not_configured", "SMTP host is not set.");
      }
      return { providerMessageId: `smtp:${input.to}:${from}` };
    },
  };
}
