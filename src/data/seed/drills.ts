/** Mitgelieferte Standarduebungen.
 *
 *  Die Ballpositionen werden aus der Geometrie berechnet statt von Hand
 *  gesetzt: aus Objektball, Zieltasche und gewuenschtem Schnittwinkel folgt
 *  die Lage des Weissen. So stimmen die Winkel exakt und lassen sich beim
 *  Anpassen einer Uebung nachvollziehen.
 */

import {
  POCKET_BY_ID,
  TABLE,
  castToRail,
  clampBall,
  ghostBall,
  pocketAimPoint,
} from '@/domain/geometry'
import { createShot } from '@/domain/shot'
import { DEFAULT_THRESHOLDS } from '@/domain/types'
import type {
  Ball,
  BallPath,
  Point,
  PocketId,
  Shot,
  ShotType,
  SkillTag,
} from '@/domain/types'

type RailSide = 'top' | 'bottom' | 'left' | 'right'

function rotate(d: Point, deg: number): Point {
  const r = (deg * Math.PI) / 180
  return { x: d.x * Math.cos(r) - d.y * Math.sin(r), y: d.x * Math.sin(r) + d.y * Math.cos(r) }
}

function norm(d: Point): Point {
  const len = Math.hypot(d.x, d.y) || 1
  return { x: d.x / len, y: d.y / len }
}

/** Spiegelt einen Punkt an einer Bande, fuer die Berechnung von Bandenwegen. */
function mirrorAcross(p: Point, rail: RailSide): Point {
  switch (rail) {
    case 'top':
      return { x: p.x, y: 2 * TABLE.width - p.y }
    case 'bottom':
      return { x: p.x, y: -p.y }
    case 'left':
      return { x: -p.x, y: p.y }
    case 'right':
      return { x: 2 * TABLE.length - p.x, y: p.y }
  }
}

/**
 * Lage des Weissen aus Objektball, Zielpunkt, Schnittwinkel und Abstand.
 * side = 1 legt den Weissen auf die eine, -1 auf die andere Seite der Linie.
 */
function cuePosition(
  object: Point,
  aim: Point,
  cutDeg: number,
  dist: number,
  side: 1 | -1,
): Point {
  const ghost = ghostBall(object, aim)
  const travel = norm({ x: object.x - ghost.x, y: object.y - ghost.y })
  const approach = rotate(travel, side * cutDeg)
  return clampBall({ x: ghost.x - approach.x * dist, y: ghost.y - approach.y * dist })
}

interface DrillSpec {
  slug: string
  name: string
  description: string
  /** Objektball. */
  object: Point
  pocket: PocketId
  /** Schnittwinkel in Grad. */
  cut: number
  /** Abstand des Weissen vom Geisterball in Zoll. */
  dist: number
  side?: 1 | -1
  /** Bande, ueber die der Objektball laeuft (Bandenball). */
  bankRail?: RailSide
  /** Bande, ueber die der Weisse zum Objektball laeuft (Kick). */
  kickRail?: RailSide
  /**
   * Kombination: Lage des zweiten Objektballs. Der erste Ball zielt dann
   * nicht auf die Tasche, sondern auf den Kontaktpunkt am zweiten Ball.
   */
  combo?: Point
  /**
   * Karambolage: Abstand des zweiten Balls auf der Abgangslinie des Weissen.
   * Der Ball wird daraus berechnet, damit der Stoss wirklich aufgeht.
   */
  carom?: number
  /** Weitere Baelle, etwa als Stoerball oder Cluster. */
  extras?: { number: number; x: number; y: number; kind?: 'object' | 'obstacle' }[]
  /** Zielzone fuer den Weissen. */
  zone?: { x: number; y: number; r: number } | null
  mode?: 'pocket' | 'position' | 'pocket+position'
  skills: SkillTag[]
  shotType: ShotType
  difficulty: number
  speed: number
  spin?: Point
  coachNotes: string
}

function buildDrill(spec: DrillSpec): Shot {
  const pocket = POCKET_BY_ID[spec.pocket]
  const pocketAim = pocketAimPoint(pocket, 0)
  const side = spec.side ?? 1

  const object = clampBall(spec.object)

  // Bei einem Bandenball zielt der Objektball nicht auf die Tasche, sondern
  // auf deren Spiegelbild hinter der Bande. Bei einer Kombination zielt er
  // auf den Kontaktpunkt am zweiten Ball.
  const second = spec.combo ? clampBall(spec.combo) : null
  const objectAim = second
    ? ghostBall(second, pocketAim)
    : spec.bankRail
      ? mirrorAcross(pocketAim, spec.bankRail)
      : pocketAim

  const directCue = cuePosition(object, objectAim, spec.cut, spec.dist, side)

  const balls: Ball[] = []
  const paths: BallPath[] = []

  const cueId = 'cue'
  const objectId = 'obj'

  // Beim Kick laeuft der Weisse zuerst gegen eine Bande. Er wird dorthin
  // gelegt, wo er ueber das Spiegelbild des Objektballs anspielt.
  let cue = directCue
  if (spec.kickRail) {
    cue = clampBall({ x: TABLE.length - directCue.x, y: directCue.y })
    const mirroredObject = mirrorAcross(object, spec.kickRail)
    const hit = castToRail(cue, { x: mirroredObject.x - cue.x, y: mirroredObject.y - cue.y })
    if (hit) {
      paths.push({
        id: 'path-cue',
        ballId: cueId,
        role: 'cue',
        segments: [
          { to: hit.point, rail: true },
          { to: object },
        ],
      })
    }
  }

  balls.push({ id: cueId, kind: 'cue', x: cue.x, y: cue.y })
  balls.push({ id: objectId, kind: 'object', number: 1, x: object.x, y: object.y, order: 1 })

  if (second) {
    balls.push({ id: 'obj2', kind: 'object', number: 2, x: second.x, y: second.y, order: 2 })
    paths.push({
      id: 'path-object2',
      ballId: 'obj2',
      role: 'secondary',
      segments: [{ to: pocketAim }],
    })
  }

  if (spec.carom !== undefined) {
    // Bei Stun laeuft der Weisse nach dem Treffer auf der Tangente weiter.
    // Der zweite Ball wird genau dorthin gelegt.
    const ghost = ghostBall(object, objectAim)
    const travel = norm({ x: objectAim.x - object.x, y: objectAim.y - object.y })
    const approach = norm({ x: ghost.x - cue.x, y: ghost.y - cue.y })
    const along = approach.x * travel.x + approach.y * travel.y
    const tangent = norm({
      x: approach.x - travel.x * along,
      y: approach.y - travel.y * along,
    })
    const target = clampBall({
      x: ghost.x + tangent.x * spec.carom,
      y: ghost.y + tangent.y * spec.carom,
    })
    balls.push({ id: 'carom', kind: 'obstacle', number: 3, x: target.x, y: target.y })
    paths.push({
      id: 'path-cue',
      ballId: cueId,
      role: 'cue',
      segments: [{ to: ghost }, { to: target }],
    })
  }

  for (const [i, extra] of (spec.extras ?? []).entries()) {
    const pos = clampBall({ x: extra.x, y: extra.y })
    balls.push({
      id: `extra-${i}`,
      kind: extra.kind ?? 'obstacle',
      number: extra.number,
      x: pos.x,
      y: pos.y,
      order: extra.kind === 'object' ? i + 2 : undefined,
    })
  }

  // Weg des Objektballs: bei einem Bandenball ueber den Auftreffpunkt, bei
  // einer Kombination nur bis zum zweiten Ball.
  const objectSegments = []
  if (spec.bankRail) {
    const hit = castToRail(object, { x: objectAim.x - object.x, y: objectAim.y - object.y })
    if (hit) objectSegments.push({ to: hit.point, rail: true })
  }
  objectSegments.push({ to: second ? objectAim : pocketAim })
  paths.push({ id: 'path-object', ballId: objectId, role: 'object', segments: objectSegments })

  const base = createShot()
  return {
    ...base,
    id: `builtin-${spec.slug}`,
    name: spec.name,
    description: spec.description,
    balls,
    paths,
    target: { pocketId: spec.pocket, cheat: 0 },
    attributes: {
      shotType: spec.shotType,
      cutAngle: spec.cut,
      spin: spec.spin ?? { x: 0, y: 0 },
      speed: spec.speed,
      difficulty: spec.difficulty,
      elevation: 0,
      skills: spec.skills,
    },
    scoring: {
      mode: spec.zone === null ? 'pocket' : (spec.mode ?? 'pocket+position'),
      targetZone: spec.zone ?? null,
      thresholds: { ...DEFAULT_THRESHOLDS },
      scratchRisk: spec.skills.includes('thinCut') || spec.shotType === 'break',
    },
    coachNotes: spec.coachNotes,
    tags: ['Grunduebung'],
    favorite: false,
    builtIn: true,
    createdAt: 0,
    updatedAt: 0,
  }
}

const SPECS: DrillSpec[] = [
  {
    slug: 'stop-kurz',
    name: 'Stop-Shot kurz',
    description: 'Gerader Ball aus kurzer Distanz. Der Weisse bleibt stehen.',
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
      'Mittig treffen, mit gleichmaessigem Tempo durchstossen. Der Weisse darf weder vor noch zurueck.',
  },
  {
    slug: 'stop-lang',
    name: 'Stop-Shot lang',
    description: 'Derselbe Ball ueber die halbe Tischlaenge.',
    object: { x: 80, y: 25 },
    pocket: 'br',
    cut: 0,
    dist: 55,
    zone: { x: 77.7, y: 25, r: 5 },
    skills: ['stun', 'position'],
    shotType: 'cut',
    difficulty: 6,
    speed: 6,
    coachNotes:
      'Ueber die Distanz braucht der Weisse etwas Rueckwaertsdrall, damit der Rolldrall bis zum Treffer aufgebraucht ist.',
  },
  {
    slug: 'nachlauf-mittel',
    name: 'Nachlauf mittel',
    description: 'Gerader Ball, der Weisse laeuft anschliessend weiter nach vorn.',
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
    coachNotes: 'Oberhalb der Mitte treffen. Das Tempo bestimmt, wie weit der Weisse laeuft.',
  },
  {
    slug: 'rueckzieher-kurz',
    name: 'Rueckzieher kurz',
    description: 'Gerader Ball, der Weisse kommt zurueck zur Kopfseite.',
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
    coachNotes: 'Tief treffen und den Stoss durchziehen. Die Queuespitze bleibt waagerecht.',
  },
  {
    slug: 'rueckzieher-lang',
    name: 'Rueckzieher lang',
    description: 'Rueckzieher ueber grosse Distanz. Der Klassiker zum Verzweifeln.',
    object: { x: 82, y: 25 },
    pocket: 'br',
    cut: 0,
    dist: 50,
    zone: { x: 45, y: 25, r: 9 },
    spin: { x: 0, y: -0.8 },
    skills: ['draw'],
    shotType: 'position',
    difficulty: 8,
    speed: 8,
    coachNotes:
      'Sauberer, langer Stoss statt roher Kraft. Ein flacher Queue ist wichtiger als Tempo.',
  },
  {
    slug: 'schnitt-15',
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
    name: 'Schnittball 30 Grad',
    description: 'Halber Ball. Der Weisse laeuft im rechten Winkel weiter.',
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
      'Bei Stun laeuft der Weisse exakt 90 Grad zur Laufrichtung des Objektballs. Das ist die wichtigste Linie im Positionsspiel.',
  },
  {
    slug: 'schnitt-45',
    name: 'Schnittball 45 Grad',
    description: 'Deutlicher Anschnitt, der Objektball verliert Tempo.',
    object: { x: 68, y: 34 },
    pocket: 'tr',
    cut: 45,
    dist: 30,
    zone: { x: 40, y: 30, r: 9 },
    skills: ['cut'],
    shotType: 'cut',
    difficulty: 6,
    speed: 6,
    coachNotes: 'Mehr Tempo einplanen: der Objektball nimmt bei 45 Grad nur noch die Haelfte mit.',
  },
  {
    slug: 'schnitt-60',
    name: 'Duenner Schnitt 60 Grad',
    description: 'Duenner Ball entlang der Bande.',
    object: { x: 78, y: 42 },
    pocket: 'tr',
    cut: 60,
    dist: 32,
    zone: { x: 45, y: 40, r: 10 },
    skills: ['thinCut', 'cut'],
    shotType: 'cut',
    difficulty: 7,
    speed: 6,
    coachNotes: 'Bei duennen Baellen zaehlt der Zielpunkt, nicht die Kraft. Ruhig bleiben.',
  },
  {
    slug: 'schnitt-75',
    name: 'Sehr duenner Schnitt 75 Grad',
    description: 'Der Objektball wird nur noch gestreift.',
    object: { x: 84, y: 44 },
    pocket: 'tr',
    cut: 75,
    dist: 34,
    zone: null,
    skills: ['thinCut'],
    shotType: 'cut',
    difficulty: 9,
    speed: 7,
    coachNotes: 'Nur das Einlochen zaehlt. Ein Hauch zu voll und der Ball bleibt an der Bande liegen.',
  },
  {
    slug: 'mitteltasche-gerade',
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
      'Die Mitteltasche verzeiht seitlich weniger als die Ecke. Zielpunkt exakt in die Muendungsmitte.',
  },
  {
    slug: 'mitteltasche-schnitt',
    name: 'Mitteltasche im Schnitt',
    description: 'Anschnitt in die Mitteltasche. Die Backen sind gnadenlos.',
    object: { x: 55, y: 16 },
    pocket: 'bm',
    cut: 35,
    dist: 26,
    zone: { x: 30, y: 20, r: 9 },
    skills: ['cut', 'position'],
    shotType: 'cut',
    difficulty: 6,
    speed: 5,
    coachNotes: 'Bei Schnittbaellen in die Mitte wird die wirksame Taschenoeffnung schnell schmal.',
  },
  {
    slug: 'bande-lang',
    name: 'Bandenball ueber die Langbande',
    description: 'Der Objektball geht ueber die obere Bande in die Ecke.',
    object: { x: 60, y: 36 },
    pocket: 'br',
    cut: 0,
    dist: 24,
    bankRail: 'top',
    zone: null,
    skills: ['bank'],
    shotType: 'bank',
    difficulty: 6,
    speed: 6,
    coachNotes:
      'Ohne Effet und mit mittlerem Tempo spiegelt die Bande sauber. Mehr Kraft laesst den Ball kuerzer herauskommen.',
  },
  {
    slug: 'bande-kurz',
    name: 'Bandenball ueber die Kurzbande',
    description: 'Kurzer Bandenball zurueck in die Ecke der Kopfseite.',
    object: { x: 78, y: 30 },
    pocket: 'tl',
    cut: 0,
    dist: 20,
    bankRail: 'right',
    zone: null,
    skills: ['bank'],
    shotType: 'bank',
    difficulty: 7,
    speed: 6,
    coachNotes: 'Den Zielpunkt ueber das Spiegelbild der Tasche hinter der Bande suchen.',
  },
  {
    slug: 'kick-eine-bande',
    name: 'Kick ueber eine Bande',
    description: 'Der Weisse geht ueber die Bande an den Objektball.',
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
    speed: 6,
    coachNotes:
      'Zaehlt schon als Treffer, wenn der Objektball sauber getroffen wird. Das Diamantensystem hilft beim Zielen.',
  },
  {
    slug: 'kombination-zwei',
    name: 'Kombination aus zwei Baellen',
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
    speed: 5,
    coachNotes:
      'Fehler verdoppeln sich bei jeder Beruehrung. Zuerst die Linie des zweiten Balls festlegen, dann rueckwaerts denken.',
  },
  {
    slug: 'karambolage',
    name: 'Karambolage',
    description: 'Der Weisse springt vom ersten Ball ab und trifft den zweiten.',
    object: { x: 55, y: 30 },
    pocket: 'tr',
    cut: 40,
    dist: 24,
    carom: 22,
    zone: null,
    skills: ['carom'],
    shotType: 'carom',
    difficulty: 8,
    speed: 5,
    coachNotes: 'Die Abgangslinie des Weissen steht bei Stun senkrecht auf der Linie des Objektballs.',
  },
  {
    slug: 'bandenball-fest',
    name: 'Ball an der Bande',
    description: 'Der Objektball liegt an der Langbande und muss entlang laufen.',
    object: { x: 60, y: 48.9 },
    pocket: 'tr',
    cut: 8,
    dist: 26,
    zone: { x: 78, y: 40, r: 8 },
    skills: ['rail', 'cut'],
    shotType: 'cut',
    difficulty: 6,
    speed: 5,
    coachNotes:
      'Bandenbaelle wirken voller, als sie sind. Lieber einen Hauch duenner anvisieren und ohne Effet spielen.',
  },
  {
    slug: 'seiteneffet-links',
    name: 'Seiteneffet links',
    description: 'Anschnitt mit linkem Effet, um den Weissen zu verlaengern.',
    object: { x: 68, y: 20 },
    pocket: 'br',
    cut: 25,
    dist: 28,
    spin: { x: -0.7, y: 0 },
    zone: { x: 25, y: 12, r: 9 },
    skills: ['sidespin', 'position'],
    shotType: 'position',
    difficulty: 7,
    speed: 6,
    coachNotes:
      'Effet verzieht den Weissen beim Abstoss. Die Ablenkung gehoert einkalkuliert, nicht wegdiskutiert.',
  },
  {
    slug: 'seiteneffet-rechts',
    name: 'Seiteneffet rechts',
    description: 'Dasselbe mit rechtem Effet, um den Weissen kurz zu halten.',
    object: { x: 68, y: 30 },
    pocket: 'tr',
    cut: 25,
    dist: 28,
    side: -1,
    spin: { x: 0.7, y: 0 },
    zone: { x: 55, y: 45, r: 9 },
    skills: ['sidespin', 'position'],
    shotType: 'position',
    difficulty: 7,
    speed: 6,
    coachNotes: 'Rechtes Effet verkuerzt den Winkel an der oberen Bande. Erst das Tempo, dann das Effet.',
  },
  {
    slug: 'position-kitchen',
    name: 'Position in die Kitchen',
    description: 'Einlochen und den Weissen kontrolliert hinter die Kopflinie bringen.',
    object: { x: 72, y: 30 },
    pocket: 'tr',
    cut: 20,
    dist: 30,
    spin: { x: 0, y: -0.5 },
    zone: { x: 15, y: 25, r: 10 },
    mode: 'pocket+position',
    skills: ['draw', 'position'],
    shotType: 'position',
    difficulty: 6,
    speed: 6,
    coachNotes: 'Grosse Zone, aber grosse Distanz. Tempo ueben, nicht Effet.',
  },
  {
    slug: 'position-eng',
    name: 'Enge Position',
    description: 'Einlochen und den Weissen auf einer kleinen Flaeche stoppen.',
    object: { x: 60, y: 20 },
    pocket: 'br',
    cut: 25,
    dist: 24,
    zone: { x: 55, y: 34, r: 4 },
    skills: ['position', 'stun'],
    shotType: 'position',
    difficulty: 7,
    speed: 4,
    coachNotes: 'Kleine Zone heisst: leiser stossen. Die meisten Fehler kommen aus zu viel Tempo.',
  },
  {
    slug: 'cluster-oeffnen',
    name: 'Cluster oeffnen',
    description: 'Ball einlochen und dabei zwei zusammenliegende Baelle trennen.',
    object: { x: 58, y: 18 },
    pocket: 'br',
    cut: 20,
    dist: 24,
    extras: [
      { number: 6, x: 44, y: 36 },
      { number: 7, x: 46.3, y: 36 },
    ],
    zone: { x: 45, y: 33, r: 7 },
    skills: ['breakout', 'position'],
    shotType: 'position',
    difficulty: 8,
    speed: 6,
    coachNotes: 'Zuerst den Ball sicher lochen, dann den Cluster. Nie umgekehrt.',
  },
  {
    slug: 'safe-hinter-ball',
    name: 'Safe hinter den Ball',
    description: 'Kein Einlochen: den Weissen sicher hinter einem fremden Ball ablegen.',
    object: { x: 60, y: 25 },
    pocket: 'br',
    cut: 55,
    dist: 26,
    extras: [{ number: 8, x: 30, y: 30 }],
    zone: { x: 24, y: 30, r: 6 },
    mode: 'position',
    skills: ['safety', 'position'],
    shotType: 'safety',
    difficulty: 8,
    speed: 3,
    coachNotes:
      'Bewertet wird nur die Lage des Weissen. Der Objektball soll leben bleiben, nicht fallen.',
  },
  {
    slug: 'lange-gerade',
    name: 'Lange Gerade',
    description: 'Ueber die volle Tischlaenge in die Ecke.',
    object: { x: 88, y: 25 },
    pocket: 'br',
    cut: 0,
    dist: 70,
    zone: { x: 85.7, y: 25, r: 6 },
    skills: ['stun', 'position'],
    shotType: 'cut',
    difficulty: 7,
    speed: 6,
    coachNotes:
      'Der Pruefstein fuer den Stoss. Wer hier daneben liegt, trifft nicht die Tasche, sondern hat eine krumme Stossbewegung.',
  },
]

let cache: Shot[] | null = null

/** Die Uebungen. Werden einmal berechnet und danach wiederverwendet. */
export function seedShots(): Shot[] {
  if (!cache) cache = SPECS.map(buildDrill)
  return cache
}
