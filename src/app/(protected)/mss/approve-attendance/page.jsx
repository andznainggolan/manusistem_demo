'use client'
import { useMemo, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useEmployeeStore } from '@/store/employeeStore'
import { useAttendanceStore } from '@/store/attendanceStore'
import { useShiftStore } from '@/store/shiftStore'
import { useTimeSettingsStore } from '@/store/timeSettingsStore'
import { shiftFor, localDateStr } from '@/lib/workSchedule'
import { evaluateRecord, KIND_LABEL, STATE_LABEL, STATE_TONE } from '@/lib/attendanceRules'
import { PageHeader, StatCard, SectionCard, StatusBadge, ActionButton, EmptyState, FilterBar, FilterPill } from '@/components/ui'

export default function ApproveAttendancePage() {
  const { currentUser } = useAuthStore()
  const { employees } = useEmployeeStore()
  const { records } = useAttendanceStore()
  const { assignments, schedules, patterns, shifts } = useShiftStore()
  const { settings, approvals, decide } = useTimeSettingsStore()
  const [view, setView] = useState('pending')
  const [rejecting, setRejecting] = useState(null) // { item }
  const [note, setNote] = useState('')

  const isAll = currentUser?.role === 'superadmin'
  const team = employees.filter(e => e.status === 'Active' && (isAll || e.managerId === currentUser?.id))
  const today = localDateStr(new Date())

  const items = useMemo(() => {
    const out = []
    records.forEach(r => {
      const emp = team.find(e => e.id === r.userId)
      if (!emp) return
      const sched = shiftFor(r.userId, r.date, { assignments, schedules, patterns, shifts })
      evaluateRecord(r, sched, settings, approvals, today).items.forEach(i => out.push({ ...i, record: r, emp, sched }))
    })
    return out.sort((a, b) => b.record.date.localeCompare(a.record.date) || a.emp.name.localeCompare(b.emp.name))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [records, team.length, assignments, schedules, patterns, shifts, settings, approvals, today])

  const pending = items.filter(i => i.state === 'Pending')
  const decided = items.filter(i => i.state !== 'Pending')
  const shown = view === 'pending' ? pending : decided
  const count = (s) => items.filter(i => i.state === s).length

  const daysLeft = (item) => {
    const age = Math.floor((new Date(today) - new Date(item.record.date)) / 86400000)
    return Math.max(0, settings.approvalDeadlineDays - age)
  }
  const approve = (i) => decide(i.record.userId, i.record.date, i.kind, 'Approved', currentUser.id, currentUser.name, '')
  const confirmReject = () => {
    const i = rejecting.item
    decide(i.record.userId, i.record.date, i.kind, 'Rejected', currentUser.id, currentUser.name, note.trim())
    setRejecting(null); setNote('')
  }

  return (
    <div>
      <PageHeader
        icon='✅'
        title='Approve Attendance'
        subtitle='Setujui atau tolak keterlambatan dan pulang cepat anggota tim. Yang ditolak atau dibiarkan melewati batas waktu dihitung Alpa.'
      />

      {!settings.requireApproval && (
        <div className='mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200'>
          Wajib approval sedang nonaktif. Aktifkan di HR Administration &gt; Time &amp; Labor &gt; Time Entry Settings.
        </div>
      )}

      <div className='mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4'>
        <StatCard tone='purple' icon='⏳' label='Menunggu approval' value={String(count('Pending'))} />
        <StatCard tone='green' icon='✅' label='Disetujui' value={String(count('Approved'))} />
        <StatCard tone='orange' icon='✖️' label='Ditolak' value={String(count('Rejected'))} />
        <StatCard tone='brand' icon='🚫' label='Lewat batas (Alpa)' value={String(count('Expired'))} />
      </div>

      <SectionCard title='Daftar Pengecualian Kehadiran' icon='📋' bodyClass='p-0'
        actions={
          <FilterBar>
            <FilterPill active={view === 'pending'} onClick={() => setView('pending')}>Menunggu ({pending.length})</FilterPill>
            <FilterPill active={view === 'decided'} onClick={() => setView('decided')}>Riwayat ({decided.length})</FilterPill>
          </FilterBar>
        }>
        {shown.length === 0 ? (
          <div className='p-5'>
            <EmptyState icon='✅' title={view === 'pending' ? 'Tidak ada yang menunggu approval.' : 'Belum ada riwayat keputusan.'} />
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='border-b border-gray-100 text-left text-[11px] font-bold uppercase tracking-wide text-gray-400'>
                  <th className='px-5 py-2.5'>Tanggal</th><th className='px-3 py-2.5'>Karyawan</th><th className='px-3 py-2.5'>Jenis</th>
                  <th className='px-3 py-2.5'>Jadwal</th><th className='px-3 py-2.5'>Aktual</th><th className='px-3 py-2.5'>Selisih</th>
                  <th className='px-3 py-2.5'>Alasan</th><th className='px-3 py-2.5'>Status</th><th className='px-5 py-2.5 text-right'>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {shown.map(i => (
                  <tr key={`${i.record.id}-${i.kind}`} className='border-b border-gray-50 align-top'>
                    <td className='px-5 py-2.5 tabular-nums text-gray-700'>{i.record.date}</td>
                    <td className='px-3 py-2.5 font-medium text-gray-800'>{i.emp.name}</td>
                    <td className='px-3 py-2.5 text-gray-600'>{KIND_LABEL[i.kind]}</td>
                    <td className='px-3 py-2.5 tabular-nums text-gray-500'>{i.scheduled}</td>
                    <td className={`px-3 py-2.5 font-semibold tabular-nums ${i.tone === 'bad' ? 'text-red-600' : 'text-amber-600'}`}>{i.actual}</td>
                    <td className='px-3 py-2.5 tabular-nums text-gray-600'>{i.deviation} menit</td>
                    <td className='max-w-[220px] px-3 py-2.5 text-xs text-gray-500'>{i.approval?.reason || '-'}{i.approval?.note ? <div className='mt-0.5 text-gray-400'>Catatan atasan: {i.approval.note}</div> : null}</td>
                    <td className='px-3 py-2.5'>
                      <StatusBadge tone={STATE_TONE[i.state]}>{STATE_LABEL[i.state]}</StatusBadge>
                      {i.state === 'Pending' && <div className='mt-1 text-[11px] text-gray-400'>{daysLeft(i)} hari lagi sebelum Alpa</div>}
                      {i.approval?.decidedByName && <div className='mt-1 text-[11px] text-gray-400'>oleh {i.approval.decidedByName}</div>}
                    </td>
                    <td className='px-5 py-2.5 text-right whitespace-nowrap'>
                      {i.state === 'Pending' ? (
                        <>
                          <button onClick={() => approve(i)} className='mr-3 text-xs font-semibold text-emerald-700 hover:underline'>Setujui</button>
                          <button onClick={() => { setRejecting({ item: i }); setNote('') }} className='text-xs font-semibold text-red-600 hover:underline'>Tolak</button>
                        </>
                      ) : <span className='text-xs text-gray-300'>-</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {rejecting && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4' onClick={() => setRejecting(null)}>
          <div className='w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl' onClick={e => e.stopPropagation()}>
            <h3 className='text-base font-bold text-gray-800'>Tolak {KIND_LABEL[rejecting.item.kind].toLowerCase()}</h3>
            <p className='mb-3 text-xs text-gray-400'>{rejecting.item.emp.name} · {rejecting.item.record.date}. Yang ditolak dihitung Alpa.</p>
            <textarea rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder='Catatan (opsional)'
              className='w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-100' />
            <div className='mt-4 flex gap-2'>
              <ActionButton variant='secondary' className='flex-1' onClick={() => setRejecting(null)}>Batal</ActionButton>
              <ActionButton variant='danger' className='flex-1' onClick={confirmReject}>Tolak</ActionButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
