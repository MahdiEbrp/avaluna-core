# Avaluna UI — Build Todo

Digikala shop + WP wizard · Estedad · Mantine · 300px–4k · keys/colors/nums tokenized · ≤300 lines · WCAG/MDN · SEO · **E2E every UI**

**Status:** `DONE` | `TODO` | `NOT`
**Gate each step:** `lint` · `typecheck` · `test` (domain) · matching `*.spec.ts` green when UI ships · file ≤300
**Locked:** shop `/` · landing → `/intro` · OTP modal · seed ≥24 products · +form+notifications · Playwright E2E · no Radix/shadcn/Tailwind · no CDN · no fake PSP success

## Global bars

| Bar | Rule |
|---|---|
| Space | Dense Mantine gaps; no nested wrappers; mobile rails scroll-x, ≥md grids; fluid type tokens only |
| UI by band | **&lt;768:** bottom nav, Drawer menu/filters, 1–2 col, stacked wizard, full-width search, compact cards · **768–1023:** 3 col, burger header, filters Drawer · **≥1024:** mega-menu, sticky filters, 4 col, header search, no bottom nav. Only `hiddenFrom`/`visibleFrom` + responsive `SimpleGrid` — different composition, not just reflow |
| A11y | landmarks; skip-link; focus-visible; `aria-label` via `uiCopy`; one `h1`; alt; label+error; ≥4.5:1; no color-only state |
| SEO | `generateMetadata`+canonical/route; PDP JSON-LD nonce; noindex setup/cart/checkout/search; sitemap; same-origin OG |
| Copy/color/num | keys only · hex `:root` only · numbers in `constants.ts`/CSS vars |

## E2E rules (every UI)

- **Stack:** `@playwright/test` · projects: `desktop` (1280×720), `mobile` (390×844), optional `wide` (2560) — every UI spec runs mobile+desktop (tablet 768 where layout branches)
- **Layout:** `e2e/` specs · `playwright.config.ts` (root) · `webServer` build+start · fresh SQLite per run + `npm run seed` · `NODE_ENV=test` · no live network (block external)
- **Scripts:** `"test:e2e": "playwright test"` · CI job after unit+seed
- **Style:** `data-testid` on shells only · assert landmarks + keyboard per critical flow · screenshots on failure
- **Coverage:** each phase lists its spec — no UI merge without its E2E

## Phase 0 — Design system [DONE]

- [x] 0.1 Split `ui-copy` → `{index,common,landing}.ts` · API same
- [x] 0.2 Test FA↔EN parity
- [x] 0.3 `:root` tokens (brand scale, sale, surfaces, fluid type, space-1…10, radius, shadow, z, container, header-h)
- [x] 0.4 CSS skip-link / focus-visible / reduced-motion
- [x] 0.5 Theme + breakpoints; `dir` stays on `<html>` (Mantine 9 has no provider `dir` prop)
- [x] 0.6 UI constants (grid/search/cart/wizard/otp)
- [x] 0.7 `@mantine/form` + `@mantine/notifications` installed; `Notifications` in layout
- [x] 0.8 metadata helpers · robots.ts · sitemap shell
- [x] 0.9 noindex helper (`noindexMetadata`)
- [x] 0.10 `lint:ui` (hex/style=/max-lines) + CI step
- [x] 0.11 Playwright scaffold — config + `e2e/smoke.spec.ts` + `test:e2e` script
- [x] 0.12 Gate: lint · typecheck · lint:ui · vitest coverage · next build all green; vitest serial (`maxWorkers: 1`) for SQLite
- [x] 0.13 CI → pnpm + typecheck + build + Playwright + report artifact
- [x] 0.14 Seed idempotent skip when admin exists; quiet close; **E2E smoke** (desktop/mobile/tablet × fa/en + CSP) via system Chrome

**E2E:** `e2e/smoke.spec.ts` — **PASS** 9/9 (fa/en + CSP style-attr × desktop/mobile/tablet)

## Phase 1 — Seed catalog [DONE]

- [x] 1.1 Split `scripts/seed.ts` + `seed-data/{catalog,catalog-data,commerce,util}.ts`
- [x] 1.2 8 categories fa names + en slugs
- [x] 1.3 28 products: nameFa, IRR, sale%, stock, featured, rating
- [x] 1.4 `public/img/products/*.svg` (28) + productImages rows
- [x] 1.5 6 tags + product↔category links
- [x] 1.6 8 approved reviews + product rating sync
- [x] 1.7 Idempotent re-seed (admin + seed-slug count marker)
- [x] 1.8 CI `pnpm run seed` green; files ≤300

**E2E:** `e2e/seed-catalog.spec.ts` — **PASS 15/15** (products ≥24, categories ≥8, image 200, tags+reviews × desktop/mobile/tablet)

## Phase 2 — Wizard `/setup` [DONE]

- [x] 2.1 Copy `setup.*` fa+en
- [x] 2.2 `setup/page.tsx`: done→redirect `/`; noindex; metadata
- [x] 2.3 `SetupWizard`: Stepper + `setupProgressPercent` + `canAdvanceSetup`
- [x] 2.4 Step locale (SegmentedControl → cookie)
- [x] 2.5 Step store (3×TextInput)
- [x] 2.6 Step operator (name/email/PasswordInput)
- [x] 2.7 Step payments (merchant/sandbox/enamad)
- [x] 2.8 Step review → `POST /setup`
- [x] 2.9 Success: key_id/secret + CopyButton + CTA `/`
- [x] 2.10 API `message_fa` → Alert; 409 handled
- [x] 2.11 a11y: live progress, labels, errors
- [x] 2.12 Split `setup/steps/*` if >300

**E2E:** `e2e/setup-wizard.spec.ts` — **PASS 9/9** (5 steps → keys → land `/` → second visit redirects · validation blocks · keyboard next/back × desktop/mobile/tablet)

## Phase 3 — Shop chrome [DONE]

- [x] 3.1 Copy `shop.header|nav|footer|a11y.*`
- [x] 3.2 `ShopHeader` (≤300): logo, search, account, wishlist, cart
- [x] 3.3 `ShopNav` desktop categories from server fetch
- [x] 3.4 Mobile Burger+Drawer
- [x] 3.5 `SearchBar` GET `/search` (works without JS)
- [x] 3.6 `CartButton` badge from CartProvider
- [x] 3.7 `LocaleSwitch` (`?lang`+cookie)
- [x] 3.8 `ShopFooter` + legal settings (enamad/samandehi/return_days)
- [x] 3.9 Bottom nav **only base–md**; ≥44px targets
- [x] 3.10 `ShopShell` + Notifications (root) + skip-link + `main`
- [x] 3.11 Move landing → `/intro`
- [x] 3.12 Landmarks audit

**E2E:** `e2e/chrome.spec.ts` — **PASS 21/21** (skip-link; burger only &lt;768; desk nav ≥1024; bottom nav hidden ≥1024; locale persists; footer legal; cart badge; focus trap Drawer · desktop/mobile/tablet)

## Phase 4 — Home `/` [DONE]

- [x] 4.1 Copy `shop.home.*`
- [x] 4.2 Server `page.tsx`: fetch cats+featured+sale; metadata
- [x] 4.3 Hero promo (tokens; no fake timers) — mobile stacked / desktop split
- [x] 4.4 Category tiles (mobile 2-col scroll / desktop row)
- [x] 4.5 Deals rail on_sale
- [x] 4.6 Featured grid + EmptyState
- [x] 4.7 JSON-LD Store/ItemList; one h1
- [x] 4.8 Empty DB → honest empty, not broken imgs

**E2E:** `e2e/home.spec.ts` — **PASS 6/6** (one h1; ≥1 product card; category href; deals rail; JSON-LD Store+ItemList; metadata title · desktop/mobile/tablet)

## Phase 5 — Product cards [DONE]

- [x] 5.1 `PriceTag` (NumberFormatter-style, display_unit) — done early in Phase 4
- [x] 5.2 `ProductCard` ≤300 (image, title clamp, price, rating, stock) — done early in Phase 4
- [x] 5.3 `ProductGrid` responsive cols — done early in Phase 4 (`shop-grid`)
- [x] 5.4 `AddToCartButton` + notifications; OOS disabled
- [x] 5.5 `cart-client.ts` (token/nonce headers) — done early in Phase 3
- [x] 5.6 `CartProvider` (client hydrate count) — done early in Phase 3
- [x] 5.7 `RatingStars` + aria-label

**E2E:** `e2e/product-card-add.spec.ts` — **PASS 6/6** (add updates badge; rating aria-label · desktop/mobile/tablet)

## Phase 6 — PLP/search [DONE]

- [x] 6.1 Copy `shop.plp.*`
- [x] 6.2 Shared list page: searchParams → listProducts (URL-driven)
- [x] 6.3 `/products` + metadata/canonical
- [x] 6.4 `/categories/[slug]` (+ domain `category` filter + test if missing)
- [x] 6.5 `/search` Highlight; noindex
- [x] 6.6 `FilterPanel` chips/range/sort → URL
- [x] 6.7 Filters: Drawer mobile / sticky aside lg+
- [x] 6.8 Pagination real `?page=` links (`X-Total-Pages` / pageCount)
- [x] 6.9 `loading.tsx` skeletons (CLS)
- [x] 6.10 Empty + clear filters

**E2E:** `e2e/plp.spec.ts` — filter URL+results; sort; page=2; category; empty search; Drawer vs sidebar; crawlable pagination · **PASS 18/18** (6 tests × desktop/mobile/tablet)

**Unit:** `src/domain/plp.test.ts` — parse/href/filters

## Phase 7 — PDP `/products/[slug]` [DONE]

- [x] 7.1 Copy `shop.pdp.*`
- [x] 7.2 Slug fetch (domain+test if id-only) + `not-found`
- [x] 7.3 Metadata + OG image
- [x] 7.4 JSON-LD `productJsonLd` (nonce-safe)
- [x] 7.5 Gallery (mobile thumbs / desktop side)
- [x] 7.6 Buy box: price, stock, qty, add; COD note
- [x] 7.7 Tabs desc/specs/reviews
- [x] 7.8 Reviews list+form
- [x] 7.9 Related `merchandising` (+ category/featured fallback)
- [x] 7.10 Breadcrumbs + optional BreadcrumbList

**E2E:** `e2e/pdp.spec.ts` — name+price; soft-404+noindex; add→badge; tabs; reviews; JSON-LD Product; crumbs · **PASS 15/15** (5 tests × desktop/mobile/tablet)

**Unit:** `src/domain/pdp.test.ts` — slug match, public product, image path

## Phase 8 — Cart `/cart` [DONE]

- [x] 8.1 Copy `shop.cart.*` (+ `loadError`/`retry` fa+en)
- [x] 8.2 Lines (mobile cards / desktop table)
- [x] 8.3 Qty/remove with nonce
- [x] 8.4 Coupon apply/remove
- [x] 8.5 Totals from API (no client tax math)
- [x] 8.6 CTA checkout
- [x] 8.7 noindex
- [x] 8.8 Load failure → honest Alert + retry (never a fake empty cart)
- [x] 8.9 `CartProvider` moved to root `AppProviders` — `CartView` sat above the provider in `ShopShell`, so `refresh()` was a no-op and the header badge never updated

**E2E:** `e2e/cart.spec.ts` — **PASS 15/15** (empty+noindex · add→line→qty 1→2→badge+totals→remove→badge clear · coupon invalid/apply/remove · cards vs table · mocked 429 → error+retry · desktop/mobile/tablet)

## Phase 9 — Checkout + OTP [API DONE · UI TODO]

- [ ] 9.1 Copy `shop.checkout.*`
- [ ] 9.2 Stepper steps in `checkout/steps/*` (≤300 each)
- [ ] 9.3 Address: MaskInput mobile, city, textarea; guest_ok
- [ ] 9.4 Shipping methods from API
- [ ] 9.5 Payment radios; unconfigured PSP → 503 Alert, never fake paid
- [ ] 9.6 Submit `Idempotency-Key` → 201
- [ ] 9.7 ZarinPal redirect when configured
- [ ] 9.8 Success/order page + Jalali invoice link; clear cart
- [ ] 9.9 OTP modal MaskInput+PinInput+session
- [ ] 9.10 Session header on account calls
- [ ] 9.11 noindex checkout/cart

**E2E:** `e2e/checkout.spec.ts` — guest COD → success; double-submit one order; shipping cost; honest PSP errors
**E2E:** `e2e/otp.spec.ts` — validation; mocked OTP/rate-limit (no live SMS)

## Phase 10 — SEO + hardening [partial DONE]

- [x] Root metadata, `domain/seo.ts`, API sitemap
- [ ] 10.1 Next `sitemap.ts` from DB (no setup/cart)
- [ ] 10.2 OG assets in `public/og/`
- [ ] 10.3 Canonical on every shop route
- [ ] 10.4 Shop `not-found.tsx`
- [ ] 10.5 `error.tsx` (no stack leak)
- [ ] 10.6 Token contrast audit ≥4.5:1
- [ ] 10.7 Reduced-motion + focus polish
- [ ] 10.8 Perf: server above-fold; lazy below; hero eager
- [ ] 10.9 Gates: `style=` · hex in src · fa literals in TSX · max-lines
- [ ] 10.10 Full CI green
- [ ] 10.11 Matrix 300/375/768/1280/2560/3840 × fa/en
- [ ] 10.12 Keyboard walk wizard→PDP→checkout; landmark spot-check

**E2E:**
- `e2e/seo.spec.ts` — robots.txt; sitemap product URLs; noindex setup/cart/checkout; PDP canonical; titles
- `e2e/a11y-keyboard.spec.ts` — Tab order; skip-link; accessible names
- `e2e/responsive.spec.ts` — 300/375/768/1280/2560 — bottom-nav rules, col count, no horizontal scroll

## Phase 11 — E2E completeness [TODO]

- [ ] 11.1 `@playwright/test` + config (3 viewports, webServer, temp DB+seed, block external, retries=1 CI, trace on fail)
- [ ] 11.2 `test:e2e` script; vitest stays unit/coverage
- [ ] 11.3 CI job: lint → unit → seed → `playwright test`
- [ ] 11.4 testid map (appendix) — wrappers only
- [ ] 11.5 Cart nonce/session helper for specs
- [ ] 11.6 `page.route` mocks OTP/PSP — no live network
- [ ] 11.7 Spec inventory below 100% mapped — gate 10.10
- [ ] 11.8 No `waitForTimeout`; locator/API waits only
- [ ] 11.9 Keyboard+landmark asserts (axe later optional)
- [ ] 11.10 HTML report gitignored; CI artifact on fail

### E2E inventory (every UI → ≥1 spec, mobile+desktop)

| Spec | Covers |
|---|---|
| smoke | boot, locale rtl/ltr, CSP style-attr |
| seed-catalog | API catalog density |
| setup-wizard | 5-step first-run **9/9** |
| chrome | header/nav/drawer/bottomnav/locale |
| home | `/` sections |
| product-card-add | home→cart badge |
| plp | filters/sort/page/category/search **18/18** |
| pdp | detail/404/reviews/JSON-LD **15/15** |
| cart | line/qty/coupon/totals/empty/honest-error **15/15** |
| checkout | guest COD e2e |
| otp | modal validation/honest errors |
| seo | robots/sitemap/noindex/canonical |
| a11y-keyboard | skip/tab/names |
| responsive | 5 widths × chrome rules |

Phase UI ↔ spec pair incomplete = phase not done.

## NOT

Merchant desk · compare · chat · Jalali DatePicker · Radix/shadcn/Tailwind · CDN · jsdom RTL (E2E covers UI) · axe required · fake gateway success · live SMS/PSP in tests

## Already DONE (reuse)

Estedad · CSP/nonce · locale/RTL · uiCopy · setup API+domain+tests · storefront cart/checkout/OTP/reviews/search APIs · money/Jalali · productJsonLd/canonical/sitemapUrlset · Mantine shell · landing (relocate → /intro)

## Order

0 (incl. 0.11 Playwright) → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10; 11 continuous — each UI phase merges only with its spec.
Full unit test after 0.2, 1.4, 6.4 domain, 10. Split file >300 immediately.

## Status now

| Area | Status |
|---|---|
| Plan + E2E matrix | DONE (this file) |
| Phase 0 design system | DONE · lint/typecheck/lint:ui/unit+coverage/build/seed/smoke all green |
| Phase 1 seed catalog | DONE · 28 products / 8 categories / SVGs / tags / reviews · seed-catalog **15/15** |
| Phase 2 setup wizard | DONE · `/setup` 5-step UI · setup-wizard **9/9** · keys+redirect |
| Phase 3 shop chrome | DONE · header/nav/drawer/search/cart/locale/footer/bottom · landing → `/intro` · chrome **21/21** |
| Phase 4 home `/` | DONE · hero + categories + deals rail + featured grid + JSON-LD + empty · home **6/6** |
| Phase 5 product kit | DONE · PriceTag + ProductCard + grid + AddToCart + RatingStars · product-card-add **6/6** |
| Phase 6 PLP/search | DONE · filters/sort/pagination/category/search · plp **18/18** · nested-button hydration #418 fixed |
| Playwright scaffold | DONE · smoke + seed-catalog + setup-wizard + chrome + home + product-card-add + plp + pdp + cart **108/108** desktop+mobile+tablet · system Chrome · prod secrets in webServer · smoke asserts no unsafe-eval · `e2e/support.ts` gives each test its own client IP (storefront rate limit is per IP) |
| Phase 7 PDP | DONE · slug/OG/JSON-LD/gallery/buy/tabs/reviews/related/crumbs · pdp **15/15** |
| Phase 8 cart `/cart` | DONE · lines/qty/coupon/totals/CTA/noindex + honest load-error retry · cart **15/15** · badge provider fixed at root |
| UI phases 9–10 | TODO (cart CTA → `/checkout` 404 until Phase 9) |
| Backend APIs | DONE |
| E2E specs (5 remaining) | checkout · otp · seo · a11y-keyboard · responsive (9 green: smoke, seed-catalog, setup-wizard, chrome, home, product-card-add, plp, pdp, cart) |

## Appendix — testids (grow as built)

`skip-link` · `shop.shell` · `shop.header` · `header.logo` · `header.search` · `header.search.submit` · `header.cart` · `header.cart.badge` · `header.locale` · `header.account` · `header.wishlist` · `header.burger` · `desk.nav` · `nav.drawer` · `bottom.nav` · `bottom.home` · `bottom.categories` · `bottom.cart` · `bottom.account` · `main` · `shop.footer` · `footer.enamad` · `footer.samandehi` · `footer.return-days` · `footer.intro` · `home.hero` · `home.hero.cta` · `home.categories` · `home.cat.<slug>` · `home.deals` · `home.featured` · `home.empty` · `product.card.*` · `product.price` · `setup.next` · `setup.back` · `setup.submit` · `pdp.view` · `pdp.title` · `pdp.crumbs` · `pdp.crumb.*` · `pdp.buy` · `pdp.gallery` · `pdp.image` · `pdp.stock` · `pdp.sku` · `pdp.cod` · `pdp.add` · `pdp.tabs` · `pdp.tab.*` · `pdp.panel.*` · `pdp.reviews` · `pdp.review.form` · `pdp.review.*` · `pdp.related` · `pdp.loading` · `cart.view` · `cart.title` · `cart.loading` · `cart.empty` · `cart.empty.continue` · `cart.lines` · `cart.lines.cards` · `cart.lines.table` · `cart.line` · `cart.line.name` · `cart.line.unit` · `cart.line.total` · `cart.line.qty` · `cart.line.remove` · `cart.qty` · `cart.coupon` · `cart.coupon.input` · `cart.coupon.apply` · `cart.coupon.applied` · `cart.coupon.remove` · `cart.coupon.message` · `cart.summary` · `cart.totals` · `cart.totals.grand` · `cart.checkout` · `cart.load.error` · `cart.load.retry` · `cart.error` · `checkout.submit` · `otp.open` — add at implementation; never user-visible
