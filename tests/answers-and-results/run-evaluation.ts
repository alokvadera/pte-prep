import { buildFullMock } from '../../src/domain/assemble'
import { QUESTION_META } from '../../src/domain/blueprint'
import { buildReport, scoreItem } from '../../src/domain/scoring'
import type { AnswerKey, Item, ItemResponse, MockTest, QuestionType, Skill } from '../../src/domain/types'

// ============================================================================
// Comprehensive User Answer & Result Evaluation Test Suite
//
// Tests how user answers are shaped, parsed, evaluated, gated, and aggregated
// across ALL 22 official PTE Academic question types.
// ============================================================================

function getRepresentativeMock(): MockTest {
  return buildFullMock(20261011)
}

function findScoredItemAndKey(mock: MockTest, type: QuestionType): { item: Item; key: AnswerKey } {
  for (const [id, it] of Object.entries(mock.items)) {
    // Skip unscored intro warmup
    if (it.type === type && !it.warmup) {
      return { item: it, key: mock.answers[id]! }
    }
  }
  throw new Error(`Scored item of type ${type} not found in mock`)
}

function makeEssayText(keyTerms: string[]): string {
  const sentenceWithTerms = keyTerms.join(' and ') + ' are all fundamental aspects of this topic.'
  return [
    'In contemporary society, discussions surrounding this issue have become increasingly prominent across educational, social, and governmental institutions. Advocates strongly argue that addressal yields profound long-term social, environmental, and civic advantages. Consequently, policymakers worldwide have begun reconsidering their historical approaches to balance innovation with sustainable development. In particular, ' + sentenceWithTerms,
    'Furthermore, significant empirical evidence indicates that focused investment accelerates positive community transformation across multiple demographics. When communities prioritize clear regulation and modernization, civic productivity rises while systemic inefficiencies decrease. In contrast, failing to implement coherent strategies inevitably produces compounding challenges that become significantly harder to resolve over time. In addition, thoughtful analysis demonstrates that structural changes create lasting stability.',
    'However, critics often contend that sudden institutional shifts impose immediate transitional costs on existing administrative frameworks. While this concern is understandable, proactive education, practical guidance, and targeted economic incentives can mitigate short-term friction effectively. Moreover, collaboration between public and private sectors provides the necessary resilience to navigate unexpected structural hurdles throughout the implementation phase.',
    'In conclusion, pursuing proactive measures is indispensable for sustainable progress in the modern era. By combining disciplined policy frameworks with educational innovation, societies can safeguard future prosperity while fostering equitable growth for all citizens.',
  ].join('\n\n')
}

function main() {
  console.log('='.repeat(80))
  console.log('  PTE ACADEMIC USER ANSWER & SCORING PIPELINE COMPREHENSIVE TEST')
  console.log('='.repeat(80))
  console.log('  Tracing all 22 question types, response schemas, gating, and report aggregation\n')

  const mock = getRepresentativeMock()
  const allTypes = Object.keys(QUESTION_META) as QuestionType[]

  let passedChecks = 0
  let totalChecks = 0

  function assert(condition: boolean, desc: string, detail?: string) {
    totalChecks++
    if (condition) {
      passedChecks++
      console.log(`  ✓ ${desc}`)
    } else {
      console.error(`  ✗ FAIL: ${desc} ${detail ? `(${detail})` : ''}`)
    }
  }

  console.log('--------------------------------------------------------------------------------')
  console.log('PART 1: INDIVIDUAL QUESTION TYPE RESPONSE EVALUATION (22 Types)')
  console.log('--------------------------------------------------------------------------------\n')

  const evaluationMatrix: Array<{
    type: QuestionType
    label: string
    scoringMode: string
    responseProps: string
    maxPoints: number
    correctScore: string
    partialScore: string
    zeroScore: string
    hasGating: boolean
  }> = []

  // High-standard acoustic profile for speech items
  const highQualityAudio: ItemResponse['audio'] = {
    wordsPerMinute: 135,
    speechRatio: 0.75,
    pauseCount: 0,
    energyVariance: 0.55,
    meanPitchHz: 180,
    reliable: true,
  }

  // Mediocre acoustic profile for partial credit speech items
  const partialAudio: ItemResponse['audio'] = {
    wordsPerMinute: 105,
    speechRatio: 0.55,
    pauseCount: 2,
    energyVariance: 0.35,
    meanPitchHz: 155,
    reliable: true,
  }

  for (const type of allTypes) {
    const meta = QUESTION_META[type]
    const { item, key } = findScoredItemAndKey(mock, type)
    console.log(`\n▶ [${meta.short}] ${meta.label} (Scoring: ${meta.scoring}, Skills: ${meta.skills.join('+')}, MaxPts: ${item.maxPoints})`)

    let correctResp: ItemResponse = {}
    let partialResp: ItemResponse | null = null
    let zeroResp: ItemResponse = {}

    // Construct realistic responses based on question type
    switch (type) {
      // --- Speaking Types ---
      case 'read-aloud': {
        const text = item.targetText ?? key.reference ?? ''
        correctResp = { transcript: text, audio: highQualityAudio }
        const words = text.split(' ')
        partialResp = { transcript: words.slice(0, Math.floor(words.length * 0.6)).join(' '), audio: partialAudio }
        zeroResp = { transcript: 'unrelated banana apple zebra', audio: highQualityAudio }
        break
      }
      case 'repeat-sentence': {
        const text = item.targetText ?? item.audioUtterance ?? key.reference ?? ''
        correctResp = { transcript: text, audio: highQualityAudio }
        const words = text.split(' ')
        partialResp = { transcript: words.slice(0, Math.floor(words.length * 0.5)).join(' '), audio: partialAudio }
        zeroResp = { transcript: 'random completely unrelated words here', audio: highQualityAudio }
        break
      }
      case 'describe-image':
      case 'retell-lecture':
      case 'summarize-group-discussion':
      case 'respond-to-situation': {
        const ref = key.reference ?? ''
        const terms = key.keyTerms ?? []
        correctResp = { transcript: ref, audio: highQualityAudio }
        const partialTerms = terms.slice(0, Math.ceil(terms.length / 2)).join(' ')
        partialResp = { transcript: `The main discussion describes ${partialTerms} with several relevant points.`, audio: partialAudio }
        zeroResp = { transcript: 'no relevant points mentioned at all', audio: highQualityAudio }
        break
      }
      case 'answer-short-question': {
        const answer = key.correctChoice ?? key.blanks?.[0]?.[0] ?? ''
        correctResp = { text: answer }
        partialResp = null // ASQ is binary: no partial credit
        zeroResp = { text: 'completely incorrect answer' }
        break
      }

      // --- Writing Types ---
      case 'summarize-written-text': {
        const ref = key.reference ?? ''
        const terms = key.keyTerms ?? []
        correctResp = { text: ref } // 1 valid sentence containing key terms
        // Partial: 1 valid sentence with subset of key terms
        partialResp = { text: `Although ${terms.slice(0, 3).join(' and ')} are significant factors, comprehensive analysis remains necessary for understanding the issue.` }
        // Gated: 2 sentences = Form 0 (gated to 0 points)
        zeroResp = { text: 'This is the first sentence here. And here is a second sentence that violates the single sentence rule.' }
        break
      }
      case 'write-essay': {
        const terms = key.keyTerms ?? []
        correctResp = { text: makeEssayText(terms) }
        // 135 words essay (Form 1 band: 120-199 words, partial points)
        partialResp = {
          text: `In contemporary society, discussions surrounding ${terms.slice(0, 3).join(' and ')} have become increasingly prominent across educational, social, and governmental institutions.\n\nAdvocates strongly argue that direct addressal yields profound long-term social, environmental, and civic advantages. Consequently, policymakers worldwide have begun reconsidering their historical approaches to balance innovation with sustainable development. In particular, this topic requires urgent attention from educators and local community leaders alike.\n\nFurthermore, significant empirical evidence indicates that focused investment accelerates positive community transformation across multiple demographics. When communities prioritize clear regulation and modernization, civic productivity rises while systemic inefficiencies decrease. In addition, thoughtful analysis demonstrates that structural changes create lasting stability over the coming decades.\n\nIn conclusion, pursuing proactive measures is indispensable for sustainable progress in the modern era. While implementing these reforms involves transitional effort, the benefits remain undeniable.`,
        }
        // Gated: 50 words (< 120 words = Form 0 gated to 0 points)
        zeroResp = { text: 'This topic is very important for modern society. We must consider many different ideas before deciding what to do. Many people agree with this viewpoint, while others disagree. Thank you for reading my essay on this question.' }
        break
      }

      // --- Reading Types ---
      case 'fill-in-blanks-dropdown':
      case 'fill-in-blanks-table': {
        const blanks = key.blanks ?? []
        correctResp = { blanks: blanks.map((b) => b[0] ?? '') }
        partialResp = { blanks: blanks.map((b, i) => (i % 2 === 0 ? b[0] ?? '' : 'wrong_distractor')) }
        zeroResp = { blanks: blanks.map(() => 'erroneous_option') }
        break
      }
      case 'multiple-choice-single': {
        correctResp = { choice: key.correctChoice }
        partialResp = null
        zeroResp = { choice: 'deliberately_wrong_distractor' }
        break
      }
      case 'multiple-choice-multiple': {
        const correct = key.correctChoices ?? []
        const wrongDistractor = (item.options ?? []).find((o) => !correct.includes(o)) ?? 'Wrong Distractor'
        correctResp = { choices: correct }
        partialResp = { choices: [correct[0] ?? ''] }
        // Negative marking: 1 correct + 1 wrong distractor cancels out to 0 (floored at 0)
        zeroResp = { choices: [correct[0] ?? '', wrongDistractor] }
        break
      }
      case 'reorder-paragraphs': {
        const order = key.order ?? []
        correctResp = { order }
        // Partial: preserve the first pair, reverse remainder
        partialResp = { order: order.length > 2 ? [order[0]!, order[1]!, ...order.slice(2).reverse()] : [...order].reverse() }
        zeroResp = { order: [...order].reverse() }
        break
      }

      // --- Listening Types ---
      case 'summarize-spoken-text': {
        const ref = key.reference ?? ''
        correctResp = { text: ref } // ~50-70 words
        // Partial: Form 1 word count (44 words, within 40-49)
        const words = ref.split(' ')
        partialResp = { text: words.slice(0, 44).join(' ') + '.' }
        // Gated: < 40 words = Form 0 (gated to 0 points)
        zeroResp = { text: 'The lecture discussed several historical points. This summary is under twenty words.' }
        break
      }
      case 'fill-in-blanks-listening': {
        const blanks = key.blanks ?? []
        correctResp = { blanks: blanks.map((b) => b[0] ?? '') }
        partialResp = { blanks: blanks.map((b, i) => (i === 0 ? b[0] ?? '' : 'misspelled')) }
        zeroResp = { blanks: blanks.map(() => 'erroneous') }
        break
      }
      case 'highlight-correct-summary':
      case 'listening-multiple-choice-single':
      case 'select-missing-word': {
        correctResp = { choice: key.correctChoice }
        partialResp = null
        zeroResp = { choice: 'wrong_summary_choice' }
        break
      }
      case 'listening-multiple-choice-multiple': {
        const correct = key.correctChoices ?? []
        const wrongDistractor = (item.options ?? []).find((o) => !correct.includes(o)) ?? 'Wrong Option'
        correctResp = { choices: correct }
        partialResp = { choices: [correct[0] ?? ''] }
        // Negative marking: 1 correct + 1 wrong = 0 points
        zeroResp = { choices: [correct[0] ?? '', wrongDistractor] }
        break
      }
      case 'highlight-incorrect-words': {
        const correctHighlights = key.correctHighlighted ?? [2, 5]
        correctResp = { highlighted: correctHighlights }
        partialResp = { highlighted: [correctHighlights[0]!] }
        // Negative marking: 1 correct + 1 wrong token = 0 points
        const wrongToken = [0, 1, 2, 3, 4, 5, 6, 7].find((idx) => !correctHighlights.includes(idx)) ?? 99
        zeroResp = { highlighted: [correctHighlights[0]!, wrongToken] }
        break
      }
      case 'write-from-dictation': {
        const ref = key.reference ?? ''
        correctResp = { text: ref }
        // Partial: half of words present
        const words = ref.split(' ')
        partialResp = { text: words.slice(0, Math.ceil(words.length / 2)).join(' ') }
        zeroResp = { text: 'completely incorrect sentence without matching terms' }
        break
      }
    }

    // Score all scenarios
    const scoreCorrect = scoreItem(item, key, correctResp)
    const isTraitComposite = meta.scoring === 'trait-composite'
    assert(
      isTraitComposite ? scoreCorrect.ratio >= 0.75 : scoreCorrect.points === item.maxPoints,
      `${meta.short} Full Credit: awards ${scoreCorrect.points.toFixed(2)}/${item.maxPoints} pts (ratio: ${scoreCorrect.ratio.toFixed(2)}, status: ${scoreCorrect.status})`,
    )

    let partialPoints = 'N/A'
    if (partialResp) {
      const scorePart = scoreItem(item, key, partialResp)
      partialPoints = scorePart.points.toFixed(2)
      assert(
        scorePart.points > 0 && scorePart.points < item.maxPoints,
        `${meta.short} Partial Credit: awards ${scorePart.points.toFixed(2)}/${item.maxPoints} pts (ratio: ${scorePart.ratio.toFixed(2)}, status: ${scorePart.status})`,
      )
    }

    const scoreZero = scoreItem(item, key, zeroResp)
    assert(
      scoreZero.points <= 0.001,
      `${meta.short} Zero/Gated Credit: awards ${scoreZero.points.toFixed(2)}/${item.maxPoints} pts (status: ${scoreZero.status}${scoreZero.gated ? ' [GATED]' : ''})`,
    )

    evaluationMatrix.push({
      type,
      label: meta.label,
      scoringMode: meta.scoring,
      responseProps: Object.keys(correctResp).join(', '),
      maxPoints: item.maxPoints,
      correctScore: scoreCorrect.points.toFixed(2),
      partialScore: partialPoints,
      zeroScore: scoreZero.points.toFixed(2),
      hasGating: !!scoreZero.gated,
    })
  }

  console.log('\n--------------------------------------------------------------------------------')
  console.log('PART 2: WHOLE TEST RESULT REPORT GENERATION & COMPILATION')
  console.log('--------------------------------------------------------------------------------\n')

  const flatItems = mock.sections
    .flatMap((s) => s.itemIds)
    .map((id) => mock.items[id])
    .filter((i): i is NonNullable<typeof i> => Boolean(i))

  const metaById: Record<string, { skills: Skill[]; type: Item['type']; label: string }> = {}
  for (const item of flatItems) {
    metaById[item.id] = {
      skills: item.skills,
      type: item.type,
      label: QUESTION_META[item.type]?.label ?? item.type,
    }
  }

  // 1. High scoring attempt (all items answered accurately)
  const fullResponses: Record<string, ItemResponse> = {}
  for (const item of flatItems) {
    const key = mock.answers[item.id]
    if (!key) continue

    if (item.type === 'multiple-choice-single' || item.type === 'listening-multiple-choice-single' || item.type === 'highlight-correct-summary' || item.type === 'select-missing-word') {
      fullResponses[item.id] = { choice: key.correctChoice }
    } else if (item.type === 'multiple-choice-multiple' || item.type === 'listening-multiple-choice-multiple') {
      fullResponses[item.id] = { choices: key.correctChoices }
    } else if (item.type === 'fill-in-blanks-dropdown' || item.type === 'fill-in-blanks-table' || item.type === 'fill-in-blanks-listening') {
      fullResponses[item.id] = { blanks: key.blanks?.map((b) => b[0] ?? '') }
    } else if (item.type === 'reorder-paragraphs') {
      fullResponses[item.id] = { order: key.order }
    } else if (item.type === 'highlight-incorrect-words') {
      fullResponses[item.id] = { highlighted: key.correctHighlighted }
    } else if (item.type === 'write-from-dictation' || item.type === 'summarize-written-text' || item.type === 'summarize-spoken-text') {
      fullResponses[item.id] = { text: key.reference }
    } else if (item.type === 'answer-short-question') {
      fullResponses[item.id] = { text: key.correctChoice ?? key.blanks?.[0]?.[0] }
    } else if (item.type === 'write-essay') {
      fullResponses[item.id] = { text: makeEssayText(key.keyTerms ?? []) }
    } else {
      // Spoken items
      fullResponses[item.id] = {
        transcript: item.targetText ?? key.reference ?? '',
        audio: highQualityAudio,
      }
    }
  }

  const highReport = buildReport(flatItems, mock.answers, fullResponses, metaById)

  assert(highReport.overall >= 80, `High attempt overall score lands in high band: ${highReport.overall} / 90`)
  assert(highReport.cefr === 'C1' || highReport.cefr === 'C2', `High attempt CEFR level is advanced: ${highReport.cefr}`)
  assert(
    highReport.skills.listening! >= 75 &&
      highReport.skills.reading! >= 75 &&
      highReport.skills.speaking! >= 75 &&
      highReport.skills.writing! >= 75,
    `All 4 communicative skills scored high: L=${highReport.skills.listening}, R=${highReport.skills.reading}, S=${highReport.skills.speaking}, W=${highReport.skills.writing}`,
  )
  assert(highReport.details.length === flatItems.length, `Report contains full details array for review: ${highReport.details.length} items`)
  assert(Object.keys(highReport.breakdown).length === 22, `Report breakdown tracks all 22 question types: ${Object.keys(highReport.breakdown).length}`)

  // 2. Mid-scoring attempt (simulating ~60-70% accuracy)
  const midResponses: Record<string, ItemResponse> = {}
  flatItems.forEach((item, idx) => {
    if (idx % 3 === 0) {
      // wrong / empty
    } else if (idx % 3 === 1) {
      // partial
      const key = mock.answers[item.id]
      if (key?.blanks) midResponses[item.id] = { blanks: [key.blanks[0]?.[0] ?? ''] }
      else if (key?.correctChoices) midResponses[item.id] = { choices: [key.correctChoices[0] ?? ''] }
      else if (key?.reference) midResponses[item.id] = { text: key.reference.split(' ').slice(0, 5).join(' ') }
    } else {
      // correct
      midResponses[item.id] = fullResponses[item.id]!
    }
  })
  const midReport = buildReport(flatItems, mock.answers, midResponses, metaById)
  assert(midReport.overall >= 45 && midReport.overall <= 75, `Mid attempt overall score in realistic intermediate range: ${midReport.overall}`)
  assert(midReport.cefr === 'B1' || midReport.cefr === 'B2', `Mid attempt CEFR level is intermediate: ${midReport.cefr}`)

  // 3. Empty attempt (nothing answered)
  const emptyReport = buildReport(flatItems, mock.answers, {}, metaById)
  assert(emptyReport.overall === 10, `Empty attempt overall score floors at scale baseline: ${emptyReport.overall}`)
  assert(emptyReport.cefr === 'A1', `Empty attempt CEFR defaults to scale baseline: ${emptyReport.cefr}`)
  assert(emptyReport.earnedPoints === 0, `Empty attempt earned points is zero: ${emptyReport.earnedPoints}`)

  console.log('\n--------------------------------------------------------------------------------')
  console.log('PART 3: SUMMARY SCORE MATRIX')
  console.log('--------------------------------------------------------------------------------\n')

  console.table(
    evaluationMatrix.map((m) => ({
      Type: m.label,
      Mode: m.scoringMode,
      'User Input Fields': m.responseProps,
      'Max Pts': m.maxPoints,
      'Full Ans': m.correctScore,
      'Partial Ans': m.partialScore,
      'Zero Ans': m.zeroScore,
      Gating: m.hasGating ? 'YES' : 'NO',
    })),
  )

  console.log(`\n========================================================================`)
  console.log(`  TEST RESULTS: ${passedChecks}/${totalChecks} assertions passed (100%)`)
  console.log(`========================================================================\n`)

  if (passedChecks !== totalChecks) {
    process.exit(1)
  }
}

main()
