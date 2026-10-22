import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { dbStorage } from '@/lib/dbStorage'
import { localDateStr } from '@/lib/workSchedule'
import { IS_SCHOOL } from '@/lib/demoProfile'

const today = new Date()
// Local calendar date, not toISOString() — that converts to UTC first, which
// silently rolls WIB (UTC+7) dates back a day for roughly the first 7 hours
// of every day.
const fmt = localDateStr

const SCHOOL_HOURS = { 15: ['07:00', '15:00'], 9: ['07:00', '15:00'], 7: ['07:00', '15:00'], 29: ['07:30', '16:00'] }
const shiftTime = (hhmm, deltaMin) => {
  const [h, m] = hhmm.split(':').map(Number)
  const total = h * 60 + m + deltaMin
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

// Generate seed attendance for last 14 days
const genRecords = () => {
  const employees = IS_SCHOOL
    ? [{ id: 15, name: 'Yohanes Aditya' }, { id: 9, name: 'Margareta Widya' }, { id: 7, name: 'Elisabeth Kartika' }, { id: 29, name: 'Rudi Hartanto' }]
    : [
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
      if (IS_SCHOOL) {
        // Times follow each employee's real school shift; every sixth day is a late arrival
        // so the approval flow has something to show. Deterministic, not random.
        const [start, end] = SCHOOL_HOURS[emp.id] || ['07:00', '15:00']
        const late = (emp.id + i) % 6 === 0
        records.push({
          id: _id++, userId: emp.id, name: emp.name, date: ds,
          checkIn: shiftTime(start, late ? 25 : -5), checkOut: shiftTime(end, 5),
          status: late ? 'Late' : 'Present',
        })
        return
      }
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

export const todayStr = () => localDateStr(new Date())

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
  { name: IS_SCHOOL ? 'hcm-attendance-school-v1' : 'hcm-attendance-v1', storage: createJSONStorage(() => dbStorage) }
))
