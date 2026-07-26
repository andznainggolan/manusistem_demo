'use client'
import Icon from '@/components/ui/Icon'
import { useAuthStore } from '@/store/authStore'
import { useHomePreferencesStore } from '@/store/homePreferencesStore'
import { ALL_SHORTCUTS, SICONS } from '@/lib/dashboardShortcuts'
import { useT } from '@/store/languageStore'
import { PageHeader, SectionCard } from '@/components/ui'

function Toggle({ checked, onChange, label, hint }) {
  return (
    <label className='flex items-center justify-between gap-4 py-3 cursor-pointer'>
      <span>
        <span className='block text-sm font-semibold text-gray-800'>{label}</span>
        {hint && <span className='block text-xs text-gray-400 mt-0.5'>{hint}</span>}
      </span>
      <button
        type='button'
        role='switch'
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className='relative flex-shrink-0 w-11 h-6 rounded-full transition-colors'
        style={{ background: checked ? '#8B1A1A' : '#d1d5db' }}>
        <span
          className='absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform'
          style={{ transform: checked ? 'translateX(20px)' : 'translateX(0)' }}
        />
      </button>
    </label>
  )
}

export default function PreferencesPage() {
  const t = useT()
  const { currentUser } = useAuthStore()
  const { getPrefs, updatePrefs, toggleShortcut } = useHomePreferencesStore()

  const uid = currentUser?.id
  const role = currentUser?.role || 'employee'
  const prefs = getPrefs(uid)
  const shortcuts = ALL_SHORTCUTS[role] || ALL_SHORTCUTS.employee

  const setWidget = (key, val) => updatePrefs(uid, { widgets: { ...prefs.widgets, [key]: val } })

  return (
    <div className='max-w-2xl mx-auto pb-10'>
      <PageHeader
        icon='⚙️'
        title={t('Preferensi Beranda', 'Homepage Preferences')}
        subtitle={t('Atur bagian apa saja yang tampil di halaman Beranda kamu.', 'Choose which sections show on your Home page.')}
      />

      <SectionCard title={t('Tampilkan di Beranda', 'Show on Homepage')} className='mb-5' bodyClass='divide-y divide-gray-100'>
        <Toggle
          label={t('Menu Shortcut', 'Menu Shortcuts')}
          hint={t('Grid ikon akses cepat ke halaman yang sering dipakai.', 'Quick-access icon grid to frequently used pages.')}
          checked={prefs.showMenuShortcuts}
          onChange={(v) => updatePrefs(uid, { showMenuShortcuts: v })}
        />
        <Toggle
          label={t('Things To Do', 'Things To Do')}
          hint={t('Daftar tugas dan informasi yang menunggu tindakanmu.', 'Tasks and FYI items waiting on you.')}
          checked={prefs.showThingsToDo}
          onChange={(v) => updatePrefs(uid, { showThingsToDo: v })}
        />
        <Toggle
          label={t('Dashboard Widget', 'Dashboard Widgets')}
          hint={t('Panel di sisi kanan (Time Card, Leave Balance, dll).', 'Right-side panel (Time Card, Leave Balance, etc).')}
          checked={prefs.showDashboardWidgets}
          onChange={(v) => updatePrefs(uid, { showDashboardWidgets: v })}
        />
      </SectionCard>

      {prefs.showDashboardWidgets && (
        <SectionCard title={t('Widget Dashboard', 'Dashboard Widgets')} className='mb-5' bodyClass='divide-y divide-gray-100'>
          <Toggle
            label='My Time Card'
            checked={prefs.widgets.timeCard}
            onChange={(v) => setWidget('timeCard', v)}
          />
          <Toggle
            label='Leave Balance'
            checked={prefs.widgets.leaveBalance}
            onChange={(v) => setWidget('leaveBalance', v)}
          />
        </SectionCard>
      )}

      {prefs.showMenuShortcuts && (
        <SectionCard title={t('Pilih Menu Shortcut', 'Choose Menu Shortcuts')}
          subtitle={t('Sembunyikan shortcut yang jarang kamu pakai.', 'Hide shortcuts you rarely use.')}
          bodyClass='divide-y divide-gray-100'>
          {shortcuts.map(s => {
            const visible = !prefs.hiddenShortcutIds.includes(s.id)
            return (
              <div key={s.id} className='flex items-center justify-between gap-4 py-3'>
                <span className='flex items-center gap-3'>
                  <span className='w-9 h-9 rounded-xl flex items-center justify-center bg-gray-100 text-gray-500'>
                    {SICONS[s.icon]}
                  </span>
                  <span className='text-sm font-semibold text-gray-800'>{s.label}</span>
                </span>
                <button
                  type='button'
                  role='switch'
                  aria-checked={visible}
                  onClick={() => toggleShortcut(uid, s.id)}
                  className='relative flex-shrink-0 w-11 h-6 rounded-full transition-colors'
                  style={{ background: visible ? '#8B1A1A' : '#d1d5db' }}>
                  <span
                    className='absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform'
                    style={{ transform: visible ? 'translateX(20px)' : 'translateX(0)' }}
                  />
                </button>
              </div>
            )
          })}
        </SectionCard>
      )}
    </div>
  )
}
