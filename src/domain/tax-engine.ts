export type TaxRegime = "domestic" | "oss" | "ioss" | "export" | "exempt";

export function resolveTaxRegime(params: {
  merchantCountry: string;
  customerCountry: string;
  digitalGood: boolean;
  orderMinor: number;
  iossThresholdMinor: number;
  exemptionCode?: string | null;
}): TaxRegime {
  if (params.exemptionCode) {
    return "exempt";
  }
  if (params.merchantCountry === params.customerCountry) {
    return "domestic";
  }
  const eu = new Set(["AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE"]);
  const merchantEu = eu.has(params.merchantCountry);
  const customerEu = eu.has(params.customerCountry);
  if (merchantEu && customerEu) {
    return "oss";
  }
  if (customerEu && params.digitalGood === false && params.orderMinor <= params.iossThresholdMinor) {
    return "ioss";
  }
  return "export";
}

export function nexusApplies(warehouseCountries: string[], customerCountry: string): boolean {
  return warehouseCountries.includes(customerCountry);
}
