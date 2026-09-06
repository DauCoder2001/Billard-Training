/** Ein Workout am Stueck durchlaufen. */

import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useActivePlayer } from '@/app/store'
import { useShots, useWorkout } from '@/data/hooks'
import { finishSession, startSession } from '@/data/repositories/sessions'
import { proficiencyFor } from '@/domain/scoring'
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

  if (!workout || !shots || !player) {
    return (
      <div className="page">
        <p className="muted">Wird geladen …</p>
      </div>
    )
  }

  const entries = workout.entries.filter((e) => shots.some((s) => s.id === e.shotId))

  if (entries.length === 0) {
    return (
      <div className="page stack">
        <h1>{workout.name}</h1>
        <p className="muted">Dieses Workout enthaelt keine vorhandenen Stoesse mehr.</p>
        <button className="btn" onClick={() => navigate('/workouts')}>
          Zurueck
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
          <Stat label="Schnitt" value={`${total.toFixed(0)} %`} />
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
          <button className="btn btn--primary" onClick={() => navigate('/workouts')}>
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
    setStep((s) => s + 1)
  }

  const quit = async (recorded: number) => {
    const ok = await dialogs.confirm({
      title: 'Workout abbrechen?',
      message:
        recorded > 0
          ? `${recorded} erfasste Versuche dieses Abschnitts werden verworfen. Bereits beendete Abschnitte bleiben gespeichert.`
          : 'Bereits beendete Abschnitte bleiben gespeichert.',
      confirmLabel: 'Abbrechen',
      cancelLabel: 'Fortsetzen',
      danger: true,
    })
    if (ok) navigate('/workouts')
  }

  return (
    <TrainerView
      key={`${shot.id}-${step}`}
      shot={shot}
      planned={entry.attempts}
      subtitle={`Workout ${step + 1} von ${entries.length}`}
      onQuit={(n) => void quit(n)}
      onComplete={complete}
    />
  )
}
