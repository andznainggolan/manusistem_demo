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

// The school's real organisation (Lia Stephanie Catholic School): management, three academic units
// (Kindergarten, Primary, MYP & SYP) and the support departments. The Yayasan company and its two
// business units stay as structure only; nobody is seated there.
export const SCHOOL_BUSINESS_UNITS = [
  { id:1, companyId:2, code:'BU001', name:'Pengurus Yayasan',                 costCenter:'CC-001', status:'Active' },
  { id:2, companyId:2, code:'BU002', name:'Dewan Sekolah',                    costCenter:'CC-002', status:'Active' },
  { id:3, companyId:1, code:'BU003', name:'Manajemen',                        costCenter:'CC-003', status:'Active' },
  { id:4, companyId:1, code:'BU004', name:'Taman Kanak-Kanak (TK)',           costCenter:'CC-004', status:'Active' },
  { id:5, companyId:1, code:'BU005', name:'Sekolah Dasar (Primary)',          costCenter:'CC-005', status:'Active' },
  { id:6, companyId:1, code:'BU006', name:'SMP dan SMA (MYP & SYP)',          costCenter:'CC-006', status:'Active' },
  { id:7, companyId:1, code:'BU007', name:'Keuangan',                         costCenter:'CC-007', status:'Active' },
  { id:8, companyId:1, code:'BU008', name:'SDM dan Umum',                     costCenter:'CC-008', status:'Active' },
  { id:9, companyId:1, code:'BU009', name:'Pemasaran dan Penerimaan Siswa',   costCenter:'CC-009', status:'Active' },
]

export const SCHOOL_DEPARTMENTS = [
  { id:1,  businessUnitId:1, code:'DEPT001', name:'Pengurus Yayasan',          status:'Active' },
  { id:2,  businessUnitId:2, code:'DEPT002', name:'Dewan Sekolah',             status:'Active' },
  { id:3,  businessUnitId:3, code:'DEPT003', name:'Direksi',                   status:'Active' },
  { id:4,  businessUnitId:3, code:'DEPT004', name:'Koordinasi Sekolah',        status:'Active' },
  { id:5,  businessUnitId:4, code:'DEPT005', name:'Akademik TK',               status:'Active' },
  { id:6,  businessUnitId:5, code:'DEPT006', name:'Akademik SD (Primary)',     status:'Active' },
  { id:7,  businessUnitId:6, code:'DEPT007', name:'Akademik SMP dan SMA (MYP & SYP)', status:'Active' },
  { id:8,  businessUnitId:7, code:'DEPT008', name:'Keuangan dan Pengadaan',    status:'Active' },
  { id:9,  businessUnitId:8, code:'DEPT009', name:'HRGA',                      status:'Active' },
  { id:10, businessUnitId:9, code:'DEPT010', name:'Marketing dan Admission',   status:'Active' },
]

// Job category of every position: Management, Educational Personnel, or Staff.
export const SCHOOL_JOB_FAMILIES = [
  { id:1, code:'JF001', name:'Management',             description:'Direksi, koordinator sekolah, kepala sekolah, dan manajer', status:'Active' },
  { id:2, code:'JF002', name:'Educational Personnel',  description:'Guru dan pendidik di TK, SD, SMP, dan SMA', status:'Active' },
  { id:3, code:'JF003', name:'Staff',                  description:'Staf keuangan, SDM, umum, pengadaan, laboratorium, administrasi, dan pemasaran', status:'Active' },
]

// Grade scale modelled on Indonesian ASN: golongan ruang PNS (I/a-IV/e), jenjang
// jabatan fungsional Guru, golongan PPPK (I-XVII) for honorer, and non-golongan
// pembina/pengurus. Salary ranges are the foundation's own sample scale (IDR/month).
const M = 1000000
const PNS_ROWS = [
  ['I/a', 'Juru Muda', 'Golongan I', 5.4, 5.8], ['I/b', 'Juru Muda Tingkat I', 'Golongan I', 5.5, 6.0],
  ['I/c', 'Juru', 'Golongan I', 5.6, 6.2], ['I/d', 'Juru Tingkat I', 'Golongan I', 5.8, 6.5],
  ['II/a', 'Pengatur Muda', 'Golongan II', 6.0, 6.8], ['II/b', 'Pengatur Muda Tingkat I', 'Golongan II', 6.2, 7.2],
  ['II/c', 'Pengatur', 'Golongan II', 6.5, 7.6], ['II/d', 'Pengatur Tingkat I', 'Golongan II', 6.8, 8.0],
  ['III/a', 'Penata Muda', 'Golongan III', 7.0, 8.6], ['III/b', 'Penata Muda Tingkat I', 'Golongan III', 7.6, 9.4],
  ['III/c', 'Penata', 'Golongan III', 8.2, 10.4], ['III/d', 'Penata Tingkat I', 'Golongan III', 9.0, 11.5],
  ['IV/a', 'Pembina', 'Golongan IV', 10.5, 13.5], ['IV/b', 'Pembina Tingkat I', 'Golongan IV', 11.5, 15],
  ['IV/c', 'Pembina Utama Muda', 'Golongan IV', 13, 17], ['IV/d', 'Pembina Utama Madya', 'Golongan IV', 15, 20],
  ['IV/e', 'Pembina Utama', 'Golongan IV', 17, 24],
]
const GURU_ROWS = [
  ['Guru III/a', 'Guru Pertama (Penata Muda)', 7.5, 9.0], ['Guru III/b', 'Guru Pertama (Penata Muda Tk. I)', 8.0, 9.8],
  ['Guru III/c', 'Guru Muda (Penata)', 9.0, 11.2], ['Guru III/d', 'Guru Muda (Penata Tk. I)', 9.8, 12.2],
  ['Guru IV/a', 'Guru Madya (Pembina)', 11.5, 14.5], ['Guru IV/b', 'Guru Madya (Pembina Tk. I)', 12.5, 16],
  ['Guru IV/c', 'Guru Madya (Pembina Utama Muda)', 14, 18],
  ['Guru IV/d', 'Guru Utama (Pembina Utama Madya)', 16, 21], ['Guru IV/e', 'Guru Utama (Pembina Utama)', 18, 25],
]
const ROMAN = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV','XVI','XVII']
const OFFICE_ROWS = [
  ['Pembina', 'Pembina Yayasan (Ketua Yayasan)', 45, 75], ['Pengurus', 'Pengurus Yayasan', 22, 32],
  ['Ketua Dewan', 'Ketua Dewan Sekolah', 35, 55], ['Anggota Dewan', 'Anggota Dewan Sekolah', 20, 32],
]
const gradeBase = { isBoard: false, isIntern: false, isNonMgr: false, isMgr: false }
export const SCHOOL_GRADE_LIST = [
  ...PNS_ROWS.map(([code, name, category, lo, hi], i) => ({ id: 1 + i, code, pc: 1 + i, name, category, minSalary: lo * M, maxSalary: hi * M, ...gradeBase })),
  ...GURU_ROWS.map(([code, name, lo, hi], i) => ({ id: 21 + i, code, pc: 21 + i, name, category: 'Jenjang Guru', minSalary: lo * M, maxSalary: hi * M, ...gradeBase })),
  ...ROMAN.map((r, i) => {
    const lo = 5.4 + i * 0.2
    return { id: 41 + i, code: `PPPK ${r}`, pc: 41 + i, name: `PPPK Golongan ${r}`, category: 'PPPK / Honorer', minSalary: Math.round(lo * M), maxSalary: Math.round(lo * 1.2 * M), ...gradeBase }
  }),
  ...OFFICE_ROWS.map(([code, name, lo, hi], i) => ({ id: 61 + i, code, pc: 61 + i, name, category: 'Pembina dan Pengurus', minSalary: lo * M, maxSalary: hi * M, ...gradeBase, isBoard: true })),
]
export const SCHOOL_GRADE_BY_ID = Object.fromEntries(SCHOOL_GRADE_LIST.map(g => [g.id, g]))

// [id, departmentId, jobFamilyId, gradeId, name]
// Titles are the school's own. Ids start at 101 so data saved from the earlier sample organisation
// (ids 1-50) can never point at one of these people or positions.
const POSITION_ROWS = [
  // Management
  [101, 3,  1, 61, 'Operational Director'],
  [102, 3,  1, 61, 'Financial Director'],
  [103, 4,  1, 16, 'School Coordinator'],
  [104, 5,  1, 26, 'Head Master of Kindergarten'],
  [105, 7,  1, 27, 'MYP & SYP Principal'],
  [106, 6,  1, 27, 'SD & Primary Principal'],
  [107, 10, 1, 14, 'Marketing Manager'],
  [108, 8,  1, 14, 'Finance Manager'],
  [109, 9,  1, 14, 'HRGA'],
  [110, 10, 1, 11, 'Marketing & Admission'],
  // Educational Personnel
  [111, 5,  2, 22, 'Kindergarten Teacher'],
  [112, 6,  2, 23, 'Primary Year Mathematic Teacher'],
  [113, 6,  2, 23, 'Primary School Year'],
  [114, 6,  2, 23, 'Librarian & Greenery Teacher'],
  [115, 6,  2, 23, 'Primary Year Teacher'],
  [116, 6,  2, 23, 'Primary Year Program Teacher'],
  [117, 7,  2, 24, 'Middle Year Program Teacher'],
  [118, 7,  2, 23, 'Art (Painting)'],
  [119, 7,  2, 23, 'Bahasa Indonesia'],
  [120, 7,  2, 23, 'Teaching Art (Music)'],
  [121, 7,  2, 23, 'PE / PJOK (Pendidikan Jasmani, Olahraga dan Kesehatan)'],
  [122, 7,  2, 23, 'Bahasa Mandarin'],
  [123, 7,  2, 23, 'Pancasila / PPKN'],
  [124, 7,  2, 23, 'IPS / Entrepreneur'],
  [125, 7,  2, 24, 'English'],
  [126, 7,  2, 23, 'Religion'],
  [127, 7,  2, 24, 'Math & Science'],
  // Staff
  [128, 9,  3, 9,  'General Affairs Staff'],
  [129, 8,  3, 9,  'Purchasing Staff'],
  [130, 7,  3, 8,  'Laboran Staff'],
  [131, 4,  3, 9,  'Primary Year & Kindergarten Administrator'],
  [132, 10, 3, 10, 'Digital Marketing Specialist'],
  [133, 8,  3, 9,  'Staff Finance'],
  [134, 9,  3, 10, 'Staff HR'],
]

export const SCHOOL_POSITIONS = POSITION_ROWS.map(([id, departmentId, jobFamilyId, gradeId, name]) => ({
  id, departmentId, jobFamilyId, gradeId, code: `POS${String(id).padStart(3, '0')}`, name, status: 'Active',
}))

// ─── Employees ───────────────────────────────────────────────────────────────
// The school's real staff: names and job titles are theirs. Everything else is a demo placeholder
// (join date, employment type, email, phone). Gender, birth date, religion and marital status are left
// blank on purpose so HR fills them in.
// Reporting lines: the Operational Director is the top; the Financial Director (the owner) is second;
// the School Coordinator, Marketing Manager and HRGA report to the Operational Director; the three
// principals report to the School Coordinator; the Finance Manager reports to the Financial Director;
// teachers report to their principal or headmaster.
// [id, name, positionId, managerId, username, role]
const EMP_ROWS = [
  // Management
  [101, 'Ricky Antonio, BBA (HONs), MBA, MScIB',                  101, null, 'ricky',     'superadmin'],
  [102, 'Nyvillia Kho, BA, M.Pd',                                 102, 101,  'nyvillia',  'manager'],
  [103, 'Madya Ardi Wintana, S.S, M.Th',                          103, 101,  'madya',     'manager'],
  [104, 'Anastasia Mia Paramita, S.Pd',                           104, 103,  'anastasia', 'manager'],
  [105, 'I Nyoman Sandhika Martianto, S.IP',                      107, 101,  'nyoman',    'manager'],
  [106, 'Abet Nego Aprianto, B.Ed., M.Pd.',                       105, 103,  'abet',      'manager'],
  [107, 'Daniel Seminariyanto, S.Th',                             106, 103,  'daniel',    'manager'],
  [108, 'Erny Elfrita Agustina Sidabutar, SE',                    108, 102,  'erny',      'manager'],
  [109, 'Elisabeth Caterina, SH',                                 109, 101,  'elisabeth', 'hr'],
  [110, 'Steve Mario Kullit, S.E',                                110, 105,  'steve',     'employee'],
  // Educational Personnel
  [111, 'Erna Emilia Simatupang, S.Pd',                           111, 104,  'erna',      'employee'],
  [112, 'Veronika Sri Kusmiyati, S.Pd',                           112, 107,  'veronika',  'employee'],
  [113, 'Maria Theresia Watu, S.Pd',                              113, 107,  'maria-theresia', 'employee'],
  [114, 'Abraham Perez Paclarin, BsHRM',                          114, 107,  'abraham',   'employee'],
  [115, 'Lailani Lana Raton, B.EEd, M.Ed, CTEFL',                 115, 107,  'lailani',   'employee'],
  [116, 'Jennifer Paclarin De Leon, BsIT, BsEd, CTEFL, CSPE',     116, 107,  'jennifer',  'employee'],
  [117, 'Albert, S.Kom',                                          117, 106,  'albert',    'employee'],
  [118, 'Adriman Manalu, S.Pd',                                   118, 106,  'adriman',   'employee'],
  [119, 'Angelita Octovina Putri Gamlia, S.Pd',                   119, 106,  'angelita',  'employee'],
  [120, 'Elsa Emilia Pandora Sitorus, S.Pd',                      120, 106,  'elsa',      'employee'],
  [121, 'Fanry Julius Sopacua, M.Pd',                             121, 106,  'fanry',     'employee'],
  [122, 'Flavia Domitilla Fausta, S.Par',                         122, 106,  'flavia',    'employee'],
  [123, 'Lisa Efata NurCahaya Damanik, S.Th',                     123, 106,  'lisa',      'employee'],
  [124, 'Marcellina Alma Wiharti, S.Pd',                          124, 106,  'marcellina', 'employee'],
  [125, 'Maria Jovita Widjaja, S.Pd',                             125, 106,  'maria-jovita', 'employee'],
  [126, 'Gabriela Madeline Manurung, S.Pd',                       126, 106,  'gabriela',  'employee'],
  [127, 'Renjith Rajan, B.Ed, BSc, M.Ed, M.Si',                   127, 106,  'renjith',   'employee'],
  // Staff
  [128, 'Nursinta Simarmata, S.Pd',                               128, 109,  'nursinta',  'employee'],
  [129, 'Lenawati',                                               129, 108,  'lenawati',  'employee'],
  [130, 'Dwi Purwanto, S.Pd',                                     130, 106,  'dwi',       'employee'],
  [131, 'Yakobus Purwanto',                                       131, 103,  'yakobus',   'employee'],
  [132, 'Gregorius Septyan Chandrari Maniallo, S.Sn',             132, 105,  'gregorius', 'employee'],
  [133, 'Krisdayanti Sakoan, S.Th',                               133, 108,  'krisdayanti', 'employee'],
  [134, 'Era Lusiana Sihaloho, S.Ak',                             134, 109,  'era',       'hr_officer'],
  [135, 'Lulu Farhiyah, S.Akt',                                   133, 108,  'lulu',      'employee'],
]
const DEMO_JOIN_DATE = '2024-07-15'

const posById = Object.fromEntries(SCHOOL_POSITIONS.map(p => [p.id, p]))
const deptById = Object.fromEntries(SCHOOL_DEPARTMENTS.map(d => [d.id, d]))
const buById = Object.fromEntries(SCHOOL_BUSINESS_UNITS.map(b => [b.id, b]))
const EMAIL_DOMAIN = 'lscs-demo.sch.id'
const HANDLE_BY_ID = Object.fromEntries(EMP_ROWS.map(r => [r[0], r[4]]))

export const SCHOOL_EMPLOYEES = EMP_ROWS.map(([id, name, positionId, managerId, handle, role]) => {
  const pos = posById[positionId]
  const dept = deptById[pos.departmentId]
  const bu = buById[dept.businessUnitId]
  return {
    id, name, managerId, status: 'Active', joinDate: DEMO_JOIN_DATE,
    companyId: bu.companyId, departmentId: dept.id, positionId,
    employmentType: 'Permanent', department: dept.name, position: pos.name,
    nik: `LSCS-${String(id - 100).padStart(3, '0')}`, email: `${handle.replace(/[^a-z0-9-]/g, '')}@${EMAIL_DOMAIN}`,
    gender: '', birthDate: '', religion: '', maritalStatus: '',
    birthPlace: '', nationality: '', city: '', country: 'Indonesia',
    phone: `0812-3000-${String(1000 + id)}`,
    role,
    gradeId: pos.gradeId, individualClassId: pos.gradeId,
  }
})

export const SCHOOL_USERS = SCHOOL_EMPLOYEES.map(e => ({
  id: e.id,
  employeeId: e.id,
  username: HANDLE_BY_ID[e.id],
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
  [111, 104], [115, 107], [125, 106], [126, 106], [127, 106], [128, 109],
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
  REQ({ id: 1, positionId: 127, positionTitle: 'Math & Science', departmentId: 7, companyId: 1, headcountId: vacantSeatId(127),
    status: 'Posted External', priority: 'High', requestedBy: 106, requestedByName: name(106), requestedDate: '2026-09-15', targetDate: '2026-12-31',
    publishStartDate: '2026-09-20', publicTitle: 'Guru Matematika dan Sains (MYP & SYP)',
    jobDescription: 'Tanggung Jawab:\n- Mengajar Matematika dan Sains jenjang MYP dan SYP\n- Menyusun rencana pembelajaran dan evaluasi\n\nKualifikasi:\n- S1 Pendidikan Matematika, Sains, atau sederajat\n- Pengalaman mengajar minimal 2 tahun',
    notes: 'Penambahan guru untuk jenjang MYP dan SYP.' }),
  REQ({ id: 2, positionId: 125, positionTitle: 'English', departmentId: 7, companyId: 1, headcountId: vacantSeatId(125),
    status: 'Posted External', priority: 'High', requestedBy: 106, requestedByName: name(106), requestedDate: '2026-09-20', targetDate: '2026-12-31',
    publishStartDate: '2026-10-01', publicTitle: 'Guru Bahasa Inggris (MYP & SYP)',
    jobDescription: 'Tanggung Jawab:\n- Mengajar Bahasa Inggris jenjang MYP dan SYP\n- Membimbing klub debat\n\nKualifikasi:\n- S1 Pendidikan Bahasa Inggris\n- IELTS/TOEFL setara minimal B2' }),
  REQ({ id: 3, positionId: 115, positionTitle: 'Primary Year Teacher', departmentId: 6, companyId: 1, headcountId: vacantSeatId(115),
    status: 'Posted External', requestedBy: 107, requestedByName: name(107), requestedDate: '2026-09-10', targetDate: '2026-12-31',
    publishStartDate: '2026-09-15', publicTitle: 'Guru Kelas SD (Primary Year)',
    jobDescription: 'Tanggung Jawab:\n- Wali kelas dan pengajar tematik kelas 1-6\n\nKualifikasi:\n- S1 PGSD atau sederajat\n- Sabar dan komunikatif dengan anak' }),
  REQ({ id: 4, positionId: 126, positionTitle: 'Religion', departmentId: 7, companyId: 1, headcountId: vacantSeatId(126),
    status: 'Posted External', requestedBy: 106, requestedByName: name(106), requestedDate: '2026-09-25', targetDate: '2026-12-31',
    publishStartDate: '2026-10-05', publicTitle: 'Guru Agama',
    jobDescription: 'Tanggung Jawab:\n- Mengajar Pendidikan Agama dan membantu kegiatan pembinaan karakter\n\nKualifikasi:\n- S1 Pendidikan Agama atau sederajat\n- Aktif dalam kegiatan keagamaan' }),
  REQ({ id: 5, positionId: 128, positionTitle: 'General Affairs Staff', departmentId: 9, companyId: 1, headcountId: vacantSeatId(128),
    status: 'Open', requestedBy: 109, requestedByName: name(109), requestedDate: '2026-10-08', targetDate: '2026-11-30',
    notes: 'Mendukung operasional umum sekolah; internal, belum dipublikasikan.' }),
  REQ({ id: 6, positionId: 111, positionTitle: 'Kindergarten Teacher', departmentId: 5, companyId: 1, headcountId: vacantSeatId(111),
    status: 'On Hold', priority: 'Low', requestedBy: 104, requestedByName: name(104), requestedDate: '2026-08-20', targetDate: '2027-01-15',
    notes: 'Menunggu persetujuan kuota dari manajemen.' }),
  REQ({ id: 7, positionId: 129, positionTitle: 'Purchasing Staff', departmentId: 8, companyId: 1,
    headcountId: SCHOOL_HEADCOUNTS.find(h => h.employeeId === 129)?.id ?? null,
    status: 'Closed', requestedBy: 108, requestedByName: name(108), requestedDate: '2026-08-01', targetDate: '2026-09-30',
    notes: 'Posisi terisi.' }),
]

export const SCHOOL_CANDIDATES = [
  { id: 1, name: 'Cornelia Anggreni', email: 'cornelia.a@email-demo.com', phone: '0812-5500-0001', requisitionId: 1, source: 'LinkedIn', appliedDate: '2026-10-02', stage: 'Interview', rating: 4, notes: 'S1 Pendidikan Matematika, pengalaman mengajar 4 tahun.' },
  { id: 2, name: 'Bonifasius Pratama', email: 'boni.p@email-demo.com', phone: '0812-5500-0002', requisitionId: 1, source: 'Job Portal', appliedDate: '2026-10-04', stage: 'Screening', rating: 3, notes: '' },
  { id: 3, name: 'Elisabet Dwi Astuti', email: 'elisabet.da@email-demo.com', phone: '0812-5500-0003', requisitionId: 1, source: 'Career Site', appliedDate: '2026-10-12', stage: 'Applied', rating: 0, notes: '' },
  { id: 4, name: 'Maximilianus Joko', email: 'max.joko@email-demo.com', phone: '0812-5500-0004', requisitionId: 2, source: 'Referral', appliedDate: '2026-10-06', stage: 'Interview', rating: 4, notes: 'IELTS 7.5. Direkomendasikan oleh MYP & SYP Principal.' },
  { id: 5, name: 'Agnes Monica Sari', email: 'agnes.ms@email-demo.com', phone: '0812-5500-0005', requisitionId: 3, source: 'Job Portal', appliedDate: '2026-09-22', stage: 'Offer', rating: 5, notes: 'PGSD, siap mulai Januari 2027.' },
  { id: 6, name: 'Vincentius Adi', email: 'vincent.adi@email-demo.com', phone: '0812-5500-0006', requisitionId: 3, source: 'Walk-in', appliedDate: '2026-09-18', stage: 'Rejected', rating: 2, notes: 'Pengalaman mengajar kelas dasar kurang.' },
  { id: 7, name: 'Clara Fransiska', email: 'clara.f@email-demo.com', phone: '0812-5500-0007', requisitionId: 4, source: 'Referral', appliedDate: '2026-10-09', stage: 'Screening', rating: 4, notes: 'Lulusan Pendidikan Agama Katolik.' },
  { id: 8, name: 'Rahmat Hidayat', email: 'rahmat.h@email-demo.com', phone: '0812-5500-0008', requisitionId: 7, source: 'Job Portal', appliedDate: '2026-08-12', stage: 'Pending Employee', rating: 5, notes: 'Mulai bekerja 1 November 2026.' },
  { id: 9, name: 'Emilia Susanti', email: 'emilia.s@email-demo.com', phone: '0812-5500-0009', requisitionId: 5, source: 'Walk-in', appliedDate: '2026-10-14', stage: 'Applied', rating: 0, notes: 'Pengalaman administrasi umum dan pengelolaan fasilitas sekolah.' },
]

export const SCHOOL_INTERVIEWS = [
  { id: 1, candidateId: 1, requisitionId: 1, date: '2026-10-26', time: '10:00', type: 'Video', interviewerNames: `${name(106)}, ${name(109)}`, location: 'meet.google.com/lscs-math-science', result: 'Scheduled', notes: '' },
  { id: 2, candidateId: 4, requisitionId: 2, date: '2026-10-23', time: '13:00', type: 'Onsite', interviewerNames: name(106), location: 'Ruang MYP & SYP Principal', result: 'Scheduled', notes: '' },
  { id: 3, candidateId: 5, requisitionId: 3, date: '2026-10-14', time: '09:00', type: 'Onsite', interviewerNames: name(107), location: 'Ruang SD & Primary Principal', result: 'Passed', notes: 'Micro-teaching sangat baik.' },
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
  if (e.id === 101 || e.id === 102) return null   // the directors have no fixed schedule
  const academic = [5, 6, 7].includes(e.departmentId)
  return academic ? 1 : 2
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

// ─── Talent: key positions (keyed by position id) ────────────────────────────
// Only the positions are marked as key positions. Vacancy risk and successors describe individual
// people, so none are seeded for the real staff; HR adds them in Talent Management.
const _kp = () => ({ q1: true, q2: true, q3: true, assessedBy: 'HRGA', assessedAt: '2026-10-01' })
export const SCHOOL_KEY_POSITIONS = { 103: _kp(), 104: _kp(), 105: _kp(), 106: _kp(), 108: _kp(), 109: _kp() }
export const SCHOOL_VACANCY_RISK = {}
export const SCHOOL_SUCCESSORS = {}

// ─── Learning (LMS) mock content shown on the catalog / team dashboard ───────
export const SCHOOL_LMS = {
  categories: ['All', 'Pedagogi & Kurikulum', 'Pastoral & Karakter', 'Kepemimpinan Sekolah', 'Keselamatan & Perlindungan Anak', 'Teknologi Pembelajaran', 'Soft Skills', 'Administrasi & Keuangan'],
  catalog: [
    { id:1, title:'Perlindungan Anak dan Keselamatan di Sekolah', category:'Keselamatan & Perlindungan Anak', type:'ILT', duration:'8 jam', instructor:'Tim HRGA', rating:4.8, enrolled:38, level:'Beginner', status:'Available' },
    { id:2, title:'Kurikulum untuk Guru Mata Pelajaran (MYP & SYP)', category:'Pedagogi & Kurikulum', type:'Blended', duration:'24 jam', instructor:'Tim Kurikulum', rating:4.9, enrolled:31, level:'Intermediate', status:'Available' },
    { id:3, title:'Teknologi Pembelajaran dengan Google Workspace', category:'Teknologi Pembelajaran', type:'Self-Paced', duration:'6 jam', instructor:'Online', rating:4.6, enrolled:27, level:'Beginner', status:'Available' },
    { id:4, title:'Pendidikan Karakter dan Spiritualitas Katolik', category:'Pastoral & Karakter', type:'Blended', duration:'16 jam', instructor:'Tim Pastoral', rating:4.7, enrolled:35, level:'Intermediate', status:'Available' },
    { id:5, title:'Komunikasi Efektif dengan Orang Tua Siswa', category:'Soft Skills', type:'ILT', duration:'12 jam', instructor:'Tim Konseling', rating:4.5, enrolled:22, level:'Beginner', status:'Available' },
    { id:6, title:'Asesmen Formatif dan Penilaian Autentik', category:'Pedagogi & Kurikulum', type:'Self-Paced', duration:'20 jam', instructor:'Online', rating:4.4, enrolled:19, level:'Advanced', status:'Available' },
    { id:7, title:'Kepemimpinan Kepala Sekolah', category:'Kepemimpinan Sekolah', type:'Blended', duration:'12 jam', instructor:'Tim Manajemen', rating:4.6, enrolled:8, level:'Intermediate', status:'Available' },
    { id:8, title:'Pengelolaan Keuangan Sekolah', category:'Administrasi & Keuangan', type:'ILT', duration:'16 jam', instructor:'Tim Keuangan', rating:4.7, enrolled:9, level:'Intermediate', status:'Available' },
  ],
  // Sample progress of the MYP & SYP team (shown to every manager as demo content).
  teamSummary: [
    { name: name(127), role:'Math & Science', mandatory:3, completed:3, overdue:0, progress:100 },
    { name: name(125), role:'English', mandatory:3, completed:2, overdue:0, progress:75 },
    { name: name(119), role:'Bahasa Indonesia', mandatory:3, completed:2, overdue:0, progress:65 },
    { name: name(117), role:'Middle Year Program Teacher', mandatory:3, completed:1, overdue:1, progress:40 },
    { name: name(124), role:'IPS / Entrepreneur', mandatory:2, completed:1, overdue:0, progress:50 },
  ],
  pendingApproval: [
    { id:1, employee: name(127), type:'External Training', course:'Workshop Pengajaran Matematika dan Sains', submitted:'2026-10-12', cost:3500000 },
    { id:2, employee: name(125), type:'External Training', course:'Pelatihan Persiapan IELTS untuk Pengajar', submitted:'2026-10-15', cost:2500000 },
  ],
}

// ─── Performance: one VIP (goal) session for a teacher ───────────────────────
export const SCHOOL_VIP_SESSIONS = [
  {
    id: 1, employeeId: 127, employeeName: name(127), managerId: 106, managerName: name(106),
    name: 'Sasaran Semester Ganjil 2026/2027', date: '2026-09-14',
    submittedAt: '2026-09-14T09:00:00+07:00', status: 'Active',
    managerApprovedAt: '2026-09-15T09:00:00+07:00', managerApprovedBy: name(106),
    finalScore: null, ratingNote: '', ratedAt: null,
    topics: [
      { id: 1, title: 'Peningkatan Hasil Belajar Matematika dan Sains',
        description: 'Meningkatkan rata-rata nilai asesmen tengah semester melalui remedial terjadwal dan latihan soal berjenjang.',
        goalPlan: 'Sasaran Guru Mata Pelajaran 2026', weight: 60, status: 'In Progress',
        checkInNotes: 'Remedial berjalan tiap Selasa. Hasil asesmen tengah semester menjadi bahan evaluasi.' },
      { id: 2, title: 'Penyusunan Modul Ajar Semester Ganjil',
        description: 'Menyusun modul ajar untuk tiga bab semester ganjil dan mengirimkannya ke MYP & SYP Principal.',
        goalPlan: 'Sasaran Guru Mata Pelajaran 2026', weight: 40, status: 'In Progress',
        checkInNotes: 'Modul bab 1 dan 2 sudah dikirim.' },
    ],
  },
]

// ─── Job Load Analysis (JLA) ─────────────────────────────────────────────────
// Guru = pendidik dengan jam mengajar tetap; target minimal 40 jam/minggu, sisa
// jam diisi task oleh kepala sekolah. Employee = tenaga kependidikan/umum.
const GURU_IDS = [111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127]   // Educational Personnel
export const SCHOOL_WORKER_CATEGORIES = Object.fromEntries(
  SCHOOL_EMPLOYEES.map(e => [e.id, GURU_IDS.includes(e.id) ? 'Guru' : 'Employee'])
)

export const SCHOOL_JLA_TASK_TYPES = [
  { id: 1, name: 'Piket Sekolah', active: true },
  { id: 2, name: 'Remedial dan Pengayaan', active: true },
  { id: 3, name: 'Pembinaan Ekstrakurikuler', active: true },
  { id: 4, name: 'Administrasi Kelas', active: true },
  { id: 5, name: 'Koreksi dan Penilaian', active: true },
  { id: 6, name: 'Rapat dan Koordinasi', active: true },
  { id: 7, name: 'Pengembangan Perangkat Ajar', active: true },
  { id: 8, name: 'Pembinaan Siswa (Wali Kelas)', active: true },
  // Guru yang sedang kosong membantu mengajar mata pelajaran lain; dihitung jam mengajar.
  { id: 9, name: 'Mengajar Mata Pelajaran Lain (Perbantuan)', active: true, teaching: true },
  // Guru mengampu mata pelajaran tertentu (dipilih dari daftar Mata Pelajaran); dihitung jam mengajar.
  { id: 10, name: 'Mengajar Mata Pelajaran', active: true, teaching: true },
]

// Pilihan "Mata Pelajaran" saat menugaskan guru mengajar; HR dapat menambah atau menghapus di Pengaturan JLA.
export const SCHOOL_SUBJECTS = [
  'Matematika', 'Bahasa Inggris', 'Agama Katolik', 'Agama Islam', 'Agama Kristen', 'Agama Hindu', 'Agama Buddha',
  'Bahasa Indonesia', 'Fisika', 'Kimia', 'IPA', 'IPS', 'Geografi', 'Biologi', 'Laboratorium', 'PPKn', 'Budi Pekerti',
  'PLKJ', 'Keterampilan dan Kesenian', 'Olahraga',
  // tambahan lazim di sekolah
  'Informatika', 'Seni Budaya', 'Prakarya', 'Sejarah', 'Ekonomi', 'Sosiologi', 'Bahasa Mandarin', 'Bimbingan Konseling', 'Tematik (SD)',
]

const WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
// [employeeId, days, [[start, end, label], ...]]
const TEACHING = [
  [111, WEEK, [['07:30', '10:30', 'Kelompok A (TK)'], ['11:00', '13:00', 'Kelompok A (TK)']]],
  [112, WEEK, [['07:30', '10:00', 'Matematika Kelas 1-3'], ['10:30', '13:00', 'Matematika Kelas 4-6']]],
  [113, WEEK, [['07:30', '10:30', 'Kelas 4A'], ['11:00', '13:30', 'Kelas 4A']]],
  [114, WEEK, [['08:00', '11:00', 'Perpustakaan dan Literasi'], ['12:00', '14:00', 'Greenery Class']]],
  [115, WEEK, [['07:30', '10:30', 'Kelas 2A'], ['11:00', '13:30', 'Kelas 2A']]],
  [116, WEEK, [['07:30', '10:30', 'Kelas 5A (PYP)'], ['11:00', '14:00', 'Kelas 5A (PYP)']]],
  [117, WEEK, [['08:00', '11:00', 'Informatika 7-9'], ['12:00', '14:00', 'Pemrograman 10']]],
  [118, ['Monday', 'Wednesday', 'Friday'], [['08:00', '12:00', 'Seni Rupa (Painting) 1-9']]],
  [119, WEEK, [['08:00', '11:00', 'Bahasa Indonesia 7-9'], ['12:00', '14:00', 'Bahasa Indonesia 10']]],
  [120, ['Tuesday', 'Thursday'], [['08:00', '13:00', 'Seni Musik 1-9']]],
  [121, WEEK, [['07:30', '10:30', 'PJOK 1-6'], ['11:00', '13:00', 'PJOK 7-9']]],
  [122, ['Monday', 'Wednesday', 'Thursday'], [['08:00', '13:00', 'Bahasa Mandarin 1-9']]],
  [123, WEEK, [['08:00', '10:00', 'PPKn 7-9'], ['11:00', '13:00', 'PPKn 10']]],
  [124, WEEK, [['08:00', '11:00', 'IPS 7-9'], ['12:00', '14:00', 'Entrepreneurship 10']]],
  [125, WEEK, [['07:30', '10:30', 'English 1-6'], ['11:00', '14:00', 'English 7-9']]],
  [126, WEEK, [['08:00', '11:00', 'Religion 1-6'], ['12:00', '14:00', 'Religion 7-9']]],
  [127, WEEK, [['07:30', '10:00', 'Math 7-9'], ['10:30', '13:00', 'Science 7-9'], ['13:30', '15:30', 'Math 10']]],
]
export const SCHOOL_TEACHING_BLOCKS = (() => {
  const out = []
  TEACHING.forEach(([employeeId, days, blocks]) => days.forEach(day => blocks.forEach(([start, end, label]) => {
    out.push({ id: out.length + 1, employeeId, day, start, end, label })
  })))
  return out
})()

// [employeeId, days, start, end, taskTypeId, note]
const TASKS = [
  [125, WEEK, '14:00', '16:00', 2, 'Remedial dan pengayaan Bahasa Inggris'],
  [127, WEEK, '15:30', '17:00', 3, 'Klub Sains'],
  [116, WEEK, '14:00', '16:00', 4, 'Administrasi kelas 5A'],
  [119, ['Monday', 'Tuesday', 'Wednesday'], '14:00', '16:00', 5, 'Koreksi ulangan harian'],
  [111, WEEK, '13:00', '15:00', 4, 'Administrasi kelompok dan laporan perkembangan anak'],
]
export const SCHOOL_JLA_TASKS = (() => {
  const out = []
  TASKS.forEach(([employeeId, days, start, end, taskTypeId, note]) => days.forEach(day => {
    // The task is assigned by the teacher's own supervisor.
    const by = SCHOOL_EMPLOYEES.find(e => e.id === SCHOOL_EMPLOYEES.find(x => x.id === employeeId).managerId)
    out.push({ id: out.length + 1, employeeId, day, start, end, taskTypeId, note, createdBy: by.id, createdByName: by.name, createdAt: '2026-10-05T08:00:00+07:00' })
  }))
  return out
})()
