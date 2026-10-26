import { describe, expect, it } from 'vitest'
import {
  ALL_QUESTION_TYPES,
  MOCK_BLUEPRINT,
  MOCK_TYPE_ORDER,
  NEGATIVE_MARKING_TYPES,
  QUESTION_META,
  SECTION_IDS,
  SECTION_META,
  describeMockPreview,
  primarySkill,
} from '../../../src/domain/blueprint'
import type { QuestionType, SectionId } from '../../../src/domain/types'

/* ---------------------------------------------------------------------------
   The blueprint: the shape of the test itself.

   Every other part of the app reads its rules from here — which types exist,
   which skill each one scores, how many items a mock should hold and how long
   each section is allowed to take. If the blueprint drifts, the assembler and
   the scorer drift with it, so the constants are pinned against the published
   score guide and `describeMockPreview` is checked against the arithmetic it
   claims to perform.
   --------------------------------------------------------------------------- */

const SCORING_MODES = [
  'binary',
  'per-blank',
  'per-word',
  'per-unit-negated',
  'per-adjacent-pair',
  'trait-composite',
] as const

describe('question metadata', () => {
  it('knows the 22 official question types', () => {
    expect(ALL_QUESTION_TYPES).toHaveLength(22)
  })

  it('lists every type exactly once', () => {
    expect(new Set(ALL_QUESTION_TYPES).size).toBe(22)
  })

  it('gives every type a metadata row keyed by its own name', () => {
    expect(ALL_QUESTION_TYPES.every((type) => QUESTION_META[type].type === type)).toBe(true)
  })

  it('scores every type with a declared scoring mode', () => {
    expect(
      ALL_QUESTION_TYPES.every((type) =>
        (SCORING_MODES as readonly string[]).includes(QUESTION_META[type].scoring),
      ),
    ).toBe(true)
  })

  it('gives every type at least one skill', () => {
    expect(ALL_QUESTION_TYPES.every((type) => QUESTION_META[type].skills.length > 0)).toBe(true)
  })

  it('gives every type a section that exists', () => {
    expect(
      ALL_QUESTION_TYPES.every((type) => SECTION_IDS.includes(QUESTION_META[type].section)),
    ).toBe(true)
  })

  it('publishes a count range for every type', () => {
    expect(
      ALL_QUESTION_TYPES.every(
        (type) =>
          QUESTION_META[type].count.min > 0 &&
          QUESTION_META[type].count.max >= QUESTION_META[type].count.min,
      ),
    ).toBe(true)
  })

  it('gives every type a label and a short form', () => {
    expect(
      ALL_QUESTION_TYPES.every(
        (type) => QUESTION_META[type].label.length > 0 && QUESTION_META[type].short.length > 0,
      ),
    ).toBe(true)
  })

  it('gives every type a tip', () => {
    expect(ALL_QUESTION_TYPES.every((type) => QUESTION_META[type].tip.length > 20)).toBe(true)
  })

  it('routes a type to the first of its skills', () => {
    expect(primarySkill('repeat-sentence')).toBe('listening')
    expect(primarySkill('read-aloud')).toBe('speaking')
    expect(primarySkill('write-from-dictation')).toBe('listening')
  })
})

describe('negative marking', () => {
  it('marks exactly the three per-unit-negated types', () => {
    expect(NEGATIVE_MARKING_TYPES).toHaveLength(3)
  })

  it('names them', () => {
    expect([...NEGATIVE_MARKING_TYPES].sort()).toEqual([
      'highlight-incorrect-words',
      'listening-multiple-choice-multiple',
      'multiple-choice-multiple',
    ])
  })

  it('marks nothing else', () => {
    const negated = ALL_QUESTION_TYPES.filter(
      (type) => QUESTION_META[type].scoring === 'per-unit-negated',
    )
    expect([...negated].sort()).toEqual([...NEGATIVE_MARKING_TYPES].sort())
  })
})

describe('section metadata', () => {
  it('knows the three sections of the test', () => {
    expect(SECTION_IDS).toEqual(['speaking-writing', 'reading', 'listening'])
  })

  it('gives every section a metadata row', () => {
    expect(SECTION_IDS.every((id) => SECTION_META[id].id === id)).toBe(true)
  })

  it('gives every section a clock range', () => {
    expect(
      SECTION_IDS.every(
        (id) =>
          SECTION_META[id].minSeconds > 0 &&
          SECTION_META[id].maxSeconds > SECTION_META[id].minSeconds,
      ),
    ).toBe(true)
  })

  it('gives every section a skill and a blurb', () => {
    expect(
      SECTION_IDS.every(
        (id) => SECTION_META[id].skill.length > 0 && SECTION_META[id].blurb.length > 20,
      ),
    ).toBe(true)
  })

  it('puts every type in exactly one section', () => {
    const counts: Record<string, number> = {}
    for (const type of ALL_QUESTION_TYPES)
      counts[QUESTION_META[type].section] = (counts[QUESTION_META[type].section] ?? 0) + 1
    expect(counts['speaking-writing']).toBe(9)
    expect(counts['reading']).toBe(5)
    expect(counts['listening']).toBe(8)
  })
})

describe('mock blueprint', () => {
  it('uses the midpoint of every published range', () => {
    for (const type of ALL_QUESTION_TYPES) {
      const { min, max } = QUESTION_META[type].count
      expect(MOCK_BLUEPRINT[type]).toBe(Math.round((min + max) / 2))
    }
  })

  it('produces the 84-item mock the assembler documents', () => {
    const total = ALL_QUESTION_TYPES.reduce((sum, type) => sum + MOCK_BLUEPRINT[type], 0)
    expect(total).toBe(84)
  })

  it('counts 42 items in Speaking & Writing, 20 in Reading and 22 in Listening', () => {
    const bySection = (section: SectionId) =>
      ALL_QUESTION_TYPES.filter((type) => QUESTION_META[type].section === section).reduce(
        (sum, type) => sum + MOCK_BLUEPRINT[type],
        0,
      )
    expect(bySection('speaking-writing')).toBe(42)
    expect(bySection('reading')).toBe(20)
    expect(bySection('listening')).toBe(22)
  })
})

describe('mock type order', () => {
  it('lists every type exactly once', () => {
    expect(MOCK_TYPE_ORDER).toHaveLength(22)
    expect(new Set(MOCK_TYPE_ORDER).size).toBe(22)
  })

  it('covers the same set of types as the metadata', () => {
    expect([...MOCK_TYPE_ORDER].sort()).toEqual([...ALL_QUESTION_TYPES].sort())
  })

  it('leads with the unscored personal introduction', () => {
    expect(MOCK_TYPE_ORDER[0]).toBe('respond-to-situation')
  })

  it('groups the types by section, in the order the assembler builds them', () => {
    const sections = MOCK_TYPE_ORDER.map((type) => QUESTION_META[type].section)
    expect(sections.indexOf('reading')).toBeGreaterThan(sections.lastIndexOf('speaking-writing'))
    expect(sections.indexOf('listening')).toBeGreaterThan(sections.lastIndexOf('reading'))
  })

  it('puts the reading types in the order the reading builder uses', () => {
    const reading = MOCK_TYPE_ORDER.filter((type) => QUESTION_META[type].section === 'reading')
    expect(reading).toEqual([
      'fill-in-blanks-dropdown',
      'fill-in-blanks-table',
      'multiple-choice-multiple',
      'multiple-choice-single',
      'reorder-paragraphs',
    ])
  })
})

describe('mock preview', () => {
  const full = describeMockPreview(MOCK_BLUEPRINT)

  it('describes a full mock', () => {
    expect(full.sectionIds).toEqual(['speaking-writing', 'reading', 'listening'])
  })

  it('counts every item of a full mock', () => {
    expect(full.scoredCount).toBe(84)
  })

  it('gives a full mock the official 130 minutes', () => {
    // 76 + 23 + 31 minutes of section clock.
    expect(full.totalSeconds).toBe((76 + 23 + 31) * 60)
  })

  it('lists every type of a full mock', () => {
    expect(full.includedTypes).toEqual([...MOCK_TYPE_ORDER])
  })

  it('keeps the personal introduction in the type list even before its items are counted', () => {
    expect(full.includedTypes[0]).toBe('respond-to-situation')
  })

  it('scales the clock with the timing multiplier', () => {
    expect(describeMockPreview(MOCK_BLUEPRINT, { timeScale: 2 }).totalSeconds).toBe(
      full.totalSeconds * 2,
    )
  })

  it('ignores the timing multiplier when the run is untimed', () => {
    expect(describeMockPreview(MOCK_BLUEPRINT, { untimed: true }).totalSeconds).toBe(
      full.totalSeconds,
    )
  })

  it('ignores the timing multiplier entirely when the run is untimed', () => {
    expect(describeMockPreview(MOCK_BLUEPRINT, { untimed: true, timeScale: 2 }).totalSeconds).toBe(
      full.totalSeconds,
    )
  })

  it('restricts a section preview to that section', () => {
    const reading = describeMockPreview(MOCK_BLUEPRINT, { singleSection: 'reading' })
    expect(reading.sectionIds).toEqual(['reading'])
    expect(reading.scoredCount).toBe(20)
    expect(reading.totalSeconds).toBe(23 * 60)
    expect(reading.includedTypes).toEqual([
      'fill-in-blanks-dropdown',
      'fill-in-blanks-table',
      'multiple-choice-multiple',
      'multiple-choice-single',
      'reorder-paragraphs',
    ])
  })

  it('keeps the introduction for a Speaking & Writing preview', () => {
    const speaking = describeMockPreview(MOCK_BLUEPRINT, { singleSection: 'speaking-writing' })
    expect(speaking.includedTypes).toContain('respond-to-situation')
    expect(speaking.scoredCount).toBe(42)
  })

  it('drops the introduction from a Listening preview', () => {
    const listening = describeMockPreview(MOCK_BLUEPRINT, { singleSection: 'listening' })
    expect(listening.includedTypes).not.toContain('respond-to-situation')
    expect(listening.scoredCount).toBe(22)
  })

  it('treats a type that is not counted as absent', () => {
    const preview = describeMockPreview({ 'read-aloud': 3 })
    expect(preview.scoredCount).toBe(3)
    expect(preview.includedTypes).toEqual(['respond-to-situation', 'read-aloud'])
  })

  it('drops a type whose count is zero', () => {
    const preview = describeMockPreview({ 'read-aloud': 0, 'write-essay': 1 })
    expect(preview.includedTypes).toEqual(['respond-to-situation', 'write-essay'])
  })

  it('keeps the introduction even when its own count is zero', () => {
    const preview = describeMockPreview({ 'respond-to-situation': 0 })
    expect(preview.includedTypes).toContain('respond-to-situation')
    expect(preview.scoredCount).toBe(0)
  })

  it('gives a drill a usable floor rather than a fraction of a second', () => {
    const preview = describeMockPreview({ 'read-aloud': 1 }, { singleSection: 'speaking-writing' })
    // One Read Aloud out of 42 blueprint items in the section is far below the
    // 180-second floor the assembler applies.
    expect(preview.totalSeconds).toBe(180)
  })

  it('floors every section of a drill separately', () => {
    const preview = describeMockPreview({ 'read-aloud': 1 })
    expect(preview.totalSeconds).toBe(180 * 3)
  })

  it('halves the clock for a half-length mock', () => {
    const half: Partial<Record<QuestionType, number>> = {}
    for (const type of ALL_QUESTION_TYPES) half[type] = Math.floor(MOCK_BLUEPRINT[type] / 2)
    const preview = describeMockPreview(half)
    const halfSpeaking = half['read-aloud'] ?? 0
    expect(preview.scoredCount).toBe(
      ALL_QUESTION_TYPES.reduce((sum, type) => sum + (half[type] ?? 0), 0),
    )
    expect(halfSpeaking).toBe(3)
    expect(preview.totalSeconds).toBeLessThan(full.totalSeconds)
  })

  it('describes an empty mock without dividing by zero', () => {
    const preview = describeMockPreview({})
    expect(preview.scoredCount).toBe(0)
    expect(preview.includedTypes).toEqual(['respond-to-situation'])
    expect(preview.totalSeconds).toBe(180 * 3)
  })
})
