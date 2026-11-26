/** Vollstaendige Sicherung als JSON-Datei. */

import { db } from '../db'
import {
  restorePlayers,
  restoreSessions,
  restoreSettings,
  restoreShots,
  restoreWorkouts,
} from './restore'
import { getSettings } from './settings'
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
  /** Eintraege, die unbrauchbar waren und weggelassen wurden. */
  dropped: number
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
 *
 * Der Inhalt wird dabei Feld fuer Feld geprueft (siehe restore.ts). Eine
 * Sicherung ist eine fremde Datei wie jede andere, und was hier hineinkommt,
 * bleibt gespeichert: ungeprueft uebernommen wuerde ein beschaedigter
 * Eintrag die Ansicht bei jedem Start erneut zu Fall bringen.
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
      'Das ist eine einzelne geteilte Übung, keine Sicherung. Einzelne Übungen werden unter "Geteilte Übung übernehmen" eingelesen.',
    )
  }
  if (!backup || backup.app !== 'billard-training' || !Array.isArray(backup.shots)) {
    throw new Error('Das ist keine Sicherung dieser App.')
  }
  if ((backup.version ?? 0) > BACKUP_VERSION) {
    throw new Error('Die Sicherung stammt aus einer neueren Version der App.')
  }

  const rohShots = list<unknown>(backup.shots, 'Die Übungen')
  const rohPlayers = list<unknown>(backup.players, 'Die Spieler')
  const rohSessions = list<unknown>(backup.sessions, 'Die Einheiten')
  const rohWorkouts = list<unknown>(backup.workouts, 'Die Workouts')

  const shots = restoreShots(rohShots)
  const players = restorePlayers(rohPlayers)
  const sessions = restoreSessions(rohSessions)
  const workouts = restoreWorkouts(rohWorkouts)

  // Weggelassen wird nur, was keine Id hat und damit zu nichts gehoert. Still
  // verschwinden soll es trotzdem nicht - die Meldung am Ende nennt die Zahl.
  const dropped =
    rohShots.length -
    shots.length +
    (rohPlayers.length - players.length) +
    (rohSessions.length - sessions.length) +
    (rohWorkouts.length - workouts.length)

  // Dasselbe fuer die Einstellungen: ein Text an dieser Stelle wuerde sich
  // beim Spreizen ueber die Standardwerte streuen und unsinnige Felder
  // hinterlassen.
  const rohSettings = backup.settings
  if (
    rohSettings !== undefined &&
    rohSettings !== null &&
    (typeof rohSettings !== 'object' || Array.isArray(rohSettings))
  ) {
    throw new Error(
      'Die Sicherung ist beschädigt und wurde nicht eingespielt: Die Einstellungen liegen nicht als Datensatz vor.',
    )
  }
  const settings =
    rohSettings === undefined || rohSettings === null ? null : restoreSettings(rohSettings)

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
      if (settings) await db.settings.put(settings)
    },
  )

  return {
    shots: shots.length,
    players: players.length,
    sessions: sessions.length,
    workouts: workouts.length,
    dropped,
  }
}
