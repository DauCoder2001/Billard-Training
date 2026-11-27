/**
 * Stufe C - Spielsituationen, Banden-Systeme, Safes.
 *
 * Lagen, wie sie im Spiel vorkommen, samt der Frage, was man tut, wenn
 * nichts faellt (Konzept 3.4).
 */

import { ANDERE_SEITE } from './build'
import type { DrillSpec } from './build'

export const STUFE_C: DrillSpec[] = [
  {
    slug: 'rueckzieher-lang',
    level: 'C',
    name: 'Rückzieher lang',
    description: 'Rückzieher über große Distanz. Der Klassiker zum Verzweifeln.',
    object: { x: 73.3, y: 14 },
    pocket: 'br',
    cut: 0,
    dist: 50,
    // Bis 0.19.1 verlangte die Zone 35 Zoll Rueckweg. Gemessen schwankt
    // der Rueckweg nach 50 Zoll Anlauf zwischen 3 und 49 Zoll, die Streuung
    // betraegt 15 bis 16 Zoll gegen Radius 9 - die Stellungshaelfte war
    // nicht zu holen, sondern zu erwuerfeln. Zuverlaessig (Streuung unter
    // 5 Zoll) sind etwa 7 Zoll. Das ist keine Eigenheit der Simulation: Ueber
    // diese Strecke frisst das Tuch den Rueckwaertsdrall.
    cueAfter: { along: 'draw', dist: 7, r: 9 },
    spin: { x: 0, y: -0.8 },
    skills: ['draw'],
    shotType: 'position',
    difficulty: 8,
    speed: 2.25,
    coachNotes:
      'Sauberer, langer Stoß statt roher Kraft. Ein flacher Queue ist wichtiger als Tempo.',
  },
  {
    slug: 'schnitt-60',
    level: 'C',
    name: 'Dünner Schnitt 60 Grad',
    description: 'Dünner Ball entlang der Bande.',
    object: { x: 78, y: 42 },
    pocket: 'tr',
    cut: 60,
    dist: 32,
    zone: { x: 45, y: 40, r: 10 },
    // Bis 0.19.1 stand hier kein Effet, und die Zone wurde in 46 % der
    // gelochten Versuche getroffen. Gemessen ueber sechs Treffpunkte und
    // fuenfzehn Tempostufen (27.11.2026): Mit -0,5 bei 2,25 Laengen sind es
    // 75 bis 89 % (250 Versuche, drei Saaten). Der duenne Ball laeuft dem
    // Weissen sonst zu weit nach.
    spin: { x: 0, y: -0.5 },
    skills: ['thinCut', 'cut'],
    shotType: 'cut',
    difficulty: 7,
    speed: 2.25,
    coachNotes: 'Bei dünnen Bällen zählt der Zielpunkt, nicht die Kraft. Ruhig bleiben. ' +
      ANDERE_SEITE,
  },
  {
    slug: 'schnitt-75',
    level: 'C',
    name: 'Sehr dünner Schnitt 75 Grad',
    description: 'Der Objektball wird nur noch gestreift.',
    object: { x: 84, y: 44 },
    pocket: 'tr',
    cut: 75,
    dist: 34,
    zone: null,
    skills: ['thinCut'],
    shotType: 'cut',
    difficulty: 9,
    speed: 2.25,
    coachNotes: 'Nur das Einlochen zählt. Ein Hauch zu voll und der Ball bleibt an der Bande liegen. ' +
      ANDERE_SEITE,
  },
  {
    slug: 'bande-kurz',
    level: 'C',
    name: 'Bandenball über die Kurzbande',
    description: 'Kurzer Bandenball zurück in die Ecke der Kopfseite.',
    object: { x: 78, y: 30 },
    pocket: 'tl',
    cut: 0,
    dist: 20,
    bankRail: 'right',
    zone: null,
    skills: ['bank'],
    shotType: 'bank',
    difficulty: 7,
    speed: 2,
    coachNotes: 'Den Zielpunkt über das Spiegelbild der Tasche hinter der Bande suchen.',
  },
  {
    slug: 'kick-eine-bande',
    level: 'C',
    name: 'Kick über eine Bande',
    description: 'Der Weiße geht über die Bande an den Objektball.',
    object: { x: 78, y: 40 },
    pocket: 'tr',
    cut: 20,
    dist: 30,
    kickRail: 'bottom',
    zone: null,
    mode: 'pocket',
    skills: ['kick', 'bank'],
    shotType: 'kick',
    difficulty: 8,
    speed: 2.25,
    coachNotes:
      'Zählt schon als Treffer, wenn der Objektball sauber getroffen wird. Das Diamantensystem hilft beim Zielen.',
  },
  {
    slug: 'karambolage',
    level: 'C',
    name: 'Karambolage',
    description: 'Der Weiße springt vom ersten Ball ab und trifft den zweiten.',
    object: { x: 55, y: 30 },
    pocket: 'tr',
    cut: 40,
    dist: 24,
    carom: 22,
    zone: null,
    skills: ['carom'],
    shotType: 'carom',
    difficulty: 8,
    speed: 2.5,
    coachNotes: 'Die Abgangslinie des Weißen steht bei Stun senkrecht auf der Linie des Objektballs.',
  },
  {
    // Der Slug heisst weiter "links", damit gespeicherte Einheiten und
    // Favoriten an der Uebung haengen bleiben - die Id haengt am Slug.
    slug: 'seiteneffet-links',
    level: 'C',
    name: 'Seiteneffet über die Bande',
    description: 'Anschnitt mit Effet. Der Weiße läuft über die Bande in die Zone.',
    object: { x: 68, y: 20 },
    pocket: 'br',
    cut: 25,
    dist: 28,
    spin: { x: -0.7, y: 0 },
    // Mit 0.18.3 blieb offen, welche der beiden gespiegelten Zonen stimmt.
    // Die Antwort: keine. Gemessen kommt der Weisse mit diesem Effet und
    // diesem Tempo auf (18,1/42,0) zur Ruhe, Streuung 8,9 Zoll - die alte
    // Zone auf (25/12) wurde in 660 Versuchen nie erreicht. Unterhalb von
    // 2,1 m/s kommt er gar nicht ueber die Bande, darueber streut er
    // doppelt so weit (Nachrechnung vom 27.11.2026).
    zone: { x: 18.1, y: 42, r: 9 },
    skills: ['sidespin', 'position'],
    shotType: 'position',
    difficulty: 7,
    speed: 3.25,
    coachNotes:
      'Effet verzieht den Weißen beim Abstoß. Die Ablenkung gehört einkalkuliert, nicht wegdiskutiert. ' +
      'Erst das Tempo, dann das Effet. ' +
      'Mögliche Variante: dieselbe Lage mit dem Effet auf der anderen Seite – ' +
      'der Weiße kommt an der Bande anders heraus und läuft kürzer. ' +
      ANDERE_SEITE,
  },
  {
    slug: 'position-eng',
    level: 'C',
    name: 'Enge Position',
    description: 'Einlochen und den Weißen auf einer kleinen Fläche stoppen.',
    object: { x: 60, y: 20 },
    pocket: 'br',
    cut: 25,
    dist: 24,
    // Bis 0.19.1 auf (55/34) - mit keinem Effet und keinem Tempo zu
    // erreichen. Gemessen bleibt der Weisse zuverlaessig auf (88,6/31,3)
    // liegen, Streuung 4,7 Zoll; bei Radius 4 ist das eine enge Position,
    // die wirklich eine ist.
    zone: { x: 88.6, y: 31.3, r: 4 },
    skills: ['position', 'stun'],
    shotType: 'position',
    difficulty: 7,
    speed: 2,
    coachNotes: 'Kleine Zone heißt: leiser stoßen. Die meisten Fehler kommen aus zu viel Tempo.',
  },
  {
    slug: 'cluster-oeffnen',
    level: 'C',
    name: 'Cluster öffnen',
    description: 'Ball einlochen und dabei zwei zusammenliegende Bälle trennen.',
    object: { x: 58, y: 18 },
    pocket: 'br',
    cut: 20,
    dist: 24,
    // Bis 0.19.1 lag der Cluster auf (44/36) und (46,3/36) - neben dem Weg
    // des Weissen. In 540 gerechneten Versuchen ueber neun Tempostufen hat
    // er ihn kein einziges Mal beruehrt: Die Aufgabe war nicht zu erfuellen.
    // Jetzt liegen die beiden dort, wo der Weisse nach dem Treffen
    // nachweislich entlanglaeuft.
    //
    // Das Tempo steht hier nicht auf dem Wert, den die Nachrechnung nennt:
    // Sie zaehlt nur gelochte Baelle, und das ist bei dieser Uebung die
    // halbe Aufgabe. Eigens gemessen (150 Versuche je Stufe, 27.11.2026),
    // Anteil der Versuche, in denen die beiden Baelle danach mehr als zwei
    // Ballbreiten auseinanderliegen:
    //
    //   bis 2,00 Laengen    0 bis 1 %
    //   2,25 Laengen       65 %
    //   2,50 Laengen       95 %
    //   ab 2,75 Laengen    97 bis 100 %
    //
    // Unter 2,25 geht der Cluster also gar nicht auf, so sicher der Ball
    // auch faellt. 2,50 ist die sanfteste Stufe, bei der beides zusammen
    // gelingt (29 % gegen 33 % im Besten, bei 3,75).
    extras: [
      { number: 6, x: 62, y: 31 },
      { number: 7, x: 64.3, y: 31 },
    ],
    // Keine Zielzone mehr: Nach dem Aufbrechen des Clusters streut die
    // Ruhelage des Weissen um 23 bis 27 Zoll, bei jedem Effet und jedem
    // Tempo (Nachrechnung vom 27.11.2026). Eine Stellung, die niemand
    // steuern kann, darf die App auch nicht bewerten. Die Aufgabe bleibt:
    // lochen und den Cluster oeffnen.
    zone: null,
    skills: ['breakout', 'position'],
    shotType: 'position',
    difficulty: 8,
    speed: 2.5,
    coachNotes: 'Zuerst den Ball sicher lochen, dann den Cluster. Nie umgekehrt.',
  },
  {
    slug: 'safe-hinter-ball',
    level: 'C',
    name: 'Safe hinter den Ball',
    description: 'Kein Einlochen: den Weißen sicher hinter einem fremden Ball ablegen.',
    object: { x: 60, y: 25 },
    pocket: 'br',
    cut: 55,
    dist: 26,
    // Bis 0.19.1 stand der Sperrball auf (30/30) und die Zone auf (24/30) -
    // links vom Objektball. Nach einem Schnitt von 55 Grad nach rechts kommt
    // der Weisse dort nie an: in 660 gerechneten Versuchen ueber elf
    // Tempostufen kein einziger Treffer in der Zone. Gemessen bleibt er bei
    // 0,4 m/s auf (71,1/39,9) liegen, Streuung 3,0 Zoll, waehrend der
    // Objektball auf (64,3/22,6) zur Ruhe kommt. Der Sperrball steht jetzt
    // zwischen beiden, 0,4 Zoll neben der Sichtlinie: Der Weisse liegt
    // wirklich verdeckt. Gerechnet wird er dabei in 7 von 100 Versuchen
    // beruehrt, und 90 von 100 enden in der Zone.
    extras: [{ number: 8, x: 67.7, y: 31.3 }],
    zone: { x: 71.1, y: 39.9, r: 6 },
    mode: 'position',
    skills: ['safety', 'position'],
    shotType: 'safety',
    // Bis 0.19.2 stand hier 8. Gemessen ist der Safe mit 79 % Guete die am
    // leichtesten aufgehende Uebung der Stufe C - dreimal die der naechsten
    // (Cluster oeffnen, 27 %). Mit der 8 hob gerade sie das Rating am
    // staerksten (skills.ts: Faktor 0,5 + 0,05 mal Schwierigkeit) und galt
    // dem Coach als Uebung fuer ein Niveau von 80 (coach.ts). Dass ein Safe
    // Urteil verlangt, traegt die Stufe C - nicht die Schwierigkeit
    // (Konzept 3.1: das Thema bestimmt die Stufe).
    difficulty: 6,
    speed: 0.5,
    coachNotes:
      'Bewertet wird nur die Lage des Weißen. Der Objektball soll leben bleiben, nicht fallen.',
  },
  {
    slug: 'lange-gerade',
    level: 'C',
    name: 'Lange Gerade',
    description: 'Über die lange Diagonale in die Ecke.',
    object: { x: 78.7, y: 11.3 },
    pocket: 'br',
    cut: 0,
    dist: 70,
    zone: { x: 76.6, y: 12.3, r: 6 },
    // Die Zone ist der Geisterball: stehenbleiben nach 70 Zoll Anlauf. Ohne
    // Rueckwaertsdrall unmoeglich - gemessen 17,7 Zoll daneben, mit -0,20
    // noch 5,4 und damit innerhalb des Radius.
    spin: { x: 0, y: -0.2 },
    skills: ['stun', 'position'],
    shotType: 'cut',
    difficulty: 7,
    speed: 1,
    coachNotes:
      'Der Prüfstein für den Stoß. Wer hier daneben liegt, trifft nicht die Tasche, sondern hat eine krumme Stoßbewegung.',
  },
]
