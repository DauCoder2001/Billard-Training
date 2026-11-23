/** Bewertung einzelner Versuche und ganzer Trainingseinheiten. */

import { distance } from './geometry'
import type {
  Attempt,
  Point,
  Proficiency,
  Shot,
  ShotScoring,
  Thresholds,
} from './types'
import { DEFAULT_THRESHOLDS } from './types'

/** Jeder Versuch ist maximal so viele Punkte wert. */
export const MAX_POINTS = 10

/**
 * Positionspunkte 0..5 nach Abstand zur Zielzone. Die Ringe wachsen mit dem
 * Radius der Zone, damit enge und weite Zielvorgaben gleich bewertet werden.
 */
export function positionPoints(end: Point | null, zone: { x: number; y: number; r: number } | null): number {
  if (!end || !zone || zone.r <= 0) return 0
  const d = distance(end, zone)
  if (d <= zone.r) return 5
  if (d <= zone.r * 1.5) return 4
  if (d <= zone.r * 2) return 3
  if (d <= zone.r * 3) return 2
  if (d <= zone.r * 4) return 1
  return 0
}

/**
 * Effektiver Bewertungsmodus. Ohne definierte Zielzone kann die Position
 * nicht bewertet werden, dann zaehlt nur das Einlochen.
 *
 * Und ohne Objektball gibt es nichts einzulochen: dann zaehlt nur die Lage
 * des Weissen - sofern eine Zielzone da ist, an der sie sich messen laesst.
 */
export function effectiveMode(
  scoring: ShotScoring,
  hasObjectBall = true,
): ShotScoring['mode'] {
  if (!hasObjectBall) return scoring.targetZone ? 'position' : 'pocket'
  if (scoring.mode === 'pocket') return 'pocket'
  if (!scoring.targetZone) return 'pocket'
  return scoring.mode
}

/**
 * Punkte eines einzelnen Versuchs, 0..MAX_POINTS.
 *
 * `hasObjectBall` sagt, ob es ueberhaupt einen Ball zum Einlochen gibt. Eine
 * Uebung aus nur dem Weissen - der gerade Stoss, der zurueckkommen soll -
 * hat keinen, und dann darf die Wertung nicht am Einlochen haengen.
 */
export function attemptPoints(
  scoring: ShotScoring,
  result: Pick<Attempt, 'pocketed' | 'scratch' | 'cueBallEnd'>,
  hasObjectBall = true,
): number {
  if (result.scratch) return 0

  const mode = effectiveMode(scoring, hasObjectBall)
  const pos = positionPoints(result.cueBallEnd, scoring.targetZone)

  switch (mode) {
    case 'pocket':
      return result.pocketed ? MAX_POINTS : 0
    case 'position':
      // Mit Objektball haengt die Lage am Treffer: ohne ihn laeuft der
      // Weisse nicht dorthin, wo er soll. Ohne Objektball gibt es nichts
      // einzulochen - dann zaehlt allein, wo der Weisse liegen bleibt.
      if (!hasObjectBall) return pos * 2
      return result.pocketed ? pos * 2 : 0
    case 'pocket+position':
      return result.pocketed ? 5 + pos : 0
  }
}

/** Prozentwert 0..100 ueber alle erfassten Versuche. */
export function sessionScore(results: Attempt[], plannedAttempts: number): number {
  const n = Math.max(results.length, plannedAttempts)
  if (n <= 0) return 0
  const sum = results.reduce((acc, r) => acc + r.points, 0)
  return Math.round((sum / (n * MAX_POINTS)) * 1000) / 10
}

/** Einstufung eines Prozentwerts. */
export function proficiencyFor(
  score: number,
  thresholds: Thresholds = DEFAULT_THRESHOLDS,
): Proficiency {
  if (score >= thresholds.exemplary) return 'exemplary'
  if (score >= thresholds.advanced) return 'advanced'
  if (score >= thresholds.proficient) return 'proficient'
  if (score >= thresholds.developing) return 'developing'
  return 'beginning'
}

/** Trefferquote 0..100 ueber die erfassten Versuche. */
export function pocketRate(results: Attempt[]): number {
  if (results.length === 0) return 0
  const hits = results.filter((r) => r.pocketed && !r.scratch).length
  return Math.round((hits / results.length) * 1000) / 10
}

/** Kratzerquote 0..100 ueber die erfassten Versuche. */
export function scratchRate(results: Attempt[]): number {
  if (results.length === 0) return 0
  const n = results.filter((r) => r.scratch).length
  return Math.round((n / results.length) * 1000) / 10
}

/** Fertiger Versuch inklusive berechneter Punkte. */
/** Hat der Stoss ueberhaupt einen Ball zum Einlochen? */
export function hasObjectBall(shot: Shot): boolean {
  return shot.balls.some((b) => b.kind === 'object')
}

export function buildAttempt(
  shot: Shot,
  index: number,
  input: { pocketed: boolean; scratch: boolean; cueBallEnd: Point | null },
): Attempt {
  return {
    index,
    pocketed: input.pocketed,
    scratch: input.scratch,
    cueBallEnd: input.cueBallEnd,
    points: attemptPoints(shot.scoring, input, hasObjectBall(shot)),
  }
}
