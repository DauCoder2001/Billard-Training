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
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

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

  return (
    <DialogsContext.Provider value={api}>
      {children}
      {pending && <DialogHost pending={pending} onClose={close} />}
      {toasts.length > 0 && (
        <div className="toasts" role="status" aria-live="polite">
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

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancel()
      if (e.key === 'Enter' && pending.kind !== 'prompt') accept()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [cancel, accept, pending.kind])

  const o = pending.options
  const danger = pending.kind === 'confirm' && pending.options.danger

  return (
    <div className="overlay" onPointerDown={(e) => e.target === e.currentTarget && cancel()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={o.title}>
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
            <button className="btn" onClick={cancel}>
              {(pending.kind === 'confirm' && pending.options.cancelLabel) || 'Abbrechen'}
            </button>
          )}
          <button className={`btn ${danger ? 'btn--danger' : 'btn--primary'}`} onClick={accept}>
            {('confirmLabel' in o && o.confirmLabel) || 'OK'}
          </button>
        </div>
      </div>
    </div>
  )
}
