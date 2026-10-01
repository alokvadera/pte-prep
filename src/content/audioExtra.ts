import type { AudioScript, GroupDiscussionItem, SpokenSummaryItem } from './schema'

/**
 * Additional original audio material.
 *
 * Summarize Spoken Text had a single item and Summarize Group Discussion had
 * two, so a candidate meeting the same paper twice answered the identical
 * question. Both arrays below are merged into `audio.ts` in the same way the
 * extra passages are merged into `passages.ts`.
 *
 * These also feed the derived pools: every sentence in the 11 to 20 word range
 * becomes a candidate Repeat Sentence, and every group discussion becomes a
 * Re-tell Lecture option.
 */

export const EXTRA_LECTURES: AudioScript[] = [
  {
    id: 'lec-seedbank',
    title: 'Why Seed Banks Are Not Archives',
    kind: 'lecture',
    topic: 'Agricultural science',
    scene: 'A plant scientist speaking to an audience of land management students.',
    speakers: [{ id: 's1', name: 'Dr Ilori', role: 'Lecturer', voiceHint: 'mid' }],
    turns: [
      {
        speaker: 's1',
        text: 'A seed bank is usually described as a vault, and it is worth asking whether that is the right picture. A vault implies storage, retrieval on demand, and a guarantee that what went in will come back out unchanged. A functioning seed bank does none of these things.',
      },
      {
        speaker: 's1',
        text: 'The first complication is that seeds die. Their viability falls with time and with temperature, and cold storage slows the decline without stopping it. A collection is therefore not a possession but a series of obligations: someone must periodically grow a portion of each accession, and the harvest has to be cleaned, dried and returned to storage before its own viability declines. A bank that stops regenerating begins, quietly, to lose access to material it still appears to hold.',
      },
      {
        speaker: 's1',
        text: 'The second is that a seed is not the crop. A variety maintained as seed will drift away from the variety it began as, because the plants that survive a regeneration cycle are the ones best suited to that particular cycle, and they set the seed for the next one. Over enough cycles, a variety bred for one climate becomes a variety adapted to the conditions of the store, which is a serious problem precisely because the store is not where the crop is grown.',
      },
      {
        speaker: 's1',
        text: 'So the practical conclusion is that maintaining a crop means maintaining a population, which means growing it where it is actually cultivated. The most valuable collections in the world are not the largest vaults but the community seed banks that hold landraces in the fields where farmers continue to select them, often under pressure from a changing climate.',
      },
    ],
    keyTerms: ['accession', 'regeneration', 'viability', 'landrace', 'drift'],
  },

  {
    id: 'lec-antibiotics',
    title: 'The Supply Problem Nobody Costed',
    kind: 'lecture',
    topic: 'Public health',
    scene: 'A pharmacologist addressing a clinical audit meeting.',
    speakers: [{ id: 's1', name: 'Dr Oyelaran', role: 'Pharmacologist', voiceHint: 'mid' }],
    turns: [
      {
        speaker: 's1',
        text: 'When the discussion turns to antibiotic resistance, the argument is usually about demand: prescribe less, use narrower agents, stop treating infections that will resolve on their own. All of that is correct, and none of it addresses the problem that has proved hardest to solve, which is that several essential antibiotics are no longer being made at all.',
      },
      {
        speaker: 's1',
        text: 'The economics are not mysterious. Penicillin-type drugs are cheap to produce and have been for decades, which means that generic manufacturers have no reason to enter a market, and the firms that did supply the active ingredient have been free to exit it when it became unprofitable. What remains is a supply chain with very few nodes, and in a supply chain with few nodes, the loss of one is not a shortage. It is a gap.',
      },
      {
        speaker: 's1',
        text: 'This is why stewardship programmes alone are insufficient. Reducing demand is the only lever we have applied for two decades, and demand has fallen while the number of manufacturers has not recovered. Countries that identified this early did so largely by accident, through procurement policy rather than public health policy, and they did it by paying a premium for domestic capacity long before it was needed.',
      },
      {
        speaker: 's1',
        text: 'The uncomfortable conclusion is that the cheapest available intervention in the short run is to pay more for less supply, deliberately, in order to keep a supplier alive. That is difficult to justify to a budget holder and easy to justify in retrospect, because the alternative is discovering the price later, during an outbreak, with no suppliers at all.',
      },
    ],
    keyTerms: ['stewardship', 'generic', 'active ingredient', 'procurement', 'domestic capacity'],
  },
]

export const EXTRA_GROUP_DISCUSSIONS: AudioScript[] = [
  {
    id: 'gd-hybrid-work',
    title: 'Should universities require attendance?',
    kind: 'group',
    topic: 'Education policy',
    scene: 'A panel of three discussing a draft policy on contact hours.',
    speakers: [
      { id: 's1', name: 'Dr Mensah', role: 'Academic', voiceHint: 'mid' },
      { id: 's2', name: 'Priyanka', role: 'Student representative', voiceHint: 'high' },
      { id: 's3', name: 'Tom', role: 'Postgraduate', voiceHint: 'low' },
    ],
    turns: [
      {
        speaker: 's1',
        text: 'We are reviewing whether our draft requires attendance, and I want to put the case for recording rather than mandating. We surveyed our own students last year and the correlation between attendance and attainment was weak. If you cannot demonstrate that it helps, the default should be optional.',
      },
      {
        speaker: 's2',
        text: 'I would argue the correlation is the wrong thing to look at. Attendance is not random, so comparing students who attend with students who do not tells you about motivation rather than about attendance. The students who most need the contact are the ones least likely to turn up unprompted.',
      },
      {
        speaker: 's3',
        text: 'That is fair, and there is a version of this policy that is actively regressive. If we make attendance optional in practice and only the confident students come, we have not saved anyone anything. We have lowered the standard for everybody and raised the barrier for the people who were already struggling.',
      },
      {
        speaker: 's1',
        text: 'So if the mechanism is what we are worried about, recording is beside the point. Are you both arguing that attendance should be required, or that it should be optional with something else in its place?',
      },
      {
        speaker: 's2',
        text: 'Something else. A small group that a student has to justify not joining is a different intervention from a lecture theatre they may leave. I would keep the large sessions open and make the small ones required, and I would fund that instead of paying for recordings nobody watches.',
      },
      {
        speaker: 's3',
        text: 'And publish the numbers either way. We found out only because someone ran the analysis, and it turned out the recording figures in our own faculty were so low that the policy was close to theatre.',
      },
      {
        speaker: 's1',
        text: 'Then let us say: the group agrees that unmandated contact on its own disadvantages the students least able to absorb it. They disagree about the remedy, and they do not disagree about the diagnosis.',
      },
    ],
    keyTerms: ['mandatory', 'optional', 'regressive', 'correlation', 'small group', 'justify'],
  },

  {
    id: 'gd-museum-return',
    title: 'Should contested objects be returned?',
    kind: 'group',
    topic: 'Cultural policy',
    scene: 'Three panelists discussing restitution policy at a public meeting.',
    speakers: [
      { id: 's1', name: 'Dr Aluko', role: 'Historian', voiceHint: 'mid' },
      { id: 's2', name: 'Hana', role: 'Museum director', voiceHint: 'high' },
      { id: 's3', name: 'Rafael', role: 'Community advocate', voiceHint: 'low' },
    ],
    turns: [
      {
        speaker: 's1',
        text: 'I want to separate two arguments that get run together. One is about ownership and consent at the point of acquisition. The other is about what a collection does to a public. Both are real, and they sometimes point in different directions, which is part of why this is so intractable.',
      },
      {
        speaker: 's2',
        text: 'From where I sit the operational question comes first. An object that arrived in 1898 with no record of consent is, on any reading, not ours to keep. The difficulty is that we hold a great many such objects, and the honest answer is that we do not know for each one whether a claim will be made.',
      },
      {
        speaker: 's3',
        text: 'And that not-knowing is itself the problem. Every year we hold an object whose claim nobody has yet made, we describe it as settled, and we use that description to justify holding it. The default is not neutrality. The default is possession.',
      },
      {
        speaker: 's1',
        text: 'That is a strong version. But notice what it would do to an object with no surviving claimant and no evidence of how it was obtained. Would absence of a claim remove any basis for returning it?',
      },
      {
        speaker: 's3',
        text: 'If the community of origin still exists, I would say yes, ask them. That is not a legal test, it is a question we have trained ourselves not to ask because we already know the answer we want.',
      },
      {
        speaker: 's2',
        text: 'Then perhaps the honest position is not a rule but a practice: publish the acquisition record for everything, and where the record is silent, treat that silence as a reason to ask rather than a reason to keep.',
      },
      {
        speaker: 's1',
        text: 'So we converge on transparency without resolving ownership. The group agrees that an undocumented acquisition is a reason for the holding museum to seek consent, and disagrees on whether a claim is required before anything happens.',
      },
    ],
    keyTerms: ['acquisition', 'consent', 'claimant', 'provenance', 'default', 'transparency'],
  },
]

export const EXTRA_SPOKEN_SUMMARY_ITEMS: SpokenSummaryItem[] = [
  {
    id: 'sst-seedbank',
    audioId: 'lec-seedbank',
    question:
      'Listen to the recording and write a summary of 50 to 70 words. Include the main idea and the most important supporting details. You have ten seconds during the recording to prepare your answer.',
    reference:
      'The speaker argues that describing a seed bank as a vault is misleading, because seeds lose viability and must be periodically grown and returned to storage, so a collection is a standing obligation rather than a possession. A seed also drifts away from the variety it began as across regeneration cycles, which means maintaining a crop means maintaining a population. Field-based community banks holding landraces are therefore more valuable than large central vaults.',
    keyTerms: ['viability', 'regeneration', 'drift', 'population', 'landraces', 'community'],
    minWords: 30,
  },
  {
    id: 'sst-antibiotics',
    audioId: 'lec-antibiotics',
    question:
      'Listen to the recording and write a summary of 50 to 70 words. Include the main idea and the most important supporting details. You have ten seconds during the recording to prepare your answer.',
    reference:
      'The speaker says resistance efforts have focused on reducing demand through stewardship, but the harder problem is supply: cheap generic antibiotics have no reason to be manufactured and the active ingredient producers have left, leaving a chain with so few nodes that losing one creates a gap rather than a shortage. Reducing demand for twenty years has not restored manufacturers. The cheapest intervention is paying a premium early to keep a supplier alive, which is hard to justify to a budget holder and obvious in retrospect.',
    keyTerms: ['stewardship', 'demand', 'generic', 'active ingredient', 'supply chain', 'premium'],
    minWords: 30,
  },
]

export const EXTRA_GROUP_DISCUSSION_ITEMS: GroupDiscussionItem[] = [
  {
    id: 'sgd-hybrid-work',
    audioId: 'gd-hybrid-work',
    question:
      'Listen to the discussion and summarise it in between 40 and 90 seconds. Report the group\'s overall stance, the main points each speaker made, and where they disagreed.',
    reference:
      'The panel converges on a diagnosis but not a remedy. The academic proposes making attendance optional and notes attendance correlates weakly with attainment, but the student representative argues the correlation is the wrong test because attendance is not random, and the postgraduate warns that in practice optional contact lowers the standard for everyone while raising the barrier for the students already struggling. They agree that unmandated contact alone disadvantages the least able, and disagree over the substitute: the student representative favours keeping large sessions open while making small groups justifiable and funded, and the postgraduate wants the figures published.',
    keyTerms: ['mandatory', 'optional', 'regressive', 'correlation', 'small group', 'publish'],
    minWords: 40,
  },
  {
    id: 'sgd-museum-return',
    audioId: 'gd-museum-return',
    question:
      'Listen to the discussion and summarise it in between 40 and 90 seconds. Report the group\'s overall stance, the main points each speaker made, and where they disagreed.',
    reference:
      'The panel separates the ethics of acquisition from the effect of a collection on the public, and converges on transparency without settling ownership. The historian asks what happens to an object with no surviving claimant, the director notes that an object taken in 1898 without recorded consent is not theirs to keep, and the community advocate argues that describing an undocumented holding as settled treats possession as the default. They agree that publishing acquisition records and treating a silent record as a reason to ask is the honest practice, and split on whether a formal claim is required first.',
    keyTerms: ['acquisition', 'consent', 'claimant', 'possession', 'default', 'transparency'],
    minWords: 40,
  },
]