/** Das Tischdiagramm. Alles darin rechnet in Tischkoordinaten (Zoll). */

import { forwardRef, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { BREAK_BOX, DIAGRAM, POCKETS, POCKET_BY_ID, TABLE, diamondLines, diamonds } from '@/domain/geometry'
import type { Pocket } from '@/domain/geometry'
import { rackOutline } from '@/domain/rack'
import type { Markings, Point } from '@/domain/types'
import { contrastInk, shade } from './colors'
import { OrientationContext, flipY, rotationFor, viewBoxFor, type Orientation } from './space'

/** Breite der sichtbaren Bandenkante am Tuchrand. */
const CUSHION = 1.35

/**
 * Das ruhige Bild eines festen Diagramms: ein Tisch mit seinen eigenen
 * Markierungen, ohne Zeichenhilfen. Wer den Tisch als Arbeitsflaeche nutzt -
 * Baukasten und Training -, reicht die Einstellungen des Nutzers herein.
 */
const DIAGRAMM: Markings = {
  diamonds: true,
  headString: true,
  spots: true,
  guides: false,
  breakBox: false,
  rackOutline: false,
  grid: false,
}

interface CushionSegment {
  /** Anfang und Ende auf der Bandenlinie, jeweils eine Taschenbacke. */
  a: Point
  b: Point
  /** Einheitsvektor in den Tisch hinein. */
  n: Point
}

/**
 * Die sechs Bandenstuecke. Sie laufen jeweils von einer Taschenbacke zur
 * naechsten; die Luecken dazwischen sind die Taschenmuendungen. Die Backen
 * stehen schon in der Geometrie, deshalb wird hier nichts neu gerechnet:
 * jaws[0] liegt an der Laengsbande, jaws[1] an der Kurzbande.
 */
const CUSHIONS: CushionSegment[] = [
  { a: POCKET_BY_ID.bl.jaws[0], b: POCKET_BY_ID.bm.jaws[0], n: { x: 0, y: 1 } },
  { a: POCKET_BY_ID.bm.jaws[1], b: POCKET_BY_ID.br.jaws[0], n: { x: 0, y: 1 } },
  { a: POCKET_BY_ID.tl.jaws[0], b: POCKET_BY_ID.tm.jaws[0], n: { x: 0, y: -1 } },
  { a: POCKET_BY_ID.tm.jaws[1], b: POCKET_BY_ID.tr.jaws[0], n: { x: 0, y: -1 } },
  { a: POCKET_BY_ID.bl.jaws[1], b: POCKET_BY_ID.tl.jaws[1], n: { x: 1, y: 0 } },
  { a: POCKET_BY_ID.br.jaws[1], b: POCKET_BY_ID.tr.jaws[1], n: { x: -1, y: 0 } },
]

/**
 * Viereck eines Bandenstuecks: aussen auf der Bandenlinie, innen um die
 * Bandenbreite versetzt und an beiden Enden um dasselbe Mass eingezogen.
 * Daraus ergibt sich die Gehrung, mit der die Bande in die Tasche laeuft.
 */
function cushionPoints(seg: CushionSegment): string {
  const dx = seg.b.x - seg.a.x
  const dy = seg.b.y - seg.a.y
  const len = Math.hypot(dx, dy) || 1
  const ux = (dx / len) * CUSHION
  const uy = (dy / len) * CUSHION
  const inner: Point[] = [
    { x: seg.b.x + seg.n.x * CUSHION - ux, y: seg.b.y + seg.n.y * CUSHION - uy },
    { x: seg.a.x + seg.n.x * CUSHION + ux, y: seg.a.y + seg.n.y * CUSHION + uy },
  ]
  return [seg.a, seg.b, ...inner].map((p) => `${p.x},${flipY(p.y)}`).join(' ')
}

interface TableSvgProps {
  orientation?: Orientation
  clothColor?: string
  railColor?: string
  /** Was zu sehen ist. Fehlendes bleibt beim ruhigen Diagramm. */
  markings?: Partial<Markings>
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
    clothColor = '#3f92d2',
    railColor = '#e7eaee',
    markings,
    className,
    interactive = false,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    children,
  },
  ref,
) {
  const sicht = { ...DIAGRAMM, ...markings }
  const diamondList = sicht.diamonds ? diamonds() : []

  // Alles Weitere folgt aus den beiden gewaehlten Farben, damit das Bild bei
  // jeder Tuch- und Rahmenfarbe stimmig bleibt.
  const cushionColor = shade(clothColor, -0.22)
  const markingColor = shade(clothColor, -0.55)
  const frameEdge = shade(railColor, -0.12)
  const diamondColor = contrastInk(railColor, '#8b95a1', '#efe7d4')
  const pocketRim = contrastInk(railColor, '#1c2126', '#6d757e')

  return (
    <OrientationContext.Provider value={orientation}>
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
          {/* Rahmen. Die feine Innenkante trennt ihn vom Seitenhintergrund,
              der bei hellen Rahmenfarben aehnlich hell sein kann. */}
          <rect x={0} y={0} width={DIAGRAM.width} height={DIAGRAM.height} rx={3.4} fill={railColor} />
          <rect
            x={0.2}
            y={0.2}
            width={DIAGRAM.width - 0.4}
            height={DIAGRAM.height - 0.4}
            rx={3.3}
            fill="none"
            stroke={frameEdge}
            strokeWidth={0.3}
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
              return <circle key={i} cx={x} cy={y} r={0.55} fill={diamondColor} />
            })}
          </g>

          <g ref={ref} transform={`translate(${DIAGRAM.offset} ${DIAGRAM.offset})`}>
            <rect x={0} y={0} width={TABLE.length} height={TABLE.width} fill={clothColor} />

            {/* Taschen liegen unter der Bande: die Ecktasche reicht ein Stueck
                ueber die Muendungslinie ins Tuch, und erst die darueber
                liegende Bande formt daraus die Backe. Der Rand macht die
                Tasche auch auf einem dunklen Rahmen sichtbar; auf einem
                hellen faellt er mit der Lochfarbe zusammen. */}
            <g fill="#1c2126" stroke={pocketRim} strokeWidth={0.28}>
              {POCKETS.map((p) =>
                p.kind === 'corner' ? (
                  <CornerPocket key={p.id} pocket={p} />
                ) : (
                  <circle key={p.id} cx={p.hole.x} cy={flipY(p.hole.y)} r={p.holeRadius} />
                ),
              )}
            </g>

            {/* Bandenkante entlang der Spielflaeche, an den Taschen auf Gehrung. */}
            <g fill={cushionColor}>
              {CUSHIONS.map((seg, i) => (
                <polygon key={i} points={cushionPoints(seg)} />
              ))}
            </g>

            {/* Zeichenhilfen liegen unter den Markierungen des Tisches: die
                Kopflinie bleibt die kraeftigste Linie auf dem Tuch. */}
            {sicht.guides && (
              <g
                data-ebene="hilfslinien"
                pointerEvents="none"
                stroke={markingColor}
                strokeWidth={0.12}
                opacity={0.4}
              >
                {diamondLines().map(([a, b], i) => (
                  <line key={i} x1={a.x} y1={flipY(a.y)} x2={b.x} y2={flipY(b.y)} />
                ))}
              </g>
            )}
            {sicht.breakBox && (
              <rect
                data-ebene="breakbox"
                pointerEvents="none"
                x={BREAK_BOX.x}
                y={flipY(BREAK_BOX.y + BREAK_BOX.height)}
                width={BREAK_BOX.width}
                height={BREAK_BOX.height}
                fill="none"
                stroke={markingColor}
                strokeWidth={0.22}
                strokeDasharray="1.6 1.2"
                opacity={0.55}
              />
            )}
            {sicht.rackOutline && (
              <polygon
                data-ebene="dreieck"
                pointerEvents="none"
                points={rackOutline()
                  .map((p) => `${p.x},${flipY(p.y)}`)
                  .join(' ')}
                fill="none"
                stroke={markingColor}
                strokeWidth={0.22}
                opacity={0.5}
              />
            )}

            {sicht.headString && (
              <line
                x1={TABLE.headString}
                y1={0}
                x2={TABLE.headString}
                y2={TABLE.width}
                stroke={markingColor}
                strokeWidth={0.28}
                opacity={0.5}
              />
            )}
            {sicht.spots && (
              <>
                <Spot at={TABLE.headSpot} r={0.7} ink={markingColor} />
                {/* Am Fusspunkt wird aufgebaut, deshalb eine Spur groesser. */}
                <Spot at={TABLE.footSpot} r={0.78} ink={markingColor} />
              </>
            )}

            {children}
          </g>
        </g>
      </svg>
    </OrientationContext.Provider>
  )
})

/**
 * Ecktasche als gerundete Raute: ein um 45 Grad gedrehtes Quadrat um den
 * Tischeckpunkt. Seine dem Tisch zugewandte Seite liegt parallel zur
 * Muendung und ragt eine halbe Zoll darueber hinaus, damit die Tasche
 * zwischen den Backen offen wirkt statt buendig abzuschliessen.
 */
function CornerPocket({ pocket }: { pocket: Pocket }) {
  // jaws[0] liegt auf der Laengsbande, jaws[1] auf der Querbande - ihr
  // Schnittpunkt ist die Tischecke.
  const cx = pocket.jaws[1].x
  const cy = flipY(pocket.jaws[0].y)
  const size = TABLE.cornerMouth + 0.5
  return (
    <rect
      x={cx - size / 2}
      y={cy - size / 2}
      width={size}
      height={size}
      rx={1.2}
      transform={`rotate(45 ${cx} ${cy})`}
    />
  )
}

/** Kopf- oder Fusspunkt: heller Punkt mit feiner Kontur, auf jedem Tuch sichtbar. */
function Spot({ at, r, ink }: { at: Point; r: number; ink: string }) {
  const cy = flipY(at.y)
  return (
    <g pointerEvents="none">
      <circle cx={at.x} cy={cy} r={r} fill="#f2f6fa" opacity={0.9} />
      <circle cx={at.x} cy={cy} r={r} fill="none" stroke={ink} strokeWidth={0.14} opacity={0.5} />
    </g>
  )
}
