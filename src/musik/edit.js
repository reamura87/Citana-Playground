// Fungsi penyuntingan lagu yang murni (mengembalikan lagu baru, tidak mengubah yang lama).
import { BATAS, STEP_PER_BIRAMA, barisTrek, idBaru, klem, totalStep, trekBaru } from './data'

const petaTrek = (lagu, trekId, fn) => ({ ...lagu, trek: lagu.trek.map((t) => (t.id === trekId ? fn(t) : t)) })

// Merapikan satu not agar berada dalam rentang lagu dan baris trek. Mengembalikan null bila tidak bisa dipakai.
export function rapikanNot(lagu, trek, not) {
  const S = totalStep(lagu)
  const baris = barisTrek(trek)
  const t = Math.round(not.t)
  if (!(t >= 0 && t < S)) return null
  let n = Math.round(not.n)
  if (!baris.includes(n)) {
    if (trek.instrumen !== 'drum') return null
    n = baris.reduce((a, b) => (Math.abs(b - n) < Math.abs(a - n) ? b : a))
  }
  const d = Math.max(1, Math.min(Math.round(not.d ?? 1), S - t))
  return { ...not, t, d, n, v: klem(not.v ?? 0.85, 0.1, 1) }
}

export function tambahNot(lagu, trekId, not) {
  const trek = lagu.trek.find((t) => t.id === trekId)
  if (!trek || trek.not.length >= BATAS.not) return lagu
  const baru = rapikanNot(lagu, trek, not)
  if (!baru) return lagu
  return petaTrek(lagu, trekId, (t) => ({ ...t, not: [...t.not, { ...baru, id: baru.id ?? idBaru('n') }] }))
}

export function hapusNot(lagu, trekId, ids) {
  return petaTrek(lagu, trekId, (t) => ({ ...t, not: t.not.filter((x) => !ids.has(x.id)) }))
}

// patches: { idNot: { t, d, n, v } } (sebagian properti)
export function ubahNot(lagu, trekId, patches) {
  const trek = lagu.trek.find((t) => t.id === trekId)
  if (!trek) return lagu
  return petaTrek(lagu, trekId, (t) => ({
    ...t,
    not: t.not.map((x) => {
      const p = patches[x.id]
      if (!p) return x
      return rapikanNot(lagu, trek, { ...x, ...p }) ?? x
    }),
  }))
}

// Menghitung patch untuk menggeser sekelompok not: dt langkah, dBaris baris. Pergeseran dibatasi agar semua not tetap valid.
export function rencanaGeser(lagu, trek, ids, dt, dBaris) {
  const S = totalStep(lagu)
  const baris = barisTrek(trek)
  const dipilih = trek.not.filter((x) => ids.has(x.id))
  if (dipilih.length === 0) return {}
  const minT = Math.min(...dipilih.map((x) => x.t))
  const maxT = Math.max(...dipilih.map((x) => x.t))
  const idx = dipilih.map((x) => baris.indexOf(x.n))
  const dtOk = klem(dt, -minT, S - 1 - maxT)
  const dbOk = klem(dBaris, -Math.min(...idx), baris.length - 1 - Math.max(...idx))
  const hasil = {}
  dipilih.forEach((x, i) => {
    hasil[x.id] = { t: x.t + dtOk, n: baris[idx[i] + dbOk], d: Math.min(x.d, S - (x.t + dtOk)) }
  })
  return hasil
}

// Menggandakan not terpilih tepat setelah kelompoknya. Mengembalikan { lagu, idBaru }.
export function gandakanNot(lagu, trekId, ids) {
  const trek = lagu.trek.find((t) => t.id === trekId)
  const dipilih = trek ? trek.not.filter((x) => ids.has(x.id)) : []
  if (dipilih.length === 0) return { lagu, idBaru: [] }
  const awal = Math.min(...dipilih.map((x) => x.t))
  const akhir = Math.max(...dipilih.map((x) => x.t + x.d))
  const geser = akhir - awal
  const salinan = []
  for (const x of dipilih) {
    const baru = rapikanNot(lagu, trek, { ...x, id: idBaru('n'), t: x.t + geser })
    if (baru && x.t + geser + x.d <= totalStep(lagu)) salinan.push(baru)
  }
  const sisa = BATAS.not - trek.not.length
  const dipakai = salinan.slice(0, Math.max(0, sisa))
  return {
    lagu: petaTrek(lagu, trekId, (t) => ({ ...t, not: [...t.not, ...dipakai] })),
    idBaru: dipakai.map((x) => x.id),
  }
}

export const ubahTrek = (lagu, trekId, patch) => petaTrek(lagu, trekId, (t) => ({ ...t, ...patch }))

export function tambahTrek(lagu, instrumen = 'pulsa25', nama) {
  if (lagu.trek.length >= BATAS.trek) return lagu
  const t = trekBaru(instrumen, nama ?? `Trek ${lagu.trek.length + 1}`, lagu.trek.length)
  return { ...lagu, trek: [...lagu.trek, t] }
}

export function hapusTrek(lagu, trekId) {
  if (lagu.trek.length <= 1) return lagu
  return { ...lagu, trek: lagu.trek.filter((t) => t.id !== trekId) }
}

// Ganti instrumen: bila beralih ke/dari drum, not yang tidak cocok dengan barisnya dibuang
export function gantiInstrumen(lagu, trekId, instrumen) {
  return petaTrek(lagu, trekId, (t) => {
    const baru = { ...t, instrumen }
    const baris = barisTrek(baru)
    return { ...baru, not: t.not.filter((x) => baris.includes(x.n)) }
  })
}

export const setBpm = (lagu, bpm) => ({ ...lagu, bpm: Math.round(klem(bpm, BATAS.bpmMin, BATAS.bpmMaks)) })
export const setNama = (lagu, nama) => ({ ...lagu, nama: String(nama).slice(0, 60) })

// Mengubah jumlah birama; not yang melewati akhir dipotong atau dibuang
export function setBirama(lagu, jumlah) {
  const birama = Math.round(klem(jumlah, 1, BATAS.birama))
  if (birama === lagu.birama) return lagu
  const S = birama * STEP_PER_BIRAMA
  return {
    ...lagu,
    birama,
    trek: lagu.trek.map((t) => ({
      ...t,
      not: t.not.filter((x) => x.t < S).map((x) => (x.t + x.d > S ? { ...x, d: S - x.t } : x)),
    })),
  }
}
