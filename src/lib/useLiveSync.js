'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { dbStorage } from '@/lib/dbStorage'

/**
 * Keeps a page's persisted stores in step with the database while the page stays open.
 * `primary` ({ store, name }) is checked on load, on returning to the tab and every `intervalMs`.
 * `others` (large data such as documents) are re-read only when the primary changed or on demand
 * (`sync({ full: true })`, the Muat Ulang button). Pending local edits are written first so they
 * are never replaced by an older copy.
 */
export function useLiveSync(primary, others = [], intervalMs = 20000) {
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState(null)
  const seen = useRef({})
  const cfg = useRef({ primary, others })
  cfg.current = { primary, others }

  const pull = async ({ store, name }) => {
    await dbStorage.flushNow(name)
    // What the store was hydrated from is the baseline, so the first check does not reload needlessly.
    // (Read before refreshKey, which refreshes the local copy too.)
    if (seen.current[name] === undefined) { try { seen.current[name] = localStorage.getItem(name) } catch { seen.current[name] = null } }
    const value = await dbStorage.refreshKey(name)
    if (value == null) return false
    const changed = seen.current[name] !== value
    seen.current[name] = value
    if (changed) await store.persist.rehydrate()
    return changed
  }

  const sync = useCallback(async ({ full = false } = {}) => {
    setSyncing(true)
    try {
      const { primary: p, others: o } = cfg.current
      const changed = await pull(p)
      if (full || changed) for (const x of o) await pull(x)
      setLastSync(new Date())
    } finally { setSyncing(false) }
  }, [])

  useEffect(() => {
    sync()
    const tick = setInterval(() => { if (document.visibilityState === 'visible') sync() }, intervalMs)
    const back = () => { if (document.visibilityState === 'visible') sync() }
    document.addEventListener('visibilitychange', back)
    window.addEventListener('focus', back)
    return () => { clearInterval(tick); document.removeEventListener('visibilitychange', back); window.removeEventListener('focus', back) }
  }, [sync, intervalMs])

  return { sync, syncing, lastSync }
}
