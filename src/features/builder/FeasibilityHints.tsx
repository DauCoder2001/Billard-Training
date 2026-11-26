/** Was an einem Aufbau am echten Tisch nicht aufgeht. */

import { feasibilityHints } from '@/domain/feasibility'
import type { Shot } from '@/domain/types'

/**
 * Der Streifen zwischen Werkzeugleiste und Angaben.
 *
 * Er steht ausserhalb des klappbaren Angabenbereichs: der Nutzer schiebt die
 * Baelle mit eingeklappten Angaben, und genau dabei entstehen die Lagen, um
 * die es hier geht.
 *
 * Bewusst **kein** aria-live: die Hinweise rechnen sich bei jedem Ziehen neu,
 * ein Vorleseprogramm laese waehrend des Ziehens ununterbrochen vor. Der
 * Bereich traegt stattdessen einen Namen und ist beim Durchgehen zu finden.
 *
 * Gibt es nichts zu sagen, steht hier nichts - kein leerer Kasten mit
 * "Alles in Ordnung". Die Abwesenheit des Streifens ist die Entwarnung.
 */
export function FeasibilityHints({ shot }: { shot: Shot }) {
  const hints = feasibilityHints(shot)
  if (hints.length === 0) return null

  return (
    <div className="builder__hints" aria-label="Hinweise zum Aufbau">
      {hints.map((hint) => (
        <p key={hint.check} className={`builder__hint builder__hint--${hint.level}`}>
          {/* Das Zeichen sagt dasselbe wie die Farbe. Wer die Farben nicht
              unterscheidet, sieht trotzdem, was Hindernis und was Hinweis
              ist. */}
          <span className="builder__hint-mark" aria-hidden="true">
            {hint.level === 'blocker' ? '✕' : '!'}
          </span>
          <span>{hint.text}</span>
        </p>
      ))}
    </div>
  )
}
