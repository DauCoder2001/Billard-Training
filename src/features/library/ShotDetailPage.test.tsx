/**
 * Die Stossseite - der zweite Ort derselben Regel.
 *
 * Befund 51 war, dass Baukasten und Stossseite "Stoß löschen" nach
 * verschiedenen Regeln anboten. Dieser Test haelt die Stossseite fest, der
 * Test im Baukasten die andere Seite; zusammen halten sie die Regel an beiden
 * Orten gleich.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useApp } from '@/app/store'
import { db } from '@/data/db'
import { DEFAULT_SETTINGS } from '@/data/repositories/settings'
import { createShot } from '@/domain/shot'
import { frischeDatenbank, zeige } from '@/test/zeige'
import { ShotDetailPage } from './ShotDetailPage'

const ORT = { pfad: '/shot/s1', muster: '/shot/:id' }

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
