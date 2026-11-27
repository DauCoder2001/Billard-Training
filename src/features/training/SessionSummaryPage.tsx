/** Ergebnis einer Trainingseinheit. */

import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useActivePlayer } from '@/app/store'
import { useSession, useSessions, useShot } from '@/data/hooks'
import { MAX_POINTS, hasObjectBall, pocketCounts, pocketRate, scratchRate } from '@/domain/scoring'
import { plural } from '@/domain/text'
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

  // Vier Faelle, nicht zwei: undefined heisst "wird noch gelesen", null
  // heisst "gibt es nicht". Zusammengefasst stand auf der Seite einer
  // unbekannten Einheit fuer immer "Wird geladen ..." - etwa nach der
  // Zurueck-Taste, wenn der Stoss samt seiner Historie geloescht wurde.
  //
  // Die Reihenfolge ist wichtig: solange die Einheit fehlt, kennt useShot
  // keine Id und liefert null. Zuerst nach shot zu fragen hiesse, beim Lesen
  // "nicht gefunden" anzuzeigen.
  if (session === undefined) return <Laedt />
  if (session === null) {
    return (
      <Fehlt
        titel="Einheit nicht gefunden"
        text="Diese Einheit gibt es nicht mehr. Wird eine Übung gelöscht, geht ihre Trainingshistorie mit ihr."
        onBack={() => navigate('/library')}
      />
    )
  }
  if (shot === undefined) return <Laedt />
  if (shot === null) {
    return (
      <Fehlt
        titel="Übung nicht gefunden"
        text="Die Übung dieser Einheit wurde gelöscht."
        onBack={() => navigate('/library')}
      />
    )
  }

  // Ohne Objektball gibt es nichts einzulochen, und bei einer Safe soll der
  // Ball nicht fallen: eine Trefferquote von 0 Prozent saehe aus wie ein
  // schlechtes Ergebnis, obwohl sie die Aufgabe ist. Dann steht dort ein
  // Strich mit dem Grund daneben.
  const zaehltEinlochen = pocketCounts(shot)
  const grund = hasObjectBall(shot) ? 'Einlochen zählt nicht' : 'nichts einzulochen'
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
            {plural(session.results.length, 'Versuch', 'Versuche')} ·{' '}
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
              ? 'erste Einheit'
              : delta >= 0
                ? `+${delta.toFixed(0)} gegenüber der letzten`
                : `${delta.toFixed(0)} gegenüber der letzten`
          }
        />
        <Stat label="Punkte" value={`${points} / ${session.results.length * MAX_POINTS}`} />
        <Stat
          label="Trefferquote"
          value={zaehltEinlochen ? `${pocketRate(session.results).toFixed(0)} %` : '–'}
          hint={zaehltEinlochen ? undefined : grund}
        />
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
          Gefüllt = starker Versuch, blass = teilweise, dunkel = daneben oder Kratzer.
        </span>
      </div>

      {history.length > 1 && (
        <div className="card stack">
          <h3>Verlauf dieser Übung</h3>
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
          Zur Übung
        </button>
        <button className="btn" onClick={() => navigate('/')}>
          Zum Start
        </button>
      </div>
    </div>
  )
}

function Laedt() {
  return (
    <div className="page">
      <p className="muted">Wird geladen …</p>
    </div>
  )
}

/** Keine Sackgasse: sagen, was fehlt, und einen Weg zurueck anbieten. */
function Fehlt({
  titel,
  text,
  onBack,
}: {
  titel: string
  text: string
  onBack: () => void
}) {
  return (
    <div className="page stack">
      <h1>{titel}</h1>
      <p className="muted">{text}</p>
      <div className="row">
        <button className="btn" onClick={onBack}>
          Zu den Übungen
        </button>
      </div>
    </div>
  )
}
