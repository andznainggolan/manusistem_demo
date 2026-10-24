import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { dbStorage } from '@/lib/dbStorage'
import { recKey } from '@/lib/jlaRealization'

// Teacher confirmations of JLA plan items, per date. See lib/jlaRealization.js.
// records[recKey] = { status: 'Done'|'Partial'|'Missed', hours, reason, confirmedAt,
//                     validation?: 'Approved'|'Rejected', validatedBy, validatedByName, validatedAt, note }
export const useJlaRealStore = create(persist(
  (set) => ({
    records: {},

    // Re-confirming resets any earlier validation: the supervisor decides on the latest claim.
    confirm: (empId, date, key, { status, hours = 0, reason = '' }) => set(s => ({
      records: {
        ...s.records,
        [recKey(empId, date, key)]: { status, hours: status === 'Partial' ? hours : 0, reason, confirmedAt: new Date().toISOString() },
      },
    })),

    validate: (empId, date, key, decision, by, byName, note = '') => set(s => {
      const k = recKey(empId, date, key)
      const cur = s.records[k]
      if (!cur) return s
      return { records: { ...s.records, [k]: { ...cur, validation: decision, validatedBy: by, validatedByName: byName, validatedAt: new Date().toISOString(), note } } }
    }),

    clear: (empId, date, key) => set(s => {
      const { [recKey(empId, date, key)]: _drop, ...rest } = s.records
      return { records: rest }
    }),
  }),
  { name: 'hcm-jla-real-v1', storage: createJSONStorage(() => dbStorage) }
))
