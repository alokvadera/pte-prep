# Design research, October 2026

A second pass over the design of the app, run after `DESIGN_RESEARCH.md` was
acted on. This file records only what is **still open**, plus the negative
results, so the next pass does not re-research what is already done.

Method: read the current source and the rendered output, then search for
evidence published since the first pass. Every claim below is graded, and the
grading is not generous. Where the evidence supports an accuracy gain but not a
decision gain, this file says so.

Research date: 3 October 2026.

---

## Status of the first pass

Checked against the code rather than assumed. These are the "do these first"
items from `DESIGN_RESEARCH.md`, and their current state:

| # | Item | State |
|---|---|---|
| 1 | Countdown live-region markup | Done — `TestHeader.tsx:6-16` documents the `role="timer"` trap and excludes the clock, announcing the two actionable moments through `role="status"` instead |
| 2 | Time-extension route | Done — `MockSetup.tsx:23` has `standard \| extended \| long \| untimed` |
| 3 | Donut → linear range bar | Done — `components/charts/ScoreRangeBar.tsx`, no radial or conic gauge remains |
| 4 | Four named contrast failures | Done — `npm run contrast:render` is green in both themes across 66 rendered text checks |
| 5 | `scroll-padding-bottom` | Done — `TestRunner.tsx:352` |
| 7 | Uppercase tracked eyebrows | Done — replaced by `section-eyebrow`, which carries a leading hairline instead of tracking |
| 11 | Target size | Largely done — tap floor enforced in the `btn`/`field` utilities |
| 12 | `font-extrabold` convergence | Done — zero occurrences remain |

So the first pass is essentially closed. What follows is new ground.

---

## Finding 1 — The score is drawn as a certainty it is not

**Grade: strong evidence, directly applicable, small change.**

### The evidence

Two studies, both about showing an estimated number to a non-expert.

**Frans, Hummelen, Albers, Paap & van der Nieuwenhuis (2023)**, "Visualizing
Uncertainty to Promote Clinicians' Understanding of Measurement Error",
*Evaluation & the Health Professions* 30(8):2449–2460.
<https://pmc.ncbi.nlm.nih.gov/articles/PMC10623599/>

230 practitioners were each shown a test-score report in one of five formats:
textual, error bar, violin plot, diamond plot, or **quantile dot plot**.
> "We found that quantile dot plots significantly increased accuracy in the
> assessment of measurement uncertainty compared with other formats. However, a
> direct relation between visualization format and decision quality could not be
> found. Although traditional confidence intervals and error bars were favored
> by many participants due to their familiarity, responses revealed several
> misconceptions that make the suitability of these formats for communicating
> uncertainty questionable."

**Fernandes, Walls, Tang & Ubicsek**, "Uncertainty Displays Using Quantile Dotplots
or CDFs Improve Transit Decision-Making", *Decision Analysis*.
<https://www.semanticscholar.org/paper/825ae04b67cd58951cdb115978e9fba6a1d5f5d9>

Transit riders choosing a route under demand uncertainty. Frequency-based
displays let people extract probabilities better than interval plots, and
outperformed textual uncertainty, which was sensitive to which probability
interval was stated. Quantile dotplots with 50 outcomes reached expected payoffs
of 97% of optimal (95% CI [95%, 98%]), about 5 points better than the baseline.

Both point the same way, and both name the same reason: **interval bars are
familiar, and familiarity is why they are misread.** People treat an error bar
as "the answer is somewhere in here, roughly the middle", which is exactly the
reading a symmetric interval invites and exactly the wrong one for a skewed
estimate.

### What it means here

`ScoreRangeBar.tsx:85` draws the overall score as what its own comment calls
"A single hard marker rather than a segment, so the value is readable". That was
the right call against the donut and it should be kept. But taken to its
conclusion it produces a mark with **no width at all**, on a component whose
whole subject is a prediction.

The copy already knows this. `ResultPage.tsx:258` says the score is the
"closest honest approximation available without their model", `isEstimated()`
marks which traits are modelled rather than scored, and `ResultPage.tsx:613`
concedes that Pearson's trait model is unpublished. The prose is careful and the
graphic is confident. That gap is the finding.

This matters commercially, not just academically. The product's value is a
number the user will act on, and the one thing that destroys that value is a
user who takes a 61 as exact, books nothing, and concludes the tool is wrong.

### The change

Keep the hard marker. Add a **quantile dot strip** beneath it on the same 10–90
track: five small marks at the 10th, 30th, 50th, 70th and 90th percentiles of
the estimate, with the median dot in ink and the tails in a muted step. The
marker stays the largest element, so nothing about the reading of "you scored
61" changes — what changes is that the width of the uncertainty becomes visible
without being read.

This is a genuinely additive form. Nothing in the current palette is needed:
ink for the median, `ink-400` for the tails, the existing band rules underneath.

One honest caveat, and it should be carried into the copy rather than hidden:
Frans et al. found an **accuracy** gain and explicitly did **not** find a
decision-quality gain. Say "this is the range", not "this will improve your
results".

**Cost:** half a day. The percentiles must be derived honestly from the
scoring model rather than invented — `rawToPteScale` and `buildReport` are the
places to start, and if the model cannot produce a defensible interval, the right
answer is a wider, more obviously approximate strip, not a narrower invented one.

---

## Finding 2 — The loop has no return

**Grade: strong evidence, large design change, larger than it looks.**

### The evidence

The spacing effect and retrieval practice are among the most replicated findings
in the learning sciences: reviewing material at expanding intervals, and
retrieving rather than re-reading, both produce substantially better retention
than massed practice. This is not a marginal effect and it is not contested.

### What it means here

Grepping the codebase for any scheduling concept — `spaced`, `interval`, `due`,
`nextReview`, `retention`, `streak` — returns nothing but the word "interval"
inside reading passages. The application's loop is:

> take a test → get a report → read which type was weak → *(end)*

`Dashboard.tsx` computes `weakestTypes(attempts, 3, true)` and offers "Drill
weakest type". That is **reactive**. It tells you what went wrong last time and
makes you act on it now, with no notion of when it would be worth returning to.

This is a design gap rather than a missing feature, and that distinction is why
it belongs in this file. There is no visual in the system for "due today". The
entire visual vocabulary — bands, callouts, key figures, meters — describes the
past. Nothing in it describes a future obligation, which for a study tool is the
only thing that produces a return visit.

The project already understands this idea in one direction.
`LANDING_PAGE_REVIEW.md` records a pace analysis concluding that *"running out of
time, rushing, or over-investing in a few items"* is what costs the marks, and
that advice to "manage your time better" is not actionable because a candidate
cannot see which items are eating the section. The app solved that inside the
test. The same insight has not been applied outside it: a candidate cannot see
which *type* is worth returning to either, and so the dashboard offers them the
wrong one — the weakest, which after a bad sitting is often the type they have
just drilled three times.

### The change

A **due queue** as a first-class surface, not a feature bolted to the dashboard.
Two parts, both built from data already in `AttemptRecord`:

1. **A due row.** Each type carries `lastPractised` and `retention`. A type is
   due when `now - lastPractised > interval`, where the interval grows with each
   successful retrieval — the standard expanding-interval schedule. Types never
   practised are always due.
2. **A visual for it.** A small horizontal "return strip" under the focus panel:
   one mark per type, positioned by how long ago it was last seen, filled when
   due. It reuses the existing meter idiom, needs no new colour, and reads as a
   queue because it is ordered by obligation rather than by weakness.

The copy change is the important half. "Weakest" is a judgement about the last
attempt and it expires. "Due" is a statement about now. A study tool whose
dashboard can only describe the past is a reporting tool.

**Caveat worth taking seriously:** a scheduling algorithm that is wrong is worse
than none, because the user will trust it. This should ship only if the interval
is defensible and only with the ability to see and override the schedule. Also
note the tension with the project's own doctrine — a queue is a push, and this
site has no accounts, no email and no notifications. Everything has to be
expressed as something the user sees when they arrive, which is a real
constraint on how it can be built.

**Cost:** two to three days, plus a decision about whether this is in scope at all.

---

## Finding 3 — Author the palette in a perceptual space

**Grade: sound, low urgency, improves every future colour decision.**

### The evidence

`oklch()` is Baseline across all major browsers and is the space the current
accessibility conversation is moving toward. The practical argument is not that
hex is wrong but that **lightness in `oklch` is perceptual**, so holding L fixed
across hues gives genuinely equal-feeling contrast, and a chroma adjustment no
longer silently changes how light a colour looks.

APCA is the adjacent question and the answer for now is: **leave it alone.** WCAG
3.0 remains a Working Draft as of 10 September 2026
(<https://www.w3.org/TR/wcag-3.0/>). APCA is under consideration for it, but it
is not a conformance target, and WCAG 2.2 remains the standard that is actually
enforced. Switching contrast scoring now would mean shipping against a draft.

### What it means here

`src/index.css:60-90` defines the palette as hex. Every one of those values was
chosen by eye and then validated by script, which is a defensible workflow — but
it means that **adding a tone means guessing and then checking**, and the
checking is manual and per-pair.

### The change

Re-express the existing tokens in `oklch` without changing a single rendered
colour, then derive the light/dark steps from a locked L per role:

- `ink-500` and `ink-400` share an L, so secondary text is as legible in the
  brand blue as in the neutral grey.
- `brand-300` and `brand-400` are one hue at two lightness steps by
  construction, which is the property the dark theme depends on.

The `contrast.mjs` and `contrast-render.mjs` harnesses do not change and become
the regression net for the conversion. This is a refactor with no visual delta
that makes every later colour decision cheaper and less likely to fail.

**Do not** do this before Findings 1 and 2. It is the lowest-value change here
and it touches the most load-bearing file in the project.

**Cost:** one day, and only once the palette is otherwise stable.

---

## Finding 4 — The accent rule and the headline now disagree

**Grade: small, immediate, follows directly from the gradient change.**

`rule-gradient` still runs `brand-500 → mint-400 → brand-500`. The headline
gradient was moved to a brand/mint sweep with `mint-400` as its lightest stop,
which raised headline contrast from 4.77:1 to 4.90:1 while adding the colour the
page was missing. The accent rule under section headings is now the one
gradient on the site that does not match the headline's colour logic. Aligning
it is a two-line change and it removes the last place where the palette speaks
with two voices.

---

## Negative results

Recorded so the next pass does not repeat them.

- **`tabular-nums` coverage is not a gap.** The folklore advice is that
  data-dense UI needs tabular figures. It already has them: 59 usages, applied to
  every score, meter value and stat. `font-variant-numeric` appears nowhere in
  `index.css` but every numeric call site carries the Tailwind utility, which is
  the correct arrangement. `slashed-zero` is unused, which is a defensible
  choice for IBM Plex Mono and not worth changing.
- **WCAG 3.0 is not actionable.** Still a Working Draft. Keep scoring against
  WCAG 2.2 and keep `contrast-render.mjs` where it is.
- **Scroll-driven animations and view transitions are available but are not a
  design improvement here.** Same-page view transitions went Baseline in 2025
  and scroll-driven `animation-timeline` sits around 83–85% support. `Reveal`
  currently runs one `IntersectionObserver` per element, which a
  `view()` timeline would remove. That is a real simplification, but the current
  implementation already renders resolved on the server, which is what protects
  prerendering and the tagline-reveal SEO assertion. Trading a correctness
  guarantee for less JavaScript is a bad trade on this project specifically.
- **Do not re-run the first pass.** Its twelve items are done or largely done.

---

## Order of work

1. Finding 4 — align the accent rule. Minutes.
2. Finding 1 — quantile dot strip. Half a day, strongest evidence.
3. Finding 2 — due queue. Two to three days, but the largest design change
   available and the only one that changes what the product *is*.
4. Finding 3 — palette to `oklch`. Last, and only once the above have settled.

## Sources

- Frans N, Hummelen B, Albers CJ, Paap MCS, van der Nieuwenhuis N. "Visualizing
  Uncertainty to Promote Clinicians' Understanding of Measurement Error."
  *Evaluation & the Health Professions* 30(8):2449–2460, 2023.
  <https://pmc.ncbi.nlm.nih.gov/articles/PMC10623599/>
- Fernandes M, Walls D, Tang J, Ubicsek D. "Uncertainty Displays Using Quantile
  Dotplots or CDFs Improve Transit Decision-Making." *Decision Analysis*.
  <https://www.semanticscholar.org/paper/825ae04b67cd58951cdb115978e9fba6a1d5f5d9>
- W3C. "Web Content Accessibility Guidelines (WCAG) 3.0." Working Draft,
  10 September 2026. <https://www.w3.org/TR/wcag-3.0/>
- Interop 2026, CSS-Tricks, February 2026. <https://css-tricks.com/interop-2026/>
- The State of CSS in 2026 — container queries, scroll-driven animations.
  <https://blog.codercops.com/blog/state-of-css-2026>
- OKLCH and APCA for accessible color systems.
  <https://accessibility.build/guides/oklch-apca-color-systems>