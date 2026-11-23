import { describe, expect, it } from 'vitest'
import {
  MAX_POINTS,
  attemptPoints,
  buildAttempt,
  effectiveMode,
  isScorable,
  pocketRate,
  positionPoints,
  proficiencyFor,
  scratchRate,
  sessionScore,
} from './scoring'
import { createShot } from './shot'
import { DEFAULT_THRESHOLDS } from './types'
import type { Attempt, Shot, ShotScoring } from './types'

/** Ein Stoss aus nur dem Weissen - der gerade Stoss ohne Ball zum Einlochen. */
function nurWeisser(partial: Partial<Shot> = {}): Shot {
  const basis = createShot()
  return { ...basis, balls: basis.balls.filter((b) => b.kind === 'cue'), ...partial }
}

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

describe('Bewertbarkeit', () => {
  it('nimmt einen Stoss mit Objektball an - auch ohne Zielzone', () => {
    const s = createShot()
    expect(isScorable({ ...s, scoring: { ...s.scoring, targetZone: null } })).toBe(true)
  })

  it('nimmt einen Stoss ohne Objektball an, solange eine Zielzone da ist', () => {
    expect(isScorable(nurWeisser())).toBe(true)
  })

  it('lehnt einen Stoss ohne Objektball und ohne Zielzone ab', () => {
    // Ohne beides gaebe es fuer jeden Versuch dieselbe Punktzahl, gleich was
    // am Tisch passiert - und die stuende hinterher im Profil des Spielers.
    const s = nurWeisser()
    expect(isScorable({ ...s, scoring: { ...s.scoring, targetZone: null } })).toBe(false)
  })
})

describe('Uebung ohne Objektball', () => {
  it('zaehlt einen erfassten Versuch nicht als Treffer', () => {
    // Der Trainer meldet pocketed: false, wenn nichts einzulochen war. Die
    // Punkte kommen trotzdem aus der Lage - nur die Trefferquote bleibt bei
    // null, statt jeden erfassten Versuch als Treffer zu zaehlen.
    const s = nurWeisser()
    const mitte = s.scoring.targetZone!
    const versuch = buildAttempt(s, 0, {
      pocketed: false,
      scratch: false,
      cueBallEnd: { x: mitte.x, y: mitte.y },
    })
    expect(versuch.points).toBe(MAX_POINTS)
    expect(pocketRate([versuch])).toBe(0)
  })

  // Der gerade Stoss, bei dem nur der Weisse laeuft und zurueckkommen soll:
  // Es gibt nichts einzulochen, also darf die Wertung nicht daran haengen.
  const ohneBall = false

  it('wertet allein die Lage des Weissen', () => {
    const s = scoring({ mode: 'position' })
    expect(attemptPoints(s, { pocketed: false, scratch: false, cueBallEnd: { x: 50, y: 25 } }, ohneBall)).toBe(10)
    expect(attemptPoints(s, { pocketed: false, scratch: false, cueBallEnd: { x: 57, y: 25 } }, ohneBall)).toBe(8)
    expect(attemptPoints(s, { pocketed: false, scratch: false, cueBallEnd: { x: 90, y: 25 } }, ohneBall)).toBe(0)
  })

  it('zaehlt den Kratzer weiterhin als Fehlversuch', () => {
    const s = scoring({ mode: 'position' })
    expect(attemptPoints(s, { pocketed: false, scratch: true, cueBallEnd: { x: 50, y: 25 } }, ohneBall)).toBe(0)
  })

  it('wertet auch die anderen Arten ueber die Lage', () => {
    // Wer die Art nicht umstellt, soll trotzdem Punkte bekommen koennen:
    // einzulochen gibt es so oder so nichts.
    for (const mode of ['pocket+position', 'position'] as const) {
      expect(effectiveMode(scoring({ mode }), ohneBall)).toBe('position')
      expect(
        attemptPoints(scoring({ mode }), { pocketed: false, scratch: false, cueBallEnd: { x: 50, y: 25 } }, ohneBall),
      ).toBe(10)
    }
  })

  it('bleibt ohne Zielzone beim Einlochen - dort ist nichts zu messen', () => {
    const s = scoring({ mode: 'position', targetZone: null })
    expect(effectiveMode(s, ohneBall)).toBe('pocket')
  })

  it('aendert nichts an Uebungen mit Objektball', () => {
    const s = scoring({ mode: 'position' })
    expect(attemptPoints(s, { pocketed: false, scratch: false, cueBallEnd: { x: 50, y: 25 } })).toBe(0)
    expect(attemptPoints(s, { pocketed: true, scratch: false, cueBallEnd: { x: 50, y: 25 } })).toBe(10)
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
