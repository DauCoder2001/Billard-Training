/** Erstbefuellung beim ersten Start. */

import { db } from './db'
import { seedShots } from './seed/drills'
import { PLAYER_COLORS } from './repositories/players'
import { DEFAULT_SETTINGS, getSettings, updateSettings } from './repositories/settings'
import { newId } from '@/domain/shot'
import type { Shot } from '@/domain/types'
import { transliterate } from '@/domain/text'

/**
 * Version der Uebungssammlung. Erhoehen, wenn neue Uebungen dazukommen oder
 * sich der Aufbau vorhandener aendert - sonst bleiben auf vorhandenen
 * Geraeten die alten stehen.
 *
 * 2: Drei gerade Stoesse lagen so, dass der Weisse an die Bande geklemmt
 *    wurde und aus dem geraden Ball ein Schnitt von 17 bis 29 Grad wurde.
 *    Dazu der Kick, dessen Weisser gespiegelt statt gerechnet wurde.
 */
export const SEED_VERSION = 2

let running: Promise<void> | null = null

/**
 * Legt Standardspieler und Uebungen an.
 *
 * Geloeschte Uebungen kommen nicht zurueck, und eine eigene Fassung einer
 * mitgelieferten Uebung bleibt stehen - auch wenn die Sammlung aktualisiert
 * wird. Siehe die Regel beim Einspielen weiter unten.
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
    const fresh = seedShots()
    const stored = await db.shots.bulkGet(fresh.map((s) => s.id))
    const updates = seedUpdates(fresh, stored, settings.seededVersion === 0)
    if (updates.length > 0) await db.shots.bulkPut(updates)
    await updateSettings({ seededVersion: SEED_VERSION })
  }

  await migrateTheme()
  await migrateDrillTexts()
  await migrateSeedStamps()
}

/**
 * Was eine Einspielung der Sammlung schreiben darf.
 *
 * Beim ersten Lauf kommt die ganze Sammlung ins Haus. Jeder spaetere Lauf -
 * eine Auslieferung mit erhoehter SEED_VERSION - fasst nur an, was noch da und
 * noch mitgeliefert ist:
 *
 * - Ein geloeschter Stoss fehlt im Bestand und bleibt geloescht. Vorher
 *   schrieb bulkPut die ganze Sammlung zurueck und holte ihn wieder.
 * - Ein Stoss, den der Baukasten gespeichert hat, traegt builtIn === false und
 *   ist damit die Fassung des Nutzers. Vorher gingen Name, Notizen und Aufbau
 *   beim naechsten Update verloren; nur der Favorit blieb stehen.
 *
 * Der Preis: eine Korrektur der Vorlage - wie die gerechnete Geometrie in
 * 0.5.1 - erreicht einen uebernommenen Stoss nicht mehr. Eigene Arbeit wiegt
 * schwerer. Wer die Vorlage zurueckholen will, nimmt den ausdruecklichen Weg
 * "Mitgelieferte Stoesse wiederherstellen" in den Einstellungen; dort steht
 * vorher, was dabei verloren geht.
 *
 * Reine Funktion ueber Vorlage und Bestand, damit sich die Regel ohne
 * Datenbank pruefen laesst - sie entscheidet ueber eigene Arbeit.
 *
 * @param fresh Die Stoesse der Vorlage.
 * @param stored Der gespeicherte Stand zu denselben Ids, in derselben Folge.
 * @param erstlauf true, wenn auf diesem Geraet noch nie eingespielt wurde.
 */
export function seedUpdates(
  fresh: Shot[],
  stored: (Shot | undefined)[],
  erstlauf: boolean,
): Shot[] {
  return fresh.flatMap((neu, i) => {
    const alt = stored[i]
    // Der Favorit ist eine Entscheidung des Nutzers und steht nicht in der
    // Vorlage.
    if (erstlauf) return [{ ...neu, favorite: alt?.favorite ?? false }]
    if (!alt || alt.builtIn !== true) return []
    return [{ ...neu, favorite: alt.favorite }]
  })
}

/**
 * Haengt den Stand der Vorlage an Stoesse, die ihn noch nicht tragen.
 *
 * Betrifft Geraete, auf denen schon vor dieser Neuerung eingespielt wurde,
 * und Stoesse aus einer eingelesenen Sicherung: beide bringen keinen Stand
 * mit. Von welcher Fassung eine laengst uebernommene Uebung abstammt, laesst
 * sich nicht mehr feststellen - deshalb gelten sie ab hier als aktuell.
 * Sonst stuenden beim ersten Start auf einen Schlag Hinweise auf
 * Ueberarbeitungen da, die der Nutzer laengst kennt.
 *
 * Daraus folgt eine Bedingung an die Auslieferung: in derselben Version darf
 * keine Vorlage korrigiert werden, sonst wird genau diese Korrektur
 * stillschweigend abgehakt.
 *
 * Einen Versionszaehler braucht es nicht: nach dem ersten Lauf traegt jeder
 * betroffene Stoss einen Stand, und die Regel findet nichts mehr.
 */
async function migrateSeedStamps(): Promise<void> {
  const fresh = seedShots()
  const stored = await db.shots.bulkGet(fresh.map((s) => s.id))
  const updates = seedStampUpdates(fresh, stored)
  if (updates.length > 0) await db.shots.bulkPut(updates)
}

/**
 * Reine Form derselben Regel - ohne Datenbank pruefbar.
 *
 * @param fresh Die Stoesse der Vorlage.
 * @param stored Der gespeicherte Stand zu denselben Ids, in derselben Folge.
 */
export function seedStampUpdates(fresh: Shot[], stored: (Shot | undefined)[]): Shot[] {
  return fresh.flatMap((neu, i) => {
    const alt = stored[i]
    if (!alt || alt.seedStamp) return []
    return [{ ...alt, seedStamp: neu.seedStamp }]
  })
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
