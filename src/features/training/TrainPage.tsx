/** Eine einzelne Trainingseinheit zu einem Stoss. */

import { useCallback, useRef } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useActivePlayer } from '@/app/store'
import { useLeaveGuard } from '@/app/useLeaveGuard'
import { useShot } from '@/data/hooks'
import { storageErrorText } from '@/data/errors'
import { finishSession, startSession } from '@/data/repositories/sessions'
import { isScorable } from '@/domain/scoring'
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

  // Der Stand des Trainers, gemeldet von unten. Ein Ref, damit das Zaehlen
  // die Seite nicht bei jedem Versuch neu zeichnet.
  const erfasst = useRef(0)
  const meldeStand = useCallback((n: number) => {
    erfasst.current = n
  }, [])

  // Erfasste Versuche sind nirgends gespeichert, bis die Einheit fertig
  // ist. Jeder Weg hinaus fragt deshalb nach - der eigene Knopf, die
  // Zurueck-Taste, die Wischbewegung und das Neuladen.
  const { ohneNachfrage } = useLeaveGuard(
    useCallback(() => {
      const n = erfasst.current
      if (n === 0) return null
      return {
        title: 'Training abbrechen?',
        message: `${plural(n, 'erfasster Versuch wird', 'erfasste Versuche werden')} verworfen.`,
        confirmLabel: 'Abbrechen',
        cancelLabel: 'Fortsetzen',
        danger: true,
      }
    }, []),
  )

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

  // Ein Stoss ohne Objektball und ohne Zielzone hat keinen Massstab. Lieber
  // hier sagen, was fehlt, als zwanzig Versuche lang dieselbe Punktzahl
  // verteilen und das Ergebnis ins Profil schreiben.
  if (!isScorable(shot)) {
    return (
      <div className="page stack">
        <h1>Dieser Stoß lässt sich nicht bewerten</h1>
        <p className="muted">
          „{shot.name}" hat weder einen Objektball noch eine Zielzone. Ohne Objektball
          gibt es nichts einzulochen, ohne Zielzone nichts zu messen.
        </p>
        <p className="muted">
          Setz im Baukasten eine Zielzone – oder einen Objektball.
        </p>
        <div className="row">
          <button className="btn btn--primary" onClick={() => navigate(`/builder/${shot.id}`)}>
            Im Baukasten öffnen
          </button>
          <button className="btn" onClick={() => navigate(`/shot/${shot.id}`)}>
            Zurück zum Stoß
          </button>
        </div>
      </div>
    )
  }

  const complete = async (results: Attempt[]) => {
    const session = startSession(shot, player.id, format, planned)
    const finished = await finishSession(session, shot, results)
    // Die Einheit steht in der Datenbank; es gibt nichts mehr zu verwerfen.
    ohneNachfrage(() => navigate(`/session/${finished.id}`, { replace: true }))
  }

  // Die Rueckfrage stellt der Waechter - hier bleibt nur der Weg.
  const quit = () => navigate(`/shot/${shot.id}`)

  return (
    <TrainerView
      key={`${shot.id}-${planned}`}
      shot={shot}
      planned={planned}
      onQuit={quit}
      onProgress={meldeStand}
      onComplete={complete}
      onError={(err) => dialogs.toast(`Nicht gespeichert: ${storageErrorText(err)}`, 'error')}
    />
  )
}
