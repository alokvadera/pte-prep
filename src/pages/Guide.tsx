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
      'Work on the objective items first. Fill in the Blanks and Re-order Paragraphs together account for a large share of the Reading and Part 1 points, they have deterministic answers, and Re-order Paragraphs carries no partial credit, so every mark gained is a full mark. Speaking and writing take longer to move and are easier to leave alone while you build the objective base.',
  },
  {
    question: 'Is it better to guess on multiple choice?',
    answer:
      'On single-answer multiple choice, always answer — an unanswered question is worth nothing. On multiple-answer questions, points are deducted for wrong selections, so guess only after you have eliminated. In practice, a candidate who has narrowed to two options should choose both only when they are genuinely confident in both.',
  },
  {
    question: 'How should I prepare for Repeat Sentence?',
    answer:
      'Chunk each sentence into groups of three to five words and shadow the audio as you listen. The recordings contain the sentence once at natural speed, so the preparation has to happen during playback, not after it. Practising ten items a day for two weeks moves this type more than any other single activity.',
  },
  {
    question: 'What is the most common mistake on the PTE essay?',
    answer:
      'Spending the whole twenty minutes planning, or writing fewer than 200 words. The essay is scored on content, development and structure, coherence, and general linguistic range. A clear four-paragraph structure with linked sentences protects two of those four traits even when the argument is not especially original.',
  },
  {
    question: 'Do I need to practise the two newest question types?',
    answer:
      'Yes. Summarize Group Discussion and Respond to a Situation are part of the current format and appear in the Speaking and Writing section. Summarize Group Discussion is scored on oral fluency, pronunciation and content, so the technique is the same as Re-tell Lecture at a larger scale: capture the skeleton, not the details.',
  },
  {
    question: 'Should I use the full two hours or is practice mode fine?',
    answer:
      'Use practice mode while you are learning question types, because it shows transcripts, tips and replays. Use exam conditions for at least every third attempt, because the thing being tested includes the clock and the fact that you cannot rewind the audio.',
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
    rationale: 'Pearson algorithms evaluate continuous oral fluency without hesitations and content keywords. This balanced structure guarantees intro, high/low points, and conclusion without risking human penalty.',
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
    rationale: 'Focus on oral fluency and capturing 4-6 distinct academic nouns/phrases from the recording. Never pause to search for memory; maintain steady cadence.',
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
    rationale: 'Guarantees maximum Form (2/2), Structure & Coherence (6/6), and Grammar (2/2). Four clear paragraphs with formal discourse markers satisfy human and automated grading.',
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
    rationale: 'Form score requires strictly 50 to 70 words. Exceeding 70 words or falling below 50 zeroes Form. This compact compound structure ensures exact length and high content keyword density.',
    templateText: `The lecture provided insightful information regarding [Main Topic]. The speaker initially highlighted that [Key Point 1]. Subsequently, the discussion focused on the role of [Key Point 2] and demonstrated the significance of [Key Point 3]. Ultimately, the speaker concluded by emphasizing that [Key Point 4].`,
  },
  {
    id: 'respond-situation',
    title: 'Respond to a Situation (2025 New Type)',
    targetType: 'Respond to a Situation',
    drillPath: '/practice?type=respond-to-situation',
    timeLimit: 'Speak for 20–30 seconds',
    rationale: 'Evaluates pragmatic spoken English in real-world scenarios (asking for a refund, rescheduling a meeting, polite disagreement).',
    templateText: `Hello [Name / Sir / Ma'am], I am speaking with you regarding [the specific situation or issue].
I completely understand that [acknowledge context or difficulty], and I truly appreciate your patience.
To resolve this matter effectively, I would like to propose that we [offer practical solution or request action].
Please let me know if this arrangement suits you, and thank you for your assistance.`,
  },
]

const COLLOCATIONS: Array<{ col: string; type: string; example: string }> = [
  { col: 'carry out research', type: 'Verb + Noun', example: 'Scientists carried out extensive research into renewable fuels.' },
  { col: 'vital / crucial role', type: 'Adj + Noun', example: 'Early education plays a vital role in cognitive development.' },
  { col: 'widespread consensus', type: 'Adj + Noun', example: 'There is now a widespread consensus among climatologists.' },
  { col: 'sharp / dramatic decline', type: 'Adj + Noun', example: 'The region experienced a sharp decline in agricultural yield.' },
  { col: 'shed light on', type: 'Idiomatic Phrase', example: 'Recent archaeological findings shed light on ancient trade routes.' },
  { col: 'draw a conclusion', type: 'Verb + Noun', example: 'Researchers were hesitant to draw conclusions from preliminary data.' },
  { col: 'underlying cause', type: 'Adj + Noun', example: 'Poverty remains the underlying cause of nutritional deficiency.' },
  { col: 'profound impact / effect', type: 'Adj + Noun', example: 'Technological shifts have had a profound impact on labor markets.' },
  { col: 'pave the way for', type: 'Prepositional', example: 'Innovations in genomics paved the way for personalized medicine.' },
  { col: 'pose a threat to', type: 'Verb + Noun', example: 'Invasive species pose a serious threat to indigenous wildlife.' },
  { col: 'empirical evidence', type: 'Adj + Noun', example: 'The theoretical model was supported by strong empirical evidence.' },
  { col: 'take into account', type: 'Prepositional', example: 'Policy makers must take demographic changes into account.' },
  { col: 'growing concern', type: 'Adj + Noun', example: 'Antibiotic resistance is an issue of growing concern globally.' },
  { col: 'establish a relationship', type: 'Verb + Noun', example: 'The study established a direct relationship between diet and health.' },
  { col: 'stem from', type: 'Phrasal Verb', example: 'Many societal problems stem from economic inequality.' },
  { col: 'gain insight into', type: 'Verb + Noun', example: 'Brain scans allow researchers to gain insight into cognitive processes.' },
]

function TemplateCard({ item }: { item: StrategyTemplate }) {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<number | null>(null)

  useEffect(() => () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
  }, [])

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
        <span className="font-semibold text-mint-700 dark:text-mint-300">Why it works:</span> {item.rationale}
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
        title="PTE strategies that move the score."
        description={<>Most advice is generic. Start with the changes that return the most marks, then explore techniques for all 22 types in the <Link to="/question-types/" className="link-inline">question type guide</Link>.</>}
      >
        <div className="-mt-4 mb-8 flex flex-wrap gap-2.5">
          <a
            href="#high-impact"
            className="inline-flex items-center gap-1.5 rounded-xl border border-ink-200/80 bg-white/70 px-3.5 py-2 text-xs font-bold text-ink-800 shadow-xs hover:border-mark-400 hover:text-mark-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-ink-on-dark dark:hover:border-mark-400 dark:hover:text-mark-300 transition-all"
          >
            <span className="size-2 rounded-full bg-emerald-500" />
            <span>5 Highest-impact changes</span>
          </a>
          <a
            href="#templates"
            className="inline-flex items-center gap-1.5 rounded-xl border border-ink-200/80 bg-white/70 px-3.5 py-2 text-xs font-bold text-ink-800 shadow-xs hover:border-mark-400 hover:text-mark-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-ink-on-dark dark:hover:border-mark-400 dark:hover:text-mark-300 transition-all"
          >
            <span className="size-2 rounded-full bg-amber-500" />
            <span>Proven 2025/2026 templates</span>
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
          title="The five highest-impact changes"
        />
        <ol className="mt-6 space-y-4">
          {[
            {
              title: 'Re-order Paragraphs first',
              body: 'It has no partial credit, so it is the cheapest full-mark item on the test. Read the first sentence of every block and build a chain: who refers to whom, what follows what, and which paragraph closes by restating the topic. Two or three minutes of training here recovers whole marks that partial-credit items cannot.',
            },
            {
              title: 'Ten Repeat Sentences a day',
              body: 'This is the largest single block of items in Part 1 and it trains three things at once — listening accuracy, speaking fluency and pronunciation. Chunk the sentence into groups of three to five words as you listen, and start speaking before the sentence ends.',
            },
            {
              title: 'Stop guessing on multiple-answer questions',
              body: 'Wrong selections cost points. A single-answer question should always be answered; a multiple-answer question should only be answered once two options are eliminated. Candidates routinely lose more here than on the reading passages.',
            },
            {
              title: 'Learn one structure for the essay and never improvise it',
              body: 'Introduction, two body paragraphs, conclusion, with explicit linking words in every body paragraph. The coherence and organisation traits are protected by structure alone, and structure is the one thing you can guarantee under time pressure.',
            },
            {
              title: 'Sit full mocks in exam mode every third attempt',
              body: 'The clock is part of what the test measures. If every attempt has unlimited time and visible transcripts, you are training the language but not the test. Alternate deliberately.',
            },
          ].map((item, i) => (
            <Reveal as="li" key={item.title} delay={Math.min(i, 4) * 70} className="flex">
              <article className="card-solid flex w-full gap-4 p-5 sm:p-6 border-ink-200 dark:border-white/10">
              <span className="bg-mint-500 text-ink-900 grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold shadow-xs">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-ink-900 dark:text-white text-sm font-bold text-balance">{item.title}</h3>
                <p className="text-ink-500 dark:text-ink-on-dark mt-1.5 text-sm leading-relaxed">{item.body}</p>
              </div>
              </article>
            </Reveal>
          ))}
        </ol>

        <div id="templates" className="mt-16 scroll-mt-24">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <div>
              <span className="pill bg-mint-500/10 text-mint-700 dark:text-mint-300 text-xs font-bold">
                Exam-proven frameworks
              </span>
              <SectionHeading className="mt-2 mb-0" eyebrow="Frameworks" title="Proven 2025/2026 Strategy Templates" />
            </div>
            <p className="text-ink-500 dark:text-ink-on-dark-muted max-w-md text-xs leading-relaxed">
              Safe structures that hit Pearson content keywords and maintain oral fluency without triggering template penalties.
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
              <SectionHeading className="mt-2 mb-0" eyebrow="Vocabulary" title="Academic Collocations (Fill in the Blanks)" />
            </div>
            <Link to="/practice?type=fill-in-blanks-dropdown" className="text-brand-600 dark:text-brand-300 -m-1 inline-flex min-h-6 items-center rounded-sm px-1 text-xs font-semibold hover:underline">
              Practice FIB dropdowns
            </Link>
          </div>
          <p className="text-ink-500 dark:text-ink-on-dark-muted mt-2 text-sm leading-relaxed">
            Over 70% of blanks in Reading & Writing FIB test collocations from the Pearson Academic Collocation List (ACL). Memorize these common word partnerships:
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {COLLOCATIONS.map((c, i) => (
              <Reveal key={c.col} delay={(i % 3) * 70} duration={650} className="h-full">
              <div className="card-solid h-full p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-ink-900 dark:text-white font-bold text-sm">{c.col}</span>
                  <span className="text-ink-500 dark:text-ink-on-dark-muted text-xs">{c.type}</span>
                </div>
                <p className="text-ink-600 dark:text-ink-on-dark mt-2 text-xs italic leading-relaxed">"{c.example}"</p>
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
                  <Reveal as="article" key={t} id={t} delay={Math.min(i, 4) * 45} duration={600} className="scroll-mt-24">
                    <div className="card-solid p-5 border-ink-200 dark:border-white/10">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h4 className="text-ink-900 dark:text-white text-sm font-bold text-balance">{qm.label}</h4>
                      <span className="pill bg-ink-100 text-ink-500 dark:bg-white/8 dark:text-ink-on-dark-muted">
                        {qm.perTest} per test, {qm.skills.join(' + ')}
                      </span>
                    </div>
                    <p className="text-ink-600 dark:text-ink-on-dark mt-2 text-sm leading-relaxed">{qm.tip}</p>
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
          The microphone is not forgiving about silence. These are the mechanics of the recording itself, rather than of
          the language, and they cost marks more often than pronunciation does. Each one is taken from Pearson's own
          guidance for the question type.
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
            'Write the essay in the last 20 minutes of Part 1 whatever happens. An unwritten essay is a guaranteed zero on a whole trait group.',
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
                ['1', 'Reading accuracy', 'Fill in the Blanks, Re-order Paragraphs, 1 passage a day', 'Full mock, practice mode'],
                ['2', 'Listening and repetition', 'Repeat Sentence, Re-tell Lecture, Write from Dictation', 'Section mock: Listening'],
                ['3', 'Producing language', 'Describe Image, Summarize Written Text, essay outlines', 'Section mock: Part 1'],
                ['4', 'Full simulation', 'Timed sections, no transcripts, no pauses', 'Two full mocks, exam mode'],
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
              <ButtonLink to="/mock" size="lg" magnetic>Start a full mock</ButtonLink>
              <ButtonLink to="/practice" variant="secondary" size="lg">Drill a weak type</ButtonLink>
            </>
          }
        />
      </PageWrapper>
    </>
  )
}
