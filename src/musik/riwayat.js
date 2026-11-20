// Pereduksi dengan urungkan/ulangi (undo/redo) untuk lagu.
const BATAS_RIWAYAT = 100

export const keadaanAwal = (lagu) => ({ lagu, lalu: [], depan: [] })

export function pereduksi(s, a) {
  switch (a.jenis) {
    case 'ganti':
      return keadaanAwal(a.lagu)
    case 'ubah': {
      const baru = a.fn(s.lagu)
      if (baru === s.lagu) return s
      return { lagu: baru, lalu: [...s.lalu, s.lagu].slice(-BATAS_RIWAYAT), depan: [] }
    }
    case 'ubahLangsung': {
      // perubahan kecil dan beruntun (geser volume, ketik nama) tanpa membanjiri riwayat
      const baru = a.fn(s.lagu)
      return baru === s.lagu ? s : { ...s, lagu: baru }
    }
    case 'urungkan':
      if (s.lalu.length === 0) return s
      return { lagu: s.lalu[s.lalu.length - 1], lalu: s.lalu.slice(0, -1), depan: [s.lagu, ...s.depan] }
    case 'ulangi':
      if (s.depan.length === 0) return s
      return { lagu: s.depan[0], lalu: [...s.lalu, s.lagu], depan: s.depan.slice(1) }
    default:
      return s
  }
}
