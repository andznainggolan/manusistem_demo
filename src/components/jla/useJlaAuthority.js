'use client'
import { useAuthStore } from '@/store/authStore'
import { useEmployeeStore } from '@/store/employeeStore'
import { useStructureStore } from '@/store/structureStore'

/**
 * Who may manage a teacher's JLA (assign tasks, edit the calendar, validate realisation,
 * import Excel): an administrator, or the teacher's supervisor — anyone above the teacher
 * in the reporting line (direct or indirect, e.g. a principal over a vice principal's
 * teachers). Managers never reach teachers outside their own reporting line. HR may import
 * Excel for everyone but otherwise only views.
 */
export function useJlaAuthority() {
  const { currentUser } = useAuthStore()
  const { employees } = useEmployeeStore()
  const { departments, positions } = useStructureStore()

  const viewer = employees.find(e => e.id === currentUser?.id)
  const viewerPosition = positions.find(p => p.id === viewer?.positionId)?.name || ''
  const buOf = (emp) => departments.find(d => d.id === emp.departmentId)?.businessUnitId
  const isAdmin = currentUser?.role === 'superadmin'
  const isHr = !!currentUser?.role?.startsWith('hr')
  const isPrincipal = viewerPosition.startsWith('Kepala Sekolah')

  // Walks up the manager chain (guarding against loops) looking for the current user.
  const isSubordinate = (emp) => {
    const seen = new Set()
    let m = emp?.managerId
    while (m != null && !seen.has(m)) {
      if (m === currentUser?.id) return true
      seen.add(m)
      m = employees.find(e => e.id === m)?.managerId
    }
    return false
  }
  const canManage = (emp) => !!emp && (isAdmin || isSubordinate(emp))
  const canImport = (emp) => !!emp && (isAdmin || isHr || isSubordinate(emp))
  return { currentUser, viewer, buOf, isAdmin, isHr, isPrincipal, isSubordinate, canManage, canImport }
}
