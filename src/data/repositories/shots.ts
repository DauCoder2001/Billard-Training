import { db } from '../db'
import { touchShot } from '@/domain/shot'
import type { Shot } from '@/domain/types'

export async function allShots(): Promise<Shot[]> {
  const shots = await db.shots.toArray()
  return shots.sort((a, b) => a.name.localeCompare(b.name, 'de'))
}

export function getShot(id: string): Promise<Shot | undefined> {
  return db.shots.get(id)
}

export async function saveShot(shot: Shot): Promise<Shot> {
  const next = touchShot(shot)
  await db.shots.put(next)
  return next
}

export async function saveShots(shots: Shot[]): Promise<void> {
  await db.shots.bulkPut(shots)
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

export async function renameShot(id: string, name: string): Promise<void> {
  const shot = await db.shots.get(id)
  if (!shot) return
  await db.shots.put({ ...shot, name, updatedAt: Date.now() })
}
