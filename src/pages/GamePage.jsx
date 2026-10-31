import { Fragment, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ambilDunia,
  ambilKatalog,
  ambilMisi,
  klaimMisi,
  pilihKelas,
  beli,
  diserang,
  jual,
  masukGame,
  panen,
  pakai,
  serang,
  tambahPoin,
  tanam,
  upgradeRumah,
  kirimHadiah,
  forageBatal,
  forageMulai,
  forageSelesai,
} from '../lib/gameAPI'
import HudGame from '../components/HudGame'
import PanelChat from '../components/PanelChat'
import { useAktivitas, useChat, useMultiplayer } from '../lib/useMultiplayer'
import { useAuth, useSesi } from '../lib/useSesi'

const format = (n) => n.toLocaleString('id-ID')
const SENYAP = ['Terlalu cepat', 'Kamu sedang menunggu respawn', 'Musuh ini sudah mati']

function formatDurasi(detik) {
  if (detik >= 3600) return `${Math.round(detik / 3600)} jam`
  if (detik >= 60) return `${Math.round(detik / 60)} menit`
  return `${detik} detik`
}

function formatSisa(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const dua = (n) => String(n).padStart(2, '0')
  return `${dua(Math.floor(total / 3600))}:${dua(Math.floor((total % 3600) / 60))}:${dua(total % 60)}`
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

const NAMA_TIER = ['', 'perunggu', 'perak', 'emas', 'berlian', 'obsidian', 'mitril']

function tierAlat(status, katalog, jenis) {
  let t = 0
  for (const i of status.inventaris) {
    const a = katalog.alat?.find((x) => x.item_id === i.item_id && x.jenis === jenis)
    if (a && i.jumlah > 0 && a.tier > t) t = a.tier
  }
  return t
}


export default function GamePage() {
  const [tahap, setTahap] = useState('memuat') // memuat | siap | gagal
  const [kesalahan, setKesalahan] = useState('')
  const [status, setStatus] = useState(null)
  const [dunia, setDunia] = useState(null)
  const [selisih, setSelisih] = useState(0)
  const [katalog, setKatalog] = useState(null)
  const [peta, setPeta] = useState('server')
  const [panel, setPanel] = useState(null) // inventaris | status | toko | rumah | tanam
  const [indeksPetak, setIndeksPetak] = useState(null)
  const [sibuk, setSibuk] = useState(false)
  const [catatan, setCatatan] = useState('')
  const [target, setTarget] = useState(null)
  const [sekitar, setSekitar] = useState([])
  const [forage, setForage] = useState(null)
  const [misi, setMisi] = useState(null)
  const [aman, setAman] = useState(false)
  const forageRef = useRef(null)
  const forageTimer = useRef(null)
  const batalForageRef = useRef(null)
  const alatRef = useRef({ beliung: 0, sabit: 0 })
  const adaRekan = sekitar.length > 0
  const [sekarang, setSekarang] = useState(() => Date.now())

  const wadah = useRef(null)
  const gameRef = useRef(null)
  const kontrol = useRef({ kiri: false, kanan: false, atas: false, bawah: false, aksi: false, serang: false })
  const statusRef = useRef(null)
  const duniaRef = useRef(null)
  const aksiRef = useRef(null)
  const serangRef = useRef(null)
  const diserangRef = useRef(null)
  const segarkanMati = useRef(false)

    const sesi = useSesi()
  const userId = sesi?.user.id ?? null
  const { profil } = useAuth()
  const { tampak, afk } = useAktivitas()
  const mpDiizinkan = dunia?.mp?.aktif ?? false
  const chatDiizinkan = dunia?.mp?.chat ?? false
  const {
    status: statusMp,
    kirimPosisi,
    sinkron,
  } = useMultiplayer({
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
  const mpApi = useRef({})

  useEffect(() => {
    mpApi.current = { kirimPosisi, sinkron }
  })


  function terapkan(st) {
    setStatus(st)
    setSelisih(Date.parse(st.waktu_server) - Date.now())
  }

  function terapkanDunia(d) {
    setDunia(d)
    setStatus(d.status)
    setSelisih(Date.parse(d.waktu_server) - Date.now())
  }

  // Muat data awal
  useEffect(() => {
    let batal = false
    Promise.all([masukGame(), ambilKatalog()])
      .then(([st, kat]) => {
        if (batal) return
        terapkan(st)
        setKatalog(kat)
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
  }, [status])

  useEffect(() => {
    duniaRef.current = dunia
  }, [dunia])

  // Jam untuk hitung mundur
  useEffect(() => {
    const t = setInterval(() => setSekarang(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  // Pesan sementara dan panel target hilang sendiri
  useEffect(() => {
    if (!catatan) return
    const t = setTimeout(() => setCatatan(''), 6000)
    return () => clearTimeout(t)
  }, [catatan])

  useEffect(() => {
    if (!target) return
    const t = setTimeout(() => setTarget(null), 6000)
    return () => clearTimeout(t)
  }, [target])

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

    // Ambil keadaan dunia (musuh bersama): tiap 3 detik jika ada pemain lain di ruang, selain itu 8 detik
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

    // Jalankan Phaser (dimuat malas)
  useEffect(() => {
    if (tahap !== 'siap' || !wadah.current) return
    let batal = false
    let game = null
    import('../game/mulaiGame').then(({ buatGame }) => {
      if (batal || !wadah.current) return
      game = buatGame(wadah.current, { kontrol: kontrol.current, status: statusRef.current, userId })
      gameRef.current = game
      game.registry.set('dunia', duniaRef.current)
      game.registry.set('alat', alatRef.current)
      game.events.on('interaksi', (o) => aksiRef.current?.(o))
      game.events.on('serang', (id) => serangRef.current?.(id))
      game.events.on('diserang', (id) => diserangRef.current?.(id))
      game.events.on('posisi-saya', (d) => mpApi.current.kirimPosisi?.(d))
      game.events.on('pemain-sekitar', (d) => setSekitar(d))
      game.events.on('forage-batal', () => batalForageRef.current?.())
      game.events.on('zona-aman', (v) => setAman(v))
      game.events.on('peta', (nama) => {
        batalForageRef.current?.()
        setPeta(nama)
        // Beri waktu scene selesai dibuat sebelum pemain lain diisi ulang
        if (nama === 'server') setTimeout(() => mpApi.current.sinkron?.(), 80)
      })
    })
    return () => {
      batal = true
      game?.destroy(true)
      gameRef.current = null
    }
  }, [tahap, userId])

    // Tier alat tertinggi dikirim ke game (untuk petunjuk "butuh beliung")
  useEffect(() => {
    if (!status || !katalog) return
    alatRef.current = {
      beliung: tierAlat(status, katalog, 'beliung'),
      sabit: tierAlat(status, katalog, 'sabit'),
    }
    gameRef.current?.registry.set('alat', alatRef.current)
  }, [status, katalog])

  // Hentikan penghitung foraging saat halaman ditutup
  useEffect(() => () => clearTimeout(forageTimer.current), [])


  // Kirim status dan keadaan dunia terbaru ke game
  useEffect(() => {
    const game = gameRef.current
    if (!game || !status) return
    game.registry.set('selisihWaktu', selisih)
    game.registry.set('status', status)
    game.registry.set('mati', Boolean(status.pemain.mati_sampai))
    game.registry.set('jedaSerang', status.pemain.jeda_serang_ms)
    game.registry.set('kelas', status.pemain.kelas)
  }, [status, selisih])

  useEffect(() => {
    const game = gameRef.current
    if (!game || !dunia) return
    game.registry.set('dunia', dunia)
  }, [dunia])

  // Kunci gerakan saat panel terbuka atau ada proses berjalan
  useEffect(() => {
    gameRef.current?.registry.set('terkunci', Boolean(panel) || sibuk)
  }, [panel, sibuk])

  // Waktu tunggu gugur habis: ambil status terbaru supaya pemain bangkit
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

  async function jalankan(fungsi, pesanSukses) {
    setSibuk(true)
    try {
      const hasil = await fungsi()
      terapkan(hasil.status ?? hasil)
      if (pesanSukses) setCatatan(pesanSukses)
    } catch (err) {
      setCatatan(err.message)
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

  function scene() {
    return gameRef.current?.scene.getScene('dunia')
  }

  async function serangMusuh(id) {
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
      setTarget({ nama: hasil.nama, hp: hasil.hp, hp_maks: hasil.hp_maks })
      scene()?.tampilkanPukulan(spawn.id, hasil)
      if (balasan) scene()?.tampilkanLuka(balasan)
      if (balasan) batalForage()
      if (hasil.mati) setCatatan(ringkasKill(hasil))
      if (balasan?.mati) setCatatan('Kamu gugur! Kamu akan hidup kembali dalam 5 menit.')
    } catch (err) {
      if (SENYAP.includes(err.message)) return
      setCatatan(err.message)
      segarkanDunia()
    }
  }

  async function diserangMusuh(id) {
    try {
      const { hasil, status: st } = await diserang(id)
      terapkan(st)
      batalForage()
      scene()?.tampilkanLuka(hasil)
      if (hasil.mati) setCatatan('Kamu gugur! Kamu akan hidup kembali dalam 5 menit.')
    } catch (err) {
      if (SENYAP.includes(err.message)) return
      setCatatan(err.message)
    }
  }

    function bersihForage() {
    clearTimeout(forageTimer.current)
    forageTimer.current = null
    forageRef.current = null
    setForage(null)
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
      setCatatan(`+${h.jumlah} ${h.item}, +${h.xp} XP${h.level_naik > 0 ? '. Naik level! Kamu mendapat 3 poin.' : ''}`)
    } catch (err) {
      if (err.message === 'Belum selesai' && boleh) {
        forageTimer.current = setTimeout(() => selesaiForage(false), 700)
        return
      }
      bersihForage()
      setCatatan(err.message)
    }
  }

  async function mulaiForage(id) {
    if (forageRef.current) return
    try {
      const r = await forageMulai(id)
      const f = { id, nama: r.nama, jenis: r.jenis, mulai: Date.now(), durasi: r.durasi_ms }
      forageRef.current = f
      setForage(f)
      gameRef.current?.registry.set('forage', f)
      forageTimer.current = setTimeout(() => selesaiForage(true), r.durasi_ms + 150)
    } catch (err) {
      setCatatan(err.message)
    }
  }

  function batalForage() {
    if (!forageRef.current) return
    bersihForage()
    forageBatal().catch(() => {
      // abaikan, status di server dibersihkan saat mulai berikutnya
    })
  }

  function aksiPetak(i) {
    const p = status.petak.find((x) => x.indeks === i)
    if (!p) {
      setIndeksPetak(i)
      setPanel('tanam')
      return
    }
    if (Date.parse(p.siap_pada) > Date.now() + selisih) {
      setCatatan('Tanaman belum siap dipanen.')
      return
    }
    jalankan(() => panen(i), 'Panen berhasil! Hasilnya masuk ke inventaris.')
  }

    async function bukaNpc(o) {
    if (o.jenisNpc === 'kelas') {
      setPanel('kelas')
      return
    }
    try {
      setMisi(await ambilMisi())
      setPanel(`misi:${o.npc}`)
    } catch (err) {
      setCatatan(err.message)
    }
  }

  function aksi(o) {
    if (sibuk || panel || !status || status.pemain.mati_sampai) return
    if (o.jenis === 'toko') setPanel('toko')
    else if (o.jenis === 'rumah') setPanel('rumah')
    else if (o.jenis === 'petak') aksiPetak(o.indeks)
    else if (o.jenis === 'forage') mulaiForage(o.id)
    else if (o.jenis === 'npc') bukaNpc(o)
    else if (o.jenis === 'papan') {
      setCatatan(
                'Jir mati awokaowkawok. Klik atau tekan Spasi untuk menebas. Musuh akan mengejar dan membalas, jadi jaga HP-mu. Kalau HP habis, kamu menunggu 5 menit. Tiap naik level kamu mendapat 3 poin untuk Health atau Kecepatan serang. Senjata dan zirah dibeli di Pandai Besi. Tekan Enter untuk mengobrol dengan pemain lain.',
      )
    }
  }

  useEffect(() => {
    aksiRef.current = aksi
    serangRef.current = serangMusuh
    diserangRef.current = diserangMusuh
    batalForageRef.current = batalForage
  })

  if (tahap === 'memuat') return <p className="redup">Memuat game…</p>
  if (tahap === 'gagal') {
    return (
      <>
        <p role="alert">Game gagal dimuat: {kesalahan}</p>
        <Link to="/">Kembali ke beranda</Link>
      </>
    )
  }

  const p = status.pemain
  const waktuServer = sekarang + selisih
  const sejakStatus = Math.max(0, waktuServer - Date.parse(status.waktu_server))
  const hpTampil = p.mati_sampai ? 0 : Math.min(p.hp_maks, p.hp + Math.floor(sejakStatus / 4000))
  const persenHp = Math.round((hpTampil / p.hp_maks) * 100)
  const persenXp = Math.min(100, Math.round((p.xp / p.xp_butuh) * 100))
  const sisaReset = formatSisa(Date.parse(status.harian.reset_pada) - waktuServer)
  const sisaMati = p.mati_sampai ? formatSisa(Date.parse(p.mati_sampai) - waktuServer) : null
  const bos = dunia?.spawn.find((s) => s.jenis === 'bos')
  
    const bosTeks = bos
    ? bos.keadaan === 'hidup'
      ? `${format(bos.hp)} / ${format(bos.hp_maks)} HP · kontribusimu: ${format(dunia.sumbangan_bos ?? 0)}`
      : bos.hidup_lagi_pada
        ? `Dikalahkan. Muncul lagi dalam ${formatSisa(Date.parse(bos.hidup_lagi_pada) - waktuServer)}`
        : 'Dikalahkan'
    : ''

  function tombolArah(arah, simbol) {
    const atur = (nilai) => {
      kontrol.current[arah] = nilai
    }
    return (
      <button
        key={arah}
        type="button"
        className={`dpad-${arah}`}
        aria-label={`Gerak ${arah}`}
        onPointerDown={(e) => {
          e.preventDefault()
          atur(true)
        }}
        onPointerUp={() => atur(false)}
        onPointerLeave={() => atur(false)}
        onPointerCancel={() => atur(false)}
      >
        {simbol}
      </button>
    )
  }

  return (
    <>
      <h1>Citana World</h1>
        <div className="game-area">
        <div className="layout-game">
          <div className="game-bingkai">
            <div ref={wadah} className="game-kanvas" />
            <HudGame
              pemain={p}
              hp={hpTampil}
              persenHp={persenHp}
              persenXp={persenXp}
              harian={status.harian}
              sisaReset={sisaReset}
              peta={peta}
              target={target}
              bos={peta === 'server' ? bos : null}
              bosTeks={bosTeks}
              forage={forage}
              aman={aman}
            />
            {sisaMati && (
              <div className="game-mati" role="alert">
                <strong>Kamu gugur</strong>
                <span>Hidup kembali di desa dalam {sisaMati}</span>
              </div>
            )}
          </div>

          <aside className="layout-chat" aria-label="Chat">
            {peta !== 'server' ? (
              <div className="game-chat">
                <p className="redup kecil">
                  Chat dan pemain lain hanya ada di kerajaan (dunia bersama). Rumah pribadi hanya milikmu.
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
                admin={profil?.peran === 'admin'}
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

        <div className="aksi">
          <button type="button" className="tombol" onClick={() => setPanel('inventaris')}>Inventaris</button>
          <button type="button" className="tombol" onClick={() => setPanel('status')}>
            Status{p.poin_sisa > 0 ? ` (${p.poin_sisa} poin)` : ''}
          </button>
          <span className="redup kecil">Gerak: WASD / panah · Serang: klik atau Spasi · Aksi: E</span>
        </div>

        

        {catatan && <p className="game-catatan" role="status">{catatan}</p>}

        <div className="game-kontrol" aria-label="Kontrol layar sentuh">
          <div className="game-dpad">
            {tombolArah('atas', '▲')}
            {tombolArah('kiri', '◀')}
            {tombolArah('kanan', '▶')}
            {tombolArah('bawah', '▼')}
          </div>
          <div className="game-tombol-kanan">
            <button
              type="button"
              className="game-aksi"
              onPointerDown={(e) => {
                e.preventDefault()
                kontrol.current.serang = true
              }}
            >
              Serang
            </button>
            <button
              type="button"
              className="game-aksi"
              onPointerDown={(e) => {
                e.preventDefault()
                kontrol.current.aksi = true
              }}
            >
              Aksi
            </button>
          </div>
        </div>

        {panel && (
          <div className="game-panel" role="dialog" aria-modal="true">
            {panel === 'inventaris' && (
              <PanelInventaris
                status={status}
                katalog={katalog}
                sibuk={sibuk}
                sekitar={sekitar}
                onPakai={(id) => jalankan(() => pakai(id))}
                onHadiah={(penerima, item, jumlah) =>
                  jalankan(
                    () => kirimHadiah(penerima, item, jumlah),
                    'Hadiah terkirim. Penerima mengambilnya lewat chat pribadi (berlaku 15 menit).',
                  )
                }
              />
            )}

            {panel === 'status' && (
              <PanelStatus
                status={status}
                sibuk={sibuk}
                onTambah={(jenis) => jalankan(() => tambahPoin(jenis, 1))}
              />
            )}

            {panel === 'toko' && (
              <PanelToko
                status={status}
                katalog={katalog}
                dunia={dunia}
                sibuk={sibuk}
                onBeli={(id, n) => jalankan(() => beli(id, n))}
                onJual={(id, n) => jalankan(() => jual(id, n))}
                onPakai={(id) => jalankan(() => pakai(id))}
              />
            )}

            {panel === 'rumah' && (
              <PanelRumah
                status={status}
                sibuk={sibuk}
                onUpgrade={() => jalankan(() => upgradeRumah(), 'Rumah berhasil di-upgrade!')}
              />
            )}

            {panel === 'tanam' && (
              <PanelTanam
                status={status}
                katalog={katalog}
                sibuk={sibuk}
                onTanam={async (id) => {
                  await jalankan(() => tanam(indeksPetak, id), 'Bibit ditanam.')
                  setPanel(null)
                }}
              />
            )}

                        {(panel === 'misi:kapten' || panel === 'misi:herbalis') && (
              <PanelMisi
                npc={panel.slice(5)}
                misi={misi}
                sibuk={sibuk}
                sisaReset={sisaReset}
                onKlaim={(id) =>
                  jalankan(async () => {
                    const h = await klaimMisi(id)
                    setMisi(h.misi)
                    setCatatan(
                      `Misi selesai: ${h.judul}. +${h.xp} XP, +${h.gold} gold${
                        h.level_naik > 0 ? '. Naik level! Kamu mendapat 3 poin.' : ''
                      }`,
                    )
                    return h
                  })
                }
              />
            )}

            {panel === 'kelas' && (
              <PanelKelas
                status={status}
                katalog={katalog}
                sibuk={sibuk}
                onPilih={(id) => jalankan(() => pilihKelas(id), 'Kelas diganti. Senjata disesuaikan dengan kelas barumu.')}
              />
            )}

            <button type="button" className="tombol" onClick={() => setPanel(null)}>Tutup</button>
          </div>
        )}
      </div>
    </>
  )
}

function dipakai(status, item) {
  return status.pemain.senjata?.id === item.id || status.pemain.armor?.id === item.id
}

const KATEGORI_HADIAH = ['bibit', 'panen', 'ramuan', 'senjata', 'armor', 'tumbuhan', 'ore']

function PanelInventaris({ status, katalog, sibuk, sekitar, onPakai, onHadiah }) {
  const [buka, setBuka] = useState(null)
  const [pilihan, setPilihan] = useState('')
  const [jumlah, setJumlah] = useState(1)
  const dekat = sekitar.filter((s) => s.dekat)
  const penerima = dekat.some((s) => s.id === pilihan) ? pilihan : (dekat[0]?.id ?? '')
  const terdekat = sekitar[0]

  async function kirim(i, perlengkapan) {
    const n = perlengkapan ? 1 : Math.min(i.jumlah, Math.max(1, Number(jumlah) || 1))
    await onHadiah(penerima, i.item_id, n)
    setBuka(null)
    setJumlah(1)
  }

  return (
    <>
      <h2>Inventaris</h2>
      {status.inventaris.length === 0 && <p className="redup">Inventaris kosong.</p>}
      <ul className="daftar">
        {status.inventaris.map((i) => {
          const item = katalog.item.find((k) => k.id === i.item_id)
          const bisaPakai = item && ['senjata', 'armor', 'ramuan'].includes(item.kategori)
          const sedangDipakai = item && dipakai(status, item)
          const bisaHadiah = item && KATEGORI_HADIAH.includes(item.kategori) && !sedangDipakai
          const perlengkapan = item && ['senjata', 'armor'].includes(item.kategori)
          return (
            <Fragment key={i.item_id}>
              <li>
                <span>
                  {item?.nama ?? i.item_id} × {i.jumlah}
                  {item?.attack ? <small className="redup"> · +{item.attack} ATK</small> : null}
                  {item?.defense ? <small className="redup"> · +{item.defense} DEF</small> : null}
                </span>
                <span className="aksi">
                  {sedangDipakai ? (
                    <small className="redup">Dipakai</small>
                  ) : (
                    bisaPakai && (
                      <button type="button" className="tombol kecil" disabled={sibuk} onClick={() => onPakai(i.item_id)}>
                        Pakai
                      </button>
                    )
                  )}
                  {bisaHadiah && (
                    <button
                      type="button"
                      className="tombol kecil"
                      disabled={sibuk || dekat.length === 0}
                      title={dekat.length === 0 ? 'Dekati pemain lain dulu' : 'Hadiahkan ke pemain di dekatmu'}
                      onClick={() => setBuka(buka === i.item_id ? null : i.item_id)}
                    >
                      Hadiahkan ke player lain
                    </button>
                  )}
                </span>
              </li>
              {buka === i.item_id && bisaHadiah && (
                <li className="game-bentuk-hadiah">
                  <label>
                    Untuk{' '}
                    <select value={penerima} onChange={(e) => setPilihan(e.target.value)}>
                      {dekat.map((s) => (
                        <option key={s.id} value={s.id}>{s.nama}</option>
                      ))}
                    </select>
                  </label>
                  {!perlengkapan && (
                    <label>
                      Jumlah{' '}
                      <input
                        type="number"
                        min={1}
                        max={i.jumlah}
                        value={jumlah}
                        onChange={(e) => setJumlah(e.target.value)}
                      />
                    </label>
                  )}
                  <button
                    type="button"
                    className="tombol kecil"
                    disabled={sibuk || !penerima}
                    onClick={() => kirim(i, perlengkapan)}
                  >
                    Kirim hadiah
                  </button>
                </li>
              )}
            </Fragment>
          )
        })}
      </ul>
      <p className="redup kecil">
        {dekat.length > 0
          ? `Dalam jangkauan hadiah: ${dekat.map((s) => s.nama).join(', ')}.`
          : `Untuk menghadiahkan item, dekati pemain lain (sekitar 140 px)${
              terdekat ? `. Pemain terdekat: ${terdekat.nama}, ${terdekat.jarak} px ke arah ${terdekat.arah}` : ''
            }.`}
      </p>
    </>
  )
}

function BarisPoin({ nama, nilai, maks, keterangan, bisaTambah, onTambah }) {
  return (
    <div className="baris-poin">
      <div className="baris-poin-kepala">
        <strong>{nama}</strong>
        <span className="redup kecil">{keterangan}</span>
        <button type="button" className="tombol kecil" disabled={!bisaTambah} onClick={onTambah}>+1 poin</button>
      </div>
      <div className="game-xp" role="progressbar" aria-valuemin={0} aria-valuemax={maks} aria-valuenow={nilai}>
        <span style={{ width: `${Math.min(100, (nilai / maks) * 100)}%` }} />
      </div>
    </div>
  )
}

function PanelStatus({ status, sibuk, onTambah }) {
  const p = status.pemain
  return (
    <>
      <h2>Status</h2>
      <p>
        Level {p.level} · Poin tersisa: <strong>{p.poin_sisa}</strong>
        <small className="redup"> (3 poin tiap naik level)</small>
      </p>
      <BarisPoin
        nama="Health"
        nilai={p.poin_hp}
        maks={Math.max(10, p.poin_hp)}
        keterangan={`HP maks ${p.hp_maks} (+10 per poin)`}
        bisaTambah={!sibuk && p.poin_sisa > 0}
        onTambah={() => onTambah('hp')}
      />
      <BarisPoin
        nama="Kecepatan serang"
        nilai={p.poin_speed}
        maks={7}
        keterangan={`Jeda ${p.jeda_serang_ms} ms (maks 7 poin)`}
        bisaTambah={!sibuk && p.poin_sisa > 0 && p.poin_speed < 7}
        onTambah={() => onTambah('speed')}
      />
      <p className="redup kecil">
        Kelas: {p.kelas.nama} (jangkauan {p.kelas.jangkauan} px) · Serangan: {p.attack} ({p.senjata?.nama ?? 'tanpa senjata'}) · Pertahanan:{' '}
        {p.defense} ({p.armor?.nama ?? 'tanpa zirah'}). Attack dan defense bertambah lewat perlengkapan di Pandai Besi. Kelas diganti lewat Guru Elara di desa.
      </p>
    </>
  )
}

function PanelToko({ status, katalog, dunia, sibuk, onBeli, onJual, onPakai }) {
  const [tab, setTab] = useState('senjata')
  const gold = status.pemain.gold
  const level = status.pemain.level
  const milik = (id) => status.inventaris.find((i) => i.item_id === id)?.jumlah ?? 0
  const dijual = (kategori) => katalog.item.filter((i) => kategori.includes(i.kategori) && i.harga_beli !== null)
  const bisaJual = status.inventaris
    .map((i) => ({ ...i, item: katalog.item.find((k) => k.id === i.item_id) }))
    .filter((i) => i.item && i.item.harga_jual !== null && !dipakai(status, i.item))
  const alatUrut = [...(katalog.alat ?? [])].sort((a, b) => a.jenis.localeCompare(b.jenis) || a.tier - b.tier)

  return (
    <>
      <h2>Pandai Besi</h2>
      <p className="redup">Gold: {format(gold)}</p>
      <div className="aksi" role="group" aria-label="Kategori toko">
        {[
          ['senjata', 'Senjata'],
          ['armor', 'Armor'],
          ['alat', 'Alat'],
          ['lain', 'Ramuan & bibit'],
          ['jual', 'Jual'],
        ].map(([kode, nama]) => (
          <button key={kode} type="button" className="tombol" aria-pressed={tab === kode} onClick={() => setTab(kode)}>
            {nama}
          </button>
        ))}
      </div>

      {(tab === 'senjata' || tab === 'armor') && (
        <ul className="daftar">
          {dijual([tab]).filter((i) => !i.kelas || i.kelas === status.pemain.kelas.id).map((i) => (
            <li key={i.id}>
              <span>
                {i.nama}{' '}
                <small className="redup">
                  · {i.attack ? `+${i.attack} ATK` : `+${i.defense} DEF`} · {format(i.harga_beli)} gold
                </small>
              </span>
              {dipakai(status, i) ? (
                <small className="redup">Dipakai</small>
              ) : milik(i.id) > 0 ? (
                <button type="button" className="tombol kecil" disabled={sibuk} onClick={() => onPakai(i.id)}>Pakai</button>
              ) : (
                <button type="button" className="tombol kecil" disabled={sibuk || gold < i.harga_beli} onClick={() => onBeli(i.id, 1)}>
                  Beli
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {tab === 'alat' && (
        <>
          <p className="redup kecil">
            Alat dibeli berurutan dan mempercepat pengumpulan. Beliung juga menentukan bijih yang bisa ditambang:
            bijih hanya bisa ditambang kalau beliungmu minimal satu tier di bawahnya.
          </p>
          <ul className="daftar">
            {alatUrut.map((a) => {
              const item = katalog.item.find((k) => k.id === a.item_id)
              if (!item) return null
              const punya = milik(a.item_id) > 0
              const sebelumnya = alatUrut.find((x) => x.jenis === a.jenis && x.tier === a.tier - 1)
              const namaSebelumnya = sebelumnya && katalog.item.find((k) => k.id === sebelumnya.item_id)?.nama
              const punyaSebelumnya = !sebelumnya || milik(sebelumnya.item_id) > 0
              const stat = a.jenis === 'beliung' ? (dunia?.forage?.tambang ?? 0) : (dunia?.forage?.tumbuhan ?? 0)
              const okLevel = level >= a.syarat_level
              const okJumlah = stat >= a.syarat_jumlah
              const bisa = !punya && punyaSebelumnya && okLevel && okJumlah && gold >= item.harga_beli
              const membuka =
                a.jenis === 'beliung' ? (a.tier < 6 ? `membuka bijih ${NAMA_TIER[a.tier + 1]}` : 'tier tertinggi') : null
              return (
                <li key={a.item_id}>
                  <span>
                    {item.nama}{' '}
                    <small className="redup">
                      · {a.kecepatan_persen}% lebih cepat{membuka ? ` · ${membuka}` : ''} · {format(item.harga_beli)} gold
                    </small>
                    {!punya && (
                      <>
                        <br />
                        <small className="redup">
                          {okLevel ? '✓' : '✗'} Level {a.syarat_level}
                          {namaSebelumnya && <> · {punyaSebelumnya ? '✓' : '✗'} {namaSebelumnya}</>}
                          {a.syarat_jumlah > 0 && (
                            <>
                              {' '}· {okJumlah ? '✓' : '✗'} {a.jenis === 'beliung' ? 'Menambang' : 'Mengumpulkan'}{' '}
                              {Math.min(stat, a.syarat_jumlah)}/{a.syarat_jumlah}
                            </>
                          )}
                        </small>
                      </>
                    )}
                  </span>
                  {punya ? (
                    <small className="redup">Dimiliki</small>
                  ) : (
                    <button type="button" className="tombol kecil" disabled={sibuk || !bisa} onClick={() => onBeli(a.item_id, 1)}>
                      Beli
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        </>
      )}

      {tab === 'lain' && (
        <ul className="daftar">
          {dijual(['ramuan', 'bibit']).map((i) => (
            <li key={i.id}>
              <span>
                {i.nama} <small className="redup">· {i.harga_beli} gold{i.pulih ? ` · +${i.pulih} HP` : ''}</small>
              </span>
              <span className="aksi">
                <button type="button" className="tombol kecil" disabled={sibuk} onClick={() => onBeli(i.id, 1)}>Beli 1</button>
                <button type="button" className="tombol kecil" disabled={sibuk} onClick={() => onBeli(i.id, 5)}>Beli 5</button>
              </span>
            </li>
          ))}
        </ul>
      )}

      {tab === 'jual' && (
        <>
          <p className="redup kecil">Hasil foraging (tumbuhan dan bijih) dijual di sini.</p>
          {bisaJual.length === 0 && <p className="redup">Tidak ada yang bisa dijual.</p>}
          <ul className="daftar">
            {bisaJual.map((i) => (
              <li key={i.item_id}>
                <span>
                  {i.item.nama} × {i.jumlah} <small className="redup">· {i.item.harga_jual} gold/buah</small>
                </span>
                <span className="aksi">
                  <button type="button" className="tombol kecil" disabled={sibuk} onClick={() => onJual(i.item_id, 1)}>Jual 1</button>
                  {i.jumlah > 1 && (
                    <button type="button" className="tombol kecil" disabled={sibuk} onClick={() => onJual(i.item_id, i.jumlah)}>Jual semua</button>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  )
}

function PanelRumah({ status, sibuk, onUpgrade }) {
  const { rumah, pemain } = status
  return (
    <>
      <h2>Rumahku</h2>
      <p>Level {rumah.level} · {rumah.jumlah_petak} petak kebun</p>
      {rumah.berikutnya ? (
        <>
          <p className="redup">
            Level {rumah.berikutnya.level}: {rumah.berikutnya.jumlah_petak} petak, biaya {format(rumah.berikutnya.biaya_gold)} gold.
          </p>
          <button
            type="button"
            className="tombol utama"
            disabled={sibuk || pemain.gold < rumah.berikutnya.biaya_gold}
            onClick={onUpgrade}
          >
            Upgrade rumah
          </button>
        </>
      ) : (
        <p className="redup">Rumahmu sudah di level maksimum.</p>
      )}
    </>
  )
}

function PanelTanam({ status, katalog, sibuk, onTanam }) {
  const milik = (id) => status.inventaris.find((i) => i.item_id === id)?.jumlah ?? 0
  return (
    <>
      <h2>Pilih tanaman</h2>
      <ul className="daftar">
        {katalog.tanaman.map((t) => (
          <li key={t.id}>
            <span>
              {t.nama}{' '}
              <small className="redup">
                · tumbuh {formatDurasi(t.durasi_detik)} · hasil {t.hasil_jumlah} · bibit: {milik(t.bibit_item)}
              </small>
            </span>
            <button
              type="button"
              className="tombol kecil"
              disabled={sibuk || milik(t.bibit_item) < 1}
              onClick={() => onTanam(t.id)}
            >
              Tanam
            </button>
          </li>
        ))}
      </ul>
      <p className="redup kecil">Bibit dijual di Pandai Besi, di kerajaan (dunia bersama).</p>
    </>
  )
}
const NAMA_NPC = { kapten: 'Kapten Rowan', herbalis: 'Herbalis Mira' }
const SAPAAN = {
  kapten: 'Perbatasan butuh tangan yang cekatan. Selesaikan tugas hari ini dan ambil upahmu.',
  herbalis: 'Hutan dan tambang penuh bahan berharga. Bantu aku mengumpulkannya.',
}

function PanelMisi({ npc, misi, sibuk, sisaReset, onKlaim }) {
  const daftar = misi?.quest.filter((m) => m.npc === npc) ?? []
  return (
    <>
      <h2>{NAMA_NPC[npc]}</h2>
      <p className="redup">{SAPAAN[npc]}</p>
      {daftar.length === 0 && <p className="redup">Belum ada misi untukmu hari ini.</p>}
      <ul className="daftar">
        {daftar.map((m) => {
          const selesai = m.progres >= m.jumlah
          return (
            <li key={m.id}>
              <span>
                <strong>{m.judul}</strong>
                <br />
                <progress className="progres-misi" max={m.jumlah} value={m.progres} />{' '}
                <small>{m.progres}/{m.jumlah}</small>
                <br />
                <small className="redup">Hadiah: +{m.xp} XP · +{m.gold} gold</small>
              </span>
              {m.status === 'diambil' ? (
                <small className="redup">Selesai ✓</small>
              ) : (
                <button type="button" className="tombol kecil" disabled={sibuk || !selesai} onClick={() => onKlaim(m.id)}>
                  {selesai ? 'Ambil hadiah' : 'Belum selesai'}
                </button>
              )}
            </li>
          )
        })}
      </ul>
      <p className="redup kecil">Misi baru muncul dalam {sisaReset}.</p>
    </>
  )
}

function PanelKelas({ status, katalog, sibuk, onPilih }) {
  const kini = status.pemain.kelas
  const biaya = kini.ganti_gratis ? 0 : kini.biaya_ganti
  return (
    <>
      <h2>Guru Elara</h2>
      <p className="redup">
        Pilih jalanmu. {kini.ganti_gratis ? 'Pergantian pertamamu gratis.' : `Mengganti kelas butuh ${format(kini.biaya_ganti)} gold.`}{' '}
        Senjata otomatis disesuaikan dengan kelasmu.
      </p>
      <ul className="daftar">
        {katalog.kelas.map((c) => (
          <li key={c.id}>
            <span>
              <strong>{c.nama}</strong>
              {kini.id === c.id && <small className="redup"> · kelasmu</small>}
              <br />
              <small className="redup">{c.deskripsi}</small>
              <br />
              <small className="redup">
                Jangkauan {c.jangkauan} px · Damage {c.damage_persen}% · Jeda +{c.jeda_tambah_ms} ms · Damage diterima{' '}
                {c.diterima_persen}% · DEF +{c.def_bonus}
              </small>
            </span>
            {kini.id !== c.id && (
              <button type="button" className="tombol kecil" disabled={sibuk || status.pemain.gold < biaya} onClick={() => onPilih(c.id)}>
                {biaya > 0 ? `Pilih (${format(biaya)} gold)` : 'Pilih (gratis)'}
              </button>
            )}
          </li>
        ))}
      </ul>
    </>
  )
}