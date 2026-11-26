/**
 * Der Reihen-Generator.
 *
 * Die eine Zusage, auf der alles steht: Steht "30 Grad" im Namen, dann ist
 * es ein 30-Grad-Schnitt - nicht 28 und nicht 31. Darum wird rueckwaerts
 * gerechnet, und darum prueft dieser Test die fertigen Uebungen mit
 * computeCutAngle nach, also mit der Rechnung, die auch die Oberflaeche
 * anzeigt. Zwei getrennte Wege zum selben Wert; stimmen sie ueberein, war
 * es keine Zirkelrechnung.
 */

import { describe, expect, it } from 'vitest'
import { feasibilityHints } from './feasibility'
import {
  MAX_SERIES_STEPS,
  buildSeries,
  currentAim,
  seriesProblem,
  seriesValues,
} from './series'
import type { SeriesSpec } from './series'
import { computeCutAngle, createShot } from './shot'
import { seedShotById } from '@/data/seed/drills'
import type { Shot } from './types'

/** Eine mitgelieferte Uebung, deren Werte im Quelltext stehen: 30 Grad. */
function basis(): Shot {
  const shot = seedShotById('builtin-schnitt-30')
  if (!shot) throw new Error('builtin-schnitt-30 fehlt')
  return shot
}

function spec(patch: Partial<SeriesSpec> = {}): SeriesSpec {
  return {
    axis: 'cutAngle',
    from: 10,
    to: 60,
    steps: 6,
    difficultyFrom: 2,
    difficultyTo: 7,
    ...patch,
  }
}

describe('currentAim', () => {
  it('liest den Aufbau so, wie er im Quelltext steht', () => {
    // builtin-schnitt-30 ist mit cut 30 und dist 28 beschrieben. Was hier
    // herauskommt, muss genau das sein - sonst faengt jede Reihe an der
    // falschen Stelle an.
    const stand = currentAim(basis())
    expect(stand?.cutDeg).toBeCloseTo(30, 6)
    expect(stand?.dist).toBeCloseTo(28, 6)
  })

  it('gibt nichts her, wenn der Objektball fehlt', () => {
    const ohne = { ...createShot(), balls: createShot().balls.filter((b) => b.kind === 'cue') }
    expect(currentAim(ohne)).toBeNull()
  })
})

describe('seriesValues', () => {
  it('verteilt die Werte gleichmaessig auf die Enden', () => {
    expect(seriesValues(spec({ from: 10, to: 60, steps: 6 }))).toEqual([10, 20, 30, 40, 50, 60])
  })

  it('nimmt bei einem Schritt den Anfang, nicht die Mitte', () => {
    // Wer "von 10 bis 60 in einem Schritt" sagt, meint den Anfang.
    expect(seriesValues(spec({ from: 10, to: 60, steps: 1 }))).toEqual([10])
  })

  it('kommt auch rueckwaerts zurecht', () => {
    expect(seriesValues(spec({ from: 60, to: 10, steps: 3 }))).toEqual([60, 35, 10])
  })
})

describe('buildSeries', () => {
  it('trifft jeden angesagten Schnittwinkel genau', () => {
    const reihe = buildSeries(basis(), spec())
    expect(reihe.map((s) => Math.round(computeCutAngle(s)))).toEqual([10, 20, 30, 40, 50, 60])
  })

  it('schreibt den Wert in den Namen', () => {
    const reihe = buildSeries(basis(), spec({ from: 10, to: 30, steps: 3 }))
    expect(reihe.map((s) => s.name)).toEqual([
      'Schnittball 30 Grad (10°)',
      'Schnittball 30 Grad (20°)',
      'Schnittball 30 Grad (30°)',
    ])
  })

  it('verteilt die Schwierigkeit ueber die Reihe', () => {
    const reihe = buildSeries(basis(), spec({ difficultyFrom: 2, difficultyTo: 7 }))
    expect(reihe.map((s) => s.attributes.difficulty)).toEqual([2, 3, 4, 5, 6, 7])
  })

  it('laesst die Schwierigkeit stehen, wenn beide Enden gleich sind', () => {
    // Der Vorgabewert des Dialogs: eine Reihe muss nicht schwerer werden,
    // und geraten wird das nicht.
    const reihe = buildSeries(basis(), spec({ difficultyFrom: 4, difficultyTo: 4 }))
    expect(new Set(reihe.map((s) => s.attributes.difficulty))).toEqual(new Set([4]))
  })

  it('verschiebt nur den Weissen und laesst den Rest in Ruhe', () => {
    const original = basis()
    const eine = buildSeries(original, spec({ from: 55, to: 55, steps: 1 }))[0]
    const objektVorher = original.balls.find((b) => b.kind === 'object')
    const objektNachher = eine.balls.find((b) => b.kind === 'object')
    expect([objektNachher?.x, objektNachher?.y]).toEqual([objektVorher?.x, objektVorher?.y])
    expect(eine.target).toEqual(original.target)
    expect(eine.scoring).toEqual(original.scoring)
  })

  it('gibt jeder Uebung eigene Kennungen und nimmt den Stand der Vorlage weg', () => {
    // Die Reihe stammt nicht von der mitgelieferten Vorlage ab; traegt sie
    // deren Stand weiter, behauptet sie eine Herkunft, die sie nicht hat.
    const reihe = buildSeries(basis(), spec({ steps: 3 }))
    expect(new Set(reihe.map((s) => s.id)).size).toBe(3)
    expect(reihe.every((s) => s.seedStamp === undefined)).toBe(true)
    expect(reihe.every((s) => s.builtIn === false)).toBe(true)
  })

  it('gibt die Lernstufe nicht weiter', () => {
    // Die Vorlage steht in Stufe A. Ein 60-Grad-Schnitt daraus ist in der
    // Sammlung ein duenner Schnitt und damit Stufe C - die Reihe veraendert
    // genau das, was ueber die Stufe entscheidet. Eine geerbte Stufe waere
    // hier dasselbe wie eine geratene.
    expect(basis().level).toBe('A')
    expect(buildSeries(basis(), spec()).every((s) => s.level === undefined)).toBe(true)
  })

  it('haelt den Weissen auch bei einer langen Reihe auf dem Tisch', () => {
    // Reicht der Abstand ueber die Bande hinaus, wird die Strecke gekuerzt.
    // Danach stimmt der Winkel weiter - nur die Entfernung ist kleiner.
    const reihe = buildSeries(basis(), spec({ axis: 'distance', from: 5, to: 90, steps: MAX_SERIES_STEPS }))
    for (const s of reihe) {
      const cue = s.balls.find((b) => b.kind === 'cue')
      expect(cue!.x).toBeGreaterThanOrEqual(0)
      expect(cue!.x).toBeLessThanOrEqual(100)
      expect(cue!.y).toBeGreaterThanOrEqual(0)
      expect(cue!.y).toBeLessThanOrEqual(50)
    }
  })

  it('baut aus einer spielbaren Uebung eine spielbare Reihe', () => {
    // Die Probe aufs Exempel: der Generator soll Arbeit sparen, nicht
    // Aufraeumarbeit schaffen. 10 bis 60 Grad um eine mitgelieferte Uebung
    // herum darf keinen einzigen Machbarkeitshinweis ergeben.
    const auffaellig = buildSeries(basis(), spec())
      .map((s) => ({ name: s.name, hinweise: feasibilityHints(s).map((h) => h.text) }))
      .filter((e) => e.hinweise.length > 0)
    expect(auffaellig).toEqual([])
  })
})

describe('Wann es keine Reihe gibt', () => {
  it('nennt den eigenen Weg des Weissen als Grund', () => {
    // Ein Kick: der gezeichnete Weg wandert nicht mit, wenn der Weisse sich
    // bewegt. Lieber ein klarer Grund als zehn Uebungen mit falschem Weg.
    const kick = seedShotById('builtin-kick-eine-bande')
    expect(seriesProblem(kick!)).toBe('cuePath')
    expect(buildSeries(kick!, spec())).toEqual([])
  })

  it('nennt den fehlenden Objektball', () => {
    const ohne = { ...createShot(), balls: createShot().balls.filter((b) => b.kind === 'cue') }
    expect(seriesProblem(ohne)).toBe('noObject')
  })

  it('nennt die fehlende Zieltasche', () => {
    const ohne: Shot = { ...createShot(), paths: [], target: { pocketId: null, cheat: 0 } }
    expect(seriesProblem(ohne)).toBe('noAim')
  })

  it('laesst den geraden Stoss zu', () => {
    expect(seriesProblem(basis())).toBeNull()
  })
})
