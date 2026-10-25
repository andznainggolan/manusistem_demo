import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

// ─── AI suggestion for a candidate ────────────────────────────────────────────
// Compares a candidate (CV + notes) with the requisition's requirements and returns a
// suggested 1-5 score with the reasons. It is advice for the recruiter, never a decision.
// The LLM key is read here from the Gen AI settings (System Admin > Settings > Gen AI),
// not sent by the browser. Mode 'byok' uses the customer's own key; 'embedded' uses the
// platform key from GEN_AI_EMBEDDED_KEY (+ _PROVIDER, _MODEL). For local runs
// GEN_AI_SETTINGS_JSON replaces the database lookup, and ANTHROPIC_BASE_URL /
// OPENAI_BASE_URL / GOOGLE_AI_BASE_URL point a provider at another endpoint.

const MAX_DOC_B64 = 4_300_000   // keeps the request inside the serverless body limit
const MAX_TEXT = 9000

const err = (message, status = 400) => Response.json({ error: message }, { status })

async function loadSettings() {
  if (process.env.GEN_AI_SETTINGS_JSON) {
    try { return JSON.parse(process.env.GEN_AI_SETTINGS_JSON) } catch { /* fall through to the database */ }
  }
  try {
    const row = await prisma.appState.findUnique({ where: { key: 'hcm-gen-ai-settings-v1' } })
    return row ? (JSON.parse(row.value)?.state || null) : null
  } catch { return null }
}

const SYSTEM = `Anda asisten HR yang membantu recruiter menyaring pelamar. Nilai kecocokan kandidat terhadap persyaratan lowongan, hanya berdasarkan bukti di CV dan catatan yang diberikan.
Aturan:
- Dasarkan penilaian pada kualifikasi, pengalaman, dan keterampilan yang diminta lowongan. Jangan menilai atau menyimpulkan jenis kelamin, usia, agama, suku, status pernikahan, kondisi kesehatan, foto, atau asal-usul nama, kecuali lowongan menyatakannya sebagai persyaratan resmi.
- Jangan mengarang. Bila CV tidak tersedia atau tidak terbaca, katakan itu di summary dan beri confidence "rendah".
- Skor 1 sampai 5: 5 sangat cocok, 4 cocok, 3 cukup, 2 kurang cocok, 1 tidak cocok.
- Anda hanya memberi saran; keputusan ada pada recruiter.
Balas HANYA dengan satu objek JSON, tanpa teks lain, dengan bentuk:
{"score": 1-5, "confidence": "rendah"|"sedang"|"tinggi", "summary": "2-3 kalimat", "strengths": ["..."], "concerns": ["..."], "requirementsMet": ["..."], "requirementsMissing": ["..."]}
Tulis dalam Bahasa Indonesia, ringkas, maksimal 5 butir per daftar.`

function parseDataUrl(dataUrl) {
  const m = /^data:([^;,]+);base64,(.+)$/s.exec(dataUrl || '')
  return m ? { mime: m[1].toLowerCase(), b64: m[2] } : null
}
const IMAGE_MIMES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
const isReadable = (mime) => mime === 'application/pdf' || IMAGE_MIMES.includes(mime)

function userText({ jobTitle, jobDescription, notes, hasDoc }) {
  return [
    `LOWONGAN: ${jobTitle || '-'}`,
    `PERSYARATAN DAN DESKRIPSI:\n${(jobDescription || '(tidak ada deskripsi)').slice(0, MAX_TEXT)}`,
    `CATATAN RECRUITER TENTANG KANDIDAT:\n${(notes || '(kosong)').slice(0, 2000)}`,
    hasDoc ? 'CV kandidat terlampir sebagai dokumen. Nilai berdasarkan isinya.' : 'CV tidak terlampir atau tidak bisa dibaca; nilai hanya dari catatan di atas dan sebutkan keterbatasannya.',
  ].join('\n\n')
}

async function callAnthropic({ key, model, text, doc }) {
  const base = process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com'
  const content = []
  if (doc) content.push(doc.mime === 'application/pdf'
    ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: doc.b64 } }
    : { type: 'image', source: { type: 'base64', media_type: doc.mime, data: doc.b64 } })
  content.push({ type: 'text', text })
  const res = await fetch(`${base}/v1/messages`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model, max_tokens: 1200, system: SYSTEM, messages: [{ role: 'user', content }] }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json?.error?.message || `HTTP ${res.status}`)
  return (json.content || []).filter(b => b.type === 'text').map(b => b.text).join('')
}

async function callOpenAI({ key, model, text, doc }) {
  const base = process.env.OPENAI_BASE_URL || 'https://api.openai.com'
  const content = []
  if (doc) content.push(doc.mime === 'application/pdf'
    ? { type: 'input_file', filename: 'cv.pdf', file_data: `data:application/pdf;base64,${doc.b64}` }
    : { type: 'input_image', image_url: `data:${doc.mime};base64,${doc.b64}` })
  content.push({ type: 'input_text', text })
  const res = await fetch(`${base}/v1/responses`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, instructions: SYSTEM, input: [{ role: 'user', content }], max_output_tokens: 1200 }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json?.error?.message || `HTTP ${res.status}`)
  return json.output_text || (json.output || []).flatMap(o => o.content || []).filter(c => c.type === 'output_text').map(c => c.text).join('')
}

async function callGoogle({ key, model, text, doc }) {
  const base = process.env.GOOGLE_AI_BASE_URL || 'https://generativelanguage.googleapis.com'
  const parts = []
  if (doc) parts.push({ inline_data: { mime_type: doc.mime, data: doc.b64 } })
  parts.push({ text })
  const res = await fetch(`${base}/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [{ role: 'user', parts }],
      generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 1200 },
    }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json?.error?.message || `HTTP ${res.status}`)
  return (json.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('')
}

const CALLERS = { Anthropic: callAnthropic, OpenAI: callOpenAI, Google: callGoogle }

const list = (v) => (Array.isArray(v) ? v : []).map(x => String(x).trim().slice(0, 240)).filter(Boolean).slice(0, 6)

function parseAssessment(raw) {
  const m = /\{[\s\S]*\}/.exec(raw || '')
  if (!m) throw new Error('Jawaban AI tidak berbentuk JSON.')
  const o = JSON.parse(m[0])
  const score = Math.round(Number(o.score))
  if (!(score >= 1 && score <= 5)) throw new Error('Skor dari AI tidak valid.')
  return {
    score,
    confidence: ['rendah', 'sedang', 'tinggi'].includes(o.confidence) ? o.confidence : 'sedang',
    summary: String(o.summary || '').trim().slice(0, 700),
    strengths: list(o.strengths), concerns: list(o.concerns),
    requirementsMet: list(o.requirementsMet), requirementsMissing: list(o.requirementsMissing),
  }
}

export async function POST(req) {
  let body
  try { body = await req.json() } catch { return err('Body tidak valid.') }
  const { jobTitle, jobDescription, notes, doc } = body || {}
  if (!jobTitle) return err('Lowongan wajib diisi.')

  const settings = await loadSettings()
  if (!settings || settings.mode === 'off' || !settings.mode) return err('Gen AI nonaktif. Aktifkan di System Admin > Settings > Gen AI.', 403)

  let provider, key, model
  if (settings.mode === 'embedded') {
    provider = process.env.GEN_AI_EMBEDDED_PROVIDER || 'Anthropic'
    key = process.env.GEN_AI_EMBEDDED_KEY
    model = process.env.GEN_AI_EMBEDDED_MODEL || 'claude-sonnet-5-5'
    if (!key) return err('Mode platform belum dikonfigurasi di server (GEN_AI_EMBEDDED_KEY).', 503)
  } else {
    provider = settings.provider; key = settings.apiKey; model = settings.model
    if (!key) return err('API key belum diisi di pengaturan Gen AI.', 400)
  }
  const call = CALLERS[provider]
  if (!call) return err(`Penyedia "${provider}" tidak didukung.`)

  // The CV goes to the model as a document or image when its type allows it.
  let readable = null, skipped = ''
  if (doc?.dataUrl) {
    const p = parseDataUrl(doc.dataUrl)
    if (!p) skipped = 'Format CV tidak dikenali.'
    else if (!isReadable(p.mime)) skipped = 'Jenis berkas CV tidak bisa dibaca AI (hanya PDF dan gambar).'
    else if (p.b64.length > MAX_DOC_B64) skipped = 'Berkas CV terlalu besar untuk dikirim ke AI.'
    else readable = p
  }

  try {
    const raw = await call({ key, model, text: userText({ jobTitle, jobDescription, notes, hasDoc: !!readable }), doc: readable })
    const assessment = parseAssessment(raw)
    return Response.json({ ...assessment, provider, model, cvRead: !!readable, cvNote: skipped })
  } catch (e) {
    return err(`AI gagal memberi saran: ${String(e.message || e).slice(0, 300)}`, 502)
  }
}
