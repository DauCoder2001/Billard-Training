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
 * Holt eine Liste aus der Sicherung.
 *
 * Fehlt das Feld, war die Sicherung an der Stelle leer oder stammt aus einer
 * aelteren Fassung - das ist in Ordnung. Steht dort aber etwas anderes als
 * eine Liste, bricht der Import ab, und zwar vor der Transaktion: im Modus
 * "replace" wuerde ein stillschweigendes [] den vorhandenen Bestand loeschen
 * und nur einen Teil der Sicherung zuruecklassen.
 */
function list<T>(value: unknown, label: string): T[] {
  if (value === undefined || value === null) return []
  if (!Array.isArray(value)) {
    throw new Error(
      `Die Sicherung ist beschädigt und wurde nicht eingespielt: ${label} liegen nicht als Liste vor.`,
    )
  }
  return value as T[]
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
  const backup = raw as Partial<Backup> & { kind?: unknown }
  // Ein einzelner geteilter Stoss traegt dieselbe app-Marke. Ohne diesen
  // Hinweis stuende dort "keine Sicherung dieser App", obwohl die Datei aus
  // genau dieser App stammt - nur vom anderen Weg.
  if (backup && backup.app === 'billard-training' && backup.kind === 'shot') {
    throw new Error(
      'Das ist ein einzelner geteilter Stoß, keine Sicherung. Einzelne Stöße werden unter "Geteilten Stoß übernehmen" eingelesen.',
    )
  }
  if (!backup || backup.app !== 'billard-training' || !Array.isArray(backup.shots)) {
    throw new Error('Das ist keine Sicherung dieser App.')
  }
  if ((backup.version ?? 0) > BACKUP_VERSION) {
    throw new Error('Die Sicherung stammt aus einer neueren Version der App.')
  }

  const shots = list<Shot>(backup.shots, 'Die Stöße')
  const players = list<Player>(backup.players, 'Die Spieler')
  const sessions = list<Session>(backup.sessions, 'Die Einheiten')
  const workouts = list<Workout>(backup.workouts, 'Die Workouts')

  // Dasselbe fuer die Einstellungen: ein Text an dieser Stelle wuerde sich
  // beim Spreizen ueber die Standardwerte streuen und unsinnige Felder
  // hinterlassen.
  const settings = backup.settings
  if (
    settings !== undefined &&
    settings !== null &&
    (typeof settings !== 'object' || Array.isArray(settings))
  ) {
    throw new Error(
      'Die Sicherung ist beschädigt und wurde nicht eingespielt: Die Einstellungen liegen nicht als Datensatz vor.',
    )
  }

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
      if (settings) {
        await db.settings.put({ ...DEFAULT_SETTINGS, ...settings, id: 'settings' })
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
