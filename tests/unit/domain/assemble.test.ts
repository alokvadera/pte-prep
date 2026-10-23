import { describe, expect, it, vi } from 'vitest'
import { buildDrillMock, buildFullMock, buildMock, buildSectionMock } from '../../../src/domain/assemble'
import { MOCK_BLUEPRINT } from '../../../src/domain/blueprint'
import { BANK, PASSAGES } from '../../../src/content/bank'
import type { ChartSpec } from '../../../src/content/schema'
import type { ItemGroup, QuestionType } from '../../../src/domain/types'

/* ---------------------------------------------------------------------------
   The assembler.

   A mock is a machine with a lot of moving parts: three sections, 22 item
   types, groups that share a stimulus, answer keys that have to match the
   items they belong to, and per-item clocks that have to fit the official
   timing.

   This file covers the parts of that machine the other suites do not reach —
   the options a candidate can set on a session, and the paths through the
   builders that only a degenerate content bank can open.
   --------------------------------------------------------------------------- */

function groupsOf(mock: { sections: { groups: ItemGroup[] }[] }, section: string): ItemGroup[] {
  return mock.sections.flatMap((s) => s.groups).filter((g) => g.section === section)
}

describe('session options', () => {
  const base = {
    seed: 4242,
    kind: 'full' as const,
    sections: ['reading' as const],
    counts: { ...MOCK_BLUEPRINT },
  }

  it('uses the default title when none is given', () => {
    expect(buildMock(base).title).toBe('Full Mock Test')
  })

  it('uses the given title when one is given', () => {
    expect(buildMock({ ...base, title: 'My Mock' }).title).toBe('My Mock')
  })

  it('falls back to the blueprint when no counts are given', () => {
    const mock = buildMock({ seed: 1, kind: 'full', sections: ['reading'] })
    expect(mock.sections[0]?.itemIds.length).toBeGreaterThan(0)
  })

  it('keeps the clock when the run is untimed', () => {
    const timed = buildMock({ ...base, timeScale: 2 })
    const untimed = buildMock({ ...base, timeScale: 2, untimed: true })
    expect(untimed.sections[0]?.seconds).toBeLessThan(timed.sections[0]?.seconds ?? 0)
  })

  it('marks an untimed mock as untimed', () => {
    expect(buildMock({ ...base, untimed: true }).untimed).toBe(true)
  })

  it('leaves a timed mock without the untimed flag', () => {
    expect(buildMock(base).untimed).toBeUndefined()
  })

  it('marks a forward-only mock', () => {
    expect(buildMock({ ...base, forwardOnly: true }).forwardOnly).toBe(true)
  })

  it('leaves a normal mock without the forward-only flag', () => {
    expect(buildMock(base).forwardOnly).toBeUndefined()
  })

  it('scales the clock with the timing multiplier', () => {
    const normal = buildMock({ ...base, timeScale: 1 })
    const doubled = buildMock({ ...base, timeScale: 2 })
    expect(doubled.sections[0]?.seconds).toBe((normal.sections[0]?.seconds ?? 0) * 2)
  })
})

describe('a drill of one type', () => {
  it('drops the unscored personal introduction from a Respond to a Situation drill', () => {
    const drill = buildDrillMock(11, ['respond-to-situation'], 2)
    const ids = drill.sections.flatMap((section) => section.itemIds)
    expect(ids).not.toContain('respond-to-situation:intro')
  })

  it('still keeps the scored Respond to a Situation items', () => {
    const drill = buildDrillMock(11, ['respond-to-situation'], 2)
    const ids = drill.sections.flatMap((section) => section.itemIds)
    expect(ids.some((id) => id.startsWith('respond-to-situation:') && id !== 'respond-to-situation:intro')).toBe(true)
  })

  it('returns the built mock when the drill contains nothing at all', () => {
    const drill = buildDrillMock(11, ['read-aloud'], 0)
    expect(drill.sections.flatMap((section) => section.itemIds)).toHaveLength(0)
    expect(drill.sections.every((section) => section.itemIds.length === 0)).toBe(true)
  })

  it('keeps only the sections that hold an item', () => {
    const drill = buildDrillMock(11, ['reorder-paragraphs'], 2)
    expect(drill.sections).toHaveLength(1)
    expect(drill.sections[0]?.id).toBe('reading')
  })
})

/* ---------------------------------------------------------------------------
   Degenerate content.

   The builders are written to survive a content bank that is not quite
   right: a chart of a kind the app does not label, an essay that points at a
   passage which is not in the bank, a multiple-choice item whose key has no
   right answer, a clip whose turn does not exist. Each of those is a build
   error rather than a broken item, and each has a defined fallback.

   The bank is mocked for these cases, one array at a time, so that the rest
   of the content stays real.
   --------------------------------------------------------------------------- */

type BankModule = typeof import('../../../src/content/bank')
type AssembleModule = typeof import('../../../src/domain/assemble')

/** Rebuild the assembler against a patched content bank. */
async function assembleWithBank(patch: (actual: BankModule) => Partial<BankModule>): Promise<AssembleModule> {
  vi.resetModules()
  vi.doMock('../../../src/content/bank', async (importOriginal) => {
    const actual = await importOriginal<BankModule>()
    return { ...actual, ...patch(actual) }
  })
  try {
    return await import('../../../src/domain/assemble')
  } finally {
    vi.doUnmock('../../../src/content/bank')
    vi.resetModules()
  }
}

describe('a chart of a kind the app does not label', () => {
  const chart = {
    id: 'chart-unlabelled',
    title: 'A mystery',
    kind: 'heatmap' as unknown as ChartSpec['kind'],
    caption: 'A caption that describes the picture.',
    prompt: 'Describe the information.',
    keyTerms: ['mystery'],
    minWords: 20,
    data: {},
  }

  async function build() {
    const { buildSectionMock: build } = await assembleWithBank((actual) => ({
      BANK: { ...actual.BANK, charts: [chart] },
    }))
    return build(3, 'speaking-writing', { 'describe-image': 1 })
  }

  it('names the picture generically in the prompt', async () => {
    const mock = await build()
    const item = mock.items['describe-image:chart-unlabelled']
    expect(item?.prompt).toContain('the chart below')
  })

  it('names the picture generically in the accessible label', async () => {
    const mock = await build()
    const group = groupsOf(mock, 'speaking-writing').find((g) => g.type === 'describe-image')
    expect(group?.stimulus.imageAlt).toBe('Chart: A mystery.')
  })
})

describe('an essay that points at a passage which is not in the bank', () => {
  it('builds the essay without a passage to show', async () => {
    const { buildSectionMock: build } = await assembleWithBank(() => ({
      ESSAY_PROMPTS: [
        {
          id: 'we-orphan',
          source: 'passage' as const,
          stimulus: 'page-not-in-the-bank',
          question: 'Discuss the position set out in the prompt.',
          keyTerms: ['position', 'prompt'],
          minWords: 200,
          maxWords: 300,
        },
      ],
    }))
    const mock = build(3, 'speaking-writing', { 'write-essay': 1 })
    const group = groupsOf(mock, 'speaking-writing').find((g) => g.type === 'write-essay')
    expect(group?.stimulus.passageId).toBeUndefined()
    expect(group?.stimulus.passageParagraphs).toBeUndefined()
  })
})

describe('a reading multiple-choice item whose key has no right answer', () => {
  async function build(options: string[]) {
    const { buildSectionMock: build } = await assembleWithBank((actual) => ({
      PASSAGES: actual.PASSAGES.map((passage) => ({
        ...passage,
        mcqSingle: { ...passage.mcqSingle, correct: [], options },
      })),
    }))
    return build(5, 'reading', { 'multiple-choice-single': 1 })
  }

  it('falls back to the first option', async () => {
    const mock = await build(['First option', 'Second option'])
    const item = Object.values(mock.items).find((entry) => entry.type === 'multiple-choice-single')
    expect(mock.answers[item?.id ?? '']?.correctChoice).toBe('First option')
  })

  it('falls back to an empty answer when there are no options either', async () => {
    const mock = await build([])
    const item = Object.values(mock.items).find((entry) => entry.type === 'multiple-choice-single')
    expect(mock.answers[item?.id ?? '']?.correctChoice).toBe('')
  })
})

describe('a listening multiple-choice item whose key has no right answer', () => {
  async function build(options: string[]) {
    const { buildSectionMock: build } = await assembleWithBank((actual) => ({
      BANK: {
        ...actual.BANK,
        listeningMcqSingle: [
          {
            ...actual.BANK.listeningMcqSingle[0]!,
            correct: [],
            options,
          },
        ],
      },
    }))
    return build(5, 'listening', { 'listening-multiple-choice-single': 1 })
  }

  it('falls back to the first option', async () => {
    const mock = await build(['First option', 'Second option'])
    const item = Object.values(mock.items).find((entry) => entry.type === 'listening-multiple-choice-single')
    expect(mock.answers[item?.id ?? '']?.correctChoice).toBe('First option')
  })

  it('falls back to an empty answer when there are no options either', async () => {
    const mock = await build([])
    const item = Object.values(mock.items).find((entry) => entry.type === 'listening-multiple-choice-single')
    expect(mock.answers[item?.id ?? '']?.correctChoice).toBe('')
  })
})

describe('a missing-word item whose turn does not exist', () => {
  it('is left out of the mock rather than built with no clip', async () => {
    const { buildSectionMock: build } = await assembleWithBank((actual) => ({
      BANK: {
        ...actual.BANK,
        missingWord: [{ ...actual.BANK.missingWord[0]!, turnIndex: 999 }],
      },
    }))
    const mock = build(5, 'listening', { 'select-missing-word': 1 })
    expect(Object.values(mock.items).some((entry) => entry.type === 'select-missing-word')).toBe(false)
  })

  it('keeps the rest of the listening section', async () => {
    const { buildSectionMock: build } = await assembleWithBank((actual) => ({
      BANK: {
        ...actual.BANK,
        missingWord: [{ ...actual.BANK.missingWord[0]!, turnIndex: 999 }],
      },
    }))
    const mock = build(5, 'listening', { 'select-missing-word': 1, 'write-from-dictation': 1 })
    expect(Object.values(mock.items).some((entry) => entry.type === 'write-from-dictation')).toBe(true)
  })
})

describe('a listening blanks item with more gaps than answers', () => {
  it('marks the unanswered gap in the reference answer', async () => {
    const { buildSectionMock: build } = await assembleWithBank((actual) => ({
      BANK: {
        ...actual.BANK,
        listeningFib: [
          {
            ...actual.BANK.listeningFib[0]!,
            text: 'The quick ______ fox jumps over the ______ dog.',
            answers: [['quick']],
          },
        ],
      },
    }))
    const mock = build(5, 'listening', { 'fill-in-blanks-listening': 1 })
    const item = Object.values(mock.items).find((entry) => entry.type === 'fill-in-blanks-listening')
    expect(mock.answers[item?.id ?? '']?.reference).toContain('___')
  })
})

describe('a content bank with no passages at all', () => {
  it('builds a reading section with nothing in it', async () => {
    const { buildSectionMock: build } = await assembleWithBank((actual) => ({
      PASSAGES: [],
      BANK: { ...actual.BANK },
    }))
    const mock = build(5, 'reading', { ...MOCK_BLUEPRINT })
    expect(mock.sections[0]?.itemIds).toHaveLength(0)
  })

  it('leaves the other sections alone', async () => {
    const { buildSectionMock: build } = await assembleWithBank((actual) => ({
      PASSAGES: [],
      BANK: { ...actual.BANK },
    }))
    const mock = build(5, 'listening', { ...MOCK_BLUEPRINT })
    expect(mock.sections[0]?.itemIds.length).toBeGreaterThan(0)
  })
})

describe('the assembled mock as a whole', () => {
  const mock = buildFullMock(31337)

  it('gives every item a group that holds it', () => {
    const held = new Set(mock.sections.flatMap((section) => section.groups.flatMap((group) => group.itemIds)))
    expect(Object.keys(mock.items).every((id) => held.has(id))).toBe(true)
  })

  it('gives every group a skills list from the blueprint', () => {
    expect(mock.sections.flatMap((s) => s.groups).every((g) => g.skills.length > 0)).toBe(true)
  })

  it('numbers the groups of a section from zero', () => {
    for (const section of mock.sections) {
      expect(section.groups.map((g) => g.order)).toEqual(section.groups.map((_, index) => index))
    }
  })

  it('gives every item of a section the section it belongs to', () => {
    for (const section of mock.sections) {
      expect(section.itemIds.every((id) => mock.items[id]?.section === section.id)).toBe(true)
    }
  })

  it('adds up the section clocks into the total', () => {
    expect(mock.totalSeconds).toBe(mock.sections.reduce((sum, section) => sum + section.seconds, 0))
  })

  it('adds up the item maxima into the total', () => {
    expect(mock.totalPoints).toBe(Object.values(mock.items).reduce((sum, item) => sum + item.maxPoints, 0))
  })

  it('gives every item an answer key', () => {
    expect(Object.keys(mock.items).every((id) => Boolean(mock.answers[id]))).toBe(true)
  })

  it('builds the same mock from the same seed', () => {
    const again = buildFullMock(31337)
    expect(again.sections.map((s) => s.itemIds.join('|')).join('||')).toBe(
      mock.sections.map((s) => s.itemIds.join('|')).join('||'),
    )
  })

  it('keeps the bank it drew from', () => {
    expect(BANK.charts.length).toBeGreaterThan(0)
    expect(PASSAGES.length).toBeGreaterThan(0)
  })
})

describe('a section mock', () => {
  it('holds only the section it was asked for', () => {
    const mock = buildSectionMock(9, 'reading', { ...MOCK_BLUEPRINT })
    expect(mock.sections).toHaveLength(1)
    expect(mock.sections[0]?.id).toBe('reading')
  })

  it('is titled after the section', () => {
    expect(buildSectionMock(9, 'reading', { ...MOCK_BLUEPRINT }).title).toBe('Reading Practice')
  })

  it('can be run forward only', () => {
    expect(buildSectionMock(9, 'reading', { ...MOCK_BLUEPRINT }, { forwardOnly: true }).forwardOnly).toBe(true)
  })

  it('can be run untimed', () => {
    expect(buildSectionMock(9, 'reading', { ...MOCK_BLUEPRINT }, { untimed: true }).untimed).toBe(true)
  })

  it('scales its clock with the timing multiplier', () => {
    const normal = buildSectionMock(9, 'reading', { ...MOCK_BLUEPRINT })
    const doubled = buildSectionMock(9, 'reading', { ...MOCK_BLUEPRINT }, { timeScale: 2 })
    expect(doubled.sections[0]?.seconds).toBe((normal.sections[0]?.seconds ?? 0) * 2)
  })
})

describe('the types a drill can focus on', () => {
  const types: QuestionType[] = ['read-aloud', 'reorder-paragraphs', 'write-from-dictation']

  it('gives every focused type its own items', () => {
    const drill = buildDrillMock(21, types, 2)
    const built = new Set(Object.values(drill.items).map((item) => item.type))
    expect(types.every((type) => built.has(type))).toBe(true)
  })

  it('never mixes in a type that was not asked for', () => {
    const drill = buildDrillMock(21, types, 2)
    const built = new Set(Object.values(drill.items).map((item) => item.type))
    expect([...built].every((type) => types.includes(type))).toBe(true)
  })

  it('names a single-type drill', () => {
    expect(buildDrillMock(21, ['read-aloud'], 2).title).toBe('Single Skill Practice')
  })

  it('names a multi-type drill', () => {
    expect(buildDrillMock(21, types, 2).title).toBe('Focused Practice')
  })
})
