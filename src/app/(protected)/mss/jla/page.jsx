'use client'
import { PageHeader } from '@/components/ui'
import JlaBoard from '@/components/jla/JlaBoard'

export default function MssJlaPage() {
  return (
    <div>
      <PageHeader
        icon='🗓️'
        title='Job Load Analysis (JLA)'
        subtitle='Pantau beban kerja guru di unit Anda: jam mengajar tetap ditambah task, sampai target jam kerja per minggu tercapai.'
      />
      <JlaBoard scope='unit' />
    </div>
  )
}
