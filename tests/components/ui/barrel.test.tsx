import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import * as ui from '../../../src/components/ui'

/* ---------------------------------------------------------------------------
   The barrel.

   `src/components/ui/index.ts` re-exports the whole kit. It has no runtime
   logic of its own — but it is the one file every page imports from, so a
   name that falls out of it breaks a page that has nothing to do with the
   component it names.

   This file therefore checks that the names the app relies on are actually
   there, and that they are the components themselves rather than undefined
   placeholders.
   --------------------------------------------------------------------------- */

describe('the UI barrel', () => {
  it.each([
    'Alert',
    'AlertDescription',
    'AlertTitle',
    'ActiveSessionNotice',
    'AnimatedShinyText',
    'BackToTop',
    'Badge',
    'Button',
    'ButtonLink',
    'Card',
    'CardSkeleton',
    'CardTitle',
    'CommandPalette',
    'ConfettiBurst',
    'CountdownRing',
    'CountUp',
    'CtaBand',
    'CursorGlow',
    'DottedGlowBackground',
    'EmptyState',
    'Float',
    'FlipCard',
    'GrainOverlay',
    'HeroScoreCard',
    'IconTile',
    'KeyFigure',
    'Kbd',
    'Magnetic',
    'Marquee',
    'NumberTicker',
    'NumMarker',
    'OrbitingCircles',
    'PageHeading',
    'PageWrapper',
    'ParallaxVisual',
    'Popover',
    'ProgressBar',
    'ProgressDots',
    'RadialProgress',
    'Reveal',
    'ScoreCalculator',
    'ScoreScale',
    'SectionBand',
    'SectionHeading',
    'ShimmerButton',
    'ShineBorder',
    'Skeleton',
    'Slider',
    'Sparkline',
    'SpotlightCard',
    'StickyCTA',
    'Stepper',
    'TaglineReveal',
    'TextReveal',
    'TextScramble',
    'TickList',
    'Timeline',
    'Toggle',
    'Tooltip',
    'WordRotate',
  ])('exports %s', (name) => {
    expect(ui).toHaveProperty(name)
    expect((ui as Record<string, unknown>)[name]).toBeTypeOf('function')
  })

  it('exports the colourful text under its own name', () => {
    expect(ui.ColourfulText).toBeTypeOf('function')
  })

  it('exports the helpers alongside the components', () => {
    expect(ui.computeStreaks).toBeTypeOf('function')
    expect(ui.spotlightStyle).toBeTypeOf('function')
  })

  it('exports the hooks', () => {
    expect(ui.useToast).toBeTypeOf('function')
  })

  it('exports the providers', () => {
    expect(ui.ToastProvider).toBeTypeOf('function')
  })

  it('does not export anything undefined', () => {
    const undefinedExports = Object.entries(ui)
      .filter(([, value]) => value === undefined)
      .map(([name]) => name)
    expect(undefinedExports).toEqual([])
  })
})

describe('the orbiting circles', () => {
  it('reverses the direction of the orbit when asked', async () => {
    const { OrbitingCircles } = await import('../../../src/components/ui/orbiting-circles')
    const { container } = render(
      <OrbitingCircles reverse>
        <span>child</span>
      </OrbitingCircles>,
    )
    expect(container.querySelector('.animate-orbit')?.className).toContain(
      '[animation-direction:reverse]',
    )
  })

  it('leaves the orbit running forwards by default', async () => {
    const { OrbitingCircles } = await import('../../../src/components/ui/orbiting-circles')
    const { container } = render(
      <OrbitingCircles>
        <span>child</span>
      </OrbitingCircles>,
    )
    expect(container.querySelector('.animate-orbit')?.className).not.toContain(
      '[animation-direction:reverse]',
    )
  })

  it('spaces the children around the circle', async () => {
    const { OrbitingCircles } = await import('../../../src/components/ui/orbiting-circles')
    const { container } = render(
      <OrbitingCircles>
        <span>one</span>
        <span>two</span>
      </OrbitingCircles>,
    )
    const orbits = [...container.querySelectorAll<HTMLElement>('.animate-orbit')]
    expect(orbits).toHaveLength(2)
    expect(orbits[0]?.style.getPropertyValue('--angle')).toBe('0')
    expect(orbits[1]?.style.getPropertyValue('--angle')).toBe('180')
  })

  it('takes the radius, the pace and the icon size', async () => {
    const { OrbitingCircles } = await import('../../../src/components/ui/orbiting-circles')
    const { container } = render(
      <OrbitingCircles radius={80} duration={40} speed={2} iconSize={24}>
        <span>child</span>
      </OrbitingCircles>,
    )
    const orbit = container.querySelector<HTMLElement>('.animate-orbit') as HTMLElement
    expect(orbit.style.getPropertyValue('--radius')).toBe('80')
    expect(orbit.style.getPropertyValue('--duration')).toBe('20')
    expect(orbit.style.getPropertyValue('--icon-size')).toBe('24px')
  })

  it('draws the orbit path', async () => {
    const { OrbitingCircles } = await import('../../../src/components/ui/orbiting-circles')
    const { container } = render(
      <OrbitingCircles>
        <span>child</span>
      </OrbitingCircles>,
    )
    expect(container.querySelector('svg circle')).toHaveAttribute('r', '160')
  })

  it('leaves the path out when it is not asked for', async () => {
    const { OrbitingCircles } = await import('../../../src/components/ui/orbiting-circles')
    const { container } = render(
      <OrbitingCircles path={false}>
        <span>child</span>
      </OrbitingCircles>,
    )
    expect(container.querySelector('svg')).toBeNull()
  })

  it('renders its children', async () => {
    const { OrbitingCircles } = await import('../../../src/components/ui/orbiting-circles')
    render(
      <OrbitingCircles>
        <span>child</span>
      </OrbitingCircles>,
    )
    expect(screen.getByText('child')).toBeInTheDocument()
  })
})
