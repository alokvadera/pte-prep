import { clamp } from '../lib/format'
import {
  averageSentenceLength,
  connectiveCount,
  contentWords,
  keyTermCoverage,
  nearMissCount,
  repetitionRatio,
  sentenceLengthVariety,
  softF1,
  wordCount,
  words,
} from '../lib/text'
import { NEGATIVE_MARKING_TYPES, QUESTION_META, primarySkill } from './blueprint'
import type { AnswerKey, Item, ItemResponse, ItemScoreDetail, Skill, TypeStat } from './types'

// ===========================================================================
// Scoring model
//
// Everything Pearson publishes is implemented exactly:
//
//   * the scoring mode per type (binary / per-blank / per-word /
//     per-unit-negated / per-adjacent-pair / trait-composite)
//   * negative marking at -1, only on the three types that use it
//   * the Content = 0 and Form = 0 gates, which zero the whole item
//   * the type-specific Form word-count bands
//   * the per-type Content scales (0-6, 0-4, 0-3)
//   * integrated items contributing to two communicative skills
//   * the official CEFR bands
//
// Two things Pearson does not publish are estimated, and only those:
//
//   * the error-count -> point conversion for Read Aloud
//   * the trait -> item score weighting, and item score -> scaled score (IRT)
//
// Constructed responses are therefore labelled as estimates per item, and the
// results page says which items were scored exactly.
// ===========================================================================

const WORD_MATCH = (answer: string, given: string): boolean =>
  answer.trim().toLowerCase() === given.trim().toLowerCase()

// ---------------------------------------------------------------------------
// Trait estimation
// ---------------------------------------------------------------------------

export interface TraitScores {
  /** 0..1, 0 = the score guide's zero for that type. */
  content: number
  /** 0..1 where the type scores Form. */
  form: number
  /** 0..1, from measured speech where available. */
  oralFluency: number
  /** 0..1, from measured speech where available. */
  pronunciation: number
  /** 0..1, writing form. */
  grammar: number
  vocabulary: number
  spelling: number
  /** 0..1, essay only. */
  development: number
  /** 0..1, essay only. */
  range: number
}

const ZERO_TRAITS: TraitScores = {
  content: 0,
  form: 0,
  oralFluency: 0,
  pronunciation: 0,
  grammar: 0,
  vocabulary: 0,
  spelling: 0,
  development: 0,
  range: 0,
}

export interface ConstructedScore {
  /** 0..1 */
  ratio: number
  notes: string[]
  traits?: TraitScores
  /** True when Content scored 0 or Form scored 0, which zeroes the item. */
  gated?: boolean
  /** The published max for this type's Content scale, for display. */
  contentMax?: number
  contentScore?: number
  formMax?: number
  formScore?: number
}

/** Oral Fluency band targets, from the published 0–5 descriptors. */
function oralFluency(
  wpm: number,
  pauses: number,
  speechRatio: number,
  wordsSpoken: number,
): { score: number; note: string } {
  if (wordsSpoken === 0 && wpm <= 0) return { score: 0, note: 'Nothing was spoken.' }
  if (wpm <= 0) {
    return { score: 0.5, note: 'Oral fluency was not measured — record the answer to score this trait.' }
  }

  // The published descriptors count hesitations *within the response*: band 4
  // allows one, band 3 allows more than one but no long pauses, band 2 allows
  // at most two or three plus one long pause. A twelve-word sentence with one
  // pause is therefore normal, so the count is used directly rather than
  // normalised per hundred words, which would make short items look terrible.
  let band = 5
  if (wpm < 90) band -= 3
  else if (wpm < 115) band -= 2
  else if (wpm < 130) band -= 1
  else if (wpm > 230) band -= 2
  else if (wpm > 195) band -= 1

  // One pause is free; a long response makes each one count for more.
  const weight = wordsSpoken < 20 ? 0.25 : wordsSpoken < 60 ? 0.6 : 1
  const burden = pauses * weight
  if (burden > 2.5) band -= 2
  else if (burden > 1) band -= 1

  if (speechRatio < 0.45) band -= 1

  const score = clamp(band / 5, 0, 1)
  const notes: string[] = []
  if (wpm < 115) notes.push(`Speaking pace was about ${wpm} wpm — the guide expects a smooth, even rhythm.`)
  if (wpm > 195) notes.push(`Speaking pace was about ${wpm} wpm — rushed delivery costs fluency.`)
  if (burden > 1) notes.push(`${pauses} long pause${pauses > 1 ? 's' : ''} inside the response; band 3 allows hesitations but no long pauses.`)
  return { score, note: notes.join(' ') }
}

/**
 * Pronunciation, estimated acoustically.
 *
 * The published scale is about whether each word is intelligible and whether
 * stress lands in the right place. Energy variation is the closest browser
 * proxy for intonation and stress, and mean pitch separates a stressed syllable
 * from a reduced one.
 */
function pronunciation(a: ItemResponse['audio'], wordsSpoken: number): { score: number; note: string } {
  if (!a || !a.reliable || (wordsSpoken === 0 && (a.wordsPerMinute ?? 0) <= 0)) {
    return { score: 0.5, note: 'Pronunciation was not measured — record the answer to score this trait.' }
  }
  const variation = clamp(a.energyVariance / 0.5, 0, 1)
  const pitch = a.meanPitchHz
  // Human conversational pitch sits around 150–220 Hz when measured this way.
  const pitchFit = pitch === null ? 0.55 : clamp(1 - Math.abs(pitch - 180) / 150, 0.25, 1)
  const intelligibility = clamp(1 - Math.max(0, 0.7 - a.speechRatio) * 0.8, 0.3, 1)
  const score = clamp(variation * 0.45 + pitchFit * 0.3 + intelligibility * 0.25, 0, 1)
  if (score < 0.4) return { score, note: 'Delivery was flat, with little variation in volume or pitch.' }
  return { score, note: '' }
}

/**
 * Form for the written types, using the published word-count bands exactly.
 *
 * Write Essay:  2 = 200–300 words · 1 = 120–199 or 301–380 · 0 = outside
 * Summarize Spoken Text: 2 = 50–70 · 1 = 40–49 or 71–100 · 0 = outside
 * Summarize Written Text: 1 = a single complete sentence · 0 = otherwise
 *
 * Every written type also scores Form 0 — zeroing the whole item — for all
 * caps, missing sentence-ending punctuation, bullet lists, or nothing but very
 * short sentences.
 */
/**
 * Splits text into sentences while protecting standard honorifics, abbreviations,
 * and acronyms (Dr., Prof., U.S., e.g., i.e., et al.) from false boundary splits.
 */
export function splitSentences(text: string): string[] {
  const protectedText = text.replace(
    /\b(Dr|Mr|Mrs|Ms|Prof|Sr|Jr|vs|etc|et al|e\.g|i\.e|U\.S|a\.m|p\.m)\./gi,
    (m) => m.slice(0, -1) + '§',
  )
  return protectedText
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.replace(/§/g, '.'))
    .filter((s) => s.trim().length > 0)
}

/**
 * The published Form 0 conditions that are not word counts: all caps, no
 * sentence-ending punctuation, bullet lists, and very-short-sentences-only.
 *
 * Form 0 zeroes the whole item, so these have to be decided before any band is
 * applied. Returns the trigger in prose, or null when none of them applies.
 */
function formZeroTrigger(text: string): string | null {
  const letters = text.replace(/[^A-Za-z]/g, '')
  // A one- or two-word answer is legitimately capitalised, so only an extended
  // response with no lower-case letter at all counts as "all caps".
  if (letters.length >= 20 && letters === letters.toUpperCase()) {
    return 'the response is in all capitals'
  }

  const trimmed = text.trim()
  if (trimmed && !/[.!?"')\]]\s*$/.test(trimmed)) {
    return 'the response has no sentence-ending punctuation'
  }

  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0)
  const bullets = lines.filter((l) => /^[-*•]/.test(l)).length
  if (lines.length >= 3 && bullets >= Math.max(3, Math.ceil(lines.length * 0.6))) {
    return 'the response is a list of bullets'
  }

  const sentences = splitSentences(text)
  if (sentences.length >= 3 && sentences.every((s) => wordCount(s) < 5)) {
    return 'the response is only very short sentences'
  }

  return null
}

export function formBand(type: Item['type'], text: string): { score: number; max: number; note: string } {
  const wc = wordCount(text)
  const hasEndPunctuation = /[.!?"')\]]\s*$/.test(text.trim())
  const sentenceCount = splitSentences(text).length
  // Form 0 gates the entire item, so it dominates every word-count band below.
  const formZero = formZeroTrigger(text)

  if (type === 'summarize-written-text') {
    // Form is 0–1 here: a single complete sentence, and 5–75 words.
    const ok = sentenceCount === 1 && hasEndPunctuation && wc >= 5 && wc <= 75 && formZero === null
    return {
      score: ok ? 1 : 0,
      max: 1,
      note: ok
        ? ''
        : `Form 0: ${formZero ?? 'the summary must be one complete sentence of 5–75 words'} — form 0 scores the item at zero.`,
    }
  }

  if (type === 'write-essay') {
    if (formZero) return { score: 0, max: 1, note: `Form 0: ${formZero} — form 0 scores the item at zero.` }
    if (wc >= 200 && wc <= 300) return { score: 1, max: 1, note: '' }
    if ((wc >= 120 && wc <= 199) || (wc >= 301 && wc <= 380)) {
      return { score: 0.5, max: 1, note: `Form 1: ${wc} words — the top band is 200 to 300.` }
    }
    return {
      score: 0,
      max: 1,
      note: `Form 0: ${wc} words — outside 120–380, and form 0 scores the item at zero.`,
    }
  }

  if (type === 'summarize-spoken-text') {
    if (formZero) return { score: 0, max: 1, note: `Form 0: ${formZero} — form 0 scores the item at zero.` }
    if (wc >= 50 && wc <= 70) return { score: 1, max: 1, note: '' }
    if ((wc >= 40 && wc <= 49) || (wc >= 71 && wc <= 100)) {
      return { score: 0.5, max: 1, note: `Form 1: ${wc} words — the top band is 50 to 70.` }
    }
    return {
      score: 0,
      max: 1,
      note: `Form 0: ${wc} words — outside 40–100, and form 0 scores the item at zero.`,
    }
  }

  // Any remaining written type keeps the generic band, Form 0 still dominant.
  if (formZero) return { score: 0, max: 1, note: `Form 0: ${formZero} — form 0 scores the item at zero.` }
  return { score: 0.5, max: 1, note: '' }
}

function writingQuality(text: string, keyTerms: string[]): { grammar: number; vocabulary: number; spelling: number; note: string } {
  const wc = wordCount(text)
  if (wc === 0) return { grammar: 0, vocabulary: 0, spelling: 0, note: '' }

  const nearMiss = nearMissCount(text, keyTerms)
  const spelling = clamp(1 - nearMiss / Math.max(3, wc * 0.06), 0, 1)
  const rep = repetitionRatio(text)
  const vocabulary = clamp(softF1(text, keyTerms) * 0.5 + clamp((wc - 20) / 120, 0, 1) * 0.5, 0, 1)
  // A rough structure proxy standing in for grammatical control: sentence
  // completeness and the absence of the most common failure of a single clause.
  const fragments = splitSentences(text).filter((s) => !/[A-Za-z]/.test(s)).length
  const grammar = clamp(1 - rep * 0.6 - fragments * 0.1, 0.25, 1)

  const notes: string[] = []
  if (nearMiss > 2) notes.push(`${nearMiss} probable spelling errors in key vocabulary.`)
  if (rep > 0.2) notes.push('The same words recur often, which reads as limited grammatical control.')
  return { grammar, vocabulary, spelling, note: notes.join(' ') }
}

function developmentScore(text: string, isEssay: boolean): { development: number; range: number; note: string } {
  const wc = wordCount(text)
  if (wc === 0) return { development: 0, range: 0, note: '' }
  const sents = splitSentences(text)
  const connectives = connectiveCount(text)
  const asl = averageSentenceLength(text)
  const variety = sentenceLengthVariety(text)
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length
  const notes: string[] = []

  if (isEssay) {
    // Development, Structure and Coherence 0–6.
    let d = 0
    if (paragraphs >= 3) d += 2
    else if (paragraphs === 2) d += 1
    if (connectives >= 4) d += 2
    else if (connectives >= 2) d += 1
    if (sents.length >= 10) d += 1
    if (variety > 0.3) d += 1
    if (paragraphs < 3) notes.push('The guide expects an introduction, body paragraphs and a conclusion; band 6 is unlikely below three paragraphs.')
    if (connectives < 2) notes.push('Very few linking words — the ideas read as a list rather than an argument.')

    // General Linguistic Range 0–6.
    const r = clamp((asl - 8) / 20, 0, 1) * 2 + clamp((variety - 0.15) / 0.45, 0, 1) * 2 + clamp(connectives / 4, 0, 1) * 2
    return { development: clamp(d / 6, 0, 1), range: clamp(r / 6, 0, 1), note: notes.join(' ') }
  }

  const d = clamp(connectives / 2, 0, 1) * 0.6 + clamp(sents.length / 3, 0, 1) * 0.4
  const r = clamp((asl - 7) / 18, 0, 1) * 0.5 + clamp((variety - 0.12) / 0.4, 0, 1) * 0.5
  return { development: d, range: r, note: notes.join(' ') }
}

/** Content for a target-text item: the published error-count basis, estimated. */
function contentAgainstTarget(spoken: string, reference: string): { content: number; note: string } {
  if (!spoken) return { content: 0, note: '' }
  const ref = contentWords(reference)
  if (ref.length === 0) return { content: 0, note: '' }
  const got = contentWords(spoken)
  if (got.length === 0) return { content: 0, note: 'No content words from the prompt were produced.' }

  // Replacements, omissions and insertions are errors; extra leading and
  // trailing material is explicitly ignored.
  let matched = 0
  let cursor = -1
  for (const w of ref) {
    const idx = got.indexOf(w, cursor + 1)
    if (idx > cursor) {
      matched += 1
      cursor = idx
    }
  }
  const hitRate = matched / ref.length
  // Order matters too, so blend in the in-sequence match above.
  return {
    content: clamp(hitRate, 0, 1),
    note: hitRate >= 0.999 ? '' : `About ${Math.round(hitRate * 100)}% of the prompt's words were reproduced in the correct sequence.`,
  }
}

/** Content for a summary-style item: key-term coverage, length-aware. */
function contentAgainstTerms(spoken: string, keyTerms: string[]): { content: number; note: string } {
  if (!spoken) return { content: 0, note: '' }
  const coverage = keyTermCoverage(spoken, keyTerms)
  const match = softF1(spoken, keyTerms)
  const content = clamp(coverage * 0.6 + match * 0.4, 0, 1)
  const notes: string[] = []
  // This note is only shown when Content itself is zero. A low-but-non-zero
  // coverage still earns `match * 0.4`, so the item does NOT score zero here
  // and the feedback must not claim that it does.
  if (content <= 0) notes.push('Nothing from the source made it into the response, so Content scores 0 and the item scores zero however well it was delivered.')
  else if (coverage < 0.25) notes.push('Very few of the main points from the source were captured.')
  else if (coverage < 0.5) notes.push('Only some of the main points were captured.')
  else if (coverage < 0.8) notes.push('Most main points were captured, with some important detail missing.')
  return { content, note: notes.join(' ') }
}

// ---------------------------------------------------------------------------
// Composite scoring
// ---------------------------------------------------------------------------

/** Published Content maximum per type. */
export const CONTENT_MAX: Partial<Record<Item['type'], number>> = {
  'read-aloud': 3,
  'describe-image': 6,
  'retell-lecture': 6,
  'summarize-group-discussion': 6,
  'respond-to-situation': 6,
  'write-essay': 6,
  'summarize-written-text': 4,
  'summarize-spoken-text': 4,
  'repeat-sentence': 3,
}

function scoreSpoken(
  item: Item,
  response: ItemResponse,
  key: AnswerKey,
): ConstructedScore {
  const notes: string[] = []
  const transcript = (response.transcript ?? '').trim()
  const typed = (response.text ?? '').trim()
  const spoken = transcript || typed
  const analysis = response.audio
  const isTargetText = item.type === 'read-aloud' || item.type === 'repeat-sentence'
  const maxContent = CONTENT_MAX[item.type] ?? (isTargetText ? 3 : 5)

  if (!spoken && !analysis) {
    return {
      ratio: 0,
      notes: ['No answer was recorded or typed.'],
      traits: { ...ZERO_TRAITS },
      contentScore: 0,
      contentMax: maxContent,
      gated: true,
    }
  }

  const reference = key.reference ?? item.targetText ?? ''
  const contentResult = isTargetText
    ? contentAgainstTarget(spoken, reference)
    : contentAgainstTerms(spoken, key.keyTerms ?? [])
  if (contentResult.note) notes.push(contentResult.note)

  const spokenWords = wordCount(spoken)
  const wpm = analysis?.wordsPerMinute ?? 0
  const speechRatio = analysis?.speechRatio ?? 0
  const pauses = analysis?.pauseCount ?? 0

  const of = oralFluency(wpm, pauses, speechRatio, spokenWords)
  if (of.note) notes.push(of.note)
  const pr = pronunciation(analysis, spokenWords)
  if (pr.note) notes.push(pr.note)

  const traits: TraitScores = {
    ...ZERO_TRAITS,
    content: contentResult.content,
    oralFluency: of.score,
    pronunciation: pr.score,
    vocabulary: clamp(contentResult.content * 0.6 + (spokenWords > 12 ? 0.4 : 0.2), 0, 1),
    range: rangeFromText(spoken),
  }

  // The published gate: Content 0 means no points at all for the item,
  // EXCEPT when speech was recorded but the browser lacked Web Speech (no transcript).
  if (contentResult.content <= 0) {
    if (!spoken && analysis && wpm > 0) {
      // Degrade gracefully when Web Speech is unavailable (Safari / Firefox).
      // Delivery traits (oral fluency + pronunciation) score the acoustic response.
      const deliveryRatio = clamp((of.score * 0.28 + pr.score * 0.17) / 0.45, 0, 1)
      notes.push("Content words could not be checked for this browser's speech recognition.")
      return {
        ratio: deliveryRatio,
        notes,
        traits,
        contentScore: 0,
        contentMax: maxContent,
        gated: false,
      }
    }
    return {
      ratio: 0,
      notes: [...notes, 'Content scored 0, so the item scores zero regardless of delivery.'],
      traits,
      gated: true,
      contentScore: 0,
      contentMax: maxContent,
    }
  }

  // Content, Pronunciation and Oral Fluency combine into the item score. The
  // weighting is not published; these weights reflect how much each trait can
  // move a band, and are the part of the estimate that is explicitly owned.
  const ratio = clamp(
    contentResult.content * 0.45 + of.score * 0.28 + pr.score * 0.17 + traits.range * 0.1,
    0,
    1,
  )

  return {
    ratio,
    notes,
    traits,
    contentScore: contentResult.content * maxContent,
    contentMax: maxContent,
  }
}

function rangeFromText(text: string): number {
  const wc = wordCount(text)
  if (wc === 0) return 0
  const asl = averageSentenceLength(text)
  const variety = sentenceLengthVariety(text)
  return clamp(clamp((asl - 7) / 20, 0, 1) * 0.5 + clamp((variety - 0.12) / 0.45, 0, 1) * 0.5, 0, 1)
}

function scoreWritten(item: Item, response: ItemResponse, key: AnswerKey): ConstructedScore {
  const text = (response.text ?? '').trim()
  if (!text) {
    return {
      ratio: 0,
      notes: ['No response was written.'],
      traits: { ...ZERO_TRAITS },
      gated: true,
    }
  }

  const keyTerms = key.keyTerms ?? []
  const contentResult = contentAgainstTerms(text, keyTerms)
  const form = formBand(item.type, text)
  const quality = writingQuality(text, keyTerms)
  const structure = developmentScore(text, item.type === 'write-essay')
  const notes: string[] = []
  if (contentResult.note) notes.push(contentResult.note)
  if (form.note) notes.push(form.note)
  if (quality.note) notes.push(quality.note)
  if (structure.note) notes.push(structure.note)

  const traits: TraitScores = {
    ...ZERO_TRAITS,
    content: contentResult.content,
    form: form.score,
    grammar: quality.grammar,
    vocabulary: quality.vocabulary,
    spelling: quality.spelling,
    development: structure.development,
    range: structure.range,
  }

  // The published two-stage gate: Content 0 or Form 0 zeroes the item.
  if (contentResult.content <= 0 || form.score <= 0) {
    const why =
      contentResult.content <= 0 && form.score <= 0
        ? 'Content and Form both scored 0'
        : contentResult.content <= 0
          ? 'Content scored 0'
          : 'Form scored 0'
    return {
      ratio: 0,
      notes: [...notes, `${why}, so the item scores zero.`],
      traits,
      gated: true,
      formScore: form.score * form.max,
      formMax: form.max,
      contentScore: contentResult.content * (CONTENT_MAX[item.type] ?? 4),
      contentMax: CONTENT_MAX[item.type],
    }
  }

  // The 2012 guide's additive model, applied to the current trait scales. The
  // current guide deliberately does not publish a weighting, so this is the
  // estimate, and the only part of the composite that is not derived.
  //
  // Only Write Essay scores Development/Structure/Coherence and General
  // Linguistic Range. Summarize Written and Spoken Text score Content, Form,
  // Grammar, Vocabulary and Spelling, so including those two traits would
  // punish a correct one-sentence summary for not building an argument.
  const isEssay = item.type === 'write-essay'
  const parts: Array<[number, number]> = [
    [contentResult.content, CONTENT_MAX[item.type] ?? 4],
    [form.score, form.max],
    [quality.grammar, 2],
    [quality.vocabulary, 2],
    [quality.spelling, 2],
  ]
  if (isEssay) {
    parts.push([structure.development, 6], [structure.range, 6])
  }
  const earned = parts.reduce((a, [v, max]) => a + v * max, 0)
  const possible = parts.reduce((a, [, max]) => a + max, 0)

  return {
    ratio: clamp(earned / possible, 0, 1),
    notes,
    traits,
    formScore: form.score * form.max,
    formMax: form.max,
    contentScore: contentResult.content * (CONTENT_MAX[item.type] ?? 4),
    contentMax: CONTENT_MAX[item.type],
  }
}

function scoreAnswerShortQuestion(response: ItemResponse, key: AnswerKey): ConstructedScore {
  const typed = (response.text ?? '').trim()
  const spoken = (response.transcript ?? '').trim()
  const given = typed || spoken
  if (!given) return { ratio: 0, notes: ['No answer was given.'] }

  const normalize = (v: string) => v.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()
  const accepted = (key.blanks ?? []).map((b) => b[0] ?? '').filter(Boolean)
  const candidates = accepted.length > 0 ? accepted : [key.correctChoice ?? '']
  const normGiven = normalize(given)

  // Vocabulary 1 = appropriate word choice, 0 = inappropriate. No partial band.
  if (candidates.some((c) => WORD_MATCH(normalize(c), normGiven))) {
    return { ratio: 1, notes: [], traits: { ...ZERO_TRAITS, vocabulary: 1 } }
  }
  if (candidates.some((c) => normGiven.split(' ').includes(normalize(c)))) {
    const wc = words(given).length
    return {
      ratio: 1,
      notes: wc > 4 ? ['Correct, but the guide expects one to four words for this type.'] : [],
      traits: { ...ZERO_TRAITS, vocabulary: 1 },
    }
  }
  return {
    ratio: 0,
    notes: [`Vocabulary 0: inappropriate word choice. Expected “${candidates[0]}”.`],
    traits: { ...ZERO_TRAITS },
  }
}

// ---------------------------------------------------------------------------
// Per-unit scorers
// ---------------------------------------------------------------------------

function scoreBlanks(response: ItemResponse, key: AnswerKey): ConstructedScore {
  const values = response.blanks ?? []
  const answers = key.blanks ?? []
  if (answers.length === 0) return { ratio: 0, notes: ['Not scored.'] }

  const normalize = (v: string) => v.trim().toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()
  let hits = 0
  const missed: number[] = []
  answers.forEach((accepted, i) => {
    const given = values[i]
    if (given && accepted.some((a) => normalize(a) === normalize(given))) hits += 1
    else missed.push(i)
  })

  const notes: string[] = []
  if (missed.length > 0) {
    notes.push(
      `${hits} of ${answers.length} correct. The answers were ${missed
        .map((i) => `“${answers[i]?.[0] ?? ''}”`)
        .join(', ')}.`,
    )
  }
  return { ratio: hits / answers.length, notes }
}

/** Write from Dictation and listening Fill in the Blanks: one point per word. */
function scoreWordByWord(response: ItemResponse, key: AnswerKey): ConstructedScore {
  const reference = key.reference ?? ''
  const expected = words(reference)
  if (expected.length === 0) return { ratio: 0, notes: ['Not scored.'] }

  const given = words((response.text ?? '').trim())
  const normalize = (v: string) => v.toLowerCase().replace(/[^a-z]/g, '')
  const expectedNorm = expected.map(normalize)
  const givenNorm = given.map(normalize)

  // Pearson PTE Academic awards one point per reference word produced, regardless
  // of position or insertion/omission offsets, with no deduction for extra words.
  const remaining = new Map<string, number>()
  for (const w of expectedNorm) {
    if (w) remaining.set(w, (remaining.get(w) ?? 0) + 1)
  }

  let hits = 0
  for (const w of givenNorm) {
    const count = remaining.get(w) ?? 0
    if (count > 0) {
      hits += 1
      remaining.set(w, count - 1)
    }
  }

  // Identify missed reference words in original sentence order
  const wrongWords: string[] = []
  for (let i = 0; i < expected.length; i++) {
    const norm = expectedNorm[i]!
    const unhit = remaining.get(norm) ?? 0
    if (unhit > 0) {
      wrongWords.push(expected[i] as string)
      remaining.set(norm, unhit - 1)
    }
  }

  const notes: string[] = []
  if (wrongWords.length > 0) {
    notes.push(`${hits} of ${expected.length} words correct. ${wrongWords.slice(0, 5).join(', ')}${wrongWords.length > 5 ? '…' : ''}`)
  }
  return { ratio: hits / expected.length, notes }
}

/** Multiple Choice Multiple Answers and Highlight Incorrect Words. */
function scoreNegated(correctSet: Set<number | string>, given: Array<number | string>): ConstructedScore {
  const uniqueGiven = new Set(given)
  let correct = 0
  let incorrect = 0
  for (const unit of uniqueGiven) {
    if (correctSet.has(unit)) correct += 1
    else incorrect += 1
  }
  if (uniqueGiven.size === 0) return { ratio: 0, notes: ['Nothing was selected.'] }

  const total = correctSet.size
  const earned = Math.max(0, correct - incorrect) // floored at zero
  const notes: string[] = []
  if (incorrect > 0) {
    notes.push(
      `${correct} correct and ${incorrect} incorrect. Each wrong selection subtracts a point, so the item scored ${earned}.`,
    )
  }
  if (correct < total) notes.push(`${total - correct} of the ${total} correct options were missed.`)
  return { ratio: total > 0 ? earned / total : 0, notes }
}

/** Re-order Paragraphs: one point per correctly ordered adjacent pair. */
function scoreAdjacentPairs(response: ItemResponse, key: AnswerKey): ConstructedScore {
  const correct = key.order ?? []
  const given = response.order ?? []
  if (correct.length === 0) return { ratio: 0, notes: ['Not scored.'] }

  const maxPairs = correct.length - 1
  if (given.length !== correct.length) {
    return { ratio: 0, notes: ['All the boxes must be placed before the item can score.'] }
  }

  const positionOf = new Map<string, number>()
  correct.forEach((id, i) => positionOf.set(id, i))
  let correctPairs = 0
  for (let i = 0; i < maxPairs; i++) {
    const a = positionOf.get(given[i] as string)
    const b = positionOf.get(given[i + 1] as string)
    if (a === undefined || b === undefined) continue
    if (b === a + 1) correctPairs += 1
  }

  const notes: string[] = []
  if (correctPairs < maxPairs) {
    notes.push(
      `${correctPairs} of ${maxPairs} adjacent pairs are in the correct order. Getting a run of three boxes right earns two points.`,
    )
  }
  return { ratio: correctPairs / maxPairs, notes }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Published maximum points for an item given its question type and answer key.
 *
 * Shared between the assembler and the scorer so they cannot drift:
 *   - Re-order Paragraphs: 1 point per correctly ordered adjacent pair (N-1)
 *   - Write from Dictation: 1 point per reference word
 *   - Multiple Choice Multiple (Reading & Listening): 1 point per correct option
 *   - Highlight Incorrect Words: 1 point per incorrect word in transcript
 *   - Fill in the Blanks (all 3 types): 1 point per blank
 *   - Binary & trait-composite: 1 point (or 0 for personal introduction)
 */
export function expectedMaxPoints(type: Item['type'], key: AnswerKey): number {
  switch (type) {
    case 'reorder-paragraphs':
      return Math.max(1, (key.order?.length ?? 1) - 1)
    case 'write-from-dictation':
      return Math.max(1, words(key.reference ?? '').length)
    case 'multiple-choice-multiple':
    case 'listening-multiple-choice-multiple':
      return Math.max(1, key.correctChoices?.length ?? 1)
    case 'highlight-incorrect-words':
      return Math.max(1, key.correctHighlighted?.length ?? 1)
    case 'fill-in-blanks-dropdown':
    case 'fill-in-blanks-table':
    case 'fill-in-blanks-listening':
      return Math.max(1, key.blanks?.length ?? 1)
    default:
      return 1
  }
}

export function scoreItem(item: Item, key: AnswerKey, response: ItemResponse | undefined): ItemScoreDetail {
  const meta = QUESTION_META[item.type]
  const r = response ?? {}
  const base = { itemId: item.id, type: item.type, label: meta.label, skills: item.skills, maxPoints: item.maxPoints }

  const finish = (ratio: number, notes: string[], detail?: Partial<ItemScoreDetail>): ItemScoreDetail => {
    const points = Math.max(0, Math.min(item.maxPoints, ratio * item.maxPoints))
    const status: ItemScoreDetail['status'] = ratio === 0 ? 'incorrect' : ratio >= 0.999 ? 'correct' : 'partial'
    return { ...base, points, ratio, status, notes, reference: key.reference, tokens: item.tokens, ...detail }
  }

  const constructed =
    meta.scoring === 'trait-composite'
      ? item.responseKind === 'text'
        ? scoreWritten(item, r, key)
        : item.type === 'answer-short-question'
          ? scoreAnswerShortQuestion(r, key)
          : scoreSpoken(item, r, key)
      : null

  switch (meta.scoring) {
    case 'binary': {
      const choice = r.choice ?? null
      if (item.type === 'answer-short-question') {
        const s = scoreAnswerShortQuestion(r, key)
        return finish(s.ratio, s.notes, s.traits ? { traits: s.traits } : {})
      }
      if (!choice) return finish(0, ['Not answered.'])
      if (WORD_MATCH(choice, key.correctChoice ?? '')) return finish(1, [])
      return finish(0, ['Incorrect option.'])
    }

    case 'per-blank': {
      const s = scoreBlanks(r, key)
      return finish(s.ratio, s.notes)
    }

    case 'per-word': {
      const s = scoreWordByWord(r, key)
      return finish(s.ratio, s.notes)
    }

    case 'per-adjacent-pair': {
      const s = scoreAdjacentPairs(r, key)
      return finish(s.ratio, s.notes)
    }

    case 'per-unit-negated': {
      if (item.type === 'highlight-incorrect-words') {
        const correct = new Set(key.correctHighlighted ?? [])
        const s = scoreNegated(correct, r.highlighted ?? [])
        return finish(s.ratio, s.notes)
      }
      const correct = new Set((key.correctChoices ?? []).map((c) => c.toLowerCase()))
      const s = scoreNegated(correct, (r.choices ?? []).map((c) => c.toLowerCase()))
      return finish(s.ratio, s.notes)
    }

    case 'trait-composite': {
      if (!constructed) return finish(0, ['Not scored.'])
      return finish(
        constructed.ratio,
        constructed.notes,
        constructed.traits
          ? {
              traits: constructed.traits,
              ...(constructed.contentMax ? { contentMax: constructed.contentMax } : {}),
              ...(constructed.formMax ? { formMax: constructed.formMax } : {}),
              ...(constructed.gated ? { gated: true } : {}),
            }
          : {},
      )
    }
  }
}

// ---------------------------------------------------------------------------
// Scale conversion and aggregation
// ---------------------------------------------------------------------------

/**
 * Convert a raw accuracy fraction to the PTE 10–90 scale.
 *
 * Pearson's published scale is a scaled score produced by IRT, and those
 * parameters are not published, so this cannot be reproduced. What follows
 * matches the observable shape of the real scale — 10 at zero, 90 at full
 * marks, close to linear in the middle, compressed at the ends — and is
 * reported in the 0.5 increments Pearson uses. The score is labelled an
 * estimate everywhere it appears.
 */
/**
 * The one free parameter in the conversion below.
 *
 * It reproduces the observable *shape* of the published scale — 10 at zero, 90
 * at full marks, close to linear through the middle, compressed at the ends —
 * but it is not Pearson's parameter, because Pearson's IRT parameters are not
 * published. It is the only number in the whole scoring path that a different,
 * equally reasonable author could have written differently while still
 * producing an equally plausible-looking scale, which makes it the honest place
 * to measure sensitivity.
 */
const SCALE_SHAPE = 0.92

export function rawToPteScale(fraction: number): number {
  const f = clamp(fraction, 0, 1)
  const shaped = Math.pow(f, SCALE_SHAPE)
  return Math.round((10 + 80 * shaped) * 2) / 2
}

/**
 * How far the conversion could be wrong, as a range around the same estimate.
 *
 * This is **not** a confidence interval, a probability, or a standard error,
 * and the UI must not call it one. Scoring here is fully deterministic — the
 * same responses always produce the same score — so there is no sampling
 * distribution to take quantiles from and no honest way to put a probability
 * on this number. What can be bounded is the error in the mapping itself: hold
 * the candidate's accuracy fixed and vary the shape exponent across the range
 * the docstring above describes, and the reported score moves.
 *
 * The bounds are a stated judgement, not a derived interval. `high` is the
 * exactly-linear case, which is the one reading of "close to linear in the
 * middle" that needs no curvature at all. `low` is a stronger end-compression
 * than the one chosen. Both are defensible; neither is measurably right, and
 * the point of showing the band is that the reader is not asked to prefer one.
 *
 * The resulting band is deliberately **asymmetric and score-dependent**. It is
 * widest through the middle of the scale and collapses to nothing at 90,
 * because that is what the sensitivity analysis produces. A symmetric interval
 * drawn here would be a different and less honest claim.
 */
const SCALE_SHAPE_BOUNDS = { low: 0.8, high: 1 } as const

export interface ScoreBand {
  low: number
  mid: number
  high: number
}

export function scoreBand(fraction: number, score: number): ScoreBand {
  const f = clamp(fraction, 0, 1)
  const at = (e: number) => Math.round((10 + 80 * Math.pow(f, e)) * 2) / 2
  // A lower exponent raises the score, so name the ends by value, not by which
  // bound produced them.
  const a = at(SCALE_SHAPE_BOUNDS.low)
  const b = at(SCALE_SHAPE_BOUNDS.high)
  // The midpoint is the score the caller is displaying, not a re-derivation of
  // it. The stored totals are rounded to 2dp before they reach this module, so
  // re-deriving from the fraction can disagree with the shown score by half a
  // point and put the marker outside its own rail. Folding the shown score
  // into the bounds makes that impossible by construction rather than by luck.
  return {
    low: Math.min(a, b, score),
    mid: score,
    high: Math.max(a, b, score),
  }
}

export interface ScoreReport {
  overall: number
  /** Deprecated legacy field: retained for backward compatibility with database schema. */
  overall60: number
  cefr: string
  skills: Partial<Record<Skill, number>>
  availablePoints: number
  earnedPoints: number
  details: ItemScoreDetail[]
  breakdown: Record<string, TypeStat>
  estimatedItemIds: string[]
  autoScoredItemIds: string[]
}

export function buildReport(
  items: Item[],
  answers: Record<string, AnswerKey>,
  responses: Record<string, ItemResponse>,
  metaById: Record<string, { skills: Skill[]; type: Item['type']; label: string }>,
): ScoreReport {
  const details: ItemScoreDetail[] = []
  // An integrated item's points feed both of its skills.
  const skillEarned: Record<string, number> = {}
  const skillAvailable: Record<string, number> = {}
  const estimatedItemIds: string[] = []
  const autoScoredItemIds: string[] = []

  for (const item of items) {
    const key = answers[item.id]
    if (!key) continue
    const detail = scoreItem(item, key, responses[item.id])
    details.push(detail)

    const skills = item.skills.length > 0 ? item.skills : ([primarySkill(item.type)] as Skill[])
    for (const skill of skills) {
      skillEarned[skill] = (skillEarned[skill] ?? 0) + detail.points
      skillAvailable[skill] = (skillAvailable[skill] ?? 0) + item.maxPoints
    }

    if (QUESTION_META[item.type].scoring === 'trait-composite') estimatedItemIds.push(item.id)
    else autoScoredItemIds.push(item.id)
  }

  const skills: Partial<Record<Skill, number>> = {}
  let totalEarned = 0
  let totalAvailable = 0
  for (const skill of ['speaking', 'writing', 'reading', 'listening'] as Skill[]) {
    const available = skillAvailable[skill] ?? 0
    if (available === 0) continue
    const earned = skillEarned[skill] ?? 0
    skills[skill] = rawToPteScale(earned / available)
  }
  for (const item of items) {
    const key = answers[item.id]
    if (!key) continue
    const detail = details.find((d) => d.itemId === item.id)
    if (!detail) continue
    totalEarned += detail.points
    totalAvailable += item.maxPoints
  }

  // Pearson: "the overall score is not an average calculation of the
  // communicative skills scores" — it is one IRT scaling over all item scores.
  // Ours is derived from the same item points, which is the closest honest
  // approximation, and is labelled an estimate.
  const overall = totalAvailable > 0 ? rawToPteScale(totalEarned / totalAvailable) : 10

  const breakdown: Record<string, TypeStat> = {}
  for (const item of items) {
    const detail = details.find((d) => d.itemId === item.id)
    if (!detail) continue
    const stat = breakdown[item.type] ?? {
      type: item.type,
      label: metaById[item.id]?.label ?? detail.label,
      skill: primarySkill(item.type),
      correct: 0,
      partial: 0,
      incorrect: 0,
      total: 0,
      maxPoints: 0,
      earnedPoints: 0,
      seconds: 0,
    }
    stat.total += 1
    stat.maxPoints += item.maxPoints
    stat.earnedPoints += detail.points
    stat.seconds += responses[item.id]?.secondsOnItem ?? 0
    if (detail.status === 'correct') stat.correct += 1
    else if (detail.status === 'partial') stat.partial += 1
    else stat.incorrect += 1
    breakdown[item.type] = stat
  }

  return {
    overall,
    overall60: overall + 50,
    cefr: toCefr(overall),
    skills,
    availablePoints: round2(totalAvailable),
    earnedPoints: round2(totalEarned),
    details,
    breakdown,
    estimatedItemIds,
    autoScoredItemIds,
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/**
 * Official CEFR bands for the PTE Academic 10–90 scale, from the Institution
 * Score Guide (July 2025) and pearsonpte.com. Pearson publishes these for the
 * overall score only; per-skill bands do not exist publicly.
 */
const BANDS: Array<{ min: number; band: string; label: string }> = [
  { min: 85, band: 'C2', label: 'Exceptional' },
  { min: 76, band: 'C1', label: 'Advanced' },
  { min: 59, band: 'B2', label: 'Upper intermediate' },
  { min: 43, band: 'B1', label: 'Intermediate' },
  { min: 30, band: 'A2', label: 'Elementary' },
  { min: 10, band: 'A1', label: 'Basic' },
]

export function toCefr(score10to90: number): string {
  for (const b of BANDS) if (score10to90 >= b.min) return b.band
  return 'A1'
}

export function cefrLabel(band: string): string {
  return BANDS.find((b) => b.band === band)?.label ?? ''
}

/** The band immediately above the one given, or null at the top. */
export function nextBand(band: string): { min: number; band: string } | null {
  const i = bandIndex(band)
  if (i <= 0) return null
  const b = BANDS[i - 1]
  return b ? { min: b.min, band: b.band } : null
}

/** The full band table, for the score guide page and the range bar. */
export const CEFR_BANDS: ReadonlyArray<{ min: number; band: string; label: string }> = [
  ...BANDS,
]

/** Official PTE Academic ↔ IELTS concordance, Pearson July 2025. */
export const IELTS_CONCORDANCE: ReadonlyArray<{ band: string; min: number; max: number }> = [
  { band: '9.0', min: 90, max: 90 },
  { band: '8.5', min: 86, max: 89 },
  { band: '8.0', min: 79, max: 85 },
  { band: '7.5', min: 71, max: 78 },
  { band: '7.0', min: 63, max: 70 },
  { band: '6.5', min: 55, max: 62 },
  { band: '6.0', min: 47, max: 54 },
  { band: '5.5', min: 39, max: 46 },
  { band: '5.0', min: 31, max: 38 },
  { band: '4.5', min: 24, max: 30 },
]

export function pteToIelts(score: number): string | null {
  const row = IELTS_CONCORDANCE.find((r) => score >= r.min && score <= r.max)
  return row ? row.band : null
}

function bandIndex(band: string): number {
  return BANDS.findIndex((b) => b.band === band)
}

export const ADMISSION_TARGETS = [
  { label: 'Many UK universities', range: '50–60', note: 'Most undergraduate UK courses ask for 50–60, with some demanding 59–63.' },
  { label: 'Postgraduate / taught', range: '60–70', note: 'Common minimum for taught postgraduate and professional programmes.' },
  { label: 'Teacher registration', range: '63+', note: 'Required by several teaching councils before registration.' },
  { label: 'Competitive courses', range: '70+', note: 'Medicine, dentistry and law frequently set higher thresholds.' },
]

export { NEGATIVE_MARKING_TYPES }
