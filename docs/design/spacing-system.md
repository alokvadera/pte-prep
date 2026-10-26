# PTE Prep Design System — Playful Pop

This is the current visual direction, applied across every route. The interface uses a
**playful colorful pop** language: cream paper ground, indigo ink, candy accents
(purple, green, orange, pink), rounded cards with offset shadows, and deliberate
micro-motion. It is intentionally energetic rather than austere — the product is a
practice tool, not a replica of the sterile test centre.

Every rule below is enforced in code — tokens in the `@theme` block of
**`src/index.css`**, component behaviour in **`src/components/ui/primitives.tsx`**. If
a rule and the code disagree, the code is wrong.

## The four ideas

1. **The rule does the work.** Hairline borders, soft tints, and offset shadows create
   separation. Cards lift on hover, bands alternate tint, and accent colors carry
   semantic roles rather than decoration.
2. **Purple means a mark was made.** The mark ramp is purple (`mark-500`) and it has
   a defined job: focus rings, eyebrows, links, and hover states. Lost points use the
   rose ramp. Purple is never used as warmth or as decoration.
3. **The display serif is for quantities.** Baloo 2 is the display face — rounded, heavy,
   a little playful. It carries every heading and large figure. Nunito is the interface
   voice for body copy, labels, and controls. IBM Plex Mono is for machine identifiers.
4. **Plain English in the interface.** The nav says Progress, not Telemetry. A conflict
   says what conflicts, not a bracketed system code. Nothing in the product claims an
   engine, a revision number, or a precision it does not have.

## Colour

The palette is cream ground, indigo ink, and four candy accents. Two tiers per family
so every contrast pair holds: a DARK step for text and meaningful marks (>= 4.5:1 on
cream/paper) and a BRIGHT step for fills and decoration (>= 3:1 where audited).

| Role | Token | Light value | Dark value | Means |
|---|---|---|---|---|
| Paper | `ink-50` | #fff8ec | — | the cream page ground |
| Recessed | `ink-100` | #f1ecff | — | tinted band grounds, card interiors |
| Rule | `ink-200` | #e0daf4 | rgb(255 255 255 / 0.1) | every hairline and border |
| Rule, strong | `ink-300` | #c2bae4 | — | rules and disabled marks only — never body text |
| Secondary text | `ink-500` | #6b6398 | — | the quiet half of a sentence |
| Primary text | `ink-900` | #10111e | #0a0b14 | ink |
| Action | `brand-500` | #5b54a8 | — | indigo fills, section icons |
| **The mark** | `mark-500` / `mark-600` | #8b5cf6 / #6d3fe0 | #b19afc / #6d3fe0 | focus rings, eyebrows, links, hover |
| Held / correct | `mint-500` / `mint-700` | #3cc85e / #124a32 | — | confirmed correct, positive |
| Caution | `amber-500` | #8f6110 | — | partial, warnings |
| Lost point | `rose-500` / `rose-brand` | #ff7eb6 / #de4a8e | — | incorrect answers, losses |

Dark mode uses the same roles against `ink-950` (#0a0b14) and `ink-900` (#10111e).
The three `ink-on-dark` steps are re-derived for the dark grounds because one grey
cannot clear 4.5:1 on both white and near-black.

`ink-300` and `ink-400` are **not** text colours on a light ground. Using them for body
copy is the exact failure that shipped a 2.32:1 footer separator. The rendered audit
in `scripts/contrast-render.mjs` catches this.

### Accent usage

The four candy accents are **role-based, not decorative**:

- **mint-500** — primary CTA buttons, correct answers, confirmed states
- **mark-500 (purple)** — focus rings, links, hover states, section eyebrows
- **amber-500** — partial credit, warnings, caution states
- **rose-500** — incorrect answers, errors, deletions

Above the fold on the Home page, these accents are used **semantically**, not
arbitrarily. The primary CTA is always `mint-500`; links and focus states use
`mark-500`; section icons and stat dots use the accent to encode meaning, not to
decorate.

## Type

Three faces, self-hosted, each with one job.

| Face | Utility | Used for |
|---|---|---|
| Baloo 2 | `font-display` | every heading and large figure |
| Nunito | `font-sans` | body copy, labels, controls, buttons |
| IBM Plex Mono | `font-mono` | machine identifiers: timer, item code, count |

Baloo 2 is declared across `font-weight: 400 800` so 400–800 all resolve from one
variable file instead of asking the browser for a synthetic bold. IBM Plex Mono ships
two `@font-face` blocks — Regular (400) and Bold (500–700) — so bold mono has a real
cut.

| Role | Utility | Spec |
|---|---|---|
| Hero | `hero-title` | clamp(2.125rem, 6.2vw, 4rem), Baloo 2, extrabold, tight tracking, capped at 640px |
| Page title (H1) | `page-title` | 3xl → 4xl, Baloo 2, extrabold |
| Section title (H2) | `section-title` | clamp(28px, 4.2vw, 46px), Baloo 2, extrabold |
| Card title (H3) | `CardTitle` | text-lg, Baloo 2, extrabold |
| Body | `passage` | Nunito, base, 1.75 leading |
| Label | `page-heading-kicker`, `section-eyebrow` | 13.5px, Nunito, extrabold, uppercase, mint-700 |
| Micro | `text-micro` | 12px |
| Figure | `figure` | Baloo 2, tabular-nums, ink-900 |

Body measure is 60–76ch. Headings use `text-balance` to avoid orphans.

## Spacing and shape

Tailwind steps on the 4px grid: 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20. Card grids use
`gap-6`, related blocks `mt-8` or `mt-12`, major sections `py-16` or `py-20`.

Radius is **playful, not razor-sharp**:

| Token | Value | Used for |
|---|---|---|
| `radius-sm` | 6px | form fields, small chips, focus ring |
| `radius-md` | 12px | panels, toggles, small surfaces |
| `radius-lg` | 16px | — |
| `radius-xl` | 20px | — |
| `radius-2xl` | 24px | cards (the house curve) |
| `radius-3xl` | 28px | — |
| `radius-4xl` | 32px | — |

Buttons and pills go fully round (`rounded-full` / `9999px`). This is the one place
square corners are refused — interactive triggers are soft, surfaces are rounded.

## Page shells

Consistent gutter scale everywhere — `px-4 sm:px-6 lg:px-8` — so content never jumps
sideways between routes.

| Shell | Measure | Use |
|---|---|---|
| `page-shell-prose` | 3xl (768px) | About, Privacy, question-type detail |
| `page-shell-content` | 4xl (896px) | Guide, Test format, Scoring guide |
| `page-shell-app` | 6xl (1152px) | Mock setup, Practice, Dashboard, Result |
| `page-shell-wide` | 1180px | Home sections, header, footer |
| `page-shell-empty` | xl, centred | 404 and recovery screens |

Section headings are left-aligned everywhere. Centre alignment belongs to the Home
hero, the CtaBand, and empty states only.

## Composition: bands and cards

The landing page uses full-bleed tinted bands — alternating `band` (mint-50 wash) and
`band-plain` (lavender wash) — each with a big 48px rounded-top corner that reads as a
sheet sliding over the cream ground. Content inside each band lives on the
`page-shell-wide` gutter, so the band re-groups a page without moving elements
sideways.

The one structural device is the **ledger**: a narrow margin column beside a body
column. But for landing sections, the section head (eyebrow pill + title + intro) is
stacked, not laid out as a ledger. Cards (`card`, `card-solid`, `card-exam`) carry the
house `rounded-2xl` radius, a `border-2` hairline, and a `box-shadow` offset that
grows on hover (the playful signature).

Cards are not nested. A card contains its content directly; hierarchy inside a card
uses spacing, type scale, and dividers.

## Components

All in **`src/components/ui/primitives.tsx`**.

### Buttons

A single component for every button-shaped control. Variants own colour; sizes own
padding and font size — call sites never hand-write padding.

| Variant | Colour | Use |
|---|---|---|
| `btn-primary` | mint-500, indigo text | one primary action per context |
| `btn-secondary` | white, ink border | secondary actions, back |
| `btn-ghost` | transparent | tertiary, icon-only |
| `btn-danger` | transparent, rose border | destructive (always confirmed) |

Sizes: `sm` (tight, 12px), `md` (default, 14px), `lg` (hero, 16px).

Buttons are **fully round pills** with an offset solid shadow that grows on hover and
collapses on press. The shadow is a hard indigo (`rgb(45 42 94 / 0.12)`), not blur —
the playful signature. `translate: 0 -2px` on hover, `translate: 0 5px` on active.
Never a scale transform — the tap target is identical before and after.

One primary action per context: `btn-primary` is the only variant that draws the eye.
`magnetic` prop wraps a primary CTA in the `Magnetic` tilt component for a premium
hover feel — used sparingly (one per page).

### Surfaces

| Variant | Treatment | Use |
|---|---|---|
| `card` | `rounded-2xl`, `border-2`, `bg-white`, `shadow-card` | contained units, lifts on hover |
| `card-solid` | same but no hover lift | dense or interactive panels |
| `card-exam` | `card` + 3px `mark-600` top rule | section summaries in the test runner |

### Other primitives

- **Badge** — 5 tones (neutral, brand, mint, amber, rose), role-based
- **Toggle** — switch input in `sr-only`, custom visual track, focus ring via `:focus-visible`
- **ProgressBar** — `role="progressbar"`, animated bar reveal
- **Accordion / Disclosure** — native `<details>`/`<summary>`, chevron rotates 45° to cross
- **Callout** — tinted panel, 4 tones by role (brand=guidance, mint=confirmed, amber=caution, rose=correction)
- **CtaBand** — full-width closing band, inverts button colors (primary → orange on green)

## Section furniture

| Utility | Use |
|---|---|
| `band`, `band-plain`, `band-flush` | wide tinted fields separating groups of sections |
| `section-eyebrow`, `page-heading-kicker` | quiet pill above a section title, in mint-700 |
| `pill-green`, `pill-orange`, `pill-purple`, `pill-plain` | eyebrow pills, one per band tone |
| `callout`, `callout-rule`, tones | the one tinted panel per page states the thing to remember |
| `key-figure` | a measured value in Baloo 2 with tabular-nums |
| `num-marker`, `chip` | the square/circle carrying a step or index number |
| `tick-list`, `tick-item` | a list marked by a small filled dot |
| `table-data` | the one data-table treatment |
| `link-inline`, `link-card` | prose links (turn mark-600 on hover) and whole-row links |
| `figure` | a measured value in the display serif |
| `bg-ruled` | the ruled ground behind the hero — rules, not a colour wash |

## Score graphics

**`src/components/ui/ScoreScale.tsx`** draws the PTE 10 to 90 scale: a ruled axis with
landmarks at 10, 30, 50, 65, 79, and 90, a value drawn in ink and a marker in the mark
color (purple). It is a data graphic and carries a text alternative.

**`src/components/charts/ScoreRangeBar.tsx`** renders the same scale as a linear range bar
with band boundaries drawn on the track, a sensitivity rail, and an `sr-only` textual
description of in-band position. Avoids the donut-chart anti-pattern.

## Motion

Playful but purposeful. One curve for anything the user operates — `ease-settle` — so a
hover, a press, and a panel read as one material. Entrances are driven by
`IntersectionObserver` in **`src/components/ui/motion.tsx`** and `TaglineReveal`, never a
scroll listener.

| Curve | Token | Use |
|---|---|---|
| `--ease-settle` | `cubic-bezier(0.32, 0.72, 0, 1)` | interactive transitions (hover, press) |
| `--ease-glide` | `cubic-bezier(0.16, 1, 0.3, 1)` | entrances, drawer slide |
| `--ease-spring` | `cubic-bezier(0.2, 0.95, 0.3, 1.06)` | modal pop, badge pop |
| `--ease-out-expo` | `cubic-bezier(0.19, 1, 0.22, 1)` | chart draws, value reveals |
| `--ease-in-out-quart` | `cubic-bezier(0.76, 0, 0.24, 1)` | shimmer, pulse |

Under `prefers-reduced-motion`: the blanket CSS reset in `@layer base` neutralises all
animations and transitions; components (`Reveal`, `CountUp`, `Tilt`, `Magnetic`,
`PointerField`) check `prefersReducedMotion()` before arming. The server-rendered markup
is always the resolved state, so a crawler or no-JS visitor sees the complete page.

**Motion primitives:**

- **Reveal** — settles children in as they scroll into view. `up`, `down`, `left`, `right`, `scale`, `fade`, `blur-up` variants. Staggered via `delay` prop.
- **CountUp** — rolls from zero to its value the first time seen. Renders full on server; animation only after observer fires. Handles value changes with a smooth glide.
- **Tilt** — 3D lean + glare that tracks the pointer. Disabled under `prefers-reduced-motion` and on coarse pointers. Per-frame work is two `setProperty` calls; React never re-renders.
- **Magnetic** — premium hover lean on primary CTAs only. Falls off with distance. One or two per page is enough — overuse reads as noise.
- **PointerField** — children drift toward the cursor as it nears. Used only on the 22-card question-type grid where it helps scanning.
- **ConfettiBurst** — one-shot celebration for personal bests on the Dashboard.

**Decorative accents** (used sparingly): AuroraBackground (three slow-drifting blurred blobs),
SectionDivider (the one gradient device — a short hairline with a slow
travelling light, marking a section boundary), ShimmerButton (periodic light
sweep), StickyCTA (spring slide-up on scroll). Text and borders are solid
colour everywhere else, so a gradient on the page means "section boundary"
and nothing else. GradientText, GradientBorder and BorderBeam were pruned
for carrying four competing gradient devices at once.

## Verification

- `node scripts/contrast.mjs` — 78 documented token pairs at WCAG 1.4.3 / 1.4.11.
- `node scripts/contrast-render.mjs` — walks the rendered DOM, composites translucent surfaces, fails any text node under its threshold.
- `node scripts/smoke.ts` — engine checks, including published rules from the Pearson Score Guide.
- `node scripts/browser-check.mjs` — hydration, metadata, and a full mock in headless Chrome.
