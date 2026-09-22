export type MoadianInvoice = {
  number: string;
  createdAt: string;
  totalRial: number;
  taxRial: number;
  nationalId: string;
  economicCode: string;
};

export type MoadianReadiness = "skip" | "ready" | "unconfigured";

export function moadianReadiness(enabled: boolean, apiUrl: string, apiKey: string): MoadianReadiness {
  if (!enabled) {
    return "skip";
  }
  if (!apiUrl || !apiKey) {
    return "unconfigured";
  }
  return "ready";
}

export function moadianPayload(invoice: MoadianInvoice) {
  return {
    header: {
      taxid: invoice.economicCode,
      indatim: invoice.createdAt,
      inno: invoice.number,
    },
    body: {
      seller_national_id: invoice.nationalId,
      tins: invoice.totalRial,
      tvam: invoice.taxRial,
      currency: "IRR",
    },
  };
}
