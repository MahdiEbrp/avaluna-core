/** Named business and infrastructure constants — no magic numbers in domain code. */

export const APP_NAME = "Avaluna";
export const APP_SLUG = "avaluna";

export const API = {
  STOREFRONT_PREFIX: "/api/storefront/v1",
  SERVICES_PREFIX: "/api/services/v1",
} as const;

export const MONEY = {
  SCALE: 100,
  DECIMAL_PLACES: 2,
  DEFAULT_CURRENCY: "IRR",
  SAMPLE_ORDER_RIAL: 2_499_000,
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  MIN_PAGE_SIZE: 1,
} as const;

export const TIME = {
  MS_PER_SECOND: 1_000,
  SECONDS_PER_MINUTE: 60,
  MINUTES_PER_HOUR: 60,
  HOURS_PER_DAY: 24,
  MS_PER_MINUTE: 60_000,
  MS_PER_DAY: 86_400_000,
  UTC: "UTC",
  CLOCK_PAD: "00",
} as const;

export const RATE_LIMIT = {
  WINDOW_MS: TIME.MS_PER_MINUTE,
  SERVICES_PER_WINDOW: 120,
  STOREFRONT_PER_WINDOW: 60,
  OTP_PER_WINDOW: 8,
  VERIFY_PER_WINDOW: 20,
} as const;

export const DATABASE = {
  HEALTH_PROBE_INTERVAL_MS: 15 * TIME.MS_PER_SECOND,
  HEALTH_FAIL_BUDGET: 3,
  HEALTH_COOLDOWN_MS: 5 * TIME.MS_PER_SECOND,
} as const;

export const SECURITY = {
  PASSWORD_HASH_ROUNDS: 10,
  API_SECRET_HASH_ROUNDS: 10,
  CART_TOKEN_BYTES: 24,
  CART_NONCE_BYTES: 12,
  API_KEY_ID_BYTES: 18,
  API_SECRET_BYTES: 24,
  WEBHOOK_TIMEOUT_MS: 8_000,
  WEBHOOK_DISABLE_AFTER_FAILURES: 5,
  MAX_JSON_BYTES: 65_536,
  PASSWORD_MIN_LENGTH: 10,
  CSP_NONCE_BYTES: 16,
  CSP_NONCE_HEADER: "x-nonce",
  /** JSON/API responses — no scripts, no nonce. HTML uses `documentContentSecurityPolicy`. */
  CONTENT_SECURITY_POLICY:
    "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
} as const;

export const MEDIA = {
  MAX_BYTES: 2_097_152,
  DIR: "data/media",
  ALLOWED_TYPES: ["image/jpeg", "image/png", "image/webp", "image/gif"] as const,
} as const;

export const BACKUP = {
  DIR: "data/backups",
} as const;

export const REVIEW = {
  RATING_MIN: 1,
  RATING_MAX: 5,
} as const;

export const SETUP = {
  FIRST_STEP: 0,
  STEP_COUNT: 5,
  LAST_STEP: 4,
} as const;

export const UI = {
  PERCENT_MAX: 100,
  LANG_QUERY: "lang",
  LOCALE_COOKIE: "avaluna_locale",
  DEFAULT_LOCALE: "fa" as const,
  MANTINE_RADIUS: "md" as const,
  MANTINE_SCHEME: "light" as const,
  GRID_SPAN_FULL: 12,
  GRID_SPAN_HALF: 6,
  GRID_SPAN_THIRD: 4,
  STEPPER_CHECKOUT_LAST: 2,
  HEADER_HEIGHT: 56,
  NAVBAR_WIDTH: 220,
  TIMELINE_BULLET: 20,
  PAGE_MAX: "40rem",
  PRODUCT_GRID: { BASE: 1, SM: 2, MD: 3, LG: 4 } as const,
  SEARCH: { MAX_LENGTH: 80, DEBOUNCE_MS: 250 } as const,
  CART: { BADGE_MAX: 99 } as const,
  WIZARD: { MIN_PASSWORD: SECURITY.PASSWORD_MIN_LENGTH } as const,
  OTP: { MOBILE_LENGTH: 11, CODE_LENGTH: 5 } as const,
  FOCUS: { OUTLINE_WIDTH: 2, OUTLINE_OFFSET: 2 } as const,
  SKIP_LINK_ID: "main-content",
  TOUCH_TARGET_MIN: 44,
  CART_TOKEN_STORAGE: "avaluna_cart_token",
  CART_NONCE_STORAGE: "avaluna_cart_nonce",
  NAV_BREAKPOINT: "md",
  BURGER_BREAKPOINT: "sm",
  HOME: { SECTION_LIMIT: 8, CATEGORY_LIMIT: 12, TITLE_ORDER: 2 } as const,
  PLP: {
    PAGE_SIZE: 12,
    SKELETON_COUNT: 8,
    SORT_DEFAULT: "newest",
    FILTER_A11Y: "plp.filters",
  } as const,
} as const;

export const HTTP = {
  BASIC_PREFIX: "Basic ",
} as const;

const CART_RESERVATION_MINUTES = 15;

export const CART = {
  TTL_DAYS: 7,
  MIN_QUANTITY: 1,
  RESERVATION_MINUTES: CART_RESERVATION_MINUTES,
  RESERVATION_TTL_MS: CART_RESERVATION_MINUTES * TIME.MS_PER_MINUTE,
} as const;

export const IDEMPOTENCY = {
  MIN_KEY_LENGTH: 8,
  MAX_KEY_LENGTH: 128,
} as const;

export const TAX = {
  /** Basis points: 900 = 9.00% Iran VAT default; override via settings.tax.rate_bps. */
  DEFAULT_RATE_BPS: 900,
  BPS_DENOMINATOR: 10_000,
} as const;

export const IRAN = {
  COUNTRY: "IR",
  CURRENCY: "IRR",
  LOCALE: "fa-IR",
  TIMEZONE: "Asia/Tehran",
  RIALS_PER_TOMAN: 10,
} as const;

export const ORDER = {
  NUMBER_PREFIX: "AVL",
} as const;

export const ROLES = {
  ADMINISTRATOR: "administrator",
  CUSTOMER: "customer",
} as const;

export const KEY_PERMISSIONS = {
  READ: "read",
  WRITE: "write",
  READ_WRITE: "read_write",
} as const;

export const PRODUCT_TYPES = ["simple", "grouped", "external", "variable"] as const;
export const PRODUCT_STATUSES = ["draft", "pending", "private", "published"] as const;
export const STOCK_STATUSES = ["in_stock", "out_of_stock", "on_backorder"] as const;
export const BACKORDER_POLICIES = ["none", "notify", "allow"] as const;
export const CATALOG_VISIBILITY = ["visible", "catalog", "search", "hidden"] as const;

export const ORDER_STATUSES = [
  "pending_payment",
  "processing",
  "on_hold",
  "completed",
  "cancelled",
  "refunded",
  "failed",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const DISCOUNT_TYPES = ["percent", "fixed_cart", "fixed_item"] as const;
export type DiscountType = (typeof DISCOUNT_TYPES)[number];

export const SHIPPING_METHOD_IDS = ["flat_rate", "free_shipping", "local_pickup"] as const;

export const PAYMENT_METHODS = {
  BANK_TRANSFER: "bank_transfer",
  CASH_ON_DELIVERY: "cash_on_delivery",
  CHEQUE: "cheque",
  AVALUNA_OFFLINE: "avaluna_offline",
  AVALUNA_CARD_SIM: "avaluna_card_sim",
  ZARINPAL: "zarinpal",
  IDPAY: "idpay",
  NEXTPAY: "nextpay",
  ZIBAL: "zibal",
  PAYPING: "payping",
  SADAD: "sadad",
  BEHPARDAKHT: "behpardakht",
  CARD_TO_CARD: "card_to_card",
} as const;

export const TIMEZONE_DEFAULT = IRAN.TIMEZONE;

export const FULFILLMENT_STATUSES = ["unfulfilled", "partial", "fulfilled"] as const;
export type FulfillmentStatus = (typeof FULFILLMENT_STATUSES)[number];

export const SHIPMENT_STATUSES = ["pending", "in_transit", "delivered", "cancelled"] as const;
export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

export const RETURN_STATUSES = ["requested", "approved", "rejected", "received", "refunded"] as const;
export type ReturnStatus = (typeof RETURN_STATUSES)[number];

export const RELATION_TYPES = ["related", "upsell", "cross_sell"] as const;
export type RelationType = (typeof RELATION_TYPES)[number];

export const INVENTORY_REASONS = ["receive", "sale", "return", "adjust", "transfer"] as const;

export const LOYALTY = {
  POINTS_PER_MAJOR_UNIT: 1,
} as const;

export const CART_ABANDONED_AFTER_HOURS = 4;

export const GIFT_CARD = {
  CODE_PREFIX: "GIFT",
} as const;

export const LOW_STOCK_THRESHOLD = 5;

export const LOG = {
  RETENTION_DAYS: 14,
  CLEANUP_CRON: "0 3 * * *",
  CLEANUP_HANDLER: "logs.cleanup",
  MESSAGE_MAX: 500,
} as const;

export const STRESS = {
  DEFAULT_BASE: "http://127.0.0.1:3000",
  WORKERS: 20,
  DURATION_MS: 15_000,
  TIMEOUT_MS: 8_000,
  PERCENTILE_P50: 50,
  PERCENTILE_P95: 95,
  PERCENTILE_P99: 99,
} as const;
