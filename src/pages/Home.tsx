import { Link } from 'react-router-dom'
import { ALL_QUESTION_TYPES, QUESTION_META, SECTION_META } from '../domain/blueprint'
import { bankCapacity } from '../content/bank'
import { typeSlug } from '../content/questionTypeDetail'
import { Seo } from '../seo/Seo'
import { Accordion, CtaBand, ButtonLink, SectionHeading } from '../components/ui/primitives'
import { TaglineReveal } from '../components/ui/TaglineReveal'
import { CountUp, Reveal } from '../components/ui/motion'

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
        <div className="absolute inset-0 bg-grid-pattern opacity-50 [mask-image:linear-gradient(to_bottom,white,transparent)]" />
        <div className="page-shell-wide grid items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,.95fr)] lg:gap-16">
          <div className="max-w-hero">
            <Reveal variant="up">
              <p className="page-heading-kicker">PTE Academic practice, rebuilt</p>
              <h1 className="font-display text-5xl font-bold leading-none tracking-[-0.045em] text-balance sm:text-6xl lg:text-7xl">
                <span className="bg-gradient-to-r from-ink-900 to-ink-500 bg-clip-text text-transparent dark:from-white dark:to-ink-400">Study with a plan.</span>
                <br />
                <span className="bg-gradient-to-r from-ink-900 to-ink-500 bg-clip-text text-transparent dark:from-white dark:to-ink-400">Walk in ready.</span>
              </h1>
            </Reveal>

            <Reveal delay={100} variant="up">
              <p className="text-ink-600 dark:text-ink-300 mt-6 max-w-xl text-lg leading-relaxed">
                Full timed mocks, targeted drills, and a clear score report that tells you what to practise next.
              </p>
            </Reveal>

            <Reveal delay={180} variant="up">
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <ButtonLink to="/mock" size="lg">Start a full mock</ButtonLink>
                <Link to="/practice" className="link-inline text-sm font-semibold">Build a practice session</Link>
              </div>
              <p className="text-ink-500 dark:text-ink-400 mt-5 text-sm">No account, payment card, or upload required.</p>
            </Reveal>
          </div>

          <Reveal delay={140} variant="up">
            <aside className="card-solid card-glow overflow-hidden p-0 relative shadow-premium-light dark:shadow-premium-dark" aria-label="Full mock test preview">
              <div className="border-brand-500 bg-brand-500 border-b px-6 py-5 text-white sm:px-8">
                <p className="text-sm font-semibold">Full mock test</p>
                <p className="mt-1 text-sm text-white/80">A complete test day in one focused session.</p>
              </div>
              <div className="p-6 sm:p-8">
                <div className="flex items-center justify-between gap-4 border-b border-ink-200 pb-5 dark:border-white/10">
                  <div>
                    <p className="text-ink-500 dark:text-ink-400 text-xs font-semibold">Your run</p>
                    <p className="text-ink-900 dark:text-white mt-1 text-lg font-bold">Three sections, one clock</p>
                  </div>
                  <span className="rounded-full bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-400/15 dark:text-brand-300">Ready when you are</span>
                </div>
                <ol className="mt-5 space-y-4">
                  {[
                    ['01', 'Speaking and writing', 'Communicate under real test timing'],
                    ['02', 'Reading', 'Work through academic text with care'],
                    ['03', 'Listening', 'Finish with focused note taking'],
                  ].map(([number, title, detail]) => (
                    <li key={number} className="flex items-start gap-4">
                      <span className="font-mono text-brand-600 dark:text-brand-300 pt-0.5 text-xs font-bold">{number}</span>
                      <span>
                        <span className="text-ink-900 dark:text-white block text-sm font-semibold">{title}</span>
                        <span className="text-ink-500 dark:text-ink-400 mt-0.5 block text-xs">{detail}</span>
                      </span>
                    </li>
                  ))}
                </ol>
                <div className="border-ink-200 dark:border-white/10 mt-6 border-t pt-5">
                  <p className="text-ink-500 dark:text-ink-400 text-xs">Finish with a score report across all four skills and every question type.</p>
                </div>
              </div>
            </aside>
          </Reveal>
        </div>
      </section>
      <div className="divider-gradient w-full max-w-5xl mx-auto opacity-50" />

      {/* ---------------------------------------------------------------- */}
      <section className="py-16 sm:py-20">
        <div className="page-shell-wide">
          <Reveal variant="fade">
            <p className="page-heading-kicker mb-6">The exam, reproduced</p>
          </Reveal>
          <dl className="grid grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-8">
            {[
              { k: SECTION_META['speaking-writing'].weightNote, v: 'Speaking + Writing', d: `Section 1 · ${questionTypesFor('speaking-writing').length} question types` },
              { k: SECTION_META.reading.weightNote, v: 'Reading', d: `Section 2 · ${questionTypesFor('reading').length} question types` },
              { k: SECTION_META.listening.weightNote, v: 'Listening', d: `Section 3 · ${questionTypesFor('listening').length} question types` },
              { k: `${capacity}+`, v: 'distinct items', d: 'Seeded · never repeats early' },
            ].map((s, idx) => (
              <Reveal key={s.v} delay={Math.min(idx, 3) * 70} variant="up">
                <div className="border-l-2 border-brand-500/60 pl-4">
                  <dt className="font-mono text-ink-900 dark:text-white text-2xl font-bold tabular-nums tracking-[-0.02em] sm:text-3xl">
                    {idx === 3 ? <><CountUp value={capacity} duration={1200} />+</> : s.k}
                  </dt>
                  <dd className="text-ink-700 dark:text-ink-200 mt-1 text-sm font-medium">{s.v}</dd>
                  <dd className="text-ink-500 dark:text-ink-400 mt-0.5 text-xs">{s.d}</dd>
                </div>
              </Reveal>
            ))}
          </dl>
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
              <article className="card-interactive h-full flex flex-col justify-end bg-ink-100 p-8 sm:p-12 dark:bg-ink-850">
                <div className="mb-auto">
                  <div className="h-12 w-12 rounded-2xl bg-brand-500/10 flex items-center justify-center mb-6">
                    <span className="text-brand-600 dark:text-brand-400 text-xl font-bold" aria-hidden="true">01</span>
                  </div>
                </div>
                <h3 className="text-2xl font-bold tracking-tight text-ink-900 dark:text-white mb-3">Complete score breakdown</h3>
                <p className="text-ink-500 dark:text-ink-300 text-base leading-relaxed max-w-md">Reported on the official 10–90 PTE scale and the 60–120 TOEFL scale, including the CEFR band that your score corresponds to and university thresholds.</p>
              </article>
            </Reveal>

            <Reveal delay={70} variant="scale">
              <article className="card-interactive h-full p-8">
                <h3 className="text-lg font-bold tracking-tight text-ink-900 dark:text-white mb-2">Four skill scores</h3>
                <p className="text-ink-500 dark:text-ink-300 text-sm leading-relaxed">Speaking, Writing, Reading and Listening scored independently to isolate weaknesses.</p>
              </article>
            </Reveal>

            <Reveal delay={140} variant="scale">
              <article className="card-interactive h-full p-8">
                <h3 className="text-lg font-bold tracking-tight text-ink-900 dark:text-white mb-2">Per item feedback</h3>
                <p className="text-ink-500 dark:text-ink-300 text-sm leading-relaxed">See the correct answer, your response, and a plain-English note on the exact rule broken.</p>
              </article>
            </Reveal>
            
            <Reveal delay={210} variant="scale" className="md:col-span-3">
               <article className="card-interactive flex flex-col md:flex-row items-center gap-8 p-8 sm:p-10">
                 <div className="flex-1">
                   <h3 className="text-xl font-bold tracking-tight text-ink-900 dark:text-white mb-2">Progress you can act on</h3>
                   <p className="text-ink-500 dark:text-ink-300 text-sm leading-relaxed max-w-2xl">Every attempt is stored on your device with an elegant trend line, letting you see whether the last three weeks of practice actually moved the needle.</p>
                 </div>
                 <div className="shrink-0 flex items-center gap-3">
                   <div className="h-16 w-32 rounded-xl bg-brand-500/10 border border-brand-500/20 overflow-hidden relative">
                      <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-brand-500/10"></div>
                      <svg className="absolute inset-0 h-full w-full stroke-brand-500" viewBox="0 0 100 40" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 30 L30 25 L55 10 L80 15 L95 5" /></svg>
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
