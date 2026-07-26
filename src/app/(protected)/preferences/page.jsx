'use client'
import Icon from '@/components/ui/Icon'
import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useHomePreferencesStore } from '@/store/homePreferencesStore'
import { dbStorage } from '@/lib/dbStorage'
import { ALL_SHORTCUTS, SICONS } from '@/lib/dashboardShortcuts'
import { useT } from '@/store/languageStore'
import { PageHeader, SectionCard, ActionButton } from '@/components/ui'

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
  const { getPrefs, updatePrefs } = useHomePreferencesStore()

  const uid = currentUser?.id
  const role = currentUser?.role || 'employee'
  const shortcuts = ALL_SHORTCUTS[role] || ALL_SHORTCUTS.employee

  // Each role gets one graphic dashboard widget — keyed to match ROLE_CHART
  // in dashboard/page.jsx, so this is the only toggle/order control for it.
  const ROLE_CHART_META = {
    employee:   { key: 'employeeChart',   label: t('Grafik Cuti Saya', 'My Leave Chart') },
    manager:    { key: 'managerChart',    label: t('Grafik Status Approval Tim', "Team's Leave Status Chart") },
    hr:         { key: 'hrChart',         label: t('Grafik Headcount per Departemen', 'Headcount by Department Chart') },
    superadmin: { key: 'superadminChart', label: t('Grafik Distribusi Role Pengguna', 'User Role Distribution Chart') },
  }
  const chartMeta = ROLE_CHART_META[role] || ROLE_CHART_META.employee

  // Buffered draft — nothing is written to the store until "Simpan" is
  // pressed. Initialized from the saved prefs, and re-synced once dbStorage
  // finishes hydrating (in case this page mounted before that completed).
  const [draft, setDraft] = useState(() => getPrefs(uid))
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const unsub = useHomePreferencesStore.persist.onFinishHydration(() => setDraft(getPrefs(uid)))
    if (useHomePreferencesStore.persist.hasHydrated()) setDraft(getPrefs(uid))
    return unsub
  }, [uid]) // eslint-disable-line react-hooks/exhaustive-deps

  const setWidget = (key, val) => setDraft(d => ({ ...d, widgets: { ...d.widgets, [key]: val } }))
  const setOrder = (key, val) => setDraft(d => ({ ...d, order: { ...d.order, [key]: val } }))
  const setWidgetOrder = (key, val) => setDraft(d => ({ ...d, widgetOrder: { ...d.widgetOrder, [key]: val } }))
  const toggleShortcutDraft = (id) => setDraft(d => ({
    ...d,
    hiddenShortcutIds: d.hiddenShortcutIds.includes(id)
      ? d.hiddenShortcutIds.filter(x => x !== id)
      : [...d.hiddenShortcutIds, id],
  }))

  const handleSave = async () => {
    updatePrefs(uid, draft)
    setSaving(true)
    // Skip the usual debounce and wait for the database write to land, so
    // "Tersimpan" (and any navigation right after) reflects the real state
    // instead of a stale copy the DB hasn't caught up to yet.
    await dbStorage.flushNow('hcm-home-preferences-v1')
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className='max-w-2xl mx-auto pb-10'>
      <PageHeader
        icon='⚙️'
        title={t('Preferensi Beranda', 'Homepage Preferences')}
        subtitle={t('Atur bagian apa saja yang tampil di halaman Beranda kamu.', 'Choose which sections show on your Home page.')}
        actions={
          <div className='flex items-center gap-3'>
            {saved && (
              <span className='text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg'>
                {t('Tersimpan.','Saved.')}
              </span>
            )}
            <ActionButton onClick={handleSave} disabled={saving} icon='💾'>
              {saving ? t('Menyimpan...','Saving...') : t('Simpan','Save')}
            </ActionButton>
          </div>
        }
      />

      <SectionCard title={t('Tampilkan di Beranda', 'Show on Homepage')}
        subtitle={t('Urutan: angka terkecil tampil paling atas.', 'Order: the smallest number shows up top.')}
        className='mb-5' bodyClass='divide-y divide-gray-100'>
        <Toggle t={t}
          label={t('Menu Shortcut', 'Menu Shortcuts')}
          hint={t('Grid ikon akses cepat ke halaman yang sering dipakai.', 'Quick-access icon grid to frequently used pages.')}
          checked={draft.showMenuShortcuts}
          onChange={(v) => setDraft(d => ({ ...d, showMenuShortcuts: v }))}
          order={draft.order.menuShortcuts}
          onOrderChange={(v) => setOrder('menuShortcuts', v)}
        />
        <Toggle t={t}
          label={t('Things To Do', 'Things To Do')}
          hint={t('Daftar tugas dan informasi yang menunggu tindakanmu.', 'Tasks and FYI items waiting on you.')}
          checked={draft.showThingsToDo}
          onChange={(v) => setDraft(d => ({ ...d, showThingsToDo: v }))}
          order={draft.order.thingsToDo}
          onOrderChange={(v) => setOrder('thingsToDo', v)}
        />
        <Toggle t={t}
          label={t('Dashboard Widget', 'Dashboard Widgets')}
          hint={t('Time Card, Leave Balance, dan grafik sesuai role kamu.', 'Time Card, Leave Balance, and your role\'s graphic widget.')}
          checked={draft.showDashboardWidgets}
          onChange={(v) => setDraft(d => ({ ...d, showDashboardWidgets: v }))}
          order={draft.order.dashboardWidgets}
          onOrderChange={(v) => setOrder('dashboardWidgets', v)}
        />
      </SectionCard>

      {draft.showDashboardWidgets && (
        <SectionCard title={t('Widget Dashboard', 'Dashboard Widgets')}
          subtitle={t('Urutan tampil di antara widget lainnya.', 'Order among the other widgets.')}
          className='mb-5' bodyClass='divide-y divide-gray-100'>
          <Toggle t={t}
            label='My Time Card'
            checked={draft.widgets.timeCard}
            onChange={(v) => setWidget('timeCard', v)}
            order={draft.widgetOrder.timeCard}
            onOrderChange={(v) => setWidgetOrder('timeCard', v)}
          />
          <Toggle t={t}
            label='Leave Balance'
            checked={draft.widgets.leaveBalance}
            onChange={(v) => setWidget('leaveBalance', v)}
            order={draft.widgetOrder.leaveBalance}
            onOrderChange={(v) => setWidgetOrder('leaveBalance', v)}
          />
          <Toggle t={t}
            label={chartMeta.label}
            hint={t('Widget grafik sesuai role kamu.', 'Graphic widget based on your role.')}
            checked={draft.widgets[chartMeta.key]}
            onChange={(v) => setWidget(chartMeta.key, v)}
            order={draft.widgetOrder[chartMeta.key]}
            onOrderChange={(v) => setWidgetOrder(chartMeta.key, v)}
          />
        </SectionCard>
      )}

      {draft.showMenuShortcuts && (
        <SectionCard title={t('Pilih Menu Shortcut', 'Choose Menu Shortcuts')}
          subtitle={t('Sembunyikan shortcut yang jarang kamu pakai.', 'Hide shortcuts you rarely use.')}
          bodyClass='divide-y divide-gray-100'>
          {shortcuts.map(s => {
            const visible = !draft.hiddenShortcutIds.includes(s.id)
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
                  onClick={() => toggleShortcutDraft(s.id)}
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

      <div className='flex justify-end mt-5'>
        <ActionButton onClick={handleSave} disabled={saving} icon='💾'>
          {saving ? t('Menyimpan...','Saving...') : t('Simpan','Save')}
        </ActionButton>
      </div>
    </div>
  )
}
