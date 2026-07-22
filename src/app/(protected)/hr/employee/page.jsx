'use client'
import Icon from '@/components/ui/Icon'
import { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEmployeeStore } from '@/store/employeeStore'
import { useStructureStore } from '@/store/structureStore'
import { useT } from '@/store/languageStore'
import { tenure } from '@/utils/dateUtils'
import { exportCsv } from '@/utils/exportCsv'
import { EMPTY_EMP, EMP_TYPES } from '@/utils/constants'
import NewEmployeeForm from '@/components/employee/NewEmployeeForm'

// ─── Status → pill styling ────────────────────────────────────────────────────
const STATUS_STYLE = {
  Active:     { dot: '#16a34a', cls: 'text-green-700 bg-green-50 border-green-200' },
  Inactive:   { dot: '#9ca3af', cls: 'text-gray-600 bg-gray-100 border-gray-200' },
  Terminated: { dot: '#6b7280', cls: 'text-gray-700 bg-gray-100 border-gray-300' },
  Resigned:   { dot: '#ea580c', cls: 'text-orange-700 bg-orange-50 border-orange-200' },
}
const TYPE_STYLE = {
  Permanent: 'text-indigo-700 bg-indigo-50 border-indigo-200',
  Contract:  'text-amber-700 bg-amber-50 border-amber-200',
  Intern:    'text-sky-700 bg-sky-50 border-sky-200',
  Outsource: 'text-purple-700 bg-purple-50 border-purple-200',
}

function Avatar({ emp }) {
  const initials = (emp?.name || '?').trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div className='w-8 h-8 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0'
      style={{ background: emp?.photo ? undefined : 'linear-gradient(135deg,#8B1A1A,#D7252B)' }}>
      {emp?.photo
        ? <img src={emp.photo} alt='' className='w-full h-full object-cover' />
        : <span className='text-[11px] font-bold text-white'>{initials}</span>}
    </div>
  )
}

const fmtDate = (d) => {
  if (!d) return '—'
  const dt = new Date(d)
  return isNaN(dt) ? d : dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function EmployeeDataPage() {
  const store     = useEmployeeStore()
  const structure = useStructureStore()
  const { employees, addEmployee } = store
  const router       = useRouter()
  const searchParams = useSearchParams()
  const t            = useT()

  // Deep-link from global search (?id=) → go straight to the profile page.
  useEffect(() => {
    const idParam = searchParams.get('id')
    if (idParam) router.replace(`/hr/employee/${idParam}`)
  }, [searchParams, router])

  // ── Lookup maps (avoid .find per row over ~10k employees) ───────────────────
  const deptMap = useMemo(() => Object.fromEntries(structure.departments.map(d => [String(d.id), d.name])), [structure.departments])
  const posMap  = useMemo(() => Object.fromEntries(structure.positions.map(p => [String(p.id), p.name])),  [structure.positions])
  const compMap = useMemo(() => Object.fromEntries(structure.companies.map(c => [String(c.id), c])),        [structure.companies])

  // ── Filters ─────────────────────────────────────────────────────────────────
  const [q, setQ]           = useState('')
  const [status, setStatus] = useState('Active')
  const [dept, setDept]     = useState('')
  const [empType, setType]  = useState('')

  // ── Sort ──────────────────────────────────────────────────────────────────--
  const [sortKey, setSortKey] = useState('name')
  const [sortDir, setSortDir] = useState('asc')
  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  // ── Pagination ────────────────────────────────────────────────────────────--
  const [page, setPage]         = useState(1)
  const [pageSize, setPageSize] = useState(25)
  useEffect(() => { setPage(1) }, [q, status, dept, empType, sortKey, sortDir, pageSize])

  // ── New employee modal ────────────────────────────────────────────────────--
  const [showNew, setShowNew] = useState(false)
  const [form, setForm]       = useState(EMPTY_EMP)
  const [msg, setMsg]         = useState(null)
  const flash = (text, type = 'success') => { setMsg({ text, type }); setTimeout(() => setMsg(null), 3000) }

  const getVal = (e, key) => {
    switch (key) {
      case 'name':       return (e.name || '').toLowerCase()
      case 'nik':        return e.nik || ''
      case 'position':   return (posMap[String(e.positionId)] || '').toLowerCase()
      case 'department': return (deptMap[String(e.departmentId)] || '').toLowerCase()
      case 'type':       return e.employmentType || ''
      case 'status':     return e.status || ''
      case 'joinDate':   return e.joinDate || ''
      default:           return ''
    }
  }

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    const rows = employees.filter(e => {
      const matchQ    = !term || (e.name || '').toLowerCase().includes(term) || (e.nik || '').toLowerCase().includes(term)
      const matchStat = !status  || e.status === status
      const matchDept = !dept    || String(e.departmentId) === String(dept)
      const matchType = !empType || e.employmentType === empType
      return matchQ && matchStat && matchDept && matchType
    })
    const dir = sortDir === 'asc' ? 1 : -1
    return rows.sort((a, b) => {
      const va = getVal(a, sortKey), vb = getVal(b, sortKey)
      return va < vb ? -dir : va > vb ? dir : 0
    })
  }, [employees, q, status, dept, empType, sortKey, sortDir, deptMap, posMap])

  const total      = filtered.length
  const pageCount  = Math.max(1, Math.ceil(total / pageSize))
  const start      = (page - 1) * pageSize
  const pageRows   = filtered.slice(start, start + pageSize)

  const handleExportCsv = () => exportCsv('employee-data',
    ['NIK', 'Name', 'Status', 'Employment Type', 'Department', 'Position', 'Company', 'Join Date'],
    filtered.map(e => [e.nik, e.name, e.status, e.employmentType || '',
      deptMap[String(e.departmentId)] || '', posMap[String(e.positionId)] || '',
      compMap[String(e.companyId)]?.name || '', e.joinDate || '']))

  const handleSaveNew = () => {
    if (!form.nik)       return flash(t('NIK wajib diisi.', 'NIK is required.'), 'error')
    if (!form.name)      return flash(t('Nama wajib diisi.', 'Name is required.'), 'error')
    if (!form.companyId) return flash(t('Company wajib dipilih.', 'Company is required.'), 'error')
    if (!form.joinDate)  return flash(t('Join Date wajib diisi.', 'Join Date is required.'), 'error')
    addEmployee(form)
    const newId = useEmployeeStore.getState().lastAddedEmpId
    setShowNew(false)
    if (newId) router.push(`/hr/employee/${newId}`)
  }

  const resetFilters = () => { setQ(''); setStatus(''); setDept(''); setType('') }

  const activeCount = useMemo(() => employees.filter(e => e.status === 'Active').length, [employees])

  const inputCls  = 'px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-red-400 bg-white'
  const SortHead = ({ label, k, className = '' }) => (
    <th className={`px-4 py-2.5 text-left font-semibold text-[11px] uppercase tracking-wide text-gray-500 select-none ${className}`}>
      <button onClick={() => toggleSort(k)} className='inline-flex items-center gap-1 hover:text-gray-800 transition'>
        {label}
        <span className={`text-[9px] leading-none ${sortKey === k ? 'text-red-600' : 'text-gray-300'}`}>
          {sortKey === k ? (sortDir === 'asc' ? '▲' : '▼') : '▲'}
        </span>
      </button>
    </th>
  )

  return (
    <div className='flex flex-col gap-4'>

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className='flex items-end justify-between gap-4 flex-wrap'>
        <div>
          <h1 className='text-xl font-bold text-gray-900'>{t('Data Karyawan', 'Employee Data')}</h1>
          <p className='text-sm text-gray-500 mt-0.5'>
            {employees.length.toLocaleString('id-ID')} {t('karyawan', 'employees')}
            <span className='text-gray-300'> · </span>
            <span className='text-green-600 font-medium'>{activeCount.toLocaleString('id-ID')} {t('aktif', 'active')}</span>
            <span className='text-gray-300'> · </span>
            <span className='text-gray-400'>{total.toLocaleString('id-ID')} {t('ditampilkan', 'shown')}</span>
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <button onClick={handleExportCsv}
            className='inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition'>
            <Icon e='↓' size={14} className='inline align-[-2px]' /> {t('Ekspor CSV', 'Export CSV')}
          </button>
          <button onClick={() => { setForm(EMPTY_EMP); setShowNew(true) }}
            className='inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white rounded-lg hover:opacity-90 transition'
            style={{ background: 'linear-gradient(135deg,#8B1A1A,#D7252B)' }}>
            <span className='text-sm leading-none'>+</span> {t('Karyawan Baru', 'New Employee')}
          </button>
        </div>
      </div>

      {/* ── Table card ──────────────────────────────────────────────────────── */}
      <div className='bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden'>

        {/* Toolbar / filters */}
        <div className='flex items-center gap-2.5 px-4 py-3 border-b border-gray-100 flex-wrap'>
          <div className='relative flex-1 min-w-[220px]'>
            <span className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm'><Icon e='🔍' size={14} /></span>
            <input value={q} onChange={e => setQ(e.target.value)}
              placeholder={t('Cari nama atau NIK…', 'Search name or NIK…')}
              className={`${inputCls} w-full pl-9`} />
          </div>
          <select value={status} onChange={e => setStatus(e.target.value)} className={inputCls}>
            <option value=''>{t('Semua Status', 'All Status')}</option>
            <option value='Active'>Active</option>
            <option value='Inactive'>Inactive</option>
            <option value='Terminated'>Terminated</option>
            <option value='Resigned'>Resigned</option>
          </select>
          <select value={dept} onChange={e => setDept(e.target.value)} className={`${inputCls} max-w-[220px]`}>
            <option value=''>{t('Semua Department', 'All Departments')}</option>
            {structure.departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select value={empType} onChange={e => setType(e.target.value)} className={inputCls}>
            <option value=''>{t('Semua Tipe', 'All Types')}</option>
            {EMP_TYPES.map(tp => <option key={tp} value={tp}>{tp}</option>)}
          </select>
          {(q || status || dept || empType) && (
            <button onClick={resetFilters}
              className='px-3 py-2 text-xs font-semibold text-gray-500 hover:text-red-600 transition'>
              {t('Reset', 'Reset')}
            </button>
          )}
        </div>

        {/* Table */}
        <div className='overflow-x-auto'>
          <table className='w-full text-sm border-collapse'>
            <thead>
              <tr className='bg-gray-50 border-b border-gray-200'>
                <SortHead label={t('Karyawan', 'Employee')} k='name' />
                <SortHead label='NIK' k='nik' />
                <SortHead label={t('Posisi', 'Position')} k='position' />
                <SortHead label='Department' k='department' />
                <th className='px-4 py-2.5 text-left font-semibold text-[11px] uppercase tracking-wide text-gray-500'>{t('Perusahaan', 'Company')}</th>
                <SortHead label={t('Tipe', 'Type')} k='type' />
                <SortHead label='Status' k='status' />
                <SortHead label={t('Tgl Masuk', 'Join Date')} k='joinDate' className='whitespace-nowrap' />
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className='py-16 text-center text-gray-400 text-sm'>
                    <div className='text-3xl mb-2'><Icon e='🔍' size={15} /></div>
                    {t('Tidak ada karyawan yang cocok', 'No matching employees')}
                  </td>
                </tr>
              ) : pageRows.map(e => {
                const st   = STATUS_STYLE[e.status] || STATUS_STYLE.Inactive
                const comp = compMap[String(e.companyId)]
                return (
                  <tr key={e.id} onClick={() => router.push(`/hr/employee/${e.id}`)}
                    className='border-b border-gray-100 hover:bg-red-50/40 cursor-pointer transition-colors'>
                    <td className='px-4 py-2.5'>
                      <div className='flex items-center gap-3 min-w-0'>
                        <Avatar emp={e} />
                        <div className='min-w-0'>
                          <div className='font-semibold text-gray-800 truncate'>{e.name}</div>
                          {e.email && <div className='text-xs text-gray-400 truncate'>{e.email}</div>}
                        </div>
                      </div>
                    </td>
                    <td className='px-4 py-2.5'><span className='font-mono text-xs text-gray-600'>{e.nik}</span></td>
                    <td className='px-4 py-2.5 text-gray-700'>{posMap[String(e.positionId)] || '—'}</td>
                    <td className='px-4 py-2.5 text-gray-600'>{deptMap[String(e.departmentId)] || '—'}</td>
                    <td className='px-4 py-2.5'>
                      {comp?.companyCode
                        ? <span className='font-mono font-semibold text-[11px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded tracking-wider'>{comp.companyCode}</span>
                        : <span className='text-gray-500 text-xs'>{comp?.name || '—'}</span>}
                    </td>
                    <td className='px-4 py-2.5'>
                      {e.employmentType
                        ? <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md border ${TYPE_STYLE[e.employmentType] || 'text-gray-600 bg-gray-50 border-gray-200'}`}>{e.employmentType}</span>
                        : <span className='text-gray-300'>—</span>}
                    </td>
                    <td className='px-4 py-2.5'>
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${st.cls}`}>
                        <span className='w-1.5 h-1.5 rounded-full' style={{ background: st.dot }} />
                        {e.status}
                      </span>
                    </td>
                    <td className='px-4 py-2.5 whitespace-nowrap'>
                      <div className='text-gray-700'>{fmtDate(e.joinDate)}</div>
                      {e.joinDate && <div className='text-[11px] text-gray-400'>{tenure(e.joinDate)}</div>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div className='flex items-center justify-between gap-4 px-4 py-3 border-t border-gray-100 flex-wrap'>
          <div className='flex items-center gap-2 text-xs text-gray-500'>
            <span>{t('Baris per halaman', 'Rows per page')}</span>
            <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))}
              className='px-2 py-1 border border-gray-200 rounded-md text-xs outline-none focus:border-red-400 bg-white'>
              {[15, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <span className='ml-2'>
              {total === 0 ? '0' : `${(start + 1).toLocaleString('id-ID')}–${Math.min(start + pageSize, total).toLocaleString('id-ID')}`}
              {' '}{t('dari', 'of')}{' '}{total.toLocaleString('id-ID')}
            </span>
          </div>
          <div className='flex items-center gap-1'>
            <button onClick={() => setPage(1)} disabled={page === 1}
              className='px-2.5 py-1.5 text-xs font-semibold text-gray-600 rounded-md hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent transition'>«</button>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className='px-3 py-1.5 text-xs font-semibold text-gray-600 rounded-md hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent transition'>{t('Sebelumnya', 'Prev')}</button>
            <span className='px-3 text-xs text-gray-500'>{t('Halaman', 'Page')} <strong className='text-gray-800'>{page}</strong> / {pageCount}</span>
            <button onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={page >= pageCount}
              className='px-3 py-1.5 text-xs font-semibold text-gray-600 rounded-md hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent transition'>{t('Berikutnya', 'Next')}</button>
            <button onClick={() => setPage(pageCount)} disabled={page >= pageCount}
              className='px-2.5 py-1.5 text-xs font-semibold text-gray-600 rounded-md hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent transition'>»</button>
          </div>
        </div>
      </div>

      {/* ── New employee modal ──────────────────────────────────────────────── */}
      {showNew && (
        <div className='fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 overflow-y-auto'>
          <div className='bg-white rounded-2xl shadow-xl w-full max-w-3xl my-8'>
            <div className='flex items-center justify-between px-6 py-4 border-b border-gray-100'>
              <h2 className='text-base font-bold text-gray-800'>{t('Tambah Karyawan Baru', 'Add New Employee')}</h2>
              <button onClick={() => setShowNew(false)} className='text-gray-400 hover:text-gray-700 text-xl leading-none'>×</button>
            </div>
            {msg && (
              <div className={`mx-6 mt-4 px-4 py-2 rounded-lg text-xs ${msg.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                {msg.text}
              </div>
            )}
            <div className='p-6 max-h-[70vh] overflow-y-auto'>
              <NewEmployeeForm form={form} setForm={setForm} S={structure} />
            </div>
            <div className='flex justify-end gap-2 px-6 py-4 border-t border-gray-100'>
              <button onClick={() => setShowNew(false)}
                className='px-4 py-2 bg-gray-100 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-200 transition'>
                {t('Batal', 'Cancel')}
              </button>
              <button onClick={handleSaveNew}
                className='px-4 py-2 text-white text-xs font-semibold rounded-lg hover:opacity-90 transition'
                style={{ background: 'linear-gradient(135deg,#8B1A1A,#D7252B)' }}>
                {t('Simpan', 'Save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
