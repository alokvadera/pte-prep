import { useEffect, useMemo, useState } from 'react'
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
import { ScoreRangeBar, SkillBars } from '../components/charts/ScoreRangeBar'
import { CountUp } from '../components/ui/motion'
import { useTest } from '../store/useTest'
import { useSettings } from '../store/useSettings'

type Tab = 'overview' | 'pace' | 'by-type' | 'review'

export default function ResultPage() {
  const [params, setSearchParams] = useSearchParams()
  const mock = useTest((s) => s.mock)
  const responses = useTest((s) => s.responses)
  const finish = useTest((s) => s.finish)
  const exit = useTest((s) => s.exit)
  const { settings } = useSettings()
  const [loading, setLoading] = useState(true)
  const [attempt, setAttempt] = useState<AttemptRecord | null>(null)
  const [tab, setTab] = useState<Tab>('overview')
  const [filter, setFilter] = useState<'all' | 'lost'>('all')

  // Score once when runner reports test finished, or load stored attempt by query id.
  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const existing = params.get('attempt')
        if (existing) {
          if (attempt?.id === existing) {
            setLoading(false)
            return
          }
          let stored = await getAttempt(existing)
          if (!stored) {
            stored = (await fetchAttemptFromCloud(existing)) ?? undefined
          }
          if (!cancelled) {
            setAttempt(stored ?? null)
            setLoading(false)
          }
          return
        }
        if (mock) {
          const record = await finish()
          if (!cancelled && record) {
            setAttempt(record)
            setLoading(false)
            setSearchParams({ attempt: record.id }, { replace: true })
            void syncAttemptToCloud(record)
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
  const effectiveMock = useMemo(() => {
    if (mock) return mock
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
  }, [mock, seed, attempt?.mockKind, attempt?.sectionIds, attempt?.timeScale, attempt?.untimed])

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
    () => (mock && attempt ? paceReport(Object.values(mock.items), attempt.responses ?? {}) : []),
    [mock, attempt],
  )

  if (loading) {
    return (
      <div className="grid min-h-dvh place-items-center px-4">
        <div className="text-center">
          <span className="border-brand-500/25 border-t-brand-500 mx-auto block size-9 animate-spin rounded-full border-2" />
          <p className="text-ink-500 dark:text-ink-400 mt-4 text-sm">Scoring your responses…</p>
        </div>
      </div>
    )
  }

  if (!attempt) {
    return (
      <div className="route-inner min-h-dvh">
        <div className="page-shell-empty">
          <Card className="text-center">
            <h1 className="text-ink-900 dark:text-white text-xl font-bold text-balance">No test result found</h1>
            <p className="text-ink-500 dark:text-ink-400 mt-2 text-sm leading-relaxed">
              There is no active test session or saved result with this ID on this device.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <ButtonLink to="/mock">Start a mock test</ButtonLink>
              <ButtonLink to="/dashboard" variant="secondary">Go to dashboard</ButtonLink>
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

  const typeRows = Object.values(attempt.breakdown).sort((a, b) => {
    const ra = a.maxPoints > 0 ? a.earnedPoints / a.maxPoints : 0
    const rb = b.maxPoints > 0 ? b.earnedPoints / b.maxPoints : 0
    return ra - rb
  })

  return (
    <>
      <Seo />

      <a
        href="#main-content"
        className="bg-brand-500 focus:ring-brand-300 sr-only rounded-lg px-4 py-2 text-white focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-100"
      >
        Skip to content
      </a>

      <main id="main-content" className="route-inner min-h-dvh">
        <div className="page-shell-app animate-rise-in">
        {/* Header */}
        <header className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={attempt.overallIsEstimate ? 'mint' : 'brand'}>
                {attempt.overallIsEstimate ? 'Estimated score' : 'Auto-scored'}
              </Badge>
              <Badge tone="neutral">{attempt.mockTitle}</Badge>
              <Badge tone="neutral">{formatDuration(attempt.durationMs)}</Badge>
              <button
                type="button"
                onClick={() => window.print()}
                className="btn-ghost no-print inline-flex items-center gap-1.5 py-1 px-2.5 text-xs text-brand-600 dark:text-brand-300 font-semibold cursor-pointer ml-auto"
                title="Print or Save PDF Diagnostic Score Card"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="size-3.5" aria-hidden="true">
                  <path fillRule="evenodd" d="M5 2.75C5 2.06 5.56 1.5 6.25 1.5h7.5c.69 0 1.25.56 1.25 1.25v2.5H5v-2.5zM3.5 6.75A2.25 2.25 0 001.25 9v5.5A2.25 2.25 0 003.5 16.75h1.25v1.5c0 .69.56 1.25 1.25 1.25h8c.69 0 1.25-.56 1.25-1.25v-1.5h1.25A2.25 2.25 0 0018.75 14.5V9A2.25 2.25 0 0016.5 6.75H3.5zm2.75 8v3.25h7.5V14.75H6.25zM16 9.5a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" clipRule="evenodd" />
                </svg>
                Print / Save PDF
              </button>
            </div>
            <h1 className="page-title-compact mt-3">
              CEFR {attempt.cefr} · {cefrLabel(attempt.cefr)}
            </h1>
            <p className="text-ink-500 dark:text-ink-300 mt-1.5 text-sm">
              <CountUp value={Math.round(accuracy * 100)} suffix="%" duration={1100} /> of the available points. The
              weakest area is{' '}
              <span className="font-semibold capitalize">{weakest?.skill ?? '—'}</span>.
            </p>
          </div>

          <div className="min-w-0 flex-1 basis-64 sm:max-w-sm">
            <div className="flex flex-wrap items-baseline gap-3">
              <p className="text-ink-900 dark:text-white font-mono text-4xl font-bold tabular-nums tracking-[-0.02em]">
                <CountUp value={attempt.overallScore} duration={1300} />
              </p>
              <p className="text-ink-500 dark:text-ink-400 text-sm">
                of 90 · <span className="tabular-nums">{attempt.overallScore60}</span> on the 60–120 scale
              </p>
            </div>
            <ScoreRangeBar
              score={attempt.overallScore}
              band={attempt.cefr}
              fraction={accuracy}
              className="mt-3"
              label={`Overall score ${attempt.overallScore} out of 90, CEFR band ${attempt.cefr}`}
            />
          </div>
        </header>

        {/* Skills, on one shared scale so the bars are actually comparable. */}
        <div className="card mt-6">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-ink-900 dark:text-white text-base font-bold text-balance">By skill</h2>
            <p className="text-ink-500 dark:text-ink-400 text-xs">
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

        <details className="card mt-6 no-print">
          <summary className="text-ink-900 dark:text-white cursor-pointer list-none text-sm font-semibold [&::-webkit-details-marker]:hidden">
            How much of this number is exact?
          </summary>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <div>
              <p className="text-ink-900 dark:text-white font-mono text-3xl font-bold tabular-nums tracking-[-0.02em]">
                {details.filter((d) => d.maxPoints > 0).length - estimatedCount}
                <span className="text-ink-500 dark:text-ink-400 text-lg font-bold"> of {details.filter((d) => d.maxPoints > 0).length}</span>
              </p>
              <p className="text-ink-500 dark:text-ink-400 mt-1 text-sm">
                items scored exactly against an answer key. Multiple choice, fill in the blanks, re-order paragraphs and
                highlight-the-incorrect-words are all deterministic, including partial credit per blank and the
                one-point deduction for a wrong multi-select.
              </p>
            </div>
            <div>
              <p className="text-ink-900 dark:text-white font-mono text-3xl font-bold tabular-nums tracking-[-0.02em]">
                {estimatedCount}
                <span className="text-ink-500 dark:text-ink-400 text-lg font-bold"> estimated</span>
              </p>
              <p className="text-ink-500 dark:text-ink-400 mt-1 text-sm">
                speaking and writing responses, rated with a rubric over the same four constructs Pearson uses. Read
                these as a band, not a number — and record with a microphone to narrow them.
              </p>
            </div>
          </div>
          <p className="text-ink-500 dark:text-ink-400 mt-5 border-t pt-4 text-xs leading-relaxed">
            Pearson produces the overall score with a single item-response-theory scaling, and states plainly that it is
            <em> not </em> an average of the four skill scores. Ours is computed from the same item points, which is the
            closest honest approximation available without their model. The four things Pearson does not publish — the
            Read Aloud error conversion, the trait weighting, the item-to-scale step, and per-skill CEFR bands — are
            listed in full on the <Link to="/scoring" className="text-brand-500 dark:text-brand-300 underline">scoring page</Link>.
          </p>
        </details>

        {/* Admission thresholds */}
        <Card className="mt-6">
          <h2 className="text-ink-900 dark:text-white text-base font-bold text-balance">What this score means</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {ADMISSION_TARGETS.map((t) => {
              // Three states, not two: inside the target band, above it, or short.
              const match = t.range.match(/(\d+)(?:–(\d+))?/)
              const lo = Number(match?.[1] ?? 0)
              const hi = match?.[2] ? Number(match[2]) : null
              const score = attempt.overallScore60
              const inside = hi === null ? score >= lo : score >= lo && score <= hi
              const exceeds = hi !== null && score > hi
              const state = inside ? 'met' : exceeds ? 'exceeded' : 'notMet'
              return (
                <li
                  key={t.label}
                  className={cn(
                    'flex items-start gap-3 rounded-lg border p-4',
                    state === 'notMet'
                      ? 'border-ink-200 dark:border-white/10'
                      : state === 'met'
                        ? 'border-mint-500/50 bg-mint-500/8'
                        : 'border-mint-500/25',
                  )}
                >
                  <span
                    className={cn(
                      'mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-micro font-bold',
                      state === 'notMet'
                        ? 'bg-ink-200 text-ink-500 dark:bg-white/10 dark:text-ink-400'
                        : 'bg-mint-500 text-white',
                    )}
                    aria-hidden="true"
                  >
                    {state === 'notMet' ? '·' : '✓'}
                  </span>
                  <div className="min-w-0">
                    <p className="text-ink-900 dark:text-white text-sm font-semibold">
                      {t.label}{' '}
                      <span className="text-ink-500 dark:text-ink-400 font-normal">· target {t.range}</span>
                      {state !== 'notMet' ? (
                        <span className="text-mint-700 dark:text-mint-300 ml-2 text-xs font-semibold">
                          {state === 'met' ? 'met' : 'exceeded'}
                        </span>
                      ) : null}
                    </p>
                    <p className="text-ink-500 dark:text-ink-400 mt-0.5 text-xs leading-relaxed">{t.note}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        </Card>

        {/* Tabs */}
        <div className="no-print mt-10 border-ink-200 dark:border-white/10 border-b">
          <div className="-mb-px flex gap-1 overflow-x-auto" role="tablist">
            {(
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
              .map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className={cn(
                  'shrink-0 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors',
                  tab === id
                    ? 'border-brand-500 text-brand-600 dark:text-brand-300'
                    : 'text-ink-500 hover:text-ink-800 dark:text-ink-400 dark:hover:text-ink-100',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div key={tab} className="mt-6 animate-fade-in">
          {tab === 'overview' ? (
            <Card>
              <h2 className="text-ink-900 dark:text-white text-base font-bold text-balance">Accuracy by question type</h2>
              <p className="text-ink-500 dark:text-ink-400 mt-1 text-sm">Weakest first.</p>
              <ul className="mt-5 space-y-3.5">
                {typeRows.map((row) => {
                  const ratio = row.maxPoints > 0 ? row.earnedPoints / row.maxPoints : 0
                  return (
                    <li key={row.type}>
                      <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                        <span className="text-ink-800 dark:text-ink-100 text-sm font-medium">
                          {row.label}
                          <span className="text-ink-500 dark:text-ink-400 ml-2 text-xs">
                            {row.correct}/{row.total} fully correct
                          </span>
                        </span>
                        <div className="flex items-center gap-3">
                          <Link
                            to={`/practice?type=${row.type}`}
                            className="text-brand-600 hover:text-brand-700 dark:text-brand-300 dark:hover:text-brand-200 text-xs font-semibold hover:underline"
                          >
                            Drill this type →
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
                  )
                })}
              </ul>
            </Card>
          ) : null}

          {tab === 'pace' ? (
            <Card>
              <h2 className="text-ink-900 dark:text-white text-base font-bold text-balance">Where your time went</h2>
              <p className="text-ink-500 dark:text-ink-400 mt-1 text-sm">
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
                      <span className="text-ink-500 dark:text-ink-400 ml-2 font-mono text-xs">{row.short}</span>
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
              <p className="text-ink-500 dark:text-ink-400 mt-5 text-xs leading-relaxed">
                Under budget is not automatically good. A repeat sentence finished in two seconds was probably not
                understood, which the accuracy column will show. These items are individually timed in the real test,
                so pace here changes the pressure you feel rather than the marks you earn directly.
              </p>
            </Card>
          ) : tab === 'by-type' ? (
            <div className="space-y-4">
              {skills.map(({ skill, score }) => {
                const types = typeRows.filter((r) => r.skill === skill)
                return (
                  <Card key={skill}>
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <h2 className="text-ink-900 dark:text-white text-base font-bold capitalize text-balance">{skill}</h2>
                      <p className="text-ink-500 dark:text-ink-400 text-sm">
                        Estimated <span className="text-ink-900 dark:text-white font-bold tabular-nums">{score}</span> / 90
                        {score >= 71 ? ' · C1 level' : score >= 46 ? ' · B2 level' : ' · below B2'}
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
                                  className="text-brand-600 hover:text-brand-700 dark:text-brand-300 dark:hover:text-brand-200 text-xs font-semibold hover:underline"
                                >
                                  Drill →
                                </Link>
                              </div>
                              <p className="text-ink-500 dark:text-ink-400 mt-0.5 text-xs leading-relaxed">{qm?.tip}</p>
                            </div>
                            <span
                              className={cn(
                                'shrink-0 text-sm font-bold tabular-nums',
                                ratio >= 0.8
                                  ? 'text-mint-600 dark:text-mint-300'
                                  : ratio >= 0.5
                                    ? 'text-amber-600 dark:text-amber-300'
                                    : 'text-rose-brand dark:text-rose-300',
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
          ) : null}

          {tab === 'review' ? (
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className={cn('btn-secondary text-sm', filter === 'all' && 'border-brand-500 text-brand-600 dark:text-brand-300')}
                  onClick={() => setFilter('all')}
                >
                  All {details.length}
                </button>
                <button
                  type="button"
                  className={cn('btn-secondary text-sm', filter === 'lost' && 'border-amber-500 text-amber-600 dark:text-amber-300')}
                  onClick={() => setFilter('lost')}
                >
                  Points lost {lost.length}
                </button>
              </div>

              {visibleDetails.length === 0 ? (
                <Card>
                  <p className="text-ink-700 dark:text-ink-200 text-sm font-semibold">
                    {details.length === 0
                      ? 'Item-level answer review is available during an active test session'
                      : 'No questions match the current filter'}
                  </p>
                  <p className="text-ink-500 dark:text-ink-400 mt-1.5 text-xs leading-relaxed">
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
          ) : null}
        </div>

        <div className="no-print mt-10 flex flex-wrap gap-3">
          <ButtonLink to="/mock" onClick={() => exit()}>
            Take another mock
          </ButtonLink>
          <ButtonLink to="/dashboard" variant="secondary">
            See progress
          </ButtonLink>
          <ButtonLink
            to={typeRows[0] ? `/practice?type=${typeRows[0].type}` : '/practice'}
            variant="secondary"
          >
            Practice weakest type{typeRows[0] ? ` (${typeRows[0].label})` : ''} →
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
      <p className="text-ink-500 dark:text-ink-400 text-xs font-semibold">
        Estimated traits · {meta.traits.join(', ')}
      </p>
      <ul className="mt-2 space-y-2">
        {shown.map(([label, value, max]) => {
          const pct = clamp01(value as number)
          return (
            <li key={label}>
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-ink-600 dark:text-ink-300">{label}</span>
                <span className="text-ink-900 dark:text-white font-semibold tabular-nums">
                  {pct >= 0.85 ? 'band top' : pct >= 0.6 ? 'band middle' : pct >= 0.3 ? 'band low' : 'band 0'}
                  {max ? <span className="text-ink-500 dark:text-ink-400 font-normal"> of {max}</span> : null}
                </span>
              </div>
              <div className="bg-ink-200 dark:bg-white/10 mt-1 h-1.5 w-full overflow-hidden rounded-full">
                <div
                  className={cn(
                    'h-full rounded-full',
                    pct >= 0.6 ? 'bg-mint-500' : pct >= 0.3 ? 'bg-amber-500' : 'bg-rose-brand',
                  )}
                  style={{ width: `${Math.max(2, pct * 100)}%` }}
                />
              </div>
            </li>
          )
        })}
      </ul>
      <p className="text-ink-500 dark:text-ink-400 mt-2 text-xs">
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

  return (
    <li
      className={cn(
        'card overflow-hidden p-0',
        detail.status === 'correct' && 'border-mint-500/40',
        detail.status === 'partial' && 'border-amber-500/40',
        detail.status === 'incorrect' && 'border-rose-brand/40',
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center gap-4 p-4 text-left"
        aria-expanded={open}
      >
        <span
          className={cn(
            'grid size-9 shrink-0 place-items-center rounded-lg text-xs font-bold',
            detail.status === 'correct' && 'bg-mint-500/15 text-mint-600 dark:text-mint-300',
            detail.status === 'partial' && 'bg-amber-500/15 text-amber-600 dark:text-amber-300',
            detail.status === 'incorrect' && 'bg-rose-brand/15 text-rose-brand dark:text-rose-300',
          )}
          aria-hidden="true"
        >
          {detail.status === 'correct' ? '✓' : detail.status === 'partial' ? '~' : '✕'}
        </span>
        <span className="min-w-0 flex-1">
          <span className="text-ink-900 dark:text-white block text-sm font-semibold">{detail.label}</span>
          <span className="text-ink-500 dark:text-ink-400 block text-xs capitalize">{detail.skills.join(' + ')}</span>
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
                <li key={i} className="text-ink-600 dark:text-ink-300 flex gap-2 text-sm leading-relaxed">
                  <span className="text-amber-500 dark:text-amber-300 mt-0.5 shrink-0" aria-hidden="true">
                    •
                  </span>
                  {n}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-mint-600 dark:text-mint-300 text-sm">Full marks on this item.</p>
          )}

          {detail.gated ? (
            <p className="rounded-lg border border-rose-brand/40 bg-rose-brand/8 p-3 text-sm dark:bg-rose-brand/15">
              <span className="text-rose-brand dark:text-rose-300 font-semibold">Zeroed by the score guide.</span> When Content or Form
              scores 0, no points are awarded for the item, however the other traits scored.
            </p>
          ) : null}

          {detail.traits && isEstimated(detail) ? (
            <TraitBreakdownView detail={detail} />
          ) : null}

          {detail.reference ? (
            <div>
              <p className="text-ink-500 dark:text-ink-400 text-xs font-semibold">
                {isEstimated(detail) ? 'Model answer' : 'Answer key'}
              </p>
              <p className="passage bg-ink-100 dark:bg-white/5 border border-ink-200/60 dark:border-white/10 mt-1.5 rounded-lg p-3 text-sm">{detail.reference}</p>
            </div>
          ) : null}

          {response ? <ResponseEcho detail={detail} response={response} /> : null}

          {qm?.tip ? (
            <p className="text-brand-500 dark:text-brand-300 border-brand-500/25 border-t pt-3 text-sm leading-relaxed">
              <span className="font-bold">Tip · </span>
              {qm.tip}
            </p>
          ) : null}

          {ratio >= 0.999 ? null : (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-ink-100 pt-3 dark:border-white/10">
              <p className="text-ink-500 dark:text-ink-400 text-xs">
                Estimated traits: content {Math.round(ratio * 100)}% of the available credit.
              </p>
              <Link
                to={`/practice?type=${detail.type}`}
                className="text-brand-600 hover:text-brand-700 dark:text-brand-300 dark:hover:text-brand-200 text-xs font-semibold hover:underline"
              >
                Drill {detail.label} →
              </Link>
            </div>
          )}
        </div>
      ) : null}
    </li>
  )
}

function ResponseEcho({ detail, response }: { detail: ItemScoreDetail; response: ItemResponse }) {
  const lines: string[] = []
  const choice = response.choice as string | undefined
  if (choice) lines.push(`Your answer: ${choice}`)
  const choices = response.choices as string[] | undefined
  if (choices && choices.length) lines.push(`Your answers: ${choices.join(' · ')}`)
  const blanks = response.blanks as Array<string | null> | undefined
  if (blanks) lines.push(`Your answers: ${blanks.map((b, i) => b || `(blank ${i + 1})`).join(' · ')}`)
  const order = response.order as string[] | undefined
  if (order) lines.push(`Your order: ${order.join(' → ')}`)
  const highlighted = response.highlighted as number[] | undefined
  const tokens = detail.tokens
  if (highlighted && highlighted.length > 0) {
    lines.push(`You highlighted: ${highlighted.map((i) => (tokens?.[i] ? `“${tokens[i]}”` : `#${i + 1}`)).join(' · ')}`)
  }
  const text = response.text as string | undefined
  if (text) lines.push(`You wrote: ${text}`)
  const transcript = response.transcript as string | undefined
  if (transcript) lines.push(`Your answer (transcribed): ${transcript}`)

  if (lines.length === 0) return null

  return (
    <div>
      <p className="text-ink-500 dark:text-ink-400 text-xs font-semibold">What you gave</p>
      <ul className="mt-1.5 space-y-1.5">
        {lines.map((l, i) => (
          <li key={i} className="text-ink-600 dark:text-ink-300 min-w-0 text-sm leading-relaxed break-words">
            {l}
          </li>
        ))}
      </ul>
    </div>
  )
}
