// Database-backed storage for zustand `persist`, so a store's state syncs across
// devices. It reads/writes the AppState table via /api/state/<key>, and always
// mirrors to localStorage so the app keeps working offline or when no database
// is configured (the API answers 503 → we fall back to the local copy).
//
// Usage in a store:
//   import { createJSONStorage } from 'zustand/middleware'
//   import { dbStorage } from '@/lib/dbStorage'
//   persist(fn, { name: 'my-store', storage: createJSONStorage(() => dbStorage) })

const local = {
  get: (k) => { try { return localStorage.getItem(k) } catch { return null } },
  set: (k, v) => { try { localStorage.setItem(k, v) } catch {} },
  del: (k) => { try { localStorage.removeItem(k) } catch {} },
}

// Prime every store from ONE request on load (instead of one fetch per store).
// `primeMap` is a { key: value } snapshot of the whole AppState table; null when
// the database is unreachable, so callers fall back to localStorage.
let primePromise = null
function prime() {
  if (primePromise) return primePromise
  primePromise = fetch('/api/state')
    .then(r => (r.ok ? r.json() : null))
    .catch(() => null)
  return primePromise
}

// Debounce writes per key so rapid state changes collapse into one request.
const timers = {}
const pending = {}
function flush(key) {
  if (!(key in pending)) return
  const value = pending[key]
  delete pending[key]
  fetch(`/api/state/${encodeURIComponent(key)}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ value }),
    keepalive: true,   // allow the write to finish even if the page is unloading
  }).catch(() => {})
}

// Flush every pending (debounced) write immediately — used on page unload so a
// refresh/navigation can't drop a change and then reload a stale DB copy.
function flushAll() {
  for (const key of Object.keys(pending)) { clearTimeout(timers[key]); flush(key) }
}
if (typeof window !== 'undefined' && !window.__kpbDbStorageUnload) {
  window.__kpbDbStorageUnload = true
  window.addEventListener('pagehide', flushAll)
  window.addEventListener('beforeunload', flushAll)
  // Flush when the tab is hidden too (mobile Safari may never fire pagehide).
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushAll() })
}

export const dbStorage = {
  getItem: async (name) => {
    // Prefer the database (shared across devices); fall back to localStorage.
    const map = await prime()
    if (map) {
      if (map[name] != null) { local.set(name, map[name]); return map[name] }
      // DB reachable but empty for this key → keep the local copy; the next
      // change persists it (and thus reaches other devices).
      return local.get(name)
    }
    return local.get(name)
  },

  setItem: (name, value) => {
    local.set(name, value)
    pending[name] = value
    clearTimeout(timers[name])
    timers[name] = setTimeout(() => flush(name), 400)
  },

  removeItem: (name) => {
    local.del(name)
    clearTimeout(timers[name])
    fetch(`/api/state/${encodeURIComponent(name)}`, { method: 'DELETE' }).catch(() => {})
  },
}
