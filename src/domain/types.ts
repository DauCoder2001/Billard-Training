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

export const BALL_KINDS = ['cue', 'object', 'obstacle', 'ghost'] as const

export type BallKind = (typeof BALL_KINDS)[number]

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

export const POCKET_IDS = ['tl', 'tm', 'tr', 'bl', 'bm', 'br'] as const

export type PocketId = (typeof POCKET_IDS)[number]

export interface ShotTarget {
  pocketId: PocketId | null
  /** -1..1 verschiebt den Zielpunkt innerhalb der Taschenmuendung. */
  cheat: number
}

// ---------------------------------------------------------------- Pfade ----

export const PATH_ROLES = ['cue', 'object', 'secondary'] as const

export type PathRole = (typeof PATH_ROLES)[number]

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
  draw: 'Rückzieher',
  sidespin: 'Seiteneffet',
  cut: 'Schnittball',
  thinCut: 'Dünner Schnitt',
  bank: 'Bandenspiel',
  kick: 'Kick',
  combination: 'Kombination',
  carom: 'Karambolage',
  rail: 'Ball an der Bande',
  breakout: 'Cluster öffnen',
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
  break: 'Anstoß',
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

export const SCORING_MODES = ['pocket', 'position', 'pocket+position'] as const

export type ScoringMode = (typeof SCORING_MODES)[number]

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
  /**
   * Stand der mitgelieferten Vorlage, von dem diese Fassung abstammt.
   * Siehe domain/seedStamp.ts. Fehlt bei eigenen und geteilten Stoessen.
   */
  seedStamp?: string
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
  // Erfolge stehen hier bewusst nicht: sie werden aus der Historie gerechnet
  // (domain/achievements.ts) und sind damit auch nach einem Import richtig.
  createdAt: number
}

// -------------------------------------------------------------- Sessions ---

export const SESSION_FORMATS = ['quick', 'standard', 'deep', 'custom'] as const

export type SessionFormat = (typeof SESSION_FORMATS)[number]

export const SESSION_ATTEMPTS: Record<Exclude<SessionFormat, 'custom'>, number> = {
  quick: 10,
  standard: 20,
  deep: 30,
}

/**
 * Grenzen fuer die Anzahl geplanter Versuche einer Einheit. Weniger als einer
 * ist keine Einheit, mehr als zweihundert steht niemand am Tisch durch - und
 * die Zahl bestimmt die Laenge einer Liste in der Anzeige.
 */
export const MIN_ATTEMPTS = 1
export const MAX_ATTEMPTS = 200

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

/**
 * Was auf dem Tuch zu sehen ist. Gilt dort, wo der Tisch die Arbeitsflaeche
 * ist - im Baukasten und beim Training. Die Vorschaubilder der Sammlung und
 * die festen Diagramme behalten ihr eigenes, ruhiges Bild.
 */
export interface Markings {
  /** Die Punkte auf der Bande. */
  diamonds: boolean
  /** Die Kopflinie. */
  headString: boolean
  /** Kopf- und Fusspunkt. */
  spots: boolean
  /** Linien von Diamant zu Diamant. */
  guides: boolean
  /** Das Feld, in dem der Weisse beim Anstoss liegen darf. */
  breakBox: boolean
  /** Der Umriss des Dreiecks am Fusspunkt. */
  rackOutline: boolean
  /** Das feine Punkteraster. Nur der Baukasten zeichnet es. */
  grid: boolean
}

/**
 * Ein echter Tisch und die Linien dazu. Anstossfeld, Dreieck und Raster sind
 * Hilfen zum Bauen und bleiben aus, bis jemand sie holt.
 */
export const DEFAULT_MARKINGS: Markings = {
  diamonds: true,
  headString: true,
  spots: true,
  guides: true,
  breakBox: false,
  rackOutline: false,
  grid: false,
}

export interface Settings {
  id: 'settings'
  activePlayerId: string | null
  clothColor: string
  railColor: string
  /** 'landscape' = Laengsachse waagerecht. */
  orientation: 'landscape' | 'portrait'
  snapToGrid: boolean
  snapStep: number
  /** Was auf dem Tuch zu sehen ist. */
  markings: Markings
  defaultThresholds: Thresholds
  defaultTargetRadius: number
  /** Version der zuletzt eingespielten Uebungssammlung. */
  seededVersion: number
  /** Version des zuletzt angewandten Farbschemas. */
  themeVersion: number
}
