'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRecruitmentStore, isPublished } from '@/store/recruitmentStore'
import { useStructureStore } from '@/store/structureStore'
import { useBrandingStore } from '@/store/brandingStore'

// Public, unauthenticated job board — lives outside (protected), so it gets
// none of the app shell (sidebar/topbar/auth redirect). A requisition shows
// up here only when isPublished() says so: status 'Posted External' and
// inside its publish date window.

const EMPTY_FORM = { name: '', email: '', phone: '', notes: '' }

function ApplyModal({ req, deptName, companyName, onClose }) {
  const { addCandidate } = useRecruitmentStore()
  const [form, setForm] = useState(EMPTY_FORM)
  const [sent, setSent] = useState(false)
  const setField = (patch) => setForm(f => ({ ...f, ...patch }))

  const valid = form.name.trim() && /\S+@\S+\.\S+/.test(form.email)

  const submit = () => {
    if (!valid) return
    addCandidate({
      name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(),
      requisitionId: req.id, source: 'Career Site',
      appliedDate: new Date().toISOString().slice(0, 10),
      notes: form.notes.trim(),
    })
    setSent(true)
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4' onClick={onClose}>
      <div className='w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl' onClick={e => e.stopPropagation()}>
        {sent ? (
          <div className='py-6 text-center'>
            <p className='text-4xl'>✅</p>
            <h3 className='mt-3 text-lg font-bold text-gray-800'>Lamaran Terkirim!</h3>
            <p className='mt-1 text-sm text-gray-500'>
              Terima kasih sudah melamar untuk posisi <b>{req.positionTitle}</b>. Tim kami akan menghubungi Anda jika profil Anda sesuai.
            </p>
            <button onClick={onClose}
              className='mt-5 rounded-xl px-5 py-2.5 text-sm font-semibold text-white'
              style={{ background: 'linear-gradient(135deg,#8B1A1A,#D7252B)' }}>
              Tutup
            </button>
          </div>
        ) : (
          <>
            <div className='mb-4 flex items-start justify-between'>
              <div>
                <h3 className='text-base font-bold text-gray-800'>Lamar Posisi</h3>
                <p className='text-sm text-gray-500'>{req.positionTitle} · {deptName} · {companyName}</p>
              </div>
              <button onClick={onClose} className='text-xl font-bold leading-none text-gray-400 hover:text-gray-600'>×</button>
            </div>
            <div className='space-y-3'>
              <div>
                <label className='mb-1 block text-xs font-semibold text-gray-600'>Nama Lengkap *</label>
                <input value={form.name} onChange={e => setField({ name: e.target.value })} autoFocus
                  className='w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100' />
              </div>
              <div>
                <label className='mb-1 block text-xs font-semibold text-gray-600'>Email *</label>
                <input type='email' value={form.email} onChange={e => setField({ email: e.target.value })}
                  className='w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100' />
              </div>
              <div>
                <label className='mb-1 block text-xs font-semibold text-gray-600'>Nomor Telepon</label>
                <input value={form.phone} onChange={e => setField({ phone: e.target.value })}
                  className='w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100' />
              </div>
              <div>
                <label className='mb-1 block text-xs font-semibold text-gray-600'>Pesan Singkat (opsional)</label>
                <textarea rows={3} value={form.notes} onChange={e => setField({ notes: e.target.value })}
                  className='w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100' />
              </div>
            </div>
            <button onClick={submit} disabled={!valid}
              className='mt-5 w-full rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition disabled:opacity-40'
              style={{ background: 'linear-gradient(135deg,#8B1A1A,#D7252B)' }}>
              Kirim Lamaran
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function JobCard({ req, deptName, companyName, highlighted, onApply }) {
  return (
    <div id={`job-${req.id}`}
      className={`rounded-2xl bg-white p-5 shadow-sm ring-1 transition ${highlighted ? 'ring-2 ring-red-300' : 'ring-gray-100'}`}>
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div>
          <h3 className='text-base font-bold text-gray-800'>{req.positionTitle}</h3>
          <p className='mt-1 text-sm text-gray-500'>{deptName} · {companyName}</p>
          <div className='mt-2 flex flex-wrap gap-2'>
            <span className='rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600'>{req.employmentType}</span>
            <span className='rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600'>{deptName}</span>
          </div>
          {req.notes && <p className='mt-3 max-w-xl text-sm text-gray-500'>{req.notes}</p>}
        </div>
        <button onClick={() => onApply(req)}
          className='shrink-0 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-md'
          style={{ background: 'linear-gradient(135deg,#8B1A1A,#D7252B)' }}>
          Lamar Sekarang
        </button>
      </div>
    </div>
  )
}

function CareersBody() {
  const params = useSearchParams()
  const highlightId = params.get('req') ? Number(params.get('req')) : null

  const { requisitions } = useRecruitmentStore()
  const { departments, companies } = useStructureStore()
  const { loginLogo } = useBrandingStore()

  const [mounted, setMounted] = useState(false)
  const [applyReq, setApplyReq] = useState(null)
  useEffect(() => {
    setMounted(true)
    if (highlightId) {
      // Give the list a tick to render before scrolling to the deep-linked job.
      setTimeout(() => document.getElementById(`job-${highlightId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 200)
    }
  }, [highlightId])

  const live = requisitions.filter(r => isPublished(r))
  const deptName = (id) => departments.find(d => d.id === id)?.name || '—'
  const companyName = (id) => companies.find(c => c.id === id)?.name || '—'

  return (
    <div className='min-h-screen bg-gray-50'>
      <header className='border-b border-gray-100 bg-white'>
        <div className='mx-auto flex max-w-3xl items-center gap-3 px-6 py-5'>
          <img src={mounted && loginLogo ? loginLogo : '/logos/manusistem.png'} alt='' className='h-9 w-9 rounded-lg object-contain' />
          <div>
            <p className='text-lg font-bold text-gray-800'>Karir di Manusistem</p>
            <p className='text-xs text-gray-400'>Temukan peluang karir yang sesuai untukmu.</p>
          </div>
        </div>
      </header>

      <main className='mx-auto max-w-3xl px-6 py-8'>
        <p className='mb-5 text-sm text-gray-500'>
          {live.length} {live.length === 1 ? 'lowongan tersedia' : 'lowongan tersedia'} saat ini.
        </p>

        {live.length === 0 ? (
          <div className='rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-gray-100'>
            <p className='text-4xl'>🗂️</p>
            <p className='mt-3 font-semibold text-gray-700'>Belum ada lowongan terbuka saat ini.</p>
            <p className='mt-1 text-sm text-gray-400'>Silakan kembali lagi di lain waktu.</p>
          </div>
        ) : (
          <div className='space-y-4'>
            {live.map(req => (
              <JobCard key={req.id} req={req} deptName={deptName(req.departmentId)} companyName={companyName(req.companyId)}
                highlighted={req.id === highlightId} onApply={setApplyReq} />
            ))}
          </div>
        )}
      </main>

      <footer className='py-8 text-center text-xs text-gray-400'>© {new Date().getFullYear()} Manusistem</footer>

      {applyReq && (
        <ApplyModal req={applyReq} deptName={deptName(applyReq.departmentId)} companyName={companyName(applyReq.companyId)}
          onClose={() => setApplyReq(null)} />
      )}
    </div>
  )
}

export default function CareersPage() {
  return (
    <Suspense fallback={null}>
      <CareersBody />
    </Suspense>
  )
}
