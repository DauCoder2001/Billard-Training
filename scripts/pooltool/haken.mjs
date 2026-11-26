/**
 * Der Auflöser selbst. Laeuft in einem eigenen Faden, deshalb eine eigene
 * Datei (siehe aufloeser.mjs).
 */
const wurzel = new URL('../../src/', import.meta.url).href

/** Hat der letzte Pfadteil eine Dateiendung? "./build" nein, "./build.ts" ja. */
function hatEndung(angabe) {
  const teil = angabe.split('/').pop() ?? ''
  return teil.includes('.') && !teil.startsWith('.')
}

export async function resolve(angabe, kontext, naechster) {
  if (angabe.startsWith('@/')) {
    const ziel = wurzel + angabe.slice(2) + (hatEndung(angabe) ? '' : '.ts')
    return { url: ziel, shortCircuit: true }
  }
  if (angabe.startsWith('.') && !hatEndung(angabe)) {
    try {
      return await naechster(angabe + '.ts', kontext)
    } catch {
      return await naechster(angabe + '/index.ts', kontext)
    }
  }
  return naechster(angabe, kontext)
}
