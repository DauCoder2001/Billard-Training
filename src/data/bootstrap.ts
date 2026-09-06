/** Erstbefuellung beim ersten Start. */

import { db } from './db'
import { seedShots } from './seed/drills'
import { PLAYER_COLORS } from './repositories/players'
import { DEFAULT_SETTINGS, getSettings, updateSettings } from './repositories/settings'
import { newId } from '@/domain/shot'

/** Version der Uebungssammlung. Erhoehen, wenn neue Uebungen dazukommen. */
export const SEED_VERSION = 1

let running: Promise<void> | null = null

/**
 * Legt Standardspieler und Uebungen an. Bereits geloeschte Uebungen kommen
 * nicht zurueck, weil der Stand ueber seededVersion gemerkt wird.
 *
 * Mehrfachaufrufe sind ungefaehrlich: parallele Aufrufe teilen sich denselben
 * Lauf, und das Anlegen des ersten Spielers passiert in einer Transaktion.
 * Ohne beides entstuenden bei zwei gleichzeitigen Starts zwei Spieler.
 */
export function bootstrap(): Promise<void> {
  if (!running) running = run().finally(() => (running = null))
  return running
}

async function run(): Promise<void> {
  await db.transaction('rw', db.players, db.settings, async () => {
    const settings = await getSettings()
    const count = await db.players.count()

    if (count === 0) {
      const player = {
        id: newId(),
        name: 'Spieler 1',
        color: PLAYER_COLORS[0],
        skillRatings: {},
        achievements: [],
        createdAt: Date.now(),
      }
      await db.players.add(player)
      await updateSettings({ activePlayerId: player.id })
      return
    }

    if (!settings.activePlayerId || !(await db.players.get(settings.activePlayerId))) {
      const first = await db.players.orderBy('name').first()
      if (first) await updateSettings({ activePlayerId: first.id })
    }
  })

  const settings = await getSettings()
  if (settings.seededVersion < SEED_VERSION) {
    await db.shots.bulkPut(seedShots())
    await updateSettings({ seededVersion: SEED_VERSION })
  }

  await migrateTheme()
}

/** Version des Farbschemas. Erhoehen, wenn die Standardfarben wechseln. */
export const THEME_VERSION = 1

/** Farben, die vor dem Wechsel auf das helle Design Standard waren. */
const PREVIOUS_DEFAULTS = { clothColor: '#1f6b52', railColor: '#5b3a22' }

/**
 * Stellt vorhandene Geraete einmalig auf das neue Farbschema um.
 *
 * Nur wer die Farben nie angefasst hat, wird umgestellt: eine bewusst
 * gewaehlte Tuchfarbe soll ein Update nicht ueberschreiben. Die Version wird
 * in jedem Fall hochgesetzt, damit das genau einmal geschieht.
 */
async function migrateTheme(): Promise<void> {
  const settings = await getSettings()
  if (settings.themeVersion >= THEME_VERSION) return

  const untouched =
    settings.clothColor === PREVIOUS_DEFAULTS.clothColor &&
    settings.railColor === PREVIOUS_DEFAULTS.railColor

  await updateSettings({
    themeVersion: THEME_VERSION,
    ...(untouched
      ? { clothColor: DEFAULT_SETTINGS.clothColor, railColor: DEFAULT_SETTINGS.railColor }
      : {}),
  })
}
