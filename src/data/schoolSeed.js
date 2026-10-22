// Seed for the Lia Stephanie Catholic School simulation (NEXT_PUBLIC_DEMO_PROFILE=school).
// Everything here is fictional demo data. Store files pick from this module
// when IS_SCHOOL is true; otherwise their original corporate seed is used.

// ─── Structure ───────────────────────────────────────────────────────────────
export const SCHOOL_ENTERPRISES = [
  { id:1, code:'ENT001', name:'Yayasan Lia Stephanie', country:'Indonesia', industry:'Pendidikan', status:'Active' },
]

export const SCHOOL_DIVISIONS = [
  { id:1, enterpriseId:1, code:'DIV001', name:'Pengurus dan Dewan', headName:'', status:'Active' },
  { id:2, enterpriseId:1, code:'DIV002', name:'Operasional Sekolah', headName:'', status:'Active' },
]

export const SCHOOL_COMPANIES = [
  { id:1, divisionId:2, code:'CO001', companyCode:'LSCS', name:'Lia Stephanie Catholic School', legalEntity:'Yayasan', country:'Indonesia', status:'Active', emailDomain:'lscs-demo.sch.id' },
  { id:2, divisionId:1, code:'CO002', companyCode:'YLS',  name:'Yayasan Lia Stephanie',        legalEntity:'Yayasan', country:'Indonesia', status:'Active', emailDomain:'lscs-demo.sch.id' },
]

export const SCHOOL_BUSINESS_UNITS = [
  { id:1, companyId:2, code:'BU001', name:'Pengurus Yayasan',        costCenter:'CC-001', status:'Active' },
  { id:2, companyId:2, code:'BU002', name:'Dewan Sekolah',           costCenter:'CC-002', status:'Active' },
  { id:3, companyId:1, code:'BU003', name:'TK',                      costCenter:'CC-003', status:'Active' },
  { id:4, companyId:1, code:'BU004', name:'SD',                      costCenter:'CC-004', status:'Active' },
  { id:5, companyId:1, code:'BU005', name:'SMP',                     costCenter:'CC-005', status:'Active' },
  { id:6, companyId:1, code:'BU006', name:'SMA',                     costCenter:'CC-006', status:'Active' },
  { id:7, companyId:1, code:'BU007', name:'Pastoral dan Kesiswaan',  costCenter:'CC-007', status:'Active' },
  { id:8, companyId:1, code:'BU008', name:'Tata Usaha dan Keuangan', costCenter:'CC-008', status:'Active' },
  { id:9, companyId:1, code:'BU009', name:'Sarana dan Umum',         costCenter:'CC-009', status:'Active' },
]

export const SCHOOL_DEPARTMENTS = [
  { id:1,  businessUnitId:1, code:'DEPT001', name:'Pengurus Yayasan',      status:'Active' },
  { id:2,  businessUnitId:2, code:'DEPT002', name:'Dewan Sekolah',         status:'Active' },
  { id:3,  businessUnitId:3, code:'DEPT003', name:'Akademik TK',           status:'Active' },
  { id:4,  businessUnitId:4, code:'DEPT004', name:'Akademik SD',           status:'Active' },
  { id:5,  businessUnitId:5, code:'DEPT005', name:'Akademik SMP',          status:'Active' },
  { id:6,  businessUnitId:6, code:'DEPT006', name:'Akademik SMA',          status:'Active' },
  { id:7,  businessUnitId:7, code:'DEPT007', name:'Pastoral',              status:'Active' },
  { id:8,  businessUnitId:7, code:'DEPT008', name:'Bimbingan Konseling',   status:'Active' },
  { id:9,  businessUnitId:8, code:'DEPT009', name:'Tata Usaha',            status:'Active' },
  { id:10, businessUnitId:8, code:'DEPT010', name:'Keuangan',              status:'Active' },
  { id:11, businessUnitId:8, code:'DEPT011', name:'Sumber Daya Manusia',   status:'Active' },
  { id:12, businessUnitId:9, code:'DEPT012', name:'Kebersihan',            status:'Active' },
  { id:13, businessUnitId:9, code:'DEPT013', name:'Keamanan',              status:'Active' },
  { id:14, businessUnitId:9, code:'DEPT014', name:'Transportasi',          status:'Active' },
  { id:15, businessUnitId:9, code:'DEPT015', name:'Teknologi Informasi',   status:'Active' },
]

export const SCHOOL_JOB_FAMILIES = [
  { id:1, code:'JF001', name:'Pimpinan dan Pembina',  description:'Dewan sekolah, pengurus yayasan, dan kepala sekolah', status:'Active' },
  { id:2, code:'JF002', name:'Pendidik',              description:'Guru kelas, guru mata pelajaran, guru agama, konselor', status:'Active' },
  { id:3, code:'JF003', name:'Tenaga Kependidikan',   description:'Tata usaha, keuangan, perpustakaan, dan SDM', status:'Active' },
  { id:4, code:'JF004', name:'Layanan Umum',          description:'Kebersihan, keamanan, transportasi, dan teknisi', status:'Active' },
]

// Salary ranges per grade level (IDR/month). Only these Mercer PC levels are
// kept in the school profile; the default payroll basic is each range's midpoint.
export const SCHOOL_GRADES = {
  5:  { name:'Staf Pelaksana I',      min:5400000,  max:6200000 },
  7:  { name:'Staf Pelaksana II',     min:5600000,  max:6800000 },
  10: { name:'Guru Honorer',          min:5500000,  max:8000000 },
  13: { name:'Staf Administrasi',     min:6000000,  max:8500000 },
  15: { name:'Teknisi',               min:7000000,  max:10000000 },
  20: { name:'Guru Pratama',          min:7500000,  max:11000000 },
  25: { name:'Guru Madya',            min:9000000,  max:14000000 },
  46: { name:'Koordinator',           min:12000000, max:17000000 },
  53: { name:'Wakil Kepala / Manajer',min:15000000, max:22000000 },
  57: { name:'Sekretaris / Senior',   min:20000000, max:28000000 },
  58: { name:'Kepala Sekolah',        min:22000000, max:32000000 },
  62: { name:'Anggota Dewan',         min:30000000, max:45000000 },
  70: { name:'Ketua Dewan Sekolah',   min:40000000, max:60000000 },
  72: { name:'Ketua Yayasan',         min:50000000, max:80000000 },
}

// [id, departmentId, jobFamilyId, gradeId, name]
const POSITION_ROWS = [
  [1,  1, 1, 72, 'Ketua Yayasan'],
  [2,  1, 1, 57, 'Sekretaris Yayasan'],
  [3,  2, 1, 70, 'Ketua Dewan Sekolah'],
  [4,  2, 1, 62, 'Anggota Dewan Sekolah'],
  [5,  3, 1, 58, 'Kepala Sekolah TK'],
  [6,  3, 2, 20, 'Guru TK'],
  [7,  4, 1, 58, 'Kepala Sekolah SD'],
  [8,  4, 2, 20, 'Guru Kelas SD'],
  [9,  5, 1, 58, 'Kepala Sekolah SMP'],
  [10, 5, 1, 53, 'Wakil Kepala Sekolah SMP'],
  [11, 5, 2, 20, 'Guru Matematika SMP'],
  [12, 5, 2, 20, 'Guru Bahasa Inggris SMP'],
  [13, 5, 2, 20, 'Guru IPA SMP'],
  [14, 5, 2, 10, 'Guru Honorer SMP'],
  [15, 6, 1, 58, 'Kepala Sekolah SMA'],
  [16, 6, 1, 53, 'Wakil Kepala Sekolah SMA'],
  [17, 6, 2, 25, 'Guru Matematika SMA'],
  [18, 6, 2, 25, 'Guru Fisika SMA'],
  [19, 6, 2, 10, 'Guru Honorer SMA'],
  [20, 7, 2, 46, 'Koordinator Pastoral'],
  [21, 7, 2, 20, 'Guru Agama Katolik'],
  [22, 8, 2, 20, 'Konselor (BK)'],
  [23, 9, 3, 46, 'Kepala Tata Usaha'],
  [24, 9, 3, 13, 'Staf Tata Usaha'],
  [25, 9, 3, 13, 'Pustakawan'],
  [26, 10, 3, 46, 'Kepala Keuangan'],
  [27, 10, 3, 13, 'Staf Keuangan'],
  [28, 11, 3, 53, 'HR Manager'],
  [29, 11, 3, 20, 'HR Officer'],
  [30, 12, 4, 5,  'Petugas Kebersihan'],
  [31, 13, 4, 7,  'Satpam'],
  [32, 14, 4, 7,  'Driver'],
  [33, 15, 4, 15, 'Teknisi IT'],
]

export const SCHOOL_POSITIONS = POSITION_ROWS.map(([id, departmentId, jobFamilyId, gradeId, name]) => ({
  id, departmentId, jobFamilyId, gradeId, code: `POS${String(id).padStart(3, '0')}`, name, status: 'Active',
}))

// ─── Employees ───────────────────────────────────────────────────────────────
// [id, name, gender, positionId, managerId, employmentType, joinDate, birthDate, religion, marital]
const EMP_ROWS = [
  [1,  'Stefanus Hartono',       'Male',   1,  2,    'Permanent', '2010-01-01', '1957-09-02', 'Katolik', 'Married'],
  [2,  'Maria Veronica Setiawan','Female', 3,  null, 'Permanent', '2012-07-01', '1960-03-14', 'Katolik', 'Married'],
  [3,  'Agustinus Wibowo',       'Male',   4,  2,    'Permanent', '2015-08-01', '1964-11-21', 'Katolik', 'Married'],
  [4,  'Theresia Anindya',       'Female', 2,  1,    'Permanent', '2014-06-15', '1975-05-09', 'Katolik', 'Married'],
  [5,  'Fransiska Lestari',      'Female', 5,  1,    'Permanent', '2016-07-18', '1979-02-27', 'Katolik', 'Married'],
  [6,  'Yosef Prabowo',          'Male',   7,  1,    'Permanent', '2013-07-15', '1976-12-05', 'Katolik', 'Married'],
  [7,  'Elisabeth Kartika',      'Female', 9,  1,    'Permanent', '2012-07-16', '1974-08-19', 'Katolik', 'Married'],
  [8,  'Paulus Sutanto',         'Male',   15, 1,    'Permanent', '2011-07-18', '1972-04-30', 'Katolik', 'Married'],
  [9,  'Margareta Widya',        'Female', 10, 7,    'Permanent', '2015-07-20', '1981-10-11', 'Katolik', 'Married'],
  [10, 'Antonius Kurniawan',     'Male',   16, 8,    'Permanent', '2014-07-21', '1980-01-23', 'Katolik', 'Married'],
  [11, 'Yuliana Sari',           'Female', 6,  5,    'Permanent', '2019-07-15', '1992-06-17', 'Katolik', 'Single'],
  [12, 'Veronika Dewi',          'Female', 6,  5,    'Permanent', '2021-07-19', '1995-09-08', 'Kristen', 'Single'],
  [13, 'Bernadus Hendra',        'Male',   8,  6,    'Permanent', '2018-07-16', '1990-03-03', 'Katolik', 'Married'],
  [14, 'Lucia Permata',          'Female', 8,  6,    'Permanent', '2020-07-20', '1993-12-12', 'Katolik', 'Married'],
  [15, 'Yohanes Aditya',         'Male',   11, 9,    'Permanent', '2017-07-17', '1989-07-25', 'Katolik', 'Married'],
  [16, 'Monica Rahayu',          'Female', 11, 9,    'Permanent', '2020-01-13', '1991-05-01', 'Katolik', 'Single'],
  [17, 'Gregorius Santoso',      'Male',   12, 9,    'Permanent', '2019-07-15', '1988-11-29', 'Katolik', 'Married'],
  [18, 'Angela Putri',           'Female', 13, 9,    'Permanent', '2022-07-18', '1996-02-14', 'Katolik', 'Single'],
  [19, 'Dominikus Rian',         'Male',   14, 9,    'Contract',  '2025-07-14', '1998-08-06', 'Katolik', 'Single'],
  [20, 'Katarina Melati',        'Female', 14, 9,    'Contract',  '2025-07-14', '1999-04-22', 'Katolik', 'Single'],
  [21, 'Benediktus Hasan',       'Male',   17, 10,   'Permanent', '2016-07-18', '1985-09-16', 'Katolik', 'Married'],
  [22, 'Cecilia Handayani',      'Female', 18, 10,   'Permanent', '2018-07-16', '1987-01-31', 'Katolik', 'Married'],
  [23, 'Ignatius Setiabudi',     'Male',   19, 10,   'Contract',  '2025-07-14', '1997-10-10', 'Katolik', 'Single'],
  [24, 'Rm. Aloysius Pranoto',   'Male',   20, 1,    'Permanent', '2017-08-01', '1970-06-06', 'Katolik', 'Single'],
  [25, 'Sr. Benedikta Maria',    'Female', 21, 24,   'Permanent', '2015-07-20', '1973-03-18', 'Katolik', 'Single'],
  [26, 'Fidelis Raharjo',        'Male',   21, 24,   'Permanent', '2021-07-19', '1986-12-24', 'Katolik', 'Married'],
  [27, 'Natalia Ayu',            'Female', 22, 24,   'Permanent', '2020-07-20', '1990-07-07', 'Katolik', 'Married'],
  [28, 'Dewi Anggraini',         'Female', 23, 4,    'Permanent', '2013-03-01', '1978-04-04', 'Kristen', 'Married'],
  [29, 'Rudi Hartanto',          'Male',   24, 28,   'Permanent', '2018-02-01', '1988-06-30', 'Katolik', 'Married'],
  [30, 'Susanti Wijaya',         'Female', 25, 28,   'Permanent', '2019-09-02', '1991-11-15', 'Buddha',  'Single'],
  [31, 'Henny Gunawan',          'Female', 26, 4,    'Permanent', '2014-05-01', '1977-09-09', 'Katolik', 'Married'],
  [32, 'Albertus Tan',           'Male',   27, 31,   'Permanent', '2021-03-01', '1994-02-02', 'Katolik', 'Single'],
  [33, 'Bambang Hermawan',       'Male',   28, 4,    'Permanent', '2016-02-01', '1979-10-20', 'Katolik', 'Married'],
  [34, 'Intan Permatasari',      'Female', 29, 33,   'Permanent', '2022-01-10', '1996-12-01', 'Islam',   'Single'],
  [35, 'Sugeng Riyadi',          'Male',   30, 28,   'Outsource', '2019-01-07', '1985-05-05', 'Islam',   'Married'],
  [36, 'Joko Susanto',           'Male',   31, 28,   'Outsource', '2018-06-01', '1982-02-12', 'Islam',   'Married'],
  [37, 'Wahyu Hidayat',          'Male',   32, 28,   'Permanent', '2017-04-03', '1983-01-18', 'Islam',   'Married'],
  [38, 'Dimas Arya',             'Male',   33, 28,   'Permanent', '2023-02-01', '1993-11-11', 'Katolik', 'Single'],
  [39, 'Siti Aminah',            'Female', 30, 28,   'Outsource', '2022-03-01', '1989-08-08', 'Islam',   'Married'],
  [40, 'Mulyadi',                'Male',   31, 28,   'Outsource', '2020-10-05', '1984-07-13', 'Islam',   'Married'],
  [41, 'Heri Purnomo',           'Male',   32, 28,   'Permanent', '2021-09-06', '1987-03-27', 'Kristen', 'Married'],
]

const posById = Object.fromEntries(SCHOOL_POSITIONS.map(p => [p.id, p]))
const deptById = Object.fromEntries(SCHOOL_DEPARTMENTS.map(d => [d.id, d]))
const buById = Object.fromEntries(SCHOOL_BUSINESS_UNITS.map(b => [b.id, b]))
const EMAIL_DOMAIN = 'lscs-demo.sch.id'

// Login username per employee id (key people get readable names; the rest use NIK).
const USERNAME_BY_ID = {
  1: 'ketuayayasan', 2: 'ketuadewan', 4: 'sekretaris',
  5: 'kepsek-tk', 6: 'kepsek-sd', 7: 'kepsek-smp', 8: 'kepsek-sma',
  9: 'wakasek-smp', 10: 'wakasek-sma',
  11: 'guru-tk', 13: 'guru-sd', 15: 'guru-mat', 17: 'guru-inggris', 18: 'guru-ipa',
  19: 'honorer', 21: 'guru-mat-sma', 22: 'guru-fisika',
  24: 'pastoral', 25: 'guru-agama', 27: 'konselor',
  28: 'kepala-tu', 29: 'staf-tu', 30: 'pustakawan', 31: 'kepala-keuangan', 32: 'staf-keuangan',
  33: 'hr', 34: 'hrofficer', 35: 'kebersihan', 36: 'satpam', 37: 'driver', 38: 'admin',
}
const ROLE_BY_ID = {
  38: 'superadmin', 33: 'hr', 34: 'hr_officer',
  1: 'manager', 2: 'manager', 4: 'manager', 5: 'manager', 6: 'manager', 7: 'manager', 8: 'manager',
  9: 'manager', 10: 'manager', 24: 'manager', 28: 'manager', 31: 'manager',
}

export const SCHOOL_EMPLOYEES = EMP_ROWS.map(([id, name, gender, positionId, managerId, employmentType, joinDate, birthDate, religion, maritalStatus]) => {
  const pos = posById[positionId]
  const dept = deptById[pos.departmentId]
  const bu = buById[dept.businessUnitId]
  const nikPrefix = bu.companyId === 2 ? 'YLS' : 'LSCS'
  const nik = `${nikPrefix}-${String(id).padStart(3, '0')}`
  const handle = USERNAME_BY_ID[id] || nik.toLowerCase()
  return {
    id, name, managerId, status: 'Active', joinDate,
    companyId: bu.companyId, departmentId: dept.id, positionId,
    employmentType, department: dept.name, position: pos.name,
    nik, email: `${handle.replace(/[^a-z0-9-]/g, '')}@${EMAIL_DOMAIN}`,
    gender, birthDate, religion, maritalStatus,
    birthPlace: 'Jakarta', nationality: 'Indonesian', city: 'Jakarta', country: 'Indonesia',
    phone: `0812-3000-${String(1000 + id)}`,
    role: ROLE_BY_ID[id] || 'employee',
  }
})

export const SCHOOL_USERS = SCHOOL_EMPLOYEES.map(e => ({
  id: e.id,
  username: USERNAME_BY_ID[e.id] || e.nik.toLowerCase(),
  password: 'pass123',
  name: e.name,
  role: e.role,
  dept: e.department,
  position: e.position,
  email: e.email,
}))

// ─── Headcounts (seats) ──────────────────────────────────────────────────────
// Each employee holds one seat under their position; VACANT_SEATS are open
// seats ([positionId, supervisor employee id]) that recruitment fills.
const VACANT_SEATS = [
  [4, 2], [6, 5], [8, 6], [11, 9], [12, 9], [21, 24], [30, 28], [32, 28],
]

function buildHeadcounts() {
  const seats = []
  const letterCount = {}
  const nextName = (positionId) => {
    letterCount[positionId] = (letterCount[positionId] || 0) + 1
    return `${posById[positionId].name} ${String.fromCharCode(64 + letterCount[positionId])}`
  }
  const seatOfEmp = {}
  SCHOOL_POSITIONS.forEach(p => {
    SCHOOL_EMPLOYEES.filter(e => e.positionId === p.id).forEach(e => {
      seats.push({ positionId: p.id, name: nextName(p.id), employeeId: e.id, supervisorEmp: e.managerId })
    })
    VACANT_SEATS.filter(([pid]) => pid === p.id).forEach(([, sup]) => {
      seats.push({ positionId: p.id, name: nextName(p.id), employeeId: null, supervisorEmp: sup })
    })
  })
  seats.forEach((s, i) => { s.id = i + 1; if (s.employeeId) seatOfEmp[s.employeeId] = s.id })
  return seats.map(s => ({
    id: s.id, positionId: s.positionId, code: `HC${String(s.id).padStart(3, '0')}`, name: s.name,
    employeeId: s.employeeId, supervisorHeadcountId: s.supervisorEmp ? (seatOfEmp[s.supervisorEmp] ?? null) : null,
    status: 'Active',
  }))
}

export const SCHOOL_HEADCOUNTS = buildHeadcounts()

export const SCHOOL_NEXT_IDS = {
  employee: Math.max(...SCHOOL_EMPLOYEES.map(e => e.id)) + 1,
  headcount: Math.max(...SCHOOL_HEADCOUNTS.map(h => h.id)) + 1,
}

const vacantSeatId = (positionId, nth = 1) =>
  SCHOOL_HEADCOUNTS.filter(h => h.positionId === positionId && !h.employeeId)[nth - 1]?.id ?? null

// ─── Recruitment ─────────────────────────────────────────────────────────────
const REQ = (o) => ({
  employmentType: 'Permanent', headcount: 1, priority: 'Medium', targetDate: '',
  publishStartDate: '', publishEndDate: '', notes: '', publicTitle: '', jobDescription: '', ...o,
})
const name = (id) => SCHOOL_EMPLOYEES.find(e => e.id === id).name

export const SCHOOL_REQUISITIONS = [
  REQ({ id: 1, positionId: 11, positionTitle: 'Guru Matematika SMP', departmentId: 5, companyId: 1, headcountId: vacantSeatId(11),
    status: 'Posted External', priority: 'High', requestedBy: 9, requestedByName: name(9), requestedDate: '2026-09-15', targetDate: '2026-12-31',
    publishStartDate: '2026-09-20', publicTitle: 'Guru Matematika SMP',
    jobDescription: 'Tanggung Jawab:\n- Mengajar Matematika kelas 7-9\n- Menyusun RPP dan evaluasi pembelajaran\n\nKualifikasi:\n- S1 Pendidikan Matematika\n- Pengalaman mengajar minimal 2 tahun',
    notes: 'Pengganti guru yang pindah tugas.' }),
  REQ({ id: 2, positionId: 12, positionTitle: 'Guru Bahasa Inggris SMP', departmentId: 5, companyId: 1, headcountId: vacantSeatId(12),
    status: 'Posted External', priority: 'High', requestedBy: 9, requestedByName: name(9), requestedDate: '2026-09-20', targetDate: '2026-12-31',
    publishStartDate: '2026-10-01', publicTitle: 'Guru Bahasa Inggris SMP',
    jobDescription: 'Tanggung Jawab:\n- Mengajar Bahasa Inggris kelas 7-9\n- Membimbing klub debat\n\nKualifikasi:\n- S1 Pendidikan Bahasa Inggris\n- IELTS/TOEFL setara minimal B2' }),
  REQ({ id: 3, positionId: 8, positionTitle: 'Guru Kelas SD', departmentId: 4, companyId: 1, headcountId: vacantSeatId(8),
    status: 'Posted External', requestedBy: 6, requestedByName: name(6), requestedDate: '2026-09-10', targetDate: '2026-12-31',
    publishStartDate: '2026-09-15', publicTitle: 'Guru Kelas SD',
    jobDescription: 'Tanggung Jawab:\n- Wali kelas dan pengajar tematik kelas 1-6\n\nKualifikasi:\n- S1 PGSD atau sederajat\n- Sabar dan komunikatif dengan anak' }),
  REQ({ id: 4, positionId: 21, positionTitle: 'Guru Agama Katolik', departmentId: 7, companyId: 1, headcountId: vacantSeatId(21),
    status: 'Posted External', requestedBy: 24, requestedByName: name(24), requestedDate: '2026-09-25', targetDate: '2026-12-31',
    publishStartDate: '2026-10-05', publicTitle: 'Guru Agama Katolik',
    jobDescription: 'Tanggung Jawab:\n- Mengajar Pendidikan Agama Katolik dan membantu kegiatan pastoral\n\nKualifikasi:\n- S1 Pendidikan Agama Katolik\n- Aktif dalam kegiatan gereja' }),
  REQ({ id: 5, positionId: 32, positionTitle: 'Driver', departmentId: 14, companyId: 1, headcountId: vacantSeatId(32),
    status: 'Open', requestedBy: 28, requestedByName: name(28), requestedDate: '2026-10-08', targetDate: '2026-11-30',
    notes: 'Untuk antar-jemput siswa; internal, belum dipublikasikan.' }),
  REQ({ id: 6, positionId: 6, positionTitle: 'Guru TK', departmentId: 3, companyId: 1, headcountId: vacantSeatId(6),
    status: 'On Hold', priority: 'Low', requestedBy: 5, requestedByName: name(5), requestedDate: '2026-08-20', targetDate: '2027-01-15',
    notes: 'Menunggu persetujuan kuota dari yayasan.' }),
  REQ({ id: 7, positionId: 30, positionTitle: 'Petugas Kebersihan', departmentId: 12, companyId: 1,
    headcountId: SCHOOL_HEADCOUNTS.find(h => h.employeeId === 39)?.id ?? null,
    status: 'Closed', requestedBy: 28, requestedByName: name(28), requestedDate: '2026-08-01', targetDate: '2026-09-30',
    notes: 'Posisi terisi.' }),
]

export const SCHOOL_CANDIDATES = [
  { id: 1, name: 'Cornelia Anggreni', email: 'cornelia.a@email-demo.com', phone: '0812-5500-0001', requisitionId: 1, source: 'LinkedIn', appliedDate: '2026-10-02', stage: 'Interview', rating: 4, notes: 'S1 Pendidikan Matematika, pengalaman mengajar 4 tahun.' },
  { id: 2, name: 'Bonifasius Pratama', email: 'boni.p@email-demo.com', phone: '0812-5500-0002', requisitionId: 1, source: 'Job Portal', appliedDate: '2026-10-04', stage: 'Screening', rating: 3, notes: '' },
  { id: 3, name: 'Elisabet Dwi Astuti', email: 'elisabet.da@email-demo.com', phone: '0812-5500-0003', requisitionId: 1, source: 'Career Site', appliedDate: '2026-10-12', stage: 'Applied', rating: 0, notes: '' },
  { id: 4, name: 'Maximilianus Joko', email: 'max.joko@email-demo.com', phone: '0812-5500-0004', requisitionId: 2, source: 'Referral', appliedDate: '2026-10-06', stage: 'Interview', rating: 4, notes: 'IELTS 7.5. Direkomendasikan Margareta Widya.' },
  { id: 5, name: 'Agnes Monica Sari', email: 'agnes.ms@email-demo.com', phone: '0812-5500-0005', requisitionId: 3, source: 'Job Portal', appliedDate: '2026-09-22', stage: 'Offer', rating: 5, notes: 'PGSD, siap mulai Januari 2027.' },
  { id: 6, name: 'Vincentius Adi', email: 'vincent.adi@email-demo.com', phone: '0812-5500-0006', requisitionId: 3, source: 'Walk-in', appliedDate: '2026-09-18', stage: 'Rejected', rating: 2, notes: 'Pengalaman mengajar anak usia dini kurang.' },
  { id: 7, name: 'Clara Fransiska', email: 'clara.f@email-demo.com', phone: '0812-5500-0007', requisitionId: 4, source: 'Referral', appliedDate: '2026-10-09', stage: 'Screening', rating: 4, notes: 'Lulusan Pendidikan Agama Katolik.' },
  { id: 8, name: 'Rahmat Hidayat', email: 'rahmat.h@email-demo.com', phone: '0812-5500-0008', requisitionId: 7, source: 'Job Portal', appliedDate: '2026-08-12', stage: 'Pending Employee', rating: 5, notes: 'Mulai bekerja 1 November 2026.' },
  { id: 9, name: 'Emilia Susanti', email: 'emilia.s@email-demo.com', phone: '0812-5500-0009', requisitionId: 5, source: 'Walk-in', appliedDate: '2026-10-14', stage: 'Applied', rating: 0, notes: 'Memiliki SIM B1 dan pengalaman antar-jemput.' },
]

export const SCHOOL_INTERVIEWS = [
  { id: 1, candidateId: 1, requisitionId: 1, date: '2026-10-26', time: '10:00', type: 'Video', interviewerNames: 'Margareta Widya, Elisabeth Kartika', location: 'meet.google.com/lscs-guru-mat', result: 'Scheduled', notes: '' },
  { id: 2, candidateId: 4, requisitionId: 2, date: '2026-10-23', time: '13:00', type: 'Onsite', interviewerNames: 'Margareta Widya', location: 'Ruang Kepala Sekolah SMP', result: 'Scheduled', notes: '' },
  { id: 3, candidateId: 5, requisitionId: 3, date: '2026-10-14', time: '09:00', type: 'Onsite', interviewerNames: 'Yosef Prabowo', location: 'Ruang Kepala Sekolah SD', result: 'Passed', notes: 'Micro-teaching sangat baik.' },
]

// ─── Time & Labor ────────────────────────────────────────────────────────────
export const SCHOOL_SHIFTS = [
  { id: 1, name: 'Jam Sekolah',        startTime: '07:00', endTime: '15:00', breakMinutes: 30 },
  { id: 2, name: 'Jam Kantor TU',      startTime: '07:30', endTime: '16:00', breakMinutes: 60 },
  { id: 3, name: 'Satpam Pagi',        startTime: '06:00', endTime: '14:00', breakMinutes: 30 },
  { id: 4, name: 'Satpam Siang',       startTime: '14:00', endTime: '22:00', breakMinutes: 30 },
  { id: 5, name: 'Satpam Malam',       startTime: '22:00', endTime: '06:00', breakMinutes: 30 },
]

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
export const SCHOOL_PATTERNS = [
  { id: 1, name: 'Guru Senin-Jumat',  entries: WEEKDAYS.map(day => ({ day, shiftId: 1 })) },
  { id: 2, name: 'Kantor Senin-Jumat', entries: WEEKDAYS.map(day => ({ day, shiftId: 2 })) },
  { id: 3, name: 'Satpam Rotasi 6 Hari', entries: [
    { day: 'Monday', shiftId: 3 }, { day: 'Tuesday', shiftId: 3 }, { day: 'Wednesday', shiftId: 4 },
    { day: 'Thursday', shiftId: 4 }, { day: 'Friday', shiftId: 5 }, { day: 'Saturday', shiftId: 5 },
  ] },
]

export const SCHOOL_SCHEDULES = [
  { id: 1, name: 'Guru dan Pendidik', patternId: 1, effectiveDate: '2026-07-13' },
  { id: 2, name: 'Tata Usaha dan Umum', patternId: 2, effectiveDate: '2026-07-13' },
  { id: 3, name: 'Satpam', patternId: 3, effectiveDate: '2026-07-13' },
]

const SCHEDULE_FOR = (e) => {
  if (e.positionId === 31) return 3
  const dept = deptById[e.departmentId]
  const educator = [3, 4, 5, 6, 7, 8].includes(dept.id)
  if (educator) return 1
  if (e.id <= 4) return null
  return 2
}
export const SCHOOL_ASSIGNMENTS = SCHOOL_EMPLOYEES
  .map(e => ({ e, scheduleId: SCHEDULE_FOR(e) }))
  .filter(x => x.scheduleId)
  .map(({ e, scheduleId }, i) => ({ id: i + 1, userId: e.id, name: e.name, scheduleId, startDate: '2026-07-13' }))

// ─── Announcements ───────────────────────────────────────────────────────────
export const SCHOOL_ANNOUNCEMENTS = [
  { id: 1, title: 'Libur Semester Ganjil dan Natal 2026',
    body: 'Libur semester ganjil dimulai 19 Desember 2026. Kegiatan belajar mengajar dimulai kembali 4 Januari 2027. Perayaan Natal bersama civitas akademika dilaksanakan 17 Desember di aula sekolah.',
    category: 'Kebijakan', pinned: true, active: true, startDate: '2026-10-01', endDate: '', createdAt: '2026-10-01' },
  { id: 2, title: 'Rapat Dewan Sekolah dan Orang Tua',
    body: 'Rapat Dewan Sekolah bersama perwakilan orang tua dilaksanakan Sabtu, 31 Oktober 2026 pukul 09.00 di aula. Mohon kepala sekolah menyiapkan laporan semester.',
    category: 'Acara', pinned: false, active: true, startDate: '2026-10-01', endDate: '', createdAt: '2026-10-05' },
  { id: 3, title: 'Pembagian Rapor Tengah Semester',
    body: 'Rapor tengah semester dibagikan kepada orang tua pada 7 November 2026. Wali kelas diminta menyelesaikan input nilai paling lambat 3 November.',
    category: 'Acara', pinned: false, active: true, startDate: '2026-10-01', endDate: '', createdAt: '2026-10-08' },
]

// ─── Talent: key positions, vacancy risk, successors (keyed by position id) ──
const _kp = () => ({ q1: true, q2: true, q3: true, assessedBy: 'Pengurus Yayasan', assessedAt: '2026-10-01' })
export const SCHOOL_KEY_POSITIONS = { 5: _kp(), 7: _kp(), 9: _kp(), 15: _kp(), 10: _kp(), 16: _kp(), 26: _kp(), 28: _kp() }

const _va = (retirement, contract, mobility, health, notes = '') =>
  ({ retirement, contract, mobility, health, notes, assessedBy: 'Pengurus Yayasan', assessedAt: '2026-10-02' })
export const SCHOOL_VACANCY_RISK = {
  5:  _va('Long',   'Long',   'Medium', 'Sehat'),
  7:  _va('Medium', 'Medium', 'Long',   'Sehat'),
  9:  _va('Short',  'Medium', 'Medium', 'Catatan', 'Kepala sekolah berencana studi lanjut; perlu persiapan pengganti.'),
  15: _va('Medium', 'Long',   'Medium', 'Sehat'),
  10: _va('Long',   'Medium', 'Short',  'Sehat',   'Wakil kepala sekolah berpeluang dipromosikan menjadi kepala sekolah.'),
  16: _va('Long',   'Long',   'Medium', 'Sehat'),
  26: _va('Medium', 'Medium', 'Long',   'Sehat'),
  28: _va('Long',   'Long',   'Medium', 'Sehat'),
}

const _sc = (id, employeeId, employeeName, currentPosition, competencyFit, scope, emergency = false) =>
  ({ id, employeeId, employeeName, currentPosition, competencyFit, scope, assessed: true, emergency, notes: '' })
// Posisi 28 (HR Manager) sengaja tanpa successor, untuk menunjukkan celah suksesi.
export const SCHOOL_SUCCESSORS = {
  9:  [ _sc(9001, 9, 'Margareta Widya', 'Wakil Kepala Sekolah SMP', 78, 'Full', true),
        _sc(9002, 15, 'Yohanes Aditya', 'Guru Matematika SMP', 55, 'Partial') ],
  15: [ _sc(9003, 10, 'Antonius Kurniawan', 'Wakil Kepala Sekolah SMA', 82, 'Full', true) ],
  7:  [ _sc(9004, 13, 'Bernadus Hendra', 'Guru Kelas SD', 52, 'Partial') ],
  5:  [ _sc(9005, 11, 'Yuliana Sari', 'Guru TK', 48, 'Minimal') ],
  10: [ _sc(9006, 15, 'Yohanes Aditya', 'Guru Matematika SMP', 62, 'Partial'),
        _sc(9007, 17, 'Gregorius Santoso', 'Guru Bahasa Inggris SMP', 50, 'Partial') ],
  16: [ _sc(9008, 21, 'Benediktus Hasan', 'Guru Matematika SMA', 70, 'Partial') ],
  26: [ _sc(9009, 32, 'Albertus Tan', 'Staf Keuangan', 58, 'Partial') ],
}

// ─── Learning (LMS) mock content shown on the catalog / team dashboard ───────
export const SCHOOL_LMS = {
  categories: ['All', 'Pedagogi & Kurikulum', 'Pastoral & Karakter', 'Kepemimpinan Sekolah', 'Keselamatan & Perlindungan Anak', 'Teknologi Pembelajaran', 'Soft Skills', 'Administrasi & Keuangan'],
  catalog: [
    { id:1, title:'Perlindungan Anak dan Keselamatan di Sekolah', category:'Keselamatan & Perlindungan Anak', type:'ILT', duration:'8 jam', instructor:'Sr. Benedikta Maria', rating:4.8, enrolled:38, level:'Beginner', status:'Available' },
    { id:2, title:'Kurikulum Merdeka untuk Guru Mata Pelajaran', category:'Pedagogi & Kurikulum', type:'Blended', duration:'24 jam', instructor:'Tim Kurikulum', rating:4.9, enrolled:31, level:'Intermediate', status:'Available' },
    { id:3, title:'Teknologi Pembelajaran dengan Google Workspace', category:'Teknologi Pembelajaran', type:'Self-Paced', duration:'6 jam', instructor:'Online', rating:4.6, enrolled:27, level:'Beginner', status:'Available' },
    { id:4, title:'Pendidikan Karakter dan Spiritualitas Katolik', category:'Pastoral & Karakter', type:'Blended', duration:'16 jam', instructor:'Rm. Aloysius Pranoto', rating:4.7, enrolled:35, level:'Intermediate', status:'Available' },
    { id:5, title:'Komunikasi Efektif dengan Orang Tua Siswa', category:'Soft Skills', type:'ILT', duration:'12 jam', instructor:'Tim Konseling', rating:4.5, enrolled:22, level:'Beginner', status:'Available' },
    { id:6, title:'Asesmen Formatif dan Penilaian Autentik', category:'Pedagogi & Kurikulum', type:'Self-Paced', duration:'20 jam', instructor:'Online', rating:4.4, enrolled:19, level:'Advanced', status:'Available' },
    { id:7, title:'Kepemimpinan Kepala Sekolah', category:'Kepemimpinan Sekolah', type:'Blended', duration:'12 jam', instructor:'Dr. Maria Veronica Setiawan', rating:4.6, enrolled:8, level:'Intermediate', status:'Available' },
    { id:8, title:'Pengelolaan Dana BOS dan Keuangan Sekolah', category:'Administrasi & Keuangan', type:'ILT', duration:'16 jam', instructor:'Henny Gunawan', rating:4.7, enrolled:9, level:'Intermediate', status:'Available' },
  ],
  teamSummary: [
    { name:'Margareta Widya', role:'Wakil Kepala Sekolah SMP', mandatory:3, completed:3, overdue:0, progress:100 },
    { name:'Yohanes Aditya', role:'Guru Matematika SMP', mandatory:3, completed:2, overdue:0, progress:75 },
    { name:'Monica Rahayu', role:'Guru Matematika SMP', mandatory:3, completed:1, overdue:1, progress:40 },
    { name:'Gregorius Santoso', role:'Guru Bahasa Inggris SMP', mandatory:3, completed:2, overdue:0, progress:65 },
    { name:'Angela Putri', role:'Guru IPA SMP', mandatory:2, completed:0, overdue:2, progress:0 },
  ],
  pendingApproval: [
    { id:1, employee:'Yohanes Aditya', type:'External Training', course:'Workshop Pembina Olimpiade Matematika', submitted:'2026-10-12', cost:3500000 },
    { id:2, employee:'Angela Putri', type:'External Training', course:'Pelatihan Pengelolaan Laboratorium IPA', submitted:'2026-10-15', cost:2500000 },
  ],
}

// ─── Performance: one VIP (goal) session for a teacher ───────────────────────
export const SCHOOL_VIP_SESSIONS = [
  {
    id: 1, employeeId: 15, employeeName: 'Yohanes Aditya', managerId: 9, managerName: 'Margareta Widya',
    name: 'Sasaran Semester Ganjil 2026/2027', date: '2026-09-14',
    submittedAt: '2026-09-14T09:00:00+07:00', status: 'Active',
    managerApprovedAt: '2026-09-15T09:00:00+07:00', managerApprovedBy: 'Margareta Widya',
    finalScore: null, ratingNote: '', ratedAt: null,
    topics: [
      { id: 1, title: 'Peningkatan Hasil Belajar Matematika Kelas 8',
        description: 'Meningkatkan rata-rata nilai asesmen tengah semester Matematika kelas 8 melalui remedial terjadwal dan latihan soal berjenjang.',
        goalPlan: 'Sasaran Guru Mata Pelajaran 2026', weight: 60, status: 'In Progress',
        checkInNotes: 'Rata-rata nilai naik dari 68 menjadi 74. Remedial berjalan tiap Selasa.' },
      { id: 2, title: 'Penerapan Kurikulum Merdeka di Kelas',
        description: 'Menyelesaikan pelatihan Kurikulum Merdeka dan menyusun modul ajar untuk tiga bab semester ganjil.',
        goalPlan: 'Sasaran Guru Mata Pelajaran 2026', weight: 40, status: 'In Progress',
        checkInNotes: 'Pelatihan selesai 2 dari 3 modul. Modul ajar bab 1 dan 2 sudah dikirim ke wakil kepala sekolah.' },
    ],
  },
]
