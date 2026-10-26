import type { EssayPrompt } from './bank'

/**
 * Eight further Write Essay prompts in current PTE style (two questions per
 * exam, 200–300 words, 20 minutes, free choice of tone).
 *
 * The bank held 8 prompts against 1 per test, so a candidate sitting weekly
 * mocks met repeats within two months. Sixteen doubles that headroom, and the
 * topics mirror what PTE has actually asked since the 2024 change: work and
 * technology, education, cities, health and the environment — always framed
 * as agree/disagree or discussion with room for examples either way, never as
 * a question with a factually correct answer.
 */
export const EXTRA_ESSAY_PROMPTS: EssayPrompt[] = [
  {
    id: 'we-9',
    source: 'real-world',
    stimulus: 'Remote and hybrid working.',
    question:
      'Working from home has improved productivity and work-life balance for most employees. To what extent do you agree or disagree?',
    keyTerms: [
      'remote',
      'productivity',
      'balance',
      'employees',
      'employers',
      'evidence',
      'flexibility',
      'costs',
    ],
    minWords: 200,
    maxWords: 300,
  },
  {
    id: 'we-10',
    source: 'real-world',
    stimulus: 'Artificial intelligence in schools.',
    question:
      'Some people believe that AI tutors should replace some classroom teaching in schools. Do you agree or disagree? Support your argument with relevant examples.',
    keyTerms: [
      'tutors',
      'teaching',
      'schools',
      'learning',
      'teachers',
      'evidence',
      'transfer',
      'technology',
    ],
    minWords: 200,
    maxWords: 300,
  },
  {
    id: 'we-11',
    source: 'real-world',
    stimulus: 'The four-day working week.',
    question:
      'Switching to a four-day working week would benefit both businesses and workers. To what extent do you agree or disagree?',
    keyTerms: [
      'four-day',
      'businesses',
      'workers',
      'productivity',
      'trials',
      'evidence',
      'costs',
      'hours',
    ],
    minWords: 200,
    maxWords: 300,
  },
  {
    id: 'we-12',
    source: 'real-world',
    stimulus: 'Age limits for social media.',
    question:
      'Children under sixteen should be banned from using social media platforms. Do you agree or disagree?',
    keyTerms: [
      'children',
      'social media',
      'ban',
      'harm',
      'evidence',
      'parents',
      'platforms',
      'enforcement',
    ],
    minWords: 200,
    maxWords: 300,
  },
  {
    id: 'we-13',
    source: 'real-world',
    stimulus: 'Charging drivers for road use.',
    question:
      'The fairest way to reduce congestion and pollution in cities is to charge drivers for using busy roads. To what extent do you agree or disagree?',
    keyTerms: [
      'congestion',
      'charging',
      'drivers',
      'pollution',
      'fairness',
      'alternatives',
      'revenue',
      'exemptions',
    ],
    minWords: 200,
    maxWords: 300,
  },
  {
    id: 'we-14',
    source: 'real-world',
    stimulus: 'The cost of university education.',
    question:
      'Higher education should be free for all students, funded entirely by the government. Do you agree or disagree?',
    keyTerms: [
      'university',
      'free',
      'funding',
      'students',
      'government',
      'taxpayers',
      'access',
      'quality',
    ],
    minWords: 200,
    maxWords: 300,
  },
  {
    id: 'we-15',
    source: 'real-world',
    stimulus: 'Tourism in historic cities.',
    question:
      'Popular historic cities should limit the number of tourists allowed each year. To what extent do you agree or disagree?',
    keyTerms: [
      'tourism',
      'limits',
      'historic',
      'residents',
      'economy',
      'heritage',
      'caps',
      'evidence',
    ],
    minWords: 200,
    maxWords: 300,
  },
  {
    id: 'we-16',
    source: 'real-world',
    stimulus: 'A cashless society.',
    question:
      'A society without cash, where all payments are digital, would be better for everyone. Do you agree or disagree? Support your argument with relevant examples.',
    keyTerms: [
      'cashless',
      'digital',
      'payments',
      'inclusion',
      'elderly',
      'privacy',
      'crime',
      'access',
    ],
    minWords: 200,
    maxWords: 300,
  },
]
