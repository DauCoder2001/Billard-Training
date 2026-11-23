/** Pruefhelfer fuer fremde Werte.
 *
 *  Alles, was von aussen kommt - ein geteilter Stoss in einem Link, eine
 *  eingelesene Sicherungsdatei -, ist eine Behauptung und noch kein Datensatz.
 *  Diese Helfer machen daraus einen: der erwartete Typ, in seinen Grenzen,
 *  sonst der Rueckfallwert. Keiner von ihnen wirft; wer abbrechen will,
 *  entscheidet das selbst.
 */

import { clamp } from './geometry'

/** Felder eines fremden Wertes, ohne Annahme darueber, was darin steht. */
export function fields(v: unknown): Record<string, unknown> {
  return v !== null && typeof v === 'object' ? (v as Record<string, unknown>) : {}
}

export function str(v: unknown, max: number, fallback = ''): string {
  return typeof v === 'string' ? v.slice(0, max) : fallback
}

export function num(v: unknown, min: number, max: number, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? clamp(v, min, max) : fallback
}

/** Wie num, nur ganzzahlig. */
export function int(v: unknown, min: number, max: number, fallback: number): number {
  return Math.round(num(v, min, max, fallback))
}

export function bool(v: unknown, fallback: boolean): boolean {
  return typeof v === 'boolean' ? v : fallback
}

/** Einer der erlaubten Werte, sonst der Rueckfallwert. */
export function oneOf<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  return typeof v === 'string' && (allowed as readonly string[]).includes(v) ? (v as T) : fallback
}

/**
 * Eine Id, die der Datensatz selbst mitbringt - oder null.
 *
 * Ohne Id laesst sich ein Datensatz weder speichern noch zuordnen. Ein
 * Eintrag ohne sie gehoert nicht in die Datenbank, sondern weggelassen.
 */
export function id(v: unknown): string | null {
  return typeof v === 'string' && v.length > 0 && v.length <= 200 ? v : null
}

/** Zeitstempel in Millisekunden. */
export function timestamp(v: unknown, fallback: number): number {
  return num(v, 0, Number.MAX_SAFE_INTEGER, fallback)
}

/**
 * Eine Farbe als #rgb, #rrggbb oder #rrggbbaa.
 *
 * Die Farben aus der Sicherung landen in Stilangaben der Oberflaeche. Ein
 * beliebiger Text hat dort nichts zu suchen.
 */
export function color(v: unknown, fallback: string): string {
  return typeof v === 'string' && /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(v)
    ? v
    : fallback
}
