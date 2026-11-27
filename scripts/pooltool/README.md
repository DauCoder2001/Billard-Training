# Nachrechnung mit pooltool

Die App rechnet Geometrie: Wo muss der Weiße liegen, damit ein Schnitt von
25 Grad entsteht? Was sie **nicht** rechnet, ist Physik — ob der Ball bei
diesem Tempo wirklich fällt und wo der Weiße danach liegen bleibt. Die
Zielzonen der mitgelieferten Übungen sind von Hand gesetzt.

Dass das nicht reicht, ist belegt: In 0.18.3 standen zwei gespiegelte
Übungen mit zwei Zielzonen, die 30,81 Zoll auseinanderlagen — höchstens eine
konnte stimmen, und die App konnte nicht sagen, welche. Aufgefallen ist es
nur, weil die beiden zufällig nebeneinander standen.

Diese Werkzeuge beantworten die drei Fragen aus Abschnitt 5.2 des Konzepts:

1. Geht die Übung mit dem angegebenen Tempo und Effet überhaupt auf?
2. Liegt die Zielzone dort, wo der Weiße wirklich hinkommt?
3. Passt die Schwierigkeit 1 bis 10 zur gerechneten Trefferquote?

**Sie laufen außerhalb der App und ändern nichts an ihr.** Sie schreiben
einen Bericht; was daraus folgt, entscheidet ein Mensch.

## Einrichten

Einmalig, dauert ein paar Minuten:

```powershell
py -3.14 -m venv .venv-pooltool
.\.venv-pooltool\Scripts\python.exe -m pip install --no-deps -r scripts\pooltool\requirements.txt
.\.venv-pooltool\Scripts\python.exe -m pip install -r scripts\pooltool\requirements.txt
```

Zwei Läufe, und das ist Absicht: Der erste holt `pooltool-billiards`, ohne
seine Abhängigkeiten aufzulösen — es nagelt `panda3d` auf 1.10.13 fest, und
für diese Version gibt es kein Paket für Python 3.14. Der zweite holt alles
Übrige, 1.10.16 statt 1.10.13 eingeschlossen. pip meldet dabei einen
Konflikt; der ist bekannt und folgenlos, denn gerechnet wird ohne
3D-Darstellung. pooltool 0.3.3 importiert aus panda3d nur eine Kleinigkeit
(`Filename` in `pooltool/utils/__init__.py`).

Der Ordner `.venv-pooltool/` steht in der `.gitignore`.

Geprüft mit Python 3.14.7 und pooltool 0.3.3 am 26.11.2026.

## Laufen lassen

Zwei Schritte. Der erste schreibt die Übungen heraus, der zweite rechnet.

```powershell
node --import ./scripts/pooltool/aufloeser.mjs scripts/pooltool/uebungen-ausgeben.ts
```

```powershell
.\.venv-pooltool\Scripts\python.exe scripts\pooltool\nachrechnen.py
```

Das schreibt `bericht.md` und `bericht.json` neben dieses README.

Ein Lauf dauert etwa zehn Minuten (38 Übungen, je 100 Versuche, rund 90
Millisekunden je Versuch). Beim allerersten Aufruf kommen etwa 20 Sekunden
dazu: numba übersetzt die Physik in Maschinencode.

### Das Tempo steht in Tischlängen

Bis 0.19.1 sagte die App zu `speed` nur „1..10", und was eine 6 in Metern je
Sekunde bedeutet, stand nirgends. Seit 0.19.2 ist das Tempo eine Strecke:
**wie viele Tischlängen der Weiße von der Kopflinie aus allein rollen
würde**, ohne einen Ball zu berühren. Das ist die Skala, die beim Billard
ohnehin gelehrt wird — Tempo 1 ist eine Länge (sanft), 2 zwei Längen
(Stellungsspiel), 3 drei (langer Rückzieher), 4 und mehr ist Break-Tempo.

Die Umrechnung in m/s ist gemessen, nicht angenommen:

```powershell
.\.venv-pooltool\Scripts\python.exe scripts\pooltool\tischlaengen.py
```

Das legt den Weißen auf die Kopflinie, stößt ihn 48-mal mit steigender
Geschwindigkeit an und zählt den gerollten Weg. Ergebnis:
`tischlaengen.json`, gemessen von 0,3 bis 4,8 m/s (0,30 bis 4,75 Längen).
Die Kurve ist nicht gerade: Eine Länge braucht 0,68 m/s, zwei brauchen 1,40,
drei 2,42 und vier 3,68 — oben kostet jede weitere Länge mehr Tempo als
unten. `nachrechnen.py` liest diese Datei und rechnet zwischen den
Stützstellen linear.

Der zweite Betriebsmodus sucht umgekehrt, welches Tempo eine Übung
verlangt:

```powershell
.\.venv-pooltool\Scripts\python.exe scripts\pooltool\nachrechnen.py --modus tempo --laeufe 60
```

Jede Übung wird die Leiter von 0,5 bis 4,5 Tischlängen in Vierteln
hinaufgespielt. Gesucht ist die **sanfteste** Stufe, die mindestens 85 % der
besten Güte erreicht; Güte ist der Anteil der Versuche, in denen der Ball
fällt **und** der Weiße in der Zielzone zur Ruhe kommt, abzüglich falscher
Taschen und gefallener Weißer. Ergebnis: `tempo.md` und `tempo.json`.

Warum nicht einfach die beste Trefferquote oder der kleinste Zonenabstand?
Beide führen in die Irre, und beide haben es am 27.11.2026 getan:

- Die **Trefferquote** allein wählt bei einer Übung mit Zielzone das Tempo,
  bei dem der Ball am sichersten fällt, und lässt den Weißen irgendwo
  stehen.
- Der **Zonenabstand** allein wählte bei „Mitteltasche aus der Entfernung"
  ein halbes Tischlängen-Tempo: Dort erreicht der Weiße die Zone in 100 %
  der gelungenen Versuche — aber es fallen nur 26 von 100 Bällen. Ein
  Viertel mehr Tempo, und es fallen 96 %, bei 23 % Zonentreffer.
- Ein **Mittelwert** trügt ebenso: Bei „Safe hinter den Ball" lag die
  mittlere Ruhelage in der Zone, erreicht hat sie kein einzelner Versuch.

### Weitere Schalter

| Schalter | Wofür |
|---|---|
| `--laeufe 200` | mehr Versuche je Übung, ruhigere Zahlen |
| `--nur builtin-stop-kurz` | nur diese Übung (mehrfach erlaubt) |
| `--saat 42` | anderer Startwert des Zufalls |
| `--eingabe` / `--ausgabe` | andere Dateien |

## Was hier liegt

| Datei | Wofür |
|---|---|
| `uebungen-ausgeben.ts` | schreibt die Übungen samt Geisterball nach `uebungen.json` |
| `aufloeser.mjs`, `haken.mjs` | lassen Node die TypeScript-Quellen der App direkt ausführen |
| `nachrechnen.py` | rechnet mit pooltool und schreibt den Bericht |
| `requirements.txt` | die Python-Pakete mit festen Versionen |
| `tischlaengen.py` | misst, wie weit der Weiße bei welchem V0 rollt |
| `tischlaengen.json` | die gemessene Kurve Tischlängen → m/s |
| `uebungen.json` | Zwischenstand, wird neu geschrieben |
| `bericht.md`, `tempo.md` | die Ergebnisse |

## Was die Zahlen nicht sagen

- **Die Streuung ist gesetzt, nicht gemessen** (oben in `nachrechnen.py`):
  0,35 Grad in der Richtung, 4 % im Tempo, 0,04 Ballradien im Treffpunkt.
  Das soll ein geübter Spieler sein. Eine andere Streuung ergibt andere
  Trefferquoten — die *Reihenfolge* der Übungen bleibt aber dieselbe, und
  darauf kommt es beim Vergleich mit der Schwierigkeit an.
- **Ein Tuchzustand.** Das Konzept verlangt zwei (neu und schnell, alt und
  langsam) und nur Übungen, die in beiden aufgehen. pooltool hat dafür
  `BallParams` (`u_s`, `u_r`, `e_c`); genutzt wird bisher die Vorgabe.
- **Keine Stoßfehler.** Gerechnet wird eine saubere Queueführung mit
  Streuung, kein Verkanten und kein Kickser.
