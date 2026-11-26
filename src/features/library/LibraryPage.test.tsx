/**
 * Die Seite "Stoesse" - Suchen, Filtern, Sortieren.
 *
 * Sie war die einzige Hauptseite ohne eigene Pruefung (Befund 70), obwohl
 * drei Dinge hier zusammenlaufen: die Filter, die Zaehlung "x von y" und die
 * Sortierung. Besonders die Regel "nie geuebte Stoesse ans Ende" bei
 * "Schwaechstes zuerst" ist eine Entscheidung, keine Selbstverstaendlichkeit -
 * ohne sie staenden die ungeuebten mit -1 Punkten ganz vorn.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useApp } from '@/app/store'
import { db } from '@/data/db'
import { DEFAULT_SETTINGS } from '@/data/repositories/settings'
import { createShot } from '@/domain/shot'
import type { Session, Shot } from '@/domain/types'
import { frischeDatenbank, zeige } from '@/test/zeige'
import { LibraryPage } from './LibraryPage'

const ORT = { pfad: '/library' }

function stoss(partial: Partial<Shot>, attribute: Partial<Shot['attributes']> = {}): Shot {
  const basis = createShot(partial)
  return { ...basis, attributes: { ...basis.attributes, ...attribute } }
}

/** Drei Stoesse, die sich in jedem Filter unterscheiden. */
const STOESSE: Shot[] = [
  stoss(
    { id: 's1', name: 'Bandenball lang' },
    { shotType: 'bank', difficulty: 8, skills: ['bank'] },
  ),
  stoss(
    { id: 's2', name: 'Kurzer Stopper', favorite: true },
    { shotType: 'cut', difficulty: 2, skills: ['stun'] },
  ),
  stoss(
    { id: 's3', name: 'Zentrum halten' },
    { shotType: 'position', difficulty: 5, skills: ['position'] },
  ),
]

function einheit(shotId: string, score: number, finishedAt: number): Session {
  return {
    id: `e-${shotId}`,
    shotId,
    playerId: 'p1',
    format: 'quick',
    attempts: 10,
    results: [],
    score,
    proficiency: 'proficient',
    startedAt: finishedAt - 1,
    finishedAt,
  }
}

/** Die Namen der Karten in der Reihenfolge, in der sie stehen. */
function namen(): string[] {
  return screen
    .getAllByRole('link')
    .map((karte) => karte.querySelector('strong')?.textContent?.replace('★ ', '').trim() ?? '')
}

beforeEach(async () => {
  await frischeDatenbank()
  await db.players.add({ id: 'p1', name: 'Matthias', color: '#e8b530', skillRatings: {}, createdAt: 0 })
  await db.shots.bulkAdd(STOESSE)
  useApp.setState({
    settings: { ...DEFAULT_SETTINGS, activePlayerId: 'p1' },
    ready: true,
    error: null,
  })
})

describe('Die Seite Stoesse', () => {
  it('zeigt alle Stoesse nach Namen sortiert und zaehlt sie', async () => {
    zeige(<LibraryPage />, ORT)

    expect(await screen.findByText('3 von 3')).toBeTruthy()
    expect(namen()).toEqual(['Bandenball lang', 'Kurzer Stopper', 'Zentrum halten'])
  })

  it('sucht im Namen und zaehlt nur noch die Treffer', async () => {
    zeige(<LibraryPage />, ORT)
    await screen.findByText('3 von 3')

    await userEvent.type(screen.getByPlaceholderText('Suchen …'), 'kurz')

    expect(await screen.findByText('1 von 3')).toBeTruthy()
    expect(namen()).toEqual(['Kurzer Stopper'])
  })

  it('sagt es, wenn kein Stoss passt', async () => {
    zeige(<LibraryPage />, ORT)
    await screen.findByText('3 von 3')

    await userEvent.type(screen.getByPlaceholderText('Suchen …'), 'Querschlaeger')

    expect(await screen.findByText('Keine Übung passt zu den Filtern')).toBeTruthy()
    expect(screen.queryAllByRole('link')).toEqual([])
  })

  it('klappt die Filter auf und zu und meldet den Zustand', async () => {
    zeige(<LibraryPage />, ORT)

    const knopf = await screen.findByRole('button', { name: 'Filter' })
    expect(knopf.getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByRole('button', { name: '★ Favoriten' })).toBeNull()

    await userEvent.click(knopf)

    expect(knopf.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByRole('button', { name: '★ Favoriten' })).toBeTruthy()

    await userEvent.click(knopf)

    expect(knopf.getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByRole('button', { name: '★ Favoriten' })).toBeNull()
  })

  it('filtert auf Favoriten, zaehlt die Filter im Knopf und setzt sie zurueck', async () => {
    zeige(<LibraryPage />, ORT)
    await userEvent.click(await screen.findByRole('button', { name: 'Filter' }))

    await userEvent.click(screen.getByRole('button', { name: '★ Favoriten' }))

    expect(await screen.findByText('1 von 3')).toBeTruthy()
    expect(namen()).toEqual(['Kurzer Stopper'])
    // Die Zahl im Knopf sagt, wie viele Filter gerade greifen.
    expect(screen.getByRole('button', { name: 'Filter (1)' })).toBeTruthy()

    await userEvent.click(screen.getByRole('button', { name: 'Filter zurücksetzen' }))

    expect(await screen.findByText('3 von 3')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Filter' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Filter zurücksetzen' })).toBeNull()
  })

  it('stellt bei "Schwaechstes zuerst" die nie geuebten Stoesse ans Ende', async () => {
    await db.sessions.bulkAdd([einheit('s1', 30, 100), einheit('s3', 80, 200)])
    zeige(<LibraryPage />, ORT)
    await screen.findByText('3 von 3')

    await userEvent.selectOptions(screen.getByRole('combobox'), 'weakest')

    // s1 mit 30 %, dann s3 mit 80 %, und der nie geuebte s2 ganz hinten.
    expect(namen()).toEqual(['Bandenball lang', 'Zentrum halten', 'Kurzer Stopper'])
  })

  it('sortiert auf Wunsch nach Schwierigkeit', async () => {
    zeige(<LibraryPage />, ORT)
    await screen.findByText('3 von 3')

    await userEvent.selectOptions(screen.getByRole('combobox'), 'difficulty')

    expect(namen()).toEqual(['Kurzer Stopper', 'Zentrum halten', 'Bandenball lang'])
  })
})
