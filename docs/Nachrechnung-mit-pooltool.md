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

Was davon mit 0.19.1 behoben ist und was die Korrektur gemessen gebracht hat,
steht im **Nachtrag vom 27.11.2026** am Ende. Die Tabellen im Projekt sind
seither neu gerechnet; die Zahlen in den Abschnitten unten sind die vom
26.11.

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

1. ~~**Den Spiegelfehler beheben** (`build.ts:40`).~~ **Behoben mit 0.19.1**
   — und es waren vier Übungen, nicht drei: „Ball an der Bande" hing mit
   daran. Siehe den Nachtrag unten.
2. ~~**Den Machbarkeitstest um den Geisterball erweitern.**~~ **Behoben mit
   0.19.1** als achte Prüfung `ghostOnTable`.
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

## Nachtrag 27.11.2026 — was die Korrektur gebracht hat (0.19.1)

Die Punkte 1 und 2 der Liste sind behoben, und die Wirkung ist gemessen: die
alte Fassung aus `c02c337` in einem eigenen Arbeitsbaum ausgegeben und beide
Fassungen unter denselben Bedingungen durchgespielt — 60 Versuche je
Tempostufe, 11 Stufen, gleiche Saat, gleiche Streuung. Verglichen ist die
beste Trefferquote auf der Leiter.

| Übung | alt | neu |
|---|---|---|
| Bandenball über die Langbande | 27 % | 22 % |
| **Ball an der Bande** | **0 %** | **60 %** |
| Bandenball über die Kurzbande | 33 % | 35 % |
| Kick über eine Bande | 3 % | 7 % |

Bei 60 Versuchen beträgt die Streuung einer Quote um 30 % rund ±5,9
Prozentpunkte. Die beiden Bandenbälle liegen damit innerhalb des Rauschens:
Die Spiegelung war um eine Ballbreite falsch, aber bei diesen zwei Übungen
hat der Fehler nichts gekostet, was man an der Trefferquote sehen könnte.
Begründet ist die Korrektur nicht durch sie, sondern dadurch, dass die
gespiegelte Linie nachweisbar die falsche war.

**„Ball an der Bande" ist der eigentliche Gewinn.** Der Objektball steht
jetzt 2,5 Zoll von der Bande statt 48,9 — dort, wo auch sein gerades
Gegenstück in Stufe A steht. Die Übung geht auf: bei 1,4 m/s fallen 50 %, und
der Weiße kommt **0,6 Zoll** an seiner Zielzone zur Ruhe. Vorher fiel der
Weiße in 100 von 100 Versuchen.

**Der Kick bleibt unzuverlässig, und zwar aus einem anderen Grund.** Ein Lauf
ohne jede Streuung — vollkommener Stoß, sechs Geschwindigkeiten — trifft den
Objektball nur bei 1,7 m/s:

```
neu:  0,7 daneben  1,1 daneben  1,7 berührt  2,6 daneben  3,2 daneben  4,0 daneben
alt:  0,7 daneben  1,1 daneben  1,7 daneben  2,6 daneben  3,2 daneben  4,0 daneben
```

Der Zielfehler von 5,21 Grad ist weg; was bleibt, ist die Bande selbst. Eine
echte Bande spiegelt nicht, sie gibt nach, und wie weit, hängt vom Tempo ab.
Eine Geometrie, die mit einem einzigen Winkel rechnet, kann das nicht
abbilden — die Übung trifft bei einem Tempo und verfehlt bei allen anderen.
Das ist keine offene Rechenfrage mehr, sondern eine Entscheidung: Die Übung
braucht ein Bandenmodell oder sie bleibt eine Übung, die man nicht nach der
Trefferquote bewerten darf. Beides ist in dieser Fassung nicht getan.

### Die Tabellen sind neu gerechnet

`scripts/pooltool/bericht.md` und `tempo.md` im Projekt beschreiben jetzt die
neue Geometrie (100 bzw. 20 Versuche je Zeile, wie zuvor). Was sich gegenüber
dem 26.11. verschoben hat:

| | 26.11. | 27.11. |
|---|---|---|
| Übungen, die bei keinem Tempo aufgehen | 2 | **1** (nur noch der Kick) |
| Zielzonen außer Reichweite | 13 von 25 | **12 von 25** |
| mittlerer Zonenfehler, gerechnete Zonen (7) | 4,0" | 4,0" |
| mittlerer Zonenfehler, von Hand gesetzt (18) | 13,7" | 13,0" |
| Schwierigkeit ↔ beste Trefferquote | r = −0,672 | r = −0,639 |
| Tempo-Angabe ↔ gemessenes V0 | r = 0,367 | r = 0,308 |

Die sieben Ausreißer der Schwierigkeit sind dieselben sieben mit denselben
Quoten — keiner von ihnen ist eine der vier geänderten Übungen. Die beiden
Korrelationen sind leicht gesunken; beide Läufe sind Stichproben von 20
Versuchen je Stufe, und der Unterschied liegt in dieser Größenordnung.

Eine Angabe vom 26.11. war zu scharf formuliert: Zum Kick stand dort „fällt
bei keiner Geschwindigkeit der ganzen Leiter". Das galt für jenen Lauf mit 20
Versuchen je Stufe. Mit 60 Versuchen fällt die alte Fassung in 3 % der
Versuche. Kein harter Nullwert, sondern eine Quote, die bei 20 Versuchen
nicht sichtbar wird.

### Was die App jetzt selbst findet

Der Machbarkeitstest hat eine achte Prüfung, `ghostOnTable`. Sie meldet, um
wie viel der Weiße im Augenblick des Treffens außerhalb der Spielfläche
stehen müsste. In der laufenden App gemessen: Über alle 38 mitgelieferten
Übungen meldet sie nichts; auf „Ball an der Bande" in der alten Lage meldet
sie **0,05"** — der Fall, den die sieben bisherigen Prüfungen durchgelassen
haben.

Dabei ist eine Zahl vom 26.11. zu berichtigen. Dort steht, der Objektball
habe auf y = 48,875 gelegen, dem Höchstmaß, und der Geisterball 0,027 Zoll
daneben. Im Aufbau stand aber y = **48,9** — selbst schon 0,025 Zoll weiter
an der Bande, als eine Ballmitte kommt. Daraus werden 0,05 Zoll statt 0,027.
Am Befund ändert das nichts, nur an der Größe: Die Übung lag doppelt so weit
daneben wie notiert.
