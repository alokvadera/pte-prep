import type { Passage } from './schema'

/**
 * Additional original passages, in the same house style as the first six.
 *
 * Added because Fill in the Blanks (Dropdown) sits at a ratio of only 1.5 against
 * its per-test count of five to six: a single full mock could exhaust the pool and
 * force a repeat within one sitting. Each passage here lifts that type, Fill in
 * the Blanks (Table), both reading multiple choice formats, Summarize Written
 * Text and Re-order Paragraphs together.
 *
 * The fourth is deliberately on a contested topic — vaccination uptake — and is
 * written to explain the mechanism of a policy disagreement without taking a side,
 * because the format asks candidates to identify which claims the passage supports
 * and which it does not.
 */
export const EXTRA_PASSAGES_2: Passage[] = [
  {
    id: 'repair-culture',
    title: 'The Right to Be Repaired',
    topic: 'Consumer law',
    level: 'C1',
    paragraphs: [
      'The right to repair began as a practical objection rather than a political one. A device that could be opened only by its manufacturer could not be repaired by anyone else, and once the spare parts supply dried up, repairability became a function of a commercial decision rather than of engineering. Manufacturers did not regard this as a problem, because replacing a device was more profitable than mending one, and the economics of the market were not broken so much as working as intended.',
      'Legislation in several jurisdictions has since changed what counts as intended, mostly by requiring access rather than by restricting design. Independent repairers must be given access to spare parts, diagnostic software and calibration tools, and must be permitted to use those tools without penalty clauses voiding a warranty. Manufacturers have responded with a mixture of compliance and adaptation, offering calibrated parts at a higher price than unrestricted ones and restricting certain repairs to authorised networks.',
      'The argument against the legislation is not usually about safety, which is the stated justification for many restrictions, but about cost. Calibration tools exist because pairing a new component to a device can produce a fault that appears months later, and holding that standard across every independent workshop is harder than inside a network that controls its own procedures. Critics point out that the same argument would justify forbidding the repair of any product whose failure could injure someone, which is a category broad enough to cover most things.',
      'There is a second objection that is harder to dismiss. Independent repair extends the working life of products whose production was itself damaging, and an argument about consumption that quietly increases consumption is not obviously an argument for sustainability. Defenders reply that this confuses ownership with use: a household that repairs one device for twelve years consumes less than a household that buys two devices for six, provided the repair is genuinely available and the device is genuinely repairable rather than nominally so.',
      'The most telling evidence so far comes from the least expected place. Where legislation has forced parts access, prices for those parts have fallen sharply, and in several surveys the independent repair market grew rather than shrinking. Manufacturers had expected the opposite. The most plausible explanation is that a constrained original equipment market had been quietly limiting the number of people able to afford repair at all, and that opening it created demand that had been absent rather than displaced.',
      'What remains unresolved is whether the gains are permanent. Parts access can be satisfied formally — parts available, but priced beyond the reach of the shops that might stock them — and several regulators have begun treating price as a material part of access for that reason. A repairable product that is too expensive to mend is a narrower development than a repairable product, and the distinction is the one on which the next decade of this argument will be decided.',
    ],
    keyTerms: ['right to repair', 'spare parts', 'calibration', 'independent repair', 'access', 'price'],
    readAloud:
      'The right to repair began as a practical objection rather than a political one. A device that could be opened only by its manufacturer could not be repaired by anyone else, and once the spare parts supply dried up, repairability became a function of a commercial decision rather than of engineering.',
    repeatSentences: [
      'Repairability became a function of a commercial decision rather than of engineering.',
      'Manufacturers offered calibrated parts at a higher price than unrestricted ones.',
      'This confuses ownership with use rather than describing a contradiction.',
      'A constrained market had been quietly limiting how many people could afford repair.',
      'A repairable product that is too expensive to mend is a narrower development.',
    ],
    swt: {
      id: 'swt-repair-culture',
      summary:
        'The passage reports that repair law works by forcing access to parts, tools and diagnostic software rather than by restricting design, that the strongest objection concerns calibration and cost, and that where parts access was legislated prices fell and the independent repair market grew rather than shrinking.',
      excerptLabel: 'The unexpected evidence',
      excerpt: [
        'The most telling evidence so far comes from the least expected place. Where legislation has forced parts access, prices for those parts have fallen sharply, and in several surveys the independent repair market grew rather than shrinking. Manufacturers had expected the opposite. The most plausible explanation is that a constrained original equipment market had been quietly limiting the number of people able to afford repair at all, and that opening it created demand that had been absent rather than displaced.',
        'What remains unresolved is whether the gains are permanent. Parts access can be satisfied formally — parts available, but priced beyond the reach of the shops that might stock them — and several regulators have begun treating price as a material part of access for that reason. A repairable product that is too expensive to mend is a narrower development than a repairable product, and the distinction is the one on which the next decade of this argument will be decided.',
      ],
      keyTerms: ['parts access', 'prices', 'fell', 'independent repair', 'demand', 'unresolved'],
      minWords: 20,
    },
    dropdown: {
      id: 'fibd-repair-culture',
      text:
        'Repairability became a function of a commercial ______ rather than of engineering. Legislation now requires manufacturers to provide ______ to parts, diagnostic software and calibration tools. Critics argue that holding a standard across every workshop is ______ than inside a controlled network. Where parts access has been legislated, prices have ______ sharply and the independent repair market has grown.',
      bank: ['decision', 'access', 'harder', 'fallen', 'preference', 'hardest', 'risen', 'exclusivity', 'simpler'],
      answers: ['decision', 'access', 'harder', 'fallen'],
    },
    tableFib: {
      id: 'fibt-repair-culture',
      context: [
        'Regulators in four markets collected data on the effect of parts access rules. The table reports the change in the price of a typical replacement part and the change in the number of independent workshops repairing the device, comparing the year before and the second year after the rules took effect.',
      ],
      headers: ['Market', 'Part price change', 'Workshops', 'Compliance', 'Enforcement'],
      rows: [
        ['A', '-31%', '+22%', 'Formal', 'Low'],
        ['B', '-24%', '+17%', 'Formal', 'Moderate'],
        ['C', '-6%', '+2%', 'Formal', null],
        ['D', null, '-4%', 'Deferred', 'Low'],
      ],
      answers: ['-6%', 'None recorded'],
    },
    mcqSingle: {
      id: 'mcqs-repair-culture',
      question: 'According to the second paragraph, how has legislation approached repairability?',
      options: [
        'By requiring access rather than restricting design',
        'By prohibiting the sale of non repairable devices',
        'By requiring manufacturers to offer extended warranties',
        'By taxing products that are difficult to repair',
      ],
      correct: ['By requiring access rather than restricting design'],
    },
    mcqMultiple: {
      id: 'mcqm-repair-culture',
      question: 'Which two objections does the passage attribute to critics of repair legislation?',
      options: [
        'Calibration standards are harder to hold across independent workshops',
        'Repairing extends the life of products whose production was damaging',
        'Legislation has made devices more expensive to manufacture',
        'Independent workshops lack the training to diagnose faults',
        'Consumers prefer replacement to repair in every income group',
      ],
      correct: [
        'Calibration standards are harder to hold across independent workshops',
        'Repairing extends the life of products whose production was damaging',
      ],
    },
    asq: [
      {
        id: 'asq-repair-1',
        question: 'What made repairability depend on a commercial decision?',
        options: [
          'Only the manufacturer could open a device',
          'Repair was always more expensive than replacement',
          'Parts were sold only to approved workshops',
          'Devices were deliberately designed to fail',
        ],
        correct: 'Only the manufacturer could open a device',
      },
      {
        id: 'asq-repair-2',
        question: 'What happened to part prices where access was legislated?',
        options: ['They fell sharply', 'They rose steadily', 'They stayed level', 'They became restricted'],
        correct: 'They fell sharply',
      },
      {
        id: 'asq-repair-3',
        question: 'What does the passage say regulators are beginning to treat as part of access?',
        options: ['Price', 'Warranty length', 'Tool calibration', 'Repair duration'],
        correct: 'Price',
      },
    ],
  },

  {
    id: 'desalination',
    title: 'The Arithmetic of Desalination',
    topic: 'Water engineering',
    level: 'C1',
    paragraphs: [
      'Desalination is often described as the obvious answer to water scarcity, and on a spreadsheet it is: a seawater plant produces a litre for a few cents, and no other source requires quite so little land. The difficulty is that the comparison is usually drawn against the cheapest source rather than the one a particular place has. A coastal city adjoining a well managed river has no reason to desalinate, not because the water is unsuitable but because the river is cheaper and less energy intensive. Desalination wins where alternatives are absent or worse, which is a narrower condition than the one usually claimed for it.',
      'The energy figure requires care because it depends almost entirely on where the brine is discharged. Standard reverse osmosis needs pressure in the region of sixty-five bars, and recovering that pressure from the brine rather than paying for it fresh typically accounts for more than half of the plant load. That recovery is only worthwhile where there is somewhere to send the concentrated brine. Discharging it into an estuary with strong tidal exchange carries it away; discharging it into a semi enclosed lagoon does not, and the salinity gradient that results kills the organisms at the boundary.',
      'Brine therefore converts an energy problem into a planning problem, and this is the part that is usually omitted from public debate. A plant needs not only a feed source and a discharge route but a corridor between them, and if the corridor crosses ground used for fishing, agriculture or settlement it becomes a licensing negotiation rather than an engineering one. This is why plants clustered on the arid coasts of the world tend to have very long pipelines, and why the capital cost varies by a factor of several between neighbouring sites with identical water quality.',
      'Desalination has one advantage that is often dismissed because it is intangible. It produces a supply that is independent of rainfall, and independence has value that does not show up in a cost per tonne calculation. A city that depends entirely on a reservoir is exposed once, catastrophically, to a sequence of dry years. A city with two sources is exposed to neither as severely. Whether that insurance is worth a higher unit cost depends on how expensive the alternative failure would be, which is a question for the city rather than for the plant.',
      'It is also worth being clear about what desalination cannot do. It cannot fix a distribution network that leaks a third of its water, and in several cities the cheaper and faster intervention by a wide margin was pipe maintenance rather than new supply. It cannot be sited where there is no power, which excludes exactly the places where water is scarcest. And it does not remove the need for conservation, because a city that gains a new supply will ordinarily use the additional capacity rather than treat it as reserve.',
      'None of this makes desalination a poor technology. It makes it a technology with conditions, and the conditions are geographical, legal and political rather than technical. The arithmetic on a cost per tonne will always favour it in the abstract; the arithmetic that matters includes the pipeline, the licence and the decade the plant will operate for.',
    ],
    keyTerms: ['desalination', 'brine', 'reverse osmosis', 'energy recovery', 'corridor', 'source independence'],
    readAloud:
      'Desalination is often described as the obvious answer to water scarcity, and on a spreadsheet it is: a seawater plant produces a litre for a few cents, and no other source requires quite so little land. The difficulty is that the comparison is usually drawn against the cheapest source rather than the one a particular place has.',
    repeatSentences: [
      'The comparison is drawn against the cheapest source rather than the available one.',
      'Recovering pressure from brine accounts for more than half the plant load.',
      'Recovery is only worthwhile where there is somewhere to send the brine.',
      'A plant needs a feed source, a discharge route and a corridor between them.',
      'Independence from rainfall has value that does not appear in unit cost.',
    ],
    swt: {
      id: 'swt-desalination',
      summary:
        'The passage argues that desalination is cost effective only where alternatives are absent or worse, that brine disposal converts an energy problem into a planning and licensing one because plants need a discharge corridor, and that its main advantage is independence from rainfall rather than a low unit cost.',
      excerptLabel: 'Brine and the planning problem',
      excerpt: [
        'Brine therefore converts an energy problem into a planning problem, and this is the part that is usually omitted from public debate. A plant needs not only a feed source and a discharge route but a corridor between them, and if the corridor crosses ground used for fishing, agriculture or settlement it becomes a licensing negotiation rather than an engineering one. This is why plants clustered on the arid coasts of the world tend to have very long pipelines, and why the capital cost varies by a factor of several between neighbouring sites with identical water quality.',
        'Desalination has one advantage that is often dismissed because it is intangible. It produces a supply that is independent of rainfall, and independence has value that does not show up in a cost per tonne calculation. A city that depends entirely on a reservoir is exposed once, catastrophically, to a sequence of dry years. A city with two sources is exposed to neither as severely. Whether that insurance is worth a higher unit cost depends on how expensive the alternative failure would be, which is a question for the city rather than for the plant.',
      ],
      keyTerms: ['brine', 'discharge', 'corridor', 'licensing', 'independent', 'rainfall', 'cost'],
      minWords: 20,
    },
    dropdown: {
      id: 'fibd-desalination',
      text:
        'Desalination is cost effective only where alternatives are absent or ______ . Standard reverse osmosis needs high ______ , and recovering it from the brine rather than paying for it fresh usually accounts for over half the plant ______ . Brine disposal therefore converts an engineering problem into a ______ problem, because a plant also needs a corridor between the feed source and the discharge ______ .',
      bank: ['worse', 'pressure', 'load', 'planning', 'scarcer', 'engineering', 'volume', 'route', 'worser'],
      answers: ['worse', 'pressure', 'load', 'planning', 'route'],
    },
    tableFib: {
      id: 'fibt-desalination',
      context: [
        'Three proposed sites were compared on the parameters that determine whether a plant is viable. The table reports feed water quality, brine disposal method, pipeline length to the discharge point and the resulting capital cost index, where a lower index is cheaper.',
      ],
      headers: ['Site', 'Feed quality', 'Disposal', 'Pipeline (km)', 'Cost index'],
      rows: [
        ['North point', '34,000 ppm', 'Tidal estuary', '2', '100'],
        ['Cape', '34,500 ppm', null, '64', '186'],
        ['South point', '33,800 ppm', 'Deep ocean', null, '131'],
      ],
      answers: ['Lagoon', '28 km'],
    },
    mcqSingle: {
      id: 'mcqs-desalination',
      question: 'According to the third paragraph, what does a plant need besides a feed source and a discharge route?',
      options: ['A corridor between them', 'A second feed source', 'A desalination licence', 'A brackish water supply'],
      correct: ['A corridor between them'],
    },
    mcqMultiple: {
      id: 'mcqm-desalination',
      question: 'Which two does the passage say desalination cannot do?',
      options: [
        'Fix a distribution network that loses a third of its water',
        'Operate without a reliable power supply',
        'Produce water of a quality fit for drinking',
        'Reduce the energy used by reverse osmosis',
        'Operate without discharging brine',
      ],
      correct: [
        'Fix a distribution network that loses a third of its water',
        'Operate without a reliable power supply',
      ],
    },
    asq: [
      {
        id: 'asq-desal-1',
        question: 'What does energy recovery from brine usually account for?',
        options: ['Over half the plant load', 'Under a tenth of the cost', 'The entire capital cost', 'A small part of the discharge'],
        correct: 'Over half the plant load',
      },
      {
        id: 'asq-desal-2',
        question: 'Why does the passage say a city with two water sources is less exposed?',
        options: [
          'It is exposed less severely to either failure',
          'It pays a lower unit cost',
          'It can shut the second source down',
          'It avoids planning consent',
        ],
        correct: 'It is exposed less severely to either failure',
      },
      {
        id: 'asq-desal-3',
        question: 'What does the author say the arithmetic that matters includes?',
        options: [
          'The pipeline, the licence and the operating life',
          'The cost per tonne and the feed salinity',
          'The rainfall record and the reservoir capacity',
          'The population served and the tariff charged',
        ],
        correct: 'The pipeline, the licence and the operating life',
      },
    ],
  },

  {
    id: 'late-lecture',
    title: 'The Lecture Is Not the Course',
    topic: 'University teaching',
    level: 'B2',
    paragraphs: [
      'The university lecture predates the textbook by several centuries and survives largely because it does something the textbook does not: it is live. A lecturer can notice from the faces that a class has not understood a distinction, and change what they say next. Nothing in a printed page can do this, which is the honest and considerable advantage of the format and the reason its decline has been treated for forty years as a straightforward loss.',
      'The difficulty is that the advantage and the cost travel together, and the cost is attention. A lecture requires an hour of continuous presence during which a student cannot go faster, cannot go back, and cannot look anything up. For material that is stable, widely available in written form and easy to test independently, this is a poor use of an hour that a recording and a document would serve better. For material that is not stable, or where the reasoning matters more than the conclusion, the hour is where something happens that cannot be reproduced afterwards.',
      'This has produced a large and rather uninteresting literature about blended provision, most of which concludes that recorded lectures work as well as live ones for well prepared students and considerably worse for those who are not. That finding is robust and also beside the point, because attendance and preparation are not independent variables. A student who does not attend is, almost by definition, less prepared, so the comparison measures the difference between two groups rather than the effect of the format.',
      'The genuinely difficult cases are the ones where the subject itself is the disagreement. Where a field has an active disagreement — whether to use a particular statistical method, how to weight competing harms, what counts as evidence — a lecture can perform something a recording cannot, because it can show a disagreement happening. A student watching two colleagues disagree about a real case learns more about how the field thinks than from a settled summary of either position.',
      'What has weakened the argument is not the recording but the examination. Assessments that can be answered from a summary reward attendance least when it is most needed, and reward the student who prepared once and retained it. The lecture survives in the places where assessment and teaching still agree with each other, which is largely where the teaching is done by people who chose to do it.',
      'It is tempting to conclude that lectures will be replaced by materials and that this is a simple case of technology improving on an older arrangement. The evidence does not support that. What is happening is more accurately described as a reallocation: the transmission of content has become cheap and the attention that surrounds it has not, and the scarce thing has moved from information to the occasions on which people are together with the material in front of them.',
    ],
    keyTerms: ['lecture', 'live', 'recording', 'attention', 'preparation', 'disagreement'],
    readAloud:
      'The university lecture predates the textbook by several centuries and survives largely because it does something the textbook does not: it is live. A lecturer can notice from the faces that a class has not understood a distinction, and change what they say next.',
    repeatSentences: [
      'The lecture survives because it is live in a way that a printed page is not at all.',
      'A lecture requires an hour of continuous presence without going faster.',
      'Attendance and preparation, the passage notes, are not independent variables.',
      'The comparison measures the difference between two groups, not the format.',
      'The scarce thing has moved from information to the occasions of being together.',
    ],
    swt: {
      id: 'swt-late-lecture',
      summary:
        'The passage argues that lectures remain valuable because they are live and can show a field disagreeing with itself, that the extensive finding that recordings work as well for prepared students is confounded because attendance and preparation are correlated, and that the real change is a reallocation of attention rather than the replacement of a format.',
      excerptLabel: 'What the evidence actually shows',
      excerpt: [
        'This has produced a large and rather uninteresting literature about blended provision, most of which concludes that recorded lectures work as well as live ones for well prepared students and considerably worse for those who are not. That finding is robust and also beside the point, because attendance and preparation are not independent variables. A student who does not attend is, almost by definition, less prepared, so the comparison measures the difference between two groups rather than the effect of the format.',
        'What has weakened the argument is not the recording but the examination. Assessments that can be answered from a summary reward attendance least when it is most needed, and reward the student who prepared once and retained it. The lecture survives in the places where assessment and teaching still agree with each other, which is largely where the teaching is done by people who chose to do it.',
      ],
      keyTerms: ['recorded lectures', 'well prepared', 'independent variables', 'comparison', 'assessment', 'reward'],
      minWords: 20,
    },
    dropdown: {
      id: 'fibd-late-lecture',
      text:
        'The lecture survives because it is ______ : a lecturer can notice that a class has misunderstood and change what is said next. It also requires continuous ______ , during which a student cannot go faster or look anything up. Research concluding that ______ lectures work as well for prepared students is beside the point, because attendance and preparation are not ______ variables.',
      bank: ['live', 'attention', 'recorded', 'independent', 'archive', 'dependent', 'written', 'asynchronous', 'interchangeable'],
      answers: ['live', 'attention', 'recorded', 'independent'],
    },
    tableFib: {
      id: 'fibt-late-lecture',
      context: [
        'Two departments were compared on how provision changed after lectures were recorded. The table reports provision before and after, the pass rate and the share of students who had watched any recording, which is the outcome the study was designed to measure.',
      ],
      headers: ['Department', 'Live before', 'Live after', 'Pass rate', 'Watched recording'],
      rows: [
        ['A', '90%', '35%', '68%', '41%'],
        ['B', '90%', '35%', '72%', '66%'],
        ['C', '90%', null, '74%', '78%'],
        ['D', '90%', '30%', null, '58%'],
      ],
      answers: ['35%', 'Reported as 69%'],
    },
    mcqSingle: {
      id: 'mcqs-late-lecture',
      question: 'According to the third paragraph, why is the finding that recordings work comparable?',
      options: [
        'Attendance and preparation are correlated, so it compares two groups',
        'The studies used too few students to be reliable',
        'The recordings were of poor quality',
        'Students who attended were assessed more strictly',
      ],
      correct: ['Attendance and preparation are correlated, so it compares two groups'],
    },
    mcqMultiple: {
      id: 'mcqm-late-lecture',
      question: 'Which two cases does the passage identify as difficult for a lecture?',
      options: [
        'Material that is stable and easy to test independently',
        'A field with an active disagreement about method',
        'Material taught to large cohorts',
        'Assessments answerable from a summary',
        'Settling disputes about historical fact',
      ],
      correct: [
        'Material that is stable and easy to test independently',
        'A field with an active disagreement about method',
      ],
    },
    asq: [
      {
        id: 'asq-lecture-1',
        question: 'What advantage does the passage give the lecture over a textbook?',
        options: ['It is live', 'It is shorter', 'It is free', 'It is examinable'],
        correct: 'It is live',
      },
      {
        id: 'asq-lecture-2',
        question: 'According to the passage, what has weakened the case for lectures?',
        options: ['The examination', 'The recording quality', 'The rise of textbooks', 'Student numbers'],
        correct: 'The examination',
      },
      {
        id: 'asq-lecture-3',
        question: 'What does the author say has become scarce?',
        options: ['Attention around material', 'Recorded material', 'Examined subjects', 'Textbook editions'],
        correct: 'Attention around material',
      },
    ],
  },
]