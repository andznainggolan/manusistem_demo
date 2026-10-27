// Excel export/import for JLA plans. One row per block, same columns in the template,
// in a per-teacher export and in a "current schedule" export, so any of them can be edited
// and uploaded again.
import { DAYS, toMin, toHHMM, fmtHours, findConflict, weekSummary } from '@/lib/jla'
import { mondayOf, addDays, weekDates } from '@/lib/jlaRealization'

export const HEADERS = ['NIK', 'Nama (info)', 'Jenis', 'Hari', 'Mulai', 'Selesai', 'Mata Pelajaran / Jenis Task', 'Catatan', 'Minggu (tanggal Senin, kosong = pola default)']
export const JENIS = { block: 'Mengajar Tetap', task: 'Task', assist: 'Mengajar Perbantuan', subject: 'Mengajar Mata Pelajaran' }
const DAY_LABEL = Object.fromEntries(DAYS.map(d => [d.key, d.label]))

const norm = (v) => String(v ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
const DAY_ALIAS = {
  senin: 'Monday', sen: 'Monday', monday: 'Monday', mon: 'Monday',
  selasa: 'Tuesday', sel: 'Tuesday', tuesday: 'Tuesday', tue: 'Tuesday',
  rabu: 'Wednesday', rab: 'Wednesday', wednesday: 'Wednesday', wed: 'Wednesday',
  kamis: 'Thursday', kam: 'Thursday', thursday: 'Thursday', thu: 'Thursday',
  jumat: 'Friday', jum: 'Friday', friday: 'Friday', fri: 'Friday',
}
const JENIS_ALIAS = {
  mengajartetap: 'block', mengajar: 'block', jammengajar: 'block', blokmengajar: 'block',
  task: 'task', tasktambahan: 'task',
  mengajarperbantuan: 'assist', perbantuan: 'assist', mengajarmatapelajaran: 'subject',
}

// ---- cell conversions (Excel hands back times as day fractions and dates as serial numbers)
function toTime(v) {
  if (typeof v === 'number' && v >= 0 && v < 1.0001) { const m = Math.round(v * 1440); return toHHMM(Math.min(m, 1439)) }
  const m = String(v ?? '').trim().match(/^(\d{1,2})[:.](\d{2})(?::\d{2})?$/)
  if (!m) return null
  const h = Number(m[1]), mi = Number(m[2])
  if (h > 23 || mi > 59) return null
  return `${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}`
}
function toDateStr(v) {
  if (v === '' || v == null) return ''
  if (typeof v === 'number') return new Date(Date.UTC(1899, 11, 30) + Math.round(v) * 86400000).toISOString().slice(0, 10)
  const s = String(v).trim()
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`
  m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  return null
}

// ---- writing
async function xlsx() { return await import('xlsx') }
async function save(filename, sheets) {
  const XLSX = await xlsx()
  const wb = XLSX.utils.book_new()
  sheets.forEach(({ name, rows, widths }) => {
    const ws = XLSX.utils.aoa_to_sheet(rows)
    if (widths) ws['!cols'] = widths.map(w => ({ wch: w }))
    XLSX.utils.book_append_sheet(wb, ws, name)
  })
  XLSX.writeFile(wb, filename)
}

const TEMPLATE_WIDTHS = [14, 24, 20, 10, 8, 8, 34, 28, 26]

/** Template-shaped rows for one teacher's plan; `monday` '' means the default pattern. */
export function planRows(emp, plan, typeName, monday = '') {
  const order = (a, b) => DAYS.findIndex(d => d.key === a.day) - DAYS.findIndex(d => d.key === b.day) || toMin(a.start) - toMin(b.start)
  return [
    ...[...plan.blocks].sort(order).map(b => [emp.nik, emp.name, JENIS.block, DAY_LABEL[b.day], b.start, b.end, b.label, '', monday]),
    ...[...plan.tasks].sort(order).map(t => t.teaching
      ? [emp.nik, emp.name, typeName(t.taskTypeId) === 'Mengajar Mata Pelajaran' ? JENIS.subject : JENIS.assist, DAY_LABEL[t.day], t.start, t.end, t.subject || typeName(t.taskTypeId), t.note || '', monday]
      : [emp.nik, emp.name, JENIS.task, DAY_LABEL[t.day], t.start, t.end, typeName(t.taskTypeId), t.note || '', monday]),
  ]
}

function instructionRows() {
  return [
    ['PETUNJUK PENGISIAN TEMPLATE JLA'],
    [],
    ['1. Isi sheet "Template": satu baris untuk satu blok jadwal.'],
    ['2. NIK harus sama dengan NIK karyawan kategori Guru (lihat sheet "Referensi"). Kolom Nama hanya informasi.'],
    ['3. Jenis: "Mengajar Tetap" (jam mengajar), "Task" (task tambahan), "Mengajar Mata Pelajaran" (guru mengampu mata pelajaran, dihitung jam mengajar), atau "Mengajar Perbantuan" (guru mengajar mata pelajaran lain).'],
    ['4. Hari: Senin sampai Jumat. Mulai dan Selesai: format JJ:MM, misalnya 07:30.'],
    ['5. Mata Pelajaran / Jenis Task: untuk Mengajar Tetap, Mengajar Mata Pelajaran, dan Perbantuan isi mata pelajaran dan kelas (mis. "Matematika 7A"; nama mata pelajaran ada di sheet "Referensi"); untuk Task isi nama jenis task persis seperti di sheet "Referensi".'],
    ['6. Minggu: kosongkan untuk pola default (berlaku setiap minggu). Isi tanggal Senin (YYYY-MM-DD) untuk jadwal khusus minggu itu saja.'],
    ['7. Blok tidak boleh saling bertumpuk dan harus berada dalam jam kerja efektif.'],
    ['8. Saat impor Anda memilih: Ganti (jadwal guru pada pola atau minggu itu diganti isi file) atau Tambahkan (jadwal yang ada dipertahankan).'],
    ['9. Jika ada baris bermasalah pada seorang guru, guru itu dilewati seluruhnya dan yang lain tetap diimpor.'],
  ]
}
function referenceRows(teachers, taskTypes, positionName, subjects = []) {
  const types = taskTypes.filter(t => t.active && !t.teaching)
  const n = Math.max(teachers.length, types.length, subjects.length, 5)
  const rows = [['NIK Guru', 'Nama', 'Jabatan', '', 'Jenis Task (untuk jenis "Task")', '', 'Hari', '', 'Mata Pelajaran']]
  for (let i = 0; i < n; i++) {
    const t = teachers[i]
    rows.push([t?.nik || '', t?.name || '', t ? positionName(t) : '', '', types[i]?.name || '', '', DAYS[i]?.label || '', '', subjects[i] || ''])
  }
  return rows
}

const SAMPLE = [
  ['LSCS-015', 'Yohanes Aditya', JENIS.block, 'Senin', '07:00', '08:00', 'Matematika 7A', '', ''],
  ['LSCS-015', 'Yohanes Aditya', JENIS.task, 'Senin', '08:00', '09:00', 'Remedial dan Pengayaan', 'Contoh task', ''],
  ['LSCS-015', 'Yohanes Aditya', JENIS.assist, 'Selasa', '13:00', '15:00', 'Pendidikan Agama Katolik 7C', 'Contoh perbantuan, hanya minggu ini', '2026-10-26'],
]

/** Empty template with sample rows, or prefilled with `rows` (current schedules). */
export async function downloadTemplate({ teachers, taskTypes, positionName, subjects = [], rows = null, filename = 'template-jla.xlsx' }) {
  await save(filename, [
    { name: 'Template', rows: [HEADERS, ...(rows || SAMPLE)], widths: TEMPLATE_WIDTHS },
    { name: 'Petunjuk', rows: instructionRows(), widths: [120] },
    { name: 'Referensi', rows: referenceRows(teachers, taskTypes, positionName, subjects), widths: [14, 26, 30, 3, 34, 3, 10, 3, 28] },
  ])
}

/** One teacher: Template-shaped rows (re-importable), a time grid, and a summary. */
export async function downloadTeacherPlan({ emp, plan, monday, typeName, settings, positionName, target }) {
  const label = monday ? `minggu ${monday} s/d ${addDays(monday, 4)}` : 'pola default'
  const sum = weekSummary(emp.id, plan.blocks, plan.tasks, target)
  const dates = monday ? weekDates(monday) : null
  const ws = toMin(settings.windowStart), we = toMin(settings.windowEnd)
  const grid = [['Jam', ...DAYS.map((d, i) => dates ? `${d.label} ${dates[i].slice(8)}/${dates[i].slice(5, 7)}` : d.label)]]
  const items = [
    ...plan.blocks.map(b => ({ day: b.day, start: b.start, end: b.end, text: b.label })),
    ...plan.tasks.map(t => ({ day: t.day, start: t.start, end: t.end, text: t.teaching && t.subject ? t.subject : typeName(t.taskTypeId) })),
  ]
  for (let m = ws; m < we; m += 30) {
    grid.push([`${toHHMM(m)}-${toHHMM(m + 30)}`, ...DAYS.map(d => items.find(x => x.day === d.key && toMin(x.start) <= m && m < toMin(x.end))?.text || '')])
  }
  const safe = emp.name.replace(/[^A-Za-z0-9]+/g, '-')
  await save(`jla-${safe}-${monday || 'default'}.xlsx`, [
    { name: 'Template', rows: [HEADERS, ...planRows(emp, plan, typeName, monday || '')], widths: TEMPLATE_WIDTHS },
    { name: 'Grid', rows: grid, widths: [14, 24, 24, 24, 24, 24] },
    { name: 'Ringkasan', widths: [28, 40], rows: [
      ['Guru', emp.name], ['NIK', emp.nik], ['Jabatan', positionName(emp)], ['Unit', emp.department], ['Jadwal', label],
      ['Jam mengajar', fmtHours(sum.teaching)], ['Task tambahan', fmtHours(sum.task)], ['Total jam', fmtHours(sum.total)],
      ['Target per minggu', String(target)], ['Kekurangan', fmtHours(sum.gap)], ['Status', sum.achieved ? 'Tercapai' : 'Belum tercapai'],
    ] },
  ])
}

/** Summary workbook: plan per teacher for a scope, and (optionally) realisation for a period. */
export async function downloadSummary({ planRowsData, planLabel, realRows = null, range = null, positionName, target }) {
  const sheets = [{
    name: 'Plan',
    widths: [14, 26, 28, 22, 14, 14, 12, 12, 12, 16],
    rows: [
      [`Plan JLA: ${planLabel}`], [],
      ['NIK', 'Guru', 'Jabatan', 'Unit', 'Jam mengajar', 'Task tambahan', 'Total jam', `Target`, 'Kurang', 'Status'],
      ...planRowsData.map(({ emp, sum }) => [emp.nik, emp.name, positionName(emp), emp.department, Number(sum.teaching.toFixed(2)), Number(sum.task.toFixed(2)), Number(sum.total.toFixed(2)), target, Number(sum.gap.toFixed(2)), sum.achieved ? 'Tercapai' : 'Belum tercapai']),
    ],
  }]
  if (realRows) {
    sheets.push({
      name: 'Realisasi',
      widths: [14, 26, 28, 12, 14, 12, 14, 22, 18],
      rows: [
        [`Realisasi JLA: ${range.from} s/d ${range.to}`], [],
        ['NIK', 'Guru', 'Jabatan', 'Plan (jam)', 'Realisasi (jam)', 'Selisih', 'Pencapaian (%)', 'Belum dikonfirmasi (item)', 'Menunggu validasi (item)'],
        ...realRows.map(r => [r.emp.nik, r.emp.name, positionName(r.emp), Number(r.planned.toFixed(2)), Number(r.realized.toFixed(2)), Number((r.realized - r.planned).toFixed(2)), r.pct ?? '', r.unconfirmed, r.pendingValidation]),
      ],
    })
  }
  await save(`summary-jla-${(range?.from || 'plan')}.xlsx`, sheets)
}

// ---- reading
/** Reads the Template sheet (or the first sheet) into raw rows: { line, cells }. */
export async function readTemplate(arrayBuffer) {
  const XLSX = await xlsx()
  const wb = XLSX.read(arrayBuffer, { type: 'array' })
  const ws = wb.Sheets.Template || wb.Sheets[wb.SheetNames[0]]
  const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: '' })
  const head = (aoa[0] || []).map(norm)
  const col = (pred) => head.findIndex(pred)
  const idx = {
    nik: col(h => h === 'nik' || h === 'nomorinduk'),
    jenis: col(h => h === 'jenis'),
    hari: col(h => h === 'hari'),
    mulai: col(h => h === 'mulai' || h === 'jammulai'),
    selesai: col(h => h === 'selesai' || h === 'jamselesai'),
    ket: col(h => h.startsWith('matapelajaran') || h === 'keterangan' || h === 'kegiatan'),
    catatan: col(h => h === 'catatan'),
    minggu: col(h => h.startsWith('minggu')),
  }
  const missing = ['nik', 'jenis', 'hari', 'mulai', 'selesai', 'ket'].filter(k => idx[k] < 0)
  if (missing.length) throw new Error('Kolom tidak ditemukan: ' + missing.join(', ') + '. Gunakan template dari halaman ini.')
  const get = (r, k) => (idx[k] >= 0 ? r[idx[k]] : '')
  return aoa.slice(1).map((r, i) => ({ line: i + 2, r })).filter(({ r }) => r.some(c => String(c).trim() !== ''))
    .map(({ line, r }) => ({
      line, nik: String(get(r, 'nik')).trim(), jenis: get(r, 'jenis'), hari: get(r, 'hari'), mulai: get(r, 'mulai'),
      selesai: get(r, 'selesai'), ket: String(get(r, 'ket')).trim(), catatan: String(get(r, 'catatan')).trim(), minggu: get(r, 'minggu'),
    }))
}

/**
 * Validates raw rows. ctx = { employees, categories, taskTypes, settings, canImport(emp), existing(empId, monday|'') -> {blocks, tasks} }.
 * Returns { rows, groups }: rows carry `errors`, groups (teacher + scope) are `ok` only when none of their rows has an error.
 */
export function validateRows(raw, ctx, mode) {
  const byNik = new Map(ctx.employees.map(e => [String(e.nik).trim().toLowerCase(), e]))
  const ws = toMin(ctx.settings.windowStart), we = toMin(ctx.settings.windowEnd)
  const assistType = ctx.taskTypes.find(t => t.active && t.teaching && /perbantuan/i.test(t.name))
  const subjectType = ctx.taskTypes.find(t => t.active && t.teaching && !/perbantuan/i.test(t.name))

  const rows = raw.map(x => {
    const errors = []
    const emp = byNik.get(x.nik.toLowerCase()) || null
    if (!x.nik) errors.push('NIK kosong')
    else if (!emp) errors.push('NIK tidak ditemukan')
    else if (ctx.categories[emp.id] !== 'Guru') errors.push('Bukan pekerja kategori Guru')
    else if (!ctx.canImport(emp)) errors.push('Di luar wewenang Anda (bukan bawahan Anda)')
    const kind = JENIS_ALIAS[norm(x.jenis)]
    if (!kind) errors.push('Jenis tidak dikenal (Mengajar Tetap, Task, Mengajar Mata Pelajaran, atau Mengajar Perbantuan)')
    const day = DAY_ALIAS[norm(x.hari)]
    if (!day) errors.push('Hari harus Senin sampai Jumat')
    const start = toTime(x.mulai), end = toTime(x.selesai)
    if (!start) errors.push('Jam mulai tidak valid (JJ:MM)')
    if (!end) errors.push('Jam selesai tidak valid (JJ:MM)')
    if (start && end) {
      if (toMin(end) <= toMin(start)) errors.push('Jam selesai harus setelah jam mulai')
      else if (toMin(start) < ws || toMin(end) > we) errors.push(`Di luar jam kerja efektif (${ctx.settings.windowStart}-${ctx.settings.windowEnd})`)
    }
    if (!x.ket) errors.push(kind === 'task' ? 'Jenis task kosong' : 'Mata pelajaran kosong')
    let taskTypeId = null
    if (kind === 'task' && x.ket) {
      const t = ctx.taskTypes.find(t => t.active && !t.teaching && norm(t.name) === norm(x.ket))
      if (!t) errors.push('Jenis task tidak dikenal (lihat sheet Referensi)')
      else taskTypeId = t.id
    }
    if (kind === 'assist') {
      if (!assistType) errors.push('Jenis task perbantuan belum tersedia di Pengaturan')
      else taskTypeId = assistType.id
    }
    if (kind === 'subject') {
      if (!subjectType) errors.push('Jenis task "Mengajar Mata Pelajaran" belum tersedia di Pengaturan')
      else taskTypeId = subjectType.id
    }
    let week = ''
    const wd = toDateStr(x.minggu)
    if (wd === null) errors.push('Tanggal minggu tidak valid (YYYY-MM-DD)')
    else if (wd) week = mondayOf(wd)
    return { ...x, emp, kind, day, start, end, taskTypeId, week, errors, group: emp ? `${emp.id}|${week || 'default'}` : null }
  })

  // Overlaps inside the file, and (when adding) against what already exists.
  const placed = {}
  rows.forEach(r => {
    if (r.errors.length || !r.group) return
    const list = (placed[r.group] ||= [])
    const clash = list.find(p => p.day === r.day && toMin(p.start) < toMin(r.end) && toMin(r.start) < toMin(p.end))
    if (clash) r.errors.push(`Bentrok dengan baris ${clash.line}`)
    else if (mode === 'append') {
      const ex = ctx.existing(r.emp.id, r.week)
      const c = findConflict(r.emp.id, r.day, r.start, r.end, ex.blocks, ex.tasks)
      if (c) r.errors.push(`Bentrok dengan jadwal yang sudah ada (${c.label} ${c.start}-${c.end})`)
    }
    if (!r.errors.length) list.push(r)
  })

  const groups = {}
  rows.forEach(r => {
    if (!r.group) return
    const g = (groups[r.group] ||= { key: r.group, emp: r.emp, week: r.week, rows: [], ok: true })
    g.rows.push(r)
    if (r.errors.length) g.ok = false
  })
  return { rows, groups: Object.values(groups) }
}

/** Items of a valid group in the shape both stores take. */
export function groupItems(g) {
  const blocks = [], tasks = []
  g.rows.forEach(r => {
    if (r.kind === 'block') blocks.push({ day: r.day, start: r.start, end: r.end, label: r.ket })
    else tasks.push({ day: r.day, start: r.start, end: r.end, taskTypeId: r.taskTypeId, note: r.catatan, ...(r.kind === 'assist' || r.kind === 'subject' ? { teaching: true, subject: r.ket } : {}) })
  })
  return { blocks, tasks }
}

