/**
 * Nachfragen, bevor offene Arbeit verloren geht.
 *
 * Eine Seite, auf der etwas steht, das noch nirgends gespeichert ist, fragt
 * nach - und zwar auf allen Wegen hinaus, nicht nur auf dem eigenen Knopf:
 *
 * - Navigation innerhalb der App (eigene Knoepfe, Links, Seitenleiste),
 * - die Zurueck-Taste des Browsers und die Wischbewegung auf dem iPad,
 * - Neu laden, Tab schliessen, Fenster schliessen.
 *
 * Die ersten beiden Wege gehen ueber useBlocker und zeigen die eigene
 * Rueckfrage der App. Der dritte geht ueber beforeunload; dort bestimmt der
 * Browser den Text, die App kann nur sagen, dass es etwas zu verlieren gibt.
 *
 * Nicht erfasst: eine von Hand geaenderte Adresszeile. Ein solcher Eintrag
 * stammt nicht vom Router, ihm fehlt das delta, und der Router laesst ihn
 * durch - in der gebauten App ohne Meldung.
 */

import { useCallback, useEffect, useRef } from 'react'
import { useBlocker, useLocation } from 'react-router-dom'
import { type ConfirmOptions, useDialogs } from '@/ui/Dialogs'

/**
 * @param frage Wird im Augenblick des Verlassens gerufen und liefert die
 *   Rueckfrage - oder null, wenn nichts offen ist und der Weg frei ist.
 *   Die Funktion liest den Stand selbst, damit sie nie einen veralteten
 *   Wert aus einem frueheren Rendern sieht.
 * @returns `ohneNachfrage`, fuer die Faelle, in denen die Seite selbst
 *   weitergeht und es nichts mehr zu fragen gibt - etwa nachdem das, was
 *   offen war, gespeichert oder geloescht wurde.
 */
export function useLeaveGuard(frage: () => ConfirmOptions | null): {
  ohneNachfrage: (gehen: () => void) => void
} {
  const dialogs = useDialogs()
  const location = useLocation()

  // Die Pruefung liegt in einem Ref: der Horcher auf beforeunload wird damit
  // einmal gehaengt und sieht trotzdem immer den neuesten Stand. Nachgezogen
  // wird nach dem Zeichnen - gefragt wird ohnehin erst danach.
  const frageRef = useRef(frage)
  useEffect(() => {
    frageRef.current = frage
  })

  const stumm = useRef(false)

  const pruefen = useCallback(() => !stumm.current && frageRef.current() !== null, [])
  const blocker = useBlocker(pruefen)

  // Sind wir angekommen, ist der Waechter wieder scharf.
  useEffect(() => {
    stumm.current = false
  }, [location.key])

  useEffect(() => {
    if (blocker.state !== 'blocked') return
    const options = frageRef.current()
    if (!options) {
      blocker.proceed?.()
      return
    }
    // Unter StrictMode laeuft dieser Effekt zweimal. Die zweite Frage
    // ersetzt die erste im Dialoghalter; diese Marke sorgt dafuer, dass die
    // erste danach nichts mehr entscheidet.
    let verworfen = false
    void dialogs.confirm(options).then((ok) => {
      if (verworfen) return
      if (ok) blocker.proceed?.()
      else blocker.reset?.()
    })
    return () => {
      verworfen = true
    }
  }, [blocker, dialogs])

  useEffect(() => {
    const warnen = (e: BeforeUnloadEvent) => {
      if (!frageRef.current()) return
      e.preventDefault()
      // Aeltere Browser - und darunter das Safari der alten iPads, auf die
      // diese App zielt - horchen nicht auf preventDefault, sondern auf
      // returnValue. Beides zu setzen schadet nirgends.
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', warnen)
    return () => window.removeEventListener('beforeunload', warnen)
  }, [])

  const ohneNachfrage = useCallback((gehen: () => void) => {
    stumm.current = true
    gehen()
  }, [])

  return { ohneNachfrage }
}
