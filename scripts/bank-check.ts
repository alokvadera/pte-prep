import { PASSAGES } from '../src/content/passages'
import { CHARTS } from '../src/content/charts'
import { AUDIO_INDEX, capacityByType } from '../src/content/bank'
import { GROUP_DISCUSSION_ITEMS, RETELL_ITEMS, SPOKEN_SUMMARY_ITEMS } from '../src/content/audio'
import {
  DICTATION,
  HIGHLIGHT_INCORRECT,
  HIGHLIGHT_SUMMARY,
  LISTENING_MCQ_MULTI,
  LISTENING_MCQ_SINGLE,
  LISTENING_FIB,
  MISSING_WORD,
  SITUATIONS,
} from '../src/content/listening'

/**
 * Structural validation of the content bank.
 *
 * Every item in the bank is assembled at runtime by the test engine, which means
 * a malformed item — a dropdown whose answers are not in its word bank, a table
 * with three blanks and two answers — does not fail the build. It fails silently
 * the first time a candidate draws that item, in production, on a scored mock.
 *
 * These are invariants the *shape* of the data must satisfy. Content quality is
 * a human judgement; these are the things a machine can prove.
 */

let failures = 0
let checks = 0

const check = (label: string, ok: boolean, detail = '') => {
  checks++
  if (ok) return
  failures++
  console.log(`  FAIL ${label}${detail ? ` — ${detail}` : ''}`)
}

console.log('\n== Content bank structure ==\n')

// --- Passages --------------------------------------------------------------
const passageIds = new Set<string>()

for (const p of PASSAGES) {
  const at = `passage ${p.id}`
  check(`${at}: id is unique`, !passageIds.has(p.id))
  passageIds.add(p.id)

  check(`${at}: has at least four paragraphs`, p.paragraphs.length >= 4, `${p.paragraphs.length}`)
  check(`${at}: has key terms`, p.keyTerms.length >= 4)
  check(`${at}: has a Read Aloud extract`, p.readAloud.trim().length > 0)
  // The extract may be trimmed, so match on substance rather than prefix.
  check(
    `${at}: Read Aloud comes from the passage`,
    PASSAGES.find((x) => x.id === p.id)!.paragraphs.some((para) => para.includes(p.readAloud.slice(0, 60))),
  )
  check(
    `${at}: has at least four Repeat Sentences`,
    p.repeatSentences.length >= 4,
    `${p.repeatSentences.length}`,
  )
  for (const s of p.repeatSentences) {
    const words = s.split(/\s+/).length
    check(`${at}: Repeat Sentence is 10 to 20 words`, words >= 10 && words <= 20, `${words} words`)
  }

  // Summarize Written Text: exactly one sentence, as the real instruction demands.
  const swtWords = p.swt.summary.split(/\s+/).length
  check(`${at}: SWT reference is one sentence of at most 60 words`, swtWords <= 60, `${swtWords} words`)
  check(`${at}: SWT reference has key terms`, p.swt.keyTerms.length >= 4)
  check(`${at}: SWT excerpt is non-empty`, p.swt.excerpt.length >= 1)

  // Fill in the Blanks (Dropdown): blanks, answers and bank must agree.
  const blanks = (p.dropdown.text.match(/______/g) ?? []).length
  check(`${at}: dropdown blanks match answers`, blanks === p.dropdown.answers.length, `${blanks} vs ${p.dropdown.answers.length}`)
  check(`${at}: dropdown has more options than blanks`, p.dropdown.bank.length > blanks, `${p.dropdown.bank.length} options`)
  for (const a of p.dropdown.answers) {
    check(`${at}: dropdown answer "${a}" is in the bank`, p.dropdown.bank.includes(a))
  }
  check(`${at}: dropdown answers are distinct`, new Set(p.dropdown.answers).size === p.dropdown.answers.length)

  // Fill in the Blanks (Table): a real grid with the right number of gaps.
  const tableBlanks = p.tableFib.rows.flat().filter((c) => c === null).length
  check(`${at}: table blanks match answers`, tableBlanks === p.tableFib.answers.length, `${tableBlanks} vs ${p.tableFib.answers.length}`)
  check(
    `${at}: every table row matches the header width`,
    p.tableFib.rows.every((r) => r.length === p.tableFib.headers.length),
  )
  check(`${at}: table has at least three columns`, p.tableFib.headers.length >= 3)
  check(`${at}: table has context text`, p.tableFib.context.length >= 1)

  // Multiple choice.
  check(`${at}: single-answer MCQ has four options`, p.mcqSingle.options.length === 4, `${p.mcqSingle.options.length}`)
  check(`${at}: single-answer MCQ has one answer`, p.mcqSingle.correct.length === 1)
  check(
    `${at}: single-answer MCQ answer is an option`,
    p.mcqSingle.options.includes(p.mcqSingle.correct[0]!),
  )
  check(`${at}: single-answer MCQ options are distinct`, new Set(p.mcqSingle.options).size === 4)

  check(`${at}: multiple-answer MCQ has five options`, p.mcqMultiple.options.length === 5, `${p.mcqMultiple.options.length}`)
  check(`${at}: multiple-answer MCQ has two answers`, p.mcqMultiple.correct.length === 2, `${p.mcqMultiple.correct.length}`)
  for (const c of p.mcqMultiple.correct) {
    check(`${at}: multiple-answer MCQ answer "${c.slice(0, 24)}" is an option`, p.mcqMultiple.options.includes(c))
  }
  check(`${at}: multiple-answer MCQ answers are distinct`, new Set(p.mcqMultiple.correct).size === 2)

  // Answer Short Question.
  check(`${at}: has at least three Answer Short Questions`, p.asq.length >= 3, `${p.asq.length}`)
  const asqIds = new Set<string>()
  for (const a of p.asq) {
    check(`${at}: ASQ ${a.id} id is unique`, !asqIds.has(a.id))
    asqIds.add(a.id)
    // The format uses three. Accepting "at least three" let nine items ship with
    // four, so a candidate met a different shape from one ASQ to the next.
    check(`${at}: ASQ ${a.id} has exactly three options`, a.options.length === 3, `${a.options.length}`)
    check(`${at}: ASQ ${a.id} answer is an option`, a.options.includes(a.correct))
    check(
      `${at}: ASQ ${a.id} question is short enough to answer at a glance`,
      a.question.split(/\s+/).length <= 16,
      `${a.question.split(/\s+/).length} words`,
    )
  }
}

// --- Charts ----------------------------------------------------------------
const chartIds = new Set<string>()
for (const c of CHARTS) {
  check(`chart ${c.id}: id is unique`, !chartIds.has(c.id))
  chartIds.add(c.id)
  check(`chart ${c.id}: has a title`, c.title.trim().length > 0)
  check(`chart ${c.id}: has a caption`, c.caption.trim().length > 0)
  check(`chart ${c.id}: has a prompt`, c.prompt.trim().length > 0)
  check(`chart ${c.id}: has key terms`, c.keyTerms.length >= 3, `${c.keyTerms.length}`)
  check(`chart ${c.id}: prompt sets a word range`, /\d+\s*(to|and)\s*\d+|\d+/.test(c.prompt))
}

// --- Derived items ---------------------------------------------------------
// Every listening item points at an audio script by id. A dangling reference
// does not throw: the assembler reads `AUDIO_INDEX.get(...)` and carries on with
// an undefined script, so the candidate would simply get an item with no audio.
// That is exactly the kind of failure that ships without anyone noticing.
{
  const linked: Array<{ label: string; audioId: string }> = [
    ...GROUP_DISCUSSION_ITEMS.map((i) => ({ label: `group discussion item ${i.id}`, audioId: i.audioId })),
    ...SPOKEN_SUMMARY_ITEMS.map((i) => ({ label: `spoken summary item ${i.id}`, audioId: i.audioId })),
    ...RETELL_ITEMS.map((i) => ({ label: `re-tell item ${i.id}`, audioId: i.audioId })),
  ]
  for (const item of linked) {
    check(`${item.label}: audio script "${item.audioId}" exists`, AUDIO_INDEX.has(item.audioId))
  }

  // Conversely, a script with no derived item is not an error — it is still
  // valid material for Repeat Sentence and ASQ — but it is worth seeing.
  const used = new Set(linked.map((i) => i.audioId))
  const orphans = [...AUDIO_INDEX.keys()].filter((id) => !used.has(id))
  console.log(`  ${linked.length} listening items resolve to audio; ${orphans.length} scripts serve only derived pools`)

  for (const item of GROUP_DISCUSSION_ITEMS) {
    check(`group discussion item ${item.id}: has a reference answer`, item.reference.trim().length > 0)
    check(`group discussion item ${item.id}: has key terms`, item.keyTerms.length >= 4, `${item.keyTerms.length}`)
  }
  for (const item of SPOKEN_SUMMARY_ITEMS) {
    check(`spoken summary item ${item.id}: has a reference answer`, item.reference.trim().length > 0)
    check(`spoken summary item ${item.id}: has key terms`, item.keyTerms.length >= 4, `${item.keyTerms.length}`)
  }
}

// --- Key term fairness ------------------------------------------------------
// Partial credit on a constructed response is awarded against these terms, so a
// candidate must be able to hit them by writing about the material they were
// actually shown. A term that appears in neither the model answer nor the
// stimulus is a term nobody could reasonably have used.
{
  const norm = (v: string) => v.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ')
  const has = (hay: string, term: string) => {
    const t = norm(term)
    if (!t) return true
    return t.includes(' ') ? hay.includes(t) : hay.split(' ').includes(t)
  }

  // What the candidate actually receives. For listening items that is the audio
  // script they hear, not the model answer, so a term the speaker says out loud
  // is reachable even when the reference happens to phrase it differently.
  const scriptText = (id: string) =>
    (AUDIO_INDEX.get(id)?.turns ?? []).map((t) => t.text).join(' ')

  const cited: Array<{ label: string; reference: string; stimulus: string; terms: string[] }> = [
    ...SPOKEN_SUMMARY_ITEMS.map((i) => ({ label: `spoken summary ${i.id}`, reference: i.reference, stimulus: scriptText(i.audioId), terms: i.keyTerms })),
    ...GROUP_DISCUSSION_ITEMS.map((i) => ({ label: `group discussion ${i.id}`, reference: i.reference, stimulus: scriptText(i.audioId), terms: i.keyTerms })),
    ...RETELL_ITEMS.map((i) => ({ label: `re-tell ${i.id}`, reference: i.reference, stimulus: scriptText(i.audioId), terms: i.keyTerms })),
    // A situation is read, not heard, so its own text is the stimulus.
    ...SITUATIONS.map((i) => ({ label: `situation ${i.id}`, reference: i.reference, stimulus: `${i.situation} ${i.prompt}`, terms: i.keyTerms })),
    // A written summary is scored against a model sentence, but the candidate
    // only sees the excerpt, so a term in either place counts.
    ...PASSAGES.map((p) => ({
      label: `written summary ${p.swt.id}`,
      reference: p.swt.summary,
      stimulus: p.swt.excerpt.join(' '),
      terms: p.swt.keyTerms,
    })),
  ]

  for (const c of cited) {
    const ref = norm(c.reference)
    const stim = norm(c.stimulus)
    const unreachable = c.terms.filter((t) => !has(ref, t) && !has(stim, t))
    check(
      `${c.label}: every key term is reachable from the material shown`,
      unreachable.length === 0,
      unreachable.join(', '),
    )
  }
}

// --- Distractor grounding (advisory) ---------------------------------------
// A strong summary or multiple choice distractor is built from what the
// recording says, altered in one specific way, so it has to be rejected by
// listening rather than by noticing it was invented. This measures how much of
// each distractor's vocabulary actually appears in the audio.
//
// It is reported and never fails. The measure is approximate: short words carry
// no signal, and a distractor may legitimately name something the speaker
// mentions only in passing. Treat the count as a prompt to look, not a verdict.
{
  const norm = (v: string) => v.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ')
  const scriptText = (id: string) =>
    norm((AUDIO_INDEX.get(id)?.turns ?? []).map((t) => t.text).join(' '))

  let weak = 0
  let total = 0
  const examine = (label: string, opts: string[], correct: string[], audioId: string) => {
    const sc = scriptText(audioId)
    for (const o of opts.filter((x) => !correct.includes(x))) {
      const content = norm(o).split(' ').filter((w) => w.length > 3)
      if (content.length < 3) continue
      total++
      if (content.filter((w) => sc.includes(w)).length / content.length < 0.25) weak++
    }
  }
  for (const q of LISTENING_MCQ_SINGLE) examine(q.id, q.options, q.correct, q.audioId)
  for (const q of LISTENING_MCQ_MULTI) examine(q.id, q.options, q.correct, q.audioId)
  for (const h of HIGHLIGHT_SUMMARY) examine(h.id, h.options, [h.options[h.correct]!], h.audioId)
  if (weak > 0) {
    console.log(
      `\n  note: ${weak}/${total} listening distractors share little vocabulary with their recording` +
        ' — worth reviewing, not necessarily wrong',
    )
  }
}

// --- Item writing quality ---------------------------------------------------
// These are the flaws that make a question solvable without reading it. None of
// them throw in the type system and none show up in a build, so they are
// asserted here.
//
// The longest-answer test is deliberately aggregate. A single item whose answer
// happens to be the longest is unremarkable, and a tie carries no information at
// all; what matters is whether the rate across a collection is far above the one
// in four that chance predicts. A per-item rule would force authorship to be
// contrived rather than merely unbiased.
{
  for (const p of PASSAGES) {
    const uniq = new Set(p.dropdown.bank)
    check(
      `passage ${p.id}: dropdown bank has no duplicate words`,
      uniq.size === p.dropdown.bank.length,
      `${p.dropdown.bank.length - uniq.size} duplicate(s): ${p.dropdown.bank.filter((w, i) => p.dropdown.bank.indexOf(w) !== i).join(', ')}`,
    )
    check(
      `passage ${p.id}: dropdown bank is over-supplied`,
      p.dropdown.bank.length >= p.dropdown.answers.length + 2,
      `${p.dropdown.bank.length} options for ${p.dropdown.answers.length} blanks`,
    )
    check(`passage ${p.id}: MCQ options are distinct`, new Set(p.mcqSingle.options).size === p.mcqSingle.options.length)
  }

  // A strict win of three words or more is what makes length informative.
  const lengthTells = (opts: string[], correct: string[]): boolean => {
    const lens = opts.map((o) => o.split(/\s+/).length)
    const cut = Math.max(...lens)
    const top = correct.map((c) => opts.indexOf(c)).map((i) => lens[i]!)
    return top.every((n) => n === cut) && cut - Math.min(...lens.filter((_, i) => !top.includes(i))) >= 3
  }

  const singleReads = PASSAGES.filter((p) =>
    lengthTells(p.mcqSingle.options, p.mcqSingle.correct),
  ).length
  check(
    'reading MCQ single: the answer is not reliably the longest option',
    singleReads <= Math.ceil(PASSAGES.length * 0.4),
    `${singleReads}/${PASSAGES.length} items leak length, chance is ${Math.ceil(PASSAGES.length / 4)}`,
  )

  const multiReads = PASSAGES.filter((p) =>
    lengthTells(p.mcqMultiple.options, p.mcqMultiple.correct),
  ).length
  check(
    'reading MCQ multiple: the answer is not reliably the longest option',
    multiReads <= Math.ceil(PASSAGES.length * 0.4),
    `${multiReads}/${PASSAGES.length} items leak length`,
  )


  for (const [label, items] of [
    ['listening MCQ single', LISTENING_MCQ_SINGLE],
    ['listening MCQ multiple', LISTENING_MCQ_MULTI],
  ] as const) {
    const leaked = items.filter((q) => lengthTells(q.options, q.correct)).length
    check(
      `${label}: the answer is not reliably the longest option`,
      leaked <= Math.ceil(items.length * 0.4),
      `${leaked}/${items.length} items leak length`,
    )
  }

  const summaryLeaked = HIGHLIGHT_SUMMARY.filter((h) =>
    lengthTells(h.options, [h.options[h.correct]!]),
  ).length
  check(
    'highlight summary: the answer is not reliably the longest option',
    summaryLeaked <= Math.ceil(HIGHLIGHT_SUMMARY.length * 0.4),
    `${summaryLeaked}/${HIGHLIGHT_SUMMARY.length} items leak length`,
  )

  // A wide spread is the underlying tell even when it does not favour the answer.
  const spreads = HIGHLIGHT_SUMMARY.map((h) => {
    const lens = h.options.map((o) => o.split(/\s+/).length)
    return Math.max(...lens) - Math.min(...lens)
  })
  const wide = spreads.filter((x) => x > 6).length
  check(
    'highlight summary: option lengths are within a few words of each other',
    wide <= Math.ceil(HIGHLIGHT_SUMMARY.length * 0.25),
    `${wide}/${HIGHLIGHT_SUMMARY.length} items vary by more than six words: ${spreads.join(', ')}`,
  )
}

// --- Passage length ---------------------------------------------------------
// A real PTE Academic reading passage runs 200 to 300 words. Ours run 365 to
// 543, which is a genuine authenticity gap: candidates read roughly half as much
// again per reading item than they would in the exam, and the section timer is
// modelling a heavier load than the real one.
//
// It is reported rather than failed. Shortening the passages is not a mechanical
// edit here, because the reading multiple choice questions refer to paragraphs by
// position ("according to the fourth paragraph"), so trimming would silently
// invalidate answers that are currently supported. That trade is worse than the
// deviation, so the band below only catches runaway growth and the gap against
// the real range is printed on every run.
{
  const REAL_MIN = 200
  const REAL_MAX = 320
  const overReal: string[] = []
  for (const p of PASSAGES) {
    const words = p.paragraphs.join(' ').split(/\s+/).length
    check(`passage ${p.id}: length is within the runaway ceiling`, words >= REAL_MIN && words <= 600, `${words} words`)
    if (words > REAL_MAX) overReal.push(`${p.id} ${words}w`)
  }
  if (overReal.length > 0) {
    console.log(
      `\n  note: ${overReal.length}/${PASSAGES.length} passages exceed the real ${REAL_MIN}-${REAL_MAX} word range` +
        ` (${overReal.join(', ')})`,
    )
  }
}

// --- Listening item geometry -----------------------------------------------
// These collections are addressed by index: a dictation points at a turn, a
// missing word at a word inside a turn, a fill-in-the-blanks at a transcript
// position. Every one of those is a silent failure if the index drifts, because
// the item still assembles and still looks plausible. Each is checked against
// the script it claims to come from.
{
  const turnsOf = (id: string) => AUDIO_INDEX.get(id)?.turns

  for (const d of DICTATION) {
    const turns = turnsOf(d.audioId)
    check(`dictation ${d.id}: script exists`, !!turns)
    if (!turns) continue
    check(`dictation ${d.id}: turn ${d.turnIndex} is in range`, d.turnIndex < turns.length, `${d.turnIndex}/${turns.length}`)
    // A dictation item stores one sentence from inside the turn, so the text must
    // be found verbatim in the turn the item points at. Pointing at the wrong turn
    // is the failure this catches: the audio plays one passage while the key
    // describes another.
    const actual = turns[d.turnIndex]?.text ?? ''
    check(
      `dictation ${d.id}: text is spoken in the turn it points at`,
      actual.includes(d.text),
      `turn ${d.turnIndex} does not contain "${d.text.slice(0, 40)}"`,
    )
  }

  for (const m of MISSING_WORD) {
    const turns = turnsOf(m.audioId)
    check(`missing word ${m.id}: script exists`, !!turns)
    if (!turns) continue
    check(`missing word ${m.id}: turn ${m.turnIndex} is in range`, m.turnIndex < turns.length)
    const words = (turns[m.turnIndex]?.text ?? '').split(/\s+/)
    check(`missing word ${m.id}: word ${m.wordIndex} is in range`, m.wordIndex < words.length, `${m.wordIndex}/${words.length}`)
    check(`missing word ${m.id}: has four options`, m.options.length === 4, `${m.options.length}`)
    check(`missing word ${m.id}: correct index is in range`, m.correct >= 0 && m.correct < 4)
    check(`missing word ${m.id}: options are distinct`, new Set(m.options).size === 4)
    // The real item tests stress and minimal pairs, so the distractors should be
    // genuinely confusable rather than random words.
    const stem = m.options[m.correct]!.toLowerCase()
    const confusable = m.options.filter((o) => o.toLowerCase().startsWith(stem.slice(0, 3))).length
    check(`missing word ${m.id}: distractors share the stem of the answer`, confusable >= 2, `${confusable} share "${stem.slice(0, 3)}"`)
  }

  for (const f of LISTENING_FIB) {
    check(`listening fib ${f.id}: has a transcript`, f.text.trim().length > 0)
    const blanks = (f.text.match(/______/g) ?? []).length
    check(`listening fib ${f.id}: blanks match answers`, blanks === f.answers.length, `${blanks} vs ${f.answers.length}`)
    for (const [i, accepted] of f.answers.entries()) {
      check(`listening fib ${f.id}: blank ${i} has at least one accepted form`, accepted.length >= 1)
    }
    const script = AUDIO_INDEX.get(f.audioId)
    check(`listening fib ${f.id}: script exists`, !!script)
    if (script) check(`listening fib ${f.id}: startTurn is in range`, f.startTurn < script.turns.length)
  }

  for (const h of HIGHLIGHT_SUMMARY) {
    check(`highlight summary ${h.id}: has four options`, h.options.length === 4, `${h.options.length}`)
    check(`highlight summary ${h.id}: correct index is in range`, h.correct >= 0 && h.correct < h.options.length)
    check(`highlight summary ${h.id}: options are distinct`, new Set(h.options).size === 4)
    check(`highlight summary ${h.id}: script exists`, !!AUDIO_INDEX.get(h.audioId))
  }

  for (const h of HIGHLIGHT_INCORRECT) {
    const shown = h.transcript.split(/\s+/)
    const actual = h.correctTranscript.split(/\s+/)
    check(`highlight incorrect ${h.id}: substitutes rather than inserts`, shown.length === actual.length, `${shown.length} vs ${actual.length}`)
    const diff = shown.reduce<number[]>((acc, w, i) => (w === actual[i] ? acc : [...acc, i]), [])
    check(`highlight incorrect ${h.id}: exactly two words differ`, diff.length === 2, `${diff.length}`)
    check(
      `highlight incorrect ${h.id}: stored indices mark the differing words`,
      diff.every((i) => h.incorrect.includes(i)) && h.incorrect.length === diff.length,
      `stored ${JSON.stringify(h.incorrect)} actual ${JSON.stringify(diff)}`,
    )
    check(`highlight incorrect ${h.id}: script exists`, !!AUDIO_INDEX.get(h.audioId))
  }

  // The two listening multiple choice formats differ in shape: single answer has
  // four options and one key, multiple answers has five options and two keys.
  for (const q of LISTENING_MCQ_SINGLE) {
    check(`listening mcq single ${q.id}: script exists`, !!AUDIO_INDEX.get(q.audioId))
    check(`listening mcq single ${q.id}: has four options`, q.options.length === 4, `${q.options.length}`)
    check(`listening mcq single ${q.id}: options are distinct`, new Set(q.options).size === 4)
    check(`listening mcq single ${q.id}: exactly one answer`, q.correct.length === 1, `${q.correct.length}`)
    check(`listening mcq single ${q.id}: answer is an option`, q.options.includes(q.correct[0]!))
  }
  for (const q of LISTENING_MCQ_MULTI) {
    check(`listening mcq multiple ${q.id}: script exists`, !!AUDIO_INDEX.get(q.audioId))
    check(`listening mcq multiple ${q.id}: has five options`, q.options.length === 5, `${q.options.length}`)
    check(`listening mcq multiple ${q.id}: options are distinct`, new Set(q.options).size === 5)
    check(`listening mcq multiple ${q.id}: exactly two answers`, q.correct.length === 2, `${q.correct.length}`)
    for (const c of q.correct) {
      check(`listening mcq multiple ${q.id}: answer "${c.slice(0, 22)}" is an option`, q.options.includes(c))
    }
  }

  for (const st of SITUATIONS) {
    check(`situation ${st.id}: has a situation`, st.situation.trim().length > 0)
    check(`situation ${st.id}: has a prompt`, st.prompt.trim().length > 0)
    check(`situation ${st.id}: has a reference answer`, st.reference.trim().length > 0)
    check(`situation ${st.id}: has key terms`, st.keyTerms.length >= 4, `${st.keyTerms.length}`)
  }
}

// --- Capacity --------------------------------------------------------------
// Every type must be able to fill a single test without exhausting the bank.
const capacity = capacityByType()
for (const [type, have] of Object.entries(capacity)) {
  check(`type ${type} has at least one item`, have > 0, `${have}`)
}

const items = Object.values(capacity).reduce((a, b) => a + b, 0)
console.log(`  ${PASSAGES.length} passages, ${CHARTS.length} charts, ${items} buildable items across ${Object.keys(capacity).length} types`)
console.log(`  ${checks} structural checks, ${failures} failing`)

if (failures > 0) {
  console.log(`\nCONTENT BANK STRUCTURE FAILED (${failures} failing)\n`)
  process.exit(1)
}
console.log('\nCONTENT BANK STRUCTURE PASSED\n')