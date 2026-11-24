/**
 * Fertige Aufbauten: das volle Dreieck, die Neuner-Raute und die Zufallslage.
 *
 * Alles hier arbeitet in Tischkoordinaten (Zoll) und laesst den Weissen, die
 * Stoer- und die Geisterbaelle stehen - angefasst werden nur die Objektbaelle.
 */

import { POCKETS, TABLE, distance, resolveOverlaps } from './geometry'
import { newId } from './shot'
import type { Ball, Point, Shot } from './types'

export type RackKind = 'eight' | 'nine'

/**
 * Mittenabstand zweier benachbarter Kugeln: im Rack beruehren sie sich.
 *
 * Nachgemessen, weil der genaue Wert hier zaehlt: im gleichseitigen Dreieck
 * liegen auch die Nachbarn der naechsten Zeile auf genau diesem Abstand
 * (3/4 + 1/4 des Quadrats), ohne Rundungsrest. Die Ueberlappungspruefung
 * (geometry.ballsOverlap) schlaegt erst darunter an, ein Rack bleibt also
 * stehen. Der Test darueber wacht.
 */
const SCHRITT = TABLE.ballDiameter

/** Zeilenabstand: die Reihen stehen gleichseitig, Hoehe = Schritt * √3/2. */
const REIHE = (SCHRITT * Math.sqrt(3)) / 2

/**
 * Das volle Dreieck, Zeile fuer Zeile von der Spitze aus. Ein regelgerechter
 * Aufbau: die Eins an der Spitze, die Acht in der Mitte der dritten Zeile und
 * in den beiden hinteren Ecken je einmal voll und halb.
 */
const DREIECK: number[][] = [
  [1],
  [9, 2],
  [10, 8, 3],
  [11, 4, 12, 5],
  [6, 13, 7, 14, 15],
]

/** Die Neuner-Raute: Eins an der Spitze, Neun in der Mitte. */
const RAUTE: number[][] = [[1], [2, 3], [4, 9, 5], [6, 7], [8]]

/**
 * Die Kugeln eines Aufbaus. Die Spitze sitzt auf dem Fusspunkt, das Dreieck
 * oeffnet sich zur Fussbande hin. Die Reihenfolge (order) folgt der Nummer -
 * im Neunerball wird ohnehin von unten nach oben gespielt.
 */
export function rackBalls(kind: RackKind): Ball[] {
  const zeilen = kind === 'eight' ? DREIECK : RAUTE
  const out: Ball[] = []
  zeilen.forEach((zeile, r) => {
    zeile.forEach((nummer, i) => {
      out.push({
        id: newId(),
        kind: 'object',
        number: nummer,
        x: TABLE.footSpot.x + r * REIHE,
        y: TABLE.footSpot.y + (i - (zeile.length - 1) / 2) * SCHRITT,
        order: nummer,
      })
    })
  })
  return out
}

/** Setzt den Aufbau aufs Tuch und ersetzt dabei die bisherigen Objektbaelle. */
export function applyRack(shot: Shot, kind: RackKind): Shot {
  return {
    ...shot,
    balls: [...shot.balls.filter((b) => b.kind !== 'object'), ...rackBalls(kind)],
  }
}

// ------------------------------------------------------------ Zufallslage ---

/** Abstand, den eine Kugel von einer Taschenmitte halten soll. */
const TASCHENABSTAND = 4

/** Luft zwischen zwei zufaellig gesetzten Kugeln, damit nichts klebt. */
const ABSTAND = TABLE.ballDiameter + 0.25

/** Rand, den eine Kugel zur Bande haelt. */
const RAND = TABLE.ballRadius + 0.5

/**
 * Verteilt die Objektbaelle zufaellig ueber den Tisch: ohne Ueberschneidung,
 * mit Abstand zu den Taschen und zu allem, was stehenbleibt. Nummer,
 * Reihenfolge und Kennung behaelt jede Kugel, nur ihr Platz aendert sich.
 *
 * Die Zufallsquelle steht als Parameter, damit der Test eine feste Folge
 * vorgeben kann.
 */
export function shuffleObjectBalls(shot: Shot, rnd: () => number = Math.random): Shot {
  const belegt: Point[] = shot.balls
    .filter((b) => b.kind !== 'object')
    .map((b) => ({ x: b.x, y: b.y }))
  const plaetze = new Map<string, Point>()
  for (const ball of shot.balls) {
    if (ball.kind !== 'object') continue
    const platz = freierPlatz(belegt, rnd)
    belegt.push(platz)
    plaetze.set(ball.id, platz)
  }
  return {
    ...shot,
    balls: shot.balls.map((b) => {
      const platz = plaetze.get(b.id)
      return platz ? { ...b, x: platz.x, y: platz.y } : b
    }),
  }
}

/**
 * Wuerfelt Plaetze, bis einer frei ist. Geht dem Tisch der Platz aus, schiebt
 * resolveOverlaps den letzten Wurf frei - lieber eine gedraengte Lage als
 * keine.
 */
function freierPlatz(belegt: Point[], rnd: () => number): Point {
  let letzter: Point = { x: TABLE.length / 2, y: TABLE.width / 2 }
  for (let versuch = 0; versuch < 300; versuch++) {
    letzter = {
      x: RAND + rnd() * (TABLE.length - 2 * RAND),
      y: RAND + rnd() * (TABLE.width - 2 * RAND),
    }
    if (belegt.some((o) => distance(letzter, o) < ABSTAND)) continue
    if (POCKETS.some((t) => distance(letzter, t.center) < TASCHENABSTAND)) continue
    return letzter
  }
  return resolveOverlaps(letzter, belegt)
}
