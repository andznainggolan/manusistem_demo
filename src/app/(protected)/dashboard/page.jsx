'use client'
import Icon from '@/components/ui/Icon'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { useLeaveStore } from '@/store/leaveStore'
import { useEmployeeStore } from '@/store/employeeStore'
import { useOnboardingStore } from '@/store/onboardingStore'
import { useHayStore } from '@/store/hayStore'
import { usePipStore } from '@/store/pipStore'
import { usePersonnelActionStore } from '@/store/personnelActionStore'
import { useOffboardingChecklistStore } from '@/store/offboardingChecklistStore'
import { useOffboardingNotifyStore } from '@/store/offboardingNotifyStore'
import { offboardingActionItems } from '@/lib/offboarding'
import { useT } from '@/store/languageStore'

/* ── Greeting ──────────────────────────────────────────────────────────────── */
function getGreeting(t) {
  const h = new Date().getHours()
  if (h < 12) return t('Good Morning', 'Good Morning')
  if (h < 17) return t('Good Afternoon', 'Good Afternoon')
  return t('Good Evening', 'Good Evening')
}

/* ── Shortcut SVG icons (professional line set) ────────────────────────────── */
const S = (paths) => (
  <svg width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='currentColor'
    strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'>{paths}</svg>
)
const SICONS = {
  user:        S(<><path d='M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2'/><circle cx='12' cy='7' r='4'/></>),
  users:       S(<><path d='M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2'/><circle cx='9' cy='7' r='4'/><path d='M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75'/></>),
  userPlus:    S(<><path d='M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2'/><circle cx='9' cy='7' r='4'/><line x1='19' y1='8' x2='19' y2='14'/><line x1='22' y1='11' x2='16' y2='11'/></>),
  calendar:    S(<><rect x='3' y='4' width='18' height='18' rx='2'/><line x1='16' y1='2' x2='16' y2='6'/><line x1='8' y1='2' x2='8' y2='6'/><line x1='3' y1='10' x2='21' y2='10'/></>),
  money:       S(<><rect x='2' y='5' width='20' height='14' rx='2'/><circle cx='12' cy='12' r='3'/><line x1='6' y1='12' x2='6.01' y2='12'/><line x1='18' y1='12' x2='18.01' y2='12'/></>),
  chat:        S(<><path d='M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z'/></>),
  book:        S(<><path d='M4 19.5A2.5 2.5 0 016.5 17H20'/><path d='M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z'/></>),
  target:      S(<><circle cx='12' cy='12' r='10'/><circle cx='12' cy='12' r='6'/><circle cx='12' cy='12' r='2'/></>),
  clock:       S(<><circle cx='12' cy='12' r='10'/><polyline points='12 6 12 12 16 14'/></>),
  sitemap:     S(<><rect x='9' y='2' width='6' height='5' rx='1'/><rect x='2' y='17' width='6' height='5' rx='1'/><rect x='16' y='17' width='6' height='5' rx='1'/><path d='M12 7v4M5 17v-2a1 1 0 011-1h12a1 1 0 011 1v2'/></>),
  checkCircle: S(<><path d='M22 11.08V12a10 10 0 11-5.93-9.14'/><polyline points='22 4 12 14.01 9 11.01'/></>),
  clipboard:   S(<><path d='M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2'/><rect x='8' y='2' width='8' height='4' rx='1'/></>),
  barChart:    S(<><line x1='18' y1='20' x2='18' y2='10'/><line x1='12' y1='20' x2='12' y2='4'/><line x1='6' y1='20' x2='6' y2='14'/></>),
  bookmark:    S(<><path d='M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z'/></>),
  workflow:    S(<><circle cx='18' cy='18' r='3'/><circle cx='6' cy='6' r='3'/><path d='M13 6h3a2 2 0 012 2v7'/><line x1='6' y1='9' x2='6' y2='21'/></>),
  palette:     S(<><circle cx='13.5' cy='6.5' r='.5' fill='currentColor'/><circle cx='17.5' cy='10.5' r='.5' fill='currentColor'/><circle cx='8.5' cy='7.5' r='.5' fill='currentColor'/><circle cx='6.5' cy='12.5' r='.5' fill='currentColor'/><path d='M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 011.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z'/></>),
  settings:    S(<><circle cx='12' cy='12' r='3'/><path d='M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z'/></>),
}

/* ── Menu shortcut definitions (role-aware) ────────────────────────────────── */
const ALL_SHORTCUTS = {
  employee: [
    { id: 'personal',  label: 'Personal Information', icon: 'user',        href: '/ess/personal-info' },
    { id: 'leave',     label: 'Leave Request',         icon: 'calendar',    href: '/ess/leave' },
    { id: 'payslip',   label: 'Payslip',               icon: 'money',       href: '/ess/payslip' },
    { id: 'checkin',   label: 'Performance Check-In',  icon: 'chat',        href: '/ess/check-in' },
    { id: 'learning',  label: 'Learning',              icon: 'book',        href: '/ess/learning' },
    { id: 'goals',     label: 'Performance Goals',     icon: 'target',      href: '/ess/performance-goals' },
    { id: 'timecard',  label: 'Attendance',            icon: 'clock',       href: '/ess/attendance' },
    { id: 'orgchart',  label: 'Organization',          icon: 'sitemap',     href: '/hr/orgchart' },
  ],
  manager: [
    { id: 'approval',  label: 'Leave Approval',         icon: 'checkCircle', href: '/mss/leave-approval' },
    { id: 'checkin',   label: 'Team Check-In',          icon: 'chat',        href: '/mss/check-in' },
    { id: 'personal',  label: 'Personal Information',   icon: 'user',        href: '/ess/personal-info' },
    { id: 'leave',     label: 'My Leave',               icon: 'calendar',    href: '/ess/leave' },
    { id: 'goals',     label: 'Performance Goals',      icon: 'target',      href: '/ess/performance-goals' },
    { id: 'pip',       label: 'PIP',                    icon: 'clipboard',   href: '/mss/check-in' },
    { id: 'orgchart',  label: 'Organization',           icon: 'sitemap',     href: '/hr/orgchart' },
  ],
  hr: [
    { id: 'employee',  label: 'Employee',              icon: 'user',        href: '/hr/employee' },
    { id: 'headcount', label: 'Headcount',             icon: 'barChart',    href: '/hr/headcount' },
    { id: 'leave',     label: 'Leave Management',      icon: 'calendar',    href: '/hr/leave' },
    { id: 'onboarding',label: 'Onboarding',            icon: 'userPlus',    href: '/hr/onboarding' },
    { id: 'payroll',   label: 'Payroll',               icon: 'money',       href: '/hr/payroll' },
    { id: 'orgchart',  label: 'Organization',          icon: 'sitemap',     href: '/hr/orgchart' },
    { id: 'learning',  label: 'Learning',              icon: 'book',        href: '/hr/learning' },
    { id: 'position',  label: 'Position',              icon: 'bookmark',    href: '/hr/position' },
  ],
  superadmin: [
    { id: 'users',     label: 'Users',                 icon: 'users',       href: '/sysadmin/users' },
    { id: 'workflow',  label: 'Workflow',              icon: 'workflow',    href: '/sysadmin/workflow/settings' },
    { id: 'branding',  label: 'Branding',              icon: 'palette',     href: '/sysadmin/branding' },
    { id: 'employee',  label: 'Employee',              icon: 'user',        href: '/hr/employee' },
    { id: 'leave',     label: 'Leave Management',      icon: 'calendar',    href: '/hr/leave' },
    { id: 'payroll',   label: 'Payroll',               icon: 'money',       href: '/hr/payroll' },
    { id: 'settings',  label: 'Settings',              icon: 'settings',    href: '/sysadmin/settings/workflow' },
    { id: 'orgchart',  label: 'Organization',          icon: 'sitemap',     href: '/hr/orgchart' },
  ],
}

/* ── My Time Card widget ───────────────────────────────────────────────────── */
function TimeCardWidget({ t }) {
  const [clockIn,  setClockIn ] = useState(null)
  const [clockOut, setClockOut] = useState(null)
  const [now,      setNow     ] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const fmt = (d) => d ? d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '--:--'

  const workingMins = clockIn
    ? Math.floor(((clockOut || now) - clockIn) / 60000)
    : null
  const workingStr = workingMins != null
    ? `${Math.floor(workingMins / 60)}h ${workingMins % 60}m`
    : '--'

  return (
    <div className='bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden'>
      <div className='flex items-center justify-between px-4 py-3 border-b border-gray-100'>
        <div className='flex items-center gap-2 text-gray-700 font-semibold text-sm'>
          <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
            <circle cx='12' cy='12' r='10'/><polyline points='12 6 12 12 16 14'/>
          </svg>
          {t('My Time Card', 'My Time Card')}
        </div>
        <button className='text-xs text-gray-400 hover:text-gray-600 font-medium transition'>
          {t('Show More', 'Show More')}
        </button>
      </div>
      <div className='px-4 py-3 grid grid-cols-2 divide-x divide-gray-100'>
        <div className='pr-4 text-center'>
          <p className='text-lg font-bold text-green-600 font-mono'>{fmt(clockIn)}</p>
          <p className='text-xs text-gray-400 mt-0.5'>In</p>
          {!clockIn && (
            <button onClick={() => setClockIn(new Date())}
              className='mt-2 text-xs text-white font-semibold px-3 py-1 rounded-full transition'
              style={{ background: 'linear-gradient(135deg,#059669,#34d399)' }}>
              Clock In
            </button>
          )}
        </div>
        <div className='pl-4 text-center'>
          <p className='text-lg font-bold text-red-500 font-mono'>{fmt(clockOut)}</p>
          <p className='text-xs text-gray-400 mt-0.5'>Out</p>
          {clockIn && !clockOut && (
            <button onClick={() => setClockOut(new Date())}
              className='mt-2 text-xs text-white font-semibold px-3 py-1 rounded-full transition'
              style={{ background: 'linear-gradient(135deg,#dc2626,#f87171)' }}>
              Clock Out
            </button>
          )}
        </div>
      </div>
      <div className='px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between'>
        <span className='text-xs text-gray-500'>
          {t('Working time', 'Working time')}: <span className='font-semibold text-gray-700'>{workingStr}</span>
        </span>
        <button onClick={() => { setClockIn(null); setClockOut(null) }}
          className='text-xs text-red-600 hover:text-red-800 font-medium transition'>
          {t('Reset', 'Reset')}
        </button>
      </div>
    </div>
  )
}

/* ── Leave Balance widget ──────────────────────────────────────────────────── */
function LeaveBalanceWidget({ leaves, leaveTypes, userId, t }) {
  const approvedByType = {}
  leaves
    .filter(l => l.userId === userId && l.status === 'Approved')
    .forEach(l => {
      approvedByType[l.type] = (approvedByType[l.type] || 0) + 1
    })

  return (
    <div className='bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden'>
      <div className='flex items-center gap-2 px-4 py-3 border-b border-gray-100 text-gray-700 font-semibold text-sm'>
        <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
          <rect x='2' y='3' width='20' height='14' rx='2' ry='2'/><line x1='8' y1='21' x2='16' y2='21'/><line x1='12' y1='17' x2='12' y2='21'/>
        </svg>
        {t('Leave Balance', 'Leave Balance')}
      </div>
      <div className='divide-y divide-gray-50'>
        {leaveTypes.filter(lt => lt.active).map(lt => {
          const used  = approvedByType[lt.name] || 0
          const quota = lt.maxDays
          const pct   = Math.min(100, Math.round((used / quota) * 100))
          const expiry = new Date(new Date().getFullYear() + 1, 3, 5)
          return (
            <div key={lt.id} className='px-4 py-3'>
              <p className='text-xs font-semibold text-gray-700 mb-1'>{lt.name}</p>
              <div className='flex items-center justify-between mb-1.5'>
                <span className='text-xs text-gray-500'>
                  <span className='font-bold text-gray-800'>{used}</span> of {quota} {t('days', 'days')}
                </span>
                <span className='text-xs text-gray-400'>{pct}%</span>
              </div>
              <div className='w-full h-1.5 bg-gray-100 rounded-full overflow-hidden'>
                <div className='h-full rounded-full transition-all'
                  style={{ width: `${pct}%`, background: pct > 80 ? '#dc2626' : 'linear-gradient(90deg,#8B1A1A,#D7252B)' }} />
              </div>
              <p className='text-[10px] text-gray-400 mt-1'>
                {t('Expired on', 'Expired on')} {expiry.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Task items ─────────────────────────────────────────────────────────────── */
function TaskItem({ icon, title, subtitle, badge, badgeColor, onClick }) {
  return (
    <button onClick={onClick}
      className='w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition text-left border-b border-gray-50 last:border-0'>
      <div className='w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-red-50 text-red-500'>
        {typeof icon === 'string' ? <Icon e={icon} size={18} /> : icon}
      </div>
      <div className='flex-1 min-w-0'>
        <p className='text-sm font-semibold text-gray-800 leading-snug'>{title}</p>
        {subtitle && <p className='text-xs text-gray-400 mt-0.5'>{subtitle}</p>}
      </div>
      {badge && (
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${badgeColor || 'bg-yellow-100 text-yellow-700'}`}>
          {badge}
        </span>
      )}
      <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='#d1d5db' strokeWidth='2'>
        <polyline points='9 18 15 12 9 6'/>
      </svg>
    </button>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const t = useT()
  const router = useRouter()
  const { currentUser } = useAuthStore()
  const { leaves, leaveTypes } = useLeaveStore()
  const { employees } = useEmployeeStore()
  const { onboardings } = useOnboardingStore()
  const hayStore = useHayStore()
  const pipStore = usePipStore()
  const { pas } = usePersonnelActionStore()
  const { items: offChecklist } = useOffboardingChecklistStore()
  const { sends: offNotifySends } = useOffboardingNotifyStore()

  const [editMode, setEditMode] = useState(false)
  const [mainTab, setMainTab] = useState('todo')
  const [taskTab, setTaskTab] = useState('mytask')

  const role = currentUser?.role || 'employee'
  const uid  = currentUser?.id
  const name = currentUser?.name || ''

  /* ── shortcuts ─────────────────────────────────────────────────────────── */
  const defaultShortcuts = ALL_SHORTCUTS[role] || ALL_SHORTCUTS.employee
  const [hiddenIds, setHiddenIds] = useState([])
  const visibleShortcuts = defaultShortcuts.filter(s => !hiddenIds.includes(s.id))

  /* ── pending tasks ──────────────────────────────────────────────────────── */
  const tasks = []

  // Leave pending approval (manager/hr/superadmin)
  if (role === 'manager' || role === 'hr' || role === 'superadmin') {
    const pendingLeaves = leaves.filter(l => {
      const ps = (l.steps || []).find(s => s.status === 'Pending')
      if (!ps) return false
      if (ps.delegatedTo === uid) return true
      const rid = l.userId
      const getDir = (id) => employees.find(e => e.id === id)?.managerId
      const getInd = (id) => getDir(getDir(id))
      if (ps.type === 'supervisor')   return getDir(rid) === uid
      if (ps.type === 'indirect_sup') return getInd(rid) === uid
      return role === 'hr' || role === 'superadmin'
    })
    pendingLeaves.forEach(l => tasks.push({
      id: `leave-${l.id}`, icon: '📅',
      title: t(`Persetujuan cuti: ${l.name}`, `Leave approval: ${l.name}`),
      subtitle: `${l.type} · ${l.start} → ${l.end}`,
      badge: t('Pending', 'Pending'),
      href: '/hr/leave',
    }))
  }

  // Onboarding pending approval — only for the user who can act on the current step
  if (role === 'hr' || role === 'superadmin' || role === 'manager') {
    const getDir = (id) => employees.find(e => e.id === id)?.managerId
    const getInd = (id) => getDir(getDir(id))
    // Mirrors canActOnStep() in /mss/approve-onboarding so the dashboard only
    // surfaces onboardings this user can actually approve/reject.
    const canActOnboarding = (step, ob) => {
      const rid = ob.employeeId
      switch (step.type) {
        case 'supervisor':        return getDir(rid) === uid
        case 'indirect_sup':      return getInd(rid) === uid
        case 'supervisor_pc53':
        case 'indirect_sup_pc53': return role === 'manager' || role === 'superadmin'
        case 'role':              return (step.roles ?? []).includes(role) || role === 'superadmin'
        case 'userlist':
        case 'employee':          return role === 'hr' || role === 'superadmin'
        default:                  return role === 'superadmin'
      }
    }
    onboardings.filter(o => {
      const ps = (o.steps || []).find(s => s.status === 'Pending')
      return ps && canActOnboarding(ps, o)
    }).forEach(o => tasks.push({
      id: `ob-${o.id}`, icon: '🎯',
      title: t(`Onboarding: ${o.employeeName}`, `Onboarding: ${o.employeeName}`),
      subtitle: o.department || '',
      badge: t('Pending', 'Pending'),
      href: '/mss/approve-onboarding',
    }))
  }

  // HAY sessions that need manager to fill
  if (role === 'manager' || role === 'superadmin') {
    hayStore.getByManager(uid).filter(h => h.status === 'Pending Manager').forEach(h => tasks.push({
      id: `hay-mgr-${h.id}`, icon: '🤝',
      title: t(`HAY: Isi jawaban untuk ${h.employeeName}`, `HAY: Fill answers for ${h.employeeName}`),
      subtitle: `T-G-R-O-W · ${h.date}`,
      badge: t('Perlu Diisi', 'Fill Now'),
      badgeColor: 'bg-blue-100 text-blue-700',
      href: '/mss/check-in',
    }))
  }

  // HAY sessions employee needs to fill (manager-created)
  hayStore.getByEmployee(uid).filter(h => h.status === 'Pending Employee').forEach(h => tasks.push({
    id: `hay-emp-${h.id}`, icon: '🤝',
    title: t(`HAY: Isi jawaban dari ${h.managerName}`, `HAY: Fill answers from ${h.managerName}`),
    subtitle: `T-G-R-O-W · ${h.date}`,
    badge: t('Perlu Diisi', 'Fill Now'),
    badgeColor: 'bg-blue-100 text-blue-700',
    href: '/ess/check-in',
  }))

  // PIP pending employee acknowledgement
  pipStore.getByEmployee(uid).filter(p => p.status === 'Pending Acknowledgement').forEach(p => tasks.push({
    id: `pip-${p.id}`, icon: '📋',
    title: t(`PIP menunggu Anda terima & ketahui`, `PIP awaiting your acknowledgement`),
    subtitle: `${p.managerName} · ${p.startDate}`,
    badge: t('Pending', 'Pending'),
    href: '/ess/check-in',
  }))

  // PIP pending HR review (HR / superadmin)
  if (role === 'hr' || role === 'superadmin') {
    pipStore.sessions.filter(p => p.status === 'Pending HR Review').forEach(p => tasks.push({
      id: `pip-hr-${p.id}`, icon: '🛡️',
      title: t(`Review PIP: ${p.employeeName}`, `Review PIP: ${p.employeeName}`),
      subtitle: `${p.managerName} · ${p.startDate}`,
      badge: t('Review', 'Review'),
      href: '/hr/performance/pip',
    }))
  }

  // Offboarding — resignation approvals (HR), supervisor handover tasks, and
  // department notifications. Actionable items → My Task; decided requests I
  // submitted → FYI.
  const offItems = offboardingActionItems({
    currentUser, employees, pas,
    checklistItems: offChecklist, notifySends: offNotifySends,
  })
  const OFF_BADGE = {
    'hr-approval':      { badge: t('Approval', 'Approval'), color: 'bg-yellow-100 text-yellow-700' },
    'atasan-checklist': { badge: t('To Do', 'To Do'),       color: 'bg-red-100 text-red-700' },
    'hr-notify':        { badge: t('Notify', 'Notify'),     color: 'bg-blue-100 text-blue-700' },
  }
  offItems.filter(it => it.kind !== 'result').forEach(it => {
    const b = OFF_BADGE[it.kind] || OFF_BADGE['atasan-checklist']
    tasks.push({
      id: it.id, icon: it.icon,
      title: t(it.id_text, it.en_text),
      subtitle: t(it.id_sub, it.en_sub),
      badge: b.badge, badgeColor: b.color,
      href: it.href,
    })
  })

  // FYI items
  const fyiItems = []
  offItems.filter(it => it.kind === 'result').forEach(it => {
    fyiItems.push({
      id: it.id, icon: it.icon,
      title: t(it.id_text, it.en_text),
      subtitle: t(it.id_sub, it.en_sub),
      badge: it.icon === '❌' ? t('Ditolak', 'Rejected') : t('Disetujui', 'Approved'),
      badgeColor: it.icon === '❌' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700',
      href: it.href,
    })
  })
  leaves.filter(l => l.userId === uid && (l.status === 'Approved' || l.status === 'Rejected')).slice(0, 3).forEach(l => {
    fyiItems.push({
      id: `leave-fyi-${l.id}`, icon: l.status === 'Approved' ? '✅' : '❌',
      title: l.status === 'Approved'
        ? t(`Cuti "${l.type}" Anda disetujui`, `Your "${l.type}" leave was approved`)
        : t(`Cuti "${l.type}" Anda ditolak`, `Your "${l.type}" leave was rejected`),
      subtitle: `${l.start} → ${l.end}`,
      badge: l.status === 'Approved' ? t('Disetujui', 'Approved') : t('Ditolak', 'Rejected'),
      badgeColor: l.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700',
      href: '/ess/leave',
    })
  })

  // My Team tab
  const myTeam = employees.filter(e => e.managerId === uid && e.status === 'Active')

  const displayItems = taskTab === 'mytask' ? tasks : fyiItems

  return (
    <div className='flex gap-6'>

      {/* ── Main column ────────────────────────────────────────────────── */}
      <div className='flex-1 min-w-0 space-y-5'>

        {/* Greeting */}
        <div>
          <h1 className='text-2xl font-bold text-red-800'>
            {getGreeting(t)},
          </h1>
          <p className='text-xl font-semibold text-gray-800 mt-0.5'>{name}</p>
          <p className='text-sm text-gray-400 mt-0.5'>
            {new Date().toLocaleDateString('id-ID', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
          </p>
        </div>

        {/* Menu shortcuts */}
        <div className='bg-white rounded-2xl shadow-sm ring-1 ring-gray-100'>
          <div className='flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100'>
            <div className='flex items-center gap-2 text-sm font-bold text-gray-700'>
              <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                <rect x='3' y='3' width='7' height='7' rx='1'/><rect x='14' y='3' width='7' height='7' rx='1'/>
                <rect x='3' y='14' width='7' height='7' rx='1'/><rect x='14' y='14' width='7' height='7' rx='1'/>
              </svg>
              Menu
            </div>
            <button
              onClick={() => setEditMode(e => !e)}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition ${editMode ? 'bg-red-100 text-red-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}>
              <svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                <path d='M12 20h9'/><path d='M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z'/>
              </svg>
              {editMode ? t('Selesai', 'Done') : t('Edit', 'Edit')}
            </button>
          </div>

          <div className='px-5 py-4'>
            <div className='grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3'>
              {(editMode ? defaultShortcuts : visibleShortcuts).map(s => {
                const hidden = hiddenIds.includes(s.id)
                return (
                  <div key={s.id} className='relative'>
                    <button
                      onClick={() => !editMode && router.push(s.href)}
                      className={`w-full flex flex-col items-center gap-2 p-2 rounded-xl transition group ${
                        editMode ? 'cursor-default' : 'hover:bg-red-50'
                      } ${hidden ? 'opacity-40' : ''}`}>
                      <div className='w-12 h-12 rounded-2xl flex items-center justify-center bg-gray-100 text-gray-500 ring-1 ring-gray-200/60 group-hover:bg-red-600 group-hover:text-white group-hover:ring-red-600 transition-colors'>
                        {SICONS[s.icon]}
                      </div>
                      <span className='text-[11px] text-center text-gray-600 leading-tight group-hover:text-red-800 transition-colors'>{s.label}</span>
                    </button>
                    {editMode && (
                      <button
                        onClick={() => setHiddenIds(ids => hidden ? ids.filter(id => id !== s.id) : [...ids, s.id])}
                        className='absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow transition'
                        style={{ background: hidden ? '#059669' : '#dc2626' }}>
                        {hidden ? '+' : '−'}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
            {editMode && (
              <p className='text-xs text-gray-400 mt-3 text-center'>
                {t('Klik − untuk sembunyikan, + untuk tampilkan kembali', 'Click − to hide, + to show again')}
              </p>
            )}
          </div>
        </div>

        {/* Things To Do */}
        <div className='bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden'>
          {/* Main tabs */}
          <div className='flex border-b border-gray-100'>
            {[
              ['todo', t('Things To Do', 'Things To Do')],
            ].map(([key, label]) => (
              <button key={key} onClick={() => setMainTab(key)}
                className={`px-5 py-3.5 text-sm font-semibold transition relative ${
                  mainTab === key ? 'text-red-800' : 'text-gray-500 hover:text-gray-700'
                }`}>
                {label}
                {mainTab === key && (
                  <span className='absolute bottom-0 left-4 right-4 h-0.5 rounded-full' style={{ background: 'linear-gradient(90deg,#8B1A1A,#D7252B)' }} />
                )}
              </button>
            ))}
          </div>

          {/* Things To Do content */}
          {mainTab === 'todo' && (
            <>
              {/* Sub-tabs */}
              <div className='flex gap-2 px-5 pt-3 pb-2'>
                {[
                  ['mytask', t('My Task', 'My Task'), tasks.length],
                  ['fyi',    'FYI',                   fyiItems.length],
                ].map(([key, label, count]) => (
                  <button key={key} onClick={() => setTaskTab(key)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
                      taskTab === key
                        ? 'text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    style={taskTab === key ? { background: 'linear-gradient(135deg,#8B1A1A,#D7252B)' } : {}}>
                    {label}{count > 0 ? ` (${count})` : ''}
                  </button>
                ))}
              </div>

              {displayItems.length === 0 ? (
                <div className='flex flex-col items-center justify-center py-16 text-gray-400 gap-3'>
                  <svg width='80' height='80' viewBox='0 0 80 80' fill='none' xmlns='http://www.w3.org/2000/svg'>
                    <rect x='10' y='14' width='60' height='52' rx='4' fill='#f3f4f6'/>
                    <rect x='18' y='28' width='44' height='4' rx='2' fill='#e5e7eb'/>
                    <rect x='18' y='38' width='32' height='4' rx='2' fill='#e5e7eb'/>
                    <rect x='18' y='48' width='38' height='4' rx='2' fill='#e5e7eb'/>
                    <circle cx='56' cy='52' r='16' fill='#eff6ff'/>
                    <circle cx='56' cy='52' r='10' fill='none' stroke='#93c5fd' strokeWidth='3'/>
                    <line x1='63' y1='59' x2='68' y2='64' stroke='#93c5fd' strokeWidth='3' strokeLinecap='round'/>
                  </svg>
                  <p className='text-sm font-medium'>
                    {taskTab === 'mytask'
                      ? t('There are no tasks waiting for your action', 'There are no tasks waiting for your action')
                      : t('Tidak ada informasi terbaru', 'No recent information')}
                  </p>
                </div>
              ) : (
                <div className='divide-y divide-gray-50'>
                  {displayItems.map(item => (
                    <TaskItem key={item.id}
                      icon={item.icon}
                      title={item.title}
                      subtitle={item.subtitle}
                      badge={item.badge}
                      badgeColor={item.badgeColor}
                      onClick={() => item.href && router.push(item.href)}
                    />
                  ))}
                </div>
              )}
            </>
          )}

        </div>
      </div>

      {/* ── Right column ───────────────────────────────────────────────── */}
      <div className='w-72 shrink-0 space-y-4'>
        <TimeCardWidget t={t} />
        <LeaveBalanceWidget
          leaves={leaves}
          leaveTypes={leaveTypes}
          userId={uid}
          t={t}
        />
      </div>

    </div>
  )
}
