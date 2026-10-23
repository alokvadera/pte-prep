const WORD_RE = /[A-Za-z][A-Za-z'’-]*/g

export function words(text: string): string[] {
  return text.match(WORD_RE) ?? []
}

export function wordCount(text: string): number {
  return words(text).length
}

export function sentences(text: string): string[] {
  // Standard honorifics, abbreviations and acronyms end in a period but do not
  // end a sentence: "Dr. Smith arrived." is one sentence, not two. Masking
  // them before the split keeps the count right, and the mask is restored
  // afterwards so the text itself is unchanged.
  const protectedText = text.replace(
    /\b(Dr|Mr|Mrs|Ms|Prof|Sr|Jr|vs|etc|et al|e\.g|i\.e|U\.S|a\.m|p\.m)\./gi,
    (m) => m.slice(0, -1) + '§',
  )
  return protectedText
    .split(/(?<=[.!?])\s+(?=[A-Z"'“(])/)
    .map((s) => s.replace(/§/g, '.').trim())
    .filter((s) => s.length > 0)
}

export function normalizeWord(word: string): string {
  return word.toLowerCase().replace(/[^a-z]/g, '')
}

const STOPWORDS = new Set(
  [
    'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'as', 'at',
    'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'can', 'cannot',
    'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had',
    'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'i',
    'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'me', 'more', 'most', 'my', 'myself', 'no',
    'nor', 'not', 'now', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours',
    'ourselves', 'out', 'over', 'own', 'rather', 'same', 'she', 'should', 'so', 'some', 'such', 'than',
    'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they', 'this',
    'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'we', 'were', 'what', 'when',
    'where', 'which', 'while', 'who', 'whom', 'why', 'will', 'with', 'would', 'you', 'your', 'yours',
    'yourself', 'yourselves', 'also', 'however', 'therefore', 'thus', 'may', 'might', 'must', 'shall',
    'within', 'upon', 'although', 'though', 'whereas', 'whether', 'often', 'many', 'much', 'one', 'two',
  ].map(normalizeWord),
)

export function contentWords(text: string): string[] {
  return words(text).map(normalizeWord).filter(isContentWord)
}

/** A word counts toward content coverage if it is not a stopword and long enough. */
export function isContentWord(word: string): boolean {
  const w = normalizeWord(word)
  return w.length > 2 && !STOPWORDS.has(w)
}

/** Distinct content words from a list of raw terms, punctuation stripped. */
export function contentTermSet(terms: readonly string[]): Set<string> {
  return new Set(terms.filter(isContentWord).map(normalizeWord))
}

/**
 * Recall-weighted match between a candidate and a list of key terms.
 *
 * Plain F1 divides by the candidate's own length, so a candidate who develops
 * their answer at length is punished for it. PTE content scoring is about how
 * much of the source was conveyed, not how tersely, so the length term is
 * capped: short answers are penalised, long ones are not.
 */
export function softF1(candidate: string, referenceTerms: readonly string[]): number {
  const ref = contentTermSet(referenceTerms)
  if (ref.size === 0) return 0
  const cand = new Set(contentWords(candidate))
  if (cand.size === 0) return 0

  let hits = 0
  for (const w of ref) if (cand.has(w)) hits += 1
  if (hits === 0) return 0

  const recall = hits / ref.size
  const lengthFit = Math.min(1, cand.size / ref.size)
  return (2 * recall * lengthFit) / (recall + lengthFit)
}

/** Proportion of reference key terms present in the candidate. */
export function keyTermCoverage(candidate: string, referenceTerms: readonly string[]): number {
  if (referenceTerms.length === 0) return 0
  const ref = contentTermSet(referenceTerms)
  if (ref.size === 0) return 0
  const cand = new Set(contentWords(candidate))
  let hits = 0
  for (const t of ref) if (cand.has(t)) hits += 1
  return hits / ref.size
}


/** Levenshtein distance with a cheap length guard. */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  const m = a.length
  const n = b.length
  if (m === 0) return n
  if (n === 0) return m
  if (Math.abs(m - n) / Math.max(m, n) > 0.6) return Math.max(m, n)

  let prev = new Array<number>(n + 1)
  let curr = new Array<number>(n + 1)
  for (let j = 0; j <= n; j++) prev[j] = j

  for (let i = 1; i <= m; i++) {
    curr[0] = i
    const ca = a.charCodeAt(i - 1)
    for (let j = 1; j <= n; j++) {
      const cost = ca === b.charCodeAt(j - 1) ? 0 : 1
      curr[j] = Math.min((prev[j] as number) + 1, (curr[j - 1] as number) + 1, (prev[j - 1] as number) + cost)
    }
    const swap = prev
    prev = curr
    curr = swap
  }
  return prev[n] as number
}


const CONNECTIVE_WORDS = new Set(
  [
    'however', 'therefore', 'moreover', 'furthermore', 'consequently', 'nevertheless', 'nonetheless',
    'although', 'though', 'whereas', 'since', 'additionally', 'conversely', 'hence', 'thus', 'indeed',
    'meanwhile', 'firstly', 'secondly', 'finally', 'overall', 'notably', 'similarly', 'specifically',
    'first', 'second', 'third', 'apart', 'besides', 'likewise', 'otherwise', 'regardless', 'instead',
  ].map(normalizeWord),
)

const CONNECTIVE_PHRASES = [
  'as a result', 'for instance', 'for example', 'in contrast', 'on the other hand', 'in addition',
  'in conclusion', 'to conclude', 'in summary', 'by contrast', 'in particular', 'in other words',
  'that said', 'by comparison', 'on the contrary', 'first of all', 'above all',
]

/**
 * Count linking words and phrases.
 *
 * Deliberately does not use `contentWords`, because the most useful connectives
 * ("however", "although", "therefore") are on the stopword list and would
 * otherwise be filtered out before they could be counted.
 */
export function connectiveCount(text: string): number {
  const singles = words(text)
    .map(normalizeWord)
    .filter((w) => CONNECTIVE_WORDS.has(w)).length
  // Punctuation is flattened so that "In conclusion, the…" still matches.
  const flattened = ` ${text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()} `
  const phrases = CONNECTIVE_PHRASES.filter((p) => flattened.includes(` ${p} `)).length
  return singles + phrases
}

/**
 * Share of content words that occur more than once.
 *
 * Higher means a narrower vocabulary: the same words come back instead of new
 * ones carrying the argument forward.
 */
export function repetitionRatio(text: string): number {
  const list = contentWords(text)
  if (list.length === 0) return 0
  const freq = new Map<string, number>()
  for (const w of list) freq.set(w, (freq.get(w) ?? 0) + 1)
  let repeated = 0
  for (const count of freq.values()) if (count > 1) repeated += count
  return repeated / list.length
}

/** Crude spelling-error proxy: tokens that look like misspellings of a known key term. */
export function nearMissCount(candidate: string, referenceTerms: readonly string[]): number {
  const cand = contentWords(candidate)
  const refs = referenceTerms.map(normalizeWord)
  let nearMiss = 0
  for (const w of cand) {
    if (refs.includes(w)) continue
    const close = refs.some((r) => {
      const d = levenshtein(w, r)
      return d > 0 && d / Math.max(w.length, r.length) <= 0.34
    })
    if (close) nearMiss += 1
  }
  return nearMiss
}

export function averageSentenceLength(text: string): number {
  const list = sentences(text)
  if (list.length === 0) return 0
  return wordCount(text) / list.length
}

export function sentenceLengthVariety(text: string): number {
  const lengths = sentences(text).map((s) => wordCount(s))
  if (lengths.length < 2) return 0
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length
  if (mean === 0) return 0
  const variance = lengths.reduce((acc, l) => acc + (l - mean) ** 2, 0) / lengths.length
  return Math.sqrt(variance) / mean
}
