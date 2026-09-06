import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useActivePlayer, useApp } from '@/app/store'
import { ShotDiagram } from '@/components/table/ShotDiagram'
import { useSessions, useShots } from '@/data/hooks'
import { recommend } from '@/domain/coach'
import { evaluateAchievements } from '@/domain/achievements'
import { overallRating, rankedSkills } from '@/domain/skills'
import { SKILL_LABELS } from '@/domain/types'
import { Bars } from '@/features/stats/charts'
import { EmptyState, Stat } from '@/ui/bits'

const DAY = 24 * 60 * 60 * 1000

export function DashboardPage() {
  const navigate = useNavigate()
  const player = useActivePlayer()
  const players = useApp((s) => s.players)
  const setActivePlayer = useApp((s) => s.setActivePlayer)
  const settings = useApp((s) => s.settings)
  const shots = useShots()
  const sessions = useSessions(player?.id ?? null)

  const recommendations = useMemo(() => {
    if (!player || !shots || !sessions) return []
    return recommend({ shots, sessions, player }, 4)
  }, [player, shots, sessions])

  const finished = useMemo(
    () => (sessions ?? []).filter((s) => s.finishedAt !== null),
    [sessions],
  )

  const lastWeek = finished.filter((s) => (s.finishedAt ?? 0) > Date.now() - 7 * DAY)
  const attemptsWeek = lastWeek.reduce((a, s) => a + s.results.length, 0)
  const rating = player ? overallRating(player.skillRatings) : 0

  const weakest = useMemo(() => {
    if (!player) return []
    return rankedSkills(player.skillRatings)
      .slice(0, 5)
      .map((e) => ({
        label: SKILL_LABELS[e.skill],
        value: e.rating,
        hint: e.practiced ? undefined : 'noch nie trainiert',
      }))
  }, [player])

  const unlocked = useMemo(() => {
    if (!player || !shots || !sessions) return 0
    return evaluateAchievements({ player, shots, sessions }).filter((a) => a.unlocked).length
  }, [player, shots, sessions])

  return (
    <div className="page stack">
      <div className="page__head">
        <div>
          <h1>Training</h1>
          <p className="page__sub">
            {player ? `Profil: ${player.name}` : 'Kein Spielerprofil vorhanden'}
          </p>
        </div>
        {players.length > 1 && (
          <div className="row row--tight">
            {players.map((p) => (
              <button
                key={p.id}
                className={`chip${p.id === player?.id ? ' is-on' : ''}`}
                onClick={() => void setActivePlayer(p.id)}
              >
                {p.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
        <Stat label="Gesamtrating" value={rating.toFixed(0)} hint="Mittel ueber alle Faehigkeiten" />
        <Stat label="Sessions" value={finished.length} hint={`${lastWeek.length} in den letzten 7 Tagen`} />
        <Stat label="Versuche diese Woche" value={attemptsWeek} />
        <Stat label="Erfolge" value={unlocked} hint="freigeschaltet" />
      </div>

      <section className="stack">
        <div className="row">
          <h2>Der Coach empfiehlt</h2>
          <span className="spacer" />
          <Link className="btn btn--sm btn--ghost" to="/library">
            Alle Stoesse
          </Link>
        </div>

        {recommendations.length === 0 ? (
          <EmptyState title="Noch keine Empfehlungen">
            <span className="small muted">Erst ein paar Einheiten trainieren.</span>
          </EmptyState>
        ) : (
          <div className="grid">
            {recommendations.map((rec) => (
              <div key={rec.shot.id} className="card stack" style={{ gap: 10 }}>
                <Link to={`/shot/${rec.shot.id}`} style={{ display: 'block' }}>
                  <ShotDiagram
                    shot={rec.shot}
                    clothColor={settings.clothColor}
                    railColor={settings.railColor}
                    showDiamonds={false}
                    showMarkings={false}
                  />
                </Link>
                <strong>{rec.shot.name}</strong>
                <span className="small muted">{rec.reason}</span>
                <button
                  className="btn btn--sm btn--primary"
                  onClick={() => navigate(`/train/${rec.shot.id}?format=quick&attempts=10`)}
                >
                  Kurze Einheit
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card stack">
        <h2>Schwaechste Faehigkeiten</h2>
        <Bars items={weakest} unit="" />
        <Link className="btn btn--sm btn--ghost" to="/stats">
          Zur Statistik
        </Link>
      </section>
    </div>
  )
}
