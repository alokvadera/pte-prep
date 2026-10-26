import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import {
  Accordion,
  Badge,
  Button,
  ButtonLink,
  Callout,
  Card,
  CardTitle,
  CtaBand,
  Disclosure,
  EmptyState,
  KeyFigure,
  NumMarker,
  PageHeading,
  PageWrapper,
  ProgressBar,
  SectionBand,
  SectionHeading,
  Stat,
  TickList,
  Toggle,
} from '../../../src/components/ui/primitives'
import { renderWithProviders } from '../../helpers/render'

/* ---------------------------------------------------------------------------
   The primitives.

   Every surface in the app is one of these: a card, a button, a heading, a
   band, a note. They are dull on purpose — the point of the file is that
   there is one of each, and that they all behave the same way wherever they
   are used.

   What still needs testing is the matrix: every variant, every tone, every
   element a polymorphic component can become, and every optional part left
   out.
   --------------------------------------------------------------------------- */

describe('Card', () => {
  it('renders a div by default', () => {
    const { container } = renderWithProviders(<Card>Body</Card>)
    expect(container.firstChild?.nodeName).toBe('DIV')
  })

  it.each(['div', 'section', 'article', 'li'] as const)('renders as a %s', (as) => {
    const { container } = renderWithProviders(<Card as={as}>Body</Card>)
    expect(container.firstChild?.nodeName).toBe(as.toUpperCase())
  })

  it.each([
    ['default', 'card'],
    ['solid', 'card-solid'],
    ['exam', 'card-exam'],
  ] as const)('renders the %s variant', (variant, utility) => {
    const { container } = renderWithProviders(<Card variant={variant}>Body</Card>)
    expect(container.firstChild).toHaveClass(utility)
  })

  it('keeps its padding by default', () => {
    const { container } = renderWithProviders(<Card>Body</Card>)
    expect(container.firstChild).not.toHaveClass('p-0')
  })

  it('drops its padding when it is flushed', () => {
    const { container } = renderWithProviders(<Card flush>Body</Card>)
    expect(container.firstChild).toHaveClass('p-0')
  })

  it('takes a class name', () => {
    const { container } = renderWithProviders(<Card className="mt-4">Body</Card>)
    expect(container.firstChild).toHaveClass('mt-4')
  })

  it('passes its other props through', () => {
    const { container } = renderWithProviders(
      <Card id="a-card" data-testid="card">
        Body
      </Card>,
    )
    expect(container.firstChild).toHaveAttribute('id', 'a-card')
    expect(container.firstChild).toHaveAttribute('data-testid', 'card')
  })
})

describe('CardTitle', () => {
  it('renders a heading', () => {
    renderWithProviders(<CardTitle>The title</CardTitle>)
    expect(screen.getByRole('heading', { level: 3, name: 'The title' })).toBeInTheDocument()
  })

  it('takes a class name', () => {
    renderWithProviders(<CardTitle className="text-2xl">The title</CardTitle>)
    expect(screen.getByRole('heading', { level: 3 })).toHaveClass('text-2xl')
  })

  it('passes its other props through', () => {
    renderWithProviders(<CardTitle id="the-title">The title</CardTitle>)
    expect(screen.getByRole('heading', { level: 3 })).toHaveAttribute('id', 'the-title')
  })
})

describe('Button', () => {
  it('renders a button', () => {
    renderWithProviders(<Button>Press</Button>)
    expect(screen.getByRole('button', { name: 'Press' })).toBeInTheDocument()
  })

  it.each([
    ['primary', 'btn-primary'],
    ['secondary', 'btn-secondary'],
    ['ghost', 'btn-ghost'],
    ['danger', 'btn-danger'],
  ] as const)('renders the %s variant', (variant, utility) => {
    renderWithProviders(<Button variant={variant}>Press</Button>)
    expect(screen.getByRole('button', { name: 'Press' })).toHaveClass(utility)
  })

  it.each([
    ['sm', 'px-3.5'],
    ['md', 'px-6'],
    ['lg', 'px-7'],
  ] as const)('renders the %s size', (size, utility) => {
    renderWithProviders(<Button size={size}>Press</Button>)
    expect(screen.getByRole('button', { name: 'Press' })).toHaveClass(utility)
  })

  it('reports a click', () => {
    const onClick = vi.fn()
    renderWithProviders(<Button onClick={onClick}>Press</Button>)
    fireEvent.click(screen.getByRole('button', { name: 'Press' }))
    expect(onClick).toHaveBeenCalled()
  })

  it('takes a class name', () => {
    renderWithProviders(<Button className="w-full">Press</Button>)
    expect(screen.getByRole('button', { name: 'Press' })).toHaveClass('w-full')
  })

  it('wraps itself in a magnetic holder when asked', () => {
    const { container } = renderWithProviders(<Button magnetic>Press</Button>)
    expect(container.firstChild?.nodeName).not.toBe('BUTTON')
    expect(screen.getByRole('button', { name: 'Press' })).toBeInTheDocument()
  })

  it('is a plain button without the magnetic holder', () => {
    const { container } = renderWithProviders(<Button>Press</Button>)
    expect(container.firstChild?.nodeName).toBe('BUTTON')
  })
})

describe('ButtonLink', () => {
  it('renders a link', () => {
    renderWithProviders(<ButtonLink to="/mock">Start</ButtonLink>)
    expect(screen.getByRole('link', { name: 'Start' })).toHaveAttribute('href', '/mock')
  })

  it.each([
    ['primary', 'btn-primary'],
    ['secondary', 'btn-secondary'],
    ['ghost', 'btn-ghost'],
    ['danger', 'btn-danger'],
  ] as const)('renders the %s variant', (variant, utility) => {
    renderWithProviders(
      <ButtonLink to="/mock" variant={variant}>
        Start
      </ButtonLink>,
    )
    expect(screen.getByRole('link', { name: 'Start' })).toHaveClass(utility)
  })

  it.each([
    ['sm', 'px-3.5'],
    ['md', 'px-6'],
    ['lg', 'px-7'],
  ] as const)('renders the %s size', (size, utility) => {
    renderWithProviders(
      <ButtonLink to="/mock" size={size}>
        Start
      </ButtonLink>,
    )
    expect(screen.getByRole('link', { name: 'Start' })).toHaveClass(utility)
  })

  it('wraps itself in a magnetic holder when asked', () => {
    const { container } = renderWithProviders(
      <ButtonLink to="/mock" magnetic>
        Start
      </ButtonLink>,
    )
    expect(container.firstChild?.nodeName).not.toBe('A')
    expect(screen.getByRole('link', { name: 'Start' })).toBeInTheDocument()
  })

  it('is a plain link without the magnetic holder', () => {
    const { container } = renderWithProviders(<ButtonLink to="/mock">Start</ButtonLink>)
    expect(container.firstChild?.nodeName).toBe('A')
  })
})

describe('Accordion', () => {
  const items = [
    { question: 'What is the PTE?', answer: 'An academic English test.' },
    { question: 'How long is it?', answer: 'Two hours.' },
  ]

  it('renders every question', () => {
    renderWithProviders(<Accordion items={items} />)
    expect(screen.getByText('What is the PTE?')).toBeInTheDocument()
    expect(screen.getByText('How long is it?')).toBeInTheDocument()
  })

  it('renders every answer', () => {
    renderWithProviders(<Accordion items={items} />)
    expect(screen.getByText('An academic English test.')).toBeInTheDocument()
    expect(screen.getByText('Two hours.')).toBeInTheDocument()
  })

  it('opens and closes on the keyboard', () => {
    renderWithProviders(<Accordion items={items} />)
    const summary = screen.getByText('What is the PTE?').closest('summary') as HTMLElement
    expect(summary.parentElement).not.toHaveAttribute('open')
    fireEvent.click(summary)
    expect(summary.parentElement).toHaveAttribute('open')
  })

  it('takes a class name', () => {
    const { container } = renderWithProviders(<Accordion items={items} className="mt-4" />)
    expect(container.firstChild).toHaveClass('mt-4')
  })
})

describe('Disclosure', () => {
  it('renders its summary', () => {
    renderWithProviders(
      <Disclosure summary="The answer">
        <span>Body</span>
      </Disclosure>,
    )
    expect(screen.getByText('The answer')).toBeInTheDocument()
  })

  it('starts closed', () => {
    const { container } = renderWithProviders(
      <Disclosure summary="The answer">
        <span>Body</span>
      </Disclosure>,
    )
    expect(container.querySelector('details')).not.toHaveAttribute('open')
  })

  it('starts open when it is told to', () => {
    const { container } = renderWithProviders(
      <Disclosure summary="The answer" defaultOpen>
        <span>Body</span>
      </Disclosure>,
    )
    expect(container.querySelector('details')).toHaveAttribute('open')
  })

  it('takes a class name', () => {
    const { container } = renderWithProviders(
      <Disclosure summary="The answer" className="mt-4">
        <span>Body</span>
      </Disclosure>,
    )
    expect(container.firstChild).toHaveClass('mt-4')
  })
})

describe('PageWrapper', () => {
  it('renders the title', () => {
    renderWithProviders(
      <PageWrapper title="The page">
        <span>Body</span>
      </PageWrapper>,
    )
    expect(screen.getByRole('heading', { level: 1, name: 'The page' })).toBeInTheDocument()
  })

  it.each([
    ['prose', 'page-shell-prose'],
    ['content', 'page-shell-content'],
    ['app', 'page-shell-app'],
  ] as const)('uses the %s shell', (size, shell) => {
    const { container } = renderWithProviders(
      <PageWrapper size={size} title="The page">
        <span>Body</span>
      </PageWrapper>,
    )
    expect(container.firstChild).toHaveClass(shell)
  })

  it('renders the breadcrumbs when they are given', () => {
    renderWithProviders(
      <PageWrapper title="The page" breadcrumbs={<span>Crumbs</span>}>
        <span>Body</span>
      </PageWrapper>,
    )
    expect(screen.getByText('Crumbs')).toBeInTheDocument()
  })

  it('leaves the breadcrumbs out when they are not', () => {
    const { container } = renderWithProviders(
      <PageWrapper title="The page">
        <span>Body</span>
      </PageWrapper>,
    )
    expect(container.querySelector('.mb-6')).toBeNull()
  })

  it('renders the eyebrow, the description and the actions', () => {
    renderWithProviders(
      <PageWrapper
        title="The page"
        eyebrow="A kicker"
        description="A description"
        actions={<button type="button">Act</button>}
      >
        <span>Body</span>
      </PageWrapper>,
    )
    expect(screen.getByText('A kicker')).toBeInTheDocument()
    expect(screen.getByText('A description')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Act' })).toBeInTheDocument()
  })

  it('renders no heading at all when there is nothing to say', () => {
    const { container } = renderWithProviders(
      <PageWrapper title={null}>
        <span>Body</span>
      </PageWrapper>,
    )
    expect(container.querySelector('.page-heading')).toBeNull()
  })

  it('takes a class name', () => {
    const { container } = renderWithProviders(
      <PageWrapper title="The page" className="mt-8">
        <span>Body</span>
      </PageWrapper>,
    )
    expect(container.firstChild).toHaveClass('mt-8')
  })
})

describe('PageHeading', () => {
  it('renders the title', () => {
    renderWithProviders(<PageHeading title="The page" />)
    expect(screen.getByRole('heading', { level: 1, name: 'The page' })).toBeInTheDocument()
  })

  it('renders the eyebrow, the description and the actions', () => {
    renderWithProviders(
      <PageHeading
        title="The page"
        eyebrow="A kicker"
        description="A description"
        actions={<button type="button">Act</button>}
      />,
    )
    expect(screen.getByText('A kicker')).toBeInTheDocument()
    expect(screen.getByText('A description')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Act' })).toBeInTheDocument()
  })

  it('leaves out the parts it was not given', () => {
    const { container } = renderWithProviders(<PageHeading title="The page" />)
    expect(container.querySelector('.page-heading-kicker')).toBeNull()
    expect(container.querySelector('.page-intro')).toBeNull()
  })
})

describe('SectionHeading', () => {
  it('renders the title as a second-level heading', () => {
    renderWithProviders(<SectionHeading title="The section" />)
    expect(screen.getByRole('heading', { level: 2, name: 'The section' })).toBeInTheDocument()
  })

  it('renders the eyebrow, the description and the action', () => {
    renderWithProviders(
      <SectionHeading
        title="The section"
        eyebrow="A kicker"
        description="A description"
        action={<button type="button">Act</button>}
      />,
    )
    expect(screen.getByText('A kicker')).toBeInTheDocument()
    expect(screen.getByText('A description')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Act' })).toBeInTheDocument()
  })

  it('keeps the id on the heading so it can be linked to', () => {
    renderWithProviders(<SectionHeading title="The section" id="the-section" />)
    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading).toHaveAttribute('id', 'the-section')
    expect(heading).toHaveClass('scroll-mt-24')
  })

  it('leaves the scroll margin off when there is no id', () => {
    renderWithProviders(<SectionHeading title="The section" />)
    expect(screen.getByRole('heading', { level: 2 })).not.toHaveClass('scroll-mt-24')
  })

  it('takes a class name', () => {
    const { container } = renderWithProviders(
      <SectionHeading title="The section" className="mt-8" />,
    )
    expect(container.firstChild).toHaveClass('mt-8')
  })
})

describe('Badge', () => {
  it('renders its children', () => {
    renderWithProviders(<Badge>New</Badge>)
    expect(screen.getByText('New')).toBeInTheDocument()
  })

  it.each(['neutral', 'brand', 'mint', 'amber', 'rose'] as const)('renders the %s tone', (tone) => {
    const { container } = renderWithProviders(<Badge tone={tone}>New</Badge>)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('takes a class name', () => {
    const { container } = renderWithProviders(<Badge className="px-4">New</Badge>)
    expect(container.firstChild).toHaveClass('px-4')
  })
})

describe('Stat', () => {
  it('renders a plain count', () => {
    renderWithProviders(<Stat label="Attempts" value={12} />)
    expect(screen.getByText('Attempts')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
  })

  it('renders a figure that is already formatted', () => {
    renderWithProviders(<Stat label="Best" value="78 / 90" />)
    expect(screen.getByText('78 / 90')).toBeInTheDocument()
  })

  it('renders the note', () => {
    renderWithProviders(<Stat label="Attempts" value={12} sub="This week" />)
    expect(screen.getByText('This week')).toBeInTheDocument()
  })

  it('leaves the note out when there is none', () => {
    const { container } = renderWithProviders(<Stat label="Attempts" value={12} />)
    expect(container.querySelectorAll('p')).toHaveLength(1)
  })

  it.each(['neutral', 'brand', 'mint', 'amber', 'rose'] as const)('renders the %s tone', (tone) => {
    const { container } = renderWithProviders(<Stat label="Attempts" value={12} tone={tone} />)
    expect(container.querySelector('p.mt-1')).toBeInTheDocument()
  })
})

describe('ProgressBar', () => {
  it('reports the value as a percentage', () => {
    renderWithProviders(<ProgressBar value={45} max={90} label="Score" />)
    expect(screen.getByRole('progressbar', { name: 'Score' })).toHaveAttribute(
      'aria-valuenow',
      '50',
    )
  })

  it('fills the track in proportion to the value', () => {
    const { container } = renderWithProviders(<ProgressBar value={45} max={90} label="Score" />)
    expect(container.querySelector('[style*="width"]')).toHaveStyle({ width: '50%' })
  })

  it('fills half the track for half of the maximum', () => {
    const { container } = renderWithProviders(<ProgressBar value={45} max={90} label="Score" />)
    expect(container.querySelector('[style*="width"]')).toHaveStyle({ width: '50%' })
  })

  it('clamps a value above the maximum', () => {
    renderWithProviders(<ProgressBar value={120} max={90} label="Score" />)
    expect(screen.getByRole('progressbar', { name: 'Score' })).toHaveAttribute(
      'aria-valuenow',
      '100',
    )
  })

  it('clamps a value below zero', () => {
    renderWithProviders(<ProgressBar value={-20} max={90} label="Score" />)
    expect(screen.getByRole('progressbar', { name: 'Score' })).toHaveAttribute('aria-valuenow', '0')
  })

  it('shows nothing for a maximum of zero', () => {
    renderWithProviders(<ProgressBar value={50} max={0} label="Score" />)
    expect(screen.getByRole('progressbar', { name: 'Score' })).toHaveAttribute('aria-valuenow', '0')
  })

  it.each(['brand', 'mint', 'amber', 'rose'] as const)('renders the %s tone', (tone) => {
    const { container } = renderWithProviders(
      <ProgressBar value={45} max={90} tone={tone} label="Score" />,
    )
    expect(container.querySelector('[style*="width"]')).toBeInTheDocument()
  })

  it('takes a class name', () => {
    const { container } = renderWithProviders(
      <ProgressBar value={45} max={90} label="Score" className="mt-2" />,
    )
    expect(container.firstChild).toHaveClass('mt-2')
  })
})

describe('Toggle', () => {
  it('renders a switch', () => {
    renderWithProviders(<Toggle checked={false} onChange={() => {}} label="Sound" />)
    expect(screen.getByRole('switch', { name: 'Sound' })).toBeInTheDocument()
  })

  it('reflects the checked state', () => {
    renderWithProviders(<Toggle checked onChange={() => {}} label="Sound" />)
    expect(screen.getByRole('switch', { name: 'Sound' })).toBeChecked()
  })

  it('reports a change', () => {
    const onChange = vi.fn()
    renderWithProviders(<Toggle checked={false} onChange={onChange} label="Sound" />)
    fireEvent.click(screen.getByRole('switch', { name: 'Sound' }))
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('renders the description', () => {
    renderWithProviders(
      <Toggle checked={false} onChange={() => {}} label="Sound" description="Play a chime" />,
    )
    expect(screen.getByText('Play a chime')).toBeInTheDocument()
  })

  it('leaves the description out when there is none', () => {
    renderWithProviders(<Toggle checked={false} onChange={() => {}} label="Sound" />)
    expect(screen.queryByText('Play a chime')).not.toBeInTheDocument()
  })
})

describe('EmptyState', () => {
  it('renders the title and the description', () => {
    renderWithProviders(<EmptyState title="Nothing here" description="Try again later" />)
    expect(screen.getByRole('heading', { level: 2, name: 'Nothing here' })).toBeInTheDocument()
    expect(screen.getByText('Try again later')).toBeInTheDocument()
  })

  it('renders the icon', () => {
    renderWithProviders(
      <EmptyState
        icon={<span data-testid="icon" />}
        title="Nothing here"
        description="Try again later"
      />,
    )
    expect(screen.getByTestId('icon')).toBeInTheDocument()
  })

  it('leaves the icon out when there is none', () => {
    const { container } = renderWithProviders(
      <EmptyState title="Nothing here" description="Try again later" />,
    )
    expect(container.querySelector('.mb-3')).toBeNull()
  })

  it('renders the action', () => {
    renderWithProviders(
      <EmptyState
        title="Nothing here"
        description="Try again later"
        action={<button type="button">Start</button>}
      />,
    )
    expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument()
  })

  it('leaves the action out when there is none', () => {
    const { container } = renderWithProviders(
      <EmptyState title="Nothing here" description="Try again later" />,
    )
    expect(container.querySelector('.mt-5')).toBeNull()
  })
})

describe('CtaBand', () => {
  it('renders the title and the description', () => {
    renderWithProviders(
      <CtaBand
        title="Ready?"
        description="Start a free mock test."
        actions={<button type="button">Start</button>}
      />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Ready?' })).toBeInTheDocument()
    expect(screen.getByText('Start a free mock test.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument()
  })

  it('renders the eyebrow', () => {
    renderWithProviders(
      <CtaBand
        eyebrow="Last thing"
        title="Ready?"
        description="Start a free mock test."
        actions={<button type="button">Start</button>}
      />,
    )
    expect(screen.getByText('Last thing')).toBeInTheDocument()
  })

  it('leaves the eyebrow out when there is none', () => {
    const { container } = renderWithProviders(
      <CtaBand
        title="Ready?"
        description="Start a free mock test."
        actions={<button type="button">Start</button>}
      />,
    )
    expect(container.querySelector('.uppercase')).toBeNull()
  })

  it('takes a class name', () => {
    const { container } = renderWithProviders(
      <CtaBand
        title="Ready?"
        description="Start a free mock test."
        actions={<button type="button">Start</button>}
        className="mt-8"
      />,
    )
    expect(container.firstChild).toHaveClass('mt-8')
  })
})

describe('SectionBand', () => {
  it('renders its children', () => {
    renderWithProviders(
      <SectionBand>
        <span>Body</span>
      </SectionBand>,
    )
    expect(screen.getByText('Body')).toBeInTheDocument()
  })

  it('renders a heading when it is given one', () => {
    renderWithProviders(
      <SectionBand title="The band" eyebrow="A kicker" description="A description">
        <span>Body</span>
      </SectionBand>,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'The band' })).toBeInTheDocument()
  })

  it('leaves the heading out when there is none', () => {
    const { container } = renderWithProviders(
      <SectionBand>
        <span>Body</span>
      </SectionBand>,
    )
    expect(container.querySelector('.section-title')).toBeNull()
  })

  it.each([
    ['tint', 'band'],
    ['plain', 'band-plain'],
  ] as const)('renders the %s tone', (tone, utility) => {
    const { container } = renderWithProviders(
      <SectionBand tone={tone}>
        <span>Body</span>
      </SectionBand>,
    )
    expect(container.firstChild).toHaveClass(utility)
  })

  it('takes a class name', () => {
    const { container } = renderWithProviders(
      <SectionBand className="mt-8">
        <span>Body</span>
      </SectionBand>,
    )
    expect(container.firstChild).toHaveClass('mt-8')
  })
})

describe('Callout', () => {
  it('renders its children', () => {
    renderWithProviders(<Callout>Remember this.</Callout>)
    expect(screen.getByText('Remember this.')).toBeInTheDocument()
  })

  it('renders the label', () => {
    renderWithProviders(<Callout label="Note">Remember this.</Callout>)
    expect(screen.getByText('Note')).toBeInTheDocument()
  })

  it('leaves the label out when there is none', () => {
    const { container } = renderWithProviders(<Callout>Remember this.</Callout>)
    expect(container.querySelector('.callout-title')).toBeNull()
  })

  it.each(['brand', 'mint', 'amber', 'rose'] as const)('renders the %s tone', (tone) => {
    const { container } = renderWithProviders(<Callout tone={tone}>Remember this.</Callout>)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('draws a rule down the side when it is asked to', () => {
    const { container } = renderWithProviders(<Callout rule>Remember this.</Callout>)
    expect(container.firstChild).toHaveClass('callout-rule')
  })

  it('draws a full border by default', () => {
    const { container } = renderWithProviders(<Callout>Remember this.</Callout>)
    expect(container.firstChild).not.toHaveClass('callout-rule')
  })

  it('takes a class name', () => {
    const { container } = renderWithProviders(<Callout className="mt-4">Remember this.</Callout>)
    expect(container.firstChild).toHaveClass('mt-4')
  })
})

describe('KeyFigure', () => {
  it('renders the value and the label', () => {
    renderWithProviders(<KeyFigure value="22" label="question types" />)
    expect(screen.getByText('22')).toBeInTheDocument()
    expect(screen.getByText('question types')).toBeInTheDocument()
  })

  it('renders the note', () => {
    renderWithProviders(<KeyFigure value="22" label="question types" note="In every mock" />)
    expect(screen.getByText('In every mock')).toBeInTheDocument()
  })

  it('leaves the note out when there is none', () => {
    const { container } = renderWithProviders(<KeyFigure value="22" label="question types" />)
    expect(container.querySelectorAll('p')).toHaveLength(1)
  })

  it('takes a class name', () => {
    const { container } = renderWithProviders(
      <KeyFigure value="22" label="question types" className="mt-4" />,
    )
    expect(container.firstChild).toHaveClass('mt-4')
  })
})

describe('TickList', () => {
  it('renders every item', () => {
    renderWithProviders(<TickList items={['One', 'Two']} />)
    expect(screen.getByText('One')).toBeInTheDocument()
    expect(screen.getByText('Two')).toBeInTheDocument()
  })

  it.each(['brand', 'mint', 'quiet'] as const)('renders the %s tone', (tone) => {
    const { container } = renderWithProviders(<TickList items={['One']} tone={tone} />)
    expect(container.querySelector('li')).toBeInTheDocument()
  })

  it('takes a class name', () => {
    const { container } = renderWithProviders(<TickList items={['One']} className="mt-4" />)
    expect(container.firstChild).toHaveClass('mt-4')
  })
})

describe('NumMarker', () => {
  it('renders its children', () => {
    renderWithProviders(<NumMarker>1</NumMarker>)
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it.each(['brand', 'mint', 'quiet'] as const)('renders the %s tone', (tone) => {
    const { container } = renderWithProviders(<NumMarker tone={tone}>1</NumMarker>)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('takes a class name', () => {
    const { container } = renderWithProviders(<NumMarker className="mt-4">1</NumMarker>)
    expect(container.firstChild).toHaveClass('mt-4')
  })
})
