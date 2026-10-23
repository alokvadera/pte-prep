import { describe, expect, it } from 'vitest'
import { buildFullMock } from '../../src/domain/assemble'
import { QUESTION_META } from '../../src/domain/blueprint'
import { buildReport, pteToIelts, rawToPteScale, toCefr } from '../../src/domain/scoring'
import type { ItemResponse } from '../../src/domain/types'

/* ---------------------------------------------------------------------------
   The whole-test report, and the scale conversions it rests on.

   The report is what a candidate sees at the end of a mock. It aggregates
   item-level scores into four skills and one overall estimate, and it has to
   do that without ever letting an unanswered item raise the score.
   --------------------------------------------------------------------------- */

const mock = buildFullMock(12345)
const scored = mock.sections
  .flatMap((section) => section.itemIds)
  .map((id) => mock.items[id]!)
  .filter((item) => item.maxPoints > 0)

const typeCounts: Record<string, number> = {}
for (const item of scored) typeCounts[item.type] = (typeCounts[item.type] ?? 0) + 1

const metaById = Object.fromEntries(
  scored.map((item) => [item.id, { skills: item.skills, type: item.type, label: item.type }]),
)

/** A plausible, well-structured essay built from the item's own key terms. */
function essayFor(terms: string[]): string {
  const t = (index: number) => terms[index] ?? 'the question'
  return [
    `The position set out in the prompt deserves support, because ${t(0)} and ${t(1)} are closely connected and are usually treated separately when they should not be.`,
    `There are three reasons this is convincing. First, ${t(2)} provides a clear mechanism rather than a correlation, so the argument does not depend on the two merely occurring together. Second, ${t(3)} is large enough that the aggregate effect matters even where no individual case is dramatic. Third, ${t(4)} costs more than it first appears once ${t(5)} are counted properly.`,
    `However, the stimulus is careful not to overstate the case. It notes that ${t(6)} depends on local ${t(7)}, which means the conclusion is conditional rather than universal. This qualification is important, because transferring a solution without adapting it can make matters worse.`,
    `In conclusion, the passage is persuasive because it reframes the issue as one of ${t(4)} and ${t(7)} rather than invention. A decision maker who accounted for ${t(5)} would therefore reach a better outcome than one waiting for a new technology, and could revise later if ${t(3)} changed.`,
  ].join('\n\n')
}

/** A single sentence, because Summarize Written Text scores Form 0 otherwise. */
function swtFor(terms: string[]): string {
  const list = terms.slice(0, 4).join(', ')
  return `The passage explains that ${list}, which means ${terms[0] ?? 'the effect'} ultimately depends on ${terms[terms.length - 1] ?? 'local conditions'}.`
}

function perfectResponses(): Record<string, ItemResponse> {
  const responses: Record<string, ItemResponse> = {}

  for (const item of scored) {
    const itemKey = mock.answers[item.id]!
    const mode = QUESTION_META[item.type].scoring
    const terms = itemKey.keyTerms ?? []

    switch (mode) {
      case 'binary':
        responses[item.id] =
          item.type === 'answer-short-question'
            ? { text: itemKey.blanks?.[0]?.[0] ?? '' }
            : { choice: itemKey.correctChoice ?? null }
        break
      case 'per-blank':
        responses[item.id] = { blanks: (itemKey.blanks ?? []).map((answer) => answer[0] ?? '') }
        break
      case 'per-word':
        responses[item.id] = { text: itemKey.reference ?? '' }
        break
      case 'per-adjacent-pair':
        responses[item.id] = { order: itemKey.order ?? [] }
        break
      case 'per-unit-negated':
        responses[item.id] =
          item.type === 'highlight-incorrect-words'
            ? { highlighted: itemKey.correctHighlighted ?? [] }
            : { choices: itemKey.correctChoices ?? [] }
        break
      case 'trait-composite':
        if (item.type === 'write-essay') responses[item.id] = { text: essayFor(terms) }
        else if (item.type === 'summarize-written-text') responses[item.id] = { text: swtFor(terms) }
        else if (item.type === 'summarize-spoken-text') {
          // The reference is already written inside the 50-70 word Form band.
          responses[item.id] = { text: itemKey.reference ?? '' }
        } else if (item.type === 'answer-short-question') responses[item.id] = { text: itemKey.blanks?.[0]?.[0] ?? '' }
        else responses[item.id] = { transcript: itemKey.reference ?? '', text: itemKey.reference ?? '' }
        break
    }
  }

  return responses
}

const responses = perfectResponses()
const perfect = buildReport(scored, mock.answers, responses, metaById)

describe('scale conversion', () => {
  it('maps 0% to the scale floor', () => {
    expect(rawToPteScale(0)).toBe(10)
  })

  it('maps 100% to the scale ceiling', () => {
    expect(rawToPteScale(1)).toBe(90)
  })

  it('maps 50% to around 52', () => {
    expect(Math.abs(rawToPteScale(0.5) - 52)).toBeLessThan(2)
  })

  it('maps 85% into the high 70s', () => {
    expect(rawToPteScale(0.85)).toBeGreaterThan(74)
    expect(rawToPteScale(0.85)).toBeLessThan(82)
  })

  it('maps 70% into the mid 60s', () => {
    expect(rawToPteScale(0.7)).toBeGreaterThan(60)
    expect(rawToPteScale(0.7)).toBeLessThan(70)
  })

  it('is monotonic across the scale', () => {
    const values = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]
    expect(values.every((value, index) => index === 0 || rawToPteScale(value) > rawToPteScale(values[index - 1]!))).toBe(true)
  })

  it('lands every value on a half-point increment', () => {
    expect(
      [0, 0.13, 0.37, 0.62, 0.88, 1].every((value) => Math.abs(rawToPteScale(value) * 2 - Math.round(rawToPteScale(value) * 2)) < 1e-9),
    ).toBe(true)
  })

  // Official bands from the Institution Score Guide (July 2025).
  // 85-90 C2, 76-84 C1, 59-75 B2, 43-58 B1, 30-42 A2, 10-29 A1.
  it('uses the official CEFR band boundaries', () => {
    expect(toCefr(90)).toBe('C2')
    expect(toCefr(85)).toBe('C2')
    expect(toCefr(84)).toBe('C1')
    expect(toCefr(76)).toBe('C1')
    expect(toCefr(75)).toBe('B2')
    expect(toCefr(59)).toBe('B2')
    expect(toCefr(58)).toBe('B1')
    expect(toCefr(43)).toBe('B1')
    expect(toCefr(42)).toBe('A2')
    expect(toCefr(30)).toBe('A2')
    expect(toCefr(29)).toBe('A1')
  })

  it.each([
    [23, null],
    [24, '4.5'],
    [30, '4.5'],
    [31, '5.0'],
    [55, '6.5'],
    [58, '6.5'],
    [63, '7.0'],
    [70, '7.0'],
    [71, '7.5'],
    [79, '8.0'],
    [85, '8.0'],
    [86, '8.5'],
    [90, '9.0'],
  ])('maps a PTE score of %i to IELTS %s', (pte, ielts) => {
    expect(pteToIelts(pte)).toBe(ielts)
  })
})

describe('full report', () => {
  it('puts a perfect typed run in the B2 range', () => {
    expect(perfect.overall).toBeGreaterThanOrEqual(68)
  })

  it('puts a perfect typed run at B2 or above', () => {
    expect(['B2', 'C1', 'C2']).toContain(perfect.cefr)
  })

  it('tracks the legacy overall60 alongside the 10-90 score', () => {
    expect(perfect.overall60).toBe(perfect.overall + 50)
  })

  it('reports all four skills', () => {
    expect(Object.keys(perfect.skills)).toHaveLength(4)
  })

  it('scores every objective item exactly', () => {
    const objectiveKinds = new Set(['choice', 'multi-choice', 'blanks', 'order', 'highlight'])
    const objectiveDetails = perfect.details.filter((detail) =>
      objectiveKinds.has(scored.find((item) => item.id === detail.itemId)!.responseKind),
    )
    expect(objectiveDetails.every((detail) => detail.ratio === 1)).toBe(true)
  })

  it('scores an exact dictation at 85% or better', () => {
    const dictation = perfect.details.filter((detail) => detail.type === 'write-from-dictation')
    expect(dictation.every((detail) => detail.ratio >= 0.85)).toBe(true)
  })

  it('never attaches a "scores zero" note to a response that scored', () => {
    expect(perfect.details.every((detail) => detail.points === 0 || !detail.notes.some((note) => /scores zero/i.test(note)))).toBe(true)
  })

  it('covers every type in the breakdown', () => {
    expect(Object.keys(perfect.breakdown)).toHaveLength(Object.keys(typeCounts).length)
  })

  it('makes the breakdown totals match the available points', () => {
    const total = Object.values(perfect.breakdown).reduce((sum, row) => sum + row.maxPoints, 0)
    expect(Math.abs(total - perfect.availablePoints)).toBeLessThan(0.01)
  })
})

describe('report under a recording', () => {
  const micReport = buildReport(
    scored,
    mock.answers,
    Object.fromEntries(
      scored.flatMap((item): Array<[string, ItemResponse]> => {
        const base = responses[item.id]
        if (!base) return []
        if (item.responseKind !== 'audio' || item.type === 'answer-short-question') return [[item.id, base]]
        return [
          [
            item.id,
            {
              ...base,
              audio: {
                durationMs: 8000,
                wordsPerMinute: 150,
                speechRatio: 0.82,
                pauseCount: 1,
                meanPitchHz: 175,
                energyVariance: 0.55,
                reliable: true,
              },
            },
          ],
        ]
      }),
    ),
    metaById,
  )

  it('scores higher with a recording than without one', () => {
    expect(micReport.overall).toBeGreaterThan(perfect.overall)
  })

  it('scores constructed items above 60% with a recording', () => {
    const constructed = micReport.details.filter((detail) =>
      ['write-essay', 'summarize-written-text', 'summarize-spoken-text', 'answer-short-question', 'read-aloud', 'repeat-sentence', 'describe-image', 'retell-lecture', 'summarize-group-discussion', 'respond-to-situation'].includes(
        detail.type,
      ),
    )
    expect(constructed.every((detail) => detail.ratio > 0.6)).toBe(true)
  })
})

describe('report under partial and empty attempts', () => {
  const empty = buildReport(scored, mock.answers, {}, metaById)

  it('scores an empty run at the scale floor', () => {
    expect(empty.overall).toBe(10)
  })

  it('still lists every item in an empty run', () => {
    expect(empty.details).toHaveLength(scored.length)
  })

  // Answer every second item rather than a contiguous block: question types are
  // not evenly weighted, so deleting the first N responses can strip out most
  // of the marks and leave a run that is half answered but not half weighted.
  const halfResponses: Record<string, ItemResponse> = {}
  Object.keys(responses).forEach((id, index) => {
    if (index % 2 === 0) halfResponses[id] = responses[id]!
  })
  const half = buildReport(scored, mock.answers, halfResponses, metaById)

  it('puts a half run in the middle of the scale', () => {
    expect(half.overall).toBeGreaterThan(30)
    expect(half.overall).toBeLessThan(65)
  })

  // Skipping a question must not remove it from the pool the score is measured
  // against, or leaving items blank would raise the score instead of lowering it.
  it('keeps unanswered items in the denominator', () => {
    expect(Math.abs(half.availablePoints - perfect.availablePoints)).toBeLessThan(0.01)
  })

  it('earns fewer points on an unanswered run than on a complete one', () => {
    expect(half.earnedPoints).toBeLessThan(perfect.earnedPoints)
  })
})
