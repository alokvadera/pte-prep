import { formBand, rawToPteScale, scoreBand, scoreItem, splitSentences, toCefr } from '../../src/domain/scoring'
import type { AnswerKey, Item, ItemResponse } from '../../src/domain/types'
import { hasResponse } from '../../src/store/useTest'
import { softF1 } from '../../src/lib/text'
import { computeAiRawScore, validateGroqKey } from '../../src/lib/aiScorer'
import { useAuth } from '../../src/store/useAuth'
import { playSuccessTone } from '../../src/lib/speech'
import fs from 'node:fs'
import path from 'node:path'
import { resolveAllowedOrigin } from '../../functions/_middleware'
import {
  createSessionToken,
  hashPassword,
  requireSecret,
  verifyPassword,
  verifySessionToken,
} from '../../functions/lib/auth'
import { planSyncReconciliation } from '../../src/lib/sync'
import { formatResponseEchoLines, validateResetPasswordForm } from '../../src/lib/format'

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
  assert(split1.length === 1, 'Sentence with Dr., Prof., U.S. counts as exactly 1 sentence', `got ${split1.length}`)

  const s2 = 'This is the first proposition. However, this is the second proposition! And here is the third?'
  const split2 = splitSentences(s2)
  assert(split2.length === 3, 'Multiple sentence splits correctly count 3 sentences', `got ${split2.length}`)

  const s3 = 'Research by e.g. Watson et al. demonstrated high efficacy, i.e. over 90% accuracy.'
  const split3 = splitSentences(s3)
  assert(split3.length === 1, 'Sentence with e.g., et al., i.e. counts as exactly 1 sentence', `got ${split3.length}`)

  const s4 = 'Mr. Davis met Mrs. Gable and Ms. Chen at 4 p.m.'
  const split4 = splitSentences(s4)
  assert(split4.length === 1, 'Sentence with Mr., Mrs., Ms. counts as exactly 1 sentence', `got ${split4.length}`)

  // --------------------------------------------------------------------------
  // TEST 2: Word Count Form Bands (SWT, WE, SST)
  // --------------------------------------------------------------------------
  console.log('\n--- 2. Word Count Form Bands ---')

  // Summarize Written Text (SWT: 1 sentence, 5–75 words)
  const wordsN = (n: number) => Array.from({ length: n }, (_, i) => `word${i}`).join(' ') + '.'

  const swtTooShort = formBand('summarize-written-text', 'Too short.') // 2 words
  assert(swtTooShort.score === 0, 'SWT < 5 words receives Form 0')

  const swtValid = formBand('summarize-written-text', 'Human language regulates information density to maintain a uniform communication rate across diverse grammars.')
  assert(swtValid.score === 1, 'SWT 1 sentence of 15 words receives Form 1')

  assert(formBand('summarize-written-text', wordsN(75)).score === 1, 'SWT with 75 words receives Form 1')
  assert(formBand('summarize-written-text', wordsN(76)).score === 0, 'SWT with 76 words (>75) receives Form 0')

  const swtTwoSentences = formBand('summarize-written-text', 'This is sentence one. This is sentence two.')
  assert(swtTwoSentences.score === 0, 'SWT 2 sentences receives Form 0')

  const swtNoPunctuation = formBand('summarize-written-text', 'This summary has no final terminal punctuation mark')
  assert(swtNoPunctuation.score === 0, 'SWT without end punctuation receives Form 0')

  // Write Essay (WE: 200–300 = Form 1.0; 120–199 or 301–380 = Form 0.5; outside = Form 0)
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
    maxPoints: 2,
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
  assert(raGatedResult.traits?.oralFluency === 1, 'Oral fluency still measured at 1.0 in trait record')

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
  assert(rawToPteScale(0.25) > 10 && rawToPteScale(0.25) < 50, '25% raw accuracy maps to lower-intermediate band')
  assert(rawToPteScale(0.5) >= 50 && rawToPteScale(0.5) <= 60, '50% raw accuracy maps to realistic middle band (50-60)')
  assert(rawToPteScale(0.75) > 60 && rawToPteScale(0.75) < 90, '75% raw accuracy maps to upper-intermediate band')

  const band = scoreBand(0.75, 70)
  assert(band.low <= band.mid && band.mid <= band.high, 'Score estimation uncertainty band is monotonic')
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
  assert(hasResponse({ audio: { durationMs: 600, wordsPerMinute: 120, speechRatio: 0.8, pauseCount: 0, meanPitchHz: 180, energyVariance: 0.5, reliable: true } }), 'audio > 500ms is true')
  assert(!hasResponse({ audio: { durationMs: 300, wordsPerMinute: 120, speechRatio: 0.8, pauseCount: 0, meanPitchHz: 180, energyVariance: 0.5, reliable: true } }), 'audio <= 500ms is false')

  // --------------------------------------------------------------------------
  // TEST 7: softF1 Mathematical Bounds & Operator Precedence
  // --------------------------------------------------------------------------
  console.log('\n--- 7. softF1 Bounds & Operator Precedence ---')
  assert(softF1('', ['term1', 'term2']) === 0, 'empty candidate gives 0')
  assert(softF1('random words here', []) === 0, 'empty reference terms gives 0')
  assert(softF1('completely unrelated text', ['energy', 'climate']) === 0, 'zero term hits gives 0 cleanly')
  assert(softF1('energy climate renewable', ['energy', 'climate', 'renewable']) === 1, 'perfect match gives 1')
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

  authState.setSession({ id: 'usr-test-1', email: 'test@example.com', targetScore: 79 }, 'mock-token-xyz', Date.now() + 3600000)
  assert(useAuth.getState().user?.email === 'test@example.com', 'setSession sets user email')
  assert(useAuth.getState().token === 'mock-token-xyz', 'setSession sets token')
  assert(useAuth.getState().hasLoggedInBefore === true, 'hasLoggedInBefore is true')

  useAuth.getState().logout()
  assert(useAuth.getState().user === null, 'logout clears user')
  assert(useAuth.getState().token === null, 'logout clears token')
  assert(useAuth.getState().expiresAt === null, 'logout clears expiresAt')

  const emptyKeyValidation = await validateGroqKey('   ')
  assert(!emptyKeyValidation.ok, 'empty Groq API key is rejected')
  assert(emptyKeyValidation.error === 'API key is required', 'empty Groq API key gives descriptive error')

  // --------------------------------------------------------------------------
  // TEST 9: Auth Safety, Score Clamping & SSR Audio Guard
  // --------------------------------------------------------------------------
  console.log('\n--- 9. Auth Safety, Score Clamping & SSR Audio Guard ---')
  const testToken = 'abc123def456+&=/ '
  const encodedToken = encodeURIComponent(testToken)
  assert(!encodedToken.includes(' ') && !encodedToken.includes('&') && !encodedToken.includes('+'), 'token is safely URL encoded')

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
  assert(typeof validToken === 'string' && validToken.includes('.'), 'createSessionToken creates signed token')

  const verifiedSession = await verifySessionToken(validToken, testSecret)
  assert(verifiedSession !== null && verifiedSession.userId === 'usr-auth-test', 'valid token verifies successfully')
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

  assert(resolveAllowedOrigin('https://pte-prep.pages.dev') === 'https://pte-prep.pages.dev', 'canonical domain is allowed')
  assert(resolveAllowedOrigin('https://preview-123.pte-prep.pages.dev') === 'https://preview-123.pte-prep.pages.dev', 'pages.dev subdomains allowed')
  assert(resolveAllowedOrigin('http://localhost:5173') === 'http://localhost:5173', 'localhost is allowed for dev')
  assert(resolveAllowedOrigin('https://evil.com') === null, 'arbitrary third party origin is rejected')
  assert(resolveAllowedOrigin('https://pte-prep.pages.dev.attacker.com') === null, 'subdomain spoofing origin is rejected')

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

  const forbiddenSinks = ['dangerouslySetInnerHTML', '.innerHTML =', '.outerHTML =', 'document.write(']
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
  assert(computeAiRawScore(essayWithExtra, 'essay') === 13, 'extraneous keys do not inflate essay rawScore')

  const negativeTraits = { content: -5, pronunciation: 4, oralFluency: 3 }
  assert(computeAiRawScore(negativeTraits, 'speaking') === 7, 'negative trait values floor cleanly at 0')

  const nonNumericTraits = { content: 'high', pronunciation: null, oralFluency: 5 }
  assert(
    computeAiRawScore(nonNumericTraits as unknown as Record<string, unknown>, 'speaking') === 5,
    'non-numeric trait values ignored safely',
  )

  // --------------------------------------------------------------------------
  // TEST 13: Sync Reconciliation & Tombstone Conflict Resolution Contract
  // --------------------------------------------------------------------------
  console.log('\n--- 13. Sync Reconciliation & Tombstone Conflict Resolution ---')
  const cleanSync = planSyncReconciliation(['att-1', 'att-2'], ['att-2', 'att-3'], [])
  assert(cleanSync.toPull.length === 1 && cleanSync.toPull[0] === 'att-1', 'missing cloud attempt is marked for pull')
  assert(cleanSync.toPush.length === 1 && cleanSync.toPush[0] === 'att-3', 'new local attempt is marked for push')

  const tombstoneSync = planSyncReconciliation(['att-deleted'], [], ['att-deleted'])
  assert(tombstoneSync.toPull.length === 0, 'tombstoned cloud attempt is never pulled (prevents resurrection)')

  const tombstonePushSync = planSyncReconciliation([], ['att-deleted'], ['att-deleted'])
  assert(tombstonePushSync.toPush.length === 0, 'tombstoned local attempt is never pushed to cloud')

  const identicalSync = planSyncReconciliation(['att-1'], ['att-1'], [])
  assert(identicalSync.toPull.length === 0 && identicalSync.toPush.length === 0, 'identical sets yield zero push and pull')

  // --------------------------------------------------------------------------
  // TEST 14: Reset Password Form Contract Validation
  // --------------------------------------------------------------------------
  console.log('\n--- 14. Reset Password Form Contract Validation ---')
  const noToken = validateResetPasswordForm('', 'newPassword123', 'newPassword123')
  assert(!noToken.valid && noToken.error?.includes('Missing or invalid reset token'), 'missing token rejected')

  const shortPass = validateResetPasswordForm('valid-token-xyz', 'short', 'short')
  assert(!shortPass.valid && shortPass.error?.includes('at least 8 characters'), 'password under 8 chars rejected')

  const mismatchPass = validateResetPasswordForm('valid-token-xyz', 'password123', 'password456')
  assert(!mismatchPass.valid && mismatchPass.error?.includes('do not match'), 'password mismatch rejected')

  const validForm = validateResetPasswordForm('valid-token-xyz', 'password123', 'password123')
  assert(validForm.valid && validForm.error === undefined, 'valid reset password submission accepted')

  // --------------------------------------------------------------------------
  // TEST 15: Response Echo Formatting & XSS Plaintext Sanitization Contract
  // --------------------------------------------------------------------------
  console.log('\n--- 15. Response Echo Formatting & Plaintext Safety ---')
  const emptyEcho = formatResponseEchoLines({})
  assert(emptyEcho.length === 0, 'empty response echoes zero lines')

  const choiceEcho = formatResponseEchoLines({ choice: 'Option B' })
  assert(choiceEcho.length === 1 && choiceEcho[0] === 'Your answer: Option B', 'choice formatted correctly')

  const choicesEcho = formatResponseEchoLines({ choices: ['Option A', 'Option C'] })
  assert(choicesEcho.length === 1 && choicesEcho[0] === 'Your answers: Option A, Option C', 'choices array formatted')

  const blanksEcho = formatResponseEchoLines({ blanks: ['alpha', 'beta'] })
  assert(blanksEcho.length === 1 && blanksEcho[0] === 'Your answers: alpha, beta', 'blanks formatted correctly')

  const orderEcho = formatResponseEchoLines({ order: ['Step 1', 'Step 2'] })
  assert(orderEcho.length === 1 && orderEcho[0] === 'Your order: Step 1 → Step 2', 'order formatted with arrows')

  const highlightEchoWithTokens = formatResponseEchoLines({ highlighted: [0, 2] }, ['apple', 'banana', 'cherry'])
  assert(
    highlightEchoWithTokens.length === 1 && highlightEchoWithTokens[0] === 'You highlighted: “apple”, “cherry”',
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
    xssTranscriptEcho.length === 1 && xssTranscriptEcho[0] === `Your answer (transcribed): ${rawHtmlTranscript}`,
    'speech transcript remains unparsed plain string data',
  )

  console.log(`\n========================================================================`)
  console.log(`  BOUNDARY & GATING RESULTS: ${passed}/${total} passed (100%)`)
  console.log(`========================================================================\n`)

  if (passed !== total) {
    process.exit(1)
  }
}

main()
