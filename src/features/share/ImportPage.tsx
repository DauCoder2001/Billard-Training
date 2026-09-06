/** Einen geteilten Stoss uebernehmen. */

import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useApp } from '@/app/store'
import { ShotDiagram } from '@/components/table/ShotDiagram'
import { saveShot } from '@/data/repositories/shots'
import { decodeShot, payloadFromInput } from '@/domain/share'
import { SHOT_TYPE_LABELS } from '@/domain/types'
import type { Shot } from '@/domain/types'
import { SkillChips } from '@/ui/bits'
import { useDialogs } from '@/ui/Dialogs'

export function ImportPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const dialogs = useDialogs()
  const settings = useApp((s) => s.settings)

  const [shot, setShot] = useState<Shot | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [manual, setManual] = useState('')

  const payload = params.get('d')

  useEffect(() => {
    if (!payload) return
    try {
      setShot(decodeShot(payload))
      setError(null)
    } catch (err) {
      setShot(null)
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
    }
  }, [payload])

  const readManual = () => {
    const extracted = payloadFromInput(manual)
    if (!extracted) {
      setError('In der Eingabe steckt kein geteilter Stoss.')
      return
    }
    try {
      setShot(decodeShot(extracted))
      setError(null)
    } catch (err) {
      setShot(null)
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
    }
  }

  const take = async () => {
    if (!shot) return
    const saved = await saveShot(shot)
    dialogs.toast('Stoss uebernommen', 'ok')
    navigate(`/shot/${saved.id}`, { replace: true })
  }

  return (
    <div className="page stack">
      <div className="page__head">
        <div>
          <h1>Geteilten Stoss uebernehmen</h1>
          <p className="page__sub">
            Der Stoss steckt vollstaendig im Link. Er wird erst gespeichert, wenn du ihn
            uebernimmst.
          </p>
        </div>
      </div>

      {!payload && (
        <div className="card stack">
          <div className="field">
            <label htmlFor="imp">Link oder Code einfuegen</label>
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
            Womoeglich wurde der Link beim Kopieren abgeschnitten.
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
                Uebernehmen
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
