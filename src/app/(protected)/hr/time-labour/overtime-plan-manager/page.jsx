'use client'
import { useOvertimeStore } from '@/store/overtimeStore'
import { useT } from '@/store/languageStore'
import EligibilitySettings from '@/components/overtime/EligibilitySettings'

export default function OvertimePlanManagerPage() {
  const t = useT()
  const { eligibilityPlanManager, addPlanManagerRule, updatePlanManagerRule, deletePlanManagerRule } = useOvertimeStore()

  return (
    <EligibilitySettings
      icon='📋'
      title={t('Overtime Plan by Manager', 'Overtime Plan by Manager')}
      subtitle={t(
        'Atur manager mana yang eligible merencanakan anggaran lembur tim, berdasarkan PT, PC, Departemen, Lokasi, dan Tipe Kepegawaian.',
        "Configure which managers are eligible to plan team overtime budgets, by Company, Grade, Department, Location, and Employment Type.",
      )}
      rules={eligibilityPlanManager}
      addRule={addPlanManagerRule}
      updateRule={updatePlanManagerRule}
      deleteRule={deletePlanManagerRule}
    />
  )
}
