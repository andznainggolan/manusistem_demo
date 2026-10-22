'use client'
import { useAuthStore } from '@/store/authStore'
import { useJlaStore } from '@/store/jlaStore'
import { fmtHours, weekSummary } from '@/lib/jla'
import WeekGrid from '@/components/jla/WeekGrid'
import { PageHeader, StatCard, SectionCard, EmptyState } from '@/components/ui'

export default function MyJobLoadPage() {
  const { currentUser } = useAuthStore()
  const { settings, taskTypes, categories, teachingBlocks, tasks } = useJlaStore()
  const isGuru = categories[currentUser?.id] === 'Guru'
  const sum = weekSummary(currentUser?.id, teachingBlocks, tasks, settings.targetHours)
  const mine = (list) => list.filter(x => x.employeeId === currentUser?.id)

  return (
    <div>
      <PageHeader
        icon='🗓️'
        title='Jadwal dan Beban Kerja'
        subtitle='Jam mengajar tetap dan task tambahan dari kepala sekolah dalam satu minggu.'
      />
      {!isGuru ? (
        <SectionCard title='Beban kerja' icon='🗓️'>
          <EmptyState icon='🗓️' title='Halaman ini untuk pekerja kategori Guru.' description='Jam kerja karyawan non-guru mengikuti jadwal kerja di Clock In/Out.' />
        </SectionCard>
      ) : (
        <>
          <div className='mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4'>
            <StatCard tone='brand' icon='📚' label='Jam mengajar' value={`${fmtHours(sum.teaching)} jam`} />
            <StatCard tone='blue' icon='📋' label='Task tambahan' value={`${fmtHours(sum.task)} jam`} />
            <StatCard tone={sum.achieved ? 'green' : 'orange'} icon='⏱️' label={`Total / target ${settings.targetHours}`} value={`${fmtHours(sum.total)} jam`} />
            <StatCard tone={sum.achieved ? 'green' : 'purple'} icon={sum.achieved ? '✅' : '🕒'} label={sum.achieved ? 'Status' : 'Masih kurang'} value={sum.achieved ? 'Tercapai' : `${fmtHours(sum.gap)} jam`} />
          </div>
          <SectionCard title='Jadwal Minggu Ini' icon='🗓️'>
            <WeekGrid
              blocks={mine(teachingBlocks)} tasks={mine(tasks)} taskTypes={taskTypes}
              windowStart={settings.windowStart} windowEnd={settings.windowEnd} editable={false}
            />
          </SectionCard>
        </>
      )}
    </div>
  )
}
