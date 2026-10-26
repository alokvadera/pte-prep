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
  if (!chart || !chart.data || typeof chart.data !== 'object') return ''
  const d = chart.data as Record<string, unknown>
  switch (chart.kind) {
    case 'bar':
    case 'scatter': {
      const cats = Array.isArray(d.categories) ? (d.categories as string[]) : []
      const series = Array.isArray(d.series)
        ? (d.series as Array<{ name: string; values: number[] }>)
        : []
      return series
        .map(
          (s) =>
            `${s.name}: ${(Array.isArray(s.values) ? s.values : []).map((v, i) => `${cats[i] ?? ''} ${v}`).join(', ')}`,
        )
        .join('. ')
    }
    case 'line': {
      const x = Array.isArray(d.x) ? (d.x as string[]) : []
      const series = Array.isArray(d.series)
        ? (d.series as Array<{ name: string; values: number[] }>)
        : []
      return series
        .map(
          (s) =>
            `${s.name}: ${(Array.isArray(s.values) ? s.values : []).map((v, i) => `${x[i] ?? ''} ${v}`).join(', ')}`,
        )
        .join('. ')
    }
    case 'pie': {
      const slices = Array.isArray(d.slices)
        ? (d.slices as Array<{ name: string; value: number }>)
        : []
      return slices.map((s) => `${s.name} ${s.value} per cent`).join(', ')
    }
    case 'process': {
      const steps = Array.isArray(d.steps)
        ? (d.steps as Array<{ label: string; detail: string }>)
        : []
      return steps.map((s) => `${s.label} — ${s.detail}`).join('. ')
    }
    case 'diagram': {
      const nodes = Array.isArray(d.nodes) ? (d.nodes as Node[]) : []
      return nodes.map((n) => `${n.label} (${n.kind})`).join(', ')
    }
    case 'table-chart': {
      const headers = Array.isArray(d.headers) ? (d.headers as string[]) : []
      const rows = Array.isArray(d.rows) ? (d.rows as string[][]) : []
      return rows.map((r) => headers.map((h, c) => `${h} ${r?.[c] ?? ''}`).join(', ')).join('. ')
    }
    default:
      return ''
  }
}
