import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { dbStorage } from '@/lib/dbStorage'
import { useEmployeeStore } from './employeeStore'
import { useStructureStore } from './structureStore'
import { calcPayslip, DEFAULT_PAYROLL_SETTINGS } from '@/lib/payrollCalc'

const SEED_PAYSLIP_INPUTS = [
  { id:1, empId:1, name:'Budi Santoso',  period:'2025-05', basic:12000000, allowance:2000000, ptkpStatus:'K/1',  npwp:true  },
  { id:2, empId:2, name:'Dewi Rahayu',   period:'2025-05', basic:20000000, allowance:3000000, ptkpStatus:'K/0',  npwp:true  },
  { id:3, empId:3, name:'Rina Marlina',  period:'2025-05', basic:15000000, allowance:2500000, ptkpStatus:'TK/0', npwp:true  },
  { id:4, empId:4, name:'Ahmad Fauzi',   period:'2025-05', basic:18000000, allowance:2500000, ptkpStatus:'K/2',  npwp:true  },
  { id:5, empId:5, name:'Sari Indah',    period:'2025-05', basic:11000000, allowance:1500000, ptkpStatus:'TK/0', npwp:false },
]

const SEED_PAYSLIPS = SEED_PAYSLIP_INPUTS.map((p) => ({
  ...p, status: 'Published',
  ...calcPayslip({
    basic: p.basic, allowance: p.allowance, ptkpStatus: p.ptkpStatus, hasNpwp: p.npwp,
    bpjsKesehatan: true, bpjsTk: true, settings: DEFAULT_PAYROLL_SETTINGS,
  }),
}))

let _id = SEED_PAYSLIPS.length + 1

const fmt = (n) => new Intl.NumberFormat('id-ID').format(Math.round(n || 0))
export const formatRp = (n) => `Rp ${fmt(n)}`

// Default gaji pokok for an employee with no explicit payroll profile yet:
// derive from their position's grade (Mercer PC) salary range midpoint, so
// "Generate Payroll" is usable immediately without configuring every employee.
function defaultBasicFor(emp) {
  const { positions, grades } = useStructureStore.getState()
  const position = positions.find(p => p.id === emp.positionId)
  const grade = position && grades.find(g => g.id === position.gradeId)
  if (grade && (grade.minSalary || grade.maxSalary)) {
    return Math.round((grade.minSalary + grade.maxSalary) / 2 / 10000) * 10000
  }
  return 6_000_000
}

const EMPTY_PROFILE = {
  basic: null, allowance: null, ptkpStatus: 'TK/0', npwp: true,
  bpjsKesehatan: true, bpjsTk: true,
}

export const usePayrollStore = create(persist(
  (set, get) => ({
    payslips: SEED_PAYSLIPS.map(p => ({ ...p })),
    profiles: {},          // empId -> payroll profile (PTKP, NPWP, BPJS enrollment, overrides)
    settings: { ...DEFAULT_PAYROLL_SETTINGS },

    getProfile: (empId) => {
      const emp = useEmployeeStore.getState().employees.find(e => e.id === empId)
      const saved = get().profiles[empId] || {}
      return {
        ...EMPTY_PROFILE,
        basic: emp ? defaultBasicFor(emp) : 6_000_000,
        allowance: 0,
        ...saved,
      }
    },

    setProfile: (empId, data) =>
      set((s) => ({ profiles: { ...s.profiles, [empId]: { ...(s.profiles[empId] || {}), ...data } } })),

    updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

    // Build Draft payslips for every active employee for `period` who doesn't
    // already have a payslip row that period (so re-running never clobbers a
    // Published or already-edited Draft — remove the row first to regenerate it).
    generatePeriod: (period) => set((s) => {
      const employees = useEmployeeStore.getState().employees.filter(e => e.status === 'Active')
      const existing = new Set(s.payslips.filter(p => p.period === period).map(p => p.empId))
      const rows = []
      employees.forEach((emp) => {
        if (existing.has(emp.id)) return
        const profile = get().getProfile(emp.id)
        const basic = profile.basic ?? defaultBasicFor(emp)
        const allowance = profile.allowance || 0
        const calc = calcPayslip({
          basic, allowance, overtime: 0, otherDeduction: 0,
          ptkpStatus: profile.ptkpStatus, hasNpwp: profile.npwp,
          bpjsKesehatan: profile.bpjsKesehatan, bpjsTk: profile.bpjsTk,
          settings: s.settings,
        })
        rows.push({
          id: _id++, empId: emp.id, name: emp.name, period, status: 'Draft',
          ptkpStatus: profile.ptkpStatus, npwp: profile.npwp,
          ...calc,
        })
      })
      return { payslips: [...s.payslips, ...rows] }
    }),

    removePayslip: (id) => set((s) => ({ payslips: s.payslips.filter(p => p.id !== id) })),

    publishPeriod: (period) =>
      set((s) => ({
        payslips: s.payslips.map((p) =>
          p.period === period ? { ...p, status: 'Published' } : p
        ),
      })),

    addPayslip: (p) =>
      set((s) => ({ payslips: [...s.payslips, { id: _id++, ...p }] })),

    updatePayslip: (id, d) =>
      set((s) => ({ payslips: s.payslips.map((p) => (p.id === id ? { ...p, ...d } : p)) })),
  }),
  { name: 'hcm-payroll-v2', storage: createJSONStorage(() => dbStorage) }
))
