// Semua grafis game digambar lewat kode (Canvas 2D). Tidak ada file gambar.
const S = 2 // satu piksel logis = 2 piksel layar (kecuali ditentukan lain)

function buat(lebar, tinggi, skala = S) {
  const kanvas = document.createElement('canvas')
  kanvas.width = lebar * skala
  kanvas.height = tinggi * skala
  const ctx = kanvas.getContext('2d')
  const px = (warna, x, y, l = 1, t = 1) => {
    ctx.fillStyle = warna
    ctx.fillRect(x * skala, y * skala, l * skala, t * skala)
  }
  return { kanvas, px }
}

export const WARNA_BAJU = ['#c0392b', '#2e5fa3', '#3f8f4e', '#c28a1c', '#7d4fa8', '#2a8a8a']
export const WARNA_RAMBUT = ['#3b2a1a', '#1c1c1c', '#7a4a1e', '#c9a227']
export const JENIS_TANAMAN = ['wortel', 'tomat', 'labu']
export const PALET_KULIT = ['#f5d0a9', '#e0b48a', '#c68e5d', '#a0693d', '#6f4526']
export const PALET_RAMBUT = ['#3b2a1a', '#1c1c1c', '#7a4a1e', '#c9a227', '#b5482e', '#d9d9d9']
export const PALET_BAJU = ['#c0392b', '#2e5fa3', '#3f8f4e', '#c28a1c', '#7d4fa8', '#2a8a8a', '#d35f9a', '#4a4f5a']
export const NAMA_GAYA_RAMBUT = ['Pendek', 'Panjang', 'Jabrik', 'Botak']

// Penampilan pemain: kustom = { kulit, rambut, gaya, baju } (nomor pilihan). Tanpa data: tampilan lama.
export function rupaDariKustom(kustom, idCadangan = '') {
  if (kustom && typeof kustom.kulit === 'number') {
    return {
      kulit: PALET_KULIT[kustom.kulit] ?? PALET_KULIT[1],
      rambut: PALET_RAMBUT[kustom.rambut] ?? PALET_RAMBUT[0],
      gaya: kustom.gaya ?? 0,
      baju: PALET_BAJU[kustom.baju] ?? PALET_BAJU[0],
    }
  }
  return { kulit: PALET_KULIT[1], rambut: PALET_RAMBUT[0], gaya: 3, baju: warnaDariNama(idCadangan).baju }
}

function gambarRambut(px, kelas, arah, gaya, warna) {
  if (gaya === 3) return
  if (kelas === 'penyihir') {
    if (arah === 'samping') {
      if (gaya === 1) px(warna, 5, 4, 2, 6)
      else if (gaya === 2) {
        px(warna, 5, 4, 2, 3)
        px(warna, 4, 5)
      } else px(warna, 6, 4, 1, 3)
    } else if (arah === 'atas') {
      if (gaya === 1) px(warna, 5, 4, 6, 6)
      else if (gaya === 2) px(warna, 4, 4, 8, 3)
      else px(warna, 5, 5, 6, 2)
    } else if (gaya === 1) {
      px(warna, 4, 4, 1, 6)
      px(warna, 11, 4, 1, 6)
    } else if (gaya === 2) {
      px(warna, 3, 4, 2, 2)
      px(warna, 11, 4, 2, 2)
    } else {
      px(warna, 4, 4, 1, 2)
      px(warna, 11, 4, 1, 2)
    }
    return
  }
  // Ksatria: rambut mengintip dari balik helm
  if (arah === 'samping') {
    if (gaya === 1) px(warna, 5, 5, 2, 4)
    else if (gaya === 2) {
      px(warna, 6, 0)
      px(warna, 8, 0)
    } else px(warna, 5, 5, 2, 1)
  } else if (arah === 'atas') {
    if (gaya === 1) px(warna, 5, 5, 6, 4)
    else if (gaya === 2) {
      px(warna, 6, 0)
      px(warna, 8, 0)
      px(warna, 5, 5, 6, 1)
    } else px(warna, 5, 5, 6, 1)
  } else if (gaya === 1) {
    px(warna, 4, 3, 1, 5)
    px(warna, 11, 3, 1, 5)
  } else if (gaya === 2) {
    px(warna, 6, 0)
    px(warna, 8, 0)
    px(warna, 4, 3)
    px(warna, 11, 3)
  } else {
    px(warna, 4, 3, 1, 2)
    px(warna, 11, 3, 1, 2)
  }
}

// Warna tunik ditentukan dari nama, supaya tiap pemain tampak berbeda
export function warnaDariNama(nama = '') {
  let h = 0
  for (const c of nama) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return { baju: WARNA_BAJU[h % WARNA_BAJU.length], rambut: WARNA_RAMBUT[(h >> 3) % WARNA_RAMBUT.length] }
}

// ---------- Pemain: ksatria medieval ----------
const KULIT = '#f1c27d'
const BAJA = '#aab2bb'
const BAJA_GELAP = '#7f8791'
const EMAS = '#d4af37'
const BILAH = '#d8dee4'

function pedangSerang(px, arah, t, baju) {
  if (arah === 'bawah') {
    if (t === 0) {
      px(baju, 12, 5, 1, 3); px(KULIT, 12, 4); px(BILAH, 12, 0, 1, 4); px(EMAS, 11, 4, 3, 1)
    } else if (t === 1) {
      px(baju, 11, 8, 2, 1); px(KULIT, 13, 8); px(EMAS, 13, 7, 1, 3); px(BILAH, 5, 9, 8, 1)
    } else {
      px(baju, 12, 9, 1, 2); px(KULIT, 12, 11); px(EMAS, 11, 11, 3, 1); px(BILAH, 12, 12, 1, 4)
    }
  } else if (arah === 'atas') {
    if (t === 0) {
      px(baju, 11, 6, 1, 2); px(KULIT, 11, 5); px(BILAH, 11, 0, 1, 5); px(EMAS, 10, 5, 3, 1)
    } else if (t === 1) {
      px(baju, 10, 6, 2, 1); px(KULIT, 12, 6); px(EMAS, 12, 5, 1, 3); px(BILAH, 4, 4, 8, 1)
    } else {
      px(baju, 3, 6, 1, 2); px(KULIT, 3, 5); px(BILAH, 3, 0, 1, 5); px(EMAS, 2, 5, 3, 1)
    }
  } else if (t === 0) {
    px(baju, 10, 5, 1, 3); px(KULIT, 10, 4); px(BILAH, 11, 0, 1, 5); px(EMAS, 10, 5, 3, 1)
  } else if (t === 1) {
    px(baju, 9, 8, 2, 1); px(KULIT, 11, 8); px(EMAS, 11, 7, 1, 3); px(BILAH, 12, 8, 4, 1)
  } else {
    px(baju, 10, 9, 1, 2); px(KULIT, 10, 11); px(EMAS, 9, 11, 3, 1); px(BILAH, 13, 11, 1, 4)
  }
}

// langkah: 0 berdiri, 1 dan 2 jalan. serang: null atau tahap tebasan 0..2
export function gambarPemain(arah, langkah, baju, serang = null, rupa = null) {
  const { kanvas, px: px0 } = buat(16, 16)
  const kulit = rupa?.kulit ?? KULIT
  const px = (warna, ...sisa) => px0(warna === KULIT ? kulit : warna, ...sisa)
  const hose = '#5a4636'
  const sepatu = '#3a2616'
  const sabuk = '#5a3b1e'
  const menyerang = serang !== null
  const angkatKiri = !menyerang && langkah === 1 ? 1 : 0
  const angkatKanan = !menyerang && langkah === 2 ? 1 : 0
  const kaki = (x, a) => {
    px(hose, x, 11, 2, 2 - a)
    px(sepatu, x, 13 - a, 2, 1)
  }

  px('rgba(0,0,0,0.25)', 4, 14, 8, 2)

  if (arah === 'samping') {
    kaki(6, angkatKiri)
    kaki(8, angkatKanan)
    px(baju, 5, 7, 6, 4)
    px(sabuk, 5, 9, 6, 1)
    px(EMAS, 7, 9)
    px(BAJA, 5, 7, 2, 1)
    px(KULIT, 7, 2, 4, 5)
    px(BAJA, 5, 1, 6, 3)
    px(BAJA_GELAP, 5, 3, 2, 4)
    px('#222222', 9, 4)
    px('#8a5a2b', 6, 8, 3, 4)
    px(BAJA, 6, 8, 3, 1)
    px(EMAS, 7, 9, 1, 2)
    if (!menyerang) {
      px('#4a4a52', 5, 10, 1, 3)
      px(EMAS, 5, 9)
    }
  } else {
    kaki(5, angkatKiri)
    kaki(9, angkatKanan)
    px(baju, 4, 7, 8, 4)
    px(sabuk, 4, 9, 8, 1)
    px(EMAS, 7, 9, 2, 1)
    px(BAJA, 3, 7, 2, 2)
    px(BAJA, 11, 7, 2, 2)
    px(baju, 3, 9, 1, 2)
    px(KULIT, 3, 11)
    if (arah === 'atas') {
      px(BAJA, 5, 1, 6, 5)
      px(BAJA_GELAP, 5, 5, 6, 1)
    } else {
      px(KULIT, 5, 2, 6, 5)
      px(BAJA, 5, 1, 6, 2)
      px(BAJA_GELAP, 5, 3, 1, 3)
      px(BAJA_GELAP, 10, 3, 1, 3)
      px(BAJA_GELAP, 7, 3, 2, 1)
      px('#222222', 6, 4)
      px('#222222', 9, 4)
      px('#8a5a2b', 1, 8, 3, 4)
      px(BAJA, 1, 8, 3, 1)
      px(EMAS, 2, 9, 1, 2)
    }
    if (!menyerang) {
      px(baju, 12, 9, 1, 2)
      px(KULIT, 12, 11)
      if (arah === 'bawah') {
        px('#4a4a52', 13, 10, 1, 3)
        px(EMAS, 13, 9)
      } else {
        px('#4a4a52', 6, 7)
        px('#4a4a52', 7, 8)
        px('#4a4a52', 8, 9)
      }
    }
  }
  if (rupa) gambarRambut(px, 'ksatria', arah, rupa.gaya, rupa.rambut)
  if (menyerang) pedangSerang(px, arah, serang, baju)
  return kanvas
}

// ---------- Musuh (f = 0 atau 1) ----------
export function gambarGoblin(f) {
  const { kanvas, px } = buat(16, 16)
  const dy = f === 1 ? -1 : 0
  px('rgba(0,0,0,0.25)', 4, 14, 8, 2)
  px('#4a2f18', 5, 12, 2, 2 - (f === 1 ? 1 : 0))
  px('#4a2f18', 9, 12, 2, 2 - (f === 0 ? 1 : 0))
  px('#6b4423', 5, 8 + dy, 6, 5)
  px('#3d2814', 5, 11 + dy, 6, 1)
  px('#7fb34a', 5, 2 + dy, 6, 6)
  px('#7fb34a', 3, 4 + dy, 2, 2)
  px('#7fb34a', 11, 4 + dy, 2, 2)
  px('#d33333', 6, 4 + dy)
  px('#d33333', 9, 4 + dy)
  px('#ffffff', 7, 7 + dy, 2, 1)
  px('#8b5a2b', 12, 6 + dy, 1, 6)
  px('#a9763d', 11, 5 + dy, 3, 2)
  return kanvas
}

// ---------- Musuh baru (f = 0 atau 1) ----------
export function gambarSlime(f) {
  const { kanvas, px } = buat(16, 14)
  const h = f === 1 ? 1 : 0
  px('rgba(0,0,0,0.25)', 2, 12, 12, 2)
  px('#37a043', 3 - h, 10, 10 + h * 2, 2)
  px('#4fc15a', 3 - h, 6 + h, 10 + h * 2, 5 - h)
  px('#4fc15a', 4, 4 + h, 8, 2)
  px('#4fc15a', 5, 3 + h, 6, 1)
  px('#74dd7c', 5, 4 + h, 3, 1)
  px('#74dd7c', 4, 6 + h, 1, 2)
  px('#1d2b1d', 6, 7 + h, 1, 2)
  px('#1d2b1d', 10, 7 + h, 1, 2)
  px('#ffffff', 6, 7 + h)
  px('#ffffff', 10, 7 + h)
  px('#1d2b1d', 8, 10 + h, 2, 1)
  return kanvas
}

export function gambarKelelawar(f) {
  const { kanvas, px } = buat(16, 16)
  const sayap = '#4a3a5c'
  const badan = '#2e2438'
  px('rgba(0,0,0,0.2)', 5, 14, 6, 2)
  if (f === 1) {
    px(sayap, 1, 2, 4, 3)
    px(sayap, 11, 2, 4, 3)
    px(sayap, 3, 4, 3, 2)
    px(sayap, 10, 4, 3, 2)
  } else {
    px(sayap, 0, 6, 5, 3)
    px(sayap, 11, 6, 5, 3)
    px(sayap, 3, 5, 3, 2)
    px(sayap, 10, 5, 3, 2)
  }
  px(badan, 5, 5, 6, 4)
  px(badan, 6, 4, 4, 6)
  px(badan, 5, 3)
  px(badan, 10, 3)
  px('#ff4d4d', 6, 6)
  px('#ff4d4d', 9, 6)
  px('#ffffff', 7, 9)
  px('#ffffff', 8, 9)
  return kanvas
}

export function gambarLabaLaba(f) {
  const { kanvas, px } = buat(16, 14)
  const kaki = '#2a1f33'
  px('rgba(0,0,0,0.25)', 2, 12, 12, 2)
  for (let i = 0; i < 4; i += 1) {
    const y = 5 + i + (i % 2 === f ? 0 : 1)
    px(kaki, 1, y, 3, 1)
    px(kaki, 12, y, 3, 1)
    px(kaki, 0, y + 1, 1, 2)
    px(kaki, 15, y + 1, 1, 2)
  }
  px('#4a2f5e', 5, 6, 6, 5)
  px('#4a2f5e', 6, 4, 4, 3)
  px('#6a4a82', 6, 5, 2, 1)
  px('#ff4d4d', 6, 5)
  px('#ff4d4d', 9, 5)
  px('#ff4d4d', 7, 4)
  px('#ff4d4d', 8, 4)
  px('#8a3a8a', 7, 8, 2, 2)
  return kanvas
}

export function gambarTroll(f) {
  const { kanvas, px } = buat(24, 24)
  const dy = f === 1 ? -1 : 0
  const kulit = '#6f8062'
  const gelap = '#5d6b52'
  px('rgba(0,0,0,0.25)', 4, 22, 16, 2)
  px(gelap, 7, 17, 4, 5 - (f === 1 ? 1 : 0))
  px(gelap, 13, 17, 4, 5 - (f === 0 ? 1 : 0))
  px('#3d3a30', 7, 21, 4, 1)
  px('#3d3a30', 13, 21, 4, 1)
  px(kulit, 6, 8 + dy, 12, 9)
  px('#7f9372', 8, 9 + dy, 4, 2)
  px('#8a6b3a', 7, 15 + dy, 10, 3)
  px(kulit, 8, 2 + dy, 8, 7)
  px(gelap, 7, 4 + dy, 1, 3)
  px(gelap, 16, 4 + dy, 1, 3)
  px('#ffe27a', 9, 5 + dy)
  px('#ffe27a', 14, 5 + dy)
  px('#1d1d1d', 10, 7 + dy, 4, 1)
  px('#f3f3e0', 10, 6 + dy)
  px('#f3f3e0', 13, 6 + dy)
  px(kulit, 3, 9 + dy, 3, 7)
  px(kulit, 18, 9 + dy, 3, 7)
  px('#6b4423', 20, 3 + dy, 3, 14)
  px('#8b5a2b', 19, 1 + dy, 5, 5)
  px('#4a2f18', 21, 3 + dy, 1, 2)
  return kanvas
}

// ---------- NPC (menghadap depan) ----------
export function gambarNPC(jenis) {
  const { kanvas, px } = buat(16, 18)
  px('rgba(0,0,0,0.25)', 4, 16, 8, 2)
  px('#3a2616', 5, 15, 2, 2)
  px('#3a2616', 9, 15, 2, 2)
  px('#5a4636', 5, 12, 2, 3)
  px('#5a4636', 9, 12, 2, 3)
  if (jenis === 'kapten') {
    px('#8a1f1f', 3, 8, 10, 7)
    px('#9aa0a8', 4, 8, 8, 5)
    px('#d4af37', 7, 10, 2, 1)
    px('#e0b48a', 5, 3, 6, 5)
    px('#9aa0a8', 5, 2, 6, 3)
    px('#c0392b', 7, 0, 2, 3)
    px('#222222', 6, 5)
    px('#222222', 9, 5)
    px('#8b5a2b', 13, 3, 1, 12)
    px('#cfd3d8', 12, 1, 3, 3)
  } else if (jenis === 'herbalis') {
    px('#3f8f4e', 4, 8, 8, 7)
    px('#2d6a39', 3, 7, 10, 2)
    px('#e0b48a', 5, 4, 6, 4)
    px('#3f8f4e', 4, 2, 8, 4)
    px('#2d6a39', 4, 5, 1, 3)
    px('#2d6a39', 11, 5, 1, 3)
    px('#222222', 6, 6)
    px('#222222', 9, 6)
    px('#a9763d', 11, 11, 4, 4)
    px('#7fb34a', 12, 10, 2, 1)
    px('#d33333', 13, 10)
  } else {
    px('#6a3fa0', 4, 8, 8, 8)
    px('#8a5fc0', 4, 8, 8, 1)
    px('#e0b48a', 5, 5, 6, 4)
    px('#e8e8e8', 5, 8, 6, 2)
    px('#6a3fa0', 4, 4, 8, 2)
    px('#6a3fa0', 6, 1, 4, 4)
    px('#f2c94c', 7, 4, 2, 1)
    px('#222222', 6, 6)
    px('#222222', 9, 6)
    px('#6b4423', 13, 2, 1, 14)
    px('#6fe4f0', 12, 0, 3, 3)
  }
  return kanvas
}

// ---------- Penyihir ----------
function tongkatSerang(px, arah, t) {
  const kayu = '#6b4423'
  const orb = '#6fe4f0'
  const cahaya = '#ffffff'
  if (arah === 'samping') {
    if (t === 0) {
      px(kayu, 11, 3, 1, 8)
      px(orb, 10, 1, 3, 3)
      px(cahaya, 11, 2)
    } else if (t === 1) {
      px(kayu, 10, 8, 4, 1)
      px(orb, 12, 5, 4, 4)
      px(cahaya, 13, 6, 2, 2)
    } else {
      px(kayu, 10, 8, 4, 1)
      px(orb, 14, 7, 2, 2)
      px(cahaya, 15, 6)
    }
  } else if (arah === 'atas') {
    px(kayu, 13, 3, 1, 9)
    if (t === 0) {
      px(orb, 12, 1, 3, 3)
      px(cahaya, 13, 2)
    } else if (t === 1) {
      px(orb, 5, 0, 6, 3)
      px(cahaya, 7, 1, 2, 1)
    } else {
      px(cahaya, 7, 0)
      px(cahaya, 9, 1)
    }
  } else if (t === 0) {
    px(kayu, 13, 2, 1, 9)
    px(orb, 12, 0, 3, 3)
    px(cahaya, 13, 1)
  } else if (t === 1) {
    px(kayu, 11, 8, 3, 1)
    px(orb, 9, 10, 5, 5)
    px(cahaya, 10, 11, 3, 3)
  } else {
    px(kayu, 11, 8, 3, 1)
    px(orb, 11, 12, 3, 3)
    px(cahaya, 12, 13)
  }
}

export function gambarPenyihir(arah, langkah, baju, serang = null, rupa = null) {
  const { kanvas, px } = buat(16, 16)
  const gelap = '#2b2140'
  const kulit = rupa?.kulit ?? '#e0b48a'
  const menyerang = serang !== null
  px('rgba(0,0,0,0.25)', 4, 14, 8, 2)
  px('#3a2616', 5, 13 - (!menyerang && langkah === 1 ? 1 : 0), 2, 1)
  px('#3a2616', 9, 13 - (!menyerang && langkah === 2 ? 1 : 0), 2, 1)

  if (arah === 'samping') {
    px(baju, 5, 7, 6, 6)
    px(gelap, 5, 9, 6, 1)
    px(kulit, 7, 3, 4, 4)
    px('#222222', 9, 5)
    px(baju, 5, 3, 7, 1)
    px(baju, 6, 2, 5, 1)
    px(baju, 7, 1, 3, 1)
    px(baju, 8, 0, 2, 1)
    px(gelap, 6, 7, 3, 4)
    if (!menyerang) {
      px('#6b4423', 10, 5, 1, 9)
      px('#6fe4f0', 9, 3, 3, 3)
      px('#ffffff', 10, 4)
    }
  } else {
    px(baju, 4, 7, 8, 6)
    px(gelap, 4, 9, 8, 1)
    px('#d4af37', 7, 9, 2, 1)
    px(baju, 3, 8, 1, 3)
    px(baju, 12, 8, 1, 3)
    px(kulit, 3, 11)
    px(kulit, 12, 11)
    if (arah === 'atas') {
      px(gelap, 5, 3, 6, 4)
    } else {
      px(kulit, 5, 3, 6, 4)
      px('#222222', 6, 5)
      px('#222222', 9, 5)
    }
    px(baju, 4, 3, 8, 1)
    px(baju, 5, 2, 6, 1)
    px(baju, 6, 1, 4, 1)
    px(baju, 7, 0, 2, 1)
    if (!menyerang) {
      px('#6b4423', 13, 5, 1, 9)
      px('#6fe4f0', 12, 3, 3, 3)
      px('#ffffff', 13, 4)
    }
  }
  if (rupa) gambarRambut(px, 'penyihir', arah, rupa.gaya, rupa.rambut)
  if (menyerang) tongkatSerang(px, arah, serang)
  return kanvas
}

export function gambarKelas(kelas, arah, langkah, baju, serang = null, rupa = null) {
  return kelas === 'penyihir'
    ? gambarPenyihir(arah, langkah, baju, serang, rupa)
    : gambarPemain(arah, langkah, baju, serang, rupa)
}


export function gambarSerigala(f) {
  const { kanvas, px } = buat(16, 16)
  const dy = f === 1 ? -1 : 0
  px('rgba(0,0,0,0.25)', 2, 14, 12, 2)
  px('#6f747c', 3, 12, 2, 2 - (f === 1 ? 1 : 0))
  px('#6f747c', 8, 12, 2, 2 - (f === 0 ? 1 : 0))
  px('#8a8f98', 2, 7 + dy, 9, 5)
  px('#8a8f98', 10, 5 + dy, 4, 5)
  px('#6f747c', 10, 3 + dy, 1, 2)
  px('#6f747c', 13, 3 + dy, 1, 2)
  px('#cfd3d8', 13, 8 + dy, 2, 2)
  px('#222222', 14, 8 + dy)
  px('#f2c94c', 11, 6 + dy)
  px('#6f747c', 1, 6 + dy + (f === 1 ? 1 : 0), 2, 2)
  return kanvas
}

export function gambarKerangka(f) {
  const { kanvas, px } = buat(20, 20)
  const tulang = '#e8e4d8'
  const dy = f === 1 ? -1 : 0
  px('rgba(0,0,0,0.25)', 5, 18, 10, 2)
  px(tulang, 7, 14, 2, 4 - (f === 1 ? 1 : 0))
  px(tulang, 11, 14, 2, 4 - (f === 0 ? 1 : 0))
  px(tulang, 9, 8 + dy, 2, 6)
  for (let i = 0; i < 3; i += 1) px(tulang, 6, 8 + i * 2 + dy, 8, 1)
  px(tulang, 7, 2 + dy, 6, 5)
  px('#7f8791', 7, 1 + dy, 6, 3)
  px('#7f8791', 6, 3 + dy, 1, 3)
  px('#7f8791', 13, 3 + dy, 1, 3)
  px('#111111', 8, 4 + dy, 1, 2)
  px('#111111', 11, 4 + dy, 1, 2)
  px('#9a7b5a', 16, 5 + dy, 1, 8)
  px(EMAS, 15, 12 + dy, 3, 1)
  px('#6b4423', 1, 8 + dy, 4, 6)
  px('#7f8791', 1, 8 + dy, 4, 1)
  return kanvas
}

export function gambarOrc(f) {
  const { kanvas, px } = buat(20, 20)
  const dy = f === 1 ? -1 : 0
  px('rgba(0,0,0,0.25)', 4, 18, 12, 2)
  px('#3a2616', 6, 15, 3, 3 - (f === 1 ? 1 : 0))
  px('#3a2616', 11, 15, 3, 3 - (f === 0 ? 1 : 0))
  px('#5f8f4e', 5, 7 + dy, 10, 8)
  px('#6b4423', 5, 9 + dy, 10, 4)
  px('#4a3018', 5, 12 + dy, 10, 1)
  px('#5f8f4e', 3, 8 + dy, 2, 5)
  px('#5f8f4e', 15, 8 + dy, 2, 5)
  px('#5f8f4e', 6, 1 + dy, 8, 7)
  px('#3a3f46', 6, 1 + dy, 8, 2)
  px('#e8e0c8', 7, 6 + dy, 1, 2)
  px('#e8e0c8', 12, 6 + dy, 1, 2)
  px('#ffd23f', 8, 3 + dy)
  px('#ffd23f', 11, 3 + dy)
  px('#6b4423', 17, 4 + dy, 1, 10)
  px('#9aa0a8', 15, 3 + dy, 4, 3)
  return kanvas
}

// Bos: naga besar (menghadap kiri), sayap mengepak antara frame 0 dan 1
export function gambarNaga(f) {
  const { kanvas, px } = buat(32, 28, 3)
  const badan = '#9b2d2d'
  const gelap = '#6e1f1f'
  const perut = '#d9a066'
  const tanduk = '#e8e0c8'
  const sayap = '#7a2424'
  px('rgba(0,0,0,0.25)', 3, 25, 26, 3)
  if (f === 0) {
    px(gelap, 13, 1, 2, 11)
    for (let y = 2; y < 12; y += 1) px(sayap, 15, y, y - 1, 1)
  } else {
    px(gelap, 13, 9, 2, 6)
    for (let y = 9; y < 15; y += 1) px(sayap, 15, y, 10 - (y - 9), 1)
  }
  px(badan, 24, 17, 5, 3)
  px(badan, 28, 15, 3, 3)
  px(tanduk, 30, 12, 2, 4)
  const lebar = [12, 16, 18, 18, 18, 16, 12]
  lebar.forEach((l, i) => px(badan, 16 - l / 2, 12 + i, l, 1))
  px(perut, 12, 17, 8, 5)
  px(gelap, 10, 21, 3, 4)
  px(gelap, 19, 21, 3, 4)
  px(tanduk, 10, 25, 3, 1)
  px(tanduk, 19, 25, 3, 1)
  px(badan, 9, 10, 5, 6)
  px(badan, 3, 8, 9, 6)
  px(badan, 1, 10, 4, 3)
  px(tanduk, 9, 5, 2, 4)
  px(tanduk, 5, 6, 1, 3)
  px('#ffd23f', 6, 9, 2, 1)
  px('#ffffff', 2, 13, 3, 1)
  px(gelap, 1, 11)
  return kanvas
}

// ---------- Objek dunia ----------
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

export function gambarNisan() {
  const { kanvas, px } = buat(10, 12)
  px('rgba(0,0,0,0.2)', 1, 10, 8, 2)
  px('#9a9ea6', 2, 3, 6, 8)
  px('#9a9ea6', 3, 2, 4, 1)
  px('#b5b9c0', 3, 3, 1, 6)
  px('#6f7278', 4, 5, 2, 1)
  px('#6f7278', 5, 4, 1, 3)
  return kanvas
}

export function gambarJerami() {
  const { kanvas, px } = buat(14, 10)
  px('rgba(0,0,0,0.2)', 1, 8, 12, 2)
  px('#d6b44a', 1, 2, 12, 6)
  px('#b8962f', 1, 4, 12, 1)
  px('#b8962f', 1, 6, 12, 1)
  px('#8a6a1f', 4, 2, 1, 6)
  px('#8a6a1f', 9, 2, 1, 6)
  return kanvas
}

export function gambarObor() {
  const { kanvas, px } = buat(6, 14)
  px('#6b4423', 2, 5, 2, 9)
  px('#ff9a1f', 1, 1, 4, 4)
  px('#ffd23f', 2, 2, 2, 2)
  px('#ff5a1f', 2, 0, 2, 1)
  return kanvas
}

export function gambarSumur() {
  const { kanvas, px } = buat(16, 18)
  px('rgba(0,0,0,0.25)', 1, 16, 14, 2)
  px('#9a9ea6', 2, 9, 12, 7)
  px('#6f7278', 4, 9, 8, 2)
  px('#3a4f6b', 4, 9, 8, 1)
  px('#6b4423', 2, 3, 1, 8)
  px('#6b4423', 13, 3, 1, 8)
  px('#8a5a2b', 1, 2, 14, 2)
  px('#7a4a1e', 4, 1, 8, 1)
  return kanvas
}

export function gambarPondok(variasi = 0) {
  const { kanvas, px } = buat(36, 30)
  const atap = variasi === 0 ? '#d9b44a' : '#a04a2e'
  const atapGelap = variasi === 0 ? '#b8962f' : '#843a24'
  px('rgba(0,0,0,0.25)', 2, 27, 32, 3)
  px('#e8dcc0', 4, 12, 28, 15)
  px('#6b4423', 4, 12, 28, 1)
  px('#6b4423', 4, 18, 28, 1)
  px('#6b4423', 4, 26, 28, 1)
  px('#6b4423', 4, 12, 1, 15)
  px('#6b4423', 31, 12, 1, 15)
  px('#6b4423', 17, 12, 1, 15)
  for (let i = 0; i < 8; i += 1) {
    const l = 10 + i * 4
    px(i % 2 === 0 ? atap : atapGelap, 18 - l / 2, 4 + i, l, 1)
  }
  px(atapGelap, 0, 12, 36, 1)
  px('#7a4a1e', 20, 18, 6, 9)
  px('#9ad0ef', 8, 16, 5, 4)
  px('#8a8e96', 26, 1, 4, 6)
  return kanvas
}

export function gambarKios() {
  const { kanvas, px } = buat(40, 34)
  px('rgba(0,0,0,0.25)', 2, 31, 36, 3)
  px('#7a4a1e', 4, 10, 2, 21)
  px('#7a4a1e', 34, 10, 2, 21)
  px('#d9c39a', 6, 14, 28, 12)
  for (let i = 0; i < 12; i += 1) {
    px(i % 2 === 0 ? '#b83a3a' : '#f0e9d6', 2 + i * 3, 6, 3, 6)
    if (i % 2 === 0) px('#b83a3a', 2 + i * 3, 12, 3, 2)
  }
  px('#8a5a2b', 6, 24, 28, 7)
  px('#e0a030', 9, 21, 4, 3)
  px('#d93025', 16, 21, 4, 3)
  px('#4a9d5b', 23, 21, 4, 3)
  px('#6b4423', 14, 0, 12, 5)
  px('#f0e9d6', 16, 2, 8, 1)
  return kanvas
}

export function gambarPandaiBesi() {
  const { kanvas, px } = buat(44, 38)
  px('rgba(0,0,0,0.25)', 2, 35, 40, 3)
  px('#8d9096', 4, 14, 36, 22)
  px('#7d8189', 4, 14, 36, 1)
  px('#7d8189', 4, 22, 36, 1)
  px('#7d8189', 4, 30, 36, 1)
  px('#6b4423', 2, 10, 40, 4)
  for (let i = 0; i < 8; i += 1) {
    const l = 14 + i * 4
    px(i % 2 === 0 ? '#5a4636' : '#4a3a2c', 22 - l / 2, 2 + i, l, 1)
  }
  px('#8d9096', 32, 0, 5, 8)
  px('#ff9a1f', 33, 0, 3, 2)
  px('#2b2b30', 8, 24, 10, 12)
  px('#ff7a1f', 10, 28, 6, 6)
  px('#ffd23f', 12, 30, 2, 3)
  px('#3a3f46', 24, 28, 10, 3)
  px('#3a3f46', 26, 25, 6, 3)
  px('#3a3f46', 25, 31, 8, 4)
  px('#6b4423', 17, 15, 10, 7)
  px('#d8dee4', 21, 16, 1, 5)
  px('#d4af37', 19, 19, 5, 1)
  px('#aab2bb', 28, 16, 5, 6)
  px('#d4af37', 30, 17, 1, 4)
  return kanvas
}

const WARNA_BIJIH = [null, '#c47a3a', '#d6dbe3', '#f2c94c', '#6fe4f0', '#8a63d2', '#4fe0b8']

export function gambarBijih(tier, kosong = false) {
  const { kanvas, px } = buat(16, 14)
  px('rgba(0,0,0,0.25)', 1, 12, 14, 2)
  px('#6f7278', 2, 5, 12, 7)
  px('#8d9096', 3, 3, 9, 3)
  px('#a9acb2', 4, 3, 4, 1)
  px('#55585d', 2, 11, 12, 1)
  if (!kosong) {
    const w = WARNA_BIJIH[tier]
    px(w, 4, 6, 2, 2)
    px(w, 8, 5, 3, 2)
    px(w, 6, 9, 3, 2)
    px(w, 11, 8, 2, 2)
    px('#ffffff', 5, 6, 1, 1)
    px('#ffffff', 9, 5, 1, 1)
  }
  return kanvas
}

export function gambarTumbuhan(id, kosong = false) {
  const { kanvas, px } = buat(16, 16)
  px('rgba(0,0,0,0.2)', 3, 14, 10, 2)
  if (kosong) {
    // tinggal tunas kecil sampai tumbuh kembali
    px('#3f8f3f', 7, 11, 2, 3)
    px('#5db65d', 5, 10, 2, 2)
    px('#5db65d', 9, 10, 2, 2)
    return kanvas
  }
  if (id === 'jamur_hutan') {
    px('#f1e6cf', 7, 9, 2, 5)
    px('#b5533c', 4, 6, 8, 4)
    px('#c9684f', 5, 5, 6, 1)
    px('#ffffff', 5, 7)
    px('#ffffff', 9, 6)
    px('#ffffff', 10, 8)
  } else if (id === 'beri_liar') {
    px('#3f8f3f', 3, 7, 10, 7)
    px('#4fa34f', 4, 6, 8, 2)
    px('#7a3fa8', 4, 8, 2, 2)
    px('#7a3fa8', 8, 7, 2, 2)
    px('#7a3fa8', 10, 10, 2, 2)
    px('#9a5fd0', 6, 11, 2, 2)
  } else if (id === 'akar_obat') {
    px('#3f9a3f', 7, 4, 2, 8)
    px('#5db65d', 4, 5, 3, 2)
    px('#5db65d', 9, 6, 3, 2)
    px('#5db65d', 5, 8, 2, 2)
    px('#d9c08a', 7, 12, 2, 2)
  } else {
    // bunga bulan
    px('#3f8f3f', 7, 8, 2, 6)
    px('#cfe8ff', 5, 4, 6, 4)
    px('#ffffff', 6, 5, 4, 2)
    px('#9ad0ef', 7, 3, 2, 1)
    px('#ffe066', 7, 6, 2, 1)
  }
  return kanvas
}

export function gambarKastil() {
  const { kanvas, px } = buat(80, 56, 3)
  const batu = '#9a9ea6'
  const gelap = '#7d8189'
  const terang = '#b5b9c0'
  px('rgba(0,0,0,0.25)', 4, 52, 72, 4)
  px(batu, 16, 24, 48, 28)
  for (let x = 16; x < 64; x += 8) px(batu, x, 20, 4, 4)
  px(batu, 2, 10, 16, 42)
  px(batu, 62, 10, 16, 42)
  for (let x = 2; x < 18; x += 6) {
    px(batu, x, 6, 4, 4)
    px(batu, x + 60, 6, 4, 4)
  }
  px(terang, 2, 10, 16, 1)
  px(terang, 62, 10, 16, 1)
  px(gelap, 2, 51, 76, 1)
  px('#33363c', 9, 20, 2, 6)
  px('#33363c', 69, 20, 2, 6)
  px('#33363c', 9, 34, 2, 6)
  px('#33363c', 69, 34, 2, 6)
  px('#3a2616', 32, 32, 16, 20)
  px('#3a2616', 34, 29, 12, 3)
  px('#7a4a1e', 34, 34, 12, 18)
  px(gelap, 40, 34, 1, 18)
  px('#6b4423', 9, 0, 1, 6)
  px('#c0392b', 10, 0, 6, 4)
  px('#6b4423', 69, 0, 1, 6)
  px('#2e5fa3', 70, 0, 6, 4)
  return kanvas
}

export function gambarGua() {
  const { kanvas, px } = buat(40, 30)
  px('rgba(0,0,0,0.3)', 2, 27, 36, 3)
  px('#6b6560', 2, 6, 36, 22)
  px('#5a554f', 2, 6, 36, 3)
  px('#7b756f', 6, 4, 28, 3)
  px('#1a1210', 12, 12, 16, 16)
  px('#1a1210', 14, 9, 12, 3)
  px('#7b756f', 4, 10, 6, 6)
  px('#7b756f', 30, 14, 6, 6)
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
  const { kanvas, px } = buat(20, 28)
  px('rgba(0,0,0,0.25)', 1, 25, 18, 3)
  px('#8d9096', 1, 6, 4, 20)
  px('#8d9096', 15, 6, 4, 20)
  px('#8d9096', 3, 2, 14, 5)
  px('#a9acb2', 1, 6, 1, 20)
  px('#a9acb2', 3, 2, 14, 1)
  px('rgba(120,200,255,0.55)', 5, 7, 10, 19)
  px('rgba(255,255,255,0.5)', 8, 10, 2, 12)
  return kanvas
}

// ---------- Kebun (petak 48x48 piksel) ----------
export function gambarPetak(terkunci = false) {
  const { kanvas, px } = buat(16, 16, 3)
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
  const { kanvas, px } = buat(16, 16, 3)
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

// ---------- Rumah pribadi: pondok jerami sampai manor batu ----------
export function gambarRumah(level) {
  const { kanvas, px } = buat(48, 40)
  const dinding = level >= 5 ? '#9a9ea6' : '#e8dcc0'
  const atap = level <= 2 ? '#d9b44a' : level === 3 ? '#a04a2e' : level === 4 ? '#8a3b2a' : '#4f5f8a'
  const atapGelap = level <= 2 ? '#b8962f' : level === 3 ? '#843a24' : level === 4 ? '#6d2f21' : '#3f4d70'
  px('rgba(0,0,0,0.25)', 3, 36, 42, 4)
  px(dinding, 6, 16, 36, 20)
  if (level >= 3 && level < 5) {
    px('#6b4423', 6, 16, 36, 1)
    px('#6b4423', 6, 25, 36, 1)
    px('#6b4423', 6, 35, 36, 1)
    px('#6b4423', 6, 16, 1, 20)
    px('#6b4423', 41, 16, 1, 20)
    px('#6b4423', 23, 16, 2, 20)
  }
  for (let i = 0; i < 10; i += 1) {
    const l = 12 + i * 4
    px(i % 2 === 0 ? atap : atapGelap, 24 - l / 2, 6 + i, l, 1)
  }
  px(atapGelap, 0, 15, 48, 1)
  px('#7a4a1e', 21, 26, 6, 10)
  px('#f2c94c', 25, 31)
  px('#9ad0ef', 10, 21, 7, 6)
  px('#9ad0ef', 31, 21, 7, 6)
  px('#5a3b1e', 13, 21, 1, 6)
  px('#5a3b1e', 34, 21, 1, 6)
  if (level >= 2) {
    px('#8d9096', 34, 2, 5, 8)
    px('#d94f7a', 10, 28, 7, 2)
    px('#d94f7a', 31, 28, 7, 2)
  }
  if (level >= 4) px('#9ad0ef', 21, 9, 6, 4)
  if (level >= 5) {
    px('#8d9096', 6, 32, 36, 4)
    px('#6b4423', 3, 0, 1, 12)
    px('#c0392b', 4, 1, 8, 4)
  }
  return kanvas
}

// ---------- Pratinjau untuk sorotan di beranda ----------
export function gambarPratinjau(kanvas) {
  const ctx = kanvas.getContext('2d')
  ctx.imageSmoothingEnabled = false
  const w = kanvas.width
  const h = kanvas.height
  const horizon = 168
  const langit = ctx.createLinearGradient(0, 0, 0, horizon)
  langit.addColorStop(0, '#7fb8ea')
  langit.addColorStop(1, '#d9eefb')
  ctx.fillStyle = langit
  ctx.fillRect(0, 0, w, horizon)
  ctx.fillStyle = '#5a9e4b'
  ctx.fillRect(0, horizon, w, h - horizon)
  ctx.fillStyle = '#b8a07a'
  ctx.fillRect(0, horizon + 56, w, 22)
  const taruh = (sprite, x, y, skala = 1) =>
    ctx.drawImage(sprite, x, y, sprite.width * skala, sprite.height * skala)
  taruh(gambarKastil(), 6, horizon - 168 + 14)
  taruh(gambarPemain('samping', 0, '#2e5fa3', 1), 268, horizon, 3)
  taruh(gambarNaga(0), 372, horizon - 84 + 34)
}