/**
 * Nachgeladene Programmteile ueber eine Aktualisierung hinwegretten.
 *
 * Baukasten, Training, Workout-Lauf, Importseite und der Teilen-Dialog kommen
 * als eigene Dateien nach; ihr Name traegt eine Pruefsumme des Inhalts. Wird
 * die Seite aktualisiert, waehrend jemand sie offen hat, zeigt dessen Fenster
 * noch die alten Namen - auf dem Server liegen aber nur noch die neuen.
 * Nachgemessen am 25.11.2026: die verlangte Datei antwortete mit 404, die
 * neue mit 200. Der Vorrat fuer offline hilft nicht, denn der neue
 * Vorratshalter uebernimmt sofort (skipWaiting) und raeumt den alten weg.
 *
 * Ein einziges Neuladen holt die neue index.html und damit die richtigen
 * Namen. Die Marke in der Sitzung verhindert eine Schleife: liegt es
 * tatsaechlich am Netz, faellt der Fehler beim zweiten Mal durch und die
 * Fehleranzeige kommt zum Zug (Befund 71).
 */

import { lazy, type ComponentType } from 'react'

const MARKE = 'billard.neu-geladen'

/* Im privaten Modus kann der Zugriff auf den Sitzungsspeicher werfen. Dann
   gibt es keine Marke - und damit lieber den Fehler als eine Schleife. */
function schonVersucht(): boolean {
  try {
    return sessionStorage.getItem(MARKE) !== null
  } catch {
    return true
  }
}

function merken(): void {
  try {
    sessionStorage.setItem(MARKE, '1')
  } catch {
    /* ohne Marke wird es hier nie so weit kommen */
  }
}

function vergessen(): void {
  try {
    sessionStorage.removeItem(MARKE)
  } catch {
    /* nichts zu tun */
  }
}

/**
 * Laedt nach und holt bei einem Fehlschlag einmal die Seite neu.
 *
 * `neuLaden` ist nur fuer die Pruefung da - jsdom kennt kein echtes Neuladen.
 */
export function nachladen<T>(
  laden: () => Promise<T>,
  neuLaden: () => void = () => window.location.reload(),
): Promise<T> {
  return laden().then(
    (wert) => {
      // Geklappt: die naechste Aktualisierung darf wieder einmal neu laden.
      vergessen()
      return wert
    },
    (fehler: unknown) => {
      if (schonVersucht()) throw fehler
      merken()
      neuLaden()
      // Offen lassen: die Ladeanzeige bleibt stehen, bis die Seite neu kommt.
      return new Promise<T>(() => {})
    },
  )
}

/**
 * Wie React.lazy, nur mit dem Netz darunter.
 *
 * Die Schranke ist Wort fuer Wort die von React.lazy selbst
 * (`<T extends ComponentType<any>>`). Mit etwas Engerem - `unknown` oder
 * `never` - faellt jede Seite durch, die eigene Eigenschaften nimmt: der
 * Typ steht in der Gegenrichtung, und `{ shot, onClose }` passt dann nicht
 * mehr. Deshalb hier die Ausnahme von der Regel gegen `any`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyChunk<T extends ComponentType<any>>(laden: () => Promise<{ default: T }>) {
  return lazy(() => nachladen(laden))
}
