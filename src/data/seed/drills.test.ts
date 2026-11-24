/**
 * Die mitgelieferten Uebungen gegen die Tischgeometrie gerechnet.
 *
 * Die Ballpositionen stehen nirgends als Zahlen, sie werden aus Objektball,
 * Zieltasche und gewuenschtem Schnittwinkel berechnet. Geprueft wird deshalb
 * nicht eine Liste abgeschriebener Werte, sondern ob das Ergebnis dieser
 * Rechnung auf einem echten Tisch ueberhaupt vorkommen kann: kein Ball in
 * der Bande, keine zwei Baelle ineinander, kein Schnitt, den es nicht gibt,
 * und Bandenwege, bei denen Einfalls- und Ausfallswinkel stimmen.
 */

import { describe, expect, it } from 'vitest'
import {
  POCKET_BY_ID,
  TABLE,
  cutAngle,
  distance,
  ghostBall,
  pocketAimPoint,
} from '@/domain/geometry'
import type { Ball, Point, Shot, TargetZone } from '@/domain/types'
import { seedShots } from './drills'

const R = TABLE.ballRadius
const D = TABLE.ballDiameter

/** Rechenungenauigkeit, nicht Spielraum: Zoll. */
const EPS = 1e-6

const shots = seedShots()

function cueOf(shot: Shot): Ball {
  const cue = shot.balls.find((b) => b.kind === 'cue')
  if (!cue) throw new Error(`${shot.id}: kein Weisser`)
  return cue
}

function firstObject(shot: Shot): Ball {
  const obj = shot.balls.find((b) => b.kind === 'object')
  if (!obj) throw new Error(`${shot.id}: kein Objektball`)
  return obj
}

function at(b: Ball): Point {
  return { x: b.x, y: b.y }
}

/** Zielpunkt in der Tasche, auf die der Stoss gespielt wird. */
function pocketAim(shot: Shot): Point {
  const id = shot.target.pocketId
  if (!id) throw new Error(`${shot.id}: keine Zieltasche`)
  return pocketAimPoint(POCKET_BY_ID[id], shot.target.cheat)
}

/**
 * Der Punkt, auf den der Objektball laeuft.
 *
 * Nicht immer die Tasche: Bei einem Bandenball laeuft er zuerst auf die
 * Bande, bei einer Kombination auf den zweiten Ball. Sein eigener Weg sagt
 * es genau - dessen erster Punkt ist das, was er als Naechstes anspielt.
 * Fuer Geisterball und Schnittwinkel zaehlt nur diese Richtung.
 */
function objectAim(shot: Shot): Point {
  const weg = shot.paths.find((p) => p.role === 'object')
  return weg?.segments[0]?.to ?? pocketAim(shot)
}

/**
 * Der Punkt, von dem aus der Weisse den Geisterball anlaeuft.
 *
 * Meist seine eigene Lage. Beim Kick kommt er ueber eine Bande - dann zaehlt
 * der Bandenpunkt: Der Schnittwinkel entsteht beim Kontakt, nicht dort, wo
 * der Weisse losgefahren ist. Die gerade Linie vom Weissen zum Geisterball
 * waere bei einem Kick gar kein Weg, den ein Ball nimmt.
 */
function cueApproachFrom(shot: Shot): Point {
  const weg = shot.paths.find((p) => p.role === 'cue')
  let letzteBande: Point | null = null
  for (const segment of weg?.segments ?? []) {
    if (segment.rail) letzteBande = segment.to
  }
  return letzteBande ?? at(cueOf(shot))
}

/** Kuerzester Abstand eines Punktes zu einer Strecke. */
function distanceToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len2 = dx * dx + dy * dy
  if (len2 < EPS) return distance(p, a)
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2
  t = Math.max(0, Math.min(1, t))
  return distance(p, { x: a.x + t * dx, y: a.y + t * dy })
}

// ------------------------------------------------------------- Zielzone ---

type Zonenfelder = Record<string, unknown>

function feld(z: Zonenfelder, ...namen: string[]): number | null {
  for (const name of namen) {
    const wert = z[name]
    if (typeof wert === 'number' && Number.isFinite(wert)) return wert
  }
  return null
}

interface Rahmen {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

/**
 * Umschliessendes Rechteck einer Zielzone.
 *
 * Heute ist jede Zone ein Kreis. Kommt spaeter ein Rechteck dazu, greift der
 * zweite Zweig - und zwar bewusst grosszuegig: ob (x, y) dann der Mittelpunkt
 * oder die untere linke Ecke ist, steht noch nicht fest, also deckt der
 * Rahmen beide Lesarten ab. Was so geprueft liegt, liegt in jedem Fall auf
 * dem Tisch, egal wie die Form spaeter gemeint ist.
 *
 * Eine Form, die hier niemand kennt, laeuft nicht stillschweigend durch,
 * sondern bricht mit einem Hinweis ab. Dann ist diese Funktion zu erweitern.
 */
function zoneRahmen(zone: TargetZone): Rahmen {
  const z = zone as unknown as Zonenfelder
  const x = feld(z, 'x')
  const y = feld(z, 'y')
  if (x === null || y === null) {
    throw new Error(`Zielzone ohne Lage: ${JSON.stringify(zone)}`)
  }

  const r = feld(z, 'r', 'radius')
  if (r !== null) {
    return { minX: x - r, maxX: x + r, minY: y - r, maxY: y + r }
  }

  const w = feld(z, 'w', 'width', 'breite')
  const h = feld(z, 'h', 'height', 'hoehe')
  if (w !== null && h !== null) {
    // Lesart A: (x, y) ist der Mittelpunkt. Lesart B: die untere linke Ecke.
    return {
      minX: Math.min(x - w / 2, x),
      maxX: Math.max(x + w / 2, x + w),
      minY: Math.min(y - h / 2, y),
      maxY: Math.max(y + h / 2, y + h),
    }
  }

  throw new Error(
    `Unbekannte Form der Zielzone: ${JSON.stringify(zone)}. ` +
      'zoneRahmen() in drills.test.ts um diese Form erweitern.',
  )
}

// ---------------------------------------------------------------- Banden ---

type Bande = 'left' | 'right' | 'bottom' | 'top'

/** Die Bande, auf der ein Punkt liegt - oder null, wenn er frei steht. */
function bandeAn(p: Point): Bande | null {
  if (Math.abs(p.x) < 1e-6) return 'left'
  if (Math.abs(p.x - TABLE.length) < 1e-6) return 'right'
  if (Math.abs(p.y) < 1e-6) return 'bottom'
  if (Math.abs(p.y - TABLE.width) < 1e-6) return 'top'
  return null
}

/** Knicke eines Weges: Punkt davor, Punkt selbst, Punkt danach. */
function knicke(start: Point, punkte: Point[]): { vor: Point; auf: Point; nach: Point }[] {
  const alle = [start, ...punkte]
  const out: { vor: Point; auf: Point; nach: Point }[] = []
  for (let i = 1; i < alle.length - 1; i++) {
    out.push({ vor: alle[i - 1], auf: alle[i], nach: alle[i + 1] })
  }
  return out
}

// ----------------------------------------------------------------- Tests ---

describe('mitgelieferte Uebungen', () => {
  it('liefert Uebungen mit eindeutigen Kennungen', () => {
    expect(shots.length).toBeGreaterThan(0)
    const ids = shots.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const shot of shots) {
      expect(shot.builtIn, shot.id).toBe(true)
      expect(shot.name.trim().length, shot.id).toBeGreaterThan(0)
      expect(shot.balls.filter((b) => b.kind === 'cue').length, shot.id).toBe(1)
      expect(shot.balls.some((b) => b.kind === 'object'), shot.id).toBe(true)
    }
  })

  it('gibt jeder Uebung einen eigenen Stand ihrer Vorlage mit', () => {
    // Daran erkennt die App spaeter, dass eine uebernommene Fassung von einer
    // aelteren Vorlage abstammt. Zwei gleiche Staende waeren ein Zeichen fuer
    // zwei gleiche Uebungen - oder fuer einen Fehler in der Rechnung.
    const staende = shots.map((s) => s.seedStamp)
    expect(staende.every((s) => typeof s === 'string' && s.length === 8)).toBe(true)
    expect(new Set(staende).size).toBe(shots.length)
  })

  it('legt keinen Ball in eine Bande', () => {
    for (const shot of shots) {
      for (const ball of shot.balls) {
        const wo = `${shot.id} / ${ball.id}`
        expect(ball.x, `${wo} zu weit links`).toBeGreaterThanOrEqual(R - EPS)
        expect(ball.x, `${wo} zu weit rechts`).toBeLessThanOrEqual(TABLE.length - R + EPS)
        expect(ball.y, `${wo} zu weit unten`).toBeGreaterThanOrEqual(R - EPS)
        expect(ball.y, `${wo} zu weit oben`).toBeLessThanOrEqual(TABLE.width - R + EPS)
      }
    }
  })

  it('legt keine zwei Baelle ineinander', () => {
    for (const shot of shots) {
      for (let i = 0; i < shot.balls.length; i++) {
        for (let j = i + 1; j < shot.balls.length; j++) {
          const a = shot.balls[i]
          const b = shot.balls[j]
          const d = distance(at(a), at(b))
          expect(d, `${shot.id}: ${a.id} und ${b.id} stehen ${d.toFixed(3)}" auseinander`) //
            .toBeGreaterThanOrEqual(D - EPS)
        }
      }
    }
  })

  it('klemmt den Weissen nicht an eine Bande', () => {
    // Ein Weisser, der genau an der Bande klebt, ist fast immer ein Unfall
    // der Rechnung und nicht die Absicht der Uebung: Er verlangt eine ganz
    // andere Technik als beschrieben. Der Objektball darf dagegen an der
    // Bande liegen - dafuer gibt es eigene Uebungen.
    for (const shot of shots) {
      const cue = cueOf(shot)
      const luft = Math.min(
        cue.x - R,
        TABLE.length - R - cue.x,
        cue.y - R,
        TABLE.width - R - cue.y,
      )
      expect(luft, `${shot.id}: Weisser klebt an der Bande`).toBeGreaterThan(0.5)
    }
  })

  it('haelt den Weissen vom Geisterball getrennt', () => {
    // Der Weisse muss vor dem Geisterball stehen, nicht darauf: sonst gaebe
    // es keine Anspiellinie und keinen Winkel.
    for (const shot of shots) {
      const cue = at(cueOf(shot))
      const ghost = ghostBall(at(firstObject(shot)), objectAim(shot))
      expect(distance(cue, ghost), `${shot.id}`).toBeGreaterThan(R)
    }
  })

  it('spielt nur Schnitte, die es wirklich gibt', () => {
    for (const shot of shots) {
      const winkel = cutAngle(cueApproachFrom(shot), at(firstObject(shot)), objectAim(shot))
      expect(Number.isNaN(winkel), `${shot.id}: kein Winkel bestimmbar`).toBe(false)
      // Ab 90 Grad ist der Objektball nicht mehr zu treffen.
      expect(winkel, `${shot.id}: Schnitt ${winkel.toFixed(1)} Grad`).toBeLessThan(90)
      expect(winkel, `${shot.id}`).toBeGreaterThanOrEqual(0)
    }
  })

  it('haelt den Weg des Weissen bis zum ersten Kontakt frei', () => {
    for (const shot of shots) {
      const cue = cueOf(shot)
      const objekt = firstObject(shot)
      const weg = shot.paths.find((p) => p.role === 'cue')
      // Mit eigenem Weg (Kick, Karambolage) zaehlt dessen erstes Stueck,
      // sonst die gerade Linie zum Geisterball.
      const ziel = weg?.segments[0]
        ? weg.segments[0].to
        : ghostBall(at(objekt), objectAim(shot))

      for (const ball of shot.balls) {
        if (ball.id === cue.id || ball.id === objekt.id) continue
        const d = distanceToSegment(at(ball), at(cue), ziel)
        expect(d, `${shot.id}: ${ball.id} steht im Weg des Weissen`) //
          .toBeGreaterThanOrEqual(D - EPS)
      }
    }
  })

  it('knickt Bandenwege dort, wo eine Bande ist', () => {
    let geprueft = 0
    for (const shot of shots) {
      for (const weg of shot.paths) {
        for (const segment of weg.segments) {
          if (!segment.rail) continue
          geprueft += 1
          expect(
            bandeAn(segment.to),
            `${shot.id} / ${weg.id}: Knick bei (${segment.to.x.toFixed(2)}, ` +
              `${segment.to.y.toFixed(2)}) liegt auf keiner Bande`,
          ).not.toBeNull()
        }
      }
    }
    // Ohne Bandenweg wuerde dieser Test nichts aussagen.
    expect(geprueft, 'keine Bandenwege in den Uebungen').toBeGreaterThan(0)
  })

  it('spiegelt Bandenwege sauber: Einfallswinkel gleich Ausfallswinkel', () => {
    let geprueft = 0
    for (const shot of shots) {
      for (const weg of shot.paths) {
        const start = weg.ballId
          ? at(shot.balls.find((b) => b.id === weg.ballId)!)
          : (weg.from ?? weg.segments[0].to)
        const punkte = weg.segments.map((s) => s.to)

        for (const [i, knick] of knicke(start, punkte).entries()) {
          if (!weg.segments[i].rail) continue
          const bande = bandeAn(knick.auf)
          if (!bande) continue // Die Lage pruefte der Test davor.
          geprueft += 1

          // An einer senkrechten Bande spiegelt sich x, an einer
          // waagerechten y. Die jeweils andere Richtung laeuft weiter.
          const ein = { x: knick.auf.x - knick.vor.x, y: knick.auf.y - knick.vor.y }
          const aus = { x: knick.nach.x - knick.auf.x, y: knick.nach.y - knick.auf.y }
          const senkrecht = bande === 'left' || bande === 'right'

          const einN = senkrecht ? ein.x : ein.y
          const ausN = senkrecht ? aus.x : aus.y
          const einT = senkrecht ? ein.y : ein.x
          const ausT = senkrecht ? aus.y : aus.x

          const wo = `${shot.id} / ${weg.id} an Bande ${bande}`
          // Senkrecht zur Bande kehrt sich die Richtung um ...
          expect(Math.sign(einN) * Math.sign(ausN), `${wo}: kein Richtungswechsel`).toBe(-1)
          // ... und der Winkel bleibt gleich: tan(ein) = tan(aus).
          const tanEin = Math.abs(einT / einN)
          const tanAus = Math.abs(ausT / ausN)
          expect(tanAus, `${wo}: Winkel stimmt nicht`).toBeCloseTo(tanEin, 6)
        }
      }
    }
    expect(geprueft, 'keine Bandenknicke in den Uebungen').toBeGreaterThan(0)
  })

  it('legt jede Zielzone dorthin, wo der Weisse auch liegen bleiben kann', () => {
    // Nicht: die Zone liegt ganz auf dem Tisch. Das muss sie nicht - gewertet
    // wird nach dem Abstand zur Mitte, und die weiteren Ringe reichen ohnehin
    // ueber die Banden hinaus. Was gelten muss: in der Zone gibt es
    // ueberhaupt einen Punkt, an dem ein Ball liegen bleiben kann. Sonst ist
    // die volle Wertung nicht zu erreichen.
    const erreichbar = {
      minX: R,
      maxX: TABLE.length - R,
      minY: R,
      maxY: TABLE.width - R,
    }

    let geprueft = 0
    for (const shot of shots) {
      const zone = shot.scoring.targetZone
      if (!zone) continue
      geprueft += 1

      // Ueber das umschliessende Rechteck, damit die Pruefung auch dann noch
      // gilt, wenn die Zone einmal ein Rechteck ist. Beim Kreis ist das eine
      // Naeherung nach aussen - grob genug, um eine Zone durchzulassen, die
      // nur mit einer Ecke ihres Rahmens hineinragt, und scharf genug, um
      // eine Zone zu fassen, die ganz in der Bande liegt.
      const rahmen = zoneRahmen(zone)
      const ueberlappt =
        rahmen.maxX >= erreichbar.minX - EPS &&
        rahmen.minX <= erreichbar.maxX + EPS &&
        rahmen.maxY >= erreichbar.minY - EPS &&
        rahmen.minY <= erreichbar.maxY + EPS
      expect(ueberlappt, `${shot.id}: Zielzone liegt ausserhalb der Spielflaeche`).toBe(true)

      // Solange die Zone ein Kreis ist, laesst sich mehr sagen: die Mitte
      // selbst muss erreichbar sein, sonst gibt es nie die volle Wertung.
      const mitte = zone as unknown as Zonenfelder
      if (feld(mitte, 'r', 'radius') !== null) {
        expect(zone.x, `${shot.id}: Mitte der Zielzone steckt in der Bande`) //
          .toBeGreaterThanOrEqual(erreichbar.minX - EPS)
        expect(zone.x, `${shot.id}: Mitte der Zielzone steckt in der Bande`) //
          .toBeLessThanOrEqual(erreichbar.maxX + EPS)
        expect(zone.y, `${shot.id}: Mitte der Zielzone steckt in der Bande`) //
          .toBeGreaterThanOrEqual(erreichbar.minY - EPS)
        expect(zone.y, `${shot.id}: Mitte der Zielzone steckt in der Bande`) //
          .toBeLessThanOrEqual(erreichbar.maxY + EPS)
      }
    }
    expect(geprueft, 'keine Zielzone in den Uebungen').toBeGreaterThan(0)
  })

  it('nimmt die Zielzone unabhaengig von ihrer Form', () => {
    // Haelt fest, was zoneRahmen() koennen muss. Der Kreis ist die heutige
    // Form; das Rechteck steht hier, damit der Umbau nicht an diesem Test
    // scheitert, sondern von ihm getragen wird.
    const kreis = zoneRahmen({ x: 50, y: 25, r: 6 })
    expect(kreis).toEqual({ minX: 44, maxX: 56, minY: 19, maxY: 31 })

    const rechteck = zoneRahmen({ x: 50, y: 25, w: 10, h: 4 } as unknown as TargetZone)
    // Beide Lesarten von (x, y) - Mittelpunkt und untere linke Ecke - liegen
    // im Rahmen.
    expect(rechteck).toEqual({ minX: 45, maxX: 60, minY: 23, maxY: 29 })

    expect(() => zoneRahmen({ x: 1, y: 2 } as unknown as TargetZone)).toThrow(/Unbekannte Form/)
  })

  it('stimmt im angegebenen Schnittwinkel mit der Lage der Baelle ueberein', () => {
    // Der Winkel in den Attributen ist die Ansage an den Spieler. Weicht die
    // gerechnete Lage davon ab, stimmt die Uebung nicht mit ihrer Beschriftung
    // ueberein - etwa weil ein Ball an die Bande geschoben werden musste.
    // Alle Abweichungen sammeln statt beim ersten Treffer stehenzubleiben:
    // sonst verdeckt die erste Uebung die anderen.
    const abweichungen: string[] = []
    for (const shot of shots) {
      const angesagt = shot.attributes.cutAngle
      if (angesagt === undefined) continue
      const gemessen = cutAngle(cueApproachFrom(shot), at(firstObject(shot)), objectAim(shot))
      if (Math.abs(gemessen - angesagt) > 0.5) {
        abweichungen.push(
          `${shot.id}: angesagt ${angesagt}, gelegt ${gemessen.toFixed(2)} Grad`,
        )
      }
    }
    expect(abweichungen).toEqual([])
  })
})
