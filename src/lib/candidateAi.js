// Asks the server for an AI suggestion about a candidate (see api/ai/candidate-score).
// The CV is sent along only when it is small enough for the request limit.
const MAX_CLIENT_DOC = 4_300_000

export async function requestCandidateScore({ candidate, requisition, cv }) {
  const sendDoc = cv?.dataUrl && cv.dataUrl.length <= MAX_CLIENT_DOC
  const res = await fetch('/api/ai/candidate-score', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      jobTitle: requisition?.positionTitle || '',
      jobDescription: requisition?.jobDescription || '',
      notes: candidate.notes || '',
      doc: sendDoc ? { fileName: cv.fileName, dataUrl: cv.dataUrl } : null,
    }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json?.error || `Permintaan gagal (${res.status}).`)
  if (cv?.dataUrl && !sendDoc) json.cvNote = 'Berkas CV terlalu besar untuk dikirim ke AI; penilaian hanya dari catatan.'
  return json
}
