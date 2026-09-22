export const MESSAGE_FA: Record<string, string> = {
  "auth.invalid_key": "کلید نامعتبر است.",
  "auth.missing_credentials": "کلید وب‌سرویس لازم است.",
  "payments.verify_failed": "درگاه پرداخت را تأیید نکرد.",
  "payments.start_failed": "درگاه پرداخت درخواست را نپذیرفت.",
  "gateways.not_configured": "درگاه پیکربندی نشده است.",
  "checkout.empty_cart": "سبد خرید خالی است.",
  "sms.invalid_recipient": "شماره موبایل نامعتبر است.",
  "checkout.mobile_required": "شماره موبایل ایران الزامی است.",
  "auth.invalid_otp": "رمز یک‌بارمصرف نامعتبر است.",
  "media.unsupported_type": "فقط تصویر jpeg، png، webp یا gif مجاز است.",
  "media.too_large": "حجم تصویر بیش از حد مجاز است.",
  "reviews.invalid_rating": "امتیاز باید بین ۱ و ۵ باشد.",
  "moadian.unconfigured": "سامانه مودیان روشن است ولی نشانی یا کلید تنظیم نشده.",
  "moadian.submit_failed": "سامانه مودیان فاکتور را نپذیرفت.",
  "backup.unsupported_dialect": "پشتیبان پرونده فقط برای اسکیوالایت است.",
};

export function messageFa(code: string): string | null {
  return MESSAGE_FA[code] ?? null;
}
