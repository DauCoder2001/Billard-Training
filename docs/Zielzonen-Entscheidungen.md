# Zielzonen, Tempo und Schwierigkeit — die Fälle für 0.19.2 und 0.19.3

Stand 27.11.2026. Grundlage: Messungen mit pooltool über die ganze
Tempo-Leiter — zuerst grob (0,4 bis 4,0 m/s, 11 Stufen, 40 bis 60 Versuche
je Stufe) und über einen Fächer von Treffpunkten, um zu finden, **woran** es
liegt; zum Schluss fein (0,5 bis 4,5 Tischlängen in Vierteln, 17 Stufen,
150 Versuche je Stufe) mit dem Drall, der dann in der Übung stand, um die
Zahl festzulegen, die ausgeliefert wird.

## Der Befund in einem Satz

Die meisten Zielzonen sind **nicht falsch gesetzt**. Sie sind unerreichbar,
weil die Übung den Stoß nicht beschreibt, der zu ihnen führt: vier Übungen
verlangen einen Stop-Shot und schreiben mittigen Treffpunkt vor, und bei
allen hängt die Ruhelage so stark am Tempo, dass die Angabe „Tempo 6" sie
nicht festlegt — sie hat ja keine Einheit.

Beispiel „Position in die Kitchen", Zone (15/25) mit Radius 10, der Weiße
über die Tempo-Leiter:

| Tempo | 1,1 m/s | 1,4 | 1,7 | 2,1 | 2,6 | 3,2 | 4,0 |
|---|---|---|---|---|---|---|---|
| Abstand zur Zone | 58,5" | 45,3" | 26,2" | 11,0" | **3,3"** | 15,5" | 74,6" |

Die Zone ist richtig. Sie ist bei genau einem Tempo zu treffen, und das
Tempo steht nirgends.

## A — Zone stimmt, es fehlt der Rückwärtsdrall (6 Übungen)

Alle sechs stehen auf `spin: {x: 0, y: 0}`. Ein Stop-Shot über 32 oder 55
Zoll Anlauf kann mit mittigem Treffpunkt nicht stehenbleiben; der Weiße
rollt in den Vorwärtslauf.

| Übung | Radius | heute | mit Effet y | Tempo | dann | Treffer |
|---|---|---|---|---|---|---|
| Mitteltasche gerade | 5" | 8,3" | −0,35 | 1,7 m/s | **0,5"** | 98 % |
| Stop-Shot mittel | 4" | 9,9" | −0,20 | 2,1 m/s | **1,7"** | 42 % |
| Stop-Shot lang | 5" | 9,3" | −0,35 | 2,6 m/s | **3,2"** | 30 % |
| Lange Gerade | 6" | 17,7" | −0,20 | 0,7 m/s | **5,4"** | 25 % |
| Schnittball 30 Grad | 8" | 8,6" | +0,50 | 1,4 m/s | **4,6"** | 40 % |
| Mitteltasche im Schnitt | 9" | 14,0" | −0,50 | 2,1 m/s | **3,1"** | 88 % |

Bei „Mitteltasche im Schnitt" liegt die Mitte zwar in der Zone, die Streuung
beträgt aber 16,5" — die einzelne Stellung bleibt Glückssache. Die anderen
fünf streuen 2 bis 4 Zoll.

## B — Zone stimmt, nur das Tempo ist falsch (2 Übungen)

Der Drall steht schon richtig drin.

| Übung | Radius | heute | bei | dann | Treffer |
|---|---|---|---|---|---|
| Rückzieher 30 cm | 4,5" | 8,2" | 1,4 m/s | **1,0"** | 70 % |
| Position in die Kitchen | 10" | 13,4" | 2,6 m/s | **3,3"** | 28 % |

## C — Mit keinem Stoß erreichbar (7 Übungen)

Hier hilft kein Effet und kein Tempo. Bestes Ergebnis über sieben
Effet-Kombinationen und elf Tempostufen:

| Übung | Radius | bestes | Streuung | Lage |
|---|---|---|---|---|
| Schnittball 45 Grad | 9" | 13,4" | **2,6"** | Ruhelage sehr gut vorhersagbar — nur die Zone sitzt falsch |
| Enge Position | 4" | 4,8" | 11,9" | Streuung dreimal so groß wie der Radius |
| Rückzieher kurz | 7" | 8,9" | 14,3" | 30 Zoll Rückweg sind zu viel verlangt |
| Seiteneffet über die Bande | 9" | 10,3" | 8,3" | mit umgekehrtem Effet 6,3" — aber das ist eine andere Übung |
| Rückzieher lang | 9" | 10,9" | 15,9" | 35 Zoll Rückweg |
| Safe hinter den Ball | 6" | 12,2" | 13,9" | nur mit Vorlauf und 4,0 m/s, dann unkontrolliert |
| Cluster öffnen | 7" | 10,5" | 27,0" | nach dem Cluster ist der Weg des Weißen Zufall |

Für diese sieben gibt es drei Wege, je nach Fall:

1. **Zone verschieben** auf die gemessene Ruhelage — sinnvoll, wo die
   Streuung klein ist. Das trifft nur auf „Schnittball 45 Grad" zu (2,6").
2. **Nur das Loch werten** (`mode: 'pocket'`) — wo der Weg des Weißen nach
   dem Treffen nicht zu steuern ist. Das trifft auf „Cluster öffnen" zu, und
   mit Abstrichen auf „Safe hinter den Ball".
3. **Die Stellung weniger weit stecken** — bei den beiden Rückziehern den
   Rückweg von 30 bzw. 35 Zoll auf das kürzen, was messbar erreichbar ist.

## Was dem im Weg stand: Das Tempo hatte keine Einheit

Die Gruppen A und B ließen sich nicht beheben, ohne dem Tempo eine Bedeutung
zu geben. „Tempo 6" muss eine Geschwindigkeit bezeichnen, sonst ist „bei
2,6 m/s trifft die Übung" keine Angabe, die sich in die Übung schreiben
lässt.

Mein erster Vorschlag war eine geometrische Leiter — jede Stufe 25 % über
der vorigen, `V0(t) = 0,4 · 10^((t−1)/9)`. Sie wäre bequem gewesen und hätte
nichts bedeutet. **Entschieden wurde anders, und richtiger:** Das Tempo ist
die Skala, die beim Billard ohnehin gelehrt wird — die Strecke, die der
Weiße von der Kopflinie aus allein über den Tisch rollt, in **Tischlängen**.

| Tempo | Weg | Name | Wofür |
|---|---|---|---|
| 0,5 | halbe Länge | Touch, Pocket-Speed | gefühlvolle Bälle am Loch |
| 1 | 1 Länge | sanft | Safes, weiches Einlochen |
| 2 | 2 Längen | mittel | Stellungsspiel, der Normalfall |
| 3 | 3 Längen | fest | langer Rückzieher, Cluster öffnen |
| 4 und mehr | 4+ Längen | hart | Break, Kraftstoß |

Die Umrechnung ist **gemessen**, nicht gesetzt: `tischlaengen.py` legt den
Weißen auf die Kopflinie, stößt ihn 48-mal mit steigender Geschwindigkeit an
und zählt den gerollten Weg. Eine Länge braucht 0,68 m/s, zwei 1,40, drei
2,42, vier 3,68.

Die bis dahin im Prüfskript angenommene Formel `V0 = 0,5 + 0,45·t` deckte
von 0,95 bis 5,0 m/s ab. Sie konnte die langsamen Übungen gar nicht
ausdrücken: „Lange Gerade" braucht 0,7 m/s, „Mitteltasche aus der
Entfernung" 0,55 — beides lag unter ihrem Tempo 1.

### Die Schrittweite kostet etwas, und zwar wie viel

Die Skala läuft in **Viertel-Längen**. Halbe wären die runderen Zahlen,
kosten aber zu viel: Auf halbe Längen gerundet verlieren die 38 Übungen im
Mittel 4,6 Punkte ihrer Güte. „Nachlauf 20 cm" trifft seine Zielzone bei
0,75 Längen in 100 Prozent der gelochten Versuche, bei 1,00 Längen in
keinem einzigen — bei praktisch gleicher Trefferquote (62 gegen 60 %).

### Die alten Werte der Nutzer

Wer eine eigene Fassung einer Übung gespeichert hat, hat dort noch ein
Tempo der alten Skala stehen. `speedFromLegacy()` rechnet es über die
gemessene Kurve um — alt 1 wird 1,5 Längen, alt 5 wird 3,25, alt 10 wird
4,75. Die Migration hängt an einem Zähler (`speedScaleVersion`) und nicht an
einer Prüfung des Werts, denn am Wert allein ist nicht zu erkennen, ob schon
gerechnet wurde: alt 2 ergibt 2 Längen.

## Was am Ende gesetzt wurde

Die feine Messung (150 Versuche je Tempostufe, bei knappen Faellen 250 je
Stufe und drei Saaten) hat drei der oben vermuteten Faelle anders
entschieden, als die grobe nahelegte. Das ist der Grund, warum sie lief.

### Der Drall: sieben Uebungen, nicht sechs

Zu den sechs aus Gruppe A kam **Stop-Shot kurz**. Dort war zweierlei
falsch. Erstens stand die Zielzone als Zahlenpaar (72,7 / 25) da und sollte
den Geisterball bezeichnen — die Stosslinie laeuft aber nicht waagerecht,
sondern zur Ecke, und der Geisterball liegt auf (73,41 / 26,59). Die Zone
rechnet die App jetzt selbst (`cueAfter`), wie beim grossen
Geschwisterstoss. Zweitens fehlte derselbe Rueckwaertsdrall wie dort: Die
Trefferquote bleibt bei jedem Treffpunkt 53 % — es ist ein gerader Ball —,
die Zielzone dagegen haengt an beidem. Bei −0,2 und 2,25 Laengen sind es
98 % Zonentreffer, bei mittigem Treffpunkt 0 bis 8 %.

Dazu bekam **Dünner Schnitt 60 Grad** Rückwärtsdrall: mit −0,5 statt
mittig steigt die Güte von 7 auf 17 Prozent (Zone 39 → 75 bis 89 %).

### „Mitteltasche im Schnitt" verliert seine Zielzone

In Gruppe A stand, mit −0,5 komme der Weiße bis auf 3,1 Zoll an die Zone —
gemessen am Mittelwert. Die Zonenquote sagt etwas anderes: Mit −0,5 wird
die Zone in 11 % der gelochten Versuche getroffen, mit mittigem Treffpunkt
in 27 %, und mehr ist auf dem ganzen Fächer aus sechs Treffpunkten und
fünfzehn Tempostufen nicht zu holen. Der Ball fällt in 83 % der Versuche,
bei jedem Treffpunkt und jedem Tempo — aber die Ruhelage streut um 16 Zoll.

Die alte Zone lag nur 5,5 Zoll von der mittleren Ruhelage und wurde
trotzdem in 16 % getroffen: Es ist die Streuung, nicht die Lage. Die Übung
wird darum **nur noch nach dem Loch gewertet**, wie „Cluster öffnen". Und
der Satz „mit Rückwärtsdrall bremst er auf der Tangente und bleibt in ihr"
ist aus der Übung heraus — er war falsch.

### „Schnittball 45 Grad": die Zone war nicht das Problem

Für diesen einen Fall stand in Gruppe C „Zone verschieben auf die
gemessene Ruhelage". Ausprobiert, und es half nicht: auf (34,8 / 30,9)
verschoben wird sie in 39 bis 48 % getroffen, auf (40 / 30) in 49 %. Sie
bleibt, wo sie war.

Der Grund für die niedrige Quote ist ein anderer, und mit einer Zielzone
nicht zu beheben: **Der Weiße fällt in 30 von 100 Versuchen selbst.** Ein
gefallener Weißer kann in keiner Zone liegen, also deckelt die Eigentor-Quote
die Zonenquote. Das ist eine Frage an den Aufbau. **Offen.**

### „Cluster öffnen": das Tempo nach der eigentlichen Aufgabe

Die Nachrechnung zählt gelochte Bälle, und das ist hier die halbe Aufgabe.
Eigens gemessen, wie oft die beiden Cluster-Bälle danach mehr als zwei
Ballbreiten auseinanderliegen (150 Versuche je Stufe):

| Tempo | bis 2,00 | 2,25 | 2,50 | ab 2,75 |
|---|---|---|---|---|
| Cluster offen | 0 bis 1 % | 65 % | 95 % | 97 bis 100 % |

Unter 2,25 Längen geht der Cluster also gar nicht auf, so sicher der Ball
auch fällt — und die Trefferquote ist über die ganze Leiter konstant 29 bis
33 %. Gesetzt sind 2,50: die sanfteste Stufe, bei der beides zusammen
gelingt.

### Wo 150 Versuche je Stufe nicht reichten

Bei **Position in die Kitchen** hängt die Zone scharf am Tempo: 3,00 Längen
bringen 42 bis 47 % Zonentreffer, 3,25 bringen 81 bis 83 %, 3,50 wieder 46
bis 49 % (je 250 Versuche, drei Saaten). Der Lauf mit 150 Versuchen hatte
3,00 vorgeschlagen — bei so steilen Flanken ist das Rauschen größer als der
Unterschied. Neun knappe Fälle wurden deshalb mit 250 Versuchen und drei
Saaten nachgeprüft; acht bestätigten die Wahl, dieser eine nicht.

## Die Schwierigkeiten — besprochen und entschieden (0.19.3)

Mit 0.19.2 nicht angefasst, am 27.11.2026 besprochen und in 0.19.3
entschieden: **nur die Ausreißer.** Grundlage ist
`scripts/pooltool/bericht.md` mit 250 Versuchen je Übung.

### Warum die Zahl zählt

Fünf Stellen lesen sie, und die beiden ersten waren bei der Besprechung der
Grund, überhaupt etwas zu ändern:

| Stelle | Was sie tut |
|---|---|
| `skills.ts:12` | `0.5 + 0.05 × Schwierigkeit` multipliziert den Score zum Rating-Ziel. 80 Punkte auf 8 ziehen das Rating in Richtung 72, dieselben 80 auf 4 nur in Richtung 56. |
| `coach.ts:149` | `abs(Schwierigkeit × 10 − Rating)`, davon ein Viertel als Abzug. Die Zahl wird als Niveau gelesen: 8 heißt „passt zu einem Spieler bei 80". |
| `achievements.ts:199` | „Schweres Kaliber": 80 Punkte auf einer Übung mit Schwierigkeit 8 oder höher. |
| `series.ts:185` | Serien interpolieren eine Leiter zwischen zwei Schwierigkeiten. |
| `LibraryPage.tsx:54` | Schieber „höchstens Schwierigkeit X" und Sortierung. |

Das Rating wird einmal am Ende einer Einheit geschrieben
(`repositories/sessions.ts:53`) und nie aus der Historie neu gerechnet. Eine
geänderte Schwierigkeit wirkt also nur vorwärts.

### Wie weit die Zahl von der Messung weg war

Rangkorrelation (Spearman) zwischen Schwierigkeit und Güte:

| Stufe | Spearman | |
|---|---|---|
| A | −0,54 | richtiges Vorzeichen, mäßig — bleibt |
| B | nicht berechenbar | alle sieben Übungen tragen die 6 |
| C | −0,07 | kein Zusammenhang |

### Gesetzt wurde

| Übung | Stufe | alt | neu | Güte |
|---|---|---|---|---|
| Mitteltasche im Schnitt | B | 6 | **4** | 65 % |
| Ball an der Bande | B | 6 | **4** | 47 % |
| Position in die Kitchen | B | 6 | **5** | 24 % |
| Stop-Shot lang | B | 6 | **5** | 21 % |
| Bandenball Langbande | B | 6 | **5** | 19 % |
| Schnittball 45 Grad | B | 6 | 6 | 8 % |
| Kombination | B | 6 | 6 | 8 % |
| Safe hinter den Ball | C | 8 | **6** | 79 % |

Sechs Übungen, sechs neue Fingerabdrücke. Die 4 der Mitteltasche im Schnitt
steht an der Grenze zur Stufe A; die Bänder überlappen mit Absicht
(Konzept 3.1). Dass der Weiße dort in 26 von 100 Versuchen fällt, ist in
den 65 % bereits abgezogen — die Güte multipliziert die Fehlversuche weg.

### Bewusst nicht gesetzt

- **Die Reihenfolge innerhalb der Stufe C.** Zehn Übungen von 27 % bis 7 %
  tragen 7, 8 oder 9 ohne Bezug zur Messung. Zwei dieser Zahlen stehen aber
  selbst in Frage: beim Cluster sieht die Nachrechnung nur das Einlochen,
  nicht ob der Cluster aufgeht, und der Kick mit 7 % Treffern ist eher
  falsch aufgebaut als schwer. Eine Reihenfolge auf einer Messung, die man
  gerade anzweifelt, ist keine Verbesserung.
- **Schnittball 15 Grad** behält seine 3, obwohl er mit 16 % Güte die
  schwerste Übung der Stufe A ist. Dort ist nicht die Schwierigkeit das
  Problem, sondern das Tempo: 4,25 Tischlängen — Anstoßtempo — für einen
  15-Grad-Anschnitt, weil die Zielzone auf (60/12) liegt. Frage an den
  Aufbau, eigene Messung.
- **Der sehr dünne Schnitt mit 75 Grad** behält seine 9, obwohl das Band der
  Stufe C bei 8 endet. Das Konzept nennt ihn namentlich als die gewollte
  Ausnahme, und gemessen ist er dort auch die zweitschwerste Übung (12 %
  Güte, nur der Kick liegt darunter). Die Prüfung schreibt die Ausnahme
  jetzt fest, damit sie nicht aus Versehen verschwindet.
- **„Schweres Kaliber".** Nach dem Umzug des Safes gibt es fünf Übungen mit
  Schwierigkeit 8 oder höher; die beste davon schließt der gerechnete
  Spieler mit 28 Punkten ab, verlangt sind 80. Der Erfolg war aber auch
  vorher nur über den Safe erreichbar — und dort nur über eine zweite
  Eigenheit: `scoring.ts` gab im Modus `position` nur Punkte, wenn der
  Objektball gefallen ist (`result.pocketed ? pos * 2 : 0`), während der
  Safe ausdrücklich verlangt, ihn nicht zu lochen.

  **Die Wertung ist mit 0.19.4 berichtigt** (Weg B der Besprechung vom
  27.11.2026): der Modus wertet allein die Lage, ein Versuch hält fest, ob
  der Objektball berührt wurde, und am Tisch stehen „Ball liegt", „Ball
  gefallen" und „Nicht getroffen". Damit erreicht der gerechnete Spieler
  beim Safe mindestens 79 Punkte — die Zonenquote, und Ruhelagen knapp
  daneben zählen noch mit. Genau diese Lücke hat 0.19.3 geschlossen: der
  Safe trägt die 6 und zählt für den Erfolg nicht mehr mit.

  **Der Erfolg selbst bleibt offen.** Entweder die Punktschwelle sinkt, oder
  er hängt künftig an der Stufe statt an der Zahl. Keine
  Schwierigkeitsfrage.

Der Grundsatz aus dem Konzept (3.1) gilt weiter: **Das Thema bestimmt die
Stufe, die Schwierigkeit ordnet innerhalb der Stufe.** Also wird nicht die
Güte in eine Zahl von 1 bis 10 umgerechnet, sondern innerhalb jeder Stufe
nach Güte sortiert und über das Band der Stufe verteilt (A 1–4, B 4–6,
C 6–8).

### Die Rangfolgen, wie sie bei der Besprechung vorlagen

Die drei Tabellen sind der Stand, mit dem die Besprechung geführt wurde. Die
Spalte **nach Rang** ist die mechanische Aufteilung: Rangliste nach Güte, zu
gleichen Teilen über das Band der Stufe verteilt. Gesetzt wurde sie so nicht
— 0.19.3 folgt stattdessen den Sprüngen in der Güte. In Stufe B liegt der
größte bei 47 % → 24 %, weshalb „Position in die Kitchen" auf 5 steht und
nicht, wie die Tabelle vorschlägt, auf 4. Was entschieden wurde, steht oben
unter „Gesetzt wurde" und „Bewusst nicht gesetzt".

### Stufe A, Band 1–4

| Übung | Güte | heute | nach Rang |
|---|---|---|---|
| Gerader Ball nah | 99 % | 1 | 1 |
| Mitteltasche gerade | 72 % | 3 | 1 |
| Wachsende Linie | 70 % | 3 | 1 |
| Nachlauf 20 cm | 67 % | 2 | 1 |
| Ball an der Bande gerade | 67 % | 4 | 1 |
| Stop-Shot nah | 56 % | 2 | 2 |
| Stop-Shot kurz | 55 % | 2 | 2 |
| Durch die Lücke | 50 % | 3 | 2 |
| Schnittball 10 Grad | 46 % | 2 | 2 |
| Gerader Ball mittel | 44 % | 2 | 2 |
| Rückzieher 30 cm | 44 % | 2 | 3 |
| Nachlauf 50 cm | 43 % | 3 | 3 |
| Schnittball 20 Grad | 40 % | 3 | 3 |
| Mitteltasche aus der Entfernung | 32 % | 4 | 3 |
| Nachlauf mittel | 31 % | 3 | 3 |
| Rückzieher 55 cm | 27 % | 3 | 4 |
| Rückzieher kurz | 26 % | 4 | 4 |
| Schnittball 30 Grad | 25 % | 4 | 4 |
| Stop-Shot mittel | 24 % | 4 | 4 |
| Schnittball 15 Grad | 16 % | 3 | 4 |

### Stufe B, Band 4–6

| Übung | Güte | heute | nach Rang |
|---|---|---|---|
| Mitteltasche im Schnitt | 65 % | 6 | 4 |
| Ball an der Bande | 47 % | 6 | 4 |
| Position in die Kitchen | 24 % | 6 | 4 |
| Stop-Shot lang | 21 % | 6 | 5 |
| Bandenball über die Langbande | 19 % | 6 | 5 |
| Kombination aus zwei Bällen | 8 % | 6 | 6 |
| Schnittball 45 Grad | 8 % | 6 | 6 |

Alle sieben stehen heute auf 6 — die Stufe ist in sich gar nicht geordnet.

### Stufe C, Band 6–8

| Übung | Güte | heute | nach Rang |
|---|---|---|---|
| Safe hinter den Ball | 79 % | 8 | 6 |
| Cluster öffnen | 27 % | 8 | 6 |
| Seiteneffet über die Bande | 26 % | 7 | 6 |
| Bandenball über die Kurzbande | 25 % | 7 | 6 |
| Rückzieher lang | 24 % | 8 | 7 |
| Karambolage | 22 % | 8 | 7 |
| Dünner Schnitt 60 Grad | 20 % | 7 | 7 |
| Enge Position | 19 % | 7 | 7 |
| Lange Gerade | 14 % | 7 | 8 |
| Sehr dünner Schnitt 75 Grad | 12 % | 9 | 8 |
| Kick über eine Bande | 7 % | 8 | 8 |

### Die sechs Fälle, bei denen Messung und Zahl weit auseinanderliegen

1. **Safe hinter den Ball** steht auf 8 und ist mit 79 % Güte die
   zweitleichteste Übung der ganzen Sammlung — der Objektball soll ja gar
   nicht fallen. Von 38 Übungen auf Rang 2, von 11 der Stufe C auf Rang 1.
2. **Mitteltasche im Schnitt** steht auf 6 und ist mit 65 % die leichteste
   der Stufe B.
3. **Ball an der Bande gerade** steht auf 4, dem oberen Rand der Stufe A,
   und liegt mit 67 % auf Rang 5 von 20.
4. **Schnittball 15 Grad** steht auf 3 und ist mit 16 % die **schwerste**
   der Stufe A — schwerer als alles in B außer zwei. Es ist auch die
   einzige Übung der Sammlung, die 4,25 Tischlängen verlangt, also
   Break-Tempo. In Stufe A passt sie selbst mit der 4 nicht; das ist eher
   eine Frage der Stufe als der Zahl.
5. **Sehr dünner Schnitt 75 Grad** steht auf 9, über dem Band der Stufe C.
   Das Konzept nennt sie ausdrücklich als Ausnahme — zu entscheiden, ob die
   Ausnahme bleibt. **Entschieden: sie bleibt**, und eine Prüfung schreibt
   sie fest.
6. **Stufe B ist in sich ungeordnet:** alle sieben Übungen stehen auf 6,
   obwohl zwischen der leichtesten (65 %) und der schwersten (8 %) der
   Faktor acht liegt.

### Nebenbefund: vier Übungen schicken den Weißen zu oft ins Loch

Keine Frage der Schwierigkeit, sondern des Aufbaus. Anteil der Versuche, in
denen der Weiße selbst fällt (250 Versuche je Übung):

| Übung | Weißer fällt |
|---|---|
| Schnittball 45 Grad | 27 % |
| Mitteltasche im Schnitt | 26 % |
| Karambolage | 24 % |
| Position in die Kitchen | 21 % |

Ein gefallener Weißer kann in keiner Zielzone liegen; bei „Schnittball
45 Grad" geht mehr als die Hälfte der fehlenden Zonenquote allein darauf.
**Offen.**

## Was dabei nicht angefasst wird

Dreizehn Zonen sind in Ordnung und bleiben, wie sie sind. Drei davon lagen
in der ersten Nachrechnung nur deshalb gut, weil sie aus der Stoßlinie
gerechnet sind (`cueAfter`) — das Verfahren trägt.
