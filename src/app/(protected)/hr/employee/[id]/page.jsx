'use client'
import Icon from '@/components/ui/Icon'
import { useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useEmployeeStore, ACTION_COLOR, HISTORY_ACTIONS, HISTORY_REASONS } from '@/store/employeeStore'
import { useStructureStore } from '@/store/structureStore'
import { formatRp, sumVariableAllowances } from '@/store/payrollStore'
import { useMasterLookupStore } from '@/store/masterLookupStore'
import { PTKP_STATUSES } from '@/lib/payrollCalc'
import { useT } from '@/store/languageStore'
import { FormField, Input, Select, ActionButton, StatusBadge } from '@/components/ui'

const TABS = ['Employment', 'Bio', 'Dependent', 'Profile', 'History', 'Salary']

const skillLevelColor = (level) => {
  if (level === 'Expert')       return 'bg-purple-100 text-purple-700'
  if (level === 'Advanced')     return 'bg-blue-100 text-blue-700'
  if (level === 'Intermediate') return 'bg-green-100 text-green-700'
  return 'bg-gray-100 text-gray-600'
}

const statusBg = (status) => {
  if (status === 'Active')     return 'bg-green-100 text-green-700'
  if (status === 'Inactive')   return 'bg-red-100 text-red-700'
  if (status === 'Terminated') return 'bg-gray-200 text-gray-600'
  if (status === 'Resigned')   return 'bg-orange-100 text-orange-700'
  return 'bg-gray-100 text-gray-500'
}

const empTypeBg = (type) => {
  if (type === 'Permanent') return 'bg-blue-100 text-blue-700'
  if (type === 'Contract')  return 'bg-yellow-100 text-yellow-700'
  if (type === 'Intern')    return 'bg-pink-100 text-pink-700'
  return 'bg-gray-100 text-gray-600'
}

function KVRow({ label, value }) {
  return (
    <div className='flex flex-col gap-0.5'>
      <span className='text-xs text-gray-400 font-medium'>{label}</span>
      <span className='text-sm text-gray-800 font-semibold'>{value || '—'}</span>
    </div>
  )
}

const todayStr = () => new Date().toISOString().slice(0, 10)

// Sentinel "no end date yet" value (instead of null/blank) — standard
// convention so an open-ended record can still sort/compare like a real date.
const NO_END_DATE = '9999-01-01'
const formatEndDate = (d) => (!d || d === NO_END_DATE) ? '—' : d

const EMPLOYMENT_TYPES = ['Permanent', 'Contract', 'Intern']

const EMPTY_RECORD = {
  effectiveDate: todayStr(), effectiveEndDate: NO_END_DATE, effectiveSeq: 1,
  action: 'Salary Change', reason: '', note: '',
  companyId: '', departmentId: '', positionId: '', gradeId: '', employmentType: '',
  basic: '', allowance: '', variableAllowances: [], ptkpStatus: 'TK/0', npwp: true,
  bpjsKesehatan: true, bpjsTk: true,
}

export default function EmployeeProfilePage() {
  const { id } = useParams()
  const router  = useRouter()
  const searchParams = useSearchParams()
  const t       = useT()
  const { employees, addHistory, updateHistory, deleteHistory } = useEmployeeStore()
  const { companies, divisions, businessUnits, departments, positions, grades } = useStructureStore()
  // Select the category object itself (a stable reference unless its items
  // actually change) and derive the active-only list in render — filtering
  // inside the selector would return a new array every call and trip
  // useSyncExternalStore's "getSnapshot should be cached" check.
  const allowanceCategory = useMasterLookupStore(s => s.categories.find(c => c.key === 'variable-allowance'))
  const allowanceOptions = (allowanceCategory?.items || []).filter(i => i.active)

  const [tab, setTab] = useState(() => TABS.includes(searchParams.get('tab')) ? searchParams.get('tab') : 'Employment')
  const [recordModal, setRecordModal] = useState(null) // { mode: 'add'|'edit', form: {...} }

  const emp = employees.find(e => String(e.id) === String(id))

  if (!emp) {
    return (
      <div className='flex flex-col items-center justify-center min-h-[60vh] text-gray-400 gap-3'>
        <span className='text-5xl'><Icon e='👤' size={15} /></span>
        <p className='text-sm font-semibold'>{t('Karyawan tidak ditemukan.', 'Employee not found.')}</p>
        <button onClick={() => router.push('/hr/employee')}
          className='px-4 py-2 text-sm font-semibold text-white rounded-lg hover:opacity-90 transition'
          style={{ background: 'linear-gradient(135deg,#8B1A1A,#D7252B)' }}>
          {t('Kembali', 'Back')}
        </button>
      </div>
    )
  }

  const manager      = employees.find(e => e.id === emp.managerId)

  // The employee's unified History is the single source of truth for both
  // job assignment (company/department/position/grade/employment type) and
  // compensation, each entry effective-dated (Effective Start/End/Sequence) —
  // same list as Hire/Transfer/Promotion/etc. "Assignment" records are any
  // entry carrying a position; "salary" records are the subset that also
  // carry a basic salary. The Employment tab reads the assignment record in
  // effect today; falls back to the employee's static fields for employees
  // that don't have a dated record yet.
  const today = todayStr()
  const historyRecords = [...(emp.history || [])]
    .sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate) || b.effectiveSeq - a.effectiveSeq)
  const assignmentRecords = historyRecords.filter(h => h.positionId)
  const activeAssignment = assignmentRecords.find(r =>
    r.effectiveDate <= today && (!r.effectiveEndDate || r.effectiveEndDate >= today))
  const salaryRecords = historyRecords.filter(h => h.basic != null)
  const activeRecordId = salaryRecords.find(r =>
    r.effectiveDate <= today && (!r.effectiveEndDate || r.effectiveEndDate >= today))?.id

  // No dated record yet? Show a synthetic "Hire" baseline (from the
  // employee's join date + current static fields) instead of a blank
  // Effective Dates block, so there's always a first entry with an Action.
  const displayAssignment = activeAssignment || {
    action: 'Hire', reason: 'New Hire', effectiveDate: emp.joinDate || today, effectiveEndDate: NO_END_DATE, effectiveSeq: 1,
    companyId: emp.companyId, departmentId: emp.departmentId, positionId: emp.positionId, gradeId: emp.gradeId,
    employmentType: emp.employmentType,
  }

  const eff = activeAssignment || {}
  const company        = companies.find(c => c.id === (eff.companyId ?? emp.companyId))
  const division       = divisions.find(d => d.id === emp.divisionId)
  const businessUnit   = businessUnits.find(b => b.id === emp.businessUnitId)
  const department     = departments.find(d => d.id === (eff.departmentId ?? emp.departmentId))
  const position       = positions.find(p => p.id === (eff.positionId ?? emp.positionId))
  const gradeIdEff      = eff.gradeId ?? emp.gradeId
  const employmentTypeEff = eff.employmentType || emp.employmentType

  const openAddRecord = () => setRecordModal({
    mode: 'add',
    form: {
      ...EMPTY_RECORD, effectiveDate: today,
      companyId: eff.companyId ?? emp.companyId ?? '', departmentId: eff.departmentId ?? emp.departmentId ?? '',
      positionId: eff.positionId ?? emp.positionId ?? '', gradeId: eff.gradeId ?? emp.gradeId ?? '',
      employmentType: employmentTypeEff || '',
    },
  })
  const openEditRecord = (record) => setRecordModal({ mode: 'edit', form: { ...record, effectiveEndDate: record.effectiveEndDate || NO_END_DATE } })
  const closeModal = () => setRecordModal(null)

  const deleteRecord = (record) => {
    if (window.confirm(t(`Hapus riwayat gaji efektif ${record.effectiveDate}?`, `Delete salary record effective ${record.effectiveDate}?`))) {
      deleteHistory(emp.id, record.id)
    }
  }

  const handlePositionChange = (posId) => {
    const p = positions.find(x => x.id === Number(posId))
    setRecordModal(m => ({ ...m, form: { ...m.form, positionId: posId, gradeId: p?.gradeId || m.form.gradeId } }))
  }

  const addVariableRow = () =>
    setRecordModal(m => ({ ...m, form: { ...m.form, variableAllowances: [...(m.form.variableAllowances||[]), { id: Date.now(), label: '', amount: '' }] } }))
  const updateVariableRow = (rowId, patch) =>
    setRecordModal(m => ({ ...m, form: { ...m.form, variableAllowances: m.form.variableAllowances.map(r => r.id === rowId ? { ...r, ...patch } : r) } }))
  const removeVariableRow = (rowId) =>
    setRecordModal(m => ({ ...m, form: { ...m.form, variableAllowances: m.form.variableAllowances.filter(r => r.id !== rowId) } }))

  const saveRecord = () => {
    const f = recordModal.form
    const payload = {
      effectiveDate: f.effectiveDate,
      effectiveEndDate: f.effectiveEndDate || NO_END_DATE,
      effectiveSeq: Number(f.effectiveSeq) || 1,
      action: f.action, reason: f.reason, note: f.note || '',
      companyId: f.companyId ? Number(f.companyId) : '',
      departmentId: f.departmentId ? Number(f.departmentId) : '',
      positionId: f.positionId ? Number(f.positionId) : '',
      gradeId: f.gradeId ? Number(f.gradeId) : '',
      employmentType: f.employmentType || '',
      basic: Number(f.basic) || 0,
      allowance: Number(f.allowance) || 0,
      variableAllowances: (f.variableAllowances || [])
        .filter(r => r.label.trim() || Number(r.amount))
        .map(r => ({ id: r.id, label: r.label.trim(), amount: Number(r.amount) || 0 })),
      ptkpStatus: f.ptkpStatus,
      npwp: f.npwp,
      bpjsKesehatan: f.bpjsKesehatan,
      bpjsTk: f.bpjsTk,
    }
    if (recordModal.mode === 'add') addHistory(emp.id, payload)
    else updateHistory(emp.id, f.id, payload)
    closeModal()
  }

  const canSave = recordModal && recordModal.form.effectiveDate && recordModal.form.reason && Number(recordModal.form.basic) > 0
  const reasonOptions = recordModal ? (HISTORY_REASONS[recordModal.form.action] || []) : []

  return (
    <div className='max-w-4xl mx-auto pb-10'>

      {/* Back button */}
      <button onClick={() => router.push('/hr/employee')}
        className='flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-700 font-semibold mb-5 transition'>
        <Icon e='←' size={14} className='inline align-[-2px]' /> {t('Kembali ke Daftar Karyawan', 'Back to Employee List')}
      </button>

      {/* Header card */}
      <div className='rounded-2xl overflow-hidden shadow-sm mb-5' style={{ background: 'linear-gradient(135deg,#8B1A1A,#D7252B)' }}>
        <div className='px-6 py-6 flex items-center gap-5'>
          <div className='w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center overflow-hidden flex-shrink-0 border-2 border-white/30'>
            {emp.photo
              ? <img src={emp.photo} alt='' className='w-full h-full object-cover' />
              : <span className='text-4xl'>{emp.gender === 'Female' ? '👩' : '👨'}</span>}
          </div>
          <div className='flex-1 min-w-0'>
            <h1 className='text-2xl font-bold text-white'>{emp.name}</h1>
            <p className='text-red-200 text-sm mt-0.5'>
              {position?.name || '—'} · {department?.name || '—'}
            </p>
            <div className='flex items-center gap-2 mt-2 flex-wrap'>
              <span className='font-mono text-xs bg-white/20 text-white px-2 py-0.5 rounded'>{emp.nik}</span>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${statusBg(emp.status)}`}>
                {emp.status}
              </span>
              {employmentTypeEff && (
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${empTypeBg(employmentTypeEff)}`}>
                  {employmentTypeEff}
                </span>
              )}
              {company?.companyCode && (
                <span className='font-mono font-bold text-xs bg-white/20 text-white px-2 py-0.5 rounded tracking-widest'>
                  {company.companyCode}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className='flex gap-1 bg-white rounded-xl shadow-sm px-3 py-2 mb-5 overflow-x-auto'>
        {TABS.map(name => (
          <button key={name} onClick={() => setTab(name)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition ${tab === name ? 'text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            style={tab === name ? { background: 'linear-gradient(135deg,#8B1A1A,#D7252B)' } : {}}>
            {name}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className='bg-white rounded-2xl shadow-sm p-6'>

        {/* ── Employment ─────────────────────────────────────────────── */}
        {tab === 'Employment' && (
          <div>
            {/* Effective Start/End/Sequence — the primary key of this record */}
            <div className='rounded-xl p-4 mb-6' style={{ background: 'linear-gradient(135deg,#fdecea,#fdf3ea)', border: '1px solid #f5d5d0' }}>
              <div className='flex items-center justify-between mb-3'>
                <h3 className='text-xs font-bold text-red-800 uppercase tracking-wide'>{t('Tanggal Efektif (Primary Key)', 'Effective Dates (Primary Key)')}</h3>
                <ActionButton size='sm' icon='➕' onClick={openAddRecord}>{t('Tambah Riwayat','Add Record')}</ActionButton>
              </div>
              <div className='grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4'>
                <KVRow label={t('Aksi','Action')}                          value={displayAssignment.action} />
                <KVRow label={t('Efektif Mulai','Effective Start Date')}   value={displayAssignment.effectiveDate} />
                <KVRow label={t('Efektif Sampai','Effective End Date')}    value={formatEndDate(displayAssignment.effectiveEndDate)} />
                <KVRow label={t('Sequence','Effective Sequence')}          value={displayAssignment.effectiveSeq} />
              </div>
              {!activeAssignment && (
                <p className='text-xs text-gray-500 mt-3'>
                  {t('Belum ada riwayat penempatan tersimpan — nilai di atas adalah default dari data Hire karyawan ini.','No assignment record saved yet — the values above default from this employee\'s Hire data.')}
                </p>
              )}
              <a href='#' onClick={(e)=>{e.preventDefault(); setTab('History')}} className='inline-block mt-3 text-xs font-semibold text-red-700 hover:underline'>
                {t('Lihat semua riwayat →','View full history →')}
              </a>
            </div>

            <p className='text-xs text-gray-400 mb-4'>
              {t('Data di bawah ini mengikuti record efektif di atas — sumbernya sama dengan tab History.', 'The data below follows the effective record above — same source as the History tab.')}
            </p>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5'>
              <KVRow label={t('Perusahaan', 'Company')}      value={company?.name} />
              <KVRow label={t('Divisi', 'Division')}         value={division?.name} />
              <KVRow label={t('Business Unit', 'Business Unit')} value={businessUnit?.name} />
              <KVRow label={t('Departemen', 'Department')}   value={department?.name} />
              <KVRow label={t('Posisi', 'Position')}         value={position?.name} />
              <KVRow label={t('Grade', 'Grade')}             value={gradeIdEff ? `PC ${gradeIdEff}` : null} />
              <KVRow label={t('Tipe Kepegawaian', 'Employment Type')} value={employmentTypeEff} />
              <KVRow label={t('Tanggal Bergabung', 'Join Date')} value={emp.joinDate} />
              {emp.endDate && <KVRow label={t('Tanggal Akhir', 'End Date')} value={emp.endDate} />}
              <KVRow label={t('Atasan Langsung', 'Direct Manager')} value={manager?.name} />
            </div>
          </div>
        )}

        {/* ── Bio ────────────────────────────────────────────────────── */}
        {tab === 'Bio' && (
          <div className='space-y-6'>
            <div>
              <h3 className='text-xs font-bold text-gray-400 uppercase tracking-wide mb-3'>{t('Informasi Pribadi', 'Personal Information')}</h3>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4'>
                <KVRow label={t('Jenis Kelamin', 'Gender')}        value={emp.gender} />
                <KVRow label={t('Tanggal Lahir', 'Birth Date')}    value={emp.birthDate} />
                <KVRow label={t('Tempat Lahir', 'Birth Place')}    value={emp.birthPlace} />
                <KVRow label={t('Kewarganegaraan', 'Nationality')} value={emp.nationality} />
                <KVRow label={t('Agama', 'Religion')}              value={emp.religion} />
                <KVRow label={t('Status Pernikahan', 'Marital Status')} value={emp.maritalStatus} />
              </div>
            </div>
            <div className='border-t border-gray-100 pt-5'>
              <h3 className='text-xs font-bold text-gray-400 uppercase tracking-wide mb-3'>{t('Kontak', 'Contact')}</h3>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4'>
                <KVRow label={t('Telepon', 'Phone')}               value={emp.phone} />
                <KVRow label={t('Email Kerja', 'Work Email')}      value={emp.email} />
                <KVRow label={t('Email Pribadi', 'Personal Email')} value={emp.personalEmail} />
                <KVRow label={t('Alamat', 'Address')}              value={emp.address} />
                <KVRow label={t('Kota', 'City')}                   value={emp.city} />
                <KVRow label={t('Negara', 'Country')}              value={emp.country} />
              </div>
            </div>
            <div className='border-t border-gray-100 pt-5'>
              <h3 className='text-xs font-bold text-gray-400 uppercase tracking-wide mb-3'>{t('Nomor Identitas', 'ID Numbers')}</h3>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4'>
                <KVRow label='KTP'  value={emp.ktp} />
                <KVRow label='NPWP' value={emp.npwp} />
                <KVRow label='BPJS' value={emp.bpjs} />
              </div>
            </div>
          </div>
        )}

        {/* ── Dependent ──────────────────────────────────────────────── */}
        {tab === 'Dependent' && (
          <div>
            {(!emp.dependents || emp.dependents.length === 0) ? (
              <div className='flex flex-col items-center justify-center py-16 text-gray-400 gap-2'>
                <span className='text-4xl'><Icon e='👨‍👩‍👧' size={15} /></span>
                <p className='text-sm'>{t('Tidak ada data tanggungan.', 'No dependents recorded.')}</p>
              </div>
            ) : (
              <div className='overflow-x-auto'>
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='bg-gray-50'>
                      <th className='px-4 py-2.5 text-left text-xs font-bold text-gray-500'>{t('Nama', 'Name')}</th>
                      <th className='px-4 py-2.5 text-left text-xs font-bold text-gray-500'>{t('Hubungan', 'Relationship')}</th>
                      <th className='px-4 py-2.5 text-left text-xs font-bold text-gray-500'>{t('Tanggal Lahir', 'Birth Date')}</th>
                      <th className='px-4 py-2.5 text-left text-xs font-bold text-gray-500'>{t('Jenis Kelamin', 'Gender')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emp.dependents.map((d, i) => (
                      <tr key={d.id ?? i} className='border-t border-gray-100 hover:bg-gray-50'>
                        <td className='px-4 py-3 font-semibold text-gray-800'>{d.name}</td>
                        <td className='px-4 py-3 text-gray-600'>{d.relationship}</td>
                        <td className='px-4 py-3 text-gray-600'>{d.birthDate}</td>
                        <td className='px-4 py-3 text-gray-600'>{d.gender}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Profile (Education / Certs / Skills) ───────────────────── */}
        {tab === 'Profile' && (
          <div className='space-y-7'>

            {/* Education */}
            <div>
              <h3 className='text-xs font-bold text-gray-400 uppercase tracking-wide mb-3'>{t('Pendidikan', 'Education')}</h3>
              {(!emp.education || emp.education.length === 0) ? (
                <p className='text-sm text-gray-400'>{t('Tidak ada data.', 'No data.')}</p>
              ) : (
                <div className='space-y-3'>
                  {emp.education.map((ed, i) => (
                    <div key={ed.id ?? i} className='flex items-start gap-3 p-3 border border-gray-100 rounded-xl'>
                      <div className='w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0' style={{ background: 'linear-gradient(135deg,#8B1A1A,#D7252B)' }}>
                        <span className='text-white text-xs font-bold'>{ed.level}</span>
                      </div>
                      <div>
                        <p className='text-sm font-semibold text-gray-800'>{ed.institution}</p>
                        <p className='text-xs text-gray-500'>{ed.major} · {ed.graduationYear}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Certifications */}
            <div className='border-t border-gray-100 pt-5'>
              <h3 className='text-xs font-bold text-gray-400 uppercase tracking-wide mb-3'>{t('Sertifikasi', 'Certifications')}</h3>
              {(!emp.certifications || emp.certifications.length === 0) ? (
                <p className='text-sm text-gray-400'>{t('Tidak ada data.', 'No data.')}</p>
              ) : (
                <div className='space-y-3'>
                  {emp.certifications.map((cert, i) => (
                    <div key={cert.id ?? i} className='flex items-start gap-3 p-3 border border-gray-100 rounded-xl'>
                      <div className='w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-lg flex-shrink-0'>
                        🏅
                      </div>
                      <div>
                        <p className='text-sm font-semibold text-gray-800'>{cert.name}</p>
                        <p className='text-xs text-gray-500'>{cert.issuer} · {cert.issueYear}{cert.expiryYear ? ` – ${cert.expiryYear}` : ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Skills */}
            <div className='border-t border-gray-100 pt-5'>
              <h3 className='text-xs font-bold text-gray-400 uppercase tracking-wide mb-3'>{t('Keahlian', 'Skills')}</h3>
              {(!emp.skills || emp.skills.length === 0) ? (
                <p className='text-sm text-gray-400'>{t('Tidak ada data.', 'No data.')}</p>
              ) : (
                <div className='flex flex-wrap gap-2'>
                  {emp.skills.map((sk, i) => (
                    <div key={sk.id ?? i} className='flex items-center gap-1.5 border border-gray-200 rounded-full px-3 py-1.5'>
                      <span className='text-sm text-gray-700 font-semibold'>{sk.name}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${skillLevelColor(sk.level)}`}>{sk.level}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── History ────────────────────────────────────────────────── */}
        {tab === 'History' && (
          <div>
            {(!emp.history || emp.history.length === 0) ? (
              <div className='flex flex-col items-center justify-center py-16 text-gray-400 gap-2'>
                <span className='text-4xl'><Icon e='📜' size={15} /></span>
                <p className='text-sm'>{t('Tidak ada riwayat kepegawaian.', 'No employment history.')}</p>
              </div>
            ) : (
              <div className='overflow-x-auto'>
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='bg-gray-50'>
                      <th className='px-4 py-2.5 text-left text-xs font-bold text-gray-500'>{t('Tanggal Efektif', 'Effective Date')}</th>
                      <th className='px-4 py-2.5 text-left text-xs font-bold text-gray-500'>{t('Aksi', 'Action')}</th>
                      <th className='px-4 py-2.5 text-left text-xs font-bold text-gray-500'>{t('Alasan', 'Reason')}</th>
                      <th className='px-4 py-2.5 text-left text-xs font-bold text-gray-500'>{t('Catatan', 'Notes')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...emp.history].sort((a, b) => new Date(b.effectiveDate) - new Date(a.effectiveDate)).map((h, i) => (
                      <tr key={h.id ?? i} className='border-t border-gray-100 hover:bg-gray-50'>
                        <td className='px-4 py-3 text-gray-600 font-mono text-xs'>{h.effectiveDate}</td>
                        <td className='px-4 py-3'>
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${ACTION_COLOR[h.action] || 'bg-gray-100 text-gray-600'}`}>
                            {h.action}
                          </span>
                        </td>
                        <td className='px-4 py-3 text-gray-600 text-xs'>{h.reason || '—'}</td>
                        <td className='px-4 py-3 text-gray-500 text-xs'>{h.note || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Salary ─────────────────────────────────────────────────── */}
        {tab === 'Salary' && (
          <div>
            <div className='flex items-center justify-between mb-4'>
              <div>
                <h3 className='text-sm font-bold text-gray-800'>{t('Riwayat Gaji', 'Salary History')}</h3>
                <p className='text-xs text-gray-400'>{t('Bagian dari riwayat kepegawaian yang sama (lihat tab History) — tiap baris adalah snapshot gaji & jabatan di tanggal efektifnya, dipakai Payroll Run untuk memilih nilai yang berlaku di periode tersebut.', 'Part of the same unified employment history (see the History tab) — each row is a job + salary snapshot at its effective date, used by Payroll Run to pick the value that applies for a given period.')}</p>
              </div>
              <ActionButton size='sm' icon='➕' onClick={openAddRecord}>{t('Tambah Riwayat','Add Record')}</ActionButton>
            </div>

            {salaryRecords.length === 0 ? (
              <div className='flex flex-col items-center justify-center py-16 text-gray-400 gap-2'>
                <span className='text-4xl'><Icon e='💰' size={15} /></span>
                <p className='text-sm'>{t('Belum ada riwayat gaji.','No salary records yet.')}</p>
              </div>
            ) : (
              <div className='overflow-x-auto'>
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='bg-gray-50'>
                      <th className='px-3 py-2.5 text-left text-xs font-bold text-gray-500'>{t('Efektif Mulai','Effective Start')}</th>
                      <th className='px-3 py-2.5 text-left text-xs font-bold text-gray-500'>{t('Efektif Sampai','Effective End')}</th>
                      <th className='px-3 py-2.5 text-left text-xs font-bold text-gray-500'>{t('Aksi','Action')}</th>
                      <th className='px-3 py-2.5 text-left text-xs font-bold text-gray-500'>{t('Posisi','Position')}</th>
                      <th className='px-3 py-2.5 text-right text-xs font-bold text-gray-500'>{t('Gaji Pokok','Basic')}</th>
                      <th className='px-3 py-2.5 text-right text-xs font-bold text-gray-500'>{t('Total Bruto','Gross')}</th>
                      <th className='px-3 py-2.5 text-left text-xs font-bold text-gray-500'></th>
                      <th className='px-3 py-2.5 w-20'></th>
                    </tr>
                  </thead>
                  <tbody>
                    {salaryRecords.map(r => {
                      const gross = r.basic + (r.allowance || 0) + sumVariableAllowances(r.variableAllowances)
                      const pos = positions.find(p => p.id === r.positionId)
                      return (
                        <tr key={r.id} className='border-t border-gray-100 hover:bg-gray-50'>
                          <td className='px-3 py-2.5 font-mono text-xs text-gray-700'>{r.effectiveDate}</td>
                          <td className='px-3 py-2.5 font-mono text-xs text-gray-500'>{formatEndDate(r.effectiveEndDate)}</td>
                          <td className='px-3 py-2.5'>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ACTION_COLOR[r.action] || 'bg-gray-100 text-gray-600'}`}>{r.action}</span>
                          </td>
                          <td className='px-3 py-2.5 text-gray-600 text-xs'>{pos?.name || '—'}</td>
                          <td className='px-3 py-2.5 text-right text-gray-700'>{formatRp(r.basic)}</td>
                          <td className='px-3 py-2.5 text-right font-semibold text-gray-800'>{formatRp(gross)}</td>
                          <td className='px-3 py-2.5'>
                            {r.id === activeRecordId && <StatusBadge tone='success'>{t('Aktif','Active')}</StatusBadge>}
                          </td>
                          <td className='px-3 py-2.5 text-right whitespace-nowrap'>
                            <button onClick={()=>openEditRecord(r)} className='text-xs font-semibold text-red-700 hover:underline mr-3'>{t('Edit','Edit')}</button>
                            <button onClick={()=>deleteRecord(r)} className='text-gray-400 hover:text-red-600' aria-label={t('Hapus','Delete')}>
                              <Icon e='🗑️' size={13} />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <a href='/hr/payroll/run' className='inline-block mt-4 text-xs font-semibold text-red-700 hover:underline'>
              {t('Lihat di Payroll Run →','View in Payroll Run →')}
            </a>
          </div>
        )}
      </div>

      {/* Salary record modal */}
      {recordModal && (
        <div className='fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4' onClick={closeModal}>
          <div className='bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto' onClick={e=>e.stopPropagation()}>
            <div className='flex justify-between items-start mb-4'>
              <h3 className='text-base font-bold text-gray-800'>
                {recordModal.mode === 'add' ? t('Tambah Riwayat Gaji','Add Salary Record') : t('Edit Riwayat Gaji','Edit Salary Record')}
              </h3>
              <button onClick={closeModal} className='text-gray-400 hover:text-gray-600 text-xl font-bold leading-none'>×</button>
            </div>

            <div className='grid grid-cols-3 gap-3 mb-3'>
              <FormField label={t('Efektif Mulai','Effective Start')} required>
                <Input type='date' value={recordModal.form.effectiveDate}
                  onChange={e=>setRecordModal(m=>({...m, form:{...m.form, effectiveDate:e.target.value}}))} />
              </FormField>
              <FormField label={t('Efektif Sampai','Effective End')} hint={t('Default 9999-01-01 = masih berlaku','Defaults to 9999-01-01 = still current')}>
                <Input type='date' value={recordModal.form.effectiveEndDate}
                  onChange={e=>setRecordModal(m=>({...m, form:{...m.form, effectiveEndDate:e.target.value}}))} />
              </FormField>
              <FormField label={t('Sequence','Sequence')}>
                <Input type='number' value={recordModal.form.effectiveSeq}
                  onChange={e=>setRecordModal(m=>({...m, form:{...m.form, effectiveSeq:e.target.value}}))} />
              </FormField>
            </div>

            <div className='grid grid-cols-2 gap-3 mb-3'>
              <FormField label={t('Aksi','Action')} required>
                <Select value={recordModal.form.action} onChange={e=>setRecordModal(m=>({...m, form:{...m.form, action:e.target.value, reason:''}}))}>
                  {HISTORY_ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                </Select>
              </FormField>
              <FormField label={t('Alasan','Reason')} required>
                <Select value={recordModal.form.reason} onChange={e=>setRecordModal(m=>({...m, form:{...m.form, reason:e.target.value}}))}>
                  <option value=''>{t('— Pilih —','— Select —')}</option>
                  {reasonOptions.map(r => <option key={r} value={r}>{r}</option>)}
                </Select>
              </FormField>
            </div>

            <div className='border-t border-gray-100 pt-4 mb-3'>
              <h4 className='text-xs font-bold text-gray-400 uppercase tracking-wide mb-2'>{t('Penempatan','Job Assignment')}</h4>
              <div className='grid grid-cols-2 gap-3'>
                <FormField label={t('Perusahaan','Company')}>
                  <Select value={recordModal.form.companyId} onChange={e=>setRecordModal(m=>({...m, form:{...m.form, companyId:e.target.value}}))}>
                    <option value=''>{t('— Pilih —','— Select —')}</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </Select>
                </FormField>
                <FormField label={t('Departemen','Department')}>
                  <Select value={recordModal.form.departmentId} onChange={e=>setRecordModal(m=>({...m, form:{...m.form, departmentId:e.target.value}}))}>
                    <option value=''>{t('— Pilih —','— Select —')}</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </Select>
                </FormField>
                <FormField label={t('Posisi','Position')}>
                  <Select value={recordModal.form.positionId} onChange={e=>handlePositionChange(e.target.value)}>
                    <option value=''>{t('— Pilih —','— Select —')}</option>
                    {positions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </Select>
                </FormField>
                <FormField label='Grade'>
                  <Input value={grades.find(g => g.id === recordModal.form.gradeId)?.name || (recordModal.form.gradeId ? `PC ${recordModal.form.gradeId}` : '')} disabled />
                </FormField>
                <FormField label={t('Tipe Kepegawaian','Employment Type')}>
                  <Select value={recordModal.form.employmentType} onChange={e=>setRecordModal(m=>({...m, form:{...m.form, employmentType:e.target.value}}))}>
                    <option value=''>{t('— Pilih —','— Select —')}</option>
                    {EMPLOYMENT_TYPES.map(et => <option key={et} value={et}>{et}</option>)}
                  </Select>
                </FormField>
              </div>
            </div>

            <div className='border-t border-gray-100 pt-4 mb-3'>
              <h4 className='text-xs font-bold text-gray-400 uppercase tracking-wide mb-2'>{t('Komponen Gaji','Salary Components')}</h4>
              <div className='grid grid-cols-2 gap-3'>
                <FormField label={t('Gaji Pokok', 'Basic Salary')} required>
                  <Input type='number' value={recordModal.form.basic}
                    onChange={e=>setRecordModal(m=>({...m, form:{...m.form, basic:e.target.value}}))} />
                </FormField>
                <FormField label={t('Tunjangan Tetap', 'Fixed Allowance')}>
                  <Input type='number' value={recordModal.form.allowance}
                    onChange={e=>setRecordModal(m=>({...m, form:{...m.form, allowance:e.target.value}}))} />
                </FormField>
              </div>
            </div>

            <div className='border-t border-gray-100 pt-4 mb-3'>
              <div className='flex items-center justify-between mb-2'>
                <h4 className='text-xs font-bold text-gray-400 uppercase tracking-wide'>{t('Tunjangan Variable', 'Variable Allowances')}</h4>
                <button onClick={addVariableRow} type='button' className='text-xs font-semibold text-red-700 hover:underline flex items-center gap-1'>
                  <Icon e='➕' size={11} /> {t('Tambah','Add')}
                </button>
              </div>
              {allowanceOptions.length === 0 && (
                <p className='text-xs text-gray-400 mb-2'>
                  {t('Belum ada pilihan nama tunjangan. ','No allowance name options yet. ')}
                  <a href='/sysadmin/settings/master-lookup' className='text-red-700 hover:underline'>
                    {t('Atur di Master Lookup →','Set up in Master Lookup →')}
                  </a>
                </p>
              )}
              {(!recordModal.form.variableAllowances || recordModal.form.variableAllowances.length === 0) ? (
                <p className='text-sm text-gray-400'>{t('Belum ada tunjangan variable.','No variable allowances yet.')}</p>
              ) : (
                <table className='w-full text-sm'>
                  <tbody>
                    {recordModal.form.variableAllowances.map(row => (
                      <tr key={row.id}>
                        <td className='py-1 pr-2'>
                          <Select value={row.label} onChange={e=>updateVariableRow(row.id, { label: e.target.value })}>
                            <option value=''>{t('— Pilih —','— Select —')}</option>
                            {row.label && !allowanceOptions.some(o => o.label === row.label) && (
                              <option value={row.label}>{row.label}</option>
                            )}
                            {allowanceOptions.map(o => <option key={o.id} value={o.label}>{o.label}</option>)}
                          </Select>
                        </td>
                        <td className='py-1 pr-2 w-32'>
                          <Input type='number' value={row.amount} placeholder='0'
                            onChange={e=>updateVariableRow(row.id, { amount: e.target.value })} />
                        </td>
                        <td className='py-1 w-8 text-center'>
                          <button onClick={()=>removeVariableRow(row.id)} type='button' className='text-gray-400 hover:text-red-600' aria-label={t('Hapus baris','Remove row')}>
                            <Icon e='🗑️' size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    <tr className='border-t border-gray-200'>
                      <td className='py-1.5 pr-2 font-semibold text-gray-700 text-xs'>{t('Total','Total')}</td>
                      <td className='py-1.5 pr-2 font-semibold text-gray-800 text-xs'>{formatRp(sumVariableAllowances(recordModal.form.variableAllowances))}</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>

            <div className='border-t border-gray-100 pt-4 mb-4'>
              <div className='grid grid-cols-2 gap-3 mb-3'>
                <FormField label='PTKP'>
                  <Select value={recordModal.form.ptkpStatus} onChange={e=>setRecordModal(m=>({...m, form:{...m.form, ptkpStatus:e.target.value}}))}>
                    {PTKP_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </Select>
                </FormField>
                <FormField label='NPWP'>
                  <Select value={recordModal.form.npwp ? '1' : '0'} onChange={e=>setRecordModal(m=>({...m, form:{...m.form, npwp: e.target.value==='1'}}))}>
                    <option value='1'>{t('Ada','Yes')}</option>
                    <option value='0'>{t('Tidak ada','No')}</option>
                  </Select>
                </FormField>
              </div>
              <div className='flex gap-5 text-sm mb-3'>
                <label className='flex items-center gap-2'>
                  <input type='checkbox' checked={recordModal.form.bpjsKesehatan} onChange={e=>setRecordModal(m=>({...m, form:{...m.form, bpjsKesehatan:e.target.checked}}))} />
                  BPJS Kesehatan
                </label>
                <label className='flex items-center gap-2'>
                  <input type='checkbox' checked={recordModal.form.bpjsTk} onChange={e=>setRecordModal(m=>({...m, form:{...m.form, bpjsTk:e.target.checked}}))} />
                  BPJS Ketenagakerjaan
                </label>
              </div>
              <FormField label={t('Catatan','Note')}>
                <textarea value={recordModal.form.note} onChange={e=>setRecordModal(m=>({...m, form:{...m.form, note:e.target.value}}))} rows={2}
                  className='w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100 resize-none' />
              </FormField>
            </div>

            <div className='flex gap-2'>
              <button onClick={closeModal} className='flex-1 py-2.5 text-sm font-semibold bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition'>
                {t('Batal','Cancel')}
              </button>
              <ActionButton onClick={saveRecord} disabled={!canSave} className='flex-1'>{t('Simpan','Save')}</ActionButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
