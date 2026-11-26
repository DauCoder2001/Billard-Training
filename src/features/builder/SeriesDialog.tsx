/**
 * Eine Reihe von Uebungen aus dem aktuellen Aufbau.
 *
 * Der Dialog zeigt die Reihe, bevor er sie anlegt: zehn Uebungen auf einmal
 * in der Sammlung sind schwer wieder einzusammeln, wenn sie nicht stimmen.
 * Deshalb stehen Namen, Werte und die Machbarkeitspruefung (0.16.0) je
 * Uebung schon in der Vorschau - wer sieht, dass drei davon nicht spielbar
 * sind, zieht die Grenzen enger, statt hinterher aufzuraeumen.
 */

import { useMemo, useState } from 'react'
import { feasibilityHints } from '@/domain/feasibility'
import {
  MAX_SERIES_STEPS,
  MIN_SERIES_STEPS,
  SERIES_AXES,
  SERIES_AXIS_LABELS,
  SERIES_AXIS_RANGE,
  SERIES_PROBLEM_TEXTS,
  buildSeries,
  currentAim,
  seriesProblem,
} from '@/domain/series'
import type { SeriesAxis, SeriesSpec } from '@/domain/series'
import type { Shot } from '@/domain/types'
import { Modal } from '@/ui/Modal'

interface SeriesDialogProps {
  shot: Shot
  onCreate: (shots: Shot[]) => void
  onClose: () => void
}

/**
 * Der Vorschlag beim Oeffnen: der heutige Aufbau ist der Anfang der Reihe.
 *
 * Nicht geraten wird die Schwierigkeit - beide Enden stehen auf dem Wert des
 * Originals. Ob eine Reihe schwerer wird, weiss nur, wer sie baut.
 */
function vorschlag(shot: Shot, axis: SeriesAxis): SeriesSpec {
  const stand = currentAim(shot)
  const grenzen = SERIES_AXIS_RANGE[axis]
  const jetzt = Math.round(axis === 'cutAngle' ? (stand?.cutDeg ?? 0) : (stand?.dist ?? 20))
  const von = Math.max(grenzen.min, Math.min(grenzen.max, jetzt))
  return {
    axis,
    from: von,
    to: Math.min(grenzen.max, von + (axis === 'cutAngle' ? 30 : 20)),
    steps: 4,
    difficultyFrom: shot.attributes.difficulty,
    difficultyTo: shot.attributes.difficulty,
  }
}

export function SeriesDialog({ shot, onCreate, onClose }: SeriesDialogProps) {
  const problem = seriesProblem(shot)
  const [spec, setSpec] = useState<SeriesSpec>(() => vorschlag(shot, 'cutAngle'))

  const reihe = useMemo(() => (problem ? [] : buildSeries(shot, spec)), [problem, shot, spec])
  const hinweise = useMemo(() => reihe.map((s) => feasibilityHints(s)), [reihe])
  const auffaellig = hinweise.filter((h) => h.length > 0).length

  const grenzen = SERIES_AXIS_RANGE[spec.axis]
  const aendern = (patch: Partial<SeriesSpec>) => setSpec((s) => ({ ...s, ...patch }))

  if (problem) {
    return (
      <Modal onClose={onClose} label="Reihe erzeugen">
        <div className="modal__head">
          <h2>Reihe erzeugen</h2>
        </div>
        <div className="modal__body stack">
          <p style={{ margin: 0 }}>{SERIES_PROBLEM_TEXTS[problem]}</p>
        </div>
        <div className="modal__foot">
          <button className="btn" onClick={onClose}>
            Schließen
          </button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal onClose={onClose} wide label="Reihe erzeugen">
      <div className="modal__head">
        <h2>Reihe erzeugen</h2>
      </div>

      <div className="modal__body stack">
        <p className="small muted" style={{ margin: 0 }}>
          Dieselbe Lage mehrfach, mit einem Wert in Stufen. Der Weiße wird dafür neu
          berechnet; Objektball, Tasche und alles andere bleiben, wie sie sind. Die
          Lernstufe bekommen die neuen Übungen nicht mit – eine Reihe verändert gerade
          das, was über die Stufe entscheidet.
        </p>

        <div className="row">
          <div className="field" style={{ flex: '1 1 200px' }}>
            <label htmlFor="sr-axis">Was sich ändert</label>
            <select
              id="sr-axis"
              className="select"
              value={spec.axis}
              onChange={(e) => setSpec(vorschlag(shot, e.target.value as SeriesAxis))}
            >
              {SERIES_AXES.map((a) => (
                <option key={a} value={a}>
                  {SERIES_AXIS_LABELS[a]}
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ flex: '0 1 110px' }}>
            <label htmlFor="sr-from">von</label>
            <input
              id="sr-from"
              className="input"
              type="number"
              min={grenzen.min}
              max={grenzen.max}
              value={spec.from}
              onChange={(e) => aendern({ from: Number(e.target.value) })}
            />
          </div>
          <div className="field" style={{ flex: '0 1 110px' }}>
            <label htmlFor="sr-to">bis</label>
            <input
              id="sr-to"
              className="input"
              type="number"
              min={grenzen.min}
              max={grenzen.max}
              value={spec.to}
              onChange={(e) => aendern({ to: Number(e.target.value) })}
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="sr-steps">Anzahl Übungen: {spec.steps}</label>
          <input
            id="sr-steps"
            className="slider"
            type="range"
            min={MIN_SERIES_STEPS}
            max={MAX_SERIES_STEPS}
            value={spec.steps}
            onChange={(e) => aendern({ steps: Number(e.target.value) })}
          />
        </div>

        <div className="row">
          <div className="field" style={{ flex: '0 1 150px' }}>
            <label htmlFor="sr-dfrom">Schwierigkeit von</label>
            <input
              id="sr-dfrom"
              className="input"
              type="number"
              min={1}
              max={10}
              value={spec.difficultyFrom}
              onChange={(e) => aendern({ difficultyFrom: Number(e.target.value) })}
            />
          </div>
          <div className="field" style={{ flex: '0 1 150px' }}>
            <label htmlFor="sr-dto">bis</label>
            <input
              id="sr-dto"
              className="input"
              type="number"
              min={1}
              max={10}
              value={spec.difficultyTo}
              onChange={(e) => aendern({ difficultyTo: Number(e.target.value) })}
            />
          </div>
        </div>

        {/* Die Vorschau. Je Zeile der Name, wie ihn die Sammlung zeigen wird,
            und was die Machbarkeitspruefung dazu sagt. */}
        <div className="stack" style={{ gap: 4 }}>
          <strong className="small">Das wird angelegt</strong>
          {reihe.map((s, i) => (
            <div key={s.id} className="row small" style={{ gap: 8 }}>
              <span style={{ flex: 1 }}>{s.name}</span>
              <span className="muted">Schwierigkeit {s.attributes.difficulty}</span>
              {hinweise[i].length > 0 && (
                <span className="builder__hint--warn">! {hinweise[i][0].text}</span>
              )}
            </div>
          ))}
        </div>

        {auffaellig > 0 && (
          <p className="small builder__hint--warn" style={{ margin: 0 }}>
            {auffaellig === 1
              ? 'Eine Übung der Reihe geht am Tisch so nicht auf.'
              : `${auffaellig} Übungen der Reihe gehen am Tisch so nicht auf.`}{' '}
            Enger gesetzte Grenzen helfen. Anlegen lassen sie sich trotzdem.
          </p>
        )}
      </div>

      <div className="modal__foot">
        <button className="btn btn--primary" onClick={() => onCreate(reihe)}>
          {reihe.length === 1 ? 'Eine Übung anlegen' : `${reihe.length} Übungen anlegen`}
        </button>
        <button className="btn btn--ghost" onClick={onClose}>
          Abbrechen
        </button>
      </div>
    </Modal>
  )
}
