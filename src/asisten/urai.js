import { HALAMAN } from './halaman.js'
import { DAFTAR_EKSPRESI } from './persona.js'

const PATH_OK = new Set(HALAMAN.map((h) => h.path))

// Memisahkan balasan model menjadi teks bersih, ekspresi, dan daftar halaman yang ditawarkan.
// Aman dipanggil berulang pada teks yang sedang mengalir (penanda yang belum lengkap disembunyikan).
export function uraiBalasan(mentah) {
  const awal = /^\s*\[([a-z]+)\]/.exec(mentah)
  const ekspresi = awal && DAFTAR_EKSPRESI.includes(awal[1]) ? awal[1] : null
  const buka = []
  for (const m of mentah.matchAll(/\[buka:([^\]\s]+)\]/g)) {
    if (PATH_OK.has(m[1]) && !buka.includes(m[1])) buka.push(m[1])
  }
  const teks = mentah
    .replace(/\[[^\]]*\]/g, '')
    .replace(/\[[^\]]*$/, '')
    .replace(/^\s+/, '')
  return { teks, ekspresi, buka: buka.slice(0, 2) }
}
