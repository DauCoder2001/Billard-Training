/** Treffpunkt auf dem Weissen: hoch/tief fuer Nachlauf und Rueckzieher,
 *  links/rechts fuer Effet. */

import { useRef, type PointerEvent as ReactPointerEvent } from 'react'
import type { Point } from '@/domain/types'

interface SpinPickerProps {
  value: Point
  onChange: (value: Point) => void
  size?: number
}

export function SpinPicker({ value, onChange, size = 108 }: SpinPickerProps) {
  const ref = useRef<SVGSVGElement>(null)
  const dragging = useRef(false)

  const update = (e: { clientX: number; clientY: number }) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    let x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    // Bildschirm-y zeigt nach unten, der Treffpunkt oben ist positiv.
    let y = -(((e.clientY - rect.top) / rect.height) * 2 - 1)
    const len = Math.hypot(x, y)
    // Der Treffpunkt bleibt auf dem Ball; weiter aussen rutscht der Queue ab.
    const limit = 0.92
    if (len > limit) {
      x = (x / len) * limit
      y = (y / len) * limit
    }
    onChange({ x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 })
  }

  return (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="-1.15 -1.15 2.3 2.3"
      style={{ touchAction: 'none', cursor: 'pointer' }}
      onPointerDown={(e: ReactPointerEvent<SVGSVGElement>) => {
        dragging.current = true
        e.currentTarget.setPointerCapture(e.pointerId)
        update(e)
      }}
      onPointerMove={(e) => dragging.current && update(e)}
      onPointerUp={() => (dragging.current = false)}
      onPointerCancel={() => (dragging.current = false)}
    >
      <circle cx={0} cy={0} r={1} fill="#f7f4ea" stroke="#c9c3b2" strokeWidth={0.03} />
      <g stroke="#b9b3a4" strokeWidth={0.02}>
        <line x1={-1} y1={0} x2={1} y2={0} />
        <line x1={0} y1={-1} x2={0} y2={1} />
        <circle cx={0} cy={0} r={0.5} fill="none" strokeDasharray="0.08 0.08" />
      </g>
      <circle cx={value.x} cy={-value.y} r={0.18} fill="#c8352b" stroke="#7c1f18" strokeWidth={0.03} />
    </svg>
  )
}

export function spinLabel(spin: Point): string {
  const parts: string[] = []
  if (spin.y > 0.15) parts.push('Nachlauf')
  else if (spin.y < -0.15) parts.push('Rueckzieher')
  if (spin.x > 0.15) parts.push('rechts')
  else if (spin.x < -0.15) parts.push('links')
  return parts.length > 0 ? parts.join(' / ') : 'mittig'
}
