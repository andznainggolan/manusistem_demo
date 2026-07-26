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

// The form's amount column is headed "JUMLAH (Rp)", so the cells carry plain
// grouped numbers rather than a repeated "Rp" prefix.
const num = (n) => new Intl.NumberFormat('id-ID').format(Math.round(n || 0))
const pad2 = (n) => String(n).padStart(2, '0')

/* ── Small form primitives, matching the printed 1721-A1 ─────────────────── */
const Box = ({ children, className = '' }) => (
  <span className={`inline-flex h-[18px] min-w-[18px] items-center justify-center border border-gray-800 px-1 text-[10px] leading-none ${className}`}>
    {children}
  </span>
)

const Check = ({ on }) => (
  <span className='inline-flex h-[13px] w-[13px] items-center justify-center border border-gray-800 text-[10px] font-bold leading-none'>
    {on ? '×' : ''}
  </span>
)

// One numbered line in section B. `group` renders the sub-heading rows
// (PENGHASILAN BRUTO / PENGURANGAN / PENGHITUNGAN PPh PASAL 21).
function Line({ no, label, value, bold }) {
  return (
    <tr className={bold ? 'font-bold' : ''}>
      <td className='w-8 border border-gray-800 px-1 py-[3px] text-center align-top text-[9px]'>{no}</td>
      <td className='border border-gray-800 px-2 py-[3px] align-top text-[9px] uppercase leading-tight'>{label}</td>
      <td className='w-40 border border-gray-800 px-2 py-[3px] text-right align-top text-[9px] tabular-nums'>{num(value)}</td>
    </tr>
  )
}

const GroupRow = ({ label }) => (
  <tr>
    <td colSpan={3} className='border border-gray-800 bg-gray-100 px-2 py-[3px] text-[9px] font-bold uppercase'>{label}</td>
  </tr>
)

/* ── Printable 1721-A1 ──────────────────────────────────────────────────── */
function BuktiPotongDetail({ b, no, pemotong, onClose, t }) {
  const today = new Date()
  const [nomorSuffix, tail] = (() => {
    // NOMOR on the form is laid out as  1.1 - MM . YY - NNNNNNN
    const m = no.match(/^1\.1-(\d{2})\.(\d{2})-(\d+)$/)
    return m ? [`${m[1]}.${m[2]}`, m[3]] : ['', no]
  })()

  return (
    <div className='fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4' onClick={onClose}>
      <div className='w-full max-w-4xl rounded-2xl bg-white shadow-xl' onClick={e => e.stopPropagation()}>
        {/* Only the form itself goes on paper. */}
        <style>{`
          @media print {
            body * { visibility: hidden !important; }
            #bupot-print, #bupot-print * { visibility: visible !important; }
            #bupot-print { position: absolute; left: 0; top: 0; width: 100%; padding: 0 !important; }
            .no-print { display: none !important; }
            @page { size: A4 portrait; margin: 8mm; }
          }
        `}</style>

        <div className='no-print flex items-center justify-between border-b border-gray-100 px-6 py-4'>
          <h3 className='text-base font-bold text-gray-800'>
            {t('Bukti Potong 1721-A1', 'Withholding Certificate 1721-A1')} — {b.nama}
          </h3>
          <div className='flex items-center gap-2'>
            <ActionButton variant='secondary' size='sm' onClick={() => window.print()}>
              {t('Cetak', 'Print')}
            </ActionButton>
            <button onClick={onClose} className='px-1 text-xl font-bold leading-none text-gray-400 hover:text-gray-600'>×</button>
          </div>
        </div>

        <div id='bupot-print' className='overflow-x-auto p-6'>
          <div className='mx-auto w-[720px] border border-gray-800 text-gray-900'>

            {/* ── Kop ─────────────────────────────────────────────────── */}
            <div className='flex border-b border-gray-800'>
              <div className='w-[190px] border-r border-gray-800 px-2 py-2 text-[9px] font-bold leading-tight'>
                KEMENTERIAN KEUANGAN RI<br />DIREKTORAT JENDERAL PAJAK
              </div>
              <div className='flex-1 border-r border-gray-800 px-2 py-2 text-center text-[10px] font-bold leading-tight'>
                BUKTI PEMOTONGAN PAJAK PENGHASILAN<br />
                PASAL 21 BAGI PEGAWAI TETAP ATAU<br />
                PENERIMA PENSIUN ATAU TUNJANGAN HARI<br />
                TUA/JAMINAN HARI TUA BERKALA
              </div>
              <div className='w-[190px] px-2 py-2 text-[9px] leading-tight'>
                <p className='text-center text-[11px] font-bold'>FORMULIR 1721 - A1</p>
                <p className='mt-1'>Lembar ke-1 : untuk Penerima Penghasilan</p>
                <p>Lembar ke-2 : untuk Pemotong</p>
              </div>
            </div>

            {/* ── Nomor / masa / pemotong ─────────────────────────────── */}
            <div className='flex border-b border-gray-800'>
              <div className='flex-1 border-r border-gray-800 px-2 py-1.5 text-[9px]'>
                <div className='flex items-center gap-1'>
                  <span className='font-bold'>NOMOR :</span>
                  <Box>1</Box><span>.</span><Box>1</Box><span>-</span>
                  <Box className='min-w-[42px]'>{nomorSuffix}</Box><span>-</span>
                  <Box className='min-w-[74px]'>{tail}</Box>
                </div>
                <div className='mt-1.5 flex items-center gap-1'>
                  <span className='w-[92px] font-bold'>NPWP PEMOTONG</span>
                  <span>:</span>
                  <Box className='min-w-[170px]'>{pemotong.npwp || ' '}</Box>
                </div>
                <div className='mt-1 flex items-center gap-1'>
                  <span className='w-[92px] font-bold'>NAMA PEMOTONG</span>
                  <span>:</span>
                  <Box className='min-w-[170px]'>{pemotong.nama || ' '}</Box>
                </div>
              </div>
              <div className='w-[190px] px-2 py-1.5 text-center text-[9px]'>
                <p className='font-bold leading-tight'>MASA PEROLEHAN<br />PENGHASILAN [mm - mm]</p>
                <div className='mt-1 flex items-center justify-center gap-1'>
                  <Box className='min-w-[30px]'>{pad2(b.masaDari)}</Box>
                  <span>-</span>
                  <Box className='min-w-[30px]'>{pad2(b.masaSampai)}</Box>
                  <span className='ml-1'>/ {b.year}</span>
                </div>
              </div>
            </div>

            {/* ── A. Identitas penerima ───────────────────────────────── */}
            <div className='border-b border-gray-800 bg-gray-100 px-2 py-[3px] text-[9px] font-bold'>
              A. IDENTITAS PENERIMA PENGHASILAN YANG DIPOTONG
            </div>
            <div className='flex border-b border-gray-800 text-[9px]'>
              <div className='flex-1 space-y-1 border-r border-gray-800 px-2 py-2'>
                <div className='flex items-center gap-1'>
                  <span className='w-[74px]'>1. NPWP</span><span>:</span>
                  <Box className='min-w-[168px]'>{b.npwp || ' '}</Box>
                </div>
                <div className='flex items-center gap-1'>
                  <span className='w-[74px] leading-tight'>2. NIK/NO.<br />&nbsp;&nbsp;&nbsp;PASPOR</span><span>:</span>
                  <Box className='min-w-[168px]'>{b.nik || ' '}</Box>
                </div>
                <div className='flex items-center gap-1'>
                  <span className='w-[74px]'>3. NAMA</span><span>:</span>
                  <Box className='min-w-[168px]'>{b.nama}</Box>
                </div>
                <div className='flex items-start gap-1'>
                  <span className='w-[74px]'>4. ALAMAT</span><span>:</span>
                  <Box className='min-h-[30px] min-w-[168px] items-start'>{b.alamat || ' '}</Box>
                </div>
                <div className='flex items-center gap-2 pt-0.5'>
                  <span>5. JENIS KELAMIN :</span>
                  <span className='flex items-center gap-1'><Check on={/^m|laki/i.test(b.gender)} /> LAKI-LAKI</span>
                  <span className='flex items-center gap-1'><Check on={/^f|perem|wanita/i.test(b.gender)} /> PEREMPUAN</span>
                </div>
              </div>
              <div className='w-[300px] space-y-1.5 px-2 py-2'>
                <p className='leading-tight'>6. STATUS /JUMLAH TANGGUNGAN KELUARGA UNTUK PTKP</p>
                <div className='flex items-center gap-3'>
                  <span className='flex items-center gap-1'>K/ <Box className='min-w-[24px]'>{b.ptkpPrefix === 'K' ? b.ptkpTanggungan : ' '}</Box></span>
                  <span className='flex items-center gap-1'>TK/ <Box className='min-w-[24px]'>{b.ptkpPrefix === 'TK' ? b.ptkpTanggungan : ' '}</Box></span>
                  <span className='flex items-center gap-1'>HB/ <Box className='min-w-[24px]'>{b.ptkpPrefix === 'HB' ? b.ptkpTanggungan : ' '}</Box></span>
                </div>
                <div className='flex items-center gap-1 pt-1'>
                  <span>7. NAMA JABATAN :</span>
                  <Box className='min-w-[150px]'>{b.jabatan || ' '}</Box>
                </div>
                <div className='flex items-center gap-2'>
                  <span>8. KARYAWAN ASING :</span><Check on={b.isAsing} /> <span>YA</span>
                </div>
                <div className='flex items-center gap-1'>
                  <span>9. KODE NEGARA DOMISILI :</span>
                  <Box className='min-w-[70px]'>{b.kodeNegara || ' '}</Box>
                </div>
              </div>
            </div>

            {/* ── B. Rincian penghasilan ──────────────────────────────── */}
            <div className='border-b border-gray-800 bg-gray-100 px-2 py-[3px] text-[9px] font-bold'>
              B. RINCIAN PENGHASILAN DAN PENGHITUNGAN PPh PASAL 21
            </div>
            <div className='flex items-center gap-3 border-b border-gray-800 px-2 py-1 text-[9px]'>
              <span className='font-bold'>KODE OBJEK PAJAK :</span>
              <span className='flex items-center gap-1'><Check on /> 21-100-01</span>
              <span className='flex items-center gap-1'><Check on={false} /> 21-100-02</span>
            </div>
            <table className='w-full border-collapse'>
              <thead>
                <tr className='bg-gray-100 text-[9px] font-bold'>
                  <th colSpan={2} className='border border-gray-800 px-2 py-[3px]'>URAIAN</th>
                  <th className='w-40 border border-gray-800 px-2 py-[3px]'>JUMLAH (Rp)</th>
                </tr>
              </thead>
              <tbody>
                <GroupRow label='Penghasilan Bruto :' />
                <Line no='1.'  label='Gaji/Pensiun atau THT/JHT' value={b.gajiPokok} />
                <Line no='2.'  label='Tunjangan PPh' value={b.tunjanganPph} />
                <Line no='3.'  label='Tunjangan Lainnya, Uang Lembur dan Sebagainya' value={b.tunjanganLain} />
                <Line no='4.'  label='Honorarium dan Imbalan Lain Sejenisnya' value={b.honorarium} />
                <Line no='5.'  label='Premi Asuransi yang Dibayar Pemberi Kerja' value={b.premiPemberiKerja} />
                <Line no='6.'  label='Penerimaan dalam Bentuk Natura dan Kenikmatan Lainnya yang Dikenakan Pemotongan PPh Pasal 21' value={b.natura} />
                <Line no='7.'  label='Tantiem, Bonus, Gratifikasi, Jasa Produksi dan THR' value={b.bonus} />
                <Line no='8.'  label='Jumlah Penghasilan Bruto (1 s.d. 7)' value={b.bruto} bold />
                <GroupRow label='Pengurangan :' />
                <Line no='9.'  label='Biaya Jabatan/Biaya Pensiun' value={b.biayaJabatan} />
                <Line no='10.' label='Iuran Pensiun atau Iuran THT/JHT' value={b.iuranPensiun} />
                <Line no='11.' label='Jumlah Pengurangan (9 s.d. 10)' value={b.totalPengurangan} bold />
                <GroupRow label='Penghitungan PPh Pasal 21 :' />
                <Line no='12.' label='Jumlah Penghasilan Neto (8 - 11)' value={b.neto} />
                <Line no='13.' label='Penghasilan Neto Masa Sebelumnya' value={b.netoMasaSebelumnya} />
                <Line no='14.' label='Jumlah Penghasilan Neto untuk Penghitungan PPh Pasal 21 (Setahun/Disetahunkan)' value={b.netoUntukPenghitungan} bold />
                <Line no='15.' label={`Penghasilan Tidak Kena Pajak (PTKP) — ${b.ptkpStatus}`} value={b.ptkp} />
                <Line no='16.' label='Penghasilan Kena Pajak Setahun/Disetahunkan (14 - 15)' value={b.pkp} bold />
                <Line no='17.' label='PPh Pasal 21 atas Penghasilan Kena Pajak Setahun/Disetahunkan' value={b.pphAtasPkp} />
                <Line no='18.' label='PPh Pasal 21 yang Telah Dipotong Masa Sebelumnya' value={b.pphDipotongMasaSebelumnya} />
                <Line no='19.' label={`PPh Pasal 21 Terutang${!b.hasNpwp ? ' (termasuk tambahan 20% karena tidak ber-NPWP)' : ''}`} value={b.pphTerutang} bold />
                <Line no='20.' label='PPh Pasal 21 dan PPh Pasal 26 yang Telah Dipotong dan Dilunasi' value={b.pphDipotong} bold />
              </tbody>
            </table>

            {/* ── C. Identitas pemotong ───────────────────────────────── */}
            <div className='border-y border-gray-800 bg-gray-100 px-2 py-[3px] text-[9px] font-bold'>
              C. IDENTITAS PEMOTONG
            </div>
            <div className='flex text-[9px]'>
              <div className='flex-1 space-y-1.5 border-r border-gray-800 px-2 py-2'>
                <div className='flex items-center gap-1'>
                  <span className='w-[56px]'>1. NPWP</span><span>:</span>
                  <Box className='min-w-[170px]'>{pemotong.npwp || ' '}</Box>
                </div>
                <div className='flex items-center gap-1'>
                  <span className='w-[56px]'>2. NAMA</span><span>:</span>
                  <Box className='min-w-[170px]'>{pemotong.nama || ' '}</Box>
                </div>
                {pemotong.alamat && <p className='pt-1 text-[8px] text-gray-600'>{pemotong.alamat}</p>}
              </div>
              <div className='w-[300px] px-2 py-2'>
                <p>3. TANGGAL &amp; TANDA TANGAN</p>
                <div className='mt-1 flex items-center gap-1'>
                  <Box className='min-w-[26px]'>{pad2(today.getDate())}</Box><span>-</span>
                  <Box className='min-w-[26px]'>{pad2(today.getMonth() + 1)}</Box><span>-</span>
                  <Box className='min-w-[42px]'>{today.getFullYear()}</Box>
                  <span className='ml-1 text-[8px] text-gray-500'>[dd - mm - yyyy]</span>
                </div>
                <div className='mt-6 text-center'>
                  <div className='h-10' />
                  <p className='mx-auto w-[190px] border-t border-gray-800 pt-1 font-semibold'>
                    {pemotong.penandatanganNama || ' '}
                  </p>
                  <p className='text-[8px] text-gray-600'>NPWP: {pemotong.penandatanganNpwp || '—'}</p>
                </div>
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

      <div className='mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4'>
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
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
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
          <div className='grid grid-cols-1 gap-3 text-sm md:grid-cols-3'>
            <p><span className='block text-xs text-gray-400'>NPWP</span>{pemotong.npwp || '—'}</p>
            <p><span className='block text-xs text-gray-400'>{t('Nama', 'Name')}</span>{pemotong.nama || '—'}</p>
            <p><span className='block text-xs text-gray-400'>{t('Penandatangan', 'Signatory')}</span>{pemotong.penandatanganNama || '—'}</p>
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
                <Td className='text-xs tabular-nums'>{nomorBuktiPotong(year, idx)}</Td>
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
                    : <span className={`font-semibold tabular-nums ${b.selisih > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
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
