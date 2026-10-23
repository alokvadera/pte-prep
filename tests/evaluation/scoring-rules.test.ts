import { describe, expect, it } from 'vitest'
import { buildFullMock } from '../../src/domain/assemble'
import { ALL_QUESTION_TYPES, NEGATIVE_MARKING_TYPES, QUESTION_META } from '../../src/domain/blueprint'
import { expectedMaxPoints, formBand, scoreItem } from '../../src/domain/scoring'
import { keyTermCoverage } from '../../src/lib/text'
import type { Item, ItemResponse } from '../../src/domain/types'

/* ---------------------------------------------------------------------------
   The rules Pearson publishes, asserted against the items the app actually
   ships rather than against fixtures the test wrote itself.

   Every one of these encodes a rule quoted from the 2026 Score Guide, and
   together they are the regression net for the four mistakes this project
   originally made with scoring.
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

/** A run of words ending in a full stop, for the form-band rules. */
const filler = (count: number): string => `${'word '.repeat(count).trim()}.`

describe('objective item scoring', () => {
  const mcq = byType('multiple-choice-single')

  it('scores a correct single choice as one', () => {
    expect(scoreItem(mcq, key(mcq.id), { choice: key(mcq.id).correctChoice }).ratio).toBe(1)
  })

  it('scores a wrong single choice as zero', () => {
    expect(scoreItem(mcq, key(mcq.id), { choice: 'definitely not the answer' }).ratio).toBe(0)
  })

  it('scores a blank single choice as zero', () => {
    expect(scoreItem(mcq, key(mcq.id), {}).ratio).toBe(0)
  })

  const rop = byType('reorder-paragraphs')

  it('scores a correct order as one', () => {
    expect(scoreItem(rop, key(rop.id), { order: key(rop.id).order }).ratio).toBe(1)
  })

  it('scores a reversed order below full marks', () => {
    expect(scoreItem(rop, key(rop.id), { order: [...(key(rop.id).order ?? [])].reverse() }).ratio).toBeLessThan(1)
  })

  it('scores a wholly wrong order as zero', () => {
    expect(scoreItem(rop, key(rop.id), { order: ['x', 'y', 'z', 'w', 'v'] }).ratio).toBe(0)
  })

  // A one-box item has no adjacent pair to score, so its ratio would be 0/0. A
  // NaN there is not local: it flows into the skill and overall aggregates and
  // renders as NaN across the results page.
  it('does not produce a NaN score for a re-order item with a single box', () => {
    const singleBox = { ...rop, maxPoints: 1 }
    const detail = scoreItem(singleBox, { order: ['only'] }, { order: ['only'] })
    expect(Number.isFinite(detail.ratio)).toBe(true)
    expect(Number.isFinite(detail.points)).toBe(true)
  })

  const fibd = byType('fill-in-blanks-dropdown')
  const fibdAll = (key(fibd.id).blanks ?? []).map((answer) => answer[0]!)

  it('scores all-correct dropdown blanks as one', () => {
    expect(scoreItem(fibd, key(fibd.id), { blanks: fibdAll }).ratio).toBe(1)
  })

  it('scores partial dropdown blanks proportionally', () => {
    const half = fibdAll.map((value, index) => (index % 2 === 0 ? value : 'wrong'))
    const expected = fibdAll.filter((_, index) => index % 2 === 0).length / fibdAll.length
    expect(Math.abs(scoreItem(fibd, key(fibd.id), { blanks: half }).ratio - expected)).toBeLessThan(0.01)
  })

  it('charges exactly one nth for a single wrong blank', () => {
    const oneWrong = fibdAll.map((value, index) => (index === 0 ? 'nope' : value))
    expect(Math.abs(scoreItem(fibd, key(fibd.id), { blanks: oneWrong }).ratio - (1 - 1 / fibdAll.length))).toBeLessThan(0.01)
  })

  const wfd = byType('write-from-dictation')

  it('scores an exact dictation highly', () => {
    expect(scoreItem(wfd, key(wfd.id), { text: key(wfd.id).reference ?? '' }).ratio).toBeGreaterThan(0.7)
  })

  it('scores garbage dictation low', () => {
    expect(scoreItem(wfd, key(wfd.id), { text: 'the cat sat' }).ratio).toBeLessThan(0.4)
  })
})

describe('re-order paragraphs: one point per adjacent pair', () => {
  const rop = byType('reorder-paragraphs')
  const order = ['a', 'b', 'c', 'd']
  const item = { ...rop, id: 'rop-test', maxPoints: order.length - 1 }
  const itemKey = { order }

  it('earns every adjacent pair for a perfect order', () => {
    expect(scoreItem(item, itemKey, { order }).ratio).toBe(1)
  })

  it('charges exactly one point for one broken link', () => {
    expect(Math.abs(scoreItem(item, itemKey, { order: ['a', 'b', 'd', 'c'] }).ratio - 1 / 3)).toBeLessThan(0.001)
  })

  it('earns two points for a chain of three correct boxes', () => {
    expect(Math.abs(scoreItem(item, itemKey, { order: ['d', 'a', 'b', 'c'] }).ratio - 2 / 3)).toBeLessThan(0.001)
  })

  it('scores zero when no adjacency is right', () => {
    expect(scoreItem(item, itemKey, { order: ['c', 'a', 'd', 'b'] }).ratio).toBe(0)
  })

  it('reports four points for a five-box item', () => {
    expect(expectedMaxPoints('reorder-paragraphs', { order: ['p0', 'p1', 'p2', 'p3', 'p4'] })).toBe(4)
  })
})

describe('per-unit item maxima come from the item itself', () => {
  const refWords = (id: string) => (key(id).reference ?? '').split(/\s+/).filter(Boolean).length
  const perWordItems = scored.filter((item) => QUESTION_META[item.type].scoring === 'per-word')
  const perPairItems = scored.filter((item) => QUESTION_META[item.type].scoring === 'per-adjacent-pair')
  const negatedItems = scored.filter((item) => QUESTION_META[item.type].scoring === 'per-unit-negated')

  it('has per-word items to check', () => {
    expect(perWordItems.length).toBeGreaterThan(0)
  })

  it('has per-adjacent-pair items to check', () => {
    expect(perPairItems.length).toBeGreaterThan(0)
  })

  it('has negatively marked items to check', () => {
    expect(negatedItems.length).toBeGreaterThan(0)
  })

  it('makes every dictation item worth one point per reference word', () => {
    expect(perWordItems.every((item) => item.maxPoints === refWords(item.id))).toBe(true)
  })

  it('makes every re-order item worth one point per adjacent pair', () => {
    expect(perPairItems.every((item) => item.maxPoints === Math.max(1, (key(item.id).order ?? []).length - 1))).toBe(true)
  })

  it('makes every negatively marked item worth one point per correct unit', () => {
    expect(
      negatedItems.every((item) =>
        item.type === 'highlight-incorrect-words'
          ? item.maxPoints === Math.max(1, (key(item.id).correctHighlighted ?? []).length)
          : item.maxPoints === Math.max(1, (key(item.id).correctChoices ?? []).length),
      ),
    ).toBe(true)
  })

  it('gives no per-unit item a maximum below one point', () => {
    expect(
      scored
        .filter((item) => ['per-word', 'per-adjacent-pair', 'per-unit-negated', 'per-blank'].includes(QUESTION_META[item.type].scoring))
        .every((item) => item.maxPoints >= 1),
    ).toBe(true)
  })

  it('reports a dictation maximum equal to its reference word count', () => {
    expect(expectedMaxPoints('write-from-dictation', { reference: 'The professor explained the theory to the students.' })).toBe(8)
  })

  it('agrees with expectedMaxPoints on every assembled item', () => {
    expect(scored.every((item) => item.maxPoints === expectedMaxPoints(item.type, key(item.id)))).toBe(true)
  })
})

describe('negative marking', () => {
  it('uses negative marking on exactly three types', () => {
    expect(NEGATIVE_MARKING_TYPES).toHaveLength(3)
  })

  const mcqM = byType('multiple-choice-multiple')
  const correct = key(mcqM.id).correctChoices ?? []

  it('gives both correct answers full marks', () => {
    expect(scoreItem(mcqM, key(mcqM.id), { choices: correct }).ratio).toBe(1)
  })

  it('cancels one correct answer with one wrong selection', () => {
    expect(scoreItem(mcqM, key(mcqM.id), { choices: [...correct.slice(0, 1), 'definitely not an option'] }).ratio).toBe(0)
  })

  it('does not double count duplicate selections', () => {
    expect(scoreItem(mcqM, key(mcqM.id), { choices: [...correct, ...correct] }).ratio).toBe(1)
  })

  const hiw = byType('highlight-incorrect-words')
  const correctIdx = key(hiw.id).correctHighlighted ?? []

  it('gives both correct highlights full marks', () => {
    expect(scoreItem(hiw, key(hiw.id), { highlighted: correctIdx }).ratio).toBe(1)
  })

  // The item maximum is the number of correct words, so two correct minus one
  // wrong is one of two, and more wrong than correct floors at zero.
  const extraIdx = (hiw.tokens ?? []).findIndex((_, index) => !correctIdx.includes(index))

  it('charges a full point for one extra highlight', () => {
    const ratio = scoreItem(hiw, key(hiw.id), { highlighted: [...correctIdx, extraIdx] }).ratio
    expect(Math.abs(ratio - 0.5)).toBeLessThan(0.001)
  })

  it('floors at zero when more highlights are wrong than right', () => {
    expect(scoreItem(hiw, key(hiw.id), { highlighted: [0, 1, 2] }).ratio).toBe(0)
  })
})

describe('write from dictation: one point per correct word', () => {
  // The real assembled item is used, not one whose maximum the test set, so the
  // ratios below are measured against the item the app actually ships.
  const wfd = byType('write-from-dictation')
  const sentence = 'The professor explained the theory to the students.'
  const item = { ...wfd }
  const itemKey = { reference: sentence }

  it('scores seven of eight when the first word is missing', () => {
    const ratio = scoreItem(item, itemKey, { text: 'professor explained the theory to the students.' }).ratio
    expect(Math.abs(ratio - 7 / 8)).toBeLessThan(0.001)
  })

  it('retains full marks when an extra word is inserted', () => {
    expect(scoreItem(item, itemKey, { text: 'The professor quickly explained the theory to the students.' }).ratio).toBe(1)
  })
})

describe('form bands', () => {
  it('gives a 250-word essay the top band', () => {
    expect(formBand('write-essay', filler(250)).score).toBe(1)
  })

  it('gives a 174-word essay the middle band', () => {
    expect(formBand('write-essay', filler(174)).score).toBe(0.5)
  })

  it('gives a 100-word essay Form 0', () => {
    expect(formBand('write-essay', filler(100)).score).toBe(0)
  })

  it('gives a 400-word essay Form 0', () => {
    expect(formBand('write-essay', filler(400)).score).toBe(0)
  })

  it('gives a 60-word spoken summary the top band', () => {
    expect(formBand('summarize-spoken-text', filler(60)).score).toBe(1)
  })

  it('gives a 30-word spoken summary Form 0', () => {
    expect(formBand('summarize-spoken-text', filler(30)).score).toBe(0)
  })

  it('gives a one-sentence written summary Form 1', () => {
    expect(formBand('summarize-written-text', 'This is one complete sentence.').score).toBe(1)
  })

  it('gives a summary with abbreviations Form 1', () => {
    expect(formBand('summarize-written-text', 'Dr. Smith showed that the U.S. economy grew by three percent.').score).toBe(1)
  })

  it('gives a two-sentence written summary Form 0', () => {
    expect(formBand('summarize-written-text', 'One sentence. And another.').score).toBe(0)
  })

  it('gives a summary with no final punctuation Form 0', () => {
    expect(formBand('summarize-written-text', 'This is one complete sentence').score).toBe(0)
  })

  // Form 0 is not only about word count: an all-caps, punctuation-free or
  // bulleted response scores zero however long it is.
  const longBody = filler(250)

  it('gives an all-caps essay Form 0', () => {
    expect(formBand('write-essay', longBody.toUpperCase()).score).toBe(0)
  })

  it('gives an essay with no sentence-ending punctuation Form 0', () => {
    expect(formBand('write-essay', longBody.replace(/\.$/, '')).score).toBe(0)
  })

  it('gives a bulleted essay Form 0', () => {
    const bullets = Array.from({ length: 30 }, (_, i) => `- point ${i} about the topic`).join('\n')
    expect(formBand('write-essay', bullets).score).toBe(0)
  })

  it('gives an essay of very short sentences Form 0', () => {
    expect(formBand('write-essay', 'It is good. That is true. This is fine. '.repeat(20).trim()).score).toBe(0)
  })

  it('gives an all-caps spoken summary Form 0', () => {
    expect(formBand('summarize-spoken-text', filler(60).toUpperCase()).score).toBe(0)
  })

  it('gives an all-caps written summary Form 0', () => {
    expect(formBand('summarize-written-text', 'This is one complete sentence.'.toUpperCase()).score).toBe(0)
  })

  it('names the condition that triggered Form 0', () => {
    expect(formBand('write-essay', longBody.toUpperCase()).note).toMatch(/all capitals/i)
  })

  it('leaves a normally formed essay without a Form 0 note', () => {
    expect(formBand('write-essay', longBody).score).toBe(1)
    expect(formBand('write-essay', longBody).note).toBe('')
  })
})

describe('punctuation a word processor produces', () => {
  // Reading a curly quote or an ellipsis as "no sentence-ending punctuation"
  // would score a complete answer as Form 0 and zero the item.
  const openEnded = filler(250).replace(/\.$/, '')

  it.each([
    ['a straight double quote', '."'],
    ['a curly double quote', '.”'],
    ['a curly single quote', '.’'],
    ['a closing bracket', '.)'],
    ['an ellipsis character', '…'],
  ])('does not treat an essay ending in %s as unpunctuated', (_label, tail) => {
    expect(formBand('write-essay', `${openEnded}${tail}`).score).toBe(1)
  })

  it('still gives Form 0 to a response with genuinely no end punctuation', () => {
    expect(formBand('write-essay', openEnded).score).toBe(0)
  })

  it('does not treat a curly-quoted summary as unpunctuated', () => {
    expect(formBand('summarize-written-text', 'This is one complete sentence.”').score).toBe(1)
  })

  it('gates an all-caps essay to zero', () => {
    const essay = byType('write-essay')
    expect(scoreItem(essay, key(essay.id), { text: filler(250).toUpperCase() }).ratio).toBe(0)
  })
})

describe('integrated items and skill routing', () => {
  const integrated = ALL_QUESTION_TYPES.filter((type) => QUESTION_META[type].skills.length > 1)

  it('has eight integrated types that score two skills', () => {
    expect(integrated).toHaveLength(8)
  })

  it.each(['repeat-sentence', 'retell-lecture', 'summarize-group-discussion'] as const)(
    'scores %s for Listening and Speaking',
    (type) => {
      expect(QUESTION_META[type].skills.join('+')).toBe('listening+speaking')
    },
  )

  it('scores summarize-written-text for Reading and Writing', () => {
    expect(QUESTION_META['summarize-written-text'].skills.join('+')).toBe('reading+writing')
  })

  it('scores summarize-spoken-text for Listening and Writing', () => {
    expect(QUESTION_META['summarize-spoken-text'].skills.join('+')).toBe('listening+writing')
  })

  it('scores write-from-dictation for Listening and Writing', () => {
    expect(QUESTION_META['write-from-dictation'].skills.join('+')).toBe('listening+writing')
  })

  it('scores read-aloud for Speaking only', () => {
    expect(QUESTION_META['read-aloud'].skills.join('+')).toBe('speaking')
  })

  it('scores answer-short-question for Listening only', () => {
    expect(QUESTION_META['answer-short-question'].skills.join('+')).toBe('listening')
  })
})

describe('content gating', () => {
  it('scores a fluent answer with no content as zero, because Content gates the item', () => {
    const rtl = byType('retell-lecture')
    const score = scoreItem(rtl, key(rtl.id), { transcript: 'so anyway it was basically that in the end you know', audio: MIC })
    expect(score.ratio).toBe(0)
  })

  it('covers every model answer with its own key terms', () => {
    expect(
      scored
        .filter((item) => QUESTION_META[item.type].scoring === 'trait-composite' && (key(item.id).keyTerms ?? []).length > 0)
        .every((item) => keyTermCoverage(key(item.id).reference ?? '', key(item.id).keyTerms ?? []) > 0.9),
    ).toBe(true)
  })
})
