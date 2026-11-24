/**
 * Fertige Aufbauten. Zwei Dinge haengen daran, die man am Bild nicht sieht:
 * die Kugeln duerfen sich nicht ueberschneiden (sonst schiebt der Baukasten
 * das Rack beim ersten Ziehen auseinander), und sie muessen auf dem Tuch
 * bleiben.
 */

import { describe, expect, it } from 'vitest'
import { POCKETS, TABLE, ballsOverlap, distance } from './geometry'
import { applyRack, rackBalls, shuffleObjectBalls } from './rack'
import { createShot, newId } from './shot'
import type { Ball, Shot } from './types'

/** Feste Zufallsfolge, damit der Test immer dieselbe Lage prueft. */
function folge(saat: number): () => number {
  let s = saat
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

function paare(balls: Ball[]): [Ball, Ball][] {
  const out: [Ball, Ball][] = []
  for (let i = 0; i < balls.length; i++) {
    for (let j = i + 1; j < balls.length; j++) out.push([balls[i], balls[j]])
  }
  return out
}

function aufDemTisch(b: Ball): boolean {
  const r = TABLE.ballRadius
  return b.x >= r && b.x <= TABLE.length - r && b.y >= r && b.y <= TABLE.width - r
}

describe('Das volle Dreieck', () => {
  const balls = rackBalls('eight')

  it('stellt fuenfzehn Kugeln mit je einer Nummer auf', () => {
    expect(balls).toHaveLength(15)
    expect([...balls.map((b) => b.number)].sort((a, b) => (a ?? 0) - (b ?? 0))).toEqual(
      Array.from({ length: 15 }, (_, i) => i + 1),
    )
    expect(balls.every((b) => b.kind === 'object')).toBe(true)
  })

  it('setzt die Spitze auf den Fusspunkt und oeffnet sich zur Fussbande', () => {
    const spitze = balls.find((b) => b.number === 1)
    expect(spitze?.x).toBeCloseTo(TABLE.footSpot.x, 6)
    expect(spitze?.y).toBeCloseTo(TABLE.footSpot.y, 6)
    expect(Math.max(...balls.map((b) => b.x))).toBeGreaterThan(TABLE.footSpot.x)
  })

  it('baut regelgerecht: Acht in der Mitte, hinten einmal voll und einmal halb', () => {
    const acht = balls.find((b) => b.number === 8)
    expect(acht?.y).toBeCloseTo(TABLE.footSpot.y, 6)

    const hinten = Math.max(...balls.map((b) => b.x))
    const letzteZeile = balls.filter((b) => Math.abs(b.x - hinten) < 1e-6)
    expect(letzteZeile).toHaveLength(5)
    const ecken = [
      letzteZeile.reduce((a, b) => (a.y < b.y ? a : b)),
      letzteZeile.reduce((a, b) => (a.y > b.y ? a : b)),
    ]
    expect(ecken.filter((b) => (b.number ?? 0) <= 8)).toHaveLength(1)
    expect(ecken.filter((b) => (b.number ?? 0) > 8)).toHaveLength(1)
  })

  it('stellt die Kugeln beruehrend, aber nicht ueberschneidend auf', () => {
    for (const [a, b] of paare(balls)) {
      expect(ballsOverlap(a, b)).toBe(false)
    }
    // Beruehrend heisst: auf den Durchmesser genau, nicht verstreut.
    const engste = Math.min(...paare(balls).map(([a, b]) => distance(a, b)))
    expect(engste).toBeCloseTo(TABLE.ballDiameter, 9)
  })

  it('bleibt mit allen Kugeln auf dem Tuch', () => {
    expect(balls.every(aufDemTisch)).toBe(true)
  })
})

describe('Die Neuner-Raute', () => {
  const balls = rackBalls('nine')

  it('stellt neun Kugeln auf, die Eins an der Spitze, die Neun in der Mitte', () => {
    expect(balls).toHaveLength(9)
    expect([...balls.map((b) => b.number)].sort((a, b) => (a ?? 0) - (b ?? 0))).toEqual(
      Array.from({ length: 9 }, (_, i) => i + 1),
    )
    const spitze = balls.find((b) => b.number === 1)
    expect(spitze?.x).toBeCloseTo(TABLE.footSpot.x, 6)
    // Fuenf Zeilen, die Neun steht in der mittleren und dort auf der Achse.
    const zeilen = [...new Set(balls.map((b) => b.x.toFixed(6)))].sort(
      (a, b) => Number(a) - Number(b),
    )
    expect(zeilen).toHaveLength(5)
    const neun = balls.find((b) => b.number === 9)
    expect(neun?.x.toFixed(6)).toBe(zeilen[2])
    expect(neun?.y).toBeCloseTo(TABLE.footSpot.y, 6)
  })

  it('ueberschneidet sich nicht und bleibt auf dem Tuch', () => {
    for (const [a, b] of paare(balls)) expect(ballsOverlap(a, b)).toBe(false)
    expect(balls.every(aufDemTisch)).toBe(true)
  })
})

describe('Einen Aufbau aufs Tuch setzen', () => {
  function stoss(): Shot {
    const basis = createShot()
    return {
      ...basis,
      balls: [
        ...basis.balls,
        { id: newId(), kind: 'obstacle', number: 12, x: 40, y: 40 },
        { id: newId(), kind: 'ghost', x: 60, y: 10 },
      ],
    }
  }

  it('ersetzt die Objektbaelle und laesst alles andere stehen', () => {
    const vorher = stoss()
    const nachher = applyRack(vorher, 'nine')

    expect(nachher.balls.filter((b) => b.kind === 'object')).toHaveLength(9)
    const weisser = nachher.balls.find((b) => b.kind === 'cue')
    expect(weisser?.x).toBe(vorher.balls.find((b) => b.kind === 'cue')?.x)
    expect(nachher.balls.find((b) => b.kind === 'obstacle')?.x).toBe(40)
    expect(nachher.balls.find((b) => b.kind === 'ghost')?.y).toBe(10)
  })

  it('laesst den uebrigen Stoss unberuehrt', () => {
    const vorher = stoss()
    const nachher = applyRack(vorher, 'eight')
    expect(nachher.name).toBe(vorher.name)
    expect(nachher.target).toEqual(vorher.target)
    expect(nachher.scoring).toEqual(vorher.scoring)
  })
})

describe('Die Zufallslage', () => {
  function vollerStoss(): Shot {
    return applyRack(createShot(), 'eight')
  }

  it('verteilt die Objektbaelle ueberschneidungsfrei und mit Abstand zur Tasche', () => {
    const gemischt = shuffleObjectBalls(vollerStoss(), folge(7))
    const balls = gemischt.balls

    expect(balls.filter((b) => b.kind === 'object')).toHaveLength(15)
    for (const [a, b] of paare(balls)) expect(ballsOverlap(a, b)).toBe(false)
    for (const b of balls.filter((x) => x.kind === 'object')) {
      expect(aufDemTisch(b)).toBe(true)
      expect(Math.min(...POCKETS.map((t) => distance(b, t.center)))).toBeGreaterThan(3)
    }
  })

  it('bewegt die Objektbaelle wirklich und laesst den Weissen stehen', () => {
    const vorher = vollerStoss()
    const nachher = shuffleObjectBalls(vorher, folge(11))

    const weisserVorher = vorher.balls.find((b) => b.kind === 'cue')
    const weisserNachher = nachher.balls.find((b) => b.kind === 'cue')
    expect(weisserNachher?.x).toBe(weisserVorher?.x)
    expect(weisserNachher?.y).toBe(weisserVorher?.y)

    const stehengeblieben = nachher.balls.filter(
      (b, i) => b.kind === 'object' && b.x === vorher.balls[i].x && b.y === vorher.balls[i].y,
    )
    expect(stehengeblieben).toEqual([])
  })

  it('behaelt Nummer, Reihenfolge und Kennung jeder Kugel', () => {
    const vorher = vollerStoss()
    const nachher = shuffleObjectBalls(vorher, folge(3))
    expect(nachher.balls.map((b) => b.id)).toEqual(vorher.balls.map((b) => b.id))
    expect(nachher.balls.map((b) => b.number)).toEqual(vorher.balls.map((b) => b.number))
    expect(nachher.balls.map((b) => b.order)).toEqual(vorher.balls.map((b) => b.order))
  })

  it('kommt auch mit einem sehr vollen Tisch zurecht', () => {
    const basis = createShot()
    const viele: Ball[] = Array.from({ length: 40 }, (_, i) => ({
      id: newId(),
      kind: 'object' as const,
      number: (i % 15) + 1,
      x: 50,
      y: 25,
    }))
    const gemischt = shuffleObjectBalls({ ...basis, balls: viele }, folge(5))
    expect(gemischt.balls.every(aufDemTisch)).toBe(true)
  })
})
