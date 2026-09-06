/** Stoesse als Link, QR-Code oder Datei weitergeben.
 *
 *  Der komplette Stoss steckt komprimiert im URL-Fragment. Damit funktioniert
 *  das Teilen ohne Server: wer den Link oeffnet, bekommt den Stoss zum
 *  Uebernehmen angeboten.
 */

import { deflateSync, inflateSync, strFromU8, strToU8 } from 'fflate'
import { createShot, newId } from './shot'
import type { Shot } from './types'

export const SHARE_VERSION = 1

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
  const { id: _id, createdAt: _c, updatedAt: _u, builtIn: _b, favorite: _f, ...rest } = shot
  const envelope: Envelope = { v: SHARE_VERSION, shot: rest }
  return toBase64Url(deflateSync(strToU8(JSON.stringify(envelope)), { level: 9 }))
}

/**
 * Gegenstueck zu encodeShot. Wirft bei kaputten oder zu neuen Nutzlasten,
 * damit der Aufrufer eine verstaendliche Meldung zeigen kann.
 */
export function decodeShot(payload: string): Shot {
  let envelope: Envelope
  try {
    envelope = JSON.parse(strFromU8(inflateSync(fromBase64Url(payload)))) as Envelope
  } catch {
    throw new Error('Der geteilte Stoss liess sich nicht lesen.')
  }
  if (!envelope || typeof envelope !== 'object' || !envelope.shot) {
    throw new Error('Der geteilte Stoss liess sich nicht lesen.')
  }
  if (envelope.v > SHARE_VERSION) {
    throw new Error('Dieser Stoss stammt aus einer neueren Version der App.')
  }
  const now = Date.now()
  // Ueber createShot laufen lassen, damit fehlende Felder Standardwerte bekommen.
  return {
    ...createShot(),
    ...envelope.shot,
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

/** Liest die Nutzlast aus einem Link oder aus einer eingefuegten Zeichenkette. */
export function payloadFromInput(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  const match = trimmed.match(/[?&]d=([A-Za-z0-9_-]+)/)
  if (match) return match[1]
  return /^[A-Za-z0-9_-]+$/.test(trimmed) ? trimmed : null
}
