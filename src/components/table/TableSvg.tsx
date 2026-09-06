/** Das Tischdiagramm. Alles darin rechnet in Tischkoordinaten (Zoll). */

import { forwardRef, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { DIAGRAM, POCKETS, TABLE, diamonds } from '@/domain/geometry'
import { flipY, rotationFor, viewBoxFor, type Orientation } from './space'

interface TableSvgProps {
  orientation?: Orientation
  clothColor?: string
  railColor?: string
  showDiamonds?: boolean
  showMarkings?: boolean
  className?: string
  interactive?: boolean
  onPointerDown?: (e: ReactPointerEvent<SVGSVGElement>) => void
  onPointerMove?: (e: ReactPointerEvent<SVGSVGElement>) => void
  onPointerUp?: (e: ReactPointerEvent<SVGSVGElement>) => void
  children?: ReactNode
}

/**
 * Der Ref zeigt auf die Gruppe der Spielflaeche. Ueber deren Matrix rechnet
 * clientToTable Bildschirm- in Tischkoordinaten um.
 */
export const TableSvg = forwardRef<SVGGElement, TableSvgProps>(function TableSvg(
  {
    orientation = 'landscape',
    clothColor = '#1f6b52',
    railColor = '#5b3a22',
    showDiamonds = true,
    showMarkings = true,
    className,
    interactive = false,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    children,
  },
  ref,
) {
  const diamondList = showDiamonds ? diamonds() : []

  return (
    <svg
      className={`table-svg${interactive ? ' table-svg--interactive' : ''}${className ? ` ${className}` : ''}`}
      viewBox={viewBoxFor(orientation)}
      preserveAspectRatio="xMidYMid meet"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <g transform={rotationFor(orientation)}>
        {/* Bandenrahmen */}
        <rect
          x={0}
          y={0}
          width={DIAGRAM.width}
          height={DIAGRAM.height}
          rx={2.5}
          fill={railColor}
        />
        <g transform={`translate(${DIAGRAM.offset} ${DIAGRAM.offset})`}>
          {/* Diamanten sitzen auf der Bande, also ausserhalb der Spielflaeche. */}
          {diamondList.map((d, i) => {
            const inset = 2.5
            const x = d.rail === 'left' ? -inset : d.rail === 'right' ? TABLE.length + inset : d.x
            const y =
              d.rail === 'bottom'
                ? flipY(-inset)
                : d.rail === 'top'
                  ? flipY(TABLE.width + inset)
                  : flipY(d.y)
            return (
              <rect
                key={i}
                x={x - 0.75}
                y={y - 0.75}
                width={1.5}
                height={1.5}
                transform={`rotate(45 ${x} ${y})`}
                fill="#efe7d4"
                opacity={0.85}
              />
            )
          })}
        </g>

        <g ref={ref} transform={`translate(${DIAGRAM.offset} ${DIAGRAM.offset})`}>
          <rect x={0} y={0} width={TABLE.length} height={TABLE.width} fill={clothColor} />

          {showMarkings && (
            <g stroke="#ffffff" opacity={0.22} fill="none">
              <line
                x1={TABLE.headString}
                y1={0}
                x2={TABLE.headString}
                y2={TABLE.width}
                strokeWidth={0.3}
                strokeDasharray="1.6 1.6"
              />
            </g>
          )}
          {showMarkings && (
            <g fill="#ffffff" opacity={0.3}>
              <circle cx={TABLE.footSpot.x} cy={flipY(TABLE.footSpot.y)} r={0.7} />
              <circle cx={TABLE.headSpot.x} cy={flipY(TABLE.headSpot.y)} r={0.5} />
            </g>
          )}

          {/* Taschen: Loch, dahinter die Muendungslinie zwischen den Backen. */}
          {POCKETS.map((p) => (
            <g key={p.id}>
              <line
                x1={p.jaws[0].x}
                y1={flipY(p.jaws[0].y)}
                x2={p.jaws[1].x}
                y2={flipY(p.jaws[1].y)}
                stroke={railColor}
                strokeWidth={1.1}
                strokeLinecap="round"
                opacity={0.9}
              />
              <circle cx={p.hole.x} cy={flipY(p.hole.y)} r={p.holeRadius} fill="#0a0d0b" />
            </g>
          ))}

          {children}
        </g>
      </g>
    </svg>
  )
})
