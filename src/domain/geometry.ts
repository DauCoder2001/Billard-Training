/** Tischgeometrie fuer einen 9-Fuss-Pooltisch (US).
 *
 *  Spielflaeche 100 x 50 Zoll, gemessen zwischen den Bandennasen.
 *  Ursprung liegt in der unteren linken Ecke der Spielflaeche.
 *  Die Kopfbande (Kitchen) liegt links, die Fussbande rechts.
 */

import type { Point, PocketId } from './types'

export const TABLE = {
  /** Laenge der Spielflaeche in Zoll. */
  length: 100,
  /** Breite der Spielflaeche in Zoll. */
  width: 50,
  /** Sichtbare Bandenbreite im Diagramm. */
  rail: 5,
  ballRadius: 1.125,
  ballDiameter: 2.25,
  /** Muendungsbreite der Eckentaschen. */
  cornerMouth: 4.5,
  /** Muendungsbreite der Mitteltaschen. */
  sideMouth: 5,
  /** Abstand zweier Diamanten auf der Langbande. */
  diamondSpacing: 12.5,
  /** Kopflinie. */
  headString: 25,
  /** Fusspunkt (Aufbaupunkt). */
  footSpot: { x: 75, y: 25 } as Point,
  headSpot: { x: 25, y: 25 } as Point,
  centerSpot: { x: 50, y: 25 } as Point,
} as const

/** Groesse des Diagramms inklusive Banden. */
export const DIAGRAM = {
  width: TABLE.length + 2 * TABLE.rail,
  height: TABLE.width + 2 * TABLE.rail,
  offset: TABLE.rail,
} as const

export interface Pocket {
  id: PocketId
  label: string
  kind: 'corner' | 'side'
  /** Die beiden Muendungsecken auf der Bandenlinie. */
  jaws: [Point, Point]
  /** Mitte der Muendung, der uebliche Zielpunkt. */
  center: Point
  /** Einheitsvektor entlang der Muendung (fuer das "Cheaten"). */
  along: Point
  /** Einheitsvektor in den Tisch hinein. */
  inward: Point
  /** Zeichenmittelpunkt des Taschenlochs. */
  hole: Point
  holeRadius: number
}

function unit(a: Point, b: Point): Point {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len = Math.hypot(dx, dy) || 1
  return { x: dx / len, y: dy / len }
}

function cornerPocket(id: PocketId, label: string, cx: number, cy: number): Pocket {
  // Die Muendung spannt sich diagonal ueber die Ecke; der Abstand jeder
  // Backe zur Ecke ergibt sich aus der Muendungsbreite ueber Pythagoras.
  const d = TABLE.cornerMouth / Math.SQRT2
  const sx = cx === 0 ? 1 : -1
  const sy = cy === 0 ? 1 : -1
  const jawA: Point = { x: cx + sx * d, y: cy }
  const jawB: Point = { x: cx, y: cy + sy * d }
  const center: Point = { x: (jawA.x + jawB.x) / 2, y: (jawA.y + jawB.y) / 2 }
  return {
    id,
    label,
    kind: 'corner',
    jaws: [jawA, jawB],
    center,
    along: unit(jawA, jawB),
    inward: { x: sx / Math.SQRT2, y: sy / Math.SQRT2 },
    hole: { x: cx - sx * 1.2, y: cy - sy * 1.2 },
    holeRadius: 2.6,
  }
}

function sidePocket(id: PocketId, label: string, cx: number, cy: number): Pocket {
  const half = TABLE.sideMouth / 2
  const sy = cy === 0 ? 1 : -1
  const jawA: Point = { x: cx - half, y: cy }
  const jawB: Point = { x: cx + half, y: cy }
  return {
    id,
    label,
    kind: 'side',
    jaws: [jawA, jawB],
    center: { x: cx, y: cy },
    along: { x: 1, y: 0 },
    inward: { x: 0, y: sy },
    hole: { x: cx, y: cy - sy * 1.0 },
    holeRadius: 2.6,
  }
}

/** Die sechs Taschen. t = oben (y = 50), b = unten (y = 0). */
export const POCKETS: Pocket[] = [
  cornerPocket('bl', 'Ecke unten links', 0, 0),
  sidePocket('bm', 'Mitte unten', 50, 0),
  cornerPocket('br', 'Ecke unten rechts', TABLE.length, 0),
  cornerPocket('tl', 'Ecke oben links', 0, TABLE.width),
  sidePocket('tm', 'Mitte oben', 50, TABLE.width),
  cornerPocket('tr', 'Ecke oben rechts', TABLE.length, TABLE.width),
]

export const POCKET_BY_ID: Record<PocketId, Pocket> = Object.fromEntries(
  POCKETS.map((p) => [p.id, p]),
) as Record<PocketId, Pocket>

/** Maximale Verschiebung des Zielpunktes, bei der der Ball noch durchpasst. */
export function maxCheatOffset(pocket: Pocket): number {
  const mouth = pocket.kind === 'corner' ? TABLE.cornerMouth : TABLE.sideMouth
  return Math.max(0, (mouth - TABLE.ballDiameter) / 2)
}

/** Zielpunkt in der Tasche, verschoben um cheat (-1..1). */
export function pocketAimPoint(pocket: Pocket, cheat = 0): Point {
  const off = clamp(cheat, -1, 1) * maxCheatOffset(pocket)
  return {
    x: pocket.center.x + pocket.along.x * off,
    y: pocket.center.y + pocket.along.y * off,
  }
}

// ------------------------------------------------------------- Diamanten ---

export interface Diamond {
  x: number
  y: number
  rail: 'top' | 'bottom' | 'left' | 'right'
}

/** Diamanten auf den Banden. An den Mitteltaschen sitzt keiner. */
export function diamonds(): Diamond[] {
  const out: Diamond[] = []
  for (let i = 1; i <= 7; i++) {
    const x = i * TABLE.diamondSpacing
    if (x === TABLE.length / 2) continue // Mitteltasche
    out.push({ x, y: 0, rail: 'bottom' })
    out.push({ x, y: TABLE.width, rail: 'top' })
  }
  for (let i = 1; i <= 3; i++) {
    const y = i * TABLE.diamondSpacing
    out.push({ x: 0, y, rail: 'left' })
    out.push({ x: TABLE.length, y, rail: 'right' })
  }
  return out
}

// --------------------------------------------------------------- Helfer ----

export function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v
}

export function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

/** Haelt einen Ballmittelpunkt vollstaendig auf der Spielflaeche. */
export function clampBall(p: Point): Point {
  const r = TABLE.ballRadius
  return {
    x: clamp(p.x, r, TABLE.length - r),
    y: clamp(p.y, r, TABLE.width - r),
  }
}

/** Rastet einen Punkt auf das Diamantenraster ein. */
export function snapToGrid(p: Point, step: number): Point {
  if (step <= 0) return p
  return { x: Math.round(p.x / step) * step, y: Math.round(p.y / step) * step }
}

export function ballsOverlap(a: Point, b: Point): boolean {
  return distance(a, b) < TABLE.ballDiameter - 1e-9
}

/**
 * Schiebt den Punkt so weit von den anderen Baellen weg, bis nichts mehr
 * ueberlappt. Bricht nach wenigen Durchlaeufen ab, damit das Ziehen fluessig
 * bleibt, auch wenn eine Konstellation nicht aufloesbar ist.
 */
export function resolveOverlaps(p: Point, others: Point[]): Point {
  let out = clampBall(p)
  for (let pass = 0; pass < 6; pass++) {
    let moved = false
    for (const o of others) {
      const d = distance(out, o)
      if (d >= TABLE.ballDiameter - 1e-9) continue
      moved = true
      // Bei exakter Deckung in eine feste Richtung ausweichen.
      const dx = d < 1e-6 ? 1 : (out.x - o.x) / d
      const dy = d < 1e-6 ? 0 : (out.y - o.y) / d
      const push = TABLE.ballDiameter - d
      out = clampBall({ x: out.x + dx * push, y: out.y + dy * push })
    }
    if (!moved) break
  }
  return out
}

// ------------------------------------------------------------- Winkel ------

/** Winkel in Grad zwischen den Richtungen von at nach a und von at nach b. */
export function angleAt(at: Point, a: Point, b: Point): number {
  const a1 = Math.atan2(a.y - at.y, a.x - at.x)
  const a2 = Math.atan2(b.y - at.y, b.x - at.x)
  let d = Math.abs(a1 - a2) * (180 / Math.PI)
  if (d > 180) d = 360 - d
  return d
}

/**
 * Position des Geisterballs: dort muss der Mittelpunkt des Weissen im Moment
 * des Treffens stehen, damit der Objektball zum Zielpunkt laeuft.
 */
export function ghostBall(objectBall: Point, aim: Point): Point {
  const dx = objectBall.x - aim.x
  const dy = objectBall.y - aim.y
  const len = Math.hypot(dx, dy) || 1
  return {
    x: objectBall.x + (dx / len) * TABLE.ballDiameter,
    y: objectBall.y + (dy / len) * TABLE.ballDiameter,
  }
}

/**
 * Schnittwinkel in Grad: 0 = voller Ball, 90 = gerade noch gestreift.
 * NaN, wenn die Punkte zusammenfallen und kein Winkel definiert ist.
 */
export function cutAngle(cue: Point, objectBall: Point, aim: Point): number {
  if (distance(objectBall, aim) < 1e-6) return NaN
  const ghost = ghostBall(objectBall, aim)
  if (distance(cue, ghost) < 1e-6) return NaN
  // Winkel zwischen der Laufrichtung des Objektballs und der Anspiellinie.
  return angleAt(ghost, cue, { x: 2 * ghost.x - objectBall.x, y: 2 * ghost.y - objectBall.y })
}

// -------------------------------------------------------------- Banden -----

export type RailSide = 'left' | 'right' | 'bottom' | 'top'

export interface RailHit {
  point: Point
  rail: RailSide
  /** Richtung nach der Reflexion, normiert. */
  direction: Point
}

/**
 * Verfolgt einen Strahl bis zur naechsten Bande und liefert Auftreffpunkt
 * und reflektierte Richtung. null, wenn die Richtung entartet ist.
 */
export function castToRail(from: Point, dir: Point): RailHit | null {
  const len = Math.hypot(dir.x, dir.y)
  if (len < 1e-9) return null
  const d = { x: dir.x / len, y: dir.y / len }

  let best = Infinity
  let rail: RailSide | null = null

  const consider = (t: number, sideName: RailSide) => {
    if (t > 1e-6 && t < best) {
      best = t
      rail = sideName
    }
  }
  if (d.x > 0) consider((TABLE.length - from.x) / d.x, 'right')
  if (d.x < 0) consider((0 - from.x) / d.x, 'left')
  if (d.y > 0) consider((TABLE.width - from.y) / d.y, 'top')
  if (d.y < 0) consider((0 - from.y) / d.y, 'bottom')

  if (rail === null || !Number.isFinite(best)) return null
  const hitRail: RailSide = rail
  const point = { x: from.x + d.x * best, y: from.y + d.y * best }
  const horizontal = hitRail === 'left' || hitRail === 'right'
  return {
    point,
    rail: hitRail,
    direction: horizontal ? { x: -d.x, y: d.y } : { x: d.x, y: -d.y },
  }
}

/**
 * Bandenweg: startet bei from in Richtung dir und reflektiert bis zu
 * bounces mal. Liefert die Stuetzpunkte ohne den Startpunkt.
 */
export function bankPath(from: Point, dir: Point, bounces: number): Point[] {
  const pts: Point[] = []
  let p = from
  let d = dir
  for (let i = 0; i < bounces; i++) {
    const hit = castToRail(p, d)
    if (!hit) break
    pts.push(hit.point)
    p = hit.point
    d = hit.direction
  }
  return pts
}

// ------------------------------------------------------- Bezier / Pfade ----

/** Punkt auf einer quadratischen Bezierkurve. */
export function quadPoint(p0: Point, c: Point, p1: Point, t: number): Point {
  const mt = 1 - t
  return {
    x: mt * mt * p0.x + 2 * mt * t * c.x + t * t * p1.x,
    y: mt * mt * p0.y + 2 * mt * t * c.y + t * t * p1.y,
  }
}

export function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

/**
 * Kontrollpunkt einer quadratischen Bezierkurve so waehlen, dass die Kurve
 * durch den Punkt through laeuft. Der Nutzer fasst den Kurvengriff auf der
 * Kurve selbst an, nicht am mathematischen Kontrollpunkt.
 */
export function controlThrough(p0: Point, through: Point, p1: Point): Point {
  return {
    x: 2 * through.x - (p0.x + p1.x) / 2,
    y: 2 * through.y - (p0.y + p1.y) / 2,
  }
}

/** Umkehrung von controlThrough: der Punkt der Kurve bei t = 0.5. */
export function pointOnCurve(p0: Point, control: Point, p1: Point): Point {
  return quadPoint(p0, control, p1, 0.5)
}
