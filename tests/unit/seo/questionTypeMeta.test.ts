import { describe, expect, it } from 'vitest'
import { ALL_QUESTION_TYPES, QUESTION_META, SECTION_META } from '../../../src/domain/blueprint'
import { QUESTION_TYPE_META } from '../../../src/seo/questionTypeMeta'
import { typeSlug } from '../../../src/content/questionTypeDetail'

/* ---------------------------------------------------------------------------
   Metadata for the question-type hub and its spokes.

   Two types share a display label across sections — Multiple Choice (Single
   Answer) and Multiple Choice (Multiple Answers) each appear in Reading and
   in Listening — so the section has to appear in the title, or the two pages
   would compete for the same search. Every spoke also has to carry the
   per-test count and the scoring rule, because that is what a candidate
   actually searches for.
   --------------------------------------------------------------------------- */

const HUB_PATH = '/question-types/'

describe('the question-type hub', () => {
  it('is registered under its own path', () => {
    expect(QUESTION_TYPE_META[HUB_PATH]).toBeDefined()
    expect(QUESTION_TYPE_META[HUB_PATH]!.path).toBe(HUB_PATH)
  })

  it('counts the question types it covers', () => {
    const hub = QUESTION_TYPE_META[HUB_PATH]!
    expect(hub.title).toBe('All 22 PTE Academic Question Types')
    expect(hub.description).toContain('All 22 PTE Academic question types')
    expect(hub.description).toContain('where marks are lost')
    expect(hub.keywords).toContain('PTE question types')
    expect(hub.keywords).toContain('how many question types in PTE')
  })

  it('lists every question type in its structured data', () => {
    const list = QUESTION_TYPE_META[HUB_PATH]!.structuredData?.[0] as {
      '@type': string
      itemListElement: Array<{ name: string; url: string }>
    }
    expect(list['@type']).toBe('ItemList')
    expect(list.itemListElement).toHaveLength(ALL_QUESTION_TYPES.length)
    expect(list.itemListElement.map((e) => e.name)).toEqual(
      ALL_QUESTION_TYPES.map((t) => QUESTION_META[t].label),
    )
  })

  it('carries an FAQ and a breadcrumb', () => {
    const blocks = QUESTION_TYPE_META[HUB_PATH]!.structuredData!
    const types = blocks.map((b) => (b as { '@type': string })['@type'])
    expect(types).toContain('FAQPage')
    expect(types).toContain('BreadcrumbList')
  })
})

describe('a question-type spoke', () => {
  it('is registered for every type in the blueprint', () => {
    for (const type of ALL_QUESTION_TYPES) {
      const path = `/question-types/${typeSlug(type)}/`
      expect(QUESTION_TYPE_META[path], type).toBeDefined()
      expect(QUESTION_TYPE_META[path]!.path, type).toBe(path)
    }
    expect(Object.keys(QUESTION_TYPE_META)).toHaveLength(ALL_QUESTION_TYPES.length + 1)
  })

  it('names the section in the title so same-label pages do not collide', () => {
    const reading = QUESTION_TYPE_META['/question-types/multiple-choice-single/']!
    const listening = QUESTION_TYPE_META['/question-types/listening-multiple-choice-single/']!
    expect(reading.title).toBe('PTE Multiple Choice (Single Answer) — Reading')
    expect(listening.title).toBe('PTE Multiple Choice (Single Answer) — Listening')
    expect(reading.title).not.toBe(listening.title)
  })

  it('states the per-test count and the scoring rule in the description', () => {
    const meta = QUESTION_TYPE_META['/question-types/read-aloud/']!
    expect(meta.description).toContain('Read Aloud is a PTE Speaking & Writing item')
    expect(meta.description).toContain('6–7 per test')
    expect(meta.description).toContain('scored on content and form')
    expect(meta.description).toContain('What it is and how to practise it.')
  })

  it('describes a reading item as a reading item', () => {
    const meta = QUESTION_TYPE_META['/question-types/write-essay/']!
    expect(meta.description).toContain('is a PTE Speaking & Writing item')
    expect(meta.description).toContain('1 per test')
  })

  it('uses the section long title, not the short one', () => {
    for (const type of ALL_QUESTION_TYPES) {
      const path = `/question-types/${typeSlug(type)}/`
      const meta = QUESTION_TYPE_META[path]!
      const section = SECTION_META[QUESTION_META[type].section]
      expect(meta.title, type).toContain(section.longTitle)
      expect(meta.title, type).toContain(QUESTION_META[type].label)
    }
  })

  it('keywords the page around the label and the section', () => {
    const meta = QUESTION_TYPE_META['/question-types/reorder-paragraphs/']!
    expect(meta.keywords).toEqual([
      'PTE Re-order Paragraphs',
      'PTE reading Re-order Paragraphs',
      'what is Re-order Paragraphs PTE',
      'Re-order Paragraphs PTE Academic',
    ])
  })

  it('carries an FAQ and a breadcrumb back to the hub', () => {
    const blocks = QUESTION_TYPE_META['/question-types/write-essay/']!.structuredData!
    const types = blocks.map((b) => (b as { '@type': string })['@type'])
    expect(types).toContain('FAQPage')
    expect(types).toContain('BreadcrumbList')

    const trail = blocks[1] as {
      itemListElement: Array<{ name: string; item: string }>
    }
    expect(trail.itemListElement.map((c) => c.name)).toEqual([
      'Home',
      'PTE question types',
      'Write Essay',
    ])
  })
})
