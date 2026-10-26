# Landing page design review

Applying the `landing-page-design` skill to the existing site. This records what
was adopted, what was declined, and why — because a large part of this skill
directly contradicts decisions this project already made on purpose, and
applying it wholesale would have undone them.

## Layout choice (A3)

**Type A — classic hero plus sections.**

The product is fully understandable from a hero: a score preview plus the count of
question types, sections and cost. Type B (long form) would be right if the
audience arrived sceptical of the scoring accuracy; that objection is real but it
is answered in place by the per question type pages and `/about`, rather than by
inflating the homepage. Type C is too thin for search traffic, which is the
primary source. Type D does not apply, there is no competitor set to compare
against.

## Adopted

### B11 — tagline reveal section (the skill's one mandatory addition)

The homepage had no equivalent moment: the argument ran hero → stats → benefits →
features → FAQ → CTA with no pause. Added a standalone section between the
features and the FAQ:

> Find the one question type that keeps costing you points. Then fix only that one.

Implemented in `src/components/ui/TaglineReveal.tsx`:

- Each word is observed by its own `IntersectionObserver`, staggered 42 ms apart,
  so the sentence resolves in reading order rather than the block fading as a unit.
- `IntersectionObserver` only — B7 forbids a scroll listener here, correctly, since
  it would reflow every frame for the life of the page.
- The custom easing curve from B7, on both the words and the rule.
- Text is `text-4xl` / `text-5xl` from the B1 scale, capped at `max-w-[42rem]`,
  with the line break placed where the thought breaks (B5).

**Adapted, not copied.** B5 specifies a gradient heading, white to grey. That
conflicts with Calibrated Silence, which treats gradients as decoration to be
subtracted. The reveal is a value shift from muted ink to full ink plus a rule
that draws across underneath, which is the same mechanic expressed in the
project's own visual language. A section that only worked with a gradient would
have contradicted every section above it.

**One real bug caught during the build.** The first implementation muted the
words in the effect and revealed them on scroll. During prerendering the effect
never runs, so the static HTML shipped 15 words at 25% opacity — invisible to
crawlers and to anyone without JavaScript. The server markup is now the
*resolved* state and muting happens only after mount. Because the section sits
below the fold, that transition is never on screen. `scripts/seo-audit.mjs`
asserts it, and the assertion was negative tested: reverting the markup produces
`[High] 15/15 tagline words ship un-resolved in the prerendered HTML`.

### A4 — one primary action above the fold

The hero had two buttons plus a third CTA in the header. The secondary "Practise
one skill" button competed with the primary for the same glance, so it is now a
quiet text link below the proof line. Still one click away, no longer competing.

### B10 — privacy policy

The site claims no data leaves the device and that claim appears in the footer of
every page. It had no privacy policy behind it, which is a real trust gap and
specifically so for that claim. Added `/privacy/`, covering local storage, the
absence of analytics and cookies, how audio and speech are handled, and children.

### B1 — type weight cap

Three `font-extrabold` (800) instances exceeded the skill's semibold/bold cap.
All are now `font-bold`.

### Dead CSS

The three section columns on the homepage carried `md:border-l md:pl-6` followed
immediately by `md:border-l-0 md:pl-0`, cancelling themselves out. Now a top
border on mobile and a left rule from `md` up, with the first column excluded.

### Checks that already passed

No AI clichés ("elevate", "seamless", "unleash", "game changer"), no 900 weights,
no `Lorem Ipsum` or placeholder brands, no vague verbs ("streamline", "optimize"),
one `h1` per page, real `404`, branded favicon, meta and social tags, semantic
landmarks, skip link, focus rings on every interactive element, current nav item
indicated by a rule.

### B9 — error state

The site had no error boundary. Everything runs client side against IndexedDB, so
the realistic failures are not network errors but corrupt or unavailable storage,
a schema change across deploys, or a browser refusing storage in private mode.
Any of those throws during render and previously produced a blank white page,
which is the worst outcome available: the user cannot tell whether the site is
broken, whether they lost their history, or what to do.

`src/components/ErrorBoundary.tsx` now wraps the app inside `Suspense`, so a
failure in a lazily loaded test route resolves to a working recovery page. The
fallback names the cause, offers retry and a genuine recovery action (clear local
data and reload), and keeps a way back home. Per B9 it is specific rather than an
"Oops!", and it never uses `window.alert()` — there is no `alert()` call anywhere
in the codebase.

Covered by `tests/components/ErrorBoundary.test.tsx`, which runs as part of the
Vitest coverage command included in `npm run verify`. The component tests
exercise the fallback in a client-like environment because React's legacy
server renderer rethrows instead of catching render errors.

### B1 — heading and body wrap

`text-balance` was on 7 of 43 headings. It is now on every page heading, and
`text-wrap: pretty` is set once as a base rule for body copy so no paragraph can
leave a single word alone on its last line.

**A bug worth recording.** The first attempt placed `text-balance` *outside* the
`className` string, producing `<h2 className="…" text-balance>`. That compiles,
type checks, passes lint and renders a boolean attribute, so every automated
check stayed green while the headings simply were not balanced. It was caught
only by reading the computed `text-wrap-style` in a real browser. A follow-up
repair pass then deleted the closing quote from 46 heading tags.

Both classes of failure are now asserted by
`scripts/browser-check.mjs`, which checks the *computed* style rather than the
markup, and separately asserts no `[text-balance]` attribute leaked into the DOM.

### B4 — invalid CSS comment

Unrelated to this skill but found while repairing the above: a comment in
`index.css` read `Override with any p-*/px-*/py-* class when needed`. The `*/`
inside a CSS comment terminates it early, so the remainder was parsed as live CSS
and failed the build with `CssSyntaxError`. Rewritten to avoid the sequence.

### Ship requirements re-checked

No `<img>` elements exist anywhere — the interface is SVG icons — so the alt text
requirement is not applicable rather than unmet. Also confirmed present: branded
404, branded favicon, title, meta description, Open Graph and Twitter tags,
semantic `nav`/`main`/`section`/`article`, a skip to content link, focus rings on
every interactive element, and the current page indicated in the navigation.

### B9 — loading state

`Suspense` had `fallback={null}`, which meant a blank white screen for the
length of a chunk fetch at exactly the moment the user has pressed Start and is
watching for the clock. `RouteFallback` replaces it with a skeleton shaped like
the test shell — a status bar, a question column, an action bar — so the
transition into the real view is a fill rather than a swap. It uses solid blocks
with a slow stagger rather than a shimmer sweep, which would read as decoration,
and it announces itself with `role="status"` for assistive technology.

This only affects the two lazily loaded routes. The indexable routes are imported
eagerly on purpose, precisely so that Suspense never suspends over prerendered
markup and throws it away.

Verified in `scripts/ui-states-check.tsx`, which now covers both UI states.

### A2 — how it works, three steps

The page went straight from benefits to FAQ, so a reader who had decided they
wanted to try it had to guess what would happen. Added a three-step section
between them: choose a length, sit it under the clock, read what it cost you.
The page order is now the one A2 prescribes — hero, argument, benefits, how it
works, FAQ, final CTA.

### B7 — one motion curve

Twenty-one `transition-*` utilities were inheriting Tailwind's generic default
curve while the tagline reveal used a different one, so the app moved on two
languages. `--ease-settle` is now the project default transition timing function
and every `transition-*` utility inherits it. The brand's other curves were left
alone: the logo pop is a spring, and overshoot belongs in a mark bouncing, not in
a hover.

### B3 — nested radius

Links inside `rounded-lg` cards were given `rounded-sm` to shape their focus
ring. B3's formula gives `8px − 16px`, which is negative, so the inner shape
should be square. Removed from the hub card titles and the related type links.
The breadcrumb links keep their radius: they sit in no containing shape.

### B1 — one micro-label size

Nine arbitrary values between 9px and 13px were in use for what is actually a
single role: the mono eyebrow, the type code, the stat key, the step number.
That is not a scale. Declared `--text-micro` once and replaced thirteen
occurrences. SVG chart internals keep their arbitrary values, because text inside
a scaled coordinate system is a different problem and snapping it to a rem scale
would be arbitrary in a different way.

Two over-applications were caught during this and reverted: the compact mobile
nav at 13px and an SVG axis label in the dashboard are not micro-labels, and
snapping them would have silently shrunk real text.

### B5 — hero measure

The hero heading had no width cap at all, so it wrapped at whatever the grid
column happened to be. Added a `--container-hero` token at 680px rather than an
arbitrary value.

### B9 — physical press feedback

Buttons had `active:` colour shifts but no physical feedback. Added a one pixel
drop to the shared `btn` utility, so every button in the app presses rather than
just recolouring.

Written as `translate: 0 1px` rather than `scale(0.98)`, because a scale shrinks
the element and 24px is already the tap target floor. Translation leaves the
measured box identical, which is asserted: the press is verified to move the box
down exactly one pixel while its height does not change.

Two implementation notes. `transition-colors` had to become
`transition-[color,background-color,border-color,fill,translate]`, since the
original would have left the press snapping rather than easing — and not
`transition-all`, which animates every property the element later acquires.
And `@apply active:translate-y-px` inside the utility silently emitted nothing;
the same rule written as plain nested CSS works. Verified in the built stylesheet
rather than assumed, then negative tested by removing the rule and confirming two
checks fail.

### B8 — content realism, re-audited

No round fake numbers in user-facing copy. The matches that exist are SVG
coordinates and opacities in the chart renderer, which are not claims. No Title
Case headings. No exclamation marks in success or error copy; every `!` in the
source is a negation operator.

## Declined

Each of these conflicts with a decision already documented in
`docs/design/Calibrated-Silence.md`, or with the accuracy of the subject matter.

| Rule | Declined because |
|---|---|
| B1 fonts — Geist/Manrope/Poppins, "one typeface per site" | The three family system (Instrument Serif display, Instrument Sans text, IBM Plex Mono data) is the design. Collapsing to one typeface would flatten the hierarchy that distinguishes a passage from an interface from a score. |
| B1 "never use italic fonts" | The project ships a serif italic deliberately. It is also the correct treatment for quoted transcripts and for chart axis labels, where italic is the convention rather than a style choice. |
| B5 gradient heading (`#FFFFFF` → `#9B9B9B`) | Banned by the doctrine, which counts gradients among the decoration to subtract. |
| B7 fluid glass pill nav, hamburger morph, staggered mask reveal | This is precisely the generic SaaS aesthetic an earlier pass removed: floating pill, backdrop blur, modal glass. Replacing the flat rule based header with it would be a regression, not an upgrade. |
| B2 spacing table, B3 Tailwind default radii | The project has its own documented scale, deliberately sharper (2 to 10 px) than Tailwind's defaults, and its own spacing rhythm. Snapping to the default scale would flatten both. |
| B1 "no hyphens in copy" | PTE domain terms are inherently hyphenated or capitalised ("Fill in the Blanks", "Multiple Choice (Multiple Answers)", "question type"). The rule as written would produce worse English. |
| B4 "never apply a border to only one side of a card" | Kept as a rule for cards. The single rule used to separate the three section columns on the homepage is a divider, not a one sided card border, and rules are the core of this design. |

## Not addressed

**Social proof and testimonials (A2, A4).** The skill places proof beside each
claim. This site has no users and no testimonials, and inventing them would be
the "round fake numbers" and placeholder people the skill explicitly bans. The
substitute is the four stat figures on the homepage, all of which are computed
from the content bank rather than typed in.

**Cookie consent.** Correctly absent. There is no cookie banner requirement
because the site sets no cookies and no comparable storage, which `/privacy/`
now states explicitly.

**Cookie consent banner per B10.** Listed above as intentionally omitted; adding
one to a site with nothing to consent to would be misleading.
## Pace analysis (added after research)

The strongest convergent finding across the guidance available on this test is that
pacing, not language, is what usually costs the marks: running out of time, rushing,
or over-investing in a few items. Advice to "manage your time better" is not
actionable, because a candidate cannot see *which* items are eating the section.

Every timed item in the app already carries the budget the real test allows
(`Item.seconds`), so the missing half was measuring. `secondsOnItem` turned out to
be a declared field that nothing ever wrote — the type said the data existed, the
tests agreed, and no candidate's pace had ever been recorded. The runner now
accumulates time per item and the report compares the two.

Deliberate choices:

- **Under budget is not presented as good.** A repeat sentence finished in two
  seconds was probably not understood. The report says so on the tab rather than
  rewarding speed on its own.
- **No reading or listening rows** for types that are not individually timed.
  Showing them as "infinite speed" would be technically true and useless.
- **The tab only appears when there is timing data**, so a report reloaded from
  history after the mock is gone shows no empty panel.

The panel and the existing "Drill weakest type" link originally disagreed, because
the link read only the latest attempt while the panel read five. Both now read the
same function, asserted against each other.
