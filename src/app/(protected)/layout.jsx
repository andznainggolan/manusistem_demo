'use client'
import Icon from '@/components/ui/Icon'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore }     from '@/store/authStore'
import Sidebar              from '@/components/layout/Sidebar'
import GlobalSearch         from '@/components/layout/GlobalSearch'
import NotificationBell     from '@/components/layout/NotificationBell'
import LoginAsModal         from '@/components/layout/LoginAsModal'
import Toast                from '@/components/layout/Toast'
import { useBrandingStore } from '@/store/brandingStore'
import { useLanguageStore } from '@/store/languageStore'
import { useToastStore }    from '@/store/toastStore'
import { useOnboardingStore } from '@/store/onboardingStore'
import { useEmployeeStore }  from '@/store/employeeStore'
import { roleLabel }        from '@/constants/roles'
import { runStateBackfill } from '@/lib/stateBackfill'

// ─── Restricted demo accounts ─────────────────────────────────────────────────
// role <Icon e='→' size={14} className='inline align-[-2px]' /> { home, allow:[path prefixes] }. Accounts with one of these roles can
// only reach the listed paths; every other protected route redirects to `home`
// and the side navigation is hidden. All other accounts keep full access.
const RESTRICTED = {
  learning:    { home: '/hr/learning/certificate', allow: [
    '/hr/learning/certificate',
    '/hr/learning/point-management',
  ]},
  ob_admin:    { home: '/hr/onboarding/tracker',   allow: ['/hr/onboarding'] },
  ob_manager:  { home: '/mss/approve-onboarding',  allow: ['/mss/approve-onboarding'] },
  ob_employee: { home: '/ess/onboarding',          allow: ['/ess/onboarding'] },
  of_admin:    { home: '/hr/employee/personnel-action/offboarding-approval',
    allow: [
      '/hr/employee/personnel-action/offboarding-approval',
      '/hr/employee/personnel-action/offboarding-notify',
      '/hr/employee/personnel-action/offboarding-monitor',
      '/hr/employee/personnel-action/offboarding-checklist',
      '/hr/employee/personnel-action/exit-interview',
    ]},
  of_manager:  { home: '/mss/offboarding',
    allow: ['/mss/offboarding', '/mss/offboarding-checklist'] },
  of_employee: { home: '/ess/offboarding',         allow: ['/ess/offboarding'] },
}
const pathAllowed = (r, path) => r.allow.some(p => path === p || path.startsWith(p + '/'))

// ─── Keywords that trigger a success toast ────────────────────────────────────
const ACTION_KEYWORDS = [
  // Indonesian
  'simpan','submit','setujui','approved','approve','kirim','konfirmasi',
  'aktifkan','selesai','proses','generate','terbitkan','publish','update',
  'perbarui','tambah','buat','hapus','batalkan','tolak','reject',
  // English
  'save','confirm','complete','activate','send','create','delete',
]

const DELETE_KEYWORDS = ['hapus','delete','batalkan','tolak','reject','terminate','demote']

const TOAST_MESSAGES = {
  delete:  { msg: 'Data berhasil dihapus.', type: 'warning' },
  reject:  { msg: 'Data berhasil ditolak.', type: 'warning' },
  default: { msg: 'Data berhasil disimpan.', type: 'success' },
  approve: { msg: 'Data berhasil disetujui.', type: 'success' },
  send:    { msg: 'Data berhasil dikirim.', type: 'success' },
  create:  { msg: 'Data berhasil dibuat.', type: 'success' },
  activate:{ msg: 'Template berhasil diaktifkan.', type: 'success' },
  generate:{ msg: 'Data berhasil digenerate.', type: 'success' },
}

function getToastConfig(text) {
  const t = text.toLowerCase().trim()
  if (/hapus|delete/.test(t))                          return TOAST_MESSAGES.delete
  if (/tolak|reject|batalkan/.test(t))                 return TOAST_MESSAGES.reject
  if (/setujui|approve|approved/.test(t))              return TOAST_MESSAGES.approve
  if (/kirim|send/.test(t))                            return TOAST_MESSAGES.send
  if (/buat|create|tambah/.test(t))                    return TOAST_MESSAGES.create
  if (/aktifkan|activate|publish|terbitkan/.test(t))   return TOAST_MESSAGES.activate
  if (/generate/.test(t))                              return TOAST_MESSAGES.generate
  return TOAST_MESSAGES.default
}

export default function ProtectedLayout({ children }) {
  const { currentUser, realUser, logout, endProxy, _hydrated } = useAuthStore()
  const { topbarLogo }   = useBrandingStore()
  const { lang, setLang } = useLanguageStore()
  const router = useRouter()
  const pathname = usePathname()
  const restriction = RESTRICTED[currentUser?.role] || null
  const locked = !!restriction
  const onAllowedPath = !restriction || pathAllowed(restriction, pathname)

  const [loginAsOpen, setLoginAsOpen] = useState(false)
  const { show: showToast } = useToastStore()
  const { onboardings, activateOnboarding } = useOnboardingStore()
  const { employees } = useEmployeeStore()

  // ── Backfill store state to the DB once (make the database the source of truth)
  useEffect(() => { runStateBackfill() }, [])

  // ── Auto-activate onboarding on the employee's join date (app-wide) ──────────
  // Any onboarding still in Preparation whose employee has reached their join
  // date is activated automatically, so tasks become visible without HR having
  // to remember to open the tracker and click "Activate".
  useEffect(() => {
    if (!_hydrated) return
    const today = new Date().toISOString().slice(0, 10)
    ;(onboardings || []).forEach(ob => {
      if (ob.workflowStatus !== 'Preparation') return
      const emp = (employees || []).find(e => e.id === Number(ob.employeeId))
      if (emp?.joinDate && String(emp.joinDate).slice(0, 10) <= today) {
        activateOnboarding(ob.id, null, 'System (Auto)')
      }
    })
  }, [_hydrated, onboardings, employees, activateOnboarding])

  // ── Global action button interceptor ────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      const btn = e.target.closest('button, [type="submit"], [role="button"]')
      if (!btn) return

      // Skip navigation, toggle, close, cancel, search buttons
      const skipPatterns = /tutup|close|cancel|batal|back|kembali|✕|×|pin|unpin|logout|bahasa|id|en|🔔|search|cari|edit|copy|salin|duplikat|⧉|↑|↓/i
      const raw = (btn.textContent || '').replace(/\s+/g, ' ').trim()
      if (!raw || skipPatterns.test(raw)) return
      // Skip "+" prefix buttons — these open forms or add rows, not submit data
      if (raw.startsWith('+')) return

      // Check if text contains an action keyword
      const lower = raw.toLowerCase()
      const isAction = ACTION_KEYWORDS.some(kw => lower.includes(kw))
      if (!isAction) return

      // Small delay so the page's own handler fires first.
      // If a page-level error flash appeared, or 'action-failed' event was dispatched, skip toast.
      let cancelled = false
      const cancelFn = () => { cancelled = true }
      window.addEventListener('action-failed', cancelFn, { once: true })

      setTimeout(() => {
        window.removeEventListener('action-failed', cancelFn)
        if (cancelled) return
        // Check if a page-level error message appeared (flash error renders with bg-red-50 text-red-600)
        const errorFlash = document.querySelector('.bg-red-50.text-red-600, .bg-red-50.text-red-700')
        if (errorFlash && errorFlash.textContent.trim()) return
        const cfg = getToastConfig(raw)
        showToast(cfg.msg, cfg.type)
      }, 400)
    }

    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [showToast])

  const isProxy    = !!realUser
  const canProxy   = !isProxy && currentUser?.role === 'superadmin'

  useEffect(() => {
    if (!_hydrated) return
    if (!currentUser) { router.push('/login'); return }
    // Restricted demo account: keep them within their allowed module.
    if (locked && !onAllowedPath) router.replace(restriction.home)
  }, [_hydrated, currentUser, pathname, locked, onAllowedPath, restriction, router])

  if (!_hydrated) return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <div className='w-10 h-10 rounded-xl animate-pulse' style={{ background: 'linear-gradient(135deg,#8B1A1A,#D7252B)' }} />
    </div>
  )

  if (!currentUser) return null

  // While the restricted redirect resolves, don't flash other content.
  if (locked && !onAllowedPath) return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <div className='w-10 h-10 rounded-xl animate-pulse' style={{ background: 'linear-gradient(135deg,#8B1A1A,#D7252B)' }} />
    </div>
  )

  const handleLogout = () => {
    logout()
    document.cookie = 'hcm-auth=; path=/; max-age=0'
    router.push('/login')
  }

  const handleEndProxy = () => {
    endProxy()
    window.location.href = '/dashboard'
  }


  const initials = (currentUser?.name || '?').trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const realInitials = (realUser?.name || '?').trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  const proxyBarHeight = isProxy ? 36 : 0
  const topbarHeight   = 60

  return (
    <div className='flex flex-col min-h-screen bg-gray-50'>

      {/* ── Proxy banner ──────────────────────────────────────────────────────── */}
      {isProxy && (
        <div className='fixed top-0 left-0 right-0 z-[60] flex items-center justify-between px-4'
          style={{ height: proxyBarHeight, background: 'linear-gradient(90deg,#92400e,#d97706)', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
          <div className='flex items-center gap-2 text-white'>
            <span className='text-sm'><Icon e='🔁' size={15} /></span>
            <span className='text-xs font-semibold'>Login as:</span>
            <div className='flex items-center gap-1.5 bg-white/20 rounded-full px-2.5 py-0.5'>
              <div className='w-4 h-4 rounded-full bg-white/30 flex items-center justify-center text-[9px] font-bold text-white'>{initials}</div>
              <span className='text-xs font-bold text-white'>{currentUser.name}</span>
              <span className='text-[10px] text-amber-200'>({roleLabel(currentUser.role)})</span>
            </div>
          </div>

          <div className='flex items-center gap-3'>
            <span className='text-[11px] text-amber-200 hidden sm:block'>
              Sesi asli: <span className='font-semibold text-white'>{realUser?.name}</span>
            </span>
            <button onClick={handleEndProxy}
              className='flex items-center gap-1.5 bg-white text-amber-800 text-xs font-bold px-3 py-1 rounded-full hover:bg-amber-50 transition'>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Kembali ke {realUser?.name}
            </button>
          </div>
        </div>
      )}

      {/* ── Topbar ────────────────────────────────────────────────────────────── */}
      <header className='fixed left-0 right-0 z-50 bg-white'
        style={{ top: proxyBarHeight, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
        {/* Gradient accent strip */}
        <div className='h-[3px]' style={{ background: 'linear-gradient(90deg,#8B1A1A 0%,#D7252B 40%,#f4a97a 80%,#f9d276 100%)' }} />

        {/* Main bar */}
        <div className='h-[57px] flex items-center justify-between pl-1 pr-5 gap-3'>

          {/* Left: logo — default sama dengan logo halaman login */}
          <div className='flex items-center gap-2 flex-shrink-0 pl-2'>
            <img
              src={topbarLogo || '/logos/manusistem.png'}
              alt='Manusistem'
              className='h-9 w-auto object-contain'
            />
          </div>

          {/* Search */}
          <div className='flex-1 flex justify-center px-4'>
            {!locked && <GlobalSearch />}
          </div>

          {/* Right controls */}
          <div className='flex items-center gap-3 flex-shrink-0'>
            {/* Language */}
            <div className='flex items-center gap-0.5 rounded-lg p-0.5'>
              <button onClick={() => setLang('id')}
                className={`text-xs font-semibold px-2.5 py-1 rounded-md transition ${lang === 'id' ? 'bg-red-50 text-red-800' : 'text-gray-500 hover:text-gray-700'}`}>
                ID
              </button>
              <button onClick={() => setLang('en')}
                className={`text-xs font-semibold px-2.5 py-1 rounded-md transition ${lang === 'en' ? 'bg-red-50 text-red-800' : 'text-gray-500 hover:text-gray-700'}`}>
                EN
              </button>
            </div>

            {/* Notification bell */}
            <NotificationBell />

            {/* Login As button — visible to HR / Superadmin when NOT in proxy */}
            {canProxy && (
              <button onClick={() => setLoginAsOpen(true)}
                title='Login As'
                className='flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-amber-400 hover:text-amber-700 hover:bg-amber-50 transition'>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 00-3-3.87"/>
                  <path d="M16 3.13a4 4 0 010 7.75"/>
                </svg>
                <span className='hidden md:inline'>Login as</span>
              </button>
            )}

            {/* User avatar + name */}
            <div className='flex items-center gap-2.5'>
              <div className='relative'>
                <div className='flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white flex-shrink-0'
                  style={{ background: isProxy ? 'linear-gradient(135deg,#92400e,#d97706)' : 'linear-gradient(135deg,#8B1A1A,#D7252B)' }}>
                  {initials}
                </div>
                {/* Real user mini avatar when proxying */}
                {isProxy && (
                  <div className='absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold text-white'
                    style={{ background: 'linear-gradient(135deg,#8B1A1A,#D7252B)' }}>
                    {realInitials[0]}
                  </div>
                )}
              </div>
              <div className='hidden md:block leading-tight'>
                <div className='text-sm font-semibold text-gray-800'>{currentUser?.name}</div>
                <div className='text-[11px] text-gray-400'>
                  {isProxy
                    ? <span className='text-amber-600 font-semibold'>Proxy · {roleLabel(currentUser?.role)}</span>
                    : roleLabel(currentUser?.role)
                  }
                </div>
              </div>
            </div>

            {/* Logout */}
            <button onClick={handleLogout}
              className='text-gray-400 hover:text-red-600 transition p-1.5 rounded-lg hover:bg-red-50'
              title='Logout'>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar + Content */}
      <div className='flex' style={{ marginTop: topbarHeight + proxyBarHeight }}>
        {/* Restricted accounts get the same sidebar, filtered to their allowed menus */}
        <Sidebar allow={restriction?.allow} />

        <main className='flex-1 min-h-screen bg-gray-50'
          style={{ marginLeft: 56 }}>
          <div className='mx-auto w-full max-w-[1400px] px-6 py-8 lg:px-8'>
            {children}
          </div>
        </main>
      </div>

      {/* Login As Modal */}
      {loginAsOpen && <LoginAsModal onClose={() => setLoginAsOpen(false)} />}

      {/* Global Toast */}
      <Toast />
    </div>
  )
}
