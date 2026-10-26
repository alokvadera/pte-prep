import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Alert, AlertDescription, AlertTitle } from '../../../src/components/ui/alert'
import { AnimatedShinyText } from '../../../src/components/ui/animated-shiny-text'
import { AuroraBackground } from '../../../src/components/ui/aurora-background'
import { Avatar } from '../../../src/components/ui/avatar'
import { CountdownRing } from '../../../src/components/ui/countdown-ring'
import { Float } from '../../../src/components/ui/float'
import { GrainOverlay } from '../../../src/components/ui/grain-overlay'
import { IconTile } from '../../../src/components/ui/icon-tile'
import { Kbd } from '../../../src/components/ui/kbd'
import { Marquee } from '../../../src/components/ui/marquee'
import { OrbitingCircles } from '../../../src/components/ui/orbiting-circles'
import { PulseDot } from '../../../src/components/ui/pulse-dot'
import { ScrollDownIndicator } from '../../../src/components/ui/scroll-down-indicator'
import { SectionDivider } from '../../../src/components/ui/section-divider'
import { Separator } from '../../../src/components/ui/separator'
import { ShimmerButton } from '../../../src/components/ui/shimmer-button'
import { ShineBorder } from '../../../src/components/ui/shine-border'
import { CardSkeleton, Skeleton } from '../../../src/components/ui/skeleton'
import { Slider } from '../../../src/components/ui/slider'
import { Sparkline } from '../../../src/components/ui/sparkline'
import { Spinner } from '../../../src/components/ui/spinner'
import { spotlightStyle } from '../../../src/components/ui/spotlight-style'
import { ScoreScale } from '../../../src/components/ui/ScoreScale'
import {
  Timeline,
  TimelineContent,
  TimelineDate,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
} from '../../../src/components/ui/timeline'
import { AchievementBadges } from '../../../src/components/ui/badges'
import { Stepper } from '../../../src/components/ui/stepper'
import { ActivityHeatmap } from '../../../src/components/ui/heatmap'
import { StreakWidget } from '../../../src/components/ui/streak'
import { computeStreaks } from '../../../src/components/ui/compute-streaks'
import { useToast } from '../../../src/components/ui/use-toast'
import type { AttemptRecord } from '../../../src/domain/types'

/* ---------------------------------------------------------------------------
   The presentational half of the UI kit.

   These components draw rather than behave: they take a handful of props and
   render markup. What still needs testing is the variant matrix — every
   variant, size and tone a caller can pick — plus the places where a
   component degrades on missing input (an avatar with no name, a sparkline
   with fewer than two points, a streak with no dates).
   --------------------------------------------------------------------------- */

describe('Alert', () => {
  it.each(['default', 'info', 'success', 'warning', 'destructive'] as const)(
    'renders the %s variant',
    (variant) => {
      const { container } = render(
        <Alert variant={variant}>
          <AlertTitle>Title</AlertTitle>
          <AlertDescription>Description</AlertDescription>
        </Alert>,
      )
      expect(container.firstChild).toBeInTheDocument()
      expect(screen.getByText('Title')).toBeInTheDocument()
      expect(screen.getByText('Description')).toBeInTheDocument()
    },
  )

  it('defaults to the default variant', () => {
    const { container } = render(<Alert>Body</Alert>)
    expect(container.querySelector('[role="alert"]')).toBeInTheDocument()
  })
})

describe('Avatar', () => {
  it('uses the first letter of the name', () => {
    render(<Avatar name="Alok Vadera" />)
    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('falls back to the first letter of the email', () => {
    render(<Avatar email="zoe@example.com" />)
    expect(screen.getByText('Z')).toBeInTheDocument()
  })

  it('falls back to a question mark with neither', () => {
    render(<Avatar />)
    expect(screen.getByText('?')).toBeInTheDocument()
  })

  it.each(['brand', 'mint', 'amber', 'rose'] as const)('renders the %s tone', (tone) => {
    const { container } = render(<Avatar name="A" tone={tone} />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it.each(['sm', 'md', 'lg'] as const)('renders the %s size', (size) => {
    const { container } = render(<Avatar name="A" size={size} />)
    expect(container.firstChild).toBeInTheDocument()
  })
})

describe('CountdownRing', () => {
  it.each([
    ['critical', { critical: true }],
    ['warning', { warning: true }],
    ['default', {}],
  ] as const)('renders the %s tone', (_label, props) => {
    const { container } = render(<CountdownRing ratio={0.5} {...props} />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('clamps a ratio above one', () => {
    const { container } = render(<CountdownRing ratio={5} />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('clamps a ratio below zero', () => {
    const { container } = render(<CountdownRing ratio={-5} />)
    expect(container.firstChild).toBeInTheDocument()
  })
})

describe('IconTile', () => {
  it.each(['outline', 'elevated', 'soft', 'solid', 'frame'] as const)('renders the %s variant', (variant) => {
    const { container } = render(
      <IconTile variant={variant}>
        <span>icon</span>
      </IconTile>,
    )
    expect(container.firstChild).toBeInTheDocument()
  })

  it.each(['xs', 'sm', 'default', 'lg', 'xl'] as const)('renders the %s size', (size) => {
    const { container } = render(
      <IconTile size={size}>
        <span>icon</span>
      </IconTile>,
    )
    expect(container.firstChild).toBeInTheDocument()
  })

  it('renders with a full radius', () => {
    const { container } = render(
      <IconTile radius="full">
        <span>icon</span>
      </IconTile>,
    )
    expect(container.firstChild).toBeInTheDocument()
  })
})

describe('PulseDot', () => {
  it.each(['mint', 'brand', 'amber', 'rose'] as const)('renders the %s tone', (tone) => {
    const { container } = render(<PulseDot tone={tone} />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it.each(['sm', 'md'] as const)('renders the %s size', (size) => {
    const { container } = render(<PulseDot size={size} />)
    expect(container.firstChild).toBeInTheDocument()
  })
})

describe('Separator', () => {
  it.each(['horizontal', 'vertical'] as const)('renders the %s orientation', (orientation) => {
    const { container } = render(<Separator orientation={orientation} />)
    expect(container.firstChild).toBeInTheDocument()
  })
})

describe('Skeleton', () => {
  it.each(['rect', 'circle', 'text'] as const)('renders the %s variant', (variant) => {
    const { container } = render(<Skeleton variant={variant} />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('renders a card skeleton', () => {
    const { container } = render(<CardSkeleton />)
    expect(container.firstChild).toBeInTheDocument()
  })
})

describe('Spinner', () => {
  it.each(['sm', 'md', 'lg'] as const)('renders the %s size', (size) => {
    const { container } = render(<Spinner size={size} />)
    expect(container.firstChild).toBeInTheDocument()
  })
})

describe('Marquee', () => {
  it('renders its items twice so the loop has no seam', () => {
    render(<Marquee items={['one', 'two']} />)
    expect(screen.getAllByText('one')).toHaveLength(2)
  })

  it('renders the slow variant', () => {
    const { container } = render(<Marquee items={['one']} slow />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('renders a custom separator', () => {
    render(<Marquee items={['one']} separator="|" />)
    expect(screen.getAllByText('|').length).toBeGreaterThan(0)
  })
})

describe('OrbitingCircles', () => {
  it('renders its children', () => {
    render(
      <OrbitingCircles>
        <span>child</span>
      </OrbitingCircles>,
    )
    expect(screen.getByText('child')).toBeInTheDocument()
  })

  it('renders without any children', () => {
    const { container } = render(<OrbitingCircles />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('renders the path variant, reversed', () => {
    const { container } = render(<OrbitingCircles path reverse />)
    expect(container.firstChild).toBeInTheDocument()
  })
})

describe('Sparkline', () => {
  it('renders a label naming the series', () => {
    render(<Sparkline points={[1, 2, 3]} />)
    expect(screen.getByRole('img')).toBeInTheDocument()
  })

  it('draws a placeholder for fewer than two points', () => {
    const { container } = render(<Sparkline points={[1]} />)
    expect(container.querySelector('svg')).toBeNull()
  })

  it('draws nothing for an empty series', () => {
    const { container } = render(<Sparkline points={[]} />)
    expect(container.querySelector('svg')).toBeNull()
  })

  it('drops a non-finite point', () => {
    const { container } = render(<Sparkline points={[1, Number.NaN, 3]} />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it.each(['brand', 'mint', 'amber', 'rose'] as const)('renders the %s tone', (tone) => {
    const { container } = render(<Sparkline points={[1, 2]} tone={tone} />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})

describe('Slider', () => {
  it('shows the raw value without a formatter', () => {
    render(<Slider label="Score" value={42} min={0} max={90} onChange={() => {}} />)
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('shows the formatted value', () => {
    render(
      <Slider label="Score" value={42} min={0} max={90} onChange={() => {}} format={(n) => `${n} points`} />,
    )
    expect(screen.getByText('42 points')).toBeInTheDocument()
  })

  it('renders a hint', () => {
    render(<Slider label="Score" value={42} min={0} max={90} onChange={() => {}} hint="A hint" />)
    expect(screen.getByText('A hint')).toBeInTheDocument()
  })

  it('is labelled for assistive technology', () => {
    render(<Slider label="Score" value={42} min={0} max={90} onChange={() => {}} />)
    expect(screen.getByLabelText('Score')).toBeInTheDocument()
  })
})

describe('ScoreScale', () => {
  it('shows the value by default', () => {
    render(<ScoreScale value={60} />)
    expect(screen.getByText('60')).toBeInTheDocument()
  })

  it('hides the value when asked', () => {
    const { container } = render(<ScoreScale value={60} showValue={false} />)
    expect(container.textContent).not.toContain('60')
  })

  it('clamps a value below the scale floor', () => {
    const { container } = render(<ScoreScale value={2} />)
    const marker = container.querySelector<HTMLElement>('.bg-ink-900')
    expect(marker?.style.width).toBe('0%')
  })

  it('clamps a value above the scale ceiling', () => {
    const { container } = render(<ScoreScale value={120} />)
    const marker = container.querySelector<HTMLElement>('.bg-ink-900')
    expect(marker?.style.width).toBe('100%')
  })

  it('names the scale in its text alternative', () => {
    render(<ScoreScale value={60} label="Overall" />)
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'Overall 60 on the PTE 10 to 90 scale')
  })
})

describe('Timeline', () => {
  function renderTimeline(orientation: 'vertical' | 'horizontal') {
    return render(
      <Timeline orientation={orientation}>
        <TimelineItem step={1}>
          <TimelineHeader>
            <TimelineDate>2026-01-01</TimelineDate>
            <TimelineTitle>First</TimelineTitle>
          </TimelineHeader>
          <TimelineIndicator />
          <TimelineSeparator />
          <TimelineContent>Content</TimelineContent>
        </TimelineItem>
      </Timeline>,
    )
  }

  it('renders a vertical timeline', () => {
    renderTimeline('vertical')
    expect(screen.getByText('First')).toBeInTheDocument()
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('renders a horizontal timeline', () => {
    renderTimeline('horizontal')
    expect(screen.getByText('First')).toBeInTheDocument()
  })
})

describe('AchievementBadges', () => {
  const attempt = (overrides: Partial<AttemptRecord> = {}): AttemptRecord =>
    ({
      id: 'a1',
      mockId: 'mock',
      mockTitle: 'Mock',
      mode: 'exam',
      startedAt: '2026-01-01T00:00:00.000Z',
      finishedAt: '2026-01-01T01:00:00.000Z',
      durationMs: 1000,
      seed: 1,
      sectionIds: ['reading'],
      responses: {},
      availablePoints: 90,
      earnedPoints: 45,
      skillScores: {},
      overallIsEstimate: true,
      overallScore: 50,
      cefr: 'B2',
      completedItemIds: [],
      breakdown: {},
      ...overrides,
    }) as AttemptRecord

  it('locks every achievement with no history', () => {
    const { container } = render(<AchievementBadges attempts={[]} />)
    expect(container.querySelectorAll('li')).toHaveLength(6)
  })

  it('unlocks the first-mock badge after one full mock', () => {
    const { container } = render(
      <AchievementBadges
        attempts={[
          attempt({
            id: 'a1',
            mockKind: 'full',
            overallScore: 60,
            finishedAt: '2026-01-01T00:00:00.000Z',
          }),
        ]}
      />,
    )
    expect(container.querySelectorAll('li')).toHaveLength(6)
  })

  it('unlocks the streak badge after several attempts on one day', () => {
    const { container } = render(
      <AchievementBadges
        attempts={[
          attempt({ id: 'a1', finishedAt: '2026-01-01T09:00:00.000Z' }),
          attempt({ id: 'a2', finishedAt: '2026-01-01T18:00:00.000Z' }),
        ]}
      />,
    )
    expect(container.querySelectorAll('li')).toHaveLength(6)
  })
})

describe('Stepper', () => {
  it('marks the steps before the current one as done', () => {
    render(<Stepper steps={['One', 'Two', 'Three']} current={2} />)
    expect(screen.getByText('One')).toBeInTheDocument()
    expect(screen.getByText('Three')).toBeInTheDocument()
  })

  it('marks the current step as active', () => {
    const { container } = render(<Stepper steps={['One', 'Two']} current={1} />)
    expect(container.firstChild).toBeInTheDocument()
  })
})

describe('computeStreaks', () => {
  const day = (offset: number): string => {
    const date = new Date()
    date.setDate(date.getDate() - offset)
    return date.toISOString().slice(0, 10)
  }

  it('reports nothing for no dates', () => {
    expect(computeStreaks([])).toEqual({ current: 0, longest: 0 })
  })

  it('ignores unparseable dates', () => {
    expect(computeStreaks(['not-a-date'])).toEqual({ current: 0, longest: 0 })
  })

  it('counts a run of consecutive days', () => {
    expect(computeStreaks([day(0), day(1), day(2)]).longest).toBe(3)
  })

  it('counts a run that ends today as current', () => {
    expect(computeStreaks([day(0), day(1)]).current).toBe(2)
  })

  it('keeps a run that ended yesterday alive, so a morning visit does not break it', () => {
    expect(computeStreaks([day(1), day(2)]).current).toBe(2)
  })

  it('reports the longest run even when it is not current', () => {
    expect(computeStreaks([day(5), day(6), day(7)]).longest).toBe(3)
  })
})

describe('ActivityHeatmap', () => {
  it('renders a cell for every day in the window', () => {
    const { container } = render(<ActivityHeatmap dates={['2026-03-10']} weeks={2} />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('renders with no dates at all', () => {
    const { container } = render(<ActivityHeatmap dates={[]} />)
    expect(container.firstChild).toBeInTheDocument()
  })
})

describe('StreakWidget', () => {
  it('renders with no dates', () => {
    const { container } = render(<StreakWidget dates={[]} />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('renders a live streak', () => {
    const today = new Date().toISOString().slice(0, 10)
    const { container } = render(<StreakWidget dates={[today]} />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('renders a broken streak', () => {
    const { container } = render(<StreakWidget dates={['2020-01-01']} />)
    expect(container.firstChild).toBeInTheDocument()
  })
})

describe('the remaining decorative components', () => {
  it('renders the animated shiny text', () => {
    const { container } = render(<AnimatedShinyText>Shiny</AnimatedShinyText>)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('renders the aurora background', () => {
    const { container } = render(<AuroraBackground />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('renders the grain overlay', () => {
    const { container } = render(<GrainOverlay />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('renders the scroll-down indicator', () => {
    const { container } = render(<ScrollDownIndicator />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('renders the section divider', () => {
    const { container } = render(<SectionDivider />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('renders a floating child', () => {
    const { container } = render(
      <Float>
        <span>floats</span>
      </Float>,
    )
    expect(container.firstChild).toBeInTheDocument()
  })

  it('renders a shimmer button', () => {
    render(<ShimmerButton>Click</ShimmerButton>)
    expect(screen.getByText('Click')).toBeInTheDocument()
  })

  it('renders a shine border with a single colour', () => {
    const { container } = render(
      <ShineBorder shineColor="#fff">
        <span>border</span>
      </ShineBorder>,
    )
    expect(container.firstChild).toBeInTheDocument()
  })

  it('renders a shine border with a list of colours', () => {
    const { container } = render(
      <ShineBorder shineColor={['#fff', '#000']}>
        <span>border</span>
      </ShineBorder>,
    )
    expect(container.firstChild).toBeInTheDocument()
  })

  it('renders a keyboard key', () => {
    render(<Kbd>K</Kbd>)
    expect(screen.getByText('K')).toBeInTheDocument()
  })
})

describe('spotlightStyle', () => {
  it('builds a radial gradient at the default size', () => {
    expect(spotlightStyle('#fff').background).toContain('260px')
  })

  it('honours an explicit size', () => {
    expect(spotlightStyle('#fff', 100).background).toContain('100px')
  })
})

describe('useToast', () => {
  it('falls back to a no-op outside a provider', () => {
    let api: ReturnType<typeof useToast> | undefined
    function Probe({ onValue }: { onValue: (value: ReturnType<typeof useToast>) => void }) {
      onValue(useToast())
      return null
    }
    render(<Probe onValue={(value) => (api = value)} />)
    expect(() => api?.push('a message')).not.toThrow()
    expect(() => api?.success('a message')).not.toThrow()
    expect(() => api?.error('a message')).not.toThrow()
  })
})
