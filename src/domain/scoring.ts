/** Bewertung einzelner Versuche und ganzer Trainingseinheiten. */

import { distance } from './geometry'
import type {
  Attempt,
  Point,
  Proficiency,
  Shot,
  ShotScoring,
  TargetZone,
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

/** Liegt der Weisse in der Sperrzone? Ohne Zone und ohne Lage: nein. */
export function inAvoidZone(end: Point | null, zone: TargetZone | undefined): boolean {
  if (!end || !zone || zone.r <= 0) return false
  return distance(end, zone) <= zone.r
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

  // Die Sperrzone ist eine harte Regel: wer dort liegenbleibt, hat den
  // Versuch vergeben - auch wenn der Ball gefallen ist. Anders als die
  // Zielzone kennt sie keine Abstufung, das ist der Sinn einer Sperre. Sie
  // gilt in jedem Bewertungsmodus, auch wenn sonst nur das Einlochen zaehlt.
  if (inAvoidZone(result.cueBallEnd, scoring.avoidZone)) return 0

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

/**
 * Haelt die vier Schwellen in ihrer Reihenfolge: jede mindestens so hoch wie
 * die darunter.
 *
 * proficiencyFor fragt von oben nach unten ab und verlaesst sich darauf, dass
 * die Werte steigen. Verdrehte Schwellen - etwa developing 90, exemplary 50 -
 * ergeben sonst stillschweigend Unsinn: 50 Prozent hiessen "Meisterlich", und
 * der Wert steht hinterher in der Einheit.
 *
 * Begrenzt wird nach oben: wer eine untere Schwelle hochzieht, schiebt die
 * darueberliegenden mit. Eine obere Schwelle kann nicht unter die darunter
 * rutschen - dort bleibt die Marke stehen.
 */
export function orderedThresholds(t: Thresholds): Thresholds {
  const developing = t.developing
  const proficient = Math.max(developing, t.proficient)
  const advanced = Math.max(proficient, t.advanced)
  return { developing, proficient, advanced, exemplary: Math.max(advanced, t.exemplary) }
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

/**
 * Muss beim Training erfasst werden, wo der Weisse liegenbleibt?
 *
 * Sonst entscheidet der Bewertungsmodus. Mit Sperrzone immer: ohne die Lage
 * des Weissen liesse sich die Sperre nicht pruefen, und sie waere eine Regel,
 * die nie greift.
 */
export function needsCueBallEnd(shot: Shot): boolean {
  if (shot.scoring.avoidZone) return true
  return effectiveMode(shot.scoring, hasObjectBall(shot)) !== 'pocket'
}

/** Hat der Stoss ueberhaupt einen Ball zum Einlochen? */
export function hasObjectBall(shot: Shot): boolean {
  return shot.balls.some((b) => b.kind === 'object')
}

/**
 * Laesst sich dieser Stoss ueberhaupt bewerten?
 *
 * Ohne Objektball gibt es nichts einzulochen, ohne Zielzone nichts zu messen.
 * Beides zusammen heisst: kein Massstab. Ein solcher Stoss darf nicht ins
 * Training - sonst bekaeme jeder Versuch dieselbe Punktzahl, und die stuende
 * hinterher im Profil des Spielers.
 */
export function isScorable(shot: Shot): boolean {
  return hasObjectBall(shot) || shot.scoring.targetZone !== null
}

/** Fertiger Versuch inklusive berechneter Punkte. */

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
