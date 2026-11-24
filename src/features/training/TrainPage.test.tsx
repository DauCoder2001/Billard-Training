/**
 * Eine Einheit von Hand durchspielen und abschliessen.
 *
 * Der laengste der gepruesften Ablaeufe und der einzige, der etwas Bleibendes
 * schreibt: die erfassten Versuche stehen nirgends, bis die Einheit fertig
 * ist. Danach muss die Einheit in der Datenbank stehen, das Ergebnis stimmen
 * und das Koennen des Spielers fortgeschrieben sein.
 *
 * Geprueft wird mit einem Stoss, der nur das Einlochen bewertet - sonst
 * verlangt die Ansicht vorher einen Tipp auf den Tisch, und dafuer braeuchte
 * es Abmessungen, die es ohne echten Browser nicht gibt.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useApp } from '@/app/store'
import { db } from '@/data/db'
import { DEFAULT_SETTINGS } from '@/data/repositories/settings'
import { createShot } from '@/domain/shot'
import { DEFAULT_MARKINGS, DEFAULT_THRESHOLDS } from '@/domain/types'
import { frischeDatenbank, zeige } from '@/test/zeige'
import type { Shot } from '@/domain/types'
import { TrainPage } from './TrainPage'

const ORT = { pfad: '/train/s1?format=quick&attempts=2', muster: '/train/:id' }

function stoss(): Shot {
  const basis = createShot({ id: 's1', name: 'Gerader Stoß' })
  return {
    ...basis,
    attributes: { ...basis.attributes, skills: ['draw'], difficulty: 10 },
    scoring: {
      mode: 'pocket',
      targetZone: null,
      thresholds: { ...DEFAULT_THRESHOLDS },
      scratchRisk: false,
    },
  }
}

beforeEach(async () => {
  await frischeDatenbank()
  await db.players.add({
    id: 'p1',
    name: 'Matthias',
    color: '#e8b530',
    skillRatings: {},
    createdAt: 0,
  })
  await db.shots.add(stoss())
  useApp.setState({
    settings: { ...DEFAULT_SETTINGS, activePlayerId: 'p1' },
    ready: true,
    error: null,
  })
})

describe('Eine Einheit abschliessen', () => {
  it('speichert das Ergebnis und schreibt das Koennen fort', async () => {
    const { adresse } = zeige(<TrainPage />, ORT)

    await userEvent.click(await screen.findByRole('button', { name: 'Eingelocht' }))
    await userEvent.click(screen.getByRole('button', { name: 'Eingelocht' }))

    await waitFor(() => expect(adresse()).toMatch(/^\/session\//))
    const einheiten = await db.sessions.toArray()
    expect(einheiten).toHaveLength(1)
    expect(einheiten[0].score).toBe(100)
    expect(einheiten[0].proficiency).toBe('exemplary')
    expect(einheiten[0].finishedAt).not.toBeNull()

    const spieler = await db.players.get('p1')
    expect(spieler?.skillRatings.draw).toBe(100)
  })

  it('zaehlt einen Kratzer als Fehlversuch', async () => {
    zeige(<TrainPage />, ORT)

    await userEvent.click(await screen.findByRole('button', { name: 'Kratzer' }))
    await userEvent.click(screen.getByRole('button', { name: 'Eingelocht' }))

    await waitFor(async () => expect(await db.sessions.count()).toBe(1))
    const [einheit] = await db.sessions.toArray()
    // Ein Treffer von zwei geplanten Versuchen: die Haelfte der Punkte.
    expect(einheit.score).toBe(50)
    expect(einheit.results.map((r) => r.points)).toEqual([0, 10])
  })

  it('schreibt nichts, solange die Einheit nicht fertig ist', async () => {
    zeige(<TrainPage />, ORT)

    await userEvent.click(await screen.findByRole('button', { name: 'Eingelocht' }))

    expect(await db.sessions.count()).toBe(0)
  })
})

describe('Markierungen beim Training', () => {
  it('folgt den Einstellungen, nicht einer eigenen Vorgabe', async () => {
    useApp.setState({
      settings: {
        ...DEFAULT_SETTINGS,
        activePlayerId: 'p1',
        markings: { ...DEFAULT_MARKINGS, guides: false, breakBox: true },
      },
    })
    zeige(<TrainPage />, ORT)
    await screen.findByText('Gerader Stoß')

    expect(document.querySelector('[data-ebene="hilfslinien"]')).toBeNull()
    expect(document.querySelector('[data-ebene="breakbox"]')).toBeTruthy()
  })
})
