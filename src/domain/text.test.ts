import { describe, expect, it } from 'vitest'
import { plural, transliterate } from './text'
import { seedShots } from '@/data/seed/drills'

/** Namen der mitgelieferten Stoesse, wie sie vor der Umstellung gespeichert
 *  wurden. Die Migration erkennt daran, dass ein Text noch der alte ist. */
const ALTE_NAMEN = [
  'Rueckzieher kurz',
  'Rueckzieher lang',
  'Duenner Schnitt 60 Grad',
  'Sehr duenner Schnitt 75 Grad',
  'Bandenball ueber die Langbande',
  'Bandenball ueber die Kurzbande',
  'Kick ueber eine Bande',
  'Kombination aus zwei Baellen',
  'Cluster oeffnen',
]

describe('transliterate', () => {
  it('schreibt Umlaute und scharfes s um', () => {
    expect(transliterate('Stöße')).toBe('Stoesse')
    expect(transliterate('Rückzieher')).toBe('Rueckzieher')
    expect(transliterate('Dünner Schnitt')).toBe('Duenner Schnitt')
    expect(transliterate('Cluster öffnen')).toBe('Cluster oeffnen')
    expect(transliterate('Über die Bande')).toBe('Ueber die Bande')
  })

  it('laesst Text ohne Umlaute unveraendert', () => {
    expect(transliterate('Lange Gerade')).toBe('Lange Gerade')
    expect(transliterate('Stop-Shot kurz')).toBe('Stop-Shot kurz')
  })

  it('trifft jeden alten Namen der mitgelieferten Stoesse', () => {
    const neue = seedShots().map((s) => s.name)
    for (const alt of ALTE_NAMEN) {
      expect(neue.map(transliterate)).toContain(alt)
    }
  })

  it('ist auf den neuen Namen unveraendert wiederholbar', () => {
    // Nach dem ersten Lauf darf die Migration nichts mehr anfassen: kein
    // neuer Name darf gleich seiner eigenen Umschreibung sein und dabei
    // Umlaute enthalten.
    for (const name of seedShots().map((s) => s.name)) {
      if (/[ÄÖÜäöüß]/.test(name)) expect(transliterate(name)).not.toBe(name)
    }
  })
})

describe('plural', () => {
  it('nimmt bei genau eins die Einzahl', () => {
    expect(plural(1, 'Versuch', 'Versuche')).toBe('1 Versuch')
    expect(plural(1, 'Übung', 'Übungen')).toBe('1 Übung')
  })

  it('nimmt sonst die Mehrzahl, auch bei null', () => {
    expect(plural(0, 'Versuch', 'Versuche')).toBe('0 Versuche')
    expect(plural(2, 'Versuch', 'Versuche')).toBe('2 Versuche')
    expect(plural(17, 'Einheit', 'Einheiten')).toBe('17 Einheiten')
  })

  it('traegt ganze Satzteile, nicht nur Hauptwoerter', () => {
    // So stehen die Abbruchmeldungen im Training: das Zeitwort wechselt mit.
    expect(plural(1, 'erfasster Versuch wird', 'erfasste Versuche werden')).toBe(
      '1 erfasster Versuch wird',
    )
    expect(plural(3, 'erfasster Versuch wird', 'erfasste Versuche werden')).toBe(
      '3 erfasste Versuche werden',
    )
  })
})
