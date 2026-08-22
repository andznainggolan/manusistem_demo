'use client'
import { useOvertimeStore } from '@/store/overtimeStore'
import { useT } from '@/store/languageStore'
import EligibilitySettings from '@/components/overtime/EligibilitySettings'

export default function OvertimePlanEmployeePage() {
  const t = useT()
  const { eligibilityPlanEmployee, addPlanEmployeeRule, updatePlanEmployeeRule, deletePlanEmployeeRule } = useOvertimeStore()

  return (
    <EligibilitySettings
      icon='⏱️'
      title={t('Overtime Plan by Employee', 'Overtime Plan by Employee')}
      subtitle={t(
        'Atur siapa yang eligible mengajukan rencana lembur individu, berdasarkan PT, PC, Departemen, Lokasi, dan Tipe Kepegawaian.',
        'Configure who is eligible to submit individual overtime plans, by Company, Grade, Department, Location, and Employment Type.',
      )}
      rules={eligibilityPlanEmployee}
      addRule={addPlanEmployeeRule}
      updateRule={updatePlanEmployeeRule}
      deleteRule={deletePlanEmployeeRule}
    />
  )
}
