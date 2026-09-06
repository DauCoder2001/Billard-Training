/** Zustand des Shot Builders inklusive Undo/Redo.
 *
 *  Beim Ziehen entstehen viele Zwischenzustaende. Damit die Historie
 *  brauchbar bleibt, wird einmal zu Beginn einer Aenderung ein Schnappschuss
 *  abgelegt (beginChange) und danach nur noch der aktuelle Stand ersetzt.
 */

import { create } from 'zustand'
import { createShot, newId } from '@/domain/shot'
import type { Ball, BallKind, BallPath, Point, Shot } from '@/domain/types'

const HISTORY_LIMIT = 60

export type BuilderMode =
  | 'select'
  | 'addObject'
  | 'addObstacle'
  | 'addGhost'
  | 'path'
  | 'zone'

export interface Drag {
  kind: 'ball' | 'pathPoint' | 'pathCurve' | 'zone'
  ballId?: string
  pathId?: string
  segmentIndex?: number
  /** Versatz zwischen Fingerpunkt und Objektmittelpunkt beim Aufsetzen. */
  offset: Point
}

interface BuilderState {
  shot: Shot
  past: Shot[]
  future: Shot[]
  mode: BuilderMode
  selectedBallId: string | null
  selectedPathId: string | null
  /** Rolle des naechsten neu gezeichneten Weges. */
  pathRole: BallPath['role']
  drag: Drag | null
  dirty: boolean
  /** true, solange der Stoss noch nie gespeichert wurde. */
  isNew: boolean

  init: (shot: Shot, isNew: boolean) => void
  setMode: (mode: BuilderMode) => void
  select: (ballId: string | null, pathId?: string | null) => void
  setDrag: (drag: Drag | null) => void
  setPathRole: (role: BallPath['role']) => void

  beginChange: () => void
  apply: (fn: (shot: Shot) => Shot) => void
  change: (fn: (shot: Shot) => Shot) => void
  undo: () => void
  redo: () => void
  markSaved: (shot: Shot) => void

  addBall: (kind: BallKind, at: Point) => void
  removeBall: (id: string) => void
  startPath: (ballId: string | null, from: Point | null) => void
  appendPathPoint: (to: Point) => void
  removePath: (id: string) => void
}

function nextNumber(balls: Ball[]): number {
  const used = new Set(balls.map((b) => b.number).filter(Boolean) as number[])
  for (let n = 1; n <= 15; n++) if (!used.has(n)) return n
  return 1
}

export const useBuilder = create<BuilderState>((set, get) => ({
  shot: createShot(),
  past: [],
  future: [],
  mode: 'select',
  selectedBallId: null,
  selectedPathId: null,
  pathRole: 'cue',
  drag: null,
  dirty: false,
  isNew: true,

  init: (shot, isNew) =>
    set({
      shot,
      past: [],
      future: [],
      mode: 'select',
      selectedBallId: null,
      selectedPathId: null,
      drag: null,
      dirty: false,
      isNew,
    }),

  setMode: (mode) => set({ mode, selectedPathId: mode === 'path' ? get().selectedPathId : null }),
  select: (ballId, pathId = null) => set({ selectedBallId: ballId, selectedPathId: pathId }),
  setDrag: (drag) => set({ drag }),
  setPathRole: (pathRole) => set({ pathRole }),

  beginChange: () =>
    set((s) => ({
      past: [...s.past, s.shot].slice(-HISTORY_LIMIT),
      future: [],
      dirty: true,
    })),

  /** Aendert den Stoss ohne neuen Historieneintrag (waehrend eines Zuges). */
  apply: (fn) => set((s) => ({ shot: fn(s.shot), dirty: true })),

  /** Aendert den Stoss und legt einen Historieneintrag an. */
  change: (fn) =>
    set((s) => ({
      past: [...s.past, s.shot].slice(-HISTORY_LIMIT),
      future: [],
      shot: fn(s.shot),
      dirty: true,
    })),

  undo: () =>
    set((s) => {
      if (s.past.length === 0) return s
      const previous = s.past[s.past.length - 1]
      return {
        past: s.past.slice(0, -1),
        future: [s.shot, ...s.future].slice(0, HISTORY_LIMIT),
        shot: previous,
        dirty: true,
      }
    }),

  redo: () =>
    set((s) => {
      if (s.future.length === 0) return s
      const [next, ...rest] = s.future
      return {
        past: [...s.past, s.shot].slice(-HISTORY_LIMIT),
        future: rest,
        shot: next,
        dirty: true,
      }
    }),

  markSaved: (shot) => set({ shot, dirty: false, isNew: false }),

  addBall: (kind, at) => {
    const id = newId()
    get().change((shot) => {
      const balls = shot.balls.filter((b) => !(kind === 'cue' && b.kind === 'cue'))
      const ball: Ball = {
        id,
        kind,
        x: at.x,
        y: at.y,
        number: kind === 'object' || kind === 'obstacle' ? nextNumber(balls) : undefined,
        order: kind === 'object' ? balls.filter((b) => b.kind === 'object').length + 1 : undefined,
      }
      return { ...shot, balls: [...balls, ball] }
    })
    set({ selectedBallId: id, mode: 'select' })
  },

  removeBall: (id) => {
    get().change((shot) => ({
      ...shot,
      balls: shot.balls.filter((b) => b.id !== id),
      // Wege ohne Ball wuerden ins Leere zeigen und werden mit entfernt.
      paths: shot.paths.filter((p) => p.ballId !== id),
    }))
    set({ selectedBallId: null })
  },

  startPath: (ballId, from) => {
    const id = newId()
    get().change((shot) => ({
      ...shot,
      paths: [
        ...shot.paths,
        { id, ballId, role: get().pathRole, from: from ?? undefined, segments: [] },
      ],
    }))
    set({ selectedPathId: id, selectedBallId: null, mode: 'path' })
  },

  appendPathPoint: (to) => {
    const pathId = get().selectedPathId
    if (!pathId) return
    get().change((shot) => ({
      ...shot,
      paths: shot.paths.map((p) =>
        p.id === pathId ? { ...p, segments: [...p.segments, { to }] } : p,
      ),
    }))
  },

  removePath: (id) => {
    get().change((shot) => ({ ...shot, paths: shot.paths.filter((p) => p.id !== id) }))
    set({ selectedPathId: null })
  },
}))
