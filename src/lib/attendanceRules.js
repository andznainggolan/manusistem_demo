import { gradeTime, localDateStr } from '@/lib/workSchedule'
import { approvalKey } from '@/store/timeSettingsStore'

export const hasTime = (v) => !!v && v !== '-'

// Late clock-ins / early clock-outs that exceed the configured tolerance.
export function exceptionsOf(record, sched) {
  if (!sched || !record) return []
  const out = []
  if (hasTime(record.checkIn)) {
    const g = gradeTime(record.checkIn, sched.shift.startTime, 'in')
    if (g.tone !== 'ok') out.push({ kind: 'in', deviation: g.deviation, tone: g.tone, scheduled: sched.shift.startTime, actual: record.checkIn })
  }
  if (hasTime(record.checkOut)) {
    const g = gradeTime(record.checkOut, sched.shift.endTime, 'out')
    if (g.tone !== 'ok') out.push({ kind: 'out', deviation: g.deviation, tone: g.tone, scheduled: sched.shift.endTime, actual: record.checkOut })
  }
  return out
}

const daysBetween = (from, to) => Math.floor((new Date(to) - new Date(from)) / 86400000)

export const KIND_LABEL = { in: 'Terlambat', out: 'Pulang cepat' }

/**
 * Final status of an attendance record under the current rules.
 * Without the approval rule the stored status is kept. With it, each late-in /
 * early-out needs approval: rejected, or left undecided past the deadline,
 * counts as Absent (Alpa); undecided within the deadline is 'Pending'.
 */
export function evaluateRecord(record, sched, settings, approvals, today = localDateStr(new Date())) {
  const exceptions = exceptionsOf(record, sched)
  const base = { status: record.status, exceptions, items: [] }
  if (!settings.requireApproval || record.status === 'Leave' || record.status === 'Absent' || exceptions.length === 0) return base

  const items = exceptions.map(ex => {
    const approval = approvals[approvalKey(record.userId, record.date, ex.kind)] || null
    let state = approval?.status || 'Pending'
    if (state === 'Pending' && daysBetween(record.date, today) > settings.approvalDeadlineDays) state = 'Expired'
    return { ...ex, state, approval }
  })
  const status = items.some(i => i.state === 'Rejected' || i.state === 'Expired') ? 'Absent'
    : items.some(i => i.state === 'Pending') ? 'Pending'
    : 'Late'
  return { ...base, status, items }
}

export const STATE_LABEL = { Pending: 'Menunggu approval', Approved: 'Disetujui', Rejected: 'Ditolak', Expired: 'Lewat batas (Alpa)' }
export const STATE_TONE = { Pending: 'warning', Approved: 'success', Rejected: 'danger', Expired: 'danger' }
export const STATUS_LABEL_ID = { Present: 'Hadir', Late: 'Terlambat', Pending: 'Menunggu approval', Absent: 'Alpa', Leave: 'Cuti' }
export const STATUS_TONE_ID = { Present: 'success', Late: 'warning', Pending: 'warning', Absent: 'danger', Leave: 'info' }
