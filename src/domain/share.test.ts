import { describe, expect, it } from 'vitest'
import { deflateSync, strToU8 } from 'fflate'
import { decodeShot, encodeShot, payloadFromInput, shareUrl, shotFileText } from './share'
import { speedFromLegacy } from './tempo'
import { createShot, mirrorShot } from './shot'
import { computeCutAngle, duplicateShot } from './shot'
import { DEFAULT_THRESHOLDS } from './types'

/**
 * Nutzlast von Hand bauen - auch fuer Inhalte, die encodeShot nie erzeugen
 * wuerde. Genau die muss decodeShot ueberleben: ein geteilter Link kommt
 * aus fremder Hand.
 */
function payloadOf(value: unknown): string {
  const bytes = deflateSync(strToU8(JSON.stringify(value)), { level: 9 })
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

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

  it('schreibt eine Datei, die sich wieder einlesen laesst', () => {
    const original = createShot({ name: 'Rückzieher über zwei Banden' })
    const datei = shotFileText(original)

    const huelle = JSON.parse(datei) as Record<string, unknown>
    expect(huelle.app).toBe('billard-training')
    expect(huelle.kind).toBe('shot')
    expect(typeof huelle.d).toBe('string')

    const payload = payloadFromInput(datei)
    expect(payload).not.toBeNull()
    const zurueck = decodeShot(payload as string)
    expect(zurueck.name).toBe(original.name)
    expect(zurueck.balls.length).toBe(original.balls.length)
    expect(zurueck.attributes.shotType).toBe(original.attributes.shotType)
  })

  it('nimmt als Datei nur die eigene Huelle an', () => {
    const payload = encodeShot(createShot())
    // Die rohe Form, die "Als Datei" frueher geschrieben hat: ein Stoss ohne
    // Huelle. Sie war von keinem Einleseweg zu gebrauchen und bleibt es.
    expect(payloadFromInput(JSON.stringify(createShot()))).toBeNull()
    expect(payloadFromInput(JSON.stringify({ app: 'etwas-anderes', kind: 'shot', d: payload }))).toBeNull()
    expect(payloadFromInput(JSON.stringify({ app: 'billard-training', kind: 'backup', d: payload }))).toBeNull()
    expect(payloadFromInput(JSON.stringify({ app: 'billard-training', kind: 'shot' }))).toBeNull()
    expect(payloadFromInput(JSON.stringify({ app: 'billard-training', kind: 'shot', d: 'kein code!' }))).toBeNull()
    expect(payloadFromInput('{ das ist kein JSON')).toBeNull()
  })

  it('nimmt Wege mit und haengt sie wieder an denselben Ball', () => {
    const original = createShot()
    const cue = original.balls[0]
    original.paths = [
      { id: 'p1', ballId: cue.id, role: 'cue', segments: [{ to: { x: 40, y: 30 } }] },
    ]
    const back = decodeShot(encodeShot(original))
    expect(back.paths).toHaveLength(1)
    // Neue Ids, aber dieselbe Zuordnung Weg -> Ball.
    expect(back.paths[0].ballId).toBe(back.balls[0].id)
    expect(back.paths[0].ballId).not.toBe(cue.id)
    expect(back.paths[0].segments[0].to).toEqual({ x: 40, y: 30 })
  })
})

describe('Fremde Nutzlast pruefen', () => {
  it('rechnet das Tempo einer alten Nutzlast in Tischlaengen um', () => {
    // Ein Link, der vor 0.19.2 geteilt wurde, tragt v: 1 und ein speed auf
    // der alten Skala 1..10. Ohne Umrechnung wuerde "Tempo 8" auf 5
    // Tischlaengen gedeckelt und "Tempo 2" halb so weit gelesen, wie es
    // gemeint war.
    const alt = decodeShot(payloadOf({ v: 1, shot: { attributes: { speed: 8 } } }))
    expect(alt.attributes.speed).toBe(speedFromLegacy(8))
    expect(alt.attributes.speed).toBe(4.25)
  })

  it('nimmt das Tempo einer neuen Nutzlast, wie es dasteht', () => {
    const neu = decodeShot(payloadOf({ v: 2, shot: { attributes: { speed: 2.25 } } }))
    expect(neu.attributes.speed).toBe(2.25)
  })

  it('ueberlebt leere Teilobjekte statt beim Zeichnen abzustuerzen', () => {
    const shot = decodeShot(payloadOf({ v: 1, shot: { attributes: {}, scoring: {}, target: {} } }))
    expect(shot.attributes.skills).toEqual([])
    expect(shot.attributes.spin).toEqual({ x: 0, y: 0 })
    expect(shot.attributes.difficulty).toBeGreaterThanOrEqual(1)
    expect(shot.scoring.thresholds).toEqual(DEFAULT_THRESHOLDS)
    expect(shot.target.pocketId).toBeNull()
    expect(shot.balls.length).toBeGreaterThan(0)
  })

  it('ersetzt erfundene Aufzaehlungswerte und wirft leere Wege weg', () => {
    const shot = decodeShot(
      payloadOf({
        v: 1,
        shot: {
          attributes: { shotType: 'teleport', skills: ['draw', 'fliegen', 7] },
          target: { pocketId: 'nirgendwo', cheat: 99 },
          paths: [
            { id: 'a', ballId: null, role: 'boese', from: { x: 10, y: 10 }, segments: [{ to: { x: 20, y: 20 } }] },
            { id: 'b', ballId: null, role: 'cue', segments: [] },
          ],
        },
      }),
    )
    expect(shot.attributes.shotType).toBe('cut')
    expect(shot.attributes.skills).toEqual(['draw'])
    expect(shot.target.pocketId).toBeNull()
    expect(shot.target.cheat).toBe(1)
    expect(shot.paths).toHaveLength(1)
    expect(shot.paths[0].role).toBe('cue')
  })

  it('holt Baelle auf die Spielflaeche und vergibt neue Ids', () => {
    const shot = decodeShot(
      payloadOf({ v: 1, shot: { balls: [{ id: 'x")>&', kind: 'cue', x: 1e9, y: -50 }] } }),
    )
    expect(shot.balls).toHaveLength(1)
    // Fremde Ids landen sonst in url(#...) und zerlegen das SVG.
    expect(shot.balls[0].id).not.toBe('x")>&')
    expect(shot.balls[0].x).toBeLessThanOrEqual(100)
    expect(shot.balls[0].y).toBeGreaterThanOrEqual(0)
  })

  it('kuerzt Texte und wirft Fremdes aus Listen', () => {
    const shot = decodeShot(
      payloadOf({ v: 1, shot: { name: 'N'.repeat(500), tags: ['gut', 5, null, 'auch gut'] } }),
    )
    expect(shot.name).toHaveLength(120)
    expect(shot.tags).toEqual(['gut', 'auch gut'])
  })

  it('behaelt die Reihenfolge der Faehigkeiten und entdoppelt sie', () => {
    const original = createShot()
    // Die Marken stehen in der Reihenfolge des Absenders am Stoss; die
    // Pruefung darf sie nicht umsortieren.
    original.attributes.skills = ['rail', 'cut', 'rail']
    expect(decodeShot(encodeShot(original)).attributes.skills).toEqual(['rail', 'cut'])
  })

  it('meldet eine Nutzlast ohne Stoss verstaendlich', () => {
    expect(() => decodeShot(payloadOf({ v: 1 }))).toThrow(/nicht lesen/)
  })

  it('weist eine Nutzlast ab, die sich auf Megabyte aufblaeht', () => {
    const bombe = payloadOf({ v: 1, shot: { name: 'a'.repeat(2 * 1024 * 1024) } })
    // Kurzer Link, riesiger Inhalt - genau das soll die Grenze abfangen.
    expect(bombe.length).toBeLessThan(4000)
    expect(() => decodeShot(bombe)).toThrow(/zu gro/)
  })

  it('weist eine ueberlange Nutzlast ab, ohne sie zu entpacken', () => {
    expect(() => decodeShot('A'.repeat(49 * 1024))).toThrow(/zu gro/)
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

describe('Die Sperrzone beim Teilen', () => {
  it('kommt mit und bleibt an ihrem Platz', () => {
    const original = createShot()
    original.scoring.avoidZone = { x: 30, y: 12, r: 7 }

    const zurueck = decodeShot(encodeShot(original))

    expect(zurueck.scoring.avoidZone).toEqual({ x: 30, y: 12, r: 7 })
  })

  it('bleibt weg, wenn der Stoss keine hat - das Feld darf nicht entstehen', () => {
    // Ein zusaetzliches Feld aenderte den Fingerabdruck jeder mitgelieferten
    // Uebung (siehe seedStamp.ts). Deshalb null und undefined pruefen.
    const ohne = decodeShot(encodeShot(createShot()))
    expect('avoidZone' in ohne.scoring).toBe(false)

    const fremd = decodeShot(payloadOf({ v: 1, shot: { scoring: { avoidZone: null } } }))
    expect('avoidZone' in fremd.scoring).toBe(false)
  })

  it('holt eine unsinnige Sperrzone auf den Tisch zurueck', () => {
    const fremd = decodeShot(
      payloadOf({ v: 1, shot: { scoring: { avoidZone: { x: 9999, y: -40, r: 500 } } } }),
    )
    const sperre = fremd.scoring.avoidZone
    expect(sperre).toBeTruthy()
    expect(sperre!.x).toBeLessThanOrEqual(100)
    expect(sperre!.y).toBeGreaterThanOrEqual(0)
    expect(sperre!.r).toBeLessThanOrEqual(25)
  })
})

/**
 * Die Stufe ueberlebt den Weg nach draussen und zurueck.
 *
 * Nicht nur das Teilen haengt daran: eine eingelesene Sicherung geht durch
 * dasselbe sanitizeShot (data/repositories/restore.ts). Fiele die Stufe dort
 * weg, verlaeren alle selbst eingestuften Uebungen beim Einspielen einer
 * Sicherung ihre Einordnung.
 */
describe('Die Stufe beim Teilen', () => {
  it('kommt mit', () => {
    expect(decodeShot(encodeShot(createShot({ level: 'C' }))).level).toBe('C')
  })

  it('bleibt weg, wenn die Uebung keine hat - das Feld darf nicht entstehen', () => {
    // Ein Feld mehr im Stoss aenderte den Fingerabdruck jeder mitgelieferten
    // Uebung. Dieselbe Regel wie bei der Sperrzone.
    expect('level' in decodeShot(encodeShot(createShot()))).toBe(false)
  })

  it('wirft eine erfundene Stufe weg, statt sie zu raten', () => {
    const payload = payloadOf({ v: 1, shot: { ...createShot(), level: 'Z' } })
    expect('level' in decodeShot(payload)).toBe(false)
  })
})
