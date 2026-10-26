import type { AudioScript, GroupDiscussionItem, RetellItem, SpokenSummaryItem } from './schema'
import {
  EXTRA_LECTURES,
  EXTRA_GROUP_DISCUSSIONS,
  EXTRA_SPOKEN_SUMMARY_ITEMS,
  EXTRA_GROUP_DISCUSSION_ITEMS,
} from './audioExtra'
import {
  EXTRA_DISCUSSIONS_2,
  EXTRA_GROUP_DISCUSSION_ITEMS_2,
  EXTRA_RETELL_ITEMS,
} from './audioExtra2'
import {
  EXTRA_LECTURES_3,
  EXTRA_DISCUSSIONS_3,
  EXTRA_RETELL_ITEMS_3,
  EXTRA_SPOKEN_SUMMARY_ITEMS_3,
  EXTRA_GROUP_DISCUSSION_ITEMS_3,
} from './audioExtra3'
import {
  EXTRA_LECTURES_4,
  EXTRA_GROUP_DISCUSSIONS_4,
  EXTRA_RETELL_ITEMS_4,
  EXTRA_SPOKEN_SUMMARY_ITEMS_4,
  EXTRA_GROUP_DISCUSSION_ITEMS_4,
} from './audioExtra4'
import { EXTRA_LECTURES_5, EXTRA_RETELL_ITEMS_5 } from './audioExtra5'
import {
  EXTRA_LECTURES_6,
  EXTRA_GROUP_DISCUSSIONS_5,
  EXTRA_RETELL_ITEMS_6,
  EXTRA_GROUP_DISCUSSION_ITEMS_5,
  EXTRA_SPOKEN_SUMMARY_ITEMS_5,
} from './audioExtra6'

// ---------------------------------------------------------------------------
// Single-speaker academic lectures. Text is delivered through the browser's
// speech synthesiser, so the whole audio bank ships inside the JavaScript bundle.
// ---------------------------------------------------------------------------

export const LECTURES: AudioScript[] = [
  {
    id: 'lec-deep-learning',
    title: 'Why Deep Networks Generalise',
    kind: 'lecture',
    topic: 'Computer science',
    scene: 'A lecturer speaking to a first-year computing class.',
    speakers: [{ id: 's1', name: 'Dr Raman', role: 'Lecturer', voiceHint: 'mid' }],
    turns: [
      {
        speaker: 's1',
        text: 'Good morning. Today I want to talk about a question that sounds trivial and is not: why do neural networks trained on hundreds of millions of examples not simply memorise every one of them and then fail on anything new?',
      },
      {
        speaker: 's1',
        text: 'The traditional answer was capacity. A model with enough parameters could in principle store the training set exactly, so the fact that it generalises at all was attributed to the training procedure — weight decay, data augmentation, early stopping — all of which are forms of imposed limitation. That answer was intellectually tidy and, as we now know, largely wrong.',
      },
      {
        speaker: 's1',
        text: 'The better answer is considerably more interesting, and it comes from the observation that the training data are enormously redundant. Natural images, natural language and natural audio all contain repeated structure at many scales. A particular patch of texture appears in thousands of images. A particular grammatical pattern appears in millions of sentences. When a network fits the data imperfectly, it is forced to prefer the simplest explanation consistent with what it sees, and simplicity is only possible because the redundancy is there to be exploited.',
      },
      {
        speaker: 's1',
        text: 'This is not a philosophical point. It predicts something measurable. If a dataset is deliberately made less redundant — for instance by replacing a class of images with deliberately novel patterns — then the same architecture, the same optimiser and the same number of epochs should show a sharp fall in the gap between training accuracy and test accuracy. And that is exactly what the experiments show.',
      },
      {
        speaker: 's1',
        text: 'There is a second mechanism worth mentioning, and it operates in the opposite direction. Modern models are so overparameterised relative to the data that they have a very large number of distinct solutions fitting the training set equally well. The training procedure does not find one of these; it finds a basin. And within a flat basin, small changes to the weights produce large changes in behaviour, which sounds like a weakness but is in fact a form of built-in regularisation.',
      },
      {
        speaker: 's1',
        text: 'So, to summarise. We do not generalise in spite of having too many parameters. We generalise because the world is itself highly redundant, and because the training procedure tends to land in flat regions of a very large solution space. Next week we will look at what happens when you take that reasoning and apply it to a language model with a hundred billion parameters. Thank you.',
      },
    ],
    keyTerms: ['redundancy', 'generalise', 'basin', 'flat', 'simplest explanation'],
  },
  {
    id: 'lec-memory',
    title: 'The Error Correction of Memory',
    kind: 'lecture',
    topic: 'Psychology',
    scene: 'A psychology lecturer describing a research study to students.',
    speakers: [{ id: 's1', name: 'Dr Alvarez', role: 'Lecturer', voiceHint: 'mid-high' }],
    turns: [
      {
        speaker: 's1',
        text: 'Every psychology student is taught that memory is a recording and that recall is playback. I want to spend this lecture dismantling that metaphor, because it is not merely inaccurate — it is misleading in ways that affect how we design studies and how we interpret the results of the ones we read.',
      },
      {
        speaker: 's1',
        text: 'Consider a widely used experiment. Participants study a list of word pairs. Later they are asked to recall the second word when given the first. A substantial proportion of them respond with a word that was never on the list but that is strongly associated with the cue. These intrusions are not random. They cluster on the semantically related items, and the probability of an intrusion rises sharply as the list grows.',
      },
      {
        speaker: 's1',
        text: 'The explanation is that retrieval triggers reconstruction. When you are given a cue, the mind runs a search constrained by the cue, and it accepts the first candidate that satisfies the constraint. Because the candidate space is organised semantically, the candidates that come up first are related words rather than unrelated ones. Recall is therefore a function of the organisation of the material as much as of the material itself.',
      },
      {
        speaker: 's1',
        text: 'This has an immediate consequence for how eyewitness evidence should be treated. An eyewitness who is confident and accurate is valuable. An eyewitness who is confident and wrong is not merely useless, because the confidence is produced by the same retrieval process that produced the error. Confidence is not a check on accuracy; it is a second opinion from the same unreliable source.',
      },
      {
        speaker: 's1',
        text: 'Now the more interesting part. The same process that generates errors also generates correction, and it does so through a mechanism that has nothing to do with the original event. On subsequent occasions, a participant who heard a particular detail consistently and a different detail inconsistently will end up reporting the consistent one. The memory is not stored and then checked; it is repeatedly rewritten, and the rewriting is driven by consistency across occurrences, not by fidelity to the first event.',
      },
      {
        speaker: 's1',
        text: 'The implications for the field are considerable. Any claim that memory preserves information has to specify what information and by what mechanism. And any intervention intended to help a witness remember more accurately has to be designed around the fact that the most effective intervention — repeated, non-suggestive interview — is also the one most likely to consolidate an error. Thank you.',
      },
    ],
    keyTerms: ['reconstruction', 'intrusion', 'interference', 'consistent', 'rewritten'],
  },
  {
    id: 'lec-antibiotic',
    title: 'Antibiotics and the Cost of Speed',
    kind: 'lecture',
    topic: 'Medicine',
    scene: 'A microbiologist addressing a medical science seminar.',
    speakers: [{ id: 's1', name: 'Professor Osei', role: 'Speaker', voiceHint: 'low' }],
    turns: [
      {
        speaker: 's1',
        text: 'Antibiotics are among the most successful interventions ever developed. They are also, from an evolutionary standpoint, one of the most demanding. An antibiotic applies a selection pressure, and selection pressure is a request for resistance. Everything I am about to say follows from that single fact.',
      },
      {
        speaker: 's1',
        text: 'Resistance arises by three routes. First, and most commonly, a bacterium already carries a small chromosomal mutation that confers partial resistance. The antibiotic kills the susceptible cells and the partially resistant cells survive and proliferate. This is the mechanism behind the gradual, predictable increase in minimum inhibitory concentration that laboratory strains exhibit.',
      },
      {
        speaker: 's1',
        text: 'Second, and more rapid, resistance can be acquired horizontally. A bacterium takes up DNA from its environment — from other bacteria that die and lyse, from plasmids, from bacteriophages. The gene for an enzyme that destroys the antibiotic is simply copied across. Horizontal transfer explains why resistance to an antibiotic the bacterium has never been exposed to can appear within days.',
      },
      {
        speaker: 's1',
        text: 'Third, resistance may already exist somewhere in the environment before the antibiotic is ever used clinically. Soil, wastewater and agricultural systems contain enormous populations of antibiotic-producing organisms, and the enzymes they make to protect themselves are frequently identical, or functionally identical, to the enzymes found in human pathogens. Some of what we treat as the emergence of resistance is the arrival of a pre-existing solution.',
      },
      {
        speaker: 's1',
        text: 'The policy implications follow directly. First, the number of distinct antibiotic classes available to us is finite and is not increasing, because the economics of developing a new one are now unattractive. Second, the marginal value of prescribing an antibiotic where the infection is probably viral is negative, not zero — the cost falls on a third party. Third, agricultural use, which is largely outside human medicine, has historically supplied a large share of the resistance genes now circulating in clinics, and that channel has been regulated in some jurisdictions and not others.',
      },
      {
        speaker: 's1',
        text: 'I want to end on a point that is often missed in public discussion. Resistance is not a failure of individual doctors and it is not a failure of individual patients. It is a predictable property of using an intervention faster than we can replace it. The question is not whether we will run out. It is how gracefully we manage the interval. Thank you.',
      },
    ],
    keyTerms: [
      'selection pressure',
      'horizontal transfer',
      'plasmid',
      'pre-existing',
      'finite classes',
    ],
  },
  {
    id: 'lec-tides',
    title: 'Tidal Power and the Limits of Prediction',
    kind: 'lecture',
    topic: 'Environmental engineering',
    scene: 'An engineer presenting at a marine energy conference.',
    speakers: [{ id: 's1', name: 'Dr Halloway', role: 'Speaker', voiceHint: 'mid' }],
    turns: [
      {
        speaker: 's1',
        text: 'Tidal power is attractive for a reason that has nothing to do with tides. It is predictable. A wind turbine produces what the atmosphere gives it. A solar panel produces what the sky allows. A tidal turbine produces what the moon and the sun do, and those are calculable to a very high precision centuries in advance.',
      },
      {
        speaker: 's1',
        text: 'That predictability is the whole of the commercial argument, and it is a real one. Developers can finance a project against a known generation profile, and can price the output into a contract. Every other renewable source struggles with exactly this problem.',
      },
      {
        speaker: 's1',
        text: 'The engineering problem is different. Tides are concentrated in a small number of narrow channels, which is convenient, but it also means that the resource is contested and that the environmental footprint is severe on a very local scale. A barrage across an estuary changes the salinity distribution over tens of square kilometres and alters the sediment transport that maintains the estuary itself.',
      },
      {
        speaker: 's1',
        text: 'The second problem is that the diurnal cycle is twice a day and the tidal range varies over a longer cycle. A tidal plant can therefore be generating at near full capacity while the national demand curve is at its minimum, and can be idle when demand peaks. Storage is not an optional accessory; it is a substantial part of the capital cost, and it is the part that makes many otherwise viable sites unviable.',
      },
      {
        speaker: 's1',
        text: 'The third problem is the diurnal mismatch with existing generation. In several markets, the biggest competitor is not wind or solar but a nuclear plant operating in baseload. A tidal plant that must be shut down for two hours around high tide to avoid depressing the wholesale price is, in that specific and rather awkward sense, competing with the most reliable machine we have.',
      },
      {
        speaker: 's1',
        text: 'So where does that leave the technology? Not discarded. There is at least one site where the geography is exceptional enough to justify the costs, and that site produces a meaningful share of a national grid. But the honest summary is that tidal power is a triumph of predictability defeated by physics: the resource is known, the demand is not, and the two cycles do not agree. Thank you.',
      },
    ],
    keyTerms: ['predictable', 'narrow channels', 'sediment', 'storage', 'baseload'],
  },
  {
    id: 'lc-handwriting',
    title: 'The Case for Cursive',
    kind: 'lecture',
    topic: 'Education',
    scene: 'A teacher training workshop on literacy instruction.',
    speakers: [{ id: 's1', name: 'Ms Feld', role: 'Speaker', voiceHint: 'mid-high' }],
    turns: [
      {
        speaker: 's1',
        text: 'Cursive has been removed from the curriculum in several countries over the past two decades, usually on the grounds that it wastes instruction time. I am going to argue that this is a defensible decision for a small proportion of children and an expensive mistake for the rest.',
      },
      {
        speaker: 's1',
        text: 'Start with what cursive actually does. When a child writes connected letters, several letters share a single stroke direction and a single motor program. The child is not transcribing isolated symbols; the child is executing a continuous movement and using visual feedback to stay on a path. This is a different, and considerably richer, perceptual task than writing a column of disconnected letters.',
      },
      {
        speaker: 's1',
        text: 'The cognitive claim follows from that. Several studies, mostly with mixed results, have tested whether children who can write cursive read more words per line than children who cannot. The effect is small and inconsistent, and I do not want to oversell it. What is better established is that cursive forces segmentation. To write the letter boundary correctly, the child has to decide where one grapheme stops and the next begins, in a way that print does not require.',
      },
      {
        speaker: 's1',
        text: 'The strongest argument, however, is not cognitive at all. It is that handwriting speed matters in examinations, and cursive is the fastest legible hand for most children once they have learned it. A student who can sustain ninety words per minute in print falls behind a dictation. No amount of reading comprehension compensates for having written half a sentence.',
      },
      {
        speaker: 's1',
        text: 'I am aware this sounds nostalgic, so let me be clear about the case against, because there is one. Cursive instruction is slower to acquire. It requires a substantial amount of direct instruction and a good teacher, and a badly taught cursive programme produces illegible handwriting, which is worse than no handwriting at all. The question is not whether cursive is good in the abstract but whether your system can teach it well. Thank you.',
      },
    ],
    keyTerms: ['motor program', 'segmentation', 'speed', 'illegible', 'direct instruction'],
  },
  {
    id: 'lec-sleep',
    title: 'What Sleep Is For',
    kind: 'lecture',
    topic: 'Neuroscience',
    scene: 'A neuroscientist giving a public lecture.',
    speakers: [{ id: 's1', name: 'Dr Kovač', role: 'Speaker', voiceHint: 'low' }],
    turns: [
      {
        speaker: 's1',
        text: 'Everyone has a theory about what sleep is for. I have one too, and I am going to argue that most of the familiar theories are answers to a question we have framed the wrong way round.',
      },
      {
        speaker: 's1',
        text: 'The first family of theories says sleep is for the brain: memory consolidation, synaptic homeostasis, waste clearance. These are not wrong. They are supported by good evidence and the glymphatic findings in particular are important.',
      },
      {
        speaker: 's1',
        text: 'The second family says sleep is for the body: energy restoration, tissue repair, immune function. Also supported. Also not the whole story.',
      },
      {
        speaker: 's1',
        text: 'Notice what both families share. Both assume that sleep exists to restore something that has been depleted by waking. But the strongest recent evidence points somewhere else entirely, and it comes from a species you may not expect.',
      },
      {
        speaker: 's1',
        text: 'Octopuses sleep. They are active hunters, they have excellent vision, and their nervous system is not remotely like ours. Yet they sleep, and when they do they become unresponsive and sometimes become an unusual posture. Critically, they do not appear to do the things we do. There is no evidence of memory replay, and a sleep-deprived octopus does not become disoriented. They sleep without a brain in the vertebrate sense.',
      },
      {
        speaker: 's1',
        text: 'If octopuses can sleep without any of the functions we have proposed, then sleep cannot be primarily about those functions. What octopuses share with us is metabolic cost. Sleep appears to be a state in which the organism reduces the cost of maintaining readiness, and accepts temporary vulnerability in exchange for it. Sleep is not maintenance. Sleep is a decision to stop maintaining for a while.',
      },
      {
        speaker: 's1',
        text: 'And that reframes the question usefully. If sleep is an active choice to accept vulnerability, then the interesting questions are about the conditions under which an organism can afford that choice, and those turn out to be the conditions that predict risk-taking in every species we have tested. Thank you.',
      },
    ],
    keyTerms: ['octopus', 'metabolic cost', 'vulnerability', 'readiness', 'conditions'],
  },
  ...EXTRA_LECTURES,
  ...EXTRA_LECTURES_3,
  ...EXTRA_LECTURES_4,
  ...EXTRA_LECTURES_5,
  ...EXTRA_LECTURES_6,
]

export const RETELL_ITEMS: RetellItem[] = [
  {
    id: 'rtl-deep-learning',
    audioId: 'lec-deep-learning',
    skeleton: [
      'redundancy in the data',
      'flat basin in parameter space',
      'simple explanation',
      'prediction: less redundancy → less generalisation',
    ],
    reference:
      'Deep networks generalise not in spite of their size but because the data are highly redundant, so an imperfect fit must prefer the simplest explanation; and because an overparameterised model has many solutions, training lands in a flat basin where small weight changes allow large behavioural changes. The prediction is that deliberately reducing redundancy in a dataset should widen the gap between training and test accuracy.',
    keyTerms: ['redundant', 'simplest', 'basin', 'flat', 'accuracy', 'parameters'],
    minWords: 30,
  },
  {
    id: 'rtl-memory',
    audioId: 'lec-memory',
    skeleton: [
      'retrieval reconstructs, never plays back',
      'intrusions are semantically related',
      'confidence ≠ accuracy',
      'consistency rewrites memory',
    ],
    reference:
      'Recall is a constrained reconstruction rather than playback, so errors are semantically related intrusions whose frequency rises with list size. Because confidence is produced by the same unreliable process, a confident eyewitness can be wrong. Repeated, consistent retelling then rewrites the memory, which helps accuracy and also consolidates errors.',
    keyTerms: [
      'reconstruction',
      'intrusion',
      'intrusions',
      'confidence',
      'consistency',
      'rewrites',
    ],
    minWords: 30,
  },
  {
    id: 'rtl-antibiotic',
    audioId: 'lec-antibiotic',
    skeleton: [
      'selection pressure → resistance is predictable',
      'three routes: mutation, horizontal transfer, pre-existing genes',
      'finite classes, negative marginal value of misuse',
    ],
    reference:
      'Antibiotic use creates selection pressure, so resistance is a predictable outcome rather than a failure. It arises by selection of existing mutations, by horizontal transfer of genes on plasmids and by pre-existing resistance in the environment. Because antibiotic classes are finite and not increasing, and because unnecessary prescribing imposes costs on others, the problem is one of managing the interval until replacements exist.',
    keyTerms: ['selection', 'mutation', 'horizontal transfer', 'pre-existing', 'finite'],
    minWords: 30,
  },
  {
    id: 'rtl-tides',
    audioId: 'lec-tides',
    skeleton: [
      'predictable vs wind/solar',
      'concentrated in narrow channels → local ecological cost',
      'storage is capital, not accessory',
      'diurnal clash with baseload',
    ],
    reference:
      'Tidal power is uniquely predictable, which is its entire commercial argument, but the resource is concentrated in narrow channels with serious local effects on salinity and sediment. Because the tide cycles twice daily and independently of demand, storage becomes a large part of capital cost, and in some markets the plant competes directly with baseload generation. Predictability is defeated by the mismatch between the resource cycle and the demand cycle.',
    keyTerms: ['predictable', 'channels', 'sediment', 'storage', 'baseload', 'demand'],
    minWords: 30,
  },
  {
    id: 'rtl-cursive',
    audioId: 'lc-handwriting',
    skeleton: [
      'continuous motor program',
      'forces grapheme segmentation',
      'speed in dictation is the strongest argument',
      'only fails if taught badly',
    ],
    reference:
      'Cursive asks a child to execute one continuous movement with visual feedback, which is a richer perceptual task than disconnected letters, and it forces segmentation by requiring a decision at every grapheme boundary. The cognitive reading benefit is small and inconsistent, but handwriting speed under dictation is decisive. The case against is that it is slow to teach and badly taught cursive is worse than none.',
    keyTerms: ['motor', 'segmentation', 'speed', 'dictation', 'legible', 'teach'],
    minWords: 30,
  },
  {
    id: 'rtl-sleep',
    audioId: 'lec-sleep',
    skeleton: [
      'brain and body theories both treat sleep as restoration',
      'octopus sleeps without those functions',
      'sleep = accepting vulnerability to save metabolic cost',
    ],
    reference:
      'Traditional theories treat sleep as restoration of the brain or the body, but both assume depletion during waking. Octopuses sleep without evidence of memory replay, disorientation or any vertebrate-style brain function, so sleep cannot be primarily about those. What they share with us is metabolic cost, which suggests sleep is a decision to stop maintaining readiness and accept temporary vulnerability, and what predicts it is whether the organism can afford that risk.',
    keyTerms: ['restoration', 'octopus', 'metabolic', 'vulnerability', 'readiness', 'afford'],
    minWords: 30,
  },
  ...EXTRA_RETELL_ITEMS,
  ...EXTRA_RETELL_ITEMS_3,
  ...EXTRA_RETELL_ITEMS_4,
  ...EXTRA_RETELL_ITEMS_5,
  ...EXTRA_RETELL_ITEMS_6,
]

export const SPOKEN_SUMMARY_ITEMS: SpokenSummaryItem[] = [
  {
    id: 'sst-tides',
    audioId: 'lec-tides',
    question:
      'Listen to the recording and write a summary of 50 to 70 words. Include the main idea and the most important supporting details. You have ten seconds during the recording to prepare your answer.',
    reference:
      'The lecture argues that tidal power is uniquely predictable, unlike wind or solar, which is the whole of its commercial case. The speaker then identifies three obstacles. The resource is concentrated in a few narrow channels, so a barrage would disturb the estuary. The cycle is twice daily and unrelated to the demand peak, making storage a large share of capital cost, and it competes with baseload nuclear.',
    keyTerms: [
      'predictable',
      'channels',
      'salinity',
      'sediment',
      'storage',
      'demand',
      'baseload',
      'twice',
    ],
    minWords: 30,
  },
  ...EXTRA_SPOKEN_SUMMARY_ITEMS,
  ...EXTRA_SPOKEN_SUMMARY_ITEMS_3,
  ...EXTRA_SPOKEN_SUMMARY_ITEMS_4,
  ...EXTRA_SPOKEN_SUMMARY_ITEMS_5,
]

export const GROUP_DISCUSSIONS: AudioScript[] = [
  {
    id: 'gd-university',
    title: 'Should assessment be automated?',
    kind: 'group',
    topic: 'Education policy',
    scene: 'A panel of four discussing assessment in higher education.',
    speakers: [
      { id: 'a', name: 'Chair', role: 'Moderator', voiceHint: 'mid' },
      { id: 'b', name: 'Dr Ellis', role: 'Assessment researcher', voiceHint: 'mid-high' },
      { id: 'c', name: 'Mr Duarte', role: 'Engineering lecturer', voiceHint: 'low' },
      { id: 'd', name: 'Ms Chen', role: 'Student representative', voiceHint: 'high' },
    ],
    turns: [
      {
        speaker: 'a',
        text: 'Thank you all for coming. The question before us is whether the marking of student work should be automated, and I would like each of you to give your position and the reason for it. Dr Ellis, would you start?',
      },
      {
        speaker: 'b',
        text: 'Thank you. My position is that partial automation is clearly right and full automation is clearly wrong. On the evidence, automated marking is at least as consistent as human marking on narrow, well-specified tasks with a clear answer key. It is faster, it is reproducible, and it is fairer, because it removes the effect of who happens to read the script.',
      },
      {
        speaker: 'c',
        text: 'I agree with the first half of that and I want to be specific about the second half. The problem is not fairness in the abstract, it is that the narrow tasks are the ones that teach the least. If I automate exactly the assessments that have a clear key, I am automating the part of my job that was never the valuable part. The valuable part is judging whether an argument is sound, and that is the part with no key.',
      },
      {
        speaker: 'd',
        text: 'If I may add a point that I do not think has been made. The cost of automation is not only teacher time, it is what happens to the students who sit the automated task. A generated multiple-choice item checks a different thing from a written response, and if we stop assessing written responses we will stop teaching writing. That is a real cost, and it falls on us rather than on the institution.',
      },
      {
        speaker: 'b',
        text: 'That is a fair challenge and I would accept it partly. Let me put the disagreement precisely. Ms Chen is worried that we automate away the assessment. I am worried that we are describing automation as if it were neutral, when in every case I have studied the tool was chosen first and the rationale written afterwards.',
      },
      {
        speaker: 'c',
        text: 'If I may summarise, the three of us are closer than it sounds. We share a rejection of full automation and a concern about what gets removed rather than what gets added. We differ on whether the tool is neutral. On that, I would say the question is not whether the tool is accurate but whether the people who choose it are accountable for the choice.',
      },
    ],
    keyTerms: ['automated marking', 'narrow tasks', 'written response', 'accountability'],
  },
  {
    id: 'gd-transit',
    title: 'Is a car-free city achievable?',
    kind: 'group',
    topic: 'Urban planning',
    scene: 'A public consultation panel on transport policy.',
    speakers: [
      { id: 'a', name: 'Chair', role: 'Moderator', voiceHint: 'mid' },
      { id: 'b', name: 'Ms Bergström', role: 'Transport planner', voiceHint: 'mid-high' },
      { id: 'c', name: 'Mr Idris', role: 'Retailer', voiceHint: 'low' },
      { id: 'd', name: 'Ms Novak', role: 'Resident', voiceHint: 'high' },
    ],
    turns: [
      {
        speaker: 'a',
        text: 'Let us begin with positions. The proposal in front of us is a phased restriction of private cars in the central district, with a two-year lead period and exemptions for deliveries and for disabled residents. Ms Bergström, you have studied this in four other cities. Where does that leave you?',
      },
      {
        speaker: 'b',
        text: 'The evidence from the comparable cities is that the restriction itself is not what matters. What matters is what is available instead. In two of the four, the restriction was introduced without a meaningful increase in public transport capacity, and both experienced significant retail vacancy. In the other two, capacity was increased first and the restriction followed, and both are now more than forty per cent below their earlier traffic levels.',
      },
      {
        speaker: 'c',
        text: 'I would like to challenge the framing. The argument is always that the retail impact is manageable, and in my experience it is not a traffic problem, it is a floor-space problem. A city centre with no parking is not a shopping district, it is a destination for people who plan a trip. I am not opposed to the policy in principle. I am saying the sequence in this proposal is wrong.',
      },
      {
        speaker: 'd',
        text: 'I live in the district and I want to raise something the other three have not mentioned. The exemption for deliveries is the whole policy. Deliveries are how the shops receive stock, and if the exemption is defined by vehicle type rather than by purpose, then almost nothing changes on the ground. Every scheme like this that has failed locally failed on the exemptions, not on the headline restriction.',
      },
      {
        speaker: 'b',
        text: 'That is a useful and rather uncomfortable point, and I concede that the definition matters more than the headline. Let me add one thing. Mr Idris is right that the sequence matters, but he understates the counter-argument: the reason the capacity is never increased first is that the political case is made by the restriction. The two decisions have to be taken together or neither will happen.',
      },
      {
        speaker: 'd',
        text: 'If I may, the three of us do not actually disagree. None of us is calling for an indefinite delay. We are calling for the capacity, the exemptions and the enforcement to be specified before the restriction begins. The chair can confirm that none of that requires abandoning the proposal.',
      },
    ],
    keyTerms: [
      'public transport capacity',
      'retail impact',
      'exemptions for deliveries',
      'enforcement',
    ],
  },
  ...EXTRA_GROUP_DISCUSSIONS,
  ...EXTRA_DISCUSSIONS_2,
  ...EXTRA_DISCUSSIONS_3,
  ...EXTRA_GROUP_DISCUSSIONS_4,
  ...EXTRA_GROUP_DISCUSSIONS_5,
]

export const GROUP_DISCUSSION_ITEMS: GroupDiscussionItem[] = [
  {
    id: 'sgd-university',
    audioId: 'gd-university',
    question:
      "Listen to the discussion and summarise it in between 40 and 90 seconds. Report the group's overall stance, the main points each speaker made, and where they disagreed.",
    reference:
      'The panel largely rejects full automation of marking and agrees that automated marking is reliable for narrow, well-specified tasks, but they disagree about whether the tool is neutral. The assessment researcher worries that tools are chosen first and justified afterwards, the lecturer wants to protect argument judgement, and the student representative warns that automating the assessable removes the teaching of writing.',
    keyTerms: [
      'partial automation',
      'narrow tasks',
      'clear answer key',
      'written response',
      'neutral',
      'accountable',
    ],
    minWords: 40,
  },
  {
    id: 'sgd-transit',
    audioId: 'gd-transit',
    question:
      "Listen to the discussion and summarise it in between 40 and 90 seconds. Report the group's overall stance, the main points each speaker made, and where they disagreed.",
    reference:
      'The panel supports the restriction in principle but insists on sequencing and detail. The planner shows that comparable cities failed when transport capacity was not increased first, the retailer argues the loss is floor space rather than traffic, and the resident claims exemptions for deliveries decide whether the policy works. They agree the capacity, exemptions and enforcement must be specified before the restriction begins.',
    keyTerms: [
      'restriction',
      'capacity',
      'retail vacancy',
      'exemptions',
      'enforcement',
      'sequencing',
    ],
    minWords: 40,
  },
  ...EXTRA_GROUP_DISCUSSION_ITEMS,
  ...EXTRA_GROUP_DISCUSSION_ITEMS_2,
  ...EXTRA_GROUP_DISCUSSION_ITEMS_3,
  ...EXTRA_GROUP_DISCUSSION_ITEMS_4,
  ...EXTRA_GROUP_DISCUSSION_ITEMS_5,
]
