import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShotDiagram } from '@/components/table/ShotDiagram'
import { useShotStats, useShots } from '@/data/hooks'
import { proficiencyFor } from '@/domain/scoring'
import {
  LEVELS,
  LEVEL_LABELS,
  SHOT_TYPES,
  SHOT_TYPE_LABELS,
  SKILL_LABELS,
  SKILL_TAGS,
} from '@/domain/types'
import type { Level, Shot, ShotType, SkillTag } from '@/domain/types'
import { useActivePlayer, useApp } from '@/app/store'
import { DifficultyDots, EmptyState, ProficiencyBadge } from '@/ui/bits'

type Sort = 'name' | 'level' | 'difficulty' | 'recent' | 'weakest'

/**
 * Filterwert fuer die Stufe. 'none' sind die Uebungen ohne Stufe - selbst
 * gebaute, solange niemand eine gewaehlt hat. Ohne diesen Wert waeren sie
 * ueber den Filter nicht zu finden.
 */
type LevelFilter = Level | 'all' | 'none'

/** Ohne Stufe ans Ende, damit die Reihenfolge A, B, C, D, dann Rest ist. */
function levelRank(shot: Shot): number {
  return shot.level ? LEVELS.indexOf(shot.level) : LEVELS.length
}

export function LibraryPage() {
  const shots = useShots()
  const player = useActivePlayer()
  const settings = useApp((s) => s.settings)
  const stats = useShotStats(player?.id ?? null)
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [skills, setSkills] = useState<SkillTag[]>([])
  const [type, setType] = useState<ShotType | 'all'>('all')
  const [level, setLevel] = useState<LevelFilter>('all')
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [maxDifficulty, setMaxDifficulty] = useState(10)
  const [sort, setSort] = useState<Sort>('name')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const filtered = useMemo(() => {
    const list = (shots ?? []).filter((shot) => {
      if (favoritesOnly && !shot.favorite) return false
      if (type !== 'all' && shot.attributes.shotType !== type) return false
      if (level === 'none' && shot.level) return false
      if (level !== 'all' && level !== 'none' && shot.level !== level) return false
      if (shot.attributes.difficulty > maxDifficulty) return false
      if (skills.length > 0 && !skills.every((s) => shot.attributes.skills.includes(s))) return false
      if (search.trim()) {
        const needle = search.trim().toLowerCase()
        const hay = `${shot.name} ${shot.description} ${shot.tags.join(' ')}`.toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })

    const scoreOf = (s: Shot) => stats.get(s.id)?.lastScore ?? -1
    const lastOf = (s: Shot) => stats.get(s.id)?.lastAt ?? 0

    return list.sort((a, b) => {
      switch (sort) {
        case 'level':
          // Innerhalb einer Stufe nach Schwierigkeit: so entsteht ein Weg
          // durch die Stufe, statt einer Liste nach Alphabet.
          return (
            levelRank(a) - levelRank(b) ||
            a.attributes.difficulty - b.attributes.difficulty ||
            a.name.localeCompare(b.name, 'de')
          )
        case 'difficulty':
          return a.attributes.difficulty - b.attributes.difficulty || a.name.localeCompare(b.name, 'de')
        case 'recent':
          return lastOf(b) - lastOf(a) || a.name.localeCompare(b.name, 'de')
        case 'weakest': {
          // Nie geuebte Stoesse ans Ende, damit zuerst die echten
          // Schwachstellen sichtbar werden.
          const sa = scoreOf(a)
          const sb = scoreOf(b)
          if (sa < 0 && sb < 0) return a.name.localeCompare(b.name, 'de')
          if (sa < 0) return 1
          if (sb < 0) return -1
          return sa - sb
        }
        default:
          return a.name.localeCompare(b.name, 'de')
      }
    })
  }, [shots, favoritesOnly, type, level, maxDifficulty, skills, search, sort, stats])

  const toggleSkill = (s: SkillTag) =>
    setSkills((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))

  const activeFilters =
    (favoritesOnly ? 1 : 0) +
    (type !== 'all' ? 1 : 0) +
    (level !== 'all' ? 1 : 0) +
    (maxDifficulty < 10 ? 1 : 0) +
    skills.length

  return (
    <div className="page page--wide stack">
      <div className="page__head">
        <div>
          <h1>Übungen</h1>
          <p className="page__sub">
            {shots ? `${filtered.length} von ${shots.length}` : 'Wird geladen …'}
          </p>
        </div>
        <div className="row">
          {/* Ein Knopf, der einen Bereich klappt, sagt Vorleseprogrammen
              ueber aria-expanded, ob er gerade offen ist. */}
          <button
            className="btn"
            aria-expanded={filtersOpen}
            onClick={() => setFiltersOpen((v) => !v)}
          >
            Filter{activeFilters > 0 ? ` (${activeFilters})` : ''}
          </button>
          <button className="btn btn--primary" onClick={() => navigate('/builder')}>
            Neue Übung
          </button>
        </div>
      </div>

      <div className="row">
        <input
          className="input"
          style={{ flex: '1 1 220px' }}
          placeholder="Suchen …"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="select" style={{ width: 180 }} value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
          <option value="name">Name</option>
          <option value="level">Stufe</option>
          <option value="difficulty">Schwierigkeit</option>
          <option value="recent">Zuletzt geübt</option>
          <option value="weakest">Schwächstes zuerst</option>
        </select>
      </div>

      {filtersOpen && (
        <div className="card stack">
          <div className="row">
            <button
              className={`chip${favoritesOnly ? ' is-on' : ''}`}
              onClick={() => setFavoritesOnly((v) => !v)}
            >
              ★ Favoriten
            </button>
            <select
              className="select"
              aria-label="Stoßart"
              style={{ width: 200 }}
              value={type}
              onChange={(e) => setType(e.target.value as ShotType | 'all')}
            >
              <option value="all">Alle Stoßarten</option>
              {SHOT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {SHOT_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
            <select
              className="select"
              aria-label="Stufe"
              style={{ width: 230 }}
              value={level}
              onChange={(e) => setLevel(e.target.value as LevelFilter)}
            >
              <option value="all">Alle Stufen</option>
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  Stufe {l} – {LEVEL_LABELS[l]}
                </option>
              ))}
              <option value="none">Ohne Stufe</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="lib-diff">Schwierigkeit bis {maxDifficulty}</label>
            <input
              id="lib-diff"
              className="slider"
              type="range"
              min={1}
              max={10}
              value={maxDifficulty}
              onChange={(e) => setMaxDifficulty(Number(e.target.value))}
            />
          </div>

          <div className="stack" style={{ gap: 6 }}>
            <span className="tiny">Fähigkeiten</span>
            <div className="row row--tight">
              {SKILL_TAGS.map((s) => (
                <button
                  key={s}
                  className={`chip${skills.includes(s) ? ' is-on' : ''}`}
                  onClick={() => toggleSkill(s)}
                >
                  {SKILL_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {activeFilters > 0 && (
            <div className="row">
              <button
                className="btn btn--sm btn--ghost"
                onClick={() => {
                  setSkills([])
                  setType('all')
                  setLevel('all')
                  setFavoritesOnly(false)
                  setMaxDifficulty(10)
                }}
              >
                Filter zurücksetzen
              </button>
            </div>
          )}
        </div>
      )}

      {shots && filtered.length === 0 ? (
        <EmptyState title="Keine Übung passt zu den Filtern">
          <span className="muted small">Filter lockern oder eine neue Übung bauen.</span>
        </EmptyState>
      ) : (
        <div className="grid">
          {filtered.map((shot) => {
            const st = stats.get(shot.id)
            return (
              <Link key={shot.id} to={`/shot/${shot.id}`} className="card stack" style={{ textDecoration: 'none', color: 'inherit', gap: 10 }}>
                <ShotDiagram
                  shot={shot}
                  clothColor={settings.clothColor}
                  railColor={settings.railColor}
                  showDiamonds={false}
                  showMarkings={false}
                />
                <div className="row" style={{ gap: 8 }}>
                  <strong style={{ flex: 1 }}>
                    {shot.favorite && <span style={{ color: 'var(--accent)' }}>★ </span>}
                    {shot.name}
                  </strong>
                  <DifficultyDots value={shot.attributes.difficulty} />
                </div>
                <div className="row small muted" style={{ gap: 8 }}>
                  <span>{SHOT_TYPE_LABELS[shot.attributes.shotType]}</span>
                  {/* Ohne die Stufe auf der Karte waere nicht zu sehen, wonach
                      die Sortierung "Stufe" ordnet. */}
                  {shot.level && (
                    <span title={LEVEL_LABELS[shot.level]}>· Stufe {shot.level}</span>
                  )}
                  <span className="spacer" />
                  {st?.lastScore != null ? (
                    <ProficiencyBadge value={proficiencyFor(st.lastScore, shot.scoring.thresholds)} />
                  ) : (
                    <span>noch nicht geübt</span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
