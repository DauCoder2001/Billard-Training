/**
 * Der Fingerabdruck der Vorlage.
 *
 * Er entscheidet, ob die App einem Nutzer sagt, dass seine uebernommene
 * Fassung von einer aelteren Vorlage abstammt. Zwei Fehler waeren teuer: ein
 * Hinweis, der nie kommt (Korrektur geht verloren), und einer, der ohne Grund
 * kommt (der Nutzer soll eine Aenderung ansehen, die es nicht gibt).
 */

import { describe, expect, it } from 'vitest'
import { hasNewerTemplate, seedStamp } from './seedStamp'
import { createShot } from './shot'
import type { Shot } from './types'

/**
 * Ein Stoss mit festen Kennungen.
 *
 * createShot wuerfelt die Kennungen der Baelle aus; die mitgelieferten
 * Uebungen vergeben feste ("cue", "object"). Hier braucht es feste, sonst
 * verglichen die Tests zwei verschiedene Aufbauten miteinander.
 */
function stoss(patch: Partial<Shot> = {}): Shot {
  const base = createShot({ id: 'a', name: 'Gerader Stoß' })
  return {
    ...base,
    balls: base.balls.map((b, i) => ({ ...b, id: i === 0 ? 'cue' : `ball-${i}` })),
    createdAt: 0,
    updatedAt: 0,
    ...patch,
  }
}

describe('seedStamp', () => {
  it('gibt bei gleichem Inhalt denselben Stand', () => {
    expect(seedStamp(stoss())).toBe(seedStamp(stoss()))
  })

  it('aendert sich, wenn ein Ball sich bewegt', () => {
    const vorher = stoss()
    const ball = vorher.balls[0]
    const nachher = stoss({
      balls: [{ ...ball, x: ball.x + 0.01 }, ...vorher.balls.slice(1)],
    })
    expect(seedStamp(nachher)).not.toBe(seedStamp(vorher))
  })

  it('aendert sich, wenn der Trainerhinweis anders lautet', () => {
    expect(seedStamp(stoss({ coachNotes: 'Neu' }))).not.toBe(seedStamp(stoss()))
  })

  it('aendert sich, wenn eine Schwelle anders steht', () => {
    const vorher = stoss()
    const nachher = stoss({
      scoring: {
        ...vorher.scoring,
        thresholds: { ...vorher.scoring.thresholds, proficient: 99 },
      },
    })
    expect(seedStamp(nachher)).not.toBe(seedStamp(vorher))
  })

  it('laesst sich von Id, Favorit, Zeitstempeln und Marke nicht beirren', () => {
    // Das sind die Felder des Nutzers und des Geraets. Stuenden sie im
    // Fingerabdruck, meldete jedes Markieren als Favorit eine neue Vorlage.
    const anders = stoss({
      id: 'ganz-anders',
      favorite: true,
      builtIn: true,
      createdAt: 1,
      updatedAt: 2,
    })
    expect(seedStamp(anders)).toBe(seedStamp(stoss()))
  })

  it('rechnet sich nicht in sich selbst hinein', () => {
    // Der Stand steht am Stoss. Ginge er in die Rechnung ein, kaeme beim
    // zweiten Mal etwas anderes heraus als beim ersten.
    const ohne = stoss()
    expect(seedStamp({ ...ohne, seedStamp: seedStamp(ohne) })).toBe(seedStamp(ohne))
  })
})

describe('hasNewerTemplate', () => {
  const vorlage = stoss({ builtIn: true, seedStamp: 'neu' })

  it('meldet eine uebernommene Fassung mit altem Stand', () => {
    const eigen = stoss({ builtIn: false, seedStamp: 'alt' })
    expect(hasNewerTemplate(eigen, vorlage)).toBe(true)
  })

  it('schweigt bei gleichem Stand', () => {
    const eigen = stoss({ builtIn: false, seedStamp: 'neu' })
    expect(hasNewerTemplate(eigen, vorlage)).toBe(false)
  })

  it('schweigt bei einem unveraenderten mitgelieferten Stoss', () => {
    // Den holt die Aktualisierung der Sammlung von selbst ein.
    const mitgeliefert = stoss({ builtIn: true, seedStamp: 'alt' })
    expect(hasNewerTemplate(mitgeliefert, vorlage)).toBe(false)
  })

  it('schweigt bei einem eigenen Stoss ohne Vorlage', () => {
    const eigen = stoss({ builtIn: false, seedStamp: 'alt' })
    expect(hasNewerTemplate(eigen, undefined)).toBe(false)
  })

  it('schweigt, wenn der Stoss keinen Stand mitbringt', () => {
    // Geteilt oder aus einer Sicherung: woher er stammt, ist nicht bekannt.
    // Raten waere schlechter als Schweigen.
    const fremd = stoss({ builtIn: false })
    expect(hasNewerTemplate(fremd, vorlage)).toBe(false)
  })
})
