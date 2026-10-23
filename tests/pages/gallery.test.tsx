import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import UiElements from '../../src/pages/UiElements'
import { renderWithProviders } from '../helpers/render'

/* ---------------------------------------------------------------------------
   The component gallery.

   The gallery exists so that every component in the kit can be seen in one
   place. That makes it the one page where a broken prop, a bad default or a
   crash in a rarely used component shows up at all.
   --------------------------------------------------------------------------- */

function renderGallery() {
  return render(
    <MemoryRouter initialEntries={['/ui-elements']}>
      <UiElements />
    </MemoryRouter>,
  )
}

describe('the component gallery', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders every demo', () => {
    renderGallery()
    expect(screen.getByText('Popover')).toBeInTheDocument()
    expect(screen.getByText('Dialog')).toBeInTheDocument()
  })

  it('fires the confetti on its own', () => {
    renderGallery()
    act(() => vi.advanceTimersByTime(600))
    expect(screen.getByRole('button', { name: 'Celebrate again' })).toBeInTheDocument()
  })

  it('fires the confetti again when asked', () => {
    renderGallery()
    act(() => vi.advanceTimersByTime(600))

    act(() => {
      screen.getByRole('button', { name: 'Celebrate again' }).click()
    })
    act(() => vi.advanceTimersByTime(100))

    expect(screen.getByRole('button', { name: 'Celebrate again' })).toBeInTheDocument()
  })

  it('raises a success toast', () => {
    renderWithProviders(<UiElements />, { route: '/ui-elements' })
    act(() => vi.advanceTimersByTime(600))

    act(() => {
      screen.getByRole('button', { name: 'Success toast' }).click()
    })

    expect(screen.getByText('Your progress was synced to the cloud.')).toBeInTheDocument()
  })

  it('raises an error toast', () => {
    renderWithProviders(<UiElements />, { route: '/ui-elements' })
    act(() => vi.advanceTimersByTime(600))

    act(() => {
      screen.getByRole('button', { name: 'Error toast' }).click()
    })

    expect(screen.getByText('Could not reach the server.')).toBeInTheDocument()
  })

  it('opens and closes the dialog', () => {
    renderGallery()
    act(() => vi.advanceTimersByTime(600))

    act(() => {
      screen.getByRole('button', { name: 'Open dialog' }).click()
    })
    // The native dialog is always in the document — the title is rendered
    // whether it is showing or not — so the open state is what says it is
    // showing, and the dialog has to be named: the page carries more than one.
    const dialog = screen.getByRole('dialog', { name: 'Exit the test?' })
    expect(dialog).toHaveAttribute('open')

    act(() => {
      screen.getByRole('button', { name: 'Keep going' }).click()
    })
    expect(dialog).not.toHaveAttribute('open')
  })

  it('closes the dialog from its other action', () => {
    renderGallery()
    act(() => vi.advanceTimersByTime(600))

    act(() => {
      screen.getByRole('button', { name: 'Open dialog' }).click()
    })
    const dialog = screen.getByRole('dialog', { name: 'Exit the test?' })
    expect(dialog).toHaveAttribute('open')

    act(() => {
      screen.getByRole('button', { name: 'Exit' }).click()
    })

    expect(dialog).not.toHaveAttribute('open')
  })

  it('opens and closes the alert dialog', () => {
    renderGallery()
    act(() => vi.advanceTimersByTime(600))

    act(() => {
      screen.getByRole('button', { name: 'Clear history' }).click()
    })
    // The page carries more than one dialog, so the alert one is named rather
    // than picked by position.
    const dialog = screen.getByRole('dialog', { name: 'Clear all attempts?' })
    expect(dialog).toHaveAttribute('open')

    act(() => {
      screen.getByRole('button', { name: 'Clear' }).click()
    })
    expect(dialog).not.toHaveAttribute('open')
  })
})
