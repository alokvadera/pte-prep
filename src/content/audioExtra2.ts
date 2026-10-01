import type { AudioScript, GroupDiscussionItem, RetellItem } from './schema'

/**
 * Additional group discussions, re-tell lectures and their summary items.
 *
 * Summarize Group Discussion sits at the lowest coverage ratio on the whole site
 * at 1.33 against its per-test count, and Re-tell Lecture is next. Both need new
 * audio, so each discussion here serves the summary item, the Re-tell Lecture
 * pool and the Repeat Sentence pool at once.
 */
export const EXTRA_DISCUSSIONS_2: AudioScript[] = [
  {
    id: 'gd-parking',
    title: 'Should cities charge for road space?',
    kind: 'group',
    topic: 'Transport policy',
    scene: 'Three speakers debate congestion charging at a public consultation.',
    speakers: [
      { id: 's1', name: 'Dr Alvarez', role: 'Transport economist', voiceHint: 'mid' },
      { id: 's2', name: 'Bernard', role: 'Disabled resident', voiceHint: 'low' },
      { id: 's3', name: 'Leila', role: 'City councillor', voiceHint: 'high' },
    ],
    turns: [
      {
        speaker: 's1',
        text: 'The economics are not really contested any more. If you charge for road use, people move their journeys in time and place, and you can fund the alternatives out of the revenue. What is contested is who pays and who does not.',
      },
      {
        speaker: 's2',
        text: 'That is the whole argument as far as I am concerned, because the people least able to change when are not the people charged most in absolute terms. My permit costs a fraction of the charge I would pay on a weekly care journey, and the alternative that avoids it is a bus that does not run at the hour I work.',
      },
      {
        speaker: 's3',
        text: 'We can cap the daily charge and exempt permits, which is what most schemes do, and the modelling says the traffic reduction holds. The objection I take seriously is different: it is that a charge makes the road a commodity, and the language we use about it becomes the language we use about everything else.',
      },
      {
        speaker: 's1',
        text: 'Roads were always priced. We simply administered the price badly and through the fuel duty rather than visibly. I do not think the commodity concern survives contact with the fact that the charge is time limited and the money is ring fenced.',
      },
      {
        speaker: 's2',
        text: 'I would accept a charge if the bus came first. It has not, and the promise of it has been made twice before, so I am not persuaded by the sequencing argument until I see the timetable.',
      },
      {
        speaker: 's3',
        text: 'Then let us be precise. The panel agrees the economic case is not the difficulty. They disagree about whether a price is acceptable without the alternatives in place, and Leila does not accept the framing objection at all.',
      },
    ],
    keyTerms: ['charge', 'revenue', 'exempt', 'ring fenced', 'sequencing', 'price'],
  },

  {
    id: 'gd-benchmark',
    title: 'Should league tables be published?',
    kind: 'group',
    topic: 'Education policy',
    scene: 'Three headteachers discuss public league tables at a policy seminar.',
    speakers: [
      { id: 's1', name: 'Ms Adeyemi', role: 'Secondary head', voiceHint: 'high' },
      { id: 's2', name: 'Gordon', role: 'Primary head', voiceHint: 'low' },
      { id: 's3', name: 'Dr Roth', role: 'Education researcher', voiceHint: 'mid' },
    ],
    turns: [
      {
        speaker: 's1',
        text: 'My position is narrow. Publish them, publish them every year, and stop pretending they do more damage than good. What parents want is a ranking and we have made them construct one out of guesswork instead.',
      },
      {
        speaker: 's2',
        text: 'We already publish outcomes, so a third table is not obviously better than the first two. At primary level the gap between a child at the top of the band and one at the bottom is largely the gap between them, and publishing a percentage for it adds heat without adding a fact.',
      },
      {
        speaker: 's3',
        text: 'Both of you are describing what happens when the measure becomes the target, which is not an argument against publication but an argument for attaching it to something harder to game. Progress measures rather than raw attainment would be a different table.',
      },
      {
        speaker: 's1',
        text: 'And would need three years to be credible, which is longer than most parents will tolerate waiting.',
      },
      {
        speaker: 's2',
        text: 'That is a real constraint. It is not a reason to publish the flawed version immediately, though.',
      },
      {
        speaker: 's3',
        text: 'So we agree on the mechanism and disagree on the timing. The group agrees the tables distort attention toward what is measured, and splits on whether publishing a distorted measure now is better than publishing nothing.',
      },
    ],
    keyTerms: ['publish', 'attainment', 'progress', 'target', 'gap', 'timing'],
  },
]

export const EXTRA_GROUP_DISCUSSION_ITEMS_2: GroupDiscussionItem[] = [
  {
    id: 'sgd-parking',
    audioId: 'gd-parking',
    question:
      'Listen to the discussion and summarise it in between 40 and 90 seconds. Report the group\'s overall stance, the main points each speaker made, and where they disagreed.',
    reference:
      'The panel accepts that the economics of congestion charging are not the difficulty and that revenue could fund alternatives. They split on who bears the cost and on timing. The disabled resident argues the charge falls hardest on people who cannot change when they travel, and would accept it only if the bus came first. The economist rejects the commodity framing, noting roads were always priced badly through fuel duty. The councillor can offer a cap and a permit exemption but will not accept the framing objection. They disagree on whether a price is acceptable without alternatives in place.',
    keyTerms: ['economics', 'revenue', 'exempt', 'change when', 'charge', 'timing'],
    minWords: 40,
  },
  {
    id: 'sgd-benchmark',
    audioId: 'gd-benchmark',
    question:
      'Listen to the discussion and summarise it in between 40 and 90 seconds. Report the group\'s overall stance, the main points each speaker made, and where they disagreed.',
    reference:
      'The three speakers agree that league tables distort attention toward what is measured rather than settling whether they should be published. The secondary head wants them published every year because parents construct a ranking anyway. The primary head objects that a third table adds no fact and that the primary gap is largely between children already. The researcher proposes attaching progress measures rather than attainment, which Ms Adeyemi accepts would need three years, longer than parents will wait. They divide on timing: publish a distorted measure now, or publish nothing.',
    keyTerms: ['publish', 'progress', 'distort', 'attainment', 'three years', 'timing'],
    minWords: 40,
  },
]

export const EXTRA_RETELL_ITEMS: RetellItem[] = [
  {
    id: 'rtl-seedbank',
    audioId: 'lec-seedbank',
    skeleton: [
      'not a vault but a series of obligations',
      'seeds lose viability over time',
      'regeneration cycles cause drift',
      'maintain a population where it is grown',
      'prediction: landrace banks track climate change faster than vaults',
    ],
    reference:
      'A seed bank is not a vault but a standing obligation, because seeds lose viability and must periodically be grown and returned to storage. Regeneration also causes drift, since the plants surviving each cycle are the ones best suited to that cycle, so maintaining a crop means maintaining a population where it is actually cultivated. The consequence is that community seed banks holding landraces under climate pressure are more valuable than large central vaults.',
    keyTerms: ['viability', 'regeneration', 'drift', 'population', 'landraces', 'community'],
    minWords: 30,
  },
  {
    id: 'rtl-antibiotics',
    audioId: 'lec-antibiotics',
    skeleton: [
      'resistance debates have focused on demand',
      'cheap generics have no reason to be made',
      'few nodes in the supply chain means a gap not a shortage',
      'pay a premium early to keep a supplier alive',
    ],
    reference:
      'Resistance policy has concentrated on reducing demand through stewardship, but the harder problem is supply: generics are cheap enough that no manufacturer enters, and the firms that made the active ingredient have left, so the chain has few enough nodes that losing one produces a gap rather than a shortage. Twenty years of stewardship has not restored manufacturers. The cheapest intervention is to pay a premium deliberately early, which is hard to defend to a budget holder and obvious in retrospect.',
    keyTerms: ['stewardship', 'demand', 'generic', 'active ingredient', 'supply chain', 'premium'],
    minWords: 30,
  },
  {
    id: 'rtl-hybrid-work',
    audioId: 'gd-hybrid-work',
    skeleton: [
      'economist favours recording rather than mandating',
      'attendance is not random, so the comparison is confounded',
      'unmandated contact lowers the standard for everyone',
      'agreement on the diagnosis, not the remedy',
      'small groups that must be justified rather than lectures that may be left',
    ],
    reference:
      'The panel separates a diagnosis from a remedy and agrees on the diagnosis. The academic proposes making attendance optional on weak evidence of a link to attainment, but the student representative argues attendance is not random so the comparison tells you about motivation, and the postgraduate warns that optional contact lowers the standard for everyone while raising the barrier for the least confident. The remedy is disputed: small groups a student must justify not joining, funded instead of recordings, with the figures published.',
    keyTerms: ['optional', 'mandating', 'regressive', 'correlation', 'small group', 'diagnosis'],
    minWords: 30,
  },
]