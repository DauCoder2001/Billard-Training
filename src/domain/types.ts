/** Gemeinsame Typen der Anwendung.
 *
 *  Koordinatensystem: Alle Positionen sind Zoll auf der Spielflaeche,
 *  x = 0..100 (Kopfbande links, Fussbande rechts), y = 0..50 (unten..oben).
 *  Siehe geometry.ts fuer die Masse.
 */

export interface Point {
  x: number
  y: number
}

// ---------------------------------------------------------------- Baelle ---

export type BallKind = 'cue' | 'object' | 'obstacle' | 'ghost'

export interface Ball {
  id: string
  kind: BallKind
  /** 1..15 bei Objekt-/Stoerbaellen, sonst undefined. */
  number?: number
  x: number
  y: number
  /** Gesperrte Baelle lassen sich im Builder nicht verschieben. */
  locked?: boolean
  /** Reihenfolge bei Kombinationen: 1 = zuerst getroffen. */
  order?: number
}

// --------------------------------------------------------------- Taschen ---

export type PocketId = 'tl' | 'tm' | 'tr' | 'bl' | 'bm' | 'br'

export interface ShotTarget {
  pocketId: PocketId | null
  /** -1..1 verschiebt den Zielpunkt innerhalb der Taschenmuendung. */
  cheat: number
}

// ---------------------------------------------------------------- Pfade ----

export type PathRole = 'cue' | 'object' | 'secondary'

export interface PathSegment {
  /** Endpunkt des Segments. Der Startpunkt ist der Ball bzw. das Vorgaengersegment. */
  to: Point
  /** Optionaler Griff fuer eine quadratische Bezierkurve. */
  curve?: Point
  /** Markiert Segmente, die aus einer Bandenreflexion entstanden sind. */
  rail?: boolean
}

export interface BallPath {
  id: string
  /** Ball, an dem der Pfad beginnt. Leer bei freien Pfaden. */
  ballId: string | null
  role: PathRole
  /** Startpunkt, falls kein Ball referenziert wird. */
  from?: Point
  segments: PathSegment[]
}

// ------------------------------------------------------------- Attribute ---

export const SKILL_TAGS = [
  'stun',
  'follow',
  'draw',
  'sidespin',
  'cut',
  'thinCut',
  'bank',
  'kick',
  'combination',
  'carom',
  'rail',
  'breakout',
  'safety',
  'position',
] as const

export type SkillTag = (typeof SKILL_TAGS)[number]

export const SKILL_LABELS: Record<SkillTag, string> = {
  stun: 'Stun',
  follow: 'Nachlauf',
  draw: 'Rueckzieher',
  sidespin: 'Seiteneffet',
  cut: 'Schnittball',
  thinCut: 'Duenner Schnitt',
  bank: 'Bande',
  kick: 'Kick',
  combination: 'Kombination',
  carom: 'Karambolage',
  rail: 'Bandenball',
  breakout: 'Cluster oeffnen',
  safety: 'Safe',
  position: 'Position',
}

export const SHOT_TYPES = [
  'cut',
  'bank',
  'kick',
  'combination',
  'carom',
  'safety',
  'break',
  'position',
] as const

export type ShotType = (typeof SHOT_TYPES)[number]

export const SHOT_TYPE_LABELS: Record<ShotType, string> = {
  cut: 'Schnittball',
  bank: 'Bandenball',
  kick: 'Kick',
  combination: 'Kombination',
  carom: 'Karambolage',
  safety: 'Safe',
  break: 'Anstoss',
  position: 'Positionsspiel',
}

export interface ShotAttributes {
  shotType: ShotType
  /** Schnittwinkel in Grad, 0 = voll. Wird beim Speichern automatisch berechnet. */
  cutAngle: number
  /** Treffpunkt der Pomeranze auf dem Weissen, -1..1 je Achse. */
  spin: Point
  /** 1..10 */
  speed: number
  /** 1..10 */
  difficulty: number
  /** Queue-Erhoehung in Grad, 0 = flach. */
  elevation: number
  skills: SkillTag[]
}

// -------------------------------------------------------------- Bewertung --

export type ScoringMode = 'pocket' | 'position' | 'pocket+position'

export interface TargetZone {
  x: number
  y: number
  /** Radius des inneren Rings in Zoll. */
  r: number
}

export interface Thresholds {
  developing: number
  proficient: number
  advanced: number
  exemplary: number
}

export const DEFAULT_THRESHOLDS: Thresholds = {
  developing: 40,
  proficient: 60,
  advanced: 80,
  exemplary: 90,
}

export type Proficiency =
  | 'beginning'
  | 'developing'
  | 'proficient'
  | 'advanced'
  | 'exemplary'

export const PROFICIENCY_LABELS: Record<Proficiency, string> = {
  beginning: 'Anfang',
  developing: 'Im Aufbau',
  proficient: 'Sicher',
  advanced: 'Fortgeschritten',
  exemplary: 'Meisterlich',
}

export interface ShotScoring {
  mode: ScoringMode
  targetZone: TargetZone | null
  thresholds: Thresholds
  /** Markiert Stoesse mit erhoehtem Kratzerrisiko. */
  scratchRisk?: boolean
}

// ---------------------------------------------------------------- Stoss ----

export interface Shot {
  id: string
  name: string
  description: string
  balls: Ball[]
  target: ShotTarget
  paths: BallPath[]
  attributes: ShotAttributes
  scoring: ShotScoring
  coachNotes: string
  tags: string[]
  favorite: boolean
  /** true bei den mitgelieferten Uebungen. */
  builtIn?: boolean
  createdAt: number
  updatedAt: number
}

// --------------------------------------------------------------- Spieler ---

export interface Player {
  id: string
  name: string
  color: string
  /** 0..100 je Skill, undefined = noch nie geuebt. */
  skillRatings: Partial<Record<SkillTag, number>>
  achievements: string[]
  createdAt: number
}

// -------------------------------------------------------------- Sessions ---

export type SessionFormat = 'quick' | 'standard' | 'deep' | 'custom'

export const SESSION_ATTEMPTS: Record<Exclude<SessionFormat, 'custom'>, number> = {
  quick: 10,
  standard: 20,
  deep: 30,
}

export interface Attempt {
  index: number
  pocketed: boolean
  scratch: boolean
  /** Ruheposition des Weissen, falls erfasst. */
  cueBallEnd: Point | null
  points: number
}

export interface Session {
  id: string
  shotId: string
  playerId: string
  format: SessionFormat
  /** Geplante Anzahl Versuche. */
  attempts: number
  results: Attempt[]
  /** 0..100, erst nach Abschluss gesetzt. */
  score: number
  proficiency: Proficiency
  /** Zugehoeriges Workout, falls die Session Teil einer Kette ist. */
  workoutId?: string
  startedAt: number
  finishedAt: number | null
}

// -------------------------------------------------------------- Workouts ---

export interface WorkoutEntry {
  shotId: string
  attempts: number
}

export interface Workout {
  id: string
  name: string
  description: string
  entries: WorkoutEntry[]
  createdAt: number
  updatedAt: number
}

// ------------------------------------------------------------ Einstellung --

export interface Settings {
  id: 'settings'
  activePlayerId: string | null
  clothColor: string
  railColor: string
  /** 'landscape' = Laengsachse waagerecht. */
  orientation: 'landscape' | 'portrait'
  snapToGrid: boolean
  snapStep: number
  defaultThresholds: Thresholds
  defaultTargetRadius: number
  /** Version der zuletzt eingespielten Uebungssammlung. */
  seededVersion: number
}
