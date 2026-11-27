/**
 * Die Machbarkeitspruefung im Baukasten.
 *
 * Zwei Fehler waeren teuer, und der zweite mehr als der erste: ein Hinweis,
 * der ausbleibt, kostet den Nutzer einen Versuch am Tisch. Ein Hinweis, der
 * ohne Grund kommt, kostet ihn das Vertrauen in alle anderen - wer dreimal
 * grundlos gewarnt wird, liest den vierten nicht mehr. Deshalb steht die
 * Gegenprobe an der ganzen mitgelieferten Sammlung am Anfang: die ist
 * spielbar, also darf dort nichts stehen. Sie waechst mit jeder Stufe, und
 * diese Pruefung waechst von allein mit.
 */

import { describe, expect, it } from 'vitest'
import { POCKET_BY_ID, TABLE, ghostBall, pocketAimPoint } from './geometry'
import { MAX_CUT_ANGLE, feasibilityHints } from './feasibility'
import { createShot } from './shot'
import type { Ball, Shot } from './types'
import { seedShots } from '@/data/seed/drills'

const R = TABLE.ballRadius

/** Die Kennungen der gemeldeten Pruefungen, in der Reihenfolge der Ausgabe. */
function checks(shot: Shot): string[] {
  return feasibilityHints(shot).map((h) => h.check)
}

function text(shot: Shot, check: string): string {
  return feasibilityHints(shot).find((h) => h.check === check)?.text ?? ''
}

/** Ein Aufbau aus Baellen, ohne gezeichnete Wege. */
function aufbau(balls: Ball[], patch: Partial<Shot> = {}): Shot {
  return { ...createShot(), balls, paths: [], ...patch }
}

const weisser = (x: number, y: number): Ball => ({ id: 'cue', kind: 'cue', x, y })
const objekt = (x: number, y: number, number = 1): Ball => ({
  id: `obj-${number}`,
  kind: 'object',
  number,
  x,
  y,
  order: number,
})
const stoerer = (x: number, y: number, number = 9): Ball => ({
  id: `st-${number}`,
  kind: 'obstacle',
  number,
  x,
  y,
})

describe('Die mitgelieferten Uebungen', () => {
  it('melden keinen einzigen Hinweis', () => {
    // Die wichtigste Pruefung dieser Datei. Schlaegt sie an, ist entweder
    // eine Uebung kaputt oder eine Regel zu scharf - beides muss man sehen,
    // bevor der Nutzer es sieht.
    const auffaellig = seedShots()
      .map((s) => ({ id: s.id, hinweise: feasibilityHints(s).map((h) => h.text) }))
      .filter((e) => e.hinweise.length > 0)
    expect(auffaellig).toEqual([])
  })
})

describe('Bewertbar', () => {
  it('meldet eine Uebung ohne Objektball und ohne Zielzone als Hindernis', () => {
    const shot = aufbau([weisser(25, 25)], {
      scoring: { ...createShot().scoring, targetZone: null },
      target: { pocketId: null, cheat: 0 },
    })
    const hinweis = feasibilityHints(shot).find((h) => h.check === 'scorable')
    expect(hinweis?.level).toBe('blocker')
  })

  it('schweigt, sobald es eine Zielzone gibt', () => {
    const shot = aufbau([weisser(25, 25)], { target: { pocketId: null, cheat: 0 } })
    expect(checks(shot)).not.toContain('scorable')
  })
})

describe('Baelle getrennt', () => {
  it('meldet zwei Baelle, die ineinander liegen, und nennt beide', () => {
    const shot = aufbau([weisser(25, 25), objekt(26, 25), stoerer(60, 40)])
    expect(checks(shot)).toContain('overlap')
    expect(text(shot, 'overlap')).toBe('Der Weiße und Ball 1 liegen ineinander.')
  })

  it('laesst zwei Baelle gelten, die sich gerade beruehren', () => {
    const shot = aufbau([weisser(25, 25), objekt(25 + TABLE.ballDiameter, 25)])
    expect(checks(shot)).not.toContain('overlap')
  })

  it('zaehlt den Geisterball nicht mit', () => {
    // Er ist eine Markierung, kein Ball: er darf genau dort liegen, wo der
    // Weisse im Moment des Treffens steht.
    const shot = aufbau([
      weisser(25, 25),
      objekt(62.5, 25),
      { id: 'g', kind: 'ghost', x: 25, y: 25 },
    ])
    expect(checks(shot)).not.toContain('overlap')
  })
})

describe('Schnittwinkel', () => {
  it('meldet einen Schnitt jenseits der Grenze', () => {
    // Der Weisse steht fast neben dem Geisterball: der Objektball wird nur
    // noch gestreift.
    const ziel = pocketAimPoint(POCKET_BY_ID.br)
    const ball = { x: 62.5, y: 25 }
    const ghost = ghostBall(ball, ziel)
    // Senkrecht zur Laufrichtung des Objektballs steht der Schnitt bei 90
    // Grad; ein Stueck zurueck ergibt knapp darunter.
    const quer = { x: -(ball.y - ghost.y), y: ball.x - ghost.x }
    const laenge = Math.hypot(quer.x, quer.y)
    const shot = aufbau([
      weisser(ghost.x + (quer.x / laenge) * 20 - (ball.x - ghost.x) * 0.2,
        ghost.y + (quer.y / laenge) * 20 - (ball.y - ghost.y) * 0.2),
      objekt(ball.x, ball.y),
    ])
    expect(checks(shot)).toContain('cutAngle')
    expect(text(shot, 'cutAngle')).toContain(`Über ${MAX_CUT_ANGLE}°`)
  })

  it('schweigt beim geraden Ball', () => {
    const ziel = pocketAimPoint(POCKET_BY_ID.br)
    const ball = { x: 62.5, y: 25 }
    const ghost = ghostBall(ball, ziel)
    const zurueck = { x: ghost.x - ball.x, y: ghost.y - ball.y }
    const laenge = Math.hypot(zurueck.x, zurueck.y)
    const shot = aufbau([
      weisser(ghost.x + (zurueck.x / laenge) * 15, ghost.y + (zurueck.y / laenge) * 15),
      objekt(ball.x, ball.y),
    ])
    expect(checks(shot)).not.toContain('cutAngle')
  })
})

describe('Sichtlinie', () => {
  it('meldet einen Ball zwischen dem Weissen und dem Objektball', () => {
    const ziel = pocketAimPoint(POCKET_BY_ID.br)
    const ghost = ghostBall({ x: 62.5, y: 25 }, ziel)
    const cue = { x: 25, y: 25 }
    const mitte = { x: (cue.x + ghost.x) / 2, y: (cue.y + ghost.y) / 2 }
    const shot = aufbau([weisser(cue.x, cue.y), objekt(62.5, 25), stoerer(mitte.x, mitte.y)])
    expect(checks(shot)).toContain('sightLine')
    expect(text(shot, 'sightLine')).toBe('Störball 9 steht im Weg des Weißen.')
  })

  it('schweigt, wenn der Ball weit neben der Linie liegt', () => {
    const shot = aufbau([weisser(25, 25), objekt(62.5, 25), stoerer(44, 45)])
    expect(checks(shot)).not.toContain('sightLine')
  })
})

describe('Weg des Objektballs und Tasche', () => {
  it('meldet einen Ball, der die Tasche verdeckt', () => {
    const ziel = pocketAimPoint(POCKET_BY_ID.br)
    const ball = { x: 62.5, y: 25 }
    const mitte = { x: (ball.x + ziel.x) / 2, y: (ball.y + ziel.y) / 2 }
    const shot = aufbau([weisser(25, 25), objekt(ball.x, ball.y), stoerer(mitte.x, mitte.y)])
    expect(checks(shot)).toContain('pocketBlocked')
    expect(text(shot, 'pocketBlocked')).toBe('Störball 9 verdeckt die Tasche.')
  })

  it('haelt den zweiten Ball einer Kombination nicht fuer ein Hindernis', () => {
    // Er steht am Ende des ersten Stuecks: dort ist er das Ziel, nicht das
    // Hindernis. Ohne diese Regel meldete jede Kombination einen Hinweis.
    const zweiter = { x: 70, y: 25 }
    const shot = aufbau([weisser(25, 25), objekt(45, 25), objekt(zweiter.x, zweiter.y, 2)], {
      paths: [
        {
          id: 'p',
          ballId: 'obj-1',
          role: 'object',
          segments: [{ to: zweiter }],
        },
      ],
    })
    expect(checks(shot)).not.toContain('objectPath')
    expect(checks(shot)).not.toContain('pocketBlocked')
  })

  it('meldet einen Ball auf dem ersten Stueck getrennt von der Tasche', () => {
    const shot = aufbau([weisser(25, 10), objekt(40, 25), stoerer(55, 25)], {
      paths: [
        {
          id: 'p',
          ballId: 'obj-1',
          role: 'object',
          segments: [{ to: { x: 70, y: 25 } }],
        },
      ],
    })
    expect(checks(shot)).toContain('objectPath')
    expect(text(shot, 'objectPath')).toBe('Störball 9 steht im Weg des Objektballs.')
  })
})

describe('Platz fuer das Queue', () => {
  it('meldet den Weissen an der Bande, wenn der Stoss von ihr wegfuehrt', () => {
    // Der Weisse klebt an der unteren Langbande und soll quer ueber den
    // Tisch: das Queue laege ueber der Bande.
    const shot = aufbau([weisser(30, R + 0.2), objekt(30, 40)], {
      target: { pocketId: 'tl', cheat: 0 },
    })
    expect(checks(shot)).toContain('cueRoom')
    expect(text(shot, 'cueRoom')).toContain('unteren Langbande')
  })

  it('schweigt, wenn der Weisse an der Bande entlangspielt', () => {
    // Dieselbe Enge, aber das Queue liegt neben der Bande statt darueber.
    const shot = aufbau([weisser(20, R + 0.2), objekt(70, R + 0.2)], {
      target: { pocketId: 'br', cheat: 0 },
    })
    expect(checks(shot)).not.toContain('cueRoom')
  })

  it('schweigt bei einem Weissen mit Luft zur Bande', () => {
    const shot = aufbau([weisser(30, 20), objekt(30, 40)], {
      target: { pocketId: 'tl', cheat: 0 },
    })
    expect(checks(shot)).not.toContain('cueRoom')
  })
})

describe('Der Geisterball auf dem Tisch', () => {
  it('meldet einen Objektball, der nicht in diese Tasche zu spielen ist', () => {
    // Der Fall aus der Sammlung (0.19.1): ein an der oberen Langbande
    // festliegender Ball, der in die Ecke oben rechts soll. Der Zielpunkt
    // in der Muendung liegt tiefer als der Ball, also faellt die
    // Anspiellinie leicht ab - und der Weisse muesste im Augenblick des
    // Treffens in der Bande stehen.
    const shot = aufbau([weisser(30, 40), objekt(60, TABLE.width - R)], {
      target: { pocketId: 'tr', cheat: 0 },
    })
    expect(checks(shot)).toContain('ghostOnTable')
    expect(text(shot, 'ghostOnTable')).toContain('außerhalb der Spielfläche')
  })

  it('schweigt, sobald der Ball von der Bande weg liegt', () => {
    // Zweieinhalb Zoll genuegen: so steht es in der Sammlung.
    const shot = aufbau([weisser(30, 40), objekt(60, TABLE.width - 2.5)], {
      target: { pocketId: 'tr', cheat: 0 },
    })
    expect(checks(shot)).not.toContain('ghostOnTable')
  })

  it('nennt, wie weit der Weisse danebenstuende', () => {
    const objektBall = objekt(60, TABLE.width - R)
    const shot = aufbau([weisser(30, 40), objektBall], {
      target: { pocketId: 'tr', cheat: 0 },
    })
    const ghost = ghostBall(
      { x: objektBall.x, y: objektBall.y },
      pocketAimPoint(POCKET_BY_ID.tr, 0),
    )
    const ueber = ghost.y - (TABLE.width - R)
    expect(ueber).toBeGreaterThan(0)
    expect(text(shot, 'ghostOnTable')).toContain(`${ueber.toFixed(2)}"`)
  })
})

describe('Die Reihenfolge der Hinweise', () => {
  it('nennt das Hindernis vor den Hinweisen und folgt sonst dem Stoss', () => {
    // Ohne Objektball und ohne Zielzone, dazu zwei Baelle ineinander.
    const shot = aufbau([weisser(25, 25), stoerer(26, 25)], {
      scoring: { ...createShot().scoring, targetZone: null },
      target: { pocketId: null, cheat: 0 },
    })
    expect(checks(shot).slice(0, 2)).toEqual(['scorable', 'overlap'])
  })
})
