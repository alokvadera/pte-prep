import type { AudioScript, RetellItem } from './schema'

/**
 * Fifth audio batch: three single-speaker lectures with their
 * derived Re-tell Lecture items.
 *
 * The bank leans heavily on science, psychology and medicine, so
 * this batch widens the disciplinary spread the real exam uses:
 * one lecture each from economics, history and law, written as
 * analytical monologues with an evidence-based turn of argument.
 * Each Re-tell Lecture item points at the lecture it summarises,
 * and every key term it scores against is spoken in that recording.
 */

export const EXTRA_LECTURES_5: AudioScript[] = [
  {
    id: 'lec-price-signals',
    title: 'Why Price Signals Work',
    kind: 'lecture',
    topic: 'Economics',
    scene: 'An economist lecturing to first-year undergraduates.',
    speakers: [{ id: 's1', name: 'Dr Marsh', role: 'Lecturer', voiceHint: 'mid' }],
    turns: [
      {
        speaker: 's1',
        text: 'Every introductory economics course begins with supply and demand, but the deeper idea is that a price is not a cost. It is a message. A price is a signal, and the remarkable thing about the signal is how little the person reading it needs to know.',
      },
      {
        speaker: 's1',
        text: 'The classic problem is dispersed knowledge. No central authority knows what millions of people need, what they can produce, or what they will do tomorrow. Yet a single number, the market price, carries all of that in compressed form, and it updates continuously as conditions change.',
      },
      {
        speaker: 's1',
        text: 'Consider a frost that damages the coffee crop. Consumers in distant cities know nothing about the frost, and they need to know nothing. The price rises, they buy less, and roasters look for other sources. The signal coordinates the whole response without issuing a single instruction, and it does so because the same price that informs also creates the incentive to act.',
      },
      {
        speaker: 's1',
        text: 'The mechanism is testable. In laboratory double auctions, strangers who know nothing beyond their own valuations converge on the predicted equilibrium within a handful of rounds. The efficiency of the outcome does not depend on perfect knowledge. It depends on every participant responding to the same compact number.',
      },
      {
        speaker: 's1',
        text: 'The important failures are just as specific. When a price omits a cost, and pollution is the standard example, the signal is not merely imprecise but misleading, because it encourages exactly the behaviour that generates the unpaid cost. Economists call this an externality, and the remedy is to repair the signal, for instance with a tax that returns the missing cost to the price, rather than to abandon prices altogether.',
      },
      {
        speaker: 's1',
        text: 'So the summary is this. Prices work because they compress dispersed knowledge into a single figure that coordinates behaviour and aligns incentives at the same time. They fail where the figure leaves out a cost. In both cases the lesson is the same: the economy is coordinated by information, and the only question is whether the information is honest. Thank you.',
      },
    ],
    keyTerms: [
      'signal',
      'dispersed knowledge',
      'incentives',
      'equilibrium',
      'externality',
      'compact',
    ],
  },
  {
    id: 'lec-silk-road',
    title: 'How Silk Road Trade Routes Changed',
    kind: 'lecture',
    topic: 'History',
    scene: 'A historian lecturing on changing Eurasian trade routes.',
    speakers: [{ id: 's1', name: 'Professor Larkin', role: 'Historian', voiceHint: 'low' }],
    turns: [
      {
        speaker: 's1',
        text: 'The Silk Roads were not one highway that simply closed. They were connected land and sea routes linking many regions, and merchants often travelled only part of the distance, passing goods through intermediaries. Their importance changed over time as political conditions and transport options changed.',
      },
      {
        speaker: 's1',
        text: 'Long-distance overland freight was costly, so compact goods with high value relative to their weight were especially suited to it. Pack camels could cover roughly twenty-five kilometres a day in favourable conditions, though terrain, water and season affected the pace. Most merchants did not carry goods from one end of Eurasia to the other.',
      },
      {
        speaker: 's1',
        text: 'When Portuguese navigators reached the Indian Ocean by sailing around the Cape of Good Hope in the late fifteenth century, they entered maritime networks that were already active. The new route gave European merchants a more direct way to seek Asian goods, but it did not replace every overland or regional route, and its effects differed across places and commodities.',
      },
      {
        speaker: 's1',
        text: 'The growth of Portuguese and later European shipping altered parts of the spice trade and challenged existing commercial intermediaries. That did not make all overland routes obsolete: states and merchants across Central Asia continued to use and adapt them. The history is better understood as a shift in routes, power and trade shares than as a single collapse.',
      },
      {
        speaker: 's1',
        text: 'Political change, security, demand and transport costs all influenced which routes merchants used. Sea transport could carry some goods in ways that competed with long overland journeys, while land routes remained valuable for other connections. No single cause explains the changing fortunes of every town or route.',
      },
      {
        speaker: 's1',
        text: 'The wider lesson is that trade networks are flexible. They respond to political conditions, demand and the costs of moving particular goods. The Cape route changed some connections between Europe and Asia, while the wider Silk Roads continued as a mix of land and maritime routes. Thank you.',
      },
    ],
    keyTerms: [
      'Silk Roads',
      'intermediaries',
      'overland freight',
      'Cape of Good Hope',
      'spice trade',
      'route changes',
    ],
  },
  {
    id: 'lec-precedent',
    title: 'The Function of Precedent',
    kind: 'lecture',
    topic: 'Law',
    scene: 'A legal scholar lecturing on the common law tradition.',
    speakers: [{ id: 's1', name: 'Dr Calloway', role: 'Legal scholar', voiceHint: 'mid-high' }],
    turns: [
      {
        speaker: 's1',
        text: 'Common law is often described as judge-made law, but the defining institution is not the judge. It is the precedent: the practice of deciding a new case by reference to an old one, and of treating the reasoning of the earlier decision as binding on the later court.',
      },
      {
        speaker: 's1',
        text: 'The doctrine is called stare decisis, and its structure is simple. A court is bound by the decisions of the courts above it and, in many systems, by its own earlier decisions. What binds is not the whole judgment but the ratio decidendi, the rule the case actually required, and the skill of advocacy lies in showing that a later case falls inside or outside that rule.',
      },
      {
        speaker: 's1',
        text: 'Why does the system work this way? The first answer is fairness. Like cases should be treated alike, and a person who can read the past decisions can plan their affairs with some confidence. The second answer is discipline. A judge who must justify a decision by reference to existing principle cannot decide by preference alone, and that constraint is what separates law from policy.',
      },
      {
        speaker: 's1',
        text: 'The standard criticism is that precedent preserves error. A badly reasoned decision can survive for decades simply because later courts are reluctant to depart from it, and the cost of that reluctance falls on litigants who were never represented in the original case. The common law answers with two remedies: distinguishing, which narrows a rule by showing the facts differ, and overruling, which abandons the rule outright.',
      },
      {
        speaker: 's1',
        text: 'A landmark illustration is Donoghue v Stevenson in 1932. The House of Lords recognized that a manufacturer could owe a duty of care to an ultimate consumer despite the absence of a contract between them. The decision drew on earlier principles and helped shape modern negligence law; it was not a simple rejection of a single rule that liability always required a contract.',
      },
      {
        speaker: 's1',
        text: 'So precedent is a compromise between stability and reform. Law grows by analogy, one case at a time, which makes change slow but rarely arbitrary. Its strength is predictability, its weakness is inherited error, and the health of the system depends on the willingness of courts to say, openly and with reasons, when an earlier decision was wrong. Thank you.',
      },
    ],
    keyTerms: [
      'precedent',
      'stare decisis',
      'ratio decidendi',
      'distinguishing',
      'duty of care',
      'predictability',
    ],
  },
]

export const EXTRA_RETELL_ITEMS_5: RetellItem[] = [
  {
    id: 'rtl-price-signals',
    audioId: 'lec-price-signals',
    skeleton: [
      'a price is a signal, not a cost',
      'dispersed knowledge compressed into one figure',
      'frost example: coordination without instruction',
      'lab experiments converge on equilibrium',
      'externality: repair the signal, do not abandon prices',
    ],
    reference:
      'A market price is a signal rather than a cost, compressing dispersed knowledge into one compact figure that updates continuously. When frost damages the coffee crop, distant consumers adjust without knowing about it, because the signal informs and creates incentives at once. Experiments confirm rapid convergence on equilibrium. The failure is an externality, where price omits a cost, and the remedy is to repair the signal rather than abandon it.',
    keyTerms: [
      'signal',
      'dispersed knowledge',
      'incentives',
      'equilibrium',
      'externality',
      'compact',
    ],
    minWords: 40,
  },
  {
    id: 'rtl-silk-road',
    audioId: 'lec-silk-road',
    skeleton: [
      'connected land and sea routes, merchants often travelled in stages',
      'overland freight favoured compact, high-value goods',
      'Cape route gave Europeans a more direct path to Indian Ocean trade',
      'some spice trade patterns shifted; existing networks continued',
      'several political and economic causes changed route use',
    ],
    reference:
      'The Silk Roads connected regions through land and sea routes, with merchants often passing goods through intermediaries. Costly overland freight favoured compact, high-value goods. The Portuguese Cape route gave European merchants a more direct connection to Indian Ocean trade, shifting some commercial patterns, but it did not end the wider networks. Political conditions, demand and transport costs all influenced which routes were used.',
    keyTerms: [
      'Silk Roads',
      'intermediaries',
      'overland freight',
      'Cape route',
      'Indian Ocean trade',
      'commercial patterns',
    ],
    minWords: 40,
  },
  {
    id: 'rtl-precedent',
    audioId: 'lec-precedent',
    skeleton: [
      'common law is built on precedent',
      'stare decisis: the ratio decidendi binds later courts',
      'fairness plus judicial discipline',
      'remedies: distinguishing and overruling',
      '1932 duty of care reshaped negligence',
      'law grows by analogy, one case at a time',
    ],
    reference:
      'Common law rests on precedent, deciding new cases by reference to old ones under stare decisis, where the ratio decidendi of an earlier decision binds later courts. This treats like cases alike and disciplines judges against deciding by preference. Its weakness is inherited error, remedied by distinguishing and overruling. The 1932 duty of care in negligence shows law can depart from precedent and grow a new branch by analogy.',
    keyTerms: [
      'precedent',
      'stare decisis',
      'ratio decidendi',
      'distinguishing',
      'duty of care',
      'analogy',
    ],
    minWords: 40,
  },
]
