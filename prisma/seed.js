// prisma/seed.js
// Initializes the database from the committed data files in public/data/.
// Idempotent: uses createMany({ skipDuplicates }) so re-running won't duplicate.
//
//   1. Provide a Postgres connection string in .env  (DATABASE_URL=...)
//   2. npx prisma migrate deploy   (or: npx prisma db push)
//   3. npx prisma db seed
//
const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()
const dataDir = path.join(__dirname, '..', 'public', 'data')
const read = (f) => JSON.parse(fs.readFileSync(path.join(dataDir, f), 'utf-8'))

async function batch(model, rows, label) {
  const SIZE = 1000
  let count = 0
  for (let i = 0; i < rows.length; i += SIZE) {
    const res = await model.createMany({ data: rows.slice(i, i + SIZE), skipDuplicates: true })
    count += res.count
  }
  console.log(`   ${label.padEnd(14)} ${count}/${rows.length}`)
}

async function main() {
  console.log('🌱 Seeding database from public/data/ …')

  const structure = read('importedStructure.json')
  const grades    = read('grades.json')
  const employees = read('importedEmployees.json')
  const users     = read('importedUsers.json')

  // ── Org structure (parents → children) ──────────────────────────────────────
  await batch(prisma.enterprise,   structure.enterprises,   'enterprises')
  await batch(prisma.division,     structure.divisions,     'divisions')
  await batch(prisma.company,      structure.companies,     'companies')
  await batch(prisma.businessUnit, structure.businessUnits, 'businessUnits')
  await batch(prisma.department,   structure.departments,   'departments')
  await batch(prisma.jobFamily,    structure.jobFamilies,   'jobFamilies')
  await batch(prisma.grade,        grades,                  'grades')
  await batch(prisma.position,     structure.positions,     'positions')

  // ── Employees (nested arrays in the JSON are not part of the schema → dropped) ─
  const empRows = employees.map(e => ({
    id: e.id, nik: String(e.nik || ''), name: e.name || '', status: e.status || 'Active',
    companyId: e.companyId ?? null, divisionId: e.divisionId ?? null,
    businessUnitId: e.businessUnitId ?? null, departmentId: e.departmentId ?? null,
    positionId: e.positionId ?? null, gradeId: e.gradeId ?? null, managerId: e.managerId ?? null,
    employmentType: e.employmentType || '', role: e.role || 'employee',
    joinDate: e.joinDate || '', endDate: e.endDate || '',
    gender: e.gender || '', birthPlace: e.birthPlace || '', birthDate: e.birthDate || '',
    nationality: e.nationality || '', religion: e.religion || '', maritalStatus: e.maritalStatus || '',
    ktp: e.ktp || '', phone: e.phone || '', email: e.email || '', personalEmail: e.personalEmail || '',
    address: e.address || '', city: e.city || '', province: e.province || '', country: e.country || '',
    location: e.location || '',
  }))
  await batch(prisma.employee, empRows, 'employees')

  // ── Login accounts (username = NIK, password = pass123) ──────────────────────
  const userRows = users.map(u => ({
    id: u.id, username: String(u.username), password: u.password || 'pass123',
    name: u.name || '', role: u.role || 'employee', dept: u.dept || '',
    position: u.position || '', email: u.email || '', employeeId: u.employeeId ?? null,
  }))
  await batch(prisma.user, userRows, 'users')

  console.log('✅ Seed complete')
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
