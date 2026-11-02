export const L = 480
export const T = 320

export const WARNA = {
  jendela: 0x0b1030,
  garis: 0xdfe6ff,
  garisDalam: 0x6f7fc8,
  sorot: 0xffffff,
  teks: '#ffffff',
  redup: '#a9b2e6',
  emas: '#ffe27a',
  bahaya: '#ff8a8a',
  hijau: '#9ce89c',
  nonaktif: '#7c83ad',
}

export const FONT = '"Courier New", Courier, monospace'

export function gaya(ukuran, warna = WARNA.teks, ekstra = {}) {
  return { fontFamily: FONT, fontSize: `${ukuran}px`, fontStyle: 'bold', color: warna, ...ekstra }
}

// Jendela bergaya RPG Maker: isi biru tua, garis putih kebiruan ganda
export function gambarJendela(g, x, y, w, h, alpha = 0.92) {
  g.fillStyle(WARNA.jendela, alpha)
  g.fillRoundedRect(x, y, w, h, 6)
  g.lineStyle(2, WARNA.garis, 1)
  g.strokeRoundedRect(x + 1, y + 1, w - 2, h - 2, 6)
  g.lineStyle(1, WARNA.garisDalam, 1)
  g.strokeRoundedRect(x + 4, y + 4, w - 8, h - 8, 4)
}

export const rupiah = (n) => Number(n).toLocaleString('id-ID')

export function formatSisa(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const dua = (n) => String(n).padStart(2, '0')
  const j = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  return j > 0 ? `${j}:${dua(m)}:${dua(total % 60)}` : `${dua(m)}:${dua(total % 60)}`
}