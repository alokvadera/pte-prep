import { useMemo, useState } from 'react'
import { cn } from '../../lib/cn'
import { useClientReady } from '../../lib/useClientReady'

/* ---------------------------------------------------------------------------
   ActivityHeatmap.

   The GitHub-style practice grid: one cell per day
   over the last N weeks, mint intensity by how many
   attempts happened that day. It is the "consistency
   at a glance" widget — the visual that makes a
   streak legible before any number is read.

   The grid is anchored on a day, and the day is a
   prop: read from the clock inside the render, a
   prerendered page bakes the build day into its
   markup and the browser then draws a different
   week. So the grid is drawn only after mount, the
   default anchor is the day the widget mounts, and
   the labels are written in one fixed locale so the
   server and the browser spell a day the same way.
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
  today: todayProp,
  locale = 'en-US',
  className,
}: {
  /** ISO timestamps of every attempt. */
  dates: string[]
  weeks?: number
  /**
   * The day the grid is anchored on. Given, it is used as-is; omitted, the
   * grid is anchored on the day the widget mounts.
   */
  today?: Date
  /**
   * The locale the cell labels are written in. Fixed by default, so the
   * server and the browser spell the same day the same way.
   */
  locale?: string
  className?: string
}) {
  // The grid is drawn only once the browser has taken over: a prerendered
  // page must not carry the build day in its markup.
  const mounted = useClientReady()
  if (!mounted) {
    // The grid's own footprint, so nothing shifts when it arrives. It is
    // only ever on screen during the server render: the client has taken
    // over by the time anything is painted.
    /* v8 ignore next -- only the server render reaches this branch */
    return (
      <div
        className={cn('bg-ink-100/60 h-[102px] w-full rounded-xl dark:bg-white/5', className)}
        aria-hidden="true"
      />
    )
  }
  return (
    <ActivityHeatmapGrid
      dates={dates}
      weeks={weeks}
      today={todayProp}
      locale={locale}
      className={className}
    />
  )
}

/** The grid itself, mounted only in the browser. */
function ActivityHeatmapGrid({
  dates,
  weeks,
  today: todayProp,
  locale,
  className,
}: {
  dates: string[]
  weeks: number
  today?: Date
  locale: string
  className?: string
}) {
  // The anchor is captured once, so a re-render never shifts a column.
  const [anchored] = useState(() => todayProp ?? new Date())
  const today = todayProp ?? anchored

  const { grid, max } = useMemo(() => {
    const counts = new Map<string, number>()
    for (const iso of dates) {
      const key = dayKey(iso)
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    // Build the grid column by column from earliest week to this week,
    // each column a week running Monday (top) to Sunday (bottom).
    const mondayOffset = (today.getDay() + 6) % 7 // days since Monday
    const startMonday = new Date(today)
    startMonday.setDate(today.getDate() - mondayOffset - (weeks - 1) * 7)
    const cells: Array<{ key: string; count: number; date: Date }> = []
    let maxCount = 0
    for (let w = 0; w < weeks; w++) {
      for (let d = 0; d < 7; d++) {
        const date = new Date(startMonday)
        date.setDate(startMonday.getDate() + (w * 7 + d))
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
          <span
            key={i}
            className="text-ink-500 dark:text-ink-on-dark-muted h-3 text-[9px] font-semibold"
            style={{ height: CELL }}
          >
            {d}
          </span>
        ))}
      </div>
      <div className="flex" style={{ gap: CELL_GAP }}>
        {Array.from({ length: weeks }, (_, w) => (
          <div key={w} className="flex flex-col" style={{ gap: CELL_GAP }}>
            {Array.from({ length: 7 }, (_, d) => {
              const cell = grid[w * 7 + d]
              /* v8 ignore next -- the grid holds exactly one cell per week and day */
              if (!cell) return null
              // A day is in the future when it falls after the anchor day —
              // no second clock read inside the render.
              const future = cell.date.getTime() > today.getTime()
              return (
                <span
                  key={cell.key}
                  title={`${cell.count} attempt${cell.count === 1 ? '' : 's'} on ${cell.date.toLocaleDateString(locale, { month: 'short', day: 'numeric' })}`}
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
        <span className="text-ink-500 dark:text-ink-on-dark-muted text-[9px] font-semibold">
          Less
        </span>
        {LEVEL_CLASS.map((c, i) => (
          <span
            key={i}
            className={cn('rounded-[3px]', c)}
            style={{ width: 10, height: 10 }}
            aria-hidden="true"
          />
        ))}
        <span className="text-ink-500 dark:text-ink-on-dark-muted text-[9px] font-semibold">
          More
        </span>
      </div>
    </div>
  )
}
