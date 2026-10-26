import { ALL_QUESTION_TYPES, QUESTION_META, SECTION_META } from '../domain/blueprint'
import { ABOUT_FAQ, HOME_FAQ } from '../content/faq'
import { typeSlug } from '../content/questionTypeDetail'
import { SITE, type PageMeta } from './site'
import {
  breadcrumbLd,
  faqLd,
  howToLd,
  itemListLd,
  organizationLd,
  webApplicationLd,
} from './structured'
import { QUESTION_TYPE_META } from './questionTypeMeta'

// ---------------------------------------------------------------------------
// Page metadata registry.
//
// This is the single source of truth for every route's head tags. It is plain
// data with no React and no browser APIs, which lets the prerender step build
// the static <head> on the server and lets the client render the same tags —
// guaranteeing that a crawler and a browser see identical metadata.
// ---------------------------------------------------------------------------

// HOME_FAQ is shared with the visible accordion on the landing page.

const FORMAT_FAQ: Array<{ question: string; answer: string }> = [
  {
    question: 'How long is the PTE Academic test?',
    answer: `The PTE Academic is a single computer-based test divided into three timed parts. The current section ranges are Speaking and Writing ${SECTION_META['speaking-writing'].weightNote}, Reading ${SECTION_META.reading.weightNote}, and Listening ${SECTION_META.listening.weightNote}. The minimum and maximum ranges do not add up to a fixed total.`,
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
    question: 'How does PTE Academic compare to IELTS?',
    answer:
      'Pearson publishes an official concordance between PTE Academic (10–90) and IELTS overall bands (1.0–9.0). For example, PTE 50 corresponds to IELTS 6.0, 59 to IELTS 6.5, 66 to IELTS 7.0, and 76 to IELTS 7.5. Universities and visa authorities evaluate candidates against these published concordances.',
  },
  {
    question: 'Does PTE Academic have a passing score?',
    answer:
      'No. There is no pass mark. Each institution sets its own requirement, and for UK student visas the relevant standard is set separately by immigration policy rather than by the test.',
  },
  {
    question: 'How is the overall PTE score calculated?',
    answer:
      'Every item is scored and the result is combined across the four communicative skills — Speaking, Writing, Reading and Listening — into a scaled score from 10 to 90 in 1-point increments. Reading and Listening are scored exactly. Speaking and Writing are scored on content, form, oral fluency, pronunciation and range.',
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
      'Work on the objective items first. Fill in the Blanks and Re-order Paragraphs together account for a large share of the Reading points, they have deterministic answers, and Re-order Paragraphs awards 1 point per correctly ordered adjacent pair. Speaking and writing take longer to move and are easier to leave alone while you build the objective base.',
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

// ABOUT_FAQ is shared with the visible accordion on the about page.

export const PAGE_META: Record<string, PageMeta> = {
  '/': {
    title: 'Free PTE Academic Mock Test — Full-Length Practice',
    description:
      'A free full-length PTE Academic mock: all 22 question types, real section timings, an instant score report with CEFR band, and per-question review.',
    path: '/',
    keywords: ['PTE mock test free', 'PTE practice test with score', 'full PTE mock test online'],
    structuredData: [
      organizationLd(),
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
          {
            name: 'Start a full mock',
            text: 'Open the mock test page and choose a full-length test of all three sections.',
          },
          {
            name: 'Set up audio',
            text: 'Allow playback so the listening recordings can be heard, and optionally allow microphone access for speaking items.',
          },
          {
            name: 'Sit Part 1',
            text: 'Complete Speaking and Writing: read aloud, repeat sentence, describe image, re-tell lecture, answer short question, group discussion, respond to a situation, summarize written text and write essay.',
          },
          {
            name: 'Sit Parts 2 and 3',
            text: 'Complete the Reading section against a single passage, then the Listening section across eight item types.',
          },
          {
            name: 'Read the report',
            text: 'Review the overall score, the four skill scores, the CEFR band and a note explaining where every lost point came from.',
          },
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
          {
            name: 'Choose a length',
            text: 'Pick a full, half or quick test, and exam or practice mode.',
          },
          {
            name: 'Allow audio',
            text: 'Allow playback so the listening recordings can be heard. A microphone improves speaking estimates.',
          },
          {
            name: 'Sit the sections in order',
            text: 'Speaking and Writing, then Reading, then Listening, each against its own timer.',
          },
          {
            name: 'Answer every item',
            text: 'You can flag items and return to them before the section timer ends.',
          },
          {
            name: 'Read the report',
            text: 'Get an overall score, four skill scores, a CEFR band and a per-item breakdown.',
          },
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
    keywords: [
      'PTE speaking practice',
      'PTE writing practice',
      'PTE reading practice',
      'PTE listening practice',
    ],
    structuredData: [
      itemListLd(
        ALL_QUESTION_TYPES.map((t) => ({
          name: QUESTION_META[t].label,
          path: `/question-types/${typeSlug(t)}/`,
        })),
      ),
      breadcrumbLd([
        { name: 'Home', path: '/' },
        { name: 'Practice', path: '/practice/' },
      ]),
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
        description:
          'The current PTE Academic test format with a free practice test for every section.',
        path: '/format/',
      }),
      howToLd({
        name: 'What to expect in the PTE Academic test',
        description:
          'A walkthrough of the three timed sections and the order in which question types appear.',
        steps: (['speaking-writing', 'reading', 'listening'] as const).map((key) => ({
          name: SECTION_META[key].longTitle,
          text: `${SECTION_META[key].weightNote}. ${SECTION_META[key].blurb}`,
        })),
      }),
      itemListLd(
        ALL_QUESTION_TYPES.map((t) => ({ name: QUESTION_META[t].label, path: `/format#${t}` })),
      ),
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
      'How PTE Academic scores work: the 10-90 scale, CEFR bands from B1 to C2, IELTS concordance, university requirements, and how this tool estimates your score.',
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
          'Interpret an official PTE 10-90 score, compare with IELTS concordance bands, and match it to a CEFR level and university requirements.',
        steps: [
          {
            name: 'Read the 10-90 score',
            text: 'Pearson reports a scaled score from 10 to 90 based on the Global Scale of English. Higher is better and the scale has no fixed pass mark.',
          },
          {
            name: 'Compare with IELTS bands',
            text: 'Use Pearson’s published concordance: 47–54 is IELTS 6.0, 55–62 is IELTS 6.5, 63–70 is IELTS 7.0, and 71–78 is IELTS 7.5.',
          },
          {
            name: 'Match it to a CEFR level',
            text: 'Scores from 43 to 58 correspond to B1, 59 to 75 to B2, 76 to 84 to C1, and 85 to 90 to C2.',
          },
          {
            name: 'Check university requirements',
            text: 'Most UK undergraduate courses ask for 50 to 58 (IELTS 6.0–6.5). Taught postgraduate programmes commonly require 59 to 65 (IELTS 6.5–7.0) or 66 to 75 (IELTS 7.0–7.5).',
          },
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
          {
            name: 'Fix the objective items',
            text: 'Fill in the Blanks and Re-order Paragraphs have deterministic answers with partial credit, so improvement here is immediate and measurable.',
          },
          {
            name: 'Practice Repeat Sentence daily',
            text: 'Ten items a day trains listening accuracy, speaking fluency and pronunciation at the same time.',
          },
          {
            name: 'Learn a fixed structure for the essay',
            text: 'Four paragraphs with explicit linking words protect the development and coherence traits under time pressure.',
          },
          {
            name: 'Use a skeleton for Re-tell Lecture and Summarize Group Discussion',
            text: 'Note three or four keywords during playback and re-tell from the skeleton rather than trying to remember sentences.',
          },
          {
            name: 'Sit full mocks under real time pressure',
            text: 'At least every third attempt should be in exam mode, because timing is part of what the test measures.',
          },
        ],
      }),
      itemListLd(
        ALL_QUESTION_TYPES.map((t) => ({ name: QUESTION_META[t].label, path: `/guide#${t}` })),
      ),
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
    title: 'Privacy — Local by Default, Optional Cloud Sync',
    description:
      'Local-first storage with zero tracking. Test attempts and recordings stay in your browser unless you sync to Cloudflare. What is stored and why.',
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

  '/login': {
    title: 'Sign In to PTE Prep — Sync Mock Tests & Scores',
    description: 'Sign in to your PTE Prep account to sync attempts and scores.',
    path: '/login/',
    noindex: true,
  },

  '/register': {
    title: 'Create PTE Prep Account — Sync Mock Tests & Scores',
    description: 'Create a PTE Prep account to sync attempts and scores.',
    path: '/register/',
    noindex: true,
  },

  '/test': {
    title: 'PTE Mock Test in Progress',
    description: 'Your PTE Academic practice test is running.',
    path: '/test/',
    noindex: true,
  },

  // The results page is reached after every finished test, so it needs its own
  // entry. Without one, getPageMeta falls through to notFoundMeta and the
  // client rewrites the tab title to "Page Not Found" on every completed mock.
  // The title matches the prerendered app shell in scripts/prerender.mjs so
  // there is no flicker between the static document and the hydrated one.
  '/result': {
    title: 'Your mock score — PTE Prep',
    description:
      'Your PTE Academic mock score, with per-item feedback, CEFR band and progress history.',
    path: '/result/',
    noindex: true,
  },

  '/reset-password': {
    title: 'Reset Your PTE Prep Password',
    description: 'Enter your new password to reset your PTE Prep account password.',
    path: '/reset-password/',
    noindex: true,
  },

  '/ui-elements': {
    title: 'UI Design System & Components',
    description: 'Component showcase and design tokens for PTE Prep.',
    path: '/ui-elements/',
    noindex: true,
  },
}

export function getPageMeta(pathname: string): PageMeta {
  // Routes are registered with a trailing slash so the static build emits a real
  // directory index at each path. A visitor may still arrive without one, so
  // both forms resolve to the same entry.
  const clean = pathname.replace(/\/+$/, '') || '/'
  const withSlash = clean === '/' ? '/' : `${clean}/`
  return (
    PAGE_META[pathname] ??
    PAGE_META[clean] ??
    PAGE_META[withSlash] ??
    QUESTION_TYPE_META[pathname] ??
    QUESTION_TYPE_META[clean] ??
    QUESTION_TYPE_META[withSlash] ??
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
