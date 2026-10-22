// Semua grafis game digambar lewat kode (Canvas 2D). Tidak ada file gambar.
const S = 2 // satu piksel logis = 2 piksel layar

function buat(lebar, tinggi) {
  const kanvas = document.createElement('canvas')
  kanvas.width = lebar * S
  kanvas.height = tinggi * S
  const ctx = kanvas.getContext('2d')
  const px = (warna, x, y, l = 1, t = 1) => {
    ctx.fillStyle = warna
    ctx.fillRect(x * S, y * S, l * S, t * S)
  }
  return { kanvas, px }
}

export const WARNA_BAJU = ['#d9534f', '#3b82c4', '#4a9d5b', '#e0a030', '#8e5bb5', '#2fa4a4']
export const WARNA_RAMBUT = ['#3b2a1a', '#1c1c1c', '#7a4a1e', '#c9a227']
export const JENIS_TANAMAN = ['wortel', 'tomat', 'labu']

// Warna karakter ditentukan dari nama, supaya tiap pemain tampak berbeda
export function warnaDariNama(nama = '') {
  let h = 0
  for (const c of nama) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return { baju: WARNA_BAJU[h % WARNA_BAJU.length], rambut: WARNA_RAMBUT[(h >> 3) % WARNA_RAMBUT.length] }
}

export function gambarPemain(arah, langkah, baju, rambut) {
  const { kanvas, px } = buat(16, 16)
  const kulit = '#f1c27d'
  const celana = '#3a3f5c'
  const angkatKiri = langkah === 1 ? 1 : 0
  const angkatKanan = langkah === 2 ? 1 : 0
  px('rgba(0,0,0,0.25)', 4, 14, 8, 2)

  if (arah === 'samping') {
    px(celana, 6, 11, 2, 3 - angkatKiri)
    px(celana, 8, 11, 2, 3 - angkatKanan)
    px(baju, 5, 7, 6, 4)
    px(baju, 7, 8, 2, 3)
    px(kulit, 5, 1, 6, 6)
    px(rambut, 5, 1, 6, 2)
    px(rambut, 5, 3, 2, 3)
    px('#222222', 9, 4)
    px(kulit, 11, 4)
  } else {
    px(celana, 5, 11, 2, 3 - angkatKiri)
    px(celana, 9, 11, 2, 3 - angkatKanan)
    px(baju, 4, 7, 8, 4)
    px(baju, 3, 8, 1, 3)
    px(baju, 12, 8, 1, 3)
    px(kulit, 3, 11)
    px(kulit, 12, 11)
    px(kulit, 5, 1, 6, 6)
    if (arah === 'atas') {
      px(rambut, 5, 1, 6, 5)
    } else {
      px(rambut, 5, 1, 6, 2)
      px(rambut, 5, 3)
      px(rambut, 10, 3)
      px('#222222', 6, 4)
      px('#222222', 9, 4)
    }
  }
  return kanvas
}

export function gambarSlime() {
  const { kanvas, px } = buat(16, 16)
  px('rgba(0,0,0,0.25)', 3, 13, 10, 2)
  const lebar = [4, 6, 8, 10, 10, 10, 8]
  lebar.forEach((l, i) => px('#5cc45c', 8 - l / 2, 6 + i, l, 1))
  px('#8be08b', 6, 7, 3, 1)
  px('#2d7a2d', 4, 12, 8, 1)
  px('#1b1b1b', 6, 9, 1, 2)
  px('#1b1b1b', 9, 9, 1, 2)
  return kanvas
}

export function gambarGoblin() {
  const { kanvas, px } = buat(16, 16)
  px('rgba(0,0,0,0.25)', 4, 14, 8, 2)
  px('#6b4423', 5, 8, 6, 5)
  px('#4a2f18', 5, 12, 2, 2)
  px('#4a2f18', 9, 12, 2, 2)
  px('#7fb34a', 5, 2, 6, 6)
  px('#7fb34a', 3, 4, 2, 2)
  px('#7fb34a', 11, 4, 2, 2)
  px('#d33333', 6, 4)
  px('#d33333', 9, 4)
  px('#ffffff', 7, 7, 2, 1)
  px('#8b5a2b', 12, 6, 1, 6)
  px('#8b5a2b', 11, 5, 3, 2)
  return kanvas
}

export function gambarSerigala() {
  const { kanvas, px } = buat(16, 16)
  px('rgba(0,0,0,0.25)', 2, 14, 12, 2)
  px('#8a8f98', 2, 7, 9, 5)
  px('#8a8f98', 10, 5, 4, 5)
  px('#6f747c', 10, 3, 1, 2)
  px('#6f747c', 13, 3, 1, 2)
  px('#cfd3d8', 13, 8, 2, 2)
  px('#222222', 14, 8)
  px('#f2c94c', 11, 6)
  px('#6f747c', 1, 6, 2, 2)
  px('#6f747c', 3, 12, 2, 2)
  px('#6f747c', 8, 12, 2, 2)
  return kanvas
}

export function gambarPohon() {
  const { kanvas, px } = buat(20, 24)
  px('rgba(0,0,0,0.25)', 4, 21, 12, 3)
  px('#6b4423', 8, 14, 4, 9)
  const lebar = [6, 10, 14, 16, 16, 14, 12]
  lebar.forEach((l, i) => px('#2f7d32', 10 - l / 2, 3 + i * 2, l, 2))
  px('#4fa34f', 6, 6, 4, 2)
  px('#4fa34f', 9, 10, 4, 2)
  return kanvas
}

export function gambarSemak() {
  const { kanvas, px } = buat(16, 12)
  const lebar = [8, 12, 14, 14]
  lebar.forEach((l, i) => px('#3f8f3f', 8 - l / 2, 4 + i * 2, l, 2))
  px('#5db65d', 4, 6, 3, 1)
  px('#5db65d', 9, 8, 3, 1)
  return kanvas
}

export function gambarBunga(warna) {
  const { kanvas, px } = buat(8, 8)
  px('#3f8f3f', 4, 4, 1, 4)
  px(warna, 3, 1, 3, 3)
  px('#ffe066', 4, 2)
  return kanvas
}

export function gambarBatu() {
  const { kanvas, px } = buat(14, 10)
  px('rgba(0,0,0,0.2)', 1, 8, 12, 2)
  px('#8d9096', 2, 3, 10, 5)
  px('#a9acb2', 4, 2, 6, 2)
  px('#6f7278', 2, 7, 10, 1)
  return kanvas
}

export function gambarPapan() {
  const { kanvas, px } = buat(14, 16)
  px('rgba(0,0,0,0.25)', 2, 14, 10, 2)
  px('#6b4423', 6, 8, 2, 7)
  px('#a9763d', 1, 1, 12, 8)
  px('#8b5a2b', 1, 1, 12, 1)
  px('#8b5a2b', 1, 8, 12, 1)
  px('#f5f0dc', 3, 3, 8, 1)
  px('#f5f0dc', 3, 5, 6, 1)
  return kanvas
}

export function gambarGerbang() {
  const { kanvas, px } = buat(16, 24)
  px('rgba(0,0,0,0.25)', 1, 21, 14, 3)
  px('#8d9096', 1, 4, 3, 18)
  px('#8d9096', 12, 4, 3, 18)
  px('#8d9096', 3, 2, 10, 3)
  px('#a9acb2', 1, 4, 1, 18)
  px('rgba(120,200,255,0.55)', 4, 5, 8, 17)
  px('rgba(255,255,255,0.5)', 6, 8, 2, 10)
  return kanvas
}

export function gambarPetak(terkunci = false) {
  const { kanvas, px } = buat(16, 16)
  const dasar = terkunci ? '#6b6258' : '#7b5230'
  const gelap = terkunci ? '#5b534a' : '#5a3920'
  px(dasar, 0, 0, 16, 16)
  px(gelap, 0, 0, 16, 1)
  px(gelap, 0, 15, 16, 1)
  px(gelap, 0, 0, 1, 16)
  px(gelap, 15, 0, 1, 16)
  for (let y = 4; y < 15; y += 4) px(gelap, 2, y, 12, 1)
  return kanvas
}

const WARNA_BUAH = { wortel: '#f08a24', tomat: '#d93025', labu: '#e8a317' }

export function gambarTanaman(jenis, tahap) {
  const { kanvas, px } = buat(16, 16)
  const daun = '#3f9a3f'
  const buah = WARNA_BUAH[jenis]
  if (tahap === 0) {
    px(daun, 7, 9, 2, 4)
    px(daun, 5, 8, 2, 2)
    px(daun, 9, 8, 2, 2)
  } else if (tahap === 1) {
    px(daun, 7, 6, 2, 7)
    px(daun, 4, 6, 3, 2)
    px(daun, 9, 6, 3, 2)
    px(daun, 5, 4, 2, 2)
    px(daun, 9, 4, 2, 2)
  } else {
    px(daun, 7, 4, 2, 8)
    px(daun, 4, 4, 3, 2)
    px(daun, 9, 4, 3, 2)
    if (jenis === 'wortel') {
      px(buah, 6, 10, 4, 3)
      px(buah, 7, 13, 2, 1)
    } else if (jenis === 'tomat') {
      px(buah, 4, 7, 3, 3)
      px(buah, 9, 8, 3, 3)
      px(buah, 6, 10, 3, 3)
    } else {
      px(buah, 3, 8, 10, 6)
      px('#b87a0a', 3, 12, 10, 2)
      px('#4a7a2a', 7, 6, 2, 2)
    }
  }
  return kanvas
}

const ATAP = [
  ['#b5532f', '#9a4426'],
  ['#a04040', '#843333'],
  ['#6a5acd', '#5649a8'],
  ['#2e8b8b', '#237070'],
  ['#c28a1c', '#a67413'],
]

export function gambarRumah(level) {
  const { kanvas, px } = buat(48, 40)
  const [atap, atapGelap] = ATAP[level - 1] ?? ATAP[0]
  px('rgba(0,0,0,0.25)', 3, 36, 42, 4)
  px('#e8d9b0', 6, 16, 36, 20)
  px('#c9b88a', 6, 32, 36, 4)
  for (let i = 0; i < 10; i += 1) {
    const l = 12 + i * 4
    px(i % 2 === 0 ? atap : atapGelap, 24 - l / 2, 6 + i, l, 1)
  }
  px(atapGelap, 0, 15, 48, 1)
  px('#7a4a1e', 21, 26, 6, 10)
  px('#f2c94c', 25, 31)
  px('#9ad0ef', 10, 21, 7, 6)
  px('#9ad0ef', 31, 21, 7, 6)
  px('#ffffff', 13, 21, 1, 6)
  px('#ffffff', 34, 21, 1, 6)
  if (level >= 2) px('#8b4a3a', 34, 2, 5, 8)
  if (level >= 3) {
    px('#d94f7a', 10, 28, 7, 2)
    px('#d94f7a', 31, 28, 7, 2)
  }
  if (level >= 4) px('#9ad0ef', 21, 9, 6, 4)
  if (level >= 5) {
    for (let x = 0; x < 48; x += 4) px('#f5f0dc', x, 36, 2, 4)
  }
  return kanvas
}

export function gambarToko() {
  const { kanvas, px } = buat(48, 40)
  px('rgba(0,0,0,0.25)', 3, 36, 42, 4)
  px('#d9c39a', 6, 16, 36, 20)
  for (let i = 0; i < 12; i += 1) px(i % 2 === 0 ? '#d94f4f' : '#f5f0dc', 6 + i * 3, 12, 3, 5)
  px('#a63b3b', 6, 17, 36, 1)
  px('#7a4a1e', 10, 26, 28, 5)
  px('#e0a030', 13, 23, 4, 3)
  px('#d93025', 20, 23, 4, 3)
  px('#4a9d5b', 27, 23, 4, 3)
  px('#7a4a1e', 17, 3, 14, 8)
  px('#f5f0dc', 19, 5, 10, 1)
  px('#f5f0dc', 19, 8, 7, 1)
  return kanvas
}