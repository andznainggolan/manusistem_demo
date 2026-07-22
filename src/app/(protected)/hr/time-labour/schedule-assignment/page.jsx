'use client'
import { useState }        from 'react'
import { useShiftStore }   from '@/store/shiftStore'
import { useEmployeeStore } from '@/store/employeeStore'
import { useT }            from '@/store/languageStore'
import {
  PageHeader, StatCard, SectionCard, DataTable, Tr, Td,
  FormField, Input, Select, ActionButton, EmptyState,
} from '@/components/ui'

const BLANK = { userId: '', scheduleId: '', startDate: '' }
const BRAND = 'linear-gradient(135deg,#8B1A1A,#D7252B)'

export default function ScheduleAssignmentPage() {
  const t = useT()
  const { schedules, assignments, addAssignment, deleteAssignment } = useShiftStore()
  const { employees } = useEmployeeStore()
  const [form,      setForm     ] = useState(BLANK)
  const [showModal, setShowModal ] = useState(false)
  const [msg,       setMsg      ] = useState(null)

  const flash = (text, type = 'success') => { setMsg({ text, type }); setTimeout(() => setMsg(null), 3000) }

  const openNew    = () => { setForm(BLANK); setShowModal(true) }
  const closeModal = () => { setShowModal(false); setForm(BLANK) }

  const handleSave = () => {
    if (!form.userId || !form.scheduleId || !form.startDate)
      return flash(t('Semua field wajib diisi.', 'All fields are required.'), 'error')
    const emp = employees.find(e => e.id === +form.userId)
    addAssignment({ userId: +form.userId, name: emp?.name || '', scheduleId: +form.scheduleId, startDate: form.startDate })
    flash(t('Assignment ditambahkan.', 'Assignment added.'))
    closeModal()
  }

  const scheduleName = (id) => schedules.find(s => s.id === id)?.name || '—'
  const empName      = (id) => employees.find(e => e.id === id)?.name || '—'
  const activeEmps   = employees.filter(e => e.status === 'Active')

  return (
    <div>
      {msg && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl text-sm font-semibold
          ${msg.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
          {msg.type === 'error' ? '⚠' : '✓'} {msg.text}
        </div>
      )}

      <PageHeader
        icon='🧑‍💼'
        title={t('Schedule Assignment', 'Schedule Assignment')}
        subtitle={t('Assign jadwal kerja ke karyawan.', 'Assign work schedules to employees.')}
      />

      <div className='mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3'>
        <StatCard tone='brand' label={t('Total Assignment', 'Total Assignments')} value={assignments.length} icon='🧑‍💼' />
        <StatCard tone='blue'  label={t('Schedule Tersedia', 'Available Schedules')} value={schedules.length} icon='📆' />
        <StatCard tone='green' label={t('Karyawan Aktif', 'Active Employees')} value={activeEmps.length} icon='✅' />
      </div>

      <SectionCard
        title={t('Daftar Assignment', 'Assignment List')}
        icon='🧑‍💼'
        bodyClass='p-0'
        actions={
          <button onClick={openNew}
            className='flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white rounded-lg shadow-sm hover:opacity-90 transition whitespace-nowrap'
            style={{ background: BRAND }}>
            + {t('Assign Schedule', 'Assign Schedule')}
          </button>
        }
      >
        {assignments.length ? (
          <DataTable
            className='rounded-none shadow-none ring-0'
            columns={[
              t('Karyawan','Employee'),
              t('Schedule','Schedule'),
              t('Mulai','Start'),
              { label: t('Aksi','Action'), align: 'right' },
            ]}
          >
            {assignments.map(a => (
              <Tr key={a.id}>
                <Td className='font-medium text-gray-800'>{a.name || empName(a.userId)}</Td>
                <Td>{scheduleName(a.scheduleId)}</Td>
                <Td>{a.startDate}</Td>
                <Td align='right'>
                  <button onClick={() => { deleteAssignment(a.id); flash(t('Assignment dihapus.', 'Assignment deleted.')) }}
                    className='px-3 py-1.5 text-xs font-semibold rounded-xl bg-red-50 text-red-600 hover:bg-red-100'>
                    {t('Hapus', 'Delete')}
                  </button>
                </Td>
              </Tr>
            ))}
          </DataTable>
        ) : (
          <div className='p-5'>
            <EmptyState icon='🧑‍💼' title={t('Belum ada assignment.', 'No assignments yet.')}
              description={t('Assign jadwal kerja pertama ke karyawan.', 'Assign your first work schedule to an employee.')} />
          </div>
        )}
      </SectionCard>

      {showModal && (
        <div className='fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4' onClick={closeModal}>
          <div className='bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto' onClick={e => e.stopPropagation()}>
            <div className='px-6 py-4 border-b border-gray-100 flex items-center justify-between'>
              <h2 className='text-base font-bold text-gray-800'>{t('Assign Schedule', 'Assign Schedule')}</h2>
              <button onClick={closeModal} className='text-gray-400 hover:text-gray-600 text-xl font-bold leading-none'>×</button>
            </div>
            <div className='px-6 py-5 space-y-4'>
              <FormField label={t('Karyawan', 'Employee')} required>
                <Select value={form.userId} onChange={e => setForm(f => ({ ...f, userId: e.target.value }))}>
                  <option value=''>— {t('Pilih Karyawan', 'Select Employee')} —</option>
                  {activeEmps.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </Select>
              </FormField>
              <FormField label={t('Work Schedule', 'Work Schedule')} required>
                <Select value={form.scheduleId} onChange={e => setForm(f => ({ ...f, scheduleId: e.target.value }))}>
                  <option value=''>— {t('Pilih Schedule', 'Select Schedule')} —</option>
                  {schedules.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </Select>
              </FormField>
              <FormField label={t('Tanggal Mulai', 'Start Date')} required>
                <Input type='date' value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
              </FormField>
            </div>
            <div className='px-6 pb-5 flex gap-3'>
              <button onClick={handleSave} className='flex-1 py-2.5 text-sm font-semibold text-white rounded-xl hover:opacity-90 transition' style={{ background: BRAND }}>
                {t('Assign', 'Assign')}
              </button>
              <button onClick={closeModal} className='flex-1 py-2.5 text-sm font-semibold bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition'>
                {t('Batal', 'Cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
