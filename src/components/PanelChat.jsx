import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

export default function PanelChat({ pesan, kesalahan, onKirim, admin, onHapus, onBisu }) {
  const [teks, setTeks] = useState('')
  const [galat, setGalat] = useState('')
  const [mengirim, setMengirim] = useState(false)
  const daftar = useRef(null)
  const kolom = useRef(null)

  useEffect(() => {
    const el = daftar.current
    if (el) el.scrollTop = el.scrollHeight
  }, [pesan.length])

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

  async function kirim(e) {
    e.preventDefault()
    const isi = teks.trim()
    if (!isi || mengirim) return
    setMengirim(true)
    const g = await onKirim(isi)
    setMengirim(false)
    if (g) {
      setGalat(g)
    } else {
      setGalat('')
      setTeks('')
    }
  }

  return (
    <section className="game-chat" aria-label="Chat global">
      <ul className="game-chat-daftar" ref={daftar} aria-live="polite">
        {pesan.length === 0 && <li className="redup kecil">Belum ada pesan.</li>}
        {pesan.map((m) => (
          <li key={m.id}>
            <strong>{m.penulis_nama}</strong>: {m.isi}
            {admin && (
              <span className="game-chat-admin">
                <button type="button" className="tautan-tombol" onClick={() => onHapus(m.id)}>Hapus</button>
                <button type="button" className="tautan-tombol" onClick={() => onBisu(m.penulis_id)}>Bisukan 60 mnt</button>
              </span>
            )}
          </li>
        ))}
      </ul>
      <form className="game-chat-form" onSubmit={kirim}>
        <input
          ref={kolom}
          type="text"
          maxLength={300}
          value={teks}
          placeholder="Tulis pesan (Enter untuk mengetik)"
          aria-label="Tulis pesan chat"
          onChange={(e) => setTeks(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') e.currentTarget.blur()
          }}
        />
        <button type="submit" className="tombol kecil" disabled={mengirim}>Kirim</button>
      </form>
      {(galat || kesalahan) && <p className="redup kecil" role="alert">{galat || kesalahan}</p>}
      <small className="redup">
        Tautan dan konten terlarang ditolak otomatis. <Link to="/lapor">Lapor pelanggaran</Link>
      </small>
    </section>
  )
}