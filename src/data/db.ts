/** Lokale Datenhaltung in IndexedDB.
 *
 *  Alle Zugriffe laufen ueber die Repositories in data/repositories, damit
 *  die Oberflaeche die Speicherung nicht kennt und spaeter ein anderer
 *  Adapter (z. B. eine Server-Synchronisierung) eingehaengt werden kann.
 */

import Dexie, { type Table } from 'dexie'
import type { Player, Session, Settings, Shot, Workout } from '@/domain/types'

export class BillardDb extends Dexie {
  shots!: Table<Shot, string>
  players!: Table<Player, string>
  sessions!: Table<Session, string>
  workouts!: Table<Workout, string>
  settings!: Table<Settings, string>

  constructor() {
    super('billard-training')
    // Booleans taugen nicht als IndexedDB-Schluessel, daher sind favorite
    // und builtIn bewusst nicht indiziert.
    this.version(1).stores({
      shots: 'id, name, updatedAt',
      players: 'id, name',
      sessions: 'id, shotId, playerId, finishedAt, workoutId',
      workouts: 'id, name',
      settings: 'id',
    })
  }
}

export const db = new BillardDb()
