# Aceternity UI — designs for this site

Catalogue of the Aceternity UI registry, pulled live through the three MCP
servers (`shadcn`, `aceternityui`, `aceternity-ui`), with the designs that
fit this site's nine pages detailed and mapped.

Everything here is **code, not image files**: each component is a shadcn-style
React component fetched from the official registry, and each has a live demo
page (with a screenshot) at `https://ui.aceternity.com/components/<slug>`.
The `registry:block` entries are full page sections — heroes, CTAs, FAQs,
auth forms, stats — that drop in as a set of files.

## Installing any of these

```bash
npx shadcn@latest add @aceternity/<name>
# or the full URL form the registry publishes:
npx shadcn@latest add https://ui.aceternity.com/registry/<name>.json
```

Dependencies are already in `package.json`: `motion` (the registry imports
`motion/react`, not framer-motion), `lucide-react`, `clsx`, `tailwind-merge`,
and `cn` from `@/lib/utils`. One component needs an extra package:
`multi-step-loader` requires `@tabler/icons-react`.

Respect `prefers-reduced-motion`: every component here animates, so gate the
flashy ones behind a media query on the practice/test screens.

## The expanded catalogue (295 registry items)

### Backgrounds and atmosphere
| Component | What it looks like | Deps |
| --- | --- | --- |
| `aurora-background` | Subtle southern-lights gradient waves | motion |
| `background-beams` | SVG beams drifting up, collision variant explodes on click | motion |
| `background-lines` | SVG paths animating in a wave pattern | motion |
| `background-gradient` / `background-gradient-animation` | Animated gradient washes | motion |
| `wavy-background` | Layered sine waves | motion |
| `meteors` | Beams streaking across a container | motion |
| `shooting-stars` + `stars-background` | Night sky with meteors | motion |
| `vortex` | Swirly particle vortex, built for CTAs | motion |
| `spotlight` / `spotlight-new` | Radial highlight following the cursor | none |
| `grid` | Perspective grid floor, arcade style | motion |
| `sparkles` | Configurable particle sparkles | motion |
| `background-boxes` | Hover-highlighting box grid | motion |
| `glowing-stars-effect` | Stars that glow on card hover | motion |
| `canvas-reveal-effect` | Dot field that expands on hover | none |
| `svg-mask-effect` | Cursor-reveal mask | motion |
| `tracing-beam` | Beam that follows scroll path | none |
| `lamp-effect` | Linear-style lamp glow over section headers | motion |
| `dotted-glow-background` | Dots with opacity glow animation | motion |
| `background-ripple-effect` | Grid of cells that ripple when clicked | motion |
| `noise-background` | Film grain overlay | none |
| `scales` | Diagonal/hatched graph-paper pattern — zero deps, pure Tailwind | none |
| `dither-shader`, `cloud-shader`, `dot-distortion-shader`, `lines-gradient-shader`, `spotlight-shader`, `ribbon-gradient-shader` | WebGL shader backgrounds | motion + WebGL |
| `chromatic-image` | RGB-split image treatment | motion |

### Text and typography
| Component | What it looks like | Deps |
| --- | --- | --- |
| `flip-words` | Words flip in word-by-word, letter-by-letter with blur | motion |
| `text-flipping-board` | Split-flap departure board, scrambles then lands | motion |
| `text-generate-effect` | Text fades in word by word | motion |
| `typewriter-effect` | Types like a terminal | none |
| `text-hover-effect` | Gradient outline on hover (x.ai style) | motion |
| `colourful-text` / `squiggly-text` | Per-letter colour / squiggle underline | motion |
| `container-text-flip`, `layout-text-flip` | 3D text flips on scroll | motion |
| `encrypted-text` | Decrypting-character scramble that resolves | motion |
| `ascii-art` | ASCII art renderer | none |

### Layout and structure
`bento-grid`, `layout-grid` (click-to-animate masonry), `timeline` (sticky
header + scroll beam), `sticky-scroll-reveal`, `feature-section` (3 demo
variants), `hero-highlight`, `container-cover`, `parallax-scroll` (+ `-2`),
`parallax-hero-images`, `hero-parallax`, `container-scroll-animation`,
`macbook-scroll`, `card-stack`, `infinite-moving-cards` (marquee),
`3d-marquee`, `animated-testimonials`, `carousel`, `images-slider`,
`apple-cards-carousel`, `animated-modal`, `animated-tabs`, `sidebar`,
`expandable-cards`, `focus-cards`, `text-reveal-card`, `tooltip-card`,
`link-preview`, `animated-tooltip`, `following-pointer`, `direction-aware-hover`,
`lens`, `compare` (draggable side-by-side), `notch`, `sticky-banner`.

### Cards
`card-hover-effect`, `card-spotlight`, `glowing-effect`, `wobble-card`,
`glare-card`, `3d-card`, `3d-pin`, `evervault-card`, `moving-border`,
`hover-border-gradient`, `comet-card`, `draggable-card`, `evervault-card`,
`images-badge`.

### Navigation
`floating-dock` (macOS dock with magnification), `floating-navbar`,
`navbar-menu` (full-screen menu), `resizable-navbar` (shrinks on scroll).

### Buttons and input
`magnetic-button`, `stateful-button` (idle→loading→success), `tailwindcss-buttons`,
`placeholders-and-vanish-input`, `gooey-input`, `input`, `label`,
`file-upload`, `keyboard` (typing visualiser).

### Data, demo and utility
`terminal` (mac terminal that types bash with syntax highlighting — self-contained,
optional key sounds via `/sounds/sound.ogg`), `code-block`, `multi-step-loader`
(needs `@tabler/icons-react`), `loader`, `image-generation-loader`,
`world-map`, `globe`, `3d-globe`, `github-globe`, `scales`, `pixelated-canvas`,
`webcam-pixel-grid`, `collaborative-cursors`, `dynamic-island`.

### Design blocks (`registry:block`) — full page sections
Heroes: `hero-section-demo-1`, `playful-hero-section`, `hero-section-with-multi-color-background`,
`hero-section-with-mesh-gradient`, `hero-section-with-flickering-lights`,
`hero-section-with-beams-and-grid`, `hero-section-with-noise-background`,
`hero-with-centered-image`, `modern-hero-with-gradients`, `two-column-with-image`,
`full-background-image-with-text`, `minimal-hero-section-with-parallax-images`,
`hero-with-image-and-scales`, `hero-with-chat-input`, `hero-with-fluid-gradient-and-planner`,
`hero-section-with-hub`, `hero-section-with-tabs`, `hero-section-with-infinite-scroll-cards`.

CTAs: `cta-with-background-noise`, `cta-with-dashed-grid-lines`, `cta-centered-masonry-gallery`,
`cta-with-masonry-images`, `cta-with-right-gradient-and-animation`, `cta-with-centered-text`,
`simple-cta-with-images`.

Features: `features-section-demo-1/2/3`, `features-with-sticky-scroll`,
`three-column-features-with-image`, `feature-grid-with-minimal-illustrations`,
`feature-grid-with-motion-and-tabs`, `feature-grid-with-illustrations-and-bento`,
`features-with-isometric-blocks`, `features-with-square-edges`, `multicolored-features`,
`dither-features`.

FAQ: `frequently-asked-questions-accordion`, `simple-faqs-with-background`,
`faqs-with-grid`, `faqs-with-dashed-lines`.

Auth: `login-signup-minimal`, `login-with-socials-and-email`, `login-form-with-gradient`,
`simple-login-with-grid-lines`, `premium-auth-split` (WebGL shader),
`registration-form-with-images`.

Stats: `stats-for-changelog`, `stats-with-number-ticker`, `stats-with-grid-background`,
`stats-with-gradient`.

Footer/nav: `simple-footer-with-four-grids`, `footer-with-grid`, `footer-with-big-text`,
`centered-with-logo`, `navbar-classic`, `navbar-mega`, `navbar-pill`, `navbar-underline`.

Testimonials: `testimonials-marquee-grid`, `testimonials-masonry-grid`,
`testimonials-grid-with-centered-carousel`, `testimonials-with-carousel`,
`testimonials-photo-carousel`, `centered-around-testimonials`.

Logo clouds: `logo-cloud-marquee`, `logo-cloud-multiple-rows`, `single-row-logo-cloud`,
`logo-cloud-with-swap-animation`, `logo-cloud-with-blur-animation`, `spotlight-logo-cloud`.

Full pages: `saas-landing-page`, `meeting-notes-landing-page`, `inference-landing-page`.

Plus illustration systems (MacBook/iPhone/iPad with Dynamic Island, world map,
keyboard, isometric boxes), empty states, team sections, and blog layouts.

**Gating caveat:** most `registry:ui` primitives are open, but several newer
blocks return `401 Unauthorized — provide a valid API token or sign in` when
fetched. Confirmed gated: `playful-hero-section`, `login-signup-minimal`,
`stats-with-number-ticker`, `draggable-cards`. They appear in listings but need
an Aceternity account/API token to install.

## Detailed picks, page by page

### Home
| Design | Why it fits | Install |
| --- | --- | --- |
| `aurora-background` | Colourful flowing hero backdrop; tinted to the candy palette | `npx shadcn@latest add @aceternity/aurora-background` |
| `flip-words` | Cycles loud words in the headline ("Speaking → Listening → …") | `@aceternity/flip-words` |
| `text-flipping-board` | Split-flap board for a punchy mid-page statement | `@aceternity/text-flipping-board` |
| `infinite-moving-cards` | Marquee of question-type chips (replaces the hand-rolled marquee) | `@aceternity/infinite-moving-cards` |
| `bento-grid` + `card-hover-effect` | Feature bento with hover glow | `@aceternity/bento-grid`, `@aceternity/card-hover-effect` |
| `faqs-with-grid` / `simple-faqs-with-background` | FAQ section shell | block install |
| `cta-with-background-noise` | CTA band with grain | block install |
| `floating-dock` | Site-wide floating nav | `@aceternity/floating-dock` |
| `encrypted-text`, `sparkles`, `meteors`, `noise-background` | Badge, accents, grain | `@aceternity/<name>` |

### Login
`simple-login-with-grid-lines` (dashed grid border), `login-form-with-gradient`,
`premium-auth-split` (WebGL split screen). Backdrop: `background-lines` or `spotlight`.

### Setup
`multi-step-loader` — full-screen checklist loader ("Checking your mic → Loading bank → …"),
needs `npm i @tabler/icons-react` first. `stateful-button` for the start button;
`animated-tabs` for mode selection.

### Test
`sticky-banner` (progress strip), `notch` (floating pill), `keyboard` for typing
practice visuals, `resizable-navbar` for the runner chrome. Keep motion minimal
here — this is the working screen.

### Practice
`draggable-card` / `draggable-cards` (swipeable flashcard deck — gated on the
registry), `carousel`, `images-slider`, `layout-grid`, `compare` for band-score
comparisons.

### Question types
`timeline` (the 22 types as a sticky-header timeline), `sticky-scroll-reveal`
for the guide, `three-column-features-with-image` block, `animated-tabs`.

### Scoring
`terminal` (typed bash + syntax-highlighted scoring rubric — self-contained),
`code-block`, `scales` (zero-dep hatched "exam paper" background, pure Tailwind),
`compare`. `stats-with-number-ticker` is gated.

### Result
`text-generate-effect` (score counts in), `hero-parallax`, `stats-for-changelog`
block, `animated-testimonials`.

### 404
`typewriter-effect`, `wobble-card`, `ascii-art`.

## Hand-built → official swap map

The mock site already expresses fourteen Aceternity mechanics by hand
(Candy Lab build). Each has an official registry equivalent — swapping in the
registry file replaces the hand-rolled version and keeps behaviour identical:

| Mock (hand-built) | Official registry component |
| --- | --- |
| Aurora hero backdrop | `aurora-background` |
| Split-flip phrase board | `text-flipping-board` |
| Floating dock nav | `floating-dock` |
| Mac terminal on scoring page | `terminal` |
| Glowing comparison table | `glowing-effect` |
| Meteor CTA band | `meteors` |
| Film grain | `noise-background` |
| Decrypting badge/tagline | `encrypted-text` |
| Setup step loader | `multi-step-loader` (+ `@tabler/icons-react`) |
| 404 typewriter | `typewriter-effect` |
| Wobble cards | `wobble-card` |
| Hover border gradient | `hover-border-gradient` |
| Wave line background | `background-lines` |
| Hero highlight | `hero-highlight` |

## Seeing the designs

Every component above has a live demo with a screenshot at
`https://ui.aceternity.com/components/<slug>` (e.g.
`/components/aurora-background`, `/components/text-flipping-board`). The MCP
tools can also pull any component's metadata on demand:
`get_component_info` / `get_installation_info` (aceternityui), `get_component`
(aceternity-ui), `view_items_in_registries` (shadcn, with `@aceternity/<name>`).
