import { describe, expect, it } from 'vitest'
import { recommend, sessionsPerSkill, statsByShot } from './coach'
import { createShot } from './shot'
import { applySessionToRatings, overallRating, ratingTarget, updateRating, weakestSkills } from './skills'
import type { Player, Session, Shot, SkillTag } from './types'

const DAY = 24 * 60 * 60 * 1000
const NOW = 1_700_000_000_000

function shot(id: string, skills: SkillTag[], difficulty = 5): Shot {
  const base = createShot()
  return {
    ...base,
    id,
    name: id,
    attributes: { ...base.attributes, skills, difficulty },
  }
}

function session(shotId: string, score: number, daysAgo: number, id = `${shotId}-${daysAgo}`): Session {
  return {
    id,
    shotId,
    playerId: 'p1',
    format: 'quick',
    attempts: 10,
    results: [],
    score,
    proficiency: 'developing',
    startedAt: NOW - daysAgo * DAY,
    finishedAt: NOW - daysAgo * DAY,
  }
}

function player(ratings: Partial<Record<SkillTag, number>> = {}): Player {
  return { id: 'p1', name: 'Test', color: '#fff', skillRatings: ratings, achievements: [], createdAt: 0 }
}

describe('Kennzahlen je Stoss', () => {
  it('verdichtet mehrere Sessions', () => {
    const stats = statsByShot([session('a', 40, 5), session('a', 80, 1), session('b', 60, 2)])
    expect(stats.get('a')).toMatchObject({ sessions: 2, lastScore: 80, bestScore: 80, avgScore: 60 })
    expect(stats.get('b')?.sessions).toBe(1)
  })

  it('ignoriert unfertige Sessions', () => {
    const open: Session = { ...session('a', 50, 1), finishedAt: null }
    expect(statsByShot([open]).size).toBe(0)
  })

  it('zaehlt Sessions je Faehigkeit', () => {
    const shots = [shot('a', ['draw', 'position']), shot('b', ['draw'])]
    const counts = sessionsPerSkill([session('a', 50, 1), session('b', 50, 1)], shots)
    expect(counts.draw).toBe(2)
    expect(counts.position).toBe(1)
  })
})

describe('Empfehlungen', () => {
  it('setzt nie geuebte Stoesse nach vorn', () => {
    const shots = [shot('geuebt', ['draw']), shot('neu', ['draw'])]
    const sessions = [session('geuebt', 85, 0)]
    const result = recommend({ shots, sessions, player: player({ draw: 60 }), now: NOW }, 2)
    expect(result[0].shot.id).toBe('neu')
    expect(result[0].reason).toBe('Noch nie trainiert')
  })

  it('gewichtet ein schwaches letztes Ergebnis', () => {
    const shots = [shot('stark', ['draw']), shot('schwach', ['draw'])]
    const sessions = [session('stark', 95, 0), session('schwach', 20, 0)]
    const result = recommend({ shots, sessions, player: player({ draw: 60 }), now: NOW }, 2)
    expect(result[0].shot.id).toBe('schwach')
  })

  it('beruecksichtigt lange nicht geuebte Stoesse', () => {
    const shots = [shot('frisch', ['draw']), shot('alt', ['draw'])]
    const sessions = [session('frisch', 70, 0), session('alt', 70, 20)]
    const result = recommend({ shots, sessions, player: player({ draw: 60 }), now: NOW }, 2)
    expect(result[0].shot.id).toBe('alt')
    expect(result[0].reason).toContain('Tagen nicht geuebt')
  })

  it('bevorzugt Stoesse zur schwaechsten Faehigkeit', () => {
    const shots = [shot('stark', ['follow']), shot('schwach', ['draw'])]
    const sessions = [session('stark', 70, 1), session('schwach', 70, 1)]
    const ratings = { draw: 10, follow: 90 }
    const result = recommend({ shots, sessions, player: player(ratings), now: NOW }, 2)
    expect(result[0].shot.id).toBe('schwach')
  })

  it('liefert hoechstens so viele Vorschlaege wie gewuenscht', () => {
    const shots = ['a', 'b', 'c', 'd'].map((id) => shot(id, ['draw']))
    expect(recommend({ shots, sessions: [], player: player(), now: NOW }, 2)).toHaveLength(2)
  })

  it('kommt ohne jede Historie zurecht', () => {
    const result = recommend({ shots: [shot('a', [])], sessions: [], player: player(), now: NOW })
    expect(result).toHaveLength(1)
    expect(result[0].reason).toBeTruthy()
  })
})

describe('Skill-Ratings', () => {
  it('gewichtet den Zielwert mit der Schwierigkeit', () => {
    expect(ratingTarget(100, 10)).toBe(100)
    expect(ratingTarget(100, 1)).toBeCloseTo(55, 6)
  })

  it('setzt den ersten Wert direkt', () => {
    expect(updateRating(undefined, 80, 10)).toBe(80)
  })

  it('naehert sich nach oben schneller als nach unten', () => {
    const up = updateRating(50, 100, 10)
    const down = updateRating(50, 20, 10)
    expect(up - 50).toBeGreaterThan(50 - down)
  })

  it('zieht ein Rating bei sehr gutem Ergebnis nicht herunter', () => {
    expect(updateRating(90, 95, 2)).toBe(90)
  })

  it('schreibt alle Faehigkeiten eines Stosses fort', () => {
    const next = applySessionToRatings({}, shot('a', ['draw', 'cut'], 10), 60)
    expect(next.draw).toBe(60)
    expect(next.cut).toBe(60)
  })

  it('mittelt nur ueber bewertete Faehigkeiten', () => {
    expect(overallRating({ draw: 40, cut: 60 })).toBe(50)
    expect(overallRating({})).toBe(0)
  })

  it('nennt nie geuebte Faehigkeiten als schwaechste', () => {
    expect(weakestSkills({ draw: 80, cut: 90 }, 1)[0]).not.toBe('draw')
  })
})
