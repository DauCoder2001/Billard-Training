/**
 * Die Regel, nach der eine Aktualisierung der Uebungssammlung schreibt.
 *
 * Geprueft wird ohne Datenbank, weil die Regel eine reine Entscheidung ueber
 * Vorlage und Bestand ist. Sie entscheidet ueber eigene Arbeit: hier faellt,
 * ob ein geloeschter Stoss wiederkommt und ob eine selbst geaenderte Fassung
 * einer mitgelieferten Uebung stehen bleibt.
 */

import { describe, expect, it } from 'vitest'
import { levelUpdates, seedStampUpdates, seedUpdates } from './bootstrap'
import { createShot } from '@/domain/shot'
import type { Shot } from '@/domain/types'

/** Ein Stoss der Vorlage: feste Id, als mitgeliefert markiert. */
function vorlage(id: string, name: string): Shot {
  return { ...createShot({ id, name }), builtIn: true, favorite: false, seedStamp: 'neu' }
}

const sammlung = [vorlage('a', 'Gerade Übung'), vorlage('b', 'Bandenball')]

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
    expect(update.name).toBe('Gerade Übung')
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

/**
 * Die einmalige Nachruestung des Vorlagenstands.
 *
 * Sie entscheidet, womit Geraete starten, auf denen vor dieser Neuerung schon
 * eingespielt wurde. Zu viel geschrieben heisst: ein Hinweis auf eine
 * Ueberarbeitung, die der Nutzer laengst kennt. Zu wenig heisst: der Hinweis
 * bleibt fuer immer aus.
 */
describe('seedStampUpdates', () => {
  it('haengt den Stand an einen Stoss, der keinen traegt', () => {
    const ohne: Shot = { ...sammlung[0], seedStamp: undefined }
    const [update] = seedStampUpdates(sammlung, [ohne, undefined])
    expect(update.id).toBe('a')
    expect(update.seedStamp).toBe('neu')
  })

  it('haakt eine laengst uebernommene Fassung als aktuell ab', () => {
    // Von welcher Fassung sie abstammt, weiss niemand mehr. Raten waere
    // schlechter als sie als aktuell zu fuehren - sonst stuende beim ersten
    // Start ein Hinweis da, den der Nutzer nicht einordnen kann.
    const eigen: Shot = { ...sammlung[0], builtIn: false, name: 'Meiner', seedStamp: undefined }
    const [update] = seedStampUpdates(sammlung, [eigen, undefined])
    expect(update.name).toBe('Meiner')
    expect(update.builtIn).toBe(false)
    expect(update.seedStamp).toBe('neu')
  })

  it('laesst einen vorhandenen Stand stehen', () => {
    // Sonst wuerde die Nachruestung bei jedem Start jede Ueberarbeitung
    // abhaken, bevor der Nutzer sie zu sehen bekommt.
    const alt: Shot = { ...sammlung[0], builtIn: false, seedStamp: 'alt' }
    expect(seedStampUpdates(sammlung, [alt, undefined])).toEqual([])
  })

  it('uebergeht einen geloeschten Stoss', () => {
    expect(seedStampUpdates(sammlung, [undefined, undefined])).toEqual([])
  })
})

/**
 * Die Regel, die die Lernstufe nachtraegt.
 *
 * Sie ist der Grund, warum die Stufen nicht einfach ueber SEED_VERSION
 * eingespielt werden: seedUpdates laesst eine eigene Fassung einer
 * mitgelieferten Uebung bewusst in Ruhe. Genau die bekaeme dann nie eine
 * Stufe und fiele aus jedem Filter heraus - obwohl die Stufe nichts am Stoss
 * aendert, sondern nur sagt, wo er in der Sammlung steht.
 */
describe('levelUpdates', () => {
  const eingestuft: Shot[] = [
    { ...vorlage('a', 'Gerade Übung'), level: 'A' },
    { ...vorlage('b', 'Bandenball'), level: 'B' },
  ]

  /** Derselbe Stoss, wie er vor dieser Neuerung gespeichert wurde. */
  function ohneStufe(shot: Shot, patch: Partial<Shot> = {}): Shot {
    const { level: _l, ...rest } = shot
    return { ...(rest as Shot), ...patch }
  }

  it('traegt die Stufe nach, wo noch keine steht', () => {
    const updates = levelUpdates(eingestuft, eingestuft.map((s) => ohneStufe(s)))
    expect(updates.map((s) => [s.id, s.level])).toEqual([
      ['a', 'A'],
      ['b', 'B'],
    ])
  })

  it('erreicht auch die eigene Fassung einer mitgelieferten Uebung', () => {
    // Der Fall, fuer den es diese Regel gibt: builtIn === false setzt der
    // Baukasten beim Speichern, und seedUpdates fasst das nicht mehr an.
    const eigen = ohneStufe(eingestuft[0], { name: 'Mein eigener Name', builtIn: false })
    const updates = levelUpdates(eingestuft, [eigen, eingestuft[1]])
    expect(updates).toHaveLength(1)
    expect(updates[0].level).toBe('A')
    // Angefasst wird nur die Stufe, sonst nichts.
    expect(updates[0].name).toBe('Mein eigener Name')
    expect(updates[0].builtIn).toBe(false)
  })

  it('laesst eine bereits gewaehlte Stufe stehen', () => {
    // Wer im Baukasten eine andere Stufe waehlt, behaelt sie.
    const eigen = { ...eingestuft[0], level: 'D' as const }
    expect(levelUpdates(eingestuft, [eigen, eingestuft[1]])).toEqual([])
  })

  it('holt einen geloeschten Stoss nicht zurueck', () => {
    const updates = levelUpdates(eingestuft, [undefined, ohneStufe(eingestuft[1])])
    expect(updates.map((s) => s.id)).toEqual(['b'])
  })

  it('findet beim zweiten Lauf nichts mehr', () => {
    // Darum braucht die Regel keinen Versionszaehler.
    const bestand = eingestuft.map((s) => ohneStufe(s))
    const einmal = levelUpdates(eingestuft, bestand)
    expect(levelUpdates(eingestuft, einmal)).toEqual([])
  })
})
