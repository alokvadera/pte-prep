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
      'Museums hold collections that may have substantial cultural or market value, but many face legal, trust or professional constraints on selling collection objects. The term deaccessioning describes removing an object from a collection, often by sale, and the rules vary between institutions and jurisdictions. The marginal cost of one more visitor may be low compared with the fixed cost of keeping a building open, so admission price is also a choice about access, revenue and the kind of experience a museum signals.',
      'One approach is to charge no admission and fund operating costs through philanthropy or government support. Evaluations of museums that removed admission charges have reported increases in attendance, although the size and composition of the change vary. Some studies find that free entry can bring in people who previously did not attend, while other barriers such as travel, time and familiarity continue to matter.',
      'A common objection is that free admission can subsidize visitors who already have the leisure and education to use cultural institutions. The distribution of who pays for a subsidy and who uses it are separate questions, and the answer depends on the funding model and visitor population. Evaluations have reported different effects on first-time visits and repeat attendance, so the results should not be generalized to every museum.',
      'A testable claim is that price is only one constraint on cultural participation; travel, time and familiarity may also matter. This predicts that a museum which removes admission charges while leaving its hours, location and programming unchanged may see attendance rise while its visitor mix changes more slowly.',
    ],
    keyTerms: [
      'deaccessioning rules',
      'marginal cost',
      'philanthropy',
      'attendance',
      'composition',
    ],
    readAloud:
      'Many museums face legal, trust or professional constraints on selling collection objects, and the rules vary between institutions and jurisdictions.',
    repeatSentences: [
      'Deaccessioning rules vary between museums and jurisdictions.',
      'The marginal cost of an additional visitor may be low compared with the fixed cost of a museum building.',
      'Evaluations of free admission report varied effects on attendance and visitor mix.',
      'Travel, time and familiarity can remain barriers when admission is free.',
      'The effects of an admission policy depend on its funding model and visitor population.',
    ],
    swt: {
      id: 'swt-museum-economics',
      summary:
        'The passage explains that museums face different constraints on selling collection objects and that admission prices balance access and revenue. Evaluations of free admission have reported increases in attendance, but the size and composition of the change vary. Travel, time and familiarity may remain barriers, so the effect depends on the museum and its visitors.',
      excerptLabel: 'Who free entry brings',
      excerpt: [
        'A common objection is that free admission can subsidize visitors who already have the leisure and education to use cultural institutions. The distribution of who pays for a subsidy and who uses it are separate questions, and the answer depends on the funding model and visitor population. Evaluations have reported different effects on first-time visits and repeat attendance, so the results should not be generalized to every museum.',
        'The passage proposes that travel, time and familiarity may remain barriers even when admission is free. It predicts that removing ticket charges can increase attendance while changing its composition more slowly, and that addressing practical barriers could affect who visits. These are testable claims rather than universal findings.',
      ],
      keyTerms: [
        'free entry',
        'access',
        'visitor mix',
        'attendance',
        'ancillary costs',
        'composition',
      ],
      minWords: 20,
    },
    dropdown: {
      id: 'fibd-museum-economics',
      text: 'Many museums face legal, trust or professional ______ on selling collection objects, and these rules vary. Deaccessioning describes removing an object from a ______. One admission policy is to charge nothing and fund operating costs through philanthropy or government ______. Even then, barriers such as travel, time and ______ can continue to matter.',
      bank: [
        'constraints',
        'collection',
        'support',
        'familiarity',
        'auction',
        'fixed',
        'arrives',
        'hidden',
      ],
      answers: ['constraints', 'collection', 'support', 'familiarity'],
    },
    tableFib: {
      id: 'fibt-museum-economics',
      context: [
        'Illustrative teaching data (not findings from a published policy review) compare four city museums before and after example changes to admission pricing and programming. The table records the pricing model, annual attendance change, shift in first-time visitor share, and main operating-fund source.',
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
      question:
        'According to the passage, why is admission price more than a way to cover per-visitor costs?',
      options: [
        'Because it is also a choice about access, revenue and the experience a museum signals',
        'Because ticket prices must cover the full cost of the collection',
        'Because government subsidy sets a fixed ceiling on admission prices',
        'Because visitors judge the quality of exhibitions from gift shop prices',
      ],
      correct: [
        'Because it is also a choice about access, revenue and the experience a museum signals',
      ],
    },
    mcqMultiple: {
      id: 'mcqm-museum-economics',
      question: 'Which two points does the passage make about free admission?',
      options: [
        'Evaluations have reported increased attendance, though the size of the change varies',
        'It is always funded entirely by government subsidy',
        'Travel, time and familiarity may remain barriers',
        'It guarantees that new visitors will return frequently',
        'It reduces the fixed cost of keeping the building open',
      ],
      correct: [
        'Evaluations have reported increased attendance, though the size of the change varies',
        'Travel, time and familiarity may remain barriers',
      ],
    },
    asq: [
      {
        id: 'asq-museum-1',
        question: 'What term describes removing an object from a museum collection, often by sale?',
        options: ['Deaccessioning', 'Admission pricing', 'Timed ticketing'],
        correct: 'Deaccessioning',
      },
      {
        id: 'asq-museum-2',
        question: 'What have some evaluations reported after museums removed admission charges?',
        options: [
          'Attendance increased, with the size of the change varying',
          'Attendance always doubled',
          'Attendance stayed unchanged in every case',
        ],
        correct: 'Attendance increased, with the size of the change varying',
      },
      {
        id: 'asq-museum-3',
        question:
          'Which barriers may continue to affect participation even when admission is free?',
        options: [
          'Travel, time and familiarity',
          'The price of admission',
          'The size of the collection',
        ],
        correct: 'Travel, time and familiarity',
      },
    ],
  },

  {
    id: 'subscription-commerce',
    title: 'Why Everything Became a Subscription',
    topic: 'Business and commerce',
    level: 'B2',
    paragraphs: [
      'The subscription model replaces a one-off payment with recurring revenue. This can make income more predictable, although the result depends on how long customers stay, how often they pay and how much it costs to serve them. Predictable revenue may inform business forecasts and valuations, but it does not guarantee access to financing or business success.',
      'Two useful measures are acquisition cost and churn. Churn is the rate at which subscribers leave; when churn is high, a company must keep finding new customers to maintain its subscriber base. Habit, integration into a daily routine and accumulated value such as playlists, files or purchase history can encourage customers to stay, though their effects vary by service and customer.',
      'A strong objection is that some subscriptions rely on inertia, including customers who forget to cancel. Some services have also been criticized for making cancellation difficult. A more durable model offers value that customers continue to use. One way to examine this is to compare usage and retention over time, while accounting for differences between products and customers.',
      'A testable hypothesis is that businesses with high acquisition costs and low churn can develop different revenue patterns from businesses with cheaper acquisition or higher churn. As markets mature, firms may adjust the balance between acquiring and retaining customers, or bundle products to encourage continued use. These patterns should be examined across sectors rather than assumed to describe every subscription business.',
    ],
    keyTerms: [
      'subscription model',
      'acquisition cost',
      'churn',
      'switching costs',
      'stored value',
      'retention',
    ],
    readAloud:
      'The subscription model replaces a one-off payment with recurring revenue. This can make income more predictable, although the result depends on how long customers stay, how often they pay and how much it costs to serve them.',
    repeatSentences: [
      'Recurring revenue can be more predictable, although results depend on retention and service costs.',
      'Acquisition cost and churn both affect a subscription business.',
      'Churn is the rate at which subscribers leave, and it compounds over time.',
      'Habit and accumulated value can encourage customers to continue a subscription.',
      'Firms may adjust the balance between acquiring and retaining customers as markets mature.',
    ],
    swt: {
      id: 'swt-subscription-commerce',
      summary:
        'The passage explains that subscriptions replace one-off payments with recurring revenue, whose predictability depends on customer retention and service costs. Acquisition cost and churn shape the economics, while habit and accumulated value can encourage continued use. Some services face criticism for cancellation friction. The passage proposes examining retention and usage over time, while treating patterns across sectors as hypotheses rather than universal rules.',
      excerptLabel: 'Retention rather than inertia',
      excerpt: [
        'Some subscription services have been criticized for relying on customer inertia, including cancellation flows that are difficult to use. A more durable model offers value that customers continue to use. Usage and retention can be examined over time, while accounting for differences between products and customers.',
        'The passage proposes testing whether acquisition costs, churn and customer use change as subscription markets mature. Firms may alter the balance between acquiring and retaining customers, or bundle products to encourage continued use. These patterns should be examined across sectors rather than assumed to describe every subscription business.',
      ],
      keyTerms: [
        'churn',
        'acquisition cost',
        'stored value',
        'switching costs',
        'retention',
        'tenure',
      ],
      minWords: 20,
    },
    dropdown: {
      id: 'fibd-subscription-commerce',
      text: 'A subscription replaces a one-off sale with recurring revenue, which may make income more ______. The economics depend on acquisition cost and ______. Habits and accumulated value can ______ customers to stay, such as playlists and purchase ______. Firms may adjust the balance between acquisition and retention as markets ______.',
      bank: [
        'predictable',
        'churn',
        'encourage',
        'history',
        'mature',
        'growth',
        'records',
        'renew',
      ],
      answers: ['predictable', 'churn', 'encourage', 'history', 'mature'],
    },
    tableFib: {
      id: 'fibt-subscription-commerce',
      context: [
        'Illustrative teaching data (not observations from real businesses) compare four subscription services. The table shows example acquisition spending, annual churn, usage change with tenure, and strategy.',
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
      question: 'What can recurring revenue do, according to the passage?',
      options: [
        'It can make income more predictable, depending on retention and service costs',
        'Because it removes the need to advertise to anyone at all',
        'Because customers prefer paying small amounts over time',
        'Because it guarantees that subscribers never leave',
      ],
      correct: ['It can make income more predictable, depending on retention and service costs'],
    },
    mcqMultiple: {
      id: 'mcqm-subscription-commerce',
      question: 'Which two factors can encourage subscribers to stay?',
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
      'In many common-law systems, a precedent’s binding force is associated with its ratio decidendi: the legal reasoning necessary to the decision. Later courts may distinguish a case when material facts differ, or overrule a precedent where the jurisdiction’s rules allow it. The balance between these methods varies by court and legal system. This can make the law appear stable over short periods while still changing over longer ones.',
      'The strongest objection is that precedent preserves injustice, because a decision once made stands until a court is willing to revisit it, and the parties who need the law to change are rarely the parties who can litigate it. The difference is that precedent makes the reasoning inspectable, and what can be inspected can be argued against.',
      'A testable claim is that precedent may be more useful where rules are dense and disputes recur than in areas with novel questions. This predicts that legal systems or fields that rely more heavily on precedent could show different costs or rates of doctrinal change. Those effects would need to be measured while accounting for differences in procedure, courts and the kinds of disputes involved.',
    ],
    keyTerms: [
      'precedent',
      'stare decisis',
      'ratio',
      'distinguishing',
      'overruling',
      'jurisdiction',
    ],
    readAloud:
      'Precedent can help people anticipate legal consequences. In many common-law systems, a decision’s binding force is associated with its necessary legal reasoning, while later courts may distinguish it or overrule it under applicable rules.',
    repeatSentences: [
      'In many common-law systems, higher-court decisions can bind lower courts in the same jurisdiction.',
      'The value of precedent is the ability to anticipate legal consequences before acting.',
      'Courts may distinguish earlier cases when material facts differ.',
      'Legal doctrine can appear stable over short periods while changing over longer ones.',
      'Precedent makes the reasoning of judges inspectable, and what can be inspected can be argued against.',
    ],
    swt: {
      id: 'swt-precedent-law',
      summary:
        'The passage explains that precedent can help people anticipate legal consequences. In many common-law systems, a decision’s binding force is associated with its necessary legal reasoning, while later courts may distinguish it or overrule it under applicable rules. These methods vary by jurisdiction. Precedent can preserve injustice, but its reasoning can also be inspected and challenged.',
      excerptLabel: 'Change through distinguishing',
      excerpt: [
        'In many common-law systems, a precedent’s binding force is associated with its ratio decidendi: the legal reasoning necessary to the decision. Later courts may distinguish a case when material facts differ, or overrule a precedent where the jurisdiction’s rules allow it. The balance between these methods varies by court and legal system. This can make the law appear stable over short periods while still changing over longer ones.',
        'Precedent can preserve injustice, because a decision may remain in place until a court or legislature changes the law. At the same time, recording the reasoning makes it possible for lawyers and judges to examine and challenge it. The passage treats this as a trade-off, not a guarantee that precedent produces fair outcomes.',
      ],
      keyTerms: ['precedent', 'distinguishing', 'overruling', 'ratio', 'inspectable', 'analogy'],
      minWords: 20,
    },
    dropdown: {
      id: 'fibd-precedent-law',
      text: 'In many common-law systems, higher-court decisions can bind lower courts in the same ______. Precedent can help people anticipate legal ______ before acting. A court may ______ an earlier case when material facts differ, or ______ it under the rules of its jurisdiction. These methods can contribute to legal change over ______.',
      bank: [
        'jurisdiction',
        'consequences',
        'distinguish',
        'overrule',
        'time',
        'country',
        'rights',
        'citing',
        'reversing',
        'encouraging',
        'precedent',
      ],
      answers: ['jurisdiction', 'consequences', 'distinguish', 'overrule', 'time'],
    },
    tableFib: {
      id: 'fibt-precedent-law',
      context: [
        'Illustrative teaching data (not findings from a comparative court study) show four hypothetical ways courts might treat an earlier contract decision, including court level, effect on future cases, and doctrine used.',
      ],
      headers: [
        'Court',
        'Treatment of earlier case',
        'Court level',
        'Effect on future cases',
        'Doctrine used',
      ],
      rows: [
        ['A', 'Followed', 'Supreme', 'Binding', 'Stare decisis'],
        ['B', 'Distinguished on facts', 'Appellate', 'Persuasive', null],
        ['C', null, 'Supreme', 'Binding', 'Stare decisis'],
        ['D', 'Overruled', 'Supreme', 'No longer binding', 'Open revision'],
      ],
      answers: ['Distinguishing', 'Followed'],
    },
    mcqSingle: {
      id: 'mcqs-precedent-law',
      question:
        'According to the passage, what does stare decisis primarily give to ordinary people?',
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
      question: 'Which two statements about legal change does the passage support?',
      options: [
        'Courts may distinguish cases when material facts differ',
        'It changes mainly through frequent overruling of old decisions',
        'It looks stable year to year yet transforms over a generation',
        'The balance between distinguishing and overruling varies by court and legal system',
        'It prevents all legal change until Parliament intervenes',
      ],
      correct: [
        'Courts may distinguish cases when material facts differ',
        'The balance between distinguishing and overruling varies by court and legal system',
      ],
    },
    asq: [
      {
        id: 'asq-precedent-1',
        question: 'What part of an earlier decision does a precedent bind?',
        options: [
          'Its necessary reasoning, the ratio',
          'Every remark the judge made',
          'The facts of the original dispute',
        ],
        correct: 'Its necessary reasoning, the ratio',
      },
      {
        id: 'asq-precedent-2',
        question:
          'What can a later court do when a precedent’s material facts differ from the current case?',
        options: [
          'Distinguish the earlier case',
          'Ignore every earlier decision in its jurisdiction',
          'Automatically overrule the higher court',
        ],
        correct: 'Distinguish the earlier case',
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
      'Taste feels like the most private thing a person has, which is exactly why sociologists study it. The mechanism is practice rather than instruction, and sociologists call the resulting set of dispositions habitus. Children absorb what counts as natural in their household — how to dress, what to eat, which music is serious — and later experience these absorbed preferences as personal judgement rather than as inheritance.',
      'One sociological account describes taste as distinction: preferences can mark group membership and social position. Familiarity with particular styles often develops through exposure, although people can adopt new preferences and the signals associated with taste vary across settings.',
      'A competing account emphasizes the role of markets, which produce and promote styles as well as respond to consumer demand. These explanations can interact: industries may target styles to particular groups, while consumers use, adapt or reject them. The idea that a style loses status when it becomes widely imitated is a proposed pattern, not a rule that applies to every cultural good.',
      'A testable hypothesis is that, in some settings, class background may be associated with cultural preferences even among people with similar incomes, because exposure begins in childhood. This predicts that households with similar incomes but different class origins could differ in cultural consumption, and that some upwardly mobile adults may change visible consumption faster than less visible preferences.',
    ],
    keyTerms: [
      'habitus',
      'distinction',
      'social class',
      'cultural consumption',
      'signal value',
      'inheritance',
    ],
    readAloud:
      'Sociologists study how social context can shape taste. One concept they use is habitus: a set of dispositions acquired through experience that can make some preferences feel natural rather than learned.',
    repeatSentences: [
      'Habitus describes dispositions acquired through experience that can make preferences feel natural.',
      'Exposure in childhood may shape some cultural preferences alongside other influences.',
      'One sociological account describes taste as a way preferences can mark group membership.',
      'Markets can promote cultural styles while also responding to consumer demand.',
      'Class background may relate to cultural preferences even among people with similar incomes.',
    ],
    swt: {
      id: 'swt-sociology-of-taste',
      summary:
        'The passage describes how social experience may shape taste through habitus, while markets also create and promote cultural styles. It presents distinction as one account of how preferences can signal group membership, and proposes a testable hypothesis that class background may relate to cultural consumption even among people with similar incomes. These claims are presented as patterns to investigate, not universal rules.',
      excerptLabel: 'The cycle of distinction',
      excerpt: [
        'One sociological account describes taste as distinction: preferences can mark group membership and social position. Familiarity with particular styles often develops through exposure, although people can adopt new preferences and the signals associated with taste vary across settings.',
        'Markets also produce and promote styles while responding to consumer demand. The proposed relationship between class distinction and markets can therefore run in more than one direction. The idea that a style loses status when it becomes widely imitated is a pattern to investigate, not a rule that applies to every cultural good.',
      ],
      keyTerms: [
        'distinction',
        'habitus',
        'signal value',
        'imitation',
        'abandonment',
        'cultural goods',
      ],
      minWords: 20,
    },
    dropdown: {
      id: 'fibd-sociology-of-taste',
      text: 'The passage says taste can be shaped through ______ in childhood. One sociological account describes how preferences may signal group ______ and social position. Markets both produce styles and respond to consumer ______. The passage proposes that class background may relate to cultural consumption even among households with similar ______. This is presented as a testable ______, not a universal rule.',
      bank: [
        'practice',
        'membership',
        'demand',
        'incomes',
        'hypothesis',
        'tradition',
        'beauty',
        'market',
        'status',
        'education',
        'fact',
      ],
      answers: ['practice', 'membership', 'demand', 'incomes', 'hypothesis'],
    },
    tableFib: {
      id: 'fibt-sociology-of-taste',
      context: [
        'Illustrative teaching data (not findings from a sociological survey) compare four hypothetical households by class origin, income, childhood-class cultural consumption, and possible changes in taste after upward mobility.',
      ],
      headers: [
        'Household',
        'Class origin',
        'Income',
        'Childhood-class share',
        'Taste change after mobility',
      ],
      rows: [
        ['A', 'Working class', 'High', '61%', 'Slow'],
        ['B', 'Professional', 'High', '78%', null],
        ['C', 'Working class', null, '58%', 'Slow'],
        ['D', null, 'Middle', '52%', 'Fast'],
      ],
      answers: ['Fast', 'Middle', 'Professional'],
    },
    mcqSingle: {
      id: 'mcqs-sociology-of-taste',
      question: 'How does one sociological account describe the social role of taste?',
      options: [
        'Preferences can mark group membership and social position',
        'Because markets manufacture styles for every social class with equal skill',
        'Because people consciously choose preferences in order to impress others',
        'Because taste is fixed at birth and never changes afterwards',
      ],
      correct: ['Preferences can mark group membership and social position'],
    },
    mcqMultiple: {
      id: 'mcqm-sociology-of-taste',
      question: 'Which two hypotheses does the passage propose investigating about taste?',
      options: [
        'Equal-income households of different class origins could differ in consumption',
        'Markets will eventually eliminate all class differences in taste',
        'Some upwardly mobile adults may change visible consumption faster than less visible preferences',
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
        question: 'How can taste function socially in one account described by the passage?',
        options: [
          'Distinction, the sorting of people into groups',
          'Profit for cultural industries',
          'Entertainment for the household',
        ],
        correct: 'Distinction, the sorting of people into groups',
      },
      {
        id: 'asq-taste-3',
        question: 'What relationship does the passage propose investigating?',
        options: [
          'Whether class background relates to cultural preferences among people with similar incomes',
          'Whether income never affects cultural consumption',
          'Whether markets have no influence on style',
        ],
        correct:
          'Whether class background relates to cultural preferences among people with similar incomes',
      },
    ],
  },
]
