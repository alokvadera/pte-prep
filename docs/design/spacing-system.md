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

Only Tailwind steps that land on the 4px grid: `1, 2, 3, 4, 5, 6, 8, 10, 12,
16, 20` (4px – 80px). Arbitrary values (`mt-[74px]`, `py-3.5` for rhythm) are
not part of the system. Rhythm rules:

- `mt-3` description under a title, `mt-4`–`mt-6` directly related grid,
  `mt-8`/`mt-12` grouped block, `mt-16`/`mt-20` between major sections.
- Grid gaps: `gap-4` card grids, `gap-6` major splits, `gap-2` compact labels.

### Page shells

One gutter scale everywhere — `px-4 sm:px-6 lg:px-8` — with a unified `5xl` (1024px)
measure across all main views so content never jumps sideways between routes. Always
used through `<PageWrapper>` or the raw utility:

| Shell | Measure | Use |
| --- | --- | --- |
| `page-shell-prose` | 5xl | Longform reference pages (About, Privacy, question-type detail) |
| `page-shell-content` | 5xl | Informational content (Guide, Test format, Scoring guide) |
| `page-shell-app` | 5xl | Interactive workflows (Mock setup, Practice, Dashboard, Result) |
| `page-shell-wide` | 5xl | Home sections, test runner header/footer, site header and footer |
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

## Exceptions

- Home owns the `hero-title` display scale and centre-aligned hero.
- The tagline reveal uses extra vertical space for its one expressive moment.
- The result title uses `page-title-compact` beside its score.
- Test runner typography is denser by design, but retains the shared display,
  body and data roles.
- SVG chart labels may use 10–11px because they sit inside fixed chart geometry.
