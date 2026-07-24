'use client'
import { useState, useMemo } from 'react'
import { useEmployeeStore }  from '@/store/employeeStore'
import { usePayrollStore, formatRp } from '@/store/payrollStore'
import { PTKP_STATUSES }     from '@/lib/payrollCalc'
import { useT } from '@/store/languageStore'
import {
  PageHeader, SectionCard, DataTable, Tr, Td,
  ActionButton, FormField, Select, Input, SearchBar, EmptyState,
} from '@/components/ui'

export default function PayrollSetupPage() {
  const t = useT()
  const { employees } = useEmployeeStore()
  const { getProfile, setProfile } = usePayrollStore()
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState(null) // employee object
  const [form, setForm] = useState(null)

  const active = employees.filter(e => e.status === 'Active')
  const rows = useMemo(() => {
    const query = q.trim().toLowerCase()
    return active.filter(e => !query || e.name.toLowerCase().includes(query) || (e.department||'').toLowerCase().includes(query))
  }, [active, q])

  const openEdit = (emp) => {
    setEditing(emp)
    setForm(getProfile(emp.id))
  }

  const save = () => {
    setProfile(editing.id, {
      basic: Number(form.basic) || 0,
      allowance: Number(form.allowance) || 0,
      ptkpStatus: form.ptkpStatus,
      npwp: form.npwp,
      bpjsKesehatan: form.bpjsKesehatan,
      bpjsTk: form.bpjsTk,
    })
    setEditing(null)
  }

  return (
    <div>
      <PageHeader
        icon='🧾'
        title={t('Payroll Setup','Payroll Setup')}
        subtitle={t('Atur gaji pokok, tunjangan, status PTKP, NPWP, dan kepesertaan BPJS per karyawan.','Configure basic salary, allowance, PTKP status, NPWP, and BPJS enrollment per employee.')}
      />

      <SearchBar value={q} onChange={setQ} placeholder={t('Cari nama atau departemen…','Search name or department…')} className='mb-4 max-w-sm' />

      <SectionCard bodyClass='p-0'>
        {rows.length ? (
          <DataTable columns={[
            { label: t('Nama','Name') },
            { label: t('Departemen','Department') },
            { label: t('Gaji Pokok','Basic Salary'), align:'right' },
            { label: 'PTKP' },
            { label: 'NPWP' },
            { label: 'BPJS' },
            { label: '' },
          ]}>
            {rows.map(e => {
              const p = getProfile(e.id)
              return (
                <Tr key={e.id}>
                  <Td className='font-medium text-gray-800'>{e.name}</Td>
                  <Td className='text-gray-500'>{e.department || '—'}</Td>
                  <Td align='right' className='text-gray-700'>{formatRp(p.basic)}</Td>
                  <Td className='text-gray-600'>{p.ptkpStatus}</Td>
                  <Td className='text-gray-600'>{p.npwp ? t('Ada','Yes') : t('Tidak ada','No')}</Td>
                  <Td className='text-gray-600'>{p.bpjsKesehatan && p.bpjsTk ? t('Lengkap','Full') : p.bpjsKesehatan || p.bpjsTk ? t('Sebagian','Partial') : t('Tidak','None')}</Td>
                  <Td align='right'>
                    <button onClick={()=>openEdit(e)} className='text-xs font-semibold text-red-700 hover:underline'>
                      {t('Edit','Edit')}
                    </button>
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

      {editing && form && (
        <div className='fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4' onClick={()=>setEditing(null)}>
          <div className='bg-white rounded-2xl shadow-xl w-full max-w-md p-6' onClick={e=>e.stopPropagation()}>
            <div className='flex justify-between items-start mb-4'>
              <h3 className='text-base font-bold text-gray-800'>{editing.name}</h3>
              <button onClick={()=>setEditing(null)} className='text-gray-400 hover:text-gray-600 text-xl font-bold leading-none'>×</button>
            </div>

            <div className='grid grid-cols-2 gap-3 mb-3'>
              <FormField label={t('Gaji Pokok','Basic Salary')}>
                <Input type='number' value={form.basic} onChange={e=>setForm(f=>({...f, basic:e.target.value}))} />
              </FormField>
              <FormField label={t('Tunjangan Tetap','Fixed Allowance')}>
                <Input type='number' value={form.allowance} onChange={e=>setForm(f=>({...f, allowance:e.target.value}))} />
              </FormField>
            </div>

            <div className='grid grid-cols-2 gap-3 mb-3'>
              <FormField label='PTKP'>
                <Select value={form.ptkpStatus} onChange={e=>setForm(f=>({...f, ptkpStatus:e.target.value}))}>
                  {PTKP_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </Select>
              </FormField>
              <FormField label='NPWP'>
                <Select value={form.npwp ? '1' : '0'} onChange={e=>setForm(f=>({...f, npwp: e.target.value==='1'}))}>
                  <option value='1'>{t('Ada','Yes')}</option>
                  <option value='0'>{t('Tidak ada','No')}</option>
                </Select>
              </FormField>
            </div>

            <div className='flex gap-4 mb-5 text-sm'>
              <label className='flex items-center gap-2'>
                <input type='checkbox' checked={form.bpjsKesehatan} onChange={e=>setForm(f=>({...f, bpjsKesehatan:e.target.checked}))} />
                BPJS Kesehatan
              </label>
              <label className='flex items-center gap-2'>
                <input type='checkbox' checked={form.bpjsTk} onChange={e=>setForm(f=>({...f, bpjsTk:e.target.checked}))} />
                BPJS Ketenagakerjaan
              </label>
            </div>

            <div className='flex gap-2'>
              <button onClick={()=>setEditing(null)} className='flex-1 py-2.5 text-sm font-semibold bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition'>
                {t('Batal','Cancel')}
              </button>
              <ActionButton onClick={save} className='flex-1'>{t('Simpan','Save')}</ActionButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
