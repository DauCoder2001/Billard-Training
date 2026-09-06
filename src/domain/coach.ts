/** Empfehlungslogik: welcher Stoss bringt gerade am meisten?
 *
 *  Reine Funktion ueber Stossbestand, Sessionhistorie und Spielerprofil,
 *  damit sie sich ohne Datenbank testen laesst.
 */

import { overallRating, weakestSkills } from './skills'
import { SKILL_LABELS } from './types'
import type { Player, Session, Shot, SkillTag } from './types'

const DAY = 24 * 60 * 60 * 1000

export interface Recommendation {
  shot: Shot
  score: number
  /** Kurzbegruendung fuer die Oberflaeche. */
  reason: string
  /** Alle zutreffenden Gruende, staerkster zuerst. */
  reasons: string[]
}

interface ShotStats {
  sessions: number
  lastAt: number | null
  lastScore: number | null
  bestScore: number | null
  avgScore: number | null
}

/** Verdichtet die Historie eines Spielers auf Kennzahlen je Stoss. */
export function statsByShot(sessions: Session[]): Map<string, ShotStats> {
  const map = new Map<string, ShotStats>()
  const finished = sessions
    .filter((s) => s.finishedAt !== null)
    .sort((a, b) => (a.finishedAt ?? 0) - (b.finishedAt ?? 0))

  for (const s of finished) {
    const prev = map.get(s.shotId)
    if (!prev) {
      map.set(s.shotId, {
        sessions: 1,
        lastAt: s.finishedAt,
        lastScore: s.score,
        bestScore: s.score,
        avgScore: s.score,
      })
      continue
    }
    const n = prev.sessions + 1
    map.set(s.shotId, {
      sessions: n,
      lastAt: s.finishedAt,
      lastScore: s.score,
      bestScore: Math.max(prev.bestScore ?? 0, s.score),
      avgScore: ((prev.avgScore ?? 0) * prev.sessions + s.score) / n,
    })
  }
  return map
}

/** Anzahl Sessions je Skill, um Einseitigkeit im Training zu erkennen. */
export function sessionsPerSkill(
  sessions: Session[],
  shots: Shot[],
): Record<SkillTag, number> {
  const byId = new Map(shots.map((s) => [s.id, s]))
  const counts = {} as Record<SkillTag, number>
  for (const s of sessions) {
    if (s.finishedAt === null) continue
    const shot = byId.get(s.shotId)
    if (!shot) continue
    for (const skill of shot.attributes.skills) {
      counts[skill] = (counts[skill] ?? 0) + 1
    }
  }
  return counts
}

export interface CoachInput {
  shots: Shot[]
  sessions: Session[]
  player: Player
  now?: number
}

/**
 * Bewertet jeden Stoss danach, wie viel Training er gerade bringt, und
 * liefert die besten Vorschlaege zuerst.
 */
export function recommend(input: CoachInput, count = 5): Recommendation[] {
  const now = input.now ?? Date.now()
  const stats = statsByShot(input.sessions)
  const perSkill = sessionsPerSkill(input.sessions, input.shots)
  const weak = new Set(weakestSkills(input.player.skillRatings, 4))
  const overall = overallRating(input.player.skillRatings)

  const skillCounts = Object.values(perSkill)
  const avgSkillCount =
    skillCounts.length > 0 ? skillCounts.reduce((a, b) => a + b, 0) / skillCounts.length : 0

  const scored = input.shots.map((shot) => {
    const st = stats.get(shot.id)
    const factors: { weight: number; text: string }[] = []

    if (!st) {
      factors.push({ weight: 40, text: 'Noch nie trainiert' })
    } else {
      const days = st.lastAt ? (now - st.lastAt) / DAY : 0
      if (days >= 3) {
        factors.push({
          weight: Math.min(28, days * 1.6),
          text: `Seit ${Math.round(days)} Tagen nicht geuebt`,
        })
      }
      if (st.lastScore !== null && st.lastScore < shot.scoring.thresholds.proficient) {
        factors.push({
          weight: (shot.scoring.thresholds.proficient - st.lastScore) * 0.6,
          text: `Letztes Ergebnis nur ${st.lastScore.toFixed(0)} %`,
        })
      }
    }

    const weakHits = shot.attributes.skills.filter((s) => weak.has(s))
    if (weakHits.length > 0) {
      const worst = weakHits
        .map((s) => ({ s, r: input.player.skillRatings[s] ?? 0 }))
        .sort((a, b) => a.r - b.r)[0]
      factors.push({
        weight: (100 - worst.r) * 0.35,
        text: `Schwachstelle ${SKILL_LABELS[worst.s]}`,
      })
    }

    const neglected = shot.attributes.skills.filter(
      (s) => (perSkill[s] ?? 0) < avgSkillCount * 0.5,
    )
    if (neglected.length > 0 && avgSkillCount >= 2) {
      factors.push({
        weight: 12,
        text: `Bringt ${SKILL_LABELS[neglected[0]]} ins Gleichgewicht`,
      })
    }

    // Passung der Schwierigkeit: Stoesse weit ueber oder unter dem aktuellen
    // Niveau bringen wenig. Ein Wert von 0 heisst perfekt passend.
    const mismatch = Math.abs(shot.attributes.difficulty * 10 - Math.max(overall, 25))
    const fitPenalty = mismatch * 0.25

    const total =
      factors.reduce((a, f) => a + f.weight, 0) - fitPenalty + (shot.favorite ? 5 : 0)

    const reasons = factors
      .slice()
      .sort((a, b) => b.weight - a.weight)
      .map((f) => f.text)

    return {
      shot,
      score: Math.round(total * 10) / 10,
      reason: reasons[0] ?? 'Passt zu deinem aktuellen Niveau',
      reasons,
    }
  })

  return scored
    .sort((a, b) => b.score - a.score || a.shot.name.localeCompare(b.shot.name))
    .slice(0, count)
}
