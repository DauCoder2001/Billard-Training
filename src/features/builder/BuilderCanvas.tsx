/** Die Zeichenflaeche des Builders: Baelle setzen und ziehen, Tasche
 *  waehlen, Ballwege formen, Zielzone platzieren. */

import { useCallback, useRef, type PointerEvent as ReactPointerEvent } from 'react'
import { POCKETS, TABLE, clampBall, midpoint, resolveOverlaps, snapToGrid } from '@/domain/geometry'
import { aimPoint, cueBall, objectBalls } from '@/domain/shot'
import type { Ball, Point, Shot } from '@/domain/types'
import { AimLayer, BallLayer, PathLayer, TargetZoneLayer, pathStart } from '@/components/table/Layers'
import { TableSvg } from '@/components/table/TableSvg'
import { clientToTable, flipY, type Orientation } from '@/components/table/space'
import { useApp } from '@/app/store'
import { useBuilder } from './store'

interface BuilderCanvasProps {
  orientation: Orientation
  showGrid: boolean
  showAim: boolean
}

export function BuilderCanvas({ orientation, showGrid, showAim }: BuilderCanvasProps) {
  const spaceRef = useRef<SVGGElement>(null)
  const settings = useApp((s) => s.settings)

  const shot = useBuilder((s) => s.shot)
  const mode = useBuilder((s) => s.mode)
  const drag = useBuilder((s) => s.drag)
  const selectedBallId = useBuilder((s) => s.selectedBallId)
  const selectedPathId = useBuilder((s) => s.selectedPathId)

  const { select, setDrag, beginChange, apply, change, addBall, appendPathPoint, setMode } =
    useBuilder.getState()

  const snap = useCallback(
    (p: Point): Point => (settings.snapToGrid ? snapToGrid(p, settings.snapStep) : p),
    [settings.snapToGrid, settings.snapStep],
  )

  const pointAt = useCallback(
    (e: { clientX: number; clientY: number }): Point | null =>
      clientToTable(spaceRef.current, e.clientX, e.clientY),
    [],
  )

  const capture = (pointerId: number) => {
    spaceRef.current?.ownerSVGElement?.setPointerCapture(pointerId)
  }

  // ------------------------------------------------------------ Aufsetzen

  const onSurfaceDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    const p = pointAt(e)
    if (!p) return

    switch (mode) {
      case 'addObject':
        addBall('object', clampBall(snap(p)))
        return
      case 'addObstacle':
        addBall('obstacle', clampBall(snap(p)))
        return
      case 'addGhost':
        addBall('ghost', clampBall(snap(p)))
        return
      case 'path':
        appendPathPoint(snap(p))
        return
      case 'zone':
        change((s) => ({
          ...s,
          scoring: {
            ...s.scoring,
            targetZone: {
              r: s.scoring.targetZone?.r ?? settings.defaultTargetRadius,
              ...clampBall(p),
            },
          },
        }))
        setMode('select')
        return
      default:
        select(null, null)
    }
  }

  const onBallDown = (ball: Ball, e: ReactPointerEvent<SVGGElement>) => {
    e.stopPropagation()
    if (mode === 'path') {
      // Im Pfadmodus startet ein Tippen auf einen Ball einen neuen Weg.
      if (!selectedPathId) useBuilder.getState().startPath(ball.id, null)
      else appendPathPoint({ x: ball.x, y: ball.y })
      return
    }
    if (mode !== 'select') return
    select(ball.id, null)
    if (ball.locked) return
    const p = pointAt(e)
    if (!p) return
    beginChange()
    setDrag({ kind: 'ball', ballId: ball.id, offset: { x: ball.x - p.x, y: ball.y - p.y } })
    capture(e.pointerId)
  }

  const onHandleDown = (
    e: ReactPointerEvent<SVGCircleElement>,
    kind: 'pathPoint' | 'pathCurve',
    pathId: string,
    segmentIndex: number,
    current: Point,
  ) => {
    e.stopPropagation()
    const p = pointAt(e)
    if (!p) return
    beginChange()
    setDrag({ kind, pathId, segmentIndex, offset: { x: current.x - p.x, y: current.y - p.y } })
    capture(e.pointerId)
  }

  const onZoneDown = (e: ReactPointerEvent<SVGCircleElement>) => {
    e.stopPropagation()
    const zone = shot.scoring.targetZone
    const p = pointAt(e)
    if (!zone || !p) return
    beginChange()
    setDrag({ kind: 'zone', offset: { x: zone.x - p.x, y: zone.y - p.y } })
    capture(e.pointerId)
  }

  // -------------------------------------------------------------- Ziehen

  const onMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (!drag) return
    const raw = pointAt(e)
    if (!raw) return
    const target = { x: raw.x + drag.offset.x, y: raw.y + drag.offset.y }

    if (drag.kind === 'ball') {
      const others = shot.balls.filter((b) => b.id !== drag.ballId)
      const next = resolveOverlaps(snap(target), others)
      apply((s) => ({
        ...s,
        balls: s.balls.map((b) => (b.id === drag.ballId ? { ...b, x: next.x, y: next.y } : b)),
      }))
      return
    }

    if (drag.kind === 'zone') {
      apply((s) => ({
        ...s,
        scoring: {
          ...s.scoring,
          targetZone: s.scoring.targetZone
            ? { ...s.scoring.targetZone, ...clampBall(target) }
            : null,
        },
      }))
      return
    }

    const point = snap(target)
    apply((s) => ({
      ...s,
      paths: s.paths.map((path) => {
        if (path.id !== drag.pathId) return path
        return {
          ...path,
          segments: path.segments.map((seg, i) => {
            if (i !== drag.segmentIndex) return seg
            if (drag.kind === 'pathPoint') return { ...seg, to: point }
            // Griff zurueck auf die Sehne gezogen bedeutet: wieder gerade.
            const from = i === 0 ? (pathStart(path, s.balls) ?? seg.to) : path.segments[i - 1].to
            const straight = midpoint(from, seg.to)
            const isStraight = Math.hypot(point.x - straight.x, point.y - straight.y) < 1.2
            return { ...seg, curve: isStraight ? undefined : point }
          }),
        }
      }),
    }))
  }

  const onUp = () => setDrag(null)

  // ------------------------------------------------------------ Zeichnen

  const cue = cueBall(shot)
  const obj = objectBalls(shot)[0]
  const aim = aimPoint(shot)
  const zone = shot.scoring.targetZone
  const activePath = shot.paths.find((p) => p.id === selectedPathId) ?? null

  return (
    <TableSvg
      ref={spaceRef}
      orientation={orientation}
      clothColor={settings.clothColor}
      railColor={settings.railColor}
      interactive
      onPointerDown={onSurfaceDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
    >
      {showGrid && <GridLayer step={settings.snapStep} />}
      <TargetZoneLayer zone={zone} />
      {/* Die unsichtbaren Ziehflaechen gibt es nur im Auswahlmodus. Sonst
          wuerden sie Tippen zum Setzen von Baellen und Wegpunkten schlucken. */}
      {zone && mode === 'select' && (
        <circle
          cx={zone.x}
          cy={flipY(zone.y)}
          r={Math.max(zone.r, 3)}
          fill="transparent"
          onPointerDown={onZoneDown}
          style={{ cursor: 'move' }}
        />
      )}

      <PathLayer
        paths={shot.paths}
        balls={shot.balls}
        selectedPathId={selectedPathId}
        onPathPointerDown={(path, e) => {
          e.stopPropagation()
          if (mode === 'select') select(null, path.id)
        }}
      />

      {showAim && (
        <AimLayer
          cue={cue ? { x: cue.x, y: cue.y } : null}
          object={obj ? { x: obj.x, y: obj.y } : null}
          aim={aim}
        />
      )}

      <BallLayer
        balls={shot.balls}
        selectedId={selectedBallId}
        onBallPointerDown={mode === 'select' || mode === 'path' ? onBallDown : undefined}
      />

      <PocketTargets shot={shot} interactive={mode === 'select'} />

      {activePath && <PathHandles pathId={activePath.id} onHandleDown={onHandleDown} />}
    </TableSvg>
  )
}

// ------------------------------------------------------------------ Raster

function GridLayer({ step }: { step: number }) {
  if (step <= 0) return null
  const dots: Point[] = []
  for (let x = step; x < TABLE.length; x += step) {
    for (let y = step; y < TABLE.width; y += step) dots.push({ x, y })
  }
  return (
    <g pointerEvents="none" fill="#ffffff" opacity={0.13}>
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={flipY(d.y)} r={0.18} />
      ))}
    </g>
  )
}

// ------------------------------------------------------------------ Taschen

function PocketTargets({ shot, interactive }: { shot: Shot; interactive: boolean }) {
  const change = useBuilder((s) => s.change)
  return (
    <g>
      {POCKETS.map((p) => {
        const active = shot.target.pocketId === p.id
        return (
          <g key={p.id}>
            {active && (
              <circle
                cx={p.center.x}
                cy={flipY(p.center.y)}
                r={2.6}
                fill="none"
                stroke="var(--accent)"
                strokeWidth={0.45}
                pointerEvents="none"
              />
            )}
            {interactive && (
              <circle
                cx={p.center.x}
                cy={flipY(p.center.y)}
                r={3.4}
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onPointerDown={(e) => {
                  e.stopPropagation()
                  change((s) => ({ ...s, target: { ...s.target, pocketId: p.id } }))
                }}
              >
                <title>{p.label}</title>
              </circle>
            )}
          </g>
        )
      })}
    </g>
  )
}

// ------------------------------------------------------------------- Griffe

interface PathHandlesProps {
  pathId: string
  onHandleDown: (
    e: ReactPointerEvent<SVGCircleElement>,
    kind: 'pathPoint' | 'pathCurve',
    pathId: string,
    segmentIndex: number,
    current: Point,
  ) => void
}

/** Zieh-Griffe an den Segmentenden und in der Mitte jedes Segments. */
function PathHandles({ pathId, onHandleDown }: PathHandlesProps) {
  const shot = useBuilder((s) => s.shot)
  const path = shot.paths.find((p) => p.id === pathId)
  if (!path) return null
  const start = pathStart(path, shot.balls)
  if (!start) return null

  // seg.curve ist der Punkt, durch den die Kurve laufen soll; der Griff sitzt
  // also genau dort. Ohne Kurve liegt er auf der Mitte der Sehne.
  let prev = start
  const nodes: { seg: number; point: Point; curve: Point }[] = []
  for (const [i, seg] of path.segments.entries()) {
    nodes.push({ seg: i, point: seg.to, curve: seg.curve ?? midpoint(prev, seg.to) })
    prev = seg.to
  }

  return (
    <g>
      {nodes.map((n) => (
        <g key={n.seg}>
          <circle cx={n.curve.x} cy={flipY(n.curve.y)} r={1.2} fill="var(--info)" opacity={0.8} pointerEvents="none" />
          <circle
            cx={n.curve.x}
            cy={flipY(n.curve.y)}
            r={3}
            fill="transparent"
            style={{ cursor: 'move' }}
            onPointerDown={(e) => onHandleDown(e, 'pathCurve', pathId, n.seg, n.curve)}
          >
            <title>Segment biegen</title>
          </circle>
          <circle
            cx={n.point.x}
            cy={flipY(n.point.y)}
            r={1.5}
            fill="var(--accent)"
            stroke="#0d1512"
            strokeWidth={0.2}
            pointerEvents="none"
          />
          {/* Groessere unsichtbare Trefferflaechen: die sichtbaren Griffe sind
              auf dem Tablet nur wenige Pixel breit. */}
          <circle
            cx={n.point.x}
            cy={flipY(n.point.y)}
            r={3.4}
            fill="transparent"
            style={{ cursor: 'move' }}
            onPointerDown={(e) => onHandleDown(e, 'pathPoint', pathId, n.seg, n.point)}
          >
            <title>Punkt verschieben</title>
          </circle>
        </g>
      ))}
    </g>
  )
}
