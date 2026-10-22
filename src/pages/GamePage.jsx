import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ambilKatalog, beli, jual, lawan, masukGame, panen, tanam, upgradeRumah } from '../lib/gameAPI'

const format = (n) => n.toLocaleString('id-ID')
const namaItem = (katalog, id) => katalog.item.find((i) => i.id === id)?.nama ?? id

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

function ringkasHasil(h) {
  if (!h.menang) return `Kamu kalah dari ${h.musuh}. Coba lagi setelah naik level.`
  if (!h.berhadiah) return `Menang atas ${h.musuh}, tapi jatah hadiah hari ini sudah habis.`
  return `Menang atas ${h.musuh}: +${h.xp} XP, +${h.gold} gold.${h.level_naik > 0 ? ' Naik level!' : ''}`
}

export default function GamePage() {
  const [tahap, setTahap] = useState('memuat') // memuat | siap | gagal
  const [kesalahan, setKesalahan] = useState('')
  const [status, setStatus] = useState(null)
  const [selisih, setSelisih] = useState(0)
  const [katalog, setKatalog] = useState(null)
  const [peta, setPeta] = useState('server')
  const [panel, setPanel] = useState(null) // inventaris | toko | rumah | tanam
  const [indeksPetak, setIndeksPetak] = useState(null)
  const [sibuk, setSibuk] = useState(false)
  const [catatan, setCatatan] = useState('')
  const [sekarang, setSekarang] = useState(() => Date.now())

  const wadah = useRef(null)
  const gameRef = useRef(null)
  const kontrol = useRef({ kiri: false, kanan: false, atas: false, bawah: false, aksi: false })
  const statusRef = useRef(null)
  const aksiRef = useRef(null)

  function terapkan(st) {
    setStatus(st)
    setSelisih(Date.parse(st.waktu_server) - Date.now())
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

  // Jam untuk hitung mundur HUD
  useEffect(() => {
    const t = setInterval(() => setSekarang(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  // Pesan sementara hilang sendiri
  useEffect(() => {
    if (!catatan) return
    const t = setTimeout(() => setCatatan(''), 6000)
    return () => clearTimeout(t)
  }, [catatan])

  // Cegah halaman bergulir oleh tombol panah saat bermain
  useEffect(() => {
    function cegah(e) {
      const tag = document.activeElement?.tagName
      if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(tag)) return
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault()
    }
    window.addEventListener('keydown', cegah)
    return () => window.removeEventListener('keydown', cegah)
  }, [])

  // Jalankan Phaser (dimuat malas)
  useEffect(() => {
    if (tahap !== 'siap' || !wadah.current) return
    let batal = false
    let game = null
    import('../game/mulaiGame').then(({ buatGame }) => {
      if (batal || !wadah.current) return
      game = buatGame(wadah.current, { kontrol: kontrol.current, status: statusRef.current })
      gameRef.current = game
      game.events.on('interaksi', (o) => aksiRef.current?.(o))
      game.events.on('peta', (nama) => setPeta(nama))
    })
    return () => {
      batal = true
      game?.destroy(true)
      gameRef.current = null
    }
  }, [tahap])

  // Kirim status terbaru ke game
  useEffect(() => {
    const game = gameRef.current
    if (!game || !status) return
    game.registry.set('selisihWaktu', selisih)
    game.registry.set('status', status)
  }, [status, selisih])

  // Kunci gerakan saat panel terbuka atau ada proses berjalan
  useEffect(() => {
    gameRef.current?.registry.set('terkunci', Boolean(panel) || sibuk)
  }, [panel, sibuk])

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

  async function lawanMusuh(o) {
    setSibuk(true)
    try {
      const { hasil, status: st } = await lawan(o.id)
      const scene = gameRef.current?.scene.getScene('dunia')
      await scene?.mainkanPertarungan(o.id, hasil.ronde, hasil.menang)
      terapkan(st)
      setCatatan(ringkasHasil(hasil))
    } catch (err) {
      setCatatan(err.message)
    } finally {
      setSibuk(false)
    }
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

  function aksi(o) {
    if (sibuk || panel || !status) return
    if (o.jenis === 'toko') setPanel('toko')
    else if (o.jenis === 'rumah') setPanel('rumah')
    else if (o.jenis === 'petak') aksiPetak(o.indeks)
    else if (o.jenis === 'musuh') lawanMusuh(o)
    else if (o.jenis === 'papan') {
      setCatatan(
        `Lawan monster di arena (${status.harian.batas} kemenangan berhadiah per hari), jual hasil panen di toko, dan kembangkan rumahmu.`,
      )
    }
  }

  useEffect(() => {
    aksiRef.current = aksi
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

  const sisaHadiah = Math.max(0, status.harian.batas - status.harian.berhadiah)
  const persenXp = Math.min(100, Math.round((status.pemain.xp / status.pemain.xp_butuh) * 100))
  const sisaReset = formatSisa(Date.parse(status.harian.reset_pada) - (sekarang + selisih))

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
      <h1>Game</h1>
      <div className="game-area">
        <div className="game-hud">
          <div>
            <strong>{status.pemain.nama}</strong> · Lv {status.pemain.level}
            <div className="game-xp" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={persenXp}>
              <span style={{ width: `${persenXp}%` }} />
            </div>
            <small className="redup">{status.pemain.xp}/{status.pemain.xp_butuh} XP</small>
          </div>
          <div className="game-hud-kanan">
            <span>Gold: {format(status.pemain.gold)}</span>
            <span>Hadiah hari ini: {sisaHadiah}/{status.harian.batas}</span>
            <small className="redup">Reset {sisaReset} · {peta === 'server' ? 'Dunia bersama' : 'Rumah pribadi'}</small>
          </div>
        </div>

        <div ref={wadah} className="game-kanvas" />

        <div className="aksi">
          <button type="button" className="tombol" onClick={() => setPanel('inventaris')}>Inventaris</button>
          <span className="redup kecil">Gerak: panah atau WASD · Aksi: E</span>
        </div>

        {catatan && <p className="game-catatan" role="status">{catatan}</p>}

        <div className="game-kontrol" aria-label="Kontrol layar sentuh">
          <div className="game-dpad">
            {tombolArah('atas', '▲')}
            {tombolArah('kiri', '◀')}
            {tombolArah('kanan', '▶')}
            {tombolArah('bawah', '▼')}
          </div>
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

        {panel && (
          <div className="game-panel" role="dialog" aria-modal="true">
            {panel === 'inventaris' && <PanelInventaris status={status} katalog={katalog} />}

            {panel === 'toko' && (
              <PanelToko
                status={status}
                katalog={katalog}
                sibuk={sibuk}
                onBeli={(id, n) => jalankan(() => beli(id, n))}
                onJual={(id, n) => jalankan(() => jual(id, n))}
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

            <button type="button" className="tombol" onClick={() => setPanel(null)}>Tutup</button>
          </div>
        )}
      </div>
    </>
  )
}

function PanelInventaris({ status, katalog }) {
  return (
    <>
      <h2>Inventaris</h2>
      {status.inventaris.length === 0 && <p className="redup">Inventaris kosong.</p>}
      <ul className="daftar">
        {status.inventaris.map((i) => (
          <li key={i.item_id}>
            <span>{namaItem(katalog, i.item_id)}</span>
            <span>× {i.jumlah}</span>
          </li>
        ))}
      </ul>
    </>
  )
}

function PanelToko({ status, katalog, sibuk, onBeli, onJual }) {
  const [tab, setTab] = useState('beli')
  const dijual = katalog.item.filter((i) => i.harga_beli !== null)
  const bisaJual = status.inventaris
    .map((i) => ({ ...i, item: katalog.item.find((k) => k.id === i.item_id) }))
    .filter((i) => i.item && i.item.harga_jual !== null)

  return (
    <>
      <h2>Toko</h2>
      <p className="redup">Gold: {format(status.pemain.gold)}</p>
      <div className="aksi" role="group" aria-label="Mode toko">
        <button type="button" className="tombol" aria-pressed={tab === 'beli'} onClick={() => setTab('beli')}>Beli</button>
        <button type="button" className="tombol" aria-pressed={tab === 'jual'} onClick={() => setTab('jual')}>Jual</button>
      </div>

      {tab === 'beli' && (
        <ul className="daftar">
          {dijual.map((i) => (
            <li key={i.id}>
              <span>
                {i.nama} <small className="redup">· {i.harga_beli} gold</small>
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
          {bisaJual.length === 0 && <p className="redup">Tidak ada yang bisa dijual.</p>}
          <ul className="daftar">
            {bisaJual.map((i) => (
              <li key={i.item_id}>
                <span>
                  {i.item.nama} × {i.jumlah} <small className="redup">· {i.item.harga_jual} gold/buah</small>
                </span>
                <span className="aksi">
                  <button type="button" className="tombol kecil" disabled={sibuk} onClick={() => onJual(i.item_id, 1)}>Jual 1</button>
                  <button type="button" className="tombol kecil" disabled={sibuk} onClick={() => onJual(i.item_id, i.jumlah)}>Jual semua</button>
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
      <p className="redup kecil">Bibit bisa dibeli di toko, di dunia bersama.</p>
    </>
  )
}