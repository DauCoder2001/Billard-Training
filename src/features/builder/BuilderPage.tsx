/** Der Shot Builder: Stoesse aufbauen, formen und speichern. */

import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useApp } from '@/app/store'
import { useLeaveGuard } from '@/app/useLeaveGuard'
import { pathStart } from '@/components/table/Layers'
import { db } from '@/data/db'
import { storageErrorText } from '@/data/errors'
import { deleteShot, saveShot } from '@/data/repositories/shots'
import { castToRail } from '@/domain/geometry'
import { applyRack, shuffleObjectBalls } from '@/domain/rack'
import { createShot, duplicateShot, mirrorShot } from '@/domain/shot'
import type { BallPath, Point } from '@/domain/types'
import { useDialogs } from '@/ui/Dialogs'
import { AttributesPanel } from './AttributesPanel'
import { BuilderCanvas } from './BuilderCanvas'
import { useBuilder } from './store'

// Der Teilen-Dialog bringt den QR-Code-Erzeuger mit und wird nur auf Druck
// geoeffnet: er kommt als eigenes Buendel nach.
const ShareDialog = lazy(() =>
  import('@/features/share/ShareDialog').then((m) => ({ default: m.ShareDialog })),
)

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
    // zuruecksetzen, ein erneutes Oeffnen von /builder aber schon. Die Liste
    // ist deshalb absichtlich unvollstaendig - settings fehlt darin.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- siehe oben
  }, [id, location.key])

  // Tastenkuerzel fuer die Arbeit am Notebook.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return
      // Offener Dialog (Modal): Tasten gehoeren ihm, sonst loescht Entf
      // hinter einer Rueckfrage den gewaehlten Ball
      if (document.querySelector('dialog[open]')) return
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

  // Fragt auf jedem Weg hinaus nach, solange etwas Ungespeichertes
  // offensteht - auch bei der Zurueck-Taste und beim Neuladen.
  const { ohneNachfrage } = useLeaveGuard(
    useCallback(
      () =>
        useBuilder.getState().dirty
          ? {
              title: 'Änderungen verwerfen?',
              message: 'Der Stoß wurde noch nicht gespeichert.',
              confirmLabel: 'Verwerfen',
              danger: true,
            }
          : null,
      [],
    ),
  )

  /**
   * Speichert den Stoss. null heisst: der Browserspeicher hat abgelehnt.
   *
   * Ohne diese Klammer blieb ein voller Speicher stumm - der Druck auf
   * "Speichern" sah aus wie nichts. Die Arbeit ist dabei nicht verloren: der
   * Stoss bleibt offen, die Marke "ungespeichert" stehen, und der Waechter
   * fragt beim Verlassen weiter nach.
   */
  const save = async () => {
    try {
      // Ein mitgelieferter Stoss, den der Nutzer hier speichert, ist ab jetzt
      // seine Fassung: builtIn faellt weg. Sonst ueberschrieb die naechste
      // Aktualisierung der Sammlung seine Aenderungen (siehe bootstrap.ts),
      // und geloescht werden durfte er trotzdem nur hier.
      const saved = await saveShot({ ...shot, builtIn: false })
      useBuilder.getState().markSaved(saved)
      dialogs.toast('Gespeichert', 'ok')
      if (isNew) navigate(`/builder/${saved.id}`, { replace: true })
      return saved
    } catch (err) {
      dialogs.toast(`Nicht gespeichert: ${storageErrorText(err)}`, 'error')
      return null
    }
  }

  const rename = async () => {
    const name = await dialogs.prompt({
      title: 'Stoß benennen',
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
    // Dieselbe Frage wie beim Zeichnen, deshalb dieselbe Antwort: ein Weg
    // ohne Ball und ohne eigenen Startpunkt hat keinen Anfang. Eine eigene
    // Fassung rechnete hier aus der Tischecke heraus - und der Strahl kam
    // irgendwo an, waehrend derselbe Weg ungezeichnet blieb.
    const start = pathStart(path, store.shot.balls)
    if (!start) {
      dialogs.toast('Dieser Weg hat keinen Anfang', 'error')
      return
    }
    const points: Point[] = [start, ...path.segments.map((s) => s.to)]
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

  // Ein Stoss darf ohne Weissen sein - es gibt Uebungen, die aus nur einer
  // Kugel bestehen. Nur zwei duerfen es nicht werden.
  const hatWeissen = shot.balls.some((b) => b.kind === 'cue')

  // Ohne Objektbaelle gaebe es nichts zu mischen. Der Knopf bleibt trotzdem
  // stehen und nennt den Grund - ausgeblendete Knoepfe sucht man sonst.
  const hatObjektbaelle = shot.balls.some((b) => b.kind === 'object')

  const removeSelected = () => {
    const store = useBuilder.getState()
    if (store.selectedBallId) store.removeBall(store.selectedBallId)
    else if (store.selectedPathId) store.removePath(store.selectedPathId)
  }

  const resetShot = async () => {
    const ok = await dialogs.confirm({
      title: 'Alles zurücksetzen?',
      message: 'Bälle, Wege, Zieltasche und Zielzone werden auf den Ausgangszustand gesetzt.',
      confirmLabel: 'Zurücksetzen',
      danger: true,
    })
    if (!ok) return
    useBuilder.getState().change((s) => {
      const fresh = createShot()
      return {
        ...s,
        balls: fresh.balls,
        paths: [],
        target: fresh.target,
        // Die Zone stand im Dialog, blieb aber unberuehrt. Sie wird nur
        // zurueckgesetzt, wenn der Stoss ueberhaupt eine hat - ein reiner
        // Lochstoss bekommt durch das Zuruecksetzen keine dazu. Der Radius
        // kommt wie beim neuen Stoss aus den Einstellungen.
        scoring:
          s.scoring.targetZone && fresh.scoring.targetZone
            ? {
                ...s.scoring,
                targetZone: { ...fresh.scoring.targetZone, r: settings.defaultTargetRadius },
              }
            : s.scoring,
      }
    })
  }

  const duplicate = async () => {
    // Erst das Original sichern - sonst traegt die Kopie die Aenderungen und
    // das Original faellt beim Wechsel still auf seinen alten Stand zurueck.
    // Nur bei dirty: einen unberuehrten neuen Stoss ungefragt anzulegen waere
    // ein zweiter Stoss, den niemand wollte.
    if (dirty && !(await save())) return
    try {
      const copy = await saveShot(duplicateShot(useBuilder.getState().shot))
      dialogs.toast('Kopie angelegt', 'ok')
      navigate(`/builder/${copy.id}`)
    } catch (err) {
      dialogs.toast(`Nicht gespeichert: ${storageErrorText(err)}`, 'error')
    }
  }

  const remove = async () => {
    const ok = await dialogs.confirm({
      title: `"${shot.name}" löschen?`,
      message: 'Der Stoß und seine Trainingshistorie werden entfernt.',
      confirmLabel: 'Löschen',
      danger: true,
    })
    if (!ok) return
    try {
      await deleteShot(shot.id)
    } catch (err) {
      dialogs.toast(`Nicht gelöscht: ${storageErrorText(err)}`, 'error')
      return
    }
    // Der Stoss ist weg - eine Frage nach seinen Aenderungen waere unsinnig.
    ohneNachfrage(() => navigate('/library', { replace: true }))
  }

  const ausrichten = async () => {
    const fehler = await patchSettings({
      orientation: settings.orientation === 'landscape' ? 'portrait' : 'landscape',
    })
    if (fehler) dialogs.toast(`Nicht gespeichert: ${fehler}`, 'error')
  }

  const train = async () => {
    const saved = dirty || isNew ? await save() : shot
    // Nicht gespeichert heisst: nicht trainieren. Sonst liefe die Einheit auf
    // einem Stand, den es nirgends gibt.
    if (!saved) return
    navigate(`/train/${saved.id}`)
  }

  if (!loaded) {
    return (
      <div className="page">
        <p className="muted">Wird geladen …</p>
      </div>
    )
  }

  const orientation = settings.orientation

  return (
    <div className="builder">
      <header className="builder__head">
        <button className="btn btn--ghost btn--sm" onClick={() => navigate('/library')}>
          ← Stöße
        </button>
        <button className="btn btn--ghost" onClick={() => void rename()} title="Umbenennen">
          <strong>{shot.name}</strong>
          {dirty && <span className="muted small"> • ungespeichert</span>}
        </button>
        <span className="spacer" />
        <button className="btn btn--sm btn--icon" disabled={!canUndo} title="Rückgängig" onClick={() => useBuilder.getState().undo()}>
          ↶
        </button>
        <button className="btn btn--sm btn--icon" disabled={!canRedo} title="Wiederholen" onClick={() => useBuilder.getState().redo()}>
          ↷
        </button>
        <button
          className="btn btn--sm"
          title="Ausrichtung wechseln"
          onClick={() => void ausrichten()}
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
          <Tool
            active={mode === 'addCue'}
            label="Weißer"
            icon="◉"
            title={
              hatWeissen
                ? 'Es gibt schon einen Weißen. Zum Verschieben antippen und ziehen.'
                : 'Den Weißen aufs Tuch setzen'
            }
            disabled={hatWeissen}
            onClick={() => useBuilder.getState().setMode('addCue')}
          />
          <Tool active={mode === 'addObject'} label="Objektball" icon="●" onClick={() => useBuilder.getState().setMode('addObject')} />
          <Tool active={mode === 'addObstacle'} label="Störball" icon="◍" onClick={() => useBuilder.getState().setMode('addObstacle')} />
          <Tool active={mode === 'addGhost'} label="Geisterball" icon="○" onClick={() => useBuilder.getState().setMode('addGhost')} />
          <Tool active={mode === 'path'} label="Weg" icon="↗" onClick={() => useBuilder.getState().setMode('path')} />
          <Tool active={mode === 'zone'} label="Zielzone" icon="◎" onClick={() => useBuilder.getState().setMode('zone')} />
          <div className="builder__sep" />
          <Tool active={showGrid} label="Raster" icon="⋯" onClick={() => setShowGrid((v) => !v)} />
          <Tool active={showAim} label="Ziellinie" icon="⌖" onClick={() => setShowAim((v) => !v)} />
          <div className="builder__sep" />
          <Tool
            label="Entfernen"
            title="Markiertes entfernen (erst einen Ball oder Weg antippen)"
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
              <option value="cue">Weg des Weißen</option>
              <option value="object">Weg des Objektballs</option>
              <option value="secondary">Weiterer Weg</option>
            </select>
            <button className="btn btn--sm" onClick={addRailBounce}>
              Bande anhängen
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
            <button
              className="btn btn--sm"
              title="Volles Dreieck auf den Fußpunkt stellen"
              onClick={() => useBuilder.getState().change((s) => applyRack(s, 'eight'))}
            >
              Rack 8
            </button>
            <button
              className="btn btn--sm"
              title="Neuner-Raute auf den Fußpunkt stellen"
              onClick={() => useBuilder.getState().change((s) => applyRack(s, 'nine'))}
            >
              Rack 9
            </button>
            <button
              className="btn btn--sm"
              disabled={!hatObjektbaelle}
              title={
                hatObjektbaelle
                  ? 'Objektbälle zufällig über den Tisch verteilen'
                  : 'Dieser Stoß hat keine Objektbälle'
              }
              onClick={() => useBuilder.getState().change((s) => shuffleObjectBalls(s))}
            >
              Mischen
            </button>
            <div className="builder__sep builder__sep--v" />
            <button className="btn btn--sm" onClick={() => useBuilder.getState().change((s) => mirrorShot(s, 'horizontal'))}>
              Spiegeln ↕
            </button>
            <button className="btn btn--sm" onClick={() => useBuilder.getState().change((s) => mirrorShot(s, 'vertical'))}>
              Spiegeln ↔
            </button>
            <button className="btn btn--sm" onClick={() => void resetShot()}>
              Zurücksetzen
            </button>
            <span className="spacer" />
            {!isNew && (
              <>
                <button className="btn btn--sm" onClick={() => void duplicate()}>
                  Duplizieren
                </button>
                {/* Ein unberuehrter mitgelieferter Stoss wird hier nicht
                    geloescht: die Stossseite bot das schon nie an, und die
                    naechste Aktualisierung der Sammlung holte ihn ohnehin
                    wieder. Wer ihn aendert und speichert, hat seine eigene
                    Fassung (siehe save) - dann steht der Knopf da. */}
                {shot.builtIn !== true && (
                  <>
                    <div className="builder__sep builder__sep--v" />
                    <button className="btn btn--sm btn--danger" onClick={() => void remove()}>
                      Stoß löschen
                    </button>
                  </>
                )}
              </>
            )}
            <button className="btn btn--sm" onClick={() => setPanelOpen((v) => !v)}>
              Attribute {panelOpen ? '▾' : '▴'}
            </button>
          </>
        )}
      </div>

      {panelOpen && <AttributesPanel />}

      {shareOpen && (
        <Suspense fallback={null}>
          <ShareDialog shot={shot} onClose={() => setShareOpen(false)} />
        </Suspense>
      )}
    </div>
  )
}

interface ToolProps {
  label: string
  icon: string
  /** Laengerer Text fuer die Kurzhilfe, wenn die Beschriftung knapp ist. */
  title?: string
  active?: boolean
  disabled?: boolean
  onClick: () => void
}

function Tool({ label, icon, title, active, disabled, onClick }: ToolProps) {
  return (
    <button
      className={`builder__tool${active ? ' is-on' : ''}`}
      onClick={onClick}
      disabled={disabled}
      title={title ?? label}
    >
      <span aria-hidden style={{ fontSize: 18 }}>
        {icon}
      </span>
      <span className="builder__tool-label">{label}</span>
    </button>
  )
}
