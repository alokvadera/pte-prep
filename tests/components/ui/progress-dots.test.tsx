import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { ProgressDots } from '../../../src/components/ui/progress-dots'

/* ---------------------------------------------------------------------------
   The section rail before the client takes over.

   The rail is portalled into the document body so it stays fixed in every
   section of a long page. That is only safe once the page has hydrated: the
   server markup has to stay where it was written, or the first paint and the
   hydrated tree disagree.

   `useClientReady` is the hook that answers that question, so it is the one
   thing stubbed here — the component itself is exercised untouched.
   --------------------------------------------------------------------------- */

vi.mock('../../../src/lib/useClientReady', () => ({
  useClientReady: () => false,
}))

describe('ProgressDots before hydration', () => {
  const sections = [
    { id: 'intro', label: 'Introduction' },
    { id: 'body', label: 'The body' },
  ]

  it('renders the rail where it was written instead of in a portal', () => {
    const { container } = render(<ProgressDots sections={sections} />)
    expect(container.firstChild).not.toBeNull()
    expect(container.querySelector('nav')).toBeInTheDocument()
  })

  it('still names the sections', () => {
    const { container } = render(<ProgressDots sections={sections} />)
    expect(container.querySelector('nav')?.getAttribute('aria-label')).toBe(
      'Page section navigation',
    )
    expect(container.querySelectorAll('button')).toHaveLength(2)
  })

  it('still shows the section index', () => {
    const { container } = render(<ProgressDots sections={sections} />)
    expect(container.textContent).toContain('01')
  })
})
