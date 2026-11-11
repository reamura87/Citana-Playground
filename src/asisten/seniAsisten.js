// Karakter asisten situs: wanita berambut putih panjang, pixel art 160x208 yang digambar dengan kode.
// Fungsi di sini murni menggambar ke konteks 2D, tanpa React dan tanpa berkas gambar.

export const LEBAR = 160
export const TINGGI = 208

const C = {
  garis: '#3f4370',
  kulit: '#ffe6d6', kulitB: '#f4cdb9', kulitBB: '#e3ab98',
  rambut: '#f3f5ff', rambutB: '#d2d8f2', rambutBB: '#a5afd8', rambutT: '#ffffff',
  alis: '#8a91b8',
  irisA: '#3f4fb0', irisB: '#6f8fe8', irisC: '#a9c8ff', pupil: '#1b1d45', bulu: '#2a2c52',
  gaun: '#5a70b8', gaunB: '#44579a', gaunT: '#7f93d6',
  emas: '#e8c050', emasB: '#b88f2a',
  putih: '#fbfbff', putihB: '#dfe3f5',
  pita: '#e0607f', pitaB: '#b8445f',
  sepatu: '#7a4658', kaus: '#f4f4ff',
  mulut: '#a24c63', mulutDalam: '#7a2f45', lidah: '#ee7d93',
  merah: '#e5383b',
}

// Ekspresi: bentuk mata, alis, mulut, rona pipi (0-2) dan tanda tambahan
export const EKSPRESI = {
  netral: { mata: 'buka', alis: 'datar', mulut: 'senyum', pipi: 0 },
  senang: { mata: 'senang', alis: 'naik', mulut: 'lebar', pipi: 1 },
  malu: { mata: 'malu', alis: 'sedih', mulut: 'gelombang', pipi: 2 },
  kaget: { mata: 'kaget', alis: 'tinggi', mulut: 'o', pipi: 0 },
  kesal: { mata: 'kesal', alis: 'kesal', mulut: 'cemberut', pipi: 0 },
  marah: { mata: 'marah', alis: 'marah', mulut: 'cemberut', pipi: 1, urat: true },
  sedih: { mata: 'sedih', alis: 'sedih', mulut: 'cemberut', pipi: 0, air: true },
  jahil: { mata: 'jahil', alis: 'satu', mulut: 'seringai', pipi: 0 },
  bingung: { mata: 'buka', alis: 'satu', mulut: 'gelombang', pipi: 0, keringat: true },
  berpikir: { mata: 'atas', alis: 'satu', mulut: 'kecil', pipi: 0, titik: true },
}

function alat(ctx) {
  const p = (w, x, y, lw = 1, lh = 1) => {
    ctx.fillStyle = w
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(lw), Math.round(lh))
  }
  const baris = (w, y, x1, x2) => {
    if (x2 >= x1) p(w, x1, y, x2 - x1 + 1, 1)
  }
  const elips = (w, cx, cy, rx, ry) => {
    for (let y = Math.ceil(cy - ry); y <= Math.floor(cy + ry); y += 1) {
      const d = (y - cy) / ry
      const hw = rx * Math.sqrt(Math.max(0, 1 - d * d))
      baris(w, y, Math.round(cx - hw), Math.round(cx + hw))
    }
  }
  const poli = (w, t) => {
    let min = Infinity
    let max = -Infinity
    for (const [, y] of t) {
      min = Math.min(min, y)
      max = Math.max(max, y)
    }
    for (let y = Math.floor(min); y <= Math.ceil(max); y += 1) {
      const yy = y + 0.5
      const xs = []
      for (let i = 0; i < t.length; i += 1) {
        const [x1, y1] = t[i]
        const [x2, y2] = t[(i + 1) % t.length]
        if ((y1 <= yy && y2 > yy) || (y2 <= yy && y1 > yy)) xs.push(x1 + ((yy - y1) / (y2 - y1)) * (x2 - x1))
      }
      xs.sort((a, b) => a - b)
      for (let i = 0; i + 1 < xs.length; i += 2) baris(w, y, Math.round(xs[i]), Math.round(xs[i + 1]) - 1)
    }
  }
  const garis = (w, x1, y1, x2, y2, tebal = 1) => {
    let x = Math.round(x1)
    let y = Math.round(y1)
    const xe = Math.round(x2)
    const ye = Math.round(y2)
    const dx = Math.abs(xe - x)
    const dy = -Math.abs(ye - y)
    const sx = x < xe ? 1 : -1
    const sy = y < ye ? 1 : -1
    let err = dx + dy
    for (;;) {
      p(w, x, y, tebal, tebal)
      if (x === xe && y === ye) break
      const e2 = 2 * err
      if (e2 >= dy) {
        err += dy
        x += sx
      }
      if (e2 <= dx) {
        err += dx
        y += sy
      }
    }
  }
  return { p, baris, elips, poli, garis }
}

// Helai rambut panjang berbentuk pita yang bergoyang dan meruncing di ujung
function pita(a, o) {
  const { p, baris } = a
  for (let y = o.y0; y <= o.y1; y += 1) {
    const t = (y - o.y0) / (o.y1 - o.y0)
    const pusat = o.x + o.lengkung * t ** 1.4 + Math.sin(t * 5.2 + o.fase) * o.amp * t
    let lebar = o.w0 + (o.w1 - o.w0) * t
    if (t > 0.84) lebar *= Math.max(0.1, 1 - (t - 0.84) / 0.16)
    if (o.bahu && t < 0.16) lebar *= 0.4 + (t / 0.16) * 0.6
    const kiri = Math.round(pusat - lebar / 2)
    const kanan = Math.round(pusat + lebar / 2)
    const L = kanan - kiri + 1
    baris(C.rambut, y, kiri, kanan)
    if (o.gelap === 'kiri') {
      baris(C.rambutB, y, kiri, kiri + Math.round(L * 0.3))
      baris(C.rambutBB, y, kiri, kiri + Math.round(L * 0.1))
    } else {
      baris(C.rambutB, y, kanan - Math.round(L * 0.3), kanan)
      baris(C.rambutBB, y, kanan - Math.round(L * 0.1), kanan)
    }
    const hi = kiri + Math.round(L * (o.gelap === 'kiri' ? 0.5 : 0.3))
    if ((y + Math.floor(t * 9)) % 11 < 8) p(C.rambutT, hi, y, Math.max(1, Math.round(L * 0.14)), 1)
    if (L > 14 && y % 2 === 0) p(C.rambutB, kiri + Math.round(L * 0.7), y, 1, 1)
  }
}

function alis(a, jenis, cx, cy, sisi) {
  const luar = cx + sisi * 6
  const dalam = cx - sisi * 6
  const pasang = (yLuar, yDalam, tebal = 2) => a.garis(C.alis, luar, cy + yLuar, dalam, cy + yDalam, tebal)
  switch (jenis) {
    case 'naik':
      pasang(-9, -10)
      break
    case 'tinggi':
      pasang(-12, -13)
      break
    case 'marah':
      pasang(-10, -5, 2)
      break
    case 'kesal':
      pasang(-9, -6, 2)
      break
    case 'sedih':
      pasang(-6, -10, 2)
      break
    case 'satu':
      if (sisi > 0) pasang(-10, -12)
      else pasang(-8, -8)
      break
    default:
      pasang(-8, -8)
  }
}

// Mata terbuka dengan kelopak miring opsional: kelopak = [yUjungLuar, yUjungDalam] relatif terhadap cy
function mataBuka(a, cx, cy, sisi, o = {}) {
  const { elips, p, poli, garis } = a
  const rx = o.besar ? 6.4 : 5.8
  const ry = o.besar ? 8 : 7
  const dalam = -sisi
  elips(C.putih, cx, cy, rx, ry)
  const irisRy = o.besar ? 4.6 : 6
  const ix = cx + (o.px ?? 0)
  const iy = cy + 0.5 + (o.py ?? 0)
  elips(C.irisA, ix, iy, o.besar ? 3.8 : 4.8, irisRy)
  elips(C.irisB, ix, iy + 1.5, o.besar ? 3.2 : 4, Math.max(1, irisRy - 2.8))
  elips(C.irisC, ix, iy + irisRy - 1.6, 2.6, 1)
  elips(C.pupil, ix, cy + (o.py ?? 0), o.besar ? 1.3 : 2.2, o.besar ? 2 : 3.6)
  p(C.putih, ix - 3, iy - 4, 3, 3)
  p(C.putih, ix + 1, iy + 2, 2, 1)
  if (o.kelopak) {
    const [yl, yd] = o.kelopak
    poli(C.kulit, [
      [cx - 9, cy - 10],
      [cx + 9, cy - 10],
      [cx + 9, cy + (sisi < 0 ? yd : yl)],
      [cx + sisi * 7 - (sisi < 0 ? 0 : 0), cy + (sisi < 0 ? yl : yd)],
      [cx - 9, cy + (sisi < 0 ? yl : yd)],
    ])
    // garis kelopak dari ujung luar ke ujung dalam
    garis(C.bulu, cx + sisi * 6, cy + yl, cx + dalam * 6, cy + yd, 2)
    if (o.kelopak[0] !== o.kelopak[1] || true) p(C.bulu, cx + sisi * 7, cy + yl - 1, 1, 1)
  } else {
    a.baris(C.bulu, cy - 7, cx - 6, cx + 6)
    a.baris(C.bulu, cy - 8, cx - 4, cx + 4)
    p(C.bulu, cx + sisi * 7, cy - 7, 1, 2)
    p(C.bulu, cx + sisi * 8, cy - 8, 1, 1)
  }
}

function mataTutup(a, cx, cy, sisi) {
  a.baris(C.bulu, cy + 1, cx - 5, cx + 5)
  a.baris(C.bulu, cy + 2, cx - 3, cx + 3)
  a.p(C.bulu, cx + sisi * 6, cy, 1, 1)
}

function mataSenang(a, cx, cy, sisi) {
  for (let dx = -5; dx <= 5; dx += 1) {
    const y = cy + 2 - Math.round(3.4 * (1 - (dx / 5) ** 2))
    a.p(C.bulu, cx + dx, y, 1, 2)
  }
  a.p(C.bulu, cx + sisi * 6, cy + 2, 1, 1)
}

function gambarMata(a, jenis, cx, cy, sisi, kedip) {
  const tutup = kedip && ['buka', 'kesal', 'jahil', 'atas', 'sedih', 'marah', 'kaget'].includes(jenis)
  if (tutup) return mataTutup(a, cx, cy, sisi)
  switch (jenis) {
    case 'senang':
      return mataSenang(a, cx, cy, sisi)
    case 'malu':
      return mataBuka(a, cx, cy, sisi, { kelopak: [-3, -3], py: 1.5, px: -sisi * 0 })
    case 'kaget':
      return mataBuka(a, cx, cy, sisi, { besar: true })
    case 'marah':
      return mataBuka(a, cx, cy, sisi, { kelopak: [-5, -1] })
    case 'kesal':
      return mataBuka(a, cx, cy, sisi, { kelopak: [-4, -2] })
    case 'sedih':
      return mataBuka(a, cx, cy, sisi, { kelopak: [-2, -5], py: 1 })
    case 'jahil':
      return mataBuka(a, cx, cy, sisi, { kelopak: [-2, -2], px: 1.5 })
    case 'atas':
      return mataBuka(a, cx, cy, sisi, { px: 2, py: -1.5 })
    default:
      return mataBuka(a, cx, cy, sisi)
  }
}

function gambarMulut(a, jenis, cx, cy) {
  const { p, baris, elips, poli } = a
  switch (jenis) {
    case 'lebar':
      poli(C.mulutDalam, [[cx - 5, cy - 1], [cx + 5, cy - 1], [cx + 4, cy + 2], [cx + 2, cy + 4], [cx - 2, cy + 4], [cx - 4, cy + 2]])
      baris(C.putih, cy - 1, cx - 4, cx + 4)
      elips(C.lidah, cx, cy + 3, 2, 1)
      break
    case 'buka':
      elips(C.mulutDalam, cx, cy + 1, 2.5, 2.5)
      p(C.lidah, cx - 1, cy + 2, 2, 1)
      break
    case 'o':
      elips(C.mulutDalam, cx, cy + 1, 2, 3)
      p(C.lidah, cx - 1, cy + 3, 2, 1)
      break
    case 'kecil':
      elips(C.mulutDalam, cx + 1, cy + 1, 1.5, 1.5)
      break
    case 'cemberut':
      baris(C.mulut, cy + 1, cx - 3, cx + 3)
      p(C.mulut, cx - 4, cy + 2)
      p(C.mulut, cx + 4, cy + 2)
      break
    case 'gelombang':
      for (let dx = -4; dx <= 4; dx += 1) p(C.mulut, cx + dx, cy + (dx % 2 === 0 ? 1 : 0))
      break
    case 'seringai':
      a.garis(C.mulut, cx - 3, cy + 1, cx + 3, cy + 1)
      p(C.mulut, cx + 4, cy)
      p(C.mulut, cx + 5, cy - 1)
      p(C.putih, cx + 1, cy + 2)
      break
    case 'datar':
      baris(C.mulut, cy + 1, cx - 3, cx + 3)
      break
    default:
      baris(C.mulut, cy + 1, cx - 3, cx + 3)
      p(C.mulut, cx - 4, cy)
      p(C.mulut, cx + 4, cy)
  }
}

function bungaKamboja(a, cx, cy) {
  const { elips } = a
  for (let i = 0; i < 5; i += 1) {
    const sudut = (i / 5) * Math.PI * 2 - Math.PI / 2
    elips('#f7c6d4', cx + Math.cos(sudut) * 4.4, cy + Math.sin(sudut) * 4.4, 3.2, 3.2)
  }
  for (let i = 0; i < 5; i += 1) {
    const sudut = (i / 5) * Math.PI * 2 - Math.PI / 2
    elips('#fffdf3', cx + Math.cos(sudut) * 3.8, cy + Math.sin(sudut) * 3.8, 2.6, 2.6)
  }
  elips('#ffd54a', cx, cy, 2.2, 2.2)
  elips('#f2a93a', cx, cy + 0.5, 1, 1)
}

function hati(ctx, x, y, warna = '#ff5d8f') {
  const pola = ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...']
  pola.forEach((baris, j) => {
    for (let i = 0; i < baris.length; i += 1) {
      if (baris[i] === 'X') {
        ctx.fillStyle = j === 1 && i === 1 ? '#ffd0e0' : warna
        ctx.fillRect(Math.round(x + i), Math.round(y + j), 1, 1)
      }
    }
  })
}

function bintang(ctx, x, y, warna = '#fff2a0') {
  ctx.fillStyle = warna
  ctx.fillRect(Math.round(x + 2), Math.round(y), 1, 5)
  ctx.fillRect(Math.round(x), Math.round(y + 2), 5, 1)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(Math.round(x + 2), Math.round(y + 2), 1, 1)
}

function uratMarah(a, x, y) {
  const { p } = a
  const m = C.merah
  p(m, x, y, 4, 2)
  p(m, x, y, 2, 4)
  p(m, x + 6, y, 4, 2)
  p(m, x + 8, y, 2, 4)
  p(m, x, y + 8, 4, 2)
  p(m, x, y + 6, 2, 4)
  p(m, x + 6, y + 8, 4, 2)
  p(m, x + 8, y + 6, 2, 4)
}

// Garis tepi gelap di sekeliling siluet
function garisTepi(ctx, w, h) {
  const data = ctx.getImageData(0, 0, w, h)
  const a = data.data
  const padat = (x, y) => x >= 0 && y >= 0 && x < w && y < h && a[(y * w + x) * 4 + 3] > 40
  const warna = [0x3f, 0x43, 0x70]
  const tandai = []
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      if (padat(x, y)) continue
      if (padat(x + 1, y) || padat(x - 1, y) || padat(x, y + 1) || padat(x, y - 1)) tandai.push((y * w + x) * 4)
    }
  }
  for (const i of tandai) {
    a[i] = warna[0]
    a[i + 1] = warna[1]
    a[i + 2] = warna[2]
    a[i + 3] = 255
  }
  ctx.putImageData(data, 0, 0)
}

// o: { ekspresi, t (detik), kedip (bool), mulut ('senyum' | 'buka' | 'lebar' | ... atau null) }
export function gambarAsisten(ctx, o = {}) {
  const t = o.t ?? 0
  const eks = EKSPRESI[o.ekspresi] ?? EKSPRESI.netral
  ctx.clearRect(0, 0, LEBAR, TINGGI)
  const a = alat(ctx)
  const { p, baris, elips, poli, garis } = a
  const dy = Math.sin(t * 1.9) > 0.3 ? 1 : 0
  const fase = t * 1.25
  const cx = 80

  // ---------- Rambut belakang (menjuntai panjang) ----------
  pita(a, { x: cx, y0: 26, y1: 128, w0: 52, w1: 36, lengkung: 0, amp: 1, fase, gelap: 'kiri' })
  pita(a, { x: cx - 23, y0: 38, y1: 180, w0: 18, w1: 22, lengkung: -15, amp: 4, fase, gelap: 'kiri', bahu: true })
  pita(a, { x: cx + 23, y0: 38, y1: 180, w0: 18, w1: 22, lengkung: 15, amp: 4, fase: fase + 1.6, gelap: 'kanan', bahu: true })
  pita(a, { x: cx - 17, y0: 52, y1: 158, w0: 12, w1: 15, lengkung: -8, amp: 3, fase: fase + 0.8, gelap: 'kiri', bahu: true })
  pita(a, { x: cx + 17, y0: 52, y1: 158, w0: 12, w1: 15, lengkung: 8, amp: 3, fase: fase + 2.4, gelap: 'kanan', bahu: true })

  // ---------- Kaki dan sepatu ----------
  p(C.kaus, 72, 176, 5, 14)
  p(C.kaus, 83, 176, 5, 14)
  p(C.putihB, 76, 176, 1, 14)
  p(C.putihB, 87, 176, 1, 14)
  elips(C.sepatu, 73, 192, 5, 3)
  elips(C.sepatu, 87, 192, 5, 3)
  p('#a2677a', 70, 190, 4, 1)
  p('#a2677a', 84, 190, 4, 1)

  // ---------- Rok ----------
  const kibas = Math.sin(t * 1.1) * 1.4
  const rok = [[67, 118], [93, 118]]
  for (let i = 0; i <= 8; i += 1) {
    const f = i / 8
    rok.push([93 + f * f * 24 + f * 4, 118 + f * 62])
  }
  for (let i = 8; i >= 0; i -= 1) {
    const f = i / 8
    rok.push([67 - f * f * 24 - f * 4, 118 + f * 62])
  }
  poli(C.gaun, rok)
  // lipatan rok
  for (const [x2, warna] of [[50, C.gaunB], [62, C.gaunT], [72, C.gaunB], [88, C.gaunB], [98, C.gaunT], [110, C.gaunB]]) {
    garis(warna, 80 + (x2 - 80) * 0.2, 122, x2, 176, 1)
  }
  poli(C.gaunB, [[67, 118], [93, 118], [94, 126], [66, 126]])
  // renda putih di ujung rok
  for (let x = 39; x <= 121; x += 1) {
    const yTepi = 176 + Math.sin(x * 0.45 + kibas) * 1.2
    const gel = Math.abs(Math.sin(x * 0.7)) * 2
    baris(C.putih, Math.round(yTepi + gel), x, x)
    baris(C.putih, Math.round(yTepi + gel) - 1, x, x)
    baris(C.putih, Math.round(yTepi) - 2, x, x)
    if (x % 4 === 0) p(C.putihB, x, yTepi - 2, 1, 1)
  }

  // ---------- Bagian atas (ikut bernapas) ----------
  ctx.save()
  ctx.translate(0, dy)

  // leher
  p(C.kulitB, 74, 74, 12, 12)
  p(C.kulitBB, 74, 80, 12, 3)

  // badan
  poli(C.gaun, [[64, 84], [96, 84], [94, 102], [92, 124], [68, 124], [66, 102]])
  poli(C.gaunB, [[84, 90], [96, 84], [94, 102], [92, 124], [84, 124]])
  garis(C.gaunT, 67, 88, 67, 118, 1)
  // kerah putih berbentuk V
  poli(C.putih, [[69, 82], [91, 82], [86, 88], [80, 100], [74, 88]])
  poli(C.putihB, [[80, 100], [86, 88], [91, 82], [84, 90]])
  garis(C.emas, 70, 83, 80, 99, 1)
  garis(C.emas, 90, 83, 80, 99, 1)
  // ikat pinggang
  p(C.emasB, 66, 118, 28, 7)
  p(C.emas, 66, 118, 28, 2)
  p(C.emas, 66, 122, 28, 1)
  // pita di dada
  elips(C.pita, 74, 104, 5, 3)
  elips(C.pita, 86, 104, 5, 3)
  elips(C.pitaB, 80, 104, 2.5, 2.5)
  poli(C.pita, [[78, 106], [82, 106], [85, 118], [80, 115], [75, 118]])
  p(C.pitaB, 80, 106, 1, 8)

  // lengan dan bahu mengembang
  for (const sisi of [-1, 1]) {
    const bx = cx + sisi * 18
    garis(C.kulit, bx, 94, cx + sisi * 6, 124, 6)
    garis(C.kulitB, bx + sisi * 2, 96, cx + sisi * 8, 123, 1)
    elips(C.putih, bx + sisi * 1, 90, 8, 8)
    elips(C.putihB, bx + sisi * 4, 93, 4, 5)
    baris(C.emas, 98, bx - 8, bx + 8)
    p(C.putih, bx - 3, 84, 4, 2)
  }
  // tangan saling menggenggam
  elips(C.kulit, 80, 126, 8, 5)
  elips(C.kulitB, 80, 128, 6, 2)
  p(C.kulitBB, 76, 126, 8, 1)
  p(C.kulit, 79, 122, 3, 3)

  // ---------- Kepala ----------
  poli(C.kulit, [[61, 52], [99, 52], [96, 66], [90, 74], [80, 79], [70, 74], [64, 66]])
  elips(C.kulit, cx, 52, 19, 21)
  poli(C.kulitB, [[96, 66], [99, 52], [98, 60], [92, 72], [80, 78]])
  // bayangan di bawah poni
  baris(C.kulitB, 50, 63, 97)
  baris(C.kulitB, 51, 66, 94)
  // hidung kecil
  p(C.kulitBB, 80, 65, 2, 1)

  // pipi
  const rona = ['#ffe0dc', '#ffc9cf', '#ff9fb0'][eks.pipi]
  if (eks.pipi > 0) {
    elips(rona, 68, 66, 5, 2.3)
    elips(rona, 92, 66, 5, 2.3)
    if (eks.pipi === 2) {
      for (const bx of [65, 89]) {
        garis('#ff7f95', bx, 65, bx + 2, 63, 1)
        garis('#ff7f95', bx + 3, 66, bx + 5, 64, 1)
      }
    }
  }

  // mata, alis, mulut
  gambarMata(a, eks.mata, 70, 58, -1, o.kedip)
  gambarMata(a, eks.mata, 90, 58, 1, o.kedip)
  gambarMulut(a, o.mulut ?? eks.mulut, 80, 69)
  if (eks.air) {
    elips('#8fd3ff', 66, 70, 1.5, 2.5)
    p('#ffffff', 65, 69, 1, 1)
  }

  // ---------- Rambut depan ----------
  // mahkota rambut
  elips(C.rambut, cx, 36, 24, 17)
  elips(C.rambutB, cx + 8, 38, 15, 13)
  elips(C.rambut, cx - 2, 36, 22, 15)
  // kilau melengkung
  for (let i = -10; i <= 10; i += 1) {
    const y = 24 + Math.round((i / 10) ** 2 * 4)
    p(C.rambutT, cx + i * 1.6 - 3, y, 2, 1)
  }
  // poni dengan belahan
  poli(C.rambut, [
    [58, 36], [102, 36], [103, 52], [98, 47], [96, 55], [91, 47], [88, 53], [84, 46], [80, 52],
    [76, 45], [72, 53], [68, 46], [64, 52], [60, 46], [57, 52],
  ])
  poli(C.rambutB, [[84, 46], [88, 53], [91, 47], [96, 55], [98, 47], [103, 52], [102, 36], [90, 36]])
  garis(C.rambutBB, 80, 36, 80, 51, 1)
  garis(C.rambutB, 70, 38, 69, 49, 1)
  garis(C.rambutT, 66, 40, 65, 46, 1)
  garis(C.rambutT, 92, 40, 93, 46, 1)
  // sehelai rambut mencuat
  garis(C.rambutB, 80, 19, 83, 10, 1)
  garis(C.rambutB, 83, 10, 87, 8, 1)
  p(C.rambut, 81, 17, 2, 2)
  // helai yang membingkai wajah
  pita(a, { x: 58, y0: 40, y1: 146, w0: 9, w1: 7, lengkung: -1, amp: 2, fase: fase + 0.6, gelap: 'kiri' })
  pita(a, { x: 102, y0: 40, y1: 146, w0: 9, w1: 7, lengkung: 1, amp: 2, fase: fase + 2.2, gelap: 'kanan' })

  // bunga kamboja di rambut
  bungaKamboja(a, 62, 30)

  // alis (di atas poni)
  alis(a, eks.alis, 70, 58, -1)
  alis(a, eks.alis, 90, 58, 1)

  ctx.restore()

  garisTepi(ctx, LEBAR, TINGGI)

  // ---------- Tanda ekspresi (tanpa garis tepi) ----------
  if (eks.urat) uratMarah(a, 104, 24 + dy)
  if (eks.keringat) {
    poli('#9ad8ff', [[108, 34 + dy], [105, 41 + dy], [111, 41 + dy]])
    elips('#9ad8ff', 108, 42 + dy, 3.2, 3.2)
    p('#ffffff', 106, 41 + dy, 1, 2)
  }
  if (eks.titik) {
    const n = Math.floor(t * 2.5) % 4
    for (let i = 0; i < 3; i += 1) if (i < n) elips('#6f7aa8', 108 + i * 7, 30 + dy, 1.8, 1.8)
  }
  if (o.ekspresi === 'senang' || o.ekspresi === 'malu') {
    bintang(ctx, 112, 40 + Math.sin(t * 3) * 1.5)
    bintang(ctx, 38, 52 + Math.sin(t * 3 + 2) * 1.5, '#ffe0f0')
  }
}

// Partikel melayang (hati, kilau, amarah). daftar: [{ jenis, x, y }]
export function gambarPartikel(ctx, daftar) {
  const a = alat(ctx)
  for (const q of daftar) {
    if (q.jenis === 'hati') hati(ctx, q.x, q.y, q.warna)
    else if (q.jenis === 'bintang') bintang(ctx, q.x, q.y)
    else if (q.jenis === 'marah') uratMarah(a, q.x, q.y)
  }
}

// Zona sentuh dalam koordinat logis kanvas
export function zonaDari(x, y) {
  if (y < 18 || y > 200) return null
  if (x > 55 && x < 105) {
    if (y < 50) return 'kepala'
    if (y < 80) return 'wajah'
    if (y < 132) return 'badan'
    return 'rok'
  }
  if (x > 25 && x < 135 && y > 28) return 'rambut'
  return null
}
