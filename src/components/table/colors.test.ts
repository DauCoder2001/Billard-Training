import { describe, expect, it } from 'vitest'
import { contrastInk, parseHex, relativeLuminance, shade } from './colors'

describe('Farben lesen', () => {
  it('liest die lange und die kurze Schreibweise', () => {
    expect(parseHex('#3f92d2')).toEqual([63, 146, 210])
    expect(parseHex('#abc')).toEqual([170, 187, 204])
    expect(parseHex('3f92d2')).toEqual([63, 146, 210])
  })

  it('liest acht Stellen und verwirft den Alphawert', () => {
    // So etwas kommt aus einer von Hand bearbeiteten Sicherung: die Pruefung
    // dort laesst #rrggbbaa durch, weil es gueltiges CSS ist.
    expect(parseHex('#3f92d2ff')).toEqual([63, 146, 210])
    expect(parseHex('#3f92d200')).toEqual([63, 146, 210])
    expect(relativeLuminance('#ffffffff')).toBeCloseTo(1, 5)
    expect(shade('#808080ff', -0.5)).toBe('#404040')
  })

  it('meldet unlesbare Eingaben', () => {
    expect(parseHex('blau')).toBeNull()
    expect(parseHex('#12345')).toBeNull()
    expect(parseHex('#1234567')).toBeNull()
    expect(parseHex('#123456789')).toBeNull()
    expect(parseHex('')).toBeNull()
  })
})

describe('Aufhellen und Abdunkeln', () => {
  it('dunkelt bei negativem Wert ab', () => {
    expect(shade('#808080', -0.5)).toBe('#404040')
  })

  it('hellt bei positivem Wert auf', () => {
    expect(shade('#000000', 0.5)).toBe('#808080')
  })

  it('laesst die Farbe bei 0 unveraendert', () => {
    expect(shade('#3f92d2', 0)).toBe('#3f92d2')
  })

  it('bleibt in den Grenzen 0 bis 255', () => {
    expect(shade('#ffffff', 1)).toBe('#ffffff')
    expect(shade('#000000', -1)).toBe('#000000')
    expect(shade('#3f92d2', 5)).toBe('#ffffff')
    expect(shade('#3f92d2', -5)).toBe('#000000')
  })

  it('gibt eine unlesbare Farbe unveraendert zurueck', () => {
    expect(shade('blau', -0.3)).toBe('blau')
  })
})

describe('Lesbarkeit', () => {
  it('ordnet Helligkeiten richtig ein', () => {
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 5)
    expect(relativeLuminance('#000000')).toBeCloseTo(0, 5)
    expect(relativeLuminance('#e7eaee')).toBeGreaterThan(relativeLuminance('#5b3a22'))
  })

  it('waehlt auf hellem Grund die dunkle und auf dunklem die helle Farbe', () => {
    expect(contrastInk('#e7eaee', 'dunkel', 'hell')).toBe('dunkel')
    expect(contrastInk('#5b3a22', 'dunkel', 'hell')).toBe('hell')
    expect(contrastInk('#000000', 'dunkel', 'hell')).toBe('hell')
    expect(contrastInk('#ffffff', 'dunkel', 'hell')).toBe('dunkel')
  })
})
