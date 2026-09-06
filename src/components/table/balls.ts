/** Farben der Poolbaelle. 1-8 voll, 9-15 halb. */

const BASE = [
  '#f2c230', // 1 gelb
  '#2d5fa8', // 2 blau
  '#c8352b', // 3 rot
  '#6b3fa0', // 4 lila
  '#e07a28', // 5 orange
  '#1f7a44', // 6 gruen
  '#7b2d26', // 7 weinrot
  '#191a1c', // 8 schwarz
]

export interface BallStyle {
  fill: string
  striped: boolean
  /** Farbe der Beschriftung. */
  ink: string
}

export function ballStyle(number?: number): BallStyle {
  if (!number || number < 1 || number > 15) {
    return { fill: '#f4f1e8', striped: false, ink: '#20241f' }
  }
  const base = BASE[(number - 1) % 8]
  const striped = number > 8
  return {
    fill: base,
    striped,
    ink: striped || number === 1 ? '#20241f' : '#f6f3ea',
  }
}

export const CUE_FILL = '#f7f4ea'
export const GHOST_STROKE = '#dfe8e3'
