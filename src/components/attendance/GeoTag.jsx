import { geoLabel } from '@/lib/geofence'

/** Where a clock in/out happened, only when geofencing recorded one. */
export default function GeoTag({ geo }) {
  if (!geo) return null
  const ok = geo.inside && !geo.error
  return (
    <span className={`mt-0.5 block font-sans text-[10px] font-medium ${ok ? 'text-emerald-600' : 'text-amber-600'}`}>
      📍 {geoLabel(geo)}
    </span>
  )
}
