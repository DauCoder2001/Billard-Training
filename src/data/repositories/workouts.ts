import { db } from '../db'
import { newId } from '@/domain/shot'
import type { Workout } from '@/domain/types'

export async function allWorkouts(): Promise<Workout[]> {
  const rows = await db.workouts.toArray()
  return rows.sort((a, b) => a.name.localeCompare(b.name, 'de'))
}

export function getWorkout(id: string): Promise<Workout | undefined> {
  return db.workouts.get(id)
}

export function createWorkout(name = 'Neues Workout'): Workout {
  const now = Date.now()
  return { id: newId(), name, description: '', entries: [], createdAt: now, updatedAt: now }
}

export async function saveWorkout(workout: Workout): Promise<Workout> {
  const next = { ...workout, updatedAt: Date.now() }
  await db.workouts.put(next)
  return next
}

export async function deleteWorkout(id: string): Promise<void> {
  await db.workouts.delete(id)
}
