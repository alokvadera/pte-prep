import fs from 'fs';

let tsx = fs.readFileSync('src/pages/ResultPage.tsx', 'utf-8');

// Replace the main header area (the Score / CEFR area)
// The original header looks like:
// <header className="flex flex-wrap items-start justify-between gap-6"> ... </header>
// <div className="card mt-6"> ... </div> (Skills)

const headerRegex = /<header className="flex flex-wrap items-start justify-between gap-6">[\s\S]*?<\/header>\s*\{\/\* Skills, on one shared scale so the bars are actually comparable. \*\/\}\s*<div className="card mt-6">/g;

const premiumHeader = `<header className="relative overflow-hidden rounded-3xl border border-ink-200 dark:border-white/10 bg-white/50 dark:bg-ink-900/40 backdrop-blur-3xl shadow-[0_8px_32px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)] mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-transparent dark:from-brand-500/10" aria-hidden="true" />
          
          <div className="relative z-10 p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-6">
                <Badge tone={attempt.overallIsEstimate ? 'mint' : 'brand'} className="shadow-sm">
                  {attempt.overallIsEstimate ? 'Estimated score' : 'Auto-scored'}
                </Badge>
                <Badge tone="neutral">{attempt.mockTitle}</Badge>
                <Badge tone="neutral">{formatDuration(attempt.durationMs)}</Badge>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn-ghost no-print inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-xs text-brand-600 dark:text-brand-300 font-bold cursor-pointer ml-auto border border-brand-500/20 hover:bg-brand-500/10 transition-colors"
                  title="Print or Save PDF Diagnostic Score Card"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" className="size-3.5" aria-hidden="true">
                    <path fillRule="evenodd" d="M5 2.75C5 2.06 5.56 1.5 6.25 1.5h7.5c.69 0 1.25.56 1.25 1.25v2.5H5v-2.5zM3.5 6.75A2.25 2.25 0 001.25 9v5.5A2.25 2.25 0 003.5 16.75h1.25v1.5c0 .69.56 1.25 1.25 1.25h8c.69 0 1.25-.56 1.25-1.25v-1.5h1.25A2.25 2.25 0 0018.75 14.5V9A2.25 2.25 0 0016.5 6.75H3.5zm2.75 8v3.25h7.5V14.75H6.25zM16 9.5a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" clipRule="evenodd" />
                  </svg>
                  Export PDF
                </button>
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-ink-900 dark:text-white leading-[1.1]">
                CEFR {attempt.cefr} <span className="text-brand-600 dark:text-brand-400">·</span> {cefrLabel(attempt.cefr)}
              </h1>
              <p className="mt-4 text-ink-500 dark:text-ink-300 text-base max-w-xl mx-auto md:mx-0 leading-relaxed">
                You achieved <CountUp value={Math.round(accuracy * 100)} suffix="%" duration={1100} className="font-bold text-ink-900 dark:text-white" /> of the available points. 
                Your weakest area is <span className="font-bold capitalize text-rose-600 dark:text-rose-400">{weakest?.skill ?? '—'}</span>, 
                and your strongest is <span className="font-bold capitalize text-mint-700 dark:text-mint-400">{strongest?.skill ?? '—'}</span>.
              </p>
            </div>

            <div className="shrink-0 text-center md:text-right bg-white dark:bg-ink-950 p-8 rounded-3xl shadow-premium-light dark:shadow-[0_12px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)] border border-ink-100 dark:border-white/5 w-full md:w-auto">
              <div className="text-brand-600 dark:text-brand-400 font-mono text-7xl font-bold tabular-nums tracking-tighter leading-none mb-2 drop-shadow-sm">
                <CountUp value={attempt.overallScore} duration={1300} />
              </div>
              <div className="text-ink-500 dark:text-ink-400 text-sm font-medium uppercase tracking-widest mb-4">Overall Score</div>
            </div>
          </div>
        </header>

        {/* Skills, on one shared scale so the bars are actually comparable. */}
        <div className="card mt-6">`;

tsx = tsx.replace(headerRegex, premiumHeader);

fs.writeFileSync('src/pages/ResultPage.tsx', tsx);
