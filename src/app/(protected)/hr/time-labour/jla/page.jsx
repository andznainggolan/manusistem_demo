'use client'
import { useMemo, useState } from 'react'
import { useEmployeeStore } from '@/store/employeeStore'
import { useStructureStore } from '@/store/structureStore'
import { useJlaStore, WORKER_CATEGORIES, PAYROLL_MODES } from '@/store/jlaStore'
import { DAYS, toMin, toHHMM, findConflict, fmtHours, durationHours, weekSummary } from '@/lib/jla'
import JlaBoard from '@/components/jla/JlaBoard'
import { PageHeader, SectionCard, FormField, Input, Select, ActionButton, StatusBadge } from '@/components/ui'

const TABS = [
  { key: 'ringkasan', label: 'Ringkasan' },
  { key: 'pengaturan', label: 'Pengaturan' },
  { key: 'kategori', label: 'Kategori Pekerja' },
  { key: 'mengajar', label: 'Jadwal Mengajar' },
]

export default function HrJlaPage() {
  const [tab, setTab] = useState('ringkasan')
  return (
    <div>
      <PageHeader
        icon='🗓️'
        title='Job Load Analysis (JLA)'
        subtitle='Atur kategori pekerja, target jam kerja guru, jadwal mengajar, dan cara payroll memakai jam kerja. Task ditambahkan oleh kepala sekolah atau atasan langsung.'
      />
      <div className='mb-6 flex flex-wrap gap-2'>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${tab === t.key ? 'bg-[#052B52] text-white shadow' : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'}`}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'ringkasan' && <JlaBoard scope='all' />}
      {tab === 'pengaturan' && <SettingsTab />}
      {tab === 'kategori' && <CategoryTab />}
      {tab === 'mengajar' && <TeachingTab />}
    </div>
  )
}

function SettingsTab() {
  const { settings, taskTypes, updateSettings, addTaskType, updateTaskType } = useJlaStore()
  const [name, setName] = useState('')
  const [teaching, setTeaching] = useState(false)
  const hourOptions = []
  for (let m = 5 * 60; m <= 22 * 60; m += 30) hourOptions.push(toHHMM(m))
  return (
    <div className='grid grid-cols-1 gap-6 xl:grid-cols-2'>
      <SectionCard title='Target dan Jam Kerja' icon='⏱️' subtitle='Berlaku untuk pekerja kategori Guru'>
        <div className='space-y-4'>
          <FormField label='Target jam kerja per minggu' hint='Jam mengajar ditambah task harus mencapai angka ini.'>
            <Input type='number' min={1} max={80} value={settings.targetHours}
              onChange={e => updateSettings({ targetHours: Math.max(1, Number(e.target.value) || 1) })} />
          </FormField>
          <div className='grid grid-cols-2 gap-3'>
            <FormField label='Jam kerja efektif mulai'>
              <Select value={settings.windowStart} onChange={e => updateSettings({ windowStart: e.target.value })}>
                {hourOptions.filter(o => toMin(o) < toMin(settings.windowEnd)).map(o => <option key={o} value={o}>{o}</option>)}
              </Select>
            </FormField>
            <FormField label='Jam kerja efektif selesai'>
              <Select value={settings.windowEnd} onChange={e => updateSettings({ windowEnd: e.target.value })}>
                {hourOptions.filter(o => toMin(o) > toMin(settings.windowStart)).map(o => <option key={o} value={o}>{o}</option>)}
              </Select>
            </FormField>
          </div>
          <p className='text-xs text-gray-400'>Rentang ini menjadi area jadwal yang bisa diisi task oleh kepala sekolah.</p>
        </div>
      </SectionCard>

      <SectionCard title='Pemakaian di Payroll' icon='💵' subtitle='Pilih satu mode'>
        <div className='space-y-3'>
          {PAYROLL_MODES.map(m => (
            <label key={m.value}
              className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition ${settings.payrollMode === m.value ? 'border-teal-300 bg-teal-50' : 'border-gray-200 hover:bg-gray-50'}`}>
              <input type='radio' name='payrollMode' className='mt-1 h-4 w-4 accent-teal-700' checked={settings.payrollMode === m.value}
                onChange={() => updateSettings({ payrollMode: m.value })} />
              <span>
                <span className='block text-sm font-semibold text-gray-800'>{m.label}</span>
                <span className='block text-xs text-gray-500'>{m.hint}</span>
              </span>
            </label>
          ))}
          <p className='text-xs text-gray-400'>Setelah mengganti mode, buka Payroll Run dan klik "Hitung Ulang dari JLA" untuk periode Draft.</p>
        </div>
      </SectionCard>

      <SectionCard title='Jenis Task' icon='📋' subtitle='Daftar pilihan saat kepala sekolah atau atasan langsung menambah task' className='xl:col-span-2'>
        <div className='flex flex-wrap gap-2'>
          {taskTypes.map(t => (
            <button key={t.id} type='button' onClick={() => updateTaskType(t.id, { active: !t.active })}
              title={t.active ? 'Klik untuk menonaktifkan' : 'Klik untuk mengaktifkan'}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition ${t.active ? 'bg-teal-50 text-teal-700 ring-teal-200' : 'bg-gray-100 text-gray-400 line-through ring-gray-200'}`}>
              {t.name}{t.teaching ? ' (jam mengajar)' : ''}
            </button>
          ))}
        </div>
        <div className='mt-4 flex max-w-md gap-2'>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder='Nama jenis task baru' />
          <ActionButton onClick={() => { if (name.trim()) { addTaskType(name, teaching); setName(''); setTeaching(false) } }}>Tambah</ActionButton>
        </div>
        <label className='mt-2 flex max-w-md items-start gap-2 text-xs text-gray-500'>
          <input type='checkbox' className='mt-0.5 accent-teal-700' checked={teaching} onChange={e => setTeaching(e.target.checked)} />
          <span>Dihitung sebagai jam mengajar: guru mengampu mata pelajaran lain (perbantuan) dan mengisi nama mata pelajaran saat menugaskan.</span>
        </label>
      </SectionCard>
    </div>
  )
}

function CategoryTab() {
  const { employees } = useEmployeeStore()
  const { positions, departments } = useStructureStore()
  const { categories, setCategory } = useJlaStore()
  const list = employees.filter(e => e.status === 'Active')
  const guru = list.filter(e => categories[e.id] === 'Guru').length
  return (
    <SectionCard title='Kategori Pekerja' icon='🏷️' subtitle={`Guru: ${guru}  |  Employee: ${list.length - guru}`} bodyClass='p-0'>
      <table className='w-full text-sm'>
        <thead>
          <tr className='border-b border-gray-100 text-left text-[11px] font-bold uppercase tracking-wide text-gray-400'>
            <th className='px-5 py-2.5'>Nama</th><th className='px-3 py-2.5'>Jabatan</th><th className='px-3 py-2.5'>Departemen</th>
            <th className='px-3 py-2.5'>Tipe</th><th className='px-5 py-2.5'>Kategori</th>
          </tr>
        </thead>
        <tbody>
          {list.map(e => (
            <tr key={e.id} className='border-b border-gray-50'>
              <td className='px-5 py-2 font-medium text-gray-800'>{e.name}</td>
              <td className='px-3 py-2 text-gray-600'>{positions.find(p => p.id === e.positionId)?.name || e.position}</td>
              <td className='px-3 py-2 text-gray-500'>{departments.find(d => d.id === e.departmentId)?.name || e.department}</td>
              <td className='px-3 py-2 text-gray-500'>{e.employmentType}</td>
              <td className='px-5 py-2'>
                <Select value={categories[e.id] || 'Employee'} onChange={ev => setCategory(e.id, ev.target.value)} className='!py-1.5 !text-xs'>
                  {WORKER_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </SectionCard>
  )
}

function TeachingTab() {
  const { employees } = useEmployeeStore()
  const { settings, categories, teachingBlocks, tasks, addTeachingBlock, deleteTeachingBlock } = useJlaStore()
  const gurus = useMemo(() => employees.filter(e => e.status === 'Active' && categories[e.id] === 'Guru'), [employees, categories])
  const [empId, setEmpId] = useState('')
  const current = Number(empId) || gurus[0]?.id
  const [form, setForm] = useState({ day: 'Monday', start: '07:00', end: '08:00', label: '', error: '' })
  const blocks = teachingBlocks.filter(b => b.employeeId === current)
    .sort((a, b) => DAYS.findIndex(d => d.key === a.day) - DAYS.findIndex(d => d.key === b.day) || toMin(a.start) - toMin(b.start))
  const sum = current ? weekSummary(current, teachingBlocks, tasks, settings.targetHours) : null
  const options = []
  for (let m = 5 * 60; m <= 20 * 60; m += 30) options.push(toHHMM(m))

  const add = () => {
    if (!current) return
    if (!form.label.trim()) return setForm({ ...form, error: 'Isi nama mata pelajaran atau kelas.' })
    if (toMin(form.end) <= toMin(form.start)) return setForm({ ...form, error: 'Jam selesai harus setelah jam mulai.' })
    const c = findConflict(current, form.day, form.start, form.end, teachingBlocks, tasks)
    if (c) return setForm({ ...form, error: `Bentrok dengan ${c.kind === 'mengajar' ? c.label : 'task'} ${c.start}-${c.end}.` })
    addTeachingBlock({ employeeId: current, day: form.day, start: form.start, end: form.end, label: form.label.trim() })
    setForm({ ...form, label: '', error: '' })
  }

  return (
    <div className='grid grid-cols-1 gap-6 xl:grid-cols-[1fr_340px]'>
      <SectionCard title='Jadwal Mengajar Tetap' icon='📚'
        subtitle='Jam mengajar tiap guru: masuk dan keluar tetap, dapat lebih dari satu blok per hari'
        actions={
          <Select value={current || ''} onChange={e => setEmpId(e.target.value)} className='!py-1.5 !text-xs'>
            {gurus.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </Select>
        } bodyClass='p-0'>
        {sum && (
          <div className='flex flex-wrap gap-3 border-b border-gray-100 px-5 py-3 text-xs text-gray-600'>
            <StatusBadge tone='info'>Mengajar {fmtHours(sum.teaching)} jam</StatusBadge>
            <StatusBadge tone='neutral'>Task {fmtHours(sum.task)} jam</StatusBadge>
            <StatusBadge tone={sum.achieved ? 'success' : 'warning'}>Total {fmtHours(sum.total)} / {settings.targetHours} jam</StatusBadge>
          </div>
        )}
        <table className='w-full text-sm'>
          <thead>
            <tr className='border-b border-gray-100 text-left text-[11px] font-bold uppercase tracking-wide text-gray-400'>
              <th className='px-5 py-2.5'>Hari</th><th className='px-3 py-2.5'>Jam</th><th className='px-3 py-2.5'>Durasi</th>
              <th className='px-3 py-2.5'>Mata pelajaran / kelas</th><th className='px-5 py-2.5 text-right'>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {blocks.map(b => (
              <tr key={b.id} className='border-b border-gray-50'>
                <td className='px-5 py-2 font-medium text-gray-700'>{DAYS.find(d => d.key === b.day)?.label}</td>
                <td className='px-3 py-2 tabular-nums text-gray-600'>{b.start}-{b.end}</td>
                <td className='px-3 py-2 text-gray-600'>{fmtHours(durationHours(b.start, b.end))} jam</td>
                <td className='px-3 py-2 text-gray-600'>{b.label}</td>
                <td className='px-5 py-2 text-right'>
                  <button onClick={() => deleteTeachingBlock(b.id)} className='text-xs font-semibold text-red-600 hover:underline'>Hapus</button>
                </td>
              </tr>
            ))}
            {blocks.length === 0 && <tr><td colSpan={5} className='px-5 py-6 text-center text-sm text-gray-400'>Belum ada jadwal mengajar.</td></tr>}
          </tbody>
        </table>
      </SectionCard>

      <SectionCard title='Tambah Blok Mengajar' icon='➕'>
        <div className='space-y-3'>
          <FormField label='Hari'>
            <Select value={form.day} onChange={e => setForm({ ...form, day: e.target.value, error: '' })}>
              {DAYS.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
            </Select>
          </FormField>
          <div className='grid grid-cols-2 gap-3'>
            <FormField label='Mulai'>
              <Select value={form.start} onChange={e => setForm({ ...form, start: e.target.value, error: '' })}>
                {options.slice(0, -1).map(o => <option key={o} value={o}>{o}</option>)}
              </Select>
            </FormField>
            <FormField label='Selesai'>
              <Select value={form.end} onChange={e => setForm({ ...form, end: e.target.value, error: '' })}>
                {options.slice(1).map(o => <option key={o} value={o}>{o}</option>)}
              </Select>
            </FormField>
          </div>
          <FormField label='Mata pelajaran / kelas'>
            <Input value={form.label} onChange={e => setForm({ ...form, label: e.target.value, error: '' })} placeholder='mis. Matematika 8A' />
          </FormField>
          {form.error && <div className='rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 ring-1 ring-red-200'>{form.error}</div>}
          <ActionButton className='w-full' onClick={add}>Tambah Blok</ActionButton>
        </div>
      </SectionCard>
    </div>
  )
}
