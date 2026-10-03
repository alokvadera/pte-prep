import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { clearAttempts, listAttempts } from '../db/db'
import { deleteAttemptEverywhere, syncCloudToLocal } from '../lib/sync'
import { useAuth } from '../store/useAuth'
import { QUESTION_META } from '../domain/blueprint'
import type { AttemptRecord, QuestionType, Skill } from '../domain/types'
import { formatDate, formatDateTime, formatDuration } from '../lib/format'
import { cn } from '../lib/cn'
import { Seo } from '../seo/Seo'
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  CardTitle,
  Disclosure,
  EmptyState,
  PageWrapper,
  ProgressBar,
  SectionHeading,
  Stat,
  Toggle,
} from '../components/ui/primitives'
import { Breadcrumbs } from '../components/ui/Breadcrumbs'
import { useSettings } from '../store/useSettings'
import { weakestTypes } from '../domain/weakTypes'

const SKILL_ORDER: Skill[] = ['reading', 'listening', 'speaking', 'writing']

export default function Dashboard() {
  const navigate = useNavigate()
  const { settings, set } = useSettings()
  const user = useAuth((s) => s.user)
  const hasLoggedInBefore = useAuth((s) => s.hasLoggedInBefore)
  const [confirmClearAll, setConfirmClearAll] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [attempts, setAttempts] = useState<AttemptRecord[] | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const initial = await listAttempts(100)
      if (!cancelled) setAttempts(initial)
      const { pushed, pulled } = await syncCloudToLocal()
      if (!cancelled && (pushed > 0 || pulled > 0)) {
        setAttempts(await listAttempts(100))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // Only types with evidence behind them, so the panel recommends rather than surveys.
  const focus = useMemo(() => weakestTypes(attempts ?? [], 3, true), [attempts])

  const stats = useMemo(() => {
    if (!attempts || attempts.length === 0) return null
    const sorted = [...attempts].sort((a, b) => a.finishedAt.localeCompare(b.finishedAt))
    const latest = sorted[sorted.length - 1]
    const first = sorted[0]
    if (!latest || !first) return null

    const skillAvg: Partial<Record<Skill, number>> = {}
    for (const s of SKILL_ORDER) {
      const values = attempts
        .map((a) => a.skillScores[s])
        .filter((v): v is number => typeof v === 'number')
      if (values.length > 0) skillAvg[s] = values.reduce((a, b) => a + b, 0) / values.length
    }

    const typeAgg: Record<string, { earned: number; max: number; n: number }> = {}
    for (const a of attempts) {
      for (const [type, row] of Object.entries(a.breakdown)) {
        const acc = (typeAgg[type] ??= { earned: 0, max: 0, n: 0 })
        acc.earned += row.earnedPoints
        acc.max += row.maxPoints
        acc.n += row.total
      }
    }
    const typeRows = Object.entries(typeAgg)
      .map(([type, v]) => ({ type, ...v, ratio: v.max > 0 ? v.earned / v.max : 0 }))
      .sort((a, b) => a.ratio - b.ratio)

    return {
      latest,
      first,
      delta: latest.overallScore - first.overallScore,
      best: Math.max(...attempts.map((a) => a.overallScore)),
      skillAvg,
      typeRows,
      sorted,
    }
  }, [attempts])

  return (
    <>
      <Seo />

      <PageWrapper
        breadcrumbs={<Breadcrumbs trail={[{ name: 'Home', path: '/' }, { name: 'Progress' }]} />}
        eyebrow="Progress"
        title="See what is getting stronger."
        description="Your attempts and skill trends are private to you. Sign in with email to back them up securely to Cloudflare edge storage."
        actions={attempts && attempts.length > 0 ? <ButtonLink to="/mock" size="lg">Take another mock</ButtonLink> : undefined}
      >
        <div className="mt-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-ink-100 bg-ink-50/70 p-4 sm:p-5 dark:border-white/8 dark:bg-white/4">
            <div className="flex items-center gap-3.5">
              <div
                className={cn(
                  'size-10 rounded-xl flex items-center justify-center shrink-0',
                  user
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-brand-500/10 text-brand-600 dark:text-brand-400',
                )}
              >
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 00-9.78 2.096A4.001 4.001 0 003 15z"
                  />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-ink-900 dark:text-ink-50">
                    {user ? user.email : 'Cloud Backup & Sync'}
                  </p>
                  <Badge tone={user ? 'mint' : 'neutral'}>
                    {user ? 'Cloud Synced' : 'Device Only'}
                  </Badge>
                </div>
                <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">
                  {user
                    ? `Target score: ${user.targetScore}. Tests are backed up to Cloudflare D1.`
                    : 'Sign in with your email to automatically back up tests and sync across devices.'}
                </p>
              </div>
            </div>
            <ButtonLink
              to={user ? '/login' : hasLoggedInBefore ? '/login' : '/register'}
              variant={user ? 'secondary' : 'primary'}
              size="sm"
              className="shrink-0"
            >
              {user ? 'Manage account' : hasLoggedInBefore ? 'Sign in' : 'Create account'}
            </ButtonLink>
          </div>
        </div>

        {attempts === null ? (
          <div className="mt-12 grid place-items-center py-20">
            <span className="border-brand-500/25 border-t-brand-500 size-8 animate-spin rounded-full border-2" />
          </div>
        ) : attempts.length === 0 ? (
          <div className="mt-12 space-y-8">
            <EmptyState
              title="No attempts yet"
              description="Take a full mock test and your score history, skill trends and question-type breakdown will appear here."
              action={
                <ButtonLink to="/mock">
                  Start your first mock
                </ButtonLink>
              }
            />

            <div className="grid gap-6 sm:grid-cols-3">
              <Link to="/mock" className="card-interactive group">
                <span className="pill bg-brand-500/10 text-brand-700 dark:text-brand-300 font-mono text-micro">Full simulation</span>
                <CardTitle className="mt-2 text-base group-hover:text-brand-600 dark:group-hover:text-brand-400">Timed mock test</CardTitle>
                <p className="text-ink-500 dark:text-ink-400 mt-1.5 text-sm leading-relaxed">
                  Run through all 22 question types under official test timings with machine scoring.
                </p>
              </Link>
              <Link to="/practice" className="card-interactive group">
                <span className="pill bg-brand-500/10 text-brand-700 dark:text-brand-300 font-mono text-micro">Targeted drill</span>
                <CardTitle className="mt-2 text-base group-hover:text-brand-600 dark:group-hover:text-brand-400">Practice by skill</CardTitle>
                <p className="text-ink-500 dark:text-ink-400 mt-1.5 text-sm leading-relaxed">
                  Select speaking, writing, reading, or listening and drill only the types you need.
                </p>
              </Link>
              <Link to="/format" className="card-interactive group">
                <span className="pill bg-brand-500/10 text-brand-700 dark:text-brand-300 font-mono text-micro">Reference</span>
                <CardTitle className="mt-2 text-base group-hover:text-brand-600 dark:group-hover:text-brand-400">Understand the test</CardTitle>
                <p className="text-ink-500 dark:text-ink-400 mt-1.5 text-sm leading-relaxed">
                  Review the 3 sections, 2025 question updates, time limits, and scoring rubrics.
                </p>
              </Link>
            </div>
          </div>
        ) : stats ? (
          <>
            {focus.length > 0 ? (
              <section className="mt-10" aria-labelledby="focus-heading">
                <SectionHeading
                  id="focus-heading"
                  className="mb-2"
                  eyebrow="Focus"
                  title="Practise these next"
                  action={
                    <p className="text-ink-500 dark:text-ink-400 text-sm">
                      Weighted toward your last {Math.min(attempts.length, 5)} attempts
                    </p>
                  }
                />
                <p className="text-ink-500 dark:text-ink-300 mt-2 max-w-2xl text-sm leading-relaxed">
                  Ranked by what you are getting wrong rather than what you have practised least. Re-testing material you
                  already know carries much less value than re-testing the items you keep missing.
                </p>
                <ul className="mt-4 grid gap-3 sm:grid-cols-3">
                  {focus.map((f) => (
                    <li key={f.type}>
                      <Link
                          to={`/practice?type=${f.type}`}
                          className="card group flex h-full flex-col justify-between gap-3 transition-colors hover:border-brand-500/50"
                        >
                          <div>
                            <p className="text-ink-500 dark:text-ink-400 font-mono text-xs">
                              {f.untested ? 'Not yet attempted' : `${f.priority}% accuracy`}
                            </p>
                            <p className="text-ink-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 mt-1.5 text-base font-bold text-balance">
                              {f.label}
                            </p>
                            <p className="text-ink-500 dark:text-ink-400 mt-1.5 text-xs">
                              {f.untested
                                ? 'No evidence yet'
                                : `${f.itemsSeen} item${f.itemsSeen === 1 ? '' : 's'} across ${f.attemptsSeen} attempt${f.attemptsSeen === 1 ? '' : 's'}`}
                            </p>
                          </div>
                          <span className="text-brand-600 dark:text-brand-300 text-sm font-semibold">Drill this type →</span>
                        </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
              <Stat label="Latest score" value={stats.latest.overallScore} sub={`CEFR ${stats.latest.cefr}`} tone="brand" />
              <Stat label="Best score" value={stats.best} sub={`across ${attempts.length} attempts`} tone="mint" />
              <Stat
                label="Change"
                value={`${stats.delta >= 0 ? '+' : ''}${Math.round(stats.delta * 10) / 10}`}
                sub="since first attempt"
                tone={stats.delta >= 0 ? 'mint' : 'rose'}
              />
              <Stat label="Attempts" value={attempts.length} sub={formatDuration(stats.sorted.reduce((a, b) => a + b.durationMs, 0))} />
            </div>

            {stats.sorted.length > 1 ? (
              <Card className="mt-8">
                <CardTitle>Overall score over time</CardTitle>
                <ScoreTrend points={stats.sorted.map((a) => ({ label: a.finishedAt, value: a.overallScore }))} />
              </Card>
            ) : null}

            <Card className="mt-6">
              <CardTitle>Average by skill</CardTitle>
              <div className="mt-6 space-y-4">
                {SKILL_ORDER.filter((s) => stats.skillAvg[s] !== undefined).map((s) => {
                  const value = stats.skillAvg[s] as number
                  return (
                    <div key={s}>
                      <div className="mb-2 flex items-baseline justify-between gap-3 text-sm">
                        <span className="text-ink-700 dark:text-ink-200 font-medium capitalize">{s}</span>
                        <span className="text-ink-900 dark:text-white font-bold tabular-nums">{Math.round(value * 10) / 10}</span>
                      </div>
                      <ProgressBar
                        value={value}
                        max={90}
                        tone={value >= 70 ? 'mint' : value >= 50 ? 'amber' : 'rose'}
                        label={s}
                      />
                    </div>
                  )
                })}
              </div>
            </Card>

            <Card className="mt-6">
              <CardTitle>Question types to work on</CardTitle>
              <p className="text-ink-500 dark:text-ink-400 mt-1 text-sm">Weakest first, across all attempts.</p>
              <ul className="mt-6 space-y-4">
                {stats.typeRows.slice(0, 8).map((row) => (
                  <li key={row.type}>
                    <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-ink-700 dark:text-ink-200 font-medium capitalize">
                          {QUESTION_META[row.type as QuestionType]?.label ?? row.type.replace(/-/g, ' ')}
                        </span>
                        <Link
                          to={`/practice?type=${row.type}`}
                          className="text-brand-600 hover:text-brand-700 dark:text-brand-300 dark:hover:text-brand-200 text-xs font-semibold hover:underline"
                        >
                          Drill →
                        </Link>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-ink-900 dark:text-white font-semibold tabular-nums">
                          {Math.round(row.ratio * 100)}%
                        </span>
                        <span className="text-ink-500 dark:text-ink-400 tabular-nums">({row.n} items)</span>
                      </div>
                    </div>
                    <ProgressBar
                      value={row.earned}
                      max={row.max}
                      tone={row.ratio >= 0.8 ? 'mint' : row.ratio >= 0.5 ? 'amber' : 'rose'}
                      label={row.type}
                    />
                  </li>
                ))}
              </ul>
              {focus[0] ? (
                <ButtonLink to={`/practice?type=${focus[0].type}`} variant="secondary" className="mt-6">
                  Drill weakest type ({QUESTION_META[focus[0].type as QuestionType]?.short ?? focus[0].type.replace(/-/g, ' ')}) →
                </ButtonLink>
              ) : (
                <ButtonLink to="/practice" variant="secondary" className="mt-6">
                  Practice by question type →
                </ButtonLink>
              )}
            </Card>

            <Card className="mt-6">
              <CardTitle>Attempt history</CardTitle>
              <div className="scrollbar-thin -mx-5 mt-6 overflow-x-auto px-5 sm:-mx-6 sm:px-6">
                <table className="table-data min-w-lg">
                  <caption className="sr-only">Your PTE mock test attempts</caption>
                  <thead>
                    <tr className="border-ink-200 dark:border-white/10 border-b">
                      {['Date', 'Test', 'Score', 'CEFR', 'Duration', ''].map((h, i) => (
                        <th key={i} scope="col">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...attempts].reverse().map((a) => (
                      <tr key={a.id} className="border-ink-100 dark:border-white/6 border-b">
                        <td className="text-ink-500 dark:text-ink-400 px-3 py-3 whitespace-nowrap">
                          {formatDateTime(a.finishedAt)}
                        </td>
                        <td className="text-ink-700 dark:text-ink-200 max-w-[180px] truncate px-3 py-3">{a.mockTitle}</td>
                        <td className="text-ink-900 dark:text-white px-3 py-3 font-bold tabular-nums">{a.overallScore}</td>
                        <td>
                          <Badge tone={a.overallScore >= 71 ? 'mint' : a.overallScore >= 46 ? 'brand' : 'amber'}>
                            {a.cefr}
                          </Badge>
                        </td>
                        <td className="text-ink-500 dark:text-ink-400 px-3 py-3 whitespace-nowrap tabular-nums">
                          {formatDuration(a.durationMs)}
                        </td>
                        <td className="text-right whitespace-nowrap">
                          {deletingId === a.id ? (
                            <span className="inline-flex items-center gap-2 text-xs">
                              <span className="text-rose-600 dark:text-rose-400 font-semibold">Delete?</span>
                              <button
                                type="button"
                                className="text-rose-700 dark:text-rose-300 font-bold hover:underline cursor-pointer"
                                onClick={() => {
                                  void deleteAttemptEverywhere(a.id)
                                  void listAttempts(100).then(setAttempts)
                                  setDeletingId(null)
                                }}
                              >
                                Yes
                              </button>
                              <button
                                type="button"
                                className="text-ink-500 dark:text-ink-400 hover:underline cursor-pointer"
                                onClick={() => setDeletingId(null)}
                              >
                                Cancel
                              </button>
                            </span>
                          ) : (
                            <span className="inline-flex justify-end gap-1">
                              <button
                                type="button"
                                className="btn-ghost text-xs"
                                onClick={() => navigate(`/result?attempt=${a.id}`)}
                              >
                                View
                              </button>
                              <button
                                type="button"
                                className="btn-ghost text-rose-brand/80 dark:text-rose-300/80 text-xs"
                                onClick={() => setDeletingId(a.id)}
                              >
                                Delete
                              </button>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {confirmClearAll ? (
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-brand/30 bg-rose-brand/8 p-3.5 text-sm dark:bg-rose-brand/15">
                  <p className="text-rose-700 dark:text-rose-300 font-medium">
                    Delete all attempt history? This cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        void clearAttempts().then(() => {
                          setAttempts([])
                          setConfirmClearAll(false)
                        })
                      }}
                    >
                      Yes, clear all
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => setConfirmClearAll(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="danger" className="mt-6" onClick={() => setConfirmClearAll(true)}>
                  Clear all history
                </Button>
              )}
            </Card>
          </>
        ) : null}

        <Disclosure summary="Practice settings">
          <div className="grid gap-x-8 gap-y-1 sm:grid-cols-2">
            <div className="flex items-center justify-between gap-4 border-ink-100 dark:border-white/6 border-b py-3">
              <div>
                <p className="text-ink-800 dark:text-ink-100 text-sm font-medium">Theme</p>
                <p className="text-ink-500 dark:text-ink-400 text-xs">Currently {settings.theme}</p>
              </div>
              <div className="flex gap-1">
                {(['light', 'dark'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => set('theme', t)}
                    className={cn(
                      'rounded-md px-3 py-1.5 text-xs font-semibold capitalize',
                      settings.theme === t
                        ? 'bg-brand-500 text-white'
                        : 'bg-ink-100 text-ink-600 dark:bg-white/8 dark:text-ink-300',
                    )}
                    aria-pressed={settings.theme === t}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 border-ink-100 dark:border-white/6 border-b py-3">
              <div>
                <p className="text-ink-800 dark:text-ink-100 text-sm font-medium">Text size</p>
                <p className="text-ink-500 dark:text-ink-400 text-xs">{Math.round(settings.textScale * 100)}%</p>
              </div>
              <input
                type="range"
                min={0.85}
                max={1.35}
                step={0.05}
                value={settings.textScale}
                onChange={(e) => set('textScale', Number(e.target.value))}
                className="accent-brand-500 w-32"
                aria-label="Text size"
              />
            </div>

            <div className="border-ink-100 dark:border-white/6 border-b">
              <Toggle checked={settings.showWordCount} onChange={(v) => set('showWordCount', v)} label="Word counter" description="While typing answers" />
            </div>

            <div className="border-ink-100 dark:border-white/6 border-b">
              <Toggle checked={settings.countdownBeeps} onChange={(v) => set('countdownBeeps', v)} label="Countdown beeps" description="Before audio and recording" />
            </div>
          </div>
        </Disclosure>
      </PageWrapper>
    </>
  )
}

function ScoreTrend({ points }: { points: Array<{ label: string; value: number }> }) {
  const w = 640
  const h = 180
  const pad = 24
  const max = 90
  const min = 10
  const px = (i: number) => pad + ((w - pad * 2) / Math.max(1, points.length - 1)) * i
  const py = (v: number) => h - pad - ((v - min) / (max - min)) * (h - pad * 2)

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-6 w-full" role="img" aria-label={`Overall score across ${points.length} attempts`}>
      {[20, 40, 60, 80].map((v) => (
        <g key={v}>
          <line x1={pad} x2={w - pad} y1={py(v)} y2={py(v)} stroke="currentColor" strokeOpacity={0.1} />
          <text x={pad - 6} y={py(v) + 4} textAnchor="end" className="fill-current text-micro opacity-50 tabular-nums">
            {v}
          </text>
        </g>
      ))}
      {points.length > 1 ? (
        <polyline
          points={points.map((p, i) => `${px(i)},${py(p.value)}`).join(' ')}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="text-brand-500 dark:text-brand-300 animate-fade-in"
          strokeLinejoin="round"
        />
      ) : null}
      {points.map((p, i) => (
        <circle key={i} cx={px(i)} cy={py(p.value)} r={3.5} className="fill-brand-500 dark:fill-brand-300 cursor-pointer">
          <title>{`Attempt ${i + 1}: ${p.value} points (${formatDateTime(p.label)})`}</title>
        </circle>
      ))}
      {points.length > 0 && points[0] ? (
        <g className="fill-current font-mono text-micro opacity-50 tabular-nums">
          <text x={px(0)} y={h - 4} textAnchor="start">
            {formatDate(points[0].label)}
          </text>
          {points.length > 1 && points[points.length - 1] ? (
            <text x={px(points.length - 1)} y={h - 4} textAnchor="end">
              {formatDate(points[points.length - 1]!.label)}
            </text>
          ) : null}
        </g>
      ) : null}
    </svg>
  )
}
