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
import { LEVELS } from '@/domain/types'
import type { Ball, Level, Point, Shot, TargetZone } from '@/domain/types'
import { feasibilityHints } from '@/domain/feasibility'
import { SEED_VERSION } from '../../bootstrap'
import { ANDERE_SEITE } from './build'
import { RETIRED_IDS, SEED_SPECS, seedIdsSince, seedShots } from './index'

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

/**
 * Die Bande, an der ein Ball in diesem Punkt umkehrt - oder null.
 *
 * Geprueft wird die **Umkehrlinie**, nicht die Bandenflaeche: die Mitte
 * eines Balles kommt der Bande nie naeher als einen Radius. Bis 0.19.1
 * stand hier die Bandenflaeche, und derselbe Irrtum steckte in der
 * Rechnung - der Test hat den Fehler also mitgetragen statt ihn zu finden.
 */
function bandeAn(p: Point): Bande | null {
  const r = TABLE.ballRadius
  if (Math.abs(p.x - r) < 1e-6) return 'left'
  if (Math.abs(p.x - (TABLE.length - r)) < 1e-6) return 'right'
  if (Math.abs(p.y - r) < 1e-6) return 'bottom'
  if (Math.abs(p.y - (TABLE.width - r)) < 1e-6) return 'top'
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

  it('stuft jede Uebung ein', () => {
    // DrillSpec verlangt die Stufe, damit keine neue Uebung ohne Einstufung
    // durchrutscht. Hier steht die Gegenprobe am fertigen Ergebnis.
    expect(shots.filter((s) => !s.level).map((s) => s.id)).toEqual([])
  })

  it('verteilt die heutigen Uebungen auf A, B und C', () => {
    // Das Thema bestimmt die Stufe, die Schwierigkeit ordnet innerhalb der
    // Stufe. Darum liegt der sehr duenne Schnitt mit 75 Grad in C
    // (Spielsituationen) und nicht in D.
    //
    // D (Spezialtechniken) ist leer, und das ist kein Versehen: Sprung- und
    // Masseschlaege kennt das Datenmodell noch nicht - es fehlen die
    // Stossarten und die Angabe, dass ein Ball durch die Luft fliegt.
    //
    // Die Zahlen wachsen mit der Sammlung. Wer Uebungen hinzufuegt, zieht
    // sie hier mit. Die 25 je Stufe aus dem Konzept sind ein Richtwert und
    // kein Soll: die Sammlung waechst von jetzt an Stueck fuer Stueck und
    // nicht in einem Zug auf eine Zielzahl (Entscheidung vom 26.11.2026).
    const zahl = (l: Level) => shots.filter((s) => s.level === l).length
    expect(LEVELS.map(zahl)).toEqual([20, 7, 11, 0])
    expect(shots).toHaveLength(38)
  })

  it('haelt die Schwierigkeit der Stufe A im vorgesehenen Band', () => {
    // Stufe A ist 1 bis 4 (Konzept 3.1). Eine Uebung mit 7 wuerde dort
    // niemandem helfen, auch wenn ihr Thema passt - und waere ein Zeichen,
    // dass sie in B oder C gehoert.
    const a = shots.filter((s) => s.level === 'A')
    const schwer = a.filter((s) => s.attributes.difficulty > 4 || s.attributes.difficulty < 1)
    expect(schwer.map((s) => `${s.id}: ${s.attributes.difficulty}`)).toEqual([])
    // Und sie nutzt das Band auch aus, statt alles auf eine Zahl zu legen.
    expect(new Set(a.map((s) => s.attributes.difficulty))).toEqual(new Set([1, 2, 3, 4]))
  })

  it('haelt die Schwierigkeit der Stufen B und C in ihren Baendern', () => {
    // B ist 4 bis 6, C ist 6 bis 8 (Konzept 3.1). Die Baender ueberlappen
    // mit Absicht: eine 4 kann in A wie in B stehen, eine 6 in B wie in C.
    const ausserhalb = (stufe: Level, von: number, bis: number) =>
      shots
        .filter((s) => s.level === stufe)
        .filter((s) => s.attributes.difficulty < von || s.attributes.difficulty > bis)
        .map((s) => `${s.id}: ${s.attributes.difficulty}`)
    expect(ausserhalb('B', 4, 6)).toEqual([])
    // Die eine gewollte Ausnahme: der sehr duenne Schnitt mit 75 Grad hat 9,
    // gehoert thematisch aber nach C - ein duenner Schnitt ist eine
    // Spielsituation, keine Spezialtechnik (Konzept 3.1, dort namentlich
    // genannt). Gemessen ist er in C auch die zweitschwerste Uebung: 12 %
    // Guete, nur der Kick liegt darunter.
    expect(ausserhalb('C', 6, 8)).toEqual(['builtin-schnitt-75: 9'])
    // Und die Stufe B nutzt ihr Band aus: bis 0.19.2 trugen alle sieben
    // Uebungen die 6, obwohl ihre gemessene Guete von 65 % bis 8 % reicht.
    const b = shots.filter((s) => s.level === 'B')
    expect(new Set(b.map((s) => s.attributes.difficulty))).toEqual(new Set([4, 5, 6]))
  })

  it('nennt keine Uebung aus der Zukunft', () => {
    // `since` sagt, ab welcher Einspielung es eine Uebung gibt. Steht dort
    // eine Zahl ueber SEED_VERSION, kommt sie auf keinem Geraet an, auf dem
    // die App schon lief - der haeufigste Fehler beim Erweitern der
    // Sammlung ist die vergessene Erhoehung.
    const zukunft = SEED_SPECS.filter((spec) => (spec.since ?? 1) > SEED_VERSION)
    expect(zukunft.map((spec) => spec.slug)).toEqual([])
  })

  it('legt keine Stufe ueber ihre geplante Groesse', () => {
    // Vier Stufen mit je 25 Uebungen, 100 insgesamt (Entscheidung E6 im
    // Konzept). Diese Pruefung bleibt auch dann richtig, wenn die Zahlen
    // oben wachsen.
    for (const l of LEVELS) {
      expect(shots.filter((s) => s.level === l).length).toBeLessThanOrEqual(25)
    }
  })

  it('rechnet dieselben Vorlagen wie am 27.11.2026', () => {
    // Die Fingerabdruecke festgenagelt. Sie sind kein Selbstzweck: aendert
    // sich einer, bekommt jeder, der eine eigene Fassung dieser Uebung
    // gespeichert hat, beim naechsten Start den Hinweis "Vorlage
    // ueberarbeitet" - auch wenn nur eine Rechnung umgezogen ist und sich
    // am Aufbau nichts geaendert hat.
    //
    // Schlaegt diese Pruefung an, ist das eine Frage, keine Panne: war die
    // Aenderung an der Vorlage gewollt? Dann die Zahl hier nachziehen und
    // im CHANGELOG nennen. War sie es nicht, ist die Rechnung kaputt.
    //
    // Entstanden beim Umzug der Anspiel-Rechnung nach domain/aim.ts
    // (0.17.0), der genau das nicht tun durfte.
    //
    // Zu 0.19.2 haben sich alle 38 geaendert, und das war gewollt: Das Tempo
    // steht seitdem in Tischlaengen statt auf einer Skala ohne Einheit, und
    // bei zehn Uebungen kam der Drall dazu, den ihre Hinweise schon
    // verlangten.

    // Zu 0.19.3 haben sich sechs geaendert, und das war auch gewollt: die
    // fuenf neuen Schwierigkeiten der Stufe B und die des Safes. Am Aufbau
    // aendert sich dort nichts - nur die Zahl, mit der der Coach die Uebung
    // einem Niveau zuordnet und mit der sie das Rating hebt.
    const erwartet: Record<string, string | undefined> = {
      'builtin-stop-kurz': 'a0bd59ab',
      'builtin-nachlauf-mittel': '9e61cdf5',
      'builtin-rueckzieher-kurz': '051dd281',
      'builtin-schnitt-15': 'c0c8899f',
      'builtin-schnitt-30': '08228277',
      'builtin-mitteltasche-gerade': '96c79fb6',
      'builtin-gerade-nah': '906dccc6',
      'builtin-gerade-mittel': 'b426eb55',
      'builtin-stop-nah': 'c4b546ec',
      'builtin-stop-mittel': 'beea3ada',
      'builtin-nachlauf-20': 'e20b0852',
      'builtin-nachlauf-50': 'b4483107',
      'builtin-rueckzieher-30': '598fc92b',
      'builtin-rueckzieher-55': 'ccbce956',
      'builtin-schnitt-10-rechts': 'e5df0e63',
      'builtin-schnitt-20-rechts': '888145ca',
      'builtin-mitteltasche-weit': '9bc7d26d',
      'builtin-bande-gerade': '7c62cd84',
      'builtin-luecke-breit': 'f71ab4cd',
      'builtin-wachsende-linie': 'cf4c4a54',
      'builtin-stop-lang': '0b1e6a69',
      'builtin-schnitt-45': 'd0bf6f9c',
      'builtin-mitteltasche-schnitt': 'd35dc63a',
      'builtin-bande-lang': '485c73b8',
      'builtin-kombination-zwei': 'fdc0d3c1',
      'builtin-bandenball-fest': '048d5cac',
      'builtin-position-kitchen': 'c1860cc1',
      'builtin-rueckzieher-lang': '880edf07',
      'builtin-schnitt-60': '144fc27c',
      'builtin-schnitt-75': '2a73eed1',
      'builtin-bande-kurz': 'de9d7b5b',
      'builtin-kick-eine-bande': 'fd1c4a53',
      'builtin-karambolage': '39f68d4c',
      'builtin-seiteneffet-links': '49a276d7',
      'builtin-position-eng': 'eed07402',
      'builtin-cluster-oeffnen': '9becf14e',
      'builtin-safe-hinter-ball': 'd2c4e0be',
      'builtin-lange-gerade': '51cfaee6',
    }
    expect(Object.fromEntries(shots.map((s) => [s.id, s.seedStamp]))).toEqual(erwartet)
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

  it('rechnet die Zielzone nur dort aus dem Stoss, wo das stimmt', () => {
    // `cueAfter` legt die Zielzone auf die Stosslinie - vor oder hinter den
    // Geisterball. Das ist nur beim geraden Stoss die Wahrheit: bei einem
    // Schnitt geht der Weisse auf die Tangente, und die zeigt woanders hin.
    // Eine Zone an der falschen Stelle waere schlimmer als keine, denn sie
    // bewertet den Spieler fuer etwas, das gar nicht passieren kann.
    const falsch = SEED_SPECS.filter((spec) => spec.cueAfter && spec.cut !== 0)
    expect(falsch.map((spec) => `${spec.slug}: ${spec.cut} Grad`)).toEqual([])
  })

  it('schickt den Weissen beim Nachlauf nicht in die Tasche', () => {
    // Beim geraden Stoss laeuft der Weisse hinter dem Objektball her - in
    // dieselbe Tasche. Die Zielzone muss deutlich davor liegen, sonst
    // verlangt die Uebung ein Eigenverschulden.
    const zuweit: string[] = []
    for (const spec of SEED_SPECS) {
      if (spec.cueAfter?.along !== 'follow') continue
      const shot = shots.find((s) => s.id === `builtin-${spec.slug}`)!
      const zone = shot.scoring.targetZone!
      const bis = distance({ x: zone.x, y: zone.y }, pocketAim(shot))
      // Ein Ball Platz zwischen Zonenrand und Taschenmuendung.
      if (bis < zone.r + D) zuweit.push(`${spec.slug}: ${bis.toFixed(1)}" bis zur Tasche`)
    }
    expect(zuweit).toEqual([])
  })

  it('legt keine Uebung als Spiegelbild einer anderen an', () => {
    // Ein Schnittball nach links ist derselbe Schnittball, an der
    // Mittellinie gespiegelt: gleiche Stoßart, gleicher Winkel, gleiche
    // Schwierigkeit, gespiegelte Lage. Als eigene Uebung blaeht er die
    // Sammlung auf, ohne etwas Neues zu zeigen - dafuer steht der Satz
    // ANDERE_SEITE im Hinweis.
    //
    // Gesucht wird das Spiegelpaar an den Zahlen, nicht am Namen: zwei
    // Uebungen, deren Objektbaelle und Weisse an y = 25 aufeinander fallen.
    //
    // Die Zielzone stand hier einmal mit im Vergleich, als Ausnahme fuer
    // "Seiteneffet links" und "Seiteneffet rechts": gespiegelte Lage, aber
    // verschiedene Zonen, also angeblich zwei Aufgaben. Die Ausnahme war
    // der Fehler (0.18.3). Wenn zwei Aufbauten gespiegelt sind - das Effet
    // eingeschlossen -, ist auch der Weg des Weissen gespiegelt, und die
    // Zielzone muss es sein. Lagen die beiden Zonen 30,81 Zoll auseinander,
    // konnte hoechstens eine stimmen. Eine abweichende Zone macht aus einem
    // Spiegelpaar keine zweite Uebung, sondern verraet einen Widerspruch.
    const spiegel = (p: Point, q: Point) =>
      Math.abs(p.x - q.x) < 0.01 && Math.abs(p.y - (TABLE.width - q.y)) < 0.01

    const paare: string[] = []
    for (let i = 0; i < shots.length; i++) {
      for (let j = i + 1; j < shots.length; j++) {
        const [a, b] = [shots[i], shots[j]]
        if (a.attributes.cutAngle !== b.attributes.cutAngle) continue
        if (!spiegel(at(firstObject(a)), at(firstObject(b)))) continue
        if (!spiegel(at(cueOf(a)), at(cueOf(b)))) continue
        paare.push(`${a.id} und ${b.id}`)
      }
    }
    expect(paare).toEqual([])
  })

  it('legt dieselbe Uebung nicht zweimal mit anderem Regler an', () => {
    // Der zweite Fall nach dem Spiegelbild: gleicher Objektball, gleiche
    // Tasche, gleicher Schnittwinkel - und der Unterschied steckt nur in
    // einer Schraube, an der man auch am Tisch drehen kann. "Durch die enge
    // Luecke" war "Durch die Luecke" mit zwei Stoerbaellen dichter
    // beieinander (0.18.2); in der Sammlung standen beide nebeneinander und
    // sahen gleich aus.
    //
    // Solche Abstufungen gehoeren in den Hinweis: "Klappt das sicher, stell
    // die Stoerbaelle enger." Dort kosten sie keinen Platz in der Sammlung
    // und niemand muss zwei fast gleiche Diagramme auseinanderhalten.
    //
    // Der Abstand des Weissen zaehlt ausdruecklich nicht als Unterschied -
    // er ist die Schraube selbst.
    //
    // Was dagegen zaehlt: wie viele Baelle auf dem Tisch liegen und welche
    // Zielzone gilt. "Stop-Shot kurz" und "Durch die Luecke" haben denselben
    // Objektball auf dem Fusspunkt und dieselbe Tasche, sind aber zwei
    // Uebungen - der eine hat zwei Stoerbaelle im Weg, der andere eine Zone,
    // in der der Weisse liegen bleiben soll. Ohne diese zwei Bedingungen
    // wuerde der Test sie faelschlich anklagen.
    const zoneGleich = (a: Shot, b: Shot) => {
      const [za, zb] = [a.scoring.targetZone, b.scoring.targetZone]
      if (!za || !zb) return za === zb
      return distance(za, zb) < 0.01 && za.r === zb.r
    }

    const paare: string[] = []
    for (let i = 0; i < shots.length; i++) {
      for (let j = i + 1; j < shots.length; j++) {
        const [a, b] = [shots[i], shots[j]]
        if (a.target.pocketId !== b.target.pocketId) continue
        if (a.attributes.cutAngle !== b.attributes.cutAngle) continue
        if (a.balls.length !== b.balls.length) continue
        if (distance(at(firstObject(a)), at(firstObject(b))) > 0.01) continue
        if (!zoneGleich(a, b)) continue
        paare.push(`${a.id} und ${b.id}`)
      }
    }
    expect(paare).toEqual([])
  })

  it('erinnert bei jedem Schnittball an die andere Seite', () => {
    // Der Satz ersetzt vier Uebungen (0.18.1). Faellt er bei einer weg,
    // fehlt dem Spieler dort die halbe Uebung.
    const ohne = shots.filter(
      (s) => /^Schnittball \d+ Grad$/.test(s.name) && !s.coachNotes.includes(ANDERE_SEITE),
    )
    expect(ohne.map((s) => s.id)).toEqual([])
    // Sieben Schnittbaelle und "Seiteneffet ueber die Bande", das seit
    // 0.18.3 fuer sein zurueckgezogenes Spiegelbild mitsteht.
    expect(shots.filter((s) => s.coachNotes.includes(ANDERE_SEITE)).map((s) => s.id)).toHaveLength(
      8,
    )
  })

  it('liefert keine Uebung, die zurueckgezogen wurde', () => {
    // Sonst kaeme sie beim Einspielen wieder herein, waehrend die Migration
    // sie wegraeumt - und der Nutzer saehe sie bei jedem Start einmal
    // aufblitzen.
    const doppelt = Object.keys(RETIRED_IDS).filter((id) => shots.some((s) => s.id === id))
    expect(doppelt).toEqual([])
  })

  it('laesst den Weissen durch jede Luecke passen', () => {
    // Zwei Stoerbaelle als Tor: zwischen ihren Kanten muss mehr als ein
    // Ball Platz sein, sonst ist die Uebung nicht zu spielen. Knapp darf
    // es sein - darum geht es -, aber nicht unmoeglich.
    let geprueft = 0
    for (const shot of shots) {
      const tor = shot.balls.filter((b) => b.id.startsWith('gate-'))
      if (tor.length === 0) continue
      expect(tor, `${shot.id}: ein Tor hat zwei Pfosten`).toHaveLength(2)
      geprueft += 1
      const luecke = distance(at(tor[0]), at(tor[1])) - D
      expect(luecke, `${shot.id}: Luecke nur ${luecke.toFixed(2)}" breit`).toBeGreaterThan(D)
    }
    expect(geprueft, 'keine Uebung mit Tor').toBeGreaterThan(0)
  })

  it('gibt zu keiner mitgelieferten Uebung einen Machbarkeitshinweis', () => {
    // Die Gegenprobe mit der Pruefung aus dem Baukasten (0.16.0) - eine
    // zweite, unabhaengige Rechnung ueber dieselben Aufbauten. Was sie hier
    // meldet, ist entweder eine unspielbare Uebung oder eine Pruefung, die
    // zu schnell warnt. Beides muss auffallen, bevor es ausgeliefert wird.
    const auffaellig = shots
      .map((s) => ({ id: s.id, texte: feasibilityHints(s).map((h) => h.text) }))
      .filter((e) => e.texte.length > 0)
    expect(auffaellig).toEqual([])
  })

  it('nennt genau die Uebungen, die nach einer Einspielung dazugekommen sind', () => {
    // Danach entscheidet bootstrap.ts, ob eine fehlende Uebung neu oder
    // geloescht ist.
    expect(seedIdsSince(SEED_VERSION).size).toBe(0)
    expect(seedIdsSince(0).size).toBe(shots.length)
    const neuMitDrei = seedIdsSince(2)
    expect(neuMitDrei.size).toBe(14)
    expect([...neuMitDrei].every((id) => shots.some((s) => s.id === id))).toBe(true)
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
