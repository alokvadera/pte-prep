import { describe, expect, it } from 'vitest'
import { SKILL_OF_SECTION } from '../../../src/content/schema'
import { SECTIONS } from '../../../src/domain/types'
import type { SectionId, Skill } from '../../../src/domain/types'
import type { ContentBank, McqItem, Passage } from '../../../src/content/schema'

/* ---------------------------------------------------------------------------
   The content bank's shape.

   `schema.ts` is almost entirely types: the runtime surface is the
   `SKILL_OF_SECTION` map. The interfaces still matter, though, because the
   bank in `bank.ts` is typed against them, so a change to a field is a
   compile-time break rather than a runtime surprise. The fixtures below are
   therefore built to the published shapes.
   --------------------------------------------------------------------------- */

describe('SKILL_OF_SECTION', () => {
  it('maps every section to the skill it is reported under', () => {
    expect(SKILL_OF_SECTION).toEqual({
      'speaking-writing': 'speaking',
      reading: 'reading',
      listening: 'listening',
    })
  })

  it('covers every section the model defines', () => {
    expect(Object.keys(SKILL_OF_SECTION).sort()).toEqual([...SECTIONS].sort())
  })

  it('gives every section a real skill', () => {
    for (const [section, skill] of Object.entries(SKILL_OF_SECTION)) {
      expect(['reading', 'listening', 'speaking', 'writing'], section).toContain(skill)
    }
  })
})

describe('the content bank shape', () => {
  const dropdown = {
    id: 'd1',
    text: 'The ___ of the study was clear.',
    bank: ['result', 'outcome'],
    answers: ['result'],
  }

  const tableFib = {
    id: 't1',
    context: ['A small table of results.'],
    headers: ['Year', 'Count'],
    rows: [
      ['2024', '10'],
      ['2025', null],
    ],
    answers: ['20'],
  }

  const mcq = (id: string): McqItem => ({
    id,
    question: 'What does the passage say?',
    options: ['One thing', 'Another thing', 'A third thing', 'A fourth thing'],
    correct: ['One thing'],
  })

  const passage: Passage = {
    id: 'p1',
    title: 'Urban heat islands',
    topic: 'Environment',
    level: 'B2',
    paragraphs: ['Cities run hotter than the countryside around them.'],
    keyTerms: ['heat island'],
    readAloud: 'Cities run hotter than the countryside around them.',
    repeatSentences: ['Cities run hotter than the countryside around them.'],
    swt: {
      id: 's1',
      excerptLabel: 'Urban heat',
      excerpt: ['Cities run hotter than the countryside around them.'],
      summary: 'Cities are hotter than the countryside.',
      keyTerms: ['cities', 'hotter'],
      minWords: 5,
    },
    dropdown,
    tableFib,
    mcqSingle: mcq('m1'),
    mcqMultiple: mcq('m2'),
    asq: [
      {
        id: 'a1',
        question: 'Where is the study?',
        options: ['In a city', 'In a lab'],
        correct: 'In a lab',
      },
    ],
  }

  it('holds a passage with every reading sub-item attached', () => {
    expect(passage.level).toBe('B2')
    expect(passage.paragraphs).toHaveLength(1)
    expect(passage.dropdown.answers).toHaveLength(1)
    expect(passage.tableFib.rows[1]![1]).toBeNull()
    expect(passage.mcqSingle.correct).toEqual(['One thing'])
    expect(passage.asq[0]!.correct).toBe('In a lab')
  })

  it('models the whole bank as a set of collections', () => {
    const bank: ContentBank = {
      passages: [passage],
      asq: passage.asq,
      lectures: [],
      conversations: [],
      groupDiscussions: [],
      retell: [],
      listeningFib: [],
      highlightSummary: [],
      listeningMcqSingle: [],
      listeningMcqMulti: [],
      missingWord: [],
      highlightIncorrect: [],
      dictation: [],
      spokenSummary: [],
      groupDiscussionItems: [],
      situations: [],
      charts: [],
      repeatSentences: passage.repeatSentences.map((text, index) => ({
        id: `r${index}`,
        text,
      })),
    }
    expect(bank.passages).toHaveLength(1)
    expect(bank.repeatSentences[0]!.text).toBe(
      'Cities run hotter than the countryside around them.',
    )
  })
})

describe('the section and skill types', () => {
  it('narrow to the values the model allows', () => {
    const section: SectionId = 'listening'
    const skill: Skill = SKILL_OF_SECTION[section]
    expect(section).toBe('listening')
    expect(skill).toBe('listening')
  })
})
