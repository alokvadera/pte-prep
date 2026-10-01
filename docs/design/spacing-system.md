# PTE Prep Design System v2

This system applies across every route. The public pages, setup screens,
dashboard, test runner and score report use different layouts because they ask
people to do different things; shared tokens and controls make them feel like
one product.

The visual direction is **Practice Hub**: a clear PTE study portal with a
persistent desktop sidebar, direct mock and skill entry points, and score
information grouped for quick review. On mobile the sidebar becomes a compact
top bar and horizontal navigation.

## Design language

| Role | Token | Value |
| --- | --- | --- |
| Page ground | `ink-50` | `#ffffff` |
| Raised surface | `ink-100` | `#f6f8fb` |
| Primary text | `ink-900` | `#171b20` |
| Secondary text | `ink-500` | `#606b7a` |
| Action and selected state | `brand-500` | `#1756b0` |
| Positive signal | `mint-500` | `#2a6b50` |
| Caution signal | `amber-500` | `#9c4a24` |
| Error signal | `rose-brand` | `#8c3a3a` |

Dark mode uses the same roles against slate `ink-900`. Blue is reserved for
navigation, selections and primary actions; sky blue (`brand-300`) is a light
accent for focus and illustration. Mint, amber and rose communicate result
states. The homepage product preview uses a charcoal workspace surface against
the white page shell.

| Type role | Family | Use |
| --- | --- | --- |
| Interface | Instrument Sans | Headings, instructions, passages, controls and body copy |
| Data | IBM Plex Mono | Scores, durations, scales and short identifiers |

The number scale follows Tailwind’s default steps. Compact labels use the
`text-micro` 12px token; chart axis labels may use smaller SVG text where space
is constrained. Paragraphs use pretty wrapping and headings use balanced
wrapping.

## Page shells and hierarchy

Use the named shell utilities instead of copying width and gutter strings:

| Shell | Utility | Use |
| --- | --- | --- |
| Reading | `page-shell-prose` | About, privacy and question type detail |
| Editorial | `page-shell-content` | Guide, test format and scoring guide |
| Workspace | `page-shell-app` | Setup, practice, progress and results |
| Wide | `page-shell-wide` | Home sections and broad data views |
| Empty | `page-shell-empty` | 404 and recovery screens |

Content pages share `page-title`, `page-intro` and `section-title`. Home owns
the larger hero scale. The test runner owns a compact task heading so the
question remains first. A score report may use `page-title-compact` beside its
score.

The desktop sidebar groups Overview, Mock tests, Practice and Progress under
Study; Question types, Test format and Study tips under Learn. Mobile keeps
Mock tests, Practice, Progress and Learn one tap away. The logo returns home.

## Components and states

| Component | Variants and state | Rule |
| --- | --- | --- |
| Button | `btn-primary`, `btn-secondary`, `btn-ghost`, `btn-danger` | One primary action per context; label says what happens |
| Card | `card`, `card-solid`, `card-exam` | Use a card for a contained unit, not as a default wrapper for every paragraph |
| Choice | `choice-card` / `choice-row`; `choice-active` / `choice-idle` | Selected options use the same blue border and tint in setup, practice and questions |
| Badge | `Badge` with neutral, brand or semantic tone | Short status or type label; never a substitute for a heading |
| Progress | `ProgressBar`, score range and skill bars | Pair every color with a value or label |
| Feedback | `EmptyState`, inline error, resume notice | Say what happened and give the next useful action |
| Disclosure | native `details` and `summary` | Keep the question visible and the answer keyboard accessible |
| Navigation | primary nav, breadcrumbs, footer links | Mark location; use the same destination names across the site |

Cards, buttons and form controls use the small radius scale. Data panels stay
flat; only touch controls use the softer end of the scale. Focus rings are
always visible, reduced motion is respected, and the 44px target is preferred
for primary touch actions.

## Product flows

1. **Learn:** a consistent title and introduction lead into scannable sections,
   tables or question type details. Each page ends with a clear next step.
2. **Prepare:** mock setup and practice use the same choice states, concise
   option descriptions and a persistent summary of the run.
3. **Test:** section briefing, clock, question, answer and navigation stay in
   one focused sequence. Keep learning links and decorative treatments out of
   the active question area.
4. **Improve:** the result leads with the score, then skills, question types
   and item feedback. Practice links use the same names as the corresponding
   question type pages.

## Spacing and surfaces

Allowed spacing steps are `0, 1, 2, 3, 4, 5, 6, 8, 10, 16` in Tailwind units.
Use `mt-3` for a description under a title, `mt-5` for a directly related
grid, `mt-8` for a grouped block and `mt-16` between major sections. Grids use
gap 3 for cards, gap 4 for major splits and gap 2 for compact labels.

| Surface | Utility | Use |
| --- | --- | --- |
| Card | `card` | Content group with standard padding |
| Solid card | `card-solid` | Dense or interactive panel needing a clearer ground |
| Exam card | `card-exam` | Exam section summary only |
| Choice card | `choice-card` | Setup or practice option |
| Choice row | `choice-row` | Answer option or compact selectable row |
| Table | `card p-0 overflow-x-auto` | Wide data with a semantic table inside |

## Exceptions

- Home uses a larger headline and `text-4xl` section headings to support its
  product preview layout.
- The tagline reveal uses extra vertical space for its one expressive moment.
- The result title remains compact beside the score.
- Test runner typography is denser by design, but retains the shared display,
  body and data roles.
- SVG chart labels may use 10–11px because they sit inside fixed chart geometry.
