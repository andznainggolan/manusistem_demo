'use client'
import { usePayrollStore, formatRp } from '@/store/payrollStore'
import { useT } from '@/store/languageStore'
import { PageHeader, StatCard, SectionCard } from '@/components/ui'

export default function PayrollOverviewPage() {
  const t = useT()
  const { payslips } = usePayrollStore()

  const latestPeriod = [...new Set(payslips.map(p=>p.period))].sort((a,b)=>b.localeCompare(a))[0]
  const rows = payslips.filter(p => p.period === latestPeriod)
  const totalNet = rows.reduce((s,p)=>s+p.net, 0)
  const totalPph21 = rows.reduce((s,p)=>s+(p.pph21||0), 0)

  return (
    <div>
      <PageHeader
        icon='💼'
        title='Payroll'
        subtitle={t('Sistem penggajian sesuai ketentuan PPh 21 & BPJS Indonesia.','Payroll system per Indonesian PPh 21 & BPJS rules.')}
      />

      {latestPeriod && (
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6'>
          <StatCard icon='📅' tone='gray'  label={t('Periode Terakhir','Latest Period')} value={latestPeriod} />
          <StatCard icon='🧾' tone='orange' label='Total PPh 21' value={formatRp(totalPph21)} />
          <StatCard icon='🏦' tone='green' label={t('Total Take-Home','Total Take-Home')} value={formatRp(totalNet)} />
        </div>
      )}

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <SectionCard icon='💼' title='Payroll Run' subtitle={t('Generate & publish payroll bulanan.','Generate & publish monthly payroll.')}>
          <a href='/hr/payroll/run' className='text-sm font-semibold text-red-700 hover:underline'>{t('Buka','Open')} →</a>
        </SectionCard>
        <SectionCard icon='🧾' title='Payroll Setup' subtitle={t('Gaji pokok, PTKP, NPWP, BPJS per karyawan.','Basic salary, PTKP, NPWP, BPJS per employee.')}>
          <a href='/hr/payroll/setup' className='text-sm font-semibold text-red-700 hover:underline'>{t('Buka','Open')} →</a>
        </SectionCard>
        <SectionCard icon='🧾' title='SPT PPh 21 (1721-A1)' subtitle={t('Bukti potong PPh 21 tahunan per karyawan.','Annual PPh 21 certificates per employee.')}>
          <a href='/hr/payroll/spt21' className='text-sm font-semibold text-red-700 hover:underline'>{t('Buka','Open')} →</a>
        </SectionCard>
        <SectionCard icon='⚙️' title='Payroll Settings' subtitle={t('Tarif & batas atas BPJS/PPh 21.','BPJS/PPh 21 rates & caps.')}>
          <a href='/hr/payroll/settings' className='text-sm font-semibold text-red-700 hover:underline'>{t('Buka','Open')} →</a>
        </SectionCard>
      </div>
    </div>
  )
}
