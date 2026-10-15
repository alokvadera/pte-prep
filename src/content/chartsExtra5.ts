import type { ChartSpec } from './schema'

/**
 * Ten further Describe Image stimuli in real PTE style.
 *
 * Expands the pool from 50 to 60 charts, introducing diverse topics:
 * ocean acidification, metal extraction, sleep architecture, language endangerment,
 * groundwater anomalies, decision defaults, battery storage, and glacier balance.
 */
export const EXTRA_CHARTS_5: ChartSpec[] = [
  {
    id: 'chart-ocean-ph',
    title: 'Atmospheric CO2 vs Surface Ocean pH, 1980–2024',
    kind: 'line',
    caption: 'Atmospheric carbon dioxide concentrations (ppm) and seawater pH over four decades.',
    prompt: 'Describe the information shown in the graph below in 25–40 seconds.',
    keyTerms: ['carbon dioxide', 'ocean pH', 'acidity', 'inverse relationship', 'ppm', 'decades'],
    minWords: 25,
    data: {
      unit: 'CO2 (ppm) vs Ocean pH',
      x: ['1980', '1990', '2000', '2010', '2020', '2024'],
      series: [
        { name: 'Atmospheric CO2 (ppm)', values: [338, 354, 370, 390, 414, 422], color: '#ef4444' },
        { name: 'Surface Ocean pH (x100)', values: [812, 809, 806, 803, 801, 800], color: '#3b82f6' },
      ],
    },
  },
  {
    id: 'chart-bronze-trade',
    title: 'Eastern Mediterranean Bronze Age Metal Trade (Tons)',
    kind: 'bar',
    caption: 'Estimated annual trade volume of copper and tin ingots, 1400–1100 BCE.',
    prompt: 'Describe the information shown in the chart below in 25–40 seconds.',
    keyTerms: ['copper', 'tin', 'trade volume', 'bronze age', 'decline', 'collapse', 'tons'],
    minWords: 25,
    data: {
      unit: 'Metric tons traded annually',
      categories: ['1400 BCE', '1300 BCE', '1250 BCE', '1200 BCE', '1150 BCE', '1100 BCE'],
      series: [
        { name: 'Copper ingots', values: [180, 240, 260, 190, 60, 20], color: '#f97316' },
        { name: 'Tin ingots', values: [20, 28, 30, 22, 6, 2], color: '#94a3b8' },
      ],
    },
  },
  {
    id: 'chart-sleep-cycles',
    title: 'Sleep Stage Distribution Across Age Groups',
    kind: 'bar',
    caption: 'Percentage of total nocturnal sleep spent in REM and Deep Slow-Wave sleep.',
    prompt: 'Describe the information shown in the chart below in 25–40 seconds.',
    keyTerms: ['sleep stages', 'slow-wave', 'REM sleep', 'age groups', 'decline', 'percentage'],
    minWords: 25,
    data: {
      unit: '% of total sleep time',
      categories: ['Child (5–12)', 'Adolescent (13–18)', 'Young Adult (19–35)', 'Adult (36–55)', 'Older Adult (65+)'],
      series: [
        { name: 'Deep Slow-Wave', values: [26, 20, 16, 10, 4], color: '#6366f1' },
        { name: 'REM Sleep', values: [24, 22, 21, 19, 15], color: '#ec4899' },
      ],
    },
  },
  {
    id: 'chart-language-families',
    title: 'Global Spoken Languages by Family',
    kind: 'pie',
    caption: 'Share of world population speaking major language families, 2024.',
    prompt: 'Describe the information shown in the pie chart below in 25–40 seconds.',
    keyTerms: ['language families', 'Indo-European', 'Sino-Tibetan', 'share', 'population', 'proportion'],
    minWords: 25,
    data: {
      slices: [
        { label: 'Indo-European', value: 46, color: '#3b82f6' },
        { label: 'Sino-Tibetan', value: 20, color: '#10b981' },
        { label: 'Niger-Congo', value: 8, color: '#f59e0b' },
        { label: 'Afroasiatic', value: 6, color: '#8b5cf6' },
        { label: 'Austronesian', value: 5, color: '#06b6d4' },
        { label: 'Other families', value: 15, color: '#94a3b8' },
      ],
    },
  },
  {
    id: 'chart-groundwater-gravity',
    title: 'Satellite Groundwater Loss Across Major Aquifers (km³/yr)',
    kind: 'bar',
    caption: 'Annual net groundwater depletion estimated by GRACE gravimetry, 2002–2022.',
    prompt: 'Describe the information shown in the chart below in 25–40 seconds.',
    keyTerms: ['groundwater loss', 'aquifers', 'depletion', 'satellite', 'cubic kilometers', 'annual'],
    minWords: 25,
    data: {
      unit: 'km³ per year loss',
      categories: ['Northwest India', 'North China Plain', 'California Central', 'Middle East Basin', 'Ogallala USA', 'Guarani Brazil'],
      series: [
        { name: 'Net annual depletion', values: [17.7, 8.3, 3.1, 13.5, 6.1, 1.2], color: '#0284c7' },
      ],
    },
  },
  {
    id: 'chart-default-optin',
    title: 'Organ Donor Registration Rates: Opt-In vs Presumed Consent',
    kind: 'bar',
    caption: 'Donor authorization rate (%) under voluntary opt-in and default opt-out policies.',
    prompt: 'Describe the information shown in the chart below in 25–40 seconds.',
    keyTerms: ['organ donation', 'registration rate', 'presumed consent', 'opt-in', 'default', 'percentage'],
    minWords: 25,
    data: {
      unit: '% registered donors',
      categories: ['Germany (Opt-In)', 'UK (Pre-Reform)', 'Netherlands (Opt-In)', 'Spain (Presumed)', 'Austria (Presumed)', 'France (Presumed)'],
      series: [
        { name: 'Registration rate', values: [12, 17, 27, 92, 99, 91], color: '#10b981' },
      ],
    },
  },
  {
    id: 'chart-grid-storage',
    title: 'Capital Cost of Grid Energy Storage Technologies ($/kWh)',
    kind: 'bar',
    caption: 'Levelized capital cost comparison across energy storage solutions, 2015 vs 2024.',
    prompt: 'Describe the information shown in the chart below in 25–40 seconds.',
    keyTerms: ['storage cost', 'lithium-ion', 'pumped hydro', 'flow battery', 'capital cost', 'decline'],
    minWords: 25,
    data: {
      unit: 'USD per kilowatt-hour',
      categories: ['Lithium-ion', 'Pumped hydro', 'Vanadium redox', 'Compressed air', 'Sodium-ion'],
      series: [
        { name: '2015', values: [650, 180, 520, 240, 710], color: '#94a3b8' },
        { name: '2024', values: [135, 195, 290, 210, 110], color: '#3b82f6' },
      ],
    },
  },
  {
    id: 'chart-ev-materials',
    title: 'Mineral Requirements per Vehicle (kg)',
    kind: 'bar',
    caption: 'Critical mineral weight comparison: Electric vehicle vs Conventional vehicle.',
    prompt: 'Describe the information shown in the chart below in 25–40 seconds.',
    keyTerms: ['minerals', 'electric vehicle', 'copper', 'lithium', 'nickel', 'conventional', 'kilograms'],
    minWords: 25,
    data: {
      unit: 'kg per vehicle',
      categories: ['Copper', 'Lithium', 'Nickel', 'Manganese', 'Cobalt', 'Graphite'],
      series: [
        { name: 'Electric car', values: [53, 9, 40, 24, 13, 66], color: '#10b981' },
        { name: 'Conventional car', values: [22, 0, 0, 0, 0, 0], color: '#64748b' },
      ],
    },
  },
  {
    id: 'chart-antibiotic-classes',
    title: 'Discovery of Novel Antibiotic Classes by Decade',
    kind: 'bar',
    caption: 'Number of distinct chemical classes of antibiotics introduced to clinical practice.',
    prompt: 'Describe the information shown in the chart below in 25–40 seconds.',
    keyTerms: ['antibiotics', 'discovery void', 'classes', 'decades', 'peak', 'decline', 'clinical'],
    minWords: 25,
    data: {
      unit: 'New antibiotic classes discovered',
      categories: ['1940s', '1950s', '1960s', '1970s', '1980s', '1990s', '2000s', '2010s'],
      series: [
        { name: 'Discovered classes', values: [5, 9, 8, 4, 3, 0, 1, 1], color: '#f59e0b' },
      ],
    },
  },
  {
    id: 'chart-glacier-mass',
    title: 'Cumulative Glacier Mass Balance, 1970–2020',
    kind: 'line',
    caption: 'Mean cumulative mass change in meters of water equivalent across mountain ranges.',
    prompt: 'Describe the information shown in the graph below in 25–40 seconds.',
    keyTerms: ['glacier mass', 'cumulative loss', 'water equivalent', 'Alps', 'Himalayas', 'meters'],
    minWords: 25,
    data: {
      unit: 'Meters water equivalent loss',
      x: ['1970', '1980', '1990', '2000', '2010', '2020'],
      series: [
        { name: 'European Alps', values: [-2, -5, -12, -22, -32, -41], color: '#ef4444' },
        { name: 'Central Himalayas', values: [-1, -3, -7, -13, -19, -26], color: '#0ea5e9' },
        { name: 'Tropical Andes', values: [-2, -4, -10, -18, -27, -35], color: '#8b5cf6' },
      ],
    },
  },
]
