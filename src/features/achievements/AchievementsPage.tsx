import { useMemo } from 'react'
import { useActivePlayer } from '@/app/store'
import { useSessions, useShots } from '@/data/hooks'
import { evaluateAchievements } from '@/domain/achievements'
import { Bar } from '@/ui/bits'

export function AchievementsPage() {
  const player = useActivePlayer()
  const shots = useShots()
  const sessions = useSessions(player?.id ?? null)

  const states = useMemo(() => {
    if (!player || !shots || !sessions) return []
    return evaluateAchievements({ player, shots, sessions })
  }, [player, shots, sessions])

  const unlocked = states.filter((s) => s.unlocked).length

  return (
    <div className="page stack">
      <div className="page__head">
        <div>
          <h1>Erfolge</h1>
          <p className="page__sub">
            {unlocked} von {states.length} freigeschaltet
            {player ? ` · ${player.name}` : ''}
          </p>
        </div>
      </div>

      <div className="grid">
        {states.map(({ achievement, progress, unlocked: done }) => (
          <div
            key={achievement.id}
            className="card stack"
            style={{ gap: 8, opacity: done ? 1 : 0.72 }}
          >
            <div className="row" style={{ gap: 10 }}>
              <span style={{ fontSize: 26, filter: done ? 'none' : 'grayscale(1)' }} aria-hidden>
                {achievement.icon}
              </span>
              <strong style={{ flex: 1 }}>{achievement.name}</strong>
              {done && <span className="prof prof--exemplary">Erreicht</span>}
            </div>
            <span className="small muted">{achievement.description}</span>
            {!done && (
              <>
                <Bar value={progress * 100} />
                <span className="tiny">{Math.round(progress * 100)} %</span>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
