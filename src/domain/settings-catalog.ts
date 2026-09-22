export type SettingType = "text" | "boolean" | "number" | "select" | "secret";

export type SettingDefinition = {
  group: string;
  id: string;
  label: string;
  type: SettingType;
  value: string;
};

/** Every store knob is a row — merchants override via PUT /settings/:group */
export const SETTING_DEFINITIONS: readonly SettingDefinition[] = [
  { group: "general", id: "store_name", label: "Store name", type: "text", value: "Avaluna" },
  { group: "general", id: "store_name_fa", label: "Store name (Persian)", type: "text", value: "آوالونا" },
  { group: "general", id: "country", label: "Country", type: "text", value: "IR" },
  { group: "general", id: "city", label: "City", type: "text", value: "Tehran" },
  { group: "general", id: "address", label: "Address", type: "text", value: "" },
  { group: "general", id: "locale", label: "Locale", type: "text", value: "fa-IR" },
  { group: "general", id: "direction", label: "Text direction", type: "select", value: "rtl" },
  { group: "general", id: "timezone", label: "Timezone", type: "text", value: "Asia/Tehran" },
  { group: "general", id: "calendar", label: "Calendar", type: "select", value: "jalali" },
  { group: "general", id: "currency", label: "Currency", type: "text", value: "IRR" },
  { group: "general", id: "currency_unit", label: "Display unit", type: "select", value: "toman" },
  { group: "general", id: "phone", label: "Store phone", type: "text", value: "" },
  { group: "general", id: "shop_origin", label: "Shop origin (CSRF)", type: "text", value: "" },
  { group: "database", id: "dialect", label: "Primary dialect (env DATABASE_URL)", type: "select", value: "sqlite" },
  { group: "database", id: "replica_enabled", label: "Use replica for reads", type: "boolean", value: "no" },
  { group: "legal", id: "enamad_code", label: "E-Namad code", type: "text", value: "" },
  { group: "legal", id: "samandehi_code", label: "Samandehi code", type: "text", value: "" },
  { group: "legal", id: "national_id", label: "National ID", type: "text", value: "" },
  { group: "legal", id: "economic_code", label: "Economic code", type: "text", value: "" },
  { group: "legal", id: "sheba", label: "Sheba (IBAN)", type: "text", value: "" },
  { group: "legal", id: "vat_id", label: "VAT / tax ID", type: "text", value: "" },
  { group: "tax", id: "prices_include_tax", label: "Prices include tax", type: "boolean", value: "yes" },
  { group: "tax", id: "rate_bps", label: "VAT basis points", type: "number", value: "900" },
  { group: "tax", id: "charge_on_shipping", label: "VAT on shipping", type: "boolean", value: "yes" },
  { group: "payments", id: "default_provider", label: "Default payment provider", type: "select", value: "zarinpal" },
  { group: "payments", id: "amount_unit", label: "Gateway amount unit", type: "select", value: "toman" },
  { group: "payments", id: "sandbox", label: "Sandbox gateways", type: "boolean", value: "yes" },
  { group: "payments", id: "zarinpal_merchant_id", label: "ZarinPal merchant UUID", type: "secret", value: "" },
  { group: "payments", id: "idpay_api_key", label: "IDPay API key", type: "secret", value: "" },
  { group: "payments", id: "nextpay_api_key", label: "NextPay API key", type: "secret", value: "" },
  { group: "payments", id: "zibal_merchant", label: "Zibal merchant", type: "secret", value: "" },
  { group: "payments", id: "payping_token", label: "PayPing token", type: "secret", value: "" },
  { group: "payments", id: "sadad_terminal", label: "Sadad terminal", type: "secret", value: "" },
  { group: "payments", id: "behpardakht_terminal", label: "Behpardakht terminal", type: "secret", value: "" },
  { group: "payments", id: "card_to_card_sheba", label: "Card-to-card Sheba", type: "text", value: "" },
  { group: "payments", id: "callback_url", label: "Payment callback URL", type: "text", value: "" },
  { group: "sms", id: "provider", label: "SMS provider", type: "select", value: "kavenegar" },
  { group: "sms", id: "kavenegar_api_key", label: "Kavenegar API key", type: "secret", value: "" },
  { group: "sms", id: "ghasedak_api_key", label: "Ghasedak API key", type: "secret", value: "" },
  { group: "sms", id: "melipayamak_user", label: "Melipayamak user", type: "text", value: "" },
  { group: "sms", id: "sender", label: "SMS sender number", type: "text", value: "" },
  { group: "sms", id: "otp_template", label: "OTP template", type: "text", value: "verify" },
  { group: "email", id: "provider", label: "Email provider", type: "select", value: "smtp" },
  { group: "email", id: "smtp_host", label: "SMTP host", type: "text", value: "" },
  { group: "email", id: "smtp_port", label: "SMTP port", type: "number", value: "587" },
  { group: "email", id: "smtp_user", label: "SMTP user", type: "text", value: "" },
  { group: "email", id: "from_address", label: "From address", type: "text", value: "store@avaluna.ir" },
  { group: "shipping", id: "default_carrier", label: "Default carrier", type: "select", value: "post_iran" },
  { group: "shipping", id: "free_above_rial", label: "Free shipping above (rial)", type: "number", value: "5000000" },
  { group: "checkout", id: "require_national_id", label: "Require national ID", type: "boolean", value: "no" },
  { group: "checkout", id: "require_mobile", label: "Require mobile", type: "boolean", value: "yes" },
  { group: "checkout", id: "cod_enabled", label: "Cash on delivery", type: "boolean", value: "yes" },
  { group: "checkout", id: "guest_ok", label: "Allow guest checkout", type: "boolean", value: "yes" },
  { group: "checkout", id: "require_idempotency", label: "Require Idempotency-Key", type: "boolean", value: "no" },
  { group: "legal", id: "return_days", label: "Consumer return days", type: "number", value: "7" },
  { group: "legal", id: "moadian_enabled", label: "Moadian e-invoice", type: "boolean", value: "no" },
  { group: "legal", id: "moadian_api_url", label: "Moadian HTTPS endpoint", type: "text", value: "" },
  { group: "legal", id: "moadian_api_key", label: "Moadian API key", type: "secret", value: "" },
  { group: "setup", id: "completed", label: "Setup wizard completed", type: "boolean", value: "no" },
];

export function settingGroups(): string[] {
  return [...new Set(SETTING_DEFINITIONS.map((row) => row.group))];
}

export function settingsForGroup(group: string): SettingDefinition[] {
  return SETTING_DEFINITIONS.filter((row) => row.group === group);
}

export function defaultSetting(group: string, id: string): string | undefined {
  return SETTING_DEFINITIONS.find((row) => row.group === group && row.id === id)?.value;
}

export function mergeSettingValue(
  definition: SettingDefinition,
  override: string | undefined,
): SettingDefinition {
  return override === undefined ? definition : { ...definition, value: override };
}
