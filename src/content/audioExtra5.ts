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
    title: 'Why the Silk Road Faded',
    kind: 'lecture',
    topic: 'History',
    scene: 'A historian lecturing on the end of overland trade.',
    speakers: [{ id: 's1', name: 'Professor Larkin', role: 'Historian', voiceHint: 'low' }],
    turns: [
      {
        speaker: 's1',
        text: 'The Silk Road is usually taught as a single highway, and as a road that was closed by war. Both pictures are wrong. It was a network of caravan routes, and it faded not because anyone shut it, but because a cheaper substitute appeared.',
      },
      {
        speaker: 's1',
        text: 'The economics of the overland route were brutal. A camel caravan covered perhaps two hundred kilometres a month, and every intermediary along the way took a share. Bulky goods could not survive the cost, so only commodities of extreme value relative to their weight, silk, spices, gems and silver, ever travelled the full distance.',
      },
      {
        speaker: 's1',
        text: 'The turning point came at the end of the fifteenth century, when Portuguese navigators rounded the Cape and opened the sea route to Asia. Maritime shipping did what no political settlement could do: it cut the cost of moving a unit of cargo by an order of magnitude, and it did so at a volume the caravans could never match.',
      },
      {
        speaker: 's1',
        text: 'The evidence survives in the price records. Pepper in European markets fell steadily through the sixteenth century as shiploads replaced camel loads, and the overland share of the spice trade collapsed within two generations. The pattern is written on the map of cities: the caravan towns of Central Asia stagnated while Lisbon, and later Amsterdam, grew wealthy on the same goods.',
      },
      {
        speaker: 's1',
        text: 'Notice what this means. The route was not destroyed; it was outcompeted. Political fragmentation and the loss of the empires that had protected the caravans had already weakened it, but the fatal blow was relative price. Trade routes do not die of closure. They die when a substitute makes their fixed costs unpayable.',
      },
      {
        speaker: 's1',
        text: 'The wider lesson is that infrastructure is only as durable as the economics beneath it. When the ocean carried the same goods for less, the Silk Road became a memory rather than a corridor, and the history of the following centuries was written on the water instead of on the steppe. Thank you.',
      },
    ],
    keyTerms: ['caravan', 'overland', 'maritime', 'substitute', 'pepper', 'fixed costs'],
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
        text: 'The clearest illustration is the modern law of negligence. In 1932 the House of Lords held that a manufacturer owed a duty of care to the ultimate consumer of its product, a departure from the older precedent that liability required a contract. The new rule was contested, yet within a generation it had become the foundation on which an entire branch of liability was built.',
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
      'a network of routes, not a single road',
      'overland transport costs were brutal',
      'Cape sea route cut cost by an order of magnitude',
      'pepper prices fell through the sixteenth century',
      'not closed by war but outcompeted on relative price',
    ],
    reference:
      'The Silk Road was a network of caravan routes, not a single road, and it faded because sea trade outcompeted it rather than because war closed it. Overland transport was ruinously expensive, so only high-value goods travelled far, until maritime routes around the Cape cut the cost per unit dramatically. Pepper prices fell through the sixteenth century, caravan towns stagnated, and the overland routes died of relative price, not closure.',
    keyTerms: ['caravan', 'overland', 'maritime', 'pepper', 'outcompeted', 'relative price'],
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
