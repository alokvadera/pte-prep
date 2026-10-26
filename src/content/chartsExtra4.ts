import type { ChartSpec } from './schema'

/**
 * Ten further Describe Image stimuli in real PTE style.
 *
 * Describe Image needs 5–6 items per test and the pool held 40, so a
 * candidate sitting monthly mocks could still meet repeats. These ten
 * lift the pool to 50 and cover the full image inventory again —
 * grouped bars, two-line graphs, a pie, a scatter, a manufacturing
 * process, a project table and a water-cycle diagram — each with a
 * trend or sequence a candidate can state in 25–40 seconds without
 * interpolation.
 *
 * Pie slices sum to 100, every line and scatter series matches its
 * axis in length, and every prompt carries its word range so the bank
 * checks keep passing.
 */
export const EXTRA_CHARTS_4: ChartSpec[] = [
  {
    id: 'chart-renewable-mix',
    title: 'Renewable share of electricity, selected countries',
    kind: 'bar',
    caption: 'Per cent of electricity from renewable sources, 2010 and 2023.',
    prompt: 'Describe the information shown in the chart below in 25–40 seconds.',
    keyTerms: ['renewable', 'electricity', 'share', 'country', 'rose', 'highest', 'per cent'],
    minWords: 25,
    data: {
      unit: '% of electricity from renewables',
      categories: ['Norway', 'Germany', 'Spain', 'United Kingdom', 'Japan', 'Australia'],
      series: [
        { name: '2010', values: [96, 17, 30, 7, 10, 8], color: '#64748b' },
        { name: '2023', values: [98, 46, 50, 42, 22, 32], color: '#14b88c' },
      ],
    },
  },
  {
    id: 'chart-monthly-temp',
    title: 'Average monthly temperature, two cities',
    kind: 'line',
    caption: 'Mean temperature by month, degrees Celsius.',
    prompt: 'Describe the information shown in the graph below in 25–40 seconds.',
    keyTerms: ['temperature', 'monthly', 'average', 'peak', 'winter', 'summer', 'degrees'],
    minWords: 25,
    data: {
      unit: '°C, monthly average',
      x: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      series: [
        {
          name: 'Coastal city',
          values: [6, 7, 10, 13, 17, 20, 22, 22, 19, 15, 10, 7],
          color: '#3665f6',
        },
        {
          name: 'Inland city',
          values: [2, 4, 9, 14, 19, 23, 26, 25, 20, 14, 7, 3],
          color: '#f59e0b',
        },
      ],
    },
  },
  {
    id: 'chart-enrolment-faculty',
    title: 'Student enrolment by faculty, 2018 and 2024',
    kind: 'bar',
    caption: 'Thousands of enrolled students, by faculty.',
    prompt: 'Describe the information shown in the chart below in 25–40 seconds.',
    keyTerms: ['enrolment', 'faculty', 'students', 'rose', 'fell', 'largest', 'thousands'],
    minWords: 25,
    data: {
      unit: 'thousands of students',
      categories: ['Arts', 'Science', 'Engineering', 'Business', 'Medicine', 'Law'],
      series: [
        { name: '2018', values: [8.4, 6.1, 4.2, 5.5, 2.3, 1.6], color: '#8b5cf6' },
        { name: '2024', values: [7.9, 6.8, 5.6, 6.2, 2.9, 1.8], color: '#3665f6' },
      ],
    },
  },
  {
    id: 'chart-transport-share',
    title: 'How commuters travel into the city centre',
    kind: 'pie',
    caption: 'Main mode of transport, per cent of commuters.',
    prompt: 'Describe the information shown in the chart below in 25–40 seconds.',
    keyTerms: ['commuters', 'mode', 'transport', 'largest', 'smallest', 'share', 'per cent'],
    minWords: 25,
    data: {
      unit: '% of commuters',
      slices: [
        { name: 'Train', value: 34, color: '#3665f6' },
        { name: 'Private car', value: 28, color: '#f5a524' },
        { name: 'Bus', value: 16, color: '#14b88c' },
        { name: 'Cycle', value: 12, color: '#8b5cf6' },
        { name: 'On foot', value: 7, color: '#e0245e' },
        { name: 'Other', value: 3, color: '#64748b' },
      ],
    },
  },
  {
    id: 'process-bottle-line',
    title: 'How a plastic bottle is manufactured',
    kind: 'process',
    caption: 'Five stages on a bottling line.',
    prompt: 'Describe the process shown in the diagram below in 25–40 seconds.',
    keyTerms: ['pellets', 'moulded', 'blown', 'filled', 'labelled', 'stage', 'rejects'],
    minWords: 25,
    data: {
      steps: [
        { label: '1. Pellets', detail: 'Plastic pellets are dried and heated until soft.' },
        { label: '2. Moulding', detail: 'The soft plastic is pressed into a small preform.' },
        {
          label: '3. Blowing',
          detail: 'Compressed air stretches the preform into a bottle shape.',
        },
        { label: '4. Filling and capping', detail: 'The bottle is filled, capped and sealed.' },
        {
          label: '5. Labelling and packing',
          detail: 'Labels are applied and bottles are packed into crates.',
        },
      ],
      loop: 'Reject bottles are crushed and returned to the pellet stage.',
    },
  },
  {
    id: 'table-project-timeline',
    title: 'A six-phase bridge repair project',
    kind: 'table-chart',
    caption: 'Duration, team and key milestone for each phase.',
    prompt: 'Describe the information shown in the table below in 25–40 seconds.',
    keyTerms: ['phase', 'duration', 'team', 'milestone', 'longest', 'shortest', 'project'],
    minWords: 25,
    data: {
      headers: ['Phase', 'Duration', 'Team', 'Key milestone'],
      rows: [
        ['Survey', '3 weeks', 'Engineers', 'Site report published'],
        ['Design', '6 weeks', 'Design office', 'Plans approved'],
        ['Preparation', '2 weeks', 'Crews', 'Road closed and signed'],
        ['Repair', '10 weeks', 'Crews', 'Deck replaced'],
        ['Inspection', '1 week', 'Inspectors', 'Safety sign-off'],
        ['Reopening', '1 day', 'Managers', 'Road reopened'],
      ],
    },
  },
  {
    id: 'diagram-water-cycle',
    title: 'The water cycle',
    kind: 'diagram',
    caption: 'Movement of water between ocean, land and atmosphere.',
    prompt: 'Describe the diagram below in 25–40 seconds.',
    keyTerms: [
      'evaporation',
      'condensation',
      'precipitation',
      'runoff',
      'ocean',
      'clouds',
      'cycle',
    ],
    minWords: 25,
    data: {
      nodes: [
        { id: 'ocean', label: 'Ocean', x: 16, y: 78, kind: 'source' },
        { id: 'lake', label: 'Lake', x: 48, y: 80, kind: 'producer' },
        { id: 'river', label: 'River', x: 82, y: 82, kind: 'producer' },
        { id: 'clouds', label: 'Clouds', x: 50, y: 16, kind: 'primary' },
        { id: 'rain', label: 'Rain over land', x: 22, y: 44, kind: 'secondary' },
        { id: 'snow', label: 'Snow on mountains', x: 78, y: 40, kind: 'secondary' },
      ],
      edges: [
        ['ocean', 'clouds'],
        ['lake', 'clouds'],
        ['river', 'clouds'],
        ['clouds', 'rain'],
        ['clouds', 'snow'],
        ['rain', 'lake'],
        ['snow', 'river'],
        ['river', 'ocean'],
      ],
      note: 'Water evaporates from the ocean, falls as rain or snow, and returns by river and runoff.',
    },
  },
  {
    id: 'chart-smartphone-adoption',
    title: 'Smartphone adoption over time, two regions',
    kind: 'line',
    caption: 'Per cent of adults owning a smartphone, 2012–2024.',
    prompt: 'Describe the information shown in the graph below in 25–40 seconds.',
    keyTerms: ['adoption', 'smartphone', 'adults', 'rose', 'plateau', 'region', 'per cent'],
    minWords: 25,
    data: {
      unit: '% of adults',
      x: ['2012', '2014', '2016', '2018', '2020', '2022', '2024'],
      series: [
        { name: 'Region A', values: [28, 45, 61, 74, 83, 88, 91], color: '#3665f6' },
        { name: 'Region B', values: [9, 18, 31, 47, 63, 76, 85], color: '#14b88c' },
      ],
    },
  },
  {
    id: 'chart-study-hours-score',
    title: 'Test score against weekly study hours',
    kind: 'scatter',
    caption: 'Mean score by study band, two cohorts.',
    prompt: 'Describe the information shown in the graph below in 25–40 seconds.',
    keyTerms: ['score', 'study', 'hours', 'rises', 'plateau', 'cohort', 'band'],
    minWords: 25,
    data: {
      unit: 'mean test score',
      xAxis: 'Self-reported study hours per week',
      categories: ['0–2', '3–5', '6–8', '9–11', '12–14', '15+'],
      series: [
        { name: 'Morning cohort', values: [52, 61, 68, 74, 78, 80], color: '#3665f6' },
        { name: 'Evening cohort', values: [50, 58, 64, 70, 74, 76], color: '#f5a524' },
      ],
    },
  },
  {
    id: 'chart-population-age-bands',
    title: 'Population by age band, 2000 and 2024',
    kind: 'bar',
    caption: 'Per cent of the population in each band.',
    prompt: 'Describe the information shown in the chart below in 25–40 seconds.',
    keyTerms: ['population', 'age', 'band', 'per cent', 'aged', 'share', 'rose'],
    minWords: 25,
    data: {
      unit: '% of population',
      categories: ['0–14', '15–24', '25–44', '45–64', '65–74', '75+'],
      series: [
        { name: '2000', values: [21, 14, 31, 22, 8, 4], color: '#64748b' },
        { name: '2024', values: [17, 13, 29, 23, 10, 8], color: '#e0245e' },
      ],
    },
  },
]
