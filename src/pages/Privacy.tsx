import { Link } from 'react-router-dom'
import { Seo } from '../seo/Seo'
import { Breadcrumbs } from '../components/ui/Breadcrumbs'
import { PageWrapper, SectionHeading } from '../components/ui/primitives'

const SECTIONS = [
  {
    eyebrow: 'Storage',
    heading: 'What this site stores',
    body: [
      'Everything you do here stays on your device by default. Practice attempts, your answers, your recordings and your score history are written to IndexedDB in your own browser. They are never uploaded unless you create an optional cloud account, which syncs copies to Cloudflare storage so your history follows you across devices.',
      'Clearing site data in your browser deletes all of it permanently. Because there is no copy on any server, that deletion cannot be undone by anyone, including us.',
    ],
  },
  {
    eyebrow: 'No tracking',
    heading: 'What this site does not do',
    body: [
      'There is no analytics script, no advertising tag, no session recording and no third party embed on any page. There is no cookie banner because the site sets no cookies and no comparable storage beyond the local database described above.',
      'Fonts are served from this origin rather than a font CDN, precisely so that loading a page does not tell a third party which pages you are reading.',
    ],
  },
  {
    eyebrow: 'Audio',
    heading: 'Audio and speech',
    body: [
      'Listening items are spoken by the speech synthesiser already built into your operating system. The audio is generated on your device as you play it; no audio file is fetched from a server.',
      'Speaking items are recorded using your microphone. Where your browser offers speech recognition, transcription uses the browser\u2019s speech service — in Chrome this sends audio to Google\u2019s servers for recognition, so a transcribed take is not fully on-device. Recorded audio itself is held in memory or in your local database and is discarded when you clear site data. Typing your answer instead keeps everything local.',
    ],
  },
  {
    eyebrow: 'Children',
    heading: 'Children',
    body: [
      'This is a practice tool for adults preparing for a university entrance test. It does not knowingly collect information from anyone, because it does not collect information at all.',
    ],
  },
  {
    eyebrow: 'Changes',
    heading: 'Changes to this policy',
    body: [
      'If this site ever changes in a way that alters what is stored or where it is sent, this page and the summary in the site footer will be updated in the same change. The claims elsewhere on this site that no data leaves your device are part of the product, not a policy you can opt out of, so they are tested by the automated checks that run on every build.',
    ],
  },
]

export default function Privacy() {
  return (
    <>
      <Seo />

      <PageWrapper
        breadcrumbs={<Breadcrumbs trail={[{ name: 'Home', path: '/' }, { name: 'Privacy' }]} />}
        eyebrow="Your data"
        title="Privacy"
        description="This site stores everything locally by default, with no analytics. An optional cloud account can sync your history across devices."
      >

        {/* A rule above every section after the first. On a page that is nothing
            but prose, the rule is the only thing telling the reader where one
            claim ends and the next begins. */}
        <div className="mt-8">
          {SECTIONS.map((s, i) => (
            <section
              key={s.heading}
              className={
                i > 0 ? 'border-ink-200 dark:border-white/10 mt-10 border-t pt-10 sm:mt-12 sm:pt-12' : undefined
              }
            >
              <SectionHeading eyebrow={s.eyebrow} title={s.heading} />
              {s.body.map((p) => (
                <p key={p.slice(0, 32)} className="text-ink-600 dark:text-ink-200 mt-3 leading-relaxed">
                  {p}
                </p>
              ))}
            </section>
          ))}
        </div>

        <p className="text-ink-500 dark:text-ink-400 mt-16 border-t pt-6 text-sm leading-relaxed">
          Questions about how the practice scoring works are answered on the{' '}
          <Link to="/about" className="link-inline">
            about page
          </Link>
          . PTE Academic and the PTE logo are trademarks of Pearson Education Ltd. This is an independent practice tool
          and is not affiliated with Pearson          .
        </p>
      </PageWrapper>
    </>
  )
}
