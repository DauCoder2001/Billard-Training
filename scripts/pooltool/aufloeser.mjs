/**
 * Macht die Quelldateien der App fuer Node ausfuehrbar.
 *
 * Node 24 entfernt Typangaben aus .ts-Dateien von sich aus. Zwei Dinge
 * kennt es dabei nicht, die im Quelltext der App stehen:
 *
 * 1. den Pfad-Alias "@/" aus der tsconfig.json,
 * 2. Importe ohne Endung ("./build" statt "./build.ts") - fuer den
 *    Bundler normal, fuer Node ein Fehler.
 *
 * Diese Datei haengt beides an die Aufloesung an (haken.mjs) und erspart
 * dem Projekt ein zusaetzliches Werkzeug (tsx, vite-node) samt
 * Abhaengigkeit.
 *
 * Eingebunden mit: node --import ./scripts/pooltool/aufloeser.mjs <datei.ts>
 */
import { register } from 'node:module'

register('./haken.mjs', import.meta.url)
