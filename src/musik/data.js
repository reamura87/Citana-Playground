// Model lagu untuk Pembuat Musik. Waktu dihitung dalam "langkah" (1/16 not): 4 langkah = 1 ketukan, 16 langkah = 1 birama (4/4).
export const STEP_PER_BEAT = 4
export const STEP_PER_BIRAMA = 16
export const NOT_MIN = 36 // C2
export const NOT_MAKS = 96 // C7
export const BATAS = { trek: 12, not: 4000, birama: 32, bpmMin: 40, bpmMaks: 240 }
export const WARNA_TREK = ['#ff6b6b', '#4dabf7', '#51cf66', '#fcc419', '#cc5de8', '#ff922b', '#22b8cf', '#f06595']

// Baris drum dari atas ke bawah (nomor MIDI standar General MIDI)
export const DRUM_BARIS = [49, 46, 42, 38, 45, 36]
export const NAMA_DRUM = { 36: 'Kick', 38: 'Snare', 42: 'Hat tutup', 45: 'Tom', 46: 'Hat buka', 49: 'Crash' }

// Harus sama dengan kunci INSTRUMEN di instrumen.js (diperiksa oleh uji)
export const ID_INSTRUMEN = ['pulsa125', 'pulsa25', 'pulsa50', 'segitiga', 'gergaji', 'sinus', 'lonceng', 'derau', 'drum']

let cacah = 0
export function idBaru(awalan = 'n') {
  cacah += 1
  return `${awalan}${Date.now().toString(36)}${cacah.toString(36)}${Math.floor(Math.random() * 46656).toString(36)}`
}

export const frekuensi = (n) => 440 * 2 ** ((n - 69) / 12)
const NAMA_NADA = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
export const namaNot = (n) => `${NAMA_NADA[((n % 12) + 12) % 12]}${Math.floor(n / 12) - 1}`
export const adalahHitam = (n) => [1, 3, 6, 8, 10].includes(((n % 12) + 12) % 12)

export const adalahDrum = (trek) => trek.instrumen === 'drum'
export const totalStep = (lagu) => lagu.birama * STEP_PER_BIRAMA
export const klem = (x, a, b) => Math.min(b, Math.max(a, x))

export function trekBaru(instrumen = 'pulsa25', nama = 'Trek', indeks = 0) {
  return {
    id: idBaru('t'), nama, instrumen, volume: 0.8, bisu: false, solo: false,
    warna: WARNA_TREK[indeks % WARNA_TREK.length], not: [],
  }
}

export function laguKosong() {
  return { versi: 1, nama: 'Lagu baru', bpm: 120, birama: 4, trek: [trekBaru('pulsa25', 'Melodi', 0)] }
}

const angka = (x, bawaan) => (Number.isFinite(Number(x)) ? Number(x) : bawaan)

// Membersihkan lagu dari sumber tak tepercaya (berkas yang diimpor atau localStorage): batas, tipe, dan rentang dipaksa valid.
export function validasiLagu(m) {
  if (!m || typeof m !== 'object' || Array.isArray(m)) throw new Error('Berkas ini bukan lagu yang valid.')
  const bpm = Math.round(klem(angka(m.bpm, 120), BATAS.bpmMin, BATAS.bpmMaks))
  const birama = Math.round(klem(angka(m.birama, 4), 1, BATAS.birama))
  const total = birama * STEP_PER_BIRAMA
  let sisaNot = BATAS.not
  const mentahTrek = Array.isArray(m.trek) ? m.trek.slice(0, BATAS.trek) : []
  const trek = mentahTrek.map((t, i) => {
    const instrumen = ID_INSTRUMEN.includes(t?.instrumen) ? t.instrumen : 'pulsa25'
    const drum = instrumen === 'drum'
    const not = []
    for (const x of Array.isArray(t?.not) ? t.not : []) {
      if (sisaNot <= 0) break
      const ts = Math.round(angka(x?.t, -1))
      const n = Math.round(angka(x?.n, -1))
      if (ts < 0 || ts >= total || n < NOT_MIN || n > NOT_MAKS) continue
      if (drum && !DRUM_BARIS.includes(n)) continue
      const d = Math.max(1, Math.min(Math.round(angka(x?.d, 1)), total - ts))
      not.push({ id: idBaru('n'), t: ts, d, n, v: klem(angka(x?.v, 0.8), 0.1, 1) })
      sisaNot -= 1
    }
    const warna = typeof t?.warna === 'string' && /^#[0-9a-f]{6}$/i.test(t.warna) ? t.warna : WARNA_TREK[i % WARNA_TREK.length]
    return {
      id: idBaru('t'), nama: String(t?.nama ?? `Trek ${i + 1}`).slice(0, 30), instrumen,
      volume: klem(angka(t?.volume, 0.8), 0, 1), bisu: Boolean(t?.bisu), solo: Boolean(t?.solo), warna, not,
    }
  })
  if (trek.length === 0) trek.push(trekBaru('pulsa25', 'Melodi', 0))
  return { versi: 1, nama: String(m.nama ?? 'Lagu tanpa judul').slice(0, 60), bpm, birama, trek }
}

// Contoh: cuplikan "Putri Cening Ayu" (lagu daerah Bali), melodi, bas, dan drum bergaya chiptune
export function laguContoh() {
  const n = (t, d, nada, v = 0.85) => ({ id: idBaru('n'), t, d, n: nada, v })
  const melodi = [
    n(12, 4, 64),
    n(16, 6, 67), n(22, 2, 64), n(24, 4, 62), n(28, 2, 64), n(30, 2, 57),
    n(32, 12, 67), n(44, 2, 64), n(46, 2, 67),
    n(48, 6, 64), n(54, 2, 62), n(56, 4, 60), n(60, 4, 55),
  ]
  const bas = [
    n(0, 8, 48), n(8, 8, 43), n(16, 8, 48), n(24, 8, 43),
    n(32, 8, 40), n(40, 8, 47), n(48, 8, 45), n(56, 8, 52),
  ]
  const drum = []
  for (let b = 0; b < 4; b += 1) {
    const o = b * 16
    drum.push(n(o, 1, 36, 1), n(o + 8, 1, 36, 0.9), n(o + 4, 1, 38, 0.9), n(o + 12, 1, 38, 0.9))
    for (let s = 0; s < 16; s += 2) drum.push(n(o + s, 1, 42, s % 4 === 0 ? 0.7 : 0.45))
  }
  const t1 = { ...trekBaru('pulsa25', 'Melodi', 0), not: melodi }
  const t2 = { ...trekBaru('segitiga', 'Bas', 1), volume: 0.9, not: bas }
  const t3 = { ...trekBaru('drum', 'Drum', 2), volume: 0.7, not: drum }
  return { versi: 1, nama: 'Putri Cening Ayu (cuplikan)', bpm: 110, birama: 4, trek: [t1, t2, t3] }
}

// Baris yang tampil di piano roll untuk sebuah trek, dari atas ke bawah
const BARIS_MELODI = Array.from({ length: NOT_MAKS - NOT_MIN + 1 }, (_, i) => NOT_MAKS - i)
export const barisTrek = (trek) => (adalahDrum(trek) ? DRUM_BARIS : BARIS_MELODI)

export function durasiDetik(lagu) {
  return (totalStep(lagu) * 60) / lagu.bpm / STEP_PER_BEAT
}
export function formatWaktu(detik) {
  const d = Math.max(0, Math.round(detik))
  return `${Math.floor(d / 60)}:${String(d % 60).padStart(2, '0')}`
}
