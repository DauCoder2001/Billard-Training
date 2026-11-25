/**
 * Nachgeladene Teile ueber eine Aktualisierung hinweg (Befund 71).
 *
 * Geprueft wird das Netz darunter, nicht das Nachladen selbst: ein
 * fehlendes Buendel fuehrt zu genau einem Neuladen, ein zweiter Fehlschlag
 * faellt durch - sonst drehte sich die Seite im Kreis, wenn wirklich das
 * Netz fehlt.
 *
 * Datei mit .tsx, damit sie im Profil "oberflaeche" laeuft: nur dort gibt
 * es einen Sitzungsspeicher.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nachladen } from './lazyChunk'

beforeEach(() => {
  sessionStorage.clear()
})

describe('Nachladen eines Programmteils', () => {
  it('reicht das Ergebnis durch, wenn es klappt', async () => {
    const neuLaden = vi.fn()

    await expect(nachladen(() => Promise.resolve('fertig'), neuLaden)).resolves.toBe('fertig')
    expect(neuLaden).not.toHaveBeenCalled()
  })

  it('laedt die Seite einmal neu, wenn das Buendel fehlt', async () => {
    const neuLaden = vi.fn()

    // Das Versprechen bleibt mit Absicht offen - die Ladeanzeige soll stehen
    // bleiben, bis die Seite neu kommt. Also nicht darauf warten.
    void nachladen(() => Promise.reject(new Error('Failed to fetch')), neuLaden)
    await Promise.resolve()
    await Promise.resolve()

    expect(neuLaden).toHaveBeenCalledTimes(1)
    expect(sessionStorage.getItem('billard.neu-geladen')).toBe('1')
  })

  it('laesst den zweiten Fehlschlag durch, statt sich im Kreis zu drehen', async () => {
    sessionStorage.setItem('billard.neu-geladen', '1')
    const neuLaden = vi.fn()

    await expect(
      nachladen(() => Promise.reject(new Error('Failed to fetch')), neuLaden),
    ).rejects.toThrow('Failed to fetch')
    expect(neuLaden).not.toHaveBeenCalled()
  })

  it('vergisst die Marke nach einem gelungenen Nachladen', async () => {
    sessionStorage.setItem('billard.neu-geladen', '1')

    await nachladen(() => Promise.resolve('fertig'), vi.fn())

    // Sonst bliebe die naechste Aktualisierung in derselben Sitzung ungerettet.
    expect(sessionStorage.getItem('billard.neu-geladen')).toBeNull()
  })
})
