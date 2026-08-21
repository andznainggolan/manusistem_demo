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
const STATUSES = ['Planned', 'Approved', 'Rejected', 'Cancelled']
const toneOf = (status) => status === 'Approved' ? 'success' : status === 'Rejected' ? 'danger' : status === 'Cancelled' ? 'neutral' : 'warning'
const BLANK = { employeeId: '', date: todayStr(), plannedHours: '', reason: '', status: 'Planned' }

export default function OvertimePlanEmployeePage() {
  const t = useT()
  const { plansEmployee, addPlanEmployee, updatePlanEmployee, deletePlanEmployee } = useOvertimeStore()
  const { employees } = useEmployeeStore()

  const [q, setQ] = useState('')
  const [form, setForm] = useState(BLANK)
  const [editing, setEditing] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [msg, setMsg] = useState(null)

  const flash = (text, type = 'success') => { setMsg({ text, type }); setTimeout(() => setMsg(null), 3000) }
  const activeEmps = useMemo(() => employees.filter(e => e.status === 'Active').sort((a, b) => a.name.localeCompare(b.name)), [employees])

  const rows = useMemo(() => [...plansEmployee].sort((a, b) => b.date.localeCompare(a.date)), [plansEmployee])
  const needle = q.trim().toLowerCase()
  const shown = needle ? rows.filter(r => r.name.toLowerCase().includes(needle)) : rows

  const totalHours = plansEmployee.reduce((a, r) => a + (Number(r.plannedHours) || 0), 0)
  const approvedCount = plansEmployee.filter(r => r.status === 'Approved').length

  const openNew = () => { setEditing(null); setForm(BLANK); setShowModal(true) }
  const closeModal = () => { setShowModal(false); setEditing(null); setForm(BLANK) }

  const openEdit = (r) => {
    setEditing(r.id)
    setForm({ employeeId: String(r.employeeId), date: r.date, plannedHours: r.plannedHours, reason: r.reason || '', status: r.status })
    setShowModal(true)
  }

  const handleSave = () => {
    if (!form.employeeId || !form.date || !form.plannedHours)
      return flash(t('Karyawan, tanggal, dan jam rencana wajib diisi.', 'Employee, date, and planned hours are required.'), 'error')
    const emp = employees.find(e => e.id === +form.employeeId)
    const payload = {
      employeeId: +form.employeeId, name: emp?.name || '',
      date: form.date, plannedHours: Number(form.plannedHours), reason: form.reason.trim(), status: form.status,
    }
    if (editing) { updatePlanEmployee(editing, payload); flash(t('Rencana lembur diperbarui.', 'Overtime plan updated.')) }
    else         { addPlanEmployee(payload);            flash(t('Rencana lembur ditambahkan.', 'Overtime plan added.')) }
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
        icon='⏱️'
        title={t('Overtime Plan by Employee', 'Overtime Plan by Employee')}
        subtitle={t('Rencanakan jam lembur per karyawan sebelum pelaksanaan.', "Plan each employee's overtime hours ahead of time.")}
      />

      <div className='mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3'>
        <StatCard tone='brand' icon='⏱️' label={t('Total Rencana', 'Total Plans')} value={String(plansEmployee.length)} />
        <StatCard tone='blue'  icon='🕒' label={t('Total Jam Rencana', 'Total Planned Hours')} value={String(totalHours)} />
        <StatCard tone='green' icon='✅' label={t('Disetujui', 'Approved')} value={String(approvedCount)} />
      </div>

      <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='max-w-sm flex-1'>
          <SearchBar value={q} onChange={setQ} placeholder={t('Cari nama karyawan…', 'Search employee name…')} />
        </div>
        <button onClick={openNew}
          className='flex items-center gap-1.5 whitespace-nowrap rounded-lg px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:opacity-90'
          style={{ background: 'linear-gradient(135deg,#052B52,#039299)' }}>
          + {t('Tambah Rencana', 'Add Plan')}
        </button>
      </div>

      <SectionCard bodyClass='p-0'>
        {shown.length === 0 ? (
          <div className='p-5'>
            <EmptyState icon='⏱️' title={t('Belum ada rencana lembur.', 'No overtime plans yet.')} />
          </div>
        ) : (
          <DataTable
            className='rounded-none shadow-none ring-0'
            columns={[
              t('Karyawan', 'Employee'), t('Tanggal', 'Date'),
              { label: t('Jam Rencana', 'Planned Hours'), align: 'right' },
              t('Alasan', 'Reason'), 'Status', { label: t('Aksi', 'Action'), align: 'right' },
            ]}
          >
            {shown.map(r => (
              <Tr key={r.id}>
                <Td className='font-semibold text-gray-800'>{r.name}</Td>
                <Td className='text-xs tabular-nums text-gray-500'>{r.date}</Td>
                <Td align='right'>{r.plannedHours} {t('jam', 'hrs')}</Td>
                <Td className='max-w-xs truncate text-xs text-gray-500'>{r.reason || '—'}</Td>
                <Td><StatusBadge tone={toneOf(r.status)}>{r.status}</StatusBadge></Td>
                <Td align='right'>
                  <div className='flex justify-end gap-2'>
                    <ActionButton size='sm' variant='secondary' onClick={() => openEdit(r)}>{t('Edit', 'Edit')}</ActionButton>
                    <button onClick={() => { deletePlanEmployee(r.id); flash(t('Rencana dihapus.', 'Plan deleted.')) }}
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
                {editing ? t('Edit Rencana Lembur', 'Edit Overtime Plan') : t('Tambah Rencana Lembur', 'Add Overtime Plan')}
              </h2>
              <button onClick={closeModal} className='text-xl font-bold leading-none text-gray-400 hover:text-gray-600'>×</button>
            </div>
            <div className='space-y-4 px-6 py-5'>
              <FormField label={t('Karyawan', 'Employee')} required>
                <Select value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))}>
                  <option value=''>— {t('Pilih Karyawan', 'Select Employee')} —</option>
                  {activeEmps.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </Select>
              </FormField>
              <FormField label={t('Tanggal', 'Date')} required>
                <Input type='date' value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </FormField>
              <FormField label={t('Jam Rencana', 'Planned Hours')} required>
                <Input type='number' min='0' step='0.5' value={form.plannedHours}
                  onChange={e => setForm(f => ({ ...f, plannedHours: e.target.value }))} />
              </FormField>
              <FormField label={t('Alasan', 'Reason')}>
                <Input value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} />
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
