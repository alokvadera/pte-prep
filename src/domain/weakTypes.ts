import { ALL_QUESTION_TYPES, QUESTION_META } from './blueprint'
import type { QuestionType } from './types'
import type { AttemptRecord } from './types'

/**
 * Which question types to drill next.
 *
 * Two findings from the practice literature drive this. Retrieval practice beats
 * re-study, so the useful target is the type the candidate keeps getting wrong,
 * not the one they always do well. And the recency effect means an old failure
 * describes the past, not the present, so recent attempts are weighted more
 * heavily than the cumulative average.
 *
 * Deliberately not a spaced-repetition scheduler. A Leitner-style schedule needs
 * per-item stability measured over many reviews, which this product does not
 * record; pretending otherwise would produce confident intervals from nothing.
 * This ranks on evidence the product actually holds.
 */

export interface WeakType {
  type: QuestionType
  label: string
  /**
   * Accuracy as a percentage, or null when the type has never been attempted.
   * Lower is worse, so this doubles as the sort key for measured types.
   */
  priority: number | null
  /** Items attempted across the weighted window, before any filter. */
  itemsSeen: number
  attemptsSeen: number
  /** True when the type was attempted but produced no usable item at all. */
  untested: boolean
}

/**
 * How many attempts count. Five covers a normal run of practice while staying
 * recent enough to reflect current ability; older attempts are ignored rather
 * than averaged in, because an ability that changed three weeks ago has changed.
 */
const WINDOW = 5

/** Attempts are dated strings, so ordering them needs a parse rather than a compare. */
function timeOf(attempt: AttemptRecord): number {
  const t = Date.parse(attempt.finishedAt)
  return Number.isNaN(t) ? -Infinity : t
}

/**
 * Ranks the types most worth practising.
 *
 * `practised` restricts the result to types the candidate has already met, so
 * the dashboard can offer a next drill rather than a survey of the whole test.
 */
export function weakestTypes(attempts: AttemptRecord[], limit = 3, practised = false): WeakType[] {
  const relevant = [...attempts].sort((a, b) => timeOf(a) - timeOf(b)).slice(-WINDOW)
  if (relevant.length === 0) return []

  const acc = new Map<QuestionType, { earned: number; max: number; seen: number; in: number }>()
  for (const type of ALL_QUESTION_TYPES) acc.set(type, { earned: 0, max: 0, seen: 0, in: 0 })

  relevant.forEach((attempt, index) => {
    // The most recent attempt counts full weight, the oldest of the window a
    // quarter. Linear decay is enough; anything sharper over-weights a single
    // sitting, which is exactly the noise this is meant to smooth.
    const weight = 1 - (0.75 * (relevant.length - 1 - index)) / Math.max(1, relevant.length - 1)
    const breakdown = attempt.breakdown
    if (!breakdown) return
    for (const stat of Object.values(breakdown)) {
      const row = acc.get(stat.type)
      if (!row) continue
      row.earned += stat.earnedPoints * weight
      row.max += stat.maxPoints * weight
      row.seen += stat.total
      row.in += 1
    }
  })

  const rows: WeakType[] = []
  for (const type of ALL_QUESTION_TYPES) {
    const row = acc.get(type)!
    if (practised && row.in === 0) continue
    const accuracy = row.max > 0 ? row.earned / row.max : null
    const untested = accuracy === null
    // Untested sorts *after* everything measured. An unknown type is not a known
    // weakness, and putting it first would fill every recommendation with types
    // the candidate has never met instead of the ones they are actually failing.
    rows.push({
      type,
      label: QUESTION_META[type].label,
      priority: untested ? null : Math.round((accuracy as number) * 1000) / 10,
      itemsSeen: row.seen,
      attemptsSeen: row.in,
      untested,
    })
  }

  return rows
    .sort((a, b) => {
      // Measured types first, weakest at the top of them; never-attempted after.
      if (a.untested !== b.untested) return a.untested ? 1 : -1
      /* v8 ignore next -- a measured type always has a priority */
      if (!a.untested && !b.untested && a.priority !== b.priority)
        return (a.priority ?? 0) - (b.priority ?? 0)
      // Stable, meaningful tie-break: fewer attempts seen is less certain, so it
      // comes first and is worth looking at.
      if (a.attemptsSeen !== b.attemptsSeen) return a.attemptsSeen - b.attemptsSeen
      return a.label.localeCompare(b.label)
    })
    .slice(0, limit)
}
