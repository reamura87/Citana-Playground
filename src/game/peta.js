export const UKURAN_DUNIA = { lebar: 1280, tinggi: 960 }
export const SKALA = 2 // objek dunia digambar 2x

export const POSISI_PETAK = Array.from({ length: 12 }, (_, i) => ({
  x: 560 + (i % 4) * 84,
  y: 230 + Math.floor(i / 4) * 84,
}))

export const PETA = {
  server: {
    nama: 'Dunia bersama',
    mulai: { x: 640, y: 520 },
    gerbang: { x: 160, y: 830, ke: 'pribadi', label: 'Ke rumahku' },
    toko: { x: 640, y: 800 },
    papan: { x: 730, y: 470 },
    musuh: [
      { id: 'slime', nama: 'Slime', x: 930, y: 300 },
      { id: 'goblin', nama: 'Goblin', x: 1050, y: 370 },
      { id: 'serigala', nama: 'Serigala', x: 960, y: 450 },
    ],
    zonaTaman: [100, 100, 420, 280],
    larangan: [
      [560, 0, 160, 900],
      [0, 440, 1280, 120],
      [800, 130, 400, 400],
      [520, 640, 240, 280],
      [100, 760, 120, 120],
      [180, 200, 140, 80],
    ],
  },
  pribadi: {
    nama: 'Rumah pribadi',
    mulai: { x: 420, y: 560 },
    rumah: { x: 260, y: 380 },
    gerbang: { x: 640, y: 910, ke: 'server', label: 'Ke dunia bersama' },
    larangan: [
      [150, 200, 230, 210],
      [500, 160, 380, 310],
      [210, 360, 100, 180],
      [210, 460, 500, 100],
      [590, 460, 100, 440],
      [560, 820, 160, 140],
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

// Titik acak yang tidak masuk area terlarang dan tidak saling berdempetan
export function sebarDekorasi(
  seed,
  jumlah,
  larangan,
  zona = [0, 0, UKURAN_DUNIA.lebar, UKURAN_DUNIA.tinggi],
  jarakMin = 70,
) {
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

// Gambar tanah satu peta (dibuat sekali lalu dipakai ulang sebagai tekstur)
export function gambarTanah(peta) {
  const { lebar, tinggi } = UKURAN_DUNIA
  const kanvas = document.createElement('canvas')
  kanvas.width = lebar
  kanvas.height = tinggi
  const ctx = kanvas.getContext('2d')
  const rnd = acak(peta === 'server' ? 11 : 29)

  ctx.fillStyle = '#5a9e4b'
  ctx.fillRect(0, 0, lebar, tinggi)
  for (let i = 0; i < 3000; i += 1) {
    ctx.fillStyle = rnd() > 0.5 ? '#63a954' : '#4f9042'
    ctx.fillRect(Math.floor((rnd() * lebar) / 4) * 4, Math.floor((rnd() * tinggi) / 4) * 4, 4, 4)
  }

  const jalan = (x, y, l, t) => {
    ctx.fillStyle = '#c9b383'
    ctx.fillRect(x, y, l, t)
    ctx.fillStyle = '#b89f6c'
    for (let i = 0; i < (l * t) / 500; i += 1) ctx.fillRect(x + rnd() * l, y + rnd() * t, 4, 4)
  }
  const lingkaran = (x, y, r, warna) => {
    ctx.fillStyle = warna
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  if (peta === 'server') {
    jalan(560, 0, 160, 900)
    jalan(0, 440, 1280, 120)
    lingkaran(640, 500, 110, '#8f939b')
    lingkaran(640, 500, 94, '#b4b8c0')
    lingkaran(640, 500, 20, '#8f939b')
    // taman
    ctx.fillStyle = '#74b862'
    ctx.fillRect(100, 100, 420, 280)
    ctx.fillStyle = '#4aa3d9'
    ctx.beginPath()
    ctx.ellipse(250, 240, 70, 38, 0, 0, Math.PI * 2)
    ctx.fill()
    jalan(100, 330, 420, 28)
    // arena
    lingkaran(1000, 330, 204, '#a88a52')
    lingkaran(1000, 330, 196, '#e3cf9a')
    lingkaran(1000, 330, 120, '#d9c389')
    // plaza toko
    ctx.fillStyle = '#b4b8c0'
    ctx.fillRect(540, 660, 200, 240)
  } else {
    jalan(230, 380, 60, 130)
    jalan(230, 480, 470, 60)
    jalan(610, 480, 60, 420)
    ctx.fillStyle = '#6ca95b'
    ctx.fillRect(520, 180, 340, 270)
    ctx.strokeStyle = '#7a4a1e'
    ctx.lineWidth = 6
    ctx.strokeRect(520, 180, 340, 270)
  }
  return kanvas
}