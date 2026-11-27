/**
 * Die Stossseite - der zweite Ort derselben Regel.
 *
 * Befund 51 war, dass Baukasten und Stossseite "Übung löschen" nach
 * verschiedenen Regeln anboten. Dieser Test haelt die Stossseite fest, der
 * Test im Baukasten die andere Seite; zusammen halten sie die Regel an beiden
 * Orten gleich.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useApp } from '@/app/store'
import { db } from '@/data/db'
import { DEFAULT_SETTINGS } from '@/data/repositories/settings'
import { seedShotById } from '@/data/seed/drills'
import { createShot } from '@/domain/shot'
import { DEFAULT_MARKINGS } from '@/domain/types'
import { frischeDatenbank, zeige } from '@/test/zeige'
import { ShotDetailPage } from './ShotDetailPage'

const ORT = { pfad: '/shot/s1', muster: '/shot/:id' }

// Eine echte mitgelieferte Uebung: der Hinweis haengt daran, dass es zur Id
// eine Vorlage gibt.
const VORLAGE_ID = 'builtin-stop-kurz'
const AM_STOSS = { pfad: `/shot/${VORLAGE_ID}`, muster: '/shot/:id' }
const HINWEIS = /überarbeitete Vorlage/

/** Eine uebernommene Fassung der mitgelieferten Uebung. */
function uebernommen(seedStamp: string | undefined) {
  const vorlage = seedShotById(VORLAGE_ID)
  if (!vorlage) throw new Error(`Keine Vorlage zu ${VORLAGE_ID}`)
  return {
    ...vorlage,
    name: 'Meine Fassung',
    coachNotes: 'Meine Notiz',
    builtIn: false,
    seedStamp,
  }
}

beforeEach(async () => {
  await frischeDatenbank()
  useApp.setState({ settings: { ...DEFAULT_SETTINGS }, ready: true, error: null })
})

describe('Stossseite', () => {
  it('bietet an einem mitgelieferten Stoss kein Loeschen an', async () => {
    await db.shots.add({ ...createShot({ id: 's1', name: 'Bandenball' }), builtIn: true })

    zeige(<ShotDetailPage />, ORT)

    expect(await screen.findByRole('heading', { name: 'Bandenball' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Übung löschen' })).toBeNull()
  })

  it('loescht einen eigenen Stoss nach Rueckfrage', async () => {
    await db.shots.add(createShot({ id: 's1', name: 'Meine Übung' }))
    const { adresse } = zeige(<ShotDetailPage />, ORT)

    await userEvent.click(await screen.findByRole('button', { name: 'Übung löschen' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Löschen' }))

    expect(await db.shots.count()).toBe(0)
    expect(adresse()).toBe('/library')
  })

  it('sagt, wenn es den Stoss nicht gibt', async () => {
    zeige(<ShotDetailPage />, ORT)

    expect(await screen.findByRole('heading', { name: 'Übung nicht gefunden' })).toBeTruthy()
    expect(screen.queryByText(/Wird geladen/)).toBeNull()
  })
})

/**
 * Der Hinweis auf eine ueberarbeitete Vorlage.
 *
 * Bis hierher ging eine spaetere Korrektur an einer uebernommenen Uebung
 * stillschweigend vorbei. Geprueft wird deshalb beides: dass der Hinweis
 * kommt, wenn er soll - und dass er schweigt, wenn es nichts zu sagen gibt.
 */
describe('Stossseite: ueberarbeitete Vorlage', () => {
  it('meldet eine uebernommene Fassung mit altem Stand', async () => {
    await db.shots.add(uebernommen('alt'))

    zeige(<ShotDetailPage />, AM_STOSS)

    expect(await screen.findByRole('heading', { name: 'Meine Fassung' })).toBeTruthy()
    expect(screen.getByText(HINWEIS)).toBeTruthy()
  })

  it('schweigt, wenn die eigene Fassung den heutigen Stand traegt', async () => {
    await db.shots.add(uebernommen(seedShotById(VORLAGE_ID)?.seedStamp))

    zeige(<ShotDetailPage />, AM_STOSS)

    expect(await screen.findByRole('heading', { name: 'Meine Fassung' })).toBeTruthy()
    expect(screen.queryByText(HINWEIS)).toBeNull()
  })

  it('schweigt bei einer unveraenderten mitgelieferten Uebung', async () => {
    // Die holt die Aktualisierung der Sammlung von selbst ein.
    const vorlage = seedShotById(VORLAGE_ID)
    await db.shots.add({ ...vorlage!, seedStamp: 'alt' })

    zeige(<ShotDetailPage />, AM_STOSS)

    expect(await screen.findByRole('heading', { name: 'Stop-Shot kurz' })).toBeTruthy()
    expect(screen.queryByText(HINWEIS)).toBeNull()
  })

  it('beendet den Hinweis, ohne die eigene Fassung anzutasten', async () => {
    await db.shots.add(uebernommen('alt'))
    zeige(<ShotDetailPage />, AM_STOSS)

    await userEvent.click(await screen.findByRole('button', { name: 'Meine Fassung behalten' }))

    await waitFor(() => expect(screen.queryByText(HINWEIS)).toBeNull())
    const gespeichert = await db.shots.get(VORLAGE_ID)
    expect(gespeichert?.name).toBe('Meine Fassung')
    expect(gespeichert?.coachNotes).toBe('Meine Notiz')
    expect(gespeichert?.builtIn).toBe(false)
    expect(gespeichert?.seedStamp).toBe(seedShotById(VORLAGE_ID)?.seedStamp)
  })

  it('zeigt beide Fassungen und nennt, was anders ist', async () => {
    // Die eigene Fassung weicht in Name und Hinweis ab; der Aufbau ist
    // derselbe. Genau das soll dastehen - nicht mehr und nicht weniger.
    await db.shots.add(uebernommen('alt'))
    zeige(<ShotDetailPage />, AM_STOSS)

    await userEvent.click(await screen.findByRole('button', { name: 'Vorlage ansehen' }))

    const dialog = await screen.findByRole('dialog', { name: 'Überarbeitete Vorlage' })
    expect(within(dialog).getByText('Deine Fassung')).toBeTruthy()
    expect(within(dialog).getByText('Überarbeitete Vorlage', { selector: 'strong' })).toBeTruthy()
    // Zwei Tische nebeneinander - das ist der Sinn des Vergleichs.
    expect(dialog.querySelectorAll('svg').length).toBe(2)
    expect(within(dialog).getByText('Name')).toBeTruthy()
    expect(within(dialog).getByText('Hinweis')).toBeTruthy()
    expect(within(dialog).queryByText('Ballpositionen und Wege')).toBeNull()
  })

  it('holt die Vorlage aus dem Vergleich zurueck und behaelt den Favoriten', async () => {
    await db.shots.add({ ...uebernommen('alt'), favorite: true })
    zeige(<ShotDetailPage />, AM_STOSS)

    await userEvent.click(await screen.findByRole('button', { name: 'Vorlage ansehen' }))
    const dialog = await screen.findByRole('dialog', { name: 'Überarbeitete Vorlage' })
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Auf Vorlage zurücksetzen' }),
    )

    await waitFor(async () => {
      const gespeichert = await db.shots.get(VORLAGE_ID)
      expect(gespeichert?.name).toBe('Stop-Shot kurz')
    })
    const gespeichert = await db.shots.get(VORLAGE_ID)
    expect(gespeichert?.coachNotes).toBe(seedShotById(VORLAGE_ID)?.coachNotes)
    expect(gespeichert?.builtIn).toBe(true)
    expect(gespeichert?.favorite).toBe(true)
  })

  it('behaelt die eigene Fassung auch aus dem Vergleich heraus', async () => {
    await db.shots.add(uebernommen('alt'))
    zeige(<ShotDetailPage />, AM_STOSS)

    await userEvent.click(await screen.findByRole('button', { name: 'Vorlage ansehen' }))
    const dialog = await screen.findByRole('dialog', { name: 'Überarbeitete Vorlage' })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Meine Fassung behalten' }))

    await waitFor(() => expect(screen.queryByText(HINWEIS)).toBeNull())
    const gespeichert = await db.shots.get(VORLAGE_ID)
    expect(gespeichert?.name).toBe('Meine Fassung')
    expect(gespeichert?.seedStamp).toBe(seedShotById(VORLAGE_ID)?.seedStamp)
  })

  it('laesst den Fokus nicht ins Leere laufen', async () => {
    // Beide Wege raeumen den Knopf weg, auf den gerade gedrueckt wurde.
    // Ohne Weiterreichen landet der Fokus auf dem Seitenkoerper, und der
    // Weg mit der Tastatur beginnt wieder ganz vorn.
    await db.shots.add(uebernommen('alt'))
    zeige(<ShotDetailPage />, AM_STOSS)

    await userEvent.click(await screen.findByRole('button', { name: 'Meine Fassung behalten' }))

    await waitFor(() => expect(screen.queryByText(HINWEIS)).toBeNull())
    expect(document.activeElement).toBe(screen.getByRole('heading', { level: 1 }))
  })

  it('laesst den Fokus auch nach dem Zuruecksetzen nicht ins Leere laufen', async () => {
    await db.shots.add(uebernommen('alt'))
    zeige(<ShotDetailPage />, AM_STOSS)

    await userEvent.click(await screen.findByRole('button', { name: 'Vorlage ansehen' }))
    const dialog = await screen.findByRole('dialog', { name: 'Überarbeitete Vorlage' })
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Auf Vorlage zurücksetzen' }),
    )

    await waitFor(() => expect(screen.queryByText(HINWEIS)).toBeNull())
    expect(document.activeElement).toBe(screen.getByRole('heading', { level: 1 }))
  })

  it('aendert nichts, wer spaeter entscheiden will', async () => {
    await db.shots.add(uebernommen('alt'))
    zeige(<ShotDetailPage />, AM_STOSS)

    await userEvent.click(await screen.findByRole('button', { name: 'Vorlage ansehen' }))
    const dialog = await screen.findByRole('dialog', { name: 'Überarbeitete Vorlage' })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Später entscheiden' }))

    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Überarbeitete Vorlage' })).toBeNull(),
    )
    const gespeichert = await db.shots.get(VORLAGE_ID)
    expect(gespeichert?.name).toBe('Meine Fassung')
    expect(gespeichert?.seedStamp).toBe('alt')
    expect(screen.getByText(HINWEIS)).toBeTruthy()
  })
})

describe('Das Bild der Stossseite', () => {
  it('bleibt ruhig, auch wenn der Baukasten alle Hilfen zeigt', async () => {
    useApp.setState({
      settings: {
        ...DEFAULT_SETTINGS,
        markings: {
          ...DEFAULT_MARKINGS,
          guides: true,
          breakBox: true,
          rackOutline: true,
          grid: true,
        },
      },
    })
    await db.shots.add(createShot({ id: 's1', name: 'Meine Übung' }))
    zeige(<ShotDetailPage />, ORT)
    await screen.findByRole('heading', { name: 'Meine Übung' })

    // Die Einstellungen gelten dort, wo der Tisch die Arbeitsflaeche ist -
    // Baukasten und Training. Feste Diagramme behalten ihr eigenes Bild.
    expect(document.querySelector('[data-ebene="hilfslinien"]')).toBeNull()
    expect(document.querySelector('[data-ebene="breakbox"]')).toBeNull()
    expect(document.querySelector('[data-ebene="dreieck"]')).toBeNull()
    expect(document.querySelector('[data-ebene="raster"]')).toBeNull()
  })
})

describe('Die Zieltasche auf der Stossseite', () => {
  it('nennt sie bei einer gewoehnlichen Uebung', async () => {
    const vorlage = seedShotById('builtin-stop-kurz')
    if (!vorlage) throw new Error('Keine Vorlage zu builtin-stop-kurz')
    await db.shots.add({ ...vorlage, id: 's1' })

    zeige(<ShotDetailPage />, ORT)

    expect(await screen.findByText(/^Zieltasche:/)).toBeTruthy()
  })

  it('verschweigt sie, wo das Einlochen nicht zaehlt', async () => {
    // Bei einer Safe soll der Objektball liegen bleiben. Eine "Zieltasche"
    // direkt ueber dem Hinweis "Der Objektball soll leben bleiben, nicht
    // fallen" sagt dem Spieler das Gegenteil.
    const safe = seedShotById('builtin-safe-hinter-ball')
    if (!safe) throw new Error('Keine Vorlage zur Safe')
    await db.shots.add({ ...safe, id: 's1' })

    zeige(<ShotDetailPage />, ORT)

    expect(await screen.findByRole('heading', { name: 'Safe hinter den Ball' })).toBeTruthy()
    expect(screen.queryByText(/^Zieltasche:/)).toBeNull()
    // Der Schnittwinkel bleibt stehen: er ist die Ansage, die ohne Tasche
    // sonst niemand mehr findet.
    expect(screen.getByText('55.0°')).toBeTruthy()
  })
})
