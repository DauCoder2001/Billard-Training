/**
 * Schreibt die mitgelieferten Uebungen so heraus, dass pooltool sie
 * nachrechnen kann.
 *
 * Die Rechnung der App kommt hier vollstaendig vor: Ballagen, Zielpunkt in
 * der Tasche und vor allem der Geisterball aus `domain/geometry.ts`. Genau
 * den soll die Nachrechnung pruefen - deshalb wird er hier mit ausgegeben
 * und drueben nicht neu gerechnet.
 *
 * Alle Masse in Zoll, Ursprung unten links, y nach oben (wie in der App).
 * Die Umrechnung nach Meter und in die Koordinaten von pooltool macht
 * nachrechnen.py.
 *
 * Aufruf:
 *   node --import ./scripts/pooltool/aufloeser.mjs scripts/pooltool/uebungen-ausgeben.ts
 */

import { writeFileSync } from 'node:fs'
import { TABLE, ghostBall, POCKET_BY_ID, pocketAimPoint } from '../../src/domain/geometry.ts'
import { seedShots } from '../../src/data/seed/drills/index.ts'
import type { Shot } from '../../src/domain/types.ts'

function umrechnen(shot: Shot) {
  const weisser = shot.balls.find((b) => b.kind === 'cue')
  const objekt = shot.balls.find((b) => b.id === 'obj')
  if (!weisser || !objekt) throw new Error(`${shot.id}: kein Weisser oder kein Objektball`)

  const tasche = POCKET_BY_ID[shot.target.pocketId]
  const zielpunkt = pocketAimPoint(tasche, shot.target.cheat)

  // Worauf der Objektball gespielt wird. Nicht immer die Tasche: beim
  // Bandenball ist es der Auftreffpunkt an der Bande, bei der Kombination
  // der zweite Ball. Die App haelt das im ersten Wegstueck fest - von dort
  // wird es gelesen, nicht neu gerechnet.
  const objektweg = shot.paths.find((p) => p.role === 'object')
  const objektziel = objektweg?.segments[0]?.to ?? zielpunkt

  // Worauf der Weisse gespielt wird. Beim Kick zuerst gegen eine Bande,
  // sonst auf den Geisterball.
  const weisserweg = shot.paths.find((p) => p.role === 'cue')
  const erstesStueck = weisserweg?.segments[0]
  const geisterball = ghostBall({ x: objekt.x, y: objekt.y }, objektziel)
  const anspielpunkt = erstesStueck?.rail === true ? erstesStueck.to : geisterball

  // Welcher Ball fallen muss. Bei der Kombination der zweite.
  const zweiter = shot.paths.find((p) => p.role === 'secondary')
  const zielball = zweiter?.ballId ?? objekt.id

  return {
    id: shot.id,
    name: shot.name,
    stufe: shot.level ?? null,
    schwierigkeit: shot.attributes.difficulty,
    tempo: shot.attributes.speed,
    stossart: shot.attributes.shotType,
    schnittwinkel: shot.attributes.cutAngle,
    ueberBande: objektweg?.segments[0]?.rail === true,
    ueberKick: erstesStueck?.rail === true,
    weisser: { x: weisser.x, y: weisser.y },
    objektball: { x: objekt.x, y: objekt.y },
    zielball,
    anspielpunkt,
    geisterball,
    objektziel,
    baelle: shot.balls
      .filter((b) => b.kind !== 'cue')
      .map((b) => ({ id: b.id, art: b.kind, x: b.x, y: b.y })),
    tasche: { id: tasche.id, name: tasche.label, punkt: zielpunkt },
    effet: shot.attributes.spin,
    erhoehung: shot.attributes.elevation,
    zone: shot.scoring.targetZone,
    wertung: shot.scoring.mode,
  }
}

const daten = {
  erzeugt: new Date().toISOString().slice(0, 10),
  tisch: {
    laenge: TABLE.length,
    breite: TABLE.width,
    ballradius: TABLE.ballRadius,
    eckenmaul: TABLE.cornerMouth,
    mittelmaul: TABLE.sideMouth,
  },
  uebungen: seedShots().map(umrechnen),
}

const ziel = new URL('./uebungen.json', import.meta.url)
writeFileSync(ziel, JSON.stringify(daten, null, 1) + '\n')
console.log(`${daten.uebungen.length} Uebungen geschrieben nach ${ziel.pathname}`)
