'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRecruitmentStore, ACTIVE_STAGES } from '@/store/recruitmentStore'
import { useCandidateDocumentStore } from '@/store/candidateDocumentStore'
import { usePsychotestAttemptStore } from '@/store/psychotestAttemptStore'
import { useT } from '@/store/languageStore'
import { StatusBadge } from '@/components/ui'

const STAGE_TONE = {
  Applied: 'neutral', Screening: 'info', Interview: 'purple', Offer: 'warning', 'Pending Employee': 'success', Rejected: 'danger',
}
const RESULT_TONE = { Scheduled: 'info', Passed: 'success', Failed: 'danger', Cancelled: 'neutral' }
const isCv = (d) => /cv|resume|curriculum|riwayat/i.test(d.category || '')
const formatBytes = (n) => n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / (1024 * 1024)).toFixed(1)} MB`
const Stars = ({ n }) => <span className='text-amber-400'>{'★'.repeat(n)}<span className='text-gray-200'>{'★'.repeat(5 - n)}</span></span>

/** data: URL -> blob: URL (a blob URL previews and opens reliably, a large data URL does not). */
function useBlobUrl(doc) {
  const [url, setUrl] = useState(null)
  useEffect(() => {
    if (!doc?.dataUrl) { setUrl(null); return undefined }
    let revoked = false, made = null
    fetch(doc.dataUrl).then(r => r.blob()).then(b => {
      if (revoked) return
      made = URL.createObjectURL(b); setUrl(made)
    }).catch(() => setUrl(null))
    return () => { revoked = true; if (made) URL.revokeObjectURL(made) }
  }, [doc?.id, doc?.dataUrl])
  return url
}

/**
 * Popup with everything about one candidate: application data, interviews, psychotests and
 * documents, with the CV (or any other document) previewed inside the popup.
 * `onMove(candidate, stage)` / `onReject(candidate)` are optional stage actions.
 */
export default function CandidateDetailModal({ candidateId, onClose, onMove, onReject }) {
  const t = useT()
  const { candidates, requisitions, interviews } = useRecruitmentStore()
  const { documents } = useCandidateDocumentStore()
  const { attempts } = usePsychotestAttemptStore()

  const c = candidates.find(x => x.id === candidateId)
  const docs = useMemo(() => documents.filter(d => d.candidateId === candidateId)
    .sort((a, b) => (isCv(b) - isCv(a)) || String(b.uploadedAt).localeCompare(String(a.uploadedAt))), [documents, candidateId])
  const [docId, setDocId] = useState(null)
  const doc = docs.find(d => d.id === docId) || docs[0] || null
  const blobUrl = useBlobUrl(doc)

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!c) return null
  const req = requisitions.find(r => r.id === c.requisitionId)
  const ivs = interviews.filter(i => i.candidateId === c.id).sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
  const tests = attempts.filter(a => a.candidateId === c.id)
  const idx = ACTIVE_STAGES.indexOf(c.stage)
  const next = c.stage === 'Rejected' ? null : ACTIVE_STAGES[idx + 1]
  const prev = c.stage === 'Rejected' ? 'Applied' : (idx > 0 ? ACTIVE_STAGES[idx - 1] : null)
  const previewable = doc && (/^application\/pdf/.test(doc.fileType) || /^image\//.test(doc.fileType))

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4' onClick={onClose} data-testid='candidate-modal'>
      <div className='flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl' onClick={e => e.stopPropagation()}>
        <div className='flex items-start justify-between border-b border-gray-100 px-6 py-4'>
          <div>
            <div className='flex items-center gap-3'>
              <h3 className='text-lg font-bold text-gray-800'>{c.name}</h3>
              <StatusBadge tone={STAGE_TONE[c.stage]}>{c.stage}</StatusBadge>
            </div>
            <p className='text-xs text-gray-400'>{c.email || '-'} · {c.phone || '-'}</p>
          </div>
          <button onClick={onClose} aria-label={t('Tutup', 'Close')} className='text-2xl font-bold leading-none text-gray-400 hover:text-gray-600'>×</button>
        </div>

        <div className='grid flex-1 grid-cols-1 gap-0 overflow-hidden md:grid-cols-[320px_1fr]'>
          <div className='space-y-4 overflow-y-auto border-b border-gray-100 p-5 text-sm md:border-b-0 md:border-r'>
            <div className='space-y-1.5'>
              <p><span className='text-gray-400'>{t('Melamar untuk', 'Applied for')}:</span> <span className='font-semibold text-gray-700'>{req?.positionTitle || '-'}</span></p>
              <p><span className='text-gray-400'>{t('Sumber', 'Source')}:</span> {c.source}</p>
              <p><span className='text-gray-400'>{t('Tanggal lamar', 'Applied date')}:</span> {c.appliedDate}</p>
              {c.rating > 0 && <p><span className='text-gray-400'>Rating:</span> <Stars n={c.rating} /></p>}
              {c.notes && <p className='rounded-xl bg-gray-50 p-3 text-xs text-gray-600'>{c.notes}</p>}
            </div>

            <div>
              <p className='mb-1.5 text-xs font-bold uppercase tracking-wide text-gray-400'>{t('Interview', 'Interview')}</p>
              {ivs.length === 0 ? <p className='text-xs text-gray-400'>{t('Belum ada jadwal interview.', 'No interview scheduled.')}</p> : (
                <div className='space-y-1.5'>
                  {ivs.map(i => (
                    <div key={i.id} className='rounded-lg bg-gray-50 px-3 py-2 text-xs'>
                      <div className='flex items-center justify-between'>
                        <span className='font-semibold text-gray-700'>{i.date} · {i.time} · {i.type}</span>
                        <StatusBadge tone={RESULT_TONE[i.result] || 'neutral'}>{i.result}</StatusBadge>
                      </div>
                      <p className='text-gray-500'>{i.interviewerNames}{i.location && i.location !== '-' ? ` · ${i.location}` : ''}</p>
                      {i.notes && <p className='text-gray-400'>{i.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className='mb-1.5 text-xs font-bold uppercase tracking-wide text-gray-400'>{t('Psikotes', 'Psychotest')}</p>
              {tests.length === 0 ? <p className='text-xs text-gray-400'>{t('Belum ada psikotes.', 'No psychotest.')}</p> : (
                <div className='space-y-1.5'>
                  {tests.map(a => (
                    <div key={a.id} className='flex items-center justify-between rounded-lg bg-gray-50 px-3 py-1.5 text-xs'>
                      <span className='font-medium text-gray-700'>{a.testName}</span>
                      <span className='text-gray-400'>{a.status === 'Completed' ? `${a.score}/${a.maxScore}` : a.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className='mb-1.5 text-xs font-bold uppercase tracking-wide text-gray-400'>{t('Dokumen', 'Documents')} ({docs.length})</p>
              {docs.length === 0 ? <p className='text-xs text-gray-400'>{t('Belum ada dokumen diunggah.', 'No documents uploaded.')}</p> : (
                <div className='space-y-1.5'>
                  {docs.map(d => (
                    <button key={d.id} type='button' onClick={() => setDocId(d.id)} data-testid='candidate-doc'
                      className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-1.5 text-left text-xs ring-1 transition ${doc?.id === d.id ? 'bg-teal-50 ring-teal-300' : 'bg-gray-50 ring-transparent hover:bg-gray-100'}`}>
                      <span className='font-semibold text-gray-700'>{isCv(d) ? '📄 ' : ''}{d.category}</span>
                      <span className='truncate text-gray-400'>{formatBytes(d.fileSize || 0)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className='flex min-h-[320px] flex-col bg-gray-50' data-testid='candidate-preview'>
            <div className='flex items-center justify-between gap-2 border-b border-gray-100 bg-white px-4 py-2.5'>
              <div className='min-w-0 text-xs'>
                <span className='font-bold text-gray-700'>{doc ? (isCv(doc) ? 'CV' : doc.category) : t('Pratinjau', 'Preview')}</span>
                {doc && <span className='ml-2 truncate text-gray-400'>{doc.fileName}</span>}
              </div>
              {doc && blobUrl && (
                <div className='flex gap-3 text-xs font-semibold'>
                  <a href={blobUrl} target='_blank' rel='noreferrer' className='text-teal-700 hover:underline'>{t('Buka di tab baru', 'Open in new tab')}</a>
                  <a href={blobUrl} download={doc.fileName} className='text-teal-700 hover:underline'>{t('Unduh', 'Download')}</a>
                </div>
              )}
            </div>
            <div className='flex-1'>
              {!doc ? (
                <div className='flex h-full items-center justify-center p-8 text-center text-sm text-gray-400'>
                  {t('Belum ada CV atau dokumen yang diunggah untuk kandidat ini.', 'No CV or document has been uploaded for this candidate.')}
                </div>
              ) : !blobUrl ? (
                <div className='flex h-full items-center justify-center text-sm text-gray-400'>{t('Memuat dokumen…', 'Loading document…')}</div>
              ) : /^application\/pdf/.test(doc.fileType) ? (
                <iframe title={doc.fileName} src={blobUrl} className='h-[62vh] w-full' />
              ) : /^image\//.test(doc.fileType) ? (
                <div className='flex h-[62vh] items-center justify-center overflow-auto p-3'>
                  <img src={blobUrl} alt={doc.fileName} className='max-h-full max-w-full object-contain' />
                </div>
              ) : (
                <div className='flex h-full flex-col items-center justify-center gap-2 p-8 text-center text-sm text-gray-500'>
                  <p>{t('Pratinjau tidak tersedia untuk jenis berkas ini.', 'No preview for this file type.')}</p>
                  <a href={blobUrl} download={doc.fileName} className='font-semibold text-teal-700 hover:underline'>{t('Unduh berkas', 'Download file')}</a>
                </div>
              )}
            </div>
          </div>
        </div>

        {(prev || next || (c.stage !== 'Rejected' && c.stage !== 'Pending Employee')) && (onMove || onReject) && (
          <div className='flex items-center justify-end gap-2 border-t border-gray-100 px-6 py-3'>
            {onMove && prev && <button onClick={() => onMove(c, prev)} className='rounded-xl px-3 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100'>← {prev}</button>}
            {onMove && next && <button onClick={() => onMove(c, next)} className='rounded-xl bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200'>{next} →</button>}
            {onReject && c.stage !== 'Rejected' && c.stage !== 'Pending Employee' && (
              <button onClick={() => onReject(c)} className='rounded-xl bg-red-50 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-100'>{t('Tolak', 'Reject')}</button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
