# Billard Training

Eine Trainings-App für Poolbillard: eigene Stöße am Tisch aufbauen, sie
gezielt üben, die Ergebnisse festhalten und daraus sehen, woran zu arbeiten
ist.

Die App läuft vollständig im Browser. Es gibt keinen Server, kein Konto und
keine Cloud — alle Daten liegen in der lokalen Datenbank des Browsers
(IndexedDB) und lassen sich als JSON-Datei sichern.

Als Vorbild diente das Video *„Create & Practice Any Pool Shot"* des Kanals
*Bullseye Billiards*. Nachgebaut ist die Funktionalität, nicht die App:
Katalog, Texte, Grafiken und Name von Bullseye Billiards sind nicht
übernommen. Die mitgelieferten Übungen sind eigene, aus der Geometrie
berechnete Standard-Drills.

## Was die App kann

**Shot Builder** — Bälle setzen und mit dem Finger ziehen (Einrasten auf das
Diamantenraster), Zieltasche antippen und in der Mündung „anschneiden",
Ballwege aus Segmenten zeichnen und über einen Griff zu Kurven biegen,
Bandenreflexionen anhängen. Dazu Stoßart, Schwierigkeit, Tempo, Treffpunkt
auf dem Weißen, Fähigkeiten, Bewertungsmodus, Schwellen und Coach-Hinweis.
Undo/Redo über den gesamten Editor, Spiegeln, Duplizieren.

**Training** — vier Formate (10 / 20 / 30 / frei). Pro Versuch wird die
Ruheposition des Weißen angetippt und dann *Eingelocht*, *Verfehlt* oder
*Kratzer* gewählt. Bewertet wird nach Treffer und Nähe zur Zielzone.

**Auswertung** — Verlauf je Stoß, Fähigkeitsprofil als Netz, Tabelle aller
Stöße mit dem schwächsten zuerst, Treffer- und Kratzerquote.

**Coach** — schlägt Stöße vor, die gerade am meisten bringen: nie geübte,
lange nicht geübte, schwache Ergebnisse, schwache Fähigkeiten, passend zum
Niveau. Jeder Vorschlag nennt seinen Grund.

**Workouts** — mehrere Stöße in fester Reihenfolge als eine Einheit.

**Erfolge** — 16 Meilensteine, aus der Historie berechnet.

**Teilen** — ein Stoß steckt komprimiert im Link. Wer ihn öffnet, bekommt ihn
zum Übernehmen angeboten. Dazu QR-Code, PNG-Export des Diagramms und JSON.

## Entwicklung

```bash
npm install
npm run dev
```

Danach `http://localhost:5173` öffnen. Der Entwicklungsserver übersetzt die
TypeScript-Dateien beim Laden und aktualisiert bei jeder Änderung. Er hört auf
allen Netzwerkadressen, die Tablets im WLAN erreichen ihn also unter
`http://<IP-des-Notebooks>:5173`.

### Wichtig: nicht die `index.html` im Projektordner öffnen

Anders als das Turnier-Projekt ist das hier **kein statisches HTML**. Die
`index.html` im Projektordner ist nur die Vorlage für Vite; sie lädt
`/src/main.tsx`, und TSX kann kein Browser ausführen. Direkt geöffnet — per
Doppelklick oder mit Live Server — bleibt die Seite deshalb weiß.

| Was du öffnest | Ergebnis |
|---|---|
| `npm run dev`, dann `localhost:5173` | läuft, mit automatischem Neuladen |
| `dist/index.html` nach `npm run build`, über einen Server | läuft |
| `index.html` im Projektordner | leer |
| irgendeine Datei per `file://` (Doppelklick) | leer, Chrome blockiert ES-Module |

Mit dem Live Server aus VS Code lässt sich weiterarbeiten: erst
`npm run build`, dann `dist/index.html` mit Live Server öffnen. Das ist
derselbe Stand, der auch auf den Pi kommt.

| Befehl | Wirkung |
|---|---|
| `npm run dev` | Entwicklungsserver auf Port 5173 |
| `npm run build` | Produktionsbuild nach `dist/` |
| `npm run preview` | den Produktionsbuild lokal ausliefern |
| `npm run test` | Tests der Rechenkerne |
| `npm run icons` | App-Icons neu erzeugen |

## Aufbau

```
src/
  domain/      Geometrie, Bewertung, Skill-Ratings, Coach, Erfolge, Teilen
  data/        Dexie-Schema, Repositories, mitgelieferte Übungen
  components/  Tischdiagramm als SVG
  features/    Seiten: Start, Bibliothek, Builder, Training, Statistik, …
  ui/          Dialoge und kleine Anzeigebausteine
```

Der Ordner `domain/` enthält reine Funktionen ohne Bezug zu React oder zur
Datenbank; dort liegen auch die Tests. `data/repositories/` kapselt jeden
Datenbankzugriff, damit später eine Synchronisierung dahinter treten kann,
ohne die Oberfläche anzufassen.

**Koordinatensystem:** Alle Positionen sind Zoll auf der Spielfläche eines
9-Fuß-Tischs, `x` 0–100 (Kopfbande links), `y` 0–50 (nach oben). Im SVG zeigt
`y` nach unten; die einzige Umrechnung dafür steht in
`components/table/space.ts`.

**Dialoge:** Die App verwendet kein natives `alert` / `confirm` / `prompt`.
Stattdessen `useDialogs()` aus `ui/Dialogs.tsx`.

## Auf dem Raspberry Pi ausliefern

```powershell
.\Deploy_Pi_vorbereiten.ps1
```

Das Skript baut die App und legt das Ergebnis unter `deploy\` ab. Der Inhalt
dieses Ordners kommt in das Web-Verzeichnis des Pi. Die App nutzt relative
Pfade und einen Hash-Router, funktioniert also in jedem Unterverzeichnis.

Ein Service Worker macht die App nach dem ersten Aufruf offline nutzbar. Das
verlangt HTTPS oder `localhost`; über eine reine `http://`-Adresse im WLAN
registriert der Browser keinen Service Worker, die App läuft dann nur online.

## Daten

Alles liegt im Browser des jeweiligen Geräts. Ein Tablet, das seinen Speicher
leert, verliert seine Trainingshistorie. Die Sicherung unter *Einstellungen →
Daten* ist die einzige Kopie und lässt sich auf einem anderen Gerät wieder
einspielen.
