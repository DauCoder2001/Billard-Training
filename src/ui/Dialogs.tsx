/** Eigene Dialoge und Kurzmeldungen.
 *
 *  Die App verwendet bewusst kein natives alert/confirm/prompt: die blockieren
 *  den Browser, lassen sich auf dem Tablet nicht gestalten und reissen aus dem
 *  Vollbildmodus.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { Modal } from './Modal'

interface ConfirmOptions {
  title: string
  message?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

interface PromptOptions {
  title: string
  message?: ReactNode
  label?: string
  initial?: string
  placeholder?: string
  confirmLabel?: string
  multiline?: boolean
}

interface AlertOptions {
  title: string
  message?: ReactNode
  confirmLabel?: string
}

type ToastKind = 'info' | 'ok' | 'error'

interface Toast {
  id: number
  kind: ToastKind
  text: string
}

interface DialogsApi {
  confirm: (options: ConfirmOptions) => Promise<boolean>
  prompt: (options: PromptOptions) => Promise<string | null>
  alert: (options: AlertOptions) => Promise<void>
  toast: (text: string, kind?: ToastKind) => void
}

const DialogsContext = createContext<DialogsApi | null>(null)

export function useDialogs(): DialogsApi {
  const ctx = useContext(DialogsContext)
  if (!ctx) throw new Error('useDialogs ausserhalb von DialogsProvider verwendet')
  return ctx
}

type Pending =
  | { kind: 'confirm'; options: ConfirmOptions; resolve: (v: boolean) => void }
  | { kind: 'prompt'; options: PromptOptions; resolve: (v: string | null) => void }
  | { kind: 'alert'; options: AlertOptions; resolve: () => void }

export function DialogsProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextToastId = useRef(1)

  const api = useMemo<DialogsApi>(
    () => ({
      confirm: (options) =>
        new Promise<boolean>((resolve) => setPending({ kind: 'confirm', options, resolve })),
      prompt: (options) =>
        new Promise<string | null>((resolve) => setPending({ kind: 'prompt', options, resolve })),
      alert: (options) =>
        new Promise<void>((resolve) => setPending({ kind: 'alert', options, resolve })),
      toast: (text, kind = 'info') => {
        const id = nextToastId.current++
        setToasts((all) => [...all, { id, kind, text }])
        window.setTimeout(() => setToasts((all) => all.filter((t) => t.id !== id)), 3200)
      },
    }),
    [],
  )

  const close = useCallback(() => setPending(null), [])

  // Meldungen als Popover in der obersten Ebene, sonst laegen sie hinter
  // einem offenen Dialog. Bei jeder neuen Meldung neu einblenden, damit sie
  // auch ueber einem spaeter geoeffneten Dialog liegt.
  const toastsRef = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const el = toastsRef.current
    if (!el || !('showPopover' in el)) return
    el.setAttribute('popover', 'manual')
    if (el.matches(':popover-open')) el.hidePopover()
    el.showPopover()
  }, [toasts])

  return (
    <DialogsContext.Provider value={api}>
      {children}
      {pending && <DialogHost pending={pending} onClose={close} />}
      {toasts.length > 0 && (
        <div ref={toastsRef} className="toasts" role="status" aria-live="polite">
          {toasts.map((t) => (
            <div key={t.id} className={`toast${t.kind === 'info' ? '' : ` toast--${t.kind}`}`}>
              {t.text}
            </div>
          ))}
        </div>
      )}
    </DialogsContext.Provider>
  )
}

function DialogHost({ pending, onClose }: { pending: Pending; onClose: () => void }) {
  const [value, setValue] = useState(
    pending.kind === 'prompt' ? (pending.options.initial ?? '') : '',
  )
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)
  const acceptRef = useRef<HTMLButtonElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const danger = pending.kind === 'confirm' && pending.options.danger

  // Startfokus (laeuft nach showModal): das Eingabefeld, bei einer
  // gefaehrlichen Rueckfrage "Abbrechen", sonst der Bestaetigen-Knopf.
  // Enter drueckt dann den Knopf mit dem Fokus - nie ungefragt "Loeschen".
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    } else if (danger) cancelRef.current?.focus()
    else acceptRef.current?.focus()
  }, [danger])

  const cancel = useCallback(() => {
    if (pending.kind === 'confirm') pending.resolve(false)
    else if (pending.kind === 'prompt') pending.resolve(null)
    else pending.resolve()
    onClose()
  }, [pending, onClose])

  const accept = useCallback(() => {
    if (pending.kind === 'confirm') pending.resolve(true)
    else if (pending.kind === 'prompt') pending.resolve(value)
    else pending.resolve()
    onClose()
  }, [pending, value, onClose])

  const o = pending.options

  return (
    <Modal onClose={cancel} label={o.title}>
      <div className="modal__head">
        <h2>{o.title}</h2>
      </div>
      <div className="modal__body stack">
        {o.message && <div className="muted">{o.message}</div>}
        {pending.kind === 'prompt' && (
          <div className="field">
            {pending.options.label && <label htmlFor="dlg-input">{pending.options.label}</label>}
            {pending.options.multiline ? (
              <textarea
                id="dlg-input"
                ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                className="textarea"
                value={value}
                placeholder={pending.options.placeholder}
                onChange={(e) => setValue(e.target.value)}
              />
            ) : (
              <input
                id="dlg-input"
                ref={inputRef as React.RefObject<HTMLInputElement>}
                className="input"
                value={value}
                placeholder={pending.options.placeholder}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && accept()}
              />
            )}
          </div>
        )}
      </div>
      <div className="modal__foot">
        {pending.kind !== 'alert' && (
          <button ref={cancelRef} className="btn" onClick={cancel}>
            {(pending.kind === 'confirm' && pending.options.cancelLabel) || 'Abbrechen'}
          </button>
        )}
        <button ref={acceptRef} className={`btn ${danger ? 'btn--danger' : 'btn--primary'}`} onClick={accept}>
          {('confirmLabel' in o && o.confirmLabel) || 'OK'}
        </button>
      </div>
    </Modal>
  )
}
