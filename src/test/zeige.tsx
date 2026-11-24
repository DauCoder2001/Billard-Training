/**
 * Handgriffe fuer Oberflaechentests: eine Seite zeichnen und die Datenbank
 * leeren.
 *
 * Gezeichnet wird eine einzelne Seite, nicht die ganze App. Der Router der
 * App steht als einzelnes Stueck im Modul und wuerde von allen Tests geteilt;
 * hier bekommt jeder Test seinen eigenen. Adresse und Muster sind getrennt,
 * damit eine Seite mit Platzhalter - /session/:id - unter einer echten
 * Adresse laufen kann.
 */

import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { db } from '@/data/db'
import { DialogsProvider } from '@/ui/Dialogs'

interface Ort {
  /** Die Adresse, unter der die Seite aufgerufen wird. */
  pfad: string
  /** Das Muster der Route, falls es Platzhalter enthaelt. */
  muster?: string
}

export function zeige(seite: ReactElement, ort: Ort = { pfad: '/' }) {
  const router = createMemoryRouter(
    [
      { path: ort.muster ?? ort.pfad, element: seite },
      // Wohin die Seite fuehrt, soll der Test lesen koennen. Ohne diese
      // Auffangroute wirft der Router beim ersten Weiterleiten.
      { path: '*', element: <p>woanders</p> },
    ],
    { initialEntries: [ort.pfad] },
  )

  return {
    ...render(
      <DialogsProvider>
        <RouterProvider router={router} />
      </DialogsProvider>,
    ),
    /** Zum Nachlesen, wo die Seite hingefuehrt hat. */
    adresse: () => router.state.location.pathname,
  }
}

/** Leert alle Tabellen. Gehoert in ein beforeEach jeder Testdatei. */
export async function frischeDatenbank(): Promise<void> {
  await Promise.all(db.tables.map((t) => t.clear()))
}
