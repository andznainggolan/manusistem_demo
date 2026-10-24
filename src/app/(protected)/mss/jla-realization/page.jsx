'use client'
import { PageHeader } from '@/components/ui'
import JlaRealizationBoard from '@/components/jla/JlaRealizationBoard'

export default function MssJlaRealizationPage() {
  return (
    <div>
      <PageHeader
        icon='📊'
        title='Realisasi JLA'
        subtitle='Bandingkan plan dengan realisasi jam mengajar dan task guru, lalu validasi konfirmasi yang melebihi bukti absensi.'
      />
      <JlaRealizationBoard scope='unit' />
    </div>
  )
}
