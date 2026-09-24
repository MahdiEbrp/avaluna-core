import { describe, expect, it, afterEach } from "vitest";
import { createZarinpalAdapter } from "./payments/zarinpal";
import { createKavenegarAdapter } from "./sms/kavenegar";
import { createRestPspAdapter } from "./payments/rest-psp";
import { getPaymentAdapter, getSmsAdapter } from "./registry";
import { resetAdapterHttp, setAdapterHttp } from "./http";
import { defaultsMap, mergeSettings } from "../lib/settings/store";
import { ApiError } from "../lib/errors";

afterEach(() => {
  resetAdapterHttp();
});

describe("zarinpal and kavenegar adapters", () => {
  it("starts and verifies with mocked http", async () => {
    setAdapterHttp(async (url) => {
      if (url.includes("request")) {
        return { status: 200, json: { data: { code: 100, authority: "A".repeat(36) } } };
      }
      return { status: 200, json: { data: { code: 101, ref_id: 77 } } };
    });
    const zp = createZarinpalAdapter({ merchantId: "m", sandbox: true, amountUnit: "toman" });
    const started = await zp.start({
      amountRial: 10000,
      description: "t",
      callbackUrl: "https://shop.example/cb",
    });
    expect(started.redirectUrl).toContain("sandbox");
    const verified = await zp.verify({ authority: started.authority, amountRial: 10000 });
    expect(verified.ok).toBe(true);
    expect(verified.code).toBe(101);
  });

  it("rejects missing keys and failed start", async () => {
    const empty = createZarinpalAdapter({ merchantId: "", sandbox: true, amountUnit: "toman" });
    await expect(empty.start({ amountRial: 1, description: "x", callbackUrl: "https://x" })).rejects.toBeInstanceOf(ApiError);
    setAdapterHttp(async () => ({ status: 200, json: { errors: { code: 99 } } }));
    const zp = createZarinpalAdapter({ merchantId: "m", sandbox: false, amountUnit: "rial" });
    await expect(zp.start({ amountRial: 1000, description: "x", callbackUrl: "https://x" })).rejects.toBeInstanceOf(ApiError);
  });

  it("sends kavenegar and rest psp", async () => {
    setAdapterHttp(async () => ({ status: 200, json: { return: { status: 200 }, entries: [{ messageid: 9 }] } }));
    const sms = createKavenegarAdapter("key", "1000");
    expect((await sms.send({ toE164: "+989121234567", body: "hi" })).providerMessageId).toBe("9");
    await expect(createKavenegarAdapter("", "").send({ toE164: "+98912", body: "x" })).rejects.toBeInstanceOf(ApiError);
    setAdapterHttp(async () => ({ status: 200, json: { id: "t1", link: "https://pay.ir/t1", status: 100, track_id: "tr" } }));
    const idpay = createRestPspAdapter({
      id: "idpay",
      apiKey: "k",
      startUrl: "https://api.idpay.ir/v1.1/payment",
      verifyUrl: "https://api.idpay.ir/v1.1/payment/verify",
      sandbox: true,
      amountUnit: "toman",
    });
    expect((await idpay.start({ amountRial: 5000, description: "x", callbackUrl: "https://x" })).authority).toBe("t1");
    expect((await idpay.verify({ authority: "t1", amountRial: 5000 })).ok).toBe(true);
    const map = mergeSettings({
      "payments.zarinpal_merchant_id": "m",
      "sms.kavenegar_api_key": "k",
    });
    expect(getPaymentAdapter("zarinpal", map).id).toBe("zarinpal");
    expect(getPaymentAdapter("idpay", map).id).toBe("idpay");
    expect(getPaymentAdapter("nextpay", map).id).toBe("nextpay");
    expect(getPaymentAdapter("zibal", map).id).toBe("zibal");
    expect(getPaymentAdapter("payping", map).id).toBe("payping");
    expect(getPaymentAdapter("sadad", map).id).toBe("sadad");
    expect(getPaymentAdapter("behpardakht", map).id).toBe("behpardakht");
    expect(getPaymentAdapter("card_to_card", map).id).toBe("card_to_card");
    expect(getSmsAdapter(map).id).toBe("kavenegar");
    expect(() => getPaymentAdapter("paypal", defaultsMap())).toThrow(ApiError);
    const offline = getPaymentAdapter("cash_on_delivery", map);
    expect((await offline.start({ amountRial: 1000, description: "x", callbackUrl: "https://x" })).authority).toContain(
      "offline",
    );
    expect((await offline.verify({ authority: "x", amountRial: 1000 })).ok).toBe(false);
    await expect(
      createRestPspAdapter({
        id: "idpay",
        apiKey: "",
        startUrl: "https://x",
        verifyUrl: "https://x",
        sandbox: true,
        amountUnit: "toman",
      }).start({ amountRial: 1, description: "x", callbackUrl: "https://x" }),
    ).rejects.toBeInstanceOf(ApiError);
    setAdapterHttp(async () => ({ status: 200, json: {} }));
    await expect(
      createRestPspAdapter({
        id: "idpay",
        apiKey: "k",
        startUrl: "https://x",
        verifyUrl: "https://x",
        sandbox: true,
        amountUnit: "toman",
      }).start({ amountRial: 1, description: "x", callbackUrl: "https://x" }),
    ).rejects.toBeInstanceOf(ApiError);
    setAdapterHttp(async () => ({ status: 400, json: { return: { status: 400 } } }));
    await expect(createKavenegarAdapter("k", "1").send({ toE164: "+98912", body: "x" })).rejects.toBeInstanceOf(ApiError);
    expect(getSmsAdapter(mergeSettings({ "sms.provider": "ghasedak", "sms.ghasedak_api_key": "g" })).id).toBe(
      "ghasedak",
    );
    expect(getSmsAdapter(mergeSettings({ "sms.provider": "melipayamak", "sms.melipayamak_user": "u" })).id).toBe(
      "melipayamak",
    );
    expect(getSmsAdapter(mergeSettings({ "sms.provider": "sms_ir" })).id).toBe("sms_ir");
    const { getEmailAdapter } = await import("./registry");
    const { createRestSmsAdapter } = await import("./sms/rest-sms");
    setAdapterHttp(async () => ({ status: 200, json: { id: "s1" } }));
    expect(
      (await createRestSmsAdapter("ghasedak", "k", "https://api.ghasedak.me/x").send({ toE164: "+98912", body: "a" }))
        .providerMessageId,
    ).toBe("s1");
    expect(getEmailAdapter(mergeSettings({ "email.smtp_host": "mail.example" })).id).toBe("smtp");
    expect(getEmailAdapter(mergeSettings({ "email.provider": "mailir" })).id).toBe("smtp");
    expect(() => getSmsAdapter(mergeSettings({ "sms.provider": "unknown" }))).toThrow(ApiError);
    const emptyZp = createZarinpalAdapter({ merchantId: "", sandbox: true, amountUnit: "toman" });
    await expect(emptyZp.verify({ authority: "A", amountRial: 1 })).rejects.toBeInstanceOf(ApiError);
  });
});
