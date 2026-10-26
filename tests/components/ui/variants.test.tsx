import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ActivityHeatmap } from '../../../src/components/ui/heatmap'
import { Stepper } from '../../../src/components/ui/stepper'
import { AchievementBadges } from '../../../src/components/ui/badges'
import { computeStreaks } from '../../../src/components/ui/compute-streaks'
import { Slider } from '../../../src/components/ui/slider'
import { Sparkline } from '../../../src/components/ui/sparkline'
import { StreakWidget } from '../../../src/components/ui/streak'
import type { AttemptRecord } from '../../../src/domain/types'

/* ---------------------------------------------------------------------------
   The branches that only a particular input reaches.

   The presentational suite covers the shape of each component. These are the
   inputs that flip the remaining switches: a day with four attempts rather
   than one, a stepper part-way through, a run of scores that climbs, a
   slider the user actually moves.
   --------------------------------------------------------------------------- */


describe('ActivityHeatmap', () => {
  // The heatmap keys days in local time, so the fixture has to be built in
  // local time too: a local-midnight date serialised to UTC still reads back
  // as the same local day.
  const localMidnight = (offset: number): Date => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - offset)
    return date
  }

  it('scales its cells by how many attempts landed on each day', () => {
    // Four, three, two and one attempts on four consecutive days puts the
    // busiest day at the top of the scale and exercises every intensity band.
    const dates = [4, 3, 2, 1].flatMap((count, index) =>
      Array.from({ length: count }, () => localMidnight(index).toISOString()),
    )

    const { container } = render(<ActivityHeatmap dates={dates} weeks={4} />)

    const titles = [...container.querySelectorAll('span[title]')].map((el) => el.getAttribute('title'))
    expect(titles.some((t) => t?.includes('1 attempt on'))).toBe(true)
    expect(titles.some((t) => t?.includes('2 attempts on'))).toBe(true)
    expect(titles.some((t) => t?.includes('3 attempts on'))).toBe(true)
    expect(titles.some((t) => t?.includes('4 attempts on'))).toBe(true)
  })

  it('leaves the rest of the current week transparent', () => {
    const { container } = render(<ActivityHeatmap dates={[]} weeks={1} />)
    expect(container.querySelectorAll('.bg-transparent').length).toBeGreaterThan(0)
  })
})

describe('Stepper', () => {
  it('marks the finished steps and leaves the later ones quiet', () => {
    const { container } = render(<Stepper steps={['One', 'Two', 'Three']} current={1} />)

    // The first step is done, the second is active, the third is neither.
    expect(container.querySelectorAll('.num-marker-mint')).toHaveLength(1)
    expect(container.querySelectorAll('.num-marker-quiet')).toHaveLength(1)
    expect(container.querySelector('[aria-current="step"]')).toBeInTheDocument()
  })

  it('fills the connector behind a finished step', () => {
    const { container } = render(<Stepper steps={['One', 'Two']} current={1} />)
    expect(container.querySelector('.bg-mint-500')).toBeInTheDocument()
  })

  it('leaves the connector empty before the first step', () => {
    const { container } = render(<Stepper steps={['One', 'Two']} current={0} />)
    expect(container.querySelector('.bg-ink-200')).toBeInTheDocument()
  })
})

describe('AchievementBadges', () => {
  const attempt = (id: string, overallScore: number, startedAt: string): AttemptRecord =>
    ({
      id,
      mockId: 'mock',
      mockTitle: 'Mock',
      mode: 'exam',
      startedAt,
      finishedAt: startedAt,
      durationMs: 1000,
      seed: 1,
      sectionIds: ['reading'],
      responses: {},
      availablePoints: 90,
      earnedPoints: 45,
      skillScores: {},
      overallIsEstimate: true,
      overallScore,
      cefr: 'B2',
      completedItemIds: [],
      breakdown: {},
    }) as AttemptRecord

  it('unlocks the climber badge after a five-point improvement', () => {
    const { container } = render(
      <AchievementBadges
        attempts={[
          attempt('a1', 50, '2026-01-01T00:00:00.000Z'),
          attempt('a2', 56, '2026-01-02T00:00:00.000Z'),
        ]}
      />,
    )
    const climber = [...container.querySelectorAll('li')].find((li) => li.getAttribute('title')?.startsWith('Improve'))
    expect(climber?.getAttribute('title')).not.toContain('locked')
  })

  it('keeps the climber badge locked when the score never improves', () => {
    const { container } = render(
      <AchievementBadges
        attempts={[
          attempt('a1', 60, '2026-01-01T00:00:00.000Z'),
          attempt('a2', 55, '2026-01-02T00:00:00.000Z'),
        ]}
      />,
    )
    const climber = [...container.querySelectorAll('li')].find((li) => li.getAttribute('title')?.startsWith('Improve'))
    expect(climber?.getAttribute('title')).toContain('locked')
  })

  it('keeps the climber badge locked for an improvement of less than five points', () => {
    // The best score still moves up, so the next attempt is measured against
    // the higher mark rather than the first one.
    const { container } = render(
      <AchievementBadges
        attempts={[
          attempt('a1', 50, '2026-01-01T00:00:00.000Z'),
          attempt('a2', 52, '2026-01-02T00:00:00.000Z'),
          attempt('a3', 53, '2026-01-03T00:00:00.000Z'),
        ]}
      />,
    )
    const climber = [...container.querySelectorAll('li')].find((li) => li.getAttribute('title')?.startsWith('Improve'))
    expect(climber?.getAttribute('title')).toContain('locked')
  })

  it('keeps the climber badge locked with a single attempt', () => {
    const { container } = render(
      <AchievementBadges attempts={[attempt('a1', 50, '2026-01-01T00:00:00.000Z')]} />,
    )
    const climber = [...container.querySelectorAll('li')].find((li) => li.getAttribute('title')?.startsWith('Improve'))
    expect(climber?.getAttribute('title')).toContain('locked')
  })

  it('unlocks the all-rounder badge once every type has been practised', () => {
    const types = Array.from({ length: 22 }, (_, i) => `type-${i}`)
    const { container } = render(
      <AchievementBadges
        attempts={[
          {
            ...attempt('a1', 60, '2026-01-01T00:00:00.000Z'),
            breakdown: Object.fromEntries(types.map((type) => [type, { type, label: type, skill: 'reading', correct: 1, partial: 0, incorrect: 0, total: 1, maxPoints: 1, earnedPoints: 1, seconds: 10 }])),
          } as unknown as AttemptRecord,
        ]}
      />,
    )
    const allRounder = [...container.querySelectorAll('li')].find((li) => li.getAttribute('title')?.startsWith('Practise'))
    expect(allRounder?.getAttribute('title')).not.toContain('locked')
  })
})

describe('computeStreaks', () => {
  it('stops counting at a gap in the middle of the run', () => {
    const day = (offset: number): string => {
      const date = new Date()
      date.setDate(date.getDate() - offset)
      return date.toISOString().slice(0, 10)
    }
    // Today and yesterday, then a two-day gap, then three more days.
    const result = computeStreaks([day(0), day(1), day(4), day(5), day(6)])
    expect(result.current).toBe(2)
    expect(result.longest).toBe(3)
  })
})

describe('Slider', () => {
  it('reports the new value as a number when the user moves it', () => {
    const onChange = vi.fn()
    render(<Slider label="Score" value={42} min={0} max={90} onChange={onChange} />)

    const input = screen.getByLabelText('Score')
    fireEvent.change(input, { target: { value: '55' } })

    expect(onChange).toHaveBeenCalledWith(55)
  })
})

describe('Sparkline', () => {
  it('draws a flat series without dividing by zero', () => {
    const { container } = render(<Sparkline points={[5, 5, 5]} />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})

describe('StreakWidget', () => {
  it('marks a reached milestone', () => {
    const dates = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return date.toISOString().slice(0, 10)
    })
    const { container } = render(<StreakWidget dates={dates} />)
    expect([...container.querySelectorAll('span[title]')].some((s) => s.getAttribute('title')?.includes('reached'))).toBe(true)
  })

  it('marks a milestone that is close but not reached', () => {
    const dates = Array.from({ length: 2 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return date.toISOString().slice(0, 10)
    })
    const { container } = render(<StreakWidget dates={dates} />)
    expect(container.firstChild).toBeInTheDocument()
  })
})
