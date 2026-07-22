import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { dbStorage } from '@/lib/dbStorage'

const today = new Date()
const fmt = (d) => d.toISOString().slice(0, 10)

// Generate seed attendance for last 14 days
const genRecords = () => {
  const employees = [
    { id: 1, name: 'Budi Santoso' },
    { id: 2, name: 'Dewi Rahayu' },
    { id: 5, name: 'Sari Indah' },
  ]
  const records = []
  let _id = 1
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dow = d.getDay()
    if (dow === 0 || dow === 6) continue
    const ds = fmt(d)
    employees.forEach(emp => {
      const rand = Math.random()
      const status = rand < 0.8 ? 'Present' : rand < 0.9 ? 'Late' : 'Absent'
      records.push({
        id: _id++,
        userId: emp.id,
        name: emp.name,
        date: ds,
        checkIn:  status !== 'Absent' ? (status === 'Late' ? '09:15' : '08:00') : '-',
        checkOut: status !== 'Absent' ? '17:00' : '-',
        status,
      })
    })
  }
  return records
}

let _id = 100

export const useAttendanceStore = create(persist(
  (set) => ({
    records: genRecords(),

    addRecord: (r) =>
      set((s) => ({ records: [...s.records, { id: _id++, ...r }] })),

    updateRecord: (id, d) =>
      set((s) => ({ records: s.records.map((r) => (r.id === id ? { ...r, ...d } : r)) })),
  }),
  { name: 'hcm-attendance-v1', storage: createJSONStorage(() => dbStorage) }
))
