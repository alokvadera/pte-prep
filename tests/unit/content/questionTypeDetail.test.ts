import { describe, expect, it } from 'vitest'
import { ALL_QUESTION_TYPES, QUESTION_META, SECTION_META } from '../../../src/domain/blueprint'
import {
  ALL_TYPE_SLUGS,
  faqForType,
  HUB_FAQ,
  QUESTION_TYPE_DETAIL,
  relatedTypes,
  typeFromSlug,
  typeSlug,
} from '../../../src/content/questionTypeDetail'
import type { QuestionType } from '../../../src/domain/types'

/* ---------------------------------------------------------------------------
   Editorial content for the per-question-type pages.

   This module owns the prose the blueprint cannot express: what the item
   asks, how the marks are allocated and where candidates lose them. The
   routes depend on `typeSlug`/`typeFromSlug` agreeing with each other, and
   the spokes depend on `relatedTypes` always returning real neighbours, so
   those are the invariants worth asserting.
   --------------------------------------------------------------------------- */

describe('QUESTION_TYPE_DETAIL', () => {
  it('has an entry for every question type in the blueprint', () => {
    expect(Object.keys(QUESTION_TYPE_DETAIL).sort()).toEqual([...ALL_QUESTION_TYPES].sort())
  })

  it('gives every entry the three prose blocks the page renders', () => {
    for (const [type, detail] of Object.entries(QUESTION_TYPE_DETAIL)) {
      expect(detail.what, type).toBeTypeOf('string')
      expect(detail.what.trim(), type).not.toBe('')
      expect(detail.how, type).toBeTypeOf('string')
      expect(detail.how.trim(), type).not.toBe('')
      expect(detail.scoring, type).toBeTypeOf('string')
      expect(detail.scoring.trim(), type).not.toBe('')
    }
  })

  it('lists three ordered failure modes for every type', () => {
    for (const [type, detail] of Object.entries(QUESTION_TYPE_DETAIL)) {
      expect(detail.mistakes, type).toHaveLength(3)
      for (const mistake of detail.mistakes) {
        expect(mistake.trim(), type).not.toBe('')
        expect(mistake.length, type).toBeGreaterThan(20)
      }
    }
  })

  it('describes the item in its own words', () => {
    expect(QUESTION_TYPE_DETAIL['read-aloud']!.what).toContain('read the text aloud')
    expect(QUESTION_TYPE_DETAIL['write-essay']!.what).toContain('200 to 300 words')
    expect(QUESTION_TYPE_DETAIL['reorder-paragraphs']!.scoring).toContain('adjacent pair')
  })
})

describe('typeSlug', () => {
  it('is the kebab-case key of the type', () => {
    expect(typeSlug('read-aloud')).toBe('read-aloud')
    expect(typeSlug('summarize-group-discussion')).toBe('summarize-group-discussion')
  })

  it('is URL safe', () => {
    for (const type of ALL_QUESTION_TYPES) {
      expect(typeSlug(type)).toMatch(/^[a-z0-9-]+$/)
    }
  })
})

describe('typeFromSlug', () => {
  it('resolves a slug back to its type', () => {
    expect(typeFromSlug('read-aloud')).toBe('read-aloud')
    expect(typeFromSlug('write-from-dictation')).toBe('write-from-dictation')
  })

  it('round-trips for every question type', () => {
    for (const type of ALL_QUESTION_TYPES) {
      expect(typeFromSlug(typeSlug(type)), type).toBe(type)
    }
  })

  it('returns undefined for an unknown slug', () => {
    expect(typeFromSlug('not-a-type')).toBeUndefined()
    expect(typeFromSlug('')).toBeUndefined()
  })
})

describe('ALL_TYPE_SLUGS', () => {
  it('lists one slug per question type, in blueprint order', () => {
    expect(ALL_TYPE_SLUGS).toHaveLength(ALL_QUESTION_TYPES.length)
    expect(ALL_TYPE_SLUGS).toEqual(ALL_QUESTION_TYPES.map(typeSlug))
  })
})

describe('relatedTypes', () => {
  it('returns neighbours from the same section', () => {
    const related = relatedTypes('reorder-paragraphs')
    expect(related.length).toBeGreaterThan(0)
    for (const type of related) {
      expect(QUESTION_META[type].section).toBe('reading')
    }
  })

  it('never returns the type itself', () => {
    for (const type of ALL_QUESTION_TYPES) {
      expect(relatedTypes(type, 99), type).not.toContain(type)
    }
  })

  it('only returns real question types', () => {
    const known = new Set<string>(ALL_QUESTION_TYPES)
    for (const type of ALL_QUESTION_TYPES) {
      for (const related of relatedTypes(type, 99)) {
        expect(known.has(related), related).toBe(true)
      }
    }
  })

  it('returns at most four neighbours by default', () => {
    expect(relatedTypes('read-aloud')).toHaveLength(4)
  })

  it('honours an explicit limit', () => {
    expect(relatedTypes('read-aloud', 1)).toHaveLength(1)
    expect(relatedTypes('read-aloud', 2)).toHaveLength(2)
    expect(relatedTypes('read-aloud', 0)).toHaveLength(0)
  })

  it('returns every same-section neighbour when the limit is generous', () => {
    const section = QUESTION_META['read-aloud'].section
    const sameSection = ALL_QUESTION_TYPES.filter(
      (t) => QUESTION_META[t].section === section && t !== 'read-aloud',
    )
    expect(relatedTypes('read-aloud', 99)).toHaveLength(sameSection.length)
    expect(sameSection.length).toBe(8)
  })
})

describe('faqForType', () => {
  it('answers the three questions a candidate arrives with', () => {
    const faq = faqForType('read-aloud')
    expect(faq).toHaveLength(3)
    expect(faq[0]!.question).toBe('How many Read Aloud questions are on the PTE Academic?')
    expect(faq[1]!.question).toBe('How is Read Aloud scored?')
    expect(faq[2]!.question).toBe('What goes wrong most often on Read Aloud?')
  })

  it('states the per-test count and the section', () => {
    const faq = faqForType('read-aloud')
    expect(faq[0]!.answer).toBe(
      'A PTE Academic has 6–7 Read Aloud items in the Speaking & Writing section. Each one counts towards your Speaking score.',
    )
  })

  it('calls an integrated item out as scoring two skills', () => {
    const faq = faqForType('retell-lecture')
    expect(faq[0]!.answer).toContain('integrated item')
    expect(faq[0]!.answer).toContain('Listening and Speaking scores')
  })

  it('quotes the scoring rule and the first failure mode verbatim', () => {
    const type: QuestionType = 'write-essay'
    const faq = faqForType(type)
    expect(faq[1]!.answer).toBe(QUESTION_TYPE_DETAIL[type].scoring)
    expect(faq[2]!.answer).toBe(QUESTION_TYPE_DETAIL[type].mistakes[0]!)
  })

  it('produces a non-empty FAQ for every question type', () => {
    for (const type of ALL_QUESTION_TYPES) {
      const faq = faqForType(type)
      expect(faq, type).toHaveLength(3)
      for (const entry of faq) {
        expect(entry.question.trim(), type).not.toBe('')
        expect(entry.answer.trim(), type).not.toBe('')
      }
    }
  })
})

describe('HUB_FAQ', () => {
  it('counts the types per section from the blueprint', () => {
    expect(HUB_FAQ[0]!.question).toBe('How many question types are in the PTE Academic?')
    expect(HUB_FAQ[0]!.answer).toBe(
      'There are 22 question types: 9 in Speaking & Writing, 5 in Reading, 8 in Listening. Some are integrated items that score two skills at once.',
    )
  })

  it('names the three types that carry negative marking', () => {
    const answer = HUB_FAQ[1]!.answer
    expect(HUB_FAQ[1]!.question).toBe('Which PTE question types have negative marking?')
    expect(answer).toContain('Only three')
    expect(answer).toContain('Multiple Choice (Multiple Answers) in Reading')
    expect(answer).toContain('Multiple Choice (Multiple Answers) in Listening')
    expect(answer).toContain('Highlight Incorrect Words')
  })

  it('lists the integrated types', () => {
    const answer = HUB_FAQ[2]!.answer
    expect(HUB_FAQ[2]!.question).toBe('Do any PTE question types score two skills at once?')
    expect(answer).toContain('Repeat Sentence')
    expect(answer).toContain('Summarize Spoken Text')
    expect(answer).toContain('Write from Dictation')
  })

  it('agrees with the blueprint on the section split', () => {
    for (const section of ['speaking-writing', 'reading', 'listening'] as const) {
      const count = ALL_QUESTION_TYPES.filter((t) => QUESTION_META[t].section === section).length
      expect(HUB_FAQ[0]!.answer).toContain(`${count} in ${SECTION_META[section].longTitle}`)
    }
  })
})
