/* Streak arithmetic, kept out of streak.tsx so that file exports nothing but
   a component and stays hot-reloadable. Pure: the only clock read is `today`,
   which the widget is expected to answer for on the day it is drawn — it is a
   parameter, so the caller decides which day the streak is counted against
   and a prerendered page never bakes its own day into the markup. */

function toDay(iso: string): number {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return NaN
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000)
}

export function computeStreaks(
  dates: string[],
  today: Date = new Date(),
): { current: number; longest: number } {
  if (dates.length === 0) return { current: 0, longest: 0 }
  const days = [...new Set(dates.map(toDay).filter((d) => !Number.isNaN(d)))].sort((a, b) => a - b)
  if (days.length === 0) return { current: 0, longest: 0 }

  let longest = 1
  let run = 1
  for (let i = 1; i < days.length; i++) {
    run = days[i]! - days[i - 1]! === 1 ? run + 1 : 1
    if (run > longest) longest = run
  }

  // Current: count back from today (or yesterday — a streak
  // survives the morning it is resumed).
  const todayDay = Math.floor(
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) / 86_400_000,
  )
  const last = days[days.length - 1]!
  if (todayDay - last > 1) return { current: 0, longest }
  let current = 1
  for (let i = days.length - 1; i > 0; i--) {
    if (days[i]! - days[i - 1]! === 1) current++
    else break
  }
  return { current, longest }
}
