/** Trainingseinheit: Versuch fuer Versuch erfassen. */

import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useActivePlayer, useApp } from '@/app/store'
import { AimLayer, BallLayer, PathLayer, TargetZoneLayer } from '@/components/table/Layers'
import { TableSvg } from '@/components/table/TableSvg'
import { clientToTable, flipY } from '@/components/table/space'
import { useShot } from '@/data/hooks'
import { finishSession, startSession } from '@/data/repositories/sessions'
import { clampBall } from '@/domain/geometry'
import { MAX_POINTS, buildAttempt, effectiveMode, sessionScore } from '@/domain/scoring'
import { aimPoint, cueBall, objectBalls } from '@/domain/shot'
import { SESSION_ATTEMPTS } from '@/domain/types'
import type { Attempt, Point, SessionFormat } from '@/domain/types'
import { useDialogs } from '@/ui/Dialogs'

export function TrainPage() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const dialogs = useDialogs()
  const shot = useShot(id)
  const player = useActivePlayer()
  const settings = useApp((s) => s.settings)
  const spaceRef = useRef<SVGGElement>(null)

  const format = (params.get('format') ?? 'standard') as SessionFormat
  const planned = Number(params.get('attempts')) || SESSION_ATTEMPTS.standard

  const [results, setResults] = useState<Attempt[]>([])
  const [end, setEnd] = useState<Point | null>(null)
  const [saving, setSaving] = useState(false)

  const session = useMemo(
    () => (shot && player ? startSession(shot, player.id, format, planned) : null),
    // Die Session wird einmal je Stoss und Format angelegt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [shot?.id, player?.id, format, planned],
  )

  // Beim Verlassen der Seite waehrend eines Zuges nichts speichern.
  useEffect(() => setResults([]), [shot?.id, format, planned])

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

  const needsPosition = effectiveMode(shot.scoring) !== 'pocket'
  const index = results.length
  const done = index >= planned
  const running = sessionScore(results, Math.max(index, 1))

  const record = async (pocketed: boolean, scratch: boolean) => {
    const attempt = buildAttempt(shot, index, { pocketed, scratch, cueBallEnd: end })
    const next = [...results, attempt]
    setResults(next)
    setEnd(null)
    if (next.length >= planned && session) {
      setSaving(true)
      const finished = await finishSession(session, shot, next)
      navigate(`/session/${finished.id}`, { replace: true })
    }
  }

  const undoLast = () => {
    setResults((r) => r.slice(0, -1))
    setEnd(null)
  }

  const quit = async () => {
    if (results.length > 0) {
      const ok = await dialogs.confirm({
        title: 'Training abbrechen?',
        message: `${results.length} erfasste Versuche werden verworfen.`,
        confirmLabel: 'Abbrechen',
        danger: true,
      })
      if (!ok) return
    }
    navigate(`/shot/${shot.id}`)
  }

  const cue = cueBall(shot)
  const obj = objectBalls(shot)[0]

  return (
    <div className="builder">
      <header className="builder__head">
        <button className="btn btn--ghost btn--sm" onClick={() => void quit()}>
          ← Beenden
        </button>
        <strong>{shot.name}</strong>
        <span className="spacer" />
        <span className="muted small">
          Versuch {Math.min(index + 1, planned)} von {planned}
        </span>
        <span className="prof prof--proficient" style={{ borderColor: 'var(--line)' }}>
          {running.toFixed(0)} %
        </span>
      </header>

      <div className="builder__body" style={{ gridTemplateColumns: '1fr' }}>
        <div className="builder__stage">
          <TableSvg
            ref={spaceRef}
            orientation={settings.orientation}
            clothColor={settings.clothColor}
            railColor={settings.railColor}
            interactive={needsPosition}
            onPointerDown={(e) => {
              if (!needsPosition) return
              const p = clientToTable(spaceRef.current, e.clientX, e.clientY)
              if (p) setEnd(clampBall(p))
            }}
          >
            <TargetZoneLayer zone={shot.scoring.targetZone} />
            <PathLayer paths={shot.paths} balls={shot.balls} />
            <AimLayer
              cue={cue ? { x: cue.x, y: cue.y } : null}
              object={obj ? { x: obj.x, y: obj.y } : null}
              aim={aimPoint(shot)}
            />
            <BallLayer balls={shot.balls} />
            {end && (
              <g pointerEvents="none">
                <circle cx={end.x} cy={flipY(end.y)} r={1.4} fill="none" stroke="#f7f4ea" strokeWidth={0.35} />
                <path
                  d={`M ${end.x - 2.2} ${flipY(end.y)} h 4.4 M ${end.x} ${flipY(end.y) - 2.2} v 4.4`}
                  stroke="#f7f4ea"
                  strokeWidth={0.28}
                />
              </g>
            )}
          </TableSvg>
        </div>
      </div>

      <div className="builder__actions">
        <div className="attempts">
          {Array.from({ length: planned }, (_, i) => {
            const r = results[i]
            const cls = !r
              ? 'attempts__dot'
              : r.points >= MAX_POINTS * 0.8
                ? 'attempts__dot is-good'
                : r.points > 0
                  ? 'attempts__dot is-ok'
                  : 'attempts__dot is-miss'
            return <span key={i} className={cls} />
          })}
        </div>
        <span className="spacer" />
        {results.length > 0 && !done && (
          <button className="btn btn--sm" onClick={undoLast}>
            Letzten zuruecknehmen
          </button>
        )}
      </div>

      <div className="train__buttons">
        {needsPosition && (
          <span className="small muted train__hint">
            {end
              ? 'Position erfasst. Jetzt das Ergebnis waehlen.'
              : 'Auf den Tisch tippen, wo der Weisse liegen geblieben ist.'}
          </span>
        )}
        <button className="btn btn--wide btn--primary" disabled={saving || done} onClick={() => void record(true, false)}>
          Eingelocht
        </button>
        <button className="btn btn--wide" disabled={saving || done} onClick={() => void record(false, false)}>
          Verfehlt
        </button>
        <button className="btn btn--wide btn--danger" disabled={saving || done} onClick={() => void record(false, true)}>
          Kratzer
        </button>
      </div>
    </div>
  )
}
