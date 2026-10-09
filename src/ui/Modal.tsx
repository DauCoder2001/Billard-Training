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

interface ModalProps {
  onClose: () => void
  wide?: boolean
  label?: string
  children: ReactNode
}

export function Modal({ onClose, wide, label, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)

  // Layout-Effekt: oeffnen vor dem ersten Bild, schliessen bevor React das
  // Element entfernt - nur close() gibt den Fokus an den Ausloeser zurueck
  useLayoutEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    const before = document.activeElement
    if (!dialog.open) dialog.showModal()
    return () => {
      dialog.close()
      if (before instanceof HTMLElement && before.isConnected) before.focus()
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
