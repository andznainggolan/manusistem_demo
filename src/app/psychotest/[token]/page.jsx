'use client'
import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { usePsychotestAttemptStore } from '@/store/psychotestAttemptStore'
import { usePsychotestStore, LIKERT_SCALE } from '@/store/psychotestStore'

// Public, unauthenticated candidate test-taking page — lives outside
// (protected), same pattern as /careers: no sidebar/topbar/auth redirect.
// Reached via the token link HR copies from Psychotest > Hasil Psychotest
// after assigning a test to a candidate.

const scoreAttempt = (test, questions, answers) => {
  let score = 0, maxScore = 0
  for (const qid of test.questionIds) {
    const q = questions.find(x => x.id === qid)
    if (!q || q.type !== 'Pilihan Ganda') continue
    maxScore += Math.max(0, ...q.options.map(o => Number(o.score) || 0))
    const chosen = q.options.find(o => o.id === answers[qid])
    if (chosen) score += Number(chosen.score) || 0
  }
  return { score, maxScore }
}

function Countdown({ deadline, onExpire }) {
  const [msLeft, setMsLeft] = useState(deadline - Date.now())
  useEffect(() => {
    const id = setInterval(() => {
      const left = deadline - Date.now()
      setMsLeft(left)
      if (left <= 0) { clearInterval(id); onExpire() }
    }, 1000)
    return () => clearInterval(id)
  }, [deadline]) // eslint-disable-line react-hooks/exhaustive-deps

  const total = Math.max(0, Math.floor(msLeft / 1000))
  const mm = String(Math.floor(total / 60)).padStart(2, '0')
  const ss = String(total % 60).padStart(2, '0')
  const low = total <= 60
  return (
    <span className={`rounded-full px-3 py-1.5 text-sm font-bold tabular-nums ${low ? 'bg-red-50 text-red-700' : 'bg-teal-50 text-teal-800'}`}>
      ⏱ {mm}:{ss}
    </span>
  )
}

export default function PsychotestTakePage() {
  const { token } = useParams()
  const { attempts, updateAttempt } = usePsychotestAttemptStore()
  const { tests, questions } = usePsychotestStore()

  const [mounted, setMounted] = useState(false)
  // The candidate lands here via a fresh, unauthenticated link — the store
  // hasn't necessarily finished its async dbStorage hydration yet on first
  // paint, which would otherwise flash a false "Link Tidak Valid" before the
  // real attempt loads in.
  const [hydrated, setHydrated] = useState(false)
  const [answers, setAnswers] = useState({})
  useEffect(() => {
    setMounted(true)
    const unsub = usePsychotestAttemptStore.persist.onFinishHydration(() => setHydrated(true))
    if (usePsychotestAttemptStore.persist.hasHydrated()) setHydrated(true)
    return unsub
  }, [])

  const attempt = attempts.find(a => a.token === token)
  const test = attempt ? tests.find(x => x.id === attempt.testId) : null
  const testQuestions = useMemo(
    () => (test ? test.questionIds.map(id => questions.find(q => q.id === id)).filter(Boolean) : []),
    [test, questions],
  )

  // Restore any answers already saved (e.g. candidate refreshed mid-test).
  useEffect(() => { if (attempt?.answers) setAnswers(attempt.answers) }, [attempt?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!mounted || !hydrated) return null

  if (!attempt || !test) {
    return (
      <Shell>
        <div className='py-16 text-center'>
          <p className='text-4xl'>🔗</p>
          <h2 className='mt-3 text-lg font-bold text-gray-800'>Link Tidak Valid</h2>
          <p className='mt-1 text-sm text-gray-500'>Link psikotes ini tidak ditemukan atau sudah tidak berlaku.</p>
        </div>
      </Shell>
    )
  }

  const answerCount = Object.keys(answers).length

  const setAnswer = (qid, value) => {
    const next = { ...answers, [qid]: value }
    setAnswers(next)
    updateAttempt(attempt.id, { answers: next })
  }

  const start = () => updateAttempt(attempt.id, { status: 'In Progress', startedAt: new Date().toISOString() })

  const submit = () => {
    const { score, maxScore } = scoreAttempt(test, questions, answers)
    updateAttempt(attempt.id, { status: 'Completed', completedAt: new Date().toISOString(), answers, score, maxScore })
  }

  if (attempt.status === 'Completed') {
    return (
      <Shell>
        <div className='py-16 text-center'>
          <p className='text-4xl'>✅</p>
          <h2 className='mt-3 text-lg font-bold text-gray-800'>Tes Selesai</h2>
          <p className='mt-1 text-sm text-gray-500'>
            Terima kasih, {attempt.candidateName}. Jawaban Anda untuk <b>{test.name}</b> sudah kami terima.
            Tim rekrutmen akan menghubungi Anda untuk tahap selanjutnya.
          </p>
        </div>
      </Shell>
    )
  }

  if (attempt.status === 'Assigned') {
    return (
      <Shell>
        <div className='py-8 text-center'>
          <p className='text-4xl'>🧠</p>
          <h2 className='mt-3 text-lg font-bold text-gray-800'>{test.name}</h2>
          <p className='mt-1 text-sm text-gray-500'>Halo {attempt.candidateName}, selamat mengerjakan psikotes berikut.</p>
          {test.description && <p className='mt-2 text-sm text-gray-500'>{test.description}</p>}
          <div className='mx-auto mt-5 flex max-w-xs justify-center gap-6 text-sm text-gray-600'>
            <div><p className='font-bold text-gray-800'>{testQuestions.length}</p><p className='text-xs text-gray-400'>Soal</p></div>
            <div><p className='font-bold text-gray-800'>{test.durationMinutes}</p><p className='text-xs text-gray-400'>Menit</p></div>
          </div>
          <div className='mt-5 rounded-xl bg-amber-50 p-3 text-left text-xs text-amber-800'>
            Waktu berjalan otomatis begitu Anda menekan "Mulai Tes" dan tidak bisa dijeda. Pastikan koneksi internet stabil dan Anda punya waktu cukup sebelum memulai.
          </div>
          <button onClick={start}
            className='mt-5 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:shadow-md'
            style={{ background: 'linear-gradient(135deg,#052B52,#039299)' }}>
            Mulai Tes
          </button>
        </div>
      </Shell>
    )
  }

  // In Progress
  const deadline = new Date(attempt.startedAt).getTime() + test.durationMinutes * 60 * 1000

  return (
    <Shell>
      <div className='sticky top-0 z-10 -mx-6 mb-5 flex items-center justify-between bg-white px-6 py-3 shadow-sm'>
        <div>
          <p className='text-sm font-bold text-gray-800'>{test.name}</p>
          <p className='text-xs text-gray-400'>{answerCount} / {testQuestions.length} soal terjawab</p>
        </div>
        <Countdown deadline={deadline} onExpire={submit} />
      </div>

      <div className='space-y-4'>
        {testQuestions.map((q, i) => (
          <div key={q.id} className='rounded-xl border border-gray-100 p-4'>
            <p className='mb-3 text-sm font-semibold text-gray-800'>{i + 1}. {q.questionText}</p>
            {q.type === 'Pilihan Ganda' ? (
              <div className='space-y-2'>
                {q.options.map(o => (
                  <label key={o.id} className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition ${answers[q.id] === o.id ? 'border-teal-400 bg-teal-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input type='radio' name={`q-${q.id}`} checked={answers[q.id] === o.id} onChange={() => setAnswer(q.id, o.id)} className='h-4 w-4 accent-teal-700' />
                    {o.text}
                  </label>
                ))}
              </div>
            ) : (
              <div className='flex flex-wrap gap-2'>
                {LIKERT_SCALE.map(l => (
                  <label key={l.value} className={`flex cursor-pointer flex-col items-center gap-1 rounded-lg border px-2.5 py-2 text-center text-[11px] transition ${answers[q.id] === l.value ? 'border-teal-400 bg-teal-50 font-semibold text-teal-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                    <input type='radio' name={`q-${q.id}`} checked={answers[q.id] === l.value} onChange={() => setAnswer(q.id, l.value)} className='h-4 w-4 accent-teal-700' />
                    <span className='font-bold'>{l.value}</span>
                    <span className='max-w-[64px]'>{l.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className='mt-6 flex justify-end'>
        <button onClick={submit}
          className='rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:shadow-md'
          style={{ background: 'linear-gradient(135deg,#052B52,#039299)' }}>
          Kirim Jawaban
        </button>
      </div>
    </Shell>
  )
}

function Shell({ children }) {
  return (
    <div className='min-h-screen bg-gray-50'>
      <header className='border-b border-gray-100 bg-white'>
        <div className='mx-auto flex max-w-2xl items-center gap-3 px-6 py-4'>
          <img src='/logos/manusistem.png' alt='' className='h-8 w-8 rounded-lg object-contain' />
          <p className='text-sm font-bold text-gray-800'>Psikotes Online — Manusistem</p>
        </div>
      </header>
      <main className='mx-auto max-w-2xl px-6 py-8'>
        <div className='rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100'>
          {children}
        </div>
      </main>
      <footer className='py-6 text-center text-xs text-gray-400'>© {new Date().getFullYear()} Manusistem</footer>
    </div>
  )
}
