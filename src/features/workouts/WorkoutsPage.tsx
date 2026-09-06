import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useShots, useWorkouts } from '@/data/hooks'
import { createWorkout, deleteWorkout, saveWorkout } from '@/data/repositories/workouts'
import type { Workout } from '@/domain/types'
import { EmptyState } from '@/ui/bits'
import { useDialogs } from '@/ui/Dialogs'

export function WorkoutsPage() {
  const workouts = useWorkouts()
  const shots = useShots()
  const dialogs = useDialogs()
  const navigate = useNavigate()
  const [editing, setEditing] = useState<Workout | null>(null)

  const add = async () => {
    const name = await dialogs.prompt({
      title: 'Neues Workout',
      label: 'Name',
      initial: 'Aufwaermen',
    })
    if (name === null) return
    setEditing({ ...createWorkout(name.trim() || 'Neues Workout') })
  }

  const remove = async (workout: Workout) => {
    const ok = await dialogs.confirm({
      title: `"${workout.name}" loeschen?`,
      confirmLabel: 'Loeschen',
      danger: true,
    })
    if (ok) await deleteWorkout(workout.id)
  }

  return (
    <div className="page stack">
      <div className="page__head">
        <div>
          <h1>Workouts</h1>
          <p className="page__sub">Mehrere Stoesse hintereinander als eine Einheit.</p>
        </div>
        <button className="btn btn--primary" onClick={() => void add()}>
          Neues Workout
        </button>
      </div>

      {workouts && workouts.length === 0 ? (
        <EmptyState title="Noch kein Workout angelegt">
          <span className="small muted">
            Ein Workout bündelt Stoesse in fester Reihenfolge, etwa zum Aufwaermen.
          </span>
        </EmptyState>
      ) : (
        <div className="grid">
          {(workouts ?? []).map((workout) => {
            const total = workout.entries.reduce((a, e) => a + e.attempts, 0)
            return (
              <div key={workout.id} className="card stack">
                <strong>{workout.name}</strong>
                <span className="small muted">
                  {workout.entries.length} Stoesse · {total} Versuche
                </span>
                {workout.description && <span className="small">{workout.description}</span>}
                <ol className="small muted" style={{ margin: 0, paddingLeft: 18 }}>
                  {workout.entries.slice(0, 4).map((entry, i) => (
                    <li key={i}>
                      {shots?.find((s) => s.id === entry.shotId)?.name ?? 'Unbekannter Stoss'} ·{' '}
                      {entry.attempts}
                    </li>
                  ))}
                  {workout.entries.length > 4 && <li>…</li>}
                </ol>
                <div className="row row--tight">
                  <button
                    className="btn btn--sm btn--primary"
                    disabled={workout.entries.length === 0}
                    onClick={() => navigate(`/workout/${workout.id}/run`)}
                  >
                    Starten
                  </button>
                  <button className="btn btn--sm" onClick={() => setEditing(workout)}>
                    Bearbeiten
                  </button>
                  <button className="btn btn--sm btn--danger" onClick={() => void remove(workout)}>
                    Loeschen
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {editing && (
        <WorkoutEditor
          workout={editing}
          onClose={() => setEditing(null)}
          onSave={async (w) => {
            await saveWorkout(w)
            setEditing(null)
            dialogs.toast('Workout gespeichert', 'ok')
          }}
        />
      )}
    </div>
  )
}

interface EditorProps {
  workout: Workout
  onClose: () => void
  onSave: (workout: Workout) => Promise<void>
}

function WorkoutEditor({ workout, onClose, onSave }: EditorProps) {
  const shots = useShots()
  const [draft, setDraft] = useState<Workout>(workout)
  const [pick, setPick] = useState('')

  const move = (index: number, delta: number) => {
    const next = [...draft.entries]
    const target = index + delta
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setDraft({ ...draft, entries: next })
  }

  return (
    <div className="overlay" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal--wide">
        <div className="modal__head">
          <h2>Workout bearbeiten</h2>
        </div>
        <div className="modal__body stack">
          <div className="field">
            <label htmlFor="w-name">Name</label>
            <input
              id="w-name"
              className="input"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="w-desc">Beschreibung</label>
            <input
              id="w-desc"
              className="input"
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            />
          </div>

          <div className="stack" style={{ gap: 8 }}>
            <span className="tiny">Stoesse in dieser Reihenfolge</span>
            {draft.entries.length === 0 && (
              <span className="small muted">Noch kein Stoss hinzugefuegt.</span>
            )}
            {draft.entries.map((entry, i) => (
              <div key={i} className="row row--tight">
                <span style={{ flex: 1 }}>
                  {i + 1}. {shots?.find((s) => s.id === entry.shotId)?.name ?? 'Unbekannt'}
                </span>
                <input
                  className="input"
                  style={{ width: 78 }}
                  type="number"
                  min={1}
                  max={100}
                  value={entry.attempts}
                  onChange={(e) => {
                    const attempts = Math.max(1, Math.min(100, Number(e.target.value) || 1))
                    setDraft({
                      ...draft,
                      entries: draft.entries.map((x, j) => (j === i ? { ...x, attempts } : x)),
                    })
                  }}
                />
                <button className="btn btn--sm btn--icon" onClick={() => move(i, -1)} title="Nach oben">
                  ↑
                </button>
                <button className="btn btn--sm btn--icon" onClick={() => move(i, 1)} title="Nach unten">
                  ↓
                </button>
                <button
                  className="btn btn--sm btn--icon btn--danger"
                  title="Entfernen"
                  onClick={() =>
                    setDraft({ ...draft, entries: draft.entries.filter((_, j) => j !== i) })
                  }
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="row">
            <select
              className="select"
              style={{ flex: 1 }}
              value={pick}
              onChange={(e) => setPick(e.target.value)}
            >
              <option value="">Stoss auswaehlen …</option>
              {(shots ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <button
              className="btn"
              disabled={!pick}
              onClick={() => {
                setDraft({ ...draft, entries: [...draft.entries, { shotId: pick, attempts: 10 }] })
                setPick('')
              }}
            >
              Hinzufuegen
            </button>
          </div>
        </div>
        <div className="modal__foot">
          <button className="btn" onClick={onClose}>
            Abbrechen
          </button>
          <button className="btn btn--primary" onClick={() => void onSave(draft)}>
            Speichern
          </button>
        </div>
      </div>
    </div>
  )
}
