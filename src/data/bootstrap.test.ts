/**
 * Die Regel, nach der eine Aktualisierung der Uebungssammlung schreibt.
 *
 * Geprueft wird ohne Datenbank, weil die Regel eine reine Entscheidung ueber
 * Vorlage und Bestand ist. Sie entscheidet ueber eigene Arbeit: hier faellt,
 * ob ein geloeschter Stoss wiederkommt und ob eine selbst geaenderte Fassung
 * einer mitgelieferten Uebung stehen bleibt.
 */

import { describe, expect, it } from 'vitest'
import { seedUpdates } from './bootstrap'
import { createShot } from '@/domain/shot'
import type { Shot } from '@/domain/types'

/** Ein Stoss der Vorlage: feste Id, als mitgeliefert markiert. */
function vorlage(id: string, name: string): Shot {
  return { ...createShot({ id, name }), builtIn: true, favorite: false }
}

const sammlung = [vorlage('a', 'Gerader Stoß'), vorlage('b', 'Bandenball')]

describe('seedUpdates', () => {
  it('schreibt beim ersten Lauf die ganze Sammlung', () => {
    const updates = seedUpdates(sammlung, [undefined, undefined], true)
    expect(updates.map((s) => s.id)).toEqual(['a', 'b'])
    expect(updates.every((s) => s.favorite === false)).toBe(true)
  })

  it('laesst einen geloeschten Stoss geloescht', () => {
    // Fehlt im Bestand heisst: der Nutzer hat ihn entfernt. Vorher schrieb
    // bulkPut die ganze Sammlung zurueck und holte ihn wieder.
    const updates = seedUpdates(sammlung, [undefined, { ...sammlung[1] }], false)
    expect(updates.map((s) => s.id)).toEqual(['b'])
  })

  it('laesst eine uebernommene Fassung unberuehrt', () => {
    // builtIn === false setzt der Baukasten beim Speichern: ab da ist es der
    // Stoss des Nutzers.
    const eigen: Shot = {
      ...sammlung[0],
      name: 'Mein eigener Name',
      coachNotes: 'Meine Notiz',
      builtIn: false,
    }
    const updates = seedUpdates(sammlung, [eigen, { ...sammlung[1] }], false)
    expect(updates.map((s) => s.id)).toEqual(['b'])
  })

  it('ersetzt einen unberuehrten mitgelieferten Stoss und behaelt den Favoriten', () => {
    const alt: Shot = { ...sammlung[0], name: 'Alter Name', favorite: true }
    const [update] = seedUpdates(sammlung, [alt, undefined], false)
    expect(update.id).toBe('a')
    expect(update.name).toBe('Gerader Stoß')
    expect(update.favorite).toBe(true)
  })

  it('nimmt den Favoriten auch beim ersten Lauf aus dem Bestand', () => {
    // Ein Geraet, auf dem schon einmal eine Sicherung eingespielt wurde:
    // Stoesse sind da, eingespielt wurde aber noch nie.
    const alt: Shot = { ...sammlung[0], favorite: true }
    const [update] = seedUpdates([sammlung[0]], [alt], true)
    expect(update.favorite).toBe(true)
  })
})
