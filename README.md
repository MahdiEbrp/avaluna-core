# Avaluna

API-first commerce for **Iran** (`fa-IR`, RTL, Jalali, IRR/toman). Next.js + libSQL + Drizzle.

Ports: `src/adapters/ports.ts`. Settings: `GET/PUT /api/services/v1/settings/:group`. Agent rules: [AGENTS.md](./AGENTS.md).

## Quickstart

```bash
npm install
npm run seed
npm run dev
npm test
```

CI (lint + tests + seed): `npm run ci` — also [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) on every push.

Local demo service keys (never production): `ak_demo_local_only` / `as_demo_local_only`  
Basic `ak_…:as_…`. Cart: `X-Avaluna-Cart` / `X-Avaluna-Nonce`. Session: `X-Avaluna-Session`.

1. Seed products in rials  
2. PUT `payments.zarinpal_merchant_id`  
3. `POST /api/storefront/v1/checkout` with `payment_method=zarinpal`  
4. `GET /api/storefront/v1/payments/callback`

## Env

| Variable | Role |
|---|---|
| `DATABASE_URL` | Primary DB (`file:…`, `libsql://…`, `postgres://…`, `mysql://…`) |
| `DATABASE_DIALECT` | Optional override |
| `DATABASE_AUTH_TOKEN` | Turso/libSQL token |
| `DATABASE_REPLICA_URL` | Replica URL (redacted in health) |
| `DATABASE_CONNECTORS` | JSON named extras |
| `DATABASE_ENABLE_REMOTE` | `yes` to use Postgres (`postgres`) or MySQL (`mysql2`) lazy drivers |
| `AVALUNA_SETTINGS_SECRET` | AES-GCM key for secret settings |
| `AVALUNA_SESSION_SECRET` | HMAC for `X-Avaluna-Session` |

Primary Drizzle store is sqlite/libsql. Postgres/MySQL extra connectors without a hooked driver return `database.driver_unavailable`.

---

## Layers (acyclic)

```
app (pages, API routes)
  → lib/services  (use-cases, DB + adapters)
    → adapters    (HTTP to PSP/SMS/email/carriers)
    → lib/db      (connector → native health layer → drivers; types in connector-types.ts)
    → domain      (pure rules, no fetch, no DB)
```

Drivers import `connector-types.ts` only — never `connector.ts` (no import cycle). Domain HMAC requires an explicit secret from `lib/runtime-secret.ts`.

## Every file

### Repo root

| File | What it is |
|---|---|
| `package.json` | Scripts (`dev`, `seed`, `test`, `lint`) and dependencies |
| `package-lock.json` | Locked npm versions |
| `tsconfig.json` | Strict TypeScript; `@/*` → `src/*` |
| `tsconfig.tsbuildinfo` | Incremental `tsc` cache (generated) |
| `next.config.ts` | Next.js config |
| `next-env.d.ts` | Next-generated TypeScript refs |
| `eslint.config.mjs` | ESLint: eqeqeq, no-eval, max 300 lines, no `any` |
| `.prettierrc` | Formatter |
| `.gitignore` | Ignores `node_modules`, `.next`, `data`, coverage |
| `openapi.yaml` | OpenAPI 3.1 for public routes (no secret examples) |
| `README.md` | This map + quickstart |
| `AGENTS.md` | Agent rules, scorecard, God/Excellent/Bad/Ugly |
| `CLAUDE.md` | Points at `AGENTS.md` |
| `DESIGN.md` | Landing tokens (Estedad, ink/canvas) |

### `public/`

Default Next SVGs (`file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`). Not store branding.

### `scripts/`

| File | What it is |
|---|---|
| `scripts/seed.ts` | Creates admin, demo key (rotated if `NODE_ENV=production`), IRR product, IR shipping, tax 9%, gateways, settings |

### `src/config/`

| File | What it is |
|---|---|
| `constants.ts` | Named limits: pagination, rate limits, security sizes, order statuses, Iran defaults |

### `src/app/` — UI + HTTP

| File | What it is |
|---|---|
| `layout.tsx` | `lang=fa` `dir=rtl`, Estedad via `globals.css`, CSP nonce |
| `page.tsx` | Landing: سلام دنیا / Hello world |
| `globals.css` | Tokens + landing styles (no Tailwind) |
| `favicon.ico` | Icon |

### `src/app/api/services/v1/` — merchant API (Basic `ak_:as_`)

| File | What it is |
|---|---|
| `[...path]/route.ts` | Catch-all: rate limit, health (DB connectors), OpenAPI, auth, dispatch |
| `route.ts` | Collection root |
| `service-context.ts` | Shared handler context type |
| `catalog-ops.ts` | Products, variations, categories, tags |
| `sales-ops.ts` | Orders, refunds, notes, customers, promotions, sales report |
| `platform-ops.ts` | Settings (seal/mask/audit/legal), shipping, tax, payments, webhooks, API keys |
| `commerce-ops.ts` | Inventory, collections, gift cards, fulfillments, returns, search, loyalty |
| `gateway-ops.ts` | Payment sessions, charges, SMS, email, cron tick |
| `growth-ops.ts` | Subscriptions, drafts, B2B, kits, labels, fraud, ATP, apps |

### `src/app/api/storefront/v1/` — shopper API

| File | What it is |
|---|---|
| `[...path]/route.ts` | Cart, checkout, products, facets, search, CSRF on writes |
| `storefront-extra.ts` | OTP, session, legal, invoices, payments callback, SEO, account |

### `src/adapters/` — only layer allowed to `fetch`

| File | What it is |
|---|---|
| `ports.ts` | Payment / SMS / email / carrier interfaces |
| `ports.test.ts` | Port shapes + Iran carrier quote |
| `index.ts` | Re-exports |
| `http.ts` | Injected HTTP for tests (`setAdapterHttp`) |
| `registry.ts` | `getPaymentAdapter` / `getSmsAdapter` / `getEmailAdapter` / `getCarrierAdapter` from settings |
| `payments/zarinpal.ts` | ZarinPal v4 request/verify + StartPay |
| `payments/rest-psp.ts` | Shared REST PSP (IDPay, NextPay, Zibal, PayPing, Sadad, Behpardakht) |
| `payments/offline.ts` | COD / card-to-card — verify never fakes capture |
| `sms/kavenegar.ts` | Kavenegar send |
| `sms/rest-sms.ts` | Ghasedak, Melipayamak, SMS.ir |
| `email/smtp.ts` | SMTP / mail.ir host |
| `carriers/iran.ts` | پست ایران, تیپاکس, چاپار, الوپیک, اسنپ‌باکس quotes |
| `zarinpal.test.ts` | Mocked ZarinPal/Kavenegar/registry tests |

### `src/domain/` — pure rules, no HTTP

| File | What it is |
|---|---|
| `money.ts` | `toMinorUnits` / `fromMinorUnits` with scale |
| `iran.ts` | Mobile +98, national ID, Sheba, postal, toman |
| `iran-gateways.ts` | Provider lists, ZarinPal URLs, carrier quote math |
| `jalali.ts` | Gregorian → Jalali + `formatJalaliIso` |
| `settings-catalog.ts` | Every merchant knob + defaults |
| `orders.ts` | Status machine; checkout → pending_payment / on_hold / processing |
| `payments.ts` | Payment-intent transitions |
| `checkout-identity.ts` | Mobile, national ID, guest, idempotency, Sheba, postcode |
| `otp.ts` | Issue/verify OTP + cooldown |
| `session-token.ts` | HMAC session |
| `csrf.ts` | Origin allowlist |
| `cod.ts` | COD → completed on delivered |
| `inventory.ts` | Fulfill, remaining stock, line total |
| `inventory-ledger.ts` | Movements, low stock |
| `reservation.ts` | Hold expiry |
| `shipping.ts` | Eligible rates + free-above |
| `tax.ts` / `tax-engine.ts` | Inclusive VAT / regimes |
| `discounts.ts` / `discount-stack.ts` | Coupons, BXGY, stack |
| `cart-key.ts` | Stable cart line hash |
| `slug.ts` | Latin + Persian slugs, LIKE sanitize |
| `search.ts` | Tokens, score, FTS query |
| `catalog-facets.ts` | Category / price / in-stock facets |
| `legal-validate.ts` | National ID, Sheba, economic code on save |
| `invoice.ts` | Jalali invoice JSON |
| `templates.ts` | fa/en SMS/email bodies |
| `hmac.ts` | Webhook signatures |
| `idempotency.ts` | Key replay/conflict |
| `refunds.ts` | Refund cap |
| `returns.ts` / `fulfillment.ts` | RMA / shipment status |
| `cron.ts` | 5-field UTC cron |
| `db-url.ts` | Dialect parse, redact, SSRF hosts, BEGIN SQL |
| `db-health.ts` | Probe interval, fail budget, dead-transport classification |
| `sql-safety.ts` | No multi-statement / comments; placeholders |
| `currency.ts` / `presentment.ts` / `pricing.ts` | FX / display money |
| `pagination.ts` | Page parse |
| `rate-limit.ts` | Client IP from `X-Forwarded-For` |
| `gift-cards.ts` / `loyalty.ts` / `portal.ts` | Cards, points, customer portal |
| `seo.ts` | Canonical + sitemap |
| `abandoned-cart.ts` | Age rule |
| `apps.ts` / `atp.ts` / `b2b.ts` / `bundles.ts` | Apps, ATP, volume, kits |
| `carriers.ts` / `draft-orders.ts` / `fraud.ts` / `subscriptions.ts` | Extra commerce rules |
| `*.test.ts` | Domain tests (Jalali gold, OTP, money, CSRF, DB URL, coverage) |

### `src/lib/` — runtime

| File | What it is |
|---|---|
| `db/client.ts` | Drizzle + libSQL primary; `withWriteTransaction` |
| `db/connector.ts` | Dialect connector (execute/ping/begin) |
| `db/registry.ts` | Primary + replica + named extras |
| `db/migrate.ts` | Runs SQL modules + ALTER/FTS extras |
| `db/migrate-catalog.ts` | Users, products, variations, images |
| `db/migrate-checkout.ts` | Carts, orders, shipping, tax, gateways |
| `db/migrate-ops.ts` | Settings, webhooks, FTS-related ops tables |
| `db/migrate-gateways.ts` | Charges, outbox, cron |
| `db/migrate-growth.ts` | Subs, drafts, B2B, kits |
| `db/schema/index.ts` | Schema barrel |
| `db/schema/identity.ts` | Users, API keys |
| `db/schema/catalog.ts` | Catalog tables (`name_fa`, `slug_fa`, …) |
| `db/schema/checkout.ts` | Carts, orders, shipping, tax |
| `db/schema/ops.ts` | Settings, inventory, fulfillments, returns, audit |
| `db/schema/gateways.ts` | Charges, outbox, cron |
| `db/schema/growth.ts` | Growth tables |
| `settings/store.ts` | Load/merge settings; decrypt secrets |
| `settings/secrets.ts` | `sealSecret` / `openSecret` / `maskSecret` |
| `settings/*.test.ts` | IRR money + AES tests |
| `money/profile.ts` | IRR scale 1 vs EUR 100; rial/toman payload |
| `locale/messages-fa.ts` | `message_fa` map |
| `auth.ts` | Service Basic key verify |
| `csrf.ts` | Storefront origin vs `general.shop_origin` |
| `errors.ts` | `ApiError` + JSON + `X-Request-Id` |
| `http.ts` | `jsonOk`, `readJson`, security headers |
| `safety.ts` | IDs, JSON body, webhook SSRF |
| `pagination.ts` | Response page headers |
| `result.ts` | Insert-or-404 helper |
| `time.ts` | UTC ISO + Tehran `storeNowIso` |
| `rate-limit.ts` | SQLite bucket limiter |
| `webhooks.ts` | Signed HTTPS delivery |
| `openapi.ts` | Serves OpenAPI document |
| `helpers.test.ts` / `safety.test.ts` | HTTP/time/SSRF tests |

### `src/lib/services/` — use-cases (DB + domain + adapters)

| File | What it is |
|---|---|
| `catalog.ts` / `catalog-write.ts` / `catalog-map.ts` / `catalog-schema.ts` / `catalog-facets.ts` | Product CRUD, IRR pricing, fa fields, FTS insert, facets |
| `cart.ts` / `cart-shipping.ts` | Cart, coupons, tax on shipping, free-above, carrier quote |
| `orders.ts` | Checkout → order + redirect PSP |
| `order-admin.ts` | List/update/refund/notes |
| `pay-session.ts` | Start/verify; stock on capture |
| `stock.ts` | Decrement + low-stock webhook/SMS |
| `otp.ts` | Request/confirm OTP (sandbox skip SMS) |
| `outbox.ts` | Drain queued SMS/email |
| `cron-jobs.ts` | Create/run/tick (`outbox.drain`), advisory lock |
| `gateways.ts` | Ops SMS/email/charges |
| `fulfillment-flow.ts` | Ship SMS, COD delivered, RMA restock/refund |
| `ops-commerce.ts` | Fulfillments, returns, abandoned carts, loyalty, intents |
| `inventory.ts` | Locations, adjust, reserve |
| `merchandising.ts` | Related, collections, wishlist, gift cards, search |
| `commerce.ts` | Re-exports inventory + merchandising + ops-commerce |
| `portal.ts` | Customer orders/returns/SEO |
| `ops-growth.ts` | Kits, labels, fraud, transfers, POs, apps |
| `b2b-ops.ts` | Companies, quotes, price lists, drafts |
| `subscriptions.ts` | Recurring status/billing attempt |

### Generated / runtime (not source of truth)

| Path | What it is |
|---|---|
| `data/avaluna.sqlite` | Default DB file (gitignored) |
| `node_modules/` | Packages |
| `.next/` | Next build |

---

## Backup

```bash
sqlite3 data/avaluna.sqlite ".backup data/avaluna-backup.sqlite"
```

OpenAPI: [openapi.yaml](./openapi.yaml)
