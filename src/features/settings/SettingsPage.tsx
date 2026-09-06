import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useActivePlayer, useApp } from '@/app/store'
import { db } from '@/data/db'
import { SEED_VERSION } from '@/data/bootstrap'
import { seedShots } from '@/data/seed/drills'
import { exportBackup, importBackup } from '@/data/repositories/backup'
import { createPlayer, deletePlayer, updatePlayer } from '@/data/repositories/players'
import { TABLE } from '@/domain/geometry'
import { downloadText } from '@/features/share/exportImage'
import { useDialogs } from '@/ui/Dialogs'

const CLOTH_COLORS = ['#1f6b52', '#1c5f7a', '#2b6b2f', '#7a2f3a', '#4a4a52', '#1d1f24']
const RAIL_COLORS = ['#5b3a22', '#3d2a1c', '#6b4a2e', '#2f3640']

export function SettingsPage() {
  const settings = useApp((s) => s.settings)
  const players = useApp((s) => s.players)
  const patchSettings = useApp((s) => s.patchSettings)
  const refreshPlayers = useApp((s) => s.refreshPlayers)
  const setActivePlayer = useApp((s) => s.setActivePlayer)
  const active = useActivePlayer()
  const dialogs = useDialogs()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)

  const addPlayer = async () => {
    const name = await dialogs.prompt({ title: 'Neuer Spieler', label: 'Name', initial: '' })
    if (name === null) return
    const player = await createPlayer(name)
    await refreshPlayers()
    await setActivePlayer(player.id)
  }

  const renamePlayer = async (id: string) => {
    const player = players.find((p) => p.id === id)
    if (!player) return
    const name = await dialogs.prompt({ title: 'Spieler umbenennen', label: 'Name', initial: player.name })
    if (name === null || !name.trim()) return
    await updatePlayer({ ...player, name: name.trim() })
    await refreshPlayers()
  }

  const removePlayer = async (id: string) => {
    const player = players.find((p) => p.id === id)
    if (!player) return
    if (players.length === 1) {
      await dialogs.alert({
        title: 'Letztes Profil',
        message: 'Es muss mindestens ein Spielerprofil geben.',
      })
      return
    }
    const ok = await dialogs.confirm({
      title: `"${player.name}" loeschen?`,
      message: 'Alle Trainingsergebnisse dieses Profils werden entfernt.',
      confirmLabel: 'Loeschen',
      danger: true,
    })
    if (!ok) return
    await deletePlayer(id)
    await refreshPlayers()
    const rest = players.filter((p) => p.id !== id)
    if (rest[0]) await setActivePlayer(rest[0].id)
  }

  const exportAll = async () => {
    const backup = await exportBackup()
    const stamp = new Date().toISOString().slice(0, 10)
    downloadText(JSON.stringify(backup, null, 2), `billard-training-${stamp}.json`)
    dialogs.toast('Sicherung gespeichert', 'ok')
  }

  const importFile = async (file: File) => {
    let parsed: unknown
    try {
      parsed = JSON.parse(await file.text())
    } catch {
      dialogs.toast('Die Datei liess sich nicht lesen', 'error')
      return
    }
    const replace = await dialogs.confirm({
      title: 'Sicherung einspielen',
      message:
        'Vorhandene Daten ersetzen? "Abbrechen" fuegt die Sicherung zum vorhandenen Bestand hinzu.',
      confirmLabel: 'Ersetzen',
      cancelLabel: 'Hinzufuegen',
      danger: true,
    })
    try {
      const result = await importBackup(parsed, replace ? 'replace' : 'merge')
      await refreshPlayers()
      await dialogs.alert({
        title: 'Sicherung eingespielt',
        message: `${result.shots} Stoesse, ${result.players} Spieler, ${result.sessions} Sessions, ${result.workouts} Workouts.`,
      })
    } catch (err) {
      dialogs.toast(err instanceof Error ? err.message : 'Import fehlgeschlagen', 'error')
    }
  }

  const restoreDrills = async () => {
    const ok = await dialogs.confirm({
      title: 'Uebungen wiederherstellen',
      message: 'Die mitgelieferten Uebungen werden neu eingespielt. Eigene Stoesse bleiben unberuehrt.',
      confirmLabel: 'Einspielen',
    })
    if (!ok) return
    await db.shots.bulkPut(seedShots())
    await patchSettings({ seededVersion: SEED_VERSION })
    dialogs.toast('Uebungen wiederhergestellt', 'ok')
  }

  const wipe = async () => {
    const ok = await dialogs.confirm({
      title: 'Alle Daten loeschen?',
      message: 'Stoesse, Spieler, Sessions und Workouts werden entfernt. Das laesst sich nicht rueckgaengig machen.',
      confirmLabel: 'Alles loeschen',
      danger: true,
    })
    if (!ok) return
    const typed = await dialogs.prompt({
      title: 'Sicher?',
      message: 'Zum Bestaetigen LOESCHEN eingeben.',
      label: 'Bestaetigung',
    })
    if (typed?.trim().toUpperCase() !== 'LOESCHEN') {
      dialogs.toast('Abgebrochen', 'error')
      return
    }
    await db.delete()
    window.location.reload()
  }

  return (
    <div className="page stack">
      <div className="page__head">
        <div>
          <h1>Einstellungen</h1>
          <p className="page__sub">Profile, Darstellung und Daten.</p>
        </div>
      </div>

      <section className="card stack">
        <h2>Spielerprofile</h2>
        {players.map((p) => (
          <div key={p.id} className="row">
            <button
              className={`chip${p.id === active?.id ? ' is-on' : ''}`}
              onClick={() => void setActivePlayer(p.id)}
            >
              {p.id === active?.id ? '● ' : ''}
              {p.name}
            </button>
            <span className="spacer" />
            <button className="btn btn--sm" onClick={() => void renamePlayer(p.id)}>
              Umbenennen
            </button>
            <button className="btn btn--sm btn--danger" onClick={() => void removePlayer(p.id)}>
              Loeschen
            </button>
          </div>
        ))}
        <div className="row">
          <button className="btn" onClick={() => void addPlayer()}>
            Spieler hinzufuegen
          </button>
        </div>
      </section>

      <section className="card stack">
        <h2>Darstellung</h2>

        <div className="field">
          <label>Tuchfarbe</label>
          <div className="row row--tight">
            {CLOTH_COLORS.map((c) => (
              <button
                key={c}
                className="swatch"
                aria-label={`Tuchfarbe ${c}`}
                style={{ background: c, outline: settings.clothColor === c ? '2px solid var(--accent)' : 'none' }}
                onClick={() => void patchSettings({ clothColor: c })}
              />
            ))}
          </div>
        </div>

        <div className="field">
          <label>Bandenfarbe</label>
          <div className="row row--tight">
            {RAIL_COLORS.map((c) => (
              <button
                key={c}
                className="swatch"
                aria-label={`Bandenfarbe ${c}`}
                style={{ background: c, outline: settings.railColor === c ? '2px solid var(--accent)' : 'none' }}
                onClick={() => void patchSettings({ railColor: c })}
              />
            ))}
          </div>
        </div>

        <div className="field">
          <label htmlFor="s-orient">Ausrichtung des Diagramms</label>
          <select
            id="s-orient"
            className="select"
            value={settings.orientation}
            onChange={(e) =>
              void patchSettings({ orientation: e.target.value as 'landscape' | 'portrait' })
            }
          >
            <option value="landscape">Quer (Laengsachse waagerecht)</option>
            <option value="portrait">Hoch (Laengsachse senkrecht)</option>
          </select>
        </div>

        <label className="row" style={{ gap: 8 }}>
          <input
            type="checkbox"
            checked={settings.snapToGrid}
            onChange={(e) => void patchSettings({ snapToGrid: e.target.checked })}
          />
          <span>Baelle auf das Diamantenraster einrasten</span>
        </label>

        <div className="field">
          <label htmlFor="s-step">
            Rasterweite {settings.snapStep.toFixed(3)} Zoll (
            {(TABLE.diamondSpacing / settings.snapStep).toFixed(0)} Schritte je Diamant)
          </label>
          <select
            id="s-step"
            className="select"
            value={settings.snapStep}
            disabled={!settings.snapToGrid}
            onChange={(e) => void patchSettings({ snapStep: Number(e.target.value) })}
          >
            <option value={TABLE.diamondSpacing}>Ganze Diamanten</option>
            <option value={TABLE.diamondSpacing / 2}>Halbe Diamanten</option>
            <option value={TABLE.diamondSpacing / 4}>Viertel Diamanten</option>
            <option value={TABLE.diamondSpacing / 8}>Achtel Diamanten</option>
          </select>
        </div>
      </section>

      <section className="card stack">
        <h2>Standardwerte fuer neue Stoesse</h2>
        <div className="field">
          <label htmlFor="s-radius">Radius der Zielzone {settings.defaultTargetRadius} Zoll</label>
          <input
            id="s-radius"
            className="slider"
            type="range"
            min={2}
            max={20}
            step={0.5}
            value={settings.defaultTargetRadius}
            onChange={(e) => void patchSettings({ defaultTargetRadius: Number(e.target.value) })}
          />
        </div>
        {(
          [
            ['developing', 'Im Aufbau ab'],
            ['proficient', 'Sicher ab'],
            ['advanced', 'Fortgeschritten ab'],
            ['exemplary', 'Meisterlich ab'],
          ] as const
        ).map(([key, label]) => (
          <div className="field" key={key}>
            <label htmlFor={`s-${key}`}>
              {label} {settings.defaultThresholds[key]} %
            </label>
            <input
              id={`s-${key}`}
              className="slider"
              type="range"
              min={0}
              max={100}
              step={5}
              value={settings.defaultThresholds[key]}
              onChange={(e) =>
                void patchSettings({
                  defaultThresholds: {
                    ...settings.defaultThresholds,
                    [key]: Number(e.target.value),
                  },
                })
              }
            />
          </div>
        ))}
      </section>

      <section className="card stack">
        <h2>Daten</h2>
        <p className="small muted">
          Alles liegt nur in diesem Browser. Eine Sicherung ist die einzige Kopie, wenn der
          Browserspeicher geleert wird.
        </p>
        <div className="row">
          <button className="btn" onClick={() => void exportAll()}>
            Sicherung speichern
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            Sicherung einspielen
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (file) void importFile(file)
            }}
          />
          <button className="btn" onClick={() => void restoreDrills()}>
            Uebungen wiederherstellen
          </button>
          <button className="btn" onClick={() => navigate('/import')}>
            Geteilten Stoss uebernehmen
          </button>
          <span className="spacer" />
          <button className="btn btn--danger" onClick={() => void wipe()}>
            Alle Daten loeschen
          </button>
        </div>
      </section>
    </div>
  )
}
