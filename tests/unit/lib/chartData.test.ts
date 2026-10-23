import { afterEach, describe, expect, it } from 'vitest'
import { CHART_INDEX } from '../../../src/content/bank'
import type { ChartSpec } from '../../../src/content/schema'
import { describeData } from '../../../src/lib/chartData'
import type { Node } from '../../../src/lib/chartData'

/* ---------------------------------------------------------------------------
   Chart descriptions: the plain-text reading of a chart, used as its
   accessible name and reused in the written reference answer.

   The chart kinds in the bank are all well formed, so the malformed cases —
   a chart with no data at all, a series whose values are not a list, a row
   shorter than its header row — are built here and put into the index.
   --------------------------------------------------------------------------- */

const SYNTHETIC_IDS: string[] = []

/** Puts a chart into the index for the duration of one test. */
function givenChart(id: string, kind: string, data: unknown): void {
  SYNTHETIC_IDS.push(id)
  CHART_INDEX.set(id, {
    id,
    title: 'A synthetic chart',
    kind: kind as ChartSpec['kind'],
    caption: '',
    prompt: '',
    keyTerms: [],
    minWords: 25,
    data: data as Record<string, unknown>,
  })
}

afterEach(() => {
  while (SYNTHETIC_IDS.length > 0) {
    const id = SYNTHETIC_IDS.pop()
    if (id) CHART_INDEX.delete(id)
  }
})

describe('describing a chart that is not in the bank', () => {
  it('returns nothing for an unknown chart id', () => {
    expect(describeData('no-such-chart')).toBe('')
  })
})

describe('describing a bar chart', () => {
  it('reads out every series with its categories and values', () => {
    expect(describeData('chart-renewable')).toBe(
      'Coal: 1990 42, 2000 36, 2010 29, 2020 22, 2023 18. ' +
        'Natural gas: 1990 18, 2000 24, 2010 33, 2020 35, 2023 33. ' +
        'Nuclear: 1990 26, 2000 24, 2010 20, 2020 16, 2023 15. ' +
        'Wind and other renewables: 1990 3, 2000 6, 2010 11, 2020 20, 2023 27. ' +
        'Hydro: 1990 11, 2000 10, 2010 7, 2020 7, 2023 7',
    )
  })

  it('reads a scatter chart the same way', () => {
    expect(describeData('chart-employment')).toBe(
      'Country A: 16–24 46, 25–34 82, 35–44 87, 45–54 84, 55–64 63. ' +
        'Country B: 16–24 39, 25–34 76, 35–44 83, 45–54 80, 55–64 58',
    )
  })

  it('copes with a chart that has no categories', () => {
    givenChart('test-bar-nocats', 'bar', { series: [{ name: 'Coal', values: [42] }] })
    expect(describeData('test-bar-nocats')).toBe('Coal:  42')
  })

  it('copes with a chart that has no series', () => {
    givenChart('test-bar-noseries', 'bar', { categories: ['1990'] })
    expect(describeData('test-bar-noseries')).toBe('')
  })

  it('copes with a series whose values are not a list', () => {
    givenChart('test-bar-novalues', 'bar', {
      categories: ['1990'],
      series: [{ name: 'Coal', values: 'nonsense' }],
    })
    expect(describeData('test-bar-novalues')).toBe('Coal: ')
  })

  it('leaves the category blank when the series runs past it', () => {
    givenChart('test-bar-overrun', 'bar', {
      categories: ['1990'],
      series: [{ name: 'Coal', values: [42, 7] }],
    })
    expect(describeData('test-bar-overrun')).toBe('Coal: 1990 42,  7')
  })
})

describe('describing a line chart', () => {
  it('reads the points against the x axis', () => {
    expect(describeData('chart-sea-temp')).toBe(
      'Global anomaly: 1980 -0.06, 1985 -0.02, 1990 0.14, 1995 0.19, 2000 0.11, ' +
        '2005 0.26, 2010 0.34, 2015 0.45, 2020 0.52, 2023 0.61',
    )
  })

  it('copes with a chart that has no x axis', () => {
    givenChart('test-line-nox', 'line', { series: [{ name: 'Anomaly', values: [0.1] }] })
    expect(describeData('test-line-nox')).toBe('Anomaly:  0.1')
  })

  it('copes with a chart that has no series', () => {
    givenChart('test-line-noseries', 'line', { x: ['1980'] })
    expect(describeData('test-line-noseries')).toBe('')
  })

  it('copes with a series whose values are not a list', () => {
    givenChart('test-line-novalues', 'line', {
      x: ['1980'],
      series: [{ name: 'Anomaly', values: 'nonsense' }],
    })
    expect(describeData('test-line-novalues')).toBe('Anomaly: ')
  })

  it('leaves the x value blank when the series runs past the axis', () => {
    givenChart('test-line-overrun', 'line', {
      x: ['1980'],
      series: [{ name: 'Anomaly', values: [0.1, 0.2] }],
    })
    expect(describeData('test-line-overrun')).toBe('Anomaly: 1980 0.1,  0.2')
  })
})

describe('describing a pie chart', () => {
  it('reads each slice as a share in per cent', () => {
    expect(describeData('chart-households')).toBe(
      'Mains gas 58 per cent, Electricity 19 per cent, District heating 15 per cent, ' +
        'Solid fuel 6 per cent, Other 2 per cent',
    )
  })

  it('copes with a chart that has no slices', () => {
    givenChart('test-pie-noslices', 'pie', { unit: '%' })
    expect(describeData('test-pie-noslices')).toBe('')
  })
})

describe('describing a process diagram', () => {
  it('reads each step with its label and detail', () => {
    expect(describeData('process-compost')).toBe(
      '1. Intake — Waste is weighed and contaminated loads are rejected.. ' +
        '2. Shredding — Material is reduced to 20–40 mm particles.. ' +
        '3. Windrows — Piles are turned regularly to maintain 55–65 °C for 14 days.. ' +
        '4. Curing and screening — Material rests for 6 weeks, then is screened and bagged.',
    )
  })

  it('copes with a diagram that has no steps', () => {
    givenChart('test-process-nosteps', 'process', { loop: 'a loop' })
    expect(describeData('test-process-nosteps')).toBe('')
  })
})

describe('describing a food web diagram', () => {
  it('reads each node with its trophic level', () => {
    expect(describeData('diagram-ecosystem')).toBe(
      'Sun (source), Grass (producer), Tree (producer), Algae (producer), ' +
        'Rabbit (primary), Insect (primary), Fish (primary), ' +
        'Fox (secondary), Bird (secondary)',
    )
  })

  it('copes with a diagram that has no nodes', () => {
    givenChart('test-diagram-nonodes', 'diagram', { note: 'a note' })
    expect(describeData('test-diagram-nonodes')).toBe('')
  })

  it('describes the nodes it is given', () => {
    const nodes: Node[] = [
      { id: 'sun', label: 'Sun', x: 10, y: 12, kind: 'source' },
      { id: 'grass', label: 'Grass', x: 30, y: 42, kind: 'producer' },
    ]
    givenChart('test-diagram-nodes', 'diagram', { nodes })
    expect(describeData('test-diagram-nodes')).toBe('Sun (source), Grass (producer)')
  })
})

describe('describing a table', () => {
  it('reads each row against the headers', () => {
    expect(describeData('table-study-design')).toBe(
      'Intervention Placebo, Participants 112, Mean improvement 3.1, Follow-up retained 96%. ' +
        'Intervention Low dose, Participants 118, Mean improvement 7.4, Follow-up retained 91%. ' +
        'Intervention Medium dose, Participants 121, Mean improvement 12.8, Follow-up retained 88%. ' +
        'Intervention High dose, Participants 104, Mean improvement 13.1, Follow-up retained 64%',
    )
  })

  it('copes with a table that has no headers', () => {
    givenChart('test-table-noheaders', 'table-chart', { rows: [['Placebo', '112']] })
    expect(describeData('test-table-noheaders')).toBe('')
  })

  it('copes with a table that has no rows', () => {
    givenChart('test-table-norows', 'table-chart', { headers: ['Intervention'] })
    expect(describeData('test-table-norows')).toBe('')
  })

  it('leaves the cell blank when the row stops short of the headers', () => {
    givenChart('test-table-shortrow', 'table-chart', {
      headers: ['Intervention', 'Participants'],
      rows: [['Placebo']],
    })
    expect(describeData('test-table-shortrow')).toBe('Intervention Placebo, Participants ')
  })

  it('leaves the cell blank when the row itself is missing', () => {
    givenChart('test-table-missingrow', 'table-chart', {
      headers: ['Intervention'],
      rows: [undefined] as unknown as string[][],
    })
    expect(describeData('test-table-missingrow')).toBe('Intervention ')
  })
})

describe('describing a chart with no usable data', () => {
  it('returns nothing for a chart that has no data at all', () => {
    givenChart('test-nodata', 'bar', undefined)
    expect(describeData('test-nodata')).toBe('')
  })

  it('returns nothing for a chart whose data is not an object', () => {
    givenChart('test-baddata', 'bar', 'not an object')
    expect(describeData('test-baddata')).toBe('')
  })

  it('returns nothing for a chart kind it does not know', () => {
    givenChart('test-unknown-kind', 'sunburst', { slices: [] })
    expect(describeData('test-unknown-kind')).toBe('')
  })
})
