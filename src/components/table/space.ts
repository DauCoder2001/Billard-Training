/** Umrechnung zwischen Tischkoordinaten und SVG-Koordinaten.
 *
 *  Auf dem Tisch waechst y nach oben, im SVG nach unten. Nur diese eine
 *  Spiegelung trennt beide Systeme; Drehung und Skalierung uebernimmt die
 *  Transformationsmatrix des SVG.
 */

import { createContext, useContext } from 'react'
import { DIAGRAM, TABLE } from '@/domain/geometry'
import type { Point } from '@/domain/types'

export type Orientation = 'landscape' | 'portrait'

/** Tisch-y in SVG-y. Die Funktion ist ihr eigenes Gegenstueck. */
export function flipY(y: number): number {
  return TABLE.width - y
}

export function toSvg(p: Point): Point {
  return { x: p.x, y: flipY(p.y) }
}

/** Der viewBox des gesamten Diagramms, je nach Ausrichtung. */
export function viewBoxFor(orientation: Orientation): string {
  return orientation === 'portrait'
    ? `0 0 ${DIAGRAM.height} ${DIAGRAM.width}`
    : `0 0 ${DIAGRAM.width} ${DIAGRAM.height}`
}

/** Drehung des gesamten Diagramms fuer das Hochformat. */
export function rotationFor(orientation: Orientation): string | undefined {
  return orientation === 'portrait' ? `translate(${DIAGRAM.height} 0) rotate(90)` : undefined
}

/**
 * Bildschirmkoordinaten in Tischkoordinaten. `space` ist die Gruppe, in der
 * die Spielflaeche gezeichnet wird; ihre Matrix enthaelt bereits Verschiebung,
 * Drehung und Skalierung.
 */
export function clientToTable(
  space: SVGGraphicsElement | null,
  clientX: number,
  clientY: number,
): Point | null {
  if (!space) return null
  const svg = space.ownerSVGElement ?? (space as unknown as SVGSVGElement)
  const matrix = space.getScreenCTM()
  if (!matrix || typeof svg.createSVGPoint !== 'function') return null
  const pt = svg.createSVGPoint()
  pt.x = clientX
  pt.y = clientY
  const local = pt.matrixTransform(matrix.inverse())
  return { x: local.x, y: flipY(local.y) }
}

/**
 * Ausrichtung des umgebenden Diagramms. Beschriftungen im Diagramm drehen
 * sich sonst im Hochformat mit und stehen quer.
 */
export const OrientationContext = createContext<Orientation>('landscape')

export function useTableOrientation(): Orientation {
  return useContext(OrientationContext)
}

/** Gegendrehung, damit ein Text an der Stelle aufrecht bleibt. */
export function uprightTransform(orientation: Orientation, x: number, y: number): string | undefined {
  return orientation === 'portrait' ? `rotate(-90 ${x} ${y})` : undefined
}
