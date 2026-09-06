/** Ergebnis einer Trainingseinheit. */

import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useActivePlayer } from '@/app/store'
import { useSession, useSessions, useShot } from '@/data/hooks'
import { MAX_POINTS, pocketRate, scratchRate } from '@/domain/scoring'
import { SESSION_ATTEMPTS } from '@/domain/types'
import { ProficiencyBadge, Stat } from '@/ui/bits'
import { Sparkline } from '@/features/stats/charts'

export function SessionSummaryPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const session = useSession(id)
  const shot = useShot(session?.shotId)
  const player = useActivePlayer()
  const allSessions = useSessions(player?.id ?? null)

  const history = useMemo(
    () =>
      (allSessions ?? [])
        .filter((s) => s.shotId === session?.shotId && s.finishedAt !== null)
        .sort((a, b) => (a.finishedAt ?? 0) - (b.finishedAt ?? 0)),
    [allSessions, session?.shotId],
  )

  if (!session || !shot) {
    return (
      <div className="page">
        <p className="muted">Wird geladen …</p>
      </div>
    )
  }

  const previous = history.filter((s) => s.id !== session.id).slice(-1)[0]
  const delta = previous ? session.score - previous.score : null
  const points = session.results.reduce((a, r) => a + r.points, 0)

  return (
    <div className="page stack">
      <div className="page__head">
        <div>
          <span className="tiny">Ergebnis</span>
          <h1>{shot.name}</h1>
          <p className="page__sub">
            {session.results.length} Versuche ·{' '}
            {new Date(session.finishedAt ?? session.startedAt).toLocaleString('de-DE')}
          </p>
        </div>
        <ProficiencyBadge value={session.proficiency} />
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
        <Stat
          label="Ergebnis"
          value={`${session.score.toFixed(0)} %`}
          hint={
            delta === null
              ? 'erste Session'
              : delta >= 0
                ? `+${delta.toFixed(0)} gegenueber der letzten`
                : `${delta.toFixed(0)} gegenueber der letzten`
          }
        />
        <Stat label="Punkte" value={`${points} / ${session.results.length * MAX_POINTS}`} />
        <Stat label="Trefferquote" value={`${pocketRate(session.results).toFixed(0)} %`} />
        <Stat label="Kratzer" value={`${scratchRate(session.results).toFixed(0)} %`} />
      </div>

      <div className="card stack">
        <h3>Versuche</h3>
        <div className="attempts attempts--large">
          {session.results.map((r) => (
            <span
              key={r.index}
              title={`Versuch ${r.index + 1}: ${r.points} Punkte`}
              className={`attempts__dot ${
                r.points >= MAX_POINTS * 0.8 ? 'is-good' : r.points > 0 ? 'is-ok' : 'is-miss'
              }`}
            />
          ))}
        </div>
        <span className="small muted">
          Gefuellt = starker Versuch, blass = teilweise, dunkel = daneben oder Kratzer.
        </span>
      </div>

      {history.length > 1 && (
        <div className="card stack">
          <h3>Verlauf dieses Stosses</h3>
          <Sparkline values={history.map((s) => s.score)} />
        </div>
      )}

      <div className="row">
        <button
          className="btn btn--primary"
          onClick={() =>
            navigate(
              `/train/${shot.id}?format=${session.format}&attempts=${session.attempts || SESSION_ATTEMPTS.standard}`,
              { replace: true },
            )
          }
        >
          Nochmal
        </button>
        <button className="btn" onClick={() => navigate(`/shot/${shot.id}`)}>
          Zum Stoss
        </button>
        <button className="btn" onClick={() => navigate('/')}>
          Zur Startseite
        </button>
      </div>
    </div>
  )
}
