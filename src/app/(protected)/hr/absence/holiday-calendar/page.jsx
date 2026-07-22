'use client'
import { useState }        from 'react'
import { useHolidayStore } from '@/store/holidayStore'
import { useT } from '@/store/languageStore'
import { PageHeader, SectionCard, DataTable, Tr, Td, FilterBar, FilterPill, StatusBadge, ActionButton, EmptyState, FormField, Input, Select } from '@/components/ui'

const COUNTRIES = ['ID','SG']
const BRAND     = 'linear-gradient(135deg,#8B1A1A,#D7252B)'
const BLANK     = { name:'', date:'', type:'National', recurring:false }

export default function HolidayCalendarPage() {
  const t = useT()
  const { holidays, addHoliday, updateHoliday, deleteHoliday } = useHolidayStore()
  const [country,   setCountry  ] = useState('ID')
  const [year,      setYear     ] = useState(new Date().getFullYear())
  const [form,      setForm     ] = useState(BLANK)
  const [editing,   setEditing  ] = useState(null)
  const [showModal, setShowModal ] = useState(false)
  const [msg,       setMsg      ] = useState(null)

  const filtered = holidays
    .filter(h => h.country === country && new Date(h.date).getFullYear() === year)
    .sort((a,b) => a.date.localeCompare(b.date))

  const flash = (text, type='success') => {
    setMsg({ text, type })
    setTimeout(() => setMsg(null), 3000)
  }

  const openNew    = () => { setEditing(null); setForm(BLANK); setShowModal(true) }
  const closeModal = () => { setShowModal(false); setEditing(null); setForm(BLANK) }

  const handleSave = () => {
    if (!form.name || !form.date) return flash('Nama dan tanggal wajib diisi.', 'error')
    if (editing) {
      updateHoliday(editing, { ...form, country })
      flash('Hari libur diperbarui.')
    } else {
      addHoliday({ ...form, country })
      flash('Hari libur ditambahkan.')
    }
    closeModal()
  }

  const handleEdit = (h) => {
    setEditing(h.id)
    setForm({ name:h.name, date:h.date, type:h.type, recurring:h.recurring })
    setShowModal(true)
  }

  return (
    <div className='flex flex-col gap-6'>
      {msg && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl text-sm font-semibold
          ${msg.type==='error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
          {msg.type==='error' ? '⚠' : '✓'} {msg.text}
        </div>
      )}

      <PageHeader
        icon='🗓️'
        title='Holiday Calendar'
        subtitle={t('Kelola hari libur nasional per negara dan tahun.', 'Manage national holidays by country and year.')}
      />

      {/* Filters */}
      <FilterBar>
        <span className='text-xs font-semibold text-gray-500 mr-1'>{t('Negara', 'Country')}:</span>
        {COUNTRIES.map(c => (
          <FilterPill key={c} active={country === c} onClick={() => setCountry(c)}>{c}</FilterPill>
        ))}
        <span className='text-xs font-semibold text-gray-500 mx-1'>{t('Tahun', 'Year')}:</span>
        {[year-1, year, year+1].map(y => (
          <FilterPill key={y} active={year === y} onClick={() => setYear(y)}>{y}</FilterPill>
        ))}
      </FilterBar>

      <SectionCard
        title={`${t('Daftar Hari Libur', 'Holiday List')} — ${country} ${year}`}
        icon='🗓️'
        subtitle={`${filtered.length} ${t('hari', 'days')}`}
        bodyClass='p-0'
        actions={
          <button onClick={openNew}
            className='flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white rounded-lg shadow-sm hover:opacity-90 transition whitespace-nowrap'
            style={{ background: BRAND }}>
            + {t('Tambah Hari Libur', 'Add Holiday')}
          </button>
        }
      >
        <DataTable
          columns={[
            { label: t('Tanggal', 'Date') },
            { label: t('Nama', 'Name') },
            { label: t('Tipe', 'Type') },
            { label: t('Berulang', 'Recurring'), align: 'center' },
            { label: t('Aksi', 'Action'), align: 'right' },
          ]}
          className='ring-0 shadow-none rounded-none'
        >
          {filtered.length ? filtered.map(h => (
            <Tr key={h.id}>
              <Td className='text-gray-600 tabular-nums'>{h.date}</Td>
              <Td className='font-medium text-gray-800'>{h.name}</Td>
              <Td>
                <StatusBadge tone={h.type === 'National' ? 'info' : 'neutral'}>
                  {h.type === 'National' ? t('Nasional', 'National') : t('Perusahaan', 'Company')}
                </StatusBadge>
              </Td>
              <Td align='center' className='text-gray-500'>{h.recurring ? '✅' : '—'}</Td>
              <Td align='right'>
                <div className='flex justify-end gap-2'>
                  <ActionButton size='sm' variant='secondary' onClick={() => handleEdit(h)}>
                    {t('Edit', 'Edit')}
                  </ActionButton>
                  <ActionButton size='sm' variant='secondary'
                    className='!bg-red-50 !text-red-600 !border-red-100 hover:!bg-red-100'
                    onClick={() => deleteHoliday(h.id)}>
                    {t('Hapus', 'Delete')}
                  </ActionButton>
                </div>
              </Td>
            </Tr>
          )) : (
            <tr>
              <td colSpan={5} className='px-4 py-10'>
                <EmptyState icon='🗓️'
                  title={t(`Belum ada hari libur untuk ${country} ${year}.`, `No holidays for ${country} ${year}.`)} />
              </td>
            </tr>
          )}
        </DataTable>
      </SectionCard>

      {showModal && (
        <div className='fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4' onClick={closeModal}>
          <div className='bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto' onClick={e => e.stopPropagation()}>
            <div className='px-6 py-4 border-b border-gray-100 flex items-center justify-between'>
              <h2 className='text-base font-bold text-gray-800'>
                {editing ? t('Edit Hari Libur', 'Edit Holiday') : t('Tambah Hari Libur', 'Add Holiday')}
              </h2>
              <button onClick={closeModal} className='text-gray-400 hover:text-gray-600 text-xl font-bold leading-none'>×</button>
            </div>
            <div className='px-6 py-5 space-y-4'>
              <FormField label={t('Nama', 'Name')} required>
                <Input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}
                  placeholder={t('Nama hari libur', 'Holiday name')} />
              </FormField>
              <FormField label={t('Tanggal', 'Date')} required>
                <Input type='date' value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} />
              </FormField>
              <FormField label={t('Tipe', 'Type')}>
                <Select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
                  <option value='National'>{t('Nasional', 'National')}</option>
                  <option value='Company'>{t('Perusahaan', 'Company')}</option>
                </Select>
              </FormField>
              <label className='flex items-center gap-2 text-sm text-gray-600 cursor-pointer'>
                <input type='checkbox' checked={form.recurring} onChange={e=>setForm(f=>({...f,recurring:e.target.checked}))}
                  className='h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-200' />
                {t('Berulang setiap tahun', 'Repeat every year')}
              </label>
            </div>
            <div className='px-6 pb-5 flex gap-3'>
              <button onClick={handleSave} className='flex-1 py-2.5 text-sm font-semibold text-white rounded-xl hover:opacity-90 transition' style={{ background: BRAND }}>
                {editing ? t('Simpan Perubahan', 'Save Changes') : t('Tambah Hari Libur', 'Add Holiday')}
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
