import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ALL_QUESTION_TYPES, QUESTION_META, SECTION_META } from '../domain/blueprint'
import { typeSlug } from '../content/questionTypeDetail'
import { Seo } from '../seo/Seo'
import {
  Accordion,
  Button,
  ButtonLink,
  CtaBand,
  PageWrapper,
  SectionBand,
  SectionHeading,
  TickList,
} from '../components/ui/primitives'
import { Breadcrumbs } from '../components/ui/Breadcrumbs'
import { Reveal, Tilt } from '../components/ui/motion'

const FAQ = [
  {
    question: 'How do I get a higher PTE score in the shortest time?',
    answer:
      'Work on the objective items first. Fill in the Blanks and Re-order Paragraphs together account for a large share of the Reading points, they have deterministic answers, and Re-order Paragraphs awards 1 point per correctly ordered adjacent pair. Speaking and writing take longer to move and are easier to leave alone while you build the objective base.',
  },
  {
    question: 'Is it better to guess on multiple choice?',
    answer:
      'On single-answer multiple choice, an unanswered question earns no points. Multiple-answer questions deduct a point for each incorrect selection, so select options supported by the passage or recording and avoid unsupported guesses.',
  },
  {
    question: 'How should I prepare for Repeat Sentence?',
    answer:
      'Listen for short groups of words and repeat the sentence as accurately as you can. The recording plays once, so practise holding the sentence in memory while you listen. Review which words you missed and use that pattern to guide your next practice session.',
  },
  {
    question: 'What is the most common mistake on the PTE essay?',
    answer:
      'Writing fewer than 120 words gives Form zero; 120–199 words falls in the partial-credit band. The essay is scored on task-specific traits, including content, development and structure, coherence, and general linguistic range. A clear structure can help organise your argument, but it cannot guarantee trait scores; answer the prompt directly and use relevant examples in your own words.',
  },
  {
    question: 'Do I need to practise the two newest question types?',
    answer:
      'Yes. Summarize Group Discussion and Respond to a Situation are part of the current format. Summarize Group Discussion contributes to Listening and Speaking and is rated on task-specific traits; practise identifying the main ideas and expressing them clearly.',
  },
  {
    question: 'Should I use the full two hours or is practice mode fine?',
    answer:
      'Practice mode is useful while learning a question type because it can show transcripts, tips and replays. Full mocks let you practise pacing across sections and listening without replay; choose either format based on what you want to work on.',
  },
]

interface StrategyTemplate {
  id: string
  title: string
  targetType: string
  drillPath: string
  timeLimit: string
  rationale: string
  templateText: string
}

const TEMPLATES: StrategyTemplate[] = [
  {
    id: 'describe-image',
    title: 'Describe Image (25s Oral Structure)',
    targetType: 'Describe Image',
    drillPath: '/practice?type=describe-image',
    timeLimit: 'Speak for 25–30 seconds',
    rationale:
      'A simple sequence can help you cover the image’s main features. No template guarantees a score: describe only details the image supports, and adapt the wording to the prompt rather than reciting memorised text.',
    templateText: `The given [image / bar chart / line graph] provides significant information regarding [Topic / Title of Image].
Looking at the key details, the highest figure can be observed in [Category A], which reaches approximately [Value / Number].
In contrast, the lowest figure is seen in [Category B], accounting for around [Value / Number].
Furthermore, there is a noticeable [increase / decrease / trend] in [Category C] compared to [Category D].
In conclusion, it is evident that [main overall observation or takeaway].`,
  },
  {
    id: 'retell-lecture',
    title: 'Re-tell Lecture & Group Discussion Frame',
    targetType: 'Re-tell Lecture & Summarize Group Discussion',
    drillPath: '/practice?type=retell-lecture',
    timeLimit: 'Speak for 30–35 seconds',
    rationale:
      'Use a short outline to organise the key points you remember. Adapt it to the recording and keep speaking naturally; no fixed number of key phrases guarantees a score.',
    templateText: `The speaker in the audio was delivering an academic presentation about [Main Topic / Theme].
Firstly, the speaker emphasized that [First Key Keyword Phrase or Observation].
Furthermore, the speaker discussed the importance of [Second Key Keyword Phrase], noting that it has significant implications.
In addition, the presentation highlighted [Third Key Keyword Phrase] along with [Fourth Key Keyword Phrase].
Overall, the lecture provides crucial insights into [Main Topic / Final Summary Phrase].`,
  },
  {
    id: 'write-essay',
    title: 'Academic Essay (4-Paragraph Balanced Framework)',
    targetType: 'Write Essay',
    drillPath: '/practice?type=write-essay',
    timeLimit: '20 minutes, Aim for 220–260 words',
    rationale:
      'A four-paragraph outline can help organise an argument under time pressure, but it cannot guarantee Form, Structure and Coherence, or Grammar scores. Meet the word limit, answer the prompt directly, and use specific examples you can support rather than memorised claims.',
    templateText: `[Paragraph 1 - Introduction]
In contemporary society, the debate surrounding whether [Topic / Question Statement] has garnered considerable attention. While some argue that [Perspective A], others maintain that [Perspective B]. In this essay, I will analyze both viewpoints before presenting my own reasoned perspective.

[Paragraph 2 - Body 1 (Perspective A)]
To begin with, there are compelling reasons to support the notion that [Main Point A]. The primary factor is that [Explanation 1]. For example, recent empirical studies demonstrate that [Concrete Example / Scenario]. Furthermore, [Supplementary Argument A], which underscores the validity of this position.

[Paragraph 3 - Body 2 (Perspective B & Personal Stance)]
On the other hand, proponents of the alternative stance emphasize that [Main Point B]. It is widely recognized that [Explanation 2]. A prominent illustration of this can be seen when [Concrete Example 2]. Consequently, taking this dimension into account is essential for a comprehensive understanding of the issue.

[Paragraph 4 - Conclusion]
In conclusion, although valid arguments can be made for both sides, I firmly believe that [Author's Clear Position]. Moving forward, it is imperative that [Forward-looking constructive recommendation or summary thought].`,
  },
  {
    id: 'summarize-spoken-text',
    title: 'Summarize Spoken Text (50–70 Words Exact)',
    targetType: 'Summarize Spoken Text',
    drillPath: '/practice?type=summarize-spoken-text',
    timeLimit: '10 minutes, 50–70 words',
    rationale:
      'Aim for 50–70 words, the top Form band. Responses of 40–49 or 71–100 words receive the partial Form band, while responses outside those ranges receive zero Form. Count your finished response; this outline does not guarantee a particular length or score.',
    templateText: `The lecture provided insightful information regarding [Main Topic]. The speaker initially highlighted that [Key Point 1]. Subsequently, the discussion focused on the role of [Key Point 2] and demonstrated the significance of [Key Point 3]. Ultimately, the speaker concluded by emphasizing that [Key Point 4].`,
  },
  {
    id: 'respond-situation',
    title: 'Respond to a Situation (2025 New Type)',
    targetType: 'Respond to a Situation',
    drillPath: '/practice?type=respond-to-situation',
    timeLimit: 'Speak for 20–30 seconds',
    rationale:
      'Evaluates pragmatic spoken English in real-world scenarios (asking for a refund, rescheduling a meeting, polite disagreement).',
    templateText: `Hello [Name / Sir / Ma'am], I am speaking with you regarding [the specific situation or issue].
I completely understand that [acknowledge context or difficulty], and I truly appreciate your patience.
To resolve this matter effectively, I would like to propose that we [offer practical solution or request action].
Please let me know if this arrangement suits you, and thank you for your assistance.`,
  },
]

const COLLOCATIONS: Array<{ col: string; type: string; example: string }> = [
  {
    col: 'carry out research',
    type: 'Verb + Noun',
    example: 'Scientists carried out extensive research into renewable fuels.',
  },
  {
    col: 'vital / crucial role',
    type: 'Adj + Noun',
    example: 'Early education plays a vital role in cognitive development.',
  },
  {
    col: 'widespread consensus',
    type: 'Adj + Noun',
    example: 'There is now a widespread consensus among climatologists.',
  },
  {
    col: 'sharp / dramatic decline',
    type: 'Adj + Noun',
    example: 'The region experienced a sharp decline in agricultural yield.',
  },
  {
    col: 'shed light on',
    type: 'Idiomatic Phrase',
    example: 'Recent archaeological findings shed light on ancient trade routes.',
  },
  {
    col: 'draw a conclusion',
    type: 'Verb + Noun',
    example: 'Researchers were hesitant to draw conclusions from preliminary data.',
  },
  {
    col: 'underlying cause',
    type: 'Adj + Noun',
    example: 'Poverty remains the underlying cause of nutritional deficiency.',
  },
  {
    col: 'profound impact / effect',
    type: 'Adj + Noun',
    example: 'Technological shifts have had a profound impact on labor markets.',
  },
  {
    col: 'pave the way for',
    type: 'Prepositional',
    example: 'Innovations in genomics paved the way for personalized medicine.',
  },
  {
    col: 'pose a threat to',
    type: 'Verb + Noun',
    example: 'Invasive species pose a serious threat to indigenous wildlife.',
  },
  {
    col: 'empirical evidence',
    type: 'Adj + Noun',
    example: 'The theoretical model was supported by strong empirical evidence.',
  },
  {
    col: 'take into account',
    type: 'Prepositional',
    example: 'Policy makers must take demographic changes into account.',
  },
  {
    col: 'growing concern',
    type: 'Adj + Noun',
    example: 'Antibiotic resistance is an issue of growing concern globally.',
  },
  {
    col: 'establish a relationship',
    type: 'Verb + Noun',
    example: 'The study established a direct relationship between diet and health.',
  },
  {
    col: 'stem from',
    type: 'Phrasal Verb',
    example: 'Many societal problems stem from economic inequality.',
  },
  {
    col: 'gain insight into',
    type: 'Verb + Noun',
    example: 'Brain scans allow researchers to gain insight into cognitive processes.',
  },
]

function TemplateCard({ item }: { item: StrategyTemplate }) {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    },
    [],
  )

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(item.templateText)
      setCopied(true)
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  return (
    <div className="card-solid">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="pill bg-brand-500/10 text-brand-700 dark:text-brand-300 text-xs">
            {item.targetType}, {item.timeLimit}
          </span>
          <h3 className="text-ink-900 dark:text-white mt-1.5 text-base font-bold">{item.title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={copy} className="text-xs">
            {copied ? 'Copied ✓' : 'Copy template'}
          </Button>
          <ButtonLink to={item.drillPath} variant="ghost" className="text-xs">
            Drill
          </ButtonLink>
        </div>
      </div>

      <div className="mt-4 rounded-md bg-ink-900 p-4 text-ink-100 text-xs leading-relaxed overflow-x-auto selection:bg-brand-500/40">
        <pre className="whitespace-pre-wrap font-sans">{item.templateText}</pre>
      </div>

      <p className="mt-3 text-xs text-ink-500 dark:text-ink-on-dark-muted leading-relaxed">
        <span className="font-semibold text-mint-700 dark:text-mint-300">How to adapt it:</span>{' '}
        {item.rationale}
      </p>
    </div>
  )
}

export default function Guide() {
  return (
    <>
      <Seo />

      <PageWrapper
        breadcrumbs={<Breadcrumbs trail={[{ name: 'Home', path: '/' }, { name: 'PTE tips' }]} />}
        eyebrow="Study guide"
        title="PTE strategies for focused practice."
        description={
          <>
            Use your practice results to decide what to work on next, then explore techniques for
            all 22 types in the{' '}
            <Link to="/question-types/" className="link-inline">
              question type guide
            </Link>
            .
          </>
        }
      >
        <div className="-mt-4 mb-8 flex flex-wrap gap-2.5">
          <a
            href="#high-impact"
            className="inline-flex items-center gap-1.5 rounded-xl border border-ink-200/80 bg-white/70 px-3.5 py-2 text-xs font-bold text-ink-800 shadow-xs hover:border-mark-400 hover:text-mark-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-ink-on-dark dark:hover:border-mark-400 dark:hover:text-mark-300 transition-all"
          >
            <span className="size-2 rounded-full bg-emerald-500" />
            <span>5 practice habits</span>
          </a>
          <a
            href="#templates"
            className="inline-flex items-center gap-1.5 rounded-xl border border-ink-200/80 bg-white/70 px-3.5 py-2 text-xs font-bold text-ink-800 shadow-xs hover:border-mark-400 hover:text-mark-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-ink-on-dark dark:hover:border-mark-400 dark:hover:text-mark-300 transition-all"
          >
            <span className="size-2 rounded-full bg-amber-500" />
            <span>Flexible response outlines</span>
          </a>
          <a
            href="#collocations"
            className="inline-flex items-center gap-1.5 rounded-xl border border-ink-200/80 bg-white/70 px-3.5 py-2 text-xs font-bold text-ink-800 shadow-xs hover:border-mark-400 hover:text-mark-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-ink-on-dark dark:hover:border-mark-400 dark:hover:text-mark-300 transition-all"
          >
            <span className="size-2 rounded-full bg-purple-500" />
            <span>Academic collocations (FIB)</span>
          </a>
          <a
            href="#by-type"
            className="inline-flex items-center gap-1.5 rounded-xl border border-ink-200/80 bg-white/70 px-3.5 py-2 text-xs font-bold text-ink-800 shadow-xs hover:border-mark-400 hover:text-mark-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-ink-on-dark dark:hover:border-mark-400 dark:hover:text-mark-300 transition-all"
          >
            <span>Technique by type</span>
          </a>
          <a
            href="#study-plan"
            className="inline-flex items-center gap-1.5 rounded-xl border border-ink-200/80 bg-white/70 px-3.5 py-2 text-xs font-bold text-ink-800 shadow-xs hover:border-mark-400 hover:text-mark-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-ink-on-dark dark:hover:border-mark-400 dark:hover:text-mark-300 transition-all"
          >
            <span>4-Week study plan</span>
          </a>
        </div>

        <SectionHeading
          id="high-impact"
          className="mt-8"
          eyebrow="Priority order"
          title="Five practice habits to try"
        />
        <ol className="mt-6 space-y-4">
          {[
            {
              title: 'Re-order Paragraphs first',
              body: 'It awards one point per correctly ordered adjacent pair. Read the opening of each block and look for links such as references, sequence markers, and ideas that are introduced or concluded. Checking adjacent pairs can help you earn partial credit even when the full order is not correct.',
            },
            {
              title: 'Ten Repeat Sentences a day',
              body: 'Repeat Sentence contributes to both Listening and Speaking, and its response is also rated for oral fluency and pronunciation. Listen for meaningful groups of words, then reproduce the sentence after the recording ends. Review which words you missed.',
            },
            {
              title: 'Select only supported options',
              body: 'Multiple-answer items deduct a point for each incorrect selection, with the item score floored at zero. Select options supported by the passage or recording, and avoid adding choices just to reach a target count.',
            },
            {
              title: 'Organise the essay around the prompt',
              body: 'An introduction, two body paragraphs and a conclusion can make your argument easier to follow. Linking words help show how ideas connect, but structure alone does not guarantee a score; make sure each paragraph answers the specific prompt.',
            },
            {
              title: 'Use full mocks to practise pacing',
              body: 'Full mocks let you practise pacing across all three sections. Use them when that is useful for your preparation, and use focused drills when you want to work on a particular task type.',
            },
          ].map((item, i) => (
            <Reveal as="li" key={item.title} delay={Math.min(i, 4) * 70} className="flex">
              <article className="card-solid flex w-full gap-4 p-5 sm:p-6 border-ink-200 dark:border-white/10">
                <span className="bg-mint-500 text-ink-900 grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold shadow-xs">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-ink-900 dark:text-white text-sm font-bold text-balance">
                    {item.title}
                  </h3>
                  <p className="text-ink-500 dark:text-ink-on-dark mt-1.5 text-sm leading-relaxed">
                    {item.body}
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </ol>

        <div id="templates" className="mt-16 scroll-mt-24">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <div>
              <span className="pill bg-mint-500/10 text-mint-700 dark:text-mint-300 text-xs font-bold">
                Practice frameworks
              </span>
              <SectionHeading
                className="mt-2 mb-0"
                eyebrow="Frameworks"
                title="Flexible response outlines"
              />
            </div>
            <p className="text-ink-500 dark:text-ink-on-dark-muted max-w-md text-xs leading-relaxed">
              Flexible outlines for organising a response. Adapt them to the prompt and use your own
              relevant content; memorised or irrelevant material can lose credit.
            </p>
          </div>

          <div className="mt-6 space-y-4">
            {TEMPLATES.map((tmpl, i) => (
              <Reveal key={tmpl.id} delay={Math.min(i, 4) * 60}>
                <Tilt glare={false}>
                  <TemplateCard item={tmpl} />
                </Tilt>
              </Reveal>
            ))}
          </div>
        </div>

        <div id="collocations" className="mt-16 scroll-mt-24">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <div>
              <span className="pill bg-brand-500/10 text-brand-700 dark:text-brand-300 text-xs font-bold">
                Vocabulary booster
              </span>
              <SectionHeading
                className="mt-2 mb-0"
                eyebrow="Vocabulary"
                title="Academic Collocations (Fill in the Blanks)"
              />
            </div>
            <Link
              to="/practice?type=fill-in-blanks-dropdown"
              className="text-brand-600 dark:text-brand-300 -m-1 inline-flex min-h-6 items-center rounded-sm px-1 text-xs font-semibold hover:underline"
            >
              Practice FIB dropdowns
            </Link>
          </div>
          <p className="text-ink-500 dark:text-ink-on-dark-muted mt-2 text-sm leading-relaxed">
            Some Reading & Writing Fill in the Blanks items test familiar word partnerships. The
            Pearson Academic Collocation List is one useful resource; learn these examples in
            context and use the surrounding sentence to check each choice:
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {COLLOCATIONS.map((c, i) => (
              <Reveal key={c.col} delay={(i % 3) * 70} duration={650} className="h-full">
                <div className="card-solid h-full p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-ink-900 dark:text-white font-bold text-sm">{c.col}</span>
                    <span className="text-ink-500 dark:text-ink-on-dark-muted text-xs">
                      {c.type}
                    </span>
                  </div>
                  <p className="text-ink-600 dark:text-ink-on-dark mt-2 text-xs italic leading-relaxed">
                    "{c.example}"
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <SectionHeading
          id="by-type"
          className="mt-16"
          eyebrow="By type"
          title="Technique by question type"
        />
        {(['speaking-writing', 'reading', 'listening'] as const).map((key) => (
          <section key={key} className="mt-10">
            <h3 className="section-title">{SECTION_META[key].longTitle}</h3>
            <div className="mt-4 space-y-3">
              {ALL_QUESTION_TYPES.filter((t) => QUESTION_META[t].section === key).map((t, i) => {
                const qm = QUESTION_META[t]
                return (
                  <Reveal
                    as="article"
                    key={t}
                    id={t}
                    delay={Math.min(i, 4) * 45}
                    duration={600}
                    className="scroll-mt-24"
                  >
                    <div className="card-solid p-5 border-ink-200 dark:border-white/10">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h4 className="text-ink-900 dark:text-white text-sm font-bold text-balance">
                          {qm.label}
                        </h4>
                        <span className="pill bg-ink-100 text-ink-500 dark:bg-white/8 dark:text-ink-on-dark-muted">
                          {qm.perTest} per test, {qm.skills.join(' + ')}
                        </span>
                      </div>
                      <p className="text-ink-600 dark:text-ink-on-dark mt-2 text-sm leading-relaxed">
                        {qm.tip}
                      </p>
                      <div className="border-ink-100 dark:border-white/6 mt-3 flex items-center justify-between border-t pt-2.5 text-xs">
                        <Link
                          to={`/question-types/${typeSlug(t)}/`}
                          className="-m-1 inline-flex min-h-6 items-center rounded-sm px-1 text-ink-600 hover:text-brand-600 dark:text-ink-on-dark dark:hover:text-brand-300 font-medium hover:underline"
                        >
                          Deep dive & rubric
                        </Link>
                        <Link
                          to={`/practice?type=${t}`}
                          className="-m-1 inline-flex min-h-6 items-center rounded-sm px-1 text-brand-600 hover:text-brand-700 dark:text-brand-300 dark:hover:text-brand-200 font-semibold hover:underline"
                        >
                          Practice drill
                        </Link>
                      </div>
                    </div>
                  </Reveal>
                )
              })}
            </div>
          </section>
        ))}

        <SectionHeading
          className="mt-16"
          eyebrow="Recording"
          title="Recording rules that decide items silently"
        />
        <p className="text-ink-600 dark:text-ink-200 max-w-2xl leading-relaxed">
          The microphone is not forgiving about silence. These are the mechanics of the recording
          itself, rather than of the language, and they cost marks more often than pronunciation
          does. Each one is taken from Pearson's own guidance for the question type.
        </p>
        <TickList
          className="mt-5"
          items={[
            'Start the instant the recording status changes. On an Answer Short Question the microphone opens when the box changes and closes on its own — Pearson states that waiting more than three seconds ends the recording, marks the item completed, and the answer is gone. There is no second attempt.',
            'Once you have started talking, do not stop for more than a second or two before you finish. A long pause mid answer reads as hesitation to fluency scoring, and the microphone can close on the same rule that opened it.',
            'On Summarize Spoken Text you get three seconds with the image before the audio starts. Use it to predict the topic and the vocabulary you are about to hear, rather than staring at it.',
            'Read Aloud gives you forty seconds of recording and about forty seconds of preparation beforehand. Preparation is for the first three words; the recording clock does not wait for you.',
            'The same silence rule governs every speaking item, which is why the habit worth building is answering on the tone rather than composing an answer and then delivering it.',
          ]}
        />

        <SectionHeading className="mt-16" eyebrow="Time pressure" title="Under time pressure" />
        <TickList
          className="mt-5"
          items={[
            'Never leave a single-answer question blank. A guess is free; a blank is zero.',
            'In Fill in the Blanks, decide the word class first, then the word. Options change between noun, verb, adjective and adverb, and the class is usually given away by the article or ending.',
            'On the table completion, work down a column rather than across a row so you stay in one part of the passage.',
            'Do the listening items in order. The recordings are short and the momentum matters more than doubling back.',
            'Reserve the allotted time for the essay task and check the word count before submitting. An unanswered essay earns no credit, so leave enough time to write a complete response.',
            'If you run out of time in a section, the clock does not stop. Submit rather than leaving blanks, because the next section still counts.',
          ]}
        />

        <SectionBand className="mt-16">
          <SectionHeading id="study-plan" eyebrow="Schedule" title="A four-week study plan" />
          <Reveal variant="fade">
            <div className="card-solid mt-5 overflow-x-auto p-0 border-ink-200 dark:border-white/10">
              <table className="table-data min-w-lg">
                <caption className="sr-only">Four week PTE preparation plan</caption>
                <thead>
                  <tr className="border-ink-200 dark:border-white/10 border-b">
                    {['Week', 'Focus', 'Daily practice', 'Mock test'].map((h) => (
                      <th key={h} scope="col">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    [
                      '1',
                      'Reading accuracy',
                      'Fill in the Blanks, Re-order Paragraphs, 1 passage a day',
                      'Full mock, practice mode',
                    ],
                    [
                      '2',
                      'Listening and repetition',
                      'Repeat Sentence, Re-tell Lecture, Write from Dictation',
                      'Section mock: Listening',
                    ],
                    [
                      '3',
                      'Producing language',
                      'Describe Image, Summarize Written Text, essay outlines',
                      'Section mock: Part 1',
                    ],
                    [
                      '4',
                      'Full simulation',
                      'Timed sections, no transcripts, no pauses',
                      'Two full mocks, exam mode',
                    ],
                  ].map((row) => (
                    <tr key={row[0]} className="border-ink-100 dark:border-white/6 border-b">
                      <td className="text-ink-900 dark:text-white font-bold">{row[0]}</td>
                      <td className="text-ink-700 dark:text-ink-200">{row[1]}</td>
                      <td className="text-ink-500 dark:text-ink-on-dark-muted">{row[2]}</td>
                      <td className="text-ink-500 dark:text-ink-on-dark-muted">{row[3]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>

          <SectionHeading
            id="faqs"
            className="mt-16"
            eyebrow="Questions"
            title="Frequently asked questions"
          />
          <Reveal variant="fade">
            <Accordion items={FAQ} />
          </Reveal>
        </SectionBand>

        <CtaBand
          title="Apply it to a real paper"
          description="Reading this page is worth less than one scored attempt. Find out what these techniques actually do to your score."
          actions={
            <>
              <ButtonLink to="/mock" size="lg" magnetic>
                Start a full mock
              </ButtonLink>
              <ButtonLink to="/practice" variant="secondary" size="lg">
                Drill a weak type
              </ButtonLink>
            </>
          }
        />
      </PageWrapper>
    </>
  )
}
