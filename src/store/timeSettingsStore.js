import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { dbStorage } from '@/lib/dbStorage'

// Time & attendance rules. Defaults keep the original behaviour: no tolerance
// and no approval requirement.
export const DEFAULT_TIME_SETTINGS = {
  lateToleranceMinutes: 0,        // clock-in this many minutes late still counts as on time (green)
  earlyOutToleranceMinutes: 0,    // clock-out this many minutes early still counts as on time
  requireApproval: false,         // every late-in / early-out needs the supervisor's approval
  approvalDeadlineDays: 3,        // days after the date; undecided requests then count as Alpa
}

export const approvalKey = (userId, date, kind) => `${userId}|${date}|${kind}`

export const useTimeSettingsStore = create(persist(
  (set) => ({
    settings: { ...DEFAULT_TIME_SETTINGS },
    // approvals[key] = { status: 'Pending'|'Approved'|'Rejected', reason, requestedAt, decidedBy, decidedByName, decidedAt, note }
    approvals: {},

    updateSettings: (patch) => set(s => ({ settings: { ...s.settings, ...patch } })),

    saveReason: (userId, date, kind, reason) => set(s => {
      const k = approvalKey(userId, date, kind)
      const cur = s.approvals[k]
      return { approvals: { ...s.approvals, [k]: { status: 'Pending', ...cur, reason, requestedAt: cur?.requestedAt || new Date().toISOString() } } }
    }),

    decide: (userId, date, kind, decision, by, byName, note = '') => set(s => {
      const k = approvalKey(userId, date, kind)
      const cur = s.approvals[k] || {}
      return { approvals: { ...s.approvals, [k]: { ...cur, status: decision, decidedBy: by, decidedByName: byName, decidedAt: new Date().toISOString(), note } } }
    }),
  }),
  { name: 'hcm-time-settings-v1', storage: createJSONStorage(() => dbStorage) }
))
