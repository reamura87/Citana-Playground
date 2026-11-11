const MAKS_RIWAYAT = 12
const MAKS_USER = 500
const MAKS_ASISTEN = 700

// Membersihkan riwayat dari klien: hanya peran user/assistant, panjang dibatasi,
// diawali pesan user dan diakhiri pesan user. Mengembalikan null bila tidak valid.
export function rapikan(masukan) {
  if (!Array.isArray(masukan)) return null
  const hasil = []
  for (const m of masukan.slice(-MAKS_RIWAYAT)) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant') || typeof m.content !== 'string') continue
    // eslint-disable-next-line no-control-regex
    const isi = m.content.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim()
    if (!isi) continue
    hasil.push({ role: m.role, content: isi.slice(0, m.role === 'user' ? MAKS_USER : MAKS_ASISTEN) })
  }
  while (hasil.length > 0 && hasil[0].role !== 'user') hasil.shift()
  if (hasil.length === 0 || hasil[hasil.length - 1].role !== 'user') return null
  return hasil
}
