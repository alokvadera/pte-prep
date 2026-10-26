import { ALL_QUESTION_TYPES, QUESTION_META, SECTION_META } from '../domain/blueprint'
import type { QuestionType } from '../domain/types'

/**
 * Editorial content for the per-question-type pages.
 *
 * Everything structural — which skills an item scores, how many appear on a
 * test, its scoring mode — is already owned by the blueprint and is read from
 * there rather than repeated here. This module only holds the prose that the
 * blueprint cannot express: what the item actually asks you to do, how the
 * marks are actually allocated, and where candidates most often lose them.
 *
 * Every scoring claim below traces to `docs/PTE_KNOWLEDGE.md`, which records the
 * official guide references. Nothing here is inferred where Pearson publishes a
 * figure, and where Pearson does not publish one (Read Aloud's error table, for
 * instance) that is stated rather than filled in with a community rule of thumb.
 */

export interface QuestionTypeDetail {
  /** One sentence answering "what is this", used as the page's opening line. */
  what: string
  /** A second paragraph on the mechanics of the task itself. */
  how: string
  /** Type-specific account of how marks are allocated. */
  scoring: string
  /** Three specific, ordered-by-cost failure modes. */
  mistakes: string[]
}

export const QUESTION_TYPE_DETAIL: Record<QuestionType, QuestionTypeDetail> = {
  'read-aloud': {
    what: 'A short text appears on screen with an audio recording of it. You read the text aloud into the microphone while the recording plays.',
    how: 'The recording gives you the pace, the stress and the phrasing, so you are reading along rather than interpreting. There is roughly forty seconds to prepare before the audio begins, and a countdown runs once it starts. You can read any part of the text, in any order, at any speed — the marks come from what you say, not from where you start.',
    scoring:
      'Content is scored by counting errors: each replacement, omission or insertion of a word counts as one. Pearson publishes no error-to-point table, and the widely repeated approximation that the maximum equals the word count is a community rule rather than an official one. Alongside content, the item is rated for pronunciation and oral fluency.',
    mistakes: [
      'Stopping and restarting after a stumble. The error is already counted; silence only adds fluency damage.',
      'Reading at your own speed instead of matching the recording, which throws the stress pattern off.',
      'Silent reading on the preparation countdown, so the first word is already late when the audio starts.',
    ],
  },
  'repeat-sentence': {
    what: 'You hear a sentence read aloud, then repeat it back as closely as you can. The recording plays once only.',
    how: 'There is no preparation time and no visual text, so you are working purely from what you heard. The item is short but it appears ten to twelve times, which makes it the highest-volume speaking item on the test.',
    scoring:
      'Content is scored 0 to 3: 3 for all words in the correct sequence, 2 for at least half, 1 for less than half, 0 for almost nothing. Crucially, hesitations, filled and unfilled pauses, and leading or trailing material are explicitly ignored, so a hesitant but nearly complete repetition outscores a fluent wrong one.',
    mistakes: [
      'Stopping when you lose the thread, when continuing from memory of the start still earns more.',
      'Regrouping on meaning instead of rhythm, which costs more words than any other choice.',
      'Starting to speak before the audio ends and clipping the opening words.',
    ],
  },
  'describe-image': {
    what: 'An image appears — a graph, chart, table, photograph or map — and you have to describe what it shows aloud.',
    how: 'The image is shown before the recording plays and stays on screen while you speak, so you can prepare a structure in advance. You are describing data, not telling a story about it.',
    scoring:
      'Content runs 0 to 6 and covers what the image contains and what it shows. Pronunciation and oral fluency are scored alongside it, but content is where the points are.',
    mistakes: [
      'Starting at the top-left and reading every label, which runs out of time before the trend.',
      'Naming the axis values without saying what they mean.',
      'Describing what the image feels like instead of what it shows.',
    ],
  },
  'retell-lecture': {
    what: 'You hear a short academic lecture, then retell it in your own words. You are given preparation time before the recording plays.',
    how: 'The lecture is the kind delivered to a university audience, and the item is framed as "in your own words" — paraphrase is explicitly permitted and expected. This is one of only eight integrated items on the test, scoring both Listening and Speaking.',
    scoring:
      'Content runs 0 to 6 and rewards the lecture’s argument rather than its vocabulary. Pronunciation and oral fluency are scored with it, and the item contributes to the Listening skill score as well as Speaking.',
    mistakes: [
      'Trying to reproduce the lecturer’s phrasing instead of the argument, which loses content on complex phrasings.',
      'Re-telling sequentially through every example rather than the through-line.',
      'Spending preparation time writing instead of noting three or four keywords.',
    ],
  },
  'answer-short-question': {
    what: 'A short question accompanies a short audio clip, with one- to four-word options. You choose the one that answers it.',
    how: 'These appear in pairs sharing a single recording, and the questions are about gist, inference, purpose or attitude rather than detail. There is no partial credit and no speaking at all — this is the one scored-response item in Part 1 that does not use your voice.',
    scoring:
      'Correct or incorrect, one point each, against a Vocabulary trait of 0 or 1: 1 for appropriate word choice, 0 for inappropriate. There is no partial band, which makes it the least forgiving item in Part 1.',
    mistakes: [
      'Answering the question you expect rather than the one asked.',
      'Choosing on a single keyword match when the option paraphrases the idea.',
      'Leaning towards the longest option, which is often the most qualified-sounding distractor.',
    ],
  },
  'summarize-group-discussion': {
    what: 'You hear a group conversation — typically three speakers plus a facilitator — and then summarise what the group as a whole concluded.',
    how: 'Unlike Re-tell Lecture, you are not summarising one argument. You are summarising a discussion that contains disagreement, and the recording marks each speaker clearly so you can tell them apart.',
    scoring:
      'Content runs 0 to 6 across the group’s overall stance, plus pronunciation and oral fluency. It is an integrated item, so it contributes to Listening as well as Speaking.',
    mistakes: [
      'Summarising the most persuasive speaker rather than the group’s position.',
      'Reporting the disagreement without resolving what the group settled on.',
      'Missing a speaker entirely, which leaves a hole in the content.',
    ],
  },
  'respond-to-situation': {
    what: 'A short everyday scenario is described and a prompt appears. You respond aloud as if you were in that situation.',
    how: 'The scenarios are ordinary rather than academic — a phone call, an email, a conversation with a neighbour. You get preparation time, and you may write notes, but the response itself is spoken.',
    scoring:
      'Content runs 0 to 6 on whether the response actually addresses the situation, with pronunciation and oral fluency scored alongside. Content of zero means zero for the item, however well delivered.',
    mistakes: [
      'Answering the underlying topic instead of the situation you were put in.',
      'Giving an opinion where the prompt asked for a specific piece of information.',
      'Producing one sentence, which caps content well below full marks.',
    ],
  },
  'summarize-written-text': {
    what: 'A short paragraph appears with a one-sentence summary prompt. You write exactly one complete sentence summarising it.',
    how: 'You have thirty seconds to read and thirty-five minutes of total section time for two items, so the reading is a genuine sprint. The instruction to write one sentence is a hard constraint, not a guideline.',
    scoring:
      'Form is 0 or 1 — 1 for a single complete sentence, 0 for anything else — and a form of 0 scores the whole item at zero regardless of what you wrote. Content runs 0 to 4, with grammar and vocabulary scored alongside.',
    mistakes: [
      'Writing two sentences, which takes form to 0 and zeroes the entire item.',
      'Copying a sentence from the passage instead of summarising it.',
      'Falling outside 5 to 75 words, which also scores form 0.',
    ],
  },
  'write-essay': {
    what: 'A prompt gives you a situation to discuss and an opinion to defend. You write a discursive essay of 200 to 300 words in twenty minutes.',
    how: 'This is the only constructed-response item in the whole test and the only one that scores Writing without a companion skill. You get twenty minutes, which is generous for the length, but there is no second chance to restructure.',
    scoring:
      'The widest trait set on the test: content, form, development/structure/coherence, general linguistic range, vocabulary range, spelling and grammar. Form is the 0/1/2 band Pearson publishes — 2 at 200 to 300 words, 1 at 120 to 199 or 301 to 380, and 0 outside that — and this app applies it as a weight of 1.0, 0.5 or 0 on the item, which is why your report shows the essay out of one point. Form 0 zeroes the entire essay, and all caps, no punctuation or a list of bullets are form 0 however long the essay is.',
    mistakes: [
      'Running under 120 words, which zeroes everything else you earned.',
      'Listing arguments without developing any of them, which costs coherence as well as content.',
      'Reusing one idea twice in different words instead of adding a second.',
    ],
  },
  'fill-in-blanks-dropdown': {
    what: 'You read a passage with gaps and choose from word lists shown beside each gap. Every gap is a dropdown.',
    how: 'The dropdowns offer more options than there are blanks, so the lists are deliberately over-supplied. This is a vocabulary-in-context item, and you need to have read the surrounding sentence before you can narrow anything.',
    scoring:
      'One point per blank completed correctly, with no penalty for the ones you get wrong. Every blank is independent, so partial credit is the default rather than an exception.',
    mistakes: [
      'Eliminating options purely by part of speech and missing the one constraint the grammar imposes.',
      'Working gap by gap without reading the passage at least once first.',
      'Assuming a repeated word cannot be used twice — the lists often reuse words legitimately.',
    ],
  },
  'fill-in-blanks-table': {
    what: 'A passage is paired with a table or grid containing gaps, and you fill each one with a word or number from the text.',
    how: 'Because the blanks sit in a grid, the completed row has to read correctly as a unit — the table imposes constraints the prose alone does not. Pearson presents this variant as drag-and-drop in the current guide; this practice tool uses text inputs so the answer can be typed and reviewed.',
    scoring:
      'One point per blank filled correctly, no negative marking. As with the dropdown version, each blank stands alone.',
    mistakes: [
      'Reading across a row and filling it before reading the passage, which guarantees gaps.',
      'Missing that a cell needs a number rather than a noun because the column heading changed.',
      'Leaving a blank because the word seems obvious, when the obvious word is a distractor.',
    ],
  },
  'multiple-choice-single': {
    what: 'You read a passage and answer one question with a single correct option out of four.',
    how: 'Two of the four options are designed to be plausible on a fast read. The item rewards reading for the detail the question actually asks about, not for general comprehension.',
    scoring:
      'Correct or incorrect, one point, with no partial credit. Because there is no partial band, a rushed guess and a considered answer are worth exactly the same.',
    mistakes: [
      'Answering the most recently mentioned idea rather than the one asked about.',
      'Selecting an option that is true of the passage but does not answer the question.',
      'Running out of time and guessing without rejecting the two plausible options.',
    ],
  },
  'multiple-choice-multiple': {
    what: 'You read a passage and select every option that applies, out of four.',
    how: 'The prompt states how many options to choose, and choosing the stated number does not guarantee they are the right ones. This is the only Reading item carrying negative marking.',
    scoring:
      'One point per correct option selected, minus one per incorrect option, floored at zero. One wrong selection cancels a correct one, which makes this the highest-variance Reading item.',
    mistakes: [
      'Selecting an option that is accurate but not supported by the passage.',
      'Selecting the stated number of options purely because the prompt asked for that many.',
      'Leaving the fourth option unconsidered, which is where the second correct answer usually is.',
    ],
  },
  'reorder-paragraphs': {
    what: 'The paragraphs of a text are shown in scrambled order, and you drag them into the correct sequence.',
    how: 'Texts are short — typically three to five sentences. Because you are rearranging whole sentences rather than words, the deciding evidence is usually a pronoun or a conjunction that points backwards or forwards.',
    scoring:
      'One point per correctly ordered adjacent pair, and N boxes yield N minus 1 points, so four boxes are worth three. There is no negative marking, and Pearson publishes no worked example, so this derivation is arithmetic from the published rule.',
    mistakes: [
      'Chasing every pronoun at once and getting stuck on the first two boxes.',
      'Ordering by topic similarity, which puts related sentences next to each other but in the wrong sequence.',
      'Settling for a plausible order rather than checking which sentence must come first.',
    ],
  },
  'summarize-spoken-text': {
    what: 'You hear a short academic passage — often a lecture introduction — and write a 50 to 70 word summary.',
    how: 'You have a short preparation window before the audio, and you may take notes. This is the only written response in the Listening section, and it is the only item there that scores Writing.',
    scoring:
      'Form is the 0/1/2 band Pearson publishes — 2 at 50 to 70 words, 1 at 40 to 49 or 71 to 100, and 0 outside that — applied here as a weight of 1.0, 0.5 or 0 on the item. Form 0 zeroes the whole item, and all caps, no punctuation or a list of bullets are form 0 at any length. Content runs 0 to 4, with grammar, vocabulary and spelling scored alongside.',
    mistakes: [
      'Dropping to 39 words while trying to be precise, losing all form points.',
      'Writing the summary as a list, which the form band treats as zero.',
      'Transcribing rather than summarising, which never fits the word limit.',
    ],
  },
  'fill-in-blanks-listening': {
    what: 'You hear a recording and type the missing words into gaps in a transcript that appears on screen.',
    how: 'The gaps show you the grammar around them before you hear the audio, so you can predict word class and number first. The audio plays once, though the transcript means you never have to write what you hear elsewhere.',
    scoring:
      'One point per word filled in correctly, with no deduction for the ones you miss. The guide describes a point per word spelled correctly; because you only supply the blank words, the unit you control is the blank.',
    mistakes: [
      'Leaving a gap blank after the audio, when a plausible word still scores if it is right.',
      'Transcribing the surrounding words as well and losing time.',
      'Missing the plural or third-person ending that the gap’s grammar already implied.',
    ],
  },
  'highlight-correct-summary': {
    what: 'You hear a recording and are shown several paragraph summaries. You select the one that correctly summarises what was said.',
    how: 'Exactly one summary is correct. The incorrect ones are built from real-sounding material lifted from the recording, so they are defeated by attention rather than by elimination of the obviously wrong.',
    scoring:
      'Correct or incorrect, one point, with no partial credit. Because there is no partial band, a summary that is 95 per cent right scores the same as one that is random.',
    mistakes: [
      'Choosing the longest summary, which is usually the one carrying the most invented detail.',
      'Picking a summary that matches something you remember hearing without checking it against the whole recording.',
      'Eliminating one at a time instead of comparing them side by side.',
    ],
  },
  'listening-multiple-choice-single': {
    what: 'You hear a recording and answer one multiple-choice question with a single correct option.',
    how: 'The options appear before the audio plays, which is unusual and useful — it tells you what to listen for. Questions cover detail, inference, purpose and attitude.',
    scoring: 'Correct or incorrect, one point, with no partial credit.',
    mistakes: [
      'Choosing before the audio finishes, on the strength of the first matching phrase.',
      'Missing the distractor that restates the recording almost exactly but changes one word’s meaning.',
      'Skipping the options to read the passage instead, which is not available on this section.',
    ],
  },
  'listening-multiple-choice-multiple': {
    what: 'You hear a recording and select every option that applies, out of four.',
    how: 'As with the Reading version you must decide how many to select, and the stated number is a guide rather than an answer. Multiple speakers or a change of opinion are common, so track who is speaking.',
    scoring:
      'One point per correct option, minus one per incorrect option, floored at zero. One wrong selection can take the entire item to zero, which makes this the riskiest item in the Listening section.',
    mistakes: [
      'Selecting an option that was true earlier in the recording but is contradicted later.',
      'Confusing two speakers’ positions in a multi-voice discussion.',
      'Adding a fourth option because the prompt implies four.',
    ],
  },
  'select-missing-word': {
    what: 'A recording plays with a short beep marking where a word is missing. You choose the word that completes it from four options.',
    how: 'The options are built as near-homophones, so they are distinguished by stress pattern and by what the grammar around the gap allows, not by meaning alone. Each word plays only within its own recording.',
    scoring: 'Correct or incorrect, one point, with no partial credit.',
    mistakes: [
      'Choosing on meaning when the distractors are all grammatical, leaving nothing to separate them.',
      'Missing the stress pattern difference that is the actual discriminator.',
      'Rushing to answer before the word before the gap has finished, which cues the ending.',
    ],
  },
  'highlight-incorrect-words': {
    what: 'You hear a recording and see a transcript with roughly one word wrong per sentence. You highlight the incorrect words.',
    how: 'The errors are the kinds a second language makes — article choice, plural endings, wrong verb form — and they appear in both a short and a longer passage. Highlighting is done by clicking words in sequence.',
    scoring:
      'One point per correctly highlighted word, minus one per word highlighted wrongly, floored at zero. This is one of only three items on the whole test that carries negative marking.',
    mistakes: [
      'Highlighting a word that is grammatically odd but genuinely in the recording.',
      'Missing an error because the sentence sounded fluent, which is the point of the distractor.',
      'Continuing to hunt after a long clean stretch, since errors are unevenly spaced.',
    ],
  },
  'write-from-dictation': {
    what: 'You hear a recording and write down exactly what is said.',
    how: 'These are the final items in the Listening section, there is no preparation time, and you may take notes. Nothing is corrected or paraphrased — the transcription must match.',
    scoring:
      'One point per word spelled correctly, with no deduction for the words you miss. Words are matched on their own, ignoring capitalisation and surrounding punctuation, so typing in the wrong case or omitting the final full stop does not cost you a word — the words themselves do.',
    mistakes: [
      'Correcting what you hear into grammatical English, which is exactly wrong here.',
      'Dropping the final word or two as the recording ends.',
      'Leaving a gap instead of writing an approximation, when a close spelling would still score.',
    ],
  },
}

/**
 * A URL-safe, human-readable form of the type key.
 *
 * The keys are already kebab-case and stable, so the slug is simply the key.
 * It is exposed as a function rather than duplicated into the content records so
 * that the blueprint stays the single source of truth for identity.
 */
export function typeSlug(type: QuestionType): string {
  return type
}

/** Reverse lookup used by the spoke route to resolve a slug back to a type. */
export function typeFromSlug(slug: string): QuestionType | undefined {
  return (Object.keys(QUESTION_TYPE_DETAIL) as QuestionType[]).find((t) => typeSlug(t) === slug)
}

/**
 * Spokes that share a section with `type`.
 *
 * Cross-links are derived rather than hand-maintained so that a new type added
 * to the blueprint immediately appears in its neighbours' related lists, and no
 * spoke can end up with no outgoing internal links.
 */
export function relatedTypes(type: QuestionType, limit = 4): QuestionType[] {
  const section = QUESTION_META[type].section
  return (Object.keys(QUESTION_TYPE_DETAIL) as QuestionType[])
    .filter((t) => t !== type && QUESTION_META[t].section === section)
    .slice(0, limit)
}

/** All slugs, in blueprint order — used by the router and the prerender list. */
export const ALL_TYPE_SLUGS: string[] = (Object.keys(QUESTION_TYPE_DETAIL) as QuestionType[]).map(
  typeSlug,
)

const SKILL_LABEL: Record<string, string> = {
  speaking: 'Speaking',
  writing: 'Writing',
  reading: 'Reading',
  listening: 'Listening',
}

/**
 * The three questions a candidate is actually asking when they land on a type
 * page: how many there are, how it is marked, and what goes wrong.
 *
 * This lives here rather than in the SEO module because the answers are shown
 * on the page as well as emitted as `FAQPage` JSON-LD. Google requires marked-up
 * FAQ content to be visible to the user, so a single definition is what keeps
 * the two from diverging.
 */
export function faqForType(type: QuestionType): Array<{ question: string; answer: string }> {
  const meta = QUESTION_META[type]
  const detail = QUESTION_TYPE_DETAIL[type]
  const section = SECTION_META[meta.section]
  const skills = meta.skills.map((s) => SKILL_LABEL[s]).join(' and ')

  return [
    {
      question: `How many ${meta.label} questions are on the PTE Academic?`,
      answer: `A PTE Academic has ${meta.perTest} ${meta.label} items in the ${section.longTitle} section. ${
        meta.skills.length > 1
          ? `Each one is an integrated item, so it counts towards both your ${skills} scores.`
          : `Each one counts towards your ${skills} score.`
      }`,
    },
    {
      question: `How is ${meta.label} scored?`,
      answer: detail.scoring,
    },
    {
      question: `What goes wrong most often on ${meta.label}?`,
      answer: detail.mistakes[0]!,
    },
  ]
}

/**
 * The hub's questions. Counted and phrased against the blueprint rather than
 * typed in, so the "nine / five / eight" split stays true if the blueprint moves.
 */
export const HUB_FAQ: Array<{ question: string; answer: string }> = [
  {
    question: 'How many question types are in the PTE Academic?',
    answer: `There are ${ALL_QUESTION_TYPES.length} question types: ${(
      ['speaking-writing', 'reading', 'listening'] as const
    )
      .map((s) => {
        const n = ALL_QUESTION_TYPES.filter((t) => QUESTION_META[t].section === s).length
        return `${n} in ${SECTION_META[s].longTitle}`
      })
      .join(', ')}. Some are integrated items that score two skills at once.`,
  },
  {
    question: 'Which PTE question types have negative marking?',
    answer:
      'Only three: Multiple Choice (Multiple Answers) in Reading, Multiple Choice (Multiple Answers) in Listening, and Highlight Incorrect Words. Each awards one point per correct option minus one per wrong option, floored at zero. Every other partial-credit type is positive-only.',
  },
  {
    question: 'Do any PTE question types score two skills at once?',
    answer:
      'Yes. Repeat Sentence, Re-tell Lecture and Summarize Group Discussion score Listening and Speaking; Summarize Written Text scores Reading and Writing; Summarize Spoken Text and Write from Dictation score Listening and Writing; Highlight Correct Summary and Highlight Incorrect Words score Listening and Reading.',
  },
]
