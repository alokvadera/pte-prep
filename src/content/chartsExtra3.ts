import type { ChartSpec } from './schema'

/**
 * Fourteen further Describe Image stimuli in real PTE style.
 *
 * Describe Image needs 5–6 items per test and the pool held 26, so a
 * candidate sitting monthly mocks met repeats within half a year. These
 * fourteen lift the pool to 40 — nearly seven mocks of headroom — and cover
 * the full PTE image inventory: grouped bars, lines, pies, scatters, process
 * cycles, a floor-plan diagram and data tables, each with a trend a candidate
 * can state in 25–40 seconds without interpolation.
 *
 * Pie slices sum to 100 throughout; every prompt carries its word range so
 * the bank check for prompt ranges keeps passing.
 */
export const EXTRA_CHARTS_3: ChartSpec[] = [
  {
    id: 'chart-graduate-jobs',
    title: 'Graduate destinations six months after finishing, by faculty',
    kind: 'bar',
    caption: 'Per cent of graduates in each outcome, 2023 survey.',
    prompt: 'Describe the information shown in the chart below in 25–40 seconds.',
    keyTerms: ['employment', 'further study', 'faculty', 'highest', 'unemployed', 'share'],
    minWords: 25,
    data: {
      unit: '% of graduates',
      categories: ['Engineering', 'Medicine', 'Arts', 'Business', 'Law'],
      series: [
        { name: 'Employed', values: [71, 84, 48, 66, 62], color: '#3665f6' },
        { name: 'Further study', values: [14, 9, 28, 16, 21], color: '#14b88c' },
        { name: 'Seeking work', values: [9, 4, 17, 12, 11], color: '#f5a524' },
      ],
    },
  },
  {
    id: 'chart-train-punctuality',
    title: 'Trains arriving on time, by operator and year',
    kind: 'bar',
    caption: 'Per cent of timetabled services arriving within five minutes.',
    prompt: 'Describe the information shown in the chart below in 25–40 seconds.',
    keyTerms: ['punctual', 'operator', 'improved', 'fell', 'highest', 'lowest'],
    minWords: 25,
    data: {
      unit: '% on time',
      categories: ['2020', '2021', '2022', '2023'],
      series: [
        { name: 'Northern operator', values: [78, 81, 76, 84], color: '#3665f6' },
        { name: 'Southern operator', values: [88, 86, 89, 91], color: '#14b88c' },
        { name: 'Island line', values: [64, 69, 71, 74], color: '#f5a524' },
      ],
    },
  },
  {
    id: 'chart-smartphone-age',
    title: 'Smartphone ownership by age band, two surveys',
    kind: 'bar',
    caption: 'Per cent in each age band owning a smartphone.',
    prompt: 'Describe the information shown in the chart below in 25–40 seconds.',
    keyTerms: ['ownership', 'age', 'rose', 'gap', 'oldest', 'youngest'],
    minWords: 25,
    data: {
      unit: '% owning a smartphone',
      categories: ['16–24', '25–39', '40–59', '60–74', '75+'],
      series: [
        { name: '2018', values: [96, 93, 81, 58, 31], color: '#64748b' },
        { name: '2023', values: [98, 97, 92, 79, 55], color: '#3665f6' },
      ],
    },
  },
  {
    id: 'chart-electricity-price',
    title: 'Average household electricity price, 2010–2023',
    kind: 'line',
    caption: 'Pence per kilowatt-hour, adjusted for inflation.',
    prompt: 'Describe the information shown in the graph below in 25–40 seconds.',
    keyTerms: ['price', 'rose', 'peak', 'fell', 'stable', 'inflation'],
    minWords: 25,
    data: {
      unit: 'pence per kWh, real terms',
      x: ['2010', '2012', '2014', '2016', '2018', '2020', '2022', '2023'],
      series: [
        { name: 'Average price', values: [13.2, 14.1, 14.8, 14.2, 14.6, 15.1, 21.4, 19.8], color: '#f4526b' },
      ],
    },
  },
  {
    id: 'chart-attendance-term',
    title: 'Lecture attendance across a twelve-week term',
    kind: 'line',
    caption: 'Mean attendance as a share of enrolled students.',
    prompt: 'Describe the information shown in the graph below in 25–40 seconds.',
    keyTerms: ['attendance', 'falls', 'weeks', 'midterm', 'recovers', 'lowest'],
    minWords: 25,
    data: {
      unit: '% of enrolled students',
      x: ['Wk 1', 'Wk 3', 'Wk 5', 'Wk 7', 'Wk 9', 'Wk 11'],
      series: [
        { name: 'First years', values: [91, 84, 76, 68, 71, 64], color: '#3665f6' },
        { name: 'Final years', values: [88, 85, 82, 79, 81, 77], color: '#14b88c' },
      ],
    },
  },
  {
    id: 'chart-food-shop',
    title: 'Where households buy their weekly food shop',
    kind: 'pie',
    caption: 'Share of households by main outlet, per cent.',
    prompt: 'Describe the information shown in the chart below in 25–40 seconds.',
    keyTerms: ['supermarket', 'market', 'online', 'largest', 'smallest', 'share'],
    minWords: 25,
    data: {
      unit: '% of households',
      slices: [
        { name: 'Large supermarket', value: 52, color: '#3665f6' },
        { name: 'Discount store', value: 21, color: '#14b88c' },
        { name: 'Online delivery', value: 14, color: '#f5a524' },
        { name: 'Local shops and markets', value: 11, color: '#8b5cf6' },
        { name: 'Other', value: 2, color: '#9fb0cb' },
      ],
    },
  },
  {
    id: 'chart-energy-mix-campus',
    title: 'How the campus meets its electricity demand',
    kind: 'pie',
    caption: 'Share of annual electricity by source, per cent.',
    prompt: 'Describe the information shown in the chart below in 25–40 seconds.',
    keyTerms: ['solar', 'grid', 'wind', 'largest', 'smallest', 'demand'],
    minWords: 25,
    data: {
      unit: '% of electricity',
      slices: [
        { name: 'Rooftop solar', value: 34, color: '#f5a524' },
        { name: 'Grid supply', value: 41, color: '#3665f6' },
        { name: 'Wind contract', value: 19, color: '#14b88c' },
        { name: 'Backup diesel', value: 6, color: '#64748b' },
      ],
    },
  },
  {
    id: 'chart-rent-burden',
    title: 'Rent as a share of income, by city district',
    kind: 'scatter',
    caption: 'Median rent against median income, 2023.',
    prompt: 'Describe the information shown in the chart below in 25–40 seconds.',
    keyTerms: ['rent', 'income', 'highest', 'lowest', 'burden', 'district'],
    minWords: 25,
    data: {
      unit: '% of income spent on rent',
      xAxis: 'District (ordered west to east)',
      categories: ['West', 'North-west', 'Central', 'North-east', 'East'],
      series: [
        { name: 'Single earners', values: [28, 34, 47, 39, 31], color: '#3665f6' },
        { name: 'Couples', values: [19, 23, 31, 27, 22], color: '#14b88c' },
      ],
    },
  },
  {
    id: 'chart-exam-scores-study',
    title: 'Final marks against weekly study hours',
    kind: 'scatter',
    caption: 'Each series is one seminar group of twenty students.',
    prompt: 'Describe the information shown in the graph below in 25–40 seconds.',
    keyTerms: ['marks', 'hours', 'rises', 'plateau', 'variation', 'positive'],
    minWords: 25,
    data: {
      unit: 'mean final mark',
      xAxis: 'Self-reported study hours per week',
      categories: ['0–4', '5–8', '9–12', '13–16', '17+'],
      series: [
        { name: 'Group A', values: [48, 58, 66, 69, 70], color: '#3665f6' },
        { name: 'Group B', values: [45, 55, 63, 68, 71], color: '#14b88c' },
        { name: 'Group C', values: [50, 57, 62, 64, 65], color: '#f5a524' },
      ],
    },
  },
  {
    id: 'process-paper-recycle',
    title: 'How used paper becomes new paper',
    kind: 'process',
    caption: 'A five-stage recycling loop.',
    prompt: 'Describe the process shown in the diagram below in 25–40 seconds.',
    keyTerms: ['collected', 'pulped', 'screened', 'de-inked', 'dried', 'stage'],
    minWords: 25,
    data: {
      steps: [
        { label: '1. Collection', detail: 'Used paper is gathered from kerbside bins and office schemes.' },
        { label: '2. Pulping', detail: 'Material is mixed with water and churned into a slurry.' },
        { label: '3. Screening', detail: 'Staples, coatings and contaminants are filtered out.' },
        { label: '4. De-inking', detail: 'Air bubbles lift ink to the surface where it is skimmed away.' },
        { label: '5. Drying', detail: 'The cleaned pulp is pressed, dried and rolled for printing.' },
      ],
      loop: 'Offcuts from printing return to the pulping stage.',
    },
  },
  {
    id: 'process-admissions',
    title: 'How an undergraduate application is decided',
    kind: 'process',
    caption: 'Stages from submission to offer.',
    prompt: 'Describe the process shown in the diagram below in 25–40 seconds.',
    keyTerms: ['submitted', 'checked', 'assessed', 'interview', 'offer', 'stage'],
    minWords: 25,
    data: {
      steps: [
        { label: '1. Submission', detail: 'The application and personal statement arrive by the deadline.' },
        { label: '2. Eligibility check', detail: 'Grades and language requirements are verified.' },
        { label: '3. Academic assessment', detail: 'Two tutors mark the statement against the course criteria.' },
        { label: '4. Interview', detail: 'Shortlisted candidates discuss a set problem with a tutor.' },
        { label: '5. Decision', detail: 'Offers, rejections and waiting-list places are issued together.' },
      ],
      loop: false,
    },
  },
  {
    id: 'diagram-library-floor',
    title: 'Plan of the renovated ground floor library',
    kind: 'diagram',
    caption: 'Rooms and facilities on one level.',
    prompt: 'Describe the diagram below in 25–40 seconds.',
    keyTerms: ['entrance', 'north', 'adjacent', 'opposite', 'corridor', 'room'],
    minWords: 25,
    data: {
      nodes: [
        { id: 'entrance', label: 'Entrance (south)', x: 50, y: 8, kind: 'source' },
        { id: 'desk', label: 'Help desk', x: 50, y: 28, kind: 'producer' },
        { id: 'silent', label: 'Silent study', x: 22, y: 52, kind: 'primary' },
        { id: 'group', label: 'Group room', x: 78, y: 52, kind: 'primary' },
        { id: 'pcs', label: 'Computers', x: 30, y: 76, kind: 'secondary' },
        { id: 'cafe', label: 'Cafe', x: 70, y: 76, kind: 'secondary' },
        { id: 'exit', label: 'Fire exit (north)', x: 50, y: 94, kind: 'secondary' },
      ],
      edges: [
        ['entrance', 'desk'],
        ['desk', 'silent'],
        ['desk', 'group'],
        ['silent', 'pcs'],
        ['group', 'cafe'],
        ['pcs', 'exit'],
        ['cafe', 'exit'],
      ],
      note: 'Silent study and the group room sit on opposite sides of the help desk.',
    },
  },
  {
    id: 'table-bus-routes',
    title: 'Punctuality and frequency on four bus routes',
    kind: 'table-chart',
    caption: 'Scheduled and observed service, one term.',
    prompt: 'Describe the information shown in the table below in 25–40 seconds.',
    keyTerms: ['route', 'frequency', 'punctual', 'highest', 'lowest', 'cancelled'],
    minWords: 25,
    data: {
      headers: ['Route', 'Buses per hour', 'On time', 'Journeys cancelled'],
      rows: [
        ['Campus – Station', '6', '91%', '2%'],
        ['Campus – Hospital', '4', '84%', '4%'],
        ['Campus – Airport', '2', '77%', '6%'],
        ['Night service', '1', '88%', '3%'],
      ],
    },
  },
  {
    id: 'table-course-places',
    title: 'Applications and places by department, one intake',
    kind: 'table-chart',
    caption: 'Competition for undergraduate places.',
    prompt: 'Describe the information shown in the table below in 25–40 seconds.',
    keyTerms: ['applications', 'places', 'ratio', 'highest', 'lowest', 'department'],
    minWords: 25,
    data: {
      headers: ['Department', 'Applications', 'Places', 'Success rate'],
      rows: [
        ['Medicine', '2,140', '180', '8%'],
        ['Law', '1,620', '220', '14%'],
        ['Engineering', '1,480', '310', '21%'],
        ['History', '890', '150', '17%'],
      ],
    },
  },
]
