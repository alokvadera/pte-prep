import { CHART_INDEX } from '../../content/bank'
import { describeData, type Node } from '../../lib/chartData'

// ---------------------------------------------------------------------------
// Chart stimuli for Describe Image are drawn as inline SVG from the data in
// `content/charts.ts`. This keeps the app free of image assets and gives every
// stimulus a real text alternative through the `role="img"` / `aria-label`
// pair on the wrapper.
// ---------------------------------------------------------------------------

interface Props {
  chartId: string
  className?: string
}

const W = 640
const H = 380
const PAD = { top: 28, right: 24, bottom: 52, left: 62 }

function niceMax(value: number): number {
  if (value <= 0) return 1
  const magnitude = 10 ** Math.floor(Math.log10(value))
  const candidates = [1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].map((m) => m * magnitude)
  return candidates.find((c) => c >= value) ?? value
}

function GridLines({ max, left, right, top, bottom, ticks = 5 }: { max: number; left: number; right: number; top: number; bottom: number; ticks?: number }) {
  return (
    <g aria-hidden="true">
      {Array.from({ length: ticks + 1 }, (_, i) => {
        const v = (max / ticks) * i
        const y = bottom - ((bottom - top) / ticks) * i
        return (
          <g key={i}>
            <line x1={left} x2={right} y1={y} y2={y} stroke="currentColor" strokeOpacity={i === 0 ? 0.35 : 0.1} strokeWidth={1} />
            <text x={left - 8} y={y + 4} textAnchor="end" className="fill-current text-xs opacity-60 tabular-nums">
              {Math.round(v * 10) / 10}
            </text>
          </g>
        )
      })}
    </g>
  )
}

function BarChart({ data }: { data: Record<string, unknown> }) {
  const categories = data.categories as string[]
  const series = data.series as Array<{ name: string; values: number[]; color: string }>
  const unit = (data.unit as string) ?? ''
  const max = niceMax(Math.max(...series.flatMap((s) => s.values)))
  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom
  const groupW = plotW / categories.length
  const barGap = 3
  const barW = Math.max(4, (groupW * 0.72 - barGap * (series.length - 1)) / series.length)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="presentation">
      <text x={PAD.left} y={16} className="fill-current text-xs font-semibold opacity-70">
        {unit}
      </text>
      <GridLines max={max} left={PAD.left} right={W - PAD.right} top={PAD.top} bottom={H - PAD.bottom} />
      {categories.map((cat, ci) => {
        const gx = PAD.left + groupW * ci + groupW * 0.14
        return (
          <g key={cat}>
            {series.map((s, si) => {
              const v = s.values[ci] ?? 0
              const h = (v / max) * plotH
              const x = gx + si * (barW + barGap)
              const y = H - PAD.bottom - h
              return (
                <g key={s.name}>
                  <rect
                    x={x}
                    y={y}
                    width={barW}
                    height={Math.max(1, h)}
                    rx={2}
                    fill={s.color}
                    opacity={0.92}
                    className="animate-grow-up"
                    style={{ animationDelay: `${ci * 90 + si * 45}ms` }}
                  />
                  <text
                    x={x + barW / 2}
                    y={y - 5}
                    textAnchor="middle"
                    className="fill-current text-xs font-semibold opacity-75 tabular-nums animate-fade-in"
                    style={{ animationDelay: `${ci * 90 + si * 45 + 250}ms` }}
                  >
                    {v}
                  </text>
                </g>
              )
            })}
            <text x={PAD.left + groupW * ci + groupW / 2} y={H - PAD.bottom + 18} textAnchor="middle" className="fill-current text-xs opacity-80">
              {cat}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function LineChart({ data }: { data: Record<string, unknown> }) {
  const x = data.x as string[]
  const series = data.series as Array<{ name: string; values: number[]; color: string }>
  const unit = (data.unit as string) ?? ''
  const all = series.flatMap((s) => s.values)
  const rawMax = Math.max(...all)
  const rawMin = Math.min(...all)
  const max = niceMax(rawMax)
  const min = Math.min(0, Math.floor(rawMin))
  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom
  const px = (i: number) => PAD.left + (plotW / Math.max(1, x.length - 1)) * i
  const py = (v: number) => H - PAD.bottom - ((v - min) / (max - min)) * plotH

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="presentation">
      <text x={PAD.left} y={16} className="fill-current text-xs font-semibold opacity-70">
        {unit}
      </text>
      {Array.from({ length: 5 }, (_, i) => {
        const v = min + ((max - min) / 4) * i
        const y = py(v)
        return (
          <g key={i}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} stroke="currentColor" strokeOpacity={v === 0 ? 0.4 : 0.1} strokeWidth={1} />
            <text x={PAD.left - 8} y={y + 4} textAnchor="end" className="fill-current text-xs opacity-60 tabular-nums">
              {Math.round(v * 100) / 100}
            </text>
          </g>
        )
      })}
      {x.map((label, i) => (
        <text key={label} x={px(i)} y={H - PAD.bottom + 18} textAnchor="middle" className="fill-current text-xs opacity-75">
          {label}
        </text>
      ))}
      {series.map((s) => (
        <g key={s.name}>
          <polyline
            points={s.values.map((v, i) => `${px(i)},${py(v)}`).join(' ')}
            fill="none"
            stroke={s.color}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
            pathLength={1}
            className="animate-draw-line"
          />
          {s.values.map((v, i) => (
            <circle
              key={i}
              cx={px(i)}
              cy={py(v)}
              r={3.2}
              fill={s.color}
              className="animate-pop"
              style={{ transformBox: 'fill-box', animationDelay: `${300 + i * 70}ms` }}
            />
          ))}
        </g>
      ))}
    </svg>
  )
}

function PieChart({ data }: { data: Record<string, unknown> }) {
  const slices = data.slices as Array<{ name: string; value: number; color: string }>
  const total = slices.reduce((a, s) => a + s.value, 0)
  const cx = 210
  const cy = H / 2
  const r = 118
  // Precompute the start angle of each slice so nothing is mutated during render.
  const arcs = slices.reduce<Array<{ slice: (typeof slices)[number]; a0: number; a1: number }>>(
    (acc, slice) => {
      const a0 = acc.length === 0 ? -Math.PI / 2 : acc[acc.length - 1]!.a1
      acc.push({ slice, a0, a1: a0 + (slice.value / total) * Math.PI * 2 })
      return acc
    },
    [],
  )

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="presentation">
      {arcs.map(({ slice: s, a0, a1 }, i) => {
        const large = a1 - a0 > Math.PI ? 1 : 0
        const x0 = cx + r * Math.cos(a0)
        const y0 = cy + r * Math.sin(a0)
        const x1 = cx + r * Math.cos(a1)
        const y1 = cy + r * Math.sin(a1)
        return (
          <path
            key={s.name}
            d={`M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`}
            fill={s.color}
            stroke="white"
            strokeOpacity={0.6}
            strokeWidth={1.5}
            className="animate-pop"
            style={{ transformBox: 'fill-box', animationDelay: `${i * 90}ms` }}
          >
            <title>{`${s.name}: ${s.value}%`}</title>
          </path>
        )
      })}
      {slices.map((s, i) => {
        return (
          <g key={s.name} className="animate-rise-in" style={{ animationDelay: `${150 + i * 70}ms` }}>
            <rect x={390} y={64 + i * 42} width={12} height={12} rx={2} fill={s.color} />
            <text x={412} y={74 + i * 42} className="fill-current text-sm">
              {s.name}
            </text>
            <text x={W - 24} y={74 + i * 42} textAnchor="end" className="fill-current text-sm font-semibold tabular-nums">
              {s.value}%
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function ProcessChart({ data, chartId = 'process' }: { data: Record<string, unknown>; chartId?: string }) {
  const steps = data.steps as Array<{ label: string; detail: string }>
  const loop = data.loop as string
  const boxW = 128
  const boxH = 104
  const gap = 18
  const startX = (W - (steps.length * boxW + (steps.length - 1) * gap)) / 2
  const y = 92
  const arrowId = `arrow-${chartId}`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="presentation">
      {steps.map((s, i) => {
        const x = startX + i * (boxW + gap)
        return (
          <g key={s.label} className="animate-rise-in" style={{ animationDelay: `${i * 100}ms` }}>
            <rect x={x} y={y} width={boxW} height={boxH} rx={12} className="fill-brand-500/10 stroke-brand-500/50" strokeWidth={1.5} />
            <text x={x + boxW / 2} y={y + 30} textAnchor="middle" className="fill-current text-xs font-bold">
              {s.label}
            </text>
            {s.detail.split(/(?<=[.!?])\s+/).slice(0, 3).map((d, di) => (
              <text key={di} x={x + boxW / 2} y={y + 52 + di * 15} textAnchor="middle" className="fill-current text-[9.5px] opacity-75">
                {d.length > 26 ? `${d.slice(0, 25)}…` : d}
              </text>
            ))}
            {i < steps.length - 1 ? (
              <path
                d={`M ${x + boxW + 3} ${y + boxH / 2} L ${x + boxW + gap - 3} ${y + boxH / 2}`}
                stroke="currentColor"
                strokeOpacity={0.45}
                strokeWidth={2}
                markerEnd={`url(#${arrowId})`}
                className="animate-fade-in"
                style={{ animationDelay: `${300 + i * 100}ms` }}
              />
            ) : null}
          </g>
        )
      })}
      <defs>
        <marker id={arrowId} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L7,3 z" className="fill-current" opacity={0.5} />
        </marker>
      </defs>
      <path
        d={`M ${startX + (steps.length - 1) * (boxW + gap) + boxW / 2} ${y + boxH + 6} L ${startX + (steps.length - 1) * (boxW + gap) + boxW / 2} ${y + boxH + 42} L ${startX + (steps.length - 2) * (boxW + gap) + boxW / 2} ${y + boxH + 42} L ${startX + (steps.length - 2) * (boxW + gap) + boxW / 2} ${y + boxH + 6}`}
        fill="none"
        stroke="currentColor"
        strokeOpacity={0.3}
        strokeDasharray="4 4"
        strokeWidth={1.5}
        markerEnd={`url(#${arrowId})`}
      />
      <text x={W / 2} y={y + boxH + 66} textAnchor="middle" className="fill-current text-[10.5px] italic opacity-65">
        {loop}
      </text>
    </svg>
  )
}

function DiagramChart({ data, chartId = 'diagram' }: { data: Record<string, unknown>; chartId?: string }) {
  const nodes = data.nodes as Node[]
  const edges = data.edges as Array<[string, string]>
  const note = data.note as string
  const byId = new Map(nodes.map((n) => [n.id, n]))
  const edgeId = `fedge-${chartId}`
  const fills: Record<Node['kind'], string> = {
    source: 'fill-amber-500/15 stroke-amber-500/60',
    producer: 'fill-mint-500/15 stroke-mint-500/60',
    primary: 'fill-brand-500/15 stroke-brand-500/60',
    secondary: 'fill-rose-brand/15 stroke-rose-brand/60',
  }
  const nx = (p: number) => 40 + (p / 100) * (W - 80)
  const ny = (p: number) => 20 + (p / 100) * (H - 40)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="presentation">
      <defs>
        <marker id={edgeId} markerWidth="7" markerHeight="7" refX="6" refY="2.5" orient="auto">
          <path d="M0,0 L0,5 L6,2.5 z" className="fill-current" opacity={0.4} />
        </marker>
      </defs>
      {edges.map(([from, to], i) => {
        const a = byId.get(from)
        const b = byId.get(to)
        if (!a || !b) return null
        const x1 = nx(a.x)
        const y1 = ny(a.y)
        const x2 = nx(b.x)
        const y2 = ny(b.y)
        const mx = (x1 + x2) / 2
        return (
          <path
            key={i}
            d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.28}
            strokeWidth={1.4}
            markerEnd={`url(#${edgeId})`}
            className="animate-fade-in"
            style={{ animationDelay: `${i * 60}ms` }}
          />
        )
      })}
      {nodes.map((n, i) => (
        <g key={n.id} className="animate-pop" style={{ transformBox: 'fill-box', animationDelay: `${200 + i * 80}ms` }}>
          <rect x={nx(n.x) - 38} y={ny(n.y) - 15} width={76} height={30} rx={15} className={fills[n.kind]} strokeWidth={1.5} />
          <text x={nx(n.x)} y={ny(n.y) + 4} textAnchor="middle" className="fill-current text-[11.5px] font-semibold">
            {n.label}
          </text>
        </g>
      ))}
      <text x={W / 2} y={H - 8} textAnchor="middle" className="fill-current text-[10.5px] italic opacity-65">
        {note}
      </text>
    </svg>
  )
}

function TableChart({ data }: { data: Record<string, unknown> }) {
  const headers = data.headers as string[]
  const rows = data.rows as string[][]
  const colW = (W - 80) / headers.length
  const rowH = 46

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="presentation">
      {headers.map((h, c) => (
        <text
          key={h}
          x={40 + colW * c + colW / 2}
          y={86}
          textAnchor="middle"
          className="fill-current text-xs font-bold"
        >
          {h}
        </text>
      ))}
      {rows.map((row, r) => (
        <g key={r} className="animate-rise-in" style={{ animationDelay: `${r * 80}ms` }}>
          <line x1={40} x2={W - 40} y1={98 + rowH * r} y2={98 + rowH * r} stroke="currentColor" strokeOpacity={0.14} />
          {row.map((cell, c) => (
            <text
              key={c}
              x={40 + colW * c + colW / 2}
              y={98 + rowH * r + 30}
              textAnchor="middle"
              className="fill-current text-[12.5px] opacity-85 tabular-nums"
            >
              {cell}
            </text>
          ))}
        </g>
      ))}
      <line x1={40} x2={W - 40} y1={98 + rowH * rows.length} y2={98 + rowH * rows.length} stroke="currentColor" strokeOpacity={0.3} />
      {headers.map((h, c) => (
        <text key={`h${c}`} x={40 + colW * c + colW / 2} y={40 + rowH * rows.length + 4} textAnchor="middle" className="fill-current text-xs font-bold">
          {h}
        </text>
      ))}
    </svg>
  )
}

export function ChartRenderer({ chartId, className }: Props) {
  const chart = CHART_INDEX.get(chartId)
  if (!chart) return null
  const data = chart.data as Record<string, unknown>

  return (
    <figure className={className}>
      <figcaption className="text-ink-800 dark:text-ink-100 mb-3 text-center text-sm font-semibold">{chart.title}</figcaption>
      <div
        role="img"
        aria-label={`${chart.title}. ${chart.caption} ${describeData(chartId)}`}
        className="text-ink-700 dark:text-ink-200 bg-white/70 dark:bg-white/4 rounded-lg border border-ink-200 dark:border-white/10 p-4"
      >
        {chart.kind === 'bar' || chart.kind === 'scatter' ? <BarChart data={data} /> : null}
        {chart.kind === 'line' ? <LineChart data={data} /> : null}
        {chart.kind === 'pie' ? <PieChart data={data} /> : null}
        {chart.kind === 'process' ? <ProcessChart data={data} chartId={chartId} /> : null}
        {chart.kind === 'diagram' ? <DiagramChart data={data} chartId={chartId} /> : null}
        {chart.kind === 'table-chart' ? <TableChart data={data} /> : null}
      </div>
      <p className="text-ink-500 dark:text-ink-on-dark-muted mt-2 text-center text-xs">{chart.caption}</p>
    </figure>
  )
}
