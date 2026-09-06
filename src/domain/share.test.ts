import { describe, expect, it } from 'vitest'
import { decodeShot, encodeShot, payloadFromInput, shareUrl } from './share'
import { createShot, mirrorShot } from './shot'
import { computeCutAngle, duplicateShot } from './shot'

describe('Teilen', () => {
  it('liefert nach Codieren und Decodieren denselben Aufbau', () => {
    const original = createShot({
      name: 'Gruesse aus der Kitchen',
      coachNotes: 'Umlaute pruefen: aeoeue',
      tags: ['Test'],
    })
    const back = decodeShot(encodeShot(original))
    expect(back.name).toBe(original.name)
    expect(back.coachNotes).toBe(original.coachNotes)
    expect(back.balls.map((b) => [b.x, b.y])).toEqual(original.balls.map((b) => [b.x, b.y]))
    expect(back.target).toEqual(original.target)
    expect(back.scoring).toEqual(original.scoring)
  })

  it('vergibt beim Uebernehmen eine neue Id', () => {
    const original = createShot()
    expect(decodeShot(encodeShot(original)).id).not.toBe(original.id)
  })

  it('uebernimmt keine fremde Markierung als mitgelieferte Uebung', () => {
    const original = { ...createShot(), builtIn: true, favorite: true }
    const back = decodeShot(encodeShot(original))
    expect(back.builtIn).toBe(false)
    expect(back.favorite).toBe(false)
  })

  it('meldet unlesbare Nutzlasten verstaendlich', () => {
    expect(() => decodeShot('nicht-wirklich-komprimiert')).toThrow(/nicht lesen/)
  })

  it('baut einen Link mit der Nutzlast im Fragment', () => {
    const url = shareUrl(createShot(), 'https://beispiel.test/app/')
    expect(url.startsWith('https://beispiel.test/app/#/import?d=')).toBe(true)
  })

  it('liest die Nutzlast aus Link oder blankem Code', () => {
    const payload = encodeShot(createShot())
    expect(payloadFromInput(`https://x.test/#/import?d=${payload}`)).toBe(payload)
    expect(payloadFromInput(`  ${payload}  `)).toBe(payload)
    expect(payloadFromInput('kein code!')).toBeNull()
    expect(payloadFromInput('')).toBeNull()
  })
})

describe('Stoss umformen', () => {
  it('gibt der Kopie neue Ids fuer Baelle und Wege', () => {
    const original = createShot()
    const copy = duplicateShot(original)
    expect(copy.id).not.toBe(original.id)
    expect(copy.balls.map((b) => b.id)).not.toEqual(original.balls.map((b) => b.id))
  })

  it('spiegelt Lage und Zieltasche zusammen', () => {
    const original = createShot()
    const mirrored = mirrorShot(original, 'horizontal')
    expect(mirrored.target.pocketId).toBe('tr')
    for (const [i, ball] of mirrored.balls.entries()) {
      expect(ball.y).toBeCloseTo(50 - original.balls[i].y, 6)
      expect(ball.x).toBeCloseTo(original.balls[i].x, 6)
    }
  })

  it('erhaelt den Schnittwinkel beim Spiegeln', () => {
    const original = createShot()
    original.balls[0].y = 18
    expect(computeCutAngle(mirrorShot(original, 'horizontal'))).toBeCloseTo(
      computeCutAngle(original),
      1,
    )
  })

  it('zweimal spiegeln ergibt wieder den Ausgangszustand', () => {
    const original = createShot()
    const twice = mirrorShot(mirrorShot(original, 'vertical'), 'vertical')
    expect(twice.target.pocketId).toBe(original.target.pocketId)
    expect(twice.balls.map((b) => Math.round(b.x * 1000))).toEqual(
      original.balls.map((b) => Math.round(b.x * 1000)),
    )
  })
})
