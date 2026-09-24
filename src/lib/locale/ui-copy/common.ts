import type { UiLocale } from "../../../domain/ui-locale";

export const commonFa = {
  "meta.title": "آوالونا | Avaluna",
  "meta.description": "تجارت الکترونیک API-first برای ایران",
  "nav.brand": "آوالونا",
  "nav.features": "قابلیت‌ها",
  "nav.flow": "مسیر سفارش",
  "nav.api": "وب‌سرویس",
  "nav.faq": "پرسش‌ها",
  "nav.locale": "زبان",
  "nav.skip": "پرش به محتوای اصلی",
  "nav.home": "خانه",
  "nav.products": "محصولات",
  "nav.cart": "سبد خرید",
  "nav.account": "حساب کاربری",
  "nav.search": "جستجو",
  "locale.fa": "فارسی",
  "locale.en": "English",
  "landing.switch": "English",
  "error.title": "خطا",
  "error.retry": "تلاش دوباره",
  "loading": "در حال بارگذاری…",
} as const satisfies Record<string, string>;

export const commonEn = {
  "meta.title": "Avaluna | آوالونا",
  "meta.description": "API-first commerce for Iran",
  "nav.brand": "Avaluna",
  "nav.features": "Capabilities",
  "nav.flow": "Order path",
  "nav.api": "API",
  "nav.faq": "FAQ",
  "nav.locale": "Language",
  "nav.skip": "Skip to main content",
  "nav.home": "Home",
  "nav.products": "Products",
  "nav.cart": "Cart",
  "nav.account": "Account",
  "nav.search": "Search",
  "locale.fa": "فارسی",
  "locale.en": "English",
  "landing.switch": "فارسی",
  "error.title": "Error",
  "error.retry": "Retry",
  "loading": "Loading…",
} as const satisfies Record<string, string>;

export const COMMON: Record<UiLocale, Record<string, string>> = {
  fa: commonFa,
  en: commonEn,
};
