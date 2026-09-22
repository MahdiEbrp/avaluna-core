import { ApiError } from "../../lib/errors";
import { assertSafeWebhookUrl } from "../../lib/safety";
import { adapterHttp } from "../http";
import { moadianPayload, moadianReadiness, type MoadianInvoice } from "../../domain/moadian";

export async function submitMoadianInvoice(input: {
  enabled: boolean;
  apiUrl: string;
  apiKey: string;
  invoice: MoadianInvoice;
}): Promise<{ reference: string } | null> {
  const ready = moadianReadiness(input.enabled, input.apiUrl, input.apiKey);
  if (ready === "skip") {
    return null;
  }
  if (ready === "unconfigured") {
    throw new ApiError(503, "moadian.unconfigured", "Moadian is enabled but API URL or key is missing.");
  }
  assertSafeWebhookUrl(input.apiUrl);
  const response = await adapterHttp()(input.apiUrl, moadianPayload(input.invoice), {
    Authorization: `Bearer ${input.apiKey}`,
  });
  if (response.status < 200 || response.status >= 300) {
    throw new ApiError(503, "moadian.submit_failed", "Moadian tax authority rejected the invoice.");
  }
  const json = response.json as { reference?: string; uid?: string };
  return { reference: json.reference || json.uid || "moadian" };
}
