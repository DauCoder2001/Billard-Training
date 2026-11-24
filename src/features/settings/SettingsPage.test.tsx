/**
 * Die Einstellungsseite: Sicherung einspielen, Schwellen, Daten loeschen.
 *
 * Gewacht wird ueber drei Befunde:
 *
 * - 46: Die Einstellungen kommen nicht reaktiv aus der Datenbank, sondern
 *   stehen im App-Zustand. Eine eingespielte Sicherung schreibt direkt in die
 *   Datenbank - ohne das Nachziehen zeichnete die App weiter mit den alten
 *   Farben. Darum wird hier die *Anzeige* geprueft, nicht der Rueckgabewert.
 * - 52: Verdrehte Schwellen stufen ein halbes Ergebnis als "Meisterlich" ein.
 * - 56: Ein gescheitertes Loeschen blieb stumm.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useApp } from '@/app/store'
import { db } from '@/data/db'
import { DEFAULT_SETTINGS, getSettings } from '@/data/repositories/settings'
import { createShot } from '@/domain/shot'
import { frischeDatenbank, zeige } from '@/test/zeige'
import type { Backup } from '@/data/repositories/backup'
import type { Settings } from '@/domain/types'
import { SettingsPage } from './SettingsPage'

const ORT = { pfad: '/settings' }

function sicherung(): Backup {
  return {
    app: 'billard-training',
    version: 1,
    exportedAt: 0,
    shots: [createShot({ id: 's1', name: 'Aus der Sicherung' })],
    players: [{ id: 'p1', name: 'Matthias', color: '#e8b530', skillRatings: {}, createdAt: 0 }],
    sessions: [],
    workouts: [],
    settings: { ...DEFAULT_SETTINGS, clothColor: '#7a2f3a', orientation: 'portrait' },
  }
}

beforeEach(async () => {
  await frischeDatenbank()
  // Der App-Zustand ist ein einzelnes Stueck im Modul und ueberlebt sonst von
  // einem Test zum naechsten.
  useApp.setState({ settings: { ...DEFAULT_SETTINGS }, ready: true, error: null })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Sicherung einspielen', () => {
  it('zieht die Anzeige nach, nicht nur die Datenbank', async () => {
    const { container } = zeige(<SettingsPage />, ORT)
    const ausrichtung = screen.getByLabelText<HTMLSelectElement>('Ausrichtung des Diagramms')
    expect(ausrichtung.value).toBe('landscape')

    const datei = container.querySelector<HTMLInputElement>('input[type=file]')
    if (!datei) throw new Error('Keine Dateiauswahl gefunden')
    await userEvent.upload(
      datei,
      new File([JSON.stringify(sicherung())], 'sicherung.json', { type: 'application/json' }),
    )

    // Drei Antworten: hinzufuegen, ersetzen, abbrechen.
    await userEvent.click(await screen.findByRole('button', { name: 'Hinzufügen' }))
    await userEvent.click(await screen.findByRole('button', { name: 'OK' }))

    await waitFor(() => expect(ausrichtung.value).toBe('portrait'))
    expect(screen.getByRole('button', { name: 'Tuchfarbe #7a2f3a' }).style.outline).toContain(
      'solid',
    )
    expect(await db.shots.get('s1')).toBeTruthy()
  })
})

describe('Schwellen fuer die Einstufung', () => {
  it('schiebt die oberen Marken mit, wenn eine untere steigt', async () => {
    zeige(<SettingsPage />, ORT)
    const regler = screen.getByLabelText<HTMLInputElement>(/Im Aufbau ab/)

    fireEvent.change(regler, { target: { value: '95' } })

    expect(await screen.findByText('Im Aufbau ab 95 %')).toBeTruthy()
    expect(screen.getByText('Sicher ab 95 %')).toBeTruthy()
    expect(screen.getByText('Fortgeschritten ab 95 %')).toBeTruthy()
    expect(screen.getByText('Meisterlich ab 95 %')).toBeTruthy()
  })

  it('laesst eine obere Marke an der darunter stehen', async () => {
    zeige(<SettingsPage />, ORT)

    fireEvent.change(screen.getByLabelText<HTMLInputElement>(/Meisterlich ab/), {
      target: { value: '0' },
    })

    // Fortgeschritten steht bei 80 - tiefer kann Meisterlich nicht.
    expect(await screen.findByText('Meisterlich ab 80 %')).toBeTruthy()
    expect(screen.getByText('Im Aufbau ab 40 %')).toBeTruthy()
  })
})

describe('Markierungen auf dem Tuch', () => {
  it('legt ein einzelnes Haekchen um und laesst die uebrigen stehen', async () => {
    zeige(<SettingsPage />, ORT)

    const anstoss = await screen.findByRole('checkbox', { name: /Anstoßfeld/ })
    expect((anstoss as HTMLInputElement).checked).toBe(false)

    await userEvent.click(anstoss)

    await waitFor(() => expect(useApp.getState().settings.markings.breakBox).toBe(true))
    const markings = useApp.getState().settings.markings
    expect(markings.guides).toBe(DEFAULT_SETTINGS.markings.guides)
    expect(markings.diamonds).toBe(DEFAULT_SETTINGS.markings.diamonds)
    expect((await db.settings.get('settings'))?.markings.breakBox).toBe(true)
  })

  it('zeigt alle sieben Markierungen', async () => {
    zeige(<SettingsPage />, ORT)
    await screen.findByRole('heading', { name: 'Markierungen auf dem Tuch' })

    // Am Anfang verankert: "Diamanten" steht auch im Satz ueber das
    // Einrasten, und der ist ein anderes Haekchen.
    for (const name of [
      /^Diamanten /,
      /^Kopflinie /,
      /^Kopf- und Fußpunkt /,
      /^Hilfslinien /,
      /^Anstoßfeld /,
      /^Dreieck am Fußpunkt /,
      /^Punkteraster /,
    ]) {
      expect(screen.getByRole('checkbox', { name })).toBeTruthy()
    }
  })
})

/**
 * Keine Seite, sondern die Datenschicht - der Platz hier hat einen Grund:
 * die nachgebildete Datenbank steht nur im Profil "oberflaeche".
 */
describe('Einstellungen eines aelteren Standes', () => {
  it('fuellt fehlende Markierungen beim Laden auf', async () => {
    const alt = { ...DEFAULT_SETTINGS } as Partial<Settings>
    delete alt.markings
    await db.settings.put(alt as Settings)

    expect((await getSettings()).markings).toEqual(DEFAULT_SETTINGS.markings)
  })

  it('ergaenzt einzelne Haekchen, ohne die gesetzten zu verlieren', async () => {
    await db.settings.put({
      ...DEFAULT_SETTINGS,
      markings: { guides: false },
    } as unknown as Settings)

    const markings = (await getSettings()).markings
    expect(markings.guides).toBe(false)
    expect(markings.diamonds).toBe(true)
    expect(markings.grid).toBe(false)
  })
})

describe('Alle Daten loeschen', () => {
  it('meldet, wenn das Loeschen scheitert', async () => {
    // Nachgestellt: im Browser haelt etwa ein zweiter Tab die Datenbank fest.
    vi.spyOn(db, 'delete').mockRejectedValue(new Error('Testfall: abgewiesen'))
    zeige(<SettingsPage />, ORT)

    await userEvent.click(screen.getByRole('button', { name: 'Alle Daten löschen' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Alles löschen' }))
    await userEvent.type(await screen.findByLabelText('Bestätigung'), 'LÖSCHEN')
    await userEvent.click(screen.getByRole('button', { name: 'OK' }))

    expect(await screen.findByText(/Nicht gelöscht/)).toBeTruthy()
  })

  it('loescht nichts, wenn die Bestaetigung nicht stimmt', async () => {
    const geloescht = vi.spyOn(db, 'delete').mockResolvedValue(undefined)
    zeige(<SettingsPage />, ORT)

    await userEvent.click(screen.getByRole('button', { name: 'Alle Daten löschen' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Alles löschen' }))
    await userEvent.type(await screen.findByLabelText('Bestätigung'), 'loeschen')
    await userEvent.click(screen.getByRole('button', { name: 'OK' }))

    expect(await screen.findByText('Abgebrochen')).toBeTruthy()
    expect(geloescht).not.toHaveBeenCalled()
  })
})
