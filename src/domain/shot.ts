/** Erzeugen, Kopieren und Umformen von Stoessen. */

import {
  POCKET_BY_ID,
  TABLE,
  clampBall,
  cutAngle,
  pocketAimPoint,
} from './geometry'
import { DEFAULT_THRESHOLDS } from './types'
import type { Ball, BallPath, Point, Shot } from './types'

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `id-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`
}

/** Ein neuer Stoss mit Weissem und einem Objektball in Standardlage. */
export function createShot(partial: Partial<Shot> = {}): Shot {
  const now = Date.now()
  const cue: Ball = { id: newId(), kind: 'cue', x: 25, y: 25 }
  const object: Ball = { id: newId(), kind: 'object', number: 1, x: 62.5, y: 25, order: 1 }
  return {
    id: newId(),
    name: 'Neuer Stoss',
    description: '',
    balls: [cue, object],
    target: { pocketId: 'br', cheat: 0 },
    paths: [],
    attributes: {
      shotType: 'cut',
      cutAngle: 0,
      spin: { x: 0, y: 0 },
      speed: 5,
      difficulty: 5,
      elevation: 0,
      skills: [],
    },
    scoring: {
      mode: 'pocket+position',
      targetZone: { x: 75, y: 12.5, r: 6 },
      thresholds: { ...DEFAULT_THRESHOLDS },
      scratchRisk: false,
    },
    coachNotes: '',
    tags: [],
    favorite: false,
    createdAt: now,
    updatedAt: now,
    ...partial,
  }
}

export function cueBall(shot: Shot): Ball | undefined {
  return shot.balls.find((b) => b.kind === 'cue')
}

/** Objektbaelle in Trefferreihenfolge. */
export function objectBalls(shot: Shot): Ball[] {
  return shot.balls
    .filter((b) => b.kind === 'object')
    .sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
}

/** Der Zielpunkt in der gewaehlten Tasche, oder null ohne Tasche. */
export function aimPoint(shot: Shot): Point | null {
  if (!shot.target.pocketId) return null
  return pocketAimPoint(POCKET_BY_ID[shot.target.pocketId], shot.target.cheat)
}

/**
 * Schnittwinkel aus der aktuellen Lage. Bei Kombinationen wird der erste
 * Objektball betrachtet, weil er den Anspielwinkel bestimmt.
 */
export function computeCutAngle(shot: Shot): number {
  const cue = cueBall(shot)
  const obj = objectBalls(shot)[0]
  const aim = aimPoint(shot)
  if (!cue || !obj || !aim) return 0
  const angle = cutAngle(cue, obj, aim)
  return Number.isFinite(angle) ? Math.round(angle * 10) / 10 : 0
}

/** Stoss mit frisch berechnetem Schnittwinkel und Zeitstempel. */
export function touchShot(shot: Shot): Shot {
  return {
    ...shot,
    attributes: { ...shot.attributes, cutAngle: computeCutAngle(shot) },
    updatedAt: Date.now(),
  }
}

/** Kopie mit neuen Ids, damit Original und Kopie unabhaengig bleiben. */
export function duplicateShot(shot: Shot, name?: string): Shot {
  const idMap = new Map<string, string>()
  const balls = shot.balls.map((b) => {
    const id = newId()
    idMap.set(b.id, id)
    return { ...b, id }
  })
  const paths: BallPath[] = shot.paths.map((p) => ({
    ...p,
    id: newId(),
    ballId: p.ballId ? (idMap.get(p.ballId) ?? null) : null,
    segments: p.segments.map((s) => ({ ...s, to: { ...s.to }, curve: s.curve ? { ...s.curve } : undefined })),
  }))
  const now = Date.now()
  return {
    ...shot,
    id: newId(),
    name: name ?? `${shot.name} (Kopie)`,
    balls,
    paths,
    builtIn: false,
    createdAt: now,
    updatedAt: now,
  }
}

type Axis = 'horizontal' | 'vertical'

const MIRROR_POCKETS: Record<Axis, Record<string, string>> = {
  // Spiegelung an der Laengsachse: oben und unten tauschen.
  horizontal: { tl: 'bl', tm: 'bm', tr: 'br', bl: 'tl', bm: 'tm', br: 'tr' },
  // Spiegelung an der Querachse: links und rechts tauschen.
  vertical: { tl: 'tr', tr: 'tl', bl: 'br', br: 'bl', tm: 'tm', bm: 'bm' },
}

function mirrorPoint(p: Point, axis: Axis): Point {
  return axis === 'horizontal'
    ? { x: p.x, y: TABLE.width - p.y }
    : { x: TABLE.length - p.x, y: p.y }
}

/** Spiegelt die gesamte Anordnung, damit ein Stoss auch andersherum geuebt wird. */
export function mirrorShot(shot: Shot, axis: Axis): Shot {
  const pocketId = shot.target.pocketId
  return touchShot({
    ...shot,
    balls: shot.balls.map((b) => ({ ...b, ...clampBall(mirrorPoint(b, axis)) })),
    paths: shot.paths.map((p) => ({
      ...p,
      from: p.from ? mirrorPoint(p.from, axis) : undefined,
      segments: p.segments.map((s) => ({
        ...s,
        to: mirrorPoint(s.to, axis),
        curve: s.curve ? mirrorPoint(s.curve, axis) : undefined,
      })),
    })),
    target: {
      ...shot.target,
      pocketId: pocketId
        ? (MIRROR_POCKETS[axis][pocketId] as typeof pocketId)
        : null,
      // Die Muendungsrichtung dreht sich mit, also auch das Cheaten.
      cheat: -shot.target.cheat,
    },
    scoring: {
      ...shot.scoring,
      targetZone: shot.scoring.targetZone
        ? { ...shot.scoring.targetZone, ...mirrorPoint(shot.scoring.targetZone, axis) }
        : null,
    },
    attributes: { ...shot.attributes, spin: { x: -shot.attributes.spin.x, y: shot.attributes.spin.y } },
  })
}
