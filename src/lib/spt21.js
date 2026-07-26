// Bukti Potong PPh Pasal 21 Tahunan — Formulir 1721-A1 (pegawai tetap).
//
// Rolls a year's worth of payslips up into the annual withholding certificate
// each permanent employee receives to file their own SPT Tahunan. Line numbers
// below follow the 1721-A1 form's "Rincian Penghasilan dan Penghitungan PPh
// Pasal 21" section so the report maps 1:1 onto the printed form.
//
// Note on method: monthly withholding since PP 58/2023 uses the TER (Tarif
// Efektif Rata-rata) tables, but the ANNUAL figure on 1721-A1 is always the
// full progressive calculation (UU HPP) — TER is only a monthly approximation
// that this form trues up. So this file deliberately computes the annual tax
// progressively via calcAnnualTax() and reports the difference against what
// was actually withheld month by month (line 21/22).

import { PTKP_TABLE, calcAnnualTax, DEFAULT_PAYROLL_SETTINGS } from './payrollCalc'

export const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

// 'YYYY-MM' -> 1..12
const monthOf = (period) => Number(period.slice(5, 7))

export const availableTaxYears = (payslips) =>
  [...new Set(payslips.map(p => p.period.slice(0, 4)))].sort((a, b) => b.localeCompare(a))

/**
 * Build one employee's 1721-A1 for a tax year.
 * `rows` must be that employee's payslips for the year (any order).
 */
export function buildBuktiPotong({ rows, year, employee, settings = DEFAULT_PAYROLL_SETTINGS }) {
  const slips = [...rows].sort((a, b) => a.period.localeCompare(b.period))
  const sum = (f) => slips.reduce((s, p) => s + (Number(p[f]) || 0), 0)

  // Masa perolehan penghasilan — the span actually paid, not the whole year,
  // so mid-year joiners/leavers print the correct range.
  const months = slips.map(p => monthOf(p.period))
  const masaDari = months.length ? Math.min(...months) : 1
  const masaSampai = months.length ? Math.max(...months) : 12
  const jumlahBulan = slips.length

  /* ── Penghasilan bruto (lines 1–8) ─────────────────────────────────────── */
  const gajiPokok      = sum('basic')
  const tunjangan      = sum('allowance') + sum('variableAllowance')
  const lembur         = sum('overtime')
  // Premi asuransi dibayar pemberi kerja: the employer-side BPJS health and
  // JKK/JKM premiums are the employee's income under PPh 21.
  const premiPemberiKerja = sum('bpjsKesehatanEmployer') + sum('jkkEmployer') + sum('jkmEmployer')
  const bruto = gajiPokok + tunjangan + lembur + premiPemberiKerja

  /* ── Pengurangan (lines 9–11) ──────────────────────────────────────────── */
  // Biaya jabatan: 5% of bruto, capped per month of employment (PMK 250/2008).
  const biayaJabatan = Math.min(
    bruto * settings.biayaJabatan.rate,
    settings.biayaJabatan.monthlyCap * (jumlahBulan || 12),
  )
  // Iuran pensiun/JHT — only the employee-borne portion is deductible.
  const iuranPensiun = sum('jhtEmployee') + sum('jpEmployee')
  const totalPengurangan = biayaJabatan + iuranPensiun

  /* ── Penghitungan PPh 21 (lines 12–21) ─────────────────────────────────── */
  const neto = Math.max(0, bruto - totalPengurangan)
  const ptkpStatus = slips[slips.length - 1]?.ptkpStatus || 'TK/0'
  const ptkp = PTKP_TABLE[ptkpStatus] ?? PTKP_TABLE['TK/0']
  // PKP is rounded down to the nearest thousand rupiah.
  const pkp = Math.max(0, Math.floor((neto - ptkp) / 1000) * 1000)

  const hasNpwp = slips[slips.length - 1]?.npwp !== false
  const pphAtasPkp = calcAnnualTax(pkp)
  // Pasal 21(5a) UU PPh: 20% higher rate for a recipient without an NPWP.
  const pphTerutang = Math.round(hasNpwp ? pphAtasPkp : pphAtasPkp * (1 + settings.npwpSurcharge))

  const pphDipotong = sum('pph21')          // what payroll actually withheld
  const selisih = Math.round(pphTerutang - pphDipotong) // + kurang potong, - lebih potong

  return {
    empId: employee?.id ?? slips[0]?.empId,
    nama: employee?.name ?? slips[0]?.name ?? '',
    npwp: employee?.npwp || '',
    nik: employee?.nik || '',
    jabatan: employee?.position || '',
    alamat: employee?.address || '',
    year,
    masaDari, masaSampai, jumlahBulan,
    ptkpStatus, hasNpwp,
    // form lines
    gajiPokok, tunjangan, lembur, premiPemberiKerja, bruto,
    biayaJabatan: Math.round(biayaJabatan), iuranPensiun, totalPengurangan: Math.round(totalPengurangan),
    neto: Math.round(neto), ptkp, pkp,
    pphTerutang, pphDipotong: Math.round(pphDipotong), selisih,
    slips,
  }
}

/** Build the 1721-A1 for every employee that has payslips in `year`. */
export function buildAllBuktiPotong({ payslips, year, employees = [], settings }) {
  const inYear = payslips.filter(p => p.period.startsWith(year))
  const byEmp = new Map()
  inYear.forEach(p => {
    if (!byEmp.has(p.empId)) byEmp.set(p.empId, [])
    byEmp.get(p.empId).push(p)
  })
  return [...byEmp.entries()]
    .map(([empId, rows]) => buildBuktiPotong({
      rows, year, employee: employees.find(e => e.id === empId), settings,
    }))
    .sort((a, b) => a.nama.localeCompare(b.nama))
}

// Nomor bukti potong — 1721-A1 uses a running number per employer per year.
// Format: 1.1-MM.YY-NNNNNNN (the shape DJP's e-Bupot/Coretax expects).
export const nomorBuktiPotong = (year, index) =>
  `1.1-12.${String(year).slice(2)}-${String(index + 1).padStart(7, '0')}`

/* ── CSV export ─────────────────────────────────────────────────────────── */
const CSV_HEADERS = [
  'No Bukti Potong', 'NPWP', 'NIK', 'Nama', 'Jabatan', 'Status PTKP',
  'Masa Dari', 'Masa Sampai', 'Gaji Pokok', 'Tunjangan', 'Lembur',
  'Premi Pemberi Kerja', 'Penghasilan Bruto', 'Biaya Jabatan', 'Iuran Pensiun/JHT',
  'Jumlah Pengurangan', 'Penghasilan Neto', 'PTKP', 'PKP',
  'PPh 21 Terutang', 'PPh 21 Dipotong', 'Selisih',
]

const csvCell = (v) => {
  const s = String(v ?? '')
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function buktiPotongToCsv(list, year) {
  const lines = [CSV_HEADERS.join(';')]
  list.forEach((b, i) => {
    lines.push([
      nomorBuktiPotong(year, i), b.npwp, b.nik, b.nama, b.jabatan, b.ptkpStatus,
      `${b.masaDari}`.padStart(2, '0'), `${b.masaSampai}`.padStart(2, '0'),
      b.gajiPokok, b.tunjangan, b.lembur, b.premiPemberiKerja, b.bruto,
      b.biayaJabatan, b.iuranPensiun, b.totalPengurangan,
      b.neto, b.ptkp, b.pkp, b.pphTerutang, b.pphDipotong, b.selisih,
    ].map(csvCell).join(';'))
  })
  // BOM so Excel (id-ID) opens the semicolon-separated file correctly.
  return '﻿' + lines.join('\r\n')
}
