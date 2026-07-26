// Indonesian statutory payroll calculations: BPJS Kesehatan, BPJS Ketenagakerjaan
// (JHT/JP/JKK/JKM), and PPh 21 (progressive/annualized method per UU HPP 2022 —
// the method the monthly TER withholding tables are also reconciled against at
// year-end). Rates and caps are the well-established defaults; all are exposed
// via `settings` so Payroll Settings can adjust them without touching this file.

export const PTKP_TABLE = {
  'TK/0': 54_000_000,
  'TK/1': 58_500_000,
  'TK/2': 63_000_000,
  'TK/3': 67_500_000,
  'K/0':  58_500_000,
  'K/1':  63_000_000,
  'K/2':  67_500_000,
  'K/3':  72_000_000,
}

export const PTKP_STATUSES = Object.keys(PTKP_TABLE)

// UU HPP 2022 progressive brackets — applied to annual PKP (taxable income).
export const TAX_BRACKETS = [
  { upTo: 60_000_000,          rate: 0.05 },
  { upTo: 250_000_000,         rate: 0.15 },
  { upTo: 500_000_000,         rate: 0.25 },
  { upTo: 5_000_000_000,       rate: 0.30 },
  { upTo: Infinity,            rate: 0.35 },
]

export const DEFAULT_PAYROLL_SETTINGS = {
  bpjsKesehatan: { employeeRate: 0.01, employerRate: 0.04, salaryCap: 12_000_000 },
  jht:           { employeeRate: 0.02, employerRate: 0.037 },
  jp:            { employeeRate: 0.01, employerRate: 0.02, salaryCap: 10_042_300 },
  jkk:           { employerRate: 0.0024 }, // risk level 1 (paling rendah); naikkan bila risiko kerja lebih tinggi
  jkm:           { employerRate: 0.003 },
  biayaJabatan:  { rate: 0.05, monthlyCap: 500_000 }, // PMK 250/2008, max Rp 6.000.000/tahun
  npwpSurcharge: 0.20, // Pasal 21 ayat 5a UU PPh: +20% bila tanpa NPWP
  // Identitas pemotong — dicetak di bagian C setiap bukti potong 1721-A1.
  pemotong: { npwp: '', nama: '', alamat: '', penandatanganNama: '', penandatanganNpwp: '' },
}

const round = (n) => Math.round(n)

export function calcBpjsKesehatan(baseSalary, settings) {
  const s = settings.bpjsKesehatan
  const base = Math.min(baseSalary, s.salaryCap)
  return { employee: round(base * s.employeeRate), employer: round(base * s.employerRate) }
}

export function calcJht(baseSalary, settings) {
  const s = settings.jht
  return { employee: round(baseSalary * s.employeeRate), employer: round(baseSalary * s.employerRate) }
}

export function calcJp(baseSalary, settings) {
  const s = settings.jp
  const base = Math.min(baseSalary, s.salaryCap)
  return { employee: round(base * s.employeeRate), employer: round(base * s.employerRate) }
}

export function calcJkk(baseSalary, settings) {
  return round(baseSalary * settings.jkk.employerRate)
}

export function calcJkm(baseSalary, settings) {
  return round(baseSalary * settings.jkm.employerRate)
}

// Annual progressive PPh21 on taxable income (PKP), UU HPP 2022 brackets.
export function calcAnnualTax(pkp) {
  if (pkp <= 0) return 0
  let tax = 0
  let lower = 0
  for (const b of TAX_BRACKETS) {
    if (pkp <= lower) break
    const taxableInBracket = Math.min(pkp, b.upTo) - lower
    tax += taxableInBracket * b.rate
    lower = b.upTo
  }
  return tax
}

// Monthly PPh21 withholding via the annualized-gross method: gross-up to a year,
// deduct biaya jabatan + employee JHT/JP + PTKP, tax the remainder progressively,
// then divide back by 12. This is the basis the simplified monthly TER tables
// are reconciled against every December, and stays accurate year-round.
export function calcPph21Monthly({ grossMonthly, ptkpStatus, hasNpwp, jhtEmployee, jpEmployee, settings }) {
  const annualGross = grossMonthly * 12
  const biayaJabatan = Math.min(annualGross * settings.biayaJabatan.rate, settings.biayaJabatan.monthlyCap * 12)
  const annualJht = jhtEmployee * 12
  const annualJp  = jpEmployee * 12
  const ptkp = PTKP_TABLE[ptkpStatus] ?? PTKP_TABLE['TK/0']
  const pkp = Math.max(0, round((annualGross - biayaJabatan - annualJht - annualJp - ptkp) / 1000) * 1000)
  let annualTax = calcAnnualTax(pkp)
  if (!hasNpwp) annualTax *= (1 + settings.npwpSurcharge)
  return round(annualTax / 12)
}

// Full payslip breakdown for one employee for one period.
export function calcPayslip({
  basic, allowance = 0, variableAllowance = 0, overtime = 0, otherDeduction = 0,
  ptkpStatus = 'TK/0', hasNpwp = true, bpjsKesehatan = true, bpjsTk = true,
  settings = DEFAULT_PAYROLL_SETTINGS,
}) {
  const gross = basic + allowance + variableAllowance + overtime

  const kesehatan = bpjsKesehatan ? calcBpjsKesehatan(basic, settings) : { employee: 0, employer: 0 }
  const jht       = bpjsTk        ? calcJht(basic, settings)           : { employee: 0, employer: 0 }
  const jp        = bpjsTk        ? calcJp(basic, settings)            : { employee: 0, employer: 0 }
  const jkk       = bpjsTk        ? calcJkk(basic, settings)           : 0
  const jkm       = bpjsTk        ? calcJkm(basic, settings)           : 0

  const pph21 = calcPph21Monthly({
    grossMonthly: gross, ptkpStatus, hasNpwp,
    jhtEmployee: jht.employee, jpEmployee: jp.employee, settings,
  })

  const totalDeduction = kesehatan.employee + jht.employee + jp.employee + pph21 + otherDeduction
  const net = gross - totalDeduction
  const employerCost = gross + kesehatan.employer + jht.employer + jp.employer + jkk + jkm

  return {
    basic, allowance, variableAllowance, overtime, gross,
    bpjsKesehatanEmployee: kesehatan.employee, bpjsKesehatanEmployer: kesehatan.employer,
    jhtEmployee: jht.employee, jhtEmployer: jht.employer,
    jpEmployee: jp.employee, jpEmployer: jp.employer,
    jkkEmployer: jkk, jkmEmployer: jkm,
    pph21, otherDeduction, totalDeduction, net, employerCost,
  }
}
