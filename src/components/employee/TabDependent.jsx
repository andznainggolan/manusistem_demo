'use client'
import { useState } from 'react'
import { useT } from '@/store/languageStore'
import { Field, Input, Select, Section } from './EmployeeShared'
import { GENDERS, RELS } from '@/utils/constants'

const BLANK = { name: '', relationship: 'Spouse', birthDate: '', gender: 'Female' }

export default function TabDependent({ emp, add, upd, del, flash }) {
  const [form,    setForm   ] = useState(BLANK)
  const [editing, setEditing] = useState(null)
  const t = useT()

  const handleSave = () => {
    if (!form.name) return flash(t('Nama wajib diisi.', 'Name is required.'), 'error')
    if (editing) { upd(emp.id, editing, form); setEditing(null) }
    else         { add(emp.id, form) }
    setForm(BLANK)
    flash(t('Tanggungan disimpan.', 'Dependent saved.'))
  }

  return (
    <div className='space-y-6'>
      <Section title={editing ? t('Edit Tanggungan', 'Edit Dependent') : t('Tambah Tanggungan', 'Add Dependent')}>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          <div className='col-span-2'>
            <Field label={t('Nama', 'Name')}>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </Field>
          </div>
          <Field label={t('Hubungan', 'Relationship')}>
            <Select value={form.relationship} onChange={e => setForm(f => ({ ...f, relationship: e.target.value }))} options={RELS} />
          </Field>
          <Field label='Gender'>
            <Select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))} options={GENDERS} />
          </Field>
          <Field label={t('Tanggal Lahir', 'Date of Birth')}>
            <Input type='date' value={form.birthDate} onChange={e => setForm(f => ({ ...f, birthDate: e.target.value }))} />
          </Field>
        </div>
        <div className='flex gap-2 mt-3'>
          <button onClick={handleSave}
            className='px-5 py-2 text-white text-xs font-semibold rounded-lg hover:opacity-90'
            style={{ background: 'linear-gradient(135deg,#8B1A1A,#D7252B)' }}>
            {editing ? t('Simpan', 'Save') : t('Tambah', 'Add')}
          </button>
          {editing && (
            <button onClick={() => { setEditing(null); setForm(BLANK) }}
              className='px-4 py-2 bg-gray-100 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-200'>
              {t('Batal', 'Cancel')}
            </button>
          )}
        </div>
      </Section>

      <Section title={t('Daftar Tanggungan', 'Dependent List')}>
        {emp.dependents.length === 0
          ? <p className='text-sm text-gray-400'>{t('Belum ada tanggungan.', 'No dependents yet.')}</p>
          : (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
              {emp.dependents.map(d => (
                <div key={d.id} className='border border-gray-100 rounded-xl p-4 flex items-center gap-3'>
                  <div className='w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0'
                    style={{ background: 'linear-gradient(135deg,#8B1A1A,#D7252B)' }}>
                    {(d.name||'?').trim().split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()}
                  </div>
                  <div className='flex-1 min-w-0'>
                    <div className='text-sm font-semibold text-gray-800'>{d.name}</div>
                    <div className='text-xs text-gray-500'>{d.relationship} · {d.birthDate || '-'}</div>
                  </div>
                  <div className='flex gap-1'>
                    <button
                      onClick={() => { setEditing(d.id); setForm({ name: d.name, relationship: d.relationship, birthDate: d.birthDate, gender: d.gender }) }}
                      className='px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-lg hover:bg-blue-100'>
                      {t('Edit', 'Edit')}
                    </button>
                    <button
                      onClick={() => { del(emp.id, d.id); flash(t('Tanggungan dihapus.', 'Dependent deleted.')) }}
                      className='px-2 py-1 bg-red-50 text-red-500 text-xs rounded-lg hover:bg-red-100'>
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </Section>
    </div>
  )
}
