'use client'
import { useState }      from 'react'
import { useLeaveStore } from '@/store/leaveStore'
import { useT } from '@/store/languageStore'
import {
  PageHeader, StatCard, SectionCard, DataTable, Tr, Td,
  StatusBadge, ActionButton, Input, EmptyState,
} from '@/components/ui'
import Icon from '@/components/ui/Icon'

export default function LeaveWorkflowPage() {
  const t = useT()
  const { leaveTypes } = useLeaveStore()
  const [types, setTypes] = useState(leaveTypes.map(t=>({...t})))
  const [msg,   setMsg  ] = useState(null)

  const flash = (text,type='success') => { setMsg({text,type}); setTimeout(()=>setMsg(null),3000) }

  const update = (id, key, val) =>
    setTypes(ts => ts.map(t => t.id===id ? {...t, [key]: val} : t))

  const handleSave = () => {
    flash('Pengaturan workflow disimpan.')
  }

  const activeCount = types.filter(t => t.active).length
  const totalDays   = types.reduce((s, t) => s + (Number(t.maxDays) || 0), 0)

  return (
    <div>
      <PageHeader
        icon={<Icon name='shuffle' />}
        title='Leave Workflow'
        subtitle='Konfigurasi jenis cuti, kuota, dan alur persetujuan.'
      />

      {msg && (
        <div className={`text-sm px-4 py-2.5 rounded-lg mb-4 inline-block ${msg.type==='error'?'bg-red-50 text-red-600':'bg-emerald-50 text-emerald-600'}`}>
          {msg.text}
        </div>
      )}

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6'>
        <StatCard label='Jenis Cuti'  value={types.length} icon={<Icon name='calendar' />} tone='brand' />
        <StatCard label='Aktif'       value={activeCount}  icon={<Icon name='check' />} tone='green' hint={`${types.length - activeCount} nonaktif`} />
        <StatCard label='Total Kuota' value={totalDays}    icon={<Icon name='chart' />} tone='blue'  hint='maks. hari (gabungan)' />
      </div>

      <SectionCard title='Jenis Cuti & Kuota' icon={<Icon name='calendar' />} className='mb-6'
        actions={<ActionButton size='sm' onClick={handleSave}><Icon name='save' size={13} className='inline align-[-2px]' /> {t('Simpan','Save')}</ActionButton>}
        bodyClass='p-0'>
        {types.length === 0 ? (
          <div className='p-5'>
            <EmptyState title='Belum ada jenis cuti' description='Tambahkan jenis cuti untuk mulai mengonfigurasi kuota.' />
          </div>
        ) : (
          <DataTable
            className='rounded-none shadow-none ring-0'
            columns={[
              { label: 'Nama Cuti' },
              { label: 'Maks. Hari', align: 'right' },
              { label: 'Aktif' },
            ]}>
            {types.map(t=>(
              <Tr key={t.id}>
                <Td className='font-medium text-gray-800'>{t.name}</Td>
                <Td align='right'>
                  <Input type='number' value={t.maxDays} min={1} max={365}
                    onChange={e=>update(t.id,'maxDays',+e.target.value)}
                    className='w-24 text-right' />
                </Td>
                <Td>
                  <label className='flex items-center gap-2 cursor-pointer'>
                    <input type='checkbox' checked={t.active} onChange={e=>update(t.id,'active',e.target.checked)}
                      className='w-4 h-4 accent-red-600' />
                    <StatusBadge status={t.active ? 'Active' : 'Inactive'}>
                      {t.active ? 'Aktif' : 'Nonaktif'}
                    </StatusBadge>
                  </label>
                </Td>
              </Tr>
            ))}
          </DataTable>
        )}
      </SectionCard>

      {/* Approval flow info */}
      <SectionCard title='Alur Persetujuan' icon={<Icon name='shuffle' />}>
        <div className='flex flex-wrap items-center gap-3 text-sm'>
          {[
            { step:'1', label:'Karyawan mengajukan', icon:'👤' },
            { step:'→', label:null },
            { step:'2', label:'Manager mereview', icon:'👥' },
            { step:'→', label:null },
            { step:'3', label:'HR memvalidasi', icon:'🗂️' },
            { step:'→', label:null },
            { step:'✓', label:'Selesai', icon:'✅' },
          ].map((s,i)=>(
            s.label === null
              ? <span key={i} className='text-gray-300 text-lg'><Icon e='→' size={15} /></span>
              : (
                <div key={i} className='flex flex-col items-center bg-red-50 rounded-xl px-5 py-4 min-w-[110px] ring-1 ring-red-100'>
                  <span className='mb-1 text-gray-500'><Icon e={s.icon} size={22} /></span>
                  <span className='text-xs font-bold text-red-700 mb-0.5'>Step {s.step}</span>
                  <span className='text-xs text-gray-500 text-center'>{s.label}</span>
                </div>
              )
          ))}
        </div>
      </SectionCard>
    </div>
  )
}
