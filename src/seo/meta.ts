import { ALL_QUESTION_TYPES, QUESTION_META, SECTION_META } from '../domain/blueprint'
import { SITE, type PageMeta } from './site'
import { breadcrumbLd, faqLd, howToLd, itemListLd, webApplicationLd } from './structured'
import { QUESTION_TYPE_META } from './questionTypeMeta'

// ---------------------------------------------------------------------------
// Page metadata registry.
//
// This is the single source of truth for every route's head tags. It is plain
// data with no React and no browser APIs, which lets the prerender step build
// the static <head> on the server and lets the client render the same tags —
// guaranteeing that a crawler and a browser see identical metadata.
// ---------------------------------------------------------------------------

const HOME_FAQ: Array<{ question: string; answer: string }> = [
  {
    question: 'Is this PTE mock test really free?',
    answer:
      'Yes. There is no account, no trial, no payment step and no limit on how many mock tests you can take. The whole test runs in your browser, which is why there is no per-user server cost to pass on.',
  },
  {
    question: 'How accurate are the scores produced here?',
    answer:
      'Objective items — multiple choice, fill in the blanks, re-order paragraphs — are scored exactly. Speaking and writing responses are scored with a transparent rubric covering content, form, oral fluency and pronunciation, using the same four PTE constructs. Those are estimates for practice, not official Pearson scores, and the results page labels every item as either auto-scored or estimated.',
  },
  {
    question: 'Do I need a microphone?',
    answer:
      'No. Every speaking item can be answered by typing. A microphone improves the fluency and pronunciation estimate, and browsers with speech recognition give a much more accurate content score, but the test is fully usable without one.',
  },
  {
    question: 'How long is a full mock test?',
    answer:
      `A full mock runs three timed sections. The current ranges are Speaking and Writing ${SECTION_META['speaking-writing'].weightNote}, Reading ${SECTION_META.reading.weightNote}, and Listening ${SECTION_META.listening.weightNote}. The actual total varies between test versions.`,
  },
  {
    question: 'Is the practice material the same as the real exam?',
    answer:
      'No real exam material can be reproduced. All passages, lectures and conversations on this site were written specifically for it, at the same B2 to C1 academic level and word counts as the real test, so that timing and difficulty feel comparable.',
  },
  {
    question: 'Does it work offline?',
    answer:
      'Yes. After the first visit the app is cached as an installable app, and the audio is synthesised by your own device rather than streamed, so practice continues with no connection at all.',
  },
]

const FORMAT_FAQ: Array<{ question: string; answer: string }> = [
  {
    question: 'How long is the PTE Academic test?',
    answer:
      `The PTE Academic is a single computer-based test divided into three timed parts. The current section ranges are Speaking and Writing ${SECTION_META['speaking-writing'].weightNote}, Reading ${SECTION_META.reading.weightNote}, and Listening ${SECTION_META.listening.weightNote}. The minimum and maximum ranges do not add up to a fixed total.`,
  },
  {
    question: 'How many questions are in the PTE Academic?',
    answer:
      'The exact number varies slightly between versions because each version is balanced for total length. A full-length test typically contains around 70 to 90 scored items spread across 22 question types, plus an unscored personal introduction at the start.',
  },
  {
    question: 'What are the recent changes to the PTE Academic?',
    answer:
      'Pearson added two new item types in August 2025: Summarize Group Discussion, which asks you to listen to a multi-speaker exchange and give an oral summary, and Respond to a Situation, which asks for a spoken response to a described context. The format is now nine Speaking and Writing types, five Reading types and eight Listening types.',
  },
  {
    question: 'Is the PTE computer-delivered?',
    answer:
      'Yes. It is delivered on computer at a test centre. You use a headset with a microphone, a keyboard and a screen. Speaking tasks require you to say your answer aloud while reading a prompt that appears on screen.',
  },
  {
    question: 'Do you get a break between sections?',
    answer:
      'There is no scheduled break. The three parts run one after another, and the clock for each part starts as soon as you begin it. Section introductions are shown on screen and count towards the time.',
  },
]

const SCORING_FAQ: Array<{ question: string; answer: string }> = [
  {
    question: 'What is a good PTE score?',
    answer:
      'For most undergraduate UK university applications, 50 to 60 is the usual requirement, with many courses asking for 59 to 63. Taught postgraduate and professional programmes commonly ask for 60 to 70. Competitive subjects such as medicine and law frequently require 70 or above.',
  },
  {
    question: 'What is the difference between the PTE 10-90 and 60-120 scales?',
    answer:
      'They are the same score expressed twice. The 10 to 90 scale is the one Pearson reports; the 60 to 120 scale is simply the same number with 50 added. A score of 63 out of 90 is 113 out of 120.',
  },
  {
    question: 'Does PTE Academic have a passing score?',
    answer:
      'No. There is no pass mark. Each institution sets its own requirement, and for UK student visas the relevant standard is set separately by immigration policy rather than by the test.',
  },
  {
    question: 'How is the overall PTE score calculated?',
    answer:
      'Every item is scored and the result is combined across the four communicative skills — Speaking, Writing, Reading and Listening — into a scaled score from 10 to 90 in half-point increments. Reading and Listening are scored exactly. Speaking and Writing are scored on content, form, oral fluency, pronunciation and range.',
  },
  {
    question: 'How long is a PTE score valid?',
    answer:
      'Pearson test results are valid for two years from the test date. Most institutions require results that are no more than two years old at the point of application.',
  },
  {
    question: 'Can I retake the PTE Academic?',
    answer:
      'Yes, but you can only book one test at a time. If you sit the test and do not achieve the score you need, you must wait for your results before booking another attempt.',
  },
]

const GUIDE_FAQ: Array<{ question: string; answer: string }> = [
  {
    question: 'How do I get a higher PTE score in the shortest time?',
    answer:
      'Work on the objective items first. Fill in the Blanks and Re-order Paragraphs together account for a large share of the Reading and Part 1 points, they have deterministic answers, and Re-order Paragraphs carries no partial credit, so every mark gained is a full mark. Speaking and writing take longer to move and are easier to leave alone while you build the objective base.',
  },
  {
    question: 'Is it better to guess on multiple choice?',
    answer:
      'On single-answer multiple choice, always answer — an unanswered question is worth nothing. On multiple-answer questions, points are deducted for wrong selections, so guess only after you have eliminated. In practice, a candidate who has narrowed to two options should choose both only when they are genuinely confident in both.',
  },
  {
    question: 'How should I prepare for Repeat Sentence?',
    answer:
      'Chunk each sentence into groups of three to five words and shadow the audio as you listen. The recordings contain the sentence once at natural speed, so the preparation has to happen during playback, not after it. Practising ten items a day for two weeks moves this type more than any other single activity.',
  },
  {
    question: 'What is the most common mistake on the PTE essay?',
    answer:
      'Spending the whole twenty minutes planning, or writing fewer than 200 words. The essay is scored on content, development and structure, coherence, and general linguistic range. A clear four-paragraph structure with linked sentences protects two of those four traits even when the argument is not especially original.',
  },
  {
    question: 'Do I need to practise the two newest question types?',
    answer:
      'Yes. Summarize Group Discussion and Respond to a Situation are part of the current format and appear in the Speaking and Writing section. Summarize Group Discussion is scored on oral fluency, pronunciation and content, so the technique is the same as Re-tell Lecture at a larger scale: capture the skeleton, not the details.',
  },
  {
    question: 'Should I use the full two hours or is practice mode fine?',
    answer:
      'Use practice mode while you are learning question types, because it shows transcripts, tips and replays. Use exam conditions for at least every third attempt, because the thing being tested includes the clock and the fact that you cannot rewind the audio.',
  },
]

const ABOUT_FAQ: Array<{ question: string; answer: string }> = [
  {
    question: 'Is this site affiliated with Pearson?',
    answer:
      'No. PTE Academic is a trademark of Pearson Education Ltd, and this is an independent practice tool with no affiliation, endorsement or sponsorship. It is not a source of official practice material.',
  },
  {
    question: 'Where does the practice material come from?',
    answer:
      'Every passage, lecture, conversation and chart on this site was written specifically for it, at the same academic level, word count and style as the real test. That avoids copyright problems and means the difficulty and timing are deliberately calibrated.',
  },
  {
    question: 'Where is my data stored?',
    answer:
      'In your browser, on your own device, using IndexedDB. Your responses, recordings and score history never leave the machine. There is no account, no server-side database and no analytics on your answers. Clearing site data in your browser deletes everything.',
  },
  {
    question: 'Is it really free, and why?',
    answer:
      'Yes, with no limits. The whole test runs client-side, which means there is no per-user infrastructure cost to pass on, so a free hosting tier covers it indefinitely. The audio is synthesised by your own device rather than streamed from a server, which is the main reason there is no audio hosting cost either.',
  },
  {
    question: 'Can I use this offline?',
    answer:
      'Yes. The app is cached as an installable progressive web app, and the recordings are generated locally by the speech synthesiser built into macOS, Windows, iOS and Android. Once the page has loaded once, it works with no connection at all.',
  },
  {
    question: 'Why are the scores only estimates?',
    answer:
      'Objective items are scored exactly. Speaking and writing are scored by Pearson using a proprietary automated model, with human reviewers used to quality-monitor it, which cannot be reproduced outside their scoring system — so this site applies a documented rubric over the same four PTE constructs. Every result is labelled as an estimate, and each item is marked as auto-scored or estimated.',
  },
]

export const PAGE_META: Record<string, PageMeta> = {
  '/': {
    title: 'Free PTE Academic Mock Test — Full-Length Practice',
    description:
      'A free full-length PTE Academic mock: all 22 question types, real section timings, an instant score report with CEFR band, and per-question review.',
    path: '/',
    keywords: ['PTE mock test free', 'PTE practice test with score', 'full PTE mock test online'],
    structuredData: [
      webApplicationLd({
        name: 'PTE Prep — Free PTE Academic Mock Tests',
        description: SITE.description,
        path: '/',
      }),
      howToLd({
        name: 'How to take a full PTE Academic mock test',
        description:
          'Five steps to sit a realistic PTE Academic practice test and get a scored report with per-item feedback.',
        steps: [
          { name: 'Start a full mock', text: 'Open the mock test page and choose a full-length test of all three sections.' },
          { name: 'Set up audio', text: 'Allow playback so the listening recordings can be heard, and optionally allow microphone access for speaking items.' },
          { name: 'Sit Part 1', text: 'Complete Speaking and Writing: read aloud, repeat sentence, describe image, re-tell lecture, answer short question, group discussion, respond to a situation, summarize written text and write essay.' },
          { name: 'Sit Parts 2 and 3', text: 'Complete the Reading section against a single passage, then the Listening section across eight item types.' },
          { name: 'Read the report', text: 'Review the overall score, the four skill scores, the CEFR band and a note explaining where every lost point came from.' },
        ],
      }),
      faqLd(HOME_FAQ),
      breadcrumbLd([{ name: 'Home', path: '/' }]),
    ],
  },

  '/mock': {
    title: 'Free PTE Mock Test — Start a Full-Length Practice',
    description:
      'Start a free PTE Academic mock test. Choose full, half or quick length, pick exam or practice mode, and get a timed test with all 22 types.',
    path: '/mock/',
    keywords: ['start PTE mock test', 'PTE full mock test free', 'timed PTE practice'],
    structuredData: [
      webApplicationLd({
        name: 'PTE Prep — Free PTE Academic Mock Test',
        description:
          'A full-length PTE Academic practice test with real section timings, all 22 question types and an instant score report.',
        path: '/mock/',
      }),
      howToLd({
        name: 'How to take a PTE Academic mock test',
        description:
          'Set up a realistic timed PTE Academic practice test and get a scored report with per-item feedback.',
        steps: [
          { name: 'Choose a length', text: 'Pick a full, half or quick test, and exam or practice mode.' },
          { name: 'Allow audio', text: 'Allow playback so the listening recordings can be heard. A microphone improves speaking estimates.' },
          { name: 'Sit the sections in order', text: 'Speaking and Writing, then Reading, then Listening, each against its own timer.' },
          { name: 'Answer every item', text: 'You can flag items and return to them before the section timer ends.' },
          { name: 'Read the report', text: 'Get an overall score, four skill scores, a CEFR band and a per-item breakdown.' },
        ],
      }),
      breadcrumbLd([
        { name: 'Home', path: '/' },
        { name: 'Mock tests', path: '/mock/' },
      ]),
    ],
  },

  '/practice': {
    title: 'PTE Practice by Skill — Every Question Type',
    description:
      'Practice individual PTE Academic skills and question types. Choose a skill, pick the exact types you struggle with, and get instant per-item feedback.',
    path: '/practice/',
    keywords: ['PTE speaking practice', 'PTE writing practice', 'PTE reading practice', 'PTE listening practice'],
    structuredData: [
      itemListLd(ALL_QUESTION_TYPES.map((t) => ({ name: QUESTION_META[t].label, path: `/practice?type=${t}` }))),
    ],
  },

  '/format': {
    title: 'PTE Academic Test Format — 22 Types and Timings',
    description:
      'The complete PTE Academic test format: three timed sections, all 22 question types with counts and time limits, the 2025 changes, and how scoring works.',
    path: '/format/',
    keywords: [
      'PTE test format',
      'PTE Academic question types',
      'PTE Academic 2026',
      'PTE test sections',
      'PTE timing',
      'PTE test structure',
    ],
    structuredData: [
      webApplicationLd({
        name: 'PTE Academic Test Format Guide and Mock Tests',
        description: 'The current PTE Academic test format with a free practice test for every section.',
        path: '/format/',
      }),
      howToLd({
        name: 'What to expect in the PTE Academic test',
        description: 'A walkthrough of the three timed sections and the order in which question types appear.',
        steps: (['speaking-writing', 'reading', 'listening'] as const).map((key) => ({
          name: SECTION_META[key].longTitle,
          text: `${SECTION_META[key].weightNote}. ${SECTION_META[key].blurb}`,
        })),
      }),
      itemListLd(ALL_QUESTION_TYPES.map((t) => ({ name: QUESTION_META[t].label, path: `/format#${t}` }))),
      faqLd(FORMAT_FAQ),
      breadcrumbLd([
        { name: 'Home', path: '/' },
        { name: 'PTE test format', path: '/format/' },
      ]),
    ],
  },

  '/scoring': {
    title: 'PTE Score Guide — Scale, CEFR Bands and Requirements',
    description:
      'How PTE Academic scores work: the 10-90 and 60-120 scales, CEFR bands from B1 to C2, what universities require, and how this tool estimates your score.',
    path: '/scoring/',
    keywords: [
      'PTE score',
      'PTE score chart',
      'PTE 60 70 score',
      'PTE CEFR',
      'PTE passing score',
      'what is a good PTE score',
    ],
    structuredData: [
      howToLd({
        name: 'How to read a PTE Academic score',
        description:
          'Interpret a PTE score, convert between the 10-90 and 60-120 scales, and match it to a CEFR band and university requirements.',
        steps: [
          { name: 'Read the 10-90 score', text: 'Pearson reports a scaled score from 10 to 90 in half-point increments. Higher is better and the scale has no pass mark.' },
          { name: 'Convert to the 60-120 scale', text: 'Add 50 to the 10-90 score. A 63 out of 90 is the same result as 113 out of 120.' },
          { name: 'Match it to a CEFR band', text: 'Scores from 46 to 70 correspond to B2, 71 to 80 to C1, and 81 to 90 to C2. Below 46 sits at B1 or lower.' },
          { name: 'Check the requirement', text: 'Most UK undergraduate courses ask for 50 to 60 on the 60-120 scale. Postgraduates and professional programmes usually ask for 60 to 70.' },
        ],
      }),
      faqLd(SCORING_FAQ),
      breadcrumbLd([
        { name: 'Home', path: '/' },
        { name: 'PTE scoring', path: '/scoring/' },
      ]),
    ],
  },

  '/guide': {
    title: 'PTE Academic Tips — All 22 Question Types',
    description:
      'Practical strategies for every PTE question type, plus the habits that raise a score fastest: read aloud, repeat sentence, re-order, the essay.',
    path: '/guide/',
    keywords: [
      'PTE tips',
      'PTE strategies',
      'how to improve PTE score',
      'PTE repeat sentence tips',
      'PTE essay tips',
      'PTE re-order paragraphs',
    ],
    structuredData: [
      howToLd({
        name: 'How to raise a PTE Academic score',
        description:
          'A practical sequence of improvements that move a PTE score the most for the least study time.',
        steps: [
          { name: 'Fix the objective items', text: 'Fill in the Blanks and Re-order Paragraphs have deterministic answers and no partial credit, so improvement here is immediate and measurable.' },
          { name: 'Practice Repeat Sentence daily', text: 'Ten items a day trains listening accuracy, speaking fluency and pronunciation at the same time.' },
          { name: 'Learn a fixed structure for the essay', text: 'Four paragraphs with explicit linking words protect the development and coherence traits under time pressure.' },
          { name: 'Use a skeleton for Re-tell Lecture and Summarize Group Discussion', text: 'Note three or four keywords during playback and re-tell from the skeleton rather than trying to remember sentences.' },
          { name: 'Sit full mocks under real time pressure', text: 'At least every third attempt should be in exam mode, because timing is part of what the test measures.' },
        ],
      }),
      itemListLd(ALL_QUESTION_TYPES.map((t) => ({ name: QUESTION_META[t].label, path: `/guide#${t}` }))),
      faqLd(GUIDE_FAQ),
      breadcrumbLd([
        { name: 'Home', path: '/' },
        { name: 'PTE tips', path: '/guide/' },
      ]),
    ],
  },

  '/about': {
    title: 'About This PTE Practice Tool — Free and Private',
    description:
      'What this PTE Academic practice tool is, where the material comes from, how your data is handled, why it is free, and exactly how the scores are estimated.',
    path: '/about/',
    keywords: ['PTE practice tool', 'free PTE practice', 'PTE privacy'],
    structuredData: [
      faqLd(ABOUT_FAQ),
      breadcrumbLd([
        { name: 'Home', path: '/' },
        { name: 'About', path: '/about/' },
      ]),
    ],
  },

  '/privacy/': {
    title: 'Privacy — No Data Leaves Your Device',
    description:
      'No server database, no account, no analytics. Attempts, recordings and scores stay in your browser. What is stored, what is not, and why there is no cookie banner.',
    path: '/privacy/',
    keywords: ['PTE practice privacy', 'does this site track me', 'no data collection'],
    structuredData: [
      breadcrumbLd([
        { name: 'Home', path: '/' },
        { name: 'Privacy', path: '/privacy/' },
      ]),
    ],
  },

  '/dashboard': {
    title: 'Your PTE Progress',
    description: 'Your PTE Academic practice history and score trends.',
    path: '/dashboard/',
    noindex: true,
  },

  '/test': {
    title: 'PTE Mock Test in Progress',
    description: 'Your PTE Academic practice test is running.',
    path: '/test',
    noindex: true,
  },

  '/result': {
    title: 'Your PTE Mock Test Result',
    description: 'Score report for your PTE Academic practice test.',
    path: '/result',
    noindex: true,
  },
}

/** Metadata for a pathname, falling back to the not-found page. */
export function getPageMeta(pathname: string): PageMeta {
  // Routes are registered with a trailing slash so the static build emits a real
  // directory index at each path. A visitor may still arrive without one, so
  // both forms resolve to the same entry.
  const clean = pathname.replace(/\/+$/, '') || '/'
  return (
    PAGE_META[pathname] ??
    PAGE_META[clean] ??
    QUESTION_TYPE_META[pathname] ??
    QUESTION_TYPE_META[clean] ??
    notFoundMeta(pathname)
  )
}

export function notFoundMeta(pathname: string): PageMeta {
  return {
    title: 'Page Not Found',
    description: 'That page does not exist. Start a free PTE Academic mock test instead.',
    path: pathname,
    noindex: true,
  }
}

export { HOME_FAQ, FORMAT_FAQ, SCORING_FAQ, GUIDE_FAQ, ABOUT_FAQ, QUESTION_TYPE_META }
