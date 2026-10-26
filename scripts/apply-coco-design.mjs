import fs from 'fs'

let css = fs.readFileSync('src/index.css', 'utf-8')

// Update Fonts
// We will replace 'Manrope' with system fonts (SF Pro Display)
css = css.replace(
  /--font-sans: 'Manrope', sans-serif;/g,
  "--font-sans: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif;",
)
css = css.replace(
  /--font-display: 'Manrope', sans-serif;/g,
  "--font-display: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif;",
)

// Update Brand Colors to Jade
const brandVarsRegex = /--color-brand-100:.*?;[\s\S]*?--color-brand-900:.*?;/m
const jadeVars = `--color-brand-100: #d4efe2;
  --color-brand-200: #a7dfc4;
  --color-brand-300: #76cda5;
  --color-brand-400: #46bb87;
  --color-brand-500: #016a43; /* Coco Jade */
  --color-brand-600: #008151; /* Light Jade */
  --color-brand-700: #015c3a; /* Dark Jade */
  --color-brand-800: #003728; /* Very Dark Jade */
  --color-brand-900: #001a12;`
css = css.replace(brandVarsRegex, jadeVars)

// Update Ink Colors to match Coco's warm beige and charcoal
const inkVarsRegex = /--color-ink-50:.*?;[\s\S]*?--color-ink-950:.*?;/m
const warmInkVars = `--color-ink-50: #faf8f5;
  --color-ink-100: #f3ece0; /* Coco bg-card-light */
  --color-ink-200: #d4ccc3; /* Coco border-default */
  --color-ink-300: #b5aca0;
  --color-ink-400: #9ba1a6; /* Coco description-text-color */
  --color-ink-500: #8c8c8c;
  --color-ink-600: #57563b; /* Coco card-text-color */
  --color-ink-700: #404040;
  --color-ink-800: #2b2b2b;
  --color-ink-850: #202223;
  --color-ink-900: #151718; /* Coco bg-black */
  --color-ink-950: #0f0f0f; /* Coco dark-text */`
css = css.replace(inkVarsRegex, warmInkVars)

// Update Buttons to match Jade gradient
const btnPrimaryRegex = /@utility btn-primary \{[\s\S]*?\n\}/m
const btnPrimaryCoco = `@utility btn-primary {
  @apply btn text-white;
  background: linear-gradient(180deg, #047d41, #015c42);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.2), 0 2px 5px rgba(0,0,0,0.2);
  letter-spacing: -0.01em;
  border: 1px solid #003728;
  overflow: hidden;
  transition: all 0.2s var(--ease-settle);
  
  &:hover {
    @apply -translate-y-0.5;
    background: linear-gradient(180deg, #058c49, #016a4b);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.3), 0 4px 12px rgba(1, 106, 67, 0.4);
  }
  
  &:active {
    background: #015c42;
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
  }
}`
css = css.replace(btnPrimaryRegex, btnPrimaryCoco)

fs.writeFileSync('src/index.css', css)
