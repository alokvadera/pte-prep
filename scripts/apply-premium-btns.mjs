import fs from 'fs'

let css = fs.readFileSync('src/index.css', 'utf-8')

// Replace btn-primary
css = css.replace(
  /@utility btn-primary \{([\s\S]*?)\n\}/,
  `@utility btn-primary {
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
}`,
)

// Replace btn-secondary
css = css.replace(
  /@utility btn-secondary \{([\s\S]*?)\n\}/,
  `@utility btn-secondary {
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
}`,
)

fs.writeFileSync('src/index.css', css)
