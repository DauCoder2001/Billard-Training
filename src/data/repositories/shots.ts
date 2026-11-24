import { db } from '../db'
import { seedShotById } from '../seed/drills'
import { touchShot } from '@/domain/shot'
import type { Shot } from '@/domain/types'

export async function saveShot(shot: Shot): Promise<Shot> {
  const next = touchShot(shot)
  await db.shots.put(next)
  return next
}

/** Loescht den Stoss samt seiner Trainingshistorie. */
export async function deleteShot(id: string): Promise<void> {
  await db.transaction('rw', db.shots, db.sessions, async () => {
    await db.sessions.where('shotId').equals(id).delete()
    await db.shots.delete(id)
  })
}

export async function toggleFavorite(id: string): Promise<void> {
  const shot = await db.shots.get(id)
  if (!shot) return
  await db.shots.put({ ...shot, favorite: !shot.favorite })
}

/**
 * Ersetzt die eigene Fassung einer mitgelieferten Uebung durch die heutige
 * Vorlage.
 *
 * Der Favorit bleibt - er ist eine Entscheidung des Nutzers und steht nicht
 * in der Vorlage. Die Trainingshistorie bleibt ebenfalls: sie haengt an der
 * Id, und die aendert sich nicht.
 *
 * Der Stoss zaehlt danach wieder als mitgeliefert, genau wie nach
 * "Mitgelieferte Stoesse wiederherstellen" in den Einstellungen - dieselbe
 * Sache im Kleinen soll nicht anders ausgehen als im Grossen.
 */
export async function resetToTemplate(id: string): Promise<void> {
  const shot = await db.shots.get(id)
  const template = seedShotById(id)
  if (!shot || !template) return
  await db.shots.put({ ...template, favorite: shot.favorite })
}

/**
 * Merkt, dass der Nutzer die ueberarbeitete Vorlage gesehen und seine eigene
 * Fassung behalten hat.
 *
 * Dafuer braucht es kein eigenes Feld: der Stoss uebernimmt den heutigen
 * Stand der Vorlage, und der Hinweis kommt erst wieder, wenn sich die Vorlage
 * das naechste Mal aendert. updatedAt bleibt stehen - am Stoss selbst aendert
 * sich nichts, nur an dem, was er schon gesehen hat.
 */
export async function keepOwnVersion(id: string): Promise<void> {
  const shot = await db.shots.get(id)
  const template = seedShotById(id)
  if (!shot || !template) return
  await db.shots.put({ ...shot, seedStamp: template.seedStamp })
}

