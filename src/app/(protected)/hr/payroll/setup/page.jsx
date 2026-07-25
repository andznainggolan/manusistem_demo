'use client'
import { useState, useMemo } from 'react'
import { useEmployeeStore }  from '@/store/employeeStore'
import { usePayrollStore, formatRp } from '@/store/payrollStore'
import { useT } from '@/store/languageStore'
import {
  PageHeader, SectionCard, DataTable, Tr, Td,
  SearchBar, EmptyState, StatusBadge,
} from '@/components/ui'

export default function PayrollSetupPage() {
  const t = useT()
  const { employees } = useEmployeeStore()
  const { getProfile, getSalaryRecords } = usePayrollStore()
  const [q, setQ] = useState('')

  const active = employees.filter(e => e.status === 'Active')
  const rows = useMemo(() => {
    const query = q.trim().toLowerCase()
    return active.filter(e => !query || e.name.toLowerCase().includes(query) || (e.department||'').toLowerCase().includes(query))
  }, [active, q])

  return (
    <div>
      <PageHeader
        icon='🧾'
        title={t('Payroll Setup','Payroll Setup')}
        subtitle={t('Gaji pokok saat ini per karyawan. Klik "Kelola" untuk mengubah riwayat gaji (dengan tanggal efektif) di halaman Employee Data.','Current basic salary per employee. Click "Manage" to edit the dated salary history on the Employee Data page.')}
      />

      <SearchBar value={q} onChange={setQ} placeholder={t('Cari nama atau departemen…','Search name or department…')} className='mb-4 max-w-sm' />

      <SectionCard bodyClass='p-0'>
        {rows.length ? (
          <DataTable columns={[
            { label: t('Nama','Name') },
            { label: t('Departemen','Department') },
            { label: t('Efektif Sejak','Effective Since') },
            { label: t('Gaji Pokok','Basic Salary'), align:'right' },
            { label: 'PTKP' },
            { label: 'NPWP' },
            { label: 'BPJS' },
            { label: '' },
          ]}>
            {rows.map(e => {
              const p = getProfile(e.id)
              const hasHistory = getSalaryRecords(e.id).length > 0
              return (
                <Tr key={e.id}>
                  <Td className='font-medium text-gray-800'>{e.name}</Td>
                  <Td className='text-gray-500'>{e.department || '—'}</Td>
                  <Td className='text-gray-500'>
                    {hasHistory
                      ? <span className='font-mono text-xs'>{getSalaryRecords(e.id)[0]?.effectiveStartDate}</span>
                      : <StatusBadge tone='neutral'>{t('Default','Default')}</StatusBadge>}
                  </Td>
                  <Td align='right' className='text-gray-700'>{formatRp(p.basic)}</Td>
                  <Td className='text-gray-600'>{p.ptkpStatus}</Td>
                  <Td className='text-gray-600'>{p.npwp ? t('Ada','Yes') : t('Tidak ada','No')}</Td>
                  <Td className='text-gray-600'>{p.bpjsKesehatan && p.bpjsTk ? t('Lengkap','Full') : p.bpjsKesehatan || p.bpjsTk ? t('Sebagian','Partial') : t('Tidak','None')}</Td>
                  <Td align='right'>
                    <a href={`/hr/employee/${e.id}?tab=Salary`} className='text-xs font-semibold text-red-700 hover:underline'>
                      {t('Kelola','Manage')}
                    </a>
                  </Td>
                </Tr>
              )
            })}
          </DataTable>
        ) : (
          <div className='p-5'>
            <EmptyState icon='🔍' title={t('Tidak ada karyawan yang cocok.','No matching employees.')} />
          </div>
        )}
      </SectionCard>
    </div>
  )
}
