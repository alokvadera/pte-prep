import { describe, expect, it } from 'vitest'
import { buildFullMock } from '../../src/domain/assemble'
import { QUESTION_META } from '../../src/domain/blueprint'
import { scoreItem } from '../../src/domain/scoring'
import type { Item, ItemResponse } from '../../src/domain/types'

/* ---------------------------------------------------------------------------
   How constructed responses are scored.

   These types have no fixed answer, so the scorer estimates them from traits:
   how much of the target was covered, how it was structured, and how it was
   delivered. The estimates are only as good as their inputs, so the checks
   here are about the shape of the response: a transcript with no recording
   must score differently from the same transcript with one.
   --------------------------------------------------------------------------- */

const mock = buildFullMock(12345)
const scored = mock.sections
  .flatMap((section) => section.itemIds)
  .map((id) => mock.items[id]!)
  .filter((item) => item.maxPoints > 0)

const MIC: ItemResponse['audio'] = {
  durationMs: 8000,
  wordsPerMinute: 150,
  speechRatio: 0.82,
  pauseCount: 1,
  meanPitchHz: 175,
  energyVariance: 0.55,
  reliable: true,
}

function byType(type: string): Item {
  const found = scored.find((item) => item.type === type)
  if (!found) throw new Error(`No scored item of type ${type} in the mock`)
  return found
}

function key(itemId: string) {
  return mock.answers[itemId]!
}

describe('constructed item scoring', () => {
  const rs = byType('repeat-sentence')
  const rsText = key(rs.id).reference ?? ''
  const rsWords = rsText.split(/\s+/).length

  it('scores a perfect typed repeat well but not perfectly', () => {
    expect(scoreItem(rs, key(rs.id), { transcript: rsText }).ratio).toBeGreaterThan(0.6)
  })

  it('scores a perfect repeat with a recording higher than without one', () => {
    const typed = scoreItem(rs, key(rs.id), { transcript: rsText }).ratio
    const spoken = scoreItem(rs, key(rs.id), { transcript: rsText, audio: MIC }).ratio
    expect(spoken).toBeGreaterThan(typed)
  })

  it('scores a half-correct repeat as partial', () => {
    const half = rsText
      .split(/\s+/)
      .slice(0, Math.ceil(rsWords / 2))
      .join(' ')
    const ratio = scoreItem(rs, key(rs.id), { transcript: half }).ratio
    expect(ratio).toBeGreaterThan(0.1)
    expect(ratio).toBeLessThan(0.95)
  })

  it('scores an empty answer as zero', () => {
    expect(scoreItem(rs, key(rs.id), {}).ratio).toBe(0)
  })

  it('scores a recording with no transcript from delivery traits rather than hard-zeroing', () => {
    expect(scoreItem(rs, key(rs.id), { audio: MIC }).ratio).toBeGreaterThan(0)
  })

  const essay = byType('write-essay')
  // Compose a realistic four-paragraph answer around the prompt's own key
  // terms, so the content component is exercised the way a real response
  // would exercise it.
  const essayKeyTerms = key(essay.id).keyTerms ?? []
  const goodEssay = [
    `The question set out in the prompt is worth taking seriously, because it concerns ${essayKeyTerms[0] ?? 'the subject'} and the decisions that follow from ${essayKeyTerms[1] ?? 'it'}. I agree with the position taken in the stimulus, and the reasons are largely practical.`,
    `First, the underlying ${essayKeyTerms[2] ?? 'evidence'} is strong. The passage describes a mechanism rather than asserting a correlation, which means the argument survives the obvious objection that the two things merely occur together. Second, the scale of ${essayKeyTerms[3] ?? 'the effect'} is large enough that small improvements matter in aggregate. Third, ${essayKeyTerms[4] ?? 'the alternative'} is more expensive than it first appears, once ${essayKeyTerms[5] ?? 'the costs'} are counted properly.`,
    `However, the stimulus is careful not to claim that one measure is sufficient. It acknowledges that ${essayKeyTerms[6] ?? 'the approach'} depends on local ${essayKeyTerms[7] ?? 'conditions'}, and that transferring a solution without adapting it can make matters worse. This qualification is important, because it means the correct ${essayKeyTerms[0] ?? 'answer'} is conditional rather than universal.`,
    `In conclusion, the passage is persuasive precisely because it treats the issue as one of ${essayKeyTerms[4] ?? 'policy'} and ${essayKeyTerms[7] ?? 'risk'} rather than of invention. A decision maker who accounted for ${essayKeyTerms[5] ?? 'these factors'} would therefore reach a better outcome than one who waited for a new technology, and would be able to revise the decision later if the ${essayKeyTerms[3] ?? 'evidence'} changed.`,
  ].join('\n\n')

  it('uses a realistic essay length', () => {
    expect(goodEssay.split(/\s+/).length).toBeGreaterThanOrEqual(200)
  })

  it('scores a well-structured essay well', () => {
    expect(scoreItem(essay, key(essay.id), { text: goodEssay }).ratio).toBeGreaterThan(0.6)
  })

  it('scores an unstructured wall of text below a structured essay', () => {
    const structured = scoreItem(essay, key(essay.id), { text: goodEssay }).ratio
    const flat = scoreItem(essay, key(essay.id), { text: goodEssay.replace(/\n\n/g, ' ') }).ratio
    expect(flat).toBeLessThan(structured)
  })

  it('scores a three-word essay near zero', () => {
    expect(scoreItem(essay, key(essay.id), { text: 'heat heat heat city' }).ratio).toBeLessThan(0.3)
  })

  it('scores an empty essay as zero', () => {
    expect(scoreItem(essay, key(essay.id), { text: '' }).ratio).toBe(0)
  })

  it('penalises a heavily copied essay below a written one', () => {
    const reference = key(essay.id).reference ?? ''
    const copied = scoreItem(essay, key(essay.id), { text: `${reference} ${reference}` }).ratio
    const written = scoreItem(essay, key(essay.id), { text: goodEssay }).ratio
    expect(copied).toBeLessThan(written)
  })

  const asq = byType('answer-short-question')
  const asqAnswer = key(asq.id).blanks?.[0]?.[0] ?? ''

  it('scores an exact short answer as one', () => {
    expect(scoreItem(asq, key(asq.id), { text: asqAnswer }).ratio).toBe(1)
  })

  it('scores a case-insensitive short answer as one', () => {
    expect(scoreItem(asq, key(asq.id), { text: asqAnswer.toUpperCase() }).ratio).toBe(1)
  })

  it('scores a wrong short answer as zero', () => {
    expect(scoreItem(asq, key(asq.id), { text: 'something else entirely' }).ratio).toBe(0)
  })

  it('scores an empty short answer as zero', () => {
    expect(scoreItem(asq, key(asq.id), {}).ratio).toBe(0)
  })
})

describe('scoring modes are the ones the blueprint declares', () => {
  it('marks the spoken types as trait-composite', () => {
    for (const type of [
      'read-aloud',
      'repeat-sentence',
      'describe-image',
      'retell-lecture',
    ] as const) {
      expect(QUESTION_META[type].scoring).toBe('trait-composite')
    }
  })

  it('marks the choice types as binary', () => {
    for (const type of [
      'answer-short-question',
      'multiple-choice-single',
      'highlight-correct-summary',
    ] as const) {
      expect(QUESTION_META[type].scoring).toBe('binary')
    }
  })

  it('marks the multi-select types as per-unit-negated', () => {
    for (const type of [
      'multiple-choice-multiple',
      'listening-multiple-choice-multiple',
      'highlight-incorrect-words',
    ] as const) {
      expect(QUESTION_META[type].scoring).toBe('per-unit-negated')
    }
  })
})
