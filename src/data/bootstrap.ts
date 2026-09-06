/** Erstbefuellung beim ersten Start. */

import { db } from './db'
import { seedShots } from './seed/drills'
import { createPlayer } from './repositories/players'
import { getSettings, updateSettings } from './repositories/settings'

/** Version der Uebungssammlung. Erhoehen, wenn neue Uebungen dazukommen. */
export const SEED_VERSION = 1

/**
 * Legt Standardspieler und Uebungen an. Bereits geloeschte Uebungen kommen
 * nicht zurueck, weil der Stand ueber seededVersion gemerkt wird.
 */
export async function bootstrap(): Promise<void> {
  const settings = await getSettings()

  if ((await db.players.count()) === 0) {
    const player = await createPlayer('Spieler 1')
    await updateSettings({ activePlayerId: player.id })
  } else if (!settings.activePlayerId) {
    const first = await db.players.orderBy('name').first()
    if (first) await updateSettings({ activePlayerId: first.id })
  }

  if (settings.seededVersion < SEED_VERSION) {
    await db.shots.bulkPut(seedShots())
    await updateSettings({ seededVersion: SEED_VERSION })
  }
}
