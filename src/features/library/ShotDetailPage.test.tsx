/**
 * Die Stossseite - der zweite Ort derselben Regel.
 *
 * Befund 51 war, dass Baukasten und Stossseite "Stoß löschen" nach
 * verschiedenen Regeln anboten. Dieser Test haelt die Stossseite fest, der
 * Test im Baukasten die andere Seite; zusammen halten sie die Regel an beiden
 * Orten gleich.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useApp } from '@/app/store'
import { db } from '@/data/db'
import { DEFAULT_SETTINGS } from '@/data/repositories/settings'
import { seedShotById } from '@/data/seed/drills'
import { createShot } from '@/domain/shot'
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
    expect(screen.queryByRole('button', { name: 'Stoß löschen' })).toBeNull()
  })

  it('loescht einen eigenen Stoss nach Rueckfrage', async () => {
    await db.shots.add(createShot({ id: 's1', name: 'Mein Stoß' }))
    const { adresse } = zeige(<ShotDetailPage />, ORT)

    await userEvent.click(await screen.findByRole('button', { name: 'Stoß löschen' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Löschen' }))

    expect(await db.shots.count()).toBe(0)
    expect(adresse()).toBe('/library')
  })

  it('sagt, wenn es den Stoss nicht gibt', async () => {
    zeige(<ShotDetailPage />, ORT)

    expect(await screen.findByRole('heading', { name: 'Stoß nicht gefunden' })).toBeTruthy()
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

  it('holt die Vorlage nach Rueckfrage zurueck und behaelt den Favoriten', async () => {
    await db.shots.add({ ...uebernommen('alt'), favorite: true })
    zeige(<ShotDetailPage />, AM_STOSS)

    await userEvent.click(await screen.findByRole('button', { name: 'Auf Vorlage zurücksetzen' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Zurücksetzen' }))

    await waitFor(async () => {
      const gespeichert = await db.shots.get(VORLAGE_ID)
      expect(gespeichert?.name).toBe('Stop-Shot kurz')
    })
    const gespeichert = await db.shots.get(VORLAGE_ID)
    expect(gespeichert?.coachNotes).toBe(seedShotById(VORLAGE_ID)?.coachNotes)
    expect(gespeichert?.builtIn).toBe(true)
    expect(gespeichert?.favorite).toBe(true)
  })

  it('setzt bei Abbruch nichts zurueck', async () => {
    await db.shots.add(uebernommen('alt'))
    zeige(<ShotDetailPage />, AM_STOSS)

    await userEvent.click(await screen.findByRole('button', { name: 'Auf Vorlage zurücksetzen' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Abbrechen' }))

    const gespeichert = await db.shots.get(VORLAGE_ID)
    expect(gespeichert?.name).toBe('Meine Fassung')
    expect(screen.getByText(HINWEIS)).toBeTruthy()
  })
})
