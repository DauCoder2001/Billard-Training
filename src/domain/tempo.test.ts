/**
 * Das Tempo in Tischlaengen.
 *
 * Geprueft wird vor allem die Ueberfuehrung alter Werte: Sie laeuft einmal
 * ueber jedes Geraet und fasst auch selbstgebaute Uebungen an. Was sie
 * falsch macht, macht sie unwiederbringlich falsch.
 */

import { describe, expect, it } from 'vitest'
import {
  SPEED_MAX,
  SPEED_MIN,
  SPEED_STEP,
  speedFromLegacy,
  speedLabel,
  speedName,
  speedNumber,
} from './tempo'

describe('Die Zahl in Texten', () => {
  it('schreibt das Komma deutsch', () => {
    expect(speedNumber(2.5)).toBe('2,5')
    expect(speedNumber(2)).toBe('2')
  })

  it('zeigt das Viertel, statt es wegzurunden', () => {
    // Mit einer Nachkommastelle stand auf der Uebungsseite "2,3
    // Tischlaengen" - ein Wert, den der Schieber nicht annimmt.
    expect(speedNumber(2.25)).toBe('2,25')
    expect(speedLabel(4.75)).toBe('4,75 Tischlängen')
  })

  it('setzt den Singular nur bei genau einer Laenge', () => {
    expect(speedLabel(1)).toBe('eine Tischlänge')
    expect(speedLabel(0.5)).toBe('0,5 Tischlängen')
    expect(speedLabel(2)).toBe('2 Tischlängen')
  })

  it('nennt den Stoss beim Namen', () => {
    expect(speedName(0.5)).toBe('Touch')
    expect(speedName(1)).toBe('sanft')
    expect(speedName(2)).toBe('mittel')
    expect(speedName(3)).toBe('fest')
    expect(speedName(4)).toBe('hart')
  })

  it('gibt einem Zwischenwert den Namen der naechsten ganzen Laenge', () => {
    // 1,75 liegt naeher an zwei als an eins, 2,75 naeher an drei als an
    // zwei. Mit Grenzen bei 1,75 und 2,75 hiess 1,75 noch "sanft".
    expect(speedName(1.75)).toBe('mittel')
    expect(speedName(2.75)).toBe('fest')
    expect(speedName(3.75)).toBe('hart')
    // Genau auf der Mitte gewinnt der sanftere Name.
    expect(speedName(1.5)).toBe('sanft')
    expect(speedName(2.5)).toBe('mittel')
    expect(speedName(3.5)).toBe('fest')
  })
})

describe('Alte Tempowerte ueberfuehren', () => {
  it('bleibt in den Grenzen der Skala', () => {
    for (let alt = 1; alt <= 10; alt += 1) {
      const neu = speedFromLegacy(alt)
      expect(neu).toBeGreaterThanOrEqual(SPEED_MIN)
      expect(neu).toBeLessThanOrEqual(SPEED_MAX)
    }
  })

  it('trifft nur Viertelschritte', () => {
    for (let alt = 1; alt <= 10; alt += 1) {
      const neu = speedFromLegacy(alt)
      expect(Math.round(neu / SPEED_STEP) * SPEED_STEP).toBeCloseTo(neu, 10)
    }
  })

  it('bleibt monoton: wer mehr angab, bekommt nicht weniger', () => {
    for (let alt = 1; alt < 10; alt += 1) {
      expect(speedFromLegacy(alt + 1)).toBeGreaterThanOrEqual(speedFromLegacy(alt))
    }
  })

  it('rechnet die Mitte der alten Skala auf gut drei Laengen', () => {
    // Alt 5 bedeutete nach der bisher angenommenen Formel 2,75 m/s, und
    // 2,75 m/s tragen den Weissen gemessen 3,3 Tischlaengen weit.
    expect(speedFromLegacy(5)).toBe(3.25)
  })

  it('ist am Wert nicht zu erkennen, ob schon ueberfuehrt wurde', () => {
    // Der Grund, warum die Migration an einem Versionszaehler haengt und
    // nicht an einer Pruefung des Werts: 2 bleibt 2. Zwei Tischlaengen sind
    // 1,40 m/s, und das war nach der alten Formel genau Tempo 2. Wer am
    // Wert erkennen wollte, ob schon gerechnet wurde, laege hier falsch -
    // und ein zweiter Lauf machte aus 4 erst 3 und dann 2,5.
    expect(speedFromLegacy(2)).toBe(2)
    expect(speedFromLegacy(speedFromLegacy(4))).not.toBe(speedFromLegacy(4))
  })
})
