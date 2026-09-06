import { describe, expect, it } from 'vitest'
import {
  MAX_POINTS,
  attemptPoints,
  effectiveMode,
  pocketRate,
  positionPoints,
  proficiencyFor,
  scratchRate,
  sessionScore,
} from './scoring'
import { DEFAULT_THRESHOLDS } from './types'
import type { Attempt, ShotScoring } from './types'

const zone = { x: 50, y: 25, r: 5 }

function scoring(partial: Partial<ShotScoring> = {}): ShotScoring {
  return {
    mode: 'pocket+position',
    targetZone: zone,
    thresholds: { ...DEFAULT_THRESHOLDS },
    ...partial,
  }
}

function attempt(index: number, points: number): Attempt {
  return { index, pocketed: points > 0, scratch: false, cueBallEnd: null, points }
}

describe('Positionspunkte', () => {
  it('gibt die volle Punktzahl innerhalb des Rings', () => {
    expect(positionPoints({ x: 52, y: 26 }, zone)).toBe(5)
  })

  it('faellt mit dem Abstand ab', () => {
    expect(positionPoints({ x: 57, y: 25 }, zone)).toBe(4)
    expect(positionPoints({ x: 59, y: 25 }, zone)).toBe(3)
    expect(positionPoints({ x: 64, y: 25 }, zone)).toBe(2)
    expect(positionPoints({ x: 69, y: 25 }, zone)).toBe(1)
    expect(positionPoints({ x: 90, y: 25 }, zone)).toBe(0)
  })

  it('gibt ohne Zone oder ohne erfasste Position nichts', () => {
    expect(positionPoints(null, zone)).toBe(0)
    expect(positionPoints({ x: 50, y: 25 }, null)).toBe(0)
    expect(positionPoints({ x: 50, y: 25 }, { ...zone, r: 0 })).toBe(0)
  })
})

describe('Versuchsbewertung', () => {
  it('wertet einen Kratzer immer mit null', () => {
    expect(attemptPoints(scoring(), { pocketed: true, scratch: true, cueBallEnd: { x: 50, y: 25 } })).toBe(0)
  })

  it('gibt beim reinen Einlochen alles oder nichts', () => {
    const s = scoring({ mode: 'pocket' })
    expect(attemptPoints(s, { pocketed: true, scratch: false, cueBallEnd: null })).toBe(MAX_POINTS)
    expect(attemptPoints(s, { pocketed: false, scratch: false, cueBallEnd: null })).toBe(0)
  })

  it('teilt bei Einlochen und Position je zur Haelfte', () => {
    const s = scoring()
    expect(attemptPoints(s, { pocketed: true, scratch: false, cueBallEnd: { x: 50, y: 25 } })).toBe(10)
    expect(attemptPoints(s, { pocketed: true, scratch: false, cueBallEnd: { x: 90, y: 25 } })).toBe(5)
    expect(attemptPoints(s, { pocketed: false, scratch: false, cueBallEnd: { x: 50, y: 25 } })).toBe(0)
  })

  it('verdoppelt die Positionspunkte, wenn nur die Position zaehlt', () => {
    const s = scoring({ mode: 'position' })
    expect(attemptPoints(s, { pocketed: true, scratch: false, cueBallEnd: { x: 50, y: 25 } })).toBe(10)
    expect(attemptPoints(s, { pocketed: true, scratch: false, cueBallEnd: { x: 57, y: 25 } })).toBe(8)
  })

  it('faellt ohne Zielzone auf reines Einlochen zurueck', () => {
    const s = scoring({ mode: 'pocket+position', targetZone: null })
    expect(effectiveMode(s)).toBe('pocket')
    expect(attemptPoints(s, { pocketed: true, scratch: false, cueBallEnd: null })).toBe(MAX_POINTS)
  })
})

describe('Sessionergebnis', () => {
  it('rechnet in Prozent der moeglichen Punkte', () => {
    expect(sessionScore([attempt(0, 10), attempt(1, 0)], 2)).toBe(50)
    expect(sessionScore([attempt(0, 5)], 2)).toBe(25)
  })

  it('rechnet gegen die geplante Anzahl, auch bei Abbruch', () => {
    expect(sessionScore([attempt(0, 10)], 10)).toBe(10)
  })

  it('liefert bei null Versuchen null', () => {
    expect(sessionScore([], 0)).toBe(0)
  })

  it('stuft Ergebnisse an den Schwellen ein', () => {
    expect(proficiencyFor(0)).toBe('beginning')
    expect(proficiencyFor(39.9)).toBe('beginning')
    expect(proficiencyFor(40)).toBe('developing')
    expect(proficiencyFor(60)).toBe('proficient')
    expect(proficiencyFor(80)).toBe('advanced')
    expect(proficiencyFor(90)).toBe('exemplary')
  })

  it('beachtet eigene Schwellen des Stosses', () => {
    const strict = { developing: 60, proficient: 75, advanced: 90, exemplary: 98 }
    expect(proficiencyFor(80, strict)).toBe('proficient')
  })
})

describe('Quoten', () => {
  const results: Attempt[] = [
    { index: 0, pocketed: true, scratch: false, cueBallEnd: null, points: 10 },
    { index: 1, pocketed: false, scratch: false, cueBallEnd: null, points: 0 },
    { index: 2, pocketed: true, scratch: true, cueBallEnd: null, points: 0 },
    { index: 3, pocketed: true, scratch: false, cueBallEnd: null, points: 10 },
  ]

  it('zaehlt einen Kratzer nicht als Treffer', () => {
    expect(pocketRate(results)).toBe(50)
  })

  it('meldet die Kratzerquote', () => {
    expect(scratchRate(results)).toBe(25)
  })

  it('liefert ohne Versuche null', () => {
    expect(pocketRate([])).toBe(0)
    expect(scratchRate([])).toBe(0)
  })
})
