import { describe, expect, it } from 'vitest'
import { buildDrillMock, buildFullMock, buildSectionMock } from '../../src/domain/assemble'
import { ALL_QUESTION_TYPES, MOCK_BLUEPRINT, QUESTION_META } from '../../src/domain/blueprint'
import { BANK } from '../../src/content/bank'
import type { Item, QuestionType } from '../../src/domain/types'

/* ---------------------------------------------------------------------------
   How a mock is put together.

   A mock is a machine with a lot of moving parts: three sections, 22 item
   types, groups that share a stimulus, answer keys that have to match the
   items they belong to, and per-item clocks that have to fit the official
   timing. These checks are about the assembly being internally consistent.
   --------------------------------------------------------------------------- */

const mock = buildFullMock(12345)
const allItems = mock.sections
  .flatMap((section) => section.itemIds)
  .map((id) => mock.items[id]!)
  .filter(Boolean)
const scored = allItems.filter((item) => item.maxPoints > 0)

const typeCounts: Record<string, number> = {}
for (const item of scored) typeCounts[item.type] = (typeCounts[item.type] ?? 0) + 1

describe('full mock assembly', () => {
  it('has all three sections', () => {
    expect(mock.sections).toHaveLength(3)
  })

  it('gives every scored item an answer key', () => {
    expect(scored.every((item) => mock.answers[item.id])).toBe(true)
  })

  it('points every item at a real group', () => {
    expect(
      allItems.every((item) => mock.sections.some((section) => section.groups.some((group) => group.id === item.groupId))),
    ).toBe(true)
  })

  it('orders the sections the way the real test does', () => {
    expect(mock.sections.map((section) => section.id).join(',')).toBe('speaking-writing,reading,listening')
  })

  it('includes an unscored warm-up', () => {
    expect(allItems.some((item) => item.warmup && item.maxPoints === 0)).toBe(true)
  })

  it('draws on all 22 item types', () => {
    const missing = ALL_QUESTION_TYPES.filter((type) => !typeCounts[type])
    expect(missing).toEqual([])
  })
})

describe('mock length and clock', () => {
  // A short mock used to keep the full official clock: section time was scaled
  // against the mock's own item count, so the ratio was always 1 and choosing
  // "Half mock" only removed questions from the same two hours.
  const halfCounts = Object.fromEntries(
    ALL_QUESTION_TYPES.map((type) => [type, Math.max(1, Math.round(MOCK_BLUEPRINT[type] / 2))]),
  ) as Record<QuestionType, number>
  const half = buildFullMock(12345, { counts: halfCounts })

  const halfScored = half.sections
    .flatMap((section) => section.itemIds)
    .filter((id) => (half.items[id]?.maxPoints ?? 0) > 0).length
  const fullScored = mock.sections
    .flatMap((section) => section.itemIds)
    .filter((id) => (mock.items[id]?.maxPoints ?? 0) > 0).length

  it('gives a half mock about half the scored items', () => {
    expect(halfScored).toBeLessThanOrEqual(Math.ceil(fullScored * 0.65))
  })

  it('runs a half mock shorter than a full one', () => {
    expect(half.totalSeconds).toBeLessThan(mock.totalSeconds * 0.7)
  })

  it('keeps a usable clock on every section of a half mock', () => {
    expect(half.sections.every((section) => section.seconds >= 180)).toBe(true)
  })

  it('never exceeds the official clock', () => {
    expect(mock.sections.every((section) => section.seconds <= 96 * 60)).toBe(true)
  })
})

describe('drill integrity', () => {
  // A single-skill drill used to build all three sections and then filter groups
  // by their nominal type. Because one reading group holds the table and both
  // multiple choice items together, a drill focused on either multiple choice
  // type produced a test with no questions at all.
  const drillTypes = [
    'read-aloud',
    'describe-image',
    'summarize-written-text',
    'write-essay',
    'fill-in-blanks-dropdown',
    'fill-in-blanks-table',
    'multiple-choice-single',
    'multiple-choice-multiple',
    'reorder-paragraphs',
    'select-missing-word',
    'fill-in-blanks-listening',
    'summarize-spoken-text',
  ] as const

  it('produces questions for every drill type', () => {
    const noItems = drillTypes.filter(
      (type) => buildDrillMock(20240917, [type]).sections.flatMap((section) => section.itemIds).length === 0,
    )
    expect(noItems).toEqual([])
  })

  it('never leaves a drill section empty', () => {
    const emptySections = drillTypes.filter((type) =>
      buildDrillMock(20240917, [type]).sections.some((section) => section.itemIds.length === 0),
    )
    expect(emptySections).toEqual([])
  })

  // Filtering groups used to leave the rest of the assembled mock behind, so a
  // two-item drill reported every point in the bank and persisted all 84 items.
  const drill = buildDrillMock(7, ['reorder-paragraphs'], 2)
  const drillIds = drill.sections.flatMap((section) => section.itemIds)

  it('keeps only the items it includes', () => {
    expect(Object.keys(drill.items)).toHaveLength(drillIds.length)
  })

  it('keeps only the answers it includes', () => {
    expect(Object.keys(drill.answers)).toHaveLength(drillIds.length)
  })

  it('totals only the points it includes', () => {
    expect(drill.totalPoints).toBe(drillIds.reduce((sum, id) => sum + (drill.items[id]?.maxPoints ?? 0), 0))
  })

  it('totals only the seconds it includes', () => {
    expect(drill.totalSeconds).toBe(drill.sections.reduce((sum, section) => sum + section.seconds, 0))
  })
})

describe('stimulus integrity', () => {
  // A dropdown group is the exception: its own gapped text is the passage, so
  // attaching the intact paragraphs would print every answer beside its blank.
  it('gives reading groups a passage unless they are reorder or dropdown items', () => {
    expect(
      mock.sections
        .filter((section) => section.id === 'reading')
        .every((section) =>
          section.groups.every(
            (group) =>
              group.type === 'reorder-paragraphs' ||
              group.type === 'fill-in-blanks-dropdown' ||
              Boolean(group.stimulus.passageParagraphs?.length),
          ),
        ),
    ).toBe(true)
  })

  it('never exposes the intact passage on a dropdown group', () => {
    expect(
      mock.sections
        .filter((section) => section.id === 'reading')
        .flatMap((section) => section.groups)
        .filter((group) => group.type === 'fill-in-blanks-dropdown')
        .every((group) => !group.stimulus.passageParagraphs?.length),
    ).toBe(true)
  })

  it('puts more than one item in at least one passage group', () => {
    const reading = mock.sections.find((section) => section.id === 'reading')!
    expect(reading.groups.some((group) => group.itemIds.length > 1)).toBe(true)
  })

  it('includes at least 20 reading items', () => {
    expect(scored.filter((item) => item.section === 'reading').length).toBeGreaterThanOrEqual(20)
  })

  it('gives dropdown items a word bank at least as large as the blanks', () => {
    expect(
      scored
        .filter((item) => item.type === 'fill-in-blanks-dropdown')
        .every((item) => (item.options?.length ?? 0) >= (item.targetText?.split(/______/).length ?? 0) - 1),
    ).toBe(true)
  })

  it('keeps every correct dropdown answer inside the word bank', () => {
    expect(
      scored.filter((item) => item.type === 'fill-in-blanks-dropdown').every((item) => {
        const answers = (mock.answers[item.id]?.blanks ?? []).map((answer) => answer[0] ?? '')
        return (
          answers.length === (item.targetText?.split(/______/).length ?? 0) - 1 &&
          answers.every((answer) => (item.options ?? []).includes(answer))
        )
      }),
    ).toBe(true)
  })

  it('lines table blanks up with the answer count', () => {
    expect(
      scored
        .filter((item) => item.type === 'fill-in-blanks-table')
        .every((item) => item.table?.blankCells.length === (mock.answers[item.id]?.blanks?.length ?? 0)),
    ).toBe(true)
  })

  it('matches the reorder key to the blocks', () => {
    expect(
      scored.filter((item) => item.type === 'reorder-paragraphs').every((item) => {
        const key = mock.answers[item.id]?.order ?? []
        const ids = (item.blocks ?? []).map((block) => block.id)
        return key.length === ids.length && key.every((entry) => ids.includes(entry))
      }),
    ).toBe(true)
  })

  it('points multi-choice keys at real options', () => {
    expect(
      scored
        .filter((item) => item.responseKind === 'multi-choice')
        .every((item) =>
          (mock.answers[item.id]?.correctChoices ?? []).every((choice) => (item.options ?? []).includes(choice)),
        ),
    ).toBe(true)
  })

  it('points single-choice keys at real options', () => {
    expect(
      scored
        .filter((item) => item.responseKind === 'choice')
        .every((item) => (item.options ?? []).includes(mock.answers[item.id]?.correctChoice ?? ' ')),
    ).toBe(true)
  })

  it('gives select-missing-word exactly one blank token', () => {
    expect(
      scored.filter((item) => item.type === 'select-missing-word').every((item) => (item.tokens ?? []).filter((token) => token === '___').length === 1),
    ).toBe(true)
  })

  it('targets exactly two tokens for highlight-incorrect-words', () => {
    expect(
      scored.filter((item) => item.type === 'highlight-incorrect-words').every((item) => {
        const highlighted = mock.answers[item.id]?.correctHighlighted ?? []
        return highlighted.length === 2 && highlighted.every((index) => index < (item.tokens?.length ?? 0))
      }),
    ).toBe(true)
  })

  it('resolves every audio-backed item to a script', () => {
    expect(
      scored
        .filter((item) => item.stimulusId)
        .every(
          (item) =>
            BANK.lectures.concat(BANK.conversations, BANK.groupDiscussions).some((audio) => audio.id === item.stimulusId) ||
            item.stimulusId?.startsWith('asq-') ||
            item.stimulusId?.startsWith('rs-') ||
            item.stimulusId?.startsWith('wfd-') ||
            item.stimulusId?.startsWith('hiw-') ||
            item.stimulusId?.startsWith('fibl-') ||
            item.stimulusId?.startsWith('lfib-') ||
            item.stimulusId?.startsWith('smw-'),
        ),
    ).toBe(true)
  })

  // Derived listening items ship a clip of just the material they test.
  // Playing the parent conversation instead runs for over a minute, and for
  // Select Missing Word it speaks the word the item blanks out.
  const clipTypes: QuestionType[] = [
    'write-from-dictation',
    'select-missing-word',
    'fill-in-blanks-listening',
    'highlight-incorrect-words',
  ]

  it('plays its own clip for every derived listening item', () => {
    expect(
      clipTypes.every((type) =>
        scored.filter((item) => item.type === type).every((item) => Boolean(item.audioClipId)),
      ),
    ).toBe(true)
  })

  it('never points a clip back at the parent recording', () => {
    expect(scored.every((item) => !item.audioClipId || item.audioClipId !== item.stimulusId)).toBe(true)
  })

  // When that clip cannot play, the player falls back to speech synthesis over
  // the parent script. Select Missing Word is the one type where an unscoped
  // fallback is worse than silence: it would read out the word the blank asks for.
  it('scopes the speech fallback of select-missing-word to the blanked word', () => {
    expect(
      scored.filter((item) => item.type === 'select-missing-word').every((item) => {
        const blank = (item.tokens ?? []).indexOf('___')
        return typeof item.audioFromTurn === 'number' && item.audioFromTurn === item.audioToTurn && item.audioBeepWord === blank
      }),
    ).toBe(true)
  })

  it('resolves every describe-image item to a chart', () => {
    expect(scored.filter((item) => item.type === 'describe-image').every((item) => Boolean(item.chartId))).toBe(true)
  })

  it('gives every describer target a reference answer', () => {
    expect(scored.filter((item) => item.responseKind === 'audio').every((item) => Boolean(mock.answers[item.id]?.reference))).toBe(true)
  })

  it('gives every writing item key terms', () => {
    expect(
      scored
        .filter((item) => item.responseKind === 'text' && item.type !== 'write-from-dictation')
        .every((item) => (mock.answers[item.id]?.keyTerms?.length ?? 0) > 0),
    ).toBe(true)
  })
})

describe('determinism', () => {
  it('produces the same test for the same seed', () => {
    const a = buildFullMock(999).sections.flatMap((section) => section.itemIds)
    const b = buildFullMock(999).sections.flatMap((section) => section.itemIds)
    expect(a.join('|')).toBe(b.join('|'))
  })

  it('produces a different test for a different seed', () => {
    const a = buildFullMock(999).sections.flatMap((section) => section.itemIds)
    const c = buildFullMock(1000).sections.flatMap((section) => section.itemIds)
    expect(a.join('|')).not.toBe(c.join('|'))
  })
})

describe('section and drill mocks', () => {
  it.each(['speaking-writing', 'reading', 'listening'] as const)('builds a %s section mock', (section) => {
    const built = buildSectionMock(42, section, MOCK_BLUEPRINT)
    expect(built.sections[0]?.itemIds.length ?? 0).toBeGreaterThan(0)
  })

  it('keeps a drill to the requested types', () => {
    const drill = buildDrillMock(7, ['reorder-paragraphs', 'write-from-dictation'], 2)
    expect(
      drill.sections
        .flatMap((section) => section.itemIds)
        .every((id) => drill.items[id] && ['reorder-paragraphs', 'write-from-dictation'].includes(drill.items[id]!.type)),
    ).toBe(true)
  })

  it('excludes the unscored warm-up from a drill', () => {
    const drill = buildDrillMock(7, ['reorder-paragraphs', 'write-from-dictation'], 2)
    expect(drill.sections.flatMap((section) => section.itemIds).every((id) => id !== 'respond-to-situation:intro')).toBe(true)
  })

  it('routes every item through the blueprint skill list', () => {
    expect(scored.every((item) => item.skills.join('+') === QUESTION_META[item.type].skills.join('+'))).toBe(true)
  })

  it('keeps every item type in the blueprint', () => {
    const known = new Set(ALL_QUESTION_TYPES)
    expect(scored.every((item: Item) => known.has(item.type))).toBe(true)
  })
})
