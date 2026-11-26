// Generates the fictional Thelorry demo dataset (single legal employer, fleet company, many drivers).
// Deterministic: the same seed always yields the same JSON. Run: node generate.mjs
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT = dirname(fileURLToPath(import.meta.url))
const DOMAIN = 'thelorry-demo.id'

function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = rng(20261126)
const pick = (arr) => arr[Math.floor(rand() * arr.length)]
const between = (lo, hi) => lo + Math.floor(rand() * (hi - lo + 1))

const MALE = ['Budi', 'Agus', 'Eko', 'Hendra', 'Slamet', 'Wahyu', 'Yusuf', 'Rizky', 'Dedi', 'Joko', 'Andi', 'Bambang', 'Fajar', 'Gunawan', 'Heru', 'Imam', 'Kurniawan', 'Lukman', 'Maman', 'Nanda', 'Oki', 'Parjo', 'Rudi', 'Sugeng', 'Taufik', 'Untung', 'Wawan', 'Yanto', 'Zainal', 'Arief', 'Bagus', 'Candra', 'Dimas', 'Edi', 'Faisal', 'Gilang', 'Hasan', 'Irfan', 'Jaya', 'Krisna', 'Lutfi', 'Mulyadi', 'Novan', 'Prasetyo', 'Ridwan', 'Sutrisno', 'Tri', 'Usman', 'Vino', 'Yogi']
const FEMALE = ['Sri', 'Ratna', 'Dewi', 'Rina', 'Siti', 'Wulan', 'Ayu', 'Fitri', 'Lestari', 'Maya', 'Nur', 'Putri', 'Rani', 'Sari', 'Tika', 'Utami', 'Vina', 'Yuni']
const SURNAME = ['Santoso', 'Wijaya', 'Pratama', 'Saputra', 'Hidayat', 'Nugroho', 'Setiawan', 'Kusuma', 'Siregar', 'Nasution', 'Simanjuntak', 'Harahap', 'Lubis', 'Hutapea', 'Sihombing', 'Purnomo', 'Suryadi', 'Rahman', 'Ramadhan', 'Firmansyah', 'Susanto', 'Wibowo', 'Aditya', 'Permana', 'Gunadi', 'Hakim', 'Maulana', 'Kurnia', 'Utomo', 'Yulianto']

const usedNames = new Set()
function personName(female) {
  for (let i = 0; i < 500; i++) {
    const n = `${pick(female ? FEMALE : MALE)} ${pick(SURNAME)}`
    if (!usedNames.has(n)) { usedNames.add(n); return n }
  }
  throw new Error('out of names')
}

// ─── Structure ───────────────────────────────────────────────────────────
const enterprises = [{ id: 1, code: 'ENT001', name: 'Thelorry', country: 'Indonesia', industry: 'Logistik dan Manajemen Armada', status: 'Active' }]
const divisions = [{ id: 1, enterpriseId: 1, code: 'DIV001', name: 'Thelorry Indonesia', headName: '', status: 'Active' }]
const companies = [{ id: 1, divisionId: 1, code: 'CO001', companyCode: 'THL', name: 'PT Thelorry Indonesia', legalEntity: 'PT', country: 'Indonesia', status: 'Active', emailDomain: DOMAIN }]

const DEPOTS = [
  { key: 'JKT', city: 'Jakarta', name: 'Depot Jakarta (Cakung)', buId: 2, deptBase: 7 },
  { key: 'SBY', city: 'Surabaya', name: 'Depot Surabaya (Rungkut)', buId: 3, deptBase: 12 },
  { key: 'SMG', city: 'Semarang', name: 'Depot Semarang (Kaligawe)', buId: 4, deptBase: 17 },
]
const businessUnits = [
  { id: 1, companyId: 1, code: 'BU001', name: 'Kantor Pusat (Jakarta)', costCenter: 'CC-001', status: 'Active' },
  ...DEPOTS.map((d) => ({ id: d.buId, companyId: 1, code: `BU00${d.buId}`, name: d.name, costCenter: `CC-00${d.buId}`, status: 'Active' })),
]

const HQ_DEPTS = ['Direksi', 'Operasi dan Armada', 'Keselamatan dan Kepatuhan (HSE)', 'Keuangan', 'SDM dan Umum', 'Komersial dan Layanan Pelanggan']
const DEPOT_DEPTS = ['Dispatch dan Kontrol', 'Driver Linehaul (Jarak Jauh)', 'Driver Distribusi (Dalam Kota)', 'Kernet dan Helper', 'Workshop Armada']
const departments = []
HQ_DEPTS.forEach((n, i) => departments.push({ id: i + 1, businessUnitId: 1, code: `DEPT${String(i + 1).padStart(3, '0')}`, name: n, status: 'Active' }))
DEPOTS.forEach((d) => DEPOT_DEPTS.forEach((n, i) => {
  const id = d.deptBase + i
  departments.push({ id, businessUnitId: d.buId, code: `DEPT${String(id).padStart(3, '0')}`, name: `${n} - ${d.city}`, status: 'Active' })
}))

// IT department added last so every existing department id stays unchanged
departments.push({ id: 22, businessUnitId: 1, code: 'DEPT022', name: 'Teknologi Informasi (IT)', status: 'Active' })

const jobFamilies = [
  { id: 1, code: 'JF001', name: 'Management', description: 'Direksi, general manager, manajer, kepala depot', status: 'Active' },
  { id: 2, code: 'JF002', name: 'Driver', description: 'Pengemudi linehaul (jarak jauh) dan distribusi (dalam kota)', status: 'Active' },
  { id: 3, code: 'JF003', name: 'Operations Support', description: 'Dispatcher, supervisor operasi, kernet dan helper', status: 'Active' },
  { id: 4, code: 'JF004', name: 'Technical', description: 'Mekanik dan workshop armada', status: 'Active' },
  { id: 5, code: 'JF005', name: 'Staff', description: 'Staf keuangan, SDM, umum, komersial, HSE, dan admin', status: 'Active' },
]

const M = 1000000
const GRADE_ROWS = [
  [1, 'T1', 'Kernet / Helper', 5.6, 6.8],
  [2, 'D1', 'Driver Distribusi Junior', 6.0, 7.2],
  [3, 'D2', 'Driver Distribusi', 6.5, 8.0],
  [4, 'D3', 'Driver Linehaul', 7.5, 9.5],
  [5, 'D4', 'Driver Linehaul Senior', 9.0, 11.0],
  [6, 'S1', 'Staf / Dispatcher / Mekanik', 6.5, 10.0],
  [7, 'S2', 'Supervisor / Kepala Depot', 11.0, 16.0],
  [8, 'M1', 'Manajer / General Manager', 16.0, 28.0],
  [9, 'E1', 'Direksi', 30.0, 60.0],
]
const grades = GRADE_ROWS.map(([id, code, name, lo, hi]) => ({
  id, code, pc: id, name, category: id <= 5 ? 'Armada' : id <= 6 ? 'Staf' : 'Manajerial',
  minSalary: Math.round(lo * M), maxSalary: Math.round(hi * M),
  isBoard: id === 9, isIntern: false, isNonMgr: id <= 6, isMgr: id >= 7 && id <= 8,
}))

// Position templates. [key, name, deptOffset|hqDeptId, jobFamilyId, gradeId, basic salary (Rp), fixed allowance (Rp)]
const HQ_POS = [
  ['dirut', 'Direktur Utama', 1, 1, 9, 45 * M, 0],
  ['dirops', 'Direktur Operasi', 1, 1, 9, 38 * M, 0],
  ['gmops', 'General Manager Operasi', 2, 1, 8, 26 * M, 0],
  ['mgrfleet', 'Manajer Armada dan Aset', 2, 1, 8, 21 * M, 0],
  ['planner', 'Fleet Planner', 2, 5, 6, 9 * M, 600000],
  ['tower', 'Control Tower Analyst', 2, 5, 6, 8.5 * M, 600000],
  ['mgrhse', 'Manajer HSE', 3, 1, 8, 19 * M, 0],
  ['hseoff', 'Safety dan Compliance Officer', 3, 5, 6, 8.5 * M, 500000],
  ['trainer', 'Driver Trainer', 3, 2, 5, 10 * M, 1000000],
  ['mgrfin', 'Finance Manager', 4, 1, 8, 20 * M, 0],
  ['finstaff', 'Staf Keuangan', 4, 5, 6, 7.5 * M, 500000],
  ['payroll', 'Payroll dan Time Administrator', 4, 5, 6, 8 * M, 500000],
  ['mgrhr', 'HR dan GA Manager', 5, 1, 8, 20 * M, 0],
  ['hrofficer', 'HR Officer', 5, 5, 6, 7.8 * M, 500000],
  ['gastaff', 'GA Staff', 5, 5, 6, 6.8 * M, 400000],
  ['mgrcom', 'Commercial Manager', 6, 1, 8, 20 * M, 0],
  ['cs', 'Customer Service Staff', 6, 5, 6, 6.8 * M, 400000],
  ['ae', 'Account Executive', 6, 5, 6, 8 * M, 600000],
]
const DEPOT_POS = [
  ['head', 'Kepala Depot', 0, 1, 7, 15 * M, 1500000],
  ['spv', 'Supervisor Operasi', 0, 3, 7, 11 * M, 1000000],
  ['disp', 'Dispatcher', 0, 3, 6, 7.5 * M, 600000],
  ['adm', 'Admin Depot', 0, 5, 6, 6.6 * M, 400000],
  ['lhs', 'Driver Linehaul Senior', 1, 2, 5, 8.5 * M, 1300000],
  ['lh', 'Driver Linehaul', 1, 2, 4, 7.2 * M, 1000000],
  ['dd', 'Driver Distribusi', 2, 2, 3, 6.0 * M, 800000],
  ['ddj', 'Driver Distribusi Junior', 2, 2, 2, 5.6 * M, 600000],
  ['help', 'Kernet / Helper', 3, 3, 1, 5.3 * M, 500000],
  ['wsh', 'Kepala Workshop', 4, 4, 7, 11 * M, 1000000],
  ['mek', 'Mekanik', 4, 4, 6, 7 * M, 600000],
]

const positions = []
const posByKey = {}
let posId = 100
HQ_POS.forEach(([key, name, dept, jf, gr, basic, allow]) => {
  const p = { id: ++posId, departmentId: dept, jobFamilyId: jf, gradeId: gr, code: `POS${String(posId).padStart(3, '0')}`, name, status: 'Active' }
  positions.push(p); posByKey[key] = { ...p, basic, allow }
})
DEPOTS.forEach((d) => DEPOT_POS.forEach(([key, name, off, jf, gr, basic, allow]) => {
  const p = { id: ++posId, departmentId: d.deptBase + off, jobFamilyId: jf, gradeId: gr, code: `POS${String(posId).padStart(3, '0')}`, name, status: 'Active' }
  positions.push(p); posByKey[`${d.key}.${key}`] = { ...p, basic, allow }
}))
// IT Support position appended last so existing position ids stay unchanged
{
  const p = { id: ++posId, departmentId: 22, jobFamilyId: 5, gradeId: 6, code: `POS${String(posId).padStart(3, '0')}`, name: 'IT Support', status: 'Active' }
  positions.push(p); posByKey.it = { ...p, basic: 8 * M, allow: 500000 }
}

// ─── People ──────────────────────────────────────────────────────────────
// Headcount plan per depot: [position key, employees, vacant seats]
const PLAN = {
  JKT: { head: [1, 0], spv: [2, 0], disp: [6, 0], adm: [2, 0], lhs: [6, 0], lh: [22, 3], dd: [18, 2], ddj: [6, 0], help: [18, 2], wsh: [1, 0], mek: [5, 0] },
  SBY: { head: [1, 0], spv: [1, 0], disp: [4, 0], adm: [1, 0], lhs: [4, 0], lh: [14, 2], dd: [11, 1], ddj: [4, 0], help: [12, 0], wsh: [1, 0], mek: [4, 0] },
  SMG: { head: [1, 0], spv: [1, 0], disp: [3, 0], adm: [1, 0], lhs: [2, 0], lh: [8, 1], dd: [8, 1], ddj: [3, 0], help: [8, 1], wsh: [1, 0], mek: [3, 0] },
}

const employees = []
const driverProfiles = []
const compensation = []
const seats = []
let empId = 1000
const handles = new Set()

function joinDate(minYear, maxYear) {
  const y = between(minYear, maxYear); const m = between(1, 12); const d = between(1, 28)
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}
function birthDate(minAge, maxAge) {
  const y = 2026 - between(minAge, maxAge); const m = between(1, 12); const d = between(1, 28)
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}
function addEmployee({ posKey, managerId, role, city, female = false, handle, contractShare = 0, ages = [24, 52], join = [2019, 2026] }) {
  const pos = posByKey[posKey]
  const dept = departments.find((x) => x.id === pos.departmentId)
  const bu = businessUnits.find((x) => x.id === dept.businessUnitId)
  const id = ++empId
  const name = personName(female)
  const contract = rand() < contractShare
  const jd = contract ? joinDate(2025, 2026) : joinDate(join[0], join[1])
  const e = {
    id, name, managerId: managerId ?? null, status: 'Active', joinDate: jd,
    companyId: 1, businessUnitId: bu.id, departmentId: dept.id, positionId: pos.id,
    employmentType: contract ? 'Contract' : 'Permanent', department: dept.name, position: pos.name,
    nik: `THL-${String(id).padStart(5, '0')}`,
    email: `${(handle || `${name.toLowerCase().replace(/[^a-z]+/g, '.')}${id}`)}@${DOMAIN}`,
    gender: female ? 'Female' : 'Male', birthDate: birthDate(ages[0], ages[1]), religion: '', maritalStatus: '',
    birthPlace: '', nationality: 'Indonesia', city, country: 'Indonesia', location: bu.name,
    phone: `0812-5000-${String(1000 + id % 9000)}`, role: role || 'employee',
    gradeId: pos.gradeId, individualClassId: pos.gradeId,
    salary: pos.basic,
  }
  employees.push(e)
  compensation.push({ employeeId: id, basicSalary: pos.basic, fixedAllowance: pos.allow, monthlyWage: pos.basic + pos.allow })
  return e
}

// HQ management and staff
const dirut = addEmployee({ posKey: 'dirut', role: 'superadmin', city: 'Jakarta', handle: 'direktur.utama', ages: [48, 56], join: [2015, 2018] })
const dirops = addEmployee({ posKey: 'dirops', managerId: dirut.id, role: 'manager', city: 'Jakarta', handle: 'direktur.operasi', ages: [46, 54], join: [2016, 2019] })
const gmops = addEmployee({ posKey: 'gmops', managerId: dirops.id, role: 'manager', city: 'Jakarta', handle: 'gm.operasi', ages: [42, 50], join: [2017, 2020] })
const mgrfleet = addEmployee({ posKey: 'mgrfleet', managerId: gmops.id, role: 'manager', city: 'Jakarta', handle: 'mgr.armada', ages: [38, 48], join: [2018, 2021] })
addEmployee({ posKey: 'planner', managerId: mgrfleet.id, city: 'Jakarta', handle: 'fleet.planner' })
addEmployee({ posKey: 'planner', managerId: mgrfleet.id, city: 'Jakarta', female: true })
addEmployee({ posKey: 'tower', managerId: gmops.id, city: 'Jakarta', handle: 'control.tower' })
addEmployee({ posKey: 'tower', managerId: gmops.id, city: 'Jakarta' })
const mgrhse = addEmployee({ posKey: 'mgrhse', managerId: dirops.id, role: 'manager', city: 'Jakarta', handle: 'mgr.hse', ages: [38, 48], join: [2018, 2021] })
addEmployee({ posKey: 'hseoff', managerId: mgrhse.id, city: 'Jakarta', handle: 'hse.officer' })
addEmployee({ posKey: 'trainer', managerId: mgrhse.id, city: 'Jakarta', handle: 'driver.trainer', ages: [38, 50] })
const mgrfin = addEmployee({ posKey: 'mgrfin', managerId: dirut.id, role: 'manager', city: 'Jakarta', handle: 'mgr.keuangan', ages: [38, 48], join: [2018, 2021] })
addEmployee({ posKey: 'finstaff', managerId: mgrfin.id, city: 'Jakarta', female: true })
addEmployee({ posKey: 'payroll', managerId: mgrfin.id, role: 'hr_officer', city: 'Jakarta', female: true, handle: 'payroll.admin' })
const mgrhr = addEmployee({ posKey: 'mgrhr', managerId: dirut.id, role: 'hr_manager', city: 'Jakarta', female: true, handle: 'mgr.hr', ages: [38, 48], join: [2018, 2021] })
addEmployee({ posKey: 'hrofficer', managerId: mgrhr.id, role: 'hr_officer', city: 'Jakarta', female: true, handle: 'hr.officer' })
addEmployee({ posKey: 'hrofficer', managerId: mgrhr.id, role: 'hr_officer', city: 'Jakarta' })
addEmployee({ posKey: 'gastaff', managerId: mgrhr.id, city: 'Jakarta' })
const mgrcom = addEmployee({ posKey: 'mgrcom', managerId: dirut.id, role: 'manager', city: 'Jakarta', handle: 'mgr.komersial', ages: [38, 48], join: [2018, 2021] })
addEmployee({ posKey: 'cs', managerId: mgrcom.id, city: 'Jakarta', female: true })
addEmployee({ posKey: 'cs', managerId: mgrcom.id, city: 'Jakarta', female: true })
addEmployee({ posKey: 'ae', managerId: mgrcom.id, city: 'Jakarta' })

// Depots
const sampleHandles = { JKT: 'jkt', SBY: 'sby', SMG: 'smg' }
DEPOTS.forEach((d) => {
  const plan = PLAN[d.key]
  const k = (x) => `${d.key}.${x}`
  const head = addEmployee({ posKey: k('head'), managerId: gmops.id, role: 'manager', city: d.city, handle: `kepala.${sampleHandles[d.key]}`, ages: [38, 50], join: [2017, 2021] })
  const spvs = []
  for (let i = 0; i < plan.spv[0]; i++) spvs.push(addEmployee({ posKey: k('spv'), managerId: head.id, role: 'manager', city: d.city, handle: i === 0 ? `spv.${sampleHandles[d.key]}` : undefined, ages: [34, 48], join: [2018, 2022] }))
  const spvOf = (i) => spvs[i % spvs.length]
  for (let i = 0; i < plan.disp[0]; i++) addEmployee({ posKey: k('disp'), managerId: spvOf(i).id, city: d.city, female: i % 3 === 2, handle: i === 0 ? `dispatch.${sampleHandles[d.key]}` : undefined, ages: [24, 40], join: [2020, 2025] })
  for (let i = 0; i < plan.adm[0]; i++) addEmployee({ posKey: k('adm'), managerId: head.id, city: d.city, female: true, ages: [24, 40], join: [2020, 2025] })
  const wsh = addEmployee({ posKey: k('wsh'), managerId: head.id, role: 'manager', city: d.city, ages: [38, 52], join: [2017, 2021] })
  for (let i = 0; i < plan.mek[0]; i++) addEmployee({ posKey: k('mek'), managerId: wsh.id, city: d.city, ages: [24, 48], join: [2019, 2025] })
  let n = 0
  const driverTypes = [['lhs', 'LH-S'], ['lh', 'LH'], ['dd', 'DD'], ['ddj', 'DD-J'], ['help', 'HLP']]
  driverTypes.forEach(([key, tag]) => {
    for (let i = 0; i < plan[key][0]; i++) {
      const sup = spvOf(n++)
      const isDriver = key !== 'help'
      const e = addEmployee({
        posKey: k(key), managerId: sup.id, city: d.city,
        handle: i === 0 ? `${key === 'help' ? 'helper' : key === 'lhs' ? 'driver.lhs' : key === 'lh' ? 'driver.lh' : key === 'dd' ? 'driver.dd' : 'driver.ddj'}.${sampleHandles[d.key]}` : undefined,
        contractShare: key === 'lhs' ? 0 : key === 'lh' ? 0.2 : 0.3, ages: isDriver ? [25, 55] : [20, 45], join: [2019, 2026],
      })
      if (isDriver) {
        const longHaul = key === 'lh' || key === 'lhs'
        driverProfiles.push({
          employeeId: e.id, licenseClass: longHaul ? 'SIM B2 Umum' : (key === 'dd' ? 'SIM B1 Umum' : 'SIM B1'), licenseExpiry: `${between(2027, 2031)}-${String(between(1, 12)).padStart(2, '0')}-${String(between(1, 28)).padStart(2, '0')}`,
          routeType: longHaul ? 'Linehaul antar kota' : 'Distribusi dalam kota', vehicleClass: longHaul ? (key === 'lhs' ? 'Tronton / Trailer' : 'Fuso / CDE-Wingbox') : (key === 'dd' ? 'CDD' : 'Blind Van / Pickup'),
          homeDepot: d.name, tag,
        })
      }
    }
  })
  // Vacant seats are added in buildHeadcounts
})

// IT Support employee (holder of the admin login) - created last so no earlier random draw shifts
const itSupport = addEmployee({ posKey: 'it', managerId: mgrhr.id, role: 'superadmin', city: 'Jakarta', handle: 'admin', ages: [26, 36], join: [2021, 2024] })

// ─── Extra named logins for demo scenarios ──────────────────────────────
// Only the email handle (and for the PKWT driver, the supervisor) changes; no random draw is involved,
// so every name, NIK and id stays exactly as before.
const setHandle = (e, handle) => { if (e) e.email = `${handle}@${DOMAIN}` }
const jktPos = (key) => posByKey[`JKT.${key}`].id
const spvJkt = employees.find((e) => e.email.startsWith('spv.jkt@'))
let pkwt = employees.find((e) => e.positionId === jktPos('lh') && e.employmentType === 'Contract' && e.managerId === spvJkt.id)
if (!pkwt) {
  pkwt = employees.find((e) => e.positionId === jktPos('lh') && e.employmentType === 'Contract') || employees.filter((e) => e.positionId === jktPos('lh')).pop()
  pkwt.employmentType = 'Contract'; pkwt.joinDate = '2026-03-02'; pkwt.managerId = spvJkt.id
}
setHandle(pkwt, 'driver.pkwt.jkt')
setHandle(employees.find((e) => e.positionId === jktPos('mek')), 'mekanik.jkt')
setHandle(employees.find((e) => e.positionId === jktPos('wsh')), 'wsh.jkt')
setHandle(employees.find((e) => e.positionId === jktPos('adm')), 'admin.depot.jkt')
setHandle(employees.find((e) => e.positionId === posByKey.finstaff.id), 'finance.staff')
setHandle(employees.find((e) => e.positionId === posByKey.cs.id), 'cs.komersial')

// ─── Headcounts: one seat per employee + open seats ─────────────────────
const empsByPos = {}
employees.forEach((e) => { (empsByPos[e.positionId] ||= []).push(e) })
const seatOfEmp = {}
let hcId = 0
const headcounts = []
const nameCounter = {}
const addSeat = (positionId, employeeId, supEmp) => {
  const pos = positions.find((p) => p.id === positionId)
  nameCounter[positionId] = (nameCounter[positionId] || 0) + 1
  const h = { id: ++hcId, positionId, code: `HC${String(hcId).padStart(4, '0')}`, name: `${pos.name} ${String(nameCounter[positionId]).padStart(2, '0')}`, employeeId, supervisorHeadcountId: null, status: 'Active', _sup: supEmp }
  headcounts.push(h)
  if (employeeId) seatOfEmp[employeeId] = h.id
}
positions.filter((p) => p.id !== posByKey.it.id).forEach((p) => (empsByPos[p.id] || []).forEach((e) => addSeat(p.id, e.id, e.managerId)))
DEPOTS.forEach((d) => {
  const head = employees.find((e) => e.positionId === posByKey[`${d.key}.head`].id)
  const spv = employees.find((e) => e.positionId === posByKey[`${d.key}.spv`].id)
  ;['lh', 'dd', 'help'].forEach((key) => {
    for (let i = 0; i < PLAN[d.key][key][1]; i++) addSeat(posByKey[`${d.key}.${key}`].id, null, spv?.id ?? head.id)
  })
})
// IT Support seat appended after the vacant seats so existing seat ids stay unchanged
addSeat(posByKey.it.id, itSupport.id, itSupport.managerId)
headcounts.forEach((h) => { h.supervisorHeadcountId = h._sup ? (seatOfEmp[h._sup] ?? null) : null; delete h._sup })

// ─── Users (key roles and a few sample drivers have a login) ────────────
const users = employees.filter((e) => /^(direktur|gm\.|mgr\.|fleet|control|hse|driver|hr\.|payroll|kepala|spv|dispatch|helper|mekanik|wsh|admin\.|finance|cs\.)/.test(e.email.split('@')[0]))
  .map((e) => ({ id: e.id, employeeId: e.id, username: e.email.split('@')[0], password: 'pass123', name: e.name, role: e.role, dept: e.department, position: e.position, email: e.email }))
users.push({ id: itSupport.id, employeeId: itSupport.id, username: 'admin', password: 'pass123', name: itSupport.name, role: 'superadmin', dept: itSupport.department, position: itSupport.position, email: itSupport.email })

// ─── Time & Labor ───────────────────────────────────────────────────────
const shifts = [
  { id: 1, name: 'Distribusi Pagi', startTime: '07:00', endTime: '16:00', breakMinutes: 60 },
  { id: 2, name: 'Distribusi Siang', startTime: '12:00', endTime: '21:00', breakMinutes: 60 },
  { id: 3, name: 'Linehaul Malam', startTime: '20:00', endTime: '05:00', breakMinutes: 60 },
  { id: 4, name: 'Kantor', startTime: '08:00', endTime: '17:00', breakMinutes: 60 },
  { id: 5, name: 'Dispatch Pagi', startTime: '06:00', endTime: '15:00', breakMinutes: 60 },
  { id: 6, name: 'Dispatch Siang', startTime: '14:00', endTime: '23:00', breakMinutes: 60 },
  { id: 7, name: 'Dispatch Malam', startTime: '22:00', endTime: '07:00', breakMinutes: 60 },
]
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const patterns = [
  { id: 1, name: 'Distribusi Pagi 5 Hari', entries: WEEKDAYS.map((day) => ({ day, shiftId: 1 })) },
  { id: 2, name: 'Distribusi Siang 5 Hari', entries: WEEKDAYS.map((day) => ({ day, shiftId: 2 })) },
  { id: 3, name: 'Linehaul Malam 5 Hari', entries: WEEKDAYS.map((day) => ({ day, shiftId: 3 })) },
  { id: 4, name: 'Kantor 5 Hari', entries: WEEKDAYS.map((day) => ({ day, shiftId: 4 })) },
  { id: 5, name: 'Dispatch Rotasi 3 Shift', entries: [
    { day: 'Monday', shiftId: 5 }, { day: 'Tuesday', shiftId: 5 }, { day: 'Wednesday', shiftId: 6 },
    { day: 'Thursday', shiftId: 6 }, { day: 'Friday', shiftId: 7 }, { day: 'Saturday', shiftId: 7 },
  ] },
]
const schedules = [
  { id: 1, name: 'Driver Distribusi Pagi', patternId: 1, effectiveDate: '2026-12-01' },
  { id: 2, name: 'Driver Distribusi Siang', patternId: 2, effectiveDate: '2026-12-01' },
  { id: 3, name: 'Driver Linehaul Malam', patternId: 3, effectiveDate: '2026-12-01' },
  { id: 4, name: 'Kantor dan Workshop', patternId: 4, effectiveDate: '2026-12-01' },
  { id: 5, name: 'Dispatcher Rotasi', patternId: 5, effectiveDate: '2026-12-01' },
]
const scheduleFor = (e) => {
  const key = Object.entries(posByKey).find(([, p]) => p.id === e.positionId)?.[0] || ''
  const base = key.split('.').pop()
  if (['dirut', 'dirops', 'gmops'].includes(base)) return null
  if (base === 'lh' || base === 'lhs') return 3
  if (base === 'dd' || base === 'ddj' || base === 'help') return e.id % 2 === 0 ? 1 : 2
  if (base === 'disp') return 5
  return 4
}
const assignments = employees.map((e) => ({ e, s: scheduleFor(e) })).filter((x) => x.s)
  .map(({ e, s }, i) => ({ id: i + 1, userId: e.id, name: e.name, scheduleId: s, startDate: '2026-12-01' }))

// ─── Overtime policy (Eligibility Groups and Matrices) ──────────────────
// Hourly wage W = monthly wage / 173 (PP 35/2021). Rates are per wage class, rounded to Rp 10.
const CLASSES = [
  { code: 'HLP', name: 'Kernet / Helper', wage: 5800000 },
  { code: 'DD', name: 'Driver Distribusi', wage: 6800000 },
  { code: 'LH', name: 'Driver Linehaul', wage: 8200000 },
  { code: 'LHS', name: 'Driver Linehaul Senior', wage: 9800000 },
  { code: 'STF', name: 'Staf Operasi / Mekanik', wage: 7600000 },
]
const r10 = (x) => Math.round(x / 10) * 10
const matrices = []
let mxId = 0; let tierId = 0
const tier = (hourFrom, hourTo, rate) => ({ id: ++tierId, hourFrom, hourTo, rate })
CLASSES.forEach((c) => {
  const w = c.wage / 173
  matrices.push({
    id: ++mxId, name: `${c.name} - Hari Kerja`, active: true,
    tiers: [tier(1, 1, r10(1.5 * w)), tier(2, 3, r10(2 * w))],
    restMinutes: 30, roundingToleranceMinutes: 30,
    notes: `Upah sebulan contoh Rp ${c.wage.toLocaleString('id-ID')}, upah sejam = 1/173. Jam ke-1 = 1,5 x, jam ke-2 dan ke-3 = 2 x. Dibatasi 3 jam per hari (batas keselamatan pengemudi); batas hukum umum 4 jam per hari dan 18 jam per minggu.`,
    _key: `${c.code}-kerja`,
  })
})
CLASSES.forEach((c) => {
  const w = c.wage / 173
  matrices.push({
    id: ++mxId, name: `${c.name} - Hari Istirahat / Libur (5 hari kerja)`, active: true,
    tiers: [tier(1, 8, r10(2 * w)), tier(9, 9, r10(3 * w)), tier(10, 11, r10(4 * w))],
    restMinutes: 60, roundingToleranceMinutes: 30,
    notes: `Berlaku bila bekerja pada hari istirahat mingguan atau libur resmi (pola 5 hari kerja): jam ke-1 s/d 8 = 2 x, jam ke-9 = 3 x, jam ke-10 dan ke-11 = 4 x. Maksimum 11 jam kerja (12 jam termasuk istirahat 1 jam).`,
    _key: `${c.code}-libur`,
  })
})
const mxOf = (key) => matrices.find((m) => m._key === key).id
const deptIds = (offset) => DEPOTS.map((d) => d.deptBase + offset)
const eligibilityGroups = [
  { id: 1, name: 'Driver Linehaul Senior - Lembur Hari Kerja', active: true, companyIds: [1], departmentIds: deptIds(1), gradeFromId: 5, gradeToId: 5, location: '', employmentType: '', autoApprovePlan: false, autoApproveRealization: false, compensationType: 'Overtime Allowance', matrixId: mxOf('LHS-kerja'), notes: 'Plan disetujui Supervisor Operasi; realisasi disetujui Supervisor lalu HR. Lembur berdasarkan perintah tertulis (digital).' },
  { id: 2, name: 'Driver Linehaul - Lembur Hari Kerja', active: true, companyIds: [1], departmentIds: deptIds(1), gradeFromId: 4, gradeToId: 4, location: '', employmentType: '', autoApprovePlan: false, autoApproveRealization: false, compensationType: 'Overtime Allowance', matrixId: mxOf('LH-kerja'), notes: '' },
  { id: 3, name: 'Driver Distribusi - Lembur Hari Kerja', active: true, companyIds: [1], departmentIds: deptIds(2), gradeFromId: 2, gradeToId: 3, location: '', employmentType: '', autoApprovePlan: false, autoApproveRealization: false, compensationType: 'Overtime Allowance', matrixId: mxOf('DD-kerja'), notes: 'Lembur distribusi umumnya 1 sampai 2 jam akibat antrean bongkar dan kemacetan.' },
  { id: 4, name: 'Kernet dan Helper - Lembur Hari Kerja', active: true, companyIds: [1], departmentIds: deptIds(3), gradeFromId: 1, gradeToId: 1, location: '', employmentType: '', autoApprovePlan: false, autoApproveRealization: false, compensationType: 'Overtime Allowance', matrixId: mxOf('HLP-kerja'), notes: 'Mengikuti jam lembur driver yang didampingi.' },
  { id: 5, name: 'Dispatcher, Admin dan Mekanik - Lembur Hari Kerja', active: true, companyIds: [1], departmentIds: [...deptIds(0), ...deptIds(4)], gradeFromId: 6, gradeToId: 6, location: '', employmentType: '', autoApprovePlan: false, autoApproveRealization: true, compensationType: 'Overtime Allowance', matrixId: mxOf('STF-kerja'), notes: 'Realisasi otomatis disetujui karena sudah tercatat di sistem absensi.' },
]
matrices.forEach((m) => delete m._key)

const files = {
  'structure.json': { enterprises, divisions, companies, businessUnits, departments, jobFamilies, grades, positions },
  'employees.json': employees,
  'users.json': users,
  'headcounts.json': headcounts,
  'timeLabour.json': { shifts, patterns, schedules, assignments },
  'overtime.json': { eligibilityGroups, overtimeMatrices: matrices },
  'driverProfiles.json': driverProfiles,
  'compensation.json': compensation,
}
for (const [name, data] of Object.entries(files)) writeFileSync(join(OUT, name), JSON.stringify(data, null, 2) + '\n')

const drivers = driverProfiles.length
console.log(JSON.stringify({
  employees: employees.length, drivers, helpers: employees.filter((e) => e.position === 'Kernet / Helper').length,
  headcounts: headcounts.length, vacant: headcounts.filter((h) => !h.employeeId).length,
  users: users.length, departments: departments.length, positions: positions.length,
}))
