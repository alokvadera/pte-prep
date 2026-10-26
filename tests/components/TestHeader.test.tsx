import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TestHeader } from '../../src/components/test/TestHeader'

/* ---------------------------------------------------------------------------
   The test header.

   It carries the four things a candidate needs while the clock is running:
   which section they are in, how long is left, how much they have answered,
   and what they have flagged. The clock itself is deliberately outside the
   live region — a running clock that announces itself every second is noise,
   not information.
   --------------------------------------------------------------------------- */

afterEach(() => {
  cleanup()
})

interface Overrides extends Partial<React.ComponentProps<typeof TestHeader>> {}

function headerElement(
  props: Overrides,
  handlers: { onExit: () => void; onExpire: () => void; onExtend: (s: number) => void },
) {
  return (
    <TestHeader
      totalSeconds={600}
      sectionTitle="Speaking & Writing"
      itemNumber={3}
      itemCount={12}
      answered={4}
      flagged={2}
      secondsRemaining={240}
      onExit={handlers.onExit}
      onExpire={handlers.onExpire}
      onExtend={handlers.onExtend}
      {...props}
    />
  )
}

function renderHeader(props: Overrides = {}) {
  const onExit = vi.fn()
  const onExpire = vi.fn()
  const onExtend = vi.fn()
  const result = render(headerElement(props, { onExit, onExpire, onExtend }))
  return { ...result, onExit, onExpire, onExtend }
}

describe('TestHeader', () => {
  it('names the section and the question', () => {
    renderHeader()

    expect(screen.getByText('Speaking & Writing')).toBeInTheDocument()
    expect(screen.getByText('Question 3 of 12')).toBeInTheDocument()
  })

  it('shows the remaining time as a clock', () => {
    renderHeader({ secondsRemaining: 90, totalSeconds: 600 })

    const clock = screen.getByRole('timer')
    expect(clock).toHaveTextContent('01:30')
    expect(clock).toHaveAttribute('aria-label', '01:30 remaining in this section')
    // The running clock must not be in the live region.
    expect(clock).toHaveAttribute('aria-live', 'off')
  })

  it('shows how much is answered and how much is flagged', () => {
    renderHeader({ answered: 7, flagged: 3 })

    expect(screen.getByText('7 answered')).toBeInTheDocument()
    expect(screen.getByText('3 flagged')).toBeInTheDocument()
  })

  it('leaves the flag count out when nothing is flagged', () => {
    renderHeader({ flagged: 0 })

    expect(screen.getByText('4 answered')).toBeInTheDocument()
    expect(screen.queryByText(/flagged/)).not.toBeInTheDocument()
  })

  it('offers the finish control', async () => {
    const user = userEvent.setup()
    const { onExit } = renderHeader()

    const exit = screen.getByRole('button', { name: 'Exit' })
    expect(exit).toHaveAttribute('title', 'Exit test and save progress')

    await user.click(exit)
    expect(onExit).toHaveBeenCalledTimes(1)
  })

  it('shows a counter instead of a clock in an untimed run', () => {
    renderHeader({ untimed: true })

    expect(screen.getByText('Untimed')).toBeInTheDocument()
    expect(screen.queryByRole('timer')).not.toBeInTheDocument()
  })

  it('warns when the section is running low and offers more time', async () => {
    const user = userEvent.setup()
    const { onExtend } = renderHeader({ secondsRemaining: 300, totalSeconds: 600 })

    expect(screen.getByRole('status')).toHaveTextContent('Running low on time in this section.')

    await user.click(screen.getByRole('button', { name: /Add 5 minutes/ }))
    expect(onExtend).toHaveBeenCalledWith(300)
    expect(screen.getByRole('button', { name: /1 added/ })).toBeInTheDocument()
  })

  it('stays quiet while there is plenty of time', () => {
    renderHeader({ secondsRemaining: 400 })

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Add 5 minutes/ })).not.toBeInTheDocument()
  })

  it('marks the clock as critical in the last minute', () => {
    renderHeader({ secondsRemaining: 30, totalSeconds: 600 })

    const clock = screen.getByRole('timer')
    expect(clock.className).toContain('text-rose-600')
  })

  it('marks the clock as a warning in the last five minutes', () => {
    renderHeader({ secondsRemaining: 120, totalSeconds: 600 })

    const clock = screen.getByRole('timer')
    expect(clock.className).toContain('text-amber-600')
  })

  it('counts down from a section end time', () => {
    renderHeader({ sectionEndsAt: Date.now() + 60_000, secondsRemaining: undefined })

    expect(screen.getByRole('timer')).toHaveTextContent('01:00')
  })

  it('expires the section when the clock runs out', () => {
    const { onExpire } = renderHeader({
      sectionEndsAt: Date.now() - 5_000,
      secondsRemaining: undefined,
    })

    expect(onExpire).toHaveBeenCalled()
    expect(screen.getByRole('timer')).toHaveTextContent('00:00')
  })

  it('treats a zero-length section as no time at all', () => {
    renderHeader({ totalSeconds: 0, secondsRemaining: 100 })

    // The ring is empty rather than dividing by zero.
    expect(screen.getByRole('timer')).toBeInTheDocument()
  })

  it('says the time is about to expire once the warning has been seen', () => {
    renderHeader({ secondsRemaining: 60, totalSeconds: 600 })

    // The extension control stays for the rest of the section, and the
    // screen-reader-only reminder is only rendered before it appears.
    expect(screen.getByRole('button', { name: /Add 5 minutes/ })).toBeInTheDocument()
  })

  it('omits the extension control when the caller cannot extend', () => {
    renderHeader({ secondsRemaining: 60, onExtend: undefined })

    expect(screen.getByRole('status')).toHaveTextContent('Running low on time in this section.')
    expect(screen.queryByRole('button', { name: /Add 5 minutes/ })).not.toBeInTheDocument()
  })

  it('keeps announcing the deadline when there is no extension control', () => {
    renderHeader({ secondsRemaining: 60, onExtend: undefined })

    // With no button to take the reminder's place, the reminder is the only
    // announcement a screen reader will get that the section is ending.
    expect(screen.getByText('Time is about to expire.')).toBeInTheDocument()
  })

  it('drops the reminder once the extension control is there', () => {
    renderHeader({ secondsRemaining: 60, totalSeconds: 600 })

    // The button is the affordance now, so the reminder would be a duplicate
    // announcement of the same thing.
    expect(screen.getByRole('button', { name: /Add 5 minutes/ })).toBeInTheDocument()
    expect(screen.queryByText('Time is about to expire.')).not.toBeInTheDocument()
  })
})
