import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { dbStorage } from '@/lib/dbStorage'
import { localDateStr } from '@/lib/workSchedule'
import { IS_SCHOOL } from '@/lib/demoProfile'
import { SCHOOL_EMPLOYEES, SCHOOL_WORKER_CATEGORIES, SCHOOL_TEACHING_BLOCKS, SCHOOL_JLA_TASKS } from '@/data/schoolSeed'

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

const DAY_KEYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
// First and last clock time of a teacher's JLA plan on a weekday, or null when the teacher has no plan that day.
const planSpan = (empId, day) => {
  const items = [...SCHOOL_TEACHING_BLOCKS, ...SCHOOL_JLA_TASKS].filter(x => x.employeeId === empId && x.day === day)
  if (!items.length) return null
  return [items.map(x => x.start).sort()[0], items.map(x => x.end).sort().slice(-1)[0]]
}

// Generate seed attendance for the last 14 days (60 in the school demo)
const genRecords = () => {
  const employees = IS_SCHOOL
    ? [
        ...SCHOOL_EMPLOYEES.filter(e => SCHOOL_WORKER_CATEGORIES[e.id] === 'Guru' || [9, 7, 29].includes(e.id)).map(e => ({ id: e.id, name: e.name })),
      ]
    : [
        { id: 1, name: 'Budi Santoso' },
        { id: 2, name: 'Dewi Rahayu' },
        { id: 5, name: 'Sari Indah' },
      ]
  const records = []
  let _id = 1
  // School demo goes back ~2 months so the monthly JLA realisation report has evidence to compare with.
  for (let i = IS_SCHOOL ? 60 : 13; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dow = d.getDay()
    if (dow === 0 || dow === 6) continue
    const ds = fmt(d)
    employees.forEach(emp => {
      if (IS_SCHOOL) {
        // Times follow each employee's real school shift; every sixth day is a late arrival
        // so the approval flow has something to show. Deterministic, not random.
        let [start, end] = SCHOOL_HOURS[emp.id] || ['07:00', '15:00']
        if (SCHOOL_WORKER_CATEGORIES[emp.id] === 'Guru') {
          // Teachers clock in before their first lesson and out after their last plan item, never before the shift ends.
          const span = planSpan(emp.id, DAY_KEYS[dow])
          if (!span) return
          start = span[0] < '07:00' ? span[0] : '07:00'
          end = span[1] > '15:00' ? span[1] : '15:00'
        }
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

let _id = 10000

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

    // geo = result of the geofence check ({ lat, lng, inside, distance, ... }), kept per record.
    clockIn: (userId, name, time, { date = todayStr(), status = 'Present', geo = null } = {}) =>
      set((s) => {
        const existing = s.records.find(r => r.userId === userId && r.date === date)
        if (existing) {
          // Never overwrite an earlier clock-in; the first one of the day stands.
          if (existing.checkIn && existing.checkIn !== '-') return s
          return { records: s.records.map(r => r === existing ? { ...r, checkIn: time, status, ...(geo ? { inGeo: geo } : {}) } : r) }
        }
        return { records: [...s.records, { id: _id++, userId, name, date, checkIn: time, checkOut: '-', status, ...(geo ? { inGeo: geo } : {}) }] }
      }),

    clockOut: (userId, time, { date = todayStr(), geo = null } = {}) =>
      set((s) => ({
        records: s.records.map(r =>
          r.userId === userId && r.date === date ? { ...r, checkOut: time, ...(geo ? { outGeo: geo } : {}) } : r,
        ),
      })),
  }),
  {
    name: IS_SCHOOL ? 'hcm-attendance-school-v2' : 'hcm-attendance-v1',
    storage: createJSONStorage(() => dbStorage),
    // School demo: the seed is dated relative to the day it was first loaded, so
    // later days would have no attendance. Top up missing past days from the seed
    // (never today, and never over an existing record).
    merge: (persisted, current) => {
      const merged = { ...current, ...persisted }
      if (!IS_SCHOOL || !persisted?.records) return merged
      const have = new Set(persisted.records.map(r => `${r.userId}|${r.date}`))
      const todayS = fmt(new Date())
      let nid = persisted.records.reduce((m, r) => Math.max(m, Number(r.id) || 0), 0) + 1
      const extra = current.records.filter(r => r.date < todayS && !have.has(`${r.userId}|${r.date}`)).map(r => ({ ...r, id: nid++ }))
      merged.records = [...persisted.records, ...extra]
      return merged
    },
  }
))
