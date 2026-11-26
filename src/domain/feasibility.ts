/**
 * Geht dieser Aufbau am echten Tisch auf?
 *
 * Eine reine Funktion ueber die Uebung, keine Simulation: gerechnet werden
 * Abstaende und Winkel aus der Lage der Baelle. Dieselbe Geometrie prueft
 * schon die mitgelieferten Uebungen (data/seed/drills.test.ts) - hier steht
 * sie fuer die Aufbauten des Nutzers, waehrend er sie baut.
 *
 * Hinweise, keine Verbote: ein Trickshot darf unmoeglich aussehen, und wer
 * eine Uebung absichtlich hart baut, soll sie bauen duerfen. Nur eine Lage
 * ist ein echtes Hindernis, und die lehnt die App auch heute schon ab: eine
 * Uebung ohne Massstab (isScorable).
 *
 * Nicht geprueft wird, was das Datenmodell nicht kennt: ein Sprungball
 * fliegt ueber einen Ball hinweg, aber ein Weg weiss heute nicht, dass er
 * durch die Luft geht. Bis das Modell das kann (Stufe D, Spezialtechniken),
 * meldet die Sichtlinie bei einem Sprungball einen Hinweis, der keiner ist.
 */

import { POCKET_BY_ID, TABLE, distance, ghostBall, pocketAimPoint } from './geometry'
import { isScorable } from './scoring'
import type { Ball, Point, Shot } from './types'

const D = TABLE.ballDiameter

/** Ab hier traegt der Objektball praktisch nicht mehr. */
export const MAX_CUT_ANGLE = 85

/**
 * Luft zwischen Ballkante und Bande, unter der das Queue nicht mehr flach
 * anzusetzen ist: ein Zoll. Darunter muss erhoeht werden - eine andere
 * Technik als die, die eine Uebung beschreibt.
 */
export const MIN_CUE_ROOM = 1

/**
 * Wie gerade der Stoss von der Bande wegzeigen muss, damit die Enge
 * ueberhaupt stoert. 0,5 ist der Kosinus von 60 Grad: laeuft der Weisse
 * flacher an der Bande entlang, liegt das Queue neben ihr statt darueber.
 */
const AWAY_FROM_RAIL = 0.5

export const FEASIBILITY_CHECKS = [
  'scorable',
  'overlap',
  'cueRoom',
  'sightLine',
  'cutAngle',
  'objectPath',
  'pocketBlocked',
] as const

export type FeasibilityCheck = (typeof FEASIBILITY_CHECKS)[number]

/**
 * 'blocker' ist, was die App selbst ablehnt - heute nur die Uebung ohne
 * Massstab. Alles andere ist 'warn': auffaellig, aber erlaubt.
 */
export type HintLevel = 'blocker' | 'warn'

export interface FeasibilityHint {
  check: FeasibilityCheck
  level: HintLevel
  text: string
}

// ------------------------------------------------------------- Hilfsmittel --

/** Die Baelle, die wirklich auf dem Tisch liegen. */
function realBalls(shot: Shot): Ball[] {
  // Der Geisterball ist eine Markierung, kein Ball: er steht niemandem im
  // Weg und liegt auch in keinem anderen Ball drin.
  return shot.balls.filter((b) => b.kind !== 'ghost')
}

function at(b: Ball): Point {
  return { x: b.x, y: b.y }
}

/** 'der Weisse', 'Ball 3' - so, wie ein Satz den Ball nennt. */
function label(ball: Ball): string {
  switch (ball.kind) {
    case 'cue':
      return 'der Weiße'
    case 'obstacle':
      return ball.number ? `Störball ${ball.number}` : 'ein Störball'
    case 'ghost':
      return 'der Geisterball'
    default:
      return ball.number ? `Ball ${ball.number}` : 'der Objektball'
  }
}

/** Derselbe Name am Satzanfang. */
function gross(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** Kuerzester Abstand eines Punktes zu einer Strecke. */
function distanceToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len2 = dx * dx + dy * dy
  if (len2 < 1e-12) return distance(p, a)
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2))
  return distance(p, { x: a.x + t * dx, y: a.y + t * dy })
}

function richtung(von: Point, nach: Point | null): Point {
  return nach ? { x: nach.x - von.x, y: nach.y - von.y } : { x: 0, y: 0 }
}

function norm(d: Point): Point | null {
  const len = Math.hypot(d.x, d.y)
  return len < 1e-9 ? null : { x: d.x / len, y: d.y / len }
}

function cueBall(shot: Shot): Ball | undefined {
  return shot.balls.find((b) => b.kind === 'cue')
}

/** Der Objektball, der zuerst getroffen wird. */
function firstObject(shot: Shot): Ball | undefined {
  return shot.balls
    .filter((b) => b.kind === 'object')
    .sort((a, b) => (a.order ?? 99) - (b.order ?? 99))[0]
}

/** Zielpunkt in der gewaehlten Tasche, oder null ohne Tasche. */
function pocketAim(shot: Shot): Point | null {
  const id = shot.target.pocketId
  return id ? pocketAimPoint(POCKET_BY_ID[id], shot.target.cheat) : null
}

/**
 * Der Punkt, auf den der Objektball laeuft.
 *
 * Nicht immer die Tasche: bei einem Bandenball zuerst die Bande, bei einer
 * Kombination der zweite Ball. Sein eigener Weg sagt es genau.
 */
function objectAim(shot: Shot): Point | null {
  const weg = shot.paths.find((p) => p.role === 'object')
  return weg?.segments[0]?.to ?? pocketAim(shot)
}

/**
 * Der Punkt, von dem aus der Weisse den Geisterball anlaeuft.
 *
 * Beim Kick kommt er ueber eine Bande - dann zaehlt der letzte Bandenpunkt.
 * Der Schnittwinkel entsteht beim Kontakt, nicht dort, wo der Weisse
 * losgefahren ist.
 */
function cueApproachFrom(shot: Shot, cue: Ball): Point {
  let letzteBande: Point | null = null
  for (const segment of shot.paths.find((p) => p.role === 'cue')?.segments ?? []) {
    if (segment.rail) letzteBande = segment.to
  }
  return letzteBande ?? at(cue)
}

/**
 * Wohin der Weisse bis zum ersten Kontakt faehrt.
 *
 * Mit eigenem Weg (Kick, Karambolage) zaehlt dessen erstes Stueck, sonst die
 * gerade Linie zum Geisterball.
 */
function cueFirstLeg(shot: Shot): Point | null {
  const eigenes = shot.paths.find((p) => p.role === 'cue')?.segments[0]
  if (eigenes) return eigenes.to
  const objekt = firstObject(shot)
  const ziel = objectAim(shot)
  if (!objekt || !ziel) return null
  // Er faehrt nicht auf den Ball zu, sondern auf die Stelle, an der er im
  // Moment des Treffens steht.
  return ghostBall(at(objekt), ziel)
}

/**
 * Der ganze Weg des Objektballs bis in die Tasche, als Kette von Punkten.
 *
 * Gezeichnete Wege zuerst; endet die Kette nicht an der Tasche - bei einer
 * Kombination am zweiten Ball -, kommt die Tasche hinten dran. So ist das
 * letzte Stueck immer das in die Tasche, und nur fuer dieses gibt es die
 * eigene Meldung "verdeckt die Tasche".
 */
function objectRoute(shot: Shot): Point[] {
  const objekt = firstObject(shot)
  if (!objekt) return []
  const weg = shot.paths.find((p) => p.role === 'object')
  const punkte = [at(objekt), ...(weg?.segments ?? []).map((s) => s.to)]
  const tasche = pocketAim(shot)
  if (tasche && distance(punkte[punkte.length - 1], tasche) > D) punkte.push(tasche)
  return punkte.length > 1 ? punkte : []
}

/**
 * Der Ball, der einer Strecke am naechsten kommt - oder keiner.
 *
 * Baelle an den beiden Enden zaehlen nicht: dort steht, was angespielt wird
 * (der zweite Ball einer Kombination) oder was gerade losfaehrt. Ein
 * Hindernis liegt dazwischen.
 *
 * Gemeldet wird der naechste, nicht der erste: stehen zwei im Weg, ist der
 * dichteste der, um den es geht.
 */
function blockingBall(balls: Ball[], von: Point, nach: Point, egal: string[]): Ball | null {
  let naechster: Ball | null = null
  // Ausdruecklich number: TABLE steht unter "as const", damit hat D den
  // Typ 2.25 und nicht number - ohne die Angabe liesse sich hier nichts
  // anderes mehr zuweisen.
  let abstand: number = D
  for (const ball of balls) {
    if (egal.includes(ball.id)) continue
    const p = at(ball)
    if (distance(p, von) < D || distance(p, nach) < D) continue
    const d = distanceToSegment(p, von, nach)
    if (d < abstand) {
      abstand = d
      naechster = ball
    }
  }
  return naechster
}

/** Das erste Ballpaar, das ineinander liegt. */
function overlappingPair(balls: Ball[]): [Ball, Ball] | null {
  for (let i = 0; i < balls.length; i++) {
    for (let j = i + 1; j < balls.length; j++) {
      if (distance(at(balls[i]), at(balls[j])) < D - 1e-9) return [balls[i], balls[j]]
    }
  }
  return null
}

/**
 * Schnittwinkel in Grad, oder null, wenn die Punkte zusammenfallen.
 *
 * Eigene Rechnung statt geometry.cutAngle: die liefert bei entarteten Lagen
 * NaN, und ein Vergleich mit NaN ist still - der Hinweis bliebe stumm, ohne
 * dass jemand es merkt.
 */
function cutAngleOf(cue: Point, objekt: Point, ziel: Point): number | null {
  const ghost = ghostBall(objekt, ziel)
  const anlauf = norm(richtung(cue, ghost))
  const lauf = norm(richtung(ghost, objekt))
  if (!anlauf || !lauf) return null
  const cos = Math.max(-1, Math.min(1, anlauf.x * lauf.x + anlauf.y * lauf.y))
  return (Math.acos(cos) * 180) / Math.PI
}

/**
 * Die Bande, die dem Weissen den Platz fuer das Queue nimmt - oder keine.
 *
 * Zwei Bedingungen zusammen: zu wenig Luft zwischen Ballkante und Bande,
 * und ein Stoss, der von dieser Bande wegfuehrt. Nur dann liegt das Queue
 * ueber der Bande statt neben ihr. Ein Weisser, der an der Langbande liegt
 * und an ihr entlangspielt, steht frei genug.
 */
function engeBande(cue: Point, stoss: Point): string | null {
  const banden = [
    { luft: cue.x - TABLE.ballRadius, weg: stoss.x, name: 'Kopfbande' },
    { luft: TABLE.length - TABLE.ballRadius - cue.x, weg: -stoss.x, name: 'Fußbande' },
    { luft: cue.y - TABLE.ballRadius, weg: stoss.y, name: 'unteren Langbande' },
    { luft: TABLE.width - TABLE.ballRadius - cue.y, weg: -stoss.y, name: 'oberen Langbande' },
  ]
  for (const b of banden) {
    if (b.luft < MIN_CUE_ROOM && b.weg > AWAY_FROM_RAIL) return b.name
  }
  return null
}

// ------------------------------------------------------------- Die Pruefung --

/**
 * Alle Hinweise zu einem Aufbau, in Lesereihenfolge: erst was die App selbst
 * ablehnt, dann der Aufbau als Ganzes, dann der Stoss von vorn nach hinten -
 * Queue, Anspiellinie, Kontakt, Weg des Objektballs, Tasche.
 *
 * Je Pruefung hoechstens ein Hinweis. Drei Saetze ueber denselben Ball helfen
 * niemandem beim Aufraeumen.
 */
export function feasibilityHints(shot: Shot): FeasibilityHint[] {
  const hints: FeasibilityHint[] = []
  const balls = realBalls(shot)
  const cue = cueBall(shot)
  const objekt = firstObject(shot)

  if (!isScorable(shot)) {
    hints.push({
      check: 'scorable',
      level: 'blocker',
      text:
        'Ohne Objektball und ohne Zielzone gibt es nichts zu bewerten – ' +
        'das Training nimmt diese Übung nicht an.',
    })
  }

  const paar = overlappingPair(balls)
  if (paar) {
    hints.push({
      check: 'overlap',
      level: 'warn',
      text: `${gross(label(paar[0]))} und ${label(paar[1])} liegen ineinander.`,
    })
  }

  const erstesStueck = cueFirstLeg(shot)

  if (cue) {
    const stoss = norm(richtung(at(cue), erstesStueck))
    const bande = stoss ? engeBande(at(cue), stoss) : null
    if (bande) {
      hints.push({
        check: 'cueRoom',
        level: 'warn',
        text: `Der Weiße liegt zu dicht an der ${bande}, um das Queue für diesen Stoß flach anzusetzen.`,
      })
    }
  }

  if (cue && erstesStueck) {
    const stoerer = blockingBall(balls, at(cue), erstesStueck, [cue.id])
    if (stoerer) {
      hints.push({
        check: 'sightLine',
        level: 'warn',
        text: `${gross(label(stoerer))} steht im Weg des Weißen.`,
      })
    }
  }

  const ziel = objectAim(shot)
  if (cue && objekt && ziel) {
    const winkel = cutAngleOf(cueApproachFrom(shot, cue), at(objekt), ziel)
    if (winkel !== null && winkel > MAX_CUT_ANGLE) {
      hints.push({
        check: 'cutAngle',
        level: 'warn',
        text:
          `Der Schnittwinkel beträgt ${winkel.toFixed(0)}°. ` +
          `Über ${MAX_CUT_ANGLE}° trägt der Objektball praktisch nicht mehr.`,
      })
    }
  }

  // Der Weg des Objektballs, Stueck fuer Stueck. Das letzte ist das in die
  // Tasche, und das bekommt seine eigene Meldung.
  const route = objectRoute(shot)
  for (let i = 0; i + 1 < route.length; i++) {
    const stoerer = blockingBall(balls, route[i], route[i + 1], cue ? [cue.id] : [])
    if (!stoerer) continue
    const letztes = i + 2 === route.length
    hints.push({
      check: letztes ? 'pocketBlocked' : 'objectPath',
      level: 'warn',
      text: letztes
        ? `${gross(label(stoerer))} verdeckt die Tasche.`
        : `${gross(label(stoerer))} steht im Weg des Objektballs.`,
    })
    break
  }

  return hints
}
