/** Textwerkzeuge der Oberflaeche. */

/**
 * Zahl und Hauptwort in der passenden Zahlform: "1 Versuch", "3 Versuche".
 *
 * Deutsch kennt nur Einzahl bei genau eins; die Null bekommt die Mehrzahl
 * ("0 Versuche"). Beide Formen stehen ausgeschrieben am Aufrufort, damit
 * die Meldung dort vollstaendig zu lesen ist.
 */
export function plural(n: number, einer: string, mehrere: string): string {
  return `${n} ${n === 1 ? einer : mehrere}`
}

/**
 * Schreibweise mit ae/oe/ue/ss, wie sie bis Oktober 2026 in der Oberflaeche
 * stand. Die Migration der mitgelieferten Stoesse vergleicht damit, ob ein
 * gespeicherter Text noch der alte ist oder vom Nutzer geaendert wurde.
 */
export function transliterate(text: string): string {
  return text
    .replace(/Ä/g, 'Ae')
    .replace(/Ö/g, 'Oe')
    .replace(/Ü/g, 'Ue')
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
}
