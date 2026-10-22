'use client'
import { useMemo, useState } from 'react'
import { useTimeSettingsStore, DEFAULT_TIME_SETTINGS } from '@/store/timeSettingsStore'
import { useAttendanceStore } from '@/store/attendanceStore'
import { useShiftStore } from '@/store/shiftStore'
import { gradeTime, shiftFor, TONE_CLASS, toneLabel, GRACE_MINUTES } from '@/lib/workSchedule'
import { evaluateRecord } from '@/lib/attendanceRules'
import { PageHeader, SectionCard, FormField, Input, StatCard, ActionButton } from '@/components/ui'

const minutesInput = (v) => Math.max(0, Math.min(240, Math.floor(Number(v) || 0)))
const t = (id) => id

export default function TimeSettingsPage() {
  const { settings, approvals, updateSettings } = useTimeSettingsStore()
  const { records } = useAttendanceStore()
  const { assignments, schedules, patterns, shifts } = useShiftStore()
  const [sample, setSample] = useState({ scheduled: '07:00', actual: '07:05', kind: 'in' })

  // Re-evaluated on every render so the simulator follows the settings above it.
  const gradeNow = gradeTime(sample.actual, sample.scheduled, sample.kind)

  const counts = useMemo(() => {
    const c = { exceptions: 0, Pending: 0, Approved: 0, Rejected: 0, Expired: 0 }
    records.forEach(r => {
      const sched = shiftFor(r.userId, r.date, { assignments, schedules, patterns, shifts })
      const ev = evaluateRecord(r, sched, settings, approvals)
      c.exceptions += ev.exceptions.length
      ev.items.forEach(i => { c[i.state] = (c[i.state] || 0) + 1 })
    })
    return c
  }, [records, assignments, schedules, patterns, shifts, settings, approvals])

  const labelFor = (min) => (min > 0 ? `${min} menit` : '0 menit (tanpa toleransi)')

  return (
    <div>
      <PageHeader
        icon='⏱️'
        title='Time Entry Settings'
        subtitle='Aturan penilaian jam masuk dan pulang: toleransi keterlambatan, dan kewajiban approval untuk yang terlambat atau pulang cepat.'
      />

      <div className='grid grid-cols-1 gap-6 xl:grid-cols-2'>
        <SectionCard title='Toleransi' icon='🟢' subtitle='Selisih sampai batas ini tetap berwarna hijau'>
          <div className='space-y-4'>
            <FormField label='Toleransi terlambat (menit)' hint={`Saat ini: ${labelFor(settings.lateToleranceMinutes)}. Default 0.`}>
              <Input type='number' min={0} max={240} value={settings.lateToleranceMinutes}
                onChange={e => updateSettings({ lateToleranceMinutes: minutesInput(e.target.value) })} />
            </FormField>
            <FormField label='Toleransi pulang cepat (menit)' hint={`Saat ini: ${labelFor(settings.earlyOutToleranceMinutes)}. Default 0.`}>
              <Input type='number' min={0} max={240} value={settings.earlyOutToleranceMinutes}
                onChange={e => updateSettings({ earlyOutToleranceMinutes: minutesInput(e.target.value) })} />
            </FormField>
            <p className='text-xs text-gray-500'>
              Di atas toleransi: <b className='text-amber-600'>kuning</b> bila selisih kurang dari {GRACE_MINUTES} menit, <b className='text-red-600'>merah</b> bila {GRACE_MINUTES} menit atau lebih.
            </p>
          </div>
        </SectionCard>

        <SectionCard title='Approval Terlambat dan Pulang Cepat' icon='✅' subtitle='Disetujui oleh atasan langsung'>
          <div className='space-y-4'>
            <label className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition ${settings.requireApproval ? 'border-teal-300 bg-teal-50' : 'border-gray-200 hover:bg-gray-50'}`}>
              <input type='checkbox' className='mt-1 h-4 w-4 accent-teal-700' checked={settings.requireApproval}
                onChange={e => updateSettings({ requireApproval: e.target.checked })} />
              <span>
                <span className='block text-sm font-semibold text-gray-800'>Wajib approval untuk setiap terlambat atau pulang cepat</span>
                <span className='block text-xs text-gray-500'>
                  Yang melebihi toleransi masuk ke daftar approval atasan. Bila ditolak atau dibiarkan melewati batas waktu, dianggap Alpa.
                </span>
              </span>
            </label>
            <FormField label='Batas waktu approval (hari setelah tanggal kejadian)' hint='Setelah batas ini tanpa keputusan, otomatis dihitung Alpa. Default 3.'>
              <Input type='number' min={0} max={31} value={settings.approvalDeadlineDays} disabled={!settings.requireApproval}
                onChange={e => updateSettings({ approvalDeadlineDays: Math.max(0, Math.min(31, Math.floor(Number(e.target.value) || 0))) })} />
            </FormField>
            {!settings.requireApproval && <p className='text-xs text-gray-400'>Aturan ini nonaktif: terlambat dan pulang cepat hanya ditandai warna, tanpa approval.</p>}
          </div>
        </SectionCard>

        <SectionCard title='Simulasi' icon='🧪' subtitle='Coba bagaimana aturan menilai satu jam masuk atau pulang'>
          <div className='grid grid-cols-3 gap-3'>
            <FormField label='Jenis'>
              <select value={sample.kind} onChange={e => setSample({ ...sample, kind: e.target.value })}
                className='w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm'>
                <option value='in'>Masuk</option><option value='out'>Pulang</option>
              </select>
            </FormField>
            <FormField label='Jadwal'><Input type='time' value={sample.scheduled} onChange={e => setSample({ ...sample, scheduled: e.target.value })} /></FormField>
            <FormField label='Jam aktual'><Input type='time' value={sample.actual} onChange={e => setSample({ ...sample, actual: e.target.value })} /></FormField>
          </div>
          <div className='mt-4 rounded-xl bg-gray-50 px-4 py-3'>
            <span className={`text-lg font-bold ${TONE_CLASS[gradeNow.tone]}`}>{sample.actual || '--:--'}</span>
            <span className={`ml-3 text-sm font-semibold ${TONE_CLASS[gradeNow.tone]}`}>
              {gradeNow.tone === 'none' ? 'Isi jam jadwal dan aktual' : toneLabel(gradeNow.tone, sample.kind, gradeNow.deviation, t)}
            </span>
            {settings.requireApproval && gradeNow.tone !== 'ok' && gradeNow.tone !== 'none' && (
              <p className='mt-1 text-xs text-gray-500'>Perlu approval atasan. Tanpa keputusan dalam {settings.approvalDeadlineDays} hari: Alpa.</p>
            )}
          </div>
        </SectionCard>

        <SectionCard title='Status Saat Ini' icon='📊' subtitle='Dari catatan kehadiran yang ada'>
          <div className='grid grid-cols-2 gap-3'>
            <StatCard tone='orange' icon='⚠️' label='Melebihi toleransi' value={String(counts.exceptions)} />
            <StatCard tone='purple' icon='⏳' label='Menunggu approval' value={String(counts.Pending)} />
            <StatCard tone='green' icon='✅' label='Disetujui' value={String(counts.Approved)} />
            <StatCard tone='brand' icon='🚫' label='Alpa (ditolak/lewat batas)' value={String(counts.Rejected + counts.Expired)} />
          </div>
          {!settings.requireApproval && <p className='mt-3 text-xs text-gray-400'>Angka approval baru terisi setelah wajib approval diaktifkan.</p>}
        </SectionCard>
      </div>

      <div className='mt-6'>
        <ActionButton variant='secondary' size='sm' onClick={() => updateSettings({ ...DEFAULT_TIME_SETTINGS })}>Kembalikan ke default</ActionButton>
      </div>
    </div>
  )
}
