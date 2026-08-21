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
const addMonths = (dateStr, n) => { const d = new Date(dateStr); d.setMonth(d.getMonth() + n); return d.toISOString().slice(0, 10) }
const BLANK = { employeeId: '', earnedDate: todayStr(), sourceDate: '', hoursEarned: '', hoursUsed: 0, expiryDate: addMonths(todayStr(), 3), notes: '' }

// Status is derived, not manually set — it always reflects the actual balance & expiry.
const statusOf = (r, today) => {
  const remaining = (Number(r.hoursEarned) || 0) - (Number(r.hoursUsed) || 0)
  if (remaining <= 0) return 'Fully Used'
  if (r.expiryDate && r.expiryDate < today) return 'Expired'
  return 'Active'
}
const toneOf = (status) => status === 'Active' ? 'success' : status === 'Expired' ? 'danger' : 'neutral'

export default function CompensatoryLeavePage() {
  const t = useT()
  const { compLeave, addCompLeave, updateCompLeave, deleteCompLeave } = useOvertimeStore()
  const { employees } = useEmployeeStore()

  const [q, setQ] = useState('')
  const [form, setForm] = useState(BLANK)
  const [editing, setEditing] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [msg, setMsg] = useState(null)

  const flash = (text, type = 'success') => { setMsg({ text, type }); setTimeout(() => setMsg(null), 3000) }
  const activeEmps = useMemo(() => employees.filter(e => e.status === 'Active').sort((a, b) => a.name.localeCompare(b.name)), [employees])
  const today = todayStr()

  const rows = useMemo(() => [...compLeave]
    .map(r => ({ ...r, remaining: (Number(r.hoursEarned) || 0) - (Number(r.hoursUsed) || 0), status: statusOf(r, today) }))
    .sort((a, b) => b.earnedDate.localeCompare(a.earnedDate)), [compLeave, today])
  const needle = q.trim().toLowerCase()
  const shown = needle ? rows.filter(r => r.name.toLowerCase().includes(needle)) : rows

  const totalRemaining = rows.filter(r => r.status === 'Active').reduce((a, r) => a + r.remaining, 0)
  const expiringSoonCount = rows.filter(r => r.status === 'Active' && r.expiryDate && r.expiryDate <= addMonths(today, 1)).length

  const openNew = () => { setEditing(null); setForm(BLANK); setShowModal(true) }
  const closeModal = () => { setShowModal(false); setEditing(null); setForm(BLANK) }

  const openEdit = (r) => {
    setEditing(r.id)
    setForm({
      employeeId: String(r.employeeId), earnedDate: r.earnedDate, sourceDate: r.sourceDate || '',
      hoursEarned: r.hoursEarned, hoursUsed: r.hoursUsed, expiryDate: r.expiryDate, notes: r.notes || '',
    })
    setShowModal(true)
  }

  const handleSave = () => {
    if (!form.employeeId || !form.earnedDate || form.hoursEarned === '' || !form.expiryDate)
      return flash(t('Karyawan, tanggal diperoleh, jam diperoleh, dan tanggal kedaluwarsa wajib diisi.',
        'Employee, earned date, hours earned, and expiry date are required.'), 'error')
    const emp = employees.find(e => e.id === +form.employeeId)
    const payload = {
      employeeId: +form.employeeId, name: emp?.name || '', earnedDate: form.earnedDate, sourceDate: form.sourceDate || '',
      hoursEarned: Number(form.hoursEarned), hoursUsed: Number(form.hoursUsed) || 0, expiryDate: form.expiryDate, notes: form.notes.trim(),
    }
    if (editing) { updateCompLeave(editing, payload); flash(t('Cuti pengganti diperbarui.', 'Compensatory leave updated.')) }
    else         { addCompLeave(payload);             flash(t('Cuti pengganti ditambahkan.', 'Compensatory leave added.')) }
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
        icon='🔄'
        title={t('Compensatory Leave', 'Compensatory Leave')}
        subtitle={t('Kelola saldo cuti pengganti dari jam lembur yang terealisasi.', 'Manage compensatory leave balances earned from realized overtime.')}
      />

      <div className='mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3'>
        <StatCard tone='brand' icon='🔄' label={t('Total Entri', 'Total Entries')} value={String(compLeave.length)} />
        <StatCard tone='blue'  icon='🕒' label={t('Sisa Jam Aktif', 'Active Hours Remaining')} value={String(totalRemaining)} />
        <StatCard tone={expiringSoonCount ? 'red' : 'gray'} icon='⚠️'
          label={t('Akan Kedaluwarsa (30 hari)', 'Expiring Soon (30 days)')} value={String(expiringSoonCount)} />
      </div>

      <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='max-w-sm flex-1'>
          <SearchBar value={q} onChange={setQ} placeholder={t('Cari nama karyawan…', 'Search employee name…')} />
        </div>
        <button onClick={openNew}
          className='flex items-center gap-1.5 whitespace-nowrap rounded-lg px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:opacity-90'
          style={{ background: 'linear-gradient(135deg,#052B52,#039299)' }}>
          + {t('Tambah Cuti Pengganti', 'Add Compensatory Leave')}
        </button>
      </div>

      <SectionCard bodyClass='p-0'>
        {shown.length === 0 ? (
          <div className='p-5'>
            <EmptyState icon='🔄' title={t('Belum ada cuti pengganti.', 'No compensatory leave entries yet.')} />
          </div>
        ) : (
          <DataTable
            className='rounded-none shadow-none ring-0'
            columns={[
              t('Karyawan', 'Employee'), t('Diperoleh', 'Earned'),
              { label: t('Jam Diperoleh', 'Hours Earned'), align: 'right' },
              { label: t('Jam Terpakai', 'Hours Used'), align: 'right' },
              { label: t('Sisa', 'Remaining'), align: 'right' },
              t('Kedaluwarsa', 'Expires'), 'Status', { label: t('Aksi', 'Action'), align: 'right' },
            ]}
          >
            {shown.map(r => (
              <Tr key={r.id}>
                <Td className='font-semibold text-gray-800'>{r.name}</Td>
                <Td className='text-xs tabular-nums text-gray-500'>{r.earnedDate}</Td>
                <Td align='right'>{r.hoursEarned} {t('jam', 'hrs')}</Td>
                <Td align='right' className='text-gray-500'>{r.hoursUsed} {t('jam', 'hrs')}</Td>
                <Td align='right' className='font-semibold'>{r.remaining} {t('jam', 'hrs')}</Td>
                <Td className='text-xs tabular-nums text-gray-500'>{r.expiryDate}</Td>
                <Td><StatusBadge tone={toneOf(r.status)}>{r.status}</StatusBadge></Td>
                <Td align='right'>
                  <div className='flex justify-end gap-2'>
                    <ActionButton size='sm' variant='secondary' onClick={() => openEdit(r)}>{t('Edit', 'Edit')}</ActionButton>
                    <button onClick={() => { deleteCompLeave(r.id); flash(t('Entri dihapus.', 'Entry deleted.')) }}
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
                {editing ? t('Edit Cuti Pengganti', 'Edit Compensatory Leave') : t('Tambah Cuti Pengganti', 'Add Compensatory Leave')}
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
              <FormField label={t('Tanggal Sumber Lembur', 'Source Overtime Date')}
                hint={t('Opsional — tanggal lembur yang menghasilkan cuti ini.', 'Optional — the overtime date this leave was earned from.')}>
                <Input type='date' value={form.sourceDate} onChange={e => setForm(f => ({ ...f, sourceDate: e.target.value }))} />
              </FormField>
              <FormField label={t('Tanggal Diperoleh', 'Earned Date')} required>
                <Input type='date' value={form.earnedDate} onChange={e => setForm(f => ({ ...f, earnedDate: e.target.value }))} />
              </FormField>
              <FormField label={t('Jam Diperoleh', 'Hours Earned')} required>
                <Input type='number' min='0' step='0.5' value={form.hoursEarned}
                  onChange={e => setForm(f => ({ ...f, hoursEarned: e.target.value }))} />
              </FormField>
              <FormField label={t('Jam Terpakai', 'Hours Used')}>
                <Input type='number' min='0' step='0.5' value={form.hoursUsed}
                  onChange={e => setForm(f => ({ ...f, hoursUsed: e.target.value }))} />
              </FormField>
              <FormField label={t('Tanggal Kedaluwarsa', 'Expiry Date')} required>
                <Input type='date' value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} />
              </FormField>
              <FormField label={t('Catatan', 'Notes')}>
                <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
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
