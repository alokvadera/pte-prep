import type { Item, ItemResponse, QuestionType } from './types'
import { QUESTION_META } from './blueprint'

/**
 * Where the time went, per question type.
 *
 * Pacing is one of the most commonly reported causes of running out of time on
 * this test, and the failure is rarely uniform: candidates lose the section on
 * two or three types rather than across the board. A candidate who cannot see
 * that pattern has no way of knowing which items to speed up.
 *
 * Every timed item in this app already carries the budget the real test allows
 * (`Item.seconds`), and every response records how long the candidate actually
 * took. This compares the two, so the advice is about their own behaviour rather
 * than a generic reminder to manage time.
 *
 * Items with no budget are excluded rather than shown as zero, because a type
 * that is simply not individually timed — the reading multiple choice items, for
 * instance — would otherwise read as "infinite speed" and tell the reader
 * nothing true.
 */

export type PaceVerdict = 'under' | 'steady' | 'over'

export interface PaceRow {
  type: QuestionType
  label: string
  short: string
  /** Mean seconds the candidate actually spent on this type. */
  averageSeconds: number
  /** The real test's budget for one item of this type. */
  budgetSeconds: number
  /** Items of this type that were actually answered. */
  items: number
  /** averageSeconds / budgetSeconds. */
  ratio: number
  verdict: PaceVerdict
}

/**
 * Thresholds.
 *
 * Under budget is not automatically good: a repeat sentence answered in two
 * seconds was not understood, and the accuracy columns will say so. So "under"
 * only means time was not the constraint, and the report is careful not to
 * present speed as a virtue on its own.
 */
const OVER_AT = 1.35
const UNDER_AT = 0.7

function verdictFor(ratio: number): PaceVerdict {
  if (ratio > OVER_AT) return 'over'
  if (ratio < UNDER_AT) return 'under'
  return 'steady'
}

export function paceReport(items: Item[], responses: Record<string, ItemResponse>): PaceRow[] {
  const total = new Map<QuestionType, { seconds: number; count: number }>()

  for (const item of items) {
    if (!item.seconds || item.seconds <= 0) continue
    const response = responses[item.id]
    // A response with no recorded time means the candidate never engaged with
    // the item; counting it as zero seconds would understate their pace.
    const spent = response?.secondsOnItem
    if (typeof spent !== 'number' || spent <= 0) continue
    const row = total.get(item.type) ?? { seconds: 0, count: 0 }
    row.seconds += spent
    row.count += 1
    total.set(item.type, row)
  }

  const rows: PaceRow[] = []
  for (const [type, row] of total) {
    // Budgets vary slightly between items of the same type, so the mean of the
    // budgets actually encountered is fairer than any single figure.
    const budgets = items.filter((i) => i.type === type && i.seconds > 0).map((i) => i.seconds)
    const budgetSeconds = budgets.reduce((a, b) => a + b, 0) / Math.max(1, budgets.length)
    const averageSeconds = row.seconds / row.count
    const ratio = budgetSeconds > 0 ? averageSeconds / budgetSeconds : 1
    rows.push({
      type,
      label: QUESTION_META[type]?.label ?? type,
      short: QUESTION_META[type]?.short ?? type,
      averageSeconds: Math.round(averageSeconds),
      budgetSeconds: Math.round(budgetSeconds),
      items: row.count,
      ratio: Math.round(ratio * 100) / 100,
      verdict: verdictFor(ratio),
    })
  }

  return rows.sort((a, b) => b.ratio - a.ratio)
}

/** The types costing the most time relative to what the test allows. */
export function paceWarnings(rows: PaceRow[], limit = 3): PaceRow[] {
  return rows.filter((r) => r.verdict === 'over').slice(0, limit)
}

/** Compact duration for the report, e.g. "1m 20s". */
export function formatSeconds(seconds: number): string {
  const clamped = Math.max(0, seconds)
  let m = Math.floor(clamped / 60)
  let s = Math.round(clamped % 60)
  if (s === 60) {
    m += 1
    s = 0
  }
  if (m === 0) return `${s}s`
  return s === 0 ? `${m}m` : `${m}m ${s}s`
}