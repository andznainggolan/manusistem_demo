'use client'
import Icon from '@/components/ui/Icon'
import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useEmployeeStore, ACTION_COLOR } from '@/store/employeeStore'
import { useStructureStore } from '@/store/structureStore'
import { useT } from '@/store/languageStore'

const TABS = ['Employment', 'Bio', 'Dependent', 'Profile', 'History']

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

export default function EmployeeProfilePage() {
  const { id } = useParams()
  const router  = useRouter()
  const t       = useT()
  const { employees } = useEmployeeStore()
  const { companies, divisions, businessUnits, departments, positions } = useStructureStore()

  const [tab, setTab] = useState('Employment')

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

  const company      = companies.find(c => c.id === emp.companyId)
  const division     = divisions.find(d => d.id === emp.divisionId)
  const businessUnit = businessUnits.find(b => b.id === emp.businessUnitId)
  const department   = departments.find(d => d.id === emp.departmentId)
  const position     = positions.find(p => p.id === emp.positionId)
  const manager      = employees.find(e => e.id === emp.managerId)

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
              {emp.employmentType && (
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${empTypeBg(emp.employmentType)}`}>
                  {emp.employmentType}
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
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5'>
            <KVRow label={t('Perusahaan', 'Company')}      value={company?.name} />
            <KVRow label={t('Divisi', 'Division')}         value={division?.name} />
            <KVRow label={t('Business Unit', 'Business Unit')} value={businessUnit?.name} />
            <KVRow label={t('Departemen', 'Department')}   value={department?.name} />
            <KVRow label={t('Posisi', 'Position')}         value={position?.name} />
            <KVRow label={t('Grade', 'Grade')}             value={emp.gradeId ? `PC ${emp.gradeId}` : null} />
            <KVRow label={t('Tipe Kepegawaian', 'Employment Type')} value={emp.employmentType} />
            <KVRow label={t('Tanggal Bergabung', 'Join Date')} value={emp.joinDate} />
            {emp.endDate && <KVRow label={t('Tanggal Akhir', 'End Date')} value={emp.endDate} />}
            <KVRow label={t('Atasan Langsung', 'Direct Manager')} value={manager?.name} />
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
      </div>
    </div>
  )
}
