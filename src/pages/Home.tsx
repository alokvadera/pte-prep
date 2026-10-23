import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ALL_QUESTION_TYPES, QUESTION_META, SECTION_META } from '../domain/blueprint'
import { manifestBankCapacity } from '../content/manifest'
import { HOME_FAQ } from '../content/faq'
import { Seo } from '../seo/Seo'
import { listAttempts } from '../db/db'
import { syncCloudToLocal } from '../lib/sync'
import { getGuestOwnerId } from '../lib/guestOwner'
import { useLocalOwnerId } from '../lib/useLocalOwner'
import { useAuth } from '../store/useAuth'
import type { AttemptRecord } from '../domain/types'
import { ButtonLink, CtaBand } from '../components/ui/primitives'
import { CountUp, Reveal } from '../components/ui/motion'
import { DottedGlowBackground } from '../components/ui/dotted-glow-background'
import { cn } from '../lib/cn'
import {
  ProgressDots,
  SectionDivider,
  NumberTicker,
  HeroScoreCard,
} from '../components/ui'

/**
 * The three parts, in the order they are sat.
 */
const PART_KEYS = ['speaking-writing', 'reading', 'listening'] as const

/** The landing page's section rail: maps each named
 * <section> on this page to a dot on the right rail, so a
 * reader who scrolls can see where they are and jump
 * anywhere in three clicks.
 */
const LANDING_SECTIONS = [
  { id: 'hero', label: 'Start' },
  { id: 'numbers', label: 'Numbers' },
  { id: 'what', label: 'What changes' },
  { id: 'test', label: 'Test day' },
  { id: 'report', label: 'The report' },
  { id: 'scoring', label: 'Honesty' },
  { id: 'compare', label: 'Compare' },
  { id: 'how', label: 'How it works' },
  { id: 'faq', label: 'Questions' },
] as const

/**
 * The scoring split, read off the blueprint rather than restated here.
 *
 * `scoring === 'trait-composite'` is the blueprint's own marker for a response
 * judged against a written rubric, so it is the single source of truth for
 * which items are estimated. Note that Answer Short Question is scored
 * `binary` and is therefore counted as exact — which is correct: on the real
 * test it is one point for a correct answer, decided by the key.
 */
const OBJECTIVE_TYPES = ALL_QUESTION_TYPES.filter(
  (t) => QUESTION_META[t].scoring !== 'trait-composite',
)

/* FAQ copy is shared with the structured-data block in seo/meta.ts. */

const COMPARISON: Array<{ label: string; prep: string; coaching: string; packs: string }> = [
  { label: 'Full mock under timed conditions', prep: 'Yes, unlimited', coaching: 'Two per course', packs: 'Five per pack' },
  { label: 'Score on the 10 to 90 scale', prep: 'Every attempt', coaching: 'At course end', packs: 'Per paid mock' },
  { label: 'Retake the same week', prep: 'Anytime', coaching: 'Next batch', packs: 'Buy again' },
  { label: 'Review per question with correct answer', prep: 'Yes', coaching: 'In class only', packs: 'Score only' },
  { label: 'Price to start', prep: 'Free', coaching: 'Paid by term', packs: 'Paid per pack' },
]

export default function Home() {
  const capacity = manifestBankCapacity()
  const ownerId = useLocalOwnerId()
  const [latestAttempt, setLatestAttempt] = useState<AttemptRecord | null>(null)

  useEffect(() => {
    if (!ownerId) return
    let cancelled = false
    const guestOwnerId = getGuestOwnerId()
    const currentOwner = () => useAuth.getState().user?.id ?? guestOwnerId
    // Clear the previous owner's card synchronously so an account switch never
    // leaves another user's latest score on screen while the new read runs.
    // oxlint-disable-next-line react/set-state-in-effect
    setLatestAttempt(null)
    void (async () => {
      try {
        const local = await listAttempts(1, ownerId, guestOwnerId)
        if (!cancelled && currentOwner() === ownerId) setLatestAttempt(local[0] ?? null)
        if (useAuth.getState().token && currentOwner() === ownerId) {
          const { pulled } = await syncCloudToLocal()
          if (!cancelled && currentOwner() === ownerId && pulled > 0) {
            const fresh = await listAttempts(1, ownerId, guestOwnerId)
            if (!cancelled && currentOwner() === ownerId) setLatestAttempt(fresh[0] ?? null)
          }
        }
      } catch {
        /* ignore */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [ownerId])

  const STEPS = [
    {
      title: 'Pick a length',
      body: 'A full mock runs all three sections in order. Half and quick runs sample the same sections when you have less time.',
    },
    {
      title: 'Sit it under the clock',
      body: 'Each section starts its own timer and cannot be paused. Flag items and return to them before the section ends, exactly as on test day.',
    },
    {
      title: 'Fix what cost you',
      body: 'Open the report, already ordered by points lost, and drill the type at the top. Sit another mock later to see what improved.',
    },
  ]

  /** The three-step rail. The markers sit on a
   *  hairline line in the step-rail utilities; the
   *  first step is the current one, so it carries
   *  aria-current and the active marker.
   */
  const STEP_RAIL = (step: typeof STEPS[number], i: number) => (
    <Reveal as="li" key={step.title} className="step-rail-cell" delay={Math.min(i, 3) * 70}>
      <span
        aria-hidden="true"
        className={cn(
          'step-rail-line',
          i === 0 && 'step-rail-line-first',
          i === STEPS.length - 1 && 'step-rail-line-last',
        )}
      />
      <span
        className={cn(
          'step-rail-marker',
          i === 0 ? 'step-rail-marker-active' : 'step-rail-marker-quiet',
        )}
        aria-current={i === 0 ? 'step' : undefined}
      >
        <span className="sr-only">Step </span>
        {i + 1}
      </span>
      <h3 className="step-rail-title">{step.title}</h3>
      <p className="step-rail-body">{step.body}</p>
    </Reveal>
  )

  return (
    <>
      <Seo />

      {/* Hero. The claim, one action, and the score report the product shows. */}
      <section id="hero" className="border-ink-200 dark:border-white/10 relative overflow-hidden border-b">
        {/* Dotted glow field behind the hero with smooth radial vignette mask */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]">
          <DottedGlowBackground
            gap={16}
            radius={1.6}
            opacity={0.45}
            colorLightVar="--color-ink-300"
            glowColorLightVar="--color-brand-400"
            colorDarkVar="--color-ink-800"
            glowColorDarkVar="--color-mark-500"
            backgroundOpacity={0}
            speedMin={0.3}
            speedMax={1.2}
            speedScale={1}
          />
        </div>
        <div className="page-shell-wide relative grid items-center gap-[52px] pt-[70px] pb-[60px] lg:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
          <div>
            <Reveal variant="blur-up">
              <p className="mb-6">
                <span className="inline-flex items-center gap-2 rounded-full border border-mint-500/30 bg-mint-50/80 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-mint-700 backdrop-blur-xs dark:border-mint-400/30 dark:bg-mint-500/10 dark:text-mint-300">
                  <span className="size-2 rounded-full bg-mint-500 animate-pulse" aria-hidden="true" />
                  Free PTE Academic Mock Tests · 22 Question Types
                </span>
              </p>
              <h1 className="hero-title">
                Know your{' '}
                <span className="ticket" aria-hidden="true">
                  {latestAttempt ? latestAttempt.overallScore : '--'}/90
                </span>{' '}
                PTE score before you pay for the test.
              </h1>
              {latestAttempt ? (
                <p className="mt-3 text-sm font-medium text-ink-600 dark:text-ink-on-dark-muted">
                  Practice estimate ·{' '}
                  <Link
                    to={`/result?attempt=${latestAttempt.id}`}
                    className="font-bold text-mark-600 hover:underline dark:text-mark-300"
                  >
                    View latest report →
                  </Link>
                </p>
              ) : null}
            </Reveal>

            <Reveal delay={140} variant="blur-up">
              <p className="page-intro mt-6 max-w-[60ch] text-[18.5px] leading-[1.65]">
                Sit full mock tests with real timers, practice all 22 question types, and get a
                score report on the 10 to 90 scale with CEFR band. Built for test takers who want
                proof of readiness, not more sample PDFs.
              </p>
            </Reveal>

            <Reveal delay={220} variant="blur-up">
              <div className="mt-[34px] flex flex-wrap items-center gap-4">
                <ButtonLink to="/mock" size="lg" magnetic>
                  Start free mock test
                </ButtonLink>
                <ButtonLink to="/practice" variant="secondary" size="lg" magnetic>
                  Browse practice drills
                </ButtonLink>
              </div>

              {/* High-trust assurance strip */}
              <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2.5 text-[13.5px] font-semibold text-ink-600 dark:text-ink-on-dark-muted">
                <span className="inline-flex items-center gap-2">
                  <svg className="size-4 text-mint-600 dark:text-mint-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Official 10–90 Pearson scale
                </span>
                <span className="inline-flex items-center gap-2">
                  <svg className="size-4 text-mint-600 dark:text-mint-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Real 2h 15m countdown timers
                </span>
                <span className="inline-flex items-center gap-2">
                  <svg className="size-4 text-mint-600 dark:text-mint-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  100% Free · No card or login
                </span>
              </div>
            </Reveal>
          </div>

          <Reveal delay={180} variant="blur-up">
            <HeroScoreCard />
          </Reveal>
      </div>
    </section>

      {/* Key numbers — a quiet proof strip. The four
          figures each answer a trust question; the
          item count leads as the hero figure and
          the rest rest at body scale. */}
      <section id="numbers" aria-label="Key numbers" className="py-12 border-b border-ink-200/70 dark:border-white/5 bg-ink-50/40 dark:bg-ink-950/30">
        <div className="page-shell-wide">
          <div className="stat-strip">
            <div className="stat-hero">
              <span className="stat-hero-figure">
                <NumberTicker value={capacity} />+
              </span>
              <span className="stat-hero-caption">
                Practice items in the verified exam bank
              </span>
            </div>
            <div className="stat-cell">
              <span className="stat-figure">
                <NumberTicker value={ALL_QUESTION_TYPES.length} />
              </span>
              <span className="stat-label">
                Question types · 100% official coverage
              </span>
            </div>
            <div className="stat-cell">
              <span className="stat-figure">10–90</span>
              <span className="stat-label">
                Pearson scale · with aligned CEFR bands
              </span>
            </div>
            <div className="stat-cell">
              <span className="stat-figure">100% Free</span>
              <span className="stat-label">
                No card, no account required
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* What changes here — mint band. */}
      <section id="what" className="band">
        <div className="page-shell-wide">
          <Reveal variant="up">
            <div className="sec-head">
              <span className="pill-orange">What changes here</span>
              <h2 className="section-title">
                Studying more is not the same as scoring more
              </h2>
              <p className="page-intro">
                Most preparation gives you hours of material and one vague score at the end. You
                finish tired, with no idea which skill cost you the test.
              </p>
            </div>
          </Reveal>
          <ul className="rule-list">
            <Reveal as="li" className="rule-item" delay={0}>
              <span className="rule-no" aria-hidden="true">
                1
              </span>
              <p className="rule-body">
                <strong className="rule-label">Timed sections</strong>
                {' '}that match test day pressure, so your score means something.
              </p>
            </Reveal>
            <Reveal as="li" className="rule-item" delay={70}>
              <span className="rule-no" aria-hidden="true">
                2
              </span>
              <p className="rule-body">
                <strong className="rule-label">Scores on the official scale</strong>
                {' '}with the CEFR band, not a percent that maps to nothing.
              </p>
            </Reveal>
            <Reveal as="li" className="rule-item" delay={140}>
              <span className="rule-no" aria-hidden="true">
                3
              </span>
              <p className="rule-body">
                <strong className="rule-label">Loss per question type</strong>
                {' '}so you drill the two types that cost you most.
              </p>
            </Reveal>
          </ul>
        </div>
      </section>

      {/* The test — lavender band. Every part on one row of
          cards, in the order they are sat. */}
      <section id="test" className="band-plain">
        <div className="page-shell-wide">
          <Reveal variant="up">
            <div className="sec-head">
              <span className="pill-purple">Test day timing</span>
              <h2 className="section-title">A mock that runs like test day</h2>
              <p className="page-intro">
                Three sections in order, one running clock, no pauses. A 65 here reads like a 65
                there, because the scale and the timing match.
              </p>
            </div>
          </Reveal>
          <Reveal variant="up" duration={650} className="mt-[46px] overflow-x-auto">
            <table className="table-data">
              <caption>
                The three parts of the mock, in the order they are sat
              </caption>
              <thead>
                <tr>
                  <th scope="col">Part</th>
                  <th scope="col">Timing</th>
                  <th scope="col">Question types</th>
                  <th scope="col">What it covers</th>
                </tr>
              </thead>
              <tbody>
                {PART_KEYS.map((key, idx) => {
                  const meta = SECTION_META[key]
                  const types = questionTypesFor(key)
                  return (
                    <tr key={key}>
                      <th scope="row">
                        <span className="part-index" aria-hidden="true">
                          {idx + 1}
                        </span>
                        {meta.longTitle}
                      </th>
                      <td>
                        <span
                          className={`dur-sm ${
                            idx === 0
                              ? 'dur-sm-mint'
                              : idx === 1
                                ? 'dur-sm-lav'
                                : 'dur-sm-org'
                          }`}
                        >
                          {meta.weightNote}
                        </span>
                      </td>
                      <td>{types.length} types</td>
                      <td className="part-blurb">{meta.blurb}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Reveal>
          <Link to="/format" className="textlink">
            Read the full PTE test format
          </Link>
        </div>
      </section>

      {/* The one moment of large type — the mockup's
          cream tagline beat, placed after the test-day
          cards and before the report. */}
      <section className="band-tagline" aria-label="Focus your drilling">
        <div className="page-shell-wide">
          <Reveal as="p" variant="blur-up" duration={750} className="tagline-text">
            Find the <span className="hl">one type</span> that keeps costing you
            points. Then fix only that one.
          </Reveal>
        </div>
      </section>

      {/* The report — mint band. Three figures that
          state what the report is, not a panel of
          sample rows. */}
      <section id="report" className="band">
        <div className="page-shell-wide">
          <Reveal variant="up">
            <div className="sec-head">
              <span className="pill-green">The score report</span>
              <h2 className="section-title">Not one number. Every lost point traced.</h2>
              <p className="page-intro">
                Four skills, 22 question types, and every answer shown against the correct one with
                the rule that docked the point.
              </p>
            </div>
          </Reveal>
          <div className="report-stats">
            <Reveal className="rstat rstat-mint" delay={0}>
              <b className="rstat-figure">
                <CountUp value={90} duration={1000} />
              </b>
              <span className="rstat-caption">point scale, not a percentage</span>
            </Reveal>
            <Reveal className="rstat" delay={70}>
              <b className="rstat-figure">
                <CountUp value={6} duration={1000} />
              </b>
              <span className="rstat-caption">CEFR bands, A1 to C2</span>
            </Reveal>
            <Reveal className="rstat rstat-lav" delay={140}>
              <b className="rstat-figure">
                <CountUp value={22} duration={1000} />
              </b>
              <span className="rstat-caption">types, each with its own feedback</span>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Scoring honesty — lavender band. Two panels, one
          per way of marking. */}
      <section id="scoring" className="band-plain">
        <div className="page-shell-wide">
          <Reveal variant="up">
            <div className="sec-head">
              <span className="pill-plain">Scoring honesty</span>
              <h2 className="section-title">Which half of your score is exact</h2>
              <p className="page-intro">
                {OBJECTIVE_TYPES.length} of the {ALL_QUESTION_TYPES.length} question types are marked
                against the answer key. The rest are estimated from a written rubric, and every item
                on your report says which it was.
              </p>
            </div>
          </Reveal>
          <div className="cols">
            <Reveal as="article" className="col" delay={0}>
              <h3 className="col-title">Marked from the key</h3>
              <p className="col-body">
                The answer is either right or it is not, so these marks are exact. Partial credit
                applies per blank, and a wrong multi-select costs one point.
              </p>
            </Reveal>
            <Reveal as="article" className="col" delay={90}>
              <h3 className="col-title">Estimated from a rubric</h3>
              <p className="col-body">
                Speaking and writing answers are scored with a written rubric covering content, form,
                fluency and pronunciation — the same four constructs the real test uses. Every one is
                labelled as an estimate.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Compare — cream band. The table is the content,
          so it sits on the page ground like the
          mockup's does. */}
      <section id="compare" className="band-cream">
        <div className="page-shell-wide">
          <Reveal variant="up">
            <div className="sec-head">
              <span className="pill-purple">Compare</span>
              <h2 className="section-title">Why learners pick unlimited mocks</h2>
            </div>
          </Reveal>
          <Reveal variant="up" duration={650} className="table-scroll">
            <table>
              <caption>PTE Prep vs Coaching center vs Paid mock packs</caption>
              <thead>
                <tr>
                  <th scope="col">What matters</th>
                  <th scope="col">PTE Prep</th>
                  <th scope="col">Coaching center</th>
                  <th scope="col">Paid mock packs</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row) => (
                  <tr key={row.label}>
                    <th scope="row">{row.label}</th>
                    <td>{row.prep}</td>
                    <td>{row.coaching}</td>
                    <td>{row.packs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Reveal>
          <p className="table-note">
            Same scale, same timing, no invoice before your first attempt.
          </p>
        </div>
      </section>

      {/* How it works — mint band. A real sequence, so
          it is drawn as a rail: numbered markers on
          one hairline, in order. */}
      <section id="how" className="band">
        <div className="page-shell-wide">
          <Reveal variant="up">
            <div className="sec-head">
              <span className="pill-orange">How it works</span>
              <SectionDivider />
              <h2 className="section-title">Ready in three steps</h2>
            </div>
          </Reveal>
          <ol className="step-rail">
            {STEPS.map((step, i) => STEP_RAIL(step, i))}
          </ol>
        </div>
      </section>

      {/* FAQ — lavender band. Objections as one card
          list, the first open by default. */}
      <section id="faq" className="band-plain">
        <div className="page-shell-wide">
          <Reveal variant="up">
            <div className="sec-head">
              <span className="pill-purple">Questions</span>
              <h2 className="section-title">Frequently asked questions</h2>
            </div>
          </Reveal>
          <div className="faq-list">
            {HOME_FAQ.map((f, i) => (
              <Reveal key={f.question} variant="up" duration={600} delay={Math.min(i, 4) * 55}>
                <details className="qa" open={i === 0}>
                  <summary className="qa-summary">
                    {f.question}
                    <span className="qa-toggle" aria-hidden="true">
                      +
                    </span>
                  </summary>
                  <p className="qa-answer">{f.answer}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* The landing page's section rail — a slim track of
          nine dots on the far right, one per named section,
          so a reader who has scrolled past partway can see
          where they are and jump anywhere in one click.
          Hidden below desktop where it would crowd the copy;
          the progress-dots CSS lays it out. */}
      <ProgressDots sections={LANDING_SECTIONS} />

      <CtaBand
        eyebrow="Last thing"
        title="Know your score before you pay for the test"
        description="Full mock with real timers plus a 10 to 90 report with CEFR band. No sign up, no payment, no upload. If the first mock does not feel like test day, simply close the tab."
        actions={
          <>
            <ButtonLink to="/mock" size="lg" magnetic>
              Start free mock test
            </ButtonLink>
            <ButtonLink to="/scoring" variant="secondary" size="lg">
              How PTE scoring works
            </ButtonLink>
          </>
        }
      />
    </>
  )
}

function questionTypesFor(section: 'speaking-writing' | 'reading' | 'listening') {
  return ALL_QUESTION_TYPES.filter((t) => QUESTION_META[t].section === section)
}
