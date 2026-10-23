import { describe, expect, it } from 'vitest'
import {
  averageSentenceLength,
  connectiveCount,
  contentTermSet,
  contentWords,
  isContentWord,
  keyTermCoverage,
  levenshtein,
  nearMissCount,
  normalizeWord,
  repetitionRatio,
  sentenceLengthVariety,
  sentences,
  softF1,
  wordCount,
  words,
} from '../../../src/lib/text'

/* ---------------------------------------------------------------------------
   Text analysis: the vocabulary and sentence statistics the scoring code
   reads off a candidate's answer.

   Two things matter here. First, the tokenising has to survive the
   punctuation real answers carry ("don't", "well-known"). Second, the
   statistics have to be forgiving in the right places: a long answer must not
   be punished for its length, and a stopword must never be mistaken for a
   key term.
   --------------------------------------------------------------------------- */

describe('word extraction', () => {
  it('returns the words of a sentence in order', () => {
    expect(words('The quick brown fox')).toEqual(['The', 'quick', 'brown', 'fox'])
  })

  it('keeps apostrophes and hyphens inside a word', () => {
    expect(words("don't well-known")).toEqual(["don't", 'well-known'])
  })

  it('starts a word at the first letter of an alphanumeric run', () => {
    expect(words('abc123')).toEqual(['abc'])
  })

  it('returns nothing when the text holds no letters at all', () => {
    expect(words('123 456 !!!')).toEqual([])
  })

  it('counts the words it extracted', () => {
    expect(wordCount('one two three')).toBe(3)
  })

  it('counts no words in text that holds none', () => {
    expect(wordCount('...')).toBe(0)
  })
})

describe('sentence splitting', () => {
  it('splits after sentence-ending punctuation followed by a capital', () => {
    expect(sentences('First one. Second one! Third?')).toEqual([
      'First one.',
      'Second one!',
      'Third?',
    ])
  })

  it('does not split when the next word starts in lower case', () => {
    expect(sentences('Wait... what happened?')).toEqual(['Wait... what happened?'])
  })

  it('trims the whitespace around each sentence', () => {
    expect(sentences('  Hello there.  Bye now.  ')).toEqual(['Hello there.', 'Bye now.'])
  })

  it('keeps a leading full stop attached to the sentence it ends', () => {
    expect(sentences('. Hello')).toEqual(['.', 'Hello'])
  })

  it('does not split at an honorific, an acronym or an abbreviation', () => {
    expect(sentences('Dr. Smith arrived. He left.')).toEqual(['Dr. Smith arrived.', 'He left.'])
    expect(sentences('The U.S. economy grew. It slowed.')).toEqual([
      'The U.S. economy grew.',
      'It slowed.',
    ])
    expect(sentences('This is e.g. an example. And more.')).toEqual([
      'This is e.g. an example.',
      'And more.',
    ])
  })
})

describe('word normalisation', () => {
  it('lower-cases a word', () => {
    expect(normalizeWord('Solar')).toBe('solar')
  })

  it('strips punctuation', () => {
    expect(normalizeWord('solar,')).toBe('solar')
  })

  it('strips apostrophes', () => {
    expect(normalizeWord("don't")).toBe('dont')
  })

  it('strips letters that are not plain a-z', () => {
    expect(normalizeWord('café')).toBe('caf')
  })
})

describe('content word detection', () => {
  it('rejects words of two letters or fewer', () => {
    expect(isContentWord('an')).toBe(false)
  })

  it('rejects stopwords', () => {
    expect(isContentWord('the')).toBe(false)
  })

  it('accepts ordinary content words', () => {
    expect(isContentWord('photosynthesis')).toBe(true)
  })

  it('ignores case and surrounding punctuation', () => {
    expect(isContentWord('Renewable,')).toBe(true)
    expect(isContentWord('The!')).toBe(false)
  })

  it('keeps only the content words of a passage', () => {
    expect(contentWords('The quick brown fox jumps')).toEqual(['quick', 'brown', 'fox', 'jumps'])
  })

  it('finds no content words in a passage made only of stopwords', () => {
    expect(contentWords('the a of')).toEqual([])
  })
})

describe('content term sets', () => {
  it('drops stopwords and normalises what is left', () => {
    expect([...contentTermSet(['Solar', 'the', 'and', 'wind'])]).toEqual(['solar', 'wind'])
  })

  it('holds nothing when every term is a stopword', () => {
    expect(contentTermSet(['the', 'a']).size).toBe(0)
  })

  it('keeps one entry per distinct term', () => {
    expect(contentTermSet(['solar', 'Solar', 'SOLAR']).size).toBe(1)
  })
})

describe('soft F1 scoring', () => {
  it('scores nothing when the reference has no content terms', () => {
    expect(softF1('a full answer', ['the', 'a'])).toBe(0)
  })

  it('scores nothing when the reference list is empty', () => {
    expect(softF1('a full answer', [])).toBe(0)
  })

  it('scores nothing when the candidate has no content words', () => {
    expect(softF1('the and of', ['solar', 'wind'])).toBe(0)
  })

  it('scores nothing when the candidate shares no term with the reference', () => {
    expect(softF1('completely different', ['solar', 'wind'])).toBe(0)
  })

  it('scores a perfect one when the candidate is exactly the reference', () => {
    expect(softF1('solar wind', ['solar', 'wind'])).toBe(1)
  })

  it('does not punish a candidate for answering at length', () => {
    expect(softF1('solar wind coal gas', ['solar', 'wind'])).toBe(1)
  })

  it('punishes a candidate who leaves out most of the reference', () => {
    expect(softF1('solar', ['solar', 'wind', 'coal', 'gas'])).toBeCloseTo(0.25)
  })
})

describe('key term coverage', () => {
  it('is zero for an empty reference list', () => {
    expect(keyTermCoverage('solar', [])).toBe(0)
  })

  it('is zero when the reference holds only stopwords', () => {
    expect(keyTermCoverage('solar', ['the'])).toBe(0)
  })

  it('is the share of the reference the candidate covered', () => {
    expect(keyTermCoverage('solar power rose', ['solar', 'wind', 'coal'])).toBeCloseTo(1 / 3)
  })

  it('is one when the candidate covered the whole reference', () => {
    expect(keyTermCoverage('solar wind', ['solar', 'wind'])).toBe(1)
  })
})

describe('levenshtein distance', () => {
  it('is zero for two identical strings', () => {
    expect(levenshtein('solar', 'solar')).toBe(0)
  })

  it('is the length of the other string when one side is empty', () => {
    expect(levenshtein('', 'abc')).toBe(3)
    expect(levenshtein('abc', '')).toBe(3)
  })

  it('counts a single substituted letter', () => {
    expect(levenshtein('cat', 'cot')).toBe(1)
  })

  it('counts a single inserted letter', () => {
    expect(levenshtein('cat', 'cats')).toBe(1)
  })

  it('short-circuits to the longer length when the strings are very different', () => {
    expect(levenshtein('a', 'abcdefghij')).toBe(10)
  })

  it('measures real differences between strings of similar length', () => {
    expect(levenshtein('solar', 'sular')).toBe(1)
  })
})

describe('connective counting', () => {
  it('counts a connective word', () => {
    expect(connectiveCount('However, the results differ.')).toBe(1)
  })

  it('counts a connective phrase even when it is followed by punctuation', () => {
    expect(connectiveCount('In conclusion, the policy failed.')).toBe(1)
  })

  it('counts a word and a phrase in the same passage', () => {
    expect(connectiveCount('However, as a result, demand fell.')).toBe(2)
  })

  it('counts nothing in a passage without linking words', () => {
    expect(connectiveCount('The cat sat on the mat.')).toBe(0)
  })
})

describe('repetition ratio', () => {
  it('is zero for text with no content words', () => {
    expect(repetitionRatio('the and of')).toBe(0)
  })

  it('is zero when every content word appears once', () => {
    expect(repetitionRatio('solar wind coal')).toBe(0)
  })

  it('is the share of content words that appear more than once', () => {
    expect(repetitionRatio('solar solar wind')).toBeCloseTo(2 / 3)
  })
})

describe('near miss counting', () => {
  it('counts a misspelling of a key term', () => {
    expect(nearMissCount('solor', ['solar'])).toBe(1)
  })

  it('does not count a word that matches a key term exactly', () => {
    expect(nearMissCount('solar', ['solar'])).toBe(0)
  })

  it('does not count a word that resembles nothing in the reference', () => {
    expect(nearMissCount('solar banana', ['solar'])).toBe(0)
  })
})

describe('sentence statistics', () => {
  it('averages zero words per sentence when there are no sentences', () => {
    expect(averageSentenceLength('')).toBe(0)
  })

  it('averages the words of the passage over its sentences', () => {
    expect(averageSentenceLength('One two three. Four five.')).toBeCloseTo(2.5)
  })

  it('reports no variety for a passage with fewer than two sentences', () => {
    expect(sentenceLengthVariety('Only one sentence here')).toBe(0)
  })

  it('reports no variety for a passage with no sentences', () => {
    expect(sentenceLengthVariety('')).toBe(0)
  })

  it('reports no variety when the sentences hold no words at all', () => {
    expect(sentenceLengthVariety('!. ""')).toBe(0)
  })

  it('reports no variety when every sentence is the same length', () => {
    expect(sentenceLengthVariety('One two. Three four.')).toBe(0)
  })

  it('reports a positive spread when the sentences differ in length', () => {
    expect(sentenceLengthVariety('One. Two three four five.')).toBeCloseTo(0.6)
  })
})
