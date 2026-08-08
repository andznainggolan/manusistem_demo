'use client'
import { useState, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRecruitmentStore, ACTIVE_STAGES, STAGES } from '@/store/recruitmentStore'
import { useT } from '@/store/languageStore'
import { PageHeader, Select, StatusBadge, EmptyState } from '@/components/ui'

const STAGE_COLOR = {
  Applied:   { bar: '#9ca3af', bg: 'bg-gray-50',    text: 'text-gray-600' },
  Screening: { bar: '#3b82f6', bg: 'bg-blue-50',    text: 'text-blue-600' },
  Interview: { bar: '#8b5cf6', bg: 'bg-violet-50',  text: 'text-violet-600' },
  Offer:     { bar: '#f59e0b', bg: 'bg-amber-50',   text: 'text-amber-600' },
  Hired:     { bar: '#10b981', bg: 'bg-emerald-50', text: 'text-emerald-600' },
  Rejected:  { bar: '#ef4444', bg: 'bg-red-50',     text: 'text-red-600' },
}

const Stars = ({ n }) => (
  <span className='text-[11px] text-amber-400'>{'★'.repeat(n)}<span className='text-gray-200'>{'★'.repeat(5 - n)}</span></span>
)

function CandidateCard({ c, onMove, onReject, t }) {
  const idx = ACTIVE_STAGES.indexOf(c.stage)
  const next = c.stage === 'Rejected' ? null : ACTIVE_STAGES[idx + 1]
  return (
    <div className='rounded-xl border border-gray-100 bg-white p-3 shadow-sm'>
      <p className='text-sm font-semibold text-gray-800'>{c.name}</p>
      <p className='mt-0.5 text-[11px] text-gray-400'>{c.source} · {c.appliedDate}</p>
      {c.rating > 0 && <div className='mt-1'><Stars n={c.rating} /></div>}
      {c.notes && <p className='mt-1.5 line-clamp-2 text-[11px] text-gray-500'>{c.notes}</p>}
      <div className='mt-2.5 flex items-center gap-2'>
        {next && (
          <button onClick={() => onMove(c, next)}
            className='flex-1 rounded-lg bg-gray-100 px-2 py-1.5 text-[11px] font-semibold text-gray-700 hover:bg-gray-200'>
            {next} →
          </button>
        )}
        {c.stage !== 'Rejected' && c.stage !== 'Hired' && (
          <button onClick={() => onReject(c)}
            className='rounded-lg px-2 py-1.5 text-[11px] font-semibold text-red-500 hover:bg-red-50'>
            {t('Tolak', 'Reject')}
          </button>
        )}
      </div>
    </div>
  )
}

function PipelineBody() {
  const t = useT()
  const params = useSearchParams()
  const { requisitions, candidates, updateCandidate } = useRecruitmentStore()

  const [reqId, setReqId] = useState(params.get('requisitionId') || 'all')

  const filtered = reqId === 'all' ? candidates : candidates.filter(c => c.requisitionId === Number(reqId))
  const byStage = (stage) => filtered.filter(c => c.stage === stage)

  const move = (c, stage) => updateCandidate(c.id, { stage })
  const reject = (c) => updateCandidate(c.id, { stage: 'Rejected' })

  const activeReqs = requisitions.filter(r => r.status !== 'Closed')

  return (
    <div>
      <PageHeader
        icon='🔀'
        title='Candidate Pipeline'
        subtitle={t('Pantau tahapan kandidat dari lamaran sampai diterima.', 'Track candidates from application through hire.')}
        actions={
          <Select value={reqId} onChange={e => setReqId(e.target.value)} className='min-w-[220px]'>
            <option value='all'>{t('Semua Lowongan', 'All Requisitions')}</option>
            {requisitions.map(r => (
              <option key={r.id} value={r.id}>{r.positionTitle}{r.status === 'Closed' ? ` (${t('Ditutup', 'Closed')})` : ''}</option>
            ))}
          </Select>
        }
      />

      {activeReqs.length === 0 && requisitions.length === 0 ? (
        <EmptyState icon='🔀' title={t('Belum ada lowongan.', 'No requisitions yet.')}
          description={t('Buat Job Requisition terlebih dahulu.', 'Create a Job Requisition first.')} />
      ) : filtered.length === 0 ? (
        <EmptyState icon='🔀' title={t('Belum ada kandidat.', 'No candidates yet.')}
          description={t('Tambah kandidat lewat Candidate Database.', 'Add candidates from Candidate Database.')} />
      ) : (
        <div className='grid grid-cols-1 gap-4 overflow-x-auto sm:grid-cols-2 lg:grid-cols-6'>
          {STAGES.map(stage => {
            const col = byStage(stage)
            const c = STAGE_COLOR[stage]
            return (
              <div key={stage} className='min-w-[220px] rounded-2xl bg-gray-50/70 p-3'>
                <div className='mb-3 flex items-center justify-between px-1'>
                  <div className='flex items-center gap-2'>
                    <span className='h-2 w-2 rounded-full' style={{ background: c.bar }} />
                    <span className='text-xs font-bold uppercase tracking-wide text-gray-600'>{stage}</span>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${c.bg} ${c.text}`}>{col.length}</span>
                </div>
                <div className='space-y-2.5'>
                  {col.map(cand => (
                    <CandidateCard key={cand.id} c={cand} onMove={move} onReject={reject} t={t} />
                  ))}
                  {col.length === 0 && <p className='py-6 text-center text-[11px] text-gray-300'>—</p>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function CandidatePipelinePage() {
  return (
    <Suspense fallback={null}>
      <PipelineBody />
    </Suspense>
  )
}
