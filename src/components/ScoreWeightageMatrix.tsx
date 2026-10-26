import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { QUESTION_META, SECTION_META } from '../domain/blueprint'
import type { ScoringMode } from '../domain/blueprint'
import { typeSlug } from '../content/questionTypeDetail'
import type { QuestionType, Skill } from '../domain/types'
import { Badge, Callout } from './ui/primitives'
import { Reveal } from './ui/motion'
import { cn } from '../lib/cn'

export interface ItemWeightage {
  type: QuestionType
  name: string
  tier: 1 | 2 | 3
  priorityStrategy: string
  suggestedTime: string
}

const WEIGHTAGE_DATA: ItemWeightage[] = [
  // Editorially suggested study priorities; these are not score weights.
  {
    type: 'write-from-dictation',
    name: 'Write From Dictation',
    tier: 1,
    priorityStrategy:
      'Listen for the exact words and check spelling and word endings. Practise regularly, then review which words you missed.',
    suggestedTime: '1–1.5 min per audio',
  },
  {
    type: 'repeat-sentence',
    name: 'Repeat Sentence',
    tier: 1,
    priorityStrategy:
      'Repeat as much of the sentence as you can while keeping a steady pace. If you lose a word, continue with the next part you remember.',
    suggestedTime: '15 sec immediately after beep',
  },
  {
    type: 'read-aloud',
    name: 'Read Aloud',
    tier: 1,
    priorityStrategy:
      'Read with natural cadence and rhythm. Stress key nouns and verbs. Never correct yourself if you mispronounce a word — keep flowing.',
    suggestedTime: '35–40 sec preparation, 30–35 sec speech',
  },
  {
    type: 'fill-in-blanks-dropdown',
    name: 'Reading & Writing: Fill in the Blanks',
    tier: 1,
    priorityStrategy:
      'Master the Academic Collocation List (ACL), verb agreement, and preposition pairings. Budget 2–2.5 minutes per passage.',
    suggestedTime: '2–2.5 min per passage',
  },
  {
    type: 'describe-image',
    name: 'Describe Image',
    tier: 1,
    priorityStrategy:
      'Describe the main subject and the clearest supported comparisons or trends. Use a simple structure, but adapt it to the information shown.',
    suggestedTime: '25 sec preparation, 25–30 sec speech',
  },
  {
    type: 'fill-in-blanks-table',
    name: 'Reading: Fill in the Blanks',
    tier: 1,
    priorityStrategy:
      'Read the passage once, then complete each table cell from the text. Check that the finished row reads as a unit. This practice tool uses typed cells rather than the drag-and-drop interaction in the real test.',
    suggestedTime: '1.5–2 min per passage',
  },

  // --- Editorial priority 2 ---
  {
    type: 'summarize-spoken-text',
    name: 'Summarize Spoken Text',
    tier: 2,
    priorityStrategy:
      'Keep within the 50–70 word range. Note the main ideas, connect them in a clear summary and check grammar and spelling.',
    suggestedTime: '10 min per item (independent timer)',
  },
  {
    type: 'write-essay',
    name: 'Write Essay',
    tier: 2,
    priorityStrategy:
      'Stay within the 200–300 word range. Plan a clear response, answer the prompt directly and leave time to review it.',
    suggestedTime: '20 min per essay (independent timer)',
  },
  {
    type: 'retell-lecture',
    name: 'Re-tell Lecture',
    tier: 2,
    priorityStrategy:
      'Note the main ideas and explain their connections in your own words. Keep speaking steadily if you forget a detail.',
    suggestedTime: '10 sec preparation, 30–35 sec speech',
  },
  {
    type: 'summarize-written-text',
    name: 'Summarize Written Text',
    tier: 2,
    priorityStrategy:
      'Write one complete sentence of 5–75 words, ending with sentence punctuation. Check that it summarises the passage rather than listing details.',
    suggestedTime: '10 min per prompt (independent timer)',
  },
  {
    type: 'fill-in-blanks-listening',
    name: 'Listening: Fill in the Blanks',
    tier: 2,
    priorityStrategy:
      'Type rough notes or directly into blanks as audio plays. Double-check plural -s, past-tense -ed, and vowel combinations.',
    suggestedTime: '1.5–2 min per passage',
  },
  {
    type: 'highlight-incorrect-words',
    name: 'Highlight Incorrect Words',
    tier: 2,
    priorityStrategy:
      'Credit is deducted for incorrect selections. Compare each transcript word with the audio and avoid selections the recording does not support.',
    suggestedTime: 'Plays once (audio length)',
  },
  {
    type: 'reorder-paragraphs',
    name: 'Re-order Paragraphs',
    tier: 2,
    priorityStrategy:
      'Identify the independent topic sentence (no pronouns or unexplained references). Match adjacent pairs (A→B, B→C) methodically.',
    suggestedTime: '2 min per item',
  },
  {
    type: 'summarize-group-discussion',
    name: 'Summarize Group Discussion',
    tier: 2,
    priorityStrategy:
      'Differentiate the 2–3 speakers and note consensus vs divergence. Deliver a structured summary within 40 seconds.',
    suggestedTime: '10 sec preparation, 35–40 sec speech',
  },
  {
    type: 'respond-to-situation',
    name: 'Respond to a Situation',
    tier: 2,
    priorityStrategy:
      'Identify the tone (formal vs informal). Follow 4 steps: Greeting → Reason/Empathy → Concrete Solution → Polite Sign-off.',
    suggestedTime: '20 sec preparation, 30–35 sec speech',
  },

  // --- Editorial priority 3 ---
  {
    type: 'multiple-choice-single',
    name: 'Multiple Choice, Single Answer (Reading)',
    tier: 3,
    priorityStrategy:
      'Read the question stem first, scan passage for keywords, eliminate two obvious distractors, choose and move on.',
    suggestedTime: '1–1.5 min max',
  },
  {
    type: 'multiple-choice-multiple',
    name: 'Multiple Choice, Multiple Answers (Reading)',
    tier: 3,
    priorityStrategy:
      'Evaluate each option independently against the passage. Select the supported answers and account for deductions on incorrect selections.',
    suggestedTime: '1.5–2 min max',
  },
  {
    type: 'listening-multiple-choice-single',
    name: 'Multiple Choice, Single Answer (Listening)',
    tier: 3,
    priorityStrategy:
      'Skim the question during the 5-second countdown. Lock in your answer within 10 seconds after audio concludes.',
    suggestedTime: 'Audio duration + 10 sec',
  },
  {
    type: 'listening-multiple-choice-multiple',
    name: 'Multiple Choice, Multiple Answers (Listening)',
    tier: 3,
    priorityStrategy:
      'Assess each option on its evidence. Correct selections earn credit and incorrect selections deduct credit, so avoid options that the recording does not support.',
    suggestedTime: 'Audio duration + 15 sec',
  },
  {
    type: 'highlight-correct-summary',
    name: 'Highlight Correct Summary',
    tier: 3,
    priorityStrategy:
      'Focus on overall argument and outcome, not matching isolated buzzwords. Eliminate summaries containing extreme statements.',
    suggestedTime: 'Audio duration + 30 sec',
  },
  {
    type: 'select-missing-word',
    name: 'Select Missing Word',
    tier: 3,
    priorityStrategy:
      'Follow the speaker’s tone and train of thought to anticipate how the final sentence logically completes before the beep.',
    suggestedTime: 'Audio duration + 10 sec',
  },
  {
    type: 'answer-short-question',
    name: 'Answer Short Question',
    tier: 3,
    priorityStrategy:
      'Answer with 1–2 words immediately after audio ends. If you do not know, say "I do not know" or any relevant noun and move on.',
    suggestedTime: '5–10 sec',
  },
]

type TargetScore = 'all' | '50' | '65' | '79'

const SCORING_LABEL: Record<ScoringMode, string> = {
  binary: 'Correct or incorrect',
  'per-blank': 'Credit per correct blank',
  'per-word': 'Credit per correctly spelled word',
  'per-unit-negated': 'Credit for correct units; deductions for incorrect units',
  'per-adjacent-pair': 'Credit per correctly ordered adjacent pair',
  'trait-composite': 'Trait based; practice score is an estimate',
}

const TARGET_STRATEGIES: Record<
  TargetScore,
  {
    title: string
    subtitle: string
    recommendation: string
    keyTypes: string[]
    focusLabel: string
  }
> = {
  all: {
    title: 'Review all four skills',
    subtitle: 'Use your recent results to choose where to spend practice time',
    recommendation:
      'These question types contribute across multiple communicative skills. Practising them can be useful, but their value depends on your current strengths and the skills you need to improve.',
    keyTypes: [
      'Write From Dictation',
      'Repeat Sentence',
      'Read Aloud',
      'R&W Fill in the Blanks',
      'Describe Image',
    ],
    focusLabel: 'Balanced review',
  },
  '50': {
    title: 'Target 50 · CEFR B1',
    subtitle: 'A score of 50 falls within the published B1 band (43–58)',
    recommendation:
      'Build a baseline across the skills required for your goal. Practise objective items for accuracy and use flexible outlines for speaking and writing; no template guarantees a particular score.',
    keyTypes: ['Describe Image', 'Read Aloud (Fluency)', 'Write Essay', 'Write From Dictation'],
    focusLabel: 'Use your report to set priorities',
  },
  '65': {
    title: 'Target 65 · CEFR B2',
    subtitle: 'A score of 65 falls within the published B2 band (59–75)',
    recommendation:
      'Review the skills and question types where your practice results show the largest gaps. Include both integrated items and tasks that assess one skill; the report is a practice estimate, not a prediction of an official score.',
    keyTypes: [
      'Write From Dictation',
      'Repeat Sentence',
      'Fill in the Blanks',
      'Summarize Spoken Text',
    ],
    focusLabel: 'Choose priorities from recent results',
  },
  '79': {
    title: 'Target 79 · CEFR C1',
    subtitle: 'A score of 79 falls within the published C1 band (76–84)',
    recommendation:
      'At higher targets, review accuracy and response quality across every required skill. Check the published scoring rules for each task and use repeated practice results to track progress.',
    keyTypes: [
      'Review all practice priorities',
      'Summarize Spoken Text',
      'Summarize Written Text (Strict single sentence)',
      'Highlight Incorrect Words',
    ],
    focusLabel: 'Track each skill separately',
  },
}

export function ScoreWeightageMatrix() {
  const [selectedSkill, setSelectedSkill] = useState<Skill | 'all'>('all')
  const [selectedTier, setSelectedTier] = useState<1 | 2 | 3 | 'all'>('all')
  const [targetScore, setTargetScore] = useState<TargetScore>('all')

  const filteredItems = useMemo(() => {
    return WEIGHTAGE_DATA.filter((item) => {
      const matchSkill =
        selectedSkill === 'all' || QUESTION_META[item.type].skills.includes(selectedSkill)
      const matchTier = selectedTier === 'all' || item.tier === selectedTier
      return matchSkill && matchTier
    })
  }, [selectedSkill, selectedTier])

  const currentStrategy = TARGET_STRATEGIES[targetScore]

  return (
    <section id="weightage" className="mt-16 scroll-mt-24">
      {/* Header */}
      <div className="border-ink-200 dark:border-white/10 border-t pt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="bg-ink-100 text-ink-700 dark:bg-white/5 dark:text-ink-on-dark rounded-sm px-2.5 py-0.5 text-xs font-bold">
              Practice guide
            </span>
            <h2 className="section-title mt-2">Question type scoring & practice priorities</h2>
          </div>
          <Link to="/scoring" className="btn-secondary px-3 py-1.5 text-xs font-semibold">
            How scoring works
          </Link>
        </div>
        <p className="text-ink-600 dark:text-ink-on-dark mt-3 text-sm leading-relaxed max-w-3xl">
          Some question types contribute to more than one communicative skill. Filter by skill to
          see which tasks the published blueprint assigns to it. The scoring rule is shown for each
          type; the practice priorities and time suggestions are editorial guidance.
        </p>
        <Callout tone="amber" className="mt-4 p-4" label="About scoring and priorities">
          <p className="text-ink-700 dark:text-ink-200 text-sm leading-relaxed">
            Pearson does not publish the formula that converts item and trait scores to the 10–90
            scale. This page therefore shows published scoring rules and skill assignments, not
            estimated point contributions. Priority groups are suggestions, not official weights.
          </p>
        </Callout>
      </div>

      {/* Target Score Focus Selector Tabs */}
      <div className="card-solid mt-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-ink-900 dark:text-white text-base font-bold">
              Focus by target score
            </h3>
            <p className="text-ink-500 dark:text-ink-on-dark-muted text-xs mt-0.5">
              Choose a score to see the corresponding CEFR band and a general practice reminder:
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Target score presets">
            {(
              [
                { id: 'all', label: 'All types' },
                { id: '50', label: 'Target 50 · B1' },
                { id: '65', label: 'Target 65 · B2' },
                { id: '79', label: 'Target 79 · C1' },
              ] as const
            ).map((tab) => {
              const active = targetScore === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTargetScore(tab.id)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
                    active
                      ? 'bg-brand-600 text-white'
                      : 'bg-ink-100 hover:bg-ink-200 text-ink-700 dark:bg-white/8 dark:hover:bg-white/12 dark:text-ink-200',
                  )}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Strategy Detail Card */}
        <Reveal variant="up" delay={30} duration={550}>
          <div className="border-ink-200 dark:border-white/10 mt-5 rounded-md border bg-ink-100/60 p-4 dark:bg-white/[0.03]">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h4 className="text-ink-900 dark:text-white text-sm font-bold">
                {currentStrategy.title}
              </h4>
              <span className="text-ink-500 dark:text-ink-on-dark-muted text-xs">
                {currentStrategy.focusLabel}
              </span>
            </div>
            <p className="text-ink-500 dark:text-ink-on-dark-muted text-xs mt-1">
              {currentStrategy.subtitle}
            </p>
            <p className="text-ink-700 dark:text-ink-200 text-sm mt-3 leading-relaxed">
              {currentStrategy.recommendation}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="text-ink-500 dark:text-ink-on-dark-muted text-xs font-medium mr-1">
                Suggested areas to review:
              </span>
              {currentStrategy.keyTypes.map((kt) => (
                <span
                  key={kt}
                  className="bg-brand-500/10 text-brand-700 dark:text-brand-300 rounded-sm px-2 py-0.5 text-xs font-medium"
                >
                  {kt}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </div>

      <Callout tone="brand" className="mt-6 p-5" label="Integrated skills">
        <p className="text-ink-700 dark:text-ink-200 text-sm leading-relaxed">
          Some tasks contribute to multiple skill scores. For example, Write from Dictation is
          assigned to Listening and Writing, while Repeat Sentence is assigned to Listening and
          Speaking. These skill assignments come from the published blueprint; they do not reveal
          how many scaled-score points any item contributes.
        </p>
      </Callout>

      {/* Interactive Filters */}
      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Skill filter */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-ink-500 dark:text-ink-on-dark-muted text-xs font-semibold mr-1">
            Filter by skill:
          </span>
          {(['all', 'speaking', 'writing', 'reading', 'listening'] as const).map((s) => {
            const active = selectedSkill === s
            return (
              <button
                key={s}
                type="button"
                onClick={() => setSelectedSkill(s)}
                aria-pressed={active}
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs font-semibold transition-colors capitalize',
                  active
                    ? 'bg-brand-600 text-white'
                    : 'bg-ink-100 hover:bg-ink-200 text-ink-700 dark:bg-white/8 dark:hover:bg-white/12 dark:text-ink-on-dark',
                )}
              >
                {s === 'all' ? 'All Skills' : s}
              </button>
            )
          })}
        </div>

        {/* Tier filter */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-ink-500 dark:text-ink-on-dark-muted text-xs font-semibold mr-1">
            Filter by editorial priority:
          </span>
          {(
            [
              { id: 'all', label: 'All priorities' },
              { id: 1, label: 'Priority 1' },
              { id: 2, label: 'Priority 2' },
              { id: 3, label: 'Priority 3' },
            ] as const
          ).map((t) => {
            const active = selectedTier === t.id
            return (
              <button
                key={String(t.id)}
                type="button"
                onClick={() => setSelectedTier(t.id)}
                aria-pressed={active}
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs font-semibold transition-colors',
                  active
                    ? 'bg-ink-900 text-white dark:bg-white dark:text-ink-900'
                    : 'bg-ink-100 hover:bg-ink-200 text-ink-700 dark:bg-white/8 dark:hover:bg-white/12 dark:text-ink-on-dark',
                )}
              >
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Item count status */}
      <div className="mt-3 flex items-center justify-between text-xs text-ink-500 dark:text-ink-on-dark-muted">
        <span>
          Showing <strong>{filteredItems.length}</strong> of 22 question types
        </span>
        {selectedSkill !== 'all' && (
          <span className="text-brand-600 dark:text-brand-300 font-medium">
            Highlighted: tasks assigned to {selectedSkill} scoring
          </span>
        )}
      </div>

      {/* The Matrix Cards */}
      <div className="mt-4 grid gap-4">
        {filteredItems.map((item, i) => {
          // Every item in the matrix carries a cross-impact note, so the
          // fallback below is a guard rather than a path the matrix takes.
          /* v8 ignore next -- every item in the matrix carries a note */
          const meta = QUESTION_META[item.type]
          const slug = typeSlug(item.type)
          const note = (
            <div className="rounded-md bg-brand-500/8 border border-brand-500/15 p-2.5 dark:bg-brand-500/10">
              <span className="text-brand-700 dark:text-brand-300 text-xs font-semibold block">
                Skills scored
              </span>
              <p className="text-ink-800 dark:text-ink-200 text-xs mt-0.5 leading-snug">
                {meta.skills.join(' + ')}
                {meta.skills.length > 1 ? ' (integrated item)' : ''}
              </p>
            </div>
          )

          return (
            <Reveal key={item.type} variant="up" delay={Math.min(i, 8) * 25} duration={550}>
              <div
                className={cn(
                  'card-solid flex flex-col justify-between p-5',
                  item.tier === 1 && 'border-l-4 border-l-brand-500 dark:border-l-brand-400',
                  item.tier === 2 && 'border-l-4 border-l-amber-500 dark:border-l-amber-400',
                  item.tier === 3 && 'border-l-4 border-l-ink-300 dark:border-l-white/20',
                )}
              >
                <div>
                  {/* Title & Badges */}
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-ink-900 dark:text-white text-base font-bold">
                        <Link
                          to={`/question-types/${slug}/`}
                          className="-m-1 inline-flex min-h-6 items-center rounded-sm px-1 hover:text-brand-600 dark:hover:text-brand-300 hover:underline"
                        >
                          {item.name}
                        </Link>
                      </h3>
                      <span className="text-ink-500 dark:text-ink-on-dark-muted text-xs">
                        ({SECTION_META[meta.section].longTitle})
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {item.tier === 1 && <Badge tone="brand">Priority 1</Badge>}
                      {item.tier === 2 && <Badge tone="neutral">Priority 2</Badge>}
                      {item.tier === 3 && <Badge tone="neutral">Priority 3</Badge>}
                      <Badge tone="brand">{meta.skills.join(' + ')}</Badge>
                    </div>
                  </div>

                  {/* Published scoring rule and skill assignments */}
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <div className="rounded-md bg-ink-100 p-2.5 dark:bg-white/5">
                      <span className="text-ink-500 dark:text-ink-on-dark-muted text-xs font-semibold block">
                        Scoring rule
                      </span>
                      <span className="text-ink-900 dark:text-white text-sm font-semibold mt-0.5 block">
                        {SCORING_LABEL[meta.scoring]}
                      </span>
                      <span className="text-ink-500 dark:text-ink-on-dark-muted text-xs mt-0.5 block">
                        Suggested practice time: {item.suggestedTime}
                      </span>
                    </div>

                    {note}
                  </div>

                  {/* Strategy recommendation */}
                  <div className="mt-3">
                    <p className="text-ink-600 dark:text-ink-on-dark text-sm leading-relaxed">
                      <strong className="text-ink-900 dark:text-white font-medium">
                        Exam Strategy:{' '}
                      </strong>
                      {item.priorityStrategy}
                    </p>
                  </div>
                </div>

                {/* Action Links */}
                <div className="border-ink-100 dark:border-white/6 mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-3 text-xs">
                  <div className="text-ink-500 dark:text-ink-on-dark-muted">
                    {meta.perTest} per full exam
                  </div>
                  <div className="flex items-center gap-3">
                    <Link
                      to={`/question-types/${slug}/`}
                      className="-m-1 inline-flex min-h-6 items-center rounded-sm px-1 text-ink-600 hover:text-ink-900 dark:text-ink-on-dark-muted dark:hover:text-white font-medium hover:underline"
                    >
                      Scoring rubric & mistakes
                    </Link>
                    <Link
                      to={`/practice?type=${item.type}`}
                      className="btn-secondary px-3 py-1 text-xs font-semibold"
                    >
                      Practice now
                    </Link>
                  </div>
                </div>
              </div>
            </Reveal>
          )
        })}
      </div>
    </section>
  )
}
