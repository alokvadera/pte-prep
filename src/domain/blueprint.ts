import type { QuestionType, SectionId, Skill } from './types'

// ---------------------------------------------------------------------------
// The test blueprint, transcribed from Pearson's PTE Academic Test Taker Score
// Guide (2026 edition, the current one — it documents 22 question types).
// See docs/PTE_KNOWLEDGE.md for the source quotes behind every row.
// ---------------------------------------------------------------------------

/**
 * How an item turns a response into points.
 *
 * This is the part of the model that most often gets approximated incorrectly
 * online, so it is modelled explicitly rather than collapsed into a single
 * "correct or not" path.
 */
export type ScoringMode =
  /** One point for the whole item, or nothing. */
  | 'binary'
  /** One point per blank. No deduction for wrong blanks. */
  | 'per-blank'
  /** One point per word spelled correctly. No deduction. */
  | 'per-word'
  /**
   * One point per correct unit, minus one per incorrect unit, floored at zero.
   * Only three of the 22 official types use this: both Multiple Choice Multiple
   * Answers types, and Highlight Incorrect Words.
   */
  | 'per-unit-negated'
  /** One point per adjacent pair placed in the correct order. Max = N-1. */
  | 'per-adjacent-pair'
  /** Trait scores combined, gated on Content (and Form where scored). */
  | 'trait-composite'

export interface QuestionMeta {
  type: QuestionType
  label: string
  short: string
  /**
   * Communicative skills scored. Length two means the item is integrated and
   * contributes to both.
   */
  skills: Skill[]
  section: SectionId
  scoring: ScoringMode
  /** Number of items in a real PTE test. */
  perTest: string
  /** Traits Pearson scores for this type. */
  traits: string[]
  /** Published count, for building a realistic mock. */
  count: { min: number; max: number }
  tip: string
}

const S = (skills: Skill[]): Skill[] => skills

export const QUESTION_META: Record<QuestionType, QuestionMeta> = {
  'read-aloud': {
    type: 'read-aloud',
    label: 'Read Aloud',
    short: 'RA',
    // Changed in the 2026 guide: Read Aloud no longer scores Reading.
    skills: S(['speaking']),
    section: 'speaking-writing',
    scoring: 'trait-composite',
    perTest: '6–7',
    traits: ['Content', 'Pronunciation', 'Oral Fluency'],
    count: { min: 6, max: 7 },
    tip: 'Prepare by silently reading the whole text and marking stressed words. Speak from the first word — there is no penalty for a small mistake, but a long silence can end the recording and lose the item.',
  },
  'repeat-sentence': {
    type: 'repeat-sentence',
    label: 'Repeat Sentence',
    short: 'RS',
    skills: S(['listening', 'speaking']),
    section: 'speaking-writing',
    scoring: 'trait-composite',
    perTest: '10–12',
    traits: ['Content', 'Pronunciation', 'Oral Fluency'],
    count: { min: 10, max: 12 },
    tip: 'Chunk the sentence into three-to-five-word groups and shadow the audio. Hesitations and pauses are ignored, so keep going even if you lose a word.',
  },
  'describe-image': {
    type: 'describe-image',
    label: 'Describe Image',
    short: 'DI',
    skills: S(['speaking']),
    section: 'speaking-writing',
    scoring: 'trait-composite',
    perTest: '5–6',
    traits: ['Content', 'Pronunciation', 'Oral Fluency'],
    count: { min: 5, max: 6 },
    tip: 'Use a fixed frame: "The graph shows… the highest/lowest is… followed by…". Cover structure, then trend, then specifics.',
  },
  'retell-lecture': {
    type: 'retell-lecture',
    label: 'Re-tell Lecture',
    short: 'RTL',
    skills: S(['listening', 'speaking']),
    section: 'speaking-writing',
    scoring: 'trait-composite',
    perTest: '2–3',
    traits: ['Content', 'Pronunciation', 'Oral Fluency'],
    count: { min: 2, max: 3 },
    tip: 'Note only the lecture skeleton — three or four keywords — while listening. Re-tell in your own words with a clear cause-and-effect chain.',
  },
  'answer-short-question': {
    type: 'answer-short-question',
    label: 'Answer Short Question',
    short: 'ASQ',
    // Correct/incorrect, Vocabulary 0–1. No partial band exists.
    skills: S(['listening']),
    section: 'speaking-writing',
    scoring: 'binary',
    perTest: '5–6',
    traits: ['Vocabulary'],
    count: { min: 5, max: 6 },
    tip: 'Answer with one to four words, and begin the moment the microphone opens: waiting more than three seconds ends the recording and the item is lost. The score guide awards 1 for appropriate word choice and 0 for inappropriate — there is no partial credit.',
  },
  'summarize-group-discussion': {
    type: 'summarize-group-discussion',
    label: 'Summarize Group Discussion',
    short: 'SGD',
    skills: S(['listening', 'speaking']),
    section: 'speaking-writing',
    scoring: 'trait-composite',
    perTest: '2–3',
    traits: ['Content', 'Pronunciation', 'Oral Fluency'],
    count: { min: 2, max: 3 },
    tip: 'Listen for each speaker\'s position, not the detail. Summarise the group\'s overall stance plus how the speakers relate to one another.',
  },
  'respond-to-situation': {
    type: 'respond-to-situation',
    label: 'Respond to a Situation',
    short: 'RTS',
    skills: S(['speaking']),
    section: 'speaking-writing',
    scoring: 'trait-composite',
    perTest: '2–3',
    traits: ['Content', 'Pronunciation', 'Oral Fluency'],
    count: { min: 2, max: 3 },
    tip: 'Deliver a complete, situationally appropriate response. Content 0 means no points at all, however fluent the delivery.',
  },
  'summarize-written-text': {
    type: 'summarize-written-text',
    label: 'Summarize Written Text',
    short: 'SWT',
    skills: S(['reading', 'writing']),
    section: 'speaking-writing',
    scoring: 'trait-composite',
    perTest: '2',
    traits: ['Content', 'Form', 'Grammar', 'Vocabulary'],
    count: { min: 2, max: 2 },
    tip: 'Read the passage once, then write one sentence. Form is scored 1 for a single complete sentence and 0 otherwise — form 0 scores the whole item at zero.',
  },
  'write-essay': {
    type: 'write-essay',
    label: 'Write Essay',
    short: 'WE',
    skills: S(['writing']),
    section: 'speaking-writing',
    scoring: 'trait-composite',
    perTest: '1',
    traits: [
      'Content',
      'Form',
      'Development, Structure and Coherence',
      'General Linguistic Range',
      'Vocabulary Range',
      'Spelling',
      'Grammar',
    ],
    count: { min: 1, max: 1 },
    tip: 'Twenty minutes, 200–300 words. Form is worth 2 points at 200–300 words, 1 at 120–199 or 301–380, and 0 outside that — and form 0 scores the item at zero.',
  },
  'fill-in-blanks-dropdown': {
    type: 'fill-in-blanks-dropdown',
    label: 'Fill in the Blanks (Dropdown)',
    short: 'FIB-D',
    skills: S(['reading']),
    // Part 2, Reading — this is item 10 on the test, not a Part 1 item. Its
    // `skills` already said reading; only the section was wrong.
    section: 'reading',
    scoring: 'per-blank',
    perTest: '5–6',
    traits: [],
    count: { min: 5, max: 6 },
    tip: 'Read the whole text once first, then decide. One point per completed blank, no penalty for the ones you get wrong.',
  },
  'fill-in-blanks-table': {
    type: 'fill-in-blanks-table',
    label: 'Fill in the Blanks (Table)',
    short: 'FIB-T',
    skills: S(['reading']),
    section: 'reading',
    scoring: 'per-blank',
    perTest: '4–5',
    traits: [],
    count: { min: 4, max: 5 },
    tip: 'Each blank is scored separately, so partial credit applies. Work down a column rather than across a row.',
  },
  'multiple-choice-single': {
    type: 'multiple-choice-single',
    label: 'Multiple Choice (Single Answer)',
    short: 'MCQ-S',
    skills: S(['reading']),
    section: 'reading',
    scoring: 'binary',
    perTest: '2–3',
    traits: [],
    count: { min: 2, max: 3 },
    tip: 'Correct or incorrect, one point, no partial credit. Two of the four options are always plausible — reject them explicitly before choosing.',
  },
  'multiple-choice-multiple': {
    type: 'multiple-choice-multiple',
    label: 'Multiple Choice (Multiple Answers)',
    short: 'MCQ-M',
    skills: S(['reading']),
    section: 'reading',
    scoring: 'per-unit-negated',
    perTest: '2–3',
    traits: [],
    count: { min: 2, max: 3 },
    tip: 'One point per correct option, minus one per wrong option, floored at zero. Every wrong selection costs a whole point.',
  },
  'reorder-paragraphs': {
    type: 'reorder-paragraphs',
    label: 'Re-order Paragraphs',
    short: 'ROP',
    skills: S(['reading']),
    section: 'reading',
    scoring: 'per-adjacent-pair',
    perTest: '2–3',
    traits: [],
    count: { min: 2, max: 3 },
    tip: 'One point per correctly ordered adjacent pair, so four boxes are worth three points. There is no negative marking and a wrong order scores zero.',
  },
  'summarize-spoken-text': {
    type: 'summarize-spoken-text',
    label: 'Summarize Spoken Text',
    short: 'SST',
    skills: S(['listening', 'writing']),
    section: 'listening',
    scoring: 'trait-composite',
    perTest: '1',
    traits: ['Content', 'Form', 'Grammar', 'Vocabulary', 'Spelling'],
    count: { min: 1, max: 1 },
    tip: 'Form is worth 2 points at 50–70 words, 1 at 40–49 or 71–100, and 0 outside that. Form 0 scores the whole item at zero.',
  },
  'fill-in-blanks-listening': {
    type: 'fill-in-blanks-listening',
    label: 'Fill in the Blanks',
    short: 'FIB-L',
    skills: S(['listening']),
    section: 'listening',
    // The guide awards a point per word spelled correctly; here the only words
    // the candidate supplies are the blanks, so the unit is the blank.
    scoring: 'per-blank',
    perTest: '2–3',
    traits: [],
    count: { min: 2, max: 3 },
    tip: 'One point per word spelled correctly, no deduction for the rest. Predict the word class and number before the audio plays.',
  },
  'highlight-correct-summary': {
    type: 'highlight-correct-summary',
    label: 'Highlight Correct Summary',
    short: 'HCS',
    skills: S(['listening', 'reading']),
    section: 'listening',
    scoring: 'binary',
    perTest: '2–3',
    traits: [],
    count: { min: 2, max: 3 },
    tip: 'Exactly one summary matches, and the item is all-or-nothing. Compare the options side by side rather than one at a time.',
  },
  'listening-multiple-choice-single': {
    type: 'listening-multiple-choice-single',
    label: 'Multiple Choice (Single Answer)',
    short: 'MCQ-LS',
    skills: S(['listening']),
    section: 'listening',
    scoring: 'binary',
    perTest: '2–3',
    traits: [],
    count: { min: 2, max: 3 },
    tip: 'All or nothing, one point. Read the question and options before pressing play.',
  },
  'listening-multiple-choice-multiple': {
    type: 'listening-multiple-choice-multiple',
    label: 'Multiple Choice (Multiple Answers)',
    short: 'MCQ-LM',
    skills: S(['listening']),
    section: 'listening',
    scoring: 'per-unit-negated',
    perTest: '2–3',
    traits: [],
    count: { min: 2, max: 3 },
    tip: 'One point per correct option, minus one per wrong option. A single wrong selection can take the whole item to zero.',
  },
  'select-missing-word': {
    type: 'select-missing-word',
    label: 'Select Missing Word',
    short: 'SMW',
    skills: S(['listening']),
    section: 'listening',
    scoring: 'binary',
    perTest: '1–2',
    traits: [],
    count: { min: 1, max: 2 },
    tip: 'All or nothing. The options are near-homophones, so eliminate on stress pattern and grammar rather than meaning.',
  },
  'highlight-incorrect-words': {
    type: 'highlight-incorrect-words',
    label: 'Highlight Incorrect Words',
    short: 'HIW',
    skills: S(['listening', 'reading']),
    section: 'listening',
    scoring: 'per-unit-negated',
    perTest: '2–3',
    traits: [],
    count: { min: 2, max: 3 },
    tip: 'One point per correct highlight, minus one per word highlighted wrongly. Highlight a third word by mistake and the item scores zero.',
  },
  'write-from-dictation': {
    type: 'write-from-dictation',
    label: 'Write from Dictation',
    short: 'WFD',
    skills: S(['listening', 'writing']),
    section: 'listening',
    scoring: 'per-word',
    perTest: '3–4',
    traits: [],
    count: { min: 3, max: 4 },
    tip: 'One point per word spelled correctly, and no deduction for the ones you miss. Capitalisation and a single missing full stop each cost a word.',
  },
}

export const ALL_QUESTION_TYPES = Object.keys(QUESTION_META) as QuestionType[]

/** The skill a type is grouped under in the report — the first of its skills. */
export function primarySkill(type: QuestionType): Skill {
  return QUESTION_META[type].skills[0] as Skill
}

/** Types that award negative marks. Only these three. */
export const NEGATIVE_MARKING_TYPES = ALL_QUESTION_TYPES.filter(
  (t) => QUESTION_META[t].scoring === 'per-unit-negated',
)

export interface SectionMeta {
  id: SectionId
  title: string
  longTitle: string
  /** Section time range published in the 2026 guide, seconds. */
  minSeconds: number
  maxSeconds: number
  skill: Skill
  weightNote: string
  blurb: string
}

export const SECTION_META: Record<SectionId, SectionMeta> = {
  'speaking-writing': {
    id: 'speaking-writing',
    title: 'Part 1',
    longTitle: 'Speaking & Writing',
    // 2026 guide: approx. 76–84 minutes. The legacy 54–67 range predates the
    // addition of Summarize Group Discussion and Respond to a Situation.
    minSeconds: 76 * 60,
    maxSeconds: 84 * 60,
    skill: 'speaking',
    weightNote: '76–84 min',
    blurb:
      'Nine speaking and writing types. Repeat Sentence, Re-tell Lecture and Summarize Group Discussion each feed both Listening and Speaking; Summarize Written Text feeds both Reading and Writing.',
  },
  reading: {
    id: 'reading',
    title: 'Part 2',
    longTitle: 'Reading',
    minSeconds: 23 * 60,
    maxSeconds: 30 * 60,
    skill: 'reading',
    weightNote: '23–30 min',
    blurb:
      'One academic passage, twenty scored items, five types. Re-order Paragraphs awards a point per correctly ordered adjacent pair rather than being all-or-nothing.',
  },
  listening: {
    id: 'listening',
    title: 'Part 3',
    longTitle: 'Listening',
    minSeconds: 31 * 60,
    maxSeconds: 39 * 60,
    skill: 'listening',
    weightNote: '31–39 min',
    blurb:
      'Eight item types. Write from Dictation and Summarize Spoken Text feed both Listening and Writing; Highlight Correct Summary and Highlight Incorrect Words feed both Listening and Reading.',
  },
}

/**
 * Item counts for a generated mock.
 *
 * Pearson states a test contains 65–75 questions, and that each version is
 * balanced for total length so counts vary between sittings. Taking the maximum
 * of every published range produces 85 items. The midpoints, rounded, produce
 * 84 — the closest whole-number reading of the same ranges, and still above the
 * stated band: the 22 current types each vary independently, so their midpoints
 * do not shrink together. A shorter mock has to invent a count below the range
 * the guide publishes for some type, which is why the midpoints are used.
 */
export const MOCK_BLUEPRINT: Record<QuestionType, number> = Object.fromEntries(
  ALL_QUESTION_TYPES.map((t) => {
    const { min, max } = QUESTION_META[t].count
    return [t, Math.round((min + max) / 2)]
  }),
) as Record<QuestionType, number>

/**
 * Scored items a complete mock puts in each section.
 *
 * This is the denominator a section's clock is scaled against: a mock with half
 * the blueprint's items gets half the section's official time. Duplicated in
 * `domain/assemble.ts` (where the same figure is computed from the blueprint at
 * build time); scripts/bank-check.ts asserts the preview and the assembler
 * agree on every length, so the two cannot drift.
 */
const BLUEPRINT_SCORED_BY_SECTION: Record<SectionId, number> = (() => {
  const out: Record<SectionId, number> = { 'speaking-writing': 0, reading: 0, listening: 0 }
  for (const type of ALL_QUESTION_TYPES) out[QUESTION_META[type].section] += MOCK_BLUEPRINT[type]
  return out
})()

// ---------------------------------------------------------------------------
// Mock preview, computed without the content bank.
//
// The mock-setup screen shows a session summary (sections, scored item
// count, estimated time and the question types involved) before a session
// starts. Computing it here — from the blueprint and section metadata
// alone — keeps the ~10 000 LOC content bank out of the initial bundle:
// the summary renders instantly, and the full mock is only assembled when
// the candidate actually starts the session (see pages/MockSetup.tsx).
//
// The three constants below mirror constants that live in
// domain/assemble.ts. They are duplicated here because importing them from
// the assembler would drag the content bank into every bundle that renders
// this summary. scripts/bank-check.ts asserts the copies still match, so a
// reorder of the assembler's builders fails the check instead of silently
// drifting.
// ---------------------------------------------------------------------------

/** Section order, mirroring `SECTION_ORDER` in domain/assemble.ts. */
export const SECTION_IDS: readonly SectionId[] = [
  'speaking-writing',
  'reading',
  'listening',
]

/**
 * The order question types first appear in a built mock, mirroring the
 * sequence the item builders in domain/assemble.ts add them in. Speaking
 * and Writing leads with the unscored personal introduction, which is why
 * Respond to a Situation heads the list even though its scored items are
 * added further down the same builder.
 */
export const MOCK_TYPE_ORDER: readonly QuestionType[] = [
  // Speaking & Writing — buildSpeakingWriting
  'respond-to-situation', // the unscored introduction is added first
  'read-aloud',
  'repeat-sentence',
  'describe-image',
  'retell-lecture',
  'answer-short-question',
  'summarize-group-discussion',
  'summarize-written-text',
  'write-essay',
  // Reading — buildReading
  'fill-in-blanks-dropdown',
  'fill-in-blanks-table',
  'multiple-choice-multiple',
  'multiple-choice-single',
  'reorder-paragraphs',
  // Listening — buildListening
  'summarize-spoken-text',
  'fill-in-blanks-listening',
  'highlight-correct-summary',
  'listening-multiple-choice-single',
  'listening-multiple-choice-multiple',
  'select-missing-word',
  'highlight-incorrect-words',
  'write-from-dictation',
]

export interface MockPreviewOptions {
  /** Restrict the preview to a single section, as a section mock does. */
  singleSection?: SectionId | null
  /** Multiplier on every section clock. 1 is the official timing. */
  timeScale?: number
  /** True when the runner forbids the clock, as in the untimed option. */
  untimed?: boolean
}

export interface MockPreview {
  sectionIds: SectionId[]
  scoredCount: number
  totalSeconds: number
  includedTypes: QuestionType[]
}

/**
 * Describe a mock's shape from its per-type counts without assembling it.
 *
 * Every count contributes exactly one scored item (the only unscored item
 * in a mock is the personal introduction, which is not part of the counts),
 * and a section's clock is its official minimum scaled by both the share of the
 * blueprint's items actually included and the timing multiplier. A half mock
 * therefore gets about half the official time rather than the same two hours
 * with half the questions. Both relationships are asserted against the real
 * assembler by scripts/bank-check.ts, so this stays faithful to the mock that
 * will actually be built when the session starts.
 */
export function describeMockPreview(
  counts: Partial<Record<QuestionType, number>>,
  opts: MockPreviewOptions = {},
): MockPreview {
  const timeScale = opts.timeScale ?? 1
  const untimed = opts.untimed ?? false
  const sectionIds = opts.singleSection ? [opts.singleSection] : [...SECTION_IDS]

  const totalSeconds = sectionIds.reduce((sum, id) => {
    const reference = BLUEPRINT_SCORED_BY_SECTION[id]
    const scored = MOCK_TYPE_ORDER.reduce(
      (n, type) => n + (QUESTION_META[type].section === id ? (counts[type] ?? 0) : 0),
      0,
    )
    const full = SECTION_META[id].minSeconds
    // Mirrors `sectionSeconds` in domain/assemble.ts: official minimum scaled by
    // the share of the blueprint's items, floored for a drill, then by timing.
    /* v8 ignore next -- every section has scored items in the blueprint */
    const base = reference > 0 ? Math.max(180, Math.round(full * Math.min(1, scored / reference))) : full
    return sum + (untimed ? base : Math.round(base * timeScale))
  }, 0)

  const inScope = (type: QuestionType) =>
    !opts.singleSection || QUESTION_META[type].section === opts.singleSection

  const scoredCount = MOCK_TYPE_ORDER.reduce(
    (sum, type) => sum + (inScope(type) ? (counts[type] ?? 0) : 0),
    0,
  )

  // The introduction is always present in a session that includes the
  // Speaking & Writing section, so Respond to a Situation is listed even
  // before its scored items are counted.
  const hasIntro = !opts.singleSection || opts.singleSection === 'speaking-writing'
  const includedTypes = MOCK_TYPE_ORDER.filter(
    (type) =>
      inScope(type) &&
      ((counts[type] ?? 0) > 0 || (type === 'respond-to-situation' && hasIntro)),
  )

  return { sectionIds, scoredCount, totalSeconds, includedTypes }
}
