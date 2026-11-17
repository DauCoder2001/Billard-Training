import { describe, expect, it } from 'vitest'
import { evaluateAchievements } from './achievements'
import type { Attempt, Player, Session, Shot } from './types'

/**
 * Zeitpunkt in der Zeitzone des Rechners.
 *
 * Erfolge zaehlen nach dem Kalender des Nutzers, deshalb sind die Pruefzeiten
 * ortszeitlich gebaut - der Test gilt damit in jeder Zone. Den Unterschied
 * zwischen Ortszeit und Weltzeit deckt er nur dort auf, wo beide
 * auseinanderliegen; in UTC selbst laeuft er richtig, aber stumpf.
 */
function ortszeit(jahr: number, monat: number, tag: number, stunde: number, minute = 0): number {
  return new Date(jahr, monat - 1, tag, stunde, minute).getTime()
}

let laufendeNummer = 0

function einheit(finishedAt: number | null, results: Attempt[] = []): Session {
  laufendeNummer += 1
  return {
    id: `s${laufendeNummer}`,
    shotId: 'x',
    playerId: 'p1',
    format: 'quick',
    attempts: 10,
    results,
    score: 50,
    proficiency: 'developing',
    startedAt: finishedAt ?? 0,
    finishedAt,
  }
}

function versuche(n: number): Attempt[] {
  return Array.from({ length: n }, (_, i) => ({
    index: i,
    pocketed: true,
    scratch: false,
    cueBallEnd: null,
    points: 10,
  }))
}

const spieler: Player = {
  id: 'p1',
  name: 'Test',
  color: '#fff',
  skillRatings: {},
  achievements: [],
  createdAt: 0,
}

function fortschritt(id: string, sessions: Session[], shots: Shot[] = []): number {
  const stand = evaluateAchievements({ sessions, shots, player: spieler }).find(
    (s) => s.achievement.id === id,
  )
  if (!stand) throw new Error(`Erfolg ${id} gibt es nicht`)
  return stand.progress
}

describe('Erfolge', () => {
  it('zaehlt nur abgeschlossene Einheiten', () => {
    expect(fortschritt('first-session', [einheit(null)])).toBe(0)
    expect(fortschritt('first-session', [einheit(ortszeit(2026, 11, 17, 12))])).toBe(1)
  })

  it('erkennt drei aufeinanderfolgende Tage', () => {
    const sessions = [16, 17, 18].map((tag) => einheit(ortszeit(2026, 11, tag, 20)))
    expect(fortschritt('streak-3', sessions)).toBe(1)
  })

  it('unterbricht die Reihe bei einem ausgelassenen Tag', () => {
    const sessions = [16, 18, 19].map((tag) => einheit(ortszeit(2026, 11, tag, 20)))
    expect(fortschritt('streak-3', sessions)).toBeCloseTo(2 / 3, 6)
  })

  it('zaehlt ueber Mitternacht zwei Kalendertage', () => {
    // 23:30 und 00:30 sind zwei Tage im Kalender des Nutzers. Oestlich von
    // Greenwich faellt beides auf denselben UTC-Tag - dann waere es einer.
    const sessions = [
      einheit(ortszeit(2026, 11, 16, 23, 30)),
      einheit(ortszeit(2026, 11, 17, 0, 30)),
    ]
    expect(fortschritt('streak-3', sessions)).toBeCloseTo(2 / 3, 6)
  })

  it('rechnet die Versuche je Kalendertag zusammen', () => {
    // Spaet am Abend und kurz nach Mitternacht: zwei Tage mit je 60
    // Versuchen, nicht ein Tag mit 120.
    const sessions = [
      einheit(ortszeit(2026, 11, 16, 22), versuche(60)),
      einheit(ortszeit(2026, 11, 17, 0, 30), versuche(60)),
    ]
    expect(fortschritt('marathon', sessions)).toBeCloseTo(0.6, 6)
  })
})
