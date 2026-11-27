/** Erstbefuellung beim ersten Start. */

import { db } from './db'
import { RETIRED_IDS, seedIdsSince, seedShots } from './seed/drills'
import { PLAYER_COLORS } from './repositories/players'
import { DEFAULT_SETTINGS, getSettings, updateSettings } from './repositories/settings'
import { newId } from '@/domain/shot'
import type { Shot } from '@/domain/types'
import { transliterate } from '@/domain/text'
import { speedFromLegacy } from '@/domain/tempo'

/**
 * Version der Uebungssammlung. Erhoehen, wenn neue Uebungen dazukommen oder
 * sich der Aufbau vorhandener aendert - sonst bleiben auf vorhandenen
 * Geraeten die alten stehen.
 *
 * 2: Drei gerade Stoesse lagen so, dass der Weisse an die Bande geklemmt
 *    wurde und aus dem geraden Ball ein Schnitt von 17 bis 29 Grad wurde.
 *    Dazu der Kick, dessen Weisser gespiegelt statt gerechnet wurde.
 * 3: Stufe A vollstaendig - 19 neue Uebungen. Die erste Auslieferung, die
 *    die Sammlung erweitert statt sie zu korrigieren; dafuer braucht die
 *    Regel beim Einspielen die Angabe `since` (siehe seedUpdates).
 * 4: Vier Spiegel-Uebungen zurueckgezogen (RETIRED_IDS), dafuer der Hinweis
 *    auf die andere Seite bei jedem Schnittball. Die Erhoehung gilt dem
 *    Hinweis: ein geaenderter Text erreicht ein Geraet nur so. Das Wegraeumen
 *    laeuft ueber eine eigene Regel und braucht sie nicht.
 * 5: "Durch die enge Luecke" zurueckgezogen - dieselbe Uebung mit engerem
 *    Tor. Die Abstufung steht jetzt als Variante im Hinweis des Originals.
 * 6: "Seiteneffet rechts" zurueckgezogen - Spiegelbild von "Seiteneffet
 *    links", das Effet eingeschlossen. Die verbliebene heisst jetzt
 *    "Seiteneffet ueber die Bande" und nennt beide Seiten im Hinweis;
 *    Name und Hinweis erreichen ein Geraet nur ueber diese Erhoehung.
 * 7: Bandenwege an der richtigen Linie gespiegelt und "Ball an der Bande"
 *    von der Bande weggerueckt (0.19.1). Vier Uebungen aendern dadurch ihre
 *    Lage - das sind andere Baelle auf dem Tisch, nicht nur ein anderer
 *    Text.
 * 8: Tempo in Tischlaengen, Zielzonen aus der Nachrechnung gesetzt (0.19.2).
 *    Alle 38 Uebungen aendern sich: jede im Tempo, zehn zusaetzlich im Drall
 *    oder in der Zielzone.
 * 9: Schwierigkeiten der Stufe B aufgefaechert und der Safe von 8 auf 6
 *    (0.19.3). Sechs Uebungen aendern nur diese Zahl - sie wirkt auf den
 *    Vorschlag des Coaches und auf das Rating, erreicht ein Geraet aber
 *    nur ueber diese Erhoehung.
 * 10: Der Weg des Objektballs beim Safe endet dort, wo der Ball wirklich
 *    liegen bleibt, statt in der Ecke unten rechts (0.19.5). Das ist ein
 *    anderes Bild auf dem Tisch und erreicht ein Geraet nur so.
 */
export const SEED_VERSION = 10

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

  // Vor dem Einspielen: Die Sammlung bringt Tempi in Tischlaengen mit, der
  // Bestand traegt noch die alte Zahl ohne Einheit.
  await migrateSpeedScale()

  const settings = await getSettings()
  if (settings.seededVersion < SEED_VERSION) {
    const fresh = seedShots()
    const stored = await db.shots.bulkGet(fresh.map((s) => s.id))
    const updates = seedUpdates(
      fresh,
      stored,
      settings.seededVersion === 0,
      // Was es auf diesem Geraet noch nie gab, kann dort auch niemand
      // geloescht haben.
      seedIdsSince(settings.seededVersion),
    )
    if (updates.length > 0) await db.shots.bulkPut(updates)
    await updateSettings({ seededVersion: SEED_VERSION })
  }

  await migrateTheme()
  await migrateDrillTexts()
  await migrateSeedStamps()
  await migrateLevels()
  await migrateRetired()
}

/**
 * Version der Tempo-Skala.
 *
 * 1 (bis 0.19.1): eine Zahl von 1 bis 10 ohne Einheit. Die Nachrechnung hat
 *   belegt, dass sie nichts bedeutete.
 * 2 (ab 0.19.2): Tischlaengen - der Weg, den der Weisse von der Kopflinie aus
 *   allein rollen wuerde. Siehe domain/tempo.ts.
 */
export const SPEED_SCALE_VERSION = 2

/**
 * Rechnet gespeicherte Tempi auf Tischlaengen um.
 *
 * Betrifft jede Uebung auf dem Geraet, auch die selbstgebaute: Der Wert steht
 * im selben Feld und wird ab jetzt anders gelesen. Wer nichts umrechnet,
 * bekaeme aus "Tempo 8" ploetzlich einen Stoss ueber acht Tischlaengen.
 *
 * Laeuft vor dem Einspielen der Sammlung, damit die neuen, gemessenen Tempi
 * der mitgelieferten Uebungen nicht gleich wieder umgerechnet werden.
 */
async function migrateSpeedScale(): Promise<void> {
  const settings = await getSettings()
  if (settings.speedScaleVersion >= SPEED_SCALE_VERSION) return

  const alle = await db.shots.toArray()
  const updates = speedScaleUpdates(alle)
  if (updates.length > 0) await db.shots.bulkPut(updates)
  await updateSettings({ speedScaleVersion: SPEED_SCALE_VERSION })
}

/**
 * Reine Form derselben Regel - ohne Datenbank pruefbar.
 *
 * @param shots Alle gespeicherten Uebungen.
 * @returns Die Uebungen, deren Tempo sich aendert.
 */
export function speedScaleUpdates(shots: Shot[]): Shot[] {
  return shots.flatMap((alt) => {
    const speed = speedFromLegacy(alt.attributes.speed)
    if (speed === alt.attributes.speed) return []
    return [{ ...alt, attributes: { ...alt.attributes, speed } }]
  })
}

/**
 * Raeumt Uebungen weg, die nicht mehr mitgeliefert werden.
 *
 * Das Gegenstueck zum Einspielen: das schreibt nur und loescht nie, also
 * bliebe eine zurueckgezogene Vorlage fuer immer auf dem Geraet stehen - auf
 * dem des Nutzers, nicht in der Sammlung, und niemand koennte sich erklaeren,
 * woher sie kommt.
 *
 * Weggeraeumt wird nur die unberuehrte Vorlage. Wer eine solche Uebung im
 * Baukasten bearbeitet hat (builtIn === false), hat sie zu seiner gemacht;
 * sie zu loeschen hiesse, fremde Arbeit wegzuwerfen, weil wir unsere Meinung
 * geaendert haben. Dieselbe Abwaegung wie beim Einspielen.
 *
 * Einen Versionszaehler braucht es nicht: nach dem ersten Lauf findet die
 * Regel nichts mehr.
 */
async function migrateRetired(): Promise<void> {
  const ids = Object.keys(RETIRED_IDS)
  const stored = await db.shots.bulkGet(ids)
  const weg = retiredRemovals(ids, stored)
  if (weg.length > 0) await db.shots.bulkDelete(weg)
}

/**
 * Reine Form derselben Regel - ohne Datenbank pruefbar.
 *
 * @param ids Die zurueckgezogenen Kennungen.
 * @param stored Der gespeicherte Stand zu denselben Ids, in derselben Folge.
 * @returns Die Ids, die geloescht werden duerfen.
 */
export function retiredRemovals(ids: string[], stored: (Shot | undefined)[]): string[] {
  return ids.filter((_id, i) => stored[i]?.builtIn === true)
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
 * Eine neue Uebung fehlt im Bestand aber genauso wie eine geloeschte - am
 * Bestand allein sind die zwei Faelle nicht zu unterscheiden. Bis 0.17.0 fiel
 * das nicht auf, weil jede Erhoehung der SEED_VERSION nur vorhandene Vorlagen
 * korrigierte. Mit 0.18.0 waechst die Sammlung zum ersten Mal, und ohne
 * `neueIds` kaeme keine der 19 neuen Uebungen auf einem Geraet an, auf dem die
 * App schon einmal gelaufen ist.
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
 * @param neueIds Ids, die es auf diesem Geraet noch nie gab. Ohne Angabe
 *        gilt jede fehlende Uebung als geloescht.
 */
export function seedUpdates(
  fresh: Shot[],
  stored: (Shot | undefined)[],
  erstlauf: boolean,
  neueIds: Set<string> = new Set(),
): Shot[] {
  return fresh.flatMap((neu, i) => {
    const alt = stored[i]
    // Der Favorit ist eine Entscheidung des Nutzers und steht nicht in der
    // Vorlage.
    if (erstlauf) return [{ ...neu, favorite: alt?.favorite ?? false }]
    if (!alt) return neueIds.has(neu.id) ? [{ ...neu, favorite: false }] : []
    if (alt.builtIn !== true) return []
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
 * Haengt die Lernstufe an mitgelieferte Uebungen, die noch keine tragen.
 *
 * Warum eine eigene Migration und nicht einfach SEED_VERSION hochzaehlen:
 * Das Einspielen der Sammlung laesst eine Fassung des Nutzers bewusst in Ruhe
 * (seedUpdates oben). Genau die bekaeme dann nie eine Stufe und fiele aus
 * jedem Filter heraus - obwohl die Stufe nichts am Stoss aendert, sondern nur
 * sagt, wo er in der Sammlung steht. Diese Regel hier erreicht beide: die
 * unberuehrte Vorlage und die uebernommene Fassung.
 *
 * Angefasst wird nur, wo noch keine Stufe steht. Wer im Baukasten eine andere
 * waehlt, behaelt sie.
 *
 * Die Stufe geht nicht in den Fingerabdruck ein (seedStamp.ts), deshalb
 * entsteht dabei kein Hinweis auf eine ueberarbeitete Vorlage.
 *
 * Einen Versionszaehler braucht es nicht: nach dem ersten Lauf traegt jede
 * betroffene Uebung eine Stufe, und die Regel findet nichts mehr.
 */
async function migrateLevels(): Promise<void> {
  const fresh = seedShots()
  const stored = await db.shots.bulkGet(fresh.map((s) => s.id))
  const updates = levelUpdates(fresh, stored)
  if (updates.length > 0) await db.shots.bulkPut(updates)
}

/**
 * Reine Form derselben Regel - ohne Datenbank pruefbar.
 *
 * @param fresh Die Uebungen der Vorlage.
 * @param stored Der gespeicherte Stand zu denselben Ids, in derselben Folge.
 */
export function levelUpdates(fresh: Shot[], stored: (Shot | undefined)[]): Shot[] {
  return fresh.flatMap((neu, i) => {
    const alt = stored[i]
    if (!alt || alt.level || !neu.level) return []
    return [{ ...alt, level: neu.level }]
  })
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
