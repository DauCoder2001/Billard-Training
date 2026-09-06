import { db } from '../db'
import { proficiencyFor, sessionScore } from '@/domain/scoring'
import { applySessionToRatings } from '@/domain/skills'
import { newId } from '@/domain/shot'
import type { Attempt, Session, SessionFormat, Shot } from '@/domain/types'

export function startSession(
  shot: Shot,
  playerId: string,
  format: SessionFormat,
  attempts: number,
  workoutId?: string,
): Session {
  return {
    id: newId(),
    shotId: shot.id,
    playerId,
    format,
    attempts,
    results: [],
    score: 0,
    proficiency: 'beginning',
    workoutId,
    startedAt: Date.now(),
    finishedAt: null,
  }
}

/**
 * Schliesst eine Session ab: Score berechnen, speichern und die
 * Skill-Ratings des Spielers fortschreiben.
 */
export async function finishSession(
  session: Session,
  shot: Shot,
  results: Attempt[],
): Promise<Session> {
  const score = sessionScore(results, session.attempts)
  const finished: Session = {
    ...session,
    results,
    score,
    proficiency: proficiencyFor(score, shot.scoring.thresholds),
    finishedAt: Date.now(),
  }

  await db.transaction('rw', db.sessions, db.players, async () => {
    await db.sessions.put(finished)
    const player = await db.players.get(session.playerId)
    if (player) {
      await db.players.put({
        ...player,
        skillRatings: applySessionToRatings(player.skillRatings, shot, score),
      })
    }
  })
  return finished
}

export async function sessionsForPlayer(playerId: string): Promise<Session[]> {
  const rows = await db.sessions.where('playerId').equals(playerId).toArray()
  return rows.sort((a, b) => (b.finishedAt ?? b.startedAt) - (a.finishedAt ?? a.startedAt))
}

export async function sessionsForShot(shotId: string, playerId: string): Promise<Session[]> {
  const rows = await db.sessions.where('shotId').equals(shotId).toArray()
  return rows
    .filter((s) => s.playerId === playerId && s.finishedAt !== null)
    .sort((a, b) => (a.finishedAt ?? 0) - (b.finishedAt ?? 0))
}

export function getSession(id: string): Promise<Session | undefined> {
  return db.sessions.get(id)
}

export async function deleteSession(id: string): Promise<void> {
  await db.sessions.delete(id)
}
