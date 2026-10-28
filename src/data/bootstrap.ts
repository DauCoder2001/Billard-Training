/** Erstbefuellung beim ersten Start. */

import { db } from './db'
import { seedShots } from './seed/drills'
import { PLAYER_COLORS } from './repositories/players'
import { DEFAULT_SETTINGS, getSettings, updateSettings } from './repositories/settings'
import { newId } from '@/domain/shot'
import type { Shot } from '@/domain/types'
import { transliterate } from '@/domain/text'

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
  await migrateDrillTexts()
}

/**
 * Holt die Umlaute in den Texten der mitgelieferten Stoesse nach.
 *
 * Geaendert wird nur, wo der gespeicherte Text noch genau die alte
 * Umschreibung des neuen ist. Wer einen Stoss selbst umbenannt hat, behaelt
 * seinen Namen, und Favoriten bleiben erhalten - anders als beim vollen
 * Wiederherstellen ueber die Einstellungen. Dadurch braucht es auch keinen
 * Versionszaehler: nach dem ersten Lauf passt keine Zeile mehr.
 */
async function migrateDrillTexts(): Promise<void> {
  const fresh = seedShots()
  const stored = await db.shots.bulkGet(fresh.map((s) => s.id))

  const updates = fresh.flatMap((neu, i) => {
    const alt = stored[i]
    if (!alt) return []
    const patch: Partial<Shot> = {}
    if (alt.name !== neu.name && alt.name === transliterate(neu.name)) patch.name = neu.name
    if (alt.description !== neu.description && alt.description === transliterate(neu.description)) {
      patch.description = neu.description
    }
    if (alt.coachNotes !== neu.coachNotes && alt.coachNotes === transliterate(neu.coachNotes)) {
      patch.coachNotes = neu.coachNotes
    }
    const tags = alt.tags.join('|')
    if (tags !== neu.tags.join('|') && tags === transliterate(neu.tags.join('|'))) patch.tags = neu.tags
    return Object.keys(patch).length > 0 ? [{ ...alt, ...patch }] : []
  })

  if (updates.length > 0) await db.shots.bulkPut(updates)
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
