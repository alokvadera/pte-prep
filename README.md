# PTE Prep

Free, unlimited PTE Academic mock tests that run entirely in the browser.

Full-length timed tests across all 22 official question types, with an instant
score report, per-item feedback, CEFR band and progress history. No account, no
payment, no backend — which is also why hosting costs nothing.

---

## Why it costs $0

The whole product runs client-side. There is no server to operate, no database
and no per-request cost, and the listening/speaking audio is synthesised by the
visitor's own device instead of streamed from a server. The build output is a
folder of static files, so any free hosting tier covers it indefinitely.

| Need | How it is met | Cost |
| --- | --- | --- |
| Hosting | Static files on Cloudflare Pages / Netlify / Vercel / GitHub Pages | $0 |
| Audio | Browser speech synthesiser (local on macOS, Windows, iOS, Android) | $0 |
| Practice material | Original passages, lectures and charts written for this site | $0 |
| Storage | IndexedDB in the visitor's browser | $0 |
| Scoring | Deterministic rubric in the page — no model to run | $0 |
| Images | SVG drawn from data at runtime; PNG icons generated from a script | $0 |

---

## Getting started

```bash
npm install
npm run dev          # http://localhost:5173
```

Build and serve the production output the way a host would:

```bash
npm run build
npm run serve        # http://localhost:5200
```

### Configure the domain once

```bash
cp .env.example .env
# edit SITE_ORIGIN
```

That single value drives every canonical URL, the Open Graph URLs and
`sitemap.xml`. Leave it unset and the build still works — canonicals fall back to
relative URLs and the running site resolves them against its own origin.

---

## Deploying

The build command is `npm run build` and the publish directory is `dist` for
every one of these.

**Cloudflare Pages** — `public/_headers` and `public/_redirects` are already
configured. Set `SITE_ORIGIN` in the Pages environment variables.

**Netlify** — `netlify.toml` is already configured. Set `SITE_ORIGIN` in the
environment.

**Vercel** — `vercel.json` is already configured. Set `SITE_ORIGIN` in the
project environment.

**GitHub Pages** — `.github/workflows/deploy.yml` builds and publishes on every
push to `main`. Optionally set a `SITE_ORIGIN` repository variable for a custom
domain. Without it, the workflow deploys to `https://<owner>.github.io/<repo>/`
and sets `BASE_PATH=/<repo>/` automatically so assets, links, the router and
the PWA manifest keep working under the sub-path (override with a `BASE_PATH`
repository variable if needed).

### Cloud sync secret (required)

The optional account and cloud-sync features run in `functions/` on Cloudflare
Pages. They sign session tokens with `JWT_SECRET`, and there is deliberately no
fallback value: if the secret is missing or shorter than 32 characters, every
auth request fails with a 500 rather than falling back to something guessable.

```bash
npx wrangler secret put JWT_SECRET   # paste 32+ random characters
# e.g. head -c 48 /dev/urandom | base64
```

Set it before enabling the account UI. Changing it invalidates every existing
session, which signs everyone out — the intended behaviour after a leak.

The rest of the backend is set up with:

```bash
npm run d1:migrate          # creates the users and attempts tables
```

---

## SEO

Search engines do not reliably execute JavaScript, and a client-rendered app
serves them an empty `<div id="root">`. So the public routes are rendered to
real HTML at build time by `scripts/prerender.mjs`, which:

- renders each indexable route to static `dist/<route>/index.html`,
- builds each page's `<head>` from the shared metadata registry,
- writes `sitemap.xml`, `robots.txt` and a real `404.html`,
- marks the root element so the client hydrates that markup instead of
  discarding it.

All of the metadata lives in `src/seo/meta.ts` — one registry that both the
prerenderer and the client read, so the two can never disagree.

Also in place: unique title/description/canonical per route, Open Graph and
Twitter cards, JSON-LD (`WebApplication`, `FAQPage`, `HowTo`, `ItemList`,
`BreadcrumbList`), a single `<h1>` per page, semantic sections and tables,
`aria-label` text alternatives for the generated charts, and a static OG image.

Add content pages by adding an entry to `PAGE_META` and listing the route in
`scripts/prerender.mjs`.

---

## How scoring works

Every rule Pearson publishes is implemented exactly, transcribed from the 2026
Score Guide. The full transcription, with sources, is in
[`docs/PTE_KNOWLEDGE.md`](docs/PTE_KNOWLEDGE.md).

- **All-or-nothing** items: 1 point or nothing.
- **Fill in the blanks**: one point per correct blank, no penalty for the rest.
- **Write from Dictation**: one point per word spelled correctly, no penalty.
- **Negative marking**, at −1 per wrong selection, on exactly three of the 22
  types: both Multiple Choice Multiple Answers types and Highlight Incorrect Words.
- **Re-order Paragraphs**: one point per *correctly ordered adjacent pair*, so a
  run of three boxes earns two points and the item maximum is one less than the
  number of boxes. Not all-or-nothing.
- **The zero gates**: when Content or Form scores 0, the item scores nothing,
  however well the other traits scored. An essay under 120 words is a zero.
- **Form bands** are type-specific: 200–300 words for the essay, 50–70 for
  Summarize Spoken Text, one complete sentence for Summarize Written Text.
- **Eight types are integrated** and feed two communicative skills each.
- **CEFR bands** are Pearson's: 85–90 C2, 76–84 C1, 59–75 B2, 43–58 B1,
  30–42 A2, 10–29 A1.

Pearson scores speaking and writing with a proprietary model that cannot be
reproduced outside their scoring system. This site instead applies a documented
rubric over the same four constructs, using signals a browser can measure:

| Construct | How it is estimated |
| --- | --- |
| Content | Key-term coverage of the source, with a length-aware match so a well-developed answer is not punished for being long |
| Form | Spelling near-misses on key vocabulary, repeated five-word sequences, terminal punctuation, capitalisation |
| Structure | Sentence count, linking words and phrases, paragraph layout |
| Range | Sentence length and length variety |
| Oral fluency | Measured words per minute, pause frequency, speech-to-silence ratio |
| Pronunciation | Pitch and energy variation from the recorded audio |

Raw points are then converted to the 10–90 scale with a curve that reproduces
the shape of the published scale, rounded to the nearest 0.5 as Pearson reports.
Pearson states plainly that the overall score is **not** an average of the four
skill scores — it is a single item-response-theory scaling, and those parameters
are not published. Ours is the closest honest approximation, and the results page
says so.

**Every constructed score is an estimate.** The results page marks each item as
either auto-scored or estimated so it is always clear which part of the number
to trust. Answers recorded with a microphone in a browser that supports speech
recognition are scored considerably more accurately than typed ones, and the
difference is visible in the report.

If a microphone is unavailable, every speaking item can still be answered by
typing.

### Adding a model-based scorer later

The current scorer is deliberately deterministic and runs entirely in the
browser — no model, no network, no cost, and the same result every time. It is
isolated behind one function so a model-based scorer can be added without
touching the UI:

- `scoreItem(item, key, response)` in `src/domain/scoring.ts` is the single
  entry point. It returns `{ points, ratio, status, notes, reference }`, and
  every surface — the results page, the review list, the per-type breakdown,
  the progress history — reads from that shape and nothing else.
- `buildReport(...)` in the same file aggregates those per-item results into the
  four skill scores, the overall score and the CEFR band.
- `ItemScoreDetail.notes` is where model feedback belongs; the review UI already
  renders it per item.

A model call would need to be made server-side, since it cannot run in the
browser without shipping the weights. That would make `scoreItem` async and
would introduce the only network dependency in the app, which is why it is not
built in.

---

## Design

The visual language is written down in
[`docs/design/spacing-system.md`](docs/design/spacing-system.md). Its short name
is Marked Paper: the interface is a marked exam paper, because the two real
artefacts of this product are the answer sheet a candidate fills in and the result
they get back.

Separation is a hairline or a shift in value — there are no shadows, no resting
blurs and no gradients, and a surface is square because a form is square. The
palette is paper white, a graphite ink, and exactly one colour that means
something: vermilion, for a lost point, attention and the focus ring. Type has
three voices, all self-hosted so there is no third-party request and the app works
offline: Instrument Sans for everything structural, Instrument Serif only for
measured figures set large, IBM Plex Mono only for machine values. There are no
all-caps tracked labels, and the interface speaks plain English: the progress page
is called Progress, not Telemetry.

Accessibility is part of the design rather than a pass over it: `scripts/contrast.mjs`
audits 71 token pairs and is part of `npm run verify`, `scripts/contrast-render.mjs`
audits what actually renders, and the design research that motivated the work is in
`docs/DESIGN_RESEARCH.md`. The earlier directions are archived in
`docs/design/Calibrated-Silence.md` and its companion plate.

---

## Aceternity UI components

The project is wired for the official Aceternity shadcn registry.
`components.json` maps the `@aceternity` namespace to
`https://ui.aceternity.com/registry/{name}.json`, so any registry
component installs with the normal shadcn command:

```bash
npx shadcn@latest add @aceternity/spotlight
# or ask the agent: "install the Aceternity aurora background"
```

Registry components import `cn` from `@/lib/utils` (provided) and
animate with `motion/react` — `motion`, `lucide-react`, `clsx` and
`tailwind-merge` are installed as prerequisites.

Three MCP servers are configured for component discovery and install,
in `.mcp.json` (Claude Code / Command Code, project scope) and
`.cursor/mcp.json` (Cursor). Restart the client after changing them.

| Server | Command | Role |
| --- | --- | --- |
| `shadcn` | `npx shadcn@latest mcp` | Official. Search, view and install across the shadcn and `@aceternity` registries |
| `aceternityui` | `npx aceternityui-mcp` | Aceternity search, component info, install commands, categories |
| `aceternity-ui` | `aceternity-ui-mcp-server` | Aceternity component browse/search plus usage prompts |

The setup guide's first server (`aceternity-mcp` by devinoldenburg,
installed via pipx) no longer exists: PyPI returns 404, the GitHub
repo is gone, and the npm package was unpublished on 2026-08-06.
`aceternity-ui-mcp-server` (yeshsurya) fills the same discovery role
and is the one configured here. Install it with
`npm install -g aceternity-ui-mcp-server`.

The full registry catalogue (295 items), the designs that fit each of
the nine pages, and the hand-built → official swap map are in
[`docs/ACETERNITY-DESIGNS.md`](docs/ACETERNITY-DESIGNS.md).

## Project layout

```
src/
  domain/        Test blueprint, mock assembly, scoring, types
  content/       Original passages, lectures, conversations, charts
  components/    Question types, test runner, audio, recorder, charts
  pages/         Routes
  seo/           Metadata registry, head serialisation, structured data
  lib/           Text analysis, speech synthesis, microphone capture
  store/         Zustand stores
  db/            IndexedDB wrapper
docs/
  PTE_KNOWLEDGE.md   Everything the format and marks system require, sourced
  DESIGN_RESEARCH.md Design and accessibility research, with recommendations
  design/            The visual philosophy and the plate that expresses it
scripts/
  prerender.mjs      Static HTML, sitemap, robots
  gen-assets.mjs     PNG icons and the Open Graph image
  render-plates.mjs  Renders the design plate from the philosophy
  contrast.mjs       WCAG 1.4.3 audit of the palette
  smoke.ts           Engine test: 111 assertions, 33 from the Score Guide
  browser-check.mjs  Headless Chrome: hydration, SEO, and a full test run
  serve.mjs          Host-accurate static server for local verification
components.json    shadcn config with the @aceternity registry
.mcp.json          MCP servers (Claude Code / Command Code)
.cursor/mcp.json   MCP servers (Cursor)
```

---

## Verifying

```bash
npm run verify    # typecheck, lint, and the engine test
npm run build     # typecheck, bundle, prerender
npm run test:browser   # needs a Chrome binary and a running `npm run serve`
```

`scripts/smoke.ts` checks the content bank, mock assembly, every scoring path,
and 33 assertions transcribed from the Score Guide itself — the adjacent-pair rule
for Re-order Paragraphs, the −1 deductions, the zero gates, the Form bands and the
CEFR boundaries. `scripts/contrast.mjs` audits 25 colour pairs against WCAG
1.4.3. `scripts/browser-check.mjs` drives headless Chrome through every route,
sits a full mock end to end, and fails on hydration mismatches, console errors
or missing metadata.

`docs/PTE_KNOWLEDGE.md` records everything this project needs to know about the
format and the marks system, sourced line by line. `docs/DESIGN_RESEARCH.md`
records the design and accessibility research.

Both suites found real bugs during development — a reading-section assembly
fault, blank-marker mismatches, a connective counter that always returned zero,
a content-similarity function that could not score a perfect answer, a service
worker that served the home page for every URL, and a section clock that expired
the instant it started.

---

## Content and independence

All practice material was written for this project, at the same academic level,
word count and style as the real test. No real exam material is reproduced.

PTE Academic and the PTE logo are trademarks of Pearson Education Ltd. This is an
independent practice tool, not affiliated with, endorsed by, sponsored by or
approved by Pearson. Scores produced here are estimates for practice and are not
official Pearson scores.
