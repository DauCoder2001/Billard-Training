/** Zeichenebenen im Tischdiagramm: Baelle, Ballwege, Zielzone, Ziellinie. */

import { useId, type PointerEvent as ReactPointerEvent } from 'react'
import { TABLE, controlThrough, ghostBall } from '@/domain/geometry'
import type { Ball, BallPath, Point, TargetZone } from '@/domain/types'
import { CUE_FILL, GHOST_STROKE, ballStyle } from './balls'
import { flipY } from './space'

// ------------------------------------------------------------------ Baelle

interface BallLayerProps {
  balls: Ball[]
  selectedId?: string | null
  showNumbers?: boolean
  onBallPointerDown?: (ball: Ball, e: ReactPointerEvent<SVGGElement>) => void
}

export function BallLayer({
  balls,
  selectedId,
  showNumbers = true,
  onBallPointerDown,
}: BallLayerProps) {
  // React-Ids enthalten Doppelpunkte; die stoeren in url(#...).
  const uid = useId().replace(/:/g, '')
  const r = TABLE.ballRadius
  return (
    <g>
      {balls.map((ball) => {
        const cx = ball.x
        const cy = flipY(ball.y)
        const selected = ball.id === selectedId
        const style = ballStyle(ball.number)
        const isCue = ball.kind === 'cue'
        const isGhost = ball.kind === 'ghost'
        const clipId = `stripe-${uid}-${ball.id}`

        return (
          <g
            key={ball.id}
            onPointerDown={(e) => onBallPointerDown?.(ball, e)}
            style={{ cursor: onBallPointerDown ? 'grab' : undefined }}
          >
            <circle cx={cx} cy={cy} r={r + 0.5} fill="rgba(0,0,0,0.28)" />
            {isGhost ? (
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={GHOST_STROKE}
                strokeWidth={0.28}
                strokeDasharray="1 0.9"
              />
            ) : isCue ? (
              <circle cx={cx} cy={cy} r={r} fill={CUE_FILL} stroke="#c9c3b2" strokeWidth={0.12} />
            ) : style.striped ? (
              <>
                <defs>
                  <clipPath id={clipId}>
                    <circle cx={cx} cy={cy} r={r} />
                  </clipPath>
                </defs>
                <circle cx={cx} cy={cy} r={r} fill="#f4f1e8" />
                <rect
                  x={cx - r}
                  y={cy - r * 0.55}
                  width={r * 2}
                  height={r * 1.1}
                  fill={style.fill}
                  clipPath={`url(#${clipId})`}
                />
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="#c9c3b2" strokeWidth={0.12} />
              </>
            ) : (
              <circle cx={cx} cy={cy} r={r} fill={style.fill} />
            )}

            {showNumbers && ball.number && !isGhost && (
              <>
                <circle cx={cx} cy={cy} r={r * 0.52} fill="#f7f4ea" opacity={style.striped ? 1 : 0.95} />
                <text className="ball-label" x={cx} y={cy} fill="#20241f">
                  {ball.number}
                </text>
              </>
            )}

            {ball.locked && (
              <circle cx={cx} cy={cy} r={r * 1.35} fill="none" stroke="#9fb3aa" strokeWidth={0.18} strokeDasharray="0.6 0.6" />
            )}
            {selected && (
              <circle cx={cx} cy={cy} r={r + 1} fill="none" stroke="var(--accent)" strokeWidth={0.4} />
            )}
            {/* Ein Ball ist auf dem Tablet nur wenige Pixel gross. Die
                unsichtbare Flaeche darueber macht ihn mit dem Finger
                greifbar, ohne das Diagramm zu veraendern. */}
            {onBallPointerDown && <circle cx={cx} cy={cy} r={r * 2.4} fill="transparent" />}
          </g>
        )
      })}
    </g>
  )
}

// ------------------------------------------------------------------- Wege

const PATH_STYLE: Record<BallPath['role'], { stroke: string; dash?: string }> = {
  cue: { stroke: '#f4f1e8', dash: '2.4 1.6' },
  object: { stroke: '#e8b530' },
  secondary: { stroke: '#4ea8de', dash: '1.4 1.2' },
}

/** SVG-Pfad aus Startpunkt und Segmenten. */
export function pathD(start: Point, path: BallPath): string {
  let prev = start
  let d = `M ${start.x} ${flipY(start.y)}`
  for (const seg of path.segments) {
    if (seg.curve) {
      const c = controlThrough(prev, seg.curve, seg.to)
      d += ` Q ${c.x} ${flipY(c.y)} ${seg.to.x} ${flipY(seg.to.y)}`
    } else {
      d += ` L ${seg.to.x} ${flipY(seg.to.y)}`
    }
    prev = seg.to
  }
  return d
}

/** Startpunkt eines Weges: der zugehoerige Ball oder ein freier Punkt. */
export function pathStart(path: BallPath, balls: Ball[]): Point | null {
  if (path.ballId) {
    const ball = balls.find((b) => b.id === path.ballId)
    if (ball) return { x: ball.x, y: ball.y }
  }
  return path.from ?? null
}

interface PathLayerProps {
  paths: BallPath[]
  balls: Ball[]
  selectedPathId?: string | null
  onPathPointerDown?: (path: BallPath, e: ReactPointerEvent<SVGPathElement>) => void
}

export function PathLayer({ paths, balls, selectedPathId, onPathPointerDown }: PathLayerProps) {
  // Eigene Marker-Ids je Diagramm, damit sich mehrere Diagramme auf einer
  // Seite nicht gegenseitig die Pfeilspitzen wegnehmen.
  const uid = useId().replace(/:/g, '')
  return (
    <g>
      <defs>
        {Object.entries(PATH_STYLE).map(([role, style]) => (
          <marker
            key={role}
            id={`arrow-${uid}-${role}`}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="4"
            markerHeight="4"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 9 5 L 0 9 z" fill={style.stroke} />
          </marker>
        ))}
      </defs>
      {paths.map((path) => {
        const start = pathStart(path, balls)
        if (!start || path.segments.length === 0) return null
        const style = PATH_STYLE[path.role]
        const selected = path.id === selectedPathId
        return (
          <g key={path.id}>
            {/* Breiter unsichtbarer Pfad darunter, damit sich Wege mit dem
                Finger treffen lassen. */}
            {onPathPointerDown && (
              <path
                d={pathD(start, path)}
                fill="none"
                stroke="transparent"
                strokeWidth={3.5}
                onPointerDown={(e) => onPathPointerDown(path, e)}
                style={{ cursor: 'pointer' }}
              />
            )}
            <path
              d={pathD(start, path)}
              fill="none"
              stroke={style.stroke}
              strokeWidth={selected ? 0.62 : 0.45}
              strokeDasharray={style.dash}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={selected ? 1 : 0.9}
              markerEnd={`url(#arrow-${uid}-${path.role})`}
              pointerEvents="none"
            />
          </g>
        )
      })}
    </g>
  )
}

// -------------------------------------------------------------- Zielzone

export function TargetZoneLayer({ zone }: { zone: TargetZone | null }) {
  if (!zone) return null
  const cy = flipY(zone.y)
  return (
    <g pointerEvents="none">
      {[4, 3, 2, 1.5, 1].map((f) => (
        <circle
          key={f}
          cx={zone.x}
          cy={cy}
          r={zone.r * f}
          fill="none"
          stroke="#e8b530"
          strokeWidth={0.16}
          opacity={0.28}
        />
      ))}
      <circle cx={zone.x} cy={cy} r={zone.r} fill="#e8b530" opacity={0.14} />
      <path
        d={`M ${zone.x - 1.4} ${cy} h 2.8 M ${zone.x} ${cy - 1.4} v 2.8`}
        stroke="#e8b530"
        strokeWidth={0.22}
        opacity={0.8}
      />
    </g>
  )
}

// -------------------------------------------------------------- Ziellinie

interface AimLayerProps {
  cue: Point | null
  object: Point | null
  aim: Point | null
}

/** Geisterball und Anspiellinie als Hilfe beim Aufbauen. */
export function AimLayer({ cue, object, aim }: AimLayerProps) {
  if (!cue || !object || !aim) return null
  const ghost = ghostBall(object, aim)
  return (
    <g pointerEvents="none" opacity={0.7}>
      <line
        x1={object.x}
        y1={flipY(object.y)}
        x2={aim.x}
        y2={flipY(aim.y)}
        stroke="#e8b530"
        strokeWidth={0.2}
        strokeDasharray="1.2 1.2"
      />
      <line
        x1={cue.x}
        y1={flipY(cue.y)}
        x2={ghost.x}
        y2={flipY(ghost.y)}
        stroke={GHOST_STROKE}
        strokeWidth={0.2}
        strokeDasharray="1.2 1.2"
      />
      <circle
        cx={ghost.x}
        cy={flipY(ghost.y)}
        r={TABLE.ballRadius}
        fill="none"
        stroke={GHOST_STROKE}
        strokeWidth={0.22}
        strokeDasharray="0.9 0.8"
      />
    </g>
  )
}
