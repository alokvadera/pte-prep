import fs from 'fs';

let tsx = fs.readFileSync('src/pages/Home.tsx', 'utf-8');

// Replace the hero aurora backgrounds with Coco's Jade
tsx = tsx.replace(
  /from-brand-300\/20 via-brand-500\/10 to-brand-600\/20 dark:from-brand-500\/20 dark:via-brand-600\/10 dark:to-brand-800\/20/g,
  "from-brand-500/20 via-brand-600/10 to-brand-800/20 dark:from-[#016a43]/30 dark:via-[#151718]/80 dark:to-[#003728]/20"
);

// We want to add the specific `gradient-radial-dark` to the hero section.
// Looking for where the hero gradient is applied:
tsx = tsx.replace(
  /className="hero-aurora absolute inset-0 bg-gradient-to-tr(.*?)"/g,
  'className="hero-aurora absolute inset-0 bg-[radial-gradient(circle_farthest-corner_at_50%_50%,rgba(1,92,58,0.3)_11%,transparent_62%)] dark:bg-[radial-gradient(circle_farthest-corner_at_50%_50%,rgba(1,92,58,0.4)_11%,var(--color-ink-900)_62%)]"'
);

fs.writeFileSync('src/pages/Home.tsx', tsx);
