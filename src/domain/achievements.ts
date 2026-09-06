/** Meilensteine. Werden aus der Historie berechnet statt gespeichert, damit
 *  sie nach einem Import oder einer Korrektur immer stimmen. */

import { overallRating } from './skills'
import { SKILL_TAGS } from './types'
import type { Player, Session, Shot } from './types'

export interface AchievementContext {
  sessions: Session[]
  shots: Shot[]
  player: Player
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  /** Fortschritt 0..1 fuer die Anzeige. */
  progress: (ctx: AchievementContext) => number
}

const DAY_MS = 24 * 60 * 60 * 1000

function finished(ctx: AchievementContext): Session[] {
  return ctx.sessions.filter((s) => s.finishedAt !== null)
}

function ratio(value: number, target: number): number {
  return Math.max(0, Math.min(1, value / target))
}

/** Tage mit mindestens einer abgeschlossenen Session, als Tagesnummern. */
function trainingDays(ctx: AchievementContext): number[] {
  const days = new Set<number>()
  for (const s of finished(ctx)) {
    days.add(Math.floor((s.finishedAt ?? 0) / DAY_MS))
  }
  return [...days].sort((a, b) => a - b)
}

function longestStreak(ctx: AchievementContext): number {
  const days = trainingDays(ctx)
  let best = 0
  let current = 0
  let previous: number | null = null
  for (const day of days) {
    current = previous !== null && day === previous + 1 ? current + 1 : 1
    best = Math.max(best, current)
    previous = day
  }
  return best
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-session',
    name: 'Angefangen',
    description: 'Die erste Trainingseinheit abgeschlossen.',
    icon: '🎯',
    progress: (ctx) => ratio(finished(ctx).length, 1),
  },
  {
    id: 'sessions-10',
    name: 'Dranbleiber',
    description: '10 Trainingseinheiten abgeschlossen.',
    icon: '📗',
    progress: (ctx) => ratio(finished(ctx).length, 10),
  },
  {
    id: 'sessions-50',
    name: 'Stammgast',
    description: '50 Trainingseinheiten abgeschlossen.',
    icon: '📘',
    progress: (ctx) => ratio(finished(ctx).length, 50),
  },
  {
    id: 'sessions-200',
    name: 'Tischbewohner',
    description: '200 Trainingseinheiten abgeschlossen.',
    icon: '📚',
    progress: (ctx) => ratio(finished(ctx).length, 200),
  },
  {
    id: 'perfect',
    name: 'Fehlerfrei',
    description: 'Eine Einheit mit 100 Prozent beendet.',
    icon: '💯',
    progress: (ctx) => (finished(ctx).some((s) => s.score >= 100) ? 1 : 0),
  },
  {
    id: 'exemplary',
    name: 'Meisterlich',
    description: 'Eine Einheit in der hoechsten Stufe beendet.',
    icon: '🏆',
    progress: (ctx) => (finished(ctx).some((s) => s.proficiency === 'exemplary') ? 1 : 0),
  },
  {
    id: 'clean-20',
    name: 'Saubere Hand',
    description: '20 Versuche am Stueck ohne einen Kratzer.',
    icon: '🧤',
    progress: (ctx) =>
      finished(ctx).some((s) => s.results.length >= 20 && s.results.every((r) => !r.scratch))
        ? 1
        : 0,
  },
  {
    id: 'streak-3',
    name: 'Drei Tage am Stueck',
    description: 'An drei aufeinanderfolgenden Tagen trainiert.',
    icon: '🔥',
    progress: (ctx) => ratio(longestStreak(ctx), 3),
  },
  {
    id: 'streak-7',
    name: 'Eine ganze Woche',
    description: 'An sieben aufeinanderfolgenden Tagen trainiert.',
    icon: '☄️',
    progress: (ctx) => ratio(longestStreak(ctx), 7),
  },
  {
    id: 'builder-1',
    name: 'Eigenbau',
    description: 'Einen eigenen Stoss gebaut.',
    icon: '🛠️',
    progress: (ctx) => ratio(ctx.shots.filter((s) => !s.builtIn).length, 1),
  },
  {
    id: 'builder-10',
    name: 'Eigene Sammlung',
    description: 'Zehn eigene Stoesse gebaut.',
    icon: '🗂️',
    progress: (ctx) => ratio(ctx.shots.filter((s) => !s.builtIn).length, 10),
  },
  {
    id: 'allrounder',
    name: 'Allrounder',
    description: 'Jede Faehigkeit mindestens einmal trainiert.',
    icon: '🧭',
    progress: (ctx) =>
      ratio(
        SKILL_TAGS.filter((s) => typeof ctx.player.skillRatings[s] === 'number').length,
        SKILL_TAGS.length,
      ),
  },
  {
    id: 'rating-50',
    name: 'Solide Basis',
    description: 'Ein Gesamtrating von 50 erreicht.',
    icon: '📈',
    progress: (ctx) => ratio(overallRating(ctx.player.skillRatings), 50),
  },
  {
    id: 'rating-75',
    name: 'Starkes Profil',
    description: 'Ein Gesamtrating von 75 erreicht.',
    icon: '🥇',
    progress: (ctx) => ratio(overallRating(ctx.player.skillRatings), 75),
  },
  {
    id: 'hard-advanced',
    name: 'Schweres Kaliber',
    description: 'Einen Stoss der Schwierigkeit 8 oder hoeher auf mindestens 80 Prozent gebracht.',
    icon: '⛰️',
    progress: (ctx) => {
      const byId = new Map(ctx.shots.map((s) => [s.id, s]))
      return finished(ctx).some(
        (s) => s.score >= 80 && (byId.get(s.shotId)?.attributes.difficulty ?? 0) >= 8,
      )
        ? 1
        : 0
    },
  },
  {
    id: 'marathon',
    name: 'Marathon',
    description: '100 Versuche an einem Tag.',
    icon: '🏃',
    progress: (ctx) => {
      const perDay = new Map<number, number>()
      for (const s of finished(ctx)) {
        const day = Math.floor((s.finishedAt ?? 0) / DAY_MS)
        perDay.set(day, (perDay.get(day) ?? 0) + s.results.length)
      }
      return ratio(Math.max(0, ...perDay.values()), 100)
    },
  },
]

export interface AchievementState {
  achievement: Achievement
  progress: number
  unlocked: boolean
}

export function evaluateAchievements(ctx: AchievementContext): AchievementState[] {
  return ACHIEVEMENTS.map((achievement) => {
    const progress = achievement.progress(ctx)
    return { achievement, progress, unlocked: progress >= 1 }
  })
}
