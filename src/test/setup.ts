/**
 * Vorbereitung der Oberflaechentests.
 *
 * Laeuft vor jeder Testdatei des Profils "oberflaeche". Zwei Dinge fehlen
 * dort, die im Browser selbstverstaendlich sind:
 *
 * - Eine Datenbank. fake-indexeddb/auto haengt eine nachgebildete IndexedDB
 *   an das globale Objekt, bevor die erste Datei importiert wird - Dexie
 *   oeffnet sie wie die echte. Dadurch laufen die Repositories, der
 *   Bootstrap und useLiveQuery im Test mit, statt durch Attrappen ersetzt zu
 *   werden. Jede Testdatei bekommt ihre eigene, weil Vitest sie getrennt
 *   laufen laesst; innerhalb einer Datei raeumt frischeDatenbank() auf.
 * - Ein Fenster mit Abmessungen. Das bringt jsdom mit, aber ohne Layout:
 *   getBoundingClientRect liefert ueberall Null. Alles, was von Groessen auf
 *   dem Tisch abhaengt - das Ziehen im Baukasten, die Lage der Baelle -,
 *   laesst sich hier darum nicht pruefen. Das bleibt die Probe im Browser.
 */

import 'fake-indexeddb/auto'

/*
 * <dialog> nachruesten.
 *
 * jsdom kennt das Element samt seiner Marke "open" und blendet es ohne sie
 * aus - nur showModal(), show() und close() fehlen (Stand jsdom 31). Alle
 * Dialoge der App haengen daran (ui/Modal.tsx). Nachgebaut wird nur, was der
 * Test braucht: auf- und zuklappen. Die Dinge, fuer die ein echtes <dialog>
 * da ist - oberste Ebene, Fokusfalle, Escape, die Seite dahinter sperren -,
 * entstehen im Browser und bleiben hier aussen vor.
 */
if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
  const auf = function (this: HTMLDialogElement) {
    this.open = true
  }
  HTMLDialogElement.prototype.showModal = auf
  HTMLDialogElement.prototype.show = auf
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement, wert?: string) {
    if (!this.open) return
    this.open = false
    if (wert !== undefined) this.returnValue = wert
    this.dispatchEvent(new Event('close'))
  }
}
