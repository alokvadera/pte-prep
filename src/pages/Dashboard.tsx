import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { clearAttempts, deleteAttempt, listAttempts } from '../db/db'
import type { AttemptRecord, Skill } from '../domain/types'
import { formatDateTime, formatDuration } from '../lib/format'
import { cn } from '../lib/cn'
import { Seo } from '../seo/Seo'
import { Badge, Card, EmptyState, PageHeading, ProgressBar, Stat } from '../components/ui/primitives'
import { useSettings } from '../store/useSettings'

const SKILL_ORDER: Skill[] = ['reading', 'listening', 'speaking', 'writing']

export default function Dashboard() {
  const navigate = useNavigate()
  const { settings, set } = useSettings()
  const [attempts, setAttempts] = useState<AttemptRecord[] | null>(null)

  useEffect(() => {
    void (async () => {
      setAttempts(await listAttempts(100))
    })()
  }, [settings.textScale])

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

      <div className="page-shell-app">
        <PageHeading
          eyebrow="Progress"
          title="See what is getting stronger."
          description="Your attempts, skill trends and next steps stay on this device. Nothing is uploaded."
          actions={<Link to="/mock" className="btn-primary px-5 py-3">Take another mock</Link>}
        />

        {attempts === null ? (
          <div className="mt-10 grid place-items-center py-20">
            <span className="border-brand-500/25 border-t-brand-500 size-8 animate-spin rounded-full border-2" />
          </div>
        ) : attempts.length === 0 ? (
          <div className="mt-10">
            <EmptyState
              title="No attempts yet"
              description="Take a full mock test and your score history, skill trends and question-type breakdown will appear here."
              action={
                <Link to="/mock" className="btn-primary">
                  Start your first mock
                </Link>
              }
            />
          </div>
        ) : stats ? (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              <Card className="mt-6">
                <h2 className="text-ink-900 dark:text-white text-base font-bold text-balance">Overall score over time</h2>
                <ScoreTrend points={stats.sorted.map((a) => ({ label: a.finishedAt, value: a.overallScore }))} />
              </Card>
            ) : null}

            <Card className="mt-6">
              <h2 className="text-ink-900 dark:text-white text-base font-bold text-balance">Average by skill</h2>
              <div className="mt-4 space-y-3.5">
                {SKILL_ORDER.filter((s) => stats.skillAvg[s] !== undefined).map((s) => {
                  const value = stats.skillAvg[s] as number
                  return (
                    <div key={s}>
                      <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
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
              <h2 className="text-ink-900 dark:text-white text-base font-bold text-balance">Question types to work on</h2>
              <p className="text-ink-500 dark:text-ink-400 mt-1 text-sm">Weakest first, across all attempts.</p>
              <ul className="mt-4 space-y-3">
                {stats.typeRows.slice(0, 8).map((row) => (
                  <li key={row.type}>
                    <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2 text-sm">
                      <span className="text-ink-700 dark:text-ink-200 font-medium capitalize">
                        {row.type.replace(/-/g, ' ')}
                      </span>
                      <span className="text-ink-500 dark:text-ink-400 text-xs tabular-nums">{row.n} items</span>
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
              <Link to="/practice" className="btn-secondary mt-5">
                Practise the weakest type →
              </Link>
            </Card>

            <Card className="mt-6">
              <h2 className="text-ink-900 dark:text-white text-base font-bold text-balance">Attempt history</h2>
              <div className="scrollbar-thin -mx-5 mt-4 overflow-x-auto px-5">
                <table className="w-full min-w-lg border-collapse text-left text-sm">
                  <caption className="sr-only">Your PTE mock test attempts</caption>
                  <thead>
                    <tr className="border-ink-200 dark:border-white/10 border-b">
                      {['Date', 'Test', 'Score', 'CEFR', 'Duration', ''].map((h, i) => (
                        <th key={i} scope="col" className="text-ink-500 dark:text-ink-400 px-3 py-2 text-xs font-bold tracking-wider uppercase">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...attempts].reverse().map((a) => (
                      <tr key={a.id} className="border-ink-100 dark:border-white/6 border-b">
                        <td className="text-ink-500 dark:text-ink-400 px-3 py-2.5 whitespace-nowrap">
                          {formatDateTime(a.finishedAt)}
                        </td>
                        <td className="text-ink-700 dark:text-ink-200 max-w-[180px] truncate px-3 py-2.5">{a.mockTitle}</td>
                        <td className="text-ink-900 dark:text-white px-3 py-2.5 font-bold tabular-nums">{a.overallScore}</td>
                        <td className="px-3 py-2.5">
                          <Badge tone={a.overallScore >= 71 ? 'mint' : a.overallScore >= 46 ? 'brand' : 'amber'}>
                            {a.cefr}
                          </Badge>
                        </td>
                        <td className="text-ink-500 dark:text-ink-400 px-3 py-2.5 whitespace-nowrap tabular-nums">
                          {formatDuration(a.durationMs)}
                        </td>
                        <td className="px-3 py-2.5 text-right whitespace-nowrap">
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
                            className="btn-ghost text-rose-brand/80 text-xs"
                            onClick={() => {
                              void deleteAttempt(a.id)
                              void listAttempts(100).then(setAttempts)
                            }}
                          >
                            Delete
                          </button>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                type="button"
                className="btn-danger mt-5"
                onClick={() => {
                  if (window.confirm('Delete all attempt history? This cannot be undone.')) {
                    void clearAttempts().then(() => setAttempts([]))
                  }
                }}
              >
                Clear all history
              </button>
            </Card>
          </>
        ) : null}

        <details className="group mt-8">
          <summary className="card-solid flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-ink-900 dark:text-white [&::-webkit-details-marker]:hidden">
            <span>Practice settings</span>
            <span className="grid size-7 place-items-center rounded-md bg-ink-100 text-lg leading-none text-ink-500 transition-transform group-open:rotate-45 dark:bg-white/8 dark:text-ink-300" aria-hidden="true">+</span>
          </summary>
          <Card className="mt-3">
          <div className="mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-2">
            <div className="flex items-center justify-between gap-4 border-b border-ink-100 py-2.5 dark:border-white/6">
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
                      'rounded-lg px-2.5 py-1 text-xs font-semibold capitalize',
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

            <div className="flex items-center justify-between gap-4 border-b border-ink-100 py-2.5 dark:border-white/6">
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

            <div className="flex items-center justify-between gap-4 border-b border-ink-100 py-2.5 dark:border-white/6">
              <div>
                <p className="text-ink-800 dark:text-ink-100 text-sm font-medium">Word counter</p>
                <p className="text-ink-500 dark:text-ink-400 text-xs">While typing answers</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.showWordCount}
                aria-label="Word counter"
                onClick={() => set('showWordCount', !settings.showWordCount)}
                className={cn(
                  'relative h-6 w-11 shrink-0 cursor-pointer rounded-full border transition-colors',
                  settings.showWordCount ? 'border-brand-500 bg-brand-500' : 'border-ink-300 bg-ink-200 dark:border-white/15 dark:bg-white/10',
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 size-4.5 rounded-full bg-white shadow transition-transform',
                    settings.showWordCount ? 'translate-x-5.5' : 'translate-x-0.5',
                  )}
                />
              </button>
            </div>

            <div className="flex items-center justify-between gap-4 border-b border-ink-100 py-2.5 dark:border-white/6">
              <div>
                <p className="text-ink-800 dark:text-ink-100 text-sm font-medium">Countdown beeps</p>
                <p className="text-ink-500 dark:text-ink-400 text-xs">Before audio and recording</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.countdownBeeps}
                aria-label="Countdown beeps"
                onClick={() => set('countdownBeeps', !settings.countdownBeeps)}
                className={cn(
                  'relative h-6 w-11 shrink-0 cursor-pointer rounded-full border transition-colors',
                  settings.countdownBeeps ? 'border-brand-500 bg-brand-500' : 'border-ink-300 bg-ink-200 dark:border-white/15 dark:bg-white/10',
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 size-4.5 rounded-full bg-white shadow transition-transform',
                    settings.countdownBeeps ? 'translate-x-5.5' : 'translate-x-0.5',
                  )}
                />
              </button>
            </div>
          </div>
          </Card>
        </details>
      </div>
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
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-5 w-full" role="img" aria-label={`Overall score across ${points.length} attempts`}>
      {[20, 40, 60, 80].map((v) => (
        <g key={v}>
          <line x1={pad} x2={w - pad} y1={py(v)} y2={py(v)} stroke="currentColor" strokeOpacity={0.1} />
          <text x={pad - 6} y={py(v) + 4} textAnchor="end" className="fill-current text-[10px] opacity-50 tabular-nums">
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
          className="text-brand-500 dark:text-brand-300"
          strokeLinejoin="round"
        />
      ) : null}
      {points.map((p, i) => (
        <circle key={i} cx={px(i)} cy={py(p.value)} r={3.5} className="fill-brand-500" />
      ))}
    </svg>
  )
}
