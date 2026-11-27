/** Tempo in Tischlaengen - die Einheit, in der am Tisch gezaehlt wird.
 *
 *  Das Tempo einer Uebung ist der Weg, den der Weisse von der Kopflinie aus
 *  allein rollen wuerde, ohne einen anderen Ball zu beruehren, gemessen in
 *  Tischlaengen. Tempo 1 ist der Stoss, der ihn einmal bis zur kurzen Bande
 *  traegt; Tempo 2 hin und zurueck; Tempo 4 ist der feste Stoss, mit dem man
 *  einen Cluster aufbricht. Tempo 0,5 ist der Touch-Ball, der in der
 *  Tischmitte liegen bleibt.
 *
 *  Bis 0.19.1 stand hier eine Zahl von 1 bis 10 ohne Einheit. Die
 *  Nachrechnung hat belegt, dass sie nichts bedeutete: "Stop-Shot kurz" und
 *  "Nachlauf 20 cm" standen beide auf 4 und verlangten 3,2 gegen 0,4 m/s.
 *
 *  Die Umrechnung ist gemessen, nicht geschaetzt
 *  (scripts/pooltool/tischlaengen.json, 48 Geschwindigkeiten):
 *
 *      0,5 Laengen = 0,39 m/s      2,5 Laengen = 1,85 m/s
 *      1,0 Laengen = 0,68 m/s      3,0 Laengen = 2,42 m/s
 *      1,5 Laengen = 0,97 m/s      3,5 Laengen = 2,85 m/s
 *      2,0 Laengen = 1,40 m/s      4,0 Laengen = 3,68 m/s
 */

/** Der Touch-Ball: bis zur Tischmitte. */
export const SPEED_MIN = 0.5

/** Mehr als vier Laengen ist Anstoss, nicht Training. */
export const SPEED_MAX = 5

/**
 * Viertel-Laengen.
 *
 * Halbe waeren die runderen Zahlen, kosten aber zu viel. Nachgerechnet am
 * 27.11.2026 (150 Versuche je Stufe): Auf halbe Laengen gerundet verlieren
 * die 38 Uebungen im Mittel 4,6 Punkte ihrer Guete, und im schlimmsten Fall
 * die ganze Aufgabe. "Nachlauf 20 cm" trifft bei 0,75 Laengen seine
 * Zielzone in 100 Prozent der gelochten Versuche, bei 1,00 Laengen in
 * keinem einzigen - gleiche Trefferquote, 62 Punkte Guete Unterschied.
 */
export const SPEED_STEP = 0.25

/** Die Zahl, wie sie in Texten steht: "2,25" statt "2.25".
 *
 *  Zwei Nachkommastellen, weil die Skala in Vierteln laeuft: Mit einer
 *  stuende auf der Uebungsseite "2,3 Tischlaengen", und der Schieber im
 *  Baukasten kennt diesen Wert gar nicht.
 */
export function speedNumber(speed: number): string {
  return speed.toLocaleString('de-DE', { maximumFractionDigits: 2 })
}

/** Ausgeschrieben, fuer die Uebungsseite: "zwei Tischlaengen". */
export function speedLabel(speed: number): string {
  if (speed === 1) return 'eine Tischlänge'
  return `${speedNumber(speed)} Tischlängen`
}

/** Was der Stoss im Spiel heisst - die Begriffe, die am Tisch fallen.
 *
 *  Die Namen haengen an den ganzen Laengen: 0,5 ist der Touch-Ball, 1 sanft,
 *  2 mittel, 3 fest, 4 hart. Ein Zwischenwert bekommt den Namen der
 *  naechstliegenden ganzen Laenge, die Grenzen liegen also in der Mitte -
 *  2,75 ist naeher an drei als an zwei und heisst darum "fest".
 */
export function speedName(speed: number): string {
  if (speed <= 0.75) return 'Touch'
  if (speed <= 1.5) return 'sanft'
  if (speed <= 2.5) return 'mittel'
  if (speed <= 3.5) return 'fest'
  return 'hart'
}

/** Alte Werte von 1 bis 10 in Tischlaengen, fuer selbstgebaute Uebungen.
 *
 *  Die alte Zahl bedeutete nichts. Die einzige definierte Ueberfuehrung ist
 *  die Formel, mit der das Pruefskript sie bisher gelesen hat
 *  (V0 = 0,5 + 0,45 * Tempo), und von dort ueber die gemessene Kurve in
 *  Tischlaengen. Aus 5 wird so 3,25.
 */
export function speedFromLegacy(alt: number): number {
  const v0 = 0.5 + 0.45 * alt
  // Gemessene Stuetzstellen (m/s -> Tischlaengen), dazwischen linear.
  const kurve: readonly (readonly [number, number])[] = [
    [0.3, 0.3], [0.5, 0.77], [0.7, 1.02], [0.9, 1.36], [1.1, 1.74],
    [1.4, 2.0], [1.7, 2.32], [2.1, 2.74], [2.6, 3.2], [3.2, 3.77],
    [4.0, 4.17], [4.8, 4.75],
  ]
  let laengen = kurve[kurve.length - 1][1]
  for (let i = 0; i < kurve.length - 1; i += 1) {
    const [v1, l1] = kurve[i]
    const [v2, l2] = kurve[i + 1]
    if (v0 <= v1) {
      laengen = l1
      break
    }
    if (v0 <= v2) {
      laengen = l1 + ((v0 - v1) / (v2 - v1)) * (l2 - l1)
      break
    }
  }
  const gerundet = Math.round(laengen / SPEED_STEP) * SPEED_STEP
  return Math.min(SPEED_MAX, Math.max(SPEED_MIN, gerundet))
}
