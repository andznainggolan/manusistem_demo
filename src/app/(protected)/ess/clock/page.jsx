'use client'
import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useShiftStore } from '@/store/shiftStore'
import { useAttendanceStore, todayStr } from '@/store/attendanceStore'
import { useT } from '@/store/languageStore'
import {
  PageHeader, SectionCard, DataTable, Tr, Td, ActionButton, StatusBadge, EmptyState,
} from '@/components/ui'
import { shiftFor, gradeTime, TONE_CLASS, toneLabel, GRACE_MINUTES } from '@/lib/workSchedule'
import { useTimeSettingsStore } from '@/store/timeSettingsStore'
import { evaluateRecord, KIND_LABEL, STATE_LABEL, STATUS_LABEL_ID, STATUS_TONE_ID } from '@/lib/attendanceRules'
import { useGeofenceStore } from '@/store/geofenceStore'
import { checkClockLocation } from '@/lib/geofence'
import GeoTag from '@/components/attendance/GeoTag'

const nowHHMM = () => {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** A clock time coloured by how far it sits from the schedule. */
function ClockValue({ time, scheduled, kind, size = 'text-3xl', t }) {
  if (!time || time === '-') return <span className={`${size} font-bold font-mono text-gray-300`}>--:--</span>
  const { deviation, tone } = gradeTime(time, scheduled, kind)
  return (
    <span className='inline-flex flex-col items-center'>
      <span className={`${size} font-bold font-mono ${TONE_CLASS[tone]}`}>{time}</span>
      {tone !== 'none' && (
        <span className={`text-[11px] font-semibold ${TONE_CLASS[tone]}`}>
          {toneLabel(tone, kind, deviation, t)}
        </span>
      )}
    </span>
  )
}

export default function ClockInOutPage() {
  const t = useT()
  const { currentUser } = useAuthStore()
  const { assignments, schedules, patterns, shifts } = useShiftStore()
  const { records, clockIn, clockOut } = useAttendanceStore()
  const { settings: rules, approvals, saveReason } = useTimeSettingsStore()
  const [reasonFor, setReasonFor] = useState(null) // { date, kind, text }
  const geofence = useGeofenceStore(s => s.settings)
  const geoLocations = useGeofenceStore(s => s.locations)
  const [busy, setBusy] = useState(false)
  const [geoMsg, setGeoMsg] = useState(null) // { type: 'error' | 'warn', text }

  const [now, setNow] = useState(null)   // null until mounted — the server has
  useEffect(() => {                      // no clock, so rendering one would
    setNow(new Date())                   // mismatch on hydration
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const uid = currentUser?.id
  const date = todayStr()
  const sched = uid ? shiftFor(uid, date, { assignments, schedules, patterns, shifts }) : null
  const today = records.find(r => r.userId === uid && r.date === date) || null

  const hasIn = today?.checkIn && today.checkIn !== '-'
  const hasOut = today?.checkOut && today.checkOut !== '-'

  // The location is checked first (when geofencing is on); the time is taken
  // after it resolves so a slow GPS fix doesn't skew the recorded minute.
  const withLocation = async (action) => {
    setBusy(true); setGeoMsg(null)
    try {
      const chk = await checkClockLocation()
      if (!chk.ok) { setGeoMsg({ type: 'error', text: chk.message }); return }
      if (chk.message) setGeoMsg({ type: 'warn', text: chk.message })
      action(chk.geo)
    } finally { setBusy(false) }
  }

  const doClockIn = () => withLocation((geo) => {
    const time = nowHHMM()
    const late = sched ? gradeTime(time, sched.shift.startTime, 'in').tone !== 'ok' : false
    clockIn(uid, currentUser?.name || '', time, { date, status: late ? 'Late' : 'Present', geo })
  })
  const doClockOut = () => withLocation((geo) => clockOut(uid, nowHHMM(), { date, geo }))

  const mine = records
    .filter(r => r.userId === uid)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 14)

  const dateLabel = now
    ? now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : ''

  return (
    <div>
      <PageHeader
        icon='⏱️'
        title='Clock In/Out'
        subtitle={t(
          'Catat jam masuk dan pulang kamu secara online.',
          'Record your start and end of day online.',
        )}
      />

      <SectionCard className='mb-6'>
        <div className='flex flex-col items-center gap-1 py-2'>
          <p className='text-sm text-gray-400'>{dateLabel}</p>
          <p className='text-5xl font-bold font-mono tracking-tight text-gray-900'>
            {now ? now.toLocaleTimeString('id-ID', { hour12: false }) : '--:--:--'}
          </p>
          {sched ? (
            <p className='mt-1 text-sm text-gray-500'>
              {t('Jadwal', 'Schedule')}: <span className='font-semibold text-gray-700'>{sched.shift.name}</span>
              {' · '}{sched.shift.startTime}–{sched.shift.endTime}
              <span className='text-gray-400'> ({sched.scheduleName})</span>
            </p>
          ) : (
            <p className='mt-1 text-sm text-amber-600'>
              {t('Tidak ada jadwal kerja hari ini — jam kamu tidak dinilai terlambat/pulang cepat.',
                 'No work schedule today — your times are not graded.')}
            </p>
          )}
        </div>

        <div className='mt-4 grid grid-cols-2 divide-x divide-gray-100 border-t border-gray-100 pt-5'>
          <div className='flex flex-col items-center gap-3 px-4'>
            <span className='text-xs font-semibold uppercase tracking-wide text-gray-400'>
              {t('Jam Masuk', 'Clock In')}
            </span>
            <ClockValue time={today?.checkIn} scheduled={sched?.shift.startTime} kind='in' t={t} />
            <ActionButton onClick={doClockIn} disabled={!!hasIn || !uid || busy} icon='🟢'>
              {hasIn ? t('Sudah Clock In', 'Clocked In') : busy ? t('Memeriksa lokasi...', 'Checking location...') : 'Clock In'}
            </ActionButton>
          </div>
          <div className='flex flex-col items-center gap-3 px-4'>
            <span className='text-xs font-semibold uppercase tracking-wide text-gray-400'>
              {t('Jam Pulang', 'Clock Out')}
            </span>
            <ClockValue time={today?.checkOut} scheduled={sched?.shift.endTime} kind='out' t={t} />
            <ActionButton
              variant='secondary'
              onClick={doClockOut}
              disabled={!hasIn || !!hasOut || busy}
              icon='🔴'>
              {hasOut ? t('Sudah Clock Out', 'Clocked Out') : busy ? t('Memeriksa lokasi...', 'Checking location...') : 'Clock Out'}
            </ActionButton>
          </div>
        </div>

        {geofence.enabled && (
          <p className='mt-4 rounded-lg bg-sky-50 px-3 py-2 text-center text-xs text-sky-800'>
            📍 {geofence.mode === 'block'
              ? t('Geofencing aktif: clock in/out hanya bisa di dalam radius lokasi kerja.', 'Geofencing on: you can only clock in/out inside a work location radius.')
              : t('Geofencing aktif: lokasi kamu dicatat saat clock in/out.', 'Geofencing on: your location is recorded when you clock in/out.')}
            {geoLocations.length > 0 && <span className='text-sky-600'> ({geoLocations.map(l => `${l.name} ${l.radius} m`).join(', ')})</span>}
          </p>
        )}
        {geoMsg && (
          <p className={`mt-3 rounded-lg px-3 py-2 text-center text-xs font-medium ${geoMsg.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-800'}`}>
            {geoMsg.text}
          </p>
        )}

        <p className='mt-5 border-t border-gray-100 pt-3 text-center text-xs text-gray-400'>
          <span className='font-semibold text-emerald-600'>{t('Hijau', 'Green')}</span> {t('tepat waktu', 'on time')}
          {' · '}
          <span className='font-semibold text-amber-600'>{t('Kuning', 'Amber')}</span>{' '}
          {t(`telat/pulang cepat < ${GRACE_MINUTES} menit`, `< ${GRACE_MINUTES} min late/early`)}
          {' · '}
          <span className='font-semibold text-red-600'>{t('Merah', 'Red')}</span>{' '}
          {t(`≥ ${GRACE_MINUTES} menit`, `≥ ${GRACE_MINUTES} min`)}
          {(rules.lateToleranceMinutes > 0 || rules.earlyOutToleranceMinutes > 0) && (
            <>
              {' · '}
              {t(`Toleransi masuk ${rules.lateToleranceMinutes} menit, pulang ${rules.earlyOutToleranceMinutes} menit tetap hijau`,
                 `Tolerance ${rules.lateToleranceMinutes} min in, ${rules.earlyOutToleranceMinutes} min out stays green`)}
            </>
          )}
        </p>
        {rules.requireApproval && (
          <p className='mt-2 rounded-lg bg-amber-50 px-3 py-2 text-center text-xs text-amber-800'>
            Terlambat atau pulang cepat perlu approval atasan. Bila ditolak atau tidak disetujui dalam {rules.approvalDeadlineDays} hari, dihitung Alpa.
          </p>
        )}
      </SectionCard>

      <SectionCard
        icon='📋'
        title={t('Riwayat 14 Hari Terakhir', 'Last 14 Days')}
        subtitle={t('Warna mengikuti jadwal kerja pada tanggal tersebut.', 'Colours follow the schedule for that date.')}
        bodyClass='p-0'
      >
        {mine.length === 0 ? (
          <EmptyState icon='⏱️' title={t('Belum ada catatan', 'No records yet')}
            description={t('Clock In pertama kamu akan muncul di sini.', 'Your first clock-in will show up here.')} />
        ) : (
          <DataTable columns={[
            { label: t('Tanggal', 'Date') },
            { label: t('Jadwal', 'Schedule') },
            { label: t('Masuk', 'In'), align: 'center' },
            { label: t('Pulang', 'Out'), align: 'center' },
            { label: 'Status', align: 'center' },
          ]}>
            {mine.map(r => {
              const s = shiftFor(uid, r.date, { assignments, schedules, patterns, shifts })
              const gin = gradeTime(r.checkIn, s?.shift.startTime, 'in')
              const gout = gradeTime(r.checkOut, s?.shift.endTime, 'out')
              const ev = evaluateRecord(r, s, rules, approvals)
              return (
                <Tr key={r.id}>
                  <Td className='tabular-nums'>{r.date}</Td>
                  <Td className='text-xs text-gray-500'>
                    {s ? `${s.shift.name} · ${s.shift.startTime}–${s.shift.endTime}` : t('Libur', 'Day off')}
                  </Td>
                  <Td align='center' className={`font-mono font-semibold tabular-nums ${TONE_CLASS[gin.tone]}`}>
                    {r.checkIn || '-'}
                    <GeoTag geo={r.inGeo} />
                  </Td>
                  <Td align='center' className={`font-mono font-semibold tabular-nums ${TONE_CLASS[gout.tone]}`}>
                    {r.checkOut || '-'}
                    <GeoTag geo={r.outGeo} />
                  </Td>
                  <Td align='center'>
                    <StatusBadge tone={rules.requireApproval ? STATUS_TONE_ID[ev.status] || 'neutral' : (r.status === 'Present' ? 'success' : r.status === 'Late' ? 'warning' : 'danger')}>
                      {rules.requireApproval ? (STATUS_LABEL_ID[ev.status] || ev.status) : r.status}
                    </StatusBadge>
                    {rules.requireApproval && ev.items.map(it => (
                      <div key={it.kind} className='mt-1 text-[11px] text-gray-500'>
                        {KIND_LABEL[it.kind]}: <span className='font-semibold'>{STATE_LABEL[it.state]}</span>
                        {it.state === 'Pending' && (
                          <button onClick={() => setReasonFor({ date: r.date, kind: it.kind, text: it.approval?.reason || '' })}
                            className='ml-2 font-semibold text-teal-700 hover:underline'>{it.approval?.reason ? 'Ubah alasan' : 'Tulis alasan'}</button>
                        )}
                        {it.approval?.note ? <span className='ml-1 text-gray-400'>({it.approval.note})</span> : null}
                      </div>
                    ))}
                  </Td>
                </Tr>
              )
            })}
          </DataTable>
        )}
      </SectionCard>

      {reasonFor && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4' onClick={() => setReasonFor(null)}>
          <div className='w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl' onClick={e => e.stopPropagation()}>
            <h3 className='text-base font-bold text-gray-800'>Alasan {KIND_LABEL[reasonFor.kind].toLowerCase()}</h3>
            <p className='mb-3 text-xs text-gray-400'>{reasonFor.date}. Alasan dilihat atasan saat memutuskan approval.</p>
            <textarea rows={3} value={reasonFor.text} onChange={e => setReasonFor({ ...reasonFor, text: e.target.value })}
              className='w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-100' />
            <div className='mt-4 flex gap-2'>
              <ActionButton variant='secondary' className='flex-1' onClick={() => setReasonFor(null)}>Batal</ActionButton>
              <ActionButton className='flex-1' onClick={() => { saveReason(uid, reasonFor.date, reasonFor.kind, reasonFor.text.trim()); setReasonFor(null) }}>Simpan</ActionButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
