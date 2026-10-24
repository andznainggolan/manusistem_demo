import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { dbStorage } from '@/lib/dbStorage'
import { IS_SCHOOL } from '@/lib/demoProfile'
import {
  SCHOOL_WORKER_CATEGORIES, SCHOOL_JLA_TASK_TYPES, SCHOOL_TEACHING_BLOCKS, SCHOOL_JLA_TASKS,
} from '@/data/schoolSeed'
import { findConflict } from '@/lib/jla'

export const WORKER_CATEGORIES = ['Guru', 'Employee']
export const PAYROLL_MODES = [
  { value: 'monitor', label: 'Gaji tetap, JLA sebagai pemantau', hint: 'Nominal gaji tidak berubah. Jam kerja dan status Tercapai/Kurang hanya ditampilkan.' },
  { value: 'prorate', label: 'Potongan proporsional bila kurang dari target', hint: 'Gaji pokok dipotong sebanding kekurangan jam (mis. 35 dari 40 jam = potongan 12,5%).' },
]

const DEFAULT_SETTINGS = { targetHours: 40, payrollMode: 'monitor', windowStart: '06:00', windowEnd: '18:00' }

const nextId = (list) => list.reduce((m, x) => Math.max(m, x.id), 0) + 1

export const useJlaStore = create(persist(
  (set, get) => ({
    settings: { ...DEFAULT_SETTINGS },
    taskTypes: (IS_SCHOOL ? SCHOOL_JLA_TASK_TYPES : []).map(x => ({ ...x })),
    categories: IS_SCHOOL ? { ...SCHOOL_WORKER_CATEGORIES } : {},
    teachingBlocks: (IS_SCHOOL ? SCHOOL_TEACHING_BLOCKS : []).map(x => ({ ...x })),
    tasks: (IS_SCHOOL ? SCHOOL_JLA_TASKS : []).map(x => ({ ...x })),

    updateSettings: (patch) => set(s => ({ settings: { ...s.settings, ...patch } })),

    // teaching: the task is a teaching assignment (covering another subject) and counts as teaching hours.
    addTaskType: (name, teaching = false) => set(s => ({ taskTypes: [...s.taskTypes, { id: nextId(s.taskTypes), name: name.trim(), active: true, teaching }] })),
    updateTaskType: (id, patch) => set(s => ({ taskTypes: s.taskTypes.map(x => x.id === id ? { ...x, ...patch } : x) })),

    setCategory: (employeeId, category) => set(s => ({ categories: { ...s.categories, [employeeId]: category } })),

    addTeachingBlock: (b) => set(s => ({ teachingBlocks: [...s.teachingBlocks, { id: nextId(s.teachingBlocks), ...b }] })),
    deleteTeachingBlock: (id) => set(s => ({ teachingBlocks: s.teachingBlocks.filter(x => x.id !== id) })),

    // days: array of day keys. Returns { ok, error }. Nothing is saved when any day conflicts.
    addTasks: ({ employeeId, days, start, end, taskTypeId, note, subject = '', createdBy, createdByName }) => {
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
          ...(teaching ? { teaching: true, subject } : {}),
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
      else { delete next.teaching; delete next.subject }
      const c = findConflict(next.employeeId, next.day, next.start, next.end, teachingBlocks, tasks, id)
      if (c) return { ok: false, error: { day: next.day, ...c } }
      set(s => ({ tasks: s.tasks.map(t => t.id === id ? next : t) }))
      return { ok: true }
    },
    deleteTask: (id) => set(s => ({ tasks: s.tasks.filter(t => t.id !== id) })),
  }),
  {
    name: 'hcm-jla-v1',
    storage: createJSONStorage(() => dbStorage),
    // v1 -> v2: stored school data gains the "teach another subject" task type
    // without losing the tasks and settings already saved.
    version: 2,
    migrate: (state, version) => {
      if (version < 2 && IS_SCHOOL && state?.taskTypes && !state.taskTypes.some(t => t.teaching)) {
        const seed = SCHOOL_JLA_TASK_TYPES.find(t => t.teaching)
        if (seed) state.taskTypes = [...state.taskTypes, { ...seed, id: nextId(state.taskTypes) }]
      }
      return state
    },
  }
))
