import type { ChartSpec } from './schema'
import { EXTRA_CHARTS } from './chartsExtra'

// ---------------------------------------------------------------------------
// Describe Image stimuli. These are drawn as inline SVG from the data below, so
// there are no image files to download and the charts stay crisp at any size.
// ---------------------------------------------------------------------------

export const CHARTS: ChartSpec[] = [
  {
    id: 'chart-renewable',
    title: 'Electricity generation by source, 1990–2023',
    kind: 'bar',
    caption: 'Share of total electricity generation, per cent.',
    prompt: 'Describe the information shown in the chart below in 25–40 seconds.',
    keyTerms: ['fossil', 'renewable', 'coal', 'gas', 'solar', 'wind', 'generation', 'share'],
    minWords: 25,
    data: {
      unit: '% of total generation',
      categories: ['1990', '2000', '2010', '2020', '2023'],
      series: [
        { name: 'Coal', values: [42, 36, 29, 22, 18], color: '#64748b' },
        { name: 'Natural gas', values: [18, 24, 33, 35, 33], color: '#f59e0b' },
        { name: 'Nuclear', values: [26, 24, 20, 16, 15], color: '#8b5cf6' },
        { name: 'Wind and other renewables', values: [3, 6, 11, 20, 27], color: '#14b88c' },
        { name: 'Hydro', values: [11, 10, 7, 7, 7], color: '#3b82f6' },
      ],
    },
  },
  {
    id: 'chart-sea-temp',
    title: 'Sea surface temperature anomaly, 1980–2023',
    kind: 'line',
    caption: 'Difference from the 1971–2000 average, degrees Celsius.',
    prompt: 'Describe the information shown in the graph below in 25–40 seconds.',
    keyTerms: ['anomaly', 'temperature', 'average', 'fluctuate', 'peak', 'trend', 'warming', 'rise'],
    minWords: 25,
    data: {
      unit: '°C above/below average',
      x: ['1980', '1985', '1990', '1995', '2000', '2005', '2010', '2015', '2020', '2023'],
      series: [
        { name: 'Global anomaly', values: [-0.06, -0.02, 0.14, 0.19, 0.11, 0.26, 0.34, 0.45, 0.52, 0.61], color: '#f4526b' },
      ],
    },
  },
  {
    id: 'chart-households',
    title: 'How households are heated, by region',
    kind: 'pie',
    caption: 'Share of households by primary heating fuel, per cent.',
    prompt: 'Describe the information shown in the chart below in 25–40 seconds.',
    keyTerms: ['gas', 'electric', 'district', 'heat', 'share', 'largest', 'smallest', 'region'],
    minWords: 25,
    data: {
      unit: '% of households',
      slices: [
        { name: 'Mains gas', value: 58, color: '#3665f6' },
        { name: 'Electricity', value: 19, color: '#f5a524' },
        { name: 'District heating', value: 15, color: '#14b88c' },
        { name: 'Solid fuel', value: 6, color: '#9fb0cb' },
        { name: 'Other', value: 2, color: '#4a5c7d' },
      ],
    },
  },
  {
    id: 'chart-employment',
    title: 'Employment rate by age band, two countries',
    kind: 'scatter',
    caption: 'Per cent of the age band in employment, 2023.',
    prompt: 'Describe the information shown in the chart below in 25–40 seconds.',
    keyTerms: ['employment', 'age', 'country', 'highest', 'lowest', 'gap', 'peak', 'younger'],
    minWords: 25,
    data: {
      unit: '% in employment',
      xAxis: 'Age band (years)',
      categories: ['16–24', '25–34', '35–44', '45–54', '55–64'],
      series: [
        { name: 'Country A', values: [46, 82, 87, 84, 63], color: '#3665f6' },
        { name: 'Country B', values: [39, 76, 83, 80, 58], color: '#14b88c' },
      ],
    },
  },
  {
    id: 'process-compost',
    title: 'How the facility processes organic waste',
    kind: 'process',
    caption: 'A four-stage treatment cycle.',
    prompt: 'Describe the process shown in the diagram below in 25–40 seconds.',
    keyTerms: ['organic waste', 'shredded', 'windrow', 'compost', 'cured', 'screened', 'cycle', 'stage'],
    minWords: 25,
    data: {
      steps: [
        { label: '1. Intake', detail: 'Waste is weighed and contaminated loads are rejected.' },
        { label: '2. Shredding', detail: 'Material is reduced to 20–40 mm particles.' },
        { label: '3. Windrows', detail: 'Piles are turned regularly to maintain 55–65 °C for 14 days.' },
        { label: '4. Curing and screening', detail: 'Material rests for 6 weeks, then is screened and bagged.' },
      ],
      loop: 'Curing feeds back to screening rejects, which return to the windrow stage.',
    },
  },
  {
    id: 'diagram-ecosystem',
    title: 'Energy flow in a simplified food web',
    kind: 'diagram',
    caption: 'Arrows show the direction of energy transfer between trophic levels.',
    prompt: 'Describe the diagram below in 25–40 seconds.',
    keyTerms: ['producer', 'consumer', 'energy', 'trophic', 'arrows', 'lost', 'level', 'web'],
    minWords: 25,
    data: {
      nodes: [
        { id: 'sun', label: 'Sun', x: 10, y: 12, kind: 'source' },
        { id: 'grass', label: 'Grass', x: 30, y: 42, kind: 'producer' },
        { id: 'tree', label: 'Tree', x: 58, y: 38, kind: 'producer' },
        { id: 'algae', label: 'Algae', x: 82, y: 44, kind: 'producer' },
        { id: 'rabbit', label: 'Rabbit', x: 24, y: 72, kind: 'primary' },
        { id: 'insect', label: 'Insect', x: 50, y: 70, kind: 'primary' },
        { id: 'fish', label: 'Fish', x: 76, y: 72, kind: 'primary' },
        { id: 'fox', label: 'Fox', x: 34, y: 92, kind: 'secondary' },
        { id: 'bird', label: 'Bird', x: 62, y: 92, kind: 'secondary' },
      ],
      edges: [
        ['sun', 'tree'],
        ['sun', 'grass'],
        ['sun', 'algae'],
        ['grass', 'rabbit'],
        ['grass', 'insect'],
        ['tree', 'insect'],
        ['tree', 'rabbit'],
        ['algae', 'fish'],
        ['algae', 'insect'],
        ['rabbit', 'fox'],
        ['insect', 'bird'],
        ['fish', 'bird'],
        ['fox', 'bird'],
      ],
      note: 'Roughly 90% of energy is lost at each transfer between trophic levels.',
    },
  },
  {
    id: 'table-study-design',
    title: 'Trial design across four interventions',
    kind: 'table-chart',
    caption: 'Number of participants and reported outcome.',
    prompt: 'Describe the information shown in the table below in 25–40 seconds.',
    keyTerms: ['participants', 'intervention', 'group', 'outcome', 'highest', 'largest', 'smallest', 'placebo'],
    minWords: 25,
    data: {
      headers: ['Intervention', 'Participants', 'Mean improvement', 'Follow-up retained'],
      rows: [
        ['Placebo', '112', '3.1', '96%'],
        ['Low dose', '118', '7.4', '91%'],
        ['Medium dose', '121', '12.8', '88%'],
        ['High dose', '104', '13.1', '64%'],
      ],
    },
  },
  {
    id: 'chart-commute',
    title: 'Average commute time by distance band',
    kind: 'bar',
    caption: 'Minutes, one-way journey, 2023 survey of 4,000 workers.',
    prompt: 'Describe the information shown in the chart below in 25–40 seconds.',
    keyTerms: ['commute', 'minutes', 'distance', 'increase', 'peak', 'longest', 'average', 'band'],
    minWords: 25,
    data: {
      unit: 'minutes (one way)',
      categories: ['<2 km', '2–5 km', '5–10 km', '10–20 km', '20–40 km', '>40 km'],
      series: [
        { name: 'All workers', values: [7, 12, 19, 31, 44, 58], color: '#3665f6' },
        { name: 'Public transport users', values: [9, 15, 24, 38, 51, 62], color: '#14b88c' },
      ],
    },
  },
  ...EXTRA_CHARTS,
]
