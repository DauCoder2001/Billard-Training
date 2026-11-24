/** Stoesse als Link, QR-Code oder Datei weitergeben.
 *
 *  Der komplette Stoss steckt komprimiert im URL-Fragment. Damit funktioniert
 *  das Teilen ohne Server: wer den Link oeffnet, bekommt den Stoss zum
 *  Uebernehmen angeboten.
 *
 *  Eine fremde Nutzlast ist nur eine Behauptung: encodeShot hat sie
 *  geschrieben - oder eben nicht. Darum wird jeder Wert einzeln geprueft,
 *  bevor er ins Datenmodell darf (sanitizeShot), und die Groesse begrenzt,
 *  bevor ueberhaupt entpackt wird (decodeShot).
 */

import { deflateSync, inflateSync, strFromU8, strToU8 } from 'fflate'
import { TABLE, clampBall } from './geometry'
import { bool, fields, num, oneOf, str } from './sanitize'
import { orderedThresholds } from './scoring'
import { createShot, newId } from './shot'
import {
  BALL_KINDS,
  DEFAULT_THRESHOLDS,
  PATH_ROLES,
  POCKET_IDS,
  SCORING_MODES,
  SHOT_TYPES,
  SKILL_TAGS,
} from './types'
import type {
  Ball,
  BallPath,
  PathSegment,
  Point,
  PocketId,
  Shot,
  ShotAttributes,
  ShotScoring,
  ShotTarget,
  SkillTag,
  TargetZone,
  Thresholds,
} from './types'

export const SHARE_VERSION = 1

/** Grenzen fuer fremde Nutzlasten.
 *
 *  Ein geteilter Stoss mit zwei Dutzend Baellen und Wegen bleibt weit
 *  darunter - der Builder kommt auf wenige Kilobyte. Alles Groessere ist
 *  kaputt oder mutwillig, und beides darf weder Speicher fressen noch in
 *  die Datenbank gelangen.
 */
const MAX_PAYLOAD = 48 * 1024
const MAX_INFLATED = 256 * 1024
const MAX_BALLS = 24
const MAX_PATHS = 24
const MAX_SEGMENTS = 40
const MAX_TAGS = 20
const MAX_TAG = 40
const MAX_NAME = 120
const MAX_DESCRIPTION = 2000
const MAX_NOTES = 4000

interface Envelope {
  v: number
  shot: Omit<Shot, 'id' | 'createdAt' | 'updatedAt' | 'builtIn' | 'favorite'>
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(text: string): Uint8Array {
  const pad = text.length % 4 === 0 ? '' : '='.repeat(4 - (text.length % 4))
  const bin = atob(text.replace(/-/g, '+').replace(/_/g, '/') + pad)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

/** Komprimierte Nutzlast eines Stosses. */
export function encodeShot(shot: Shot): string {
  // seedStamp bleibt zu Hause: er sagt etwas ueber die mitgelieferte Vorlage
  // auf diesem Geraet, nicht ueber den geteilten Stoss.
  const {
    id: _id,
    createdAt: _c,
    updatedAt: _u,
    builtIn: _b,
    favorite: _f,
    seedStamp: _s,
    ...rest
  } = shot
  const envelope: Envelope = { v: SHARE_VERSION, shot: rest }
  return toBase64Url(deflateSync(strToU8(JSON.stringify(envelope)), { level: 9 }))
}

// ------------------------------------------------------------ Pruefhelfer --

// Die allgemeinen Helfer (fields, str, num, bool, oneOf) stehen in
// domain/sanitize.ts: die eingelesene Sicherung prueft mit denselben.

/** Punkt im Diagramm. Wege darf man bis auf die Bande zeichnen, deshalb ist
 *  der erlaubte Rahmen etwas groesser als die Spielflaeche. */
const PATH_MARGIN = 2 * TABLE.rail

function pathPoint(v: unknown, fallback: Point): Point {
  const p = fields(v)
  return {
    x: num(p.x, -PATH_MARGIN, TABLE.length + PATH_MARGIN, fallback.x),
    y: num(p.y, -PATH_MARGIN, TABLE.width + PATH_MARGIN, fallback.y),
  }
}

/** Ballmittelpunkt, immer vollstaendig auf der Spielflaeche. */
function ballPoint(v: unknown, fallback: Point): Point {
  const p = fields(v)
  return clampBall({
    x: num(p.x, 0, TABLE.length, fallback.x),
    y: num(p.y, 0, TABLE.width, fallback.y),
  })
}

function sanitizeBall(raw: unknown, index: number): Ball {
  const b = fields(raw)
  const kind = oneOf(b.kind, BALL_KINDS, 'object')
  // Neue Id: die alte stammt aus fremder Hand und landet in url(#...).
  const ball: Ball = { id: newId(), kind, ...ballPoint(b, TABLE.centerSpot) }
  if (kind === 'object' || kind === 'obstacle') {
    ball.number = Math.round(num(b.number, 1, 15, (index % 15) + 1))
  }
  if (kind === 'object') ball.order = Math.round(num(b.order, 1, MAX_BALLS, index + 1))
  if (bool(b.locked, false)) ball.locked = true
  return ball
}

/** Baelle samt Zuordnung alter auf neue Ids, fuer die Wege. */
function sanitizeBalls(raw: unknown): { balls: Ball[]; idMap: Map<string, string> } {
  const idMap = new Map<string, string>()
  const balls = (Array.isArray(raw) ? raw.slice(0, MAX_BALLS) : []).map((entry, i) => {
    const ball = sanitizeBall(entry, i)
    const old = fields(entry).id
    if (typeof old === 'string') idMap.set(old, ball.id)
    return ball
  })
  return { balls, idMap }
}

function sanitizeSegment(raw: unknown): PathSegment {
  const s = fields(raw)
  const to = pathPoint(s.to, TABLE.centerSpot)
  const segment: PathSegment = { to }
  if (s.curve !== undefined && s.curve !== null) segment.curve = pathPoint(s.curve, to)
  if (bool(s.rail, false)) segment.rail = true
  return segment
}

/** null, wenn der Weg nichts zeichnen koennte. */
function sanitizePath(raw: unknown, idMap: Map<string, string>): BallPath | null {
  const p = fields(raw)
  const segments = (Array.isArray(p.segments) ? p.segments.slice(0, MAX_SEGMENTS) : []).map(
    sanitizeSegment,
  )
  if (segments.length === 0) return null
  const ballId = typeof p.ballId === 'string' ? (idMap.get(p.ballId) ?? null) : null
  const from = p.from === undefined || p.from === null ? null : pathPoint(p.from, TABLE.headSpot)
  // Ohne Ball und ohne eigenen Startpunkt hat der Weg keinen Anfang.
  if (!ballId && !from) return null
  const path: BallPath = { id: newId(), ballId, role: oneOf(p.role, PATH_ROLES, 'cue'), segments }
  if (from) path.from = from
  return path
}

function sanitizeTarget(raw: unknown): ShotTarget {
  const t = fields(raw)
  const id = typeof t.pocketId === 'string' ? t.pocketId : null
  return {
    pocketId: (POCKET_IDS.find((p) => p === id) ?? null) as PocketId | null,
    cheat: num(t.cheat, -1, 1, 0),
  }
}

function sanitizeAttributes(raw: unknown, fallback: ShotAttributes): ShotAttributes {
  const a = fields(raw)
  const spin = fields(a.spin)
  const skills = (Array.isArray(a.skills) ? a.skills : []).filter(
    (s): s is string => typeof s === 'string',
  )
  return {
    shotType: oneOf(a.shotType, SHOT_TYPES, fallback.shotType),
    cutAngle: num(a.cutAngle, 0, 90, 0),
    spin: { x: num(spin.x, -1, 1, 0), y: num(spin.y, -1, 1, 0) },
    speed: num(a.speed, 1, 10, fallback.speed),
    difficulty: num(a.difficulty, 1, 10, fallback.difficulty),
    elevation: num(a.elevation, 0, 90, 0),
    // Entdoppeln und Erfundenes weglassen, aber die Reihenfolge des
    // Absenders behalten: sie steht so in den Marken des Stosses.
    skills: [...new Set(skills)].filter((s): s is SkillTag =>
      (SKILL_TAGS as readonly string[]).includes(s),
    ),
  }
}

/**
 * Schwellen einer Bewertung. Auch die Einstellungen bringen welche mit.
 *
 * Geordnet, weil eine fremde Datei sonst umgeht, was die Regler verhindern:
 * verdrehte Schwellen stufen ein halbes Ergebnis als "Meisterlich" ein.
 */
export function sanitizeThresholds(raw: unknown): Thresholds {
  const t = fields(raw)
  return orderedThresholds({
    developing: num(t.developing, 0, 100, DEFAULT_THRESHOLDS.developing),
    proficient: num(t.proficient, 0, 100, DEFAULT_THRESHOLDS.proficient),
    advanced: num(t.advanced, 0, 100, DEFAULT_THRESHOLDS.advanced),
    exemplary: num(t.exemplary, 0, 100, DEFAULT_THRESHOLDS.exemplary),
  })
}

function sanitizeScoring(raw: unknown, fallback: ShotScoring): ShotScoring {
  const s = fields(raw)
  const zone = fields(s.targetZone)
  const targetZone: TargetZone | null =
    s.targetZone === undefined || s.targetZone === null
      ? null
      : {
          ...ballPoint(zone, TABLE.footSpot),
          r: num(zone.r, 0.5, TABLE.width / 2, fallback.targetZone?.r ?? 6),
        }
  return {
    mode: oneOf(s.mode, SCORING_MODES, fallback.mode),
    targetZone,
    thresholds: sanitizeThresholds(s.thresholds),
    scratchRisk: bool(s.scratchRisk, false),
  }
}

/**
 * Prueft eine fremde Nutzlast Feld fuer Feld und baut daraus einen Stoss.
 *
 * Unbekanntes faellt weg, Fehlendes bekommt den Standardwert aus createShot.
 * Entscheidend ist das Pruefen in die Tiefe: ein flaches Zusammenlegen
 * ersetzt verschachtelte Objekte vollstaendig. Eine Nutzlast mit
 * "attributes": {} haette danach keine skills mehr, und die Oberflaeche
 * stuerzte beim Zeichnen ab, statt den Stoss anzuzeigen.
 */
export function sanitizeShot(raw: unknown): Shot {
  const base = createShot()
  const s = fields(raw)
  const { balls, idMap } = sanitizeBalls(s.balls)
  const paths = (Array.isArray(s.paths) ? s.paths.slice(0, MAX_PATHS) : [])
    .map((p) => sanitizePath(p, idMap))
    .filter((p): p is BallPath => p !== null)
  const tags = (Array.isArray(s.tags) ? s.tags.slice(0, MAX_TAGS) : [])
    .filter((t): t is string => typeof t === 'string')
    .map((t) => t.slice(0, MAX_TAG))

  return {
    ...base,
    name: str(s.name, MAX_NAME, base.name).trim() || base.name,
    description: str(s.description, MAX_DESCRIPTION),
    coachNotes: str(s.coachNotes, MAX_NOTES),
    tags,
    // Ein Stoss ohne Baelle liesse sich nicht ueben.
    balls: balls.length > 0 ? balls : base.balls,
    paths,
    target: sanitizeTarget(s.target),
    attributes: sanitizeAttributes(s.attributes, base.attributes),
    scoring: sanitizeScoring(s.scoring, base.scoring),
  }
}

/**
 * Gegenstueck zu encodeShot. Wirft bei kaputten, zu grossen oder zu neuen
 * Nutzlasten, damit der Aufrufer eine verstaendliche Meldung zeigen kann.
 */
export function decodeShot(payload: string): Shot {
  if (payload.length > MAX_PAYLOAD) throw new Error('Der geteilte Stoß ist zu groß.')

  let plain: Uint8Array
  try {
    // Fester Ausgabepuffer: Deflate schafft etwa 1:1000, eine kurze Nutzlast
    // koennte sich sonst auf Hunderte Megabyte aufblaehen und den Tab toeten.
    plain = inflateSync(fromBase64Url(payload), { out: new Uint8Array(MAX_INFLATED) })
  } catch {
    throw new Error('Der geteilte Stoß ließ sich nicht lesen.')
  }
  // fflate meldet einen zu kleinen Puffer nicht, es schneidet still ab. Die
  // volle Laenge heisst also: die Nutzlast reicht mindestens bis an die
  // Grenze. Ein echter Stoss bleibt um Groessenordnungen darunter.
  if (plain.length >= MAX_INFLATED) throw new Error('Der geteilte Stoß ist zu groß.')

  let envelope: Record<string, unknown>
  try {
    envelope = fields(JSON.parse(strFromU8(plain)))
  } catch {
    throw new Error('Der geteilte Stoß ließ sich nicht lesen.')
  }
  if (!envelope.shot) throw new Error('Der geteilte Stoß ließ sich nicht lesen.')
  if (typeof envelope.v === 'number' && envelope.v > SHARE_VERSION) {
    throw new Error('Dieser Stoß stammt aus einer neueren Version der App.')
  }

  const now = Date.now()
  return {
    ...sanitizeShot(envelope.shot),
    id: newId(),
    builtIn: false,
    favorite: false,
    createdAt: now,
    updatedAt: now,
  }
}

/** Vollstaendiger Link auf Basis der aktuellen Adresse. */
export function shareUrl(shot: Shot, origin?: string): string {
  const base =
    origin ??
    (typeof window !== 'undefined'
      ? window.location.href.split('#')[0]
      : 'https://localhost/')
  return `${base}#/import?d=${encodeShot(shot)}`
}

/**
 * Ein einzelner Stoss als Datei.
 *
 * Dieselbe Nutzlast wie im Link, nur in einer Huelle, an der die App die
 * Datei wiedererkennt: `app` wie bei einer Sicherung, `kind` zur
 * Unterscheidung von ihr. Ohne diese Huelle waere die Datei eine
 * Einbahnstrasse - geschrieben, aber von keinem der beiden Einlesewege
 * angenommen.
 */
export interface ShotFile {
  app: 'billard-training'
  kind: 'shot'
  v: number
  d: string
}

/** Inhalt der Datei, die "Als Datei" schreibt. */
export function shotFileText(shot: Shot): string {
  const file: ShotFile = {
    app: 'billard-training',
    kind: 'shot',
    v: SHARE_VERSION,
    d: encodeShot(shot),
  }
  return JSON.stringify(file, null, 2)
}

/**
 * Liest die Nutzlast aus einem Link, aus einer eingefuegten Zeichenkette oder
 * aus dem Inhalt einer Stossdatei.
 */
export function payloadFromInput(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  // Ganzer Dateiinhalt. Nur die eigene Huelle wird angenommen; was darin
  // steht, prueft danach wie immer decodeShot.
  if (trimmed.startsWith('{')) {
    try {
      const file = JSON.parse(trimmed) as Partial<ShotFile>
      if (file.app === 'billard-training' && file.kind === 'shot' && typeof file.d === 'string') {
        return payloadFromInput(file.d)
      }
    } catch {
      // Kein lesbares JSON - dann eben nicht.
    }
    return null
  }

  const match = trimmed.match(/[?&]d=([A-Za-z0-9_-]+)/)
  if (match) return match[1]
  return /^[A-Za-z0-9_-]+$/.test(trimmed) ? trimmed : null
}
