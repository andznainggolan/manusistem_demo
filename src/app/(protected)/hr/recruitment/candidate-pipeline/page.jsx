'use client'
import { useState, useMemo, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useRecruitmentStore, ACTIVE_STAGES, STAGES, CANDIDATE_SOURCES } from '@/store/recruitmentStore'
import { useStructureStore } from '@/store/structureStore'
import { useEmployeeStore } from '@/store/employeeStore'
import { useT } from '@/store/languageStore'
import { PageHeader, Select, Input, FormField, SectionCard, ActionButton, SearchBar, StatusBadge, EmptyState } from '@/components/ui'
import CandidateDetailModal from '@/components/recruitment/CandidateDetailModal'
import { useCandidateDocumentStore } from '@/store/candidateDocumentStore'
import { useLiveSync } from '@/lib/useLiveSync'

// Caps a column's height so hundreds of candidates in one stage scroll
// within their own column instead of stretching the whole page.
const COLUMN_MAX_H = 'max-h-[calc(100vh-320px)]'

const STAGE_COLOR = {
  Applied:   { bar: '#9ca3af', bg: 'bg-gray-50',    text: 'text-gray-600' },
  Screening: { bar: '#3b82f6', bg: 'bg-blue-50',    text: 'text-blue-600' },
  Interview: { bar: '#8b5cf6', bg: 'bg-violet-50',  text: 'text-violet-600' },
  Offer:     { bar: '#f59e0b', bg: 'bg-amber-50',   text: 'text-amber-600' },
  'Pending Employee': { bar: '#10b981', bg: 'bg-emerald-50', text: 'text-emerald-600' },
  Rejected:  { bar: '#ef4444', bg: 'bg-red-50',     text: 'text-red-600' },
}

const Stars = ({ n }) => (
  <span className='text-[11px] text-amber-400'>{'★'.repeat(n)}<span className='text-gray-200'>{'★'.repeat(5 - n)}</span></span>
)

// A rejection caused by voiding a mistaken hire carries a
// "[Employment dibatalkan: <reason>]" / "[Employment cancelled: <reason>]"
// marker appended to notes (see hr/employee/[id] saveRecord cascade) — pull
// it out so the card can call it out distinctly instead of burying it in a
// line-clamped notes blob.
const CANCEL_NOTE_RE = /\s*\[(?:Employment dibatalkan|Employment cancelled): ([^\]]+)\]/

function CandidateCard({ c, onMove, onReject, onOpen, employee, headcount, companyName, t }) {
  const idx = ACTIVE_STAGES.indexOf(c.stage)
  const next = c.stage === 'Rejected' ? null : ACTIVE_STAGES[idx + 1]
  // Rejected has no recorded prior stage (any active stage can reject), so
  // "back" reopens it at Applied; from an active stage it just steps back
  // one column.
  const prev = c.stage === 'Rejected' ? 'Applied' : (idx > 0 ? ACTIVE_STAGES[idx - 1] : null)
  const cancelMatch = c.notes && c.notes.match(CANCEL_NOTE_RE)
  const notesWithoutCancel = c.notes ? c.notes.replace(CANCEL_NOTE_RE, '').trim() : ''
  return (
    <div role='button' tabIndex={0} onClick={() => onOpen(c)} onKeyDown={e => { if (e.key === 'Enter') onOpen(c) }}
      title={t('Klik untuk melihat detail dan CV', 'Click to see details and CV')}
      className='cursor-pointer rounded-xl border border-gray-100 bg-white p-3 shadow-sm transition hover:border-teal-300 hover:shadow-md' data-testid='candidate-card'>
      <p className='text-sm font-semibold text-gray-800'>{c.name}</p>
      <p className='mt-0.5 text-[11px] text-gray-400'>{c.source} · {c.appliedDate}</p>
      {c.rating > 0 && <div className='mt-1'><Stars n={c.rating} /></div>}
      {!c.rating && c.aiAssessment && (
        <p className='mt-1 text-[10px] font-semibold text-violet-500' title={t('Saran AI, belum dinilai recruiter', 'AI suggestion, not yet rated by a recruiter')}>✨ {t('Saran AI', 'AI')} {c.aiAssessment.score}/5</p>
      )}
      {notesWithoutCancel && <p className='mt-1.5 line-clamp-2 text-[11px] text-gray-500'>{notesWithoutCancel}</p>}
      {cancelMatch && (
        <div className='mt-1.5 rounded-lg bg-gray-100 px-2.5 py-1.5 text-[11px] text-gray-600'>
          <p className='font-bold text-gray-700'>⚠️ {t('Cancel Employment', 'Cancel Employment')}</p>
          <p>{t('Sempat diterima, lalu dibatalkan.', 'Was hired, then the employment was cancelled.')}</p>
          <p>{t('Alasan', 'Reason')}: {cancelMatch[1]}</p>
        </div>
      )}
      {employee && (
        <div className='mt-2 space-y-0.5 rounded-lg bg-emerald-50 px-2.5 py-2 text-[11px] text-emerald-800'>
          <p className='font-bold'>✅ {t('Sudah Jadi Karyawan', 'Converted to Employee')}</p>
          <p>{t('No. Karyawan', 'Employee No.')}: <span className='font-mono font-semibold'>{employee.nik || '—'}</span></p>
          <p>{t('Perusahaan', 'Company')}: {companyName}</p>
          {headcount && <p>{t('Headcount', 'Headcount')}: {headcount.code} — {headcount.name}</p>}
        </div>
      )}
      <div className='mt-2.5 flex items-center gap-1.5'>
        {prev && (
          <button onClick={(e) => { e.stopPropagation(); onMove(c, prev) }} title={`${t('Kembali ke', 'Back to')} ${prev}`}
            className='shrink-0 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-gray-400 hover:bg-gray-100 hover:text-gray-600'>
            ←
          </button>
        )}
        {next && (
          <button onClick={(e) => { e.stopPropagation(); onMove(c, next) }}
            className='flex-1 rounded-lg bg-gray-100 px-2 py-1.5 text-[11px] font-semibold text-gray-700 hover:bg-gray-200'>
            {next} →
          </button>
        )}
        {c.stage !== 'Rejected' && c.stage !== 'Pending Employee' && (
          <button onClick={(e) => { e.stopPropagation(); onReject(c) }}
            className='shrink-0 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-red-500 hover:bg-red-50'>
            {t('Tolak', 'Reject')}
          </button>
        )}
      </div>
    </div>
  )
}

const STAGE_DOT = { Applied: '#9ca3af', Screening: '#3b82f6', Interview: '#8b5cf6', Offer: '#f59e0b', 'Pending Employee': '#10b981', Rejected: '#ef4444' }
const EMPTY_PARAMS = { reqId: '', source: '', from: '', to: '' }

function PipelineBody() {
  const t = useT()
  const params = useSearchParams()
  const router = useRouter()
  const { requisitions, candidates, updateCandidate } = useRecruitmentStore()
  const { headcounts, companies } = useStructureStore()
  const { employees } = useEmployeeStore()
  // Applications arrive from the public career site in another browser: stay in step with the database.
  const live = useLiveSync({ store: useRecruitmentStore, name: 'hcm-recruitment-v1' }, [{ store: useCandidateDocumentStore, name: 'hcm-candidate-documents-v1' }])

  // The board only shows candidates once the parameters are applied (a link from the
  // Candidate Database carries them in the URL and goes straight to the board).
  const fromUrl = params.get('requisitionId')
  const [form, setForm] = useState({ ...EMPTY_PARAMS, reqId: fromUrl || '', source: params.get('source') || '', from: params.get('from') || '', to: params.get('to') || '' })
  const [applied, setApplied] = useState(fromUrl ? { ...form, reqId: fromUrl } : null)
  const [q, setQ] = useState('')
  const [openId, setOpenId] = useState(null) // candidate whose detail popup is open

  const apply = (next) => {
    setApplied(next); setQ('')
    const sp = new URLSearchParams()
    sp.set('requisitionId', next.reqId)
    if (next.source) sp.set('source', next.source)
    if (next.from) sp.set('from', next.from)
    if (next.to) sp.set('to', next.to)
    router.replace(`/hr/recruitment/candidate-pipeline?${sp.toString()}`, { scroll: false })
  }
  const change = () => { setApplied(null); router.replace('/hr/recruitment/candidate-pipeline', { scroll: false }) }

  const countsFor = (reqId) => {
    const list = candidates.filter(c => c.requisitionId === reqId)
    return { total: list.length, byStage: STAGES.map(st => [st, list.filter(c => c.stage === st).length]).filter(([, n]) => n > 0) }
  }

  const byReq = !applied ? [] : candidates.filter(c =>
    (applied.reqId === 'all' || c.requisitionId === Number(applied.reqId)) &&
    (!applied.source || c.source === applied.source) &&
    (!applied.from || c.appliedDate >= applied.from) &&
    (!applied.to || c.appliedDate <= applied.to))
  const needle = q.trim().toLowerCase()
  const filtered = needle ? byReq.filter(c => c.name.toLowerCase().includes(needle)) : byReq
  const byStage = (stage) => filtered.filter(c => c.stage === stage)

  const companyName = (id) => companies.find(co => co.id === id)?.companyCode || companies.find(co => co.id === id)?.name || '—'

  const move = (c, stage) => updateCandidate(c.id, { stage })
  const reject = (c) => updateCandidate(c.id, { stage: 'Rejected' })

  const sortedReqs = [...requisitions].sort((a, b) => (a.status === 'Closed') - (b.status === 'Closed') || a.positionTitle.localeCompare(b.positionTitle))
  const appliedReq = applied && applied.reqId !== 'all' ? requisitions.find(r => r.id === Number(applied.reqId)) : null
  const canShow = form.reqId !== ''

  return (
    <div>
      <PageHeader
        icon='🔀'
        title='Candidate Pipeline'
        subtitle={t('Pantau tahapan kandidat dari lamaran sampai diterima.', 'Track candidates from application through hire.')}
        actions={(
          <div className='flex items-center gap-3'>
            <span className='text-[11px] text-gray-400' data-testid='live-status'>
              {live.lastSync ? `${t('Diperbarui', 'Updated')} ${live.lastSync.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}` : ''}
            </span>
            <ActionButton variant='secondary' disabled={live.syncing} onClick={() => live.sync({ full: true })} data-testid='live-refresh'>
              {live.syncing ? t('Memuat…', 'Loading…') : `↻ ${t('Muat Ulang', 'Refresh')}`}
            </ActionButton>
            {applied && <ActionButton variant='secondary' onClick={change}>{t('Ubah Parameter', 'Change Parameters')}</ActionButton>}
          </div>
        )}
      />

      {requisitions.length === 0 ? (
        <EmptyState icon='🔀' title={t('Belum ada lowongan.', 'No requisitions yet.')}
          description={t('Buat Job Requisition terlebih dahulu.', 'Create a Job Requisition first.')} />
      ) : !applied ? (
        <div className='space-y-6' data-testid='pipeline-params'>
          <SectionCard title={t('Pilih Lowongan', 'Choose a Requisition')} icon='🎯'
            subtitle={t('Pilih lowongan dulu agar papan kandidat tidak terlalu ramai.', 'Pick a requisition first so the board stays readable.')}>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-4'>
              <FormField label={t('Lowongan', 'Requisition')} required className='md:col-span-2'>
                <Select value={form.reqId} onChange={e => setForm({ ...form, reqId: e.target.value })}>
                  <option value=''>{t('— Pilih lowongan —', '— Choose a requisition —')}</option>
                  {sortedReqs.map(r => (
                    <option key={r.id} value={r.id}>{r.positionTitle}{r.status === 'Closed' ? ` (${t('Ditutup', 'Closed')})` : ''} · {countsFor(r.id).total} {t('kandidat', 'candidates')}</option>
                  ))}
                  <option value='all'>{t('Semua lowongan (ramai)', 'All requisitions (crowded)')}</option>
                </Select>
              </FormField>
              <FormField label={t('Sumber (opsional)', 'Source (optional)')}>
                <Select value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}>
                  <option value=''>{t('Semua sumber', 'All sources')}</option>
                  {CANDIDATE_SOURCES.map(x => <option key={x} value={x}>{x}</option>)}
                </Select>
              </FormField>
              <div className='grid grid-cols-2 gap-2'>
                <FormField label={t('Lamar dari', 'Applied from')}><Input type='date' value={form.from} onChange={e => setForm({ ...form, from: e.target.value })} /></FormField>
                <FormField label={t('Sampai', 'To')}><Input type='date' value={form.to} onChange={e => setForm({ ...form, to: e.target.value })} /></FormField>
              </div>
            </div>
            <div className='mt-4'>
              <ActionButton disabled={!canShow} onClick={() => apply(form)} icon='🔀'>{t('Tampilkan Kandidat', 'Show Candidates')}</ActionButton>
            </div>
          </SectionCard>

          <div>
            <p className='mb-2 text-xs font-bold uppercase tracking-wide text-gray-400'>{t('Atau pilih langsung', 'Or pick directly')}</p>
            <div className='grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3'>
              {sortedReqs.map(r => {
                const c = countsFor(r.id)
                return (
                  <button key={r.id} type='button' data-testid='req-card' onClick={() => apply({ ...form, reqId: String(r.id) })}
                    className='rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm transition hover:border-teal-300 hover:shadow-md'>
                    <div className='flex items-start justify-between gap-2'>
                      <p className='text-sm font-bold text-gray-800'>{r.positionTitle}</p>
                      <StatusBadge tone={r.status === 'Closed' ? 'neutral' : 'success'}>{r.status}</StatusBadge>
                    </div>
                    <p className='mt-1 text-xs text-gray-400'>{c.total} {t('kandidat', 'candidates')}</p>
                    <div className='mt-2 flex flex-wrap gap-1.5'>
                      {c.byStage.length === 0 ? <span className='text-[11px] text-gray-300'>{t('Belum ada kandidat', 'No candidates yet')}</span> : c.byStage.map(([st, n]) => (
                        <span key={st} className='inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5 text-[11px] font-semibold text-gray-600'>
                          <span className='h-1.5 w-1.5 rounded-full' style={{ background: STAGE_DOT[st] }} />{st} {n}
                        </span>
                      ))}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      ) : (
      <>
        <div className='mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-gray-100' data-testid='pipeline-summary'>
          <div>
            <p className='text-sm font-bold text-gray-800'>{appliedReq ? appliedReq.positionTitle : t('Semua lowongan', 'All requisitions')}</p>
            <p className='text-[11px] text-gray-400'>
              {byReq.length} {t('kandidat', 'candidates')}
              {applied.source ? ` · ${applied.source}` : ''}
              {applied.from || applied.to ? ` · ${applied.from || '…'} – ${applied.to || '…'}` : ''}
            </p>
          </div>
          <div className='ml-auto w-full max-w-xs'>
            <SearchBar value={q} onChange={setQ} placeholder={t('Cari nama kandidat…', 'Search candidate name…')} />
          </div>
        </div>

        {byReq.length === 0 ? (
          <EmptyState icon='🔀' title={t('Belum ada kandidat.', 'No candidates yet.')}
            description={t('Tidak ada kandidat untuk parameter ini. Ubah parameter atau tambah kandidat lewat Candidate Database.', 'No candidates match these parameters. Change them or add candidates from Candidate Database.')} />
        ) : filtered.length === 0 ? (
          <EmptyState icon='🔀' title={t('Tidak ada kandidat cocok.', 'No matching candidates.')} />
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
                <div className={`space-y-2.5 overflow-y-auto pr-1 ${COLUMN_MAX_H}`}>
                  {col.map(cand => {
                    const employee = cand.employeeId ? employees.find(e => e.id === cand.employeeId) : null
                    const req = employee ? requisitions.find(r => r.id === cand.requisitionId) : null
                    const headcount = req?.headcountId ? headcounts.find(h => h.id === req.headcountId) : null
                    return (
                      <CandidateCard key={cand.id} c={cand} onMove={move} onReject={reject} onOpen={x => setOpenId(x.id)} t={t}
                        employee={employee} headcount={headcount}
                        companyName={employee ? companyName(employee.companyId) : null} />
                    )
                  })}
                  {col.length === 0 && <p className='py-6 text-center text-[11px] text-gray-300'>—</p>}
                </div>
              </div>
            )
          })}
        </div>
        )}
      </>
      )}

      {openId != null && (
        <CandidateDetailModal candidateId={openId} onClose={() => setOpenId(null)} onMove={move} onReject={reject} />
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
