/**
 * Die Ergebnisseite einer Trainingseinheit - der erste Oberflaechentest.
 *
 * Geprueft wird der Ablauf, nicht die Rechnung: eine Seite wird gezeichnet,
 * liest aus der (nachgebildeten) Datenbank und soll das Richtige anzeigen.
 * Gewacht wird ueber Befund 48: useSession liefert undefined beim Lesen und
 * null, wenn es die Einheit nicht gibt. Wer beides zusammenwirft, zeigt fuer
 * immer "Wird geladen ..." - erreichbar nach dem Loeschen eines Stosses, denn
 * seine Historie geht mit ihm.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { db } from '@/data/db'
import { createShot } from '@/domain/shot'
import { frischeDatenbank, zeige } from '@/test/zeige'
import type { Attempt, Session } from '@/domain/types'
import { SessionSummaryPage } from './SessionSummaryPage'

const ORT = { pfad: '/session/e1', muster: '/session/:id' }

function versuche(n: number): Attempt[] {
  return Array.from({ length: n }, (_, i) => ({
    index: i,
    pocketed: true,
    scratch: false,
    cueBallEnd: null,
    points: 7,
  }))
}

function einheit(partial: Partial<Session> = {}): Session {
  return {
    id: 'e1',
    shotId: 's1',
    playerId: 'p1',
    format: 'quick',
    attempts: 10,
    results: versuche(10),
    score: 70,
    proficiency: 'proficient',
    startedAt: 1,
    finishedAt: 2,
    ...partial,
  }
}

beforeEach(async () => {
  await frischeDatenbank()
})

describe('Ergebnis einer Einheit', () => {
  it('zeigt Stoss und Ergebnis', async () => {
    await db.shots.add({ ...createShot({ id: 's1', name: 'Gerade Übung' }) })
    await db.sessions.add(einheit())

    zeige(<SessionSummaryPage />, ORT)

    expect(await screen.findByRole('heading', { name: 'Gerade Übung' })).toBeTruthy()
    expect(screen.getByText('70 %')).toBeTruthy()
  })

  it('sagt, dass es die Einheit nicht gibt', async () => {
    zeige(<SessionSummaryPage />, ORT)

    expect(await screen.findByRole('heading', { name: 'Einheit nicht gefunden' })).toBeTruthy()
    expect(screen.queryByText(/Wird geladen/)).toBeNull()
  })

  it('sagt, wenn der Stoss der Einheit geloescht wurde', async () => {
    // Die Einheit steht noch, ihr Stoss nicht mehr. Die Reihenfolge der
    // Pruefungen entscheidet, ob hier der richtige Satz steht.
    await db.sessions.add(einheit())

    zeige(<SessionSummaryPage />, ORT)

    expect(await screen.findByRole('heading', { name: 'Übung nicht gefunden' })).toBeTruthy()
  })

  it('fuehrt aus der Sackgasse zurueck zu den Stoessen', async () => {
    const { adresse } = zeige(<SessionSummaryPage />, ORT)
    await screen.findByRole('heading', { name: 'Einheit nicht gefunden' })

    await userEvent.click(screen.getByRole('button', { name: 'Zu den Übungen' }))

    expect(adresse()).toBe('/library')
  })
})
