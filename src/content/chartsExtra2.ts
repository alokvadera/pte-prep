import type { ChartSpec } from './schema'

/**
 * A further nine charts for Describe Image.
 *
 * Added to keep the ratio against its per-test count above three while widening
 * the kinds on offer. The pie and table charts here are the harder end of the
 * type: the pie has six slices so there is no dominant segment to lead with, and
 * the table splits a total across three components, which forces the candidate to
 * add numbers up rather than read one off.
 *
 * Every pie sums to exactly one hundred, and every line and scatter series is the
 * same length as its axis, both asserted by the bank check.
 */
export const EXTRA_CHARTS_2: ChartSpec[] = [
  {
    id: 'chart-library-hours',
    title: 'Opening hours by library branch',
    kind: 'bar',
    caption: 'Hours open per week across six branches.',
    prompt: 'Describe the information shown in the chart below in 25–40 seconds.',
    minWords: 25,
    keyTerms: ['longest', 'shortest', 'weekend', 'evening', 'hours', 'closed'],
    data: {
      unit: 'hours per week',
      categories: ['Central', 'Northgate', 'Riverside', 'Hilltop', 'Eastfield', 'Old Mill'],
      series: [
        { name: 'Weekday opening', values: [56, 45, 40, 28, 50, 21], color: '#3665f6' },
        { name: 'Weekend opening', values: [12, 6, 8, 0, 10, 0], color: '#14b88c' },
      ],
    },
  },
  {
    id: 'chart-commute-mode',
    title: 'How residents travel to work',
    kind: 'pie',
    caption: 'Main mode of travel, per cent of residents.',
    prompt: 'Describe the information shown in the chart below in 25–40 seconds.',
    minWords: 25,
    keyTerms: ['car', 'bus', 'cycle', 'largest', 'smallest', 'per cent'],
    data: {
      unit: '% of residents',
      slices: [
        { name: 'Private car', value: 38, color: '#3665f6' },
        { name: 'Bus', value: 17, color: '#14b88c' },
        { name: 'Cycle', value: 11, color: '#f5a524' },
        { name: 'On foot', value: 9, color: '#8b5cf6' },
        { name: 'Rail', value: 8, color: '#e0245e' },
        { name: 'Other', value: 17, color: '#64748b' },
      ],
    },
  },
  {
    id: 'chart-solar-output',
    title: 'Monthly solar output against rainfall',
    kind: 'line',
    caption: 'Average daily figures for one site.',
    prompt: 'Describe the information shown in the graph below in 25–40 seconds.',
    minWords: 25,
    keyTerms: ['peaks', 'lowest', 'inverse', 'summer', 'winter', 'crosses'],
    data: {
      unit: 'index, daily average',
      x: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      series: [
        { name: 'Solar output', values: [18, 26, 44, 62, 76, 85, 91, 84, 63, 41, 24, 16], color: '#f5a524' },
        { name: 'Rainfall', values: [78, 62, 54, 41, 33, 27, 24, 29, 38, 57, 71, 83], color: '#3665f6' },
      ],
    },
  },
  {
    id: 'chart-drug-clinic',
    title: 'New patients by referral route',
    kind: 'line',
    caption: 'Monthly new patients entering a community drug service.',
    prompt: 'Describe the information shown in the graph below in 25–40 seconds.',
    minWords: 25,
    keyTerms: ['rose', 'fell', 'steady', 'self referral', 'peak', 'overall'],
    data: {
      unit: 'new patients per month',
      x: ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8'],
      series: [
        { name: 'Self referral', values: [14, 18, 19, 22, 25, 24, 29, 33], color: '#14b88c' },
        { name: 'Court referral', values: [21, 19, 17, 16, 14, 15, 12, 11], color: '#8b5cf6' },
        { name: 'GP referral', values: [9, 10, 12, 11, 13, 15, 16, 18], color: '#3665f6' },
      ],
    },
  },
  {
    id: 'chart-exam-load',
    title: 'Exam load against available invigilators',
    kind: 'scatter',
    caption: 'Each point is one exam session in the same season.',
    prompt: 'Describe the information shown in the graph below in 25–40 seconds.',
    minWords: 25,
    keyTerms: ['rises', 'plateaus', 'stays level', 'gap', 'shortage', 'roughly'],
    data: {
      unit: 'invigilators required',
      xAxis: 'Candidates sitting (hundreds)',
      categories: ['1–2', '2–4', '4–6', '6–8', '8–10', '10–12'],
      series: [
        { name: 'Summer season', values: [8, 15, 22, 29, 34, 36], color: '#3665f6' },
        { name: 'Winter season', values: [8, 14, 20, 26, 28, 28], color: '#64748b' },
      ],
    },
  },
  {
    id: 'chart-pupil-ratio',
    title: 'Pupil to teacher ratio by school type',
    kind: 'scatter',
    caption: 'Ratio at the start of the academic year.',
    prompt: 'Describe the information shown in the graph below in 25–40 seconds.',
    minWords: 25,
    keyTerms: ['highest', 'lowest', 'narrower', 'secondary', 'primary', 'varies'],
    data: {
      unit: 'pupils per teacher',
      xAxis: 'Average class spend (£000)',
      categories: ['2–4', '4–6', '6–8', '8–10', '10–12', '12–14'],
      series: [
        { name: 'Primary schools', values: [26, 24, 23, 22, 21, 21], color: '#14b88c' },
        { name: 'Secondary schools', values: [19, 18, 17, 17, 18, 18], color: '#8b5cf6' },
      ],
    },
  },
  {
    id: 'process-habitat',
    title: 'How a wildlife habitat is restored',
    kind: 'process',
    caption: 'Four stages at a restoration site.',
    prompt: 'Describe the process shown in the diagram below in 25–40 seconds.',
    minWords: 25,
    keyTerms: ['survey', 'clear', 'plant', 'monitor', 'repeated', 'final stage'],
    data: {
      steps: [
        { label: '1. Survey', detail: 'Existing species and soil condition are recorded across the site.' },
        { label: '2. Clearance', detail: 'Invasive growth is removed and the ground is left bare over winter.' },
        { label: '3. Planting', detail: 'Local stock is sown and young trees planted in the cleared ground.' },
        { label: '4. Monitoring', detail: 'Survival is checked each year and gaps are replanted as needed.' },
      ],
      loop: true,
    },
  },
  {
    id: 'table-budget',
    title: 'Where a departmental budget was spent',
    kind: 'table-chart',
    caption: 'One financial year, thousands of pounds.',
    prompt: 'Describe the information shown in the table below in 25–40 seconds.',
    minWords: 25,
    keyTerms: ['total', 'largest', 'smallest', 'staff costs', 'equipment', 'rose'],
    data: {
      headers: ['Category', 'Previous year', 'This year', 'Change'],
      rows: [
        ['Staff costs', '812', '874', '+62'],
        ['Equipment', '140', '96', '−44'],
        ['Travel', '58', '77', '+19'],
        ['Contractors', '115', '104', '−11'],
        ['Training', '26', '41', '+15'],
      ],
    },
  },
  {
    id: 'chart-household-energy',
    title: 'Household energy use by floor area',
    kind: 'bar',
    caption: 'Average annual consumption per household.',
    prompt: 'Describe the information shown in the chart below in 25–40 seconds.',
    minWords: 25,
    keyTerms: ['terraced', 'detached', 'flats', 'rises', 'smallest homes', 'largest homes'],
    data: {
      unit: 'kWh per year',
      categories: ['Flat', 'Terraced house', 'Semi-detached', 'Detached house'],
      series: [
        { name: '1990', values: [3200, 5400, 6100, 7800], color: '#64748b' },
        { name: '2023', values: [2100, 4400, 4900, 6100], color: '#3665f6' },
      ],
    },
  },
]