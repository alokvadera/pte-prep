import { ALL_QUESTION_TYPES } from '../domain/blueprint'
import { manifestBankCapacity } from '../content/manifest'
import { ABOUT_FAQ } from '../content/faq'
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

/* FAQ copy is shared with the structured-data block in seo/meta.ts. */

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
            `Draws on a bank of ${capacity}+ distinct items — original academic passages, lectures, conversations, group discussions and data charts — for a broad mix of practice material across attempts.`,
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
              Because there is nothing to charge for. The test runs locally in your browser, so
              serving candidates primarily requires static file delivery. Listening audio clips are
              served statically with device speech synthesis as an offline fallback. Practice
              history lives in your browser by default, with optional cloud sync and optional BYOK
              AI scoring for candidates who choose them.
            </p>

            <SectionHeading
              className="mt-10"
              eyebrow="Your data"
              title="How your data is handled"
            />
            <TickList
              className="mt-5"
              tone="mint"
              items={[
                'Answers, settings and score history are stored in IndexedDB and localStorage on your device by default.',
                'Optional cloud sync securely backs up your attempt history to Cloudflare D1 so you can switch devices.',
                'When enabled with a Groq key, the optional AI Examiner sends speaking recordings for transcription when you stop recording. It sends constructed responses for approximate grading only when requested. Your personal key stays in local browser storage.',
                'Recorded microphone audio is evaluated for oral fluency and discarded — raw audio is never permanently saved to disk.',
                'Clearing site data in your browser deletes local attempts and settings; cloud attempts can be deleted anytime from the dashboard.',
              ]}
            />
          </SectionBand>
        </Reveal>

        <SectionHeading className="mt-12 sm:mt-14" eyebrow="Scoring" title="How the scores work" />
        <p className="text-ink-600 dark:text-ink-200 mt-4 leading-relaxed">
          Multiple choice, fill in the blanks, re-order paragraphs and highlight-the-incorrect-words
          are marked against the answer key, including partial credit per blank and deductions for
          wrong multi-selections. Speaking and writing are different: Pearson scores those with a
          proprietary model, so this site applies a transparent rubric over the same four constructs
          — content, form, oral fluency and pronunciation — using signals a browser can measure
          directly. The full method, including the raw-to-scale conversion, is documented on the
          scoring page.
        </p>
        <Reveal variant="up" duration={500}>
          <Callout className="mt-5" tone="amber" label="Read it as a trend, not a prediction">
            Treat the estimate as a relative measure of your own progress, not a prediction of your
            official result. It is most accurate on objective items and least accurate on speaking
            tasks recorded without a transcript.
          </Callout>
        </Reveal>

        <SectionHeading
          className="mt-12 sm:mt-14"
          eyebrow="Legal"
          title="Independence and trademarks"
        />
        <p className="text-ink-600 dark:text-ink-200 mt-4 leading-relaxed">
          PTE Academic and the PTE logo are trademarks of Pearson Education Ltd. This is an
          independent practice tool and is not affiliated with, endorsed by, sponsored by or
          approved by Pearson. All practice material on this site is original and was written for
          it. It is not official practice material and should not be treated as a representation of
          the real exam.
        </p>

        <SectionHeading
          className="mt-12 sm:mt-14"
          eyebrow="Questions"
          title="Frequently asked questions"
        />
        <Reveal variant="up" duration={500}>
          <Accordion items={ABOUT_FAQ} />
        </Reveal>

        <Reveal variant="up" delay={50} duration={500}>
          <div className="mt-10 flex flex-wrap gap-3">
            <ButtonLink to="/mock" size="lg" magnetic>
              Start a free mock test
            </ButtonLink>
            <ButtonLink to="/format" variant="secondary" size="lg">
              PTE test format
            </ButtonLink>
          </div>
        </Reveal>
      </PageWrapper>
    </>
  )
}
