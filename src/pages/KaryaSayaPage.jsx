import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAmbil } from '../lib/useAmbil'
import { useSesi } from '../lib/useSesi'
import { ambilSeniRupaSaya, hapusSeniRupa } from '../lib/seniRupa'

export default function KaryaSayaPage() {
  const sesi = useSesi()
  if (!sesi) return <p className="redup">Memuat…</p>
  return <DaftarSaya userId={sesi.user.id} />
}

function DaftarSaya({ userId }) {
  const [versi, setVersi] = useState(0)
  const [pesan, setPesan] = useState('')
  const { data, memuat, error } = useAmbil(() => ambilSeniRupaSaya(userId), [userId, versi])

  async function hapus(karya) {
    if (!window.confirm(`Hapus “${karya.nama}”? Tindakan ini tidak bisa dibatalkan.`)) return
    try {
      await hapusSeniRupa(karya)
      setPesan('')
      setVersi((v) => v + 1)
    } catch (err) {
      setPesan(`Gagal menghapus: ${err.message}`)
    }
  }

  return (
    <>
      <h1>Karya saya</h1>
      <div className="aksi">
        <Link to="/seni-rupa/baru" className="tombol utama">Buat karya</Link>
        <Link to="/seni-rupa">Kembali ke galeri</Link>
      </div>
      {pesan && <p className="redup">{pesan}</p>}

      {memuat && <p className="redup">Memuat…</p>}
      {error && <p>Gagal memuat: {error.message}</p>}
      {data && data.length === 0 && <p className="redup">Kamu belum punya karya.</p>}

      {data && (
        <ul className="daftar">
          {data.map((karya) => (
            <li key={karya.id}>
              <span>
                <Link to={`/seni-rupa/${karya.id}`}>{karya.nama}</Link>
                <small className="redup"> · {karya.kategori}</small>
              </span>
              <span className="aksi">
                <Link to={`/seni-rupa/${karya.id}/edit`}>Edit</Link>
                <button type="button" className="tombol" onClick={() => hapus(karya)}>Hapus</button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}