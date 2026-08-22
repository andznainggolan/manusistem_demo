'use client'
import { useOvertimeStore } from '@/store/overtimeStore'
import { useT } from '@/store/languageStore'
import EligibilitySettings from '@/components/overtime/EligibilitySettings'

export default function OvertimeRealizationManagerPage() {
  const t = useT()
  const { eligibilityRealizationManager, addRealizationManagerRule, updateRealizationManagerRule, deleteRealizationManagerRule } = useOvertimeStore()

  return (
    <EligibilitySettings
      icon='📊'
      title={t('Overtime Realization by Manager', 'Overtime Realization by Manager')}
      subtitle={t(
        'Atur manager mana yang eligible mencatat realisasi lembur tim, berdasarkan PT, PC, Departemen, Lokasi, dan Tipe Kepegawaian.',
        "Configure which managers are eligible to record team overtime realization, by Company, Grade, Department, Location, and Employment Type.",
      )}
      rules={eligibilityRealizationManager}
      addRule={addRealizationManagerRule}
      updateRule={updateRealizationManagerRule}
      deleteRule={deleteRealizationManagerRule}
    />
  )
}
