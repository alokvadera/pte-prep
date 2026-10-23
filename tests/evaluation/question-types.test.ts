import { describe, expect, it } from 'vitest'
import { buildFullMock } from '../../src/domain/assemble'
import { QUESTION_META } from '../../src/domain/blueprint'
import { buildReport, scoreItem } from '../../src/domain/scoring'
import type { AnswerKey, Item, ItemResponse, MockTest, QuestionType, Skill } from '../../src/domain/types'

/* ---------------------------------------------------------------------------
   How every one of the 22 question types is evaluated.

   Each type gets a full-credit, a partial-credit and a zero response, and all
   three are scored. The point is not just that the numbers come out right but
   that the shape of the response is the one the UI actually sends: a transcript
   plus acoustic profile for spoken items, a blank array for fill-in-the-blanks,
   an ordered list of block ids for reordering, and so on.
   --------------------------------------------------------------------------- */

const mock: MockTest = buildFullMock(20261011)
const allTypes = Object.keys(QUESTION_META) as QuestionType[]

function findScoredItemAndKey(type: QuestionType): { item: Item; key: AnswerKey } {
  for (const [id, candidate] of Object.entries(mock.items)) {
    if (candidate.type === type && !candidate.warmup) {
      return { item: candidate, key: mock.answers[id]! }
    }
  }
  throw new Error(`Scored item of type ${type} not found in mock`)
}

/** A high-standard acoustic profile, as a strong recording produces. */
const highQualityAudio: ItemResponse['audio'] = {
  durationMs: 8000,
  wordsPerMinute: 135,
  speechRatio: 0.75,
  pauseCount: 0,
  energyVariance: 0.55,
  meanPitchHz: 180,
  reliable: true,
}

/** A mediocre take: slow, hesitant, low energy. */
const partialAudio: ItemResponse['audio'] = {
  durationMs: 9000,
  wordsPerMinute: 105,
  speechRatio: 0.55,
  pauseCount: 2,
  energyVariance: 0.35,
  meanPitchHz: 155,
  reliable: true,
}

function makeEssayText(keyTerms: string[]): string {
  const sentenceWithTerms = keyTerms.join(' and ') + ' are all fundamental aspects of this topic.'
  return [
    'In contemporary society, discussions surrounding this issue have become increasingly prominent across educational, social, and governmental institutions. Advocates strongly argue that addressal yields profound long-term social, environmental, and civic advantages. Consequently, policymakers worldwide have begun reconsidering their historical approaches to balance innovation with sustainable development. In particular, ' + sentenceWithTerms,
    'Furthermore, significant empirical evidence indicates that focused investment accelerates positive community transformation across multiple demographics. When communities prioritize clear regulation and modernization, civic productivity rises while systemic inefficiencies decrease. In contrast, failing to implement coherent strategies inevitably produces compounding challenges that become significantly harder to resolve over time. In addition, thoughtful analysis demonstrates that structural changes create lasting stability.',
    'However, critics often contend that sudden institutional shifts impose immediate transitional costs on existing administrative frameworks. While this concern is understandable, proactive education, practical guidance, and targeted economic incentives can mitigate short-term friction effectively. Moreover, collaboration between public and private sectors provides the necessary resilience to navigate unexpected structural hurdles throughout the implementation phase.',
    'In conclusion, pursuing proactive measures is indispensable for sustainable progress in the modern era. By combining disciplined policy frameworks with educational innovation, societies can safeguard future prosperity while fostering equitable growth for all citizens.',
  ].join('\n\n')
}

interface Scenarios {
  correct: ItemResponse
  partial: ItemResponse | null
  zero: ItemResponse
}

function scenariosFor(type: QuestionType): Scenarios {
  const { item, key } = findScoredItemAndKey(type)

  switch (type) {
    case 'read-aloud': {
      const text = item.targetText ?? key.reference ?? ''
      const words = text.split(' ')
      return {
        correct: { transcript: text, audio: highQualityAudio },
        partial: { transcript: words.slice(0, Math.floor(words.length * 0.6)).join(' '), audio: partialAudio },
        zero: { transcript: 'unrelated banana apple zebra', audio: highQualityAudio },
      }
    }
    case 'repeat-sentence': {
      const text = item.targetText ?? item.audioUtterance ?? key.reference ?? ''
      const words = text.split(' ')
      return {
        correct: { transcript: text, audio: highQualityAudio },
        partial: { transcript: words.slice(0, Math.floor(words.length * 0.5)).join(' '), audio: partialAudio },
        zero: { transcript: 'random completely unrelated words here', audio: highQualityAudio },
      }
    }
    case 'describe-image':
    case 'retell-lecture':
    case 'summarize-group-discussion':
    case 'respond-to-situation': {
      const reference = key.reference ?? ''
      const terms = key.keyTerms ?? []
      return {
        correct: { transcript: reference, audio: highQualityAudio },
        partial: {
          transcript: `The main discussion describes ${terms.slice(0, Math.ceil(terms.length / 2)).join(' ')} with several relevant points.`,
          audio: partialAudio,
        },
        zero: { transcript: 'no relevant points mentioned at all', audio: highQualityAudio },
      }
    }
    case 'answer-short-question': {
      const answer = key.correctChoice
      if (!answer) throw new Error('ASQ answer key is missing correctChoice')
      return { correct: { text: answer }, partial: null, zero: { text: 'completely incorrect answer' } }
    }
    case 'summarize-written-text': {
      const reference = key.reference ?? ''
      const terms = key.keyTerms ?? []
      return {
        correct: { text: reference },
        partial: {
          text: `Although ${terms.slice(0, 3).join(' and ')} are significant factors, comprehensive analysis remains necessary for understanding the issue.`,
        },
        // Two sentences: Form 0, which gates the item to zero.
        zero: { text: 'This is the first sentence here. And here is a second sentence that violates the single sentence rule.' },
      }
    }
    case 'write-essay': {
      const terms = key.keyTerms ?? []
      const partialText = `In contemporary society, discussions surrounding ${terms.slice(0, 3).join(' and ')} have become increasingly prominent across educational, social, and governmental institutions.\n\nAdvocates strongly argue that direct addressal yields profound long-term social, environmental, and civic advantages. Consequently, policymakers worldwide have begun reconsidering their historical approaches to balance innovation with sustainable development. In particular, this topic requires urgent attention from educators and local community leaders alike.\n\nFurthermore, significant empirical evidence indicates that focused investment accelerates positive community transformation across multiple demographics. When communities prioritize clear regulation and modernization, civic productivity rises while systemic inefficiencies decrease. In addition, thoughtful analysis demonstrates that structural changes create lasting stability over the coming decades.\n\nIn conclusion, pursuing proactive measures is indispensable for sustainable progress in the modern era. While implementing these reforms involves transitional effort, the benefits remain undeniable.`
      return {
        correct: { text: makeEssayText(terms) },
        partial: { text: partialText },
        // 50 words: under the 120-word floor, so Form 0 gates it to zero.
        zero: {
          text: 'This topic is very important for modern society. We must consider many different ideas before deciding what to do. Many people agree with this viewpoint, while others disagree. Thank you for reading my essay on this question.',
        },
      }
    }
    case 'fill-in-blanks-dropdown':
    case 'fill-in-blanks-table': {
      const blanks = key.blanks ?? []
      return {
        correct: { blanks: blanks.map((b) => b[0] ?? '') },
        partial: { blanks: blanks.map((b, i) => (i % 2 === 0 ? b[0] ?? '' : 'wrong_distractor')) },
        zero: { blanks: blanks.map(() => 'erroneous_option') },
      }
    }
    case 'multiple-choice-single': {
      return {
        correct: { choice: key.correctChoice },
        partial: null,
        zero: { choice: 'deliberately_wrong_distractor' },
      }
    }
    case 'multiple-choice-multiple': {
      const correct = key.correctChoices ?? []
      const wrongDistractor = (item.options ?? []).find((o) => !correct.includes(o)) ?? 'Wrong Distractor'
      return {
        correct: { choices: correct },
        partial: { choices: [correct[0] ?? ''] },
        // Negative marking: one right plus one wrong cancels out.
        zero: { choices: [correct[0] ?? '', wrongDistractor] },
      }
    }
    case 'reorder-paragraphs': {
      const order = key.order ?? []
      return {
        correct: { order },
        partial: { order: order.length > 2 ? [order[0]!, order[1]!, ...order.slice(2).reverse()] : [...order].reverse() },
        zero: { order: [...order].reverse() },
      }
    }
    case 'summarize-spoken-text': {
      const reference = key.reference ?? ''
      const words = reference.split(' ')
      return {
        correct: { text: reference },
        partial: { text: `${words.slice(0, 44).join(' ')}.` },
        zero: { text: 'The lecture discussed several historical points. This summary is under twenty words.' },
      }
    }
    case 'fill-in-blanks-listening': {
      const blanks = key.blanks ?? []
      return {
        correct: { blanks: blanks.map((b) => b[0] ?? '') },
        partial: { blanks: blanks.map((b, i) => (i === 0 ? b[0] ?? '' : 'misspelled')) },
        zero: { blanks: blanks.map(() => 'erroneous') },
      }
    }
    case 'highlight-correct-summary':
    case 'listening-multiple-choice-single':
    case 'select-missing-word': {
      return {
        correct: { choice: key.correctChoice },
        partial: null,
        zero: { choice: 'wrong_summary_choice' },
      }
    }
    case 'listening-multiple-choice-multiple': {
      const correct = key.correctChoices ?? []
      const wrongDistractor = (item.options ?? []).find((o) => !correct.includes(o)) ?? 'Wrong Option'
      return {
        correct: { choices: correct },
        partial: { choices: [correct[0] ?? ''] },
        zero: { choices: [correct[0] ?? '', wrongDistractor] },
      }
    }
    case 'highlight-incorrect-words': {
      const correctHighlights = key.correctHighlighted ?? [2, 5]
      const wrongToken = [0, 1, 2, 3, 4, 5, 6, 7].find((idx) => !correctHighlights.includes(idx)) ?? 99
      return {
        correct: { highlighted: correctHighlights },
        partial: { highlighted: [correctHighlights[0]!] },
        zero: { highlighted: [correctHighlights[0]!, wrongToken] },
      }
    }
    case 'write-from-dictation': {
      const reference = key.reference ?? ''
      const words = reference.split(' ')
      return {
        correct: { text: reference },
        partial: { text: words.slice(0, Math.ceil(words.length / 2)).join(' ') },
        zero: { text: 'completely incorrect sentence without matching terms' },
      }
    }
  }
}

describe('question type evaluation', () => {
  it('covers all 22 official types', () => {
    expect(allTypes).toHaveLength(22)
  })

  it.each(allTypes)('%s awards full credit for a correct response', (type) => {
    const { item, key } = findScoredItemAndKey(type)
    const meta = QUESTION_META[type]
    const { correct } = scenariosFor(type)

    const score = scoreItem(item, key, correct)

    if (meta.scoring === 'trait-composite') {
      expect(score.ratio).toBeGreaterThanOrEqual(0.75)
    } else {
      expect(score.points).toBe(item.maxPoints)
    }
  })

  it.each(allTypes)('%s awards partial credit for a partial response', (type) => {
    const { item, key } = findScoredItemAndKey(type)
    const { partial } = scenariosFor(type)
    if (!partial) return

    const score = scoreItem(item, key, partial)

    expect(score.points).toBeGreaterThan(0)
    expect(score.points).toBeLessThan(item.maxPoints)
  })

  it.each(allTypes)('%s awards nothing for a wrong response', (type) => {
    const { item, key } = findScoredItemAndKey(type)
    const { zero } = scenariosFor(type)

    const score = scoreItem(item, key, zero)

    expect(score.points).toBeLessThanOrEqual(0.001)
  })

  it('keeps a 135-word essay inside the Form 1 band', () => {
    const { item, key } = findScoredItemAndKey('write-essay')
    const { partial } = scenariosFor('write-essay')
    const wordCount = partial?.text?.trim().split(/\s+/).length ?? 0

    expect(wordCount).toBeGreaterThanOrEqual(120)
    expect(wordCount).toBeLessThanOrEqual(199)
    expect(scoreItem(item, key, partial!).ratio).toBeGreaterThan(0)
  })
})

describe('whole-test report generation', () => {
  const flatItems = mock.sections
    .flatMap((section) => section.itemIds)
    .map((id) => mock.items[id])
    .filter((item): item is Item => item !== undefined && !item.warmup)

  const metaById: Record<string, { skills: Skill[]; type: Item['type']; label: string }> = {}
  for (const item of flatItems) {
    metaById[item.id] = {
      skills: item.skills,
      type: item.type,
      label: QUESTION_META[item.type]?.label ?? item.type,
    }
  }

  function fullResponses(): Record<string, ItemResponse> {
    const responses: Record<string, ItemResponse> = {}
    for (const item of flatItems) {
      const key = mock.answers[item.id]
      if (!key) continue

      if (
        item.type === 'multiple-choice-single' ||
        item.type === 'listening-multiple-choice-single' ||
        item.type === 'highlight-correct-summary' ||
        item.type === 'select-missing-word'
      ) {
        responses[item.id] = { choice: key.correctChoice }
      } else if (item.type === 'multiple-choice-multiple' || item.type === 'listening-multiple-choice-multiple') {
        responses[item.id] = { choices: key.correctChoices }
      } else if (
        item.type === 'fill-in-blanks-dropdown' ||
        item.type === 'fill-in-blanks-table' ||
        item.type === 'fill-in-blanks-listening'
      ) {
        responses[item.id] = { blanks: key.blanks?.map((b) => b[0] ?? '') }
      } else if (item.type === 'reorder-paragraphs') {
        responses[item.id] = { order: key.order }
      } else if (item.type === 'highlight-incorrect-words') {
        responses[item.id] = { highlighted: key.correctHighlighted }
      } else if (
        item.type === 'write-from-dictation' ||
        item.type === 'summarize-written-text' ||
        item.type === 'summarize-spoken-text'
      ) {
        responses[item.id] = { text: key.reference }
      } else if (item.type === 'answer-short-question') {
        responses[item.id] = { text: key.correctChoice ?? '' }
      } else if (item.type === 'write-essay') {
        responses[item.id] = { text: makeEssayText(key.keyTerms ?? []) }
      } else {
        responses[item.id] = {
          transcript: item.targetText ?? key.reference ?? '',
          audio: highQualityAudio,
        }
      }
    }
    return responses
  }

  it('scores an all-correct attempt in the high band', () => {
    const report = buildReport(flatItems, mock.answers, fullResponses(), metaById)

    expect(report.overall).toBeGreaterThanOrEqual(80)
    expect(['C1', 'C2']).toContain(report.cefr)
    expect(report.skills.listening!).toBeGreaterThanOrEqual(75)
    expect(report.skills.reading!).toBeGreaterThanOrEqual(75)
    expect(report.skills.speaking!).toBeGreaterThanOrEqual(75)
    expect(report.skills.writing!).toBeGreaterThanOrEqual(75)
    expect(report.details).toHaveLength(flatItems.length)
    expect(Object.keys(report.breakdown)).toHaveLength(22)
  })

  it('scores a mixed attempt in the intermediate band', () => {
    const full = fullResponses()
    const mid: Record<string, ItemResponse> = {}
    flatItems.forEach((item, index) => {
      if (index % 3 === 0) return
      if (index % 3 === 1) {
        const key = mock.answers[item.id]
        if (key?.blanks) {
          mid[item.id] = { blanks: [key.blanks[0]?.[0] ?? ''] }
        } else if (key?.correctChoices) {
          mid[item.id] = { choices: [key.correctChoices[0] ?? ''] }
        } else if (key?.order) {
          mid[item.id] = {
            order: key.order.length > 2 ? [key.order[0]!, key.order[1]!, ...key.order.slice(2).reverse()] : [...key.order].reverse(),
          }
        } else if (key?.correctHighlighted) {
          mid[item.id] = { highlighted: [key.correctHighlighted[0]!] }
        } else if (item.skills.includes('speaking')) {
          const text = item.targetText ?? key?.reference ?? ''
          const words = text.split(' ')
          mid[item.id] = {
            transcript: words.slice(0, Math.floor(words.length * 0.5)).join(' '),
            audio: partialAudio,
          }
        } else if (key?.reference) {
          mid[item.id] = { text: key.reference.split(' ').slice(0, 5).join(' ') }
        }
        return
      }
      mid[item.id] = full[item.id]!
    })

    const report = buildReport(flatItems, mock.answers, mid, metaById)

    expect(report.overall).toBeGreaterThanOrEqual(45)
    expect(report.overall).toBeLessThanOrEqual(75)
    expect(['B1', 'B2']).toContain(report.cefr)
  })

  it('floors an empty attempt at the scale baseline', () => {
    const report = buildReport(flatItems, mock.answers, {}, metaById)

    expect(report.overall).toBe(10)
    expect(report.cefr).toBe('A1')
    expect(report.earnedPoints).toBe(0)
  })
})
