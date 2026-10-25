'use client'
import { useEffect } from 'react'
import { createStore } from 'zustand/vanilla'
import { useStore } from 'zustand'
import { jlaCreator, useJlaStore } from '@/store/jlaStore'
import { weekCreator, useJlaWeekStore } from '@/store/jlaWeekStore'

// Calendar edits are made on a draft copy of the JLA plans and only reach the saved
// stores (and the database) when the user presses Simpan. The drafts live at module
// level, so they survive switching tabs or pages inside the app, but not a reload.
const draftJla = createStore(jlaCreator)
const draftWk = createStore(weekCreator)
// The saved data the draft was last synced to (by reference), to tell edits from saves.
const baseStore = createStore(() => ({ b: null, t: null, w: null, ready: false }))

function adopt() {
  const real = useJlaStore.getState()
  const weeks = useJlaWeekStore.getState().weeks
  draftJla.setState({ settings: real.settings, taskTypes: real.taskTypes, categories: real.categories, teachingBlocks: real.teachingBlocks, tasks: real.tasks })
  draftWk.setState({ weeks })
  baseStore.setState({ b: real.teachingBlocks, t: real.tasks, w: weeks, ready: true })
}

export function useJlaDraft() {
  const real = useJlaStore()
  const realWeeks = useJlaWeekStore(s => s.weeks)
  const jla = useStore(draftJla)
  const wk = useStore(draftWk)
  const base = useStore(baseStore)

  const dirty = base.ready && (jla.teachingBlocks !== base.b || jla.tasks !== base.t || wk.weeks !== base.w)
  const realChanged = base.ready && (real.teachingBlocks !== base.b || real.tasks !== base.t || realWeeks !== base.w)

  // Follow the saved data (first load, database hydration, imports) while there is nothing unsaved.
  useEffect(() => { if (!base.ready || (!dirty && realChanged)) adopt() }, [base.ready, dirty, realChanged]) // eslint-disable-line react-hooks/exhaustive-deps

  // Leaving or reloading the page with unsaved edits asks first.
  useEffect(() => {
    if (!dirty) return
    const warn = (e) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const save = () => {
    // Something else (an Excel import, the teaching timetable) saved while this draft was open.
    if (realChanged && !window.confirm('Data JLA berubah sejak Anda mulai mengedit (mis. impor Excel atau jadwal mengajar). Menyimpan akan menimpa perubahan itu. Lanjutkan?')) return false
    const j = draftJla.getState(), w = draftWk.getState()
    useJlaStore.setState({ teachingBlocks: j.teachingBlocks, tasks: j.tasks })
    useJlaWeekStore.setState({ weeks: w.weeks })
    baseStore.setState({ b: j.teachingBlocks, t: j.tasks, w: w.weeks, ready: true })
    return true
  }
  const discard = () => adopt()

  return { ready: base.ready, dirty, jla, wk, save, discard }
}
