/**
 * Lightweight content manifest — metadata only, no question text.
 *
 * Used by pages that need to list or count items without shipping the
 * full content bank (~2 KB vs 10 000+ LOC). The full bank is loaded
 * on demand by the test assembler (domain/assemble.ts), which the
 * mock-setup and practice screens import only when a session starts.
 *
 * Counts are derived from the content bank and kept in sync by
 * {@link scripts/bank-check.ts}, which asserts every figure here
 * against the live bank. If you add or remove items, update this
 * manifest and re-run `npm run test:bank`.
 */

import type { QuestionType, Skill, SectionId } from '../domain/types'
import { QUESTION_META } from '../domain/blueprint'

export interface ManifestEntry {
  type: QuestionType
  section: SectionId
  skills: Skill[]
  label: string
  short: string
  perTest: string
  scoring: string
  count: number
}

/** Capacity per question type — verified against the content bank
 *  (see scripts/bank-check.ts). These mirror `capacityByType()`. */
export const MANIFEST_CAPACITY: Record<QuestionType, number> = {
  'read-aloud': 230,
  'repeat-sentence': 397,
  'describe-image': 60,
  'retell-lecture': 24,
  'answer-short-question': 250,
  'summarize-group-discussion': 14,
  'respond-to-situation': 36,
  'summarize-written-text': 40,
  'write-essay': 50,
  'fill-in-blanks-dropdown': 40,
  'fill-in-blanks-table': 40,
  'multiple-choice-single': 40,
  'multiple-choice-multiple': 40,
  'reorder-paragraphs': 80,
  'summarize-spoken-text': 21,
  'fill-in-blanks-listening': 33,
  'highlight-correct-summary': 30,
  'listening-multiple-choice-single': 36,
  'listening-multiple-choice-multiple': 30,
  'select-missing-word': 36,
  'highlight-incorrect-words': 34,
  'write-from-dictation': 39,
} as const

/** Total buildable items across all types — mirrors the sum of capacityByType(). */
export const TOTAL_CAPACITY = Object.values(MANIFEST_CAPACITY).reduce((a, b) => a + b, 0)

/**
 * Bank capacity — the number reported on the home and about pages.
 * Mirrors `bankCapacity()`, which weights passages by seven item types
 * each, so it is smaller than TOTAL_CAPACITY.
 */
export const BANK_CAPACITY = 1200

/** Full manifest — one entry per question type. */
export function getManifest(): ManifestEntry[] {
  return (Object.keys(MANIFEST_CAPACITY) as QuestionType[]).map((type) => {
    const meta = QUESTION_META[type]
    return {
      type,
      section: meta.section,
      skills: meta.skills,
      label: meta.label,
      short: meta.short,
      perTest: meta.perTest,
      scoring: meta.scoring,
      count: MANIFEST_CAPACITY[type],
    }
  })
}

/** Types that score a given skill. */
export function typesForSkill(skill: Skill): QuestionType[] {
  return (Object.keys(MANIFEST_CAPACITY) as QuestionType[]).filter((t) =>
    QUESTION_META[t].skills.includes(skill),
  )
}

/**
 * Per-type capacity — mirrors `capacityByType()` from the content
 * bank, but reads from the static manifest so no question text
 * is loaded. Used by the practice and mock-setup pages to show
 * how many items of each type are available before the bank
 * itself is fetched.
 */
export function manifestCapacityByType(): Record<QuestionType, number> {
  return { ...MANIFEST_CAPACITY }
}

/**
 * Total bank capacity — mirrors `bankCapacity()` from the content
 * bank. This is the headline figure on the home and about pages.
 */
export function manifestBankCapacity(): number {
  return BANK_CAPACITY
}
