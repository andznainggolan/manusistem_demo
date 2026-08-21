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
const STATUSES = ['Pending', 'Verified', 'Rejected']
const toneOf = (status) => status === 'Verified' ? 'success' : status === 'Rejected' ? 'danger' : 'warning'
const BLANK = { managerId: '', period: thisMonth(), realizedHours: '', notes: '', status: 'Pending' }

export default function OvertimeRealizationManagerPage() {
  const t = useT()
  const { realizationsManager, plansManager, addRealizationManager, updateRealizationManager, deleteRealizationManager } = useOvertimeStore()
  const { employees } = useEmployeeStore()
  const { departments } = useStructureStore()

  const [q, setQ] = useState('')
  const [form, setForm] = useState(BLANK)
  const [editing, setEditing] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [msg, setMsg] = useState(null)

  const flash = (text, type = 'success') => { setMsg({ text, type }); setTimeout(() => setMsg(null), 3000) }
  const managers = useMemo(() => {
    const managerIds = new Set(employees.map(e => e.managerId).filter(Boolean))
    return employees.filter(e => managerIds.has(e.id) && e.status === 'Active').sort((a, b) => a.name.localeCompare(b.name))
  }, [employees])
  const deptName = (id) => departments.find(d => d.id === id)?.name || '—'
  const planFor = (managerId, period) => plansManager.find(p => p.managerId === managerId && p.period === period)

  const rows = useMemo(() => [...realizationsManager].sort((a, b) => b.period.localeCompare(a.period)), [realizationsManager])
  const needle = q.trim().toLowerCase()
  const shown = needle ? rows.filter(r => r.name.toLowerCase().includes(needle)) : rows

  const totalRealized = realizationsManager.reduce((a, r) => a + (Number(r.realizedHours) || 0), 0)

  const openNew = () => { setEditing(null); setForm(BLANK); setShowModal(true) }
  const closeModal = () => { setShowModal(false); setEditing(null); setForm(BLANK) }

  const openEdit = (r) => {
    setEditing(r.id)
    setForm({ managerId: String(r.managerId), period: r.period, realizedHours: r.realizedHours, notes: r.notes || '', status: r.status })
    setShowModal(true)
  }

  const handleSave = () => {
    if (!form.managerId || !form.period || form.realizedHours === '')
      return flash(t('Manager, periode, dan jam realisasi wajib diisi.', 'Manager, period, and realized hours are required.'), 'error')
    const mgr = employees.find(e => e.id === +form.managerId)
    const payload = {
      managerId: +form.managerId, name: mgr?.name || '', departmentId: mgr?.departmentId || null,
      period: form.period, realizedHours: Number(form.realizedHours), notes: form.notes.trim(), status: form.status,
    }
    if (editing) { updateRealizationManager(editing, payload); flash(t('Realisasi lembur tim diperbarui.', 'Team overtime realization updated.')) }
    else         { addRealizationManager(payload);             flash(t('Realisasi lembur tim ditambahkan.', 'Team overtime realization added.')) }
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
        icon='📊'
        title={t('Overtime Realization by Manager', 'Overtime Realization by Manager')}
        subtitle={t('Catat jam lembur tim yang benar-benar terealisasi, per manager per periode.', "Record each manager's actually realized team overtime hours, per period.")}
      />

      <div className='mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3'>
        <StatCard tone='brand' icon='📊' label={t('Total Realisasi', 'Total Realizations')} value={String(realizationsManager.length)} />
        <StatCard tone='blue'  icon='🕒' label={t('Total Jam Aktual', 'Total Actual Hours')} value={String(totalRealized)} />
        <StatCard tone='green' icon='✅' label={t('Terverifikasi', 'Verified')} value={String(realizationsManager.filter(r => r.status === 'Verified').length)} />
      </div>

      <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='max-w-sm flex-1'>
          <SearchBar value={q} onChange={setQ} placeholder={t('Cari nama manager…', 'Search manager name…')} />
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
            <EmptyState icon='📊' title={t('Belum ada realisasi lembur tim.', 'No team overtime realizations yet.')} />
          </div>
        ) : (
          <DataTable
            className='rounded-none shadow-none ring-0'
            columns={[
              t('Manager', 'Manager'), t('Departemen', 'Department'), t('Periode', 'Period'),
              { label: t('Jam Rencana', 'Planned'), align: 'right' },
              { label: t('Jam Aktual', 'Actual'), align: 'right' },
              'Status', { label: t('Aksi', 'Action'), align: 'right' },
            ]}
          >
            {shown.map(r => {
              const plan = planFor(r.managerId, r.period)
              return (
                <Tr key={r.id}>
                  <Td className='font-semibold text-gray-800'>{r.name}</Td>
                  <Td className='text-xs text-gray-500'>{deptName(r.departmentId)}</Td>
                  <Td className='text-xs tabular-nums text-gray-500'>{r.period}</Td>
                  <Td align='right' className='text-xs text-gray-400'>{plan ? `${plan.plannedHours} ${t('jam', 'hrs')}` : '—'}</Td>
                  <Td align='right' className='font-semibold'>{r.realizedHours} {t('jam', 'hrs')}</Td>
                  <Td><StatusBadge tone={toneOf(r.status)}>{r.status}</StatusBadge></Td>
                  <Td align='right'>
                    <div className='flex justify-end gap-2'>
                      <ActionButton size='sm' variant='secondary' onClick={() => openEdit(r)}>{t('Edit', 'Edit')}</ActionButton>
                      <button onClick={() => { deleteRealizationManager(r.id); flash(t('Realisasi dihapus.', 'Realization deleted.')) }}
                        className='rounded-xl bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100'>
                        {t('Hapus', 'Delete')}
                      </button>
                    </div>
                  </Td>
                </Tr>
              )
            })}
          </DataTable>
        )}
      </SectionCard>

      {showModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4' onClick={closeModal}>
          <div className='w-full max-w-md rounded-2xl bg-white shadow-2xl' onClick={e => e.stopPropagation()}>
            <div className='flex items-center justify-between border-b border-gray-100 px-6 py-4'>
              <h2 className='text-base font-bold text-gray-800'>
                {editing ? t('Edit Realisasi Lembur Tim', 'Edit Team Overtime Realization') : t('Tambah Realisasi Lembur Tim', 'Add Team Overtime Realization')}
              </h2>
              <button onClick={closeModal} className='text-xl font-bold leading-none text-gray-400 hover:text-gray-600'>×</button>
            </div>
            <div className='space-y-4 px-6 py-5'>
              <FormField label={t('Manager', 'Manager')} required>
                <Select value={form.managerId} onChange={e => setForm(f => ({ ...f, managerId: e.target.value }))}>
                  <option value=''>— {t('Pilih Manager', 'Select Manager')} —</option>
                  {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </Select>
              </FormField>
              <FormField label={t('Periode', 'Period')} required>
                <Input type='month' value={form.period} onChange={e => setForm(f => ({ ...f, period: e.target.value }))} />
              </FormField>
              <FormField label={t('Jam Aktual', 'Actual Hours')} required>
                <Input type='number' min='0' step='0.5' value={form.realizedHours}
                  onChange={e => setForm(f => ({ ...f, realizedHours: e.target.value }))} />
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
