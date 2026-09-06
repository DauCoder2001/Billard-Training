/** Vollstaendige Sicherung als JSON-Datei. */

import { db } from '../db'
import { DEFAULT_SETTINGS, getSettings } from './settings'
import type { Player, Session, Settings, Shot, Workout } from '@/domain/types'

export const BACKUP_VERSION = 1

export interface Backup {
  app: 'billard-training'
  version: number
  exportedAt: number
  shots: Shot[]
  players: Player[]
  sessions: Session[]
  workouts: Workout[]
  settings: Settings
}

export async function exportBackup(): Promise<Backup> {
  const [shots, players, sessions, workouts, settings] = await Promise.all([
    db.shots.toArray(),
    db.players.toArray(),
    db.sessions.toArray(),
    db.workouts.toArray(),
    getSettings(),
  ])
  return {
    app: 'billard-training',
    version: BACKUP_VERSION,
    exportedAt: Date.now(),
    shots,
    players,
    sessions,
    workouts,
    settings,
  }
}

export interface ImportResult {
  shots: number
  players: number
  sessions: number
  workouts: number
}

/**
 * Spielt eine Sicherung ein. Im Modus "replace" wird der Bestand vorher
 * geleert, im Modus "merge" bleiben vorhandene Eintraege erhalten und
 * gleichnamige Ids werden ueberschrieben.
 */
export async function importBackup(
  raw: unknown,
  mode: 'merge' | 'replace' = 'merge',
): Promise<ImportResult> {
  const backup = raw as Partial<Backup>
  if (!backup || backup.app !== 'billard-training' || !Array.isArray(backup.shots)) {
    throw new Error('Das ist keine Sicherung dieser App.')
  }
  if ((backup.version ?? 0) > BACKUP_VERSION) {
    throw new Error('Die Sicherung stammt aus einer neueren Version der App.')
  }

  const shots = backup.shots ?? []
  const players = backup.players ?? []
  const sessions = backup.sessions ?? []
  const workouts = backup.workouts ?? []

  await db.transaction(
    'rw',
    db.shots,
    db.players,
    db.sessions,
    db.workouts,
    db.settings,
    async () => {
      if (mode === 'replace') {
        await Promise.all([
          db.shots.clear(),
          db.players.clear(),
          db.sessions.clear(),
          db.workouts.clear(),
        ])
      }
      await db.shots.bulkPut(shots)
      await db.players.bulkPut(players)
      await db.sessions.bulkPut(sessions)
      await db.workouts.bulkPut(workouts)
      if (backup.settings) {
        await db.settings.put({ ...DEFAULT_SETTINGS, ...backup.settings, id: 'settings' })
      }
    },
  )

  return {
    shots: shots.length,
    players: players.length,
    sessions: sessions.length,
    workouts: workouts.length,
  }
}
