import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

function warnaNama(id) {
  let h = 0
  for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return `hsl(${h % 360} 60% 50%)`
}

const namaItem = (katalog, id) => katalog?.item.find((i) => i.id === id)?.nama ?? id

const STATUS_HADIAH = {
  diambil: 'sudah diambil',
  ditolak: 'ditolak, item kembali ke pengirim',
  dibatalkan: 'dibatalkan, item kembali ke pengirim',
  kedaluwarsa: 'kedaluwarsa, item kembali ke pengirim',
}

function KartuHadiah({ m, h, saya, katalog, sekarang, onAksi }) {
  const dariSaya = m.penulis_id === saya
  const rincian = h ? `${h.jumlah}× ${namaItem(katalog, h.item_id)}` : m.isi
  const habis = h?.status === 'menunggu' && Date.parse(h.kadaluarsa_pada) <= sekarang
  const status = habis ? 'kedaluwarsa' : (h?.status ?? 'menunggu')

  return (
    <div className="game-kartu-hadiah">
      <span>
        {dariSaya ? (
          <>Hadiah untuk <strong>{m.penerima_nama}</strong></>
        ) : (
          <><strong>{m.penulis_nama}</strong> mengirim hadiah</>
        )}
        : {rincian}
      </span>
      {status === 'menunggu' && !dariSaya && (
        <>
          <span className="aksi">
            <button type="button" className="tombol kecil" onClick={() => onAksi(m.hadiah_id, 'ambil')}>Ambil</button>
            <button type="button" className="tombol kecil" onClick={() => onAksi(m.hadiah_id, 'tolak')}>Tolak</button>
          </span>
          <small className="redup">atau ketik /ambil {m.hadiah_id} · /tolak {m.hadiah_id}</small>
        </>
      )}
      {status === 'menunggu' && dariSaya && (
        <span className="aksi">
          <button type="button" className="tombol kecil" onClick={() => onAksi(m.hadiah_id, 'batal')}>Batalkan</button>
          <small className="redup">menunggu diambil (berlaku 15 menit)</small>
        </span>
      )}
      {status !== 'menunggu' && <small className="redup">Status: {STATUS_HADIAH[status] ?? status}</small>}
    </div>
  )
}

export default function PanelChat({
  info, pesan, hadiah, kesalahan, userId, katalog, sekitar,
  admin, onKirim, onAksiHadiah, onHapus, onBisu,
}) {
  const [tab, setTab] = useState('umum')
  const [dibaca, setDibaca] = useState(0)
  const [teks, setTeks] = useState('')
  const [galat, setGalat] = useState('')
  const [mengirim, setMengirim] = useState(false)
  const [sekarang, setSekarang] = useState(() => Date.now())
  const daftar = useRef(null)
  const kolom = useRef(null)

  const umum = pesan.filter((m) => !m.penerima_id)
  const pribadi = pesan.filter((m) => m.penerima_id)
  const tampil = tab === 'umum' ? umum : pribadi
  const idPribadiTerbaru = pribadi.length > 0 ? pribadi[pribadi.length - 1].id : 0
  const baru =
    tab === 'pribadi' ? 0 : pribadi.filter((m) => m.penulis_id !== userId && m.id > dibaca).length

  useEffect(() => {
    const t = setInterval(() => setSekarang(Date.now()), 30000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const el = daftar.current
    if (el) el.scrollTop = el.scrollHeight
  }, [tampil.length, tab])

  useEffect(() => {
    function tekanEnter(e) {
      if (e.key !== 'Enter') return
      const tag = document.activeElement?.tagName
      if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(tag)) return
      kolom.current?.focus()
    }
    window.addEventListener('keydown', tekanEnter)
    return () => window.removeEventListener('keydown', tekanEnter)
  }, [])

  function ganti(tujuan) {
    if (tab === 'pribadi' && tujuan !== 'pribadi') setDibaca(idPribadiTerbaru)
    setTab(tujuan)
  }

  function balas(nama) {
    if (!nama) return
    setTeks(`@${nama} `)
    kolom.current?.focus()
  }

  async function kirim(e) {
    e.preventDefault()
    const isi = teks.trim()
    if (!isi) {
      kolom.current?.blur() // Enter pada kolom kosong: kembali bermain
      return
    }
    if (mengirim) return
    setMengirim(true)
    const g = await onKirim(isi)
    setMengirim(false)
    if (g) {
      setGalat(g)
    } else {
      setGalat('')
      setTeks('')
      kolom.current?.blur() // pesan terkirim: kendali kembali ke permainan
    }
  }

  async function aksiHadiah(id, aksi) {
    const g = await onAksiHadiah(id, aksi)
    setGalat(g ?? '')
  }

  return (
    <section className="game-chat" aria-label="Chat global">
      <header className="game-chat-kepala">
        <strong>Chat global</strong>
        <small className="redup">{info}</small>
      </header>

      <div className="game-chat-tab" role="group" aria-label="Jenis chat">
        <button type="button" aria-pressed={tab === 'umum'} onClick={() => ganti('umum')}>Umum</button>
        <button type="button" aria-pressed={tab === 'pribadi'} onClick={() => ganti('pribadi')}>
          Pribadi{baru > 0 && <span className="game-lencana">{baru}</span>}
        </button>
      </div>

      {sekitar.length > 0 && (
        <div className="game-sekitar" aria-label="Pemain di sekitar">
          {sekitar.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`game-chip${s.dekat ? ' dekat' : ''}`}
              title="Klik untuk membisik"
              onClick={() => balas(s.nama)}
            >
              {s.nama}{' '}
              <small className="redup">
                {s.dekat ? 'dekat' : s.terlihat ? `${s.jarak} px` : `di luar layar · ${s.arah}`}
              </small>
            </button>
          ))}
        </div>
      )}

      <ul className="game-chat-daftar" ref={daftar} aria-live="polite">
        {tampil.length === 0 && (
          <li className="redup kecil">
            {tab === 'umum' ? 'Belum ada pesan.' : 'Belum ada pesan pribadi atau hadiah.'}
          </li>
        )}
        {tampil.map((m) => {
          if (m.jenis === 'sistem' && m.penulis_id === userId) return null
          if (m.jenis === 'hadiah') {
            return (
              <li key={m.id}>
                <KartuHadiah
                  m={m}
                  h={hadiah[m.hadiah_id]}
                  saya={userId}
                  katalog={katalog}
                  sekarang={sekarang}
                  onAksi={aksiHadiah}
                />
              </li>
            )
          }
          if (m.jenis === 'sistem') {
            return <li key={m.id} className="game-sistem">{m.penulis_nama} {m.isi}</li>
          }
          const lawan = m.penulis_id === userId ? m.penerima_nama : m.penulis_nama
          return (
            <li key={m.id} className={m.penerima_id ? 'game-bisik' : undefined}>
              {m.penerima_id && (
                <small>{m.penulis_id === userId ? `bisik ke ${m.penerima_nama}` : 'bisik'} · </small>
              )}
              <button
                type="button"
                className="game-chat-nama"
                style={{ color: warnaNama(m.penulis_id) }}
                onClick={() => balas(lawan)}
              >
                {m.penulis_nama}
              </button>{' '}
              {m.isi}
              {admin && !m.penerima_id && (
                <span className="game-chat-admin">
                  <button type="button" className="tautan-tombol" onClick={() => onHapus(m.id)}>Hapus</button>
                  <button type="button" className="tautan-tombol" onClick={() => onBisu(m.penulis_id)}>Bisukan 60 mnt</button>
                </span>
              )}
            </li>
          )
        })}
      </ul>

      {(galat || kesalahan) && <p className="redup kecil" role="alert">{galat || kesalahan}</p>}

      <form className="game-chat-form" onSubmit={kirim}>
        <input
          ref={kolom}
          type="text"
          maxLength={300}
          value={teks}
          placeholder={tab === 'pribadi' ? '@nama pesan · /ambil 12' : 'Enter: ketik · @nama untuk bisik'}
          aria-label="Tulis pesan chat"
          onChange={(e) => setTeks(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') e.currentTarget.blur()
          }}
        />
        <button type="submit" className="tombol kecil" disabled={mengirim}>Kirim</button>
      </form>
      <small className="redup game-chat-kaki">
        <code>@nama pesan</code> membisik · <code>/ambil 12</code> atau <code>/tolak 12</code> memproses hadiah.{' '}
        <Link to="/lapor">Lapor pelanggaran</Link>
      </small>
    </section>
  )
}