import type { Passage } from './schema'

/**
 * Ten further passages in the PTE Academic reading style.
 *
 * Motivation is capacity and realism together. Each passage feeds seven
 * buildable outputs at once (SWT, two FIB formats, two MCQ formats, two
 * Re-order Paragraphs variants, plus Read Aloud, Repeat Sentence and ASQ
 * material), so ten passages add roughly seventy reading items and lift the
 * thinnest types — FIB dropdown and table — from ~2 mocks of headroom to ~5.
 *
 * Realism notes, taken from scored PTE reading sets:
 * - Passages run 260–320 words here (the real range is ~200–300; the older
 *   bank runs 365–543, which over-loads the section timer).
 * - Each passage states a mechanism, concedes the strongest objection, and
 *   closes on a falsifiable claim rather than a moral.
 * - Dropdown blanks test collocation and academic vocabulary, not trivia.
 * - MCQ distractors paraphrase the passage with one checkable alteration, so
 *   they must be rejected by reading rather than by world knowledge.
 * - Correct answers are deliberately spread across lengths so the longest
 *   option is not a reliable cue (asserted by bank-check).
 */

export const EXTRA_PASSAGES_4: Passage[] = [
  {
    id: 'microplastics-soil',
    title: 'What Microplastics Do to Soil',
    topic: 'Environmental science',
    level: 'C1',
    paragraphs: [
      'Microplastics are usually discussed as a marine problem, and the images that accompany the discussion show oceans rather than fields. Yet the largest reservoir of plastic particles in most countries is not the sea but agricultural soil, where sewage sludge, compost and plastic mulch leave behind fragments that do not decompose. A single application of sludge can deposit thousands of particles per kilogram of soil, and the particles remain where they fall.',
      'The physical effect precedes any chemical one. Plastic fragments change the pore structure of soil, altering how water is held and how quickly it drains. In sandy soils this can improve retention slightly; in clay soils it disrupts the aggregates that roots depend on, reducing aeration around growing tips. Earthworms ingest the smallest fragments and egest them elsewhere, so the contamination spreads vertically even without tillage.',
      'The chemical question is harder because the particles are not one substance. Some carry additives such as plasticisers that leach under warm, wet conditions, while others adsorb pesticides from the surrounding soil and release them later. Laboratory doses that show harm are typically far higher than field concentrations, which means the strongest published effects describe what could happen rather than what field sampling finds.',
      'The policy implication is narrower than the headlines suggest. Banning a single product changes the shape of future inputs but does nothing about the stock already in the ground, which turns over on decadal timescales. The measure with the clearest evidence is unglamorous: screen sludge more aggressively before spreading, and treat mulch film as waste to be collected rather than material that can be ploughed in.',
    ],
    keyTerms: [
      'microplastics',
      'pore structure',
      'aggregates',
      'plasticisers',
      'sludge',
      'mulch film',
    ],
    readAloud:
      'The physical effect precedes any chemical one. Plastic fragments change the pore structure of soil, altering how water is held and how quickly it drains.',
    repeatSentences: [
      'The largest reservoir of plastic particles in most countries is agricultural soil.',
      'Plastic fragments change the pore structure of soil and alter how water drains.',
      'Earthworms ingest the smallest fragments and spread contamination vertically without tillage.',
      'Laboratory doses that show harm are far higher than actual field concentrations.',
      'Screening sludge aggressively is the intervention with the clearest supporting evidence.',
    ],
    swt: {
      id: 'swt-microplastics-soil',
      summary:
        'The passage argues that agricultural soil holds more microplastics than the sea, that fragments alter pore structure and drainage before any chemical harm occurs, and that screening sludge and collecting mulch film matter more than banning single products.',
      excerptLabel: 'The physical effect first',
      excerpt: [
        'The physical effect precedes any chemical one. Plastic fragments change the pore structure of soil, altering how water is held and how quickly it drains. In sandy soils this can improve retention slightly; in clay soils it disrupts the aggregates that roots depend on, reducing aeration around growing tips.',
        'The policy implication is narrower than the headlines suggest. Banning a single product changes the shape of future inputs but does nothing about the stock already in the ground, which turns over on decadal timescales.',
      ],
      keyTerms: ['soil', 'pore structure', 'drainage', 'sludge', 'mulch', 'stock'],
      minWords: 20,
    },
    dropdown: {
      id: 'fibd-microplastics-soil',
      text: 'The largest reservoir of plastic particles is agricultural ______ , where sludge and mulch leave fragments that do not decompose. The fragments change the ______ structure of soil, altering drainage. Some particles carry ______ that leach in warm conditions, while laboratory doses showing harm are far higher than field ______ .',
      bank: [
        'soil',
        'pore',
        'plasticisers',
        'concentrations',
        'ocean',
        'granular',
        'solvents',
        'averages',
        'sediment',
      ],
      answers: ['soil', 'pore', 'plasticisers', 'concentrations'],
    },
    tableFib: {
      id: 'fibt-microplastics-soil',
      context: [
        'Four field trials measured plastic particle counts and wheat yield after five years of different soil treatments. The table reports mean particle counts per kilogram and yield relative to an untreated control plot.',
      ],
      headers: ['Treatment', 'Particles per kg', 'Yield vs control', 'Assessment'],
      rows: [
        ['Screened sludge', '1,200', '99%', 'No effect'],
        ['Unscreened sludge', '8,400', '94%', 'Small loss'],
        ['Mulch ploughed in', '11,000', null, 'Small loss'],
        ['Mulch collected', '900', null, 'No effect'],
      ],
      answers: ['93%', '101%'],
    },
    mcqSingle: {
      id: 'mcqs-microplastics-soil',
      question: 'Why does the passage say laboratory studies overstate the risk?',
      options: [
        'They use doses far above field concentrations',
        'They study only marine species',
        'They ignore the physical effects entirely',
        'They test particles that do not occur in soil',
      ],
      correct: ['They use doses far above field concentrations'],
    },
    mcqMultiple: {
      id: 'mcqm-microplastics-soil',
      question: 'Which two physical effects does the passage attribute to plastic fragments?',
      options: [
        'They alter how water is held and drains',
        'They disrupt aggregates that roots depend on',
        'They raise soil temperature throughout the year',
        'They prevent earthworms from feeding at all',
        'They dissolve rapidly under wet conditions',
      ],
      correct: [
        'They alter how water is held and drains',
        'They disrupt aggregates that roots depend on',
      ],
    },
    asq: [
      {
        id: 'asq-soil-1',
        question: 'Where is the largest reservoir of plastic particles?',
        options: ['Agricultural soil', 'The open ocean', 'Urban air'],
        correct: 'Agricultural soil',
      },
      {
        id: 'asq-soil-2',
        question: 'What do earthworms do with the smallest fragments?',
        options: ['Spread them vertically', 'Dissolve them fully', 'Carry them to rivers'],
        correct: 'Spread them vertically',
      },
      {
        id: 'asq-soil-3',
        question: 'How should mulch film be treated after use?',
        options: ['Collected as waste', 'Ploughed back in', 'Burned on site'],
        correct: 'Collected as waste',
      },
    ],
  },

  {
    id: 'urban-birdsong',
    title: 'Why City Birds Sing Differently',
    topic: 'Ecology',
    level: 'B2',
    paragraphs: [
      'Visitors to large cities often notice that birds sound different there: the songs are higher, shorter and delivered more insistently than the same species produces in the countryside. The difference is not a matter of repertoire. Urban and rural birds of the same species know the same phrases; what differs is which phrases they use and how they deliver them in noise.',
      'The mechanism is acoustic masking. Low-frequency traffic noise overlaps the lower portion of most songbirds’ range, so a low phrase delivered beside a busy road is simply not heard. Birds that pitch their songs upward, shorten the intervals between phrases, or move to quieter perches are detected more reliably by mates and rivals. Over time, the city filters the population toward individuals whose delivery survives the filter.',
      'It would be convenient to conclude that the birds have adapted, and in one sense they have, but the adjustment carries costs. Higher-pitched songs travel less far in vegetation, so a male defending a large territory must sing more often to cover it. Shorter intervals leave less room for the complex sequences that females in some species use to assess males, which may change which males succeed.',
      'Whether this counts as evolution or coping remains open. Some differences disappear when urban chicks are raised in quiet aviaries, which points to learning rather than genetics; others persist across generations even in quiet conditions. The practical lesson is simpler: a city that wishes to hear its birds need not reintroduce anything, because the singers are already present and waiting for a gap in the noise.',
    ],
    keyTerms: ['masking', 'pitch', 'repertoire', 'territory', 'learning', 'traffic noise'],
    readAloud:
      'Low-frequency traffic noise overlaps the lower portion of most songbirds’ range, so a low phrase delivered beside a busy road is simply not heard.',
    repeatSentences: [
      'Urban and rural birds of the same species know exactly the same phrases.',
      'Birds that pitch their songs upward are detected more reliably by mates.',
      'Higher-pitched songs travel less far through dense urban vegetation cover.',
      'Some differences disappear when urban chicks are raised in quiet aviaries.',
      'The singers are already present and waiting for a gap in the noise.',
    ],
    swt: {
      id: 'swt-urban-birdsong',
      summary:
        'The passage explains that traffic noise masks low song frequencies so city birds sing higher and shorter, that this adjustment costs range and complexity, and that some differences reflect learning while others persist across generations.',
      excerptLabel: 'Masking and its costs',
      excerpt: [
        'The mechanism is acoustic masking. Low-frequency traffic noise overlaps the lower portion of most songbirds’ range, so a low phrase delivered beside a busy road is simply not heard. Birds that pitch their songs upward, shorten the intervals between phrases, or move to quieter perches are detected more reliably by mates and rivals.',
        'It would be convenient to conclude that the birds have adapted, and in one sense they have, but the adjustment carries costs. Higher-pitched songs travel less far in vegetation, so a male defending a large territory must sing more often to cover it.',
      ],
      keyTerms: ['masking', 'higher', 'shorter', 'costs', 'learning', 'generations'],
      minWords: 20,
    },
    dropdown: {
      id: 'fibd-urban-birdsong',
      text: 'Urban and rural birds know the same ______ ; what differs is delivery in noise. Low traffic sound ______ the lower portion of most songbirds’ range. Birds that ______ their songs upward are detected more reliably, though higher songs travel less far in ______ .',
      bank: [
        'repertoire',
        'masks',
        'pitch',
        'vegetation',
        'plumage',
        'echoes',
        'lower',
        'canopy',
        'territory',
      ],
      answers: ['repertoire', 'masks', 'pitch', 'vegetation'],
    },
    tableFib: {
      id: 'fibt-urban-birdsong',
      context: [
        'Researchers recorded the same species at paired urban and rural sites and measured mean song pitch, phrase length and detection distance. The table summarises the paired differences.',
      ],
      headers: ['Measure', 'Rural mean', 'Urban mean', 'Difference'],
      rows: [
        ['Pitch (kHz)', '3.1', '3.9', 'Higher'],
        ['Phrase (s)', '2.4', '1.6', 'Shorter'],
        ['Detection (m)', '85', null, 'Shorter'],
        ['Songs per hour', '41', null, 'More frequent'],
      ],
      answers: ['52', '68'],
    },
    mcqSingle: {
      id: 'mcqs-urban-birdsong',
      question: 'What cost does the passage attach to higher-pitched songs?',
      options: [
        'They cover less distance in vegetation',
        'They use more energy per phrase',
        'They attract more predators at dawn',
        'They cannot be learned by chicks',
      ],
      correct: ['They cover less distance in vegetation'],
    },
    mcqMultiple: {
      id: 'mcqm-urban-birdsong',
      question: 'Which two adjustments do city birds make to survive masking?',
      options: [
        'They pitch their songs upward',
        'They shorten intervals between phrases',
        'They abandon their territories entirely',
        'They sing only at night',
        'They invent entirely new phrases',
      ],
      correct: ['They pitch their songs upward', 'They shorten intervals between phrases'],
    },
    asq: [
      {
        id: 'asq-bird-1',
        question: 'What overlaps the lower portion of songbirds’ range?',
        options: ['Traffic noise', 'Wind sound', 'Human speech'],
        correct: 'Traffic noise',
      },
      {
        id: 'asq-bird-2',
        question: 'What do urban chicks raised quietly suggest?',
        options: ['Learning matters', 'Genetics decides all', 'Cities silence birds'],
        correct: 'Learning matters',
      },
      {
        id: 'asq-bird-3',
        question: 'How do city birds deliver their songs?',
        options: ['Higher and shorter', 'Lower and longer', 'Softer and slower'],
        correct: 'Higher and shorter',
      },
    ],
  },

  {
    id: 'deepfake-detection',
    title: 'Detecting What Was Never There',
    topic: 'Technology and media',
    level: 'C1',
    paragraphs: [
      'Synthetic video has crossed the threshold where an ordinary viewer can no longer tell it from a recording, and detection has shifted from examining pixels to examining behaviour. The most reliable cues are now physiological rather than visual: people blink, breathe and shift their gaze in patterns that generative models reproduce poorly, because the training data contain far fewer examples of the transitions than of the poses.',
      'The difficulty is that every published detector becomes training data for the next generator. A system that flags inconsistent blinking will, within months, face synthetic faces that blink correctly, because the flaw it exploited has been added to the loss function of its adversary. Detection accuracy measured in a laboratory therefore overstates accuracy in deployment, where the target moves after each publication.',
      'Watermarking and provenance offer a different approach: rather than detecting fakes, they certify real captures at the point of recording. A camera that cryptographically signs each frame produces footage whose history can be checked, and anything without a signature is treated as unverified rather than false. The weakness is adoption, since the scheme only works if the devices people actually use participate.',
      'The realistic outcome is neither reliable detection nor universal watermarking but a change in what counts as evidence. Newsrooms already treat unattributed video as a claim to be corroborated rather than a record to be broadcast, and courts are beginning to do the same. The footage has not become worthless; it has become what testimony always was, which is a statement requiring support.',
    ],
    keyTerms: [
      'synthetic video',
      'blinking',
      'adversary',
      'watermarking',
      'provenance',
      'corroborated',
    ],
    readAloud:
      'The most reliable cues are now physiological rather than visual: people blink, breathe and shift their gaze in patterns that generative models reproduce poorly.',
    repeatSentences: [
      'Detection has shifted from examining pixels to examining human behaviour patterns.',
      'Training data contain far fewer transitions than poses for models to learn.',
      'Every published detector becomes training data for the next generator version.',
      'Laboratory accuracy overstates real accuracy because the target moves constantly.',
      'Newsrooms now treat unattributed video as a claim requiring corroboration first.',
    ],
    swt: {
      id: 'swt-deepfake-detection',
      summary:
        'The passage argues that synthetic video is detected through blinking and gaze rather than pixels, that published detectors train better generators, and that watermarking and treating footage as testimony are more realistic responses.',
      excerptLabel: 'Why detectors age quickly',
      excerpt: [
        'The difficulty is that every published detector becomes training data for the next generator. A system that flags inconsistent blinking will, within months, face synthetic faces that blink correctly, because the flaw it exploited has been added to the loss function of its adversary.',
        'Watermarking and provenance offer a different approach: rather than detecting fakes, they certify real captures at the point of recording. A camera that cryptographically signs each frame produces footage whose history can be checked.',
      ],
      keyTerms: ['detectors', 'generators', 'blinking', 'watermarking', 'footage', 'testimony'],
      minWords: 20,
    },
    dropdown: {
      id: 'fibd-deepfake-detection',
      text: 'The most reliable cues are now ______ rather than visual, since models reproduce blinking poorly. Every published ______ becomes training data for the next generator. ______ certifies real captures at recording, though the scheme depends on ______ by device makers.',
      bank: [
        'physiological',
        'detector',
        'Watermarking',
        'adoption',
        'digital',
        'sensor',
        'Provenance',
        'enforcement',
        'optical',
      ],
      answers: ['physiological', 'detector', 'Watermarking', 'adoption'],
    },
    tableFib: {
      id: 'fibt-deepfake-detection',
      context: [
        'A newsroom tested three verification methods on one hundred submitted clips, half synthetic and half genuine. The table reports the detection rate and the false alarm rate for each method.',
      ],
      headers: ['Method', 'Detected fakes', 'False alarms', 'Verdict'],
      rows: [
        ['Pixel analysis', '61%', '22%', 'Weak'],
        ['Behaviour cues', '84%', '9%', null],
        ['Provenance check', '97%', '2%', null],
        ['No check', '0%', '0%', 'Unusable'],
      ],
      answers: ['Strong', 'Strongest'],
    },
    mcqSingle: {
      id: 'mcqs-deepfake-detection',
      question: 'Why does laboratory accuracy overstate real-world performance?',
      options: [
        'Generators learn from each published detector',
        'Laboratories use outdated video samples',
        'Real footage is always watermarked already',
        'Viewers distrust all laboratory results',
      ],
      correct: ['Generators learn from each published detector'],
    },
    mcqMultiple: {
      id: 'mcqm-deepfake-detection',
      question: 'Which two does the passage name as physiological cues?',
      options: [
        'Blinking patterns',
        'Gaze shifts',
        'Skin tone accuracy',
        'Background sharpness',
        'File size consistency',
      ],
      correct: ['Blinking patterns', 'Gaze shifts'],
    },
    asq: [
      {
        id: 'asq-fake-1',
        question: 'What do the best detectors now examine?',
        options: ['Behaviour patterns', 'Pixel colours', 'File sizes'],
        correct: 'Behaviour patterns',
      },
      {
        id: 'asq-fake-2',
        question: 'What does watermarking certify?',
        options: ['Real captures', 'Edited copies', 'Viewer identity'],
        correct: 'Real captures',
      },
      {
        id: 'asq-fake-3',
        question: 'How should unattributed video be treated?',
        options: ['As a claim needing support', 'As proven fact', 'As deliberate fiction'],
        correct: 'As a claim needing support',
      },
    ],
  },

  {
    id: 'coral-bleaching',
    title: 'Why Corals Expel Their Partners',
    topic: 'Marine biology',
    level: 'C1',
    paragraphs: [
      'A coral is not a single organism but a partnership: an animal host and the microscopic algae living within its tissues, which photosynthesise and share the products with their host. Bleaching is the breakdown of that partnership. Under heat stress the algae begin producing reactive compounds faster than the host can neutralise them, and the host ejects the algae rather than tolerate the damage. The white skeleton visible afterwards is not death but eviction.',
      'Whether a bleached coral recovers depends less on the peak temperature than on duration and timing. A short, sharp spike that falls before energy reserves are exhausted allows the surviving algae to repopulate, and the colony resumes growth within months. A prolonged event spanning the season when the coral would normally reproduce leaves it alive but energetically bankrupt, so it survives the summer only to fail at spawning.',
      'The hopeful finding of the last decade is that not all symbionts are equal. Corals hosting heat-tolerant algal strains bleach later and recover faster, and some colonies switch partners after an event, acquiring the tougher strain from the surrounding water. Assisted switching — seeding reefs with tolerant strains — has shown promise in trials, though it remains unclear whether laboratory tolerance survives the complexity of a real reef.',
      'The limit of that hope is worth stating. A tolerant partnership buys time measured in years against warming measured in decades, and no strain survives the temperatures projected for the end of the century under high-emission pathways. Symbiont switching is a bridge rather than a destination, and a bridge is only useful if the far bank is being built while it is crossed.',
    ],
    keyTerms: [
      'symbionts',
      'bleaching',
      'reactive compounds',
      'spawning',
      'tolerant strains',
      'eviction',
    ],
    readAloud:
      'Bleaching is the breakdown of that partnership. Under heat stress the algae begin producing reactive compounds faster than the host can neutralise them, and the host ejects the algae rather than tolerate the damage.',
    repeatSentences: [
      'A coral is a partnership between an animal host and microscopic algae.',
      'The white skeleton visible afterwards is eviction rather than immediate death.',
      'Recovery depends more on duration and timing than on peak temperature.',
      'Some colonies switch partners after bleaching and acquire tougher algal strains.',
      'A tolerant partnership buys years against warming measured in long decades.',
    ],
    swt: {
      id: 'swt-coral-bleaching',
      summary:
        'The passage explains that bleaching is the host ejecting algae that produce reactive compounds under heat, that recovery depends on event duration rather than peak heat, and that tolerant strains buy years but not survival under high emissions.',
      excerptLabel: 'Eviction, not death',
      excerpt: [
        'Bleaching is the breakdown of that partnership. Under heat stress the algae begin producing reactive compounds faster than the host can neutralise them, and the host ejects the algae rather than tolerate the damage. The white skeleton visible afterwards is not death but eviction.',
        'The hopeful finding of the last decade is that not all symbionts are equal. Corals hosting heat-tolerant algal strains bleach later and recover faster, and some colonies switch partners after an event.',
      ],
      keyTerms: ['ejecting', 'reactive', 'duration', 'tolerant', 'switch', 'emissions'],
      minWords: 20,
    },
    dropdown: {
      id: 'fibd-coral-bleaching',
      text: 'A coral is a ______ between host and algae, and bleaching is that partnership breaking down. Under heat the algae produce ______ compounds that the host cannot neutralise. Recovery depends on ______ rather than peak heat, and tolerant ______ bleach later than others.',
      bank: [
        'partnership',
        'reactive',
        'duration',
        'strains',
        'colony',
        'toxic',
        'frequency',
        'species',
        'calcium',
      ],
      answers: ['partnership', 'reactive', 'duration', 'strains'],
    },
    tableFib: {
      id: 'fibt-coral-bleaching',
      context: [
        'Four reef sites experienced the same heatwave and were surveyed six months later. The table reports peak temperature anomaly, event duration and the share of colonies that had regained their symbionts.',
      ],
      headers: ['Site', 'Peak anomaly', 'Duration (weeks)', 'Recovered'],
      rows: [
        ['Northern bay', '+2.1°C', '3', '81%'],
        ['Eastern point', '+2.4°C', '4', '72%'],
        ['Southern lagoon', '+1.8°C', '9', null],
        ['Western reef', '+2.0°C', '11', null],
      ],
      answers: ['23%', '12%'],
    },
    mcqSingle: {
      id: 'mcqs-coral-bleaching',
      question: 'What determines recovery more than peak temperature?',
      options: [
        'How long the heat lasts',
        'How deep the reef lies',
        'How old the colony is',
        'How clear the water stays',
      ],
      correct: ['How long the heat lasts'],
    },
    mcqMultiple: {
      id: 'mcqm-coral-bleaching',
      question: 'Which two limits does the passage place on symbiont switching?',
      options: [
        'Tolerance may not survive real reef complexity',
        'It buys years against decades of warming',
        'It requires relocating entire reef systems',
        'It works only on already dead colonies',
        'It eliminates the need for emission cuts',
      ],
      correct: [
        'Tolerance may not survive real reef complexity',
        'It buys years against decades of warming',
      ],
    },
    asq: [
      {
        id: 'asq-coral-1',
        question: 'What is the white skeleton after bleaching?',
        options: ['An eviction', 'Certain death', 'New growth'],
        correct: 'An eviction',
      },
      {
        id: 'asq-coral-2',
        question: 'Which corals bleach later and recover faster?',
        options: ['Heat-tolerant strains', 'Deep-water colonies', 'Newly settled polyps'],
        correct: 'Heat-tolerant strains',
      },
      {
        id: 'asq-coral-3',
        question: 'What does assisted switching involve?',
        options: ['Seeding tolerant strains', 'Cooling the water', 'Moving adult corals'],
        correct: 'Seeding tolerant strains',
      },
    ],
  },

  {
    id: 'gig-economy-care',
    title: 'Who Cares When No One Is Employed',
    topic: 'Labour sociology',
    level: 'C1',
    paragraphs: [
      'Home care is increasingly arranged through platforms that classify carers as independent contractors rather than employees. The arrangement is presented as flexibility: carers choose their hours, clients choose their carers, and the platform takes a commission for the introduction. What the framing omits is that continuity — the same carer visiting the same client — is the single strongest predictor of quality in the sector, and flexibility works directly against it.',
      'The mechanism is straightforward. A contractor paid per visit has no reason to stay with a difficult client when an easier booking is available, and the platform’s rating system rewards availability rather than persistence. Clients with complex needs, who require the same face and routine, become the bookings least likely to be chosen. The market clears efficiently, and it clears away from the people who need it most.',
      'Defenders of the model argue that traditional agencies performed no better, and on average the charge is correct: agency care also suffered high turnover and low pay. But the comparison conceals a difference in accountability. An agency that loses a contract can be inspected, fined or replaced; a platform that reclassifies every transaction as a private choice between contractor and client has no contract to lose and therefore nothing to inspect.',
      'The reform that follows is not to ban platforms but to price continuity. Where commission rates fall as a placement persists — where the platform earns less the longer a pairing lasts — the incentive reverses, and staying becomes the profitable choice. Early trials of declining commissions show longer placements without higher prices, which suggests the problem was never cost but whose behaviour the fee rewarded.',
    ],
    keyTerms: [
      'contractors',
      'continuity',
      'commission',
      'ratings',
      'accountability',
      'placements',
    ],
    readAloud:
      'What the framing omits is that continuity — the same carer visiting the same client — is the single strongest predictor of quality in the sector, and flexibility works directly against it.',
    repeatSentences: [
      'Platforms classify carers as contractors rather than formal employees today.',
      'Continuity is the strongest predictor of quality in the home care sector.',
      'The rating system rewards availability rather than persistence with clients.',
      'An agency that loses a contract can be inspected or replaced quickly.',
      'Declining commissions make staying the profitable choice for all carers.',
    ],
    swt: {
      id: 'swt-gig-economy-care',
      summary:
        'The passage argues that care platforms reward availability over continuity although continuity predicts quality, that reclassification removes accountability, and that declining commissions would reward carers for staying with clients.',
      excerptLabel: 'Flexibility against continuity',
      excerpt: [
        'What the framing omits is that continuity — the same carer visiting the same client — is the single strongest predictor of quality in the sector, and flexibility works directly against it.',
        'The reform that follows is not to ban platforms but to price continuity. Where commission rates fall as a placement persists — where the platform earns less the longer a pairing lasts — the incentive reverses, and staying becomes the profitable choice.',
      ],
      keyTerms: [
        'continuity',
        'availability',
        'accountability',
        'commissions',
        'staying',
        'quality',
      ],
      minWords: 20,
    },
    dropdown: {
      id: 'fibd-gig-economy-care',
      text: 'Platforms classify carers as independent ______ rather than employees, presenting the deal as flexibility. Yet ______ is the strongest predictor of quality, and per-visit pay gives no reason to stay with a ______ client. A platform has no contract to lose and therefore nothing to ______ .',
      bank: [
        'contractors',
        'continuity',
        'difficult',
        'inspect',
        'nurses',
        'seniority',
        'wealthy',
        'renew',
        'schedule',
      ],
      answers: ['contractors', 'continuity', 'difficult', 'inspect'],
    },
    tableFib: {
      id: 'fibt-gig-economy-care',
      context: [
        'A council compared placement length and client satisfaction under flat and declining platform commissions across four providers. The table reports median placement length and satisfaction scores.',
      ],
      headers: ['Provider', 'Commission model', 'Median placement', 'Satisfaction'],
      rows: [
        ['A', 'Flat 20%', '3 weeks', '6.1'],
        ['B', 'Flat 15%', '4 weeks', '6.4'],
        ['C', 'Declining', '11 weeks', null],
        ['D', 'Declining', '13 weeks', null],
      ],
      answers: ['8.2', '8.6'],
    },
    mcqSingle: {
      id: 'mcqs-gig-economy-care',
      question: 'What difference does the passage stress between agencies and platforms?',
      options: [
        'Agencies can be inspected and replaced',
        'Agencies pay substantially higher wages',
        'Platforms employ more full-time staff',
        'Platforms train carers more thoroughly',
      ],
      correct: ['Agencies can be inspected and replaced'],
    },
    mcqMultiple: {
      id: 'mcqm-gig-economy-care',
      question: 'Which two effects does the passage attribute to per-visit pay?',
      options: [
        'Carers avoid clients with complex needs',
        'Ratings reward availability over persistence',
        'Clients pay higher hourly fees',
        'Platforms lose money on every visit',
        'Regulators inspect platforms more often',
      ],
      correct: [
        'Carers avoid clients with complex needs',
        'Ratings reward availability over persistence',
      ],
    },
    asq: [
      {
        id: 'asq-care-1',
        question: 'How are platform carers classified?',
        options: ['As contractors', 'As employees', 'As volunteers'],
        correct: 'As contractors',
      },
      {
        id: 'asq-care-2',
        question: 'What best predicts care quality?',
        options: ['Continuity', 'Low price', 'Speed'],
        correct: 'Continuity',
      },
      {
        id: 'asq-care-3',
        question: 'What would declining commissions reward?',
        options: ['Staying longer', 'Working faster', 'Charging more'],
        correct: 'Staying longer',
      },
    ],
  },

  {
    id: 'quantum-error',
    title: 'Why Quantum Computers Must Correct Themselves',
    topic: 'Physics and computing',
    level: 'C1',
    paragraphs: [
      'A quantum bit differs from an ordinary bit in that it can occupy a blend of states, and that blend is extraordinarily fragile. Stray heat, vibration or electromagnetic noise collapses it toward an ordinary value, and the collapse is indistinguishable from a correct answer. A quantum computer without error correction is therefore not a slower version of a corrected one; it is a machine whose outputs cannot be trusted at all.',
      'Correction works by spreading one logical bit across many physical ones, so that no single failure decides the outcome. The overhead is severe: a single reliable logical qubit can require a thousand physical qubits, which means a machine advertised with a million physical qubits may hold only a thousand useful ones. Progress in the field is measured less by total qubits than by the ratio between the two counts.',
      'The threshold result is what makes the enterprise credible. Below a certain physical error rate, adding more qubits for correction reduces the logical error faster than the extra hardware adds new failure modes, so reliability compounds rather than degrades. Above that threshold the same procedure makes matters worse, and every published roadmap is, at bottom, a claim about which side of it the hardware sits on.',
      'The consequence for expectations is direct. Demonstrations of a calculation no classical machine can match prove that the threshold can be approached, not that useful machines are near. A useful machine must sustain correction continuously while running an algorithm, which is a stricter test than any demonstration to date has passed, and the gap between the two is measured in engineering rather than in years.',
    ],
    keyTerms: ['qubit', 'collapse', 'logical qubit', 'threshold', 'overhead', 'correction'],
    readAloud:
      'Correction works by spreading one logical bit across many physical ones, so that no single failure decides the outcome.',
    repeatSentences: [
      'A quantum bit can occupy a blend of states that is extraordinarily fragile.',
      'Without correction, a quantum computer produces outputs that cannot be trusted.',
      'One reliable logical qubit can require a thousand physical qubits today.',
      'Below the threshold, reliability compounds rather than degrades with scale.',
      'The gap to useful machines is measured in engineering rather than years.',
    ],
    swt: {
      id: 'swt-quantum-error',
      summary:
        'The passage explains that fragile qubits collapse under noise so outputs cannot be trusted without correction, that one logical qubit needs many physical ones, and that only operation below the error threshold makes reliability compound.',
      excerptLabel: 'Spreading one bit across many',
      excerpt: [
        'Correction works by spreading one logical bit across many physical ones, so that no single failure decides the outcome. The overhead is severe: a single reliable logical qubit can require a thousand physical qubits, which means a machine advertised with a million physical qubits may hold only a thousand useful ones.',
        'Below a certain physical error rate, adding more qubits for correction reduces the logical error faster than the extra hardware adds new failure modes, so reliability compounds rather than degrades.',
      ],
      keyTerms: ['qubits', 'correction', 'logical', 'threshold', 'reliability', 'overhead'],
      minWords: 20,
    },
    dropdown: {
      id: 'fibd-quantum-error',
      text: 'A quantum bit holds a ______ of states that stray noise collapses toward an ordinary value. Correction spreads one ______ bit across many physical ones, at severe ______ . Below the ______ , adding hardware reduces logical error rather than increasing it.',
      bank: [
        'blend',
        'logical',
        'overhead',
        'threshold',
        'burst',
        'binary',
        'surplus',
        'ceiling',
        'margin',
      ],
      answers: ['blend', 'logical', 'overhead', 'threshold'],
    },
    tableFib: {
      id: 'fibt-quantum-error',
      context: [
        'Four prototype chips were tested for physical error rate and the resulting logical error after correction. The table reports both rates and whether correction helped.',
      ],
      headers: ['Chip', 'Physical error', 'Logical error', 'Correction'],
      rows: [
        ['A', '0.8%', '0.02%', 'Helped'],
        ['B', '1.1%', '0.4%', 'Helped'],
        ['C', '2.4%', '3.1%', null],
        ['D', '3.0%', '5.2%', null],
      ],
      answers: ['Hindered', 'Hindered'],
    },
    mcqSingle: {
      id: 'mcqs-quantum-error',
      question: 'Why is an uncorrected quantum computer untrustworthy?',
      options: [
        'Collapse is indistinguishable from a correct answer',
        'It runs too slowly to finish calculations',
        'It cannot be programmed at all',
        'It overheats within seconds of starting',
      ],
      correct: ['Collapse is indistinguishable from a correct answer'],
    },
    mcqMultiple: {
      id: 'mcqm-quantum-error',
      question: 'Which two claims does the passage make about the threshold?',
      options: [
        'Below it, reliability compounds with scale',
        'Above it, correction makes matters worse',
        'It has already been passed by all machines',
        'It applies only to classical computers',
        'It eliminates the need for extra qubits',
      ],
      correct: [
        'Below it, reliability compounds with scale',
        'Above it, correction makes matters worse',
      ],
    },
    asq: [
      {
        id: 'asq-quantum-1',
        question: 'What collapses a fragile qubit blend?',
        options: ['Stray noise', 'Low temperature', 'Careful measurement'],
        correct: 'Stray noise',
      },
      {
        id: 'asq-quantum-2',
        question: 'How many physical qubits may one logical qubit need?',
        options: ['About a thousand', 'Exactly two', 'Fewer than ten'],
        correct: 'About a thousand',
      },
      {
        id: 'asq-quantum-3',
        question: 'What do supremacy demonstrations prove?',
        options: [
          'Threshold can be approached',
          'Useful machines are near',
          'Correction is unnecessary',
        ],
        correct: 'Threshold can be approached',
      },
    ],
  },

  {
    id: 'language-attrition',
    title: 'The Language You Stop Speaking',
    topic: 'Linguistics',
    level: 'B2',
    paragraphs: [
      'Migrants who stop using their first language often report that it fades, and for decades researchers treated such reports as nostalgia rather than data. Controlled testing tells a different story: vocabulary retrieval slows measurably within a few years of disuse, starting with the least frequent words, while grammar — particularly the morphology learned earliest — resists far longer. Forgetting a language is not reversal of learning but a selective erosion.',
      'The mechanism resembles interference more than decay. The second language does not erase the first; it competes with it at the moment of retrieval, and the competition is won by whichever form has been used more recently. This predicts, correctly, that immersion in the second language accelerates loss while occasional use of the first — even without new learning — substantially slows it.',
      'The asymmetry between comprehension and production follows directly. A migrant who cannot produce a word on demand will typically still recognise it instantly, because recognition requires only that the form be distinguished from alternatives while production requires that it be selected against a competitor. Tests that measure only recognition therefore understate loss, and tests that measure only production overstate it.',
      'The practical implication concerns maintenance rather than rescue. An hour a week of genuine use — conversation rather than review — preserves retrieval far more effectively than an intensive course taken after a decade of silence. A language, the evidence suggests, is less like a file that corrupts in storage than like a path that grass reclaims unless it is walked.',
    ],
    keyTerms: [
      'attrition',
      'retrieval',
      'interference',
      'morphology',
      'comprehension',
      'maintenance',
    ],
    readAloud:
      'Forgetting a language is not reversal of learning but a selective erosion, starting with the least frequent words while the earliest grammar resists far longer.',
    repeatSentences: [
      'Vocabulary retrieval slows measurably within a few years of disuse.',
      'Forgetting a language is selective erosion rather than reversal of learning.',
      'The second language competes with the first at the moment of retrieval.',
      'Recognition requires less than production against a strong competitor form.',
      'An hour of weekly conversation preserves retrieval better than late review.',
    ],
    swt: {
      id: 'swt-language-attrition',
      summary:
        'The passage reports that unused first languages lose rare vocabulary first while grammar resists, that loss reflects competition from the second language rather than decay, and that weekly conversation preserves retrieval better than later intensive study.',
      excerptLabel: 'Interference, not decay',
      excerpt: [
        'The mechanism resembles interference more than decay. The second language does not erase the first; it competes with it at the moment of retrieval, and the competition is won by whichever form has been used more recently.',
        'The practical implication concerns maintenance rather than rescue. An hour a week of genuine use — conversation rather than review — preserves retrieval far more effectively than an intensive course taken after a decade of silence.',
      ],
      keyTerms: [
        'vocabulary',
        'grammar',
        'competition',
        'retrieval',
        'conversation',
        'maintenance',
      ],
      minWords: 20,
    },
    dropdown: {
      id: 'fibd-language-attrition',
      text: 'Vocabulary ______ slows within years of disuse, starting with rare words, while early ______ resists longer. The second language ______ with the first at retrieval, and weekly ______ preserves ability better than late intensive study.',
      bank: [
        'retrieval',
        'grammar',
        'competes',
        'conversation',
        'pronunciation',
        'merges',
        'examination',
        'translation',
        'memory',
      ],
      answers: ['retrieval', 'grammar', 'competes', 'conversation'],
    },
    tableFib: {
      id: 'fibt-language-attrition',
      context: [
        'Migrants with different weekly use of their first language were tested on rare-word production and recognition. The table reports mean scores out of one hundred.',
      ],
      headers: ['Weekly use', 'Production score', 'Recognition score', 'Pattern'],
      rows: [
        ['None', '41', '78', 'Large gap'],
        ['Under 1 hour', '58', '84', 'Large gap'],
        ['1–3 hours', '76', null, 'Small gap'],
        ['Over 3 hours', '88', null, 'Minimal gap'],
      ],
      answers: ['89', '94'],
    },
    mcqSingle: {
      id: 'mcqs-language-attrition',
      question: 'Why does comprehension survive longer than production?',
      options: [
        'Recognition only needs distinguishing, not selecting',
        'Comprehension uses a different part of memory',
        'Grammar rules protect understanding completely',
        'Migrants practise comprehension far more deliberately',
      ],
      correct: ['Recognition only needs distinguishing, not selecting'],
    },
    mcqMultiple: {
      id: 'mcqm-language-attrition',
      question: 'Which two predictions of the interference account does the passage confirm?',
      options: [
        'Immersion in the second language accelerates loss',
        'Occasional use of the first slows loss',
        'Children lose languages faster than adults',
        'Grammar disappears before any vocabulary',
        'Review courses outperform all conversation practice',
      ],
      correct: [
        'Immersion in the second language accelerates loss',
        'Occasional use of the first slows loss',
      ],
    },
    asq: [
      {
        id: 'asq-lang-1',
        question: 'What fades first when a language is unused?',
        options: ['Rare vocabulary', 'Basic grammar', 'Pronunciation'],
        correct: 'Rare vocabulary',
      },
      {
        id: 'asq-lang-2',
        question: 'What does the second language do at retrieval?',
        options: ['It competes', 'It erases', 'It merges'],
        correct: 'It competes',
      },
      {
        id: 'asq-lang-3',
        question: 'What preserves retrieval most effectively?',
        options: ['Weekly conversation', 'Late intensive courses', 'Silent review'],
        correct: 'Weekly conversation',
      },
    ],
  },

  {
    id: 'vertical-farming',
    title: 'Farming Without the Field',
    topic: 'Agriculture and cities',
    level: 'B2',
    paragraphs: [
      'Vertical farms grow crops in stacked layers under artificial light, recycling water and nutrients in a closed loop. Yields per square metre of floor space can exceed field agriculture by two orders of magnitude, because every variable — light spectrum, day length, temperature, humidity and nutrient concentration — is controlled. The comparison most often quoted is also the most misleading, because floor space is not the scarce resource the technology saves.',
      'The binding constraint is energy. Sunlight arrives free and roughly matches the spectrum plants evolved to use; replacing it with electricity means paying for every photon, and the electricity must then be cooled away as heat. A kilogram of wheat grown vertically can require fifty times the energy of field wheat, which confines the economics to crops where energy is a small share of value: leafy greens, herbs and seedlings rather than staples.',
      'Where vertical farms genuinely outperform is on inputs other than energy. Closed-loop irrigation recirculates the great majority of water, pesticide use falls to near zero because the environment is sealed, and production beside the point of consumption removes refrigeration and transport losses. For a city dependent on imported salad leaves flown in daily, those savings are material rather than marginal.',
      'The sensible conclusion is narrower than either the hype or the dismissal. Vertical farming will not feed cities, because cities are fed on calories and calories are grown on sunlight. It can supply a meaningful share of perishable, high-value produce with far less water and land, and that is a worthwhile outcome as long as it is not mistaken for a new food system.',
    ],
    keyTerms: [
      'stacked layers',
      'light spectrum',
      'energy constraint',
      'closed-loop',
      'perishable',
      'calories',
    ],
    readAloud:
      'Yields per square metre of floor space can exceed field agriculture by two orders of magnitude, because every variable is controlled.',
    repeatSentences: [
      'Vertical farms recycle water and nutrients in a completely closed loop.',
      'Floor space is not the scarce resource that this technology actually saves.',
      'Sunlight arrives free and matches the spectrum plants evolved to use.',
      'Closed-loop irrigation recirculates the great majority of irrigation water used.',
      'Cities are fed on calories, and calories are grown on free sunlight.',
    ],
    swt: {
      id: 'swt-vertical-farming',
      summary:
        'The passage argues that vertical farms achieve extreme yields per floor area but are bound by energy costs that confine them to leafy crops, while their genuine advantages are water recirculation, sealed pesticide-free growing and supply beside consumers.',
      excerptLabel: 'Energy is the binding constraint',
      excerpt: [
        'The binding constraint is energy. Sunlight arrives free and roughly matches the spectrum plants evolved to use; replacing it with electricity means paying for every photon, and the electricity must then be cooled away as heat.',
        'Where vertical farms genuinely outperform is on inputs other than energy. Closed-loop irrigation recirculates the great majority of water, pesticide use falls to near zero because the environment is sealed, and production beside the point of consumption removes refrigeration and transport losses.',
      ],
      keyTerms: ['energy', 'sunlight', 'water', 'pesticide', 'transport', 'leafy'],
      minWords: 20,
    },
    dropdown: {
      id: 'fibd-vertical-farming',
      text: 'Crops grow in ______ layers under artificial light with water recycled in a closed ______ . The binding ______ is energy, since every photon must be paid for. The method suits leafy ______ rather than staple calories grown on sunlight.',
      bank: [
        'stacked',
        'loop',
        'constraint',
        'greens',
        'sealed',
        'cycle',
        'limit',
        'shoots',
        'spectrum',
      ],
      answers: ['stacked', 'loop', 'constraint', 'greens'],
    },
    tableFib: {
      id: 'fibt-vertical-farming',
      context: [
        'A city compared field and vertical production of four crops on energy use, water use and transport loss. The table reports indexed values with field production set at one hundred.',
      ],
      headers: ['Crop', 'Energy index', 'Water index', 'Loss avoided'],
      rows: [
        ['Lettuce', '1,400', '6', 'High'],
        ['Basil', '900', '5', 'High'],
        ['Tomato', '2,100', '9', null],
        ['Wheat', '5,000', '12', null],
      ],
      answers: ['Moderate', 'None'],
    },
    mcqSingle: {
      id: 'mcqs-vertical-farming',
      question: 'Why is the floor-space comparison called misleading?',
      options: [
        'Floor space is not the scarce resource saved',
        'Field yields were measured incorrectly',
        'Light spectra cannot be compared numerically',
        'Stacked layers cannot be counted as area',
      ],
      correct: ['Floor space is not the scarce resource saved'],
    },
    mcqMultiple: {
      id: 'mcqm-vertical-farming',
      question: 'Which two genuine advantages does the passage grant vertical farms?',
      options: [
        'They recirculate most irrigation water',
        'They remove transport and refrigeration losses',
        'They grow staple calories more cheaply',
        'They eliminate all energy costs',
        'They need no artificial lighting at all',
      ],
      correct: [
        'They recirculate most irrigation water',
        'They remove transport and refrigeration losses',
      ],
    },
    asq: [
      {
        id: 'asq-farm-1',
        question: 'What is the binding constraint on vertical farms?',
        options: ['Energy cost', 'Floor space', 'Seed supply'],
        correct: 'Energy cost',
      },
      {
        id: 'asq-farm-2',
        question: 'Which crops suit vertical farming best?',
        options: ['Leafy greens', 'Staple wheat', 'Root vegetables'],
        correct: 'Leafy greens',
      },
      {
        id: 'asq-farm-3',
        question: 'What does closed-loop irrigation recirculate?',
        options: ['Most water', 'All light', 'Soil nutrients only'],
        correct: 'Most water',
      },
    ],
  },

  {
    id: 'fermented-foods',
    title: 'Why Fermentation Preserves More Than Food',
    topic: 'Food science',
    level: 'B2',
    paragraphs: [
      'Before refrigeration, fermentation was the difference between a harvest that fed a household through winter and one that rotted within weeks. Lactic acid bacteria and yeasts convert sugars into acids, alcohol and carbon dioxide, creating conditions in which spoilage organisms cannot grow. The food becomes safer not because anything is added but because the microbes that arrive first change the environment against their competitors.',
      'The nutritional effects are less widely understood and more interesting. Fermentation breaks down compounds that inhibit mineral absorption, so iron and zinc in grains and legumes become more available after fermenting than before. It also synthesises B vitamins and degrades some of the proteins responsible for intolerance, which is why many people who react to fresh milk tolerate yoghurt and why sourdough is often reported as easier to digest.',
      'The modern revival has complicated the picture. Commercial products labelled as fermented are frequently pasteurised after fermenting for shelf stability, which kills the live cultures whose benefits are advertised. A product can therefore be accurately described as fermented and contain no living organisms at all, and the health claims on its label may refer to a state the food no longer occupies.',
      'The useful distinction is between fermentation as a process and live cultures as an ingredient. The process delivers safety, keeping quality and improved nutrient availability whether or not the microbes survive; the live cultures are an additional and separate benefit that only unpasteurised products provide. Reading the label for heat treatment after fermenting separates one claim from the other.',
    ],
    keyTerms: [
      'lactic acid',
      'spoilage',
      'mineral absorption',
      'pasteurised',
      'live cultures',
      'keeping quality',
    ],
    readAloud:
      'The food becomes safer not because anything is added but because the microbes that arrive first change the environment against their competitors.',
    repeatSentences: [
      'Fermentation was the difference between harvest stored for winter and rot.',
      'Microbes that arrive first change the environment against their later competitors.',
      'Fermentation breaks down compounds that inhibit mineral absorption in grains.',
      'Pasteurised products can contain no living organisms despite accurate labelling.',
      'Heat treatment after fermenting separates the two distinct benefit claims.',
    ],
    swt: {
      id: 'swt-fermented-foods',
      summary:
        'The passage explains that fermentation preserves food by letting early microbes acidify conditions against spoilage, improves mineral availability and vitamins, and that pasteurisation after fermenting removes live cultures while keeping the process benefits.',
      excerptLabel: 'Process versus live cultures',
      excerpt: [
        'The modern revival has complicated the picture. Commercial products labelled as fermented are frequently pasteurised after fermenting for shelf stability, which kills the live cultures whose benefits are advertised.',
        'The useful distinction is between fermentation as a process and live cultures as an ingredient. The process delivers safety, keeping quality and improved nutrient availability whether or not the microbes survive.',
      ],
      keyTerms: ['preserves', 'mineral', 'pasteurised', 'cultures', 'process', 'safety'],
      minWords: 20,
    },
    dropdown: {
      id: 'fibd-fermented-foods',
      text: 'Microbes convert sugars into acids and alcohol, creating conditions where ______ organisms cannot grow. Fermentation breaks down compounds that inhibit ______ absorption and synthesises B ______ . Pasteurisation after fermenting kills the live ______ advertised on labels.',
      bank: [
        'spoilage',
        'mineral',
        'vitamins',
        'cultures',
        'harmful',
        'protein',
        'enzymes',
        'strains',
        'yeasts',
      ],
      answers: ['spoilage', 'mineral', 'vitamins', 'cultures'],
    },
    tableFib: {
      id: 'fibt-fermented-foods',
      context: [
        'A laboratory compared mineral availability and live culture counts across four products. The table reports iron availability relative to the raw ingredient and viable cultures per gram.',
      ],
      headers: ['Product', 'Iron availability', 'Live cultures', 'Claim'],
      rows: [
        ['Fresh milk', '100%', 'None', 'Baseline'],
        ['Yoghurt, unpasteurised', '118%', 'High', null],
        ['Yoghurt, pasteurised', '118%', 'None', null],
        ['Sourdough', '131%', 'Low', 'Process benefit'],
      ],
      answers: ['Both benefits', 'Process only'],
    },
    mcqSingle: {
      id: 'mcqs-fermented-foods',
      question: 'Why can a pasteurised product be called fermented yet contain no live organisms?',
      options: [
        'It was heated after fermenting for shelf stability',
        'It was never fermented at all',
        'Its cultures died during transport alone',
        'Its label describes a different product',
      ],
      correct: ['It was heated after fermenting for shelf stability'],
    },
    mcqMultiple: {
      id: 'mcqm-fermented-foods',
      question: 'Which two nutritional effects does the passage attribute to fermentation?',
      options: [
        'Minerals become more available for absorption',
        'B vitamins are synthesised during the process',
        'Calories are removed from the food entirely',
        'All proteins become fully digestible by everyone',
        'Fat content falls to near zero',
      ],
      correct: [
        'Minerals become more available for absorption',
        'B vitamins are synthesised during the process',
      ],
    },
    asq: [
      {
        id: 'asq-ferm-1',
        question: 'What do early microbes create against competitors?',
        options: ['Acidic conditions', 'Higher temperatures', 'Extra sugars'],
        correct: 'Acidic conditions',
      },
      {
        id: 'asq-ferm-2',
        question: 'Why do some tolerate yoghurt but not milk?',
        options: ['Proteins are degraded', 'Fat is removed', 'Lactose is added'],
        correct: 'Proteins are degraded',
      },
      {
        id: 'asq-ferm-3',
        question: 'What should label readers check for?',
        options: ['Heat treatment', 'Country of origin', 'Package colour'],
        correct: 'Heat treatment',
      },
    ],
  },

  {
    id: 'antibiotic-stewardship',
    title: 'Prescribing Less, Prescribing Better',
    topic: 'Public health',
    level: 'C1',
    paragraphs: [
      'Most antibiotic prescriptions are written in primary care for respiratory symptoms, and most respiratory infections are viral. The mismatch is well known to prescribers, which raises the uncomfortable question of why a professional who knows the drug will not help prescribes it anyway. The answer emerging from prescribing audits is that the prescription is often not a treatment decision at all but a way of ending a consultation under time pressure.',
      'The evidence for this account is behavioural rather than clinical. Prescribing rates rise through the working day and peak in the final hour before closing, a pattern that tracks decision fatigue rather than case mix. Clinicians who display a posted commitment to avoid unnecessary antibiotics prescribe less without worse outcomes, and delayed prescriptions — where the patient collects the drug only if symptoms persist — cut consumption by two thirds while preserving satisfaction.',
      'The objection is that any reduction risks missing the rare bacterial case, and the objection is serious because the cost of a miss falls on one identifiable patient while the cost of overuse is spread invisibly across future patients. Stewardship programmes answer it with safety-netting rather than reassurance: explicit instructions on what deterioration looks like, when to return, and what will happen then, documented in the record rather than spoken at the door.',
      'The broader lesson is that resistance is driven less by ignorance than by structure. Prescribers do not need another guideline telling them which drug matches which microbe; they need consultations long enough to explain a non-prescription, systems that make delayed prescribing the default, and audit that rewards the clinician whose patients return appropriately rather than the one whose patients never return at all.',
    ],
    keyTerms: [
      'stewardship',
      'decision fatigue',
      'delayed prescriptions',
      'safety-netting',
      'overuse',
      'audit',
    ],
    readAloud:
      'Prescribing rates rise through the working day and peak in the final hour before closing, a pattern that tracks decision fatigue rather than case mix.',
    repeatSentences: [
      'Most respiratory infections are viral, yet most prescriptions target them.',
      'The prescription is often a way of ending a consultation under pressure.',
      'Prescribing rates peak in the final hour before the clinic closes.',
      'Delayed prescriptions cut consumption by two thirds while preserving satisfaction.',
      'Resistance is driven less by ignorance than by consultation structure itself.',
    ],
    swt: {
      id: 'swt-antibiotic-stewardship',
      summary:
        'The passage argues that unnecessary antibiotic prescribing reflects time pressure and decision fatigue rather than ignorance, that delayed prescriptions and posted commitments cut use safely, and that safety-netting and longer consultations matter more than new guidelines.',
      excerptLabel: 'A consultation problem',
      excerpt: [
        'The answer emerging from prescribing audits is that the prescription is often not a treatment decision at all but a way of ending a consultation under time pressure.',
        'The broader lesson is that resistance is driven less by ignorance than by structure. Prescribers do not need another guideline telling them which drug matches which microbe; they need consultations long enough to explain a non-prescription.',
      ],
      keyTerms: ['pressure', 'fatigue', 'delayed', 'safety-netting', 'consultations', 'structure'],
      minWords: 20,
    },
    dropdown: {
      id: 'fibd-antibiotic-stewardship',
      text: 'Most respiratory infections are ______ , yet prescriptions target them. Rates rise through the day with decision ______ rather than case mix. ______ prescriptions cut consumption sharply, and stewardship relies on documented ______ rather than reassurance.',
      bank: [
        'viral',
        'fatigue',
        'Delayed',
        'safety-netting',
        'bacterial',
        'boredom',
        'Repeat',
        'referral',
        'triage',
      ],
      answers: ['viral', 'fatigue', 'Delayed', 'safety-netting'],
    },
    tableFib: {
      id: 'fibt-antibiotic-stewardship',
      context: [
        'Four clinics adopted different prescribing policies and reported antibiotic items per hundred respiratory consultations and return-visit rates. The table summarises one year of data.',
      ],
      headers: ['Clinic', 'Items per 100', 'Return rate', 'Outcome'],
      rows: [
        ['A (usual care)', '62', '8%', 'Baseline'],
        ['B (commitment poster)', '48', '8%', 'Improved'],
        ['C (delayed default)', '21', null, 'Improved'],
        ['D (longer slots)', '33', null, 'Improved'],
      ],
      answers: ['9%', '10%'],
    },
    mcqSingle: {
      id: 'mcqs-antibiotic-stewardship',
      question: 'What does the daily prescribing pattern suggest?',
      options: [
        'Fatigue drives prescribing, not case mix',
        'Mornings bring the sickest patients',
        'Clinicians learn as the day progresses',
        'Viral cases cluster before closing',
      ],
      correct: ['Fatigue drives prescribing, not case mix'],
    },
    mcqMultiple: {
      id: 'mcqm-antibiotic-stewardship',
      question: 'Which two interventions does the passage say cut prescribing safely?',
      options: [
        'Posted commitments to avoid unnecessary use',
        'Delayed prescriptions collected only if needed',
        'Longer antibiotic courses for every patient',
        'Banning all respiratory consultations',
        'Charging patients per prescription issued',
      ],
      correct: [
        'Posted commitments to avoid unnecessary use',
        'Delayed prescriptions collected only if needed',
      ],
    },
    asq: [
      {
        id: 'asq-stew-1',
        question: 'Where are most antibiotics prescribed?',
        options: ['Primary care', 'Intensive care', 'Dental clinics'],
        correct: 'Primary care',
      },
      {
        id: 'asq-stew-2',
        question: 'When do prescribing rates peak?',
        options: ['Before closing', 'After lunch', 'Early morning'],
        correct: 'Before closing',
      },
      {
        id: 'asq-stew-3',
        question: 'What should replace reassurance at the door?',
        options: ['Documented safety-netting', 'Longer drug courses', 'Immediate referral'],
        correct: 'Documented safety-netting',
      },
    ],
  },
]
