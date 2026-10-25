'use client'
import { PageHeader } from '@/components/ui'
import JlaExcelBoard from '@/components/jla/JlaExcelBoard'

export default function MssJlaExcelPage() {
  return (
    <div>
      <PageHeader
        icon='📊'
        title='Import / Export JLA'
        subtitle='Unduh template, jadwal guru, dan summary dalam Excel, atau impor jadwal guru di unit Anda dari file Excel.'
      />
      <JlaExcelBoard scope='unit' />
    </div>
  )
}
