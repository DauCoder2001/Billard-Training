/**
 * Eine Reihe von Uebungen aus einem Muster.
 *
 * Viele Uebungen sind dieselbe Lage in Stufen: derselbe Objektball, dieselbe
 * Tasche, nur der Schnittwinkel waechst von 10 auf 60 Grad - oder der Weisse
 * rueckt Schritt fuer Schritt weiter weg. Von Hand sind das zehn Aufbauten,
 * bei denen jeder einzeln falsch liegen kann. Hier ist es ein Muster und
 * eine Schrittweite.
 *
 * Gerechnet wird rueckwaerts, mit derselben Anspiel-Rechnung, aus der auch
 * die mitgelieferten Uebungen entstehen (domain/aim.ts): aus Objektball,
 * Zielpunkt, Winkel und Abstand folgt die Lage des Weissen. Vorwaerts - den
 * Weissen verschieben und nachsehen, was herauskommt - traefe der
 * gewuenschte Winkel nie genau, und die Uebung hiesse dann anders, als sie
 * ist.
 */

import { cuePosition, norm } from './aim'
import type { AimSide } from './aim'
import { POCKET_BY_ID, distance, ghostBall, pocketAimPoint } from './geometry'
import { duplicateShot } from './shot'
import type { Ball, Point, Shot } from './types'

export const SERIES_AXES = ['cutAngle', 'distance'] as const

export type SeriesAxis = (typeof SERIES_AXES)[number]

export const SERIES_AXIS_LABELS: Record<SeriesAxis, string> = {
  cutAngle: 'Schnittwinkel',
  distance: 'Abstand des Weißen',
}

/** Die Einheit hinter dem Wert, fuer Beschriftung und Namen. */
export const SERIES_AXIS_UNITS: Record<SeriesAxis, string> = {
  cutAngle: '°',
  distance: ' Zoll',
}

/** Grenzen je Achse: was sich sinnvoll einstellen laesst. */
export const SERIES_AXIS_RANGE: Record<SeriesAxis, { min: number; max: number }> = {
  // Ab 85 Grad traegt der Objektball praktisch nicht mehr (feasibility.ts).
  cutAngle: { min: 0, max: 85 },
  // Unter einem halben Ball Abstand ist der Weisse am Objektball.
  distance: { min: 2, max: 90 },
}

/**
 * Weniger als zwei Uebungen sind keine Reihe, mehr als zwoelf sind keine
 * Trainingseinheit mehr - und sie landen alle auf einen Schlag in der
 * Sammlung.
 */
export const MIN_SERIES_STEPS = 2
export const MAX_SERIES_STEPS = 12

export interface SeriesSpec {
  axis: SeriesAxis
  from: number
  to: number
  /** Anzahl der Uebungen, einschliesslich Anfang und Ende. */
  steps: number
  /** Schwierigkeit der ersten und der letzten Uebung, dazwischen verteilt. */
  difficultyFrom: number
  difficultyTo: number
}

/**
 * Warum sich aus dieser Uebung keine Reihe bauen laesst.
 *
 * Lieber ein klarer Grund als eine Reihe, die danebenliegt: wer einen Kick
 * oder eine Karambolage gebaut hat, hat einen eigenen Weg fuer den Weissen
 * gezeichnet. Dessen Stuetzpunkte stehen fest im Diagramm und wandern nicht
 * mit, wenn der Weisse sich bewegt - die Reihe haette zehn Uebungen mit
 * einem Weg, der nicht mehr zum Aufbau passt.
 */
export type SeriesProblem = 'noCue' | 'noObject' | 'noAim' | 'cuePath'

export const SERIES_PROBLEM_TEXTS: Record<SeriesProblem, string> = {
  noCue: 'Ohne Weißen gibt es nichts zu verschieben.',
  noObject: 'Eine Reihe braucht einen Objektball.',
  noAim: 'Eine Reihe braucht eine Zieltasche oder einen gezeichneten Weg des Objektballs.',
  cuePath:
    'Für den Weißen ist ein eigener Weg gezeichnet (Kick oder Karambolage). ' +
    'Der würde beim Verschieben nicht mitwandern. Eine Reihe gibt es nur für den direkten Stoß.',
}

// ------------------------------------------------------------- Hilfsmittel --

function at(b: Ball): Point {
  return { x: b.x, y: b.y }
}

function cueBall(shot: Shot): Ball | undefined {
  return shot.balls.find((b) => b.kind === 'cue')
}

function firstObject(shot: Shot): Ball | undefined {
  return shot.balls
    .filter((b) => b.kind === 'object')
    .sort((a, b) => (a.order ?? 99) - (b.order ?? 99))[0]
}

/** Der Punkt, auf den der Objektball laeuft: sein Weg, sonst die Tasche. */
function objectAim(shot: Shot): Point | null {
  const weg = shot.paths.find((p) => p.role === 'object')
  if (weg?.segments[0]) return weg.segments[0].to
  const id = shot.target.pocketId
  return id ? pocketAimPoint(POCKET_BY_ID[id], shot.target.cheat) : null
}

export function seriesProblem(shot: Shot): SeriesProblem | null {
  if (!cueBall(shot)) return 'noCue'
  if (!firstObject(shot)) return 'noObject'
  if (!objectAim(shot)) return 'noAim'
  if (shot.paths.some((p) => p.role === 'cue' && p.segments.length > 0)) return 'cuePath'
  return null
}

/**
 * Wie der Aufbau heute steht: Winkel, Abstand und auf welcher Seite der
 * Anspiellinie der Weisse liegt.
 *
 * Das ist der Ausgangspunkt der Reihe. Was die Reihe nicht veraendert,
 * bleibt genau so stehen - verschiebt man nur den Winkel, bleibt der
 * Abstand der des Originals.
 */
export function currentAim(shot: Shot): { cutDeg: number; dist: number; side: AimSide } | null {
  const cue = cueBall(shot)
  const objekt = firstObject(shot)
  const ziel = objectAim(shot)
  if (!cue || !objekt || !ziel) return null

  const ghost = ghostBall(at(objekt), ziel)
  const travel = norm({ x: objekt.x - ghost.x, y: objekt.y - ghost.y })
  const zurueck = norm({ x: cue.x - ghost.x, y: cue.y - ghost.y })

  // Der Anlauf ist die Gegenrichtung des Rueckwegs; der Schnittwinkel ist
  // der Winkel zwischen Anlauf und Laufrichtung des Objektballs.
  const cos = Math.max(-1, Math.min(1, -zurueck.x * travel.x - zurueck.y * travel.y))
  const cutDeg = (Math.acos(cos) * 180) / Math.PI

  // Auf welcher Seite: das Kreuzprodukt von Laufrichtung und Rueckweg ist
  // bei side = 1 negativ (siehe anspiellinie in aim.ts).
  const kreuz = travel.x * zurueck.y - travel.y * zurueck.x
  const side: AimSide = kreuz <= 0 ? 1 : -1

  return { cutDeg, dist: distance(at(cue), ghost), side }
}

/**
 * Die Werte der Reihe, gleichmaessig verteilt.
 *
 * Bei einem Schritt steht nur der Anfangswert da - nicht der Mittelwert:
 * wer "von 10 bis 60 in einem Schritt" sagt, meint den Anfang.
 */
export function seriesValues(spec: SeriesSpec): number[] {
  const n = Math.max(1, Math.round(spec.steps))
  if (n === 1) return [spec.from]
  return Array.from({ length: n }, (_, i) => spec.from + ((spec.to - spec.from) * i) / (n - 1))
}

/** Rundet auf eine Stelle, damit aus 23.000000000000004 wieder 23 wird. */
function gerundet(wert: number): number {
  return Math.round(wert * 10) / 10
}

/**
 * Eine einzelne Uebung der Reihe.
 *
 * Der Name traegt den Wert, damit die zehn Uebungen in der Sammlung
 * auseinanderzuhalten sind: "Schnittball (30°)".
 */
export function seriesVariant(shot: Shot, spec: SeriesSpec, wert: number, rang: number): Shot | null {
  const stand = currentAim(shot)
  const objekt = firstObject(shot)
  const ziel = objectAim(shot)
  if (!stand || !objekt || !ziel) return null

  const cutDeg = spec.axis === 'cutAngle' ? wert : stand.cutDeg
  const dist = spec.axis === 'distance' ? wert : stand.dist
  const neu = cuePosition(at(objekt), ziel, cutDeg, dist, stand.side)

  const einheit = SERIES_AXIS_UNITS[spec.axis]
  const kopie = duplicateShot(shot, `${shot.name} (${gerundet(wert)}${einheit})`)
  const schritte = Math.max(1, Math.round(spec.steps) - 1)
  const difficulty = Math.round(
    spec.difficultyFrom + ((spec.difficultyTo - spec.difficultyFrom) * rang) / schritte,
  )

  return {
    ...kopie,
    // Der Fingerabdruck gehoert der Vorlage, von der das Original abstammt -
    // nicht dieser neuen Uebung.
    seedStamp: undefined,
    // Die Stufe faellt weg, so wie bei jeder selbst gebauten Uebung. Eine
    // Reihe veraendert genau das, was ueber die Stufe entscheidet: das
    // Thema. Der 60-Grad-Schnitt aus einer Stufe-A-Uebung ist in der
    // Sammlung ein duenner Schnitt und damit Stufe C. Die geerbte Stufe
    // waere hier dasselbe wie eine geratene - und darueber entscheidet,
    // wer die Reihe baut.
    level: undefined,
    balls: kopie.balls.map((b) => (b.kind === 'cue' ? { ...b, ...neu } : b)),
    attributes: {
      ...kopie.attributes,
      cutAngle: gerundet(cutDeg),
      difficulty: Math.max(1, Math.min(10, difficulty)),
    },
  }
}

/**
 * Die ganze Reihe. Leer, wenn sich aus dieser Uebung keine bauen laesst -
 * den Grund nennt seriesProblem.
 */
export function buildSeries(shot: Shot, spec: SeriesSpec): Shot[] {
  if (seriesProblem(shot) !== null) return []
  return seriesValues(spec)
    .map((wert, i) => seriesVariant(shot, spec, wert, i))
    .filter((s): s is Shot => s !== null)
}
