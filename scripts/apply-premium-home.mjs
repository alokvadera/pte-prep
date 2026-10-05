import fs from 'fs';

let tsx = fs.readFileSync('src/pages/Home.tsx', 'utf-8');

// Replace Hero Section
const heroRegex = /<section className="home-hero[\s\S]*?<\/section>/;
const premiumHero = `<section className="home-hero relative overflow-hidden py-24 sm:py-32 lg:py-40">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.1),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]" aria-hidden="true" />
        <div className="page-shell-wide home-hero-shell relative z-10">
          <div className="flex flex-col items-center text-center">
            <div className="flex max-w-4xl flex-col items-center">
              <Reveal variant="up">
                <a href="/mock" className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-600 dark:border-brand-400/30 dark:bg-brand-400/10 dark:text-brand-400 transition-colors hover:bg-brand-500/20 mb-8">
                  <span className="flex h-2 w-2 rounded-full bg-brand-500 dark:bg-brand-400" />
                  PTE Prep 2.0 is live
                </a>
              </Reveal>
              
              <Reveal delay={100} variant="up">
                <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tighter text-ink-900 dark:text-white leading-[1.1]">
                  Master the PTE with
                  <br />
                  <span className="bg-gradient-to-br from-brand-600 to-brand-400 dark:from-brand-300 dark:to-brand-500 bg-clip-text text-transparent">
                    Precision & Clarity
                  </span>
                </h1>
              </Reveal>

              <Reveal delay={200} variant="up">
                <p className="mt-6 max-w-2xl text-lg sm:text-xl leading-relaxed text-ink-500 dark:text-ink-300">
                  Choose a focused task, take a full timed mock, and use intelligent practice history to decide exactly where to spend your next study session.
                </p>
              </Reveal>

              <Reveal delay={300} variant="up">
                <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
                  <ButtonLink to="/mock" size="lg" className="w-full sm:w-auto px-8 py-4 text-base shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                    Start full mock test
                  </ButtonLink>
                  <ButtonLink to="/practice" variant="secondary" size="lg" className="w-full sm:w-auto px-8 py-4 text-base">
                    Practice by skill
                  </ButtonLink>
                </div>
                <p className="mt-5 text-xs text-ink-400 font-medium">
                  Four skills · 22 task types · 100% free forever
                </p>
              </Reveal>
            </div>
          </div>
        </div>
      </section>`;

tsx = tsx.replace(heroRegex, premiumHero);

// Replace features grid with bento box
const featuresRegex = /<div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">[\s\S]*?<\/div>\s*<\/div>\s*<\/section>/;
const bentoGrid = `<div className="mt-12 grid gap-6 md:grid-cols-3 md:grid-rows-2">
            <Reveal delay={0} variant="scale" className="md:col-span-2 md:row-span-2">
              <article className="card-interactive h-full flex flex-col justify-end p-8 sm:p-12 bg-gradient-to-br from-ink-50 to-ink-100 dark:from-ink-850 dark:to-ink-900">
                <div className="mb-auto">
                  <div className="h-12 w-12 rounded-2xl bg-brand-500/10 flex items-center justify-center mb-6">
                    <span className="text-brand-600 dark:text-brand-400 text-xl font-bold">🎯</span>
                  </div>
                </div>
                <h3 className="text-2xl font-extrabold tracking-tight text-ink-900 dark:text-white mb-3">Complete Score Breakdown</h3>
                <p className="text-ink-500 dark:text-ink-300 text-base leading-relaxed max-w-md">Reported on the official 10–90 PTE scale and the 60–120 TOEFL scale, including the CEFR band that your score corresponds to and university thresholds.</p>
              </article>
            </Reveal>

            <Reveal delay={70} variant="scale">
              <article className="card-interactive h-full p-8">
                <h3 className="text-lg font-bold tracking-tight text-ink-900 dark:text-white mb-2">Four Skill Scores</h3>
                <p className="text-ink-500 dark:text-ink-300 text-sm leading-relaxed">Speaking, Writing, Reading and Listening scored independently to isolate weaknesses.</p>
              </article>
            </Reveal>

            <Reveal delay={140} variant="scale">
              <article className="card-interactive h-full p-8">
                <h3 className="text-lg font-bold tracking-tight text-ink-900 dark:text-white mb-2">Per-item Feedback</h3>
                <p className="text-ink-500 dark:text-ink-300 text-sm leading-relaxed">See the correct answer, your response, and a plain-English note on the exact rule broken.</p>
              </article>
            </Reveal>
            
            <Reveal delay={210} variant="scale" className="md:col-span-3">
               <article className="card-interactive flex flex-col md:flex-row items-center gap-8 p-8 sm:p-10">
                 <div className="flex-1">
                   <h3 className="text-xl font-bold tracking-tight text-ink-900 dark:text-white mb-2">Intelligent Progress Tracking</h3>
                   <p className="text-ink-500 dark:text-ink-300 text-sm leading-relaxed max-w-2xl">Every attempt is stored on your device with an elegant trend line, letting you see whether the last three weeks of practice actually moved the needle.</p>
                 </div>
                 <div className="shrink-0 flex items-center gap-3">
                   <div className="h-16 w-32 rounded-xl bg-brand-500/10 border border-brand-500/20 overflow-hidden relative">
                      <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-brand-500/20 to-transparent"></div>
                      <svg className="absolute inset-0 h-full w-full stroke-brand-500" viewBox="0 0 100 40" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 30 L30 25 L55 10 L80 15 L95 5" /></svg>
                   </div>
                 </div>
               </article>
            </Reveal>
          </div>
        </div>
      </section>`;

tsx = tsx.replace(featuresRegex, bentoGrid);

fs.writeFileSync('src/pages/Home.tsx', tsx);
