import { jsonOk } from "@/lib/http";
import { parseResourceId } from "@/lib/safety";
import { createCompany, createDraftOrder, convertDraftOrder, createPriceList, createQuote, listCompanies, listDrafts, quoteVolumePrice } from "@/lib/services/b2b-ops";
import {
  addKitComponent,
  addTaxExemption,
  buyLabel,
  computeAtp,
  createPurchaseOrder,
  evaluateTax,
  expandKitProduct,
  installApp,
  listApps,
  receivePurchaseOrder,
  scoreFraud,
  transferStock,
} from "@/lib/services/ops-growth";
import {
  attemptSubscriptionBilling,
  createSubscription,
  listSubscriptions,
  updateSubscriptionStatus,
} from "@/lib/services/subscriptions";
import { stackDiscounts, bxgyDiscountMinor } from "@/domain/discount-stack";
import { giftWrapMinor, optionSurchargeMinor } from "@/domain/bundles";
import type { ServiceContext } from "./service-context";

export async function handleGrowthOps(ctx: ServiceContext): Promise<Response | null> {
  const { method, resource, idOrAction, nested, body } = ctx;
  const rec = body as Record<string, unknown>;

  if (resource === "subscriptions") {
    if (method === "GET") return jsonOk(await listSubscriptions());
    if (method === "POST" && !idOrAction) {
      return jsonOk(await createSubscription(rec as never), { status: 201 });
    }
    if (method === "POST" && nested === "bill") {
      return jsonOk(await attemptSubscriptionBilling(parseResourceId(idOrAction), Boolean(rec.success)));
    }
    if (method === "PATCH" && idOrAction) {
      return jsonOk(await updateSubscriptionStatus(parseResourceId(idOrAction), String(rec.status)));
    }
  }

  if (resource === "draft-orders") {
    if (method === "GET") return jsonOk(await listDrafts());
    if (method === "POST" && !idOrAction) return jsonOk(await createDraftOrder(rec as never), { status: 201 });
    if (method === "POST" && nested === "convert") return jsonOk(await convertDraftOrder(parseResourceId(idOrAction)));
  }

  if (resource === "companies") {
    if (method === "GET") return jsonOk(await listCompanies());
    if (method === "POST") return jsonOk(await createCompany(rec as never), { status: 201 });
  }

  if (resource === "quotes" && method === "POST") {
    return jsonOk(await createQuote(rec as never), { status: 201 });
  }

  if (resource === "price-lists") {
    if (method === "POST" && !idOrAction) return jsonOk(await createPriceList(rec as never), { status: 201 });
    if (method === "POST" && nested === "quote") {
      return jsonOk(await quoteVolumePrice(parseResourceId(idOrAction), Number(rec.quantity), String(rec.list_unit)));
    }
  }

  if (resource === "kits") {
    if (method === "POST" && nested === "components") {
      return jsonOk(await addKitComponent(parseResourceId(idOrAction), Number(rec.product_id), Number(rec.quantity)), { status: 201 });
    }
    if (method === "GET" && nested === "expand") {
      return jsonOk(await expandKitProduct(parseResourceId(idOrAction), Number(ctx.url.searchParams.get("qty") ?? 1)));
    }
  }

  if (resource === "gift-wrap" && method === "POST") {
    return jsonOk({ amount_minor: giftWrapMinor(true, Number(rec.fee_minor ?? 0), Number(rec.lines ?? 1)) });
  }

  if (resource === "options" && method === "POST") {
    const selected = (rec.selected as { surchargeMinor: number }[]) ?? [];
    return jsonOk({ amount_minor: optionSurchargeMinor(Number(rec.base_minor ?? 0), selected) });
  }

  if (resource === "tax") {
    if (nested === "exemptions" && method === "POST") {
      return jsonOk(await addTaxExemption(Number(rec.customer_id), String(rec.code)), { status: 201 });
    }
    if (method === "POST") return jsonOk(await evaluateTax(rec as never));
  }

  if (resource === "labels") {
    if (method === "POST" && !idOrAction) return jsonOk(await buyLabel(rec as never), { status: 201 });
    if (method === "PATCH" && idOrAction) {
      const { updateLabelTracking } = await import("@/lib/services/ops-growth");
      return jsonOk(await updateLabelTracking(parseResourceId(idOrAction), String(rec.status)));
    }
  }

  if (resource === "fraud" && method === "POST") {
    return jsonOk(await scoreFraud(rec as never), { status: 201 });
  }

  if (resource === "discounts" && method === "POST") {
    if (idOrAction === "bxgy") {
      return jsonOk({
        amount_minor: bxgyDiscountMinor(Number(rec.buy), Number(rec.get), Number(rec.unit_minor), Number(rec.qty)),
      });
    }
    return jsonOk({
      amount_minor: stackDiscounts((rec.discounts as never) ?? [], Number(rec.subtotal_minor), Number(rec.shipping_minor)),
    });
  }

  if (resource === "transfers" && method === "POST") {
    return jsonOk(await transferStock(rec as never), { status: 201 });
  }

  if (resource === "purchase-orders") {
    if (method === "POST" && !idOrAction) {
      return jsonOk(await createPurchaseOrder(Number(rec.product_id), Number(rec.ordered)), { status: 201 });
    }
    if (method === "POST" && nested === "receive") {
      return jsonOk(await receivePurchaseOrder(parseResourceId(idOrAction), Number(rec.quantity)));
    }
  }

  if (resource === "atp" && method === "GET") {
    return jsonOk(
      await computeAtp(
        Number(ctx.url.searchParams.get("on_hand") ?? 0),
        Number(ctx.url.searchParams.get("reserved") ?? 0),
        Number(ctx.url.searchParams.get("incoming") ?? 0),
        Number(ctx.url.searchParams.get("outgoing") ?? 0),
      ),
    );
  }

  if (resource === "apps") {
    if (method === "GET") return jsonOk(await listApps());
    if (method === "POST") return jsonOk(await installApp(String(rec.slug), (rec.scopes as string[]) ?? []), { status: 201 });
  }

  return null;
}
