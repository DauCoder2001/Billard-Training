/** Kleine eigene SVG-Diagramme. Bewusst ohne Bibliothek: es sind wenige
 *  Formen, und so bleiben Stil und Bundle unter Kontrolle. */

import { SKILL_LABELS } from '@/domain/types'
import type { SkillTag } from '@/domain/types'

interface SparklineProps {
  values: number[]
  max?: number
  height?: number
  label?: string
}

/** Verlauf einer Kennzahl. Der letzte Wert ist hervorgehoben. */
export function Sparkline({ values, max = 100, height = 56, label }: SparklineProps) {
  if (values.length === 0) return <p className="small muted">Noch keine Daten.</p>
  const w = 100
  const pad = 3
  const step = values.length > 1 ? (w - pad * 2) / (values.length - 1) : 0
  const y = (v: number) => height - pad - (Math.max(0, Math.min(max, v)) / max) * (height - pad * 2)
  const points = values.map((v, i) => `${pad + i * step},${y(v)}`)
  const area = `M ${pad},${height - pad} L ${points.join(' L ')} L ${pad + (values.length - 1) * step},${height - pad} Z`

  return (
    <svg
      viewBox={`0 0 ${w} ${height}`}
      width="100%"
      height={height}
      preserveAspectRatio="none"
      role="img"
      aria-label={label ?? `Verlauf, letzter Wert ${values[values.length - 1].toFixed(0)}`}
    >
      <line x1={0} y1={y(max / 2)} x2={w} y2={y(max / 2)} stroke="var(--line)" strokeWidth={0.4} />
      {values.length > 1 && <path d={area} fill="var(--accent)" opacity={0.12} />}
      {values.length > 1 && (
        <polyline
          points={points.join(' ')}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={1.2}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      )}
      <circle cx={pad + (values.length - 1) * step} cy={y(values[values.length - 1])} r={1.8} fill="var(--accent)" />
    </svg>
  )
}

interface BarsProps {
  items: { label: string; value: number; hint?: string }[]
  max?: number
  unit?: string
}

/** Waagerechte Balken. Gut lesbar auch bei langen Beschriftungen. */
export function Bars({ items, max = 100, unit = '%' }: BarsProps) {
  if (items.length === 0) return <p className="small muted">Noch keine Daten.</p>
  return (
    <div className="bars">
      {items.map((item) => (
        <div key={item.label} className="bars__row">
          <span className="bars__label" title={item.hint}>
            {item.label}
          </span>
          <div className="bar">
            <div
              className="bar__fill"
              style={{ width: `${Math.max(0, Math.min(100, (item.value / max) * 100))}%` }}
            />
          </div>
          <span className="bars__value">
            {item.value.toFixed(0)}
            {unit}
          </span>
        </div>
      ))}
    </div>
  )
}

interface RadarProps {
  values: { skill: SkillTag; rating: number }[]
  size?: number
}

/** Netzdiagramm ueber die Faehigkeiten. */
export function SkillRadar({ values, size = 280 }: RadarProps) {
  if (values.length < 3) return <p className="small muted">Zu wenige Werte fuer ein Netz.</p>
  const r = 40
  const cx = 50
  const cy = 50
  const n = values.length
  const angle = (i: number) => (i / n) * Math.PI * 2 - Math.PI / 2
  const point = (i: number, value: number) => {
    const rad = (Math.max(0, Math.min(100, value)) / 100) * r
    return [cx + Math.cos(angle(i)) * rad, cy + Math.sin(angle(i)) * rad]
  }

  const polygon = values.map((v, i) => point(i, v.rating).join(',')).join(' ')

  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label="Faehigkeitsprofil">
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <polygon
          key={f}
          points={values.map((_, i) => point(i, f * 100).join(',')).join(' ')}
          fill="none"
          stroke="var(--line)"
          strokeWidth={0.4}
        />
      ))}
      {values.map((_, i) => {
        const [x, y] = point(i, 100)
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--line)" strokeWidth={0.3} />
      })}
      <polygon points={polygon} fill="var(--accent)" fillOpacity={0.22} stroke="var(--accent)" strokeWidth={0.9} />
      {values.map((v, i) => {
        const [x, y] = point(i, 108)
        return (
          <text
            key={v.skill}
            x={x}
            y={y}
            fontSize={3.1}
            fill="var(--muted)"
            textAnchor={x > cx + 2 ? 'start' : x < cx - 2 ? 'end' : 'middle'}
            dominantBaseline="middle"
          >
            {SKILL_LABELS[v.skill]}
          </text>
        )
      })}
    </svg>
  )
}
