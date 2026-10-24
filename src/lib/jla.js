// Pure helpers for Job Load Analysis (JLA): weekly hours = fixed teaching
// blocks + tasks added by the principal, compared against the weekly target.

export const DAYS = [
  { key: 'Monday',    label: 'Senin' },
  { key: 'Tuesday',   label: 'Selasa' },
  { key: 'Wednesday', label: 'Rabu' },
  { key: 'Thursday',  label: 'Kamis' },
  { key: 'Friday',    label: 'Jumat' },
]

export const toMin = (hhmm) => {
  const [h, m] = String(hhmm || '0:0').split(':').map(Number)
  return h * 60 + (m || 0)
}
export const toHHMM = (min) =>
  `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`

export const durationHours = (start, end) => Math.max(0, (toMin(end) - toMin(start)) / 60)

export const fmtHours = (h) => {
  const v = Math.round((h || 0) * 10) / 10
  return Number.isInteger(v) ? String(v) : v.toFixed(1).replace('.', ',')
}

const sumHours = (list) => list.reduce((s, x) => s + durationHours(x.start, x.end), 0)

// A task flagged `teaching` (a teacher covering another subject) counts as
// teaching hours, not as an extra task.
export function weekSummary(employeeId, blocks, tasks, targetHours = 40) {
  const mine = tasks.filter(t => t.employeeId === employeeId)
  const teaching = sumHours(blocks.filter(b => b.employeeId === employeeId)) + sumHours(mine.filter(t => t.teaching))
  const task = sumHours(mine.filter(t => !t.teaching))
  const total = teaching + task
  const gap = Math.max(0, targetHours - total)
  return { teaching, task, total, gap, target: targetHours, achieved: total >= targetHours }
}

const overlaps = (aStart, aEnd, bStart, bEnd) => toMin(aStart) < toMin(bEnd) && toMin(bStart) < toMin(aEnd)

// Returns the first thing a candidate slot collides with, or null.
export function findConflict(employeeId, day, start, end, blocks, tasks, ignoreTaskId = null) {
  const block = blocks.find(b => b.employeeId === employeeId && b.day === day && overlaps(start, end, b.start, b.end))
  if (block) return { kind: 'mengajar', label: block.label, start: block.start, end: block.end }
  const task = tasks.find(t => t.employeeId === employeeId && t.day === day && t.id !== ignoreTaskId && overlaps(start, end, t.start, t.end))
  if (task) return { kind: 'task', label: 'task lain', start: task.start, end: task.end }
  return null
}

// True when the teacher has nothing on any of the given days in that time range.
export function isFreeOn(employeeId, days, start, end, blocks, tasks) {
  return days.every(day => !findConflict(employeeId, day, start, end, blocks, tasks))
}

// Hours inside the working window that are still unassigned in a week.
export function freeHoursInWindow(employeeId, blocks, tasks, windowStart, windowEnd) {
  const ws = toMin(windowStart), we = toMin(windowEnd)
  let free = 0
  DAYS.forEach(({ key }) => {
    const busy = [...blocks, ...tasks]
      .filter(x => x.employeeId === employeeId && x.day === key)
      .map(x => [Math.max(ws, toMin(x.start)), Math.min(we, toMin(x.end))])
      .filter(([a, b]) => b > a)
      .sort((a, b) => a[0] - b[0])
    let cursor = ws
    busy.forEach(([a, b]) => { if (a > cursor) free += a - cursor; cursor = Math.max(cursor, b) })
    if (cursor < we) free += we - cursor
  })
  return free / 60
}
