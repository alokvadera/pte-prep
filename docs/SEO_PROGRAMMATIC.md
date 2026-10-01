# Programmatic SEO — question-type hub and spokes

Applies the `programmatic-seo` skill (playbook: **Glossary + Directory**, hub and
spoke) to the PTE Academic test-prep site.

## Why this playbook

The skill's "match to your assets" table points content/expertise properties at
Glossary and Curation, and proprietary data at Directories. This site has both,
and the proprietary data is unusually strong for this vertical: `src/domain/blueprint.ts`
is the same structure the test engine uses to assemble a real paper. Every count,
scoring rule, skill assignment and trait on these pages is read from it at render
time rather than restated as prose, so a page cannot claim something the engine
does not do.

That property is what keeps 22 pages off the thin-content list. They are not a
template with a swapped variable — they read from the engine's own data
definition, and the editorial layer (`src/content/questionTypeDetail.ts`) carries
prose the blueprint cannot express: what the task asks, how marks are allocated,
and where candidates lose them. Every scoring claim traces to
`docs/PTE_KNOWLEDGE.md`, which records the official guide references.

## Structure

| Level | URL | Count | Purpose |
|---|---|---|---|
| Hub | `/question-types/` | 1 | Directory of all 22, grouped by section, ItemList + FAQ + BreadcrumbList JSON-LD |
| Spoke | `/question-types/[slug]/` | 22 | One type: what it is, how it is scored, mistakes, strategy, visible FAQ, related types, drill CTA |

All 31 routes are prerendered to static HTML with their full metadata, so a
crawler sees real content without executing JavaScript.

## Avoiding cannibalization

This was the biggest risk and it is structural, not incidental. Five of the 22
types collide on display name:

- `Multiple Choice (Single Answer)` — Reading **and** Listening
- `Multiple Choice (Multiple Answers)` — Reading **and** Listening
- `Fill in the Blanks` — three variants (Dropdown, Table, Listening)

Built naively from the label, five pairs of pages would target the same keyword.
Every title and description therefore carries the section
(`PTE Fill in the Blanks — Listening Section | …`), which both disambiguates and
matches how people actually search ("pte listening multiple choice" is a real,
distinct query). Asserted, not assumed — `scripts/browser-check.mjs` crawls all
22 and fails if any title, description, or canonical repeats.

## Indexation and anti-patterns avoided

- **No doorway pages** — every spoke is reachable from the hub, the nav, and the
  footer; no orphan pages.
- **No thin variations** — verified: every spoke is 250+ words (thinnest ~335,
  mean ~450) with at most 0.46 5-word-shingle overlap against any other page.
- **No keyword stuffing** — the visible copy and the JSON-LD are generated from
  one source (`faqForType`), so the marked-up FAQ cannot promise content the
  page doesn't show. Google requires FAQPage content to be visible; this is
  checked per page.
- **Clean URLs** — subfolder paths, not subdomains; authority is consolidated on
  one origin.
- **Internal linking** — hub → all 22 spokes; each spoke → hub, to 4 sibling
  types in its section, and to a `?type=` drill that preselects that type. The
  `?type=` drill was a real gap: `Practice` previously ignored its query string,
  so every "practise this type" CTA was a no-op.
- **No soft 404** — an unknown slug renders the real 404 page and is `noindex`.

## Correctness bug found on the way

`fill-in-blanks-dropdown` was assigned `section: 'speaking-writing'` in the
blueprint even though its own `skills` said `['reading']`. That misfiled it into
Part 1 of the test assembly. The section counts now match the guide's documented
split (Part 1 = nine types, Reading = five, Listening = eight), and the engine
smoke tests still pass after the fix.

## Verification

`npm run verify` and `node scripts/browser-check.mjs` cover the new surface:

- all 22 titles / descriptions / canonicals unique, one h1 each, canonical present
- every spoke shows visible breadcrumbs and visible FAQ
- the two `Multiple Choice (Single Answer)` pages are distinguishable by title
- unknown slug → 404 + noindex
- the `?type=` deep link preselects the drill
- thinnest spoke ≥ 250 words

## Deliberately not done

- **Translations playbook.** Real demand is plausible (PTE is heavily taken in
  India, China, Vietnam), but machine-translated pages are the classic thin-pSEO
  failure and the skill is explicit that quality matters more than count. Deferred
  until a native reviewer is available per locale.
- **Programmatic pages beyond the 22 types.** The obvious next expansions (CEFR
  band pages, section-overviews) are thin — each would restate one table with a
  swapped variable. Not built on purpose.