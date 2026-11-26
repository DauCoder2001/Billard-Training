# Nachrechnung mit pooltool — Befunde vom 26.11.2026

Die App rechnet Geometrie, keine Physik. Wo der Weiße liegen muss, damit ein
Schnitt von 25 Grad entsteht, rechnet sie aus; ob der Ball bei diesem Tempo
fällt und wo der Weiße danach liegen bleibt, hat bisher niemand geprüft. Die
Zielzonen sind von Hand gesetzt.

Mit 0.18.3 war belegt, dass das nicht trägt: Zwei gespiegelte Übungen hatten
zwei Zielzonen, die 30,81 Zoll auseinanderlagen. Höchstens eine konnte
stimmen, und die App konnte nicht sagen, welche.

Dieses Dokument hält fest, was die erste Nachrechnung ergeben hat. Die
Werkzeuge liegen unter [`scripts/pooltool/`](../scripts/pooltool/README.md),
die vollständigen Tabellen unter `scripts/pooltool/bericht.md` und
`scripts/pooltool/tempo.md`.

## Wie gerechnet wurde

pooltool 0.3.3 auf Python 3.14.7, ereignisbasierte Simulation. Der Tisch
bekommt die Maße der App (100 × 50 Zoll, Eckenmaul 4,5", Mittelmaul 5"),
nicht pooltools Standardtisch.

Jede Übung wird mehrfach gespielt, jedes Mal mit kleinen Abweichungen:
0,35 Grad in der Richtung, 4 % im Tempo, 0,04 Ballradien im Treffpunkt. Das
soll ein geübter Spieler sein, der nie zweimal gleich stößt. Die Zahl ist
gesetzt, nicht gemessen — eine andere Streuung verschiebt alle Trefferquoten,
aber nicht ihre Reihenfolge, und darauf kommt es an.

**Die Anspiellinie wird aus der App gelesen, nicht neu gerechnet.** Der
Geisterball kommt aus `domain/geometry.ts`, der Zielpunkt des Objektballs aus
dem gespeicherten Weg der Übung. Genau das soll geprüft werden.

Zwei Läufe: 38 Übungen × 11 Tempostufen × 20 Versuche (8360 Simulationen) für
die Tempofrage, und 38 × 100 Versuche für die Prüfung mit den Angaben der App.

## Die drei Fragen und ihre Antworten

### 1. Geht die Übung überhaupt auf?

**36 von 38 ja, zwei nein.** Diese beiden fallen bei keiner Geschwindigkeit
der ganzen Leiter (0,4 bis 4,0 m/s):

| Übung | Stufe | Warum |
|---|---|---|
| Ball an der Bande | B | Der Geisterball liegt **0,027" innerhalb der Bande**. Der Objektball klebt an der Langbande (y = 48,875, das Höchstmaß), und der Schnitt von 8 Grad auf die Ecke oben rechts verlangt den Weißen bei y = 48,902. Dort kann kein Ballmittelpunkt stehen. Die Übung ist, wie sie dasteht, nicht spielbar. |
| Kick über eine Bande | C | Die App zielt den Weißen auf einen Punkt **auf der Bandenfläche**, nicht auf die Linie, auf der ein Ballmittelpunkt reflektiert. Gemessener Fehler: **5,21 Grad**. Der Weiße verfehlt den Objektball. |

Beide Befunde hat die App selbst nicht gesehen: Der Machbarkeitstest
(`domain/feasibility.ts`) meldet zu allen 38 Übungen „keine" Hinweise. Er
prüft Schnittwinkel, Platz für das Queue und Abstand zur Bande, aber nicht,
ob der Geisterball auf dem Tisch liegt.

#### Der Spiegelfehler bei Bandenbällen

`mirrorAcross` in `src/data/seed/drills/build.ts:40` spiegelt die Zieltasche
an der **Bandenfläche** (y = 50). Ein Ball kehrt aber eine Ballbreite früher
um: sein Mittelpunkt reflektiert an y = 48,875. Gemessen in den Winkeln, die
daraus folgen:

| Übung | Fehler der Anspielrichtung | Zielpunkt daneben |
|---|---|---|
| Bandenball über die Langbande | 0,95° | 1,19" |
| Bandenball über die Kurzbande | 0,16° | 1,13" |
| Kick über eine Bande | **5,21°** | 3,23" |

Der Kick trifft es am härtesten, weil der Weiße von weit her kommt und der
Winkel flach ist. Die beiden Bandenbälle fallen trotzdem noch (35 % und
30 %) — der Fehler frisst Spielraum, aber er ist nicht tödlich.

Das ist ein Fehler **innerhalb der Geometrie der App**, keine Physikfrage.
Er lässt sich ohne pooltool nachrechnen und beheben. (Dass echte Banden nicht
sauber spiegeln, sondern bei Tempo kürzer herauskommen, ist ein zweiter,
davon unabhängiger Punkt.)

### 2. Liegt die Zielzone dort, wo der Weiße hinkommt?

**Bei 13 von 25 Übungen mit Zielzone: nein.** Dort liegt die mittlere
Ruhelage des Weißen weiter von der Zonenmitte entfernt, als die Zone Radius
hat — die Stellungshälfte der Wertung ist praktisch nicht zu holen.

| Übung | Mittlere Ruhelage daneben | Zonenradius |
|---|---|---|
| Safe hinter den Ball | 62,4" | 6" |
| Cluster öffnen | 39,5" | 7" |
| Seiteneffet über die Bande | 24,3" | 9" |
| Schnittball 45 Grad | 22,0" | 9" |
| Stop-Shot lang | 14,0" | 5" |
| Stop-Shot mittel | 10,2" | 4" |
| Mitteltasche im Schnitt | 9,6" | 9" |
| Schnittball 30 Grad | 9,5" | 8" |
| Rückzieher 30 cm | 9,0" | 4,5" |
| Mitteltasche gerade | 8,5" | 5" |
| Rückzieher kurz | 8,3" | 7" |
| Enge Position | 7,2" | 4" |
| Ball an der Bande | — | 8" (fällt nie) |

**Die 0.18.3 offen gebliebene Frage ist damit beantwortet.** „Seiteneffet
über die Bande" behielt die Zone bei (25 / 12), weil nicht zu entscheiden
war, welche der beiden stimmt. Gemessen liegt sie 24,3 Zoll neben dem Ort,
an dem der Weiße zur Ruhe kommt. Die behaltene Zone war die falsche — oder
genauer: beide waren falsch.

#### Gerechnete Zonen sind besser als gesetzte

Sieben Übungen rechnen ihre Zone aus der Stoßlinie (`cueAfter` in der
Beschreibung), die übrigen 17 haben sie von Hand gesetzt:

| | Übungen | Mittlerer Abstand zur gemessenen Ruhelage |
|---|---|---|
| aus der Stoßlinie gerechnet | 7 | **4,0"** |
| von Hand gesetzt | 17 | **13,7"** |

Das ist ein Faktor 3,4 — aber kein sauberer Vergleich: `cueAfter` gibt es nur
beim geraden Stoß (Schnittwinkel 0), und dort ist der Weg des Weißen auch
leichter vorherzusagen. Die Richtung stimmt trotzdem, und sie weist auf den
Ausweg: Zonen gehören gerechnet, nicht geschätzt.

### 3. Passt die Schwierigkeit zur Trefferquote?

**Ja, im Großen.** Zwischen der Schwierigkeit 1 bis 10 und der besten
erreichbaren Trefferquote liegt ein Zusammenhang von **r = −0,672** über alle
38 Übungen: schwerere Übungen fallen seltener. Die Skala ist also nicht
geraten.

Im Kleinen gibt es Ausreißer in beide Richtungen:

| Übung | Schwierigkeit | Beste Trefferquote | |
|---|---|---|---|
| Mitteltasche im Schnitt | 6/10 | 100 % | zu schwer eingestuft |
| Mitteltasche aus der Entfernung | 4/10 | 100 % | zu schwer eingestuft |
| Enge Position | 7/10 | 60 % | zu schwer eingestuft |
| Gerader Ball mittel | 2/10 | 50 % | zu leicht eingestuft |
| Schnittball 10 Grad | 2/10 | 55 % | zu leicht eingestuft |
| Stop-Shot mittel | 4/10 | 30 % | zu leicht eingestuft |
| Kombination aus zwei Bällen | 6/10 | 10 % | zu leicht eingestuft |

### 4. Nebenbefund: Das Tempo der App bedeutet nichts

Zu `speed` sagt die App nur „1..10" (`src/domain/types.ts:155`). Was eine 6
in Metern je Sekunde ist, steht nirgends — also wurde es rückwärts gemessen:
Für jede Übung die Geschwindigkeit gesucht, bei der der Weiße am nächsten an
seiner Zielzone liegen bleibt.

Zwischen dem Tempo der App und der gemessenen Geschwindigkeit liegt
**r = 0,367** über 36 Übungen. Das ist fast nichts. Zwei Beispiele mit
derselben Angabe:

| Übung | Tempo laut App | Gemessen nötig |
|---|---|---|
| Stop-Shot kurz | 4 | 3,2 m/s |
| Nachlauf 20 cm | 4 | 0,4 m/s |

Ein Faktor 8 bei gleicher Zahl. Solange `speed` keine Einheit hat, kann es
weder die Übung beschreiben noch eine Bewertung stützen.

### 5. Was passiert, wenn man die Angaben der App wörtlich nimmt

Der zweite Lauf spielt jede Übung 100-mal mit dem Tempo, das in ihr steht —
umgerechnet über die angenommene Formel `V0 = 0,5 + 0,45 · Tempo`. Das
Ergebnis ist deutlich schlechter als mit gemessenem Tempo:

| | |
|---|---|
| Übungen mit Zielzone | 25 |
| davon: Weißer landet in **keinem** von 100 Versuchen in der Zone | **20** |
| davon: in mindestens der Hälfte | 1 |
| Übungen, bei denen der Weiße mindestens einmal fällt | 33 von 38 |

Das ist kein Urteil über die Übungen allein — die Umrechnungsformel ist
geraten, und Befund 4 sagt, warum sie nicht stimmen kann. Es zeigt aber, wie
viel an dieser einen fehlenden Einheit hängt.

Ein Einzelwert sticht heraus: Bei „Ball an der Bande" fällt der Weiße in
**100 von 100** Versuchen. Das passt zu Befund 1 — wenn der Geisterball in
der Bande liegt, zielt der Stoß neben der Ecktasche in die Bande hinein.

## Was daraus folgt

Zu entscheiden, nicht entschieden:

1. **Den Spiegelfehler beheben** (`build.ts:40`). Eindeutig, klein, und ohne
   pooltool nachprüfbar. Ändert drei Übungen und damit deren Fingerabdruck.
2. **Den Machbarkeitstest um den Geisterball erweitern.** Er soll melden,
   wenn der Geisterball nicht auf dem Tisch liegt. Dann fällt „Ball an der
   Bande" beim nächsten Test auf, statt erst bei der Nachrechnung.
3. **Die 13 Zielzonen neu setzen** — aus den gemessenen Ruhelagen, die in
   `scripts/pooltool/tempo.json` stehen. Das ist der größte Eingriff: 13
   Fingerabdrücke ändern sich, und wer eine eigene Fassung hat, sieht
   „Vorlage überarbeitet".
4. **Dem Tempo eine Einheit geben** oder es aus der Bewertung heraushalten.
5. **Die sieben Schwierigkeiten nachziehen.**

Was dieses Dokument **nicht** belegt, weil es nicht gemessen wurde:

- **Nur ein Tuchzustand.** Das Konzept verlangt zwei (neu und schnell, alt
  und langsam) und nur Übungen, die in beiden aufgehen. pooltool kann das
  über `BallParams`; genutzt wurde die Vorgabe.
- **Die Streuung ist gesetzt.** 0,35 Grad sind eine Annahme über den
  Spieler, keine Messung an einem Spieler.
- **pooltool ist nicht die Wahrheit.** Es ist ein Modell. Es rechnet
  gelegentlich auch falsch: bei weichen Stößen auf die Mitteltasche bricht
  der Löser für Gleichungen vierten Grades mit einer Division durch Null ab
  (`pooltool/ptmath/roots/core.py:54`). Solche Versuche fallen aus und
  stehen als „ausgefallen" im Bericht.
