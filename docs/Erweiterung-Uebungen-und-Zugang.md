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
| E6 | Wie viele Übungen? | **Vier Stufen à 25, zusammen 100.** Die heutigen 25 stecken darin. Die Zahl 25 ist ein Richtwert, kein Lehrplan: braucht C dreißig und A zwanzig, ist das kein Fehler. **Nachgezogen am 26.11.2026 (0.18.1):** Die Stufen werden *nicht* in einem Zug auf 25 aufgefüllt. Stufe A hat gezeigt, warum — um auf die Zahl zu kommen, entstehen Übungen, die nichts Neues zeigen (siehe 3.2). Die Sammlung wächst von hier an Stück für Stück, und jede neue Übung muss sich damit rechtfertigen, dass sie etwas übt, das keine andere übt. |

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

### 3.2 Stufe A — Grundschläge (6 + 14 = 20) ✓ 0.18.0

Alles auf kurzer bis mittlerer Distanz, Treffpunkt in der Mitte oder knapp
darüber und darunter, keine Bande im Weg. Das ist die Stufe, die jeder ohne
Anmeldung bekommt — sie muss für sich allein ein sinnvolles Training sein.

**Umgesetzt am 26.11.2026 mit 0.18.0.** Die Liste wurde beim Bauen an drei
Stellen nachgezogen; was gemessen wurde, steht dahinter. Danach fielen fünf
der 19 neuen Übungen wieder weg (0.18.1 und 0.18.2, siehe unten) — geblieben
sind 14, die Stufe hat damit 20.

| Geplant | Gebaut | Abweichung |
|---|---|---|
| Gerader Ball, zwei Entfernungen (2) | `gerade-nah`, `gerade-mittel` | — |
| Stop-Shot, zwei Entfernungen (2) | `stop-nah` (9"), `stop-mittel` (32") | — |
| Nachlauf 20 und 80 cm (2) | `nachlauf-20`, `nachlauf-50` | **80 → 50 cm.** „Nachlauf mittel" schickt den Weißen gemessene 73 cm weiter; 80 cm wäre fast dieselbe Übung. So entsteht die Folge 20 / 50 / 73 cm. |
| Rückzieher 40 und 80 cm (2) | `rueckzieher-30`, `rueckzieher-55` | **40/80 → 30/55 cm.** „Rückzieher kurz" holt den Weißen gemessene 77 cm zurück. Folge: 30 / 55 / 77 cm. |
| Schnitt 10°, 20° links und rechts (4) | `schnitt-10-rechts`, `schnitt-20-rechts` | **Nur eine Seite je Winkel** (0.18.1, siehe unten). |
| Schnitt 15° und 30° andere Seite (2) | — | **Gestrichen** (0.18.1, siehe unten). |
| Mitteltasche, zweite Entfernung (1) | `mitteltasche-weit` | — |
| Ball an der Bande, gerade (1) | `bande-gerade` | **Dicht, nicht fest.** Die Mündung der Ecktasche liegt 1,6" von der Bande weg, darum zeigt die Anspiellinie eines festliegenden Balles in die Bande hinein — für den Weißen bliebe dort kein Platz. Der Objektball liegt 2,5" von der Bande. |
| Durch die Lücke (2) | `luecke-breit` | **Nur eine** (0.18.2, siehe unten). Lücke zwischen den Ballkanten gemessen: 4,15". Die engere Fassung (3,15") steht als Variante im Hinweis. |
| Wachsende Linie (1) | `wachsende-linie` | Als kürzester Stand gespeichert; das Wachsen steht in den Trainerhinweisen (siehe 12, „Progressive Übungen"). |

### 3.2.1 Nachgezogen mit 0.18.1: keine Spiegelbilder

Die vier Übungen „nach links" sind wieder raus. Sie waren ihre Gegenstücke an
der Mittellinie gespiegelt — dasselbe Bild, dieselbe Aufgabe, nur
seitenverkehrt. In der Sammlung standen sie nebeneinander und sahen aus wie
ein Versehen.

**Die Regel, die daraus folgt:** Eine Übung muss etwas üben, das keine andere
übt. Die andere Seite ist kein eigener Inhalt, sondern ein Hinweis — der Satz
`ANDERE_SEITE` steht jetzt bei jedem Schnittball.

Damit ist auch der Namenswiderspruch weg: alle Schnittbälle heißen wieder
„Schnittball *n* Grad", ohne Richtung.

**Wo die Grenze liegt — zurückgenommen mit 0.18.3.** Hier stand, „Seiteneffet
links" und „Seiteneffet rechts" in Stufe C seien trotz gespiegelter Lage zwei
Übungen, weil ihre Zielzonen verschieden sind; der Test prüfte die Zielzone
deshalb mit. Das war falsch, siehe 3.2.3. Der Test vergleicht jetzt nur noch
die Lage.

### 3.2.2 Nachgezogen mit 0.18.2: keine zweite Übung für einen anderen Regler

„Durch die enge Lücke" ist raus. Sie war „Durch die Lücke" mit dichter
zusammengestellten Störbällen: gleicher Objektball, gleiche Tasche, gleicher
Winkel, nur die Lücke 3,15" statt 4,15". Derselbe Fall wie die
Spiegelbilder, eine Stufe allgemeiner.

**Die Regel, erweitert:** Wo zwei Aufbauten sich nur in einer Zahl
unterscheiden — Lücke, Entfernung, Zonengröße — ist das ein **Regler an
einer Übung**, keine zweite Übung. Der Regler gehört in den Hinweis
(„Klappt das sicher, die Störbälle enger zusammenstellen"), nicht in die
Liste.

**Der Test dazu** (`drills.test.ts`, „legt dieselbe Uebung nicht zweimal mit
anderem Regler an") hält zwei Übungen für dieselbe, wenn Objektball, Tasche,
Schnittwinkel, Ballzahl und Zielzone übereinstimmen. Die Entfernung des
Weißen zählt ausdrücklich **nicht** als Unterschied — sie ist der häufigste
Regler.

**Was er nicht greift:** Übungen mit verschobenem Objektball. In Stufe A
stehen weiterhin `gerade-nah`/`gerade-mittel`, drei Stop-Shots, drei
Nachläufe, drei Rückzieher und zwei Mitteltaschen-Übungen nebeneinander —
nach demselben Prinzip wären das fünf Übungen mit Reglern statt dreizehn. Das
bleibt offen, weil es an der Bewertung hängt: eine Variante, die nur im
Hinweis steht, lässt sich nicht getrennt zählen (siehe 12).

### 3.2.3 Nachgezogen mit 0.18.3: die Ausnahme war der Fehler

„Seiteneffet rechts" ist raus. Nachgemessen am 26.11.2026:

| | links | rechts | Spiegelbild von links |
|---|---|---|---|
| Weißer | (38,238 / 24,184) | (38,238 / 25,816) | **0,0000"** Abweichung |
| Objektball | (68 / 20) | (68 / 30) | **0,0000"** |
| Zieltasche | Ecke unten rechts | Ecke oben rechts | passt |
| Effet | seit −0,70 | seit +0,70 | passt |
| Schnittwinkel / Tempo / Schwierigkeit | 25° / 6 / 7 | 25° / 6 / 7 | gleich |
| Zielzone | (25 / 12) r9 | (55 / 45) r9 | wäre (25 / 38) — **30,81" daneben** |

**Der Schluss:** Ist der Aufbau das Spiegelbild — das Effet eingeschlossen —,
dann ist der Weg des Weißen das Spiegelbild, und die Zielzone muss es sein.
Zwei Zonen, die 30,81" auseinanderliegen, können nicht beide stimmen. Die
Beschreibungen behaupteten „verlängern" gegen „kurz halten", aber in den
Daten stehen bei beiden Tempo 6 und Effetstärke 0,70 — nichts macht den einen
Weg länger als den anderen.

**Dazu kommt:** Das Einzige, was die beiden inhaltlich hätte unterscheiden
können — linkes gegen rechtes Effet —, steht nirgends auf der Übungsseite.
Sie zeigt Art, Schwierigkeit, Tempo, Schnittwinkel, Zieltasche und
Fähigkeiten (`ShotDetailPage.tsx`); `spin` taucht nur im Baukasten auf. Auf
dem Gerät sah man zwei gespiegelte Bilder mit identischen Werten.

**Die Regel, endgültig:** Eine abweichende Zielzone macht aus einem
Spiegelpaar keine zweite Übung. Sie verrät einen Widerspruch. Der Test
vergleicht nur noch die Lage; die ganze Sammlung wurde danach abgesucht,
dieses war das einzige Spiegelpaar unter 39.

**Mit 0.19.0 beantwortet:** Welche der beiden Zonen richtig war, stand hier
als offene Frage — die App rechnet für diese Übung keinen Weg des Weißen
aus, die Zone ist von Hand gesetzt. Die Nachrechnung sagt es jetzt: Die
behaltene Zone liegt **24,3 Zoll** neben dem Ort, an dem der Weiße zur Ruhe
kommt. Von den beiden widersprüchlichen Zonen war **keine** richtig
(siehe [Nachrechnung-mit-pooltool.md](Nachrechnung-mit-pooltool.md)). **Mit
0.19.2 liegt sie auf (18,1 / 42)** — am gemessenen Ort.

### 3.3 Stufe B — Kontrolle des Weißen (7 heute + 18 neu)

- Schnitt 40°, 50°, 60°, je links und rechts (6, davon 45° schon da → 5 neu)
- Tangentenlinie: nach dem Treffer eine vorgegebene Zone treffen (4)
- Zielzone klein (Radius 3 Zoll) auf zwei Entfernungen (2)
- Seiteneffet: Weißer über eine Bande in eine Zone (3)
- Bandenball über die Langbande aus zwei weiteren Winkeln (2)
- Ball an der Bande im Schnitt (1)
- Zwei-Ball-Kette: einlochen und auf den nächsten Ball Position spielen (1)

### 3.4 Stufe C — Spielsituationen (11 heute, geplant + 13)

Die Stufe hatte 12; „Seiteneffet rechts" ist mit 0.18.3 zurückgenommen worden
(3.2.3). Die Liste unten ist der alte Plan und steht unter E6: sie wird nicht
in einem Zug abgearbeitet.

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
| Quelltext | 25 Spezifikationen = 12,3 kB / 426 Zeilen, also ~490 Byte je Übung | 100 ergeben ~49 kB / ~1700 Zeilen. **Eine Datei je Stufe** (`drills/stufe-a.ts` …), nicht eine Datei mit 1700 Zeilen. **Umgesetzt mit 0.18.0:** `drills/build.ts` (Rechnung), `stufe-a.ts` bis `stufe-c.ts`, `index.ts` (Zusammenführung). |
| Bundle | heute 537 kB im Hauptbundle (`dist/assets/index-*.js`) | +30 bis 35 kB, also etwa +6 %. Tragbar. Falls nicht: die Stufen B–D nachladen; Baukasten, Training und Teilen-Dialog kommen schon als eigene Dateien nach, das Nachladen ist eingespielt. |
| Startzeit | `seedShots()` rechnet alle Übungen bei jedem Start | 4× so viel reine Geometrie, im Millisekundenbereich. Kein Problem. |
| Einspielen | `SEED_VERSION` steht auf **6** (0.18.3) | Erhöhen, sobald neue Übungen dazukommen, sonst bleiben vorhandene Geräte bei 25. **Nicht** für die Stufen in 0.15.0: das Einspielen lässt eine eigene Fassung einer mitgelieferten Übung bewusst in Ruhe, die bekäme so nie eine Stufe. Dafür gibt es `migrateLevels()`, die beide erreicht. **Beim Erhöhen allein bleibt es nicht:** eine neue Übung fehlt im Bestand wie eine gelöschte, und gelöscht bleibt gelöscht. Deshalb trägt jede Beschreibung seit 0.18.0 die Angabe `since` (siehe `seedUpdates`). |
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
| Sichtlinie | ein anderer Ball zwischen Weißem und Geisterball steht (die Ausnahme `air` gibt es noch nicht — bis Stufe D meldet ein Sprungball hier einen Hinweis, der keiner ist) |
| Ballweg | der Weg des Objektballs durch einen anderen Ball läuft |
| Queue frei | der Weiße so an der Bande klebt, dass der nötige Stoßwinkel nicht geht |
| Tasche erreichbar | die Linie Objektball → Taschenmündung von einem Ball verdeckt ist |
| Bälle getrennt | zwei Bälle sich überlappen |
| Bewertbar | es gibt schon (`isScorable`, `src/domain/scoring.ts:172`) |

Angezeigt wird das **als Hinweis, nicht als Verbot**: ein Trickshot darf
unmöglich aussehen. Farbe und Ort nach den Regeln, die für die Oberfläche
schon gelten.

### 5.2 Einmalig mit pooltool, außerhalb der App ✓ 0.19.0

**Gebaut und einmal gelaufen am 26.11.2026.** Die Werkzeuge liegen unter
[`scripts/pooltool/`](../scripts/pooltool/README.md), die Befunde in
[Nachrechnung-mit-pooltool.md](Nachrechnung-mit-pooltool.md). Kurz: Die
Geometrie der App stimmt, die Schwierigkeitsskala trägt (r = −0,672), aber
13 von 25 Zielzonen liegen weiter weg, als sie Radius haben, zwei Übungen
gehen bei keiner Geschwindigkeit auf, und die Tempo-Angabe 1..10 hat keine
Bedeutung (r = 0,367 gegen das gemessene Tempo).

Der ursprüngliche Plan stand so da:

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
| 0.16.0 ✓ | Machbarkeitsprüfung im Baukasten (5.1) — erledigt am 26.11.2026 | — |
| 0.17.0 ✓ | Reihen-Generator im Baukasten: eine Folge aus einem Muster (Schnittwinkel oder Abstand des Weißen), Anspiel-Rechnung nach `domain/aim.ts` — erledigt am 26.11.2026 | 0.16.0 |
| 0.18.0 ✓ | Stufe A auf 25 Übungen, 19 neue — erledigt am 26.11.2026 | 0.15.0, 0.17.0 |
| 0.18.1 ✓ | Vier Spiegel-Übungen zurückgenommen, Hinweis statt eigener Übung; Stufe A hat 21 — erledigt am 26.11.2026 | 0.18.0 |
| 0.18.2 ✓ | „Durch die enge Lücke" zurückgenommen, Variante statt eigener Übung; Stufe A hat 20 — erledigt am 26.11.2026 | 0.18.1 |
| 0.18.3 ✓ | „Seiteneffet rechts" zurückgenommen, die Ausnahme im Spiegeltest aufgehoben; Stufe C hat 11, die Sammlung 38 — erledigt am 26.11.2026 | 0.18.1 |
| — | **Die Stufen B, C und D füllt Matthias Stück für Stück selbst.** Keine Auslieferung, die eine Stufe in einem Zug auf eine Zielzahl bringt (E6, 3.2.1, 3.2.2). | — |
| 0.19.0 ✓ | **Nachrechnung mit pooltool** (5.2), vorgezogen — erledigt am 26.11.2026. Werkzeuge unter `scripts/pooltool/`, Befunde in [Nachrechnung-mit-pooltool.md](Nachrechnung-mit-pooltool.md). Ändert nichts an der App | — |
| 0.19.1 ✓ | **Korrekturen aus der Nachrechnung** — erledigt am 27.11.2026. Bandenwege an der Umkehrlinie gespiegelt (vier Übungen), „Ball an der Bande" von der Bande weggerückt und damit spielbar, achte Prüfung `ghostOnTable`. Gemessen im Nachtrag von [Nachrechnung-mit-pooltool.md](Nachrechnung-mit-pooltool.md) | 0.19.0 |
| 0.19.2 ✓ | **Zielzonen und Tempo aus der Messung** — erledigt am 27.11.2026. Das Tempo steht in Tischlängen (gemessene Umrechnung), alle 38 Angaben neu gemessen, acht Zielzonen versetzt oder abgeschafft, acht Mal der Drall berichtigt. In 250 Versuchen je Übung wird jetzt jede Zielzone erreicht; vorher waren 20 von 25 unerreichbar. Die Fälle einzeln in [Zielzonen-Entscheidungen.md](Zielzonen-Entscheidungen.md) | 0.19.1 |
| 0.19.3 ✓ | **Schwierigkeiten nach der Messung** — erledigt am 27.11.2026. Nur die Ausreißer: die Stufe B über ihr Band 4–6 aufgefächert (alle sieben trugen die 6, bei einer Güte von 65 % bis 8 %) und „Safe hinter den Ball" von 8 auf 6, weil er von allen C-Übungen am leichtesten aufgeht. Rangkorrelation vorher: A −0,54, B nicht berechenbar, C −0,07. Offen bleiben die Reihenfolge innerhalb der Stufe C, der Schnittball 15 Grad (ein Tempo-Problem) und der Erfolg „Schweres Kaliber" | 0.19.2 |
| 0.20.0 | Modell für Spezialtechniken (3.6): `jump` und `masse` als Stoßart und Fähigkeit, `air` am Wegsegment — die Voraussetzung dafür, dass Stufe D überhaupt gebaut werden *kann* | — |
| 0.21.0 | Stufenprüfungen und vier neue Erfolge (4.) | 0.19.2, 0.20.0 |
| **1.0.0** | Vier Stufen mit tragfähigem Umfang, vier Prüfungen, nachgerechnet, eigene Adresse | 0.21.0 |

**Vorgezogen am 26.11.2026.** Die Nachrechnung stand als 0.21.0 am Ende. Nach
0.18.3 war belegt, dass mindestens eine Zielzone falsch war und die App nicht
sagen konnte, welche — aufgefallen nur, weil zufällig zwei gespiegelte
Übungen nebeneinander standen. Weitere Übungen (Stufe D) und eine Benotung
(Stufenprüfungen) auf diesem Fundament zu bauen hätte den Fehler
vervielfacht. Die Rechnung hat ihn bestätigt: 13 von 25 Zielzonen liegen
weiter weg, als sie Radius haben.

**Umgestellt am 26.11.2026.** Vorher stand hier eine Zeile je Stufe, die sie
auf 25 Übungen bringen sollte. Stufe A hat gezeigt, wohin das führt: um auf
die Zahl zu kommen, entstehen Übungen, die nichts Neues zeigen. Die Sammlung
wächst deshalb einzeln und nach Bedarf; die Auslieferungen hier sind die
Arbeiten, die **nicht** aus einzelnen Übungen bestehen.

Der Sprung auf 1.0.0 ist hier begründet: Die Sammlung trägt, die Übungen sind
belegt, die App hat ihre Adresse und kann allein stehen. Alles Weitere hängt
am Server.

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
  Massé jedem Anfänger vorschlagen (3.6). Zu lösen, sobald es Übungen der
  Stufe D gibt.
- **Progressive Übungen:** „Objektball rückt bei jedem Treffer weiter weg"
  (Stufe A) lässt sich mit dem heutigen Modell nur als mehrere Übungen bauen.
  Eine echte progressive Übung bräuchte ein neues Element. Zurückgestellt —
  erst in Stufe A so bauen, dann sehen, ob es stört.
- **Trickshots und die Bewertung:** Ein Trickshot hat keine sinnvolle Zielzone
  und keine Trefferquote von 60 %. Vielleicht gehören sie gar nicht ins
  Training, sondern in eine eigene Ecke „Zum Spaß", ohne Einfluss auf das
  Profil. Vor dem Modell für Spezialtechniken (0.20.0) entscheiden.
- **Zahl je Stufe:** 25 ist ein Richtwert (E6), und seit 0.18.1 kein Ziel
  mehr, auf das hin gearbeitet wird. Die Aufteilung ergibt sich daraus,
  welche Übungen sinnvoll sind — nicht umgekehrt.
- **Die Schwierigkeiten 1 bis 10** — mit 0.19.0 als Ausreißer erkannt, noch
  nicht nachgezogen. Vorgelegt wird jeder Fall einzeln; die Grundlage ist
  `scripts/pooltool/bericht.md` nach den Tempo-Korrekturen von 0.19.2.
- ~~**Das Tempo 1..10 hat keine Bedeutung**~~ — **mit 0.19.2 erledigt.** Es
  steht jetzt in Tischlängen, die Umrechnung in m/s ist gemessen
  (`scripts/pooltool/tischlaengen.json`), und alle 38 Angaben der Sammlung
  sind nachgemessen.
- **Die Bande spiegelt nicht, sie gibt nach.** Mit 0.19.1 zielt der Kick auf
  die richtige Linie, trifft den Objektball aber auch mit vollkommenem Stoß
  nur bei einer von sechs Geschwindigkeiten: Der Winkel einer echten Bande
  hängt vom Tempo ab, und die Geometrie rechnet mit einem einzigen. Entweder
  bekommt die Bande ein Modell, oder „Kick über eine Bande" darf nicht nach
  der Trefferquote bewertet werden. Zu entscheiden.
- **Effet ist auf der Übungsseite unsichtbar:** `spin` steht in den
  Eigenschaften der Übung, wird aber nur im Baukasten angezeigt. Für
  Seiteneffet-Übungen ist das die halbe Aufgabe. Zu entscheiden, ob die
  Übungsseite das Effet mit anzeigt — dann wäre auch belegbar, dass zwei
  Übungen sich darin unterscheiden.
- **Regler mit verschobenem Objektball:** Die Regel aus 3.2.2 ist nur zur
  Hälfte durchgezogen. In Stufe A stehen weiterhin `gerade-nah`/`gerade-mittel`,
  drei Stop-Shots, drei Nachläufe, drei Rückzieher und zwei
  Mitteltaschen-Übungen nebeneinander, die sich je nur in einer Entfernung
  unterscheiden. Nach der Regel wären das fünf Übungen mit Reglern statt
  dreizehn. Dagegen steht die Bewertung: eine Variante, die nur im Hinweis
  steht, hat keine eigene Trefferquote und keinen eigenen Verlauf — wer die
  20-cm-Stufe und die 73-cm-Stufe getrennt verfolgen will, braucht zwei
  Übungen. Zu entscheiden, bevor Matthias die Stufen B bis D füllt.
