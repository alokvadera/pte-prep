# PTE Academic mock-test site: design research

Research notes and recommendations for the free PTE Academic mock-test app. Six topics, each with the
guidance found, the source URL, and a concrete recommendation for this product. Everything is scoped to
what is already in the codebase (`src/pages`, `src/components`, `src/index.css`) so it can be actioned
without re-architecting.

Research date: 30 September 2026. Sources were scraped live with `firecrawl`.

---

## Do these first

Ordered by impact per unit of effort. Items 1 to 6 are accessibility failures that are also visible
quality problems, so they pay twice.

| # | Change | Why now | Cost |
|---|---|---|---|
| 1 | **Fix the countdown timer's live-region markup.** `TestHeader.tsx:45-48` puts `aria-label` on an element with `role="timer"`. An `aria-label` replaces the element's text content in the accessibility tree, so the changing number is not what gets announced. The `aria-live="assertive"` branch in critical mode is therefore unreliable. See [Topic 1](#topic-1--wcag-22-for-a-timed-test). | Screen-reader users currently get either nothing or a broken announcement in the one place a 2-hour test can go wrong. | ~1 hour |
| 2 | **Add a time-extension route to mock setup.** SC 2.2.1 has three acceptable routes; the cheapest is *Extend* (warn, ≥20 s, one simple action, ≥10 extensions). TestGorilla gets this with a two-question accommodations screen taken before the test starts. | Closes a Level A failure. Copy the pattern. | 1 day |
| 3 | **Replace the donut with a linear range bar.** Appears in `ResultPage.tsx:117` and again in the `ScorePreview` on the landing page (`Home.tsx:272`). Both encode one number with arc length. See [Topic 2](#topic-2--score-visualisation). | NN/g is unambiguous that area and angle do not communicate magnitude; a donut of a single value communicates nothing except its own existence. Also removes the two hardest accessibility problems in the product in one change. | 1 day |
| 4 | **Fix four named contrast failures.** Measured ratios in the [contrast audit](#appendix--contrast-audit). `ink-500` on the dark ground is **2.80:1**. `mint-500` on white is **2.54:1** (the four "No signup" checkmarks on the landing page in light mode). `ink-400` on white is **3.95:1** (the stat descriptions). `mint-600` on the mint pill is **3.27:1** (the "Estimated" badge). | 1.4.3 is the most commonly failed criterion in audit, and the fixes are token changes, not layout changes. | 2 hours |
| 5 | **Add `scroll-padding-bottom` to the test runner.** The sticky bottom bar with Back / Next is a textbook SC 2.4.11 failure mode (technique **F110**). Fix is CSS: `scroll-padding-bottom` equal to the bar height. | Keyboard users tabbing through answer options currently lose the focused control off-screen. | 15 minutes |
| 6 | **Announce state changes with `role="status"`.** Question advanced, answer saved, flag toggled, section changed, 5-minutes-remaining. All are status messages under SC 4.1.3 and none currently surface. | Fails 4.1.3 and is the difference between "the app is broken" and "the app told me what happened". | Half a day |
| 7 | **Strip the uppercase tracked-out `.label` eyebrow from most sections.** It is a named P1 tell in the 2025-26 catalogue, and it is currently on "most headings". Keep it only where the label carries information the heading does not. See [Topic 4](#topic-4--design-language-2025-2026). | Pure deletion. Costs nothing, changes the perceived quality of the whole product. | 2 hours |
| 8 | **Rewrite the estimate microcopy as point + range + attributed method.** The current copy hedges in prose. The established pattern is a confident point estimate, a stated range, and one attributed caveat. See [Topic 5](#topic-5--microcopy-for-an-estimate). | Trust is the entire product. Right now the page is either over-hedged or falsely precise depending on where you look. | Half a day |
| 9 | **Put a real artefact above the fold on the landing page.** The `ScorePreview` card is a mock of a state the user has not reached. Replace with a runnable 1-item sample or a real report screenshot with real numbers. | [Topic 6](#topic-6--landing-page-for-free-tool-seo). Also removes the "fake product shot" tell. | 1 day |
| 10 | **Turn the 22 question types into a real, linked reference table** generated from the same blueprint data the test runs on. | The link-earning, crawlable asset that ranks for the long-tail head term, built from data you already have. | 1 day |
| 11 | **Audit the progress-dot strip and every icon control against 24×24 CSS px** (SC 2.5.8). Likely the densest small-target cluster in the product. | Levers of dexterity and touch. Cheap to fix with padding. | Half a day |
| 12 | **Converge the results page on one direction: industrial/utilitarian or Swiss grid.** Cards everywhere, `rounded-2xl` + soft shadow on every element, four hues for four skill bars, `font-extrabold` (800) throughout. See [Topic 4](#topic-4--design-language-2025-2026). | The current look is the "AI-generated" look the brief explicitly wants to avoid. | 1 week |

---

## Topic 1 — WCAG 2.2 for a timed test

### 1.1 SC 2.2.1 Timing Adjustable (Level A)

Source: <https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html>

The criterion applies to **any** process that happens without user initiation after a set time or on a
periodic basis. At least one of three routes must be true:

- **Turn off** — before encountering it, or
- **Adjust** — before encountering it, over a range at least **ten times** the default, or
- **Extend** — the user is **warned before time expires**, given **at least 20 seconds** to extend with a
  **simple action**, and may extend **at least ten times**.

Exceptions: real-time event, essential, longer than 20 hours.

Three details matter for this product:

1. **"This success criterion applies only to time limits that are set by the content itself."** A 2-hour
   PTE mock clock is unambiguously set by the content. It is in scope. The note that limits set by the user
   agent or "by factors intrinsic to the Internet" are out of scope does not rescue us.
2. **The definition of *essential*** is narrow: *if removed, would fundamentally change the information or
   functionality of the content, **and** information and functionality cannot be achieved in another way
   that would conform.* A practice mock is not that. Its purpose is to rehearse pacing; a longer clock
   does not invalidate anything, and the whole activity is still achievable with the time adjusted. So
   leaning on the Essential exception is a weak position.
3. **The explicit escape hatch the Working Group offers for exactly our case:** *"In cases where timing is
   not an intrinsic requirement but giving users control over timed events would invalidate the outcome, a
   third party can control the time limits for the user (for example, granting double time on a test)."*
   That is a declaration, not a control. Offer both.

Also note the rationale for the 20-second figure: *"20 seconds to hit 'any switch' is sufficient for almost
all users including those with reduced motion."* Twenty seconds is the amount of warning a switch user
needs. This is the number to design the warning interval around.

**Recommendation**

Add a time-control step to `MockSetup`, before the test starts, offering:

- **Standard** (the official Pearson timings, the default),
- **Extended 1.5×** and **Extended 2×** (satisfies the *Adjust* route: 2× is not 10×, so pair it with the
  Extend route below to be safe),
- and, inside the runner, the *Extend* route: a `role="status"` warning at 5:00 and again at 1:00 saying
  time is about to expire, plus a keyboard-reachable **"Add 5 minutes"** button that appears then and can
  be used repeatedly. One `Enter` press per extension, well inside the 20-second window.

For a *free practice* site, "turn the timer off entirely" is a legitimate and popular option too, and it
is the strongest accessibility answer. Offer it as **"Untimed practice"** in the same control. It costs one
boolean in the store and it is the option that will actually be used.

Copy the TestGorilla pattern for the shape of the control: it asks two plain questions before the test
starts, and both are about the candidate, not about the product.

### 1.2 SC 4.1.3 Status Messages (Level AA)

Source: <https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html>

A status message is a change in content that is **not a change of context** and that reports success or
results, waiting state, **progress of a process**, or the existence of errors. It must be programmatically
determinable through role or property so it can be presented **without receiving focus**.

Relevant excerpts:

- The intent is to inform **without unnecessarily interrupting work**.
- *"[An] assistive technology may choose to delay, suppress, or transform such messages so a user is not
  unnecessarily interrupted."*
- Roles named as sufficient: `status` (polite, advisory), `alert` (important and time-sensitive),
  `log` (sequential updates), `progressbar` (via live region).
- **Advisory Techniques include `role="timer"` and SCR14 "Using scripts to make nonessential alerts
  optional".**
- Explicit risk named by the Working Group: *"Live regions and alerts can be usefully applied in many
  situations where a change of content takes place which does not constitute a status message... However,
  there is a risk of making an application too 'chatty' for a screen reader user."*

For this product, the status messages that exist today and are not surfaced:

| Event | Suggested treatment |
|---|---|
| Answer recorded on Next | `role="status"`, polite: "Answer saved. Question 14 of 83." |
| Flag toggled | `role="status"`, polite: "Question 14 flagged for review." / "Flag removed." |
| Section changed | `role="status"` + move focus to the new section heading: "Section 2 of 3, Reading. 20 questions, 29 minutes." |
| Time warnings | `role="alert"` at 5:00 and 1:00 only |
| Audio / recording started or stopped | `role="status"`: "Recording started." / "Recording stopped, 41 seconds." |
| Auto-submit at 0:00 | `role="alert"` + focus moved to the review screen |

Note the SC explicitly excepts changes of context (modals, expanding components, tab switches). The
`ResultPage.tsx:207` tab list is covered by 4.1.2 Name, Role, Value instead, which is already satisfied
by `role="tablist"` / `role="tab"` / `aria-selected`.

### 1.3 The critical question: should the running countdown be announced?

**Answer: no. Exclude the running clock from live announcements, and escalate at discrete thresholds
instead.**

The guidance, in three places:

- **WAI-ARIA 1.2, `timer` role** (<https://www.w3.org/TR/wai-aria-1.2/#timer>): *"Elements with the role
  `timer` have an implicit `aria-live` value of `off`."* And: *"The text contents of the timer object
  indicate the current time measurement, and are updated as that amount changes. The timer value is not
  necessarily machine parsable, but authors SHOULD update the text contents at fixed intervals, except
  when the timer is paused or reaches its end-point."*
- **MDN, `timer` role** (<https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/timer_role>):
  *"Assistive technologies will not announce updates to a timer as it has an implicit `aria-live` value of
  `off`."* Its worked example puts the countdown in `role="timer"`, and **only at a threshold** — *"we
  manually change the role to `"alert"` when the timer reaches 10 seconds remaining so it gets announced
  once."*
- **WCAG 4.1.3 Advisory Techniques** list `role="timer"` as an advisory technique, alongside SCR14
  ("make nonessential alerts optional"). The pairing is deliberate: a timer is the canonical case of
  information that is *presented* to users but *not announced* on every change.

Why not stream it. A 1 Hz live region destroys a screen reader user's virtual buffer. Every announcement
truncates whatever they were reading, and they are reading exam passages. There is no version of "read me
the remaining time every second" that improves the experience. SC 4.1.3's intent is explicitly *not* to
interrupt.

Why not leave it silent. A screen reader user has no equivalent of peripheral vision for a shrinking
number. "Do not look at the timer too often" (the Duolingo English Test's own pacing advice) assumes a
sighted user with a peripheral. So the information has to come, just not continuously.

**Concrete implementation for `TestHeader.tsx`**

```
1. Remove aria-label from the element that has role="timer". An aria-label
   replaces the element's text in the accessibility tree, so the changing
   number is not the content a live region would announce. MDN: "If a name is
   visible, reference it using aria-labelledby" - but even then the *name* is
   not re-announced on change. Make the label a visible, static sibling:
   "Time left in this section". Leave the number as the element's own text.

2. Keep role="timer" and let its implicit aria-live="off" do its job. Delete
   the conditional aria-live prop entirely.

3. Add a sibling, visually hidden, role="status" element that receives a
   one-shot message at 5:00, 1:00 and 0:30. Set the text, then clear it on
   the next threshold so identical messages re-announce.

4. Add a real visible control next to it: a button that toggles "announce time
   warnings" on and off (SCR14, and the cheapest real accommodation for users
   who want the clock but not the alerts).
```

That is four small edits and it turns the one clearly broken piece of ARIA in the product into a correct
one.

### 1.4 SC 2.4.11 Focus Not Obscured (Minimum) (Level AA)

Source: <https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html>

*"When a user interface component receives keyboard focus, the component is not entirely hidden due to
author-created content."*

- **Named as typical causes: "sticky footers, sticky headers, and non-modal dialogs."** The test runner has
  both a sticky header (`TestHeader.tsx:20`, `sticky top-0 z-30`) and a sticky bottom bar.
- **Failure technique F110** is literally *"Failure of Success Criterion 2.4.11 Focus Not Obscured
  (Minimum) due to a sticky footer or header completely hiding focused elements."*
- **Sufficient technique C43** is *"Using CSS scroll-padding to un-obscure content."*
- Note 2: content the **user** opened may obscure the focused component if the user can reveal it without
  advancing focus (Escape, scroll keys). Content the **author** pre-positioned, such as a sticky footer,
  may not.
- Partially obscured passes; the AAA 2.4.12 requires none obscured. The recommendation is still to aim for
  none.

**Recommendation**

`scroll-padding-bottom: <bar height>` and `scroll-padding-top: <header height>` on the scroll container for
the runner. Also ensure the recorder component and the answer-option radio group never end up underneath
the bottom bar at any breakpoint, and check the microphone-permission dialog (non-modal) against this.

### 1.5 SC 2.5.8 Target Size (Minimum) (Level AA)

Source: <https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html>

**24 × 24 CSS pixels**, or the spacing exception: if a 24 px diameter circle centred on the target's
bounding box does not intersect any other target, the target passes. Notable points:

- Rounded corners count against you. A 28 px fully-round button is **undersized**, because you cannot fit an
  axis-aligned 24 × 24 square inside it. Our `rounded-full` pills and `rounded-2xl` controls need checking.
- The size is in CSS pixels and **does not change with zoom**, so it cannot be met by claiming the user can
  zoom.
- **Essential exception, explicitly covering our case:** *"an interactive data visualization where targets
  are necessarily dense."* The question-progress strip is the textbook case.
- The Working Group nonetheless advises the minimum size regardless of spacing, and points at 2.5.5
  (Enhanced, 44 px) for important controls.
- Advice: *"provide an option to increase the active target area without increasing the visible target
  size."* A `::after` overlay with negative insets is the standard implementation.

**Recommendation**

| Control | Likely status | Action |
|---|---|---|
| Question-progress dots in the sticky header | Dense, likely < 24 px | Keep dense, but add a 24 px hit area via an `::after` pseudo-element and require ≥ 4 px between dot bounding boxes. Document the Essential exception. |
| Recorder button | Probably fine | Verify ≥ 44 px; this is a primary control. |
| Audio-player transport controls | Likely the worst cluster | Check each. This is a dense, small, horizontally-packed control set. |
| `ResultPage.tsx` section tabs (`role="tablist"`) | Verify | Tabs are inline text; give them `min-h-11` and horizontal padding. |
| Flag / bookmark button | Likely small icon | Add an invisible 24 px expansion. |
| `details` / `summary` FAQ rows on the landing page | Fine (full width) | No change. |
| Anything with `active:scale-[0.98]` | Fine | Scaling does not change hit area. |

### 1.6 SC 1.4.3 Contrast (Minimum) (Level AA)

Source: <https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html>

- **4.5:1** for text; **3:1** for large-scale text (≥ 18 pt, or ≥ 14 pt bold — approximately 24 px / 18.5 px
  CSS).
- **Do not round.** 4.499:1 does not pass.
- **Exempt:** inactive (disabled) UI components, pure decoration, logotypes, and text that is part of a
  picture with significant other visual content.
- Anti-aliasing note: thin or unusual faces can render fainter than their nominal colour, so prefer a
  larger margin or a slightly heavier weight.
- "Text" explicitly includes **placeholder text** and text shown on hover or focus.
- Charts and non-text elements fall under 1.4.11 Non-Text Contrast (3:1), not this SC.

**Measured results for this palette** are in the [contrast audit](#appendix--contrast-audit). Four values
fail, all of them in code that is on the critical path.

| Where | Token pair | Ratio | Required |
|---|---|---|---|
| `Home.tsx` "of 90" label, dark | `ink-500` on `ink-900` | **2.80** | 4.5 |
| `Home.tsx` stat descriptions, dark | `ink-500` on `ink-900` | **2.80** | 4.5 |
| `Home.tsx` "Overall · CEFR" / "Weakest area" eyebrows, dark | `ink-500` on `ink-900` | **2.80** | 4.5 |
| `Home.tsx` "No signup" checkmarks, light | `mint-500` on white | **2.54** | 3 (non-text) |
| `Home.tsx` stat descriptions, light | `ink-400` on white | **3.95** | 4.5 |
| `Home.tsx` "Estimated" pill, light | `mint-600` on `mint-500/14` over white | **3.27** | 4.5 |
| Landing-page checkmarks, light | `mint-500` on white | **2.54** | 3 (non-text) — fails |

Note the last one is an icon, so 1.4.11 (3:1) applies rather than 4.5:1, and it still fails. Bumping the
check colour to `mint-600` in light mode fixes it (3.73:1) but that is the same token that fails as text
on the pill, so `mint-600` needs to go one step darker for text use. Introduce a dedicated
`--color-mint-700` for light-mode text and keep `mint-500` for fills and strokes.

### 1.7 SC 2.2.2 Pause, Stop, Hide (Level A) — not on the brief, but implicated

Source: <https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html>

Not requested, but the runner trips it and it is one line to fix. For auto-updating information that
starts automatically and is presented in parallel with other content, there must be a mechanism to pause,
stop, hide, or **control the frequency of** the update — unless the auto-updating is part of an activity
where it is essential.

The thin progress bar at `TestHeader.tsx:53-61` animates its width every second for the full length of a
section. It is auto-updating, in parallel with the question, and not user-initiated. The "essential"
exception arguably covers it, but the frequency-control branch is trivially satisfiable and the failure
mode is real for readers with ADHD or attention differences — which is a meaningful share of a test
population.

**Recommendation:** gate the width transition behind `@media (prefers-reduced-motion: no-preference)`, and
update the bar's width once per 30 seconds rather than per second, letting CSS interpolate. The visual
result is smoother, not worse, and the DOM write count drops by 95%.

---

## Topic 2 — Score visualisation

### 2.1 What is wrong with donuts and radial gauges

Source: <https://www.nngroup.com/articles/dashboards-preattentive/> (Page Laubheimer, NN/g)

- **The perceptual basis.** Of the preattentive attributes, humans judge **length** and **2D position**
  accurately and quickly. Humans are good at noticing that one area is bigger than another and **bad at
  saying how much**. The article is explicit: *"we are quite adept at estimating how lengths compare... In
  contrast, [with area] people simply perceive a difference without being able to exactly pinpoint the size
  of the difference."*
- **Donuts are worse than pies.** *"Donut charts are similar to pie charts — they use area and angle to
  encode quantitative information — but are made even less effective by the whitespace in the middle, which
  makes each slice area smaller and thus complicates even more the already difficult task of determining a
  quantitative value for each option."*
- **Pies and donuts should mostly be avoided.** *"notoriously poor at most information-communication tasks
  (other than simply showing overwhelming disparities in percentage shares) and should be avoided most of
  the time."*
- **Gauges fail on space and on angle.** *"Circular visualizations require a lot of space to communicate
  little information, and rely on angle (which is relatively poor at communicating information in a
  pre-attentive fashion) as the main means of communicating the key data."*
- **And the article names the replacement in the same figure.** It compares a Klipfolio dashboard's radial
  gauge against *"the significantly better linear bullet charts"* on the same dashboard, for the same job:
  *"quantitative data along a range, with a target value identified."*

Source: <https://www.perceptualedge.com/blog/?p=217> (Stephen Few, on the bullet graph he designed in 2005)

> *"The graphical widgets that software vendors were providing to display single measures, such as
> year-to-date sales revenue, consisted mostly of circular gauges and meters, which suffered from several
> problems. Most of them conveyed too little information, did so unclearly, and wasted a great deal of space
> on the screen. The bullet graph was my alternative, which was designed to convey a rich story clearly in
> little space."*

Few adds the mechanic that makes a bullet chart work, and it is the single most useful line in this
section: *"the intersection of the measure bar with a target line always represents good performance. It is
very easy perceptually to spot the presence or absence of this intersection of bar and line, which forms a
'T'."*

Few's own caution, which applies to our amber/rose/mint set: on reversing the qualitative scale for
lower-is-better measures, *"the background fill colors... arranged from dark gray to indicate 'poor
performance' through to the lightest gray to indicate 'good performance'... The reversed sequence serves as
a visual cue... This cue, however, is not strong."* And on using traffic-light colour instead: *"most
people who are colorblind (10% of males and 1% of females) cannot distinguish green and red, we are still
left with an overuse of color that makes the dashboard appear cluttered."*

### 2.2 The accessibility layer on top

Any chart is non-text content and needs a text alternative under SC 1.1.1. The specific guidance:

Source: <https://analysisfunction.civilservice.gov.uk/policy-store/charts-a-checklist/> (UK Government Analysis Function)

- *"The text alternative may be a data table, a text description of the message the chart is presenting, or
  both. Whatever form it is in, the text alternative should, ideally, come immediately after the chart
  itself, in the body text of a webpage or document."*
- **Not in the `alt` attribute:** *"We advise to put the text alternative in the body text and not in the alt
  attribute... because many different users may need the text alternative, and the alt attribute is not
  easy to access unless you understand HTML code or use screen reader software."*
- *"If the text description it is [sic] it should start by describing the type of chart. For example, 'a line
  chart showing . . .'."*
- **Rank bars by value**, except where the data has a natural order.
- **The axis must start at zero.** *"Even if a break in the axis is clearly signposted, the relative size of
  bars is still displayed very strongly on bar charts."*
- **Gaps between bars should be narrower than the width of a single bar.**
- Value labels on bars are useful but often fail contrast; check them if you add them.
- Provide a data download, linked with the file type and size in the link text.

Source: <https://www.datawrapper.de/academy/how-we-make-sure-our-charts-maps-and-tables-are-accessible>

- Every chart gets an **alternative description** read out by screen readers.
- Every chart gets a **"Get the data"** link, because a reader with a visual impairment can then have the
  numbers read to them in whatever way suits them.
- When an alt description is supplied, the chart body is set to `aria-hidden` so annotations are not read
  twice.

Source: <https://www.datawrapper.de/academy/how-to-write-good-alternative-descriptions-for-your-data-visualization>

- The alt formula, from data visualisation designer Amy Cesal: **`Chart type` + `type of data` + `reason for
  including the chart`.** Worked example: *"A split bars chart of different types of milk's... environmental
  impact, where cow's milk scores significantly worst in carbon emissions, land use, and water use than the
  other milk alternatives. Cow's milk produces two times more carbon emissions, uses nine times more land,
  and twice the water that rice milk uses."*
- For charts that update, give a general description plus highlighted values, and **update the alt text when
  the highlight changes.**
- Datawrapper also notes an honest alternative: *"any mention of the chart type is unnecessary: the
  visualization is a way of representing the data; if words are used instead to describe the data, there's
  no need to talk about visual elements at all."*

Source: <https://www.datawrapper.de/academy/why-our-column-and-bar-charts-start-at-zero>

- Citing Pandey, Nov, Rall, Bertini & Satterthwaite (2015), *"participants who saw the deceptive
  visualization perceived the underlying message in its exaggerated form"* and truncated axes *"do lead to
  major misinterpretation... and the effects are also rather large."*
- If the differences disappear at a zero baseline, the recommended alternatives are a **dot plot** (*"Readers
  don't expect dot plots to set a custom range"*), a **line chart** for ordered data, or plotting the
  differences themselves.

### 2.3 Are bullet charts right for target-based metrics? Yes.

Multiple independent sources converge, which is the strongest signal in this report:

- Domo: *"A bullet graph is a compact, linear visualization—similar to a progress bar—that shows a single
  metric against a target and qualitative performance ranges."* Its comparison table lists the gauge as
  *"familiar metaphor, wastes space"* and the bullet as *"space-efficient, encodes target and performance
  range."* <https://www.domo.com/learn/charts/bullet-graphs>
- Tableau's documentation describes the bullet chart as *"a bar representing the featured measure"* against
  reference markers. <https://www.tableau.com/chart/what-is-bullet-graph>
- VitaraCharts: *"Stephen Few created a bar graph version called the bullet chart. The bullet graph is used
  as a replacement for dashboard gauges and meters."* <https://docs.vitaracharts.com/readme/bullet-chart>

A bullet chart is the right answer for all four of our cases, in different configurations. A target
reference line is the feature we do not currently have anywhere, and it is the one that makes a score
actionable rather than decorative.

### 2.4 Four concrete chart recommendations

#### (a) A single score out of 90

**Use: a linear range bar with a measure bar, band boundary ticks, and the number in text.**

- Full-width track spanning **0 to 90**, explicitly labelled at both ends so the zero baseline is visible.
- A filled measure bar from 0 to the score.
- **CEFR band boundaries as thin vertical rules** across the track (typically 50 / 60 / 70 on the 10-90
  scale for C1 / B2 / B1), with the band names set once beneath the track, not repeated in a legend.
- The number **61** set large in the body face, with `/ 90` as a smaller, lower-contrast companion, in the
  same typographic group as the axis rather than floating in the middle of a circle.
- The CEFR band and IELTS concordance stated clearly beneath, sharing the same left edge.
- **The estimated portion rendered as a distinct, patterned or lower-opacity segment of the same bar**,
  with the exact-vs-estimated split labelled. This replaces the `Estimated` pill, which currently
  communicates the same fact in a place the eye has to travel to.

**Do not use a donut.** One value has no parts to compare; the arc is a progress ring wearing a chart's
clothes. The "OF 90" label at 10 px inside the ring is also the single worst contrast failure in the app
(2.80:1 in dark mode).

Implementation note: a range bar is a `div` with two absolutely-positioned children, or an SVG with
`preserveAspectRatio="none"`. Either is cheaper and more accessible than the current `strokeDasharray`
circle. If the bar is decorative, mark it `aria-hidden="true"` and put the full sentence in the DOM as
text. That is the cheapest complete WCAG-conformant chart in this report.

#### (b) A score against a CEFR band boundary

**Use: Few's bullet chart. Qualitative bands, a bold target rule, the measure bar crossing or not
crossing it.**

- Background: three or four light grey steps, one per CEFR band, arranged along the 0-90 axis, labelled
  once below.
- A **bold vertical target line** at the band boundary that matters for the user (e.g. 60 for B2, 70 for
  C1). This is the "T" junction Few describes. It is instantly readable: the bar crosses the line or it
  does not.
- The measure bar on top, one colour, no gradient.
- A **second, lighter target line** for the user's *actual* target university score, so they can see the
  gap between "the band" and "the number my university wants".
- Nearest-label callout: *"2 points above the B2 boundary."* Not a colour, not a badge, a sentence.

This is also the correct form for the per-item trait scores in `ResultPage.tsx:399-418` ("Estimated
traits"), which are currently bare percentages. Same component, smaller, without the number repeated as a
percentage: a trait score should be shown against that trait's maximum, with the target rule.

Few's warning applies directly: **do not colour the bands red/amber/green.** Use a grey ramp, and reserve
a single accent for the target rule. Colour-vision deficiency affects roughly 8% of men and 0.5% of women
(NN/g), and in the PTE audience, with a large share of test-takers from India, China and other regions
with high male colour-vision-deficiency prevalence, this is a substantial fraction of users.

#### (c) Four sub-scores comparatively

**Use: four identical range bars in a small multiple, on a shared 0-90 scale, sorted descending, one
colour.**

- All four bars share a scale. Put the axis (0 / 45 / 90) once, on the left of the group, and the CEFR tick
  on all four so the comparison against the boundary is direct.
- **Sort descending.** NN/g: values are easiest to interpret in ascending or descending order, and the
  exception (natural order like time or age) does not apply to four skills. Sorting also puts the weakest
  skill first, which is the thing the user came for.
- **One colour for all four.** The current `bg-brand-500 / bg-mint-500 / bg-amber-500 / bg-rose-brand`
  assigns four hues to four values. Hue is categorical; there is no category here, and colour implies a
  quality judgement (rose reads as "bad", mint as "good") that the data does not support. NN/g: *"people
  do not perceive different colors as being in a particular order, so color should not be used to
  communicate information about quantitative values or magnitude."*
- Instead: one neutral bar colour, and a single accent used on exactly one bar, the weakest, reinforced by
  the text label. This satisfies the "spend the boldness in one place" rule from
  [Topic 4](#topic-4--design-language-2025-2026).
- Keep the current behaviour of bars starting at zero. It is correct. `Home.tsx:308` already divides by 90
  from zero.

This is the case where the current design is **nearly** right. It is four horizontal bars on a shared
scale. Adding a visible axis, sorting, dropping the four hues, and adding the CEFR tick finishes it.

#### (d) Accuracy by question type

**Use: a horizontal bar chart, sorted ascending, with counts printed, plus a real table.**

- **Sort ascending by accuracy.** The weakest types at the top. The exception in the UK Gov checklist
  ("except when data follows a natural order, like age or time") does not apply; if you want the official
  order, offer it as a sort toggle.
- **Print `n` on every row.** *"Fill in the Blanks (Table) — 3 of 5"* is already the pattern in
  `Home.tsx:319` and it is the right one. Accuracy without a denominator is not information: 100% of 2 and
  71% of 45 are not comparable. The existing copy in the result page already models this well.
- **One colour.** Highlight the weakest with the accent plus a text label. Same rule as above.
- **Group by section** with a subheading per section, and let the section name be the group label rather
  than a colour.
- **Provide a table view.** A real `<table>` with `<caption>`, `<th scope="col">`, and one row per
  question type: type, section, items, correct, accuracy, points lost. This satisfies 1.1.1 and 1.4.3 at
  once, is the format the UK Analysis Function recommends, and is what a screen reader user actually
  wants. Make it the default on small screens and available as a toggle on large ones.
- **A "Get the data" / download-this-report link** underneath, in the Datawrapper sense. Free, and it
  differentiates against every competitor that does not have it.
- **Never a radar chart.** Radar is the same area-and-angle problem as the pie, plus axis-order dependence.
- Because 22 rows is a dense interactive visualisation, the **Essential exception in SC 2.5.8** is
  available if the rows are tightly packed. Use it, and keep 24 px row targets anyway.

### 2.5 Chart do-nots, consolidated

| Do not | Instead | Source |
|---|---|---|
| Donut for the overall score | Linear range bar | NN/g, Perceptual Edge |
| Radial gauge for a trait score | Bullet with target rule | NN/g, Few |
| Truncated axis on any bar | Zero baseline, or a dot/range plot | Datawrapper, Pandey et al. 2015 |
| Four hues for four sub-scores | One colour, one accent on the weakest | NN/g |
| Red/amber/green CEFR bands | Grey ramp + one accent target rule | Few, Datawrapper |
| Accuracy without `n` | `3 of 5` on every row | UK Analysis Function |
| Chart with no text alternative | Body-text description + data table | UK Analysis Function, Datawrapper |
| Alt description buried in `alt` | Real DOM text adjacent to the chart | UK Analysis Function |
| Radar chart | Sorted horizontal bars | NN/g |

---

## Topic 3 — Test-runner UI patterns

Three real products, scraped from their own candidate-facing documentation.

### 3.1 Duolingo English Test

Source: <https://englishtest-static.duolingo.com/media/resources/test-taker-guide/DET%20Guide%20EN.pdf> (Official Guide for Test Takers, 2026 edition)

What it does:

- **Publishes the question-type frequency table in advance**, with a range for each type: Read and Select
  15-18, Fill in the Blanks 6-9, Read and Complete 3-6, Listen and Type 6-9, Interactive Reading 2 sets of
  6, Interactive Listening 2 sets of 8-10, Write About the Photo 3, and so on. It also states *"You will
  see each of the different question types at different frequencies throughout your test"* and *"the
  number of each question type may vary for each test and test taker."*
- **A video walkthrough** of the entire test, including setup and upload, published before test day.
  *"One of the best ways to learn about the structure of the test is to watch the video walkthrough."*
- **Explicit permission to not watch the clock:** *"While taking the test, don't look away from the screen or
  exit out of the test application. Try not to look at the timer too often."* This is a direct instruction
  to de-emphasise the timer. It is the single best piece of evidence for the timer design in this report.
- **Explicit statement that a wrong answer costs no more than a blank**, per type, with the one exception
  spelled out: *"you will be penalized more for missing a word than mistyping the word."* This removes the
  incentive to flag-for-review entirely.
- **Review your open responses after submission.** *"You will be able to review your responses to these
  samples after the test has concluded."*
- Names the timing per section, and normalises it: *"The test is designed to measure your English
  proficiency rather than your knowledge of the test, you could take it right now if you wanted to!"*

What to copy:

1. **Publish our own question-type frequency table**, generated from the blueprint. We have
   `ALL_QUESTION_TYPES` and the assemble logic; the table is a render away. It is the highest-value
   de-risking move in the whole runner, because PTE candidates' dominant anxiety is the unknown.
2. **Copy the "you are never penalised more for a wrong answer than a blank" line**, per question type, as
   reassurance in the item header. It is true of most PTE objective items and it directly removes the
   reason a flag-for-review feature exists.
3. **Reduce the timer's visual weight.** The DET instructs users to ignore it. Ours is a 28 px monospace
   number in a filled rounded box that changes colour and gains a pulse animation at 60 seconds. The
   current escalation (`animate-pulse-ring` at `critical`, amber at `warning`) inverts the guidance: it
   makes the timer the most attention-grabbing element on the screen. Make it quiet at normal and
   authoritative at warning; drop the pulse ring and honour `prefers-reduced-motion`.
4. **A short orientation item or section walkthrough** before the clock starts.

### 3.2 TestGorilla

Source: <https://candidates.testgorilla.com/hc/en-us/articles/19092940874395-Comprehensive-guide-to-taking-your-assessment>

The most thorough candidate-facing UX documentation of the three. Its pre-test sequence is:

1. **Landing page** with a quick form.
2. **Welcome screen** listing, in this order: welcome message; **number of tests, individual questions,
   and expected completion time**, with the note *"It may take you less time than estimated, but it cannot
   take more"*; **how to navigate**, which includes *"The assessment is timed. A timer is shown per test
   and/or per question"* and *"You can use pen, paper, and calculator"*; and technical requirements.
3. **Accommodations and accessibility settings.** Two questions only:
   - *"Are you fluent in the language of the assessment?"* → No triggers an accommodation.
   - *"Do you have a condition that affects your memory or concentration?"*
   The rationale is stated plainly: *"In a timed assessment, like what we offer, these things could put you
   at a disadvantage."*
4. **Honesty agreement** as an explicit checkbox, before the test.
5. **Camera and mic setup** with a recommended recorded test video: *"We recommend recording a quick test
   video to ensure everything is working properly. This will help reduce stress when you reach any
   video-based questions."*
6. **Practice questions** that do not count: *"Your answers to these questions do not contribute to your
   final score, nor does the employer see your answers to them."*

In-test patterns:

- **Confirmation dialog on an irreversible action.** *"To prevent you from accidentally skipping a
  question, a message pops up asking you to confirm your choice."* And: *"Once skipped, you cannot go back
  and answer a question... Skipped questions count as wrong answers."*
- **Focus/distraction control by hiding, not by nagging.** *"You must remain in full-screen mode while
  taking the assessment. If you try to leave full-screen, the current question will be hidden until you
  return."* The penalty is loss of the ability to read the question, not a scolding dialog.
- **Breaks between tests, with permission to close the window.** *"If you take a break, you can close the
  window. When you're ready to start again, do so by following the link found in your invitation."*
- **Feedback between tests**, explicitly anonymous and explicitly not shown to the employer.

What to copy:

1. **The accommodations screen, verbatim in spirit.** Two plain questions, taken before the clock starts,
   framed around the candidate's circumstances rather than the product's rules. This is the cheapest
   possible SC 2.2.1 accommodation and it is a *better* one than a raw "extend time" dropdown because it
   catches the cases a dropdown cannot ask about.
2. **The welcome screen's content list.** Number of sections, items, expected duration, what you may use,
   what you may not. All before the clock.
3. **The mic self-test.** We have a recorder; make the setup step record three seconds and play it back.
   "Reduce stress when you reach any video-based questions" is exactly right for PTE Speaking.
4. **The break screen between sections.** Ours is implicit (the section just changes). It should be
   explicit: what is coming, how many items, how long, and an explicit acknowledgement that this is the
   last chance to go back. TestGorilla lets you close the window; we should at least say the timer stops.
5. **Confirmation on the one irreversible action.** For us that is *Submit test* at the end, not *Next*.
   One tap from the last question to a lost two-hour attempt is the real risk in this UI.

What to avoid: full-screen lock-in with no escape. We have nothing to gain from it (no proctoring, no
integrity claim that matters) and it is a hard blocker for anyone with a screen reader, a switch device, or
a second monitor. The DET takes the opposite approach and simply tells you not to look away.

### 3.3 HackerRank Proctor Mode

Source: <https://support.hackerrank.com/articles/5663779659-proctor-mode>

Relevant because it documents the gating pattern, not because we should copy proctoring.

- **The test does not start until a system check passes.** *"The test does not begin until all
  requirements are met."*
- **Rules and consent are acknowledged explicitly before the test**, not buried in a terms link: candidates
  *"review and acknowledge a list of prohibited actions, such as switching tabs or using external tools."*
- **Violations are flagged and logged silently, not surfaced as interruptions.** *"Attempts to exit
  full-screen mode or switch browser tabs are automatically flagged and logged."* The user is not
  interrupted; a report is produced afterwards.
- **Post-test report rather than in-test scolding**, with labelled screenshots and flagged events.

What to copy: the gating. A pre-flight check that verifies the browser can play the synthesised audio and
can record audio, and *refuses to start* until both pass, is a much better experience than discovering a
broken microphone at item 23 of 83. Given our audio is device-synthesised and recording uses the Web Speech
API, the failure modes are real and knowable in advance.

What to avoid: everything about proctoring. It is a distraction-control model aimed at employer fraud
prevention, and every element of it is a cost with no benefit for a free practice site.

### 3.4 The PTE-specific tension: the real exam has no going back

Multiple sources, including candidate accounts, confirm that the real PTE Academic does not permit
returning to previous questions in any section. Pearson's own format material
(<https://www.pearsonpte.com/pte-academic/test-format/>) offers no revisit affordance and no flagging.

This puts the current runner in an awkward position. The sticky bottom bar with **Back / Next** is a
fidelity claim the product is simultaneously contradicting: `Home.tsx:137` says the mock *"reproduces the
structure, the clock and the pressure of the actual PTE Academic"*, and then gives the user a Back button
the real test does not have.

There is a defensible resolution, and it is a copy change rather than a feature change:

- **Keep Back.** Removing it would make the product materially worse for practice, and the user knows the
  difference between a mock and the exam.
- **Label it as a deviation, in the setup screen, in one sentence:** *"On test day you cannot go back to a
  previous question. Here you can, so use it to learn the material properly. After that, the next mock runs
  in forward-only mode."*
- **Offer a forward-only mode** in mock setup, for candidates within a few weeks of their test date. It is a
  boolean in the store and it is the single most persuasive feature for the highest-intent segment of the
  audience, which is the segment that will leave a review.

On **flag-for-review**: with Back available it is largely redundant, and a flag count in the header
(`TestHeader.tsx:35-37`) is a second, competing answer to "where am I". The DET's position is the better
one: tell the candidate they are not penalised for a blank, and drop the flag. If we keep the flag for
forward-only mode, it needs a legend in the progress strip and a filter, otherwise it is a second piece of
chrome nobody reads.

### 3.5 Runner summary

| Concern | Recommendation | Source basis |
|---|---|---|
| Question progress | Question-type frequency table published pre-test; a section-and-index indicator in the header; progress **per section**, not per test, since PTE timing is per section | DET, Pearson |
| Timer | Quiet by default, no pulse; visible monotonic time left; one-shot `role="status"` warnings at 5:00 / 1:00; extend control | DET, WAI-ARIA, WCAG |
| Focus / distraction | No full-screen lock. A calm, uncluttered runner with no notification chrome. If anything: hide the sticky header on scroll-down, restore on scroll-up | TestGorilla (anti-pattern), DET |
| Flag for review | Remove in back-navigable mode; keep with a legend in forward-only mode | DET |
| Section break | An explicit interstitial: what is next, item count, duration, "the clock resets for this section", and the last chance to review flagged items | TestGorilla, Pearson |
| Irreversible actions | One confirmation dialog, on Submit only | TestGorilla |
| Pre-flight | Gate the start on an audio and microphone self-test | HackerRank, TestGorilla |

---

## Topic 4 — Design language 2025-2026

The central finding is that AI-generated design converges **twice**, and the second convergence is the
one most sites are now in.

Source: <https://github.com/funboy322/avoid-ai-design> and its
<a href="https://raw.githubusercontent.com/funboy322/avoid-ai-design/main/references/ai-tells-catalog.md">tells catalogue</a>
(67 catalogued tells, each with a detection signal, a severity rank by who notices it, and a fix).
Percentages cited there come from a Playwright analysis of roughly 1,400 recent Show HN sites.

### 4.1 The two orders of default

**First order — the median.** Inter everywhere. Purple or indigo gradient. Centered hero over three rounded
icon cards. `rounded-2xl shadow-lg backdrop-blur` on everything. "Elevate your workflow" / "Get Started".

**Second order — the tasteful escape.** Once everyone learned to avoid the purple, the escapes converged
too. The catalogue lists five clusters that AI design now gathers around, sourced from Anthropic's own
`frontend-design` skill:

1. Warm cream ground + high-contrast serif + terracotta or clay accent (Claude's own UI colour, `#D97757`).
2. Near-black ground + a single acid-green or vermilion accent.
3. **Broadsheet: hairline rules, zero border radius, dense newspaper columns.**
4. **The SaaS card kit: identical rounded cards, one radius, one soft grey shadow.**
5. **Template chrome: tracked ALL-CAPS eyebrows, `A · B · C` meta strings, `WORD — fragment` labels,
   tinted near-black standing in for black, monospace for small data labels, `→` on every link.**

De-slopping passes land in order two constantly. The honest test the catalogue gives: **would you have
arrived here for any similar page? If yes, it is a default.**

A third order is forming: a handmade "anti-AI" reaction (grain, hand-drawn type, scrapbook collage). The
catalogue's warning is that it is legitimate when the subject earns it and the next reflex when reached for
to look human.

### 4.2 What this product currently does that reads as default

| Tell | Severity | Where | Why it reads as default |
|---|---|---|---|
| **T1: Inter for everything** | **P0** | `index.css` `:root` / body | *"Inter is the default font, which is different"* from a bad font. *"When a reader sees Inter on a marketing site, the message is that nobody chose anything."* A single family with no display face. |
| **T5 / SD4: tracked ALL-CAPS eyebrow above most headings** | **P1** | `.label` utility, `index.css:214`; used throughout | *"Anthropic ranks all-caps labels among the commonest tells, so this moved from P2 to P1."* Fix: *"Keep a label only when it carries information the heading does not. Set it in the body face, sentence case."* |
| **C7: dark mode you didn't ask for** | **P1** | `index.css:108` `@apply bg-ink-900` | *"A recurring 2026 tell. The model reaches for a dark hero because its training data is full of them, not because the product wants one."* The caveat applies: an exam hall is dim and a 2-hour test is a long session, so **dark-first is defensible here** — but it must be a themed palette, which brings us to the next row. |
| **C3: the stock "modern dark" cluster** | **P1** | `#0b1120` + `ink-500` body | *"Dark background, low-contrast medium-grey body text... Low body contrast also fails accessibility."* Our 2.80:1 `ink-500` is exactly this. |
| **SD8: the emerald fallback** | **P1** | `mint-500 #14b88c` | *"With purple ruled out, emerald is the next reflex; tell catalogs now list the 'emerald fallback'."* Our mint accent on a neutral navy ground, with no brand reason, is this. |
| **K2 / SD4: the SaaS card kit** | **P1** | `.card`, `.card-solid`, `rounded-2xl`, `shadow-card` — on every element | *"Border plus shadow plus white background, applied to everything. If every element is a card, no element is important."* |
| **L2: three icon cards in a row** | **P0** | `Home.tsx:141` (3 sections), `Home.tsx:175` (3×2 features) | *"The most generic AI layout that exists... The three-column card row is the wrong container for it."* Two instances on one page. |
| **L4: the stock section order** | **P1** | hero → stats → features → FAQ → CTA | Named directly in the catalogue as a tell. |
| **SD7: fake product shot** | **P2** | `Home.tsx:255` `ScorePreview` | *"The stock product shot when there is no product shot; show a real screenshot or a specific, real state of the product."* It is a mock of a state the user has not reached. |
| **C1/C2: indigo as the unchosen brand hue** | **P0** (as a default) | `brand-500 #3665f6` | We avoided the *purple* gradient, which puts us one step from `blue-500`. The fix is not "pick a different nice colour"; it is **derive the palette from the subject**. |
| **Type weight > bold** | craft | `font-extrabold` (800) on the h1, stat numbers, the score, CTA h2 | *"No weights above bold"* is the stated rule; 800 is a reflex, not a decision. |
| **C4: timid, evenly distributed palette** | P0/P1 | brand + mint + amber + rose all at similar weight | *"AI spreads color evenly and avoids commitment. Intentional brands do the opposite: one dominant color carries the page, an accent punctuates it."* The 60/30/10 rule. |
| **Decorative motion** | P2 | `animate-pulse` dot in the hero badge, `animate-pulse-ring` on the timer, gradient washes on the hero | *"If an animation does not help the user understand the interface, it is a cost with no return."* |

**Also flagged: two near-identical sans faces.** Inter + JetBrains Mono is not a pairing, it is one face and
its typewriter cousin. The catalogue's rule: *"Mono is for code and tabular data a reader actually scans,
not decoration."* This gives a **clear, principled line for this product**: JetBrains Mono stays on the
countdown, the clock, the score, and the item numbers — everything a reader genuinely scans in a fixed
grid. It comes off every decorative label.

### 4.3 The directions, and which one this product should take

The catalogue's method: **ground the direction in the subject before choosing a style.** *"These are
words, not a menu. Picking a style from a list is how a skill grows its own slop: twelve named looks
become twelve new defaults."*

The subject here is a **test**. Its world is made of: exam booklets and answer sheets, OMR scan sheets,
score reports and band descriptors, section timetables, the CD player and the microphone, the proctor's
clipboard, the wall clock, the printed rubric, the candidate's own marked-up practice paper.

Its world already prints, which is where the type and colour should come from: **the score report and the
band descriptor scale.** Those are dense, ruled, tabular, monochrome with one status colour, and set in
whatever face a results publisher uses.

Three of the twelve directions fit, and the catalogue's own quick-reference table confirms it:

- **#3 Swiss / International typographic** — *"Fits: data products, dashboards, anything that values
  clarity."* One neutral grotesque at several weights. Mostly monochrome, one signal colour. Strict modular
  grid, flush-left, mathematical spacing, **whitespace as structure**. *"The grid is the design."*
- **#9 Industrial / utilitarian / technical** — *"Fits: infrastructure, B2B, engineering tools."* Mono or a
  technical grotesque, small and dense. Greyscale with one functional accent, **status colours that mean
  something**. Dense, table-driven, information-first, tight spacing where density helps. **"Labels,
  technical readouts, a spec-sheet feel. Density as honesty."**
- **#2 Editorial, but only as the type layer** — *"A strong type system carries personality with almost no
  performance cost."* Pair a serif display with a quiet body sans and run it on the Swiss grid. The
  catalogue's blend example is literally this: *"editorial type on a Swiss grid."*

The four to refuse explicitly, because they are the live second-order defaults:
cream + terracotta (SD1), near-black + acid green (SD2), broadsheet cosplay (SD3), **the SaaS card kit
(SD4 — this is what the product is currently built out of)**, and template chrome (SD4 chrome — this is
what the `.label` utility is).

The catalogue's calibration rule is the right instruction here: *"A landing page can be loud; a settings
panel should be quiet and exact."* Inverted for us: **the landing page should be quiet and exact; the
2-hour runner should be almost silent.**

### 4.4 What to change, concretely

**Palette — derive it, don't pick it.**

The most defensible move for a PTE product: take the ground and ink from **printed exam paper and the
score report**, and take the single accent from the **one thing that means something** in this domain,
which is the CEFR band. Everything else becomes grey.

- One dominant ground (the current navy is fine; it just needs to stop being accompanied by four equally
  loud accents).
- One ink at AA or better.
- **One signal colour**, reserved for the CEFR boundary marker and the primary action. Everything else
  greyscale. This kills SD8 (emerald fallback), C4 (timid even palette) and the red/amber/green band
  problem from [Topic 2](#2-4-b-a-score-against-a-cefr-band-boundary) in one move.
- Status colours (rose for wrong, amber for flagged) stay, because here they genuinely mean something.
  Few's rule: status colours are legitimate where they encode state, unlike decorative hues.
- Fix the contrast failures from the [audit](#appendix--contrast-audit) at the same time.

**Typography — one family at four weights, plus a real mono role.**

- Drop `font-extrabold` to `font-bold` (700). Nothing above bold.
- Move off Inter, or commit to a pairing. The catalogue is explicit that replacing one default font list
  with another (*"the tasteful free font cluster": Space Grotesk, Geist, Instrument Serif, Fraunces*) just
  creates the next default. So: **do not swap Inter for Manrope because a blog said to.** Find the face
  from the subject, or keep Inter and make it work through scale and weight discipline. The honest
  position is that Inter is not disqualifying on its own — it is disqualifying when it is the *only*
  gesture.
- Add `text-wrap: balance` on headings and `text-wrap: pretty` on body. Two lines, removes orphaned words.
- Sentence case everywhere, including buttons and labels. Keep the eyebrow only where it carries
  information the heading does not.

**Components — break the card kit.**

- `.card` should mean "a thing with elevation" and apply to maybe three things per page, not everything.
  Between cards, use a rule or a background shift. The catalogue's formulation: *"Use background colour
  alone or spacing alone, and keep real cards for where elevation means something."*
- `rounded-2xl` everywhere is the tell. Use a consistent radius, chosen once, and let it be smaller. If
  the direction is industrial, `rounded-md` on controls and `rounded-none` on table cells is a decision
  rather than a default.
- **The 3×2 "What the report shows you" grid becomes a real screenshot of the actual report**, with the
  features called out as annotation on the screenshot. This is simultaneously the anti-tell fix and the
  [Topic 6](#topic-6--landing-page-for-free-tool-seo) conversion fix. One change, two problems.
- **Delete the pill badges** except where they encode a real state. `Home.tsx:267` has an "Estimated" pill
  and `Home.tsx:63` a "22 question types" pill; the first is a real state and should become part of the bar
  itself, the second is decoration and should become text.

**Motion — comprehension only.**

- Delete the hero radial-gradient washes. *"The purple-to-indigo hero gradient is the most recognizable AI
  fingerprint there is. Linear, radial, and mesh gradients all read the same way."* The replacement is not
  a different gradient; it is texture (grain), imagery, layering, or a tinted shadow. Or, for this
  direction, none of those: a flat ground and a real artefact.
- Delete the `animate-pulse` dot in the hero badge and the `animate-pulse-ring` on the timer. The DET
  explicitly tells candidates not to watch the clock; a pulsing ring is the opposite instruction.
- Gate everything on `prefers-reduced-motion`. The catalogue lists *"animation that ignores
  reduced-motion"* as a P1 tell in its own right.

**Layout — one direction, consistently, across every page.**

The catalogue's cross-page-consistency tell is P0 (*"design-system drift: font, color, radius, nav, or
  footer that changes from page to page"*). Given that we have eight page types, this is where drift is
  most likely. Write the decision into a `DESIGN.md` and build every page from it, as the catalogue
  recommends.

**Cross-page test to run before shipping:** render every page as a black-and-white block outline at
thumbnail size. If the landing page, the setup page, the runner, the result page and the dashboard are
indistinguishable from that distance, the design is at the default.

---

## Topic 5 — Microcopy for presenting an estimate

The product's whole value proposition is a number the user will act on, produced by a model that is
explicitly not Pearson's. Getting this wrong is not a tone problem. It is the trust problem.

### 5.1 The framework

Source: van der Bles, van der Linden & Freeman, *"Communicating uncertainty about facts, numbers and
science"*, Royal Society Open Science 6(5), 2019.
<https://royalsocietypublishing.org/rsos/article/6/5/181870/95102/Communicating-uncertainty-about-facts-numbers-and>

The framework is built on Lasswell's model (who, what, form, to whom, to what effect) and gives the
vocabulary the copy needs.

**The key distinction, §3.3 — two levels:**

- **Direct uncertainty** — about the number itself. Communicated quantitatively: a distribution, a
  confidence interval, a margin of error, a range, or a verbal qualifier.
- **Indirect uncertainty** — the quality of the underlying evidence, i.e. meta-uncertainty about your own
  method. Communicated as caveats or an ordered categorical scale.

**The key finding for us, §6.5:**

> *"The preliminary conclusion that explicitly acknowledging uncertainty does not always lead to an
> inherent decrease in public trust or credibility, though, is worth noting."*

And the closing line of the paper, which is the brief for this section:

> *"Our hope is that this structured approach will allow you to communicate the epistemic uncertainty that
  exists about facts, numbers and science confidently and unapologetically — an approach we like to call
  **'muscular uncertainty'**."*

**The warning, §6.5:** *"people's understanding of numbers seems more consistent, [but] there is still
scope for variability in interpretation, for example, when it comes to different interpretations of
distributions underlying numerical ranges."* Specifically, people do not know whether to read the lower,
midpoint, or upper value as the likely true value. **So a range must be labelled with its centre**, or the
user will read the wrong end.

### 5.2 Established patterns, from the paper's own real-world survey

The paper catalogues nine expressions of direct uncertainty in decreasing order of precision (figure 2),
and then finds real examples of each. The relevant ones:

**Expression ii — a summary of a distribution, communicated numerically or visually.** Confidence
intervals, error bars, margins of error. The Iraq casualties case: *"601 027 deaths up to June 2006 (95%
confidence interval of 426 369–793 663)."*

**Expression iii — a rounded figure or range.** The tiger survey: *"The survey estimated the population to
range between 1945 to 2491 with a mean estimate of 2226 tigers."* **This is the exact pattern we want**:
a range with a named point inside it. Note that "mean estimate" is stated, not implied.

**Expression iv — a predefined category.** The IPCC's calibrated vocabulary: *"Likely" is defined as
66–100% likelihood.* A category that is **defined numerically** works.

**Expression v — a single number with a qualifying verbal statement.** The ONS on GDP: *"UK gross
domestic product was estimated to have increased by 0.4% in Quarter 3 2017, a similar rate of growth to
the previous two quarters"* and, in the supporting documentation, *"The estimate is subject to revision as
more data become available, but the revisions are typically small between the preliminary and third
estimates of GDP, with no upward or downward bias to these revisions."*

**Expression viii — no mention of uncertainty.** The ONS on inflation: *"The Consumer Prices Index... was
2.8% in October 2017."* Manski calls this *"the 'incredible certitude' in official economics statistics,
given that they are commonly reported as point estimates without adequate attention paid to
uncertainties."* The paper's finding is that statistical offices do this **in the headline** and put the
range **in a separate "Quality and methodology" section, with limited prominence** — and cites that as a
critique, not as a model.

**The failure mode to avoid, Box 4.** The IARC scale: *"This scale does not give any numerical
interpretation to 'probably', and gives no information about the size of any carcinogenic effect, leading
to considerable confusion in public communication."* Processed meat and cigarettes are in the same bucket
*"not because they are equally carcinogenic, but because the evidence around each is judged equally
suggestive of a link."*

**This is the direct warning against inventing a "confidence: High / Medium / Low" badge.** If we ship
one, it must have a stated numeric meaning, or we have built an IARC.

### 5.3 The credit-score precedent, which is the closest analogue

Credit scores are the most widely understood "estimate of an unobservable thing" in existence, and the
established UI pattern is well settled. FICO and VantageScore both score 300-850 and both publish
banded ranges: *Good 670-739*, *Very Good 740-799*, *Excellent 800-850*, each with a plain-English
description. The number is given as a point; the **meaning** is given as a band with a description;
nobody pretends the last digit is meaningful.

What transfers to PTE: the **banded range with a description** is the model. The FICO pattern does not
hedge in prose and it does not pretend to precision. It says a number, gives the band, and describes the
band in words the user can act on.

The FICO pattern does **not** transfer: the "very good/excellent" tiering with no published mapping from
band to consequence. We know exactly what each PTE band unlocks (university thresholds, visa
requirements), so our bands should carry that.

### 5.4 Patterns to adopt

**1. Point + range + named centre.** Expression iii, the tiger pattern. Never a range without a centre,
because people read the wrong end of a bare range (§6.5).

> `61 / 90` — `Likely 57 to 65.`

**2. Attribute the estimate; do not apologise for it.** The strongest trust signal available to us, and
`ResultPage.tsx:371-397` already does a version of it. Sharpen it into one sentence with a denominator:

> `Estimated from 83 items. 51 items are scored exactly; 32 speaking and writing items are estimated from
> the PTE trait rubric.`

This is direct and indirect uncertainty in one line, and it is far more credible than either alone.

**3. Name the source of the uncertainty, in the paper's four categories** (§3.2): natural variation /
measurement difficulty / limited knowledge / expert disagreement. For us:

> `Two things make this an estimate: one recorded sample is a small sample of your ability, and speaking
> and writing are scored by a model rather than two Pearson raters.`

This is doing real work. It explains the two specific reasons the number could be wrong, and both are
things the user can act on.

**4. State the caveat once, at the top, in plain words. Then use the number confidently everywhere else.**

Repeating "estimated" on every value on the page converts a caveat into a disability. The RSOS finding is
that acknowledging uncertainty does not inherently reduce trust. Hedging twenty times is a different
behaviour and it will read as a product that does not believe in itself.

**5. If you use "likely", give it a number.** The IPCC's *"likely" = 66-100%* is the good version. A bare
"likely" is the IARC problem. So: *"likely 57-65"* is fine because the numbers carry it; *"this is likely
about right"* is not.

**6. Never round to false precision, and never invent a confidence scale.** If you show a band, derive it
from something real: the user's own attempt history, or a stated method floor.

**7. Give an action that reduces the uncertainty.** The most under-used device available. Our own history
is the honest, personalised band:

> `Across your last 3 mocks your overall score has ranged 58 to 65. Two more attempts will narrow this.`

**8. Frame the estimate as a rehearsal, not a prediction.** This is what the product actually is, and it
is a stronger position than a prediction anyway:

> `This is the score your answers would earn under the PTE trait rubric. Treat it as a rehearsal of test
> day, not a forecast of your Pearson result.`

**9. Separate the auto-scored and estimated items in the visual, not just in the prose.** See
[Topic 2](#2-4-a-a-single-score-out-of-90). A patterned segment inside the bar communicates the split
without a badge, and it is the version a screen reader user gets for free as a table.

### 5.5 Copy set to use

| Slot | Copy |
|---|---|
| Page-level caveat, once | "Estimated from 83 items. 51 are scored exactly; 32 speaking and writing items use the PTE trait rubric. Likely 57 to 65." |
| Method, in the "How this is scored" panel | "Two things make this an estimate: one attempt is a small sample of your ability, and speaking and writing are scored by a model rather than by Pearson raters." |
| Per-item label | "Model answer" / "Answer key" (already present, `ResultPage.tsx:532`). Keep. |
| Per-item trait line | "Estimated traits: content 78% of the available credit" (already close, `ResultPage.tsx:549`). Keep, and add the target rule from [2.4b](#2-4-b-a-score-against-a-cefr-band-boundary). |
| Number itself | "61 / 90". No qualifier, no tilde, no asterisk. |
| CEFR line | "About B2, upper intermediate. The B2 boundary is 60." |
| Progress / repeat | "Across your last 3 mocks: 58 to 65." |
| FAQ answer, accuracy question | Rewrite. Current text is one long hedge that reads as a disclaimer. Split into the exact/estimated split first, then the reason, then the reassurance. |

**Copy to remove.** Any "approximate", "rough", "not official", "may not be accurate", or bare "estimated"
attached to a number without a range beside it. And the em dash, which is the fastest tell of
machine-written copy in 2026 and appears throughout the current FAQ answers.

### 5.6 A warning about the FAQ answer already in the product

`Home.tsx:16` currently reads: *"Those are estimates for practice, not official Pearson scores, and the
results page labels every item as either auto-scored or estimated."*

This is a *disclaimer*, not an explanation. It tells the user what the product is not and asks them to go
find the reassurance elsewhere. The `RSOS` survey is clear that expression (v), a number with a
qualifying statement that names the reason and the magnitude, is what works. Rewrite it to the pattern in
5.4 and it becomes the most persuasive paragraph on the page instead of the most defensive one.

---

## Topic 6 — Landing page for free-tool SEO

Target query: **"free PTE mock test"**.

### 6.1 What the free-tools SEO literature says

Source: Ryan Law (Ahrefs), *"The Free Tools SEO Strategy: How to Rank With Calculators, Converters, and
Generators"*, 16 July 2026. <https://ahrefs.com/blog/the-free-tools-seo-strategy/>

- **Tools are the highest-traffic non-article page type on the internet.** *"Some of the highest-traffic
  pages on the internet aren't articles. They're tools. A grade calculator. A file converter... Each one
  answers a search that a blog post never could, because the searcher doesn't want to read, they want to
  do."*
- **They are resilient to AI search, which is the strategic argument for 2026.** *"Informational written
  content is exactly what AI Overviews, AI Mode, and ChatGPT are best at synthesising... A tool is much
  harder to summarise out of existence. AI Overviews can describe how to convert a file or calculate a
  margin, but it can't hand the user the working converter or the interactive calculator."* A timed
  mock test is even harder to summarise than a calculator: it cannot be compressed into a paragraph
  because the deliverable is the sitting of it.
- **One page can rank for hundreds of keywords.** *"Done right, one tool can rank for hundreds of keywords
  and keep earning traffic for years."* The mechanism is the long tail, not the head term.
- **The head term is not winnable; the niche variants are.** Their worked table contrasts `mortgage
  calculator` (KD 81), `calorie calculator` (KD 86) and `gpa calculator` (KD 54) against `amazon fba
  calculator` (KD 20), `deck material calculator` (KD 9), `roof pitch calculator` (KD 13). *"The winnable
  keywords are the niche ones. Search volume is lower, but so is difficulty... Find the opportunity closest
  to your niche."*
- **The page does one job and the traffic converts into the product.** Gusto's free paycheck calculator
  pulls ~17,800 US visits/month, *"every one of those visitors is a small-business owner working out what
  to pay someone, which is exactly who Gusto wants running payroll through their product."*
- *"A free tool that does one job well earns links, return visits, and goodwill in a way another blog post
  rarely does."*

**Implication for "free PTE mock test".** That is a head term with a KD in the 70s and incumbents that
have spent a decade on domain authority. Do not plan the page around ranking it. Plan around the long
tail that only a site with an actual working mock can rank for:

- `pte academic full mock test`
- `pte mock test no signup`
- `pte practice test 22 question types`
- `pte academic mock test with score report`
- `pte mock test timed 2 hours`
- `pte academic scoring practice`
- `pte reading fill in the blanks practice`
- `pte describe image practice`
- …one per question type, all linking to `/practice`

Every one of those is a page a competitor with a five-question quiz cannot produce. That is the moat, and
it is why **the practice/drill page should be linkable per question type** (`/practice/fill-in-the-blanks`,
`/practice/describe-image`). That is the programmatic surface, and it is a genuine user need, not a
doorway-page trick.

### 6.2 What is above the fold now, and what is wrong with it

`Home.tsx:48-106`. The hero has: a pill badge with a pulsing dot, an h1, a subhead, two CTAs, a
four-item reassurance list, and a `ScorePreview` card containing a donut.

**What is working, and should be kept:**

- **The h1 names the specific outcome:** *"Free PTE Academic mock tests, scored the moment you finish."*
  Not "Learn English with AI". The Ahrefs and Unbounce sources both land on specificity.
- **The two-CTA split** (full mock / one skill) matches the two intents behind the keyword.
- **The four reassurance claims** — No signup, No payment, Works offline once loaded, No data leaves your
  device. This is the objection-handling that a 2-hour commitment demands, placed above the fold, which is
  exactly where Unbounce's above-the-fold guidance puts a clear value statement. Keep it. It is the
  strongest thing on the page.
- **The stats band immediately below the fold** (22 question types / 3 real sections / N+ items / $0).
  This is the "proof" job, it is real, and it is crawlable text. Keep.
- **The FAQ, and specifically the accuracy FAQ.** Answering "how accurate are your scores" on the landing
  page is a genuine differentiator and it is a strong long-tail target in its own right. Keep the
  question; rewrite the answer per [Topic 5](#topic-5--microcopy-for-an-estimate).

**What is working against best practice:**

1. **The `ScorePreview` is a fake product shot** (tell SD7). It is a mock of a state the user has not
   reached, showing invented numbers (Mock Test 14, 61, 68/62/58/55) that no user will ever see. The
   catalogue's fix: *"Show a real screenshot or a specific, real state of the product."* The Ahrefs
   argument makes the business case too: the page's job is to hand the visitor the thing, not describe it.
2. **It is a donut** — [Topic 2](#2-1-what-is-wrong-with-donuts-and-radial-gauges). It also has the worst
   contrast failure in the app inside it (the `text-[10px]` "OF 90").
3. **The `animate-pulse` dot in the badge** is decoration, and badges are template chrome.
4. **The `radial-gradient` hero washes** (lines 49-59) are the C1/gradient tell, in a product that has no
   business imitating a SaaS hero.
5. **The section order is the stock order** (hero → stats → features → FAQ → CTA), named as a P1 tell.
6. **Two three-card grids on one page** (`Home.tsx:141` and `Home.tsx:175`) — the most-cited AI layout
   tell, used twice.
7. **The "$0 forever" stat tile** is 25% of the stats band spent on the one claim that is already
   covered by the reassurance list above the fold. It dilutes the three substantive tiles.
8. **No single sentence states the duration where it matters most.** *"Your next mock takes about two
   hours"* is currently the *last* section on the page. Two hours is the single biggest objection to
   starting. It belongs in the hero.

### 6.3 Recommended above the fold

**Replace the `ScorePreview` with a runnable artefact.** Two options, in order of preference:

- **A 40-second sample.** A single real item, drawn from the real bank, scored by the real scoring path,
  producing the real report shape. "Try one item now — takes 40 seconds, no signup." This is the Ahrefs
  pattern exactly (one input, one output, immediately), it is the strongest possible demonstration, and it
  is genuinely link-earning because it is the only version of this page that a competitor cannot
  replicate with text.
- **A real screenshot of a real report,** from a real attempt, with real numbers, taken from the actual
  `ResultPage`. Cheaper by a day. Pair it with the `ScorePreview`'s current strength: the *"Weakest area"
  callout, which is the most persuasive line on the card and should be a real example.

**Revised hero, in order:**

1. **Duration and scope in the h1 or immediately under it.** *"A full 2-hour PTE Academic mock, 22 question
   types, in your browser."* The h1 stays as the outcome sentence; the scope line goes directly beneath.
2. **One primary CTA.** "Start a full mock test" stays primary. Demote "Practise one skill" to a text link
   beside it — two equal-weight buttons splits the intent and the Ahrefs evidence is that a tool page does
   one job.
3. **The real artefact or the 40-second sample**, replacing the card.
4. **The four reassurance claims, unchanged.** Already correct.
5. **One line on what the score is.** Link to the scoring page. This is the objection the FAQ currently
   handles eight scrolls down.

### 6.4 Recommended section order

Mapping onto the five jobs the CRO sources identify (stop the scroll → earn trust → explain value →
remove doubt → make the ask), and the Ahrefs one-job principle:

| # | Section | Job | Note |
|---|---|---|---|
| 1 | Hero: outcome, duration, scope, primary CTA, four no-\* claims, real artefact | Stop the scroll | One CTA |
| 2 | **The 22 question types table** — official Pearson timings, point contribution, items per type | Earn trust | **New. The link-earning asset.** |
| 3 | Stats band (22 / 3 / 83 scored items / N+ items) | Earn trust | Keep; replace the `$0` tile with `83 scored items` |
| 4 | A real report screenshot with annotated callouts | Explain value | Replaces the 3×2 card grid |
| 5 | The three sections, as a **table or a ruled list**, not three cards | Explain value | The section timings are the substance |
| 6 | How the scoring works, linking to `/scoring` | Remove doubt | Names the estimate explicitly, per [Topic 5](#topic-5--microcopy-for-an-estimate) |
| 7 | Before you start: what you need, how long, what to do about time, microphone | Remove doubt | Fold the accommodations control link here |
| 8 | FAQ | Remove doubt | Keep; rewrite the accuracy answer |
| 9 | CTA | Make the ask | Keep, but it is now the third time the primary CTA appears, which is correct for a page with this much scroll depth |

**Section 2 is the one that matters for SEO.** A table of the 22 question types with the official timings
and point contributions, generated from `blueprint.ts` — the same data the test runs on — is a real
reference artefact. It is crawlable text, it cannot be summarised out of existence by an AI answer
engine, it is directly useful to the searcher, and it is what earns the links that the Ahrefs free-tool
strategy is built on. It also answers a question the current page does not: *what is actually in the
test?*

### 6.5 Trust signals that matter most here, in order

Not "trusted by X users" — worthless at zero users, and a tell. In descending order of credibility for
this specific product:

1. **The claim that the product is not doing what it isn't.** `Home.tsx:90-92` already has *"No data
   leaves your device"* and *"Works offline once loaded"*. Both are verifiable and both are unusual. Make
   them verifiable: link to the About page, show the item count that is actually stored locally.
2. **The scoring methodology, published in full, with a date and a name on it.** Anyone can claim
   "estimated". Publishing the trait rubric, the scoring weights and the known limitations is a stronger
   signal than any testimonial, because it is falsifiable.
3. **The question-type table with official Pearson timings**, cross-referenced to Pearson's own format
   pages. Citing the source you are imitating is a trust signal.
4. **Honesty about what is *not* real exam material.** `Home.tsx:31` already says it: *"No real exam
   material can be reproduced."* That sentence is a trust asset and it should be higher on the page, not
   buried in the fourth FAQ. Publishers that admit the limit are trusted more than publishers that do not.
5. **The item bank size**, stated precisely. `bankCapacity()` is a real number; use it. Per the
   [Topic 4](#4-3-the-directions-and-which-one-this-product-should-take) catalogue: *"Round invented
   numbers. Models produce these when filling a slot. Real numbers are lumpy."*
6. **The microphone is optional and the test still works.** `Home.tsx:19-22` says this. It is a real
   differentiator and it removes the top hardware objection. Consider promoting it above the fold.

---

## Appendix — contrast audit

Computed from the tokens in `src/index.css` against the WCAG 2.2 relative-luminance formula, sRGB.
Thresholds: **4.5:1** normal text, **3:1** large text (≥24px, or ≥18.5px bold) and non-text UI/graphics
(SC 1.4.11), **3:1** for the focus indicator.

### Fails

| Pair | Ratio | Needs | Location | Fix |
|---|---|---|---|---|
| `ink-500` `#4a5c7d` on `ink-900` `#0b1120` | **2.80** | 4.5 | `Home.tsx:121` (stat descriptions, dark), `Home.tsx:288` ("OF 90"), `Home.tsx:292` ("Overall · CEFR"), `Home.tsx:315` ("Weakest area"), `ResultPage` | Change `dark:text-ink-500` → `dark:text-ink-400` (4.76) or `dark:text-ink-300` (8.56) |
| `mint-500` `#14b88c` on white | **2.54** | 3 (icon) | `Home.tsx:329` `CheckIcon`, light mode | Use `mint-600` in light mode; add a `--color-mint-700` for text |
| `ink-400` `#6c81a4` on white | **3.95** | 4.5 | `Home.tsx:121` (stat descriptions, light) | Use `ink-500` (6.73) |
| `mint-600` `#0d9673` on `mint-500/14` over white | **3.27** | 4.5 | `Home.tsx:267` "Estimated" pill, light | Introduce a darker mint for text-on-tint, or change the pill to `ink`-based with the accent as a rule |
| `ink-300` `#9fb0cb` on white | **2.20** | 4.5 | `index.css:207` `placeholder:text-ink-300`; any light-mode use | Use `ink-500` |

### Passes worth recording

| Pair | Ratio | Note |
|---|---|---|
| `ink-100` `#eaeff7` on `ink-900` | 16.31 | Dark-mode body text. Fine. |
| `ink-300` on `ink-900` | 8.56 | The `.label` utility in dark mode. Fine. |
| `ink-500` on white | 6.73 | Light-mode body text. Fine. |
| `ink-500` on `ink-50` | 6.33 | Fine. |
| white on `brand-500` `#3665f6` | 4.83 | Primary button. Passes, but with almost no margin. Any opacity reduction or a lighter hover state fails. Hover `brand-600` is 7.01. |
| `brand-500` on `ink-900` | 3.90 | Passes 1.4.11 (3:1) for the section dots at `Home.tsx:154`. Does **not** pass 4.5:1 if ever used as text in dark mode. |
| `mint-500` on `ink-900` | 7.41 | Progress-bar fill. Passes 1.4.11 comfortably. |
| `mint-300` on `ink-900` | 12.49 | Fine. |
| `brand-300` on `ink-900` | 9.18 | Fine. |
| `amber` `#f5a524` on `ink-900` | 9.23 | Fine as text. |
| `rose` `#f4526b` on `ink-900` | 5.62 | Passes 4.5:1. Fine. |

### Non-text contrast to check separately (SC 1.4.11, 3:1)

- The `bg-ink-200` / `dark:bg-white/10` donut track behind the mint arc: 1.5:1 in light. It is decorative
  (the value is in the text), so it is arguably exempt, but the donut goes away anyway per
  [Topic 2](#2-4-a-a-single-score-out-of-90).
- The 0.5 px progress bar track and its fill: fill is fine (7.41). Track is 1.5:1. Same reasoning.
- `border-ink-200` `#ccd7e8` on white: 1.6:1. Card borders. If a card border is the only thing
  distinguishing a control from the background, this is a 1.4.11 failure. The catalogue's recommendation —
  use a background shift rather than a border — resolves it and simultaneously breaks the card kit.

---

## Sources

**WCAG 2.2 (W3C)**
- [SC 2.2.1 Timing Adjustable](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html)
- [SC 2.2.2 Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html)
- [SC 4.1.3 Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html)
- [SC 2.4.11 Focus Not Obscured (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html)
- [SC 2.5.8 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
- [SC 1.4.3 Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- [WAI-ARIA 1.2, `timer` role](https://www.w3.org/TR/wai-aria-1.2/#timer)
- [MDN, `timer` role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/timer_role)

**Data visualisation**
- [NN/g — Dashboards: Making Charts and Graphs Easier to Understand](https://www.nngroup.com/articles/dashboards-preattentive/)
- [Stephen Few, Perceptual Edge — Bullet Graphs for Not-to-Exceed Targets](https://www.perceptualedge.com/blog/?p=217)
- [UK Government Analysis Function — Accessible charts: a checklist of the basics](https://analysisfunction.civilservice.gov.uk/policy-store/charts-a-checklist/)
- [Datawrapper — How we make sure our charts, maps and tables are accessible](https://www.datawrapper.de/academy/how-we-make-sure-our-charts-maps-and-tables-are-accessible)
- [Datawrapper — How to write good alternative descriptions](https://www.datawrapper.de/academy/how-to-write-good-alternative-descriptions-for-your-data-visualization)
- [Datawrapper — Why our column and bar charts start at zero](https://www.datawrapper.de/academy/why-our-column-and-bar-charts-start-at-zero)
- [Domo — What is a bullet graph](https://www.domo.com/learn/charts/bullet-graphs)
- [Tableau — What is a bullet graph](https://www.tableau.com/chart/what-is-bullet-graph)
- [VitaraCharts — Bullet chart](https://docs.vitaracharts.com/readme/bullet-chart)
- Cleveland & McGill (1985), "Graphical Perception and Graphical Methods for Analyzing Scientific Data", *Science* 229(4716) — cited via NN/g and Perceptual Edge

**Test products**
- [Duolingo English Test — Official Guide for Test Takers (PDF, 2026)](https://englishtest-static.duolingo.com/media/resources/test-taker-guide/DET%20Guide%20EN.pdf)
- [TestGorilla — Comprehensive guide to taking your assessment](https://candidates.testgorilla.com/hc/en-us/articles/19092940874395-Comprehensive-guide-to-taking-your-assessment)
- [HackerRank — Proctor Mode](https://support.hackerrank.com/articles/5663779659-proctor-mode)
- [Pearson PTE Academic — Test format](https://www.pearsonpte.com/pte-academic/test-format/)

**Design language**
- [avoid-ai-design — README](https://github.com/funboy322/avoid-ai-design)
- [avoid-ai-design — AI design tells: catalog](https://raw.githubusercontent.com/funboy322/avoid-ai-design/main/references/ai-tells-catalog.md)
- [avoid-ai-design — Aesthetic directions](https://raw.githubusercontent.com/funboy322/avoid-ai-design/main/references/aesthetic-directions.md)
- [jacob perks — How to stop your frontend looking AI-generated](https://medium.com/design-bootcamp/how-to-stop-your-frontend-looking-ai-generated-efbb9681a6a2)
- [Select Interactive — Web Design Trends 2026 That Actually Survive Performance Budgets and AI Agents](https://www.select-interactive.com/news/web-design-trends-2026-that-survive-performance-and-ai-agents)

**Uncertainty communication**
- [van der Bles, van der Linden & Freeman (2019), "Communicating uncertainty about facts, numbers and science", *Royal Society Open Science* 6(5)](https://royalsocietypublishing.org/rsos/article/6/5/181870/95102/Communicating-uncertainty-about-facts-numbers-and)
- [myFICO — What is a credit score](https://www.myfico.com/credit-education/credit-scores)
- [Experian — What is a good credit score](https://www.experian.com/blogs/ask-experian/credit-education/score-basics/what-is-a-good-credit-score/)

**Landing pages / SEO**
- [Ahrefs — The Free Tools SEO Strategy (Ryan Law, 16 Jul 2026)](https://ahrefs.com/blog/the-free-tools-seo-strategy/)
- [Unbounce — 40 best landing page examples of 2026](https://unbounce.com/landing-page-examples/best-landing-page-examples/)
