/** Eine einzelne Trainingseinheit zu einem Stoss. */

import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useActivePlayer } from '@/app/store'
import { useShot } from '@/data/hooks'
import { storageErrorText } from '@/data/errors'
import { finishSession, startSession } from '@/data/repositories/sessions'
import { plural } from '@/domain/text'
import type { Attempt } from '@/domain/types'
import { useDialogs } from '@/ui/Dialogs'
import { plannedAttempts, sessionFormat } from './params'
import { TrainerView } from './TrainerView'

export function TrainPage() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const dialogs = useDialogs()
  const shot = useShot(id)
  const player = useActivePlayer()

  // Geprueft, nicht zugesichert: siehe params.ts.
  const format = sessionFormat(params.get('format'))
  const planned = plannedAttempts(params.get('attempts'))

  if (shot === undefined || player === null) {
    return (
      <div className="page">
        <p className="muted">Wird geladen …</p>
      </div>
    )
  }
  if (shot === null) {
    return (
      <div className="page">
        <h1>Stoß nicht gefunden</h1>
        <button className="btn" onClick={() => navigate('/library')}>
          Zu den Stößen
        </button>
      </div>
    )
  }

  const complete = async (results: Attempt[]) => {
    const session = startSession(shot, player.id, format, planned)
    const finished = await finishSession(session, shot, results)
    navigate(`/session/${finished.id}`, { replace: true })
  }

  const quit = async (recorded: number) => {
    if (recorded > 0) {
      const ok = await dialogs.confirm({
        title: 'Training abbrechen?',
        message: `${plural(recorded, 'erfasster Versuch wird', 'erfasste Versuche werden')} verworfen.`,
        confirmLabel: 'Abbrechen',
        cancelLabel: 'Fortsetzen',
        danger: true,
      })
      if (!ok) return
    }
    navigate(`/shot/${shot.id}`)
  }

  return (
    <TrainerView
      shot={shot}
      planned={planned}
      onQuit={(n) => void quit(n)}
      onComplete={complete}
      onError={(err) => dialogs.toast(`Nicht gespeichert: ${storageErrorText(err)}`, 'error')}
    />
  )
}
