/** Ein Workout am Stueck durchlaufen. */

import { useCallback, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useActivePlayer } from '@/app/store'
import { useLeaveGuard } from '@/app/useLeaveGuard'
import { useShots, useWorkout } from '@/data/hooks'
import { storageErrorText } from '@/data/errors'
import { finishSession, startSession } from '@/data/repositories/sessions'
import { isScorable, proficiencyFor } from '@/domain/scoring'
import { plural } from '@/domain/text'
import type { Attempt, Session } from '@/domain/types'
import { useDialogs } from '@/ui/Dialogs'
import { ProficiencyBadge, Stat } from '@/ui/bits'
import { TrainerView } from '@/features/training/TrainerView'

export function WorkoutRunPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dialogs = useDialogs()
  const workout = useWorkout(id)
  const shots = useShots()
  const player = useActivePlayer()

  const [step, setStep] = useState(0)
  const [done, setDone] = useState<Session[]>([])

  const entries = useMemo(
    () =>
      workout && shots
        ? workout.entries.filter((e) => shots.some((s) => s.id === e.shotId))
        : [],
    [workout, shots],
  )

  // Der Stand des Trainers, gemeldet von unten.
  const erfasst = useRef(0)
  const meldeStand = useCallback((n: number) => {
    erfasst.current = n
  }, [])

  // Solange ein Abschnitt laeuft, fragt jeder Weg hinaus nach. Auf der
  // Schlussuebersicht steht nichts mehr offen - dort ist der Weg frei.
  useLeaveGuard(
    useCallback(() => {
      if (entries.length === 0 || step >= entries.length) return null
      const n = erfasst.current
      return {
        title: 'Workout abbrechen?',
        message:
          n > 0
            ? `${plural(
                n,
                'erfasster Versuch dieses Abschnitts wird',
                'erfasste Versuche dieses Abschnitts werden',
              )} verworfen. Bereits beendete Abschnitte bleiben gespeichert.`
            : 'Bereits beendete Abschnitte bleiben gespeichert.',
        confirmLabel: 'Abbrechen',
        cancelLabel: 'Fortsetzen',
        danger: true,
      }
    }, [entries.length, step]),
  )

  if (!workout || !shots || !player) {
    return (
      <div className="page">
        <p className="muted">Wird geladen …</p>
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="page stack">
        <h1>{workout.name}</h1>
        <p className="muted">Dieses Workout enthält keine vorhandenen Übungen mehr.</p>
        <button className="btn" onClick={() => navigate('/workouts')}>
          Zurück
        </button>
      </div>
    )
  }

  // Alle Abschnitte erledigt: Uebersicht ueber das ganze Workout.
  if (step >= entries.length) {
    const total = done.reduce((a, s) => a + s.score, 0) / Math.max(done.length, 1)
    return (
      <div className="page stack">
        <div className="page__head">
          <div>
            <span className="tiny">Workout beendet</span>
            <h1>{workout.name}</h1>
          </div>
          <ProficiencyBadge value={proficiencyFor(total)} />
        </div>

        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
          <Stat label="Mittel" value={`${total.toFixed(0)} %`} />
          <Stat label="Abschnitte" value={done.length} />
          <Stat label="Versuche" value={done.reduce((a, s) => a + s.results.length, 0)} />
        </div>

        <div className="card stack">
          <h3>Abschnitte</h3>
          {done.map((session, i) => (
            <div key={session.id} className="row">
              <span style={{ flex: 1 }}>
                {i + 1}. {shots.find((s) => s.id === session.shotId)?.name}
              </span>
              <strong>{session.score.toFixed(0)} %</strong>
              <ProficiencyBadge value={session.proficiency} />
            </div>
          ))}
        </div>

        <div className="row">
          <button
            className="btn btn--primary"
            onClick={() => {
              setDone([])
              setStep(0)
            }}
          >
            Nochmal
          </button>
          <button className="btn" onClick={() => navigate('/workouts')}>
            Zu den Workouts
          </button>
          <button className="btn" onClick={() => navigate('/stats')}>
            Zur Statistik
          </button>
        </div>
      </div>
    )
  }

  const entry = entries[step]
  const shot = shots.find((s) => s.id === entry.shotId)
  if (!shot) return null

  const complete = async (results: Attempt[]) => {
    const session = startSession(shot, player.id, 'custom', entry.attempts, workout.id)
    const finished = await finishSession(session, shot, results)
    setDone((d) => [...d, finished])
    // Der Abschnitt steht in der Datenbank; es gibt nichts mehr zu verwerfen.
    // Sonst traegt der Zaehler seinen Stand in einen Abschnitt hinueber, in
    // dem die Erfassung gar nicht erst aufgebaut wird.
    erfasst.current = 0
    setStep((s) => s + 1)
  }

  // Die Rueckfrage stellt der Waechter - hier bleibt nur der Weg.
  const quit = () => navigate('/workouts')

  // Ein Abschnitt ohne Massstab (kein Objektball, keine Zielzone) wird nicht
  // stillschweigend uebersprungen: sonst stuende im Ergebnis ein Abschnitt
  // weniger, ohne dass jemand wuesste, warum.
  if (!isScorable(shot)) {
    return (
      <div className="page stack">
        <h1>Abschnitt {step + 1} lässt sich nicht bewerten</h1>
        <p className="muted">
          „{shot.name}" hat weder einen Objektball noch eine Zielzone. Ohne Objektball
          gibt es nichts einzulochen, ohne Zielzone nichts zu messen. Im Baukasten lässt
          sich das nachholen; die übrigen Abschnitte sind davon nicht betroffen.
        </p>
        <div className="row">
          <button className="btn btn--primary" onClick={() => setStep((s) => s + 1)}>
            Abschnitt überspringen
          </button>
          <button className="btn" onClick={quit}>
            Workout verlassen
          </button>
        </div>
      </div>
    )
  }

  return (
    <TrainerView
      key={`${shot.id}-${step}`}
      shot={shot}
      planned={entry.attempts}
      subtitle={`Workout ${step + 1} von ${entries.length}`}
      onQuit={quit}
      onProgress={meldeStand}
      onComplete={complete}
      onError={(err) => dialogs.toast(`Nicht gespeichert: ${storageErrorText(err)}`, 'error')}
    />
  )
}
