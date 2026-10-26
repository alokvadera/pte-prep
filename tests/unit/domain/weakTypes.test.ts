import { describe, expect, it } from 'vitest'
import { ALL_QUESTION_TYPES, QUESTION_META } from '../../../src/domain/blueprint'
import { weakestTypes } from '../../../src/domain/weakTypes'
import type { AttemptRecord, QuestionType, Skill, TypeStat } from '../../../src/domain/types'

/* ---------------------------------------------------------------------------
   Which question types to drill next.

   The ranking is built on evidence the product actually holds: the last five
   attempts, weighted so that the most recent sitting counts for more than the
   oldest one in the window. Everything asserted below is arithmetic the
   candidate can check — a type with two attempts at fifty per cent and a type
   with one attempt at fifty per cent are equally weak, but the second is the
   one with less evidence behind it, so it is offered first.
   --------------------------------------------------------------------------- */

function stat(type: QuestionType, earnedPoints: number, maxPoints: number, total = 1): TypeStat {
  return {
    type,
    label: QUESTION_META[type].label,
    skill: QUESTION_META[type].skills[0] as Skill,
    correct: 0,
    partial: 0,
    incorrect: 0,
    total,
    maxPoints,
    earnedPoints,
    seconds: 0,
  }
}

function attempt(finishedAt: string, breakdown: Record<string, TypeStat>): AttemptRecord {
  return {
    id: `attempt-${finishedAt}`,
    mockId: 'mock-1',
    mockTitle: 'Full Mock Test 1',
    mode: 'exam',
    startedAt: finishedAt,
    finishedAt,
    durationMs: 3_600_000,
    seed: 1,
    sectionIds: ['reading'],
    responses: {},
    availablePoints: 10,
    earnedPoints: 5,
    skillScores: {},
    overallIsEstimate: true,
    overallScore: 50,
    cefr: 'B1',
    completedItemIds: [],
    breakdown,
  }
}

/** An attempt on one date, one type, one score. */
function scored(
  finishedAt: string,
  type: QuestionType,
  earned: number,
  max: number,
): AttemptRecord {
  return attempt(finishedAt, { [type]: stat(type, earned, max) })
}

describe('no evidence', () => {
  it('returns nothing when there are no attempts', () => {
    expect(weakestTypes([])).toEqual([])
  })

  it('reports every type as untested when the attempt has no breakdown', () => {
    const blank = attempt(
      '2026-01-01T10:00:00.000Z',
      undefined as unknown as Record<string, TypeStat>,
    )
    const rows = weakestTypes([blank], 22)
    expect(rows).toHaveLength(ALL_QUESTION_TYPES.length)
    expect(rows.every((row) => row.untested && row.priority === null)).toBe(true)
  })
})

describe('ranking the measured types', () => {
  const one = [scored('2026-01-01T10:00:00.000Z', 'read-aloud', 3, 4)]

  it('scores a measured type as a percentage', () => {
    expect(weakestTypes(one)[0]?.priority).toBe(75)
  })

  it('names the type', () => {
    expect(weakestTypes(one)[0]?.type).toBe('read-aloud')
  })

  it('labels the type from the blueprint', () => {
    expect(weakestTypes(one)[0]?.label).toBe('Read Aloud')
  })

  it('counts the items seen in the type', () => {
    expect(weakestTypes(one)[0]?.itemsSeen).toBe(1)
  })

  it('counts the attempts seen in the type', () => {
    expect(weakestTypes(one)[0]?.attemptsSeen).toBe(1)
  })

  it('does not call a measured type untested', () => {
    expect(weakestTypes(one)[0]?.untested).toBe(false)
  })

  it('puts the never-attempted types after the measured one', () => {
    const rows = weakestTypes(one)
    expect(rows[0]?.untested).toBe(false)
    expect(rows.slice(1).every((row) => row.untested)).toBe(true)
  })

  it('gives a never-attempted type a null priority', () => {
    expect(weakestTypes(one)[1]?.priority).toBeNull()
  })

  it('orders the never-attempted types alphabetically', () => {
    const labels = weakestTypes(one, 22)
      .slice(1)
      .map((row) => row.label)
    expect(labels).toEqual([...labels].sort((a, b) => a.localeCompare(b)))
  })

  it('reports a type with no points available as untested', () => {
    const rows = weakestTypes(
      [attempt('2026-01-01T10:00:00.000Z', { 'read-aloud': stat('read-aloud', 0, 0) })],
      22,
    )
    const row = rows.find((entry) => entry.type === 'read-aloud')
    expect(row?.untested).toBe(true)
    expect(row?.priority).toBeNull()
    expect(row?.attemptsSeen).toBe(1)
  })
})

describe('recency weighting', () => {
  it('counts the most recent attempt for more than the one before it', () => {
    const rows = weakestTypes([
      scored('2026-01-01T10:00:00.000Z', 'read-aloud', 0, 10),
      scored('2026-01-08T10:00:00.000Z', 'read-aloud', 10, 10),
    ])
    // The older attempt counts a quarter, so 10 of 12.5 weighted points.
    expect(rows[0]?.priority).toBe(80)
  })

  it('ignores attempts older than the window of five', () => {
    const attempts = [
      scored('2026-01-01T10:00:00.000Z', 'read-aloud', 0, 10),
      scored('2026-01-02T10:00:00.000Z', 'read-aloud', 0, 10),
      scored('2026-01-03T10:00:00.000Z', 'read-aloud', 10, 10),
      scored('2026-01-04T10:00:00.000Z', 'read-aloud', 10, 10),
      scored('2026-01-05T10:00:00.000Z', 'read-aloud', 10, 10),
      scored('2026-01-06T10:00:00.000Z', 'read-aloud', 10, 10),
      scored('2026-01-07T10:00:00.000Z', 'read-aloud', 10, 10),
    ]
    const row = weakestTypes(attempts)[0]
    expect(row?.priority).toBe(100)
    expect(row?.attemptsSeen).toBe(5)
    expect(row?.itemsSeen).toBe(5)
  })

  it('treats an unparseable date as the oldest attempt', () => {
    const rows = weakestTypes([
      scored('not-a-date', 'read-aloud', 0, 10),
      scored('2026-01-08T10:00:00.000Z', 'read-aloud', 10, 10),
    ])
    expect(rows[0]?.priority).toBe(80)
  })

  it('orders the attempts by date before weighting them', () => {
    const rows = weakestTypes([
      scored('2026-01-08T10:00:00.000Z', 'read-aloud', 10, 10),
      scored('2026-01-01T10:00:00.000Z', 'read-aloud', 0, 10),
    ])
    expect(rows[0]?.priority).toBe(80)
  })
})

describe('ties', () => {
  // Two types at exactly fifty per cent. The one with a single attempt has less
  // evidence behind it, so it is the one worth looking at.
  const tied = [
    scored('2026-01-01T10:00:00.000Z', 'read-aloud', 5, 10),
    scored('2026-01-02T10:00:00.000Z', 'read-aloud', 5, 10),
    scored('2026-01-03T10:00:00.000Z', 'write-essay', 5, 10),
  ]

  it('breaks a tie on the number of attempts seen', () => {
    const rows = weakestTypes(tied, 2)
    expect(rows[0]?.type).toBe('write-essay')
    expect(rows[0]?.attemptsSeen).toBe(1)
    expect(rows[1]?.type).toBe('read-aloud')
    expect(rows[1]?.attemptsSeen).toBe(2)
  })

  it('gives both tied types the same priority', () => {
    const rows = weakestTypes(tied, 2)
    expect(rows[0]?.priority).toBe(50)
    expect(rows[1]?.priority).toBe(50)
  })
})

describe('what the dashboard asks for', () => {
  const attempts = [
    scored('2026-01-01T10:00:00.000Z', 'read-aloud', 3, 4),
    scored('2026-01-02T10:00:00.000Z', 'write-essay', 1, 4),
  ]

  it('offers three types by default', () => {
    expect(weakestTypes(attempts)).toHaveLength(3)
  })

  it('offers only as many as asked for', () => {
    expect(weakestTypes(attempts, 1)).toHaveLength(1)
  })

  it('puts the weakest measured type first', () => {
    expect(weakestTypes(attempts, 2)[0]?.type).toBe('write-essay')
  })

  it('can restrict the list to the types already met', () => {
    const rows = weakestTypes(attempts, 22, true)
    expect(rows.map((row) => row.type)).toEqual(['write-essay', 'read-aloud'])
  })

  it('keeps a measured type in the restricted list even when it has no points', () => {
    const rows = weakestTypes(
      [attempt('2026-01-01T10:00:00.000Z', { 'read-aloud': stat('read-aloud', 0, 0) })],
      22,
      true,
    )
    expect(rows.map((row) => row.type)).toEqual(['read-aloud'])
  })
})

describe('breakdown entries the blueprint does not know', () => {
  const unknown = 'not-a-real-type' as QuestionType
  const unknownStat: TypeStat = {
    type: unknown,
    label: 'Not a real type',
    skill: 'reading',
    correct: 0,
    partial: 0,
    incorrect: 0,
    total: 1,
    maxPoints: 10,
    earnedPoints: 0,
    seconds: 0,
  }

  it('ignores a stat for a type that does not exist', () => {
    const rows = weakestTypes([attempt('2026-01-01T10:00:00.000Z', { [unknown]: unknownStat })], 22)
    expect(rows.every((row) => row.type !== unknown)).toBe(true)
  })

  it('leaves every known type untested when only unknown types were recorded', () => {
    const rows = weakestTypes([attempt('2026-01-01T10:00:00.000Z', { [unknown]: unknownStat })], 22)
    expect(rows).toHaveLength(ALL_QUESTION_TYPES.length)
    expect(rows.every((row) => row.untested)).toBe(true)
  })
})
