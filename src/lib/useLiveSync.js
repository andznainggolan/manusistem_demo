'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { dbStorage } from '@/lib/dbStorage'

/**
 * Keeps a page's persisted stores in step with the database while the page stays open.
 * `primary` ({ store, name }) is checked every `intervalMs`; `others` are re-read on load, on
 * returning to the tab, on demand, and whenever the primary changed. Pending local edits are
 * written first so they are never replaced by an older copy.
 */
export function useLiveSync(primary, others = [], intervalMs = 20000) {
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState(null)
  const seen = useRef({})
  const cfg = useRef({ primary, others })
  cfg.current = { primary, others }

  const pull = async ({ store, name }) => {
    await dbStorage.flushNow(name)
    const value = await dbStorage.refreshKey(name)
    if (value == null) return false
    const changed = seen.current[name] !== value
    seen.current[name] = value
    if (changed) await store.persist.rehydrate()
    return changed
  }

  const sync = useCallback(async ({ full = true } = {}) => {
    setSyncing(true)
    try {
      const { primary: p, others: o } = cfg.current
      const changed = await pull(p)
      if (full || changed) for (const x of o) await pull(x)
      setLastSync(new Date())
    } finally { setSyncing(false) }
  }, [])

  useEffect(() => {
    sync({ full: true })
    const tick = setInterval(() => { if (document.visibilityState === 'visible') sync({ full: false }) }, intervalMs)
    const back = () => { if (document.visibilityState === 'visible') sync({ full: true }) }
    document.addEventListener('visibilitychange', back)
    window.addEventListener('focus', back)
    return () => { clearInterval(tick); document.removeEventListener('visibilitychange', back); window.removeEventListener('focus', back) }
  }, [sync, intervalMs])

  return { sync, syncing, lastSync }
}
