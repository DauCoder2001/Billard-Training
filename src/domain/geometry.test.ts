import { describe, expect, it } from 'vitest'
import {
  POCKET_BY_ID,
  TABLE,
  bankPath,
  castToRail,
  clampBall,
  controlThrough,
  cutAngle,
  diamonds,
  ghostBall,
  maxCheatOffset,
  pocketAimPoint,
  pointOnCurve,
  resolveOverlaps,
  snapToGrid,
} from './geometry'

describe('Taschen', () => {
  it('legt die Eckentasche mittig ueber die Ecke', () => {
    const p = POCKET_BY_ID.bl
    expect(p.center.x).toBeCloseTo(TABLE.cornerMouth / Math.SQRT2 / 2, 6)
    expect(p.center.y).toBeCloseTo(TABLE.cornerMouth / Math.SQRT2 / 2, 6)
  })

  it('haelt die Muendungsbreite der Ecke ein', () => {
    const [a, b] = POCKET_BY_ID.tr.jaws
    expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeCloseTo(TABLE.cornerMouth, 6)
  })

  it('setzt die Mitteltasche auf die Bandenmitte', () => {
    expect(POCKET_BY_ID.tm.center).toEqual({ x: 50, y: 50 })
    expect(POCKET_BY_ID.bm.center).toEqual({ x: 50, y: 0 })
  })

  it('begrenzt das Cheaten auf die durchlaessige Breite', () => {
    expect(maxCheatOffset(POCKET_BY_ID.bl)).toBeCloseTo((4.5 - 2.25) / 2, 6)
    expect(maxCheatOffset(POCKET_BY_ID.bm)).toBeCloseTo((5 - 2.25) / 2, 6)
  })

  it('verschiebt den Zielpunkt entlang der Muendung', () => {
    const pocket = POCKET_BY_ID.bm
    const left = pocketAimPoint(pocket, -1)
    const right = pocketAimPoint(pocket, 1)
    expect(left.x).toBeLessThan(pocket.center.x)
    expect(right.x).toBeGreaterThan(pocket.center.x)
    expect(left.y).toBe(0)
  })

  it('kappt Cheat-Werte ausserhalb von -1..1', () => {
    expect(pocketAimPoint(POCKET_BY_ID.bm, 5)).toEqual(pocketAimPoint(POCKET_BY_ID.bm, 1))
  })
})

describe('Diamanten', () => {
  it('laesst an den Mitteltaschen keinen Diamanten', () => {
    const all = diamonds()
    expect(all.filter((d) => d.x === 50 && (d.y === 0 || d.y === 50))).toHaveLength(0)
  })

  it('liefert sechs Diamanten je Langbande und drei je Kurzbande', () => {
    const all = diamonds()
    expect(all.filter((d) => d.rail === 'top')).toHaveLength(6)
    expect(all.filter((d) => d.rail === 'left')).toHaveLength(3)
  })
})

describe('Baelle', () => {
  it('haelt den Ball vollstaendig auf der Flaeche', () => {
    expect(clampBall({ x: -5, y: 80 })).toEqual({ x: TABLE.ballRadius, y: TABLE.width - TABLE.ballRadius })
  })

  it('rastet auf das Raster ein', () => {
    expect(snapToGrid({ x: 13, y: 24 }, 3.125)).toEqual({ x: 12.5, y: 25 })
  })

  it('laesst den Punkt bei Schrittweite 0 unveraendert', () => {
    expect(snapToGrid({ x: 13, y: 24 }, 0)).toEqual({ x: 13, y: 24 })
  })

  it('schiebt ueberlappende Baelle auseinander', () => {
    const out = resolveOverlaps({ x: 50, y: 25 }, [{ x: 51, y: 25 }])
    expect(Math.hypot(out.x - 51, out.y - 25)).toBeGreaterThanOrEqual(TABLE.ballDiameter - 1e-6)
  })

  it('weicht auch bei exakter Deckung aus', () => {
    const out = resolveOverlaps({ x: 50, y: 25 }, [{ x: 50, y: 25 }])
    expect(Math.hypot(out.x - 50, out.y - 25)).toBeGreaterThanOrEqual(TABLE.ballDiameter - 1e-6)
  })
})

describe('Winkel', () => {
  it('meldet einen vollen Ball als 0 Grad', () => {
    // Weisser, Objektball und Tasche liegen auf einer Linie.
    const angle = cutAngle({ x: 20, y: 25 }, { x: 50, y: 25 }, { x: 90, y: 25 })
    expect(angle).toBeCloseTo(0, 4)
  })

  it('meldet einen halben Ball als rund 30 Grad', () => {
    const obj = { x: 50, y: 25 }
    const aim = { x: 90, y: 25 }
    const ghost = ghostBall(obj, aim)
    // Weisser so setzen, dass der Winkel exakt 30 Grad betraegt.
    const dist = 20
    const cue = {
      x: ghost.x - dist * Math.cos((30 * Math.PI) / 180),
      y: ghost.y + dist * Math.sin((30 * Math.PI) / 180),
    }
    expect(cutAngle(cue, obj, aim)).toBeCloseTo(30, 3)
  })

  it('liefert NaN, wenn Objektball und Ziel zusammenfallen', () => {
    expect(cutAngle({ x: 10, y: 10 }, { x: 50, y: 25 }, { x: 50, y: 25 })).toBeNaN()
  })

  it('setzt den Geisterball einen Balldurchmesser hinter den Objektball', () => {
    const g = ghostBall({ x: 50, y: 25 }, { x: 90, y: 25 })
    expect(g.x).toBeCloseTo(50 - TABLE.ballDiameter, 6)
    expect(g.y).toBeCloseTo(25, 6)
  })
})

describe('Banden', () => {
  it('reflektiert an der oberen Bande', () => {
    const hit = castToRail({ x: 50, y: 25 }, { x: 0, y: 1 })
    expect(hit?.rail).toBe('top')
    expect(hit?.point).toEqual({ x: 50, y: 50 })
    expect(hit?.direction.y).toBeCloseTo(-1, 6)
  })

  it('trifft die naechstgelegene Bande', () => {
    const hit = castToRail({ x: 95, y: 25 }, { x: 1, y: 0.2 })
    expect(hit?.rail).toBe('right')
  })

  it('liefert null bei entarteter Richtung', () => {
    expect(castToRail({ x: 50, y: 25 }, { x: 0, y: 0 })).toBeNull()
  })

  it('erzeugt einen Weg mit der gewuenschten Zahl an Banden', () => {
    const pts = bankPath({ x: 25, y: 25 }, { x: 1, y: 1 }, 3)
    expect(pts).toHaveLength(3)
    for (const p of pts) {
      const onRail =
        Math.abs(p.x) < 1e-6 ||
        Math.abs(p.x - TABLE.length) < 1e-6 ||
        Math.abs(p.y) < 1e-6 ||
        Math.abs(p.y - TABLE.width) < 1e-6
      expect(onRail).toBe(true)
    }
  })
})

describe('Kurvengriffe', () => {
  it('laesst die Kurve durch den angefassten Punkt laufen', () => {
    const p0 = { x: 10, y: 10 }
    const p1 = { x: 60, y: 40 }
    const through = { x: 20, y: 45 }
    const control = controlThrough(p0, through, p1)
    const back = pointOnCurve(p0, control, p1)
    expect(back.x).toBeCloseTo(through.x, 6)
    expect(back.y).toBeCloseTo(through.y, 6)
  })
})
