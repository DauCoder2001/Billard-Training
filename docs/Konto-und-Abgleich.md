# Konto und Abgleich über mehrere Geräte

Stand: 09.10.2026 · **Konzept**, noch nicht umgesetzt · Matthias und Claude

## Ziel

Wer sich in der Trainings-App mit seinem CueDesk-Konto anmeldet, hat seine
Trainingsdaten auf allen Geräten: Tablet im Verein, Handy, Rechner zu Hause.
Ohne Anmeldung bleibt alles wie heute, nur auf dem Gerät.

## Entscheidungen vom 09.10.2026

| Nr. | Frage | Entscheidung |
|---|---|---|
| — | Wofür das Konto? | **Trainingsdaten je Konto auf dem Server**, damit sie auf mehreren Geräten da sind. Keine Verbindung zu Verein, Mitgliedschaft oder Rating. |
| T1 | Offline oder nur online? | **Offline zuerst:** Die App arbeitet wie heute mit dem Speicher im Browser und gleicht sich mit dem Server ab, sobald Netz da ist. Ein Training hängt nie an der Verbindung. |
| T2 | Mehrere Spielerprofile? | **Die Profile gehören dem angemeldeten Konto.** Wer angemeldet ist, sieht alle seine Profile auf allen seinen Geräten (auch ein Trainer mit Profilen für seine Schüler). |
| T3 | Ohne Anmeldung nutzbar? | **Ja, die Anmeldung ist freiwillig.** Beim ersten Anmelden werden die vorhandenen Daten des Geräts einmal ins Konto übernommen. |
| T4 | Reihenfolge? | **Erst die CueDesk-Produktion**, dann die Trainings-App mit derselben Datenbank. Entwickelt und getestet wird vorher gegen die Test-Datenbank. |

## Was abgeglichen wird

| Bereich | Abgleich | Bemerkung |
|---|---|---|
| Übungen (`shots`) | ja | auch die mitgelieferten, damit Favoriten, Änderungen und Löschungen überall gleich sind |
| Spielerprofile (`players`) | ja | mit Fähigkeitswerten und Erfolgen |
| Trainingseinheiten (`sessions`) | ja | mit jedem Versuch |
| Trainingspläne (`workouts`) | ja | |
| Einstellungen (`settings`) | **nein** | Tuchfarbe, Ausrichtung und aktives Profil hängen am Gerät (Vorschlag, siehe „Noch offen“) |

## Anmeldung

- Dieselben Konten wie in CueDesk. Ein Konto bekommt man nur auf Einladung
  eines Vereins; selbst registrieren kann man sich nicht.
- Anmeldung wie in CueDesk: Link per E-Mail, Code oder Passwort.
- Die Trainings-App bekommt in Supabase ihre Adresse als erlaubte
  Weiterleitung (`https://training.cuedesk.de/**`).
- **Nur echte Konten:** Die Tablets und Fernseher von CueDesk melden sich
  anonym an. Die Regeln der Datenbank lassen nur Konten mit E-Mail-Adresse
  zu, die in CueDesk als Benutzer geführt sind; anonyme Anmeldungen kommen an
  die Trainingsdaten nicht heran und können dort nichts ablegen.

## Datenbank (Teil von CueDesk)

Die Tabellen liegen in derselben Datenbank wie CueDesk. Die Migration gehört
deshalb ins CueDesk-Repository (`supabase/migrations/`), damit die Produktion
sie mit allen anderen Migrationen bekommt. Ablauf wie dort: Entwurf zeigen,
Probelauf, Einspielen erst nach „einspielen“, Tabellenrechte für
`authenticated`, Probelauf auch als angemeldeter Benutzer.

Vorschlag: eine Tabelle für alle Bereiche, der Inhalt als JSON.

| Spalte | Bedeutung |
|---|---|
| `konto_id` | Konto (`auth.uid()`), gesetzt von der Datenbank, nicht vom Gerät |
| `art` | `shot`, `player`, `session`, `workout` |
| `id` | Kennung des Eintrags aus der App |
| `inhalt` | der Eintrag als JSON, genau wie in der App |
| `geaendert` | Zeitpunkt der Änderung laut Gerät (für Konflikte) |
| `geloescht` | gelöscht ja/nein (damit andere Geräte von Löschungen erfahren) |
| `server_stand` | Zeitpunkt, zu dem der Server die Änderung bekommen hat (für das Abholen) |

- Schlüssel: Konto, Art und Kennung zusammen.
- Regeln (RLS): Jedes Konto liest und schreibt nur seine eigenen Zeilen; nur
  Konten mit E-Mail, die als aktive Benutzer geführt sind; keine anonymen.
- Obergrenze je Konto (z. B. 10 000 Einträge), damit niemand den Speicher
  des kostenlosen Tarifs füllt.
- Wird das Konto gelöscht, verschwinden auch seine Trainingsdaten.

Eine Tabelle mit JSON statt einer Tabelle je Bereich hat den Vorteil, dass
neue Felder in der App keine Migration der Datenbank brauchen.

## Abgleich in der App

Die App kapselt den Speicher schon heute in `src/data/repositories` (siehe
Kommentar in `src/data/db.ts`). Daran hängt sich der Abgleich an:

1. **Erweiterung des lokalen Speichers** (neue Dexie-Version): jeder Eintrag
   bekommt `updatedAt`, gelöschte Einträge bleiben als Löschvermerk stehen,
   bis der Server sie kennt. Dazu eine Merkliste „noch zu senden“ und der
   Zeitpunkt des letzten Abholens.
2. **Senden:** Alles aus der Merkliste geht in einem Schwung an den Server,
   sobald Netz da ist (beim Start, nach jeder Änderung mit kurzer Verzögerung,
   beim Wiederkehren der Verbindung).
3. **Abholen:** Alles, was der Server seit dem letzten Abholen bekommen hat,
   wird eingespielt.
4. **Konflikt** (derselbe Eintrag auf zwei Geräten geändert): Die jüngere
   Änderung gewinnt. Bei Trainingseinheiten kommt das praktisch nicht vor,
   weil jede Einheit nur auf einem Gerät entsteht.
5. **Anzeige:** kleiner Hinweis „abgeglichen“ / „wartet auf Verbindung“ und
   „angemeldet als …“, keine Störung beim Training.

**Erstes Anmelden auf einem Gerät mit Daten:** Die App fragt „Die Daten dieses
Geräts in dein Konto übernehmen?“. Ja: Sie werden hochgeladen und mit dem
Bestand des Kontos zusammengeführt (Kennungen sind eindeutig, nichts wird
überschrieben). Nein: Die Gerätedaten bleiben getrennt und werden nicht
abgeglichen.

**Abmelden:** Ausstehende Änderungen werden noch gesendet, dann entfernt die
App die Daten des Kontos vom Gerät; sie liegen ja auf dem Server. Wichtig für
gemeinsam genutzte Tablets im Verein.

## Umzug auf training.cuedesk.de

- Repository `DauCoder2001/Billard-Training`: Pages mit eigener Domain
  `training.cuedesk.de`, CNAME bei IONOS (wie bei `app.cuedesk.de`, Domain
  bei GitHub schon verifiziert).
- Adresse und öffentlicher Schlüssel der Datenbank als Variablen im Workflow
  `pages.yml` (nicht geheim, geschützt wird über die Regeln der Datenbank).
- **Vorher die Daten sichern:** Der Speicher im Browser hängt an der Adresse.
  Vor dem Umzug auf jedem Gerät die Sicherung als Datei ziehen (gibt es schon,
  `src/data/repositories/backup.ts`) und unter der neuen Adresse einspielen.
  Wer sich danach anmeldet, hat die Daten ab dann ohnehin auf dem Server.

## Datenschutz

- Die Trainingsdaten gehören der Person, nicht dem Verein. Verantwortlich ist
  der **Betreiber**, nicht der Verein; der Verein sieht sie nicht.
- In CueDesk: neuer Abschnitt in `datenschutz.html` (was, wozu, wie lange,
  wer sieht es), neue Tätigkeit A6 im Verzeichnis, Löschfrist: bis das Konto
  gelöscht wird oder die Person die Daten selbst löscht.
- Die Auskunft (Art. 15, 20) in CueDesk um die Trainingsdaten ergänzen; die
  Datei-Sicherung der App dient zusätzlich als Export.
- **Frage für die rechtliche Prüfung:** Ein Trainer legt Profile mit den
  Namen seiner Schüler an. Was gilt dann, und reicht ein Hinweis in der App,
  nur Vornamen oder Kürzel zu verwenden?
- Endet das CueDesk-Konto (z. B. Austritt aus dem Verein), enden auch die
  Trainingsdaten auf dem Server. Die Hilfe rät, vorher eine Sicherung als
  Datei zu ziehen.

## Schritte der Umsetzung

| Nr. | Schritt | Wer |
|---|---|---|
| 1 | CueDesk-Produktion einrichten (`docs/Produktion-einrichten.md` in CueDesk) | Matthias, Claude |
| 2 | Migration der Tabelle mit Regeln, Obergrenze und Tests, zuerst in die Test-Datenbank | Claude, nach „einspielen“ |
| 3 | Anmeldung in der App (freiwillig), Anzeige „angemeldet als …“ | Claude |
| 4 | Lokaler Speicher Version 2, Abgleich, Übernahme beim ersten Anmelden, Abmelden | Claude |
| 5 | Tests: zwei Geräte (zwei Browser), offline ändern, wieder online, Konflikt, Löschen, Abmelden | Claude, Matthias |
| 6 | Rechtstexte in CueDesk ergänzen, Vorher/Nachher zeigen | Claude |
| 7 | Umzug auf `training.cuedesk.de` mit Sicherung und Einspielen | Matthias, Claude |

## Noch offen

- **Einstellungen:** Vorschlag, sie je Gerät zu lassen (siehe oben). Falls
  einzelne Werte überall gleich sein sollen (z. B. Bewertungsschwellen),
  diese gezielt in den Abgleich nehmen.
- **Bilder oder größere Dateien:** Heute gibt es keine. Kämen welche dazu,
  bräuchte es Supabase Storage statt der Tabelle.
