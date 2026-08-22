'use client'
import { useOvertimeStore } from '@/store/overtimeStore'
import { useT } from '@/store/languageStore'
import EligibilitySettings from '@/components/overtime/EligibilitySettings'

export default function CompensatoryLeavePage() {
  const t = useT()
  const { eligibilityCompLeave, addCompLeaveRule, updateCompLeaveRule, deleteCompLeaveRule } = useOvertimeStore()

  return (
    <EligibilitySettings
      icon='🔄'
      title={t('Compensatory Leave', 'Compensatory Leave')}
      subtitle={t(
        'Atur siapa yang eligible mendapatkan cuti pengganti, berdasarkan PT, PC, Departemen, Lokasi, dan Tipe Kepegawaian.',
        'Configure who is eligible for compensatory leave, by Company, Grade, Department, Location, and Employment Type.',
      )}
      rules={eligibilityCompLeave}
      addRule={addCompLeaveRule}
      updateRule={updateCompLeaveRule}
      deleteRule={deleteCompLeaveRule}
    />
  )
}
