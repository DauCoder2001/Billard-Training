import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useActivePlayer } from '@/app/store'
import { useSessions, useShots } from '@/data/hooks'
import { statsByShot } from '@/domain/coach'
import { pocketRate, proficiencyFor, scratchRate } from '@/domain/scoring'
import { overallRating, rankedSkills } from '@/domain/skills'
import { SKILL_LABELS, SKILL_TAGS } from '@/domain/types'
import { EmptyState, ProficiencyBadge, Stat } from '@/ui/bits'
import { Bars, SkillRadar, Sparkline } from './charts'

const DAY = 24 * 60 * 60 * 1000

type Range = 7 | 30 | 0

export function StatsPage() {
  const player = useActivePlayer()
  const shots = useShots()
  const sessions = useSessions(player?.id ?? null)
  const [range, setRange] = useState<Range>(30)

  const finished = useMemo(() => {
    const all = (sessions ?? [])
      .filter((s) => s.finishedAt !== null)
      .sort((a, b) => (a.finishedAt ?? 0) - (b.finishedAt ?? 0))
    if (range === 0) return all
    const since = Date.now() - range * DAY
    return all.filter((s) => (s.finishedAt ?? 0) >= since)
  }, [sessions, range])

  const perShot = useMemo(() => statsByShot(sessions ?? []), [sessions])

  const rows = useMemo(() => {
    if (!shots) return []
    return shots
      .map((shot) => ({ shot, st: perShot.get(shot.id) }))
      .filter((r) => r.st)
      .sort((a, b) => (a.st?.lastScore ?? 0) - (b.st?.lastScore ?? 0))
  }, [shots, perShot])

  const allAttempts = finished.flatMap((s) => s.results)
  const rating = player ? overallRating(player.skillRatings) : 0
  const skills = player ? rankedSkills(player.skillRatings) : []
  const radar = useMemo(
    () =>
      player
        ? SKILL_TAGS.map((skill) => ({ skill, rating: player.skillRatings[skill] ?? 0 }))
        : [],
    [player],
  )

  if (!player) {
    return (
      <div className="page">
        <h1>Statistik</h1>
        <p className="muted">Kein Spielerprofil vorhanden.</p>
      </div>
    )
  }

  return (
    <div className="page stack">
      <div className="page__head">
        <div>
          <h1>Statistik</h1>
          <p className="page__sub">{player.name}</p>
        </div>
        <div className="row row--tight">
          {(
            [
              [7, '7 Tage'],
              [30, '30 Tage'],
              [0, 'Alles'],
            ] as const
          ).map(([r, label]) => (
            <button
              key={r}
              className={`chip${range === r ? ' is-on' : ''}`}
              onClick={() => setRange(r)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {finished.length === 0 ? (
        <EmptyState title="Noch keine Daten im gewaehlten Zeitraum">
          <Link className="btn btn--sm" to="/library">
            Eine Einheit trainieren
          </Link>
        </EmptyState>
      ) : (
        <>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
            <Stat label="Gesamtrating" value={rating.toFixed(0)} />
            <Stat label="Sessions" value={finished.length} />
            <Stat label="Versuche" value={allAttempts.length} />
            <Stat
              label="Trefferquote"
              value={`${pocketRate(allAttempts).toFixed(0)} %`}
              hint={`Kratzer ${scratchRate(allAttempts).toFixed(0)} %`}
            />
          </div>

          <div className="detail">
            <div className="card stack">
              <h2>Ergebnisse im Verlauf</h2>
              <Sparkline values={finished.map((s) => s.score)} />
              <span className="small muted">
                Jeder Punkt eine Einheit, aelteste links. Aktueller Schnitt{' '}
                {(finished.reduce((a, s) => a + s.score, 0) / finished.length).toFixed(0)} %.
              </span>
            </div>

            <div className="card stack" style={{ alignItems: 'center' }}>
              <h2 style={{ alignSelf: 'flex-start' }}>Faehigkeitsprofil</h2>
              <SkillRadar values={radar} />
            </div>
          </div>

          <div className="card stack">
            <h2>Faehigkeiten im Einzelnen</h2>
            <Bars
              items={skills.map((s) => ({
                label: SKILL_LABELS[s.skill],
                value: s.rating,
                hint: s.practiced ? undefined : 'noch nie trainiert',
              }))}
              unit=""
            />
          </div>

          <div className="card stack">
            <h2>Stoesse, schwaechste zuerst</h2>
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>Stoss</th>
                    <th>Sessions</th>
                    <th>Letztes</th>
                    <th>Bestes</th>
                    <th>Schnitt</th>
                    <th>Einstufung</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ shot, st }) => (
                    <tr key={shot.id}>
                      <td>
                        <Link to={`/shot/${shot.id}`}>{shot.name}</Link>
                      </td>
                      <td>{st?.sessions}</td>
                      <td>{st?.lastScore?.toFixed(0)} %</td>
                      <td>{st?.bestScore?.toFixed(0)} %</td>
                      <td>{st?.avgScore?.toFixed(0)} %</td>
                      <td>
                        {st?.lastScore != null && (
                          <ProficiencyBadge
                            value={proficiencyFor(st.lastScore, shot.scoring.thresholds)}
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
