/**
 * Die mitgelieferte Uebungssammlung.
 *
 * Eine Datei je Stufe (stufe-a.ts bis stufe-c.ts), hier zusammengefuehrt.
 * Die Reihenfolge innerhalb dieser Liste ist ohne Bedeutung: die Sammlung
 * sortiert selbst, und der Fingerabdruck einer Uebung haengt nur an ihr
 * selbst, nicht an ihrem Platz.
 *
 * Stufe D steht noch nicht hier. Sprung- und Masseschlaege kennt das
 * Datenmodell nicht: es fehlen die Stossarten und die Angabe, dass ein Ball
 * durch die Luft fliegt (Konzept 3.6).
 */

import { buildDrill } from './build'
import type { DrillSpec } from './build'
import { STUFE_A } from './stufe-a'
import { STUFE_B } from './stufe-b'
import { STUFE_C } from './stufe-c'
import { seedStamp } from '@/domain/seedStamp'
import type { Shot } from '@/domain/types'

const SPECS: DrillSpec[] = [...STUFE_A, ...STUFE_B, ...STUFE_C]

/**
 * Die Beschreibungen selbst, fuer Pruefungen.
 *
 * Nicht alles, was eine Beschreibung sagt, ist der fertigen Uebung noch
 * anzusehen: aus `cueAfter` wird eine Zielzone wie jede andere, und `since`
 * steht in keinem Shot. Beides gehoert geprueft, also muss es lesbar sein.
 */
export const SEED_SPECS: readonly DrillSpec[] = SPECS

let cache: Shot[] | null = null
let byId: Map<string, Shot> | null = null

/**
 * Die Uebungen. Werden einmal berechnet und danach wiederverwendet.
 *
 * Jede traegt den Stand ihrer Vorlage mit: daran erkennt die App spaeter,
 * ob eine uebernommene Fassung von einer aelteren Vorlage abstammt.
 */
export function seedShots(): Shot[] {
  if (!cache) cache = SPECS.map(buildDrill).map((s) => ({ ...s, seedStamp: seedStamp(s) }))
  return cache
}

/** Die heutige Vorlage zu einer Id - oder nichts, wenn es keine gibt. */
export function seedShotById(id: string): Shot | undefined {
  if (!byId) byId = new Map(seedShots().map((s) => [s.id, s]))
  return byId.get(id)
}

/**
 * Die Uebungen, die nach `version` dazugekommen sind.
 *
 * Das Gegenstueck zur Regel "ein geloeschter Stoss bleibt geloescht": wer
 * schon einmal eingespielt hat, bekommt sonst keine neue Uebung mehr, denn
 * eine neue und eine geloeschte fehlen beide im Bestand. Die Angabe `since`
 * in der Beschreibung unterscheidet die zwei Faelle (seedUpdates in
 * bootstrap.ts).
 */
export function seedIdsSince(version: number): Set<string> {
  return new Set(
    SPECS.filter((spec) => (spec.since ?? 1) > version).map((spec) => `builtin-${spec.slug}`),
  )
}
