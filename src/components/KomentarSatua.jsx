import { useState } from 'react'
import { Link } from 'react-router-dom'
import Avatar from './Avatar'
import { ambilAvatar, formatWaktu } from '../lib/forum'
import { ambilKomentar, hapusKomentar, kirimKomentar } from '../lib/personal'
import { useAmbil } from '../lib/useAmbil'

export default function KomentarSatua({ jenis, id, userId, pemilikId, admin }) {
  const [versi, setVersi] = useState(0)
  const [teks, setTeks] = useState('')
  const [status, setStatus] = useState('')
  const [mengirim, setMengirim] = useState(false)

  const { data, memuat, error } = useAmbil(
    async () => {
      const komentar = await ambilKomentar(jenis, id)
      const avatar = await ambilAvatar(komentar.map((k) => k.penulis_id))
      return { komentar, avatar }
    },
    [jenis, id, versi],
  )

  async function kirim(e) {
    e.preventDefault()
    const isi = teks.trim()
    if (!isi) {
      setStatus('Komentar tidak boleh kosong.')
      return
    }
    setMengirim(true)
    setStatus('')
    try {
      await kirimKomentar(jenis, id, isi)
      setTeks('')
      setVersi((v) => v + 1)
    } catch (err) {
      setStatus(`Gagal mengirim: ${err.message}`)
    }
    setMengirim(false)
  }

  async function hapus(k) {
    if (!window.confirm('Hapus komentar ini?')) return
    try {
      await hapusKomentar(jenis, k.id)
      setStatus('')
      setVersi((v) => v + 1)
    } catch (err) {
      setStatus(`Gagal menghapus: ${err.message}`)
    }
  }

  return (
    <section className="komentar">
      <h2>{data ? data.komentar.length : 0} komentar</h2>

      {userId ? (
        <form className="form" onSubmit={kirim}>
          <textarea
            rows={3}
            maxLength={1000}
            value={teks}
            placeholder="Tulis komentar"
            aria-label="Tulis komentar"
            onChange={(e) => setTeks(e.target.value)}
          />
          <div className="aksi">
            <button type="submit" className="tombol utama" disabled={mengirim}>
              {mengirim ? 'Mengirim…' : 'Kirim'}
            </button>
            <span className="redup">{teks.length}/1000</span>
            {status && <span className="redup">{status}</span>}
          </div>
        </form>
      ) : (
        <p className="redup">
          <Link to="/masuk">Masuk</Link> atau <Link to="/daftar">daftar</Link> untuk berkomentar dan memberi upvote.
        </p>
      )}

      {memuat && <p className="redup">Memuat…</p>}
      {error && <p>Gagal memuat komentar.</p>}
      {data?.komentar.map((k) => (
        <article key={k.id} className="komentar-item">
          <Avatar profil={{ username: k.penulis_nama, avatar_url: data.avatar[k.penulis_id] }} ukuran={28} />
          <div className="komentar-isi">
            <p className="forum-kepala">
              <strong>{k.penulis_nama}</strong>
              <time dateTime={k.dibuat_pada}>{formatWaktu(k.dibuat_pada)}</time>
            </p>
            <p>{k.isi}</p>
            {(userId === k.penulis_id || userId === pemilikId || admin) && (
              <button type="button" className="tautan-tombol" onClick={() => hapus(k)}>Hapus</button>
            )}
          </div>
        </article>
      ))}
    </section>
  )
}