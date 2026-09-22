# Avaluna UI

One landing page until Mantine is installed. Persian first, RTL. Type is Estedad. Color is ink on canvas.

**Component skill:** [`.agents/skills/mantine-core/SKILL.md`](./.agents/skills/mantine-core/SKILL.md) — every field uses the matching `@mantine/core` component.

## Tokens

## Tokens

| Token | Value | Use |
|---|---|---|
| `--ink` | `#1d1d1f` | Text, dark bands |
| `--body` | `#6e6e73` | Secondary copy |
| `--canvas` | `#f5f5f7` | Page background |
| `--canvas-soft` | `#ffffff` | Light band |
| `--on-dark` | `#f5f5f7` | Text on ink |
| `--brand` | `#0071e3` | Text links only |
| `--font-ui` | Estedad, Tahoma, sans-serif | All type |
| `--type-display` | `clamp(2.75rem, 8vw, 6rem)` | Landing title |
| `--type-body` | `1.125rem` | Body |
| `--page-max` | `40rem` | Column |
| `--gutter` | `2rem` | Page padding |
| `--space` | `1.5rem` | Stack gap |

## Rules

- `html[lang=fa][dir=rtl]`.
- One column, centered. No nav, no cards, no pills, no shadows.
- Weight 800 on the title, 400 on body. Tracking `-0.04em` on the title.
- Motion: none.
- No inline `style=`. No Tailwind. Tokens live in `globals.css`.
