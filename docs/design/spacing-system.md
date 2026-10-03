# PTE Prep Design System v3

This system applies across every route. The public pages, setup screens,
dashboard, test runner and score report use different layouts because they ask
people to do different things; shared tokens and controls make them feel like
one product.

Every rule below is enforced in code: tokens in the `@theme` block of
`src/index.css`, layout in the `page-shell-*` utilities, and the component
behaviours in `src/components/ui/primitives.tsx`. If a rule and the code
disagree, the code is wrong.

## Design tokens

### Colour

| Role | Token | Value |
| --- | --- | --- |
| Page ground | `ink-50` | `#ffffff` |
| Raised surface | `ink-100` | `#f6f8fb` |
| Primary text | `ink-900` | `#171b20` |
| Secondary text | `ink-500` | `#606b7a` |
| Action and selected state | `brand-500` | `#1756b0` |
| Light accent (dark mode) | `brand-300` | `#79b7ff` |
| Positive signal | `mint-500` | `#2a6b50` |
| Caution signal | `amber-500` | `#9c4a24` |
| Error signal | `rose-brand` | `#8c3a3a` |

Dark mode uses the same roles against slate `ink-900`. Blue is reserved for
navigation, selections and primary actions; sky blue (`brand-300`) is a light
accent for focus and illustration. Mint, amber and rose communicate result
states — never decoration. The landing-page product preview is written against
the same tokens (see "Product preview" below).

Type roles: **Instrument Sans** for headings, passages, controls and body copy;
**IBM Plex Mono** for scores, durations, scales and short identifiers.

### Typography scale

Four roles. Nothing outside the marketing hero may exceed `text-4xl`.

| Role | Utility | Spec | Use |
| --- | --- | --- | --- |
| Hero | `hero-title` | text-5xl→6xl, bold, leading 1.05 | Home only |
| Page title (H1) | `page-title` | text-4xl, bold, leading-tight | every route's single H1 |
| Section title (H2) | `section-title` | text-2xl, bold, leading-tight | all section headers |
| Card title (H3) | `<CardTitle>` | text-lg, bold, leading-tight | headings inside cards |

Body copy is `text-base leading-relaxed` (passages use the `passage`
utility); meta and captions are `text-sm` / `text-xs`; micro labels use the
12px `text-micro` mono token. Weights are fixed: **bold** for H1–H3,
**semibold** for buttons and emphasis, **normal** for body.

### Spacing scale

Tailwind steps on the 4px grid: `1, 2, 3, 4, 5, 6, 8, 10, 12,
16, 20` (4px – 80px), plus `.5` micro-steps (`1.5, 2.5, 3.5`) only for
control internals that cannot land on the grid without breaking the 24px tap
floor: `Button sm` (`px-3.5 py-1.5`), `field` (`px-3.5 py-2.5`), toggle knob
offsets. Rhythm never uses arbitrary values (`mt-[74px]`). Rhythm rules:

- `mt-3` description under a title, `mt-4`–`mt-6` directly related grid,
  `mt-8`/`mt-12` grouped block, `mt-16`/`mt-20` between major sections.
- Grid gaps: `gap-4` card grids, `gap-6` major splits, `gap-2` compact labels.

### Page shells

One gutter scale everywhere — `px-4 sm:px-6 lg:px-8` — so the
content never jumps sideways between routes; only the measure changes.
Always used through `<PageWrapper>` or the raw utility:

| Shell | Measure | Use |
| --- | --- | --- |
| `page-shell-prose` | 3xl (768px) | Longform reference pages (About, Privacy, question-type detail) |
| `page-shell-content` | 4xl (896px) | Informational content (Guide, Test format, Scoring guide) |
| `page-shell-app` | 5xl (1024px) | Interactive workflows (Mock setup, Practice, Dashboard, Result) |
| `page-shell-wide` | 5xl (1024px) | Home sections, test runner header/footer, site header and footer |
| `page-shell-empty` | xl, centred | 404 and recovery screens |

## Components

All live in `src/components/ui/primitives.tsx`.

### Button

`<Button>`, `<ButtonLink>` (react-router), `<ButtonAnchor>` (external).
Variants: `primary` (filled blue, one per context), `secondary` (outlined),
`ghost` (text-only), `danger` (destructive). Sizes: `sm` (px-3.5 py-1.5
text-xs), `md` (px-5 py-2.5 text-sm, default), `lg` (px-7 py-3 text-base) —
call sites never hand-write padding. The underlying `btn-*` utilities keep an
md default size so a bare `btn-secondary` stays valid where a component import
would be awkward.

### Card

`<Card>` with `variant="default" | "solid" | "exam"` and `flush` to drop
padding for tables. `<CardTitle>` is the only card heading style. Heading H2s
inside full-width data sections use `section-title` instead.

### Accordion / Disclosure

`<Accordion items={...}>` for FAQ pairs; `<Disclosure summary={...}>` for any
other collapsible content (drill reference table, practice settings). Both use
native `details`/`summary`, the shared rotating plus marker, and the same
expanded-state divider. No other accordion pattern is allowed.

### PageWrapper

`<PageWrapper size="prose|content|app">` renders the shell, breadcrumbs, and
the standard `PageHeading` (eyebrow → H1 → intro, optional actions) in one
place, so the top of every route lines up pixel-for-pixel.

### Page alignment

Section headers are **left-aligned on every interior page**. Centre alignment
belongs to the Home hero, the CtaBand, and empty states only.

### Shape

Pills for controls, squares for surfaces. `rounded-full` belongs to buttons,
nav pills, toggles, progress tracks, dots and avatars. Cards, fields and
disclosures use `sm/md/lg` (3/4/7px) so a surface never mimics a control.
`card-interactive` is the only hover-lift pattern on a card; `CtaBand` keeps its
`rounded-xl + border-t-4` as the single closing-CTA exception.

### Section furniture

The vocabulary a long page uses to break itself into parts. Every one of these
replaces a pattern that was previously hand-written per route at slightly
different values — two callout tints that were nearly the same colour, three
numbered markers at three sizes, one band on Home and none on any interior page.

| Utility / component | Use |
| --- | --- |
| `SectionBand` (`band`, `band-plain`) | A wide field separating groups of sections. Inside a page shell the band cancels the shell's gutters and restores them as its own padding, so its ground spans the shell while its content stays in the measure. `band-flush` / `band-flush-plain` are the same grounds for a route that is not inside a shell. |
| `SectionHeading` | The one section header: `section-eyebrow` kicker, `section-title` H2, optional description and action. Carries `id` so a section heading can still be an anchor target. |
| `section-eyebrow` | The mono kicker with its leading hairline. Used standalone where a section header is not appropriate. |
| `Callout` (`callout`, tones, `callout-rule`) | The one tinted panel per page that states the thing to remember. `rule` swaps the full border for a single left rule when the note sits inside another surface. |
| `KeyFigure` (`key-figure-*`) | The number a section exists to state, in the mono data voice with its own left rule. |
| `NumMarker` (`num-marker`) | The square carrying a step, rank or index digit. |
| `TickList` (`tick-item`) | A list marked by a small filled dot. Replaces ad-hoc bullet lists. |
| `table-data` | The one data-table treatment: header voice, cell padding, row rules. Call sites keep only the semantic classes (`tabular-nums`, `font-semibold`, `text-right`). The table inside a Fill in the Blanks passage is question content, not a data table, and does not use it. |
| `link-inline` / `link-card` | The two link families. `link-inline` is a prose link (underlined, brand ink, with a hover); `link-card` is a card title whose whole row is the target. Roughly twenty inline class strings previously split between `brand-300` and `brand-400` for dark mode. |

Callout tones are roles rather than decoration: brand for guidance, mint for a
confirmed good result, amber for caution, rose for the mistake being corrected.
Only one band ground and one tinted callout tone per group — the point of naming
them was to stop a fourth variant appearing.

Colour is checked twice, at two different levels. `scripts/contrast.mjs` scores
the token pairs statically. `scripts/contrast-render.mjs` (`npm run
contrast:render`, part of `verify:full`) loads every prerendered route in both
themes, walks the rendered text, composites each foreground through the alpha
chain of surfaces behind it and scores the result against 1.4.3 and 1.4.11. Both
are needed: the rendered pass is what caught a breadcrumb separator at 1.59:1 on
the light ground while the same ink was perfectly legible in dark, and it is the
only check that sees text sitting on a translucent band.

Bands are used on the routed content pages. The app screens (dashboard, setup,
runner, result) are built from cards over `page-shell-app` and take no band: a
full-width ground there would compete with the surfaces that carry the data.

The hero aurora is scaled back below 640px. Its blobs are fixed at 384–512px
across, so on a 390px phone three of them blanket the whole section: measured,
the headline over it fell to 2.86:1, under the large-text floor. The field now
shrinks to the corners it was drawn for, and the headline measures 5.15:1 on a
phone against 4.77:1 on a desktop.

### Motion

`--ease-settle` (`cubic-bezier(0.32, 0.72, 0, 1)`) is the single curve for
everything the user operates and for `Reveal`. `--ease-pop` is reserved for
entrances that overshoot; `--ease-glide` for drifting backgrounds. `Tilt` is
used on the Home collage (with glare) and on the wide panels of the content
pages (glare off) — never on a card that already carries `Reveal`, so nothing
moves twice at once. Its lean is capped by pixel travel rather than degrees, so
a full-width panel and a small card move their edges by about the same amount.

**Reduced motion is two layers, not one.** The blanket reset in the base layer
(`animation-duration: 0.01ms`, `will-change: auto`) is the safety net and covers
everything, including animations nobody registered. On top of it every entrance
is re-pointed at the opacity-only `fade-in`, and `transition-property` is
narrowed to colour, opacity and shadow at 150ms. A visitor who asks for reduced
motion is not asking for a site that feels broken; a route change should still
arrive, it should just not move them across the screen. `Reveal`, `Tilt` and
`CountUp` do not arm at all under the preference, so their content is resolved
from the first paint. `scripts/motion-review.mjs` asserts all three properties.

## Product preview

The landing-page mockup (`.practice-*` classes, `ScorePreview` in Home.tsx)
uses no hardcoded colours: every surface is an `ink` token, every accent a
`brand`/`mint` token, via CSS variables from `@theme`. It therefore renders in
the exact design language of the live app in both themes, and cannot drift
into its own visual identity again.

## Spacing and surfaces

| Surface | Utility / component | Use |
| --- | --- | --- |
| Card | `card` / `<Card>` | Content group with p-5→6 padding |
| Solid card | `card-solid` | Dense or interactive panel needing a clearer ground |
| Exam card | `card-exam` | Exam section summary only |
| Choice card | `choice-card` | Setup or practice option |
| Choice row | `choice-row` | Answer option or compact selectable row |
| Table | `<Card flush>` | Wide data with a semantic table inside |

Every page header now carries a hairline under it — the one piece of furniture
shared by all fourteen interior routes, and the reason they read as one product
before any other rule is applied.

## Exceptions

- Home owns the `hero-title` display scale and centre-aligned hero.
- The tagline reveal uses extra vertical space for its one expressive moment.
- The result title uses `page-title-compact` beside its score.
- Test runner typography is denser by design, but retains the shared display,
  body and data roles.
- SVG chart labels may use 10–11px because they sit inside fixed chart geometry.
