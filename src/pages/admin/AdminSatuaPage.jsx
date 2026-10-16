import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAmbil } from '../../lib/useAmbil'
import { ambilSemuaUntukAdmin, formatTanggal, hapusSatua } from '../../lib/satua'

export default function AdminSatuaPage() {
  const [versi, setVersi] = useState(0)
  const [pesan, setPesan] = useState('')
  const { data, memuat, error } = useAmbil(ambilSemuaUntukAdmin, [versi])
  const navigate = useNavigate()

  async function hapus(s) {
    if (!window.confirm(`Hapus “${s.judul}”? Tindakan ini tidak bisa dibatalkan.`)) return
    try {
      await hapusSatua(s.id)
      setVersi((v) => v + 1)
    } catch (err) {
      setPesan(`Gagal menghapus: ${err.message}`)
    }
  }

  async function keluar() {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <>
      <h1>Kelola satua</h1>
      <div className="aksi">
        <Link to="/admin/satua/baru" className="tombol utama">Tulis baru</Link>
        <button type="button" className="tombol" onClick={keluar}>Keluar</button>
      </div>
      {pesan && <p className="redup">{pesan}</p>}

      {memuat && <p className="redup">Memuat…</p>}
      {error && <p>Gagal memuat: {error.message}</p>}
      {data && data.length === 0 && <p className="redup">Belum ada cerita.</p>}

      {data && (
        <ul className="daftar">
          {data.map((s) => (
            <li key={s.id}>
              <span>
                {s.judul}
                <small className="redup"> · {s.terbit ? 'Terbit' : 'Draf'} · {formatTanggal(s.diperbarui_pada)}</small>
              </span>
              <span className="aksi">
                <Link to={`/admin/satua/${s.id}`}>Edit</Link>
                <button type="button" className="tombol" onClick={() => hapus(s)}>Hapus</button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}