import { Resend } from 'resend'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Sends the resolved Career Site candidate-confirmation email (subject/body
// already filled in with real data by the caller — see
// src/store/notificationSettingsStore.js resolveTemplate). Kept server-side
// so RESEND_API_KEY never reaches the browser bundle.
export async function POST(req) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return Response.json({ error: 'RESEND_API_KEY belum diset di environment.' }, { status: 503 })
  }

  let payload
  try { payload = await req.json() } catch { return Response.json({ error: 'Body tidak valid.' }, { status: 400 }) }
  const { to, subject, body } = payload || {}
  if (!to || !subject || !body) {
    return Response.json({ error: 'to, subject, dan body wajib diisi.' }, { status: 400 })
  }

  try {
    const resend = new Resend(apiKey)
    const { data, error } = await resend.emails.send({
      from: 'Manusistem <onboarding@resend.dev>',
      to,
      subject,
      text: body,
    })
    if (error) {
      return Response.json({ error: error.message || 'Resend menolak permintaan.' }, { status: 502 })
    }
    return Response.json({ id: data?.id || null })
  } catch (err) {
    return Response.json({ error: err?.message || 'Gagal mengirim email.' }, { status: 500 })
  }
}
