# SEO audit

Produced by applying the `seo-audit` skill to this site. The audit itself is
automated and re-runnable:

| Command | Covers |
|---|---|
| `npm run seo:audit` | Static output in `dist/` — crawlability, indexation, canonicals, titles, descriptions, headings, JSON-LD, images, internal links, font payload |
| `npm run seo:audit:browser` (needs `npm run serve`) | Rendered DOM — schema that only exists after JS runs, Core Web Vitals at a throttled mobile viewport, tap targets, horizontal overflow, console errors |

The split is deliberate. The skill is explicit that `curl` and `web_fetch` cannot
be trusted to judge schema, page speed, or mobile behaviour because they never
execute the page. Static checks live in `verify`; rendered checks are a separate
command because they need a running server.

## Executive summary

**Health: good.** The site had no critical or high-severity defects. The audit
found 65 medium findings, all of them real and all now fixed. The site is
statically prerendered with self-describing metadata, so crawlability and
indexation were sound from the start; the problems were in snippet presentation
and web-font payload.

Measured on the current built output: **38 rendered documents, 31 indexable, 31
sitemap URLs, 0 static-audit findings**. The 38 documents include the three
noindex app shells and the 404 page in addition to the 35 prerendered routes.

### What was fixed

| # | Issue | Impact | Evidence found | Fix |
|---|---|---|---|---|
| 1 | Titles exceeded the SERP limit | Medium | 22 spokes ran 79–97 chars, `/format` ran 87 | Rewrote titles to fit the SERP (longest is now 62, most under 55), and changed `pageHeadTags` to append `\| PTE Prep` only when the base title leaves room (`BRAND_BUDGET = 48`) |
| 2 | Meta descriptions too long | Medium | 22 spokes ran 166–211 chars | Tightened the scoring-mode phrasing and used a single-word section name in descriptions; longest is now 159 |
| 3 | Trailing-slash inconsistency | Medium | `/mock` in the sitemap vs `/question-types/` elsewhere | Standardised every route, canonical, `og:url`, breadcrumb and sitemap entry on a trailing slash |
| 4 | `/mock` had no structured data | Medium | 0 JSON-LD blocks | Added `WebApplication`, `HowTo` and `BreadcrumbList` |
| 5 | Fonts shipped as TTF | Medium | 332 KB of fonts over the wire | Converted all six faces to WOFF2 (60–71% smaller each), switched the `@font-face` src, and preloaded only the body face |
| 6 | Footer and card links under 24px | Medium | 18–20px tap targets at 390px | Padded the footer links, breadcrumbs, hub card titles and related-type links to a 24px hit area without changing visual rhythm |
| 7 | Broken font references | High | `.ttf` URLs after the files were removed | Updated `src/index.css`, `index.html` preloads and `scripts/render-plates.mjs` — caught by the audit's own broken-link check, not by inspection |

### Two judgement calls worth recording

**The brand suffix was conditional, not removed.** Dropping `| PTE Prep`
everywhere would have been simpler, but on pages where the title is short the
brand is worth its 11 characters. `pageHeadTags` now appends it only when the
base title stays under the budget.

**Some 18px links were left alone.** The audit initially flagged inline prose
links in the question-type pages. WCAG 2.2 SC 2.5.8 exempts targets that sit
inside a sentence or block of text, and padding them would have broken the
typography. The check now encodes that exemption rather than the finding being
silently ignored.

## Current measurements

Core Web Vitals, cold cache, 390px viewport, throttled to 1.6 Mbps / 150 ms:

| Route | LCP | CLS | Fonts | CSS |
|---|---|---|---|---|
| `/` | 2.16 s | 0 | 159 KB | 67 KB |
| `/format/` | 2.04 s | 0 | | |
| `/question-types/read-aloud/` | 1.93 s | 0 | | |
| `/mock/` | 1.98 s | 0 | | |

All within the "good" thresholds (LCP < 2.5 s, CLS < 0.1). Font payload was
332 KB before the WOFF2 conversion.

## Verified good (no action needed)

- **Crawlability** — `robots.txt` references the sitemap; no blanket disallow.
- **Sitemap** — 31 absolute https URLs, all canonical and indexable; the
  `noindex` app pages are correctly excluded.
- **Canonicals** — every indexable page self-references, agrees with `og:url`,
  appears in the sitemap, and uses the same trailing-slash form.
- **No cannibalization** — 22 unique titles, descriptions and canonicals across
  the 22 spokes, including the five types that share a display name.
- **Structured data** — valid JSON-LD on every indexable page; every `FAQPage`
  block's questions are also rendered on the page, which Google requires.
- **Internal linking** — no orphans, no broken links, hub-and-spoke fully
  connected; 3-clicks-to-home holds for every page.
- **Headings** — exactly one `h1` per page, no skipped levels.
- **Mobile** — no horizontal overflow at 390px on any route tested.
- **Thin content** — every question-type page is 250+ words (thinnest 335).

## Recommended next steps

Ranked by expected impact. These are **not** implemented — they need either
production data or a content decision.

1. **Submit the sitemap to Search Console.** The largest single gap is that no
   indexation data exists yet. Until the site is submitted, none of the work
   above can be verified by ranking rather than by audit.
2. **Verify in the Rich Results Test.** The audit confirms the JSON-LD parses and
   is valid schema; only Google's validator confirms it produces rich results.
   Notably, `FAQPage` rich results are restricted to authoritative government and
   health sites, so the FAQ markup here is best treated as content structure
   rather than a rich-result play.
3. **Add an author or editorial-standards page.** E-E-A-T is the weakest area of
   the site. The content is well sourced internally, but a reader cannot see
   who wrote it or what the revision policy is. For a YMYL-adjacent topic like
   test preparation this is a real trust gap.
4. **Consider topic-cluster links from `/guide` to the spokes.** `/guide` already
   covers all 22 types and is the strongest existing page; linking each of its
   sections to the matching spoke would pass more topical signal than the
   footer's site-wide links do.
5. **Set up Core Web Vitals field monitoring** once there is real traffic, so
   regressions are caught on real user hardware rather than a single throttled
   run.

## What was deliberately not changed

- **No hreflang or locale pages.** The site is English-only. The Translations
  playbook was considered for the `programmatic-seo` work and deferred, since
  scaled low-value translation is a documented penalty risk.
- **No `meta keywords` removal.** It is present, but it is inert for Google and
  removing it would change nothing measurable; the tag is already sourced from a
  single registry if that judgement is ever revisited.
- **No content added purely for keywords.** Every audit check measures whether a
  page earns its place, not whether it hits a target phrase count.
