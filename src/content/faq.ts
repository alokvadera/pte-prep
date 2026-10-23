/**
 * Shared FAQ copy.
 *
 * The same arrays feed the visible accordions and the structured-data FAQ
 * blocks in `seo/meta.ts`. Keeping one source means a claim fixed on the page
 * cannot remain stale in the markup search engines read.
 */
export interface FaqEntry {
  question: string
  answer: string
}

export const HOME_FAQ: FaqEntry[] = [
  {
    question: 'Is this PTE mock test really free?',
    answer:
      'Yes. There is no account needed to start, no trial, no payment step and no limit on how many mock tests you can take. The test runs in your browser, so hosting is primarily static file delivery covered by a free tier; optional cloud sync and bring-your-own-key AI scoring are the only server-backed features. An optional account exists only to sync your history across devices.',
  },
  {
    question: 'How accurate are the scores here?',
    answer:
      'Choice based and text based items are scored exactly against the official keys. Speaking and writing are scored with an open rubric covering content, form, fluency and pronunciation, using the same four constructs as the real test. Those are practice estimates, not official Pearson scores, and every item on the results page is labelled as auto scored or estimated.',
  },
  {
    question: 'Do I need a microphone?',
    answer:
      'No. Every speaking item can be answered by typing, so you can practice in a quiet room or a library. A microphone improves the fluency and pronunciation estimate, and browsers with speech recognition give a more accurate content score, but the test works fully without one.',
  },
  {
    question: 'How long is a full mock test?',
    answer:
      'A full mock follows the real section order with one running clock per section and no pauses. Timings track the current Pearson ranges, and the setup screen shows the expected length before you start so you can plan around it.',
  },
  {
    question: 'Is this the same material as the real exam?',
    answer:
      'No real exam material can be reproduced. All passages, lectures and conversations here were written for this site at the same academic level and word counts as the real test, so timing pressure and difficulty feel close to test day.',
  },
  {
    question: 'Do I need to create an account?',
    answer:
      'No. Practice, full mocks and score reports work with no sign up. An optional free account syncs your history across devices. If you already have guest attempts on this device, you are asked whether to import them after you sign in; they are never uploaded automatically.',
  },
  {
    question: 'How do I actually improve my score?',
    answer:
      'Sit one full mock and check the breakdown, already ordered by points lost per type. Drill the type at the top, then sit another mock and compare your progress on the dashboard.',
  },
  {
    question: 'Does it work offline?',
    answer:
      'Yes. After the first visit the app is cached. Listening audio is served as static files when online and falls back to on-device speech synthesis when offline, so core practice keeps working with no connection. Speech recognition, cloud sync and AI scoring need a connection when you use them.',
  },
]

export const ABOUT_FAQ: FaqEntry[] = [
  {
    question: 'Is this site affiliated with Pearson?',
    answer:
      'No. PTE Academic is a trademark of Pearson Education Ltd, and this is an independent practice tool with no affiliation, endorsement or sponsorship. It is not a source of official practice material.',
  },
  {
    question: 'Where does the practice material come from?',
    answer:
      'Every passage, lecture, conversation and chart on this site was written specifically for it, at the same academic level, word count and style as the real test. That avoids copyright problems and means the difficulty and timing are deliberately matched to the real test.',
  },
  {
    question: 'Where is my data stored?',
    answer:
      'In your browser, on your own device, using IndexedDB. Your responses, recordings and score history stay on the machine by default, with no analytics on your answers. An optional cloud account can sync copies across devices. Clearing site data in your browser deletes the local copy.',
  },
  {
    question: 'Is it really free, and why?',
    answer:
      'Yes, with no limits. The test runs locally in your browser, so hosting is primarily static file delivery covered by a free tier. Listening audio is served as static files from our origin, with on-device speech synthesis as an offline fallback. Optional cloud sync and bring-your-own-key AI scoring are used only if you choose them.',
  },
  {
    question: 'Can I use this offline?',
    answer:
      'Yes. The app is cached as an installable progressive web app. Listening audio is served as static files when online and falls back to the speech synthesiser built into macOS, Windows, iOS and Android when offline. Once the page has loaded once, core practice works with no connection; browser speech recognition, cloud sync and AI scoring need a connection when you use them.',
  },
  {
    question: 'Why are the scores only estimates?',
    answer:
      'Objective items are scored exactly. Speaking and writing are scored by Pearson using a proprietary automated model, with human reviewers used to quality-monitor it, which cannot be reproduced outside their scoring system — so this site applies a documented rubric over the same four PTE constructs. Every result is labelled as an estimate, and each item is marked as auto-scored or estimated.',
  },
]
