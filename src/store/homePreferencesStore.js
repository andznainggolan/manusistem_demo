import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { dbStorage } from '@/lib/dbStorage'

// Per-user preferences for what shows on the home/dashboard page — set from
// the "Preferensi Beranda" (Homepage Preferences) page, reachable via the
// icon next to the user's name in the topbar.
const DEFAULT_PREFS = {
  showMenuShortcuts: true,
  showThingsToDo: true,
  showDashboardWidgets: true,
  widgets: { timeCard: true, leaveBalance: true },
  hiddenShortcutIds: [],
}

export const useHomePreferencesStore = create(persist(
  (set, get) => ({
    prefs: {}, // userId -> preferences

    getPrefs: (userId) => ({ ...DEFAULT_PREFS, ...(get().prefs[userId] || {}), widgets: { ...DEFAULT_PREFS.widgets, ...(get().prefs[userId]?.widgets || {}) } }),

    updatePrefs: (userId, patch) => set((s) => ({
      prefs: { ...s.prefs, [userId]: { ...get().getPrefs(userId), ...patch } },
    })),

    toggleShortcut: (userId, shortcutId) => set((s) => {
      const current = get().getPrefs(userId)
      const hidden = current.hiddenShortcutIds.includes(shortcutId)
        ? current.hiddenShortcutIds.filter(id => id !== shortcutId)
        : [...current.hiddenShortcutIds, shortcutId]
      return { prefs: { ...s.prefs, [userId]: { ...current, hiddenShortcutIds: hidden } } }
    }),
  }),
  { name: 'hcm-home-preferences-v1', storage: createJSONStorage(() => dbStorage) }
))
