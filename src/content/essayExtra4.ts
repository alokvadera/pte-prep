import type { EssayPrompt } from './bank'

/**
 * Eight further Write Essay prompts in current PTE Academic format (200–300 words).
 * Expands the pool from 42 to 50 prompts, covering contemporary debates:
 * marine conservation, artisanal crafts in automated economies, adolescent sleep policy,
 * algorithmic judicial sentencing, and space exploration expenditures.
 */
export const EXTRA_ESSAY_PROMPTS_4: EssayPrompt[] = [
  {
    id: 'we-43',
    source: 'real-world',
    stimulus: 'Marine protected zones and coastal livelihoods.',
    question:
      'Some governments are closing large coastal areas to commercial fishing to protect marine biodiversity, while critics argue this devastates local fishing communities. Discuss both views and give your own opinion.',
    keyTerms: [
      'biodiversity',
      'conservation',
      'fishing',
      'livelihoods',
      'coastal',
      'regulations',
      'sustainability',
      'economy',
    ],
    minWords: 200,
    maxWords: 300,
  },
  {
    id: 'we-44',
    source: 'real-world',
    stimulus: 'Artificial intelligence and vocational trade training.',
    question:
      'As artificial intelligence automates cognitive and administrative tasks, practical vocational trades will become more valuable than university degrees. To what extent do you agree or disagree?',
    keyTerms: [
      'automation',
      'vocational',
      'trades',
      'degrees',
      'employment',
      'skills',
      'labour',
      'technology',
    ],
    minWords: 200,
    maxWords: 300,
  },
  {
    id: 'we-45',
    source: 'real-world',
    stimulus: 'Secondary school schedules and adolescent health.',
    question:
      'Secondary schools should delay their daily start time by at least two hours to match the biological sleep rhythms of adolescents. Do you agree or disagree? Give reasons and examples from your experience.',
    keyTerms: [
      'adolescents',
      'schedules',
      'sleep',
      'academic',
      'biological',
      'health',
      'schools',
      'performance',
    ],
    minWords: 200,
    maxWords: 300,
  },
  {
    id: 'we-46',
    source: 'real-world',
    stimulus: 'Satellite surveillance and environmental compliance.',
    question:
      'Global environmental agreements should be enforced using satellite surveillance and international sanctions rather than voluntary national reporting. To what extent do you agree or disagree?',
    keyTerms: [
      'surveillance',
      'sanctions',
      'satellite',
      'compliance',
      'international',
      'environmental',
      'sovereignty',
      'agreements',
    ],
    minWords: 200,
    maxWords: 300,
  },
  {
    id: 'we-47',
    source: 'real-world',
    stimulus: 'Behavioral nudges versus legislative bans.',
    question:
      'Governments should guide citizen behavior through subtle nudges and default choices rather than imposing strict legal bans and taxes. Discuss both views and state your opinion.',
    keyTerms: [
      'nudges',
      'behavior',
      'regulation',
      'taxation',
      'freedom',
      'public policy',
      'paternalism',
      'choice',
    ],
    minWords: 200,
    maxWords: 300,
  },
  {
    id: 'we-48',
    source: 'real-world',
    stimulus: 'Space exploration expenditure versus terrestrial climate mitigation.',
    question:
      'Spending billions of dollars on deep space exploration is irresponsible when that money could directly fund renewable energy and climate adaptation on Earth. Do you agree or disagree?',
    keyTerms: [
      'exploration',
      'space',
      'climate',
      'funding',
      'research',
      'scientific',
      'terrestrial',
      'priorities',
    ],
    minWords: 200,
    maxWords: 300,
  },
  {
    id: 'we-49',
    source: 'real-world',
    stimulus: 'Algorithmic sentencing in criminal justice systems.',
    question:
      'Automated algorithms should be used to assist judges in determining criminal bail and sentencing to eliminate human racial and social bias. To what extent do you agree or disagree?',
    keyTerms: [
      'algorithms',
      'sentencing',
      'justice',
      'bias',
      'judges',
      'fairness',
      'transparency',
      'courts',
    ],
    minWords: 200,
    maxWords: 300,
  },
  {
    id: 'we-50',
    source: 'real-world',
    stimulus: 'Preservation of endangered indigenous languages.',
    question:
      'National governments have a moral and cultural obligation to finance the preservation of endangered minority languages, even if those languages have very few remaining speakers. Do you agree or disagree?',
    keyTerms: [
      'minority',
      'preservation',
      'languages',
      'cultural',
      'heritage',
      'governments',
      'funding',
      'diversity',
    ],
    minWords: 200,
    maxWords: 300,
  },
]
