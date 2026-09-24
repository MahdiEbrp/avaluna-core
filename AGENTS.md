<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Avaluna — agent operating rules

Project: **Avaluna**, API-first commerce for Iran. You are working in this repo. Do not resurrect `TODO.md` or `CHANGELOG.md`. Do not leave work half-done.

## Nothing incomplete

- Finish the task in the turn: typed, wired, tested, lint-clean.
- No “later”, no stub that pretends to be a product, no checked boxes for unwired code.
- Do not add TODO comments, FIXME, or roadmap files.
- If a dialect/PSP/SMS provider is advertised, it must either run or fail with a clear `503` / domain error — never silent fake success (COD/card-to-card verify stays false by design).
- Files ≤ 300 lines. Domain has no `fetch`. Routes are Avaluna names, never Woo paths.
- Every store knob is a setting. No new magic numbers.

## UI copy, color, numbers (always)

- **Multi-language:** every user-visible string has `fa` and `en` in `src/lib/locale/ui-copy.ts` (pages) or `message` + `message_fa` (API). TSX/JSX contains **keys only** (`uiCopy(locale, "landing.title")`), never Persian or English literals.
- **No hardcoded text** in components, layout, or Mantine `label`/`placeholder`/`title` props. Missing key renders the key (fail loud), do not inline a fallback sentence.
- **No hardcoded color** in TS/TSX (`#`, `rgb(`, named CSS colors). Hex lives only in `src/app/globals.css` `:root` tokens (`--ink`, `--brand`, …). Components use `var(--token)` or Mantine theme that references those tokens.
- **No magic numbers** in UI or domain. Named constants in `src/config/constants.ts` or CSS variables in `:root`. No raw `800`, `40rem`, `-0.04em` in component files.
- Locale: `fa` → `dir=rtl`, `en` → `dir=ltr`. Cookie `UI.LOCALE_COOKIE`, query `UI.LANG_QUERY`. Default `UI.DEFAULT_LOCALE`.

## Maximum security

- Secrets: AES-GCM at rest (`enc.v1.`), never in logs, OpenAPI, or health.
- Webhooks HTTPS-only; SSRF host blocklist; no credentials in query strings.
- CSRF/origin on mutating storefront; OTP and verify rate-limited harder than catalog.
- SQL only through parameterized connector; reject multi-statement and comment payloads.
- Production: no demo API keys; block loopback/metadata DB hosts; session/settings secrets from env.
- Do not write exploits, malware, or attack tooling.

## Stability

- SQLite/libSQL is the only Drizzle primary. Postgres/MySQL extra connectors use lazy drivers when `DATABASE_ENABLE_REMOTE=yes`.
- `withWriteTransaction` calls connector `begin` (`transaction("write")` / BEGIN IMMEDIATE); Drizzle execute rides that tx.
- Migrations must be idempotent. Do not break existing `file:data/avaluna.sqlite`.
- No live network in `npm test`. Mock adapter HTTP.

## Optimization and clean code

- Prefer small domain functions over god services.
- Coverage thresholds stay high (`vitest.config.ts`). New domain code ships with tests.
- Do not import `client.ts` in unit tests that only need parsers.
- Avoid nested `BEGIN` on the same connection.

## Best practices (always)

- Independent API naming (`/api/services/v1`, `/api/storefront/v1`).
- IRR integers (rials); toman is display; Jalali for merchant-facing dates; `message` English + `message_fa`.
- Report **score** at the end of every agent turn (see rubric). Use the four labels honestly: **God / Excellent / Bad / Ugly**.
- **UI skill (Mantine Core):** [`.agents/skills/mantine-core/SKILL.md`](./.agents/skills/mantine-core/SKILL.md). Landing is RTL/locale-aware (`fa` rtl, `en` ltr, cookie `avaluna_locale`). Do not mix Radix/shadcn. No `style=` (CSP). Jalali stays `formatJalaliIso`, not Mantine `DatePicker`, until a Jalali adapter exists.

### Mantine Core — what each group is good for

Docs: [Get started / @mantine/core](https://mantine.dev/core/package/). Pick **one** group per job; do not stack overlapping widgets.

| Group | Good for | Avaluna fit |
|---|---|---|
| **Layout** AppShell AspectRatio Center Container Flex Grid Group SimpleGrid Space Splitter Stack | Page chrome and alignment. AppShell = merchant desk. Stack = vertical forms. Group = button row. Grid/SimpleGrid = product cards. Splitter = list+detail. Space/Center/Container = spacing, not extra wrappers. | Shop shell, settings columns, checkout column |
| **Inputs** TextInput Textarea NumberInput PasswordInput PinInput MaskInput JsonInput FileInput NativeSelect Checkbox Chip Radio Switch Slider RangeSlider Rating SegmentedControl Fieldset ColorInput ColorPicker AlphaSlider AngleSlider HueSlider Input | Capture **typed data**. Specialized input always beats `Input`. Fieldset groups a settings `group`. | Settings catalog types; rial `NumberInput`; OTP `PinInput`; mobile `MaskInput`; reviews `Rating`; secrets `PasswordInput` |
| **Combobox** Select MultiSelect Autocomplete TagsInput Cascader TreeSelect Combobox ComboboxPopover Pill PillsInput | Choose from **lists**. Select = one id. MultiSelect = many ids. TagsInput = free strings. Autocomplete = suggest, value is free text. Cascader/TreeSelect = categories. Combobox = primitive only. | Categories, tags, PSP list, product search |
| **Buttons** Button ActionIcon CloseButton CopyButton FileButton UnstyledButton | Actions. Button = labeled submit. ActionIcon = icon-only. CopyButton = Sheba/order number. FileButton = `POST /media`. UnstyledButton = custom hit target. | Checkout, copy factor, upload image |
| **Navigation** Anchor Breadcrumbs Burger NavLink Pagination Stepper Tabs Tree TableOfContents | Move between views. Stepper = checkout/setup. Tabs = product sections. Pagination = `X-Total-Pages`. Tree = category admin. Burger+NavLink = AppShell. | Checkout steps, catalog pages, PDP crumbs |
| **Feedback** Alert EmptyState Loader Notification Progress RingProgress SemiCircleProgress Skeleton | State of a **job**, not data entry. EmptyState = zero products. Alert = gateway 503. Skeleton/Loader = fetch. Progress = upload/cron. Notification = toast (needs `@mantine/notifications`). | Empty cart, low stock, verify payment |
| **Overlays** Modal Drawer Dialog Menu Menubar Popover HoverCard Tooltip LoadingOverlay Overlay Affix ActionBar FloatingWindow FloatingIndicator | Temporary UI on top. Modal = confirm refund. Drawer = filters. Menu = row actions. ActionBar = bulk. Tooltip = extra hint only. | Refund confirm, cart drawer, order actions |
| **Data display** Table Card Badge Avatar Image DataList NumberFormatter RollingNumber Timeline Accordion Spoiler Indicator ThemeIcon ColorSwatch BackgroundImage Kbd OverflowList | **Show** records. Table = orders. Card = product. Badge = status. DataList = invoice pairs. NumberFormatter = rial/toman display. Timeline = shipment. Accordion = long legal. | Orders list, PDP, factor, tracking |
| **Typography** Title Text List Code Highlight Mark Table Blockquote Typography | Words. Title = heading. Text = body. Table here is the HTML table styles (same Table as data). Highlight = search q. Typography = CMS HTML. | Landing, legal pages, search hits |
| **Miscellaneous** Box Paper Divider ScrollArea Scroller Portal Collapse Transition FocusTrap Marquee VisuallyHidden | Glue. Box/Paper = surface. Divider = section. ScrollArea = long lists. Portal/FocusTrap = overlays internals. VisuallyHidden = a11y. Marquee = avoid on merchant desk. | Surfaces, a11y, long tables |

---

## Score rubric (0–10)

| Axis | What 10 looks like |
|---|---|
| Security | Secrets, SSRF, CSRF, rate limits, SQL safety, no demo keys in prod |
| Stability | One primary DB, transactions, idempotent migrate, tests without network |
| Completeness | Wired + tested, not sketched |
| Clean code | ≤300 lines, no magic, settings-driven |
| Iran product | IRR, Jalali, RTL, ZarinPal/Kavenegar paths a Tehran merchant can run |

**Overall** = average of axes, rounded to one decimal.

---

## Honest verdict (snapshot)

Do not inflate this. Update numbers when the code actually changes.

| Axis | Score | Label | Why |
|---|---|---|---|
| Security | 9.3 | Excellent | HMAC **requires** a secret argument; settings AES from env or `data/.secrets`. Page CSP: nonce + `strict-dynamic` scripts; style tags nonce; `style-src-attr 'unsafe-inline'` only for Mantine CSS-var attributes (no script). |
| Stability | 8.7 | Excellent | Money writes use connector begin/commit; rollback test. |
| Completeness | 9.1 | Excellent | Shop chrome + home + setup wizard + product-card add + PLP/search; E2E **78/78** (incl. CSP style-attr smoke). |
| Clean code | 9.2 | Excellent | UI copy keys only; hex only in `:root`; named UI constants; files ≤300; price display split from DB service. |
| Iran product | 8.9 | God | Shop is fa RTL / en LTR with cookie `?lang`; IRR + Jalali APIs; toman display on cards. |
| **Overall** | **9.0** | **Excellent** | Multi-language UI keys; no hex/magic in TSX; chrome+home+PLP+product-card+CSP E2E 78/78. |

### God

- Iran-first money and calendar (rial storage, toman display, Jalali Nowruz gold tests).
- Settings as the single control plane.
- Adapter ports: domain never calls `fetch`.

### Excellent

- Multi-PSP + multi-SMS registry, sandbox vs live URLs.
- Secret seal/open/mask; audit on settings PUT.
- Connector URL parser, redaction, dialect registry.
- High vitest coverage on domain + adapters.
- Shop chrome: Digikala-style header/drawer/nav/footer; landing at `/intro`.
- Home `/`: hero, category tiles, deals rail, featured grid, Store+ItemList JSON-LD.

### Bad

- PDP/cart/checkout UI still Phase 7–9 (links 404).

### Ugly

- Shop/merchant UI still not built; landing is the Mantine introduction only.

---

## Every turn, report

End the user-visible reply with:

```
Score: overall X.X/10
Security · Stability · Completeness · Clean · Iran
God / Excellent / Bad / Ugly — one line each if anything changed.
```

If you shipped incomplete work, overall cannot be above 5.
