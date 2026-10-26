import { useEffect, useState } from 'react'
import {
  PageWrapper,
  SectionHeading,
  Card,
  CardTitle,
  Button,
  ButtonLink,
  Badge,
  Stat,
  Callout,
  KeyFigure,
  TickList,
  NumMarker,
  ProgressBar,
  Toggle,
  Accordion,
  Disclosure,
  CtaBand,
} from '../components/ui/primitives'
import {
  Reveal,
  CountUp,
  Tilt,
  Magnetic,
  Float,
  ParallaxVisual,
  ScrollVelocity,
  TextReveal,
  TextScramble,
  Marquee,
  AuroraBackground,
  DottedGlowBackground,
  SpotlightCard,
  ShimmerButton,
  FlipCard,
  Tabs,
  ScrollDownIndicator,
  CountdownRing,
  Sparkline,
  RadialProgress,
  ActivityHeatmap,
  StreakWidget,
  AchievementBadges,
  ConfettiBurst,
  PulseDot,
  Skeleton,
  CardSkeleton,
  Separator,
  Tooltip,
  HoverCard,
  Popover,
  Dialog,
  AlertDialog,
  Kbd,
  Slider,
  SectionDivider,
  ScoreCalculator,
  ColourfulText,
  StickyCTA,
  OrbitingCircles,
  NumberTicker,
  WordRotate,
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
  AnimatedShinyText,
  ShineBorder,
  IconTile,
  RenderType,
  ScoreScale,
} from '../components/ui'
import type { AttemptRecord } from '../domain/types'
import { ScoreRangeBar } from '../components/charts/ScoreRangeBar'
import { useToast } from '../components/ui/use-toast'
import { Stepper } from '../components/ui/stepper'
import { Breadcrumbs } from '../components/ui/Breadcrumbs'
import { Avatar } from '../components/ui/avatar'
import { useClientReady } from '../lib/useClientReady'
import { Seo } from '../seo/Seo'

/* ---------------------------------------------------------------------------
   A living catalogue of every UI element in the mock. Each section
   renders the component as it is meant to be used, so a visitor can
   see the whole vocabulary in one place and copy the shape into a page.
--------------------------------------------------------------------------- */

const DEMO_ATTEMPTS: AttemptRecord[] = [
  {
    id: 'demo-1',
    mockId: 'full-1',
    mockTitle: 'Full Mock Test 1',
    mockKind: 'full',
    mode: 'exam',
    startedAt: '2026-10-01T10:00:00Z',
    finishedAt: '2026-10-01T12:00:00Z',
    durationMs: 7200000,
    seed: 1234,
    sectionIds: ['speaking-writing', 'reading', 'listening'],
    responses: {},
    availablePoints: 90,
    earnedPoints: 68,
    skillScores: { speaking: 70, writing: 65, reading: 68, listening: 67 },
    overallIsEstimate: true,
    overallScore: 68,
    cefr: 'B2',
    completedItemIds: [],
    breakdown: {},
  },
  {
    id: 'demo-2',
    mockId: 'full-2',
    mockTitle: 'Full Mock Test 2',
    mockKind: 'full',
    mode: 'exam',
    startedAt: '2026-10-05T10:00:00Z',
    finishedAt: '2026-10-05T12:00:00Z',
    durationMs: 7200000,
    seed: 5678,
    sectionIds: ['speaking-writing', 'reading', 'listening'],
    responses: {},
    availablePoints: 90,
    earnedPoints: 81,
    skillScores: { speaking: 82, writing: 78, reading: 80, listening: 79 },
    overallIsEstimate: true,
    overallScore: 81,
    cefr: 'C1',
    completedItemIds: [],
    breakdown: {},
  },
]

const RECENT_DATES = (() => {
  const out: string[] = []
  const now = new Date()
  const offsets = [0, 1, 2, 3, 6, 7, 8, 9, 10, 11, 12, 16, 17, 18]
  for (const offset of offsets) {
    const d = new Date(now)
    d.setDate(d.getDate() - offset)
    out.push(d.toISOString().slice(0, 10))
  }
  return out
})()

const HEAT_DATES = (() => {
  const out: string[] = []
  const now = new Date()
  for (let i = 0; i < 90; i++) {
    if ((i * 7 + 3) % 5 !== 0) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      out.push(d.toISOString().slice(0, 10))
    }
  }
  return out
})()

function StreakWidgetDemo() {
  const ready = useClientReady()
  if (!ready) {
    return (
      <div className="card-solid h-[106px] animate-pulse rounded-2xl bg-ink-100/50 dark:bg-white/5" />
    )
  }
  return <StreakWidget dates={RECENT_DATES} />
}

function HeatmapDemo() {
  const ready = useClientReady()
  if (!ready) {
    return (
      <div className="card-solid h-[150px] animate-pulse rounded-2xl bg-ink-100/50 dark:bg-white/5" />
    )
  }
  return <ActivityHeatmap dates={HEAT_DATES} weeks={20} />
}

function DemoShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-6">
      <CardTitle>{title}</CardTitle>
      <div className="mt-4">{children}</div>
    </Card>
  )
}

function ConfettiDemo() {
  const [fire, setFire] = useState(false)
  useEffect(() => {
    const t = window.setTimeout(() => setFire(true), 500)
    return () => window.clearTimeout(t)
  }, [])
  const again = () => {
    setFire(false)
    window.setTimeout(() => setFire(true), 40)
  }
  return (
    <div>
      <Button variant="primary" onClick={again}>
        Celebrate again
      </Button>
      <ConfettiBurst fire={fire} />
      <p className="mt-2 text-sm text-ink-500 dark:text-ink-on-dark">
        A burst of mint and rose — fire it when a mock completes.
      </p>
    </div>
  )
}

function ToastDemo() {
  const { success, error } = useToast()
  return (
    <div className="flex flex-wrap gap-3">
      <Button variant="secondary" onClick={() => success('Your progress was synced to the cloud.')}>
        Success toast
      </Button>
      <Button variant="danger" onClick={() => error('Could not reach the server.')}>
        Error toast
      </Button>
    </div>
  )
}

export default function UiElements() {
  const [tab, setTab] = useState('overview')
  const [sliderVal, setSliderVal] = useState(64)
  const [toggle, setToggle] = useState(true)
  const [dlgOpen, setDlgOpen] = useState(false)
  const [alertOpen, setAlertOpen] = useState(false)

  return (
    <>
      <Seo />
      <PageWrapper
        size="content"
        breadcrumbs={<Breadcrumbs trail={[{ name: 'Home', path: '/' }, { name: 'UI elements' }]} />}
        eyebrow="Component catalogue"
        title={<>Every UI element, in one place</>}
        description="The full vocabulary of the interface — ambient layers, motion, typography, cards, progress, gamification, navigation, overlays and controls — rendered as they are meant to be used."
      >
        {/* Ambient layers */}
        <section id="ambient" className="scroll-mt-24">
          <SectionHeading
            eyebrow="Ambient layers"
            title="The page's atmosphere"
            description="Fixed, decorative grounds that sit under every interactive layer."
          />
          <div className="grid gap-5 md:grid-cols-2">
            <DemoShell title="AuroraBackground">
              <div className="relative h-40 overflow-hidden rounded-2xl">
                <AuroraBackground />
                <div className="relative grid h-full place-items-center">
                  <span className="text-sm font-bold text-ink-700 dark:text-ink-100">
                    Three drifting candy blobs
                  </span>
                </div>
              </div>
            </DemoShell>
            <DemoShell title="DottedGlowBackground">
              <div className="relative h-40 overflow-hidden rounded-2xl border border-ink-200 dark:border-white/10">
                <DottedGlowBackground gap={18} radius={1.6} opacity={0.5} />
                <div className="relative grid h-full place-items-center">
                  <span className="text-sm font-bold text-ink-700 dark:text-ink-100">
                    Dotted glow field
                  </span>
                </div>
              </div>
            </DemoShell>
            <DemoShell title="GrainOverlay + CursorGlow">
              <p className="text-sm text-ink-500 dark:text-ink-on-dark">
                GrainOverlay and CursorGlow are already mounted globally in{' '}
                <code className="font-mono text-xs">App.tsx</code> — a whisper of film grain and a
                pool of light that follows the pointer, on every page.
              </p>
            </DemoShell>
            <DemoShell title="SectionDivider">
              <SectionDivider />
              <p className="mt-2 text-sm text-ink-500 dark:text-ink-on-dark">
                A quiet rule that separates long scrolls.
              </p>
            </DemoShell>
          </div>
        </section>

        {/* Motion */}
        <section id="motion" className="mt-14 scroll-mt-24">
          <SectionHeading
            eyebrow="Motion"
            title="Movement with a job"
            description="Entrance, emphasis and ambient motion on the house spring curve."
          />
          <div className="grid gap-5 md:grid-cols-2">
            <DemoShell title="Reveal + CountUp">
              <Reveal variant="up">
                <p className="font-display text-4xl font-extrabold text-ink-900 dark:text-ink-50">
                  <CountUp value={1025} duration={1200} />
                </p>
                <p className="text-sm text-ink-500 dark:text-ink-on-dark">
                  practice items, counted up on entry
                </p>
              </Reveal>
            </DemoShell>
            <DemoShell title="Tilt">
              <Tilt className="card-solid rounded-2xl p-6 text-center">
                <p className="font-bold text-ink-900 dark:text-ink-50">Hover me</p>
                <p className="text-sm text-ink-500 dark:text-ink-on-dark">
                  The card tilts toward the pointer
                </p>
              </Tilt>
            </DemoShell>
            <DemoShell title="ParallaxVisual">
              <ParallaxVisual depth={12} className="card-solid rounded-2xl p-6 text-center">
                <p className="font-bold text-ink-900 dark:text-ink-50">Drifts with the pointer</p>
                <p className="text-sm text-ink-500 dark:text-ink-on-dark">
                  Capped pixel travel, lerped per frame
                </p>
              </ParallaxVisual>
            </DemoShell>
            <DemoShell title="Float">
              <Float y={10} duration={4}>
                <div className="card-solid inline-block rounded-2xl px-6 py-4 font-bold text-ink-900 dark:text-ink-50">
                  Floating card
                </div>
              </Float>
            </DemoShell>
            <DemoShell title="Magnetic">
              <Magnetic>
                <Button variant="primary" magnetic>
                  Magnetic button
                </Button>
              </Magnetic>
            </DemoShell>
            <DemoShell title="ScrollVelocity">
              <ScrollVelocity
                items={['Speaking', 'Writing', 'Reading', 'Listening', 'Timed', 'Scored']}
              />
            </DemoShell>
            <DemoShell title="TextReveal">
              <TextReveal text="Words that settle in" as="p" />
            </DemoShell>
            <DemoShell title="TextScramble">
              <TextScramble
                text="76/90"
                duration={1400}
                className="font-display text-3xl font-extrabold text-ink-900 dark:text-ink-50"
              />
            </DemoShell>
            <DemoShell title="Marquee">
              <Marquee
                items={[
                  'Free mock tests',
                  'All 22 question types',
                  'Timed sections',
                  'CEFR band',
                  'Instant score report',
                ]}
              />
            </DemoShell>
            <DemoShell title="ScrollDownIndicator">
              <div className="h-24">
                <ScrollDownIndicator />
              </div>
            </DemoShell>
            <DemoShell title="NumberTicker (Magic UI)">
              <div className="flex items-baseline gap-2">
                <span className="font-display text-4xl font-extrabold text-ink-900 dark:text-ink-50">
                  <NumberTicker value={79} />
                </span>
                <span className="text-sm font-bold text-ink-500 dark:text-ink-on-dark-muted">
                  / 90 target score (PTE 79+)
                </span>
              </div>
            </DemoShell>
            <DemoShell title="WordRotate (Magic UI)">
              <div className="flex items-center gap-2 text-xl font-display font-extrabold text-ink-900 dark:text-ink-50">
                <span>Mastering</span>
                <WordRotate
                  words={[
                    'Read Aloud',
                    'Repeat Sentence',
                    'Write from Dictation',
                    'Describe Image',
                  ]}
                  className="text-brand-600 dark:text-brand-400"
                />
              </div>
            </DemoShell>
            <DemoShell title="RenderType (Typing Animation)">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xl font-display font-extrabold text-ink-900 dark:text-ink-50">
                  <span className="text-mint-700 dark:text-mint-300">PTE Drill:</span>
                  <RenderType
                    text={[
                      'Read Aloud with 40s recording timer',
                      'Repeat Sentence with native audio accents',
                      'Write Essay with trait automated grading',
                      'Fill in Blanks with collocation checks',
                    ]}
                    speed={40}
                    holdDuration={2200}
                    cursorStyle="bar"
                    cursorClassName="bg-mint-500"
                    className="text-mark-600 dark:text-mark-300"
                  />
                </div>
                <p className="text-xs text-ink-500 dark:text-ink-on-dark-muted">
                  Types character-by-character with human cadence, punctuation pauses, screen-reader
                  compatibility, and loop support.
                </p>
              </div>
            </DemoShell>
            <DemoShell title="OrbitingCircles (Magic UI)">
              <div className="relative flex h-52 w-full items-center justify-center overflow-hidden rounded-2xl bg-ink-50/50 dark:bg-ink-900/50 border border-ink-200 dark:border-white/10">
                <div className="z-10 flex size-12 items-center justify-center rounded-full bg-brand-500 font-display font-black text-white shadow-md">
                  PTE
                </div>
                <OrbitingCircles radius={68} duration={14} iconSize={26}>
                  <span
                    className="flex size-6 items-center justify-center rounded-full bg-mint-500 text-[9px] font-black text-ink-900 shadow-sm"
                    title="Speaking"
                  >
                    SP
                  </span>
                  <span
                    className="flex size-6 items-center justify-center rounded-full bg-mark-700 text-[9px] font-black text-white shadow-sm"
                    title="Writing"
                  >
                    WR
                  </span>
                  <span
                    className="flex size-6 items-center justify-center rounded-full bg-amber-500 text-[9px] font-black text-white shadow-sm"
                    title="Reading"
                  >
                    RD
                  </span>
                  <span
                    className="flex size-6 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-ink-900 shadow-sm"
                    title="Listening"
                  >
                    LS
                  </span>
                </OrbitingCircles>
              </div>
            </DemoShell>
            <DemoShell title="AnimatedShinyText (Magic UI)">
              <div className="flex flex-col items-center justify-center p-4">
                <span className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-ink-50 px-4 py-2 dark:border-white/10 dark:bg-ink-850">
                  <span className="size-2 rounded-full bg-mint-500 animate-pulse" />
                  <AnimatedShinyText className="text-sm font-bold text-ink-900 dark:text-ink-50">
                    ✨ Pearson PTE Official Scoring Rubrics
                  </AnimatedShinyText>
                </span>
              </div>
            </DemoShell>
          </div>
        </section>

        {/* Typography */}
        <section id="type" className="mt-14 scroll-mt-24">
          <SectionHeading
            eyebrow="Typography"
            title="Type that carries the claim"
            description="The display face, the letter-voiced colour and the mono data voice."
          />
          <div className="grid gap-5 md:grid-cols-2">
            <DemoShell title="ColourfulText">
              <p className="font-display text-3xl font-extrabold">
                <ColourfulText text="Twenty-two question types" />
              </p>
            </DemoShell>
            <DemoShell title="Kbd">
              <p className="flex items-center gap-2 text-sm text-ink-500 dark:text-ink-on-dark">
                Press <Kbd>⌘</Kbd> <Kbd>K</Kbd> to open the command palette
              </p>
            </DemoShell>
            <DemoShell title="KeyFigure">
              <KeyFigure
                value="10–90"
                label="PTE scale"
                note="The official score range, with a CEFR band attached."
              />
            </DemoShell>
          </div>
        </section>

        {/* Cards & surfaces */}
        <section id="cards" className="mt-14 scroll-mt-24">
          <SectionHeading
            eyebrow="Cards & surfaces"
            title="The things you touch"
            description="Contained units, from a plain card to a spotlight frame."
          />
          <div className="grid gap-5 md:grid-cols-2">
            <DemoShell title="Card + CardTitle">
              <Card className="p-5">
                <CardTitle>A plain card</CardTitle>
                <p className="mt-1 text-sm text-ink-500 dark:text-ink-on-dark">
                  The default surface for a contained unit.
                </p>
              </Card>
            </DemoShell>
            <DemoShell title="SpotlightCard">
              <SpotlightCard className="h-32 rounded-2xl p-5">
                <p className="font-bold text-ink-900 dark:text-ink-50">
                  A pool of light follows the pointer
                </p>
              </SpotlightCard>
            </DemoShell>
            <DemoShell title="ShineBorder (Magic UI)">
              <div className="relative flex h-32 flex-col justify-center overflow-hidden rounded-2xl border border-ink-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-ink-850">
                <ShineBorder
                  borderWidth={1.5}
                  duration={10}
                  shineColor={['#7870c9', '#2eb88a', '#db7b06']}
                />
                <p className="font-bold text-ink-900 dark:text-ink-50">Multi-tone Shine Border</p>
                <p className="text-sm text-ink-500 dark:text-ink-on-dark">
                  Smooth radial mask sweep around element edge.
                </p>
              </div>
            </DemoShell>
            <DemoShell title="FlipCard">
              <FlipCard
                flipLabel="Flip"
                front={
                  <div className="grid h-32 place-items-center rounded-2xl bg-brand-500/10 p-4 text-center font-bold text-ink-900 dark:text-ink-50">
                    Read Aloud
                  </div>
                }
                back={
                  <div className="grid h-32 place-items-center rounded-2xl bg-mint-500/10 p-4 text-center text-sm text-ink-700 dark:text-ink-100">
                    Read a passage aloud, scored on content and pronunciation.
                  </div>
                }
              />
            </DemoShell>
            <DemoShell title="Skeleton">
              <div className="space-y-3">
                <Skeleton variant="rect" className="h-20 w-full rounded-xl" />
                <Skeleton variant="text" className="w-3/4" />
                <Skeleton variant="circle" className="size-10" />
              </div>
            </DemoShell>
            <DemoShell title="CardSkeleton">
              <CardSkeleton className="h-36" />
            </DemoShell>
          </div>
        </section>

        {/* Progress */}
        <section id="progress" className="mt-14 scroll-mt-24">
          <SectionHeading
            eyebrow="Progress"
            title="How far, how fast"
            description="Bars, rings, dials and sparklines — the shape of a score."
          />
          <div className="grid gap-5 md:grid-cols-2">
            <DemoShell title="ProgressBar">
              <div className="space-y-3">
                <ProgressBar value={76} max={90} label="Overall score" />
                <ProgressBar value={58} max={90} tone="mint" label="Speaking" />
                <ProgressBar value={41} max={90} tone="amber" label="Writing" />
                <ProgressBar value={22} max={90} tone="rose" label="Reading" />
              </div>
            </DemoShell>
            <DemoShell title="RadialProgress">
              <div className="flex items-center gap-6">
                <RadialProgress
                  value={76}
                  max={90}
                  size={96}
                  stroke={9}
                  tone="brand"
                  label="Overall"
                />
                <RadialProgress
                  value={64}
                  max={90}
                  size={96}
                  stroke={9}
                  tone="mint"
                  label="Speaking"
                />
                <RadialProgress
                  value={48}
                  max={90}
                  size={96}
                  stroke={9}
                  tone="amber"
                  label="Writing"
                />
              </div>
            </DemoShell>
            <DemoShell title="CountdownRing">
              <div className="flex items-center gap-5">
                <CountdownRing ratio={0.85} size={44} />
                <CountdownRing ratio={0.5} warning size={44} />
                <CountdownRing ratio={0.12} critical size={44} />
                <span className="text-sm text-ink-500 dark:text-ink-on-dark">
                  drains as a section clock runs — calm, warning, critical
                </span>
              </div>
            </DemoShell>
            <DemoShell title="Sparkline">
              <div className="space-y-4">
                <div>
                  <Sparkline
                    points={[52, 55, 54, 58, 61, 60, 64, 68, 71, 76]}
                    tone="mint"
                    width={180}
                    height={44}
                  />
                  <p className="mt-1 text-xs text-ink-500 dark:text-ink-on-dark">
                    a climbing trend
                  </p>
                </div>
                <div>
                  <Sparkline
                    points={[70, 66, 68, 62, 64, 58, 55, 57, 52, 49]}
                    tone="rose"
                    width={180}
                    height={44}
                  />
                  <p className="mt-1 text-xs text-ink-500 dark:text-ink-on-dark">a falling trend</p>
                </div>
              </div>
            </DemoShell>
            <DemoShell title="ScoreRangeBar">
              <ScoreRangeBar score={76} band="B2" fraction={0.76} label="Overall" />
            </DemoShell>
            <DemoShell title="ScoreScale">
              <div className="py-2">
                <ScoreScale value={79} label="Target score" />
              </div>
            </DemoShell>
            <DemoShell title="ScrollProgress">
              <p className="text-sm text-ink-500 dark:text-ink-on-dark">
                A hairline at the very top of the viewport fills as you scroll. It is mounted
                globally — scroll this page to see it.
              </p>
            </DemoShell>
            <DemoShell title="Timeline (ReUI)">
              <Timeline orientation="vertical" className="mt-2">
                <TimelineItem step={1}>
                  <TimelineIndicator>1</TimelineIndicator>
                  <TimelineSeparator />
                  <TimelineHeader>
                    <TimelineDate>Part 1 · 54–67 min</TimelineDate>
                    <TimelineTitle>Speaking & Writing</TimelineTitle>
                    <TimelineContent>
                      Read Aloud, Repeat Sentence, Describe Image, Essay
                    </TimelineContent>
                  </TimelineHeader>
                </TimelineItem>
                <TimelineItem step={2}>
                  <TimelineIndicator>2</TimelineIndicator>
                  <TimelineSeparator />
                  <TimelineHeader>
                    <TimelineDate>Part 2 · 29–30 min</TimelineDate>
                    <TimelineTitle>Reading</TimelineTitle>
                    <TimelineContent>
                      Fill in Blanks (Dropdown/Table), Re-order Paragraphs
                    </TimelineContent>
                  </TimelineHeader>
                </TimelineItem>
                <TimelineItem step={3}>
                  <TimelineIndicator>3</TimelineIndicator>
                  <TimelineHeader>
                    <TimelineDate>Part 3 · 30–43 min</TimelineDate>
                    <TimelineTitle>Listening</TimelineTitle>
                    <TimelineContent>Summarize Spoken Text, Write from Dictation</TimelineContent>
                  </TimelineHeader>
                </TimelineItem>
              </Timeline>
            </DemoShell>
          </div>
        </section>

        {/* Gamification */}
        <section id="gamification" className="mt-14 scroll-mt-24">
          <SectionHeading
            eyebrow="Gamification"
            title="Momentum, made visible"
            description="Streaks, heatmaps, badges and the burst that celebrates a finish."
          />
          <div className="grid gap-5 md:grid-cols-2">
            <DemoShell title="StreakWidget">
              <StreakWidgetDemo />
            </DemoShell>
            <DemoShell title="ActivityHeatmap">
              <HeatmapDemo />
            </DemoShell>
            <DemoShell title="AchievementBadges">
              <AchievementBadges attempts={DEMO_ATTEMPTS} />
            </DemoShell>
            <DemoShell title="ConfettiBurst">
              <ConfettiDemo />
            </DemoShell>
            <DemoShell title="PulseDot">
              <div className="flex items-center gap-4">
                <PulseDot tone="mint" />
                <span className="text-sm">Live</span>
                <PulseDot tone="brand" />
                <span className="text-sm">Recording</span>
                <PulseDot tone="amber" />
                <span className="text-sm">Paused</span>
                <PulseDot tone="rose" />
                <span className="text-sm">Expired</span>
              </div>
            </DemoShell>
            <DemoShell title="Avatar">
              <div className="flex items-center gap-4">
                <Avatar name="Alok Varder" email="alok@example.com" tone="brand" size="lg" />
                <Avatar name="Alok Varder" tone="mint" size="md" />
                <Avatar name="Alok Varder" tone="amber" size="sm" />
              </div>
            </DemoShell>
          </div>
        </section>

        {/* Navigation */}
        <section id="nav" className="mt-14 scroll-mt-24">
          <SectionHeading
            eyebrow="Navigation"
            title="Finding your way"
            description="Tabs, steppers, breadcrumbs and the rails that jump you along."
          />
          <div className="grid gap-5 md:grid-cols-2">
            <DemoShell title="Tabs">
              <Tabs
                value={tab}
                onChange={setTab}
                tabs={[
                  { id: 'overview', label: 'Overview' },
                  { id: 'pace', label: 'Pace' },
                  { id: 'review', label: 'Review' },
                ]}
              />
            </DemoShell>
            <DemoShell title="Stepper">
              <Stepper
                steps={['Pick a length', 'Choose sections', 'Start the clock']}
                current={1}
              />
            </DemoShell>
            <DemoShell title="Breadcrumbs">
              <Breadcrumbs
                trail={[
                  { name: 'Home', path: '/' },
                  { name: 'Question types', path: '/question-types/' },
                  { name: 'Read Aloud' },
                ]}
              />
            </DemoShell>
            <DemoShell title="ProgressDots">
              <p className="text-sm text-ink-500 dark:text-ink-on-dark">
                A rail of section markers on the page's right edge. It needs anchored sections to
                jump between, so it lives on long pages — scroll this page and look right.
              </p>
            </DemoShell>
            <DemoShell title="BackToTop">
              <p className="text-sm text-ink-500 dark:text-ink-on-dark">
                A floating button, bottom-left, that surfaces after a screen of scroll. It is
                mounted globally — scroll down and back up to see it.
              </p>
            </DemoShell>
            <DemoShell title="StickyCTA">
              <StickyCTA
                to="/mock"
                label="Start a free mock"
                note="No account needed"
                showAfter={10}
              />
            </DemoShell>
          </div>
        </section>

        {/* Overlays */}
        <section id="overlays" className="mt-14 scroll-mt-24">
          <SectionHeading
            eyebrow="Overlays"
            title="The layer above"
            description="Tooltips, cards, popovers, dialogs and toasts — the quiet interruptions."
          />
          <div className="grid gap-5 md:grid-cols-2">
            <DemoShell title="Tooltip">
              <Tooltip label="Scored on content and pronunciation" side="top">
                <Button variant="secondary">Hover me</Button>
              </Tooltip>
            </DemoShell>
            <DemoShell title="HoverCard">
              <HoverCard trigger={<Button variant="secondary">Hover</Button>}>
                <p className="max-w-xs text-sm text-ink-700 dark:text-ink-100">
                  Read a passage aloud. Scored on content, form and pronunciation.
                </p>
              </HoverCard>
            </DemoShell>
            <DemoShell title="Popover">
              <Popover
                label="Options"
                trigger={
                  <span className="btn-secondary px-6 py-3 text-sm inline-flex items-center justify-center">
                    Open popover
                  </span>
                }
              >
                <p className="max-w-xs text-sm text-ink-700 dark:text-ink-100">
                  A small panel anchored to its trigger.
                </p>
              </Popover>
            </DemoShell>
            <DemoShell title="Dialog">
              <Button variant="secondary" onClick={() => setDlgOpen(true)}>
                Open dialog
              </Button>
              <Dialog
                open={dlgOpen}
                onClose={() => setDlgOpen(false)}
                title="Exit the test?"
                footer={
                  <>
                    <Button variant="ghost" onClick={() => setDlgOpen(false)}>
                      Keep going
                    </Button>
                    <Button variant="danger" onClick={() => setDlgOpen(false)}>
                      Exit
                    </Button>
                  </>
                }
              >
                Your progress in this section will be lost.
              </Dialog>
            </DemoShell>
            <DemoShell title="AlertDialog">
              <Button variant="danger" onClick={() => setAlertOpen(true)}>
                Clear history
              </Button>
              <AlertDialog
                open={alertOpen}
                onClose={() => setAlertOpen(false)}
                onConfirm={() => setAlertOpen(false)}
                title="Clear all attempts?"
                description="This cannot be undone. Your full history will be removed from this device."
                confirmLabel="Clear"
              />
            </DemoShell>
            <DemoShell title="Toast">
              <ToastDemo />
            </DemoShell>
            <DemoShell title="Alert (shadcn/ui)">
              <div className="space-y-3">
                <Alert variant="info">
                  <AlertTitle>Simulated Exam Conditions</AlertTitle>
                  <AlertDescription>
                    Sections run on official Pearson test timers with strict transitions.
                  </AlertDescription>
                </Alert>
                <Alert variant="warning">
                  <AlertTitle>Microphone Sensitivity</AlertTitle>
                  <AlertDescription>
                    Fluency and pronunciation are graded in real-time. Practice in a quiet room.
                  </AlertDescription>
                </Alert>
              </div>
            </DemoShell>
          </div>
        </section>

        {/* Controls */}
        <section id="controls" className="mt-14 scroll-mt-24">
          <SectionHeading
            eyebrow="Controls"
            title="The inputs"
            description="Buttons, toggles, sliders and the segmented switch."
          />
          <div className="grid gap-5 md:grid-cols-2">
            <DemoShell title="Buttons">
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger">Danger</Button>
                <ShimmerButton>
                  <Button variant="primary">Shimmer</Button>
                </ShimmerButton>
              </div>
            </DemoShell>
            <DemoShell title="Toggle">
              <Toggle
                checked={toggle}
                onChange={setToggle}
                label="Speak prompts aloud"
                description="Reads each speaking prompt through the speech synthesiser."
              />
            </DemoShell>
            <DemoShell title="Slider">
              <Slider
                label="Text scale"
                value={sliderVal}
                min={80}
                max={150}
                step={5}
                onChange={setSliderVal}
                format={(v) => `${v}%`}
                hint="Scales every font on the page."
              />
            </DemoShell>
            <DemoShell title="Badge">
              <div className="flex flex-wrap gap-2">
                <Badge tone="neutral">Neutral</Badge>
                <Badge tone="brand">Brand</Badge>
                <Badge tone="mint">Mint</Badge>
                <Badge tone="amber">Amber</Badge>
                <Badge tone="rose">Rose</Badge>
              </div>
            </DemoShell>
            <DemoShell title="Stat">
              <Stat label="Overall" value={76} sub="10 to 90 scale" tone="brand" />
            </DemoShell>
            <DemoShell title="IconTile (ReUI)">
              <div className="flex flex-wrap items-center gap-3">
                <IconTile variant="outline" size="lg" title="Outline">
                  <svg
                    className="size-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </IconTile>
                <IconTile variant="elevated" size="lg" title="Elevated">
                  <svg
                    className="size-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                  </svg>
                </IconTile>
                <IconTile variant="soft" size="lg" title="Soft">
                  <svg
                    className="size-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="m10 15 5-3-5-3v6Z" />
                  </svg>
                </IconTile>
                <IconTile variant="solid" size="lg" title="Solid">
                  <svg
                    className="size-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </IconTile>
                <IconTile variant="soft" size="default" radius="full" title="Soft Pill">
                  <svg
                    className="size-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Z" />
                  </svg>
                </IconTile>
              </div>
              <p className="mt-3 text-xs text-ink-500 dark:text-ink-on-dark">
                ReUI icon affordance tiles (outline, elevated, soft, solid, pill).
              </p>
            </DemoShell>
          </div>
        </section>

        {/* Composed */}
        <section id="composed" className="mt-14 scroll-mt-24">
          <SectionHeading
            eyebrow="Composed"
            title="Built from the primitives"
            description="Larger pieces assembled from the elements above."
          />
          <div className="grid gap-5 md:grid-cols-2">
            <DemoShell title="ScoreCalculator">
              <ScoreCalculator />
            </DemoShell>
            <DemoShell title="Accordion">
              <Accordion
                items={[
                  {
                    question: 'Is this really free?',
                    answer: 'Yes. No account, no trial, no payment step, no limit.',
                  },
                  {
                    question: 'How accurate are the scores?',
                    answer:
                      'Choice and text items are scored exactly against the keys. Speaking and writing are rubric estimates, labelled as such.',
                  },
                ]}
              />
            </DemoShell>
            <DemoShell title="Disclosure">
              <Disclosure summary="Drill reference">
                <p className="text-sm text-ink-500 dark:text-ink-on-dark">
                  A disclosure card open to anything — the drill reference table, practice settings,
                  per-result panels.
                </p>
              </Disclosure>
            </DemoShell>
            <DemoShell title="Callout">
              <Callout tone="brand" label="Guidance">
                The one tinted panel that carries the thing to remember.
              </Callout>
            </DemoShell>
            <DemoShell title="TickList + NumMarker">
              <TickList
                items={[
                  <span key="a">
                    <NumMarker tone="brand">1</NumMarker> Timed sections that match test day.
                  </span>,
                  <span key="b">
                    <NumMarker tone="mint">2</NumMarker> Scores on the official scale.
                  </span>,
                  <span key="c">
                    <NumMarker tone="quiet">3</NumMarker> A report ordered by points lost.
                  </span>,
                ]}
              />
            </DemoShell>
          </div>
        </section>

        {/* Separator + CTA */}
        <div className="mt-16">
          <Separator />
        </div>
        <div className="mt-10">
          <CtaBand
            eyebrow="Last thing"
            title="Sit a mock and see them all in context"
            description="Every element above is live in the product. The report, the dashboard and the setup screen are where they earn their keep."
            actions={
              <>
                <ButtonLink to="/mock" size="lg" magnetic>
                  Start free mock test
                </ButtonLink>
                <ButtonLink to="/dashboard" variant="secondary" size="lg">
                  Open the dashboard
                </ButtonLink>
              </>
            }
          />
        </div>
      </PageWrapper>
    </>
  )
}
