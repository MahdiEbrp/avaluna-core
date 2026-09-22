import { isYes, readMerged, type SettingMap } from "../lib/settings/store";
import type { PaymentAdapter, SmsAdapter } from "./ports";
import { createOfflineAdapter } from "./payments/offline";
import { createRestPspAdapter } from "./payments/rest-psp";
import { createZarinpalAdapter } from "./payments/zarinpal";
import { createKavenegarAdapter } from "./sms/kavenegar";
import { createRestSmsAdapter } from "./sms/rest-sms";
import { createSmtpAdapter } from "./email/smtp";
import type { CarrierAdapter, EmailAdapter } from "./ports";
import { createIranCarrierAdapter } from "./carriers/iran";
import { ApiError } from "../lib/errors";

function unit(map: SettingMap): "toman" | "rial" {
  return readMerged(map, "payments", "amount_unit") === "rial" ? "rial" : "toman";
}

export function getPaymentAdapter(id: string, map: SettingMap): PaymentAdapter {
  const sandbox = isYes(readMerged(map, "payments", "sandbox"));
  const amountUnit = unit(map);
  if (id === "zarinpal") {
    return createZarinpalAdapter({
      merchantId: readMerged(map, "payments", "zarinpal_merchant_id"),
      sandbox,
      amountUnit,
    });
  }
  if (id === "idpay") {
    return createRestPspAdapter({
      id,
      apiKey: readMerged(map, "payments", "idpay_api_key"),
      startUrl: "https://api.idpay.ir/v1.1/payment",
      verifyUrl: "https://api.idpay.ir/v1.1/payment/verify",
      sandbox,
      amountUnit,
    });
  }
  if (id === "nextpay") {
    return createRestPspAdapter({
      id,
      apiKey: readMerged(map, "payments", "nextpay_api_key"),
      startUrl: "https://nextpay.org/nx/gateway/token",
      verifyUrl: "https://nextpay.org/nx/gateway/verify",
      sandbox,
      amountUnit,
    });
  }
  if (id === "zibal") {
    return createRestPspAdapter({
      id,
      apiKey: readMerged(map, "payments", "zibal_merchant"),
      startUrl: "https://gateway.zibal.ir/v1/request",
      verifyUrl: "https://gateway.zibal.ir/v1/verify",
      sandbox,
      amountUnit,
    });
  }
  if (id === "payping") {
    return createRestPspAdapter({
      id,
      apiKey: readMerged(map, "payments", "payping_token"),
      startUrl: "https://api.payping.ir/v2/pay",
      verifyUrl: "https://api.payping.ir/v2/pay/verify",
      sandbox,
      amountUnit,
    });
  }
  if (id === "sadad") {
    return createRestPspAdapter({
      id,
      apiKey: readMerged(map, "payments", "sadad_terminal"),
      startUrl: "https://sadad.shaparak.ir/api/v0/Request/PaymentRequest",
      verifyUrl: "https://sadad.shaparak.ir/api/v0/Advice/Verify",
      sandbox,
      amountUnit,
    });
  }
  if (id === "behpardakht") {
    return createRestPspAdapter({
      id,
      apiKey: readMerged(map, "payments", "behpardakht_terminal"),
      startUrl: "https://bpm.shaparak.ir/pgwchannel/services/pgw",
      verifyUrl: "https://bpm.shaparak.ir/pgwchannel/services/pgw",
      sandbox,
      amountUnit,
    });
  }
  if (id === "card_to_card" || id === "cash_on_delivery" || id === "avaluna_offline") {
    return createOfflineAdapter(id);
  }
  throw new ApiError(400, "payments.unknown_provider", "Unknown payment provider.");
}

export function getSmsAdapter(map: SettingMap): SmsAdapter {
  const provider = readMerged(map, "sms", "provider") || "kavenegar";
  const sender = readMerged(map, "sms", "sender");
  if (provider === "kavenegar") {
    return createKavenegarAdapter(readMerged(map, "sms", "kavenegar_api_key"), sender);
  }
  if (provider === "ghasedak") {
    return createRestSmsAdapter(
      "ghasedak",
      readMerged(map, "sms", "ghasedak_api_key"),
      "https://api.ghasedak.me/v2/sms/send/simple",
    );
  }
  if (provider === "melipayamak") {
    return createRestSmsAdapter(
      "melipayamak",
      readMerged(map, "sms", "melipayamak_user"),
      "https://rest.payamak-panel.com/api/SendSMS/SendSMS",
    );
  }
  if (provider === "sms_ir") {
    return createRestSmsAdapter("sms_ir", readMerged(map, "sms", "kavenegar_api_key"), "https://api.sms.ir/v1/send/bulk");
  }
  throw new ApiError(400, "sms.unknown_provider", "Unknown SMS provider.");
}

export function getEmailAdapter(map: SettingMap): EmailAdapter {
  const provider = readMerged(map, "email", "provider") || "smtp";
  const host =
    provider === "mailir" ? readMerged(map, "email", "smtp_host") || "smtp.mail.ir" : readMerged(map, "email", "smtp_host");
  return createSmtpAdapter(host, readMerged(map, "email", "from_address"));
}

export function getCarrierAdapter(map: SettingMap): CarrierAdapter {
  const id = readMerged(map, "shipping", "default_carrier") || "post_iran";
  return createIranCarrierAdapter(id);
}
