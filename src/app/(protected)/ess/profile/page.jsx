'use client'
import { useState } from 'react'
import { useAuthStore }      from '@/store/authStore'
import { useEmployeeStore }  from '@/store/employeeStore'
import { useStructureStore } from '@/store/structureStore'
import { useT }              from '@/store/languageStore'
import { ACTION_COLOR }      from '@/store/employeeStore'

const TABS = ['Employment', 'Bio', 'Dependent', 'Profile', 'History']

const LEVEL_COLOR = {
  Expert:       'bg-purple-100 text-purple-700',
  Advanced:     'bg-blue-100 text-blue-700',
  Intermediate: 'bg-green-100 text-green-700',
  Beginner:     'bg-gray-100 text-gray-500',
}

function Section({ title, children }) {
  return (
    <div className='mb-6'>
      <h3 className='text-xs font-bold text-gray-400 uppercase tracking-wider mb-3'>{title}</h3>
      {children}
    </div>
  )
}

function Field({ label, value }) {
  return (
    <div className='flex flex-col gap-0.5'>
      <span className='text-xs text-gray-400'>{label}</span>
      <span className='text-sm font-medium text-gray-800'>{value || '—'}</span>
    </div>
  )
}

export default function MyProfilePage() {
  const t = useT()
  const { currentUser } = useAuthStore()
  const { employees }   = useEmployeeStore()
  const { companies, divisions, businessUnits, departments, positions } = useStructureStore()

  const [tab, setTab] = useState('Employment')

  const emp = employees.find(e => e.id === currentUser?.id)

  if (!emp) return (
    <div className='flex items-center justify-center min-h-[60vh] text-gray-400 text-sm'>
      {t('Data profil tidak ditemukan.', 'Profile data not found.')}
    </div>
  )

  const company  = companies.find(c => c.id === emp.companyId)
  const division = divisions.find(d => d.id === emp.divisionId)
  const bunit    = businessUnits.find(b => b.id === emp.businessUnitId)
  const dept     = departments.find(d => d.id === emp.departmentId)
  const pos      = positions.find(p => p.id === emp.positionId)
  const mgr      = employees.find(e => e.id === emp.managerId)
  const mgrPos   = positions.find(p => p.id === mgr?.positionId)

  const initials = emp.name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  const sortedHistory = [...(emp.history || [])].sort(
    (a, b) => new Date(b.effectiveDate) - new Date(a.effectiveDate)
  )

  return (
    <div>
      <h1 className='text-2xl font-bold text-gray-800 mb-1'>{t('Profil Saya', 'My Profile')}</h1>
      <p className='text-gray-500 text-sm mb-6'>{t('Informasi data diri dan kepegawaian Anda.', 'Your personal and employment information.')}</p>

      {/* Header card */}
      <div className='rounded-2xl overflow-hidden shadow-sm ring-1 ring-gray-100 mb-6'>
        <div className='h-24' style={{ background: 'linear-gradient(135deg,#8B1A1A 0%,#D7252B 50%,#f4a97a 100%)' }} />
        <div className='bg-white px-6 pb-5'>
          <div className='flex items-end gap-4 -mt-10 mb-4'>
            <div className='w-20 h-20 rounded-2xl border-4 border-white shadow flex items-center justify-center text-2xl font-bold text-white flex-shrink-0'
              style={{ background: 'linear-gradient(135deg,#8B1A1A,#D7252B)' }}>
              {emp.photo
                ? <img src={emp.photo} alt='' className='w-full h-full object-cover rounded-xl' />
                : initials}
            </div>
            <div className='pb-1'>
              <h2 className='text-xl font-bold text-gray-900'>{emp.name}</h2>
              <p className='text-sm text-gray-500'>{pos?.name || '—'} · {dept?.name || '—'}</p>
              <p className='text-xs text-gray-400 mt-0.5'>{emp.nik} · {company?.name || '—'}</p>
            </div>
          </div>
          <div className='flex gap-2 flex-wrap'>
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${emp.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
              {emp.status}
            </span>
            <span className='text-xs px-2.5 py-1 rounded-full font-semibold bg-blue-100 text-blue-700'>
              {emp.employmentType}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className='flex gap-1 mb-5 flex-wrap'>
        {TABS.map(tb => (
          <button key={tb} onClick={() => setTab(tb)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${tab === tb ? 'text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
            style={tab === tb ? { background: 'linear-gradient(135deg,#8B1A1A,#D7252B)' } : {}}>
            {t(tb, tb)}
          </button>
        ))}
      </div>

      <div className='bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6'>

        {/* Employment */}
        {tab === 'Employment' && (
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-5'>
            <Field label={t('Perusahaan', 'Company')}       value={company?.name} />
            <Field label={t('Divisi', 'Division')}          value={division?.name} />
            <Field label={t('Business Unit', 'Business Unit')} value={bunit?.name} />
            <Field label={t('Departemen', 'Department')}    value={dept?.name} />
            <Field label={t('Posisi', 'Position')}          value={pos?.name} />
            <Field label={t('Grade', 'Grade')}              value={emp.gradeId ? `PC${emp.gradeId}` : '—'} />
            <Field label={t('Tipe Kontrak', 'Employment Type')} value={emp.employmentType} />
            <Field label={t('Tanggal Masuk', 'Join Date')}  value={emp.joinDate} />
            {emp.endDate && <Field label={t('Tanggal Berakhir', 'End Date')} value={emp.endDate} />}
            <Field label={t('Atasan Langsung', 'Direct Manager')} value={mgr ? `${mgr.name} — ${mgrPos?.name || ''}` : '—'} />
          </div>
        )}

        {/* Bio */}
        {tab === 'Bio' && (
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-8'>
            <Section title={t('Data Pribadi', 'Personal Data')}>
              <div className='grid grid-cols-1 gap-4'>
                <Field label={t('Jenis Kelamin', 'Gender')}       value={t(emp.gender === 'Male' ? 'Laki-laki' : 'Perempuan', emp.gender)} />
                <Field label={t('Tempat Lahir', 'Birth Place')}   value={emp.birthPlace} />
                <Field label={t('Tanggal Lahir', 'Birth Date')}   value={emp.birthDate} />
                <Field label={t('Kewarganegaraan', 'Nationality')} value={emp.nationality} />
                <Field label={t('Agama', 'Religion')}             value={emp.religion} />
                <Field label={t('Status Pernikahan', 'Marital Status')} value={emp.maritalStatus} />
              </div>
            </Section>
            <div>
              <Section title={t('Kontak', 'Contact')}>
                <div className='grid grid-cols-1 gap-4'>
                  <Field label={t('Telepon', 'Phone')}           value={emp.phone} />
                  <Field label={t('Email Kerja', 'Work Email')}  value={emp.email} />
                  <Field label={t('Email Pribadi', 'Personal Email')} value={emp.personalEmail} />
                  <Field label={t('Alamat', 'Address')}          value={emp.address} />
                  <Field label={t('Kota', 'City')}               value={emp.city} />
                  <Field label={t('Negara', 'Country')}          value={emp.country} />
                </div>
              </Section>
              <Section title={t('Nomor Identitas', 'ID Numbers')}>
                <div className='grid grid-cols-1 gap-4'>
                  <Field label='KTP'  value={emp.ktp} />
                  <Field label='NPWP' value={emp.npwp} />
                  <Field label='BPJS' value={emp.bpjs} />
                </div>
              </Section>
            </div>
          </div>
        )}

        {/* Dependent */}
        {tab === 'Dependent' && (
          emp.dependents?.length === 0
            ? <p className='text-sm text-gray-400 text-center py-10'>{t('Tidak ada data tanggungan.', 'No dependent data.')}</p>
            : <div className='overflow-x-auto'>
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='border-b border-gray-100'>
                      <th className='text-left py-2 px-3 text-xs font-bold text-gray-500'>{t('Nama', 'Name')}</th>
                      <th className='text-left py-2 px-3 text-xs font-bold text-gray-500'>{t('Hubungan', 'Relationship')}</th>
                      <th className='text-left py-2 px-3 text-xs font-bold text-gray-500'>{t('Tanggal Lahir', 'Birth Date')}</th>
                      <th className='text-left py-2 px-3 text-xs font-bold text-gray-500'>{t('Jenis Kelamin', 'Gender')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emp.dependents.map(d => (
                      <tr key={d.id} className='border-b border-gray-50 hover:bg-gray-50'>
                        <td className='py-2.5 px-3 font-medium text-gray-800'>{d.name}</td>
                        <td className='py-2.5 px-3 text-gray-600'>{d.relationship}</td>
                        <td className='py-2.5 px-3 text-gray-600'>{d.birthDate}</td>
                        <td className='py-2.5 px-3 text-gray-600'>{d.gender}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
        )}

        {/* Profile */}
        {tab === 'Profile' && (
          <div className='space-y-8'>
            <Section title={t('Pendidikan', 'Education')}>
              {emp.education?.length === 0
                ? <p className='text-sm text-gray-400'>{t('Tidak ada data.', 'No data.')}</p>
                : <div className='space-y-3'>
                    {emp.education.map(e => (
                      <div key={e.id} className='bg-gray-50 rounded-xl p-4'>
                        <div className='flex items-center justify-between mb-1'>
                          <span className='text-sm font-bold text-gray-800'>{e.institution}</span>
                          <span className='text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold'>{e.level}</span>
                        </div>
                        <p className='text-xs text-gray-500'>{e.major} · {t('Lulus', 'Graduated')} {e.graduationYear}</p>
                      </div>
                    ))}
                  </div>
              }
            </Section>
            <Section title={t('Sertifikasi', 'Certifications')}>
              {emp.certifications?.length === 0
                ? <p className='text-sm text-gray-400'>{t('Tidak ada data.', 'No data.')}</p>
                : <div className='space-y-3'>
                    {emp.certifications.map(c => (
                      <div key={c.id} className='bg-gray-50 rounded-xl p-4'>
                        <p className='text-sm font-bold text-gray-800'>{c.name}</p>
                        <p className='text-xs text-gray-500 mt-0.5'>{c.issuer} · {c.issueYear}{c.expiryYear ? ` – ${c.expiryYear}` : ''}</p>
                      </div>
                    ))}
                  </div>
              }
            </Section>
            <Section title={t('Keahlian', 'Skills')}>
              {emp.skills?.length === 0
                ? <p className='text-sm text-gray-400'>{t('Tidak ada data.', 'No data.')}</p>
                : <div className='flex flex-wrap gap-2'>
                    {emp.skills.map(s => (
                      <span key={s.id} className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold ${LEVEL_COLOR[s.level] || 'bg-gray-100 text-gray-600'}`}>
                        {s.name}
                        <span className='opacity-60 text-[10px]'>· {s.level}</span>
                      </span>
                    ))}
                  </div>
              }
            </Section>
          </div>
        )}

        {/* History */}
        {tab === 'History' && (
          sortedHistory.length === 0
            ? <p className='text-sm text-gray-400 text-center py-10'>{t('Tidak ada riwayat kepegawaian.', 'No employment history.')}</p>
            : <div className='overflow-x-auto'>
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='border-b border-gray-100'>
                      <th className='text-left py-2 px-3 text-xs font-bold text-gray-500'>{t('Tanggal Efektif', 'Effective Date')}</th>
                      <th className='text-left py-2 px-3 text-xs font-bold text-gray-500'>Action</th>
                      <th className='text-left py-2 px-3 text-xs font-bold text-gray-500'>{t('Alasan', 'Reason')}</th>
                      <th className='text-left py-2 px-3 text-xs font-bold text-gray-500'>{t('Catatan', 'Note')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedHistory.map(h => (
                      <tr key={h.id} className='border-b border-gray-50 hover:bg-gray-50'>
                        <td className='py-2.5 px-3 text-gray-600 whitespace-nowrap'>{h.effectiveDate}</td>
                        <td className='py-2.5 px-3'>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${ACTION_COLOR[h.action] || 'bg-gray-100 text-gray-600'}`}>
                            {h.action}
                          </span>
                        </td>
                        <td className='py-2.5 px-3 text-gray-600'>{h.reason}</td>
                        <td className='py-2.5 px-3 text-gray-400 text-xs'>{h.note || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
        )}

      </div>
    </div>
  )
}
