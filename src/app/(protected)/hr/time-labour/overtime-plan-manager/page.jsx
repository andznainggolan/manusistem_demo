'use client'
import { useState, useMemo } from 'react'
import { useOvertimeStore } from '@/store/overtimeStore'
import { useEmployeeStore } from '@/store/employeeStore'
import { useStructureStore } from '@/store/structureStore'
import { useT } from '@/store/languageStore'
import {
  PageHeader, StatCard, SectionCard, DataTable, Tr, Td, SearchBar,
  FormField, Input, Select, ActionButton, StatusBadge, EmptyState,
} from '@/components/ui'

const thisMonth = () => new Date().toISOString().slice(0, 7)
const STATUSES = ['Planned', 'Approved', 'Rejected', 'Cancelled']
const toneOf = (status) => status === 'Approved' ? 'success' : status === 'Rejected' ? 'danger' : status === 'Cancelled' ? 'neutral' : 'warning'
const BLANK = { managerId: '', period: thisMonth(), plannedHours: '', notes: '', status: 'Planned' }

export default function OvertimePlanManagerPage() {
  const t = useT()
  const { plansManager, addPlanManager, updatePlanManager, deletePlanManager } = useOvertimeStore()
  const { employees } = useEmployeeStore()
  const { departments } = useStructureStore()

  const [q, setQ] = useState('')
  const [form, setForm] = useState(BLANK)
  const [editing, setEditing] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [msg, setMsg] = useState(null)

  const flash = (text, type = 'success') => { setMsg({ text, type }); setTimeout(() => setMsg(null), 3000) }
  // Only employees someone actually reports to show up as "Manager" here.
  const managers = useMemo(() => {
    const managerIds = new Set(employees.map(e => e.managerId).filter(Boolean))
    return employees.filter(e => managerIds.has(e.id) && e.status === 'Active').sort((a, b) => a.name.localeCompare(b.name))
  }, [employees])
  const deptName = (id) => departments.find(d => d.id === id)?.name || '—'

  const rows = useMemo(() => [...plansManager].sort((a, b) => b.period.localeCompare(a.period)), [plansManager])
  const needle = q.trim().toLowerCase()
  const shown = needle ? rows.filter(r => r.name.toLowerCase().includes(needle)) : rows

  const totalHours = plansManager.reduce((a, r) => a + (Number(r.plannedHours) || 0), 0)
  const approvedCount = plansManager.filter(r => r.status === 'Approved').length

  const openNew = () => { setEditing(null); setForm(BLANK); setShowModal(true) }
  const closeModal = () => { setShowModal(false); setEditing(null); setForm(BLANK) }

  const openEdit = (r) => {
    setEditing(r.id)
    setForm({ managerId: String(r.managerId), period: r.period, plannedHours: r.plannedHours, notes: r.notes || '', status: r.status })
    setShowModal(true)
  }

  const handleSave = () => {
    if (!form.managerId || !form.period || !form.plannedHours)
      return flash(t('Manager, periode, dan jam rencana wajib diisi.', 'Manager, period, and planned hours are required.'), 'error')
    const mgr = employees.find(e => e.id === +form.managerId)
    const payload = {
      managerId: +form.managerId, name: mgr?.name || '', departmentId: mgr?.departmentId || null,
      period: form.period, plannedHours: Number(form.plannedHours), notes: form.notes.trim(), status: form.status,
    }
    if (editing) { updatePlanManager(editing, payload); flash(t('Rencana lembur tim diperbarui.', "Team overtime plan updated.")) }
    else         { addPlanManager(payload);             flash(t('Rencana lembur tim ditambahkan.', "Team overtime plan added.")) }
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
        icon='📋'
        title={t('Overtime Plan by Manager', 'Overtime Plan by Manager')}
        subtitle={t('Rencanakan anggaran jam lembur tim per manager, per periode.', "Plan each manager's team overtime hour budget, per period.")}
      />

      <div className='mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3'>
        <StatCard tone='brand' icon='📋' label={t('Total Rencana', 'Total Plans')} value={String(plansManager.length)} />
        <StatCard tone='blue'  icon='🕒' label={t('Total Jam Rencana', 'Total Planned Hours')} value={String(totalHours)} />
        <StatCard tone='green' icon='✅' label={t('Disetujui', 'Approved')} value={String(approvedCount)} />
      </div>

      <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='max-w-sm flex-1'>
          <SearchBar value={q} onChange={setQ} placeholder={t('Cari nama manager…', 'Search manager name…')} />
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
            <EmptyState icon='📋' title={t('Belum ada rencana lembur tim.', 'No team overtime plans yet.')} />
          </div>
        ) : (
          <DataTable
            className='rounded-none shadow-none ring-0'
            columns={[
              t('Manager', 'Manager'), t('Departemen', 'Department'), t('Periode', 'Period'),
              { label: t('Jam Rencana', 'Planned Hours'), align: 'right' },
              'Status', { label: t('Aksi', 'Action'), align: 'right' },
            ]}
          >
            {shown.map(r => (
              <Tr key={r.id}>
                <Td className='font-semibold text-gray-800'>{r.name}</Td>
                <Td className='text-xs text-gray-500'>{deptName(r.departmentId)}</Td>
                <Td className='text-xs tabular-nums text-gray-500'>{r.period}</Td>
                <Td align='right'>{r.plannedHours} {t('jam', 'hrs')}</Td>
                <Td><StatusBadge tone={toneOf(r.status)}>{r.status}</StatusBadge></Td>
                <Td align='right'>
                  <div className='flex justify-end gap-2'>
                    <ActionButton size='sm' variant='secondary' onClick={() => openEdit(r)}>{t('Edit', 'Edit')}</ActionButton>
                    <button onClick={() => { deletePlanManager(r.id); flash(t('Rencana dihapus.', 'Plan deleted.')) }}
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
                {editing ? t('Edit Rencana Lembur Tim', 'Edit Team Overtime Plan') : t('Tambah Rencana Lembur Tim', 'Add Team Overtime Plan')}
              </h2>
              <button onClick={closeModal} className='text-xl font-bold leading-none text-gray-400 hover:text-gray-600'>×</button>
            </div>
            <div className='space-y-4 px-6 py-5'>
              <FormField label={t('Manager', 'Manager')} required
                hint={t('Hanya karyawan yang punya bawahan yang muncul di sini.', 'Only employees with direct reports appear here.')}>
                <Select value={form.managerId} onChange={e => setForm(f => ({ ...f, managerId: e.target.value }))}>
                  <option value=''>— {t('Pilih Manager', 'Select Manager')} —</option>
                  {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </Select>
              </FormField>
              <FormField label={t('Periode', 'Period')} required>
                <Input type='month' value={form.period} onChange={e => setForm(f => ({ ...f, period: e.target.value }))} />
              </FormField>
              <FormField label={t('Jam Rencana', 'Planned Hours')} required>
                <Input type='number' min='0' step='0.5' value={form.plannedHours}
                  onChange={e => setForm(f => ({ ...f, plannedHours: e.target.value }))} />
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
