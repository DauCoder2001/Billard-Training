/**
 * Pruefungen am Inhalt einer eingelesenen Sicherung.
 *
 * Reine Funktionen ueber den Inhalt der Datei - ohne IndexedDB, denn geprueft
 * wird, bevor irgendetwas geschrieben wird. Genau darauf kommt es an: was hier
 * durchginge, stuende hinterher dauerhaft in der Datenbank.
 */

import { describe, expect, it } from 'vitest'
import {
  restorePlayers,
  restoreSessions,
  restoreSettings,
  restoreShots,
  restoreWorkouts,
} from './restore'
import { PLAYER_COLORS } from './players'
import { DEFAULT_SETTINGS } from './settings'

describe('restoreShots', () => {
  it('laesst einen Stoss ohne Id weg', () => {
    // Eine erfundene Id passt zu keiner Einheit und zu keinem Workout mehr.
    expect(restoreShots([{ name: 'Ohne Id' }, 42, null])).toEqual([])
  })

  it('setzt einen beschaedigten Aufbau auf den Standard und behaelt die Id', () => {
    const [shot] = restoreShots([
      { id: 'a', name: 'Kaputt', balls: 'keine Liste', favorite: true, createdAt: 5, updatedAt: 7 },
    ])
    expect(shot.id).toBe('a')
    expect(shot.name).toBe('Kaputt')
    expect(shot.favorite).toBe(true)
    expect(shot.createdAt).toBe(5)
    expect(shot.updatedAt).toBe(7)
    // Ein Stoss ohne Baelle liesse sich nicht zeichnen und nicht ueben.
    expect(shot.balls.length).toBeGreaterThan(0)
    for (const ball of shot.balls) {
      expect(Number.isFinite(ball.x)).toBe(true)
      expect(Number.isFinite(ball.y)).toBe(true)
    }
  })
})

describe('restorePlayers', () => {
  it('nimmt nur bekannte Faehigkeiten mit einer echten Zahl', () => {
    const [player] = restorePlayers([
      {
        id: 'p1',
        name: 'Anna',
        skillRatings: { draw: 42, erfunden: 99, cut: 'viel', bank: 300 },
      },
    ])
    expect(player.skillRatings).toEqual({ draw: 42, bank: 100 })
  })

  it('ersetzt eine Farbe, die keine ist', () => {
    const [player] = restorePlayers([{ id: 'p1', color: 'rot; background: url(x)' }])
    expect(player.color).toBe(PLAYER_COLORS[0])
    expect(player.name).toBe('Spieler 1')
  })
})

describe('restoreSessions', () => {
  it('laesst eine Einheit ohne Stoss oder Spieler weg', () => {
    expect(restoreSessions([{ id: 's1', shotId: 'a' }, { id: 's2', playerId: 'p1' }])).toEqual([])
  })

  it('macht aus unlesbaren Versuchen eine leere Liste', () => {
    const [session] = restoreSessions([
      { id: 's1', shotId: 'a', playerId: 'p1', results: 'keine Liste', score: 9000 },
    ])
    expect(session.results).toEqual([])
    expect(session.score).toBe(100)
    expect(session.finishedAt).toBeNull()
  })

  it('begrenzt die Punkte eines Versuchs und haelt den Weissen auf dem Tisch', () => {
    const [session] = restoreSessions([
      {
        id: 's1',
        shotId: 'a',
        playerId: 'p1',
        results: [{ points: 1000, pocketed: 'ja', cueBallEnd: { x: 1e9, y: null } }],
      },
    ])
    expect(session.results[0].points).toBe(10)
    expect(session.results[0].pocketed).toBe(false)
    expect(session.results[0].cueBallEnd).toEqual({ x: 100, y: 25 })
  })
})

describe('restoreWorkouts', () => {
  it('laesst Eintraege ohne Stoss weg und begrenzt die Versuche', () => {
    const [workout] = restoreWorkouts([
      {
        id: 'w1',
        entries: [{ shotId: 'a', attempts: 5000 }, { attempts: 10 }, 'kaputt'],
      },
    ])
    expect(workout.entries).toEqual([{ shotId: 'a', attempts: 200 }])
    expect(workout.name).toBe('Workout')
  })
})

describe('restoreSettings', () => {
  it('faellt bei unlesbaren Werten auf den Standard zurueck', () => {
    const settings = restoreSettings({
      snapStep: 'drei',
      orientation: 'schräg',
      clothColor: 'rot',
      defaultThresholds: { developing: 'x' },
      activePlayerId: 17,
    })
    expect(settings.snapStep).toBe(DEFAULT_SETTINGS.snapStep)
    expect(settings.orientation).toBe(DEFAULT_SETTINGS.orientation)
    expect(settings.clothColor).toBe(DEFAULT_SETTINGS.clothColor)
    expect(settings.defaultThresholds).toEqual(DEFAULT_SETTINGS.defaultThresholds)
    expect(settings.activePlayerId).toBeNull()
    expect(settings.id).toBe('settings')
  })

  it('behaelt gueltige Werte', () => {
    const settings = restoreSettings({
      snapStep: 6.25,
      orientation: 'portrait',
      clothColor: '#1f6b52',
      seededVersion: 2,
    })
    expect(settings.snapStep).toBe(6.25)
    expect(settings.orientation).toBe('portrait')
    expect(settings.clothColor).toBe('#1f6b52')
    expect(settings.seededVersion).toBe(2)
  })
})
