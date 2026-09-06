/** Fortschreibung der Skill-Ratings aus Trainingsergebnissen. */

import type { Player, Shot, SkillTag } from './types'
import { SKILL_TAGS } from './types'

/**
 * Zielwert, den ein Ergebnis rechtfertigt. Ein perfektes Ergebnis auf einem
 * leichten Stoss belegt kein hohes Koennen, deshalb geht die Schwierigkeit
 * als Faktor ein: Schwierigkeit 10 laesst den vollen Score zu,
 * Schwierigkeit 1 nur gut die Haelfte.
 */
export function ratingTarget(score: number, difficulty: number): number {
  const factor = 0.5 + 0.05 * clampDifficulty(difficulty)
  return Math.min(100, Math.max(0, score * factor))
}

function clampDifficulty(d: number): number {
  return Math.min(10, Math.max(1, d))
}

/**
 * Neues Rating nach einer Session. Nach oben wird zuegiger korrigiert als
 * nach unten, und ein sehr gutes Ergebnis zieht ein Rating nie herunter.
 */
export function updateRating(
  previous: number | undefined,
  score: number,
  difficulty: number,
): number {
  const target = ratingTarget(score, difficulty)
  if (previous === undefined) return round1(target)
  if (target >= previous) return round1(previous + 0.35 * (target - previous))
  if (score >= 90) return round1(previous)
  return round1(previous + 0.2 * (target - previous))
}

function round1(v: number): number {
  return Math.round(v * 10) / 10
}

/**
 * Ratings nach einer abgeschlossenen Session. Betroffen sind alle Skills,
 * die dem Stoss zugeordnet sind.
 */
export function applySessionToRatings(
  ratings: Player['skillRatings'],
  shot: Shot,
  score: number,
): Player['skillRatings'] {
  const next: Player['skillRatings'] = { ...ratings }
  for (const skill of shot.attributes.skills) {
    next[skill] = updateRating(next[skill], score, shot.attributes.difficulty)
  }
  return next
}

/** Gesamtrating als Mittel ueber alle bewerteten Skills. */
export function overallRating(ratings: Player['skillRatings']): number {
  const values = SKILL_TAGS.map((s) => ratings[s]).filter(
    (v): v is number => typeof v === 'number',
  )
  if (values.length === 0) return 0
  return round1(values.reduce((a, b) => a + b, 0) / values.length)
}

/** Die schwaechsten Skills zuerst. Nie geuebte Skills zaehlen als 0. */
export function rankedSkills(
  ratings: Player['skillRatings'],
): { skill: SkillTag; rating: number; practiced: boolean }[] {
  return SKILL_TAGS.map((skill) => ({
    skill,
    rating: ratings[skill] ?? 0,
    practiced: typeof ratings[skill] === 'number',
  })).sort((a, b) => a.rating - b.rating)
}

export function weakestSkills(ratings: Player['skillRatings'], count = 3): SkillTag[] {
  return rankedSkills(ratings)
    .slice(0, count)
    .map((e) => e.skill)
}
