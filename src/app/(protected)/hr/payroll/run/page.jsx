'use client'
import Icon from '@/components/ui/Icon'
import { useState }                    from 'react'
import { usePayrollStore, formatRp }   from '@/store/payrollStore'
import { useT } from '@/store/languageStore'
import {
  PageHeader, StatCard, SectionCard, DataTable, Tr, Td,
  StatusBadge, ActionButton, FormField, Select, EmptyState,
} from '@/components/ui'

export default function PayrollRunPage() {
  const t = useT()
  const { payslips, publishPeriod } = usePayrollStore()
  const [period, setPeriod] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
  })
  const [msg, setMsg] = useState(null)

  const flash = (text,type='success') => { setMsg({text,type}); setTimeout(()=>setMsg(null),3000) }

  const periodList = [...new Set(payslips.map(p=>p.period))].sort((a,b)=>b.localeCompare(a))
  const rows       = payslips.filter(p=>p.period===period)
  const isDraft    = rows.some(p=>p.status==='Draft')

  const handlePublish = () => {
    publishPeriod(period)
    flash(t('Payroll berhasil dipublish!','Payroll published successfully!').replace('!',` - ${period}!`))
  }

  const totalNet = rows.reduce((s,p)=>s+p.net, 0)

  return (
    <div>
      <PageHeader
        icon='💼'
        title='Payroll Run'
        subtitle={t('Review dan publish payroll bulanan.','Review and publish monthly payroll.')}
      />

      {/* Period selector */}
      <SectionCard className='mb-6'>
        <div className='flex flex-wrap items-end gap-4'>
          <FormField label={t('Periode','Period')} className='w-44'>
            <Select value={period} onChange={e=>setPeriod(e.target.value)}>
              {periodList.map(p=><option key={p} value={p}>{p}</option>)}
            </Select>
          </FormField>
          {msg && (
            <div className={`mb-1 text-xs px-4 py-2 rounded-lg ${msg.type==='error'?'bg-red-50 text-red-600':'bg-emerald-50 text-emerald-700'}`}>
              {msg.text}
            </div>
          )}
          <div className='ml-auto mb-0.5'>
            {isDraft ? (
              <ActionButton onClick={handlePublish} icon='🚀'>Publish Payroll</ActionButton>
            ) : (
              <StatusBadge tone='success'><Icon e='✅' size={14} className='inline align-[-2px]' /> Published</StatusBadge>
            )}
          </div>
        </div>
      </SectionCard>

      {/* Summary */}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6'>
        <StatCard icon='👥' tone='brand'  label={t('Total Karyawan','Total Employees')} value={rows.length} />
        <StatCard icon='💵' tone='blue'   label={t('Total Gaji Pokok','Total Basic Salary')} value={formatRp(rows.reduce((s,p)=>s+p.basic,0))} />
        <StatCard icon='🏦' tone='green'  label={t('Total Take-Home','Total Take-Home')} value={formatRp(totalNet)} />
      </div>

      {/* Table */}
      <SectionCard icon='💼' title={`${t('Detail Payroll','Payroll Detail')} — ${period}`} bodyClass='p-0'>
        {rows.length ? (
          <DataTable columns={[
            { label: t('Nama','Name') },
            { label: t('Gaji Pokok','Basic Salary'), align:'right' },
            { label: t('Tunjangan','Allowance'), align:'right' },
            { label: t('Potongan','Deduction'), align:'right' },
            { label: 'Take-Home', align:'right' },
            { label: 'Status' },
          ]}>
            {rows.map(p=>(
              <Tr key={p.id}>
                <Td className='font-medium text-gray-800'>{p.name}</Td>
                <Td align='right' className='text-gray-600'>{formatRp(p.basic)}</Td>
                <Td align='right' className='text-gray-600'>{formatRp(p.allowance)}</Td>
                <Td align='right' className='text-red-500'>-{formatRp(p.deduction)}</Td>
                <Td align='right' className='font-semibold text-gray-900'>{formatRp(p.net)}</Td>
                <Td><StatusBadge status={p.status} /></Td>
              </Tr>
            ))}
          </DataTable>
        ) : (
          <div className='p-5'>
            <EmptyState icon='📭' title={t('Tidak ada data untuk periode ini.','No data for this period.')} />
          </div>
        )}
      </SectionCard>
    </div>
  )
}
