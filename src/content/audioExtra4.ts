import type { AudioScript, GroupDiscussionItem, RetellItem, SpokenSummaryItem } from './schema'

/**
 * Fourth audio batch: two lectures, two conversations and two group
 * discussions with their derived Re-tell Lecture, Summarize Spoken
 * Text and Summarize Group Discussion items.
 *
 * The conversations are new to this file: the bank previously sourced
 * every conversation from the listening pool, so Summarize Spoken Text
 * had no academic two-speaker stimulus to draw on. One SST item here
 * points at a conversation, which mirrors the real test reusing one
 * recording across formats. Each Re-tell Lecture item points at a
 * lecture or a conversation, and every script in the file serves at
 * least one derived item, so nothing is an orphan for the Repeat
 * Sentence pool alone.
 */

export const EXTRA_LECTURES_4: AudioScript[] = [
  {
    id: 'lec-habits',
    title: 'Why Habits Resist Change',
    kind: 'lecture',
    topic: 'Psychology',
    scene: 'A behavioural scientist lecturing on habit formation.',
    speakers: [{ id: 's1', name: 'Dr Novak', role: 'Lecturer', voiceHint: 'mid' }],
    turns: [
      {
        speaker: 's1',
        text: 'Habit formation is usually explained as a loop: a cue triggers a routine, and a reward reinforces it. That picture is correct as far as it goes, but it hides the part that matters most for anyone trying to change a behaviour, which is that the loop becomes automatic with repetition.',
      },
      {
        speaker: 's1',
        text: 'The evidence comes from studies of everyday behaviour. Participants report the context in which they acted, and over weeks the behaviour becomes tied to the context rather than to intention. The classic finding is that a habitual response survives even when the reward loses its value, because the cue alone is enough to fire the routine.',
      },
      {
        speaker: 's1',
        text: 'This is why willpower is a poor instrument. An intention to change competes with a response that no longer passes through conscious decision at all. In laboratory terms, the habitual system learns stimulus-response associations, and those associations are indifferent to what you currently want.',
      },
      {
        speaker: 's1',
        text: 'The practical implication is that the environment is the better lever. If the cue is removed, the routine loses its trigger. Studies of implementation intentions — plans of the form if this, then that — show a reliable effect on follow-through, precisely because they replace a vague goal with a specified response to a specified cue.',
      },
      {
        speaker: 's1',
        text: 'There is a second implication, and it concerns how long change takes. The often-quoted figure of twenty-one days comes from a misreading of an old plastic-surgery study and has no standing. Behaviour that is complex, or that competes with a well-established routine, takes months, and relapse is part of the process rather than evidence of failure.',
      },
      {
        speaker: 's1',
        text: 'So the honest summary is that habits are context-bound automatisms, not decisions. They are built by repetition in a stable context, they are fired by cues rather than chosen, and they are changed by redesigning the environment far more reliably than by resolve. Thank you.',
      },
    ],
    keyTerms: ['cue', 'routine', 'reward', 'automatic', 'context', 'willpower', 'implementation intentions'],
  },
  {
    id: 'lec-attention',
    title: 'The Neuroscience of Attention',
    kind: 'lecture',
    topic: 'Neuroscience',
    scene: 'A neuroscientist giving a public lecture on attention.',
    speakers: [{ id: 's1', name: 'Professor Lindqvist', role: 'Speaker', voiceHint: 'low' }],
    turns: [
      {
        speaker: 's1',
        text: 'Attention feels like a single spotlight, but the neuroscience says otherwise. What we call attention is a family of processes — selecting some information, suppressing the rest, and holding a small amount of it available for action — and each has a different anatomy.',
      },
      {
        speaker: 's1',
        text: 'Selection is the best understood part. When you search for a face in a crowd, neurons in the visual cortex respond more strongly to the target than to nearby distractors, and this bias is measurable within a fraction of a second. The brain does not pass everything forward and filter later; it filters at the earliest stage where the information is still cheap to suppress.',
      },
      {
        speaker: 's1',
        text: 'Capacity is the binding constraint. The amount of information that can be held in an active state at any moment is small — roughly four items in most people — and when the limit is exceeded, one item displaces another. This is not a storage problem. It is a problem of competition for a limited resource.',
      },
      {
        speaker: 's1',
        text: 'The clearest demonstration is the attentional blink. If two targets appear in a rapid stream less than half a second apart, the second is often missed, even when the observer is looking directly at it. The miss is not in the eyes. It reflects a refractory period in the system that binds a stimulus to conscious report.',
      },
      {
        speaker: 's1',
        text: 'Multitasking deserves a separate mention because the popular use of the word is misleading. What people call multitasking is almost always rapid switching between tasks, and every switch carries a cost in time and accuracy. The cost is largest for tasks that share a code — two language tasks interfere more than a language task and a spatial one.',
      },
      {
        speaker: 's1',
        text: 'The practical conclusion is that attention is a resource with a narrow bottleneck, not a skill of character. Sustained focus depends on what the environment demands of it, and the strongest evidence for improving it is boring: protect the interval, remove the distractors, and expect the limit to hold. Thank you.',
      },
    ],
    keyTerms: ['attention', 'selection', 'capacity', 'attentional blink', 'refractory period', 'multitasking', 'bottleneck'],
  },
]

export const EXTRA_CONVERSATIONS_6: AudioScript[] = [
  {
    id: 'conv-streaming',
    title: 'The economics of streaming',
    kind: 'conversation',
    topic: 'Media economics',
    scene: 'A doctoral student and an economics lecturer discuss the streaming market.',
    speakers: [
      { id: 'a', name: 'Ms Aldana', role: 'Doctoral student', voiceHint: 'high' },
      { id: 'b', name: 'Dr Reyes', role: 'Economics lecturer', voiceHint: 'mid' },
    ],
    turns: [
      {
        speaker: 'a',
        text: 'I am writing about the economics of streaming, and one number keeps coming up: the marginal cost of serving an additional subscriber is close to zero. Is that really the whole story?',
      },
      {
        speaker: 'b',
        text: 'It is the starting point, because a near-zero marginal cost changes everything about pricing. The efficient price of an extra download is zero, yet the catalogue cost a fortune to assemble, so the firm has to recover fixed costs through subscriptions rather than per-unit sales.',
      },
      {
        speaker: 'a',
        text: 'So the subscription model is a way to cover the fixed cost of the catalogue?',
      },
      {
        speaker: 'b',
        text: 'Partly. The other half is that revenue does not track use. A subscriber who watches nothing pays the same as one who watches everything, which lets the platform bundle catalogue the subscriber will never open, and bundling works precisely because willingness to pay varies.',
      },
      {
        speaker: 'a',
        text: 'And the concentration — why does the market keep collapsing into a few large platforms?',
      },
      {
        speaker: 'b',
        text: 'Because catalogue depth is a barrier to entry. A new entrant needs enough breadth to justify the monthly fee, and exclusive content is the only reliable way to buy it. The result is a market where the marginal cost is zero but the fixed cost is enormous, which is economics for a natural oligopoly.',
      },
      {
        speaker: 'a',
        text: 'What about the artists? The per-stream payment seems to be the grievance at the centre of it.',
      },
      {
        speaker: 'b',
        text: 'The per-stream figure is a derived number, not a rate. Revenue is pooled, the platform keeps its share, and the rest is divided by total streams, so a niche artist is paid out of the same pool as a global hit. Whether that is fair is a policy question, but the mechanism itself is simple proportional sharing.',
      },
    ],
    keyTerms: ['marginal cost', 'subscriptions', 'catalogue', 'bundling', 'barrier to entry', 'natural oligopoly', 'per-stream'],
  },
  {
    id: 'conv-thermometer',
    title: 'Inventing the thermometer',
    kind: 'conversation',
    topic: 'History of science',
    scene: 'A museum curator and a student examine an early thermometer in a gallery.',
    speakers: [
      { id: 'a', name: 'Curator', role: 'Museum curator', voiceHint: 'mid' },
      { id: 'b', name: 'Student', role: 'Visitor', voiceHint: 'high' },
    ],
    turns: [
      {
        speaker: 'a',
        text: 'The object in the case is often described as the first thermometer, but strictly it is a thermoscope. It showed that air expands when heated, but it had no scale, so it could not say how much.',
      },
      {
        speaker: 'b',
        text: 'So the scale is the invention that matters?',
      },
      {
        speaker: 'a',
        text: 'The scale is what turned a curiosity into an instrument. Two problems had to be solved: fixed points that everyone could reproduce, and a division of the interval between them that was uniform. Both look obvious now and both took decades.',
      },
      {
        speaker: 'b',
        text: 'Why were fixed points so difficult?',
      },
      {
        speaker: 'a',
        text: 'Because early makers chose different ones. Some used the temperature of a cellar, some the freezing point of water, and some a mixture of ice and salt. Readings from two instruments meant nothing until the reference points agreed, and agreement is a social achievement as much as a technical one.',
      },
      {
        speaker: 'b',
        text: 'The Fahrenheit and Celsius scales solved it?',
      },
      {
        speaker: 'a',
        text: 'They standardised it. Fahrenheit proposed fixed points that could be reproduced in any laboratory, and Celsius inverted the scale we now use, with zero at the boiling point. The modern form, zero at freezing and hundred at boiling, was adopted later, and it spread because a uniform scale makes measurement comparable across places and instruments.',
      },
    ],
    keyTerms: ['thermoscope', 'scale', 'fixed points', 'freezing point', 'standardised', 'Fahrenheit', 'Celsius'],
  },
]

export const EXTRA_GROUP_DISCUSSIONS_4: AudioScript[] = [
  {
    id: 'gd-urban-biodiversity',
    title: 'Should cities design for wildlife?',
    kind: 'group',
    topic: 'Urban ecology',
    scene: 'Three specialists discuss a biodiversity strategy at a city planning forum.',
    speakers: [
      { id: 's1', name: 'Dr Okonkwo', role: 'Ecologist', voiceHint: 'mid' },
      { id: 's2', name: 'Ms Brandt', role: 'Urban planner', voiceHint: 'high' },
      { id: 's3', name: 'Mr Alvarez', role: 'Community gardener', voiceHint: 'low' },
    ],
    turns: [
      {
        speaker: 's1',
        text: 'The evidence is now clear that cities are not biological deserts. Parks, verges and even industrial sites hold a surprising share of regional species, and in some regions the urban area holds more pollinator species than the surrounding farmland. The question is not whether urban biodiversity exists, but whether we manage it deliberately.',
      },
      {
        speaker: 's2',
        text: 'From the planning side, deliberate management competes with housing, drainage and transport for the same land. I would argue that the cheapest gains come from the space already committed: street trees, swales and the margins of railway lines, which do not require a single new acquisition.',
      },
      {
        speaker: 's1',
        text: 'Agreed, and that is the corridor argument. Isolated patches lose species over time because populations are too small to survive chance events. Connected habitats — hedgerows, stream sides, even garden chains — let species move between patches, and connectivity is the single strongest predictor of which patches retain their fauna.',
      },
      {
        speaker: 's3',
        text: 'I would push back gently on the word cheapest. A wild verge saves mowing costs, but a community garden produces something residents can see and defend. Our garden replaced a car park, and it now holds forty plant species and a hedgehog that the neighbours photograph. That public value is what keeps the land wild.',
      },
      {
        speaker: 's2',
        text: 'That is a fair challenge, and I would accept it partly. The evidence for connectivity is strong, but the land that matters most for movement is often the land with the highest development value. The strategy needs to name the corridors before they are built over, because a corridor identified after the fact is a corridor lost.',
      },
      {
        speaker: 's1',
        text: 'Then we agree on the diagnosis. Urban biodiversity is real, it depends on connectivity, and it is lost by default rather than by decision. We differ only on what should carry the argument: the ecologist\'s species data or the gardener\'s public value.',
      },
      {
        speaker: 's3',
        text: 'And I would say those are the same argument made twice. A species that survives in a city survives because people tolerate it, and people tolerate what they value. Design for the hedgehog and the person watching it at once.',
      },
    ],
    keyTerms: ['biodiversity', 'connectivity', 'patches', 'corridor', 'pollinator', 'development value', 'public value'],
  },
  {
    id: 'gd-microplastics',
    title: 'How should we respond to microplastics?',
    kind: 'group',
    topic: 'Environmental policy',
    scene: 'A panel debates microplastic policy at an environmental health seminar.',
    speakers: [
      { id: 's1', name: 'Dr Ferreira', role: 'Environmental scientist', voiceHint: 'mid' },
      { id: 's2', name: 'Ms Lindgren', role: 'Policy analyst', voiceHint: 'high' },
      { id: 's3', name: 'Mr Cole', role: 'Industry representative', voiceHint: 'low' },
    ],
    turns: [
      {
        speaker: 's1',
        text: 'Microplastics are defined as plastic fragments below five millimetres, and they reach the environment by two main routes: the breakdown of larger items, and the direct release of particles that are small from the start — fibres from laundry, pellets from industry, and particles from tyres.',
      },
      {
        speaker: 's2',
        text: 'The policy problem is that the sources are diffuse. A plastic bag has a manufacturer and a point of sale; a tyre has neither in any useful sense. Regulation aimed at a pipe or a factory simply misses most of the mass.',
      },
      {
        speaker: 's1',
        text: 'Which is why the evidence base is still thin. We can detect particles in water, soil and blood, but translating detection into harm is difficult, because the dose-response relationship is not established for most particle types. I would argue that the absence of demonstrated harm is not evidence of absence, but I cannot point to a mortality figure.',
      },
      {
        speaker: 's3',
        text: 'The industry position is that we should act on the proven harms and not on speculation. Tyre abrasion is a real stream, and it is being addressed through material standards, but a blanket restriction on a particle size class would ban products with no demonstrated risk while ignoring the ones with known effects.',
      },
      {
        speaker: 's2',
        text: 'That is the precautionary principle in one sentence, and I take it seriously. But waiting for proof of harm means waiting for a study of the exposed population, which for a persistent particle is decades. The defensible middle is to target the sources we can name: laundry filters, pellet containment, and tyre wear standards with measurable targets.',
      },
      {
        speaker: 's3',
        text: 'Pellet containment we accept, because the loss of pellets is already an economic loss. Filters are an infrastructure cost, and tyre standards need a test that does not yet exist. I would commit to the first, negotiate the second, and fund the third.',
      },
      {
        speaker: 's1',
        text: 'Then we agree on more than the audience might expect. The science says the exposure is universal and the harm uncertain; the policy response should therefore be source-specific rather than product-specific, and should be revisited as the dose-response evidence matures.',
      },
      {
        speaker: 's2',
        text: 'And I would add the framing for the public: the goal is fewer particles entering the environment, not zero plastic. A policy that measures particles released per kilometre, per wash and per kilogram of resin gives us something to audit, which is what was missing from the last round of proposals.',
      },
    ],
    keyTerms: ['microplastics', 'diffuse', 'dose-response', 'precautionary principle', 'pellet', 'laundry filters', 'source-specific'],
  },
]

export const EXTRA_RETELL_ITEMS_4: RetellItem[] = [
  {
    id: 'rtl-habits',
    audioId: 'lec-habits',
    skeleton: [
      'cue → routine → reward loop',
      'repetition makes the loop automatic and context-bound',
      'willpower loses: the response bypasses conscious choice',
      'change the environment; implementation intentions work',
      'twenty-one days is a myth — complex habits take months',
    ],
    reference:
      'Habits are learned loops in which a cue fires a routine that a reward reinforces, and with repetition the loop becomes automatic and tied to context rather than intention. Willpower is a weak instrument because the response no longer passes through conscious choice. Change works better by redesigning the environment and forming implementation intentions, and the claim that habits build in twenty-one days is a myth.',
    keyTerms: ['cue', 'routine', 'reward', 'automatic', 'context', 'willpower', 'environment', 'implementation intentions'],
    minWords: 40,
  },
  {
    id: 'rtl-attention',
    audioId: 'lec-attention',
    skeleton: [
      'attention is a family of processes, not one spotlight',
      'selection filters at the earliest stage',
      'capacity: roughly four items',
      'attentional blink reveals a refractory period',
      'multitasking is switching with a cost',
      'conclusion: a narrow bottleneck, not character',
    ],
    reference:
      'Attention is not one spotlight but a family of processes. Selection biases neurons toward a target at the earliest stage, capacity holds roughly four items before one displaces another, and the attentional blink reveals a refractory period that blocks a second target inside half a second. Multitasking is really rapid switching with a cost in time and accuracy, so attention is a narrow bottleneck rather than a skill of character.',
    keyTerms: ['attention', 'selection', 'capacity', 'attentional blink', 'refractory period', 'multitasking', 'switching', 'bottleneck'],
    minWords: 40,
  },
  {
    id: 'rtl-streaming',
    audioId: 'conv-streaming',
    skeleton: [
      'marginal cost of an extra subscriber ≈ zero',
      'subscriptions recover the fixed cost of the catalogue',
      'revenue does not track use → bundling works',
      'catalogue depth is a barrier to entry → oligopoly',
      'per-stream pay is pooled proportional sharing',
    ],
    reference:
      'Streaming economics begins with a marginal cost near zero, so subscriptions rather than per-unit sales recover the fixed cost of assembling the catalogue. Revenue does not track use, which makes bundling profitable. Catalogue depth is a barrier to entry, concentrating the market into a natural oligopoly. The per-stream payment artists contest is not a rate but pooled proportional sharing, divided by total streams from a common revenue pool.',
    keyTerms: ['marginal cost', 'subscriptions', 'catalogue', 'bundling', 'barrier to entry', 'oligopoly', 'per-stream', 'revenue'],
    minWords: 40,
  },
]

export const EXTRA_SPOKEN_SUMMARY_ITEMS_4: SpokenSummaryItem[] = [
  {
    id: 'sst-attention',
    audioId: 'lec-attention',
    question:
      'Listen to the recording and write a summary of 50 to 70 words. Include the main idea and the most important supporting details. You have ten seconds during the recording to prepare your answer.',
    reference:
      'The lecture argues that attention is a family of processes rather than a single spotlight. Selection biases neurons toward targets at the earliest stage, and capacity is the binding constraint, holding roughly four items. The attentional blink demonstrates a refractory period that blocks a second target, and multitasking is really rapid task-switching with measurable costs. Attention is therefore a narrow bottleneck shaped by the environment, not a skill of character.',
    keyTerms: ['attention', 'selection', 'capacity', 'attentional blink', 'refractory period', 'multitasking', 'bottleneck', 'environment'],
    minWords: 40,
  },
  {
    id: 'sst-thermometer',
    audioId: 'conv-thermometer',
    question:
      'Listen to the recording and write a summary of 50 to 70 words. Include the main idea and the most important supporting details. You have ten seconds during the recording to prepare your answer.',
    reference:
      'The curator explains that the earliest instrument was a thermoscope, showing that air expands with heat but lacking a scale. A scale needed reproducible fixed points and a uniform division of the interval, which took decades because early makers chose different references, from cellars to ice and salt mixtures. Fahrenheit and Celsius standardised the reference points, and the modern form spread because a uniform scale makes measurement comparable across instruments.',
    keyTerms: ['thermoscope', 'scale', 'fixed points', 'uniform', 'references', 'Fahrenheit', 'Celsius', 'comparable'],
    minWords: 40,
  },
]

export const EXTRA_GROUP_DISCUSSION_ITEMS_4: GroupDiscussionItem[] = [
  {
    id: 'sgd-urban-biodiversity',
    audioId: 'gd-urban-biodiversity',
    question:
      'Listen to the discussion and summarise it in between 40 and 90 seconds. Report the group\'s overall stance, the main points each speaker made, and where they disagreed.',
    reference:
      'The panel agrees that urban biodiversity is real, substantial and lost by default rather than by decision. The ecologist shows that cities hold a surprising share of regional species, including pollinators, and that connectivity between patches is the strongest predictor of which survive. The planner argues the cheapest gains lie in space already committed — street trees, swales and railway margins — and that corridors must be named before development value is assigned. The gardener counters that public value sustains protection, citing a community garden on a former car park that now holds forty plant species and a hedgehog. They converge on managing existing land for movement, differing only on whether species data or public value should carry the argument, and agree that designing for the hedgehog and the person watching it is the same case.',
    keyTerms: ['biodiversity', 'connectivity', 'patches', 'corridors', 'pollinators', 'development value', 'public value', 'car park'],
    minWords: 40,
  },
  {
    id: 'sgd-microplastics',
    audioId: 'gd-microplastics',
    question:
      'Listen to the discussion and summarise it in between 40 and 90 seconds. Report the group\'s overall stance, the main points each speaker made, and where they disagreed.',
    reference:
      'The panel accepts that microplastic exposure is universal while the harm remains uncertain, because the dose-response relationship is unestablished for most particle types. The scientist stresses that absent proof is not proof of absence; the analyst invokes the precautionary principle and proposes targeting nameable sources — laundry filters, pellet containment and tyre wear standards with measurable targets; the industry representative accepts pellets on economic grounds, negotiates filters, and asks for funded tyre testing. They converge on a source-specific rather than product-specific response, revisited as evidence matures, with the public goal stated as fewer particles entering the environment and auditable measures per kilometre, per wash and per kilogram of resin.',
    keyTerms: ['microplastics', 'dose-response', 'precautionary principle', 'pellet', 'laundry filters', 'tyre', 'source-specific', 'auditable'],
    minWords: 40,
  },
]
