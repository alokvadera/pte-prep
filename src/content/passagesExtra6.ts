import type { Passage } from './schema'

/**
 * Additional original passages, volume six.
 *
 * These four broaden the bank into disciplines the real PTE Academic
 * Reading section draws on heavily but the bank underrepresented: the
 * economics of cultural institutions, the business model behind the
 * subscription economy, the function of precedent in common law, and
 * the sociology of taste. Each keeps the house style: state the
 * mechanism, concede the strongest objection, and close on a claim
 * that is falsifiable rather than rhetorical. All four passages are
 * original and written for this project.
 */

export const EXTRA_PASSAGES_6: Passage[] = [
  {
    id: 'museum-economics',
    title: 'The Economics of the Museum',
    topic: 'Cultural economics',
    level: 'C1',
    paragraphs: [
      'A museum is a business that is not allowed to behave like one. The collections it holds are worth enormous sums, yet most institutions are legally constrained from selling works to cover operating costs, a restriction known in the profession as the deaccessioning ban. Revenue therefore comes from the margins of the collection rather than the collection itself: admissions, memberships, gift shops and catering. The economics are strange in a specific way, because the marginal cost of one more visitor is close to zero while the fixed cost of keeping the building open is not, which makes pricing a signalling problem rather than a budgeting problem.',
      'The standard solution is to price admission at zero and to fund the gap through philanthropy and government subsidy. The mechanism is that a zero price clears the congestion problem poorly but the legitimacy problem well: a museum that turns away anyone who cannot pay loses the claim to be a public institution, and that claim is what donors and voters are buying. Free entry also changes who comes. Studies of museums that abolished charges find a large rise in attendance and a smaller rise in dwell time, with the new visitors disproportionately from groups that previously did not attend at all.',
      'The strongest objection is that free admission is a subsidy captured by the well-off, since the visitors who benefit most are often those with the leisure and education to use cultural goods. This is partly true, but the evidence cuts against the conclusion people draw from it: the income gradient in museum attendance is steep before free entry and flatter after it, and the flattening is driven by first-time visitors rather than by frequent visitors attending more often. A subsidy can be regressive in who pays and progressive in who arrives, and the two are separable questions.',
      'The falsifiable claim is that price is not the binding constraint on cultural participation but the ancillary costs are: travel, time and the expectation of not belonging. This predicts that a museum which cuts admission to zero while leaving opening hours, location and programming unchanged will see attendance rise but composition change slowly, and that a museum which adds evening programmes aimed at non-visitors will change composition faster than one which cuts price again. Both predictions have been tested, in London and in Melbourne, with the composition effect winning.',
    ],
    keyTerms: ['deaccessioning ban', 'marginal cost', 'philanthropy', 'congestion', 'attendance', 'composition'],
    readAloud:
      'A museum is a business that is not allowed to behave like one. The collections it holds are worth enormous sums, yet most institutions are legally constrained from selling works to cover operating costs.',
    repeatSentences: [
      'A museum is a business that is not allowed to behave like one, because its collection cannot be sold.',
      'The marginal cost of one more visitor is close to zero, while the fixed cost of the building is not.',
      'Free entry changes who comes, with new visitors drawn disproportionately from groups that previously did not attend.',
      'The income gradient in museum attendance is steep before free entry and flatter after it.',
      'A subsidy can be regressive in who pays and progressive in who arrives.',
    ],
    swt: {
      id: 'swt-museum-economics',
      summary:
        'The passage argues that museums price admission near zero because their collections cannot be sold and their marginal cost per visitor is negligible, that free entry flattens the income gradient in attendance by drawing first-time visitors rather than by attracting frequent ones, and that ancillary costs such as travel and time now bind harder than price.',
      excerptLabel: 'Who free entry brings',
      excerpt: [
        'The strongest objection is that free admission is a subsidy captured by the well-off, since the visitors who benefit most are often those with the leisure and education to use cultural goods. This is partly true, but the evidence cuts against the conclusion people draw from it: the income gradient in museum attendance is steep before free entry and flatter after it, and the flattening is driven by first-time visitors rather than by frequent visitors attending more often. A subsidy can be regressive in who pays and progressive in who arrives, and the two are separable questions.',
        'The falsifiable claim is that price is not the binding constraint on cultural participation but the ancillary costs are: travel, time and the expectation of not belonging. This predicts that a museum which cuts admission to zero while leaving opening hours, location and programming unchanged will see attendance rise but composition change slowly, and that a museum which adds evening programmes aimed at non-visitors will change composition faster than one which cuts price again. Both predictions have been tested, in London and in Melbourne, with the composition effect winning.',
      ],
      keyTerms: ['free entry', 'income gradient', 'first-time visitors', 'attendance', 'ancillary costs', 'composition'],
      minWords: 20,
    },
    dropdown: {
      id: 'fibd-museum-economics',
      text:
        'A museum is a business not allowed to behave like one, because rules on ______ stop it selling its collection. The marginal cost of an extra visitor is close to ______, so pricing is a signalling problem. The common solution is to charge nothing and fund the gap through philanthropy, which clears the legitimacy problem and changes who ______ . The binding constraint on participation is now not price but ______ costs such as travel and time.',
      bank: ['deaccessioning', 'zero', 'comes', 'ancillary', 'auction', 'fixed', 'arrives', 'hidden'],
      answers: ['deaccessioning', 'zero', 'comes', 'ancillary'],
    },
    tableFib: {
      id: 'fibt-museum-economics',
      context: [
        'A policy review compared four city museums before and after changes to admission pricing and programming. The table records the pricing model, the change in annual attendance, the shift in the share of first-time visitors, and the main funding source for operating costs.',
      ],
      headers: ['Museum', 'Pricing model', 'Attendance change', 'First-time share', 'Main funding'],
      rows: [
        ['A', 'Free entry', '+34%', '+12 points', 'Philanthropy'],
        ['B', 'Timed ticketing', '+9%', '+4 points', null],
        ['C', null, '+6%', '+2 points', 'Government'],
        ['D', 'Pay what you wish', '+18%', null, 'Memberships'],
      ],
      answers: ['Endowment', 'Admission charge', '+6 points'],
    },
    mcqSingle: {
      id: 'mcqs-museum-economics',
      question: 'According to the passage, why is museum pricing described as a signalling problem?',
      options: [
        'Because the marginal cost of an extra visitor is near zero',
        'Because ticket prices must cover the full cost of the collection',
        'Because government subsidy sets a fixed ceiling on admission prices',
        'Because visitors judge the quality of exhibitions from gift shop prices',
      ],
      correct: ['Because the marginal cost of an extra visitor is near zero'],
    },
    mcqMultiple: {
      id: 'mcqm-museum-economics',
      question: 'Which two claims does the passage make about free admission?',
      options: [
        'It produces a large rise in attendance',
        'It is always funded entirely by government subsidy',
        'It flattens the income gradient in museum attendance',
        'It guarantees that new visitors will return frequently',
        'It reduces the fixed cost of keeping the building open',
      ],
      correct: [
        'It produces a large rise in attendance',
        'It flattens the income gradient in museum attendance',
      ],
    },
    asq: [
      {
        id: 'asq-museum-1',
        question: 'What restriction prevents most museums from selling works from their collections?',
        options: ['The deaccessioning ban', 'The admission price', 'The opening hours'],
        correct: 'The deaccessioning ban',
      },
      {
        id: 'asq-museum-2',
        question: 'What happens to attendance when museums abolish admission charges?',
        options: ['It rises substantially', 'It falls slightly', 'It stays unchanged'],
        correct: 'It rises substantially',
      },
      {
        id: 'asq-museum-3',
        question: 'What does the passage identify as the binding constraint on participation now?',
        options: [
          'Ancillary costs such as travel and time',
          'The price of admission',
          'The size of the collection',
        ],
        correct: 'Ancillary costs such as travel and time',
      },
    ],
  },

  {
    id: 'subscription-commerce',
    title: 'Why Everything Became a Subscription',
    topic: 'Business and commerce',
    level: 'B2',
    paragraphs: [
      'The subscription model is usually described as a pricing fashion, but its mechanism is financial rather than aesthetic. A company that sells a product once receives a lump sum and must sell again, whereas a company that sells access receives a stream, and a stream can be valued, borrowed against and forecast. Revenue that recurs is worth more than revenue that must be re-earned each quarter, which is why firms in unrelated industries have converged on the same structure: software, cars, groceries and gym equipment now all rent rather than sell.',
      'The economics rest on two quantities: acquisition cost and churn. Acquiring a subscriber is expensive, because advertising, trials and discounts are paid before any revenue arrives. Churn is the rate at which subscribers leave, and it compounds, so a company with high churn must spend on acquisition continuously just to stand still. The model therefore rewards whatever reduces churn — habit, integration into daily routine, or the accumulation of stored value such as playlists, files or purchase history — and whatever raises switching costs also raises the value of the subscriber.',
      'The strongest objection is that subscriptions exploit inertia, charging customers who forgot to cancel, and there is evidence for it: cancellation flows are deliberately made difficult, and some services report that a material share of revenue comes from inactive members. This is real but it is not the whole mechanism, because churn-reduction that relies on forgetfulness decays as regulation and comparison tools spread. The durable version of the model sells something that genuinely becomes more useful over time, and the test is whether usage rises with tenure rather than whether cancellation is hard to find.',
      'The falsifiable claim is that subscription businesses converge on a characteristic shape: high acquisition cost, falling churn with tenure, and revenue that grows more slowly than user numbers once the market saturates. This predicts that a mature subscription firm will spend an increasing share of revenue on retention rather than acquisition, and that industries with low switching costs will abandon the model or add bundles to recreate them. Both have been observed: streaming services now bundle, and the fastest-growing subscription categories are those where stored value accumulates fastest.',
    ],
    keyTerms: ['subscription model', 'acquisition cost', 'churn', 'switching costs', 'stored value', 'retention'],
    readAloud:
      'The subscription model is usually described as a pricing fashion, but its mechanism is financial rather than aesthetic. A company that sells a product once receives a lump sum',
    repeatSentences: [
      'The subscription model converts a single sale into a revenue stream that can be valued and forecast.',
      'Acquiring a subscriber is expensive because advertising and discounts are paid before any revenue arrives.',
      'Churn is the rate at which subscribers leave, and it compounds over time.',
      'Whatever reduces churn also raises the value of the subscriber to the company.',
      'A mature subscription firm will spend more of its revenue on retention than on acquisition.',
    ],
    swt: {
      id: 'swt-subscription-commerce',
      summary:
        'The passage explains that the subscription model replaces one-off sales with recurring revenue that can be forecast and valued, that its economics turn on acquisition cost and churn, and that the durable version depends on stored value that raises usage with tenure rather than on cancellation friction, which regulation steadily erodes.',
      excerptLabel: 'Retention rather than inertia',
      excerpt: [
        'The strongest objection is that subscriptions exploit inertia, charging customers who forgot to cancel, and there is evidence for it: cancellation flows are deliberately made difficult, and some services report that a material share of revenue comes from inactive members. This is real but it is not the whole mechanism, because churn-reduction that relies on forgetfulness decays as regulation and comparison tools spread. The durable version of the model sells something that genuinely becomes more useful over time, and the test is whether usage rises with tenure rather than whether cancellation is hard to find.',
        'The falsifiable claim is that subscription businesses converge on a characteristic shape: high acquisition cost, falling churn with tenure, and revenue that grows more slowly than user numbers once the market saturates. This predicts that a mature subscription firm will spend an increasing share of revenue on retention rather than acquisition, and that industries with low switching costs will abandon the model or add bundles to recreate them. Both have been observed: streaming services now bundle, and the fastest-growing subscription categories are those where stored value accumulates fastest.',
      ],
      keyTerms: ['churn', 'acquisition cost', 'stored value', 'switching costs', 'retention', 'tenure'],
      minWords: 20,
    },
    dropdown: {
      id: 'fibd-subscription-commerce',
      text:
        'A subscription replaces a one-off sale with a revenue ______, which can be valued and forecast. The economics depend on acquisition cost and on ______, the rate at which subscribers leave. The model rewards whatever reduces churn, including stored value such as playlists and purchase ______. The durable version sells something that becomes more useful with ______, rather than relying on customers who forgot to ______.',
      bank: ['stream', 'churn', 'history', 'tenure', 'cancel', 'growth', 'records', 'renew'],
      answers: ['stream', 'churn', 'history', 'tenure', 'cancel'],
    },
    tableFib: {
      id: 'fibt-subscription-commerce',
      context: [
        'An analyst tracked four subscription businesses over three years, recording how they spent revenue and what happened to their subscriber base. The table shows the share of revenue spent on acquiring new subscribers, the annual churn rate, the change in average usage per subscriber with tenure, and the main strategy each firm pursues.',
      ],
      headers: ['Business', 'Acquisition spend', 'Annual churn', 'Usage with tenure', 'Strategy'],
      rows: [
        ['Streamly', '31%', '8%', 'Rising', 'Bundling'],
        ['FitLife', '22%', null, 'Rising', 'App ecosystem'],
        ['OfficeBox', null, '17%', 'Flat', 'Annual discounts'],
        ['CloudKeep', '18%', '6%', 'Rising', null],
      ],
      answers: ['4%', '28%', 'Stored files'],
    },
    mcqSingle: {
      id: 'mcqs-subscription-commerce',
      question: 'Why does the passage say recurring revenue is worth more than one-off revenue?',
      options: [
        'Because it can be valued, borrowed against and forecast',
        'Because it removes the need to advertise to anyone at all',
        'Because customers prefer paying small amounts over time',
        'Because it guarantees that subscribers never leave',
      ],
      correct: ['Because it can be valued, borrowed against and forecast'],
    },
    mcqMultiple: {
      id: 'mcqm-subscription-commerce',
      question: 'Which two does the passage give as factors that reduce churn?',
      options: [
        'Habit and integration into daily routine',
        'Larger discounts offered to new subscribers',
        'Stored value such as playlists and purchase history',
        'A faster cancellation flow for departing members',
        'Advertising spend paid before any revenue arrives',
      ],
      correct: [
        'Habit and integration into daily routine',
        'Stored value such as playlists and purchase history',
      ],
    },
    asq: [
      {
        id: 'asq-subscription-1',
        question: 'What does the subscription model convert a one-off sale into?',
        options: ['A recurring revenue stream', 'A lower retail price', 'A physical product lease'],
        correct: 'A recurring revenue stream',
      },
      {
        id: 'asq-subscription-2',
        question: 'What is churn in the subscription model?',
        options: [
          'The rate at which subscribers leave',
          'The cost of new advertising',
          'The length of the trial period',
        ],
        correct: 'The rate at which subscribers leave',
      },
      {
        id: 'asq-subscription-3',
        question: 'What does the durable version of the model sell?',
        options: [
          'Something more useful with tenure',
          'Something cheaper than competitors',
          'Something advertised before revenue',
        ],
        correct: 'Something more useful with tenure',
      },
    ],
  },

  {
    id: 'precedent-law',
    title: 'Why Courts Follow the Past',
    topic: 'Jurisprudence',
    level: 'C1',
    paragraphs: [
      'Precedent is often explained as a rule about obedience, but its function is economic. A court that decides cases without reference to past decisions produces law that is unpredictable, and unpredictability is a cost borne by everyone who plans around the law: contractors, testators, drivers. The doctrine of stare decisis binds a court to follow earlier decisions of higher courts in the same jurisdiction, and the value produced is not consistency for its own sake but the ability of ordinary people to anticipate legal consequences before acting.',
      'The mechanism is looser than the textbook suggests. A precedent binds only its ratio, the part of the reasoning that was necessary to the decision, and courts constantly distinguish earlier cases on their facts rather than overrule them. Overruling is rare because it admits error openly, while distinguishing achieves change quietly. This is why common law evolves at a pace that looks like stability from year to year and like transformation across a generation: the doctrine conserves legal change rather than preventing it.',
      'The strongest objection is that precedent preserves injustice, because a decision once made stands until a court is willing to revisit it, and the parties who need the law to change are rarely the parties who can litigate it. The objection is fair as far as it goes, but the comparison point matters: a system free of precedent is not free of past influence, because judges would still decide by analogy while denying that they do so. The difference is that precedent makes the reasoning inspectable, and what can be inspected can be argued against.',
      'The falsifiable claim is that precedent\'s benefit is measurably higher where the law is dense and the stakes are repeatable, and lower where cases are novel. This predicts that commercial jurisdictions with strong precedent will show lower legal costs per transaction than jurisdictions without one, and that novel areas such as digital privacy will develop doctrine more slowly than property or contract. Both predictions hold in the comparative literature, and the second follows from the first: where no ratio settles the question, distinguishing has nothing to work on.',
    ],
    keyTerms: ['precedent', 'stare decisis', 'ratio', 'distinguishing', 'overruling', 'jurisdiction'],
    readAloud:
      'Precedent is often explained as a rule about obedience, but its function is economic. A court that decides cases without reference to past decisions produces law',
    repeatSentences: [
      'Precedent binds a court to follow earlier decisions of higher courts in the same jurisdiction.',
      'The value of precedent is the ability to anticipate legal consequences before acting.',
      'A court distinguishes an earlier case on its facts rather than overruling it openly.',
      'Common law evolves slowly year to year yet transforms across a generation.',
      'Precedent makes the reasoning of judges inspectable, and what can be inspected can be argued against.',
    ],
    swt: {
      id: 'swt-precedent-law',
      summary:
        'The passage argues that precedent\'s function is to make legal consequences predictable rather than to enforce obedience, that common law changes through distinguishing rather than overruling, and that precedent\'s advantage over judge-made law without binding authority is that its reasoning is inspectable and therefore open to argument, even though it can also preserve injustice.',
      excerptLabel: 'Change through distinguishing',
      excerpt: [
        'The mechanism is looser than the textbook suggests. A precedent binds only its ratio, the part of the reasoning that was necessary to the decision, and courts constantly distinguish earlier cases on their facts rather than overrule them. Overruling is rare because it admits error openly, while distinguishing achieves change quietly. This is why common law evolves at a pace that looks like stability from year to year and like transformation across a generation: the doctrine conserves legal change rather than preventing it.',
        'The strongest objection is that precedent preserves injustice, because a decision once made stands until a court is willing to revisit it, and the parties who need the law to change are rarely the parties who can litigate it. The objection is fair as far as it goes, but the comparison point matters: a system free of precedent is not free of past influence, because judges would still decide by analogy while denying that they do so. The difference is that precedent makes the reasoning inspectable, and what can be inspected can be argued against.',
      ],
      keyTerms: ['precedent', 'distinguishing', 'overruling', 'ratio', 'inspectable', 'analogy'],
      minWords: 20,
    },
    dropdown: {
      id: 'fibd-precedent-law',
      text:
        'Precedent binds a court to follow earlier decisions of higher courts in the same ______. Its value is not consistency alone but the ability to anticipate legal ______ before acting. A court can change the law quietly by ______ an earlier case on its facts, rather than by ______ it openly. This means common law conserves legal change rather than ______ it.',
      bank: [
        'jurisdiction',
        'consequences',
        'distinguishing',
        'overruling',
        'preventing',
        'country',
        'rights',
        'citing',
        'reversing',
        'encouraging',
        'precedent',
      ],
      answers: ['jurisdiction', 'consequences', 'distinguishing', 'overruling', 'preventing'],
    },
    tableFib: {
      id: 'fibt-precedent-law',
      context: [
        'A comparative study described how four courts treated an earlier decision on contract formation. The table records how the earlier decision was treated, the level of the court that heard the later case, the stated effect on future cases, and the doctrine the court relied on.',
      ],
      headers: ['Court', 'Treatment of earlier case', 'Court level', 'Effect on future cases', 'Doctrine used'],
      rows: [
        ['A', 'Followed', 'Supreme', 'Binding', 'Stare decisis'],
        ['B', 'Distinguished on facts', 'Appellate', 'Persuasive', null],
        ['C', null, 'Supreme', 'Binding', 'Stare decisis'],
        ['D', 'Overruled', null, 'No longer binding', 'Open revision'],
      ],
      answers: ['Distinguishing', 'Followed', 'Appellate'],
    },
    mcqSingle: {
      id: 'mcqs-precedent-law',
      question: 'According to the passage, what does stare decisis primarily give to ordinary people?',
      options: [
        'The ability to anticipate legal consequences before acting',
        'The right to appeal any decision to a higher court',
        'A guarantee that past decisions will never change',
        'A cheaper way to settle disputes out of court',
      ],
      correct: ['The ability to anticipate legal consequences before acting'],
    },
    mcqMultiple: {
      id: 'mcqm-precedent-law',
      question: 'Which two does the passage say about how common law changes?',
      options: [
        'It changes mainly through distinguishing cases on their facts',
        'It changes mainly through frequent overruling of old decisions',
        'It looks stable year to year yet transforms over a generation',
        'It depends on judges admitting error openly in every decision',
        'It prevents all legal change until Parliament intervenes',
      ],
      correct: [
        'It changes mainly through distinguishing cases on their facts',
        'It looks stable year to year yet transforms over a generation',
      ],
    },
    asq: [
      {
        id: 'asq-precedent-1',
        question: 'What part of an earlier decision does a precedent bind?',
        options: ['Its necessary reasoning, the ratio', 'Every remark the judge made', 'The facts of the original dispute'],
        correct: 'Its necessary reasoning, the ratio',
      },
      {
        id: 'asq-precedent-2',
        question: 'Why is overruling rare compared with distinguishing?',
        options: [
          'Because it admits error openly',
          'Because it is forbidden by statute',
          'Because it costs more to litigate',
        ],
        correct: 'Because it admits error openly',
      },
      {
        id: 'asq-precedent-3',
        question: 'What does the passage say precedent makes inspectable?',
        options: ['The reasoning of judges', 'The income of litigants', 'The speed of trials'],
        correct: 'The reasoning of judges',
      },
    ],
  },

  {
    id: 'sociology-of-taste',
    title: 'The Sociology of Taste',
    topic: 'Sociology',
    level: 'C1',
    paragraphs: [
      'Taste feels like the most private thing a person has, which is exactly why sociologists study it. The claim is not that preferences are fake but that they are positioned: what a person calls beautiful, vulgar or refined tracks the social class they were raised in. The mechanism is practice rather than instruction, and sociologists call the resulting set of dispositions habitus. Children absorb what counts as natural in their household — how to dress, what to eat, which music is serious — and later experience these absorbed preferences as personal judgement rather than as inheritance.',
      'The social function is distinction. Preferences sort people into groups, and the sorting is valuable because it is hard to fake: acquiring the accent of a class takes years of exposure, so signalling through taste is reliable in a way that advertising is not. This explains the pattern that the tastes of a dominant class are imitated from below and then abandoned from above, a cycle that repeats across decades and across cultural goods, from clothing to cuisine to the names given to children.',
      'The strongest objection is that taste is simply what markets sell, and that the sociology of taste mistakes the supplier for the consumer. There is truth in it: industries do manufacture styles and do target them at classes. But the objection cannot explain the direction of the cycle, because the market follows the distinction it is accused of creating — a style priced for the imitators loses the signal value that made it desirable, and the dominant class moves on. Consumption is patterned by production, yet the pattern of distinction is older than any industry.',
      'The falsifiable claim is that taste correlates with class origin more strongly than with income, because the mechanism is exposure in childhood rather than purchasing power in adulthood. This predicts that two households with equal income but different class origins will differ measurably in cultural consumption, and that upwardly mobile adults will change their visible consumption faster than their deep preferences. Studies of cultural mobility find both, and the gap between what people buy and what they say they like remains the clearest evidence that taste is inherited rather than chosen.',
    ],
    keyTerms: ['habitus', 'distinction', 'social class', 'cultural consumption', 'signal value', 'inheritance'],
    readAloud:
      'Taste feels like the most private thing a person has, which is exactly why sociologists study it. The claim is not that preferences are fake but that they are positioned',
    repeatSentences: [
      'Taste is learned in the home before it is ever chosen by the person who holds it.',
      'Preferences track social class because they are absorbed through practice rather than taught directly.',
      'The social function of taste is distinction, because preferences sort people into groups.',
      'The tastes of a dominant class are imitated from below and abandoned from above.',
      'Taste correlates with class origin more strongly than with income in adulthood.',
    ],
    swt: {
      id: 'swt-sociology-of-taste',
      summary:
        'The passage argues that taste is socially positioned rather than private, that habitus acquired in childhood makes preferences function as reliable signals of class, and that the cycle of imitation and abandonment shows distinction predating any market, so taste correlates with class origin more strongly than with income.',
      excerptLabel: 'The cycle of distinction',
      excerpt: [
        'The social function is distinction. Preferences sort people into groups, and the sorting is valuable because it is hard to fake: acquiring the accent of a class takes years of exposure, so signalling through taste is reliable in a way that advertising is not. This explains the pattern that the tastes of a dominant class are imitated from below and then abandoned from above, a cycle that repeats across decades and across cultural goods, from clothing to cuisine to the names given to children.',
        'The strongest objection is that taste is simply what markets sell, and that the sociology of taste mistakes the supplier for the consumer. There is truth in it: industries do manufacture styles and do target them at classes. But the objection cannot explain the direction of the cycle, because the market follows the distinction it is accused of creating — a style priced for the imitators loses the signal value that made it desirable, and the dominant class moves on. Consumption is patterned by production, yet the pattern of distinction is older than any industry.',
      ],
      keyTerms: ['distinction', 'habitus', 'signal value', 'imitation', 'abandonment', 'cultural goods'],
      minWords: 20,
    },
    dropdown: {
      id: 'fibd-sociology-of-taste',
      text:
        'Taste is not chosen directly but learned in the home, through ______ rather than instruction. Preferences sort people into groups, and this function is called ______. A style priced for imitators loses the ______ value that made it desirable, so the dominant class moves on. Taste therefore correlates with class ______ more strongly than with income, because the mechanism is childhood ______ rather than purchasing power.',
      bank: [
        'practice',
        'distinction',
        'signal',
        'origin',
        'exposure',
        'tradition',
        'beauty',
        'market',
        'status',
        'education',
        'wealth',
      ],
      answers: ['practice', 'distinction', 'signal', 'origin', 'exposure'],
    },
    tableFib: {
      id: 'fibt-sociology-of-taste',
      context: [
        'A sociological survey asked four households about their cultural consumption and recorded class origin, current income, and the share of consumed cultural goods associated with the respondents\' childhood class. The table also records whether taste changed after the household moved up the social scale.',
      ],
      headers: ['Household', 'Class origin', 'Income', 'Childhood-class share', 'Taste change after mobility'],
      rows: [
        ['A', 'Working class', 'High', '61%', 'Slow'],
        ['B', 'Professional', 'High', '78%', null],
        ['C', 'Working class', null, '58%', 'Slow'],
        ['D', null, 'Middle', '52%', 'Fast'],
      ],
      answers: ['Minimal', 'Middle', 'Professional'],
    },
    mcqSingle: {
      id: 'mcqs-sociology-of-taste',
      question: 'According to the passage, why is taste a reliable signal of class?',
      options: [
        'Because acquiring it takes years of exposure that are hard to fake',
        'Because markets manufacture styles for every social class with equal skill',
        'Because people consciously choose preferences in order to impress others',
        'Because taste is fixed at birth and never changes afterwards',
      ],
      correct: ['Because acquiring it takes years of exposure that are hard to fake'],
    },
    mcqMultiple: {
      id: 'mcqm-sociology-of-taste',
      question: 'Which two predictions does the passage derive from its claim about taste?',
      options: [
        'Equal-income households of different class origins will differ in consumption',
        'Markets will eventually eliminate all class differences in taste',
        'Upwardly mobile adults change visible consumption faster than deep preferences',
        'Children will always reject the tastes of their own household',
        'Income is the strongest predictor of cultural consumption',
      ],
      correct: [
        'Equal-income households of different class origins will differ in consumption',
        'Upwardly mobile adults change visible consumption faster than deep preferences',
      ],
    },
    asq: [
      {
        id: 'asq-taste-1',
        question: 'What do sociologists call the dispositions acquired in childhood?',
        options: ['Habitus', 'Distinction', 'Inheritance'],
        correct: 'Habitus',
      },
      {
        id: 'asq-taste-2',
        question: 'What is the social function of taste according to the passage?',
        options: [
          'Distinction, the sorting of people into groups',
          'Profit for cultural industries',
          'Entertainment for the household',
        ],
        correct: 'Distinction, the sorting of people into groups',
      },
      {
        id: 'asq-taste-3',
        question: 'What does taste correlate with more strongly than income?',
        options: ['Class origin', 'Market supply', 'Personal wealth'],
        correct: 'Class origin',
      },
    ],
  },
]
