import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, screen } from '@testing-library/react'
import { renderRoute } from '../helpers/render'
import { makeMockTest } from '../helpers/factories'
import { useTest } from '../../src/store/useTest'

/* ---------------------------------------------------------------------------
   Starting a drill while one is already being built.

   The page refuses to build two drills at once. The start button is disabled
   while the first drill is being assembled, so the guard can only be reached
   through the overwrite prompt, which stays open while the page is busy. The
   assembler in this file never finishes loading, which keeps the page in its
   "building" state for as long as the test needs it.
   --------------------------------------------------------------------------- */

const stubs = vi.hoisted(() => ({
  /** Lets the assembler finish once the test is done with it. */
  release: { value: null as (() => void) | null },
  buildDrillMock: vi.fn(),
}))

vi.mock('../../src/domain/assemble', async () => {
  await new Promise<void>((resolve) => {
    stubs.release.value = resolve
  })
  return { buildDrillMock: (...args: unknown[]) => stubs.buildDrillMock(...args) }
})

const Practice = (await import('../../src/pages/Practice')).default

function startButtons(): HTMLElement[] {
  return screen.getAllByRole('button', { name: /^Start drill/ })
}

describe('Practice while a drill is being built', () => {
  beforeEach(() => {
    // A drill with nothing in it: the page leaves it alone and waits.
    stubs.buildDrillMock.mockImplementation(() => makeMockTest({ sections: [] }))
    useTest.setState({ mock: makeMockTest(), status: 'running' })
  })

  afterEach(async () => {
    // Let the assembler finish so the page can settle down again.
    await act(async () => {
      stubs.release.value?.()
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
  })

  it('builds only one drill when a second one is asked for', async () => {
    renderRoute(<Practice />, '/practice')

    // The prompt opens, because a test is already running.
    await act(async () => {
      fireEvent.click(startButtons()[0]!)
    })
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    // The active test finishes while the prompt is still open.
    await act(async () => {
      useTest.setState({ status: 'finished' })
    })

    // The drill is assembled straight away now, and the page waits for it.
    await act(async () => {
      fireEvent.click(startButtons()[0]!)
    })
    expect(screen.getAllByRole('button', { name: 'Preparing drill…' })[0]).toBeDisabled()

    // The prompt is still open, and the second attempt is ignored.
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Discard & Start drill' }))
    })

    expect(stubs.buildDrillMock).not.toHaveBeenCalled()
  }, 60_000)
})
