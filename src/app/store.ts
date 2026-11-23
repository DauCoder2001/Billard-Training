/** Anwendungsweiter Zustand: Einstellungen und aktiver Spieler. */

import { create } from 'zustand'
import { bootstrap } from '@/data/bootstrap'
import { storageErrorText } from '@/data/errors'
import { usePlayers } from '@/data/hooks'
import { DEFAULT_SETTINGS, getSettings, updateSettings } from '@/data/repositories/settings'
import type { Player, Settings } from '@/domain/types'

interface AppState {
  ready: boolean
  error: string | null
  settings: Settings
  load: () => Promise<void>
  /** Liefert null, wenn gespeichert wurde - sonst den Grund. */
  setActivePlayer: (id: string) => Promise<string | null>
  /** Liefert null, wenn gespeichert wurde - sonst den Grund. */
  patchSettings: (patch: Partial<Settings>) => Promise<string | null>
}

export const useApp = create<AppState>((set) => {
  /**
   * Schreibt die Einstellungen und zieht den Zustand nach.
   *
   * Geworfen wird nichts: Farbfelder, Schalter und Regler rufen ohne Klammer
   * auf, ein Fehler landete dort als abgewiesenes Versprechen in der Konsole
   * und sonst nirgends - die Anzeige sprang stumm auf den alten Wert zurueck,
   * als haette der Regler geklemmt. Stattdessen kommt der fertige Satz
   * zurueck, und wer eine Meldung zeigen kann, zeigt sie.
   */
  const schreiben = async (patch: Partial<Settings>): Promise<string | null> => {
    try {
      set({ settings: await updateSettings(patch) })
      return null
    } catch (err) {
      return storageErrorText(err)
    }
  }

  return {
    ready: false,
    error: null,
    settings: DEFAULT_SETTINGS,

    load: async () => {
      try {
        await bootstrap()
        set({ settings: await getSettings(), ready: true, error: null })
      } catch (err) {
        set({ ready: true, error: storageErrorText(err) })
      }
    },

    setActivePlayer: (id) => schreiben({ activePlayerId: id }),

    patchSettings: (patch) => schreiben(patch),
  }
})

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
