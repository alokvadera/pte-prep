import type { Passage } from './schema'

/**
 * Additional original passages, sixth set.
 *
 * Same house style as the earlier sets: state the mechanism, concede the
 * strongest objection, and close on a claim that is falsifiable rather
 * than rhetorical. All six passages were written for this project.
 */

export const EXTRA_PASSAGES_5: Passage[] = [
  {
    id: 'coral-reefs',
    title: 'What Bleaching Actually Is',
    topic: 'Coral reef ecology',
    level: 'C1',
    paragraphs: [
      'The structure is built by colonies of tiny animals, each of which secretes a cup of calcium carbonate around itself, and the reef is the accumulated skeleton of millions of generations that lived and died in the same place. It hosts algae in its tissue, and the algae, which convert sunlight into sugar, transfer a large share of what they produce to their host. That arrangement explains both the productivity of the reef and its fragility, because the animal depends on a partner it cannot live without.',
      'The mechanism behind bleaching is a breakdown of that partnership rather than a death of the animal. When water warms beyond a narrow band, the algae produce reactive oxygen species faster than the coral can neutralise them, and the coral responds by expelling the algae. The bleaching event is a stress response with a time limit, and whether it becomes a mortality event depends on duration, not only on temperature.',
      'It would be reasonable to object that reefs have survived warm periods before, and the geological record supports the objection in part. Corals have persisted through climate shifts over hundreds of thousands of years, adapting and migrating as conditions changed. The strongest counter is a matter of rate: the warming now under way is faster than the pace at which coral populations have historically shifted their range.',
      'The consequences are structural rather than cosmetic. A reef that loses its branching corals loses the architecture that shelters fish, and the fish that remain are smaller and fewer. Fisheries decline, and the coast loses the wave-breaking barrier that the reef provided, so erosion rises. The falsifiable claim at the centre of the science is straightforward: if bleaching is driven by the duration of heat, then reefs exposed to short, sharp warm events should recover, and reefs exposed to prolonged warmth should not.',
    ],
    keyTerms: [
      'calcium carbonate',
      'algae',
      'bleaching',
      'reactive oxygen species',
      'fisheries',
      'erosion',
    ],
    readAloud:
      'The structure is built by colonies of tiny animals, each of which secretes a cup of calcium carbonate around itself, and the reef is the accumulated skeleton of millions of generations that lived and died in the same place. It hosts algae in its tissue, and the algae, which convert sunlight into sugar, transfer a large share of what they produce to their host.',
    repeatSentences: [
      'The reef is the accumulated skeleton of millions of generations that lived and died in the same place.',
      'The coral animal hosts algae in its tissue, and the algae transfer sugar to their host.',
      'Bleaching is a breakdown of the partnership between the coral and its algae, not an immediate death.',
      'The animal may recover if the water cools within weeks, so duration matters more than peak temperature.',
      'A reef that loses its branching corals loses the architecture that shelters fish.',
    ],
    swt: {
      id: 'swt-coral-reefs',
      summary:
        'The passage explains that a reef is built from cups of calcium carbonate secreted by coral animals that host sugar-producing algae, that bleaching is the expulsion of those algae under heat stress, and that whether bleaching kills a reef depends on the duration of warmth rather than its peak, a claim testable against satellite temperature records and reef surveys.',
      excerptLabel: 'Partnership and breakdown',
      excerpt: [
        'The coral animal cannot photosynthesise. It hosts algae in its tissue, and the algae, which convert sunlight into sugar, transfer a large share of what they produce to their host. That arrangement explains both the productivity of the reef and its fragility, because the animal depends on a partner it cannot live without.',
        'When water warms beyond a narrow band, the algae produce reactive oxygen species faster than the coral can neutralise them, and the coral responds by expelling the algae. What follows is visible as white stone, but the animal is usually still alive and may recover if the water cools within weeks.',
      ],
      keyTerms: ['algae', 'calcium carbonate', 'bleaching', 'expelling', 'duration', 'surveys'],
      minWords: 20,
    },
    dropdown: {
      id: 'fibd-coral-reefs',
      text: 'A reef is built by colonies of tiny animals, each of which secretes a cup of calcium ______ around itself. The coral animal hosts ______ in its tissue, and these convert sunlight into sugar. When water warms, the algae produce reactive oxygen species faster than the coral can neutralise them, and the coral responds by ______ the algae. Whether bleaching becomes a mortality event depends on the ______ of the warming, not only on its peak.',
      bank: [
        'carbonate',
        'algae',
        'expelling',
        'duration',
        'skeleton',
        'recovery',
        'warming',
        'acid',
        'coral',
      ],
      answers: ['carbonate', 'algae', 'expelling', 'duration'],
    },
    tableFib: {
      id: 'fibt-coral-reefs',
      context: [
        'Marine biologists surveyed four reef sites after a marine heatwave, recording the length of the temperature anomaly, the severity of bleaching observed, and the condition of each reef two years later. The table reports their findings.',
      ],
      headers: [
        'Site',
        'Heat anomaly',
        'Days above threshold',
        'Bleaching severity',
        'Two-year outcome',
      ],
      rows: [
        ['North Lagoon', '0.4 °C', '11', 'Mild', 'Recovered'],
        ['South Atoll', '1.1 °C', null, 'Severe', 'Partial'],
        ['East Bank', '0.8 °C', '38', 'Moderate', null],
        ['West Shoal', '1.6 °C', '74', 'Severe', 'Decline'],
        ['Prediction check', 'Short events', '—', 'Mild', 'Recovery'],
      ],
      answers: ['47 days', 'Partial recovery'],
    },
    mcqSingle: {
      id: 'mcqs-coral-reefs',
      question:
        'According to the passage, what determines whether bleaching becomes a mortality event?',
      options: [
        'How long the warming lasts',
        'The species of algae present',
        'The depth of the reef slope',
        'The acidity of the surrounding water',
      ],
      correct: ['How long the warming lasts'],
    },
    mcqMultiple: {
      id: 'mcqm-coral-reefs',
      question:
        'Which two statements about the geological history of reefs does the passage accept?',
      options: [
        'Corals have survived past warm periods',
        'Past adaptation was faster than modern warming',
        'Reefs have existed for only the last few thousand years',
        'Historical reefs were larger than modern ones',
        'Corals have persisted through climate shifts',
      ],
      correct: [
        'Corals have survived past warm periods',
        'Corals have persisted through climate shifts',
      ],
    },
    asq: [
      {
        id: 'asq-coral-1',
        question: 'What does each coral animal secrete around itself?',
        options: ['A cup of calcium carbonate', 'A layer of wind-blown sand', 'A shell of silica'],
        correct: 'A cup of calcium carbonate',
      },
      {
        id: 'asq-coral-2',
        question: 'What do the algae living in coral tissue produce?',
        options: ['Sugar from sunlight', 'Oxygen from minerals', 'Heat from decay'],
        correct: 'Sugar from sunlight',
      },
      {
        id: 'asq-coral-3',
        question: 'What does a reef lose when its branching corals die?',
        options: [
          'The architecture that shelters fish',
          'The ability to photosynthesise',
          'Its calcium carbonate entirely',
        ],
        correct: 'The architecture that shelters fish',
      },
    ],
  },

  {
    id: 'remote-work',
    title: 'What Remote Work Unbundles',
    topic: 'Economics of remote work',
    level: 'C1',
    paragraphs: [
      'The economics of remote work are usually discussed as a question of preference, but the underlying mechanism is a change in what a firm must pay for. Remote work unbundles labour and location, and the immediate effect is that the cost of the location is transferred, in part, to the worker, who absorbs it as rent nearer to home, electricity and the cost of a desk.',
      'The strongest objection is that this transfer is simply a wage cut in disguise, and the data give it some support. Surveys of workers who moved to remote arrangements report that a minority accept a formal pay reduction, and the reduction is concentrated among those who moved to a cheaper city.',
      'The second-order effect concerns the market for talent. When location no longer ties a worker to an office, the firm can hire from a wider pool, and the worker can sell to a wider market. Standard trade theory predicts that a wider market raises the value of the best match and lowers the value of the average one. This is testable, and the early evidence is consistent with it: pay in fully remote roles has spread, with a premium for rare skills and pressure on common ones.',
      'Work that can be specified in advance and checked after the fact suits remote arrangements. Work that depends on quick, tacit exchange does not, and the firms that have reversed remote policies cite exactly this. The falsifiable claim is that remote work will persist where output is measurable and disperse where it is not, and the pattern of reversals by industry so far matches that prediction rather than the preference story.',
    ],
    keyTerms: [
      'unbundles',
      'commuting time',
      'wage',
      'coordination',
      'tacit exchange',
      'measurable output',
    ],
    readAloud:
      'The economics of remote work are usually discussed as a question of preference, but the underlying mechanism is a change in what a firm must pay for. Remote work unbundles labour and location, and the immediate effect is that the cost of the location is transferred, in part, to the worker.',
    repeatSentences: [
      'Remote work unbundles labour from location, transferring part of the cost of the workplace to the worker.',
      'The strongest objection is that the transfer of costs to workers is simply a wage cut in disguise.',
      'The worker who gives up salary may recover the value of commuting time, which was never paid for.',
      'A wider market raises the value of the best match and lowers the value of the average one.',
      'Remote work will persist where output is measurable and disperse where it is not.',
    ],
    swt: {
      id: 'swt-remote-work',
      summary:
        'The passage argues that remote work unbundles labour from location and transfers part of the cost of the workplace to the worker, that wider hiring markets reward rare skills while pressuring common ones, and that the arrangement persists where output is measurable and coordination costs are low, a prediction that industry reversals so far support.',
      excerptLabel: 'The objection and the counter',
      excerpt: [
        'The strongest objection is that this transfer is simply a wage cut in disguise, and the data give it some support. Surveys of workers who moved to remote arrangements report that a minority accept a formal pay reduction, and the reduction is concentrated among those who moved to a cheaper city.',
        'The falsifiable claim is that remote work will persist where output is measurable and disperse where it is not, and the pattern of reversals by industry so far matches that prediction rather than the preference story.',
      ],
      keyTerms: ['unbundles', 'wage', 'pay reduction', 'measurable', 'reversals', 'rare skills'],
      minWords: 20,
    },
    dropdown: {
      id: 'fibd-remote-work',
      text: 'Office work bundles together the labour and the ______ : the employee is paid to be in a place. Remote work ______ the two, transferring part of the cost to the worker, who absorbs it as rent and electricity. The strongest objection is that this transfer is simply a wage cut in ______ , and the data give it some support. Remote work will persist where output is ______ and disperse where it is not.',
      bank: [
        'location',
        'unbundles',
        'disguise',
        'measurable',
        'bundles',
        'office',
        'recovery',
        'invisible',
        'portable',
      ],
      answers: ['location', 'unbundles', 'disguise', 'measurable'],
    },
    tableFib: {
      id: 'fibt-remote-work',
      context: [
        'A consultancy classified four job types by how far the output can be specified in advance and checked afterwards, then recorded the share of each role done remotely and the change in pay since 2020.',
      ],
      headers: [
        'Job type',
        'Output measurability',
        'Remote share',
        'Pay change since 2020',
        'Coordination cost',
      ],
      rows: [
        ['Software testing', 'High', '61%', '+7%', 'Low'],
        ['Management consulting', null, '28%', '+3%', 'High'],
        ['Bookkeeping', 'High', '55%', null, 'Low'],
        ['Laboratory technician', 'Low', '6%', 'Flat', 'Very high'],
        ['Pattern', '—', '—', 'Mixed', '—'],
      ],
      answers: ['Mostly tacit', '-4%'],
    },
    mcqSingle: {
      id: 'mcqs-remote-work',
      question: 'According to the passage, what happens to pay when the hiring market widens?',
      options: [
        'Rare skills gain a premium while common ones face pressure',
        'All salaries converge towards a single national rate',
        'Every worker receives an identical increase in pay',
        'Firms pay less because no office is required',
      ],
      correct: ['Rare skills gain a premium while common ones face pressure'],
    },
    mcqMultiple: {
      id: 'mcqm-remote-work',
      question: 'Which two costs does the passage say the remote worker absorbs?',
      options: [
        'Rent for a home nearer to the workplace',
        'Electricity and the cost of a desk',
        "The employer's office lease",
        'Commuting time that was never paid for by anyone',
        'The cost of office cleaning services',
      ],
      correct: ['Rent for a home nearer to the workplace', 'Electricity and the cost of a desk'],
    },
    asq: [
      {
        id: 'asq-remote-1',
        question: 'What does remote work unbundle, according to the passage?',
        options: ['Labour and location', 'Wages and taxes', 'Rent and services'],
        correct: 'Labour and location',
      },
      {
        id: 'asq-remote-2',
        question: 'What does a wider market do to the value of the average match?',
        options: ['Lowers it', 'Raises it', 'Stabilises it'],
        correct: 'Lowers it',
      },
      {
        id: 'asq-remote-3',
        question: 'Which kind of work does the passage say suits remote arrangements?',
        options: [
          'Work that can be specified and checked',
          'Work that depends on tacit exchange',
          'Work that needs a laboratory',
        ],
        correct: 'Work that can be specified and checked',
      },
    ],
  },

  {
    id: 'vaccines',
    title: 'A Rehearsal That Does Not Stage the Disease',
    topic: 'Immunology',
    level: 'B2',
    paragraphs: [
      'A vaccine works by exposing the immune system to a harmless version of a pathogen, so that the body learns the shape of the enemy before it ever meets the real one. After an infection, or after a vaccine, a small population of long-lived memory cells remains, each carrying a receptor that fits one specific marker on the surface of the pathogen.',
      'The mechanism has two stages. On first exposure, the immune response is slow, because the matching cells are rare and must multiply before they can act; this is why a first infection can make a person ill for weeks. On second exposure, the memory cells recognise the marker immediately, and the response is fast enough to clear the pathogen before symptoms develop.',
      'The strongest objection to vaccination is that natural infection teaches the same lesson more thoroughly, and in one respect the objection is correct: natural infection often produces broader and longer-lasting immunity. The counter is about risk, not about mechanism. The pathogen teaches the immune system while also damaging the body, sometimes permanently, and the vaccine teaches the same lesson using a marker, a weakened form, or a fragment that cannot cause the illness.',
      'The population-level effect follows from the same mechanism. When enough people carry memory cells, a pathogen cannot find enough new hosts to sustain its chain of transmission, and the outbreak dies out even among those who are not immune. Whether a vaccine achieves this depends on how contagious the pathogen is and on how many people are immune, both of which can be measured.',
    ],
    keyTerms: ['memory cells', 'receptor', 'marker', 'immunity', 'transmission', 'surveillance'],
    readAloud:
      'A vaccine works by exposing the immune system to a harmless version of a pathogen, so that the body learns the shape of the enemy before it ever meets the real one. The immune system does not store memories in the way the brain does.',
    repeatSentences: [
      'The immune system stores cells rather than memories in the way the brain stores them.',
      'On first exposure the immune response is slow because the matching cells are rare.',
      'Memory cells recognise the marker immediately, and the response clears the pathogen before symptoms develop.',
      'Natural infection often produces broader and longer-lasting immunity, but the pathogen damages the body while teaching.',
      'When enough people carry memory cells, the pathogen cannot sustain its chain of transmission.',
    ],
    swt: {
      id: 'swt-vaccines',
      summary:
        'The passage explains that a vaccine exposes the immune system to a harmless version of a pathogen so that long-lived memory cells are produced, that these cells make the second response fast enough to prevent symptoms, and that high coverage breaks chains of transmission, a claim confirmed by surveillance data for diseases such as measles.',
      excerptLabel: 'Rehearsal without the disease',
      excerpt: [
        'On first exposure, the immune response is slow, because the matching cells are rare and must multiply before they can act; this is why a first infection can make a person ill for weeks. On second exposure, the memory cells recognise the marker immediately, and the response is fast enough to clear the pathogen before symptoms develop.',
        'The counter is about risk, not about mechanism. The pathogen teaches the immune system while also damaging the body, sometimes permanently, and the vaccine teaches the same lesson using a marker, a weakened form, or a fragment that cannot cause the illness.',
      ],
      keyTerms: ['memory cells', 'marker', 'symptoms', 'transmission', 'surveillance', 'coverage'],
      minWords: 20,
    },
    dropdown: {
      id: 'fibd-vaccines',
      text: 'A vaccine works by exposing the immune system to a ______ version of a pathogen. After vaccination, a small population of long-lived ______ cells remains, each carrying a receptor that fits one specific marker. On second exposure, the response is fast enough to clear the pathogen before ______ develop. When enough people are immune, the pathogen cannot sustain its chain of ______ , and the outbreak dies out.',
      bank: [
        'harmless',
        'memory',
        'symptoms',
        'transmission',
        'dangerous',
        'forgotten',
        'recovery',
        'infection',
        'carrier',
      ],
      answers: ['harmless', 'memory', 'symptoms', 'transmission'],
    },
    tableFib: {
      id: 'fibt-vaccines',
      context: [
        'A national immunisation programme recorded vaccine coverage and reported cases for four pathogens, comparing the years before the vaccine was introduced with the most recent decade.',
      ],
      headers: [
        'Pathogen',
        'Coverage',
        'Cases before vaccine',
        'Cases in recent decade',
        'Immunity type',
      ],
      rows: [
        ['Measles', '93%', '500,000', 'Few hundred', 'Vaccine-derived'],
        ['Polio', null, '350,000', 'Zero in most regions', 'Vaccine-derived'],
        ['Influenza', '45%', 'Millions', null, 'Partial'],
        ['Chickenpox', '90%', '4 million', '100,000', 'Vaccine-derived'],
        ['Conclusion', '—', '—', '—', '—'],
      ],
      answers: ['85%', 'Millions'],
    },
    mcqSingle: {
      id: 'mcqs-vaccines',
      question: 'According to the passage, why is the response to a second exposure faster?',
      options: [
        'Memory cells recognise the pathogen marker immediately',
        'The pathogen becomes weaker after the first illness',
        'The body stores memories in the brain itself',
        'Symptoms develop more slowly in older patients',
      ],
      correct: ['Memory cells recognise the pathogen marker immediately'],
    },
    mcqMultiple: {
      id: 'mcqm-vaccines',
      question:
        'Which two reasons does the passage give for a vaccine being safer than natural infection?',
      options: [
        'The vaccine cannot cause the illness',
        'The vaccine uses a marker or a fragment',
        'Natural infection never produces memory cells',
        'The vaccine avoids damaging the body',
        'Natural infection produces no immunity at all',
      ],
      correct: ['The vaccine cannot cause the illness', 'The vaccine avoids damaging the body'],
    },
    asq: [
      {
        id: 'asq-vax-1',
        question: 'What does the immune system store after an infection?',
        options: [
          'Long-lived memory cells',
          'Short-lived antibodies only',
          'Permanent tissue changes',
        ],
        correct: 'Long-lived memory cells',
      },
      {
        id: 'asq-vax-2',
        question: 'Why can a first infection make a person ill for weeks?',
        options: [
          'The matching cells are rare',
          'The pathogen mutates rapidly',
          'The vaccine wears off',
        ],
        correct: 'The matching cells are rare',
      },
      {
        id: 'asq-vax-3',
        question: 'What happens when enough people carry memory cells?',
        options: [
          'The outbreak dies out',
          'The pathogen mutates faster',
          'Symptoms become more severe',
        ],
        correct: 'The outbreak dies out',
      },
    ],
  },

  {
    id: 'decision-fatigue',
    title: 'Depleted or Simply Unwilling',
    topic: 'Psychology of decision fatigue',
    level: 'C1',
    paragraphs: [
      'Decision fatigue is the claim that the quality of a choice declines after a long sequence of earlier choices. The proposed mechanism is not boredom but depletion: each act of choosing is said to draw on a limited resource, so that the later options are evaluated with less care than the earlier ones. The evidence most often cited comes from studies in which participants who made many decisions beforehand chose the default option, or gave up entirely, more often than participants who had not.',
      'The strongest objection is that depletion is the wrong metaphor. Under closer inspection, the original experiments have proven difficult to replicate, and a large-scale replication attempt found effects close to zero. The alternative account is motivation rather than depletion: choosing is effortful, and a person who has chosen a great deal simply wants the choosing to stop, which produces the same behaviour without any drained resource. The two accounts make different predictions, because a depleted resource should be restored by glucose, whereas a shift in motivation should be restored by a change in incentives.',
      'The consequences attributed to decision fatigue are real even if the mechanism is disputed. Both findings could also reflect the structure of the day rather than a draining resource: late sessions follow long ones, and the end of a supermarket trip follows many small choices.',
      'The practical advice survives the dispute, because the remedies recommended for decision fatigue work under either account. Moving important decisions to the morning, reducing the number of trivial choices in a day, and pre-committing to defaults all reduce the number of decisions that must be made at the moment they matter. The falsifiable claim is that if the effect is motivational, then changing the incentive to decide should restore performance without rest or glucose.',
    ],
    keyTerms: ['depletion', 'replicate', 'default option', 'parole', 'motivation', 'incentives'],
    readAloud:
      'Decision fatigue is the claim that the quality of a choice declines after a long sequence of earlier choices. The proposed mechanism is not boredom but depletion: each act of choosing is said to draw on a limited resource, so that the later options are evaluated with less care than the earlier ones.',
    repeatSentences: [
      'The proposed mechanism is not boredom but depletion of a limited resource used by choosing.',
      'Participants who made many decisions beforehand chose the default option more often than others.',
      'The original experiments have proven difficult to replicate, and a large-scale attempt found effects near zero.',
      'Judges grant parole more often early in the session than late in the day.',
      'Changing the incentive to decide should restore performance without rest or glucose.',
    ],
    swt: {
      id: 'swt-decision-fatigue',
      summary:
        'The passage describes decision fatigue as a decline in the quality of choices after a long sequence of decisions, notes that the depletion account has proven hard to replicate and that a motivational account fits the same behaviour, and argues that remedies like morning scheduling and pre-committed defaults work under either explanation.',
      excerptLabel: 'Depletion or motivation',
      excerpt: [
        'The strongest objection is that depletion is the wrong metaphor. Under closer inspection, the original experiments have proven difficult to replicate, and a large-scale replication attempt found effects close to zero.',
        'The alternative account is motivation rather than depletion: choosing is effortful, and a person who has chosen a great deal simply wants the choosing to stop, which produces the same behaviour without any drained resource.',
      ],
      keyTerms: ['depletion', 'replicate', 'motivation', 'behaviour', 'defaults', 'scheduling'],
      minWords: 20,
    },
    dropdown: {
      id: 'fibd-decision-fatigue',
      text: 'Decision fatigue is the claim that the quality of a choice declines after a long sequence of earlier ______ . The proposed mechanism is depletion: each act of choosing draws on a limited ______ . The strongest objection is that the original experiments have proven difficult to ______ . The alternative account is ______ rather than depletion, because a person who has chosen a great deal simply wants the choosing to stop.',
      bank: [
        'choices',
        'resource',
        'replicate',
        'motivation',
        'chances',
        'reservoir',
        'repeat',
        'emotion',
        'fatigue',
      ],
      answers: ['choices', 'resource', 'replicate', 'motivation'],
    },
    tableFib: {
      id: 'fibt-decision-fatigue',
      context: [
        'Researchers observed four parole boards over a year, recording how many decisions each board had heard by the session in question, the share of requests granted, and how often the default refusal was chosen.',
      ],
      headers: [
        'Session',
        'Decisions heard',
        'Parole grant rate',
        'Default chosen',
        'Interpretation',
      ],
      rows: [
        ['Morning', '12', '65%', 'Rare', 'Fresh resources'],
        ['Midday', null, '48%', 'Occasional', 'Depletion'],
        ['Afternoon', '28', null, 'Frequent', 'Depletion'],
        ['Evening', '31', '20%', 'Frequent', 'Motivation'],
        ['Prediction', '—', 'Restored by incentives', '—', '—'],
      ],
      answers: ['21', '41%'],
    },
    mcqSingle: {
      id: 'mcqs-decision-fatigue',
      question:
        'According to the passage, what is the strongest objection to the depletion account?',
      options: [
        'The original experiments have proven difficult to replicate',
        'Participants were not paid enough to take part',
        'The studies were conducted only in laboratories',
        'Choosing does not require any effort at all',
      ],
      correct: ['The original experiments have proven difficult to replicate'],
    },
    mcqMultiple: {
      id: 'mcqm-decision-fatigue',
      question:
        'Which two remedies does the passage say work under either account of decision fatigue?',
      options: [
        'Moving important decisions to the morning',
        'Taking glucose between consecutive decisions',
        'Reducing the number of trivial daily choices',
        'Increasing the number of options available',
        'Extending the working day deliberately',
      ],
      correct: [
        'Moving important decisions to the morning',
        'Reducing the number of trivial daily choices',
      ],
    },
    asq: [
      {
        id: 'asq-fatigue-1',
        question: 'What does decision fatigue claim declines after many choices?',
        options: ['The quality of a choice', 'The speed of the hand', 'The length of the day'],
        correct: 'The quality of a choice',
      },
      {
        id: 'asq-fatigue-2',
        question: 'What do participants who have chosen a great deal often do?',
        options: [
          'Choose the default or give up',
          'Choose more carefully than before',
          'Ask for more time to decide',
        ],
        correct: 'Choose the default or give up',
      },
      {
        id: 'asq-fatigue-3',
        question: 'What should restore performance if the effect is motivational?',
        options: ['A change in incentives', 'A drink of glucose', 'A long night of sleep'],
        correct: 'A change in incentives',
      },
    ],
  },

  {
    id: 'printing-press',
    title: 'What the Press Actually Changed',
    topic: 'History of the printing press',
    level: 'B2',
    paragraphs: [
      'The printing press is often described as the invention that made the modern world, and the claim is closer to the truth than most such claims. Before movable type, a book was a hand-copied object, and the cost of copying set a hard limit on how many books existed and who could read them. A press that used reusable metal type changed the economics of the book rather than the physics of it, and the cost of each copy fell towards the cost of the paper it was printed on.',
      'Movable type allowed a page to be composed from individual letters, inked, and pressed onto paper, after which the letters could be rearranged for the next page. A skilled compositor could produce several pages an hour, and a press could run for days on a single setting.',
      'The strongest objection to the grand narrative is that the press did not change Europe as quickly or as uniformly as the story suggests. Manuscript copies continued for decades after the first printed books, and literacy rose slowly and unevenly, with most of the early benefit going to cities and to the wealthy. The counter is that the press changed the ceiling rather than the floor: it made the spread of ideas cheap enough that the eventual rise in literacy could occur at all.',
      'The falsifiable part of the claim concerns what happened to the content itself. If the press lowered the cost of copying, then the number of distinct titles in circulation should rise sharply, and so should the survival rate of works that would otherwise have been lost. Both predictions are checkable against library catalogues, and they hold: the centuries after the press contain more surviving titles than the centuries before it, and the increase is far larger than population growth alone can explain.',
    ],
    keyTerms: ['movable type', 'compositor', 'literacy', 'manuscript', 'titles', 'catalogues'],
    readAloud:
      'The printing press is often described as the invention that made the modern world, and the claim is closer to the truth than most such claims. Before movable type, a book was a hand-copied object, and the cost of copying set a hard limit on how many books existed and who could read them.',
    repeatSentences: [
      'A press with reusable metal type changed the economics of the book rather than the physics of it.',
      'The same text could be printed hundreds of times, and the cost of each copy fell.',
      'Movable type allowed a page to be composed from individual letters, inked, and pressed onto paper.',
      'Books moved from the possession of institutions to the possession of individuals within two generations.',
      'The centuries after the press contain more surviving titles than the centuries before it.',
    ],
    swt: {
      id: 'swt-printing-press',
      summary:
        'The passage argues that the printing press changed the economics of the book by making reusable metal type possible, that the resulting fall in price moved books from institutions to individuals, and that the predictions the claim generates — a sharp rise in distinct titles and in the survival of works — are confirmed by library catalogues.',
      excerptLabel: 'What the catalogues show',
      excerpt: [
        'The strongest objection to the grand narrative is that the press did not change Europe as quickly or as uniformly as the story suggests. Manuscript copies continued for decades after the first printed books, and literacy rose slowly and unevenly, with most of the early benefit going to cities and to the wealthy.',
        'The falsifiable part of the claim concerns what happened to the content itself. If the press lowered the cost of copying, then the number of distinct titles in circulation should rise sharply, and so should the survival rate of works that would otherwise have been lost.',
      ],
      keyTerms: ['metal type', 'manuscript', 'literacy', 'titles', 'survival', 'catalogues'],
      minWords: 20,
    },
    dropdown: {
      id: 'fibd-printing-press',
      text: 'Before movable type, a book was a hand-copied object, and the cost of copying set a hard limit on how many books existed. A press with reusable metal ______ changed the economics of the book: the same text could be printed hundreds of times, and the cost of each copy fell towards the cost of the ______ . The strongest objection is that literacy rose slowly and unevenly, with most of the early benefit going to ______ and to the wealthy. The falsifiable claim is that the number of distinct ______ in circulation should rise sharply after the press.',
      bank: [
        'type',
        'paper',
        'cities',
        'titles',
        'stone',
        'cloth',
        'villages',
        'authors',
        'presses',
      ],
      answers: ['type', 'paper', 'cities', 'titles'],
    },
    tableFib: {
      id: 'fibt-printing-press',
      context: [
        'Historians compared four European cities by the year their first press arrived, the number of distinct titles printed by 1500, and the estimated literacy of the adult population at that date.',
      ],
      headers: ['City', 'First press', 'Titles by 1500', 'Literacy at 1500', 'Growth'],
      rows: [
        ['Florence', '1471', '2,300', '18%', 'Rapid'],
        ['London', null, '1,900', '12%', 'Rapid'],
        ['Lyon', '1473', null, '15%', 'Moderate'],
        ['Kraków', '1473', '640', '9%', 'Slow'],
        ['Pattern', '—', 'Rising', '—', '—'],
      ],
      answers: ['1476', '1,450'],
    },
    mcqSingle: {
      id: 'mcqs-printing-press',
      question: 'According to the passage, what did the press change about the book?',
      options: [
        'The economics of producing it',
        'The physics of the paper',
        'The languages it could use',
        'The length of the average book',
      ],
      correct: ['The economics of producing it'],
    },
    mcqMultiple: {
      id: 'mcqm-printing-press',
      question: 'Which two predictions does the passage say the catalogue evidence confirms?',
      options: [
        'The number of distinct titles rose sharply',
        'More works survived than would otherwise have been lost',
        'Every book became cheaper than a manuscript',
        'Literacy became uniform across Europe',
        'Manuscript copying disappeared within a decade',
      ],
      correct: [
        'The number of distinct titles rose sharply',
        'More works survived than would otherwise have been lost',
      ],
    },
    asq: [
      {
        id: 'asq-press-1',
        question: 'What was a book before movable type?',
        options: ['A hand-copied object', 'A printed object', 'A government record'],
        correct: 'A hand-copied object',
      },
      {
        id: 'asq-press-2',
        question: 'What could a skilled compositor produce several of per hour?',
        options: ['Pages', 'Books', 'Presses'],
        correct: 'Pages',
      },
      {
        id: 'asq-press-3',
        question: 'What rose slowly and unevenly after the first printed books?',
        options: ['Literacy', 'Population', 'Taxation'],
        correct: 'Literacy',
      },
    ],
  },

  {
    id: 'batteries',
    title: 'Energy, Power and the Chemical Ceiling',
    topic: 'Physics of batteries',
    level: 'C1',
    paragraphs: [
      'It is a device that converts chemical energy into electrical energy through reactions at two electrodes separated by an electrolyte. At the anode, a material gives up electrons; at the cathode, another material accepts them; and the electrolyte carries ions between the two so that the reactions can continue. The voltage is set by the chemistry of the electrode pair, and it is fixed: no arrangement of materials will make a lithium cell produce the voltage of a lead-acid cell.',
      'The quantity that a battery stores is energy, and it is measured in watt-hours, while the rate at which it can deliver that energy is power, measured in watts. The two are not the same, and the confusion between them is the most common error in popular discussion of batteries. A battery with a large capacity may still deliver power slowly, because the reactions that release the energy have a maximum speed, set by the surface area of the electrodes.',
      'The strongest objection to the optimistic forecast is that the limits are chemical rather than engineering. Lithium-ion cells have improved by roughly three per cent a year for three decades, but the improvement compounds slowly against a physical ceiling: the energy stored per kilogram is bounded by the energy of the chemical bonds themselves. The counter is that the ceiling is not uniform across chemistries, and that a different chemistry with a different pair of materials can sit at a different point on the trade-off between energy, power and safety.',
      'The practical consequences follow from the trade-off rather than from the headline figure. A car that needs range needs energy density; a grid that needs to absorb a surge needs power; a phone that must not catch fire needs stability, and the electrolyte that gives the most energy is often the least stable.',
    ],
    keyTerms: ['electrolyte', 'anode', 'cathode', 'watt-hours', 'energy density', 'electrodes'],
    readAloud:
      'The quantity that a battery stores is energy, and it is measured in watt-hours, while the rate at which it can deliver that energy is power, measured in watts. The two are not the same, and the confusion between them is the most common error in popular discussion of batteries.',
    repeatSentences: [
      'A battery converts chemical energy into electrical energy through reactions at two electrodes separated by an electrolyte.',
      'The voltage is set by the chemistry of the electrode pair, and it is fixed.',
      'Energy is measured in watt-hours, while the rate of delivery is power, measured in watts.',
      'The energy stored per kilogram is bounded by the energy of the chemical bonds themselves.',
      'Batteries will keep improving by small percentages rather than by multiples.',
    ],
    swt: {
      id: 'swt-batteries',
      summary:
        'The passage explains that a battery converts chemical energy into electrical energy through reactions at two electrodes, that capacity in watt-hours must be distinguished from power in watts, and that improvements are bounded by the energy of the chemical bonds, so the falsifiable expectation is steady small gains rather than sudden multiples.',
      excerptLabel: 'The trade-off',
      excerpt: [
        'The quantity that a battery stores is energy, and it is measured in watt-hours, while the rate at which it can deliver that energy is power, measured in watts. The two are not the same, and the confusion between them is the most common error in popular discussion of batteries.',
        'A car that needs range needs energy density; a grid that needs to absorb a surge needs power; a phone that must not catch fire needs stability, and the electrolyte that gives the most energy is often the least stable.',
      ],
      keyTerms: [
        'electrolyte',
        'watt-hours',
        'electrical energy',
        'power',
        'energy density',
        'chemical bonds',
      ],
      minWords: 20,
    },
    dropdown: {
      id: 'fibd-batteries',
      text: 'A battery is a device that converts chemical energy into ______ energy through reactions at two electrodes. At the anode, a material gives up electrons; at the ______ , another material accepts them. The quantity a battery stores is energy, measured in watt-hours, while the rate of delivery is ______ , measured in watts. The energy stored per kilogram is bounded by the energy of the chemical ______ themselves.',
      bank: [
        'electrical',
        'cathode',
        'power',
        'bonds',
        'thermal',
        'anode',
        'force',
        'atoms',
        'current',
      ],
      answers: ['electrical', 'cathode', 'power', 'bonds'],
    },
    tableFib: {
      id: 'fibt-batteries',
      context: [
        'Engineers compared four battery chemistries by the energy each stores per kilogram, the rate at which it can deliver that energy, and its stability, and matched each to the application that suits it best.',
      ],
      headers: [
        'Chemistry',
        'Energy density (Wh/kg)',
        'Power delivery',
        'Stability',
        'Best suited to',
      ],
      rows: [
        ['Lead-acid', '35', 'Moderate', 'High', 'Backup power'],
        ['Lithium-ion', '250', null, 'Moderate', 'Cars and phones'],
        ['Lithium-sulfur', '400', 'Low', null, 'Aircraft'],
        ['Sodium-ion', '160', 'High', 'High', 'Grid storage'],
        ['Rule', 'Higher is lighter', '—', '—', '—'],
      ],
      answers: ['High', 'Low'],
    },
    mcqSingle: {
      id: 'mcqs-batteries',
      question: 'According to the passage, what sets the voltage of a battery?',
      options: [
        'The chemistry of the electrode pair',
        'The size of the outer casing',
        'The speed at which it is charged',
        'The temperature of the surrounding air',
      ],
      correct: ['The chemistry of the electrode pair'],
    },
    mcqMultiple: {
      id: 'mcqm-batteries',
      question:
        'According to the fourth paragraph, which two applications does the passage match with energy density and power respectively?',
      options: [
        'A car that needs range',
        'A grid that needs to absorb a surge',
        'A factory that needs cheap labour',
        'A phone that must not catch fire',
        'A heater that needs more current',
      ],
      correct: ['A car that needs range', 'A grid that needs to absorb a surge'],
    },
    asq: [
      {
        id: 'asq-batt-1',
        question: 'What does a battery convert chemical energy into?',
        options: ['Electrical energy', 'Thermal energy', 'Light energy'],
        correct: 'Electrical energy',
      },
      {
        id: 'asq-batt-2',
        question: 'What carries ions between the two electrodes?',
        options: ['The electrolyte', 'The anode', 'The casing'],
        correct: 'The electrolyte',
      },
      {
        id: 'asq-batt-3',
        question: 'What bounds the energy stored per kilogram?',
        options: [
          'The energy of the chemical bonds',
          'The size of the electrodes',
          'The price of the materials',
        ],
        correct: 'The energy of the chemical bonds',
      },
    ],
  },
]
