# Änderungen

Alle nennenswerten Änderungen an Billard Training.

Die Versionsnummer steht an genau einer Stelle — in `package.json` — und erscheint
unten auf der Seite **Einstellungen** sowie auf der Fehlerseite. Schema:
`Hauptversion.Funktion.Korrektur`.

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
