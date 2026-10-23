import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import type { ChartSpec } from '../../src/content/schema'
import { ChartRenderer } from '../../src/components/charts/ChartRenderer'

/* ---------------------------------------------------------------------------
   The chart renderer.

   Every Describe Image stimulus is drawn as inline SVG from the data in the
   content bank, so the renderer has to handle six shapes of chart and give
   each one a text alternative built from the data itself.
   --------------------------------------------------------------------------- */

/**
 * Charts that are not in the bank.
 *
 * The renderer defends itself against a chart with no data, against a format
 * it does not know, and against data that is missing or malformed. Those
 * shapes only exist in a corrupt bank, so they are added to the index here
 * rather than being left untested.
 */
const synthetic = vi.hoisted(() => {
  const chart = (id: string, kind: string, data: Record<string, unknown>) => ({
    id,
    title: `Synthetic ${id}`,
    kind,
    caption: 'A synthetic chart.',
    prompt: 'Describe it.',
    keyTerms: [],
    minWords: 25,
    data,
  })
  const series = (name: string, values: number[], color = '#123456') => ({ name, values, color })
  return [
    // Empty charts: the "no data" message.
    chart('synthetic-bar', 'bar', { categories: [], series: [] }),
    chart('synthetic-line', 'line', { x: [], series: [] }),
    chart('synthetic-pie', 'pie', { slices: [] }),
    chart('synthetic-process', 'process', { steps: [] }),
    chart('synthetic-diagram', 'diagram', { nodes: [] }),
    chart('synthetic-table', 'table-chart', { headers: [] }),
    chart('synthetic-table-noheaders', 'table-chart', {}),

    // Missing members.
    chart('synthetic-bar-nocategories', 'bar', { series: [] }),
    chart('synthetic-bar-noseries', 'bar', { categories: ['A'] }),
    chart('synthetic-bar-novalues', 'bar', { categories: ['A'], series: [{ name: 'S', color: '#000' }] }),
    chart('synthetic-bar-shortvalues', 'bar', {
      categories: ['A', 'B'],
      series: [series('S', [1])],
    }),
    chart('synthetic-bar-negative', 'bar', { categories: ['A'], series: [series('S', [-5])] }),
    chart('synthetic-bar-nan', 'bar', { categories: ['A'], series: [series('S', [Number.NaN])] }),
    chart('synthetic-line-nox', 'line', { series: [] }),
    chart('synthetic-line-noseries', 'line', { x: ['A'] }),
    chart('synthetic-line-novalues', 'line', { x: ['A'], series: [{ name: 'S', color: '#000' }] }),
    chart('synthetic-line-positive', 'line', { x: ['A', 'B'], series: [series('S', [1, 2])] }),
    chart('synthetic-pie-noslices', 'pie', {}),
    chart('synthetic-pie-zerovalue', 'pie', {
      slices: [
        { name: 'Empty', value: 0, color: '#000' },
        { name: 'Full', value: 10, color: '#111' },
      ],
    }),
    chart('synthetic-process-nosteps', 'process', {}),
    chart('synthetic-process-shortdetail', 'process', {
      loop: 'A cycle.',
      steps: [
        { label: 'One', detail: 'Short.' },
        { label: 'Two', detail: 'Also short.' },
      ],
    }),
    chart('synthetic-diagram-nonodes', 'diagram', {}),
    chart('synthetic-diagram-noedges', 'diagram', {
      nodes: [{ id: 'a', label: 'A', x: 10, y: 10, kind: 'source' }],
    }),
    chart('synthetic-diagram-badedge', 'diagram', {
      nodes: [{ id: 'a', label: 'A', x: 10, y: 10, kind: 'source' }],
      edges: [['a', 'missing']],
    }),

    // A format the renderer does not know how to draw.
    chart('synthetic-unknown', 'stacked-area', {}),
  ]
})

vi.mock('../../src/content/bank', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/content/bank')>()
  const index = new Map<string, ChartSpec>(actual.CHART_INDEX)
  for (const c of synthetic) index.set(c.id, c as unknown as ChartSpec)
  return { ...actual, CHART_INDEX: index }
})

function renderChart(chartId: string) {
  return render(<ChartRenderer chartId={chartId} />)
}

afterEach(() => {
  cleanup()
})

describe('ChartRenderer', () => {
  it('renders nothing for a chart that does not exist', () => {
    const { container } = renderChart('no-such-chart')

    expect(container).toBeEmptyDOMElement()
  })

  it('renders a bar chart', () => {
    const { container } = renderChart('chart-renewable')

    const figure = container.querySelector('figure') as HTMLElement
    expect(figure).toBeInTheDocument()
    expect(screen.getByText('Electricity generation by source, 1990–2023')).toBeInTheDocument()
    expect(container.querySelectorAll('svg rect')).not.toHaveLength(0)
    expect(screen.getByRole('img')).toHaveAttribute(
      'aria-label',
      expect.stringContaining('Electricity generation by source'),
    )
    expect(screen.getByRole('img')).toHaveAttribute(
      'aria-label',
      expect.stringContaining('Coal: 1990 42'),
    )
  })

  it('renders a scatter chart as bars', () => {
    const { container } = renderChart('chart-employment')

    expect(container.querySelectorAll('svg rect').length).toBeGreaterThan(0)
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('Country A')
  })

  it('renders a line chart', () => {
    const { container } = renderChart('chart-sea-temp')

    expect(container.querySelectorAll('svg polyline')).not.toHaveLength(0)
    expect(container.querySelectorAll('svg circle').length).toBeGreaterThan(0)
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('Global anomaly')
  })

  it('renders a pie chart with a legend', () => {
    const { container } = renderChart('chart-households')

    expect(container.querySelectorAll('svg path')).not.toHaveLength(0)
    expect(container.querySelectorAll('svg title')).not.toHaveLength(0)
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('per cent')
  })

  it('renders a process chart', () => {
    const { container } = renderChart('process-compost')

    expect(container.querySelectorAll('svg marker')).not.toHaveLength(0)
    expect(container.querySelectorAll('svg rect').length).toBeGreaterThan(0)
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('—')
  })

  it('renders a diagram chart', () => {
    const { container } = renderChart('diagram-ecosystem')

    expect(container.querySelectorAll('svg rect').length).toBeGreaterThan(0)
    expect(screen.getByText('Sun')).toBeInTheDocument()
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('Sun (source)')
  })

  it('renders a table chart', () => {
    const { container } = renderChart('table-study-design')

    expect(container.querySelectorAll('svg text').length).toBeGreaterThan(0)
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('Intervention Placebo')
  })

  it('says so when a chart has no data', () => {
    for (const id of [
      'synthetic-bar',
      'synthetic-line',
      'synthetic-pie',
      'synthetic-process',
      'synthetic-diagram',
      'synthetic-table',
    ]) {
      const { container, unmount } = renderChart(id)
      expect(container.textContent).toContain('No chart data available')
      unmount()
    }
  })

  it('says so when the chart format is not one it can draw', () => {
    const { container } = renderChart('synthetic-unknown')

    expect(container.textContent).toContain('Unsupported chart format')
  })

  it('survives charts with missing or malformed data', () => {
    for (const id of [
      'synthetic-bar-nocategories',
      'synthetic-bar-noseries',
      'synthetic-bar-novalues',
      'synthetic-bar-shortvalues',
      'synthetic-bar-negative',
      'synthetic-bar-nan',
      'synthetic-line-nox',
      'synthetic-line-noseries',
      'synthetic-line-novalues',
      'synthetic-line-positive',
      'synthetic-pie-noslices',
      'synthetic-pie-zerovalue',
      'synthetic-process-nosteps',
      'synthetic-process-shortdetail',
      'synthetic-diagram-nonodes',
      'synthetic-diagram-noedges',
      'synthetic-diagram-badedge',
      'synthetic-table-noheaders',
    ]) {
      const { container, unmount } = renderChart(id)
      expect(container.querySelector('figure')).toBeInTheDocument()
      unmount()
    }
  })

  it('passes a class name through to the figure', () => {
    const { container } = render(<ChartRenderer chartId="chart-renewable" className="mb-4" />)

    expect(container.querySelector('figure')).toHaveClass('mb-4')
  })
})
