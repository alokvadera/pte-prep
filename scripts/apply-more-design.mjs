import fs from 'fs';

// 1. Add pattern and divider utilities to CSS
let css = fs.readFileSync('src/index.css', 'utf-8');

const newUtils = `
@utility bg-grid-pattern {
  background-image: radial-gradient(var(--color-ink-200) 1px, transparent 1px);
  background-size: 24px 24px;
}
.dark {
  & .bg-grid-pattern {
    background-image: radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px);
  }
}

@utility divider-gradient {
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--color-ink-200) 50%, transparent);
}
.dark {
  & .divider-gradient {
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1) 50%, transparent);
  }
}

@utility card-glow {
  position: relative;
  &::before {
    content: '';
    position: absolute;
    inset: -1px;
    border-radius: inherit;
    padding: 1px;
    background: linear-gradient(to bottom right, rgba(255,255,255,0.5), transparent);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }
}
.dark {
  & .card-glow::before {
    background: linear-gradient(to bottom right, rgba(255,255,255,0.15), rgba(255,255,255,0.02));
  }
}
`;

if (!css.includes('@utility bg-grid-pattern')) {
  css = css + '\n' + newUtils;
  fs.writeFileSync('src/index.css', css);
}

// 2. Update Home.tsx with grid and glowing cards
let home = fs.readFileSync('src/pages/Home.tsx', 'utf-8');

// Add grid to the hero section
home = home.replace(
  '<section className="border-ink-200 dark:border-white/10 border-b py-16 sm:py-20 lg:py-24">',
  '<section className="relative border-ink-200 dark:border-white/10 border-b py-16 sm:py-20 lg:py-24 overflow-hidden">\n        <div className="absolute inset-0 bg-grid-pattern opacity-50 [mask-image:linear-gradient(to_bottom,white,transparent)]" />'
);

// Add gradient-line under the hero
home = home.replace(
  '</section>',
  '</section>\n      <div className="divider-gradient w-full max-w-5xl mx-auto opacity-50" />'
);

// Add card-glow to the hero aside card
home = home.replace(
  '<aside className="card-solid overflow-hidden p-0" aria-label="Full mock test preview">',
  '<aside className="card-solid card-glow overflow-hidden p-0 relative shadow-premium-light dark:shadow-premium-dark" aria-label="Full mock test preview">'
);

fs.writeFileSync('src/pages/Home.tsx', home);

// 3. Update Dashboard.tsx to use glowing cards
let dash = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');
dash = dash.replace(/className="card relative overflow-hidden/g, 'className="card card-glow relative overflow-hidden');
fs.writeFileSync('src/pages/Dashboard.tsx', dash);

// 4. Update MockSetup.tsx to use glowing cards
let mock = fs.readFileSync('src/pages/MockSetup.tsx', 'utf-8');
mock = mock.replace(/className="card relative overflow-hidden/g, 'className="card card-glow relative overflow-hidden');
mock = mock.replace(/className="card sticky top-24/g, 'className="card card-glow sticky top-24');
fs.writeFileSync('src/pages/MockSetup.tsx', mock);

