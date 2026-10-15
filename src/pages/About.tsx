import { ALL_QUESTION_TYPES } from '../domain/blueprint'
import { manifestBankCapacity } from '../content/manifest'
import { Seo } from '../seo/Seo'
import {
  Accordion,
  ButtonLink,
  Callout,
  KeyFigure,
  PageWrapper,
  SectionBand,
  SectionHeading,
  TickList,
} from '../components/ui/primitives'
import { Breadcrumbs } from '../components/ui/Breadcrumbs'
import { Reveal } from '../components/ui/motion'

const FAQ = [
  {
    question: 'Is this site affiliated with Pearson?',
    answer:
      'No. PTE Academic is a trademark of Pearson Education Ltd, and this is an independent practice tool with no affiliation, endorsement or sponsorship. It is not a source of official practice material.',
  },
  {
    question: 'Where does the practice material come from?',
    answer:
      'Every passage, lecture, conversation and chart on this site was written specifically for it, at the same academic level, word count and style as the real test. That avoids copyright problems and means the difficulty and timing are deliberately matched to the real test.',
  },
  {
    question: 'Where is my data stored?',
    answer:
      'In your browser, on your own device, using IndexedDB. Your responses, recordings and score history stay on the machine by default, with no analytics on your answers. An optional cloud account can sync copies across devices. Clearing site data in your browser deletes the local copy.',
  },
  {
    question: 'Is it really free, and why?',
    answer:
      'Yes, with no limits. The whole test runs client-side, which means there is no per-user infrastructure cost to pass on, so a free hosting tier covers it indefinitely. The audio is synthesised by your own device rather than streamed from a server, which is the main reason there is no audio hosting cost either.',
  },
  {
    question: 'Can I use this offline?',
    answer:
      'Yes. The app is cached as an installable progressive web app, and the recordings are generated locally by the speech synthesiser built into macOS, Windows, iOS and Android. Once the page has loaded once, core practice works with no connection; browser speech recognition and cloud sync need a connection when you use them.',
  },
  {
    question: 'Why are the scores only estimates?',
    answer:
      'Objective items are scored exactly. Speaking and writing are scored by Pearson using a proprietary automated model, with human reviewers used to quality-monitor it, which cannot be reproduced outside their scoring system — so this site applies a documented rubric over the same four PTE constructs. Every result is labelled as an estimate, and each item is marked as auto-scored or estimated.',
  },
]

export default function About() {
  const capacity = manifestBankCapacity()

  return (
    <>
      <Seo />

      <PageWrapper
        breadcrumbs={<Breadcrumbs trail={[{ name: 'Home', path: '/' }, { name: 'About' }]} />}
        eyebrow="About this tool"
        title="Free practice, with nothing hidden."
        description="Most free PTE practice is a handful of questions and an email form. This one is built to be useful on its own."
      >
        <SectionHeading className="mt-8 sm:mt-10" eyebrow="The tool" title="What it does" />
        <TickList
          items={[
            `Builds full-length PTE Academic mock tests covering all ${ALL_QUESTION_TYPES.length} official question types, in the order the real test uses them.`,
            `Draws on a bank of ${capacity}+ distinct items — original academic passages, lectures, conversations, group discussions and data charts — so repeated attempts do not repeat content.`,
            'Reproduces the real section structure: an unscored personal introduction, then Speaking and Writing, Reading and Listening, each with its own clock.',
            'Scores objective items exactly and constructed responses with a documented rubric, then shows per-item feedback explaining where each lost point came from.',
            'Stores attempt history on your own device and shows trends by skill and by question type.',
          ]}
        />

        <Reveal variant="up" duration={500}>
          <KeyFigure
            className="mt-8"
            value={`${capacity}+`}
            label="distinct practice items"
            note={`Across all ${ALL_QUESTION_TYPES.length} official question types, drawn in the order the real test uses them.`}
          />
        </Reveal>

        {/* The two trust sections sit in one band: "there is nothing to charge
            for" and "here is what happens to your data" are the same argument,
            and separating them at the shell's width made the page read as one
            undifferentiated column of prose. */}
        <Reveal variant="up" delay={60} duration={550}>
          <SectionBand className="mt-12 sm:mt-14">
          <SectionHeading eyebrow="Cost" title="Why it is free" />
          <p className="text-ink-600 dark:text-ink-200 mt-4 leading-relaxed">
            Because there is nothing to charge for. The entire test runs in your browser, so serving one more candidate
          costs a static file request. The listening and speaking audio is generated by your own device using the speech
          synthesiser built into the operating system, rather than streamed as audio files. There is no database to
          operate, no account system to secure, and no model to run per answer. What remains is a static site, which any
          free hosting tier covers without limits.
          </p>

          <SectionHeading className="mt-10" eyebrow="Your data" title="How your data is handled" />
          <TickList
            className="mt-5"
            tone="mint"
            items={[
              'Answers, recordings and score history are stored in IndexedDB in your browser.',
              'Nothing is uploaded. There is no backend receiving your responses.',
              'Recorded audio is analysed in the page for the fluency estimate and then discarded — raw audio is never persisted.',
              'Clearing your browser data for this site deletes everything permanently.',
            ]}
          />
          </SectionBand>
        </Reveal>

        <SectionHeading className="mt-12 sm:mt-14" eyebrow="Scoring" title="How the scores work" />
        <p className="text-ink-600 dark:text-ink-200 mt-4 leading-relaxed">
          Multiple choice, fill in the blanks, re-order paragraphs and highlight-the-incorrect-words are marked against the
          answer key, including partial credit per blank and deductions for wrong multi-selections. Speaking and writing
          are different: Pearson scores those with a proprietary model, so this site applies a transparent rubric over the
          same four constructs — content, form, oral fluency and pronunciation — using signals a browser can measure
          directly. The full method, including the raw-to-scale conversion, is documented on the scoring page.
        </p>
        <Reveal variant="up" duration={500}>
          <Callout className="mt-5" tone="amber" label="Read it as a trend, not a prediction">
        Treat the estimate as a relative measure of your own progress, not a prediction of your official result. It is
        most accurate on objective items and least accurate on speaking tasks recorded without a transcript.
        </Callout>
        </Reveal>

        <SectionHeading className="mt-12 sm:mt-14" eyebrow="Legal" title="Independence and trademarks" />
        <p className="text-ink-600 dark:text-ink-200 mt-4 leading-relaxed">
          PTE Academic and the PTE logo are trademarks of Pearson Education Ltd. This is an independent practice tool
          and is not affiliated with, endorsed by, sponsored by or approved by Pearson. All practice material on this site
          is original and was written for it. It is not official practice material and should not be treated as a
          representation of the real exam.
        </p>

        <SectionHeading className="mt-12 sm:mt-14" eyebrow="Questions" title="Frequently asked questions" />
        <Reveal variant="up" duration={500}>
          <Accordion items={FAQ} />
        </Reveal>

        <Reveal variant="up" delay={50} duration={500}>
          <div className="mt-10 flex flex-wrap gap-3">
            <ButtonLink to="/mock" size="lg" magnetic>Start a free mock test</ButtonLink>
            <ButtonLink to="/format" variant="secondary" size="lg">PTE test format</ButtonLink>
          </div>
        </Reveal>
      </PageWrapper>
    </>
  )
}
