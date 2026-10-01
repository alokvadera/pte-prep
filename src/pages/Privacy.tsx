import { Link } from 'react-router-dom'
import { Seo } from '../seo/Seo'
import { Breadcrumbs } from '../components/ui/Breadcrumbs'
import { PageWrapper } from '../components/ui/primitives'

const SECTIONS = [
  {
    heading: 'What this site stores',
    body: [
      'Everything you do here stays on your device. Practice attempts, your answers, your recordings and your score history are written to IndexedDB in your own browser. They are never uploaded, and there is no account that could hold them elsewhere.',
      'Clearing site data in your browser deletes all of it permanently. Because there is no copy on any server, that deletion cannot be undone by anyone, including us.',
    ],
  },
  {
    heading: 'What this site does not do',
    body: [
      'There is no analytics script, no advertising tag, no session recording and no third party embed on any page. There is no cookie banner because the site sets no cookies and no comparable storage beyond the local database described above.',
      'Fonts are served from this origin rather than a font CDN, precisely so that loading a page does not tell a third party which pages you are reading.',
    ],
  },
  {
    heading: 'Audio and speech',
    body: [
      'Listening items are spoken by the speech synthesiser already built into your operating system. The audio is generated on your device as you play it; no audio file is fetched from a server.',
      'Speaking items are recorded using your microphone, and where your browser offers speech recognition, the transcription is produced locally by the browser. Recorded audio is held in memory or in your local database and is discarded when you clear site data.',
    ],
  },
  {
    heading: 'Children',
    body: [
      'This is a practice tool for adults preparing for a university entrance test. It does not knowingly collect information from anyone, because it does not collect information at all.',
    ],
  },
  {
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
        description="This site has no server side database, account system or analytics. Everything you do stays in your browser."
      >

        <div className="mt-8 space-y-12">
          {SECTIONS.map((s) => (
            <section key={s.heading}>
              <h2 className="section-title">{s.heading}</h2>
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
          <Link to="/about" className="text-brand-600 dark:text-brand-300 underline underline-offset-2">
            about page
          </Link>
          . PTE Academic and the PTE logo are trademarks of Pearson Education Ltd. This is an independent practice tool
          and is not affiliated with Pearson          .
        </p>
      </PageWrapper>
    </>
  )
}
