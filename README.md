# Billard Training

Eine Trainings-App für Poolbillard: eigene Übungen am Tisch aufbauen, sie
gezielt üben, die Ergebnisse festhalten und daraus sehen, woran zu arbeiten
ist.

Die App läuft vollständig im Browser. Es gibt keinen Server, kein Konto und
keine Cloud — alle Daten liegen in der lokalen Datenbank des Browsers
(IndexedDB) und lassen sich als JSON-Datei sichern.

Die mitgelieferten Übungen sind Standarddrills, deren Ballpositionen aus der
Tischgeometrie berechnet werden — aus Objektball, Zieltasche und gewünschtem
Schnittwinkel folgt die Lage des Weißen. Dadurch stimmen die Winkel exakt und
bleiben beim Anpassen nachvollziehbar.

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

**Statistik** — Verlauf je Übung, Fähigkeitsprofil als Netz, Tabelle aller
Übungen mit der schwächsten zuerst, Treffer- und Kratzerquote.

**Coach** — schlägt Übungen vor, die gerade am meisten bringen: nie geübte,
lange nicht geübte, schwache Ergebnisse, schwache Fähigkeiten, passend zum
Niveau. Jeder Vorschlag nennt seinen Grund.

**Workouts** — mehrere Übungen in fester Reihenfolge als eine Einheit.

**Erfolge** — 16 Meilensteine, aus der Historie berechnet.

**Teilen** — eine Übung steckt komprimiert im Link. Wer sie öffnet, bekommt sie
zum Übernehmen angeboten. Dazu ein QR-Code, das Diagramm als Bild und die Übung
als Datei, die sich unter *Geteilte Übung übernehmen* wieder einlesen lässt.

## Entwicklung

Die Versionsnummer steht an genau einer Stelle, in `package.json`, und wird
beim Bauen eingesetzt. Sichtbar ist sie unten in den **Einstellungen** und auf
der Fehlerseite. Was sich wann geändert hat, steht in
[CHANGELOG.md](CHANGELOG.md).

```bash
npm install
npm run dev
```

Gebraucht wird Node 22.12 oder neuer; ältere Fassungen lehnen die Werkzeuge ab.
Danach `http://localhost:5173` öffnen. Der Entwicklungsserver übersetzt die
TypeScript-Dateien beim Laden und aktualisiert bei jeder Änderung. Er hört nur
auf diesem Rechner.

Für die Probe auf dem Tablet muss er erst ans Netz gelassen werden:

```bash
npm run dev -- --host
```

Dann erreichen Geräte im WLAN ihn unter `http://<IP-des-Notebooks>:5173`.
Das gilt in beide Richtungen: Solange er läuft, kann jedes Gerät im selben
Netz ihn ansprechen. Deshalb ist es nicht die Voreinstellung.

### Wichtig: nicht die `index.html` im Projektordner öffnen

Das Projekt ist **kein statisches HTML**. Die `index.html` im Projektordner
ist nur die Vorlage für Vite; sie lädt `/src/main.tsx`, und TSX kann kein
Browser ausführen. Direkt geöffnet — per Doppelklick oder mit Live Server —
bleibt die Seite deshalb weiß.

| Was du öffnest | Ergebnis |
|---|---|
| `npm run dev`, dann `localhost:5173` | läuft, mit automatischem Neuladen |
| `dist/index.html` nach `npm run build`, über einen Server | läuft |
| `index.html` im Projektordner | leer |
| irgendeine Datei per `file://` (Doppelklick) | leer, Chrome blockiert ES-Module |

Mit dem Live Server aus VS Code lässt sich weiterarbeiten: erst
`npm run build`, dann `dist/index.html` mit Live Server öffnen. Das ist
derselbe Stand, der auch veröffentlicht wird.

| Befehl | Wirkung |
|---|---|
| `npm run dev` | Entwicklungsserver auf Port 5173, nur lokal |
| `npm run dev -- --host` | derselbe Server, auch für Geräte im WLAN |
| `npm run build` | Produktionsbuild nach `dist/` |
| `npm run preview` | den Produktionsbuild lokal ausliefern |
| `npm run lint` | statische Pruefung von `src` |
| `npm run test` | Tests der Rechenkerne |
| `npm run icons` | App-Icons neu erzeugen |

## Aufbau

```
src/
  domain/      Geometrie, Bewertung, Skill-Ratings, Coach, Erfolge, Teilen
  data/        Dexie-Schema, Repositories, mitgelieferte Übungen
  components/  Tischdiagramm als SVG
  features/    Seiten: Start, Übungen, Builder, Training, Statistik, …
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

## Über GitHub Pages veröffentlichen

Der Workflow `.github/workflows/pages.yml` baut die App bei jedem Push auf
`main` und veröffentlicht das Ergebnis. Einmalig nötig: im Repository unter
*Settings → Pages* als **Source** `GitHub Actions` wählen (nicht „Deploy from
a branch").

Wichtig: Pages liefert nur Dateien aus und baut nichts. Steht die Source auf
„Deploy from a branch / root", wird die `index.html` aus dem Projektordner
ausgeliefert — und die Seite bleibt weiß, weil sie `/src/main.tsx` lädt.
Deshalb kommt das gebaute `dist/` über den Workflow ins Netz und nicht ins
Repository.

Die App nutzt relative Pfade und einen Hash-Router und läuft daher auch unter
einem Unterpfad wie `https://<name>.github.io/Billard-Training/`. Da Pages
über HTTPS ausliefert, greift dort auch der Offline-Modus.

**Eigene Adresse.** `public/CNAME` nennt die Domain, unter der die App laufen
soll; Vite kopiert die Datei nach `dist/`, damit sie jede Veröffentlichung
übersteht. Damit das greift, muss die Domain bei GitHub als Custom domain
eingetragen sein **und** per DNS auf `<name>.github.io` zeigen. Fehlt der
DNS-Eintrag, leitet Pages die `github.io`-Adresse trotzdem schon auf die neue
Domain um — dann ist die App vorübergehend nicht erreichbar. Deshalb immer
zuerst den DNS-Eintrag setzen, dann die Datei ausliefern.

Zu beachten beim Wechsel der Adresse: Der Browserspeicher (IndexedDB) hängt am
Host, nicht am Pfad. Unter einer neuen Domain fängt die App mit leerem Speicher
an. Vorher **Einstellungen → Sicherung speichern**, danach unter der neuen Adresse
**Sicherung einspielen**.

### Anderswo ausliefern

`npm run build` erzeugt in `dist/` reine statische Dateien. Die App nutzt
relative Pfade und einen Hash-Router und läuft deshalb auf jedem Webserver,
auch in einem Unterverzeichnis.

Ein Service Worker macht die App nach dem ersten Aufruf offline nutzbar. Das
verlangt HTTPS oder `localhost`; über eine reine `http://`-Adresse registriert
der Browser keinen Service Worker, die App läuft dann nur online.

## Daten

Alles liegt im Browser des jeweiligen Geräts. Ein Tablet, das seinen Speicher
leert, verliert seine Trainingshistorie. Die Sicherung unter *Einstellungen →
Daten* ist die einzige Kopie und lässt sich auf einem anderen Gerät wieder
einspielen.

## Lizenz

[MIT](LICENSE) — Copyright (c) 2026 Matthias Haas.
