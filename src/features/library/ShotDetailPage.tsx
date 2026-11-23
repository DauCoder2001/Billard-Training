import { lazy, Suspense, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useActivePlayer, useApp } from '@/app/store'
import { ShotDiagram } from '@/components/table/ShotDiagram'
import { storageErrorText } from '@/data/errors'
import { useSessions, useShot } from '@/data/hooks'
import { deleteShot, toggleFavorite } from '@/data/repositories/shots'
import { POCKET_BY_ID } from '@/domain/geometry'
import { hasObjectBall, pocketRate, proficiencyFor, scratchRate } from '@/domain/scoring'
import {
  MAX_ATTEMPTS,
  MIN_ATTEMPTS,
  SESSION_ATTEMPTS,
  SHOT_TYPE_LABELS,
  type SessionFormat,
} from '@/domain/types'
import { ProficiencyBadge, SkillChips, Stat } from '@/ui/bits'
import { useDialogs } from '@/ui/Dialogs'
import { Sparkline } from '@/features/stats/charts'

const FORMATS: { id: SessionFormat; label: string; attempts: number | null }[] = [
  { id: 'quick', label: 'Kurz', attempts: SESSION_ATTEMPTS.quick },
  { id: 'standard', label: 'Standard', attempts: SESSION_ATTEMPTS.standard },
  { id: 'deep', label: 'Intensiv', attempts: SESSION_ATTEMPTS.deep },
  { id: 'custom', label: 'Frei', attempts: null },
]

// Der Teilen-Dialog bringt den QR-Code-Erzeuger mit und wird nur auf Druck
// geoeffnet: er kommt als eigenes Buendel nach.
const ShareDialog = lazy(() =>
  import('@/features/share/ShareDialog').then((m) => ({ default: m.ShareDialog })),
)

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
        <h1>Stoß nicht gefunden</h1>
        <Link className="btn" to="/library">
          Zu den Stößen
        </Link>
      </div>
    )
  }

  const last = history[history.length - 1]
  const best = history.reduce((a, s) => Math.max(a, s.score), 0)
  const allAttempts = history.flatMap((s) => s.results)
  // Siehe Trefferquote weiter unten: ohne Objektball ist nichts einzulochen.
  const mitObjektball = hasObjectBall(shot)
  const pocket = shot.target.pocketId ? POCKET_BY_ID[shot.target.pocketId] : null

  const startTraining = async (format: SessionFormat) => {
    let attempts = FORMATS.find((f) => f.id === format)?.attempts ?? null
    // Solange fragen, bis eine lesbare Zahl dasteht oder abgebrochen wird.
    // Eine Eingabe zu deuten, die keine Zahl ist, waere geraten: "abc" ergab
    // frueher stillschweigend eine Einheit mit einem einzigen Versuch.
    let eingabe = '15'
    let hinweis = `Eine Zahl zwischen ${MIN_ATTEMPTS} und ${MAX_ATTEMPTS}.`
    while (attempts === null) {
      const answer = await dialogs.prompt({
        title: 'Wie viele Versuche?',
        message: hinweis,
        label: 'Anzahl',
        initial: eingabe,
      })
      if (answer === null) return
      eingabe = answer
      const n = Math.round(Number(answer.trim()))
      if (answer.trim() && Number.isFinite(n) && n >= MIN_ATTEMPTS && n <= MAX_ATTEMPTS) {
        attempts = n
      } else {
        hinweis = `Das ist keine Zahl zwischen ${MIN_ATTEMPTS} und ${MAX_ATTEMPTS}.`
      }
    }
    navigate(`/train/${shot.id}?format=${format}&attempts=${attempts}`)
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
    navigate('/library', { replace: true })
  }

  const markieren = async () => {
    try {
      await toggleFavorite(shot.id)
    } catch (err) {
      dialogs.toast(`Nicht gespeichert: ${storageErrorText(err)}`, 'error')
    }
  }

  return (
    <div className="page stack">
      <div className="page__head">
        <div>
          <Link className="btn btn--sm btn--ghost" to="/library">
            ← Stöße
          </Link>
          <h1 style={{ marginTop: 6 }}>{shot.name}</h1>
          {shot.description && <p className="page__sub">{shot.description}</p>}
        </div>
        <div className="row row--tight">
          <button
            className={`chip${shot.favorite ? ' is-on' : ''}`}
            onClick={() => void markieren()}
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
            <span>◍ Weißer</span>
            <span style={{ color: 'var(--accent)' }}>— Weg des Objektballs</span>
            <span>--- Weg des Weißen</span>
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
                  className={`btn${f.id === 'standard' ? ' is-on' : ''}`}
                  onClick={() => void startTraining(f.id)}
                >
                  {f.label}
                  {f.attempts ? ` · ${f.attempts}` : ''}
                </button>
              ))}
            </div>
            <span className="small muted">
              {shot.scoring.mode === 'pocket'
                ? 'Gewertet wird nur, ob der Ball fällt.'
                : shot.scoring.mode === 'position'
                  ? 'Gewertet wird nur, wo der Weiße liegen bleibt.'
                  : 'Gewertet werden Treffer und die Lage des Weißen.'}
            </span>
          </div>

          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}>
            <Stat
              label="Letztes Ergebnis"
              value={last ? `${last.score.toFixed(0)} %` : '–'}
              hint={last ? new Date(last.finishedAt ?? 0).toLocaleDateString('de-DE') : 'noch nie geübt'}
            />
            <Stat label="Bestwert" value={history.length ? `${best.toFixed(0)} %` : '–'} />
            <Stat label="Einheiten" value={history.length} />
            <Stat
              label="Trefferquote"
              value={
                mitObjektball && allAttempts.length
                  ? `${pocketRate(allAttempts).toFixed(0)} %`
                  : '–'
              }
              hint={
                allAttempts.length
                  ? `${mitObjektball ? '' : 'nichts einzulochen · '}Kratzer ${scratchRate(
                      allAttempts,
                    ).toFixed(0)} %`
                  : mitObjektball
                    ? undefined
                    : 'nichts einzulochen'
              }
            />
          </div>

          {history.length > 1 && (
            <div className="card stack">
              <h3>Verlauf</h3>
              <Sparkline values={history.map((s) => s.score)} />
              <span className="small muted">{history.length} Einheiten, älteste links.</span>
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
              <span className="muted">Schnittwinkel</span>
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
                Stoß löschen
              </button>
            </div>
          )}
        </div>
      </div>

      {shareOpen && (
        <Suspense fallback={null}>
          <ShareDialog shot={shot} onClose={() => setShareOpen(false)} />
        </Suspense>
      )}
    </div>
  )
}
