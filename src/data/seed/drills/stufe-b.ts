/**
 * Stufe B - Kontrolle des Weissen und Winkel.
 *
 * Der Ball fallen zu lassen genuegt nicht mehr: hier zaehlt, wo der Weisse
 * danach liegen bleibt (Konzept 3.3).
 *
 * Die Schwierigkeiten ordnen die sieben Uebungen im Band 4 bis 6 nach der
 * gemessenen Guete (je 250 Versuche, scripts/pooltool/bericht.md vom
 * 27.11.2026). Bis 0.19.2 trugen alle sieben die 6, obwohl die Guete von
 * 65 % bis 8 % reicht - Faktor acht. Der Coach schlug sie damit gleich
 * bereitwillig vor (coach.ts), und jede hob das Rating gleich stark
 * (skills.ts). Jetzt: Mitteltasche im Schnitt 65 % und Ball an der Bande
 * 47 % auf 4, Position in die Kitchen 24 %, Stop-Shot lang 21 % und
 * Bandenball Langbande 19 % auf 5, Schnittball 45 Grad und Kombination je
 * 8 % auf 6.
 *
 * Die 4 der Mitteltasche im Schnitt steht an der Grenze zur Stufe A. Das
 * ist gewollt: die Baender ueberlappen (Konzept 3.1). Dass der Weisse dort
 * in 26 von 100 Versuchen faellt, ist in den 65 % schon abgezogen.
 */

import { ANDERE_SEITE } from './build'
import type { DrillSpec } from './build'

export const STUFE_B: DrillSpec[] = [
  {
    slug: 'stop-lang',
    level: 'B',
    name: 'Stop-Shot lang',
    description: 'Derselbe gerade Ball, aber über die lange Diagonale.',
    // Auf der Diagonalen zur Ecke unten rechts: nur dort ist hinter dem
    // Geisterball noch Platz fuer einen langen geraden Stoss.
    object: { x: 76, y: 12.6 },
    pocket: 'br',
    cut: 0,
    dist: 55,
    zone: { x: 74, y: 13.6, r: 5 },
    // Die Zone ist der Geisterball: Der Weisse soll stehenbleiben. Der
    // Hinweis verlangte den Rueckwaertsdrall laengst, die Uebung schrieb
    // bis 0.19.1 mittig vor - gemessen 9,3 Zoll daneben. Mit -0,35 sind es
    // 3,2 (Nachrechnung vom 27.11.2026).
    spin: { x: 0, y: -0.35 },
    skills: ['stun', 'position'],
    shotType: 'cut',
    difficulty: 5,
    speed: 3,
    coachNotes:
      'Über die Distanz braucht der Weiße etwas Rückwärtsdrall, damit der Rolldrall bis zum Treffer aufgebraucht ist.',
  },
  {
    slug: 'schnitt-45',
    level: 'B',
    name: 'Schnittball 45 Grad',
    description: 'Deutlicher Anschnitt, der Objektball verliert Tempo.',
    object: { x: 68, y: 34 },
    pocket: 'tr',
    cut: 45,
    dist: 30,
    // Die Zone bleibt, wo sie war, und das ist belegt: Verschoben auf die
    // gemessene mittlere Ruhelage (34,8 / 30,9) wird sie in 39 bis 48 %
    // der gelochten Versuche getroffen, auf (40 / 30) in 49 % - kein
    // Unterschied. Auch kein Effet und kein Tempo bringen sie naeher: Auf
    // einem Faecher aus sechs Treffpunkten und fuenfzehn Tempostufen
    // erreicht nur ein einziges Feld ueberhaupt die Zone (2,25 Laengen,
    // mittiger bis leicht tiefer Treffpunkt).
    //
    // Das Problem dieser Uebung ist ein anderes und mit einer Zielzone
    // nicht zu beheben: Der Weisse faellt in 30 von 100 Versuchen selbst.
    // Mehr als die Haelfte der Zonenquote geht allein darauf. Das ist eine
    // Frage an den Aufbau, nicht an die Zone - offen (Nachrechnung vom
    // 27.11.2026).
    zone: { x: 40, y: 30, r: 9 },
    skills: ['cut'],
    shotType: 'cut',
    difficulty: 6,
    speed: 2.25,
    coachNotes: 'Mehr Tempo einplanen: der Objektball nimmt bei 45 Grad nur noch die Hälfte mit. ' +
      ANDERE_SEITE,
  },
  {
    slug: 'mitteltasche-schnitt',
    level: 'B',
    name: 'Mitteltasche im Schnitt',
    description: 'Anschnitt in die Mitteltasche. Die Backen sind gnadenlos.',
    object: { x: 55, y: 16 },
    pocket: 'bm',
    cut: 35,
    dist: 26,
    // Keine Zielzone: Diese Uebung ist nicht zu stellen. Gemessen ueber
    // sechs Treffpunkte und fuenfzehn Tempostufen, je 100 Versuche
    // (27.11.2026): Der Ball faellt in 83 % der Versuche, bei jedem
    // Treffpunkt und jedem Tempo - aber die Ruhelage des Weissen streut um
    // 16 Zoll, und die beste Zonenquote auf dem ganzen Faecher sind 27 %
    // (mittiger Treffpunkt, 2,75 Laengen). Die alte Zone (30 / 20) mit
    // Radius 9 lag nur 5,5 Zoll von der mittleren Ruhelage entfernt und
    // wurde trotzdem in 16 % getroffen: Es ist die Streuung, nicht die
    // Lage. Eine Stellung, die niemand steuern kann, darf die App nicht
    // bewerten.
    //
    // Bis 0.19.1 stand hier dazu "mit Rueckwaertsdrall bremst er auf der
    // Tangente und bleibt in ihr". Das war falsch: Mit -0,5 sind es 11 %
    // Zonenquote, mit mittigem Treffpunkt 27 %.
    zone: null,
    skills: ['cut', 'position'],
    shotType: 'cut',
    difficulty: 4,
    speed: 2.75,
    coachNotes: 'Bei Schnittbällen in die Mitte wird die wirksame Taschenöffnung schnell schmal.',
  },
  {
    slug: 'bande-lang',
    level: 'B',
    name: 'Bandenball über die Langbande',
    description: 'Der Objektball geht über die obere Bande in die Ecke.',
    object: { x: 60, y: 36 },
    pocket: 'br',
    cut: 0,
    dist: 24,
    bankRail: 'top',
    zone: null,
    skills: ['bank'],
    shotType: 'bank',
    difficulty: 5,
    speed: 2.25,
    coachNotes:
      'Ohne Effet und mit mittlerem Tempo spiegelt die Bande sauber. Mehr Kraft lässt den Ball kürzer herauskommen.',
  },
  {
    slug: 'kombination-zwei',
    level: 'B',
    name: 'Kombination aus zwei Bällen',
    description: 'Der erste Ball schiebt den zweiten in die Ecke.',
    object: { x: 52, y: 30 },
    pocket: 'br',
    cut: 0,
    dist: 22,
    combo: { x: 72, y: 18 },
    zone: null,
    skills: ['combination'],
    shotType: 'combination',
    difficulty: 6,
    speed: 3,
    coachNotes:
      'Fehler verdoppeln sich bei jeder Berührung. Zuerst die Linie des zweiten Balls festlegen, dann rückwärts denken.',
  },
  {
    slug: 'bandenball-fest',
    level: 'B',
    name: 'Ball an der Bande',
    description: 'Der Objektball liegt dicht an der Langbande und muss im Schnitt entlang laufen.',
    // Bis 0.19.1 lag er auf 48,9 - weiter an der Bande, als eine Ballmitte
    // ueberhaupt kommt (48,875). Dort war die Uebung nicht spielbar: Die
    // Anspiellinie zur Ecke oben rechts faellt leicht ab, also haette der
    // Weisse im Augenblick des Treffens 0,05 Zoll ausserhalb der
    // Spielflaeche stehen muessen. Gerechnet fiel er in 100 von 100
    // Versuchen (Nachrechnung vom 26.11.2026). Jetzt steht der Ball 2,5
    // Zoll von der Bande, wie sein gerades Gegenstueck in Stufe A.
    object: { x: 60, y: 47.5 },
    pocket: 'tr',
    cut: 8,
    dist: 26,
    zone: { x: 78, y: 40, r: 8 },
    skills: ['rail', 'cut'],
    shotType: 'cut',
    difficulty: 4,
    speed: 1.75,
    coachNotes:
      'Bandenbälle wirken voller, als sie sind. Lieber einen Hauch dünner anvisieren und ohne Effet spielen.',
  },
  {
    slug: 'position-kitchen',
    level: 'B',
    name: 'Position in die Kitchen',
    description: 'Einlochen und den Weißen kontrolliert hinter die Kopflinie bringen.',
    object: { x: 72, y: 30 },
    pocket: 'tr',
    cut: 20,
    dist: 30,
    spin: { x: 0, y: -0.5 },
    zone: { x: 15, y: 25, r: 10 },
    mode: 'pocket+position',
    skills: ['draw', 'position'],
    shotType: 'position',
    difficulty: 5,
    // Die Zone haengt hier scharf am Tempo, und das macht die Zahl
    // empfindlich: 3,00 Laengen bringen 42 bis 47 % Zonentreffer, 3,25
    // bringen 81 bis 83 %, 3,50 wieder 46 bis 49 % (je 250 Versuche, drei
    // Saaten, 27.11.2026). Ein Lauf mit nur 150 Versuchen je Stufe hatte
    // deshalb 3,00 vorgeschlagen - bei so steilen Flanken reicht das nicht.
    speed: 3.25,
    coachNotes: 'Große Zone, aber große Distanz. Tempo üben, nicht Effet.',
  },
]
