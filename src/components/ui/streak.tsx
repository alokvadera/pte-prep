import { useMemo } from 'react'
import { Flame } from 'lucide-react'
import { cn } from '../../lib/cn'
import { computeStreaks } from './compute-streaks'

/* ---------------------------------------------------------------------------
   StreakWidget.

   The practice streak: consecutive days with at least
   one attempt, current and longest, with the milestone
   markers (7 / 14 / 21 / 30) that make a streak feel
   like something to protect. The flame is mint when
   the streak is alive and ink when it is not — a
   broken streak is a fact, not a failure page.
--------------------------------------------------------------------------- */

const MILESTONES = [7, 14, 21, 30]

export function StreakWidget({ dates, className }: { dates: string[]; className?: string }) {
  const { current, longest } = useMemo(() => computeStreaks(dates), [dates])
  const alive = current > 0

  return (
    <div className={cn('card-solid flex items-center gap-5 p-5', className)}>
      <div
        className={cn(
          'grid size-14 shrink-0 place-items-center rounded-2xl',
          alive
            ? 'bg-mint-500/15 text-mint-600 ring-2 ring-mint-500/30 dark:text-mint-300'
            : 'bg-ink-100 text-ink-500 dark:bg-white/8 dark:text-ink-on-dark-muted',
        )}
      >
        <Flame className="size-7" strokeWidth={2.2} fill={alive ? 'currentColor' : 'none'} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-3xl font-extrabold text-ink-900 tabular-nums dark:text-white">
            {current}
          </span>
          <span className="text-ink-500 dark:text-ink-on-dark-muted text-sm font-semibold">
            day{current === 1 ? '' : 's'} in a row
          </span>
        </div>
        <p className="text-ink-500 dark:text-ink-on-dark-muted mt-0.5 text-xs">
          Longest: <span className="font-bold text-ink-800 dark:text-ink-100">{longest}</span> days
        </p>
        {/* Milestone rail */}
        <div role="group" className="mt-2.5 flex items-center gap-1.5" aria-label={`Milestones: ${MILESTONES.join(', ')} days`}>
          {MILESTONES.map((m) => {
            const hit = longest >= m
            return (
              <span
                key={m}
                title={`${m}-day milestone${hit ? ' — reached' : ''}`}
                className={cn(
                  'grid h-4 place-items-center rounded-full px-1.5 font-mono text-[9px] font-bold',
                  hit
                    ? 'bg-mint-500 text-white'
                    : current >= m * 0.5
                      ? 'bg-mint-500/25 text-mint-700 dark:text-mint-300'
                      : 'bg-ink-100 text-ink-500 dark:bg-white/8 dark:text-ink-on-dark-muted',
                )}
              >
                {m}
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}
