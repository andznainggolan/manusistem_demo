import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { dbStorage } from '@/lib/dbStorage'
import { findConflict } from '@/lib/jla'
import { weekKey, planForWeek, addDays } from '@/lib/jlaRealization'

// Week-specific JLA plans. Without an entry a week follows the default weekly
// pattern (jlaStore); the first edit of a week copies that pattern here and
// the week is independent from then on.
// weeks['empId|YYYY-MM-DD(monday)'] = { blocks: [...], tasks: [...] }, same item shape as jlaStore.
const NEW_ID_BASE = 100000   // above any default-pattern id, so a new item never reuses the id of a deleted one

const nextId = (list) => Math.max(NEW_ID_BASE, ...list.map(x => x.id)) + 1
const copy = (list) => list.map(x => ({ ...x }))

// The week's plan, copied from the default pattern (tpl) when it does not exist yet.
function materialize(weeks, empId, monday, tpl) {
  const cur = weeks[weekKey(empId, monday)]
  if (cur) return cur
  const p = planForWeek(empId, monday, tpl.blocks, tpl.tasks, {})
  return { blocks: copy(p.blocks), tasks: copy(p.tasks) }
}

export const weekCreator = (set, get) => {
    const put = (empId, monday, plan) => set(s => ({ weeks: { ...s.weeks, [weekKey(empId, monday)]: plan } }))
    return {
      weeks: {},

      // args: { days, start, end, taskTypeId, note, subject, teaching, createdBy, createdByName }
      addTasks: (empId, monday, tpl, args) => {
        const plan = materialize(get().weeks, empId, monday, tpl)
        for (const day of args.days) {
          const c = findConflict(empId, day, args.start, args.end, plan.blocks, plan.tasks)
          if (c) return { ok: false, error: { day, ...c } }
        }
        let id = nextId(plan.tasks)
        const created = args.days.map(day => ({
          id: id++, employeeId: empId, day, start: args.start, end: args.end, taskTypeId: args.taskTypeId, note: args.note || '',
          ...(args.teaching ? { teaching: true, subject: args.subject || '' } : {}),
          createdBy: args.createdBy, createdByName: args.createdByName, createdAt: new Date().toISOString(),
        }))
        put(empId, monday, { blocks: plan.blocks, tasks: [...plan.tasks, ...created] })
        return { ok: true }
      },

      updateTask: (empId, monday, tpl, id, patch) => {
        const plan = materialize(get().weeks, empId, monday, tpl)
        const cur = plan.tasks.find(t => t.id === id)
        if (!cur) return { ok: false }
        const next = { ...cur, ...patch }
        if (next.teaching) next.teaching = true
        else { delete next.teaching; delete next.subject }
        const c = findConflict(empId, next.day, next.start, next.end, plan.blocks, plan.tasks, id)
        if (c) return { ok: false, error: { day: next.day, ...c } }
        put(empId, monday, { blocks: plan.blocks, tasks: plan.tasks.map(t => t.id === id ? next : t) })
        return { ok: true }
      },

      deleteTask: (empId, monday, tpl, id) => {
        const plan = materialize(get().weeks, empId, monday, tpl)
        put(empId, monday, { blocks: plan.blocks, tasks: plan.tasks.filter(t => t.id !== id) })
      },
      deleteBlock: (empId, monday, tpl, id) => {
        const plan = materialize(get().weeks, empId, monday, tpl)
        put(empId, monday, { blocks: plan.blocks.filter(b => b.id !== id), tasks: plan.tasks })
      },
      clearWeek: (empId, monday, tpl, { blocks = true, tasks = true } = {}) => {
        const plan = materialize(get().weeks, empId, monday, tpl)
        put(empId, monday, { blocks: blocks ? [] : plan.blocks, tasks: tasks ? [] : plan.tasks })
      },

      // Excel import into one week. items = { blocks, tasks }; 'replace' starts the week from the file,
      // 'append' adds to the week's current plan (the default pattern when it has none).
      importPlan: (empId, monday, tpl, items, mode, by) => {
        const base = mode === 'append' ? materialize(get().weeks, empId, monday, tpl) : { blocks: [], tasks: [] }
        let bid = nextId(base.blocks), tid = nextId(base.tasks)
        const at = new Date().toISOString()
        put(empId, monday, {
          blocks: [...base.blocks, ...items.blocks.map(b => ({ id: bid++, employeeId: empId, ...b }))],
          tasks: [...base.tasks, ...items.tasks.map(t => ({ id: tid++, employeeId: empId, ...t, createdBy: by?.id, createdByName: by?.name, createdAt: at }))],
        })
      },

      // Back to following the default pattern.
      resetWeek: (empId, monday) => set(s => {
        const { [weekKey(empId, monday)]: _drop, ...rest } = s.weeks
        return { weeks: rest }
      }),

      // Copies the previous week's plan (its own, or the default if it has none) into this week.
      copyFromPrevious: (empId, monday, tpl) => {
        const prev = planForWeek(empId, addDays(monday, -7), tpl.blocks, tpl.tasks, get().weeks)
        put(empId, monday, { blocks: copy(prev.blocks), tasks: copy(prev.tasks) })
      },
    }
}

export const useJlaWeekStore = create(persist(
  weekCreator,
  { name: 'hcm-jla-weeks-v1', storage: createJSONStorage(() => dbStorage) }
))
