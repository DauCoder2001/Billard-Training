/**
 * Wie aus einer Beschreibung eine Uebung wird.
 *
 * Die Ballpositionen werden aus der Geometrie berechnet statt von Hand
 * gesetzt: aus Objektball, Zieltasche und gewuenschtem Schnittwinkel folgt
 * die Lage des Weissen. So stimmen die Winkel exakt und lassen sich beim
 * Anpassen einer Uebung nachvollziehen.
 *
 * Hier steht nur die Rechnung. Die Uebungen selbst stehen je Stufe in einer
 * eigenen Datei (stufe-a.ts bis stufe-c.ts), zusammengefuehrt in index.ts:
 * bei 100 Uebungen waere eine Datei mit 1700 Zeilen nicht mehr zu
 * ueberblicken (Konzept 3.7).
 */

import { anspiellinie, cuePosition, norm, reichweite } from '@/domain/aim'
import {
  POCKET_BY_ID,
  TABLE,
  castToRail,
  clampBall,
  ghostBall,
  pocketAimPoint,
} from '@/domain/geometry'
import { createShot } from '@/domain/shot'
import { DEFAULT_THRESHOLDS } from '@/domain/types'
import type {
  Ball,
  BallPath,
  Level,
  Point,
  PocketId,
  Shot,
  ShotType,
  SkillTag,
} from '@/domain/types'

type RailSide = 'top' | 'bottom' | 'left' | 'right'

/** Spiegelt einen Punkt an einer Bande, fuer die Berechnung von Bandenwegen. */
function mirrorAcross(p: Point, rail: RailSide): Point {
  switch (rail) {
    case 'top':
      return { x: p.x, y: 2 * TABLE.width - p.y }
    case 'bottom':
      return { x: p.x, y: -p.y }
    case 'left':
      return { x: -p.x, y: p.y }
    case 'right':
      return { x: 2 * TABLE.length - p.x, y: p.y }
  }
}

/** Weg bis zu einer bestimmten Bande, oder null, wenn sie nicht vorauskommt. */
function bisBande(from: Point, dir: Point, rail: RailSide): number | null {
  const t =
    rail === 'left'
      ? -from.x / dir.x
      : rail === 'right'
        ? (TABLE.length - from.x) / dir.x
        : rail === 'bottom'
          ? -from.y / dir.y
          : (TABLE.width - from.y) / dir.y
  return Number.isFinite(t) && t > 1e-9 ? t : null
}

/** Richtung nach der Reflexion an einer Bande. */
function spiegelRichtung(d: Point, rail: RailSide): Point {
  return rail === 'left' || rail === 'right' ? { x: -d.x, y: d.y } : { x: d.x, y: -d.y }
}

/**
 * Lage des Weissen fuer einen Kick und sein Weg dorthin.
 *
 * Der Weisse soll den Objektball im gewuenschten Winkel treffen, aber erst
 * nach einer Bande. Also rueckwaerts gerechnet: von der Anspiellinie bis zur
 * Kickbande, dort die Richtung spiegeln und `dist` weitergehen. `dist` ist
 * hier der Abstand von der Bande, nicht vom Geisterball - der Weg bis zur
 * Bande ergibt sich aus der Geometrie und ist nicht frei waehlbar.
 */
function kickPosition(
  object: Point,
  aim: Point,
  cutDeg: number,
  dist: number,
  side: 1 | -1,
  rail: RailSide,
): { cue: Point; hit: Point; ghost: Point } | null {
  const { ghost, zurueck } = anspiellinie(object, aim, cutDeg, side)
  const bis = bisBande(ghost, zurueck, rail)
  if (bis === null) return null
  const hit = { x: ghost.x + zurueck.x * bis, y: ghost.y + zurueck.y * bis }
  const weiter = spiegelRichtung(zurueck, rail)
  const rest = Math.min(dist, reichweite(hit, weiter))
  if (rest < TABLE.ballDiameter) return null
  return {
    cue: clampBall({ x: hit.x + weiter.x * rest, y: hit.y + weiter.y * rest }),
    hit,
    ghost,
  }
}

/**
 * Der Hinweis, der eine zweite Uebung erspart.
 *
 * Ein Schnittball nach links ist derselbe Schnittball, an der Mittellinie
 * gespiegelt. Als eigene Uebung blaeht er die Sammlung auf, ohne etwas
 * Neues zu zeigen - das Bild im Diagramm ist gespiegelt, die Aufgabe ist
 * dieselbe. Ein Satz im Hinweis sagt dasselbe und kostet keinen Platz in
 * der Sammlung.
 */
export const ANDERE_SEITE =
  'Die Übung auch spiegelverkehrt aufbauen und von der anderen Seite spielen – ' +
  'fast jeder trifft eine Richtung besser als die andere, und das merkt man erst im Vergleich.'

export interface DrillSpec {
  slug: string
  /** Lernstufe. Pflicht, damit keine neue Uebung ohne Einstufung durchrutscht. */
  level: Level
  /**
   * Ab welcher SEED_VERSION diese Uebung mitgeliefert wird. Ohne Angabe:
   * von Anfang an dabei.
   *
   * Nur daran laesst sich eine neue Uebung von einer geloeschten
   * unterscheiden - im Bestand fehlen beide (seedUpdates in bootstrap.ts).
   */
  since?: number
  name: string
  description: string
  /** Objektball. */
  object: Point
  pocket: PocketId
  /** Schnittwinkel in Grad. */
  cut: number
  /** Abstand des Weissen vom Geisterball in Zoll. */
  dist: number
  side?: 1 | -1
  /** Bande, ueber die der Objektball laeuft (Bandenball). */
  bankRail?: RailSide
  /** Bande, ueber die der Weisse zum Objektball laeuft (Kick). */
  kickRail?: RailSide
  /**
   * Kombination: Lage des zweiten Objektballs. Der erste Ball zielt dann
   * nicht auf die Tasche, sondern auf den Kontaktpunkt am zweiten Ball.
   */
  combo?: Point
  /**
   * Karambolage: Abstand des zweiten Balls auf der Abgangslinie des Weissen.
   * Der Ball wird daraus berechnet, damit der Stoss wirklich aufgeht.
   */
  carom?: number
  /** Weitere Baelle, etwa als Stoerball oder Cluster. */
  extras?: { number: number; x: number; y: number; kind?: 'object' | 'obstacle' }[]
  /**
   * Zwei Stoerbaelle als Tor auf dem Weg des Weissen.
   *
   * `offset` ist der Abstand jedes Balls von der Anspiellinie. Unter einem
   * Balldurchmesser (2,25 Zoll) passt der Weisse nicht mehr durch - dann
   * meldet die Machbarkeitspruefung ein Hindernis, und das zu Recht.
   *
   * Gerechnet statt gesetzt: rueckt der Objektball spaeter weiter, wandert
   * das Tor mit und bleibt auf dem Weg.
   */
  gate?: { offset: number; numbers: [number, number] }
  /** Zielzone fuer den Weissen. */
  zone?: { x: number; y: number; r: number } | null
  /**
   * Zielzone, aus dem Stoss gerechnet statt von Hand gesetzt: wie weit der
   * Weisse nach dem Treffer auf der Stosslinie weiterlaeuft ('follow') oder
   * zurueckkommt ('draw'), gemessen vom Geisterball aus.
   *
   * Nur beim geraden Stoss (cut 0) ist das die Wahrheit: dort laeuft der
   * Weisse auf derselben Linie weiter oder zurueck. Bei einem Schnitt geht er
   * auf die Tangente, und die ist eine andere Richtung - deshalb haelt ein
   * Test fest, dass `cueAfter` nur bei cut 0 vorkommt.
   */
  cueAfter?: { along: 'follow' | 'draw'; dist: number; r: number }
  mode?: 'pocket' | 'position' | 'pocket+position'
  skills: SkillTag[]
  shotType: ShotType
  difficulty: number
  speed: number
  spin?: Point
  coachNotes: string
}

export function buildDrill(spec: DrillSpec): Shot {
  const pocket = POCKET_BY_ID[spec.pocket]
  const pocketAim = pocketAimPoint(pocket, 0)
  const side = spec.side ?? 1

  const object = clampBall(spec.object)

  // Bei einem Bandenball zielt der Objektball nicht auf die Tasche, sondern
  // auf deren Spiegelbild hinter der Bande. Bei einer Kombination zielt er
  // auf den Kontaktpunkt am zweiten Ball.
  const second = spec.combo ? clampBall(spec.combo) : null
  const objectAim = second
    ? ghostBall(second, pocketAim)
    : spec.bankRail
      ? mirrorAcross(pocketAim, spec.bankRail)
      : pocketAim

  const directCue = cuePosition(object, objectAim, spec.cut, spec.dist, side)

  const balls: Ball[] = []
  const paths: BallPath[] = []

  const cueId = 'cue'
  const objectId = 'obj'

  // Beim Kick laeuft der Weisse zuerst gegen eine Bande. Seine Lage wird
  // rueckwaerts aus der Anspiellinie gerechnet, damit der Schnittwinkel am
  // Objektball derselbe ist wie bei einem direkten Stoss.
  let cue = directCue
  if (spec.kickRail) {
    const kick = kickPosition(object, objectAim, spec.cut, spec.dist, side, spec.kickRail)
    if (kick) {
      cue = kick.cue
      paths.push({
        id: 'path-cue',
        ballId: cueId,
        role: 'cue',
        segments: [
          { to: kick.hit, rail: true },
          { to: kick.ghost },
        ],
      })
    }
  }

  balls.push({ id: cueId, kind: 'cue', x: cue.x, y: cue.y })
  balls.push({ id: objectId, kind: 'object', number: 1, x: object.x, y: object.y, order: 1 })

  if (second) {
    balls.push({ id: 'obj2', kind: 'object', number: 2, x: second.x, y: second.y, order: 2 })
    paths.push({
      id: 'path-object2',
      ballId: 'obj2',
      role: 'secondary',
      segments: [{ to: pocketAim }],
    })
  }

  if (spec.carom !== undefined) {
    // Bei Stun laeuft der Weisse nach dem Treffer auf der Tangente weiter.
    // Der zweite Ball wird genau dorthin gelegt.
    const ghost = ghostBall(object, objectAim)
    const travel = norm({ x: objectAim.x - object.x, y: objectAim.y - object.y })
    const approach = norm({ x: ghost.x - cue.x, y: ghost.y - cue.y })
    const along = approach.x * travel.x + approach.y * travel.y
    const tangent = norm({
      x: approach.x - travel.x * along,
      y: approach.y - travel.y * along,
    })
    const target = clampBall({
      x: ghost.x + tangent.x * spec.carom,
      y: ghost.y + tangent.y * spec.carom,
    })
    balls.push({ id: 'carom', kind: 'obstacle', number: 3, x: target.x, y: target.y })
    paths.push({
      id: 'path-cue',
      ballId: cueId,
      role: 'cue',
      segments: [{ to: ghost }, { to: target }],
    })
  }

  // Das Tor: zwei Stoerbaelle links und rechts der Anspiellinie, auf halbem
  // Weg zwischen Weissem und Geisterball. Dort ist der Weisse in Fahrt und
  // das Tor weit von beiden Baellen entfernt - direkt vor dem Geisterball
  // wuerde es den Treffpunkt verdecken statt den Weg zu verengen.
  if (spec.gate) {
    const ghost = ghostBall(object, objectAim)
    const laengs = norm({ x: ghost.x - cue.x, y: ghost.y - cue.y })
    const quer = { x: -laengs.y, y: laengs.x }
    const mitte = { x: (cue.x + ghost.x) / 2, y: (cue.y + ghost.y) / 2 }
    for (const [i, nummer] of spec.gate.numbers.entries()) {
      const vorzeichen = i === 0 ? 1 : -1
      const pos = clampBall({
        x: mitte.x + quer.x * spec.gate.offset * vorzeichen,
        y: mitte.y + quer.y * spec.gate.offset * vorzeichen,
      })
      balls.push({ id: `gate-${i}`, kind: 'obstacle', number: nummer, x: pos.x, y: pos.y })
    }
  }

  for (const [i, extra] of (spec.extras ?? []).entries()) {
    const pos = clampBall({ x: extra.x, y: extra.y })
    balls.push({
      id: `extra-${i}`,
      kind: extra.kind ?? 'obstacle',
      number: extra.number,
      x: pos.x,
      y: pos.y,
      order: extra.kind === 'object' ? i + 2 : undefined,
    })
  }

  // Weg des Objektballs: bei einem Bandenball ueber den Auftreffpunkt, bei
  // einer Kombination nur bis zum zweiten Ball.
  const objectSegments = []
  if (spec.bankRail) {
    const hit = castToRail(object, { x: objectAim.x - object.x, y: objectAim.y - object.y })
    if (hit) objectSegments.push({ to: hit.point, rail: true })
  }
  objectSegments.push({ to: second ? objectAim : pocketAim })
  paths.push({ id: 'path-object', ballId: objectId, role: 'object', segments: objectSegments })

  // Die Zielzone: entweder gesetzt (spec.zone) oder aus der Stosslinie
  // gerechnet (spec.cueAfter). Beim geraden Stoss laeuft der Weisse genau auf
  // dieser Linie weiter oder zurueck, deshalb steht die Zone dort, wo er
  // wirklich hinkommt - und nicht dort, wo sie geschaetzt wurde.
  let zone = spec.zone ?? null
  if (spec.cueAfter) {
    const ghost = ghostBall(object, objectAim)
    const laengs = norm({ x: ghost.x - cue.x, y: ghost.y - cue.y })
    const richtung = spec.cueAfter.along === 'follow' ? 1 : -1
    zone = {
      x: ghost.x + laengs.x * spec.cueAfter.dist * richtung,
      y: ghost.y + laengs.y * spec.cueAfter.dist * richtung,
      r: spec.cueAfter.r,
    }
  }

  const base = createShot()
  return {
    ...base,
    id: `builtin-${spec.slug}`,
    name: spec.name,
    description: spec.description,
    balls,
    paths,
    target: { pocketId: spec.pocket, cheat: 0 },
    attributes: {
      shotType: spec.shotType,
      cutAngle: spec.cut,
      spin: spec.spin ?? { x: 0, y: 0 },
      speed: spec.speed,
      difficulty: spec.difficulty,
      elevation: 0,
      skills: spec.skills,
    },
    scoring: {
      mode: zone === null ? 'pocket' : (spec.mode ?? 'pocket+position'),
      targetZone: zone,
      thresholds: { ...DEFAULT_THRESHOLDS },
      scratchRisk: spec.skills.includes('thinCut') || spec.shotType === 'break',
    },
    coachNotes: spec.coachNotes,
    tags: ['Grundübung'],
    level: spec.level,
    favorite: false,
    builtIn: true,
    createdAt: 0,
    updatedAt: 0,
  }
}
