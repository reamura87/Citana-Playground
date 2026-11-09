// Seni piksel versi detail: bangunan, tokoh, hewan, pohon, cahaya, dan suasana siang-malam.
// Satu piksel gambar = satu piksel layar (4x lebih halus daripada sprite lama yang tiap pikselnya 2x2).

function acak(benih) {
  let s = benih >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

function rgb(hex) {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
function ke(hex, [r, g, b], f) {
  const [a, c, d] = rgb(hex)
  const m = (x, y) => Math.round(x + (y - x) * f)
  return `#${[m(a, r), m(c, g), m(d, b)].map((v) => v.toString(16).padStart(2, '0')).join('')}`
}
export const terang = (hex, f = 0.2) => ke(hex, [255, 255, 255], f)
export const gelap = (hex, f = 0.25) => ke(hex, [0, 0, 0], f)

// ---------- Pembantu gambar ----------
function baru(l, t) {
  const kanvas = document.createElement('canvas')
  kanvas.width = l
  kanvas.height = t
  const ctx = kanvas.getContext('2d')
  const p = (warna, x, y, w = 1, h = 1) => {
    ctx.fillStyle = warna
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h))
  }
  // Kotak dengan bayangan otomatis: sisi atas terang, sisi bawah dan kanan gelap
  const k = (warna, x, y, w, h) => {
    p(warna, x, y, w, h)
    if (h >= 3) {
      p(terang(warna, 0.22), x, y, w, 1)
      p(gelap(warna, 0.22), x, y + h - 1, w, 1)
    }
    if (w >= 4 && h >= 3) p(gelap(warna, 0.12), x + w - 1, y + 1, 1, h - 2)
  }
  const garis = (warna, x1, y1, x2, y2, tebal = 1) => {
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
      p(warna, x, y, tebal, tebal)
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
  const elips = (warna, cx, cy, rx, ry) => {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y += 1) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x += 1) {
        if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) p(warna, x, y)
      }
    }
  }
  return { kanvas, ctx, p, k, garis, elips }
}

// Garis tepi gelap (warna mengikuti warna tepi sprite) dan relief: tepi atas terang, tepi bawah gelap
export function perhalus(kanvas) {
  const l = kanvas.width
  const t = kanvas.height
  const ctx = kanvas.getContext('2d')
  const a = ctx.getImageData(0, 0, l, t).data
  const hasil = ctx.createImageData(l, t)
  const h = hasil.data
  const kl = (v) => Math.max(0, Math.min(255, Math.round(v)))
  const padat = (x, y) => x >= 0 && y >= 0 && x < l && y < t && a[(y * l + x) * 4 + 3] > 200
  const arah = [[1, 0], [-1, 0], [0, 1], [0, -1]]
  for (let y = 0; y < t; y += 1) {
    for (let x = 0; x < l; x += 1) {
      const i = (y * l + x) * 4
      if (padat(x, y)) {
        let f = 1
        let tambah = 0
        if (!padat(x, y - 1)) tambah = 26
        else if (!padat(x, y + 1)) f = 0.82
        h[i] = kl(a[i] * f + tambah)
        h[i + 1] = kl(a[i + 1] * f + tambah)
        h[i + 2] = kl(a[i + 2] * f + tambah)
        h[i + 3] = 255
      } else {
        let tetangga = null
        for (const [dx, dy] of arah) {
          if (padat(x + dx, y + dy)) {
            tetangga = ((y + dy) * l + (x + dx)) * 4
            break
          }
        }
        if (tetangga !== null) {
          h[i] = kl(a[tetangga] * 0.35)
          h[i + 1] = kl(a[tetangga + 1] * 0.35)
          h[i + 2] = kl(a[tetangga + 2] * 0.35)
          h[i + 3] = 255
        } else {
          h[i] = a[i]
          h[i + 1] = a[i + 1]
          h[i + 2] = a[i + 2]
          h[i + 3] = a[i + 3]
        }
      }
    }
  }
  ctx.putImageData(hasil, 0, 0)
  return kanvas
}

// ---------- Atap ----------
const ATAP = {
  jerami: { dasar: '#d9b44a', gelap: '#b08a2a', terang: '#f2d06b' },
  genteng: { dasar: '#b5523a', gelap: '#8a3b2a', terang: '#d8745a' },
  gentengGelap: { dasar: '#8a3b2a', gelap: '#64291d', terang: '#a8503c' },
  sirap: { dasar: '#5b6b8c', gelap: '#3f4d70', terang: '#7d8fb5' },
  kayu: { dasar: '#6a5444', gelap: '#4a3a2c', terang: '#85705c' },
}

function gambarAtap(c, jenis, rnd, tengah, y0, y1, hAtas, hBawah) {
  const w = ATAP[jenis]
  const tinggi = y1 - y0
  const setengah = (y) => hAtas + ((hBawah - hAtas) * (y - y0)) / tinggi
  for (let y = y0; y <= y1; y += 1) {
    const hw = setengah(y)
    c.p(w.dasar, Math.round(tengah - hw), y, Math.round(hw * 2), 1)
  }
  if (jenis === 'jerami') {
    for (let y = y0; y <= y1; y += 1) {
      const hw = setengah(y)
      const x0 = Math.round(tengah - hw)
      const x1 = Math.round(tengah + hw)
      for (let x = x0; x < x1; ) {
        const pjg = 2 + Math.floor(rnd() * 6)
        const r = rnd()
        if (r < 0.28) c.p(w.gelap, x, y, Math.min(pjg, x1 - x), 1)
        else if (r < 0.45) c.p(w.terang, x, y, Math.min(pjg, x1 - x), 1)
        x += pjg + Math.floor(rnd() * 3)
      }
      if ((y - y0) % 4 === 3) c.p(w.gelap, x0, y, x1 - x0, 1)
    }
  } else {
    const tw = jenis === 'sirap' ? 5 : 6
    const th = 3
    for (let y = y0, baris = 0; y <= y1; y += th, baris += 1) {
      const hw = setengah(y)
      const x0 = Math.round(tengah - hw)
      const x1 = Math.round(tengah + hw)
      for (let x = x0 - (baris % 2) * Math.floor(tw / 2); x < x1; x += tw) {
        const xa = Math.max(x, x0)
        const xb = Math.min(x + tw, x1)
        if (xb <= xa) continue
        c.p(rnd() < 0.3 ? w.terang : w.dasar, xa, y, xb - xa, th - 1)
        c.p(w.gelap, xa, y + th - 1, xb - xa, 1)
        c.p(w.gelap, xa, y, 1, th - 1)
      }
    }
  }
  // Cahaya dari kiri atas: sisi kanan sedikit gelap, sisi kiri sedikit terang
  for (let y = y0; y <= y1; y += 1) {
    const hw = setengah(y)
    c.p('rgba(0,0,0,0.12)', Math.round(tengah), y, Math.round(hw), 1)
    c.p('rgba(255,255,255,0.07)', Math.round(tengah - hw), y, Math.round(hw), 1)
  }
  c.k(w.terang, Math.round(tengah - hAtas), y0 - 1, Math.round(hAtas * 2), 3) // bubungan
  const hwB = setengah(y1)
  const xa = Math.round(tengah - hwB - 1)
  const xb = Math.round(tengah + hwB + 1)
  if (jenis === 'jerami') {
    for (let x = xa; x < xb; x += 1) {
      c.p(rnd() > 0.5 ? w.gelap : '#9a7a22', x, y1 + 1, 1, 1 + Math.floor(rnd() * 3))
    }
  } else {
    c.p(w.gelap, xa, y1 + 1, xb - xa, 2)
  }
}

// ---------- Bangunan ----------
function geometri(o) {
  const { l, t } = o
  const dasar = t - 6
  const tDinding = Math.round(t * 0.34)
  const atasDinding = dasar - tDinding
  const jw = Math.round(l * 0.13)
  return {
    dasar,
    tDinding,
    atasDinding,
    jw,
    jh: Math.round(tDinding * 0.4),
    jy: atasDinding + 6,
    xs: [Math.round(l * 0.2), Math.round(l * 0.8) - jw],
    pw: Math.round(l * 0.15),
    ph: Math.round(tDinding * 0.72),
    atapAtas: Math.round(t * 0.08),
    atapBawah: atasDinding + 4,
    tengah: l / 2,
    hAtas: Math.round(l * 0.2),
    hBawah: Math.round(l / 2) - 2,
  }
}

// Posisi tengah tiap jendela relatif terhadap titik pijak (tengah bawah) bangunan
export function posisiJendela(o) {
  const g = geometri(o)
  return g.xs.map((x) => ({ x: x + g.jw / 2 - o.l / 2, y: g.jy + g.jh / 2 - o.t }))
}

const DASAR_PONDOK = { l: 72, t: 60, dinding: '#efe3c4', kayu: '#6b4423', bunga: true, rangka: true }
const DASAR_RUMAH = { l: 96, t: 80, dinding: '#efe3c4', kayu: '#6b4423', rangka: false }

// Kunci tekstur -> rancangan bangunan (ukuran sama seperti sprite lama, jadi tabrakan tidak berubah)
export const BANGUNAN = {
  pondok_0: { ...DASAR_PONDOK, atap: 'jerami', cerobong: true, benih: 3 },
  pondok_1: { ...DASAR_PONDOK, atap: 'genteng', cerobong: true, daun: '#b84a3a', benih: 8 },
  rumah_1: { ...DASAR_RUMAH, atap: 'jerami', benih: 11 },
  rumah_2: { ...DASAR_RUMAH, atap: 'jerami', cerobong: true, bunga: true, benih: 12 },
  rumah_3: { ...DASAR_RUMAH, atap: 'genteng', rangka: true, cerobong: true, bunga: true, daun: '#b84a3a', benih: 13 },
  rumah_4: {
    ...DASAR_RUMAH, atap: 'gentengGelap', rangka: true, cerobong: true, bunga: true, loteng: true, daun: '#8a3b2a', benih: 14,
  },
  rumah_5: {
    ...DASAR_RUMAH, atap: 'sirap', dinding: '#a9adb5', batu: true, cerobong: true, bunga: true, loteng: true,
    bendera: true, daun: '#2e5fa3', benih: 15,
  },
}

export function gambarBangunan(o, menyala = false) {
  const c = baru(o.l, o.t)
  const { p, k, garis, elips } = c
  const rnd = acak(o.benih ?? 5)
  const g = geometri(o)
  const { l, t } = o
  const kayu = o.kayu ?? '#6b4423'
  const x0 = 4
  const lw = l - 8

  elips('rgba(0,0,0,0.28)', l / 2, t - 3, l / 2 - 3, 3)

  // dinding
  k(o.dinding, x0, g.atasDinding, lw, g.tDinding)
  if (o.batu) {
    for (let y = g.atasDinding + 2, b = 0; y < g.dasar - 3; y += 6, b += 1) {
      p(gelap(o.dinding, 0.22), x0, y, lw, 1)
      for (let x = x0 + (b % 2) * 6; x < x0 + lw; x += 12) p(gelap(o.dinding, 0.22), x, y, 1, 6)
    }
  } else {
    for (let i = 0; i < (lw * g.tDinding) / 22; i += 1) {
      p('rgba(120,90,50,0.12)', x0 + rnd() * lw, g.atasDinding + rnd() * g.tDinding, 2, 1)
    }
  }
  // fondasi batu
  k('#8d9096', x0 - 1, g.dasar - 3, lw + 2, 4)
  for (let x = x0; x < x0 + lw; x += 7) p('#6f737b', x, g.dasar - 3, 1, 4)

  // rangka kayu
  if (o.rangka !== false && !o.batu) {
    k(kayu, x0, g.atasDinding, 3, g.tDinding)
    k(kayu, x0 + lw - 3, g.atasDinding, 3, g.tDinding)
    k(kayu, x0, g.atasDinding + 1, lw, 3)
    garis(kayu, x0 + 3, g.dasar - 4, x0 + 11, g.atasDinding + 4, 2)
    garis(kayu, x0 + lw - 4, g.dasar - 4, x0 + lw - 12, g.atasDinding + 4, 2)
  }

  // pintu
  const pxa = Math.round(g.tengah - g.pw / 2)
  const pya = g.dasar - g.ph
  k(kayu, pxa - 1, pya - 1, g.pw + 2, g.ph + 1)
  k('#7a4a1e', pxa, pya, g.pw, g.ph - 1)
  for (let x = pxa + 3; x < pxa + g.pw - 1; x += 3) p(gelap('#7a4a1e', 0.3), x, pya + 1, 1, g.ph - 3)
  p('#f2c94c', pxa + g.pw - 3, pya + Math.round(g.ph / 2), 1, 2)
  k('#9a9ea6', pxa - 2, g.dasar - 1, g.pw + 4, 2)
  p(o.dinding, pxa - 1, pya - 1)
  p(o.dinding, pxa + g.pw, pya - 1)

  // jendela
  for (const x of g.xs) {
    const kaca = menyala ? '#ffd36b' : '#9ad0ef'
    p(kayu, x - 1, g.jy - 1, g.jw + 2, g.jh + 2)
    p(kaca, x, g.jy, g.jw, g.jh)
    p(menyala ? '#fff2b0' : '#d6efff', x + 1, g.jy + 1, 2, 2)
    p(kayu, x + Math.floor(g.jw / 2), g.jy, 1, g.jh)
    p(kayu, x, g.jy + Math.floor(g.jh / 2), g.jw, 1)
    k(o.daun ?? '#3f8f6a', x - 4, g.jy - 1, 3, g.jh + 2)
    k(o.daun ?? '#3f8f6a', x + g.jw + 1, g.jy - 1, 3, g.jh + 2)
    if (o.bunga) {
      k('#6b4423', x - 2, g.jy + g.jh + 1, g.jw + 4, 3)
      for (let i = 0; i < g.jw + 2; i += 2) {
        p('#3f8f3f', x - 1 + i, g.jy + g.jh, 1, 2)
        p(['#e85d9a', '#f2c94c', '#d93025', '#ffffff'][Math.floor(rnd() * 4)], x - 1 + i, g.jy + g.jh - 1)
      }
    }
  }

  // pot dan tong di samping pintu
  k('#b5523a', pxa - 9, g.dasar - 6, 5, 5)
  p('#3f8f3f', pxa - 8, g.dasar - 9, 3, 3)
  p('#e85d9a', pxa - 7, g.dasar - 10)
  k('#8a5a2b', pxa + g.pw + 4, g.dasar - 8, 6, 8)
  p('#4a2f18', pxa + g.pw + 4, g.dasar - 6, 6, 1)

  // atap
  gambarAtap(c, o.atap, rnd, g.tengah, g.atapAtas, g.atapBawah, g.hAtas, g.hBawah)
  p('rgba(0,0,0,0.25)', x0, g.atapBawah + 3, lw, 3)

  if (o.loteng) {
    const dx = Math.round(g.tengah - 7)
    const dy = g.atapAtas + 12
    k(o.dinding, dx, dy + 5, 14, 9)
    for (let i = 0; i < 6; i += 1) p(ATAP[o.atap].dasar, dx + 7 - (2 + i), dy + i, (2 + i) * 2, 1)
    p(kayu, dx + 3, dy + 7, 8, 6)
    p(menyala ? '#ffd36b' : '#9ad0ef', dx + 4, dy + 8, 6, 4)
  }
  if (o.cerobong) {
    const cx = Math.round(g.tengah + g.hBawah * 0.5 - 4)
    const cy = Math.max(0, g.atapAtas - 8)
    k('#8d9096', cx, cy, 8, 22)
    for (let y = cy + 3; y < cy + 22; y += 4) p('#6f737b', cx, y, 8, 1)
    k('#6f737b', cx - 1, cy, 10, 3)
    p('#2b2b30', cx + 1, cy, 6, 1)
  }
  if (o.bendera) {
    p('#6b4423', Math.round(g.tengah), 0, 1, g.atapAtas + 2)
    k(o.daun ?? '#c0392b', Math.round(g.tengah) + 1, 1, 9, 5)
  }
  return perhalus(c.kanvas)
}

export function gambarPandaiBesi2(menyala = false) {
  const c = baru(88, 76)
  const { p, k, garis, elips } = c
  const rnd = acak(41)
  elips('rgba(0,0,0,0.28)', 44, 73, 40, 3)
  k('#8d9096', 6, 34, 76, 36)
  for (let y = 38, b = 0; y < 68; y += 6, b += 1) {
    p('#6f737b', 6, y, 76, 1)
    for (let x = 6 + (b % 2) * 7; x < 82; x += 14) p('#6f737b', x, y, 1, 6)
  }
  // bukaan tungku
  k('#1d1a1a', 12, 44, 26, 25)
  p('#ff7a1f', 16, 60, 10, 9)
  p('#ffb02e', 18, 62, 6, 7)
  p('#fff0a0', 20, 64, 2, 4)
  if (menyala) p('rgba(255,160,60,0.35)', 14, 56, 14, 13)
  k('#3a3f46', 28, 62, 9, 3)
  k('#3a3f46', 30, 59, 5, 3)
  k('#2d3036', 29, 65, 7, 4)
  garis('#6b4423', 38, 52, 34, 62, 1)
  k('#8d9096', 36, 50, 5, 3)
  // rak senjata
  p('#4a3a2c', 42, 47, 11, 2)
  garis('#d3d9e2', 44, 49, 44, 60, 1)
  garis('#d3d9e2', 47, 49, 47, 58, 1)
  garis('#d3d9e2', 50, 49, 50, 60, 1)
  p('#d4af37', 43, 56, 3, 1)
  p('#d4af37', 46, 55, 3, 1)
  // pintu dan jendela
  k('#6b4423', 56, 48, 12, 21)
  for (let x = 59; x < 67; x += 3) p('#4a2f18', x, 49, 1, 19)
  p('#f2c94c', 65, 59, 1, 2)
  p('#4a3a2c', 71, 45, 11, 10)
  p(menyala ? '#ffd36b' : '#9ad0ef', 72, 46, 9, 8)
  p('#4a3a2c', 76, 46, 1, 8)
  p('#4a3a2c', 72, 49, 9, 1)
  // atap kayu gelap
  gambarAtap(c, 'kayu', rnd, 44, 8, 36, 14, 41)
  p('rgba(0,0,0,0.25)', 6, 39, 76, 3)
  // cerobong
  k('#7d8189', 62, 0, 10, 26)
  for (let y = 4; y < 26; y += 4) p('#5f636a', 62, y, 10, 1)
  k('#5f636a', 61, 0, 12, 3)
  p(menyala ? '#ffb02e' : '#ff7a1f', 64, 0, 6, 2)
  // papan nama dan tong
  p('#4a3a2c', 80, 38, 7, 1)
  k('#8a5a2b', 80, 39, 7, 9)
  p('#2a2a2a', 81, 43, 5, 2)
  p('#2a2a2a', 82, 41, 3, 2)
  k('#8a5a2b', 3, 61, 8, 9)
  p('#4a2f18', 3, 64, 8, 1)
  p('#4a2f18', 3, 67, 8, 1)
  return perhalus(c.kanvas)
}

// Titik cahaya malam tiap bangunan, relatif terhadap titik pijak (tengah bawah)
export function lampuBangunan(kunci) {
  if (kunci === 'pandai') {
    return [
      { x: -23, y: -12, r: 46, kuat: 1.1, kedip: true },
      { x: 30, y: -26, r: 22, kuat: 0.7, kedip: false },
      { x: 23, y: -74, r: 20, kuat: 0.8, kedip: true },
    ]
  }
  const o = BANGUNAN[kunci]
  return posisiJendela(o).map((j) => ({ x: j.x, y: j.y, r: Math.round(o.l * 0.3), kuat: 0.75, kedip: false }))
}

// ---------- Pohon dan semak ----------
export function gambarPohon2() {
  const c = baru(40, 56)
  const { k, p, elips } = c
  const rnd = acak(21)
  elips('rgba(0,0,0,0.28)', 20, 53, 13, 3)
  k('#6b4423', 17, 33, 7, 20)
  for (let i = 0; i < 6; i += 1) p('#4a2f18', 18 + (i % 3) * 2, 35 + i * 3, 1, 2)
  p('#8a5a2b', 18, 34, 1, 17)
  k('#6b4423', 14, 50, 4, 3)
  k('#6b4423', 23, 50, 4, 3)
  const gugus = [[20, 21, 14], [10, 27, 9], [30, 27, 9], [20, 10, 10], [13, 15, 8], [28, 15, 8]]
  const hijau = ['#2f6b2f', '#3f8f3f', '#52a64f', '#6dbf62']
  for (const [x, y, r] of gugus) elips(hijau[0], x, y, r, r)
  for (const [x, y, r] of gugus) elips(hijau[1], x - 1, y - 2, r - 2, r - 2)
  for (const [x, y, r] of gugus) elips(hijau[2], x - 2, y - 4, r - 5, r - 5)
  for (let i = 0; i < 90; i += 1) {
    const x = 6 + rnd() * 28
    const y = 3 + rnd() * 30
    if (((x - 20) / 15) ** 2 + ((y - 20) / 17) ** 2 < 1) p(rnd() > 0.5 ? hijau[3] : hijau[0], x, y, 2, 1)
  }
  return perhalus(c.kanvas)
}

export function gambarSemak2() {
  const c = baru(28, 18)
  const { p, elips } = c
  const rnd = acak(33)
  elips('rgba(0,0,0,0.25)', 14, 16, 11, 2)
  const gugus = [[9, 11, 7], [19, 11, 7], [14, 8, 8]]
  const h = ['#2f6b2f', '#3f8f3f', '#52a64f']
  for (const [x, y, r] of gugus) elips(h[0], x, y, r, r)
  for (const [x, y, r] of gugus) elips(h[1], x - 1, y - 1, r - 2, r - 2)
  for (const [x, y, r] of gugus) elips(h[2], x - 2, y - 3, r - 4, r - 4)
  for (let i = 0; i < 5; i += 1) p(['#d93025', '#f2c94c'][Math.floor(rnd() * 2)], 6 + rnd() * 16, 6 + rnd() * 8, 2, 2)
  return perhalus(c.kanvas)
}

// ---------- Hewan ----------
export function gambarAnjing(f) {
  const c = baru(28, 20)
  const { p, k, garis, elips } = c
  const bulu = '#b9824a'
  const tua = '#8a5a2b'
  const muda = '#d9a86a'
  elips('rgba(0,0,0,0.25)', 14, 18, 10, 2)
  const a = f === 1
  k(tua, 7, 13, 3, 6 - (a ? 1 : 0))
  k(tua, 11, 13, 3, 6 - (a ? 0 : 1))
  k(tua, 16, 13, 3, 6 - (a ? 0 : 1))
  k(tua, 20, 13, 3, 6 - (a ? 1 : 0))
  k(bulu, 6, 7, 17, 8)
  p(muda, 8, 12, 9, 3)
  garis(bulu, 6, 8, 2, 3, 2)
  k(bulu, 19, 3, 8, 8)
  k(tua, 19, 2, 3, 5)
  k(muda, 25, 7, 3, 4)
  p('#222222', 27, 7)
  p('#222222', 23, 5)
  p('#c0392b', 19, 9, 1, 3)
  return perhalus(c.kanvas)
}

export function gambarKucing(f) {
  const c = baru(22, 18)
  const { p, k, garis, elips } = c
  const bulu = '#8a8f99'
  const tua = '#5f646e'
  elips('rgba(0,0,0,0.25)', 11, 16, 8, 2)
  const a = f === 1
  k(tua, 6, 11, 3, 5 - (a ? 1 : 0))
  k(tua, 9, 11, 3, 5 - (a ? 0 : 1))
  k(tua, 13, 11, 3, 5 - (a ? 0 : 1))
  k(tua, 16, 11, 3, 5 - (a ? 1 : 0))
  k(bulu, 5, 6, 14, 7)
  for (let x = 7; x < 18; x += 3) p(tua, x, 6, 1, 4)
  garis(bulu, 5, 8, 2, 2, 2)
  garis(bulu, 2, 2, 2, 5, 2)
  k(bulu, 15, 3, 6, 7)
  p(tua, 15, 1, 2, 3)
  p(tua, 19, 1, 2, 3)
  p('#6fc36a', 18, 5, 1, 2)
  p('#e87aa6', 20, 8)
  return perhalus(c.kanvas)
}

// ---------- Tokoh (pemain dan NPC) ----------
function ksatria(c, arah, langkah, baju, serang, rupa, ops) {
  const { p, k, garis } = c
  const { kulit, rambut, gaya } = rupa
  const BAJA = '#aab3bf'
  const BAJA_T = '#d3d9e2'
  const BAJA_G = '#737d8b'
  const CELANA = '#3b4150'
  const SEPATU = '#5a3b1e'
  const SABUK = '#6b4423'
  const EMAS = '#d4af37'
  const SARUNG = '#4a3a2c'
  const mata = '#2a1f1a'
  const menyerang = serang !== null
  const by = !menyerang && langkah !== 0 ? -1 : 0
  const ay = langkah === 1 ? 1 : langkah === 2 ? -1 : 0
  c.elips('rgba(0,0,0,0.28)', 16, 30, 9, 2)

  const jambul = (x) => {
    if (gaya === 2) {
      p(rambut, x - 3, 2 + by, 2, 2)
      p(rambut, x - 1, 1 + by, 2, 3)
      p(rambut, x + 1, 2 + by, 2, 2)
    } else {
      k('#c0392b', x - 2, 1 + by, 4, 3)
    }
  }
  // Tebasan menghadap depan atau belakang
  const tebasLurus = (t) => {
    if (t === 0) {
      k(BAJA_G, 21, 12, 3, 5)
      p(kulit, 21, 10, 3, 2)
      p(EMAS, 19, 9, 7, 1)
      garis(BAJA_T, 22, 8, 22, 0, 2)
    } else if (t === 1) {
      k(BAJA_G, 21, 14, 3, 5)
      p(kulit, 22, 18, 3, 2)
      p(EMAS, 21, 17, 5, 1)
      garis(BAJA_T, 26, 6, 14, 24, 2)
      garis('rgba(255,255,255,0.45)', 29, 10, 18, 28, 1)
    } else {
      k(BAJA_G, 21, 17, 3, 5)
      p(kulit, 21, 21, 3, 2)
      p(EMAS, 19, 21, 5, 1)
      garis(BAJA_T, 20, 22, 8, 30, 2)
    }
  }

  if (arah === 'samping') {
    const d = langkah === 1 ? 2 : langkah === 2 ? -2 : 0
    k(CELANA, 12 - d, 23, 4, 5)
    k(SEPATU, 11 - d, 28, 6, 3)
    k(CELANA, 16 + d, 23, 4, 5)
    k(SEPATU, 16 + d, 28, 6, 3)
    if (!menyerang && !ops.tombak) k(SARUNG, 10, 21 + by, 3, 8)
    if (gaya === 1) k(rambut, 10, 8 + by, 3, 10)
    k(BAJA, 12, 15 + by, 8, 8)
    k(baju, 16, 15 + by, 4, 10)
    p(SABUK, 12, 21 + by, 8, 2)
    p(EMAS, 17, 21 + by, 2, 2)
    k(kulit, 12, 7 + by, 8, 7)
    k(BAJA, 11, 3 + by, 10, 6)
    k(BAJA_G, 11, 8 + by, 3, 6)
    p(mata, 17, 10 + by, 1, 2)
    p(terang(kulit, 0.15), 20, 11 + by, 1, 2)
    p('#a8574a', 17, 13 + by, 2, 1)
    if (gaya === 0 || gaya === 2) p(rambut, 14, 8 + by, 3, 1)
    jambul(14)
    if (!menyerang) {
      k(BAJA_G, 14 + ay, 18 + by, 4, 5)
      p(kulit, 14 + ay, 23 + by, 4, 2)
    }
    k(BAJA_T, 13, 15 + by, 5, 4)
    if (menyerang) {
      if (serang === 0) {
        k(BAJA_G, 16, 12, 4, 5)
        p(kulit, 17, 10, 3, 2)
        p(EMAS, 16, 9, 6, 1)
        garis(BAJA_T, 19, 9, 24, 0, 2)
      } else if (serang === 1) {
        k(BAJA_G, 16, 15, 4, 4)
        p(kulit, 19, 17, 3, 2)
        p(EMAS, 21, 15, 1, 5)
        garis(BAJA_T, 20, 17, 31, 17, 2)
        garis('rgba(255,255,255,0.45)', 19, 12, 31, 22, 1)
      } else {
        k(BAJA_G, 16, 17, 4, 4)
        p(kulit, 19, 21, 3, 2)
        garis(BAJA_T, 21, 22, 30, 28, 2)
      }
    }
    return
  }

  // Menghadap depan atau belakang
  const kiri = langkah === 1 ? 2 : 0
  const kanan = langkah === 2 ? 2 : 0
  k(CELANA, 11, 23, 4, 5 - kiri)
  k(SEPATU, 10, 28 - kiri, 5, 3)
  k(CELANA, 17, 23, 4, 5 - kanan)
  k(SEPATU, 17, 28 - kanan, 5, 3)

  if (arah === 'bawah') {
    if (gaya === 1) {
      k(rambut, 9, 8 + by, 3, 10)
      k(rambut, 20, 8 + by, 3, 10)
    }
    if (!menyerang && !ops.tombak) {
      k(SARUNG, 6, 20 + by, 2, 9)
      p(EMAS, 5, 19 + by, 4, 1)
    }
    k(BAJA, 11, 15 + by, 10, 8)
    k(baju, 14, 15 + by, 4, 10)
    p(terang(baju, 0.35), 15, 17 + by, 2, 5)
    p(SABUK, 11, 21 + by, 10, 2)
    p(EMAS, 15, 21 + by, 2, 2)
  } else {
    k(BAJA_G, 11, 15 + by, 10, 8)
    k(baju, 11, 15 + by, 10, 12)
    p(gelap(baju, 0.25), 15, 17 + by, 2, 8)
    if (!menyerang && !ops.tombak) {
      garis(SARUNG, 13, 26 + by, 20, 14 + by, 2)
      p(EMAS, 19, 12 + by, 3, 2)
    }
  }
  k(BAJA_G, 8, 18 + by + ay, 3, 5)
  p(kulit, 8, 23 + by + ay, 3, 2)
  if (!menyerang) {
    k(BAJA_G, 21, 18 + by - ay, 3, 5)
    p(kulit, 21, 23 + by - ay, 3, 2)
  }
  k(BAJA_T, 8, 15 + by, 4, 4)
  k(BAJA_T, 20, 15 + by, 4, 4)

  if (arah === 'bawah') {
    k(kulit, 11, 7 + by, 10, 7)
    k(BAJA, 10, 3 + by, 12, 6)
    k(BAJA_G, 10, 8 + by, 2, 6)
    k(BAJA_G, 20, 8 + by, 2, 6)
    k(BAJA_T, 15, 8 + by, 2, 4)
    p(mata, 13, 10 + by, 1, 2)
    p(mata, 18, 10 + by, 1, 2)
    p('#a8574a', 15, 13 + by, 2, 1)
    if (gaya !== 3) {
      p(rambut, 12, 8 + by, 3, 1)
      p(rambut, 17, 8 + by, 3, 1)
    }
  } else {
    k(BAJA, 10, 3 + by, 12, 11)
    k(BAJA_G, 10, 11 + by, 12, 3)
    if (gaya === 1) k(rambut, 11, 12 + by, 10, 8)
    else if (gaya === 0 || gaya === 2) p(rambut, 11, 12 + by, 10, 2)
  }
  jambul(16)
  if (ops.tombak && !menyerang) {
    k('#8b5a2b', 24, 5, 2, 25)
    p(BAJA_T, 23, 1, 4, 5)
    p('#c0392b', 26, 6, 3, 3)
  }
  if (menyerang) tebasLurus(serang)
}

function penyihir(c, arah, langkah, baju, serang, rupa, ops) {
  const { p, k, garis } = c
  const { kulit, rambut, gaya } = rupa
  const SEPATU = '#3a2616'
  const topi = ops.tudung ? gelap(baju, 0.15) : gelap(baju, 0.3)
  const mata = '#2a1f1a'
  const menyerang = serang !== null
  const by = !menyerang && langkah !== 0 ? -1 : 0
  const ay = langkah === 1 ? 1 : langkah === 2 ? -1 : 0
  const goyang = langkah === 1 ? 1 : langkah === 2 ? -1 : 0
  c.elips('rgba(0,0,0,0.28)', 16, 30, 9, 2)

  const tongkat = (x) => {
    k('#6b4423', x, 9 + by, 2, 20)
    k('#6fe4f0', x - 2, 5 + by, 6, 6)
    p('#ffffff', x - 1, 6 + by, 2, 2)
  }
  const sihir = (t, x, y) => {
    if (t === 0) {
      k('#6b4423', x, y - 12, 2, 18)
      k('#6fe4f0', x - 2, y - 17, 6, 6)
      p('#ffffff', x - 1, y - 16, 2, 2)
    } else if (t === 1) {
      garis('#6b4423', x, y, x + 5, y - 6, 2)
      p('rgba(111,228,240,0.4)', x - 4, y - 16, 16, 16)
      k('#6fe4f0', x + 1, y - 12, 6, 6)
      p('#ffffff', x + 3, y - 10, 2, 2)
    } else {
      garis('#6b4423', x, y, x + 4, y - 5, 2)
      p('rgba(111,228,240,0.25)', x - 2, y - 13, 12, 12)
      p('#6fe4f0', x + 2, y - 10, 3, 3)
    }
  }
  const topiKerucut = (x0, lebar) => {
    k(topi, x0, 7 + by, lebar, 3)
    k(topi, 11, 4 + by, 10, 4)
    k(topi, 13, 1 + by, 6, 4)
    p(topi, 14, 0 + by, 3, 2)
    p('#f2c94c', 11, 7 + by, 10, 1)
    p('#ffe066', 15, 5 + by, 2, 2)
  }

  if (arah === 'samping') {
    p(SEPATU, 12 - goyang * 2, 28, 5, 3)
    p(SEPATU, 16 + goyang * 2, 28, 5, 3)
    k(baju, 11, 15 + by, 9, 9)
    k(baju, 10, 23, 11, 6)
    p(gelap(baju, 0.3), 10, 28, 11, 1)
    p('#d4af37', 11, 20 + by, 9, 2)
    if (gaya === 1) k(rambut, 10, 9 + by, 3, 11)
    if (ops.tudung) k(topi, 10, 4 + by, 11, 13)
    k(kulit, 12, 8 + by, 8, 7)
    p(mata, 17, 11 + by, 1, 2)
    p(terang(kulit, 0.15), 20, 12 + by, 1, 2)
    p('#a8574a', 17, 14 + by, 2, 1)
    if (ops.janggut) k('#e8e8e8', 14, 13 + by, 6, 6)
    if (gaya === 0 || gaya === 2) k(rambut, 11, 8 + by, 3, 4)
    if (!ops.tudung) topiKerucut(9, 14)
    if (!menyerang) {
      k(baju, 13 + ay, 16 + by, 4, 7)
      p(kulit, 14 + ay, 23 + by, 2, 2)
    }
    if (!ops.tanpaTongkat) {
      if (menyerang) sihir(serang, 20, 21)
      else tongkat(20)
    }
    if (ops.keranjang) {
      k('#a9763d', 8, 21 + by, 6, 5)
      p('#7fb34a', 9, 20 + by, 4, 2)
    }
    return
  }

  const depan = arah === 'bawah'
  p(SEPATU, 11 + goyang, 28, 4, 3)
  p(SEPATU, 17 - goyang, 28, 4, 3)
  k(baju, 10, 15 + by, 12, 9)
  k(baju, 9, 23, 14, 6)
  p(gelap(baju, 0.3), 9, 28, 14, 1)
  p(terang(baju, 0.25), 15, 24, 2, 4)
  p('#d4af37', 11, 20 + by, 10, 2)
  if (depan) k(terang(baju, 0.3), 13, 15 + by, 6, 2)
  k(baju, 7, 16 + by + ay, 4, 7)
  p(terang(baju, 0.4), 7, 22 + by + ay, 4, 1)
  p(kulit, 8, 23 + by + ay, 2, 2)
  if (!menyerang) {
    k(baju, 21, 16 + by - ay, 4, 7)
    p(terang(baju, 0.4), 21, 22 + by - ay, 4, 1)
    p(kulit, 22, 23 + by - ay, 2, 2)
  }
  if (ops.tudung) k(topi, 9, 4 + by, 14, 13)
  if (depan) {
    k(kulit, 12, 8 + by, 8, 7)
    p(mata, 13, 11 + by, 1, 2)
    p(mata, 18, 11 + by, 1, 2)
    p('#a8574a', 15, 14 + by, 2, 1)
    if (ops.janggut) k('#e8e8e8', 12, 13 + by, 8, 6)
    if (gaya === 1) {
      k(rambut, 9, 9 + by, 2, 11)
      k(rambut, 21, 9 + by, 2, 11)
    } else if (gaya === 0) {
      k(rambut, 10, 9 + by, 1, 4)
      k(rambut, 21, 9 + by, 1, 4)
    } else if (gaya === 2) {
      p(rambut, 9, 8 + by, 2, 4)
      p(rambut, 21, 8 + by, 2, 4)
    }
    if (gaya !== 3) p(rambut, 12, 8 + by, 8, 1)
  } else {
    k(gaya === 3 ? kulit : rambut, 11, 8 + by, 10, 7)
    if (gaya === 1) k(rambut, 10, 9 + by, 12, 12)
  }
  if (!ops.tudung) topiKerucut(8, 16)
  if (!ops.tanpaTongkat) {
    if (menyerang) sihir(serang, 24, 21)
    else tongkat(25)
  }
  if (ops.keranjang) {
    k('#a9763d', 3, 21 + by, 6, 5)
    p('#7fb34a', 4, 20 + by, 4, 2)
    p('#d33333', 6, 20 + by)
  }
}

// kelas: 'ksatria' | 'penyihir'. rupa: { kulit, rambut, gaya } (warna hex). langkah: 0..2. serang: null atau 0..2.
export function gambarKelas(kelas, arah, langkah, baju, serang = null, rupa = null, ops = {}) {
  const r = rupa ?? { kulit: '#e0b48a', rambut: '#3b2a1a', gaya: 3 }
  const c = baru(32, 32)
  if (kelas === 'penyihir') penyihir(c, arah, langkah, baju, serang, r, ops)
  else ksatria(c, arah, langkah, baju, serang, r, ops)
  return perhalus(c.kanvas)
}

export function gambarNPC2(jenis) {
  let asal
  if (jenis === 'kapten') {
    asal = gambarKelas('ksatria', 'bawah', 0, '#8a1f1f', null, { kulit: '#e0b48a', rambut: '#5a4636', gaya: 0 }, { tombak: true })
  } else if (jenis === 'herbalis') {
    asal = gambarKelas('penyihir', 'bawah', 0, '#3f8f4e', null, { kulit: '#e0b48a', rambut: '#7a4a1e', gaya: 1 }, {
      tudung: true, tanpaTongkat: true, keranjang: true,
    })
  } else {
    asal = gambarKelas('penyihir', 'bawah', 0, '#6a3fa0', null, { kulit: '#e0b48a', rambut: '#e8e8e8', gaya: 1 }, { janggut: true })
  }
  const c = baru(32, 36)
  c.ctx.drawImage(asal, 0, 4)
  return c.kanvas
}

// ---------- Cahaya dan suasana siang-malam ----------
export function gambarCahaya(ukuran = 128) {
  const kanvas = document.createElement('canvas')
  kanvas.width = ukuran
  kanvas.height = ukuran
  const ctx = kanvas.getContext('2d')
  const g = ctx.createRadialGradient(ukuran / 2, ukuran / 2, 0, ukuran / 2, ukuran / 2, ukuran / 2)
  g.addColorStop(0, 'rgba(255,220,150,1)')
  g.addColorStop(0.35, 'rgba(255,180,90,0.55)')
  g.addColorStop(1, 'rgba(255,150,60,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, ukuran, ukuran)
  return kanvas
}

// Warna pengali layar menurut jam (0..24): malam biru, subuh merah muda, siang normal, senja oranye
const KUNCI_WAKTU = [
  [0, [78, 92, 150]],
  [4.5, [78, 92, 150]],
  [5.5, [214, 160, 170]],
  [6.5, [255, 236, 214]],
  [8, [255, 255, 255]],
  [16.5, [255, 255, 255]],
  [17.5, [255, 206, 160]],
  [18.5, [150, 120, 160]],
  [19.5, [78, 92, 150]],
  [24, [78, 92, 150]],
]
const CERAH_MALAM = (0.299 * 78 + 0.587 * 92 + 0.114 * 150) / 255

export function suasana(jam) {
  let a = KUNCI_WAKTU[0]
  let b = KUNCI_WAKTU[1]
  for (let i = 0; i < KUNCI_WAKTU.length - 1; i += 1) {
    if (jam >= KUNCI_WAKTU[i][0] && jam <= KUNCI_WAKTU[i + 1][0]) {
      a = KUNCI_WAKTU[i]
      b = KUNCI_WAKTU[i + 1]
      break
    }
  }
  const f = (jam - a[0]) / (b[0] - a[0] || 1)
  const warna = a[1].map((v, i) => Math.round(v + (b[1][i] - v) * f))
  const cerah = (0.299 * warna[0] + 0.587 * warna[1] + 0.114 * warna[2]) / 255
  const malam = Math.min(1, Math.max(0, (1 - cerah) / (1 - CERAH_MALAM)))
  return { hex: (warna[0] << 16) | (warna[1] << 8) | warna[2], malam }
}

// ---------- Wajah untuk kotak dialog (96x96) ----------
export const WAJAH = {
  kapten: {
    kulit: '#d9a577', rambut: '#5a4636', gaya: 'pendek', mata: '#5b6a7a', baju: '#7a2222',
    topi: 'helm', zirah: true, janggut: '#5a4636', janggutTipis: true, ekspresi: 'tegas',
  },
  herbalis: {
    kulit: '#f0c8a0', rambut: '#7a4a1e', gaya: 'kepang', mata: '#4f8a5a', baju: '#3f8f4e',
    tudung: '#2f6b3a', ekspresi: 'senyum',
  },
  guru: {
    kulit: '#ecc9a4', rambut: '#e8e8e8', gaya: 'panjang', mata: '#6a8ac0', baju: '#6a3fa0',
    topi: 'kerucut', janggut: '#e8e8e8', janggutPanjang: true, ekspresi: 'senyum',
  },
  pandai: {
    kulit: '#c68e5d', rambut: '#2a1f1a', gaya: 'botak', mata: '#3a2a1a', baju: '#6b4423',
    topi: 'bandana', janggut: '#2a1f1a', jelaga: true, ekspresi: 'senyum',
  },
}

export function gambarWajah(o) {
  const c = baru(96, 96)
  const { p, garis, elips } = c
  const kulit = o.kulit ?? '#e0b48a'
  const baju = o.baju ?? '#2e5fa3'
  const rambut = o.rambut ?? '#3b2a1a'
  const dalam = (x, y, cx, cy, rx, ry) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1
  // Elips berbayang: tepi kiri-atas terang, tepi kanan-bawah gelap
  const bulat = (warna, cx, cy, rx, ry, yMin = -1000) => {
    for (let y = Math.max(yMin, Math.floor(cy - ry)); y <= Math.ceil(cy + ry); y += 1) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x += 1) {
        if (!dalam(x, y, cx, cy, rx, ry)) continue
        let w = warna
        if (!dalam(x, y, cx - 3, cy - 3, rx, ry)) w = gelap(warna, 0.2)
        else if (!dalam(x, y, cx + 3, cy + 3, rx, ry)) w = terang(warna, 0.14)
        p(w, x, y)
      }
    }
  }

  // 1) rambut belakang atau bagian belakang tudung
  if (o.gaya === 'panjang' || o.gaya === 'kepang') bulat(rambut, 48, 56, 31, 38)
  if (o.tudung) bulat(o.tudung, 48, 46, 34, 40)

  // 2) baju dan bahu
  for (let y = 74; y < 96; y += 1) {
    const hw = Math.min(46, 22 + (y - 74) * 1.7)
    p(baju, 48 - hw, y, hw * 2, 1)
    p(gelap(baju, 0.22), 48, y, hw, 1)
  }
  if (o.zirah) {
    bulat('#aab3bf', 20, 86, 12, 8)
    bulat('#aab3bf', 76, 86, 12, 8)
    p('#c0392b', 44, 78, 8, 18)
  }

  // 3) leher
  p(gelap(kulit, 0.1), 41, 62, 14, 18)
  p(gelap(kulit, 0.3), 41, 62, 14, 3)
  for (let y = 74; y < 84; y += 1) {
    const w = (84 - y) * 0.9
    p(gelap(kulit, 0.08), 48 - w, y, w * 2, 1)
  }

  // 4) telinga dan kepala
  bulat(kulit, 24, 50, 4, 6)
  bulat(kulit, 72, 50, 4, 6)
  bulat(kulit, 48, 46, 24, 28)
  if (o.gaya === 'botak') elips('rgba(255,255,255,0.18)', 40, 28, 8, 5)

  // 5) mata, alis, hidung, pipi
  const mata = (cx, cy, kiri) => {
    elips('#ffffff', cx, cy, 6, 5)
    elips(o.mata ?? '#4f7a9a', cx, cy + 1, 4, 5)
    elips('#1a1410', cx, cy + 1, 2, 3)
    p('#ffffff', cx - 3, cy - 3, 2, 2)
    p('#ffffff', cx + 1, cy + 2)
    p('#2a1f1a', cx - 7, cy - 6, 14, 2)
    p('#2a1f1a', kiri ? cx - 8 : cx + 6, cy - 5, 2, 3)
  }
  mata(36, 50, true)
  mata(60, 50, false)
  const alis = gelap(rambut, 0.1)
  if (o.ekspresi === 'tegas') {
    garis(alis, 28, 39, 42, 43, 2)
    garis(alis, 54, 43, 68, 39, 2)
  } else {
    garis(alis, 28, 42, 42, 40, 2)
    garis(alis, 54, 40, 68, 42, 2)
  }
  p(gelap(kulit, 0.22), 47, 57, 2, 4)
  p(gelap(kulit, 0.32), 45, 61, 6, 1)
  elips('rgba(255,120,120,0.22)', 32, 59, 6, 4)
  elips('rgba(255,120,120,0.22)', 64, 59, 6, 4)
  if (o.jelaga) {
    elips('rgba(30,25,20,0.28)', 30, 56, 5, 3)
    elips('rgba(30,25,20,0.28)', 66, 62, 4, 3)
  }

  // 6) janggut dan mulut
  const janggutPenuh = o.janggut && !o.janggutTipis
  if (janggutPenuh) bulat(o.janggut, 48, o.janggutPanjang ? 70 : 64, 22, o.janggutPanjang ? 26 : 19, 60)
  if (o.janggut && o.janggutTipis) {
    for (let i = 0; i < 90; i += 1) {
      const x = 28 + ((i * 37) % 40)
      const y = 62 + ((i * 17) % 14)
      if (dalam(x, y, 48, 56, 22, 24)) p('rgba(60,45,30,0.55)', x, y)
    }
  }
  const warnaMulut = janggutPenuh ? '#c8786a' : '#a8574a'
  p(warnaMulut, 42, 66, 12, 2)
  if (o.ekspresi === 'senyum') {
    p(warnaMulut, 41, 65)
    p(warnaMulut, 54, 65)
  }

  // 7) rambut depan, jambul, kepang
  const bersih = !o.topi && !o.tudung
  if (bersih && o.gaya && o.gaya !== 'botak') {
    if (o.gaya === 'jabrik') {
      for (const [x, y] of [[30, 14], [40, 8], [50, 6], [60, 9], [68, 15]]) bulat(rambut, x, y, 6, 8)
    }
    for (let y = 6; y < 62; y += 1) {
      for (let x = 14; x < 82; x += 1) {
        if (!dalam(x, y, 48, 32, 27, 23) || dalam(x, y, 48, 58, 21, 27)) continue
        let w = rambut
        if (!dalam(x, y, 45, 29, 27, 23)) w = gelap(rambut, 0.22)
        else if ((x * 3 + y * 5) % 11 === 0) w = terang(rambut, 0.12)
        p(w, x, y)
      }
    }
  }
  if (o.gaya === 'kepang') {
    for (let i = 0; i < 5; i += 1) bulat(rambut, 22 + (i % 2) * 2, 70 + i * 5, 5, 4)
  }

  // 8) penutup kepala
  if (o.topi === 'helm') {
    const baja = '#aab3bf'
    bulat('#c0392b', 48, 8, 6, 12)
    bulat(baja, 48, 22, 28, 17)
    p(gelap(baja, 0.18), 21, 33, 54, 5)
    for (let y = 38; y < 66; y += 1) {
      p(gelap(baja, 0.12), 21, y, 5, 1)
      p(gelap(baja, 0.12), 70, y, 5, 1)
    }
    p(terang(baja, 0.25), 46, 34, 4, 24)
  }
  if (o.topi === 'kerucut') {
    const topi = gelap(baju, 0.25)
    for (let y = 2; y <= 30; y += 1) {
      const t = (y - 2) / 28
      const hw = 4 + 22 * t
      const geser = Math.sin((1 - t) * 1.3) * 7
      p(topi, Math.round(48 + geser - hw), y, Math.round(hw * 2), 1)
      p(gelap(topi, 0.2), Math.round(48 + geser), y, Math.round(hw), 1)
    }
    bulat(gelap(baju, 0.3), 48, 30, 38, 7)
    p('#f2c94c', 26, 27, 44, 3)
    p('#ffe066', 44, 14, 4, 4)
    p('#ffe066', 42, 16, 8, 1)
    p('#ffe066', 46, 12, 1, 8)
  }
  if (o.topi === 'bandana') {
    p('#c0392b', 22, 24, 52, 7)
    p(gelap('#c0392b', 0.2), 22, 29, 52, 2)
    p('#c0392b', 70, 26, 8, 4)
    p('#c0392b', 74, 30, 5, 8)
  }
  if (o.tudung) {
    for (let y = 4; y < 62; y += 1) {
      for (let x = 12; x < 84; x += 1) {
        if (!dalam(x, y, 48, 30, 33, 26) || dalam(x, y, 48, 58, 24, 29)) continue
        p(dalam(x, y, 45, 27, 33, 26) ? o.tudung : gelap(o.tudung, 0.2), x, y)
      }
    }
  }
  return perhalus(c.kanvas)
}

// ---------- Dungeon ----------
export function gambarHantu(f) {
  const c = baru(32, 36)
  const { p, elips } = c
  const naik = f === 1 ? 1 : 0
  elips('rgba(0,0,0,0.2)', 16, 33, 9, 2)
  elips('#cfe0ff', 16, 14 - naik, 10, 11)
  for (let y = 14; y < 30; y += 1) p('#cfe0ff', 6, y - naik, 20, 1)
  for (let y = 10; y < 30; y += 1) p('#aebfe6', 20, y - naik, 6, 1)
  for (let x = 6; x < 26; x += 4) {
    const g = (x / 4 + f) % 2 ? 3 : 0
    p('#cfe0ff', x, 29 - naik, 4, 3 + g)
    p('#aebfe6', x + 2, 29 - naik, 2, 3 + g)
  }
  elips('#2a1f4a', 12, 13 - naik, 2, 3)
  elips('#2a1f4a', 20, 13 - naik, 2, 3)
  p('#c27bff', 12, 13 - naik, 1, 2)
  p('#c27bff', 20, 13 - naik, 1, 2)
  elips('#2a1f4a', 16, 20 - naik, 2, 3)
  p('#cfe0ff', 4, 17 - naik, 3, 6)
  p('#cfe0ff', 25, 17 - naik, 3, 6)
  return c.kanvas
}

export function gambarLich(f) {
  const c = baru(80, 96)
  const { p, k, elips } = c
  const naik = f === 1 ? 2 : 0
  elips('rgba(0,0,0,0.3)', 40, 92, 30, 4)
  for (let y = 40; y < 90; y += 1) {
    const hw = 14 + (y - 40) * 0.55
    p('#3b1f5c', 40 - hw, y, hw * 2, 1)
    p('#2a1442', 40, y, hw, 1)
  }
  for (let x = 12; x < 68; x += 6) p('#2a1442', x, 88, 4, 4)
  p('#d4af37', 28, 62, 24, 3)
  p('#6fe4f0', 38, 61, 4, 5)
  k('#d8d2bd', 30, 42 - naik, 20, 18)
  for (let y = 44; y < 58; y += 4) p('#2a1f3a', 32, y - naik, 16, 1)
  p('#2a1f3a', 39, 42 - naik, 2, 18)
  k('#4b2a75', 14, 38 - naik, 14, 8)
  k('#4b2a75', 52, 38 - naik, 14, 8)
  k('#d8d2bd', 12, 46 - naik, 5, 20)
  k('#d8d2bd', 63, 46 - naik, 5, 20)
  elips('#ece6d2', 40, 26 - naik, 14, 15)
  k('#ece6d2', 30, 32 - naik, 20, 10)
  p('#1a1030', 32, 24 - naik, 6, 6)
  p('#1a1030', 42, 24 - naik, 6, 6)
  p('#c27bff', 34, 26 - naik, 2, 3)
  p('#c27bff', 44, 26 - naik, 2, 3)
  p('#1a1030', 38, 31 - naik, 4, 3)
  for (let x = 32; x < 48; x += 3) p('#1a1030', x, 38 - naik, 1, 4)
  k('#d4af37', 28, 12 - naik, 24, 6)
  for (const x of [28, 34, 40, 46]) p('#d4af37', x, 6 - naik, 4, 7)
  p('#c27bff', 39, 8 - naik, 3, 3)
  k('#4a2f18', 68, 20, 4, 70)
  elips('#8a3fd0', 70, 14 - naik, 7, 7)
  elips('#c27bff', 70, 13 - naik, 4, 4)
  p('#ffffff', 68, 11 - naik, 2, 2)
  return c.kanvas
}

export function gambarPeti(buka) {
  const c = baru(32, 28)
  const { p, k, elips } = c
  elips('rgba(0,0,0,0.28)', 16, 26, 13, 2)
  k('#6b4423', 3, 12, 26, 13)
  p('#4a2f18', 3, 17, 26, 1)
  k('#d4af37', 3, 12, 26, 3)
  k('#d4af37', 14, 12, 4, 13)
  p('#2a2a2a', 15, 17, 2, 3)
  if (buka) {
    k('#8a5a2b', 3, 4, 26, 6)
    k('#d4af37', 3, 4, 26, 2)
    p('#ffe27a', 5, 10, 22, 2)
    p('#fff2b0', 9, 9, 14, 1)
  } else {
    k('#8a5a2b', 3, 6, 26, 7)
    p('#d4af37', 3, 6, 26, 2)
    p('#d4af37', 14, 6, 4, 7)
  }
  return perhalus(c.kanvas)
}

export function gambarMataAir() {
  const c = baru(40, 44)
  const { p, k, elips } = c
  elips('rgba(0,0,0,0.28)', 20, 41, 17, 3)
  k('#8d9096', 17, 4, 6, 20)
  k('#6f737b', 15, 2, 10, 4)
  elips('#8d9096', 20, 33, 17, 9)
  elips('#6f737b', 20, 33, 14, 7)
  elips('#4aa3d9', 20, 33, 12, 5)
  elips('#8fd6f2', 18, 32, 7, 3)
  p('#ffffff', 14, 31, 2, 1)
  p('#ffffff', 25, 34, 2, 1)
  p('#8fd6f2', 19, 8, 2, 16)
  p('#c8efff', 19, 8, 1, 12)
  return perhalus(c.kanvas)
}

export function gambarPortal(f) {
  const c = baru(40, 56)
  const { p, k, elips } = c
  elips('rgba(0,0,0,0.28)', 20, 53, 16, 3)
  k('#6f737b', 3, 8, 7, 44)
  k('#6f737b', 30, 8, 7, 44)
  k('#8d9096', 1, 4, 38, 8)
  elips(f === 0 ? '#5a2fb0' : '#6f3fd0', 20, 32, 11, 18)
  elips(f === 0 ? '#8a5fe8' : '#a77af5', 20, 32, 8, 14)
  elips(f === 0 ? '#c9b0ff' : '#e0d0ff', 20, 32, 4, 8)
  p('#ffffff', f === 0 ? 18 : 21, f === 0 ? 24 : 38, 2, 2)
  return perhalus(c.kanvas)
}

export function gambarGerbangKripta() {
  const c = baru(96, 88)
  const { p, k, elips } = c
  elips('rgba(0,0,0,0.3)', 48, 84, 44, 4)
  k('#6f737b', 6, 20, 20, 62)
  k('#6f737b', 70, 20, 20, 62)
  k('#8d9096', 2, 10, 92, 14)
  k('#6f737b', 14, 2, 68, 10)
  for (let y = 24; y < 80; y += 8) {
    p('#4f535a', 6, y, 20, 1)
    p('#4f535a', 70, y, 20, 1)
  }
  k('#14101f', 26, 24, 44, 58)
  elips('#5a2fb0', 48, 56, 18, 26)
  elips('#8a5fe8', 48, 56, 13, 21)
  elips('#c9b0ff', 48, 56, 7, 12)
  elips('#ece6d2', 48, 17, 7, 6)
  p('#1a1030', 44, 15, 3, 3)
  p('#1a1030', 50, 15, 3, 3)
  for (let i = 0; i < 4; i += 1) k('#8d9096', 20 + i * 14, 82 - i * 0, 14, 4)
  return perhalus(c.kanvas)
}
// ---------- Ikon item (24x24) ----------
const NAMA_TIER_IKON = ['perunggu', 'perak', 'emas', 'berlian', 'obsidian', 'mitril']
const LOGAM_TIER = ['#c47a3a', '#d6dbe3', '#f2c94c', '#6fe4f0', '#8a63d2', '#4fe0b8']
// Warna [isi, garis] bingkai: biasa, tidak biasa, langka, epik, legendaris
const SLOT = [
  ['#262b45', '#5a6490'],
  ['#1c3a27', '#4fa86a'],
  ['#1c3258', '#4f86d8'],
  ['#35205a', '#9a62e0'],
  ['#54400f', '#f2c94c'],
]

const tierId = (id) => NAMA_TIER_IKON.findIndex((n) => id.endsWith(`_${n}`)) + 1
const rgba = (hex, a) => {
  const [r, g, b] = rgb(hex)
  return `rgba(${r},${g},${b},${a})`
}

function nilaiLangka(item) {
  const id = item.id
  const khusus = {
    ramuan_agung: 3, jantung_lich: 4, permata_kegelapan: 3, serpihan_kripta: 2, bunga_bulan: 2, akar_obat: 1,
  }
  if (khusus[id] !== undefined) return khusus[id]
  const t = tierId(id)
  if (id.startsWith('bijih_')) return [0, 0, 1, 2, 3, 3, 4][t] ?? 0
  if (id.startsWith('beliung_') || id.startsWith('sabit_')) return [0, 1, 1, 2, 2, 3, 4][t] ?? 0
  const a = item.attack ?? 0
  const d = item.defense ?? 0
  if (a >= 40 || d >= 22) return 4
  if (a >= 30 || d >= 16) return 3
  if (a >= 14 || d >= 8) return 2
  if (a >= 3 || d >= 1) return 1
  return 0
}

function slot(c, lk) {
  const [isi, garisW] = SLOT[lk]
  c.p(garisW, 0, 0, 24, 24)
  c.p(isi, 1, 1, 22, 22)
  c.p(gelap(isi, 0.35), 1, 14, 22, 9)
  c.p(terang(isi, 0.12), 1, 1, 22, 2)
  for (const [x, y] of [[0, 0], [23, 0], [0, 23], [23, 23]]) c.ctx.clearRect(x, y, 1, 1)
}

const PEDANG = {
  pedang_latihan: { bilah: '#a67c52', sisi: '#c9a070', pelindung: '#6b4423', gagang: '#4a2f18' },
  pedang_besi: { bilah: '#aab3bf', sisi: '#d3d9e2', pelindung: '#6b4423', gagang: '#4a3a2c' },
  pedang_baja: { bilah: '#c5d0df', sisi: '#eef3fa', pelindung: '#8d9096', gagang: '#3b4150' },
  pedang_ksatria: { bilah: '#dfe6f0', sisi: '#ffffff', pelindung: '#d4af37', gagang: '#8a1f1f' },
  pedang_naga: { bilah: '#e0623a', sisi: '#ffb070', pelindung: '#d4af37', gagang: '#5a1a1a', api: true },
  pedang_bayangan: { bilah: '#3a2a5c', sisi: '#a77af5', pelindung: '#2a1f3a', gagang: '#1b1426', cahaya: '#a77af5' },
  pedang_lich: { bilah: '#5fe0b8', sisi: '#d8fff0', pelindung: '#d8d2bd', gagang: '#2a1f3a', cahaya: '#5fe0b8' },
}

function ikonPedang(c, id) {
  const s = PEDANG[id] ?? PEDANG.pedang_besi
  const { p, garis, elips } = c
  if (s.cahaya) elips(rgba(s.cahaya, 0.3), 14, 10, 9, 9)
  garis(s.bilah, 9, 15, 20, 4, 2)
  garis(s.sisi, 10, 14, 20, 4, 1)
  p(s.sisi, 21, 3)
  if (s.api) {
    p('#ffd36b', 17, 3)
    p('#ff7a1f', 20, 2)
    p('#ff7a1f', 14, 6)
    p('#ffd36b', 21, 6)
  }
  garis(s.pelindung, 6, 14, 10, 18, 2)
  garis(s.gagang, 5, 19, 8, 16, 2)
  p(s.pelindung, 3, 20, 2, 2)
}

const TONGKAT = {
  tongkat_latihan: { orb: null },
  tongkat_perak: { orb: '#d6dbe3' },
  tongkat_kristal: { orb: '#6fb6ff' },
  tongkat_arkana: { orb: '#b070ff', cincin: true },
  tongkat_bintang: { orb: '#ffe066', bintang: true },
  tongkat_bayangan: { orb: '#7a4ac0', cahaya: '#a77af5' },
  tongkat_lich: { orb: '#5fe0b8', cahaya: '#5fe0b8', mata: true },
}

function ikonTongkat(c, id) {
  const s = TONGKAT[id] ?? TONGKAT.tongkat_latihan
  const { p, garis, elips } = c
  const kayu = '#8a5a2b'
  garis(kayu, 5, 20, 15, 10, 2)
  garis(terang(kayu, 0.3), 6, 19, 14, 11, 1)
  if (!s.orb) {
    elips('#a9763d', 17, 8, 3, 3)
    p('#c9a070', 16, 7)
    return
  }
  if (s.cahaya) elips(rgba(s.cahaya, 0.3), 17, 8, 7, 7)
  elips(gelap(s.orb, 0.35), 17, 8, 5, 5)
  elips(s.orb, 17, 8, 4, 4)
  p('#ffffff', 15, 6, 2, 2)
  if (s.cincin) {
    for (const [x, y] of [[11, 8], [23, 8], [17, 2], [17, 14]]) p('#e8d0ff', x, y)
  }
  if (s.bintang) {
    p('#fff2b0', 17, 1)
    p('#fff2b0', 17, 15)
    p('#fff2b0', 10, 8)
    p('#fff2b0', 23, 8)
  }
  if (s.mata) {
    p('#1a1030', 15, 8, 1, 2)
    p('#1a1030', 18, 8, 1, 2)
  }
}

const ARMOR = {
  pakaian_desa: { jenis: 'kain', warna: '#c9b48a' },
  baju_kulit: { jenis: 'kulit', warna: '#8a5a2b' },
  baju_rantai: { jenis: 'rantai', warna: '#8d9aa8' },
  zirah_baja: { jenis: 'pelat', warna: '#aab3bf' },
  zirah_ksatria: { jenis: 'pelat', warna: '#d3d9e2', emas: true, merah: true },
  zirah_bayangan: { jenis: 'pelat', warna: '#3a2a5c', cahaya: '#a77af5' },
  zirah_lich: { jenis: 'pelat', warna: '#d8d2bd', cahaya: '#5fe0b8', duri: true },
}

function ikonArmor(c, id) {
  const s = ARMOR[id] ?? ARMOR.baju_kulit
  const { p, k } = c
  const w = s.warna
  if (s.duri) {
    p(w, 3, 3)
    p(w, 5, 2)
    p(w, 20, 3)
    p(w, 18, 2)
  }
  k(w, 2, 6, 6, 6)
  k(w, 16, 6, 6, 6)
  k(w, 6, 5, 12, 15)
  p(gelap(w, 0.45), 10, 5, 4, 3)
  if (s.jenis === 'kain') {
    p(gelap(w, 0.2), 12, 8, 1, 11)
    p('#6b4423', 6, 14, 12, 2)
  } else if (s.jenis === 'kulit') {
    p('#4a2f18', 8, 6, 2, 13)
    p('#4a2f18', 14, 6, 2, 13)
    p('#d4af37', 8, 12, 2, 1)
    p('#d4af37', 14, 12, 2, 1)
    p('#4a2f18', 6, 15, 12, 2)
  } else if (s.jenis === 'rantai') {
    for (let y = 7; y <= 18; y += 2) {
      for (let x = 7; x <= 16; x += 2) p(gelap(w, 0.3), x + ((y / 2) % 2), y)
    }
    p('#4a3a2c', 6, 15, 12, 2)
  } else {
    p(gelap(w, 0.28), 6, 11, 12, 1)
    p(gelap(w, 0.28), 12, 8, 1, 12)
    p(terang(w, 0.5), 8, 8)
    p(terang(w, 0.5), 15, 8)
    p(terang(w, 0.5), 8, 14)
    p(terang(w, 0.5), 15, 14)
    p(gelap(w, 0.4), 6, 17, 12, 2)
  }
  if (s.emas) {
    p('#d4af37', 6, 5, 12, 1)
    p('#d4af37', 6, 19, 12, 1)
    p('#d4af37', 2, 6, 6, 1)
    p('#d4af37', 16, 6, 6, 1)
  }
  if (s.merah) {
    p('#c0392b', 11, 9, 2, 6)
    p('#c0392b', 9, 11, 6, 2)
  }
  if (s.cahaya) {
    p(s.cahaya, 11, 8, 2, 8)
    p(s.cahaya, 9, 11, 6, 2)
  }
}

function ikonRamuan(c, id) {
  const { p, k, elips } = c
  const agung = id === 'ramuan_agung'
  const cairan = agung ? '#b070ff' : '#e0453a'
  const r = agung ? 7 : 6
  k('#8a5a2b', 10, 2, 4, 3)
  k('#cfe6f5', 10, 5, 4, 4)
  elips('#cfe6f5', 12, 15, r, r)
  for (let y = 12; y <= 15 + r; y += 1) {
    for (let x = 12 - r; x <= 12 + r; x += 1) {
      if (((x - 12) / (r - 1)) ** 2 + ((y - 15) / (r - 1)) ** 2 <= 1) p(cairan, x, y)
    }
  }
  elips('rgba(255,255,255,0.55)', 9, 13, 1, 2)
  if (agung) {
    p('#f2c94c', 10, 9, 4, 1)
    p('#fff2b0', 18, 7)
    p('#fff2b0', 6, 20)
    p('#fff2b0', 19, 17)
  }
}

function ikonBibit(c, id) {
  const { p, k, elips } = c
  const label = id.includes('wortel') ? '#f08a24' : id.includes('tomat') ? '#d93025' : id.includes('labu') ? '#e0a020' : '#7fb34a'
  elips('#b08a5a', 12, 15, 7, 6)
  elips('#9a7548', 14, 17, 5, 4)
  k('#6b4423', 8, 9, 8, 2)
  p('#b08a5a', 8, 8, 2, 2)
  p('#b08a5a', 14, 8, 2, 2)
  p(label, 10, 14, 4, 3)
  p('#3f8f3f', 12, 4, 1, 4)
  p('#5db65d', 10, 4, 2, 2)
  p('#5db65d', 13, 3, 2, 2)
  p('#e8d9a8', 18, 19)
  p('#e8d9a8', 19, 20)
  p('#e8d9a8', 16, 20)
}

function ikonPanen(c, id) {
  const { p, k, elips } = c
  if (id.includes('wortel')) {
    for (let y = 8; y <= 21; y += 1) {
      const w = Math.max(1, Math.round((8 * (21 - y)) / 13))
      p(y % 4 === 0 ? '#d9731a' : '#f08a24', 12 - Math.floor(w / 2), y, w, 1)
    }
    p('#3f8f3f', 11, 4, 2, 4)
    p('#5db65d', 8, 5, 3, 2)
    p('#5db65d', 13, 5, 3, 2)
  } else if (id.includes('tomat')) {
    elips('#a8261c', 12, 14, 8, 7)
    elips('#d93025', 11, 13, 7, 6)
    p('#ff8a7a', 8, 10, 2, 2)
    p('#3f8f3f', 9, 6, 6, 2)
    p('#3f8f3f', 11, 4, 2, 3)
  } else if (id.includes('labu')) {
    elips('#c27010', 12, 14, 9, 7)
    elips('#e0912a', 11, 13, 8, 6)
    for (const x of [8, 12, 16]) p('#b5600c', x, 8, 1, 12)
    k('#6b8a2a', 11, 4, 3, 4)
  } else {
    k('#c0a060', 6, 8, 12, 12)
    p('#8a6f4a', 6, 13, 12, 2)
  }
}

function ikonTumbuhan(c, id) {
  const { p, k, elips } = c
  if (id.includes('jamur')) {
    k('#f1e6cf', 10, 12, 4, 8)
    elips('#c9684f', 12, 11, 8, 5)
    p('#ffffff', 8, 9, 2, 2)
    p('#ffffff', 13, 8, 2, 2)
    p('#ffffff', 16, 11, 2, 2)
  } else if (id.includes('beri')) {
    elips('#3f8f3f', 12, 14, 8, 6)
    elips('#52a64f', 10, 12, 5, 4)
    for (const [x, y] of [[8, 11], [13, 10], [16, 14], [10, 16], [14, 17]]) {
      elips('#7a3fa8', x, y, 2, 2)
      p('#c58aff', x - 1, y - 1)
    }
  } else if (id.includes('akar')) {
    p('#3f9a3f', 11, 3, 2, 9)
    p('#5db65d', 7, 5, 4, 2)
    p('#5db65d', 13, 6, 4, 2)
    p('#5db65d', 8, 9, 3, 2)
    for (let y = 12; y <= 21; y += 1) p('#d9c08a', 12 - Math.round((21 - y) / 5), y, 1 + Math.round((21 - y) / 3), 1)
  } else {
    p('#3f8f3f', 11, 12, 2, 9)
    p('#3f8f3f', 8, 16, 3, 2)
    for (const [x, y] of [[12, 6], [8, 9], [16, 9], [10, 13], [14, 13]]) elips('#cfe8ff', x, y, 3, 3)
    elips('#ffe066', 12, 10, 2, 2)
    p('#ffffff', 11, 5)
  }
}

function ikonBijih(c, id) {
  const { p, elips } = c
  const w = LOGAM_TIER[(tierId(id) || 1) - 1]
  elips('#6f7278', 12, 15, 8, 6)
  elips('#8d9096', 11, 13, 6, 4)
  p('#a9acb2', 8, 11, 5, 1)
  for (const [x, y] of [[7, 14], [12, 12], [15, 16], [10, 17], [17, 13]]) p(w, x, y, 2, 2)
  p('#ffffff', 8, 14)
  p('#ffffff', 13, 12)
}

function ikonBeliung(c, id) {
  const { p, garis } = c
  const logam = LOGAM_TIER[(tierId(id) || 1) - 1]
  garis('#6b4423', 14, 7, 6, 20, 2)
  garis(gelap(logam, 0.3), 6, 10, 12, 5, 2)
  garis(logam, 6, 9, 12, 4, 2)
  garis(logam, 12, 4, 20, 9, 2)
  garis(terang(logam, 0.45), 7, 8, 12, 3, 1)
  p(terang(logam, 0.6), 19, 8)
}

function ikonSabit(c, id) {
  const { p, garis } = c
  const logam = LOGAM_TIER[(tierId(id) || 1) - 1]
  garis('#6b4423', 5, 20, 12, 12, 2)
  garis(logam, 12, 12, 15, 7, 2)
  garis(logam, 15, 7, 20, 5, 2)
  garis(terang(logam, 0.45), 14, 7, 20, 5, 1)
  garis(gelap(logam, 0.25), 20, 5, 21, 9, 2)
  p(terang(logam, 0.6), 19, 5)
}

function ikonBahan(c, id) {
  const { p, elips } = c
  if (id === 'serpihan_kripta') {
    for (let i = 0; i <= 16; i += 1) {
      const w = Math.round(6 * Math.sin((i / 16) * Math.PI)) + 1
      const x = 9 + Math.round(i * 0.15)
      p('#a77af5', x, 4 + i, w, 1)
      p('#d8c0ff', x, 4 + i, 1, 1)
      p('#6a3fb0', x + w - 1, 4 + i, 1, 1)
    }
  } else if (id === 'permata_kegelapan') {
    elips('#2a1f4a', 12, 13, 8, 7)
    elips('#4a3380', 11, 11, 6, 5)
    p('#6a4fa0', 8, 8, 8, 1)
    p('#8a6fd0', 9, 9, 3, 2)
    p('#1a1030', 12, 14, 6, 3)
    p('#ffffff', 9, 9)
    p('#ffffff', 16, 17)
  } else if (id === 'jantung_lich') {
    elips('rgba(95,224,184,0.35)', 12, 12, 10, 9)
    const jantung = ['.XX..XX.', 'XXXXXXXX', 'XXXXXXXX', '.XXXXXX.', '..XXXX..', '...XX...']
    jantung.forEach((baris, j) => {
      for (let i = 0; i < baris.length; i += 1) {
        if (baris[i] === 'X') p(j < 2 ? '#d94a3d' : '#a8261c', 4 + i * 2, 6 + j * 2, 2, 2)
      }
    })
    p('#ffb0a0', 6, 8, 2, 2)
    p('#5fe0b8', 17, 7)
    p('#5fe0b8', 5, 18)
  } else {
    elips('#8a6f4a', 12, 13, 7, 6)
  }
}

function ikonUmum(c) {
  c.k('#8a6f4a', 5, 8, 14, 11)
  c.p('#d4af37', 11, 12, 2, 3)
}

// item: baris katalog (id, kategori, kelas, attack, defense). Mengembalikan kanvas 24x24 dengan bingkai kelangkaan.
export function gambarIkon(item) {
  const seni = baru(24, 24)
  const id = item.id
  const kat = item.kategori
  if (kat === 'senjata') (item.kelas === 'penyihir' || id.startsWith('tongkat') ? ikonTongkat : ikonPedang)(seni, id)
  else if (kat === 'armor') ikonArmor(seni, id)
  else if (kat === 'ramuan') ikonRamuan(seni, id)
  else if (kat === 'bibit') ikonBibit(seni, id)
  else if (kat === 'panen') ikonPanen(seni, id)
  else if (kat === 'tumbuhan') ikonTumbuhan(seni, id)
  else if (kat === 'ore') ikonBijih(seni, id)
  else if (kat === 'alat') (id.startsWith('sabit') ? ikonSabit : ikonBeliung)(seni, id)
  else if (kat === 'bahan') ikonBahan(seni, id)
  else ikonUmum(seni)
  perhalus(seni.kanvas)
  const hasil = baru(24, 24)
  slot(hasil, nilaiLangka(item))
  hasil.ctx.drawImage(seni.kanvas, 0, 0)
  return hasil.kanvas
}

// Untuk tampilan HTML (kartu hadiah di chat)
const URL_IKON = new Map()
export function ikonUrl(item) {
  if (!URL_IKON.has(item.id)) URL_IKON.set(item.id, gambarIkon(item).toDataURL())
  return URL_IKON.get(item.id)
}

// ---------- Ikon skill (24x24, dengan bingkai warna role) ----------
const AKSEN_SKILL = { ksatria: '#6f86b8', penyihir: '#9a62e0' }
const SKILL_KSATRIA = ['tebasan_kuat', 'perisai_baja', 'hentakan_bumi', 'amukan_naga']

export function gambarIkonSkill(id) {
  const c = baru(24, 24)
  const { p, k, garis, elips } = c
  p(AKSEN_SKILL[SKILL_KSATRIA.includes(id) ? 'ksatria' : 'penyihir'], 0, 0, 24, 24)
  p('#1a1830', 1, 1, 22, 22)
  p('#262244', 1, 12, 22, 11)

  if (id === 'tebasan_kuat') {
    garis('rgba(224,69,58,0.7)', 3, 8, 15, 21, 2)
    garis('#e8eef8', 6, 18, 18, 6, 2)
    garis('#ffffff', 7, 17, 18, 6, 1)
    garis('#d4af37', 5, 13, 10, 18, 2)
    garis('#6b4423', 4, 19, 7, 16, 2)
  } else if (id === 'perisai_baja') {
    for (let y = 4; y <= 20; y += 1) {
      const hw = y < 13 ? 7 : Math.max(1, 7 - (y - 13))
      p('#aab3bf', 12 - hw, y, hw * 2, 1)
      p('#737d8b', 12, y, hw, 1)
    }
    p('#d3d9e2', 5, 4, 14, 1)
    p('#c0392b', 11, 6, 2, 11)
    p('#c0392b', 8, 9, 8, 2)
  } else if (id === 'hentakan_bumi') {
    elips('#c9b38c', 12, 19, 9, 3)
    garis('#2a1f10', 12, 19, 5, 13, 1)
    garis('#2a1f10', 12, 19, 19, 13, 1)
    garis('#2a1f10', 12, 19, 12, 12, 1)
    k('#d9a577', 9, 4, 6, 8)
    p('#8a5a2b', 9, 10, 6, 2)
    p('#fff2b0', 4, 14)
    p('#fff2b0', 19, 14)
    p('#fff2b0', 12, 14)
  } else if (id === 'amukan_naga') {
    elips('#e0453a', 12, 13, 7, 8)
    elips('#ff9a2e', 12, 14, 5, 6)
    elips('#ffe27a', 12, 15, 3, 4)
    p('#8a1f1f', 7, 4, 2, 5)
    p('#8a1f1f', 15, 4, 2, 5)
    p('#ffffff', 9, 11, 2, 1)
    p('#ffffff', 13, 11, 2, 1)
    p('#1a1010', 9, 12)
    p('#1a1010', 14, 12)
  } else if (id === 'bola_api') {
    garis('#ff7a1f', 3, 20, 10, 13, 3)
    garis('#ffb02e', 5, 19, 11, 14, 1)
    elips('#e0453a', 15, 9, 6, 6)
    elips('#ff9a2e', 14, 9, 4, 4)
    elips('#ffe27a', 13, 8, 2, 2)
  } else if (id === 'pulih_cahaya') {
    elips('rgba(156,232,156,0.35)', 12, 12, 9, 9)
    k('#9ce89c', 10, 5, 4, 14)
    k('#9ce89c', 5, 10, 14, 4)
    p('#ffffff', 11, 11, 2, 2)
    p('#d8ffd8', 4, 5)
    p('#d8ffd8', 19, 18)
  } else if (id === 'ledakan_arkana') {
    elips('rgba(176,112,255,0.4)', 12, 12, 9, 9)
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
      garis('#d0a0ff', 12, 12, 12 + dx * 8, 12 + dy * 8, 1)
    }
    elips('#ffffff', 12, 12, 3, 3)
    elips('#b070ff', 12, 12, 2, 2)
  } else {
    // badai_petir
    elips('#6a6f8a', 8, 7, 5, 3)
    elips('#8a8fa8', 14, 6, 5, 3)
    elips('#6a6f8a', 18, 8, 4, 2)
    garis('#ffe27a', 14, 9, 9, 14, 2)
    garis('#ffe27a', 9, 14, 15, 14, 2)
    garis('#ffe27a', 15, 14, 10, 21, 2)
    p('#ffffff', 13, 10)
  }
  return c.kanvas
}

const URL_SKILL = new Map()
export function ikonSkillUrl(id) {
  if (!URL_SKILL.has(id)) URL_SKILL.set(id, gambarIkonSkill(id).toDataURL())
  return URL_SKILL.get(id)
}