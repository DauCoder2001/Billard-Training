/** Reaktive Lesezugriffe. Aenderungen an der Datenbank aktualisieren die
 *  Oberflaeche von selbst, ohne dass Seiten neu geladen werden muessen. */

import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db'
import { statsByShot } from '@/domain/coach'
import type { Player, Session, Shot, Workout } from '@/domain/types'

export function useShots(): Shot[] | undefined {
  return useLiveQuery(async () => {
    const rows = await db.shots.toArray()
    return rows.sort((a, b) => a.name.localeCompare(b.name, 'de'))
  }, [])
}

export function useShot(id: string | undefined): Shot | undefined | null {
  return useLiveQuery(async () => (id ? ((await db.shots.get(id)) ?? null) : null), [id])
}

export function useSessions(playerId: string | null): Session[] | undefined {
  return useLiveQuery(
    async () => (playerId ? await db.sessions.where('playerId').equals(playerId).toArray() : []),
    [playerId],
  )
}

/** Kennzahlen je Stoss fuer den angegebenen Spieler. */
export function useShotStats(playerId: string | null) {
  const sessions = useSessions(playerId)
  return statsByShot(sessions ?? [])
}

export function useWorkouts(): Workout[] | undefined {
  return useLiveQuery(async () => {
    const rows = await db.workouts.toArray()
    return rows.sort((a, b) => a.name.localeCompare(b.name, 'de'))
  }, [])
}

export function useWorkout(id: string | undefined): Workout | undefined | null {
  return useLiveQuery(async () => (id ? ((await db.workouts.get(id)) ?? null) : null), [id])
}

export function useSession(id: string | undefined): Session | undefined | null {
  return useLiveQuery(async () => (id ? ((await db.sessions.get(id)) ?? null) : null), [id])
}

export function usePlayers(): Player[] | undefined {
  return useLiveQuery(async () => {
    const rows = await db.players.toArray()
    return rows.sort((a, b) => a.createdAt - b.createdAt)
  }, [])
}
