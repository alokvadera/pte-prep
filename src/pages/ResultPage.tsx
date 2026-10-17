import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ADMISSION_TARGETS, buildReport, cefrLabel } from '../domain/scoring'
import { QUESTION_META } from '../domain/blueprint'
import { buildFullMock } from '../domain/assemble'
import { formatSeconds, paceReport, paceWarnings } from '../domain/pace'
import type { AttemptRecord, ItemResponse, ItemScoreDetail, QuestionType, Skill } from '../domain/types'
import { getAttempt } from '../db/db'
import { fetchAttemptFromCloud, syncAttemptToCloud } from '../lib/sync'
import { formatDuration } from '../lib/format'
import { cn } from '../lib/cn'
import { Seo } from '../seo/Seo'
import { Badge, Button, ButtonLink, Callout, Card, ProgressBar } from '../components/ui/primitives'
import { SkillBars } from '../components/charts/ScoreRangeBar'
import { CountUp, Reveal } from '../components/ui/motion'
import { Tabs } from '../components/ui/tabs'
import { ConfettiBurst } from '../components/ui/confetti'
import { Breadcrumbs } from '../components/ui/Breadcrumbs'
import { useTest } from '../store/useTest'
import { useSettings } from '../store/useSettings'
import { useAuth } from '../store/useAuth'
import { evaluateWithAi, type AiEvaluationResult } from '../lib/aiScorer'

type Tab = 'overview' | 'pace' | 'by-type' | 'review'

export default function ResultPage() {
  const [params, setSearchParams] = useSearchParams()
  const mock = useTest((s) => s.mock)
  const [sessionMock] = useState(() => useTest.getState().mock)
  const responses = useTest((s) => s.responses)
  const finish = useTest((s) => s.finish)
  const exit = useTest((s) => s.exit)
  const { settings } = useSettings()
  const [loading, setLoading] = useState(true)
  const [attempt, setAttempt] = useState<AttemptRecord | null>(null)
  const scoringRef = useRef(false)
  const [tab, setTab] = useState<Tab>('overview')
  const [filter, setFilter] = useState<'all' | 'lost'>('all')
  const user = useAuth((s) => s.user)
  // Clearing the target score earns one
  // celebration: a confetti burst when the
  // report first shows it.
  const [celebrated, setCelebrated] = useState(false)
  useEffect(() => {
    if (celebrated || !attempt || loading) return
    const target = user?.targetScore ?? 79
    if (attempt.overallScore >= target) {
      const t = window.setTimeout(() => setCelebrated(true), 1200)
      return () => window.clearTimeout(t)
    }
  }, [attempt, loading, celebrated, user])

  // The report renders outside the app shell, so the route
  // change is announced by hand: focus moves to the report's
  // main landmark when the page mounts.
  useEffect(() => {
    document.getElementById('main-content')?.focus({ preventScroll: true })
  }, [])

  // Score once when runner reports test finished, or load stored attempt by query id.
  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const existing = params.get('attempt')
        // A live mock in memory is authoritative and has NOT been scored or
        // persisted yet. `attemptId` is allocated when the test starts, so
        // using it as a storage key here would always miss and strand the page
        // on the empty state instead of reaching the `finish()` branch below.
        // Only fall back to a stored lookup when there is no live session —
        // i.e. a deep link or a reload of /result?attempt=…
        const live = useTest.getState()
        const targetId = existing ?? (!live.mock && live.status === 'finished' ? live.attemptId : null)
        if (targetId) {
          if (attempt?.id === targetId) {
            setLoading(false)
            return
          }
          let stored = await getAttempt(targetId)
          if (!stored) {
            stored = (await fetchAttemptFromCloud(targetId)) ?? undefined
          }
          if (!cancelled) {
            setAttempt(stored ?? null)
            setLoading(false)
            if (!existing && stored) {
              setSearchParams({ attempt: stored.id }, { replace: true })
            }
          }
          return
        }
        if (mock && !scoringRef.current) {
          scoringRef.current = true
          const record = await finish()
          if (!cancelled && record) {
            setAttempt(record)
            setLoading(false)
            setSearchParams({ attempt: record.id }, { replace: true })
            void syncAttemptToCloud(record).catch(() => {})
            // Clear live mock from persisted store upon successful scoring to ensure single scoring
            useTest.setState({ mock: null })
          }
          return
        }
        if (!cancelled) {
          setLoading(false)
        }
      } catch {
        if (!cancelled) {
          setLoading(false)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [mock, params, finish, attempt?.id, setSearchParams])

  const seed = attempt?.seed
  // Seed rebuilds can only reproduce full mocks: half/quick counts and
  // section/drill item sets are not recoverable from the seed alone, and
  // showing details against the wrong items would be worse than showing the
  // stored details only. New attempts always carry details anyway.
  const currentMock = mock ?? sessionMock
  const effectiveMock = useMemo(() => {
    if (currentMock) return currentMock
    if (!seed) return null
    const sectionCount = attempt?.sectionIds?.length ?? 0
    const kind = attempt?.mockKind
    if (kind && kind !== 'full') return null
    if (!kind && sectionCount !== 0 && sectionCount !== 3) return null
    try {
      return buildFullMock(seed, { timeScale: attempt?.timeScale, untimed: attempt?.untimed })
    } catch {
      return null
    }
  }, [currentMock, seed, attempt?.mockKind, attempt?.sectionIds, attempt?.timeScale, attempt?.untimed])

  const effectiveResponses = attempt?.responses ?? responses

  const details = useMemo(() => {
    if (attempt?.details && attempt.details.length > 0) return attempt.details
    if (!effectiveMock) return []
    const items = effectiveMock.sections
      .flatMap((s) => s.itemIds)
      .map((id) => effectiveMock.items[id])
      .filter((i): i is NonNullable<typeof i> => Boolean(i))
    const metaById: Record<string, { skills: Skill[]; type: QuestionType; label: string }> = {}
    for (const item of items) {
      metaById[item.id] = {
        skills: item.skills,
        type: item.type,
        label: QUESTION_META[item.type]?.label ?? item.type,
      }
    }
    return buildReport(items, effectiveMock.answers, effectiveResponses, metaById).details
  }, [attempt, effectiveMock, effectiveResponses])

  // The real-test budget lives on the item. Pace is only shown while the
  // live mock is still in memory, so budgets always match the actual run.
  // Reconstructing from seed alone cannot reproduce half/quick/section/drill
  // item sets, and showing pace against the wrong items would be worse than
  // hiding the tab — the tab filter below already hides it then.
  const paceRows = useMemo(
    () => (currentMock && attempt ? paceReport(Object.values(currentMock.items), attempt.responses ?? {}) : []),
    [currentMock, attempt],
  )

  if (loading) {
    return (
      <div className="grid min-h-dvh place-items-center px-4">
        <div className="text-center">
          <span className="border-ink-200 border-t-ink-900 dark:border-white/15 dark:border-t-ink-50 mx-auto block size-9 animate-spin rounded-full border-2" />
          <p className="text-ink-500 dark:text-ink-on-dark-muted mt-4 text-sm">Scoring your responses…</p>
        </div>
      </div>
    )
  }

  if (!attempt) {
    return (
      <div className="route-inner min-h-dvh flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card variant="solid" className="p-8 text-center shadow-lg">
            <div className="mx-auto size-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4 border border-amber-500/20">
              <svg className="size-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="font-display text-2xl font-extrabold text-balance text-ink-900 dark:text-white">
              No test result found
            </h1>
            <p className="text-ink-500 dark:text-ink-on-dark-muted mt-2 text-sm leading-relaxed">
              There is no active test session or saved score report with this ID on this device.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <ButtonLink to="/mock" magnetic>
                Start a mock test
              </ButtonLink>
              <ButtonLink to="/dashboard" variant="secondary">
                Go to dashboard
              </ButtonLink>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  const skills = (['reading', 'listening', 'speaking', 'writing'] as Skill[])
    .map((s) => ({ skill: s, score: attempt.skillScores[s] }))
    .filter((s): s is { skill: Skill; score: number } => typeof s.score === 'number')

  const weakest = skills.length ? skills.reduce((a, b) => (b.score < a.score ? b : a)) : null
  const strongest = skills.length ? skills.reduce((a, b) => (b.score > a.score ? b : a)) : null
  const accuracy = attempt.availablePoints > 0 ? attempt.earnedPoints / attempt.availablePoints : 0
  const lost = details.filter((d) => d.ratio < 0.999)
  const visibleDetails = filter === 'lost' ? lost : details

  const estimatedCount = details.filter((d) => d.maxPoints > 0 && isEstimated(d)).length

  // The next drill should target the largest points gap, not merely the lowest
  // percentage on a tiny type. This order matches the advice on the home page.
  const typeRows = Object.values(attempt.breakdown).sort((a, b) => {
    const lostA = Math.max(0, a.maxPoints - a.earnedPoints)
    const lostB = Math.max(0, b.maxPoints - b.earnedPoints)
    return lostB - lostA || b.maxPoints - a.maxPoints
  })
  const focusType = typeRows.find((row) => row.maxPoints - row.earnedPoints > 0.01)
  const focusPath = focusType ? `/practice?type=${focusType.type}` : '/practice'

  return (
    <>
      <Seo />

      <a
        href="#main-content"
        className="bg-brand-500 sr-only rounded-sm px-4 py-2 text-white focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-100"
      >
        Skip to content
      </a>

      <main id="main-content" tabIndex={-1} className="route-inner min-h-dvh outline-none">
        <div className="page-shell-app animate-rise-in">
        <div className="mb-6 no-print">
          <Breadcrumbs
            trail={[
              { name: 'Home', path: '/' },
              { name: 'Dashboard', path: '/dashboard' },
              { name: 'Score report' },
            ]}
          />
        </div>

        {/* Header */}
        <header className="relative overflow-hidden rounded-3xl border-2 border-ink-900/10 dark:border-white/10 bg-white dark:bg-ink-850 mb-8 shadow-sm">
          
          <div className="relative z-10 p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-6">
                <Badge tone={attempt.overallIsEstimate ? 'mint' : 'brand'}>
                  {attempt.overallIsEstimate ? 'Estimated score' : 'Auto-scored'}
                </Badge>
                {settings.aiScoringEnabled && settings.groqApiKey ? (
                  <Badge tone="mint">AI Examiner Active</Badge>
                ) : null}
                <Badge tone="neutral">{attempt.mockTitle}</Badge>
                <Badge tone="neutral">{formatDuration(attempt.durationMs)}</Badge>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn-ghost no-print ml-auto text-xs"
                  title="Print or save this report as a PDF"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" className="size-3.5" aria-hidden="true">
                    <path fillRule="evenodd" d="M5 2.75C5 2.06 5.56 1.5 6.25 1.5h7.5c.69 0 1.25.56 1.25 1.25v2.5H5v-2.5zM3.5 6.75A2.25 2.25 0 001.25 9v5.5A2.25 2.25 0 003.5 16.75h1.25v1.5c0 .69.56 1.25 1.25 1.25h8c.69 0 1.25-.56 1.25-1.25v-1.5h1.25A2.25 2.25 0 0018.75 14.5V9A2.25 2.25 0 0016.5 6.75H3.5zm2.75 8v3.25h7.5V14.75H6.25zM16 9.5a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" clipRule="evenodd" />
                  </svg>
                  Export PDF
                </button>
              </div>
              <h1 className="font-display text-ink-900 dark:text-ink-50 text-4xl leading-[1.1] font-extrabold tracking-tight sm:text-5xl">
                CEFR {attempt.cefr}, {cefrLabel(attempt.cefr)}
              </h1>
              <p className="mt-4 text-ink-500 dark:text-ink-on-dark text-base max-w-xl mx-auto md:mx-0 leading-relaxed">
                You achieved <CountUp value={Math.round(accuracy * 100)} suffix="%" duration={1100} className="font-bold text-ink-900 dark:text-white" /> of the available points. 
                Your weakest area is <span className="font-bold capitalize text-mark-600 dark:text-mark-300">{weakest?.skill ?? '—'}</span>, 
                and your strongest is <span className="font-bold capitalize text-mint-700 dark:text-mint-400">{strongest?.skill ?? '—'}</span>.
              </p>
              <div className="no-print mt-6 flex flex-wrap justify-center gap-3 md:justify-start">
                <ButtonLink to={focusPath} magnetic>
                  {focusType ? `Practice ${focusType.label}` : 'Browse practice drills'}
                </ButtonLink>
                <ButtonLink to="/dashboard" variant="secondary">See progress</ButtonLink>
              </div>
            </div>

            <div className="bg-ink-50/70 dark:bg-ink-900/60 shrink-0 rounded-2xl border-2 border-ink-900/10 p-8 dark:border-white/10 md:w-auto md:text-right shadow-inner">
              <div className="font-display text-ink-900 dark:text-ink-50 text-7xl font-extrabold tabular-nums tracking-tight leading-none mb-2">
                <CountUp value={attempt.overallScore} duration={1300} />
              </div>
              <div className="text-ink-500 dark:text-ink-on-dark-muted text-xs font-bold">Overall score, 10 to 90</div>
            </div>
          </div>
        </header>

        {/* Skills, on one shared scale so the bars are actually comparable. */}
        <div className="card-solid mt-6 p-6 sm:p-8">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="font-display text-ink-900 dark:text-white text-base font-extrabold text-balance">By skill</h2>
            <p className="text-ink-500 dark:text-ink-on-dark-muted text-xs">
              Each item's points feed every skill it scores, so these overlap. Pearson does not publish
              per-skill scores, so these are our own.
            </p>
          </div>
          <div className="mt-4">
            <SkillBars
              skills={skills.map(({ skill, score }) => ({ skill, value: score ?? 0 }))}
              strongest={strongest?.skill}
              weakest={weakest?.skill}
            />
          </div>
        </div>

        <details className="card-solid mt-6 p-6 sm:p-8 no-print">
          <summary className="text-ink-900 dark:text-white cursor-pointer list-none text-sm font-semibold [&::-webkit-details-marker]:hidden">
            How much of this number is exact?
          </summary>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <div>
              <p className="font-display text-3xl text-ink-900 tabular-nums dark:text-white">
                {details.filter((d) => d.maxPoints > 0).length - estimatedCount}
                <span className="text-ink-500 dark:text-ink-on-dark-muted font-sans text-xl"> of {details.filter((d) => d.maxPoints > 0).length}</span>
              </p>
              <p className="text-ink-500 dark:text-ink-on-dark-muted mt-1 text-sm">
                items scored exactly against an answer key. Multiple choice, fill in the blanks, re-order paragraphs and
                highlight-the-incorrect-words are all deterministic, including partial credit per blank and the
                one-point deduction for a wrong multi-select.
              </p>
            </div>
            <div>
              <p className="font-display text-3xl text-ink-900 tabular-nums dark:text-white">
                {estimatedCount}
                <span className="text-ink-500 dark:text-ink-on-dark-muted font-sans text-xl"> estimated</span>
              </p>
              <p className="text-ink-500 dark:text-ink-on-dark-muted mt-1 text-sm">
                speaking and writing responses, rated with a rubric over the same four constructs Pearson uses. Read
                these as a band, not a number — and record with a microphone to narrow them.
              </p>
            </div>
          </div>
          <p className="text-ink-500 dark:text-ink-on-dark-muted mt-5 border-t pt-4 text-xs leading-relaxed">
            Pearson produces the overall score with a single item-response-theory scaling, and states plainly that it is
            <em> not </em> an average of the four skill scores. Ours is computed from the same item points, which is the
            closest honest approximation available without their model. The four things Pearson does not publish — the
            Read Aloud error conversion, the trait weighting, the item-to-scale step, and per-skill CEFR bands — are
            listed in full on the <Link to="/scoring" className="text-ink-900 dark:text-ink-50 underline underline-offset-2 transition-colors hover:text-mark-700 dark:hover:text-mark-300">scoring page</Link>.
          </p>
        </details>

        {/* Admission thresholds */}
        <Card variant="solid" className="mt-6 p-6 sm:p-8">
          <h2 className="text-ink-900 dark:text-white text-base font-bold text-balance">What this score means</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {ADMISSION_TARGETS.map((t, i) => {
              // Three states, not two: inside the target band, above it, or short.
              const match = t.range.match(/(\d+)(?:–(\d+))?/)
              const lo = Number(match?.[1] ?? 0)
              const hi = match?.[2] ? Number(match[2]) : null
              const score = attempt.overallScore
              const inside = hi === null ? score >= lo : score >= lo && score <= hi
              const exceeds = hi !== null && score > hi
              const state = inside ? 'met' : exceeds ? 'exceeded' : 'notMet'
              return (
                <Reveal key={t.label} variant="up" delay={Math.min(i, 5) * 25} duration={500}>
                  <li
                    className={cn(
                      'flex items-start gap-3 rounded-2xl border p-4',
                      state === 'notMet'
                        ? 'border-ink-200 dark:border-white/10'
                        : state === 'met'
                          ? 'border-mint-500/50 bg-mint-500/8 dark:border-emerald-500/30 dark:bg-emerald-500/10'
                          : 'border-mint-500/25 dark:border-emerald-500/20',
                    )}
                >
                  <span
                    className={cn(
                      'mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-xs font-bold',
                      state === 'notMet'
                        ? 'bg-ink-200 text-ink-500 dark:bg-white/10 dark:text-ink-on-dark-muted'
                        : 'bg-mint-500 text-ink-900 dark:bg-emerald-600 dark:text-white',
                    )}
                    aria-hidden="true"
                  >
                    {state === 'notMet' ? '·' : '✓'}
                  </span>
                  <div className="min-w-0">
                    <p className="text-ink-900 dark:text-white text-sm font-semibold">
                      {t.label}{' '}
                      <span className="text-ink-500 dark:text-ink-on-dark-muted font-normal">
                        target {t.range}
                      </span>
                      {state !== 'notMet' ? (
                        <span className="text-mint-700 dark:text-mint-300 ml-2 text-xs font-semibold">
                          {state === 'met' ? 'met' : 'exceeded'}
                        </span>
                      ) : null}
                    </p>
                    <p className="text-ink-500 dark:text-ink-on-dark-muted mt-0.5 text-xs leading-relaxed">{t.note}</p>
                  </div>
                </li>
              </Reveal>
              )
            })}
          </ul>
        </Card>

        <ConfettiBurst fire={celebrated} />

        {/* Tabs — the primitive owns the strip; the panels
            below stay hand-rendered so printing captures
            the whole report in one document. */}
        <div className="no-print mt-10">
          <Tabs
            value={tab}
            onChange={(v) => setTab(v as Tab)}
            tabs={(
              [
                ['overview', 'By question type'],
                ['pace', 'Pace'],
                ['by-type', 'Skill detail'],
                ['review', 'Answer review'],
              ] as Array<[Tab, string]>
            )
              // Pace needs timing data, which only exists while a mock is in
              // memory, so the tab appears only when there is something to show.
              // Untimed runs record durations but have no budget to judge them
              // against, so the tab stays hidden there too.
              .filter(([id]) => id !== 'pace' || (paceRows.length > 0 && !attempt?.untimed))
              .map(([id, label]) => ({ id, label }))}
          />
        </div>

        <div key={tab} id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`} className="mt-6 animate-tab-enter print:animate-none">
          {/* All sections render so printing captures the whole report; only
              the active tab shows on screen. */}
          <section className={cn(tab === 'overview' ? '' : 'hidden print:block')}>
            <Card variant="solid" className="p-6 sm:p-8">
              <h2 className="text-ink-900 dark:text-white text-base font-bold text-balance">Accuracy by question type</h2>
              <p className="text-ink-500 dark:text-ink-on-dark-muted mt-1 text-sm">Most points lost first, so you can pick the drill with the biggest payoff.</p>
              <ul className="mt-5 space-y-3.5">
                {typeRows.map((row, i) => {
                  const ratio = row.maxPoints > 0 ? row.earnedPoints / row.maxPoints : 0
                  return (
                    <Reveal key={row.type} variant="up" delay={Math.min(i, 6) * 25} duration={500}>
                      <li>
                      <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                        <span className="text-ink-800 dark:text-ink-100 text-sm font-medium">
                          {row.label}
                          <span className="text-ink-500 dark:text-ink-on-dark-muted ml-2 text-xs">
                            {row.correct}/{row.total} fully correct
                          </span>
                        </span>
                        <div className="flex items-center gap-3">
                          <Link
                            to={`/practice?type=${row.type}`}
                            className="text-ink-900 dark:text-ink-50 hover:text-mark-700 dark:hover:text-mark-300 text-xs font-semibold hover:underline"
                          >
                            Drill this type
                          </Link>
                          <span className="text-ink-900 dark:text-white text-sm font-bold tabular-nums">
                            {row.earnedPoints.toFixed(1)} / {row.maxPoints}
                          </span>
                        </div>
                      </div>
                      <ProgressBar
                        value={row.earnedPoints}
                        max={row.maxPoints}
                        tone={ratio >= 0.8 ? 'mint' : ratio >= 0.5 ? 'amber' : 'rose'}
                        label={row.label}
                      />
                      </li>
                    </Reveal>
                  )
                })}
              </ul>
            </Card>
          </section>

          <section className={cn('print:mt-8', tab === 'pace' ? '' : 'hidden print:block')}>
            <Card variant="solid" className="p-6 sm:p-8">
              <h2 className="text-ink-900 dark:text-white text-base font-bold text-balance">Where your time went</h2>
              <p className="text-ink-500 dark:text-ink-on-dark-muted mt-1 text-sm">
                Average time per item against what the real test allows. Overruns tend to concentrate in two or three
                types rather than spread evenly.
                {attempt.timeScale === undefined
                  ? ` Timing mode was not recorded for this older attempt, so budgets below assume standard timing.`
                  : attempt.timeScale > 1
                    ? ` This run used a ${attempt.timeScale}× clock, so the budgets below are the extended ones — overruns against official timing may be understated.`
                    : null}
              </p>
              {paceWarnings(paceRows).length > 0 ? (
                <Callout className="mt-5" label="Worth fixing first">
                  <p className="text-ink-600 dark:text-ink-200 text-sm leading-relaxed">
                    {paceWarnings(paceRows)
                      .map(
                        (r) =>
                          `${r.label} at ${formatSeconds(r.averageSeconds)} against a ${formatSeconds(r.budgetSeconds)} budget`,
                      )
                      .join('; ')}
                    . Each of these is reading or listening time you will not have on the day.
                  </p>
                </Callout>
              ) : null}
              <ul className="mt-5 space-y-3">
                {paceRows.map((row) => (
                  <li key={row.type} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <div className="min-w-0">
                      <span className="text-ink-900 dark:text-white text-sm font-semibold">{row.label}</span>
                      <span className="text-ink-500 dark:text-ink-on-dark-muted ml-2 font-mono text-xs">{row.short}</span>
                    </div>
                    <div className="flex items-baseline gap-3">
                      <span className="text-ink-600 dark:text-ink-200 text-sm tabular-nums">
                        {formatSeconds(row.averageSeconds)} of {formatSeconds(row.budgetSeconds)}
                      </span>
                      <Badge tone={row.verdict === 'over' ? 'rose' : row.verdict === 'under' ? 'amber' : 'mint'}>
                        {row.verdict === 'over' ? 'over budget' : row.verdict === 'under' ? 'well under' : 'on pace'}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="text-ink-500 dark:text-ink-on-dark-muted mt-5 text-xs leading-relaxed">
                Under budget is not automatically good. A repeat sentence finished in two seconds was probably not
                understood, which the accuracy column will show. These items are individually timed in the real test,
                so pace here changes the pressure you feel rather than the marks you earn directly.
              </p>
            </Card>
          </section>

          <section className={cn('print:mt-8', tab === 'by-type' ? '' : 'hidden print:block')}>
            <div className="space-y-4">
              {skills.map(({ skill, score }) => {
                const types = typeRows.filter((r) => r.skill === skill)
                return (
                  <Card key={skill} variant="solid" className="p-6 sm:p-8">
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <h2 className="text-ink-900 dark:text-white text-base font-bold capitalize text-balance">{skill}</h2>
                      <p className="text-ink-500 dark:text-ink-on-dark-muted text-sm">
                        Estimated <span className="text-ink-900 dark:text-white font-bold tabular-nums">{score}</span> / 90
                        {score >= 71 ? ', C1 level' : score >= 46 ? ', B2 level' : ', below B2'}
                      </p>
                    </div>
                    <ul className="mt-4 space-y-3">
                      {types.map((row) => {
                        const qm = QUESTION_META[row.type]
                        const ratio = row.maxPoints > 0 ? row.earnedPoints / row.maxPoints : 0
                        return (
                          <li key={row.type} className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-ink-800 dark:text-ink-100 text-sm font-medium">{row.label}</p>
                                <Link
                                  to={`/practice?type=${row.type}`}
                                  className="text-ink-900 dark:text-ink-50 hover:text-mark-700 dark:hover:text-mark-300 text-xs font-semibold hover:underline"
                                >
                                  Drill
                                </Link>
                              </div>
                              <p className="text-ink-500 dark:text-ink-on-dark-muted mt-0.5 text-xs leading-relaxed">{qm?.tip}</p>
                            </div>
                            <span
                              className={cn(
                                'shrink-0 text-sm font-bold tabular-nums',
                                ratio >= 0.8
                                  ? 'text-mint-700 dark:text-mint-300'
                                  : ratio >= 0.5
                                    ? 'text-amber-700 dark:text-amber-300'
                                    : 'text-mark-600 dark:text-mark-300',
                              )}
                            >
                              {Math.round(ratio * 100)}%
                            </span>
                          </li>
                        )
                      })}
                    </ul>
                  </Card>
                )
              })}
            </div>
          </section>

          <section className={cn('print:mt-8', tab === 'review' ? '' : 'hidden print:block')}>
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className={cn(
                    'rounded-full px-4 py-2 text-xs font-bold transition-all cursor-pointer border',
                    filter === 'all'
                      ? 'bg-mark-500 text-white border-mark-500 shadow-sm'
                      : 'border-ink-200 bg-white text-ink-700 hover:border-mark-300 dark:border-white/10 dark:bg-ink-800 dark:text-ink-200',
                  )}
                  onClick={() => setFilter('all')}
                >
                  All questions ({details.length})
                </button>
                <button
                  type="button"
                  className={cn(
                    'rounded-full px-4 py-2 text-xs font-bold transition-all cursor-pointer border',
                    filter === 'lost'
                      ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                      : 'border-ink-200 bg-white text-ink-700 hover:border-amber-400 dark:border-white/10 dark:bg-ink-800 dark:text-ink-200',
                  )}
                  onClick={() => setFilter('lost')}
                >
                  Points lost ({lost.length})
                </button>
              </div>

              {visibleDetails.length === 0 ? (
                <Card variant="solid" className="p-8 text-center">
                  <p className="text-ink-700 dark:text-ink-200 text-sm font-semibold">
                    {details.length === 0
                      ? 'Item-level answer review is available during an active test session'
                      : 'No questions match the current filter'}
                  </p>
                  <p className="text-ink-500 dark:text-ink-on-dark-muted mt-1.5 text-xs leading-relaxed">
                    {details.length === 0
                      ? 'The full test score, CEFR band, and breakdown by question type are saved and visible in the tabs above.'
                      : 'Switch back to "All" to inspect all answered questions.'}
                  </p>
                </Card>
              ) : (
                <ul className="space-y-3">
                  {visibleDetails.map((d) => (
                    <ReviewRow key={d.itemId} detail={d} response={effectiveResponses[d.itemId]} />
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>

        <div className="no-print mt-10 flex flex-wrap gap-3">
          <ButtonLink to="/mock" magnetic onClick={() => exit()}>
            Take another mock
          </ButtonLink>
          <ButtonLink to="/dashboard" variant="secondary">
            See progress
          </ButtonLink>
          <ButtonLink to={focusPath} variant="secondary">
            {focusType ? `Practice ${focusType.label}` : 'Browse practice drills'}
          </ButtonLink>
          <Button
            variant="ghost"
            onClick={() => {
              if (settings.autoOpenReview) setTab('review')
              else setTab('overview')
            }}
          >
            {settings.autoOpenReview ? 'Show full review' : 'Show breakdown'}
          </Button>
        </div>
        </div>
      </main>
    </>
  )
}

function isEstimated(d: ItemScoreDetail): boolean {
  return d.type === 'write-essay' || d.type === 'summarize-written-text' || d.type === 'summarize-spoken-text' || d.skills.includes('speaking') || d.type === 'answer-short-question'
}

function TraitBreakdownView({ detail }: { detail: ItemScoreDetail }) {
  const meta = QUESTION_META[detail.type]
  const rows: Array<[string, number | undefined, number | undefined]> = [
    ['Content', detail.traits?.content, detail.contentMax],
    ['Form', detail.traits?.form, detail.formMax],
    ['Oral fluency', detail.traits?.oralFluency, 5],
    ['Pronunciation', detail.traits?.pronunciation, 5],
    ['Development, structure and coherence', detail.traits?.development, detail.type === 'write-essay' ? 6 : undefined],
    ['General linguistic range', detail.traits?.range, detail.type === 'write-essay' ? 6 : undefined],
    ['Grammar', detail.traits?.grammar, 2],
    ['Vocabulary', detail.traits?.vocabulary, 2],
    ['Spelling', detail.traits?.spelling, 2],
  ]
  const shown = rows.filter(([, v]) => typeof v === 'number' && v > 0)

  return (
    <div>
      <p className="text-ink-500 dark:text-ink-on-dark-muted text-xs font-semibold">
        Estimated traits, {meta.traits.join(', ')}
      </p>
      <ul className="mt-2 space-y-2">
        {shown.map(([label, value, max]) => {
          const pct = clamp01(value as number)
          return (
            <li key={label}>
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-ink-600 dark:text-ink-on-dark">{label}</span>
                <span className="text-ink-900 dark:text-white font-semibold tabular-nums">
                  {pct >= 0.85 ? 'band top' : pct >= 0.6 ? 'band middle' : pct >= 0.3 ? 'band low' : 'band 0'}
                  {max ? <span className="text-ink-500 dark:text-ink-on-dark-muted font-normal"> of {max}</span> : null}
                </span>
              </div>
              <div className="bg-ink-200 dark:bg-white/10 mt-1 h-1.5 w-full overflow-hidden">
                <div
                  className={cn(
                    'h-full',
                    pct >= 0.6 ? 'bg-mint-500' : pct >= 0.3 ? 'bg-amber-500' : 'bg-mark-600',
                  )}
                  style={{ width: `${Math.max(2, pct * 100)}%` }}
                />
              </div>
            </li>
          )
        })}
      </ul>
      <p className="text-ink-500 dark:text-ink-on-dark-muted mt-2 text-xs">
        Pearson scores these traits with a model it does not publish, so these bands are estimates. The published
        0–{maxOf(detail)} scale for each trait is what the bands are read against.
      </p>
    </div>
  )
}

function maxOf(detail: ItemScoreDetail): number {
  return detail.contentMax ?? detail.formMax ?? 5
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v))
}

function ReviewRow({ detail, response }: { detail: ItemScoreDetail; response: ItemResponse | undefined }) {
  const qm = QUESTION_META[detail.type]
  const [open, setOpen] = useState(false)
  const ratio = detail.maxPoints > 0 ? detail.points / detail.maxPoints : 0
  const candidateText = (response?.text as string | undefined) || (response?.transcript as string | undefined) || ''

  return (
    <li
      className={cn(
        'card-solid overflow-hidden p-0 transition-all',
        detail.status === 'correct' && 'border-mint-500/40 hover:border-mint-500/60',
        detail.status === 'partial' && 'border-amber-500/40 hover:border-amber-500/60',
        detail.status === 'incorrect' && 'border-rose-brand/40 hover:border-rose-brand/60',
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center gap-4 p-5 text-left transition-colors hover:bg-ink-100/50 dark:hover:bg-white/4"
        aria-expanded={open}
      >
        <span
          className={cn(
            'grid size-10 shrink-0 place-items-center rounded-xl text-sm font-bold',
            detail.status === 'correct' && 'bg-mint-500/15 text-mint-700 dark:text-mint-300',
            detail.status === 'partial' && 'bg-amber-500/15 text-amber-600 dark:text-amber-300',
            detail.status === 'incorrect' && 'bg-rose-brand/15 text-rose-brand dark:text-rose-300',
          )}
          aria-hidden="true"
        >
          {detail.status === 'correct' ? '✓' : detail.status === 'partial' ? '~' : '✕'}
        </span>
        <span className="min-w-0 flex-1">
          <span className="text-ink-900 dark:text-white block text-sm font-bold">{detail.label}</span>
          <span className="text-ink-500 dark:text-ink-on-dark-muted block text-xs capitalize mt-0.5">{detail.skills.join(' + ')}</span>
        </span>
        <span className="text-ink-900 dark:text-white shrink-0 text-sm font-bold tabular-nums">
          {detail.points.toFixed(1)} / {detail.maxPoints}
        </span>
      </button>

      {open ? (
        <div className="border-ink-200 dark:border-white/10 space-y-4 border-t p-5">
          {detail.notes.length > 0 ? (
            <ul className="space-y-1.5">
              {detail.notes.map((n, i) => (
                <li key={i} className="text-ink-600 dark:text-ink-on-dark flex gap-2 text-sm leading-relaxed">
                  <span className="text-amber-500 dark:text-amber-300 mt-0.5 shrink-0" aria-hidden="true">
                    •
                  </span>
                  {n}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-mint-700 dark:text-mint-300 text-sm">Full marks on this item.</p>
          )}

          {detail.gated ? (
            <p className="rounded-md border border-rose-brand/40 bg-rose-brand/8 p-3 text-sm dark:bg-rose-brand/15">
              <span className="text-rose-brand dark:text-rose-300 font-semibold">Zeroed by the score guide.</span> When Content or Form
              scores 0, no points are awarded for the item, however the other traits scored.
            </p>
          ) : null}

          {detail.traits && isEstimated(detail) ? (
            <TraitBreakdownView detail={detail} />
          ) : null}

          {detail.reference ? (
            <div>
              <p className="text-ink-500 dark:text-ink-on-dark-muted text-xs font-semibold">
                {isEstimated(detail) ? 'Model answer' : 'Answer key'}
              </p>
              <p className="passage bg-ink-100 dark:bg-white/5 border border-ink-200/60 dark:border-white/10 mt-1.5 rounded-md p-3 text-sm">{detail.reference}</p>
            </div>
          ) : null}

          {response ? <ResponseEcho detail={detail} response={response} /> : null}

          {isEstimated(detail) && candidateText.trim().length > 0 ? (
            <AiExaminerReview detail={detail} candidateText={candidateText} />
          ) : null}

          {qm?.tip ? (
            <p className="text-ink-700 dark:text-ink-200 border-ink-200 dark:border-white/10 border-t pt-3 text-sm leading-relaxed">
              <span className="font-bold">Tip, </span>
              {qm.tip}
            </p>
          ) : null}

          {ratio >= 0.999 ? null : (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-ink-100 pt-3 dark:border-white/10">
              <p className="text-ink-500 dark:text-ink-on-dark-muted text-xs">
                Estimated traits: content {Math.round(ratio * 100)}% of the available credit.
              </p>
              <Link
                to={`/practice?type=${detail.type}`}
                className="text-ink-900 dark:text-ink-50 hover:text-mark-700 dark:hover:text-mark-300 text-xs font-semibold hover:underline"
              >
                Drill {detail.label}
              </Link>
            </div>
          )}
        </div>
      ) : null}
    </li>
  )
}

export function formatResponseEchoLines(
  response: ItemResponse,
  tokens?: readonly string[],
): string[] {
  const lines: string[] = []
  const choice = response.choice as string | undefined
  if (choice) lines.push(`Your answer: ${choice}`)
  const choices = response.choices as string[] | undefined
  if (choices && choices.length) lines.push(`Your answers: ${choices.join(', ')}`)
  const blanks = response.blanks
  if (Array.isArray(blanks) && blanks.length > 0) {
    lines.push(`Your answers: ${blanks.map((b, i) => b || `(blank ${i + 1})`).join(', ')}`)
  }
  const order = response.order as string[] | undefined
  if (order) lines.push(`Your order: ${order.join(' → ')}`)
  const highlighted = response.highlighted as number[] | undefined
  if (highlighted && highlighted.length > 0) {
    lines.push(`You highlighted: ${highlighted.map((i) => (tokens?.[i] ? `“${tokens[i]}”` : `#${i + 1}`)).join(', ')}`)
  }
  const text = response.text as string | undefined
  if (text) lines.push(`You wrote: ${text}`)
  const transcript = response.transcript as string | undefined
  if (transcript) lines.push(`Your answer (transcribed): ${transcript}`)

  return lines
}

function ResponseEcho({ detail, response }: { detail: ItemScoreDetail; response: ItemResponse }) {
  const lines = formatResponseEchoLines(response, detail.tokens)
  if (lines.length === 0) return null

  return (
    <div>
      <p className="text-ink-500 dark:text-ink-on-dark-muted text-xs font-semibold">What you gave</p>
      <ul className="mt-1.5 space-y-1.5">
        {lines.map((l, i) => (
          <li key={i} className="text-ink-600 dark:text-ink-on-dark min-w-0 text-sm leading-relaxed break-words">
            {l}
          </li>
        ))}
      </ul>
    </div>
  )
}

function AiExaminerReview({
  detail,
  candidateText,
}: {
  detail: ItemScoreDetail
  candidateText: string
}) {
  const { settings, set } = useSettings()
  const [evaluating, setEvaluating] = useState(false)
  const [result, setResult] = useState<AiEvaluationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [quickKey, setQuickKey] = useState('')
  const [showKeyPrompt, setShowKeyPrompt] = useState(false)

  const handleEvaluate = async (apiKeyToUse?: string) => {
    const key = (apiKeyToUse || settings.groqApiKey || '').trim()
    if (!key) {
      setShowKeyPrompt(true)
      return
    }
    setEvaluating(true)
    setError(null)
    try {
      const res = await evaluateWithAi(
        { id: detail.itemId, type: detail.type },
        detail.reference,
        candidateText,
        key,
      )
      if (res) {
        setResult(res)
      } else {
        setError('Evaluation failed. Please verify your Groq API key.')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Evaluation error')
    } finally {
      setEvaluating(false)
    }
  }

  const handleSaveQuickKey = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = quickKey.trim()
    if (!trimmed) return
    set('groqApiKey', trimmed)
    set('aiScoringEnabled', true)
    setShowKeyPrompt(false)
    void handleEvaluate(trimmed)
  }

  return (
    <div className="rounded-xl border border-brand-500/20 bg-brand-500/5 p-4 dark:border-brand-500/30 dark:bg-brand-500/10 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">
            AI Examiner (Groq BYOK)
          </span>
          <Badge tone={result ? 'mint' : 'neutral'}>
            {result ? `${result.rawScore}/${result.maxScore} pts (Deterministic)` : 'Deterministic Rubric'}
          </Badge>
        </div>
        {!result && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={evaluating}
            onClick={() => handleEvaluate()}
            className="text-xs font-semibold"
          >
            {evaluating ? 'Grading against Pearson rubrics...' : '⚡ Grade with AI Examiner'}
          </Button>
        )}
      </div>

      {showKeyPrompt && !result && (
        <form onSubmit={handleSaveQuickKey} className="pt-2 border-t border-brand-500/20 space-y-2">
          <p id="groq-key-hint" className="text-xs text-ink-600 dark:text-ink-on-dark leading-relaxed">
            Provide your free Groq API key to unlock deterministic Pearson rubric grading. 100% in-browser, stored in localStorage.
          </p>
          <label
            htmlFor="groq-quick-key"
            className="block text-xs font-bold text-ink-700 dark:text-ink-200"
          >
            Groq API key
          </label>
          <div className="flex gap-2">
            <input
              id="groq-quick-key"
              type="password"
              placeholder="Paste gsk_... key"
              value={quickKey}
              onChange={(e) => setQuickKey(e.target.value)}
              aria-describedby={error ? 'groq-key-hint groq-key-error' : 'groq-key-hint'}
              aria-invalid={error ? 'true' : undefined}
              className="flex-1 rounded-lg border border-ink-300 dark:border-white/10 bg-white dark:bg-ink-900 px-3 py-1.5 text-xs font-mono text-ink-900 dark:text-ink-100 placeholder:text-ink-500 dark:placeholder:text-ink-on-dark-muted"
              autoComplete="off"
              spellCheck="false"
            />
            <Button type="submit" size="sm" className="text-xs shrink-0">
              Save & Score
            </Button>
          </div>
          <a
            href="https://console.groq.com/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-brand-600 dark:text-brand-400 hover:underline inline-block font-medium"
          >
            Get a free Groq key at console.groq.com →
          </a>
        </form>
      )}

      {error && (
        <p key={error} id="groq-key-error" className="animate-error-nudge text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>
      )}

      {result && (
        <div className="space-y-3 pt-2 border-t border-brand-500/20">
          <div>
            <p className="text-ink-600 dark:text-ink-on-dark-muted text-xs font-semibold">
              AI Trait Breakdown (Pearson Rubric)
            </p>
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(result.traits).map(([trait, score]) => {
                if (typeof score !== 'number') return null
                const pct = Math.round(score * 100)
                return (
                  <div key={trait} className="rounded-lg bg-white/60 dark:bg-white/5 border border-ink-200/50 dark:border-white/10 p-2 text-xs">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="capitalize text-ink-700 dark:text-ink-200 font-medium">{trait}</span>
                      <span className="font-bold tabular-nums text-ink-900 dark:text-white">{pct}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-ink-200 dark:bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full', pct >= 70 ? 'bg-mint-500' : pct >= 40 ? 'bg-amber-500' : 'bg-rose-500')}
                        style={{ width: `${Math.max(4, pct)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {result.feedback.length > 0 && (
            <div>
              <p className="text-ink-600 dark:text-ink-on-dark-muted text-xs font-semibold">Examiner Feedback</p>
              <ul className="mt-1 space-y-1">
                {result.feedback.map((point, i) => (
                  <li key={i} className="text-xs text-ink-700 dark:text-ink-200 flex items-start gap-1.5">
                    <span className="text-brand-500 mt-0.5">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.suggestedRewrittenEssay && (
            <div>
              <p className="text-ink-600 dark:text-ink-on-dark-muted text-xs font-semibold">
                Band 90 Model Response (Based on Your Arguments)
              </p>
              <p className="mt-1.5 text-xs text-ink-800 dark:text-ink-100 bg-white/80 dark:bg-white/5 border border-ink-200 dark:border-white/10 rounded-lg p-3 font-serif leading-relaxed italic">
                “{result.suggestedRewrittenEssay}”
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
