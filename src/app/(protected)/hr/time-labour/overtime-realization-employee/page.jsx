'use client'
import { useOvertimeStore } from '@/store/overtimeStore'
import { useT } from '@/store/languageStore'
import EligibilitySettings from '@/components/overtime/EligibilitySettings'

export default function OvertimeRealizationEmployeePage() {
  const t = useT()
  const { eligibilityRealizationEmployee, addRealizationEmployeeRule, updateRealizationEmployeeRule, deleteRealizationEmployeeRule } = useOvertimeStore()

  return (
    <EligibilitySettings
      icon='✅'
      title={t('Overtime Realization by Employee', 'Overtime Realization by Employee')}
      subtitle={t(
        'Atur siapa yang eligible mencatat realisasi lembur individu, berdasarkan PT, PC, Departemen, Lokasi, dan Tipe Kepegawaian.',
        'Configure who is eligible to record individual overtime realization, by Company, Grade, Department, Location, and Employment Type.',
      )}
      rules={eligibilityRealizationEmployee}
      addRule={addRealizationEmployeeRule}
      updateRule={updateRealizationEmployeeRule}
      deleteRule={deleteRealizationEmployeeRule}
    />
  )
}
