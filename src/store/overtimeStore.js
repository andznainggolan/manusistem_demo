import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { dbStorage } from '@/lib/dbStorage'

// Overtime hours planned ahead of time for one employee on one date.
const SEED_PLANS_EMPLOYEE = [
  { id: 1, employeeId: 1, name: 'Budi Santoso', date: '2026-08-25', plannedHours: 3, reason: 'Deploy rilis akhir bulan', status: 'Approved' },
  { id: 2, employeeId: 5, name: 'Sari Indah',    date: '2026-08-26', plannedHours: 2, reason: 'Perbaikan bug produksi', status: 'Planned' },
]

// Actual overtime hours realized — optionally traced back to a plan above.
const SEED_REALIZATIONS_EMPLOYEE = [
  { id: 1, employeeId: 1, name: 'Budi Santoso', date: '2026-08-25', planId: 1, plannedHours: 3, actualHours: 3.5, notes: '', status: 'Verified' },
]

// Team-level overtime budget planned by a manager for a period (YYYY-MM).
const SEED_PLANS_MANAGER = [
  { id: 1, managerId: 7, name: 'Rizky Pratama', departmentId: 1, period: '2026-08', plannedHours: 20, notes: 'Persiapan rilis Q3', status: 'Approved' },
]

// Actual team-level overtime hours realized for that period.
const SEED_REALIZATIONS_MANAGER = [
  { id: 1, managerId: 7, name: 'Rizky Pratama', departmentId: 1, period: '2026-08', realizedHours: 14, notes: '', status: 'Verified' },
]

// Compensatory leave ledger — hours earned (usually from realized overtime)
// vs. hours already used, with an expiry date.
const SEED_COMP_LEAVE = [
  { id: 1, employeeId: 1, name: 'Budi Santoso', earnedDate: '2026-08-25', sourceDate: '2026-08-25', hoursEarned: 3.5, hoursUsed: 0, expiryDate: '2026-11-25', notes: '' },
]

let _peId = SEED_PLANS_EMPLOYEE.length + 1
let _reId = SEED_REALIZATIONS_EMPLOYEE.length + 1
let _pmId = SEED_PLANS_MANAGER.length + 1
let _rmId = SEED_REALIZATIONS_MANAGER.length + 1
let _clId = SEED_COMP_LEAVE.length + 1

export const useOvertimeStore = create(persist(
  (set) => ({
    plansEmployee:        SEED_PLANS_EMPLOYEE.map(x => ({ ...x })),
    realizationsEmployee: SEED_REALIZATIONS_EMPLOYEE.map(x => ({ ...x })),
    plansManager:         SEED_PLANS_MANAGER.map(x => ({ ...x })),
    realizationsManager:  SEED_REALIZATIONS_MANAGER.map(x => ({ ...x })),
    compLeave:            SEED_COMP_LEAVE.map(x => ({ ...x })),

    addPlanEmployee:    (d)    => set(s => ({ plansEmployee: [...s.plansEmployee, { id: _peId++, ...d }] })),
    updatePlanEmployee: (id,d) => set(s => ({ plansEmployee: s.plansEmployee.map(x => x.id === id ? { ...x, ...d } : x) })),
    deletePlanEmployee: (id)   => set(s => ({ plansEmployee: s.plansEmployee.filter(x => x.id !== id) })),

    addRealizationEmployee:    (d)    => set(s => ({ realizationsEmployee: [...s.realizationsEmployee, { id: _reId++, ...d }] })),
    updateRealizationEmployee: (id,d) => set(s => ({ realizationsEmployee: s.realizationsEmployee.map(x => x.id === id ? { ...x, ...d } : x) })),
    deleteRealizationEmployee: (id)   => set(s => ({ realizationsEmployee: s.realizationsEmployee.filter(x => x.id !== id) })),

    addPlanManager:    (d)    => set(s => ({ plansManager: [...s.plansManager, { id: _pmId++, ...d }] })),
    updatePlanManager: (id,d) => set(s => ({ plansManager: s.plansManager.map(x => x.id === id ? { ...x, ...d } : x) })),
    deletePlanManager: (id)   => set(s => ({ plansManager: s.plansManager.filter(x => x.id !== id) })),

    addRealizationManager:    (d)    => set(s => ({ realizationsManager: [...s.realizationsManager, { id: _rmId++, ...d }] })),
    updateRealizationManager: (id,d) => set(s => ({ realizationsManager: s.realizationsManager.map(x => x.id === id ? { ...x, ...d } : x) })),
    deleteRealizationManager: (id)   => set(s => ({ realizationsManager: s.realizationsManager.filter(x => x.id !== id) })),

    addCompLeave:    (d)    => set(s => ({ compLeave: [...s.compLeave, { id: _clId++, ...d }] })),
    updateCompLeave: (id,d) => set(s => ({ compLeave: s.compLeave.map(x => x.id === id ? { ...x, ...d } : x) })),
    deleteCompLeave: (id)   => set(s => ({ compLeave: s.compLeave.filter(x => x.id !== id) })),
  }),
  { name: 'hcm-overtime-v1', storage: createJSONStorage(() => dbStorage) }
))
