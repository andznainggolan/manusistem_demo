'use client'
import { Fragment, useEffect, useMemo, useState } from 'react'
import { useEmployeeStore } from '@/store/employeeStore'
import { useStructureStore } from '@/store/structureStore'
import { useJlaStore } from '@/store/jlaStore'
import { useJlaRealStore } from '@/store/jlaRealStore'
import { useJlaWeekStore } from '@/store/jlaWeekStore'
import { useAttendanceStore } from '@/store/attendanceStore'
import { fmtHours, weekSummary } from '@/lib/jla'
import { localDateStr } from '@/lib/workSchedule'
import { summarize, periodRange, weekdaysBetween, STATUS_LABEL, SOURCE_LABEL } from '@/lib/jlaRealization'
import { useJlaAuthority } from '@/components/jla/useJlaAuthority'
import { downloadSummary } from '@/lib/jlaExcel'
import { StatCard, SectionCard, ActionButton, StatusBadge, EmptyState, FilterBar, FilterPill, FormField, Input } from '@/components/ui'

const PERIODS = [
  { key: 'week', label: 'Minggu ini' },
  { key: 'lastweek', label: 'Minggu lalu' },
  { key: 'month', label: 'Bulan ini' },
  { key: 'lastmonth', label: 'Bulan lalu' },
]
const dmy = (d) => new Date(`${d}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
const pctTone = (p) => p == null ? 'text-gray-300' : p >= 95 ? 'text-emerald-600' : p >= 80 ? 'text-amber-600' : 'text-red-600'

function downloadCsv(name, rows) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const text = '﻿' + rows.map(r => r.map(esc).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a'); a.href = url; a.download = name; a.click()
  URL.revokeObjectURL(url)
}

export default function JlaRealizationBoard({ scope = 'unit' }) {
  const { employees } = useEmployeeStore()
  const { departments, positions } = useStructureStore()
  const { settings, taskTypes, categories, teachingBlocks, tasks } = useJlaStore()
  const { records: recs, validate } = useJlaRealStore()
  const attendance = useAttendanceStore(s => s.records)
  const weeks = useJlaWeekStore(s => s.weeks)
  const { currentUser, viewer, buOf, canManage } = useJlaAuthority()

  const [now, setNow] = useState(null)
  useEffect(() => { setNow(new Date()) }, [])
  const [period, setPeriod] = useState('week')
  const [tab, setTab] = useState('laporan')
  const [open, setOpen] = useState(null)
  const [rejecting, setRejecting] = useState(null) // { row, note }

  const seesAll = scope === 'all' || currentUser?.role === 'superadmin' || currentUser?.role?.startsWith('hr')
  const typeName = (id) => taskTypes.find(t => t.id === id)?.name || 'Task'
  const positionName = (e) => positions.find(p => p.id === e.positionId)?.name || e.position

  const teachers = useMemo(() => employees
    .filter(e => e.status === 'Active' && categories[e.id] === 'Guru' && (seesAll || buOf(e) === buOf(viewer || {}) || canManage(e)))
    .sort((a, b) => a.name.localeCompare(b.name)),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [employees, categories, seesAll, viewer?.id, departments])

  const ctx = { blocks: teachingBlocks, tasks, weeks, attendance, recs, typeName, now: now || new Date() }
  const range = now ? periodRange(period, now) : null
  const dates = range ? weekdaysBetween(range.from, range.to) : []

  const rows = useMemo(() => !now ? [] : teachers.map(emp => ({ emp, ...summarize(emp.id, dates, ctx) })),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [teachers, period, now, teachingBlocks, tasks, weeks, attendance, recs])

  // Validation queue looks back a month regardless of the report period.
  const queue = useMemo(() => {
    if (!now) return []
    const from = new Date(now); from.setDate(from.getDate() - 31)
    const span = weekdaysBetween(localDateStr(from), localDateStr(now))
    return teachers.filter(canManage).flatMap(emp =>
      summarize(emp.id, span, ctx).rows.filter(r => r.needsValidation).map(r => ({ ...r, emp })))
      .sort((a, b) => b.date.localeCompare(a.date))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teachers, now, teachingBlocks, tasks, weeks, attendance, recs, viewer?.id])

  const totalPlan = rows.reduce((s, r) => s + r.planned, 0)
  const totalReal = rows.reduce((s, r) => s + r.realized, 0)
  const totalPct = totalPlan > 0 ? Math.round((totalReal / totalPlan) * 100) : null
  const anyManage = teachers.some(canManage)

  const exportSummary = () => downloadCsv(`rekap-jla-${range.from}_${range.to}.csv`, [
    ['Guru', 'Jabatan', 'Departemen', 'Periode', 'Plan (jam)', 'Realisasi (jam)', 'Selisih (jam)', 'Pencapaian (%)', 'Item belum dikonfirmasi', 'Menunggu validasi'],
    ...rows.map(r => [r.emp.name, positionName(r.emp), r.emp.department, `${range.from} s/d ${range.to}`, r.planned.toFixed(2), r.realized.toFixed(2), r.gap.toFixed(2), r.pct ?? '', r.unconfirmed, r.pendingValidation]),
  ])
  const exportDetail = () => downloadCsv(`detail-jla-${range.from}_${range.to}.csv`, [
    ['Guru', 'Tanggal', 'Jam', 'Kegiatan', 'Plan (jam)', 'Bukti absensi (jam)', 'Konfirmasi guru', 'Alasan', 'Realisasi (jam)', 'Sumber'],
    ...rows.flatMap(r => r.rows.map(x => [r.emp.name, x.date, `${x.item.start}-${x.item.end}`, x.item.label, x.planned.toFixed(2), x.evidence.toFixed(2),
      x.status ? `${STATUS_LABEL[x.status]}${x.status === 'Partial' ? ` ${x.rec.hours} jam` : ''}` : 'Belum dikonfirmasi', x.rec?.reason || '', x.realized.toFixed(2), SOURCE_LABEL[x.source]])),
  ])

  const decide = (row, decision, note = '') => validate(row.emp.id, row.date, row.item.key, decision, currentUser.id, currentUser.name, note)

  if (!now) return null
  return (
    <div>
      <div className='mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4'>
        <StatCard tone='brand' icon='📅' label='Plan (sampai kini)' value={`${fmtHours(totalPlan)} jam`} />
        <StatCard tone='green' icon='✅' label='Realisasi' value={`${fmtHours(totalReal)} jam`} />
        <StatCard tone={totalPct == null || totalPct >= 95 ? 'green' : 'orange'} icon='📈' label='Pencapaian' value={totalPct == null ? '-' : `${totalPct}%`} />
        <StatCard tone='purple' icon='🔎' label='Menunggu validasi' value={String(queue.length)} />
      </div>

      <SectionCard bodyClass='p-0'
        title='Plan vs Realisasi' icon='📊'
        subtitle={`${dmy(range.from)} sampai ${dmy(range.to)}. Hanya kegiatan yang sudah berakhir dihitung.`}
        actions={
          <div className='flex flex-wrap items-center gap-2'>
            <FilterBar>
              <FilterPill active={tab === 'laporan'} onClick={() => setTab('laporan')}>Laporan</FilterPill>
              {anyManage && <FilterPill active={tab === 'validasi'} onClick={() => setTab('validasi')}>Validasi ({queue.length})</FilterPill>}
            </FilterBar>
          </div>
        }>
        {tab === 'laporan' ? (
          <>
            <div className='flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-3'>
              <FilterBar>
                {PERIODS.map(p => <FilterPill key={p.key} active={period === p.key} onClick={() => setPeriod(p.key)}>{p.label}</FilterPill>)}
              </FilterBar>
              <div className='flex gap-2'>
                <ActionButton size='sm' variant='secondary' onClick={exportSummary}>Unduh Rekap (CSV)</ActionButton>
                <ActionButton size='sm' variant='secondary' onClick={exportDetail}>Unduh Detail Harian (CSV)</ActionButton>
                <ActionButton size='sm' onClick={() => downloadSummary({
                  planRowsData: rows.map(r => ({ emp: r.emp, sum: weekSummary(r.emp.id, teachingBlocks.filter(b => b.employeeId === r.emp.id), tasks.filter(t => t.employeeId === r.emp.id), settings.targetHours) })),
                  planLabel: 'pola default', realRows: rows, range, positionName, target: settings.targetHours })}>Unduh Summary (Excel)</ActionButton>
              </div>
            </div>
            {rows.length === 0 ? (
              <div className='p-5'><EmptyState icon='🧑‍🏫' title='Belum ada guru untuk dipantau.' /></div>
            ) : (
              <div className='overflow-x-auto'>
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='border-b border-gray-100 text-left text-[11px] font-bold uppercase tracking-wide text-gray-400'>
                      <th className='px-5 py-2.5'>Guru</th><th className='px-3 py-2.5 text-right'>Plan</th><th className='px-3 py-2.5 text-right'>Realisasi</th>
                      <th className='px-3 py-2.5 text-right'>Selisih</th><th className='px-3 py-2.5 text-right'>Capai</th>
                      <th className='px-3 py-2.5 text-right'>Belum konfirmasi</th><th className='px-5 py-2.5 text-right'>Validasi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(r => (
                      <Fragment key={r.emp.id}>
                        <tr className='cursor-pointer border-b border-gray-50 hover:bg-gray-50/60' onClick={() => setOpen(open === r.emp.id ? null : r.emp.id)} data-testid='real-row'>
                          <td className='px-5 py-2.5'>
                            <div className='font-medium text-gray-800'>{r.emp.name}</div>
                            <div className='text-[11px] text-gray-400'>{positionName(r.emp)}</div>
                          </td>
                          <td className='px-3 py-2.5 text-right tabular-nums text-gray-600'>{fmtHours(r.planned)}</td>
                          <td className='px-3 py-2.5 text-right tabular-nums text-gray-800'>{fmtHours(r.realized)}</td>
                          <td className='px-3 py-2.5 text-right tabular-nums text-gray-500'>{r.gap > 0.001 ? `-${fmtHours(r.gap)}` : '0'}</td>
                          <td className={`px-3 py-2.5 text-right font-bold tabular-nums ${pctTone(r.pct)}`}>{r.pct == null ? '-' : `${r.pct}%`}</td>
                          <td className='px-3 py-2.5 text-right tabular-nums text-gray-500'>{r.unconfirmed}</td>
                          <td className='px-5 py-2.5 text-right'>{r.pendingValidation ? <StatusBadge tone='warning'>{r.pendingValidation} menunggu</StatusBadge> : <span className='text-gray-300'>-</span>}</td>
                        </tr>
                        {open === r.emp.id && (
                          <tr className='border-b border-gray-100 bg-gray-50/50'>
                            <td colSpan={7} className='px-5 py-3'>
                              {r.rows.length === 0 ? <span className='text-xs text-gray-400'>Belum ada kegiatan berakhir pada periode ini.</span> : (
                                <table className='w-full text-xs'>
                                  <thead><tr className='text-left text-[10px] font-bold uppercase tracking-wide text-gray-400'>
                                    <th className='py-1.5'>Tanggal</th><th>Jam</th><th>Kegiatan</th><th className='text-right'>Plan</th><th className='text-right'>Absensi</th><th>Konfirmasi</th><th className='text-right'>Realisasi</th><th>Sumber</th>
                                  </tr></thead>
                                  <tbody>
                                    {r.rows.map(x => (
                                      <tr key={`${x.date}-${x.item.key}`} className='border-t border-gray-100'>
                                        <td className='py-1.5 tabular-nums'>{x.date}</td><td className='tabular-nums'>{x.item.start}-{x.item.end}</td><td>{x.item.label}</td>
                                        <td className='text-right tabular-nums'>{fmtHours(x.planned)}</td><td className='text-right tabular-nums'>{fmtHours(x.evidence)}</td>
                                        <td>{x.status ? `${STATUS_LABEL[x.status]}${x.status === 'Partial' ? ` ${fmtHours(x.rec.hours)} jam` : ''}` : <span className='text-gray-400'>Belum</span>}</td>
                                        <td className='text-right font-semibold tabular-nums'>{fmtHours(x.realized)}</td><td className='text-gray-500'>{SOURCE_LABEL[x.source]}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : queue.length === 0 ? (
          <div className='p-5'><EmptyState icon='✅' title='Tidak ada konfirmasi yang perlu divalidasi.' description='Konfirmasi guru yang melebihi bukti absensi muncul di sini.' /></div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='border-b border-gray-100 text-left text-[11px] font-bold uppercase tracking-wide text-gray-400'>
                  <th className='px-5 py-2.5'>Tanggal</th><th className='px-3 py-2.5'>Guru</th><th className='px-3 py-2.5'>Kegiatan</th>
                  <th className='px-3 py-2.5 text-right'>Plan</th><th className='px-3 py-2.5 text-right'>Absensi</th><th className='px-3 py-2.5'>Konfirmasi guru</th><th className='px-5 py-2.5 text-right'>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {queue.map(r => (
                  <tr key={`${r.emp.id}-${r.date}-${r.item.key}`} className='border-b border-gray-50 align-top' data-testid='validation-row'>
                    <td className='px-5 py-2.5 tabular-nums text-gray-700'>{r.date}</td>
                    <td className='px-3 py-2.5 font-medium text-gray-800'>{r.emp.name}</td>
                    <td className='px-3 py-2.5 text-gray-600'>{r.item.start}-{r.item.end}<div className='text-xs text-gray-400'>{r.item.label}</div></td>
                    <td className='px-3 py-2.5 text-right tabular-nums'>{fmtHours(r.planned)}</td>
                    <td className='px-3 py-2.5 text-right tabular-nums text-amber-700'>{fmtHours(r.evidence)}{r.att?.checkIn && r.att.checkIn !== '-' ? <div className='text-[11px] text-gray-400'>{r.att.checkIn}-{r.att.checkOut}</div> : <div className='text-[11px] text-red-500'>tanpa absensi</div>}</td>
                    <td className='max-w-[240px] px-3 py-2.5 text-xs text-gray-600'>
                      <b>{STATUS_LABEL[r.status]}{r.status === 'Partial' ? ` ${fmtHours(r.rec.hours)} jam` : ''}</b>
                      <div className='text-gray-400'>{r.rec.reason || 'Tanpa alasan'}</div>
                    </td>
                    <td className='whitespace-nowrap px-5 py-2.5 text-right text-xs font-semibold'>
                      <button onClick={() => decide(r, 'Approved')} className='mr-3 text-emerald-700 hover:underline'>Setujui</button>
                      <button onClick={() => setRejecting({ row: r, note: '' })} className='text-red-600 hover:underline'>Tolak</button>
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
            <h3 className='text-base font-bold text-gray-800'>Tolak konfirmasi</h3>
            <p className='mb-3 text-xs text-gray-400'>{rejecting.row.emp.name} · {rejecting.row.date} · {rejecting.row.item.label}. Realisasi akan mengikuti absensi.</p>
            <FormField label='Catatan (opsional)'>
              <Input value={rejecting.note} onChange={e => setRejecting({ ...rejecting, note: e.target.value })} />
            </FormField>
            <div className='mt-4 flex gap-2'>
              <ActionButton variant='secondary' className='flex-1' onClick={() => setRejecting(null)}>Batal</ActionButton>
              <ActionButton variant='danger' className='flex-1' onClick={() => { decide(rejecting.row, 'Rejected', rejecting.note.trim()); setRejecting(null) }}>Tolak</ActionButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
