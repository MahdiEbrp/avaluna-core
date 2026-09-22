import { formatJalaliIso } from "./jalali";
import { rialsToToman } from "./iran";

export type InvoiceInput = {
  number: string;
  createdAt: string;
  totalRial: number;
  taxRial: number;
  currency: string;
  sheba: string;
  storeName: string;
  returnDays: number;
};

export function buildInvoice(input: InvoiceInput) {
  return {
    number: input.number,
    jalali_date: formatJalaliIso(input.createdAt),
    currency: input.currency,
    amount_rial: input.totalRial,
    amount_toman: rialsToToman(input.totalRial),
    tax_rial: input.taxRial,
    sheba: input.sheba,
    store_name: input.storeName,
    return_days: input.returnDays,
  };
}
