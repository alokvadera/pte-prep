import { Link } from 'react-router-dom'
import { ALL_QUESTION_TYPES, MOCK_BLUEPRINT, QUESTION_META, SECTION_META } from '../domain/blueprint'
import { typeSlug } from '../content/questionTypeDetail'
import { Seo } from '../seo/Seo'
import {
  Accordion,
  Badge,
  ButtonLink,
  Card,
  CtaBand,
  PageWrapper,
  SectionBand,
  SectionHeading,
  TickList,
} from '../components/ui/primitives'
import { Breadcrumbs } from '../components/ui/Breadcrumbs'
import { ScoreWeightageMatrix } from '../components/ScoreWeightageMatrix'
import { Reveal, Tilt } from '../components/ui/motion'
import {
  Timeline,
  TimelineItem,
  TimelineHeader,
  TimelineDate,
  TimelineTitle,
  TimelineIndicator,
  TimelineSeparator,
  TimelineContent,
  Alert,
  AlertTitle,
  AlertDescription,
  IconTile,
} from '../components/ui'

const FAQ = [
  {
    question: 'How long is the PTE Academic test?',
    answer:
      `The PTE Academic is a single computer-based test divided into three timed parts. Current section ranges are Speaking and Writing ${SECTION_META['speaking-writing'].weightNote}, Reading ${SECTION_META.reading.weightNote}, and Listening ${SECTION_META.listening.weightNote}. The minimum and maximum ranges do not add up to a fixed total.`,
  },
  {
    question: 'How many questions are in the PTE Academic?',
    answer:
      'The exact number varies slightly between versions because each version is balanced for total length. A full-length test typically contains around 70 to 90 scored items spread across 22 question types, plus an unscored personal introduction at the start.',
  },
  {
    question: 'What are the recent changes to the PTE Academic?',
    answer:
      'The most recent change added two item types in August 2025: Summarize Group Discussion, which asks you to listen to a multi-speaker exchange and give an oral summary, and Respond to a Situation, which asks for a spoken response to a described context. The current format is nine Speaking and Writing types, five Reading types and eight Listening types, 22 in total.',
  },
  {
    question: 'Is the PTE computer-delivered?',
    answer:
      'Yes. It is delivered on computer at a test centre. You use a headset with a microphone, a keyboard and a screen. Speaking tasks require you to say your answer aloud while reading a prompt that appears on screen.',
  },
  {
    question: 'Do you get a break between sections?',
    answer:
      'There is no scheduled break. The three parts run one after another, and the clock for each part starts as soon as you begin it. Section introductions are shown on screen and count towards the time.',
  },
]

export default function TestFormat() {
  const totalItems = Object.values(MOCK_BLUEPRINT).reduce((a, b) => a + b, 0)

  return (
    <>
      <Seo />

      <PageWrapper
        breadcrumbs={<Breadcrumbs trail={[{ name: 'Home', path: '/' }, { name: 'PTE test format' }]} />}
        eyebrow="PTE test format"
        title="One test, three timed sections."
        description="Explore the current Academic format, how each section is arranged, and what changed with the two added question types."
        actions={
          <div className="flex flex-wrap gap-3">
            <ButtonLink to="/mock" magnetic>Start mock test</ButtonLink>
            <ButtonLink to="/practice" variant="secondary">Practice by skill</ButtonLink>
          </div>
        }
      >
        {/* Two different things used to share one row and one button shape:
            four jumps to sections of *this* page, and two links that leave it.
            A scroll indicator and a page link are not the same act, so they no
            longer look the same. The "On this page" label carries what the ↓
            arrow was doing, which means the arrow can go. */}
        <nav aria-label="Sections on this page" className="-mt-4 mb-8">
          <p className="section-eyebrow mb-3">On this page</p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
            {(['speaking-writing', 'reading', 'listening'] as const).map((key) => (
              <a
                key={key}
                href={`#${key}`}
                className="text-ink-600 dark:text-ink-on-dark hover:bg-ink-100 hover:text-mark-700 dark:hover:bg-white/6 dark:hover:text-mark-300 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors"
              >
                {SECTION_META[key].longTitle}
              </a>
            ))}
            <a
              href="#weightage"
              className="text-ink-600 dark:text-ink-on-dark hover:bg-ink-100 hover:text-mark-700 dark:hover:bg-white/6 dark:hover:text-mark-300 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors"
            >
              Score weightage &amp; priority matrix
            </a>
          </div>
        </nav>

        <div className="-mt-2 mb-8 flex flex-wrap gap-2.5">
          <Link
            to="/scoring"
            className="inline-flex items-center gap-2 rounded-xl border border-ink-200/80 bg-white/70 px-3.5 py-2 text-xs font-bold text-ink-800 shadow-xs hover:border-mark-400 hover:text-mark-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-ink-on-dark dark:hover:border-mark-400 dark:hover:text-mark-300 transition-all"
          >
            <span className="size-2 rounded-full bg-mark-500" />
            <span>How scoring works</span>
            <span className="rounded-md bg-ink-100 px-1.5 py-0.5 font-mono text-[10px] text-ink-600 dark:bg-white/10 dark:text-ink-on-dark-muted">CEFR &amp; Concordance</span>
          </Link>
          <Link
            to="/question-types/"
            className="inline-flex items-center gap-2 rounded-xl border border-ink-200/80 bg-white/70 px-3.5 py-2 text-xs font-bold text-ink-800 shadow-xs hover:border-mark-400 hover:text-mark-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-ink-on-dark dark:hover:border-mark-400 dark:hover:text-mark-300 transition-all"
          >
            <span className="size-2 rounded-full bg-emerald-500" />
            <span>All 22 question guides</span>
            <span className="rounded-md bg-ink-100 px-1.5 py-0.5 font-mono text-[10px] text-ink-600 dark:bg-white/10 dark:text-ink-on-dark-muted">Detailed rubrics</span>
          </Link>
        </div>

        <SectionHeading className="mt-8" eyebrow="At a glance" title="The three sections" />

        <Reveal variant="fade" className="mt-6 mb-8">
          <div className="card-solid p-6 sm:p-8">
            <h3 className="section-eyebrow mb-5">Exam day roadmap</h3>
            <Timeline orientation="vertical" className="max-w-2xl">
              <TimelineItem step={1}>
                <TimelineIndicator>1</TimelineIndicator>
                <TimelineSeparator />
                <TimelineHeader>
                  <TimelineDate>Part 1 · 54–67 min · 9 question types</TimelineDate>
                  <TimelineTitle>Speaking &amp; Writing</TimelineTitle>
                  <TimelineContent>
                    Read Aloud, Repeat Sentence, Describe Image, Re-tell Lecture, Answer Short Question, Summarize Group Discussion, Respond to a Situation, Summarize Written Text, and Write Essay.
                  </TimelineContent>
                </TimelineHeader>
              </TimelineItem>
              <TimelineItem step={2}>
                <TimelineIndicator>2</TimelineIndicator>
                <TimelineSeparator />
                <TimelineHeader>
                  <TimelineDate>Part 2 · 29–30 min · 5 question types</TimelineDate>
                  <TimelineTitle>Reading</TimelineTitle>
                  <TimelineContent>
                    Fill in the Blanks (Dropdown), Multiple Choice (Multiple Answers), Re-order Paragraphs, Fill in the Blanks (Table), and Multiple Choice (Single Answer).
                  </TimelineContent>
                </TimelineHeader>
              </TimelineItem>
              <TimelineItem step={3}>
                <TimelineIndicator>3</TimelineIndicator>
                <TimelineSeparator />
                <TimelineHeader>
                  <TimelineDate>Part 3 · 30–43 min · 8 question types</TimelineDate>
                  <TimelineTitle>Listening</TimelineTitle>
                  <TimelineContent>
                    Summarize Spoken Text, Multiple Choice (Multiple Answers), Fill in the Blanks, Highlight Correct Summary, Multiple Choice (Single Answer), Select Missing Word, Highlight Incorrect Words, and Write from Dictation.
                  </TimelineContent>
                </TimelineHeader>
              </TimelineItem>
              <TimelineItem step={4}>
                <TimelineIndicator className="border-mint-500 text-mint-600 dark:border-mint-400 dark:text-mint-300">✓</TimelineIndicator>
                <TimelineHeader>
                  <TimelineDate>Instant report · 10 to 90 scale</TimelineDate>
                  <TimelineTitle>Automated Diagnostic Report</TimelineTitle>
                  <TimelineContent>
                    Scored across communicative skills and enabling traits with CEFR band mapping and question-by-question review.
                  </TimelineContent>
                </TimelineHeader>
              </TimelineItem>
            </Timeline>
          </div>
        </Reveal>

        <Reveal variant="fade">
          <Card flush variant="solid" className="mt-6 overflow-x-auto">
          <table className="table-data min-w-lg">
            <caption className="sr-only">PTE Academic sections, durations and scored skill</caption>
            <thead>
              <tr className="border-ink-200 dark:border-white/10 border-b">
                {['Part', 'Section', 'Duration', 'Types', 'Scored skill'].map((h) => (
                  <th key={h} scope="col">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(['speaking-writing', 'reading', 'listening'] as const).map((key) => {
                const meta = SECTION_META[key]
                const types = ALL_QUESTION_TYPES.filter((t) => QUESTION_META[t].section === key)
                return (
                  <tr key={key} className="border-ink-100 dark:border-white/6 border-b">
                    <td className="text-ink-500 dark:text-ink-on-dark-muted">{meta.title}</td>
                    <td className="text-ink-900 dark:text-white font-semibold">{meta.longTitle}</td>
                    <td className="text-ink-700 dark:text-ink-200 whitespace-nowrap tabular-nums">
                      {meta.weightNote}
                    </td>
                    <td className="text-ink-500 dark:text-ink-on-dark-muted tabular-nums">{types.length}</td>
                    <td className="text-ink-500 dark:text-ink-on-dark-muted capitalize">{meta.skill}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </Card>
        </Reveal>
        <p className="text-ink-500 dark:text-ink-on-dark-muted mt-3 text-sm">
          The minimum and maximum times do not add up to a fixed total because each test version is balanced for length.
          No candidate receives either extreme.
        </p>

        <Reveal className="mt-12">
          <Alert variant="info" className="p-6">
            <AlertTitle className="text-base font-bold text-ink-900 dark:text-white">
              2025 Format Update: Two new question types added
            </AlertTitle>
            <AlertDescription className="text-ink-700 dark:text-ink-200 mt-2 text-sm leading-relaxed">
              Pearson added two item types in August 2025, bringing the total to 22. <strong className="text-ink-900 dark:text-white">Summarize Group Discussion</strong> plays a recorded exchange between three or four speakers and asks you to summarise the group's position in your own words. <strong className="text-ink-900 dark:text-white">Respond to a Situation</strong> describes a scenario and asks you to deliver an appropriate spoken response. Both sit in Part 1 and are scored on oral fluency, pronunciation and content.
            </AlertDescription>
          </Alert>
        </Reveal>

        <ScoreWeightageMatrix />

        <SectionHeading className="mt-16" eyebrow="The library" title="All 22 question types" />

        {(['speaking-writing', 'reading', 'listening'] as const).map((key) => {
          const meta = SECTION_META[key]
          const types = ALL_QUESTION_TYPES.filter((t) => QUESTION_META[t].section === key)
          return (
            <section key={key} id={key} className="mt-12 scroll-mt-24">
              <div className="border-ink-200 dark:border-white/10 flex items-start gap-4 border-t pt-8">
                <IconTile
                  variant={key === 'speaking-writing' ? 'soft' : key === 'reading' ? 'elevated' : 'solid'}
                  size="lg"
                  className={key === 'speaking-writing' ? 'text-mint-600 dark:text-mint-400' : key === 'reading' ? 'text-brand-600 dark:text-brand-300' : 'bg-amber-500 text-white'}
                >
                  {key === 'speaking-writing' ? (
                    <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                  ) : key === 'reading' ? (
                    <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                  ) : (
                    <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>
                  )}
                </IconTile>
                <div>
                  <h3 className="section-title">
                    {meta.title}, {meta.longTitle}
                  </h3>
                  <p className="text-ink-500 dark:text-ink-on-dark mt-2 text-sm leading-relaxed">{meta.blurb}</p>
                  <p className="text-ink-500 dark:text-ink-on-dark-muted mt-1 text-xs">
                    {types.length} types, {meta.weightNote}
                  </p>
                </div>
              </div>

              <ol className="mt-6 grid gap-4 sm:grid-cols-2">
                {types.map((t, i) => {
                  const qm = QUESTION_META[t]
                  const slug = typeSlug(t)
                  return (
                    <Reveal as="li" key={t} id={t} delay={Math.min(i, 4) * 45} duration={600} className="flex scroll-mt-24">
                      <article className="card-solid flex w-full flex-col justify-between">
                      <div>
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <h4 className="text-ink-900 dark:text-white text-base font-bold leading-tight text-balance">
                            <span className="text-ink-500 dark:text-ink-on-dark-muted mr-2 tabular-nums">{i + 1}.</span>
                            <Link
                              to={`/question-types/${slug}/`}
                              className="hover:text-brand-600 dark:hover:text-brand-300 hover:underline -m-1 inline-flex min-h-6 items-center rounded-sm px-1"
                            >
                              {qm.label}
                            </Link>
                          </h4>
                          <span className="flex flex-wrap gap-1.5">
                            <Badge tone="neutral">{qm.perTest} per test</Badge>
                            <Badge tone="brand">{qm.skills.join(' + ')}</Badge>
                          </span>
                        </div>
                        <p className="text-ink-600 dark:text-ink-on-dark mt-2.5 text-sm leading-relaxed">{qm.tip}</p>
                      </div>
                      <div className="border-ink-100 dark:border-white/6 mt-4 flex flex-wrap items-center gap-4 border-t pt-2.5 text-xs">
                        <Link
                          to={`/practice?type=${t}`}
                          className="text-brand-600 dark:text-brand-300 font-medium hover:underline -m-1 inline-flex min-h-6 items-center rounded-sm px-1"
                        >
                          Practice this type
                        </Link>
                        <Link
                          to={`/question-types/${slug}/`}
                          className="text-ink-500 dark:text-ink-on-dark-muted hover:text-ink-900 dark:hover:text-white -m-1 inline-block rounded-sm px-1 py-1 transition-colors"
                        >
                          Full guide & scoring
                        </Link>
                      </div>
                      </article>
                    </Reveal>
                  )
                })}
              </ol>
            </section>
          )
        })}

        {/* The closing group — delivery mechanics and the FAQ — is the part a
            reader arrives at after the library, so it sits in its own band rather
            than continuing the same column. */}
        <SectionBand className="mt-16">
          <SectionHeading eyebrow="On the day" title="How the test is delivered" />
          <Reveal>
            <Tilt glare={false}>
              <div className="card-solid p-6">
                <TickList
                  items={[
                    'Computer-delivered at a test centre, with a headset, microphone, keyboard and screen.',
                    'You speak your answers aloud while the prompt is on screen. Nothing is recorded by the candidate.',
                    'There is no scheduled break between the three parts; the next part starts as soon as the previous one ends.',
                    'Each section opens with an on-screen introduction and countdown, which count towards the section time.',
                    'All items are machine scored. Constructed speaking and writing responses are scored on content, form, oral fluency and pronunciation.',
                  ]}
                />
              </div>
            </Tilt>
          </Reveal>

          <SectionHeading className="mt-12" eyebrow="Questions" title="Frequently asked questions" />
          <Reveal variant="fade">
            <Accordion items={FAQ} />
          </Reveal>
        </SectionBand>

        <CtaBand
          title="Practice the format now"
          description={`A full mock on this site builds ${totalItems} items across all 22 types, in the real order, with the real section timings.`}
          actions={
            <>
              <ButtonLink to="/mock" size="lg" magnetic>Start a full mock</ButtonLink>
              <ButtonLink to="/practice" variant="secondary" size="lg">Practice one section</ButtonLink>
            </>
          }
        />
      </PageWrapper>
    </>
  )
}
