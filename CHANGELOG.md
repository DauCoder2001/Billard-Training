# Änderungen

Alle nennenswerten Änderungen an Billard Training.

Die Versionsnummer steht an genau einer Stelle — in `package.json` — und erscheint
unten auf der Seite **Einstellungen** sowie auf der Fehlerseite. Schema:
`Hauptversion.Funktion.Korrektur`.

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
