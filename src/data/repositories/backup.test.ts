/**
 * Pruefungen am Eingang des Imports.
 *
 * Alle Faelle hier scheitern, bevor die Transaktion beginnt - deshalb laufen
 * sie ohne IndexedDB. Genau darauf kommt es an: im Modus "replace" leert die
 * Transaktion zuerst den Bestand, eine Pruefung danach waere zu spaet.
 */

import { describe, expect, it } from 'vitest'
import { importBackup } from './backup'

const gueltig = {
  app: 'billard-training' as const,
  version: 1,
  exportedAt: 0,
  shots: [],
}

describe('importBackup', () => {
  it('weist eine fremde Datei ab', async () => {
    await expect(importBackup({ app: 'etwas-anderes', shots: [] })).rejects.toThrow(
      /keine Sicherung/,
    )
  })

  it('weist eine Datei ohne Stossliste ab', async () => {
    await expect(importBackup({ ...gueltig, shots: 'keine Liste' })).rejects.toThrow(
      /keine Sicherung/,
    )
  })

  it('weist eine neuere Fassung ab', async () => {
    await expect(importBackup({ ...gueltig, version: 99 })).rejects.toThrow(/neueren Version/)
  })

  it.each([
    ['players', 'Die Spieler'],
    ['sessions', 'Die Einheiten'],
    ['workouts', 'Die Workouts'],
  ])('weist %s ab, wenn dort keine Liste steht', async (feld, label) => {
    await expect(importBackup({ ...gueltig, [feld]: { a: 1 } }, 'replace')).rejects.toThrow(
      `Die Sicherung ist beschädigt und wurde nicht eingespielt: ${label} liegen nicht als Liste vor.`,
    )
  })

  it('weist Einstellungen ab, die kein Datensatz sind', async () => {
    await expect(importBackup({ ...gueltig, settings: 'kaputt' }, 'replace')).rejects.toThrow(
      /Einstellungen liegen nicht als Datensatz vor/,
    )
  })
})
