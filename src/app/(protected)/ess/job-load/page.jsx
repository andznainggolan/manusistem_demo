'use client'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useJlaStore } from '@/store/jlaStore'
import { useJlaRealStore } from '@/store/jlaRealStore'
import { useJlaWeekStore } from '@/store/jlaWeekStore'
import { useAttendanceStore } from '@/store/attendanceStore'
import { fmtHours, weekSummary, toMin } from '@/lib/jla'
import { localDateStr } from '@/lib/workSchedule'
import { occurrencesFor, evaluateItem, summarize, periodRange, weekdaysBetween, recKey, mondayOf, weekDates, planForWeek, STATUS_LABEL, SOURCE_LABEL } from '@/lib/jlaRealization'
import WeekGrid from '@/components/jla/WeekGrid'
import { PageHeader, StatCard, SectionCard, EmptyState, StatusBadge, ActionButton, FormField, Input } from '@/components/ui'

const dateLabel = (d, today) => new Date(`${d}T00:00:00`).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' }) + (d === today ? ' (hari ini)' : '')
const STATUS_TONE = { Done: 'success', Partial: 'warning', Missed: 'danger' }

export default function MyJobLoadPage() {
  const { currentUser } = useAuthStore()
  const { settings, taskTypes, categories, teachingBlocks, tasks } = useJlaStore()
  const { records: recs, confirm } = useJlaRealStore()
  const attendance = useAttendanceStore(s => s.records)
  const weeks = useJlaWeekStore(s => s.weeks)
  const uid = currentUser?.id
  const isGuru = categories[uid] === 'Guru'

  const [now, setNow] = useState(null)        // null on the server: the clock only exists in the browser
  useEffect(() => { setNow(new Date()) }, [])
  const today = now ? localDateStr(now) : null
  const nowMin = now ? now.getHours() * 60 + now.getMinutes() : 0
  const typeName = (id) => taskTypes.find(t => t.id === id)?.name || 'Task'

  const windowDays = settings.confirmWindowDays || 7
  const dateOptions = []
  if (now) {
    for (let i = 0; i < windowDays; i++) {
      const d = new Date(now); d.setDate(d.getDate() - i)
      if (d.getDay() !== 0 && d.getDay() !== 6) dateOptions.push(localDateStr(d))
    }
  }
  const [picked, setPicked] = useState(null)
  const date = picked || dateOptions[0] || null
  const [modal, setModal] = useState(null) // { item, status, hours, reason, error }

  const att = date ? attendance.find(r => r.userId === uid && r.date === date) || null : null
  const onLeave = att?.status === 'Leave'
  const items = date && !onLeave ? occurrencesFor(uid, date, teachingBlocks, tasks, typeName, weeks) : []
  const ended = (item) => date !== today || toMin(item.end) <= nowMin

  const ctx = { blocks: teachingBlocks, tasks, weeks, attendance, recs, typeName, now: now || new Date() }
  // This week's plan: a week-specific one if the supervisor adjusted it, otherwise the default pattern.
  const monday = today ? mondayOf(today) : null
  const plan = monday ? planForWeek(uid, monday, teachingBlocks, tasks, weeks) : { blocks: [], tasks: [], override: false }
  const sum = weekSummary(uid, plan.blocks, plan.tasks, settings.targetHours)
  const weekRange = periodRange('week', now || new Date())
  const weekReal = now ? summarize(uid, weekdaysBetween(weekRange.from, weekRange.to), ctx) : null

  const confirmDone = (item) => confirm(uid, date, item.key, { status: 'Done' })
  const confirmAllDone = () => items.filter(i => ended(i) && !recs[recKey(uid, date, i.key)]).forEach(confirmDone)
  const openModal = (item, status) => {
    const cur = recs[recKey(uid, date, item.key)]
    setModal({ item, status, hours: status === 'Partial' ? String(cur?.status === 'Partial' ? cur.hours : item.hours / 2) : '0', reason: cur?.reason || '', error: '' })
  }
  const saveModal = () => {
    const { item, status, hours, reason } = modal
    const h = Number(hours)
    if (status === 'Partial' && !(h > 0 && h < item.hours)) return setModal({ ...modal, error: `Jam terlaksana harus antara 0 dan ${fmtHours(item.hours)}.` })
    if (!reason.trim()) return setModal({ ...modal, error: 'Isi alasan (mis. sakit, kegiatan sekolah, kelas dipindah).' })
    confirm(uid, date, item.key, { status, hours: status === 'Partial' ? h : 0, reason: reason.trim() })
    setModal(null)
  }

  return (
    <div>
      <PageHeader
        icon='🗓️'
        title='Jadwal dan Beban Kerja'
        subtitle='Jam mengajar tetap dan task tambahan dari atasan dalam satu minggu, serta konfirmasi realisasinya.'
      />
      {!isGuru ? (
        <SectionCard title='Beban kerja' icon='🗓️'>
          <EmptyState icon='🗓️' title='Halaman ini untuk pekerja kategori Guru.' description='Jam kerja karyawan non-guru mengikuti jadwal kerja di Clock In/Out.' />
        </SectionCard>
      ) : (
        <>
          <div className='mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4'>
            <StatCard tone='brand' icon='📚' label='Jam mengajar (plan)' value={`${fmtHours(sum.teaching)} jam`} />
            <StatCard tone='blue' icon='📋' label='Task tambahan (plan)' value={`${fmtHours(sum.task)} jam`} />
            <StatCard tone={sum.achieved ? 'green' : 'orange'} icon='⏱️' label={`Total plan / target ${settings.targetHours}`} value={`${fmtHours(sum.total)} jam`} />
            <StatCard tone={sum.achieved ? 'green' : 'purple'} icon={sum.achieved ? '✅' : '🕒'} label={sum.achieved ? 'Status plan' : 'Plan masih kurang'} value={sum.achieved ? 'Tercapai' : `${fmtHours(sum.gap)} jam`} />
          </div>
          <SectionCard title='Jadwal Minggu Ini (Plan)' icon='🗓️' className='mb-6'
            subtitle={plan.override ? 'Disesuaikan khusus minggu ini oleh atasan' : 'Mengikuti pola default'}>
            <WeekGrid
              blocks={plan.blocks} tasks={plan.tasks} taskTypes={taskTypes}
              windowStart={settings.windowStart} windowEnd={settings.windowEnd} editable={false}
              dates={monday ? weekDates(monday) : null} today={today}
            />
          </SectionCard>

          <SectionCard title='Realisasi' icon='✅'
            subtitle='Konfirmasi apa yang benar-benar terlaksana. Tanpa konfirmasi, realisasi mengikuti absensi.'
            actions={dateOptions.length > 0 && (
              <select value={date || ''} onChange={e => setPicked(e.target.value)}
                className='rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700'>
                {dateOptions.map(d => <option key={d} value={d}>{dateLabel(d, today)}</option>)}
              </select>
            )}>
            {weekReal && (
              <div className='mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4'>
                <Chip label='Plan minggu ini (sampai kini)' value={`${fmtHours(weekReal.planned)} jam`} />
                <Chip label='Realisasi' value={`${fmtHours(weekReal.realized)} jam`} tone={weekReal.pct == null || weekReal.pct >= 95 ? 'ok' : 'warn'} />
                <Chip label='Pencapaian' value={weekReal.pct == null ? '-' : `${weekReal.pct}%`} tone={weekReal.pct == null || weekReal.pct >= 95 ? 'ok' : 'warn'} />
                <Chip label='Belum dikonfirmasi' value={`${weekReal.unconfirmed} item`} tone={weekReal.unconfirmed ? 'warn' : 'ok'} />
              </div>
            )}

            {onLeave ? (
              <p className='rounded-xl bg-sky-50 px-4 py-3 text-sm text-sky-800'>Hari ini tercatat cuti, jadi tidak ada konfirmasi dan tidak dihitung kurang.</p>
            ) : items.length === 0 ? (
              <EmptyState icon='🗓️' title='Tidak ada jadwal pada tanggal ini.' />
            ) : (
              <>
                <p className='mb-3 text-xs text-gray-500' data-testid='real-evidence'>
                  {att && att.checkIn !== '-' ? <>Absensi: masuk <b>{att.checkIn}</b>{att.checkOut && att.checkOut !== '-' ? <>, pulang <b>{att.checkOut}</b></> : ', belum pulang'}.</> : <b className='text-amber-700'>Tidak ada absensi pada tanggal ini.</b>}
                  {' '}Konfirmasi yang melebihi bukti absensi perlu divalidasi atasan.
                </p>
                <div className='space-y-2'>
                  {items.map(item => {
                    const rec = recs[recKey(uid, date, item.key)] || null
                    const ev = evaluateItem(item, rec, att, date, now)
                    const done = ended(item)
                    return (
                      <div key={item.key} className='rounded-xl border border-gray-100 px-4 py-3' data-testid='real-item'>
                        <div className='flex flex-wrap items-center justify-between gap-2'>
                          <div>
                            <span className='text-sm font-semibold text-gray-800'>{item.start}-{item.end}</span>
                            <span className='ml-2 text-sm text-gray-700'>{item.label}</span>
                            <span className='ml-2 text-xs text-gray-400'>{fmtHours(item.hours)} jam{item.kind === 'task' ? (item.teaching ? ', mengajar perbantuan' : ', task') : ', mengajar'}</span>
                          </div>
                          <div className='flex items-center gap-2'>
                            {rec ? <StatusBadge tone={STATUS_TONE[rec.status]}>{STATUS_LABEL[rec.status]}{rec.status === 'Partial' ? ` ${fmtHours(rec.hours)} jam` : ''}</StatusBadge>
                              : <StatusBadge tone='neutral'>Belum dikonfirmasi</StatusBadge>}
                          </div>
                        </div>
                        <div className='mt-1 text-[11px] text-gray-400'>
                          Absensi menutup {fmtHours(ev.evidence)} dari {fmtHours(item.hours)} jam · Realisasi dihitung {fmtHours(ev.realized)} jam ({SOURCE_LABEL[ev.source]})
                        </div>
                        {rec?.reason && <div className='mt-1 text-xs text-gray-500'>Alasan: {rec.reason}</div>}
                        {ev.flagged && (
                          <div className={`mt-1 text-xs font-medium ${rec.validation === 'Approved' ? 'text-emerald-600' : rec.validation === 'Rejected' ? 'text-red-600' : 'text-amber-600'}`}>
                            {rec.validation === 'Approved' ? `Disetujui atasan${rec.validatedByName ? ` (${rec.validatedByName})` : ''}`
                              : rec.validation === 'Rejected' ? `Ditolak atasan${rec.note ? `: ${rec.note}` : ''}. Realisasi mengikuti absensi.`
                              : 'Melebihi bukti absensi: menunggu validasi atasan.'}
                          </div>
                        )}
                        <div className='mt-2 flex flex-wrap gap-2'>
                          {done ? (
                            <>
                              <ActionButton size='sm' onClick={() => confirmDone(item)}>Terlaksana</ActionButton>
                              <ActionButton size='sm' variant='secondary' onClick={() => openModal(item, 'Partial')}>Sebagian</ActionButton>
                              <ActionButton size='sm' variant='secondary' onClick={() => openModal(item, 'Missed')}>Tidak terlaksana</ActionButton>
                            </>
                          ) : <span className='text-xs text-gray-400'>Belum berakhir, konfirmasi setelah {item.end}.</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
                {items.some(i => ended(i) && !recs[recKey(uid, date, i.key)]) && (
                  <div className='mt-4'><ActionButton variant='secondary' onClick={confirmAllDone}>Konfirmasi semua yang belum, terlaksana</ActionButton></div>
                )}
              </>
            )}
          </SectionCard>

          {modal && (
            <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4' onClick={() => setModal(null)}>
              <div className='w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl' onClick={e => e.stopPropagation()}>
                <h3 className='text-base font-bold text-gray-800'>{modal.status === 'Partial' ? 'Terlaksana sebagian' : 'Tidak terlaksana'}</h3>
                <p className='mb-3 text-xs text-gray-400'>{modal.item.start}-{modal.item.end} · {modal.item.label}</p>
                <div className='space-y-3'>
                  {modal.status === 'Partial' && (
                    <FormField label={`Jam yang terlaksana (dari ${fmtHours(modal.item.hours)} jam)`} required>
                      <Input type='number' step='0.25' min='0' value={modal.hours} onChange={e => setModal({ ...modal, hours: e.target.value, error: '' })} />
                    </FormField>
                  )}
                  <FormField label='Alasan' required>
                    <Input value={modal.reason} placeholder='mis. sakit, kegiatan sekolah, kelas dipindah' onChange={e => setModal({ ...modal, reason: e.target.value, error: '' })} />
                  </FormField>
                  {modal.error && <p className='text-xs font-medium text-red-600'>{modal.error}</p>}
                </div>
                <div className='mt-4 flex gap-2'>
                  <ActionButton variant='secondary' className='flex-1' onClick={() => setModal(null)}>Batal</ActionButton>
                  <ActionButton className='flex-1' onClick={saveModal}>Simpan</ActionButton>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function Chip({ label, value, tone }) {
  const cls = tone === 'ok' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : tone === 'warn' ? 'bg-amber-50 text-amber-700 ring-amber-200' : 'bg-gray-50 text-gray-700 ring-gray-100'
  return (
    <div className={`rounded-xl px-3 py-2.5 ring-1 ${cls}`}>
      <div className='text-[11px] font-semibold opacity-70'>{label}</div>
      <div className='text-base font-bold'>{value}</div>
    </div>
  )
}
