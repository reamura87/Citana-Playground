export const UKURAN = [
  { kode: '2x3', nama: '2×3 cm', lebar: 2, tinggi: 3 },
  { kode: '3x4', nama: '3×4 cm', lebar: 3, tinggi: 4 },
  { kode: '4x6', nama: '4×6 cm', lebar: 4, tinggi: 6 },
  { kode: '35x45', nama: '3,5×4,5 cm', lebar: 3.5, tinggi: 4.5 },
  { kode: 'kustom', nama: 'Kustom' },
]

export const WARNA = [
  { nama: 'Merah', hex: '#d71920' },
  { nama: 'Biru', hex: '#1c5fc7' },
  { nama: 'Putih', hex: '#ffffff' },
]

const DPI = 300
export const cmKePx = (cm) => Math.round((cm / 2.54) * DPI)
const mmKePx = (mm) => Math.round((mm / 25.4) * DPI)

// Menganalisis siluet orang (alpha > 0) pada gambar hasil hapus latar.
// Semua hasil dikembalikan dalam piksel gambar asli.
export function analisisSubjek(bitmap) {
  const k = Math.min(1, 400 / Math.max(bitmap.width, bitmap.height))
  const w = Math.max(8, Math.round(bitmap.width * k))
  const h = Math.max(8, Math.round(bitmap.height * k))
  const kanvas = document.createElement('canvas')
  kanvas.width = w
  kanvas.height = h
  const ctx = kanvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(bitmap, 0, 0, w, h)
  const { data } = ctx.getImageData(0, 0, w, h)

  const jumlah = new Array(h).fill(0)
  const sumX = new Array(h).fill(0)
  const kiri = new Array(h).fill(w)
  const kanan = new Array(h).fill(-1)
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      if (data[(y * w + x) * 4 + 3] > 128) {
        jumlah[y] += 1
        sumX[y] += x
        if (x < kiri[y]) kiri[y] = x
        if (x > kanan[y]) kanan[y] = x
      }
    }
  }

  const ambang = Math.max(3, w * 0.02) // abaikan baris dengan sedikit piksel (bintik)
  let top = -1
  for (let y = 0; y < h; y += 1) {
    if (jumlah[y] >= ambang) {
      top = y
      break
    }
  }
  if (top < 0) return null
  let bottom = top
  for (let y = h - 1; y >= top; y -= 1) {
    if (jumlah[y] >= ambang) {
      bottom = y
      break
    }
  }
  const tinggiSubjek = bottom - top + 1

  // Lebar tiap baris, dihaluskan
  const lb = jumlah.map((_, y) => {
    let s = 0
    let n = 0
    for (let i = Math.max(0, y - 2); i <= Math.min(h - 1, y + 2); i += 1) {
      s += jumlah[i]
      n += 1
    }
    return s / n
  })

  // Cari kepala: lebar maksimum di bagian atas, lalu leher yang menyempit, lalu bahu yang melebar
  let tinggiKepala = null
  const awalPuncak = top + Math.round(tinggiSubjek * 0.08)
  const akhirPuncak = Math.min(bottom, top + Math.round(tinggiSubjek * 0.5))
  let yPuncak = awalPuncak
  for (let y = awalPuncak; y <= akhirPuncak; y += 1) {
    if (lb[y] > lb[yPuncak]) yPuncak = y
  }
  const akhirLeher = Math.min(bottom, yPuncak + Math.round(tinggiSubjek * 0.35))
  let yLeher = yPuncak
  for (let y = yPuncak; y <= akhirLeher; y += 1) {
    if (lb[y] < lb[yLeher]) yLeher = y
  }
  const menyempit = lb[yLeher] <= lb[yPuncak] * 0.82
  const batasBahu = Math.min(bottom, yLeher + Math.round(tinggiSubjek * 0.3))
  let adaBahu = false
  for (let y = yLeher; y <= batasBahu; y += 1) {
    if (lb[y] >= lb[yLeher] * 1.25) {
      adaBahu = true
      break
    }
  }
  if (menyempit && adaBahu) {
    let yDagu = yPuncak
    while (yDagu < yLeher && lb[yDagu] > lb[yLeher] * 1.18) yDagu += 1
    const tk = yDagu - top
    if (tk >= tinggiSubjek * 0.18 && tk <= tinggiSubjek * 0.85) tinggiKepala = tk
  }

  let lebarSubjek = 1
  for (let y = top; y <= bottom; y += 1) {
    if (jumlah[y] >= ambang) lebarSubjek = Math.max(lebarSubjek, kanan[y] - kiri[y] + 1)
  }

  // Titik tengah horizontal: dari baris-baris kepala (atau bagian atas tubuh)
  const acuan = tinggiKepala ?? tinggiSubjek * 0.6
  const dari = top + Math.round(acuan * 0.15)
  const sampai = Math.min(bottom, top + Math.round(acuan * 0.9))
  let sx = 0
  let sn = 0
  for (let y = dari; y <= sampai; y += 1) {
    sx += sumX[y]
    sn += jumlah[y]
  }
  const pusatX = sn > 0 ? sx / sn : w / 2

  return {
    top: top / k,
    bottom: bottom / k,
    tinggiSubjek: tinggiSubjek / k,
    lebarSubjek: lebarSubjek / k,
    pusatX: pusatX / k,
    tinggiKepala: tinggiKepala === null ? null : tinggiKepala / k,
  }
}

// Skala dan posisi gambar di kanvas. zoom, geserX, geserY adalah penyetelan manual.
export function hitungPosisi(a, lebar, tinggi, zoom, geserX, geserY) {
  const marginAtas = tinggi * 0.07
  let skala
  if (a.tinggiKepala) {
    skala = (tinggi * 0.58) / a.tinggiKepala
  } else {
    const dariLebar = (lebar * 0.92) / a.lebarSubjek
    const dariTinggi = (tinggi - marginAtas) / a.tinggiSubjek
    skala = Math.max(dariLebar, dariTinggi)
  }
  // Jangan biarkan ada celah kosong di bawah bahu
  const perluTutup = (tinggi - marginAtas) / a.tinggiSubjek
  if (skala < perluTutup) skala = Math.min(perluTutup, skala * 1.35)

  skala *= zoom
  const x = lebar / 2 - a.pusatX * skala + geserX * lebar
  const y = marginAtas - a.top * skala + geserY * tinggi
  return { skala, x, y }
}

export function gambarPassfoto(kanvas, { sumber, analisis, lebar, tinggi, warna, zoom, geserX, geserY }) {
  kanvas.width = lebar
  kanvas.height = tinggi
  const ctx = kanvas.getContext('2d')
  ctx.fillStyle = warna
  ctx.fillRect(0, 0, lebar, tinggi)

  const { skala, x, y } = hitungPosisi(analisis, lebar, tinggi, zoom, geserX, geserY)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(sumber, x, y, sumber.width * skala, sumber.height * skala)
}

// Tata letak lembar cetak 4R (10×15 cm): pilih tegak atau mendatar, mana yang muat lebih banyak
export function tataLembar(w, h) {
  const margin = mmKePx(3)
  const celah = mmKePx(2)
  const coba = (L, T) => {
    const kolom = Math.max(0, Math.floor((L - 2 * margin + celah) / (w + celah)))
    const baris = Math.max(0, Math.floor((T - 2 * margin + celah) / (h + celah)))
    return { L, T, kolom, baris, jumlah: kolom * baris, celah }
  }
  const tegak = coba(mmKePx(100), mmKePx(150))
  const mendatar = coba(mmKePx(150), mmKePx(100))
  return mendatar.jumlah > tegak.jumlah ? mendatar : tegak
}

export function buatLembarCetak(kanvasFoto) {
  const w = kanvasFoto.width
  const h = kanvasFoto.height
  const tata = tataLembar(w, h)
  if (tata.jumlah === 0) return null

  const lembar = document.createElement('canvas')
  lembar.width = tata.L
  lembar.height = tata.T
  const ctx = lembar.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, tata.L, tata.T)

  const lebarGrid = tata.kolom * w + (tata.kolom - 1) * tata.celah
  const tinggiGrid = tata.baris * h + (tata.baris - 1) * tata.celah
  const x0 = Math.round((tata.L - lebarGrid) / 2)
  const y0 = Math.round((tata.T - tinggiGrid) / 2)

  ctx.strokeStyle = '#c8c8c8'
  ctx.lineWidth = 1
  for (let r = 0; r < tata.baris; r += 1) {
    for (let c = 0; c < tata.kolom; c += 1) {
      const x = x0 + c * (w + tata.celah)
      const y = y0 + r * (h + tata.celah)
      ctx.drawImage(kanvasFoto, x, y)
      ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1)
    }
  }
  return { kanvas: lembar, jumlah: tata.jumlah }
}

export function kanvasKeBlob(kanvas, tipe = 'image/jpeg', kualitas = 0.95) {
  return new Promise((resolve, reject) => {
    kanvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Gagal membuat file gambar'))),
      tipe,
      kualitas,
    )
  })
}