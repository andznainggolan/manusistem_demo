import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { dbStorage } from '@/lib/dbStorage'
import { useEmployeeStore } from './employeeStore'
import { useStructureStore } from './structureStore'
import { calcPayslip, DEFAULT_PAYROLL_SETTINGS } from '@/lib/payrollCalc'
import { IS_SCHOOL } from '@/lib/demoProfile'
import { SCHOOL_EMPLOYEES, SCHOOL_POSITIONS, SCHOOL_GRADE_BY_ID } from '@/data/schoolSeed'
import { useJlaStore } from './jlaStore'
import { weekSummary } from '@/lib/jla'

const SEED_PAYSLIP_INPUTS = IS_SCHOOL ? [] : [
  { id:1, empId:1, name:'Budi Santoso',  period:'2025-05', basic:12000000, allowance:2000000, ptkpStatus:'K/1',  npwp:true  },
  { id:2, empId:2, name:'Dewi Rahayu',   period:'2025-05', basic:20000000, allowance:3000000, ptkpStatus:'K/0',  npwp:true  },
  { id:3, empId:3, name:'Rina Marlina',  period:'2025-05', basic:15000000, allowance:2500000, ptkpStatus:'TK/0', npwp:true  },
  { id:4, empId:4, name:'Ahmad Fauzi',   period:'2025-05', basic:18000000, allowance:2500000, ptkpStatus:'K/2',  npwp:true  },
  { id:5, empId:5, name:'Sari Indah',    period:'2025-05', basic:11000000, allowance:1500000, ptkpStatus:'TK/0', npwp:false },
]

const BASE_PAYSLIPS = SEED_PAYSLIP_INPUTS.map((p) => ({
  ...p, status: 'Published',
  ...calcPayslip({
    basic: p.basic, allowance: p.allowance, ptkpStatus: p.ptkpStatus, hasNpwp: p.npwp,
    bpjsKesehatan: true, bpjsTk: true, settings: DEFAULT_PAYROLL_SETTINGS,
  }),
}))

// School profile: last month published + this month in Draft, basic salary =
// the midpoint of each employee's position grade, so Payroll Run isn't empty.
function buildSchoolPayslips() {
  const gradeOf = (positionId) => SCHOOL_GRADE_BY_ID[SCHOOL_POSITIONS.find(p => p.id === positionId).gradeId]
  const rows = []
  ;[['2026-09', 'Published'], ['2026-10', 'Draft']].forEach(([period, status]) => {
    SCHOOL_EMPLOYEES.forEach(e => {
      const g = gradeOf(e.positionId)
      const basic = Math.round((g.minSalary + g.maxSalary) / 2 / 10000) * 10000
      const ptkpStatus = e.maritalStatus === 'Married' ? 'K/0' : 'TK/0'
      rows.push({
        id: rows.length + 1, empId: e.id, name: e.name, period, status, ptkpStatus, npwp: true, variableAllowances: [],
        ...calcPayslip({
          basic, allowance: 0, variableAllowance: 0, overtime: 0, otherDeduction: 0,
          ptkpStatus, hasNpwp: true, bpjsKesehatan: true, bpjsTk: true, settings: DEFAULT_PAYROLL_SETTINGS,
        }),
      })
    })
  })
  return rows
}

const SEED_PAYSLIPS = IS_SCHOOL ? buildSchoolPayslips() : BASE_PAYSLIPS

let _id     = SEED_PAYSLIPS.length + 1

const fmt = (n) => new Intl.NumberFormat('id-ID').format(Math.round(n || 0))
export const formatRp = (n) => `Rp ${fmt(n)}`

// Default gaji pokok for an employee with no explicit salary record yet:
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

// School profile: Guru payroll follows Job Load Analysis (JLA). In 'prorate'
// mode a weekly shortfall against the target deducts the same share of basic.
function jlaAdjustment(empId, basic) {
  if (!IS_SCHOOL) return null
  const { settings, categories, teachingBlocks, tasks } = useJlaStore.getState()
  if (categories[empId] !== 'Guru') return null
  const sum = weekSummary(empId, teachingBlocks, tasks, settings.targetHours)
  const deduction = settings.payrollMode === 'prorate' && !sum.achieved ? Math.round(basic * sum.gap / sum.target) : 0
  return { hours: sum.total, target: sum.target, deduction }
}

const EMPTY_PROFILE = {
  basic: null, allowance: null, variableAllowances: [], ptkpStatus: 'TK/0', npwp: true,
  bpjsKesehatan: true, bpjsTk: true,
}

export const sumVariableAllowances = (rows) => (rows || []).reduce((s, r) => s + (Number(r.amount) || 0), 0)

const todayStr = () => new Date().toISOString().slice(0, 10)

export const usePayrollStore = create(persist(
  (set, get) => ({
    payslips: SEED_PAYSLIPS.map(p => ({ ...p })),
    profiles: {},          // empId -> legacy flat profile (kept only as a fallback for old saved data)
    settings: { ...DEFAULT_PAYROLL_SETTINGS },

    // Salary is one entry among an employee's unified History (company/dept/
    // position/grade + comp fields on the same effective-dated timeline as
    // Hire/Transfer/Promotion/etc — see employeeStore's history/addHistory).
    // Only entries carrying a `basic` value count as salary records.
    getSalaryRecords: (empId) => {
      const emp = useEmployeeStore.getState().employees.find(e => e.id === empId)
      return (emp?.history || [])
        .filter(h => h.basic != null)
        .sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate) || b.effectiveSeq - a.effectiveSeq)
    },

    // Salary record in effect on `asOfDate` ('YYYY-MM-DD'): the History entry
    // whose effectiveDate <= asOfDate <= effectiveEndDate (or no end date
    // yet). Falls back to the old single-profile save, then to a grade-based
    // default, so payroll still works for employees without a dated record.
    getSalaryAsOf: (empId, asOfDate) => {
      const emp = useEmployeeStore.getState().employees.find(e => e.id === empId)
      const records = get().getSalaryRecords(empId)
        .filter(r => r.effectiveDate <= asOfDate && (!r.effectiveEndDate || r.effectiveEndDate >= asOfDate))

      const legacy = get().profiles[empId]

      return {
        ...EMPTY_PROFILE,
        basic: emp ? defaultBasicFor(emp) : 6_000_000,
        allowance: 0,
        ...legacy,
        ...records[0],
      }
    },

    // Kept for the few remaining callers that just want "current" salary
    // (e.g. an estimate) without an as-of date.
    getProfile: (empId) => get().getSalaryAsOf(empId, todayStr()),

    updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

    // Build Draft payslips for every active employee for `period` who doesn't
    // already have a payslip row that period (so re-running never clobbers a
    // Published or already-edited Draft — remove the row first to regenerate it).
    // Salary is looked up as-of the last day of the period month, so a raise
    // dated mid-period is already reflected in that period's payroll.
    generatePeriod: (period) => set((s) => {
      const employees = useEmployeeStore.getState().employees.filter(e => e.status === 'Active')
      const existing = new Set(s.payslips.filter(p => p.period === period).map(p => p.empId))
      const asOfDate = `${period}-31`
      const rows = []
      employees.forEach((emp) => {
        if (existing.has(emp.id)) return
        const profile = get().getSalaryAsOf(emp.id, asOfDate)
        const basic = profile.basic ?? defaultBasicFor(emp)
        const allowance = profile.allowance || 0
        const variableAllowance = sumVariableAllowances(profile.variableAllowances)
        const jla = jlaAdjustment(emp.id, basic)
        const calc = calcPayslip({
          basic, allowance, variableAllowance, overtime: 0, otherDeduction: jla?.deduction || 0,
          ptkpStatus: profile.ptkpStatus, hasNpwp: profile.npwp,
          bpjsKesehatan: profile.bpjsKesehatan, bpjsTk: profile.bpjsTk,
          settings: s.settings,
        })
        rows.push({
          id: _id++, empId: emp.id, name: emp.name, period, status: 'Draft',
          ptkpStatus: profile.ptkpStatus, npwp: profile.npwp,
          variableAllowances: profile.variableAllowances,
          ...calc,
        })
      })
      return { payslips: [...s.payslips, ...rows] }
    }),

    // Re-applies the JLA rule (current target and payroll mode) to Draft payslips of Guru.
    recalcDraftFromJla: (period) => set((s) => ({
      payslips: s.payslips.map((p) => {
        if (p.period !== period || p.status !== 'Draft') return p
        const adj = jlaAdjustment(p.empId, p.basic)
        if (!adj) return p
        const calc = calcPayslip({
          basic: p.basic, allowance: p.allowance || 0, variableAllowance: p.variableAllowance || 0,
          overtime: p.overtime || 0, otherDeduction: adj.deduction,
          ptkpStatus: p.ptkpStatus, hasNpwp: p.npwp, bpjsKesehatan: true, bpjsTk: true, settings: s.settings,
        })
        return { ...p, ...calc }
      }),
    })),

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
  // School profile gets its own key so cached/older seeded payslips (pre-grade-change) are not reused.
  { name: IS_SCHOOL ? 'hcm-payroll-school-v2' : 'hcm-payroll-v2', storage: createJSONStorage(() => dbStorage) }
))
