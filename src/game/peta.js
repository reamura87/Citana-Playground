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
    ukuran: { lebar: 1600, tinggi: 1200 },
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
    ],
  },
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
  const { lebar, tinggi } = PETA[peta].ukuran
  const kanvas = document.createElement('canvas')
  kanvas.width = lebar
  kanvas.height = tinggi
  const ctx = kanvas.getContext('2d')
  const rnd = acak(peta === 'server' ? 11 : 29)

  ctx.fillStyle = '#5a9e4b'
  ctx.fillRect(0, 0, lebar, tinggi)
  for (let i = 0; i < 4200; i += 1) {
    ctx.fillStyle = rnd() > 0.5 ? '#63a954' : '#4f9042'
    ctx.fillRect(Math.floor((rnd() * lebar) / 4) * 4, Math.floor((rnd() * tinggi) / 4) * 4, 4, 4)
  }

  const jalur = (x1, y1, x2, y2, tebal) => {
    ctx.strokeStyle = '#b8a07a'
    ctx.lineWidth = tebal
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
  }

  if (peta === 'server') {
    ctx.fillStyle = 'rgba(30,80,40,0.35)'
    ctx.fillRect(80, 280, 460, 720)

    for (let i = 0; i < 19; i += 1) {
      ctx.fillStyle = i % 2 === 0 ? '#b59a4a' : '#a58a3c'
      ctx.fillRect(1060, 640 + i * 24, 440, 16)
    }

    ctx.fillStyle = '#9b8560'
    ctx.fillRect(1060, 450, 260, 200)

    ctx.fillStyle = '#7f8b79'
    for (let i = 0; i < 40; i += 1) ctx.fillRect(560 + rnd() * 440, 380 + rnd() * 240, 28, 20)

    ctx.fillStyle = '#6b6560'
    ctx.fillRect(1160, 60, 400, 400)
    for (let i = 0; i < 320; i += 1) {
      ctx.fillStyle = rnd() > 0.5 ? '#7b756f' : '#5a554f'
      ctx.fillRect(1160 + rnd() * 392, 60 + rnd() * 392, 8, 8)
    }

    jalur(800, 300, 800, 840, 70)
    jalur(0, 600, 1600, 600, 60)
    jalur(830, 600, 1000, 520, 50)
    jalur(1000, 520, 1250, 420, 50)
    jalur(1250, 420, 1340, 350, 50)
    jalur(470, 1000, 600, 1000, 50)

    ctx.fillStyle = '#9a9ea6'
    ctx.fillRect(600, 800, 400, 300)
    ctx.fillStyle = '#8a8e96'
    for (let x = 600; x < 1000; x += 25) ctx.fillRect(x, 800, 2, 300)
    for (let y = 800; y < 1100; y += 25) ctx.fillRect(600, y, 400, 2)
    ctx.fillStyle = '#9a9ea6'
    ctx.fillRect(720, 300, 160, 44)
    // Tambang batu (barat laut)
    ctx.fillStyle = '#77716b'
    ctx.fillRect(60, 60, 520, 210)
    for (let i = 0; i < 260; i += 1) {
      ctx.fillStyle = rnd() > 0.5 ? '#86807a' : '#5f5a55'
      ctx.fillRect(60 + rnd() * 512, 60 + rnd() * 202, 8, 8)
    }

  } else {
    jalur(260, 400, 260, 510, 56)
    jalur(260, 510, 640, 510, 56)
    jalur(640, 510, 640, 900, 56)
    ctx.fillStyle = '#6ca95b'
    ctx.fillRect(516, 196, 280, 216)
    ctx.strokeStyle = '#7a4a1e'
    ctx.lineWidth = 6
    ctx.strokeRect(516, 196, 280, 216)
  }

    for (const a of PETA[peta].air ?? []) {
    const elips = (rx, ry, warna) => {
      ctx.fillStyle = warna
      ctx.beginPath()
      ctx.ellipse(a.cx, a.cy, rx, ry, 0, 0, Math.PI * 2)
      ctx.fill()
    }
    elips(a.rx + 40, a.ry + 26, '#d8c690') // pasir tepi
    elips(a.rx + 22, a.ry + 12, '#6fc3e6') // air dangkal
    elips(a.rx, a.ry, '#3f93c9') // air dalam
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'
    ctx.lineWidth = 2
    for (let i = 0; i < 7; i += 1) {
      ctx.beginPath()
      ctx.ellipse(
        a.cx - a.rx * 0.6 + rnd() * a.rx * 1.2,
        a.cy - a.ry * 0.5 + rnd() * a.ry,
        12, 4, 0, 0, Math.PI,
      )
      ctx.stroke()
    }
  }
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