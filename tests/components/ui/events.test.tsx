import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import {
  OPEN_COMMAND_PALETTE_EVENT,
  openCommandPalette,
} from '../../../src/components/ui/command-palette-events'
import DottedGlowBackgroundDemo from '../../../src/components/ui/dotted-glow-background-demo'

/* ---------------------------------------------------------------------------
   The palette's entry point, and the canvas background's showcase.

   The event module lives apart from the component so that the component file
   exports nothing but a component; the two have to agree on the event name.
   --------------------------------------------------------------------------- */

describe('the command palette event', () => {
  it('uses a name the component listens for', () => {
    expect(OPEN_COMMAND_PALETTE_EVENT).toBe('open-command-palette')
  })

  it('dispatches the event on the window', () => {
    const listener = vi.fn()
    window.addEventListener(OPEN_COMMAND_PALETTE_EVENT, listener)

    openCommandPalette()

    expect(listener).toHaveBeenCalled()
    window.removeEventListener(OPEN_COMMAND_PALETTE_EVENT, listener)
  })

  it('dispatches a custom event carrying the name', () => {
    const listener = vi.fn()
    window.addEventListener(OPEN_COMMAND_PALETTE_EVENT, listener)

    openCommandPalette()

    expect(listener.mock.calls[0]?.[0]).toBeInstanceOf(CustomEvent)
    window.removeEventListener(OPEN_COMMAND_PALETTE_EVENT, listener)
  })
})

describe('the dotted glow background demo', () => {
  it('renders the showcase', () => {
    const { container } = render(<DottedGlowBackgroundDemo />)
    expect(container.firstChild).toBeInTheDocument()
  })
})
