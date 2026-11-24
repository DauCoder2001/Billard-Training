/**
 * Wohin der Fokus geht, wenn das Bedienelement verschwindet, von dem aus
 * gehandelt wurde.
 *
 * Manche Aktionen raeumen ihren eigenen Knopf weg: wer eine Uebung auf die
 * Vorlage zuruecksetzt oder seine Fassung behaelt, laesst damit den ganzen
 * Hinweis verschwinden. Der Browser setzt den Fokus dann auf den
 * Seitenkoerper - wer mit der Tastatur arbeitet, faengt danach wieder ganz
 * vorn an und wandert durch die gesamte Seite. Ersatzweise geht der Fokus
 * deshalb auf die Ueberschrift der Seite, also dorthin, wo die Seite
 * anfaengt.
 */

/**
 * Setzt den Fokus auf die Ueberschrift der Seite.
 *
 * @returns true, wenn es eine Ueberschrift gab.
 */
export function focusPageHeading(): boolean {
  const ueberschrift = document.querySelector<HTMLElement>('main h1, h1')
  if (!ueberschrift) return false
  // Ueberschriften sind von sich aus nicht anspringbar. Die Marke kommt nach
  // dem Verlassen wieder weg, damit nichts davon stehen bleibt; in die
  // Tab-Reihenfolge geraet sie mit -1 ohnehin nicht.
  ueberschrift.tabIndex = -1
  ueberschrift.addEventListener('blur', () => ueberschrift.removeAttribute('tabindex'), {
    once: true,
  })
  ueberschrift.focus()
  return true
}
