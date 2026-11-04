import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import KontrolGB from '../components/KontrolGB'
import PanelChat from '../components/PanelChat'
import { suara } from '../game/suara'
import {
  adminAturKarakter, adminPakai, ambilDunia, ambilKatalog, ambilMisi, beli, buatKarakter, diserang,
  forageBatal, forageMulai, forageSelesai, jual, kirimHadiah, klaimMisi, masukGame, pakai, panen,
  serang, tambahPoin, tanam, upgradeRumah, dungeonDiserang, dungeonKeluar, dungeonMasuk, dungeonPeti, dungeonPulih, dungeonSerang,
} from '../lib/gameAPI'
import { useAktivitas, useChat, useMultiplayer } from '../lib/useMultiplayer'
import { useModeHP } from '../lib/useModeHP'
import { useAuth, useSesi } from '../lib/useSesi'
import { gabungMusuh } from '../game/dungeon'

const SENYAP = ['Terlalu cepat', 'Kamu sedang menunggu respawn', 'Musuh ini sudah mati']

function tierAlat(status, katalog, jenis) {
  let t = 0
  for (const i of status.inventaris) {
    const a = katalog.alat?.find((x) => x.item_id === i.item_id && x.jenis === jenis)
    if (a && i.jumlah > 0 && a.tier > t) t = a.tier
  }
  return t
}

function ringkasKill(h) {
  const naik = h.level_naik > 0 ? ' Naik level! Kamu mendapat 3 poin.' : ''
  if (h.jenis === 'bos') {
    return h.berhadiah
      ? `${h.nama} dikalahkan! Hadiahmu: +${h.xp} XP, +${h.gold} gold.${naik}`
      : `${h.nama} dikalahkan! Kontribusimu belum cukup untuk mendapat hadiah.`
  }
  if (!h.berhadiah) return `${h.nama} dikalahkan, tapi jatah hadiah hari ini sudah habis.`
  return `${h.nama} dikalahkan: +${h.xp} XP, +${h.gold} gold.${naik}`
}

function teksMp(status, diizinkan, afk) {
  if (!diizinkan) return 'Mode multiplayer sedang dinonaktifkan.'
  if (afk) return 'Kamu tidak aktif, jadi koneksi multiplayer dijeda. Gerak atau klik untuk bergabung lagi.'
  if (status.jenis === 'terhubung') return `Ruang ${status.ruang} · ${status.jumlah} pemain online`
  if (status.jenis === 'penuh') return 'Semua ruang penuh. Kamu tetap bisa bermain tanpa melihat pemain lain.'
  if (status.jenis === 'gagal') return 'Gagal tersambung ke multiplayer. Muat ulang halaman untuk mencoba lagi.'
  return 'Menyambung ke multiplayer…'
}

// Bentuk data "dunia" untuk kripta, supaya scene memakai sistem musuh yang sama
function duniaDungeon(d, st) {
  return {
    spawn: gabungMusuh(d.musuh),
    peti: d.peti,
    boss_kalah: d.boss_kalah,
    waktu_server: st?.waktu_server,
    forage: { kosong: [] },
    sumbangan_bos: 0,
  }
}

export default function GamePage() {
  const navigate = useNavigate()
  const sesi = useSesi()
  const userId = sesi?.user.id ?? null
  const { profil } = useAuth()
  const admin = profil?.peran === 'admin'
  const modeHP = useModeHP()
  const { tampak, afk } = useAktivitas()

  const [tahap, setTahap] = useState('memuat') // memuat | karakter | siap | gagal
  const [kesalahan, setKesalahan] = useState('')
  const [status, setStatus] = useState(null)
  const [dunia, setDunia] = useState(null)
  const [selisih, setSelisih] = useState(0)
  const [katalog, setKatalog] = useState(null)
  const [awalKarakter, setAwalKarakter] = useState(null)
  const [peta, setPeta] = useState('server')
  const [sibuk, setSibuk] = useState(false)
  const [sekitar, setSekitar] = useState([])
  const [sekarang, setSekarang] = useState(() => Date.now())
  const [chatBuka, setChatBuka] = useState(false)
  const [idDibaca, setIdDibaca] = useState(0)
  const [dungeon, setDungeon] = useState(null)
  
  const petaRef = useRef('server')
  const wadah = useRef(null)
  const gameRef = useRef(null)
  const kontrol = useRef({ kiri: false, kanan: false, atas: false, bawah: false, aksi: false, serang: false })
  const statusRef = useRef(null)
  const duniaRef = useRef(null)
  const katalogRef = useRef(null)
  const adminRef = useRef(false)
  const awalRef = useRef(null)
  const aksiRef = useRef(null)
  const serangRef = useRef(null)
  const diserangRef = useRef(null)
  const batalForageRef = useRef(null)
  const forageRef = useRef(null)
  const forageTimer = useRef(null)
  const segarkanMati = useRef(false)
  const alatRef = useRef({ beliung: 0, sabit: 0 })
  const emasLalu = useRef(null)
  const levelLalu = useRef(null)
  const apiRef = useRef({})
  const mpApi = useRef({})
  // Jembatan stabil ke fungsi terbaru: dipakai jendela di dalam game
  const [apiStabil] = useState(
    () => new Proxy({}, { get: (_, nama) => (...args) => apiRef.current[nama]?.(...args) }),
  )

  const mpDiizinkan = dunia?.mp?.aktif ?? false
  const chatDiizinkan = dunia?.mp?.chat ?? false
  const adaRekan = sekitar.length > 0
  const { status: statusMp, kirimPosisi, sinkron } = useMultiplayer({
    userId,
    aktif: tahap === 'siap' && peta === 'server' && mpDiizinkan && tampak && !afk,
    maks: dunia?.mp?.maks ?? 12,
    gameRef,
  })
  const chat = useChat({
    aktif: tahap === 'siap' && peta === 'server' && chatDiizinkan && tampak,
    gameRef,
    onStatus: terapkan,
  })

  const idTerakhir = chat.pesan.length > 0 ? chat.pesan[chat.pesan.length - 1].id : 0
  const belumBaca = chatBuka ? 0 : chat.pesan.filter((m) => m.id > idDibaca && m.penulis_id !== userId).length

  function alihChat() {
    setIdDibaca(idTerakhir)
    setChatBuka((b) => !b)
  }

  function terapkan(st) {
    setStatus(st)
    setSelisih(Date.parse(st.waktu_server) - Date.now())
  }

  function terapkanDunia(d) {
    setDunia(d)
    setStatus(d.status)
    setSelisih(Date.parse(d.waktu_server) - Date.now())
  }

  function info(teks) {
    if (teks) gameRef.current?.events.emit('toast', teks)
  }

  function scene() {
    return gameRef.current?.scene.getScene('dunia')
  }

  // ---------- Data awal ----------
  useEffect(() => {
    let batal = false
    Promise.all([masukGame(), ambilKatalog()])
      .then(([st, kat]) => {
        if (batal) return
        setKatalog(kat)
        if (st.perlu_karakter) {
          setAwalKarakter(
            st.baru
              ? { nama: st.nama, kelas: 'ksatria', kustom: null }
              : { nama: st.pemain.nama, kelas: st.pemain.kelas.id, kustom: st.pemain.kustom },
          )
          if (!st.baru) terapkan(st)
          setTahap('karakter')
          return
        }
        terapkan(st)
        setTahap('siap')
      })
      .catch((err) => {
        if (batal) return
        setKesalahan(err.message)
        setTahap('gagal')
      })
    return () => {
      batal = true
    }
  }, [])

  useEffect(() => {
    statusRef.current = status
    duniaRef.current = dunia
    katalogRef.current = katalog
    adminRef.current = admin
    awalRef.current = awalKarakter
  })

  useEffect(() => {
    const t = setInterval(() => setSekarang(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  // Cegah halaman bergulir oleh tombol panah dan spasi saat bermain
  useEffect(() => {
    function cegah(e) {
      const tag = document.activeElement?.tagName
      if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(tag)) return
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault()
    }
    window.addEventListener('keydown', cegah)
    return () => window.removeEventListener('keydown', cegah)
  }, [])

  // Keadaan dunia (musuh bersama): tiap 3 detik jika ada pemain lain di dekatmu, selain itu 8 detik
  useEffect(() => {
    if (tahap !== 'siap' || peta !== 'server') return
    let batal = false
    function muat() {
      if (document.visibilityState !== 'visible') return
      ambilDunia()
        .then((d) => {
          if (!batal) terapkanDunia(d)
        })
        .catch(() => {
          // abaikan, dicoba lagi pada putaran berikutnya
        })
    }
    muat()
    const t = setInterval(muat, adaRekan ? 3000 : 8000)
    return () => {
      batal = true
      clearInterval(t)
    }
  }, [tahap, peta, adaRekan])

  // ---------- Phaser ----------
  useEffect(() => {
    if ((tahap !== 'siap' && tahap !== 'karakter') || !wadah.current) return
    let batal = false
    let game = null
    import('../game/mulaiGame').then(({ buatGame }) => {
      if (batal || !wadah.current) return
      game = buatGame(wadah.current, {
        mode: tahap === 'karakter' ? 'karakter' : 'dunia',
        kontrol: kontrol.current,
        status: statusRef.current,
        userId,
        katalog: katalogRef.current,
        admin: adminRef.current,
        karakterAwal: awalRef.current,
        api: apiStabil,
      })
      gameRef.current = game
      game.registry.set('dunia', duniaRef.current)
      game.registry.set('alat', alatRef.current)
      game.registry.set('waktuPaksa', null)
      game.events.on('interaksi', (o) => aksiRef.current?.(o))
      game.events.on('serang', (id) => serangRef.current?.(id))
      game.events.on('diserang', (id) => diserangRef.current?.(id))
      game.events.on('posisi-saya', (d) => mpApi.current.kirimPosisi?.(d))
      game.events.on('pemain-sekitar', (d) => setSekitar(d))
      game.events.on('forage-batal', () => batalForageRef.current?.())
      game.events.on('peta', (nama) => {
        if (nama !== 'dungeon') setDungeon(null)
        batalForageRef.current?.()
        setPeta(nama)
        if (nama === 'server') setTimeout(() => mpApi.current.sinkron?.(), 80)
      })
    })
    return () => {
      batal = true
      game?.destroy(true)
      gameRef.current = null
    }
  }, [tahap, userId, apiStabil])

  // Kirim data terbaru ke game
  useEffect(() => {
    const game = gameRef.current
    if (!game || !status) return
    game.registry.set('selisihWaktu', selisih)
    game.registry.set('status', status)
    game.registry.set('mati', Boolean(status.pemain.mati_sampai))
    game.registry.set('jedaSerang', status.pemain.jeda_serang_ms)
    game.registry.set('kelas', status.pemain.kelas)
    game.registry.set('kustom', status.pemain.kustom)
    if (katalog) {
      alatRef.current = {
        beliung: tierAlat(status, katalog, 'beliung'),
        sabit: tierAlat(status, katalog, 'sabit'),
      }
      game.registry.set('alat', alatRef.current)
    }
  }, [status, selisih, katalog])

  useEffect(() => {
    const game = gameRef.current
    if (!game) return
    if (peta === 'dungeon') {
      if (dungeon && status) game.registry.set('dunia', duniaDungeon(dungeon, status))
    } else if (dunia) {
      game.registry.set('dunia', dunia)
    }
  }, [dunia, dungeon, peta, status])

  useEffect(() => {
    const game = gameRef.current
    if (!game) return
    game.registry.set('sibuk', sibuk)
    game.registry.set('terkunci', sibuk)
  }, [sibuk])

  // Waktu gugur habis: ambil status terbaru supaya pemain bangkit
  useEffect(() => {
    if (!status?.pemain.mati_sampai || segarkanMati.current) return
    if (Date.parse(status.pemain.mati_sampai) - (sekarang + selisih) > 0) return
    segarkanMati.current = true
    ambilDunia()
      .then(terapkanDunia)
      .catch(() => {
        // abaikan, dicoba lagi pada detik berikutnya
      })
      .finally(() => {
        segarkanMati.current = false
      })
  }, [sekarang, status, selisih])

  // ---------- Suara ----------
  useEffect(() => {
    if (tahap === 'siap' || tahap === 'karakter') suara.mulaiMusik()
  }, [tahap])
  useEffect(() => () => suara.hentikanMusik(), [])

  useEffect(() => {
    function tekan(e) {
      if (e.code !== 'KeyM' || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return
      const tag = document.activeElement?.tagName
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return
      suara.setNyala(!suara.cuplikan().nyala)
    }
    window.addEventListener('keydown', tekan)
    return () => window.removeEventListener('keydown', tekan)
  }, [])

  useEffect(() => {
    if (!status) return
    const { gold, level } = status.pemain
    if (levelLalu.current !== null && level > levelLalu.current) suara.sfx('levelup')
    else if (emasLalu.current !== null && gold > emasLalu.current) suara.sfx('koin')
    else if (emasLalu.current !== null && gold < emasLalu.current) suara.sfx('beli')
    levelLalu.current = level
    emasLalu.current = gold
  }, [status])

  // ---------- Mode HP ----------
  useEffect(() => {
    if (!modeHP) return
    const bodyLama = document.body.style.overflow
    const htmlLama = document.documentElement.style.overscrollBehavior
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overscrollBehavior = 'none'
    return () => {
      document.body.style.overflow = bodyLama
      document.documentElement.style.overscrollBehavior = htmlLama
    }
  }, [modeHP])

  useEffect(() => {
    function segarkan() {
      setTimeout(() => gameRef.current?.scale.refresh(), 150)
    }
    window.addEventListener('orientationchange', segarkan)
    window.addEventListener('resize', segarkan)
    return () => {
      window.removeEventListener('orientationchange', segarkan)
      window.removeEventListener('resize', segarkan)
    }
  }, [])

  useEffect(() => () => clearTimeout(forageTimer.current), [])

  // ---------- Aksi ke server ----------
  async function jalankan(fungsi, pesanSukses) {
    setSibuk(true)
    try {
      const hasil = await fungsi()
      terapkan(hasil.status ?? hasil)
      if (pesanSukses) info(pesanSukses)
      return hasil
    } catch (err) {
      info(err.message)
      return null
    } finally {
      setSibuk(false)
    }
  }

  function segarkanDunia() {
    ambilDunia()
      .then(terapkanDunia)
      .catch(() => {
        // abaikan
      })
  }

    function perbaruiDungeon(d) {
    setDungeon(d)
    if (statusRef.current) gameRef.current?.registry.set('dunia', duniaDungeon(d, statusRef.current))
  }

  async function serangDungeon(idx) {
    suara.sfx(statusRef.current?.pemain.kelas.id === 'penyihir' ? 'sihir' : 'tebas')
    try {
      const r = await dungeonSerang(idx)
      terapkan(r.status)
      perbaruiDungeon(r.dungeon)
      gameRef.current?.events.emit('target', { nama: r.hasil.nama, hp: r.hasil.hp, hp_maks: r.hasil.hp_maks })
      scene()?.tampilkanPukulan(idx, r.hasil)
      suara.sfx(r.hasil.mati ? 'bunuh' : 'pukul')
      if (r.balasan) {
        scene()?.tampilkanLuka(r.balasan)
        suara.sfx(r.balasan.mati ? 'gugur' : 'kena')
      }
      if (r.hasil.mati) {
        info(ringkasKill(r.hasil))
        if (r.hasil.jenis === 'bos') gameRef.current?.events.emit('hadiah', { judul: 'Lich Agung dikalahkan!', loot: r.loot })
      }
      if (r.balasan?.mati) info('Kamu gugur di kripta! Perjalanan dinyatakan gagal.')
    } catch (err) {
      if (SENYAP.includes(err.message)) return
      info(err.message)
    }
  }

  async function diserangDungeon(idx) {
    try {
      const r = await dungeonDiserang(idx)
      terapkan(r.status)
      perbaruiDungeon(r.dungeon)
      scene()?.tampilkanLuka(r.hasil)
      suara.sfx(r.hasil.mati ? 'gugur' : 'kena')
      if (r.hasil.mati) info('Kamu gugur di kripta! Perjalanan dinyatakan gagal.')
    } catch (err) {
      if (SENYAP.includes(err.message)) return
      info(err.message)
    }
  }

  async function serangMusuh(id) {
    if (petaRef.current === 'dungeon') return serangDungeon(id)
    suara.sfx(statusRef.current?.pemain.kelas.id === 'penyihir' ? 'sihir' : 'tebas')
    try {
      const { hasil, balasan, spawn, status: st } = await serang(id)
      setDunia(
        (d) =>
          d && {
            ...d,
            spawn: d.spawn.map((s) => (s.id === spawn.id ? spawn : s)),
            sumbangan_bos: hasil.jenis === 'bos' ? hasil.sumbangan : d.sumbangan_bos,
          },
      )
      terapkan(st)
      gameRef.current?.events.emit('target', { nama: hasil.nama, hp: hasil.hp, hp_maks: hasil.hp_maks })
      scene()?.tampilkanPukulan(spawn.id, hasil)
      suara.sfx(hasil.mati ? 'bunuh' : 'pukul')
      if (balasan) {
        scene()?.tampilkanLuka(balasan)
        suara.sfx(balasan.mati ? 'gugur' : 'kena')
        batalForage()
      }
      if (hasil.mati) info(ringkasKill(hasil))
      if (balasan?.mati) info('Kamu gugur! Kamu akan hidup kembali dalam 5 menit.')
    } catch (err) {
      if (SENYAP.includes(err.message)) return
      info(err.message)
      segarkanDunia()
    }
  }

  async function diserangMusuh(id) {
    if (petaRef.current === 'dungeon') return diserangDungeon(id)
    try {
      const { hasil, status: st } = await diserang(id)
      terapkan(st)
      batalForage()
      scene()?.tampilkanLuka(hasil)
      suara.sfx(hasil.mati ? 'gugur' : 'kena')
      if (hasil.mati) info('Kamu gugur! Kamu akan hidup kembali dalam 5 menit.')
    } catch (err) {
      if (SENYAP.includes(err.message)) return
      info(err.message)
    }
  }

  // ---------- Mengumpulkan bahan ----------
  function bersihForage() {
    clearTimeout(forageTimer.current)
    forageTimer.current = null
    forageRef.current = null
    gameRef.current?.registry.set('forage', null)
  }

  async function selesaiForage(boleh) {
    const f = forageRef.current
    if (!f) return
    try {
      const h = await forageSelesai()
      bersihForage()
      terapkan(h.status)
      setDunia(
        (d) =>
          d && {
            ...d,
            forage: {
              ...d.forage,
              tambang: h.tambang,
              tumbuhan: h.tumbuhan,
              hari_ini: h.hari_ini,
              kosong: [...d.forage.kosong.filter((k) => k.id !== f.id), { id: f.id, siap_pada: h.siap_pada }],
            },
          },
      )
      scene()?.tampilkanForage(f.id, `+${h.jumlah} ${h.item}`)
      suara.sfx('ambil')
      info(`+${h.jumlah} ${h.item}, +${h.xp} XP${h.level_naik > 0 ? '. Naik level! Kamu mendapat 3 poin.' : ''}`)
    } catch (err) {
      if (err.message === 'Belum selesai' && boleh) {
        forageTimer.current = setTimeout(() => selesaiForage(false), 700)
        return
      }
      bersihForage()
      info(err.message)
    }
  }

  async function mulaiForage(id) {
    if (forageRef.current) return
    try {
      const r = await forageMulai(id)
      const f = { id, nama: r.nama, jenis: r.jenis, mulai: Date.now(), durasi: r.durasi_ms }
      forageRef.current = f
      gameRef.current?.registry.set('forage', f)
      forageTimer.current = setTimeout(() => selesaiForage(true), r.durasi_ms + 150)
    } catch (err) {
      info(err.message)
    }
  }

  function batalForage() {
    if (!forageRef.current) return
    bersihForage()
    forageBatal().catch(() => {
      // abaikan, status di server dibersihkan saat mulai berikutnya
    })
  }

  // Jendela, toko, dan dialog ditangani di dalam game; di sini hanya titik pengumpulan
  function aksi(o) {
    if (sibuk || !status || status.pemain.mati_sampai) return
    if (gameRef.current?.registry.get('uiBuka')) return
    if (o.jenis === 'forage') mulaiForage(o.id)
  }

  useEffect(() => {
    aksiRef.current = aksi
    serangRef.current = serangMusuh
    diserangRef.current = diserangMusuh
    batalForageRef.current = batalForage
    mpApi.current = { kirimPosisi, sinkron }
    petaRef.current = peta
    apiRef.current = {
      pakai: (id) => jalankan(() => pakai(id), 'Item dipakai.'),
      beli: (id, n) => jalankan(() => beli(id, n), 'Pembelian berhasil.'),
      jual: (id, n) => jalankan(() => jual(id, n), 'Terjual.'),
      tambahPoin: (jenis) => jalankan(() => tambahPoin(jenis, 1), 'Poin ditambahkan.'),
      tanam: (i, t) => jalankan(() => tanam(i, t), 'Bibit ditanam.'),
      panen: (i) => jalankan(() => panen(i), 'Panen berhasil! Hasilnya masuk ke inventaris.'),
      upgradeRumah: () => jalankan(() => upgradeRumah(), 'Rumah di-upgrade!'),
      kirimHadiah: (penerima, item, n) =>
        jalankan(() => kirimHadiah(penerima, item, n), 'Hadiah terkirim. Penerima mengambilnya lewat chat pribadi (berlaku 15 menit).'),
      adminPakai: (id) => jalankan(() => adminPakai(id), 'Perlengkapan dipakai (gratis).'),
      adminAtur: (kelas, kustom) => jalankan(() => adminAturKarakter(kelas, kustom), 'Karakter diperbarui.'),
      ambilMisi: async () => {
        try {
          return await ambilMisi()
        } catch (err) {
          info(err.message)
          return null
        }
      },
      klaimMisi: async (id) => {
        const h = await jalankan(() => klaimMisi(id))
        if (!h) return null
        info(
          `Misi selesai: ${h.judul}. +${h.xp} XP, +${h.gold} gold${
            h.level_naik > 0 ? '. Naik level! Kamu mendapat 3 poin.' : ''
          }`,
        )
        return h.misi
      },
      buatKarakter: async (kelas, kustom) => {
        setSibuk(true)
        try {
          terapkan(await buatKarakter(kelas, kustom))
          setTahap('siap')
        } catch (err) {
          info(err.message)
        }
        setSibuk(false)
      },
      keluar: () => navigate('/'),

            dungeonMasuk: async () => {
        setSibuk(true)
        try {
          const d = await dungeonMasuk()
          setDungeon(d)
          gameRef.current?.registry.set('dunia', duniaDungeon(d, statusRef.current))
          scene()?.scene.restart({ peta: 'dungeon' })
          return true
        } catch (err) {
          info(err.message)
          return false
        } finally {
          setSibuk(false)
        }
      },
      dungeonKeluar: async () => {
        try {
          await dungeonKeluar()
        } catch (err) {
          info(err.message)
          return false
        }
        setDungeon(null)
        scene()?.scene.restart({ peta: 'server', mulai: { x: 1990, y: 640 } })
        return true
      },
      dungeonPeti: async (idx) => {
        try {
          const r = await dungeonPeti(idx)
          terapkan(r.status)
          perbaruiDungeon(r.dungeon)
          suara.sfx('koin')
          return r
        } catch (err) {
          info(err.message)
          return null
        }
      },
      dungeonPulih: () => jalankan(() => dungeonPulih(), 'HP-mu pulih sepenuhnya!'),

    }
  })

  // ---------- Tombol layar sentuh ----------
  function aturArah(arah) {
    Object.assign(kontrol.current, arah)
  }
  function tekanA() {
    const game = gameRef.current
    if (game?.registry.get('uiBuka')) game.events.emit('tombol', 'A')
    else kontrol.current.serang = true
  }
  function tekanB() {
    const game = gameRef.current
    if (game?.registry.get('uiBuka')) game.events.emit('tombol', 'B')
    else kontrol.current.aksi = true
  }
  function tekanMenu() {
    gameRef.current?.events.emit('tombol', 'START')
  }

  if (tahap === 'memuat') return <p className="redup">Memuat game…</p>
  if (tahap === 'gagal') {
    return (
      <>
        <p role="alert">Game gagal dimuat: {kesalahan}</p>
        <Link to="/">Kembali ke beranda</Link>
      </>
    )
  }

  return (
    <>
      {!modeHP && <h1>Game</h1>}
      <div className={`game-area${modeHP ? ' gb-rangka' : ''}`}>
        <div className="layout-game">
          <div className="game-bingkai">
            <div ref={wadah} className="game-kanvas" />
          </div>

          <aside className={`layout-chat${chatBuka ? ' terbuka' : ''}`} aria-label="Chat">
            {modeHP && (
              <button type="button" className="tombol kecil gb-tutup-chat" onClick={alihChat}>
                Tutup chat
              </button>
            )}
            {tahap !== 'siap' ? (
              <div className="game-chat">
                <p className="redup kecil">Chat tersedia setelah karaktermu dibuat.</p>
              </div>
            ) : peta !== 'server' ? (
              <div className="game-chat">
                <p className="redup kecil">
                                    Chat dan pemain lain hanya ada di kerajaan (dunia bersama). Rumah pribadi dan kripta hanya milikmu..
                </p>
              </div>
            ) : chatDiizinkan ? (
              <PanelChat
                info={
                  teksMp(statusMp, dunia ? mpDiizinkan : true, afk) +
                  (import.meta.env.DEV && userId ? ` · id ${userId.slice(0, 6)}` : '')
                }
                pesan={chat.pesan}
                hadiah={chat.hadiah}
                kesalahan={chat.kesalahan}
                userId={userId}
                katalog={katalog}
                sekitar={sekitar}
                admin={admin}
                onKirim={chat.kirim}
                onAksiHadiah={chat.aksiHadiah}
                onHapus={chat.hapus}
                onBisu={chat.bisu}
              />
            ) : (
              <div className="game-chat">
                <p className="redup kecil">{dunia ? 'Chat sedang dinonaktifkan.' : 'Memuat chat…'}</p>
              </div>
            )}
          </aside>
        </div>

        <KontrolGB
          onArah={aturArah}
          onSerang={tekanA}
          onAksi={tekanB}
          onMenu={tekanMenu}
          onObrol={alihChat}
          belumBaca={belumBaca}
        />

        {!modeHP && (
          <p className="redup kecil game-petunjuk">
            Gerak: WASD / panah · Serang: klik atau Spasi · Aksi: E · Menu: Esc · Suara: M
          </p>
        )}
      </div>
    </>
  )
}