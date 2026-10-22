import { useGeofenceStore } from '@/store/geofenceStore'

const R_EARTH = 6371000

/** Great-circle distance in metres (haversine). */
export function distanceMeters(a, b) {
  const rad = (d) => (d * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R_EARTH * Math.asin(Math.min(1, Math.sqrt(h)))
}

/** Current GPS position as { lat, lng, accuracy }, or rejects with { message }. */
export function getPosition(timeout = 12000) {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject({ message: 'Perangkat atau browser ini tidak mendukung lokasi.' }); return
    }
    navigator.geolocation.getCurrentPosition(
      p => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: Math.round(p.coords.accuracy || 0) }),
      e => reject({
        message: e.code === 1 ? 'Izin lokasi ditolak. Izinkan akses lokasi di browser, lalu coba lagi.'
          : e.code === 3 ? 'Lokasi tidak ditemukan tepat waktu. Coba lagi.'
          : 'Lokasi tidak tersedia di perangkat ini.',
      }),
      { enableHighAccuracy: true, timeout, maximumAge: 0 },
    )
  })
}

/** Where a position sits relative to the configured work locations. */
export function locate(locations, pos) {
  if (!locations.length) return { inside: true, nearest: null, distance: null }
  let best = null
  locations.forEach(l => {
    const d = distanceMeters(pos, l)
    const over = d - l.radius // negative = inside this radius
    if (!best || over < best.over) best = { loc: l, distance: Math.round(d), over }
  })
  return { inside: best.over <= 0, nearest: best.loc, distance: best.distance }
}

/**
 * Gate for a clock in/out press. Returns { ok, geo, message }.
 * geo is saved on the attendance record (null when geofencing is off).
 */
export async function checkClockLocation() {
  const { settings, locations } = useGeofenceStore.getState()
  if (!settings.enabled) return { ok: true, geo: null }
  const block = settings.mode === 'block'

  let pos
  try { pos = await getPosition() } catch (e) {
    if (block) return { ok: false, geo: null, message: e.message }
    return { ok: true, geo: { error: e.message }, message: e.message, warn: true }
  }

  const r = locate(locations, pos)
  const geo = {
    lat: Number(pos.lat.toFixed(6)), lng: Number(pos.lng.toFixed(6)), accuracy: pos.accuracy,
    inside: r.inside, distance: r.distance, locationName: r.nearest?.name || '',
  }
  if (block && pos.accuracy > settings.maxAccuracyMeters) {
    return { ok: false, geo, message: `Akurasi GPS ±${pos.accuracy} m terlalu rendah (maksimum ${settings.maxAccuracyMeters} m). Coba lagi di dekat jendela atau di luar ruangan.` }
  }
  if (!r.inside) {
    const msg = `Kamu berada ${r.distance} m dari ${r.nearest.name} (radius ${r.nearest.radius} m).`
    return block ? { ok: false, geo, message: `${msg} Clock in/out hanya bisa di dalam radius.` }
      : { ok: true, geo, message: `${msg} Lokasi dicatat dan terlihat oleh atasan.`, warn: true }
  }
  return { ok: true, geo }
}

/** Short label for a saved geo result, or '' when nothing was recorded. */
export function geoLabel(geo) {
  if (!geo) return ''
  if (geo.error) return 'Lokasi tidak terbaca'
  return geo.inside ? `Di lokasi (${geo.distance} m)` : `Di luar radius (${geo.distance} m)`
}
