'use client'
import Icon from '@/components/ui/Icon'
import { useState, useMemo }  from 'react'
import { useAuthStore }       from '@/store/authStore'
import { useEmployeeStore }   from '@/store/employeeStore'
import { useStructureStore }  from '@/store/structureStore'
import { useT }               from '@/store/languageStore'
import {
  PageHeader, StatCard, SectionCard, DataTable, Tr, Td,
  FormField, Input, Select, ActionButton, EmptyState, BRAND_GRADIENT,
} from '@/components/ui'
import { ROLES, ROLE_LABELS } from '@/constants/roles'

const BRAND = 'linear-gradient(135deg,#8B1A1A,#D7252B)'

const ROLE_STYLE = {
  employee:   'bg-gray-100 text-gray-600',
  manager:    'bg-blue-100 text-blue-700',
  hr:         'bg-red-100 text-red-700',
  hr_officer: 'bg-red-100 text-red-700',
  hr_manager: 'bg-red-100 text-red-700',
  od_officer: 'bg-purple-100 text-purple-700',
  od_manager: 'bg-purple-100 text-purple-700',
  superadmin: 'bg-red-100 text-red-700',
}

const EMPTY_FORM = { username:'', password:'', name:'', role:'employee', dept:'', position:'', email:'', employeeId:'' }

let _id = 10

// ── Employee LOV modal ────────────────────────────────────────────────────────
function EmployeeLOV({ employees, departments, positions, onSelect, onClose }) {
  const [search, setSearch] = useState('')

  const getDept = (id) => departments.find(d => d.id === id)?.name ?? '—'
  const getPos  = (id) => positions.find(p => p.id === id)?.name ?? '—'

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return employees.filter(e =>
      !q ||
      String(e.id).includes(q) ||
      e.name.toLowerCase().includes(q) ||
      getDept(e.departmentId).toLowerCase().includes(q) ||
      getPos(e.positionId).toLowerCase().includes(q)
    )
  }, [search, employees])

  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'
      onClick={onClose}>
      <div className='bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col'
        onClick={e => e.stopPropagation()}>

        <div className='flex items-center justify-between px-5 py-4 border-b border-gray-100'>
          <h3 className='text-sm font-bold text-gray-800'><Icon e='🔍' size={14} className='inline align-[-2px]' /> Pilih Karyawan</h3>
          <button onClick={onClose}
            className='w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 text-xs font-bold'>
            ✕
          </button>
        </div>

        <div className='px-5 py-3 border-b border-gray-100'>
          <input
            autoFocus
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder='Cari nama, ID, department, jabatan…'
            className='w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-red-400'
          />
        </div>

        <div className='overflow-y-auto flex-1'>
          <table className='w-full text-sm'>
            <thead className='sticky top-0 bg-gray-50 z-10'>
              <tr>
                {['ID', 'Nama', 'Department', 'Jabatan'].map(h => (
                  <th key={h} className='text-left px-4 py-2.5 text-xs font-semibold text-gray-500 border-b border-gray-100'>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className='px-4 py-10 text-center text-gray-400 text-sm'>
                    Tidak ada karyawan yang cocok.
                  </td>
                </tr>
              ) : filtered.map(emp => (
                <tr key={emp.id}
                  onClick={() => onSelect(emp)}
                  className='border-t border-gray-50 hover:bg-red-50 cursor-pointer transition'>
                  <td className='px-4 py-2.5 text-gray-500 font-mono text-xs'>{emp.id}</td>
                  <td className='px-4 py-2.5 font-semibold text-gray-800'>{emp.name}</td>
                  <td className='px-4 py-2.5 text-gray-600'>{getDept(emp.departmentId)}</td>
                  <td className='px-4 py-2.5 text-gray-600'>{getPos(emp.positionId)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className='px-5 py-3 border-t border-gray-100 text-xs text-gray-400'>
          {filtered.length} karyawan ditemukan
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
export default function UserManagementPage() {
  const t = useT()
  const { userList, addUser, updateUser, deleteUser, currentUser } = useAuthStore()
  const { employees }                 = useEmployeeStore()
  const { departments, positions }    = useStructureStore()

  const [form,      setForm     ] = useState(EMPTY_FORM)
  const [editing,   setEditing  ] = useState(null)
  const [showModal, setShowModal ] = useState(false)
  const [msg,       setMsg      ] = useState(null)
  const [lovOpen,   setLovOpen  ] = useState(false)
  const [userQ,     setUserQ    ] = useState('')

  const USER_CAP = 100
  const visibleUsers = useMemo(() => {
    const q = userQ.trim().toLowerCase()
    const base = q
      ? userList.filter(u =>
          (u.username || '').toLowerCase().includes(q) ||
          (u.name     || '').toLowerCase().includes(q) ||
          (u.dept     || '').toLowerCase().includes(q) ||
          (u.role     || '').toLowerCase().includes(q))
      : userList
    return base.slice(0, USER_CAP)
  }, [userList, userQ])

  const flash = (text, type = 'success') => { setMsg({ text, type }); setTimeout(() => setMsg(null), 3000) }

  const getDept = (id) => departments.find(d => d.id === id)?.name ?? ''
  const getPos  = (id) => positions.find(p => p.id === id)?.name ?? ''

  const linkedEmployee = form.employeeId
    ? employees.find(e => e.id === Number(form.employeeId))
    : null

  const handleSelectEmployee = (emp) => {
    setForm(f => ({
      ...f,
      employeeId: emp.id,
      name:       f.name || emp.name,
      dept:       f.dept || getDept(emp.departmentId),
      position:   f.position || getPos(emp.positionId),
    }))
    setLovOpen(false)
  }

  const openNew    = () => { setEditing(null); setForm(EMPTY_FORM); setShowModal(true) }
  const closeModal = () => { setShowModal(false); setEditing(null); setForm(EMPTY_FORM) }

  const handleSave = () => {
    if (!form.username || !form.name || (!editing && !form.password))
      return flash('Username, nama, dan password wajib diisi.', 'error')
    if (editing) {
      updateUser(editing, form)
      flash('User diperbarui.')
    } else {
      if (userList.find(u => u.username === form.username))
        return flash('Username sudah digunakan.', 'error')
      addUser({ id: _id++, ...form })
      flash('User ditambahkan.')
    }
    closeModal()
  }

  const handleEdit = (u) => {
    setEditing(u.id)
    setForm({
      username:   u.username,
      password:   u.password,
      name:       u.name,
      role:       u.role,
      dept:       u.dept       || '',
      position:   u.position   || '',
      email:      u.email      || '',
      employeeId: u.employeeId ?? '',
    })
    setShowModal(true)
  }

  return (
    <div>
      {msg && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl text-sm font-semibold
          ${msg.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
          {msg.type === 'error' ? '⚠' : '✓'} {msg.text}
        </div>
      )}

      <PageHeader
        icon='👥'
        title='User Management'
        subtitle='Kelola akun dan hak akses pengguna sistem.'
      />

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-4 mb-6'>
        <StatCard label='Total User'  value={userList.length} icon='👥' tone='brand' />
        <StatCard label='HR / Admin'  value={userList.filter(u => u.role === 'hr' || u.role === 'superadmin').length} icon='⚙️' tone='red' />
        <StatCard label='Manager'     value={userList.filter(u => u.role === 'manager').length} icon='👔' tone='blue' />
        <StatCard label='Terhubung'   value={userList.filter(u => u.employeeId).length} icon='🔗' tone='green' hint='ke data karyawan' />
      </div>

      <SectionCard
        title={t('Daftar User', 'User List')}
        icon='👥'
        bodyClass='p-0'
        actions={
          <button onClick={openNew}
            className='flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white rounded-lg shadow-sm hover:opacity-90 transition whitespace-nowrap'
            style={{ background: BRAND }}>
            + {t('Tambah User', 'Add User')}
          </button>
        }
      >
        <div className='px-4 pt-4 pb-2 flex items-center gap-3'>
          <input value={userQ} onChange={e => setUserQ(e.target.value)}
            placeholder={t('Cari username / nama / dept / role…', 'Search username / name / dept / role…')}
            className='flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-red-400' />
          <span className='text-xs text-gray-400 whitespace-nowrap'>
            {t('Menampilkan', 'Showing')} {visibleUsers.length} / {userList.length}
          </span>
        </div>
        {userList.length === 0 ? (
          <div className='p-5'>
            <EmptyState title='Belum ada user' description='Tambahkan user baru melalui tombol di atas.' />
          </div>
        ) : (
          <DataTable
            className='rounded-none shadow-none ring-0'
            columns={[
              { label: 'Username' },
              { label: 'Nama' },
              { label: 'Employee' },
              { label: 'Role' },
              { label: 'Departemen' },
              { label: 'Aksi', align: 'right' },
            ]}>
            {visibleUsers.map(u => {
              const emp = u.employeeId ? employees.find(e => e.id === Number(u.employeeId)) : null
              return (
                <Tr key={u.id}>
                  <Td className='font-medium text-gray-700'>{u.username}</Td>
                  <Td>{u.name}</Td>
                  <Td>
                    {emp ? (
                      <span className='text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded-full font-medium'>
                        #{emp.id} {emp.name}
                      </span>
                    ) : (
                      <span className='text-xs text-gray-400'>—</span>
                    )}
                  </Td>
                  <Td>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ROLE_STYLE[u.role] || 'bg-gray-100'}`}>
                      {ROLE_LABELS[u.role] || u.role}
                    </span>
                  </Td>
                  <Td className='text-gray-500'>{u.dept || '—'}</Td>
                  <Td align='right'>
                    <div className='flex gap-2 justify-end'>
                      <button onClick={() => handleEdit(u)}
                        className='px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-200'>
                        Edit
                      </button>
                      {u.id !== currentUser?.id && (
                        <button onClick={() => deleteUser(u.id)}
                          className='px-3 py-1 bg-red-50 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-100'>
                          {t('Hapus', 'Delete')}
                        </button>
                      )}
                    </div>
                  </Td>
                </Tr>
              )
            })}
          </DataTable>
        )}
      </SectionCard>

      {/* ── Add/Edit Modal ── */}
      {showModal && (
        <div className='fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4' onClick={closeModal}>
          <div className='bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto' onClick={e => e.stopPropagation()}>
            <div className='px-6 py-4 border-b border-gray-100 flex items-center justify-between'>
              <h2 className='text-base font-bold text-gray-800'>{editing ? 'Edit User' : 'Tambah User'}</h2>
              <button onClick={closeModal} className='text-gray-400 hover:text-gray-600 text-xl font-bold leading-none'>×</button>
            </div>
            <div className='px-6 py-5 space-y-3'>
              {/* ── Employee ID (LOV) ── */}
              <div>
                <label className='block text-xs font-semibold text-gray-600 mb-1'>Employee ID</label>
                <div className='flex gap-2'>
                  <div className='flex-1 flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 min-h-[38px]'>
                    {linkedEmployee ? (
                      <div className='flex items-center gap-2 flex-1 min-w-0'>
                        <span className='text-xs font-mono text-gray-400 flex-shrink-0'>#{linkedEmployee.id}</span>
                        <span className='text-sm font-semibold text-gray-700 truncate'>{linkedEmployee.name}</span>
                      </div>
                    ) : (
                      <span className='text-sm text-gray-400'>
                        {form.employeeId ? `ID: ${form.employeeId}` : '— Belum terhubung —'}
                      </span>
                    )}
                    {form.employeeId && (
                      <button onClick={() => setForm(f => ({ ...f, employeeId: '' }))}
                        className='ml-auto flex-shrink-0 text-gray-400 hover:text-red-500 text-xs font-bold transition'>
                        ✕
                      </button>
                    )}
                  </div>
                  <button onClick={() => setLovOpen(true)}
                    className='px-3 py-2 text-sm font-semibold text-white rounded-lg transition hover:opacity-90 flex-shrink-0'
                    style={{ background: BRAND }}>
                    🔍
                  </button>
                </div>
                {linkedEmployee && (
                  <p className='text-xs text-gray-400 mt-1'>
                    {getDept(linkedEmployee.departmentId)} · {getPos(linkedEmployee.positionId)}
                  </p>
                )}
              </div>

              {/* ── Standard fields ── */}
              {[
                ['Username',    'text',     'username'],
                ['Password',    'password', 'password'],
                ['Nama Lengkap','text',     'name'],
                ['Email',       'email',    'email'],
                ['Departemen',  'text',     'dept'],
                ['Jabatan',     'text',     'position'],
              ].map(([lbl, type, key]) => (
                <FormField key={key} label={lbl}>
                  <Input type={type} value={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={editing && key === 'password' ? 'Kosongkan jika tidak diubah' : ''} />
                </FormField>
              ))}

              {/* Role */}
              <FormField label='Role'>
                <Select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                </Select>
              </FormField>
            </div>
            <div className='px-6 pb-5 flex gap-3'>
              <button onClick={handleSave} className='flex-1 py-2.5 text-sm font-semibold text-white rounded-xl hover:opacity-90 transition' style={{ background: BRAND }}>
                {editing ? t('Simpan Perubahan', 'Save Changes') : t('Tambah User', 'Add User')}
              </button>
              <button onClick={closeModal} className='flex-1 py-2.5 text-sm font-semibold bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition'>
                {t('Batal', 'Cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Employee LOV Modal ── */}
      {lovOpen && (
        <EmployeeLOV
          employees={employees}
          departments={departments}
          positions={positions}
          onSelect={handleSelectEmployee}
          onClose={() => setLovOpen(false)}
        />
      )}
    </div>
  )
}
