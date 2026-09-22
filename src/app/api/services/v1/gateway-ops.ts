import { jsonOk } from "@/lib/http";
import { parseResourceId } from "@/lib/safety";
import { tickCronJobs, createCronJob, listCronJobs, runCronJob } from "@/lib/services/cron-jobs";
import { chargeViaGateway, listCharges, listOutbox, sendEmail, sendSms } from "@/lib/services/gateways";
import { startOrderPayment, verifyOrderPayment } from "@/lib/services/pay-session";
import { getPaymentAdapter } from "@/adapters/registry";
import { loadSettings } from "@/lib/settings/store";
import type { ServiceContext } from "./service-context";

export async function handleGatewayOps(ctx: ServiceContext): Promise<Response | null> {
  const { method, resource, idOrAction, body } = ctx;

  if (resource === "payment-sessions") {
    if (method === "POST" && idOrAction === "verify") {
      const rec = body as { provider: string; authority: string; order_id?: number };
      return jsonOk(await verifyOrderPayment(rec));
    }
    if (method === "POST") {
      const rec = body as { provider: string; order_id: number };
      if (rec.order_id) {
        return jsonOk(await startOrderPayment(rec.order_id, rec.provider), { status: 201 });
      }
      const map = await loadSettings();
      const adapter = getPaymentAdapter(rec.provider, map);
      return jsonOk({ provider: adapter.id }, { status: 201 });
    }
  }

  if (resource === "payment-charges") {
    if (method === "GET") return jsonOk(await listCharges());
    if (method === "POST") {
      const rec = body as { provider: string; amount: string; order_id?: number; pan_last4?: string };
      return jsonOk(await chargeViaGateway(rec), { status: 201 });
    }
  }

  if (resource === "email") {
    if (method === "GET") return jsonOk(await listOutbox("email"));
    if (method === "POST") {
      const rec = body as { to: string; subject: string; body: string };
      return jsonOk(await sendEmail(rec), { status: 201 });
    }
  }

  if (resource === "sms") {
    if (method === "GET") return jsonOk(await listOutbox("sms"));
    if (method === "POST") {
      const rec = body as { to: string; body: string };
      return jsonOk(await sendSms(rec), { status: 201 });
    }
  }

  if (resource === "cron-jobs") {
    if (method === "GET" && !idOrAction) return jsonOk(await listCronJobs());
    if (method === "POST" && !idOrAction) {
      const rec = body as { name: string; expression: string; handler: string };
      return jsonOk(await createCronJob(rec), { status: 201 });
    }
    if (method === "POST" && idOrAction === "tick") {
      return jsonOk(await tickCronJobs());
    }
    if (method === "POST" && idOrAction) {
      return jsonOk(await runCronJob(parseResourceId(idOrAction)));
    }
  }

  return null;
}
