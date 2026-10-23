import { describe, expect, it } from 'vitest'
import { formatSeconds, paceReport, paceWarnings } from '../../../src/domain/pace'
import type { Item, ItemResponse, QuestionType } from '../../../src/domain/types'

/* ---------------------------------------------------------------------------
   Pace analysis: how long a candidate spent on each type against the budget
   the real test allows.

   The report is only useful if it points at the worst offender first and
   ignores items the candidate never engaged with.
   --------------------------------------------------------------------------- */

function item(id: string, type: QuestionType, seconds: number): Item {
  return {
    id,
    type,
    section: 'speaking-writing',
    groupId: 'g',
    skills: ['speaking'],
    responseKind: 'choice',
    prompt: '',
    maxPoints: 1,
    seconds,
  }
}

function resp(secondsOnItem: number): ItemResponse {
  return { flagged: false, secondsOnItem }
}

const items = [
  item('i1', 'read-aloud', 40),
  item('i2', 'read-aloud', 40),
  item('i3', 'repeat-sentence', 20),
  item('i4', 'summarize-written-text', 600),
]

const responses: Record<string, ItemResponse> = {
  i1: resp(44),
  i2: resp(36),
  i3: resp(4),
  i4: resp(840),
}

const rows = paceReport(items, responses)

describe('pace report', () => {
  it('reports one row per timed type that was answered', () => {
    expect(rows).toHaveLength(3)
  })

  it('averages the time actually spent', () => {
    expect(rows.find((row) => row.type === 'read-aloud')?.averageSeconds).toBe(40)
  })

  it('flags a type that overran its budget', () => {
    expect(rows.some((row) => row.type === 'summarize-written-text' && row.verdict === 'over')).toBe(true)
  })

  it('marks a type finished very fast as under, not steady', () => {
    expect(rows.some((row) => row.type === 'repeat-sentence' && row.verdict === 'under')).toBe(true)
  })

  it('sorts the worst overrun first', () => {
    expect(rows[0]?.ratio ?? 0).toBeGreaterThanOrEqual(rows[rows.length - 1]?.ratio ?? 0)
  })

  it('excludes types with no real-test budget', () => {
    expect(rows.some((row) => row.budgetSeconds === 0)).toBe(false)
  })

  it('ignores an item that was never engaged with', () => {
    expect(paceReport(items, { i1: resp(40) }).find((row) => row.type === 'read-aloud')?.items).toBe(1)
  })

  it('returns nothing without timing data', () => {
    expect(paceReport(items, {})).toHaveLength(0)
  })

  it('surfaces the worst offender first in the warnings', () => {
    expect(paceWarnings(rows, 1)[0]?.type).toBe('summarize-written-text')
  })
})

describe('duration formatting', () => {
  it('formats short durations', () => {
    expect(formatSeconds(40)).toBe('40s')
  })

  it('formats whole minutes', () => {
    expect(formatSeconds(120)).toBe('2m')
  })

  it('formats mixed durations', () => {
    expect(formatSeconds(140)).toBe('2m 20s')
  })

  it('never prints 60 seconds', () => {
    expect(formatSeconds(119.6)).toBe('2m')
    expect(formatSeconds(59.6)).toBe('1m')
  })

  it('formats a minute and a half', () => {
    expect(formatSeconds(90)).toBe('1m 30s')
  })

  it('never prints a negative duration', () => {
    expect(formatSeconds(-30)).toBe('0s')
  })

  it('formats zero', () => {
    expect(formatSeconds(0)).toBe('0s')
  })
})

/* ---------------------------------------------------------------------------
   The edges of the report: an item with no budget of its own, and a type the
   blueprint does not know about.
   --------------------------------------------------------------------------- */

describe('items with no budget', () => {
  const untimed = [item('u1', 'read-aloud', 0), item('u2', 'write-essay', -5)]

  it('excludes an item with no time budget at all', () => {
    expect(paceReport(untimed, { u1: resp(30) })).toHaveLength(0)
  })

  it('excludes an item with a negative budget', () => {
    expect(paceReport(untimed, { u2: resp(30) })).toHaveLength(0)
  })

  it('still reports a timed type from the same list', () => {
    const mixed = [...untimed, item('u3', 'read-aloud', 40)]
    const report = paceReport(mixed, { u1: resp(30), u3: resp(40) })
    expect(report).toHaveLength(1)
    expect(report[0]?.items).toBe(1)
  })
})

describe('a type the blueprint does not know', () => {
  const unknown = 'not-a-real-type' as QuestionType
  const report = paceReport([item('x1', unknown, 30)], { x1: resp(60) })

  it('falls back to the type name for the label', () => {
    expect(report[0]?.label).toBe('not-a-real-type')
  })

  it('falls back to the type name for the short form', () => {
    expect(report[0]?.short).toBe('not-a-real-type')
  })

  it('still measures the pace against the budget', () => {
    expect(report[0]?.ratio).toBe(2)
    expect(report[0]?.verdict).toBe('over')
  })
})

describe('the warnings list', () => {
  it('offers three warnings by default', () => {
    const over = [
      { type: 'write-essay' as QuestionType, label: 'Write Essay', short: 'WE', averageSeconds: 100, budgetSeconds: 40, items: 1, ratio: 2.5, verdict: 'over' as const },
      { type: 'read-aloud' as QuestionType, label: 'Read Aloud', short: 'RA', averageSeconds: 100, budgetSeconds: 40, items: 1, ratio: 2.5, verdict: 'over' as const },
      { type: 'repeat-sentence' as QuestionType, label: 'Repeat Sentence', short: 'RS', averageSeconds: 100, budgetSeconds: 40, items: 1, ratio: 2.5, verdict: 'over' as const },
      { type: 'describe-image' as QuestionType, label: 'Describe Image', short: 'DI', averageSeconds: 100, budgetSeconds: 40, items: 1, ratio: 2.5, verdict: 'over' as const },
    ]
    expect(paceWarnings(over)).toHaveLength(3)
  })

  it('leaves out the types that were not over budget', () => {
    expect(paceWarnings(rows).map((row) => row.type)).toEqual(['summarize-written-text'])
  })
})
