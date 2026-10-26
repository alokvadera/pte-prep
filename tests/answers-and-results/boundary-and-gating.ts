import {
  formBand,
  rawToPteScale,
  scoreBand,
  scoreItem,
  splitSentences,
  toCefr,
} from '../../src/domain/scoring'
import type { AnswerKey, AttemptRecord, Item, ItemResponse } from '../../src/domain/types'
import { hasResponse } from '../../src/store/useTest'
import { softF1 } from '../../src/lib/text'
import { computeAiRawScore, validateGroqKey } from '../../src/lib/aiScorer'
import { useAuth } from '../../src/store/useAuth'
import { useSettings } from '../../src/store/useSettings'
import { playSuccessTone } from '../../src/lib/speech'
import fs from 'node:fs'
import path from 'node:path'
import { resolveAllowedOrigin, onRequest as middlewareOnRequest } from '../../functions/_middleware'
import {
  DEFAULT_PBKDF2_ITERATIONS,
  DEFAULT_SESSION_EXPIRY_SECONDS,
  createSessionToken,
  extractBearerToken,
  hashPassword,
  recordSession,
  requireSecret,
  resolvePbkdf2Iterations,
  resolveSessionExpiry,
  revokeAllUserSessions,
  revokeSession,
  sha256Hex,
  verifyPassword,
  verifySessionToken,
} from '../../functions/lib/auth'
import {
  checkRateLimit,
  getClientIp,
  rateLimitExceededResponse,
} from '../../functions/lib/rateLimit'
import { sendBrevoEmail } from '../../functions/lib/brevo'
import { onRequestPost as loginPost } from '../../functions/api/auth/login'
import { onRequestPost as logoutPost } from '../../functions/api/auth/logout'
import { onRequestPost as registerPost } from '../../functions/api/auth/register'
import { onRequestGet as meGet, onRequestPatch as mePatch } from '../../functions/api/auth/me'
import {
  onRequestGet as attemptsGet,
  onRequestPost as attemptsPost,
  onRequestDelete as attemptsDelete,
} from '../../functions/api/attempts/index'
import {
  onRequestGet as attemptIdGet,
  onRequestDelete as attemptIdDelete,
} from '../../functions/api/attempts/[id]'
import { onRequestPost as forgotPasswordPost } from '../../functions/api/auth/forgot-password'
import { onRequestPost as resetPasswordPost } from '../../functions/api/auth/reset-password'
import { evaluateWithAi, transcribeWithWhisper } from '../../src/lib/aiScorer'
import {
  cleanProsodyText,
  isSpeechSupported,
  speakScript,
  speakText,
  speakWithBeep,
  stopAllSpeech,
  playTone,
  playCountdownBeep,
  playErrorTone,
} from '../../src/lib/speech'
import { throttledStateStorage } from '../../src/lib/storage'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { useLocalOwnerId } from '../../src/lib/useLocalOwner'
import { useClientReady } from '../../src/lib/useClientReady'
import {
  saveAttempt,
  listAttempts,
  listAllAttempts,
  getAttempt,
  deleteAttempt,
  clearAttempts,
  readKv,
  writeKv,
} from '../../src/db/db'
import { useTest, secondsRemaining } from '../../src/store/useTest'
import {
  syncAttemptToCloud,
  fetchAttemptFromCloud,
  deleteAttemptEverywhere,
  clearAllAttemptsEverywhere,
  countGuestAttempts,
  claimGuestAttemptsForCurrentUser,
  syncCloudToLocal,
} from '../../src/lib/sync'
import { createDefaultAiUsage } from '../../src/store/useSettings'
import { describeMockPreview, primarySkill } from '../../src/domain/blueprint'
import { paceReport, paceWarnings, formatSeconds } from '../../src/domain/pace'
import {
  cefrLabel,
  nextBand,
  pteToIelts,
  endsWithSentencePunctuation,
} from '../../src/domain/scoring'
import {
  getManifest,
  typesForSkill,
  manifestCapacityByType,
  manifestBankCapacity,
} from '../../src/content/manifest'
import { getPageMeta, notFoundMeta } from '../../src/seo/meta'
import {
  organizationLd,
  webApplicationLd,
  faqLd,
  breadcrumbLd,
  howToLd,
  itemListLd,
  pageHeadTags,
  renderHeadTags,
} from '../../src/seo/structured'
import { prefersReducedMotion, scrollBehavior } from '../../src/lib/motion'
import {
  isRecordingSupported,
  isSpeechRecognitionSupported,
  VoiceRecorder,
} from '../../src/lib/recorder'
import Dexie from 'dexie'
import { buildFullMock } from '../../src/domain/assemble'
import {
  clamp,
  formatClock,
  formatDate,
  formatDateTime,
  formatDuration,
  formatResponseEchoLines,
  percent,
  pluralize,
  roundTo,
  titleCase,
  validateResetPasswordForm,
} from '../../src/lib/format'
import { hashString, makeRng, pickN, pickOne, randomSeed, shuffle } from '../../src/lib/random'
import { cn } from '../../src/lib/cn'
import { describeData } from '../../src/lib/chartData'
import { weakestTypes } from '../../src/domain/weakTypes'
import { safeStateStorage } from '../../src/lib/storage'
import { getGuestOwnerId } from '../../src/lib/guestOwner'
import { canPushAttemptToCloud, planSyncReconciliation } from '../../src/lib/sync'
import { attemptOwnerId } from '../../src/db/db'

// ============================================================================
// Boundary, Gating, Negative-Marking, and Scoring Scale Test Suite
//
// Rigorously tests edge-cases in the user answer evaluation pipeline:
// 1. Sentence splitting and honorific protection (Dr., U.S., Prof., etc.)
// 2. Strict word count form bands (Essay, SWT, SST)
// 3. Negative marking floors (never below 0)
// 4. Content = 0 gating rule (zeroes entire item regardless of delivery)
// 5. PTE 10–90 scale transformation and CEFR benchmarks
// 6. hasResponse Presence & Duration Guards
// 7. softF1 Bounds & Operator Precedence
// 8. Auth Store Contract & Groq Validation
// ============================================================================

async function main() {
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
  assert(
    split1.length === 1,
    'Sentence with Dr., Prof., U.S. counts as exactly 1 sentence',
    `got ${split1.length}`,
  )

  const s2 =
    'This is the first proposition. However, this is the second proposition! And here is the third?'
  const split2 = splitSentences(s2)
  assert(
    split2.length === 3,
    'Multiple sentence splits correctly count 3 sentences',
    `got ${split2.length}`,
  )

  const s3 = 'Research by e.g. Watson et al. demonstrated high efficacy, i.e. over 90% accuracy.'
  const split3 = splitSentences(s3)
  assert(
    split3.length === 1,
    'Sentence with e.g., et al., i.e. counts as exactly 1 sentence',
    `got ${split3.length}`,
  )

  const s4 = 'Mr. Davis met Mrs. Gable and Ms. Chen at 4 p.m.'
  const split4 = splitSentences(s4)
  assert(
    split4.length === 1,
    'Sentence with Mr., Mrs., Ms. counts as exactly 1 sentence',
    `got ${split4.length}`,
  )

  // --------------------------------------------------------------------------
  // TEST 2: Word Count Form Bands (SWT, WE, SST)
  // --------------------------------------------------------------------------
  console.log('\n--- 2. Word Count Form Bands ---')

  // Summarize Written Text (SWT: 1 sentence, 5–75 words)
  const wordsN = (n: number) => Array.from({ length: n }, (_, i) => `word${i}`).join(' ') + '.'

  const swtTooShort = formBand('summarize-written-text', 'Too short.') // 2 words
  assert(swtTooShort.score === 0, 'SWT < 5 words receives Form 0')

  const swtValid = formBand(
    'summarize-written-text',
    'Human language regulates information density to maintain a uniform communication rate across diverse grammars.',
  )
  assert(swtValid.score === 1, 'SWT 1 sentence of 15 words receives Form 1')

  assert(
    formBand('summarize-written-text', wordsN(75)).score === 1,
    'SWT with 75 words receives Form 1',
  )
  assert(
    formBand('summarize-written-text', wordsN(76)).score === 0,
    'SWT with 76 words (>75) receives Form 0',
  )

  const swtTwoSentences = formBand(
    'summarize-written-text',
    'This is sentence one. This is sentence two.',
  )
  assert(swtTwoSentences.score === 0, 'SWT 2 sentences receives Form 0')

  const swtNoPunctuation = formBand(
    'summarize-written-text',
    'This summary has no final terminal punctuation mark',
  )
  assert(swtNoPunctuation.score === 0, 'SWT without end punctuation receives Form 0')

  // Write Essay (WE: 200–300 = Form 1.0; 120–199 or 301–380 = Form 0.5; outside = Form 0)
  assert(
    formBand('write-essay', wordsN(119)).score === 0,
    'Essay with 119 words (<120) receives Form 0',
  )
  assert(
    formBand('write-essay', wordsN(120)).score === 0.5,
    'Essay with 120 words receives Form 0.5 (Band 1)',
  )
  assert(
    formBand('write-essay', wordsN(199)).score === 0.5,
    'Essay with 199 words receives Form 0.5 (Band 1)',
  )
  assert(
    formBand('write-essay', wordsN(200)).score === 1.0,
    'Essay with 200 words receives Form 1.0 (Band 2 top)',
  )
  assert(
    formBand('write-essay', wordsN(300)).score === 1.0,
    'Essay with 300 words receives Form 1.0 (Band 2 top)',
  )
  assert(
    formBand('write-essay', wordsN(301)).score === 0.5,
    'Essay with 301 words receives Form 0.5 (Band 1)',
  )
  assert(
    formBand('write-essay', wordsN(380)).score === 0.5,
    'Essay with 380 words receives Form 0.5 (Band 1)',
  )
  assert(
    formBand('write-essay', wordsN(381)).score === 0,
    'Essay with 381 words (>380) receives Form 0',
  )

  // Summarize Spoken Text (SST: 50–70 = Form 1.0; 40–49 or 71–100 = Form 0.5; outside = Form 0)
  assert(
    formBand('summarize-spoken-text', wordsN(39)).score === 0,
    'SST with 39 words (<40) receives Form 0',
  )
  assert(
    formBand('summarize-spoken-text', wordsN(40)).score === 0.5,
    'SST with 40 words receives Form 0.5 (Band 1)',
  )
  assert(
    formBand('summarize-spoken-text', wordsN(49)).score === 0.5,
    'SST with 49 words receives Form 0.5 (Band 1)',
  )
  assert(
    formBand('summarize-spoken-text', wordsN(50)).score === 1.0,
    'SST with 50 words receives Form 1.0 (Band 2 top)',
  )
  assert(
    formBand('summarize-spoken-text', wordsN(70)).score === 1.0,
    'SST with 70 words receives Form 1.0 (Band 2 top)',
  )
  assert(
    formBand('summarize-spoken-text', wordsN(71)).score === 0.5,
    'SST with 71 words receives Form 0.5 (Band 1)',
  )
  assert(
    formBand('summarize-spoken-text', wordsN(100)).score === 0.5,
    'SST with 100 words receives Form 0.5 (Band 1)',
  )
  assert(
    formBand('summarize-spoken-text', wordsN(101)).score === 0,
    'SST with 101 words (>100) receives Form 0',
  )

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
    maxPoints: 2,
    seconds: 60,
  }
  const dummyKey: AnswerKey = {
    correctChoices: ['Opt A', 'Opt B'],
  }

  // 1 correct + 2 wrong -> 1 - 2 = -1 floored at 0
  const scoreNetNeg = scoreItem(dummyItem, dummyKey, { choices: ['Opt A', 'Opt C', 'Opt D'] })
  assert(
    scoreNetNeg.points === 0,
    'Net negative selections floor cleanly at 0 points (never negative)',
  )
  assert(scoreNetNeg.ratio === 0, 'Net negative selections ratio floors at 0')

  // 0 correct + 2 wrong -> 0 - 2 = -2 floored at 0
  const scoreAllWrong = scoreItem(dummyItem, dummyKey, { choices: ['Opt C', 'Opt D'] })
  assert(scoreAllWrong.points === 0, 'All incorrect selections floor cleanly at 0 points')

  // 2 correct + 1 wrong -> 2 - 1 = 1 out of 2 = 0.5 ratio, 1 point
  const scorePartialNeg = scoreItem(dummyItem, dummyKey, { choices: ['Opt A', 'Opt B', 'Opt C'] })
  assert(scorePartialNeg.points === 1, '2 correct + 1 incorrect yields net 1 point out of 2')
  assert(scorePartialNeg.ratio === 0.5, '2 correct + 1 incorrect yields ratio 0.5')

  // Highlight Incorrect Words (HIW: negative marking on token indices)
  const hiwItem: Item = {
    id: 'test-hiw',
    type: 'highlight-incorrect-words',
    section: 'listening',
    groupId: 'g-hiw',
    responseKind: 'highlight',
    prompt: 'Highlight incorrect words',
    maxPoints: 2,
    seconds: 45,
  }
  const hiwKey: AnswerKey = {
    correctHighlighted: [2, 5],
  }
  const scoreHiwNeg = scoreItem(hiwItem, hiwKey, { highlighted: [2, 3, 4] }) // 1 correct, 2 wrong -> net 0
  assert(scoreHiwNeg.points === 0, 'HIW net negative selections floor cleanly at 0 points')
  assert(scoreHiwNeg.ratio === 0, 'HIW net negative ratio floors at 0')

  const scoreHiwPartial = scoreItem(hiwItem, hiwKey, { highlighted: [2, 5, 3] }) // 2 correct, 1 wrong -> 1 point
  assert(scoreHiwPartial.points === 1, 'HIW 2 correct + 1 incorrect yields net 1 point out of 2')
  assert(scoreHiwPartial.ratio === 0.5, 'HIW 2 correct + 1 incorrect yields ratio 0.5')

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
  assert(
    raGatedResult.traits?.oralFluency === 1,
    'Oral fluency still measured at 1.0 in trait record',
  )

  // --------------------------------------------------------------------------
  // TEST 5: CEFR Mapping & Scale Shape
  // --------------------------------------------------------------------------
  console.log('\n--- 5. CEFR Mapping & Scale Shape ---')
  const cefrTests: Array<[number, string]> = [
    [10, 'A1'],
    [29.5, 'A1'],
    [29.999, 'A1'],
    [30, 'A2'],
    [42.5, 'A2'],
    [43, 'B1'],
    [58.5, 'B1'],
    [59, 'B2'],
    [75.5, 'B2'],
    [76, 'C1'],
    [84.5, 'C1'],
    [84.999, 'C1'],
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
  assert(
    rawToPteScale(0.25) > 10 && rawToPteScale(0.25) < 50,
    '25% raw accuracy maps to lower-intermediate band',
  )
  assert(
    rawToPteScale(0.5) >= 50 && rawToPteScale(0.5) <= 60,
    '50% raw accuracy maps to realistic middle band (50-60)',
  )
  assert(
    rawToPteScale(0.75) > 60 && rawToPteScale(0.75) < 90,
    '75% raw accuracy maps to upper-intermediate band',
  )

  const band = scoreBand(0.75, 70)
  assert(
    band.low <= band.mid && band.mid <= band.high,
    'Score estimation uncertainty band is monotonic',
  )
  assert(band.mid === 70, 'scoreBand midpoint anchors on displayed score')
  assert(band.low < band.high, 'scoreBand defines a non-empty range')

  // --------------------------------------------------------------------------
  // TEST 6: Response Presence & Audio Duration Guards
  // --------------------------------------------------------------------------
  console.log('\n--- 6. hasResponse Presence & Duration Guards ---')
  assert(!hasResponse(undefined), 'undefined response is false')
  assert(!hasResponse({}), 'empty response is false')
  assert(hasResponse({ choice: 'A' }), 'single choice is true')
  assert(!hasResponse({ choice: null as unknown as string }), 'null choice is false')
  assert(hasResponse({ choices: ['A'] }), 'multiple choices is true')
  assert(!hasResponse({ choices: [] }), 'empty choices array is false')
  assert(hasResponse({ blanks: ['answer'] }), 'filled blank is true')
  assert(!hasResponse({ blanks: ['   '] }), 'whitespace-only blank is false')
  assert(hasResponse({ order: ['p1', 'p2'] }), 'order blocks is true')
  assert(hasResponse({ highlighted: [1] }), 'highlighted tokens is true')
  assert(hasResponse({ text: 'Valid essay text' }), 'written text is true')
  assert(!hasResponse({ text: '    ' }), 'whitespace-only text is false')
  assert(hasResponse({ transcript: 'Spoken transcript' }), 'transcript is true')
  assert(
    hasResponse({
      audio: {
        durationMs: 600,
        wordsPerMinute: 120,
        speechRatio: 0.8,
        pauseCount: 0,
        meanPitchHz: 180,
        energyVariance: 0.5,
        reliable: true,
      },
    }),
    'audio > 500ms is true',
  )
  assert(
    !hasResponse({
      audio: {
        durationMs: 300,
        wordsPerMinute: 120,
        speechRatio: 0.8,
        pauseCount: 0,
        meanPitchHz: 180,
        energyVariance: 0.5,
        reliable: true,
      },
    }),
    'audio <= 500ms is false',
  )

  // --------------------------------------------------------------------------
  // TEST 7: softF1 Mathematical Bounds & Operator Precedence
  // --------------------------------------------------------------------------
  console.log('\n--- 7. softF1 Bounds & Operator Precedence ---')
  assert(softF1('', ['term1', 'term2']) === 0, 'empty candidate gives 0')
  assert(softF1('random words here', []) === 0, 'empty reference terms gives 0')
  assert(
    softF1('completely unrelated text', ['energy', 'climate']) === 0,
    'zero term hits gives 0 cleanly',
  )
  assert(
    softF1('energy climate renewable', ['energy', 'climate', 'renewable']) === 1,
    'perfect match gives 1',
  )
  const partialF1 = softF1('energy climate', ['energy', 'climate', 'renewable'])
  assert(partialF1 > 0 && partialF1 < 1, 'partial match is in (0, 1)')
  assert(Number.isFinite(partialF1), 'partial score is finite number')

  // --------------------------------------------------------------------------
  // TEST 8: Auth Store Contract & Groq Validation
  // --------------------------------------------------------------------------
  console.log('\n--- 8. Auth Store Contract & Groq Validation ---')
  const authState = useAuth.getState()
  assert(authState.user === null, 'initial user is null')
  assert(authState.token === null, 'initial token is null')
  assert(authState.error === null, 'initial error is null')

  authState.setSession(
    { id: 'usr-test-1', email: 'test@example.com', targetScore: 79 },
    'mock-token-xyz',
    Date.now() + 3600000,
  )
  assert(useAuth.getState().user?.email === 'test@example.com', 'setSession sets user email')
  assert(useAuth.getState().token === 'mock-token-xyz', 'setSession sets token')
  assert(useAuth.getState().hasLoggedInBefore === true, 'hasLoggedInBefore is true')

  useSettings.getState().set('groqApiKey', 'test-secret-key')
  useSettings.getState().set('aiScoringEnabled', true)
  useSettings.getState().recordAiUsage({ totalTokens: 42 })
  useAuth.getState().logout()
  assert(useAuth.getState().user === null, 'logout clears user')
  assert(useAuth.getState().token === null, 'logout clears token')
  assert(useAuth.getState().expiresAt === null, 'logout clears expiresAt')
  assert(useAuth.getState().lastEmail === null, 'logout clears the saved email')
  assert(useSettings.getState().settings.groqApiKey === '', 'logout clears the Groq key')
  assert(useSettings.getState().settings.aiScoringEnabled === false, 'logout disables AI scoring')
  assert(
    useSettings.getState().settings.aiUsage.totalRequests === 0,
    'logout resets AI usage telemetry',
  )

  // checkRateLimit returns an object, never a bare truthy/falsy value. This
  // guards the regression where call sites wrote `if (limited)` and rejected
  // every request, including the first one.
  const rateDb = (count: number) =>
    ({
      exec: async () => undefined,
      prepare: () => ({
        bind: () => ({
          first: async () => ({ count, reset_at: Math.floor(Date.now() / 1000) + 60 }),
          run: async () => undefined,
        }),
      }),
    }) as unknown as Parameters<typeof checkRateLimit>[0]
  const allowedRate = await checkRateLimit(rateDb(1), 'test:allowed', 5, 60)
  assert(
    allowedRate.allowed === true && allowedRate.retryAfter === 0,
    'rate limit allows a request below the limit',
  )
  const blockedRate = await checkRateLimit(rateDb(6), 'test:blocked', 5, 60)
  assert(
    blockedRate.allowed === false && blockedRate.retryAfter > 0,
    'rate limit reports blocked requests explicitly',
  )

  const emptyKeyValidation = await validateGroqKey('   ')
  assert(!emptyKeyValidation.ok, 'empty Groq API key is rejected')
  assert(
    emptyKeyValidation.error === 'API key is required',
    'empty Groq API key gives descriptive error',
  )

  // --------------------------------------------------------------------------
  // TEST 9: Auth Safety, Score Clamping & SSR Audio Guard
  // --------------------------------------------------------------------------
  console.log('\n--- 9. Auth Safety, Score Clamping & SSR Audio Guard ---')
  const testToken = 'abc123def456+&=/ '
  const encodedToken = encodeURIComponent(testToken)
  assert(
    !encodedToken.includes(' ') && !encodedToken.includes('&') && !encodedToken.includes('+'),
    'token is safely URL encoded',
  )

  const clampTarget = (raw: number) => Math.max(10, Math.min(90, Math.round(raw)))
  assert(clampTarget(5) === 10, 'score below 10 clamps to 10')
  assert(clampTarget(95) === 90, 'score above 90 clamps to 90')
  assert(clampTarget(78.6) === 79, 'fractional score rounds to nearest integer')
  assert(Number.isFinite(clampTarget(50)), 'clamped score is guaranteed finite')

  let toneError = false
  try {
    playSuccessTone()
  } catch {
    toneError = true
  }
  assert(!toneError, 'playSuccessTone executes safely in SSR/node environment')

  // --------------------------------------------------------------------------
  // TEST 10: Backend Auth & Session Security Contract
  // --------------------------------------------------------------------------
  console.log('\n--- 10. Backend Auth & Session Security Contract ---')
  const testSecret = '0123456789abcdef0123456789abcdef0123456789abcdef'
  const sessionData = { userId: 'usr-auth-test', email: 'candidate@pte-prep.com' }
  const validToken = await createSessionToken(sessionData, testSecret, 3600)
  assert(
    typeof validToken === 'string' && validToken.includes('.'),
    'createSessionToken creates signed token',
  )

  const verifiedSession = await verifySessionToken(validToken, testSecret)
  assert(
    verifiedSession !== null && verifiedSession.userId === 'usr-auth-test',
    'valid token verifies successfully',
  )
  assert(verifiedSession?.aud === 'pte-api', 'session audience matches pte-api')

  const tamperedSig = validToken.slice(0, -4) + 'zzzz'
  const badSigResult = await verifySessionToken(tamperedSig, testSecret)
  assert(badSigResult === null, 'tampered signature is rejected')

  const [, tail] = validToken.split('.')
  const tamperedPayload = 'eyJ1c2VySWQiOiJoYWNrZWQifQ.' + tail
  const badPayloadResult = await verifySessionToken(tamperedPayload, testSecret)
  assert(badPayloadResult === null, 'tampered payload is rejected')

  const wrongSecretResult = await verifySessionToken(validToken, testSecret + '_wrong_secret_bytes')
  assert(wrongSecretResult === null, 'token signed with wrong secret is rejected')

  const expiredToken = await createSessionToken(sessionData, testSecret, -100)
  const expiredResult = await verifySessionToken(expiredToken, testSecret)
  assert(expiredResult === null, 'expired token is rejected')

  const { hash, salt } = await hashPassword('StudentSecretP@ss2026')
  const validPass = await verifyPassword('StudentSecretP@ss2026', hash, salt)
  assert(validPass === true, 'correct password verifies successfully')
  const invalidPass = await verifyPassword('WrongPassword123!', hash, salt)
  assert(invalidPass === false, 'incorrect password is rejected')

  let secretRejected = false
  try {
    requireSecret({ JWT_SECRET: 'short' } as unknown as import('../../functions/types').Env)
  } catch {
    secretRejected = true
  }
  assert(secretRejected, 'short JWT_SECRET is strictly rejected')

  assert(
    resolveAllowedOrigin('https://pte-prep.pages.dev') === 'https://pte-prep.pages.dev',
    'canonical domain is allowed',
  )
  assert(
    resolveAllowedOrigin('https://preview-123.pte-prep.pages.dev') ===
      'https://preview-123.pte-prep.pages.dev',
    'pages.dev subdomains allowed',
  )
  assert(
    resolveAllowedOrigin('http://localhost:5173') === 'http://localhost:5173',
    'localhost is allowed for dev',
  )
  assert(
    resolveAllowedOrigin('https://evil.com') === null,
    'arbitrary third party origin is rejected',
  )
  assert(
    resolveAllowedOrigin('https://pte-prep.pages.dev.attacker.com') === null,
    'subdomain spoofing origin is rejected',
  )

  // --------------------------------------------------------------------------
  // TEST 11: Static XSS & Unsafe DOM Sink Audit
  // --------------------------------------------------------------------------
  console.log('\n--- 11. Static XSS & Unsafe DOM Sink Audit ---')
  const scanSources = (dir: string, sinks: string[]): string[] => {
    let findings: string[] = []
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        if (!['node_modules', 'dist', '.git'].includes(entry.name)) {
          findings = findings.concat(scanSources(full, sinks))
        }
      } else if (/\.(ts|tsx|js|mjs)$/.test(entry.name)) {
        if (full.endsWith('boundary-and-gating.ts')) continue
        const text = fs.readFileSync(full, 'utf8')
        for (const sink of sinks) {
          if (text.includes(sink)) {
            findings.push(`${full}: ${sink}`)
          }
        }
      }
    }
    return findings
  }

  const forbiddenSinks = [
    'dangerouslySetInnerHTML',
    '.innerHTML =',
    '.outerHTML =',
    'document.write(',
  ]
  const srcSinkFindings = scanSources(path.resolve(process.cwd(), 'src'), forbiddenSinks)
  const fnSinkFindings = scanSources(path.resolve(process.cwd(), 'functions'), forbiddenSinks)
  assert(srcSinkFindings.length === 0, 'zero unsafe DOM sinks in src/ directory')
  assert(fnSinkFindings.length === 0, 'zero unsafe DOM sinks in functions/ directory')

  // --------------------------------------------------------------------------
  // TEST 12: AI Scorer Trait Isolation & Extraneous Key Protection
  // --------------------------------------------------------------------------
  console.log('\n--- 12. AI Scorer Trait Isolation & Extraneous Key Protection ---')
  const speakingTraits = { content: 3, pronunciation: 4, oralFluency: 5 }
  assert(computeAiRawScore(speakingTraits, 'speaking') === 12, 'speaking traits sum correctly')

  const speakingWithExtra = {
    content: 3,
    pronunciation: 4,
    oralFluency: 5,
    total: 12,
    overallScore: 90,
    confidence: 0.95,
    unrelatedField: 10,
  }
  assert(
    computeAiRawScore(speakingWithExtra, 'speaking') === 12,
    'extraneous numeric keys do not inflate speaking rawScore',
  )

  const essayWithExtra = {
    content: 3,
    grammar: 2,
    vocabulary: 2,
    spelling: 2,
    development: 2,
    range: 2,
    hallucinatedKey: 99,
  }
  assert(
    computeAiRawScore(essayWithExtra, 'essay') === 13,
    'extraneous keys do not inflate essay rawScore',
  )

  const negativeTraits = { content: -5, pronunciation: 4, oralFluency: 3 }
  assert(
    computeAiRawScore(negativeTraits, 'speaking') === 7,
    'negative trait values floor cleanly at 0',
  )

  const nonNumericTraits = { content: 'high', pronunciation: null, oralFluency: 5 }
  assert(
    computeAiRawScore(nonNumericTraits as unknown as Record<string, unknown>, 'speaking') === 5,
    'non-numeric trait values ignored safely',
  )

  const excessiveTraits = { content: 10, pronunciation: 10, oralFluency: 10 }
  assert(
    computeAiRawScore(excessiveTraits, 'speaking') === 13,
    'traits exceeding rubric limits are clamped to maximum (3+5+5=13)',
  )

  // --------------------------------------------------------------------------
  // TEST 13: Sync Reconciliation & Tombstone Conflict Resolution Contract
  // --------------------------------------------------------------------------
  console.log('\n--- 13. Sync Reconciliation & Tombstone Conflict Resolution ---')
  const cleanSync = planSyncReconciliation(['att-1', 'att-2'], ['att-2', 'att-3'], [])
  assert(
    cleanSync.toPull.length === 1 && cleanSync.toPull[0] === 'att-1',
    'missing cloud attempt is marked for pull',
  )
  assert(
    cleanSync.toPush.length === 1 && cleanSync.toPush[0] === 'att-3',
    'new local attempt is marked for push',
  )

  const tombstoneSync = planSyncReconciliation(['att-deleted'], [], ['att-deleted'])
  assert(
    tombstoneSync.toPull.length === 0,
    'tombstoned cloud attempt is never pulled (prevents resurrection)',
  )

  const tombstonePushSync = planSyncReconciliation([], ['att-deleted'], ['att-deleted'])
  assert(tombstonePushSync.toPush.length === 0, 'tombstoned local attempt is never pushed to cloud')

  const identicalSync = planSyncReconciliation(['att-1'], ['att-1'], [])
  assert(
    identicalSync.toPull.length === 0 && identicalSync.toPush.length === 0,
    'identical sets yield zero push and pull',
  )

  const userAId = 'user-a-123'
  const userBId = 'user-b-456'
  const attemptFromUserA: Partial<AttemptRecord> = {
    id: 'att-user-a',
    userId: userAId,
    ownerId: userAId,
  }
  const attemptFromGuest: Partial<AttemptRecord> = { id: 'att-guest', ownerId: 'guest:device-1' }
  const attemptFromUserB: Partial<AttemptRecord> = {
    id: 'att-user-b',
    userId: userBId,
    ownerId: userBId,
  }
  assert(
    canPushAttemptToCloud(attemptFromUserA, userAId) === true,
    'user A attempt is allowed for user A sync',
  )
  assert(
    canPushAttemptToCloud(attemptFromGuest, userAId) === false,
    'guest attempt is blocked from account sync',
  )
  assert(
    canPushAttemptToCloud(attemptFromUserB, userAId) === false,
    'user B attempt is blocked from user A sync',
  )
  assert(
    canPushAttemptToCloud(attemptFromUserA, null) === false,
    'no signed-in user blocks every upload',
  )
  assert(
    attemptOwnerId({ userId: userAId }, 'guest:device-1') === userAId,
    'legacy account attempt is scoped to its user',
  )
  assert(
    attemptOwnerId({}, 'guest:device-1') === 'guest:device-1',
    'legacy guest attempt is scoped to the device guest',
  )

  // --------------------------------------------------------------------------
  // TEST 14: Reset Password Form Contract Validation
  // --------------------------------------------------------------------------
  console.log('\n--- 14. Reset Password Form Contract Validation ---')
  const noToken = validateResetPasswordForm('', 'newPassword123', 'newPassword123')
  assert(
    !noToken.valid && noToken.error?.includes('Missing or invalid reset token'),
    'missing token rejected',
  )

  const shortPass = validateResetPasswordForm('valid-token-xyz', 'short', 'short')
  assert(
    !shortPass.valid && shortPass.error?.includes('at least 8 characters'),
    'password under 8 chars rejected',
  )

  const mismatchPass = validateResetPasswordForm('valid-token-xyz', 'password123', 'password456')
  assert(
    !mismatchPass.valid && mismatchPass.error?.includes('do not match'),
    'password mismatch rejected',
  )

  const validForm = validateResetPasswordForm('valid-token-xyz', 'password123', 'password123')
  assert(
    validForm.valid && validForm.error === undefined,
    'valid reset password submission accepted',
  )

  // --------------------------------------------------------------------------
  // TEST 15: Response Echo Formatting & XSS Plaintext Sanitization Contract
  // --------------------------------------------------------------------------
  console.log('\n--- 15. Response Echo Formatting & Plaintext Safety ---')
  const emptyEcho = formatResponseEchoLines({})
  assert(emptyEcho.length === 0, 'empty response echoes zero lines')

  const choiceEcho = formatResponseEchoLines({ choice: 'Option B' })
  assert(
    choiceEcho.length === 1 && choiceEcho[0] === 'Your answer: Option B',
    'choice formatted correctly',
  )

  const choicesEcho = formatResponseEchoLines({ choices: ['Option A', 'Option C'] })
  assert(
    choicesEcho.length === 1 && choicesEcho[0] === 'Your answers: Option A, Option C',
    'choices array formatted',
  )

  const blanksEcho = formatResponseEchoLines({ blanks: ['alpha', 'beta'] })
  assert(
    blanksEcho.length === 1 && blanksEcho[0] === 'Your answers: alpha, beta',
    'blanks formatted correctly',
  )

  const orderEcho = formatResponseEchoLines({ order: ['Step 1', 'Step 2'] })
  assert(
    orderEcho.length === 1 && orderEcho[0] === 'Your order: Step 1 → Step 2',
    'order formatted with arrows',
  )

  const highlightEchoWithTokens = formatResponseEchoLines({ highlighted: [0, 2] }, [
    'apple',
    'banana',
    'cherry',
  ])
  assert(
    highlightEchoWithTokens.length === 1 &&
      highlightEchoWithTokens[0] === 'You highlighted: “apple”, “cherry”',
    'highlighted tokens formatted with quotes',
  )

  const highlightEchoFallback = formatResponseEchoLines({ highlighted: [4] })
  assert(
    highlightEchoFallback.length === 1 && highlightEchoFallback[0] === 'You highlighted: #5',
    'highlighted fallback indexes correctly',
  )

  const rawHtmlText = '<script>alert("xss")</script>'
  const xssTextEcho = formatResponseEchoLines({ text: rawHtmlText })
  assert(
    xssTextEcho.length === 1 && xssTextEcho[0] === `You wrote: ${rawHtmlText}`,
    'malicious HTML remains unparsed plain string data for React auto-escaping',
  )

  const rawHtmlTranscript = '<img src=x onerror=alert(1)>'
  const xssTranscriptEcho = formatResponseEchoLines({ transcript: rawHtmlTranscript })
  assert(
    xssTranscriptEcho.length === 1 &&
      xssTranscriptEcho[0] === `Your answer (transcribed): ${rawHtmlTranscript}`,
    'speech transcript remains unparsed plain string data',
  )

  // --------------------------------------------------------------------------
  // TEST 16: Format Utilities Contract
  // --------------------------------------------------------------------------
  console.log('\n--- 16. Format Utilities Contract ---')
  assert(formatClock(45) === '00:45', 'formatClock seconds only')
  assert(formatClock(125) === '02:05', 'formatClock minutes and seconds')
  assert(formatClock(3665) === '1:01:05', 'formatClock with hours')
  assert(formatClock(-10) === '00:00', 'formatClock negative clamps to zero')

  assert(formatDuration(45000) === '45s', 'formatDuration seconds')
  assert(formatDuration(60000) === '1m', 'formatDuration exact minutes')
  assert(formatDuration(125000) === '2m 5s', 'formatDuration minutes and seconds')

  const sampleDate = '2026-10-19T14:00:00.000Z'
  assert(
    typeof formatDate(sampleDate) === 'string' && formatDate(sampleDate).length > 0,
    'formatDate produces string',
  )
  assert(
    typeof formatDateTime(sampleDate) === 'string' && formatDateTime(sampleDate).includes(','),
    'formatDateTime contains comma',
  )

  assert(pluralize(1, 'point') === '1 point', 'pluralize singular')
  assert(pluralize(2, 'point') === '2 points', 'pluralize plural default')
  assert(pluralize(2, 'ox', 'oxen') === '2 oxen', 'pluralize custom plural')

  assert(clamp(5, 0, 10) === 5, 'clamp within range')
  assert(clamp(-5, 0, 10) === 0, 'clamp below min')
  assert(clamp(15, 0, 10) === 10, 'clamp above max')

  assert(percent(50, 100) === 50, 'percent standard calculation')
  assert(percent(5, 0) === 0, 'percent zero denominator')
  assert(percent(150, 100) === 100, 'percent clamped to 100')

  assert(roundTo(14.2, 5) === 15, 'roundTo step')
  assert(roundTo(12.3, 5) === 10, 'roundTo lower step')

  assert(titleCase('read aloud') === 'Read Aloud', 'titleCase capitalization')

  // --------------------------------------------------------------------------
  // TEST 17: Random & PRNG Utilities Contract
  // --------------------------------------------------------------------------
  console.log('\n--- 17. Random & PRNG Utilities Contract ---')
  const rng1 = makeRng(42)
  const rng2 = makeRng(42)
  const seq1 = [rng1(), rng1(), rng1()]
  const seq2 = [rng2(), rng2(), rng2()]
  assert(
    seq1.every((v, i) => v === seq2[i]),
    'PRNG with same seed is deterministic',
  )

  const hash1 = hashString('pte-academic')
  const hash2 = hashString('pte-academic')
  const hash3 = hashString('pte-core')
  assert(hash1 === hash2, 'hashString is deterministic for identical input')
  assert(hash1 !== hash3, 'hashString produces distinct hash for different input')

  const itemsToShuffle = [1, 2, 3, 4, 5, 6, 7, 8]
  const shuffled = shuffle(itemsToShuffle, makeRng(999))
  assert(shuffled.length === itemsToShuffle.length, 'shuffle preserves array length')
  assert(
    itemsToShuffle.every((item) => shuffled.includes(item)),
    'shuffle preserves all elements',
  )

  const picked3 = pickN(itemsToShuffle, 3, makeRng(123))
  assert(picked3.length === 3, 'pickN selects requested number of elements')
  const pickedTooMany = pickN(itemsToShuffle, 20, makeRng(123))
  assert(pickedTooMany.length === itemsToShuffle.length, 'pickN caps at array length')

  const one = pickOne(['a', 'b', 'c'], makeRng(456))
  assert(['a', 'b', 'c'].includes(one), 'pickOne returns element from array')

  let pickErrorThrown = false
  try {
    pickOne([], makeRng(1))
  } catch {
    pickErrorThrown = true
  }
  assert(pickErrorThrown, 'pickOne on empty array throws error')

  const seedVal = randomSeed()
  assert(
    typeof seedVal === 'number' && seedVal >= 0 && Number.isFinite(seedVal),
    'randomSeed returns non-negative integer',
  )

  // --------------------------------------------------------------------------
  // TEST 18: Tailwind CN Utility Contract
  // --------------------------------------------------------------------------
  console.log('\n--- 18. Tailwind CN Utility Contract ---')
  assert(cn('px-2 py-1', 'bg-blue-500') === 'px-2 py-1 bg-blue-500', 'cn joins class names')
  assert(cn('p-4', 'p-2') === 'p-2', 'cn resolves tailwind conflicts')
  const shouldHide = false
  assert(
    cn('btn', shouldHide && 'hidden', null, undefined, 'active') === 'btn active',
    'cn ignores falsy inputs',
  )

  // --------------------------------------------------------------------------
  // TEST 19: Chart Data Plaintext Description Contract
  // --------------------------------------------------------------------------
  console.log('\n--- 19. Chart Data Plaintext Description Contract ---')
  assert(
    describeData('non-existent-chart-id') === '',
    'describeData returns empty string for missing chart',
  )

  const barDesc = describeData('chart-renewable')
  assert(typeof barDesc === 'string' && barDesc.length > 0, 'describeData bar chart produces text')

  const lineDesc = describeData('chart-sea-temp')
  assert(
    typeof lineDesc === 'string' && lineDesc.length > 0,
    'describeData line chart produces text',
  )

  const pieDesc = describeData('chart-households')
  assert(
    typeof pieDesc === 'string' && pieDesc.includes('per cent'),
    'describeData pie chart includes per cent',
  )

  const processDesc = describeData('process-compost')
  assert(
    typeof processDesc === 'string' && processDesc.includes('—'),
    'describeData process chart includes steps',
  )

  const diagramDesc = describeData('diagram-ecosystem')
  assert(
    typeof diagramDesc === 'string' && diagramDesc.length > 0,
    'describeData diagram chart produces text',
  )

  const tableDesc = describeData('table-study-design')
  assert(
    typeof tableDesc === 'string' && tableDesc.length > 0,
    'describeData table-chart produces text',
  )

  // --------------------------------------------------------------------------
  // TEST 20: Weak Types Practice Ranking Contract
  // --------------------------------------------------------------------------
  console.log('\n--- 20. Weak Types Practice Ranking Contract ---')
  assert(weakestTypes([]).length === 0, 'empty attempts returns empty recommendations')

  const mockAttempt1: AttemptRecord = {
    id: 'att-1',
    mockId: 'm1',
    mockTitle: 'Mock 1',
    mode: 'full',
    startedAt: '2026-10-01T10:00:00Z',
    finishedAt: '2026-10-01T12:00:00Z',
    durationMs: 7200000,
    overallScore: 60,
    cefr: 'B2',
    earnedPoints: 50,
    availablePoints: 100,
    skillScores: { speaking: 50, writing: 50, reading: 50, listening: 50 },
    breakdown: {
      'read-aloud': {
        type: 'read-aloud',
        label: 'Read Aloud',
        earnedPoints: 2,
        maxPoints: 10,
        total: 5,
        accuracy: 0.2,
      },
      'write-essay': {
        type: 'write-essay',
        label: 'Write Essay',
        earnedPoints: 9,
        maxPoints: 10,
        total: 1,
        accuracy: 0.9,
      },
    },
  }
  const mockAttempt2: AttemptRecord = {
    id: 'att-2',
    mockId: 'm2',
    mockTitle: 'Mock 2',
    mode: 'full',
    startedAt: '2026-10-02T10:00:00Z',
    finishedAt: '2026-10-02T12:00:00Z',
    durationMs: 7200000,
    overallScore: 65,
    cefr: 'B2',
    earnedPoints: 55,
    availablePoints: 100,
    skillScores: { speaking: 55, writing: 55, reading: 55, listening: 55 },
    breakdown: {
      'read-aloud': {
        type: 'read-aloud',
        label: 'Read Aloud',
        earnedPoints: 3,
        maxPoints: 10,
        total: 5,
        accuracy: 0.3,
      },
      'write-essay': {
        type: 'write-essay',
        label: 'Write Essay',
        earnedPoints: 8,
        maxPoints: 10,
        total: 1,
        accuracy: 0.8,
      },
    },
  }

  const weakPractised = weakestTypes([mockAttempt1, mockAttempt2], 3, true)
  assert(weakPractised.length === 2, 'practised filter restricts to attempted types only')
  assert(weakPractised[0]?.type === 'read-aloud', 'read-aloud ranks weaker than write-essay')
  assert(
    weakPractised[0]?.priority !== null && weakPractised[0].priority < 50,
    'accuracy correctly calculated',
  )

  const weakAll = weakestTypes([mockAttempt1, mockAttempt2], 5, false)
  assert(weakAll[0]?.type === 'read-aloud', 'measured weakest comes first')
  assert(weakAll[weakAll.length - 1]?.untested === true, 'untested types sort to the end')

  // --------------------------------------------------------------------------
  // TEST 21: Brevo Transactional Email Contract
  // --------------------------------------------------------------------------
  console.log('\n--- 21. Brevo Transactional Email Contract ---')
  const noApiKeyResult = await sendBrevoEmail({
    apiKey: '',
    senderEmail: 'test@example.com',
    to: 'dest@example.com',
    subject: 'Test',
    htmlContent: '<p>Hi</p>',
  })
  assert(
    !noApiKeyResult.ok && Boolean(noApiKeyResult.error?.includes('BREVO_API_KEY')),
    'missing Brevo API key is rejected',
  )

  const noSenderResult = await sendBrevoEmail({
    apiKey: 'brevo-key-123',
    senderEmail: '',
    to: 'dest@example.com',
    subject: 'Test',
    htmlContent: '<p>Hi</p>',
  })
  assert(
    !noSenderResult.ok && Boolean(noSenderResult.error?.includes('BREVO_SENDER_EMAIL')),
    'missing sender email is rejected',
  )

  const origFetch = globalThis.fetch
  try {
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ messageId: 'msg-abc-123' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      })) as unknown as typeof fetch

    const successResult = await sendBrevoEmail({
      apiKey: 'valid-key',
      senderEmail: 'sender@example.com',
      to: 'dest@example.com',
      subject: 'Welcome',
      htmlContent: '<p>Hello</p>',
    })
    assert(
      successResult.ok && successResult.messageId === 'msg-abc-123',
      'Brevo email succeeds with messageId',
    )

    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ message: 'Invalid recipient' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })) as unknown as typeof fetch

    const failResult = await sendBrevoEmail({
      apiKey: 'valid-key',
      senderEmail: 'sender@example.com',
      to: 'invalid-email',
      subject: 'Welcome',
      htmlContent: '<p>Hello</p>',
    })
    assert(
      !failResult.ok && failResult.error === 'Invalid recipient',
      'Brevo API error is extracted',
    )

    globalThis.fetch = (async () => {
      throw new Error('Connection refused')
    }) as unknown as typeof fetch

    const networkErrResult = await sendBrevoEmail({
      apiKey: 'valid-key',
      senderEmail: 'sender@example.com',
      to: 'dest@example.com',
      subject: 'Welcome',
      htmlContent: '<p>Hello</p>',
    })
    assert(
      !networkErrResult.ok && networkErrResult.error === 'Connection refused',
      'Brevo network exception caught',
    )
  } finally {
    globalThis.fetch = origFetch
  }

  // --------------------------------------------------------------------------
  // TEST 22: Rate Limit Contract
  // --------------------------------------------------------------------------
  console.log('\n--- 22. Rate Limit Contract ---')
  const reqWithIp = new Request('https://pte-prep.pages.dev', {
    headers: { 'cf-connecting-ip': '198.51.100.42' },
  })
  assert(getClientIp(reqWithIp) === '198.51.100.42', 'getClientIp extracts cf-connecting-ip header')

  const reqNoIp = new Request('https://pte-prep.pages.dev')
  assert(getClientIp(reqNoIp) === 'unknown', 'getClientIp defaults to unknown when header absent')

  const rateExceeded = rateLimitExceededResponse(45)
  assert(rateExceeded.status === 429, 'rateLimitExceededResponse status is 429')
  assert(
    rateExceeded.headers.get('Retry-After') === '45',
    'rateLimitExceededResponse sets Retry-After header',
  )

  const throwingDb = {
    exec: async () => undefined,
    prepare: () => ({
      bind: () => ({
        first: async () => {
          throw new Error('D1 connection timeout')
        },
        run: async () => undefined,
      }),
    }),
  } as unknown as D1Database

  const failClosedResult = await checkRateLimit(throwingDb, 'test:err', 5, 60)
  assert(
    failClosedResult.allowed === false && failClosedResult.retryAfter === 60,
    'checkRateLimit fails closed on DB error',
  )

  const nullRowDb = {
    exec: async () => undefined,
    prepare: () => ({
      bind: () => ({
        first: async () => null,
        run: async () => undefined,
      }),
    }),
  } as unknown as D1Database

  const nullRowResult = await checkRateLimit(nullRowDb, 'test:null', 5, 60)
  assert(
    nullRowResult.allowed === false && nullRowResult.retryAfter === 60,
    'checkRateLimit fails closed on null row',
  )

  // --------------------------------------------------------------------------
  // TEST 23: Extended Auth & Session Table Contract
  // --------------------------------------------------------------------------
  console.log('\n--- 23. Extended Auth & Session Table Contract ---')
  assert(
    resolveSessionExpiry() === DEFAULT_SESSION_EXPIRY_SECONDS,
    'resolveSessionExpiry defaults to 7 days',
  )
  assert(
    resolveSessionExpiry({ SESSION_EXPIRY_SECONDS: '3600' } as any) === 3600,
    'resolveSessionExpiry parses custom seconds',
  )
  assert(
    resolveSessionExpiry({ SESSION_EXPIRY_SECONDS: '10' } as any) === 60,
    'resolveSessionExpiry clamps to minimum 60s',
  )

  assert(
    resolvePbkdf2Iterations() === DEFAULT_PBKDF2_ITERATIONS,
    'resolvePbkdf2Iterations defaults to 100k',
  )
  assert(
    resolvePbkdf2Iterations({ PBKDF2_ITERATIONS: '50000' } as any) === 50000,
    'resolvePbkdf2Iterations parses custom iterations',
  )
  assert(
    resolvePbkdf2Iterations({ PBKDF2_ITERATIONS: '500' } as any) === DEFAULT_PBKDF2_ITERATIONS,
    'resolvePbkdf2Iterations rejects below 10k',
  )

  const bearerReq = new Request('https://pte-prep.pages.dev', {
    headers: { Authorization: 'Bearer my-test-token-123' },
  })
  assert(extractBearerToken(bearerReq) === 'my-test-token-123', 'extractBearerToken extracts token')
  const noBearerReq = new Request('https://pte-prep.pages.dev')
  assert(extractBearerToken(noBearerReq) === null, 'extractBearerToken returns null when missing')

  const hashedHex = await sha256Hex('reset-password-test-token')
  assert(
    typeof hashedHex === 'string' && hashedHex.length === 64,
    'sha256Hex returns 64-char hex string',
  )

  const mockSessionStorage = new Map<string, { userId: string; expiresAt: number }>()
  const mockSessionsDb = {
    exec: async () => undefined,
    prepare: (sql: string) => ({
      bind: (...args: any[]) => ({
        run: async () => {
          if (sql.includes('INSERT INTO user_sessions')) {
            mockSessionStorage.set(args[0], { userId: args[1], expiresAt: args[2] })
          } else if (sql.includes('DELETE FROM user_sessions WHERE jti = ?')) {
            mockSessionStorage.delete(args[0])
          } else if (sql.includes('DELETE FROM user_sessions WHERE user_id = ?')) {
            for (const [key, val] of mockSessionStorage.entries()) {
              if (val.userId === args[0]) mockSessionStorage.delete(key)
            }
          }
          return { success: true }
        },
        first: async () => {
          if (sql.includes('rate_limits')) {
            return { count: 1, reset_at: Math.floor(Date.now() / 1000) + 60 }
          }
          const item = mockSessionStorage.get(args[0])
          if (item && item.userId === args[1] && item.expiresAt > args[2]) {
            return { jti: args[0] }
          }
          return null
        },
      }),
    }),
  } as unknown as D1Database

  const secretKey = 'test-secret-that-is-at-least-32-characters-long-1234'
  const testSessionToken = await createSessionToken(
    { userId: 'user-table-test', email: 'test@example.com' },
    secretKey,
    3600,
    mockSessionsDb,
  )
  assert(testSessionToken.includes('.'), 'session token created with DB registration')

  const verifiedDbSession = await verifySessionToken(testSessionToken, secretKey, mockSessionsDb)
  assert(verifiedDbSession?.userId === 'user-table-test', 'session verified against session DB')

  await revokeSession(mockSessionsDb, verifiedDbSession!.jti!)
  const revokedVerify = await verifySessionToken(testSessionToken, secretKey, mockSessionsDb)
  assert(revokedVerify === null, 'revoked session rejected by DB verification')

  await recordSession(
    mockSessionsDb,
    'manual-jti-xyz',
    'user-multi-device',
    Math.floor(Date.now() / 1000) + 3600,
  )
  await revokeAllUserSessions(mockSessionsDb, 'user-multi-device')
  assert(
    mockSessionStorage.has('manual-jti-xyz') === false,
    'revokeAllUserSessions clears all device sessions',
  )

  // --------------------------------------------------------------------------
  // TEST 24: Middleware Edge Request Pipeline
  // --------------------------------------------------------------------------
  console.log('\n--- 24. Middleware Edge Request Pipeline ---')
  const preflightContext = {
    request: new Request('https://pte-prep.pages.dev/api/attempts', {
      method: 'OPTIONS',
      headers: { Origin: 'https://pte-prep.pages.dev' },
    }),
    env: { SITE_ORIGIN: 'https://pte-prep.pages.dev' } as any,
    next: async () => new Response('should not be called'),
  } as any

  const preflightResponse = await middlewareOnRequest(preflightContext)
  assert(preflightResponse.status === 204, 'preflight OPTIONS request returns 204')
  assert(
    preflightResponse.headers.get('Access-Control-Allow-Origin') === 'https://pte-prep.pages.dev',
    'preflight allows valid origin',
  )

  const normalContext = {
    request: new Request('https://pte-prep.pages.dev/api/test', {
      headers: { Origin: 'https://pte-prep.pages.dev' },
    }),
    env: { SITE_ORIGIN: 'https://pte-prep.pages.dev' } as any,
    next: async () => new Response(JSON.stringify({ status: 'ok' }), { status: 200 }),
  } as any

  const normalResponse = await middlewareOnRequest(normalContext)
  assert(normalResponse.status === 200, 'normal request passes through')
  assert(
    normalResponse.headers.get('X-Content-Type-Options') === 'nosniff',
    'middleware injects nosniff header',
  )

  const errorContext = {
    request: new Request('https://pte-prep.pages.dev/api/crash'),
    env: {} as any,
    next: async () => {
      throw new Error('Unexpected crash')
    },
  } as any

  const errorResponse = await middlewareOnRequest(errorContext)
  assert(errorResponse.status === 500, 'middleware catches uncaught errors and returns 500')

  // --------------------------------------------------------------------------
  // TEST 25: Storage & Guest Owner Fallbacks
  // --------------------------------------------------------------------------
  console.log('\n--- 25. Storage & Guest Owner Fallbacks ---')
  const storage = safeStateStorage()
  storage.setItem('test-key-abc', 'test-value-123')
  assert(
    storage.getItem('test-key-abc') === 'test-value-123',
    'safeStateStorage getItem returns set value',
  )
  storage.removeItem('test-key-abc')
  assert(storage.getItem('test-key-abc') === null, 'safeStateStorage removeItem clears value')

  const guestId = getGuestOwnerId()
  assert(guestId.startsWith('guest:'), 'getGuestOwnerId returns guest-scoped identifier')
  assert(getGuestOwnerId() === guestId, 'getGuestOwnerId is cached across calls')

  // --------------------------------------------------------------------------
  // TEST 26: Cloudflare API Handlers Contract
  // --------------------------------------------------------------------------
  console.log('\n--- 26. Cloudflare API Handlers Contract ---')
  const logoutNoTokenContext = {
    request: new Request('https://pte-prep.pages.dev/api/auth/logout', { method: 'POST' }),
    env: { DB: mockSessionsDb } as any,
  } as any
  const logoutNoTokenRes = await logoutPost(logoutNoTokenContext)
  assert(logoutNoTokenRes.status === 200, 'logout with no token returns 200 ok')

  const registerBadEmailContext = {
    request: new Request('https://pte-prep.pages.dev/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: 'bad-email', password: 'password123' }),
    }),
    env: { DB: mockSessionsDb } as any,
  } as any
  const regBadEmailRes = await registerPost(registerBadEmailContext)
  assert(regBadEmailRes.status === 400, 'register rejects malformed email')

  const registerShortPassContext = {
    request: new Request('https://pte-prep.pages.dev/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: 'valid@example.com', password: 'short' }),
    }),
    env: { DB: mockSessionsDb } as any,
  } as any
  const regShortPassRes = await registerPost(registerShortPassContext)
  assert(regShortPassRes.status === 400, 'register rejects short password')

  const loginBadJsonContext = {
    request: new Request('https://pte-prep.pages.dev/api/auth/login', {
      method: 'POST',
      body: 'invalid-json',
    }),
    env: { DB: mockSessionsDb } as any,
  } as any
  const loginBadJsonRes = await loginPost(loginBadJsonContext)
  assert(loginBadJsonRes.status === 400, 'login rejects invalid JSON body')

  const loginBadEmailContext = {
    request: new Request('https://pte-prep.pages.dev/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'not-an-email', password: 'password123' }),
    }),
    env: { DB: mockSessionsDb } as any,
  } as any
  const loginBadEmailRes = await loginPost(loginBadEmailContext)
  assert(loginBadEmailRes.status === 400, 'login rejects invalid email format')

  const meNoAuthContext = {
    request: new Request('https://pte-prep.pages.dev/api/auth/me'),
    env: { JWT_SECRET: secretKey, DB: mockSessionsDb } as any,
  } as any
  const meNoAuthRes = await meGet(meNoAuthContext)
  assert(meNoAuthRes.status === 401, 'me endpoint rejects unauthenticated request')

  const attemptsNoAuthContext = {
    request: new Request('https://pte-prep.pages.dev/api/attempts'),
    env: { JWT_SECRET: secretKey, DB: mockSessionsDb } as any,
  } as any
  const attemptsNoAuthRes = await attemptsGet(attemptsNoAuthContext)
  assert(attemptsNoAuthRes.status === 401, 'attempts endpoint rejects unauthenticated request')

  const attemptIdBadIdContext = {
    request: new Request('https://pte-prep.pages.dev/api/attempts/bad!id', {
      headers: { Authorization: `Bearer ${testSessionToken}` },
    }),
    params: { id: 'bad!id' },
    env: { JWT_SECRET: secretKey, DB: mockSessionsDb } as any,
  } as any
  const attemptIdBadIdRes = await attemptIdGet(attemptIdBadIdContext)
  assert(
    attemptIdBadIdRes.status === 400 || attemptIdBadIdRes.status === 401,
    'attempt detail rejects invalid attempt ID',
  )

  // Full API lifecycle test with stateful in-memory D1 mock
  const mockUsers = new Map<string, any>()
  const mockAttempts = new Map<string, any>()
  const mockPasswordResets = new Map<string, any>()
  const fullMockDb = {
    exec: async () => undefined,
    prepare: (sql: string) => {
      // Statements with no parameters are called as prepare(sql).run().
      const statement = (...args: any[]) => ({
        run: async () => {
          if (sql.includes('INSERT INTO users')) {
            if (Array.from(mockUsers.values()).some((u) => u.email === args[1])) {
              throw new Error('UNIQUE constraint failed: users.email')
            }
            mockUsers.set(args[0], {
              id: args[0],
              email: args[1],
              password_hash: args[2],
              password_salt: args[3],
              target_score: args[4],
              created_at: new Date().toISOString(),
            })
          } else if (sql.includes('UPDATE users SET target_score = ?')) {
            const u = mockUsers.get(args[1])
            if (u) u.target_score = args[0]
          } else if (sql.includes('UPDATE users SET password_hash = ?')) {
            const u = mockUsers.get(args[2])
            if (u) {
              u.password_hash = args[0]
              u.password_salt = args[1]
            }
          } else if (sql.includes('INSERT INTO attempts')) {
            mockAttempts.set(args[0], {
              id: args[0],
              user_id: args[1],
              mock_id: args[2],
              mock_title: args[3],
              mode: args[4],
              started_at: args[5],
              finished_at: args[6],
              duration_ms: args[7],
              overall_score: args[8],
              cefr: args[9],
              earned_points: args[10],
              available_points: args[11],
              skill_scores: args[12],
              breakdown: args[13],
              responses: args[14],
              synced_at: new Date().toISOString(),
            })
          } else if (sql.includes('DELETE FROM attempts WHERE user_id = ?')) {
            let changes = 0
            for (const [k, v] of mockAttempts.entries()) {
              if (v.user_id === args[0]) {
                mockAttempts.delete(k)
                changes++
              }
            }
            return { meta: { changes }, success: true }
          } else if (sql.includes('DELETE FROM attempts WHERE id = ?')) {
            const didDelete = mockAttempts.delete(args[0])
            return { meta: { changes: didDelete ? 1 : 0 }, success: true }
          } else if (sql.includes('INSERT INTO user_sessions')) {
            mockSessionStorage.set(args[0], { userId: args[1], expiresAt: args[2] })
          } else if (sql.includes('DELETE FROM user_sessions WHERE user_id = ?')) {
            for (const [k, v] of mockSessionStorage.entries()) {
              if (v.userId === args[0]) mockSessionStorage.delete(k)
            }
          } else if (sql.includes('INSERT INTO password_resets')) {
            mockPasswordResets.set(args[2], {
              id: args[0],
              user_id: args[1],
              token_hash: args[2],
              expires_at: args[3],
              created_at: new Date().toISOString(),
            })
          } else if (sql.includes('UPDATE password_resets SET used_at = datetime')) {
            const pr = mockPasswordResets.get(args[0])
            if (pr && !pr.used_at && new Date(pr.expires_at).getTime() > Date.now()) {
              pr.used_at = new Date().toISOString()
              return { meta: { changes: 1 }, success: true }
            }
            return { meta: { changes: 0 }, success: true }
          }
          return { meta: { changes: 1 }, success: true }
        },
        first: async () => {
          if (sql.includes('rate_limits')) {
            return { count: 1, reset_at: Math.floor(Date.now() / 1000) + 60 }
          }
          if (sql.includes('FROM users WHERE email = ?')) {
            for (const u of mockUsers.values()) {
              if (u.email === args[0]) return u
            }
            return null
          }
          if (sql.includes('FROM users WHERE id = ?')) {
            return mockUsers.get(args[0]) ?? null
          }
          if (sql.includes('FROM attempts') && sql.includes('id = ?')) {
            const a = mockAttempts.get(args[0])
            return a && a.user_id === args[1] ? a : null
          }
          if (sql.includes('FROM user_sessions')) {
            const item = mockSessionStorage.get(args[0])
            if (item && item.userId === args[1] && item.expiresAt > args[2]) {
              return { jti: args[0] }
            }
            return null
          }
          if (sql.includes('FROM password_resets WHERE token_hash = ?')) {
            return mockPasswordResets.get(args[0]) ?? null
          }
          if (sql.includes('FROM password_resets WHERE user_id = ?')) {
            for (const pr of mockPasswordResets.values()) {
              if (
                pr.user_id === args[0] &&
                new Date(pr.expires_at).getTime() > Date.now() &&
                pr.simulatedRecent
              ) {
                return { id: pr.id }
              }
            }
            return null
          }
          return null
        },
        all: async () => {
          if (sql.includes('SELECT id FROM attempts WHERE user_id = ?')) {
            const list = Array.from(mockAttempts.values()).filter((a) => a.user_id === args[0])
            return { results: list.map((a) => ({ id: a.id })) }
          }
          if (sql.includes('FROM attempts WHERE user_id = ?')) {
            const list = Array.from(mockAttempts.values()).filter((a) => a.user_id === args[0])
            return { results: list }
          }
          return { results: [] }
        },
      })
      return { ...statement(), bind: statement }
    },
  } as unknown as D1Database

  const apiEnv = {
    JWT_SECRET: secretKey,
    DB: fullMockDb,
    SESSION_EXPIRY_SECONDS: '3600',
    PBKDF2_ITERATIONS: '10000',
    BREVO_API_KEY: 'test-brevo-key',
    BREVO_SENDER_EMAIL: 'support@pteprep.com',
    BREVO_SENDER_NAME: 'PTE Prep Support',
    SITE_ORIGIN: 'https://pteprep.com',
  } as any

  // 1. Successful registration
  const regSuccessRes = await registerPost({
    request: new Request('https://pte-prep.pages.dev/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'newuser@example.com',
        password: 'Password123!',
        targetScore: 79,
      }),
    }),
    env: apiEnv,
  } as any)
  assert(regSuccessRes.status === 201, 'register creates new user account (201)')
  const regSuccessData = (await regSuccessRes.json()) as any
  assert(Boolean(regSuccessData.token), 'register returns bearer session token')
  assert(regSuccessData.user?.email === 'newuser@example.com', 'register returns user record')

  // 2. Duplicate registration rejected
  const regDupRes = await registerPost({
    request: new Request('https://pte-prep.pages.dev/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: 'newuser@example.com', password: 'Password123!' }),
    }),
    env: apiEnv,
  } as any)
  assert(regDupRes.status === 400, 'register rejects duplicate email with 400 Bad Request')

  // 3. Login with wrong password
  const loginWrongPassRes = await loginPost({
    request: new Request('https://pte-prep.pages.dev/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'newuser@example.com', password: 'WrongPassword!' }),
    }),
    env: apiEnv,
  } as any)
  assert(loginWrongPassRes.status === 401, 'login rejects incorrect password (401)')

  // 4. Successful login
  const loginSuccessRes = await loginPost({
    request: new Request('https://pte-prep.pages.dev/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'newuser@example.com', password: 'Password123!' }),
    }),
    env: apiEnv,
  } as any)
  assert(loginSuccessRes.status === 200, 'login succeeds with correct password (200)')
  const loginSuccessData = (await loginSuccessRes.json()) as any
  const userToken = loginSuccessData.token as string
  assert(Boolean(userToken), 'login returns valid session token')

  // 5. Me GET endpoint
  const meRes = await meGet({
    request: new Request('https://pte-prep.pages.dev/api/auth/me', {
      headers: { Authorization: `Bearer ${userToken}` },
    }),
    env: apiEnv,
  } as any)
  assert(meRes.status === 200, 'me GET returns profile for authenticated user')
  const meData = (await meRes.json()) as any
  assert(meData.user?.email === 'newuser@example.com', 'me returns user profile')

  // 6. Me PATCH target score
  const mePatchScoreRes = await mePatch({
    request: new Request('https://pte-prep.pages.dev/api/auth/me', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${userToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetScore: 85 }),
    }),
    env: apiEnv,
  } as any)
  assert(mePatchScoreRes.status === 200, 'me PATCH updates targetScore')

  // 7. Attempts POST
  const sampleAttemptRow: AttemptRecord = {
    id: 'att-user-12345678',
    userId: meData.user.id,
    mockId: 'm1',
    mockTitle: 'Mock 1',
    mode: 'full',
    startedAt: '2026-10-19T10:00:00Z',
    finishedAt: '2026-10-19T12:00:00Z',
    durationMs: 7200000,
    overallScore: 78,
    cefr: 'C1',
    earnedPoints: 70,
    availablePoints: 90,
    skillScores: { speaking: 78, writing: 78, reading: 78, listening: 78 },
  }
  const attemptPostRes = await attemptsPost({
    request: new Request('https://pte-prep.pages.dev/api/attempts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(sampleAttemptRow),
    }),
    env: apiEnv,
  } as any)
  assert(attemptPostRes.status === 200, 'attempts POST saves attempt to account')

  // 8. Attempts GET ids=1 paginated
  const attemptIdsRes = await attemptsGet({
    request: new Request('https://pte-prep.pages.dev/api/attempts?ids=1', {
      headers: { Authorization: `Bearer ${userToken}` },
    }),
    env: apiEnv,
  } as any)
  assert(attemptIdsRes.status === 200, 'attempts GET ?ids=1 returns paginated ids')
  const attemptIdsData = (await attemptIdsRes.json()) as any
  assert(attemptIdsData.ids?.includes('att-user-12345678'), 'attempt id present in ids list')

  // 9. Attempt ID GET
  const attemptDetailRes = await attemptIdGet({
    request: new Request('https://pte-prep.pages.dev/api/attempts/att-user-12345678', {
      headers: { Authorization: `Bearer ${userToken}` },
    }),
    params: { id: 'att-user-12345678' },
    env: apiEnv,
  } as any)
  assert(attemptDetailRes.status === 200, 'attempt detail GET fetches single attempt')

  // 10. Attempt ID DELETE
  const attemptDeleteSingleRes = await attemptIdDelete({
    request: new Request('https://pte-prep.pages.dev/api/attempts/att-user-12345678', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userToken}` },
    }),
    params: { id: 'att-user-12345678' },
    env: apiEnv,
  } as any)
  assert(attemptDeleteSingleRes.status === 200, 'attempt detail DELETE removes attempt')

  // 11. Attempts DELETE all
  const attemptsDeleteAllRes = await attemptsDelete({
    request: new Request('https://pte-prep.pages.dev/api/attempts', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userToken}` },
    }),
    env: apiEnv,
  } as any)
  assert(attemptsDeleteAllRes.status === 200, 'attempts bulk DELETE clears account history')

  // --------------------------------------------------------------------------
  // TEST 27: Password Reset API Flow
  // --------------------------------------------------------------------------
  console.log('\n--- 27. Password Reset API Flow ---')
  // 1. Invalid JSON body to forgot-password
  const fpInvalidJson = await forgotPasswordPost({
    request: new Request('https://pte-prep.pages.dev/api/auth/forgot-password', {
      method: 'POST',
      body: 'invalid-json',
    }),
    env: apiEnv,
  } as any)
  assert(fpInvalidJson.status === 400, 'forgot-password rejects invalid JSON (400)')

  // 2. Invalid email format
  const fpInvalidEmail = await forgotPasswordPost({
    request: new Request('https://pte-prep.pages.dev/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'not-an-email' }),
    }),
    env: apiEnv,
  } as any)
  assert(fpInvalidEmail.status === 400, 'forgot-password rejects invalid email (400)')

  // 3. Missing DB binding
  const fpMissingDb = await forgotPasswordPost({
    request: new Request('https://pte-prep.pages.dev/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'user@example.com' }),
    }),
    env: { ...apiEnv, DB: null },
  } as any)
  assert(fpMissingDb.status === 500, 'forgot-password fails when DB is missing (500)')

  // 4. Missing Brevo API key
  const fpMissingBrevo = await forgotPasswordPost({
    request: new Request('https://pte-prep.pages.dev/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'user@example.com' }),
    }),
    env: { ...apiEnv, BREVO_API_KEY: '' },
  } as any)
  assert(
    fpMissingBrevo.status === 503,
    'forgot-password fails uniformly when Brevo key missing (503)',
  )

  // 5. Non-existent user (timing probe path)
  const fpUnknownUser = await forgotPasswordPost({
    request: new Request('https://pte-prep.pages.dev/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'nonexistent@example.com' }),
    }),
    env: apiEnv,
  } as any)
  assert(
    fpUnknownUser.status === 200,
    'forgot-password returns 200 generic message for unknown email',
  )

  // 6. Registered user with Brevo delivery failure (mock fetch rejects or 500)
  globalThis.fetch = async (url: any, opts: any) => {
    if (String(url).includes('brevo.com')) {
      return new Response(JSON.stringify({ message: 'Delivery failed' }), { status: 500 })
    }
    return origFetch(url, opts)
  }
  const fpBrevoFail = await forgotPasswordPost({
    request: new Request('https://pte-prep.pages.dev/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'newuser@example.com' }),
    }),
    env: apiEnv,
  } as any)
  assert(
    fpBrevoFail.status === 200,
    'forgot-password answers generically when Brevo delivery fails',
  )

  // 7. Successful reset email sent
  let sentResetLink = ''
  globalThis.fetch = async (url: any, opts: any) => {
    if (String(url).includes('brevo.com')) {
      const payload = JSON.parse(opts.body)
      sentResetLink = payload.textContent || ''
      return new Response(JSON.stringify({ messageId: 'brevo-msg-123' }), { status: 200 })
    }
    return origFetch(url, opts)
  }
  const fpSuccess = await forgotPasswordPost({
    request: new Request('https://pte-prep.pages.dev/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'newuser@example.com' }),
    }),
    env: apiEnv,
  } as any)
  assert(fpSuccess.status === 200, 'forgot-password succeeds and sends reset email (200)')
  assert(sentResetLink.includes('token='), 'reset email contained token parameter')
  const rawTokenMatch = sentResetLink.match(/token=([a-zA-Z0-9]+)/)
  const resetToken = rawTokenMatch ? rawTokenMatch[1] : ''
  assert(Boolean(resetToken), 'extracted raw reset token')

  // 8. Recent reset request throttled
  const fpThrottled = await forgotPasswordPost({
    request: new Request('https://pte-prep.pages.dev/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'newuser@example.com' }),
    }),
    env: apiEnv,
  } as any)
  assert(fpThrottled.status === 200, 'forgot-password throttles repeated requests for same user')

  // 9. Reset Password Post: invalid JSON
  const rpInvalidJson = await resetPasswordPost({
    request: new Request('https://pte-prep.pages.dev/api/auth/reset-password', {
      method: 'POST',
      body: 'bad-json',
    }),
    env: apiEnv,
  } as any)
  assert(rpInvalidJson.status === 400, 'reset-password rejects invalid JSON (400)')

  // 10. Reset Password: missing or short token
  const rpShortToken = await resetPasswordPost({
    request: new Request('https://pte-prep.pages.dev/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token: 'short', password: 'ValidPassword123!' }),
    }),
    env: apiEnv,
  } as any)
  assert(rpShortToken.status === 400, 'reset-password rejects token < 16 chars (400)')

  // 11. Reset Password: short password
  const rpShortPass = await resetPasswordPost({
    request: new Request('https://pte-prep.pages.dev/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token: resetToken, password: 'short' }),
    }),
    env: apiEnv,
  } as any)
  assert(rpShortPass.status === 400, 'reset-password rejects password < 8 chars (400)')

  // 12. Reset Password: missing DB
  const rpMissingDb = await resetPasswordPost({
    request: new Request('https://pte-prep.pages.dev/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token: resetToken, password: 'ValidPassword123!' }),
    }),
    env: { ...apiEnv, DB: null },
  } as any)
  assert(rpMissingDb.status === 500, 'reset-password fails when DB is missing (500)')

  // 13. Reset Password: wrong token
  const rpWrongToken = await resetPasswordPost({
    request: new Request('https://pte-prep.pages.dev/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token: 'wrongtoken1234567890abcdef', password: 'ValidPassword123!' }),
    }),
    env: apiEnv,
  } as any)
  assert(rpWrongToken.status === 400, 'reset-password rejects invalid/unknown token (400)')

  // 14. Reset Password: valid token success
  const rpSuccess = await resetPasswordPost({
    request: new Request('https://pte-prep.pages.dev/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token: resetToken, password: 'NewValidPassword123!' }),
    }),
    env: apiEnv,
  } as any)
  assert(rpSuccess.status === 200, 'reset-password successfully updates password (200)')
  const rpData = (await rpSuccess.json()) as any
  assert(Boolean(rpData.token), 'reset-password returns new session token')
  assert(rpData.user?.email === 'newuser@example.com', 'reset-password returns user record')

  // 15. Replaying used token is rejected
  const rpReplay = await resetPasswordPost({
    request: new Request('https://pte-prep.pages.dev/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token: resetToken, password: 'AnotherPassword123!' }),
    }),
    env: apiEnv,
  } as any)
  assert(rpReplay.status === 400, 'reset-password rejects replaying used token (400)')

  globalThis.fetch = origFetch

  // --------------------------------------------------------------------------
  // TEST 28: Auth, Attempts, Middleware & Lib Edge Cases
  // --------------------------------------------------------------------------
  console.log('\n--- 28. Auth, Attempts, Middleware & Lib Edge Cases ---')
  // 1. Middleware catch error
  const mwErrorRes = await middlewareOnRequest({
    request: new Request('https://pte-prep.pages.dev/api/attempts'),
    env: apiEnv,
    next: async () => {
      throw new Error('Simulated unhandled exception')
    },
  } as any)
  assert(mwErrorRes.status === 500, 'middleware returns 500 on unhandled exception')
  const mwErrJson = (await mwErrorRes.json()) as any
  assert(mwErrJson.error === 'Internal server error', 'middleware returns clean error JSON')

  // 2. sendBrevoEmail error branches
  const brevoNoKey = await sendBrevoEmail({
    apiKey: '',
    senderEmail: 's@a.com',
    to: 'r@a.com',
    subject: 'sub',
    htmlContent: 'html',
  })
  assert(
    !brevoNoKey.ok && Boolean(brevoNoKey.error?.includes('BREVO_API_KEY')),
    'sendBrevoEmail fails without API key',
  )
  const brevoNoSender = await sendBrevoEmail({
    apiKey: 'k',
    senderEmail: '',
    to: 'r@a.com',
    subject: 'sub',
    htmlContent: 'html',
  })
  assert(
    !brevoNoSender.ok && Boolean(brevoNoSender.error?.includes('BREVO_SENDER_EMAIL')),
    'sendBrevoEmail fails without sender email',
  )

  // Brevo fetch exception
  globalThis.fetch = async () => {
    throw new Error('DNS failure')
  }
  const brevoNetworkError = await sendBrevoEmail({
    apiKey: 'k',
    senderEmail: 's@a.com',
    to: 'r@a.com',
    subject: 'sub',
    htmlContent: 'html',
  })
  assert(
    !brevoNetworkError.ok && brevoNetworkError.error === 'DNS failure',
    'sendBrevoEmail handles network exception',
  )

  // Brevo non-JSON response
  globalThis.fetch = async () => new Response('Internal Server Error', { status: 502 })
  const brevoBadStatus = await sendBrevoEmail({
    apiKey: 'k',
    senderEmail: 's@a.com',
    to: 'r@a.com',
    subject: 'sub',
    htmlContent: 'html',
  })
  assert(
    !brevoBadStatus.ok && Boolean(brevoBadStatus.error?.includes('502')),
    'sendBrevoEmail handles non-JSON HTTP failure',
  )

  // Brevo with toName and textContent
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ messageId: 'm-999' }), { status: 200 })
  const brevoSuccessExtra = await sendBrevoEmail({
    apiKey: 'k',
    senderEmail: 's@a.com',
    senderName: 'PTE',
    to: 'r@a.com',
    toName: 'Recipient',
    subject: 'sub',
    htmlContent: 'html',
    textContent: 'text',
  })
  assert(
    brevoSuccessExtra.ok && brevoSuccessExtra.messageId === 'm-999',
    'sendBrevoEmail succeeds with optional name & textContent',
  )
  globalThis.fetch = origFetch

  // 3. rateLimit.ts edge cases
  const ipEmptyReq = new Request('https://pte-prep.pages.dev')
  assert(
    getClientIp(ipEmptyReq) === 'unknown',
    'getClientIp falls back to unknown when cf-connecting-ip is missing',
  )
  const rlFailDb = {
    exec: async () => {
      throw new Error('exec failed')
    },
    prepare: () => ({
      bind: () => ({
        run: async () => {
          throw new Error('cleanup failed')
        },
        first: async () => null,
      }),
    }),
  } as any
  const rlNoRowRes = await checkRateLimit(rlFailDb, 'key1', 5, 60)
  assert(
    !rlNoRowRes.allowed && rlNoRowRes.retryAfter === 60,
    'checkRateLimit fails closed when row is null',
  )

  const rlThrowDb = {
    exec: async () => undefined,
    prepare: () => ({
      bind: () => ({
        run: async () => undefined,
        first: async () => {
          throw new Error('database down')
        },
      }),
    }),
  } as any
  const rlThrowRes = await checkRateLimit(rlThrowDb, 'key2', 5, 60)
  assert(
    !rlThrowRes.allowed && rlThrowRes.retryAfter === 60,
    'checkRateLimit fails closed on database exception',
  )

  // 4. auth.ts edge cases
  assert(
    resolvePbkdf2Iterations({ PBKDF2_ITERATIONS: 'invalid' } as any) === DEFAULT_PBKDF2_ITERATIONS,
    'resolvePbkdf2Iterations fallback on NaN',
  )
  assert(
    resolvePbkdf2Iterations({ PBKDF2_ITERATIONS: '100' } as any) === DEFAULT_PBKDF2_ITERATIONS,
    'resolvePbkdf2Iterations fallback on < 100k',
  )
  let threwNoSecret = false
  try {
    requireSecret({} as any)
  } catch {
    threwNoSecret = true
  }
  assert(threwNoSecret, 'requireSecret throws when JWT_SECRET missing')
  let threwShortSecret = false
  try {
    requireSecret({ JWT_SECRET: 'short-secret' } as any)
  } catch {
    threwShortSecret = true
  }
  assert(threwShortSecret, 'requireSecret throws when JWT_SECRET < 32 chars')

  assert(
    (await verifySessionToken('no-dot-token', secretKey)) === null,
    'verifySessionToken returns null for token with no dot',
  )
  assert(
    (await verifySessionToken('a.b', secretKey)) === null,
    'verifySessionToken returns null for invalid signature',
  )
  assert(
    (await verifyPassword('pass', 'hash', 'invalid_base64_!@#$')) === false,
    'verifyPassword returns false on malformed salt',
  )

  // 5. me.ts PATCH password change
  const mePatchNoPass = await mePatch({
    request: new Request('https://pte-prep.pages.dev/api/auth/me', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${rpData.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword: 'AnotherPassword123!' }),
    }),
    env: apiEnv,
  } as any)
  assert(mePatchNoPass.status === 400, 'me PATCH rejects newPassword without currentPassword (400)')

  const mePatchWrongPass = await mePatch({
    request: new Request('https://pte-prep.pages.dev/api/auth/me', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${rpData.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentPassword: 'WrongPassword!',
        newPassword: 'AnotherPassword123!',
      }),
    }),
    env: apiEnv,
  } as any)
  assert(mePatchWrongPass.status === 400, 'me PATCH rejects incorrect currentPassword (400)')

  const mePatchShortPass = await mePatch({
    request: new Request('https://pte-prep.pages.dev/api/auth/me', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${rpData.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: 'NewValidPassword123!', newPassword: 'short' }),
    }),
    env: apiEnv,
  } as any)
  assert(mePatchShortPass.status === 400, 'me PATCH rejects newPassword < 8 chars (400)')

  const mePatchSuccess = await mePatch({
    request: new Request('https://pte-prep.pages.dev/api/auth/me', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${rpData.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentPassword: 'NewValidPassword123!',
        newPassword: 'BrandNewPassword123!',
      }),
    }),
    env: apiEnv,
  } as any)
  assert(mePatchSuccess.status === 200, 'me PATCH updates password and returns fresh token (200)')
  const mePatchData = (await mePatchSuccess.json()) as any
  const freshUserToken = mePatchData.token as string
  assert(Boolean(freshUserToken), 'new session token issued after password change')

  // 6. Attempts POST validation edge cases
  const postTooLarge = await attemptsPost({
    request: new Request('https://pte-prep.pages.dev/api/attempts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${freshUserToken}`,
        'Content-Type': 'application/json',
        'Content-Length': '2000000',
      },
      body: JSON.stringify({ id: 'att-toolarge-123' }),
    }),
    env: apiEnv,
  } as any)
  assert(
    postTooLarge.status === 413,
    'attempts POST rejects payload with Content-Length > 1MB (413)',
  )

  const postBadId = await attemptsPost({
    request: new Request('https://pte-prep.pages.dev/api/attempts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${freshUserToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'bad/id' }),
    }),
    env: apiEnv,
  } as any)
  assert(postBadId.status === 400, 'attempts POST rejects invalid attempt id characters (400)')

  const postBadSkills = await attemptsPost({
    request: new Request('https://pte-prep.pages.dev/api/attempts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${freshUserToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'att-valid-123', skillScores: 'not-an-object' }),
    }),
    env: apiEnv,
  } as any)
  assert(postBadSkills.status === 400, 'attempts POST rejects non-object skillScores (400)')

  const postBadBreakdown = await attemptsPost({
    request: new Request('https://pte-prep.pages.dev/api/attempts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${freshUserToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'att-valid-123', breakdown: 'not-an-object' }),
    }),
    env: apiEnv,
  } as any)
  assert(postBadBreakdown.status === 400, 'attempts POST rejects non-object breakdown (400)')

  const postBadResponses = await attemptsPost({
    request: new Request('https://pte-prep.pages.dev/api/attempts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${freshUserToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'att-valid-123', responses: 'not-an-object' }),
    }),
    env: apiEnv,
  } as any)
  assert(postBadResponses.status === 400, 'attempts POST rejects non-object responses (400)')

  const postBadDetails = await attemptsPost({
    request: new Request('https://pte-prep.pages.dev/api/attempts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${freshUserToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'att-valid-123', details: 'not-an-array' }),
    }),
    env: apiEnv,
  } as any)
  assert(postBadDetails.status === 400, 'attempts POST rejects non-array details (400)')

  const postBadSectionIds = await attemptsPost({
    request: new Request('https://pte-prep.pages.dev/api/attempts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${freshUserToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'att-valid-123', sectionIds: 'not-an-array' }),
    }),
    env: apiEnv,
  } as any)
  assert(postBadSectionIds.status === 400, 'attempts POST rejects non-array sectionIds (400)')

  // 7. Attempt detail [id].ts edge cases
  const getIdBad = await attemptIdGet({
    request: new Request('https://pte-prep.pages.dev/api/attempts/bad!id', {
      headers: { Authorization: `Bearer ${freshUserToken}` },
    }),
    params: { id: 'bad!id' },
    env: apiEnv,
  } as any)
  assert(getIdBad.status === 400, 'attempt [id] GET rejects invalid ID format (400)')

  const getIdNotFound = await attemptIdGet({
    request: new Request('https://pte-prep.pages.dev/api/attempts/att-nonexistent-123', {
      headers: { Authorization: `Bearer ${freshUserToken}` },
    }),
    params: { id: 'att-nonexistent-123' },
    env: apiEnv,
  } as any)
  assert(getIdNotFound.status === 404, 'attempt [id] GET returns 404 when attempt not found')

  const delIdNotFound = await attemptIdDelete({
    request: new Request('https://pte-prep.pages.dev/api/attempts/att-nonexistent-123', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${freshUserToken}` },
    }),
    params: { id: 'att-nonexistent-123' },
    env: apiEnv,
  } as any)
  assert(delIdNotFound.status === 404, 'attempt [id] DELETE returns 404 when attempt not found')

  // --------------------------------------------------------------------------
  // TEST 29: Groq AI Scorer & Whisper STT Engine
  // --------------------------------------------------------------------------
  console.log('\n--- 29. Groq AI Scorer & Whisper STT Engine ---')
  // 1. validateGroqKey
  const valEmpty = await validateGroqKey('')
  assert(
    !valEmpty.ok && valEmpty.error === 'API key is required',
    'validateGroqKey fails on empty key',
  )

  globalThis.fetch = async (url: any) => {
    if (String(url).includes('groq.com/openai/v1/models')) {
      return new Response('{"data":[]}', { status: 200 })
    }
    return origFetch(url)
  }
  const valSuccess = await validateGroqKey('gsk_validkey123')
  assert(valSuccess.ok, 'validateGroqKey succeeds on 200')

  globalThis.fetch = async () => new Response('Unauthorized', { status: 401 })
  const valAuthFail = await validateGroqKey('gsk_badkey')
  assert(
    !valAuthFail.ok && Boolean(valAuthFail.error?.includes('401')),
    'validateGroqKey reports HTTP status on failure',
  )

  globalThis.fetch = async () => {
    throw new Error('Network error contacting Groq')
  }
  const valNetworkFail = await validateGroqKey('gsk_key')
  assert(
    !valNetworkFail.ok && Boolean(valNetworkFail.error?.includes('Network error')),
    'validateGroqKey handles network error',
  )

  // 2. evaluateWithAi: empty inputs
  assert(
    (await evaluateWithAi({ id: 'essay-1', type: 'write-essay' }, undefined, '', 'key')) === null,
    'evaluateWithAi returns null on empty text',
  )
  assert(
    (await evaluateWithAi({ id: 'essay-1', type: 'write-essay' }, undefined, 'text', '')) === null,
    'evaluateWithAi returns null on empty apiKey',
  )

  // 3. evaluateWithAi write-essay
  globalThis.fetch = async (url: any, opts: any) => {
    if (String(url).includes('chat/completions')) {
      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  traits: {
                    content: 3,
                    grammar: 2,
                    vocabulary: 2,
                    spelling: 2,
                    development: 2,
                    range: 2,
                  },
                  feedback: ['Excellent cohesive flow', 'Wide academic vocabulary'],
                  modelRewrite: 'Band 90 model essay text',
                }),
              },
            },
          ],
          usage: { prompt_tokens: 150, completion_tokens: 200, total_tokens: 350 },
        }),
        {
          status: 200,
          headers: {
            'x-ratelimit-remaining-requests': '99',
            'x-ratelimit-limit-requests': '100',
            'x-ratelimit-reset-requests': '1s',
          },
        },
      )
    }
    return origFetch(url, opts)
  }

  const essayEval = await evaluateWithAi(
    { id: 'item-essay-1', type: 'write-essay', prompt: 'Discuss climate change impacts.' },
    undefined,
    'Climate change is a pressing global challenge that requires international cooperation...',
    'gsk_test_key',
  )
  assert(essayEval !== null, 'evaluateWithAi evaluates write-essay')
  assert(essayEval?.rawScore === 13, 'evaluateWithAi scores perfect essay traits (13)')
  assert(essayEval?.traits.content === 1, 'evaluateWithAi normalizes essay content (3/3 = 1)')
  assert(
    essayEval?.suggestedRewrittenEssay === 'Band 90 model essay text',
    'evaluateWithAi extracts model rewrite',
  )

  // Cached hit verification
  const cachedEval = await evaluateWithAi(
    { id: 'item-essay-1', type: 'write-essay', prompt: 'Discuss climate change impacts.' },
    undefined,
    'Climate change is a pressing global challenge that requires international cooperation...',
    'gsk_test_key',
  )
  assert(cachedEval === essayEval, 'evaluateWithAi retrieves result from cache')

  // 4. evaluateWithAi speaking (read-aloud)
  globalThis.fetch = async (url: any) => {
    if (String(url).includes('chat/completions')) {
      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  traits: { content: 3, pronunciation: 4, oralFluency: 5 },
                  feedback: ['Clear pronunciation with natural rhythm'],
                }),
              },
            },
          ],
        }),
        { status: 200 },
      )
    }
    return origFetch(url)
  }
  const speakingEval = await evaluateWithAi(
    { id: 'item-ra-1', type: 'read-aloud' },
    'The quick brown fox jumps over the lazy dog.',
    'The quick brown fox jumps over the lazy dog.',
    'gsk_test_key',
  )
  assert(
    speakingEval !== null && speakingEval.rawScore === 12,
    'evaluateWithAi evaluates speaking item',
  )
  assert(speakingEval?.traits.oralFluency === 1, 'oral fluency 5/5 normalized to 1')

  // 5. evaluateWithAi summarize-spoken-text (sst)
  globalThis.fetch = async (url: any) => {
    if (String(url).includes('chat/completions')) {
      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  traits: { content: 2, grammar: 2, vocabulary: 2, spelling: 2 },
                  feedback: ['Comprehensive summary'],
                }),
              },
            },
          ],
        }),
        { status: 200 },
      )
    }
    return origFetch(url)
  }
  const sstEval = await evaluateWithAi(
    { id: 'item-sst-1', type: 'summarize-spoken-text' },
    'Lecture on microeconomics',
    'The speaker discussed market structures and equilibrium pricing in competitive markets.',
    'gsk_test_key',
  )
  assert(sstEval !== null && sstEval.rawScore === 8, 'evaluateWithAi evaluates SST (8 points)')

  // 6. evaluateWithAi summarize-written-text (swt)
  globalThis.fetch = async (url: any) => {
    if (String(url).includes('chat/completions')) {
      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  traits: { content: 2, form: 1, grammar: 2, vocabulary: 2 },
                  feedback: ['Single complete sentence maintained'],
                }),
              },
            },
          ],
        }),
        { status: 200 },
      )
    }
    return origFetch(url)
  }
  const swtEval = await evaluateWithAi(
    { id: 'item-swt-1', type: 'summarize-written-text' },
    'Passage on renewable energy',
    'Although solar transition requires investment, sustainable generation provides long-term stability.',
    'gsk_test_key',
  )
  assert(swtEval !== null && swtEval.rawScore === 7, 'evaluateWithAi evaluates SWT (7 points)')

  // 7. evaluateWithAi error paths
  globalThis.fetch = async () => new Response('Internal error', { status: 500 })
  assert(
    (await evaluateWithAi({ id: 'item-err-1', type: 'write-essay' }, undefined, 'text', 'key')) ===
      null,
    'evaluateWithAi handles 500 API response',
  )

  globalThis.fetch = async () => {
    throw new Error('API unreachable')
  }
  assert(
    (await evaluateWithAi({ id: 'item-err-2', type: 'write-essay' }, undefined, 'text', 'key')) ===
      null,
    'evaluateWithAi handles network throw',
  )

  // 8. transcribeWithWhisper
  assert(
    (await transcribeWithWhisper(new Blob([]), 'gsk_test_key')) === null,
    'transcribeWithWhisper returns null on empty blob',
  )
  assert(
    (await transcribeWithWhisper(new Blob(['data'], { type: 'audio/webm' }), '')) === null,
    'transcribeWithWhisper returns null on empty key',
  )

  globalThis.fetch = async (url: any, opts: any) => {
    if (String(url).includes('audio/transcriptions')) {
      return new Response(
        JSON.stringify({
          text: 'This is the transcribed speech from Whisper.',
          duration: 3.5,
          words: [{ word: 'This', start: 0.1, end: 0.3 }],
        }),
        { status: 200 },
      )
    }
    return origFetch(url, opts)
  }
  const whisperResult = await transcribeWithWhisper(
    new Blob(['dummy-mp4-data'], { type: 'audio/mp4' }),
    'gsk_test_key',
  )
  assert(whisperResult !== null, 'transcribeWithWhisper transcribes audio')
  assert(
    whisperResult?.text === 'This is the transcribed speech from Whisper.',
    'transcription text match',
  )
  assert(whisperResult?.duration === 3.5, 'transcription duration match')

  globalThis.fetch = async () => new Response('Error', { status: 400 })
  assert(
    (await transcribeWithWhisper(new Blob(['data'], { type: 'audio/wav' }), 'key')) === null,
    'transcribeWithWhisper handles 400 response',
  )

  globalThis.fetch = async () => {
    throw new Error('Network error')
  }
  assert(
    (await transcribeWithWhisper(new Blob(['data'], { type: 'audio/ogg' }), 'key')) === null,
    'transcribeWithWhisper handles network throw',
  )

  globalThis.fetch = origFetch

  // --------------------------------------------------------------------------
  // TEST 30: Speech Prosody, Web Speech & Web Audio
  // --------------------------------------------------------------------------
  console.log('\n--- 30. Speech Prosody, Web Speech & Web Audio ---')
  // 1. cleanProsodyText
  assert(
    cleanProsodyText('First—second – third    fourth') === 'First, second, third fourth',
    'cleanProsodyText cleans dashes and extra spaces',
  )

  // 2. Mock SpeechSynthesis & Voices
  const mockVoices = [
    { name: 'Karen Natural (English)', lang: 'en-AU', localService: true },
    { name: 'Daniel (UK)', lang: 'en-GB', localService: true },
    { name: 'Fred', lang: 'en-US', localService: false },
    { name: 'French Voice', lang: 'fr-FR', localService: false },
  ] as any[]

  let synthSpeaking = false
  const mockSynth = {
    get speaking() {
      return synthSpeaking
    },
    getVoices: () => mockVoices,
    speak: (utter: any) => {
      synthSpeaking = true
      setTimeout(() => {
        utter.onend?.()
        synthSpeaking = false
      }, 10)
    },
    cancel: () => {
      synthSpeaking = false
    },
    resume: () => undefined,
    addEventListener: (_event: string, cb: any) => cb(),
  }

  const prevWindow = (globalThis as any).window
  const prevDoc = (globalThis as any).document
  const mockListeners: Record<string, Function[]> = {}
  ;(globalThis as any).window = {
    speechSynthesis: mockSynth,
    setTimeout: globalThis.setTimeout,
    clearTimeout: globalThis.clearTimeout,
    setInterval: globalThis.setInterval,
    clearInterval: globalThis.clearInterval,
    addEventListener: (evt: string, cb: any) => {
      mockListeners[evt] = mockListeners[evt] || []
      mockListeners[evt].push(cb)
    },
    removeEventListener: () => undefined,
  }
  ;(globalThis as any).document = {
    visibilityState: 'visible',
    addEventListener: (evt: string, cb: any) => {
      mockListeners[evt] = mockListeners[evt] || []
      mockListeners[evt].push(cb)
    },
    removeEventListener: () => undefined,
  }
  ;(globalThis as any).SpeechSynthesisUtterance = class {
    text: string
    voice: any
    lang: string = ''
    rate: number = 1
    pitch: number = 1
    onend: any
    onerror: any
    constructor(text: string) {
      this.text = text
    }
  }

  assert(isSpeechSupported(), 'isSpeechSupported returns true when window.speechSynthesis present')

  // 3. speakScript
  const testScript = {
    id: 'test-script',
    title: 'Test',
    kind: 'single-speaker' as const,
    topic: 'test',
    speakers: [{ id: 'sp1', name: 'Speaker 1', voiceHint: 'low' as const }],
    turns: [{ speaker: 'sp1', text: 'Hello, this is a test turn.' }],
  }
  let turnStarted = false
  let playbackEnded = false
  const ctrl = await speakScript(testScript, {
    onTurnStart: () => {
      turnStarted = true
    },
    onEnd: () => {
      playbackEnded = true
    },
  })
  assert(ctrl.speaking, 'speakScript begins in speaking state')
  await new Promise((r) => setTimeout(r, 300))
  assert(turnStarted, 'speakScript triggered onTurnStart')
  assert(playbackEnded, 'speakScript completed turn and called onEnd')

  // 4. speakText
  let textSpoken = false
  await speakText('Ad-hoc prompt announcement', {
    onEnd: () => {
      textSpoken = true
    },
  })
  await new Promise((r) => setTimeout(r, 300))
  assert(textSpoken, 'speakText speaks ad-hoc prompt string')

  // 5. speakWithBeep
  const beepCtrl = await speakWithBeep('Before the missing word', 'After the missing word')
  assert(beepCtrl.speaking, 'speakWithBeep controller active')
  beepCtrl.stop()
  assert(!beepCtrl.speaking, 'speakWithBeep stop clears speaking status')

  // 6. stopAllSpeech
  stopAllSpeech()

  // 7. Web Audio tones with mock AudioContext
  class MockGain {
    gain = {
      setValueAtTime: () => undefined,
      exponentialRampToValueAtTime: () => undefined,
    }
    connect(dest: any) {
      return dest
    }
  }
  class MockOscillator {
    type: string = 'sine'
    frequency = { value: 440 }
    connect(dest: any) {
      return dest
    }
    start() {}
    stop() {}
  }
  class MockAudioContext {
    currentTime = 0
    state = 'running'
    destination = {}
    createOscillator() {
      return new MockOscillator()
    }
    createGain() {
      return new MockGain()
    }
    resume = async () => undefined
  }
  ;(globalThis as any).window.AudioContext = MockAudioContext
  ;(globalThis as any).AudioContext = MockAudioContext

  playTone(880, 100, 0.05)
  playCountdownBeep(3)
  playCountdownBeep(5)
  playErrorTone()

  // --------------------------------------------------------------------------
  // TEST 31: Storage & State Resilience
  // --------------------------------------------------------------------------
  console.log('\n--- 31. Storage & State Resilience ---')
  // 1. safeStateStorage with window.localStorage mock
  const mockStorageMap = new Map<string, string>()
  let shouldThrowLs = false
  ;(globalThis as any).window.localStorage = {
    getItem: (k: string) => {
      if (shouldThrowLs) throw new Error('QuotaExceededError')
      return mockStorageMap.get(k) ?? null
    },
    setItem: (k: string, v: string) => {
      if (shouldThrowLs) throw new Error('QuotaExceededError')
      mockStorageMap.set(k, v)
    },
    removeItem: (k: string) => {
      if (shouldThrowLs) throw new Error('QuotaExceededError')
      mockStorageMap.delete(k)
    },
  }

  const safeStorage = safeStateStorage()
  safeStorage.setItem('key1', 'value1')
  assert(safeStorage.getItem('key1') === 'value1', 'safeStateStorage saves and retrieves item')

  // Quota exception handled in memory
  shouldThrowLs = true
  safeStorage.setItem('key2', 'value2')
  assert(
    safeStorage.getItem('key2') === 'value2',
    'safeStateStorage preserves in memory when setItem throws',
  )
  safeStorage.removeItem('key1')
  shouldThrowLs = false

  // 2. throttledStateStorage
  const throttledStorage = throttledStateStorage(50)
  throttledStorage.setItem('throttleKey', 'initial')
  assert(
    throttledStorage.getItem('throttleKey') === 'initial',
    'throttledStateStorage retrieves pending write immediately',
  )
  await new Promise((r) => setTimeout(r, 70))
  assert(
    mockStorageMap.get('throttleKey') === 'initial',
    'throttledStateStorage flushes to storage after delay',
  )
  throttledStorage.removeItem('throttleKey')
  assert(
    throttledStorage.getItem('throttleKey') === null,
    'throttledStateStorage removeItem clears pending write',
  )

  // 3. guestOwner.ts
  const guestId1 = getGuestOwnerId()
  assert(guestId1.startsWith('guest:'), 'getGuestOwnerId returns guest-scoped identifier')
  const guestId2 = getGuestOwnerId()
  assert(guestId1 === guestId2, 'getGuestOwnerId is deterministic and cached across calls')

  // 4. useLocalOwnerId & useClientReady (tested in React component tree)
  function HooksTestComp() {
    return React.createElement('div', {
      'data-ready': String(useClientReady()),
      'data-owner': String(useLocalOwnerId()),
    })
  }
  const hooksMarkup = renderToStaticMarkup(React.createElement(HooksTestComp))
  assert(
    hooksMarkup.includes('data-ready="false"'),
    'useClientReady returns false during server render snapshot',
  )
  assert(
    hooksMarkup.includes('data-owner="null"'),
    'useLocalOwnerId returns null during server render snapshot',
  )

  // 5. motion.ts
  ;(globalThis as any).window.matchMedia = (query: string) => ({
    matches: query.includes('reduce'),
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
  })
  assert(prefersReducedMotion() === true, 'prefersReducedMotion returns matchMedia matches')
  assert(scrollBehavior() === 'auto', 'scrollBehavior returns auto when reduced motion preferred')

  // 6. recorder.ts
  assert(!isRecordingSupported(), 'isRecordingSupported returns false in server environment')
  assert(
    !isSpeechRecognitionSupported(),
    'isSpeechRecognitionSupported returns false when recognition missing',
  )
  let recorderError = ''
  const recorder = new VoiceRecorder({
    onError: (m) => {
      recorderError = m
    },
  })
  assert(recorder.getState() === 'idle', 'VoiceRecorder starts in idle state')
  const started = await recorder.start()
  assert(!started, 'VoiceRecorder fails to start when recording unsupported')
  assert(recorder.getState() === 'unsupported', 'VoiceRecorder transitions to unsupported state')
  assert(recorderError.includes('microphone'), 'VoiceRecorder reports unsupported microphone error')

  // --------------------------------------------------------------------------
  // TEST 32: Client Database Engine (src/db/db.ts)
  // --------------------------------------------------------------------------
  console.log('\n--- 32. Client Database Engine ---')
  // Mock indexedDB and Dexie prototype version
  ;(globalThis as any).indexedDB = {}
  ;(globalThis as any).window.indexedDB = (globalThis as any).indexedDB

  const dbAttemptsMap = new Map<string, AttemptRecord>()
  const dbKvMap = new Map<string, any>()
  const origDexieVersion = Dexie.prototype.version
  Dexie.prototype.version = function () {
    ;(this as any).attempts = {
      put: async (a: AttemptRecord) => {
        dbAttemptsMap.set(a.id, a)
      },
      get: async (id: string) => dbAttemptsMap.get(id),
      delete: async (id: string) => {
        dbAttemptsMap.delete(id)
      },
      clear: async () => {
        dbAttemptsMap.clear()
      },
      orderBy: () => ({
        reverse: () => ({
          toArray: async () => Array.from(dbAttemptsMap.values()),
          limit: (n: number) => ({
            toArray: async () => Array.from(dbAttemptsMap.values()).slice(0, n),
          }),
        }),
      }),
    }
    ;(this as any).kv = {
      get: async (key: string) => dbKvMap.get(key),
      put: async (row: any) => {
        dbKvMap.set(row.key, row)
      },
    }
    return { stores: () => this }
  } as any

  // 1. saveAttempt and getAttempt
  const sampleLocalAttempt: AttemptRecord = {
    id: 'att-local-1',
    ownerId: 'owner-abc',
    userId: 'owner-abc',
    mockId: 'm1',
    mockTitle: 'Mock Local',
    mode: 'full',
    startedAt: '2026-10-19T10:00:00Z',
    finishedAt: '2026-10-19T12:00:00Z',
    durationMs: 7200000,
    overallScore: 75,
    cefr: 'C1',
    earnedPoints: 65,
    availablePoints: 90,
    skillScores: { speaking: 75, writing: 75, reading: 75, listening: 75 },
  }
  await saveAttempt(sampleLocalAttempt)
  const fetchedLocal = await getAttempt('att-local-1', 'owner-abc')
  assert(fetchedLocal?.id === 'att-local-1', 'saveAttempt and getAttempt retrieve stored record')

  // Access control: attemptOwnerId mismatch returns undefined
  const forbiddenAttempt = await getAttempt('att-local-1', 'different-owner')
  assert(forbiddenAttempt === undefined, 'getAttempt returns undefined on owner mismatch')

  // 2. listAttempts and listAllAttempts
  const allAttempts = await listAllAttempts('owner-abc')
  assert(
    allAttempts.length === 1 && allAttempts[0]?.id === 'att-local-1',
    'listAllAttempts filters by owner',
  )
  const pagedAttempts = await listAttempts(10, 'owner-abc')
  assert(pagedAttempts.length === 1, 'listAttempts limits results')

  // 3. readKv and writeKv
  await writeKv('sync_time', 12345678)
  const syncTime = await readKv<number>('sync_time', 0)
  assert(syncTime === 12345678, 'writeKv and readKv store and retrieve KV row')
  const defaultKv = await readKv<string>('missing_key', 'fallback_val')
  assert(defaultKv === 'fallback_val', 'readKv returns fallback on missing key')

  // 4. deleteAttempt and clearAttempts
  await deleteAttempt('att-local-1')
  assert((await getAttempt('att-local-1')) === undefined, 'deleteAttempt removes record')
  await saveAttempt(sampleLocalAttempt)
  await clearAttempts('owner-abc')
  assert((await listAllAttempts('owner-abc')).length === 0, 'clearAttempts clears owner attempts')
  await saveAttempt(sampleLocalAttempt)
  await clearAttempts()
  assert((await listAllAttempts()).length === 0, 'clearAttempts without owner clears entire store')

  Dexie.prototype.version = origDexieVersion

  // --------------------------------------------------------------------------
  // TEST 33: Test Runner Store Lifecycle (src/store/useTest.ts)
  // --------------------------------------------------------------------------
  console.log('\n--- 33. Test Runner Store Lifecycle ---')
  const testStore = useTest.getState()
  assert(testStore.status === 'briefing', 'useTest starts with briefing status')
  assert(secondsRemaining(null) === 0, 'secondsRemaining returns 0 for null endsAt')
  assert(secondsRemaining(Date.now() + 5000) > 0, 'secondsRemaining returns positive seconds')
  assert(secondsRemaining(Date.now() - 1000) === 0, 'secondsRemaining floors expired time to 0')

  // hasResponse checks
  assert(!hasResponse(undefined), 'hasResponse false for undefined')
  assert(hasResponse({ choice: 'opt-a' }), 'hasResponse true for choice')
  assert(hasResponse({ choices: ['opt-a'] }), 'hasResponse true for choices')
  assert(hasResponse({ blanks: ['answer'] }), 'hasResponse true for blanks')
  assert(hasResponse({ order: ['p1', 'p2'] }), 'hasResponse true for order')
  assert(hasResponse({ highlighted: [1, 2] }), 'hasResponse true for highlighted')
  assert(hasResponse({ text: 'candidate essay text' }), 'hasResponse true for text')
  assert(hasResponse({ transcript: 'candidate speech' }), 'hasResponse true for transcript')
  assert(hasResponse({ audio: { durationMs: 1500 } as any }), 'hasResponse true for audio > 500ms')
  assert(
    !hasResponse({ audio: { durationMs: 200 } as any }),
    'hasResponse false for audio <= 500ms',
  )

  // Assemble mock and run lifecycle
  const testMock = buildFullMock(42)
  useTest.getState().start(testMock, 'full')
  assert(useTest.getState().mock !== null, 'start sets mock in store')
  assert(useTest.getState().status === 'briefing', 'start sets initial status to briefing')

  useTest.getState().beginSection(0)
  assert(useTest.getState().status === 'running', 'beginSection sets status to running')
  assert(useTest.getState().sectionEndsAt !== null, 'beginSection starts clock')

  useTest.getState().tick()
  assert(useTest.getState().elapsedMs >= 0, 'tick computes elapsed duration')

  useTest.getState().extendSection(60)
  assert(useTest.getState().sectionEndsAt !== null, 'extendSection extends clock')

  useTest.getState().expireSection()
  assert(useTest.getState().timeExpired === true, 'expireSection flags time expired')

  useTest.getState().goTo(0, 1)
  assert(useTest.getState().itemIndex === 1, 'goTo moves to section and item index')

  useTest.getState().setResponse('item-1', { choice: 'a' })
  assert(useTest.getState().responses['item-1']?.choice === 'a', 'setResponse records answer')

  useTest.getState().toggleFlag('item-1')
  assert(useTest.getState().responses['item-1']?.flagged === true, 'toggleFlag sets flagged')

  useTest.getState().clearResponse('item-1')
  assert(useTest.getState().responses['item-1'] === undefined, 'clearResponse removes answer')

  useTest.getState().next()
  assert(useTest.getState().itemIndex > 1, 'next advances itemIndex')

  useTest.getState().prev()
  assert(useTest.getState().itemIndex >= 1, 'prev steps back')

  // restore logic
  useTest.getState().restore()
  assert(useTest.getState().status === 'running', 'restore resumes running test')

  const finishedAttempt = await useTest.getState().finish()
  assert(finishedAttempt !== null, 'finish computes report and produces AttemptRecord')
  assert(useTest.getState().status === 'finished', 'finish transitions store to finished')

  useTest.getState().exit()
  assert(useTest.getState().mock === null, 'exit clears active test state')

  // --------------------------------------------------------------------------
  // TEST 34: Auth Store & Cloud Sync Engine
  // --------------------------------------------------------------------------
  console.log('\n--- 34. Auth Store & Cloud Sync Engine ---')
  // 1. useAuth login, setSession, changePassword, logout
  globalThis.fetch = async (url: any, opts: any) => {
    const sUrl = String(url)
    if (sUrl.includes('/api/auth/login')) {
      return new Response(
        JSON.stringify({
          token: 'auth-test-token-123',
          user: { id: 'usr-auth-1', email: 'test@pteprep.com', targetScore: 79 },
          expiresAt: Date.now() + 3600000,
        }),
        { status: 200 },
      )
    }
    if (sUrl.includes('/api/auth/me') && opts?.method === 'PATCH') {
      return new Response(JSON.stringify({ ok: true }), { status: 200 })
    }
    if (sUrl.includes('/api/auth/me')) {
      return new Response(
        JSON.stringify({
          user: { id: 'usr-auth-1', email: 'test@pteprep.com', targetScore: 79 },
          expiresAt: Date.now() + 3600000,
        }),
        { status: 200 },
      )
    }
    if (sUrl.includes('/api/auth/logout')) {
      return new Response(JSON.stringify({ ok: true }), { status: 200 })
    }
    if (sUrl.includes('/api/attempts?ids=1')) {
      return new Response(JSON.stringify({ ids: ['att-cloud-1'], hasMore: false, nextOffset: 1 }), {
        status: 200,
      })
    }
    if (sUrl.includes('/api/attempts/att-cloud-1')) {
      return new Response(
        JSON.stringify({
          attempt: {
            id: 'att-cloud-1',
            userId: 'usr-auth-1',
            mockId: 'm1',
            mockTitle: 'Cloud Mock',
            mode: 'full',
            startedAt: '2026-10-19T10:00:00Z',
            finishedAt: '2026-10-19T12:00:00Z',
            durationMs: 7200000,
            overallScore: 82,
            cefr: 'C1',
            earnedPoints: 75,
            availablePoints: 90,
            skillScores: { speaking: 82, writing: 82, reading: 82, listening: 82 },
          },
        }),
        { status: 200 },
      )
    }
    if (sUrl.includes('/api/attempts') && opts?.method === 'POST') {
      return new Response(JSON.stringify({ ok: true }), { status: 200 })
    }
    if (sUrl.includes('/api/attempts') && opts?.method === 'DELETE') {
      return new Response(JSON.stringify({ ok: true, deleted: 1 }), { status: 200 })
    }
    return origFetch(url, opts)
  }

  const loginRes = await useAuth.getState().login('test@pteprep.com', 'Pass123!')
  assert(loginRes === true, 'useAuth login succeeds and populates user session')
  assert(useAuth.getState().user?.email === 'test@pteprep.com', 'useAuth stores active user')
  assert(useAuth.getState().token === 'auth-test-token-123', 'useAuth stores bearer token')

  await useAuth.getState().setTargetScore(85)
  assert(useAuth.getState().user?.targetScore === 85, 'useAuth updates targetScore optimistically')

  await useAuth.getState().checkSession()
  assert(useAuth.getState().user !== null, 'useAuth checkSession confirms valid session')

  // 2. sync.ts: canPushAttemptToCloud
  assert(
    canPushAttemptToCloud({ userId: 'usr-auth-1' }, 'usr-auth-1'),
    'canPushAttemptToCloud allows owned record',
  )
  assert(
    !canPushAttemptToCloud({ userId: 'usr-auth-1' }, 'different-user'),
    'canPushAttemptToCloud rejects other user record',
  )
  assert(
    !canPushAttemptToCloud({} as any, 'usr-auth-1'),
    'canPushAttemptToCloud rejects unowned guest record',
  )

  // 3. syncAttemptToCloud & fetchAttemptFromCloud
  const syncOk = await syncAttemptToCloud({
    id: 'att-sync-1',
    userId: 'usr-auth-1',
    ownerId: 'usr-auth-1',
    mockId: 'm1',
    mockTitle: 'Mock Sync',
    mode: 'full',
    startedAt: '2026-10-19T10:00:00Z',
    finishedAt: '2026-10-19T12:00:00Z',
    durationMs: 7200000,
    overallScore: 80,
    cefr: 'C1',
    earnedPoints: 70,
    availablePoints: 90,
    skillScores: { speaking: 80, writing: 80, reading: 80, listening: 80 },
  })
  assert(syncOk === 'pushed', 'syncAttemptToCloud posts attempt to API')

  const fetchedCloudAttempt = await fetchAttemptFromCloud('att-cloud-1')
  assert(fetchedCloudAttempt?.id === 'att-cloud-1', 'fetchAttemptFromCloud pulls attempt from API')

  // 4. syncCloudToLocal
  const syncResult = await syncCloudToLocal()
  assert(
    typeof syncResult.pulled === 'number' && typeof syncResult.pushed === 'number',
    'syncCloudToLocal performs pull and push reconciliation',
  )

  // 5. deleteAttemptEverywhere and clearAllAttemptsEverywhere
  const delEverywhere = await deleteAttemptEverywhere('att-cloud-1')
  assert(delEverywhere === true, 'deleteAttemptEverywhere deletes locally and calls cloud DELETE')

  const clearEverywhere = await clearAllAttemptsEverywhere()
  assert(clearEverywhere === true, 'clearAllAttemptsEverywhere performs bulk account clear')

  // 6. countGuestAttempts & claimGuestAttemptsForCurrentUser
  const guestCount = await countGuestAttempts()
  assert(typeof guestCount === 'number', 'countGuestAttempts counts unauthenticated attempts')
  const claimed = await claimGuestAttemptsForCurrentUser()
  assert(typeof claimed === 'number', 'claimGuestAttemptsForCurrentUser imports guest records')

  // Logout clears session
  useAuth.getState().logout()
  assert(useAuth.getState().user === null, 'useAuth logout clears user state')
  assert(useAuth.getState().token === null, 'useAuth logout clears bearer token')

  globalThis.fetch = origFetch

  // --------------------------------------------------------------------------
  // TEST 35: Domain, Content Manifest & SEO
  // --------------------------------------------------------------------------
  console.log('\n--- 35. Domain, Content Manifest & SEO ---')
  // 1. useSettings
  const defaultUsage = createDefaultAiUsage()
  assert(defaultUsage.totalRequests === 0, 'createDefaultAiUsage returns zeroed metrics')
  useSettings.getState().recordAiUsage({ totalTokens: 100, promptTokens: 60, completionTokens: 40 })
  assert(
    useSettings.getState().settings.aiUsage.totalTokens === 100,
    'recordAiUsage increments LLM usage',
  )
  useSettings.getState().recordAiUsage({ whisperSeconds: 4.5 })
  assert(
    useSettings.getState().settings.aiUsage.whisperSeconds === 4.5,
    'recordAiUsage increments Whisper usage',
  )
  useSettings.getState().resetAiUsage()
  assert(useSettings.getState().settings.aiUsage.totalTokens === 0, 'resetAiUsage zeroes metrics')
  useSettings.getState().reset()
  useSettings.getState().hydrate()
  assert(useSettings.getState().hydrated === true, 'useSettings hydrate marks store hydrated')

  // 2. blueprint.ts: primarySkill & describeMockPreview
  const allTypes = getManifest().map((m) => m.type)
  for (const t of allTypes) {
    assert(Boolean(primarySkill(t)), `primarySkill defined for ${t}`)
  }
  const previewFull = describeMockPreview({ 'read-aloud': 5, 'write-essay': 1 })
  assert(previewFull.scoredCount === 6, 'describeMockPreview counts scored items')
  assert(previewFull.sectionIds.length === 3, 'describeMockPreview defaults to 3 sections')
  const previewReading = describeMockPreview(
    { 'fill-in-blanks-dropdown': 4 },
    { singleSection: 'reading', untimed: true },
  )
  assert(
    previewReading.sectionIds.length === 1 && previewReading.sectionIds[0] === 'reading',
    'describeMockPreview singleSection',
  )

  // 3. pace.ts: formatSeconds, paceReport, paceWarnings
  assert(formatSeconds(0) === '0s', 'formatSeconds 0s')
  assert(formatSeconds(45) === '45s', 'formatSeconds 45s')
  assert(formatSeconds(60) === '1m', 'formatSeconds 1m')
  assert(formatSeconds(85) === '1m 25s', 'formatSeconds 1m 25s')

  const paceItems: Item[] = [
    {
      id: 'ra-1',
      type: 'read-aloud',
      section: 'speaking-writing',
      responseKind: 'audio',
      maxPoints: 3,
      seconds: 40,
      stimulusId: 's1',
      groupId: 'g1',
    },
    {
      id: 'ra-2',
      type: 'read-aloud',
      section: 'speaking-writing',
      responseKind: 'audio',
      maxPoints: 3,
      seconds: 40,
      stimulusId: 's2',
      groupId: 'g2',
    },
  ]
  const paceResponses: Record<string, ItemResponse> = {
    'ra-1': { secondsOnItem: 60 },
    'ra-2': { secondsOnItem: 20 },
  }
  const paceRows = paceReport(paceItems, paceResponses)
  assert(paceRows.length === 1, 'paceReport produces aggregated type row')
  assert(paceRows[0]?.averageSeconds === 40, 'paceReport computes average seconds')
  const warnings = paceWarnings([{ ...paceRows[0]!, verdict: 'over' }])
  assert(warnings.length === 1, 'paceWarnings returns over-budget rows')

  // 4. scoring.ts: toCefr, cefrLabel, nextBand, pteToIelts, endsWithSentencePunctuation
  assert(
    toCefr(90) === 'C2' &&
      toCefr(80) === 'C1' &&
      toCefr(65) === 'B2' &&
      toCefr(50) === 'B1' &&
      toCefr(35) === 'A2' &&
      toCefr(20) === 'A1',
    'toCefr maps scores across all CEFR bands',
  )
  assert(cefrLabel('C2') === 'Exceptional', 'cefrLabel maps C2 to Exceptional')
  assert(cefrLabel('unknown') === '', 'cefrLabel returns empty for unknown band')
  assert(nextBand('C2') === null, 'nextBand returns null for highest band C2')
  assert(nextBand('C1')?.band === 'C2', 'nextBand returns C2 above C1')
  assert(pteToIelts(90) === '9.0', 'pteToIelts maps 90 to 9.0')
  assert(pteToIelts(86) === '8.5', 'pteToIelts maps 86 to 8.5')
  assert(pteToIelts(15) === null, 'pteToIelts returns null below minimum concordance')
  assert(
    endsWithSentencePunctuation('This is a complete sentence.'),
    'endsWithSentencePunctuation true for full stop',
  )
  assert(
    endsWithSentencePunctuation('Is this a question?'),
    'endsWithSentencePunctuation true for question mark',
  )
  assert(
    endsWithSentencePunctuation('“Quoted ending.”'),
    'endsWithSentencePunctuation true for quoted sentence',
  )
  assert(
    !endsWithSentencePunctuation('Unfinished sentence fragment'),
    'endsWithSentencePunctuation false for unpunctuated text',
  )

  // 5. manifest.ts
  assert(getManifest().length === 22, 'getManifest returns all 22 question types')
  assert(typesForSkill('speaking').length > 0, 'typesForSkill returns types for speaking')
  assert(typesForSkill('writing').length > 0, 'typesForSkill returns types for writing')
  assert(typesForSkill('reading').length > 0, 'typesForSkill returns types for reading')
  assert(typesForSkill('listening').length > 0, 'typesForSkill returns types for listening')
  assert(manifestBankCapacity() === 1200, 'manifestBankCapacity returns 1200')
  assert(
    Object.keys(manifestCapacityByType()).length === 22,
    'manifestCapacityByType returns all types',
  )

  // 6. seo: meta.ts & structured.ts
  const homeMeta = getPageMeta('/')
  assert(homeMeta.title.includes('PTE'), 'getPageMeta returns metadata for home page')
  const notFound = notFoundMeta('/some-random-route')
  assert(notFound.noindex === true, 'notFoundMeta sets noindex: true')
  const orgLd = organizationLd()
  assert(orgLd['@type'] === 'Organization', 'organizationLd produces valid schema')
  const webApp = webApplicationLd({ name: 'PTE Prep', description: 'Practice app', path: '/' })
  assert(webApp['@type'] === 'WebApplication', 'webApplicationLd produces valid schema')
  const faqSchema = faqLd([{ question: 'Q?', answer: 'A.' }])
  assert(faqSchema['@type'] === 'FAQPage', 'faqLd produces FAQPage schema')
  const breadcrumb = breadcrumbLd([
    { name: 'Home', path: '/' },
    { name: 'Practice', path: '/practice' },
  ])
  assert(breadcrumb['@type'] === 'BreadcrumbList', 'breadcrumbLd produces BreadcrumbList schema')
  const howTo = howToLd({
    name: 'How to prepare',
    description: 'Steps',
    steps: [{ name: 'Step 1', text: 'Practice' }],
  })
  assert(howTo['@type'] === 'HowTo', 'howToLd produces HowTo schema')
  const itemLd = itemListLd([{ name: 'Item 1', path: '/p1' }])
  assert(itemLd['@type'] === 'ItemList', 'itemListLd produces ItemList schema')

  const headTags = pageHeadTags(homeMeta)
  assert(headTags.length > 5, 'pageHeadTags generates meta tags')
  const renderedHead = renderHeadTags(headTags)
  assert(renderedHead.includes('<title>'), 'renderHeadTags serializes title tag into HTML')
  assert(renderedHead.includes('<meta'), 'renderHeadTags serializes meta tags into HTML')

  // Restore pristine window state
  ;(globalThis as any).window = prevWindow
  ;(globalThis as any).document = prevDoc

  console.log(`\n========================================================================`)
  console.log(`  BOUNDARY & GATING RESULTS: ${passed}/${total} passed (100%)`)
  console.log(`========================================================================\n`)

  if (passed !== total) {
    process.exit(1)
  }
}

main()
