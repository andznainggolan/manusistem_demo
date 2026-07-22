'use client'
import Icon from '@/components/ui/Icon'
import { useState, useEffect }  from 'react'
import { useAuthStore }          from '@/store/authStore'
import { useLeaveStore }         from '@/store/leaveStore'
import { useEmployeeStore }      from '@/store/employeeStore'
import { daysBetween }           from '@/utils/dateUtils'
import WorkflowMonitor           from '@/components/WorkflowMonitor'
import { useT } from '@/store/languageStore'
import { PageHeader, SectionCard, DataTable, Tr, Td, StatusBadge, ActionButton, EmptyState, Input } from '@/components/ui'

// Resolve supervisor chain
function getDirectSupervisorId(userId, employees) {
  return employees.find(e => e.id === userId)?.managerId ?? null
}
function getIndirectSupervisorId(userId, employees) {
  const directId = getDirectSupervisorId(userId, employees)
  return directId ? getDirectSupervisorId(directId, employees) : null
}

function canActOnStep(step, leave, currentUser, employees) {
  if (step.status !== 'Pending') return false
  const uid  = currentUser?.id
  const role = currentUser?.role
  if (step.delegatedTo && step.delegatedTo === uid) return true
  const rId  = leave.userId   // approval chain based on the employee, not who submitted
  switch (step.type) {
    case 'supervisor':        return getDirectSupervisorId(rId, employees)   === uid
    case 'indirect_sup':      return getIndirectSupervisorId(rId, employees) === uid
    case 'supervisor_pc53':
    case 'indirect_sup_pc53': return role === 'manager' || role === 'superadmin'
    case 'role':              return role === 'hr'       || role === 'superadmin'
    case 'userlist':
    case 'employee':          return role === 'hr'       || role === 'superadmin'
    default:                  return role === 'superadmin'
  }
}

const statusTone = (s) => ({
  Approved:  'success',
  Pending:   'warning',
  Rejected:  'danger',
  Withdrawn: 'neutral',
}[s] || 'neutral')

export default function ApproveLeavePage() {
  const t = useT()
  const { currentUser }              = useAuthStore()
  const { leaves, approveStep, rejectStep } = useLeaveStore()
  const { employees }                = useEmployeeStore()

  const [selectedLeaveId, setSelectedLeaveId] = useState(null)
  const [noteMap,  setNoteMap  ] = useState({})   // { [leaveId]: note }
  const [rejectId, setRejectId ] = useState(null) // leaveId being rejected (show note input)

  // Leaves where current user can act on the current pending step
  const actionable = leaves.filter(l => {
    const pendingStep = (l.steps || []).find(s => s.status === 'Pending')
    return pendingStep && canActOnStep(pendingStep, l, currentUser, employees)
  })

  // Leaves where current user has already acted on any step
  const acted = leaves.filter(l =>
    (l.steps || []).some(s => s.approverId === currentUser?.id) &&
    !actionable.find(a => a.id === l.id)
  )

  // Auto-select first actionable, or first acted
  useEffect(() => {
    const first = actionable[0] ?? acted[0]
    if (first && !selectedLeaveId) setSelectedLeaveId(first.id)
  }, [leaves])

  const handleApprove = (l) => {
    const step = (l.steps || []).find(s => s.status === 'Pending')
    if (!step) return
    approveStep(l.id, step.level, currentUser.id, currentUser.name, noteMap[l.id] || '')
    setNoteMap(m => ({ ...m, [l.id]: '' }))
  }

  const handleReject = (l) => {
    const step = (l.steps || []).find(s => s.status === 'Pending')
    if (!step) return
    rejectStep(l.id, step.level, currentUser.id, currentUser.name, noteMap[l.id] || '')
    setNoteMap(m => ({ ...m, [l.id]: '' }))
    setRejectId(null)
  }

  const selectedLeave = [...actionable, ...acted].find(l => l.id === selectedLeaveId) ?? null

  return (
    <div className='flex flex-col gap-6'>
      <PageHeader
        icon='✅'
        title='Approve Leave'
        subtitle={t('Review dan setujui pengajuan cuti sesuai level approval Anda.', 'Review and approve leave requests at your approval level.')}
      />

      {/* ── Pending Approval ── */}
      <SectionCard
        title={t('Menunggu Persetujuan', 'Pending Approval')}
        icon='⏳'
        actions={<StatusBadge tone='warning'>{actionable.length}</StatusBadge>}
        bodyClass='p-0'
      >
        <DataTable
          columns={[
            { label: t('Karyawan', 'Employee') },
            { label: t('Jenis', 'Type') },
            { label: t('Mulai', 'Start') },
            { label: t('Selesai', 'End') },
            { label: t('Hari', 'Days'), align: 'right' },
            { label: t('Keterangan', 'Note') },
            { label: 'Step' },
            { label: t('Aksi', 'Action'), align: 'right' },
          ]}
          className='ring-0 shadow-none rounded-none'
        >
          {actionable.length ? actionable.map(l => {
            const pendingStep = (l.steps || []).find(s => s.status === 'Pending')
            const isRejecting = rejectId === l.id
            return (
              <Tr key={l.id} onClick={() => setSelectedLeaveId(l.id)} active={selectedLeaveId === l.id}>
                <Td className='font-medium text-gray-800'>{l.name}</Td>
                <Td>{l.type}</Td>
                <Td>{l.start}</Td>
                <Td>{l.end}</Td>
                <Td align='right' className='tabular-nums'>{daysBetween(l.start, l.end)}</Td>
                <Td className='text-gray-500'>{l.note || '—'}</Td>
                <Td>
                  {pendingStep && (
                    <StatusBadge tone='warning'>
                      Step {pendingStep.level} · {pendingStep.label}
                    </StatusBadge>
                  )}
                </Td>
                <Td align='right' className='whitespace-nowrap' >
                  <div onClick={e => e.stopPropagation()}>
                    {isRejecting ? (
                      <div className='flex items-center justify-end gap-2'>
                        <Input
                          value={noteMap[l.id] || ''}
                          onChange={e => setNoteMap(m => ({ ...m, [l.id]: e.target.value }))}
                          placeholder={t('Alasan penolakan…', 'Rejection reason…')}
                          className='w-40 py-1.5'
                        />
                        <ActionButton size='sm' variant='danger' onClick={() => handleReject(l)}>
                          {t('Tolak', 'Reject')}
                        </ActionButton>
                        <ActionButton size='sm' variant='secondary' onClick={() => setRejectId(null)}>
                          {t('Batal', 'Cancel')}
                        </ActionButton>
                      </div>
                    ) : (
                      <div className='flex justify-end gap-2'>
                        <ActionButton size='sm' variant='primary' icon='✓' onClick={() => handleApprove(l)}>
                          {t('Setujui', 'Approve')}
                        </ActionButton>
                        <ActionButton
                          size='sm'
                          variant='secondary'
                          className='!bg-red-50 !text-red-600 !border-red-100 hover:!bg-red-100'
                          icon='✗'
                          onClick={() => { setRejectId(l.id); setNoteMap(m => ({ ...m, [l.id]: '' })) }}
                        >
                          {t('Tolak', 'Reject')}
                        </ActionButton>
                      </div>
                    )}
                  </div>
                </Td>
              </Tr>
            )
          }) : (
            <tr>
              <td colSpan={8} className='px-4 py-10'>
                <EmptyState icon='🎉' title={t('Tidak ada pengajuan pending.', 'No pending approvals.')} />
              </td>
            </tr>
          )}
        </DataTable>
      </SectionCard>

      {/* ── Decision History ── */}
      <SectionCard
        title={t('Riwayat Keputusan', 'Decision History')}
        icon='📋'
        actions={<StatusBadge tone='neutral'>{acted.length}</StatusBadge>}
        bodyClass='p-0'
      >
        <DataTable
          columns={[
            { label: t('Karyawan', 'Employee') },
            { label: t('Jenis', 'Type') },
            { label: t('Tanggal', 'Date') },
            { label: t('Hari', 'Days'), align: 'right' },
            { label: t('Status Keseluruhan', 'Overall Status') },
          ]}
          className='ring-0 shadow-none rounded-none'
        >
          {acted.length ? acted.map(l => (
            <Tr key={l.id} onClick={() => setSelectedLeaveId(l.id)} active={selectedLeaveId === l.id}>
              <Td className='font-medium text-gray-800'>{l.name}</Td>
              <Td>{l.type}</Td>
              <Td>{l.start} <Icon e='→' size={14} className='inline align-[-2px]' /> {l.end}</Td>
              <Td align='right' className='tabular-nums'>{daysBetween(l.start, l.end)}</Td>
              <Td>
                <div className='flex items-center gap-2'>
                  <StatusBadge tone={statusTone(l.status)}>{l.status}</StatusBadge>
                  {l.status === 'Pending' && (
                    <span className='text-xs text-amber-600 font-medium'>
                      {t('Menunggu approver berikutnya', 'Waiting for next approver')}
                    </span>
                  )}
                </div>
              </Td>
            </Tr>
          )) : (
            <tr>
              <td colSpan={5} className='px-4 py-10'>
                <EmptyState icon='📭' title={t('Belum ada riwayat.', 'No history yet.')} />
              </td>
            </tr>
          )}
        </DataTable>
      </SectionCard>

      {/* ── Workflow Monitor ── */}
      {selectedLeave && (
        <WorkflowMonitor
          leaves={[selectedLeave]}
          title='Workflow Monitor'
          expandedId={selectedLeaveId}
        />
      )}
    </div>
  )
}
