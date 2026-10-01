import type { Passage } from './schema'

/**
 * Additional original passages.
 *
 * Kept in a separate file purely for editing ergonomics: each passage is roughly
 * a hundred lines of dense prose, and appending to a 600 line array makes
 * review painful. They are merged into `PASSAGES` in `passages.ts`, so the bank
 * still has a single source of truth for what exists.
 *
 * The house style, taken from the existing six: state the mechanism, concede the
 * strongest objection, and close on a claim that is falsifiable rather than
 * rhetorical. No passage is written to be nice to read — several are about
 * evidence that does not support the conclusion people want.
 */

export const EXTRA_PASSAGES: Passage[] = [
  {
    id: 'sleep-memory',
    title: 'What Sleep Actually Consolidates',
    topic: 'Cognitive neuroscience',
    level: 'C1',
    paragraphs: [
      'Sleep is usually described as a period of rest, and the metaphor is so familiar that it has obscured what the data show. Across a century of electroencephalography, the sleeping brain has been found to be busy in ways that are quite unlike the waking brain. The clearest example is slow-wave sleep, in which the cortical electrical activity slows and synchronises into large, slow oscillations. The synchronisation is not rest. It is a coordinated transfer of information between the hippocampus, which is known to hold recent experience in a fragile form, and the neocortex, which holds longer-term knowledge.',
      'The experimental evidence for this transfer is unusually clean for a cognitive science claim. In a standard procedure, participants learn a set of arbitrary spatial layouts and are tested after an interval. When the interval contains sleep, retention improves; when it contains an equal length of wakefulness, it does not. What appears to be consolidated is not the memory itself but the relationship between the new material and what was already known, which is why well-rested recall is often described as more organised rather than simply more accurate.',
      'It would be convenient to conclude that sleep directly strengthens memory, and this is broadly defensible, but the harder finding is about what sleep declines to do. Slow-wave sleep is associated with a reduced responsiveness to external sound, and the brain appears to select what it will keep: experiences that were flagged as important, or that fit an existing schema, are preferentially stabilised, and others are left to fade. This solves a problem the waking brain faces constantly and cannot solve, because during learning there is no opportunity to discard anything without discarding everything.',
      'The clinical consequences follow from the selection account rather than the rest account. An hour of lost sleep does not subtract a fixed quantity of memory; it removes the opportunity to sort, so that the material which survives is more likely to be the material that was already familiar. This predicts, correctly, that sleep deprivation hurts unfamiliar material most. It also predicts that the common advice to review material before sleep is sound for the wrong stated reason: not because sleep replays whatever it finds, but because sleep preferentially protects what was flagged for attention beforehand.',
      'The limits of the picture are worth stating plainly. Almost all of this evidence comes from laboratory sleep in young adults, from tasks with immediate feedback, and from intervals measured in hours rather than across a lifespan. Sleep clearly does many things, and memory consolidation is one of them and not the largest. Anyone who has ever slept eight hours after a long day of difficult work knows what the other functions feel like, even when no experiment has isolated them.',
    ],
    keyTerms: ['slow-wave sleep', 'hippocampus', 'neocortex', 'consolidation', 'schema', 'selective stabilisation'],
    readAloud:
      'Sleep is usually described as a period of rest, and the metaphor is so familiar that it has obscured what the data show. Across a century of electroencephalography, the sleeping brain has been found to be busy in ways that are quite unlike the waking brain, and the clearest example is slow-wave sleep.',
    repeatSentences: [
      'The sleeping brain is busy in ways that are quite unlike the waking brain.',
      'Synchronisation between the hippocampus and the neocortex is a transfer of information, not a rest.',
      'What appears to be consolidated is the relationship between new material and what was already known.',
      'Slow-wave sleep is associated with a reduced responsiveness to external sound.',
      'An hour of lost sleep removes the opportunity to sort rather than subtracting memory.',
    ],
    swt: {
      id: 'swt-sleep-memory',
      summary:
        'The passage reports that slow-wave sleep synchronises activity between the hippocampus and the neocortex so that recent experience is reorganised into longer-term knowledge, and that this process selects what to keep rather than strengthening everything equally, so an hour of lost sleep disproportionately harms unfamiliar material.',
      excerptLabel: 'The selection account',
      excerpt: [
        'It would be convenient to conclude that sleep directly strengthens memory, and this is broadly defensible, but the harder finding is about what sleep declines to do. Slow-wave sleep is associated with a reduced responsiveness to external sound, and the brain appears to select what it will keep: experiences that were flagged as important, or that fit an existing schema, are preferentially stabilised, and others are left to fade. This solves a problem the waking brain faces constantly and cannot solve, because during learning there is no opportunity to discard anything without discarding everything.',
        'The clinical consequences follow from the selection account rather than the rest account. An hour of lost sleep does not subtract a fixed quantity of memory; it removes the opportunity to sort, so that the material which survives is more likely to be the material that was already familiar. This predicts, correctly, that sleep deprivation hurts unfamiliar material most.',
      ],
      keyTerms: ['slow-wave sleep', 'schema', 'stabilised', 'deprivation', 'familiar', 'sort'],
      minWords: 20,
    },
    dropdown: {
      id: 'fibd-sleep-memory',
      text:
        'Sleep is usually described as a period of rest, and the metaphor has obscured what the data ______ . In slow-wave sleep the cortex synchronises, which is a ______ transfer of information rather than a pause. The brain appears to select what it will keep, and experiences that fit an existing ______ are preferentially stabilised. An hour of lost sleep therefore removes the ______ to sort rather than subtracting a fixed quantity of memory.',
      bank: ['show', 'coordinated', 'schema', 'opportunity', 'conceal', 'gradual', 'narrative', 'excuse', 'partial'],
      answers: ['show', 'coordinated', 'schema', 'opportunity'],
    },
    tableFib: {
      id: 'fibt-sleep-memory',
      context: [
        'A sleep laboratory recorded slow-wave sleep duration and next-morning recall for four groups of participants who had spent the previous evening learning either unfamiliar spatial layouts or a familiar task repeated from earlier in the week. The table reports group means and the change in recall score between the two test sessions.',
      ],
      headers: ['Group', 'Evening task', 'Slow-wave sleep', 'Recall change', 'Result'],
      rows: [
        ['A', 'Unfamiliar layouts', '6.8 hours', '+11%', 'Improved'],
        ['B', 'Familiar task', '6.8 hours', '+2%', 'Little change'],
        ['C', 'Unfamiliar layouts', '4.1 hours', '+1%', 'Little change'],
        ['D', null, '4.1 hours', '+1%', null],
      ],
      answers: ['Familiar task', 'Little change'],
    },
    mcqSingle: {
      id: 'mcqs-sleep-memory',
      question: 'What does the passage identify as the function of slow-wave sleep?',
      options: [
        'The transfer and sorting of recent experience',
        'The removal of metabolic waste from the cortex',
        'The lowering of body temperature to its daily minimum',
        'The suppression of emotional response to remembered events',
      ],
      correct: ['The transfer and sorting of recent experience'],
    },
    mcqMultiple: {
      id: 'mcqm-sleep-memory',
      question: 'Which two observations does the passage present as support for the selection account?',
      options: [
        'Sleep-deprived participants lose unfamiliar material but not familiar material',
        'Slow-wave sleep is shorter in older adults than in younger adults',
        'Reviewing material shortly before sleep improves later recall',
        'Sleep spindles occur during slow-wave sleep in every mammal studied',
        'Participants report feeling rested after eight hours regardless of recall',
      ],
      correct: [
        'Sleep-deprived participants lose unfamiliar material but not familiar material',
        'Reviewing material shortly before sleep improves later recall',
      ],
    },
    asq: [
      {
        id: 'asq-sleep-1',
        question: 'According to the passage, what does synchronisation between the hippocampus and the neocortex represent?',
        options: [
          'A transfer of information',
          'A period of rest',
          'A drop in electrical activity',
        ],
        correct: 'A transfer of information',
      },
      {
        id: 'asq-sleep-2',
        question: 'What does the passage say an hour of lost sleep removes?',
        options: ['The opportunity to sort', 'A fixed quantity of memory', 'The body temperature minimum'],
        correct: 'The opportunity to sort',
      },
      {
        id: 'asq-sleep-3',
        question: 'Which material does the passage say is most affected by sleep deprivation?',
        options: ['Unfamiliar material', 'Familiar material', 'Emotional material'],
        correct: 'Unfamiliar material',
      },
    ],
  },

  {
    id: 'significance',
    title: 'Significant but Not Important',
    topic: 'Clinical research methodology',
    level: 'C1',
    paragraphs: [
      'A clinical trial that enrols enough participants will produce a statistically significant result almost regardless of whether the treatment works. This is not a flaw in the statistics but a property of them: statistical significance asks whether an observed difference could plausibly have arisen by chance, and as the sample grows the range of differences that count as plausible shrinks in proportion. A difference of one milligram of blood pressure becomes reliable with a hundred thousand participants, and a difference of no clinical consequence is exactly as capable of clearing that bar as a large one.',
      'The alternative framing is clinical significance, sometimes called practical or meaningful significance. It asks a different question: whether the effect is large enough to matter to a patient. The threshold is not a matter of arithmetic and there is no formula for setting it, because the answer depends on what the outcome is. Halving the risk of a fatal side effect might be worth an inconvenience. Halving the time to detect a disease that was already fatal in most cases might not be worth anything at all, because the patients notice nothing.',
      'The two measures can diverge in either direction, and the pattern of divergence is itself informative. A large clinical effect found in a small trial is often a warning that the trial was conducted badly, because a poor design inflates apparent effects. The more common pattern is the reverse: a carefully conducted, adequately powered trial returns a confident null. Standardised mortality ratios in anaesthesia registries, and later reanalyses of trial registries, both found that a substantial share of published randomised studies had never been registered, and that the unregistered ones reported far larger effects.',
      'The corrective measures that have gained ground are mostly procedural rather than statistical. Trial registration before enrolment removes the option of quietly dropping an inconvenient result. Reporting guidelines require that outcomes be named in advance, so that a study cannot report whichever measurement happened to improve. Individual patient data meta-analyses go further, reconstructing the analysis from the underlying observations rather than the summary statistics as published, and they have repeatedly found the pooled effect smaller than the published literature implied.',
      'None of this makes the significance test wrong. It is an answer to a narrow question, and it is the narrow question that happens to be well defined. The difficulty is that a well defined question can be the wrong one, and that a result reported as "highly significant" reads to almost any reader as an important effect. The most useful habit in reading a trial is to find the effect size with its interval before reading the word "significant" at all, and to ask who the interval would have to exclude before the result changed anyone\'s behaviour.',
    ],
    keyTerms: [
      'statistical significance',
      'clinical significance',
      'sample size',
      'trial registration',
      'outcome reporting bias',
      'effect size',
    ],
    readAloud:
      'A clinical trial that enrols enough participants will produce a statistically significant result almost regardless of whether the treatment works. This is not a flaw in the statistics but a property of them, because as the sample grows the range of differences that count as plausible shrinks in proportion.',
    repeatSentences: [
      'A large sample makes almost any observed difference reliable, whether or not it matters.',
      'Clinical significance asks whether an effect is large enough to matter to a patient.',
      'The threshold for a meaningful effect depends on what the outcome actually is.',
      'A large effect found in a small trial often signals that the trial was conducted badly.',
      'A substantial share of published randomised studies had never been registered.',
    ],
    swt: {
      id: 'swt-significance',
      summary:
        'The passage argues that statistical significance and clinical significance measure different things, that large samples make trivial effects reliable, and that corrections now in use — registration before enrolment, named outcomes, and analysis from individual patient data — have found pooled effects smaller than the literature implied.',
      excerptLabel: 'Correction by procedure',
      excerpt: [
        'The corrective measures that have gained ground are mostly procedural rather than statistical. Trial registration before enrolment removes the option of quietly dropping an inconvenient result. Reporting guidelines require that outcomes be named in advance, so that a study cannot report whichever measurement happened to improve. Individual patient data meta-analyses go further, reconstructing the analysis from the underlying observations rather than the summary statistics as published, and they have repeatedly found the pooled effect smaller than the published literature implied.',
      ],
      keyTerms: ['registration', 'outcomes', 'meta-analyses', 'individual patient data', 'pooled', 'smaller'],
      minWords: 20,
    },
    dropdown: {
      id: 'fibd-significance',
      text:
        'A trial with a large sample will produce a statistically ______ result almost regardless of whether the treatment works, because the range of differences considered plausible ______ in proportion as the sample grows. The separate question of whether an effect is ______ enough to matter to a patient has no arithmetic answer and depends on the outcome. A large effect found in a small trial is often a ______ that the study was poorly conducted.',
      bank: ['significant', 'shrinks', 'large', 'warning', 'expands', 'certain', 'artefact', 'minor', 'recent'],
      answers: ['significant', 'shrinks', 'large', 'warning'],
    },
    tableFib: {
      id: 'fibt-significance',
      context: [
        'A registry audit compared the effect sizes reported by randomised studies that had been registered before enrolment with those reported by studies found only in a retrospective search of trial databases. The table shows median reported effect sizes and the proportion of studies in each group reporting an outcome that had not been named in advance.',
      ],
      headers: ['Study group', 'Studies audited', 'Median effect', 'Unnamed outcome', 'Reading'],
      rows: [
        ['Registered in advance', '164', '0.11', '6%', 'As reported'],
        ['Registered later or never', '117', '0.29', null, 'As reported'],
        ['Retrospective search only', '43', '0.47', '38%', null],
      ],
      answers: ['21%', 'Inflated relative to registered studies'],
    },
    mcqSingle: {
      id: 'mcqs-significance',
      question: 'According to the passage, why does a large sample increase the rate of statistically significant findings?',
      options: [
        'The range of differences considered plausible shrinks in proportion',
        'Larger samples remove the effect of random variation entirely',
        'Statistical significance is defined as a measure of clinical importance',
        'Larger samples are more likely to contain a genuine effect',
      ],
      correct: ['The range of differences considered plausible shrinks in proportion'],
    },
    mcqMultiple: {
      id: 'mcqm-significance',
      question: 'Which two measures does the passage describe as procedural corrections rather than statistical ones?',
      options: [
        'Registering a trial before enrolment',
        'Increasing the sample size to two thousand participants',
        'Naming outcomes in advance of the study',
        'Calculating a confidence interval around the effect size',
        'Rebuilding an analysis from individual patient data',
      ],
      correct: [
        'Registering a trial before enrolment',
        'Naming outcomes in advance of the study',
      ],
    },
    asq: [
      {
        id: 'asq-significance-1',
        question: 'What does statistical significance ask about?',
        options: [
          'Whether a difference could have arisen by chance',
          'Whether a difference matters to a patient',
          'Whether a study was conducted properly',
        ],
        correct: 'Whether a difference could have arisen by chance',
      },
      {
        id: 'asq-significance-2',
        question: 'What does the passage say about the threshold for clinical significance?',
        options: [
          'It cannot be set by formula alone',
          'It is always one percent',
          'It is fixed by regulatory guidance',
        ],
        correct: 'It cannot be set by formula alone',
      },
      {
        id: 'asq-significance-3',
        question: 'What have individual patient data meta-analyses consistently found?',
        options: [
          'Pooled effects smaller than the published literature implied',
          'Larger effects than the published literature implied',
          'No difference from the published literature',
        ],
        correct: 'Pooled effects smaller than the published literature implied',
      },
    ],
  },

  {
    id: 'foundations',
    title: 'Why Tall Buildings Fall Over',
    topic: 'Civil engineering',
    level: 'B2',
    paragraphs: [
      'A building is not held up by its columns alone. Every load that passes through the structure arrives ultimately at the ground, and the route it takes is called the load path. The engineer\'s first question is never whether a structure is strong enough, but whether the loads are being carried by the parts designed to carry them. A foundation that is stiff in one direction and soft in another will not announce this in a calculation; it will announce it under load, as a building that leans, a floor that ripples, or a facade that cracks along a line rather than across it.',
      'The forces that matter are more numerous than weight. Wind acts on the height of a building and produces an overturning moment at its base, which grows with the square of the height and the square of the width. Earthquake forces act on mass and are short, sharp and unpredictable in direction. Temperature change moves a structure every day, because the members expand and contract and have to be free to do it. Each of these is smaller than the weight of the building, and each can be more difficult to accommodate, because weight is carried symmetrically down through the frame while wind and earthquake are not.',
      'That asymmetry is what makes height a design problem rather than a matter of scaling up. As a building gets taller, its slenderness increases, and a slender structure amplifies its own movement: the sideways force applied at the top produces a deflection at the base, which shifts the load distribution, which can concentrate force where the design assumed it would be spread. The engineer\'s response is to stiffen the structure, and the two common strategies are a braced frame, where diagonal members carry lateral load as a truss, or a shear wall, a deep panel that behaves as a cantilever fixed at its base.',
      'Foundations resolve all of this, and they are chosen for what the ground will tolerate rather than for what the structure needs. A shallow foundation spreads load across a large area near the surface and suits firm ground. A pile foundation transfers the load to a stronger layer far below, bypassing weak soil, and suits soft ground or high loads. Between them sits the caisson, excavated and filled in place, used where the required depth is great and the ground will not hold an open excavation unaided.',
      'The failures that reach the public are usually not exotic. Most are the consequence of a decision taken early and then constrained: a column grid set out to suit rentable floor plates and left inadequate for the lateral loads, a basement that cut through the layer the building depended on, or a foundation depth chosen from a survey that predated the excavation next door. Historical records matter here for a reason that has nothing to do with sentiment. What a building was designed against, and what the ground beneath it has since done, are the two questions that determine whether it is still standing.',
    ],
    keyTerms: ['load path', 'overturning moment', 'slenderness', 'braced frame', 'shear wall', 'pile foundation'],
    readAloud:
      'A building is not held up by its columns alone. Every load that passes through the structure arrives ultimately at the ground, and the route it takes is called the load path. The engineer\'s first question is never whether a structure is strong enough, but whether the loads are being carried by the parts designed to carry them.',
    repeatSentences: [
      'Every load passing through a structure arrives ultimately at the ground.',
      'Wind produces an overturning moment that grows with the square of the height.',
      'Earthquake forces act on mass and are unpredictable in direction.',
      'A slender structure amplifies its own movement under lateral load.',
      'Foundations are chosen for what the ground will tolerate, not for what the structure needs.',
    ],
    swt: {
      id: 'swt-foundations',
      summary:
        'The passage explains that buildings fail more often from a wrongly carried load path than from insufficient strength, that lateral forces are harder to carry than weight because they act asymmetrically, and that foundations suit the ground they sit on rather than the structure above.',
      excerptLabel: 'Why height changes the problem',
      excerpt: [
        'That asymmetry is what makes height a design problem rather than a matter of scaling up. As a building gets taller, its slenderness increases, and a slender structure amplifies its own movement: the sideways force applied at the top produces a deflection at the base, which shifts the load distribution, which can concentrate force where the design assumed it would be spread. The engineer\'s response is to stiffen the structure, and the two common strategies are a braced frame, where diagonal members carry lateral load as a truss, or a shear wall, a deep panel that behaves as a cantilever fixed at its base.',
        'The failures that reach the public are usually not exotic. Most are the consequence of a decision taken early and then constrained: a column grid set out to suit rentable floor plates and left inadequate for the lateral loads, a basement that cut through the layer the building depended on, or a foundation depth chosen from a survey that predated the excavation next door.',
      ],
      keyTerms: ['slenderness', 'deflection', 'load distribution', 'braced frame', 'shear wall', 'foundation depth'],
      minWords: 20,
    },
    dropdown: {
      id: 'fibd-foundations',
      text:
        'The engineer\'s first question is not whether the structure is strong enough, but whether the loads are being carried by the parts designed to carry them. This route is called the load ______ . Wind produces an ______ moment at the base, which grows with the square of the height. As a building grows ______ , it amplifies its own movement, so lateral load is resisted by a braced frame or a shear ______ . Foundations are chosen according to what the ground will ______ .',
      bank: ['path', 'overturning', 'taller', 'wall', 'gradient', 'tolerate', 'diaphragm', 'require', 'lighter'],
      answers: ['path', 'overturning', 'taller', 'wall', 'tolerate'],
    },
    tableFib: {
      id: 'fibt-foundations',
      context: [
        'Four buildings of comparable floor area were compared by structural engineer during design development. The table records the primary system used to resist lateral load, the foundation type, and the year in which the underlying site survey was carried out.',
      ],
      headers: ['Building', 'Lateral system', 'Foundation', 'Damping device', 'Site survey'],
      rows: [
        ['A', 'Braced frame', 'Shallow', 'Tuned mass damper', '2011'],
        ['B', 'Shear wall core', 'Piles', null, '2004'],
        ['C', 'Braced frame', 'Caisson', 'Tuned mass damper', '2016'],
        ['D', 'Moment frame', null, 'Seismic isolators', '2013'],
      ],
      answers: ['Piles', 'Moment frame'],
    },
    mcqSingle: {
      id: 'mcqs-foundations',
      question: 'According to the passage, why are lateral forces harder to accommodate than weight?',
      options: [
        'They act asymmetrically on the structure',
        'They are always larger than the total weight',
        'They cannot be measured before construction',
        'They act only at the base of the building',
      ],
      correct: ['They act asymmetrically on the structure'],
    },
    mcqMultiple: {
      id: 'mcqm-foundations',
      question: 'Which two does the passage give as examples of ordinary causes of structural failure?',
      options: [
        'A basement that cut through the layer the building depended on',
        'A foundation depth chosen from an outdated site survey',
        'A building exceeding the height limit set by its architect',
        'An unusually heavy snowfall during construction',
        'A column grid set out to suit rentable floor plates',
      ],
      correct: [
        'A basement that cut through the layer the building depended on',
        'A foundation depth chosen from an outdated site survey',
      ],
    },
    asq: [
      {
        id: 'asq-foundations-1',
        question: 'What is the route taken by loads called?',
        options: ['The load path', 'The footing plan', 'The lateral system'],
        correct: 'The load path',
      },
      {
        id: 'asq-foundations-2',
        question: 'What does a pile foundation do?',
        options: [
          'Transfers load to a stronger layer below',
          'Spreads load near the surface',
          'Reduces wind forces on the facade',
        ],
        correct: 'Transfers load to a stronger layer below',
      },
      {
        id: 'asq-foundations-3',
        question: 'What does the passage say a shear wall behaves like?',
        options: ['A cantilever fixed at its base', 'A truss carrying tension only', 'A membrane stretched over the frame'],
        correct: 'A cantilever fixed at its base',
      },
    ],
  },
]