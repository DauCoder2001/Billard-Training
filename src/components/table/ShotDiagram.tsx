/** Fertiges Diagramm eines Stosses, zum Ansehen. */

import { POCKET_BY_ID, pocketAimPoint } from '@/domain/geometry'
import { cueBall, objectBalls } from '@/domain/shot'
import type { Shot } from '@/domain/types'
import { AimLayer, BallLayer, PathLayer, TargetZoneLayer } from './Layers'
import { TableSvg } from './TableSvg'
import type { Orientation } from './space'

interface ShotDiagramProps {
  shot: Shot
  orientation?: Orientation
  clothColor?: string
  railColor?: string
  showAim?: boolean
  showZone?: boolean
  showPaths?: boolean
  showDiamonds?: boolean
  showMarkings?: boolean
  className?: string
}

export function ShotDiagram({
  shot,
  orientation = 'landscape',
  clothColor,
  railColor,
  showAim = false,
  showZone = true,
  showPaths = true,
  showDiamonds = true,
  showMarkings = true,
  className,
}: ShotDiagramProps) {
  const cue = cueBall(shot)
  const obj = objectBalls(shot)[0]
  const aim = shot.target.pocketId
    ? pocketAimPoint(POCKET_BY_ID[shot.target.pocketId], shot.target.cheat)
    : null

  return (
    <TableSvg
      orientation={orientation}
      clothColor={clothColor}
      railColor={railColor}
      showDiamonds={showDiamonds}
      showMarkings={showMarkings}
      className={className}
    >
      {showZone && <TargetZoneLayer zone={shot.scoring.targetZone} />}
      {showPaths && <PathLayer paths={shot.paths} balls={shot.balls} />}
      {showAim && (
        <AimLayer
          cue={cue ? { x: cue.x, y: cue.y } : null}
          object={obj ? { x: obj.x, y: obj.y } : null}
          aim={aim}
        />
      )}
      <BallLayer balls={shot.balls} />
    </TableSvg>
  )
}
