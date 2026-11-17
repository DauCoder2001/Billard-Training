import { describe, expect, it } from 'vitest'
import { storageErrorText } from './errors'

/** Baut einen Fehler mit dem Namen, den Dexie vergibt. */
function dexieFehler(name: string, text: string): Error {
  const err = new Error(text)
  err.name = name
  return err
}

describe('storageErrorText', () => {
  it('erklaert die haeufigen Faelle auf Deutsch', () => {
    expect(storageErrorText(dexieFehler('QuotaExceededError', 'The quota has been exceeded.'))).toMatch(
      /Speicher dieses Browsers ist voll/,
    )
    expect(storageErrorText(dexieFehler('DatabaseClosedError', 'Database has been closed'))).toMatch(
      /Datenbank wurde geschlossen/,
    )
    expect(storageErrorText(dexieFehler('MissingAPIError', 'IndexedDB API missing.'))).toMatch(
      /lässt keinen Speicher zu/,
    )
    expect(storageErrorText(dexieFehler('VersionError', 'Version change'))).toMatch(
      /anderen Fenster aktualisiert/,
    )
  })

  it('laesst in keinem erklaerten Fall englischen Text durch', () => {
    for (const name of [
      'QuotaExceededError',
      'QuotaError',
      'MissingAPIError',
      'OpenFailedError',
      'InvalidStateError',
      'DatabaseClosedError',
      'VersionError',
      'AbortError',
    ]) {
      const satz = storageErrorText(dexieFehler(name, 'Something went terribly wrong'))
      expect(satz).not.toMatch(/Something went/)
      expect(satz).not.toMatch(name)
      // Ein ganzer Satz, kein Bruchstueck.
      expect(satz.endsWith('.')).toBe(true)
    }
  })

  it('behaelt den technischen Text, wenn der Fall nicht bekannt ist', () => {
    expect(storageErrorText(dexieFehler('ConstraintError', 'Key already exists'))).toBe(
      'Key already exists',
    )
  })

  it('kommt auch ohne Fehlerobjekt zurecht', () => {
    expect(storageErrorText('kaputt')).toBe('Der Grund ist unbekannt.')
    expect(storageErrorText(undefined)).toBe('Der Grund ist unbekannt.')
  })
})
