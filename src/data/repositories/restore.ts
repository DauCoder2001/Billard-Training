/**
 * Pruefen einer eingelesenen Sicherung.
 *
 * Eine Sicherungsdatei ist eine Behauptung wie jede andere fremde Datei: sie
 * kann aus einer aelteren Fassung stammen, von Hand bearbeitet oder schlicht
 * beschaedigt sein. Anders als ein geteilter Stoss, den man ansieht und wieder
 * verwirft, wird ihr Inhalt dauerhaft gespeichert - eine Zahl, die keine ist,
 * bringt danach bei jedem Start dieselbe Ansicht zu Fall, und es hilft nur
 * noch, die Website-Daten zu loeschen.
 *
 * Darum gilt hier dasselbe wie beim geteilten Stoss (sanitizeShot): jeder Wert
 * einzeln, Unbekanntes faellt weg, Fehlendes bekommt den Standardwert. Aus der
 * Datei kommen nur die Angaben, ohne die es keine Wiederherstellung waere -
 * die Ids, der Favorit und die Zeitstempel.
 *
 * Ein Eintrag ohne brauchbare Id wird weggelassen, nicht ersetzt: eine neu
 * erfundene Id passt zu keiner Einheit und zu keinem Workout mehr.
 */

import { PLAYER_COLORS } from './players'
import { DEFAULT_SETTINGS } from './settings'
import { TABLE } from '@/domain/geometry'
import {
  bool,
  color,
  fields,
  id,
  int,
  num,
  oneOf,
  str,
  timestamp,
} from '@/domain/sanitize'
import { MAX_POINTS } from '@/domain/scoring'
import { sanitizeShot, sanitizeThresholds } from '@/domain/share'
import {
  DEFAULT_MARKINGS,
  MAX_ATTEMPTS,
  MIN_ATTEMPTS,
  PROFICIENCY_LABELS,
  SESSION_FORMATS,
  SKILL_TAGS,
} from '@/domain/types'
import type {
  Attempt,
  Markings,
  Player,
  Proficiency,
  Session,
  Settings,
  Shot,
  Workout,
  WorkoutEntry,
} from '@/domain/types'

const MAX_NAME = 120
const MAX_DESCRIPTION = 2000
const MAX_ENTRIES = 100
const PROFICIENCIES = Object.keys(PROFICIENCY_LABELS) as Proficiency[]
const ORIENTATIONS = ['landscape', 'portrait'] as const

/** Stoesse: Aufbau wie beim geteilten Stoss, Id und Merkmale aus der Datei. */
export function restoreShots(raw: unknown[]): Shot[] {
  const jetzt = Date.now()
  return raw.flatMap((entry) => {
    const s = fields(entry)
    const eigene = id(s.id)
    if (!eigene) return []
    return [
      {
        ...sanitizeShot(entry),
        id: eigene,
        favorite: bool(s.favorite, false),
        builtIn: bool(s.builtIn, false),
        createdAt: timestamp(s.createdAt, jetzt),
        updatedAt: timestamp(s.updatedAt, jetzt),
      },
    ]
  })
}

export function restorePlayers(raw: unknown[]): Player[] {
  const jetzt = Date.now()
  return raw.flatMap((entry, i) => {
    const p = fields(entry)
    const eigene = id(p.id)
    if (!eigene) return []
    // Nur bekannte Faehigkeiten mit einer echten Zahl: ein erfundener Name
    // taucht in keiner Auswertung auf, ein Text ergaebe dort NaN.
    const gespeichert = fields(p.skillRatings)
    const skillRatings: Player['skillRatings'] = {}
    for (const skill of SKILL_TAGS) {
      const wert = gespeichert[skill]
      if (typeof wert === 'number' && Number.isFinite(wert)) {
        skillRatings[skill] = num(wert, 0, 100, 0)
      }
    }
    return [
      {
        id: eigene,
        name: str(p.name, MAX_NAME).trim() || `Spieler ${i + 1}`,
        color: color(p.color, PLAYER_COLORS[i % PLAYER_COLORS.length]),
        skillRatings,
        createdAt: timestamp(p.createdAt, jetzt),
      },
    ]
  })
}

function restoreAttempt(raw: unknown, index: number): Attempt {
  const a = fields(raw)
  const ende = fields(a.cueBallEnd)
  return {
    index: int(a.index, 0, MAX_ATTEMPTS, index),
    pocketed: bool(a.pocketed, false),
    scratch: bool(a.scratch, false),
    cueBallEnd:
      a.cueBallEnd === undefined || a.cueBallEnd === null
        ? null
        : {
            x: num(ende.x, 0, TABLE.length, TABLE.centerSpot.x),
            y: num(ende.y, 0, TABLE.width, TABLE.centerSpot.y),
          },
    // Vor 0.19.4 gab es das Feld nicht. Fehlt es, bleibt es weg: ein
    // `touched: false` wuerde einem alten Versuch unterstellen, der
    // Objektball sei verfehlt worden, und ihm die Punkte nehmen.
    ...(typeof a.touched === 'boolean' ? { touched: a.touched } : {}),
    points: num(a.points, 0, MAX_POINTS, 0),
  }
}

export function restoreSessions(raw: unknown[]): Session[] {
  const jetzt = Date.now()
  return raw.flatMap((entry) => {
    const s = fields(entry)
    const eigene = id(s.id)
    const shotId = id(s.shotId)
    const playerId = id(s.playerId)
    // Ohne Stoss oder Spieler gehoert die Einheit nirgendwohin: sie erschiene
    // in keiner Auswertung und bliebe nur als Rest in der Datenbank stehen.
    if (!eigene || !shotId || !playerId) return []

    const results = (Array.isArray(s.results) ? s.results.slice(0, MAX_ATTEMPTS) : []).map(
      restoreAttempt,
    )
    const session: Session = {
      id: eigene,
      shotId,
      playerId,
      format: oneOf(s.format, SESSION_FORMATS, 'custom'),
      attempts: int(
        s.attempts,
        MIN_ATTEMPTS,
        MAX_ATTEMPTS,
        Math.max(results.length, MIN_ATTEMPTS),
      ),
      results,
      score: num(s.score, 0, 100, 0),
      proficiency: oneOf(s.proficiency, PROFICIENCIES, 'beginning'),
      startedAt: timestamp(s.startedAt, jetzt),
      // Nicht abgeschlossen ist ein eigener Zustand und kein fehlender Wert.
      finishedAt:
        typeof s.finishedAt === 'number' && Number.isFinite(s.finishedAt)
          ? timestamp(s.finishedAt, jetzt)
          : null,
    }
    const workoutId = id(s.workoutId)
    if (workoutId) session.workoutId = workoutId
    return [session]
  })
}

export function restoreWorkouts(raw: unknown[]): Workout[] {
  const jetzt = Date.now()
  return raw.flatMap((entry) => {
    const w = fields(entry)
    const eigene = id(w.id)
    if (!eigene) return []
    const entries: WorkoutEntry[] = (
      Array.isArray(w.entries) ? w.entries.slice(0, MAX_ENTRIES) : []
    ).flatMap((e) => {
      const eintrag = fields(e)
      const shotId = id(eintrag.shotId)
      if (!shotId) return []
      return [{ shotId, attempts: int(eintrag.attempts, MIN_ATTEMPTS, MAX_ATTEMPTS, 10) }]
    })
    return [
      {
        id: eigene,
        name: str(w.name, MAX_NAME).trim() || 'Workout',
        description: str(w.description, MAX_DESCRIPTION),
        entries,
        createdAt: timestamp(w.createdAt, jetzt),
        updatedAt: timestamp(w.updatedAt, jetzt),
      },
    ]
  })
}

/** Die Markierungen einzeln pruefen: fehlt eine, gilt der Standard. */
export function sanitizeMarkings(raw: unknown): Markings {
  const m = fields(raw)
  const out = { ...DEFAULT_MARKINGS }
  for (const feld of Object.keys(out) as (keyof Markings)[]) {
    out[feld] = bool(m[feld], DEFAULT_MARKINGS[feld])
  }
  return out
}

/**
 * Einstellungen. Fehlendes bleibt beim Standard - die Einstellungen sind das
 * eine, was auch ohne Sicherung einen gueltigen Stand hat.
 */
export function restoreSettings(raw: unknown): Settings {
  const s = fields(raw)
  return {
    ...DEFAULT_SETTINGS,
    id: 'settings',
    activePlayerId: id(s.activePlayerId),
    clothColor: color(s.clothColor, DEFAULT_SETTINGS.clothColor),
    railColor: color(s.railColor, DEFAULT_SETTINGS.railColor),
    orientation: oneOf(s.orientation, ORIENTATIONS, DEFAULT_SETTINGS.orientation),
    snapToGrid: bool(s.snapToGrid, DEFAULT_SETTINGS.snapToGrid),
    // 0 heisst: kein Raster. Eine Zahl, die keine ist, ergaebe im Baukasten
    // Koordinaten von NaN und damit ein leeres Diagramm.
    snapStep: num(s.snapStep, 0, TABLE.width, DEFAULT_SETTINGS.snapStep),
    markings: sanitizeMarkings(s.markings),
    defaultThresholds: sanitizeThresholds(s.defaultThresholds),
    defaultTargetRadius: num(s.defaultTargetRadius, 2, 20, DEFAULT_SETTINGS.defaultTargetRadius),
    seededVersion: int(s.seededVersion, 0, 1_000_000, DEFAULT_SETTINGS.seededVersion),
    themeVersion: int(s.themeVersion, 0, 1_000_000, DEFAULT_SETTINGS.themeVersion),
  }
}
