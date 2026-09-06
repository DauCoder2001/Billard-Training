/** Eine einzelne Trainingseinheit zu einem Stoss. */

import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useActivePlayer } from '@/app/store'
import { useShot } from '@/data/hooks'
import { finishSession, startSession } from '@/data/repositories/sessions'
import { SESSION_ATTEMPTS } from '@/domain/types'
import type { Attempt, SessionFormat } from '@/domain/types'
import { useDialogs } from '@/ui/Dialogs'
import { TrainerView } from './TrainerView'

export function TrainPage() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const dialogs = useDialogs()
  const shot = useShot(id)
  const player = useActivePlayer()

  const format = (params.get('format') ?? 'standard') as SessionFormat
  const planned = Number(params.get('attempts')) || SESSION_ATTEMPTS.standard

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
        <h1>Stoss nicht gefunden</h1>
        <button className="btn" onClick={() => navigate('/library')}>
          Zur Bibliothek
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
        message: `${recorded} erfasste Versuche werden verworfen.`,
        confirmLabel: 'Abbrechen',
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
    />
  )
}
