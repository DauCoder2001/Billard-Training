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

export interface ConfirmOptions {
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

/**
 * Eine Antwort in einer Frage mit mehreren Moeglichkeiten.
 *
 * `tone` bestimmt die Farbe und damit die Bedeutung: "primary" traegt die
 * eine Hauptaktion, "danger" eine, die etwas wegnimmt. Ohne `tone` ist der
 * Knopf unauffaellig.
 */
interface ChooseAction<Id extends string = string> {
  id: Id
  label: string
  tone?: 'primary' | 'danger'
}

/**
 * Eine Frage mit mehr als zwei Antworten.
 *
 * Der Unterschied zu confirm ist nicht nur die Anzahl: Abbrechen liefert
 * `null` und damit "nichts tun". Eine Frage mit drei Moeglichkeiten auf
 * confirm abzubilden hiesse, dass Escape, ein Tipp neben den Dialog und eine
 * der echten Antworten dasselbe bedeuten - und damit laesst sich aus Versehen
 * ausloesen, was niemand wollte.
 */
interface ChooseOptions<Id extends string = string> {
  title: string
  message?: ReactNode
  actions: ChooseAction<Id>[]
  cancelLabel?: string
}

type ToastKind = 'info' | 'ok' | 'error'

interface Toast {
  id: number
  kind: ToastKind
  text: string
}

interface DialogsApi {
  confirm: (options: ConfirmOptions) => Promise<boolean>
  /** Mehrere Antworten; null heisst abgebrochen und also: nichts tun. */
  choose: <Id extends string>(options: ChooseOptions<Id>) => Promise<Id | null>
  prompt: (options: PromptOptions) => Promise<string | null>
  alert: (options: AlertOptions) => Promise<void>
  toast: (text: string, kind?: ToastKind) => void
}

const DialogsContext = createContext<DialogsApi | null>(null)

export function useDialogs(): DialogsApi {
  const ctx = useContext(DialogsContext)
  if (!ctx) throw new Error('useDialogs außerhalb von DialogsProvider verwendet')
  return ctx
}

type Pending =
  | { kind: 'confirm'; options: ConfirmOptions; resolve: (v: boolean) => void }
  | { kind: 'choose'; options: ChooseOptions; resolve: (v: string | null) => void }
  | { kind: 'prompt'; options: PromptOptions; resolve: (v: string | null) => void }
  | { kind: 'alert'; options: AlertOptions; resolve: () => void }

export function DialogsProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextToastId = useRef(1)

  // Was gerade gefragt wird, auch ausserhalb des Zeichnens. Nur so laesst
  // sich eine verdraengte Frage noch beantworten.
  const offen = useRef<Pending | null>(null)

  /**
   * Zeigt eine Frage. Steht schon eine offen, wird sie verdraengt - und
   * vorher als abgebrochen beantwortet. Ohne das wartet ihr Aufrufer fuer
   * immer: sein Versprechen wuerde nie eingeloest und seine Funktion nie zu
   * Ende laufen. Abgebrochen heisst ueberall "nichts tun", das ist in diesem
   * Augenblick die einzig richtige Antwort.
   */
  const zeigen = useCallback((next: Pending) => {
    if (offen.current) abbrechen(offen.current)
    offen.current = next
    setPending(next)
  }, [])

  const api = useMemo<DialogsApi>(
    () => ({
      confirm: (options) =>
        new Promise<boolean>((resolve) => zeigen({ kind: 'confirm', options, resolve })),
      choose: <Id extends string>(options: ChooseOptions<Id>) =>
        new Promise<Id | null>((resolve) =>
          zeigen({
            kind: 'choose',
            options: options as ChooseOptions,
            resolve: resolve as (v: string | null) => void,
          }),
        ),
      prompt: (options) =>
        new Promise<string | null>((resolve) => zeigen({ kind: 'prompt', options, resolve })),
      alert: (options) =>
        new Promise<void>((resolve) => zeigen({ kind: 'alert', options, resolve })),
      toast: (text, kind = 'info') => {
        const id = nextToastId.current++
        // Dieselbe Meldung nicht zweimal uebereinander: ein Regler loest beim
        // Ziehen viele Aenderungen hintereinander aus, und wenn der Speicher
        // ablehnt, haette sonst jede einzelne ihre eigene Meldung.
        setToasts((all) =>
          all.some((t) => t.text === text && t.kind === kind) ? all : [...all, { id, kind, text }],
        )
        window.setTimeout(() => setToasts((all) => all.filter((t) => t.id !== id)), 3200)
      },
    }),
    [zeigen],
  )

  const close = useCallback(() => {
    offen.current = null
    setPending(null)
  }, [])

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

/** Beantwortet eine Frage so, wie es "Abbrechen" taete. */
function abbrechen(p: Pending): void {
  if (p.kind === 'confirm') p.resolve(false)
  else if (p.kind === 'prompt' || p.kind === 'choose') p.resolve(null)
  else p.resolve()
}

function DialogHost({ pending, onClose }: { pending: Pending; onClose: () => void }) {
  const [value, setValue] = useState(
    pending.kind === 'prompt' ? (pending.options.initial ?? '') : '',
  )
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)
  const acceptRef = useRef<HTMLButtonElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  // Eine Frage, bei der etwas wegfallen kann: dann liegt der Startfokus auf
  // "Abbrechen", damit ein unbedachtes Enter nichts wegnimmt.
  const danger =
    pending.kind === 'confirm'
      ? pending.options.danger
      : pending.kind === 'choose' && pending.options.actions.some((a) => a.tone === 'danger')

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
    abbrechen(pending)
    onClose()
  }, [pending, onClose])

  const accept = useCallback(() => {
    // Eine Frage mit mehreren Antworten hat keinen allgemeinen
    // Bestaetigen-Knopf: dort loest jede Antwort selbst auf.
    if (pending.kind === 'choose') return
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
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return
                  // Die Taste hier aufbrauchen. Sonst laeuft ihre
                  // Standardwirkung weiter, waehrend der Dialog schon
                  // geschlossen und der Fokus zurueck auf dem ausloesenden
                  // Knopf ist - der bekommt dann einen zweiten Druck.
                  e.preventDefault()
                  accept()
                }}
              />
            )}
          </div>
        )}
      </div>
      <div className="modal__foot">
        {pending.kind !== 'alert' && (
          <button ref={cancelRef} className="btn" onClick={cancel}>
            {('cancelLabel' in o && o.cancelLabel) || 'Abbrechen'}
          </button>
        )}
        {pending.kind === 'choose' ? (
          pending.options.actions.map((action) => (
            <button
              key={action.id}
              ref={action.tone === 'primary' ? acceptRef : undefined}
              className={`btn${action.tone ? ` btn--${action.tone}` : ''}`}
              onClick={() => {
                pending.resolve(action.id)
                onClose()
              }}
            >
              {action.label}
            </button>
          ))
        ) : (
          <button ref={acceptRef} className={`btn ${danger ? 'btn--danger' : 'btn--primary'}`} onClick={accept}>
            {('confirmLabel' in o && o.confirmLabel) || 'OK'}
          </button>
        )}
      </div>
    </Modal>
  )
}
