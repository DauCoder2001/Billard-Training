/** Anwendungsweiter Zustand: Einstellungen und aktiver Spieler. */

import { create } from 'zustand'
import { bootstrap } from '@/data/bootstrap'
import { allPlayers } from '@/data/repositories/players'
import { DEFAULT_SETTINGS, getSettings, updateSettings } from '@/data/repositories/settings'
import type { Player, Settings } from '@/domain/types'

interface AppState {
  ready: boolean
  error: string | null
  settings: Settings
  players: Player[]
  load: () => Promise<void>
  refreshPlayers: () => Promise<void>
  setActivePlayer: (id: string) => Promise<void>
  patchSettings: (patch: Partial<Settings>) => Promise<void>
}

export const useApp = create<AppState>((set) => ({
  ready: false,
  error: null,
  settings: DEFAULT_SETTINGS,
  players: [],

  load: async () => {
    try {
      await bootstrap()
      const [settings, players] = await Promise.all([getSettings(), allPlayers()])
      set({ settings, players, ready: true, error: null })
    } catch (err) {
      set({ ready: true, error: err instanceof Error ? err.message : String(err) })
    }
  },

  refreshPlayers: async () => {
    set({ players: await allPlayers() })
  },

  setActivePlayer: async (id) => {
    set({ settings: await updateSettings({ activePlayerId: id }) })
  },

  patchSettings: async (patch) => {
    set({ settings: await updateSettings(patch) })
  },
}))

/** Der aktive Spieler, oder der erste vorhandene als Rueckfallebene. */
export function useActivePlayer(): Player | null {
  const players = useApp((s) => s.players)
  const activeId = useApp((s) => s.settings.activePlayerId)
  return players.find((p) => p.id === activeId) ?? players[0] ?? null
}

/** Praktisch fuer Aufrufe ausserhalb von React-Komponenten. */
export function activePlayerId(): string | null {
  const { players, settings } = useApp.getState()
  return settings.activePlayerId ?? players[0]?.id ?? null
}
