import { describe, expect, it } from 'vitest'
import { QUESTION_META } from '../../../src/domain/blueprint'
import {
  ADMISSION_TARGETS,
  CEFR_BANDS,
  CONTENT_MAX,
  IELTS_CONCORDANCE,
  buildReport,
  cefrLabel,
  endsWithSentencePunctuation,
  expectedMaxPoints,
  formBand,
  nextBand,
  pteToIelts,
  rawToPteScale,
  scoreBand,
  scoreItem,
  splitSentences,
  toCefr,
} from '../../../src/domain/scoring'
import type { AnswerKey, Item, ItemResponse } from '../../../src/domain/types'

/* ---------------------------------------------------------------------------
   The scoring model.

   Everything Pearson publishes is implemented exactly, and the two things it
   does not publish — the trait weighting and the score conversion — are
   estimated. This file covers the published rules exhaustively: the scoring
   mode of every type, the two gates that zero an item, the Form bands, the
   negative marking, and the scale conversions the report is built on.
   --------------------------------------------------------------------------- */

function makeItem(type: Item['type'], overrides: Partial<Item> = {}): Item {
  return {
    id: `test-${type}`,
    type,
    section: 'listening',
    groupId: 'g-test',
    skills: [...QUESTION_META[type].skills],
    responseKind: 'choice',
    prompt: '',
    maxPoints: 1,
    seconds: 30,
    ...overrides,
  }
}

function audio(overrides: Partial<NonNullable<ItemResponse['audio']>> = {}): NonNullable<ItemResponse['audio']> {
  return {
    durationMs: 8000,
    wordsPerMinute: 140,
    speechRatio: 0.8,
    pauseCount: 0,
    meanPitchHz: 180,
    energyVariance: 0.55,
    reliable: true,
    ...overrides,
  }
}

/** A passage long enough to put the fluency estimator in its full-length band. */
const LONG_TEXT =
  'The committee reviewed the proposal in detail and asked the research team to explain how the measurements were collected. The team described the instrument, the calibration schedule and the number of sites that took part in the study. Several members wanted to know whether the effect persisted once the seasonal variation had been accounted for, and the answer given was that it did, although the margin was smaller than the headline figure suggested.'

/** A run of words ending in a full stop. */
const filler = (count: number): string => `${'word '.repeat(count).trim()}.`

describe('sentence splitting', () => {
  it('splits on sentence-ending punctuation', () => {
    expect(splitSentences('One. Two! Three?')).toEqual(['One.', 'Two!', 'Three?'])
  })

  it('keeps an honorific with the name that follows it', () => {
    expect(splitSentences('Dr. Smith arrived. He left.')).toEqual(['Dr. Smith arrived.', 'He left.'])
  })

  it('keeps an initialism together', () => {
    expect(splitSentences('The U.S. economy grew. It slowed.')).toEqual(['The U.S. economy grew.', 'It slowed.'])
  })

  it('keeps a spelled-out initialism together', () => {
    expect(splitSentences('This is e.g. an example. And more.')).toEqual(['This is e.g. an example.', 'And more.'])
  })

  it('drops empty fragments', () => {
    expect(splitSentences('   ')).toEqual([])
  })

  it('leaves a fragment with no terminator alone', () => {
    expect(splitSentences('no terminator here')).toEqual(['no terminator here'])
  })
})

describe('sentence-ending punctuation', () => {
  it('accepts a full stop', () => {
    expect(endsWithSentencePunctuation('A complete sentence.')).toBe(true)
  })

  it('rejects a sentence with no terminator', () => {
    expect(endsWithSentencePunctuation('No terminator')).toBe(false)
  })

  it('accepts a question mark and an exclamation mark', () => {
    expect(endsWithSentencePunctuation('Really?')).toBe(true)
    expect(endsWithSentencePunctuation('Wow!')).toBe(true)
  })

  it('accepts the typographic forms a word processor produces', () => {
    expect(endsWithSentencePunctuation('A sentence.”')).toBe(true)
    expect(endsWithSentencePunctuation('A sentence…')).toBe(true)
    expect(endsWithSentencePunctuation('A sentence.)')).toBe(true)
  })

  it('rejects an empty response', () => {
    expect(endsWithSentencePunctuation('')).toBe(false)
  })
})

describe('form bands', () => {
  it('gives a 250-word essay the top band', () => {
    expect(formBand('write-essay', filler(250))).toEqual({ score: 1, max: 1, note: '' })
  })

  it('gives a 174-word essay the middle band', () => {
    expect(formBand('write-essay', filler(174)).score).toBe(0.5)
  })

  it('gives a 320-word essay the middle band', () => {
    expect(formBand('write-essay', filler(320)).score).toBe(0.5)
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

  it('gives a 45-word spoken summary the middle band', () => {
    expect(formBand('summarize-spoken-text', filler(45)).score).toBe(0.5)
  })

  it('gives an 80-word spoken summary the middle band', () => {
    expect(formBand('summarize-spoken-text', filler(80)).score).toBe(0.5)
  })

  it('gives a 30-word spoken summary Form 0', () => {
    expect(formBand('summarize-spoken-text', filler(30)).score).toBe(0)
  })

  it('gives a one-sentence written summary Form 1', () => {
    expect(formBand('summarize-written-text', 'This is one complete sentence.').score).toBe(1)
  })

  it('gives a two-sentence written summary Form 0', () => {
    expect(formBand('summarize-written-text', 'One sentence. And another.').score).toBe(0)
  })

  it('gives an all-caps essay Form 0 and names the reason', () => {
    const result = formBand('write-essay', filler(250).toUpperCase())
    expect(result.score).toBe(0)
    expect(result.note).toMatch(/all capitals/i)
  })

  it('gives an essay with no end punctuation Form 0', () => {
    expect(formBand('write-essay', filler(250).replace(/\.$/, '')).score).toBe(0)
  })

  it('gives a bulleted response Form 0 and names the reason', () => {
    // The bullets have to end in punctuation, or the missing-terminator rule
    // would trigger first and the bullet rule would never be reached.
    const bullets = '- first point here.\n- second point here.\n- third point here.'
    const result = formBand('write-essay', bullets)
    expect(result.score).toBe(0)
    expect(result.note).toMatch(/list of bullets/i)
  })

  it('gives a response of very short sentences Form 0', () => {
    expect(formBand('write-essay', 'It is good. That is true. This is fine. '.repeat(20).trim()).score).toBe(0)
  })

  it('gives any other written type the generic half band', () => {
    expect(formBand('summarize-group-discussion', 'A perfectly ordinary sentence about the topic.').score).toBe(0.5)
  })

  it('gives any other written type Form 0 when a Form 0 condition applies', () => {
    const result = formBand('summarize-group-discussion', 'A PERFECTLY ORDINARY SENTENCE ABOUT THE TOPIC AND MORE.')
    expect(result.score).toBe(0)
    expect(result.note).toMatch(/all capitals/i)
  })
})

describe('published item maxima', () => {
  it('counts the adjacent pairs of a re-order item', () => {
    expect(expectedMaxPoints('reorder-paragraphs', { order: ['a', 'b', 'c', 'd'] })).toBe(3)
  })

  it('never reports fewer than one point for a re-order item', () => {
    expect(expectedMaxPoints('reorder-paragraphs', {})).toBe(1)
  })

  it('counts the reference words of a dictation item', () => {
    expect(expectedMaxPoints('write-from-dictation', { reference: 'one two three' })).toBe(3)
  })

  it('never reports fewer than one point for a dictation item', () => {
    expect(expectedMaxPoints('write-from-dictation', {})).toBe(1)
  })

  it('counts the correct options of a multiple-answer item', () => {
    expect(expectedMaxPoints('multiple-choice-multiple', { correctChoices: ['a', 'b', 'c'] })).toBe(3)
  })

  it('never reports fewer than one point for a multiple-answer item', () => {
    expect(expectedMaxPoints('multiple-choice-multiple', {})).toBe(1)
  })

  it('counts the correct options of a listening multiple-answer item', () => {
    expect(expectedMaxPoints('listening-multiple-choice-multiple', { correctChoices: ['a', 'b'] })).toBe(2)
  })

  it('never reports fewer than one point for a listening multiple-answer item', () => {
    expect(expectedMaxPoints('listening-multiple-choice-multiple', {})).toBe(1)
  })

  it('counts the incorrect words of a highlight item', () => {
    expect(expectedMaxPoints('highlight-incorrect-words', { correctHighlighted: [1, 2, 3] })).toBe(3)
  })

  it('never reports fewer than one point for a highlight item', () => {
    expect(expectedMaxPoints('highlight-incorrect-words', {})).toBe(1)
  })

  it('counts the blanks of a dropdown item', () => {
    expect(expectedMaxPoints('fill-in-blanks-dropdown', { blanks: [['a'], ['b']] })).toBe(2)
  })

  it('never reports fewer than one point for a dropdown item', () => {
    expect(expectedMaxPoints('fill-in-blanks-dropdown', {})).toBe(1)
  })

  it('never reports fewer than one point for a table item', () => {
    expect(expectedMaxPoints('fill-in-blanks-table', {})).toBe(1)
  })

  it('never reports fewer than one point for a listening blanks item', () => {
    expect(expectedMaxPoints('fill-in-blanks-listening', {})).toBe(1)
  })

  it('reports one point for every other type', () => {
    expect(expectedMaxPoints('read-aloud', {})).toBe(1)
    expect(expectedMaxPoints('write-essay', {})).toBe(1)
  })
})

describe('objective scoring', () => {
  const single = makeItem('multiple-choice-single')

  it('scores the right option as one', () => {
    expect(scoreItem(single, { correctChoice: 'Alpha' }, { choice: 'Alpha' }).ratio).toBe(1)
  })

  it('scores the wrong option as zero', () => {
    const detail = scoreItem(single, { correctChoice: 'Alpha' }, { choice: 'Beta' })
    expect(detail.ratio).toBe(0)
    expect(detail.notes).toEqual(['Incorrect option.'])
  })

  it('scores an unanswered item as zero', () => {
    const detail = scoreItem(single, { correctChoice: 'Alpha' }, {})
    expect(detail.ratio).toBe(0)
    expect(detail.notes).toEqual(['Not answered.'])
  })

  it('scores a wrong option as zero when the key has no right one', () => {
    expect(scoreItem(single, {}, { choice: 'Beta' }).ratio).toBe(0)
  })

  const blanks = makeItem('fill-in-blanks-dropdown', { responseKind: 'blanks', maxPoints: 2 })

  it('scores every blank that is right', () => {
    const detail = scoreItem(blanks, { blanks: [['alpha'], ['beta']] }, { blanks: ['alpha', 'beta'] })
    expect(detail.ratio).toBe(1)
    expect(detail.status).toBe('correct')
  })

  it('scores half the blanks that are right', () => {
    const detail = scoreItem(blanks, { blanks: [['alpha'], ['beta']] }, { blanks: ['alpha', 'wrong'] })
    expect(detail.ratio).toBe(0.5)
    expect(detail.status).toBe('partial')
  })

  it('names the blanks that were missed', () => {
    const detail = scoreItem(blanks, { blanks: [['alpha'], ['beta']] }, { blanks: ['alpha', 'wrong'] })
    expect(detail.notes[0]).toContain('1 of 2 correct')
    expect(detail.notes[0]).toContain('“beta”')
  })

  it('refuses to score an item whose key has no blanks', () => {
    const detail = scoreItem(blanks, {}, { blanks: ['alpha', 'beta'] })
    expect(detail.ratio).toBe(0)
    expect(detail.notes).toEqual(['Not scored.'])
  })

  it('shows an empty answer for a blank that accepts nothing', () => {
    const detail = scoreItem(blanks, { blanks: [['alpha'], []] }, { blanks: ['alpha', 'wrong'] })
    expect(detail.notes[0]).toContain('“”')
  })

  const dictation = makeItem('write-from-dictation', { responseKind: 'text', maxPoints: 3 })

  it('scores one point per reference word', () => {
    const detail = scoreItem(dictation, { reference: 'one two three' }, { text: 'one two three' })
    expect(detail.ratio).toBe(1)
    expect(detail.points).toBe(3)
  })

  it('refuses to score an item whose key has no reference', () => {
    const detail = scoreItem(dictation, {}, { text: 'one two three' })
    expect(detail.ratio).toBe(0)
    expect(detail.notes).toEqual(['Not scored.'])
  })

  it('names the reference words that were missed', () => {
    const detail = scoreItem(dictation, { reference: 'one two three' }, { text: 'one two' })
    expect(detail.notes[0]).toContain('2 of 3 words correct')
    expect(detail.notes[0]).toContain('three')
  })

  const reorder = makeItem('reorder-paragraphs', { responseKind: 'order', maxPoints: 3 })

  it('scores a correct order as one', () => {
    expect(scoreItem(reorder, { order: ['a', 'b', 'c', 'd'] }, { order: ['a', 'b', 'c', 'd'] }).ratio).toBe(1)
  })

  it('refuses to score an item whose key has no order', () => {
    const detail = scoreItem(reorder, {}, { order: ['a', 'b', 'c', 'd'] })
    expect(detail.ratio).toBe(0)
    expect(detail.notes).toEqual(['Not scored.'])
  })

  it('refuses to score an order that is not complete', () => {
    const detail = scoreItem(reorder, { order: ['a', 'b', 'c', 'd'] }, { order: ['a', 'b'] })
    expect(detail.notes).toEqual(['All the boxes must be placed before the item can score.'])
  })

  it('ignores a block that is not one of the item blocks', () => {
    const detail = scoreItem(reorder, { order: ['a', 'b', 'c', 'd'] }, { order: ['a', 'b', 'x', 'c'] })
    expect(detail.ratio).toBeLessThan(1)
    expect(Number.isFinite(detail.ratio)).toBe(true)
  })
})

describe('negatively marked scoring', () => {
  const multi = makeItem('multiple-choice-multiple', { responseKind: 'multi-choice', maxPoints: 2 })

  it('scores every correct option', () => {
    expect(scoreItem(multi, { correctChoices: ['a', 'b'] }, { choices: ['a', 'b'] }).ratio).toBe(1)
  })

  it('subtracts a point for every wrong option', () => {
    // One right and one wrong cancel out, so the item scores nothing.
    expect(scoreItem(multi, { correctChoices: ['a', 'b'] }, { choices: ['a', 'x'] }).ratio).toBe(0)
  })

  it('scores nothing when nothing was selected', () => {
    const detail = scoreItem(multi, { correctChoices: ['a', 'b'] }, { choices: [] })
    expect(detail.ratio).toBe(0)
    expect(detail.notes).toEqual(['Nothing was selected.'])
  })

  it('scores nothing when the key has no correct options at all', () => {
    const detail = scoreItem(multi, {}, { choices: ['a'] })
    expect(detail.ratio).toBe(0)
    expect(detail.notes[0]).toContain('0 correct and 1 incorrect')
  })

  const highlight = makeItem('highlight-incorrect-words', { responseKind: 'highlight', maxPoints: 2 })

  it('scores the right highlights', () => {
    expect(scoreItem(highlight, { correctHighlighted: [3, 7] }, { highlighted: [3, 7] }).ratio).toBe(1)
  })

  it('scores nothing when the key has no highlighted words', () => {
    const detail = scoreItem(highlight, {}, { highlighted: [3] })
    expect(detail.ratio).toBe(0)
  })
})

describe('answer short questions', () => {
  const asq = makeItem('answer-short-question', { responseKind: 'audio' })

  it('scores the right answer as one', () => {
    expect(scoreItem(asq, { correctChoice: 'A library card' }, { text: 'A library card' }).ratio).toBe(1)
  })

  it('scores a wrong answer as zero', () => {
    const detail = scoreItem(asq, { correctChoice: 'A library card' }, { text: 'A student card' })
    expect(detail.ratio).toBe(0)
    expect(detail.notes[0]).toContain('Vocabulary 0')
  })

  it('scores an unanswered item as zero', () => {
    const detail = scoreItem(asq, { correctChoice: 'A library card' }, {})
    expect(detail.ratio).toBe(0)
    expect(detail.notes).toEqual(['No answer was given.'])
  })

  it('accepts the right answer inside a longer phrase', () => {
    const detail = scoreItem(asq, { correctChoice: 'green' }, { text: 'the green valley' })
    expect(detail.ratio).toBe(1)
    expect(detail.notes).toEqual([])
  })

  it('warns when the answer is longer than four words', () => {
    const detail = scoreItem(asq, { correctChoice: 'green' }, { text: 'the green valley lies to the north' })
    expect(detail.ratio).toBe(1)
    expect(detail.notes).toEqual(['Correct, but the guide expects one to four words for this type.'])
  })

  it('falls back to the single correct choice when the key has no blanks', () => {
    const detail = scoreItem(asq, { correctChoice: 'green' }, { text: 'green' })
    expect(detail.ratio).toBe(1)
  })

  it('reads an empty accepted answer as an empty string', () => {
    const detail = scoreItem(asq, { correctChoice: 'green', blanks: [[]] }, { text: 'green' })
    expect(detail.ratio).toBe(1)
  })

  it('says so when the key has neither blanks nor a correct choice', () => {
    const detail = scoreItem(asq, {}, { text: 'something' })
    expect(detail.ratio).toBe(0)
    expect(detail.notes[0]).toContain('Expected “”')
  })
})

describe('spoken items', () => {
  const readAloud = makeItem('read-aloud', { responseKind: 'audio', maxPoints: 3 })

  it('scores a perfect reading well', () => {
    const detail = scoreItem(readAloud, { reference: LONG_TEXT }, { transcript: LONG_TEXT, audio: audio() })
    expect(detail.ratio).toBeGreaterThan(0.8)
  })

  it('says nothing was spoken when there is neither words nor a recording', () => {
    const detail = scoreItem(readAloud, { reference: LONG_TEXT }, { audio: audio({ wordsPerMinute: undefined as unknown as number }) })
    expect(detail.notes).toContain('Nothing was spoken.')
    expect(detail.notes).toContain('Pronunciation was not measured — record the answer to score this trait.')
  })

  it('says oral fluency was not measured when there are words but no pace', () => {
    const detail = scoreItem(readAloud, { reference: LONG_TEXT }, { transcript: LONG_TEXT, audio: audio({ wordsPerMinute: 0 }) })
    expect(detail.notes).toContain('Oral fluency was not measured — record the answer to score this trait.')
  })

  it.each([
    [70, 0.4],
    [100, 0.6],
    [120, 0.8],
    [140, 1],
    [200, 0.8],
    [250, 0.6],
  ])('bands oral fluency at %i words per minute', (wpm, expected) => {
    const detail = scoreItem(readAloud, { reference: LONG_TEXT }, { transcript: LONG_TEXT, audio: audio({ wordsPerMinute: wpm }) })
    expect(detail.traits?.oralFluency).toBeCloseTo(expected, 2)
  })

  it('warns about a slow delivery', () => {
    const detail = scoreItem(readAloud, { reference: LONG_TEXT }, { transcript: LONG_TEXT, audio: audio({ wordsPerMinute: 70 }) })
    expect(detail.notes.some((note) => /smooth, even rhythm/.test(note))).toBe(true)
  })

  it('warns about a rushed delivery', () => {
    const detail = scoreItem(readAloud, { reference: LONG_TEXT }, { transcript: LONG_TEXT, audio: audio({ wordsPerMinute: 250 }) })
    expect(detail.notes.some((note) => /rushed delivery/.test(note))).toBe(true)
  })

  it('takes two points off for a long pause in a long response', () => {
    const detail = scoreItem(readAloud, { reference: LONG_TEXT }, { transcript: LONG_TEXT, audio: audio({ pauseCount: 3 }) })
    expect(detail.traits?.oralFluency).toBeCloseTo(0.6, 2)
  })

  it('takes one point off for a single pause in a long response', () => {
    const detail = scoreItem(readAloud, { reference: LONG_TEXT }, { transcript: LONG_TEXT, audio: audio({ pauseCount: 2 }) })
    expect(detail.traits?.oralFluency).toBeCloseTo(0.8, 2)
    expect(detail.notes.some((note) => /2 long pauses/.test(note))).toBe(true)
  })

  it('takes one point off when too little of the take is speech', () => {
    const detail = scoreItem(readAloud, { reference: LONG_TEXT }, { transcript: LONG_TEXT, audio: audio({ speechRatio: 0.2 }) })
    expect(detail.traits?.oralFluency).toBeCloseTo(0.8, 2)
  })

  it('does not measure pronunciation from an unreliable recording', () => {
    const detail = scoreItem(readAloud, { reference: LONG_TEXT }, { transcript: LONG_TEXT, audio: audio({ reliable: false }) })
    expect(detail.notes).toContain('Pronunciation was not measured — record the answer to score this trait.')
  })

  it('does not measure pronunciation when the pitch is unknown', () => {
    const detail = scoreItem(readAloud, { reference: LONG_TEXT }, { transcript: LONG_TEXT, audio: audio({ meanPitchHz: null }) })
    expect(detail.traits?.pronunciation).toBeGreaterThan(0)
  })

  it('calls a flat delivery flat', () => {
    const detail = scoreItem(readAloud, { reference: LONG_TEXT }, {
      transcript: LONG_TEXT,
      audio: audio({ energyVariance: 0, speechRatio: 0, meanPitchHz: null }),
    })
    expect(detail.notes).toContain('Delivery was flat, with little variation in volume or pitch.')
  })

  it('reads the target text when the key has no reference', () => {
    const withText = makeItem('read-aloud', { responseKind: 'audio', targetText: LONG_TEXT })
    const detail = scoreItem(withText, {}, { transcript: LONG_TEXT, audio: audio() })
    expect(detail.ratio).toBeGreaterThan(0.8)
  })

  it('finds nothing to compare when there is neither a key nor a target text', () => {
    const detail = scoreItem(readAloud, {}, { transcript: LONG_TEXT, audio: audio() })
    expect(detail.ratio).toBe(0)
  })

  it('says nothing was reproduced when the prompt has no content words', () => {
    const detail = scoreItem(readAloud, { reference: 'the of and' }, { transcript: LONG_TEXT, audio: audio() })
    expect(detail.ratio).toBe(0)
  })

  it('says no content words were produced when the answer has none', () => {
    const detail = scoreItem(readAloud, { reference: 'environment policy' }, { transcript: 'the of and', audio: audio() })
    expect(detail.notes).toContain('No content words from the prompt were produced.')
  })

  it('gates an item whose content scored zero', () => {
    const detail = scoreItem(readAloud, { reference: 'environment policy' }, { transcript: 'nothing relevant here', audio: audio() })
    expect(detail.ratio).toBe(0)
    expect(detail.gated).toBe(true)
    expect(detail.notes.some((note) => /Content scored 0/.test(note))).toBe(true)
  })

  it('scores on delivery alone when the browser could not transcribe', () => {
    const detail = scoreItem(readAloud, { reference: LONG_TEXT }, { audio: audio() })
    expect(detail.ratio).toBeGreaterThan(0)
    expect(detail.gated).toBeUndefined()
    expect(detail.notes.some((note) => /speech recognition/.test(note))).toBe(true)
  })

  it('scores a re-tell lecture against its key terms', () => {
    const retell = makeItem('retell-lecture', { responseKind: 'audio' })
    const detail = scoreItem(retell, { reference: LONG_TEXT, keyTerms: ['committee', 'measurements', 'instrument'] }, {
      transcript: LONG_TEXT,
      audio: audio(),
    })
    expect(detail.ratio).toBeGreaterThan(0.5)
  })

  it('scores a re-tell lecture with no key terms at all', () => {
    const retell = makeItem('retell-lecture', { responseKind: 'audio' })
    const detail = scoreItem(retell, { reference: LONG_TEXT }, { transcript: LONG_TEXT, audio: audio() })
    expect(detail.ratio).toBe(0)
    expect(detail.gated).toBe(true)
  })

  it('scores a re-tell lecture with no words at all on delivery alone', () => {
    const retell = makeItem('retell-lecture', { responseKind: 'audio' })
    const detail = scoreItem(retell, { reference: LONG_TEXT, keyTerms: ['committee'] }, { audio: audio() })
    expect(detail.ratio).toBeGreaterThan(0)
    expect(detail.gated).toBeUndefined()
  })
})

describe('written items', () => {
  const summary = makeItem('summarize-written-text', { responseKind: 'text' })

  it('scores a one-sentence summary that covers the source', () => {
    const detail = scoreItem(summary, { reference: 'Urban trees cool cities.', keyTerms: ['urban', 'trees', 'cities'] }, {
      text: 'The study found that urban trees cool cities.',
    })
    expect(detail.ratio).toBeGreaterThan(0.4)
    expect(detail.gated).toBeUndefined()
  })

  it('gates a summary whose content scored zero', () => {
    const detail = scoreItem(summary, { reference: 'Urban trees cool cities.' }, {
      text: 'This is one complete sentence about the topic.',
    })
    expect(detail.ratio).toBe(0)
    expect(detail.gated).toBe(true)
    expect(detail.notes.some((note) => /Content scored 0/.test(note))).toBe(true)
  })

  it('gates a summary whose form scored zero', () => {
    const detail = scoreItem(summary, { reference: 'Urban trees cool cities.', keyTerms: ['urban', 'trees', 'cities'] }, {
      text: 'urban trees',
    })
    expect(detail.ratio).toBe(0)
    expect(detail.gated).toBe(true)
    expect(detail.notes.some((note) => /Form scored 0/.test(note))).toBe(true)
  })

  it('gates a summary whose content and form both scored zero', () => {
    const detail = scoreItem(summary, { reference: 'Urban trees cool cities.' }, { text: 'short' })
    expect(detail.ratio).toBe(0)
    expect(detail.notes.some((note) => /Content and Form both scored 0/.test(note))).toBe(true)
  })

  it('scores an empty response as zero', () => {
    const detail = scoreItem(summary, { reference: 'Urban trees cool cities.' }, { text: '' })
    expect(detail.ratio).toBe(0)
    expect(detail.notes).toEqual(['No response was written.'])
  })

  it('gives no writing traits to a response with no words in it', () => {
    const detail = scoreItem(summary, { reference: 'Urban trees cool cities.', keyTerms: ['urban'] }, { text: '...' })
    expect(detail.traits?.grammar).toBe(0)
    expect(detail.traits?.vocabulary).toBe(0)
    // The written summary is scored on Content, Form, Grammar and Vocabulary
    // only, so it carries no Spelling trait at all.
    expect(detail.traits?.spelling).toBeUndefined()
    expect(detail.traits?.development).toBe(0)
    expect(detail.traits?.range).toBe(0)
  })

  const essay = makeItem('write-essay', { responseKind: 'text' })

  it('notes the probable spelling errors in the key vocabulary', () => {
    const text = `${LONG_TEXT} ${LONG_TEXT} The enviroment matters, and so does developement and technolgy.`
    const detail = scoreItem(essay, { reference: 'environment', keyTerms: ['environment', 'development', 'technology'] }, { text })
    expect(detail.notes.some((note) => /probable spelling errors/.test(note))).toBe(true)
  })

  it('counts a two-paragraph essay with two linking words', () => {
    const text =
      'However, the effect is real and it does not depend on the season.\n\nMoreover, the same pattern holds in every region that was measured.'
    const detail = scoreItem(essay, { reference: 'effect', keyTerms: ['effect'] }, { text })
    expect(detail.notes.some((note) => /introduction, body paragraphs and a conclusion/.test(note))).toBe(true)
    expect(detail.notes.some((note) => /Very few linking words/.test(note))).toBe(false)
    expect(detail.traits?.development).toBeGreaterThan(0)
  })

  it('gives a written item its published content maximum', () => {
    const detail = scoreItem(essay, { reference: 'effect', keyTerms: ['effect'] }, { text: 'The effect was clear.' })
    expect(detail.contentMax).toBe(6)
  })
})

describe('scale conversion', () => {
  it('maps 0% to the scale floor', () => {
    expect(rawToPteScale(0)).toBe(10)
  })

  it('maps 100% to the scale ceiling', () => {
    expect(rawToPteScale(1)).toBe(90)
  })

  it('clamps a fraction above one', () => {
    expect(rawToPteScale(1.5)).toBe(90)
  })

  it('clamps a fraction below zero', () => {
    expect(rawToPteScale(-1)).toBe(10)
  })

  it.each([
    [90, 'C2'],
    [85, 'C2'],
    [84, 'C1'],
    [76, 'C1'],
    [75, 'B2'],
    [59, 'B2'],
    [58, 'B1'],
    [43, 'B1'],
    [42, 'A2'],
    [30, 'A2'],
    [29, 'A1'],
    [10, 'A1'],
  ])('puts a score of %i in band %s', (score, band) => {
    expect(toCefr(score)).toBe(band)
  })

  it('puts a score below the scale floor in the lowest band', () => {
    expect(toCefr(5)).toBe('A1')
  })

  it('labels every band', () => {
    expect(cefrLabel('C2')).toBe('Exceptional')
    expect(cefrLabel('C1')).toBe('Advanced')
    expect(cefrLabel('B2')).toBe('Upper intermediate')
    expect(cefrLabel('B1')).toBe('Intermediate')
    expect(cefrLabel('A2')).toBe('Elementary')
    expect(cefrLabel('A1')).toBe('Basic')
  })

  it('has no label for a band that does not exist', () => {
    expect(cefrLabel('Z9')).toBe('')
  })

  it('publishes the full band table', () => {
    expect(CEFR_BANDS).toHaveLength(6)
    expect(CEFR_BANDS[0]).toEqual({ min: 85, band: 'C2', label: 'Exceptional' })
  })

  it('names the band above a given one', () => {
    expect(nextBand('B2')).toEqual({ min: 76, band: 'C1' })
    expect(nextBand('A1')).toEqual({ min: 30, band: 'A2' })
  })

  it('has no band above a band that does not exist', () => {
    expect(nextBand('Z9')).toBeNull()
  })

  it('converts a PTE score to IELTS', () => {
    expect(pteToIelts(90)).toBe('9.0')
    expect(pteToIelts(85)).toBe('8.0')
    expect(pteToIelts(70)).toBe('7.0')
    expect(pteToIelts(50)).toBe('6.0')
    expect(pteToIelts(40)).toBe('5.5')
    expect(pteToIelts(24)).toBe('4.5')
  })

  it('has no IELTS band below the scale floor', () => {
    expect(pteToIelts(23)).toBeNull()
  })

  it('publishes the concordance table', () => {
    expect(IELTS_CONCORDANCE).toHaveLength(10)
    expect(IELTS_CONCORDANCE[0]).toEqual({ band: '9.0', min: 90, max: 90 })
  })

  it('publishes the admission targets', () => {
    expect(ADMISSION_TARGETS).toHaveLength(4)
    expect(ADMISSION_TARGETS[0]?.label).toBe('Many UK universities')
  })
})

describe('the sensitivity band around a score', () => {
  it('keeps the shown score inside the band', () => {
    const band = scoreBand(0.5, 52)
    expect(band.mid).toBe(52)
    expect(band.low).toBeLessThanOrEqual(band.mid)
    expect(band.high).toBeGreaterThanOrEqual(band.mid)
  })

  it('spans the two ends the shape exponent allows', () => {
    const band = scoreBand(0.5, 52)
    expect(band.low).toBe(50)
    expect(band.high).toBe(56)
  })

  it('folds a shown score below the band into the band', () => {
    const band = scoreBand(0.5, 10)
    expect(band.low).toBe(10)
    expect(band.mid).toBe(10)
    expect(band.high).toBe(56)
  })

  it('folds a shown score above the band into the band', () => {
    const band = scoreBand(0.5, 90)
    expect(band.low).toBe(50)
    expect(band.mid).toBe(90)
    expect(band.high).toBe(90)
  })
})

describe('the whole-test report', () => {
  const item = makeItem('multiple-choice-single', { id: 'i1', skills: [] })
  const answers: Record<string, AnswerKey> = { i1: { correctChoice: 'Alpha' } }
  const responses: Record<string, ItemResponse> = { i1: { choice: 'Alpha' } }

  it('routes an item with no skills to its primary skill', () => {
    const report = buildReport([item], answers, responses, { i1: { skills: [], type: 'multiple-choice-single', label: 'MCQ' } })
    expect(report.skills.reading).toBe(90)
  })

  it('falls back to the blueprint label when the item has no metadata', () => {
    const report = buildReport([item], answers, responses, {})
    expect(report.breakdown['multiple-choice-single']?.label).toBe('Multiple Choice (Single Answer)')
  })

  it('skips an item with no answer key', () => {
    const report = buildReport([item], {}, responses, {})
    expect(report.details).toHaveLength(0)
    expect(report.overall).toBe(10)
  })

  it('lists the estimated and the automatically scored items', () => {
    const spoken = makeItem('read-aloud', { id: 'i2', responseKind: 'audio' })
    const report = buildReport(
      [item, spoken],
      { ...answers, i2: { reference: LONG_TEXT } },
      { ...responses, i2: { transcript: LONG_TEXT, audio: audio() } },
      {},
    )
    expect(report.autoScoredItemIds).toEqual(['i1'])
    expect(report.estimatedItemIds).toEqual(['i2'])
  })

  it('counts the points a skill could earn', () => {
    const report = buildReport([item], answers, responses, {})
    expect(report.availablePoints).toBe(1)
    expect(report.earnedPoints).toBe(1)
  })

  it('publishes the content maxima of the constructed types', () => {
    expect(CONTENT_MAX['write-essay']).toBe(6)
    expect(CONTENT_MAX['summarize-spoken-text']).toBe(4)
  })
})
