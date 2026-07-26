'use client'
import { useState, useMemo } from 'react'
import { usePayrollStore, formatRp } from '@/store/payrollStore'
import { useEmployeeStore } from '@/store/employeeStore'
import { useT } from '@/store/languageStore'
import {
  PageHeader, StatCard, SectionCard, DataTable, Tr, Td, SearchBar,
  ActionButton, StatusBadge, EmptyState, FormField, Input, Select,
} from '@/components/ui'
import {
  buildAllBuktiPotong, buktiPotongToCsv, nomorBuktiPotong,
  availableTaxYears, MONTHS_ID,
} from '@/lib/spt21'

const DEFAULT_PEMOTONG = { npwp: '', nama: '', alamat: '', penandatanganNama: '', penandatanganNpwp: '' }

/* ── One numbered line of the form ──────────────────────────────────────── */
function FormRow({ no, label, value, bold, indent }) {
  return (
    <div className={`flex items-start gap-3 px-4 py-1.5 ${bold ? 'bg-gray-50 font-semibold text-gray-800' : 'text-gray-700'}`}>
      <span className='w-7 shrink-0 text-xs text-gray-400 tabular-nums'>{no}</span>
      <span className={`flex-1 text-xs ${indent ? 'pl-4' : ''}`}>{label}</span>
      <span className='w-40 shrink-0 text-right text-xs tabular-nums'>{value}</span>
    </div>
  )
}

/* ── Printable 1721-A1 ──────────────────────────────────────────────────── */
function BuktiPotongDetail({ b, no, pemotong, onClose, t }) {
  const masa = `${String(b.masaDari).padStart(2, '0')} — ${String(b.masaSampai).padStart(2, '0')}`
  return (
    <div className='fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4' onClick={onClose}>
      <div className='bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[92vh] overflow-y-auto' onClick={e => e.stopPropagation()}>
        {/* Only the form itself goes on paper. */}
        <style>{`@media print {
          body * { visibility: hidden !important; }
          #bupot-print, #bupot-print * { visibility: visible !important; }
          #bupot-print { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }`}</style>

        <div className='no-print flex items-center justify-between px-6 py-4 border-b border-gray-100'>
          <h3 className='text-base font-bold text-gray-800'>
            {t('Bukti Potong 1721-A1', 'Withholding Certificate 1721-A1')}
          </h3>
          <div className='flex items-center gap-2'>
            <ActionButton variant='secondary' size='sm' onClick={() => window.print()}>
              {t('Cetak', 'Print')}
            </ActionButton>
            <button onClick={onClose} className='text-gray-400 hover:text-gray-600 text-xl font-bold leading-none px-1'>×</button>
          </div>
        </div>

        <div id='bupot-print' className='p-6'>
          <div className='text-center mb-4'>
            <p className='text-xs text-gray-500'>{t('LAMPIRAN I.A', 'ATTACHMENT I.A')}</p>
            <h2 className='text-sm font-bold text-gray-900'>FORMULIR 1721 - A1</h2>
            <p className='text-xs text-gray-600 mt-1'>
              BUKTI PEMOTONGAN PAJAK PENGHASILAN PASAL 21<br />
              BAGI PEGAWAI TETAP ATAU PENERIMA PENSIUN BERKALA
            </p>
          </div>

          <div className='grid grid-cols-2 gap-3 text-xs mb-4'>
            <div className='rounded-xl ring-1 ring-gray-200 p-3'>
              <p className='font-semibold text-gray-500 mb-1'>{t('NOMOR', 'NUMBER')}</p>
              <p className='font-bold text-gray-800 tabular-nums'>{no}</p>
            </div>
            <div className='rounded-xl ring-1 ring-gray-200 p-3'>
              <p className='font-semibold text-gray-500 mb-1'>{t('MASA PEROLEHAN PENGHASILAN', 'INCOME PERIOD')}</p>
              <p className='font-bold text-gray-800 tabular-nums'>{masa} / {b.year}</p>
            </div>
          </div>

          <div className='rounded-xl ring-1 ring-gray-200 p-3 text-xs mb-4'>
            <p className='font-bold text-gray-700 mb-2'>A. {t('IDENTITAS PENERIMA PENGHASILAN', 'RECIPIENT IDENTITY')}</p>
            <div className='grid grid-cols-2 gap-x-6 gap-y-1'>
              <p><span className='text-gray-500'>NPWP</span> : {b.npwp || '—'}</p>
              <p><span className='text-gray-500'>NIK</span> : {b.nik || '—'}</p>
              <p><span className='text-gray-500'>{t('Nama', 'Name')}</span> : {b.nama}</p>
              <p><span className='text-gray-500'>{t('Jabatan', 'Position')}</span> : {b.jabatan || '—'}</p>
              <p className='col-span-2'><span className='text-gray-500'>{t('Alamat', 'Address')}</span> : {b.alamat || '—'}</p>
              <p><span className='text-gray-500'>{t('Status/Tanggungan', 'Tax Status')}</span> : {b.ptkpStatus}</p>
              <p><span className='text-gray-500'>{t('Jumlah Bulan', 'Months')}</span> : {b.jumlahBulan}</p>
            </div>
          </div>

          <div className='rounded-xl ring-1 ring-gray-200 overflow-hidden mb-4'>
            <p className='bg-gray-100 px-4 py-2 text-xs font-bold text-gray-700'>
              B. {t('RINCIAN PENGHASILAN DAN PENGHITUNGAN PPh PASAL 21', 'INCOME DETAIL & PPh 21 CALCULATION')}
            </p>
            <div className='divide-y divide-gray-50'>
              <FormRow no='1.' label={t('Gaji/Pensiun atau THT/JHT', 'Salary / Pension')} value={formatRp(b.gajiPokok)} />
              <FormRow no='2.' label={t('Tunjangan (tetap & variabel)', 'Allowances (fixed & variable)')} value={formatRp(b.tunjangan)} />
              <FormRow no='3.' label={t('Uang Lembur dan sejenisnya', 'Overtime and similar')} value={formatRp(b.lembur)} />
              <FormRow no='4.' label={t('Premi asuransi dibayar pemberi kerja', 'Insurance premiums paid by employer')} value={formatRp(b.premiPemberiKerja)} />
              <FormRow no='5.' label={t('JUMLAH PENGHASILAN BRUTO', 'TOTAL GROSS INCOME')} value={formatRp(b.bruto)} bold />
              <FormRow no='6.' label={t('Biaya Jabatan', 'Occupational Cost')} value={formatRp(b.biayaJabatan)} />
              <FormRow no='7.' label={t('Iuran Pensiun / JHT / JP', 'Pension / JHT / JP contributions')} value={formatRp(b.iuranPensiun)} />
              <FormRow no='8.' label={t('JUMLAH PENGURANGAN', 'TOTAL DEDUCTIONS')} value={formatRp(b.totalPengurangan)} bold />
              <FormRow no='9.' label={t('JUMLAH PENGHASILAN NETO', 'TOTAL NET INCOME')} value={formatRp(b.neto)} bold />
              <FormRow no='10.' label={`${t('Penghasilan Tidak Kena Pajak (PTKP)', 'Non-Taxable Income (PTKP)')} — ${b.ptkpStatus}`} value={formatRp(b.ptkp)} />
              <FormRow no='11.' label={t('PENGHASILAN KENA PAJAK (PKP)', 'TAXABLE INCOME (PKP)')} value={formatRp(b.pkp)} bold />
              <FormRow no='12.' label={t('PPh Pasal 21 atas PKP setahun', 'Annual PPh 21 on PKP')} value={formatRp(b.pphTerutang)} />
              {!b.hasNpwp && (
                <FormRow no='' label={t('(termasuk tambahan 20% karena tidak ber-NPWP)', '(includes 20% surcharge for no NPWP)')} value='' indent />
              )}
              <FormRow no='13.' label={t('PPh Pasal 21 yang telah dipotong', 'PPh 21 already withheld')} value={formatRp(b.pphDipotong)} />
              <FormRow no='14.'
                label={b.selisih >= 0
                  ? t('PPh Pasal 21 KURANG dipotong', 'PPh 21 UNDER-withheld')
                  : t('PPh Pasal 21 LEBIH dipotong', 'PPh 21 OVER-withheld')}
                value={formatRp(Math.abs(b.selisih))} bold />
            </div>
          </div>

          <div className='rounded-xl ring-1 ring-gray-200 p-3 text-xs'>
            <p className='font-bold text-gray-700 mb-2'>C. {t('IDENTITAS PEMOTONG', 'WITHHOLDER IDENTITY')}</p>
            <div className='grid grid-cols-2 gap-x-6 gap-y-1'>
              <p><span className='text-gray-500'>NPWP</span> : {pemotong.npwp || '—'}</p>
              <p><span className='text-gray-500'>{t('Nama', 'Name')}</span> : {pemotong.nama || '—'}</p>
              <p className='col-span-2'><span className='text-gray-500'>{t('Alamat', 'Address')}</span> : {pemotong.alamat || '—'}</p>
            </div>
            <div className='mt-5 flex justify-end'>
              <div className='text-center'>
                <p className='text-gray-500'>{t('Tanda tangan pemotong', 'Withholder signature')}</p>
                <div className='h-14' />
                <p className='font-semibold text-gray-800 border-t border-gray-300 pt-1 px-6'>
                  {pemotong.penandatanganNama || '—'}
                </p>
                <p className='text-gray-500'>NPWP: {pemotong.penandatanganNpwp || '—'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════ */
export default function Spt21Page() {
  const t = useT()
  const { payslips, settings, updateSettings } = usePayrollStore()
  const { employees } = useEmployeeStore()

  const years = availableTaxYears(payslips)
  const [year, setYear] = useState(years[0] || String(new Date().getFullYear()))
  const [q, setQ] = useState('')
  const [openIdx, setOpenIdx] = useState(null)
  const [editPemotong, setEditPemotong] = useState(false)

  const pemotong = { ...DEFAULT_PEMOTONG, ...(settings.pemotong || {}) }
  const setPemotong = (patch) => updateSettings({ pemotong: { ...pemotong, ...patch } })

  // Only Published payslips belong on a bukti potong — a Draft hasn't been paid.
  const published = useMemo(
    () => payslips.filter(p => p.status === 'Published'),
    [payslips],
  )
  const list = useMemo(
    () => buildAllBuktiPotong({ payslips: published, year, employees, settings }),
    [published, year, employees, settings],
  )

  const needle = q.trim().toLowerCase()
  const shown = needle
    ? list.filter(b => b.nama.toLowerCase().includes(needle) || (b.npwp || '').includes(needle))
    : list

  const totalBruto = list.reduce((s, b) => s + b.bruto, 0)
  const totalPph = list.reduce((s, b) => s + b.pphTerutang, 0)
  const mismatched = list.filter(b => b.selisih !== 0).length

  const exportCsv = () => {
    const blob = new Blob([buktiPotongToCsv(list, year)], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `SPT-PPh21-1721-A1-${year}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <PageHeader
        icon='🧾'
        title={t('SPT PPh 21 Karyawan (1721-A1)', 'Employee PPh 21 Return (1721-A1)')}
        subtitle={t(
          'Bukti potong PPh 21 tahunan untuk pegawai tetap, dihitung dari payroll yang sudah dipublish.',
          'Annual PPh 21 withholding certificates for permanent employees, built from published payroll.',
        )}
        actions={
          <div className='flex items-center gap-2'>
            <Select value={year} onChange={e => { setYear(e.target.value); setOpenIdx(null) }}>
              {(years.length ? years : [year]).map(y => <option key={y} value={y}>{y}</option>)}
            </Select>
            <ActionButton onClick={exportCsv} icon='⬇️' disabled={list.length === 0}>
              {t('Export CSV', 'Export CSV')}
            </ActionButton>
          </div>
        }
      />

      <div className='grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6'>
        <StatCard icon='👥' tone='gray'   label={t('Jumlah Pegawai', 'Employees')} value={String(list.length)} />
        <StatCard icon='💰' tone='blue'   label={t('Total Bruto', 'Total Gross')} value={formatRp(totalBruto)} />
        <StatCard icon='🧾' tone='orange' label={t('Total PPh 21 Terutang', 'Total PPh 21 Due')} value={formatRp(totalPph)} />
        <StatCard icon='⚖️' tone={mismatched ? 'red' : 'green'}
          label={t('Perlu Penyesuaian', 'Needs Adjustment')} value={String(mismatched)}
          hint={t('Terutang ≠ dipotong', 'Due ≠ withheld')} />
      </div>

      <SectionCard
        icon='🏢'
        title={t('Identitas Pemotong', 'Withholder Identity')}
        subtitle={t('Dipakai di bagian C setiap bukti potong.', 'Printed in section C of every certificate.')}
        className='mb-6'
        actions={
          <ActionButton variant='secondary' size='sm' onClick={() => setEditPemotong(v => !v)}>
            {editPemotong ? t('Selesai', 'Done') : t('Ubah', 'Edit')}
          </ActionButton>
        }
      >
        {editPemotong ? (
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <FormField label={t('NPWP Pemotong', 'Withholder NPWP')}>
              <Input value={pemotong.npwp} onChange={e => setPemotong({ npwp: e.target.value })} placeholder='00.000.000.0-000.000' />
            </FormField>
            <FormField label={t('Nama Pemotong', 'Withholder Name')}>
              <Input value={pemotong.nama} onChange={e => setPemotong({ nama: e.target.value })} />
            </FormField>
            <FormField label={t('Alamat', 'Address')} className='md:col-span-2'>
              <Input value={pemotong.alamat} onChange={e => setPemotong({ alamat: e.target.value })} />
            </FormField>
            <FormField label={t('Nama Penandatangan', 'Signatory Name')}>
              <Input value={pemotong.penandatanganNama} onChange={e => setPemotong({ penandatanganNama: e.target.value })} />
            </FormField>
            <FormField label={t('NPWP Penandatangan', 'Signatory NPWP')}>
              <Input value={pemotong.penandatanganNpwp} onChange={e => setPemotong({ penandatanganNpwp: e.target.value })} />
            </FormField>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-3 gap-3 text-sm'>
            <p><span className='text-gray-400 text-xs block'>NPWP</span>{pemotong.npwp || '—'}</p>
            <p><span className='text-gray-400 text-xs block'>{t('Nama', 'Name')}</span>{pemotong.nama || '—'}</p>
            <p><span className='text-gray-400 text-xs block'>{t('Penandatangan', 'Signatory')}</span>{pemotong.penandatanganNama || '—'}</p>
          </div>
        )}
      </SectionCard>

      <div className='mb-4'>
        <SearchBar value={q} onChange={setQ} placeholder={t('Cari nama atau NPWP…', 'Search name or NPWP…')} />
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon='🧾'
          title={t('Belum ada data', 'No data yet')}
          description={t(
            `Belum ada payroll berstatus Published untuk tahun ${year}. Jalankan dan publish Payroll Run lebih dulu.`,
            `No Published payroll for ${year}. Run and publish a Payroll Run first.`,
          )}
        />
      ) : (
        <DataTable columns={[
          { label: t('No. Bukti Potong', 'Certificate No.') },
          { label: t('Nama', 'Name') },
          { label: 'NPWP' },
          { label: 'PTKP', align: 'center' },
          { label: t('Masa', 'Period'), align: 'center' },
          { label: t('Bruto', 'Gross'), align: 'right' },
          { label: t('PPh 21 Terutang', 'PPh 21 Due'), align: 'right' },
          { label: t('Dipotong', 'Withheld'), align: 'right' },
          { label: t('Selisih', 'Difference'), align: 'right' },
        ]}>
          {shown.map((b) => {
            const idx = list.indexOf(b)
            return (
              <Tr key={b.empId} onClick={() => setOpenIdx(idx)}>
                <Td className='tabular-nums text-xs'>{nomorBuktiPotong(year, idx)}</Td>
                <Td className='font-semibold text-gray-800'>{b.nama}</Td>
                <Td className='text-xs'>{b.npwp || <span className='text-gray-300'>—</span>}</Td>
                <Td align='center'>{b.ptkpStatus}</Td>
                <Td align='center' className='text-xs tabular-nums'>
                  {MONTHS_ID[b.masaDari - 1].slice(0, 3)}–{MONTHS_ID[b.masaSampai - 1].slice(0, 3)}
                </Td>
                <Td align='right' className='tabular-nums'>{formatRp(b.bruto)}</Td>
                <Td align='right' className='tabular-nums'>{formatRp(b.pphTerutang)}</Td>
                <Td align='right' className='tabular-nums'>{formatRp(b.pphDipotong)}</Td>
                <Td align='right'>
                  {b.selisih === 0
                    ? <StatusBadge tone='success'>{t('Sesuai', 'Match')}</StatusBadge>
                    : <span className={`tabular-nums font-semibold ${b.selisih > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {b.selisih > 0 ? '+' : '−'}{formatRp(Math.abs(b.selisih))}
                      </span>}
                </Td>
              </Tr>
            )
          })}
        </DataTable>
      )}

      {openIdx != null && list[openIdx] && (
        <BuktiPotongDetail
          b={list[openIdx]}
          no={nomorBuktiPotong(year, openIdx)}
          pemotong={pemotong}
          onClose={() => setOpenIdx(null)}
          t={t}
        />
      )}
    </div>
  )
}
