'use client'
import { useMemo, useState } from 'react'
import { useStructureStore, PC_CATEGORY_COLOR } from '@/store/structureStore'
import { PageHeader, SectionCard, FormField, Input, Select, ActionButton } from '@/components/ui'

const fmt = (n) => new Intl.NumberFormat('id-ID').format(Math.round(n || 0))

export default function MasterGradePage() {
  const { grades, positions, updateGrade, addGrade } = useStructureStore()
  const groups = useMemo(() => {
    const map = {}
    ;[...grades].sort((a, b) => a.pc - b.pc).forEach(g => { (map[g.category] ||= []).push(g) })
    return map
  }, [grades])
  const categories = Object.keys(groups)
  const usedBy = (gradeId) => positions.filter(p => p.gradeId === gradeId).length

  const [form, setForm] = useState({ code: '', name: '', category: categories[0] || '', min: '', max: '' })
  const [error, setError] = useState('')
  const add = () => {
    if (!form.code.trim() || !form.name.trim() || !form.category) return setError('Kode, nama, dan kategori wajib diisi.')
    const min = Number(form.min), max = Number(form.max)
    if (!(min > 0) || !(max >= min)) return setError('Rentang gaji tidak valid (maksimum harus sama atau lebih besar dari minimum).')
    const pc = grades.reduce((m, g) => Math.max(m, g.pc), 0) + 1
    addGrade({ id: pc, pc, code: form.code.trim(), name: form.name.trim(), category: form.category, minSalary: min, maxSalary: max, isBoard: false, isIntern: false, isNonMgr: false, isMgr: false })
    setForm({ ...form, code: '', name: '', min: '', max: '' }); setError('')
  }

  return (
    <div>
      <PageHeader
        icon='🏅'
        title='Master Grade'
        subtitle='Golongan PNS, jenjang jabatan fungsional guru, golongan PPPK, dan jabatan pembina. Rentang gaji adalah skala contoh yayasan dan dapat diubah.'
      />
      <div className='space-y-6'>
        {Object.entries(groups).map(([cat, items]) => (
          <SectionCard key={cat} title={cat} icon='📊' bodyClass='p-0'
            actions={<span className={`rounded-full px-3 py-1 text-xs font-bold ${PC_CATEGORY_COLOR[cat] || 'bg-gray-100 text-gray-600'}`}>{items.length} tingkat</span>}>
            <table className='w-full text-sm'>
              <thead>
                <tr className='border-b border-gray-100 text-left text-[11px] font-bold uppercase tracking-wide text-gray-400'>
                  <th className='px-5 py-2.5'>Kode</th><th className='px-3 py-2.5'>Nama</th>
                  <th className='px-3 py-2.5 text-right'>Gaji minimum</th><th className='px-3 py-2.5 text-right'>Gaji maksimum</th>
                  <th className='px-5 py-2.5 text-right'>Dipakai jabatan</th>
                </tr>
              </thead>
              <tbody>
                {items.map(g => (
                  <tr key={g.id} className='border-b border-gray-50'>
                    <td className='px-5 py-2 font-bold text-red-700'>{g.code}</td>
                    <td className='px-3 py-2'>
                      <input value={g.name} onChange={e => updateGrade(g.id, { name: e.target.value })}
                        className='w-full min-w-[200px] rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm text-gray-700 hover:border-gray-200 focus:border-teal-300 focus:bg-white focus:outline-none' />
                    </td>
                    <td className='px-3 py-2 text-right'>
                      <input type='number' value={g.minSalary} onChange={e => updateGrade(g.id, { minSalary: Number(e.target.value) || 0 })}
                        className='w-36 rounded-lg border border-transparent bg-transparent px-2 py-1 text-right tabular-nums text-gray-700 hover:border-gray-200 focus:border-teal-300 focus:bg-white focus:outline-none' />
                    </td>
                    <td className='px-3 py-2 text-right'>
                      <input type='number' value={g.maxSalary} onChange={e => updateGrade(g.id, { maxSalary: Number(e.target.value) || 0 })}
                        className='w-36 rounded-lg border border-transparent bg-transparent px-2 py-1 text-right tabular-nums text-gray-700 hover:border-gray-200 focus:border-teal-300 focus:bg-white focus:outline-none' />
                    </td>
                    <td className='px-5 py-2 text-right text-xs text-gray-500'>{usedBy(g.id) ? `${usedBy(g.id)} jabatan` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </SectionCard>
        ))}

        <SectionCard title='Tambah Golongan / Jenjang' icon='➕'>
          <div className='grid grid-cols-1 gap-3 md:grid-cols-5'>
            <FormField label='Kode'><Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder='mis. III/e' /></FormField>
            <FormField label='Nama'><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></FormField>
            <FormField label='Kategori'>
              <Select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
            </FormField>
            <FormField label='Gaji minimum'><Input type='number' value={form.min} onChange={e => setForm({ ...form, min: e.target.value })} /></FormField>
            <FormField label='Gaji maksimum'><Input type='number' value={form.max} onChange={e => setForm({ ...form, max: e.target.value })} /></FormField>
          </div>
          {error && <p className='mt-3 text-xs text-red-600'>{error}</p>}
          <div className='mt-4'><ActionButton onClick={add}>Tambah</ActionButton></div>
          <p className='mt-3 text-xs text-gray-400'>Perubahan rentang gaji berlaku untuk payroll yang dibuat sesudahnya. Payroll yang sudah ada tidak berubah. Gaji dasar default = titik tengah rentang.</p>
        </SectionCard>
      </div>
    </div>
  )
}
