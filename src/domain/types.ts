// ---------------------------------------------------------------------------
// PTE Academic domain model
// ---------------------------------------------------------------------------

export type Skill = 'reading' | 'listening' | 'speaking' | 'writing'

export type SectionId = 'speaking-writing' | 'reading' | 'listening'

export const SECTIONS: SectionId[] = ['speaking-writing', 'reading', 'listening']

/** All 22 official PTE Academic item types (2025+ format, incl. SGD and RTS). */
export type QuestionType =
  // Part 1 — Speaking & Writing (9)
  | 'read-aloud'
  | 'repeat-sentence'
  | 'describe-image'
  | 'retell-lecture'
  | 'answer-short-question'
  | 'summarize-group-discussion'
  | 'respond-to-situation'
  | 'summarize-written-text'
  | 'write-essay'
  // Part 2 — Reading (5)
  | 'fill-in-blanks-dropdown'
  | 'fill-in-blanks-table'
  | 'multiple-choice-single'
  | 'multiple-choice-multiple'
  | 'reorder-paragraphs'
  // Part 3 — Listening (8)
  | 'summarize-spoken-text'
  | 'fill-in-blanks-listening'
  | 'highlight-correct-summary'
  | 'listening-multiple-choice-single'
  | 'listening-multiple-choice-multiple'
  | 'select-missing-word'
  | 'highlight-incorrect-words'
  | 'write-from-dictation'

export type ResponseKind = 'audio' | 'text' | 'choice' | 'multi-choice' | 'blanks' | 'order' | 'highlight'

export interface AudioAnalysis {
  /** Duration of the recorded take, milliseconds. */
  durationMs: number
  /** Words per minute estimated from the captured audio. */
  wordsPerMinute: number
  /** Detected speech segments (silence gaps removed) as a fraction of total take. */
  speechRatio: number
  /** Number of pauses longer than 500ms inside speech. */
  pauseCount: number
  /** Mean fundamental frequency, Hz. Unavailable on some engines. */
  meanPitchHz: number | null
  /** Coefficient of variation of frame energy — rough intelligibility proxy. */
  energyVariance: number
  /** True when device metering produced usable data. */
  reliable: boolean
}

export interface ItemResponse {
  /** Single-select choice. */
  choice?: string | null
  /** Multi-select choices. */
  choices?: string[]
  /** Free-text entries keyed by blank index. */
  blanks?: Array<string | null>
  /** Drag-and-drop ordering of block ids. */
  order?: string[]
  /** Indices of highlighted tokens/words. */
  highlighted?: number[]
  /** Long-form written response. */
  text?: string
  /** Spoken response metadata (no raw audio is persisted). */
  audio?: AudioAnalysis
  /** STT transcript of the spoken take, if the browser supports recognition. */
  transcript?: string
  /** Per-token comparison of the spoken take against the target (0..1 each). */
  tokenScores?: number[]
  flagged?: boolean
  /** seconds the test-taker spent on the item */
  secondsOnItem?: number
}

export interface ParagraphBlock {
  id: string
  text: string
}

export interface TableSpec {
  headers: string[]
  rows: Array<Array<string | null>>
  /** Positions of the blank cells, in reading order. */
  blankCells: Array<{ row: number; col: number }>
  /** Context paragraph shown above the table. */
  context: string[]
}

export interface AnswerKey {
  correctChoice?: string
  /** For multi-choice items. */
  correctChoices?: string[]
  /** Accepted answers per blank (lowercase, no punctuation). */
  blanks?: string[][]
  /** Correct block order for reorder items. */
  order?: string[]
  /** Token indices that are correct / incorrect. */
  correctHighlighted?: number[]
  /** For writing & speaking: reference answer and target key terms. */
  reference?: string
  keyTerms?: string[]
  /** Minimum acceptable word count. */
  minWords?: number
  maxWords?: number
}

export interface Stimulus {
  passageId?: string
  passageTitle?: string
  passageParagraphs?: string[]
  audioId?: string
  chartId?: string
  imageAlt?: string
  note?: string
}

export interface Item {
  id: string
  type: QuestionType
  section: SectionId
  /** Items sharing a stimulus share a group id. */
  groupId: string
  /**
   * Communicative skills this item contributes to.
   *
   * Eight of the 22 official types are *integrated* and score two skills — an
   * item's points feed both. Write from Dictation, for instance, contributes to
   * Listening and Writing simultaneously. Modelling this as a single skill
   * distorts every skill score, so it is a list.
   */
  skills: Skill[]
  responseKind: ResponseKind
  /** Instruction line displayed above the stimulus. */
  prompt: string
  /** Text the candidate must read aloud / repeat. */
  targetText?: string
  /** Blanks metadata for fill-in-the-blanks variants. */
  blankLabels?: string[]
  /** Table layout for the Fill in the Blanks (Table) type. */
  table?: TableSpec
  /** Choices for choice-based items, or the word bank for dropdown blanks. */
  options?: string[]
  /** Paragraph blocks for reorder items, in presented (shuffled) order. */
  blocks?: ParagraphBlock[]
  /** Tokens for highlight and select-missing-word items. `___` marks the gap. */
  tokens?: string[]
  /** Audio script id backing this item, if any. */
  stimulusId?: string
  /**
   * Literal sentence to speak when no bank script backs the item. Repeat
   * Sentence has no recorded conversation of its own, and Highlight Incorrect
   * Words tests a single sentence rather than the conversation it came from.
   */
  audioUtterance?: string
  /** Inclusive turn range of the script to play (WFD/Missing Word scope). */
  audioFromTurn?: number
  audioToTurn?: number
  /** With a single-turn scope, voice a beep at this word index (Missing Word). */
  audioBeepWord?: number
  /** Chart id backing a Describe Image item. */
  chartId?: string
  /** Points available for a fully correct response. */
  maxPoints: number
  /** Time budget for the item in the real test, seconds. */
  seconds: number
  /** Setup/prep time before the recording starts, seconds. */
  prepSeconds?: number
  /** Countdown before the audio plays, seconds. */
  audioLeadIn?: number
  /** Audio can be replayed this many times. */
  replays?: number
  /** True for the un-scored personal introduction warm-up. */
  warmup?: boolean
  /** Question-level hint shown after the attempt is reviewed. */
  tip?: string
}

export interface ItemGroup {
  id: string
  section: SectionId
  type: QuestionType
  skills: Skill[]
  /** Order of the stimulus block inside the section. */
  order: number
  stimulus: Stimulus
  itemIds: string[]
}

export interface TestSection {
  id: SectionId
  title: string
  /** Time budget for the whole section, seconds. */
  seconds: number
  groups: ItemGroup[]
  itemIds: string[]
}

export interface MockTest {
  id: string
  seed: number
  title: string
  /** 'full' = 3 sections; 'section' = single-section drill. */
  kind: 'full' | 'section' | 'drill'
  createdAt: string
  sections: TestSection[]
  items: Record<string, Item>
  answers: Record<string, AnswerKey>
  totalPoints: number
  totalSeconds: number
  /**
   * Multiplier applied to every section clock, from the accessibility control
   * on the setup page. WCAG 2.2 SC 2.2.1 requires a timed process to be
   * turn-off-able, adjustable, or extendable. A practice mock is not an
   * essential time limit — the activity is still valid with the clock
   * adjusted — so that exception is not available here.
   */
  timeScale: number
  /** True when the candidate chose an untimed run. */
  untimed?: boolean
}

export type MockMode = 'exam' | 'practice' | 'review'

export interface AttemptRecord {
  id: string
  mockId: string
  mockTitle: string
  mode: MockMode
  startedAt: string
  finishedAt: string
  durationMs: number
  seed: number
  sectionIds: SectionId[]
  /** Responses keyed by item id. */
  responses: Record<string, ItemResponse>
  /** Total points available for the attempted items. */
  availablePoints: number
  /** Estimated points earned. */
  earnedPoints: number
  /** Per-skill estimated results, on the 10–90 PTE scale. */
  skillScores: Partial<Record<Skill, number>>
  /**
   * Pearson states that the overall score is NOT an average of the skill
   * scores: it is a single IRT scaling over all item scores. The value here is
   * therefore our own estimate and is labelled as such wherever it is shown.
   */
  overallIsEstimate: boolean
  /** Overall estimate, 10–90. */
  overallScore: number
  /** Overall estimate on the legacy 60–120 scale. */
  overallScore60: number
  cefr: string
  /** Completed item ids. */
  completedItemIds: string[]
  /** Item type level accuracy: type -> { correct, total, maxPoints }. */
  breakdown: Record<string, TypeStat>
}

export interface TypeStat {
  type: QuestionType
  label: string
  /** The skill this type is grouped under in the report. */
  skill: Skill
  correct: number
  partial: number
  incorrect: number
  total: number
  maxPoints: number
  earnedPoints: number
  seconds: number
}

/** Estimated trait scores for a constructed response, 0..1 each. */
export interface TraitBreakdown {
  content?: number
  form?: number
  oralFluency?: number
  pronunciation?: number
  grammar?: number
  vocabulary?: number
  spelling?: number
  development?: number
  range?: number
}

export interface ItemScoreDetail {
  itemId: string
  type: QuestionType
  label: string
  skills: Skill[]
  maxPoints: number
  points: number
  /** 0..1 quality, drives the status badge. */
  ratio: number
  status: 'correct' | 'partial' | 'incorrect' | 'unanswered'
  /** Human-readable notes about why points were lost. */
  notes: string[]
  /** Estimated trait scores, for the constructed types. */
  traits?: TraitBreakdown
  /** The published maximum for this type's Content scale. */
  contentMax?: number
  /** The published maximum for this type's Form scale. */
  formMax?: number
  /** True when Content or Form scored 0, which zeroes the whole item. */
  gated?: boolean
  /** Ideal answer shown in review. */
  reference?: string
}
