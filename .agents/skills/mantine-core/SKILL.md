# Skill: Mantine Core — pick the right component for data

**Groups (what they are good for)** — see also AGENTS.md:

- **Layout** — structure the page (AppShell, Stack, Group, Grid), not widgets.
- **Inputs** — capture one value (string, number, bool, file, color, pin).
- **Combobox** — pick from options / trees / tags.
- **Buttons** — trigger an action (submit, copy, upload, icon).
- **Navigation** — change place (tabs, steps, pages, tree, crumbs).
- **Feedback** — loading, empty, error, progress, toast.
- **Overlays** — temporary layers (modal, drawer, menu, tooltip).
- **Data display** — render records (table, card, badge, money, timeline).
- **Typography** — headings, body, lists, highlight.
- **Miscellaneous** — paper, scroll, portal, a11y glue.

Source: [@mantine/core](https://mantine.dev/core/package/) (v9). Docs index: [mantine.dev/llms.txt](https://mantine.dev/llms.txt).

Use this skill whenever Avaluna UI is built. **Do not invent custom inputs** when a Core (or Dates) component already fits the data. Import from `@mantine/core` unless noted.

Packages: `@mantine/core` + `@mantine/hooks` required. Forms: `@mantine/form`. Jalali **display** is domain (`formatJalaliIso`); do not use `@mantine/dates` DatePicker as if it were Jalali unless a Jalali adapter is wired.

RTL: wrap the app in `MantineProvider` with `dir="rtl"` (html already `lang=fa` `dir=rtl`).

All inputs: `size="md"`, `radius="md"`, label in Persian, `error` from `message_fa`. Bind with `useForm` `getInputProps`.

---

## Data → component (must match)

| Data / setting type | Component | Do not use |
|---|---|---|
| Short string (`store_name`, SKU, slug, email) | `TextInput` | raw `Input` (no label/a11y) |
| Long text (description, note, address) | `Textarea` `autosize` | `TextInput` |
| Secret (`zarinpal_merchant_id`, API keys) | `PasswordInput` | `TextInput` |
| JSON blob (`downloads_json`, tiers) | `JsonInput` | `Textarea` of JSON |
| Boolean setting (`cod_enabled`, `sandbox`) | `Switch` | `Checkbox` for store knobs; `Checkbox` only for multi-select lists |
| One of a small closed set (2–5, e.g. currency_unit toman/rial) | `SegmentedControl` | `Select` |
| One of a long list (PSP, SMS provider, carrier) | `Select` (`searchable`) | `NativeSelect` unless native UX required |
| Native HTML only / tiny lists | `NativeSelect` | searchable `Select` |
| Many values from a list (categories, tags) | `MultiSelect` | repeating `Select` |
| Free tags the user types | `TagsInput` | `MultiSelect` of invented options |
| Hierarchical path (category tree) | `Cascader` or `TreeSelect` | nested `Select`s |
| Integer rial / quantity / VAT bps | `NumberInput` (`thousandSeparator`, `allowDecimal={false}` for rial) | `TextInput` + `parseInt` |
| Display money (rial/toman, not an editor) | `NumberFormatter` + domain `moneyPayload` | concatenating strings |
| Animated KPI | `RollingNumber` | CSS hacks |
| Angle / hue / alpha (theme tools) | `AngleSlider` / `HueSlider` / `AlphaSlider` | `Slider` 0–360 unlabeled |
| Range (price facet min–max) | `RangeSlider` | two `NumberInput` only (pair them if exact) |
| Single continuum (weight) | `Slider` | |
| Color token | `ColorInput` / `ColorPicker` | hex `TextInput` |
| Files (product images → `POST /media`) | `FileInput` or `FileButton`; drag-drop: `@mantine/dropzone` | hidden `<input type=file>` |
| OTP / PIN | `PinInput` | 6× `TextInput` |
| Iran mobile `09…` | `MaskInput` | unmasked `TextInput` |
| Password login | `PasswordInput` | |
| Rating 1–5 (`reviews.rating`) | `Rating` | `Select` of 1–5 |
| Chip filters (in-stock, on-sale) | `Chip.Group` | random `Button`s |
| Exclusive radio (order status filter) | `Radio.Group` | |
| Form section (legal vs payments) | `Fieldset` | extra `Title` only |

---

## Records / lists / commerce screens

| Need | Component |
|---|---|
| Order/product rows | `Table` + `Pagination` (`usePagination`) |
| Label–value (invoice Sheba, tax, number) | `DataList` |
| Empty catalog / no orders | `EmptyState` |
| Tree (categories, kits) | `Tree` |
| Timeline (fulfillment, tracking) | `Timeline` |
| Wizard (setup locale → payments) | `Stepper` |
| Tabs (catalog / inventory / SEO) | `Tabs` |
| Accordion (FAQ, long settings groups) | `Accordion` |
| Bulk row actions | `ActionBar` + `useSelection` |
| Overflow tags | `OverflowList` / `Pill` / `PillsInput` |
| Card of a product | `Card` + `Image` + `Badge` |
| Avatar of customer | `Avatar` |
| Status pill (order status) | `Badge` |
| Copy order number / Sheba | `CopyButton` |
| Progress (upload, cron) | `Progress` / `RingProgress` / `SemiCircleProgress` |
| Loading table | `Skeleton` or `LoadingOverlay` / `Loader` |
| Search highlight | `Highlight` |
| Breadcrumb PDP | `Breadcrumbs` |
| Nav | `AppShell` + `NavLink` + `Burger` |
| Command palette | `@mantine/spotlight` (not Core) |
| Dates (Gregorian only) | `@mantine/dates` `DateInput` / `DatePicker` |
| Jalali shown to merchant | `Text` + `formatJalaliIso` |

---

## Layout / chrome (not data, but required)

`Box` (base), `Container`, `Group` (row), `Stack` (column), `Flex`, `Grid`, `SimpleGrid`, `Center`, `Space`, `Divider`, `Paper`, `ScrollArea`, `Scroller`, `Splitter`, `AppShell`, `AspectRatio`, `Overlay`, `Portal`, `Affix`, `FloatingWindow`, `Menu` / `Menubar`, `Modal`, `Drawer`, `Dialog`, `Popover`, `HoverCard`, `Tooltip`, `Notification` (+ `@mantine/notifications`), `Alert`, `Anchor`, `Button` / `ActionIcon` / `CloseButton` / `UnstyledButton`, `Title`, `Text`, `List`, `Code`, `Kbd`, `Blockquote`, `Mark`, `Typography`, `ThemeIcon`, `Indicator`, `VisuallyHidden`, `Collapse`, `Spoiler`, `Transition`, `FocusTrap`, `FloatingIndicator`, `Marquee`, `TableOfContents`, `BackgroundImage`, `Combobox` (primitive for custom selects), `ComboboxPopover`, `Input` (primitive only).

---

## Avaluna API mapping (examples)

- `GET /products` → `Table` or `SimpleGrid` of `Card`; empty → `EmptyState`
- `regular_price` / `totalCents` **edit** → `NumberInput`; **show** → `NumberFormatter`
- `stock_quantity` → `NumberInput` min 0; low stock → `Badge` color red + `Alert`
- `status` order → `Badge` + `Select` to PATCH
- `reviews.rating` → `Rating`; moderate → `SegmentedControl` pending/approved/rejected
- `POST /media` → `FileButton` / Dropzone then `Image` `src=/api/storefront/v1/media/:id`
- OTP `POST /auth/otp` → `MaskInput` mobile + `PinInput` code
- Settings `type: boolean` → `Switch`; `secret` → `PasswordInput`; `number` → `NumberInput`; `select` → `Select`/`SegmentedControl`; `text` → `TextInput`
- Checkout steps → `Stepper`
- Cart lines → `Table`; quantity → `NumberInput`
- Legal Enamad codes → `TextInput` + `CopyButton`

---

## Hard rules

1. Never use `Input` alone for a labeled field — use `TextInput` / specialized input.
2. Never put rial amounts in `TextInput`.
3. Never use `Select` for yes/no — `Switch`.
4. Never use `DatePicker` for Jalali merchant dates until a Jalali adapter exists.
5. `style=` is forbidden (CSP `style-src-attr 'none'`). Use Mantine props / CSS modules / theme.
6. Components are `'use client'`. Keep data fetching in server modules; pass JSON into client islands.
7. Do not add Radix/shadcn/Tailwind form kits alongside Mantine.
8. Labels/placeholders from `uiCopy(locale, key)` only — no string literals in TSX.
9. No hex in TS; theme uses `var(--font-ui)` and CSS tokens.
10. No magic numbers in components — `constants.ts` or CSS variables.

Docs per component: `https://mantine.dev/core/{kebab-name}/` (e.g. `text-input`, `number-formatter`).
