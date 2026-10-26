import { pickN, shuffle, makeRng } from '../lib/random'
import { wordCount } from '../lib/text'
import { describeData } from '../lib/chartData'
import { ASQ_RECORDINGS } from '../content/listening'
import {
  AUDIO_INDEX,
  BANK,
  ESSAY_PROMPTS,
  PASSAGES,
  READ_ALOUD_POOL,
  termsFromReference,
  REPEAT_SENTENCES,
  variantRng,
} from '../content/bank'
import { MOCK_BLUEPRINT, QUESTION_META, SECTION_META, primarySkill } from './blueprint'
import { expectedMaxPoints } from './scoring'
import type {
  AnswerKey,
  Item,
  ItemGroup,
  MockTest,
  ParagraphBlock,
  QuestionType,
  SectionId,
  Skill,
  Stimulus,
  TableSpec,
  TestSection,
} from './types'

// ---------------------------------------------------------------------------
// Mock assembly
//
// A mock is built by walking the real test order type by type, drawing
// stimulus groups from the content bank and shuffling the surface detail
// (option order, paragraph order, word banks) deterministically from the seed.
// Two candidates taking the same mock see the same content in the same order.
// ---------------------------------------------------------------------------

interface Ctx {
  seed: number
  items: Record<string, Item>
  answers: Record<string, AnswerKey>
}

function itemId(type: QuestionType, sourceId: string, index?: number): string {
  return index === undefined ? `${type}:${sourceId}` : `${type}:${sourceId}:${index}`
}

function skillsFor(type: QuestionType): Skill[] {
  /* v8 ignore next -- every question type is in the blueprint */
  return QUESTION_META[type]?.skills ?? [primarySkill(type)]
}

function addItem(ctx: Ctx, item: Omit<Item, 'skills'>, answer: AnswerKey): void {
  // Skill routing lives in exactly one place — the blueprint, transcribed from
  // Pearson's score guide — so an item can never disagree with it.
  // Maximum points are derived from the published scoring spec via expectedMaxPoints
  // so the assembler and the scorer cannot drift. Unscored items (warm-up / intro) remain 0.
  const maxPoints = item.warmup ? 0 : expectedMaxPoints(item.type, answer)
  ctx.items[item.id] = { ...item, maxPoints, skills: skillsFor(item.type) }
  ctx.answers[item.id] = answer
}

type GroupInput = Omit<ItemGroup, 'skills'>

function group(input: GroupInput): ItemGroup {
  return { ...input, skills: skillsFor(input.type) }
}

// ---------------------------------------------------------------------------
// Part 1 — Speaking & Writing
// ---------------------------------------------------------------------------

function buildSpeakingWriting(
  ctx: Ctx,
  counts: Partial<Record<QuestionType, number>>,
  excludePassages: Set<string>,
): ItemGroup[] {
  const groups: ItemGroup[] = []
  const passages = PASSAGES.filter((p) => !excludePassages.has(p.id))

  // Personal introduction — presented but never scored.
  const introId = itemId('respond-to-situation', 'intro')
  addItem(
    ctx,
    {
      id: introId,
      type: 'respond-to-situation',
      section: 'speaking-writing',
      groupId: 'g-intro',
      responseKind: 'audio',
      prompt:
        'You have 25 seconds to prepare, then 30 seconds to record. You may write notes in the box. Allow yourself to speak as naturally as possible.',
      warmup: true,
      maxPoints: 0,
      seconds: 55,
      prepSeconds: 25,
      tokens: [
        'Name:',
        '___',
        'City:',
        '___',
        'Prepare to talk about:',
        'Why you have chosen this course and what you expect to do in the future.',
        'Please say something about your hometown and your family.',
      ],
      tip: 'This warm-up is not scored. Use it to check that your microphone works and that you can hear the countdown.',
    },
    {},
  )
  groups.push(
    group({
      id: 'g-intro',
      section: 'speaking-writing',
      type: 'respond-to-situation',
      order: 0,
      stimulus: {},
      itemIds: [introId],
    }),
  )

  let order = 1

  // Read Aloud
  {
    const n = counts['read-aloud'] ?? MOCK_BLUEPRINT['read-aloud']
    const picks = pickN(READ_ALOUD_POOL, n, makeRng(ctx.seed + 1))
    for (const extract of picks) {
      const id = itemId('read-aloud', extract.id)
      const gid = `g-ra-${extract.id}`
      addItem(
        ctx,
        {
          id,
          type: 'read-aloud',
          section: 'speaking-writing',
          groupId: gid,
          responseKind: 'audio',
          prompt:
            'Look at the text below. You will have 30–40 seconds to prepare before the recording starts.',
          targetText: extract.text,
          maxPoints: 1,
          seconds: 45,
          prepSeconds: 35,
        },
        { reference: extract.text, minWords: Math.max(6, wordCount(extract.text) - 3) },
      )
      groups.push(
        group({
          id: gid,
          section: 'speaking-writing',
          type: 'read-aloud',
          order: order++,
          stimulus: {},
          itemIds: [id],
        }),
      )
    }
  }

  // Repeat Sentence
  {
    const n = counts['repeat-sentence'] ?? MOCK_BLUEPRINT['repeat-sentence']
    const picks = pickN(REPEAT_SENTENCES, n, makeRng(ctx.seed + 2))
    for (const s of picks) {
      const id = itemId('repeat-sentence', s.id)
      const gid = `g-rs-${s.id}`
      addItem(
        ctx,
        {
          id,
          type: 'repeat-sentence',
          section: 'speaking-writing',
          groupId: gid,
          responseKind: 'audio',
          prompt: 'You will hear a recording. Repeat what you hear.',
          targetText: s.text,
          stimulusId: s.id,
          audioUtterance: s.text,
          maxPoints: 1,
          seconds: 25,
          prepSeconds: 2,
        },
        { reference: s.text, minWords: Math.max(5, wordCount(s.text) - 4) },
      )
      groups.push(
        group({
          id: gid,
          section: 'speaking-writing',
          type: 'repeat-sentence',
          order: order++,
          stimulus: {},
          itemIds: [id],
        }),
      )
    }
  }

  // Describe Image
  {
    const n = counts['describe-image'] ?? MOCK_BLUEPRINT['describe-image']
    const picks = pickN(BANK.charts, n, makeRng(ctx.seed + 3))
    for (const chart of picks) {
      const id = itemId('describe-image', chart.id)
      const gid = `g-di-${chart.id}`
      // A model description of what the stimulus shows, used both as the
      // reference answer and as the source of the key terms.
      const description = `${chart.title}. ${chart.caption} ${describeData(chart.id)}`

      addItem(
        ctx,
        {
          id,
          type: 'describe-image',
          section: 'speaking-writing',
          groupId: gid,
          responseKind: 'audio',
          prompt: `Describe the information given in the ${CHART_LABELS[chart.kind] ?? 'chart'} below. You have 25 seconds to prepare.`,
          chartId: chart.id,
          maxPoints: 1,
          seconds: 45,
          prepSeconds: 25,
        },
        {
          // The reference and the key terms are built from one description, so a
          // response that covers the description necessarily covers the terms.
          reference: description,
          keyTerms: termsFromReference(description, 8),
          minWords: chart.minWords,
        },
      )
      groups.push(
        group({
          id: gid,
          section: 'speaking-writing',
          type: 'describe-image',
          order: order++,
          stimulus: { chartId: chart.id, imageAlt: chartTitle(chart.title, chart.kind) },
          itemIds: [id],
        }),
      )
    }
  }

  // Re-tell Lecture
  {
    const n = counts['retell-lecture'] ?? MOCK_BLUEPRINT['retell-lecture']
    const picks = pickN(BANK.retell, n, makeRng(ctx.seed + 4))
    for (const rtl of picks) {
      const id = itemId('retell-lecture', rtl.id)
      const gid = `g-rtl-${rtl.id}`
      const script = AUDIO_INDEX.get(rtl.audioId)
      addItem(
        ctx,
        {
          id,
          type: 'retell-lecture',
          section: 'speaking-writing',
          groupId: gid,
          responseKind: 'audio',
          prompt:
            'Listen to the recording and re-tell what you heard in your own words. You have 25 seconds to prepare.',
          stimulusId: rtl.audioId,
          maxPoints: 1,
          seconds: 50,
          prepSeconds: 25,
          audioLeadIn: 4,
          replays: 0,
        },
        { reference: rtl.reference, keyTerms: rtl.keyTerms, minWords: rtl.minWords },
      )
      groups.push(
        group({
          id: gid,
          section: 'speaking-writing',
          type: 'retell-lecture',
          order: order++,
          stimulus: audioStimulus(rtl.audioId, script?.title),
          itemIds: [id],
        }),
      )
    }
  }

  // Answer Short Question
  {
    const n = counts['answer-short-question'] ?? MOCK_BLUEPRINT['answer-short-question']
    const picks = pickN(BANK.asq, n, makeRng(ctx.seed + 5))
    for (const q of picks) {
      const id = itemId('answer-short-question', q.id)
      const gid = `g-asq-${q.id}`
      const rec = ASQ_AUDIO.get(q.id) ?? q.id
      /* v8 ignore next -- the recording id is never empty */
      const script = rec ? AUDIO_INDEX.get(rec) : undefined
      addItem(
        ctx,
        {
          id,
          type: 'answer-short-question',
          section: 'speaking-writing',
          groupId: gid,
          responseKind: 'audio',
          prompt:
            'Listen to the recording and answer the question below. Answer in no more than four words.',
          tokens: [q.question],
          stimulusId: rec,
          maxPoints: 1,
          seconds: 20,
          prepSeconds: 0,
          audioLeadIn: 3,
          replays: 1,
        },
        {
          correctChoice: q.correct,
          blanks: [[q.correct]],
          reference: q.correct,
          minWords: 1,
          maxWords: 4,
        },
      )
      groups.push(
        group({
          id: gid,
          section: 'speaking-writing',
          type: 'answer-short-question',
          order: order++,
          stimulus: { audioId: rec, note: script?.scene },
          itemIds: [id],
        }),
      )
    }
  }

  // Summarize Group Discussion
  {
    const n = counts['summarize-group-discussion'] ?? MOCK_BLUEPRINT['summarize-group-discussion']
    const picks = pickN(BANK.groupDiscussionItems, n, makeRng(ctx.seed + 6))
    for (const sgd of picks) {
      const id = itemId('summarize-group-discussion', sgd.id)
      const gid = `g-sgd-${sgd.id}`
      const script = AUDIO_INDEX.get(sgd.audioId)
      addItem(
        ctx,
        {
          id,
          type: 'summarize-group-discussion',
          section: 'speaking-writing',
          groupId: gid,
          responseKind: 'audio',
          prompt: sgd.question,
          stimulusId: sgd.audioId,
          maxPoints: 1,
          seconds: 180,
          prepSeconds: 10,
          audioLeadIn: 5,
          replays: 1,
        },
        { reference: sgd.reference, keyTerms: sgd.keyTerms, minWords: sgd.minWords },
      )
      groups.push(
        group({
          id: gid,
          section: 'speaking-writing',
          type: 'summarize-group-discussion',
          order: order++,
          stimulus: audioStimulus(sgd.audioId, script?.title),
          itemIds: [id],
        }),
      )
    }
  }

  // Respond to a Situation
  {
    const n = counts['respond-to-situation'] ?? MOCK_BLUEPRINT['respond-to-situation']
    const picks = pickN(BANK.situations, n, makeRng(ctx.seed + 7))
    for (const rts of picks) {
      const id = itemId('respond-to-situation', rts.id)
      const gid = `g-rts-${rts.id}`
      addItem(
        ctx,
        {
          id,
          type: 'respond-to-situation',
          section: 'speaking-writing',
          groupId: gid,
          responseKind: 'audio',
          prompt: rts.prompt,
          maxPoints: 1,
          seconds: 95,
          prepSeconds: 10,
          tokens: [rts.situation],
        },
        { reference: rts.reference, keyTerms: rts.keyTerms, minWords: rts.minWords },
      )
      groups.push(
        group({
          id: gid,
          section: 'speaking-writing',
          type: 'respond-to-situation',
          order: order++,
          stimulus: {},
          itemIds: [id],
        }),
      )
    }
  }

  // Summarize Written Text
  {
    const pool = passages
    const picks = pickN(
      pool,
      counts['summarize-written-text'] ?? MOCK_BLUEPRINT['summarize-written-text'],
      makeRng(ctx.seed + 8),
    )
    for (const p of picks) {
      const id = itemId('summarize-written-text', p.swt.id)
      const gid = `g-swt-${p.id}`
      addItem(
        ctx,
        {
          id,
          type: 'summarize-written-text',
          section: 'speaking-writing',
          groupId: gid,
          responseKind: 'text',
          prompt: 'Read the passage below and write a one-sentence summary of the main idea.',
          maxPoints: 1,
          seconds: 120,
        },
        {
          // A model summary, not the source text: Content scores how much of
          // the source was conveyed, so the reference has to be a summary.
          reference: p.swt.summary,
          keyTerms: termsFromReference(p.swt.summary, 8),
          minWords: p.swt.minWords,
          maxWords: 45,
        },
      )
      groups.push(
        group({
          id: gid,
          section: 'speaking-writing',
          type: 'summarize-written-text',
          order: order++,
          stimulus: {
            passageId: p.id,
            passageTitle: p.swt.excerptLabel,
            passageParagraphs: p.swt.excerpt,
          },
          itemIds: [id],
        }),
      )
    }
  }

  // Write Essay
  {
    const picks = pickN(
      ESSAY_PROMPTS,
      counts['write-essay'] ?? MOCK_BLUEPRINT['write-essay'],
      makeRng(ctx.seed + 9),
    )
    for (const essay of picks) {
      const id = itemId('write-essay', essay.id)
      const gid = `g-we-${essay.id}`
      const stimulus: Stimulus = {}
      if (essay.source === 'passage') {
        const p = PASSAGES.find((x) => `page-${x.id}` === essay.stimulus)
        if (p) {
          stimulus.passageId = p.id
          stimulus.passageTitle = p.title
          stimulus.passageParagraphs = p.paragraphs
        }
      } else {
        stimulus.note = essay.stimulus
      }
      addItem(
        ctx,
        {
          id,
          type: 'write-essay',
          section: 'speaking-writing',
          groupId: gid,
          responseKind: 'text',
          prompt: `Write an essay in response to the prompt below. You have 20 minutes. Write between 200 and 300 words.`,
          maxPoints: 1,
          seconds: 20 * 60,
        },
        {
          // The reference is the prompt; the terms are the ideas an answer must
          // engage with, so they are derived from the prompt itself.
          reference: essay.question,
          keyTerms: termsFromReference(essay.question, 8),
          minWords: essay.minWords,
          maxWords: essay.maxWords,
        },
      )
      groups.push(
        group({
          id: gid,
          section: 'speaking-writing',
          type: 'write-essay',
          order: order++,
          stimulus,
          itemIds: [id],
        }),
      )
    }
  }

  return groups
}

// ---------------------------------------------------------------------------
// Part 2 — Reading
// ---------------------------------------------------------------------------

function buildReading(ctx: Ctx, counts: Partial<Record<QuestionType, number>>): ItemGroup[] {
  const groups: ItemGroup[] = []
  let order = 0
  const pool = shuffle(PASSAGES, makeRng(ctx.seed + 20))

  // The real PTE Reading section shows a single passage and derives every item
  // from it, so one passage here produces the dropdown item, the table item and
  // both multiple-choice sets. Re-order Paragraphs shows no passage, so those
  // items stand alone.
  const passagesNeeded = Math.max(
    1,
    counts['fill-in-blanks-dropdown'] ?? MOCK_BLUEPRINT['fill-in-blanks-dropdown'],
    counts['fill-in-blanks-table'] ?? MOCK_BLUEPRINT['fill-in-blanks-table'],
    counts['multiple-choice-multiple'] ?? MOCK_BLUEPRINT['multiple-choice-multiple'],
    counts['multiple-choice-single'] ?? MOCK_BLUEPRINT['multiple-choice-single'],
  )

  let dropdownMade = 0
  let tableMade = 0
  let multiMade = 0
  let singleMade = 0

  for (const p of pool.slice(0, Math.min(passagesNeeded, pool.length))) {
    const gid = `g-read-${p.id}`
    const itemIds: string[] = []

    // The dropdown lives in its own group and carries no `passageParagraphs`.
    // Its `targetText` already is the passage, gapped; attaching the intact
    // paragraphs printed every answer directly above its own blank. The reading
    // multiple choice items share this passage and genuinely need to see it, so
    // the two cannot live in one group.
    if (
      dropdownMade <
      (counts['fill-in-blanks-dropdown'] ?? MOCK_BLUEPRINT['fill-in-blanks-dropdown'])
    ) {
      dropdownMade += 1
      const rng = variantRng(p.dropdown.id, ctx.seed)
      const bank = shuffle(p.dropdown.bank, rng)
      const id = itemId('fill-in-blanks-dropdown', p.dropdown.id)
      const dropdownGid = `g-read-dropdown-${p.id}`
      addItem(
        ctx,
        {
          id,
          type: 'fill-in-blanks-dropdown',
          section: 'reading',
          groupId: dropdownGid,
          responseKind: 'blanks',
          prompt: 'Complete the passage below. Select the correct word from each list.',
          maxPoints: p.dropdown.answers.length,
          seconds: 0,
          options: bank,
          targetText: p.dropdown.text,
        },
        { blanks: p.dropdown.answers.map((a) => [a]) },
      )
      groups.push(
        group({
          id: dropdownGid,
          section: 'reading',
          type: 'fill-in-blanks-dropdown',
          order: 0,
          stimulus: { passageId: p.id, passageTitle: p.title },
          itemIds: [id],
        }),
      )
    }

    if (tableMade < (counts['fill-in-blanks-table'] ?? MOCK_BLUEPRINT['fill-in-blanks-table'])) {
      tableMade += 1
      const id = itemId('fill-in-blanks-table', p.tableFib.id)
      addItem(
        ctx,
        {
          id,
          type: 'fill-in-blanks-table',
          section: 'reading',
          groupId: gid,
          responseKind: 'blanks',
          prompt: 'Complete the table below. The table is based on the text above.',
          table: tableFrom(p),
          maxPoints: p.tableFib.answers.length,
          seconds: 0,
        },
        { blanks: p.tableFib.answers.map((a) => [a]) },
      )
      itemIds.push(id)
    }

    if (
      multiMade < (counts['multiple-choice-multiple'] ?? MOCK_BLUEPRINT['multiple-choice-multiple'])
    ) {
      multiMade += 1
      const rng = variantRng(p.mcqMultiple.id, ctx.seed)
      const correct = new Set(p.mcqMultiple.correct)
      const entries = shuffle(
        p.mcqMultiple.options.map((text) => ({ text, isCorrect: correct.has(text) })),
        rng,
      )
      const id = itemId('multiple-choice-multiple', p.mcqMultiple.id)
      addItem(
        ctx,
        {
          id,
          type: 'multiple-choice-multiple',
          section: 'reading',
          groupId: gid,
          responseKind: 'multi-choice',
          prompt: p.mcqMultiple.question,
          options: entries.map((e) => e.text),
          // One point per correct option: the published basis is +1 per correct
          // choice, -1 per wrong one, so the item is worth the number of
          // correct options and not a flat single point.
          maxPoints: expectedMaxPoints('multiple-choice-multiple', {
            correctChoices: entries.filter((e) => e.isCorrect).map((e) => e.text),
          }),
          seconds: 0,
        },
        {
          correctChoices: entries.filter((e) => e.isCorrect).map((e) => e.text),
          reference: `Select TWO: ${p.mcqMultiple.correct.join(' and ')}.`,
        },
      )
      itemIds.push(id)
    }

    if (
      singleMade < (counts['multiple-choice-single'] ?? MOCK_BLUEPRINT['multiple-choice-single'])
    ) {
      singleMade += 1
      const rng = variantRng(p.mcqSingle.id, ctx.seed)
      const correct = p.mcqSingle.correct[0] ?? p.mcqSingle.options[0] ?? ''
      const entries = shuffle(
        p.mcqSingle.options.map((text) => ({ text, isCorrect: text === correct })),
        rng,
      )
      const id = itemId('multiple-choice-single', p.mcqSingle.id)
      addItem(
        ctx,
        {
          id,
          type: 'multiple-choice-single',
          section: 'reading',
          groupId: gid,
          responseKind: 'choice',
          prompt: p.mcqSingle.question,
          options: entries.map((e) => e.text),
          maxPoints: 1,
          seconds: 0,
        },
        { correctChoice: correct, reference: correct },
      )
      itemIds.push(id)
    }

    if (itemIds.length > 0) {
      groups.push(
        group({
          id: gid,
          section: 'reading',
          /* v8 ignore next -- a table group always has an item */
          type: (itemIds[0] ? ctx.items[itemIds[0]]?.type : undefined) ?? 'fill-in-blanks-table',
          order: order++,
          stimulus: { passageId: p.id, passageTitle: p.title, passageParagraphs: p.paragraphs },
          itemIds,
        }),
      )
    }
  }

  // Re-order Paragraphs presents the paragraphs on screen, so it needs no passage.
  const reorderCount = counts['reorder-paragraphs'] ?? MOCK_BLUEPRINT['reorder-paragraphs']
  const reorderSources = shuffle(PASSAGES, makeRng(ctx.seed + 21))
  if (reorderSources.length === 0) return groups
  for (let i = 0; i < reorderCount; i++) {
    const p = reorderSources[i % reorderSources.length]
    /* v8 ignore next -- the modulo always lands on a source */
    if (!p) break
    const gid = `g-rop-${p.id}-${i}`
    const id = itemId('reorder-paragraphs', p.id, i)
    const rng = variantRng(`${p.id}-rop-${i}`, ctx.seed)
    const correctBlocks: ParagraphBlock[] = p.paragraphs.map((text, idx) => ({
      id: `p${idx}`,
      text,
    }))
    addItem(
      ctx,
      {
        id,
        type: 'reorder-paragraphs',
        section: 'reading',
        groupId: gid,
        responseKind: 'order',
        prompt:
          'The paragraphs below are in the wrong order. Read them and put them in the correct sequence.',
        blocks: shuffle(correctBlocks, rng),
        // N boxes yield N-1 adjacent pairs, so the item maximum is N-1.
        maxPoints: expectedMaxPoints('reorder-paragraphs', {
          order: correctBlocks.map((b) => b.id),
        }),
        seconds: 0,
      },
      { order: correctBlocks.map((b) => b.id) },
    )
    groups.push(
      group({
        id: gid,
        section: 'reading',
        type: 'reorder-paragraphs',
        order: order++,
        stimulus: {},
        itemIds: [id],
      }),
    )
  }

  return groups
}

function tableFrom(p: (typeof PASSAGES)[number]): TableSpec {
  const blankCells: Array<{ row: number; col: number }> = []
  p.tableFib.rows.forEach((row, r) => {
    row.forEach((cell, c) => {
      if (cell === null) blankCells.push({ row: r, col: c })
    })
  })
  return {
    headers: p.tableFib.headers,
    rows: p.tableFib.rows,
    blankCells,
    context: p.tableFib.context,
  }
}

// ---------------------------------------------------------------------------
// Part 3 — Listening
// ---------------------------------------------------------------------------

function buildListening(ctx: Ctx, counts: Partial<Record<QuestionType, number>>): ItemGroup[] {
  const groups: ItemGroup[] = []
  let order = 0

  const sst = pickN(
    BANK.spokenSummary,
    counts['summarize-spoken-text'] ?? MOCK_BLUEPRINT['summarize-spoken-text'],
    makeRng(ctx.seed + 30),
  )
  for (const s of sst) {
    const id = itemId('summarize-spoken-text', s.id)
    const gid = `g-sst-${s.id}`
    addItem(
      ctx,
      {
        id,
        type: 'summarize-spoken-text',
        section: 'listening',
        groupId: gid,
        responseKind: 'text',
        prompt: s.question,
        stimulusId: s.audioId,
        maxPoints: 1,
        seconds: 12 * 60,
      },
      { reference: s.reference, keyTerms: s.keyTerms, minWords: s.minWords, maxWords: 90 },
    )
    groups.push(
      group({
        id: gid,
        section: 'listening',
        type: 'summarize-spoken-text',
        order: order++,
        stimulus: audioStimulus(s.audioId, AUDIO_INDEX.get(s.audioId)?.title),
        itemIds: [id],
      }),
    )
  }

  const fibs = pickN(
    BANK.listeningFib,
    counts['fill-in-blanks-listening'] ?? MOCK_BLUEPRINT['fill-in-blanks-listening'],
    makeRng(ctx.seed + 31),
  )
  for (const f of fibs) {
    const id = itemId('fill-in-blanks-listening', f.id)
    const gid = `g-fibl-${f.id}`
    addItem(
      ctx,
      {
        id,
        type: 'fill-in-blanks-listening',
        section: 'listening',
        groupId: gid,
        responseKind: 'blanks',
        prompt: 'Listen and fill in the blanks. The recording plays once.',
        targetText: f.text,
        stimulusId: f.audioId,
        // The clip reads the gapped passage; the parent conversation also
        // contains material the passage does not ask about.
        audioClipId: f.id,
        maxPoints: f.answers.length,
        seconds: 0,
        audioLeadIn: 4,
        replays: 0,
      },
      { blanks: f.answers, reference: completedText(f.text, f.answers) },
    )
    groups.push(
      group({
        id: gid,
        section: 'listening',
        type: 'fill-in-blanks-listening',
        order: order++,
        stimulus: audioStimulus(f.audioId, AUDIO_INDEX.get(f.audioId)?.title),
        itemIds: [id],
      }),
    )
  }

  const hcs = pickN(
    BANK.highlightSummary,
    counts['highlight-correct-summary'] ?? MOCK_BLUEPRINT['highlight-correct-summary'],
    makeRng(ctx.seed + 32),
  )
  for (const h of hcs) {
    const rng = variantRng(h.id, ctx.seed)
    const order2 = shuffle(
      h.options.map((_, i) => i),
      rng,
    )
    const id = itemId('highlight-correct-summary', h.id)
    const gid = `g-hcs-${h.id}`
    addItem(
      ctx,
      {
        id,
        type: 'highlight-correct-summary',
        section: 'listening',
        groupId: gid,
        responseKind: 'choice',
        prompt: h.question,
        options: order2.map((i) => h.options[i] as string),
        stimulusId: h.audioId,
        maxPoints: 1,
        seconds: 0,
        audioLeadIn: 4,
        replays: 1,
      },
      { correctChoice: h.options[h.correct], reference: h.options[h.correct] },
    )
    groups.push(
      group({
        id: gid,
        section: 'listening',
        type: 'highlight-correct-summary',
        order: order++,
        stimulus: audioStimulus(h.audioId, AUDIO_INDEX.get(h.audioId)?.title),
        itemIds: [id],
      }),
    )
  }

  const mcqS = pickN(
    BANK.listeningMcqSingle,
    counts['listening-multiple-choice-single'] ??
      MOCK_BLUEPRINT['listening-multiple-choice-single'],
    makeRng(ctx.seed + 33),
  )
  for (const q of mcqS) {
    const rng = variantRng(q.id, ctx.seed)
    const correct = q.correct[0] ?? q.options[0] ?? ''
    const entries = shuffle(
      q.options.map((t) => ({ t, ok: t === correct })),
      rng,
    )
    const id = itemId('listening-multiple-choice-single', q.id)
    const gid = `g-lmcq-${q.id}`
    addItem(
      ctx,
      {
        id,
        type: 'listening-multiple-choice-single',
        section: 'listening',
        groupId: gid,
        responseKind: 'choice',
        prompt: q.question,
        options: entries.map((e) => e.t),
        stimulusId: q.audioId,
        maxPoints: 1,
        seconds: 0,
        audioLeadIn: 4,
        replays: 1,
      },
      { correctChoice: correct, reference: correct },
    )
    groups.push(
      group({
        id: gid,
        section: 'listening',
        type: 'listening-multiple-choice-single',
        order: order++,
        stimulus: audioStimulus(q.audioId, AUDIO_INDEX.get(q.audioId)?.title),
        itemIds: [id],
      }),
    )
  }

  const mcqM = pickN(
    BANK.listeningMcqMulti,
    counts['listening-multiple-choice-multiple'] ??
      MOCK_BLUEPRINT['listening-multiple-choice-multiple'],
    makeRng(ctx.seed + 34),
  )
  for (const q of mcqM) {
    const rng = variantRng(q.id, ctx.seed)
    const correctSet = new Set(q.correct)
    const entries = shuffle(
      q.options.map((t) => ({ t, ok: correctSet.has(t) })),
      rng,
    )
    const id = itemId('listening-multiple-choice-multiple', q.id)
    const gid = `g-lmcqm-${q.id}`
    addItem(
      ctx,
      {
        id,
        type: 'listening-multiple-choice-multiple',
        section: 'listening',
        groupId: gid,
        responseKind: 'multi-choice',
        prompt: q.question,
        options: entries.map((e) => e.t),
        stimulusId: q.audioId,
        // As in Reading: one point per correct option, -1 per wrong one.
        maxPoints: expectedMaxPoints('listening-multiple-choice-multiple', {
          correctChoices: entries.filter((e) => e.ok).map((e) => e.t),
        }),
        seconds: 0,
        audioLeadIn: 4,
        replays: 1,
      },
      {
        correctChoices: entries.filter((e) => e.ok).map((e) => e.t),
        reference: `Select TWO: ${q.correct.join(' and ')}.`,
      },
    )
    groups.push(
      group({
        id: gid,
        section: 'listening',
        type: 'listening-multiple-choice-multiple',
        order: order++,
        stimulus: audioStimulus(q.audioId, AUDIO_INDEX.get(q.audioId)?.title),
        itemIds: [id],
      }),
    )
  }

  const smw = pickN(
    BANK.missingWord,
    counts['select-missing-word'] ?? MOCK_BLUEPRINT['select-missing-word'],
    makeRng(ctx.seed + 35),
  )
  for (const m of smw) {
    const rng = variantRng(m.id, ctx.seed)
    const script = AUDIO_INDEX.get(m.audioId)
    const turn = script?.turns[m.turnIndex]
    if (!turn) continue
    const allWords = turn.text.split(/\s+/)
    const tokens = [...allWords.slice(0, m.wordIndex), '___', ...allWords.slice(m.wordIndex + 1)]
    const optOrder = shuffle(
      m.options.map((_, i) => i),
      rng,
    )
    const id = itemId('select-missing-word', m.id)
    const gid = `g-smw-${m.id}`
    addItem(
      ctx,
      {
        id,
        type: 'select-missing-word',
        section: 'listening',
        groupId: gid,
        responseKind: 'choice',
        prompt: 'Listen and select the missing word. A beep marks the blank.',
        tokens,
        options: optOrder.map((i) => m.options[i] as string),
        stimulusId: m.audioId,
        // The conversation recording speaks the word the item blanks out, so
        // the beeped single-turn clip is the only asset that can be played.
        audioClipId: m.id,
        // If that clip is missing, the speech fallback must not read the whole
        // conversation: it would speak the answer the item is testing. Scope
        // it to the one turn and beep over the blanked word instead.
        audioFromTurn: m.turnIndex,
        audioToTurn: m.turnIndex,
        audioBeepWord: m.wordIndex,
        maxPoints: 1,
        seconds: 0,
        audioLeadIn: 4,
        replays: 0,
      },
      { correctChoice: m.options[m.correct], reference: m.options[m.correct] },
    )
    groups.push(
      group({
        id: gid,
        section: 'listening',
        type: 'select-missing-word',
        order: order++,
        /* v8 ignore next -- every missing-word item has a script */
        stimulus: audioStimulus(m.audioId, script?.title ?? 'Listen and select the missing word'),
        itemIds: [id],
      }),
    )
  }

  const hiw = pickN(
    BANK.highlightIncorrect,
    counts['highlight-incorrect-words'] ?? MOCK_BLUEPRINT['highlight-incorrect-words'],
    makeRng(ctx.seed + 36),
  )
  for (const h of hiw) {
    const id = itemId('highlight-incorrect-words', h.id)
    const gid = `g-hiw-${h.id}`
    addItem(
      ctx,
      {
        id,
        type: 'highlight-incorrect-words',
        section: 'listening',
        groupId: gid,
        responseKind: 'highlight',
        prompt:
          'The transcript below contains two words that differ from the audio. Highlight the two words that are wrong.',
        tokens: tokenizeWithPunctuation(h.transcript),
        stimulusId: h.audioId,
        // The item tests two substituted words in one sentence. The full
        // conversation buries that sentence among a minute of others.
        audioClipId: h.id,
        // One point per incorrect word the candidate has to find, minus one
        // for each word highlighted wrongly.
        maxPoints: expectedMaxPoints('highlight-incorrect-words', {
          correctHighlighted: h.incorrect,
        }),
        seconds: 0,
        audioLeadIn: 4,
        replays: 0,
      },
      { correctHighlighted: h.incorrect, reference: h.correctTranscript },
    )
    groups.push(
      group({
        id: gid,
        section: 'listening',
        type: 'highlight-incorrect-words',
        order: order++,
        stimulus: audioStimulus(h.audioId, 'Listen and highlight incorrect words'),
        itemIds: [id],
      }),
    )
  }

  const wfd = pickN(
    BANK.dictation,
    counts['write-from-dictation'] ?? MOCK_BLUEPRINT['write-from-dictation'],
    makeRng(ctx.seed + 37),
  )
  for (const d of wfd) {
    const id = itemId('write-from-dictation', d.id)
    const gid = `g-wfd-${d.id}`
    addItem(
      ctx,
      {
        id,
        type: 'write-from-dictation',
        section: 'listening',
        groupId: gid,
        responseKind: 'text',
        prompt: 'Listen and type exactly what you hear. The recording plays once.',
        stimulusId: d.audioId,
        // The dictation is a single sentence, so the rendered clip of that
        // sentence is what plays. The parent conversation is seventy seconds
        // long and would leave the candidate guessing which sentence to write.
        audioClipId: d.id,
        audioUtterance: d.text,
        maxPoints: expectedMaxPoints('write-from-dictation', { reference: d.text }),
        seconds: 0,
        audioLeadIn: 4,
        replays: 0,
      },
      {
        reference: d.text,
        keyTerms: d.text.split(/\s+/),
        minWords: wordCount(d.text) - 1,
        maxWords: wordCount(d.text) + 1,
      },
    )
    groups.push(
      group({
        id: gid,
        section: 'listening',
        type: 'write-from-dictation',
        order: order++,
        stimulus: audioStimulus(d.audioId, AUDIO_INDEX.get(d.audioId)?.title),
        itemIds: [id],
      }),
    )
  }

  return groups
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BLANK_MARKER = /______/

/** Rebuilds the authored text with each blank filled in, for per-word scoring. */
function completedText(text: string, answers: string[][]): string {
  const parts = text.split(BLANK_MARKER)
  return parts
    .map((part, i) => (i < parts.length - 1 ? `${part} ${answers[i]?.[0] ?? '___'}` : part))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function audioStimulus(audioId: string, title?: string): Stimulus {
  return { audioId, passageTitle: title, note: AUDIO_INDEX.get(audioId)?.scene }
}

function chartTitle(title: string, kind: string): string {
  return `${CHART_LABELS[kind] ?? 'Chart'}: ${title}.`
}

const CHART_LABELS: Record<string, string> = {
  bar: 'grouped bar chart',
  line: 'line graph',
  pie: 'pie chart',
  scatter: 'grouped bar chart',
  process: 'process flow diagram',
  diagram: 'diagram',
  'table-chart': 'data table',
}

/** Split into tokens while keeping trailing punctuation attached, so that
 *  highlighting a word in the transcript cannot highlight its comma. */
function tokenizeWithPunctuation(text: string): string[] {
  return text.split(/\s+/).filter((t) => t.length > 0)
}

const ASQ_AUDIO = new Map<string, string>(
  ASQ_RECORDINGS.map((r) => [r.item.id, r.audio.id] as const),
)

// ---------------------------------------------------------------------------
// Public builders
// ---------------------------------------------------------------------------

const SECTION_ORDER: SectionId[] = ['speaking-writing', 'reading', 'listening']

/** Scored items a complete mock puts in one section, from the blueprint. */
function blueprintScoredIn(section: SectionId): number {
  let total = 0
  for (const type of Object.keys(MOCK_BLUEPRINT) as QuestionType[]) {
    /* v8 ignore next -- every blueprint type has a count */
    if (QUESTION_META[type].section === section) total += MOCK_BLUEPRINT[type] ?? 0
  }
  return total
}

/**
 * Seconds allowed for a section, scaled to the items actually included.
 *
 * The reference count has to be the full blueprint's total for the section,
 * not the number of items inside this mock. Counted from `items`, both sides of
 * the ratio were always the same mock, so it always evaluated to 1: a half or
 * quick mock kept the full official clock, and choosing a short length only
 * packed fewer questions into the same two hours. `describeMockPreview` applies
 * the same arithmetic, and scripts/bank-check.ts asserts the two agree.
 */
function sectionSeconds(
  section: SectionId,
  groups: ItemGroup[],
  items: Record<string, Item>,
): number {
  /* v8 ignore next -- every group item is in the mock */
  const scored = groups
    .flatMap((g) => g.itemIds)
    .filter((id) => (items[id]?.maxPoints ?? 0) > 0).length
  const base = SECTION_META[section].minSeconds
  const reference = blueprintScoredIn(section)
  /* v8 ignore next -- every section has scored items in the blueprint */
  if (reference === 0) return base
  // Never exceed the official clock, and keep a floor so a drill stays usable.
  return Math.max(180, Math.round(base * Math.min(1, scored / reference)))
}

export interface BuildOptions {
  seed: number
  kind: MockTest['kind']
  sections: SectionId[]
  /** Restrict the mock to these question types (practice mode). */
  focusTypes?: QuestionType[]
  /** Number of items per type; defaults to the full mock blueprint. */
  counts?: Partial<Record<QuestionType, number>>
  title?: string
  /** Multiplier on every section clock. 1 is the official timing. */
  timeScale?: number
  untimed?: boolean
  /** True when the runner forbids going back, like the real test. */
  forwardOnly?: boolean
  createdAt?: string
}

export function buildMock(opts: BuildOptions): MockTest {
  const ctx: Ctx = { seed: opts.seed, items: {}, answers: {} }
  const sections: TestSection[] = []
  const exclude = new Set<string>()

  for (const section of SECTION_ORDER) {
    if (!opts.sections.includes(section)) continue

    const counts = filterCounts(opts)
    let groups: ItemGroup[] = []
    if (section === 'speaking-writing') {
      groups = buildSpeakingWriting(ctx, counts, exclude)
    } else if (section === 'reading') {
      groups = buildReading(ctx, counts)
    } else {
      groups = buildListening(ctx, counts)
    }

    if (opts.focusTypes) {
      groups = filterGroups(groups, opts.focusTypes, ctx.items)
      if (section === 'speaking-writing')
        groups = groups.filter((g) => g.type !== 'respond-to-situation' || g.id !== 'g-intro')
    }

    // Keep stimulus groups in a stable, sensible order.
    groups.sort((a, b) => a.order - b.order)
    groups = groups.map((g, i) => ({ ...g, order: i }))

    const base = sectionSeconds(section, groups, ctx.items)
    sections.push({
      id: section,
      title: SECTION_META[section].longTitle,
      seconds: opts.untimed ? base : Math.round(base * (opts.timeScale ?? 1)),
      groups,
      itemIds: groups.flatMap((g) => g.itemIds),
    })
  }

  const totalPoints = Object.values(ctx.items).reduce((sum, i) => sum + i.maxPoints, 0)
  const totalSeconds = sections.reduce((sum, s) => sum + s.seconds, 0)

  return {
    id: `mock-${opts.seed.toString(36)}`,
    seed: opts.seed,
    title: opts.title ?? 'Full Mock Test',
    kind: opts.kind,
    createdAt:
      opts.createdAt ??
      new Date(Date.UTC(2026, 0, 1) + (Math.abs(opts.seed) % 365) * 86400000).toISOString(),
    sections,
    items: ctx.items,
    answers: ctx.answers,
    totalPoints,
    totalSeconds,
    timeScale: opts.timeScale ?? 1,
    ...(opts.untimed ? { untimed: true } : {}),
    ...(opts.forwardOnly ? { forwardOnly: true } : {}),
    ...(opts.focusTypes ? { focusTypes: opts.focusTypes } : {}),
  }
}

function filterCounts(opts: BuildOptions): Partial<Record<QuestionType, number>> {
  if (!opts.counts) return {}
  if (!opts.focusTypes) return opts.counts
  const out: Partial<Record<QuestionType, number>> = {}
  for (const type of opts.focusTypes) out[type] = opts.counts[type]
  return out
}

/**
 * Narrows a mock down to the focused types.
 *
 * Matching on the group's declared `type` was wrong: one reading group carries
 * the table and both multiple choice items together, so a drill focused on
 * Multiple Choice (Single Answer) kept nothing and produced a test with zero
 * questions. The group's own type says what the group is called, not what its
 * items are, so the filter looks at the items themselves and drops the rest.
 */
function filterGroups(
  groups: ItemGroup[],
  focus: QuestionType[],
  items: Record<string, Item>,
): ItemGroup[] {
  const set = new Set(focus)
  return groups
    .map((g) => ({
      ...g,
      itemIds: g.itemIds.filter((id) => items[id] && set.has(items[id]!.type)),
    }))
    .filter((g) => g.itemIds.length > 0)
}

export function buildFullMock(seed: number, extra?: Partial<BuildOptions>): MockTest {
  return buildMock({
    seed,
    kind: 'full',
    sections: SECTION_ORDER,
    counts: { ...MOCK_BLUEPRINT, ...(extra?.counts ?? {}) },
    title: `Full Mock Test ${seed % 1000}`,
    ...extra,
  })
}

export function buildSectionMock(
  seed: number,
  section: SectionId,
  counts: Partial<Record<QuestionType, number>>,
  opts: { timeScale?: number; untimed?: boolean; forwardOnly?: boolean } = {},
): MockTest {
  return buildMock({
    seed,
    kind: 'section',
    sections: [section],
    counts,
    timeScale: opts.timeScale,
    untimed: opts.untimed,
    forwardOnly: opts.forwardOnly,
    title: `${SECTION_META[section].longTitle} Practice`,
  })
}

export function buildDrillMock(seed: number, types: QuestionType[], perType = 3): MockTest {
  const counts: Partial<Record<QuestionType, number>> = {}
  for (const t of types) counts[t] = perType
  const mock = buildMock({
    seed,
    kind: 'drill',
    sections: SECTION_ORDER,
    focusTypes: types,
    counts,
    title: types.length === 1 ? 'Single Skill Practice' : 'Focused Practice',
  })

  // A drill focused on Reading or Listening used to keep all three sections, so
  // the first one was empty. The runner starts at section zero, found no item
  // and rendered nothing at all, which presented as a blank screen rather than
  // an error. Only sections that actually contain an item are kept.
  const populated = mock.sections.filter((s) => s.itemIds.length > 0)
  if (populated.length === 0) return mock

  // The filtered items are no longer part of the session, so the maps and the
  // totals have to be rebuilt from what survived. Leaving them behind made a
  // two-item drill report every point in the bank (170 rather than 6) and
  // persisted a full 84-item mock in localStorage for it.
  const kept = new Set(populated.flatMap((s) => s.itemIds))
  const items: Record<string, Item> = {}
  for (const [id, item] of Object.entries(mock.items)) if (kept.has(id)) items[id] = item
  const answers: Record<string, AnswerKey> = {}
  for (const [id, key] of Object.entries(mock.answers)) if (kept.has(id)) answers[id] = key

  return {
    ...mock,
    sections: populated,
    items,
    answers,
    totalPoints: Object.values(items).reduce((sum, item) => sum + item.maxPoints, 0),
    totalSeconds: populated.reduce((sum, section) => sum + section.seconds, 0),
  }
}
