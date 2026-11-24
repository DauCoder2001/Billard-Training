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
}

// Eine Schriftfarbe steht hier nicht mehr: seit Befund 38 sitzt die Nummer
// auf einer weissen Scheibe und bringt ihre Farbe selbst mit.
export function ballStyle(number?: number): BallStyle {
  if (!number || number < 1 || number > 15) {
    return { fill: '#f4f1e8', striped: false }
  }
  return { fill: BASE[(number - 1) % 8], striped: number > 8 }
}

export const CUE_FILL = '#f7f4ea'
export const GHOST_STROKE = '#dfe8e3'
