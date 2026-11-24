/**
 * Warum die Werkzeugliste im Baukasten ihre Hoehe selbst bestimmt.
 *
 * Die Leiste rollt, wenn nicht alle Werkzeuge ins Fenster passen - das ist so
 * gewollt. Was nicht sein soll: ein halbes Werkzeug am unteren Rand, schon
 * bevor jemand gerollt hat. Das entsteht von selbst, denn ein rollender
 * Bereich schneidet **an seiner Polsterkante** ab, nicht an der Unterkante des
 * letzten ganzen Knopfes. Nachgemessen bei 727 px Fensterhoehe: 4 px vom
 * naechsten Knopf lugen unten herein.
 *
 * Mit reinem CSS laesst sich das nicht ausrechnen - es braeuchte eine Teilung
 * mit Rest, und die Eintraege sind nicht einmal gleich hoch (Knoepfe 46 px,
 * Trennlinien 9 px). Deshalb misst diese Funktion nach, welcher Knopf als
 * letzter vollstaendig passt, und setzt die Liste genau auf dessen Unterkante.
 *
 * Waehrend des Rollens darf ein Werkzeug angeschnitten sein; das ist
 * ausdruecklich in Ordnung und braucht kein Einrasten.
 *
 * Eine Grenze gibt es: passt nicht einmal **ein** ganzer Knopf, gewinnt der
 * vorhandene Platz. Nachgemessen bei 480 px Fensterhoehe - dann bleiben der
 * Leiste 28 px, und der erste Knopf (46 px) ist angeschnitten. Dagegen hilft
 * nur ein kleinerer Tisch, nicht die Leiste.
 */
import { useEffect, useState } from 'react'

/** Nur ein ganzer Knopf schliesst die Liste ab, nie eine Trennlinie. */
const ABSCHLUSS = 'builder__tool'

function zuschneiden(liste: HTMLElement): void {
  const huelle = liste.parentElement
  if (!huelle) return

  // Erst zuruecksetzen, sonst misst sich die Liste an ihrer eigenen Vorgabe.
  liste.style.height = ''
  liste.style.width = ''
  liste.style.flex = ''

  const stil = getComputedStyle(huelle)
  const senkrecht = getComputedStyle(liste).flexDirection !== 'row'
  const platz = senkrecht
    ? huelle.clientHeight - parseFloat(stil.paddingTop) - parseFloat(stil.paddingBottom)
    : huelle.clientWidth - parseFloat(stil.paddingLeft) - parseFloat(stil.paddingRight)

  // Ohne Layout - etwa in jsdom - ist alles 0. Dann bleibt die Vorgabe stehen.
  if (!(platz > 0)) return

  let kante = 0
  for (const kind of Array.from(liste.children)) {
    const el = kind as HTMLElement
    const ende = senkrecht ? el.offsetTop + el.offsetHeight : el.offsetLeft + el.offsetWidth
    if (ende > platz) break
    if (el.classList.contains(ABSCHLUSS)) kante = ende
  }
  if (kante <= 0) return

  if (senkrecht) liste.style.height = `${kante}px`
  else liste.style.width = `${kante}px`
  liste.style.flex = '0 0 auto'
}

/**
 * Haelt die Werkzeugliste auf ganzen Werkzeugen. Rueckgabe ist die Marke, die
 * an die Liste gehaengt wird: `<div ref={useToolFit()}>`.
 *
 * Absichtlich eine Marke zum Mitzaehlen statt useRef: der Baukasten zeigt
 * zuerst eine Ladeanzeige, die Leiste entsteht also erst spaeter. Ein
 * useRef-Effekt liefe genau einmal, naemlich zu frueh, und fasste nur ins
 * Leere.
 *
 * Beobachtet wird die **Huelle**, nicht die Liste selbst - die Liste aendert
 * hier ja gerade ihre Groesse, das gaebe eine Schleife.
 */
export function useToolFit(): (el: HTMLElement | null) => void {
  const [liste, setListe] = useState<HTMLElement | null>(null)

  useEffect(() => {
    const huelle = liste?.parentElement
    if (!liste || !huelle) return

    zuschneiden(liste)

    if (typeof ResizeObserver === 'undefined') return
    const waechter = new ResizeObserver(() => zuschneiden(liste))
    waechter.observe(huelle)
    return () => waechter.disconnect()
  }, [liste])

  return setListe
}
