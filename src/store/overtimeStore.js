import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { dbStorage } from '@/lib/dbStorage'

// Each rule says who a feature applies to — Company (PT) / Grade (PC) range /
// Department / Location / Employment Type, any of which can be left blank to
// mean "all". `eligible: false` lets HR carve out an explicit exclusion
// instead of only ever defining inclusions.
const blankRule = (over) => ({
  name: '', companyIds: [], departmentIds: [], gradeFromId: null, gradeToId: null,
  location: '', employmentType: '', eligible: true, active: true, notes: '', ...over,
})

const SEED_PLAN_EMPLOYEE = [
  blankRule({ id: 1, name: 'Staff & Senior Staff — semua PT', gradeFromId: 40, gradeToId: 52, eligible: true }),
]
const SEED_REALIZATION_EMPLOYEE = [
  blankRule({ id: 1, name: 'Staff & Senior Staff — semua PT', gradeFromId: 40, gradeToId: 52, eligible: true }),
]
const SEED_PLAN_MANAGER = [
  blankRule({ id: 1, name: 'Manager ke atas', gradeFromId: 20, gradeToId: 39, eligible: true }),
]
const SEED_REALIZATION_MANAGER = [
  blankRule({ id: 1, name: 'Manager ke atas', gradeFromId: 20, gradeToId: 39, eligible: true }),
]
const SEED_COMP_LEAVE = [
  blankRule({ id: 1, name: 'Staff & Senior Staff — semua PT', gradeFromId: 40, gradeToId: 52, eligible: true }),
]

let _peId = SEED_PLAN_EMPLOYEE.length + 1
let _reId = SEED_REALIZATION_EMPLOYEE.length + 1
let _pmId = SEED_PLAN_MANAGER.length + 1
let _rmId = SEED_REALIZATION_MANAGER.length + 1
let _clId = SEED_COMP_LEAVE.length + 1

export const useOvertimeStore = create(persist(
  (set) => ({
    eligibilityPlanEmployee:        SEED_PLAN_EMPLOYEE.map(x => ({ ...x })),
    eligibilityRealizationEmployee: SEED_REALIZATION_EMPLOYEE.map(x => ({ ...x })),
    eligibilityPlanManager:         SEED_PLAN_MANAGER.map(x => ({ ...x })),
    eligibilityRealizationManager:  SEED_REALIZATION_MANAGER.map(x => ({ ...x })),
    eligibilityCompLeave:           SEED_COMP_LEAVE.map(x => ({ ...x })),

    addPlanEmployeeRule:    (d)    => set(s => ({ eligibilityPlanEmployee: [...s.eligibilityPlanEmployee, { id: _peId++, ...d }] })),
    updatePlanEmployeeRule: (id,d) => set(s => ({ eligibilityPlanEmployee: s.eligibilityPlanEmployee.map(x => x.id === id ? { ...x, ...d } : x) })),
    deletePlanEmployeeRule: (id)   => set(s => ({ eligibilityPlanEmployee: s.eligibilityPlanEmployee.filter(x => x.id !== id) })),

    addRealizationEmployeeRule:    (d)    => set(s => ({ eligibilityRealizationEmployee: [...s.eligibilityRealizationEmployee, { id: _reId++, ...d }] })),
    updateRealizationEmployeeRule: (id,d) => set(s => ({ eligibilityRealizationEmployee: s.eligibilityRealizationEmployee.map(x => x.id === id ? { ...x, ...d } : x) })),
    deleteRealizationEmployeeRule: (id)   => set(s => ({ eligibilityRealizationEmployee: s.eligibilityRealizationEmployee.filter(x => x.id !== id) })),

    addPlanManagerRule:    (d)    => set(s => ({ eligibilityPlanManager: [...s.eligibilityPlanManager, { id: _pmId++, ...d }] })),
    updatePlanManagerRule: (id,d) => set(s => ({ eligibilityPlanManager: s.eligibilityPlanManager.map(x => x.id === id ? { ...x, ...d } : x) })),
    deletePlanManagerRule: (id)   => set(s => ({ eligibilityPlanManager: s.eligibilityPlanManager.filter(x => x.id !== id) })),

    addRealizationManagerRule:    (d)    => set(s => ({ eligibilityRealizationManager: [...s.eligibilityRealizationManager, { id: _rmId++, ...d }] })),
    updateRealizationManagerRule: (id,d) => set(s => ({ eligibilityRealizationManager: s.eligibilityRealizationManager.map(x => x.id === id ? { ...x, ...d } : x) })),
    deleteRealizationManagerRule: (id)   => set(s => ({ eligibilityRealizationManager: s.eligibilityRealizationManager.filter(x => x.id !== id) })),

    addCompLeaveRule:    (d)    => set(s => ({ eligibilityCompLeave: [...s.eligibilityCompLeave, { id: _clId++, ...d }] })),
    updateCompLeaveRule: (id,d) => set(s => ({ eligibilityCompLeave: s.eligibilityCompLeave.map(x => x.id === id ? { ...x, ...d } : x) })),
    deleteCompLeaveRule: (id)   => set(s => ({ eligibilityCompLeave: s.eligibilityCompLeave.filter(x => x.id !== id) })),
  }),
  { name: 'hcm-overtime-eligibility-v2', storage: createJSONStorage(() => dbStorage) }
))
