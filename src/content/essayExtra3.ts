import type { EssayPrompt } from './bank'

/**
 * Sixteen further Write Essay prompts in current PTE style (two
 * questions per exam, 200–300 words, 20 minutes, free choice
 * of tone).
 *
 * The pool now stands at twenty-six against one prompt per
 * test, so a candidate sitting weekly mocks still met repeats
 * within six months. These sixteen lift it to forty-two and
 * follow the real exam's topic mix — education and technology
 * first, then government and environment, with media and
 * health — and use all three question shapes PTE rotates:
 * agree/disagree, discuss both views, and causes with
 * solutions. Wording is original throughout; only the themes
 * and formats mirror what the exam has actually asked.
 */
export const EXTRA_ESSAY_PROMPTS_3: EssayPrompt[] = [
  {
    id: 'we-27',
    source: 'real-world',
    stimulus: 'Gender balance in university admissions.',
    question:
      'Universities should admit equal numbers of men and women on every course they offer. To what extent do you agree or disagree?',
    keyTerms: [
      'gender',
      'admissions',
      'universities',
      'equality',
      'students',
      'courses',
      'quotas',
      'balance',
    ],
    minWords: 200,
    maxWords: 300,
  },
  {
    id: 'we-28',
    source: 'real-world',
    stimulus: 'Play and formal schooling.',
    question:
      'Young children learn more through play than they do through formal lessons. To what extent do you agree or disagree?',
    keyTerms: [
      'play',
      'children',
      'learning',
      'schooling',
      'creativity',
      'development',
      'teachers',
      'lessons',
    ],
    minWords: 200,
    maxWords: 300,
  },
  {
    id: 'we-29',
    source: 'real-world',
    stimulus: 'Vocational skills and academic theory.',
    question:
      'Some people believe that schools should focus on practical vocational skills, while others argue that academic theory is more valuable. Discuss both views and give your own opinion.',
    keyTerms: [
      'vocational',
      'skills',
      'academic',
      'theory',
      'schools',
      'careers',
      'practical',
      'knowledge',
    ],
    minWords: 200,
    maxWords: 300,
  },
  {
    id: 'we-30',
    source: 'real-world',
    stimulus: 'Distance learning and face-to-face classes.',
    question:
      'Some people think that distance learning is now as effective as studying in a classroom, while others disagree. Discuss both views and give your own opinion.',
    keyTerms: [
      'distance',
      'learning',
      'classroom',
      'students',
      'technology',
      'interaction',
      'courses',
      'flexibility',
    ],
    minWords: 200,
    maxWords: 300,
  },
  {
    id: 'we-31',
    source: 'real-world',
    stimulus: 'Competition and cooperation among children.',
    question:
      'Some people believe children should be taught to compete with one another, while others believe they should be taught to cooperate. Discuss both views and give your own opinion.',
    keyTerms: [
      'competition',
      'cooperation',
      'children',
      'schools',
      'teamwork',
      'success',
      'skills',
      'pressure',
    ],
    minWords: 200,
    maxWords: 300,
  },
  {
    id: 'we-32',
    source: 'real-world',
    stimulus: 'Robots and computers at work.',
    question:
      'In the future, robots and computers will replace human workers in every field of employment. To what extent do you agree or disagree?',
    keyTerms: [
      'robots',
      'computers',
      'workers',
      'automation',
      'employment',
      'technology',
      'industries',
      'machines',
    ],
    minWords: 200,
    maxWords: 300,
  },
  {
    id: 'we-33',
    source: 'real-world',
    stimulus: 'Social media and society.',
    question:
      'Social media has done more harm than good to the way society functions. To what extent do you agree or disagree?',
    keyTerms: [
      'social',
      'media',
      'society',
      'harm',
      'communication',
      'users',
      'information',
      'effects',
    ],
    minWords: 200,
    maxWords: 300,
  },
  {
    id: 'we-34',
    source: 'real-world',
    stimulus: 'Artificial intelligence and human capability.',
    question:
      'Artificial intelligence will soon surpass human capability in most areas of work and creativity. To what extent do you agree or disagree?',
    keyTerms: [
      'intelligence',
      'capability',
      'humans',
      'creativity',
      'machines',
      'work',
      'progress',
      'limits',
    ],
    minWords: 200,
    maxWords: 300,
  },
  {
    id: 'we-35',
    source: 'real-world',
    stimulus: 'Smartphones and interaction.',
    question:
      'Smartphones have changed the way people interact with one another, and not always for the better. To what extent do you agree or disagree?',
    keyTerms: [
      'smartphones',
      'interaction',
      'communication',
      'people',
      'technology',
      'social',
      'effects',
      'families',
    ],
    minWords: 200,
    maxWords: 300,
  },
  {
    id: 'we-36',
    source: 'real-world',
    stimulus: 'Funding for libraries and sports centres.',
    question:
      'Public libraries and sports centres are closing or losing funding in many places. What are the causes? What solutions can you suggest?',
    keyTerms: [
      'libraries',
      'sports',
      'centres',
      'funding',
      'public',
      'communities',
      'services',
      'government',
    ],
    minWords: 200,
    maxWords: 300,
  },
  {
    id: 'we-37',
    source: 'real-world',
    stimulus: 'Compulsory community service.',
    question:
      'All young people should be required to complete a period of community service. To what extent do you agree or disagree?',
    keyTerms: [
      'community',
      'service',
      'compulsory',
      'young',
      'society',
      'volunteers',
      'benefits',
      'requirement',
    ],
    minWords: 200,
    maxWords: 300,
  },
  {
    id: 'we-38',
    source: 'real-world',
    stimulus: 'Spending on space exploration.',
    question:
      'Some people think governments should spend more money on space exploration, while others believe the money is better spent on urgent problems on Earth. Discuss both views and give your own opinion.',
    keyTerms: [
      'space',
      'exploration',
      'government',
      'spending',
      'earth',
      'problems',
      'research',
      'technology',
    ],
    minWords: 200,
    maxWords: 300,
  },
  {
    id: 'we-39',
    source: 'real-world',
    stimulus: 'Fossil fuels and renewable energy.',
    question:
      'Governments should abandon fossil fuels immediately and rely entirely on renewable energy. To what extent do you agree or disagree?',
    keyTerms: [
      'fossil',
      'fuels',
      'renewable',
      'energy',
      'government',
      'climate',
      'pollution',
      'alternatives',
    ],
    minWords: 200,
    maxWords: 300,
  },
  {
    id: 'we-40',
    source: 'real-world',
    stimulus: 'Environmental responsibility.',
    question:
      'Some people say governments must take the lead in protecting the environment, while others say individuals must change their own behaviour. Discuss both views and give your own opinion.',
    keyTerms: [
      'environment',
      'government',
      'individuals',
      'responsibility',
      'protection',
      'behaviour',
      'policy',
      'change',
    ],
    minWords: 200,
    maxWords: 300,
  },
  {
    id: 'we-41',
    source: 'real-world',
    stimulus: 'Advertising aimed at children.',
    question:
      'Advertising aimed at children should be banned completely. To what extent do you agree or disagree?',
    keyTerms: [
      'advertising',
      'children',
      'ban',
      'marketing',
      'parents',
      'products',
      'influence',
      'health',
    ],
    minWords: 200,
    maxWords: 300,
  },
  {
    id: 'we-42',
    source: 'real-world',
    stimulus: 'Stress in modern life.',
    question:
      'Modern life is far more stressful than life was in the past. What are the causes? What solutions can you suggest?',
    keyTerms: ['stress', 'modern', 'life', 'causes', 'solutions', 'work', 'pressure', 'health'],
    minWords: 200,
    maxWords: 300,
  },
]
