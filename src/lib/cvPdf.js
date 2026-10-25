// Builds a small one-page PDF (text only, Helvetica) as a data URL. Used for the sample CVs of
// the demo candidates; real CVs are the files candidates upload.
const esc = (s) => String(s).replace(/[^\x20-\x7E]/g, '?').replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')

function wrap(text, max = 92) {
  const out = []
  String(text).split(/\r?\n/).forEach(par => {
    let line = ''
    par.split(/\s+/).forEach(w => {
      if ((line + ' ' + w).trim().length > max) { out.push(line); line = w } else line = (line + ' ' + w).trim()
    })
    out.push(line)
  })
  return out
}

/** lines: [{ text, size = 11, bold = false, gap = 0 }] */
export function makePdfDataUrl(lines) {
  let y = 790
  let content = ''
  lines.forEach(({ text, size = 11, bold = false, gap = 0 }) => {
    wrap(text).forEach(part => {
      if (part !== '') content += `BT /${bold ? 'F2' : 'F1'} ${size} Tf 56 ${Math.round(y)} Td (${esc(part)}) Tj ET\n`
      y -= size * 1.55
    })
    y -= gap
  })
  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
    `<< /Length ${content.length} >>\nstream\n${content}endstream`,
  ]
  let out = '%PDF-1.4\n'
  const offsets = []
  objs.forEach((o, i) => { offsets.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n` })
  const xref = out.length
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`
  offsets.forEach(o => { out += `${String(o).padStart(10, '0')} 00000 n \n` })
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  return { dataUrl: `data:application/pdf;base64,${btoa(out)}`, size: out.length }
}

/** A short sample CV built from what the system knows about a candidate. */
export function makeSampleCv(c, positionTitle) {
  return makePdfDataUrl([
    { text: 'CURRICULUM VITAE', size: 20, bold: true, gap: 6 },
    { text: c.name, size: 16, bold: true },
    { text: `${c.email || '-'}   |   ${c.phone || '-'}`, size: 10 },
    { text: `Melamar sebagai: ${positionTitle || '-'}`, size: 11, gap: 14 },
    { text: 'Ringkasan', size: 13, bold: true },
    { text: c.notes || `Melamar melalui ${c.source || 'career site'} pada ${c.appliedDate || '-'}.`, size: 11, gap: 14 },
    { text: 'Data Lamaran', size: 13, bold: true },
    { text: `Sumber: ${c.source || '-'}`, size: 11 },
    { text: `Tanggal melamar: ${c.appliedDate || '-'}`, size: 11, gap: 28 },
    { text: 'Dokumen contoh yang dibuat otomatis untuk demonstrasi. CV asli adalah berkas yang diunggah kandidat.', size: 9 },
  ])
}
