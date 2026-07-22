'use client'
import { useState, useEffect } from 'react'
import { useRouter }           from 'next/navigation'
import { useAuthStore }        from '@/store/authStore'
import { useBrandingStore }    from '@/store/brandingStore'
import { TALENT_ONLY_ROLES }   from '@/constants/roles'

// ─── Demo / simulation accounts shown on the login screen ─────────────────────
const DEMO_GROUPS = [
  { title: 'Onboarding', accounts: [
    { label: 'Onboarding Admin',    username: 'onboarding-admin',    password: 'ob123' },
    { label: 'Onboarding Manager',  username: 'onboarding-manager',  password: 'ob123' },
    { label: 'Onboarding Employee', username: 'onboarding-employee', password: 'ob123' },
  ]},
  { title: 'Offboarding', accounts: [
    { label: 'HR Offboarding',       username: 'offboarding-hr',       password: 'of123' },
    { label: 'Atasan Offboarding',   username: 'offboarding-manager',  password: 'of123' },
    { label: 'Karyawan Offboarding', username: 'offboarding-employee', password: 'of123' },
  ]},
  { title: 'Performance', accounts: [
    { label: 'HR Performance',        username: 'performance-hr',       password: 'perf123' },
    { label: 'Manager Performance',   username: 'performance-manager',  password: 'perf123' },
    { label: 'Karyawan Performance',  username: 'performance-employee', password: 'perf123' },
  ]},
  { title: 'Talent & Lainnya', accounts: [
    { label: 'Talent Management',  username: 'talent',      password: 'pass123' },
    { label: 'Learning Management', username: 'learning', password: 'learning123' },
  ]},
]

export default function LoginPage() {
  const [username, setUsername]   = useState('')
  const [password, setPassword]   = useState('')
  const [showPass, setShowPass]   = useState(false)
  const [error, setError]         = useState('')
  const [fieldErr, setFieldErr]   = useState({ username: '', password: '' })
  const [loading, setLoading]     = useState(false)
  const [mounted, setMounted]     = useState(false)
  const [showDemo, setShowDemo]   = useState(false)
  const { login }                 = useAuthStore()
  const { loginLogo }             = useBrandingStore()
  const router = useRouter()

  useEffect(() => { setMounted(true) }, [])

  const fillDemo = (u, p) => {
    setUsername(u); setPassword(p)
    setFieldErr({ username: '', password: '' }); setError('')
    setShowDemo(false)
  }

  const handleLogin = async () => {
    const errs = { username: username ? '' : 'Please enter your username', password: password ? '' : 'Please enter your password' }
    setFieldErr(errs)
    if (errs.username || errs.password) return
    setLoading(true)
    setError('')
    const ok = login(username, password)
    if (ok) {
      document.cookie = 'hcm-auth=1; path=/; max-age=86400'
      const role = useAuthStore.getState().currentUser?.role
      const RESTRICTED_HOME = {
        learning:    '/hr/learning/certificate',
        ob_admin:    '/hr/onboarding/tracker',
        ob_manager:  '/mss/approve-onboarding',
        ob_employee: '/ess/onboarding',
        of_admin:    '/hr/employee/personnel-action/offboarding-monitor',
        of_manager:  '/mss/offboarding',
        of_employee: '/ess/offboarding',
      }
      const dest = RESTRICTED_HOME[role]
        ?? (TALENT_ONLY_ROLES.includes(role) ? '/hr/talent/key-position' : '/dashboard')
      router.push(dest)
    } else {
      setError('Username atau password salah.')
      setLoading(false)
    }
  }

  return (
    <div className='flex' style={{ minHeight: 'calc(100vh / 0.85)', background: 'linear-gradient(120deg, #f4a97a 0%, #f8d5c0 30%, #fff 60%, #f9f0ee 100%)' }}>

      {/* Left: login card column */}
      <div className='flex flex-col justify-center items-center w-full md:w-[520px] lg:w-[560px] px-8 py-12 relative z-10'>

        <div className='w-full max-w-[420px] bg-white rounded-3xl shadow-2xl overflow-hidden'>

          {/* Card body */}
          <div className='px-10 pt-10 pb-6'>

            {/* Logo */}
            <div className='mb-5'>
              <img
                src={mounted && loginLogo ? loginLogo : '/logos/manusistem.png'}
                alt='Manusistem'
                className='h-12 w-auto object-contain'
              />
            </div>

            {/* Greeting */}
            <h1 className='text-3xl font-bold text-gray-900 mb-0.5'>Hi, Dexan</h1>
            <div className='mb-6'>
              <p className='text-sm text-gray-400'>Welcome!</p>
            </div>

            {/* Email */}
            <div className='mb-4'>
              <label className='block text-sm font-semibold text-gray-700 mb-1.5'>Username</label>
              <input value={username} onChange={e => { setUsername(e.target.value); setFieldErr(p => ({ ...p, username: '' })) }}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className={`w-full px-4 py-3 rounded-xl text-sm outline-none transition border ${fieldErr.username ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50 focus:border-red-400 focus:bg-white'}`}
                placeholder='Enter your username' disabled={loading} />
              {fieldErr.username && <p className='text-xs text-red-500 mt-1'>{fieldErr.username}</p>}
            </div>

            {/* Password */}
            <div className='mb-5'>
              <label className='block text-sm font-semibold text-gray-700 mb-1.5'>Password</label>
              <div className='relative'>
                <input type={showPass ? 'text' : 'password'} value={password}
                  onChange={e => { setPassword(e.target.value); setFieldErr(p => ({ ...p, password: '' })) }}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  className={`w-full px-4 py-3 pr-11 rounded-xl text-sm outline-none transition border ${fieldErr.password ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50 focus:border-red-400 focus:bg-white'}`}
                  placeholder='Enter password' disabled={loading} />
                <button type='button' onClick={() => setShowPass(v => !v)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition'>
                  {showPass ? (
                    <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'><path d='M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24'/><line x1='1' y1='1' x2='23' y2='23'/></svg>
                  ) : (
                    <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'><path d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z'/><circle cx='12' cy='12' r='3'/></svg>
                  )}
                </button>
              </div>
              {fieldErr.password && <p className='text-xs text-red-500 mt-1'>{fieldErr.password}</p>}
            </div>

            {error && (
              <div className='bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-xl mb-4'>{error}</div>
            )}

            <button onClick={handleLogin} disabled={loading}
              className='w-full py-3.5 rounded-xl text-white font-semibold text-sm transition hover:opacity-90 disabled:opacity-60'
              style={{ background: '#8B1A1A' }}>
              {loading ? 'Signing in...' : 'Login'}
            </button>
          </div>

          {/* Bottom stripe */}
          <div className='h-1.5' style={{ background: 'linear-gradient(90deg,#8B1A1A,#D7252B,#f4a97a,#f9d276,#8B1A1A)' }} />

          {/* Footer */}
          <div className='text-center py-2.5'>
            <span className='text-[10px] text-gray-300'>© 2026 Kappabel Prototype</span>
          </div>
        </div>

        {/* Demo Accounts */}
        <div className='w-full max-w-[420px] mt-4'>
          <button type='button' onClick={() => setShowDemo(v => !v)}
            className='w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/70 backdrop-blur text-sm font-semibold text-gray-700 shadow hover:bg-white transition'>
            <span className='flex items-center gap-2'>
              <svg width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><path d='M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2'/><circle cx='9' cy='7' r='4'/><path d='M23 21v-2a4 4 0 00-3-3.87'/><path d='M16 3.13a4 4 0 010 7.75'/></svg>
              Demo Accounts
            </span>
            <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5'
              className={`transition-transform ${showDemo ? 'rotate-180' : ''}`}><polyline points='6 9 12 15 18 9'/></svg>
          </button>

          {showDemo && (
            <div className='mt-2 bg-white rounded-2xl shadow-xl p-4 space-y-3 max-h-[320px] overflow-y-auto'>
              <p className='text-[11px] text-gray-400 -mt-1'>Klik salah satu akun untuk mengisi form login otomatis.</p>
              {DEMO_GROUPS.map(g => (
                <div key={g.title}>
                  <div className='text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-1.5'>{g.title}</div>
                  <div className='space-y-1'>
                    {g.accounts.map(a => (
                      <button key={a.username} type='button' onClick={() => fillDemo(a.username, a.password)}
                        className='w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left bg-gray-50 hover:bg-red-50 border border-gray-100 hover:border-red-200 transition group'>
                        <div className='min-w-0'>
                          <div className='text-xs font-semibold text-gray-800 truncate'>{a.label}</div>
                          <div className='text-[11px] text-gray-400 truncate'>{a.username} · {a.password}</div>
                        </div>
                        <span className='text-[10px] font-semibold text-red-700 opacity-0 group-hover:opacity-100 transition flex-shrink-0'>Isi →</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: decorative panel */}
      <div className='hidden md:flex flex-1 items-center justify-center px-12'>
        <img src='/logos/kappabel-login-DFPmmq5m.png' alt='Dexa Group 56' className='max-w-full max-h-[420px] object-contain' />
      </div>
    </div>
  )
}
