import { useMemo, type ReactNode } from 'react'
import { CalendarCheck, FlaskConical, Gauge, Lock, Target, TrendingUp, Trophy } from 'lucide-react'
import { cn } from '../../lib/cn'
import type { AttemptRecord } from '../../domain/types'

/* ---------------------------------------------------------------------------
   AchievementBadges.

   Small moments of celebration along the practice
   journey. Earned badges are full colour with their
   icon; locked ones are outlined with a lock, so the
   list also works as a "what's next" rail. Only
   achievements the user would genuinely be proud of
   are included — no participation trophies.
--------------------------------------------------------------------------- */

type Achievement = {
  id: string
  label: string
  description: string
  icon: ReactNode
  earned: (attempts: AttemptRecord[]) => boolean
}

const FULL_MOCKS = (attempts: AttemptRecord[]) =>
  attempts.filter((a) => (a.mockKind ?? 'full') === 'full').length

const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-mock',
    label: 'First mock',
    description: 'Complete one full mock test',
    icon: <FlaskConical className="size-5" />,
    earned: (a) => FULL_MOCKS(a) >= 1,
  },
  {
    id: 'five-mocks',
    label: 'Regular',
    description: 'Complete five full mocks',
    icon: <CalendarCheck className="size-5" />,
    earned: (a) => FULL_MOCKS(a) >= 5,
  },
  {
    id: 'score-65',
    label: 'On target',
    description: 'Reach a score of 65',
    icon: <Target className="size-5" />,
    earned: (a) => a.some((x) => x.overallScore >= 65),
  },
  {
    id: 'score-79',
    label: 'Superior',
    description: 'Reach a score of 79 (C1)',
    icon: <Trophy className="size-5" />,
    earned: (a) => a.some((x) => x.overallScore >= 79),
  },
  {
    id: 'climber',
    label: 'Climber',
    description: 'Improve your best score by 5+ points',
    icon: <TrendingUp className="size-5" />,
    earned: (a) => {
      if (a.length < 2) return false
      const sorted = [...a].sort(
        (x, y) => new Date(x.startedAt).getTime() - new Date(y.startedAt).getTime(),
      )
      const first = sorted[0]
      /* v8 ignore next -- the array has at least two entries, so the first exists */
      if (!first) return false
      let bestSoFar = first.overallScore
      for (let i = 1; i < sorted.length; i++) {
        const item = sorted[i]
        /* v8 ignore next -- the index is inside the array */
        if (!item) continue
        if (item.overallScore - bestSoFar >= 5) return true
        if (item.overallScore > bestSoFar) bestSoFar = item.overallScore
      }
      return false
    },
  },
  {
    id: 'all-rounder',
    label: 'All-rounder',
    description: 'Practise all 22 question types',
    icon: <Gauge className="size-5" />,
    earned: (a) => new Set(a.flatMap((x) => Object.keys(x.breakdown))).size >= 22,
  },
]

export function AchievementBadges({
  attempts,
  className,
}: {
  attempts: AttemptRecord[]
  className?: string
}) {
  const earnedCount = useMemo(
    () => ACHIEVEMENTS.filter((b) => b.earned(attempts)).length,
    [attempts],
  )

  return (
    <div className={className}>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {ACHIEVEMENTS.map((b) => {
          const earned = b.earned(attempts)
          return (
            <li
              key={b.id}
              title={earned ? b.description : `${b.description} — locked`}
              className={cn(
                'card flex flex-col items-center gap-2 p-4 text-center',
                earned ? 'card-interactive' : 'opacity-60',
              )}
            >
              <span
                className={cn(
                  'grid size-11 place-items-center rounded-2xl',
                  earned
                    ? 'bg-brand-500/15 text-brand-600 ring-2 ring-brand-500/30 dark:text-brand-300'
                    : 'bg-ink-100 text-ink-500 dark:bg-white/8 dark:text-ink-on-dark-muted',
                )}
              >
                {earned ? b.icon : <Lock className="size-5" />}
              </span>
              <div>
                <p
                  className={cn(
                    'text-sm font-bold',
                    earned
                      ? 'text-ink-900 dark:text-white'
                      : 'text-ink-500 dark:text-ink-on-dark-muted',
                  )}
                >
                  {b.label}
                </p>
                <p className="text-ink-500 dark:text-ink-on-dark-muted mt-0.5 text-[11px] leading-snug">
                  {b.description}
                </p>
              </div>
            </li>
          )
        })}
      </ul>
      <p className="text-ink-500 dark:text-ink-on-dark-muted mt-3 text-xs font-semibold">
        {earnedCount} of {ACHIEVEMENTS.length} earned
      </p>
    </div>
  )
}
