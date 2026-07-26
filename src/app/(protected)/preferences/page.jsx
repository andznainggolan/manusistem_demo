'use client'
import Icon from '@/components/ui/Icon'
import { useAuthStore } from '@/store/authStore'
import { useHomePreferencesStore } from '@/store/homePreferencesStore'
import { ALL_SHORTCUTS, SICONS } from '@/lib/dashboardShortcuts'
import { useT } from '@/store/languageStore'
import { PageHeader, SectionCard } from '@/components/ui'

function Toggle({ checked, onChange, label, hint, order, onOrderChange, t }) {
  return (
    <div className='flex items-center justify-between gap-4 py-3'>
      <label className='flex-1 min-w-0 cursor-pointer'>
        <span className='block text-sm font-semibold text-gray-800'>{label}</span>
        {hint && <span className='block text-xs text-gray-400 mt-0.5'>{hint}</span>}
      </label>
      {order != null && (
        <label className='flex items-center gap-1.5 text-xs text-gray-500 flex-shrink-0'>
          {t('Urutan','Order')}
          <input
            type='number' min={1} value={order}
            onChange={(e) => onOrderChange(Number(e.target.value) || 1)}
            className='w-14 rounded-lg border border-gray-200 px-2 py-1 text-sm text-gray-800 text-center outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100'
          />
        </label>
      )}
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
    </div>
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
  const setOrder = (key, val) => updatePrefs(uid, { order: { ...prefs.order, [key]: val } })
  const setWidgetOrder = (key, val) => updatePrefs(uid, { widgetOrder: { ...prefs.widgetOrder, [key]: val } })

  return (
    <div className='max-w-2xl mx-auto pb-10'>
      <PageHeader
        icon='⚙️'
        title={t('Preferensi Beranda', 'Homepage Preferences')}
        subtitle={t('Atur bagian apa saja yang tampil di halaman Beranda kamu.', 'Choose which sections show on your Home page.')}
      />

      <SectionCard title={t('Tampilkan di Beranda', 'Show on Homepage')}
        subtitle={t('Urutan: angka terkecil tampil paling atas.', 'Order: the smallest number shows up top.')}
        className='mb-5' bodyClass='divide-y divide-gray-100'>
        <Toggle t={t}
          label={t('Menu Shortcut', 'Menu Shortcuts')}
          hint={t('Grid ikon akses cepat ke halaman yang sering dipakai.', 'Quick-access icon grid to frequently used pages.')}
          checked={prefs.showMenuShortcuts}
          onChange={(v) => updatePrefs(uid, { showMenuShortcuts: v })}
          order={prefs.order.menuShortcuts}
          onOrderChange={(v) => setOrder('menuShortcuts', v)}
        />
        <Toggle t={t}
          label={t('Things To Do', 'Things To Do')}
          hint={t('Daftar tugas dan informasi yang menunggu tindakanmu.', 'Tasks and FYI items waiting on you.')}
          checked={prefs.showThingsToDo}
          onChange={(v) => updatePrefs(uid, { showThingsToDo: v })}
          order={prefs.order.thingsToDo}
          onOrderChange={(v) => setOrder('thingsToDo', v)}
        />
        <Toggle t={t}
          label={t('Dashboard Widget', 'Dashboard Widgets')}
          hint={t('Panel di sisi kanan (Time Card, Leave Balance, dll).', 'Right-side panel (Time Card, Leave Balance, etc).')}
          checked={prefs.showDashboardWidgets}
          onChange={(v) => updatePrefs(uid, { showDashboardWidgets: v })}
          order={prefs.order.dashboardWidgets}
          onOrderChange={(v) => setOrder('dashboardWidgets', v)}
        />
      </SectionCard>

      {prefs.showDashboardWidgets && (
        <SectionCard title={t('Widget Dashboard', 'Dashboard Widgets')}
          subtitle={t('Urutan tampil di panel kanan.', 'Order within the right-side panel.')}
          className='mb-5' bodyClass='divide-y divide-gray-100'>
          <Toggle t={t}
            label='My Time Card'
            checked={prefs.widgets.timeCard}
            onChange={(v) => setWidget('timeCard', v)}
            order={prefs.widgetOrder.timeCard}
            onOrderChange={(v) => setWidgetOrder('timeCard', v)}
          />
          <Toggle t={t}
            label='Leave Balance'
            checked={prefs.widgets.leaveBalance}
            onChange={(v) => setWidget('leaveBalance', v)}
            order={prefs.widgetOrder.leaveBalance}
            onOrderChange={(v) => setWidgetOrder('leaveBalance', v)}
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
