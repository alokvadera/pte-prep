import fs from 'fs';

let tsx = fs.readFileSync('src/pages/Practice.tsx', 'utf-8');

// The main selection section is wrapped in <section className="card-solid mt-6">
// Let's replace it with a full-bleed premium glass interface.

const solidRegex = /<section className="card-solid mt-6">/g;
const premiumSolid = '<section className="card relative overflow-hidden bg-white/50 backdrop-blur-xl dark:bg-ink-900/40 dark:backdrop-blur-2xl border-white/20 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)] mt-6">';

tsx = tsx.replace(solidRegex, premiumSolid);

// We can also make the choice cards much more beautiful.
// old: choice-idle choice-idle-solid
// new: hover:-translate-y-1 hover:shadow-premium-light dark:hover:shadow-premium-dark border border-ink-200 dark:border-white/10 bg-white/80 dark:bg-white/5 transition-all
const choiceCardRegex = /'choice-card flex min-h-32 cursor-pointer items-start gap-3 p-5', on \? 'choice-active' \: 'choice-idle choice-idle-solid'/g;
const premiumChoice = `'choice-card flex min-h-32 cursor-pointer items-start gap-3 p-6 transition-all duration-300', on ? 'border-brand-500 bg-brand-500/5 dark:bg-brand-500/10 shadow-[0_0_0_1px_rgba(23,86,176,1)]' : 'border-ink-200 bg-white hover:-translate-y-1 hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20 dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)]'`;

tsx = tsx.replace(choiceCardRegex, premiumChoice);

fs.writeFileSync('src/pages/Practice.tsx', tsx);
