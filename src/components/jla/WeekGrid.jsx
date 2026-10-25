'use client'
import { DAYS, toMin, toHHMM, fmtHours, durationHours } from '@/lib/jla'

const PX_PER_HOUR = 44

// Weekly timetable: teaching blocks (blue), tasks (teal), free time is empty
// and clickable when `editable`. Clicking a free spot calls onFreeClick(day, 'HH:MM').
// `dates` (5 'YYYY-MM-DD', Monday first) turns the weekday headers into a dated calendar week;
// `today` highlights that column.
export default function WeekGrid({ blocks, tasks, taskTypes, windowStart, windowEnd, editable, onFreeClick, onTaskClick, onBlockClick, dates = null, today = null }) {
  const ws = toMin(windowStart), we = toMin(windowEnd)
  const hours = []
  for (let m = ws; m < we; m += 60) hours.push(m)
  const height = ((we - ws) / 60) * PX_PER_HOUR
  const typeName = (id) => taskTypes.find(t => t.id === id)?.name || 'Task'
  const topOf = (hhmm) => ((Math.max(ws, toMin(hhmm)) - ws) / 60) * PX_PER_HOUR
  const heightOf = (s, e) => ((Math.min(we, toMin(e)) - Math.max(ws, toMin(s))) / 60) * PX_PER_HOUR

  const handleFree = (e, day) => {
    if (!editable || !onFreeClick) return
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    const minutes = ws + Math.floor((y / PX_PER_HOUR) * 2) * 30
    onFreeClick(day, toHHMM(Math.min(minutes, we - 30)))
  }

  return (
    <div className='overflow-x-auto'>
      <div className='min-w-[640px]'>
        <div className='grid' style={{ gridTemplateColumns: '48px repeat(5, minmax(0, 1fr))' }}>
          <div />
          {DAYS.map((d, i) => {
            const date = dates?.[i]
            const hours = [...blocks, ...tasks].filter(x => x.day === d.key).reduce((sum, x) => sum + durationHours(x.start, x.end), 0)
            const isToday = date && date === today
            return (
              <div key={d.key} className='pb-2 text-center'>
                <div className={`text-xs font-bold uppercase tracking-wide ${isToday ? 'text-teal-700' : 'text-gray-500'}`}>{d.label}</div>
                {date && (
                  <div className={`mx-auto mt-0.5 w-fit rounded-full px-2 text-[11px] font-semibold ${isToday ? 'bg-teal-600 text-white' : 'text-gray-500'}`}>
                    {new Date(`${date}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  </div>
                )}
                <div className='mt-0.5 text-[10px] font-medium text-gray-400'>{hours > 0 ? `${fmtHours(hours)} jam` : '-'}</div>
              </div>
            )
          })}
        </div>
        <div className='grid' style={{ gridTemplateColumns: '48px repeat(5, minmax(0, 1fr))' }}>
          <div className='relative' style={{ height }}>
            {hours.map(m => (
              <div key={m} className='absolute right-2 -translate-y-2 text-[10px] font-medium text-gray-400' style={{ top: ((m - ws) / 60) * PX_PER_HOUR }}>
                {toHHMM(m)}
              </div>
            ))}
          </div>
          {DAYS.map(d => (
            <div
              key={d.key}
              className={`relative border-l border-gray-100 ${dates && dates[DAYS.findIndex(x => x.key === d.key)] === today ? 'bg-teal-50/30' : ''} ${editable ? 'cursor-copy hover:bg-teal-50/40' : ''}`}
              style={{ height }}
              onClick={(e) => handleFree(e, d.key)}
              title={editable ? 'Klik area kosong untuk menambah task' : undefined}
            >
              {hours.map(m => (
                <div key={m} className='absolute inset-x-0 border-t border-gray-100' style={{ top: ((m - ws) / 60) * PX_PER_HOUR }} />
              ))}
              {blocks.filter(b => b.day === d.key).map(b => (
                <div
                  key={`b${b.id}`}
                  className={`absolute inset-x-0.5 overflow-hidden rounded-md bg-sky-100 px-1.5 py-0.5 text-[11px] leading-tight text-sky-900 ring-1 ring-sky-200 ${editable && onBlockClick ? 'cursor-pointer hover:bg-sky-200' : ''}`}
                  style={{ top: topOf(b.start), height: heightOf(b.start, b.end) - 2 }}
                  title={editable && onBlockClick ? 'Klik untuk menghapus blok ini' : undefined}
                  onClick={(e) => { e.stopPropagation(); if (editable && onBlockClick) onBlockClick(b) }}
                >
                  <div className='font-semibold'>{b.start}-{b.end}</div>
                  <div className='truncate'>{b.label}</div>
                </div>
              ))}
              {tasks.filter(t => t.day === d.key).map(t => (
                <div
                  key={`t${t.id}`}
                  className={`absolute inset-x-0.5 overflow-hidden rounded-md px-1.5 py-0.5 text-[11px] leading-tight text-white ring-1 ${t.teaching ? 'bg-indigo-600 ring-indigo-700' : 'bg-teal-600 ring-teal-700'} ${editable ? (t.teaching ? 'cursor-pointer hover:bg-indigo-700' : 'cursor-pointer hover:bg-teal-700') : ''}`}
                  style={{ top: topOf(t.start), height: heightOf(t.start, t.end) - 2 }}
                  onClick={(e) => { e.stopPropagation(); onTaskClick && onTaskClick(t) }}
                  title={`${t.teaching && t.subject ? `Mengajar ${t.subject}` : typeName(t.taskTypeId)} (${fmtHours(durationHours(t.start, t.end))} jam)`}
                >
                  <div className='font-semibold'>{t.start}-{t.end}</div>
                  <div className='truncate'>{t.teaching && t.subject ? t.subject : typeName(t.taskTypeId)}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className='mt-3 flex flex-wrap items-center gap-4 text-[11px] text-gray-500'>
          <span className='flex items-center gap-1.5'><span className='h-3 w-3 rounded bg-sky-100 ring-1 ring-sky-200' /> Jam mengajar (tetap)</span>
          <span className='flex items-center gap-1.5'><span className='h-3 w-3 rounded bg-teal-600' /> Task tambahan</span>
          {tasks.some(t => t.teaching) && <span className='flex items-center gap-1.5'><span className='h-3 w-3 rounded bg-indigo-600' /> Mengajar mata pelajaran lain</span>}
          <span className='flex items-center gap-1.5'><span className='h-3 w-3 rounded border border-gray-200 bg-white' /> Waktu kosong{editable ? ' (klik untuk isi)' : ''}</span>
        </div>
      </div>
    </div>
  )
}
