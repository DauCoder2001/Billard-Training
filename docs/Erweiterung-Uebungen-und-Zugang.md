# Erweiterung: Sammlung, Stufen, Zugang

Stand: 26.11.2026 · **Konzept**, noch nicht umgesetzt · Matthias und Claude
Ausgangspunkt: `Konzept.md` (Desktop/Übungen) · App-Version beim Schreiben: 0.14.0

Dieses Dokument baut auf [Konto-und-Abgleich.md](Konto-und-Abgleich.md) auf.
Was dort schon entschieden ist, wird hier nicht neu verhandelt, sondern nur
ergänzt (Abschnitte 7 bis 9).

**Zur Sprache:** Eine **Übung** ist ein Aufbau in der Sammlung, den man
mehrfach spielt. Ein **Versuch** ist ein einzelner Durchgang daran, eine
**Einheit** sind alle Versuche einer Sitzung. Die **Stoßart** (Schnittball,
Bandenball …) beschreibt den Schlag, nicht die Übung. Siehe Abschnitt 2, E5.

---

## 1. Was heute steht

Gemessen am Quelltext, nicht geschätzt:

| Sache | Stand | Stelle |
|---|---|---|
| Mitgelieferte Übungen | **25**, aus der Geometrie gerechnet | `src/data/seed/drills.ts` |
| Schwierigkeit dieser 25 | 2 bis 9 von 10 — ein Querschnitt, kein Lernweg | ebd., Feld `difficulty` |
| Stufen / Niveaus | **gibt es nicht** | — |
| Fähigkeiten | 14 (`stun` … `position`) | `src/domain/types.ts:71` |
| Stoßarten | 8 (`cut` … `position`) | `src/domain/types.ts:107` |
| Erfolge | 16, aus der Historie gerechnet | `src/domain/achievements.ts` |
| Trainingspläne | frei anlegbar, nichts mitgeliefert | `src/features/workouts/` |
| Durchgänge je Einheit | 10 / 20 / 30 / frei (1 bis 200) | `src/domain/types.ts:249` |
| Speicher | nur im Browser (IndexedDB), kein Konto | `src/data/db.ts` |
| Rechte | keine — wer die App öffnet, darf alles | — |
| Adresse | `daucoder2001.github.io/Billard-Training/`, **reine Entwicklung** | `.github/workflows/pages.yml` |

**Befund zu den 25:** Sie tragen alle `tags: ['Grundübung']` und decken jede
Stoßart einmal ab. Als Querschnitt ist das richtig; als Anfängerstufe wäre es
falsch, denn der sehr dünne Schnitt (Schwierigkeit 9) steht gleich neben dem
Stop-Shot (Schwierigkeit 2).

---

## 2. Entscheidungen vom 26.11.2026

| Nr. | Frage | Entscheidung |
|---|---|---|
| E1 | Was ist eine Stufe? | **Ordnung und Filter.** Eine Übung trägt ihre Stufe; die Sammlung lässt sich danach sortieren und filtern. Nichts wird durch Fortschritt gesperrt, nichts muss „freigespielt" werden. |
| E2 | Darf die Version ohne Anmeldung weniger? | **Ja.** Ohne Anmeldung die 25 Übungen der Stufe A im Browserspeicher; B, C und D brauchen einen vom Verein angelegten Benutzer. |
| E3 | Womit fangen wir an? | **Erst Sammlung und Stufen.** Läuft ohne Server, ohne CueDesk-Produktion, bringt sofort Nutzen. Konto, Trainer und CueDesk-Button danach. |
| E4 | Wie wird Machbarkeit geprüft? | **Beides.** Der Baukasten warnt sofort bei geometrisch Unmöglichem; die 100 mitgelieferten Übungen werden einmalig außerhalb der App mit pooltool nachgerechnet. |
| E5 | Übung oder Stoß? | **Übung** für den Aufbau in der Sammlung — in der Oberfläche und hier. Das dreht die Festlegung vom 28.10.2026 um; Begründung in 2.2. |
| E6 | Wie viele Übungen? | **Vier Stufen à 25, zusammen 100.** Die heutigen 25 stecken darin. Die Zahl 25 ist ein Richtwert, kein Lehrplan: braucht C dreißig und A zwanzig, ist das kein Fehler. |

### 2.1 Ein Feld genügt

Ursprünglich waren zwei Felder geplant: die Stufe für die Didaktik und eine
Marke `free` für den Zugang. Das ist hinfällig, seit klar ist, dass die
heutige Adresse **reine Entwicklungsumgebung** ist — es gibt keine
Bestandsnutzer, denen eine Umsortierung etwas wegnehmen könnte.

Deshalb: **frei ist genau Stufe A.** Ein Feld (`level: 'A' | 'B' | 'C' | 'D'`),
und der freie Umfang ist `level === 'A'`. Das deckt sich mit „die ersten 25"
aus `Konzept.md` und ist zugleich eine zusammenhängende Anfängerstufe statt
eines Querschnitts.

### 2.2 Warum „Übung" und nicht „Stoß" (E5)

Am 28.10.2026 wurde festgelegt: „Stoß, auch für die mitgelieferten", und
„Übung" und „Drill" galten nicht mehr. Begründung damals: ein Begriff, eine
Sache.

Mit genau dieser Begründung wird es jetzt umgedreht. **„Stoß" trägt selbst
zwei Bedeutungen:** ein Stoß ist ein einzelner Schlag mit dem Queue — aber ein
Eintrag in der Sammlung ist ein Aufbau, den man zwanzig Mal spielt. „Zwanzig
Stöße an dieser Übung" ist richtig; die Sammlung „Stöße" zu nennen ist der
Fehler, den die Regel vermeiden wollte. Das Problem im Oktober war „Drill"
(Englisch, Fachjargon) — „Übung" wurde mit weggeworfen.

Neue Zuordnung, jede Sache ein Wort:

| Wort | Was es bezeichnet |
|---|---|
| **Übung** | der Aufbau in der Sammlung (vorher „Stoß") |
| **Versuch** | ein einzelner Durchgang daran (unverändert) |
| **Einheit** | alle Versuche einer Sitzung (unverändert) |
| **Stoßart** | die Art des Schlags: Schnittball, Bandenball, Kick … (unverändert) |

Gemessener Umfang: ~62 Anzeigetexte in 15 Dateien, dazu ~40 Stellen in den
Tests. Reine Textarbeit. Der Typ `Shot` im Quelltext bleibt, Kommentare und
Commit-Texte sind nicht betroffen.

---

## 3. Die Sammlung: 25 → 100

### 3.1 Einteilung

| Stufe | Thema | Schwierigkeit | heute | neu | zusammen |
|---|---|---|---|---|---|
| **A** | Grundschläge und Treffsicherheit | 1–4 | 6 | 19 | **25** |
| **B** | Kontrolle des Weißen und Winkel | 4–6 | 7 | 18 | **25** |
| **C** | Spielsituationen, Banden-Systeme, Safes | 6–8 | 12 | 13 | **25** |
| **D** | Spezialtechniken: Massé, Jump, Trickshots, Anstoß | 8–10 | 0 | 25 | **25** |
| | | | **25** | **75** | **100** |

Die heutigen 25 werden eingeordnet, nicht verändert — ihre Ballpositionen,
Wege und Schwellen bleiben, wie sie sind. Durchgezählt nach Thema und
Schwierigkeit:

| Stufe | Welche der heutigen 25 |
|---|---|
| A (6) | Stop-Shot kurz, Nachlauf mittel, Rückzieher kurz, Schnitt 15°, Schnitt 30°, Mitteltasche gerade |
| B (7) | Stop-Shot lang, Schnitt 45°, Mitteltasche im Schnitt, Bandenball Langbande, Kombination, Ball an der Bande, Position in die Kitchen |
| C (12) | Rückzieher lang, Schnitt 60°, Schnitt 75°, Bandenball Kurzbande, Kick, Karambolage, Seiteneffet links und rechts, Enge Position, Cluster öffnen, Safe, Lange Gerade |
| D (0) | — |

Zwei Dinge fallen dabei auf.

**Stufe D ist heute leer.** Massé, Jump, Trickshots und der Anstoß kommen in
der Sammlung nicht vor. Stufe D entsteht ganz neu — und braucht als einzige
Stufe Änderungen am Modell (3.6).

**Die Stufe folgt nicht der Schwierigkeit allein.** Der sehr dünne Schnitt mit
75° hat Schwierigkeit 9, gehört aber thematisch nach C: ein dünner Schnitt ist
eine Spielsituation, keine Spezialtechnik. Umgekehrt steht ein kleiner Massé
in D, auch wenn er leichter ist als manches in C. **Grundsatz: das Thema
bestimmt die Stufe, die Schwierigkeit ordnet innerhalb der Stufe.**

### 3.2 Stufe A — Grundschläge (6 heute + 19 neu)

Alles auf kurzer bis mittlerer Distanz, Treffpunkt in der Mitte oder knapp
darüber und darunter, keine Bande im Weg. Das ist die Stufe, die jeder ohne
Anmeldung bekommt — sie muss für sich allein ein sinnvolles Training sein.

- Gerader Ball aus zwei weiteren Entfernungen (2)
- Stop-Shot aus zwei weiteren Entfernungen (2)
- Nachlauf: Weißer 20 und 80 cm weiterlaufen lassen (2)
- Rückzieher: Weißer 40 und 80 cm zurückholen (2)
- Schnitt 10°, 20° — je nach links und rechts (4)
- Schnitt 15° und 30° nach der anderen Seite (2)
- Mitteltasche gerade aus einer zweiten Entfernung (1)
- Ball an der Bande, gerade (1)
- Durch die Lücke: Weißer zwischen zwei Störbällen hindurch (2)
- Wachsende Linie: Objektball startet nah und rückt weiter weg (1)

### 3.3 Stufe B — Kontrolle des Weißen (7 heute + 18 neu)

- Schnitt 40°, 50°, 60°, je links und rechts (6, davon 45° schon da → 5 neu)
- Tangentenlinie: nach dem Treffer eine vorgegebene Zone treffen (4)
- Zielzone klein (Radius 3 Zoll) auf zwei Entfernungen (2)
- Seiteneffet: Weißer über eine Bande in eine Zone (3)
- Bandenball über die Langbande aus zwei weiteren Winkeln (2)
- Ball an der Bande im Schnitt (1)
- Zwei-Ball-Kette: einlochen und auf den nächsten Ball Position spielen (1)

### 3.4 Stufe C — Spielsituationen (12 heute + 13 neu)

- **Banden-Systeme:** Kick über eine Bande nach dem Diamant-System, drei Lagen (3)
- Kick über zwei Banden (2)
- Bandenball über zwei Banden (1)
- **Safes:** an die Bande, über die Distanz, mit Rückzieher (3)
- Positionsketten über drei Bälle (2)
- Ball aus der Klemme lösen (gefrorener Ball) (1)
- Ball-in-Hand aus der Kitchen (1)

### 3.5 Stufe D — Spezialtechniken (25 neu)

- Massé: kleiner Bogen, großer Bogen, Bogen um einen Störball (3)
- Jump über einen Ball, über zwei Bälle (2)
- Kick über drei Banden (2)
- Trickshots, klassisch (5)
- Sehr dünner Schnitt 80° und 85° (2)
- Rückzieher über die ganze Tischlänge (2)
- 9-Ball-Anstoß aus drei Lagen des Weißen (3)
- 14.1: Anstoß und Eckball (2)
- Gefrorene Bälle an der Bande (2)
- Kombination über drei Bälle (2)

### 3.6 Was Stufe D am Modell verlangt

Stufe D geht mit dem heutigen Modell **nicht vollständig**. Drei Lücken:

| Lücke | Heute | Was fehlt |
|---|---|---|
| Jump | `elevation` gibt es (Grad), der Weg wird aber als Linie über den Tisch gezeichnet | Der Weg läuft durch einen Ball. Ohne eine Markierung „hier wird gesprungen" hält jede Machbarkeitsprüfung die Übung für unmöglich. |
| Massé | Der Weg kann über `curve` gebogen werden | Der Bogen ist darstellbar, der Grund dafür nicht: es fehlt der starke Seiteneffet bei hoher Queue-Erhöhung als eigene Angabe. |
| Stoßart und Fähigkeit | 8 Stoßarten, 14 Fähigkeiten | Es gibt weder `jump` noch `masse`. |

**Vorschlag:** `SHOT_TYPES` und `SKILL_TAGS` um `jump` und `masse` erweitern,
und ein Wegsegment bekommt neben `rail?: boolean` ein `air?: boolean` („hier
fliegt der Ball"). Trickshots brauchen keine eigene Stoßart; sie werden über
den Tag `Trickshot` gefunden.

**Folge für die Statistik:** Das Fähigkeitsnetz wächst von 14 auf 16 Achsen
(`src/features/stats/StatsPage.tsx:91`). Das Gesamtniveau bleibt richtig —
`overallRating` zählt nur, was einen Wert hat (`src/domain/skills.ts:58`). Die
Gefahr liegt beim Coach: `weakestSkills` zählt nie Geübtes als 0
(`skills.ts:77`) und würde jedem Anfänger Massé als „Schwachstelle"
vorschlagen. **Das muss mit Stufe D angepasst werden** — naheliegend über die
Stufe: Übungen einer Stufe weit über dem eigenen Niveau fallen aus den
Vorschlägen heraus.

### 3.7 Technische Folgen

Alles gemessen, nicht geschätzt:

| Punkt | Messung / Rechnung | Folge |
|---|---|---|
| Quelltext | 25 Spezifikationen = 12,3 kB / 426 Zeilen, also ~490 Byte je Übung | 100 ergeben ~49 kB / ~1700 Zeilen. **Eine Datei je Stufe** (`drills/stufe-a.ts` …), nicht eine Datei mit 1700 Zeilen. |
| Bundle | heute 537 kB im Hauptbundle (`dist/assets/index-*.js`) | +30 bis 35 kB, also etwa +6 %. Tragbar. Falls nicht: die Stufen B–D nachladen; Baukasten, Training und Teilen-Dialog kommen schon als eigene Dateien nach, das Nachladen ist eingespielt. |
| Startzeit | `seedShots()` rechnet alle Übungen bei jedem Start | 4× so viel reine Geometrie, im Millisekundenbereich. Kein Problem. |
| Einspielen | `SEED_VERSION` steht auf 2 (`src/data/bootstrap.ts:20`) | Auf **3** erhöhen, sobald neue Übungen dazukommen, sonst bleiben vorhandene Geräte bei 25. **Nicht** für die Stufen in 0.15.0: das Einspielen lässt eine eigene Fassung einer mitgelieferten Übung bewusst in Ruhe, die bekäme so nie eine Stufe. Dafür gibt es `migrateLevels()`, die beide erreicht. |
| Fingerabdruck | `templatePart` umfasst `tags`, `attributes`, `scoring` (`src/domain/seedStamp.ts:30`) | `level` gehört **nicht** hinein — wie `favorite`. Sonst bekäme jeder, der eine eigene Fassung einer der 25 Übungen hat, den Hinweis „Vorlage überarbeitet", ohne dass sich etwas geändert hat. |

---

## 4. Motivationsrunden je Stufe

Die Idee aus `Konzept.md`: pro Stufe eine neue Motivations-Runde. Das lässt
sich auf den vorhandenen Trainingsplan aufsetzen, ohne eine neue Datenart.

**Vorschlag: die Stufenprüfung.**

- Zehn Übungen aus der Stufe, je fünf Versuche — 50 Versuche, etwa eine halbe
  Stunde am Tisch.
- Bestanden ab einem Mittel von 60 % (die Schwelle `proficient`), einstellbar.
- Beliebig wiederholbar; das beste Ergebnis gilt.
- Am Ende ein Urteil, nicht nur eine Zahl: *Stufe B bestanden mit 68 %.*

Das braucht am Modell:

| Änderung | Wo | Umfang |
|---|---|---|
| `Workout` bekommt `level?` und `passScore?` | `src/domain/types.ts` | klein |
| Vier Prüfungen mitliefern | neu: `src/data/seed/exams.ts`, Aufruf in `bootstrap.ts` | mittel — heute wird kein Trainingsplan mitgeliefert |
| Urteil am Ende des Durchlaufs | `src/features/workouts/WorkoutRunPage.tsx` | klein |
| Vier Erfolge „Stufe A bestanden" … | `src/domain/achievements.ts`, 16 → 20 | klein, aus der Historie gerechnet (Einheiten mit der `workoutId` der Prüfung) |

Das passt zum bestehenden Grundsatz: Erfolge werden gerechnet, nicht
gespeichert — auch nach einem Import stimmen sie dann.

---

## 5. Machbarkeit prüfen (E4)

### 5.1 Im Baukasten, sofort

Eine reine Funktion über die Übung, die Hinweise zurückgibt — keine
Simulation. Gehört zu `src/domain/`, neben `geometry.ts`, und ist damit
testbar ohne Oberfläche.

| Prüfung | Warnt, wenn |
|---|---|
| Schnittwinkel | über 85° — darüber trägt der Ball praktisch nicht mehr |
| Sichtlinie | ein anderer Ball zwischen Weißem und Geisterball steht (außer bei `air`) |
| Ballweg | der Weg des Objektballs durch einen anderen Ball läuft |
| Queue frei | der Weiße so an der Bande klebt, dass der nötige Stoßwinkel nicht geht |
| Tasche erreichbar | die Linie Objektball → Taschenmündung von einem Ball verdeckt ist |
| Bälle getrennt | zwei Bälle sich überlappen |
| Bewertbar | es gibt schon (`isScorable`, `src/domain/scoring.ts:172`) |

Angezeigt wird das **als Hinweis, nicht als Verbot**: ein Trickshot darf
unmöglich aussehen. Farbe und Ort nach den Regeln, die für die Oberfläche
schon gelten.

### 5.2 Einmalig mit pooltool, außerhalb der App

Ein Skript unter `scripts/`, das alle 100 Übungen nach pooltool übersetzt,
jede mit dem angegebenen Tempo und Treffpunkt hundertmal mit kleiner Streuung
rechnet und ausgibt: Trefferquote und mittlere Ruhelage des Weißen.

Damit lassen sich drei Dinge belegen, die sich sonst nicht belegen lassen:

1. Geht die Übung mit dem angegebenen Tempo und Effet überhaupt auf?
2. Liegt die Zielzone dort, wo der Weiße wirklich hinkommt?
3. Passt die Schwierigkeit 1–10 zur gerechneten Trefferquote?

**Zum Tuch und zur Luftfeuchtigkeit** (Frage aus `Konzept.md`): Ja, beides
ändert die Bedingungen — ein altes, feuchtes Tuch rollt langsamer, nimmt
weniger Effet an, die Banden geben anders zurück. Trotzdem **kein Parameter in
der App**: Sie bewertet Treffer und Lage des Weißen, nicht absolute Kräfte, und
ein Schieberegler „Luftfeuchtigkeit" würde an keiner Zahl der App etwas ändern.
Richtig ist der Platz in der Nachrechnung: dort mit zwei Tuchzuständen rechnen
(neu und schnell, alt und langsam) und nur Übungen in die Sammlung nehmen, die
in **beiden** aufgehen. Dann hält jede mitgelieferte Übung in jedem
Vereinsheim.

---

## 6. Umzug auf eine eigene Adresse

Dieses ToDo stand noch in keinem Plan, gehört aber **nach vorn** — und zwar
aus einem technischen Grund: Der Browserspeicher (IndexedDB) hängt am
**Host**, nicht am Pfad. Nach dem Umzug leitet GitHub die alte Adresse auf die
neue um; die alten Daten liegen dann noch im Browser, aber keine erreichbare
Seite kann sie mehr lesen. Je später der Umzug, desto mehr Trainingsdaten
betrifft das.

**Erledigt am 26.11.2026 mit 0.14.2.** Die App läuft unter
`https://training.cuedesk.de`. Der CNAME steht bei IONOS und greift bei
Google, Cloudflare und Quad9, die Domain ist bei GitHub als verifiziert
geführt, das Zertifikat ist ausgestellt (bis 24.02.2027) und HTTPS wird
erzwungen. Auch `http://` leitet sauber um: an allen acht Knoten von GitHub
Pages nachgemessen, vier über IPv4 und vier über IPv6, jeder mit `301` und
`Server: GitHub.com`.

Eine Falle beim Nachprüfen: Ein 404 auf `http://training.cuedesk.de` kann am
eigenen Rechner liegen. Hier hielt die Verbindungsschicht von Windows noch die
alte IONOS-Adresse, obwohl DNS und Resolver längst den richtigen CNAME
lieferten — `ipconfig /flushdns` als Administrator räumt das weg. Zu erkennen
ist der Fall an der 404-Seite: ein nacktes nginx ohne GitHub-Gestaltung kommt
nicht von GitHub Pages.

Von: `https://daucoder2001.github.io/Billard-Training/`
Nach: `https://training.cuedesk.de`

### 6.1 Was zu tun war

| Schritt | Wo | Bemerkung |
|---|---|---|
| CNAME-Eintrag `training` → `daucoder2001.github.io` | IONOS | wie bei `app.cuedesk.de`; `cuedesk.de` ist bei GitHub schon verifiziert, deshalb genügt die Subdomain |
| `public/CNAME` mit `training.cuedesk.de` anlegen | Repository | Vite kopiert `public/` nach `dist/`, damit steht die Datei im Pages-Artifact und übersteht jede Veröffentlichung |
| Custom domain setzen | Settings → Pages | zusätzlich zur Datei, damit GitHub das Zertifikat ausstellt |
| HTTPS erzwingen | Settings → Pages | erst nach Ausstellung des Zertifikats anwählbar |
| Daten sichern und einspielen | in der App | einmal, nur die eigenen — die alte Adresse ist reine Entwicklung |

**Keine Codeänderung nötig:** `base: './'` in `vite.config.ts:13` erzeugt
relative Pfade. Die App läuft damit unter jeder Adresse und in jedem
Unterordner.

### 6.2 Was dadurch einfacher wird

Mit der eigenen Adresse ist die Voraussetzung aus Konto-und-Abgleich.md
erfüllt: Supabase braucht `https://training.cuedesk.de/**` als erlaubte
Weiterleitung für die Anmeldung. Solange die App unter `github.io` liegt,
müsste diese Adresse dort eingetragen werden — eine fremde Domain in der
Anmeldekonfiguration der Produktionsdatenbank. Der Umzug erspart das.

---

## 7. Zugang und Konto

### 7.1 Die drei Wege aus `Konzept.md`

| Weg | Was man bekommt | Was es braucht |
|---|---|---|
| **1. Frei im Browser** (`training.cuedesk.de`) | Stufe A (25 Übungen), Baukasten, Statistik, Erfolge — alles im Browserspeicher, nichts auf dem Server | nur den Umzug (6.) |
| **2. Vom Vereins-Tablet** (Button *Training* in CueDesk) | wie Weg 1, ohne Anmeldung am gemeinsamen Gerät | nur den Button in CueDesk |
| **3. Mit Vereins-Benutzer** | alle 100 Übungen, Daten auf allen Geräten, Statistik in CueDesk, Freigabe an den Trainer | Konto und Abgleich aus [Konto-und-Abgleich.md](Konto-und-Abgleich.md) |

### 7.2 Was die Sperre wirklich ist

Offen gesagt: Die App ist ein öffentliches Repository, und die Übungen stehen
als Spezifikation im Quelltext. Eine Sperre im Browser ist damit **kein
Kopierschutz**, sondern ein Angebot. Wer den Quelltext liest, kommt an die
Übungen — das sind ein Dutzend Leute weltweit, und die hätten sie sich auch
selbst aufgebaut.

Daraus folgt die einfache Umsetzung: **alle 100 liegen im Bundle.** Ohne Konto
erscheinen B, C und D in der Sammlung, aber gesperrt und mit einem Satz dazu —
*Mit deinem Vereins-Konto freigeschaltet.* Das wirbt für das Konto, statt die
Übungen zu verstecken.

Die Alternative — die 75 Übungen erst nach Anmeldung vom Server holen — wäre
eine echte Sperre, würde aber mit dem Grundsatz brechen, dass die Sammlung aus
der Geometrie gerechnet und nicht geladen wird. Nicht empfohlen, solange es
niemandem wehtut.

### 7.3 Der Button in CueDesk

Am Vereins-Tablet steht *Training* neben 8/9/10-Ball und 14.1 und führt auf
eine Zwischenseite mit zwei Angeboten: **Trainingsspiele** (Bowliard und
Ähnliches, zählen in CueDesk) und **Übungen** (diese App). Letzteres öffnet
`training.cuedesk.de` ohne Anmeldung — Weg 2.

Die Trainingsspiele gehören nach CueDesk, nicht hierher: sie zählen Punkte
eines Spiels, die App bewertet einzelne Versuche an einer Übung. Zwei Dinge,
zwei Orte.

---

## 8. Trainer und Rechte

### 8.1 Was „Schüler dürfen nichts ändern" heißen kann

In `Konzept.md` steht: Turnierleiter, Trainer und Vereins-Admin dürfen ändern,
Schüler nicht. Hier ist zu unterscheiden, denn **die mitgelieferten Übungen
liegen im Code, nicht in der Datenbank**. Niemand kann die Vorlage ändern —
wer eine mitgelieferte Übung bearbeitet, bekommt eine eigene Fassung
(`bootstrap.ts`, Regel beim Einspielen). Die Anforderung ist für die Vorlagen
also schon erfüllt.

Den Baukasten für Schüler zu sperren wäre eine **Verschlechterung**: selbst
Übungen aufbauen ist der Kern der App, und ein Schüler, der seine
Problemstellung vom Mittwoch nachbauen will, soll das dürfen.

**Vorschlag:** Die Sperre gilt genau für eines — **vom Trainer zugewiesene
Übungen sind schreibgeschützt.** Was der Schüler selbst baut, bleibt sein.

### 8.2 Was der Trainer braucht

| Funktion | Datenart | Neu gegenüber Konto-und-Abgleich.md |
|---|---|---|
| Ergebnisse eines Schülers ansehen | Freigabe des Schülers | **ja** — die geplante Regel lässt jedes Konto nur eigene Zeilen lesen |
| Übungen zuweisen | `assignment` (Trainer, Schüler, Übung, Anzahl, Frist) | **ja** — neue Art in der Tabelle |
| Eigene Übungen an die Gruppe geben | `shot` mit Freigabe an die Gruppe | **ja** |
| Analyse | nur Anzeige, rechnet aus vorhandenen Daten | nein |

**Die Freigabe gehört dem Schüler.** Er schaltet sie an und wieder aus; ohne
sie sieht der Trainer nichts. Technisch heißt das eine zweite Tabelle
(`freigaben`: Schüler, Trainer, ab wann) und eine Leseregel, die den Trainer
auf die Zeilen seiner freigebenden Schüler lässt. Das ist der einzige Punkt,
an dem dieses Konzept die Datenbank aus Konto-und-Abgleich.md erweitert.

### 8.3 Vorschläge nach Defiziten

Steht schon (`src/domain/coach.ts`): Der Coach gewichtet nie Geübtes, lange
nicht Geübtes, schwache Ergebnisse, schwache Fähigkeiten und die Passung zum
Niveau — und nennt bei jedem Vorschlag den Grund. Mit 100 Übungen trifft er
besser, weil er mehr Auswahl hat. Zu ergänzen ist nur die Stufe: eine Übung
aus Stufe D soll einem Anfänger nicht vorgeschlagen werden (siehe 3.6).

---

## 9. Nutzungsvereinbarung und Datenschutz

- Die Vereinbarung wird **beim ersten Anmelden** bestätigt, nicht beim ersten
  Öffnen: ohne Konto verlassen keine Daten das Gerät, da gibt es nichts zu
  vereinbaren.
- Der Text gehört nach CueDesk (neben die Datenschutzerklärung), die
  Bestätigung ins Konto (Datum und Fassung).
- Die Frage aus Konto-und-Abgleich.md bleibt offen und wird mit der
  Trainer-Rolle dringend: **Ein Trainer legt Profile mit Schülernamen an —
  und sieht nach Freigabe deren Ergebnisse.** Das ist mehr als vorher. Vor der
  Umsetzung von Abschnitt 8 rechtlich prüfen.

---

## 10. Die Datenbank-Frage

Aus `Konzept.md`: *Brauche ich für die Nutzer und die Ergebnisse wieder eine
neue Datenbank?*

**Nein.** Die Entscheidung steht in Konto-und-Abgleich.md: eine Tabelle in
derselben Supabase-Datenbank wie CueDesk, Inhalt als JSON, Migration im
CueDesk-Repository. Dieses Konzept ergänzt sie um:

- die Art `assignment` (Zuweisung) in der vorhandenen Tabelle — keine
  Migration des Aufbaus nötig, das ist der Vorteil von JSON;
- eine zweite, kleine Tabelle `freigaben` mit eigener Leseregel (8.2).

---

## 11. Reihenfolge und Versionen

Teil 1 läuft ohne Server und ohne CueDesk-Produktion (E3). Jede Zeile ist eine
ausgelieferte Fassung mit Eintrag im CHANGELOG.

### Teil 1 — Begriffe, Adresse, Sammlung

| Version | Schritt | Abhängig von |
|---|---|---|
| 0.14.1 ✓ | Oberfläche auf **Übung** umbenennen (E5), Notiz zu den Begriffen nachziehen | — |
| 0.14.2 ✓ | **Umzug auf `training.cuedesk.de`** (6.) — erledigt am 26.11.2026 | DNS bei IONOS |
| 0.15.0 ✓ | Feld `level`, Filter und Sortierung in der Sammlung, Stufe im Baukasten, die 25 eingeordnet (6/7/12/0) — erledigt am 26.11.2026 | — |
| 0.16.0 | Machbarkeitsprüfung im Baukasten (5.1) | — |
| 0.17.0 | Reihen-Generator im Baukasten: eine Folge aus einem Muster (Schnitt 10° bis 60° in Schritten) | 0.16.0 |
| 0.18.0 | Stufe A vollständig, 19 neue Übungen | 0.15.0, 0.17.0 |
| 0.19.0 | Stufe B vollständig, 18 neue | 0.18.0 |
| 0.20.0 | Stufe C vollständig, 13 neue mit Banden-Systemen und Safes | 0.19.0 |
| 0.21.0 | Modell für Spezialtechniken (3.6), dann Stufe D, 25 neue | 0.20.0 |
| 0.22.0 | Stufenprüfungen und vier neue Erfolge (4.) | 0.21.0 |
| 0.23.0 | Nachrechnung mit pooltool, Korrekturen an Zonen und Schwierigkeiten (5.2) | 0.22.0 |
| **1.0.0** | 100 Übungen, vier Stufen, vier Prüfungen, nachgerechnet, eigene Adresse | 0.23.0 |

Der Sprung auf 1.0.0 ist hier begründet: Die Sammlung ist vollständig, die
Übungen sind belegt, die App hat ihre Adresse und kann allein stehen. Alles
Weitere hängt am Server.

### Teil 2 — Konto, Verein, Trainer

| Version | Schritt | Abhängig von |
|---|---|---|
| 1.1.0 | Anmeldung (freiwillig), Sperrhinweis an B–D, Nutzungsvereinbarung | CueDesk-Produktion, Migration, 0.14.2 |
| 1.2.0 | Abgleich, Übernahme beim ersten Anmelden, Abmelden | 1.1.0 |
| 1.3.0 | Button *Training* am Vereins-Tablet (Arbeit in CueDesk) | 1.1.0 |
| 1.4.0 | Freigabe an den Trainer, Trainer-Ansicht, Analyse | 1.2.0, Rechtsprüfung |
| 1.5.0 | Zuweisungen durch den Trainer, schreibgeschützt beim Schüler | 1.4.0 |
| 1.6.0 | Statistik in CueDesk (Spieleübersicht) | 1.2.0 |

---

## 12. Noch offen

- **Coach und Stufe D:** `weakestSkills` zählt nie Geübtes als 0 und würde
  Massé jedem Anfänger vorschlagen (3.6). Zu lösen vor 0.21.0.
- **Progressive Übungen:** „Objektball rückt bei jedem Treffer weiter weg"
  (Stufe A) lässt sich mit dem heutigen Modell nur als mehrere Übungen bauen.
  Eine echte progressive Übung bräuchte ein neues Element. Zurückgestellt —
  erst in Stufe A so bauen, dann sehen, ob es stört.
- **Trickshots und die Bewertung:** Ein Trickshot hat keine sinnvolle Zielzone
  und keine Trefferquote von 60 %. Vielleicht gehören sie gar nicht ins
  Training, sondern in eine eigene Ecke „Zum Spaß", ohne Einfluss auf das
  Profil. Vor 0.21.0 entscheiden.
- **Zahl je Stufe:** 25 ist ein Richtwert (E6). Die genaue Aufteilung ergibt
  sich daraus, welche Übungen sinnvoll sind — nicht umgekehrt.
