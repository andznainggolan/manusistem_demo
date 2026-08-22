'use client'
import { useState, useMemo } from 'react'
import { useStructureStore } from '@/store/structureStore'
import { useT } from '@/store/languageStore'
import {
  PageHeader, StatCard, SectionCard, DataTable, Tr, Td,
  FormField, Input, Select, ActionButton, StatusBadge, EmptyState,
} from '@/components/ui'
import CriteriaMultiSelect from '@/components/ui/CriteriaMultiSelect'
import { EMP_TYPES } from '@/utils/constants'

const BLANK = {
  name: '', companyIds: [], departmentIds: [], gradeFromId: '', gradeToId: '',
  location: '', employmentType: '', eligible: 'true', active: 'true', notes: '',
}

// Compact "2 names then +N" summary, same convention used by the
// onboarding/offboarding auto-assign criteria pages.
const namesSummary = (ids, items, allLabel) => {
  if (!ids?.length) return allLabel
  const names = ids.map(id => items.find(i => i.id === id)?.name).filter(Boolean)
  return names.length <= 2 ? names.join(', ') : `${names.slice(0, 2).join(', ')} +${names.length - 2}`
}

// One reusable eligibility-rule settings page — who a given overtime /
// compensatory-leave feature applies to, by Company (PT) / Grade (PC) range /
// Department / Location / Employment Type. Rendered by five thin page.jsx
// files (Overtime Plan/Realization by Employee/Manager, Compensatory Leave)
// that only differ in copy and which store slice they bind to.
export default function EligibilitySettings({ icon, title, subtitle, rules, addRule, updateRule, deleteRule }) {
  const t = useT()
  const { companies, departments, grades } = useStructureStore()
  const sortedGrades = useMemo(() => [...grades].sort((a, b) => a.id - b.id), [grades])
  const companyItems = useMemo(() => companies.map(c => ({ id: c.id, name: c.name || c.companyCode })), [companies])
  const departmentItems = useMemo(() => departments.map(d => ({ id: d.id, name: d.name })), [departments])

  const [form, setForm] = useState(BLANK)
  const [editing, setEditing] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [msg, setMsg] = useState(null)

  const flash = (text, type = 'success') => { setMsg({ text, type }); setTimeout(() => setMsg(null), 3000) }

  const gradeCode  = (id) => grades.find(g => g.id === id)?.code || '—'
  const gradeRange = (r) => (r.gradeFromId && r.gradeToId) ? `${gradeCode(r.gradeFromId)}–${gradeCode(r.gradeToId)}` : t('Semua Grade', 'All Grades')

  const activeCount   = rules.filter(r => r.active).length
  const eligibleCount = rules.filter(r => r.eligible && r.active).length

  const toggleIn = (key, val) => setForm(f => {
    const cur = f[key] ?? []
    return { ...f, [key]: cur.includes(val) ? cur.filter(x => x !== val) : [...cur, val] }
  })
  const selectAllIn = (key, items, allSel) => setForm(f => ({ ...f, [key]: allSel ? [] : items.map(i => i.id) }))

  const openNew = () => { setEditing(null); setForm(BLANK); setShowModal(true) }
  const closeModal = () => { setShowModal(false); setEditing(null); setForm(BLANK) }

  const openEdit = (r) => {
    setEditing(r.id)
    setForm({
      name: r.name, companyIds: r.companyIds || [], departmentIds: r.departmentIds || [],
      gradeFromId: r.gradeFromId ? String(r.gradeFromId) : '', gradeToId: r.gradeToId ? String(r.gradeToId) : '',
      location: r.location || '', employmentType: r.employmentType || '',
      eligible: String(r.eligible), active: String(r.active), notes: r.notes || '',
    })
    setShowModal(true)
  }

  const handleSave = () => {
    if (!form.name.trim())
      return flash(t('Nama aturan wajib diisi.', 'Rule name is required.'), 'error')
    if (Boolean(form.gradeFromId) !== Boolean(form.gradeToId))
      return flash(t('Grade Dari dan Grade Sampai harus diisi berdua, atau kosongkan berdua untuk "Semua Grade".',
        'Fill in both Grade From and Grade To, or leave both blank for "All Grades".'), 'error')
    const payload = {
      name: form.name.trim(),
      companyIds: form.companyIds, departmentIds: form.departmentIds,
      gradeFromId: form.gradeFromId ? +form.gradeFromId : null,
      gradeToId: form.gradeToId ? +form.gradeToId : null,
      location: form.location.trim(),
      employmentType: form.employmentType,
      eligible: form.eligible === 'true',
      active: form.active === 'true',
      notes: form.notes.trim(),
    }
    if (editing) { updateRule(editing, payload); flash(t('Aturan diperbarui.', 'Rule updated.')) }
    else         { addRule(payload);             flash(t('Aturan ditambahkan.', 'Rule added.')) }
    closeModal()
  }

  return (
    <div>
      {msg && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl px-5 py-3 text-sm font-semibold shadow-xl
          ${msg.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
          {msg.type === 'error' ? '⚠' : '✓'} {msg.text}
        </div>
      )}

      <PageHeader icon={icon} title={title} subtitle={subtitle} />

      <div className='mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3'>
        <StatCard tone='brand' icon={icon} label={t('Total Aturan', 'Total Rules')} value={String(rules.length)} />
        <StatCard tone='green' icon='✅' label={t('Aturan Aktif', 'Active Rules')} value={String(activeCount)} />
        <StatCard tone='blue'  icon='👥' label={t('Aturan Eligible', 'Eligible Rules')} value={String(eligibleCount)} />
      </div>

      <div className='mb-4 flex justify-end'>
        <button onClick={openNew}
          className='flex items-center gap-1.5 whitespace-nowrap rounded-lg px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:opacity-90'
          style={{ background: 'linear-gradient(135deg,#052B52,#039299)' }}>
          + {t('Tambah Aturan', 'Add Rule')}
        </button>
      </div>

      <SectionCard bodyClass='p-0'>
        {rules.length === 0 ? (
          <div className='p-5'>
            <EmptyState icon={icon} title={t('Belum ada aturan eligibility.', 'No eligibility rules yet.')}
              description={t('Tambahkan aturan pertama untuk menentukan siapa yang eligible.', 'Add your first rule to define who is eligible.')} />
          </div>
        ) : (
          <DataTable
            className='rounded-none shadow-none ring-0'
            columns={[
              t('Nama Aturan', 'Rule Name'), 'PT', 'PC', t('Departemen', 'Department'),
              t('Lokasi', 'Location'), t('Tipe', 'Type'), 'Eligible', 'Status', { label: t('Aksi', 'Action'), align: 'right' },
            ]}
          >
            {rules.map(r => (
              <Tr key={r.id}>
                <Td className='font-semibold text-gray-800'>{r.name}</Td>
                <Td className='text-xs text-gray-600'>{namesSummary(r.companyIds, companyItems, t('Semua Company', 'All Companies'))}</Td>
                <Td className='text-xs text-gray-600'>{gradeRange(r)}</Td>
                <Td className='text-xs text-gray-600'>{namesSummary(r.departmentIds, departmentItems, t('Semua Departemen', 'All Departments'))}</Td>
                <Td className='text-xs text-gray-600'>{r.location || t('Semua Lokasi', 'All Locations')}</Td>
                <Td className='text-xs text-gray-600'>{r.employmentType || t('Semua Tipe', 'All Types')}</Td>
                <Td>
                  <StatusBadge tone={r.eligible ? 'success' : 'danger'}>
                    {r.eligible ? t('Eligible', 'Eligible') : t('Tidak Eligible', 'Not Eligible')}
                  </StatusBadge>
                </Td>
                <Td>
                  <StatusBadge tone={r.active ? 'success' : 'neutral'}>
                    {r.active ? t('Aktif', 'Active') : t('Nonaktif', 'Inactive')}
                  </StatusBadge>
                </Td>
                <Td align='right'>
                  <div className='flex justify-end gap-2'>
                    <ActionButton size='sm' variant='secondary' onClick={() => openEdit(r)}>{t('Edit', 'Edit')}</ActionButton>
                    <button onClick={() => { deleteRule(r.id); flash(t('Aturan dihapus.', 'Rule deleted.')) }}
                      className='rounded-xl bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100'>
                      {t('Hapus', 'Delete')}
                    </button>
                  </div>
                </Td>
              </Tr>
            ))}
          </DataTable>
        )}
      </SectionCard>

      {showModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4' onClick={closeModal}>
          <div className='w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl' onClick={e => e.stopPropagation()}>
            <div className='flex items-center justify-between border-b border-gray-100 px-6 py-4'>
              <h2 className='text-base font-bold text-gray-800'>
                {editing ? t('Edit Aturan Eligibility', 'Edit Eligibility Rule') : t('Tambah Aturan Eligibility', 'Add Eligibility Rule')}
              </h2>
              <button onClick={closeModal} className='text-xl font-bold leading-none text-gray-400 hover:text-gray-600'>×</button>
            </div>
            <div className='space-y-4 px-6 py-5'>
              <FormField label={t('Nama Aturan', 'Rule Name')} required>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder={t('mis. Staff Jakarta — semua PT', 'e.g. Jakarta Staff — all PTs')} />
              </FormField>

              <CriteriaMultiSelect label='PT (Company)' items={companyItems} t={t}
                selected={form.companyIds} onToggle={(id) => toggleIn('companyIds', id)}
                onSelectAll={(allSel) => selectAllIn('companyIds', companyItems, allSel)} />

              <div className='grid grid-cols-2 gap-4'>
                <FormField label={t('Grade Dari (PC)', 'Grade From (PC)')} hint={t('Kosongkan untuk semua grade.', 'Leave blank for all grades.')}>
                  <Select value={form.gradeFromId} onChange={e => setForm(f => ({ ...f, gradeFromId: e.target.value }))}>
                    <option value=''>— {t('Semua', 'All')} —</option>
                    {sortedGrades.map(g => <option key={g.id} value={g.id}>{g.code} · {g.name}</option>)}
                  </Select>
                </FormField>
                <FormField label={t('Grade Sampai (PC)', 'Grade To (PC)')}>
                  <Select value={form.gradeToId} onChange={e => setForm(f => ({ ...f, gradeToId: e.target.value }))}>
                    <option value=''>— {t('Semua', 'All')} —</option>
                    {sortedGrades.map(g => <option key={g.id} value={g.id}>{g.code} · {g.name}</option>)}
                  </Select>
                </FormField>
              </div>

              <CriteriaMultiSelect label={t('Departemen', 'Department')} items={departmentItems} t={t}
                selected={form.departmentIds} onToggle={(id) => toggleIn('departmentIds', id)}
                onSelectAll={(allSel) => selectAllIn('departmentIds', departmentItems, allSel)} />

              <FormField label={t('Lokasi', 'Location')} hint={t('Bebas isi, kosongkan untuk semua lokasi.', 'Free text, leave blank for all locations.')}>
                <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  placeholder={t('mis. Jakarta HQ', 'e.g. Jakarta HQ')} />
              </FormField>

              <FormField label={t('Tipe Kepegawaian', 'Employment Type')} hint={t('Kosongkan untuk semua tipe.', 'Leave blank for all types.')}>
                <Select value={form.employmentType} onChange={e => setForm(f => ({ ...f, employmentType: e.target.value }))}>
                  <option value=''>— {t('Semua Tipe', 'All Types')} —</option>
                  {EMP_TYPES.map(x => <option key={x} value={x}>{x}</option>)}
                </Select>
              </FormField>

              <div className='grid grid-cols-2 gap-4'>
                <FormField label='Eligible'>
                  <Select value={form.eligible} onChange={e => setForm(f => ({ ...f, eligible: e.target.value }))}>
                    <option value='true'>{t('Eligible', 'Eligible')}</option>
                    <option value='false'>{t('Tidak Eligible', 'Not Eligible')}</option>
                  </Select>
                </FormField>
                <FormField label='Status'>
                  <Select value={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.value }))}>
                    <option value='true'>{t('Aktif', 'Active')}</option>
                    <option value='false'>{t('Nonaktif', 'Inactive')}</option>
                  </Select>
                </FormField>
              </div>

              <FormField label={t('Catatan', 'Notes')}>
                <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </FormField>
            </div>
            <div className='flex gap-3 px-6 pb-5'>
              <ActionButton onClick={handleSave} className='flex-1' icon='💾'>{t('Simpan', 'Save')}</ActionButton>
              <ActionButton variant='secondary' onClick={closeModal} className='flex-1'>{t('Batal', 'Cancel')}</ActionButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
