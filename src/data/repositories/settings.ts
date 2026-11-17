import { db } from '../db'
import { DEFAULT_THRESHOLDS } from '@/domain/types'
import type { Settings } from '@/domain/types'

export const DEFAULT_SETTINGS: Settings = {
  id: 'settings',
  activePlayerId: null,
  clothColor: '#3f92d2',
  railColor: '#e7eaee',
  orientation: 'landscape',
  snapToGrid: true,
  snapStep: 3.125,
  defaultThresholds: { ...DEFAULT_THRESHOLDS },
  defaultTargetRadius: 6,
  seededVersion: 0,
  themeVersion: 0,
}

export async function getSettings(): Promise<Settings> {
  const stored = await db.settings.get('settings')
  return { ...DEFAULT_SETTINGS, ...stored, id: 'settings' }
}

export async function updateSettings(patch: Partial<Settings>): Promise<Settings> {
  // Lesen, zusammenfuehren und Schreiben gehoeren zusammen. Ohne Klammer
  // lesen zwei schnell aufeinander folgende Aenderungen denselben
  // Ausgangsstand und die zweite ueberschreibt die erste - die Schieberegler
  // der Einstellungen loesen beim Ziehen viele Aenderungen kurz hintereinander
  // aus.
  return db.transaction('rw', db.settings, async () => {
    const next = { ...(await getSettings()), ...patch, id: 'settings' as const }
    await db.settings.put(next)
    return next
  })
}
