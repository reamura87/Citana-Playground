// Tata letak Kripta Lich Agung. Nomor idx musuh dan peti harus sama dengan tabel
// game_dungeon_tata_musuh dan game_dungeon_tata_peti di database.
export const DUNGEON = {
  ukuran: { lebar: 1280, tinggi: 960 },
  mulai: { x: 250, y: 850 },
  keluar: { x: 120, y: 850 },
  pulih: { x: 640, y: 108 },
  // Area yang bisa dilalui: [x, y, lebar, tinggi]
  lantai: [
    [60, 740, 380, 180], // aula masuk
    [210, 560, 100, 190], // lorong ke atas
    [80, 330, 460, 240], // ruang tulang
    [530, 420, 260, 90], // lorong ke timur
    [780, 300, 340, 300], // ruang harta
    [920, 150, 90, 160], // lorong ke utara
    [560, 40, 640, 130], // ruang hantu
    [440, 60, 130, 90], // lorong ke barat
    [60, 30, 390, 250], // ruang bos
  ],
  musuh: [
    { idx: 0, x: 250, y: 140 }, // Lich Agung
    { idx: 1, x: 170, y: 420 }, { idx: 2, x: 300, y: 400 }, { idx: 3, x: 430, y: 430 }, { idx: 4, x: 330, y: 500 },
    { idx: 5, x: 860, y: 380 }, { idx: 6, x: 1000, y: 430 }, { idx: 7, x: 940, y: 540 },
    { idx: 8, x: 760, y: 100 }, { idx: 9, x: 900, y: 100 }, { idx: 10, x: 1050, y: 100 },
  ],
  peti: [
    { idx: 1, x: 120, y: 545 },
    { idx: 2, x: 1085, y: 345 },
    { idx: 3, x: 1165, y: 115 },
    { idx: 4, x: 250, y: 66, boss: true },
  ],
  obor: [
    { x: 90, y: 760 }, { x: 410, y: 760 }, { x: 218, y: 600 }, { x: 302, y: 600 },
    { x: 100, y: 350 }, { x: 520, y: 350 }, { x: 100, y: 555 }, { x: 520, y: 555 },
    { x: 600, y: 430 }, { x: 740, y: 430 }, { x: 800, y: 320 }, { x: 1100, y: 320 },
    { x: 800, y: 585 }, { x: 1100, y: 585 }, { x: 580, y: 60 }, { x: 1180, y: 60 },
    { x: 80, y: 50 }, { x: 430, y: 50 }, { x: 80, y: 262 }, { x: 430, y: 262 },
  ],
}

// Menggabungkan data musuh dari server dengan posisinya, dalam bentuk yang sama dengan musuh dunia
export function gabungMusuh(daftar) {
  return daftar.map((m) => {
    const t = DUNGEON.musuh.find((x) => x.idx === m.idx)
    return {
      id: m.idx, musuh_id: m.musuh_id, nama: m.nama, jenis: m.jenis, hp: m.hp, hp_maks: m.hp_maks,
      keadaan: m.keadaan, mati_pada: m.mati_pada, hidup_lagi_pada: null, rute: null, fase: 0, x: t.x, y: t.y,
    }
  })
}