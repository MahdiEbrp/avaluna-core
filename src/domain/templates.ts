const FA: Record<string, string> = {
  order_placed: "سفارش {{number}} ثبت شد. مبلغ {{amount}} ریال.",
  order_paid: "پرداخت سفارش {{number}} تأیید شد.",
  order_shipped: "سفارش {{number}} ارسال شد. کد رهگیری: {{tracking}}",
  otp: "کد آوالونا: {{code}}",
  abandoned_cart: "سبد شما در آوالونا منتظر است.",
};

const EN: Record<string, string> = {
  order_placed: "Order {{number}} placed. Amount {{amount}} IRR.",
  order_paid: "Order {{number}} is paid.",
  order_shipped: "Order {{number}} shipped. Tracking: {{tracking}}",
  otp: "Avaluna code: {{code}}",
  abandoned_cart: "Your Avaluna cart is waiting.",
};

export function renderTemplate(
  id: keyof typeof FA,
  locale: "fa" | "en",
  vars: Record<string, string>,
): string {
  let body = (locale === "fa" ? FA : EN)[id] ?? EN[id] ?? id;
  for (const [key, value] of Object.entries(vars)) {
    body = body.replaceAll(`{{${key}}}`, value);
  }
  return body;
}
