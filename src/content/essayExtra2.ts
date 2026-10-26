import type { EssayPrompt } from './bank'

/**
 * Ten further Write Essay prompts in current PTE style (two questions
 * per exam, 200–300 words, 20 minutes, free choice of tone).
 *
 * The bank held sixteen prompts against one per test, so a candidate
 * sitting weekly mocks met repeats within four months. These ten lift
 * the pool to twenty-six and keep to the themes PTE has asked since
 * the 2024 change — environment, health, education, urban life, media,
 * money, work and technology — always framed as agree/disagree or
 * discussion with room for examples either way, never as a question
 * with a factually correct answer.
 */
export const EXTRA_ESSAY_PROMPTS_2: EssayPrompt[] = [
  {
    id: 'we-17',
    source: 'real-world',
    stimulus: 'Single-use plastics.',
    question:
      'Single-use plastics should be banned entirely rather than recycled. To what extent do you agree or disagree?',
    keyTerms: [
      'plastics',
      'ban',
      'recycling',
      'environment',
      'alternatives',
      'consumers',
      'waste',
      'industry',
    ],
    minWords: 200,
    maxWords: 300,
  },
  {
    id: 'we-18',
    source: 'real-world',
    stimulus: 'Sugar taxes and public health.',
    question:
      'Governments should tax sugary drinks to reduce obesity, even though this limits consumer choice. Do you agree or disagree? Support your argument with relevant examples.',
    keyTerms: [
      'sugar',
      'tax',
      'obesity',
      'health',
      'government',
      'consumption',
      'evidence',
      'choice',
    ],
    minWords: 200,
    maxWords: 300,
  },
  {
    id: 'we-19',
    source: 'real-world',
    stimulus: 'School uniforms.',
    question:
      'School uniforms should be abolished because they limit self-expression. To what extent do you agree or disagree?',
    keyTerms: [
      'uniforms',
      'schools',
      'expression',
      'equality',
      'students',
      'discipline',
      'costs',
      'identity',
    ],
    minWords: 200,
    maxWords: 300,
  },
  {
    id: 'we-20',
    source: 'real-world',
    stimulus: 'Car-free city centres.',
    question:
      'Cities should redesign their centres for pedestrians and cyclists rather than for cars. Do you agree or disagree?',
    keyTerms: [
      'pedestrians',
      'cyclists',
      'cars',
      'cities',
      'pollution',
      'health',
      'businesses',
      'transport',
    ],
    minWords: 200,
    maxWords: 300,
  },
  {
    id: 'we-21',
    source: 'real-world',
    stimulus: 'Platform responsibility.',
    question:
      'Social media companies should be held legally responsible for the content their users post. To what extent do you agree or disagree?',
    keyTerms: [
      'platforms',
      'responsibility',
      'content',
      'moderation',
      'users',
      'harm',
      'freedom',
      'regulation',
    ],
    minWords: 200,
    maxWords: 300,
  },
  {
    id: 'we-22',
    source: 'real-world',
    stimulus: 'Pensions and an ageing population.',
    question:
      'Raising the retirement age is the fairest way to fund pensions in an ageing society. Do you agree or disagree? Support your argument with relevant examples.',
    keyTerms: [
      'retirement',
      'pensions',
      'ageing',
      'workers',
      'funding',
      'fairness',
      'health',
      'government',
    ],
    minWords: 200,
    maxWords: 300,
  },
  {
    id: 'we-23',
    source: 'real-world',
    stimulus: 'Diet and climate.',
    question:
      'A vegetarian diet is better for the planet than a meat-based one, and schools should serve only vegetarian meals. To what extent do you agree or disagree?',
    keyTerms: ['vegetarian', 'diet', 'meat', 'planet', 'emissions', 'farming', 'health', 'schools'],
    minWords: 200,
    maxWords: 300,
  },
  {
    id: 'we-24',
    source: 'real-world',
    stimulus: 'Language learning.',
    question:
      'Everyone should learn a second language at school, even in countries where English is widely spoken. To what extent do you agree or disagree?',
    keyTerms: [
      'language',
      'learning',
      'school',
      'benefits',
      'culture',
      'careers',
      'English',
      'opportunity',
    ],
    minWords: 200,
    maxWords: 300,
  },
  {
    id: 'we-25',
    source: 'real-world',
    stimulus: 'Income and well-being.',
    question:
      'Money buys happiness only up to a point, after which more income adds little to well-being. Do you agree or disagree?',
    keyTerms: [
      'money',
      'happiness',
      'income',
      'well-being',
      'spending',
      'security',
      'evidence',
      'satisfaction',
    ],
    minWords: 200,
    maxWords: 300,
  },
  {
    id: 'we-26',
    source: 'real-world',
    stimulus: 'Automation and employment.',
    question:
      'Within a decade, artificial intelligence will eliminate more jobs than it creates. To what extent do you agree or disagree?',
    keyTerms: [
      'automation',
      'jobs',
      'technology',
      'employment',
      'skills',
      'economy',
      'training',
      'risks',
    ],
    minWords: 200,
    maxWords: 300,
  },
]
