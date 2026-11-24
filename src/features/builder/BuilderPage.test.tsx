/**
 * Der Baukasten: Speichern macht eine mitgelieferte Uebung zu deiner.
 *
 * Gewacht wird ueber die Befunde 47 und 51. Beide haengen an einer einzigen
 * Marke: builtIn. Wer eine mitgelieferte Uebung speichert, uebernimmt sie -
 * ab da geht die Aktualisierung der Sammlung daran vorbei (bootstrap.ts), und
 * ab da darf sie geloescht werden. Vorher nicht, denn die Stossseite bot das
 * nie an und die naechste Aktualisierung holte den Stoss ohnehin zurueck.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useApp } from '@/app/store'
import { db } from '@/data/db'
import { DEFAULT_SETTINGS } from '@/data/repositories/settings'
import { createShot } from '@/domain/shot'
import { frischeDatenbank, zeige } from '@/test/zeige'
import { BuilderPage } from './BuilderPage'

const ORT = { pfad: '/builder/s1', muster: '/builder/:id' }

beforeEach(async () => {
  await frischeDatenbank()
  useApp.setState({ settings: { ...DEFAULT_SETTINGS }, ready: true, error: null })
})

describe('Baukasten an einem mitgelieferten Stoss', () => {
  it('bietet kein Loeschen an, Duplizieren aber schon', async () => {
    await db.shots.add({ ...createShot({ id: 's1', name: 'Bandenball' }), builtIn: true })

    zeige(<BuilderPage />, ORT)

    expect(await screen.findByRole('button', { name: 'Duplizieren' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Stoß löschen' })).toBeNull()
  })

  it('uebernimmt ihn beim Speichern und gibt das Loeschen frei', async () => {
    await db.shots.add({ ...createShot({ id: 's1', name: 'Bandenball' }), builtIn: true })
    zeige(<BuilderPage />, ORT)
    await screen.findByRole('button', { name: 'Duplizieren' })

    await userEvent.click(screen.getByRole('button', { name: 'Speichern' }))

    expect(await screen.findByRole('button', { name: 'Stoß löschen' })).toBeTruthy()
    const gespeichert = await db.shots.get('s1')
    expect(gespeichert?.builtIn).toBe(false)
    expect(gespeichert?.name).toBe('Bandenball')
  })
})

describe('Baukasten an einem eigenen Stoss', () => {
  it('loescht ihn nach Rueckfrage und fuehrt zurueck zu den Stoessen', async () => {
    await db.shots.add(createShot({ id: 's1', name: 'Mein Stoß' }))
    const { adresse } = zeige(<BuilderPage />, ORT)

    await userEvent.click(await screen.findByRole('button', { name: 'Stoß löschen' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Löschen' }))

    expect(await db.shots.count()).toBe(0)
    expect(adresse()).toBe('/library')
  })

  it('laesst ihn stehen, wenn die Rueckfrage abgebrochen wird', async () => {
    await db.shots.add(createShot({ id: 's1', name: 'Mein Stoß' }))
    zeige(<BuilderPage />, ORT)

    await userEvent.click(await screen.findByRole('button', { name: 'Stoß löschen' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Abbrechen' }))

    expect(await db.shots.count()).toBe(1)
  })
})
