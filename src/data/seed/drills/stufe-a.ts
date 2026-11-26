/**
 * Stufe A - Grundschlaege und Treffsicherheit.
 *
 * Alles auf kurzer bis mittlerer Entfernung, Treffpunkt in der Mitte oder
 * knapp darueber und darunter, keine Bande im Weg. Das ist die Stufe, die
 * jeder ohne Anmeldung bekommt - sie muss fuer sich allein ein sinnvolles
 * Training sein (Konzept 3.2).
 */

import type { DrillSpec } from './build'

export const STUFE_A: DrillSpec[] = [
  {
    slug: 'stop-kurz',
    level: 'A',
    name: 'Stop-Shot kurz',
    description: 'Gerader Ball aus kurzer Distanz. Der Weiße bleibt stehen.',
    object: { x: 75, y: 25 },
    pocket: 'br',
    cut: 0,
    dist: 18,
    zone: { x: 72.7, y: 25, r: 4 },
    skills: ['stun', 'position'],
    shotType: 'cut',
    difficulty: 2,
    speed: 4,
    coachNotes:
      'Mittig treffen, mit gleichmäßigem Tempo durchstoßen. Der Weiße darf weder vor noch zurück.',
  },
  {
    slug: 'nachlauf-mittel',
    level: 'A',
    name: 'Nachlauf mittel',
    description: 'Gerader Ball, der Weiße läuft anschließend weiter nach vorn.',
    object: { x: 62, y: 38 },
    pocket: 'tr',
    cut: 0,
    dist: 22,
    zone: { x: 88, y: 44, r: 6 },
    spin: { x: 0, y: 0.6 },
    skills: ['follow', 'position'],
    shotType: 'position',
    difficulty: 3,
    speed: 5,
    coachNotes: 'Oberhalb der Mitte treffen. Das Tempo bestimmt, wie weit der Weiße läuft.',
  },
  {
    slug: 'rueckzieher-kurz',
    level: 'A',
    name: 'Rückzieher kurz',
    description: 'Gerader Ball, der Weiße kommt zurück zur Kopfseite.',
    object: { x: 70, y: 25 },
    pocket: 'br',
    cut: 0,
    dist: 16,
    zone: { x: 38, y: 25, r: 7 },
    spin: { x: 0, y: -0.7 },
    skills: ['draw', 'position'],
    shotType: 'position',
    difficulty: 4,
    speed: 6,
    coachNotes: 'Tief treffen und den Stoß durchziehen. Die Queuespitze bleibt waagerecht.',
  },
  {
    slug: 'schnitt-15',
    level: 'A',
    name: 'Schnittball 15 Grad',
    description: 'Leichter Anschnitt in die Ecke.',
    object: { x: 72, y: 30 },
    pocket: 'br',
    cut: 15,
    dist: 26,
    zone: { x: 60, y: 12, r: 8 },
    skills: ['cut', 'position'],
    shotType: 'cut',
    difficulty: 3,
    speed: 5,
    coachNotes: 'Den Geisterball vor dem Objektball sehen, nicht den Objektball selbst anvisieren.',
  },
  {
    slug: 'schnitt-30',
    level: 'A',
    name: 'Schnittball 30 Grad',
    description: 'Halber Ball. Der Weiße läuft im rechten Winkel weiter.',
    object: { x: 70, y: 32 },
    pocket: 'tr',
    cut: 30,
    dist: 28,
    zone: { x: 55, y: 18, r: 8 },
    skills: ['cut', 'stun', 'position'],
    shotType: 'cut',
    difficulty: 4,
    speed: 5,
    coachNotes:
      'Bei Stun läuft der Weiße exakt 90 Grad zur Laufrichtung des Objektballs. Das ist die wichtigste Linie im Positionsspiel.',
  },
  {
    slug: 'mitteltasche-gerade',
    level: 'A',
    name: 'Mitteltasche gerade',
    description: 'Gerader Ball in die Mitteltasche.',
    object: { x: 50, y: 20 },
    pocket: 'bm',
    cut: 0,
    dist: 24,
    zone: { x: 50, y: 24, r: 5 },
    skills: ['stun', 'position'],
    shotType: 'cut',
    difficulty: 3,
    speed: 4,
    coachNotes:
      'Die Mitteltasche verzeiht seitlich weniger als die Ecke. Zielpunkt exakt in die Mündungsmitte.',
  },

  // ------------------------------------------------------- ab 0.18.0 neu ---
  //
  // Die 19 Uebungen, die Stufe A auf 25 bringen. Die Reihenfolge folgt dem
  // Lernweg: erst nur lochen, dann den Weissen anhalten, dann ihn vor- und
  // zurueckholen, dann anschneiden, zuletzt die Lagen mit Hindernis.
  //
  // Zwei Zahlen stehen hier nicht so, wie das Konzept sie vorgeschlagen hat
  // (3.2: "Nachlauf 20 und 80 cm", "Rueckzieher 40 und 80 cm"). Nachgemessen
  // an den vorhandenen Uebungen: "Nachlauf mittel" schickt den Weissen 73 cm
  // weiter, "Rueckzieher kurz" holt ihn 77 cm zurueck. Die vorgeschlagenen
  // 80 cm waeren also beide Male fast dieselbe Uebung gewesen. Gewaehlt sind
  // darum Abstaende, die mit den vorhandenen eine Folge bilden:
  // 20 / 50 / 73 cm beim Nachlauf, 30 / 55 / 77 cm beim Rueckzieher.

  {
    slug: 'gerade-nah',
    level: 'A',
    since: 3,
    name: 'Gerader Ball nah',
    description: 'Der leichteste Ball am Tisch. Nur einlochen, der Weiße darf laufen.',
    object: { x: 85, y: 12 },
    pocket: 'br',
    cut: 0,
    dist: 12,
    // Ohne Zielzone: hier zaehlt nur, ob der Ball faellt. Wo der Weisse
    // liegen bleibt, ist der naechste Schritt.
    zone: null,
    skills: ['stun'],
    shotType: 'cut',
    difficulty: 1,
    speed: 4,
    coachNotes:
      'Der Grundschlag: Fuß, Brücke und Queue stehen auf einer Linie. Lieber dreimal probeschwingen als einmal zu schnell stoßen.',
  },
  {
    slug: 'gerade-mittel',
    level: 'A',
    since: 3,
    name: 'Gerader Ball mittel',
    description: 'Derselbe gerade Ball aus der doppelten Entfernung.',
    object: { x: 72, y: 34 },
    pocket: 'tr',
    cut: 0,
    dist: 30,
    zone: null,
    skills: ['stun'],
    shotType: 'cut',
    difficulty: 2,
    speed: 5,
    coachNotes:
      'Mit der Entfernung wächst jeder Fehler im Stoß mit. Die Queuespitze muss gerade durchlaufen und darf nicht zur Seite ausweichen.',
  },
  {
    slug: 'stop-nah',
    level: 'A',
    since: 3,
    name: 'Stop-Shot nah',
    description: 'Gerader Ball aus kurzer Entfernung. Der Weiße bleibt auf der Stelle.',
    object: { x: 80, y: 25 },
    pocket: 'br',
    cut: 0,
    dist: 9,
    // Die Zielzone steht dort, wo der Weisse im Moment des Treffens steht -
    // gerechnet, nicht gesetzt (cueAfter mit Abstand 0).
    cueAfter: { along: 'follow', dist: 0, r: 3.5 },
    skills: ['stun', 'position'],
    shotType: 'cut',
    difficulty: 2,
    speed: 4,
    coachNotes:
      'Auf kurze Entfernung genügt mittig und ohne Kraft. Je weiter der Weiße läuft, desto mehr Rückwärtsdrall braucht er zum Stehenbleiben.',
  },
  {
    slug: 'stop-mittel',
    level: 'A',
    since: 3,
    name: 'Stop-Shot mittel',
    description: 'Derselbe Stop-Shot, aber der Weiße hat einen weiten Anlauf.',
    object: { x: 70, y: 30 },
    pocket: 'tr',
    cut: 0,
    dist: 32,
    cueAfter: { along: 'follow', dist: 0, r: 4 },
    skills: ['stun', 'position'],
    shotType: 'cut',
    difficulty: 4,
    speed: 5,
    coachNotes:
      'Über die Entfernung nimmt der Weiße von selbst Rolldrall an. Etwas unter der Mitte treffen, damit er beim Kontakt genau ausgerollt ist.',
  },
  {
    slug: 'nachlauf-20',
    level: 'A',
    since: 3,
    name: 'Nachlauf 20 cm',
    description: 'Einlochen und den Weißen nur eine Handbreit weiterlaufen lassen.',
    object: { x: 72, y: 22 },
    pocket: 'br',
    cut: 0,
    dist: 16,
    // 20 cm = 7,87 Zoll auf der Stosslinie nach vorn.
    cueAfter: { along: 'follow', dist: 7.87, r: 4 },
    spin: { x: 0, y: 0.5 },
    skills: ['follow', 'position'],
    shotType: 'position',
    difficulty: 2,
    speed: 4,
    coachNotes:
      'Wenig ist hier schwerer als viel: oberhalb der Mitte treffen, aber sanft. Das Tempo entscheidet, nicht der Drall.',
  },
  {
    slug: 'nachlauf-50',
    level: 'A',
    since: 3,
    name: 'Nachlauf 50 cm',
    description: 'Einlochen und den Weißen einen halben Meter weiterschicken.',
    object: { x: 62, y: 20 },
    pocket: 'br',
    cut: 0,
    dist: 20,
    // 50 cm = 19,69 Zoll.
    cueAfter: { along: 'follow', dist: 19.69, r: 5 },
    spin: { x: 0, y: 0.6 },
    skills: ['follow', 'position'],
    shotType: 'position',
    difficulty: 3,
    speed: 5,
    coachNotes:
      'Dieselbe Stelle am Ball wie eben, nur mehr Tempo. Wer stattdessen höher ansetzt, verliert die Kontrolle über die Richtung.',
  },
  {
    slug: 'rueckzieher-30',
    level: 'A',
    since: 3,
    name: 'Rückzieher 30 cm',
    description: 'Der erste Rückzieher: der Weiße kommt eine Handbreit zurück.',
    object: { x: 74, y: 25 },
    pocket: 'br',
    cut: 0,
    dist: 14,
    // 30 cm = 11,81 Zoll zurueck auf der Anspiellinie.
    cueAfter: { along: 'draw', dist: 11.81, r: 4.5 },
    spin: { x: 0, y: -0.6 },
    skills: ['draw', 'position'],
    shotType: 'position',
    difficulty: 2,
    speed: 5,
    coachNotes:
      'Tief treffen und durchziehen, nicht stoppen. Ein kurzer, abgebremster Stoß gibt keinen Rückwärtsdrall, nur Kraft.',
  },
  {
    slug: 'rueckzieher-55',
    level: 'A',
    since: 3,
    name: 'Rückzieher 55 cm',
    description: 'Derselbe Rückzieher, der Weiße kommt gut einen halben Meter zurück.',
    object: { x: 72, y: 20 },
    pocket: 'br',
    cut: 0,
    dist: 18,
    // 55 cm = 21,65 Zoll.
    cueAfter: { along: 'draw', dist: 21.65, r: 6 },
    spin: { x: 0, y: -0.7 },
    skills: ['draw', 'position'],
    shotType: 'position',
    difficulty: 3,
    speed: 6,
    coachNotes:
      'Die Queuespitze bleibt waagerecht und geht durch den Ball hindurch. Der Weiße kommt auf derselben Linie zurück, auf der er hingelaufen ist.',
  },
  {
    slug: 'schnitt-10-rechts',
    level: 'A',
    since: 3,
    name: 'Schnittball 10 Grad nach rechts',
    description: 'Der kleinste Anschnitt. Fast gerade – und doch nicht gerade.',
    // Nach rechts heisst: aus dem Blick hinter dem Weissen laeuft der
    // Objektball nach rechts weg. Am Tisch ist das side = 1 - nachgemessen
    // am Kreuzprodukt von Anlauf- und Laufrichtung, nicht angenommen; ein
    // Test haelt es fest.
    object: { x: 74, y: 28 },
    pocket: 'br',
    cut: 10,
    dist: 22,
    side: 1,
    zone: null,
    skills: ['cut'],
    shotType: 'cut',
    difficulty: 2,
    speed: 5,
    coachNotes:
      'Den Geisterball vor dem Objektball sehen, nicht den Objektball selbst. Bei 10 Grad liegt er noch fast dahinter.',
  },
  {
    slug: 'schnitt-10-links',
    level: 'A',
    since: 3,
    name: 'Schnittball 10 Grad nach links',
    description: 'Derselbe kleine Anschnitt zur anderen Seite.',
    // Das Spiegelbild der Uebung davor: der Tisch an der Mittellinie
    // gespiegelt macht aus y 28 die 22 und aus der Ecke unten rechts die
    // oben rechts. Nur so bleibt der Weisse frei - mit derselben Tasche
    // laege er bei side = -1 in der oberen Langbande.
    object: { x: 74, y: 22 },
    pocket: 'tr',
    cut: 10,
    dist: 22,
    side: -1,
    zone: null,
    skills: ['cut'],
    shotType: 'cut',
    difficulty: 2,
    speed: 5,
    coachNotes:
      'Beide Seiten üben: fast jeder trifft eine Richtung besser als die andere, und das merkt man erst im Vergleich.',
  },
  {
    slug: 'schnitt-20-rechts',
    level: 'A',
    since: 3,
    name: 'Schnittball 20 Grad nach rechts',
    description: 'Ein Viertel Ball weniger. Der Objektball läuft deutlich zur Seite.',
    object: { x: 72, y: 26 },
    pocket: 'br',
    cut: 20,
    dist: 24,
    side: 1,
    zone: null,
    skills: ['cut'],
    shotType: 'cut',
    difficulty: 3,
    speed: 5,
    coachNotes:
      'Je dünner der Anschnitt, desto weiter wandert der Geisterball zur Seite. Vom Ziel aus denken, nicht vom Ball aus.',
  },
  {
    slug: 'schnitt-20-links',
    level: 'A',
    since: 3,
    name: 'Schnittball 20 Grad nach links',
    description: 'Derselbe Anschnitt zur anderen Seite.',
    object: { x: 72, y: 24 },
    pocket: 'tr',
    cut: 20,
    dist: 24,
    side: -1,
    zone: null,
    skills: ['cut'],
    shotType: 'cut',
    difficulty: 3,
    speed: 5,
    coachNotes:
      'Die Brücke wechselt mit der Seite. Wer die Hand stehen lässt und nur den Körper dreht, zieht den Stoß quer.',
  },
  {
    slug: 'schnitt-15-links',
    level: 'A',
    since: 3,
    name: 'Schnittball 15 Grad nach links',
    description:
      '„Schnittball 15 Grad“ an der Mittellinie gespiegelt: derselbe Winkel, andere Seite.',
    object: { x: 72, y: 20 },
    pocket: 'tr',
    cut: 15,
    dist: 26,
    side: -1,
    zone: null,
    skills: ['cut'],
    shotType: 'cut',
    difficulty: 3,
    speed: 5,
    coachNotes:
      'Gleicher Winkel, anderes Bild: dieselbe Übung von der anderen Seite fühlt sich fremd an, bis sie geübt ist.',
  },
  {
    slug: 'schnitt-30-links',
    level: 'A',
    since: 3,
    name: 'Schnittball 30 Grad nach links',
    description: '„Schnittball 30 Grad“ gespiegelt: der halbe Ball nach der anderen Seite.',
    object: { x: 70, y: 18 },
    pocket: 'br',
    cut: 30,
    dist: 28,
    side: -1,
    zone: null,
    skills: ['cut', 'stun'],
    shotType: 'cut',
    difficulty: 4,
    speed: 5,
    coachNotes:
      'Bei 30 Grad trifft der Weiße den Objektball auf halbem Ball. Diese Lage ist die wichtigste Peilung überhaupt – nach beiden Seiten.',
  },
  {
    slug: 'mitteltasche-weit',
    level: 'A',
    since: 3,
    name: 'Mitteltasche aus der Entfernung',
    description: 'Gerader Ball in die Mitteltasche, der Weiße steht weit weg.',
    object: { x: 50, y: 14 },
    pocket: 'bm',
    cut: 0,
    dist: 30,
    cueAfter: { along: 'follow', dist: 0, r: 4 },
    skills: ['stun', 'position'],
    shotType: 'cut',
    difficulty: 4,
    speed: 5,
    coachNotes:
      'Die Mündung der Mitteltasche ist nur zwei Bälle breit und steht quer zum Stoß. Über diese Entfernung verzeiht sie seitlich fast nichts.',
  },
  {
    slug: 'bande-gerade',
    level: 'A',
    since: 3,
    name: 'Ball an der Bande gerade',
    description:
      'Der Objektball liegt dicht an der Langbande und läuft an ihr entlang in die Ecke.',
    // Dicht, nicht fest: die Muendung der Ecktasche liegt gut einen Zoll von
    // der Bande weg, und darum zeigt die Anspiellinie eines bandennahen
    // Balles schraeg in die Bande hinein. Bei einem festliegenden Ball bliebe
    // fuer den Weissen auf dieser Linie kein Platz mehr - der Stoss waere
    // dann kein gerader.
    object: { x: 70, y: 47.5 },
    pocket: 'tr',
    cut: 0,
    dist: 24,
    zone: null,
    skills: ['rail', 'stun'],
    shotType: 'cut',
    difficulty: 4,
    speed: 5,
    coachNotes:
      'Bandenbälle wirken voller, als sie sind. Hier hilft die Bande: liegt das Queue parallel zu ihr, stimmt die Richtung meist schon.',
  },
  {
    slug: 'luecke-breit',
    level: 'A',
    since: 3,
    name: 'Durch die Lücke',
    description: 'Zwei Störbälle stehen im Weg. Der Weiße muss zwischen ihnen durch.',
    object: { x: 75, y: 25 },
    pocket: 'br',
    cut: 0,
    dist: 20,
    // Jeder Stoerball 3,2 Zoll von der Anspiellinie: zwischen ihren Kanten
    // bleiben 4,15 Zoll, nicht ganz zwei Ballbreiten.
    gate: { offset: 3.2, numbers: [4, 5] },
    zone: null,
    skills: ['stun'],
    shotType: 'cut',
    difficulty: 3,
    speed: 5,
    coachNotes:
      'Nicht auf die Lücke schauen, sondern auf den Geisterball. Wer das Hindernis anvisiert, spielt darauf zu.',
  },
  {
    slug: 'luecke-eng',
    level: 'A',
    since: 3,
    name: 'Durch die enge Lücke',
    description: 'Dieselbe Lage, aber die Störbälle stehen dichter zusammen.',
    object: { x: 75, y: 25 },
    pocket: 'br',
    cut: 0,
    dist: 24,
    // 2,7 Zoll je Seite: zwischen den Kanten bleiben 3,15 Zoll, knapp
    // anderthalb Ballbreiten.
    gate: { offset: 2.7, numbers: [4, 5] },
    zone: null,
    skills: ['stun'],
    shotType: 'cut',
    difficulty: 4,
    speed: 5,
    coachNotes:
      'Hier zeigt sich jeder krumme Stoß. Geht der Weiße am Hindernis an, lag es fast nie an der Lücke, sondern am Nachlauf der Hand.',
  },
  {
    slug: 'wachsende-linie',
    level: 'A',
    since: 3,
    name: 'Wachsende Linie',
    description:
      'Gerader Ball, der mit jedem Treffer länger wird: den Weißen nach jedem Erfolg einen Diamanten weiter zurücklegen.',
    // Die Uebung waechst, das Datenmodell nicht: ein Aufbau hat eine Lage,
    // keine Folge von Lagen (Konzept 12, "Progressive Uebungen"). Gespeichert
    // ist deshalb der kuerzeste Stand, und die Trainerhinweise sagen, wie es
    // weitergeht. Die Richtung ist flach gewaehlt, damit die Linie bis zu
    // vier Diamanten wachsen kann, ohne dass der Weisse in die Bande laeuft.
    object: { x: 70, y: 8 },
    pocket: 'br',
    cut: 0,
    dist: 12,
    zone: null,
    skills: ['stun'],
    shotType: 'cut',
    difficulty: 3,
    speed: 5,
    coachNotes:
      'Fällt der Ball, den Weißen einen Diamanten (etwa 32 cm) weiter nach hinten legen – immer auf derselben Linie. Fällt er nicht, einen Diamanten zurück. Vier Diamanten sind das Ziel.',
  },
]
