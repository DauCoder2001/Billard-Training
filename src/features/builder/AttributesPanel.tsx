/** Das Attribut-Panel unter dem Diagramm. */

import { useState } from 'react'
import { POCKET_BY_ID } from '@/domain/geometry'
import { computeCutAngle } from '@/domain/shot'
import {
  SHOT_TYPES,
  SHOT_TYPE_LABELS,
  SKILL_LABELS,
  SKILL_TAGS,
} from '@/domain/types'
import type { ScoringMode, ShotType, SkillTag } from '@/domain/types'
import { useBuilder } from './store'
import { SpinPicker, spinLabel } from './SpinPicker'

type Tab = 'shot' | 'scoring' | 'coach' | 'advanced'

const TABS: { id: Tab; label: string }[] = [
  { id: 'shot', label: 'Stoss' },
  { id: 'scoring', label: 'Bewertung' },
  { id: 'coach', label: 'Coach' },
  { id: 'advanced', label: 'Erweitert' },
]

const SCORING_LABELS: Record<ScoringMode, string> = {
  pocket: 'Nur Einlochen',
  position: 'Nur Position des Weissen',
  'pocket+position': 'Einlochen und Position',
}

export function AttributesPanel() {
  const shot = useBuilder((s) => s.shot)
  const change = useBuilder((s) => s.change)
  const apply = useBuilder((s) => s.apply)
  const beginChange = useBuilder((s) => s.beginChange)
  const [tab, setTab] = useState<Tab>('shot')

  const attrs = shot.attributes
  const scoring = shot.scoring
  const pocket = shot.target.pocketId ? POCKET_BY_ID[shot.target.pocketId] : null

  const setAttr = <K extends keyof typeof attrs>(key: K, value: (typeof attrs)[K]) =>
    apply((s) => ({ ...s, attributes: { ...s.attributes, [key]: value } }))

  const toggleSkill = (skill: SkillTag) =>
    change((s) => ({
      ...s,
      attributes: {
        ...s.attributes,
        skills: s.attributes.skills.includes(skill)
          ? s.attributes.skills.filter((x) => x !== skill)
          : [...s.attributes.skills, skill],
      },
    }))

  return (
    <div className="builder__panel">
      <div className="builder__tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`btn btn--sm${tab === t.id ? ' is-on' : ' btn--ghost'}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="builder__panel-body">
        {tab === 'shot' && (
          <div className="builder__cols">
            <div className="stack">
              <div className="field">
                <label htmlFor="a-type">Stossart</label>
                <select
                  id="a-type"
                  className="select"
                  value={attrs.shotType}
                  onChange={(e) => change((s) => ({
                    ...s,
                    attributes: { ...s.attributes, shotType: e.target.value as ShotType },
                  }))}
                >
                  {SHOT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {SHOT_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>

              <Range
                label={`Schwierigkeit ${attrs.difficulty}`}
                value={attrs.difficulty}
                min={1}
                max={10}
                onStart={beginChange}
                onChange={(v) => setAttr('difficulty', v)}
              />
              <Range
                label={`Geschwindigkeit ${attrs.speed}`}
                value={attrs.speed}
                min={1}
                max={10}
                onStart={beginChange}
                onChange={(v) => setAttr('speed', v)}
              />
            </div>

            <div className="stack">
              <span className="tiny">Treffpunkt auf dem Weissen</span>
              <div className="row">
                <SpinPicker
                  value={attrs.spin}
                  onChange={(spin) => apply((s) => ({ ...s, attributes: { ...s.attributes, spin } }))}
                />
                <div className="stack" style={{ gap: 4 }}>
                  <strong>{spinLabel(attrs.spin)}</strong>
                  <span className="small muted">
                    hoch {attrs.spin.y.toFixed(2)} / seit {attrs.spin.x.toFixed(2)}
                  </span>
                  <button
                    className="btn btn--sm btn--ghost"
                    onClick={() =>
                      change((s) => ({ ...s, attributes: { ...s.attributes, spin: { x: 0, y: 0 } } }))
                    }
                  >
                    Mittig
                  </button>
                </div>
              </div>

              <div className="stack" style={{ gap: 6 }}>
                <span className="tiny">Schnittwinkel</span>
                <strong>{computeCutAngle(shot).toFixed(1)}°</strong>
                <span className="small muted">
                  Ergibt sich aus der Lage von Weissem, Objektball und Tasche.
                </span>
              </div>
            </div>

            <div className="stack" style={{ gap: 6 }}>
              <span className="tiny">Faehigkeiten</span>
              <div className="row row--tight">
                {SKILL_TAGS.map((s) => (
                  <button
                    key={s}
                    className={`chip${attrs.skills.includes(s) ? ' is-on' : ''}`}
                    onClick={() => toggleSkill(s)}
                  >
                    {SKILL_LABELS[s]}
                  </button>
                ))}
              </div>
              <span className="small muted">
                Faehigkeiten steuern, welche Bewertungen der Coach fortschreibt.
              </span>
            </div>
          </div>
        )}

        {tab === 'scoring' && (
          <div className="builder__cols">
            <div className="stack">
              <div className="field">
                <label htmlFor="a-mode">Was zaehlt als Treffer</label>
                <select
                  id="a-mode"
                  className="select"
                  value={scoring.mode}
                  onChange={(e) =>
                    change((s) => ({
                      ...s,
                      scoring: { ...s.scoring, mode: e.target.value as ScoringMode },
                    }))
                  }
                >
                  {(Object.keys(SCORING_LABELS) as ScoringMode[]).map((m) => (
                    <option key={m} value={m}>
                      {SCORING_LABELS[m]}
                    </option>
                  ))}
                </select>
              </div>

              {scoring.targetZone ? (
                <>
                  <Range
                    label={`Radius der Zielzone ${scoring.targetZone.r.toFixed(1)} Zoll`}
                    value={scoring.targetZone.r}
                    min={2}
                    max={20}
                    step={0.5}
                    onStart={beginChange}
                    onChange={(r) =>
                      apply((s) => ({
                        ...s,
                        scoring: {
                          ...s.scoring,
                          targetZone: s.scoring.targetZone ? { ...s.scoring.targetZone, r } : null,
                        },
                      }))
                    }
                  />
                  <button
                    className="btn btn--sm"
                    onClick={() =>
                      change((s) => ({ ...s, scoring: { ...s.scoring, targetZone: null } }))
                    }
                  >
                    Zielzone entfernen
                  </button>
                </>
              ) : (
                <p className="small muted">
                  Ohne Zielzone zaehlt nur das Einlochen. Zielzone im Werkzeug links setzen.
                </p>
              )}

              <label className="row" style={{ gap: 8 }}>
                <input
                  type="checkbox"
                  checked={scoring.scratchRisk ?? false}
                  onChange={(e) =>
                    change((s) => ({
                      ...s,
                      scoring: { ...s.scoring, scratchRisk: e.target.checked },
                    }))
                  }
                />
                <span className="small">Erhoehtes Kratzerrisiko</span>
              </label>
            </div>

            <div className="stack">
              <span className="tiny">Schwellen fuer die Einstufung</span>
              {(
                [
                  ['developing', 'Im Aufbau ab'],
                  ['proficient', 'Sicher ab'],
                  ['advanced', 'Fortgeschritten ab'],
                  ['exemplary', 'Meisterlich ab'],
                ] as const
              ).map(([key, label]) => (
                <Range
                  key={key}
                  label={`${label} ${scoring.thresholds[key]} %`}
                  value={scoring.thresholds[key]}
                  min={0}
                  max={100}
                  step={5}
                  onStart={beginChange}
                  onChange={(v) =>
                    apply((s) => ({
                      ...s,
                      scoring: { ...s.scoring, thresholds: { ...s.scoring.thresholds, [key]: v } },
                    }))
                  }
                />
              ))}
            </div>
          </div>
        )}

        {tab === 'coach' && (
          <div className="builder__cols">
            <div className="field">
              <label htmlFor="a-desc">Kurzbeschreibung</label>
              <input
                id="a-desc"
                className="input"
                value={shot.description}
                placeholder="Worum geht es bei diesem Stoss?"
                onChange={(e) => apply((s) => ({ ...s, description: e.target.value }))}
              />
            </div>
            <div className="field" style={{ gridColumn: 'span 2' }}>
              <label htmlFor="a-notes">Hinweis des Coachs</label>
              <textarea
                id="a-notes"
                className="textarea"
                value={shot.coachNotes}
                placeholder="Worauf soll beim Ueben geachtet werden?"
                onChange={(e) => apply((s) => ({ ...s, coachNotes: e.target.value }))}
              />
            </div>
          </div>
        )}

        {tab === 'advanced' && (
          <div className="builder__cols">
            <div className="stack">
              <Range
                label={`Queue-Erhoehung ${attrs.elevation}°`}
                value={attrs.elevation}
                min={0}
                max={45}
                onStart={beginChange}
                onChange={(v) => setAttr('elevation', v)}
              />
              {pocket && (
                <Range
                  label={`Tasche anschneiden ${shot.target.cheat.toFixed(2)}`}
                  value={shot.target.cheat}
                  min={-1}
                  max={1}
                  step={0.05}
                  onStart={beginChange}
                  onChange={(cheat) => apply((s) => ({ ...s, target: { ...s.target, cheat } }))}
                />
              )}
              <span className="small muted">
                {pocket
                  ? `Zieltasche: ${pocket.label}. Anschneiden verschiebt den Zielpunkt in der Muendung.`
                  : 'Noch keine Zieltasche gewaehlt. Tippe im Diagramm auf eine Tasche.'}
              </span>
            </div>

            <div className="field">
              <label htmlFor="a-tags">Schlagworte, mit Komma getrennt</label>
              <input
                id="a-tags"
                className="input"
                value={shot.tags.join(', ')}
                onChange={(e) =>
                  apply((s) => ({
                    ...s,
                    tags: e.target.value
                      .split(',')
                      .map((t) => t.trim())
                      .filter(Boolean),
                  }))
                }
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface RangeProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onStart?: () => void
  onChange: (value: number) => void
}

/**
 * Schieberegler, der beim Anfassen einen Historieneintrag anlegt und danach
 * nur noch den Wert ersetzt. Sonst waere die Historie nach einem Zug voll.
 */
function Range({ label, value, min, max, step = 1, onStart, onChange }: RangeProps) {
  return (
    <div className="field">
      <label>{label}</label>
      <input
        className="slider"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onPointerDown={onStart}
        onKeyDown={onStart}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  )
}
