/**
 * Fingerabdruck einer mitgelieferten Vorlage.
 *
 * Die mitgelieferten Uebungen werden nicht aus einer Datei gelesen, sondern
 * bei jedem Start aus einer Beschreibung gerechnet (data/seed/drills.ts). Bei
 * gleichem Programmstand kommt dabei immer dasselbe heraus. Deshalb braucht
 * keine Uebung eine von Hand gepflegte Versionsnummer: eine kurze Zeichenfolge
 * ueber alles, was die Vorlage bestimmt, aendert sich von selbst, sobald sich
 * an der Vorlage etwas aendert - und sei es eine Ballposition um einen
 * Millimeter.
 *
 * Jeder mitgelieferte Stoss traegt diesen Stand mit (Shot.seedStamp) und
 * behaelt ihn auch, wenn der Nutzer ihn uebernimmt. Steht im Stoss ein anderer
 * Stand als in der heutigen Vorlage, wurde die Vorlage seither ueberarbeitet.
 *
 * Gerechnet wird der Fingerabdruck immer nur aus der Vorlage, nie aus dem
 * gespeicherten Stand - der traegt ihn bloss weiter.
 */

import type { Shot } from './types'

/**
 * Die Felder, die die Vorlage bestimmt.
 *
 * Nicht dabei: id, builtIn, createdAt, updatedAt, favorite, level und
 * seedStamp selbst. Der Favorit ist eine Entscheidung des Nutzers, die
 * Zeitstempel sagen nichts ueber den Inhalt, und ein Fingerabdruck ueber sich
 * selbst waere nicht wiederholbar.
 *
 * Die Stufe fehlt aus demselben Grund wie die Sperrzone weiter unten: Sie
 * ordnet die Sammlung, sie beschreibt nicht den Stoss. Stuende sie hier,
 * haette das Einstufen der 25 mitgelieferten Uebungen jeden Fingerabdruck
 * geaendert - und jeder, der eine eigene Fassung einer Uebung gespeichert
 * hat, bekaeme den Hinweis auf eine ueberarbeitete Vorlage, ohne dass sich
 * an der Uebung etwas geaendert haette. Ein Test haelt das fest
 * (seedStamp.test.ts).
 */
function templatePart(shot: Shot): Record<string, unknown> {
  return {
    name: shot.name,
    description: shot.description,
    coachNotes: shot.coachNotes,
    tags: shot.tags,
    balls: shot.balls,
    paths: shot.paths,
    target: shot.target,
    attributes: shot.attributes,
    scoring: shot.scoring,
  }
}

/**
 * JSON mit sortierten Schluesseln.
 *
 * JSON.stringify haelt die Reihenfolge, in der die Felder angelegt wurden.
 * Die ist hier zwar festgelegt, aber darauf soll sich der Fingerabdruck nicht
 * verlassen muessen: ein umsortiertes Objekt ist derselbe Inhalt.
 */
function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`
  if (value !== null && typeof value === 'object') {
    const obj = value as Record<string, unknown>
    const paare = Object.keys(obj)
      .sort()
      .filter((k) => obj[k] !== undefined)
      .map((k) => `${JSON.stringify(k)}:${stable(obj[k])}`)
    return `{${paare.join(',')}}`
  }
  return JSON.stringify(value) ?? 'null'
}

/**
 * FNV-1a, 32 Bit, als acht Hexstellen.
 *
 * Ein Zusammenstoss zweier verschiedener Vorlagen ist praktisch
 * ausgeschlossen: selbst bei den geplanten 100 Uebungen liegt die
 * Wahrscheinlichkeit ueber 2^32 Werten bei etwa 1 zu 860 000 (100^2 / 2^33).
 * Schlimmste Folge waere, dass ein Hinweis ausbleibt - also genau das
 * Verhalten von vorher, nicht schlechter.
 */
function fnv1a(text: string): string {
  let hash = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

/** Der Stand einer Vorlage als kurze Zeichenfolge. */
export function seedStamp(shot: Shot): string {
  return fnv1a(stable(templatePart(shot)))
}

/**
 * Die Bereiche, in denen eine eigene Fassung von ihrer Vorlage abweichen kann.
 *
 * In Lesereihenfolge: was auf dem Tisch zu sehen ist, dann die Texte, dann
 * die Zahlen dahinter. Zusammen decken sie genau die Felder ab, die auch in
 * den Fingerabdruck eingehen.
 */
export const TEMPLATE_AREAS = [
  'layout',
  'name',
  'description',
  'coachNotes',
  'attributes',
  'scoring',
  'tags',
] as const

export type TemplateArea = (typeof TEMPLATE_AREAS)[number]

/**
 * Worin sich die eigene Fassung und die Vorlage unterscheiden.
 *
 * Gibt Bereiche zurueck, keine Einzelwerte: "die Ballpositionen sind andere"
 * hilft beim Entscheiden, eine Liste von Koordinaten nicht. Die Bilder
 * nebeneinander zeigen den Rest.
 *
 * Leer ist das Ergebnis, wenn die eigene Fassung inzwischen wieder genau der
 * Vorlage entspricht - moeglich, wenn beide Seiten dieselbe Aenderung gemacht
 * haben. Dann gibt es nichts zu entscheiden.
 */
export function templateDifferences(own: Shot, template: Shot): TemplateArea[] {
  const anders = (a: unknown, b: unknown) => stable(a) !== stable(b)
  return TEMPLATE_AREAS.filter((bereich) => {
    switch (bereich) {
      case 'layout':
        return anders(
          [own.balls, own.paths, own.target],
          [template.balls, template.paths, template.target],
        )
      case 'name':
        return own.name !== template.name
      case 'description':
        return own.description !== template.description
      case 'coachNotes':
        return own.coachNotes !== template.coachNotes
      case 'attributes':
        return anders(own.attributes, template.attributes)
      case 'scoring':
        return anders(own.scoring, template.scoring)
      case 'tags':
        return anders(own.tags, template.tags)
    }
  })
}

/**
 * Stammt die eigene Fassung von einer aelteren Vorlage ab?
 *
 * Nein, wenn der Stoss noch unveraendert mitgeliefert ist (dann holt ihn die
 * Aktualisierung der Sammlung ohnehin ein), wenn es zu seiner Id keine
 * Vorlage gibt (ein eigener oder ein geteilter Stoss), oder wenn er keinen
 * Stand mitbringt - dann ist nicht bekannt, von welcher Fassung er abstammt,
 * und Raten waere schlechter als Schweigen.
 */
export function hasNewerTemplate(shot: Shot, template: Shot | undefined): boolean {
  if (shot.builtIn === true) return false
  if (!template?.seedStamp || !shot.seedStamp) return false
  return shot.seedStamp !== template.seedStamp
}
