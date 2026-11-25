/**
 * Die Fehleranzeige und der Weg des Routers dorthin (Befund 72).
 *
 * Vorher fing der Router Fehler in einer Seite selbst ab und zeigte seine
 * englische Entwickleransicht ("Unexpected Application Error!"). Gewacht wird
 * hier ueber zweierlei: dass die Anzeige das Noetige zeigt, und dass der
 * Router sie ueberhaupt bekommt - also dass errorElement gesetzt bleibt.
 */

import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { routen } from './App'
import { ErrorView, RouteError } from './ErrorView'

/** Eine Seite, die beim Zeichnen scheitert - wie ein fehlendes Buendel. */
function KaputteSeite(): never {
  throw new Error('Failed to fetch dynamically imported module')
}

describe('Die Fehleranzeige', () => {
  it('nennt den Fehler, die Version und beide Auswege', () => {
    render(<ErrorView error={new Error('Etwas ging schief')} />)

    expect(screen.getByRole('heading', { name: 'Da ist etwas schiefgegangen' })).toBeTruthy()
    expect(screen.getByText(/Etwas ging schief/)).toBeTruthy()
    expect(screen.getByText(new RegExp(`Billard Training ${__APP_VERSION__}`))).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Neu laden' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Zum Start' })).toBeTruthy()
  })

  it('kommt auch mit etwas zurecht, das kein Fehler ist', () => {
    render(<ErrorView error="Nur ein Satz" />)

    expect(screen.getByText(/Nur ein Satz/)).toBeTruthy()
  })
})

describe('Ein Fehler in einer Seite', () => {
  it('landet in der eigenen Anzeige statt in der des Routers', () => {
    // Der Router schreibt den Fehler in die Konsole; das ist hier erwartet.
    const stille = vi.spyOn(console, 'error').mockImplementation(() => {})
    const router = createMemoryRouter(
      [{ path: '/', element: <KaputteSeite />, errorElement: <RouteError /> }],
      { initialEntries: ['/'] },
    )

    render(<RouterProvider router={router} />)

    expect(screen.getByRole('heading', { name: 'Da ist etwas schiefgegangen' })).toBeTruthy()
    expect(screen.getByText(/Failed to fetch dynamically imported module/)).toBeTruthy()
    expect(screen.queryByText(/Unexpected Application Error/)).toBeNull()
    stille.mockRestore()
  })

  it('hat im Programm selbst eine Anzeige hinterlegt', () => {
    // Ohne errorElement an der obersten Route faellt jede Seite wieder in die
    // Entwickleransicht zurueck.
    expect(routen).toHaveLength(1)
    expect(routen[0].errorElement).toBeTruthy()
  })
})
