'use client'
import { useState } from 'react'
import { PageHeader } from '@/components/ui'
import JlaBoard from '@/components/jla/JlaBoard'
import JlaRealizationBoard from '@/components/jla/JlaRealizationBoard'
import JlaExcelBoard from '@/components/jla/JlaExcelBoard'
import { useJlaDraft } from '@/store/jlaDraft'

// The JLA page of Manager Self Service: the manager's own unit, without the HR settings
// (target hours, payroll basis, task types) or the worker-category and timetable admin.
const TABS = [
  { key: 'kalender', label: 'Kalender & Plan' },
  { key: 'realisasi', label: 'Realisasi' },
  { key: 'excel', label: 'Import / Export' },
]

export default function MssJlaTabs({ initialTab = 'kalender' }) {
  const [tab, setTab] = useState(initialTab)
  const draft = useJlaDraft()
  return (
    <div>
      <PageHeader
        icon='🗓️'
        title='Job Load Analysis (JLA)'
        subtitle='Pantau beban kerja guru di unit Anda: jadwal mingguan, realisasi, dan import atau export Excel.'
      />
      <div className='mb-6 flex flex-wrap gap-2'>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${tab === t.key ? 'bg-[#052B52] text-white shadow' : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'}`}>
            {t.label}{t.key === 'kalender' && draft.dirty ? ' •' : ''}
          </button>
        ))}
      </div>
      {draft.dirty && tab !== 'kalender' && (
        <div className='mb-4 rounded-xl bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-800 ring-1 ring-amber-200'>
          Ada perubahan kalender yang belum disimpan. Buka tab Kalender & Plan untuk menyimpan atau membuangnya.
        </div>
      )}
      {tab === 'kalender' && <JlaBoard scope='unit' />}
      {tab === 'realisasi' && <JlaRealizationBoard scope='unit' />}
      {tab === 'excel' && <JlaExcelBoard scope='unit' />}
    </div>
  )
}
