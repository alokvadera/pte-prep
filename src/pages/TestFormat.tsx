import { Link } from 'react-router-dom'
import { ALL_QUESTION_TYPES, MOCK_BLUEPRINT, QUESTION_META, SECTION_META } from '../domain/blueprint'
import { Seo } from '../seo/Seo'
import { Badge, CtaBand, PageHeading } from '../components/ui/primitives'
import { Breadcrumbs } from '../components/ui/Breadcrumbs'

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
    question: 'What changed in the PTE Academic in 2025?',
    answer:
      'Pearson added two new item types in August 2025: Summarize Group Discussion, which asks you to listen to a multi-speaker exchange and give an oral summary, and Respond to a Situation, which asks for a spoken response to a described context. The format is now nine Speaking and Writing types, five Reading types and eight Listening types.',
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

      <div className="page-shell-content">
        <Breadcrumbs trail={[{ name: 'Home', path: '/' }, { name: 'PTE test format' }]} className="mb-6" />

        <PageHeading
          eyebrow="PTE test format"
          title="One test, three timed sections."
          description="Explore the current Academic format, how each section is arranged, and what changed with the two added question types."
        />

        <div className="mt-6 flex flex-wrap gap-2">
          <Link to="/mock" className="btn-primary">
            Practise this format
          </Link>
          <Link to="/scoring" className="btn-secondary">
            How scoring works →
          </Link>
          <Link to="/question-types/" className="btn-secondary">
            All 22 question types →
          </Link>
        </div>

        <h2 className="section-title mt-16 scroll-mt-24">The three sections at a glance</h2>
        <div className="card mt-5 overflow-x-auto p-0">
          <table className="w-full min-w-lg border-collapse text-left text-sm">
            <caption className="sr-only">PTE Academic sections, durations and scored skill</caption>
            <thead>
              <tr className="border-ink-200 dark:border-white/10 border-b">
                {['Part', 'Section', 'Duration', 'Types', 'Scored skill'].map((h) => (
                  <th key={h} scope="col" className="text-ink-500 dark:text-ink-400 px-4 py-3 text-xs font-bold tracking-wider uppercase">
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
                    <td className="text-ink-500 dark:text-ink-400 px-4 py-3">{meta.title}</td>
                    <td className="text-ink-900 dark:text-white px-4 py-3 font-semibold">{meta.longTitle}</td>
                    <td className="text-ink-700 dark:text-ink-200 px-4 py-3 whitespace-nowrap tabular-nums">
                      {meta.weightNote}
                    </td>
                    <td className="text-ink-500 dark:text-ink-400 px-4 py-3 tabular-nums">{types.length}</td>
                    <td className="text-ink-500 dark:text-ink-400 px-4 py-3 capitalize">{meta.skill}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="text-ink-500 dark:text-ink-400 mt-3 text-sm">
          The minimum and maximum times do not add up to a fixed total because each test version is balanced for length.
          No candidate receives either extreme.
        </p>

        <h2 className="section-title mt-16">What changed in 2025</h2>
        <p className="text-ink-600 dark:text-ink-200 mt-4 leading-relaxed">
          Pearson added two item types in August 2025, bringing the total to 22.{' '}
          <strong className="text-ink-900 dark:text-white">Summarize Group Discussion</strong> plays a recorded exchange
          between three or four speakers and asks you to summarise the group's position in your own words.
          <strong className="text-ink-900 dark:text-white"> Respond to a Situation</strong> describes a scenario and
          asks you to deliver an appropriate spoken response. Both sit in Part 1 and are scored on oral fluency,
          pronunciation and content.
        </p>

        <h2 className="section-title mt-16">All 22 question types</h2>

        {(['speaking-writing', 'reading', 'listening'] as const).map((key) => {
          const meta = SECTION_META[key]
          const types = ALL_QUESTION_TYPES.filter((t) => QUESTION_META[t].section === key)
          return (
            <section key={key} className="mt-10">
              <h3 className="text-ink-900 dark:text-white text-xl font-bold text-balance">
                Part {meta.title.replace('Part ', '')} · {meta.longTitle}
              </h3>
              <p className="text-ink-500 dark:text-ink-300 mt-2 text-sm leading-relaxed">{meta.blurb}</p>

              <ol className="mt-5 space-y-3">
                {types.map((t, i) => {
                  const qm = QUESTION_META[t]
                  return (
                    <li key={t} id={t} className="card scroll-mt-24">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h4 className="text-ink-900 dark:text-white text-sm font-bold text-balance">
                          <span className="text-ink-500 dark:text-ink-400 mr-2 tabular-nums">{i + 1}.</span>
                          {qm.label}
                        </h4>
                        <span className="flex flex-wrap gap-1.5">
                          <Badge tone="neutral">{qm.perTest} per test</Badge>
                          <Badge tone="brand">{qm.skills.join(' + ')}</Badge>
                        </span>
                      </div>
                      <p className="text-ink-600 dark:text-ink-300 mt-2 text-sm leading-relaxed">{qm.tip}</p>
                    </li>
                  )
                })}
              </ol>
            </section>
          )
        })}

        <h2 className="section-title mt-16">How the test is delivered</h2>
        <ul className="mt-5 space-y-3">
          {[
            'Computer-delivered at a test centre, with a headset, microphone, keyboard and screen.',
            'You speak your answers aloud while the prompt is on screen. Nothing is recorded by the candidate.',
            'There is no scheduled break between the three parts; the next part starts as soon as the previous one ends.',
            'Each section opens with an on-screen introduction and countdown, which count towards the section time.',
            'All items are machine scored. Constructed speaking and writing responses are scored on content, form, oral fluency and pronunciation.',
          ].map((point) => (
            <li key={point} className="text-ink-600 dark:text-ink-200 flex gap-3 leading-relaxed">
              <span className="bg-brand-500 dark:bg-brand-300 mt-2 size-1.5 shrink-0 rounded-full" aria-hidden="true" />
              {point}
            </li>
          ))}
        </ul>

        <h2 className="section-title mt-16">Frequently asked questions</h2>
        <div className="mt-6 space-y-3">
          {FAQ.map((f) => (
            <details key={f.question} className="card group">
              <summary className="text-ink-900 dark:text-white flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                {f.question}
                <span className="text-ink-500 group-open:rotate-45 grid size-7 shrink-0 place-items-center rounded-md bg-ink-50 dark:bg-white/8 text-lg leading-none" aria-hidden="true">
                  +
                </span>
              </summary>
              <p className="text-ink-500 dark:text-ink-300 mt-3 border-t pt-3 text-sm leading-relaxed">{f.answer}</p>
            </details>
          ))}
        </div>

        <CtaBand
          title="Practise the format now"
          description={`A full mock on this site builds ${totalItems} items across all 22 types, in the real order, with the real section timings.`}
          actions={
            <>
              <Link to="/mock" className="btn-primary px-6 py-3">
                Start a full mock
              </Link>
              <Link to="/practice" className="btn-secondary px-5 py-3">
                Practise one section
              </Link>
            </>
          }
        />
      </div>
    </>
  )
}
