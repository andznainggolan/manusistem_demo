import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { dbStorage } from '@/lib/dbStorage'
import { IS_SCHOOL } from '@/lib/demoProfile'
import {
  SCHOOL_WORKER_CATEGORIES, SCHOOL_JLA_TASK_TYPES, SCHOOL_TEACHING_BLOCKS, SCHOOL_JLA_TASKS, SCHOOL_SUBJECTS,
} from '@/data/schoolSeed'
import { findConflict } from '@/lib/jla'

export const WORKER_CATEGORIES = ['Guru', 'Employee']
export const PAYROLL_MODES = [
  { value: 'monitor', label: 'Gaji tetap, JLA sebagai pemantau', hint: 'Nominal gaji tidak berubah. Jam kerja dan status Tercapai/Kurang hanya ditampilkan.' },
  { value: 'prorate', label: 'Potongan proporsional bila kurang dari target', hint: 'Gaji pokok dipotong sebanding kekurangan jam (mis. 35 dari 40 jam = potongan 12,5%).' },
]

const DEFAULT_SETTINGS = { targetHours: 40, payrollMode: 'monitor', windowStart: '06:00', windowEnd: '18:00' }

const nextId = (list) => list.reduce((m, x) => Math.max(m, x.id), 0) + 1

export const jlaCreator = (set, get) => ({
    settings: { ...DEFAULT_SETTINGS },
    taskTypes: (IS_SCHOOL ? SCHOOL_JLA_TASK_TYPES : []).map(x => ({ ...x })),
    categories: IS_SCHOOL ? { ...SCHOOL_WORKER_CATEGORIES } : {},
    subjects: IS_SCHOOL ? [...SCHOOL_SUBJECTS] : [],   // choices for the "Mata Pelajaran" dropdown
    teachingBlocks: (IS_SCHOOL ? SCHOOL_TEACHING_BLOCKS : []).map(x => ({ ...x })),
    tasks: (IS_SCHOOL ? SCHOOL_JLA_TASKS : []).map(x => ({ ...x })),

    updateSettings: (patch) => set(s => ({ settings: { ...s.settings, ...patch } })),

    // teaching: the task is a teaching assignment (covering another subject) and counts as teaching hours.
    addTaskType: (name, teaching = false) => set(s => ({ taskTypes: [...s.taskTypes, { id: nextId(s.taskTypes), name: name.trim(), active: true, teaching }] })),
    addSubject: (name) => set(s => s.subjects.some(x => x.toLowerCase() === name.trim().toLowerCase()) || !name.trim() ? s : { subjects: [...s.subjects, name.trim()] }),
    removeSubject: (name) => set(s => ({ subjects: s.subjects.filter(x => x !== name) })),
    updateTaskType: (id, patch) => set(s => ({ taskTypes: s.taskTypes.map(x => x.id === id ? { ...x, ...patch } : x) })),

    setCategory: (employeeId, category) => set(s => ({ categories: { ...s.categories, [employeeId]: category } })),

    addTeachingBlock: (b) => set(s => ({ teachingBlocks: [...s.teachingBlocks, { id: nextId(s.teachingBlocks), ...b }] })),
    deleteTeachingBlock: (id) => set(s => ({ teachingBlocks: s.teachingBlocks.filter(x => x.id !== id) })),
    // Excel import into the default pattern. items = { blocks, tasks }; mode 'replace' swaps the
    // teacher's whole pattern, 'append' adds to it. New ids start above every id used so far.
    importPlan: (employeeId, items, mode, by) => set(s => {
      const keep = (list) => mode === 'replace' ? list.filter(x => x.employeeId !== employeeId) : list
      let bid = nextId(s.teachingBlocks), tid = nextId(s.tasks)
      const at = new Date().toISOString()
      return {
        teachingBlocks: [...keep(s.teachingBlocks), ...items.blocks.map(b => ({ id: bid++, employeeId, ...b }))],
        tasks: [...keep(s.tasks), ...items.tasks.map(t => ({ id: tid++, employeeId, ...t, createdBy: by?.id, createdByName: by?.name, createdAt: at }))],
      }
    }),
    // Empties one teacher's weekly calendar: fixed teaching blocks and/or tasks.
    clearWeek: (employeeId, { blocks = true, tasks = true } = {}) => set(s => ({
      teachingBlocks: blocks ? s.teachingBlocks.filter(b => b.employeeId !== employeeId) : s.teachingBlocks,
      tasks: tasks ? s.tasks.filter(t => t.employeeId !== employeeId) : s.tasks,
    })),

    // days: array of day keys. Returns { ok, error }. Nothing is saved when any day conflicts.
    addTasks: ({ employeeId, days, start, end, taskTypeId, note, subject = '', subjectName = '', className = '', createdBy, createdByName }) => {
      const { teachingBlocks, tasks } = get()
      for (const day of days) {
        const c = findConflict(employeeId, day, start, end, teachingBlocks, tasks)
        if (c) return { ok: false, error: { day, ...c } }
      }
      set(s => {
        let id = nextId(s.tasks)
        const teaching = !!s.taskTypes.find(t => t.id === taskTypeId)?.teaching
        const created = days.map(day => ({
          id: id++, employeeId, day, start, end, taskTypeId, note: note || '',
          ...(teaching ? { teaching: true, subject, subjectName, className } : {}),
          createdBy, createdByName, createdAt: new Date().toISOString(),
        }))
        return { tasks: [...s.tasks, ...created] }
      })
      return { ok: true }
    },
    updateTask: (id, patch) => {
      const { teachingBlocks, tasks } = get()
      const cur = tasks.find(t => t.id === id)
      if (!cur) return { ok: false }
      const next = { ...cur, ...patch }
      const teaching = !!get().taskTypes.find(t => t.id === next.taskTypeId)?.teaching
      if (teaching) next.teaching = true
      else { delete next.teaching; delete next.subject; delete next.subjectName; delete next.className }
      const c = findConflict(next.employeeId, next.day, next.start, next.end, teachingBlocks, tasks, id)
      if (c) return { ok: false, error: { day: next.day, ...c } }
      set(s => ({ tasks: s.tasks.map(t => t.id === id ? next : t) }))
      return { ok: true }
    },
    deleteTask: (id) => set(s => ({ tasks: s.tasks.filter(t => t.id !== id) })),
})

export const useJlaStore = create(persist(
  jlaCreator,
  {
    name: 'hcm-jla-v1',
    storage: createJSONStorage(() => dbStorage),
    // v1 -> v2: stored school data gains the "teach another subject" task type
    // without losing the tasks and settings already saved.
    version: 4,
    migrate: (state, version) => {
      if (version < 2 && IS_SCHOOL && state?.taskTypes && !state.taskTypes.some(t => t.teaching)) {
        const seed = SCHOOL_JLA_TASK_TYPES.find(t => t.teaching)
        if (seed) state.taskTypes = [...state.taskTypes, { ...seed, id: nextId(state.taskTypes) }]
      }
      // v2 -> v3: the sample teachers (employee ids 42+) get their category and weekly timetable.
      if (version < 3 && IS_SCHOOL && state) {
        const cats = { ...(state.categories || {}) }
        Object.entries(SCHOOL_WORKER_CATEGORIES).forEach(([id, c]) => { if (Number(id) > 41 && !(id in cats)) cats[id] = c })
        state.categories = cats
        const blocks = state.teachingBlocks || []
        const have = new Set(blocks.map(b => b.employeeId))
        let nid = nextId(blocks)
        state.teachingBlocks = [...blocks, ...SCHOOL_TEACHING_BLOCKS.filter(b => b.employeeId > 41 && !have.has(b.employeeId)).map(b => ({ ...b, id: nid++ }))]
      }
      // v3 -> v4: the "Mengajar Mata Pelajaran" task type and the subject list.
      if (version < 4 && IS_SCHOOL && state) {
        const types = state.taskTypes || []
        if (!types.some(t => t.name === 'Mengajar Mata Pelajaran')) {
          const seed = SCHOOL_JLA_TASK_TYPES.find(t => t.name === 'Mengajar Mata Pelajaran')
          if (seed) state.taskTypes = [...types, { ...seed, id: nextId(types) }]
        }
        if (!state.subjects) state.subjects = [...SCHOOL_SUBJECTS]
      }
      return state
    },
  }
))
