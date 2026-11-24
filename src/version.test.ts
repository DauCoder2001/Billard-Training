import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { describe, expect, it } from 'vitest'

/*
 * Die Versionsnummer steht an genau einer Stelle: package.json. Das Programm
 * liest sie von dort (vite.config.ts setzt __APP_VERSION__ ein), und niemand
 * sonst darf sie fuehren.
 *
 * Eine Kopie gibt es trotzdem - npm schreibt die Nummer in package-lock.json,
 * an zwei Stellen. Diese Kopie ist abgeleitet, nicht die Quelle, aber sie
 * steht mit im Verlauf, und npm bringt sie nur bei einem `npm install` von
 * selbst nach. Sie lief deshalb schon einmal weit auseinander (Befund 65:
 * 0.8.4 bei Programmstand 0.13.0).
 *
 * Dieser Test ist die Klammer dazu: wer die Nummer hochzaehlt und die Sperrdatei
 * vergisst, merkt es beim naechsten Testlauf und nicht erst Monate spaeter.
 */
function lesen(name: string): Record<string, unknown> {
  const pfad = fileURLToPath(new URL(`../${name}`, import.meta.url))
  return JSON.parse(readFileSync(pfad, 'utf8')) as Record<string, unknown>
}

describe('Die Versionsnummer', () => {
  const paket = lesen('package.json')
  const sperre = lesen('package-lock.json')
  const wurzel = (sperre.packages as Record<string, { version?: string }>)['']

  it('steht in package.json im Schema Hauptversion.Funktion.Korrektur', () => {
    expect(paket.version).toMatch(/^\d+\.\d+\.\d+$/)
  })

  it('stimmt mit der Kopie oben in package-lock.json ueberein', () => {
    expect(sperre.version).toBe(paket.version)
  })

  it('stimmt mit der Kopie im eigenen Paketeintrag der Sperrdatei ueberein', () => {
    expect(wurzel.version).toBe(paket.version)
  })

  it('gehoert in beiden Dateien zum selben Paket', () => {
    expect(sperre.name).toBe(paket.name)
    expect((wurzel as { name?: string }).name).toBe(paket.name)
  })
})
