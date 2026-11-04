import { DUNGEON } from './dungeon'
export const DOMAIN_BOS = { x: 1360, y: 340 }

export const POSISI_PETAK = Array.from({ length: 12 }, (_, i) => ({
  x: 560 + (i % 4) * 64,
  y: 240 + Math.floor(i / 4) * 64,
}))

// Rute patroli (loop tertutup). Indeksnya dipakai kolom `rute` di tabel game_spawn.
const RUTE = [
  [[140, 360], [480, 360], [480, 560], [140, 560]],
  [[140, 720], [400, 720], [400, 900], [140, 900]],
  [[260, 560], [500, 680], [260, 800]],
  [[1140, 700], [1480, 700], [1480, 1000], [1140, 1000]],
  [[1200, 780], [1420, 860], [1200, 960]],
  [[540, 280], [640, 280], [640, 500], [540, 500]],
  [[620, 400], [980, 400], [980, 620], [620, 620]],
  [[1080, 470], [1300, 470], [1300, 640], [1080, 640]],
  [[1680, 200], [2060, 200], [2060, 380], [1680, 380]],
  [[1680, 740], [2080, 740], [2080, 1000], [1680, 1000]],
  [[1640, 480], [1800, 480], [1800, 700], [1640, 700]],
]

const PAUSE_DETIK = 4
const cache = new Map()

function bangunRute(rute, kecepatan) {
  const kunci = `${rute}:${kecepatan}`
  if (cache.has(kunci)) return cache.get(kunci)
  const titik = RUTE[rute] ?? RUTE[0]
  const segmen = []
  let total = 0
  for (let i = 0; i < titik.length; i += 1) {
    const a = titik[i]
    const b = titik[(i + 1) % titik.length]
    const durasi = Math.hypot(b[0] - a[0], b[1] - a[1]) / kecepatan
    segmen.push({ a, b, durasi })
    total += durasi + PAUSE_DETIK
  }
  const hasil = { segmen, total }
  cache.set(kunci, hasil)
  return hasil
}

// Posisi musuh pada waktu tertentu. gerak = true saat berjalan, false saat berdiam (idle).
export function posisiPatroli(rute, fase, waktuMs, kecepatan) {
  const { segmen, total } = bangunRute(rute, kecepatan)
  let t = (waktuMs / 1000 + fase * total) % total
  for (const s of segmen) {
    const dx = s.b[0] - s.a[0]
    if (t < s.durasi) {
      const k = t / s.durasi
      return { x: s.a[0] + dx * k, y: s.a[1] + (s.b[1] - s.a[1]) * k, gerak: true, dx }
    }
    t -= s.durasi
    if (t < PAUSE_DETIK) return { x: s.b[0], y: s.b[1], gerak: false, dx }
    t -= PAUSE_DETIK
  }
  const akhir = segmen[segmen.length - 1]
  return { x: akhir.b[0], y: akhir.b[1], gerak: false, dx: 0 }
}

export const PETA = {
  server: {
    nama: 'Kerajaan (dunia bersama)',
    ukuran: { lebar: 2200, tinggi: 1200 },
    kripta: { x: 1990, y: 560 },
    mulai: { x: 800, y: 960 },
    gerbang: { x: 470, y: 1000, ke: 'pribadi', label: 'Ke rumahku' },
    toko: { x: 740, y: 880 },
    papan: { x: 890, y: 940 },
    sumur: { x: 800, y: 1010 },
    kastil: { x: 800, y: 300 },
    gua: { x: 1360, y: 300 },
    
    pondok: [
      { x: 560, y: 900, v: 0 },
      { x: 1040, y: 910, v: 1 },
      { x: 700, y: 1130, v: 0 },
      { x: 910, y: 1130, v: 1 },
    ],
    obor: [{ x: 1280, y: 330 }, { x: 1440, y: 330 }, { x: 1360, y: 430 }],
    label: [
      { x: 800, y: 1075, teks: 'Desa Citana (zona aman)' },
      { x: 800, y: 110, teks: 'Gedung Kesenian Bung Karno' },
      { x: 300, y: 300, teks: 'Berangbang' },
      { x: 800, y: 370, teks: 'Jalan Hasanudin' },
      { x: 1280, y: 680, teks: 'Tegal Badeng' },
      { x: 1360, y: 90, teks: 'Pengambengan' },
      { x: 310, y: 48, teks: 'Tambang Batu' },
      { x: 1900, y: 60, teks: 'Dataran Abu' },
    ],
    hutan: [80, 280, 460, 720],
    padang: [1060, 640, 440, 440],
    reruntuhan: [560, 380, 460, 250],
    air: [{ cx: 250, cy: 1090, rx: 130, ry: 60 }],
    larangan: [
      [760, 300, 80, 560],
      [0, 570, 1600, 60],
      [600, 800, 400, 320],
      [640, 120, 320, 200],
      [1160, 60, 400, 400],
      [1060, 440, 260, 220],
      [830, 350, 540, 260],
      [430, 960, 120, 80],
      [100, 990, 340, 220],
      [60, 60, 520, 210],
      [1600, 0, 600, 1200],
    ],
  },

  dungeon: { ukuran: DUNGEON.ukuran, mulai: DUNGEON.mulai, obor: DUNGEON.obor },

  pribadi: {
    nama: 'Rumah pribadi',
    ukuran: { lebar: 1280, tinggi: 960 },
    mulai: { x: 420, y: 560 },
    rumah: { x: 260, y: 380 },
    sumur: { x: 420, y: 330 },
    gerbang: { x: 640, y: 910, ke: 'server', label: 'Ke kerajaan' },
    air: [{ cx: 1020, cy: 740, rx: 100, ry: 50 }],
    larangan: [
      [150, 200, 230, 210],
      [500, 160, 380, 310],
      [210, 360, 100, 180],
      [210, 460, 500, 100],
      [590, 460, 100, 440],
      [560, 820, 160, 140],
      [880, 660, 280, 160],
    ],
  },
}

function acak(seed) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Titik acak (tetap, berdasarkan seed) yang tidak masuk area terlarang dan tidak berdempetan
export function sebarDekorasi(seed, jumlah, larangan, zona, jarakMin = 70) {
  const rnd = acak(seed)
  const hasil = []
  let percobaan = 0
  while (hasil.length < jumlah && percobaan < jumlah * 40) {
    percobaan += 1
    const x = zona[0] + 40 + rnd() * (zona[2] - 80)
    const y = zona[1] + 60 + rnd() * (zona[3] - 100)
    const terlarang = larangan.some(
      ([lx, ly, lw, lh]) => x > lx - 30 && x < lx + lw + 30 && y > ly - 30 && y < ly + lh + 30,
    )
    const dekat = hasil.some((h) => Math.hypot(h.x - x, h.y - y) < jarakMin)
    if (!terlarang && !dekat) hasil.push({ x: Math.round(x), y: Math.round(y) })
  }
  return hasil
}

// Tanah setiap peta (dibuat sekali lalu dipakai ulang sebagai tekstur)
export function gambarTanah(peta) {
  if (peta === 'dungeon') return gambarTanahDungeon()
  const { lebar, tinggi } = PETA[peta].ukuran
  const kanvas = document.createElement('canvas')
  kanvas.width = lebar
  kanvas.height = tinggi
  const ctx = kanvas.getContext('2d')
  const rnd = acak(peta === 'server' ? 11 : 29)
  const kotak = (warna, x, y, w, h) => {
    ctx.fillStyle = warna
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h))
  }
  const pilih = (daftar) => daftar[Math.floor(rnd() * daftar.length)]

  // Rumput bertekstur
  kotak('#5a9e4b', 0, 0, lebar, tinggi)
  for (let i = 0; i < 9000; i += 1) {
    const r = rnd()
    kotak(r < 0.4 ? '#63a954' : r < 0.7 ? '#4f9042' : '#6db35d', Math.floor((rnd() * lebar) / 2) * 2, Math.floor((rnd() * tinggi) / 2) * 2, 4, 2)
  }
  for (let i = 0; i < 2600; i += 1) {
    const x = Math.floor(rnd() * lebar)
    const y = Math.floor(rnd() * tinggi)
    kotak('#3f7f35', x, y, 1, 3)
    kotak('#7cc56a', x + 1, y + 1, 1, 2)
  }
  for (let i = 0; i < 380; i += 1) {
    const x = Math.floor(rnd() * lebar)
    const y = Math.floor(rnd() * tinggi)
    kotak(pilih(['#f5f0e0', '#f2c94c', '#e87aa6', '#8fb4f5']), x, y, 2, 2)
    kotak('#3f7f35', x, y + 2, 1, 2)
  }

  // Jalan tanah dengan tepi gelap, bagian tengah terang, dan kerikil
  const jalur = (x1, y1, x2, y2, tebal) => {
    const gambar = (warna, lw) => {
      ctx.strokeStyle = warna
      ctx.lineWidth = lw
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
    }
    gambar('#8a7352', tebal + 8)
    gambar('#b8a07a', tebal)
    gambar('#c8b38c', Math.max(4, tebal - 14))
    const panjang = Math.hypot(x2 - x1, y2 - y1)
    for (let i = 0; i < panjang / 4; i += 1) {
      const u = rnd()
      kotak(
        rnd() > 0.5 ? '#9a8660' : '#d8c9a4',
        x1 + (x2 - x1) * u + (rnd() - 0.5) * tebal * 0.8,
        y1 + (y2 - y1) * u + (rnd() - 0.5) * tebal * 0.8,
        2,
        2,
      )
    }
  }

  // Batu kali: tiap batu punya sorotan atas dan bayangan bawah
  const kerikil = (x, y, w, h) => {
    const warna = ['#9a9ea6', '#a9adb5', '#8d9098', '#b3b7be']
    kotak('#6f737b', x, y, w, h)
    for (let yy = y, baris = 0; yy < y + h; yy += 10, baris += 1) {
      let xx = x - (baris % 2) * 9
      while (xx < x + w) {
        const lb = 14 + Math.floor(rnd() * 9)
        const xa = Math.max(xx, x)
        const xb = Math.min(xx + lb, x + w)
        const tb = Math.min(8, y + h - yy - 1)
        if (xb - xa > 3 && tb > 2) {
          kotak(pilih(warna), xa + 1, yy + 1, xb - xa - 2, tb)
          kotak('rgba(255,255,255,0.2)', xa + 1, yy + 1, xb - xa - 2, 1)
          kotak('rgba(0,0,0,0.16)', xa + 1, yy + tb, xb - xa - 2, 1)
        }
        xx += lb
      }
    }
  }

  if (peta === 'server') {
    // Hutan: lantai gelap dengan daun gugur
    kotak('rgba(30,80,40,0.35)', 80, 280, 460, 720)
    for (let i = 0; i < 500; i += 1) {
      kotak(pilih(['#3f6b34', '#7a5a2a', '#2f5a2a']), 80 + rnd() * 456, 280 + rnd() * 716, 3, 2)
    }

    // Padang gandum
    for (let i = 0; i < 19; i += 1) kotak(i % 2 === 0 ? '#b59a4a' : '#a58a3c', 1060, 640 + i * 24, 440, 16)
    for (let i = 0; i < 260; i += 1) kotak('#d4b95a', 1060 + rnd() * 436, 640 + rnd() * 430, 2, 4)

    // Perkemahan orc: tanah injak dengan kerikil
    kotak('#9b8560', 1060, 450, 260, 200)
    for (let i = 0; i < 160; i += 1) kotak(pilih(['#8a7352', '#b3a07c']), 1060 + rnd() * 256, 450 + rnd() * 196, 3, 2)

    // Reruntuhan: lempengan batu berlumut
    for (let i = 0; i < 40; i += 1) {
      const x = 560 + rnd() * 440
      const y = 380 + rnd() * 240
      kotak('#7f8b79', x, y, 28, 20)
      kotak('rgba(255,255,255,0.15)', x, y, 28, 1)
      kotak('#6f8b5f', x + rnd() * 20, y + rnd() * 12, 6, 3)
    }

    // Sarang naga: batu gelap retak
    kotak('#6b6560', 1160, 60, 400, 400)
    for (let i = 0; i < 320; i += 1) kotak(rnd() > 0.5 ? '#7b756f' : '#5a554f', 1160 + rnd() * 392, 60 + rnd() * 392, 8, 8)
    for (let i = 0; i < 26; i += 1) {
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'
      ctx.lineWidth = 1
      ctx.beginPath()
      const x = 1170 + rnd() * 380
      const y = 70 + rnd() * 380
      ctx.moveTo(x, y)
      ctx.lineTo(x + (rnd() - 0.5) * 50, y + (rnd() - 0.5) * 50)
      ctx.stroke()
    }

        // Wilayah timur: Dataran Abu
    kotak('#6f6a5e', 1600, 0, 600, 1200)
    for (let i = 0; i < 2200; i += 1) {
      kotak(pilih(['#7a7468', '#5f5a50', '#857f72']), 1600 + rnd() * 592, rnd() * 1192, 6, 3)
    }
    for (let i = 0; i < 260; i += 1) kotak('#4a463e', 1600 + rnd() * 596, rnd() * 1196, 2, 2)
    for (let i = 0; i < 400; i += 1) kotak(pilih(['#6f6a5e', '#5a9e4b']), 1560 + rnd() * 70, rnd() * 1190, 8, 4)
    ctx.strokeStyle = 'rgba(20,15,10,0.45)'
    ctx.lineWidth = 1
    for (let i = 0; i < 30; i += 1) {
      const x = 1620 + rnd() * 560
      const y = 20 + rnd() * 1160
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x + (rnd() - 0.5) * 70, y + (rnd() - 0.5) * 50)
      ctx.stroke()
    }
    kerikil(1880, 470, 220, 200) // pelataran Gerbang Kripta

    jalur(800, 300, 800, 840, 70)
    jalur(0, 600, 1990, 600, 60)
    jalur(1990, 600, 1990, 560, 50)
    jalur(830, 600, 1000, 520, 50)
    jalur(1000, 520, 1250, 420, 50)
    jalur(1250, 420, 1340, 350, 50)
    jalur(470, 1000, 600, 1000, 50)

    kerikil(600, 800, 400, 300) // plaza desa
    kerikil(720, 300, 160, 44) // pelataran kastil

    // Tambang batu (barat laut)
    kotak('#77716b', 60, 60, 520, 210)
    for (let i = 0; i < 260; i += 1) kotak(rnd() > 0.5 ? '#86807a' : '#5f5a55', 60 + rnd() * 512, 60 + rnd() * 202, 8, 8)
  } else {
    jalur(260, 400, 260, 510, 56)
    jalur(260, 510, 640, 510, 56)
    jalur(640, 510, 640, 900, 56)
    kotak('#6ca95b', 516, 196, 280, 216)
    for (let i = 0; i < 300; i += 1) kotak(rnd() > 0.5 ? '#78b567' : '#5f9a4f', 518 + rnd() * 276, 198 + rnd() * 212, 3, 2)
    ctx.strokeStyle = '#7a4a1e'
    ctx.lineWidth = 6
    ctx.strokeRect(516, 196, 280, 216)
    for (let x = 516; x <= 796; x += 14) {
      kotak('#9a6a3a', x - 2, 190, 4, 12)
      kotak('#9a6a3a', x - 2, 406, 4, 12)
    }
    for (let y = 196; y <= 412; y += 14) {
      kotak('#9a6a3a', 510, y - 2, 12, 4)
      kotak('#9a6a3a', 790, y - 2, 12, 4)
    }
  }

  // Danau: pasir, air dangkal, air dalam, dan kilau
  for (const a of PETA[peta].air ?? []) {
    const elips = (rx, ry, warna) => {
      ctx.fillStyle = warna
      ctx.beginPath()
      ctx.ellipse(a.cx, a.cy, rx, ry, 0, 0, Math.PI * 2)
      ctx.fill()
    }
    elips(a.rx + 40, a.ry + 26, '#d8c690')
    elips(a.rx + 22, a.ry + 12, '#6fc3e6')
    elips(a.rx, a.ry, '#4aa3d9')
    for (let i = 0; i < 26; i += 1) {
      const t = rnd() * Math.PI * 2
      const r = Math.sqrt(rnd())
      kotak('rgba(255,255,255,0.45)', a.cx + Math.cos(t) * a.rx * r * 0.9, a.cy + Math.sin(t) * a.ry * r * 0.9, 6, 1)
    }
  }
  return kanvas
}

function gambarTanahDungeon() {
  const { lebar, tinggi } = DUNGEON.ukuran
  const kanvas = document.createElement('canvas')
  kanvas.width = lebar
  kanvas.height = tinggi
  const ctx = kanvas.getContext('2d')
  const rnd = acak(77)
  const kotak = (warna, x, y, w, h) => {
    ctx.fillStyle = warna
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h))
  }

  kotak('#0b0a12', 0, 0, lebar, tinggi)
  for (let i = 0; i < 1800; i += 1) {
    kotak(rnd() > 0.5 ? '#141220' : '#0f0d18', rnd() * lebar, rnd() * tinggi, 12, 7)
  }
  // Wajah dinding di tepi atas tiap ruangan (digambar dulu supaya lantai menimpanya di sambungan)
  for (const [x, y, w] of DUNGEON.lantai) {
    kotak('#2a2538', x - 4, y - 18, w + 8, 18)
    for (let bx = x - 4; bx < x + w + 4; bx += 16) kotak('#1b1726', bx, y - 18, 1, 18)
    kotak('#1b1726', x - 4, y - 9, w + 8, 1)
    kotak('#3a3450', x - 4, y - 18, w + 8, 2)
  }
  // Lantai batu, retakan, dan tulang
  for (const [x, y, w, h] of DUNGEON.lantai) {
    kotak('#2f2c3d', x, y, w, h)
    for (let yy = y, b = 0; yy < y + h; yy += 24, b += 1) {
      for (let xx = x - (b % 2) * 12; xx < x + w; xx += 24) {
        const xa = Math.max(xx, x)
        const xb = Math.min(xx + 24, x + w)
        kotak(rnd() > 0.5 ? '#403d50' : '#363344', xa + 1, yy + 1, xb - xa - 2, Math.min(22, y + h - yy - 1))
        kotak('rgba(255,255,255,0.05)', xa + 1, yy + 1, xb - xa - 2, 1)
      }
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.4)'
    ctx.lineWidth = 1
    for (let i = 0; i < (w * h) / 6000; i += 1) {
      const cx = x + rnd() * w
      const cy = y + rnd() * h
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + (rnd() - 0.5) * 30, cy + (rnd() - 0.5) * 20)
      ctx.stroke()
    }
    for (let i = 0; i < (w * h) / 9000; i += 1) {
      kotak('#cfc7b0', x + rnd() * w, y + rnd() * h, 5, 2)
      kotak('#cfc7b0', x + rnd() * w, y + rnd() * h, 2, 4)
    }
  }
  // Lingkaran sihir di ruang bos dan di pintu keluar
  const lingkar = (cx, cy, r, warna) => {
    ctx.strokeStyle = warna
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(cx, cy, r - 12, 0, Math.PI * 2)
    ctx.stroke()
    for (let i = 0; i < 5; i += 1) {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2
      const b = ((i + 2) / 5) * Math.PI * 2 - Math.PI / 2
      ctx.beginPath()
      ctx.moveTo(cx + Math.cos(a) * (r - 12), cy + Math.sin(a) * (r - 12))
      ctx.lineTo(cx + Math.cos(b) * (r - 12), cy + Math.sin(b) * (r - 12))
      ctx.stroke()
    }
  }
  lingkar(250, 150, 92, 'rgba(170,90,255,0.55)')
  lingkar(DUNGEON.keluar.x, DUNGEON.keluar.y - 4, 34, 'rgba(110,200,255,0.5)')
  return kanvas
}

export const NAMA_TIER = ['', 'perunggu', 'perak', 'emas', 'berlian', 'obsidian', 'mitril']

export const JENIS_FORAGE = {
  jamur_hutan: { nama: 'Jamur hutan', jenis: 'tumbuhan', tier: 0 },
  beri_liar: { nama: 'Beri liar', jenis: 'tumbuhan', tier: 0 },
  akar_obat: { nama: 'Akar obat', jenis: 'tumbuhan', tier: 0 },
  bunga_bulan: { nama: 'Bunga bulan', jenis: 'tumbuhan', tier: 0 },
  bijih_perunggu: { nama: 'Bijih perunggu', jenis: 'ore', tier: 1 },
  bijih_perak: { nama: 'Bijih perak', jenis: 'ore', tier: 2 },
  bijih_emas: { nama: 'Bijih emas', jenis: 'ore', tier: 3 },
  bijih_berlian: { nama: 'Bijih berlian', jenis: 'ore', tier: 4 },
  bijih_obsidian: { nama: 'Bijih obsidian', jenis: 'ore', tier: 5 },
  bijih_mitril: { nama: 'Bijih mitril', jenis: 'ore', tier: 6 },
}

export const TITIK_FORAGE = [
  // Tumbuhan: Hutan Kelam
  { id: 1, forage: 'jamur_hutan', x: 150, y: 420 },
  { id: 2, forage: 'jamur_hutan', x: 300, y: 380 },
  { id: 3, forage: 'jamur_hutan', x: 220, y: 520 },
  { id: 4, forage: 'jamur_hutan', x: 420, y: 500 },
  { id: 5, forage: 'jamur_hutan', x: 130, y: 720 },
  { id: 6, forage: 'jamur_hutan', x: 350, y: 780 },
  { id: 7, forage: 'beri_liar', x: 250, y: 450 },
  { id: 8, forage: 'beri_liar', x: 460, y: 420 },
  { id: 9, forage: 'beri_liar', x: 120, y: 840 },
  { id: 10, forage: 'beri_liar', x: 400, y: 880 },
  { id: 11, forage: 'beri_liar', x: 200, y: 900 },
  { id: 12, forage: 'beri_liar', x: 500, y: 700 },
  { id: 13, forage: 'akar_obat', x: 330, y: 700 },
  { id: 14, forage: 'akar_obat', x: 160, y: 660 },
  { id: 15, forage: 'akar_obat', x: 450, y: 800 },
  { id: 16, forage: 'akar_obat', x: 260, y: 780 },
  { id: 17, forage: 'bunga_bulan', x: 100, y: 350 },
  { id: 18, forage: 'bunga_bulan', x: 490, y: 860 },
  // Bijih: Tambang Batu (makin ke barat, makin tinggi tier-nya)
  { id: 101, forage: 'bijih_perunggu', x: 520, y: 230 },
  { id: 102, forage: 'bijih_perunggu', x: 480, y: 190 },
  { id: 103, forage: 'bijih_perunggu', x: 520, y: 150 },
  { id: 104, forage: 'bijih_perunggu', x: 470, y: 110 },
  { id: 105, forage: 'bijih_perunggu', x: 430, y: 225 },
  { id: 106, forage: 'bijih_perunggu', x: 430, y: 150 },
  { id: 107, forage: 'bijih_perak', x: 380, y: 100 },
  { id: 108, forage: 'bijih_perak', x: 390, y: 190 },
  { id: 109, forage: 'bijih_perak', x: 340, y: 230 },
  { id: 110, forage: 'bijih_perak', x: 340, y: 140 },
  { id: 111, forage: 'bijih_emas', x: 290, y: 100 },
  { id: 112, forage: 'bijih_emas', x: 280, y: 200 },
  { id: 113, forage: 'bijih_emas', x: 240, y: 150 },
  { id: 114, forage: 'bijih_berlian', x: 190, y: 230 },
  { id: 115, forage: 'bijih_berlian', x: 180, y: 110 },
  { id: 116, forage: 'bijih_obsidian', x: 130, y: 170 },
  { id: 117, forage: 'bijih_obsidian', x: 100, y: 100 },
  { id: 118, forage: 'bijih_mitril', x: 90, y: 235 },
]

// Musuh tidak bisa masuk ke area ini dan pemain tidak bisa menyerang di dalamnya.
// Bentuk: [x, y, lebar, tinggi]
export const ZONA_AMAN = [
  [590, 790, 495, 410], // plaza dan desa
  [430, 950, 170, 100], // jalan menuju gerbang rumah
]

export const NPC_DUNIA = [
  { id: 'kapten', nama: 'Kapten Rowan', x: 860, y: 850, jenis: 'misi', label: 'Bicara dengan Kapten Rowan' },
  { id: 'herbalis', nama: 'Herbalis Mira', x: 700, y: 1045, jenis: 'misi', label: 'Bicara dengan Herbalis Mira' },
  { id: 'guru', nama: 'Guru Elara', x: 935, y: 1045, jenis: 'kelas', label: 'Bicara dengan Guru Elara' },
]