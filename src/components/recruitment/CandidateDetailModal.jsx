'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRecruitmentStore, ACTIVE_STAGES } from '@/store/recruitmentStore'
import { useCandidateDocumentStore } from '@/store/candidateDocumentStore'
import { usePsychotestAttemptStore } from '@/store/psychotestAttemptStore'
import { useAuthStore } from '@/store/authStore'
import { useGenAiSettingsStore } from '@/store/genAiSettingsStore'
import { requestCandidateScore } from '@/lib/candidateAi'
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
  const { candidates, requisitions, interviews, updateCandidate } = useRecruitmentStore()
  const { currentUser } = useAuthStore()
  const { mode: aiMode, creditsUsed, creditsLimit } = useGenAiSettingsStore()
  const spendCredit = useGenAiSettingsStore(s => s.useCredit)   // a store action, not a React hook
  const { documents } = useCandidateDocumentStore()
  const { attempts } = usePsychotestAttemptStore()

  const c = candidates.find(x => x.id === candidateId)
  const docs = useMemo(() => documents.filter(d => d.candidateId === candidateId)
    .sort((a, b) => (isCv(b) - isCv(a)) || String(b.uploadedAt).localeCompare(String(a.uploadedAt))), [documents, candidateId])
  const [docId, setDocId] = useState(null)

  // Rating by the recruiter (a person, saved explicitly) and the AI suggestion (advice only).
  const [draftRating, setDraftRating] = useState(c?.rating || 0)
  const [draftNote, setDraftNote] = useState(c?.ratingNote || '')
  const [aiBusy, setAiBusy] = useState(false)
  const [aiError, setAiError] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const doc = docs.find(d => d.id === docId) || docs[0] || null
  const blobUrl = useBlobUrl(doc)

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!c) return null
  const req = requisitions.find(r => r.id === c.requisitionId)
  const ratingDirty = draftRating !== (c.rating || 0) || draftNote.trim() !== (c.ratingNote || '')
  const saveRating = () => {
    const entry = { rating: draftRating, note: draftNote.trim(), by: currentUser?.id ?? null, byName: currentUser?.name || '', at: new Date().toISOString() }
    updateCandidate(c.id, {
      rating: draftRating, ratingNote: entry.note, ratedBy: entry.by, ratedByName: entry.byName, ratedAt: entry.at,
      ratingHistory: [...(c.ratingHistory || []), entry].slice(-20),
    })
  }
  const aiOutOfCredit = aiMode === 'embedded' && creditsUsed >= creditsLimit
  const askAi = async () => {
    setAiBusy(true); setAiError('')
    try {
      const cv = docs.find(isCv) || null
      const r = await requestCandidateScore({ candidate: c, requisition: req, cv })
      updateCandidate(c.id, { aiAssessment: { ...r, at: new Date().toISOString(), byName: currentUser?.name || '', docName: r.cvRead && cv ? cv.fileName : '' } })
      if (aiMode === 'embedded') spendCredit(1)
    } catch (e) { setAiError(e.message) } finally { setAiBusy(false) }
  }
  const ai = c.aiAssessment
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
              {c.notes && <p className='rounded-xl bg-gray-50 p-3 text-xs text-gray-600'>{c.notes}</p>}
            </div>

            <div data-testid='rating-section'>
              <p className='mb-1.5 text-xs font-bold uppercase tracking-wide text-gray-400'>{t('Penilaian Recruiter', 'Recruiter Rating')}</p>
              <div className='flex items-center gap-0.5'>
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} type='button' aria-label={`${n} ${t('bintang', 'stars')}`} data-testid='rate-star'
                    onClick={() => setDraftRating(draftRating === n ? 0 : n)}
                    className={`text-2xl leading-none transition ${n <= draftRating ? 'text-amber-400' : 'text-gray-200 hover:text-amber-200'}`}>★</button>
                ))}
                <span className='ml-2 text-xs text-gray-400'>{draftRating ? `${draftRating}/5` : t('Belum dinilai', 'Not rated')}</span>
              </div>
              <textarea rows={2} value={draftNote} onChange={e => setDraftNote(e.target.value)} data-testid='rate-note'
                placeholder={t('Catatan penilaian (opsional)', 'Rating note (optional)')}
                className='mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-xs outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-100' />
              <div className='mt-1.5 flex items-center justify-between gap-2'>
                <span className='text-[11px] text-gray-400'>
                  {c.ratedByName ? `${t('Dinilai oleh', 'Rated by')} ${c.ratedByName}, ${String(c.ratedAt).slice(0, 10)}`
                    : c.rating > 0 ? t('Rating awal dari data contoh; belum ada penilai tercatat.', 'Initial rating from sample data; no rater recorded.') : ''}
                </span>
                <button type='button' disabled={!ratingDirty} onClick={saveRating} data-testid='rate-save'
                  className='shrink-0 rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-40'>
                  {t('Simpan Penilaian', 'Save Rating')}
                </button>
              </div>
              {(c.ratingHistory || []).length > 0 && (
                <div className='mt-1'>
                  <button type='button' onClick={() => setShowHistory(v => !v)} className='text-[11px] font-semibold text-teal-700 hover:underline'>
                    {showHistory ? t('Sembunyikan riwayat', 'Hide history') : `${t('Riwayat penilaian', 'Rating history')} (${c.ratingHistory.length})`}
                  </button>
                  {showHistory && (
                    <div className='mt-1 space-y-1'>
                      {[...c.ratingHistory].reverse().map((h, i) => (
                        <div key={i} className='rounded-lg bg-gray-50 px-2.5 py-1.5 text-[11px] text-gray-600'>
                          <b>{h.rating ? `${h.rating}/5` : t('Rating dihapus', 'Rating cleared')}</b> · {h.byName || '-'} · {String(h.at).slice(0, 10)}{h.note ? ` · ${h.note}` : ''}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div data-testid='ai-section'>
              <p className='mb-1.5 text-xs font-bold uppercase tracking-wide text-gray-400'>✨ {t('Saran AI', 'AI Suggestion')}</p>
              {aiMode === 'off' ? (
                <p className='text-xs text-gray-400'>{t('Gen AI nonaktif. Administrator dapat mengaktifkannya di System Admin > Settings > Gen AI.', 'Gen AI is off. An administrator can enable it under System Admin > Settings > Gen AI.')}</p>
              ) : (
                <>
                  <button type='button' onClick={askAi} disabled={aiBusy || aiOutOfCredit} data-testid='ai-ask'
                    className='rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-50'>
                    {aiBusy ? t('AI sedang membaca CV…', 'AI is reading the CV…') : ai ? t('Minta Saran Ulang', 'Ask Again') : t('Minta Saran AI', 'Ask AI')}
                  </button>
                  <span className='ml-2 text-[11px] text-gray-400'>
                    {docs.some(isCv) ? t('Membaca CV dan membandingkannya dengan persyaratan lowongan.', 'Reads the CV and compares it with the requisition.') : t('Belum ada CV; penilaian hanya dari catatan.', 'No CV yet; assessed from notes only.')}
                    {aiMode === 'embedded' ? ` · ${t('kredit', 'credits')} ${creditsUsed}/${creditsLimit}` : ''}
                  </span>
                  {aiOutOfCredit && <p className='mt-1 text-xs text-red-600'>{t('Kredit AI habis.', 'AI credits used up.')}</p>}
                  {aiError && <p className='mt-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs text-red-600' data-testid='ai-error'>{aiError}</p>}
                </>
              )}
              {ai && (
                <div className='mt-2 space-y-2 rounded-xl border border-violet-100 bg-violet-50/40 p-3 text-xs' data-testid='ai-result'>
                  <div className='flex items-center justify-between'>
                    <span className='text-base'><Stars n={ai.score} /> <span className='text-xs font-bold text-violet-700'>{ai.score}/5</span></span>
                    <span className='text-[10px] font-semibold uppercase text-violet-500'>{t('Keyakinan', 'Confidence')}: {ai.confidence}</span>
                  </div>
                  <p className='text-gray-700'>{ai.summary}</p>
                  {ai.strengths?.length > 0 && <div><p className='font-bold text-emerald-700'>{t('Kekuatan', 'Strengths')}</p><ul className='list-disc pl-4 text-gray-600'>{ai.strengths.map((x, i) => <li key={i}>{x}</li>)}</ul></div>}
                  {ai.concerns?.length > 0 && <div><p className='font-bold text-amber-700'>{t('Perlu diperhatikan', 'Concerns')}</p><ul className='list-disc pl-4 text-gray-600'>{ai.concerns.map((x, i) => <li key={i}>{x}</li>)}</ul></div>}
                  {ai.requirementsMissing?.length > 0 && <div><p className='font-bold text-red-700'>{t('Persyaratan belum terlihat', 'Requirements not evident')}</p><ul className='list-disc pl-4 text-gray-600'>{ai.requirementsMissing.map((x, i) => <li key={i}>{x}</li>)}</ul></div>}
                  <p className='text-[10px] text-gray-400'>
                    {ai.provider} · {ai.model} · {String(ai.at).slice(0, 10)}{ai.byName ? ` · ${ai.byName}` : ''}
                    {ai.docName ? ` · ${t('membaca', 'read')} ${ai.docName}` : ` · ${t('CV tidak dibaca', 'CV not read')}${ai.cvNote ? ` (${ai.cvNote})` : ''}`}
                  </p>
                  <div className='flex items-center justify-between gap-2'>
                    <button type='button' onClick={() => setDraftRating(ai.score)} data-testid='ai-use'
                      className='rounded-lg border border-violet-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-violet-700 hover:bg-violet-50'>
                      {t('Pakai sebagai rating', 'Use as rating')}
                    </button>
                    <span className='text-[10px] italic text-gray-400'>{t('Saran saja, bukan keputusan. Periksa CV sebelum menolak.', 'Advice only, not a decision. Check the CV before rejecting.')}</span>
                  </div>
                </div>
              )}
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
