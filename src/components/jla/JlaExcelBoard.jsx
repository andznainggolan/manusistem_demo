'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useEmployeeStore } from '@/store/employeeStore'
import { useStructureStore } from '@/store/structureStore'
import { useJlaStore } from '@/store/jlaStore'
import { useJlaWeekStore } from '@/store/jlaWeekStore'
import { useJlaRealStore } from '@/store/jlaRealStore'
import { useAttendanceStore } from '@/store/attendanceStore'
import { weekSummary } from '@/lib/jla'
import { localDateStr } from '@/lib/workSchedule'
import { mondayOf, activeMonday, addDays, planForWeek, summarize, periodRange, weekdaysBetween } from '@/lib/jlaRealization'
import { downloadTemplate, downloadTeacherPlan, downloadSummary, planRows, readTemplate, validateRows, groupItems, JENIS } from '@/lib/jlaExcel'
import { useJlaAuthority } from '@/components/jla/useJlaAuthority'
import { useJlaDraft } from '@/store/jlaDraft'
import { SectionCard, ActionButton, StatusBadge, FormField, Select, Input, StatCard } from '@/components/ui'

const PERIODS = [['week', 'Minggu ini'], ['lastweek', 'Minggu lalu'], ['month', 'Bulan ini'], ['lastmonth', 'Bulan lalu']]
const fmtRange = (monday) => `${monday} s/d ${addDays(monday, 4)}`

export default function JlaExcelBoard({ scope = 'unit' }) {
  const { employees } = useEmployeeStore()
  const { departments, positions } = useStructureStore()
  const jla = useJlaStore()
  const { settings, taskTypes, categories, teachingBlocks, tasks } = jla
  const wk = useJlaWeekStore()
  const recs = useJlaRealStore(s => s.records)
  const attendance = useAttendanceStore(s => s.records)
  const { currentUser, viewer, buOf, canImport, isAdmin, isHr } = useJlaAuthority()
  const draft = useJlaDraft()
  const seesAll = scope === 'all' || currentUser?.role === 'superadmin' || currentUser?.role?.startsWith('hr')

  const [now, setNow] = useState(null)
  useEffect(() => { setNow(new Date()) }, [])
  const today = now ? localDateStr(now) : null

  const positionName = (e) => positions.find(p => p.id === e.positionId)?.name || e.position
  const typeName = (id) => taskTypes.find(t => t.id === id)?.name || 'Task'
  const teachers = useMemo(() => employees
    .filter(e => e.status === 'Active' && categories[e.id] === 'Guru' && (seesAll || buOf(e) === buOf(viewer || {})))
    .sort((a, b) => a.name.localeCompare(b.name)),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [employees, categories, seesAll, viewer?.id, departments])

  // ---- download
  const [scopeKind, setScopeKind] = useState('default')          // default | week
  const [weekDate, setWeekDate] = useState('')
  const [teacherId, setTeacherId] = useState('all')
  const [period, setPeriod] = useState('week')
  const [busy, setBusy] = useState(false)
  const monday = scopeKind === 'week' && (weekDate || today) ? mondayOf(weekDate || today) : ''
  const planOf = (empId) => monday
    ? planForWeek(empId, monday, teachingBlocks, tasks, wk.weeks)
    : { blocks: teachingBlocks.filter(b => b.employeeId === empId), tasks: tasks.filter(t => t.employeeId === empId), override: false }
  const scopeLabel = monday ? `minggu ${fmtRange(monday)}` : 'pola default'
  const selectedTeachers = teacherId === 'all' ? teachers : teachers.filter(t => String(t.id) === String(teacherId))
  const run = async (fn) => { setBusy(true); try { await fn() } finally { setBusy(false) } }

  const dlTemplate = (prefilled) => run(() => downloadTemplate({
    teachers, taskTypes, positionName,
    rows: prefilled ? selectedTeachers.flatMap(e => planRows(e, planOf(e.id), typeName, monday)) : null,
    filename: prefilled ? `jadwal-jla-${monday || 'default'}.xlsx` : 'template-jla.xlsx',
  }))
  const dlTeacher = () => run(async () => {
    for (const e of selectedTeachers) {
      await downloadTeacherPlan({ emp: e, plan: planOf(e.id), monday, typeName, settings, positionName, target: settings.targetHours })
    }
  })
  const dlSummary = () => run(async () => {
    const range = periodRange(period, now || new Date())
    const ctx = { blocks: teachingBlocks, tasks, weeks: wk.weeks, attendance, recs, typeName, now: now || new Date() }
    const dates = weekdaysBetween(range.from, range.to)
    await downloadSummary({
      planRowsData: selectedTeachers.map(e => { const p = planOf(e.id); return { emp: e, sum: weekSummary(e.id, p.blocks, p.tasks, settings.targetHours) } }),
      planLabel: scopeLabel,
      realRows: selectedTeachers.map(e => ({ emp: e, ...summarize(e.id, dates, ctx) })),
      range, positionName, target: settings.targetHours,
    })
  })

  // ---- import
  const fileRef = useRef(null)
  const [raw, setRaw] = useState(null)           // { name, rows }
  const [mode, setMode] = useState('replace')
  const [error, setError] = useState('')
  const [done, setDone] = useState(null)

  const existing = (empId, week) => week
    ? planForWeek(empId, week, teachingBlocks, tasks, wk.weeks)
    : { blocks: teachingBlocks.filter(b => b.employeeId === empId), tasks: tasks.filter(t => t.employeeId === empId) }
  const checked = useMemo(() => !raw ? null : validateRows(raw.rows, {
    employees, categories, taskTypes, settings, canImport, existing,
  }, mode),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [raw, mode, employees, categories, taskTypes, settings, teachingBlocks, tasks, wk.weeks, currentUser?.id])

  const onFile = async (e) => {
    const f = e.target.files?.[0]
    setError(''); setDone(null); setRaw(null)
    if (!f) return
    try { setRaw({ name: f.name, rows: await readTemplate(await f.arrayBuffer()) }) }
    catch (err) { setError(err.message || 'File tidak bisa dibaca. Gunakan file .xlsx dari template.') }
    e.target.value = ''
  }
  const okGroups = checked ? checked.groups.filter(g => g.ok) : []
  const badGroups = checked ? checked.groups.filter(g => !g.ok) : []
  const errorRows = checked ? checked.rows.filter(r => r.errors.length).length : 0

  const doImport = () => {
    okGroups.forEach(g => {
      const items = groupItems(g)
      const tpl = { blocks: teachingBlocks.filter(b => b.employeeId === g.emp.id), tasks: tasks.filter(t => t.employeeId === g.emp.id) }
      if (g.week) wk.importPlan(g.emp.id, g.week, tpl, items, mode, currentUser)
      else jla.importPlan(g.emp.id, items, mode, currentUser)
    })
    setDone({ teachers: okGroups.length, rows: okGroups.reduce((s, g) => s + g.rows.length, 0), skipped: badGroups.length })
    setRaw(null)
  }

  if (!now) return null
  return (
    <div className='space-y-6'>
      <SectionCard title='Unduh Excel' icon='⬇️' subtitle='Template, jadwal guru, dan summary. File jadwal memakai kolom yang sama dengan template, jadi bisa diedit lalu diunggah lagi.'>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-4'>
          <FormField label='Cakupan jadwal'>
            <Select value={scopeKind} onChange={e => setScopeKind(e.target.value)}>
              <option value='default'>Pola default</option>
              <option value='week'>Minggu tertentu</option>
            </Select>
          </FormField>
          <FormField label='Minggu (pilih tanggal)' hint={monday ? `Senin ${monday}` : 'Hanya untuk "Minggu tertentu"'}>
            <Input type='date' disabled={scopeKind !== 'week'} value={weekDate || (today ? activeMonday(today) : '')} onChange={e => setWeekDate(e.target.value)} />
          </FormField>
          <FormField label='Guru'>
            <Select value={teacherId} onChange={e => setTeacherId(e.target.value)}>
              <option value='all'>Semua guru ({teachers.length})</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>
          </FormField>
          <FormField label='Periode realisasi (summary)'>
            <Select value={period} onChange={e => setPeriod(e.target.value)}>
              {PERIODS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </Select>
          </FormField>
        </div>
        <div className='mt-4 flex flex-wrap gap-2'>
          <ActionButton variant='secondary' disabled={busy} onClick={() => dlTemplate(false)}>Template Kosong (contoh)</ActionButton>
          <ActionButton variant='secondary' disabled={busy || !selectedTeachers.length} onClick={() => dlTemplate(true)}>Template Berisi Jadwal ({scopeLabel})</ActionButton>
          <ActionButton variant='secondary' disabled={busy || !selectedTeachers.length || teacherId === 'all'} onClick={dlTeacher}
            title={teacherId === 'all' ? 'Pilih satu guru' : undefined}>Unduh Jadwal Guru Terpilih</ActionButton>
          <ActionButton disabled={busy || !selectedTeachers.length} onClick={dlSummary}>Unduh Summary</ActionButton>
        </div>
        <p className='mt-2 text-xs text-gray-400'>Summary berisi plan ({scopeLabel}) dan realisasi periode terpilih untuk guru yang dipilih.</p>
      </SectionCard>

      <SectionCard title='Impor dari Excel' icon='⬆️' subtitle='Unggah file template. Hasilnya diperiksa dulu sebelum disimpan.'>
        <div className='flex flex-wrap items-end gap-4'>
          <FormField label='File Excel (.xlsx)'>
            <input ref={fileRef} type='file' accept='.xlsx,.xls' onChange={onFile} data-testid='jla-import-file'
              className='block w-full max-w-xs text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-xs file:font-semibold' />
          </FormField>
          <div className='flex gap-3 pb-1 text-sm'>
            {[['replace', 'Ganti jadwal guru'], ['append', 'Tambahkan saja']].map(([v, l]) => (
              <label key={v} className='flex cursor-pointer items-center gap-1.5'>
                <input type='radio' name='jla-import-mode' className='accent-teal-700' checked={mode === v} onChange={() => setMode(v)} /> {l}
              </label>
            ))}
          </div>
        </div>
        <p className='mt-1 text-xs text-gray-400'>
          {mode === 'replace' ? 'Jadwal guru pada pola default atau minggu yang ada di file diganti seluruhnya oleh isi file.' : 'Baris file ditambahkan; jadwal yang sudah ada dipertahankan dan tidak boleh bertumpuk.'}
          {isAdmin || isHr ? '' : ' Anda hanya bisa mengimpor jadwal guru yang menjadi bawahan Anda.'}
        </p>
        {error && <p className='mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600'>{error}</p>}
        {done && (
          <p className='mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700' data-testid='jla-import-done'>
            Impor selesai: {done.teachers} jadwal guru ({done.rows} baris) disimpan{done.skipped ? `, ${done.skipped} dilewati karena ada baris bermasalah` : ''}.
          </p>
        )}

        {checked && (
          <div className='mt-4' data-testid='jla-import-preview'>
            <div className='mb-3 grid grid-cols-2 gap-3 md:grid-cols-4'>
              <StatCard tone='brand' icon='📄' label={`Baris (${raw.name})`} value={String(checked.rows.length)} />
              <StatCard tone='green' icon='✅' label='Jadwal guru siap diimpor' value={String(okGroups.length)} />
              <StatCard tone='orange' icon='⚠️' label='Baris bermasalah' value={String(errorRows)} />
              <StatCard tone='purple' icon='⏭️' label='Jadwal guru dilewati' value={String(badGroups.length)} />
            </div>
            <div className='max-h-[360px] overflow-auto rounded-xl ring-1 ring-gray-100'>
              <table className='w-full text-xs'>
                <thead className='sticky top-0 bg-gray-50'>
                  <tr className='text-left text-[10px] font-bold uppercase tracking-wide text-gray-400'>
                    <th className='px-3 py-2'>Baris</th><th className='px-2 py-2'>NIK</th><th className='px-2 py-2'>Guru</th><th className='px-2 py-2'>Jenis</th>
                    <th className='px-2 py-2'>Hari</th><th className='px-2 py-2'>Jam</th><th className='px-2 py-2'>Keterangan</th><th className='px-2 py-2'>Minggu</th><th className='px-3 py-2'>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {checked.rows.map(r => {
                    const skipped = !r.errors.length && r.group && checked.groups.find(g => g.key === r.group && !g.ok)
                    return (
                      <tr key={r.line} className='border-t border-gray-50 align-top' data-status={r.errors.length ? 'error' : skipped ? 'skipped' : 'ok'}>
                        <td className='px-3 py-1.5 tabular-nums text-gray-400'>{r.line}</td>
                        <td className='px-2 py-1.5 font-mono'>{r.nik}</td>
                        <td className='px-2 py-1.5'>{r.emp?.name || '-'}</td>
                        <td className='px-2 py-1.5'>{JENIS[r.kind] || String(r.jenis)}</td>
                        <td className='px-2 py-1.5'>{r.day ? { Monday: 'Senin', Tuesday: 'Selasa', Wednesday: 'Rabu', Thursday: 'Kamis', Friday: 'Jumat' }[r.day] : String(r.hari)}</td>
                        <td className='px-2 py-1.5 tabular-nums'>{r.start || '?'}-{r.end || '?'}</td>
                        <td className='px-2 py-1.5'>{r.ket}</td>
                        <td className='px-2 py-1.5 tabular-nums'>{r.week || 'default'}</td>
                        <td className='px-3 py-1.5'>
                          {r.errors.length ? <span className='font-medium text-red-600'>{r.errors.join('; ')}</span>
                            : skipped ? <StatusBadge tone='warning'>Dilewati (baris lain guru ini bermasalah)</StatusBadge>
                            : <StatusBadge tone='success'>OK</StatusBadge>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {draft.dirty && <p className='mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800'>Ada perubahan kalender yang belum disimpan. Simpan atau buang dulu di Kalender Mingguan sebelum mengimpor.</p>}
            <div className='mt-4 flex gap-2'>
              <ActionButton disabled={!okGroups.length || draft.dirty} onClick={doImport}>Impor {okGroups.length} Jadwal Guru</ActionButton>
              <ActionButton variant='secondary' onClick={() => setRaw(null)}>Batal</ActionButton>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  )
}
