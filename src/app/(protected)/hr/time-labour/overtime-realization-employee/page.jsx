'use client'
import { useState, useMemo } from 'react'
import { useOvertimeStore } from '@/store/overtimeStore'
import { useEmployeeStore } from '@/store/employeeStore'
import { useT } from '@/store/languageStore'
import {
  PageHeader, StatCard, SectionCard, DataTable, Tr, Td, SearchBar,
  FormField, Input, Select, ActionButton, StatusBadge, EmptyState,
} from '@/components/ui'

const todayStr = () => new Date().toISOString().slice(0, 10)
const STATUSES = ['Pending', 'Verified', 'Rejected']
const toneOf = (status) => status === 'Verified' ? 'success' : status === 'Rejected' ? 'danger' : 'warning'
const BLANK = { employeeId: '', date: todayStr(), planId: '', actualHours: '', notes: '', status: 'Pending' }

export default function OvertimeRealizationEmployeePage() {
  const t = useT()
  const { realizationsEmployee, plansEmployee, addRealizationEmployee, updateRealizationEmployee, deleteRealizationEmployee } = useOvertimeStore()
  const { employees } = useEmployeeStore()

  const [q, setQ] = useState('')
  const [form, setForm] = useState(BLANK)
  const [editing, setEditing] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [msg, setMsg] = useState(null)

  const flash = (text, type = 'success') => { setMsg({ text, type }); setTimeout(() => setMsg(null), 3000) }
  const activeEmps = useMemo(() => employees.filter(e => e.status === 'Active').sort((a, b) => a.name.localeCompare(b.name)), [employees])
  const plansForForm = useMemo(() => form.employeeId ? plansEmployee.filter(p => p.employeeId === +form.employeeId) : [], [form.employeeId, plansEmployee])

  const rows = useMemo(() => [...realizationsEmployee].sort((a, b) => b.date.localeCompare(a.date)), [realizationsEmployee])
  const needle = q.trim().toLowerCase()
  const shown = needle ? rows.filter(r => r.name.toLowerCase().includes(needle)) : rows

  const totalActual = realizationsEmployee.reduce((a, r) => a + (Number(r.actualHours) || 0), 0)
  const totalPlanned = realizationsEmployee.reduce((a, r) => a + (Number(r.plannedHours) || 0), 0)
  const variance = totalActual - totalPlanned

  const openNew = () => { setEditing(null); setForm(BLANK); setShowModal(true) }
  const closeModal = () => { setShowModal(false); setEditing(null); setForm(BLANK) }

  const openEdit = (r) => {
    setEditing(r.id)
    setForm({
      employeeId: String(r.employeeId), date: r.date, planId: r.planId ? String(r.planId) : '',
      actualHours: r.actualHours, notes: r.notes || '', status: r.status,
    })
    setShowModal(true)
  }

  const onPickPlan = (planId) => {
    const plan = plansEmployee.find(p => p.id === +planId)
    setForm(f => ({ ...f, planId, date: plan ? plan.date : f.date }))
  }

  const handleSave = () => {
    if (!form.employeeId || !form.date || form.actualHours === '')
      return flash(t('Karyawan, tanggal, dan jam aktual wajib diisi.', 'Employee, date, and actual hours are required.'), 'error')
    const emp = employees.find(e => e.id === +form.employeeId)
    const plan = form.planId ? plansEmployee.find(p => p.id === +form.planId) : null
    const payload = {
      employeeId: +form.employeeId, name: emp?.name || '', date: form.date,
      planId: form.planId ? +form.planId : null, plannedHours: plan ? plan.plannedHours : null,
      actualHours: Number(form.actualHours), notes: form.notes.trim(), status: form.status,
    }
    if (editing) { updateRealizationEmployee(editing, payload); flash(t('Realisasi lembur diperbarui.', 'Overtime realization updated.')) }
    else         { addRealizationEmployee(payload);             flash(t('Realisasi lembur ditambahkan.', 'Overtime realization added.')) }
    closeModal()
  }

  return (
    <div>
      {msg && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl px-5 py-3 text-sm font-semibold shadow-xl
          ${msg.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
          {msg.type === 'error' ? '⚠' : '✓'} {msg.text}
        </div>
      )}

      <PageHeader
        icon='✅'
        title={t('Overtime Realization by Employee', 'Overtime Realization by Employee')}
        subtitle={t('Catat jam lembur yang benar-benar terealisasi per karyawan.', "Record each employee's actually realized overtime hours.")}
      />

      <div className='mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3'>
        <StatCard tone='brand' icon='✅' label={t('Total Realisasi', 'Total Realizations')} value={String(realizationsEmployee.length)} />
        <StatCard tone='blue'  icon='🕒' label={t('Total Jam Aktual', 'Total Actual Hours')} value={String(totalActual)} />
        <StatCard tone={variance > 0 ? 'red' : 'green'} icon={variance > 0 ? '⚠️' : '📊'}
          label={t('Selisih vs Rencana', 'Variance vs Plan')} value={`${variance > 0 ? '+' : ''}${variance}`}
          hint={t('Hanya dari yang tertaut rencana', 'Only for plan-linked rows')} />
      </div>

      <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='max-w-sm flex-1'>
          <SearchBar value={q} onChange={setQ} placeholder={t('Cari nama karyawan…', 'Search employee name…')} />
        </div>
        <button onClick={openNew}
          className='flex items-center gap-1.5 whitespace-nowrap rounded-lg px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:opacity-90'
          style={{ background: 'linear-gradient(135deg,#052B52,#039299)' }}>
          + {t('Tambah Realisasi', 'Add Realization')}
        </button>
      </div>

      <SectionCard bodyClass='p-0'>
        {shown.length === 0 ? (
          <div className='p-5'>
            <EmptyState icon='✅' title={t('Belum ada realisasi lembur.', 'No overtime realizations yet.')} />
          </div>
        ) : (
          <DataTable
            className='rounded-none shadow-none ring-0'
            columns={[
              t('Karyawan', 'Employee'), t('Tanggal', 'Date'),
              { label: t('Jam Rencana', 'Planned'), align: 'right' },
              { label: t('Jam Aktual', 'Actual'), align: 'right' },
              'Status', { label: t('Aksi', 'Action'), align: 'right' },
            ]}
          >
            {shown.map(r => (
              <Tr key={r.id}>
                <Td className='font-semibold text-gray-800'>{r.name}</Td>
                <Td className='text-xs tabular-nums text-gray-500'>{r.date}</Td>
                <Td align='right' className='text-xs text-gray-400'>{r.plannedHours != null ? `${r.plannedHours} ${t('jam', 'hrs')}` : '—'}</Td>
                <Td align='right' className='font-semibold'>{r.actualHours} {t('jam', 'hrs')}</Td>
                <Td><StatusBadge tone={toneOf(r.status)}>{r.status}</StatusBadge></Td>
                <Td align='right'>
                  <div className='flex justify-end gap-2'>
                    <ActionButton size='sm' variant='secondary' onClick={() => openEdit(r)}>{t('Edit', 'Edit')}</ActionButton>
                    <button onClick={() => { deleteRealizationEmployee(r.id); flash(t('Realisasi dihapus.', 'Realization deleted.')) }}
                      className='rounded-xl bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100'>
                      {t('Hapus', 'Delete')}
                    </button>
                  </div>
                </Td>
              </Tr>
            ))}
          </DataTable>
        )}
      </SectionCard>

      {showModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4' onClick={closeModal}>
          <div className='w-full max-w-md rounded-2xl bg-white shadow-2xl' onClick={e => e.stopPropagation()}>
            <div className='flex items-center justify-between border-b border-gray-100 px-6 py-4'>
              <h2 className='text-base font-bold text-gray-800'>
                {editing ? t('Edit Realisasi Lembur', 'Edit Overtime Realization') : t('Tambah Realisasi Lembur', 'Add Overtime Realization')}
              </h2>
              <button onClick={closeModal} className='text-xl font-bold leading-none text-gray-400 hover:text-gray-600'>×</button>
            </div>
            <div className='space-y-4 px-6 py-5'>
              <FormField label={t('Karyawan', 'Employee')} required>
                <Select value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value, planId: '' }))}>
                  <option value=''>— {t('Pilih Karyawan', 'Select Employee')} —</option>
                  {activeEmps.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </Select>
              </FormField>
              <FormField label={t('Tautkan ke Rencana', 'Link to Plan')}
                hint={t('Opsional — otomatis isi tanggal dari rencana.', 'Optional — auto-fills the date from the plan.')}>
                <Select value={form.planId} onChange={e => onPickPlan(e.target.value)} disabled={!form.employeeId}>
                  <option value=''>— {t('Tanpa Rencana', 'No Plan')} —</option>
                  {plansForForm.map(p => <option key={p.id} value={p.id}>{p.date} · {p.plannedHours} {t('jam', 'hrs')}</option>)}
                </Select>
              </FormField>
              <FormField label={t('Tanggal', 'Date')} required>
                <Input type='date' value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </FormField>
              <FormField label={t('Jam Aktual', 'Actual Hours')} required>
                <Input type='number' min='0' step='0.5' value={form.actualHours}
                  onChange={e => setForm(f => ({ ...f, actualHours: e.target.value }))} />
              </FormField>
              <FormField label={t('Catatan', 'Notes')}>
                <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </FormField>
              <FormField label='Status'>
                <Select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </Select>
              </FormField>
            </div>
            <div className='flex gap-3 px-6 pb-5'>
              <ActionButton onClick={handleSave} className='flex-1' icon='💾'>{t('Simpan', 'Save')}</ActionButton>
              <ActionButton variant='secondary' onClick={closeModal} className='flex-1'>{t('Batal', 'Cancel')}</ActionButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
