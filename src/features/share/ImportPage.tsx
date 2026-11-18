/** Einen geteilten Stoss uebernehmen. */

import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useApp } from '@/app/store'
import { ShotDiagram } from '@/components/table/ShotDiagram'
import { saveShot } from '@/data/repositories/shots'
import { decodeShot, payloadFromInput } from '@/domain/share'
import { SHOT_TYPE_LABELS } from '@/domain/types'
import type { Shot } from '@/domain/types'
import { SkillChips } from '@/ui/bits'
import { useDialogs } from '@/ui/Dialogs'

/** Was beim Lesen einer Nutzlast herauskommt: ein Stoss oder ein Grund. */
type Gelesen = { shot: Shot; error: null } | { shot: null; error: string }

function lesen(payload: string): Gelesen {
  try {
    return { shot: decodeShot(payload), error: null }
  } catch (err) {
    return { shot: null, error: err instanceof Error ? err.message : 'Unbekannter Fehler' }
  }
}

export function ImportPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const dialogs = useDialogs()
  const settings = useApp((s) => s.settings)

  const [manual, setManual] = useState('')
  const [vonHand, setVonHand] = useState<Gelesen | null>(null)

  const payload = params.get('d')

  // Traegt die Adresse eine Nutzlast, ist der Stoss aus ihr abgeleitet und
  // braucht keinen eigenen Zustand. Das Feld "von Hand einfuegen" erscheint
  // nur ohne Nutzlast in der Adresse - die beiden Wege kommen sich nicht in
  // die Quere.
  const ausAdresse = useMemo(() => (payload ? lesen(payload) : null), [payload])
  const gelesen = ausAdresse ?? vonHand
  const shot = gelesen?.shot ?? null
  const error = gelesen?.error ?? null

  const readManual = () => {
    const extracted = payloadFromInput(manual)
    setVonHand(
      extracted
        ? lesen(extracted)
        : { shot: null, error: 'In der Eingabe steckt kein geteilter Stoß.' },
    )
  }

  const take = async () => {
    if (!shot) return
    const saved = await saveShot(shot)
    dialogs.toast('Stoß übernommen', 'ok')
    navigate(`/shot/${saved.id}`, { replace: true })
  }

  return (
    <div className="page stack">
      <div className="page__head">
        <div>
          <h1>Geteilten Stoß übernehmen</h1>
          <p className="page__sub">
            Der Stoß steckt vollständig im Link. Er wird erst gespeichert, wenn du ihn
            übernimmst.
          </p>
        </div>
      </div>

      {!payload && (
        <div className="card stack">
          <div className="field">
            <label htmlFor="imp">Link oder Code einfügen</label>
            <textarea
              id="imp"
              className="textarea"
              value={manual}
              placeholder="https://…/#/import?d=…"
              onChange={(e) => setManual(e.target.value)}
            />
          </div>
          <div className="row">
            <button className="btn btn--primary" disabled={!manual.trim()} onClick={readManual}>
              Lesen
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="card stack">
          <strong style={{ color: 'var(--danger)' }}>{error}</strong>
          <span className="small muted">
            Womöglich wurde der Link beim Kopieren abgeschnitten.
          </span>
        </div>
      )}

      {shot && (
        <div className="detail">
          <ShotDiagram
            shot={shot}
            orientation={settings.orientation}
            clothColor={settings.clothColor}
            railColor={settings.railColor}
            showAim
          />
          <div className="card stack">
            <h2>{shot.name}</h2>
            {shot.description && <p className="muted" style={{ margin: 0 }}>{shot.description}</p>}
            <div className="row small">
              <span className="muted">Art</span>
              <strong>{SHOT_TYPE_LABELS[shot.attributes.shotType]}</strong>
              <span className="muted">Schwierigkeit</span>
              <strong>{shot.attributes.difficulty}/10</strong>
            </div>
            <SkillChips skills={shot.attributes.skills} />
            {shot.coachNotes && <p className="small">{shot.coachNotes}</p>}
            <div className="row">
              <button className="btn btn--primary" onClick={() => void take()}>
                Übernehmen
              </button>
              <button className="btn" onClick={() => navigate('/library')}>
                Verwerfen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
