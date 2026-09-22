import { isIranEconomicCode, isIranNationalId, isIranSheba } from "./iran";

export function legalSettingError(id: string, value: string): string | null {
  if (!value) {
    return null;
  }
  if (id === "national_id" && !isIranNationalId(value)) {
    return "legal.invalid_national_id";
  }
  if (id === "sheba" && !isIranSheba(value)) {
    return "legal.invalid_sheba";
  }
  if (id === "economic_code" && !isIranEconomicCode(value)) {
    return "legal.invalid_economic_code";
  }
  return null;
}
