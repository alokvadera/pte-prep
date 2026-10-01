import { Link } from 'react-router-dom'
import { ALL_QUESTION_TYPES, QUESTION_META, SECTION_META } from '../domain/blueprint'
import { Seo } from '../seo/Seo'
import { CtaBand, PageHeading } from '../components/ui/primitives'
import { Breadcrumbs } from '../components/ui/Breadcrumbs'

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
    question: 'Do I need to practise the two new 2025 question types?',
    answer:
      'Yes. Summarize Group Discussion and Respond to a Situation are part of the current format and appear in the Speaking and Writing section. Summarize Group Discussion is scored on oral fluency, pronunciation and content, so the technique is the same as Re-tell Lecture at a larger scale: capture the skeleton, not the details.',
  },
  {
    question: 'Should I use the full two hours or is practice mode fine?',
    answer:
      'Use practice mode while you are learning question types, because it shows transcripts, tips and replays. Use exam conditions for at least every third attempt, because the thing being tested includes the clock and the fact that you cannot rewind the audio.',
  },
]

export default function Guide() {
  return (
    <>
      <Seo />

      <div className="page-shell-content">
        <Breadcrumbs trail={[{ name: 'Home', path: '/' }, { name: 'PTE tips' }]} className="mb-6" />

        <PageHeading
          eyebrow="Study guide"
          title="PTE strategies that move the score."
          description={<>Most advice is generic. Start with the changes that return the most marks, then explore techniques for all 22 types in the <Link to="/question-types/" className="text-brand-600 underline underline-offset-2 dark:text-brand-300">question type guide</Link>.</>}
        />

        <h2 className="section-title mt-16">The five highest-impact changes</h2>
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
            <li key={item.title} className="card flex gap-4">
              <span className="bg-mint-500 text-white grid size-7 shrink-0 place-items-center rounded-lg text-xs font-bold">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-ink-900 dark:text-white text-sm font-bold text-balance">{item.title}</h3>
                <p className="text-ink-500 dark:text-ink-300 mt-1.5 text-sm leading-relaxed">{item.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <h2 className="section-title mt-16">Technique by question type</h2>
        {(['speaking-writing', 'reading', 'listening'] as const).map((key) => (
          <section key={key} className="mt-10">
            <h3 className="text-ink-900 dark:text-white text-xl font-bold text-balance">{SECTION_META[key].longTitle}</h3>
            <div className="mt-4 space-y-3">
              {ALL_QUESTION_TYPES.filter((t) => QUESTION_META[t].section === key).map((t) => {
                const qm = QUESTION_META[t]
                return (
                  <article key={t} id={t} className="card scroll-mt-24">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h4 className="text-ink-900 dark:text-white text-sm font-bold text-balance">{qm.label}</h4>
                      <span className="pill bg-ink-100 text-ink-500 dark:bg-white/8 dark:text-ink-400">
                        {qm.perTest} per test · {qm.skills.join(' + ')}
                      </span>
                    </div>
                    <p className="text-ink-600 dark:text-ink-300 mt-2 text-sm leading-relaxed">{qm.tip}</p>
                  </article>
                )
              })}
            </div>
          </section>
        ))}

        <h2 className="section-title mt-16">Under time pressure</h2>
        <ul className="mt-5 space-y-3">
          {[
            'Never leave a single-answer question blank. A guess is free; a blank is zero.',
            'In Fill in the Blanks, decide the word class first, then the word. Options change between noun, verb, adjective and adverb, and the class is usually given away by the article or ending.',
            'On the table completion, work down a column rather than across a row so you stay in one part of the passage.',
            'Do the listening items in order. The recordings are short and the momentum matters more than doubling back.',
            'Write the essay in the last 20 minutes of Part 1 whatever happens. An unwritten essay is a guaranteed zero on a whole trait group.',
            'If you run out of time in a section, the clock does not stop. Submit rather than leaving blanks, because the next section still counts.',
          ].map((tip) => (
            <li key={tip} className="text-ink-600 dark:text-ink-200 flex gap-3 leading-relaxed">
              <span className="bg-brand-500 dark:bg-brand-300 mt-2 size-1.5 shrink-0 rounded-full" aria-hidden="true" />
              {tip}
            </li>
          ))}
        </ul>

        <h2 className="section-title mt-16">A four-week study plan</h2>
        <div className="card mt-5 overflow-x-auto p-0">
          <table className="w-full min-w-lg border-collapse text-left text-sm">
            <caption className="sr-only">Four week PTE preparation plan</caption>
            <thead>
              <tr className="border-ink-200 dark:border-white/10 border-b">
                {['Week', 'Focus', 'Daily practice', 'Mock test'].map((h) => (
                  <th key={h} scope="col" className="text-ink-500 dark:text-ink-400 px-4 py-3 text-xs font-bold tracking-wider uppercase">
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
                  <td className="text-ink-900 dark:text-white px-4 py-3 font-bold">{row[0]}</td>
                  <td className="text-ink-700 dark:text-ink-200 px-4 py-3">{row[1]}</td>
                  <td className="text-ink-500 dark:text-ink-400 px-4 py-3">{row[2]}</td>
                  <td className="text-ink-500 dark:text-ink-400 px-4 py-3">{row[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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
          title="Apply it to a real paper"
          description="Reading this page is worth less than one scored attempt. Find out what these techniques actually do to your score."
          actions={
            <>
              <Link to="/mock" className="btn-primary px-6 py-3">
                Start a full mock
              </Link>
              <Link to="/practice" className="btn-secondary px-5 py-3">
                Drill a weak type
              </Link>
            </>
          }
        />
      </div>
    </>
  )
}
