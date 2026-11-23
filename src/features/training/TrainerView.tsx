/** Die Erfassungsansicht einer Trainingseinheit.
 *
 *  Wird sowohl von der einzelnen Einheit als auch vom Workout benutzt, damit
 *  die Bedienung am Tisch in beiden Faellen dieselbe ist. */

import { useEffect, useRef, useState } from 'react'
import { useApp } from '@/app/store'
import { AimLayer, BallLayer, PathLayer, TargetZoneLayer } from '@/components/table/Layers'
import { TableSvg } from '@/components/table/TableSvg'
import { clientToTable, flipY } from '@/components/table/space'
import { clampBall } from '@/domain/geometry'
import {
  MAX_POINTS,
  buildAttempt,
  effectiveMode,
  hasObjectBall,
  sessionScore,
} from '@/domain/scoring'
import { aimPoint, cueBall, objectBalls } from '@/domain/shot'
import type { Attempt, Point, Shot } from '@/domain/types'

interface TrainerViewProps {
  shot: Shot
  planned: number
  /** Zusatz in der Kopfzeile, etwa die Position im Workout. */
  subtitle?: string
  onQuit: (recorded: number) => void
  /**
   * Meldet laufend, wie viele Versuche schon erfasst sind. Die Seite
   * darueber braucht die Zahl, um beim Verlassen zu wissen, was verloren
   * ginge - sie steht sonst nur hier drin.
   */
  onProgress?: (recorded: number) => void
  onComplete: (results: Attempt[]) => Promise<void> | void
  /** Scheitert das Abschliessen, bleibt die Erfassung sonst stumm gesperrt. */
  onError?: (error: unknown) => void
}

export function TrainerView({
  shot,
  planned,
  subtitle,
  onQuit,
  onProgress,
  onComplete,
  onError,
}: TrainerViewProps) {
  const settings = useApp((s) => s.settings)
  const spaceRef = useRef<SVGGElement>(null)
  const [results, setResults] = useState<Attempt[]>([])
  const [end, setEnd] = useState<Point | null>(null)
  const [busy, setBusy] = useState(false)

  // Zum Zuruecksetzen beim Wechsel auf einen anderen Stoss steht ein key am
  // Bauteil - beide aufrufenden Seiten setzen ihn. Ein Wechsel baut die
  // Ansicht damit neu auf, und der Zustand beginnt von selbst von vorn.

  // Eine Uebung aus nur dem Weissen hat nichts einzulochen: dann gibt es
  // kein "Eingelocht" und kein "Verfehlt", sondern nur den erfassten
  // Versuch - und den Kratzer, der auch hier ein Fehlversuch bleibt.
  const mitObjektball = hasObjectBall(shot)
  const needsPosition = effectiveMode(shot.scoring, mitObjektball) !== 'pocket'
  useEffect(() => {
    onProgress?.(results.length)
  }, [results.length, onProgress])

  const index = results.length
  const done = index >= planned
  const running = sessionScore(results, Math.max(index, 1))

  const record = async (pocketed: boolean, scratch: boolean) => {
    if (busy || done) return
    const next = [...results, buildAttempt(shot, index, { pocketed, scratch, cueBallEnd: end })]
    setResults(next)
    setEnd(null)
    if (next.length >= planned) {
      setBusy(true)
      try {
        await onComplete(next)
      } catch (err) {
        // Den letzten Versuch zuruecknehmen und wieder freigeben: so steht
        // der Knopf erneut bereit, statt nach 20 Versuchen am Tisch grau
        // zu bleiben. Ohne das waere die Einheit verloren.
        setResults(results)
        setEnd(end)
        setBusy(false)
        onError?.(err)
      }
    }
  }

  const cue = cueBall(shot)
  const obj = objectBalls(shot)[0]

  return (
    <div className="builder">
      <header className="builder__head">
        <button className="btn btn--ghost btn--sm" onClick={() => onQuit(results.length)}>
          ← Abbrechen
        </button>
        <strong>{shot.name}</strong>
        {subtitle && <span className="muted small">{subtitle}</span>}
        <span className="spacer" />
        <span className="muted small">
          Versuch {Math.min(index + 1, planned)} von {planned}
        </span>
        <span className="score-pill">{running.toFixed(0)} %</span>
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
            const state = !r
              ? ''
              : r.points >= MAX_POINTS * 0.8
                ? ' is-good'
                : r.points > 0
                  ? ' is-ok'
                  : ' is-miss'
            return <span key={i} className={`attempts__dot${state}`} />
          })}
        </div>
        <span className="spacer" />
        {results.length > 0 && !done && (
          <button
            className="btn btn--sm"
            onClick={() => {
              setResults((r) => r.slice(0, -1))
              setEnd(null)
            }}
          >
            Letzten zurücknehmen
          </button>
        )}
      </div>

      <div className="train__buttons">
        {needsPosition && (
          <span className="small muted train__hint">
            {end
              ? 'Position erfasst. Jetzt das Ergebnis wählen.'
              : 'Auf den Tisch tippen, wo der Weiße liegen geblieben ist.'}
          </span>
        )}
        {/* Zaehlt die Position mit, waere ein Treffer ohne erfasste Position
            automatisch nur halb so viel wert. Lieber erst danach fragen. */}
        <button
          className="btn btn--wide btn--primary"
          disabled={busy || done || (needsPosition && !end)}
          onClick={() => void record(true, false)}
        >
          {mitObjektball ? 'Eingelocht' : 'Erfassen'}
        </button>
        {mitObjektball && (
          <button className="btn btn--wide" disabled={busy || done} onClick={() => void record(false, false)}>
            Verfehlt
          </button>
        )}
        <button className="btn btn--wide btn--scratch" disabled={busy || done} onClick={() => void record(false, true)}>
          Kratzer
        </button>
      </div>
    </div>
  )
}
