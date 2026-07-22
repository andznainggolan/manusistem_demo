'use client'
import Icon from '@/components/ui/Icon'
import { useState }          from 'react'
import { useAuthStore }      from '@/store/authStore'
import { useLeaveStore }     from '@/store/leaveStore'
import { useWorkflowStore }  from '@/store/workflowStore'
import { daysBetween }       from '@/utils/dateUtils'
import WorkflowMonitor       from '@/components/WorkflowMonitor'
import { useT } from '@/store/languageStore'
import {
  PageHeader, SectionCard, DataTable, Tr, Td, StatusBadge,
  ActionButton, FormField, Input, Select, EmptyState,
} from '@/components/ui'

export default function ApplyLeavePage() {
  const t = useT()
  const { currentUser }              = useAuthStore()
  const { leaves, leaveTypes, submitLeave, withdrawLeave } = useLeaveStore()
  const { getLevelsForPage }         = useWorkflowStore()
  const [form, setForm]               = useState({ type: '', start: '', end: '', note: '' })
  const [msg,  setMsg]                = useState(null)

  const myLeaves = leaves.filter(l => l.userId === currentUser?.id)

  // Default select first leave
  const [selectedLeaveId, setSelectedLeaveId] = useState(() => myLeaves[0]?.id ?? null)
  const activeTypes = leaveTypes.filter(lt => lt.active)

  const leaveUsed = (typeName) =>
    myLeaves.filter(l => l.type === typeName && l.status === 'Approved')
      .reduce((sum, l) => sum + daysBetween(l.start, l.end), 0)

  const handleSubmit = () => {
    if (!form.type || !form.start || !form.end) {
      setMsg({ type: 'error', text: t('Jenis cuti, tanggal mulai dan selesai wajib diisi.','Leave type, start and end date are required.') })
      return
    }
    if (form.end < form.start) {
      setMsg({ type: 'error', text: t('Tanggal selesai tidak boleh sebelum tanggal mulai.','End date cannot be before start date.') })
      return
    }
    const lt   = leaveTypes.find(t => t.name === form.type)
    const used = leaveUsed(form.type)
    const req  = daysBetween(form.start, form.end)
    if (lt && used + req > lt.maxDays) {
      setMsg({ type: 'error', text: `Saldo ${form.type} tidak cukup! Sisa: ${lt.maxDays - used} hari.` })
      return
    }
    submitLeave({ userId: currentUser.id, name: currentUser.name, workflowName: 'Apply Leave', ...form }, getLevelsForPage('Apply Leave'))
    setForm({ type: '', start: '', end: '', note: '' })
    setMsg({ type: 'success', text: t('Pengajuan cuti berhasil dikirim!','Leave request submitted successfully!') })
    setTimeout(() => setMsg(null), 3000)
    // Auto-select the newly submitted leave (highest id after submit)
    setTimeout(() => {
      const latest = useLeaveStore.getState().leaves.filter(l => l.userId === currentUser.id).at(-1)
      if (latest) setSelectedLeaveId(latest.id)
    }, 50)
  }

  // Can withdraw: Pending status and no step has been acted on yet
  const canWithdraw = (l) => {
    if (l.status !== 'Pending') return false
    return !(l.steps || []).some(s => s.status === 'Approved' || s.status === 'Rejected')
  }

  const handleWithdraw = (l) => {
    if (!confirm(`Withdraw pengajuan cuti "${l.type}" (${l.start} — ${l.end})?`)) return
    withdrawLeave(l.id)
    setMsg({ type: 'success', text: t('Pengajuan cuti berhasil di-withdraw.','Leave request withdrawn successfully.') })
    setTimeout(() => setMsg(null), 3000)
  }

  const badge = (s) => ({
    Approved:  'bg-green-100 text-green-700',
    Pending:   'bg-yellow-100 text-yellow-700',
    Rejected:  'bg-red-100 text-red-700',
    Withdrawn: 'bg-gray-100 text-gray-500',
  }[s] || '')

  return (
    <div>
      <PageHeader
        icon='📝'
        title='Apply Leave'
        subtitle={t('Ajukan cuti dan lihat riwayat pengajuanmu.','Submit leave and view your submission history.')}
      />

      {/* Saldo */}
      <SectionCard icon='📊' title={t('Saldo Cuti','Leave Balance')} className='mb-6'>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          {activeTypes.map(lt => {
            const used = leaveUsed(lt.name)
            const sisa = lt.maxDays - used
            const pct  = Math.round((used / lt.maxDays) * 100)
            return (
              <div key={lt.id} className='rounded-xl bg-gray-50/70 p-4 ring-1 ring-gray-100'>
                <div className='text-xs font-semibold text-gray-500 mb-1'>{lt.name}</div>
                <div className='text-2xl font-bold text-gray-900'>{sisa}
                  <span className='text-sm font-normal text-gray-400'> / {lt.maxDays}</span>
                </div>
                <div className='h-1.5 bg-gray-200 rounded-full mt-2 overflow-hidden'>
                  <div className='h-1.5 rounded-full transition-all' style={{
                    width: `${pct}%`,
                    background: pct > 80 ? '#ef4444' : pct > 50 ? '#f59e0b' : '#10b981'
                  }} />
                </div>
                <div className='text-xs text-gray-400 mt-1'>{t('Terpakai','Used')}: {used} {t('hari','days')}</div>
              </div>
            )
          })}
        </div>
      </SectionCard>

      {/* Form */}
      <SectionCard icon='📝' title={t('Ajukan Cuti','Submit Leave')} className='mb-6'>
        {msg && (
          <div className={`text-sm px-4 py-2.5 rounded-xl mb-4 ${msg.type === 'error' ? 'bg-red-50 text-red-600 ring-1 ring-red-200' : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'}`}>
            {msg.text}
          </div>
        )}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <FormField label={t('Jenis Cuti','Leave Type')}>
            <Select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              <option value=''>{t('-- Pilih Jenis Cuti --','-- Select Leave Type --')}</option>
              {activeTypes.map(lt => <option key={lt.id} value={lt.name}>{lt.name} ({t('sisa','remaining')}: {lt.maxDays - leaveUsed(lt.name)} {t('hari','days')})</option>)}
            </Select>
          </FormField>
          <FormField label={t('Keterangan','Note')}>
            <Input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              placeholder={t('Opsional','Optional')} />
          </FormField>
          <FormField label={t('Tanggal Mulai','Start Date')}>
            <Input type='date' value={form.start} onChange={e => setForm(f => ({ ...f, start: e.target.value }))} />
          </FormField>
          <FormField label={t('Tanggal Selesai','End Date')}>
            <Input type='date' value={form.end} onChange={e => setForm(f => ({ ...f, end: e.target.value }))} />
          </FormField>
        </div>
        <ActionButton onClick={handleSubmit} className='mt-4'>
          {t('Ajukan Cuti','Submit Leave')}
        </ActionButton>
      </SectionCard>

      {/* History */}
      <SectionCard icon='📄' title={t('Riwayat Pengajuan','Submission History')} bodyClass='p-0'>
        {myLeaves.length ? (
          <DataTable columns={[
            { label: t('Jenis','Type') },
            { label: t('Mulai','Start') },
            { label: t('Selesai','End') },
            { label: t('Hari','Days') },
            { label: t('Keterangan','Note') },
            { label: 'Status' },
            { label: '' },
          ]}>
            {myLeaves.map(l => (
              <Tr key={l.id} onClick={() => setSelectedLeaveId(l.id)} active={selectedLeaveId === l.id}>
                <Td className='font-medium text-gray-800'>{l.type}</Td>
                <Td>{l.start}</Td>
                <Td>{l.end}</Td>
                <Td>{daysBetween(l.start, l.end)}</Td>
                <Td className='text-gray-500'>{l.note || '-'}</Td>
                <Td><StatusBadge status={l.status} /></Td>
                <Td>
                  {canWithdraw(l) && (
                    <button onClick={(e) => { e.stopPropagation(); handleWithdraw(l) }}
                      className='text-xs font-semibold text-orange-500 hover:text-orange-700 border border-orange-200 hover:border-orange-400 px-2.5 py-1 rounded-lg hover:bg-orange-50 transition'><Icon e='↩' size={14} className='inline align-[-2px]' /> Withdraw
                    </button>
                  )}
                </Td>
              </Tr>
            ))}
          </DataTable>
        ) : (
          <div className='p-5'>
            <EmptyState icon='🗓️' title={t('Belum ada pengajuan.','No submissions yet.')} />
          </div>
        )}
      </SectionCard>

      {/* Workflow Monitor — hanya tampil untuk row yang dipilih */}
      {selectedLeaveId && (() => {
        const selected = myLeaves.find(l => l.id === selectedLeaveId)
        return selected ? (
          <div className='mt-6'>
            <WorkflowMonitor leaves={[selected]} title='Workflow Monitor' expandedId={selectedLeaveId} />
          </div>
        ) : null
      })()}
    </div>
  )
}