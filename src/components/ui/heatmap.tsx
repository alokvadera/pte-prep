import { useMemo, useState } from 'react'
import { cn } from '../../lib/cn'

/* ---------------------------------------------------------------------------
   ActivityHeatmap.

   The GitHub-style practice grid: one cell per day
   over the last N weeks, mint intensity by how many
   attempts happened that day. It is the "consistency
   at a glance" widget — the visual that makes a
   streak legible before any number is read.
--------------------------------------------------------------------------- */

const CELL_GAP = 3
const CELL = 12

/** Day key in local time, so a practice run at 11pm counts on
    the day it was sat, not the UTC day it crossed into. */
function dayKey(iso: string): string {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function ActivityHeatmap({
  dates,
  weeks = 15,
  className,
}: {
  /** ISO timestamps of every attempt. */
  dates: string[]
  weeks?: number
  className?: string
}) {
  // The grid is anchored on the day the widget mounts. Reading the clock
  // inside render would let a re-render shift every column, so the date is
  // captured once in the state initializer instead.
  const [today] = useState(() => new Date())

  const { grid, max } = useMemo(() => {
    const counts = new Map<string, number>()
    for (const iso of dates) {
      const key = dayKey(iso)
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    // Build the grid backwards from today, column by column,
    // each column a week running Monday to Sunday.
    const mondayOffset = (today.getDay() + 6) % 7 // days since Monday
    const end = new Date(today)
    end.setDate(today.getDate() - mondayOffset + 6) // this week's Sunday
    const cells: Array<{ key: string; count: number; date: Date }> = []
    let maxCount = 0
    for (let w = weeks - 1; w >= 0; w--) {
      for (let d = 0; d < 7; d++) {
        const date = new Date(end)
        date.setDate(end.getDate() - (w * 7 + d))
        const key = dayKey(date.toISOString())
        const count = counts.get(key) ?? 0
        if (count > maxCount) maxCount = count
        cells.push({ key, count, date })
      }
    }
    return { grid: cells, max: Math.max(1, maxCount) }
  }, [dates, weeks, today])

  const level = (count: number) =>
    count === 0 ? 0 : count <= max / 3 ? 1 : count <= (2 * max) / 3 ? 2 : count < max ? 3 : 4

  const LEVEL_CLASS = [
    'bg-ink-100 dark:bg-white/8',
    'bg-mint-500/25',
    'bg-mint-500/50',
    'bg-mint-500/75',
    'bg-mint-500',
  ]

  const DAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', '']

  return (
    <div className={cn('flex gap-1.5', className)}>
      {/* Weekday axis */}
      <div className="flex flex-col justify-between" style={{ gap: CELL_GAP }}>
        {DAY_LABELS.map((d, i) => (
          <span key={i} className="text-ink-500 dark:text-ink-on-dark-muted h-3 text-[9px] font-semibold" style={{ height: CELL }}>
            {d}
          </span>
        ))}
      </div>
      <div className="flex" style={{ gap: CELL_GAP }}>
        {Array.from({ length: weeks }, (_, w) => (
          <div key={w} className="flex flex-col" style={{ gap: CELL_GAP }}>
            {Array.from({ length: 7 }, (_, d) => {
              const cell = grid[w * 7 + d]
              if (!cell) return null
              const future = cell.date.getTime() > Date.now()
              return (
                <span
                  key={cell.key}
                  title={`${cell.count} attempt${cell.count === 1 ? '' : 's'} on ${cell.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`}
                  className={cn(
                    'rounded-[3px]',
                    future ? 'bg-transparent' : LEVEL_CLASS[level(cell.count)],
                  )}
                  style={{ width: CELL, height: CELL }}
                />
              )
            })}
          </div>
        ))}
      </div>
      {/* Legend */}
      <div className="ml-2 flex items-center gap-1">
        <span className="text-ink-500 dark:text-ink-on-dark-muted text-[9px] font-semibold">Less</span>
        {LEVEL_CLASS.map((c, i) => (
          <span key={i} className={cn('rounded-[3px]', c)} style={{ width: 10, height: 10 }} aria-hidden="true" />
        ))}
        <span className="text-ink-500 dark:text-ink-on-dark-muted text-[9px] font-semibold">More</span>
      </div>
    </div>
  )
}
