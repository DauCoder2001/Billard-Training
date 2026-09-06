/** Kleine wiederkehrende Anzeigebausteine. */

import type { ReactNode } from 'react'
import { PROFICIENCY_LABELS, SKILL_LABELS } from '@/domain/types'
import type { Proficiency, SkillTag } from '@/domain/types'

export function ProficiencyBadge({ value }: { value: Proficiency }) {
  return <span className={`prof prof--${value}`}>{PROFICIENCY_LABELS[value]}</span>
}

export function Bar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div className="bar">
      <div className="bar__fill" style={{ width: `${pct}%` }} />
    </div>
  )
}

export function SkillChips({ skills }: { skills: SkillTag[] }) {
  if (skills.length === 0) return null
  return (
    <div className="row row--tight">
      {skills.map((s) => (
        <span key={s} className="chip chip--static">
          {SKILL_LABELS[s]}
        </span>
      ))}
    </div>
  )
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="card card--flat">
      <div className="tiny">{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{value}</div>
      {hint && <div className="small muted">{hint}</div>}
    </div>
  )
}

export function DifficultyDots({ value }: { value: number }) {
  return (
    <span className="small muted" title={`Schwierigkeit ${value} von 10`}>
      {'▮'.repeat(Math.round(value / 2))}
      {'▯'.repeat(5 - Math.round(value / 2))}
    </span>
  )
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="empty stack" style={{ alignItems: 'center' }}>
      <strong>{title}</strong>
      {children}
    </div>
  )
}
