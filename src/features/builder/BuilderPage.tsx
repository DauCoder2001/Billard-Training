/** Der Shot Builder: Stoesse aufbauen, formen und speichern. */

import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useApp } from '@/app/store'
import { db } from '@/data/db'
import { deleteShot, saveShot } from '@/data/repositories/shots'
import { castToRail } from '@/domain/geometry'
import { createShot, duplicateShot, mirrorShot } from '@/domain/shot'
import type { BallPath, Point } from '@/domain/types'
import { useDialogs } from '@/ui/Dialogs'
import { AttributesPanel } from './AttributesPanel'
import { BuilderCanvas } from './BuilderCanvas'
import { ShareDialog } from '@/features/share/ShareDialog'
import { useBuilder } from './store'

export function BuilderPage() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const dialogs = useDialogs()
  const settings = useApp((s) => s.settings)
  const patchSettings = useApp((s) => s.patchSettings)

  const shot = useBuilder((s) => s.shot)
  const mode = useBuilder((s) => s.mode)
  const dirty = useBuilder((s) => s.dirty)
  const isNew = useBuilder((s) => s.isNew)
  const selectedBallId = useBuilder((s) => s.selectedBallId)
  const selectedPathId = useBuilder((s) => s.selectedPathId)
  const canUndo = useBuilder((s) => s.past.length > 0)
  const canRedo = useBuilder((s) => s.future.length > 0)

  const [loaded, setLoaded] = useState(false)
  const [showGrid, setShowGrid] = useState(true)
  const [showAim, setShowAim] = useState(true)
  const [shareOpen, setShareOpen] = useState(false)
  const [panelOpen, setPanelOpen] = useState(true)

  // Laden bzw. neuen Stoss anlegen.
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      const { init } = useBuilder.getState()
      if (id) {
        const existing = await db.shots.get(id)
        if (cancelled) return
        if (existing) init(existing, false)
        else init(createShot(), true)
      } else {
        init(
          createShot({
            scoring: {
              mode: 'pocket+position',
              targetZone: { x: 75, y: 12.5, r: settings.defaultTargetRadius },
              thresholds: { ...settings.defaultThresholds },
              scratchRisk: false,
            },
          }),
          true,
        )
      }
      if (!cancelled) setLoaded(true)
    }
    void run()
    return () => {
      cancelled = true
    }
    // An Id und Navigationsschluessel haengen: die Einstellungen liefern nur
    // Startwerte und duerfen den Editor nicht mitten in der Arbeit
    // zuruecksetzen, ein erneutes Oeffnen von /builder aber schon.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, location.key])

  // Tastenkuerzel fuer die Arbeit am Notebook.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return
      const store = useBuilder.getState()
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) store.redo()
        else store.undo()
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        store.redo()
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (store.selectedBallId) store.removeBall(store.selectedBallId)
        else if (store.selectedPathId) store.removePath(store.selectedPathId)
      } else if (e.key === 'Escape') {
        store.setMode('select')
        store.select(null, null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const save = async () => {
    const saved = await saveShot(shot)
    useBuilder.getState().markSaved(saved)
    dialogs.toast('Gespeichert', 'ok')
    if (isNew) navigate(`/builder/${saved.id}`, { replace: true })
    return saved
  }

  const leave = async (to: string) => {
    if (dirty) {
      const ok = await dialogs.confirm({
        title: 'Aenderungen verwerfen?',
        message: 'Der Stoss wurde noch nicht gespeichert.',
        confirmLabel: 'Verwerfen',
        danger: true,
      })
      if (!ok) return
    }
    navigate(to)
  }

  const rename = async () => {
    const name = await dialogs.prompt({
      title: 'Stoss benennen',
      label: 'Name',
      initial: shot.name,
    })
    if (name !== null && name.trim()) {
      useBuilder.getState().change((s) => ({ ...s, name: name.trim() }))
    }
  }

  /** Haengt an den aktiven Weg eine Bandenreflexion an. */
  const addRailBounce = () => {
    const store = useBuilder.getState()
    const path = store.shot.paths.find((p) => p.id === store.selectedPathId)
    if (!path || path.segments.length === 0) {
      dialogs.toast('Erst einen Weg mit mindestens einem Punkt zeichnen', 'error')
      return
    }
    const points: Point[] = [startOf(path, store.shot.balls), ...path.segments.map((s) => s.to)]
    const last = points[points.length - 1]
    const prev = points[points.length - 2]
    const hit = castToRail(last, { x: last.x - prev.x, y: last.y - prev.y })
    if (!hit) {
      dialogs.toast('Aus dieser Richtung ergibt sich keine Bande', 'error')
      return
    }
    // Nach der Bande ein Stueck weiterlaufen, aber hoechstens bis zur
    // naechsten Bande, damit der Weg nicht ueber den Tisch hinausragt.
    const next = castToRail(hit.point, hit.direction)
    const reach = next
      ? Math.min(25, Math.hypot(next.point.x - hit.point.x, next.point.y - hit.point.y))
      : 25
    store.change((s) => ({
      ...s,
      paths: s.paths.map((p) =>
        p.id === path.id
          ? {
              ...p,
              segments: [
                ...p.segments,
                { to: hit.point, rail: true },
                {
                  to: {
                    x: hit.point.x + hit.direction.x * reach,
                    y: hit.point.y + hit.direction.y * reach,
                  },
                },
              ],
            }
          : p,
      ),
    }))
  }

  const removeSelected = () => {
    const store = useBuilder.getState()
    if (store.selectedBallId) store.removeBall(store.selectedBallId)
    else if (store.selectedPathId) store.removePath(store.selectedPathId)
  }

  const resetShot = async () => {
    const ok = await dialogs.confirm({
      title: 'Alles zuruecksetzen?',
      message: 'Baelle, Wege und Zielzone werden auf den Ausgangszustand gesetzt.',
      confirmLabel: 'Zuruecksetzen',
      danger: true,
    })
    if (!ok) return
    useBuilder.getState().change((s) => {
      const fresh = createShot()
      return { ...s, balls: fresh.balls, paths: [], target: fresh.target }
    })
  }

  const duplicate = async () => {
    const copy = await saveShot(duplicateShot(shot))
    dialogs.toast('Kopie angelegt', 'ok')
    navigate(`/builder/${copy.id}`)
  }

  const remove = async () => {
    const ok = await dialogs.confirm({
      title: `"${shot.name}" loeschen?`,
      message: 'Der Stoss und seine Trainingshistorie werden entfernt.',
      confirmLabel: 'Loeschen',
      danger: true,
    })
    if (!ok) return
    await deleteShot(shot.id)
    navigate('/library', { replace: true })
  }

  const train = async () => {
    const saved = dirty || isNew ? await save() : shot
    navigate(`/train/${saved.id}`)
  }

  if (!loaded) {
    return (
      <div className="page">
        <p className="muted">Stoss wird geladen …</p>
      </div>
    )
  }

  const orientation = settings.orientation

  return (
    <div className="builder">
      <header className="builder__head">
        <button className="btn btn--ghost btn--sm" onClick={() => void leave('/library')}>
          ← Stoesse
        </button>
        <button className="btn btn--ghost" onClick={() => void rename()} title="Umbenennen">
          <strong>{shot.name}</strong>
          {dirty && <span className="muted small"> • ungespeichert</span>}
        </button>
        <span className="spacer" />
        <button className="btn btn--sm btn--icon" disabled={!canUndo} title="Rueckgaengig" onClick={() => useBuilder.getState().undo()}>
          ↶
        </button>
        <button className="btn btn--sm btn--icon" disabled={!canRedo} title="Wiederholen" onClick={() => useBuilder.getState().redo()}>
          ↷
        </button>
        <button
          className="btn btn--sm"
          title="Ausrichtung wechseln"
          onClick={() =>
            void patchSettings({
              orientation: orientation === 'landscape' ? 'portrait' : 'landscape',
            })
          }
        >
          {orientation === 'landscape' ? '▭' : '▯'}
        </button>
        <button className="btn btn--sm" onClick={() => setShareOpen(true)}>
          Teilen
        </button>
        <button className="btn btn--sm btn--primary" onClick={() => void save()}>
          Speichern
        </button>
        <button className="btn btn--sm" onClick={() => void train()}>
          Trainieren
        </button>
      </header>

      <div className="builder__body">
        <div className="builder__tools">
          <Tool active={mode === 'select'} label="Auswahl" icon="↖" onClick={() => useBuilder.getState().setMode('select')} />
          <Tool active={mode === 'addObject'} label="Objektball" icon="●" onClick={() => useBuilder.getState().setMode('addObject')} />
          <Tool active={mode === 'addObstacle'} label="Stoerball" icon="◍" onClick={() => useBuilder.getState().setMode('addObstacle')} />
          <Tool active={mode === 'addGhost'} label="Geisterball" icon="○" onClick={() => useBuilder.getState().setMode('addGhost')} />
          <Tool active={mode === 'path'} label="Weg" icon="↗" onClick={() => useBuilder.getState().setMode('path')} />
          <Tool active={mode === 'zone'} label="Zielzone" icon="◎" onClick={() => useBuilder.getState().setMode('zone')} />
          <div className="builder__sep" />
          <Tool active={showGrid} label="Raster" icon="⋯" onClick={() => setShowGrid((v) => !v)} />
          <Tool active={showAim} label="Ziellinie" icon="⌖" onClick={() => setShowAim((v) => !v)} />
          <div className="builder__sep" />
          <Tool
            label="Loeschen"
            icon="✕"
            disabled={!selectedBallId && !selectedPathId}
            onClick={removeSelected}
          />
        </div>

        <div className="builder__stage">
          <BuilderCanvas orientation={orientation} showGrid={showGrid} showAim={showAim} />
        </div>
      </div>

      <div className="builder__actions">
        {mode === 'path' ? (
          <>
            <span className="small muted">
              {selectedPathId
                ? 'Auf den Tisch tippen setzt weitere Punkte.'
                : 'Auf einen Ball tippen startet den Weg.'}
            </span>
            <span className="spacer" />
            <select
              className="select"
              style={{ width: 170 }}
              value={useBuilder.getState().pathRole}
              onChange={(e) => useBuilder.getState().setPathRole(e.target.value as BallPath['role'])}
            >
              <option value="cue">Weg des Weissen</option>
              <option value="object">Weg des Objektballs</option>
              <option value="secondary">Weiterer Weg</option>
            </select>
            <button className="btn btn--sm" onClick={addRailBounce}>
              Bande anhaengen
            </button>
            <button
              className="btn btn--sm btn--primary"
              onClick={() => {
                useBuilder.getState().select(null, null)
                useBuilder.getState().setMode('select')
              }}
            >
              Weg fertig
            </button>
          </>
        ) : (
          <>
            <button className="btn btn--sm" onClick={() => useBuilder.getState().change((s) => mirrorShot(s, 'horizontal'))}>
              Spiegeln ↕
            </button>
            <button className="btn btn--sm" onClick={() => useBuilder.getState().change((s) => mirrorShot(s, 'vertical'))}>
              Spiegeln ↔
            </button>
            <button className="btn btn--sm" onClick={() => void resetShot()}>
              Zuruecksetzen
            </button>
            <span className="spacer" />
            {!isNew && (
              <>
                <button className="btn btn--sm" onClick={() => void duplicate()}>
                  Duplizieren
                </button>
                <button className="btn btn--sm btn--danger" onClick={() => void remove()}>
                  Loeschen
                </button>
              </>
            )}
            <button className="btn btn--sm" onClick={() => setPanelOpen((v) => !v)}>
              Attribute {panelOpen ? '▾' : '▴'}
            </button>
          </>
        )}
      </div>

      {panelOpen && <AttributesPanel />}

      {shareOpen && <ShareDialog shot={shot} onClose={() => setShareOpen(false)} />}
    </div>
  )
}

function startOf(path: BallPath, balls: { id: string; x: number; y: number }[]): Point {
  if (path.ballId) {
    const ball = balls.find((b) => b.id === path.ballId)
    if (ball) return { x: ball.x, y: ball.y }
  }
  return path.from ?? { x: 0, y: 0 }
}

interface ToolProps {
  label: string
  icon: string
  active?: boolean
  disabled?: boolean
  onClick: () => void
}

function Tool({ label, icon, active, disabled, onClick }: ToolProps) {
  return (
    <button
      className={`builder__tool${active ? ' is-on' : ''}`}
      onClick={onClick}
      disabled={disabled}
      title={label}
    >
      <span aria-hidden style={{ fontSize: 18 }}>
        {icon}
      </span>
      <span className="builder__tool-label">{label}</span>
    </button>
  )
}
