import { Link } from 'react-router-dom'
import { ALL_QUESTION_TYPES, MOCK_BLUEPRINT, QUESTION_META, SECTION_META } from '../domain/blueprint'
import { typeSlug } from '../content/questionTypeDetail'
import { Seo } from '../seo/Seo'
import {
  Accordion,
  Badge,
  ButtonLink,
  Callout,
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
            <ButtonLink to="/mock">Start mock test</ButtonLink>
            <ButtonLink to="/practice" variant="secondary">Practice by skill</ButtonLink>
          </div>
        }
      >
        <div className="-mt-4 mb-8 flex flex-wrap gap-2">
          {(['speaking-writing', 'reading', 'listening'] as const).map((key) => (
            <a key={key} href={`#${key}`} className="btn-secondary px-3 py-1.5 text-xs">
              {SECTION_META[key].longTitle}
            </a>
          ))}
          <a href="#weightage" className="btn-secondary px-3 py-1.5 text-xs">
            Score weightage & priority matrix ↓
          </a>
          <Link to="/scoring" className="btn-secondary px-3 py-1.5 text-xs">
            How scoring works →
          </Link>
          <Link to="/question-types/" className="btn-secondary px-3 py-1.5 text-xs">
            All 22 question guides →
          </Link>
        </div>

        <SectionHeading className="mt-8" eyebrow="At a glance" title="The three sections" />
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
                    <td className="text-ink-500 dark:text-ink-400">{meta.title}</td>
                    <td className="text-ink-900 dark:text-white font-semibold">{meta.longTitle}</td>
                    <td className="text-ink-700 dark:text-ink-200 whitespace-nowrap tabular-nums">
                      {meta.weightNote}
                    </td>
                    <td className="text-ink-500 dark:text-ink-400 tabular-nums">{types.length}</td>
                    <td className="text-ink-500 dark:text-ink-400 capitalize">{meta.skill}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </Card>
        </Reveal>
        <p className="text-ink-500 dark:text-ink-400 mt-3 text-sm">
          The minimum and maximum times do not add up to a fixed total because each test version is balanced for length.
          No candidate receives either extreme.
        </p>

        <Reveal className="mt-12">
          <Tilt glare={false}>
        <Callout label="2025 Update" className="p-6">
          <h2 className="text-ink-900 dark:text-white text-base font-bold text-balance">Two new question types added</h2>
          <p className="text-ink-600 dark:text-ink-300 mt-3 text-sm leading-relaxed">
            Pearson added two item types in August 2025, bringing the total to 22. <strong className="text-ink-900 dark:text-white">Summarize Group Discussion</strong> plays a recorded exchange between three or four speakers and asks you to summarise the group's position in your own words. <strong className="text-ink-900 dark:text-white">Respond to a Situation</strong> describes a scenario and asks you to deliver an appropriate spoken response. Both sit in Part 1 and are scored on oral fluency, pronunciation and content.
          </p>
        </Callout>
          </Tilt>
        </Reveal>

        <ScoreWeightageMatrix />

        <SectionHeading className="mt-16" eyebrow="The library" title="All 22 question types" />

        {(['speaking-writing', 'reading', 'listening'] as const).map((key) => {
          const meta = SECTION_META[key]
          const types = ALL_QUESTION_TYPES.filter((t) => QUESTION_META[t].section === key)
          return (
            <section key={key} id={key} className="mt-12 scroll-mt-24">
              <div className="border-ink-200 dark:border-white/10 border-t pt-8">
                <h3 className="text-ink-900 dark:text-white text-xl font-bold text-balance">
                  {meta.title} · {meta.longTitle}
                </h3>
                <p className="text-ink-500 dark:text-ink-300 mt-2 text-sm leading-relaxed">{meta.blurb}</p>
                <p className="text-ink-500 dark:text-ink-400 mt-1 font-mono text-xs">
                  {types.length} types · {meta.weightNote}
                </p>
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
                            <span className="text-ink-500 dark:text-ink-400 mr-2 tabular-nums">{i + 1}.</span>
                            <Link
                              to={`/question-types/${slug}/`}
                              className="hover:text-brand-600 dark:hover:text-brand-400 hover:underline -m-1 inline-flex min-h-6 items-center rounded-sm px-1"
                            >
                              {qm.label}
                            </Link>
                          </h4>
                          <span className="flex flex-wrap gap-1.5">
                            <Badge tone="neutral">{qm.perTest} per test</Badge>
                            <Badge tone="brand">{qm.skills.join(' + ')}</Badge>
                          </span>
                        </div>
                        <p className="text-ink-600 dark:text-ink-300 mt-2.5 text-sm leading-relaxed">{qm.tip}</p>
                      </div>
                      <div className="border-ink-100 dark:border-white/6 mt-4 flex flex-wrap items-center gap-4 border-t pt-2.5 text-xs">
                        <Link
                          to={`/practice?type=${t}`}
                          className="text-brand-600 dark:text-brand-300 font-medium hover:underline -m-1 inline-flex min-h-6 items-center rounded-sm px-1"
                        >
                          Practice this type →
                        </Link>
                        <Link
                          to={`/question-types/${slug}/`}
                          className="text-ink-500 dark:text-ink-400 hover:text-ink-900 dark:hover:text-white -m-1 inline-block rounded-sm px-1 py-1 transition-colors"
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
              <ButtonLink to="/mock" size="lg">Start a full mock</ButtonLink>
              <ButtonLink to="/practice" variant="secondary" size="lg">Practice one section</ButtonLink>
            </>
          }
        />
      </PageWrapper>
    </>
  )
}
