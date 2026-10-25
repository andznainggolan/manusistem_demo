'use client'
import { useEffect, useMemo, useState } from 'react'
import { useEmployeeStore } from '@/store/employeeStore'
import { useStructureStore } from '@/store/structureStore'
import { useJlaStore } from '@/store/jlaStore'
import { useJlaDraft } from '@/store/jlaDraft'
import { localDateStr } from '@/lib/workSchedule'
import { mondayOf, activeMonday, addDays, weekDates, planForWeek } from '@/lib/jlaRealization'
import { DAYS, toMin, toHHMM, fmtHours, durationHours, weekSummary, freeHoursInWindow, isFreeOn } from '@/lib/jla'
import WeekGrid from '@/components/jla/WeekGrid'
import { downloadTeacherPlan } from '@/lib/jlaExcel'
import { useJlaAuthority } from '@/components/jla/useJlaAuthority'
import { StatCard, SectionCard, ActionButton, StatusBadge, EmptyState, FormField, Select, Input } from '@/components/ui'

const dayLabel = (key) => DAYS.find(d => d.key === key)?.label || key

const fmtRange = (monday) => {
  const a = new Date(`${monday}T00:00:00`), b = new Date(`${addDays(monday, 4)}T00:00:00`)
  return `${a.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - ${b.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`
}

function timeOptions(windowStart, windowEnd) {
  const out = []
  for (let m = toMin(windowStart); m <= toMin(windowEnd); m += 30) out.push(toHHMM(m))
  return out
}

export default function JlaBoard({ scope = 'unit' }) {
  const { employees } = useEmployeeStore()
  const { departments, positions } = useStructureStore()
  const { settings, taskTypes, categories } = useJlaStore()
  // Everything on the calendar edits a draft copy; Simpan writes it to the saved plans.
  const draft = useJlaDraft()
  const { teachingBlocks, tasks, addTasks, updateTask, deleteTask, deleteTeachingBlock, clearWeek } = draft.jla

  const wk = draft.wk
  const weeks = wk.weeks

  const { currentUser, viewer, buOf, canManage: canEditEmp } = useJlaAuthority()
  const seesAll = scope === 'all' || currentUser?.role === 'superadmin' || currentUser?.role?.startsWith('hr')

  // 'weekly': a dated calendar week that may differ from the default pattern; 'default': the pattern itself.
  const [view, setView] = useState('weekly')
  const [now, setNow] = useState(null)   // the clock only exists in the browser
  useEffect(() => { setNow(new Date()) }, [])
  const [monday, setMonday] = useState(null)
  useEffect(() => { if (now) setMonday(m => m || activeMonday(localDateStr(now))) }, [now])
  const today = now ? localDateStr(now) : null
  const weekly = view === 'weekly' && !!monday
  const dates = weekly ? weekDates(monday) : null

  const planOf = (empId) => weekly
    ? planForWeek(empId, monday, teachingBlocks, tasks, weeks)
    : { blocks: teachingBlocks.filter(b => b.employeeId === empId), tasks: tasks.filter(t => t.employeeId === empId), override: false }
  // The default pattern of one teacher, copied into a week the first time that week is edited.
  const tplOf = (empId) => ({ blocks: teachingBlocks.filter(b => b.employeeId === empId), tasks: tasks.filter(t => t.employeeId === empId) })

  const target = settings.targetHours
  const teachers = useMemo(() => employees
    .filter(e => e.status === 'Active' && categories[e.id] === 'Guru' && (seesAll || buOf(e) === buOf(viewer || {})))
    .map(e => { const pl = planOf(e.id); return { emp: e, override: pl.override, sum: weekSummary(e.id, pl.blocks, pl.tasks, target) } })
    .sort((a, b) => b.sum.gap - a.sum.gap || a.emp.name.localeCompare(b.emp.name)),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [employees, categories, teachingBlocks, tasks, weeks, weekly, monday, target, seesAll, viewer?.id, departments])

  const [selectedId, setSelectedId] = useState(null)
  const selected = teachers.find(t => t.emp.id === selectedId) || teachers[0] || null
  const canEdit = canEditEmp(selected?.emp)
  const anyEditable = teachers.some(t => canEditEmp(t.emp))

  const [form, setForm] = useState(null) // { id?, taskTypeId, days, start, end, subject, note, error }
  const [blockDialog, setBlockDialog] = useState(null) // a fixed teaching block clicked on the calendar
  const [clearDialog, setClearDialog] = useState(null) // { blocks, tasks } checkboxes
  const options = timeOptions(settings.windowStart, settings.windowEnd)
  const activeTypes = taskTypes.filter(t => t.active)
  const isTeachingType = (id) => !!taskTypes.find(t => String(t.id) === String(id))?.teaching

  // Finder: which teachers are free in a slot, so they can be lent to another subject.
  const [finder, setFinder] = useState({ days: ['Monday'], start: '13:00', end: '15:00' })
  const finderValid = toMin(finder.end) > toMin(finder.start) && finder.days.length > 0
  const available = useMemo(() => !finderValid ? [] : teachers.filter(t => {
    const pl = planOf(t.emp.id)
    return canEditEmp(t.emp) && isFreeOn(t.emp.id, finder.days, finder.start, finder.end, pl.blocks, pl.tasks)
  }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [teachers, finder, finderValid, teachingBlocks, tasks, weeks, weekly, monday, currentUser?.id, viewer?.id])
  const assignTo = (emp) => {
    setSelectedId(emp.id)
    const teachType = activeTypes.find(t => t.teaching)
    setForm({ taskTypeId: teachType?.id || activeTypes[0]?.id || '', days: finder.days, start: finder.start, end: finder.end, subject: '', note: '', error: '' })
  }

  const achievedCount = teachers.filter(t => t.sum.achieved).length
  const totalGap = teachers.reduce((s, t) => s + t.sum.gap, 0)

  const openAdd = (day, start) => {
    if (!canEdit || !selected) return
    const startMin = toMin(start)
    const end = toHHMM(Math.min(startMin + 60, toMin(settings.windowEnd)))
    setForm({ taskTypeId: activeTypes[0]?.id || '', days: [day], start, end, subject: '', note: '', error: '' })
  }
  const openEdit = (task) => {
    if (!canEdit) return
    setForm({ id: task.id, taskTypeId: task.taskTypeId, days: [task.day], start: task.start, end: task.end, subject: task.subject || '', note: task.note || '', error: '' })
  }
  const save = () => {
    if (!form || !selected) return
    if (!form.taskTypeId) return setForm({ ...form, error: 'Pilih jenis task.' })
    if (!form.days.length) return setForm({ ...form, error: 'Pilih minimal satu hari.' })
    if (toMin(form.end) <= toMin(form.start)) return setForm({ ...form, error: 'Jam selesai harus setelah jam mulai.' })
    if (isTeachingType(form.taskTypeId) && !form.subject.trim()) return setForm({ ...form, error: 'Isi mata pelajaran dan kelas yang diampu.' })
    const base = { taskTypeId: Number(form.taskTypeId), start: form.start, end: form.end, note: form.note.trim(), subject: form.subject.trim() }
    const res = form.id
      ? doUpdate(selected.emp.id, form.id, { ...base, day: form.days[0] })
      : doAdd({ employeeId: selected.emp.id, days: form.days, ...base, createdBy: currentUser.id, createdByName: currentUser.name })
    if (!res.ok) {
      const c = res.error
      return setForm({ ...form, error: `Bentrok pada hari ${dayLabel(c.day)} dengan ${c.kind === 'mengajar' ? `jam mengajar (${c.label})` : 'task lain'} ${c.start}-${c.end}.` })
    }
    setForm(null)
  }

  const typeName = (id) => taskTypes.find(t => t.id === id)?.name || 'Task'
  const selPlan = selected ? planOf(selected.emp.id) : { blocks: [], tasks: [], override: false }
  const weekBlocks = selPlan.blocks
  const weekTasks = selPlan.tasks
  // Subject names without the class suffix ("Matematika 8A-8C" -> "Matematika"), for the suggestions list.
  const subjectOptions = [...new Set(teachingBlocks.map(b => b.label.replace(/\s+\d[\w-]*$/, '').trim()).filter(l => l && !/^(Kelas|Kelompok)$/.test(l)))].sort()
  const selectedTasks = selected ? [...selPlan.tasks]
    .sort((a, b) => DAYS.findIndex(d => d.key === a.day) - DAYS.findIndex(d => d.key === b.day) || toMin(a.start) - toMin(b.start)) : []
  const free = selected ? freeHoursInWindow(selected.emp.id, selPlan.blocks, selPlan.tasks, settings.windowStart, settings.windowEnd) : 0
  const positionName = (e) => positions.find(p => p.id === e.positionId)?.name || e.position

  // Edits go to the week-specific plan in the weekly view, to the default pattern otherwise.
  const doAdd = (a) => weekly ? wk.addTasks(a.employeeId, monday, tplOf(a.employeeId), { ...a, teaching: isTeachingType(a.taskTypeId) }) : addTasks(a)
  const doUpdate = (empId, id, patch) => weekly ? wk.updateTask(empId, monday, tplOf(empId), id, { ...patch, teaching: isTeachingType(patch.taskTypeId) }) : updateTask(id, patch)
  const doDeleteTask = (empId, id) => weekly ? wk.deleteTask(empId, monday, tplOf(empId), id) : deleteTask(id)
  const doDeleteBlock = (empId, id) => weekly ? wk.deleteBlock(empId, monday, tplOf(empId), id) : deleteTeachingBlock(id)
  const doClear = (empId, opts) => weekly ? wk.clearWeek(empId, monday, tplOf(empId), opts) : clearWeek(empId, opts)
  const copyPrevious = () => {
    if (!selected) return
    if (selPlan.override && !window.confirm('Minggu ini sudah disesuaikan. Timpa dengan salinan minggu sebelumnya?')) return
    wk.copyFromPrevious(selected.emp.id, monday, tplOf(selected.emp.id))
  }

  if (!draft.ready || (view === 'weekly' && !monday)) return null

  return (
    <div>
      {draft.dirty && (
        <div className='sticky top-2 z-30 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-amber-50 px-4 py-3 shadow-md ring-1 ring-amber-300' data-testid='draft-bar'>
          <span className='text-sm font-semibold text-amber-900'>Ada perubahan yang belum disimpan. Perubahan baru berlaku setelah Anda klik Simpan.</span>
          <div className='flex gap-2'>
            <ActionButton size='sm' variant='secondary' onClick={draft.discard}>Buang Perubahan</ActionButton>
            <ActionButton size='sm' onClick={draft.save}>Simpan</ActionButton>
          </div>
        </div>
      )}
      <div className='mb-6 flex flex-wrap items-center justify-between gap-3'>
        <div className='inline-flex rounded-xl bg-gray-100 p-1'>
          {[['weekly', 'Kalender Mingguan'], ['default', 'Default per Guru']].map(([k, label]) => (
            <button key={k} type='button' onClick={() => setView(k)}
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${view === k ? 'bg-white text-[#052B52] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{label}</button>
          ))}
        </div>
        {weekly ? (
          <div className='flex flex-wrap items-center gap-2' data-testid='week-nav'>
            <ActionButton size='sm' variant='secondary' onClick={() => setMonday(addDays(monday, -7))} aria-label='Minggu sebelumnya'>‹</ActionButton>
            <span className='min-w-[190px] text-center text-sm font-bold text-gray-800' data-testid='week-label'>{fmtRange(monday)}</span>
            <ActionButton size='sm' variant='secondary' onClick={() => setMonday(addDays(monday, 7))} aria-label='Minggu berikutnya'>›</ActionButton>
            <ActionButton size='sm' variant='secondary' disabled={monday === activeMonday(today)} onClick={() => setMonday(activeMonday(today))}>{activeMonday(today) === mondayOf(today) ? 'Minggu ini' : 'Minggu depan'}</ActionButton>
            <input type='date' value={monday} onChange={e => e.target.value && setMonday(mondayOf(e.target.value))} aria-label='Lompat ke tanggal'
              className='rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700' />
          </div>
        ) : (
          <p className='text-xs text-gray-500'>Pola default berlaku setiap minggu yang belum disesuaikan secara khusus.</p>
        )}
      </div>

      <div className='mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4'>
        <StatCard tone='brand' icon='🧑‍🏫' label='Guru dipantau' value={String(teachers.length)} />
        <StatCard tone='green' icon='✅' label={`Tercapai ${target} jam`} value={String(achievedCount)} />
        <StatCard tone='orange' icon='⏳' label='Belum tercapai' value={String(teachers.length - achievedCount)} />
        <StatCard tone='purple' icon='🕒' label='Total jam kurang / minggu' value={`${fmtHours(totalGap)} jam`} />
      </div>

      {!anyEditable && (
        <div className='mb-4 rounded-xl bg-amber-50 px-4 py-2.5 text-xs text-amber-800 ring-1 ring-amber-200'>
          Mode lihat saja. Task ditambahkan oleh kepala sekolah untuk guru di unitnya, atau oleh atasan langsung guru.
        </div>
      )}

      {anyEditable && (
        <SectionCard className='mb-6' title='Cari Guru yang Tersedia' icon='🔎'
          subtitle='Guru yang kosong di waktu tertentu bisa ditugaskan membantu mata pelajaran lain, misalnya guru olahraga mengajar agama'>
          <div className='flex flex-wrap items-end gap-4'>
            <div>
              <span className='mb-1.5 block text-xs font-semibold text-gray-600'>Hari</span>
              <div className='flex flex-wrap gap-1.5'>
                {DAYS.map(d => {
                  const on = finder.days.includes(d.key)
                  return (
                    <button key={d.key} type='button'
                      onClick={() => setFinder(f => ({ ...f, days: f.days.includes(d.key) ? f.days.filter(x => x !== d.key) : [...f.days, d.key] }))}
                      className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ring-1 transition ${on ? 'bg-teal-600 text-white ring-teal-600' : 'bg-white text-gray-600 ring-gray-200 hover:bg-gray-50'}`}>
                      {d.label}
                    </button>
                  )
                })}
              </div>
            </div>
            <FormField label='Mulai' className='w-28'>
              <Select value={finder.start} onChange={e => setFinder({ ...finder, start: e.target.value })}>
                {options.slice(0, -1).map(o => <option key={o} value={o}>{o}</option>)}
              </Select>
            </FormField>
            <FormField label='Selesai' className='w-28'>
              <Select value={finder.end} onChange={e => setFinder({ ...finder, end: e.target.value })}>
                {options.slice(1).map(o => <option key={o} value={o}>{o}</option>)}
              </Select>
            </FormField>
          </div>
          <div className='mt-4' data-testid='jla-available'>
            {!finderValid ? (
              <p className='text-xs text-amber-700'>Pilih minimal satu hari dan jam selesai setelah jam mulai.</p>
            ) : available.length === 0 ? (
              <p className='text-xs text-gray-500'>Tidak ada guru yang kosong penuh di waktu itu.</p>
            ) : (
              <>
                <p className='mb-2 text-xs text-gray-500'>{available.length} guru kosong di semua hari terpilih ({finder.start}-{finder.end}), diurutkan dari kekurangan jam terbesar:</p>
                <div className='grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3'>
                  {available.map(({ emp, sum }) => (
                    <div key={emp.id} className='flex items-center justify-between gap-2 rounded-xl border border-gray-100 px-3 py-2'>
                      <div className='min-w-0'>
                        <div className='truncate text-sm font-semibold text-gray-800'>{emp.name}</div>
                        <div className='truncate text-[11px] text-gray-400'>{positionName(emp)} · {fmtHours(sum.total)}/{target} jam</div>
                      </div>
                      <ActionButton size='sm' variant='secondary' onClick={() => assignTo(emp)}>Tugaskan</ActionButton>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </SectionCard>
      )}

      {teachers.length === 0 ? (
        <SectionCard title='Guru' icon='🧑‍🏫'>
          <EmptyState icon='🧑‍🏫' title='Belum ada guru di unit ini.' description='Kategori pekerja diatur HR di menu Job Load Analysis > Kategori Pekerja.' />
        </SectionCard>
      ) : (
        <div className='grid grid-cols-1 gap-6 xl:grid-cols-[320px_1fr]'>
          <SectionCard title='Guru' icon='🧑‍🏫' subtitle='Diurutkan dari kekurangan jam terbesar' bodyClass='p-2'>
            <div className='max-h-[640px] space-y-1.5 overflow-y-auto p-1'>
              {teachers.map(({ emp, sum }) => {
                const active = selected?.emp.id === emp.id
                const pct = Math.min(100, Math.round((sum.total / target) * 100))
                return (
                  <button key={emp.id} type='button' onClick={() => setSelectedId(emp.id)}
                    className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${active ? 'border-teal-300 bg-teal-50' : 'border-gray-100 bg-white hover:border-teal-200 hover:bg-gray-50'}`}>
                    <div className='flex items-center justify-between gap-2'>
                      <span className='truncate text-sm font-semibold text-gray-800'>{emp.name}</span>
                      <span className={`flex-shrink-0 text-[11px] font-bold ${sum.achieved ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {fmtHours(sum.total)}/{target} jam
                      </span>
                    </div>
                    <div className='truncate text-[11px] text-gray-400'>{positionName(emp)}</div>
                    <div className='mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100'>
                      <div className={`h-full rounded-full ${sum.achieved ? 'bg-emerald-500' : 'bg-amber-400'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </button>
                )
              })}
            </div>
          </SectionCard>

          {selected && (
            <div className='space-y-6'>
              <SectionCard
                title={selected.emp.name}
                icon='🗓️'
                subtitle={`${positionName(selected.emp)} · ${selected.emp.department}${weekly ? ` · ${selPlan.override ? 'Disesuaikan khusus minggu ini' : 'Mengikuti pola default'}` : ' · Pola default'}`}
                actions={(
                  <>
                    <ActionButton size='sm' variant='secondary' onClick={() => downloadTeacherPlan({ emp: selected.emp, plan: selPlan, monday: weekly ? monday : '', typeName, settings, positionName, target })}>Unduh Excel</ActionButton>
                    {canEdit && <>
                    {weekly && <ActionButton size='sm' variant='secondary' onClick={copyPrevious}>Salin dari Minggu Lalu</ActionButton>}
                    {weekly && selPlan.override && <ActionButton size='sm' variant='secondary' onClick={() => wk.resetWeek(selected.emp.id, monday)}>Kembali ke Default</ActionButton>}
                    <ActionButton size='sm' variant='secondary' disabled={weekBlocks.length + weekTasks.length === 0}
                      onClick={() => setClearDialog({ blocks: true, tasks: true })}>Kosongkan Minggu</ActionButton>
                    <ActionButton size='sm' onClick={() => openAdd('Monday', settings.windowStart)}>+ Tambah Task</ActionButton>
                    </>}
                  </>
                )}
              >
                <div className='mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4'>
                  <Chip label='Jam mengajar' value={`${fmtHours(selected.sum.teaching)} jam`} />
                  <Chip label='Task tambahan' value={`${fmtHours(selected.sum.task)} jam`} />
                  <Chip label={`Total / target ${target}`} value={`${fmtHours(selected.sum.total)} jam`} tone={selected.sum.achieved ? 'ok' : 'warn'} />
                  <Chip label={selected.sum.achieved ? 'Status' : 'Kurang'} value={selected.sum.achieved ? 'Tercapai' : `${fmtHours(selected.sum.gap)} jam`} tone={selected.sum.achieved ? 'ok' : 'warn'} />
                </div>
                <p className='mb-3 text-xs text-gray-500'>
                  Waktu kosong dalam jam kerja ({settings.windowStart}-{settings.windowEnd}): <b>{fmtHours(free)} jam</b> per minggu.
                  {canEdit && ' Klik area kosong untuk menambah task; klik sebuah blok untuk menghapus atau mengubahnya.'}
                </p>
                {weekly && (
                  <div className='mb-3 flex items-center justify-between gap-2' data-testid='grid-week-nav'>
                    <ActionButton size='sm' variant='secondary' onClick={() => setMonday(addDays(monday, -7))}>‹ Minggu Sebelumnya</ActionButton>
                    <span className='text-sm font-bold text-gray-800'>{fmtRange(monday)}</span>
                    <ActionButton size='sm' variant='secondary' onClick={() => setMonday(addDays(monday, 7))}>Minggu Berikutnya ›</ActionButton>
                  </div>
                )}
                <WeekGrid
                  blocks={selPlan.blocks}
                  tasks={selPlan.tasks}
                  dates={dates}
                  today={today}
                  taskTypes={taskTypes}
                  windowStart={settings.windowStart}
                  windowEnd={settings.windowEnd}
                  editable={canEdit}
                  onFreeClick={openAdd}
                  onTaskClick={openEdit}
                  onBlockClick={setBlockDialog}
                />
              </SectionCard>

              <SectionCard title='Daftar Task Tambahan' icon='📋' bodyClass='p-0'>
                {selectedTasks.length === 0 ? (
                  <div className='p-5'><EmptyState icon='📋' title='Belum ada task tambahan.' description={canEdit ? 'Tambahkan task untuk mengisi waktu kosong.' : undefined} /></div>
                ) : (
                  <table className='w-full text-sm'>
                    <thead>
                      <tr className='border-b border-gray-100 text-left text-[11px] font-bold uppercase tracking-wide text-gray-400'>
                        <th className='px-5 py-2.5'>Hari</th><th className='px-3 py-2.5'>Jam</th><th className='px-3 py-2.5'>Durasi</th>
                        <th className='px-3 py-2.5'>Jenis Task</th><th className='px-3 py-2.5'>Catatan</th>{canEdit && <th className='px-5 py-2.5 text-right'>Aksi</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedTasks.map(t => (
                        <tr key={t.id} className='border-b border-gray-50'>
                          <td className='px-5 py-2.5 font-medium text-gray-700'>{dayLabel(t.day)}</td>
                          <td className='px-3 py-2.5 tabular-nums text-gray-600'>{t.start}-{t.end}</td>
                          <td className='px-3 py-2.5 text-gray-600'>{fmtHours(durationHours(t.start, t.end))} jam</td>
                          <td className='px-3 py-2.5'>
                            <StatusBadge tone={t.teaching ? 'success' : 'info'}>{typeName(t.taskTypeId)}</StatusBadge>
                            {t.teaching && t.subject && <div className='mt-1 text-xs font-semibold text-indigo-700'>{t.subject}</div>}
                            {t.createdByName && <div className='mt-0.5 text-[11px] text-gray-400'>oleh {t.createdByName}</div>}
                          </td>
                          <td className='px-3 py-2.5 text-xs text-gray-500'>{t.note || '-'}</td>
                          {canEdit && (
                            <td className='px-5 py-2.5 text-right'>
                              <button onClick={() => openEdit(t)} className='mr-3 text-xs font-semibold text-teal-700 hover:underline'>Ubah</button>
                              <button onClick={() => doDeleteTask(selected.emp.id, t.id)} className='text-xs font-semibold text-red-600 hover:underline'>Hapus</button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </SectionCard>
            </div>
          )}
        </div>
      )}

      {form && selected && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4' onClick={() => setForm(null)}>
          <div className='w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl' onClick={e => e.stopPropagation()}>
            <div className='mb-4 flex items-start justify-between'>
              <div>
                <h3 className='text-base font-bold text-gray-800'>{form.id ? 'Ubah Task' : 'Tambah Task'}</h3>
                <p className='text-xs text-gray-400'>{selected.emp.name} · {positionName(selected.emp)}</p>
                <p className='text-[11px] text-teal-700'>{weekly ? `Berlaku untuk minggu ${fmtRange(monday)}` : 'Berlaku untuk pola default (setiap minggu)'}</p>
              </div>
              <button onClick={() => setForm(null)} className='text-xl font-bold leading-none text-gray-400 hover:text-gray-600'>×</button>
            </div>
            <div className='space-y-4'>
              <FormField label='Jenis Task' required>
                <Select value={form.taskTypeId} onChange={e => setForm({ ...form, taskTypeId: e.target.value, error: '' })}>
                  {activeTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </Select>
              </FormField>
              {isTeachingType(form.taskTypeId) && (
                <FormField label='Mata pelajaran dan kelas yang diampu' required hint='Dihitung sebagai jam mengajar guru ini, bukan task tambahan.'>
                  <Input list='jla-subjects' value={form.subject} placeholder='mis. Pendidikan Agama Katolik 7A'
                    onChange={e => setForm({ ...form, subject: e.target.value, error: '' })} />
                  <datalist id='jla-subjects'>{subjectOptions.map(o => <option key={o} value={o} />)}</datalist>
                </FormField>
              )}
              <div>
                <span className='mb-1.5 block text-xs font-semibold text-gray-600'>Hari <span className='text-red-500'>*</span></span>
                <div className='flex flex-wrap gap-2'>
                  {DAYS.map(d => {
                    const on = form.days.includes(d.key)
                    return (
                      <button key={d.key} type='button' disabled={!!form.id && !on}
                        onClick={() => setForm(f => ({ ...f, error: '', days: f.days.includes(d.key) ? f.days.filter(x => x !== d.key) : [...f.days, d.key] }))}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold ring-1 transition disabled:opacity-30 ${on ? 'bg-teal-600 text-white ring-teal-600' : 'bg-white text-gray-600 ring-gray-200 hover:bg-gray-50'}`}>
                        {d.label}
                      </button>
                    )
                  })}
                </div>
                {!form.id && <p className='mt-1 text-[11px] text-gray-400'>Pilih beberapa hari untuk menambah task yang sama sekaligus.</p>}
              </div>
              <div className='grid grid-cols-2 gap-3'>
                <FormField label='Jam Mulai' required>
                  <Select value={form.start} onChange={e => setForm({ ...form, start: e.target.value, error: '' })}>
                    {options.slice(0, -1).map(o => <option key={o} value={o}>{o}</option>)}
                  </Select>
                </FormField>
                <FormField label='Jam Selesai' required>
                  <Select value={form.end} onChange={e => setForm({ ...form, end: e.target.value, error: '' })}>
                    {options.slice(1).map(o => <option key={o} value={o}>{o}</option>)}
                  </Select>
                </FormField>
              </div>
              <FormField label='Catatan'>
                <Input value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder='Opsional' />
              </FormField>
              {form.error && <div className='rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 ring-1 ring-red-200'>{form.error}</div>}
              <p className='text-[11px] text-gray-500'>
                Durasi {fmtHours(durationHours(form.start, form.end))} jam x {form.days.length} hari = <b>{fmtHours(durationHours(form.start, form.end) * form.days.length)} jam</b> per minggu.
              </p>
            </div>
            <div className='mt-5 flex gap-2'>
              {form.id && <ActionButton variant='danger' onClick={() => { doDeleteTask(selected.emp.id, form.id); setForm(null) }}>Hapus</ActionButton>}
              <ActionButton variant='secondary' className='flex-1' onClick={() => setForm(null)}>Batal</ActionButton>
              <ActionButton className='flex-1' onClick={save}>Terapkan</ActionButton>
            </div>
          </div>
        </div>
      )}

      {blockDialog && selected && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4' onClick={() => setBlockDialog(null)}>
          <div className='w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl' onClick={e => e.stopPropagation()}>
            <h3 className='text-base font-bold text-gray-800'>Blok jam mengajar</h3>
            <p className='mb-3 text-xs text-gray-400'>{selected.emp.name} · {positionName(selected.emp)}</p>
            <div className='rounded-xl bg-sky-50 px-4 py-3 text-sm text-sky-900'>
              <div className='font-semibold'>{blockDialog.label}</div>
              <div className='text-xs'>{dayLabel(blockDialog.day)}, {blockDialog.start}-{blockDialog.end} ({fmtHours(durationHours(blockDialog.start, blockDialog.end))} jam)</div>
            </div>
            <p className='mt-3 text-xs text-gray-500'>{weekly
              ? `Hanya berlaku untuk minggu ${fmtRange(monday)}. Pola default dan minggu lain tidak berubah.`
              : 'Blok ini bagian dari pola default dan berlaku setiap minggu yang belum disesuaikan. Menghapusnya juga mengubah perhitungan plan dan realisasi.'}</p>
            <div className='mt-4 flex gap-2'>
              <ActionButton variant='secondary' className='flex-1' onClick={() => setBlockDialog(null)}>Batal</ActionButton>
              <ActionButton variant='danger' className='flex-1' onClick={() => { doDeleteBlock(selected.emp.id, blockDialog.id); setBlockDialog(null) }}>Hapus Blok</ActionButton>
            </div>
          </div>
        </div>
      )}

      {clearDialog && selected && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4' onClick={() => setClearDialog(null)}>
          <div className='w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl' onClick={e => e.stopPropagation()}>
            <h3 className='text-base font-bold text-gray-800'>Kosongkan jadwal minggu</h3>
            <p className='mb-3 text-xs text-gray-400'>{selected.emp.name} · {positionName(selected.emp)}</p>
            <div className='space-y-2'>
              <label className='flex cursor-pointer items-start gap-2 rounded-xl border border-gray-200 p-3 text-sm'>
                <input type='checkbox' className='mt-0.5 accent-red-600' checked={clearDialog.blocks} disabled={weekBlocks.length === 0}
                  onChange={e => setClearDialog({ ...clearDialog, blocks: e.target.checked })} />
                <span><b>Jam mengajar tetap</b><span className='block text-xs text-gray-500'>{weekBlocks.length} blok ({fmtHours(weekBlocks.reduce((s, b) => s + durationHours(b.start, b.end), 0))} jam)</span></span>
              </label>
              <label className='flex cursor-pointer items-start gap-2 rounded-xl border border-gray-200 p-3 text-sm'>
                <input type='checkbox' className='mt-0.5 accent-red-600' checked={clearDialog.tasks} disabled={weekTasks.length === 0}
                  onChange={e => setClearDialog({ ...clearDialog, tasks: e.target.checked })} />
                <span><b>Task tambahan</b><span className='block text-xs text-gray-500'>{weekTasks.length} blok, termasuk mengajar perbantuan</span></span>
              </label>
            </div>
            <p className='mt-3 text-xs text-gray-500'>{weekly
              ? `Hanya minggu ${fmtRange(monday)} yang dikosongkan. Pola default dan minggu lain tidak berubah; "Kembali ke Default" mengembalikannya.`
              : 'Ini pola default, jadi semua minggu yang belum disesuaikan ikut kosong. Realisasi minggu-minggu lalu yang memakai pola ini ikut berubah. Tidak bisa dibatalkan.'}</p>
            <div className='mt-4 flex gap-2'>
              <ActionButton variant='secondary' className='flex-1' onClick={() => setClearDialog(null)}>Batal</ActionButton>
              <ActionButton variant='danger' className='flex-1' disabled={!clearDialog.blocks && !clearDialog.tasks}
                onClick={() => { doClear(selected.emp.id, { blocks: clearDialog.blocks, tasks: clearDialog.tasks }); setClearDialog(null) }}>Kosongkan</ActionButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Chip({ label, value, tone }) {
  const toneCls = tone === 'ok' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : tone === 'warn' ? 'bg-amber-50 text-amber-700 ring-amber-200' : 'bg-gray-50 text-gray-700 ring-gray-100'
  return (
    <div className={`rounded-xl px-3 py-2.5 ring-1 ${toneCls}`}>
      <div className='text-[11px] font-semibold opacity-70'>{label}</div>
      <div className='text-base font-bold'>{value}</div>
    </div>
  )
}
