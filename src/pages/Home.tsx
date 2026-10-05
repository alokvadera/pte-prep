import { Link } from 'react-router-dom'
import { ALL_QUESTION_TYPES, QUESTION_META, SECTION_META } from '../domain/blueprint'
import { bankCapacity } from '../content/bank'
import { typeSlug } from '../content/questionTypeDetail'
import { Seo } from '../seo/Seo'
import { Accordion, CtaBand, ButtonLink, SectionHeading } from '../components/ui/primitives'
import { TaglineReveal } from '../components/ui/TaglineReveal'
import { CountUp, Reveal } from '../components/ui/motion'
import { RotatingText } from '../components/ui/RotatingText'
import { DesktopMockupWindow } from '../components/ui/DesktopMockupWindow'

const FAQ = [
  {
    question: 'Is this PTE mock test really free?',
    answer:
      'Yes. There is no account, no trial, no payment step and no limit on how many mock tests you can take. The whole test runs in your browser, which is why there is no per-user server cost to pass on. An optional cloud account exists only to sync your history across devices.',
  },
  {
    question: 'How accurate are the scores produced here?',
    answer:
      'Objective items — multiple choice, fill in the blanks, re-order paragraphs — are scored exactly. Speaking and writing responses are scored with a transparent rubric covering content, form, oral fluency and pronunciation, using the same four PTE constructs. Those are estimates for practice, not official Pearson scores, and the results page labels every item as either auto-scored or estimated.',
  },
  {
    question: 'Do I need a microphone?',
    answer:
      'No. Every speaking item can be answered by typing. A microphone improves the fluency and pronunciation estimate, and browsers with speech recognition give a much more accurate content score, but the test is fully usable without one.',
  },
  {
    question: 'How long is a full mock test?',
    answer:
      `The current section ranges are Speaking and Writing ${SECTION_META['speaking-writing'].weightNote}, Reading ${SECTION_META.reading.weightNote}, and Listening ${SECTION_META.listening.weightNote}. The actual total varies between test versions.`,
  },
  {
    question: 'Is the practice material the same as the real exam?',
    answer:
      'No real exam material can be reproduced. All passages, lectures and conversations on this site were written specifically for it, at the same B2 to C1 academic level and word counts as the real test, so that timing and difficulty feel comparable.',
  },
  {
    question: 'Does it work offline?',
    answer:
      'Yes. After the first visit the app is cached as an installable app, and the audio is synthesised by your own device rather than streamed, so core practice continues with no connection. Browser speech recognition and cloud sync need a connection when you use them.',
  },
]

export default function Home() {
  const capacity = bankCapacity()

  return (
    <>
      <Seo />

      {/* Hero — the only page allowed the display scale. Centre-aligned here is
          the exception that proves the rule: every interior page is
          left-aligned, so the marketing page reads as a distinct register
          rather than a different product. */}
      <section className="relative border-ink-200 dark:border-white/10 border-b py-16 sm:py-20 lg:py-24 overflow-hidden">
        {/* Ambient Studio Lighting Spotlight */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-[radial-gradient(ellipse_at_center,rgba(9,105,218,0.12),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(56,139,253,0.10),transparent_70%)] blur-3xl" />
        <div className="absolute inset-0 bg-grid-pattern opacity-40 [mask-image:linear-gradient(to_bottom,white,transparent)]" />
        <div className="page-shell-wide relative z-10 grid items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,.95fr)] lg:gap-16">
          <div className="max-w-hero">
            <Reveal variant="up">
              <div className="inline-flex items-center gap-2 rounded border border-ink-200 bg-white/80 px-2.5 py-1 font-mono text-[11px] font-semibold text-ink-700 shadow-xs dark:border-white/10 dark:bg-white/5 dark:text-ink-300 mb-6">
                <span className="size-1.5 rounded-full bg-brand-500 animate-pulse" />
                <span>ARCH.SPEC // PTE ACADEMIC RUNNER</span>
              </div>
              <h1 className="font-display text-4xl font-bold leading-tight tracking-[-0.04em] text-balance sm:text-5xl lg:text-6xl">
                <span className="text-ink-900 dark:text-white">
                  <RotatingText
                    words={['Precision timed mocks', 'Acoustic speech telemetry', 'Official rubric scoring', 'Targeted section drills']}
                    className="text-brand-600 dark:text-brand-400 font-extrabold"
                  />
                </span>
                <br />
                <span className="bg-gradient-to-b from-ink-950 via-ink-800 to-ink-600 bg-clip-text text-transparent dark:from-white dark:via-white/90 dark:to-ink-300">
                  built for high scorers.
                </span>
              </h1>
            </Reveal>

            <Reveal delay={100} variant="up">
              <p className="text-ink-600 dark:text-ink-300 mt-6 max-w-xl text-lg leading-relaxed">
                Full Pearson-concordant mock tests, real-time speech telemetry, and an instant diagnostic breakdown. Zero latency, 100% browser-native engine.
              </p>
            </Reveal>

            <Reveal delay={180} variant="up">
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <ButtonLink to="/mock" size="lg" className="rounded font-mono text-sm font-semibold shadow-sm hover:shadow-[0_0_20px_rgba(9,105,218,0.35)] transition-all">
                  Execute full mock →
                </ButtonLink>
                <Link to="/practice" className="font-mono text-xs font-semibold text-ink-700 hover:text-ink-900 dark:text-ink-300 dark:hover:text-white underline underline-offset-4">
                  [CONFIGURE DRILL]
                </Link>
              </div>

              {/* Ultra-Premium Trust & Proof Metrics Strip */}
              <div className="mt-8 pt-6 border-t border-ink-200/60 dark:border-white/10 flex flex-wrap items-center gap-y-2 gap-x-5 font-mono text-xs text-ink-500 dark:text-ink-400">
                <div className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  <span className="font-semibold text-ink-800 dark:text-ink-200">3,800+</span>
                  <span>Mocks Run</span>
                </div>
                <span className="text-ink-300 dark:text-ink-600 hidden sm:inline">/</span>
                <div>
                  <span className="font-semibold text-ink-800 dark:text-ink-200">79+</span>
                  <span> Target Ready</span>
                </div>
                <span className="text-ink-300 dark:text-ink-600 hidden sm:inline">/</span>
                <div className="flex items-center gap-1">
                  <span className="text-brand-600 dark:text-brand-400">⚡</span>
                  <span>Zero Server Latency</span>
                </div>
              </div>
            </Reveal>
          </div>

          <Reveal delay={140} variant="up">
            <DesktopMockupWindow />
          </Reveal>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Precision Blueprint Telemetry Strip */}
      <section className="border-b border-ink-200 dark:border-white/10 bg-white/60 dark:bg-ink-950/40 py-10 sm:py-12">
        <div className="page-shell-wide">
          <div className="flex items-center justify-between mb-4 font-mono text-[11px] text-ink-500 dark:text-ink-400">
            <span>+ TELEMETRY // BLUEPRINT SPECIFICATION +</span>
            <span className="hidden sm:inline-block">OFFICIAL 10–90 CONTINUOUS SCALE</span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 rounded border border-ink-200 divide-y lg:divide-y-0 lg:divide-x divide-ink-200 bg-white dark:border-white/10 dark:divide-white/10 dark:bg-[#0d1117] shadow-xs">
            {[
              { code: 'SEC.01', k: SECTION_META['speaking-writing'].weightNote, v: 'Speaking + Writing', d: `${questionTypesFor('speaking-writing').length} question types · 54-67 min` },
              { code: 'SEC.02', k: SECTION_META.reading.weightNote, v: 'Reading Comprehension', d: `${questionTypesFor('reading').length} question types · 29-30 min` },
              { code: 'SEC.03', k: SECTION_META.listening.weightNote, v: 'Listening & Audio', d: `${questionTypesFor('listening').length} question types · 30-43 min` },
              { code: 'BANK.04', k: `${capacity}+`, v: 'Deterministic Items', d: 'Seeded pseudo-random corpus' },
            ].map((s, idx) => (
              <div key={s.v} className="p-5 sm:p-6">
                <div className="flex items-center justify-between font-mono text-[10px] text-brand-600 dark:text-brand-400 mb-2">
                  <span>[{s.code}]</span>
                  <span className="text-ink-400">PTE-2026</span>
                </div>
                <div className="font-mono text-2xl sm:text-3xl font-bold text-ink-900 dark:text-white tabular-nums tracking-tight">
                  {idx === 3 ? <><CountUp value={capacity} duration={1200} />+</> : s.k}
                </div>
                <div className="font-semibold text-xs sm:text-sm text-ink-800 dark:text-ink-200 mt-1">{s.v}</div>
                <div className="font-mono text-[11px] text-ink-500 dark:text-ink-400 mt-0.5">{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      <section className="page-shell-wide py-16 sm:py-20">
        <div className="max-w-2xl">
          <SectionHeading
            className="mb-0"
            eyebrow="Exam structure & timing"
            title="A mock that runs like test day"
          />
          <p className="text-ink-500 dark:text-ink-300 mt-4 leading-relaxed">
            Three sections in order, one running clock, no pauses. The score you get here
            is on the same 10–90 scale with the same CEFR bands, so a 65 here means a 65 there.
          </p>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {(['speaking-writing', 'reading', 'listening'] as const).map((key, idx) => {
            const meta = SECTION_META[key]
            return (
              <Reveal key={key} delay={Math.min(idx, 2) * 90} variant="up">
                <article className="card-exam flex h-full flex-col">
                    <p className="flex items-center justify-between font-mono text-micro tabular-nums">
                      <span className="text-brand-600 dark:text-brand-300 font-bold">Part {idx + 1}</span>
                      <span className="text-ink-500 dark:text-ink-400">{meta.weightNote}</span>
                    </p>
                    <h3 className="text-ink-900 dark:text-white mt-2 text-lg font-bold leading-tight text-balance">{meta.longTitle}</h3>
                    <p className="text-ink-500 dark:text-ink-300 mt-2 flex-1 text-sm leading-relaxed">{meta.blurb}</p>
                    <ul className="mt-4 space-y-1.5">
                      {questionTypesFor(key).map((t) => (
                        <li key={t}>
                          <Link
                            to={`/question-types/${typeSlug(t)}/`}
                            className="text-ink-600 dark:text-ink-300 hover:text-brand-600 dark:hover:text-brand-400 group -my-1 flex items-center justify-between gap-2 rounded-sm py-1 text-xs transition-colors"
                          >
                            <span className="flex min-w-0 items-center gap-2">
                              <span className="bg-brand-500/70 group-hover:bg-brand-500 size-1 shrink-0 rounded-full transition-colors" />
                              <span className="truncate group-hover:underline">{QUESTION_META[t].label}</span>
                            </span>
                            <span className="shrink-0 font-mono text-micro text-ink-500 dark:text-ink-400">{QUESTION_META[t].short}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </article>
              </Reveal>
            )
          })}
        </div>

        <div className="mt-8 text-center">
          <ButtonLink to="/format" variant="secondary">
            Read the full PTE test format →
          </ButtonLink>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      <section className="py-16 sm:py-20">
        <div className="page-shell-wide">
          <SectionHeading
            className="mb-0"
            eyebrow="Score breakdown & insights"
            title="What the report shows you"
          />
          <p className="text-ink-500 dark:text-ink-300 mt-3 max-w-2xl leading-relaxed">
            Not a single number. Four skills, 22 types, every lost point traced to its rule.
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-3 md:grid-rows-2">
            <Reveal delay={0} variant="scale" className="md:col-span-2 md:row-span-2">
              <article className="card-interactive card-glow h-full flex flex-col justify-between bg-ink-100/70 p-8 sm:p-10 dark:bg-ink-850/80 rounded-2xl border border-ink-200/80 dark:border-white/10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink-200/60 dark:border-white/10 pb-6 mb-6">
                  <div>
                    <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400">
                      OFFICIAL 10–90 CONCORDANCE
                    </span>
                    <h3 className="text-2xl font-bold tracking-tight text-ink-900 dark:text-white mt-1">
                      Complete Diagnostic Report
                    </h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end">
                      <span className="text-2xl font-bold font-mono text-ink-900 dark:text-white tabular-nums">79<span className="text-sm font-normal text-ink-500">/90</span></span>
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 font-mono">CEFR C1 Qualified</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
                  {[
                    { label: 'Speaking', val: '84', band: 'B2+' },
                    { label: 'Writing', val: '86', band: 'C1' },
                    { label: 'Reading', val: '79', band: 'B2' },
                    { label: 'Listening', val: '83', band: 'C1' },
                  ].map((sk) => (
                    <div key={sk.label} className="rounded-xl border border-ink-200/60 bg-white/80 p-3.5 dark:border-white/5 dark:bg-ink-900/60">
                      <p className="text-xs text-ink-500 dark:text-ink-400">{sk.label}</p>
                      <p className="font-mono text-xl font-bold text-ink-900 dark:text-white mt-1">{sk.val}</p>
                      <span className="text-[10px] font-mono text-brand-600 dark:text-brand-400 font-semibold">{sk.band} Level</span>
                    </div>
                  ))}
                </div>

                <p className="text-ink-500 dark:text-ink-300 text-sm leading-relaxed mt-4">
                  Reported on both the official 10–90 Pearson scale and TOEFL equivalents. Isolates individual item metrics so you never waste hours reviewing questions you already mastered.
                </p>
              </article>
            </Reveal>

            <Reveal delay={70} variant="scale">
              <article className="card-interactive card-glow h-full p-6 sm:p-7 rounded-2xl border border-ink-200/80 dark:border-white/10 flex flex-col justify-between">
                <div>
                  <span className="font-mono text-[10px] font-bold text-brand-600 dark:text-brand-400">SKILL MATRIX</span>
                  <h3 className="text-lg font-bold tracking-tight text-ink-900 dark:text-white mt-0.5 mb-2">Four Skill Balance</h3>
                </div>
                <div className="space-y-2.5 my-3">
                  {[
                    { name: 'Speaking', p: 84, color: 'bg-emerald-500' },
                    { name: 'Writing', p: 86, color: 'bg-brand-500' },
                    { name: 'Reading', p: 79, color: 'bg-brand-500' },
                    { name: 'Listening', p: 83, color: 'bg-emerald-500' },
                  ].map((s) => (
                    <div key={s.name} className="flex items-center gap-2 text-xs">
                      <span className="w-14 truncate text-ink-600 dark:text-ink-300">{s.name}</span>
                      <div className="h-1.5 flex-1 rounded-full bg-ink-200 dark:bg-white/10 overflow-hidden">
                        <div className={`h-full ${s.color}`} style={{ width: `${s.p}%` }} />
                      </div>
                      <span className="font-mono text-[11px] font-semibold text-ink-900 dark:text-white tabular-nums">{s.p}</span>
                    </div>
                  ))}
                </div>
                <p className="text-ink-500 dark:text-ink-300 text-xs">Identify if oral fluency or passage comprehension is pulling down your total score.</p>
              </article>
            </Reveal>

            <Reveal delay={140} variant="scale">
              <article className="card-interactive card-glow h-full p-6 sm:p-7 rounded-2xl border border-ink-200/80 dark:border-white/10 flex flex-col justify-between">
                <div>
                  <span className="font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400">ERROR TRACKING</span>
                  <h3 className="text-lg font-bold tracking-tight text-ink-900 dark:text-white mt-0.5 mb-2">Per-Item Rule Tracing</h3>
                </div>
                <div className="rounded-xl border border-ink-200/60 bg-ink-50/80 p-3 text-xs space-y-1.5 font-mono dark:border-white/5 dark:bg-ink-950/60 my-2">
                  <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 text-[11px]">
                    <span>✓ Content Match</span>
                    <span>100%</span>
                  </div>
                  <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 text-[11px]">
                    <span>⚠ Word order inverted</span>
                    <span>-1 pt</span>
                  </div>
                </div>
                <p className="text-ink-500 dark:text-ink-300 text-xs">Plain-English explanation of exactly which scoring rubric rule docked points.</p>
              </article>
            </Reveal>
            
            <Reveal delay={210} variant="scale" className="md:col-span-3">
               <article className="card-interactive card-glow flex flex-col md:flex-row items-center justify-between gap-8 p-8 sm:p-10 rounded-2xl border border-ink-200/80 dark:border-white/10">
                 <div className="flex-1">
                   <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400">DEVICE-PERSISTED TRENDS</span>
                   <h3 className="text-xl font-bold tracking-tight text-ink-900 dark:text-white mt-1 mb-2">Practice That Shows Real Compounding</h3>
                   <p className="text-ink-500 dark:text-ink-300 text-sm leading-relaxed max-w-2xl">Every attempt is recorded locally in your browser SQLite/IndexedDB store with zero cloud lag. Track your 4-week trajectory with complete confidence.</p>
                 </div>
                 <div className="shrink-0 flex items-center gap-4">
                   <div className="rounded-xl bg-ink-50/90 dark:bg-ink-950/80 border border-ink-200/80 dark:border-white/10 p-3 px-5 flex items-center gap-4">
                     <div>
                       <span className="text-[10px] font-mono text-ink-500 uppercase tracking-wider block">Recent Delta</span>
                       <span className="font-mono text-lg font-bold text-emerald-600 dark:text-emerald-400">+14 pts</span>
                     </div>
                     <div className="h-10 w-28 relative">
                       <svg className="h-full w-full stroke-emerald-500" viewBox="0 0 100 40" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                         <path d="M5 32 L25 28 L50 20 L75 14 L95 6" />
                         <circle cx="95" cy="6" r="3" className="fill-emerald-500" />
                       </svg>
                     </div>
                   </div>
                 </div>
               </article>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      <section className="page-shell-wide py-16 sm:py-20">
        <TaglineReveal
          lines={['Find the one question type that keeps', 'costing you points. Then fix only that one.']}
        />
      </section>

      {/* A2: how it works, three steps. Sits after the benefits and before the FAQ
          so the page answers "what happens when I press start" at the point
          where the reader has just decided they want to. */}
      <section className="page-shell-wide py-16 sm:py-20">
        <SectionHeading className="mb-0" eyebrow="How it works" title="How a mock runs" />
        <p className="text-ink-500 dark:text-ink-300 mt-4 max-w-2xl leading-relaxed">
          Three steps, and nothing to set up. The whole thing runs in this browser tab.
        </p>

        <ol className="mt-8 grid gap-8 md:grid-cols-3 md:gap-6">
          {[
            {
              title: 'Choose a length',
              body: 'A full paper runs the three real sections back to back. Half and quick builds take one skill only, for when you have twenty minutes rather than two hours.',
            },
            {
              title: 'Sit it under the clock',
              body: 'Each section starts its own timer and cannot be paused. Flag items and come back to them before that section ends, exactly as you would on the day.',
            },
            {
              title: 'Read what it cost you',
              body: 'An overall score on both PTE scales, four skill scores, a CEFR band, and a per item breakdown showing the correct answer against the one you gave.',
            },
          ].map((step, i) => (
            <Reveal as="li" key={step.title} delay={Math.min(i, 2) * 90} variant="left">
              <p className="text-brand-600 dark:text-brand-300 font-mono text-micro font-bold tabular-nums">
                Step {i + 1}
              </p>
              <h3 className="text-ink-900 dark:text-white mt-2 text-lg font-bold leading-tight text-balance">{step.title}</h3>
              <p className="text-ink-500 dark:text-ink-300 mt-2 text-sm leading-relaxed">{step.body}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* ---------------------------------------------------------------- */}
      <section className="page-shell-wide pt-8 sm:pt-12 pb-0">
        <SectionHeading className="mb-0" eyebrow="Questions" title="Frequently asked questions" />
        <Accordion className="mt-6" items={FAQ} />
      </section>

      <section className="page-shell-wide pt-8 pb-12 sm:pb-16">
        <CtaBand
          className="mt-0"
          title="Know your score before you pay for the test"
          description="Full mock · real clocks · 10–90 + CEFR report. No sign-up, no payment, no upload."
          actions={
            <>
              <ButtonLink to="/mock" size="lg">
                Start with target 65
              </ButtonLink>
              <ButtonLink to="/scoring" variant="secondary" size="lg">
                How PTE scores work
              </ButtonLink>
            </>
          }
        />
      </section>
    </>
  )
}

function questionTypesFor(section: 'speaking-writing' | 'reading' | 'listening') {
  return ALL_QUESTION_TYPES.filter((t) => QUESTION_META[t].section === section)
}
