import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAmbil } from '../../lib/useAmbil'
import { ambilSeniRupa, hapusSeniRupa } from '../../lib/seniRupa'

export default function AdminSeniRupaPage() {
  const [versi, setVersi] = useState(0)
  const [pesan, setPesan] = useState('')
  const { data, memuat, error } = useAmbil(ambilSeniRupa, [versi])

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
      <h1>Kelola seni rupa</h1>
      <div className="aksi">
        <Link to="/admin/seni-rupa/baru" className="tombol utama">Tambah karya</Link>
        <Link to="/admin">Kembali</Link>
      </div>
      {pesan && <p className="redup">{pesan}</p>}

      {memuat && <p className="redup">Memuat…</p>}
      {error && <p>Gagal memuat: {error.message}</p>}
      {data && data.length === 0 && <p className="redup">Belum ada karya.</p>}

      {data && (
        <ul className="daftar">
          {data.map((karya) => (
            <li key={karya.id}>
              <span>
                {karya.nama}
                <small className="redup"> · {karya.kategori} · oleh {karya.pembuat_nama}</small>
              </span>
              <span className="aksi">
                <Link to={`/admin/seni-rupa/${karya.id}`}>Edit</Link>
                <button type="button" className="tombol" onClick={() => hapus(karya)}>Hapus</button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}