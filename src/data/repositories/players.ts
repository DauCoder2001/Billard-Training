import { db } from '../db'
import { newId } from '@/domain/shot'
import type { Player } from '@/domain/types'

export const PLAYER_COLORS = [
  '#e8b530',
  '#4ea8de',
  '#e5573f',
  '#7bc47f',
  '#b07cd6',
  '#e08a3c',
]

export async function allPlayers(): Promise<Player[]> {
  const players = await db.players.toArray()
  return players.sort((a, b) => a.createdAt - b.createdAt)
}

export function getPlayer(id: string): Promise<Player | undefined> {
  return db.players.get(id)
}

export async function createPlayer(name: string): Promise<Player> {
  const existing = await db.players.count()
  const player: Player = {
    id: newId(),
    name: name.trim() || `Spieler ${existing + 1}`,
    color: PLAYER_COLORS[existing % PLAYER_COLORS.length],
    skillRatings: {},
    achievements: [],
    createdAt: Date.now(),
  }
  await db.players.put(player)
  return player
}

export async function updatePlayer(player: Player): Promise<void> {
  await db.players.put(player)
}

/** Loescht den Spieler samt seiner Sessions. */
export async function deletePlayer(id: string): Promise<void> {
  await db.transaction('rw', db.players, db.sessions, async () => {
    await db.sessions.where('playerId').equals(id).delete()
    await db.players.delete(id)
  })
}
