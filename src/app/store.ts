/** Anwendungsweiter Zustand: Einstellungen und aktiver Spieler. */

import { create } from 'zustand'
import { bootstrap } from '@/data/bootstrap'
import { usePlayers } from '@/data/hooks'
import { DEFAULT_SETTINGS, getSettings, updateSettings } from '@/data/repositories/settings'
import type { Player, Settings } from '@/domain/types'

interface AppState {
  ready: boolean
  error: string | null
  settings: Settings
  load: () => Promise<void>
  setActivePlayer: (id: string) => Promise<void>
  patchSettings: (patch: Partial<Settings>) => Promise<void>
}

export const useApp = create<AppState>((set) => ({
  ready: false,
  error: null,
  settings: DEFAULT_SETTINGS,

  load: async () => {
    try {
      await bootstrap()
      set({ settings: await getSettings(), ready: true, error: null })
    } catch (err) {
      set({ ready: true, error: err instanceof Error ? err.message : String(err) })
    }
  },

  setActivePlayer: async (id) => {
    set({ settings: await updateSettings({ activePlayerId: id }) })
  },

  patchSettings: async (patch) => {
    set({ settings: await updateSettings(patch) })
  },
}))

/**
 * Der aktive Spieler, oder der erste vorhandene als Rueckfallebene.
 *
 * Die Spieler kommen direkt aus der Datenbank, damit fortgeschriebene
 * Skill-Ratings sofort sichtbar sind und nicht erst nach einem Neuladen.
 */
export function useActivePlayer(): Player | null {
  const players = usePlayers()
  const activeId = useApp((s) => s.settings.activePlayerId)
  if (!players) return null
  return players.find((p) => p.id === activeId) ?? players[0] ?? null
}
