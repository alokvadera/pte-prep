// Smoke test for the test engine: builds mocks, checks blueprint coverage, and
// exercises every scoring path. Run with: npx tsx scripts/smoke.ts
import { buildDrillMock, buildFullMock, buildSectionMock } from '../src/domain/assemble'
import { ALL_QUESTION_TYPES, MOCK_BLUEPRINT, NEGATIVE_MARKING_TYPES, QUESTION_META } from '../src/domain/blueprint'
import { buildReport, formBand, rawToPteScale, scoreItem, toCefr } from '../src/domain/scoring'
import { BANK, bankCapacity, capacityByType } from '../src/content/bank'
import { formatSeconds, paceReport, paceWarnings } from '../src/domain/pace'
import { keyTermCoverage } from '../src/lib/text'
import type { Item, ItemResponse, QuestionType } from '../src/domain/types'

const CONSTRUCTED_TYPES = [
  'write-essay', 'summarize-written-text', 'summarize-spoken-text', 'answer-short-question', 'read-aloud',
  'repeat-sentence', 'describe-image', 'retell-lecture', 'summarize-group-discussion', 'respond-to-situation',
]
const isConstructed = (t: string) => CONSTRUCTED_TYPES.includes(t)

const MIC = { durationMs: 8000, wordsPerMinute: 150, speechRatio: 0.82, pauseCount: 1, meanPitchHz: 175, energyVariance: 0.55, reliable: true }

let failures = 0
function check(label: string, condition: boolean, detail = ''): void {
  if (condition) {
    console.log(`  ok   ${label}`)
  } else {
    failures += 1
    console.log(`  FAIL ${label}${detail ? ` — ${detail}` : ''}`)
  }
}

console.log('\n== Content bank ==')
const capacity = capacityByType()
console.log(`  ${bankCapacity()} items available across ${ALL_QUESTION_TYPES.length} types`)
for (const type of ALL_QUESTION_TYPES) {
  const n = capacity[type] ?? 0
  if (n <= 0) console.log(`  !! ${type} has no items in the bank`)
}
check('every type has at least one item', ALL_QUESTION_TYPES.every((t) => (capacity[t] ?? 0) > 0))
check('repeat-sentence pool is large enough for a full mock', (capacity['repeat-sentence'] ?? 0) >= MOCK_BLUEPRINT['repeat-sentence'], String(capacity['repeat-sentence']))
check('read-aloud pool is large enough', (capacity['read-aloud'] ?? 0) >= MOCK_BLUEPRINT['read-aloud'], String(capacity['read-aloud']))

console.log('\n== Full mock assembly ==')
const mock = buildFullMock(12345)
const allItems = mock.sections.flatMap((s) => s.itemIds).map((id) => mock.items[id]!).filter(Boolean)
const scored = allItems.filter((i) => i.maxPoints > 0)
console.log(`  ${allItems.length} items (${scored.length} scored), ${mock.totalPoints} points, ${Math.round(mock.totalSeconds / 60)} min`)

check('all three sections present', mock.sections.length === 3)
check('every scored item has an answer key', scored.every((i) => mock.answers[i.id]))
check('every item references a real group', allItems.every((i) => mock.sections.some((s) => s.groups.some((g) => g.id === i.groupId))))
check('section order matches the real test', mock.sections.map((s) => s.id).join(',') === 'speaking-writing,reading,listening')
check('warm-up is present and un-scored', allItems.some((i) => i.warmup && i.maxPoints === 0))

const typeCounts: Record<string, number> = {}
for (const i of scored) typeCounts[i.type] = (typeCounts[i.type] ?? 0) + 1
const missing = ALL_QUESTION_TYPES.filter((t) => !typeCounts[t])
check('all 22 types appear in a full mock', missing.length === 0, missing.join(', '))

console.log('\n  type coverage:')
for (const t of ALL_QUESTION_TYPES) {
  console.log(`    ${(QUESTION_META[t]?.label ?? t).padEnd(42)} ${String(typeCounts[t] ?? 0).padStart(3)}`)
}

console.log('\n== Drill integrity ==')
// A single-skill drill used to build all three sections and then filter groups by
// their nominal type. Because one reading group holds the table and both multiple
// choice items together, a drill focused on either multiple choice type produced
// a test with no questions at all, and one focused on Reading or Listening left
// an empty first section that the runner rendered as a blank screen.
{
  const drillTypes = [
    'read-aloud', 'describe-image', 'summarize-written-text', 'write-essay',
    'fill-in-blanks-dropdown', 'fill-in-blanks-table',
    'multiple-choice-single', 'multiple-choice-multiple', 'reorder-paragraphs',
    'select-missing-word', 'fill-in-blanks-listening', 'summarize-spoken-text',
  ] as const
  const emptySections: string[] = []
  const noItems: string[] = []
  for (const t of drillTypes) {
    const d = buildDrillMock(20240917, [t])
    if (d.sections.some((sec) => sec.itemIds.length === 0)) emptySections.push(t)
    if (d.sections.flatMap((sec) => sec.itemIds).length === 0) noItems.push(t)
  }
  check('every drill type produces questions', noItems.length === 0, `empty: ${noItems.join(', ')}`)
  check('no drill section is left empty', emptySections.length === 0, `empty: ${emptySections.join(', ')}`)
}

console.log('\n== Stimulus integrity ==')
// A dropdown group is the exception: its own gapped text is the passage, so
  // attaching the intact paragraphs would print every answer beside its blank.
  // Everything else in reading needs the passage on screen.
  check(
    'reading groups carry a passage unless they are reorder or dropdown items',
    mock.sections
      .filter((s) => s.id === 'reading')
      .every((s) =>
        s.groups.every(
          (g) =>
            g.type === 'reorder-paragraphs' ||
            g.type === 'fill-in-blanks-dropdown' ||
            g.stimulus.passageParagraphs?.length,
        ),
      ),
  )
  check(
    'dropdown groups never expose the intact passage',
    mock.sections
      .filter((s) => s.id === 'reading')
      .flatMap((s) => s.groups)
      .filter((g) => g.type === 'fill-in-blanks-dropdown')
      .every((g) => !g.stimulus.passageParagraphs?.length),
  )
check('a passage group holds more than one item', mock.sections.find((s) => s.id === 'reading')!.groups.some((g) => g.itemIds.length > 1))
check('reading item count is at least 20', scored.filter((i) => i.section === 'reading').length >= 20, String(scored.filter((i) => i.section === 'reading').length))
check('dropdown items have a word bank at least as large as the blanks', scored.filter((i) => i.type === 'fill-in-blanks-dropdown').every((i) => (i.options?.length ?? 0) >= (i.targetText?.split(/______/).length ?? 0) - 1))
check('dropdown banks contain every correct answer', scored.filter((i) => i.type === 'fill-in-blanks-dropdown').every((i) => {
  const answers = (mock.answers[i.id]?.blanks ?? []).map((a) => a[0] ?? '')
  return answers.length === (i.targetText?.split(/______/).length ?? 0) - 1 && answers.every((a) => (i.options ?? []).includes(a))
}))
check('table blanks line up with answer count', scored.filter((i) => i.type === 'fill-in-blanks-table').every((i) => i.table?.blankCells.length === (mock.answers[i.id]?.blanks?.length ?? 0)))
check('reorder key matches the blocks', scored.filter((i) => i.type === 'reorder-paragraphs').every((i) => {
  const key = mock.answers[i.id]?.order ?? []
  const ids = (i.blocks ?? []).map((b) => b.id)
  return key.length === ids.length && key.every((k) => ids.includes(k))
}))
check('multi-choice keys point at real options', scored.filter((i) => i.responseKind === 'multi-choice').every((i) => (mock.answers[i.id]?.correctChoices ?? []).every((c) => (i.options ?? []).includes(c))))
check('single-choice keys point at real options', scored.filter((i) => i.responseKind === 'choice').every((i) => (i.options ?? []).includes(mock.answers[i.id]?.correctChoice ?? '\u0000')))
check('select-missing-word has exactly one ___ token', scored.filter((i) => i.type === 'select-missing-word').every((i) => (i.tokens ?? []).filter((t) => t === '___').length === 1))
check('highlight-incorrect targets exactly two tokens', scored.filter((i) => i.type === 'highlight-incorrect-words').every((i) => (mock.answers[i.id]?.correctHighlighted?.length ?? 0) === 2 && (mock.answers[i.id]?.correctHighlighted ?? []).every((n) => n < (i.tokens?.length ?? 0))))
check('every audio-backed item resolves to a script', scored.filter((i) => i.stimulusId).every((i) => BANK.lectures.concat(BANK.conversations, BANK.groupDiscussions).some((a) => a.id === i.stimulusId) || i.stimulusId?.startsWith('asq-aud')))
check('every describe-image item resolves to a chart', scored.filter((i) => i.type === 'describe-image').every((i) => Boolean(i.chartId)))
check('describer targets have reference answers', scored.filter((i) => i.responseKind === 'audio').every((i) => Boolean(mock.answers[i.id]?.reference)))
check('writing items have key terms', scored.filter((i) => i.responseKind === 'text' && i.type !== 'write-from-dictation').every((i) => (mock.answers[i.id]?.keyTerms?.length ?? 0) > 0))

console.log('\n== Determinism ==')
const a = buildFullMock(999).sections.flatMap((s) => s.itemIds)
const b = buildFullMock(999).sections.flatMap((s) => s.itemIds)
const c = buildFullMock(1000).sections.flatMap((s) => s.itemIds)
check('same seed produces the same test', a.join('|') === b.join('|'))
check('different seeds produce different tests', a.join('|') !== c.join('|'))

console.log('\n== Section and drill mocks ==')
for (const section of ['speaking-writing', 'reading', 'listening'] as const) {
  const m = buildSectionMock(42, section, MOCK_BLUEPRINT)
  const n = m.sections[0]?.itemIds.length ?? 0
  check(`${section} section mock builds (${n} items)`, n > 0)
}
const drill = buildDrillMock(7, ['reorder-paragraphs', 'write-from-dictation'], 2)
check('drill mock only contains the requested types', drill.sections.flatMap((s) => s.itemIds).every((id) => drill.items[id] && ['reorder-paragraphs', 'write-from-dictation'].includes(drill.items[id]!.type)))
check('drill mock excludes the unscored warm-up', drill.sections.flatMap((s) => s.itemIds).every((id) => id !== 'respond-to-situation:intro'))

console.log('\n== Scoring: objective items ==')
const byType = (t: string) => scored.find((i) => i.type === t)!
function key(itemId: string) { return mock.answers[itemId]! }

const mcq = byType('multiple-choice-single')
check('correct single choice scores 1', scoreItem(mcq, key(mcq.id), { choice: key(mcq.id).correctChoice }).ratio === 1)
check('wrong single choice scores 0', scoreItem(mcq, key(mcq.id), { choice: 'definitely not the answer' }).ratio === 0)
check('blank single choice scores 0', scoreItem(mcq, key(mcq.id), {}).ratio === 0)

const rop = byType('reorder-paragraphs')
check('correct order scores 1', scoreItem(rop, key(rop.id), { order: key(rop.id).order }).ratio === 1)
check('reversed order is partial at best', scoreItem(rop, key(rop.id), { order: [...(key(rop.id).order ?? [])].reverse() }).ratio < 1)
check('wrong order scores 0', scoreItem(rop, key(rop.id), { order: ['x', 'y', 'z', 'w', 'v'] }).ratio === 0)

const fibd = byType('fill-in-blanks-dropdown')
const fibdAll = (key(fibd.id).blanks ?? []).map((a) => a[0]!)
const fibdHalf = fibdAll.map((v, i) => (i % 2 === 0 ? v : 'wrong'))
const fibdExpected = fibdAll.filter((_, i) => i % 2 === 0).length / fibdAll.length
check('all dropdown blanks correct = 1', scoreItem(fibd, key(fibd.id), { blanks: fibdAll }).ratio === 1)
check('partial dropdown blanks score proportionally', Math.abs(scoreItem(fibd, key(fibd.id), { blanks: fibdHalf }).ratio - fibdExpected) < 0.01, `expected ${fibdExpected}`)
check('a single wrong blank costs exactly 1/n', Math.abs(scoreItem(fibd, key(fibd.id), { blanks: fibdAll.map((v, i) => (i === 0 ? 'nope' : v)) }).ratio - (1 - 1 / fibdAll.length)) < 0.01)

const wfd = byType('write-from-dictation')
const wfdText = key(wfd.id).reference ?? ''
check('exact dictation scores high', scoreItem(wfd, key(wfd.id), { text: wfdText }).ratio > 0.7, String(scoreItem(wfd, key(wfd.id), { text: wfdText }).ratio))
check('garbage dictation scores low', scoreItem(wfd, key(wfd.id), { text: 'the cat sat' }).ratio < 0.4)

console.log('\n== Scoring: constructed items ==')
const rs = byType('repeat-sentence')
const rsText = key(rs.id).reference ?? ''
const rsWords = rsText.split(/\s+/).length
check('a perfect typed repeat scores well but not perfectly', scoreItem(rs, key(rs.id), { transcript: rsText }).ratio > 0.6, String(scoreItem(rs, key(rs.id), { transcript: rsText }).ratio))
check('a perfect repeat with a recording scores higher', scoreItem(rs, key(rs.id), { transcript: rsText, audio: MIC }).ratio > scoreItem(rs, key(rs.id), { transcript: rsText }).ratio)
check('half-correct repeat is partial', (() => { const half = rsText.split(/\s+/).slice(0, Math.ceil(rsWords / 2)).join(' '); const r = scoreItem(rs, key(rs.id), { transcript: half }).ratio; return r > 0.1 && r < 0.95 })())
check('empty answer scores 0', scoreItem(rs, key(rs.id), {}).ratio === 0)
check('a recording with no words still scores zero, because Content gates the item', scoreItem(rs, key(rs.id), { audio: MIC }).ratio === 0)

const essay = byType('write-essay')
// Compose a realistic four-paragraph answer around the prompt's own key terms,
// so the content component is exercised the way a real response would exercise it.
const essayKeyTerms = key(essay.id).keyTerms ?? []
const goodEssay = [
  `The question set out in the prompt is worth taking seriously, because it concerns ${essayKeyTerms[0] ?? 'the subject'} and the decisions that follow from ${essayKeyTerms[1] ?? 'it'}. I agree with the position taken in the stimulus, and the reasons are largely practical.`,
  `First, the underlying ${essayKeyTerms[2] ?? 'evidence'} is strong. The passage describes a mechanism rather than asserting a correlation, which means the argument survives the obvious objection that the two things merely occur together. Second, the scale of ${essayKeyTerms[3] ?? 'the effect'} is large enough that small improvements matter in aggregate. Third, ${essayKeyTerms[4] ?? 'the alternative'} is more expensive than it first appears, once ${essayKeyTerms[5] ?? 'the costs'} are counted properly.`,
  `However, the stimulus is careful not to claim that one measure is sufficient. It acknowledges that ${essayKeyTerms[6] ?? 'the approach'} depends on local ${essayKeyTerms[7] ?? 'conditions'}, and that transferring a solution without adapting it can make matters worse. This qualification is important, because it means the correct ${essayKeyTerms[0] ?? 'answer'} is conditional rather than universal.`,
  `In conclusion, the passage is persuasive precisely because it treats the issue as one of ${essayKeyTerms[4] ?? 'policy'} and ${essayKeyTerms[7] ?? 'risk'} rather than of invention. A decision maker who accounted for ${essayKeyTerms[5] ?? 'these factors'} would therefore reach a better outcome than one who waited for a new technology, and would be able to revise the decision later if the ${essayKeyTerms[3] ?? 'evidence'} changed.`,
].join('\n\n')
const badEssay = 'heat heat heat city'
check('the test essay is a realistic length', goodEssay.split(/\s+/).length >= 200, String(goodEssay.split(/\s+/).length))
check('a well-structured essay scores well', scoreItem(essay, key(essay.id), { text: goodEssay }).ratio > 0.6, String(scoreItem(essay, key(essay.id), { text: goodEssay }).ratio))
check('an unstructured wall of text scores below a structured essay', scoreItem(essay, key(essay.id), { text: goodEssay.replace(/\n\n/g, ' ') }).ratio < scoreItem(essay, key(essay.id), { text: goodEssay }).ratio)
check('a three-word essay scores near zero', scoreItem(essay, key(essay.id), { text: badEssay }).ratio < 0.3, String(scoreItem(essay, key(essay.id), { text: badEssay }).ratio))
check('an empty essay scores 0', scoreItem(essay, key(essay.id), { text: '' }).ratio === 0)
const copied = (key(essay.id).reference ?? '') + ' ' + (key(essay.id).reference ?? '')
check('a heavily copied essay is penalised below a written one', scoreItem(essay, key(essay.id), { text: copied }).ratio < scoreItem(essay, key(essay.id), { text: goodEssay }).ratio)

const asq = byType('answer-short-question')
const asqAnswer = key(asq.id).blanks?.[0]?.[0] ?? ''
check('exact short answer scores 1', scoreItem(asq, key(asq.id), { text: asqAnswer }).ratio === 1)
check('case-insensitive short answer scores 1', scoreItem(asq, key(asq.id), { text: asqAnswer.toUpperCase() }).ratio === 1)
check('wrong short answer scores 0', scoreItem(asq, key(asq.id), { text: 'something else entirely' }).ratio === 0)
check('empty short answer scores 0', scoreItem(asq, key(asq.id), {}).ratio === 0)

console.log('\n== Pearson rule conformance ==')
// Each of these encodes a rule quoted from the 2026 Score Guide. They are the
// regression net for the four mistakes this project originally made.
{
  // Re-order Paragraphs: 1 point per correctly ordered adjacent pair, max N-1.
  const key4 = ['a', 'b', 'c', 'd']
  const item4 = { ...rop, id: 'rop-test', maxPoints: 3 }
  const key4k = { order: key4 }
  check('ROP: a perfect order earns every adjacent pair', scoreItem(item4, key4k, { order: key4 }).ratio === 1)
  check('ROP: one broken link costs exactly one point', Math.abs(scoreItem(item4, key4k, { order: ['a', 'b', 'd', 'c'] }).ratio - 1 / 3) < 0.001, String(scoreItem(item4, key4k, { order: ['a', 'b', 'd', 'c'] }).ratio))
  check('ROP: a chain of three correct boxes earns two points', Math.abs(scoreItem(item4, key4k, { order: ['d', 'a', 'b', 'c'] }).ratio - 2 / 3) < 0.001)
  check('ROP: no correct adjacency scores zero', scoreItem(item4, key4k, { order: ['c', 'a', 'd', 'b'] }).ratio === 0)
  check('ROP: the maximum is N-1, not 1', item4.maxPoints === 3)

  // Only three of 22 types carry negative marking, at -1 each.
  check('exactly three types use negative marking', NEGATIVE_MARKING_TYPES.length === 3, NEGATIVE_MARKING_TYPES.join(', '))
  const mcqM = byType('multiple-choice-multiple')
  const correct2 = key(mcqM.id).correctChoices ?? []
  check('MCQ-M: both correct answers score full marks', scoreItem(mcqM, key(mcqM.id), { choices: correct2 }).ratio === 1)
  check(
    'MCQ-M: one wrong selection cancels one correct (1 - 1 = 0)',
    scoreItem(mcqM, key(mcqM.id), { choices: [...correct2.slice(0, 1), 'definitely not an option'] }).ratio === 0,
  )
  const hiwItem = byType('highlight-incorrect-words')
  const correctIdx = key(hiwItem.id).correctHighlighted ?? []
  check('HIW: both correct highlights score full marks', scoreItem(hiwItem, key(hiwItem.id), { highlighted: correctIdx }).ratio === 1)
  // The item maximum is the number of correct words, so 2 correct - 1 wrong
  // = 1 of 2, and more wrong than correct floors at zero.
  const extraIdx = (hiwItem.tokens ?? []).findIndex((_, i) => !correctIdx.includes(i))
  check(
    'HIW: one extra highlight costs a full point',
    Math.abs(scoreItem(hiwItem, key(hiwItem.id), { highlighted: [...correctIdx, extraIdx] }).ratio - 0.5) < 0.001,
    String(scoreItem(hiwItem, key(hiwItem.id), { highlighted: [...correctIdx, extraIdx] }).ratio),
  )
  check(
    'HIW: more wrong highlights than correct floors at zero',
    scoreItem(hiwItem, key(hiwItem.id), { highlighted: [0, 1, 2] }).ratio === 0,
  )

  // Content 0 gates the whole item, however fluent the delivery.
  const rtl = byType('retell-lecture')
  check(
    'a fluent answer with no content scores zero, because Content gates the item',
    scoreItem(rtl, key(rtl.id), { transcript: 'so anyway it was basically that in the end you know', audio: MIC }).ratio === 0,
  )

  // Form bands are type-specific and hard-edged.
  check('essay: 250 words scores Form 2', formBand('write-essay', 'word '.repeat(250)).score === 1)
  check('essay: 174 words scores Form 1', formBand('write-essay', 'word '.repeat(174)).score === 0.5)
  check('essay: 100 words scores Form 0 and gates the item', formBand('write-essay', 'word '.repeat(100)).score === 0)
  check('essay: 400 words scores Form 0', formBand('write-essay', 'word '.repeat(400)).score === 0)
  check('SST: 60 words scores Form 2', formBand('summarize-spoken-text', 'word '.repeat(60)).score === 1)
  check('SST: 30 words scores Form 0', formBand('summarize-spoken-text', 'word '.repeat(30)).score === 0)
  check('SWT: one complete sentence scores Form 1', formBand('summarize-written-text', 'This is one complete sentence.').score === 1)
  check('SWT: two sentences score Form 0', formBand('summarize-written-text', 'One sentence. And another.').score === 0)
  check('SWT: no final punctuation scores Form 0', formBand('summarize-written-text', 'This is one complete sentence').score === 0)

  // Integrated items feed two skills each.
  const integrated = ALL_QUESTION_TYPES.filter((t) => QUESTION_META[t].skills.length > 1)
  check('eight types are integrated and score two skills', integrated.length === 8, `${integrated.length}: ${integrated.join(', ')}`)
  for (const t of ['repeat-sentence', 'retell-lecture', 'summarize-group-discussion'] as const) {
    check(`${t} scores Listening and Speaking`, QUESTION_META[t].skills.join('+') === 'listening+speaking', QUESTION_META[t].skills.join('+'))
  }
  for (const t of ['summarize-written-text', 'summarize-spoken-text', 'write-from-dictation'] as const) {
    const expected = t === 'summarize-written-text' ? 'reading+writing' : 'listening+writing'
    check(`${t} scores ${expected}`, QUESTION_META[t].skills.join('+') === expected, QUESTION_META[t].skills.join('+'))
  }
  check('Write from Dictation scores Listening and Writing', QUESTION_META['write-from-dictation'].skills.join('+') === 'listening+writing')
  check('Read Aloud scores Speaking only in the current format', QUESTION_META['read-aloud'].skills.join('+') === 'speaking')
  check('Answer Short Question scores Listening only', QUESTION_META['answer-short-question'].skills.join('+') === 'listening')

  // Every item's skill list must come from the blueprint, never be hand-written.
  check(
    'every assembled item matches the blueprint skill routing',
    scored.every((i) => i.skills.join('+') === QUESTION_META[i.type].skills.join('+')),
  )

  // The model's own reference answer must clear the Content gate, or a
  // candidate who reproduces it verbatim would score nothing.
  check(
    'every model answer covers its own key terms',
    scored
      .filter((i) => QUESTION_META[i.type].scoring === 'trait-composite' && (key(i.id).keyTerms ?? []).length > 0)
      .every((i) => {
        const ref = key(i.id).reference ?? ''
        return keyTermCoverage(ref, key(i.id).keyTerms ?? []) > 0.9
      }),
  )
}

console.log('\n== Scale conversion ==')
check('0% = 10', rawToPteScale(0) === 10)
check('100% = 90', rawToPteScale(1) === 90)
check('50% is around 52', Math.abs(rawToPteScale(0.5) - 52) < 2, String(rawToPteScale(0.5)))
check('85% maps into the high 70s', rawToPteScale(0.85) > 74 && rawToPteScale(0.85) < 82, String(rawToPteScale(0.85)))
check('70% maps into the mid 60s', rawToPteScale(0.7) > 60 && rawToPteScale(0.7) < 70, String(rawToPteScale(0.7)))
check('scale is monotonic', [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1].every((v, i, arr) => i === 0 || rawToPteScale(v) > rawToPteScale(arr[i - 1]!)))
check('all values land on a 0.5 increment', [0, 0.13, 0.37, 0.62, 0.88, 1].every((v) => Math.abs(rawToPteScale(v) * 2 - Math.round(rawToPteScale(v) * 2)) < 1e-9))
// Official bands from the Institution Score Guide (July 2025).
// 85-90 C2, 76-84 C1, 59-75 B2, 43-58 B1, 30-42 A2, 10-29 A1.
check('CEFR band boundaries are the official ones', toCefr(90) === 'C2' && toCefr(85) === 'C2' && toCefr(84) === 'C1' && toCefr(76) === 'C1' && toCefr(75) === 'B2' && toCefr(59) === 'B2' && toCefr(58) === 'B1' && toCefr(43) === 'B1' && toCefr(42) === 'A2' && toCefr(30) === 'A2' && toCefr(29) === 'A1', `${[90,85,84,76,75,59,58,43,42,30,29].map((v) => `${v}=${toCefr(v)}`).join(' ')}`)

console.log('\n== Full report ==')
const responses: Record<string, ItemResponse> = {}

/** A plausible, well-structured essay built from the item's own key terms. */
function essayFor(terms: string[]): string {
  const t = (i: number) => terms[i] ?? 'the question'
  return [
    `The position set out in the prompt deserves support, because ${t(0)} and ${t(1)} are closely connected and are usually treated separately when they should not be.`,
    `There are three reasons this is convincing. First, ${t(2)} provides a clear mechanism rather than a correlation, so the argument does not depend on the two merely occurring together. Second, ${t(3)} is large enough that the aggregate effect matters even where no individual case is dramatic. Third, ${t(4)} costs more than it first appears once ${t(5)} are counted properly.`,
    `However, the stimulus is careful not to overstate the case. It notes that ${t(6)} depends on local ${t(7)}, which means the conclusion is conditional rather than universal. This qualification is important, because transferring a solution without adapting it can make matters worse.`,
    `In conclusion, the passage is persuasive because it reframes the issue as one of ${t(4)} and ${t(7)} rather than invention. A decision maker who accounted for ${t(5)} would therefore reach a better outcome than one waiting for a new technology, and could revise later if ${t(3)} changed.`,
  ].join('\n\n')
}

/** A single sentence, because Summarize Written Text scores Form 0 otherwise. */
function swtFor(terms: string[]): string {
  const list = terms.slice(0, 4).join(', ')
  return `The passage explains that ${list}, which means ${terms[0] ?? 'the effect'} ultimately depends on ${terms[terms.length - 1] ?? 'local conditions'}.`
}

for (const item of scored) {
  const k = key(item.id)
  const mode = QUESTION_META[item.type].scoring
  const terms = k.keyTerms ?? []

  switch (mode) {
    case 'binary':
      responses[item.id] =
        item.type === 'answer-short-question'
          ? { text: k.blanks?.[0]?.[0] ?? '' }
          : { choice: k.correctChoice ?? null }
      break
    case 'per-blank':
      responses[item.id] = { blanks: (k.blanks ?? []).map((a) => a[0] ?? '') }
      break
    case 'per-word':
      responses[item.id] = { text: k.reference ?? '' }
      break
    case 'per-adjacent-pair':
      responses[item.id] = { order: k.order ?? [] }
      break
    case 'per-unit-negated':
      responses[item.id] =
        item.type === 'highlight-incorrect-words'
          ? { highlighted: k.correctHighlighted ?? [] }
          : { choices: k.correctChoices ?? [] }
      break
    case 'trait-composite':
      if (item.type === 'write-essay') responses[item.id] = { text: essayFor(terms) }
      else if (item.type === 'summarize-written-text') responses[item.id] = { text: swtFor(terms) }
      else if (item.type === 'summarize-spoken-text') {
        // The reference is already written inside the 50–70 word Form band.
        responses[item.id] = { text: k.reference ?? '' }
      } else if (item.type === 'answer-short-question') responses[item.id] = { text: k.blanks?.[0]?.[0] ?? '' }
      else responses[item.id] = { transcript: k.reference ?? '', text: k.reference ?? '' }
      break
  }
}

const metaById = Object.fromEntries(scored.map((i) => [i.id, { skills: i.skills, type: i.type, label: i.type }]))
const perfect = buildReport(scored, mock.answers, responses, metaById)
console.log(`  perfect typed run → overall ${perfect.overall}, CEFR ${perfect.cefr}, ${perfect.earnedPoints}/${perfect.availablePoints} points`)
check('a perfect typed run, with no microphone, lands in the B2 range', perfect.overall >= 68, String(perfect.overall))
check('a perfect typed run reaches B2 or above', ['B2', 'C1', 'C2'].includes(perfect.cefr), perfect.cefr)
check('60-120 score tracks the 10-90 score', perfect.overall60 === perfect.overall + 50)
check('all four skills are reported', Object.keys(perfect.skills).length === 4, Object.keys(perfect.skills).join(','))
const objectiveKinds = new Set(['choice', 'multi-choice', 'blanks', 'order', 'highlight'])
const objectiveDetails = perfect.details.filter((d) => objectiveKinds.has(scored.find((i) => i.id === d.itemId)!.responseKind))
console.log(`  ${objectiveDetails.length} objective items scored exactly`)
check('every objective item scores exactly full marks in a perfect run', objectiveDetails.every((d) => d.ratio === 1), objectiveDetails.filter((d) => d.ratio !== 1).map((d) => d.label).join(', '))
check('a dictation answer of the exact sentence scores 85% or better', perfect.details.filter((d) => d.type === 'write-from-dictation').every((d) => d.ratio >= 0.85), String(Math.min(...perfect.details.filter((d) => d.type === 'write-from-dictation').map((d) => d.ratio))))

// With a recording and a transcript, constructed items should reach near full marks.
const micReport = buildReport(
  scored,
  mock.answers,
  Object.fromEntries(
    scored.map((item) => {
      const base = responses[item.id]
      if (!base || item.responseKind !== 'audio' || item.type === 'answer-short-question') return [item.id, base]
      return [item.id, { ...base, audio: { durationMs: 8000, wordsPerMinute: 150, speechRatio: 0.82, pauseCount: 1, meanPitchHz: 175, energyVariance: 0.55, reliable: true } }]
    }),
  ),
  metaById,
)
console.log(`  same run with microphone → overall ${micReport.overall}, CEFR ${micReport.cefr}`)
check('a recording raises the score above the typed-only run', micReport.overall > perfect.overall, `${micReport.overall} vs ${perfect.overall}`)
if (process.env.DEBUG_ZERO) for (const d of micReport.details) if (CONSTRUCTED_TYPES.includes(d.type) && d.ratio <= 0.6) console.log('   ZERO:', d.type, d.ratio, JSON.stringify(d.notes.slice(0,2)))
check('constructed items with a recording score above 60%', micReport.details.filter((d) => isConstructed(d.type)).every((d) => d.ratio > 0.6), String(Math.min(...micReport.details.filter((d) => isConstructed(d.type)).map((d) => d.ratio))))

const empty = buildReport(scored, mock.answers, {}, metaById)
check('an empty run scores 10', empty.overall === 10, String(empty.overall))
check('an empty run has no details', empty.details.length === scored.length)

const halfResponses: Record<string, ItemResponse> = { ...responses }
for (const id of Object.keys(halfResponses).slice(0, Math.floor(scored.length / 2))) delete halfResponses[id]
const half = buildReport(scored, mock.answers, halfResponses, metaById)
check('a half run lands in the middle of the scale', half.overall > 30 && half.overall < 65, String(half.overall))
check('breakdown covers every type in the report', Object.keys(perfect.breakdown).length === Object.keys(typeCounts).length, `${Object.keys(perfect.breakdown).length} vs ${Object.keys(typeCounts).length}`)
check('breakdown totals match the available points', Math.abs(Object.values(perfect.breakdown).reduce((a, r) => a + r.maxPoints, 0) - perfect.availablePoints) < 0.01)


// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
console.log('\n== Pace analysis ==')
{
  const item = (id: string, type: QuestionType, seconds: number): Item =>
    ({ id, type, section: 'speaking-writing', responseKind: 'choice', prompt: '', options: [], maxPoints: 1, seconds } as unknown as Item)
  const resp = (id: string, secondsOnItem: number): ItemResponse =>
    ({ id, flagged: false, secondsOnItem } as unknown as ItemResponse)

  const items = [
    item('i1', 'read-aloud', 40),
    item('i2', 'read-aloud', 40),
    item('i3', 'repeat-sentence', 20),
    item('i4', 'summarize-written-text', 600),
  ]
  const responses = {
    i1: resp('i1', 44),
    i2: resp('i2', 36),
    i3: resp('i3', 4),
    i4: resp('i4', 840),
  }

  const rows = paceReport(items, responses)
  check('reports one row per timed type answered', rows.length === 3, `${rows.length} rows`)
  check('averages the time actually spent', (rows.find((r) => r.type === 'read-aloud')?.averageSeconds ?? 0) === 40, String(rows.find((r) => r.type === 'read-aloud')?.averageSeconds))
  check('flags a type that overran its budget', rows.some((r) => r.type === 'summarize-written-text' && r.verdict === 'over'), rows.map((r) => `${r.short}:${r.ratio}`).join(' '))
  check('marks a type finished very fast as under, not steady', rows.some((r) => r.type === 'repeat-sentence' && r.verdict === 'under'))
  check('sorts the worst overrun first', rows[0]?.ratio >= rows[rows.length - 1]!.ratio, rows.map((r) => r.ratio).join('>'))

  check('excludes types with no real-test budget', !rows.some((r) => r.budgetSeconds === 0))
  check('ignores an item that was never engaged with', paceReport(items, { i1: resp('i1', 40) }).find((r) => r.type === 'read-aloud')?.items === 1)
  check('returns nothing without timing data', paceReport(items, {}).length === 0)
  check('surfaces the worst offenders first', paceWarnings(rows, 1)[0]?.type === 'summarize-written-text', paceWarnings(rows, 1)[0]?.short)

  check('formats short durations', formatSeconds(40) === '40s', formatSeconds(40))
  check('formats whole minutes', formatSeconds(120) === '2m', formatSeconds(120))
  check('formats mixed durations', formatSeconds(140) === '2m 20s', formatSeconds(140))
}

process.exit(failures === 0 ? 0 : 1)
