import { useEffect, useState } from 'react'
import { cn } from '../../lib/cn'
import { formatClock } from '../../lib/format'

// ---------------------------------------------------------------------------
// The section clock.
//
// `role="timer"` has an implicit `aria-live="off"` in WAI-ARIA, and an
// `aria-label` replaces the element's text in the accessibility tree. Putting
// both on a running clock therefore announces nothing, or announces a fixed
// string — which is worse than silence during a timed test.
//
// The WCAG 4.1.3 advisory techniques name `role="timer"` explicitly. So the
// running clock is excluded from the live region, and the two moments a
// candidate must act on are announced separately through `role="status"`.
// ---------------------------------------------------------------------------

const WARN_AT = [300, 60] as const

interface Props {
  secondsRemaining: number
  totalSeconds: number
  sectionTitle: string
  itemNumber: number
  itemCount: number
  answered: number
  flagged: number
  /** Called from the "Add time" control offered at each warning threshold. */
  onExtend?: (seconds: number) => void
  /** An untimed run shows a counter instead of a clock. */
  untimed?: boolean
  onExit?: () => void
}

export function TestHeader({
  secondsRemaining,
  totalSeconds,
  sectionTitle,
  itemNumber,
  itemCount,
  answered,
  flagged,
  onExtend,
  untimed = false,
  onExit,
}: Props) {
  const ratio = totalSeconds > 0 ? secondsRemaining / totalSeconds : 0
  const critical = secondsRemaining <= 60
  const warning = secondsRemaining <= 300 && !critical
  const [canExtend, setCanExtend] = useState(false)
  const [extended, setExtended] = useState(0)

  // The extension control appears at each threshold and stays for the rest of
  // the section, so the candidate is never asked to find it under pressure.
  const atThreshold = !untimed && WARN_AT.some((t) => secondsRemaining <= t)
  useEffect(() => {
    if (atThreshold) setCanExtend(true)
  }, [atThreshold])

  const remainingLabel = `${formatClock(secondsRemaining)} remaining in this section`

  return (
    <header className="border-ink-200 dark:border-white/10 bg-white/85 dark:bg-ink-900/85 sticky top-0 z-30 border-b backdrop-blur-md">
      <div className="page-shell-wide flex flex-wrap items-center gap-x-5 gap-y-2 py-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="bg-brand-500 grid size-8 shrink-0 place-items-center rounded-full font-display text-xs font-bold text-white" aria-hidden="true">
            PTE
          </span>
          <div className="min-w-0">
            <p className="text-ink-500 dark:text-ink-400 truncate text-xs font-semibold">
              {sectionTitle}
            </p>
            <p className="text-ink-900 dark:text-white text-sm font-bold tabular-nums">
              Question {itemNumber} of {itemCount}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2.5 sm:gap-3">
          {onExit ? (
            <button
              type="button"
              className="btn-ghost px-2.5 py-1 text-xs text-ink-500 hover:text-rose-600 dark:hover:text-rose-400"
              onClick={onExit}
              title="Exit test and save progress"
            >
              Exit
            </button>
          ) : null}
          <span className="text-ink-500 dark:text-ink-400 hidden text-xs tabular-nums sm:inline">
            {answered} answered
          </span>
          {flagged > 0 ? (
            <span className="text-amber-600 dark:text-amber-300 text-xs tabular-nums">{flagged} flagged</span>
          ) : null}
          {untimed ? (
            <span className="bg-ink-100 text-ink-700 dark:bg-white/8 dark:text-ink-200 rounded-lg px-3 py-1.5 text-sm font-semibold">
              Untimed
            </span>
          ) : null}

          {/* The clock itself. `aria-live="off"` keeps the changing number out
              of the live region; a plain label keeps it readable on demand. */}
          {untimed ? null : <div
            className={cn(
              'rounded-lg px-3 py-1.5 font-mono text-lg font-bold tabular-nums',
              critical && 'bg-rose-brand/15 text-rose-600 dark:text-rose-300',
              warning && 'bg-amber-500/15 text-amber-600 dark:text-amber-300',
              !critical && !warning && 'bg-brand-500/10 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300',
            )}
            role="timer"
            aria-live="off"
            aria-label={remainingLabel}
          >
            {formatClock(secondsRemaining)}
          </div>}
        </div>
      </div>

      {untimed ? null : (
        <div className="bg-ink-200 dark:bg-white/8 h-1 w-full" aria-hidden="true">
          <div
            className={cn(
              'h-full rounded-r-full transition-[width] duration-1000 ease-linear',
              critical ? 'bg-rose-brand' : warning ? 'bg-amber-500' : 'bg-brand-500',
            )}
            style={{ width: `${Math.max(0, Math.min(100, ratio * 100))}%` }}
          />
        </div>
      )}

      {/* SC 2.2.1: warn before time expires, give at least 20 seconds to
          extend with a single action, and allow repeated extensions. */}
      {atThreshold ? (
        <div className="border-t border-amber-500/30 bg-amber-500/10">
          <div className="page-shell-wide flex flex-wrap items-center gap-3 py-2">
            <p role="status" className="text-amber-700 dark:text-amber-200 text-sm font-semibold">
              {formatClock(secondsRemaining)} left in this section.
            </p>
            {onExtend ? (
              <button
                type="button"
                className="btn-secondary border-amber-500/50 px-3 py-1.5 text-xs"
                onClick={() => {
                  onExtend(300)
                  setExtended((n) => n + 1)
                }}
              >
                Add 5 minutes
                {extended > 0 ? <span className="text-ink-500 dark:text-ink-400"> ({extended} added)</span> : null}
              </button>
            ) : null}
            {canExtend ? null : <span className="sr-only">Time is about to expire.</span>}
          </div>
        </div>
      ) : null}
    </header>
  )
}
