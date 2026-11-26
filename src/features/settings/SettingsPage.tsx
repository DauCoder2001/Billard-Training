import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useActivePlayer, useApp } from '@/app/store'
import { db } from '@/data/db'
import { storageErrorText } from '@/data/errors'
import { usePlayers } from '@/data/hooks'
import { SEED_VERSION } from '@/data/bootstrap'
import { seedShots } from '@/data/seed/drills'
import { exportBackup, importBackup } from '@/data/repositories/backup'
import { createPlayer, deletePlayer, updatePlayer } from '@/data/repositories/players'
import { TABLE } from '@/domain/geometry'
import { orderedThresholds } from '@/domain/scoring'
import { plural } from '@/domain/text'
import type { Markings, Settings } from '@/domain/types'
import { downloadText } from '@/features/share/exportImage'
import { useDialogs } from '@/ui/Dialogs'

/** Die Markierungen in der Reihenfolge, in der sie auf dem Tuch auffallen. */
const MARKIERUNGEN: { feld: keyof Markings; text: string; hinweis: string }[] = [
  { feld: 'diamonds', text: 'Diamanten', hinweis: 'die Punkte auf der Bande' },
  { feld: 'headString', text: 'Kopflinie', hinweis: 'die Grenze des Kopffelds' },
  { feld: 'spots', text: 'Kopf- und Fußpunkt', hinweis: 'die beiden Punkte auf dem Tuch' },
  {
    feld: 'guides',
    text: 'Hilfslinien',
    hinweis: 'von Diamant zu Diamant, längs und quer',
  },
  {
    feld: 'breakBox',
    text: 'Anstoßfeld',
    hinweis: 'wo der Weiße beim Anstoß liegen darf',
  },
  {
    feld: 'rackOutline',
    text: 'Dreieck am Fußpunkt',
    hinweis: 'der Platz des vollen Aufbaus',
  },
  {
    feld: 'grid',
    text: 'Punkteraster',
    hinweis: 'nur im Baukasten, im Abstand des Einrastens',
  },
]

const CLOTH_COLORS = ['#3f92d2', '#1f6b52', '#2b6b2f', '#1c5f7a', '#7a2f3a', '#4a4a52']
const RAIL_COLORS = ['#e7eaee', '#d8d2c6', '#5b3a22', '#2f3640', '#1d1f24']

export function SettingsPage() {
  const settings = useApp((s) => s.settings)
  const players = usePlayers() ?? []
  const patchSettings = useApp((s) => s.patchSettings)
  const setActivePlayer = useApp((s) => s.setActivePlayer)
  const load = useApp((s) => s.load)
  const active = useActivePlayer()
  const dialogs = useDialogs()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)

  // Eine Einstellung aendern und sagen, wenn der Browserspeicher ablehnt.
  // Ohne die Meldung springt der Regler stumm zurueck.
  const einstellen = async (patch: Partial<Settings>) => {
    const fehler = await patchSettings(patch)
    if (fehler) dialogs.toast(`Nicht gespeichert: ${fehler}`, 'error')
  }

  // Die Markierungen stehen zusammen in einem Feld: immer das ganze
  // schreiben, sonst verliert der Patch die uebrigen Haekchen.
  const markierung = (feld: keyof Markings, an: boolean) =>
    einstellen({ markings: { ...settings.markings, [feld]: an } })

  const spielerWaehlen = async (id: string) => {
    const fehler = await setActivePlayer(id)
    if (fehler) dialogs.toast(`Nicht gespeichert: ${fehler}`, 'error')
  }

  const addPlayer = async () => {
    const name = await dialogs.prompt({ title: 'Neuer Spieler', label: 'Name', initial: '' })
    if (name === null) return
    try {
      const player = await createPlayer(name)
      await spielerWaehlen(player.id)
    } catch (err) {
      dialogs.toast(`Nicht gespeichert: ${storageErrorText(err)}`, 'error')
    }
  }

  const renamePlayer = async (id: string) => {
    const player = players.find((p) => p.id === id)
    if (!player) return
    const name = await dialogs.prompt({ title: 'Spieler umbenennen', label: 'Name', initial: player.name })
    if (name === null || !name.trim()) return
    try {
      await updatePlayer({ ...player, name: name.trim() })
    } catch (err) {
      dialogs.toast(`Nicht gespeichert: ${storageErrorText(err)}`, 'error')
    }
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
      title: `"${player.name}" löschen?`,
      message: 'Alle Trainingsergebnisse dieses Profils werden entfernt.',
      confirmLabel: 'Löschen',
      danger: true,
    })
    if (!ok) return
    try {
      await deletePlayer(id)
      const rest = players.filter((p) => p.id !== id)
      if (rest[0]) await spielerWaehlen(rest[0].id)
    } catch (err) {
      dialogs.toast(`Nicht gelöscht: ${storageErrorText(err)}`, 'error')
    }
  }

  const exportAll = async () => {
    try {
      const backup = await exportBackup()
      const stamp = new Date().toISOString().slice(0, 10)
      downloadText(JSON.stringify(backup, null, 2), `billard-training-${stamp}.json`)
      dialogs.toast('Sicherung gespeichert', 'ok')
    } catch (err) {
      dialogs.toast(`Keine Sicherung angelegt: ${storageErrorText(err)}`, 'error')
    }
  }

  const importFile = async (file: File) => {
    let parsed: unknown
    try {
      parsed = JSON.parse(await file.text())
    } catch {
      dialogs.toast('Die Datei ließ sich nicht lesen', 'error')
      return
    }
    // Drei Antworten, keine zwei: "Abbrechen" hiess hier frueher
    // "Hinzufuegen", und damit spielte auch Escape die Sicherung ein.
    const mode = await dialogs.choose({
      title: 'Sicherung einspielen',
      message: `${file.name} wird eingespielt. Soll der vorhandene Bestand ersetzt werden, oder soll die Sicherung dazukommen?`,
      actions: [
        { id: 'merge', label: 'Hinzufügen', tone: 'primary' },
        { id: 'replace', label: 'Ersetzen', tone: 'danger' },
      ],
    })
    if (mode === null) return
    try {
      const result = await importBackup(parsed, mode)
      // Stoesse, Spieler, Einheiten und Workouts kommen reaktiv aus der
      // Datenbank und sind sofort da. Die Einstellungen nicht: sie stehen im
      // App-Zustand und wurden einmal beim Start gelesen. Ohne dieses
      // Nachziehen zeichnete die App weiter mit den alten Farben, und die
      // eingespielten Werte sprangen erst bei der naechsten beliebigen
      // Aenderung hervor. load() liest sie neu und laesst bootstrap laufen:
      // das legt nach "Ersetzen" ein fehlendes Profil an und zieht einen
      // activePlayerId gerade, den es nicht mehr gibt.
      await load()
      await dialogs.alert({
        title: 'Sicherung eingespielt',
        message:
          `${plural(result.shots, 'Übung', 'Übungen')}, ` +
          `${plural(result.players, 'Spieler', 'Spieler')}, ` +
          `${plural(result.sessions, 'Einheit', 'Einheiten')}, ` +
          `${plural(result.workouts, 'Workout', 'Workouts')}.` +
          (result.dropped > 0
            ? ` ${plural(result.dropped, 'Eintrag war', 'Einträge waren')} unbrauchbar ` +
              'und wurde weggelassen.'
            : ''),
      })
    } catch (err) {
      dialogs.toast(storageErrorText(err), 'error')
    }
  }

  const restoreDrills = async () => {
    const ok = await dialogs.confirm({
      title: 'Mitgelieferte Übungen wiederherstellen',
      message:
        'Die mitgelieferten Übungen werden neu eingespielt. Selbst gebaute Übungen bleiben unberührt. ' +
        'Eigene Änderungen an mitgelieferten Übungen – Name, Notizen, Schwellen – gehen verloren, ' +
        'Favoriten bleiben markiert.',
      confirmLabel: 'Einspielen',
    })
    if (!ok) return
    try {
      const fresh = seedShots()
      const stored = await db.shots.bulkGet(fresh.map((s) => s.id))
      // Der Favorit ist eine Entscheidung des Nutzers und steht nicht in der
      // Vorlage: ohne dieses Mitnehmen setzt das Wiederherstellen ihn zurueck.
      await db.shots.bulkPut(
        fresh.map((s, i) => ({ ...s, favorite: stored[i]?.favorite ?? false })),
      )
      const fehler = await patchSettings({ seededVersion: SEED_VERSION })
      if (fehler) {
        dialogs.toast(`Nicht gespeichert: ${fehler}`, 'error')
        return
      }
      dialogs.toast('Übungen wiederhergestellt', 'ok')
    } catch (err) {
      dialogs.toast(`Nicht gespeichert: ${storageErrorText(err)}`, 'error')
    }
  }

  const wipe = async () => {
    const ok = await dialogs.confirm({
      title: 'Alle Daten löschen?',
      message:
        'Übungen, Spieler, Einheiten und Workouts werden entfernt. Das lässt sich nicht ' +
        'rückgängig machen. Weitere offene Fenster dieser App vorher schließen – sonst ' +
        'wartet das Löschen auf sie.',
      confirmLabel: 'Alles löschen',
      danger: true,
    })
    if (!ok) return
    const typed = await dialogs.prompt({
      title: 'Sicher?',
      message: 'Zum Bestätigen LÖSCHEN eingeben.',
      label: 'Bestätigung',
    })
    if (typed?.trim().toUpperCase() !== 'LÖSCHEN') {
      dialogs.toast('Abgebrochen', 'error')
      return
    }
    // Der einzige Schreibweg, der ohne Klammer dastand. Haelt ein zweiter Tab
    // die Datenbank offen, wartet IndexedDB - dann kommt weder Fehler noch
    // Neuladen, und darum steht der Hinweis oben im Dialog.
    try {
      await db.delete()
    } catch (err) {
      dialogs.toast(`Nicht gelöscht: ${storageErrorText(err)}`, 'error')
      return
    }
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
              onClick={() => void spielerWaehlen(p.id)}
            >
              {p.id === active?.id ? '● ' : ''}
              {p.name}
            </button>
            <span className="spacer" />
            <button className="btn btn--sm" onClick={() => void renamePlayer(p.id)}>
              Umbenennen
            </button>
            <button className="btn btn--sm btn--danger" onClick={() => void removePlayer(p.id)}>
              Löschen
            </button>
          </div>
        ))}
        <div className="row">
          <button className="btn" onClick={() => void addPlayer()}>
            Spieler hinzufügen
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
                onClick={() => void einstellen({ clothColor: c })}
              />
            ))}
          </div>
        </div>

        <div className="field">
          <label>Rahmenfarbe</label>
          <div className="row row--tight">
            {RAIL_COLORS.map((c) => (
              <button
                key={c}
                className="swatch"
                aria-label={`Rahmenfarbe ${c}`}
                style={{ background: c, outline: settings.railColor === c ? '2px solid var(--accent)' : 'none' }}
                onClick={() => void einstellen({ railColor: c })}
              />
            ))}
          </div>
          <span className="small muted">
            Bandenkante, Kopflinie und die Markierungen richten sich nach der Tuchfarbe.
          </span>
        </div>

        <div className="field">
          <label htmlFor="s-orient">Ausrichtung des Diagramms</label>
          <select
            id="s-orient"
            className="select"
            value={settings.orientation}
            onChange={(e) =>
              void einstellen({ orientation: e.target.value as 'landscape' | 'portrait' })
            }
          >
            <option value="landscape">Quer (Längsachse waagerecht)</option>
            <option value="portrait">Hoch (Längsachse senkrecht)</option>
          </select>
        </div>

        <label className="row" style={{ gap: 8 }}>
          <input
            type="checkbox"
            checked={settings.snapToGrid}
            onChange={(e) => void einstellen({ snapToGrid: e.target.checked })}
          />
          <span>Bälle auf das Diamantenraster einrasten</span>
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
            onChange={(e) => void einstellen({ snapStep: Number(e.target.value) })}
          >
            <option value={TABLE.diamondSpacing}>Ganze Diamanten</option>
            <option value={TABLE.diamondSpacing / 2}>Halbe Diamanten</option>
            <option value={TABLE.diamondSpacing / 4}>Viertel Diamanten</option>
            <option value={TABLE.diamondSpacing / 8}>Achtel Diamanten</option>
          </select>
        </div>
      </section>

      <section className="card stack">
        <h2>Markierungen auf dem Tuch</h2>
        <span className="small muted">
          Gilt dort, wo der Tisch die Arbeitsfläche ist: im Baukasten und beim Training. Die
          Vorschaubilder der Sammlung behalten ihr ruhiges Bild.
        </span>
        {MARKIERUNGEN.map(({ feld, text, hinweis }) => (
          <label key={feld} className="row" style={{ gap: 8 }}>
            <input
              type="checkbox"
              checked={settings.markings[feld]}
              onChange={(e) => void markierung(feld, e.target.checked)}
            />
            <span>
              {text} <span className="small muted">— {hinweis}</span>
            </span>
          </label>
        ))}
      </section>

      <section className="card stack">
        <h2>Standardwerte für neue Übungen</h2>
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
            onChange={(e) => void einstellen({ defaultTargetRadius: Number(e.target.value) })}
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
                void einstellen({
                  defaultThresholds: orderedThresholds({
                    ...settings.defaultThresholds,
                    [key]: Number(e.target.value),
                  }),
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
            Mitgelieferte Übungen wiederherstellen
          </button>
          <button className="btn" onClick={() => navigate('/import')}>
            Geteilte Übung übernehmen
          </button>
        </div>

        <div className="danger-zone">
          <button className="btn btn--danger" onClick={() => void wipe()}>
            Alle Daten löschen
          </button>
          <span className="small muted">
            Entfernt Übungen, Spieler, Einheiten und Workouts von diesem Gerät. Das lässt sich
            nicht rückgängig machen.
          </span>
        </div>
      </section>

      {/* Nach einer Veroeffentlichung liefert der Service Worker beim ersten
          Laden noch die alte Fassung aus. Hieran ist zu erkennen, welche
          gerade im Browser liegt. */}
      <p className="small muted" style={{ textAlign: 'center', margin: 0 }}>
        Billard Training {__APP_VERSION__}
      </p>
    </div>
  )
}
