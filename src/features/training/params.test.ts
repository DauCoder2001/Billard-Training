import { describe, expect, it } from 'vitest'
import { SESSION_ATTEMPTS } from '@/domain/types'
import { plannedAttempts, sessionFormat } from './params'

/** So kommen die Angaben an: als Abfrage in der Adresse. */
function aus(suche: string) {
  const p = new URLSearchParams(suche)
  return { format: sessionFormat(p.get('format')), planned: plannedAttempts(p.get('attempts')) }
}

describe('sessionFormat', () => {
  it('nimmt die vier bekannten Formen', () => {
    expect(sessionFormat('quick')).toBe('quick')
    expect(sessionFormat('standard')).toBe('standard')
    expect(sessionFormat('deep')).toBe('deep')
    expect(sessionFormat('custom')).toBe('custom')
  })

  it('macht aus allem anderen standard', () => {
    expect(sessionFormat('x')).toBe('standard')
    expect(sessionFormat('')).toBe('standard')
    expect(sessionFormat(null)).toBe('standard')
    expect(sessionFormat('QUICK')).toBe('standard')
    expect(sessionFormat('__proto__')).toBe('standard')
  })
})

describe('plannedAttempts', () => {
  it('nimmt eine gemeinte Zahl', () => {
    expect(plannedAttempts('10')).toBe(10)
    expect(plannedAttempts('1')).toBe(1)
    expect(plannedAttempts('200')).toBe(200)
  })

  it('kuerzt zu grosse Zahlen auf das Hoechstmass', () => {
    expect(plannedAttempts('201')).toBe(200)
    expect(plannedAttempts('1e9')).toBe(200)
    expect(plannedAttempts('999999999999')).toBe(200)
  })

  it('macht aus Unsinn die Standardlaenge', () => {
    expect(plannedAttempts('-5')).toBe(SESSION_ATTEMPTS.standard)
    expect(plannedAttempts('0')).toBe(SESSION_ATTEMPTS.standard)
    expect(plannedAttempts('abc')).toBe(SESSION_ATTEMPTS.standard)
    expect(plannedAttempts('')).toBe(SESSION_ATTEMPTS.standard)
    expect(plannedAttempts(null)).toBe(SESSION_ATTEMPTS.standard)
    expect(plannedAttempts('Infinity')).toBe(SESSION_ATTEMPTS.standard)
    expect(plannedAttempts('-Infinity')).toBe(SESSION_ATTEMPTS.standard)
    expect(plannedAttempts('NaN')).toBe(SESSION_ATTEMPTS.standard)
  })

  it('rundet auf ganze Versuche', () => {
    expect(plannedAttempts('12.4')).toBe(12)
    expect(plannedAttempts('12.6')).toBe(13)
    expect(plannedAttempts('0.4')).toBe(SESSION_ATTEMPTS.standard)
  })

  it('liest die Adresse, die die App selbst schreibt', () => {
    expect(aus('format=deep&attempts=30')).toEqual({ format: 'deep', planned: 30 })
    expect(aus('format=custom&attempts=15')).toEqual({ format: 'custom', planned: 15 })
  })

  it('haelt die beiden Faelle aus Befund 4 ab', () => {
    expect(aus('format=x&attempts=1e9')).toEqual({ format: 'standard', planned: 200 })
    expect(aus('attempts=-5')).toEqual({ format: 'standard', planned: 20 })
  })
})
