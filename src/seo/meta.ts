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
      'The exact number varies between versions. Pearson states that a full PTE Academic test contains 65 to 75 scored questions across 22 question types, plus an unscored personal introduction at the start.',
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
      'Pearson combines item results across Speaking, Writing, Reading and Listening into a 10–90 scaled score. Some objective item rules are published; constructed responses use task-specific traits, and the scaling model is proprietary.',
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
      'Start with your own results: choose question types where you are losing points, then use focused drills to practise them. Objective items have answer-key scoring; constructed speaking and writing responses use practice estimates. Re-order Paragraphs awards one point per correctly ordered adjacent pair.',
  },
  {
    question: 'Is it better to guess on multiple choice?',
    answer:
      'On single-answer multiple choice, an unanswered question earns no points. Multiple-answer questions deduct a point for each incorrect selection, so select options supported by the passage or recording and avoid unsupported guesses.',
  },
  {
    question: 'How should I prepare for Repeat Sentence?',
    answer:
      'Listen for meaningful groups of words, then reproduce the sentence after the recording ends. Review which words you missed and use that pattern to guide your next practice session.',
  },
  {
    question: 'What is the most common mistake on the PTE essay?',
    answer:
      'Writing fewer than 120 words gives Form zero; 120–199 words falls in the partial-credit band. The essay is scored on task-specific traits, including content, development and structure, coherence, and general linguistic range. A clear structure can help organise your argument, but it cannot guarantee trait scores.',
  },
  {
    question: 'Do I need to practise the two newest question types?',
    answer:
      'Yes. Summarize Group Discussion and Respond to a Situation are part of the current format. Summarize Group Discussion contributes to Listening and Speaking and is rated on task-specific traits; practise identifying the main ideas and expressing them clearly.',
  },
  {
    question: 'Should I use the full two hours or is practice mode fine?',
    answer:
      'Practice mode is useful while learning a question type because it can show transcripts, tips and replays. Full mocks let you practise pacing across sections and listening without replay; choose either format based on what you want to work on.',
  },
]

// ABOUT_FAQ is shared with the visible accordion on the about page.

export const PAGE_META: Record<string, PageMeta> = {
  '/': {
    title: 'Free PTE Academic Mock Test — Full-Length Practice',
    description:
      'A free full-length PTE Academic mock with all 22 question types, real section timings, an estimated practice score with CEFR band, and per-question review.',
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
            text: 'Review the estimated practice scores, CEFR band and item-level feedback explaining where points were lost.',
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
          'A full-length PTE Academic practice test with real section timings, all 22 question types and an estimated practice score report.',
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
      'Practical strategies for all 22 PTE question types, flexible response outlines, and ways to plan focused practice using your results.',
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
        name: 'How to plan PTE Academic practice',
        description:
          'Use practice results to choose task types, review scoring rules, and plan focused drills or full mocks.',
        steps: [
          {
            name: 'Review your results by question type',
            text: 'Choose a task type where your practice results show room to improve, then use a focused drill to work on it.',
          },
          {
            name: 'Practise Re-order Paragraphs',
            text: 'Check references, sequence markers and links between adjacent paragraphs. Correct adjacent pairs earn partial credit.',
          },
          {
            name: 'Practise Repeat Sentence',
            text: 'Listen for meaningful groups of words and repeat the sentence after the recording ends. Review missed words.',
          },
          {
            name: 'Organise essay ideas around the prompt',
            text: 'A flexible outline can help organise an argument, but it cannot guarantee trait scores. Use relevant examples in your own words.',
          },
          {
            name: 'Choose a full mock or a focused drill',
            text: 'Full mocks provide practice pacing across sections; focused drills let you work on a particular task type.',
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
