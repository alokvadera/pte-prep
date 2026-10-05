import fs from 'fs';

let css = fs.readFileSync('src/index.css', 'utf-8');

// 1. Add premium shadows
css = css.replace(
  '--radius-4xl: 2rem;',
  `--radius-4xl: 2rem;
  
  --shadow-premium-light: 0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03), 0 8px 24px rgba(0,0,0,0.02);
  --shadow-premium-dark: 0 1px 2px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.2), 0 8px 24px rgba(0,0,0,0.15);
  --shadow-premium-inset: inset 0 1px 0 rgba(255,255,255,0.08);
  --shadow-premium-inset-light: inset 0 1px 0 rgba(255,255,255,0.7);`
);

// 2. We will just use `replace` carefully, strictly matching the entire blocks.

const oldCard = `@utility card {
  @apply bg-white border-ink-200 rounded-xl border p-6 sm:p-8 transition-[border-color,box-shadow,translate,background-color] duration-200;

  &:where(.dark, .dark *) {
    @apply border-white/10 bg-white/[0.035] shadow-xs;
  }
}`;

const newCard = `@utility card {
  @apply bg-white border-ink-200 rounded-xl border p-6 sm:p-8 transition-[border-color,box-shadow,translate,background-color,transform] duration-300;
  box-shadow: var(--shadow-premium-light);

  &:where(.dark, .dark *) {
    @apply border-white/10 shadow-xs;
    background: linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%);
    box-shadow: var(--shadow-premium-dark), var(--shadow-premium-inset);
  }
}`;

const oldCardInteractive = `@utility card-interactive {
  @apply card;
  position: relative;
  overflow: hidden;

  &:hover {
    @apply -translate-y-0.5 shadow-md;
    border-color: var(--color-brand-300);
  }

  &:where(.dark, .dark *):hover {
    @apply shadow-lg;
    border-color: var(--color-brand-400);
  }
}`;

const newCardInteractive = `@utility card-interactive {
  @apply card relative overflow-hidden;
  
  &:hover {
    @apply -translate-y-1;
    border-color: var(--color-brand-300);
    box-shadow: 0 12px 32px rgba(0,0,0,0.06);
  }

  &:where(.dark, .dark *):hover {
    border-color: var(--color-brand-400);
    box-shadow: 0 12px 32px rgba(0,0,0,0.4), var(--shadow-premium-inset);
  }
}`;

const oldCardSolid = `@utility card-solid {
  @apply bg-white border-ink-200 rounded-xl border p-6 sm:p-8 transition-[border-color,box-shadow,translate,background-color] duration-200;

  &:where(.dark, .dark *) {
    @apply bg-ink-850 border-white/12 shadow-xs;
  }
}`;

const newCardSolid = `@utility card-solid {
  @apply bg-white border-ink-200 rounded-xl border p-6 sm:p-8 transition-all duration-300;
  box-shadow: var(--shadow-premium-light);

  &:where(.dark, .dark *) {
    @apply border-white/12;
    background: linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%), var(--color-ink-850);
    box-shadow: var(--shadow-premium-dark), var(--shadow-premium-inset);
  }
}`;

const oldBtnPrimary = `@utility btn-primary {
  @apply btn bg-brand-500 text-white;
  @apply hover:bg-brand-400 active:bg-brand-600;
  @apply hover:-translate-y-0.5 hover:shadow-md;
  box-shadow:
    0 1px 0 0 rgb(255 255 255 / 0.18) inset,
    0 10px 24px -12px rgb(23 86 176 / 0.3);
  letter-spacing: -0.01em;
  overflow: hidden;
  /* 150ms on translate, matching the \`.btn\` duration: the press and the hover
     lift must settle within the same beat, and a longer translate leaves the
     one-pixel press still easing when the eye (and the browser check) looks for
     it. Shadow is allowed to lag a little. */
  transition: color 0.15s, background-color 0.15s, border-color 0.15s, fill 0.15s, translate 0.15s var(--ease-settle), box-shadow 0.2s var(--ease-settle);

  /* A static bloom behind the label. Kept at a negative z-index so it reads as
     a lift on the surface rather than a wash across the text. */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: radial-gradient(circle at center, rgb(255 255 255 / 0.18) 0%, transparent 70%);
    opacity: 0;
    transition: opacity 0.3s var(--ease-settle);
    z-index: -1;
  }

  &:hover::before {
    opacity: 1;
  }
}`;

const newBtnPrimary = `@utility btn-primary {
  @apply btn text-white;
  background: linear-gradient(180deg, var(--color-brand-400) 0%, var(--color-brand-600) 100%);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.2), 0 2px 5px rgba(0,0,0,0.1), 0 10px 24px -12px rgb(23 86 176 / 0.5);
  letter-spacing: -0.01em;
  overflow: hidden;
  transition: all 0.2s var(--ease-settle);
  
  &:hover {
    @apply -translate-y-0.5;
    background: linear-gradient(180deg, var(--color-brand-300) 0%, var(--color-brand-500) 100%);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.3), 0 6px 16px rgba(23,86,176,0.3), 0 12px 32px -8px rgb(23 86 176 / 0.6);
  }
  
  &:active {
    background: var(--color-brand-600);
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
  }
}`;

const oldBtnSecondary = `@utility btn-secondary {
  @apply btn border border-ink-200 bg-white text-ink-700;
  @apply hover:bg-ink-100 hover:border-ink-300 hover:-translate-y-0.5 hover:shadow-xs;

  &:where(.dark, .dark *) {
    @apply border-white/12 bg-white/6 text-ink-100 hover:bg-white/10 dark:hover:border-white/20;
  }
}`;

const newBtnSecondary = `@utility btn-secondary {
  @apply btn border border-ink-200 bg-white text-ink-800;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
  transition: all 0.2s var(--ease-settle);

  &:hover {
    @apply -translate-y-0.5;
    background: var(--color-ink-50);
    border-color: var(--color-ink-300);
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  }

  &:where(.dark, .dark *) {
    @apply border-white/10 text-white;
    background: linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.05), 0 2px 4px rgba(0,0,0,0.2);
    
    &:hover {
      background: linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.04) 100%);
      border-color: rgba(255,255,255,0.2);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 12px rgba(0,0,0,0.3);
    }
  }
}`;

css = css.replace(oldCard, newCard);
css = css.replace(oldCardInteractive, newCardInteractive);
css = css.replace(oldCardSolid, newCardSolid);
css = css.replace(oldBtnPrimary, newBtnPrimary);
css = css.replace(oldBtnSecondary, newBtnSecondary);

fs.writeFileSync('src/index.css', css);
