/** Textwerkzeuge der Oberflaeche. */

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
