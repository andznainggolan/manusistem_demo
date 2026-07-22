import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { dbStorage } from '@/lib/dbStorage'

const SEED_PAYSLIPS = [
  { id:1, userId:1, name:'Budi Santoso',  period:'2025-05', basic:12000000, allowance:2000000, deduction:500000,  net:13500000, status:'Published' },
  { id:2, userId:2, name:'Dewi Rahayu',   period:'2025-05', basic:20000000, allowance:3000000, deduction:800000,  net:22200000, status:'Published' },
  { id:3, userId:3, name:'Rina Marlina',  period:'2025-05', basic:15000000, allowance:2500000, deduction:600000,  net:16900000, status:'Published' },
  { id:4, userId:4, name:'Ahmad Fauzi',   period:'2025-05', basic:18000000, allowance:2500000, deduction:700000,  net:19800000, status:'Published' },
  { id:5, userId:5, name:'Sari Indah',    period:'2025-05', basic:11000000, allowance:1500000, deduction:400000,  net:12100000, status:'Published' },
  { id:6, userId:1, name:'Budi Santoso',  period:'2025-06', basic:12000000, allowance:2000000, deduction:500000,  net:13500000, status:'Draft'     },
  { id:7, userId:2, name:'Dewi Rahayu',   period:'2025-06', basic:20000000, allowance:3000000, deduction:800000,  net:22200000, status:'Draft'     },
  { id:8, userId:3, name:'Rina Marlina',  period:'2025-06', basic:15000000, allowance:2500000, deduction:600000,  net:16900000, status:'Draft'     },
  { id:9, userId:4, name:'Ahmad Fauzi',   period:'2025-06', basic:18000000, allowance:2500000, deduction:700000,  net:19800000, status:'Draft'     },
  { id:10,userId:5, name:'Sari Indah',    period:'2025-06', basic:11000000, allowance:1500000, deduction:400000,  net:12100000, status:'Draft'     },
]

let _id = SEED_PAYSLIPS.length + 1

const fmt = (n) => new Intl.NumberFormat('id-ID').format(n)

export const formatRp = (n) => `Rp ${fmt(n)}`

export const usePayrollStore = create(persist(
  (set) => ({
    payslips: SEED_PAYSLIPS.map(p => ({ ...p })),

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
  { name: 'hcm-payroll-v1', storage: createJSONStorage(() => dbStorage) }
))
