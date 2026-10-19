import { Link } from 'react-router-dom'
import { Seo } from '../seo/Seo'
import { Breadcrumbs } from '../components/ui/Breadcrumbs'
import { PageWrapper, SectionHeading } from '../components/ui/primitives'
import { Reveal } from '../components/ui/motion'

const SECTIONS = [
  {
    eyebrow: 'Storage',
    heading: 'What this site stores',
    body: [
      'Everything you do here stays on your device by default. Practice attempts, your answers, and your score history are written to IndexedDB in your own browser. Local browser storage (localStorage) retains your app preferences, active test progress, and session token if you sign in.',
      'If you create an optional cloud account, your email address, password hash (PBKDF2), and attempt records are securely synchronized to Cloudflare D1 storage so your progress is available across devices. You can delete individual attempts or clear your entire history at any time from the dashboard.',
      'Clearing site data in your browser deletes local attempts, settings, and credentials permanently.',
    ],
  },
  {
    eyebrow: 'No tracking',
    heading: 'What this site does not do',
    body: [
      'There is no analytics script, no advertising tag, no session recording, and no tracking pixels on any page. The site sets no tracking cookies and does not sell or share personal data with advertisers or data brokers.',
      'Fonts are served directly from this origin rather than a third-party CDN, preventing external services from logging which pages you browse.',
    ],
  },
  {
    eyebrow: 'Audio',
    heading: 'Audio and speech',
    body: [
      'Listening items are served as static audio files from our origin, with on-device speech synthesis available as an offline fallback when disconnected.',
      'Speaking items are recorded via your microphone. When browser speech recognition is enabled, speech recognition uses your browser\u2019s native speech engine (such as Google speech services in Chrome). Raw audio recorded for fluency analysis is processed in-memory and discarded — it is never permanently saved to disk.',
    ],
  },
  {
    eyebrow: 'AI Examiner',
    heading: 'Optional AI grading (Groq BYOK)',
    body: [
      'If you choose to enable the AI Examiner, you provide your own Groq API key (Bring-Your-Own-Key). Your key is stored solely in your browser\u2019s local storage and is never transmitted to our servers.',
      'When you request AI grading, your written responses or spoken audio clips are sent directly from your browser to Groq\u2019s secure API (api.groq.com) using Llama 3.3 for rubric assessment and Whisper Turbo for speech transcription. Groq processes these requests in accordance with their developer API privacy terms.',
    ],
  },
  {
    eyebrow: 'Children',
    heading: 'Children\u2019s Privacy',
    body: [
      'This is an exam preparation tool for students and adults preparing for academic and visa entrance tests. We do not knowingly collect personal information from children under the age of 16.',
    ],
  },
  {
    eyebrow: 'Changes',
    heading: 'Changes to this policy',
    body: [
      'If this site changes in a way that alters what is stored or where data is sent, this page and the summary in the site footer will be updated in the same change.',
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
            <Reveal
              key={s.heading}
              variant="up"
              delay={Math.min(i, 4) * 60}
              duration={500}
            >
              <section
                className={
                  i > 0 ? 'border-ink-200 dark:border-white/10 mt-10 border-t pt-10 sm:mt-12 sm:pt-12' : undefined
                }
              >
                <SectionHeading eyebrow={s.eyebrow} title={s.heading} />
                {s.body.map((p, pIdx) => (
                  <p key={pIdx} className="text-ink-600 dark:text-ink-200 mt-3 leading-relaxed">
                    {p}
                  </p>
                ))}
              </section>
            </Reveal>
          ))}
        </div>

        <Reveal variant="up" delay={100} duration={500}>
          <p className="text-ink-500 dark:text-ink-on-dark-muted mt-16 border-t pt-6 text-sm leading-relaxed">
          Questions about how the practice scoring works are answered on the{' '}
          <Link to="/about" className="link-inline">
            about page
          </Link>
          . PTE Academic and the PTE logo are trademarks of Pearson Education Ltd. This is an independent practice tool
          and is not affiliated with Pearson.
          </p>
        </Reveal>
      </PageWrapper>
    </>
  )
}
