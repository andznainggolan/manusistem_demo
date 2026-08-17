'use client'
import { useState } from 'react'
import { useRecruitmentStore } from '@/store/recruitmentStore'
import { useStructureStore } from '@/store/structureStore'
import { useEmployeeStore } from '@/store/employeeStore'
import { useT } from '@/store/languageStore'
import {
  PageHeader, StatCard, DataTable, Tr, Td, ActionButton, StatusBadge, EmptyState, FormField, Input,
} from '@/components/ui'

const todayStr = () => new Date().toISOString().slice(0, 10)

export default function PendingEmployeePage() {
  const t = useT()
  const { requisitions, candidates, updateCandidate } = useRecruitmentStore()
  const { positions, departments, companies, headcounts, updateHeadcount } = useStructureStore()
  const { employees, addEmployee } = useEmployeeStore()

  const [modal, setModal] = useState(null) // { candidate, requisition, form }
  const [flash, setFlash] = useState('')

  const say = (msg) => { setFlash(msg); setTimeout(() => setFlash(''), 3000) }

  const pending = candidates
    .filter(c => c.stage === 'Pending Employee')
    .map(c => ({ ...c, requisition: requisitions.find(r => r.id === c.requisitionId) }))
    .sort((a, b) => (a.employeeId ? 1 : 0) - (b.employeeId ? 1 : 0))

  const waitingCount = pending.filter(c => !c.employeeId).length
  const convertedCount = pending.filter(c => c.employeeId).length

  const posName = (id) => positions.find(p => p.id === id)?.name || '—'
  const deptName = (id) => departments.find(d => d.id === id)?.name || '—'
  const companyName = (id) => companies.find(c => c.id === id)?.companyCode || companies.find(c => c.id === id)?.name || '—'
  const headcountFor = (req) => req?.headcountId ? headcounts.find(h => h.id === req.headcountId) : null

  const openConvert = (c) => {
    const req = c.requisition
    // Legacy requisitions only ever had a free-text positionTitle (no FK) —
    // fall back to matching it by name, same pattern used on Job Requisition.
    const positionId = req?.positionId ?? positions.find(p => p.name === req?.positionTitle)?.id ?? ''
    setModal({
      candidate: c, requisition: req,
      form: { positionId, nik: '', joinDate: todayStr() },
    })
  }
  const closeModal = () => setModal(null)

  const convert = () => {
    const { candidate, requisition, form } = modal
    if (!form.nik.trim() || !requisition) return
    const position = positions.find(p => p.id === Number(form.positionId))
    const empId = addEmployee({
      name: candidate.name,
      nik: form.nik.trim(),
      email: candidate.email,
      personalEmail: candidate.email,
      phone: candidate.phone,
      status: 'Active',
      employmentType: requisition.employmentType,
      joinDate: form.joinDate,
      companyId: requisition.companyId,
      departmentId: requisition.departmentId,
      positionId: Number(form.positionId) || '',
      gradeId: position?.gradeId || '',
    })
    if (requisition.headcountId) updateHeadcount(requisition.headcountId, { employeeId: empId })
    updateCandidate(candidate.id, { employeeId: empId })
    say(t(`${candidate.name} berhasil dikonversi menjadi karyawan.`, `${candidate.name} was converted to an employee.`))
    closeModal()
  }

  return (
    <div>
      <PageHeader
        icon='🧑‍💼'
        title='Pending Employee'
        subtitle={t(
          'Kandidat yang sudah lolos tahap akhir rekrutmen — konversi menjadi data karyawan resmi di sini.',
          'Candidates who cleared the final recruitment stage — convert them into an official employee record here.',
        )}
        actions={flash && <span className='rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700'>{flash}</span>}
      />

      <div className='mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3'>
        <StatCard icon='🧑‍💼' tone='brand' label={t('Total', 'Total')} value={String(pending.length)} />
        <StatCard icon='⏳' tone='orange' label={t('Menunggu Konversi', 'Awaiting Conversion')} value={String(waitingCount)} />
        <StatCard icon='✅' tone='green' label={t('Sudah Jadi Karyawan', 'Converted to Employee')} value={String(convertedCount)} />
      </div>

      {pending.length === 0 ? (
        <EmptyState icon='🧑‍💼' title={t('Belum ada kandidat Pending Employee.', 'No Pending Employee candidates yet.')}
          description={t('Pindahkan kandidat ke tahap "Pending Employee" di Candidate Pipeline.', 'Move a candidate to the "Pending Employee" stage in Candidate Pipeline.')} />
      ) : (
        <DataTable columns={[
          t('Kandidat', 'Candidate'), t('Posisi', 'Position'), t('Departemen', 'Department'), t('Perusahaan', 'Company'),
          'Status', { label: t('Aksi', 'Action'), align: 'right' },
        ]}>
          {pending.map(c => {
            const req = c.requisition
            const positionId = req?.positionId ?? positions.find(p => p.name === req?.positionTitle)?.id
            const employee = c.employeeId ? employees.find(e => e.id === c.employeeId) : null
            const hc = headcountFor(req)
            return (
              <Tr key={c.id}>
                <Td>
                  <p className='font-semibold text-gray-800'>{c.name}</p>
                  {employee ? (
                    <p className='text-xs text-gray-400'>
                      {t('No. Karyawan', 'Employee No.')}: <span className='font-mono font-semibold text-gray-600'>{employee.nik || '—'}</span>
                    </p>
                  ) : (
                    <p className='text-xs text-gray-400'>{c.email} · {c.phone}</p>
                  )}
                </Td>
                <Td className='text-sm text-gray-600'>
                  {req?.publicTitle || req?.positionTitle || posName(positionId)}
                  {employee && hc && <span className='mt-0.5 block text-xs text-gray-400'>{hc.code} — {hc.name}</span>}
                </Td>
                <Td className='text-sm text-gray-600'>{req ? deptName(req.departmentId) : '—'}</Td>
                <Td className='text-sm text-gray-600'>{employee ? companyName(employee.companyId) : (req ? companyName(req.companyId) : '—')}</Td>
                <Td>
                  {c.employeeId
                    ? <StatusBadge tone='success'>{t('Sudah Jadi Karyawan', 'Converted')}</StatusBadge>
                    : <StatusBadge tone='warning'>{t('Menunggu', 'Waiting')}</StatusBadge>}
                </Td>
                <Td align='right'>
                  {c.employeeId ? (
                    <a href={`/hr/employee/${employee?.id}`} className='text-xs font-semibold text-teal-700 hover:underline'>
                      {t('Lihat Profil →', 'View Profile →')}
                    </a>
                  ) : (
                    <ActionButton size='sm' icon='➕' onClick={() => openConvert(c)} disabled={!req}>
                      {t('Konversi ke Employee', 'Convert to Employee')}
                    </ActionButton>
                  )}
                </Td>
              </Tr>
            )
          })}
        </DataTable>
      )}

      {/* Convert to Employee modal */}
      {modal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4' onClick={closeModal}>
          <div className='w-full max-w-md rounded-2xl bg-white p-6 shadow-xl' onClick={e => e.stopPropagation()}>
            <div className='mb-4 flex items-start justify-between'>
              <h3 className='text-base font-bold text-gray-800'>{t('Konversi ke Employee', 'Convert to Employee')}</h3>
              <button onClick={closeModal} className='text-xl font-bold leading-none text-gray-400 hover:text-gray-600'>×</button>
            </div>

            <div className='mb-4 rounded-xl bg-gray-50 p-3 text-xs text-gray-600'>
              <p className='font-semibold text-gray-800'>{modal.candidate.name}</p>
              <p className='mt-0.5'>{modal.candidate.email} · {modal.candidate.phone}</p>
              <p className='mt-1.5 text-gray-500'>
                {modal.requisition?.publicTitle || modal.requisition?.positionTitle} · {deptName(modal.requisition?.departmentId)} · {companyName(modal.requisition?.companyId)}
              </p>
            </div>

            <div className='space-y-4'>
              <FormField label='NIK' required hint={t('Nomor induk karyawan — belum ada secara otomatis, isi manual.', "Employee ID number — not generated automatically, enter it manually.")}>
                <Input value={modal.form.nik} autoFocus
                  onChange={e => setModal(m => ({ ...m, form: { ...m.form, nik: e.target.value } }))} />
              </FormField>
              <FormField label={t('Tanggal Bergabung', 'Join Date')} required>
                <Input type='date' value={modal.form.joinDate}
                  onChange={e => setModal(m => ({ ...m, form: { ...m.form, joinDate: e.target.value } }))} />
              </FormField>
            </div>

            <div className='mt-6 flex justify-end gap-2'>
              <ActionButton variant='secondary' onClick={closeModal}>{t('Batal', 'Cancel')}</ActionButton>
              <ActionButton icon='✅' onClick={convert} disabled={!modal.form.nik.trim() || !modal.form.joinDate}>
                {t('Konversi', 'Convert')}
              </ActionButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
