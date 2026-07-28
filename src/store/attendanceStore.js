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

export const todayStr = () => new Date().toISOString().slice(0, 10)

export const useAttendanceStore = create(persist(
  (set, get) => ({
    records: genRecords(),

    addRecord: (r) =>
      set((s) => ({ records: [...s.records, { id: _id++, ...r }] })),

    updateRecord: (id, d) =>
      set((s) => ({ records: s.records.map((r) => (r.id === id ? { ...r, ...d } : r)) })),

    // One record per employee per day — Clock In creates it, Clock Out fills
    // in the other half.
    recordFor: (userId, date = todayStr()) =>
      get().records.find(r => r.userId === userId && r.date === date) || null,

    clockIn: (userId, name, time, { date = todayStr(), status = 'Present' } = {}) =>
      set((s) => {
        const existing = s.records.find(r => r.userId === userId && r.date === date)
        if (existing) {
          // Never overwrite an earlier clock-in; the first one of the day stands.
          if (existing.checkIn && existing.checkIn !== '-') return s
          return { records: s.records.map(r => r === existing ? { ...r, checkIn: time, status } : r) }
        }
        return { records: [...s.records, { id: _id++, userId, name, date, checkIn: time, checkOut: '-', status }] }
      }),

    clockOut: (userId, time, { date = todayStr() } = {}) =>
      set((s) => ({
        records: s.records.map(r =>
          r.userId === userId && r.date === date ? { ...r, checkOut: time } : r,
        ),
      })),
  }),
  { name: 'hcm-attendance-v1', storage: createJSONStorage(() => dbStorage) }
))
