import { CHART_INDEX } from '../content/bank'

/** A node in the simplified food-web diagram. */
export interface Node {
  id: string
  label: string
  /** Position as a percentage of the viewBox. */
  x: number
  y: number
  kind: 'source' | 'producer' | 'primary' | 'secondary'
}


/** Plain-text description of a chart, used for the accessible name and for
 *  screen readers, and reused in the written reference answer. */
export function describeData(chartId: string): string {
  const chart = CHART_INDEX.get(chartId)
  if (!chart) return ''
  const d = chart.data as Record<string, unknown>
  switch (chart.kind) {
    case 'bar':
    case 'scatter': {
      const cats = d.categories as string[]
      const series = d.series as Array<{ name: string; values: number[] }>
      return series
        .map((s) => `${s.name}: ${s.values.map((v, i) => `${cats[i]} ${v}`).join(', ')}`)
        .join('. ')
    }
    case 'line': {
      const x = d.x as string[]
      const series = d.series as Array<{ name: string; values: number[] }>
      return series.map((s) => `${s.name}: ${s.values.map((v, i) => `${x[i]} ${v}`).join(', ')}`).join('. ')
    }
    case 'pie':
      return (d.slices as Array<{ name: string; value: number }>)
        .map((s) => `${s.name} ${s.value} per cent`)
        .join(', ')
    case 'process':
      return (d.steps as Array<{ label: string; detail: string }>).map((s) => `${s.label} — ${s.detail}`).join('. ')
    case 'diagram': {
      const nodes = d.nodes as Node[]
      return nodes.map((n) => `${n.label} (${n.kind})`).join(', ')
    }
    case 'table-chart':
      return (d.rows as string[][]).map((r) => (d.headers as string[]).map((h, c) => `${h} ${r[c]}`).join(', ')).join('. ')
    default:
      return ''
  }
}
