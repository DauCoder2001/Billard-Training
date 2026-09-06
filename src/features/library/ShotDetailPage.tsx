import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useActivePlayer, useApp } from '@/app/store'
import { ShotDiagram } from '@/components/table/ShotDiagram'
import { useSessions, useShot } from '@/data/hooks'
import { deleteShot, toggleFavorite } from '@/data/repositories/shots'
import { POCKET_BY_ID } from '@/domain/geometry'
import { pocketRate, proficiencyFor, scratchRate } from '@/domain/scoring'
import {
  SESSION_ATTEMPTS,
  SHOT_TYPE_LABELS,
  type SessionFormat,
} from '@/domain/types'
import { ShareDialog } from '@/features/share/ShareDialog'
import { ProficiencyBadge, SkillChips, Stat } from '@/ui/bits'
import { useDialogs } from '@/ui/Dialogs'
import { Sparkline } from '@/features/stats/charts'

const FORMATS: { id: SessionFormat; label: string; attempts: number | null }[] = [
  { id: 'quick', label: 'Kurz', attempts: SESSION_ATTEMPTS.quick },
  { id: 'standard', label: 'Standard', attempts: SESSION_ATTEMPTS.standard },
  { id: 'deep', label: 'Intensiv', attempts: SESSION_ATTEMPTS.deep },
  { id: 'custom', label: 'Frei', attempts: null },
]

export function ShotDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dialogs = useDialogs()
  const shot = useShot(id)
  const player = useActivePlayer()
  const settings = useApp((s) => s.settings)
  const sessions = useSessions(player?.id ?? null)
  const [shareOpen, setShareOpen] = useState(false)

  const history = useMemo(
    () =>
      (sessions ?? [])
        .filter((s) => s.shotId === id && s.finishedAt !== null)
        .sort((a, b) => (a.finishedAt ?? 0) - (b.finishedAt ?? 0)),
    [sessions, id],
  )

  if (shot === undefined) {
    return (
      <div className="page">
        <p className="muted">Wird geladen …</p>
      </div>
    )
  }
  if (shot === null) {
    return (
      <div className="page">
        <h1>Stoss nicht gefunden</h1>
        <Link className="btn" to="/library">
          Zur Bibliothek
        </Link>
      </div>
    )
  }

  const last = history[history.length - 1]
  const best = history.reduce((a, s) => Math.max(a, s.score), 0)
  const allAttempts = history.flatMap((s) => s.results)
  const pocket = shot.target.pocketId ? POCKET_BY_ID[shot.target.pocketId] : null

  const startTraining = async (format: SessionFormat) => {
    let attempts = FORMATS.find((f) => f.id === format)?.attempts ?? null
    if (attempts === null) {
      const answer = await dialogs.prompt({
        title: 'Wie viele Versuche?',
        label: 'Anzahl',
        initial: '15',
      })
      if (answer === null) return
      attempts = Math.max(1, Math.min(200, Number(answer) || 0))
      if (!attempts) return
    }
    navigate(`/train/${shot.id}?format=${format}&attempts=${attempts}`)
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

  return (
    <div className="page stack">
      <div className="page__head">
        <div>
          <Link className="btn btn--sm btn--ghost" to="/library">
            ← Stoesse
          </Link>
          <h1 style={{ marginTop: 6 }}>{shot.name}</h1>
          {shot.description && <p className="page__sub">{shot.description}</p>}
        </div>
        <div className="row row--tight">
          <button
            className={`btn btn--sm${shot.favorite ? ' is-on' : ''}`}
            onClick={() => void toggleFavorite(shot.id)}
          >
            ★ Favorit
          </button>
          <button className="btn btn--sm" onClick={() => setShareOpen(true)}>
            Teilen
          </button>
          <button className="btn btn--sm" onClick={() => navigate(`/builder/${shot.id}`)}>
            Bearbeiten
          </button>
        </div>
      </div>

      <div className="detail">
        <div className="stack">
          <ShotDiagram
            shot={shot}
            orientation={settings.orientation}
            clothColor={settings.clothColor}
            railColor={settings.railColor}
            showAim
          />
          <div className="row row--tight small muted">
            <span>◍ Weisser</span>
            <span style={{ color: 'var(--accent)' }}>— Weg des Objektballs</span>
            <span>--- Weg des Weissen</span>
            {shot.scoring.targetZone && <span style={{ color: 'var(--accent)' }}>◎ Zielzone</span>}
          </div>
        </div>

        <div className="stack">
          <div className="card stack">
            <h2>Trainieren</h2>
            <div className="row row--tight">
              {FORMATS.map((f) => (
                <button
                  key={f.id}
                  className={`btn${f.id === 'standard' ? ' btn--primary' : ''}`}
                  onClick={() => void startTraining(f.id)}
                >
                  {f.label}
                  {f.attempts ? ` · ${f.attempts}` : ''}
                </button>
              ))}
            </div>
            <span className="small muted">
              {shot.scoring.mode === 'pocket'
                ? 'Gewertet wird nur, ob der Ball faellt.'
                : shot.scoring.mode === 'position'
                  ? 'Gewertet wird nur, wo der Weisse liegen bleibt.'
                  : 'Gewertet werden Treffer und die Lage des Weissen.'}
            </span>
          </div>

          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}>
            <Stat
              label="Letztes Ergebnis"
              value={last ? `${last.score.toFixed(0)} %` : '–'}
              hint={last ? new Date(last.finishedAt ?? 0).toLocaleDateString('de-DE') : 'noch nie geuebt'}
            />
            <Stat label="Bestwert" value={history.length ? `${best.toFixed(0)} %` : '–'} />
            <Stat label="Sessions" value={history.length} />
            <Stat
              label="Trefferquote"
              value={allAttempts.length ? `${pocketRate(allAttempts).toFixed(0)} %` : '–'}
              hint={allAttempts.length ? `Kratzer ${scratchRate(allAttempts).toFixed(0)} %` : undefined}
            />
          </div>

          {history.length > 1 && (
            <div className="card stack">
              <h3>Verlauf</h3>
              <Sparkline values={history.map((s) => s.score)} />
              <span className="small muted">{history.length} Sessions, aelteste links.</span>
            </div>
          )}

          <div className="card stack">
            <h3>Eigenschaften</h3>
            <div className="row small">
              <span className="muted">Art</span>
              <strong>{SHOT_TYPE_LABELS[shot.attributes.shotType]}</strong>
              <span className="muted">Schwierigkeit</span>
              <strong>{shot.attributes.difficulty}/10</strong>
              <span className="muted">Tempo</span>
              <strong>{shot.attributes.speed}/10</strong>
              <span className="muted">Schnitt</span>
              <strong>{shot.attributes.cutAngle.toFixed(1)}°</strong>
            </div>
            {pocket && <div className="small muted">Zieltasche: {pocket.label}</div>}
            <SkillChips skills={shot.attributes.skills} />
            {last && (
              <div className="row">
                <span className="muted small">Einstufung</span>
                <ProficiencyBadge value={proficiencyFor(last.score, shot.scoring.thresholds)} />
              </div>
            )}
          </div>

          {shot.coachNotes && (
            <div className="card stack">
              <h3>Hinweis</h3>
              <p style={{ margin: 0 }}>{shot.coachNotes}</p>
            </div>
          )}

          {!shot.builtIn && (
            <div className="row">
              <button className="btn btn--sm btn--danger" onClick={() => void remove()}>
                Stoss loeschen
              </button>
            </div>
          )}
        </div>
      </div>

      {shareOpen && <ShareDialog shot={shot} onClose={() => setShareOpen(false)} />}
    </div>
  )
}
