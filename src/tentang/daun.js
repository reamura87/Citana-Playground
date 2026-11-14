// Generator geometri pepatraan (daun, sulur, bunga) bergaya lukisan Kamasan.
// Semua bentuk digabung ke satu BufferGeometry sehingga satu lapisan hanya butuh satu draw call.

export function acak(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Jenis bentuk: 0 daun, 1 sulur, 2 cakram (pusat bunga)
export class Kumpulan {
  constructor() {
    this.pos = []
    this.nor = []
    this.uv = []
    this.info = []
    this.idx = []
    this.n = 0
  }

  titik(p, n, uv, info) {
    this.pos.push(p[0], p[1], p[2])
    this.nor.push(n[0], n[1], n[2])
    this.uv.push(uv[0], uv[1])
    this.info.push(info[0], info[1], info[2], info[3])
    return this.n++
  }

  larik() {
    return {
      pos: new Float32Array(this.pos),
      nor: new Float32Array(this.nor),
      uv: new Float32Array(this.uv),
      info: new Float32Array(this.info),
      idx: this.n > 65535 ? new Uint32Array(this.idx) : new Uint16Array(this.idx),
    }
  }
}

const norm = (v) => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1
  return [v[0] / l, v[1] / l, v[2] / l]
}
const silang = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]

// Satu helai daun: tulang daun melengkung, tepi melipat membentuk huruf V, ujung runcing.
export function daun(K, o) {
  const { x, y, z, sudut, panjang, lebar, lengkung = 0.8, lipat = 0.28, tekuk = 0, pal = 0, seed = 0, goyang = 1, seg = 12 } = o
  const langkah = panjang / seg
  let px = x
  let py = y
  let a = sudut
  const baris = []
  for (let i = 0; i <= seg; i += 1) {
    const t = i / seg
    a = sudut + lengkung * t ** 1.6
    if (i > 0) {
      px += Math.cos(a) * langkah
      py += Math.sin(a) * langkah
    }
    const w = lebar * Math.sin(Math.PI * t ** 0.72) ** 0.85
    baris.push({ px, py, zc: z + tekuk * Math.sin(t * Math.PI * 0.85), a, w, t, dz: (tekuk * Math.cos(t * Math.PI * 0.85) * Math.PI * 0.85) / panjang })
  }
  const awal = K.n
  for (const r of baris) {
    const nx = -Math.sin(r.a)
    const ny = Math.cos(r.a)
    const T = norm([Math.cos(r.a), Math.sin(r.a), r.dz])
    const BL = norm([nx, ny, -lipat])
    const BR = norm([-nx, -ny, -lipat])
    let nL = norm(silang(T, BL))
    let nR = norm(silang(BR, T))
    if (nL[2] < 0) nL = nL.map((c) => -c)
    if (nR[2] < 0) nR = nR.map((c) => -c)
    const nM = norm([nL[0] + nR[0], nL[1] + nR[1], nL[2] + nR[2]])
    const info = [0, pal, seed, goyang]
    K.titik([r.px + nx * r.w, r.py + ny * r.w, r.zc - lipat * r.w], nL, [r.t, -1], info)
    K.titik([r.px, r.py, r.zc], nM, [r.t, 0], info)
    K.titik([r.px - nx * r.w, r.py - ny * r.w, r.zc - lipat * r.w], nR, [r.t, 1], info)
  }
  for (let i = 0; i < seg; i += 1) {
    const b = awal + i * 3
    K.idx.push(b, b + 3, b + 1, b + 1, b + 3, b + 4, b + 1, b + 4, b + 2, b + 2, b + 4, b + 5)
  }
}

// Pita sulur mengikuti sederet titik; lebarnya menyempit menuju ujung spiral.
export function pitaSulur(K, titik, o) {
  const { lebarAwal, lebarAkhir, pal = 7, seed = 0, goyang = 0.15, lipat = 0.2 } = o
  const n = titik.length
  const awal = K.n
  for (let i = 0; i < n; i += 1) {
    const p = titik[i]
    const q = titik[Math.min(n - 1, i + 1)]
    const r = titik[Math.max(0, i - 1)]
    const a = Math.atan2(q.y - r.y, q.x - r.x)
    const t = i / (n - 1)
    const w = lebarAwal + (lebarAkhir - lebarAwal) * t ** 0.8
    const nx = -Math.sin(a)
    const ny = Math.cos(a)
    const info = [1, pal, seed, goyang]
    const nL = norm([nx * 0.4, ny * 0.4, 1])
    const nR = norm([-nx * 0.4, -ny * 0.4, 1])
    K.titik([p.x + nx * w, p.y + ny * w, p.z - lipat * w], nL, [t, -1], info)
    K.titik([p.x, p.y, p.z], [0, 0, 1], [t, 0], info)
    K.titik([p.x - nx * w, p.y - ny * w, p.z - lipat * w], nR, [t, 1], info)
  }
  for (let i = 0; i < n - 1; i += 1) {
    const b = awal + i * 3
    K.idx.push(b, b + 3, b + 1, b + 1, b + 3, b + 4, b + 1, b + 4, b + 2, b + 2, b + 4, b + 5)
  }
}

// Cakram bercincin (pusat bunga, buah, atau titik hias)
export function cakram(K, x, y, z, r, pal = 6, seed = 0) {
  const pusat = K.titik([x, y, z], [0, 0, 1], [0, 0], [2, pal, seed, 0])
  const N = 20
  for (let i = 0; i <= N; i += 1) {
    const s = (i / N) * Math.PI * 2
    K.titik([x + Math.cos(s) * r, y + Math.sin(s) * r, z], [0, 0, 1], [1, 0], [2, pal, seed, 0])
  }
  for (let i = 0; i < N; i += 1) K.idx.push(pusat, pusat + 1 + i, pusat + 2 + i)
}

// Bunga: kelopak melingkar dan cakram di tengah
export function bunga(K, x, y, z, r, rand, palKelopak = 0, palPusat = 1) {
  const n = 6
  const off = rand() * Math.PI
  for (let i = 0; i < n; i += 1) {
    const s = off + (i / n) * Math.PI * 2
    daun(K, {
      x: x + Math.cos(s) * r * 0.18,
      y: y + Math.sin(s) * r * 0.18,
      z: z + 0.01,
      sudut: s,
      panjang: r,
      lebar: r * 0.36,
      lengkung: 0.25,
      lipat: 0.1,
      pal: palKelopak,
      seed: rand(),
      goyang: 0.4,
      seg: 6,
    })
  }
  cakram(K, x, y, z + 0.05, r * 0.3, palPusat, rand())
}

// Satu sulur: batang bergelombang yang berakhir pada ukel (spiral ke dalam), dengan daun berselang-seling
// dan cabang yang lebih kecil. arahPutar +1 = berbelok ke kiri (berlawanan jarum jam), -1 = ke kanan.
export function sulur(K, rand, o) {
  const {
    x, y, z, sudut, panjang, skala = 1, arahPutar = 1, kedalaman = 0,
    palDaun = [0, 1, 3], palBatang = 7, bungaDiUjung = true,
  } = o
  const nb = 26
  const lg = panjang / nb
  const goyang = (0.25 + rand() * 0.3) * (rand() < 0.5 ? -1 : 1)
  const titik = []
  let px = x
  let py = y
  let a = sudut
  for (let i = 0; i <= nb; i += 1) {
    const t = i / nb
    a = sudut + goyang * Math.sin(t * Math.PI * 1.3) + arahPutar * 0.45 * t * t
    titik.push({ x: px, y: py, z, a })
    px += Math.cos(a) * lg
    py += Math.sin(a) * lg
  }
  let lj = lg * 0.95
  let putar = 0
  for (let k = 0; putar < Math.PI * 2.7 && lj > 0.03; k += 1) {
    const d = 0.15 + 0.035 * k
    a += arahPutar * d
    putar += d
    lj *= 0.935
    px += Math.cos(a) * lj
    py += Math.sin(a) * lj
    titik.push({ x: px, y: py, z, a })
  }
  pitaSulur(K, titik, {
    lebarAwal: 0.125 * skala, lebarAkhir: 0.028 * skala, pal: palBatang, seed: rand(), goyang: 0.2 / (1 + kedalaman),
  })

  // daun berselang-seling sepanjang sulur
  const total = titik.length
  let sisi = rand() < 0.5 ? 1 : -1
  let langkahDaun = 0
  for (let i = 3; i < total; i += 1) {
    const p = titik[i]
    const dalamSpiral = i > nb
    langkahDaun += 1
    if (langkahDaun < 2) continue
    langkahDaun = 0
    const prog = i / total
    const besar = (1 - prog ** 0.85) * 0.85 + 0.15
    const panjangDaun = (0.55 + rand() * 0.25) * skala * (dalamSpiral ? 0.85 : 1.8) * besar * (kedalaman ? 0.8 : 1)
    const buka = 0.95 - 0.35 * prog + (rand() - 0.5) * 0.25
    daun(K, {
      x: p.x,
      y: p.y,
      z: p.z + 0.04 + rand() * 0.08,
      sudut: p.a + sisi * buka,
      panjang: panjangDaun,
      lebar: panjangDaun * (0.2 + rand() * 0.07),
      lengkung: -sisi * (0.7 + rand() * 0.6),
      lipat: 0.2 + rand() * 0.15,
      tekuk: (rand() - 0.5) * 0.4,
      pal: palDaun[Math.floor(rand() * palDaun.length)],
      seed: rand(),
      goyang: 1,
    })
    sisi = -sisi
  }

  // cabang kecil
  if (kedalaman < 1) {
    for (const idx of [7, 12, 18]) {
      if (rand() < 0.2) continue
      const p = titik[idx]
      const s = rand() < 0.5 ? 1 : -1
      sulur(K, rand, {
        x: p.x, y: p.y, z: p.z + 0.02, sudut: p.a + s * (0.9 + rand() * 0.4), panjang: panjang * (0.38 + rand() * 0.12),
        skala: skala * 0.62, arahPutar: s * -1 > 0 ? 1 : -1, kedalaman: kedalaman + 1, palDaun, palBatang, bungaDiUjung: false,
      })
    }
  }
  const ujung = titik[total - 1]
  if (bungaDiUjung) bunga(K, ujung.x, ujung.y, z + 0.12, 0.34 * skala, rand, rand() < 0.5 ? 0 : 4, 1)
  else cakram(K, ujung.x, ujung.y, z + 0.1, 0.07 * skala, 6, rand())
}
