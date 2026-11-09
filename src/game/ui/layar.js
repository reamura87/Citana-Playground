import { NAMA_GAYA_RAMBUT, PALET_BAJU, PALET_KULIT, PALET_RAMBUT } from '../gambar'
import { PILIHAN_LAGU, suara } from '../suara'
import { WARNA, rupiah } from './gaya'

const NAMA_TIER = ['', 'perunggu', 'perak', 'emas', 'berlian', 'obsidian', 'mitril']
const KATEGORI_HADIAH = ['bibit', 'panen', 'ramuan', 'senjata', 'armor', 'tumbuhan', 'ore']
const NAMA_NPC = { kapten: 'Kapten Rowan', herbalis: 'Herbalis Mira' }

const warnaInt = (hex) => parseInt(hex.slice(1), 16)
const milik = (st, id) => st.inventaris.find((i) => i.item_id === id)?.jumlah ?? 0
const sedangDipakai = (st, item) => st.pemain.senjata?.id === item.id || st.pemain.armor?.id === item.id
const cari = (kat, id) => kat.item.find((k) => k.id === id)
const durasi = (d) => (d >= 3600 ? `${Math.round(d / 3600)} jam` : d >= 60 ? `${Math.round(d / 60)} menit` : `${d} detik`)

// ---------- Hadiah antarpemain ----------
function pilihJumlah(ui, item, jumlah, penerima) {
  if (['senjata', 'armor'].includes(item.kategori)) return ui.api().kirimHadiah(penerima.id, item.id, 1)
  const pilihan = [...new Set([1, 5, 10, jumlah].filter((n) => n <= jumlah))]
  ui.tanya({
    judul: `${item.nama} untuk ${penerima.nama}`,
    opsi: [
      ...pilihan.map((n) => ({
        teks: n === jumlah && n > 1 ? `Semua (${n})` : String(n),
        aksi: () => ui.api().kirimHadiah(penerima.id, item.id, n),
      })),
      { teks: 'Batal' },
    ],
  })
  return null
}

function pilihPenerima(ui, item, jumlah, dekat) {
  ui.tanya({
    judul: 'Hadiahkan ke...',
    opsi: [...dekat.map((s) => ({ teks: s.nama, aksi: () => pilihJumlah(ui, item, jumlah, s) })), { teks: 'Batal' }],
  })
}

function menuItem(ui, st, item, entri) {
  if (!item) return
  const dekat = ui.sekitar.filter((s) => s.dekat)
  const dipakai = sedangDipakai(st, item)
  const opsi = []
  if (['senjata', 'armor', 'ramuan'].includes(item.kategori) && !dipakai) {
    opsi.push({ teks: item.kategori === 'ramuan' ? 'Minum' : 'Pakai', aksi: () => ui.api().pakai(item.id) })
  }
  if (KATEGORI_HADIAH.includes(item.kategori) && !dipakai) {
    opsi.push({
      teks: 'Hadiahkan ke player lain',
      aktif: dekat.length > 0,
      alasan: 'Dekati pemain lain (sekitar 140 px) dulu.',
      aksi: () => pilihPenerima(ui, item, entri.jumlah, dekat),
    })
  }
  opsi.push({ teks: 'Batal' })
  ui.tanya({ judul: item.nama, info: item.deskripsi ? [item.deskripsi] : [], opsi })
}

export const LAYAR = {
  // Jendela kecil berisi pilihan (dipakai berantai oleh jendela lain)
  tanya(ui, ent) {
    const p = ent.param
    return {
      kecil: true,
      lebar: p.lebar ?? 300,
      judul: p.judul,
      info: p.info,
      baris: p.opsi.map((o) => ({
        teks: o.teks,
        kanan: o.kanan,
        aktif: o.aktif,
        alasan: o.alasan,
        aksi: async () => {
          ui.kembali()
          await o.aksi?.()
        },
      })),
      kaki: 'A: pilih · B: batal',
    }
  },

  menu(ui) {
    const st = ui.status()
    const s = suara.cuplikan()
    const baris = [
      { teks: 'Tas', aksi: () => ui.buka('tas') },
      {
        teks: 'Status',
        kanan: st.pemain.poin_sisa > 0 ? `${st.pemain.poin_sisa} poin` : '',
        aksi: () => ui.buka('status'),
      },
      { teks: 'Misi hari ini', aksi: () => ui.buka('misi', {}) },
      {
        teks: 'Suara',
        kanan: s.nyala ? 'Nyala' : 'Mati',
        ubah: () => {
          suara.setNyala(!suara.cuplikan().nyala)
          ui.render()
        },
      },
      {
        teks: 'Volume',
        kanan: `${Math.round(s.volume * 100)}%`,
        ubah: (a) => {
          suara.setVolume(Math.round((suara.cuplikan().volume + a * 0.1) * 10) / 10)
          ui.render()
        },
      },
      
      {
        teks: 'Musik',
        kanan: PILIHAN_LAGU.find((p) => p.id === s.pilihan)?.nama ?? 'Otomatis',
        sub: `Memutar: ${s.lagu}`,
        ubah: (a) => {
          const n = PILIHAN_LAGU.length
          const i = PILIHAN_LAGU.findIndex((p) => p.id === suara.cuplikan().pilihan)
          suara.setPilihanLagu(PILIHAN_LAGU[(i + a + n) % n].id)
          ui.render()
        },
      },
    ]
    if (ui.registry.get('admin')) baris.push({ teks: 'Debug (admin)', aksi: () => ui.buka('debug') })
    if (ui.peta === 'dungeon') baris.push({ teks: 'Keluar dari kripta', aksi: () => ui.buka('keluarDungeon') })
    baris.push({ teks: 'Keluar ke Beranda', aksi: () => ui.api().keluar() })
    baris.push({ teks: 'Tutup menu', aksi: () => ui.tutupSemua() })
    return { kecil: true, lebar: 330, judul: 'Menu', baris, kaki: 'A: pilih · B: tutup' }
  },

  tas(ui) {
    const st = ui.status()
    const kat = ui.katalog()
    const baris = st.inventaris.map((i) => {
      const item = cari(kat, i.item_id)
      const dipakai = item && sedangDipakai(st, item)
      const stat = item?.attack ? `+${item.attack} ATK` : item?.defense ? `+${item.defense} DEF` : ''
      return {
        teks: `${item?.nama ?? i.item_id} x${i.jumlah}`,
        ikon: ui.ikon(item),
        kanan: dipakai ? 'Dipakai' : stat,
        warnaKanan: dipakai ? WARNA.hijau : WARNA.emas,
        aksi: () => menuItem(ui, st, item, i),
      }
    })
    return {
      judul: 'Tas',
      info: [`Gold: ${rupiah(st.pemain.gold)}`],
      baris: baris.length ? baris : [{ pemisah: true, teks: 'Tas kosong.' }],
      kaki: 'A: pilih · B: kembali',
    }
  },

    skill(ui) {
    const st = ui.status()
    const p = st.pemain
    const saya = ui.registry.get('skillSaya') ?? []
    const daftar = ui
      .katalog()
      .skill.filter((s) => s.kelas === p.kelas.id)
      .sort((a, b) => a.slot - b.slot)
    return {
      judul: `Skill ${p.kelas.nama}`,
      info: [`Gold: ${rupiah(p.gold)} · skill permanen, punya cooldown. PC: tombol 1-4.`],
      baris: daftar.map((s) => {
        const punya = saya.some((x) => x.skill_id === s.id)
        const okLevel = p.level >= s.min_level
        return {
          teks: `[${s.slot}] ${s.nama}`,
          ikon: ui.ikonSkill(s.id),
          kanan: punya ? 'Dimiliki' : `${rupiah(s.harga)} g`,
          warnaKanan: punya ? WARNA.hijau : WARNA.emas,
          sub: `${s.deskripsi} CD ${s.cooldown_ms / 1000} dtk${punya || okLevel ? '' : ` · butuh Lv ${s.min_level}`}`,
          aktif: !punya && okLevel && p.gold >= s.harga,
          alasan: punya ? 'Skill ini sudah kamu miliki.' : !okLevel ? `Butuh level ${s.min_level}.` : 'Gold tidak cukup.',
          aksi: () =>
            ui.tanya({
              judul: s.nama,
              info: [s.deskripsi, `Cooldown ${s.cooldown_ms / 1000} detik · slot ${s.slot} (tombol ${s.slot})`],
              opsi: [
                { teks: `Beli (${rupiah(s.harga)} g)`, aksi: () => ui.api().skillBeli(s.id) },
                { teks: 'Batal' },
              ],
            }),
        }
      }),
      kaki: 'A: pilih · B: kembali',
    }
  },

  status(ui) {
    const p = ui.status().pemain
    return {
      judul: 'Status',
      info: [
        `${p.nama} · ${p.kelas.nama} · Lv ${p.level}`,
        `XP ${p.xp}/${p.xp_butuh} · Gold ${rupiah(p.gold)}`,
        `HP maks ${p.hp_maks} · ATK ${p.attack} · DEF ${p.defense}`,
        `Senjata: ${p.senjata?.nama ?? '-'} · Zirah: ${p.armor?.nama ?? '-'}`,
        { t: `Poin tersisa: ${p.poin_sisa} (3 poin tiap naik level)`, warna: WARNA.emas },
      ],
      baris: [
        {
          teks: 'Health',
          kanan: `${p.poin_hp} poin`,
          sub: `+10 HP maks per poin (sekarang ${p.hp_maks})`,
          aktif: p.poin_sisa > 0,
          alasan: 'Tidak ada poin tersisa.',
          aksi: () => ui.api().tambahPoin('hp'),
        },
        {
          teks: 'Kecepatan serang',
          kanan: `${p.poin_speed}/7`,
          sub: `Jeda serang ${p.jeda_serang_ms} ms`,
          aktif: p.poin_sisa > 0 && p.poin_speed < 7,
          alasan: p.poin_speed >= 7 ? 'Sudah maksimum.' : 'Tidak ada poin tersisa.',
          aksi: () => ui.api().tambahPoin('speed'),
        },
      ],
      kaki: 'A: tambah poin · B: kembali',
    }
  },

  toko(ui, ent) {
    const st = ui.status()
    const kat = ui.katalog()
    const dunia = ui.dunia()
    const p = st.pemain
    const harga = (i) => `${rupiah(i.harga_beli)} g`
    const dijual = (kategori) => kat.item.filter((i) => kategori.includes(i.kategori) && i.harga_beli !== null)
    let baris = []

    if (ent.tab === 0 || ent.tab === 1) {
      baris = dijual([ent.tab === 0 ? 'senjata' : 'armor'])
        .filter((i) => !i.kelas || i.kelas === p.kelas.id)
        .map((i) => {
          const dipakai = sedangDipakai(st, i)
          const punya = milik(st, i.id) > 0
          return {
            teks: i.nama,
            ikon: ui.ikon(i),
            kanan: dipakai ? 'Dipakai' : punya ? 'Dimiliki' : harga(i),
            warnaKanan: dipakai || punya ? WARNA.hijau : WARNA.emas,
            sub: i.attack ? `+${i.attack} ATK` : i.defense ? `+${i.defense} DEF` : '',
            aktif: dipakai ? false : punya ? true : p.gold >= i.harga_beli,
            alasan: dipakai ? 'Sedang dipakai.' : 'Gold tidak cukup.',
            aksi: () => (punya ? ui.api().pakai(i.id) : ui.api().beli(i.id, 1)),
          }
        })
    } else if (ent.tab === 2) {
      const alat = [...(kat.alat ?? [])].sort((a, b) => a.jenis.localeCompare(b.jenis) || a.tier - b.tier)
      baris = alat.map((a) => {
        const item = cari(kat, a.item_id)
        const punya = milik(st, a.item_id) > 0
        const sebelumnya = alat.find((x) => x.jenis === a.jenis && x.tier === a.tier - 1)
        const namaSebelum = sebelumnya && cari(kat, sebelumnya.item_id)?.nama
        const punyaSebelum = !sebelumnya || milik(st, sebelumnya.item_id) > 0
        const stat = a.jenis === 'beliung' ? (dunia?.forage?.tambang ?? 0) : (dunia?.forage?.tumbuhan ?? 0)
        const okLevel = p.level >= a.syarat_level
        const okJumlah = stat >= a.syarat_jumlah
        const kata = a.jenis === 'beliung' ? 'menambang' : 'mengumpulkan'
        const membuka = a.jenis === 'beliung' && a.tier < 6 ? ` · membuka bijih ${NAMA_TIER[a.tier + 1]}` : ''
        const syarat = punya
          ? ''
          : ` | Lv ${a.syarat_level} ${okLevel ? 'ok' : 'belum'}${
              namaSebelum ? ` · ${namaSebelum} ${punyaSebelum ? 'ok' : 'belum'}` : ''
            }${a.syarat_jumlah > 0 ? ` · ${kata} ${Math.min(stat, a.syarat_jumlah)}/${a.syarat_jumlah}` : ''}`
        return {
          teks: item.nama,
          ikon: ui.ikon(item),
          kanan: punya ? 'Dimiliki' : harga(item),
          warnaKanan: punya ? WARNA.hijau : WARNA.emas,
          sub: `${a.kecepatan_persen}% lebih cepat${membuka}${syarat}`,
          aktif: !punya && punyaSebelum && okLevel && okJumlah && p.gold >= item.harga_beli,
          alasan: punya
            ? 'Sudah dimiliki.'
            : !okLevel
              ? `Butuh level ${a.syarat_level}.`
              : !punyaSebelum
                ? `Beli ${namaSebelum} dulu.`
                : !okJumlah
                  ? `Kamu perlu ${a.syarat_jumlah} kali ${kata} (baru ${stat}).`
                  : 'Gold tidak cukup.',
          aksi: () => ui.api().beli(a.item_id, 1),
        }
      })
    } else if (ent.tab === 3) {
      baris = dijual(['ramuan', 'bibit']).map((i) => ({
        teks: i.nama,
        ikon: ui.ikon(i),
        kanan: harga(i),
        sub: i.pulih ? `+${i.pulih} HP` : i.kategori === 'bibit' ? 'Bibit untuk kebun rumah' : '',
        aksi: () =>
          ui.tanya({
            judul: i.nama,
            opsi: [
              ...[1, 5].map((n) => ({
                teks: `Beli ${n} (${rupiah(i.harga_beli * n)} g)`,
                aktif: p.gold >= i.harga_beli * n,
                alasan: 'Gold tidak cukup.',
                aksi: () => ui.api().beli(i.id, n),
              })),
              { teks: 'Batal' },
            ],
          }),
      }))
    } else {
      baris = st.inventaris
        .map((i) => ({ ...i, item: cari(kat, i.item_id) }))
        .filter((i) => i.item && i.item.harga_jual !== null && !sedangDipakai(st, i.item))
        .map((i) => ({
          teks: `${i.item.nama} x${i.jumlah}`,
          ikon: ui.ikon(i.item),
          kanan: `${rupiah(i.item.harga_jual)} g`,
          aksi: () =>
            ui.tanya({
              judul: i.item.nama,
              opsi: [
                { teks: 'Jual 1', aksi: () => ui.api().jual(i.item_id, 1) },
                ...(i.jumlah > 1
                  ? [{ teks: `Jual semua (${i.jumlah})`, aksi: () => ui.api().jual(i.item_id, i.jumlah) }]
                  : []),
                { teks: 'Batal' },
              ],
            }),
        }))
    }
    return {
      judul: 'Pandai Besi',
      info: [`Gold: ${rupiah(p.gold)}`],
      tab: {
        daftar: ['Senjata', 'Armor', 'Alat', 'Ramuan', 'Jual'],
        aktif: ent.tab,
        pilih: (i) => {
          ent.tab = i
          ent.pilih = 0
          ent.gulir = 0
          ui.render()
        },
      },
      baris: baris.length ? baris : [{ pemisah: true, teks: 'Tidak ada barang.' }],
      kaki: 'Kiri/kanan: tab · A: pilih · B: kembali',
    }
  },

  rumah(ui) {
    const st = ui.status()
    const r = st.rumah
    return {
      judul: 'Rumahku',
      info: [`Level ${r.level} · ${r.jumlah_petak} petak kebun`, `Gold: ${rupiah(st.pemain.gold)}`],
      baris: r.berikutnya
        ? [
            {
              teks: 'Upgrade rumah',
              kanan: `${rupiah(r.berikutnya.biaya_gold)} g`,
              sub: `Level ${r.berikutnya.level}: ${r.berikutnya.jumlah_petak} petak kebun`,
              aktif: st.pemain.gold >= r.berikutnya.biaya_gold,
              alasan: 'Gold tidak cukup.',
              aksi: () => ui.api().upgradeRumah(),
            },
          ]
        : [{ pemisah: true, teks: 'Rumahmu sudah di level maksimum.' }],
    }
  },

  tanam(ui, ent) {
    const st = ui.status()
    const kat = ui.katalog()
    return {
      judul: 'Pilih tanaman',
      baris: kat.tanaman.map((t) => {
        const bibit = milik(st, t.bibit_item)
        return {
          teks: t.nama,
          ikon: ui.ikon(cari(kat, t.bibit_item)),
          kanan: `bibit ${bibit}`,
          sub: `Tumbuh ${durasi(t.durasi_detik)} · hasil ${t.hasil_jumlah}`,
          aktif: bibit > 0,
          alasan: 'Kamu tidak punya bibitnya. Beli di Pandai Besi.',
          aksi: async () => {
            await ui.api().tanam(ent.param.indeks, t.id)
            ui.kembali()
          },
        }
      }),
      kaki: 'Bibit dijual di Pandai Besi (kerajaan).',
    }
  },

  papan(ui) {
    return {
      judul: 'Papan pengumuman',
      paragraf: [
        'Tekan A atau klik untuk menebas musuh. Musuh akan mengejar dan membalas, jadi jaga HP-mu.',
        'Kalau HP habis, kamu menunggu 5 menit. Tiap naik level kamu mendapat 3 poin di menu Status.',
        'Senjata, zirah, dan perkakas dibeli di Pandai Besi. Misi harian ada pada Kapten Rowan dan Herbalis Mira.',
      ],
      baris: [{ teks: 'Tutup', aksi: () => ui.kembali() }],
    }
  },

  kelas(ui) {
    const kini = ui.status().pemain.kelas
    const kat = ui.katalog()
    return {
      judul: 'Tentang role',
      paragraf: [
        `Rolemu: ${kini.nama}. ${kini.deskripsi}`,
        ...kat.kelas.filter((c) => c.id !== kini.id).map((c) => `${c.nama}: ${c.deskripsi}`),
        'Role tidak bisa diganti setelah karakter dibuat. Untuk memulai ulang, pakai Restart Akun Game di menu profil (ikon avatarmu).',
      ],
      baris: [{ teks: 'Tutup', aksi: () => ui.kembali() }],
    }
  },

  misi(ui, ent) {
    if (!ent.data && !ent.memuat) {
      ent.memuat = true
      Promise.resolve(ui.api().ambilMisi()).then((d) => {
        ent.data = d ?? { quest: [] }
        ent.memuat = false
        if (ui.hidup && ui.tumpukan.includes(ent)) ui.render()
      })
    }
    const semua = ent.data?.quest ?? []
    const daftar = ent.param.npc ? semua.filter((q) => q.npc === ent.param.npc) : semua
    let baris
    if (!ent.data) baris = [{ pemisah: true, teks: 'Memuat misi...' }]
    else if (daftar.length === 0) baris = [{ pemisah: true, teks: 'Belum ada misi untukmu hari ini.' }]
    else {
      baris = daftar.map((q) => {
        const selesai = q.progres >= q.jumlah
        const diambil = q.status === 'diambil'
        return {
          teks: q.judul,
          kanan: diambil ? 'Selesai' : selesai ? 'Ambil!' : `${q.progres}/${q.jumlah}`,
          warnaKanan: diambil ? WARNA.hijau : selesai ? WARNA.emas : WARNA.redup,
          sub: `${ent.param.npc ? '' : `${NAMA_NPC[q.npc]} · `}Hadiah +${q.xp} XP, +${q.gold} gold`,
          aktif: !diambil,
          alasan: 'Hadiah misi ini sudah diambil.',
          aksi: async () => {
            if (!selesai) {
              ui.toast(`Misi belum selesai (${q.progres}/${q.jumlah}).`)
              return
            }
            const baru = await ui.api().klaimMisi(q.id)
            if (baru) {
              ent.data = baru
              ui.render()
            }
          },
        }
      })
    }
    return {
      judul: ent.param.npc ? `Misi ${NAMA_NPC[ent.param.npc]}` : 'Misi hari ini',
      info: ['Misi diperbarui tiap tengah malam (WITA).'],
      baris,
      kaki: 'A: ambil hadiah · B: kembali',
    }
  },

  debug(ui) {
    const waktu = ui.registry.get('waktuPaksa') ?? 'otomatis'
    const pilihanWaktu = [
      ['otomatis', 'Otomatis (jam WITA)'],
      ['siang', 'Siang'],
      ['senja', 'Senja'],
      ['malam', 'Malam'],
      ['subuh', 'Subuh'],
    ]
    return {
      judul: 'Debug (admin)',
      info: ['Alat uji khusus admin. Pengaturan waktu hanya mengubah tampilan layarmu sendiri.'],
      baris: [
        { teks: 'Penampilan dan role', aksi: () => ui.buka('kreator', { mode: 'debug' }) },
        {
          teks: 'Waktu dunia',
          kanan: waktu,
          aksi: () =>
            ui.tanya({
              judul: 'Waktu dunia',
              opsi: pilihanWaktu.map(([kode, nama]) => ({
                teks: nama,
                aksi: () => {
                  ui.registry.set('waktuPaksa', kode === 'otomatis' ? null : kode)
                  ui.render()
                },
              })),
            }),
        },
        { teks: 'Pakai perlengkapan gratis', aksi: () => ui.buka('debugAlat') },
      ],
    }
  },

  debugAlat(ui, ent) {
    const st = ui.status()
    const kat = ui.katalog()
    const kategori = ent.tab === 0 ? 'senjata' : 'armor'
    return {
      judul: 'Perlengkapan gratis',
      tab: {
        daftar: ['Senjata', 'Armor'],
        aktif: ent.tab,
        pilih: (i) => {
          ent.tab = i
          ent.pilih = 0
          ent.gulir = 0
          ui.render()
        },
      },
      baris: kat.item
        .filter((i) => i.kategori === kategori)
        .map((i) => {
          const dipakai = sedangDipakai(st, i)
          return {
            teks: i.nama,
            ikon: ui.ikon(i),
            kanan: dipakai ? 'Dipakai' : '',
            warnaKanan: WARNA.hijau,
            sub: `${i.attack ? `+${i.attack} ATK` : i.defense ? `+${i.defense} DEF` : 'dasar'}${i.kelas ? ` · ${i.kelas}` : ''}`,
            aktif: !dipakai,
            alasan: 'Sedang dipakai.',
            aksi: () => ui.api().adminPakai(i.id),
          }
        }),
      kaki: 'Kiri/kanan: tab · A: pakai gratis · B: kembali',
    }
  },

  kreator(ui, ent) {
    const kat = ui.katalog()
    const debug = ent.param.mode === 'debug'
    if (!ent.data) {
      const st = ui.status()
      const awal = debug
        ? { kelas: st.pemain.kelas.id, kustom: st.pemain.kustom }
        : ui.registry.get('karakterAwal')
      ent.data = {
        kelas: awal?.kelas ?? 'ksatria',
        kustom: { kulit: 1, rambut: 0, gaya: 0, baju: 0, ...(awal?.kustom ?? {}) },
        paham: false,
      }
    }
    const dt = ent.data
    const idx = Math.max(0, kat.kelas.findIndex((c) => c.id === dt.kelas))
    const kelas = kat.kelas[idx]
    const siklus = (kunci, jumlah) => (a) => {
      dt.kustom[kunci] = (dt.kustom[kunci] + a + jumlah) % jumlah
      ui.render()
    }
    const baris = [
      {
        teks: 'Role',
        kanan: kelas.nama,
        ubah: (a) => {
          dt.kelas = kat.kelas[(idx + a + kat.kelas.length) % kat.kelas.length].id
          ui.render()
        },
      },
      {
        teks: 'Kulit',
        kanan: `${dt.kustom.kulit + 1}/${PALET_KULIT.length}`,
        warna: warnaInt(PALET_KULIT[dt.kustom.kulit]),
        ubah: siklus('kulit', PALET_KULIT.length),
      },
      { teks: 'Gaya', kanan: NAMA_GAYA_RAMBUT[dt.kustom.gaya], ubah: siklus('gaya', NAMA_GAYA_RAMBUT.length) },
      {
        teks: 'Rambut',
        kanan: `${dt.kustom.rambut + 1}/${PALET_RAMBUT.length}`,
        warna: warnaInt(PALET_RAMBUT[dt.kustom.rambut]),
        ubah: siklus('rambut', PALET_RAMBUT.length),
      },
      {
        teks: 'Baju',
        kanan: `${dt.kustom.baju + 1}/${PALET_BAJU.length}`,
        warna: warnaInt(PALET_BAJU[dt.kustom.baju]),
        ubah: siklus('baju', PALET_BAJU.length),
      },
    ]
    if (debug) {
      baris.push({ pemisah: true, teks: 'Mode debug: berlaku tanpa batasan.', warna: WARNA.emas })
      baris.push({ teks: 'Terapkan', aksi: () => ui.api().adminAtur(dt.kelas, dt.kustom) })
    } else {
      baris.push({ pemisah: true, teks: 'Role tidak bisa diganti!', warna: WARNA.bahaya })
      baris.push({
        teks: `${dt.paham ? '[x]' : '[ ]'} Saya mengerti`,
        aksi: () => {
          dt.paham = !dt.paham
          ui.render()
        },
      })
      baris.push({
        teks: 'Mulai petualangan',
        aktif: dt.paham,
        alasan: 'Centang "Saya mengerti" dulu.',
        aksi: () => ui.api().buatKarakter(dt.kelas, dt.kustom),
      })
    }
    return {
      judul: debug ? 'Debug: penampilan dan role' : 'Buat karakter',
      pratinjau: ui.pratinjauKarakter(dt.kelas, dt.kustom),
      info: [{ t: `${kelas.nama}: ${kelas.deskripsi}`, warna: WARNA.redup }],
      baris,
      kaki: 'Kiri/kanan: ubah · A: pilih',
    }
  },

    dungeon(ui) {
    const lv = ui.status().pemain.level
    return {
      judul: 'Kripta Lich Agung',
      paragraf: [
        'Reruntuhan kuno penyimpan harta langka, dijaga Lich Agung dengan kekuatan setara naga.',
        'Kripta hanya bisa dimasuki sendirian. Tiap masuk membuat kripta baru, maksimal 3 kali sehari.',
        'Kalau kamu gugur, perjalanan gagal. Ada satu mata air penyembuh dekat ruang bos. Ambil semua peti sebelum keluar.',
        `Disarankan level 8 ke atas (kamu level ${lv}).`,
      ],
      baris: [
        {
          teks: 'Masuk kripta',
          aktif: lv >= 8,
          alasan: 'Butuh level 8.',
          aksi: async () => {
            const ok = await ui.api().dungeonMasuk()
            if (ok) ui.tutupSemua()
          },
        },
        { teks: 'Batal', aksi: () => ui.kembali() },
      ],
    }
  },

  keluarDungeon(ui) {
    return {
      judul: 'Keluar dari kripta?',
      paragraf: ['Perjalananmu di kripta berakhir dan tidak bisa dilanjutkan. Pastikan semua peti sudah diambil.'],
      baris: [
        {
          teks: 'Ya, keluar',
          aksi: async () => {
            const ok = await ui.api().dungeonKeluar()
            if (ok) ui.tutupSemua()
          },
        },
        { teks: 'Batal', aksi: () => ui.kembali() },
      ],
    }
  },

  hadiah(ui, ent) {
    const { judul, gold, loot } = ent.param
    const baris = []
    if (gold) baris.push({ teks: 'Gold', kanan: `+${rupiah(gold)}`, warnaKanan: WARNA.emas })
    for (const l of loot ?? []) {
      baris.push({
        teks: `${l.item} x${l.jumlah}`,
        ikon: ui.ikon(cari(ui.katalog(), l.item_id)),
        kanan: l.ganti_gold ? `duplikat +${l.ganti_gold} g` : l.langka ? 'LANGKA!' : '',
        warnaKanan: l.langka ? WARNA.emas : WARNA.hijau,
      })
    }
    baris.push({ teks: 'Tutup', aksi: () => ui.kembali() })
    return { kecil: true, lebar: 360, judul, baris }
  },

}