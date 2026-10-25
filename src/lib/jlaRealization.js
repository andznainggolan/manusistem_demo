// JLA realisation: the weekly plan (teaching blocks + tasks) is compared with
// what actually happened on each date. Evidence comes from attendance
// (clock in/out); the teacher confirms each item; a supervisor only validates
// confirmations that claim more than the attendance covers.
import { toMin, durationHours } from '@/lib/jla'
import { localDateStr } from '@/lib/workSchedule'

const DAY_KEYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
export const dayKeyOf = (date) => DAY_KEYS[new Date(`${date}T00:00:00`).getDay()]

export const itemKey = (kind, id) => `${kind}${id}`            // 'b12' teaching block, 't5' task
export const recKey = (empId, date, key) => `${empId}|${date}|${key}`

const hasTime = (v) => !!v && v !== '-'
const SLACK_MIN = 10          // clock in/out are rounded to the minute and people walk to class
const FLAG_HOURS = 10 / 60    // a confirmation may exceed attendance by this much before it is flagged

export const STATUS_LABEL = { Done: 'Terlaksana', Partial: 'Sebagian', Missed: 'Tidak terlaksana' }
export const SOURCE_LABEL = {
  konfirmasi: 'Konfirmasi guru',
  absensi: 'Mengikuti absensi',
  menunggu: 'Menunggu validasi (sementara absensi)',
  ditolak: 'Validasi ditolak (absensi)',
}

export const mondayOf = (date) => {
  const d = new Date(`${date}T00:00:00`)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return localDateStr(d)
}
export const addDays = (date, n) => {
  const d = new Date(`${date}T00:00:00`)
  d.setDate(d.getDate() + n)
  return localDateStr(d)
}
/** Monday..Friday dates of the week that starts on `monday`. */
export const weekDates = (monday) => [0, 1, 2, 3, 4].map(n => addDays(monday, n))
export const weekKey = (empId, monday) => `${empId}|${monday}`

/**
 * The plan that applies to a teacher in the week starting `monday`:
 * a week-specific plan when one was saved, otherwise the default weekly pattern.
 * `weeks` is the week store's map. Returns { blocks, tasks, override }.
 */
export function planForWeek(empId, monday, blocks, tasks, weeks = {}) {
  const ov = weeks[weekKey(empId, monday)]
  if (ov) return { blocks: ov.blocks, tasks: ov.tasks, override: true }
  // The planning view shows the whole default pattern for any week. (Realisation, in
  // occurrencesFor, only counts a default task from the day it was created.)
  return {
    blocks: blocks.filter(b => b.employeeId === empId),
    tasks: tasks.filter(t => t.employeeId === empId),
    override: false,
  }
}

/** The week to open by default: this week, or the coming one on Saturday and Sunday. */
export const activeMonday = (today) => {
  const dow = new Date(`${today}T00:00:00`).getDay()
  const m = mondayOf(today)
  return dow === 0 || dow === 6 ? addDays(m, 7) : m
}

/** Plan items of one teacher on one date, in time order. */
export function occurrencesFor(empId, date, blocks, tasks, typeName = () => 'Task', weeks = {}) {
  const day = dayKeyOf(date)
  const ov = weeks[weekKey(empId, mondayOf(date))]
  if (ov) { blocks = ov.blocks; tasks = ov.tasks }   // a week-specific plan replaces the default pattern
  const items = []
  blocks.filter(b => b.employeeId === empId && b.day === day).forEach(b => items.push({
    key: itemKey('b', b.id), kind: 'block', id: b.id, start: b.start, end: b.end, label: b.label,
    teaching: true, hours: durationHours(b.start, b.end),
  }))
  tasks.filter(t => t.employeeId === empId && t.day === day && (ov || !t.createdAt || date >= String(t.createdAt).slice(0, 10))).forEach(t => items.push({
    key: itemKey('t', t.id), kind: 'task', id: t.id, start: t.start, end: t.end,
    label: t.teaching && t.subject ? t.subject : typeName(t.taskTypeId), teaching: !!t.teaching,
    hours: durationHours(t.start, t.end),
  }))
  return items.sort((a, b) => toMin(a.start) - toMin(b.start))
}

/** Hours of an item that fall inside the clocked-in span of the day. */
export function evidenceHours(item, att, date, now = new Date()) {
  if (!att || !hasTime(att.checkIn)) return 0
  const inM = toMin(att.checkIn) - SLACK_MIN
  const outM = hasTime(att.checkOut)
    ? toMin(att.checkOut) + SLACK_MIN
    : date === localDateStr(now) ? now.getHours() * 60 + now.getMinutes() : toMin(item.end) // forgot to clock out on a past day: not held against them
  return Math.max(0, Math.min(toMin(item.end), outM) - Math.max(toMin(item.start), inM)) / 60
}

/**
 * Realised hours of one item.
 * No confirmation -> follows attendance. Confirmed -> the confirmed hours, unless they
 * exceed attendance evidence: then they only count once the supervisor approves.
 */
export function evaluateItem(item, rec, att, date, now = new Date()) {
  const planned = item.hours
  const evidence = Math.min(planned, evidenceHours(item, att, date, now))
  const confirmed = rec ? (rec.status === 'Done' ? planned : rec.status === 'Partial' ? Math.min(planned, Number(rec.hours) || 0) : 0) : null
  const flagged = rec != null && confirmed > evidence + FLAG_HOURS
  let realized, source
  if (!rec) { realized = evidence; source = 'absensi' }
  else if (flagged && rec.validation !== 'Approved') {
    realized = evidence
    source = rec.validation === 'Rejected' ? 'ditolak' : 'menunggu'
  } else { realized = confirmed; source = 'konfirmasi' }
  const needsValidation = flagged && !rec.validation
  return { planned, evidence, confirmed, flagged, needsValidation, realized, source, status: rec?.status || null, validation: rec?.validation || null }
}

/** Weekdays 'YYYY-MM-DD' from `from` to `to` inclusive (both date strings). */
export function weekdaysBetween(from, to) {
  const out = []
  const d = new Date(`${from}T00:00:00`)
  const end = new Date(`${to}T00:00:00`)
  while (d <= end) {
    const dow = d.getDay()
    if (dow !== 0 && dow !== 6) out.push(localDateStr(d))
    d.setDate(d.getDate() + 1)
  }
  return out
}

/**
 * Plan vs realisation for one teacher over some dates. Only items that have already
 * ended count; days of approved leave are excused.
 * ctx = { blocks, tasks, weeks, attendance, recs, typeName, now }
 */
export function summarize(empId, dates, ctx) {
  const now = ctx.now || new Date()
  const today = localDateStr(now)
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const out = { planned: 0, realized: 0, items: 0, unconfirmed: 0, pendingValidation: 0, rows: [] }
  dates.forEach(date => {
    if (date > today) return
    const att = ctx.attendance.find(r => r.userId === empId && r.date === date) || null
    if (att?.status === 'Leave') return
    occurrencesFor(empId, date, ctx.blocks, ctx.tasks, ctx.typeName, ctx.weeks).forEach(item => {
      if (date === today && toMin(item.end) > nowMin) return
      const rec = ctx.recs[recKey(empId, date, item.key)] || null
      const ev = evaluateItem(item, rec, att, date, now)
      out.planned += ev.planned; out.realized += ev.realized; out.items += 1
      if (!rec) out.unconfirmed += 1
      if (ev.needsValidation) out.pendingValidation += 1
      out.rows.push({ date, item, rec, att, ...ev })
    })
  })
  out.gap = Math.max(0, out.planned - out.realized)
  out.pct = out.planned > 0 ? Math.round((out.realized / out.planned) * 100) : null
  return out
}

/** Period presets used by the report, relative to `now`. */
export function periodRange(kind, now = new Date()) {
  const d = new Date(now); d.setHours(0, 0, 0, 0)
  const monday = (x) => { const m = new Date(x); m.setDate(m.getDate() - ((m.getDay() + 6) % 7)); return m }
  if (kind === 'week') { const m = monday(d); const f = new Date(m); f.setDate(f.getDate() + 4); return { from: localDateStr(m), to: localDateStr(f) } }
  if (kind === 'lastweek') { const m = monday(d); m.setDate(m.getDate() - 7); const f = new Date(m); f.setDate(f.getDate() + 4); return { from: localDateStr(m), to: localDateStr(f) } }
  if (kind === 'month') return { from: localDateStr(new Date(d.getFullYear(), d.getMonth(), 1)), to: localDateStr(new Date(d.getFullYear(), d.getMonth() + 1, 0)) }
  return { from: localDateStr(new Date(d.getFullYear(), d.getMonth() - 1, 1)), to: localDateStr(new Date(d.getFullYear(), d.getMonth(), 0)) } // lastmonth
}

/** 'YYYY-MM' -> { from, to } of that month. */
export function monthRange(period) {
  const [y, m] = period.split('-').map(Number)
  return { from: localDateStr(new Date(y, m - 1, 1)), to: localDateStr(new Date(y, m, 0)) }
}
