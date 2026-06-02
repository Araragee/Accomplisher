# DESIGN.md — CBS DO IT

Soft Sage / Spa Calm. Light-first, with a warm dusk dark variant. Restrained color: sage-tinted neutrals carry the surface, one terracotta accent for actions and current state only. Flat. Hairline borders. No glow, no glass, no neon.

Tokens live as CSS custom properties in `src/index.css` (`:root` for light, `.dark` for dark) and are exposed to Tailwind v4 via `@theme`. Use the semantic utility names below, never raw hex.

## Color (OKLCH)

Neutrals are tinted toward sage (hue ~150) at very low chroma so the surface never reads as cold gray or pure white. Accent is muted terracotta (hue ~52). Never `#fff` / `#000`.

### Light (default)

| Token | Utility | OKLCH | Role |
|---|---|---|---|
| canvas | `bg-canvas` | 0.965 0.008 150 | app background (sage off-white) |
| surface | `bg-surface` | 0.987 0.006 150 | content cards, inputs |
| panel | `bg-panel` | 0.945 0.009 150 | sidebar, toolbars (deeper second neutral) |
| raised | `bg-raised` | 0.995 0.004 150 | popovers, modals |
| ink | `text-ink` | 0.32 0.014 150 | primary text |
| muted | `text-muted` | 0.52 0.012 150 | secondary text |
| subtle | `text-subtle` | 0.63 0.010 150 | labels, meta |
| faint | `text-faint` | 0.72 0.008 150 | placeholder, disabled |
| line | `border-line` | 0.90 0.008 150 | default hairline border |
| line-strong | `border-line-strong` | 0.83 0.010 150 | emphasized divider, focus border |
| accent | `bg/text-accent` | 0.64 0.115 52 | primary action, current selection |
| accent-hover | | 0.59 0.120 50 | accent hover |
| accent-active | | 0.55 0.120 48 | accent pressed |
| accent-soft | `bg-accent-soft` | 0.93 0.035 55 | selected/active tint, accent chips |
| on-accent | `text-on-accent` | 0.985 0.012 80 | text on terracotta |
| sage | `text/bg-sage` | 0.62 0.070 150 | positive / on-track / progress |
| sage-soft | `bg-sage-soft` | 0.93 0.030 150 | positive tint |
| warn | | 0.74 0.100 75 | warning / behind |
| warn-soft | | 0.94 0.040 80 | warning tint |
| danger | | 0.56 0.110 28 | destructive (muted clay-red, not bright) |
| danger-soft | | 0.93 0.035 30 | destructive tint |

### Dark (warm dusk, `.dark`)

Warm charcoal (hue ~70), never navy. Accent brightened slightly. Soft shadows, not glows.

canvas 0.20 0.008 70 · surface 0.24 0.008 70 · panel 0.175 0.008 70 · raised 0.27 0.009 70 · ink 0.92 0.012 80 · muted 0.74 0.012 80 · subtle 0.62 0.010 80 · faint 0.50 0.010 80 · line 0.31 0.008 70 · line-strong 0.40 0.010 70 · accent 0.70 0.110 52 · accent-hover 0.75 0.110 54 · accent-soft 0.30 0.040 50 · on-accent 0.20 0.020 60 · sage 0.72 0.070 150 · sage-soft 0.30 0.030 150 · warn 0.78 0.100 80 · danger 0.64 0.110 30.

## Typography

Inter only (system sans fallback). Codes (IPCR-B-004, dates) use a tabular/mono treatment via `font-mono` (ui-monospace stack) and `tabular-nums`. No display font, no gradient text.

- Scale (rem, ratio ~1.2): use Tailwind sizes. Body `text-[0.9375rem]` (15px) for calm reading. Page title `text-2xl`/`text-3xl` weight 600. Section heading `text-base`/`text-lg` weight 600. Labels `text-xs` weight 500, `text-subtle`, normal case (avoid shouty all-caps; light tracking only where needed).
- Weights: 400 body, 500 labels/buttons, 600 headings/numbers. No 700/800/900 (the old build's `font-black` is banned, too loud for calm).
- Numbers: `tabular-nums`, weight 500 to 600. Never a giant hero metric.

## Shape, elevation, spacing

- Radius: cards/inputs `rounded-xl` (~14px), buttons `rounded-lg` (~10px), chips/pills `rounded-full`. Soft, not pill-everything.
- Borders carry separation, not shadows. `border border-line` on surfaces. Shadows reserved for true overlays (modal, popover): `shadow-soft` = `0 1px 2px oklch(0.3 0.02 150 / 0.06), 0 8px 24px oklch(0.3 0.02 150 / 0.08)`.
- Spacing rhythm varies: page padding generous (`p-8`/`p-10`), card padding `p-5`/`p-6`, dense rows `py-3`. Whitespace is the calm. Avoid uniform padding everywhere.
- Max content width for reading columns ~`max-w-3xl`; tables may run wider.

## Components

Consistent vocabulary across all screens (product register). Every interactive element ships default / hover / focus-visible / active / disabled, plus loading where it acts.

- **Button**: variants `primary` (bg-accent, text-on-accent), `secondary` (bg-surface, border-line, text-ink), `ghost` (transparent, hover bg-accent-soft/panel), `danger` (text-danger, hover danger-soft). Sizes sm/md. `rounded-lg`, weight 500, transition 150ms.
- **Card**: `bg-surface border border-line rounded-xl`. No nested cards. No left-stripe accents (banned).
- **Input / Select / Textarea**: `bg-surface border border-line rounded-lg`, focus `border-line-strong` + 2px accent ring at low alpha.
- **Badge / chip**: small, `rounded-full`, soft tint backgrounds (accent-soft, sage-soft, warn-soft) with matching text. Category dots are a single small filled circle, no glow.
- **Progress**: thin track `bg-line`, fill `bg-sage` when on track, `bg-warn` when behind, `bg-accent` for neutral/selected. Height ~6px, rounded-full. No glow.
- **Segmented control**: for cutoff A/B/Custom and module switches. Selected segment `bg-surface` raised on a `bg-panel` track (light) with subtle border.
- **Empty state**: a calm line of guidance that teaches the next action, not "nothing here." Optional faint icon.
- **Modal / ConfirmDialog**: `bg-raised shadow-soft`, dimmed `bg-ink/30` backdrop (no blur). Used sparingly; prefer inline.
- **Toast**: bottom, `bg-raised border border-line shadow-soft`, auto-dismiss, for save/sync feedback.

## Motion

150 to 220ms, ease-out. Color/opacity/transform only, never layout properties. Motion signals state (saved, selected, added), never decoration. No page-load choreography, no spinners mid-content (use skeletons or quiet inline text).

## Bans (project-specific, on top of skill bans)

No glassmorphism, no `emerald-glow`/box-shadow glows, no gradient blobs, no `font-black`, no all-caps shouting labels, no left-border accent stripes, no hero metric, no em dashes in copy, no "AI is analyzing" theatrics. The Thinker labels itself plainly (suggestions based on your targets and recent work).
