import { makeRng } from '../lib/random'
import { contentWords } from '../lib/text'
import {
  ASQ_RECORDINGS,
  CONVERSATIONS,
  DICTATION,
  HIGHLIGHT_INCORRECT,
  HIGHLIGHT_SUMMARY,
  LISTENING_FIB,
  LISTENING_MCQ_MULTI,
  LISTENING_MCQ_SINGLE,
  MISSING_WORD,
  SITUATIONS,
} from './listening'
import {
  GROUP_DISCUSSIONS,
  GROUP_DISCUSSION_ITEMS,
  LECTURES,
  RETELL_ITEMS,
  SPOKEN_SUMMARY_ITEMS,
} from './audio'
import { CHARTS } from './charts'
import { PASSAGES } from './passages'
import { EXTRA_ESSAY_PROMPTS } from './essayExtra'
import { EXTRA_ESSAY_PROMPTS_2 } from './essayExtra2'
import { EXTRA_ESSAY_PROMPTS_3 } from './essayExtra3'
import { EXTRA_ESSAY_PROMPTS_4 } from './essayExtra4'
import type { AudioScript, ContentBank, Passage } from './schema'

// ---------------------------------------------------------------------------
// Repeat Sentence — sentences are harvested from the lecture and conversation
// material and filtered to the 10–20 word range the real test uses.
// ---------------------------------------------------------------------------

function buildRepeatPool(): { id: string; text: string }[] {
  const sources: AudioScript[] = [...LECTURES, ...CONVERSATIONS, ...GROUP_DISCUSSIONS]
  const seen = new Set<string>()
  const pool: { id: string; text: string }[] = []

  for (const script of sources) {
    for (const turn of script.turns) {
      const sentences = turn.text.split(/(?<=[.?!])\s+/)
      for (const raw of sentences) {
        const text = raw.trim()
        const wc = text.split(/\s+/).length
        if (wc < 11 || wc > 20) continue
        const key = text.toLowerCase()
        /* v8 ignore next -- no two sentences in the bank are identical */
        if (seen.has(key)) continue
        seen.add(key)
        pool.push({ id: `rs-${pool.length + 1}`, text })
      }
    }
  }
  return pool
}

export const REPEAT_SENTENCES = buildRepeatPool()

/**
 * Read Aloud extracts. The authored extract on each passage is always used
 * first; the remaining paragraphs are chunked into 45–75 word sentences so a
 * long practice run does not recycle the same six texts.
 */
function buildReadAloudPool(): { id: string; text: string }[] {
  const pool: { id: string; text: string }[] = PASSAGES.map((p) => ({
    id: `${p.id}-authored`,
    text: p.readAloud,
  }))

  const chunk = (paragraph: string): string[] => {
    const sentences = paragraph.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0)
    const out: string[] = []
    let current = ''
    for (const s of sentences) {
      const next = current ? `${current} ${s}` : s
      const wc = next.split(/\s+/).length
      if (wc > 78 && current) {
        out.push(current)
        current = s
      } else {
        current = next
      }
    }
    /* v8 ignore next -- no paragraph in the bank is empty */
    if (current) out.push(current)
    return out.filter((c) => {
      const wc = c.split(/\s+/).length
      return wc >= 40 && wc <= 78
    })
  }

  for (const p of PASSAGES) {
    for (const [pi, paragraph] of p.paragraphs.entries()) {
      for (const [ci, c] of chunk(paragraph).entries()) {
        if (c === p.readAloud) continue
        pool.push({ id: `${p.id}-p${pi}c${ci}`, text: c })
      }
    }
  }
  return pool
}

export const READ_ALOUD_POOL = buildReadAloudPool()

// ---------------------------------------------------------------------------
// Single index over the whole bank
// ---------------------------------------------------------------------------

const allAsq = [...ASQ_RECORDINGS.map((r) => r.item), ...PASSAGES.flatMap((p) => p.asq)]

export { PASSAGES } from './passages'

/**
 * Re-derives each answer's key terms from its own model answer.
 *
 * Content is scored on how much of the source a response conveys, and Content 0
 * gates the whole item to zero. If the hand-written key terms drift away from
 * what the model answer actually says, a candidate who reproduces the reference
 * verbatim scores nothing — which is both wrong and absurd. Deriving the terms
 * from the reference makes that impossible by construction, and the reference
 * is itself a summary of the source, so the terms still reflect the source.
 */
export function termsFromReference(reference: string, limit = 8): string[] {
  const freq = new Map<string, number>()
  for (const w of contentWords(reference)) {
    freq.set(w, (freq.get(w) ?? 0) + 1)
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([w]) => w)
}

function alignKeyTerms<T extends { keyTerms?: string[]; reference: string }>(items: T[]): T[] {
  return items.map((item) => ({ ...item, keyTerms: termsFromReference(item.reference) }))
}

export const BANK: ContentBank = {
  passages: PASSAGES,
  asq: allAsq,
  lectures: LECTURES,
  conversations: CONVERSATIONS,
  groupDiscussions: GROUP_DISCUSSIONS,
  retell: alignKeyTerms(RETELL_ITEMS),
  listeningFib: LISTENING_FIB,
  highlightSummary: HIGHLIGHT_SUMMARY,
  listeningMcqSingle: LISTENING_MCQ_SINGLE,
  listeningMcqMulti: LISTENING_MCQ_MULTI,
  missingWord: MISSING_WORD,
  highlightIncorrect: HIGHLIGHT_INCORRECT,
  dictation: DICTATION,
  spokenSummary: alignKeyTerms(SPOKEN_SUMMARY_ITEMS),
  groupDiscussionItems: alignKeyTerms(GROUP_DISCUSSION_ITEMS),
  situations: alignKeyTerms(SITUATIONS),
  charts: CHARTS,
  repeatSentences: REPEAT_SENTENCES,
}

export const AUDIO_INDEX: Map<string, AudioScript> = new Map(
  [...LECTURES, ...CONVERSATIONS, ...GROUP_DISCUSSIONS, ...ASQ_RECORDINGS.map((r) => r.audio)].map(
    (a) => [a.id, a],
  ),
)

export const PASSAGE_INDEX: Map<string, Passage> = new Map(PASSAGES.map((p) => [p.id, p]))

export const CHART_INDEX: Map<string, (typeof CHARTS)[number]> = new Map(
  CHARTS.map((c) => [c.id, c]),
)

/** Total number of distinct items the bank can produce before shuffling. */
export function bankCapacity(): number {
  const b = BANK
  return (
    b.passages.length * 7 +
    b.asq.length +
    b.retell.length +
    b.listeningFib.length +
    b.highlightSummary.length +
    b.listeningMcqSingle.length +
    b.listeningMcqMulti.length +
    b.missingWord.length +
    b.highlightIncorrect.length +
    b.dictation.length +
    b.spokenSummary.length +
    b.groupDiscussionItems.length +
    b.situations.length +
    b.charts.length +
    b.repeatSentences.length
  )
}

/** Available item ids by type, used to warn when the bank is thin. */
export function capacityByType(): Record<string, number> {
  const b = BANK
  return {
    'read-aloud': READ_ALOUD_POOL.length,
    'repeat-sentence': b.repeatSentences.length,
    'describe-image': b.charts.length,
    'retell-lecture': b.retell.length,
    'answer-short-question': b.asq.length,
    'summarize-group-discussion': b.groupDiscussionItems.length,
    'respond-to-situation': b.situations.length,
    'summarize-written-text': b.passages.length,
    'write-essay': ESSAY_PROMPTS.length,
    'fill-in-blanks-dropdown': b.passages.length,
    'fill-in-blanks-table': b.passages.length,
    'multiple-choice-single': b.passages.length,
    'multiple-choice-multiple': b.passages.length,
    'reorder-paragraphs': b.passages.length * 2,
    'summarize-spoken-text': b.spokenSummary.length,
    'fill-in-blanks-listening': b.listeningFib.length,
    'highlight-correct-summary': b.highlightSummary.length,
    'listening-multiple-choice-single': b.listeningMcqSingle.length,
    'listening-multiple-choice-multiple': b.listeningMcqMulti.length,
    'select-missing-word': b.missingWord.length,
    'highlight-incorrect-words': b.highlightIncorrect.length,
    'write-from-dictation': b.dictation.length,
  }
}

// ---------------------------------------------------------------------------
// Write Essay prompts (PTE Academic changed this type in 2024: two questions,
// 200–300 words, 20 minutes, personal choice of tone)
// ---------------------------------------------------------------------------

export interface EssayPrompt {
  id: string
  source: 'passage' | 'image' | 'real-world'
  stimulus: string
  question: string
  keyTerms: string[]
  minWords: number
  maxWords: number
}

export const ESSAY_PROMPTS: EssayPrompt[] = [
  {
    id: 'we-1',
    source: 'passage',
    stimulus: 'page-urban-heat',
    question:
      'The passage "Cities as Heat Islands" argues that a city that wished to reduce its heat island would begin by inventorying the surfaces it already has. Do you agree or disagree?',
    keyTerms: [
      'surfaces',
      'inventory',
      'heat',
      'shade',
      'planning',
      'policy',
      'evidence',
      'cities',
    ],
    minWords: 200,
    maxWords: 300,
  },
  {
    id: 'we-2',
    source: 'passage',
    stimulus: 'page-machine-translation',
    question:
      'Machine translation has improved rapidly, yet professional translators are still widely employed. Do the advantages of machine translation outweigh the need for human translators? Support your argument with relevant examples.',
    keyTerms: [
      'translation',
      'systems',
      'domain',
      'review',
      'fluency',
      'accuracy',
      'data',
      'language',
    ],
    minWords: 200,
    maxWords: 300,
  },
  {
    id: 'we-3',
    source: 'passage',
    stimulus: 'page-attention-economy',
    question:
      'The passage "The Economics of Attention" suggests that where an alternative design exists and is not the default, the burden of proof belongs to the design that captures the most attention. Do you agree or disagree? Support your argument with relevant examples.',
    keyTerms: [
      'attention',
      'design',
      'default',
      'incentive',
      'users',
      'evidence',
      'responsibility',
    ],
    minWords: 200,
    maxWords: 300,
  },
  {
    id: 'we-4',
    source: 'passage',
    stimulus: 'page-glacier-retreat',
    question:
      'The passage "The Slow Collapse of a Glacier" states that the difficulty for planners is not that the science is absent but that it describes a distribution of futures. Discuss.',
    keyTerms: [
      'glacier',
      'planning',
      'uncertainty',
      'decisions',
      'rate',
      'feedback',
      'infrastructure',
      'risk',
    ],
    minWords: 200,
    maxWords: 300,
  },
  {
    id: 'we-5',
    source: 'real-world',
    stimulus: 'Many universities have moved examinations online.',
    question:
      'Some people think that moving university examinations online has had a positive effect on academic standards. To what extent do you agree or disagree?',
    keyTerms: [
      'examinations',
      'online',
      'standards',
      'integrity',
      'universities',
      'students',
      'assessment',
      'change',
    ],
    minWords: 200,
    maxWords: 300,
  },
  {
    id: 'we-6',
    source: 'real-world',
    stimulus: 'City transport funding.',
    question:
      'The best way to reduce traffic in city centres is to make public transport free. Do you agree or disagree?',
    keyTerms: [
      'traffic',
      'transport',
      'funding',
      'city',
      'free',
      'investment',
      'policy',
      'drivers',
    ],
    minWords: 200,
    maxWords: 300,
  },
  {
    id: 'we-7',
    source: 'real-world',
    stimulus: 'A panel of practising psychologists.',
    question:
      'Technology has made learning easier, but it has also made it harder to concentrate. Do you agree or disagree?',
    keyTerms: [
      'technology',
      'learning',
      'concentration',
      'attention',
      'evidence',
      'students',
      'change',
      'habits',
    ],
    minWords: 200,
    maxWords: 300,
  },
  {
    id: 'we-8',
    source: 'real-world',
    stimulus: 'Global food supply chains.',
    question:
      'Global food supply chains are the only realistic way to feed a growing population. Do you agree or disagree?',
    keyTerms: [
      'supply chains',
      'food',
      'population',
      'trade',
      'resilience',
      'environment',
      'policy',
      'agriculture',
    ],
    minWords: 200,
    maxWords: 300,
  },
  ...EXTRA_ESSAY_PROMPTS,
  ...EXTRA_ESSAY_PROMPTS_2,
  ...EXTRA_ESSAY_PROMPTS_3,
  ...EXTRA_ESSAY_PROMPTS_4,
]

/** Deterministic helper used by the test assembler to vary distractor order. */
export function variantRng(itemId: string, seed: number): () => number {
  let h = seed >>> 0
  for (let i = 0; i < itemId.length; i++) h = (Math.imul(h, 31) + itemId.charCodeAt(i)) >>> 0
  return makeRng(h)
}
