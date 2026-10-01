import type { ChartSpec } from './schema'

/**
 * Additional charts for Describe Image.
 *
 * Describe Image asks for five to six items per test and the bank held eight, so
 * a full mock reused charts and a returning candidate would recognise them. These
 * nine bring the pool to seventeen and cover the kinds the format actually uses,
 * including the two a candidate finds hardest: a process diagram and a table,
 * where the answer is a sequence rather than a magnitude.
 *
 * Pie slices sum to one hundred in every case, and the line and scatter series
 * carry trends a candidate can state rather than requiring interpolation.
 */
export const EXTRA_CHARTS: ChartSpec[] = [
  {
    id: 'chart-water-use',
    title: 'Where household water goes, per person per day',
    kind: 'bar',
    caption: 'Litres per person per day in a surveyed sample of households.',
    prompt: 'Describe the information shown in the chart below in 25–40 seconds.',
    minWords: 25,
    keyTerms: ['toilet', 'shower', 'washing machine', 'outdoor use', 'litres', 'highest', 'lowest'],
    data: {
      unit: 'litres per person per day',
      categories: ['Toilet', 'Shower and bath', 'Washing machine', 'Taps', 'Outdoor use'],
      series: [
        { name: 'Leaking fittings', values: [6, 14, 9, 5, 11], color: '#64748b' },
        { name: 'Sound fittings', values: [4, 9, 6, 3, 14], color: '#3665f6' },
      ],
    },
  },
  {
    id: 'chart-cycle-time',
    title: 'Median time from report to repair, by fault type',
    kind: 'bar',
    caption: 'Days from first report to completed repair, 2021–2023.',
    prompt: 'Describe the information shown in the chart below in 25–40 seconds.',
    minWords: 25,
    keyTerms: ['pipes', 'heating', 'electrical', 'longest', 'shortest', 'days', 'no change'],
    data: {
      unit: 'days, median',
      categories: ['Burst pipes', 'Boiler failure', 'Electrical fault', 'Damp', 'Blocked drain'],
      series: [
        { name: 'Urban', values: [4, 6, 3, 11, 5], color: '#3665f6' },
        { name: 'Rural', values: [9, 13, 7, 24, 12], color: '#14b88c' },
      ],
    },
  },
  {
    id: 'chart-library-loans',
    title: 'Physical and digital loans, five university libraries',
    kind: 'bar',
    caption: 'Thousands of loans in a single academic year.',
    prompt: 'Describe the information shown in the chart below in 25–40 seconds.',
    minWords: 25,
    keyTerms: ['physical', 'digital', 'first year', 'steady', 'declined', 'thousands'],
    data: {
      unit: 'thousands of loans',
      categories: ['First year students', 'Second year', 'Postgraduates', 'Staff'],
      series: [
        { name: 'Physical', values: [34, 21, 12, 6], color: '#8b5cf6' },
        { name: 'Digital', values: [28, 39, 44, 19], color: '#f5a524' },
      ],
    },
  },
  {
    id: 'chart-rural-broadband',
    title: 'Fixed broadband coverage, rural districts',
    kind: 'line',
    caption: 'Per cent of households able to obtain a fixed line connection.',
    prompt: 'Describe the information shown in the graph below in 25–40 seconds.',
    minWords: 25,
    keyTerms: ['rises', 'fastest', 'slowest', 'stagnated', 'per cent', '2015'],
    data: {
      unit: '% of households covered',
      x: ['2012', '2014', '2016', '2018', '2020', '2022'],
      series: [
        { name: 'Northern district', values: [38, 51, 66, 78, 84, 88], color: '#3665f6' },
        { name: 'Southern district', values: [44, 58, 72, 83, 91, 95], color: '#14b88c' },
        { name: 'Island district', values: [12, 19, 27, 34, 38, 39], color: '#f5a524' },
      ],
    },
  },
  {
    id: 'chart-caffeine',
    title: 'Reported sleep duration against caffeine intake',
    kind: 'line',
    caption: 'Self reported, from a survey of 1,400 adults.',
    prompt: 'Describe the information shown in the graph below in 25–40 seconds.',
    minWords: 25,
    keyTerms: ['cups', 'sleep', 'falls', 'levels off', 'between', 'non drinkers'],
    data: {
      unit: 'hours of sleep per night',
      x: ['0 cups', '1 cup', '2 cups', '3 cups', '4 cups', '5 or more'],
      series: [
        { name: 'All respondents', values: [7.6, 7.4, 7.1, 6.7, 6.4, 6.2], color: '#8b5cf6' },
        { name: 'Non drinkers only', values: [7.6, 7.5, 7.4, 7.3, 7.3, 7.2], color: '#64748b' },
      ],
    },
  },
  {
    id: 'chart-recycling',
    title: 'What households put in their recycling, by weight',
    kind: 'pie',
    caption: 'Composition of collected recyclable material, per cent by weight.',
    prompt: 'Describe the information shown in the chart below in 25–40 seconds.',
    minWords: 25,
    keyTerms: ['paper and card', 'glass', 'plastic', 'metals', 'largest', 'smallest'],
    data: {
      unit: '% by weight',
      slices: [
        { name: 'Paper and card', value: 41, color: '#3665f6' },
        { name: 'Glass', value: 27, color: '#14b88c' },
        { name: 'Plastics', value: 19, color: '#f5a524' },
        { name: 'Metals', value: 13, color: '#8b5cf6' },
      ],
    },
  },
  {
    id: 'chart-pollinator',
    title: 'Pollinator species recorded against flowering area',
    kind: 'scatter',
    caption: 'Each point is one site surveyed in the same year.',
    prompt: 'Describe the information shown in the graph below in 25–40 seconds.',
    minWords: 25,
    keyTerms: ['increases', 'plateau', 'variation', 'outlier', 'roughly', 'positive'],
    data: {
      unit: 'species recorded',
      xAxis: 'Area of flowering habitat (hectares)',
      categories: ['1–2', '3–5', '6–10', '11–20', '21–40'],
      series: [
        { name: 'Wildflower strips', values: [9, 18, 31, 36, 38], color: '#14b88c' },
        { name: 'Managed meadow', values: [6, 14, 27, 34, 37], color: '#3665f6' },
        { name: 'Unmanaged field', values: [4, 8, 13, 17, 19], color: '#f5a524' },
      ],
    },
  },
  {
    id: 'process-battery',
    title: 'How a used battery is processed',
    kind: 'process',
    caption: 'Four stages at a recycling facility.',
    prompt: 'Describe the process shown in the diagram below in 25–40 seconds.',
    minWords: 25,
    keyTerms: ['collected', 'sorted', 'dismantled', 'recovered', 'sent to', 'first stage'],
    data: {
      steps: [
        { label: '1. Collection', detail: 'Batteries are gathered from drop-off points and retail take-back schemes.' },
        { label: '2. Sorting', detail: 'Chemistry is identified by shape and marking, and damaged cells are separated.' },
        { label: '3. Dismantling', detail: 'Casing is opened and the black mass of metals and salts is recovered.' },
        { label: '4. Refining', detail: 'Cobalt, nickel and lithium are extracted for reuse in new cells.' },
      ],
      loop: true,
    },
  },
  {
    id: 'table-grant-review',
    title: 'Research funding by panel, three rounds',
    kind: 'table-chart',
    caption: 'Proposals received, funded and average award.',
    prompt: 'Describe the information shown in the table below in 25–40 seconds.',
    minWords: 25,
    keyTerms: ['success rate', 'average award', 'fell', 'rose', 'panel', 'smallest'],
    data: {
      headers: ['Panel', 'Proposals', 'Funded', 'Average award (£000)'],
      rows: [
        ['Health', '412', '96', '118'],
        ['Engineering', '286', '54', '96'],
        ['Environment', '198', '61', '142'],
        ['Social science', '341', '78', '61'],
      ],
    },
  },
]