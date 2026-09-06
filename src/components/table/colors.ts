/** Farbableitungen fuer das Tischdiagramm.
 *
 *  Bandenkante, Kopflinie und die Markierungen entstehen nicht als feste
 *  Werte, sondern aus der gewaehlten Tuchfarbe. So bleibt das Bild stimmig,
 *  egal welche Farbe eingestellt ist.
 */

type Rgb = [number, number, number]

/** Liest #abc und #aabbcc. Alles andere ergibt null. */
export function parseHex(hex: string): Rgb | null {
  const value = hex.trim().replace(/^#/, '')
  if (/^[0-9a-fA-F]{3}$/.test(value)) {
    return [
      parseInt(value[0] + value[0], 16),
      parseInt(value[1] + value[1], 16),
      parseInt(value[2] + value[2], 16),
    ]
  }
  if (/^[0-9a-fA-F]{6}$/.test(value)) {
    return [
      parseInt(value.slice(0, 2), 16),
      parseInt(value.slice(2, 4), 16),
      parseInt(value.slice(4, 6), 16),
    ]
  }
  return null
}

function toHex(rgb: Rgb): string {
  return '#' + rgb.map((c) => Math.round(clamp255(c)).toString(16).padStart(2, '0')).join('')
}

function clamp255(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : v
}

/**
 * Hellt auf (amount > 0) oder dunkelt ab (amount < 0), jeweils -1 bis 1.
 * Eine unlesbare Eingabe kommt unveraendert zurueck, damit ein Tippfehler in
 * den Einstellungen nicht das ganze Diagramm zerlegt.
 */
export function shade(hex: string, amount: number): string {
  const rgb = parseHex(hex)
  if (!rgb) return hex
  const a = Math.max(-1, Math.min(1, amount))
  const next = rgb.map((c) => (a < 0 ? c * (1 + a) : c + (255 - c) * a)) as Rgb
  return toHex(next)
}

/** Relative Helligkeit nach WCAG, 0 (schwarz) bis 1 (weiss). */
export function relativeLuminance(hex: string): number {
  const rgb = parseHex(hex)
  if (!rgb) return 0
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * Waehlt zu einem Untergrund die besser lesbare von zwei Farben. Ohne das
 * verschwinden die Diamanten auf einem dunklen Rahmen.
 */
export function contrastInk(background: string, dark: string, light: string): string {
  return relativeLuminance(background) > 0.4 ? dark : light
}
