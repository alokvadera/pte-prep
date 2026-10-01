import type { SectionId, Skill } from '../domain/types'

// ---------------------------------------------------------------------------
// Original study material. Every passage, lecture and conversation in this file
// was written specifically for this project, so there are no copyright issues
// and no third-party assets to host.
// ---------------------------------------------------------------------------

export interface Passage {
  id: string
  title: string
  topic: string
  level: 'B2' | 'C1'
  /** Body paragraphs, in correct reading order. */
  paragraphs: string[]
  /** Terms a good summary of the passage must contain. */
  keyTerms: string[]
  /** Short extract used for Read Aloud. */
  readAloud: string
  /** Sentences used for Repeat Sentence (10–20 words each). */
  repeatSentences: string[]
  /** One-sentence summary task built on an excerpt of the passage. */
  swt: {
    id: string
    excerptLabel: string
    excerpt: string[]
    /** A model one-sentence summary, which is what Content is scored against. */
    summary: string
    keyTerms: string[]
    minWords: number
  }
  /** Fill in the Blanks (Dropdown) — one passage-length item. */
  dropdown: DropdownItem
  /** Fill in the Blanks (Table) — the table plus a short context paragraph. */
  tableFib: TableFibItem
  mcqSingle: McqItem
  mcqMultiple: McqItem
  /** Answer Short Question answers attached to a short context strip. */
  asq: AsqItem[]
}

export interface DropdownItem {
  id: string
  /** Paragraph with ___ marking each blank. */
  text: string
  /** Word bank, shuffled by the assembler. */
  bank: string[]
  /** Accepted answer per blank, same order as the blanks. */
  answers: string[]
}

export interface TableFibItem {
  id: string
  /** Context paragraph shown above the table. */
  context: string[]
  headers: string[]
  /** Cell text; `null` marks a blank. */
  rows: Array<Array<string | null>>
  /** Accepted answer per blank in reading order. */
  answers: string[]
}

export interface McqItem {
  id: string
  question: string
  options: string[]
  correct: string[]
}

export interface AsqItem {
  id: string
  question: string
  options: string[]
  correct: string
}

export interface Speaker {
  id: string
  name: string
  role?: string
  /** Relative pitch used to pick a distinct system voice. */
  voiceHint: 'low' | 'mid' | 'high' | 'mid-high'
}

export interface Turn {
  speaker: string
  text: string
}

export interface AudioScript {
  id: string
  title: string
  kind: 'lecture' | 'single-speaker' | 'conversation' | 'group' | 'news'
  topic: string
  speakers: Speaker[]
  turns: Turn[]
  /** Short note describing the scene, shown as a thumbnail caption. */
  scene?: string
  keyTerms?: string[]
}

// ---------------------------------------------------------------------------
// Derived-item shapes (authored alongside each stimulus)
// ---------------------------------------------------------------------------

export interface RetellItem {
  id: string
  audioId: string
  /** Skeleton keywords revealed after the attempt. */
  skeleton: string[]
  reference: string
  keyTerms: string[]
  minWords: number
}

export interface ListeningFibItem {
  id: string
  audioId: string
  /** Number of leading words of the transcript where the item begins. */
  startTurn: number
  text: string
  answers: string[][]
}

export interface HighlightSummaryItem {
  id: string
  audioId: string
  question: string
  options: string[]
  correct: number
}

export interface ListeningMcqItem {
  id: string
  audioId: string
  question: string
  options: string[]
  correct: string[]
}

export interface MissingWordItem {
  id: string
  audioId: string
  /** Index of the turn containing the gap. */
  turnIndex: number
  /** Word index inside the turn where the blank sits. */
  wordIndex: number
  options: string[]
  correct: number
}

export interface HighlightIncorrectItem {
  id: string
  audioId: string
  /** Transcript as delivered by the audio, with the two wrong words. */
  transcript: string
  /** Indices of the two tokens that differ from the real transcript. */
  incorrect: number[]
  correctTranscript: string
}

export interface DictationItem {
  id: string
  audioId: string
  turnIndex: number
  /** Exact sentence to be written. */
  text: string
}

export interface GroupDiscussionItem {
  id: string
  audioId: string
  question: string
  reference: string
  keyTerms: string[]
  minWords: number
}

export interface SituationItem {
  id: string
  situation: string
  prompt: string
  reference: string
  keyTerms: string[]
  minWords: number
}

export interface SpokenSummaryItem {
  id: string
  audioId: string
  question: string
  reference: string
  keyTerms: string[]
  minWords: number
}

export interface ChartSpec {
  id: string
  title: string
  kind: 'bar' | 'line' | 'pie' | 'scatter' | 'process' | 'table-chart' | 'diagram'
  caption: string
  /** Question shown before the image. */
  prompt: string
  keyTerms: string[]
  minWords: number
  data: Record<string, unknown>
}

export interface ImagePool {
  charts: ChartSpec[]
}

export interface ContentBank {
  passages: Passage[]
  asq: AsqItem[]
  lectures: AudioScript[]
  conversations: AudioScript[]
  groupDiscussions: AudioScript[]
  retell: RetellItem[]
  listeningFib: ListeningFibItem[]
  highlightSummary: HighlightSummaryItem[]
  listeningMcqSingle: ListeningMcqItem[]
  listeningMcqMulti: ListeningMcqItem[]
  missingWord: MissingWordItem[]
  highlightIncorrect: HighlightIncorrectItem[]
  dictation: DictationItem[]
  spokenSummary: SpokenSummaryItem[]
  groupDiscussionItems: GroupDiscussionItem[]
  situations: SituationItem[]
  charts: ChartSpec[]
  repeatSentences: { id: string; text: string }[]
}

export const SKILL_OF_SECTION: Record<SectionId, Skill> = {
  'speaking-writing': 'speaking',
  reading: 'reading',
  listening: 'listening',
}
