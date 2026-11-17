# Änderungen

Alle nennenswerten Änderungen an Billard Training.

Die Versionsnummer steht an genau einer Stelle — in `package.json` — und erscheint
unten auf der Seite **Einstellungen** sowie auf der Fehlerseite. Schema:
`Hauptversion.Funktion.Korrektur`.

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
