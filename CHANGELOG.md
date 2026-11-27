# Änderungen

Alle nennenswerten Änderungen an Billard Training.

Die Versionsnummer steht an genau einer Stelle — in `package.json` — und erscheint
unten auf der Seite **Einstellungen** sowie auf der Fehlerseite. Schema:
`Hauptversion.Funktion.Korrektur`.

## 0.19.3 – 27.11.2026

Die Schwierigkeit ist keine Verzierung: sie multipliziert das Spieler-Rating
(`skills.ts`, Faktor 0,5 + 0,05 × Schwierigkeit) und sagt dem Coach, für
welches Niveau eine Übung gedacht ist (`coach.ts`, Schwierigkeit × 10). Gegen
die gemessene Güte aus 0.19.2 gehalten, trug die Zahl in Stufe B gar keine
Information und in Stufe C fast keine. Geändert wurden nur die Ausreißer.

### Geändert

- **Stufe B aufgefächert.** Alle sieben Übungen trugen die 6, obwohl ihre
  gemessene Güte von 65 % bis 8 % reicht — Faktor acht. Jetzt nach Güte
  geordnet im vorgesehenen Band 4 bis 6: Mitteltasche im Schnitt (65 %) und
  Ball an der Bande (47 %) auf **4**, Position in die Kitchen (24 %),
  Stop-Shot lang (21 %) und Bandenball Langbande (19 %) auf **5**,
  Schnittball 45 Grad und Kombination (je 8 %) bleiben auf **6**.
- **Safe hinter den Ball von 8 auf 6.** Mit 79 % Güte geht er von allen
  C-Übungen am leichtesten auf — dreimal so leicht wie die nächste (Cluster
  öffnen, 27 %). Mit der 8 hob gerade die leichteste Übung der Sammlung das
  Rating am stärksten. Dass ein Safe Urteil verlangt, trägt die Stufe C,
  nicht die Schwierigkeit (Konzept 3.1: das Thema bestimmt die Stufe, die
  Schwierigkeit ordnet innerhalb der Stufe).

### Neu

- Eine Prüfung hält die Stufen B und C in ihren Bändern (4–6 und 6–8) und
  verlangt, dass B sein Band ausnutzt. Die eine gewollte Ausnahme ist
  festgeschrieben: der sehr dünne Schnitt mit 75 Grad behält seine 9.

### Gemessen

| Stufe | Rangkorrelation Schwierigkeit/Güte | |
|---|---|---|
| A | −0,54 | unverändert gelassen |
| B | nicht berechenbar (alle sieben auf 6) | → jetzt geordnet |
| C | −0,07 | nur der Safe geändert |

### Offen, bewusst nicht angefasst

- **Die Reihenfolge innerhalb der Stufe C.** Von Cluster öffnen (27 %) bis
  Kick (7 %) tragen zehn Übungen die 7, 8 oder 9, ohne Bezug zur Messung.
  Zwei dieser Zahlen stehen aber selbst in Frage: beim Cluster sieht die
  Nachrechnung nur das Einlochen, nicht ob der Cluster aufgeht, und der Kick
  mit 7 % Treffern ist eher falsch aufgebaut als schwer.
- **Schnittball 15 Grad** ist mit 16 % Güte die schwerste Übung der Stufe A,
  behält aber seine 3. Das Problem ist dort nicht die Schwierigkeit, sondern
  das Tempo: ein 15-Grad-Anschnitt braucht 4,25 Tischlängen — Anstoßtempo —
  weil die Zielzone auf (60/12) liegt. Das ist eine Frage an den Aufbau.
- **„Schweres Kaliber"** verlangt 80 Prozent auf einer Übung der
  Schwierigkeit 8 oder höher. Nach dem Umzug des Safes sind das fünf
  Übungen, deren beste der gerechnete Spieler mit 28 Punkten abschließt.
  Der Erfolg war auch vorher nur über den Safe erreichbar — und dort nur,
  weil die Wertung eines Safes Punkte an das Einlochen bindet, was die
  Übung ausdrücklich nicht will (`scoring.ts`, Fall `position`). Beides
  gehört zusammen entschieden.
- **Der Weiße fällt zu oft** bei Schnittball 45 Grad (27 %), Mitteltasche im
  Schnitt (26 %), Karambolage (24 %) und Position in die Kitchen (21 %).
  Aufbaufehler, keine Schwierigkeit.

### Hinweis für eigene Fassungen

Sechs Vorlagen ändern ihren Fingerabdruck. Wer eine davon abgewandelt
gespeichert hat, sieht beim nächsten Start „Vorlage überarbeitet". Am Aufbau
ändert sich nichts — nur die Schwierigkeit. Bereits erspielte Ratings bleiben,
wie sie sind: sie werden am Ende einer Einheit geschrieben und nie neu
gerechnet. Die neue Schwierigkeit wirkt also erst auf die nächste Einheit.

## 0.19.2 – 27.11.2026

Die Nachrechnung von 0.19.0 hat zwölf Zielzonen als unerreichbar gemeldet.
Nachgemessen wurde dann **warum** — und die Antwort war meist nicht „die Zone
liegt falsch", sondern „die Übung beschreibt den Stoß nicht, der dorthin
führt". Acht Zonen sitzen jetzt anders, sieben Übungen haben den Drall
bekommen, den ihr eigener Hinweis schon verlangte, und das Tempo bedeutet
endlich etwas. In 250 gerechneten Versuchen je Übung wird jetzt **jede**
Zielzone erreicht; vorher waren 20 von 25 unerreichbar. Die Fälle einzeln in
[Zielzonen-Entscheidungen.md](docs/Zielzonen-Entscheidungen.md).

### Geändert
- **Das Tempo steht in Tischlängen.** Bisher war es eine Zahl von 1 bis 10
  ohne Einheit — belegt bedeutungslos: „Stop-Shot kurz" und „Nachlauf 20 cm"
  standen beide auf 4 und verlangten gemessen 3,2 gegen 0,4 m/s. Jetzt ist
  Tempo die Strecke, die der Weiße von der Kopflinie aus **allein** über den
  Tisch rollen würde: 1 ist eine Tischlänge (sanft), 2 zwei
  (Stellungsspiel), 3 drei (langer Rückzieher), 4 und mehr ist Break-Tempo,
  0,5 der Touch-Ball. Das ist die Skala, die am Tisch ohnehin gezählt wird.
  Der Schieber im Baukasten läuft von 0,5 bis 5 in Viertel-Längen; die
  Übungsseite schreibt „2,25 Tischlängen · mittel".
- **Alle 38 Tempo-Angaben neu gemessen.** Jede Übung wurde die Leiter von
  0,5 bis 4,5 Tischlängen in Vierteln hinaufgespielt, 150 Versuche je
  Stufe. Genommen wurde die **sanfteste** Stufe, die an die beste Güte
  heranreicht — Güte ist der Anteil der Versuche, in denen der Ball fällt
  **und** der Weiße in seiner Zielzone zur Ruhe kommt. Neun knappe Fälle
  wurden mit 250 Versuchen und drei Saaten nachgeprüft; acht bestätigten
  die Wahl, bei **Position in die Kitchen** hatte das Rauschen eine
  Viertel-Länge daneben gelegen (3,00 bringt 42 bis 47 % Zonentreffer,
  3,25 bringt 81 bis 83 %).
- **Sieben Übungen haben den Drall bekommen, den ihr Hinweis schon
  verlangte.** Sie standen auf mittigem Treffpunkt — und ein Stop-Shot über
  18, 32 oder 55 Zoll Anlauf kann mit mittigem Treffpunkt nicht
  stehenbleiben, er rollt in den Vorwärtslauf: **Stop-Shot kurz** (−0,2),
  **Stop-Shot mittel** (−0,2), **Stop-Shot lang** (−0,35), **Mitteltasche
  gerade** (−0,35), **Lange Gerade** (−0,2) und **Dünner Schnitt 60 Grad**
  (−0,5) bekommen Rückwärtsdrall, **Schnittball 30 Grad** Nachlauf (+0,5).
  Bei einer achten, **Rückzieher 30 cm**, war der Drall mit −0,6 zu stark
  und steht jetzt auf −0,5.
- **Acht Zielzonen sitzen anders:**
  - **Rückzieher kurz** und **Rückzieher lang** verlangten 30 bzw. 35 Zoll
    Rückweg. Beide rechnen ihre Zone jetzt aus der Stoßlinie (`cueAfter`),
    über 23 bzw. 7 Zoll — das, was messbar erreichbar ist.
  - **Stop-Shot kurz** hatte seine Zone als Zahlenpaar (72,7 / 25) und
    sollte damit den Geisterball bezeichnen. Die Stoßlinie läuft aber nicht
    waagerecht, sondern zur Ecke, und der Geisterball liegt auf
    (73,41 / 26,59) — 1,7 Zoll weiter. Jetzt rechnet die App die Zone
    selbst, wie beim großen Geschwisterstoß.
  - **Mitteltasche im Schnitt** wird nur noch nach dem Loch gewertet. Der
    Ball fällt in 88 % der Versuche, bei jedem Treffpunkt und jedem Tempo —
    aber die Ruhelage des Weißen streut um 16 Zoll, und mehr als 27 %
    Zonentreffer waren auf dem ganzen Fächer aus sechs Treffpunkten und
    fünfzehn Tempostufen nicht zu holen.
  - **Seiteneffet über die Bande**: (25 / 12) → (18,1 / 42).
  - **Enge Position**: (55 / 34) → (88,6 / 31,3).
  - **Safe hinter den Ball**: Der Sperrball lag auf (30 / 30), die Zone auf
    (24 / 30) — der Weiße kam dort in 660 gerechneten Versuchen nie an.
    Sperrball und Zone sind mitgewandert, auf (67,7 / 31,3) und
    (71,1 / 39,9).
  - **Cluster öffnen** wird nur noch nach dem Loch gewertet
    (`mode: 'pocket'`): Nach dem Aufbrechen ist der Weg des Weißen nicht zu
    steuern — 27 Zoll Streuung. Außerdem lag der Cluster gar nicht auf
    seinem Weg; in 540 Versuchen wurde er nicht einmal berührt. Er liegt
    jetzt auf (62 / 31) und (64,3 / 31). Sein Tempo steht als einziges
    nicht auf dem Wert, den die Nachrechnung nennt: Die zählt nur gelochte
    Bälle, und das ist hier die halbe Aufgabe. Eigens gemessen geht der
    Cluster unter 2,25 Tischlängen **gar nicht** auf (0 bis 1 %), bei 2,25
    in 65 % und ab 2,50 in 95 bis 100 % der Versuche — bei über die ganze
    Leiter gleicher Trefferquote. Gesetzt sind 2,50.

### Neu
- **`src/domain/tempo.ts`** — eine Stelle für alles, was das Tempo angeht:
  Grenzen, Schrittweite, die Texte („2,25 Tischlängen", „mittel") und die
  Überführung alter Werte.
- **`scripts/pooltool/tischlaengen.py`** — misst die Umrechnung
  Tischlängen ↔ m/s, statt sie anzunehmen: legt den Weißen auf die
  Kopflinie, stößt ihn 48-mal mit steigender Geschwindigkeit an und zählt
  den gerollten Weg. Eine Länge braucht 0,68 m/s, zwei 1,40, drei 2,42,
  vier 3,68.

### Behoben
- **Eigene Übungen behalten ihr Tempo.** Wer eine Fassung selbst gespeichert
  hat, hat dort noch einen Wert der alten Skala stehen. Eine Migration
  rechnet ihn beim nächsten Start über die gemessene Kurve um (alt 1 → 1,5
  Längen, alt 5 → 3,25, alt 10 → 4,75). Sie hängt an einem Zähler
  (`speedScaleVersion`) und nicht an einer Prüfung des Werts, denn am Wert
  allein ist nicht zu erkennen, ob schon gerechnet wurde: alt 2 ergibt
  genau 2 Längen.
- **Geteilte Links von früher werden mitgerechnet.** Die Nutzlast hat jetzt
  die Fassung 2; eine Übung aus Fassung 1 trägt ein Tempo der alten Skala,
  und das wird beim Einlesen umgerechnet. Ohne das wäre aus „Tempo 8" ein
  auf 5 Tischlängen gedeckelter Wert geworden und aus „Tempo 2" ein Stoß
  halb so weit, wie der Absender ihn meinte.
- Die Übungsseite rundete das Tempo auf eine Nachkommastelle und zeigte
  damit „2,3 Tischlängen" — einen Wert, den der Schieber nicht annimmt.
- Die Namen der Stöße saßen schief: „sanft" reichte bis 1,75 Tischlängen,
  obwohl 1,75 näher an zwei Längen („mittel") liegt. Die Grenzen liegen
  jetzt in der Mitte zwischen den ganzen Längen.

### Gemessen
Alle 38 Übungen vorher und nachher durchgerechnet, mit derselben Streuung
eines geübten Spielers (0,35 Grad in der Richtung, 4 % im Tempo, 0,04
Ballradien im Treffpunkt). „Güte" ist der Anteil der Versuche, in denen der
Ball fällt **und** der Weiße in seiner Zielzone zur Ruhe kommt, abzüglich
falscher Taschen und gefallener Weißer — also das, was die App wertet.

| | 0.19.1 | 0.19.2 |
|---|---|---|
| Zielzonen in der Sammlung | 25 | 23 |
| davon in der Nachrechnung **nie** getroffen | **20** | **0** |
| mittlere Zonenquote | 4 % | **79 %** |
| mittlerer Abstand Ruhelage ↔ Zone | 24,5" | **2,6"** |
| Zonen weiter entfernt, als sie Radius haben | 23 von 25 | **0 von 23** |
| Trefferquote im Mittel | 43 % | 45 % |
| **Güte im Mittel** | 14 % | **37 %** |
| falsche Tasche oder Weißer gefallen | 12,9 % | **4,4 %** |
| Schwierigkeit ↔ Trefferquote | r = −0,650 | r = −0,511 |
| Schwierigkeit ↔ Güte | r = −0,452 | r = −0,538 |

Die Trefferquote bleibt also praktisch gleich: Die Zielzonen sind erreichbar
geworden, ohne dass das Einlochen schwerer wurde. Einzelne Übungen in
`scripts/pooltool/bericht.md`, die Tempo-Leiter in `tempo.md`.

Die vier deutlichsten Einzelfälle:

| Übung | Zonenquote vorher | nachher | was fehlte |
|---|---|---|---|
| Stop-Shot kurz | 23 % | **99 %** | Drall, und die Zone saß 1,7" neben dem Geisterball |
| Nachlauf 20 cm | 0 % | **100 %** | Tempo (0,75 statt 4 ohne Einheit) |
| Dünner Schnitt 60 Grad | 0 % | **86 %** | Rückwärtsdrall |
| Position in die Kitchen | 3 % | **87 %** | Tempo, auf ein Viertel genau |

### Hinweis für eigene Fassungen
Alle 38 Fingerabdrücke der Vorlagen ändern sich. Wer eine eigene Fassung
einer mitgelieferten Übung gespeichert hat, sieht beim nächsten Start
„Vorlage überarbeitet" — zu Recht: Tempo, Drall oder Zielzone sind andere
geworden. Die eigene Fassung bleibt unangetastet.

## 0.19.1 – 27.11.2026

Die eindeutigen Korrekturen aus der Nachrechnung von 0.19.0 — die Fälle, in
denen nichts zu entscheiden war, sondern etwas falsch gerechnet wurde.
Belege im Nachtrag von `docs/Nachrechnung-mit-pooltool.md`.

### Behoben
- **Bandenwege werden an der richtigen Linie gespiegelt.** Ein Ball kehrt
  eine Ballbreite vor der Bande um, nicht an der Bandenfläche. Der Aufbau
  spiegelte an der Fläche und zielte dadurch daneben: 0,95 Grad über die
  Langbande, 0,16 Grad über die Kurzbande, 5,21 Grad beim Kick. Vier
  Übungen ändern ihre Lage: **Bandenball über die Langbande**, **Bandenball
  über die Kurzbande**, **Kick über eine Bande**, **Ball an der Bande**.
- **„Ball an der Bande" ist spielbar.** Der Objektball lag auf y = 48,9 —
  weiter an der Bande, als eine Ballmitte überhaupt kommt (48,875). Der
  Weiße hätte im Augenblick des Treffens 0,05 Zoll **außerhalb** der
  Spielfläche stehen müssen und fiel in 100 von 100 gerechneten Versuchen. Jetzt
  steht der Ball 2,5 Zoll von der Bande, wie sein gerades Gegenstück in
  Stufe A. Gerechnet fallen bei 1,4 m/s 50 %, und der Weiße kommt 0,6 Zoll
  an seiner Zielzone zur Ruhe.
- Dass `castToRail` einen Strahl bis zur Bandenfläche verfolgt, ist für
  einen Strahl richtig. Für einen **Ball** gehört die Ballbreite dazu, und
  die Funktion nimmt sie jetzt als Angabe entgegen.

### Neu
- **Achte Prüfung im Machbarkeitstest: `ghostOnTable`.** Sie meldet, um wie
  viel der Weiße im Augenblick des Treffens außerhalb der Spielfläche stehen
  müsste. Genau der Fall von „Ball an der Bande", den die sieben bisherigen
  Prüfungen durchgelassen haben.

### Gemessen
Alt gegen neu, beide Fassungen unter denselben Bedingungen durchgespielt
(60 Versuche je Tempostufe, 11 Stufen, gleiche Saat), beste Trefferquote
auf der Leiter:

| Übung | alt | neu |
|---|---|---|
| Bandenball über die Langbande | 27 % | 22 % |
| **Ball an der Bande** | **0 %** | **60 %** |
| Bandenball über die Kurzbande | 33 % | 35 % |
| Kick über eine Bande | 3 % | 7 % |

Die beiden Bandenbälle liegen innerhalb des Rauschens (±5,9 Prozentpunkte
bei 60 Versuchen) — begründet ist die Korrektur nicht durch sie, sondern
dadurch, dass die gespiegelte Linie die falsche war. Der Kick bleibt
unzuverlässig: Ein Lauf ohne jede Streuung trifft den Objektball nur bei
einer von sechs Geschwindigkeiten. Der Zielfehler ist weg, die Bande selbst
bleibt — eine echte Bande spiegelt nicht, sie gibt nach, und wie weit, hängt
vom Tempo ab. Dafür bräuchte die Übung ein Bandenmodell.

Die Berichte unter `scripts/pooltool/` sind mit der neuen Geometrie neu
gerechnet. Übungen, die bei keinem Tempo aufgehen: 1 statt 2. Zielzonen
außer Reichweite: 12 von 25 statt 13.

### Hinweis für bestehende Installationen
`SEED_VERSION` steht auf 7. Vier Vorlagen ändern ihre Lage; wer eine davon
selbst bearbeitet hat, behält seine Fassung und sieht „Vorlage überarbeitet".

## 0.19.0 – 26.11.2026

### Neu
- **Nachrechnung mit pooltool.** Unter `scripts/pooltool/` liegen Werkzeuge,
  die jede mitgelieferte Übung mit einer echten Physik-Simulation
  durchspielen und die drei Fragen aus Abschnitt 5.2 des Konzepts
  beantworten: Geht die Übung auf? Liegt die Zielzone dort, wo der Weiße
  hinkommt? Passt die Schwierigkeit zur Trefferquote?
- Sie laufen **außerhalb der App** und ändern nichts an ihr. Sie schreiben
  einen Bericht; was daraus folgt, entscheidet ein Mensch. An der App selbst
  ist mit dieser Fassung nichts geändert.
- Der Fahrplan hat die Nachrechnung dafür vorgezogen — sie stand als 0.21.0
  am Ende. Nach 0.18.3 war belegt, dass mindestens eine Zielzone falsch war
  und die App nicht sagen konnte, welche. Weitere Übungen auf diesem
  Fundament zu bauen hätte den Fehler nur vervielfacht.

### Befunde
Vollständig in `docs/Nachrechnung-mit-pooltool.md`, die Tabellen in
`scripts/pooltool/bericht.md` und `tempo.md`. Gerechnet wurden 8360 plus
3800 Simulationen.

- **Zwei Übungen gehen bei keiner Geschwindigkeit auf.** „Ball an der Bande"
  verlangt den Weißen 0,027 Zoll innerhalb der Bande — dort kann kein Ball
  stehen; der Weiße fällt in 100 von 100 Versuchen. „Kick über eine Bande"
  zielt 5,21 Grad daneben.
- **Bandenbälle werden an der falschen Linie gespiegelt.**
  `build.ts:40` spiegelt die Zieltasche an der Bandenfläche; ein Ball kehrt
  aber eine Ballbreite früher um. Fehler: 0,95 Grad über die Langbande,
  0,16 Grad über die Kurzbande, 5,21 Grad beim Kick.
- **13 von 25 Zielzonen liegen weiter weg, als sie Radius haben.** Die
  Stellungshälfte der Wertung ist dort nicht zu holen. Zonen, die aus der
  Stoßlinie gerechnet sind, liegen im Mittel 4,0 Zoll daneben, von Hand
  gesetzte 13,7 Zoll.
- **Die Zone von „Seiteneffet über die Bande" ist 24,3 Zoll daneben.** Damit
  ist die Frage aus 0.18.3 beantwortet: Von den beiden widersprüchlichen
  Zonen war keine richtig.
- **Die Schwierigkeit trägt.** Zwischen Schwierigkeit und bester
  Trefferquote liegt r = −0,672. Sieben Übungen sind Ausreißer.
- **Das Tempo trägt nicht.** Zwischen der Angabe 1..10 und der gemessenen
  Geschwindigkeit liegt r = 0,367. „Stop-Shot kurz" und „Nachlauf 20 cm"
  stehen beide auf Tempo 4 und verlangen 3,2 gegen 0,4 m/s.
- Der Machbarkeitstest der App meldet zu keiner dieser Übungen etwas. Er
  prüft nicht, ob der Geisterball auf dem Tisch liegt.

### Technisches
- `aufloeser.mjs` und `haken.mjs` lassen Node die TypeScript-Quellen der App
  direkt ausführen (Pfad-Alias `@/` und Importe ohne Endung). Das erspart
  `tsx` oder `vite-node` als Abhängigkeit.
- `uebungen-ausgeben.ts` liest die Anspiellinie aus der App heraus, statt sie
  nachzubauen — bei Bandenball, Kombination und Kick aus dem gespeicherten
  Weg der Übung.
- Die Python-Umgebung steht in `.gitignore`. Die Einrichtung braucht zwei
  pip-Läufe, weil pooltool `panda3d` auf eine Version festnagelt, die es für
  Python 3.14 nicht gibt; Begründung im README.
- An `src/` ist keine Zeile geändert. 362 Tests in 28 Dateien, unverändert.

## 0.18.3 – 26.11.2026

### Entfernt
- **„Seiteneffet rechts" ist raus.** Der Aufbau war das Spiegelbild von
  „Seiteneffet links" bis auf die vierte Nachkommastelle — Weißer, Objektball
  und Zieltasche fallen an der Mittellinie aufeinander (Abweichung 0,0000"),
  und das Effet ist mitgespiegelt (seit −0,70 gegen +0,70). Damit ist auch
  der Weg des Weißen das Spiegelbild, und die Zielzone müsste es sein. Sie
  war es nicht: die eine lag 30,81" neben dem Spiegelbild der anderen. Es
  konnte höchstens eine von beiden stimmen.
- Die verbliebene heißt jetzt **„Seiteneffet über die Bande"** — ohne
  Richtung im Namen, so wie die Schnittbälle seit 0.18.1. Der Hinweis nennt
  beide Seiten: das Effet auf der anderen Seite der Pomeranze und den Aufbau
  spiegelverkehrt. Stufe C hat damit 11 Übungen, die Sammlung 38.

### Behoben
- **Die Ausnahme im Spiegeltest war der Fehler.** Der Test aus 0.18.1 hat die
  Zielzone mitverglichen, ausdrücklich damit dieses Paar durchkommt — „gleiche
  Lage, andere Aufgabe". Das hält nicht: Tempo (6) und Effetstärke (0,70)
  sind bei beiden gleich, es gibt nichts, was den einen Weg länger macht als
  den anderen. Die abweichende Zone war kein zweiter Inhalt, sondern ein
  Widerspruch. Der Test vergleicht jetzt nur noch die Lage und meldet jedes
  Spiegelpaar.
- Beim Schreiben nachgesehen, ob er auch anschlägt: ein wieder eingesetztes
  Spiegelbild mit abweichender Zone wird gemeldet.

### Technisches
- Die ganze Sammlung nach Spiegelpaaren abgesucht — dieses war das einzige
  unter 39.
- Der Slug bleibt `seiteneffet-links`, obwohl die Übung keine Richtung mehr
  im Namen trägt: die Id hängt am Slug, und mit ihr gespeicherte Einheiten
  und Favoriten.
- Sammlungsversion 6, damit Name und Hinweis die Geräte erreichen. Der
  Fingerabdruck der Übung ändert sich dadurch — wer eine eigene Fassung
  gespeichert hat, sieht „Vorlage überarbeitet".
- 362 Tests in 28 Dateien.

### Offen
- **Welche der beiden Zielzonen richtig war, ist nicht entschieden.** Die App
  rechnet für diese Übung keinen Weg des Weißen aus — gespeichert ist nur der
  Weg des Objektballs, die Zone ist von Hand gesetzt. Die behaltene Zone
  bleibt eine Schätzung, bis die Nachrechnung mit pooltool kommt (0.21.0).

## 0.18.2 – 26.11.2026

### Entfernt
- **„Durch die enge Lücke" ist raus.** Sie war „Durch die Lücke" mit einem
  engeren Tor: gleicher Objektball, gleiche Tasche, gleicher Winkel, nur die
  Störbälle standen dichter. Ein Regler, keine zweite Übung. Die Abstufung
  steht jetzt als **Variante im Hinweis** des Originals — *„Klappt das
  sicher, die beiden Störbälle enger zusammenstellen."* Stufe A hat damit 20
  Übungen, die Sammlung 39.

### Technisches
- **Ein zweiter Wächter**, nach dem gegen Spiegelbilder aus 0.18.1: Zwei
  Übungen mit demselben Objektball, derselben Tasche, demselben
  Schnittwinkel, gleich vielen Bällen und gleicher Zielzone sind dieselbe
  Übung an einem anderen Regler. Der Abstand des Weißen zählt dabei
  ausdrücklich nicht als Unterschied — er *ist* der Regler.
- Beim Schreiben hat der Wächter zuerst „Stop-Shot kurz" und „Durch die
  Lücke" angeklagt: gleicher Objektball auf dem Fußpunkt, gleiche Tasche.
  Sie sind trotzdem zwei Übungen — der einen stehen zwei Störbälle im Weg,
  die andere hat eine Zielzone für den Weißen. Beide Bedingungen gehören
  deshalb in den Vergleich.
- Sammlungsversion 5, damit der erweiterte Hinweis die Geräte erreicht.
- 362 Tests in 28 Dateien.

## 0.18.1 – 26.11.2026

### Entfernt
- **Vier Spiegel-Übungen sind wieder raus.** „Schnittball 10/15/20/30 Grad
  nach links" waren ihre Gegenstücke, an der Mittellinie gespiegelt: dasselbe
  Bild, dieselbe Aufgabe, nur seitenverkehrt. Als eigene Einträge haben sie
  die Sammlung aufgebläht, ohne etwas Neues zu zeigen. Stufe A hat damit 21
  Übungen, die Sammlung 40.
- **Ein Satz im Hinweis sagt dasselbe:** *„Die Übung auch spiegelverkehrt
  aufbauen und von der anderen Seite spielen – fast jeder trifft eine
  Richtung besser als die andere, und das merkt man erst im Vergleich."* Er
  steht jetzt bei allen sieben Schnittbällen, auch bei 45, 60 und 75 Grad.
- Die zwei verbliebenen heißen wieder **„Schnittball 10 Grad"** und
  **„Schnittball 20 Grad"** – ohne Richtung im Namen, wie die übrigen. Damit
  ist auch der offene Punkt aus 0.18.0 erledigt, dass ein Teil der
  Schnittbälle beschriftet war und der andere nicht.

### Behoben
- **Eine zurückgezogene Übung verschwindet jetzt auch vom Gerät.** Das
  Einspielen schreibt nur und löscht nie — die vier Spiegelbilder wären auf
  jedem Gerät stehen geblieben, das sie schon bekommen hat, ohne dass sich
  noch jemand erklären könnte, woher sie kommen. Weggeräumt wird nur die
  unberührte Vorlage: wer eine davon im Baukasten bearbeitet hat, behält sie.

### Geändert
- **Die 25 Übungen je Stufe sind ein Richtwert, kein Soll.** Die Sammlung
  wächst von hier an Stück für Stück und nicht mehr in einem Zug auf eine
  Zielzahl. Der Fahrplan ist entsprechend umgeschrieben.

### Technisches
- **Die Sammlungsversion steht auf 4.** Der geänderte Hinweis erreicht ein
  Gerät nur so — beim Nachsehen im Browser stand dort zuerst noch der alte
  Text, obwohl der neue längst im Quelltext war. Das Wegräumen der vier
  Spiegelbilder läuft über eine eigene Regel und braucht die Erhöhung nicht.
- Ein Test findet Spiegelpaare an den Zahlen statt am Namen — und zwar erst
  dann, wenn auch die **Zielzone** gespiegelt ist. Ohne diese Bedingung hätte
  er „Seiteneffet links" und „Seiteneffet rechts" zu Unrecht angeklagt: die
  stehen zwar gespiegelt, verlangen aber Verschiedenes, einmal den Weißen zu
  verlängern und einmal ihn kurz zu halten.
- 361 Tests in 28 Dateien.

## 0.18.0 – 26.11.2026

### Hinzugefügt
- **Stufe A ist vollständig: 19 neue Übungen, zusammen 25.** Die Stufe, die
  jeder ohne Anmeldung bekommt, ist damit für sich allein ein Training und
  kein Querschnitt mehr. Der Weg durch die Stufe: zwei gerade Bälle nur zum
  Lochen, zwei weitere Stop-Shots, Nachlauf über 20 und 50 cm, Rückzieher über
  30 und 55 cm, Schnitte von 10 und 20 Grad nach **beiden** Seiten, die
  Spiegelbilder der vorhandenen 15- und 30-Grad-Schnitte, die Mitteltasche aus
  der Entfernung, ein Ball dicht an der Langbande, zwei Lagen „durch die
  Lücke" und die **wachsende Linie**.
- **Die Schwierigkeit nutzt jetzt das ganze Band der Stufe** (1 bis 4). Vorher
  begann Stufe A bei 2; der leichteste Ball am Tisch fehlte.
- **„Durch die Lücke":** Zwei Störbälle stehen auf dem Weg des Weißen, und er
  muss zwischen ihnen durch. Gerechnet wird das Tor, nicht gesetzt — zwischen
  den Ballkanten bleiben gemessene 4,15 bzw. 3,15 Zoll bei einem Ball von
  2,25 Zoll.

### Geändert
- **Zwei Abstände stehen anders da als im Konzept vorgeschlagen.**
  Nachgemessen an den vorhandenen Übungen: „Nachlauf mittel" schickt den
  Weißen 73 cm weiter, „Rückzieher kurz" holt ihn 77 cm zurück. Die
  vorgeschlagenen 80 cm wären also beide Male fast dieselbe Übung geworden.
  Gewählt sind darum Abstände, die mit den vorhandenen eine Folge bilden:
  **20 / 50 / 73 cm** beim Nachlauf, **30 / 55 / 77 cm** beim Rückzieher.
- **Links und rechts stehen im Namen** — bei den neuen Schnittbällen. Welche
  Seite das ist, war nicht zu raten: gemessen am Kreuzprodukt von Anlauf- und
  Laufrichtung liegen die vorhandenen Schnitte alle **nach rechts**. Die
  neuen Gegenstücke sind echte Spiegelbilder an der Mittellinie, Ecke unten
  rechts wird Ecke oben rechts. Ohne diese Spiegelung läge der Weiße in der
  oberen Langbande.

### Behoben
- **Eine neue mitgelieferte Übung kam auf einem benutzten Gerät nie an.** Die
  Regel beim Einspielen lässt eine gelöschte Übung gelöscht — und am Bestand
  allein ist eine neue Übung von einer gelöschten nicht zu unterscheiden,
  beide fehlen. Bis 0.17.0 fiel das nicht auf, weil jede Erhöhung der
  Sammlungsversion nur vorhandene Vorlagen korrigierte. Die Beschreibung
  trägt jetzt die Angabe `since`: wer schon eingespielt hat, bekommt genau
  das, was es auf seinem Gerät noch nie gab.

### Technisches
- **Eine Datei je Stufe** (`src/data/seed/drills/stufe-a.ts` bis `stufe-c.ts`),
  die Rechnung in `build.ts`, zusammengeführt in `index.ts`. Bei 100 Übungen
  wäre eine Datei mit 1700 Zeilen nicht mehr zu überblicken. Der Umzug hat
  **keinen der 25 Fingerabdrücke verändert** — der Test aus 0.17.0 hält das
  fest.
- **Zielzonen werden gerechnet, nicht gesetzt.** Die Angabe `cueAfter` sagt,
  wie weit der Weiße nach dem Treffer weiterläuft oder zurückkommt; die Zone
  folgt daraus. Nur beim geraden Stoß ist das die Wahrheit — bei einem Schnitt
  geht der Weiße auf die Tangente —, und genau das hält ein Test fest.
- **Fünf neue Prüfungen**, jede an einer absichtlich falsch gebauten Übung
  erprobt: die Richtung im Namen gegen die Lage der Bälle, das Tor gegen die
  Breite eines Balls, `cueAfter` nur beim geraden Stoß, die Zielzone eines
  Nachlaufs mit Abstand zur Tasche, und die Schwierigkeit der Stufe A im Band
  1 bis 4.
- **Die Gegenprobe mit der Machbarkeitsprüfung** aus 0.16.0 läuft jetzt über
  alle 44 Übungen und wächst mit jeder Stufe von allein mit: keine einzige
  meldet einen Hinweis.
- 356 Tests in 28 Dateien.

## 0.17.0 – 26.11.2026

### Hinzugefügt
- **Reihen-Generator im Baukasten.** Der Knopf *Reihe erzeugen* baut aus dem
  aktuellen Aufbau eine Folge von Übungen: derselbe Objektball, dieselbe
  Tasche, nur der **Schnittwinkel** oder der **Abstand des Weißen** wandert in
  Stufen. Zwei bis zwölf Übungen, die Schwierigkeit lässt sich über die Reihe
  verteilen.
- **Die Vorschau zeigt die Reihe, bevor sie angelegt wird** — mit Namen,
  Schwierigkeit und, je Übung, dem Ergebnis der Machbarkeitsprüfung aus
  0.16.0. Wer sieht, dass zwei der acht Übungen den Weißen an die Bande
  klemmen, zieht die Grenzen enger, statt hinterher in der Sammlung
  aufzuräumen.
- **Einen klaren Grund statt einer falschen Reihe:** Ist für den Weißen ein
  eigener Weg gezeichnet (Kick, Karambolage), sagt der Dialog das und legt
  nichts an. Der gezeichnete Weg würde beim Verschieben des Weißen nicht
  mitwandern.

### Geändert
- Die neuen Übungen einer Reihe bekommen **keine Lernstufe mit**. Eine Reihe
  verändert gerade das, was über die Stufe entscheidet: Der 60-Grad-Schnitt
  aus einer Stufe-A-Übung ist in der Sammlung ein dünner Schnitt und damit
  Stufe C. Eine geerbte Stufe wäre hier dasselbe wie eine geratene.

### Technisches
- **Die Anspiel-Rechnung ist nach `src/domain/aim.ts` umgezogen.** Sie stand
  in `data/seed/drills.ts` und baute nur die mitgelieferten Übungen; der
  Generator braucht dieselbe Rechnung. Gerechnet wird rückwärts — aus
  Objektball, Zielpunkt, Winkel und Abstand folgt die Lage des Weißen. Steht
  „30°“ im Namen, ist es ein 30-Grad-Schnitt, nicht 28.
- **Der Umzug durfte keine Ballposition verschieben**, denn jede Änderung an
  einer Vorlage hätte allen mit einer eigenen Fassung den Hinweis „Vorlage
  überarbeitet“ eingebracht. Gemessen: alle 25 Fingerabdrücke identisch.
  **Seither nagelt ein Test sie fest** (`drills.test.ts`) — schlägt er an,
  ist das eine Frage, keine Panne: War die Änderung gewollt?
- 346 Tests, davon 22 neue zur Reihe.

## 0.16.1 – 26.11.2026

### Behoben
- **Der Build lief nicht durch.** `TABLE` steht unter `as const`, damit hat
  `TABLE.ballDiameter` den Typ `2.25` und nicht `number`. Eine daraus
  abgeleitete Variable nahm keinen anderen Wert mehr an
  (`src/domain/feasibility.ts`). Jetzt ist der Typ dort ausdrücklich
  angegeben.
- Der Fehler kam durch, weil die Prüfung vorher mit `npx tsc --noEmit` lief.
  Das nimmt `tsconfig.json` — eine reine Verweisdatei ohne eigene Dateien,
  die nichts prüft und trotzdem erfolgreich meldet. Die Prüfung des Projekts
  ist `npm run typecheck` (`tsc -b`), und daneben `npm run lint`,
  `npm run test` und `npm run build`.

## 0.16.0 – 26.11.2026

### Hinzugefügt
- **Machbarkeitsprüfung im Baukasten.** Während du einen Aufbau baust, sagt
  ein Streifen über den Angaben, was am echten Tisch nicht aufgeht. Sieben
  Prüfungen: Bälle, die ineinander liegen; der Weiße zu dicht an der Bande
  für das Queue; ein Ball in der Sichtlinie; ein Schnittwinkel über 85°; ein
  Ball im Weg des Objektballs; ein Ball vor der Tasche; und eine Übung ohne
  Maßstab, die das Training ohnehin nicht annimmt.
- **Hinweise, keine Verbote.** Ein Trickshot darf unmöglich aussehen, und wer
  eine Übung absichtlich hart baut, soll sie bauen dürfen. Nur die Übung ohne
  Maßstab ist rot ausgezeichnet — sie ist das Einzige, was die App selbst
  ablehnt. Alles andere steht in Orange da, und das Zeichen davor sagt
  dasselbe wie die Farbe, für alle, die Farben nicht unterscheiden.

### Technisches
- `src/domain/feasibility.ts`: eine reine Funktion über die Übung, keine
  Simulation — gerechnet werden Abstände und Winkel. Dieselbe Geometrie
  prüft seit Längerem die mitgelieferten Übungen im Test; hier steht sie für
  die Aufbauten des Nutzers.
- **Die Gegenprobe steht im Test:** keine der 25 mitgelieferten Übungen
  meldet einen einzigen Hinweis. Ein Hinweis, der ohne Grund kommt, kostet
  das Vertrauen in alle anderen — wer dreimal grundlos gewarnt wird, liest
  den vierten nicht mehr.
- Der Streifen liegt **außerhalb** des klappbaren Angabenbereichs. Die Lagen,
  um die es geht, entstehen beim Schieben der Bälle, und dabei sind die
  Angaben oft eingeklappt. Bewusst ohne `aria-live`: die Hinweise rechnen
  sich bei jedem Ziehen neu, ein Vorleseprogramm läse ununterbrochen vor.
- Gibt es nichts zu melden, steht dort nichts — kein leerer Kasten mit
  „Alles in Ordnung“. Die Abwesenheit des Streifens ist die Entwarnung.
- **Noch nicht geprüft werden kann, was das Datenmodell nicht kennt:** ein
  Sprungball fliegt über einen Ball hinweg, aber ein Weg weiß heute nicht,
  dass er durch die Luft geht. Bis Stufe D das Modell erweitert, meldet die
  Sichtlinie bei einem Sprungball einen Hinweis, der keiner ist.
- 324 Tests, davon 20 neue zur Machbarkeitsprüfung.

## 0.15.0 – 26.11.2026

### Hinzugefügt
- **Lernstufen A bis D.** Jede Übung lässt sich einer Stufe zuordnen:
  A Grundschläge, B Kontrolle des Weißen, C Spielsituationen,
  D Spezialtechniken. Die Stufe **ordnet und filtert, sie sperrt nichts** –
  jede Übung bleibt jederzeit trainierbar, egal auf welchem Stand der Spieler
  ist (Entscheidung E1 im Konzept).
- **Die 25 mitgelieferten Übungen sind eingestuft:** 6 in A, 7 in B, 12 in C.
  Stufe D ist noch leer, und das ist kein Versehen – Sprung- und Masséschläge
  braucht sie, und die kennt das Datenmodell noch nicht (es fehlen die
  Stoßarten und die Angabe, dass ein Ball durch die Luft fliegt).
  Maßgeblich ist das Thema, nicht die Schwierigkeit: der sehr dünne Schnitt
  mit 75 Grad ist schwer, bleibt aber eine Spielsituation (C).
- **Filter und Sortierung nach Stufe** in der Sammlung, einschließlich
  „Ohne Stufe“ – sonst wären selbst gebaute Übungen über den Filter nicht zu
  finden. Beim Sortieren nach Stufe ordnet die Schwierigkeit innerhalb der
  Stufe, und Übungen ohne Stufe stehen am Ende. Die Stufe steht auch auf der
  Karte, sonst wäre nicht zu sehen, wonach die Sortierung ordnet.
- **Die Stufe im Baukasten**, im Reiter „Stoß“ unter der Stoßart. Ohne
  Vorgabewert: eine geratene Stufe wäre schlechter als gar keine, denn die
  Stufe sagt etwas über das Thema aus – und das kennt nur, wer die Übung baut.

### Geändert
- Die beiden Auswahlfelder der Filter (Stoßart, Stufe) haben jetzt einen
  Namen für Vorleseprogramme. Vorher hing ihre Bedeutung allein an der ersten
  Angebotszeile.

### Behoben
- **Die Stufe überlebt das Einlesen einer Sicherung und einen geteilten
  Link.** Beide Wege gehen durch dieselbe Prüfung (`sanitizeShot`), die den
  Stoß Feld für Feld neu aufbaut – ein nicht aufgeführtes Feld fällt dabei
  weg. Ohne diese Ergänzung hätte das Einspielen einer Sicherung alle
  selbst gewählten Einstufungen gelöscht.

### Technisches
- **Die Stufe steht bewusst nicht im Fingerabdruck der Vorlage**
  (`seedStamp`). Stünde sie dort, hätte das Einstufen der 25 mitgelieferten
  Übungen jeden Fingerabdruck geändert, und jeder, der eine eigene Fassung
  gespeichert hat, bekäme den Hinweis auf eine überarbeitete Vorlage, ohne
  dass sich an der Übung etwas geändert hätte. Dieselbe Begründung wie bei
  der Sperrzone.
- **Eine eigene Migration statt `SEED_VERSION` 3.** Das Einspielen der
  Sammlung lässt eine eigene Fassung einer mitgelieferten Übung bewusst in
  Ruhe – genau die bekäme über `SEED_VERSION` nie eine Stufe und fiele aus
  jedem Filter heraus. `migrateLevels()` erreicht beide: die unberührte
  Vorlage und die übernommene Fassung. Angefasst wird nur, wo noch keine
  Stufe steht; eine im Baukasten gewählte bleibt stehen.
- `DrillSpec` verlangt die Stufe als Pflichtfeld, damit keine neue Übung ohne
  Einstufung durchrutscht. 304 Tests, davon 20 neue zu den Stufen.

## 0.14.2 – 26.11.2026

### Hinzugefügt
- **`public/CNAME` für die eigene Adresse `training.cuedesk.de`.** Vite kopiert
  die Datei nach `dist/`, damit sie im Pages-Artifact liegt und jede
  Veröffentlichung übersteht. Am Programm ändert sich nichts: `base: './'`
  erzeugt relative Pfade, die App läuft unter jeder Adresse und in jedem
  Unterverzeichnis.
- Die README erklärt den Wechsel der Adresse: **zuerst der DNS-Eintrag, dann
  diese Datei.** Ist die Domain bei GitHub eingetragen, leitet Pages die
  `github.io`-Adresse auch dann schon dorthin um, wenn der DNS noch nicht
  zeigt – die App wäre dann vorübergehend nicht erreichbar. Dazu der Hinweis,
  dass der Browserspeicher am Host hängt und vor dem Wechsel eine Sicherung
  fällig ist.

### Vollzogen am 26.11.2026
- Der CNAME `training` → `daucoder2001.github.io` steht bei IONOS und greift
  bei Google, Cloudflare und Quad9. Die Mail-Einträge der Subdomain hat IONOS
  dabei abgeschaltet, wie es der DNS-Standard verlangt — ein CNAME verträgt
  keine weiteren Einträge am selben Namen. Die Mail von `cuedesk.de` hat eigene
  MX-Einträge und ist nicht betroffen; bei `app.cuedesk.de` war es dieselbe
  Umstellung.
- Die Domain ist bei GitHub eingetragen, als verifiziert geführt, das
  Zertifikat ist ausgestellt (gültig bis 24.02.2027), HTTPS wird erzwungen.
- **Die App läuft unter `https://training.cuedesk.de`** und meldet dort 0.14.2.

- Auch `http://` leitet sauber auf HTTPS um. Nachgemessen an allen acht
  Knoten von GitHub Pages (vier über IPv4, vier über IPv6, jeweils mit
  umgangenem DNS): jeder antwortet mit `301` und `Server: GitHub.com`.

### Zwei Fallen beim Nachprüfen
- **Ein 404 auf `http://training.cuedesk.de` kann am eigenen Rechner liegen,
  nicht an GitHub.** Hier war es so: Der autoritative DNS, der Resolver im Netz
  und `Resolve-DnsName` lieferten alle den richtigen CNAME, aber die
  Verbindungsschicht von Windows hielt noch die alte IONOS-Adresse
  (`2001:8d8:100f:f000::200`) und landete dort auf einer Fehlerseite. Hilft:
  `ipconfig /flushdns` als Administrator. Erkennbar ist der Fall daran, dass
  die 404-Seite ein nacktes nginx ohne GitHub-Gestaltung ist — GitHub Pages
  liefert eine eigene.
- **Die alte Adresse zeigt im Browser weiter die App**, obwohl der Server eine
  301 schickt. Das ist der Offline-Vorrat des Service Workers, nicht der
  Server. Wer dort Daten hat, zieht sie über **Einstellungen → Sicherung
  speichern** und spielt sie unter der neuen Adresse wieder ein.

## 0.14.1 – 26.11.2026

### Geändert
- **Ein Aufbau in der Sammlung heißt jetzt „Übung", nicht mehr „Stoß".** Im
  Oktober war es umgekehrt festgelegt worden, mit der Regel „ein Begriff, eine
  Sache". Genau daran scheiterte „Stoß": Ein Stoß ist ein einzelner Schlag mit
  dem Queue – ein Eintrag in der Sammlung ist ein Aufbau, den man zwanzig Mal
  spielt. „Zwanzig Stöße an dieser Übung" ist richtig; die Sammlung „Stöße" zu
  nennen war der Fehler, den die Regel vermeiden wollte. Das Problem damals war
  „Drill" (englischer Fachjargon) – „Übung" wurde mit weggeworfen.
- Die Navigation führt zu **Übungen**, die Seite heißt **Übungen**, und
  entsprechend überall: „Neue Übung", „Übung löschen", „Geteilte Übung
  übernehmen", „Mitgelieferte Übungen wiederherstellen".
- Unverändert bleiben **Versuch** (ein einzelner Durchgang), **Einheit** (alle
  Versuche einer Sitzung) und **Stoßart** (Schnittball, Bandenball, Kick …) –
  die beschreibt den Schlag, nicht die Übung. Auch der Reiter „Stoß" im
  Baukasten behält seinen Namen: dort stehen die Angaben zum Schlag.
- Die Namen der mitgelieferten Übungen und die Coach-Hinweise sind nicht
  betroffen; wo dort „Stoß" steht, ist der Schlag gemeint („sauberer, langer
  Stoß statt roher Kraft").

## 0.14.0 – 25.11.2026

### Geändert
- **Das gewählte Werkzeug bleibt stehen** (Befund 73). Bisher sprang der
  Baukasten nach jedem gesetzten Ball zurück auf „Auswahl" – wer eine
  Aufstellung baute, musste zwischen zwei Bällen jedes Mal zusätzlich auf das
  Werkzeug tippen. Jetzt gilt für alle Setzwerkzeuge dieselbe Regel: einmal
  wählen, beliebig oft setzen. Zurück zur Auswahl führen der Knopf „Auswahl"
  und die Esc-Taste. Eine Ausnahme bleibt der Weiße – von ihm gibt es nur
  einen, sein Knopf wird danach ohnehin grau.

## 0.13.6 – 25.11.2026

### Behoben
- **Nach einer Aktualisierung stürzt die offene Seite nicht mehr ab**
  (Befund 71). Baukasten, Training, Workout-Lauf, Importseite und der
  Teilen-Dialog werden erst beim Öffnen nachgeholt; ihre Dateinamen tragen
  eine Prüfsumme. Wer die Seite offen hatte, während eine neue Fassung
  hochgeladen wurde, verlangte danach eine Datei, die es nicht mehr gibt –
  und sah eine englische Fehlermeldung, aus der nur Strg + F5 heraushalf.
  Jetzt lädt die Seite in diesem Fall ein einziges Mal von selbst neu und
  macht dort weiter, wo sie war. Schlägt es ein zweites Mal fehl – dann liegt
  es wirklich am Netz –, kommt die Fehleranzeige.
- **Fehler in einer Seite zeigen die eigene Fehleranzeige** (Befund 72).
  Bisher fing der Router sie vorher ab und zeigte seine englische
  Entwickleransicht. Jetzt erscheint dieselbe deutsche Anzeige wie sonst –
  mit Meldung, Versionsnummer und den Knöpfen „Neu laden" und „Zum Start".

## 0.13.5 – 24.11.2026

### Innen
- **Die Seite Stöße hat jetzt eigene Prüfungen** (Befund 70). Sie war die
  letzte Hauptseite ohne; sieben Prüfungen halten Suchen, Filtern, Zählen,
  Zurücksetzen, den Klappzustand und beide Sortierungen fest – darunter die
  Regel, dass nie geübte Stöße bei „Schwächstes zuerst" ans Ende rücken.
  Am Programm ändert sich nichts.

## 0.13.4 – 24.11.2026

### Innen
- **Klappknöpfe sagen Vorleseprogrammen, ob ihr Bereich offen ist**
  (Befund 69). Die beiden Knöpfe, die einen Bereich auf- und zuklappen –
  „Angaben" im Baukasten und „Filter" auf der Seite Stöße – tragen jetzt
  `aria-expanded`. Am Bild ändert sich nichts.

## 0.13.3 – 24.11.2026

### Geändert
- **Der Knopf „Attribute" heißt jetzt „Angaben ausblenden" bzw. „Angaben
  einblenden"** (Befund 68). Er klappt den Bereich unter dem Tischbild auf und
  zu – die vier Reiter Stoß, Bewertung, Coach und Erweitert. „Attribute" war
  Fachsprache und benannte obendrein einen Inhalt, während der Knopf eine
  Handlung auslöst. Der neue Text wechselt mit dem Zustand und sagt damit
  jeweils, was der nächste Klick tut.

## 0.13.2 – 24.11.2026

### Geändert
- **Die Werkzeugleiste im Baukasten schneidet kein Werkzeug mehr an**
  (Befunde 66 und 67). Passten die zwölf Werkzeuge nicht ins Fenster, lugte
  unten ein halbes Werkzeug herein, noch bevor jemand gerollt hatte – ein
  rollender Bereich endet an seiner Polsterkante, nicht an der Unterkante des
  letzten ganzen Knopfes. Die Leiste misst jetzt selbst nach, welcher Knopf als
  letzter vollständig passt, und hört genau dort auf. Beim Rollen darf ein
  Werkzeug weiterhin angeschnitten sein; das ist gewollt. Nachgemessen bei
  Fensterhöhen von 560 bis 1100 px und in der schmalen Darstellung (unter
  760 px Breite, Leiste quer): kein angeschnittenes Werkzeug. Die eine Grenze:
  bei 480 px Fensterhöhe bleiben der Leiste 28 px – weniger als ein Knopf hoch
  ist –, dort hilft nur ein kleinerer Tisch.

## 0.13.1 – 24.11.2026

### Innen
- **Die Versionsnummer in `package-lock.json` wird jetzt mitgeführt**
  (Befund 65). Sie stand dort noch auf 0.8.4, während das Programm bei 0.13.0
  war – npm schreibt diese Kopie nur bei einem `npm install` fort. Am Programm
  ändert sich nichts; die Nummer wird weiterhin ausschließlich aus
  `package.json` gelesen. Damit die beiden nicht wieder auseinanderlaufen,
  prüft das ein Test bei jedem Testlauf.

## 0.13.0 – 24.11.2026

### Neu
- **Sperrzone:** ein Bereich, in dem der Weiße nicht liegen bleiben darf. Im
  Baukasten gibt es dafür ein eigenes Werkzeug (⊘) links in der Leiste: auf den
  Tisch tippen setzt die Zone, ziehen verschiebt sie, der Regler rechts stellt
  den Radius ein, und "Sperrzone entfernen" nimmt sie wieder weg. Auf dem Tisch
  steht sie als roter gestrichelter Kreis mit Querbalken – deutlich anders als
  die grüne Zielzone, damit beide nicht zu verwechseln sind.
- **Die Regel:** bleibt der Weiße in der Sperrzone liegen, kostet das den ganzen
  Versuch – **0 Punkte**, in jeder Bewertungsart, auch wenn der Ball gefallen
  ist. Damit lässt sich zum ersten Mal eine Übung bauen, die nicht nur ein Ziel
  vorgibt, sondern auch verbietet, wo der Weiße nicht hingehört.
- **Beim Training** wird die Position des Weißen jetzt auch dann abgefragt, wenn
  eine Übung sonst nur das Einlochen zählt – ohne die Position wäre die
  Sperrzone nicht prüfbar.
- **Mitgeteilte Übungen** nehmen die Sperrzone mit. Bei Übungen ohne Sperrzone
  bleibt der mitgeteilte Text Zeichen für Zeichen derselbe wie bisher; die
  Fingerabdrücke aller 25 mitgelieferten Übungen sind nachgemessen unverändert.

## 0.12.0 – 24.11.2026

### Neu
- **Markierungen auf dem Tuch sind jetzt einstellbar.** Ein eigener Abschnitt
  in den Einstellungen mit sieben Häkchen: Diamanten, Kopflinie, Kopf- und
  Fußpunkt, Hilfslinien, Anstoßfeld, Dreieck am Fußpunkt und Punkteraster.
- **Es gilt dort, wo der Tisch die Arbeitsfläche ist** – im Baukasten und
  beim Training. Die Vorschaubilder der Sammlung, die Stoßseite und die
  Bilder zum Teilen behalten ihr ruhiges Bild, unabhängig davon, was
  eingestellt ist.
- Die beiden Knöpfe **Hilfslinien** und **Raster** in der Werkzeugleiste des
  Baukastens schalten dieselben Einstellungen. Was dort umgelegt wird, bleibt
  umgelegt – genau wie der Knopf für die Ausrichtung.

### Geändert
- **Anstoßfeld und Dreieck haben eigene Häkchen** und sind zunächst **aus**.
  In Version 0.11.0 kamen sie zusammen mit den Hilfslinien; getrennt
  geschaltet sind sie dort, wo sie gebraucht werden, und stören sonst nicht.
  Ein Klick in den Einstellungen holt sie zurück.
- Eine **eingespielte Sicherung** ohne diesen Abschnitt verliert nichts: jedes
  fehlende oder unlesbare Häkchen fällt auf seinen Standard zurück.

## 0.11.0 – 24.11.2026

### Neu
- **Linien statt Raster im Baukasten.** Wo bisher eine Punktewolke lag, liegen
  jetzt dünne Linien von Diamant zu Diamant – sieben längs, drei quer. Das ist
  das Netz, nach dem am Tisch tatsächlich gerechnet wird: Bandenspiel,
  Systeme, Ausspielzonen. Die Punkte waren ein Hilfsmittel aus dem
  Zeichenprogramm, die Linien sind eine Eigenschaft des Tisches.
- **Anstoßfeld und Dreieck.** Dazu gehören zwei weitere feine Markierungen:
  das Feld, in dem der Weiße beim Anstoß liegen darf (Kopfbande, Kopflinie und
  die jeweils zweiten Diamanten), und der Umriss des vollen Dreiecks am
  Fußpunkt – er zeigt den Platz, auch wenn gerade keine Kugeln darin stehen.
- Beides schaltet der Knopf **Hilfslinien** in der Werkzeugleiste, und er ist
  von Anfang an an. Das **Punkteraster** gibt es weiterhin, aber als Zusatz
  mit eigenem Knopf; es ist jetzt zunächst aus.

### Hinweis
- Am **Einrasten** ändert sich nichts: es hängt weiter an der Rasterweite in
  den Einstellungen und wirkt auch dann, wenn die Punkte nicht zu sehen sind.
  Wer sie sehen will, schaltet „Raster" dazu.

## 0.10.0 – 24.11.2026

### Neu
- **Ein Aufbau mit einem Griff.** Im Baukasten stehen jetzt drei neue Knöpfe:
  **Rack 8** stellt das volle Dreieck auf den Fußpunkt – regelgerecht, mit der
  Eins an der Spitze, der Acht in der Mitte und hinten je einmal voll und halb.
  **Rack 9** stellt die Neuner-Raute auf, Eins vorn, Neun in der Mitte. Statt
  fünfzehn Kugeln einzeln zu setzen, genügt ein Druck.
- **Mischen** verteilt die vorhandenen Objektbälle zufällig über den Tisch:
  ohne Überschneidung, mit Abstand zu den Taschen und zu allem, was stehen
  bleibt. Gedacht für Ausspiel- und Laufübungen – so lange drücken, bis die
  Lage interessant aussieht. Nummer und Reihenfolge behält dabei jede Kugel,
  nur ihr Platz ändert sich.
- Alle drei Knöpfe lassen den Weißen sowie Stör- und Geisterbälle stehen und
  sind durch **Rückgängig** gedeckt. Gibt es keine Objektbälle, bleibt
  „Mischen" sichtbar stehen und nennt den Grund.

## 0.9.3 – 24.11.2026

### Behoben
- **Der Tastaturfokus läuft nicht mehr ins Leere** (Befund 64). Wer eine Übung
  auf die Vorlage zurücksetzt oder seine Fassung behält, lässt damit den
  Hinweis verschwinden – samt dem Knopf, auf den er gerade gedrückt hat. Der
  Fokus fiel dann auf den Seitenanfang zurück, und wer mit der Tastatur
  arbeitet, musste sich wieder durch die ganze Seite tasten. Jetzt übernimmt
  die Überschrift der Seite, und die Tabulatortaste führt von dort zum nächsten
  Knopf. Dasselbe gilt für jeden Dialog, dessen Auslöser verschwindet, während
  er offen ist.

## 0.9.2 – 24.11.2026

### Innen
- **Drei weitere ungenutzte Funktionen entfernt** (Befund 62). Sie lagen in der
  Datenschicht und wurden von keiner Seite aufgerufen – die Seiten lesen
  unmittelbar aus der Datenbank mit und werden dadurch von selbst neu
  gezeichnet. Am Programm ändert sich nichts.
- **Ein Prüfbefehl, der wirklich prüft** (Befund 63): `npm run typecheck`. Der
  naheliegende Aufruf `npx tsc --noEmit` übersetzte in diesem Projekt ein
  leeres Programm und meldete deshalb nie etwas – die Hauptkonfiguration
  enthält nur Verweise auf die beiden Teilkonfigurationen. Geprüft wurde
  trotzdem immer, denn der Bau ruft dieselbe Prüfung auf; nur der zusätzliche
  Handgriff lief ins Leere.

## 0.9.1 – 24.11.2026

### Neu
- **Der Vergleich zur überarbeiteten Vorlage.** Der Hinweis auf der Stoßseite
  führt jetzt auf *Vorlage ansehen*: ein Fenster zeigt deine Fassung und die
  Vorlage als zwei Tischbilder nebeneinander und nennt darunter, was anders ist
  – Ballpositionen und Wege, Name, Beschreibung, Hinweis, Eigenschaften,
  Bewertung, Schlagwörter. Erst danach kommt die Entscheidung: **Auf Vorlage
  zurücksetzen**, **Meine Fassung behalten** oder **Später entscheiden**.
- Die zusätzliche Rückfrage vor dem Zurücksetzen entfällt dadurch: wer die
  beiden Bilder nebeneinander gesehen hat, weiß besser, was er aufgibt, als
  jeder Fragetext es sagen könnte. Der Satz, dass Favorit und
  Trainingshistorie bleiben, steht über den Knöpfen.

## 0.9.0 – 24.11.2026

### Neu
- **Die App sagt Bescheid, wenn eine mitgelieferte Übung überarbeitet wurde.**
  Wer eine mitgelieferte Übung im Baukasten speichert, übernimmt sie – eine
  spätere Korrektur der Vorlage, etwa an den Ballpositionen, ging bisher
  stillschweigend an ihr vorbei. Jetzt steht auf der Stoßseite dieser einen
  Übung ein ruhiger Hinweis, und du entscheidest: **Auf Vorlage zurücksetzen**
  (deine Änderungen gehen verloren, Favorit und Trainingshistorie bleiben) oder
  **Meine Fassung behalten** (der Hinweis verschwindet und kommt erst wieder,
  wenn sich die Vorlage das nächste Mal ändert). Der große Weg über die
  Einstellungen – *Mitgelieferte Stöße wiederherstellen* für alle auf einmal –
  bleibt unverändert.
- Der Hinweis erscheint nur dort, wo er etwas bedeutet: nicht bei eigenen
  Stößen, nicht bei geteilten, nicht bei unveränderten mitgelieferten (die holt
  die Aktualisierung der Sammlung ohnehin ein).

### Innen
- Jede mitgelieferte Übung trägt ab jetzt einen kurzen Stand ihrer Vorlage mit,
  der sich aus ihrem Inhalt selbst ergibt. Dadurch braucht keine Übung eine von
  Hand gepflegte Versionsnummer, und es kann nicht passieren, dass eine
  Korrektur vergessen wird mitzuzählen.
- Übungen, die schon vor dieser Version übernommen wurden, gelten einmalig als
  aktuell – von welcher Fassung sie abstammen, lässt sich nicht mehr
  feststellen. Ab der nächsten Überarbeitung einer Vorlage greift der Hinweis.

## 0.8.5 – 24.11.2026

### Innen
- **Eine ungenutzte Funktion zum Umbenennen entfernt.** Sie stand in der
  Datenschicht, wurde von nirgends aufgerufen – und hätte, wenn man sie später
  angeschlossen hätte, die Regel aus 0.7.0 unterlaufen: eine umbenannte
  mitgelieferte Übung wäre weiterhin als mitgeliefert gezählt worden und hätte
  beim nächsten Einspielen der Sammlung ihren alten Namen zurückbekommen. Am
  Programm ändert sich nichts.

## 0.8.4 – 24.11.2026

### Innen
- **Die vier Sicherheitsmeldungen aus der Baukette sind weg.** Sie kamen von einem
  Hilfspaket zum Suchen von Dateien, das das Werkzeug für den Offline-Vorrat
  mitbringt. Statt dieses Werkzeug auf eine ältere Fassung zurückzudrehen, ist nun
  im Projekt festgelegt, dass überall die bereinigte Fassung des Hilfspakets
  verwendet wird. Der erzeugte Offline-Vorrat ist danach Zeichen für Zeichen
  derselbe wie vorher (18 Dateien, 621,55 KiB), und acht Pakete weniger werden
  überhaupt installiert. `npm audit` meldet jetzt nichts mehr.

## 0.8.3 – 24.11.2026

### Innen
- **Drei von vier großen Versionssprüngen sind gemacht:** React 18 → 19,
  Zustand 4 → 5 und dexie-react-hooks 1 → 4. Jeder einzeln, mit Tests, Linter
  und Bau danach; nach dem React-Sprung zusätzlich eine Probe im Browser (Ball
  ziehen, Dialoge, der Wächter beim Verlassen einer Seite). Am Programm selbst
  ändert sich keine Zeile. Einzig sichtbare Folge: die App lädt beim allerersten
  Aufruf eines Geräts etwa 22 Kilobyte mehr – danach liegt alles wie gehabt im
  Offline-Vorrat.
- **TypeScript 7 muss warten.** Der Prüfer selbst käme mit dem Projekt zurecht
  (geprüft: keine einzige Meldung, und er ist etwa doppelt so schnell), aber der
  Linter verweigert mit TypeScript 7 den Dienst – seine Unterstützung ist
  angekündigt, aber noch nicht da. Der Schritt wurde deshalb wieder
  zurückgenommen. Die Pfadangabe in der Konfiguration ist schon auf die neue
  Schreibweise umgestellt, damit später nur noch das Paket getauscht werden muss.

## 0.8.2 – 24.11.2026

### Innen
- **Die vier wichtigsten Abläufe der Oberfläche werden jetzt automatisch
  geprüft:** eine Sicherung einspielen, einen mitgelieferten Stoß übernehmen und
  löschen, dieselbe Löschregel auf der Stoßseite, und eine Trainingseinheit von
  Hand durchspielen und abschließen. Zusammen mit der Ergebnisseite aus 0.8.1
  sind das 19 Prüfungen an fünf Seiten. Jede davon wurde gegengeprüft: gegen den
  jeweils alten Stand des Programms fällt sie durch. Am Programm selbst ändert
  sich nichts.

## 0.8.1 – 24.11.2026

### Innen
- **Die Bedienoberfläche kann jetzt automatisch geprüft werden.** Bisher prüften
  die Tests nur den rechnenden Teil – ob eine Seite das Richtige anzeigt, musste
  von Hand im Browser nachgesehen werden. Neben den bisherigen Tests läuft jetzt
  ein zweites Profil, das eine Seite zeichnet, bedient und aus einer
  nachgebildeten Datenbank liest. Den Anfang macht die Ergebnisseite einer
  Trainingseinheit mit vier Prüfungen. Am Programm selbst ändert sich nichts.

## 0.8.0 – 24.11.2026

### Geändert
- **Die vier Schwellen der Einstufung bleiben in ihrer Reihenfolge.** Bisher ließen
  sie sich verdrehen – „Meisterlich ab 50 %" bei „Im Aufbau ab 90 %" –, und dann
  bekam ein halb geglücktes Ergebnis die höchste Stufe. Jetzt schiebt eine
  angehobene Schwelle die darüberliegenden mit, und keine rutscht unter die
  darunter. Das gilt im Baukasten, in den Standardwerten und auch für eine
  eingelesene Sicherung.
- **Getippter Text lässt sich zurücknehmen.** Kurzbeschreibung, Hinweis des Coachs,
  Schlagworte und der Treffpunkt auf dem Weißen landen jetzt in der
  Rückgängig-Historie – ein Eintrag je Feld, nicht je Tastendruck. Bisher sprang
  *Rückgängig* nach dem Tippen an den Stand vor der letzten Ballbewegung und nahm
  den Text wortlos mit.
- **„Saubere Hand" zählt, was dort steht: 20 Versuche am Stück.** Bisher musste
  eine ganze Einheit ohne einen einzigen Kratzer bleiben – wer beim zweiten von
  dreißig Versuchen kratzte und die restlichen 28 sauber spielte, ging leer aus.
  Der Erfolg zeigt jetzt außerdem den Fortschritt, so wie die Erfolge für
  aufeinanderfolgende Tage.

### Behoben
- **Das Teilen-Bild folgt der eingestellten Ausrichtung.** Wer auf Hochformat
  eingestellt hatte, bekam im Teilen-Dialog und in der gespeicherten Bilddatei
  trotzdem einen querliegenden Tisch.
- **„Alle Daten löschen" sagt Bescheid, wenn es nicht klappt.** Bisher blieb der
  Bildschirm nach zweifacher Bestätigung einfach stehen. Im Fenster davor steht
  jetzt außerdem der häufigste Grund: weitere offene Fenster dieser App halten die
  Datenbank fest.
- **„Bande anhängen" rechnet nicht mehr aus der Tischecke.** Ein Weg ohne Ball und
  ohne eigenen Anfangspunkt wird nicht gezeichnet – angehängt wurde trotzdem,
  ausgehend von der Ecke des Tisches. Jetzt sagt die App, dass dieser Weg keinen
  Anfang hat.
- **Farbwerte mit Transparenz aus einer bearbeiteten Sicherung zerlegen das
  Diagramm nicht mehr.** Stand im Tuch etwa `#3f92d2ff`, verschwanden Bandenkante,
  Kopflinie und Punkte, und die Diamanten wählten immer die helle Farbe.

### Innen
- Die Schriftfarbe der Ballnummern entfällt – sie wurde seit der weißen Scheibe
  unter der Nummer nirgends mehr gelesen.
- Zwei Fassungen der Frage „wo fängt dieser Weg an?" sind wieder eine.
- Die Zählung der Einheiten je Fähigkeit sagt im Typ nur noch zu, was sie liefert.

## 0.7.0 – 23.11.2026

### Geändert
- **Ein geänderter mitgelieferter Stoß gehört jetzt dir.** Wer eine mitgelieferte
  Übung im Baukasten speichert, bekommt damit seine eigene Fassung. Eine spätere
  Aktualisierung der Übungssammlung geht daran vorbei, statt Name, Notizen und
  Aufbau stillschweigend zu überschreiben. Auch ein gelöschter mitgelieferter
  Stoß bleibt gelöscht – bisher kam er beim nächsten Update zurück. Wer die
  Vorlage zurückhaben will, nimmt weiterhin *Einstellungen → Mitgelieferte Stöße
  wiederherstellen*; dort steht vorher, was dabei verloren geht.
- **„Stoß löschen" steht im Baukasten nicht mehr an unberührten mitgelieferten
  Stößen.** Die Stoßseite hat das nie angeboten – jetzt gilt an beiden Orten
  dieselbe Regel. „Duplizieren" bleibt überall. Sobald ein mitgelieferter Stoß
  gespeichert und damit übernommen wurde, lässt er sich wie jeder eigene löschen.

### Behoben
- **Eine eingespielte Sicherung wirkt sofort.** Farben, Ausrichtung, Raster und
  Standardwerte aus der Sicherung landeten zwar in der Datenbank, die Anzeige
  arbeitete aber mit den alten weiter – bis zum nächsten Neuladen oder bis
  irgendeine Einstellung angefasst wurde und alles auf einmal umsprang. Nach dem
  Einspielen wird jetzt dasselbe nachgezogen wie beim Start; fehlt nach
  „Ersetzen" ein Spielerprofil, wird es gleich angelegt.
- **Eine Einheit, die es nicht mehr gibt, sagt das.** Bisher stand auf ihrer
  Seite für immer „Wird geladen …" – etwa wenn man nach dem Löschen eines Stoßes
  über die Zurück-Taste auf seinem Ergebnis landete. Jetzt steht dort, was fehlt,
  und ein Knopf führt zurück zu den Stößen.
- **Die Tabelle der Statistik hält sich an den gewählten Zeitraum.** „7 Tage"
  oben und Zahlen aus einem halben Jahr in der Tabelle darunter passten nicht
  zusammen. Das Gesamtniveau kommt aus dem Profil und kennt keinen Zeitraum –
  das steht jetzt dabei.
- **Das Ziehen im Baukasten ruckelt nicht mehr am Raster.** Die Rasterpunkte
  wurden bei jeder Fingerbewegung neu erzeugt – 465 Stück in der Standardweite,
  1953 bei Achtel-Diamanten. Gemessen kostete ein Bild dadurch 4,5 bzw. 14,3
  Millisekunden; jetzt sind es 1,6, unabhängig von der Rasterweite.

## 0.6.3 – 23.11.2026

### Behoben
- **Die Einstellungen sagen jetzt, wenn der Browser das Speichern ablehnt.** Tuchfarbe,
  Bandenfarbe, Ausrichtung, Raster, Rasterweite, Standardradius und die Schwellen für
  die Wertung wurden bisher stillschweigend verworfen, wenn der Speicher voll war: die
  Anzeige sprang auf den alten Wert zurück, als hätte der Regler geklemmt. Dasselbe
  beim Wechsel des Spielerprofils auf der Startseite und in den Einstellungen und beim
  Drehen des Tisches im Baukasten. Jetzt erscheint eine Kurzmeldung mit dem Grund.
- **Dieselbe Kurzmeldung erscheint nicht mehrfach übereinander.** Ein Regler löst beim
  Ziehen viele Änderungen hintereinander aus; sonst hätte jede einzelne ihre eigene
  Meldung aufgestapelt.

## 0.6.2 – 23.11.2026

### Behoben
- **Eine Sicherung wird jetzt geprüft, bevor sie gespeichert wird.** Bisher ging
  ihr Inhalt ungeprüft in die Datenbank — anders als ein geteilter Stoß, der
  Feld für Feld geprüft wird. Eine beschädigte oder von Hand bearbeitete Datei
  konnte die App dadurch dauerhaft lahmlegen: die fehlerhaften Daten blieben
  gespeichert und brachten bei jedem Start dieselbe Ansicht zu Fall. Jetzt wird
  jeder Wert einzeln geprüft; Einträge ohne Kennung werden weggelassen, und die
  Meldung am Ende nennt, wie viele es waren.
- **Ein voller Speicher bleibt nicht mehr stumm.** „Speichern" im Baukasten sah
  aus wie nichts, wenn der Browser das Schreiben ablehnte — kein Hinweis, keine
  Meldung. Jetzt sagt eine Kurzmeldung, was los ist, und der Stoß bleibt offen,
  statt verloren zu gehen. Dasselbe beim Duplizieren, Löschen, Übernehmen eines
  geteilten Stoßes, bei Workouts, Spielerprofilen und der Sicherung.
- **„Trainieren" startet nicht mehr, wenn das Speichern scheitert.** Sonst liefe
  die Einheit auf einem Stand, den es nirgends gibt.
- **Die Trefferquote zeigt einen Strich, wo nichts einzulochen ist.** Bei Stößen
  ohne Objektball stand dort 0 %, was wie ein schlechtes Ergebnis aussah. In der
  Statistik über alle Stöße zählen solche Versuche gar nicht mehr mit; die
  Kratzerquote bleibt unverändert, denn ein Kratzer ist auch dort einer.

### Geändert
- Spielerprofile tragen kein leeres Erfolgsfeld mehr mit sich herum. Die Erfolge
  werden ohnehin aus der Trainingshistorie gerechnet und sind damit auch nach
  einem Import richtig.

## 0.6.1 – 23.11.2026

### Behoben
- **Ein Stoß ohne Objektball und ohne Zielzone gab für jeden Versuch die volle
  Punktzahl.** Weil es nichts einzulochen gab, zählte die Bewertung den Druck auf
  „Erfassen" als Treffer: zehn von zehn Punkten, 100 Prozent für eine ganze
  Einheit — und das Ergebnis landete im Profil des Spielers. Solche Stöße nimmt
  das Training jetzt gar nicht erst an und sagt, was fehlt: eine Zielzone oder ein
  Objektball. Im Workout lässt sich der betroffene Abschnitt überspringen, die
  übrigen laufen normal weiter.
- **Die Trefferquote zählte Übungen ohne Objektball als lauter Treffer.** Ein
  erfasster Versuch wird nicht mehr als eingelocht gemeldet. An den Punkten ändert
  das nichts — dort zählt die Lage des Weißen —, wohl aber an der Trefferquote in
  der Zusammenfassung, auf der Stoßseite und in der Statistik über alle Stöße.
- **„Als Bild" verlor die Ballnummern.** Das ausgegebene PNG holte Größe und
  Ausrichtung der Ziffern aus der Formatvorlage der Seite, die einem einzeln
  geladenen Bild nicht mitgegeben wird. Die Nummern standen dadurch riesig neben
  dem Ball oder ganz außerhalb des Bildes. Sie tragen ihre Maße jetzt selbst.
- **Eine verdrängte Rückfrage bleibt nicht mehr unbeantwortet.** Öffnete sich eine
  zweite Frage, während die erste noch offen war, wartete der Aufrufer der ersten
  für immer. Eine verdrängte Frage gilt jetzt als abgebrochen — also: nichts tun.

## 0.6.0 – 23.11.2026

### Neu
- **Der Weiße lässt sich wieder aufs Tuch setzen.** Im Baukasten gab es Werkzeuge
  für Objektball, Störball und Geisterball — nur nicht für den Weißen. Wer ihn
  gelöscht hatte, bekam ihn nicht zurück. Jetzt steht „◉ Weißer" in der Leiste.
  Solange schon einer liegt, ist das Werkzeug grau und sagt im Tooltip, dass man
  den vorhandenen zum Verschieben antippt und zieht.
- **Übungen ohne Weißen und Übungen ohne Objektball sind erlaubt.** Es gibt
  einfache Übungen, die aus einer einzigen Kugel bestehen — ein gerader Stoß, bei
  dem nur der Weiße läuft. Der Baukasten lässt das zu.

### Behoben
- **Eine Übung ohne Objektball war nicht zu bewerten.** Die Wertung hing immer am
  Einlochen: ohne Ball zum Einlochen gab es nie Punkte, und das Training bot
  „Eingelocht" und „Verfehlt" an, obwohl es nichts einzulochen gab. Bei solchen
  Übungen zählt jetzt allein, wo der Weiße liegen bleibt; der Knopf heißt
  „Erfassen", „Verfehlt" entfällt. „Kratzer" bleibt ein Fehlversuch.

## 0.5.1 – 19.11.2026

### Behoben
- **Drei „gerade" Übungen waren in Wahrheit Schnittbälle.** Bei *Stop-Shot
  lang*, *Rückzieher lang* und *Lange Gerade* lag der Weiße so weit hinter
  dem Ball, dass er rechnerisch neben dem Tisch landete — und an die Bande
  geschoben wurde. Aus dem angesagten geraden Ball wurde dabei ein Schnitt
  von 17 bis 29 Grad, und der Weiße klebte an der Bande. Die drei Übungen
  liegen jetzt auf der langen Diagonalen, wo ein gerader Stoß dieser Länge
  auch hinpasst.
- **Der Kick über eine Bande traf mit 12 statt 20 Grad.** Der Weiße wurde für
  den Kick einfach auf die andere Tischhälfte gespiegelt. Seine Lage wird
  jetzt rückwärts aus der Anspiellinie gerechnet: über die Bande kommt er im
  angesagten Winkel an.

### Neu
- **Die mitgelieferten Übungen werden jetzt geprüft.** Zwölf Prüfungen rechnen
  jede der 25 Übungen gegen die Tischgeometrie: kein Ball in der Bande, keine
  zwei Bälle ineinander, kein Weißer an der Bande festgeklemmt, Schnittwinkel
  wie angesagt, Bandenwege mit stimmendem Ein- und Ausfallswinkel, erreichbare
  Zielzonen. Genau so sind die beiden Fehler oben aufgefallen.

### Geändert
- Die Übungssammlung trägt Version 2. Die berichtigten Übungen kommen damit
  auch auf Geräte, die die App schon haben; als Favorit markierte Übungen
  bleiben markiert.

## 0.5.0 – 18.11.2026

### Behoben
- **Die Zurück-Taste verliert keine Arbeit mehr.** Baukasten, Training und
  Workout fragten nach, bevor man sie verließ — aber nur auf ihrem eigenen
  Knopf. Die Zurück-Taste des Browsers und die Wischbewegung von links auf dem
  iPad gingen daran vorbei: der angefangene Stoß und die schon erfassten
  Versuche waren still weg. Jetzt läuft jeder Weg hinaus in dieselbe
  Rückfrage.
- **Training und Workout warnen auch beim Neuladen.** Was der Baukasten seit
  0.4.7 kann, können die beiden Trainingsseiten jetzt ebenso: Wer die Seite
  mit erfassten Versuchen neu lädt oder schließt, wird vom Browser gefragt.

### Geändert
- Die Seitenverwaltung läuft jetzt über einen Daten-Router. Die Adressen
  bleiben dieselben, auch die gespeicherten und geteilten Links. Die App wird
  dadurch beim ersten Laden um rund 17 kB (gepackt) größer.

## 0.4.7 – 18.11.2026

### Behoben
- **Nicht gespeicherte Arbeit am Stoß geht beim Neuladen nicht mehr still
  verloren.** Die Rückfrage „Änderungen verwerfen?“ kam bisher nur, wer den
  Baukasten über den eigenen Knopf *← Stöße* verließ. Neu laden, den Tab oder
  das Fenster schließen ging daran vorbei — der angefangene Stoß war weg, ohne
  dass etwas gefragt wurde. Jetzt fragt der Browser in diesen Fällen nach,
  solange etwas Ungespeichertes offen ist.
  *Nicht erfasst:* die Zurück-Taste des Browsers und die Wischbewegung auf dem
  iPad. Dafür wäre ein Umbau der Seitenverwaltung nötig; das bleibt offen.

## 0.4.6 – 18.11.2026

### Behoben
- **„Als Datei“ schreibt jetzt eine Datei, die sich auch wieder einlesen lässt.**
  Bisher kam dabei die rohe interne Form eines Stoßes heraus. Weder
  *Geteilten Stoß übernehmen* noch *Sicherung einspielen* nahm sie an — die
  Datei war ein Weg, der nirgendwohin führte. Sie enthält jetzt denselben Code
  wie der Link, in einer Hülle, an der die App sie wiedererkennt.

### Neu
- **Datei wählen beim Übernehmen.** Unter *Geteilten Stoß übernehmen* steht
  neben *Lesen* ein Knopf **Datei wählen …**. Er liest eine Datei ein, die
  *Als Datei* beim Teilen geschrieben hat — ohne Umweg über Öffnen und
  Hineinkopieren.

### Geändert
- Wer einen einzelnen geteilten Stoß versehentlich unter *Sicherung
  einspielen* wählt, liest nicht mehr „Das ist keine Sicherung dieser App“,
  sondern erfährt, dass die Datei aus dieser App stammt und wo sie hingehört.

## 0.4.5 – 18.11.2026

### Behoben
- **Escape spielt eine Sicherung nicht mehr ein.** Die Frage „Vorhandene Daten
  ersetzen?“ hatte drei Antworten, aber nur zwei Knöpfe: „Abbrechen“ bedeutete
  in Wahrheit „Hinzufügen“. Wer die falsche Datei erwischt hatte und floh —
  mit Escape, einem Tipp neben den Dialog oder dem Abbrechen-Knopf —, spielte
  sie damit ein. Die Frage hat jetzt drei eigene Antworten: **Abbrechen**,
  **Hinzufügen**, **Ersetzen**. Jede Flucht bedeutet: nichts tun. Der Dateiname
  steht in der Frage, damit zu sehen ist, worum es geht.

## 0.4.4 – 18.11.2026

### Behoben
- **Der Zeitraum der Statistik wandert mit.** „7 Tage“ und „30 Tage“ standen
  ab dem Aufbau der Seite fest. Wer die Statistik offen liegen ließ und später
  wieder hinsah, bekam das Fenster von vorhin — über Mitternacht also das von
  gestern. Jetzt wird neu gerechnet, sobald die Seite wieder in den Blick kommt.

### Innen
- **Drei abgeleitete Werte leben nicht mehr als Zustand.** Der geteilte Stoß
  auf der Übernahmeseite, Link und Länge im Teilen-Dialog und das Zurücksetzen
  beim Stoßwechsel im Training folgen jetzt aus dem, was hereinkommt, statt
  nachträglich gesetzt zu werden. An der Bedienung ändert sich nichts. Nebenbei
  kann ein spät eintreffender QR-Code nicht mehr zum vorigen Link gehören.

## 0.4.3 – 18.11.2026

### Behoben
- **Die Eingabetaste löst eine Frage nicht mehr zweimal aus.** Wer eine
  Eingabefrage mit Enter bestätigte — Anzahl der Versuche, Spielername,
  Name eines Workouts —, bekam die Antwort übernommen und dieselbe Frage
  gleich noch einmal vorgesetzt: die Taste wirkte nach dem Schließen auf dem
  Knopf weiter, der die Frage geöffnet hatte. Mit der Maus trat das nie auf.

## 0.4.2 – 18.11.2026

### Behoben
- **„Frei“ fragt noch einmal, statt eine Zahl zu erraten.** Wer bei „Wie viele
  Versuche?“ etwas eintippte, das keine Zahl ist, bekam wortlos eine Einheit
  mit einem einzigen Versuch. Jetzt steht der erlaubte Bereich in der Frage,
  und bei einer unlesbaren Eingabe wird sie wiederholt — mit dem, was schon
  dasteht, zum Berichtigen.

### Innen
- **Eine statische Prüfung kommt dazu: `npm run lint`.** Sie findet, was der
  Typprüfer nicht sehen kann — unvollständige Abhängigkeitslisten, Hooks an
  der falschen Stelle, übrig gebliebene Zuweisungen. Sechs Stellen im
  vorhandenen Quelltext verstoßen bewusst gegen eine Regel; jede trägt die
  Ausnahme mit Begründung an Ort und Stelle.

## 0.4.1 – 18.11.2026

### Behoben
- **Eine von Hand geänderte Adresse kann das Training nicht mehr lahmlegen.**
  `?attempts=1000000000` ließ den Tab am Speicher sterben, `?attempts=-5`
  zeigte eine Einheit, die fertig war, bevor der erste Versuch erfasst werden
  konnte, und eine erfundene Form stand hinterher in der gespeicherten Einheit.
  Beide Angaben werden jetzt geprüft: die Anzahl bleibt zwischen 1 und 200,
  eine unbekannte Form gilt als „Standard“.

### Innen
- **Die Bauwerkzeuge sind auf dem aktuellen Stand** — Vite 8, Vitest 5 und die
  beiden Zusätze dazu. Das räumt die Hälfte der gemeldeten Schwachstellen im
  Werkzeugkasten ab, darunter beide kritischen; der Rest hängt an einer
  Bibliothek, für die es noch keine fehlerfreie Fassung gibt. An der App ändert
  sich nichts: Der Bau liefert dieselben Dateien, und alte Geräte bekommen
  weiterhin die ältere Schreibweise. Gebraucht wird jetzt Node 22.12 oder neuer.

## 0.4.0 – 17.11.2026

### Geändert
- **Die App startet leichter.** Bisher lud der erste Aufruf alles auf einmal,
  auch den Shot Builder und den Teilen-Dialog. Beides kommt jetzt erst beim
  Öffnen nach. Der erste Aufruf überträgt 120 statt 147 Kilobyte; der Builder
  lädt dann 8 Kilobyte nach. Offline bleibt alles verfügbar — der Vorrat des
  Browsers enthält weiterhin jeden Teil.

### Behoben
- **Fehlermeldungen beim Speichern sind auf Deutsch.** Statt „Nicht
  gespeichert: DatabaseClosedError Database has been closed“ steht dort jetzt,
  was los ist und was zu tun ist. Betroffen sind das Training, das Workout,
  das Einspielen einer Sicherung und die Seite, die beim Start erscheint, wenn
  der Browser keinen Speicher zulässt. Ein unbekannter Fehler behält seinen
  technischen Text — der nennt wenigstens die Ursache.

## 0.3.6 – 17.11.2026

### Behoben
- **Auf schmalen Telefonen lässt sich die Seite nicht mehr seitlich
  verschieben.** Die Leiste am unteren Rand war breiter als das Fenster und
  schob die ganze Seite mit. Auf einem 375 Punkte breiten Gerät passt sie
  jetzt vollständig; auf noch schmaleren rollt nur noch die Leiste selbst.

### Innen
- Ein Kommentar verwies auf eine Regel eines Linters, den es im Projekt nicht
  gibt. Der erklärende Text bleibt, die Anweisung ist weg.
- `jsdom` stand unbenutzt in den Entwicklungsabhängigkeiten und ist gestrichen.

## 0.3.5 – 17.11.2026

### Behoben
- **Einstellungen gehen nicht mehr verloren, wenn sie schnell hintereinander
  geändert werden.** Beim Ziehen eines Schiebereglers lösen viele Änderungen
  kurz nacheinander aus; sie lasen denselben Ausgangsstand und überschrieben
  sich gegenseitig. Nachgemessen gingen von sieben gleichzeitigen Änderungen
  sechs verloren, jetzt keine.
- **Das Fähigkeitsprofil zeigt alle Beschriftungen vollständig.** Sie lagen
  auf dem äußersten Ring des Netzes und fünf von vierzehn waren am Rand
  abgeschnitten („Schnittb“, „Dünner Schni“). Jetzt stehen sie außerhalb des
  Netzes und vollständig im Bild; auf schmalen Geräten verkleinert sich das
  Bild mit.

## 0.3.4 – 17.11.2026

### Behoben
- **„1 erfasste Versuche“ heißt jetzt „1 erfasster Versuch“.** Zahlwörter
  bekommen die richtige Zahlform: in den Abbruchfragen von Training und
  Workout, in der Meldung nach dem Einspielen einer Sicherung, in der
  Workout-Liste und über der Zusammenfassung einer Einheit.

## 0.3.3 – 17.11.2026

### Geändert
- **Der Entwicklungsserver hört nur noch auf diesem Rechner.** Bisher war er
  für jedes Gerät im WLAN erreichbar, und die bekannten Pfadlücken des
  Entwicklungsservers standen damit offen. Für die Probe auf dem Tablet:
  `npm run dev -- --host`. Die veröffentlichte App war davon nie betroffen.

### Behoben
- **Die letzte Schwachstelle in der ausgelieferten App ist weg.**
  react-router hatte zwei offene Meldungen; die Fassung 7 behebt beide.
  An der Bedienung ändert sich nichts.

## 0.3.2 – 17.11.2026

### Behoben
- **Eine beschädigte Sicherung wird abgewiesen, statt halb eingespielt zu
  werden.** Geprüft wurde bisher nur die Liste der Stöße. War ein anderer
  Teil der Datei verdorben, brach das Einspielen mitten im Lauf mit einer
  unverständlichen Meldung ab. Jetzt wird die ganze Datei geprüft, bevor
  etwas geschrieben wird, und die Meldung sagt, welcher Teil nicht stimmt
  und dass nichts eingespielt wurde. Ältere Sicherungen ohne Spieler,
  Einheiten oder Workouts bleiben einspielbar.
- **„Zurücksetzen“ setzt die Zielzone wirklich zurück.** Der Dialog
  versprach sie, die Zone blieb aber stehen, wo sie war. Ein reiner
  Lochstoß bekommt dabei weiterhin keine Zone.

## 0.3.1 – 17.11.2026

### Behoben
- **Favoriten überleben das Wiederherstellen.** „Mitgelieferte Stöße
  wiederherstellen“ setzte die Favoritenmarkierung zurück. Der Dialog sagt
  jetzt außerdem offen, was dabei wirklich verloren geht: eigene Änderungen an
  mitgelieferten Stößen, nicht aber die Favoriten.
- **„Duplizieren“ verliert die Änderungen des Originals nicht mehr.** Wer
  einen Stoß bearbeitete und dann duplizierte, bekam die Änderungen in der
  Kopie — das Original fiel still auf seinen alten Stand zurück. Es wird jetzt
  vorher gespeichert.
- **Erfolge zählen nach dem Kalender statt nach Weltzeit.** Eine Einheit nach
  Mitternacht zählte zum Vortag. Dadurch rissen Trainingsreihen oder
  verschmolzen zu einer, und „100 Versuche an einem Tag“ konnte sich durch
  eine lange Nacht fälschlich freischalten.

## 0.3.0 – 17.11.2026

### Neu
- Die Version ist sichtbar: unten in den Einstellungen und auf der Fehlerseite.
  Nach einer Veröffentlichung liefert der Service Worker beim ersten Laden noch
  die alte Fassung aus — daran ist zu erkennen, welche gerade im Browser liegt.
- Dieses Änderungsverzeichnis.

### Behoben
- **Geteilte Links werden geprüft, bevor sie in die App dürfen.** Ein
  mutwillig gebauter Link konnte die Anzeige zum Absturz bringen oder einen
  Stoß mit unsinnigen Werten hinterlassen, der die Bewertung verfälscht.
  Jetzt wird jeder Wert einzeln geprüft: unbekannte Angaben fallen weg,
  Zahlen bleiben in ihren Grenzen, Texte und Listen werden gekürzt. Ehrlich
  geteilte Stöße kommen unverändert an.
- **Ein Link kann die App nicht mehr lahmlegen.** Ein kurzer Link konnte sich
  beim Entpacken auf Hunderte Megabyte aufblähen und den Browser einfrieren.
  Zu große Nutzlasten werden jetzt abgewiesen, bevor etwas entpackt wird.
- **Eine Trainingseinheit geht nicht mehr verloren, wenn das Speichern
  scheitert.** Bisher blieben nach einem Fehlschlag alle drei Ergebnisknöpfe
  grau, ohne Meldung — die erfassten Versuche waren weg. Jetzt erscheint eine
  Meldung, der letzte Versuch wird zurückgenommen, und ein zweiter Druck
  speichert.

## 0.2.0 – 28.10.2026

### Geändert
- **Eine Farbe, eine Bedeutung.** „Kratzer“ ist orange statt rot, denn er
  löscht nichts; Rot bleibt dem Löschen vorbehalten. Bernstein trägt nur noch
  die eine Hauptaktion je Abschnitt.
- **Ein Wort, eine Sache.** „Schnitt“ hieß Winkel und Mittelwert zugleich,
  „Bandenball“ Stoßart und Fähigkeit, die Startseite an drei Stellen anders.
  Jetzt: Schnittwinkel und Mittel, Bandenspiel und Ball an der Bande, Start.
  Dazu Einheit statt Session, Tempo statt Geschwindigkeit, Gesamtniveau statt
  Gesamtrating, Als Bild und Als Datei statt PNG und JSON.
- **Anzeigetexte in echtem Deutsch**, mit Umlauten. Bereits gespeicherte
  mitgelieferte Stöße werden beim Start nachgezogen — eigene Umbenennungen
  und Favoriten bleiben.
- **Gefährliche Knöpfe stehen abgesetzt**, nicht mehr in einer Reihe mit
  harmlosen. Im Builder entfernt „Entfernen“ das Markierte und „Stoß löschen“
  den ganzen Stoß; vorher hieß beides „Löschen“.
- Gesperrte Knöpfe nennen ihren Grund sichtbar.

### Behoben
- Die Werkzeugleiste des Builders lief über; das letzte Werkzeug war nur durch
  Scrollen erreichbar. Jetzt passen alle neun.

## 0.1.1 – 09.10.2026

### Behoben
- Dialoge sind native `dialog`-Elemente: Der Fokus bleibt im Dialog, Escape
  schließt, und Enter löscht nie ungefragt.
- Im Builder ruhen die Tastenkürzel, solange ein Dialog offen ist — vorher
  konnte Entf hinter einer Rückfrage den gewählten Ball entfernen.

## 0.1.0 – 06.09.2026

Erste Fassung.

- Shot Builder: Bälle, Wege, Zieltasche und Zielzone auf einem 9-Fuß-Tisch,
  mit Rückgängig und Spiegeln.
- Training: Einheiten erfassen, Versuche bewerten, Ruheposition des Weißen
  aufnehmen.
- Auswertung: Verlauf je Stoß, Fähigkeitsprofil, Trainingsvorschläge, Erfolge.
- Workouts: mehrere Stöße am Stück.
- Teilen: ein Stoß steckt vollständig im Link, dazu QR-Code und Bild-Export.
- Alles bleibt auf dem Gerät (IndexedDB), Sicherung als Datei.
- Veröffentlichung über GitHub Pages, nutzbar als installierbare Web-App.

---

Die Stände vor 0.3.0 sind nachträglich aus der Versionsgeschichte zugeordnet;
gezählt wurde damals noch nicht.
