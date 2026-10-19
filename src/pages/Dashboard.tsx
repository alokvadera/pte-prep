import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { listAttempts } from '../db/db'
import { clearAllAttemptsEverywhere, deleteAttemptEverywhere, syncCloudToLocal } from '../lib/sync'
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
  PageWrapper,
  ProgressBar,
  SectionHeading,
  Stat,
  Toggle,
} from '../components/ui/primitives'
import { Reveal } from '../components/ui/motion'
import { Breadcrumbs } from '../components/ui/Breadcrumbs'
import { Sparkline } from '../components/ui/sparkline'
import { RadialProgress } from '../components/ui/radial-progress'
import { ActivityHeatmap } from '../components/ui/heatmap'
import { StreakWidget } from '../components/ui/streak'
import { AchievementBadges } from '../components/ui/badges'
import { AlertDialog } from '../components/ui/alert-dialog'
import { Skeleton, CardSkeleton } from '../components/ui/skeleton'
import { Separator } from '../components/ui/separator'
import { Tooltip } from '../components/ui/tooltip'
import { useToast } from '../components/ui/use-toast'
import { SpotlightCard } from '../components/ui/spotlight-card'
import { PulseDot } from '../components/ui/pulse-dot'
import { ConfettiBurst } from '../components/ui/confetti'
import { useSettings } from '../store/useSettings'
import { weakestTypes } from '../domain/weakTypes'
import { validateGroqKey } from '../lib/aiScorer'

const SKILL_ORDER: Skill[] = ['reading', 'listening', 'speaking', 'writing']

function getAttemptKind(a: AttemptRecord): 'full' | 'section' | 'drill' {
  if (a.mockKind) return a.mockKind
  if (a.sectionIds.length >= 3 || a.availablePoints >= 60 || a.mockTitle.toLowerCase().includes('full')) return 'full'
  if (
    a.mockTitle.toLowerCase().includes('practice') &&
    (a.mockTitle.toLowerCase().includes('speaking') ||
      a.mockTitle.toLowerCase().includes('reading') ||
      a.mockTitle.toLowerCase().includes('listening'))
  ) {
    return 'section'
  }
  return 'drill'
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { settings, set, resetAiUsage } = useSettings()
  const user = useAuth((s) => s.user)
  const hasLoggedInBefore = useAuth((s) => s.hasLoggedInBefore)
  const toast = useToast()
  const [confirmClearAll, setConfirmClearAll] = useState(false)
  const [clearingAll, setClearingAll] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [attempts, setAttempts] = useState<AttemptRecord[] | null>(null)
  // A personal best earns one celebration: a confetti
  // burst the first time the report shows a best score,
  const [celebrated, setCelebrated] = useState(false)
  const [showGroqKey, setShowGroqKey] = useState(false)
  const [validatingGroq, setValidatingGroq] = useState(false)
  const [groqStatus, setGroqStatus] = useState<{ ok: boolean; message: string } | null>(null)

  const handleTestGroq = async () => {
    if (!settings.groqApiKey) return
    setValidatingGroq(true)
    setGroqStatus(null)
    const res = await validateGroqKey(settings.groqApiKey)
    setValidatingGroq(false)
    if (res.ok) {
      setGroqStatus({ ok: true, message: 'Valid Groq API key! Active models: Llama 3.3 70B & Whisper Turbo.' })
    } else {
      setGroqStatus({ ok: false, message: res.error ?? 'Failed to validate key' })
    }
  }

  useEffect(() => {
    let cancelled = false
    void (async () => {
      // Revalidate the session when landing here, so a revoked token from a
      // long-lived tab cannot keep syncing against a closed account.
      await useAuth.getState().checkSession()
      const initial = await listAttempts(100)
      if (!cancelled) setAttempts(initial)
      const { pushed, pulled } = await syncCloudToLocal()
      if (!cancelled && (pushed > 0 || pulled > 0)) {
        setAttempts(await listAttempts(100))
        toast.push(`Synced ${pushed + pulled} change${pushed + pulled === 1 ? '' : 's'} with the cloud`)
      }
    })()
    return () => {
      cancelled = true
    }
    // `toast` is a stable identity from the provider, so this still runs
    // once on mount — but now it is honest about what it reads.
  }, [toast])

  // Only types with evidence behind them, so the panel recommends rather than surveys.
  const focus = useMemo(() => weakestTypes(attempts ?? [], 3, true), [attempts])

  const stats = useMemo(() => {
    if (!attempts || attempts.length === 0) return null
    const sorted = [...attempts].sort((a, b) => a.finishedAt.localeCompare(b.finishedAt))
    const fullAttempts = sorted.filter((a) => getAttemptKind(a) === 'full')
    const primary = fullAttempts.length > 0 ? fullAttempts : sorted
    const latest = primary[primary.length - 1]
    const first = primary[0]
    if (!latest || !first) return null

    // Averages and type accuracy run over the same primary set as the trend:
    // full mocks when they exist, otherwise everything. Mixing untimed drills
    // and single-section runs into exam averages would understate real pacing
    // and overstate practised types.
    const skillAvg: Partial<Record<Skill, number>> = {}
    for (const s of SKILL_ORDER) {
      const values = primary
        .map((a) => a.skillScores[s])
        .filter((v): v is number => typeof v === 'number')
      if (values.length > 0) skillAvg[s] = values.reduce((a, b) => a + b, 0) / values.length
    }

    const typeAgg: Record<string, { earned: number; max: number; n: number }> = {}
    for (const a of primary) {
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
      best: Math.max(...primary.map((a) => a.overallScore)),
      skillAvg,
      typeRows,
      sorted,
      trendAttempts: fullAttempts.length >= 2 ? fullAttempts : sorted,
      isFullMockTrend: fullAttempts.length >= 2,
      hasFullMocks: fullAttempts.length > 0,
    }
  }, [attempts])

  useEffect(() => {
    if (celebrated || !stats || !attempts || attempts.length < 2) return
    if (stats.latest.overallScore === stats.best) {
      const t = window.setTimeout(() => setCelebrated(true), 900)
      return () => window.clearTimeout(t)
    }
  }, [stats, attempts, celebrated])

  return (
    <>
      <Seo />
      <ConfettiBurst fire={celebrated} />

      <PageWrapper
        breadcrumbs={<Breadcrumbs trail={[{ name: 'Home', path: '/' }, { name: 'Progress' }]} />}
        eyebrow="Progress"
        title="See what is getting stronger."
        description="Your attempts and skill trends are private to you. Sign in with email to back them up securely to Cloudflare edge storage."
        actions={attempts && attempts.length > 0 ? <ButtonLink to="/mock" size="lg" magnetic>Take another mock</ButtonLink> : undefined}
      >
        <div className="mt-8">
          <div className="card-solid flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4.5 sm:p-5">
            <div className="flex items-center gap-3.5">
              <div
                className={cn(
                  'size-10 rounded-2xl grid place-items-center shrink-0 border transition-colors',
                  user
                    ? 'border-mint-500/30 bg-mint-500/10 text-mint-700 dark:text-mint-300'
                    : 'border-brand-500/30 bg-brand-500/10 text-brand-600 dark:text-brand-300',
                )}
              >
                {user ? (
                  <span className="font-bold text-xs uppercase">{user.email[0]}</span>
                ) : (
                  <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 00-9.78 2.096A4.001 4.001 0 003 15z"
                    />
                  </svg>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <PulseDot tone={user ? 'mint' : 'brand'} />
                  <span className="text-xs font-extrabold uppercase tracking-wider text-ink-700 dark:text-ink-200">
                    {user ? 'Cloud account active' : 'Saved locally on this device'}
                  </span>
                  <Badge tone={user ? 'mint' : 'neutral'}>
                    {user ? 'Cloudflare edge sync' : 'Local storage'}
                  </Badge>
                </div>
                <p className="text-xs text-ink-500 dark:text-ink-on-dark-muted mt-0.5">
                  {user
                    ? `Account: ${user.email} · Target: ${user.targetScore}`
                    : 'Sign in to automatically sync your mock sessions, results, and skill trends across devices.'}
                </p>
              </div>
            </div>
            <ButtonLink
              to={user ? '/login' : hasLoggedInBefore ? '/login' : '/register'}
              variant={user ? 'secondary' : 'primary'}
              size="sm"
              className="shrink-0 text-xs font-bold"
            >
              {user ? 'Manage account' : hasLoggedInBefore ? 'Sign in' : 'Create free account'}
            </ButtonLink>
          </div>
        </div>

        {attempts === null ? (
          <div className="mt-12" role="status" aria-label="Loading your attempts">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-28" />
              ))}
            </div>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              <CardSkeleton className="md:col-span-2" />
              <CardSkeleton />
            </div>
          </div>
        ) : attempts.length === 0 ? (
          <div className="mt-8 space-y-6">
            <div className="relative overflow-hidden rounded-3xl border border-mark-500/25 bg-gradient-to-br from-mark-500/[0.08] via-transparent to-brand-500/[0.05] p-8 sm:p-10 dark:border-white/10 dark:bg-white/[0.02]">
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-mark-500/30 bg-mark-500/10 px-3 py-1 text-xs font-bold text-mark-700 dark:text-mark-300 mb-4">
                  <span className="size-2 rounded-full bg-mark-500 animate-pulse" />
                  <span>Ready for diagnostic baseline</span>
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-ink-900 dark:text-white">
                  No attempts yet
                </h2>
                <p className="text-ink-600 dark:text-ink-on-dark-muted mt-2 text-sm sm:text-base leading-relaxed">
                  Complete your first timed simulation or single-skill drill. As soon as you finish, your Pearson 10–90 scaled report, CEFR benchmark, and communicative skill breakdowns will populate here.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <ButtonLink to="/mock" size="lg" magnetic className="shadow-md shadow-mark-500/20">
                    Launch full mock test →
                  </ButtonLink>
                  <ButtonLink to="/practice" variant="secondary" size="lg">
                    Start a quick 5-min drill
                  </ButtonLink>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Link to="/mock" className="card-solid group p-5 hover:border-mark-400 dark:hover:border-mark-400/50 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 font-mono text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                    Full simulation
                  </span>
                  <span className="text-xs font-mono text-ink-500 dark:text-ink-on-dark-muted">~2h 15m</span>
                </div>
                <h3 className="font-display text-base font-bold text-ink-900 group-hover:text-mark-600 dark:text-white dark:group-hover:text-mark-300 transition-colors">
                  Timed mock test
                </h3>
                <p className="text-ink-500 dark:text-ink-on-dark-muted mt-1.5 text-xs leading-relaxed">
                  Run through all 22 question types under official test timings with machine scoring.
                </p>
              </Link>
              <Link to="/practice" className="card-solid group p-5 hover:border-mark-400 dark:hover:border-mark-400/50 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="rounded-full bg-brand-500/15 px-2.5 py-0.5 font-mono text-[11px] font-bold text-brand-700 dark:text-brand-300">
                    Targeted drill
                  </span>
                  <span className="text-xs font-mono text-ink-500 dark:text-ink-on-dark-muted">Flexible</span>
                </div>
                <h3 className="font-display text-base font-bold text-ink-900 group-hover:text-mark-600 dark:text-white dark:group-hover:text-mark-300 transition-colors">
                  Practice by skill
                </h3>
                <p className="text-ink-500 dark:text-ink-on-dark-muted mt-1.5 text-xs leading-relaxed">
                  Select speaking, writing, reading, or listening and drill only the types you need.
                </p>
              </Link>
              <Link to="/format" className="card-solid group p-5 hover:border-mark-400 dark:hover:border-mark-400/50 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="rounded-full bg-purple-500/15 px-2.5 py-0.5 font-mono text-[11px] font-bold text-purple-700 dark:text-purple-300">
                    Reference
                  </span>
                  <span className="text-xs font-mono text-ink-500 dark:text-ink-on-dark-muted">Guide</span>
                </div>
                <h3 className="font-display text-base font-bold text-ink-900 group-hover:text-mark-600 dark:text-white dark:group-hover:text-mark-300 transition-colors">
                  Understand the test
                </h3>
                <p className="text-ink-500 dark:text-ink-on-dark-muted mt-1.5 text-xs leading-relaxed">
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
                    <p className="text-ink-500 dark:text-ink-on-dark-muted text-sm">
                      Weighted toward your last {Math.min(attempts.length, 5)} attempts
                    </p>
                  }
                />
                <p className="text-ink-500 dark:text-ink-on-dark mt-2 max-w-2xl text-sm leading-relaxed">
                  Ranked by what you are getting wrong rather than what you have practised least. Re-testing material you
                  already know carries much less value than re-testing the items you keep missing.
                </p>
                <ul className="mt-4 grid gap-3 sm:grid-cols-3">
                  {focus.map((f, i) => (
                    <Reveal key={f.type} variant="up" delay={Math.min(i, 2) * 40} duration={550}>
                      <li>
                      <Link
                          to={`/practice?type=${f.type}`}
                          className="card group flex h-full flex-col justify-between gap-3 transition-colors hover:border-brand-500/50"
                        >
                          <div>
                            <p className="text-ink-500 dark:text-ink-on-dark-muted text-xs">
                              {f.untested ? 'Not yet attempted' : `${f.priority}% accuracy`}
                            </p>
                            <p className="text-ink-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-300 mt-1.5 text-base font-bold text-balance">
                              {f.label}
                            </p>
                            <p className="text-ink-500 dark:text-ink-on-dark-muted mt-1.5 text-xs">
                              {f.untested
                                ? 'No evidence yet'
                                : `${f.itemsSeen} item${f.itemsSeen === 1 ? '' : 's'} across ${f.attemptsSeen} attempt${f.attemptsSeen === 1 ? '' : 's'}`}
                            </p>
                          </div>
                          <span className="text-brand-600 dark:text-brand-300 text-sm font-semibold">Drill this type</span>
                        </Link>
                      </li>
                    </Reveal>
                  ))}
                </ul>
              </section>
            ) : null}

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {/* Stat Cards - span full width in a sub-grid. The two
                  trend-bearing cards carry a sparkline, so the shape
                  of the climb is visible before any number is read. */}
              <div className="md:col-span-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <TrendStat
                  label="Latest score"
                  value={stats.latest.overallScore}
                  sub={stats.hasFullMocks ? `Full mock, CEFR ${stats.latest.cefr}` : `CEFR ${stats.latest.cefr}`}
                  tone="brand"
                  spark={stats.trendAttempts.map((a) => a.overallScore)}
                />
                <TrendStat
                  label="Best score"
                  value={stats.best}
                  sub={stats.hasFullMocks ? 'best full mock' : `across ${attempts.length} attempts`}
                  tone="mint"
                  spark={stats.trendAttempts.map((a) => a.overallScore)}
                />
                <Stat
                  label="Change"
                  value={`${stats.delta >= 0 ? '+' : ''}${Math.round(stats.delta * 10) / 10}`}
                  sub={stats.hasFullMocks ? 'since first full mock' : 'since first attempt'}
                  tone={stats.delta >= 0 ? 'mint' : 'rose'}
                />
                <Stat label="Attempts" value={attempts.length} sub={formatDuration(stats.sorted.reduce((a, b) => a + b.durationMs, 0))} />
              </div>

              {/* Main Bento Area */}
              {stats.trendAttempts.length > 1 ? (
                <Card className="md:col-span-2 flex flex-col min-h-[320px]">
                  <div className="flex items-center justify-between border-b border-ink-100 dark:border-white/10 pb-3 mb-2">
                    <CardTitle>Overall score trajectory{stats.isFullMockTrend ? ' (Full mocks)' : ''}</CardTitle>
                    <div className="flex items-center gap-4">
                      <Tooltip label={`Latest score ${stats.latest.overallScore} on the 10–90 scale`}>
                        <RadialProgress
                          value={stats.latest.overallScore}
                          size={72}
                          stroke={7}
                          tone={stats.latest.overallScore >= 71 ? 'mint' : stats.latest.overallScore >= 46 ? 'brand' : 'amber'}
                        />
                      </Tooltip>
                      <span className="text-xs font-semibold text-ink-500 dark:text-ink-on-dark-muted">10-90 PTE scale</span>
                    </div>
                  </div>
                  <div className="flex-1 mt-2 relative">
                    <ScoreTrend points={stats.trendAttempts.map((a) => ({ label: a.finishedAt, value: a.overallScore }))} />
                  </div>
                </Card>
              ) : null}

              <Card className={stats.trendAttempts.length > 1 ? "md:col-span-1" : "md:col-span-3"}>
                <div className="flex items-center justify-between border-b border-ink-100 dark:border-white/10 pb-3 mb-4">
                  <CardTitle>Average by skill</CardTitle>
                  <span className="text-xs font-semibold text-ink-500 dark:text-ink-on-dark-muted">4 axes</span>
                </div>
                <div className="mt-4 space-y-4">
                  {SKILL_ORDER.filter((s) => stats.skillAvg[s] !== undefined).map((s) => {
                    const value = stats.skillAvg[s] as number
                    return (
                      <div key={s}>
                        <div className="mb-2 flex items-baseline justify-between gap-3 text-sm">
                          <span className="text-ink-900 dark:text-ink-50 font-semibold capitalize text-xs">{s}</span>
                          <span className="text-ink-900 dark:text-ink-50 font-bold tabular-nums font-mono text-xs">{Math.round(value * 10) / 10} / 90</span>
                        </div>
                        <ProgressBar
                          value={value}
                          max={90}
                          tone="brand"
                          label={s}
                        />
                      </div>
                    )
                  })}
                </div>
              </Card>
            </div>

            {/* Consistency: the streak and the practice heatmap,
                side by side — the two views of the same habit. */}
            <section className="mt-10" aria-labelledby="consistency-heading">
              <SectionHeading
                id="consistency-heading"
                className="mb-2"
                eyebrow="Consistency"
                title="Practice keeps the streak alive"
                description="One attempt on a day is enough to keep it going. The grid is every attempt, not just full mocks."
              />
              <div className="mt-4 grid gap-6 lg:grid-cols-5">
                <StreakWidget dates={attempts.map((a) => a.finishedAt)} className="lg:col-span-2" />
                <Card className="lg:col-span-3">
                  <div className="flex items-center justify-between border-b border-ink-100 dark:border-white/10 pb-3 mb-4">
                    <CardTitle>Last 15 weeks</CardTitle>
                    <span className="text-xs font-semibold text-ink-500 dark:text-ink-on-dark-muted">
                      {attempts.length} attempt{attempts.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <ActivityHeatmap dates={attempts.map((a) => a.finishedAt)} />
                </Card>
              </div>
            </section>

            {/* Achievements: the milestones worth being proud of. */}
            <section className="mt-10" aria-labelledby="achievements-heading">
              <SectionHeading
                id="achievements-heading"
                className="mb-2"
                eyebrow="Milestones"
                title="Achievements"
                description="Earned by sitting mocks and climbing scores — nothing else."
              />
              <AchievementBadges attempts={attempts} className="mt-4" />
            </section>

            <Separator className="mt-10" />

            <SpotlightCard className="card mt-6">
              <div className="flex items-center justify-between border-b border-ink-100 dark:border-white/10 pb-3 mb-3">
                <CardTitle>Question types to work on</CardTitle>
                <span className="text-xs font-semibold text-ink-500 dark:text-ink-on-dark-muted">Weakest first</span>
              </div>
              <p className="text-ink-500 dark:text-ink-on-dark-muted text-xs">Ranked by lowest scoring accuracy across all attempts.</p>
              <ul className="mt-6 space-y-4">
                {stats.typeRows.slice(0, 8).map((row, i) => (
                  <Reveal key={row.type} variant="up" delay={Math.min(i, 5) * 25} duration={500}>
                    <li>
                    <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-ink-700 dark:text-ink-200 font-medium capitalize">
                          {QUESTION_META[row.type as QuestionType]?.label ?? row.type.replace(/-/g, ' ')}
                        </span>
                        <Link
                          to={`/practice?type=${row.type}`}
                          className="text-brand-600 hover:text-brand-700 dark:text-brand-300 dark:hover:text-brand-200 text-xs font-semibold hover:underline"
                        >
                          Drill
                        </Link>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-ink-900 dark:text-white font-semibold tabular-nums font-mono">
                          {Math.round(row.ratio * 100)}%
                        </span>
                        <span className="text-ink-500 dark:text-ink-on-dark-muted tabular-nums font-mono text-xs">({row.n} items)</span>
                      </div>
                    </div>
                    <ProgressBar
                      value={row.earned}
                      max={row.max}
                      tone={row.ratio >= 0.8 ? 'mint' : row.ratio >= 0.5 ? 'amber' : 'rose'}
                      label={row.type}
                    />
                  </li>
                  </Reveal>
                ))}
              </ul>
              {focus[0] ? (
                <ButtonLink to={`/practice?type=${focus[0].type}`} variant="secondary" className="mt-6 text-xs">
                  Drill weakest type ({QUESTION_META[focus[0].type as QuestionType]?.short ?? focus[0].type.replace(/-/g, ' ')})
                </ButtonLink>
              ) : (
                <ButtonLink to="/practice" variant="secondary" className="mt-6 text-xs">
                  Practice by question type
                </ButtonLink>
              )}
            </SpotlightCard>

            <SpotlightCard className="card mt-6">
              <div className="flex items-center justify-between border-b border-ink-100 dark:border-white/10 pb-3 mb-4">
                <CardTitle>Attempt history</CardTitle>
                <span className="text-xs font-semibold text-ink-500 dark:text-ink-on-dark-muted">Your sessions</span>
              </div>
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
                        <td className="text-ink-500 dark:text-ink-on-dark-muted px-3 py-3 whitespace-nowrap">
                          {formatDateTime(a.finishedAt)}
                        </td>
                        <td className="text-ink-700 dark:text-ink-200 max-w-[220px] px-3 py-3">
                          <div className="flex items-center gap-2">
                            <span className="truncate">{a.mockTitle}</span>
                            {(() => {
                              const kind = getAttemptKind(a)
                              return (
                                <span
                                  className={cn(
                                    'shrink-0 rounded px-1.5 py-0.5 text-xs font-semibold',
                                    kind === 'full'
                                      ? 'bg-brand-500/10 text-brand-700 dark:text-brand-300'
                                      : kind === 'section'
                                        ? 'bg-ink-200/70 text-ink-700 dark:bg-white/15 dark:text-ink-on-dark'
                                        : 'bg-ink-100 text-ink-600 dark:bg-white/10 dark:text-ink-on-dark',
                                  )}
                                >
                                  {kind === 'full' ? 'Full' : kind === 'section' ? 'Section' : 'Drill'}
                                </span>
                              )
                            })()}
                          </div>
                        </td>
                        <td className="text-ink-900 dark:text-white px-3 py-3 font-bold tabular-nums">{a.overallScore}</td>
                        <td>
                          <Badge tone={a.overallScore >= 71 ? 'mint' : a.overallScore >= 46 ? 'brand' : 'amber'}>
                            {a.cefr}
                          </Badge>
                        </td>
                        <td className="text-ink-500 dark:text-ink-on-dark-muted px-3 py-3 whitespace-nowrap tabular-nums">
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
                                  setDeletingId(null)
                                  void (async () => {
                                    try {
                                      const synced = await deleteAttemptEverywhere(a.id)
                                      setAttempts(await listAttempts(100))
                                      toast.push(synced ? 'Attempt deleted' : 'Deleted locally; cloud retry pending')
                                    } catch {
                                      toast.push('Could not delete attempt', 'rose')
                                    }
                                  })()
                                }}
                              >
                                Yes
                              </button>
                              <button
                                type="button"
                                className="text-ink-500 dark:text-ink-on-dark-muted hover:underline cursor-pointer"
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
                <AlertDialog
                  open={confirmClearAll}
                  onClose={() => setConfirmClearAll(false)}
                  onConfirm={() => {
                    setClearingAll(true)
                    void (async () => {
                      try {
                        // Acting on the loaded page alone would leave older
                        // attempts behind to be re-synced, so the whole store is
                        // cleared through the tombstone-aware path.
                        await clearAllAttemptsEverywhere()
                        setAttempts([])
                        setConfirmClearAll(false)
                        toast.push('All attempt history cleared', 'rose')
                      } finally {
                        setClearingAll(false)
                      }
                    })()
                  }}
                  title="Clear all attempt history?"
                  confirmLabel={clearingAll ? 'Clearing…' : 'Yes, clear all'}
                  description="This deletes every attempt on this device and in cloud sync. Scores, trends, streaks and achievements all reset. This cannot be undone."
                />
              ) : (
                <Button variant="danger" className="mt-6" onClick={() => setConfirmClearAll(true)}>
                  Clear all history
                </Button>
              )}
            </SpotlightCard>
          </>
        ) : null}

        <section className="mt-12" aria-labelledby="settings-heading">
          <SpotlightCard className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-ink-100 dark:border-white/8">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-300 grid place-items-center">
                    <svg className="size-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h2 id="settings-heading" className="font-display text-lg font-bold text-ink-900 dark:text-white">
                    Practice & Simulator Settings
                  </h2>
                </div>
                <p className="text-xs text-ink-500 dark:text-ink-on-dark-muted mt-1 leading-relaxed">
                  Configure your exam timing cues, live word counters, display scale, and Bring Your Own Key (BYOK) AI scoring.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-8 lg:grid-cols-2">
              {/* Left Column: Simulator & Interface */}
              <div className="space-y-4">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-ink-500 dark:text-ink-on-dark-muted">
                  Exam Experience & Display
                </h3>

                <div className="rounded-2xl border border-ink-100 bg-ink-50/50 p-4 dark:border-white/6 dark:bg-white/[0.02] space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-ink-800 dark:text-ink-100">Theme mode</p>
                      <p className="text-xs text-ink-500 dark:text-ink-on-dark-muted mt-0.5">Visual contrast ground</p>
                    </div>
                    <div className="flex gap-1.5 bg-ink-100/80 p-1 rounded-lg dark:bg-white/8">
                      {(['light', 'dark'] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => set('theme', t)}
                          className={cn(
                            'rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition-all',
                            settings.theme === t
                              ? 'bg-brand-500 text-white shadow-sm'
                              : 'text-ink-600 hover:text-ink-900 dark:text-ink-on-dark dark:hover:text-white',
                          )}
                          aria-pressed={settings.theme === t}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-ink-100 dark:border-white/6 pt-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-ink-800 dark:text-ink-100">Interface scale</p>
                      <p className="text-xs text-ink-500 dark:text-ink-on-dark-muted mt-0.5">
                        Text sizing: <span className="font-semibold text-ink-700 dark:text-ink-200 tabular-nums">{Math.round(settings.textScale * 100)}%</span>
                      </p>
                    </div>
                    <input
                      type="range"
                      min={0.85}
                      max={1.35}
                      step={0.05}
                      value={settings.textScale}
                      onChange={(e) => set('textScale', Number(e.target.value))}
                      className="accent-brand-500 w-32 cursor-pointer"
                      aria-label="Text size"
                    />
                  </div>

                  <div className="border-t border-ink-100 dark:border-white/6 pt-3">
                    <Toggle
                      checked={settings.showWordCount}
                      onChange={(v) => set('showWordCount', v)}
                      label="Live word counter"
                      description="Displays current word count while writing essays and summaries"
                    />
                  </div>

                  <div className="border-t border-ink-100 dark:border-white/6 pt-3">
                    <Toggle
                      checked={settings.countdownBeeps}
                      onChange={(v) => set('countdownBeeps', v)}
                      label="Countdown audio cues"
                      description="Plays short audio chimes before recording and playback begins"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: AI Examiner (BYOK) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-ink-500 dark:text-ink-on-dark-muted">
                    AI Examiner (Groq BYOK)
                  </h3>
                  <Badge tone={settings.aiScoringEnabled ? (settings.groqApiKey ? 'mint' : 'amber') : 'neutral'}>
                    {settings.aiScoringEnabled ? (settings.groqApiKey ? 'Active' : 'Key Needed') : 'Disabled'}
                  </Badge>
                </div>

                <div className="rounded-2xl border border-ink-100 bg-ink-50/50 p-4 dark:border-white/6 dark:bg-white/[0.02] space-y-4">
                  <Toggle
                    checked={settings.aiScoringEnabled}
                    onChange={(v) => {
                      set('aiScoringEnabled', v)
                      if (v && !settings.groqApiKey) {
                        setGroqStatus(null)
                      }
                    }}
                    label="Deterministic AI Scoring"
                    description="Pearson PTE Academic rubric evaluation with temperature 0.0"
                  />

                  {settings.aiScoringEnabled ? (
                    <div className="pt-3 border-t border-ink-100 dark:border-white/6 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <label htmlFor="groq-api-key" className="text-xs font-semibold text-ink-800 dark:text-ink-100">
                          Groq API Key
                        </label>
                        <a
                          href="https://console.groq.com/keys"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-brand-600 dark:text-brand-400 hover:underline inline-flex items-center gap-1 font-medium"
                        >
                          <span>Get free key</span>
                          <span aria-hidden="true">↗</span>
                        </a>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                          <input
                            id="groq-api-key"
                            type={showGroqKey ? 'text' : 'password'}
                            value={settings.groqApiKey}
                            onChange={(e) => {
                              set('groqApiKey', e.target.value.trim())
                              setGroqStatus(null)
                            }}
                            placeholder="gsk_..."
                            className="w-full rounded-xl border border-ink-200 dark:border-white/10 bg-white dark:bg-ink-900 px-3.5 py-2.5 pr-14 text-xs font-mono text-ink-900 dark:text-ink-100 placeholder:text-ink-500 dark:placeholder:text-ink-on-dark-muted focus:outline-none focus:ring-2 focus:ring-brand-500"
                            autoComplete="off"
                            spellCheck="false"
                          />
                          <button
                            type="button"
                            onClick={() => setShowGroqKey(!showGroqKey)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2 py-1 text-xs text-ink-500 hover:text-ink-800 dark:text-ink-on-dark-muted dark:hover:text-ink-100 font-medium"
                          >
                            {showGroqKey ? 'Hide' : 'Show'}
                          </button>
                        </div>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          disabled={!settings.groqApiKey || validatingGroq}
                          onClick={handleTestGroq}
                          className="text-xs shrink-0 font-bold"
                        >
                          {validatingGroq ? 'Verifying...' : 'Test Connection'}
                        </Button>
                      </div>

                      {groqStatus ? (
                        <p className={cn('text-xs font-medium', groqStatus.ok ? 'text-mint-700 dark:text-mint-400' : 'text-rose-600 dark:text-rose-400')}>
                          {groqStatus.ok ? '✓ ' : '✕ '}
                          {groqStatus.message}
                        </p>
                      ) : (
                        <p className="text-xs text-ink-500 dark:text-ink-on-dark-muted leading-relaxed">
                          Keys are stored strictly in your browser's localStorage and call Groq directly. Zero server telemetry or middleman.
                        </p>
                      )}

                      {/* STT Engine Strategy */}
                      <div className="pt-3 border-t border-ink-100 dark:border-white/6 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-ink-700 dark:text-ink-200">
                            Speech-to-Text Engine
                          </span>
                          <Badge tone={settings.groqApiKey ? 'mint' : 'neutral'}>
                            {settings.groqApiKey ? 'Whisper Turbo (Primary)' : 'Web Speech API (Free)'}
                          </Badge>
                        </div>
                        <p className="text-xs text-ink-500 dark:text-ink-on-dark-muted leading-relaxed">
                          {settings.groqApiKey
                            ? 'Groq Whisper Turbo is active as your primary speech recognizer with browser Web Speech as fallback.'
                            : 'Browser Web Speech API is active (100% free on-device). Enter a Groq key above to enable high-accuracy Whisper Turbo.'}
                        </p>
                      </div>

                      {/* LLM & STT Usage Tracker */}
                      <div className="pt-3 border-t border-ink-100 dark:border-white/6 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-ink-700 dark:text-ink-200">
                            AI Usage Tracker
                          </span>
                          {(settings.aiUsage?.totalRequests > 0 || settings.aiUsage?.whisperRequests > 0) ? (
                            <button
                              type="button"
                              onClick={() => resetAiUsage()}
                              className="text-[11px] text-ink-500 hover:text-rose-500 dark:text-ink-on-dark-muted dark:hover:text-rose-400 font-medium transition-colors"
                            >
                              Reset counters
                            </button>
                          ) : null}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                          <div className="rounded-xl border border-ink-100 dark:border-white/6 bg-white dark:bg-ink-900/60 p-2.5">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-500 dark:text-ink-on-dark-muted">
                              Remaining Today
                            </p>
                            <p className="text-base font-extrabold text-mint-700 dark:text-mint-400 mt-0.5">
                              {settings.aiUsage?.serverRemainingRequests !== undefined
                                ? `${settings.aiUsage.serverRemainingRequests}`
                                : `~${Math.max(0, 1000 - (settings.aiUsage?.requestsToday ?? 0))}`}
                              <span className="text-xs font-normal text-ink-500 dark:text-ink-on-dark-muted">/{settings.aiUsage?.serverLimitRequests ?? 1000}</span>
                            </p>
                          </div>

                          <div className="rounded-xl border border-ink-100 dark:border-white/6 bg-white dark:bg-ink-900/60 p-2.5">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-500 dark:text-ink-on-dark-muted">
                              Tokens Used
                            </p>
                            <p className="text-base font-extrabold text-ink-900 dark:text-white mt-0.5">
                              {(settings.aiUsage?.totalTokens ?? 0).toLocaleString()}
                            </p>
                          </div>

                          <div className="rounded-xl border border-ink-100 dark:border-white/6 bg-white dark:bg-ink-900/60 p-2.5">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-500 dark:text-ink-on-dark-muted">
                              Whisper Audio
                            </p>
                            <p className="text-base font-extrabold text-ink-900 dark:text-white mt-0.5">
                              {Math.round(settings.aiUsage?.whisperSeconds ?? 0)}s
                            </p>
                          </div>

                          <div className="rounded-xl border border-ink-100 dark:border-white/6 bg-white dark:bg-ink-900/60 p-2.5">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-500 dark:text-ink-on-dark-muted">
                              Total Calls
                            </p>
                            <p className="text-base font-extrabold text-ink-900 dark:text-white mt-0.5">
                              {settings.aiUsage?.totalRequests ?? 0}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-ink-500 dark:text-ink-on-dark-muted">
                          <span>
                            {settings.aiUsage?.serverResetRequests
                              ? `Daily quota resets in ${settings.aiUsage.serverResetRequests}`
                              : 'Groq free tier: 1,000 requests/day, 8,000 tokens/min'}
                          </span>
                          <a
                            href="https://console.groq.com/usage"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand-600 dark:text-brand-400 hover:underline font-medium inline-flex items-center gap-0.5"
                          >
                            <span>Live Groq Console</span>
                            <span aria-hidden="true">↗</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-ink-500 dark:text-ink-on-dark-muted pt-2 border-t border-ink-100 dark:border-white/6 leading-relaxed">
                      Enable to score constructed answers (essays, summaries, speaking) against official Pearson rubrics using Groq's high-speed inference.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </SpotlightCard>
        </section>
      </PageWrapper>
    </>
  )
}

/** A stat card with the trend shape in its top-right corner —
    the sparkline is the climb the number summarises. */
function TrendStat({
  spark,
  tone = 'neutral',
  ...rest
}: {
  spark: number[]
} & {
  label: string
  value: React.ReactNode
  sub?: string
  tone?: 'neutral' | 'brand' | 'mint' | 'amber' | 'rose'
}) {
  const sparkTone = tone === 'neutral' ? 'brand' : tone
  return (
    <div className="relative">
      <Stat {...rest} tone={tone} />
      <div className="absolute top-4 right-4" aria-hidden="true">
        <Sparkline points={spark} width={64} height={24} tone={sparkTone} />
      </div>
    </div>
  )
}

function ScoreTrend({ points }: { points: Array<{ label: string; value: number }> }) {
  const w = 640
  const h = 200
  const padX = 36
  const padY = 28
  const max = 90
  const min = 10
  const px = (i: number) => padX + ((w - padX * 2) / Math.max(1, points.length - 1)) * i
  const py = (v: number) => h - padY - ((v - min) / (max - min)) * (h - padY * 2)

  return (
    /* The one chart on the site worth watching arrive: the line draws itself,
       then each attempt's marker lands in reading order. The Reveal wrapper
       carries the arming, so no-JavaScript and reduced-motion visitors get the
       finished chart. */
    <Reveal variant="fade" duration={450}>
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-4 w-full" role="img" aria-label={`Overall score across ${points.length} attempts`}>
      {/* Reference gridlines */}
      {[20, 40, 60, 80].map((v) => (
        <g key={v}>
          <line x1={padX} x2={w - padX} y1={py(v)} y2={py(v)} stroke="currentColor" strokeOpacity={0.08} strokeDasharray="3 3" />
          <text x={padX - 8} y={py(v) + 3} textAnchor="end" className="fill-current font-mono text-xs opacity-40 tabular-nums">
            {v}
          </text>
        </g>
      ))}

      {/* Target 79+ guideline (Superior English) */}
      <g>
        <line x1={padX} x2={w - padX} y1={py(79)} y2={py(79)} stroke="currentColor" strokeOpacity={0.25} strokeDasharray="4 2" strokeWidth={1} className="text-brand-500 dark:text-brand-300" />
        <text x={w - padX} y={py(79) - 4} textAnchor="end" className="fill-brand-600 dark:fill-brand-300 text-xs font-semibold">
          Target 79 (Superior)
        </text>
      </g>

      {/* Line and area */}
      {points.length > 1 ? (
        <>
          <polygon
            points={`${px(0)},${h - padY} ${points.map((p, i) => `${px(i)},${py(p.value)}`).join(' ')} ${px(points.length - 1)},${h - padY}`}
            fill="currentColor"
            fillOpacity={0.06}
            className="text-brand-500 dark:text-brand-300"
            data-draw-fade
          />
          <polyline
            points={points.map((p, i) => `${px(i)},${py(p.value)}`).join(' ')}
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            className="text-brand-500 dark:text-brand-300"
            strokeLinejoin="round"
            pathLength={1}
            data-draw
          />
        </>
      ) : null}

      {/* Reticle-style vertices, landing in reading order as the line reaches
          them. */}
      {points.map((p, i) => (
        <g key={i} className="cursor-pointer" data-draw-dot style={{ animationDelay: `${0.5 + i * 0.09}s` }}>
          <circle
            cx={px(i)}
            cy={py(p.value)}
            r={6}
            fill="none"
            stroke="currentColor"
            strokeWidth={1}
            strokeOpacity={0.4}
            className="text-brand-500 dark:text-brand-300"
          />
          <circle
            cx={px(i)}
            cy={py(p.value)}
            r={3}
            className="fill-brand-500 dark:fill-brand-300 stroke-white dark:stroke-ink-950 stroke-[1.5px]"
          />
          <text
            x={px(i)}
            y={py(p.value) - 10}
            textAnchor="middle"
            className="font-mono text-xs font-bold fill-ink-900 dark:fill-ink-50 tabular-nums opacity-90"
          >
            {p.value}
          </text>
          <title>{`Attempt ${i + 1}: ${p.value} points (${formatDateTime(p.label)})`}</title>
        </g>
      ))}

      {/* Date scale */}
      {points.length > 0 && points[0] ? (
        <g className="fill-current font-mono text-xs opacity-50 tabular-nums">
          <text x={px(0)} y={h - 6} textAnchor="start">
            {formatDate(points[0].label)}
          </text>
          {points.length > 1 && points[points.length - 1] ? (
            <text x={px(points.length - 1)} y={h - 6} textAnchor="end">
              {formatDate(points[points.length - 1]!.label)}
            </text>
          ) : null}
        </g>
      ) : null}
    </svg>
    </Reveal>
  )
}
