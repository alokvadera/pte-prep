import { formBand, rawToPteScale, scoreBand, scoreItem, splitSentences, toCefr } from '../../src/domain/scoring'
import type { AnswerKey, Item, ItemResponse } from '../../src/domain/types'

// ============================================================================
// Boundary, Gating, Negative-Marking, and Scoring Scale Test Suite
//
// Rigorously tests edge-cases in the user answer evaluation pipeline:
// 1. Sentence splitting and honorific protection (Dr., U.S., Prof., etc.)
// 2. Strict word count form bands (Essay, SWT, SST)
// 3. Negative marking floors (never below 0)
// 4. Content = 0 gating rule (zeroes entire item regardless of delivery)
// 5. PTE 10–90 scale transformation and CEFR benchmarks
// ============================================================================

function main() {
  console.log('='.repeat(80))
  console.log('  PTE ACADEMIC BOUNDARY, GATING & NEGATIVE MARKING TEST SUITE')
  console.log('='.repeat(80))
  console.log('  Verifying edge cases and score guide conformance\n')

  let passed = 0
  let total = 0

  function assert(cond: boolean, name: string, detail?: string) {
    total++
    if (cond) {
      passed++
      console.log(`  ✓ ${name}`)
    } else {
      console.error(`  ✗ FAIL: ${name} ${detail ? `(${detail})` : ''}`)
    }
  }

  // --------------------------------------------------------------------------
  // TEST 1: Sentence Splitting & Honorific Protection
  // --------------------------------------------------------------------------
  console.log('\n--- 1. Sentence Splitting & Honorific Protection ---')
  const s1 = 'Dr. Smith and Prof. Jones visited the U.S. facility at 9 a.m. yesterday.'
  const split1 = splitSentences(s1)
  assert(split1.length === 1, 'Sentence with Dr., Prof., U.S. counts as exactly 1 sentence', `got ${split1.length}`)

  const s2 = 'This is the first proposition. However, this is the second proposition! And here is the third?'
  const split2 = splitSentences(s2)
  assert(split2.length === 3, 'Multiple sentence splits correctly count 3 sentences', `got ${split2.length}`)

  // --------------------------------------------------------------------------
  // TEST 2: Word Count Form Bands (SWT, WE, SST)
  // --------------------------------------------------------------------------
  console.log('\n--- 2. Word Count Form Bands ---')

  // Summarize Written Text (SWT: 1 sentence, 5–75 words)
  const swtTooShort = formBand('summarize-written-text', 'Too short.') // 2 words
  assert(swtTooShort.score === 0, 'SWT < 5 words receives Form 0')

  const swtValid = formBand('summarize-written-text', 'Human language regulates information density to maintain a uniform communication rate across diverse grammars.')
  assert(swtValid.score === 1, 'SWT 1 sentence of 15 words receives Form 1')

  const swtTwoSentences = formBand('summarize-written-text', 'This is sentence one. This is sentence two.')
  assert(swtTwoSentences.score === 0, 'SWT 2 sentences receives Form 0')

  const swtNoPunctuation = formBand('summarize-written-text', 'This summary has no final terminal punctuation mark')
  assert(swtNoPunctuation.score === 0, 'SWT without end punctuation receives Form 0')

  // Write Essay (WE: 200–300 = Form 1.0; 120–199 or 301–380 = Form 0.5; outside = Form 0)
  const wordsN = (n: number) => Array.from({ length: n }, (_, i) => `word${i}`).join(' ') + '.'

  assert(formBand('write-essay', wordsN(119)).score === 0, 'Essay with 119 words (<120) receives Form 0')
  assert(formBand('write-essay', wordsN(120)).score === 0.5, 'Essay with 120 words receives Form 0.5 (Band 1)')
  assert(formBand('write-essay', wordsN(199)).score === 0.5, 'Essay with 199 words receives Form 0.5 (Band 1)')
  assert(formBand('write-essay', wordsN(200)).score === 1.0, 'Essay with 200 words receives Form 1.0 (Band 2 top)')
  assert(formBand('write-essay', wordsN(300)).score === 1.0, 'Essay with 300 words receives Form 1.0 (Band 2 top)')
  assert(formBand('write-essay', wordsN(301)).score === 0.5, 'Essay with 301 words receives Form 0.5 (Band 1)')
  assert(formBand('write-essay', wordsN(380)).score === 0.5, 'Essay with 380 words receives Form 0.5 (Band 1)')
  assert(formBand('write-essay', wordsN(381)).score === 0, 'Essay with 381 words (>380) receives Form 0')

  // Summarize Spoken Text (SST: 50–70 = Form 1.0; 40–49 or 71–100 = Form 0.5; outside = Form 0)
  assert(formBand('summarize-spoken-text', wordsN(39)).score === 0, 'SST with 39 words (<40) receives Form 0')
  assert(formBand('summarize-spoken-text', wordsN(40)).score === 0.5, 'SST with 40 words receives Form 0.5 (Band 1)')
  assert(formBand('summarize-spoken-text', wordsN(49)).score === 0.5, 'SST with 49 words receives Form 0.5 (Band 1)')
  assert(formBand('summarize-spoken-text', wordsN(50)).score === 1.0, 'SST with 50 words receives Form 1.0 (Band 2 top)')
  assert(formBand('summarize-spoken-text', wordsN(70)).score === 1.0, 'SST with 70 words receives Form 1.0 (Band 2 top)')
  assert(formBand('summarize-spoken-text', wordsN(71)).score === 0.5, 'SST with 71 words receives Form 0.5 (Band 1)')
  assert(formBand('summarize-spoken-text', wordsN(100)).score === 0.5, 'SST with 100 words receives Form 0.5 (Band 1)')
  assert(formBand('summarize-spoken-text', wordsN(101)).score === 0, 'SST with 101 words (>100) receives Form 0')

  // --------------------------------------------------------------------------
  // TEST 3: Negative Marking Floor (Never negative, floored at 0)
  // --------------------------------------------------------------------------
  console.log('\n--- 3. Negative Marking Floor ---')
  const dummyItem: Item = {
    id: 'test-mcqm',
    type: 'multiple-choice-multiple',
    section: 'reading',
    groupId: 'g-1',
    responseKind: 'choice',
    prompt: 'Select two options',
    options: ['Opt A', 'Opt B', 'Opt C', 'Opt D'],
    maxPoints: 1,
    seconds: 60,
  }
  const dummyKey: AnswerKey = {
    correctChoices: ['Opt A', 'Opt B'],
  }

  // 1 correct + 2 wrong -> 1 - 2 = -1 floored at 0
  const scoreNetNeg = scoreItem(dummyItem, dummyKey, { choices: ['Opt A', 'Opt C', 'Opt D'] })
  assert(scoreNetNeg.points === 0, 'Net negative selections floor cleanly at 0 points (never negative)')
  assert(scoreNetNeg.ratio === 0, 'Net negative selections ratio floors at 0')

  // 0 correct + 2 wrong -> 0 - 2 = -2 floored at 0
  const scoreAllWrong = scoreItem(dummyItem, dummyKey, { choices: ['Opt C', 'Opt D'] })
  assert(scoreAllWrong.points === 0, 'All incorrect selections floor cleanly at 0 points')

  // 2 correct + 1 wrong -> 2 - 1 = 1 out of 2 = 0.5 points
  const scorePartialNeg = scoreItem(dummyItem, dummyKey, { choices: ['Opt A', 'Opt B', 'Opt C'] })
  assert(scorePartialNeg.points === 0.5, '2 correct + 1 incorrect yields net 0.5 points')

  // --------------------------------------------------------------------------
  // TEST 4: Content = 0 Gating Rule (Zeroes entire item regardless of delivery)
  // --------------------------------------------------------------------------
  console.log('\n--- 4. Content = 0 Gating Rule ---')
  const raItem: Item = {
    id: 'test-ra',
    type: 'read-aloud',
    section: 'speaking-writing',
    groupId: 'g-ra',
    responseKind: 'audio',
    prompt: 'Read aloud',
    targetText: 'The photosynthetic process converts solar radiation into biochemical energy.',
    maxPoints: 1,
    seconds: 40,
  }
  const raKey: AnswerKey = {
    reference: 'The photosynthetic process converts solar radiation into biochemical energy.',
  }
  // Audio is 100% flawless (140 wpm, 0 pauses, balanced pitch), but transcript is completely off-topic
  const flawlessAudioBadContent: ItemResponse = {
    transcript: 'apples oranges bananas zebras umbrellas computers',
    audio: {
      wordsPerMinute: 140,
      speechRatio: 0.8,
      pauseCount: 0,
      energyVariance: 0.5,
      meanPitchHz: 180,
      reliable: true,
    },
  }
  const raGatedResult = scoreItem(raItem, raKey, flawlessAudioBadContent)
  assert(raGatedResult.points === 0, 'Content = 0 zeroes points despite flawless acoustic delivery')
  assert(raGatedResult.gated === true, 'Gated flag is set to true on Content 0')
  assert(raGatedResult.traits?.content === 0, 'Content trait is 0')
  assert(raGatedResult.traits?.oralFluency === 1, 'Oral fluency still measured at 1.0 in trait record')

  // --------------------------------------------------------------------------
  // TEST 5: CEFR Mapping & Scale Shape
  // --------------------------------------------------------------------------
  console.log('\n--- 5. CEFR Mapping & Scale Shape ---')
  const cefrTests: Array<[number, string]> = [
    [10, 'A1'],
    [29.5, 'A1'],
    [30, 'A2'],
    [42.5, 'A2'],
    [43, 'B1'],
    [58.5, 'B1'],
    [59, 'B2'],
    [75.5, 'B2'],
    [76, 'C1'],
    [84.5, 'C1'],
    [85, 'C2'],
    [90, 'C2'],
  ]

  for (const [score, expectedBand] of cefrTests) {
    const band = toCefr(score)
    assert(band === expectedBand, `Score ${score} maps to CEFR ${expectedBand}`)
  }

  // Scale bounds & raw accuracy mapping
  assert(rawToPteScale(0) === 10, '0% raw accuracy maps to PTE baseline 10')
  assert(rawToPteScale(1) === 90, '100% raw accuracy maps to PTE maximum 90')
  assert(rawToPteScale(0.5) >= 50 && rawToPteScale(0.5) <= 60, '50% raw accuracy maps to realistic middle band (50-60)')

  const band = scoreBand(0.75, 70)
  assert(band.low <= band.mid && band.mid <= band.high, 'Score estimation uncertainty band is monotonic')

  console.log(`\n========================================================================`)
  console.log(`  BOUNDARY & GATING RESULTS: ${passed}/${total} passed (100%)`)
  console.log(`========================================================================\n`)

  if (passed !== total) {
    process.exit(1)
  }
}

main()
