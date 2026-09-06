import { db } from '../db'
import { DEFAULT_THRESHOLDS } from '@/domain/types'
import type { Settings } from '@/domain/types'

export const DEFAULT_SETTINGS: Settings = {
  id: 'settings',
  activePlayerId: null,
  clothColor: '#1f6b52',
  railColor: '#5b3a22',
  orientation: 'landscape',
  snapToGrid: true,
  snapStep: 3.125,
  defaultThresholds: { ...DEFAULT_THRESHOLDS },
  defaultTargetRadius: 6,
  seededVersion: 0,
}

export async function getSettings(): Promise<Settings> {
  const stored = await db.settings.get('settings')
  return { ...DEFAULT_SETTINGS, ...stored, id: 'settings' }
}

export async function updateSettings(patch: Partial<Settings>): Promise<Settings> {
  const next = { ...(await getSettings()), ...patch, id: 'settings' as const }
  await db.settings.put(next)
  return next
}
