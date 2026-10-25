'use client'
import { useAuthStore } from '@/store/authStore'
import { useEmployeeStore } from '@/store/employeeStore'
import { useStructureStore } from '@/store/structureStore'

/**
 * Who may manage a teacher's JLA (assign tasks, validate realisation):
 * an administrator, the principal of the teacher's unit, or the teacher's direct supervisor.
 */
export function useJlaAuthority() {
  const { currentUser } = useAuthStore()
  const { employees } = useEmployeeStore()
  const { departments, positions } = useStructureStore()

  const viewer = employees.find(e => e.id === currentUser?.id)
  const viewerPosition = positions.find(p => p.id === viewer?.positionId)?.name || ''
  const buOf = (emp) => departments.find(d => d.id === emp.departmentId)?.businessUnitId
  const isAdmin = currentUser?.role === 'superadmin'
  const isPrincipal = viewerPosition.startsWith('Kepala Sekolah')
  const canManage = (emp) => !!emp && (
    isAdmin
    || (isPrincipal && buOf(emp) === buOf(viewer || {}))
    || emp.managerId === currentUser?.id
  )
  // Excel import is wider than editing one calendar and narrower than "any supervisor":
  // administrators and HR for everyone, a principal for the teachers of their own unit.
  const isHr = !!currentUser?.role?.startsWith('hr')
  const canImport = (emp) => !!emp && (isAdmin || isHr || (isPrincipal && buOf(emp) === buOf(viewer || {})))
  return { currentUser, viewer, buOf, isAdmin, isHr, isPrincipal, canManage, canImport }
}
