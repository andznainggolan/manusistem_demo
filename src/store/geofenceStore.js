import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { dbStorage } from '@/lib/dbStorage'
import { IS_SCHOOL } from '@/lib/demoProfile'

// Geofencing for online clock in/out. Off by default: clocking works from
// anywhere, exactly as before.
export const DEFAULT_GEOFENCE = {
  enabled: false,
  mode: 'block',           // 'record' = save the location only; 'block' = refuse clock in/out outside every radius
  defaultRadius: 100,      // metres, prefilled when adding a work location
  maxAccuracyMeters: 100,  // in 'block' mode a GPS fix worse than this is refused (retry outdoors / near a window)
}

// Placeholder coordinates: replace with the real address in the settings page.
const SEED_LOCATIONS = IS_SCHOOL
  ? [{ id: 'loc-lscs', name: 'Kampus LSCS (koordinat contoh)', lat: -6.1683, lng: 106.7589, radius: 100 }]
  : [{ id: 'loc-hq', name: 'Kantor Pusat (koordinat contoh)', lat: -6.1754, lng: 106.8272, radius: 100 }]

let _n = 0
export const useGeofenceStore = create(persist(
  (set) => ({
    settings: { ...DEFAULT_GEOFENCE },
    locations: SEED_LOCATIONS,

    updateSettings: (patch) => set(s => ({ settings: { ...s.settings, ...patch } })),
    addLocation: (loc) => set(s => ({ locations: [...s.locations, { id: `loc-${Date.now()}-${_n++}`, ...loc }] })),
    updateLocation: (id, patch) => set(s => ({ locations: s.locations.map(l => l.id === id ? { ...l, ...patch } : l) })),
    removeLocation: (id) => set(s => ({ locations: s.locations.filter(l => l.id !== id) })),
    reset: () => set({ settings: { ...DEFAULT_GEOFENCE }, locations: SEED_LOCATIONS }),
  }),
  { name: 'hcm-geofence-v1', storage: createJSONStorage(() => dbStorage) }
))
