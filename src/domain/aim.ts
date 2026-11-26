/**
 * Die Anspiellinie: wo der Weisse liegen muss, damit ein Schnitt entsteht.
 *
 * Rueckwaerts gerechnet. Bekannt sind Objektball, Zielpunkt, gewuenschter
 * Schnittwinkel und Abstand; gesucht ist die Lage des Weissen. Vorwaerts
 * ginge es auch - Weissen hinlegen und nachsehen, was fuer ein Winkel
 * herauskommt -, aber dann sagt die Uebung nicht, was sie heisst.
 *
 * Diese Rechnung stand bis 0.17.0 in data/seed/drills.ts und baute nur die
 * mitgelieferten Uebungen. Sie steht jetzt hier, weil der Reihen-Generator
 * dieselbe Rechnung braucht: eine Folge "Schnitt 10 bis 60 Grad" ist genau
 * dieselbe Lage, mehrfach mit anderem Winkel gerechnet.
 *
 * Beim Umzug hat sich keine Zeile geaendert - die Fingerabdruecke der 25
 * mitgelieferten Uebungen sind dieselben geblieben, und seither nagelt ein
 * Test sie fest (data/seed/drills.test.ts). Haette sich eine Ballposition um
 * einen Millimeter verschoben, bekaeme jeder mit einer eigenen Fassung den
 * Hinweis auf eine ueberarbeitete Vorlage.
 */

import { TABLE, clampBall, ghostBall } from './geometry'
import type { Point } from './types'

/** Dreht eine Richtung um deg Grad gegen den Uhrzeigersinn. */
export function rotate(d: Point, deg: number): Point {
  const r = (deg * Math.PI) / 180
  return { x: d.x * Math.cos(r) - d.y * Math.sin(r), y: d.x * Math.sin(r) + d.y * Math.cos(r) }
}

/** Richtung auf Laenge 1. Die Null bleibt die Null. */
export function norm(d: Point): Point {
  const len = Math.hypot(d.x, d.y) || 1
  return { x: d.x / len, y: d.y / len }
}

/**
 * Wie weit man von einem Punkt aus in eine Richtung gehen kann, ohne die
 * Spielflaeche zu verlassen - gemessen bis dorthin, wo der Ballmittelpunkt
 * noch einen Radius Abstand zur Bande hat.
 */
export function reichweite(from: Point, dir: Point): number {
  const r = TABLE.ballRadius
  let t = Number.POSITIVE_INFINITY
  if (dir.x > 1e-9) t = Math.min(t, (TABLE.length - r - from.x) / dir.x)
  if (dir.x < -1e-9) t = Math.min(t, (r - from.x) / dir.x)
  if (dir.y > 1e-9) t = Math.min(t, (TABLE.width - r - from.y) / dir.y)
  if (dir.y < -1e-9) t = Math.min(t, (r - from.y) / dir.y)
  return Number.isFinite(t) ? Math.max(0, t) : 0
}

/** Welche Seite der Anspiellinie der Weisse bekommt. */
export type AimSide = 1 | -1

/** Anspiellinie: Richtung, aus der der Weisse auf den Geisterball zulaeuft. */
export function anspiellinie(
  object: Point,
  aim: Point,
  cutDeg: number,
  side: AimSide,
): { ghost: Point; approach: Point; zurueck: Point } {
  const ghost = ghostBall(object, aim)
  const travel = norm({ x: object.x - ghost.x, y: object.y - ghost.y })
  const approach = rotate(travel, side * cutDeg)
  return { ghost, approach, zurueck: { x: -approach.x, y: -approach.y } }
}

/**
 * Lage des Weissen aus Objektball, Zielpunkt, Schnittwinkel und Abstand.
 * side = 1 legt den Weissen auf die eine, -1 auf die andere Seite der Linie.
 *
 * Reicht der gewuenschte Abstand ueber den Tisch hinaus, wird die Strecke
 * gekuerzt - nicht der Punkt an die Bande geschoben. Ein geklemmter Punkt
 * laege neben der Anspiellinie und machte aus einem geraden Ball einen
 * Schnitt: der Stoss sagte dann etwas anderes als seine Beschriftung.
 */
export function cuePosition(
  object: Point,
  aim: Point,
  cutDeg: number,
  dist: number,
  side: AimSide,
): Point {
  const { ghost, zurueck } = anspiellinie(object, aim, cutDeg, side)
  const weit = Math.min(dist, reichweite(ghost, zurueck))
  return clampBall({ x: ghost.x + zurueck.x * weit, y: ghost.y + zurueck.y * weit })
}
