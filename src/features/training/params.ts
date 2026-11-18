/**
 * Die Angaben in der Adresse einer Trainingseinheit pruefen.
 *
 * Form und Umfang stehen als Abfrage in der Adresse (`?format=…&attempts=…`),
 * damit eine Einheit verlinkbar und nach dem Neuladen noch dieselbe ist. Was
 * dort steht, ist damit aber nicht mehr nur das, was die App selbst
 * geschrieben hat: eine von Hand geaenderte Adresse, ein alter Verweis oder
 * ein Tippfehler landen genauso hier. Beides wird deshalb geprueft, bevor es
 * in die Anzeige und in die gespeicherte Einheit geht.
 */

import { clamp } from '@/domain/geometry'
import { MAX_ATTEMPTS, MIN_ATTEMPTS, SESSION_ATTEMPTS, SESSION_FORMATS } from '@/domain/types'
import type { SessionFormat } from '@/domain/types'

/**
 * Die Form der Einheit. Alles, was nicht in der Liste steht, gilt als
 * "standard" - sonst stuende eine erfundene Form dauerhaft in der
 * gespeicherten Einheit und die Auswertung nach Form zaehlte sie nirgends mit.
 */
export function sessionFormat(raw: string | null): SessionFormat {
  return SESSION_FORMATS.includes(raw as SessionFormat) ? (raw as SessionFormat) : 'standard'
}

/**
 * Die geplante Anzahl Versuche als ganze Zahl in ihren Grenzen.
 *
 * Unsinn wird zur Standardlaenge: ohne diese Pruefung baut die Trainingsansicht
 * aus `attempts=1e9` eine Liste mit einer Milliarde Eintraegen - der Tab stirbt
 * am Speicher -, und `attempts=-5` ergibt eine Einheit, die bereits fertig ist,
 * bevor der erste Versuch erfasst werden kann. Eine zu grosse, aber gemeinte
 * Zahl wird dagegen nur gekuerzt.
 */
export function plannedAttempts(raw: string | null): number {
  const n = Math.round(Number(raw))
  if (!Number.isFinite(n) || n < MIN_ATTEMPTS) return SESSION_ATTEMPTS.standard
  return clamp(n, MIN_ATTEMPTS, MAX_ATTEMPTS)
}
