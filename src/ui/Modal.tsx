/** Rahmen fuer alle Dialoge.
 *
 *  Natives <dialog> mit showModal(): liegt in der obersten Ebene, haelt den
 *  Fokus im Dialog, sperrt die Seite dahinter und schliesst mit Escape. Ein
 *  Tipp neben den Dialog zaehlt wie Escape als onClose. Beim Schliessen kehrt
 *  der Fokus zum Ausloeser zurueck. Das ist kein natives alert/confirm: der
 *  Browser blockiert nicht, das Aussehen kommt weiter aus .modal.
 *
 *  Beim Oeffnen bekommt das erste bedienbare Element den Fokus; wer ein
 *  anderes will, setzt ihn in einem useEffect (laeuft nach dem Oeffnen).
 */

import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { focusPageHeading } from './focus'

/**
 * Gibt den Fokus zurueck, nachdem der Dialog geschlossen ist.
 *
 * Der Regelfall ist der Ausloeser. War er schon weg, als der Dialog
 * schloss - oder gab es keinen -, uebernimmt die Ueberschrift der Seite.
 * Verschwindet er erst danach, weil die Aktion ihn wegraeumt, sagt das die
 * handelnde Seite selbst (siehe ui/focus.ts).
 */
function fokusZurueck(ausloeser: Element | null): void {
  if (ausloeser instanceof HTMLElement && ausloeser.isConnected && ausloeser !== document.body) {
    ausloeser.focus()
    return
  }
  focusPageHeading()
}

interface ModalProps {
  onClose: () => void
  wide?: boolean
  label?: string
  children: ReactNode
}

export function Modal({ onClose, wide, label, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)

  // Layout-Effekt: oeffnen vor dem ersten Bild, schliessen bevor React das
  // Element entfernt - nur close() gibt den Fokus an den Ausloeser zurueck,
  // und nur hier ist noch bekannt, wer der Ausloeser war
  useLayoutEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    const before = document.activeElement
    if (!dialog.open) dialog.showModal()
    return () => {
      dialog.close()
      fokusZurueck(before)
    }
  }, [])

  return (
    <dialog
      ref={ref}
      className={`modal-host${wide ? ' modal-host--wide' : ''}`}
      aria-label={label}
      onCancel={(e) => {
        // Escape: der Aufrufer schliesst ueber seinen Zustand
        e.preventDefault()
        onClose()
      }}
      onPointerDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`modal${wide ? ' modal--wide' : ''}`}>{children}</div>
    </dialog>
  )
}
