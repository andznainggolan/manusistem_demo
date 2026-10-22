'use client'
import { IS_SCHOOL } from '@/lib/demoProfile'
import { useJlaStore } from '@/store/jlaStore'

// Guru / Employee tag shown next to the employment type. Renders nothing
// outside the school profile.
export default function WorkerCategoryBadge({ employeeId, onDark = false }) {
  const category = useJlaStore(s => s.categories[employeeId])
  if (!IS_SCHOOL || !category) return null
  const guru = category === 'Guru'
  const cls = onDark
    ? 'bg-white/20 text-white'
    : guru ? 'border border-teal-200 bg-teal-50 text-teal-700' : 'border border-gray-200 bg-gray-50 text-gray-600'
  return <span className={`ml-1.5 inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold ${cls}`}>{category}</span>
}
