import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { Dialog } from '../../../src/components/ui/dialog'
import { AlertDialog } from '../../../src/components/ui/alert-dialog'
import { Popover } from '../../../src/components/ui/popover'
import { Tabs } from '../../../src/components/ui/tabs'
import { FlipCard } from '../../../src/components/ui/flip-card'
import { Tooltip } from '../../../src/components/ui/tooltip'
import { HoverCard } from '../../../src/components/ui/hover-card'
import { ConfettiBurst } from '../../../src/components/ui/confetti'
import { ToastProvider } from '../../../src/components/ui/toast'
import { useToast } from '../../../src/components/ui/use-toast'

/* ---------------------------------------------------------------------------
   The overlay surfaces: dialogs, popovers, tabs, tooltips and toasts.

   These are the parts of the kit that own state the user can see: a modal
   that opens and closes, a strip that moves focus with the arrow keys, a
   tooltip that waits before it appears, a stack of toasts that ages out.
   --------------------------------------------------------------------------- */

describe('Dialog', () => {
  it('renders its title and body', () => {
    render(
      <Dialog open onClose={() => {}} title="Clear history">
        This cannot be undone.
      </Dialog>,
    )
    expect(screen.getByText('Clear history')).toBeInTheDocument()
    expect(screen.getByText('This cannot be undone.')).toBeInTheDocument()
  })

  it('opens the native dialog when told to', () => {
    const { container } = render(
      <Dialog open onClose={() => {}} title="Clear history">
        Body
      </Dialog>,
    )
    expect(container.querySelector('dialog')?.open).toBe(true)
  })

  it('closes the native dialog when told to', () => {
    const { container, rerender } = render(
      <Dialog open onClose={() => {}} title="Clear history">
        Body
      </Dialog>,
    )
    rerender(
      <Dialog open={false} onClose={() => {}} title="Clear history">
        Body
      </Dialog>,
    )
    expect(container.querySelector('dialog')?.open).toBe(false)
  })

  it('closes when the backdrop is clicked', () => {
    const onClose = vi.fn()
    const { container } = render(
      <Dialog open onClose={onClose} title="Clear history">
        Body
      </Dialog>,
    )
    const dialog = container.querySelector('dialog')!
    // jsdom reports a zero-sized box, so a click outside that box is a
    // backdrop click.
    fireEvent.click(dialog, { clientX: 500, clientY: 500 })
    expect(onClose).toHaveBeenCalled()
  })

  it('does not close when the dialog itself is clicked', () => {
    const onClose = vi.fn()
    const { container } = render(
      <Dialog open onClose={onClose} title="Clear history">
        Body
      </Dialog>,
    )
    const dialog = container.querySelector('dialog')!
    fireEvent.click(dialog, { clientX: 0, clientY: 0 })
    expect(onClose).not.toHaveBeenCalled()
  })

  it('closes from the close button', () => {
    const onClose = vi.fn()
    render(
      <Dialog open onClose={onClose} title="Clear history">
        Body
      </Dialog>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalled()
  })

  it('opens when it is opened after mounting closed', () => {
    const { container, rerender } = render(
      <Dialog open={false} onClose={() => {}} title="Clear history">
        Body
      </Dialog>,
    )
    expect(container.querySelector('dialog')?.open).toBe(false)
    rerender(
      <Dialog open onClose={() => {}} title="Clear history">
        Body
      </Dialog>,
    )
    expect(container.querySelector('dialog')?.open).toBe(true)
  })

  it('opens exactly once when its effects run twice', () => {
    // The app renders inside StrictMode, which mounts effects twice. The
    // second run must not call showModal on a dialog that is already open.
    const { container } = render(
      <StrictMode>
        <Dialog open onClose={() => {}} title="Clear history">
          Body
        </Dialog>
      </StrictMode>,
    )
    expect(container.querySelector('dialog')?.open).toBe(true)
  })

  it('renders a footer when one is given', () => {
    render(
      <Dialog open onClose={() => {}} title="Clear history" footer={<button>Confirm</button>}>
        Body
      </Dialog>,
    )
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument()
  })

  it('renders no footer when none is given', () => {
    render(
      <Dialog open onClose={() => {}} title="Clear history">
        Body
      </Dialog>,
    )
    expect(screen.queryByRole('button', { name: 'Confirm' })).not.toBeInTheDocument()
  })
})

describe('AlertDialog', () => {
  it('renders its title, description and the default confirm label', () => {
    render(
      <AlertDialog
        open
        onClose={() => {}}
        onConfirm={() => {}}
        title="Clear history"
        description="Everything goes."
      />,
    )
    expect(screen.getByText('Clear history')).toBeInTheDocument()
    expect(screen.getByText('Everything goes.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument()
  })

  it('uses a custom confirm label', () => {
    render(
      <AlertDialog
        open
        onClose={() => {}}
        onConfirm={() => {}}
        title="Clear history"
        description="Everything goes."
        confirmLabel="Clear it"
      />,
    )
    expect(screen.getByRole('button', { name: 'Clear it' })).toBeInTheDocument()
  })

  it('confirms and then closes', () => {
    const calls: string[] = []
    render(
      <AlertDialog
        open
        onClose={() => calls.push('close')}
        onConfirm={() => calls.push('confirm')}
        title="Clear history"
        description="Everything goes."
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(calls).toEqual(['confirm', 'close'])
  })

  it('closes without confirming when cancelled', () => {
    const onConfirm = vi.fn()
    const onClose = vi.fn()
    render(
      <AlertDialog
        open
        onClose={onClose}
        onConfirm={onConfirm}
        title="Clear history"
        description="Everything goes."
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onConfirm).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })

  it('puts focus on the safe action when it opens', () => {
    render(
      <AlertDialog
        open
        onClose={() => {}}
        onConfirm={() => {}}
        title="Clear history"
        description="Everything goes."
      />,
    )
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()
  })

  it('keeps its contents out of the accessibility tree while it is closed', () => {
    render(
      <AlertDialog
        open={false}
        onClose={() => {}}
        onConfirm={() => {}}
        title="Clear history"
        description="Everything goes."
      />,
    )
    // A closed native dialog hides its contents, so nothing inside it is
    // reachable by a screen reader or by a keyboard.
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument()
  })
})

describe('Popover', () => {
  it('stays closed until the trigger is clicked', () => {
    render(
      <Popover label="Filters" trigger="Open">
        Filters body
      </Popover>,
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('opens on a click', () => {
    render(
      <Popover label="Filters" trigger="Open">
        Filters body
      </Popover>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Filters' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('closes on a second click', () => {
    render(
      <Popover label="Filters" trigger="Open">
        Filters body
      </Popover>,
    )
    const trigger = screen.getByRole('button', { name: 'Filters' })
    fireEvent.click(trigger)
    fireEvent.click(trigger)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('closes on a click outside', () => {
    render(
      <div>
        <Popover label="Filters" trigger="Open">
          Filters body
        </Popover>
        <span>elsewhere</span>
      </div>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Filters' }))
    fireEvent.pointerDown(screen.getByText('elsewhere'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('stays open on a click inside', () => {
    render(
      <Popover label="Filters" trigger="Open">
        <span>inside</span>
      </Popover>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Filters' }))
    fireEvent.pointerDown(screen.getByText('inside'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('closes on Escape', () => {
    render(
      <Popover label="Filters" trigger="Open">
        Filters body
      </Popover>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Filters' }))
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('stays open for a key that is not Escape', () => {
    render(
      <Popover label="Filters" trigger="Open">
        Filters body
      </Popover>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Filters' }))
    fireEvent.keyDown(document, { key: 'Enter' })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it.each(['start', 'center', 'end'] as const)('renders the %s alignment', (align) => {
    render(
      <Popover label="Filters" trigger="Open" align={align}>
        Filters body
      </Popover>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Filters' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})

describe('Tabs', () => {
  const tabs = [
    { id: 'overview', label: 'Overview', content: <p>Overview panel</p> },
    { id: 'pace', label: 'Pace', content: <p>Pace panel</p> },
    { id: 'review', label: 'Review', content: <p>Review panel</p> },
  ]

  it('marks the selected tab as current', () => {
    render(<Tabs value="pace" onChange={() => {}} tabs={tabs} />)
    expect(screen.getByRole('tab', { name: 'Pace' })).toHaveAttribute('aria-selected', 'true')
  })

  it('shows the panel of the selected tab', () => {
    render(<Tabs value="pace" onChange={() => {}} tabs={tabs} />)
    expect(screen.getByText('Pace panel')).toBeInTheDocument()
  })

  it('reports a click on another tab', () => {
    const onChange = vi.fn()
    render(<Tabs value="overview" onChange={onChange} tabs={tabs} />)
    fireEvent.click(screen.getByRole('tab', { name: 'Review' }))
    expect(onChange).toHaveBeenCalledWith('review')
  })

  it('renders no panel when no tab carries content', () => {
    render(
      <Tabs
        value="overview"
        onChange={() => {}}
        tabs={[
          { id: 'overview', label: 'Overview' },
          { id: 'pace', label: 'Pace' },
        ]}
      />,
    )
    expect(screen.queryByRole('tabpanel')).not.toBeInTheDocument()
  })

  it('falls back to the first tab for an unknown value', () => {
    render(<Tabs value="nope" onChange={() => {}} tabs={tabs} />)
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true')
  })

  it('renders nothing for an empty tab list', () => {
    const { container } = render(<Tabs value="nope" onChange={() => {}} tabs={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('moves to the next tab with the right arrow', () => {
    const onChange = vi.fn()
    render(<Tabs value="overview" onChange={onChange} tabs={tabs} />)
    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowRight' })
    expect(onChange).toHaveBeenCalledWith('pace')
  })

  it('wraps to the first tab with the left arrow', () => {
    const onChange = vi.fn()
    render(<Tabs value="overview" onChange={onChange} tabs={tabs} />)
    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowLeft' })
    expect(onChange).toHaveBeenCalledWith('review')
  })

  it('jumps to the first tab with Home', () => {
    const onChange = vi.fn()
    render(<Tabs value="review" onChange={onChange} tabs={tabs} />)
    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'Home' })
    expect(onChange).toHaveBeenCalledWith('overview')
  })

  it('jumps to the last tab with End', () => {
    const onChange = vi.fn()
    render(<Tabs value="overview" onChange={onChange} tabs={tabs} />)
    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'End' })
    expect(onChange).toHaveBeenCalledWith('review')
  })

  it('ignores an unrelated key', () => {
    const onChange = vi.fn()
    render(<Tabs value="overview" onChange={onChange} tabs={tabs} />)
    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'a' })
    expect(onChange).not.toHaveBeenCalled()
  })
})

describe('FlipCard', () => {
  it('starts face up', () => {
    const { container } = render(<FlipCard front={<span>Front</span>} back={<span>Back</span>} />)
    expect(container.querySelector('.flip-inner')).not.toHaveClass('flip-inner-flipped')
  })

  it('turns over on a click', () => {
    const { container } = render(<FlipCard front={<span>Front</span>} back={<span>Back</span>} />)
    fireEvent.click(screen.getByText('Front'))
    expect(container.querySelector('.flip-inner')).toHaveClass('flip-inner-flipped')
  })

  it('turns back over on a second click', () => {
    const { container } = render(<FlipCard front={<span>Front</span>} back={<span>Back</span>} />)
    fireEvent.click(screen.getByText('Front'))
    fireEvent.click(screen.getByText('Front'))
    expect(container.querySelector('.flip-inner')).not.toHaveClass('flip-inner-flipped')
  })

  it('leaves a link click to the link', () => {
    const { container } = render(
      <FlipCard front={<a href="/x">Link</a>} back={<span>Back</span>} />,
    )
    fireEvent.click(screen.getByText('Link'))
    expect(container.querySelector('.flip-inner')).not.toHaveClass('flip-inner-flipped')
  })

  it('leaves a button click to the button', () => {
    const { container } = render(
      <FlipCard front={<button type="button">Press</button>} back={<span>Back</span>} />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Press' }))
    expect(container.querySelector('.flip-inner')).not.toHaveClass('flip-inner-flipped')
  })

  it('turns over from the keyboard affordance', () => {
    const { container } = render(<FlipCard front={<span>Front</span>} back={<span>Back</span>} />)
    const button = screen.getByRole('button', { name: 'Flip card' })
    expect(button).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(button)
    expect(button).toHaveAttribute('aria-pressed', 'true')
    expect(container.querySelector('.flip-inner')).toHaveClass('flip-inner-flipped')
  })

  it('uses a custom flip label', () => {
    render(
      <FlipCard front={<span>Front</span>} back={<span>Back</span>} flipLabel="Show the tip" />,
    )
    expect(screen.getByRole('button', { name: 'Show the tip' })).toBeInTheDocument()
  })
})

describe('Tooltip', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not show on hover until the delay has passed', () => {
    render(
      <Tooltip label="Explains the score">
        <button type="button">Score</button>
      </Tooltip>,
    )
    fireEvent.mouseEnter(screen.getByRole('button', { name: 'Score' }))
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    act(() => vi.advanceTimersByTime(250))
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
  })

  it('shows on focus', () => {
    render(
      <Tooltip label="Explains the score">
        <button type="button">Score</button>
      </Tooltip>,
    )
    fireEvent.focus(screen.getByRole('button', { name: 'Score' }))
    act(() => vi.advanceTimersByTime(250))
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
  })

  it('is dismissed with Escape', () => {
    render(
      <Tooltip label="Explains the score">
        <button type="button">Score</button>
      </Tooltip>,
    )
    const trigger = screen.getByRole('button', { name: 'Score' })
    fireEvent.focus(trigger)
    act(() => vi.advanceTimersByTime(250))
    expect(screen.getByRole('tooltip')).toBeInTheDocument()

    // A tooltip that cannot be dismissed traps the keyboard user on it.
    act(() => {
      fireEvent.keyDown(trigger, { key: 'Escape' })
    })
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('hides when the pointer leaves', () => {
    render(
      <Tooltip label="Explains the score">
        <button type="button">Score</button>
      </Tooltip>,
    )
    const trigger = screen.getByRole('button', { name: 'Score' })
    fireEvent.mouseEnter(trigger)
    act(() => vi.advanceTimersByTime(250))
    fireEvent.mouseLeave(trigger)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('hides on blur', () => {
    render(
      <Tooltip label="Explains the score">
        <button type="button">Score</button>
      </Tooltip>,
    )
    const trigger = screen.getByRole('button', { name: 'Score' })
    fireEvent.focus(trigger)
    act(() => vi.advanceTimersByTime(250))
    fireEvent.blur(trigger)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('describes its trigger while it is open', () => {
    render(
      <Tooltip label="Explains the score">
        <button type="button">Score</button>
      </Tooltip>,
    )
    const trigger = screen.getByRole('button', { name: 'Score' })
    fireEvent.mouseEnter(trigger)
    act(() => vi.advanceTimersByTime(250))
    expect(trigger.parentElement).toHaveAttribute('aria-describedby')
  })

  it('renders below the trigger', () => {
    render(
      <Tooltip label="Explains the score" side="bottom">
        <button type="button">Score</button>
      </Tooltip>,
    )
    fireEvent.mouseEnter(screen.getByRole('button', { name: 'Score' }))
    act(() => vi.advanceTimersByTime(250))
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
  })

  it('does not open after the component is gone', () => {
    const { unmount } = render(
      <Tooltip label="Explains the score">
        <button type="button">Score</button>
      </Tooltip>,
    )
    fireEvent.mouseEnter(screen.getByRole('button', { name: 'Score' }))
    unmount()
    expect(() => act(() => vi.advanceTimersByTime(250))).not.toThrow()
  })

  it('restarts the delay when the pointer comes back', () => {
    render(
      <Tooltip label="Explains the score">
        <button type="button">Score</button>
      </Tooltip>,
    )
    const trigger = screen.getByRole('button', { name: 'Score' })
    fireEvent.mouseEnter(trigger)
    act(() => vi.advanceTimersByTime(150))
    fireEvent.mouseEnter(trigger)
    act(() => vi.advanceTimersByTime(150))
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    act(() => vi.advanceTimersByTime(100))
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
  })

  it('hides at once when the pointer leaves without a pending open', () => {
    render(
      <Tooltip label="Explains the score">
        <button type="button">Score</button>
      </Tooltip>,
    )
    fireEvent.mouseLeave(screen.getByRole('button', { name: 'Score' }))
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('can be removed without ever being hovered', () => {
    const { unmount } = render(
      <Tooltip label="Explains the score">
        <button type="button">Score</button>
      </Tooltip>,
    )
    expect(() => unmount()).not.toThrow()
  })
})

describe('HoverCard', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('opens after the hover delay', () => {
    render(
      <HoverCard trigger={<span>Trigger</span>}>
        <span>Card body</span>
      </HoverCard>,
    )
    fireEvent.mouseEnter(screen.getByText('Trigger'))
    act(() => vi.advanceTimersByTime(200))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('closes after the leave delay', () => {
    render(
      <HoverCard trigger={<span>Trigger</span>}>
        <span>Card body</span>
      </HoverCard>,
    )
    const trigger = screen.getByText('Trigger')
    fireEvent.mouseEnter(trigger)
    act(() => vi.advanceTimersByTime(200))
    fireEvent.mouseLeave(trigger)
    act(() => vi.advanceTimersByTime(120))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('opens on focus and closes on blur', () => {
    render(
      <HoverCard trigger={<button type="button">Trigger</button>}>
        <span>Card body</span>
      </HoverCard>,
    )
    const trigger = screen.getByRole('button', { name: 'Trigger' })
    fireEvent.focus(trigger)
    act(() => vi.advanceTimersByTime(200))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.blur(trigger)
    act(() => vi.advanceTimersByTime(120))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('does not open after the component is gone', () => {
    const { unmount } = render(
      <HoverCard trigger={<span>Trigger</span>}>
        <span>Card body</span>
      </HoverCard>,
    )
    fireEvent.mouseEnter(screen.getByText('Trigger'))
    unmount()
    expect(() => act(() => vi.advanceTimersByTime(200))).not.toThrow()
  })

  it('restarts the open delay when the pointer comes back', () => {
    render(
      <HoverCard trigger={<span>Trigger</span>}>
        <span>Card body</span>
      </HoverCard>,
    )
    const trigger = screen.getByText('Trigger')
    fireEvent.mouseEnter(trigger)
    act(() => vi.advanceTimersByTime(150))
    fireEvent.mouseEnter(trigger)
    act(() => vi.advanceTimersByTime(150))
    // The first hover's timer was replaced, so the card is not open yet.
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    act(() => vi.advanceTimersByTime(50))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('closes at once when the pointer leaves without a pending open', () => {
    render(
      <HoverCard trigger={<span>Trigger</span>}>
        <span>Card body</span>
      </HoverCard>,
    )
    fireEvent.mouseLeave(screen.getByText('Trigger'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('closes at once when focus leaves without a pending open', () => {
    render(
      <HoverCard trigger={<button type="button">Trigger</button>}>
        <span>Card body</span>
      </HoverCard>,
    )
    fireEvent.blur(screen.getByRole('button', { name: 'Trigger' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('can be removed without ever being hovered', () => {
    const { unmount } = render(
      <HoverCard trigger={<span>Trigger</span>}>
        <span>Card body</span>
      </HoverCard>,
    )
    expect(() => unmount()).not.toThrow()
  })
})

describe('ConfettiBurst', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders nothing until it is fired', () => {
    const { container } = render(<ConfettiBurst fire={false} />)
    expect(container.querySelector('.confetti-origin')).toBeNull()
  })

  it('throws a burst of particles when fired', () => {
    const { container, rerender } = render(<ConfettiBurst fire={false} />)
    rerender(<ConfettiBurst fire count={10} />)
    expect(container.querySelectorAll('.confetti-particle')).toHaveLength(10)
  })

  it('does not burst on the first render when it starts fired', () => {
    // The trigger is a change in the prop, not its initial value.
    const { container } = render(<ConfettiBurst fire count={10} />)
    expect(container.querySelector('.confetti-origin')).toBeNull()
  })

  it('cleans itself up after the flight', () => {
    const { container, rerender } = render(<ConfettiBurst fire={false} />)
    rerender(<ConfettiBurst fire />)
    act(() => vi.advanceTimersByTime(2400))
    expect(container.querySelector('.confetti-origin')).toBeNull()
  })

  it('fires again on a second trigger', () => {
    const { container, rerender } = render(<ConfettiBurst fire={false} />)
    rerender(<ConfettiBurst fire />)
    rerender(<ConfettiBurst fire={false} />)
    rerender(<ConfettiBurst fire />)
    // The first burst has not finished its flight yet, so both are on screen.
    expect(container.querySelectorAll('.confetti-origin')).toHaveLength(2)
  })
})

describe('ToastProvider', () => {
  function Push({
    message,
    tone,
  }: {
    message: string
    tone?: 'brand' | 'mint' | 'amber' | 'rose'
  }) {
    const toast = useToast()
    return (
      <button type="button" onClick={() => toast.push(message, tone)}>
        Push
      </button>
    )
  }

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows a pushed message', () => {
    render(
      <ToastProvider>
        <Push message="Saved" />
      </ToastProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Push' }))
    expect(screen.getByText('Saved')).toBeInTheDocument()
  })

  it('defaults to the mint tone', () => {
    render(
      <ToastProvider>
        <Push message="Saved" />
      </ToastProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Push' }))
    expect(screen.getByText('Saved').closest('.card-solid')?.className).toContain(
      'border-mint-500/40',
    )
  })

  it.each(['brand', 'mint', 'amber', 'rose'] as const)('renders the %s tone', (tone) => {
    render(
      <ToastProvider>
        <Push message="Saved" tone={tone} />
      </ToastProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Push' }))
    expect(screen.getByText('Saved')).toBeInTheDocument()
  })

  it('ages a toast out', () => {
    render(
      <ToastProvider>
        <Push message="Saved" />
      </ToastProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Push' }))
    act(() => vi.advanceTimersByTime(4200))
    act(() => vi.advanceTimersByTime(160))
    expect(screen.queryByText('Saved')).not.toBeInTheDocument()
  })

  it('keeps at most four toasts on screen', () => {
    render(
      <ToastProvider>
        <Push message="One" />
      </ToastProvider>,
    )
    const button = screen.getByRole('button', { name: 'Push' })
    for (const message of ['One', 'Two', 'Three', 'Four', 'Five']) {
      fireEvent.click(button)
      screen.getByRole('button', { name: 'Push' })
      void message
    }
    // The provider keeps the newest three plus the one being pushed.
    expect(screen.getAllByText(/^(One|Two|Three|Four|Five)$/).length).toBeLessThanOrEqual(4)
  })

  it('offers a success shorthand', () => {
    function Success() {
      const toast = useToast()
      return (
        <button type="button" onClick={() => toast.success('Done')}>
          Succeed
        </button>
      )
    }
    render(
      <ToastProvider>
        <Success />
      </ToastProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Succeed' }))
    expect(screen.getByText('Done')).toBeInTheDocument()
  })

  it('offers an error shorthand', () => {
    function Failure() {
      const toast = useToast()
      return (
        <button type="button" onClick={() => toast.error('Failed')}>
          Fail
        </button>
      )
    }
    render(
      <ToastProvider>
        <Failure />
      </ToastProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Fail' }))
    expect(screen.getByText('Failed')).toBeInTheDocument()
  })

  it('announces politely', () => {
    const { container } = render(
      <ToastProvider>
        <Push message="Saved" />
      </ToastProvider>,
    )
    expect(container.querySelector('[aria-live="polite"]')).toBeInTheDocument()
  })
})
