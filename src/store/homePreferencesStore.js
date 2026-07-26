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
  // employeeChart/managerChart/hrChart/superadminChart are graphic widgets —
  // only the one matching the viewer's own role ever renders (see
  // ROLE_CHART in dashboard/page.jsx), so they can share defaults freely.
  widgets: {
    timeCard: true, leaveBalance: true,
    employeeChart: true, managerChart: true, hrChart: true, superadminChart: true,
  },
  hiddenShortcutIds: [],
  // Display order — smaller number = higher up. All three top-level sections
  // (menuShortcuts/thingsToDo/dashboardWidgets) stack in one ordered column;
  // widgetOrder.* then reorders within the "Dashboard Widgets" section itself.
  order: { menuShortcuts: 1, thingsToDo: 2, dashboardWidgets: 3 },
  widgetOrder: {
    timeCard: 1, leaveBalance: 2,
    employeeChart: 3, managerChart: 3, hrChart: 3, superadminChart: 3,
  },
}

export const useHomePreferencesStore = create(persist(
  (set, get) => ({
    prefs: {}, // userId -> preferences

    getPrefs: (userId) => {
      const saved = get().prefs[userId] || {}
      return {
        ...DEFAULT_PREFS,
        ...saved,
        widgets: { ...DEFAULT_PREFS.widgets, ...(saved.widgets || {}) },
        order: { ...DEFAULT_PREFS.order, ...(saved.order || {}) },
        widgetOrder: { ...DEFAULT_PREFS.widgetOrder, ...(saved.widgetOrder || {}) },
      }
    },

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
