import { Link } from 'react-router-dom'
import { ALL_QUESTION_TYPES, QUESTION_META, SECTION_META } from '../domain/blueprint'
import { bankCapacity } from '../content/bank'
import { typeSlug } from '../content/questionTypeDetail'
import { Seo } from '../seo/Seo'
import { Accordion, CtaBand, ButtonLink, SectionHeading } from '../components/ui/primitives'
import { TaglineReveal } from '../components/ui/TaglineReveal'
import { CountUp, Reveal, Tilt } from '../components/ui/motion'

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
      <section className="relative overflow-hidden bg-mesh-gradient">
        <div className="hero-aurora" aria-hidden="true">
          <span className="aurora-1" />
          <span className="aurora-2" />
          <span className="aurora-3" />
        </div>
        <div className="page-shell-wide relative z-10 pt-16 sm:pt-20">
          <div className="flex flex-col items-center text-center">
            <div className="flex max-w-3xl flex-col items-center">
              <p className="text-brand-600 dark:text-brand-300 animate-rise-in mb-4 text-sm font-semibold">
                PTE preparation, in one place
              </p>
              <h1 className="hero-title animate-rise-in" style={{ animationDelay: '50ms' }}>
                <span className="text-gradient-move">
                  Practice the test.<br />Know what to do next.
                </span>
              </h1>

              <p
                className="text-ink-600 dark:text-ink-200 animate-rise-in mt-6 max-w-2xl text-lg leading-relaxed text-pretty"
                style={{ animationDelay: '110ms' }}
              >
                Choose a focused task, take a timed mock, and use your practice history to decide where to spend your next study session.
              </p>

              <div
                className="animate-rise-in mt-8 flex flex-wrap items-center justify-center gap-3"
                style={{ animationDelay: '170ms' }}
              >
                <ButtonLink to="/mock" size="lg">
                  Start full mock test
                </ButtonLink>
                <ButtonLink to="/practice" variant="secondary" size="lg">
                  Practice by skill
                </ButtonLink>
              </div>
              <p className="text-ink-500 dark:text-ink-400 animate-rise-in mt-4 text-sm" style={{ animationDelay: '220ms' }}>
                Four skills · {ALL_QUESTION_TYPES.length} task types · free browser-based practice
              </p>
            </div>

            {/* The embedded practice-overview mockup. Its CSS lives in index.css
                and is written entirely against the app's own @theme tokens, so
                it renders in the exact design language of the real product. The
                Tilt wrapper leans the whole collage toward the pointer — purely
                decorative, so it changes no layout and no hit area. */}
            <div className="animate-rise-in w-full max-w-5xl px-4 sm:px-0" style={{ animationDelay: '260ms' }}>
              <Tilt className="relative" max={4} glare={false}>
                <ScorePreview />
              </Tilt>
            </div>
            <p className="text-ink-500 dark:text-ink-400 mt-5 mb-16 text-xs">
              Illustrative practice interface. Scores and activity are sample data.
            </p>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      <section className="band-flush">
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

        <div className="mt-12 grid gap-6 md:grid-cols-3">
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
                    <ul className="mt-4 space-y-1.5 border-t pt-4">
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

        <div className="mt-12 text-center">
          <ButtonLink to="/format" variant="secondary">
            Read the full PTE test format →
          </ButtonLink>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      <section className="band-flush-plain">
        <div className="page-shell-wide">
          <SectionHeading
            className="mb-0"
            eyebrow="Score breakdown & insights"
            title="What the report shows you"
          />
          <p className="text-ink-500 dark:text-ink-300 mt-3 max-w-2xl leading-relaxed">
            Not a single number. Four skills, 22 types, every lost point traced to its rule.
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: 'An overall score on both PTE scales',
                body: 'Reported on the 10–90 scale and the 60–120 scale, with the CEFR band that score corresponds to and the university thresholds it clears.',
              },
              {
                title: 'Four separate skill scores',
                body: 'Speaking, Writing, Reading and Listening are scored independently, because a single number hides the thing you actually need to fix.',
              },
              {
                title: 'Accuracy by question type',
                body: 'Every one of the 22 types broken down, so you can see that Fill in the Blanks is costing you six points while Describe Image is fine.',
              },
              {
                title: 'Per-item feedback',
                body: 'For each item: the correct answer, what you gave, and a plain-English note on the specific rule that cost the mark.',
              },
              {
                title: 'Fluency and form signals',
                body: 'Speaking pace, pause count, pitch and energy variation. Written responses get length, structure, linking and repetition analysis.',
              },
              {
                title: 'Progress over time',
                body: 'Every attempt is stored on your own device with a trend line, so you can see whether the last three weeks of practice actually moved anything.',
              },
            ].map((f, idx) => (
              <Reveal key={f.title} delay={Math.min(idx, 3) * 70} variant="scale">
                <article className="card-interactive">
                  <h3 className="text-ink-900 dark:text-white text-lg font-bold leading-tight text-balance">{f.title}</h3>
                  <p className="text-ink-500 dark:text-ink-300 mt-2 text-sm leading-relaxed">{f.body}</p>
                </article>
              </Reveal>
            ))}
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

        <ol className="border-ink-200 dark:border-white/10 mt-12 grid gap-8 border-t pt-8 md:grid-cols-3 md:gap-6">
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
      <section className="page-shell-wide pt-16 sm:pt-20 pb-0">
        <SectionHeading className="mb-0" eyebrow="Questions" title="Frequently asked questions" />
        <Accordion className="mt-6" items={FAQ} />
      </section>

      <section className="page-shell-wide pt-16 pb-20 sm:pb-24">
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

function ScorePreview() {
  return (
    <div className="practice-collage" aria-label="Preview of the PTE practice dashboard">
      <div className="practice-float practice-float-score"><small>Last mock estimate</small><strong>63 <i>out of 90</i></strong><em>Speaking improved by 4 points</em></div>
      <div className="practice-window">
        <div className="practice-window-header"><div className="flex items-center gap-2"><span className="practice-window-mark" /><span>PTE Prep</span></div><div className="flex items-center gap-5"><span>Practice hub</span><span>Help</span><span className="practice-window-avatar">AV</span></div></div>
        <div className="practice-window-body">
          <nav className="practice-window-nav" aria-label="Preview navigation">
            <span className="practice-nav-caption">LEARN</span><Link className="practice-nav-active" to="/">⌂ <span>Overview</span></Link><Link to="/practice">◖ <span>Practice</span></Link><Link to="/mock">▤ <span>Mock tests</span></Link><Link to="/dashboard">⌁ <span>Progress</span></Link><div className="practice-streak"><b>3 sessions</b>This week so far</div>
          </nav>
          <div className="practice-window-main">
            <div className="practice-window-heading"><div><span className="practice-overline">WEDNESDAY · SEPTEMBER 30</span><h2>Your practice overview</h2></div><Link to="/practice" className="practice-mini-cta">Choose a task</Link></div>
            <div className="practice-window-grid">
              <section className="practice-window-panel practice-focus-panel" aria-label="Sample skill estimates and practice tasks"><div className="practice-panel-title"><span>Skill estimates</span><span>Sample results</span></div><div className="practice-skill-list">{([['Speaking', '72%', '65'], ['Writing', '64%', '58'], ['Reading', '79%', '71'], ['Listening', '70%', '63']] as const).map(([skill, percent, score]) => <div key={skill} className="practice-skill-row"><span>{skill}</span><span className="practice-meter"><i style={{ width: percent }} /></span><b>{score}</b></div>)}</div><div className="practice-panel-title practice-continue-title"><span>Continue practice</span><Link to="/practice">View all</Link></div><Link to="/practice" className="practice-task"><span className="practice-task-icon">◖</span><span>Read Aloud<small>Speaking · 5 questions</small></span><span className="practice-task-arrow">8 min</span></Link><Link to="/practice" className="practice-task"><span className="practice-task-icon">▱</span><span>Summarize Written Text<small>Writing · 3 questions</small></span><span className="practice-task-arrow">12 min</span></Link></section>
              <section className="practice-window-panel practice-suggestion"><span className="practice-suggest-label">SUGGESTED NEXT</span><strong>Give writing a little time.</strong><p>Try one short response, then review structure and grammar in your feedback.</p><Link to="/practice">Choose a writing task ↗</Link></section>
            </div>
          </div>
        </div>
      </div>
      <Link to="/dashboard" className="practice-float practice-float-week" aria-label="See weekly practice progress"><small>Practice this week</small><span className="practice-bars">{['38%', '70%', '48%', '84%', '57%', '28%', '18%'].map((height, i) => <i key={i} style={{ height }} />)}</span><span className="practice-week-days"><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span></span></Link>
    </div>
  )
}
